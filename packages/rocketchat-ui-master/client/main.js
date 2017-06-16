/* globals toolbarSearch, menu, isRtl, fireGlobalEvent, CachedChatSubscription, DynamicCss */
import Clipboard from 'clipboard';
RocketChat.settings.collection.find({_id:/theme/}, {fields:{ value: 1, properties: 1, type: 1 }}).observe({changed: () => { DynamicCss.run(); }});

Template.body.onRendered(function() {
	new Clipboard('.clipboard');

	$(document.body).on('keydown', function(e) {
		if ((e.keyCode === 80 || e.keyCode === 75) && (e.ctrlKey === true || e.metaKey === true) && e.shiftKey === false) {
			e.preventDefault();
			e.stopPropagation();
			toolbarSearch.focus(true);
		}
		const unread = Session.get('unread');
		if (e.keyCode === 27 && e.shiftKey === true && (unread != null) && unread !== '') {
			e.preventDefault();
			e.stopPropagation();
			return swal({
				title: t('Clear_all_unreads_question'),
				type: 'warning',
				confirmButtonText: t('Yes_clear_all'),
				showCancelButton: true,
				cancelButtonText: t('Cancel'),
				confirmButtonColor: '#DD6B55'
			}, function() {
				const subscriptions = ChatSubscription.find({
					open: true
				}, {
					fields: {
						unread: 1,
						alert: 1,
						rid: 1,
						t: 1,
						name: 1,
						ls: 1
					}
				});

				subscriptions.forEach((subscription) =>{
					if (subscription.alert || subscription.unread > 0) {
						Meteor.call('readMessages', subscription.rid);
					}
				});
			});
		}
	});

	$(document.body).on('keydown', function(e) {
		const target = e.target;
		if (e.ctrlKey === true || e.metaKey === true) {
			return;
		}
		if (!(e.keyCode > 45 && e.keyCode < 91 || e.keyCode === 8)) {
			return;
		}
		if (/input|textarea|select/i.test(target.tagName)) {
			return;
		}
		if (target.id === 'pswp') {
			return;
		}
		const inputMessage = $('textarea.input-message');
		if (inputMessage.length === 0) {
			return;
		}
		return inputMessage.focus();
	});

	$(document.body).on('click', function(e) {
		const target = $(e.target);

		if (e.target.tagName === 'A') {
			const link = e.currentTarget;
			if (link.origin === s.rtrim(Meteor.absoluteUrl(), '/') && /msg=([a-zA-Z0-9]+)/.test(link.search)) {
				e.preventDefault();
				e.stopPropagation();
				if (RocketChat.Layout.isEmbedded()) {
					return fireGlobalEvent('click-message-link', {
						link: link.pathname + link.search
					});
				}
				return FlowRouter.go(link.pathname + link.search, null, FlowRouter.current().queryParams);
			}
		}

		if ([...target[0].classList].includes('rc-popover') || target.closest('[data-popover="label"], [data-popover="popover"]').length === 0 && target.data('popover') !== 'anchor') {
			$('[data-popover="anchor"]:checked').prop('checked', false);
		}
	});

	Tracker.autorun(function(c) {
		const w = window;
		const d = document;
		const s = 'script';
		const l = 'dataLayer';
		const i = RocketChat.settings.get('GoogleTagManager_id');
		if (Match.test(i, String) && i.trim() !== '') {
			c.stop();
			return (function(w, d, s, l, i) {
				w[l] = w[l] || [];
				w[l].push({
					'gtm.start': new Date().getTime(),
					event: 'gtm.js'
				});
				const f = d.getElementsByTagName(s)[0];
				const j = d.createElement(s);
				const dl = l !== 'dataLayer' ? `&l=${ l }` : '';
				j.async = true;
				j.src = `//www.googletagmanager.com/gtm.js?id=${ i }${ dl }`;
				return f.parentNode.insertBefore(j, f);
			}(w, d, s, l, i));
		}
	});
	if (Meteor.isCordova) {
		return $(document.body).addClass('is-cordova');
	}
});

Template.main.helpers({
	siteName() {
		return RocketChat.settings.get('Site_Name');
	},
	logged() {
		if (Meteor.userId() != null || (RocketChat.settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true)) {
			$('html').addClass('noscroll').removeClass('scroll');
			return true;
		} else {
			$('html').addClass('scroll').removeClass('noscroll');
			return false;
		}
	},
	useIframe() {
		const iframeEnabled = typeof RocketChat.iframeLogin !== 'undefined';
		return iframeEnabled && RocketChat.iframeLogin.reactiveEnabled.get();
	},
	iframeUrl() {
		const iframeEnabled = typeof RocketChat.iframeLogin !== 'undefined';
		return iframeEnabled && RocketChat.iframeLogin.reactiveIframeUrl.get();
	},
	subsReady() {
		const routerReady = FlowRouter.subsReady('userData', 'activeUsers');
		const subscriptionsReady = CachedChatSubscription.ready.get();
		const ready = (Meteor.userId() == null) || (routerReady && subscriptionsReady);
		RocketChat.CachedCollectionManager.syncEnabled = ready;
		return ready;
	},
	hasUsername() {
		return (Meteor.userId() != null && Meteor.user().username != null) || (Meteor.userId() == null && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true);
	},
	requirePasswordChange() {
		const user = Meteor.user();
		return user && user.requirePasswordChange === true;
	},
	CustomScriptLoggedOut() {
		const script = RocketChat.settings.get('Custom_Script_Logged_Out') || '';
		if (script.trim()) {
			eval(script);//eslint-disable-line
		}
	},
	CustomScriptLoggedIn() {
		const script = RocketChat.settings.get('Custom_Script_Logged_In') || '';
		if (script.trim()) {
			eval(script);//eslint-disable-line
		}
	},
	embeddedVersion() {
		if (RocketChat.Layout.isEmbedded()) {
			return 'embedded-view';
		}
	}
});

Template.main.events({
	'click .burger'() {
		if (window.rocketDebug) {
			console.log('room click .burger');
		}
		return menu.toggle();
	}
});

Template.main.onRendered(function() {
	document.body.classList[(isRtl(localStorage.getItem('userLanguage'))? 'add': 'remove')]('rtl');
	$('#initial-page-loading').remove();
	window.addEventListener('focus', function() {
		return Meteor.setTimeout(function() {
			if (!$(':focus').is('INPUT,TEXTAREA')) {
				return $('.input-message').focus();
			}
		}, 100);
	});
	return Tracker.autorun(function() {
		swal.setDefaults({
			cancelButtonText: t('Cancel')
		});
		const user = Meteor.user();
		const settings = user && user.settings;
		const prefs = settings && settings.preferences;
		if (prefs && prefs.hideUsernames != null) {
			$(document.body).on('mouseleave', 'button.thumb', function() {
				return RocketChat.tooltip.hide();
			});
			return $(document.body).on('mouseenter', 'button.thumb', function(e) {
				const avatarElem = $(e.currentTarget);
				const username = avatarElem.attr('data-username');
				if (username) {
					e.stopPropagation();
					return RocketChat.tooltip.showElement($('<span>').text(username), avatarElem);
				}
			});
		} else {
			$(document.body).off('mouseenter', 'button.thumb');
			return $(document.body).off('mouseleave', 'button.thumb');
		}
	});
});

Meteor.startup(function() {
	return fireGlobalEvent('startup', true);
});
