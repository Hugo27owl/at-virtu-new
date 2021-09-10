import _ from 'underscore';
import type ldapjs from 'ldapjs';
import { Meteor } from 'meteor/meteor';

import { ILDAPEntry } from '../../../../definition/ldap/ILDAPEntry';
import type { IUser } from '../../../../definition/IUser';
import type { IRoom, ICreatedRoom } from '../../../../definition/IRoom';
import type { IRole } from '../../../../definition/IRole';
import { IImportUser } from '../../../../app/importer/server/definitions/IImportUser';
import { ImporterAfterImportCallback } from '../../../../app/importer/server/definitions/IConversionCallbacks';
import { settings } from '../../../../app/settings/server';
import { Users, Roles, Rooms, Subscriptions } from '../../../../app/models/server';
import { LDAPDataConverter } from '../../../../server/lib/ldap/DataConverter';
import type { LDAPConnection } from '../../../../server/lib/ldap/Connection';
import { LDAPManager } from '../../../../server/lib/ldap/Manager';
import { logger } from '../../../../server/lib/ldap/Logger';
import { templateVarHandler } from '../../../../app/utils/lib/templateVarHandler';
import { LDAPEEConnection } from './Connection';
import { RocketChatFile } from '../../../../app/file';
import { FileUpload } from '../../../../app/file-upload/server';
import { api } from '../../../../server/sdk/api';
import { addUserToRoom, removeUserFromRoom, createRoom } from '../../../../app/lib/server/functions';
import { Team } from '../../../../server/sdk';

export class LDAPEEManager extends LDAPManager {
	public static async sync(): Promise<void> {
		if (settings.get('LDAP_Enable') !== true) {
			return;
		}

		const options = this.getConverterOptions();
		const ldap = new LDAPEEConnection();
		const converter = new LDAPDataConverter(true, options);

		try {
			await ldap.connect();

			try {
				const createNewUsers = settings.getAs<boolean>('LDAP_Background_Sync_Import_New_Users');
				const updateExistingUsers = settings.getAs<boolean>('LDAP_Background_Sync_Keep_Existant_Users_Updated');

				if (createNewUsers) {
					await this.importNewUsers(ldap, converter, updateExistingUsers);
				} else if (updateExistingUsers) {
					await this.updateExistingUsers(ldap, converter);
				}
			} finally {
				ldap.disconnect();
			}

			converter.convertUsers({
				afterImportFn: ((data: IImportUser, _type: string, isNewRecord: boolean): void => Promise.await(this.advancedSync(ldap, data, converter, isNewRecord))) as ImporterAfterImportCallback,
			});
		} catch (error) {
			logger.error(error);
		}
	}

	public static validateLDAPTeamsMappingChanges(json: string): void {
		if (!json) {
			return;
		}

		const mustBeAnArrayOfStrings = (array: Array<string>): boolean => Boolean(Array.isArray(array) && array.length && array.every((item) => typeof item === 'string'));
		const mappedTeams = this.parseJson(json);
		if (!mappedTeams) {
			return;
		}

		const mappedRocketChatTeams = Object.values(mappedTeams);
		const validStructureMapping = mappedRocketChatTeams.every(mustBeAnArrayOfStrings);
		if (!validStructureMapping) {
			throw new Error('Please verify your mapping for LDAP X RocketChat Teams. The structure is invalid, the structure should be an object like: {key: LdapTeam, value: [An array of rocket.chat teams]}');
		}
	}

	private static async advancedSync(ldap: LDAPConnection, importUser: IImportUser, converter: LDAPDataConverter, isNewRecord: boolean): Promise<void> {
		const user = converter.findExistingUser(importUser);
		if (!user || user.username) {
			return;
		}

		const dn = importUser.importIds[0];
		await this.syncUserRoles(ldap, user, dn);
		await this.syncUserChannels(ldap, user, dn);
		await this.syncUserTeams(ldap, user, isNewRecord);
	}

	private static async isUserInGroup(ldap: LDAPConnection, { dn, username }: { dn: string; username: string }, groupName: string): Promise<boolean> {
		const syncUserRolesFilter = settings.getAs<string>('LDAP_Sync_User_Data_Groups_Filter').trim();
		const syncUserRolesBaseDN = settings.getAs<string>('LDAP_Sync_User_Data_Groups_BaseDN').trim();

		if (!syncUserRolesFilter || !syncUserRolesBaseDN) {
			logger.error('Please setup LDAP Group Filter and LDAP Group BaseDN in LDAP Settings.');
			return false;
		}
		const searchOptions: ldapjs.SearchOptions = {
			filter: syncUserRolesFilter.replace(/#{username}/g, username).replace(/#{groupName}/g, groupName).replace(/#{userdn}/g, dn),
			scope: 'sub',
		};

		const result = await ldap.searchRaw(syncUserRolesBaseDN, searchOptions);
		if (!Array.isArray(result) || result.length === 0) {
			logger.debug(`${ username } is not in ${ groupName } group!!!`);
		} else {
			logger.debug(`${ username } is in ${ groupName } group.`);
			return true;
		}

		return false;
	}

	private static parseJson(json: string): Record<string, any> | undefined {
		try {
			return JSON.parse(json);
		} catch (err) {
			logger.error(`Unexpected error : ${ err.message }`);
		}
	}

	private static broadcastRoleChange(type: string, _id: string, uid: string, username: string): void {
		// #ToDo: would be better to broadcast this only once for all users and roles, or at least once by user.
		if (!settings.get('UI_DisplayRoles')) {
			return;
		}

		api.broadcast('user.roleUpdate', {
			type,
			_id,
			u: {
				_id: uid,
				username,
			},
		});
	}

	private static async syncUserRoles(ldap: LDAPConnection, user: IUser, dn: string): Promise<void> {
		const syncUserRoles = settings.getAs<boolean>('LDAP_Sync_User_Data_Groups');
		const syncUserRolesAutoRemove = settings.getAs<boolean>('LDAP_Sync_User_Data_Groups_AutoRemove');
		const syncUserRolesFieldMap = settings.getAs<string>('LDAP_Sync_User_Data_GroupsMap').trim();

		if (!syncUserRoles || !syncUserRolesFieldMap) {
			logger.debug('not syncing user roles');
			return;
		}

		const roles = Roles.find({}, {
			fields: {
				_updatedAt: 0,
			},
		}).fetch();

		if (!roles) {
			return;
		}

		const fieldMap = this.parseJson(syncUserRolesFieldMap);
		if (!fieldMap) {
			return;
		}

		const username = user.username as string;
		for (const ldapField in fieldMap) {
			if (!fieldMap.hasOwnProperty(ldapField)) {
				continue;
			}

			const userField = fieldMap[ldapField];

			const [roleName] = userField.split(/\.(.+)/);
			if (!_.find<IRole>(roles, (el) => el._id === roleName)) {
				logger.debug(`User Role doesn't exist: ${ roleName }`);
				continue;
			}

			logger.debug(`User role exists for mapping ${ ldapField } -> ${ roleName }`);

			if (this.isUserInGroup(ldap, { dn, username }, ldapField)) {
				if (Roles.addUserRoles(user._id, roleName)) {
					this.broadcastRoleChange('added', roleName, user._id, username);
				}
				logger.info(`Synced user group ${ roleName } from LDAP for ${ user.username }`);
				continue;
			}

			if (!syncUserRolesAutoRemove) {
				continue;
			}

			if (Roles.removeUserRoles(user._id, roleName)) {
				this.broadcastRoleChange('removed', roleName, user._id, username);
			}
		}
	}

	private static createRoomForSync(channel: string): IRoom | undefined {
		logger.info(`Channel '${ channel }' doesn't exist, creating it.`);

		const roomOwner = settings.get('LDAP_Sync_User_Data_Groups_AutoChannels_Admin') || '';
		// #ToDo: Remove typecastings when createRoom is converted to ts.
		const room = createRoom('c', channel, roomOwner, [], false, { customFields: { ldap: true } } as any) as unknown as ICreatedRoom | undefined;
		if (!room?.rid) {
			logger.error(`Unable to auto-create channel '${ channel }' during ldap sync.`);
			return;
		}

		room._id = room.rid;
		return room;
	}

	private static async syncUserChannels(ldap: LDAPConnection, user: IUser, dn: string): Promise<void> {
		const syncUserChannels = settings.getAs<boolean>('LDAP_Sync_User_Data_Groups_AutoChannels');
		const syncUserChannelsRemove = settings.getAs<boolean>('LDAP_Sync_User_Data_Groups_Enforce_AutoChannels');
		const syncUserChannelsFieldMap = settings.getAs<string>('LDAP_Sync_User_Data_Groups_AutoChannelsMap').trim();

		if (!syncUserChannels || !syncUserChannelsFieldMap) {
			logger.debug('not syncing groups to channels');
			return;
		}

		const fieldMap = this.parseJson(syncUserChannelsFieldMap);
		if (!fieldMap) {
			return;
		}

		const username = user.username as string;
		_.map(fieldMap, (channels, ldapField) => {
			if (!Array.isArray(channels)) {
				channels = [channels];
			}

			for (const channel of channels) {
				const room: IRoom | undefined = Rooms.findOneByNonValidatedName(channel) || this.createRoomForSync(channel);
				if (!room) {
					continue;
				}

				if (this.isUserInGroup(ldap, { dn, username }, ldapField)) {
					if (room.teamMain) {
						logger.error(`Can't add user to channel ${ channel } because it is a team.`);
					} else {
						addUserToRoom(room._id, user);
						logger.info(`Synced user channel ${ room._id } from LDAP for ${ username }`);
					}
				} else if (syncUserChannelsRemove && !room.teamMain) {
					const subscription = Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
					if (subscription) {
						removeUserFromRoom(room._id, user);
					}
				}
			}
		});
	}

	private static async syncUserTeams(ldap: LDAPConnection, user: IUser, isNewRecord: boolean): Promise<void> {
		if (!user.username) {
			return;
		}

		const mapTeams = settings.getAs<boolean>('LDAP_Enable_LDAP_Groups_To_RC_Teams') && (isNewRecord || settings.getAs<boolean>('LDAP_Validate_Teams_For_Each_Login'));
		if (!mapTeams) {
			return;
		}

		const ldapUserTeams = await this.getLdapTeamsByUsername(ldap, user.username);
		const map = this.parseJson(settings.getAs<string>('LDAP_Groups_To_Rocket_Chat_Teams')) as Record<string, string>;
		if (!map) {
			return;
		}

		const teamNames = this.getRocketChatTeamsByLdapTeams(map, ldapUserTeams);

		const allTeamNames = [...new Set(Object.values(map).flat())];
		const allTeams = await Team.listByNames(allTeamNames, { projection: { _id: 1, name: 1 } });

		const inTeamIds = allTeams.filter(({ name }) => teamNames.includes(name)).map(({ _id }) => _id);
		const notInTeamIds = allTeams.filter(({ name }) => !teamNames.includes(name)).map(({ _id }) => _id);

		const currentTeams = await Team.listTeamsBySubscriberUserId(user._id, { projection: { teamId: 1 } });
		const currentTeamIds = currentTeams && currentTeams.map(({ teamId }) => teamId);
		const teamsToRemove = currentTeamIds && currentTeamIds.filter((teamId) => notInTeamIds.includes(teamId));
		const teamsToAdd = inTeamIds.filter((teamId) => !currentTeamIds?.includes(teamId));

		await Team.insertMemberOnTeams(user._id, teamsToAdd);
		if (teamsToRemove) {
			await Team.removeMemberFromTeams(user._id, teamsToRemove);
		}
	}

	private static getRocketChatTeamsByLdapTeams(mappedTeams: Record<string, string>, ldapUserTeams: Array<string>): Array<string> {
		const mappedLdapTeams = Object.keys(mappedTeams);
		const filteredTeams = ldapUserTeams.filter((ldapTeam) => mappedLdapTeams.includes(ldapTeam));

		if (filteredTeams.length < ldapUserTeams.length) {
			const unmappedLdapTeams = ldapUserTeams.filter((ldapTeam) => !mappedLdapTeams.includes(ldapTeam));
			logger.error(`The following LDAP teams are not mapped in Rocket.Chat: "${ unmappedLdapTeams.join(', ') }".`);
		}

		if (!filteredTeams.length) {
			return [];
		}

		return [...new Set(filteredTeams.map((ldapTeam) => mappedTeams[ldapTeam]).flat())];
	}

	private static async getLdapTeamsByUsername(ldap: LDAPConnection, username: string): Promise<Array<string>> {
		const searchOptions = {
			filter: settings.getAs<string>('LDAP_Query_To_Get_User_Teams').replace('/#{username}/g', username),
			scope: ldap.options.userSearchScope || 'sub',
			sizeLimit: ldap.options.searchSizeLimit,
		};

		const ldapUserGroups = await ldap.searchRaw(ldap.options.baseDN, searchOptions);
		if (!Array.isArray(ldapUserGroups)) {
			return [];
		}

		return ldapUserGroups.filter((entry) => entry?.raw?.ou).map((entry) => (ldap.extractLdapAttribute(entry.raw.ou) as string)).flat();
	}

	public static copyActiveState(ldapUser: ILDAPEntry, userData: IImportUser): void {
		if (!ldapUser) {
			return;
		}

		const syncUserState = settings.get('LDAP_Sync_User_Active_State');
		if (syncUserState === 'none') {
			return;
		}

		const deleted = Boolean(ldapUser.pwdAccountLockedTime);
		if (deleted === userData.deleted || (userData.deleted === undefined && !deleted)) {
			return;
		}

		if (syncUserState === 'disable' && !deleted) {
			return;
		}

		userData.deleted = deleted;
		logger.info(`${ deleted ? 'Deactivating' : 'Activating' } user ${ userData.name } (${ userData.username })`);
	}

	public static copyCustomFields(ldapUser: ILDAPEntry, userData: IImportUser): void {
		if (!settings.getAs<boolean>('LDAP_Sync_Custom_Fields')) {
			return;
		}

		const customFieldsSettings = settings.getAs<string>('Accounts_CustomFields');
		const customFieldsMap = settings.getAs<string>('LDAP_CustomFieldMap');

		if (!customFieldsMap || !customFieldsSettings) {
			if (customFieldsMap) {
				logger.info('Skipping LDAP custom fields because there are no custom fields configured.');
			}
			return;
		}

		let map: Record<string, string>;
		try {
			map = JSON.parse(customFieldsMap) as Record<string, string>;
		} catch (error) {
			logger.error('Failed to parse LDAP Custom Fields mapping');
			logger.error(error);
			return;
		}

		let customFields: Record<string, any>;
		try {
			customFields = JSON.parse(customFieldsSettings) as Record<string, any>;
		} catch (error) {
			logger.error('Failed to parse Custom Fields');
			logger.error(error);
			return;
		}

		_.map(map, (userField, ldapField) => {
			if (!this.getCustomField(customFields, userField)) {
				logger.debug(`User attribute does not exist: ${ userField }`);
				return;
			}

			if (!userData.customFields) {
				userData.customFields = {};
			}

			const value = templateVarHandler(ldapField, ldapUser);

			if (value) {
				let ref: Record<string, any> = userData.customFields;
				const attributeNames = userField.split('.');
				let previousKey: string | undefined;

				for (const key of attributeNames) {
					if (previousKey) {
						if (ref[previousKey] === undefined) {
							ref[previousKey] = {};
						} else if (typeof ref[previousKey] !== 'object') {
							logger.error(`Failed to assign custom field: ${ userField }`);
							return;
						}

						ref = ref[previousKey];
					}

					previousKey = key;
				}

				if (previousKey) {
					ref[previousKey] = value;
					logger.debug(`user.customFields.${ userField } changed to: ${ value }`);
				}
			}
		});
	}

	public static syncUserAvatar(user: IUser, ldapUser: ILDAPEntry): void {
		if (!user?._id || settings.get('LDAP_Sync_User_Avatar') !== true) {
			return;
		}

		const avatar = this.getAvatarFromUser(ldapUser);
		logger.info('Syncing user avatar');

		Meteor.defer(() => {
			const rs = RocketChatFile.bufferToStream(avatar);
			const fileStore = FileUpload.getStore('Avatars');
			fileStore.deleteByName(user.username);

			const file = {
				userId: user._id,
				type: 'image/jpeg',
				size: avatar.length,
			};

			Meteor.runAsUser(user._id, () => {
				fileStore.insert(file, rs, (_err: Error | undefined, result: { etag: string }) => {
					if (!result) {
						return;
					}

					Meteor.setTimeout(function() {
						Users.setAvatarData(user._id, 'ldap', result.etag);
						api.broadcast('user.avatarUpdate', { username: user.username, avatarETag: result.etag });
					}, 500);
				});
			});
		});
	}

	private static async importNewUsers(ldap: LDAPConnection, converter: LDAPDataConverter, updateExistingUsers: boolean): Promise<void> {
		return new Promise((resolve, reject) => {
			let count = 0;

			ldap.searchAllUsers<IImportUser>({
				entryCallback: (entry: ldapjs.SearchEntry): IImportUser | undefined => {
					const data = ldap.extractLdapEntryData(entry);
					count++;

					if (!updateExistingUsers) {
						const existingUser = this.findExistingLDAPUser(data);
						if (existingUser) {
							return;
						}
					}

					const userData = this.mapUserData(data);
					converter.addUser(userData);
					return userData;
				},
				endCallback: (error: any): void => {
					if (error) {
						logger.error(error);
						reject(error);
						return;
					}

					logger.info('LDAP finished importing. New users imported:', count);
					resolve();
				},
			});
		});
	}

	private static async updateExistingUsers(ldap: LDAPConnection, converter: LDAPDataConverter): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const users = Users.findLDAPUsers();

				users.forEach(async (user: IUser) => {
					let ldapUser: ILDAPEntry | undefined;

					if (user.services?.ldap?.id) {
						ldapUser = await ldap.findOneById(user.services.ldap.id, user.services.ldap.idAttribute);
					} else if (user.username) {
						ldapUser = await ldap.findOneByUsername(user.username);
					}

					if (ldapUser) {
						const userData = this.mapUserData(ldapUser, user.username);
						converter.addUser(userData);
					} else {
						// Do something when the user is not found ?
					}

					// #ToDo: Sync active state
				});

				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	private static getCustomField(customFields: Record<string, any>, property: string): any {
		try {
			return _.reduce(property.split('.'), (acc, el) => acc[el], customFields);
		} catch {
			// ignore errors
		}
	}

	private static getAvatarFromUser(ldapUser: ILDAPEntry): any | undefined {
		const avatarField = String(settings.get('LDAP_Avatar_Field') || '').trim();
		if (avatarField && ldapUser._raw[avatarField]) {
			return ldapUser._raw[avatarField];
		}

		if (ldapUser._raw.thumbnailPhoto) {
			return ldapUser._raw.thumbnailPhoto;
		}

		if (ldapUser._raw.jpegPhoto) {
			return ldapUser._raw.jpegPhoto;
		}
	}
}
