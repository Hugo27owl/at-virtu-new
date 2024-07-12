import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

import { useVoiceCallSession } from '../../../../../contexts/VoiceCallContext';

const VoiceCallId: FC = () => {
	const session = useVoiceCallSession();

	if (!session) {
		return null;
	}

	return (
		<Box is='section' pi={12} pb={8}>
			<span>{session.contact?.name}</span>
		</Box>
	);
};

export default VoiceCallId;
