import { useTranslation } from '@rocket.chat/ui-contexts';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import { useAdministrationItems } from './useAdministrationItems';
import { useAppsItems } from './useAppsItems';
import { useAuditItems } from './useAuditItems';

/**
 * @deprecated Moved to NavBar
 * @description delete when feature is ready
 * @memberof newNavigation
 */
export const useAdministrationMenu = () => {
	const t = useTranslation();

	const administrationItems = useAdministrationItems();
	const appItems = useAppsItems();
	const auditItems = useAuditItems();

	return [
		administrationItems.length && { title: t('Administration'), items: administrationItems },
		appItems.length && { title: t('Apps'), items: appItems },
		auditItems.length && { title: t('Audit'), items: auditItems },
	].filter(Boolean) as Array<{ title: string; items: GenericMenuItemProps[] }>;
};
