import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages } from '@rocket.chat/models';
import type { DeleteResult } from 'mongodb';

import { FileUpload } from '../../app/file-upload/server';
import { deleteMessageValidatingPermission } from '../../app/lib/server/functions/deleteMessage';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteFileMessage(fileID: string): Promise<void | DeleteResult>;
	}
}

Meteor.methods<ServerMethods>({
	async deleteFileMessage(fileID) {
		check(fileID, String);

		const msg = await Messages.getMessageByFileId(fileID);
		const userId = Meteor.userId();
		if (msg && userId) {
			return deleteMessageValidatingPermission(msg, userId);
		}

		return FileUpload.getStore('Uploads').deleteById(fileID);
	},
});
