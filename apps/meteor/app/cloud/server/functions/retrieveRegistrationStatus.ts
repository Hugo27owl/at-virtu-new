import { Settings, Users } from '@rocket.chat/models';

import { settings } from '../../../settings/server';

export async function retrieveRegistrationStatus(): Promise<{
	workspaceRegistered: boolean;
	workspaceId: string;
	uniqueId: string;
	token: string;
	email: string;
}> {
	const workspaceId = ((await Settings.getValueById('Cloud_Workspace_Id')) || '') as string;

	const info = {
		workspaceRegistered: !!settings.get('Cloud_Workspace_Client_Id') && !!settings.get('Cloud_Workspace_Client_Secret'),
		workspaceId,
		uniqueId: settings.get<string>('uniqueID'),
		token: '',
		email: settings.get<string>('Organization_Email') || '',
	};

	if (!info.email) {
		const firstUser = await Users.getOldest({ projection: { emails: 1 } });
		info.email = firstUser?.emails?.[0]?.address || info.email;
	}

	return info;
}
