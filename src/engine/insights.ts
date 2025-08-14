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
    { metric: 'mood_trend', value: Number(trend.toFixed(2)) }
  ];

  // Gentle suggestions
  if (avgMood <= 4) {
    insights.push({ metric: 'suggestion', value: 1, note: 'Consider reducing planned load and adding more recovery time this week.' });
  }
  if (trend <= -2) {
    insights.push({ metric: 'suggestion', value: 1, note: 'Mood trend is down. Try shorter deep blocks or fewer per day.' });
  }
  if (avgEnergy <= 4.5) {
    insights.push({ metric: 'suggestion', value: 1, note: 'Energy is low. Schedule movement breaks and lighter tasks after lunch.' });
  }
  if (insights.filter((i) => i.metric === 'suggestion').length === 0) {
    insights.push({ metric: 'suggestion', value: 1, note: 'You seem stable. Maintain buffers and keep protecting sleep and breaks.' });
  }
  return insights;
}


