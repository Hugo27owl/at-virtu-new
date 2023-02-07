import type { AppPermission } from '@rocket.chat/core-typings';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import AppPermissionsList from '../../components/AppPermissionsList';

type AppSecurityProps = {
	privacyPolicySummary?: string;
	appPermissions?: AppPermission[];
	tosLink?: string;
	privacyLink?: string;
};

const AppSecurity = ({ privacyPolicySummary, appPermissions, tosLink, privacyLink }: AppSecurityProps): ReactElement => {
	const t = useTranslation();

	return (
		<Box maxWidth='x640' w='full' marginInline='auto' color='default'>
			<Box display='flex' flexDirection='column'>
				<Margins block='x17'>
					<Box is='section'>
						<Box fontScale='h4' mbe='x8' color='title-labels'>
							{t('Privacy_summary')}
						</Box>
						<Box is='p' lineHeight='x20'>
							{privacyPolicySummary?.length && privacyPolicySummary}
						</Box>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8' color='title-labels'>
							{t('Permissions')}
						</Box>
						<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} mis='x24'>
							<AppPermissionsList appPermissions={appPermissions} />
						</Box>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8' color='title-labels'>
							{t('Policies')}
						</Box>
						<Box display='flex' flexDirection='column'>
							{tosLink && (
								<Box is='a' href={tosLink} target='_blank'>
									{t('Terms_of_use')}
								</Box>
							)}
							{privacyLink && (
								<Box is='a' href={privacyLink} target='_blank'>
									{t('Privacy_policy')}
								</Box>
							)}
						</Box>
					</Box>
				</Margins>
			</Box>
		</Box>
	);
};

export default AppSecurity;
