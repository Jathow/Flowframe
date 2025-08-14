export type Interval = { start: number; end: number }; // minutes since start of day [start, end)

export function clampInterval(interval: Interval, min: number, max: number): Interval | null {
	const start = Math.max(min, interval.start);
	const end = Math.min(max, interval.end);
	if (end <= start) return null;
	return { start, end };
}

export function mergeIntervals(intervals: Interval[]): Interval[] {
	if (intervals.length === 0) return [];
	const sorted = [...intervals].sort((a, b) => a.start - b.start);
	const merged: Interval[] = [sorted[0]];
	for (let i = 1; i < sorted.length; i++) {
		const prev = merged[merged.length - 1];
		const curr = sorted[i];
		if (curr.start <= prev.end) {
			prev.end = Math.max(prev.end, curr.end);
		} else {
			merged.push({ ...curr });
		}
	}
	return merged;
}

export function invertIntervals(range: Interval, busy: Interval[]): Interval[] {
	const merged = mergeIntervals(busy);
	const free: Interval[] = [];
	let cursor = range.start;
	for (const b of merged) {
		if (b.start > cursor) free.push({ start: cursor, end: Math.min(b.start, range.end) });
		cursor = Math.max(cursor, b.end);
		if (cursor >= range.end) break;
	}
	if (cursor < range.end) free.push({ start: cursor, end: range.end });
	return free.filter((i) => i.end > i.start);
}

export function minutesBetween(a: Date, b: Date): number {
	return Math.round((b.getTime() - a.getTime()) / 60000);
}


