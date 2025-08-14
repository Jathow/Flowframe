import type { ScheduledBlock } from './schedule';
import type { Preference } from '../models/preference';
import type { Constraint } from '../models/constraint';

function clamp01(n: number) {
	return Math.max(0, Math.min(1, n));
}

export function scoreSchedule(
	scheduled: ScheduledBlock[],
	prefs: Preference,
	constraints: Constraint[],
	allTasksMinutes: number,
	options: { deepWindows?: Array<[number, number]> } = {}
): number {
	let score = 1.0;

	// Coverage: fraction of requested minutes scheduled
	const scheduledMinutes = scheduled
		.filter((b) => b.taskId)
		.reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
	const coverage = allTasksMinutes > 0 ? scheduledMinutes / allTasksMinutes : 1;
	// Weight: if low coverage, penalize up to 0.4
	score -= (1 - clamp01(coverage)) * 0.4;

	// Deep within preferred windows
	if (options.deepWindows && options.deepWindows.length > 0) {
		const deepBlocks = scheduled.filter((b) => b.type === 'deep');
		let aligned = 0;
		for (const b of deepBlocks) {
			const center = (b.startMin + b.endMin) / 2;
			if (options.deepWindows.some(([s, e]) => center >= s && center <= e)) aligned++;
		}
		const ratio = deepBlocks.length > 0 ? aligned / deepBlocks.length : 1;
		// Penalize misalignment up to 0.3
		score -= (1 - ratio) * 0.3;
	}

	// Break adequacy: long blocks without adjacent break
	const longBlocks = scheduled.filter((b) => b.taskId && b.endMin - b.startMin >= 60);
	let missingBreaks = 0;
	for (const b of longBlocks) {
		const hasBreak = scheduled.some(
			(x) => x.type === 'break' && (x.startMin === b.endMin || x.endMin === b.startMin)
		);
		if (!hasBreak) missingBreaks++;
	}
	if (longBlocks.length > 0) {
		const ratio = 1 - missingBreaks / longBlocks.length;
		// Penalize missing breaks up to 0.2
		score -= (1 - ratio) * 0.2;
	}

	return clamp01(score);
}


