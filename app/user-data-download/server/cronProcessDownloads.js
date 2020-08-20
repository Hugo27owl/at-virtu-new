import fs from 'fs';
import util from 'util';
import path from 'path';

import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { SyncedCron } from 'meteor/littledata:synced-cron';
import archiver from 'archiver';
import moment from 'moment';

import { settings } from '../../settings/server';
import { Subscriptions, Rooms, Users, Uploads, Messages, UserDataFiles, ExportOperations, Avatars } from '../../models/server';
import { FileUpload } from '../../file-upload/server';
import * as Mailer from '../../mailer';

const fsStat = util.promisify(fs.stat);
const fsOpen = util.promisify(fs.open);
const fsExists = util.promisify(fs.exists);
const fsUnlink = util.promisify(fs.unlink);

let zipFolder = '/tmp/zipFiles';
if (settings.get('UserData_FileSystemZipPath') != null) {
	if (settings.get('UserData_FileSystemZipPath').trim() !== '') {
		zipFolder = settings.get('UserData_FileSystemZipPath');
	}
}

let processingFrequency = 2;
if (settings.get('UserData_ProcessingFrequency') > 0) {
	processingFrequency = settings.get('UserData_ProcessingFrequency');
}

const startFile = function(fileName, content) {
	fs.writeFileSync(fileName, content);
};

const writeToFile = function(fileName, content) {
	fs.appendFileSync(fileName, content);
};

const createDir = function(folderName) {
	if (!fs.existsSync(folderName)) {
		fs.mkdirSync(folderName, { recursive: true });
	}
};

export const getRoomData = (roomId) => {
	const roomData = Rooms.findOneById(roomId);

	if (!roomData) {
		return {};
	}

	const roomName = roomData.name && roomData.t !== 'd' ? roomData.name : roomId;
	const [userId] = roomData.t === 'd' ? roomData.uids.filter((uid) => uid !== userId) : [null];

	return {
		roomId,
		roomName,
		userId,
		exportedCount: 0,
		status: 'pending',
		type: roomData.t,
	};
};

export const loadUserSubscriptions = function(exportOperation, fileType, userId) {
	const roomList = [];

	const cursor = Subscriptions.findByUserId(userId);
	cursor.forEach((subscription) => {
		const roomData = getRoomData(subscription.rid);
		const targetFile = `${ (fileType === 'json' && roomData.roomName) || subscription.rid }.${ fileType }`;

		roomList.push({
			...roomData,
			targetFile,
		});
	});

	return roomList;
};

const getAttachmentData = function(attachment, message) {
	const attachmentData = {
		type: attachment.type,
		title: attachment.title,
		title_link: attachment.title_link,
		image_url: attachment.image_url,
		audio_url: attachment.audio_url,
		video_url: attachment.video_url,
		message_link: attachment.message_link,
		image_type: attachment.image_type,
		image_size: attachment.image_size,
		video_size: attachment.video_size,
		video_type: attachment.video_type,
		audio_size: attachment.audio_size,
		audio_type: attachment.audio_type,
		url: null,
		remote: false,
		fileId: null,
		fileName: null,
	};

	const url = attachment.title_link || attachment.image_url || attachment.audio_url || attachment.video_url || attachment.message_link;
	if (url) {
		attachmentData.url = url;
	}

	if (message.file?._id) {
		attachmentData.fileId = message.file._id;
		attachmentData.fileName = message.file.name;
	} else {
		attachmentData.remote = true;
	}

	return attachmentData;
};

// const addToFileList = function(assetsPath, attachment) {
// 	return {
// 		url: attachment.url,
// 		copied: false,
// 		remote: attachment.remote,
// 		fileId: attachment.fileId,
// 		fileName: attachment.fileName,
// 		targetFile: path.join(assetsPath, `${ attachment.fileId }-${ attachment.fileName }`),
// 	};
// };

const hideUserName = function(username, userData, usersMap) {
	if (!usersMap.userNameTable) {
		usersMap.userNameTable = {};
	}

	if (!usersMap.userNameTable[username]) {
		if (userData && username === userData.username) {
			usersMap.userNameTable[username] = username;
		} else {
			usersMap.userNameTable[username] = `User_${ Object.keys(usersMap.userNameTable).length + 1 }`;
		}
	}

	return usersMap.userNameTable[username];
};

const getMessageData = function(msg, hideUsers, userData, usersMap) {
	const username = hideUsers ? hideUserName(msg.u.username || msg.u.name, userData, usersMap) : msg.u.username;

	const messageObject = {
		msg: msg.msg,
		username,
		ts: msg.ts,
		...msg.attachments && { attachments: msg.attachments.map((attachment) => getAttachmentData(attachment, msg)) },
	};

	if (msg.t) {
		messageObject.type = msg.t;

		switch (msg.t) {
			case 'uj':
				messageObject.msg = TAPi18n.__('User_joined_channel');
				break;
			case 'ul':
				messageObject.msg = TAPi18n.__('User_left');
				break;
			case 'au':
				messageObject.msg = TAPi18n.__('User_added_by', { user_added: hideUserName(msg.msg, userData, usersMap), user_by: username });
				break;
			case 'r':
				messageObject.msg = TAPi18n.__('Room_name_changed', { room_name: msg.msg, user_by: username });
				break;
			case 'ru':
				messageObject.msg = TAPi18n.__('User_removed_by', { user_removed: hideUserName(msg.msg, userData, usersMap), user_by: username });
				break;
			case 'wm':
				messageObject.msg = TAPi18n.__('Welcome', { user: username });
				break;
			case 'livechat-close':
				messageObject.msg = TAPi18n.__('Conversation_finished');
				break;
		}
	}

	return messageObject;
};

export const copyFile = function(attachmentData, assetsPath) {
	const file = Uploads.findOneById(attachmentData._id);
	console.log('copyFile', attachmentData._id, file);
	if (!file) {
		return;
	}
	FileUpload.copy(file, path.join(assetsPath, `${ attachmentData._id }-${ attachmentData.name }`));

	// if (attachmentData.copied || attachmentData.remote || !attachmentData.fileId) {
	// 	attachmentData.copied = true;
	// 	return;
	// }

	// const file = Uploads.findOneById(attachmentData.fileId);

	// if (file) {
	// 	if (FileUpload.copy(file, attachmentData.targetFile)) {
	// 		attachmentData.copied = true;
	// 	}
	// }
};

const exportMessageObject = (type, messageObject, messageFile) => {
	if (type === 'json') {
		return JSON.stringify(messageObject);
	}

	const file = [];

	const messageType = messageObject.type;
	const timestamp = messageObject.ts ? new Date(messageObject.ts).toUTCString() : '';

	const italicTypes = ['uj', 'ul', 'au', 'r', 'ru', 'wm', 'livechat-close'];

	const message = italicTypes.includes(messageType) ? `<i>${ messageObject.msg }</i>` : messageObject.msg;

	file.push(`<p><strong>${ messageObject.username }</strong> (${ timestamp }):<br/>`);
	file.push(message);

	if (messageFile?._id) {
		const attachment = messageObject.attachments.find((att) => att.type === 'file' && att.title_link.includes(messageFile._id));

		const description = attachment.description || attachment.title || TAPi18n.__('Message_Attachments');

		const assetUrl = `./assets/${ messageFile._id }-${ messageFile.name }`;
		const link = `<br/><a href="${ assetUrl }">${ description }</a>`;
		file.push(link);
	}

	file.push('</p>');

	return file.join('\n');
};

export async function exportRoomMessages(rid, exportType, skip, limit, assetsPath, exportOpRoomData, userData, usersMap = {}, hideUsers = true) {
	const cursor = Messages.model.rawCollection().find({ rid }, {
		sort: { ts: 1 },
		skip,
		limit,
	});

	const total = await cursor.count();
	const results = await cursor.toArray();

	const result = {
		total,
		exported: results.length,
		messages: [],
		uploads: [],
	};

	results.forEach(Meteor.bindEnvironment((msg) => {
		const messageObject = getMessageData(msg, hideUsers, userData, usersMap);

		if (msg.file) {
			result.uploads.push(msg.file);
		}

		result.messages.push(exportMessageObject(exportType, messageObject, msg.file));
	}));

	return result;
}

export const isExportComplete = function(exportOperation) {
	const incomplete = exportOperation.roomList.some((exportOpRoomData) => exportOpRoomData.status !== 'completed');

	return !incomplete;
};

// const isDownloadFinished = function(exportOperation) {
// 	const anyDownloadPending = exportOperation.fileList.some((fileData) => !fileData.copied && !fileData.remote);

// 	return !anyDownloadPending;
// };

export const sendEmail = function(userData, subject, body) {
	const emailAddress = `${ userData.name } <${ userData.emails[0].address }>`;
	const fromAddress = settings.get('From_Email');

	if (!Mailer.checkAddressFormat(emailAddress)) {
		return;
	}

	return Mailer.send({
		to: emailAddress,
		from: fromAddress,
		subject,
		html: body,
	});
};

export const makeZipFile = function(folderToZip, targetFile) {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(targetFile);

		const archive = archiver('zip');

		output.on('close', () => resolve());

		archive.on('error', (err) => reject(err));

		archive.pipe(output);
		archive.directory(folderToZip, false);
		archive.finalize();
	});
};

export const uploadZipFile = async function(filePath, userId, exportType) {
	const stat = await fsStat(filePath);

	const contentType = 'application/zip';
	const { size } = stat;

	const user = Users.findOneById(userId);
	let userDisplayName = userId;
	if (user) {
		userDisplayName = user.name || user.username || userId;
	}

	const utcDate = new Date().toISOString().split('T')[0];
	const fileSuffix = exportType === 'json' ? '-data' : '';

	const newFileName = encodeURIComponent(`${ utcDate }-${ userDisplayName }${ fileSuffix }.zip`);

	const details = {
		userId,
		type: contentType,
		size,
		name: newFileName,
	};

	const fd = await fsOpen(filePath);

	const stream = fs.createReadStream('', { fd });

	const userDataStore = FileUpload.getStore('UserDataFiles');

	const file = userDataStore.insertSync(details, stream);

	fs.close(fd);

	return file;
};

const generateChannelsFile = function(type, exportPath, exportOperation) {
	if (type !== 'json') {
		return;
	}

	const fileName = path.join(exportPath, 'channels.json');
	startFile(fileName,
		exportOperation.roomList.map((roomData) =>
			JSON.stringify({
				roomId: roomData.roomId,
				roomName: roomData.roomName,
				type: roomData.type,
			}),
		).join('\n'));
};

export const exportRoomMessagesToFile = async function(exportPath, assetsPath, exportType, roomList, userData, usersMap = {}, hideUsers = true) {
	createDir(exportPath);
	createDir(assetsPath);

	const result = {
		fileList: [],
	};

	const limit = settings.get('UserData_MessageLimitPerRequest') > 0 ? settings.get('UserData_MessageLimitPerRequest') : 1000;
	for (const exportOpRoomData of roomList) {
		const filePath = path.join(exportPath, exportOpRoomData.targetFile);
		if (exportOpRoomData.status === 'pending') {
			exportOpRoomData.status = 'exporting';
			startFile(filePath, exportType === 'html' ? '<meta http-equiv="content-type" content="text/html; charset=utf-8">' : '');
		}

		const skip = exportOpRoomData.exportedCount;

		const {
			total,
			exported,
			uploads,
			messages,
		// eslint-disable-next-line no-await-in-loop
		} = await exportRoomMessages(exportOpRoomData.roomId, exportType, skip, limit, assetsPath, exportOpRoomData, userData, usersMap, hideUsers);

		result.fileList.push(...uploads);

		exportOpRoomData.exportedCount += exported;

		if (total <= exported) {
			exportOpRoomData.status = 'completed';
		}

		writeToFile(filePath, `${ messages.join('\n') }\n`);
	}

	return result;
};

const generateUserFile = function(exportOperation, userData) {
	if (!userData) {
		return;
	}

	const { username, name, statusText, emails, roles, services } = userData;

	const dataToSave = {
		username,
		name,
		statusText,
		emails: _.pluck(emails, 'address'),
		roles,
		services: Object.keys(services),
	};

	const fileName = path.join(exportOperation.exportPath, exportOperation.fullExport ? 'user.json' : 'user.html');
	startFile(fileName, '');

	if (exportOperation.fullExport) {
		writeToFile(fileName, JSON.stringify(dataToSave));

		exportOperation.generatedUserFile = true;
		return;
	}

	writeToFile(fileName, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
	for (const key in dataToSave) {
		if (!dataToSave.hasOwnProperty(key)) {
			continue;
		}

		const value = dataToSave[key];

		writeToFile(fileName, `<p><strong>${ key }</strong>:`);
		if (typeof value === 'string') {
			writeToFile(fileName, value);
		} else if (Array.isArray(value)) {
			writeToFile(fileName, '<br/>');

			for (const item of value) {
				writeToFile(fileName, `${ item }<br/>`);
			}
		}

		writeToFile(fileName, '</p>');
	}
};

const generateUserAvatarFile = function(exportOperation, userData) {
	if (!userData) {
		return;
	}

	const file = Avatars.findOneByName(userData.username);
	if (!file) {
		return;
	}

	const filePath = path.join(exportOperation.exportPath, 'avatar');
	if (FileUpload.copy(file, filePath)) {
		exportOperation.generatedAvatar = true;
	}
};

const continueExportOperation = async function(exportOperation) {
	if (exportOperation.status === 'completed') {
		return;
	}

	const exportType = exportOperation.fullExport ? 'json' : 'html';

	if (!exportOperation.roomList) {
		exportOperation.roomList = loadUserSubscriptions(exportOperation, exportType, exportOperation.userId);

		if (exportOperation.fullExport) {
			exportOperation.status = 'exporting-rooms';
		} else {
			exportOperation.status = 'exporting';
		}
	}

	try {
		if (!exportOperation.generatedUserFile) {
			generateUserFile(exportOperation, exportOperation.userData);
		}

		if (!exportOperation.generatedAvatar) {
			generateUserAvatarFile(exportOperation, exportOperation.userData);
		}

		if (exportOperation.status === 'exporting-rooms') {
			generateChannelsFile(exportType, exportOperation.exportPath, exportOperation);

			exportOperation.status = 'exporting';
		}

		// Run every room on every request, to avoid missing new messages on the rooms that finished first.
		if (exportOperation.status === 'exporting') {
			const { fileList } = await exportRoomMessagesToFile(
				exportOperation.exportPath,
				exportOperation.assetsPath,
				exportOperation.exportType,
				exportOperation.roomList,
				exportOperation.userData,
				exportOperation.userNameTable,
			);
			exportOperation.fileList = fileList;

			if (isExportComplete(exportOperation)) {
				exportOperation.status = 'downloading';
			}
		}

		if (exportOperation.status === 'downloading') {
			exportOperation.fileList.forEach((attachmentData) => {
				copyFile(attachmentData, exportOperation.assetsPath);
			});

			const targetFile = path.join(zipFolder, `${ exportOperation.userId }.zip`);
			if (await fsExists(targetFile)) {
				await fsUnlink(targetFile);
			}

			exportOperation.status = 'compressing';
		}

		if (exportOperation.status === 'compressing') {
			createDir(zipFolder);

			exportOperation.generatedFile = path.join(zipFolder, `${ exportOperation.userId }.zip`);
			if (!await fsExists(exportOperation.generatedFile)) {
				await makeZipFile(exportOperation.exportPath, exportOperation.generatedFile);
			}

			exportOperation.status = 'uploading';
		}

		if (exportOperation.status === 'uploading') {
			const { _id: fileId } = await uploadZipFile(exportOperation.generatedFile, exportOperation.userId, exportType);
			exportOperation.fileId = fileId;

			exportOperation.status = 'completed';
			ExportOperations.updateOperation(exportOperation);
		}

		ExportOperations.updateOperation(exportOperation);
	} catch (e) {
		console.error(e);
	}
};

async function processDataDownloads() {
	const operation = ExportOperations.findOnePending();
	if (!operation) {
		return;
	}

	if (operation.status === 'completed') {
		return;
	}

	if (operation.status !== 'pending') {
		// If the operation has started but was not updated in over a day, then skip it
		if (operation._updatedAt && moment().diff(moment(operation._updatedAt), 'days') > 1) {
			operation.status = 'skipped';
			await ExportOperations.updateOperation(operation);
			return processDataDownloads();
		}
	}

	await continueExportOperation(operation);
	await ExportOperations.updateOperation(operation);

	if (operation.status === 'completed') {
		const file = operation.fileId ? UserDataFiles.findOneById(operation.fileId) : UserDataFiles.findLastFileByUser(operation.userId);
		if (!file) {
			return;
		}

		const subject = TAPi18n.__('UserDataDownload_EmailSubject');
		const body = TAPi18n.__('UserDataDownload_EmailBody', { download_link: file.url });

		sendEmail(operation.userData, subject, body);
	}
}

const name = 'Generate download files for user data';

Meteor.startup(function() {
	Meteor.defer(function() {
		let TroubleshootDisableDataExporterProcessor;
		settings.get('Troubleshoot_Disable_Data_Exporter_Processor', (key, value) => {
			if (TroubleshootDisableDataExporterProcessor === value) { return; }
			TroubleshootDisableDataExporterProcessor = value;

			if (value) {
				return SyncedCron.remove(name);
			}

			SyncedCron.add({
				name,
				schedule: (parser) => parser.cron(`*/${ processingFrequency } * * * *`),
				job: processDataDownloads,
			});
		});
	});
});
