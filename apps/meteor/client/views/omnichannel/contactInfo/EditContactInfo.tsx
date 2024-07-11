import type { ILivechatVisitor, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, FieldError, TextInput, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { CustomFieldsForm } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { validateEmail } from '../../../../lib/emailValidator';
import {
	ContextualbarScrollableContent,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
} from '../../../components/Contextualbar';
import { createToken } from '../../../lib/utils/createToken';
import { ContactManager as ContactManagerForm } from '../additionalForms';
import { FormSkeleton } from '../directory/components/FormSkeleton';
import { useCustomFieldsMetadata } from '../directory/hooks/useCustomFieldsMetadata';
import { useContactRoute } from '../hooks/useContactRoute';

type ContactNewEditProps = {
	id: string;
	contactData?: { contact: Serialized<ILivechatVisitor> | null };
	onClose: () => void;
	onCancel: () => void;
};

type ContactFormData = {
	token: string;
	name: string;
	email: string;
	phone: string;
	username: string;
	customFields: Record<any, any>;
};

const DEFAULT_VALUES = {
	token: '',
	name: '',
	email: '',
	phone: '',
	username: '',
	customFields: {},
};

const getInitialValues = (data: ContactNewEditProps['contactData']): ContactFormData => {
	if (!data) {
		return DEFAULT_VALUES;
	}

	const { name, token, phone, visitorEmails, livechatData, contactManager } = data.contact ?? {};

	return {
		token: token ?? '',
		name: name ?? '',
		email: visitorEmails ? visitorEmails[0].address : '',
		phone: phone ? phone[0].phoneNumber : '',
		customFields: livechatData ?? {},
		username: contactManager?.username ?? '',
	};
};

const EditContactInfo = ({ id, contactData, onClose, onCancel }: ContactNewEditProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const handleNavigate = useContactRoute();

	const canViewCustomFields = hasAtLeastOnePermission(['view-livechat-room-customfields', 'edit-livechat-room-customfields']);

	const [userId, setUserId] = useState('no-agent-selected');
	const saveContact = useEndpoint('POST', '/v1/omnichannel/contact');
	const getContactBy = useEndpoint('GET', '/v1/omnichannel/contact.search');
	const getUserData = useEndpoint('GET', '/v1/users.info');

	const { data: customFieldsMetadata = [], isInitialLoading: isLoadingCustomFields } = useCustomFieldsMetadata({
		scope: 'visitor',
		enabled: canViewCustomFields,
	});

	const initialValue = getInitialValues(contactData);
	const { username: initialUsername } = initialValue;

	const {
		formState: { errors, isSubmitting },
		control,
		setValue,
		handleSubmit,
		setError,
	} = useForm<ContactFormData>({
		mode: 'onChange',
		reValidateMode: 'onChange',
		defaultValues: initialValue,
	});

	const nameFieldId = useUniqueId();
	const emailFieldId = useUniqueId();
	const phoneFieldId = useUniqueId();

	useEffect(() => {
		if (!initialUsername) {
			return;
		}

		getUserData({ username: initialUsername }).then(({ user }) => {
			setUserId(user._id);
		});
	}, [getUserData, initialUsername]);

	const validateEmailFormat = (email: string): boolean | string => {
		if (!email || email === initialValue.email) {
			return true;
		}

		if (!validateEmail(email)) {
			return t('error-invalid-email-address');
		}

		return true;
	};

	const validateContactField = async (name: 'phone' | 'email', value: string, optional = true) => {
		if ((optional && !value) || value === initialValue[name]) {
			return true;
		}

		const query = { [name]: value } as Record<'phone' | 'email', string>;
		const { contact } = await getContactBy(query);
		return !contact || contact._id === id;
	};

	const handleContactManagerChange = async (userId: string): Promise<void> => {
		setUserId(userId);

		if (userId === 'no-agent-selected') {
			setValue('username', '', { shouldDirty: true });
			return;
		}

		const { user } = await getUserData({ userId });
		setValue('username', user.username || '', { shouldDirty: true });
	};

	const validateAsync = async ({ phone = '', email = '' } = {}) => {
		const isEmailValid = await validateContactField('email', email);
		const isPhoneValid = await validateContactField('phone', phone);

		!isEmailValid && setError('email', { message: t('Email_already_exists') });
		!isPhoneValid && setError('phone', { message: t('Phone_already_exists') });

		return isEmailValid && isPhoneValid;
	};

	const handleSave = async (data: ContactFormData): Promise<void> => {
		if (!(await validateAsync(data))) {
			return;
		}

		const { name, phone, email, customFields, username, token } = data;

		const payload = {
			name,
			phone,
			email,
			customFields,
			token: token || createToken(),
			...(username && { contactManager: { username } }),
			...(id && { _id: id }),
		};

		try {
			await saveContact(payload);
			dispatchToastMessage({ type: 'success', message: t('Saved') });
			await queryClient.invalidateQueries({ queryKey: ['current-contacts'] });
			contactData ? handleNavigate({ context: 'details' }) : handleNavigate({ tab: 'contacts', context: '' });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	if (isLoadingCustomFields) {
		return (
			<ContextualbarContent>
				<FormSkeleton />
			</ContextualbarContent>
		);
	}

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name={contactData ? 'pencil' : 'user'} />
				<ContextualbarTitle>{contactData ? t('Edit_Contact_Profile') : t('New_contact')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)}>
				<Field>
					<FieldLabel htmlFor={nameFieldId} required>
						{t('Name')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='name'
							control={control}
							rules={{ validate: (name) => (!name.trim() ? t('The_field_is_required', t('Name')) : true) }}
							render={({ field }) => (
								<TextInput
									{...field}
									id={nameFieldId}
									error={errors.name?.message}
									aria-invalid={Boolean(errors.name)}
									aria-describedby={`${nameFieldId}-error`}
								/>
							)}
						/>
					</FieldRow>
					<FieldError id={`${nameFieldId}-error`}>{errors.name?.message}</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={emailFieldId}>{t('Email')}</FieldLabel>
					<FieldRow>
						<Controller
							name='email'
							control={control}
							rules={{ validate: validateEmailFormat }}
							render={({ field }) => <TextInput {...field} id={emailFieldId} error={errors.email?.message} />}
						/>
					</FieldRow>
					<FieldError>{errors.email?.message}</FieldError>
				</Field>
				<Field>
					<FieldLabel htmlFor={phoneFieldId}>{t('Phone')}</FieldLabel>
					<FieldRow>
						<Controller
							name='phone'
							control={control}
							render={({ field }) => <TextInput {...field} id={phoneFieldId} error={errors.phone?.message} />}
						/>
					</FieldRow>
					<FieldError>{errors.phone?.message}</FieldError>
				</Field>
				{canViewCustomFields && <CustomFieldsForm formName='customFields' formControl={control} metadata={customFieldsMetadata} />}
				<ContactManagerForm value={userId} handler={handleContactManagerChange} />
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button type='submit' onClick={handleSubmit(handleSave)} loading={isSubmitting} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default EditContactInfo;
