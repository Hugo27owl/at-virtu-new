import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const VoiceCallFooter: FC = ({ children }) => {
	return (
		<Box style={{ gap: '16px' }} display='flex' flexWrap='wrap' p={12} mbs='auto' backgroundColor='#FFFFFF'>
			{children}
		</Box>
	);
};

export default VoiceCallFooter;
