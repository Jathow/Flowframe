"use client";

import { useMemo, useState } from 'react';
import { useAppStore } from '../../src/state/store';

const LOCAL_USER_ID = 'local-user';

export default function ReviewPage() {
  const moods = useAppStore((s) => s.moods);
  const addMood = useAppStore((s) => s.addMood);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayExisting = useMemo(() => moods.find((m) => m.userId === LOCAL_USER_ID && m.date === todayISO), [moods, todayISO]);

  const [mood, setMood] = useState<number>(todayExisting?.mood ?? 5);
  const [energy, setEnergy] = useState<number>(todayExisting?.energy ?? 5);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const onSave: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setSaving(true);
    await addMood({ userId: LOCAL_USER_ID, date: todayISO, mood, energy } as any);
    setSaving(false);
  };

  const recent = useMemo(() => moods.filter((m) => m.userId === LOCAL_USER_ID).slice(-7).reverse(), [moods]);

  return (
    <main>
      <h1>Review</h1>
      <p style={{ color: 'var(--muted)' }}>Log mood and energy; recent entries are shown below.</p>

      <form onSubmit={onSave} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <label>
          <span>Mood (0–10)</span>
          <input type="range" min={0} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
          <span style={{ marginLeft: 8 }}>{mood}</span>
        </label>
        <label>
          <span>Energy (0–10)</span>
          <input type="range" min={0} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
          <span style={{ marginLeft: 8 }}>{energy}</span>
        </label>
        <label>
          <span>Note (optional)</span>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What helped?" />
        </label>
        <div>
          <button type="submit" disabled={saving} style={{ padding: '6px 10px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Save</button>
        </div>
      </form>

      <section style={{ marginTop: 24 }}>
        <h2>Recent</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {recent.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No entries yet.</p>
          ) : (
            recent.map((m) => (
              <div key={m.id} style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8 }}>
                <strong>{m.date}</strong>
                <span style={{ marginLeft: 8 }}>Mood {m.mood}</span>
                <span style={{ marginLeft: 8 }}>Energy {m.energy}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}


