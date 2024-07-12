import { type Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo, useRef } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type VoIPClient from '../lib/voip-freeswitch/VoIPClient';

type VoiceCallContextDisabled = {
	isEnabled: false;
	voipClient?: null;
	error?: null;
};

type VoiceCallContextError = {
	isEnabled: true;
	error: Error;
	voipClient: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

type VoiceCallContextEnabled = {
	isEnabled: true;
	voipClient: VoIPClient | null;
	error?: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

type VoiceCallContextReady = {
	isEnabled: true;
	voipClient: VoIPClient;
	error: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoiceCallContextValue = VoiceCallContextDisabled | VoiceCallContextEnabled | VoiceCallContextReady | VoiceCallContextError;

export type VoiceCallOngoingSession = {
	type: 'ONGOING';
	contact: ContactInfo;
	muted: boolean;
	held: boolean;
	end(): void;
	mute(muted?: boolean): void;
	hold(held?: boolean): void;
	dtmf(digit: string): void;
	// startedAt: string;
	// transfer(): void;
};

export type VoiceCallIncomingSession = VoiceCallGenericSession & {
	type: 'INCOMING';
	contact: ContactInfo;
	muted: boolean;
	end(): void;
	accept(): Promise<void>;
	mute(muted?: boolean): void;
	// tranferOrigin?: string;
};

export type VoiceCallOutgoingSession = VoiceCallGenericSession & {
	type: 'OUTGOING';
	contact: ContactInfo;
	muted: boolean;
	end(): void;
	mute(mute?: boolean): void;
};

export type VoiceCallErrorSession = VoiceCallGenericSession & {
	type: 'ERROR';
	contact: ContactInfo;
	error: { status?: number; reason: string };
	end(): void;
};

export type VoiceCallGenericSession = {
	type: 'INCOMING' | 'OUTGOING' | 'ONGOING' | 'ERROR';
	contact: ContactInfo | null;
	muted?: boolean;
	held?: boolean;
	error?: { status?: number; reason: string };
	accept?(): Promise<void>;
	end?(): void;
	mute?(mute?: boolean): void;
	hold?(held?: boolean): void;
	dtmf?(digit: string): void;
};

export type VoiceCallSession = VoiceCallIncomingSession | VoiceCallOngoingSession | VoiceCallOutgoingSession | VoiceCallErrorSession;

export type VoiceCallEvents = {
	// TODO: Move to core-typings
	registered: undefined;
	registrationerror: unknown;
	unregistered: undefined;
	unregistrationerror: unknown;
	connected: undefined;
	connectionerror: unknown;
	callestablished: ContactInfo;
	incomingcall: ContactInfo;
	callfailed: string;
	outgoingcall: ContactInfo;
	callterminated: undefined;
	hold: undefined;
	holderror: undefined;
	muteerror: undefined;
	unhold: undefined;
	unholderror: undefined;
	stateChanged: undefined;
	dialer: { open: boolean };
};

export type ContactInfo = {
	name: string;
	username?: string;
	host: string;
};

type VoiceCallAPI = {
	makeCall(calleeURI: string): void;
	endCall(): void;
	register(): void;
	unregister(): void;
	openDialer(): void;
	closeDialer(): void;
	changeAudioOutputDevice: VoiceCallContextReady['changeAudioOutputDevice'];
	changeAudioInputDevice: VoiceCallContextReady['changeAudioInputDevice'];
};

export type VoiceCallState = {
	isEnabled: boolean;
	isRegistered: boolean;
	isReady: boolean;
	isInCall: boolean;
	isOnline: boolean;
	isError: boolean;
	error?: Error | null;
};

export const VoiceCallContext = createContext<VoiceCallContextValue>({
	isEnabled: false,
	voipClient: null,
});

const isVoiceCallContextReady = (context: VoiceCallContextValue): context is VoiceCallContextReady =>
	context.isEnabled && context.voipClient !== null;

export const isVoiceCallIncomingSession = (session: VoiceCallSession | null): session is VoiceCallIncomingSession => {
	return session?.type === 'INCOMING';
};

const noop = (..._args: any[]): any => undefined;

const useVoiceCallEvent = <E extends keyof VoiceCallEvents>(eventName: E, initialValue: VoiceCallEvents[E]) => {
	const { voipClient } = useContext(VoiceCallContext);
	const initValue = useRef(initialValue);

	const [subscribe, getSnapshot] = useMemo(() => {
		let state: VoiceCallEvents[E] = initValue.current;

		const getSnapshot = (): VoiceCallEvents[E] => state;
		const callback = (cb: () => void) => {
			if (!voipClient) return () => undefined;

			return voipClient.on(eventName, (event?: VoiceCallEvents[E]): void => {
				state = event as VoiceCallEvents[E];
				cb();
			});
		};

		return [callback, getSnapshot];
	}, [eventName, voipClient]);

	return useSyncExternalStore(subscribe, getSnapshot);
};

const useVoiceCallEffect = <T,>(transform: (voipClient: VoIPClient) => T, initialValue: T) => {
	const { voipClient } = useContext(VoiceCallContext);
	const initValue = useRef<T>(initialValue);
	const transformFn = useRef(transform);

	const [subscribe, getSnapshot] = useMemo(() => {
		let state: T = initValue.current;

		const getSnapshot = (): T => state;
		const subscribe = (cb: () => void) => {
			if (!voipClient) return () => undefined;

			state = transformFn.current(voipClient);
			return voipClient.on('stateChanged', (): void => {
				state = transformFn.current(voipClient);
				cb();
			});
		};

		return [subscribe, getSnapshot];
	}, [voipClient]);

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useVoiceCallDialer = () => {
	const { openDialer, closeDialer } = useVoiceCallAPI();
	const { open } = useVoiceCallEvent('dialer', { open: false });

	return {
		open,
		openDialer: openDialer || (() => undefined),
		closeDialer: closeDialer || (() => undefined),
	};
};

export const useVoiceCallSession = (): VoiceCallSession | null => {
	return useVoiceCallEffect((client) => client.getSession(), null);
};

export const useVoiceCallState = (): VoiceCallState => {
	const { isEnabled, error } = useContext(VoiceCallContext);

	const clientState = useVoiceCallEffect((client) => client.getState(), {
		isRegistered: false,
		isReady: false,
		isInCall: false,
		isOnline: false,
	});

	return useMemo(
		() => ({
			error,
			isEnabled,
			isError: !!error,
			...clientState,
		}),
		[isEnabled, error, clientState],
	);
};

export const useVoiceCallAPI = (): VoiceCallAPI => {
	const context = useContext(VoiceCallContext);

	return useMemo(() => {
		if (!isVoiceCallContextReady(context)) {
			return {
				makeCall: noop,
				endCall: noop,
				register: noop,
				unregister: noop,
				openDialer: noop,
				closeDialer: noop,
				changeAudioInputDevice: noop,
				changeAudioOutputDevice: noop,
			} as VoiceCallAPI;
		}

		const { voipClient, changeAudioInputDevice, changeAudioOutputDevice } = context;

		return {
			makeCall: voipClient.call,
			endCall: voipClient.endCall,
			register: voipClient.register,
			unregister: voipClient.unregister,
			openDialer: () => voipClient.notifyDialer({ open: true }),
			closeDialer: () => voipClient.notifyDialer({ open: false }),
			changeAudioInputDevice,
			changeAudioOutputDevice,
		};
	}, [context]);
};

export const useVoiceCall = () => {
	const { error } = useContext(VoiceCallContext);
	const state = useVoiceCallState();
	const session = useVoiceCallSession();
	const api = useVoiceCallAPI();

	return useMemo(
		() => ({
			...state,
			...api,
			session,
			error,
		}),
		[state, api, session, error],
	);
};
