// Note:
// 1.if we need to create a role that can only edit channel message, but not edit group message
// then we can define edit-<type>-message instead of edit-message
// 2. admin, moderator, and user roles should not be deleted as they are referenced in the code.
export const permissions = [
	{ _id: 'access-permissions', roles: ['admin'] },
	{ _id: 'access-marketplace', roles: ['admin', 'user'] },
	{ _id: 'access-setting-permissions', roles: ['admin'] },
	{ _id: 'add-oauth-service', roles: ['admin'] },
	{ _id: 'add-user-to-joined-room', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'add-user-to-any-c-room', roles: ['admin'] },
	{ _id: 'add-user-to-any-p-room', roles: [] },
	{ _id: 'kick-user-from-any-c-room', roles: ['admin'] },
	{ _id: 'kick-user-from-any-p-room', roles: [] },
	{ _id: 'api-bypass-rate-limit', roles: ['admin', 'bot', 'app'] },
	{ _id: 'archive-room', roles: ['admin', 'owner'] },
	{ _id: 'assign-admin-role', roles: ['admin'] },
	{ _id: 'assign-roles', roles: ['admin'] },
	{ _id: 'ban-user', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'bulk-register-user', roles: ['admin'] },
	{ _id: 'change-livechat-room-visitor', roles: ['admin', 'livechat-manager', 'livechat-agent'] },
	{ _id: 'create-c', roles: ['admin', 'user', 'bot', 'app'] },
	{ _id: 'create-d', roles: ['admin', 'user', 'bot', 'app'] },
	{ _id: 'create-p', roles: ['admin', 'user', 'bot', 'app'] },
	{ _id: 'create-personal-access-tokens', roles: ['admin', 'user'] },
	{ _id: 'create-user', roles: ['admin'] },
	{ _id: 'clean-channel-history', roles: ['admin'] },
	{ _id: 'delete-c', roles: ['admin', 'owner'] },
	{ _id: 'delete-d', roles: ['admin'] },
	{ _id: 'delete-message', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'delete-own-message', roles: ['admin', 'user'] },
	{ _id: 'delete-p', roles: ['admin', 'owner'] },
	{ _id: 'delete-user', roles: ['admin'] },
	{ _id: 'edit-message', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'edit-other-user-active-status', roles: ['admin'] },
	{ _id: 'edit-other-user-info', roles: ['admin'] },
	{ _id: 'edit-other-user-password', roles: ['admin'] },
	{ _id: 'edit-other-user-avatar', roles: ['admin'] },
	{ _id: 'edit-other-user-e2ee', roles: ['admin'] },
	{ _id: 'edit-other-user-totp', roles: ['admin'] },
	{ _id: 'edit-privileged-setting', roles: ['admin'] },
	{ _id: 'edit-room', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'edit-room-avatar', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'edit-room-retention-policy', roles: ['admin'] },
	{ _id: 'force-delete-message', roles: ['admin', 'owner'] },
	{ _id: 'join-without-join-code', roles: ['admin', 'bot', 'app'] },
	{ _id: 'leave-c', roles: ['admin', 'user', 'bot', 'anonymous', 'app'] },
	{ _id: 'leave-p', roles: ['admin', 'user', 'bot', 'anonymous', 'app'] },
	{ _id: 'logout-other-user', roles: ['admin'] },
	{ _id: 'manage-assets', roles: ['admin'] },
	{ _id: 'manage-email-inbox', roles: ['admin'] },
	{ _id: 'manage-emoji', roles: ['admin'] },
	{ _id: 'manage-user-status', roles: ['admin'] },
	{ _id: 'manage-outgoing-integrations', roles: ['admin'] },
	{ _id: 'manage-incoming-integrations', roles: ['admin'] },
	{ _id: 'manage-own-outgoing-integrations', roles: ['admin'] },
	{ _id: 'manage-own-incoming-integrations', roles: ['admin'] },
	{ _id: 'manage-oauth-apps', roles: ['admin'] },
	{ _id: 'manage-selected-settings', roles: ['admin'] },
	{ _id: 'mention-all', roles: ['admin', 'owner', 'moderator', 'user'] },
	{ _id: 'mention-here', roles: ['admin', 'owner', 'moderator', 'user'] },
	{ _id: 'mute-user', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'remove-user', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'run-import', roles: ['admin'] },
	{ _id: 'run-migration', roles: ['admin'] },
	{ _id: 'set-moderator', roles: ['admin', 'owner'] },
	{ _id: 'set-owner', roles: ['admin', 'owner'] },
	{ _id: 'send-many-messages', roles: ['admin', 'bot', 'app'] },
	{ _id: 'set-leader', roles: ['admin', 'owner'] },
	{ _id: 'unarchive-room', roles: ['admin'] },
	{ _id: 'view-c-room', roles: ['admin', 'user', 'bot', 'app', 'anonymous'] },
	{ _id: 'user-generate-access-token', roles: ['admin'] },
	{ _id: 'view-d-room', roles: ['admin', 'user', 'bot', 'app', 'guest'] },
	{ _id: 'view-device-management', roles: ['admin'] },
	{ _id: 'view-engagement-dashboard', roles: ['admin'] },
	{ _id: 'view-full-other-user-info', roles: ['admin'] },
	{ _id: 'view-history', roles: ['admin', 'user', 'anonymous'] },
	{ _id: 'view-joined-room', roles: ['guest', 'bot', 'app', 'anonymous'] },
	{ _id: 'view-join-code', roles: ['admin'] },
	{ _id: 'view-logs', roles: ['admin'] },
	{ _id: 'view-other-user-channels', roles: ['admin'] },
	{ _id: 'view-p-room', roles: ['admin', 'user', 'anonymous', 'guest'] },
	{ _id: 'view-privileged-setting', roles: ['admin'] },
	{ _id: 'view-room-administration', roles: ['admin'] },
	{ _id: 'view-statistics', roles: ['admin'] },
	{ _id: 'view-user-administration', roles: ['admin'] },
	{ _id: 'preview-c-room', roles: ['admin', 'user', 'anonymous'] },
	{ _id: 'view-outside-room', roles: ['admin', 'owner', 'moderator', 'user'] },
	{ _id: 'view-broadcast-member-list', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'call-management', roles: ['admin', 'owner', 'moderator', 'user'] },
	{ _id: 'create-invite-links', roles: ['admin', 'owner', 'moderator'] },
	{
		_id: 'view-l-room',
		roles: ['livechat-manager', 'livechat-monitor', 'livechat-agent', 'admin'],
	},
	{ _id: 'view-livechat-manager', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'view-omnichannel-contact-center',
		roles: ['livechat-manager', 'livechat-agent', 'livechat-monitor', 'admin'],
	},
	{ _id: 'edit-omnichannel-contact', roles: ['livechat-manager', 'livechat-agent', 'admin'] },
	{ _id: 'view-livechat-rooms', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'close-livechat-room',
		roles: ['livechat-manager', 'livechat-monitor', 'livechat-agent', 'admin'],
	},
	{ _id: 'close-others-livechat-room', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'on-hold-livechat-room',
		roles: ['livechat-manager', 'livechat-monitor', 'livechat-agent', 'admin'],
	},
	{
		_id: 'on-hold-others-livechat-room',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{ _id: 'save-others-livechat-room-info', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'remove-closed-livechat-rooms',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{ _id: 'view-livechat-analytics', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'view-livechat-queue',
		roles: ['livechat-manager', 'livechat-monitor', 'livechat-agent', 'admin'],
	},
	{ _id: 'transfer-livechat-guest', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{ _id: 'manage-livechat-managers', roles: ['livechat-manager', 'admin'] },
	{ _id: 'manage-livechat-agents', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'manage-livechat-departments',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{ _id: 'view-livechat-departments', roles: ['livechat-manager', 'livechat-monitor', 'admin'] },
	{
		_id: 'add-livechat-department-agents',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{
		_id: 'view-livechat-current-chats',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{
		_id: 'view-livechat-real-time-monitoring',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{ _id: 'view-livechat-triggers', roles: ['livechat-manager', 'admin'] },
	{ _id: 'view-livechat-customfields', roles: ['livechat-manager', 'admin'] },
	{ _id: 'view-livechat-installation', roles: ['livechat-manager', 'admin'] },
	{ _id: 'view-livechat-appearance', roles: ['livechat-manager', 'admin'] },
	{ _id: 'view-livechat-webhooks', roles: ['livechat-manager', 'admin'] },
	{
		_id: 'view-livechat-business-hours',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{
		_id: 'view-livechat-room-closed-same-department',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{
		_id: 'view-livechat-room-closed-by-another-agent',
		roles: ['livechat-manager', 'livechat-monitor', 'admin'],
	},
	{
		_id: 'view-livechat-room-customfields',
		roles: ['livechat-manager', 'livechat-monitor', 'livechat-agent', 'admin'],
	},
	{
		_id: 'edit-livechat-room-customfields',
		roles: ['livechat-manager', 'livechat-monitor', 'livechat-agent', 'admin'],
	},
	{ _id: 'send-omnichannel-chat-transcript', roles: ['livechat-manager', 'admin'] },
	{ _id: 'mail-messages', roles: ['admin'] },
	{ _id: 'toggle-room-e2e-encryption', roles: ['owner', 'admin'] },
	{ _id: 'message-impersonate', roles: ['bot', 'app'] },
	{ _id: 'create-team', roles: ['admin', 'user'] },
	{ _id: 'delete-team', roles: ['admin', 'owner'] },
	{ _id: 'convert-team', roles: ['admin', 'owner'] },
	{ _id: 'edit-team', roles: ['admin', 'owner'] },
	{ _id: 'add-team-member', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'edit-team-member', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'move-room-to-team', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'create-team-channel', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'create-team-group', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'delete-team-channel', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'delete-team-group', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'edit-team-channel', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'remove-team-channel', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'view-all-team-channels', roles: ['admin', 'owner'] },
	{ _id: 'view-all-teams', roles: ['admin'] },
	{ _id: 'remove-closed-livechat-room', roles: ['livechat-manager', 'admin'] },
	{ _id: 'remove-livechat-department', roles: ['livechat-manager', 'admin'] },

	// VOIP Permissions
	// allows to manage voip calls configuration
	{ _id: 'manage-voip-call-settings', roles: ['livechat-manager', 'admin'] },
	{ _id: 'manage-voip-contact-center-settings', roles: ['livechat-manager', 'admin'] },
	// allows agent-extension association.
	{ _id: 'manage-agent-extension-association', roles: ['admin'] },
	{ _id: 'view-agent-extension-association', roles: ['livechat-manager', 'admin', 'livechat-agent'] },
	// allows to receive a voip call
	{ _id: 'inbound-voip-calls', roles: ['livechat-agent'] },

	{ _id: 'remove-livechat-department', roles: ['livechat-manager', 'admin'] },
	{ _id: 'manage-apps', roles: ['admin'] },
	{ _id: 'post-readonly', roles: ['admin', 'owner', 'moderator'] },
	{ _id: 'set-readonly', roles: ['admin', 'owner'] },
	{ _id: 'set-react-when-readonly', roles: ['admin', 'owner'] },
	{ _id: 'manage-cloud', roles: ['admin'] },
	{ _id: 'manage-sounds', roles: ['admin'] },
	{ _id: 'access-mailer', roles: ['admin'] },
	{ _id: 'pin-message', roles: ['owner', 'moderator', 'admin'] },
	{ _id: 'mobile-upload-file', roles: ['user', 'admin'] },
	{ _id: 'send-mail', roles: ['admin'] },
	{ _id: 'view-federation-data', roles: ['admin'] },
	{ _id: 'add-all-to-room', roles: ['admin'] },
	{ _id: 'get-server-info', roles: ['admin'] },
	{ _id: 'register-on-cloud', roles: ['admin'] },
	{ _id: 'test-admin-options', roles: ['admin'] },
	{ _id: 'test-push-notifications', roles: ['admin', 'user'] },
	{ _id: 'sync-auth-services-users', roles: ['admin'] },
	{ _id: 'restart-server', roles: ['admin'] },
	{ _id: 'remove-slackbridge-links', roles: ['admin'] },
	{ _id: 'view-import-operations', roles: ['admin'] },
	{ _id: 'clear-oembed-cache', roles: ['admin'] },
	{ _id: 'videoconf-ring-users', roles: ['admin', 'owner', 'moderator', 'user'] },
	{ _id: 'view-moderation-console', roles: ['admin'] },
	{ _id: 'manage-moderation-actions', roles: ['admin'] },
	{ _id: 'bypass-time-limit-edit-and-delete', roles: ['bot', 'app'] },
];
