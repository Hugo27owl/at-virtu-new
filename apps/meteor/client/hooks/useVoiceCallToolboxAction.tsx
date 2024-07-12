import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { GenericMenuItemProps } from '../components/GenericMenu/GenericMenuItem';
import { useVoiceCallAPI, useVoiceCallState } from '../contexts/VoiceCallContext';

const useVoiceCallToolboxAction = () => {
	const { t } = useTranslation();
	const { isEnabled, isRegistered, isInCall } = useVoiceCallState();
	const { openDialer } = useVoiceCallAPI();
	const disabled = !isRegistered || isInCall;
	const tooltip = disabled ? t('Voice_calling_disabled') : '';

	return useMemo(() => {
		const items: GenericMenuItemProps[] = [
			{
				id: 'start-voice-call',
				icon: 'phone',
				disabled,
				onClick: () => openDialer?.(),
				content: (
					<Box is='span' title={tooltip}>
						{t('Voice_call')}
					</Box>
				),
			},
		];

		return {
			items: isEnabled ? items : [],
			groups: ['direct'] as const,
			disabled,
			allowed: isEnabled,
			order: 1,
		};
	}, [disabled, isEnabled, openDialer, t, tooltip]);
};

export default useVoiceCallToolboxAction;
