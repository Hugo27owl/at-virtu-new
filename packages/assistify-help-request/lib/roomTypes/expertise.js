/* globals openRoom */

import {RoomTypeConfig, RoomTypeRouteConfig} from 'meteor/rocketchat:lib';

class ExpertiseRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'expertise',
			path: '/expertise/:name'
		});
	}

	action(params) {
		return openRoom('e', params.name);
	}
}

export class ExpertiseRoomType extends RoomTypeConfig {
	constructor() {
		super({
			identifier: 'e',
			order: 15,
			template: 'expertise',
			icon: 'lightbulb',
			label: 'Expertises',
			route: new ExpertiseRoomRoute()
		});

		this.creationLabel = 'New_expertise';
		this.creationTemplate = 'AssistifyCreateExpertise';
	}

	findRoom(identifier) {
		const query = {
			t: 'e',
			name: identifier
		};
		return ChatRoom.findOne(query);
	}

	roomName(roomData) {
		return roomData.name;
	}

	condition() {
		return RocketChat.authz.hasAllPermission('view-p-room'); //todo: Own authorization
	}

	canBeDeleted(userId, room) {
		return RocketChat.authz.hasPermission(userId, 'delete-c', room._id);
	}
	includeInRoomSearch() {
		return true;
	}

	isGroupChat() {
		return true;
	}

	canAddUser() {
		return true;
	}

	userDetailShowAll() {
		return true;
	}

	userDetailShowAdmin() {
		return true;
	}

	preventRenaming() {
		return true; //renaming an expertise will lead to new requests not finding answers to the previously named expertise
	}
}

