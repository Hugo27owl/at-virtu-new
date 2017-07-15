Package.describe({
	name: 'rocketchat:plugin-handler',
	version: '0.0.1',
	summary: 'plugin handler for Rocket.Chat'
});

Package.onUse(function(api) {
	api.use('accounts-base');
	api.use('ecmascript');

	api.mainModule('server/server.js', 'server');
});


