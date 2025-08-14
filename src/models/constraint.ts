import type { ISODateTimeString, RecurrenceRule } from './common';

export type ConstraintType = 'sleep' | 'fixed' | 'commute' | 'no-go';

export type Constraint = {
	id: string;
	userId: string;
	type: ConstraintType;
	start: ISODateTimeString;
	end: ISODateTimeString;
	recurrence?: RecurrenceRule;
	label?: string;
	// Two-way calendar sync (optional provenance)
	source?: 'local' | 'google' | 'microsoft';
	externalId?: string; // provider event id
	updatedAt?: ISODateTimeString;
};
