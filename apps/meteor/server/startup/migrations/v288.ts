import { addMigration } from '../../lib/migrations';
import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';

addMigration({
	version: 288,
	up() {
		upsertPermissions();
	},
});
