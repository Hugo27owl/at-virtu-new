import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo } from 'react';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../components/Skeleton';
import UserCard from '../../../components/UserCard';
import { UserStatus } from '../../../components/UserStatus';
import { useRoute } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { getUserEmailVerified } from '../../../lib/getUserEmailVerified';
import UserInfo from '../../room/contextualBar/UserInfo/UserInfo';
import { UserInfoActions } from './UserInfoActions';

export const UserInfoWithData = React.memo(({ uid, username, onChange, ...props }) => {
	const t = useTranslation();
	const usersRoute = useRoute('admin-users');
	const showRealNames = useSetting('UI_Use_Real_Name');
	const approveManuallyUsers = useSetting('Accounts_ManuallyApproveNewUsers');

	const { value: data, phase: state, error, reload } = useEndpointData(
		'users.info',
		useMemo(() => ({ ...(uid && { userId: uid }), ...(username && { username }) }), [
			uid,
			username,
		]),
	);

	const handleReload = useMutableCallback(() => reload());

	const handleUserChange = useMutableCallback((actionType) => {
		if (actionType === 'delete-user') {
			onChange();
			usersRoute.push({});
		} else {
			handleReload();
		}
	});

	const user = useMemo(() => {
		const { user } = data || { user: {} };
		const {
			name,
			username,
			roles = [],
			status,
			statusText,
			bio,
			utcOffset,
			lastLogin,
			nickname,
		} = user;
		return {
			name,
			username,
			lastLogin,
			showRealNames,
			roles: roles.map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			phone: user.phone,
			utcOffset,
			customFields: {
				...user.customFields,
				...(approveManuallyUsers &&
					user.active === false &&
					user.reason && { Reason: user.reason }),
			},
			verified: getUserEmailVerified(user),
			email: getUserEmailAddress(user),
			createdAt: user.createdAt,
			status: <UserStatus status={status} />,
			customStatus: statusText,
			nickname,
		};
	}, [approveManuallyUsers, data, showRealNames]);

	if (state === AsyncStatePhase.LOADING) {
		return (
			<Box p='x24'>
				<FormSkeleton />
			</Box>
		);
	}

	if (error) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	const admin = data.user?.roles?.includes('admin');

	return (
		<UserInfo
			{...user}
			data={data.user}
			onChange={handleReload}
			actions={
				data &&
				data.user && (
					<UserInfoActions
						isActive={data.user.active}
						isAdmin={admin}
						_id={data.user._id}
						username={data.user.username}
						onChange={handleUserChange}
					/>
				)
			}
			{...props}
		/>
	);
});
