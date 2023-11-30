import { Button, ButtonGroup, ContextualbarIcon } from '@rocket.chat/fuselage';
import { usePermission, useRouteParameter, useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { is } from 'date-fns/locale';
import type { ReactElement } from 'react';
import React, { useEffect, useRef } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import { Contextualbar, ContextualbarHeader, ContextualbarTitle, ContextualbarClose } from '../../../components/Contextualbar';
import Page from '../../../components/Page';
import { useShouldPreventAction } from '../../../hooks/useShouldPreventAction';
import AdminInviteUsers from './AdminInviteUsers';
import AdminUserForm from './AdminUserForm';
import AdminUserFormWithData from './AdminUserFormWithData';
import AdminUserInfoWithData from './AdminUserInfoWithData';
import AdminUserUpgrade from './AdminUserUpgrade';
import UsersTable from './UsersTable';

const UsersPage = (): ReactElement => {
	const t = useTranslation();
	const seatsCap = useSeatsCap();
	const reload = useRef(() => null);

	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const canCreateUser = usePermission('create-user');
	const canBulkCreateUser = usePermission('bulk-register-user');

	const isCreateUserDisabled = useShouldPreventAction('activeUsers');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (isCreateUserDisabled && !['edit', 'info', 'upgrade'].includes(context)) {
			router.navigate('/admin/users');
		}

		if (!isCreateUserDisabled && context === 'upgrade') {
			router.navigate('/admin/users');
		}
	}, [router, context, seatsCap, isCreateUserDisabled]);

	const handleReload = (): void => {
		seatsCap?.reload();
		reload.current();
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
					{seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
						<UserPageHeaderContentWithSeatsCap {...seatsCap} />
					) : (
						<ButtonGroup>
							{canBulkCreateUser && (
								<Button icon='mail' onClick={() => router.navigate('/admin/users/invite')}>
									{t('Invite')}
								</Button>
							)}
							{canCreateUser && (
								<Button icon='user-plus' onClick={() => router.navigate('/admin/users/new')}>
									{t('New_user')}
								</Button>
							)}
						</ButtonGroup>
					)}
				</Page.Header>
				<Page.Content>
					<UsersTable reload={reload} />
				</Page.Content>
			</Page>
			{context && (
				<Contextualbar is='aside' aria-labelledby=''>
					<ContextualbarHeader>
						{context === 'upgrade' && <ContextualbarIcon name='user-plus' />}
						<ContextualbarTitle>
							{context === 'info' && t('User_Info')}
							{context === 'edit' && t('Edit_User')}
							{context === 'new' && t('Add_User')}
							{context === 'invite' && t('Invite_Users')}
							{context === 'upgrade' && t('New_user')}
						</ContextualbarTitle>
						<ContextualbarClose onClick={() => router.navigate('/admin/users')} />
					</ContextualbarHeader>
					{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} />}
					{context === 'edit' && id && <AdminUserFormWithData uid={id} onReload={handleReload} />}
					{context === 'new' && <AdminUserForm onReload={handleReload} />}
					{context === 'invite' && <AdminInviteUsers />}
					{context === 'upgrade' && <AdminUserUpgrade />}
				</Contextualbar>
			)}
		</Page>
	);
};

export default UsersPage;
