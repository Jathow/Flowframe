import { describe, it, expect } from 'vitest';
import { scheduleDay } from '../src/engine/schedule';
import type { Task } from '../src/models/task';
import type { Preference } from '../src/models/preference';
import type { Constraint } from '../src/models/constraint';

const prefs: Preference = {
	userId: 'u',
	areaWeights: { work: 7 },
	deepWorkCapacity: 2,
	breakPreference: 5,
	sleepTargetHours: 8
};

const dayConstraints: Constraint[] = [
	{ id: 's', userId: 'u', type: 'sleep', start: '2025-01-02T00:00:00', end: '2025-01-02T07:00:00' },
	{ id: 'm', userId: 'u', type: 'fixed', start: '2025-01-02T12:00:00', end: '2025-01-02T13:00:00' }
];

describe('scheduleDay', () => {
	it('places tasks in free intervals and inserts breaks for long blocks', () => {
		const tasks: Task[] = [
			{ id: 't1', userId: 'u', title: 'Deep work', area: 'work', estimateMinutes: 90, importance: 8, energyType: 'deep', flexibility: 3 },
			{ id: 't2', userId: 'u', title: 'Shallow work', area: 'work', estimateMinutes: 30, importance: 5, energyType: 'shallow', flexibility: 5 }
		];
		const result = scheduleDay(tasks, dayConstraints, prefs, '2025-01-02', { bufferMinutes: 10, breakMinutes: 10 });
		expect(result.length).toBeGreaterThan(0);
		const hasBreak = result.some((b) => b.type === 'break');
		expect(hasBreak).toBe(true);
	});

	it('respects deep work capacity', () => {
		const tasks: Task[] = [
			{ id: 'd1', userId: 'u', title: 'Deep A', area: 'work', estimateMinutes: 60, importance: 8, energyType: 'deep', flexibility: 3 },
			{ id: 'd2', userId: 'u', title: 'Deep B', area: 'work', estimateMinutes: 60, importance: 7, energyType: 'deep', flexibility: 3 },
			{ id: 'd3', userId: 'u', title: 'Deep C', area: 'work', estimateMinutes: 60, importance: 6, energyType: 'deep', flexibility: 3 }
		];
		const result = scheduleDay(tasks, dayConstraints, prefs, '2025-01-02');
		const deepBlocks = result.filter((b) => b.type === 'deep');
		expect(deepBlocks.length).toBeLessThanOrEqual(prefs.deepWorkCapacity);
	});

	it('aligns deep tasks with chronotype windows', () => {
		const tasks: Task[] = [
			{ id: 'd1', userId: 'u', title: 'Deep Morning', area: 'work', estimateMinutes: 60, importance: 9, energyType: 'deep', flexibility: 3 }
		];
		const result = scheduleDay(tasks, dayConstraints, prefs, '2025-01-02', { chronotype: 'early' });
		const deep = result.find((b) => b.type === 'deep');
		expect(deep).toBeTruthy();
		if (deep) expect(deep.startMin).toBeGreaterThanOrEqual(9 * 60 - 1);
	});
});


