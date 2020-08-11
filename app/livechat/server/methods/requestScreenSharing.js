import { Meteor } from 'meteor/meteor';

import { ScreensharingManager } from '../lib/screenSharing/ScreenSharingManager';

Meteor.methods({
	async 'livechat:requestScreenSharing'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:requestScreenSharing' });
		}

		const user = Meteor.user();

		ScreensharingManager.requestSession(roomId, user, 'agent');
	},
});

Meteor.methods({
	async 'livechat:endScreenSharingSession'(roomId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:endScreenSharingSession' });
		}

		const user = Meteor.user();

		ScreensharingManager.endSession(roomId, user);
	},
});
