import { Locator, Page } from '@playwright/test';

import { HomeFlextabMembers } from './home-flextab-members';
import { HomeFlextabRoom } from './home-flextab-room';

export class HomeFlextab {
	private readonly page: Page;

	readonly members: HomeFlextabMembers;

	readonly room: HomeFlextabRoom;

	constructor(page: Page) {
		this.page = page;
		this.members = new HomeFlextabMembers(page);
		this.room = new HomeFlextabRoom(page);
	}

	get btnTabMembers(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-members]');
	}

	get btnRoomInfo(): Locator {
		return this.page.locator('[data-qa-id=ToolBoxAction-info-circled]');
	}
}
