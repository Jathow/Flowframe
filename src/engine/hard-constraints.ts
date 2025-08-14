import type { Constraint } from '../models/constraint';
import { clampInterval, invertIntervals, mergeIntervals, minutesBetween, type Interval } from './intervals';

function startOfLocalDay(dateISO: string): Date {
	const d = new Date(dateISO + 'T00:00:00');
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(dateISO: string): Date {
	const s = startOfLocalDay(dateISO);
	return new Date(s.getFullYear(), s.getMonth(), s.getDate(), 24, 0, 0, 0);
}

export function getBusyIntervalsForDate(constraints: Constraint[], dateISO: string): Interval[] {
	const dayStart = startOfLocalDay(dateISO);
	const dayEnd = endOfLocalDay(dateISO);
	const dayRange: Interval = { start: 0, end: 24 * 60 };
	const busy: Interval[] = [];

	for (const c of constraints) {
		if (!['sleep', 'fixed', 'no-go', 'commute'].includes(c.type)) continue;
		const cStart = new Date(c.start);
		const cEnd = new Date(c.end);
		const intersectStart = new Date(Math.max(cStart.getTime(), dayStart.getTime()));
		const intersectEnd = new Date(Math.min(cEnd.getTime(), dayEnd.getTime()));
		if (intersectEnd <= intersectStart) continue;
		const interval: Interval = {
			start: minutesBetween(dayStart, intersectStart),
			end: minutesBetween(dayStart, intersectEnd)
		};
		const clamped = clampInterval(interval, dayRange.start, dayRange.end);
		if (clamped) busy.push(clamped);
	}

	return mergeIntervals(busy);
}

export function getFreeIntervalsForDate(constraints: Constraint[], dateISO: string): Interval[] {
	const dayRange: Interval = { start: 0, end: 24 * 60 };
	const busy = getBusyIntervalsForDate(constraints, dateISO);
	return invertIntervals(dayRange, busy);
}


