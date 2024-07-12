import { css } from '@rocket.chat/css-in-js';
import { IconButton, TextInput } from '@rocket.chat/fuselage';
import type { FocusEvent, FormEvent } from 'react';
import React from 'react';

type DialPadInputProps = {
	value: string;
	readOnly?: boolean;
	onBackpaceClick?: () => void;
	onChange: (e: FormEvent<HTMLInputElement>) => void;
	onBlur?: (event: FocusEvent<HTMLElement, Element>) => void;
};

const className = css`
	padding-block: 6px;
	min-height: 28px;
	height: 28px;
`;

export const DialPadInput = ({ readOnly, value, onChange, onBackpaceClick }: DialPadInputProps) => {
	return (
		<TextInput
			readOnly={readOnly}
			p={0}
			height='100%'
			minHeight={0}
			value={value}
			className={className}
			addon={<IconButton icon='backspace' small size='20px' disabled={!value} onClick={onBackpaceClick} />}
			onChange={onChange}
		/>
	);
};
