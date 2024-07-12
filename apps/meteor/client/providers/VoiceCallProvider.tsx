import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Device, IExperimentalHTMLAudioElement } from '@rocket.chat/ui-contexts';
import { useSetInputMediaDevice, useSetOutputMediaDevice, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { FC, ReactNode } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import type { VoiceCallContextValue } from '../contexts/VoiceCallContext';
import { VoiceCallContext } from '../contexts/VoiceCallContext';
import { useVoiceCallClient } from '../hooks/useVoiceCallClient';
import { createAnchor } from '../lib/utils/createAnchor';
import { deleteAnchor } from '../lib/utils/deleteAnchor';
import VoiceCallWidgetPortal from '../portals/VoiceCallWidgetPortal';
import VoiceCallWidget from '../views/room/contextualBar/VoiceCall/VoiceCallWidget';
import { useVoipSounds } from './OmnichannelCallProvider/hooks/useVoipSounds';

// eslint-disable-next-line react/no-multi-comp
const VoiceCallProvider: FC<{ children: ReactNode }> = ({ children }) => {
	// Settings
	const isVoipEnabled = useSetting<boolean>('VoIP_TeamCollab_Enabled') || false;

	// Hooks
	const voipSounds = useVoipSounds();
	const { voipClient, error } = useVoiceCallClient();
	const setOutputMediaDevice = useSetOutputMediaDevice();
	const setInputMediaDevice = useSetInputMediaDevice();
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	// Refs
	const remoteAudioMediaRef = useRef<IExperimentalHTMLAudioElement>(null);
	const voiceCallRoot = createAnchor('voice-call-root');

	useEffect(() => (): void => deleteAnchor(voiceCallRoot), [voiceCallRoot]);

	useEffect(() => {
		if (!voipClient) {
			return;
		}

		const onCallEstablished = async (): Promise<void> => {
			voipSounds.stopAll();

			if (!voipClient) {
				return;
			}

			if (voipClient.isCallee()) {
				return;
			}

			if (!remoteAudioMediaRef.current) {
				return;
			}

			voipClient.switchMediaRenderer({ remoteMediaElement: remoteAudioMediaRef.current });
		};

		const onNetworkDisconnected = (): void => {
			voipClient.endCall();
		};

		const onOutgoingCallRinging = (): void => {
			voipSounds.play('outbound-call-ringing');
		};

		const onIncomingCallRinging = (): void => {
			voipSounds.play('telephone');
		};

		const onCallFailed = (reason: 'Not Found' | 'Address Incomplete' | 'Request Terminated' | string): void => {
			switch (reason) {
				case 'Not Found':
					// This happens when the call matches dialplan and goes to the world, but the trunk doesnt find the number.
					// openDialModal({ errorMessage: t('Dialed_number_doesnt_exist') });
					break;
				case 'Address Incomplete':
					// This happens when the dialed number doesnt match a valid asterisk dialplan pattern or the number is invalid.
					// openDialModal({ errorMessage: t('Dialed_number_is_incomplete') });
					break;
				case 'Request Terminated':
					break;
				default:
				// openDialModal({ errorMessage: t('Something_went_wrong_try_again_later') });
			}
		};

		const onCallTerminated = (): void => {
			voipSounds.play('call-ended', false);
			voipSounds.stopAll();
		};

		const onRegistrationError = () => {
			dispatchToastMessage({ type: 'error', message: t('Voice_calling_registration_failed') });
		};

		voipClient.on('incomingcall', onIncomingCallRinging);
		voipClient.on('outgoingcall', onOutgoingCallRinging);
		voipClient.on('callestablished', onCallEstablished);
		voipClient.on('callfailed', onCallFailed);
		voipClient.on('callterminated', onCallTerminated);
		voipClient.on('registrationerror', onRegistrationError);
		voipClient.networkEmitter.on('disconnected', onNetworkDisconnected);
		voipClient.networkEmitter.on('connectionerror', onNetworkDisconnected);
		voipClient.networkEmitter.on('localnetworkoffline', onNetworkDisconnected);

		return (): void => {
			voipClient.off('incomingcall', onIncomingCallRinging);
			voipClient.off('outgoingcall', onOutgoingCallRinging);
			voipClient.off('callestablished', onCallEstablished);
			voipClient.off('callfailed', onCallFailed);
			voipClient.off('callterminated', onCallTerminated);
			voipClient.off('registrationerror', onRegistrationError);
			voipClient.networkEmitter.off('disconnected', onNetworkDisconnected);
			voipClient.networkEmitter.off('connectionerror', onNetworkDisconnected);
			voipClient.networkEmitter.off('localnetworkoffline', onNetworkDisconnected);
		};
	}, [dispatchToastMessage, t, voipClient, voipSounds]);

	const changeAudioOutputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		if (!remoteAudioMediaRef.current) {
			return;
		}

		setOutputMediaDevice({ outputDevice: selectedAudioDevice, HTMLAudioElement: remoteAudioMediaRef.current });
	});

	const changeAudioInputDevice = useEffectEvent(async (selectedAudioDevice: Device): Promise<void> => {
		if (!voipClient) {
			return;
		}

		await voipClient.changeAudioInputDevice({ audio: { deviceId: { exact: selectedAudioDevice.id } } });
		setInputMediaDevice(selectedAudioDevice);
	});

	const contextValue = useMemo<VoiceCallContextValue>(() => {
		if (!isVoipEnabled) {
			return {
				isEnabled: false,
				voipClient: null,
				error: null,
				changeAudioInputDevice,
				changeAudioOutputDevice,
			};
		}

		if (!voipClient || error) {
			return {
				isEnabled: true,
				voipClient: null,
				error,
				changeAudioInputDevice,
				changeAudioOutputDevice,
			};
		}

		return {
			isEnabled: true,
			voipClient,

			changeAudioInputDevice,
			changeAudioOutputDevice,
		};
	}, [voipClient, isVoipEnabled, error, changeAudioInputDevice, changeAudioOutputDevice]);

	return (
		<VoiceCallContext.Provider value={contextValue}>
			{children}
			{contextValue.isEnabled &&
				createPortal(
					<audio ref={remoteAudioMediaRef}>
						<track kind='captions' />
					</audio>,
					document.body,
				)}
			<VoiceCallWidgetPortal>
				<VoiceCallWidget />
			</VoiceCallWidgetPortal>
		</VoiceCallContext.Provider>
	);
};

export default VoiceCallProvider;
