import type { IMediaStreamRenderer, SignalingSocketEvents } from '@rocket.chat/core-typings';
import { type VoIPUserConfiguration } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { InvitationAcceptOptions, InviterInviteOptions, Session, SessionInviteOptions } from 'sip.js';
import { Registerer, RequestPendingError, SessionState, UserAgent, Invitation, Inviter, RegistererState, UserAgentState } from 'sip.js';
import type { IncomingResponse, OutgoingByeRequest } from 'sip.js/lib/core';
import type { SessionDescriptionHandlerOptions } from 'sip.js/lib/platform/web';
import { SessionDescriptionHandler } from 'sip.js/lib/platform/web';

import type { ContactInfo, VoiceCallErrorSession, VoiceCallEvents, VoiceCallSession } from '../../contexts/VoiceCallContext';
import LocalStream from '../voip/LocalStream';
import RemoteStream from '../voip/RemoteStream';

class VoIPClient extends Emitter<VoiceCallEvents> {
	protected registerer: Registerer | undefined;

	protected session: Session | undefined;

	public userAgent: UserAgent | undefined;

	public networkEmitter: Emitter<SignalingSocketEvents>;

	private mediaStreamRendered: IMediaStreamRenderer | undefined;

	private remoteStream: RemoteStream | undefined;

	private held = false;

	private muted = false;

	private online = true;

	private error: { status: number | undefined; reason: string } | null = null;

	constructor(private readonly config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer) {
		super();

		this.mediaStreamRendered = mediaRenderer;

		this.networkEmitter = new Emitter<SignalingSocketEvents>();
	}

	public async init() {
		const { authPassword, authUserName, sipRegistrarHostnameOrIP, iceServers, webSocketURI } = this.config;

		const transportOptions = {
			server: webSocketURI,
			connectionTimeout: 100,
			keepAliveInterval: 20,
		};

		const sdpFactoryOptions = {
			iceGatheringTimeout: 10,
			peerConnectionConfiguration: { iceServers },
		};

		this.userAgent = new UserAgent({
			authorizationPassword: authPassword,
			authorizationUsername: authUserName,
			uri: UserAgent.makeURI(`sip:${authUserName}@${sipRegistrarHostnameOrIP}`),
			transportOptions,
			sessionDescriptionHandlerFactoryOptions: sdpFactoryOptions,
			logConfiguration: false,
			logLevel: 'error',
			delegate: {
				onInvite: this.onIncomingCall,
			},
		});

		this.userAgent.transport.isConnected();

		try {
			this.registerer = new Registerer(this.userAgent);

			this.userAgent.transport.onConnect = this.onUserAgentConnected;
			this.userAgent.transport.onDisconnect = this.onUserAgentDisconnected;
			this.userAgent.start();

			window.addEventListener('online', this.onNetworkRestored);
			window.addEventListener('offline', this.onNetworkLost);
		} catch (error) {
			throw error;
		}
	}

	static async create(config: VoIPUserConfiguration, mediaRenderer?: IMediaStreamRenderer): Promise<VoIPClient> {
		const voip = new VoIPClient(config, mediaRenderer);
		await voip.init();
		return voip;
	}

	protected initSession(session: Session): void {
		this.session = session;

		this.session?.stateChange.addListener((state: SessionState) => {
			if (this.session !== session) {
				return; // if our session has changed, just return
			}

			const sessionEvents: Record<SessionState, () => void> = {
				[SessionState.Initial]: () => undefined, // noop
				[SessionState.Establishing]: this.onSessionStablishing,
				[SessionState.Established]: this.onSessionStablished,
				[SessionState.Terminating]: this.onSessionTerminated,
				[SessionState.Terminated]: this.onSessionTerminated,
			} as const;

			const event = sessionEvents[state];

			if (!event) {
				throw new Error('Unknown session state.');
			}

			event();
		});
	}

	public register = (): void => {
		this.registerer?.register({
			requestDelegate: {
				onAccept: this.onRegistrationAccepted,
				onReject: this.onRegistrationRejected,
			},
		});
	};

	public unregister = (): void => {
		this.registerer?.unregister({
			all: true,
			requestDelegate: {
				onAccept: this.onUnregistrationAccepted,
				onReject: this.onUnregistrationRejected,
			},
		});
	};

	public call = async (calleeURI: string, mediaRenderer?: IMediaStreamRenderer): Promise<void> => {
		if (this.session) {
			throw new Error('Session already exists');
		}

		if (!this.userAgent) {
			throw new Error('No User Agent.');
		}

		if (mediaRenderer) {
			this.switchMediaRenderer(mediaRenderer);
		}

		const hasPlusChar = calleeURI.includes('+');
		const target = UserAgent.makeURI(`sip:${hasPlusChar ? '*' : ''}${calleeURI}@${this.config.sipRegistrarHostnameOrIP}`);

		if (!target) {
			throw new Error(`Failed to create valid URI ${calleeURI}`);
		}

		const inviter = new Inviter(this.userAgent, target, {
			sessionDescriptionHandlerOptions: {
				constraints: {
					audio: true,
					video: false,
				},
			},
		});

		await this.sendInvite(inviter, {
			requestDelegate: {
				onReject: this.onSessionFailed,
			},
		});

		this.emit('stateChanged');
	};

	public answer = (): Promise<void> => {
		if (!(this.session instanceof Invitation)) {
			throw new Error('Session not instance of Invitation.');
		}

		const invitationAcceptOptions: InvitationAcceptOptions = {
			sessionDescriptionHandlerOptions: {
				constraints: {
					audio: true,
					video: false,
				},
			},
		};

		return this.session.accept(invitationAcceptOptions);
	};

	public reject = (): Promise<void> => {
		if (!this.session) {
			return Promise.reject(new Error('No active call.'));
		}

		if (!(this.session instanceof Invitation)) {
			return Promise.reject(new Error('Session not instance of Invitation.'));
		}

		return this.session.reject();
	};

	public endCall = async (): Promise<OutgoingByeRequest | void> => {
		if (!this.session) {
			return Promise.reject(new Error('No active call.'));
		}

		switch (this.session.state) {
			case SessionState.Initial:
			case SessionState.Establishing:
				if (this.session instanceof Inviter) {
					return this.session.cancel();
				}

				if (this.session instanceof Invitation) {
					return this.session.reject();
				}

				throw new Error('Unknown session type.');
			case SessionState.Established:
				return this.session.bye();
			case SessionState.Terminating:
			case SessionState.Terminated:
				break;
			default:
				throw new Error('Unknown state');
		}

		return Promise.resolve();
	};

	public setMute = async (mute: boolean): Promise<void> => {
		if (this.muted === mute) {
			return Promise.resolve();
		}

		if (!this.session) {
			throw new Error('No active call.');
		}

		if (this.isInCall()) {
			return;
		}

		const { peerConnection } = this.sessionDescriptionHandler;

		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}

		this.toggleMediaStreamTracks('sender', mute);
	};

	public setHold = async (hold: boolean): Promise<void> => {
		if (this.held === hold) {
			return Promise.resolve();
		}

		if (!this.session) {
			throw new Error('Session not found');
		}

		const { sessionDescriptionHandler } = this;

		const sessionDescriptionHandlerOptions = this.session.sessionDescriptionHandlerOptionsReInvite as SessionDescriptionHandlerOptions;
		sessionDescriptionHandlerOptions.hold = hold;
		this.session.sessionDescriptionHandlerOptionsReInvite = sessionDescriptionHandlerOptions;

		const { peerConnection } = sessionDescriptionHandler;

		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}

		try {
			const options: SessionInviteOptions = {
				requestDelegate: {
					onAccept: (): void => {
						this.held = hold;

						this.toggleMediaStreamTracks('receiver', !this.held);
						this.toggleMediaStreamTracks('sender', !this.held);

						this.held ? this.emit('hold') : this.emit('unhold');
						this.emit('stateChanged');
					},
					onReject: (): void => {
						this.toggleMediaStreamTracks('receiver', !this.held);
						this.toggleMediaStreamTracks('sender', !this.held);
						this.emit('holderror');
					},
				},
			};

			await this.session.invite(options);

			this.toggleMediaStreamTracks('receiver', hold);
			this.toggleMediaStreamTracks('sender', hold);
		} catch (error: unknown) {
			if (error instanceof RequestPendingError) {
				console.error(`[${this.session?.id}] A hold request is already in progress.`);
			}

			this.emit('holderror');
			throw error;
		}
	};

	public sendDTMF = (tone: string): Promise<void> => {
		// Validate tone
		if (!/^[0-9A-D#*,]$/.exec(tone)) {
			return Promise.reject(new Error('Invalid DTMF tone.'));
		}

		if (!this.session) {
			return Promise.reject(new Error('Session does not exist.'));
		}

		const dtmf = tone;
		const duration = 2000;
		const body = {
			contentDisposition: 'render',
			contentType: 'application/dtmf-relay',
			content: `Signal=${dtmf}\r\nDuration=${duration}`,
		};
		const requestOptions = { body };

		return this.session.info({ requestOptions }).then(() => undefined);
	};

	private async attemptReconnection(reconnectionAttempt = 0, checkRegistration = false): Promise<void> {
		const { connectionRetryCount } = this.config;

		if (!this.userAgent) {
			return;
		}

		if (connectionRetryCount !== -1 && reconnectionAttempt > connectionRetryCount) {
			return;
		}

		const reconnectionDelay = Math.pow(2, reconnectionAttempt % 4);

		console.error(`Attempting to reconnect with backoff due to network loss. Backoff time [${reconnectionDelay}]`);
		setTimeout(() => {
			this.userAgent?.reconnect().catch(() => {
				this.attemptReconnection(++reconnectionAttempt, checkRegistration);
			});
		}, reconnectionDelay * 1000);
	}

	public async changeAudioInputDevice(constraints: MediaStreamConstraints): Promise<boolean> {
		if (!this.session) {
			console.warn('changeAudioInputDevice() : No session.');
			return false;
		}

		const newStream = await LocalStream.requestNewStream(constraints, this.session);

		if (!newStream) {
			console.warn('changeAudioInputDevice() : Unable to get local stream.');
			return false;
		}

		const { peerConnection } = this.sessionDescriptionHandler;

		if (!peerConnection) {
			console.warn('changeAudioInputDevice() : No peer connection.');
			return false;
		}

		LocalStream.replaceTrack(peerConnection, newStream, 'audio');
		return true;
	}

	public switchMediaRenderer(mediaRenderer: IMediaStreamRenderer): void {
		if (!this.remoteStream) {
			return;
		}

		this.mediaStreamRendered = mediaRenderer;
		this.remoteStream.init(mediaRenderer.remoteMediaElement);
		this.remoteStream.play();
	}

	public getContactInfo() {
		if (!this.session) {
			// throw new Error('No active call.');
			return null;
		}

		if (!(this.session instanceof Invitation) && !(this.session instanceof Inviter)) {
			// throw new Error('Session not instance of Invitation nor Inviter.');
			return null;
		}

		const { remoteIdentity } = this.session;
		return {
			id: remoteIdentity.uri.user ?? '',
			name: remoteIdentity.displayName,
			host: remoteIdentity.uri.host,
		};
	}

	public isRegistered(): boolean {
		return this.registerer?.state === RegistererState.Registered;
	}

	public isReady(): boolean {
		return this.userAgent?.state === UserAgentState.Started;
	}

	public isCaller(): boolean {
		return this.session instanceof Inviter;
	}

	public isCallee(): boolean {
		return this.session instanceof Invitation;
	}

	public isInCall(): boolean {
		return this.session?.state === SessionState.Established;
	}

	public isOnline(): boolean {
		return this.online;
	}

	public isMuted(): boolean {
		return this.muted;
	}

	public isHeld(): boolean {
		return this.held;
	}

	public getError() {
		return this.error ?? null;
	}

	public clearErrors(): void {
		this.error = null;
	}

	getSessionType(): VoiceCallSession['type'] | null {
		if (this.error) {
			return 'ERROR';
		}

		if (this.isInCall()) {
			return 'ONGOING';
		}

		if (this.session instanceof Invitation) {
			return 'INCOMING';
		}

		if (this.session instanceof Inviter) {
			return 'OUTGOING';
		}

		return null;
	}

	public getSession(): VoiceCallSession | null {
		const type = this.getSessionType();

		switch (type) {
			case 'ERROR':
				return {
					type: 'ERROR',
					contact: this.getContactInfo() as ContactInfo,
					error: this.getError() as VoiceCallErrorSession['error'],
					end: this.clearErrors,
				};
			case 'INCOMING':
			case 'ONGOING':
			case 'OUTGOING':
				return {
					type,
					contact: this.getContactInfo() as ContactInfo,

					muted: this.isMuted(),
					held: this.isHeld(),

					mute: this.setMute,
					hold: this.setHold,
					accept: this.answer,
					end: this.endCall,
					dtmf: this.sendDTMF,
				};
			default:
				return null;
		}
	}

	getState() {
		return {
			isRegistered: this.isRegistered(),
			isReady: this.isReady(),
			isOnline: this.isOnline(),
			isInCall: this.isInCall(),
		};
	}

	public notifyDialer(value: { open: boolean }) {
		this.emit('dialer', value);
	}

	public clear(): void {
		this.userAgent?.stop();
		this.registerer?.dispose();

		if (this.userAgent) {
			this.userAgent.transport.onConnect = undefined;
			this.userAgent.transport.onDisconnect = undefined;
			window.removeEventListener('online', this.onNetworkRestored);
			window.removeEventListener('offline', this.onNetworkLost);
		}
	}

	private setupRemoteMedia() {
		const { remoteMediaStream } = this.sessionDescriptionHandler;

		this.remoteStream = new RemoteStream(remoteMediaStream);
		const mediaElement = this.mediaStreamRendered?.remoteMediaElement;

		if (mediaElement) {
			this.remoteStream.init(mediaElement);
			this.remoteStream.play();
		}
	}

	private toggleMediaStreamTracks(type: 'sender' | 'receiver', enable: boolean): void {
		const { peerConnection } = this.sessionDescriptionHandler;

		if (!peerConnection) {
			throw new Error('Peer connection closed.');
		}

		const tracks = type === 'sender' ? peerConnection.getSenders() : peerConnection.getReceivers();

		tracks?.forEach((sender) => {
			if (sender.track) {
				sender.track.enabled = enable;
			}
		});
	}

	private async sendInvite(inviter: Inviter, inviterInviteOptions?: InviterInviteOptions): Promise<void> {
		this.initSession(inviter);
		inviter.invite(inviterInviteOptions);
	}

	private get sessionDescriptionHandler(): SessionDescriptionHandler {
		if (!this.session) {
			throw new Error('No active call.');
		}

		const { sessionDescriptionHandler } = this.session;

		if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
			throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
		}

		return sessionDescriptionHandler;
	}

	private onUserAgentConnected = (): void => {
		this.networkEmitter.emit('connected');
		this.emit('stateChanged');
	};

	private onUserAgentDisconnected = (error: any): void => {
		this.networkEmitter.emit('disconnected');
		this.emit('stateChanged');

		if (error) {
			this.networkEmitter.emit('connectionerror', error);
			this.attemptReconnection();
		}
	};

	private onRegistrationAccepted = (): void => {
		this.emit('registered');
		this.emit('stateChanged');
	};

	private onRegistrationRejected = (error: any): void => {
		this.emit('registrationerror', error);
	};

	private onUnregistrationAccepted = (): void => {
		this.emit('unregistered');
		this.emit('stateChanged');
	};

	private onUnregistrationRejected = (error: any): void => {
		this.emit('unregistrationerror', error);
	};

	private onIncomingCall = async (invitation: Invitation): Promise<void> => {
		if (!this.isRegistered() || this.session) {
			await invitation.reject();
			return;
		}

		this.initSession(invitation);

		this.emit('incomingcall', this.getContactInfo() as ContactInfo);
		this.emit('stateChanged');
	};

	private onSessionStablishing = (): void => {
		this.emit('outgoingcall', this.getContactInfo() as ContactInfo);
	};

	private onSessionStablished = (): void => {
		this.setupRemoteMedia();
		this.emit('callestablished', this.getContactInfo() as ContactInfo);
		this.emit('stateChanged');
	};

	private onSessionFailed = (response: IncomingResponse): void => {
		if (!response.message.reasonPhrase) {
			return;
		}

		this.emit('callfailed', response.message.reasonPhrase || 'unknown');
		this.emit('stateChanged');
	};

	private onSessionTerminated = (): void => {
		this.session = undefined;
		this.remoteStream?.clear();
		this.emit('callterminated');
		this.emit('stateChanged');
	};

	private onNetworkRestored = (): void => {
		this.online = true;
		this.networkEmitter.emit('localnetworkonline');
		this.emit('stateChanged');

		this.attemptReconnection();
	};

	private onNetworkLost = (): void => {
		this.online = false;
		this.networkEmitter.emit('localnetworkoffline');
		this.emit('stateChanged');
	};
}

export default VoIPClient;
