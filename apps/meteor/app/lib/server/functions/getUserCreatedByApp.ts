import type { FindOptions } from 'mongodb';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { UserType } from '@rocket.chat/apps-engine/definition/users';

export async function getUserCreatedByApp(
	appId: string,
	type: UserType.BOT | UserType.APP,
	options?: FindOptions<IUser>,
): Promise<Array<IUser>> {
	const users = await Users.find({ appId, type }, options).toArray();
	return users ?? [];
}
