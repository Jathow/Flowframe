import type { Preference } from '../models/preference';
import type { MoodLog } from '../models/mood';

export type ThrottleResult = {
  throttleFactor: number; // 0.6..1.0 (1.0 = no throttle)
  reason: 'ok' | 'low_mood' | 'declining_trend' | 'low_energy';
  avgMood: number | null;
  avgEnergy: number | null;
};

/**
 * Computes an auto-throttle factor based on recent mood logs.
 * Simple heuristic (MVP):
 * - If avg mood <= 3.5 → factor 0.7
 * - Else if declining by >= 2 points over window → 0.8
 * - Else if avg energy <= 3.5 → 0.85
 * - Otherwise → 1.0
 */
export function computeAutoThrottle(moods: MoodLog[], windowDays = 7): ThrottleResult {
  if (!moods || moods.length === 0) {
    return { throttleFactor: 1.0, reason: 'ok', avgMood: null, avgEnergy: null };
  }

  const byDate = [...moods].sort((a, b) => a.date.localeCompare(b.date));
  const recent = byDate.slice(-windowDays);
  const avgMood = recent.reduce((s, m) => s + (m.mood ?? 0), 0) / recent.length;
  const avgEnergy = recent.reduce((s, m) => s + (m.energy ?? 0), 0) / recent.length;

  // Trend: compare first vs last in window
  const first = recent[0];
  const last = recent[recent.length - 1];
  const moodDelta = (last?.mood ?? 0) - (first?.mood ?? 0);

  if (avgMood <= 3.5) return { throttleFactor: 0.7, reason: 'low_mood', avgMood, avgEnergy };
  if (moodDelta <= -2) return { throttleFactor: 0.8, reason: 'declining_trend', avgMood, avgEnergy };
  if (avgEnergy <= 3.5) return { throttleFactor: 0.85, reason: 'low_energy', avgMood, avgEnergy };
  return { throttleFactor: 1.0, reason: 'ok', avgMood, avgEnergy };
}

/**
 * Returns a preference object adjusted by the throttle factor.
 * - Reduces deepWorkCapacity proportionally (min 1 if original >=1)
 * - No other fields are changed for MVP
 */
export function adjustPreferencesForThrottle(prefs: Preference, factor: number): Preference {
  const original = prefs.deepWorkCapacity ?? 0;
  const reduced = Math.floor(original * factor);
  const deepWorkCapacity = original >= 1 ? Math.max(1, reduced) : 0;
  return { ...prefs, deepWorkCapacity };
}

/**
 * Adjust buffer minutes with throttling (more buffer when throttled).
 */
export function adjustBufferMinutes(defaultBuffer: number, factor: number): number {
  if (factor >= 0.99) return defaultBuffer;
  const extra = Math.round(defaultBuffer * (1 - factor));
  return defaultBuffer + Math.max(2, extra);
}


