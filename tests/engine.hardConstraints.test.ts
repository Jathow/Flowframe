import { describe, it, expect } from 'vitest';
import { getBusyIntervalsForDate, getFreeIntervalsForDate } from '../src/engine/hard-constraints';
import type { Constraint } from '../src/models/constraint';

function mk(start: string, end: string, type: Constraint['type'], label?: string): Constraint {
	return { id: Math.random().toString(36).slice(2), userId: 'u', start, end, type, label };
}

describe('hard constraints intervals', () => {
	it('protects sleep crossing midnight', () => {
		const constraints: Constraint[] = [
			mk('2025-01-01T23:00:00', '2025-01-02T07:00:00', 'sleep')
		];
		const busy = getBusyIntervalsForDate(constraints, '2025-01-02');
		expect(busy).toEqual([{ start: 0, end: 420 }]); // 00:00 → 07:00
		const free = getFreeIntervalsForDate(constraints, '2025-01-02');
		expect(free[0].start).toBe(420);
	});

	it('merges overlapping fixed events and commute', () => {
		const constraints: Constraint[] = [
			mk('2025-01-02T09:00:00', '2025-01-02T10:00:00', 'commute'),
			mk('2025-01-02T09:30:00', '2025-01-02T11:00:00', 'fixed')
		];
		const busy = getBusyIntervalsForDate(constraints, '2025-01-02');
		expect(busy).toEqual([{ start: 540, end: 660 }]); // 09:00–11:00
	});

	it('no-go windows split free intervals', () => {
		const constraints: Constraint[] = [
			mk('2025-01-02T13:00:00', '2025-01-02T14:00:00', 'no-go')
		];
		const free = getFreeIntervalsForDate(constraints, '2025-01-02');
		// Expect a gap around 13:00–14:00
		expect(free.some((i) => i.start === 0)).toBe(true);
		expect(free.some((i) => i.start <= 780 && i.end >= 780)).toBe(false); // 13:00 not free
	});
});


