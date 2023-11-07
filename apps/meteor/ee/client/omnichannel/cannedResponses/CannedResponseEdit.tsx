import type { ILivechatDepartment, IOmnichannelCannedResponse, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import React, { memo, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import Page from '../../../../client/components/Page';
import CannedResponseForm from './components/cannedResponseForm';
import { useRemoveCannedResponse } from './useRemoveCannedResponse';

type CannedResponseEditProps = {
	cannedResponseData?: Serialized<IOmnichannelCannedResponse>;
	reload: () => void;
	totalDataReload: () => void;
	departmentData?: Serialized<ILivechatDepartment>;
};

const getInitialData = (cannedResponseData: Serialized<IOmnichannelCannedResponse> | undefined) => ({
	_id: cannedResponseData?._id || '',
	shortcut: cannedResponseData?.shortcut || '',
	text: cannedResponseData?.text || '',
	tags: cannedResponseData?.tags || [],
	scope: cannedResponseData?.scope || 'user',
	departmentId: cannedResponseData?.departmentId || '',
});

const CannedResponseEdit = ({ cannedResponseData, reload, totalDataReload }: CannedResponseEditProps) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const saveCannedResponse = useEndpoint('POST', '/v1/canned-responses');

	const methods = useForm({ defaultValues: getInitialData(cannedResponseData) });

	const {
		handleSubmit,
		reset,
		formState: { isDirty },
	} = methods;

	const handleDelete = useRemoveCannedResponse();

	const handleSave = useCallback(
		async ({ departmentId, ...data }) => {
			try {
				await saveCannedResponse({
					_id: cannedResponseData?._id,
					...data,
					...(departmentId && { departmentId }),
				});
				dispatchToastMessage({
					type: 'success',
					message: t(cannedResponseData?._id ? 'Canned_Response_Updated' : 'Canned_Response_Created'),
				});
				router.navigate('/omnichannel/canned-responses');
				reload();
				totalDataReload();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[cannedResponseData?._id, saveCannedResponse, dispatchToastMessage, t, router, reload, totalDataReload],
	);
	const formId = useUniqueId();

	return (
		<Page>
			<Page.Header title={cannedResponseData?._id ? t('Edit_CannedResponse') : t('New_CannedResponse')}>
				<ButtonGroup>
					<Button icon='back' onClick={() => router.navigate('/omnichannel/canned-responses')}>
						{t('Back')}
					</Button>
					{cannedResponseData?._id && (
						<Button danger onClick={() => handleDelete(cannedResponseData._id)}>
							{t('Delete')}
						</Button>
					)}
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<FormProvider {...methods}>
					<Box id={formId} onSubmit={handleSubmit(handleSave)} w='full' alignSelf='center' maxWidth='x600' is='form' autoComplete='off'>
						<CannedResponseForm />
					</Box>
				</FormProvider>
			</Page.ScrollableContentWithShadow>
			<Page.Footer isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset()}>{t('Cancel')}</Button>
					<Button form={formId} primary type='submit'>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</Page.Footer>
		</Page>
	);
};

export default memo(CannedResponseEdit);
