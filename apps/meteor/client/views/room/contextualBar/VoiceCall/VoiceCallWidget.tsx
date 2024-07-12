/* eslint-disable react/no-multi-comp */
import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';

import type {
	VoiceCallErrorSession,
	VoiceCallIncomingSession,
	VoiceCallOngoingSession,
	VoiceCallOutgoingSession,
} from '../../../../contexts/VoiceCallContext';
import { useVoiceCallAPI, useVoiceCallDialer, useVoiceCallSession } from '../../../../contexts/VoiceCallContext';
import { Actions, Container, DialPad, Footer, Header, Timer } from './components';
import VoiceCallId from './components/CallIdentifier';
import SettingsButton from './components/CallSettingsButton';

const VoiceCallIncomingView = ({ session }: { session: VoiceCallIncomingSession }) => {
	const t = useTranslation();

	return (
		<Container>
			<Header title={`${t('Incoming')}...`} />

			<section>
				<VoiceCallId />
			</section>

			<Footer>
				<Actions session={session} />
			</Footer>
		</Container>
	);
};

const VoiceCallOngoingView = ({ session }: { session: VoiceCallOngoingSession }) => {
	const [isDialPadOpen, setDialerOpen] = useState(false);
	const [dtmfValue, setDTMF] = useState('');

	const handleDTMF = (value: string, digit: string) => {
		setDTMF(value);
		digit && session.dtmf(digit);
	};

	return (
		<Container secondary>
			<Header title={<Timer />} />

			<section>{isDialPadOpen && <DialPad value={dtmfValue} onChange={handleDTMF} />}</section>

			<Footer>
				<Actions session={session} onDTMF={() => setDialerOpen(!isDialPadOpen)} />
			</Footer>
		</Container>
	);
};

const VoiceCallOutgoingView = ({ session }: { session: VoiceCallOutgoingSession }) => {
	const t = useTranslation();
	return (
		<Container>
			<Header title={`${t('Calling')}...`} />
			<Footer>
				<Actions session={session} />
			</Footer>
		</Container>
	);
};

const VoiceCallErrorView = ({ session }: { session: VoiceCallErrorSession }) => {
	return (
		<Container>
			<Header title='Error Message' hideSettings />
			<Footer>
				<Actions session={session} />
			</Footer>
		</Container>
	);
};

export const VoiceCallDialer = () => {
	const t = useTranslation();
	const { makeCall, closeDialer } = useVoiceCallAPI();
	const [number, setNumber] = useState('');

	const handleCall = () => {
		makeCall?.(number);
		closeDialer?.();
	};

	return (
		<Container secondary>
			<Header title={t('New_Call')} hideSettings onClose={closeDialer} />

			<section>
				<DialPad editable value={number} onChange={(value) => setNumber(value)} />
			</section>

			<Footer>
				<SettingsButton />
				<Button icon='phone' disabled={!number} medium success flexGrow={1} onClick={handleCall}>
					Call
				</Button>
			</Footer>
		</Container>
	);
};

const VoiceCallWidget = () => {
	const session = useVoiceCallSession();
	const { open: isDialerOpen } = useVoiceCallDialer();

	return (
		<>
			{!session && isDialerOpen && <VoiceCallDialer />}
			{session?.type === 'ERROR' && <VoiceCallErrorView session={session} />}
			{session?.type === 'ONGOING' && <VoiceCallOngoingView session={session} />}
			{session?.type === 'INCOMING' && <VoiceCallIncomingView session={session} />}
			{session?.type === 'OUTGOING' && <VoiceCallOutgoingView session={session} />}
		</>
	);
};

export default VoiceCallWidget;
