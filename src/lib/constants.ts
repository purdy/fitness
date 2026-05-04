import type { Weekday } from '$lib/types';

export const WARMUP_MINUTES = 5;
export const COOLDOWN_MINUTES = 10;
export const DEFAULT_WEIGHT_UNIT = 'lb';

export const WEEKDAYS: Array<{ value: Weekday; label: string }> = [
	{ value: 1, label: 'Monday' },
	{ value: 2, label: 'Tuesday' },
	{ value: 3, label: 'Wednesday' },
	{ value: 4, label: 'Thursday' },
	{ value: 5, label: 'Friday' }
];
