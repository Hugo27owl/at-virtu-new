import { Palette } from '@rocket.chat/fuselage';

export const REPORTS_CHARTS_THEME = {
	labels: {
		text: { fontSize: 12 },
	},
	axis: {
		ticks: {
			text: {
				fill: Palette.text['font-annotation'].toString(),
				fontFamily:
					'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
				fontSize: 12,
				fontStyle: 'normal',
				letterSpacing: '0.2px',
				lineHeight: '16px',
			},
		},
	},
};

export const COLORS = {
	warning: Palette.statusColor['status-font-on-warning'].toString(),
	danger: Palette.statusColor['status-font-on-danger'].toString(),
	success: Palette.statusColor['status-font-on-success'].toString(),
	info: Palette.statusColor['status-font-on-info'].toString(),
};
