import { Meteor } from 'meteor/meteor';

import { RocketChatFile } from '../../../../server/services/file-handling/file';
import { FileUpload } from '../../../../server/services/file-handling/file-upload';
import { Rooms, Avatars, Messages } from '../../../../server/models';
import { api } from '../../../../server/sdk/api';

export const setRoomAvatar = function(rid, dataURI, user) {
	const fileStore = FileUpload.getStore('Avatars');

	const current = Avatars.findOneByRoomId(rid);

	if (!dataURI) {
		fileStore.deleteByRoomId(rid);
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_avatar', rid, '', user);
		api.broadcast('room.avatarUpdate', { _id: rid });

		return Rooms.unsetAvatarData(rid);
	}

	const fileData = RocketChatFile.dataURIParse(dataURI);

	const buffer = Buffer.from(fileData.image, 'base64');

	const file = {
		rid,
		type: fileData.contentType,
		size: buffer.length,
		uid: user._id,
	};

	fileStore.insert(file, buffer, (err, result) => {
		if (err) {
			throw err;
		}

		Meteor.setTimeout(function() {
			if (current) {
				fileStore.deleteById(current._id);
			}
			Rooms.setAvatarData(rid, 'upload', result.etag);
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_avatar', rid, '', user);
			api.broadcast('room.avatarUpdate', { _id: rid, avatarETag: result.etag });
		}, 500);
	});
};
