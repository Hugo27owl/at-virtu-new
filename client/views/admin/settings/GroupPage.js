import { Accordion, Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, memo } from 'react';

import Page from '../../../components/Page';
import {
	useEditableSettingsDispatch,
	useEditableSettings,
} from '../../../contexts/EditableSettingsContext';
import { useMethod } from '../../../contexts/ServerContext';
import {
	useSetting,
	useSettingsDispatch,
	useSettings,
	useSettingSetValue,
} from '../../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation, useLoadLanguage } from '../../../contexts/TranslationContext';
import { useUser } from '../../../contexts/UserContext';
import GroupPageSkeleton from './GroupPageSkeleton';

function GroupPage({ children, headerButtons, _id, i18nLabel, i18nDescription }) {
	const changedEditableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: _id,
				changed: true,
			}),
			[_id],
		),
	);

	const originalSettings = useSettings(
		useMemo(
			() => ({
				_id: changedEditableSettings.map(({ _id }) => _id),
			}),
			[changedEditableSettings],
		),
	);

	const dispatch = useSettingsDispatch();

	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const loadLanguage = useLoadLanguage();
	const user = useUser();
	const setDiscoveryTags = useSettingSetValue('Discovery_Tags');
	const oldTags = useSetting('Discovery_Tags')
		?.split(',')
		.map((item) => item.trim());
	const removeOldTags = useMethod('removeOldTags');
	const removeTags = useMethod('removeTags');

	const save = useMutableCallback(async () => {
		const changes = changedEditableSettings.map(({ _id, value, editor }) => ({
			_id,
			value,
			editor,
		}));

		if (changes.length === 0) {
			return;
		}

		try {
			await dispatch(changes);

			if (changes.some(({ _id }) => _id === 'Language')) {
				const lng =
					user?.language || changes.filter(({ _id }) => _id === 'Language').shift()?.value || 'en';

				await loadLanguage(lng);
				dispatchToastMessage({ type: 'success', message: t('Settings_updated', { lng }) });
				return;
			}

			if (changes.some(({ _id }) => _id === 'Discovery_Tags')) {
				const updatedTags = changes
					.filter(({ _id }) => _id === 'Discovery_Tags')
					.shift()
					.value.split(',')
					.map((item) => item.trim());
				const removedTags = oldTags.filter((tag) => !updatedTags.includes(tag));
				setDiscoveryTags(updatedTags.join(', '));
				await removeOldTags(removedTags);
				dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
				return;
			}

			if (changes.some(({ _id }) => _id === 'Discovery_Enabled')) {
				const enabled = changes.filter(({ _id }) => _id === 'Discovery_Enabled').shift().value;
				if (enabled === false) {
					setDiscoveryTags('');
					await removeTags();
				}
				dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
				return;
			}

			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const dispatchToEditing = useEditableSettingsDispatch();

	const cancel = useMutableCallback(() => {
		dispatchToEditing(
			changedEditableSettings
				.map(({ _id }) => originalSettings.find((setting) => setting._id === _id))
				.map((setting) => {
					if (!setting) {
						return;
					}

					return {
						_id: setting._id,
						value: setting.value,
						editor: setting.editor,
						changed: false,
					};
				})
				.filter(Boolean),
		);
	});

	const handleSubmit = (event) => {
		event.preventDefault();
		save();
	};

	const handleCancelClick = (event) => {
		event.preventDefault();
		cancel();
	};

	const handleSaveClick = (event) => {
		event.preventDefault();
		save();
	};

	if (!_id) {
		return (
			<Page>
				<Page.Header />
				<Page.Content />
			</Page>
		);
	}

	return (
		<Page is='form' action='#' method='post' onSubmit={handleSubmit}>
			<Page.Header title={t(i18nLabel)}>
				<ButtonGroup>
					{changedEditableSettings.length > 0 && (
						<Button danger primary type='reset' onClick={handleCancelClick}>
							{t('Cancel')}
						</Button>
					)}
					<Button
						children={t('Save_changes')}
						className='save'
						disabled={changedEditableSettings.length === 0}
						primary
						type='submit'
						onClick={handleSaveClick}
					/>
					{headerButtons}
				</ButtonGroup>
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
					{t.has(i18nDescription) && (
						<Box is='p' color='hint' fontScale='p1'>
							{t(i18nDescription)}
						</Box>
					)}

					<Accordion className='page-settings'>{children}</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
}

export default Object.assign(memo(GroupPage), {
	Skeleton: GroupPageSkeleton,
});
