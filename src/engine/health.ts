import type { Constraint } from '../models/constraint';
import type { Preference } from '../models/preference';

type WorkoutSuggestion = {
  dateISO: string;
  startTime: string; // HH:MM
  minutes: number;
  kind: 'moderate' | 'strength';
  label: string;
};

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfNextWeek(today = new Date()): Date {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = ((8 - (day === 0 ? 7 : day)) % 7) || 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
}

/**
 * Suggest workouts for the next week using WHO defaults:
 * - Moderate activity target minutes per week (default 150) split into ~30m sessions
 * - Strength sessions per week (default 2), non-consecutive when possible
 * Placement heuristic:
 * - Default time 18:00 local; adjust to 07:00 if user prefers mornings later (not available yet), keep simple for MVP
 * - Distribute moderate on Mon/Wed/Fri/Sat/Sun; strength on Tue/Thu by default
 */
export function suggestWorkoutsForNextWeek(
  prefs: Preference,
  options: { weekStartISO?: string; moderateSessionMinutes?: number; strengthSessionMinutes?: number } = {}
): WorkoutSuggestion[] {
  const weekStart = options.weekStartISO
    ? new Date(options.weekStartISO + 'T00:00:00')
    : startOfNextWeek();
  const sessionModerate = Math.max(20, Math.min(60, options.moderateSessionMinutes ?? 30));
  const sessionStrength = Math.max(20, Math.min(60, options.strengthSessionMinutes ?? 30));
  const targetModerate = Math.max(0, prefs.weeklyModerateMinutesTarget ?? 150);
  const targetStrengthDays = Math.max(0, prefs.weeklyStrengthDaysTarget ?? 2);

  const moderateSessions = Math.max(0, Math.round(targetModerate / sessionModerate));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  }

  const picksModerate: number[] = [];
  const preferredModerateIdx = [0, 2, 4, 5, 6]; // Mon, Wed, Fri, Sat, Sun
  for (let i = 0; i < moderateSessions && i < preferredModerateIdx.length; i++) picksModerate.push(preferredModerateIdx[i]);
  // Strength on Tue/Thu by default
  const picksStrength: number[] = [];
  const preferredStrengthIdx = [1, 3]; // Tue, Thu
  for (let i = 0; i < targetStrengthDays && i < preferredStrengthIdx.length; i++) picksStrength.push(preferredStrengthIdx[i]);

  const suggestions: WorkoutSuggestion[] = [];
  for (const idx of picksModerate) {
    suggestions.push({
      dateISO: toISODate(days[idx]),
      startTime: '18:00',
      minutes: sessionModerate,
      kind: 'moderate',
      label: 'Workout (moderate)'
    });
  }
  for (const idx of picksStrength) {
    suggestions.push({
      dateISO: toISODate(days[idx]),
      startTime: '18:00',
      minutes: sessionStrength,
      kind: 'strength',
      label: 'Workout (strength)'
    });
  }

  // Sort by date then kind
  suggestions.sort((a, b) => (a.dateISO === b.dateISO ? a.kind.localeCompare(b.kind) : a.dateISO.localeCompare(b.dateISO)));
  return suggestions;
}


