export type Insight = {
	id: string;
	userId: string;
	date: string; // ISO date
	metric: string; // e.g., 'adherence', 'focus_minutes'
	value: number;
	note?: string;
};


