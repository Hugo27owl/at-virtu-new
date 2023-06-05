import { Moderation } from '@rocket.chat/core-services';

import { settings } from '../../settings/server';
import { DEFAULT_TRUST_ROLES } from '../lib/permissions';
import { addRoleEditRestriction } from '../lib/addRoleEditRestriction';

settings.watch('Trust_Roles', async (value) => {
	if (value === true) {
		await Promise.all(
			DEFAULT_TRUST_ROLES.map(async (role) => {
				await Moderation.addPermissionsToRole(role._id, role.permission);
			}),
		);
		addRoleEditRestriction();
	}

	if (value === false) {
		try {
			await Moderation.resetUserRoles(DEFAULT_TRUST_ROLES.map((role) => role._id));
		} catch (error) {
			console.error('An error occurred, while deleting trust roles:', error);
		}
	}

	return value;
});
