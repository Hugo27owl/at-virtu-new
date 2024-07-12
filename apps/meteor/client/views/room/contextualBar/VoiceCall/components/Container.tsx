import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const containerClassName = css`
	position: fixed;
	display: flex;
	flex-direction: column;
	max-width: 250px;
	min-height: 128px;
	border-radius: 4px;
	border: 1px solid #6c727a;
	bottom: 132px;
	right: 24px;
	z-index: 99;
`;

const VoiceCallContainer: FC<{ secondary?: boolean }> = ({ children, secondary = false }) => {
	return (
		<Box className={containerClassName} backgroundColor={secondary ? '#E4E7EA' : '#FFFFFF'}>
			{children}
		</Box>
	);
};

export default VoiceCallContainer;
