import type { Area } from './area';

export type AreaWeights = Partial<Record<Area, number>>; // 0..10

export type Preference = {
	userId: string;
	areaWeights: AreaWeights;
	deepWorkCapacity: number; // number of deep blocks per day
	breakPreference: number; // 0..10 scale
	sleepTargetHours: number; // 7..9 typical
	screenDiscomfort?: number; // 0..10
  // WHO 2020 defaults: 150–300 min/week moderate OR 75–150 min/week vigorous; ≥2 strength days/week
  weeklyModerateMinutesTarget?: number; // default 150
  weeklyStrengthDaysTarget?: number; // default 2
};


