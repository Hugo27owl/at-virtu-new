import React, { useCallback, useState } from 'react';
import { Box, Button, ButtonGroup, Margins, TextInput, Field, Select, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const ConfirmDeleteModal = () => {
	const t = useTranslation();
	<Modal>
		<Modal.Header>
			<Modal.Title>{t('')}</Modal.Title>
			<Modal.Close />
		</Modal.Header>
		<Modal.Content>
			{t('Custom_User_Status_Delete_Warning')}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button>Cancel</Button>
				<Button primary>Submit</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>
}

export function AddCustomUserStatus({ goToNew, close, setCache, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [name, setName] = useState('');
	const [statusType, setStatusType] = useState('online');

	const saveStatus = useMethod('insertOrUpdateUserStatus');
	const handleSave = useCallback(async () => {
		try {
			const result = await saveStatus({
				name,
				statusType,
			});
			dispatchToastMessage({ type: 'success', message: t('Custom_User_Status_Updated_Successfully') });
			setCache(new Date());
			goToNew(result, { name, statusType, _id: result })();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [name, statusType]);

	const presenceOptions = [
		['away', t('Away')],
		['online', t('Online')],
		['busy', t('Busy')],
		['offline', t('Offline')],
	];

	return <Box display='flex' flexDirection='column' textStyle='p1' textColor='default' mbs='x20' {...props}>
		<Margins block='x4'>
			<Field>
				<Field.Label>{t('Name')}</Field.Label>
				<Field.Row>
					<TextInput value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder={t('Name')} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Presence')}</Field.Label>
				<Field.Row>
					<Select value={statusType} onChange={(value) => setStatusType(value)} placeholder={t('Presence')} options={presenceOptions}/>
				</Field.Row>
			</Field>
			<Field>
				<Field.Row>
					<ButtonGroup stretch w='full'>
						<Button primary danger mie='x4' onClick={close}>{t('Cancel')}</Button>
						<Button primary onClick={handleSave} disabled={name === ''}>{t('Save')}</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</Margins>
	</Box>;
}
