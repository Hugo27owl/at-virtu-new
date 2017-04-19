FlowRouter.route('/admin/users', {
	name: 'admin-users',
	action() {
		BlazeLayout.render('main', {center: 'adminUsers'});
	}
});

FlowRouter.route('/admin/rooms', {
	name: 'admin-rooms',
	action() {
		BlazeLayout.render('main', {center: 'adminRooms'});
	}
});

FlowRouter.route('/admin/apps', {
	name: 'admin-apps',
	action() {
		BlazeLayout.render('main', {center: 'adminApps'});
	}
});

FlowRouter.route('/admin/info', {
	name: 'admin-info',
	action() {
		BlazeLayout.render('main', {center: 'adminInfo'});
	}
});

FlowRouter.route('/admin/status', {
	name: 'admin-status',
	action() {
		BlazeLayout.render('main', {center: 'adminStatus'});
	}
});

FlowRouter.route('/admin/import', {
	name: 'admin-import',
	action() {
		BlazeLayout.render('main', {center: 'adminImport'});
	}
});

FlowRouter.route('/admin/import/prepare/:importer', {
	name: 'admin-import-prepare',
	action() {
		BlazeLayout.render('main', {center: 'adminImportPrepare'});
	}
});

FlowRouter.route('/admin/import/progress/:importer', {
	name: 'admin-import-progress',
	action() {
		BlazeLayout.render('main', {center: 'adminImportProgress'});
	}
});

FlowRouter.route('/admin/:group?', {
	name: 'admin',
	action() {
		BlazeLayout.render('main', {center: 'admin'});
	}
});
