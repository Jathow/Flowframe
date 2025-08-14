"use client";

import { useMemo, useState } from 'react';
import { useAppStore } from '../../../src/state/store';

const LOCAL_USER_ID = 'local-user';

export default function WellbeingPage() {
	const preferences = useAppStore((s) => s.preferences);
	const upsertPreference = useAppStore((s) => s.upsertPreference);

	const existing = useMemo(() => preferences.find((p) => p.userId === LOCAL_USER_ID), [preferences]);

	const [sleep, setSleep] = useState<number>(existing?.sleepTargetHours ?? 8);
	const [moderate, setModerate] = useState<number>(existing?.weeklyModerateMinutesTarget ?? 150);
	const [strength, setStrength] = useState<number>(existing?.weeklyStrengthDaysTarget ?? 2);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const onSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		await upsertPreference({
			userId: LOCAL_USER_ID,
			areaWeights: existing?.areaWeights ?? {},
			deepWorkCapacity: existing?.deepWorkCapacity ?? 3,
			breakPreference: existing?.breakPreference ?? 5,
			sleepTargetHours: sleep,
			screenDiscomfort: existing?.screenDiscomfort,
			weeklyModerateMinutesTarget: moderate,
			weeklyStrengthDaysTarget: strength
		});
		setSaving(false);
		setSaved(true);
	};

	return (
		<main>
			<h1>Well-being targets</h1>
			<p style={{ color: 'var(--muted)' }}>Defaults follow WHO guidance. Adjust as you like.</p>
			<form onSubmit={onSave} style={{ display: 'grid', gap: 16, maxWidth: 720, marginTop: 16 }}>
				<label>
					<span>Sleep target hours: {sleep.toFixed(1)}</span>
					<input type="range" min={6} max={9.5} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} />
				</label>
				<label>
					<span>Weekly moderate activity minutes: {moderate}</span>
					<input type="range" min={0} max={300} step={10} value={moderate} onChange={(e) => setModerate(Number(e.target.value))} />
				</label>
				<label>
					<span>Weekly strength days: {strength}</span>
					<input type="range" min={0} max={7} step={1} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
				</label>
				<div>
					<button disabled={saving} type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Save</button>
					{saved && <span style={{ marginLeft: 12, color: 'var(--muted)' }}>Saved</span>}
				</div>
			</form>
		</main>
	);
}


