import React, { useMemo } from 'react';
import { Box, Callout, FieldGroup, Field, TextInput, MultiSelect, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { usePermission } from '../../contexts/AuthorizationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../hooks/useEndpointDataExperimental';
import { useForm } from '../../hooks/useForm';
import Page from '../../components/basic/Page';
import ExternalLink from '../../components/basic/ExternalLink';
import PageSkeleton from '../../components/PageSkeleton';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';

const reduceSettings = (settings) => settings.reduce((acc, { _id, value }) => {
	acc = { ...acc, [_id]: value };
	return acc;
}, {});

const reduceSendOptions = (options) => Object.entries(options).reduce((acc, [key, val]) => {
	if (val) { acc = [...acc, key]; }
	return acc;
}, []);

const integrationsUrl = 'https://rocket.chat/docs/administrator-guides/livechat/#integrations';

const WebhooksPageContainer = () => {
	const t = useTranslation();

	const { data, state, error } = useEndpointDataExperimental('livechat/integrations.settings');

	const canViewLivechatWebhooks = usePermission('view-livechat-webhooks');

	if (!canViewLivechatWebhooks) {
		return <NotAuthorizedPage />;
	}

	if (state === ENDPOINT_STATES.LOADING) {
		return <PageSkeleton />;
	}

	if (!data || !data.success || !data.settings || error) {
		return <Page>
			<Page.Header title={t('Webhooks')}/>
			<Page.ScrollableContentWithShadow>
				<Callout type='danger'>
					{t('Error')}
				</Callout>
			</Page.ScrollableContentWithShadow>
		</Page>;
	}

	return <WebhooksPage settings={reduceSettings(data.settings)} />;
};

const getInitialValues = ({
	Livechat_webhookUrl,
	Livechat_secret_token,
	Livechat_webhook_on_start,
	Livechat_webhook_on_close,
	Livechat_webhook_on_chat_taken,
	Livechat_webhook_on_chat_queued,
	Livechat_webhook_on_forward,
	Livechat_webhook_on_offline_msg,
	Livechat_webhook_on_visitor_message,
	Livechat_webhook_on_agent_message,
}) => {
	const sendOptions = {
		Livechat_webhook_on_start,
		Livechat_webhook_on_close,
		Livechat_webhook_on_chat_taken,
		Livechat_webhook_on_chat_queued,
		Livechat_webhook_on_forward,
		Livechat_webhook_on_offline_msg,
		Livechat_webhook_on_visitor_message,
		Livechat_webhook_on_agent_message,
	};

	const mappedSendOptions = reduceSendOptions(sendOptions);

	return {
		Livechat_webhookUrl,
		Livechat_secret_token,
		sendOn: mappedSendOptions,
	};
};


const WebhooksPage = ({ settings }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { values, handlers, hasUnsavedChanges, reset, commit } = useForm(getInitialValues(settings));

	const save = useMethod('livechat:saveIntegration');
	const test = useMethod('livechat:webhookTest');

	const {
		Livechat_webhookUrl,
		Livechat_secret_token,
		sendOn,
	} = values;

	const {
		handleLivechat_webhookUrl,
		handleLivechat_secret_token,
		handleSendOn,
	} = handlers;

	const sendOptions = useMemo(() => [
		['Livechat_webhook_on_start', t('Chat_start')],
		['Livechat_webhook_on_close', t('Chat_close')],
		['Livechat_webhook_on_chat_taken', t('Chat_taken')],
		['Livechat_webhook_on_chat_queued', t('Chat_queued')],
		['Livechat_webhook_on_forward', t('Forwarding')],
		['Livechat_webhook_on_offline_msg', t('Offline_messages')],
		['Livechat_webhook_on_visitor_message', t('Visitor_message')],
		['Livechat_webhook_on_agent_message', t('Agent_messages')],
	], [t]);

	const handleSave = useMutableCallback(async () => {
		const sendOnObj = sendOptions.reduce((acc, [key]) => {
			acc = { ...acc, [key]: sendOn.includes(key) ? 1 : 0 };
			return acc;
		}, {});

		try {
			await save({ Livechat_webhookUrl, Livechat_secret_token, ...sendOnObj });
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			commit();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleTest = useMutableCallback(async () => {
		try {
			await test();
			dispatchToastMessage({ type: 'success', message: t('It_works') });
			commit();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return <Page>
		<Page.Header title={t('Webhooks')}>
			<ButtonGroup>
				<Button onClick={() => reset()}>{t('Reset')}</Button>
				<Button onClick={handleTest} disabled={!Livechat_webhookUrl || hasUnsavedChanges}>{t('Send_Test')}</Button>
				<Button primary onClick={handleSave} disabled={!hasUnsavedChanges}>{t('Save')}</Button>
			</ButtonGroup>
		</Page.Header>
		<Page.ScrollableContentWithShadow>
			<Box maxWidth='x600' w='full' alignSelf='center'>
				<p>
					{t('You_can_use_webhooks_to_easily_integrate_livechat_with_your_CRM')}
				</p>
				<p>
					<ExternalLink to={integrationsUrl}>{t('Click_here')}</ExternalLink> {t('to_see_more_details_on_how_to_integrate')}
				</p>
				<FieldGroup style={{ marginTop: '1.5rem' }}>
					<Field>
						<Field.Label>
							{t('Webhook_URL')}
						</Field.Label>
						<Field.Row>
							<TextInput value={Livechat_webhookUrl} onChange={handleLivechat_webhookUrl} placeholder='https://yourdomain.com/webhook/entrypoint'/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>
							{t('Secret_token')}
						</Field.Label>
						<Field.Row>
							<TextInput value={Livechat_secret_token} onChange={handleLivechat_secret_token} placeholder={t('Secret_token')}/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>
							{t('Send_request_on')}
						</Field.Label>
						<Field.Row>
							<Box w='full' display='flex' alignItems='stretch' justifyContent='stretch'>
								<MultiSelect w='full' value={sendOn} onChange={handleSendOn} options={sendOptions} placeholder={t('Select_an_option')}/>
							</Box>
						</Field.Row>
					</Field>
				</FieldGroup>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
};

export default WebhooksPageContainer;
