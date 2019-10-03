import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { LivechatCustomField } from '../../../../models/server/raw';

export async function findCustomFields({ userId, pagination: { offset, count, sort } }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	const cursor = await LivechatCustomField.find({}, {
		sort: sort || { label: 1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const customFields = await cursor.toArray();

	return {
		customFields,
		count: customFields.length,
		offset,
		total,
	};
}

export async function findCustomFieldById({ userId, customFieldId }) {
	if (!await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}

	return {
		customField: await LivechatCustomField.findOneById(customFieldId),
	};
}
