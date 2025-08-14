import type { MoodLog } from '../models/mood';

export type WeeklyInsight = {
	metric: 'avg_mood' | 'avg_energy' | 'mood_trend' | 'suggestion';
	value: number;
	note?: string;
};

function average(values: number[]): number {
	if (values.length === 0) return 0;
	return values.reduce((s, n) => s + n, 0) / values.length;
}

export function computeWeeklyInsights(moods: MoodLog[], windowDays = 7): WeeklyInsight[] {
	if (!moods || moods.length === 0) return [];
	const byDate = [...moods].sort((a, b) => a.date.localeCompare(b.date));
	const recent = byDate.slice(-windowDays);
	const avgMood = average(recent.map((m) => m.mood));
	const avgEnergy = average(recent.map((m) => m.energy));
	const trend = (recent.at(-1)?.mood ?? 0) - (recent[0]?.mood ?? 0);

	const insights: WeeklyInsight[] = [
		{ metric: 'avg_mood', value: Number(avgMood.toFixed(2)) },
		{ metric: 'avg_energy', value: Number(avgEnergy.toFixed(2)) },
		{ metric: 'mood_trend', value: Number(trend.toFixed(2)) },
	];

	// Gentle suggestions
	if (avgMood <= 4) {
		insights.push({
			metric: 'suggestion',
			value: 1,
			note: 'Consider reducing planned load and adding more recovery time this week.',
		});
	}
	if (trend <= -2) {
		insights.push({
			metric: 'suggestion',
			value: 1,
			note: 'Mood trend is down. Try shorter deep blocks or fewer per day.',
		});
	}
	if (avgEnergy <= 4.5) {
		insights.push({
			metric: 'suggestion',
			value: 1,
			note: 'Energy is low. Schedule movement breaks and lighter tasks after lunch.',
		});
	}
	if (insights.filter((i) => i.metric === 'suggestion').length === 0) {
		insights.push({
			metric: 'suggestion',
			value: 1,
			note: 'You seem stable. Maintain buffers and keep protecting sleep and breaks.',
		});
	}
	return insights;
}

// Meeting-aware focus suggestions: suggest clustering shallow work near meetings
// and protecting deep-focus windows away from meetings for a specific date.
export function computeMeetingAwareSuggestions(
	constraints: Constraint[],
	dateISO: string,
): WeeklyInsight[] {
	const fixed = constraints.filter((c) => c.type === 'fixed');
	if (fixed.length === 0) return [];

	// Consider only events on the given date
	const dayStart = new Date(`${dateISO}T00:00:00`);
	const dayEnd = new Date(`${dateISO}T23:59:59`);
	const windows: Array<[number, number]> = [];
	for (const c of fixed) {
		const start = new Date(c.start);
		const end = new Date(c.end);
		if (end < dayStart || start > dayEnd) continue;
		const startMin = Math.max(0, Math.round((start.getTime() - dayStart.getTime()) / 60000) - 60);
		const endMin = Math.min(24 * 60, Math.round((end.getTime() - dayStart.getTime()) / 60000) + 60);
		windows.push([startMin, endMin]);
	}
	if (windows.length === 0) return [];

	// Merge overlapping windows
	windows.sort((a, b) => a[0] - b[0]);
	const merged: Array<[number, number]> = [];
	for (const w of windows) {
		if (merged.length === 0) {
			merged.push(w);
		} else {
			const last = merged[merged.length - 1];
			if (w[0] <= last[1]) {
				last[1] = Math.max(last[1], w[1]);
			} else {
				merged.push(w);
			}
		}
	}

	const fmt = (m: number) => {
		const hh = Math.floor(m / 60)
			.toString()
			.padStart(2, '0');
		const mm = (m % 60).toString().padStart(2, '0');
		return `${hh}:${mm}`;
	};
	const summary = merged.map(([s, e]) => `${fmt(s)}–${fmt(e)}`).join(', ');

	const suggestions: WeeklyInsight[] = [];
	suggestions.push({
		metric: 'suggestion',
		value: 1,
		note: `Meeting-aware: cluster shallow/admin near ${summary}. Protect deep blocks at least 60 min away.`,
	});
	return suggestions;
}
