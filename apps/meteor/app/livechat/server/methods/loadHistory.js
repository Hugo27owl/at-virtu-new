import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';

import { loadMessageHistory } from '../../../lib';
import { LivechatRooms } from '../../../models/server';

Meteor.methods({
	async 'livechat:loadHistory'({ token, rid, end, limit = 20, ls }) {
		if (!token || typeof token !== 'string') {
			return;
		}

		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (!visitor) {
			throw new Meteor.Error('invalid-visitor', 'Invalid Visitor', {
				method: 'livechat:loadHistory',
			});
		}

		const room = LivechatRooms.findOneByIdAndVisitorToken(rid, token, { _id: 1 });
		if (!room) {
			throw new Meteor.Error('invalid-room', 'Invalid Room', { method: 'livechat:loadHistory' });
		}

		return loadMessageHistory({ userId: visitor._id, rid, end, limit, ls });
	},
});
