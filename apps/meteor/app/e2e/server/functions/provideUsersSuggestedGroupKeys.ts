import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';

export const provideUsersSuggestedGroupKeys = async (
	userId: IUser['_id'],
	usersSuggestedGroupKeys: Record<IRoom['_id'], { _id: IUser['_id']; key: string }[]>,
) => {
	const roomIds = Object.keys(usersSuggestedGroupKeys);

	if (!roomIds) {
		return;
	}

	// Process should try to process all rooms i have access instead of dying if one is not
	for await (const roomId of roomIds) {
		if (!(await canAccessRoomIdAsync(roomId, userId))) {
			continue;
		}

		const usersWithSuggestedKeys = [];
		for await (const user of usersSuggestedGroupKeys[roomId]) {
			const sub = await Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { projection: { _id: 1 } });
			if (!sub) {
				continue;
			}

			await Subscriptions.setGroupE2ESuggestedKey(sub._id, user.key);
			usersWithSuggestedKeys.push(user._id);
		}

		await Rooms.removeUsersFromE2EEQueueByRoomId(roomId, usersWithSuggestedKeys);
	}
};
