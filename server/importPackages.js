import '../app/cors/server';
import '../app/assets/server';
import '../app/authorization';
import '../app/bot-helpers/server';
import '../app/cas/server';
import '../app/channel-settings';
import '../app/cloud/server';
import '../app/colors/server';
import '../app/custom-sounds/server';
import '../app/emoji';
import '../app/emoji-custom/server';
import '../app/emoji-emojione/server';
import '../app/error-handler';
import '../app/federation/server';
import '../app/file';
import '../app/file-upload';
import '../app/iframe-login/server';
import '../app/katex/server';
import '../app/ldap/server';
import '../app/lib';
import '../app/livestream/server';
import '../app/logger';
import '../app/token-login/server';
import '../app/mailer';
import '../app/markdown/server';
import '../app/migrations';
import '../app/otr/server';
import '../app/push-notifications/server';
import '../app/retention-policy';
import '../app/theme/server';
import '../app/threads/server';
import '../app/ui-master/server';
import '../app/ui-vrecord/server';
import '../app/user-data-download';
import '../app/videobridge/server';
import '../app/meteor-accounts-saml/server';
import '../app/e2e/server';
import '../app/version-check/server';
import '../app/search/server';
import '../app/discussion/server';
import '../app/mail-messages/server';
import '../app/user-status';
import '../app/utils';
import '../app/settings';
import '../app/models';
import '../app/metrics';
import '../app/callbacks';
import '../app/notifications';
import '../app/promises/server';
import '../app/ui-utils';
import '../app/reactions/server';
import '../app/livechat/server';
import '../app/authentication/server';

// this file contains the settings for the registered services
import './settings/settingfiles';
import './api/methods';
import './services/2fa';
import './api/v1';
import './services/messages/slashcommands';
import './services/messages/mentions';
import './services/importer';
import './services/importer/strategies';
import './services/apps';
import './services/autotranslate';
import './overrides/google-oauth';

import './integrations';
import './integrations/oauth';
