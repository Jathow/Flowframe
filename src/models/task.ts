import type { Area } from './area';

export type EnergyType = 'deep' | 'shallow';

export type Task = {
	id: string;
	userId: string;
	title: string;
	area: Area;
	estimateMinutes: number; // expected focus duration
	deadline?: string; // ISO date time
	importance: number; // 0..10
	energyType: EnergyType;
	flexibility: number; // 0..10 (higher = more flexible)
};


