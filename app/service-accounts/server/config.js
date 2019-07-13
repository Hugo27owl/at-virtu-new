import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(() => {
	settings.addGroup('Service Accounts', function() {
		this.add('Service_account_enabled', true, {
			group: 'Service Accounts',
			i18nLabel: 'Enable',
			type: 'boolean',
			public: true,
		});
		this.add('Service_account_limit', 3, {
			type: 'int',
			public: true,
		});
		this.add('Service_Accounts_SearchFields', 'username, name, description', {
			type: 'string',
			public: true,
		});
		this.add('Service_accounts_approval_required', true, {
			group: 'Service Accounts',
			i18nLabel: 'Service_accounts_approval_required',
			type: 'boolean',
			public: true,
		});
	});
});
