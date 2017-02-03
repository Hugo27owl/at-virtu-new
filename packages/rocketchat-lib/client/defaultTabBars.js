RocketChat.TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'message-search',
	i18nTitle: 'Search',
	icon: 'icon-search',
	template: 'messageSearch',
	order: 1
});

RocketChat.TabBar.addButton({
	groups: ['direct'],
	id: 'user-info',
	i18nTitle: 'User_Info',
	icon: 'icon-user',
	template: 'membersList',
	order: 2
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'group'],
	id: 'members-list',
	i18nTitle: 'Members_List',
	icon: 'icon-users',
	template: 'membersList',
	order: 2
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'group', 'direct'],
	id: 'uploaded-files-list',
	i18nTitle: 'Room_uploaded_file_list',
	icon: 'icon-attach',
	template: 'uploadedFilesList',
	order: 3
});

RocketChat.TabBar.addButton({
	groups: ['channel', 'privategroup', 'directmessage'],
	id: 'keyboard-shortcut-list',
	i18nTitle: 'Keyboard_Shortcuts.Title',
	icon: 'icon-keyboard',
	template: 'keyboardShortcuts',
	order: 4
});