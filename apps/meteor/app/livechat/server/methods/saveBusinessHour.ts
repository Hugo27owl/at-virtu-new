import type { ILivechatBusinessHourPayload } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { businessHourManager } from '../business-hour';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveBusinessHour'(businessHourData: ILivechatBusinessHourPayload): void;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveBusinessHour'(businessHourData) {
		try {
			await businessHourManager.saveBusinessHour(businessHourData);
		} catch (e) {
			throw new Meteor.Error(e instanceof Error ? e.message : String(e));
		}
	},
});
