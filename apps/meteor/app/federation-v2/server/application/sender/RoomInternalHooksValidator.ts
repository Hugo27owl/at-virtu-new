import { IRoom, isDirectMessageRoom, isRoomFederated, isUserFederated, IUser } from '@rocket.chat/core-typings';

import { FederatedRoom } from '../../domain/FederatedRoom';
import { FederatedUser } from '../../domain/FederatedUser';
import { IFederationBridge } from '../../domain/IFederationBridge';
import { RocketChatRoomAdapter } from '../../infrastructure/rocket-chat/adapters/Room';
import { RocketChatSettingsAdapter } from '../../infrastructure/rocket-chat/adapters/Settings';
import { RocketChatUserAdapter } from '../../infrastructure/rocket-chat/adapters/User';
import { FederationService } from '../AbstractFederationService';

export class FederationRoomInternalHooksValidator extends FederationService {
	constructor(
		protected internalRoomAdapter: RocketChatRoomAdapter,
		protected internalUserAdapter: RocketChatUserAdapter,
		protected internalSettingsAdapter: RocketChatSettingsAdapter,
		protected bridge: IFederationBridge,
	) {
		super(bridge, internalUserAdapter, internalSettingsAdapter);
	}

	public async canAddFederatedUserToNonFederatedRoom(internalUser: IUser | string, internalRoom: IRoom): Promise<void> {
		if (this.isAddingANewExternalUser(internalUser)) {
			return;
		}

		if (isRoomFederated(internalRoom)) {
			return;
		}

		const user = await this.internalUserAdapter.getFederatedUserByInternalId((internalUser as IUser)._id);
		const isAFederatedUser = user && user.isRemote();
		if (isAFederatedUser) {
			throw new Error('error-cant-add-federated-users');
		}
	}

	public async canAddFederatedUserToFederatedRoom(
		internalUser: IUser | string,
		internalInviter: IUser,
		internalRoom: IRoom,
	): Promise<void> {
		if (!isRoomFederated(internalRoom)) {
			return;
		}
		if (this.isAddingANewExternalUser(internalUser)) {
			throw new Error('error-this-is-an-ee-feature');
		}

		const inviter = await this.internalUserAdapter.getFederatedUserByInternalId(internalInviter._id);
		const externalRoom = await this.internalRoomAdapter.getFederatedRoomByInternalId(internalRoom._id);
		if (!externalRoom || !inviter) {
			return;
		}

		const isRoomFromTheProxyServer = FederatedRoom.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(externalRoom.getExternalId()),
			this.internalHomeServerDomain,
		);
		const isInviterFromTheProxyServer = FederatedUser.isOriginalFromTheProxyServer(
			this.bridge.extractHomeserverOrigin(inviter.getExternalId()),
			this.internalHomeServerDomain,
		);
		const fullActionExecutedOnTheRemoteHomeServer = !isRoomFromTheProxyServer && !isInviterFromTheProxyServer;
		if (fullActionExecutedOnTheRemoteHomeServer) {
			return;
		}

		const invitee = await this.internalUserAdapter.getFederatedUserByInternalId((internalUser as IUser)._id);
		const addingAnExternalUser = invitee && invitee.isRemote();
		const addingExternalUserToNonDirectMessageRoom = addingAnExternalUser && !isDirectMessageRoom(internalRoom);
		if (addingExternalUserToNonDirectMessageRoom) {
			throw new Error('error-this-is-an-ee-feature');
		}
	}

	public async canCreateDirectMessageFromUI(internalUsers: (IUser | string)[]): Promise<void> {
		const usernames: string[] = internalUsers.map((user) => {
			if (this.isAddingANewExternalUser(user)) {
				return user as string;
			}
			return (user as IUser).username || '';
		});
		const atLeastOneExternalUser =
			usernames.some(
				(username) =>
					!FederatedUser.isOriginalFromTheProxyServer(this.bridge.extractHomeserverOrigin(username), this.internalHomeServerDomain),
			) || internalUsers.filter((user) => !this.isAddingANewExternalUser(user)).some((user) => isUserFederated(user as IUser));
		if (atLeastOneExternalUser) {
			throw new Error('error-this-is-an-ee-feature');
		}
	}

	private isAddingANewExternalUser(user: IUser | string): boolean {
		return typeof user === 'string';
	}
}
