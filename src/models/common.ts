export type ISODateTimeString = string; // e.g., 2025-01-31T09:00:00Z or with timezone offset
export type ISODateString = string; // e.g., 2025-01-31

export type RecurrenceRule = {
	freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	interval?: number; // default 1
	byDay?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
	count?: number;
	until?: ISODateString;
};


