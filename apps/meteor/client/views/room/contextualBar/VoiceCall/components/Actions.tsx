import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import type { VoiceCallSession } from '../../../../../contexts/VoiceCallContext';

type VoiceCallActionsProps = {
	session?: VoiceCallSession;
	onDTMF?: () => void;
	onEndCall?: () => void;
};

type Actions = 'accept' | 'decline' | 'mute' | 'hold' | 'transfer' | 'DTMF' | 'end';

const ACTIONS_BY_TYPE: Record<VoiceCallSession['type'] | 'IDLE', Actions[]> = {
	INCOMING: ['accept', 'decline', 'mute'],
	ONGOING: ['accept', 'end', 'mute', 'hold', 'transfer', 'DTMF'],
	OUTGOING: ['decline', 'mute'],
	ERROR: ['decline'],
	IDLE: [],
};

const VoiceCallActions = ({ session, onDTMF }: VoiceCallActionsProps) => {
	const t = useTranslation();

	const { type, muted = false, held = false } = session || {};
	const permissions = ACTIONS_BY_TYPE[type || 'IDLE'];
	const isIncoming = session?.type === 'INCOMING';
	const isOngoing = session?.type === 'ONGOING';

	return (
		<Box style={{ gap: '16px' }} display='flex' flexWrap='wrap' mbs='auto' backgroundColor='#FFFFFF'>
			{isIncoming && (
				<IconButton
					mini
					secondary
					icon='phone-off'
					width={32}
					height={32}
					data-tooltip={t('Decline')}
					aria-label={t('Decline')}
					danger
					onClick={() => session.end()}
				/>
			)}

			<IconButton
				mini
				secondary
				icon={muted ? 'mic-off' : 'mic'}
				width={32}
				height={32}
				disabled={!permissions.includes('mute')}
				onClick={() => (isIncoming || isOngoing) && session.mute(!muted)}
			/>

			{!isIncoming && (
				<IconButton
					mini
					secondary
					icon={held ? 'pause-shape-filled' : 'pause-unfilled'}
					width={32}
					height={32}
					disabled={!permissions.includes('hold')}
					onClick={() => isOngoing && session.hold(!held)}
				/>
			)}

			<IconButton mini secondary icon='dialpad' width={32} height={32} disabled={!permissions.includes('DTMF')} onClick={onDTMF} />

			<IconButton secondary mini icon='arrow-forward' width={32} height={32} disabled={!permissions.includes('transfer')} />

			{!isIncoming && (
				<IconButton
					mini
					danger
					secondary
					width={32}
					height={32}
					icon='phone-off'
					disabled={held}
					aria-label={t('End_call')}
					data-tooltip={t('End_Call')}
					onClick={() => session?.end()}
				/>
			)}

			{isIncoming && (
				<IconButton
					mini
					success
					secondary
					icon='phone'
					width={32}
					height={32}
					data-tooltip={t('Accept')}
					onClick={() => session.accept()}
				/>
			)}
		</Box>
	);
};

export default VoiceCallActions;
