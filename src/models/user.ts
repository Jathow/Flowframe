export type Chronotype = 'early' | 'intermediate' | 'late';

export type User = {
	id: string;
	locale: string;
	timeZone: string;
	chronotype: Chronotype;
};


