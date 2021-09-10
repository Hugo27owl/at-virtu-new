import { settings } from '../../app/settings/server';

settings.addGroup('LDAP', function() {
	const enableQuery = { _id: 'LDAP_Enable', value: true };
	const enableTLSQuery = [
		enableQuery,
		{ _id: 'LDAP_Encryption', value: { $in: ['tls', 'ssl'] } },
	];

	const adOnly = { _id: 'LDAP_Server_Type', value: 'ad' };
	const ldapOnly = { _id: 'LDAP_Server_Type', value: '' };

	this.add('LDAP_Enable', false, { type: 'boolean', public: true });
	this.add('LDAP_Server_Type', 'ad', {
		type: 'select',
		values: [
			{ key: 'ad', i18nLabel: 'LDAP_Server_Type_AD' },
			{ key: '', i18nLabel: 'LDAP_Server_Type_Other' },
		],
	});

	this.add('LDAP_Find_User_After_Login', true, { type: 'boolean', enableQuery });
	this.add('LDAP_Internal_Log_Level', 'disabled', {
		type: 'select',
		values: [
			{ key: 'disabled', i18nLabel: 'Disabled' },
			{ key: 'error', i18nLabel: 'Error' },
			{ key: 'warn', i18nLabel: 'Warn' },
			{ key: 'info', i18nLabel: 'Info' },
			{ key: 'debug', i18nLabel: 'Debug' },
			{ key: 'trace', i18nLabel: 'Trace' },
		],
		enableQuery,
	});

	this.section('LDAP_10_Connection', function() {
		this.add('LDAP_Host', '', { type: 'string', enableQuery });
		this.add('LDAP_Port', '389', { type: 'int', enableQuery });
		this.add('LDAP_Reconnect', false, { type: 'boolean', enableQuery });
		this.add('LDAP_Encryption', 'plain', {
			type: 'select',
			values: [
				{ key: 'plain', i18nLabel: 'No_Encryption' },
				{ key: 'tls', i18nLabel: 'StartTLS' },
				{ key: 'ssl', i18nLabel: 'SSL/LDAPS' },
			],
			enableQuery,
		});

		this.add('LDAP_CA_Cert', '', { type: 'string', multiline: true, enableQuery: enableTLSQuery, secret: true });
		this.add('LDAP_Reject_Unauthorized', true, { type: 'boolean', enableQuery: enableTLSQuery });

		this.add('LDAP_Test_Connection', 'ldapTestConnection', { type: 'action', actionText: 'Test_Connection' });
	});

	this.section('LDAP_20_Timeouts', function() {
		this.add('LDAP_Timeout', 60000, { type: 'int', enableQuery });
		this.add('LDAP_Connect_Timeout', 1000, { type: 'int', enableQuery });
		this.add('LDAP_Idle_Timeout', 1000, { type: 'int', enableQuery });
	});

	this.section('LDAP_30_User_Search', function() {
		this.add('LDAP_BaseDN', '', {
			type: 'string',
			enableQuery,
		});

		this.add('LDAP_User_Search_Scope', 'sub', {
			type: 'string',
			enableQuery,
		});

		this.add('LDAP_AD_User_Search_Field', 'sAMAccountName', {
			type: 'string',
			enableQuery,
			displayQuery: adOnly,
		});
		this.add('LDAP_User_Search_Field', 'uid', {
			type: 'string',
			enableQuery,
			displayQuery: ldapOnly,
		});
		this.add('LDAP_Search_Page_Size', 250, {
			type: 'int',
			enableQuery,
		});
		this.add('LDAP_Search_Size_Limit', 1000, {
			type: 'int',
			enableQuery,
		});
	});

	this.section('LDAP_40_Sync', function() {
		this.add('LDAP_Unique_Identifier_Field', 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber,uid', {
			type: 'string',
			enableQuery,
		});

		// If username field is specified, then the user can't change their username
		// but if it's empty, then they are free to do so.
		this.add('LDAP_AD_Username_Field', 'sAMAccountName', {
			type: 'string',
			enableQuery,
			displayQuery: adOnly,
			// public so that it's visible to AccountProfilePage:
			public: true,
		});

		this.add('LDAP_Username_Field', 'ou', {
			type: 'string',
			enableQuery,
			displayQuery: ldapOnly,
			// public so that it's visible to AccountProfilePage:
			public: true,
		});

		this.add('LDAP_Update_Data_On_Login', false, {
			type: 'boolean',
			enableQuery,
		});

		this.add('LDAP_AD_Email_Field', 'mail', {
			type: 'string',
			displayQuery: adOnly,
		});

		this.add('LDAP_Email_Field', 'mail', {
			type: 'string',
			displayQuery: ldapOnly,
		});

		this.add('LDAP_Default_Domain', '', {
			type: 'string',
			enableQuery,
		});

		this.add('LDAP_AD_Name_Field', 'cn', {
			type: 'string',
			displayQuery: adOnly,
		});

		this.add('LDAP_Name_Field', 'cn', {
			type: 'string',
			displayQuery: ldapOnly,
		});

		this.add('LDAP_Merge_Existing_Users', false, {
			type: 'boolean',
			enableQuery,
		});
	});
});
