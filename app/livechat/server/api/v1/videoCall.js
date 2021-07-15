import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Random } from 'meteor/random';

import { settings as rcSettings } from '../../../../settings';
import { API } from '../../../../api/server';
import { findGuest, getRoom, settings } from '../lib/livechat';

API.v1.addRoute('livechat/video.call/:token', {
	get() {
		try {
			check(this.urlParams, {
				token: String,
			});

			check(this.queryParams, {
				rid: Match.Maybe(String),
			});

			const { token } = this.urlParams;

			const guest = findGuest(token);
			if (!guest) {
				throw new Meteor.Error('invalid-token');
			}

			const rid = this.queryParams.rid || Random.id();
			const roomInfo = { jitsiTimeout: new Date(Date.now() + 3600 * 1000) };
			const { room } = getRoom({ guest, rid, roomInfo });
			const config = settings();
			if (!config.theme || !config.theme.actionLinks) {
				throw new Meteor.Error('invalid-livechat-config');
			}

			let rname;
			if (rcSettings.get('Jitsi_URL_Room_Hash')) {
				rname = rcSettings.get('uniqueID') + rid;
			} else {
				rname = encodeURIComponent(room.t === 'd' ? room.usernames.join(' x ') : room.name);
			}
			const videoCall = {
				rid,
				domain: rcSettings.get('Jitsi_Domain'),
				provider: 'jitsi',
				room: rcSettings.get('Jitsi_URL_Room_Prefix') + rname + rcSettings.get('Jitsi_URL_Room_Suffix'),
				timeout: new Date(Date.now() + 3600 * 1000),
			};

			return API.v1.success({ videoCall });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
