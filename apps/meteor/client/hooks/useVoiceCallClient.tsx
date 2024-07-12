import { useUser, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import VoIPClient from '../lib/voip-freeswitch/VoIPClient';
import { useWebRtcServers } from '../providers/OmnichannelCallProvider/hooks/useWebRtcServers';

export const useVoiceCallClient = (): { voipClient: VoIPClient | null; error: Error | null } => {
	const { _id: userId } = useUser() || {};
	const isVoipEnabled = useSetting<boolean>('VoIP_TeamCollab_Enabled');
	const voipClientRef = useRef<VoIPClient | null>(null);
	// const voipRetryCount = useSetting<number>('VoIP_Retry_Count');
	// const enableKeepAlive = useSetting<boolean>('VoIP_Enable_Keep_Alive_For_Unstable_Networks');

	const getRegistrationInfo = useEndpoint('GET', '/v1/voip-freeswitch.extension.getRegistrationInfoByUserId');

	const iceServers = useWebRtcServers();

	const { data: voipClient, error } = useQuery<VoIPClient | null, Error>(
		['voice-call-client', isVoipEnabled, userId, iceServers],
		async () => {
			if (voipClientRef.current) {
				voipClientRef.current.clear();
			}

			if (!userId) {
				throw Error('Invalid user id');
			}

			const registrationInfo = await getRegistrationInfo({ userId })
				.then((registration) => {
					if (!registration) {
						throw Error();
					}

					return registration;
				})
				.catch(() => {
					throw Error('Registration information not found'); // TODO: i18n
				});

			const {
				extension: { extension },
				credentials: { websocketPath, password },
			} = registrationInfo;

			if (!extension) {
				throw Error('User extension not found');
			}

			const config = {
				iceServers,
				authUserName: extension,
				authPassword: password,
				sipRegistrarHostnameOrIP: new URL(websocketPath).host,
				webSocketURI: websocketPath,
				connectionRetryCount: Number(10), // TODO: get from settings
				enableKeepAliveUsingOptionsForUnstableNetworks: true, // TODO: get from settings
			};

			return VoIPClient.create(config);
		},
		{
			initialData: null,
			enabled: !!userId,
		},
	);

	useEffect(() => {
		voipClientRef.current = voipClient;

		return () => voipClientRef.current?.clear();
	}, [voipClient]);

	return { voipClient, error };
};
