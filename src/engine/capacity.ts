import type { Constraint } from '../models/constraint';
import { getFreeIntervalsForDate } from './hard-constraints';

function toISODate(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function startOfNextWeek(today = new Date()): Date {
	// Next Monday (ISO week start)
	const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const day = d.getDay(); // 0 Sun .. 6 Sat
	const diffToMonday = ((8 - (day === 0 ? 7 : day)) % 7) || 7; // days to next Monday
	return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
}

export function suggestWeeklyCapacity(
	constraints: Constraint[],
	options: { weekStartISO?: string; bufferPercent?: number } = {}
): { weekStartISO: string; dailyFreeMinutes: number[]; totalFreeMinutes: number } {
	const bufferPercent = Math.min(50, Math.max(0, options.bufferPercent ?? 10));
	const weekStart = options.weekStartISO ? new Date(options.weekStartISO + 'T00:00:00') : startOfNextWeek();
	const days: string[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
		days.push(toISODate(d));
	}

	const dailyFreeMinutes: number[] = days.map((iso) => {
		const free = getFreeIntervalsForDate(constraints, iso);
		const total = free.reduce((s, f) => s + (f.end - f.start), 0);
		const buffered = Math.round(total * (1 - bufferPercent / 100));
		return Math.max(0, buffered);
	});

	const totalFreeMinutes = dailyFreeMinutes.reduce((s, n) => s + n, 0);
	return { weekStartISO: toISODate(weekStart), dailyFreeMinutes, totalFreeMinutes };
}


