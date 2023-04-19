import { ajv } from '../Ajv';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

type ReportHistoryProps = {
	latest?: string;
	oldest?: string;
	selector?: string;
};

export type ReportHistoryPropsGET = PaginatedRequest<ReportHistoryProps>;

const reportHistoryPropsSchema = {
	properties: {
		latest: {
			type: 'string',
			format: 'date',
			nullable: true,
		},
		oldest: {
			type: 'string',
			format: 'date',
			nullable: true,
		},
		selector: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'integer',
			nullable: true,
		},
		offset: {
			type: 'integer',
			nullable: true,
		},
		sort: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isReportHistoryProps = ajv.compile<ReportHistoryPropsGET>(reportHistoryPropsSchema);
