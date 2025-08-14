import type { Task } from '../models/task';
import type { Preference } from '../models/preference';
import type { Constraint } from '../models/constraint';
import { suggestWeeklyCapacity } from './capacity';

type DayPlan = {
	dateISO: string;
	assigned: { taskId: string; minutes: number; area: Task['area'] }[];
	remainingMinutes: number;
};

export type WeeklyDistribution = {
	weekStartISO: string;
	days: DayPlan[];
};

function getTaskMinutes(task: Task): number {
	return Math.max(5, Math.round(task.estimateMinutes / 5) * 5);
}

/**
 * Distribute tasks across next week trying to balance by area and not exceed daily capacity.
 * Greedy heuristic (MVP):
 * 1) Compute next-week daily capacity with buffer.
 * 2) Sort tasks by (importance * areaWeight) desc, shorter first for packing.
 * 3) For each task, pick the day with enough remaining capacity that currently has the least minutes for that task's area.
 *    If none fit, pick the day with max remaining capacity and allow small overflow up to +10m.
 */
export function distributeTasksAcrossWeek(
	tasks: Task[],
	constraints: Constraint[],
	prefs: Preference,
	options: { bufferPercent?: number; weekStartISO?: string } = {}
): WeeklyDistribution {
	const capacity = suggestWeeklyCapacity(constraints, {
		bufferPercent: options.bufferPercent ?? 15,
		weekStartISO: options.weekStartISO
	});

	const days: DayPlan[] = capacity.dailyFreeMinutes.map((m, idx) => ({
		dateISO: capacity.weekStartISO,
		assigned: [],
		remainingMinutes: m
	}));
	// fix dates per day
	for (let i = 0; i < days.length; i++) {
		const d = new Date(capacity.weekStartISO + 'T00:00:00');
		d.setDate(d.getDate() + i);
		days[i].dateISO = d.toISOString().slice(0, 10);
	}

	const weighted = [...tasks].map((t) => ({
		t,
		minutes: getTaskMinutes(t),
		weight: (prefs.areaWeights?.[t.area] ?? 5) * (t.importance ?? 5)
	}));
	weighted.sort((a, b) => b.weight - a.weight || a.minutes - b.minutes);

	const areaMinutesPerDay: Array<Record<Task['area'], number>> = days.map(() => ({
		work: 0,
		health: 0,
		social: 0,
		learning: 0,
		admin: 0,
		creative: 0,
		recovery: 0
	}));

	for (const item of weighted) {
		// Candidate days with enough capacity
		const candidates = days
			.map((d, i) => ({ i, d }))
			.filter(({ d }) => d.remainingMinutes >= item.minutes);

		let chosenIndex: number | null = null;
		if (candidates.length > 0) {
			// Choose the day where this area has the least minutes so far
			candidates.sort((a, b) => areaMinutesPerDay[a.i][item.t.area] - areaMinutesPerDay[b.i][item.t.area]);
			chosenIndex = candidates[0].i;
		} else {
			// Fallback: pick max remaining capacity, allow small overflow (up to +10m)
			let best = -1;
			let bestIdx = -1;
			for (let i = 0; i < days.length; i++) {
				const rem = days[i].remainingMinutes;
				if (rem > best && rem + 10 >= item.minutes) {
					best = rem;
					bestIdx = i;
				}
			}
			chosenIndex = bestIdx >= 0 ? bestIdx : 0;
		}

		const chosen = days[chosenIndex!];
		chosen.assigned.push({ taskId: item.t.id, minutes: item.minutes, area: item.t.area });
		chosen.remainingMinutes = Math.max(0, chosen.remainingMinutes - item.minutes);
		areaMinutesPerDay[chosenIndex!][item.t.area] += item.minutes;
	}

	return { weekStartISO: capacity.weekStartISO, days };
}


