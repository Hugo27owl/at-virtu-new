/*globals defaultUserLanguage, KonchatNotification */
import toastr from 'toastr';
Template.accountPreferences.helpers({
	audioAssets() {
		return (RocketChat.CustomSounds && RocketChat.CustomSounds.getList && RocketChat.CustomSounds.getList()) || [];
	},
	newMessageNotification() {
		const user = Meteor.user();
		return (user && user.settings && user.settings.preferences && user.settings.preferences.newMessageNotification) || 'chime';
	},
	newRoomNotification() {
		const user = Meteor.user();
		return (user && user.settings && user.settings.preferences && user.settings.preferences.newRoomNotification) || 'door';
	},
	languages() {
		const languages = TAPi18n.getLanguages();
		const result = [];

		Object.keys(languages).forEach((key) => {
			const language = languages[key];
			result.push(_.extend(language, {
				key
			}));
		});

		return _.sortBy(result, 'key');
	},
	userLanguage(key) {
		const user = Meteor.user();
		let result = undefined;
		if (user.language) {
			result = user.language.split('-').shift().toLowerCase() === key;
		} else if (defaultUserLanguage()) {
			result = defaultUserLanguage().split('-').shift().toLowerCase() === key;
		}
		return result;
	},
	checked(property, value, defaultValue) {
		const user = Meteor.user();
		let currentValue;
		if (user && user.settings && user.settings.preferences && user.settings.preferences[property] && defaultValue === true) {
			currentValue = value;
		} else if (user && user.settings && user.settings.preferences && user.settings.preferences[property]) {
			currentValue = !!user.settings.preferences[property];
		}
		return currentValue === value;
	},
	selected(property, value, defaultValue) {
		const user = Meteor.user();
		if (!(user && user.settings && user.settings.preferences && user.settings.preferences[property])) {
			return defaultValue === true;
		} else {
			return (user && user.settings && user.settings.preferences && user.settings.preferences[property]) === value;
		}
	},
	highlights() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences['highlights'] && user.settings.preferences['highlights'].join(', ');
	},
	desktopNotificationEnabled() {
		return (KonchatNotification.notificationStatus.get() === 'granted') || (window.Notification && Notification.permission === 'granted');
	},
	desktopNotificationDisabled() {
		return (KonchatNotification.notificationStatus.get() === 'denied') || (window.Notification && Notification.permission === 'denied');
	},
	desktopNotificationDuration() {
		const user = Meteor.user();
		return user && user.settings && user.settings.preferences && user.settings.preferences.desktopNotificationDuration;
	},
	showRoles() {
		return RocketChat.settings.get('UI_DisplayRoles');
	}
});

Template.accountPreferences.onCreated(function() {
	const settingsTemplate = this.parentTemplate(3);
	if (settingsTemplate.child == null) {
		settingsTemplate.child = [];
	}
	settingsTemplate.child.push(this);
	const user = Meteor.user();
	if (user && user.settings && user.settings.preferences) {
		this.useEmojis = new ReactiveVar(user.settings.preferences.desktopNotificationDuration == null || user.settings.preferences.useEmojis);
	}
	let instance = this;
	this.autorun(() => {
		if (instance.useEmojis && instance.useEmojis.get()) {
			return Tracker.afterFlush(function() {
				return $('#convertAsciiEmoji').show();
			});
		} else {
			return Tracker.afterFlush(function() {
				return $('#convertAsciiEmoji').hide();
			});
		}
	});
	this.clearForm = function() {
		return this.find('#language').value = localStorage.getItem('userLanguage');
	};
	return this.save = function() {
		instance = this;
		const data = {};
		let reload = false;
		const selectedLanguage = $('#language').val();
		if (localStorage.getItem('userLanguage') !== selectedLanguage) {
			localStorage.setItem('userLanguage', selectedLanguage);
			data.language = selectedLanguage;
			reload = true;
		}
		data.newRoomNotification = $('select[name=newRoomNotification]').val();
		data.newMessageNotification = $('select[name=newMessageNotification]').val();
		data.useEmojis = $('input[name=useEmojis]:checked').val();
		data.convertAsciiEmoji = $('input[name=convertAsciiEmoji]:checked').val();
		data.saveMobileBandwidth = $('input[name=saveMobileBandwidth]:checked').val();
		data.collapseMediaByDefault = $('input[name=collapseMediaByDefault]:checked').val();
		data.viewMode = parseInt($('#viewMode').find('select').val());
		data.hideUsernames = $('#hideUsernames').find('input:checked').val();
		data.hideRoles = $('#hideRoles').find('input:checked').val();
		data.hideFlexTab = $('#hideFlexTab').find('input:checked').val();
		data.hideAvatars = $('#hideAvatars').find('input:checked').val();
		data.mergeChannels = $('#mergeChannels').find('input:checked').val();
		data.sendOnEnter = $('#sendOnEnter').find('select').val();
		data.unreadRoomsMode = $('input[name=unreadRoomsMode]:checked').val();
		data.autoImageLoad = $('input[name=autoImageLoad]:checked').val();
		data.emailNotificationMode = $('select[name=emailNotificationMode]').val();
		data.highlights = _.compact(_.map($('[name=highlights]').val().split(','), function(e) {
			return _.trim(e);
		}));
		data.desktopNotificationDuration = $('input[name=desktopNotificationDuration]').val();
		data.unreadAlert = $('#unreadAlert').find('input:checked').val();
		return Meteor.call('saveUserPreferences', data, function(error, results) {
			if (results) {
				toastr.success(t('Preferences_saved'));
				instance.clearForm();
				if (reload) {
					setTimeout(function() {
						return Meteor._reload.reload();
					}, 1000);
				}
			}
			if (error) {
				return handleError(error);
			}
		});
	};
});

Template.accountPreferences.onRendered(function() {
	return Tracker.afterFlush(function() {
		SideNav.setFlex('accountFlex');
		return SideNav.openFlex();
	});
});

Template.accountPreferences.events({
	'click .submit button'(e, t) {
		return t.save();
	},
	'change input[name=useEmojis]'(e, t) {
		return t.useEmojis.set($(e.currentTarget).val() === '1');
	},
	'click .enable-notifications'() {
		return KonchatNotification.getDesktopPermission();
	},
	'click .test-notifications'() {
		return KonchatNotification.notify({
			duration: $('input[name=desktopNotificationDuration]').val(),
			payload: {
				sender: {
					username: 'rocket.cat'
				}
			},
			title: TAPi18n.__('Desktop_Notification_Test'),
			text: TAPi18n.__('This_is_a_desktop_notification')
		});
	},
	'change .audio'(e) {
		e.preventDefault();
		const audio = $(e.currentTarget).val();
		if (audio === 'none') {
			return;
		}
		if (audio) {
			const $audio = $(`audio#${ audio }`);
			return $audio && $audio[0] && $audio.play();
		}
	}
});
