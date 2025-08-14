import type { Task } from '../models/task';
import type { Preference } from '../models/preference';
import type { Constraint } from '../models/constraint';
import type { BlockType } from '../models/block';
import { getFreeIntervalsForDate } from './hard-constraints';

export type ScheduledBlock = {
  taskId: string | null;
  type: BlockType;
  startMin: number; // minutes since start of day
  endMin: number; // minutes since start of day
  label?: string;
};

type ScheduleOptions = {
  bufferMinutes?: number; // default 10
  breakThresholdMinutes?: number; // default 60
  breakMinutes?: number; // default 10
  // Placement rules
  chronotype?: 'early' | 'intermediate' | 'late';
};

function computeTaskPriority(task: Task, prefs: Preference): number {
  const areaWeight = prefs.areaWeights?.[task.area] ?? 5;
  // Higher importance and area weight boost; shorter tasks get slight bonus to pack efficiently
  const lengthPenalty = Math.max(15, task.estimateMinutes) / 60; // penalty for long tasks
  return task.importance * 2 + areaWeight - lengthPenalty;
}

function clampToInterval(start: number, duration: number, intervalEnd: number): [number, number] | null {
  const end = start + duration;
  if (end <= intervalEnd) return [start, end];
  return null;
}

export function preferredDeepWindows(chronotype: NonNullable<ScheduleOptions['chronotype']>): Array<[number, number]> {
  // minutes since start of day for preferred deep focus
  // early: 09:00–12:00, 13:00–15:00
  // intermediate: 10:00–13:00, 14:00–16:00
  // late: 14:00–18:00, 19:00–21:00
  switch (chronotype) {
    case 'early':
      return [
        [9 * 60, 12 * 60],
        [13 * 60, 15 * 60]
      ];
    case 'late':
      return [
        [14 * 60, 18 * 60],
        [19 * 60, 21 * 60]
      ];
    default:
      return [
        [10 * 60, 13 * 60],
        [14 * 60, 16 * 60]
      ];
  }
}

function nearMeetingWindows(constraints: Constraint[]): Array<[number, number]> {
  // windows within ±60 minutes of fixed meetings to cluster shallow/admin
  const result: Array<[number, number]> = [];
  for (const c of constraints) {
    if (c.type !== 'fixed') continue;
    const start = new Date(c.start);
    const end = new Date(c.end);
    const dayISO = start.toISOString().slice(0, 10);
    const dayStart = new Date(`${dayISO}T00:00:00`);
    const startMin = Math.max(0, Math.round((start.getTime() - dayStart.getTime()) / 60000) - 60);
    const endMin = Math.min(24 * 60, Math.round((end.getTime() - dayStart.getTime()) / 60000) + 60);
    result.push([startMin, endMin]);
  }
  return result;
}

function findPlacement(
  freeIntervals: { start: number; end: number }[],
  duration: number,
  preferredWindows?: Array<[number, number]>
): [number, number] | null {
  // First try preferred windows
  if (preferredWindows && preferredWindows.length > 0) {
    for (const [pwStart, pwEnd] of preferredWindows) {
      for (const interval of freeIntervals) {
        const start = Math.max(interval.start, pwStart);
        const endLimit = Math.min(interval.end, pwEnd);
        const placement = clampToInterval(start, duration, endLimit);
        if (placement) return placement;
      }
    }
  }
  // Fallback: anywhere in free intervals
  for (const interval of freeIntervals) {
    const placement = clampToInterval(interval.start, duration, interval.end);
    if (placement) return placement;
  }
  return null;
}

export function scheduleDay(
  tasks: Task[],
  constraints: Constraint[],
  prefs: Preference,
  dateISO: string,
  opts: ScheduleOptions = {}
): ScheduledBlock[] {
  const bufferMinutes = opts.bufferMinutes ?? 10; // soft buffer between blocks
  const breakThreshold = opts.breakThresholdMinutes ?? 60; // insert a break after long focus blocks
  const breakMinutes = opts.breakMinutes ?? 10;

  const freeIntervals = getFreeIntervalsForDate(constraints, dateISO);
  if (freeIntervals.length === 0) return [];

  // Prioritize tasks by weighted score
  const tasksSorted = [...tasks].sort((a, b) => computeTaskPriority(b, prefs) - computeTaskPriority(a, prefs));

  // Respect deep work capacity per day
  let remainingDeep = Math.max(0, prefs.deepWorkCapacity ?? 0);

  const scheduled: ScheduledBlock[] = [];

  for (const task of tasksSorted) {
    // Skip deep tasks if capacity exhausted
    if (task.energyType === 'deep' && remainingDeep <= 0) continue;

    const duration = Math.max(5, Math.round(task.estimateMinutes / 5) * 5);

    // Build preferred windows according to placement rules
    let preferred: Array<[number, number]> | undefined;
    if (task.energyType === 'deep' && opts.chronotype) {
      preferred = preferredDeepWindows(opts.chronotype);
    } else if (task.energyType === 'shallow') {
      preferred = nearMeetingWindows(constraints);
    }

    const placement = findPlacement(freeIntervals, duration, preferred);
    if (!placement) continue; // could not place
    const [startMin, endMin] = placement;

    scheduled.push({
      taskId: task.id,
      type: task.energyType === 'deep' ? 'deep' : 'shallow',
      startMin,
      endMin,
      label: task.title
    });

    // Insert break if needed by splitting the free interval used
    if (duration >= breakThreshold) {
      const breakEnd = Math.min(endMin + breakMinutes, 24 * 60);
      if (breakEnd > endMin) {
        scheduled.push({ taskId: null, type: 'break', startMin: endMin, endMin: breakEnd, label: 'Break' });
      }
    }

    if (task.energyType === 'deep') remainingDeep -= 1;

    // Update free intervals by subtracting used time plus buffer
    const usedEndWithBuffer = Math.min(endMin + bufferMinutes, 24 * 60);
    const updated: { start: number; end: number }[] = [];
    for (const f of freeIntervals) {
      if (endMin <= f.start || startMin >= f.end) {
        updated.push(f);
        continue;
      }
      // Split
      if (startMin > f.start) updated.push({ start: f.start, end: startMin });
      if (usedEndWithBuffer < f.end) updated.push({ start: usedEndWithBuffer, end: f.end });
    }
    freeIntervals.splice(0, freeIntervals.length, ...updated);
  }

  return scheduled;
}


