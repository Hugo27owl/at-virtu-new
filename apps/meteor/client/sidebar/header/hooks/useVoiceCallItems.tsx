import { Box } from '@rocket.chat/fuselage';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
import { useVoiceCallAPI, useVoiceCallState } from '../../../contexts/VoiceCallContext';

const useVoiceCallItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const { isEnabled, isReady, isRegistered, error } = useVoiceCallState();
	const { register, unregister } = useVoiceCallAPI();

	const tooltip = useMemo(() => {
		if (error) {
			return error.message;
		}

		if (!isReady) {
			return t('Loading');
		}

		return '';
	}, [t, error, isReady]);

	const handleToggleVoiceCall = useCallback(() => {
		isRegistered ? unregister?.() : register?.();
	}, [isRegistered, register, unregister]);

	return useMemo(() => {
		if (!isEnabled) {
			return [];
		}

		return [
			{
				id: 'toggle-voice-call',
				icon: isRegistered ? 'phone-disabled' : 'phone',
				disabled: !isReady,
				onClick: handleToggleVoiceCall,
				content: (
					<Box is='span' title={tooltip}>
						{isRegistered ? t('Disable_voice_calling') : t('Enable_voice_calling')}
					</Box>
				),
			},
		];
	}, [handleToggleVoiceCall, isEnabled, isReady, isRegistered, t, tooltip]);
};

export default useVoiceCallItems;
