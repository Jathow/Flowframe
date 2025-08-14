"use client";

import { useEffect, useState } from 'react';
import { useAppStore } from '../../../src/state/store';
import type { Chronotype, User } from '../../../src/models/user';
import type { Preference } from '../../../src/models/preference';

const LOCAL_USER_ID = 'local-user';

export default function LifestylePage() {
	const users = useAppStore((s) => s.users);
	const preferences = useAppStore((s) => s.preferences);
	const upsertUser = useAppStore((s) => s.upsertUser);
	const upsertPreference = useAppStore((s) => s.upsertPreference);

	const existingUser = users.find((u) => u.id === LOCAL_USER_ID);
	const existingPref = preferences.find((p) => p.userId === LOCAL_USER_ID);

	const [chronotype, setChronotype] = useState<Chronotype>(existingUser?.chronotype ?? 'intermediate');
	const [deep, setDeep] = useState<number>(existingPref?.deepWorkCapacity ?? 3);
	const [breakPref, setBreakPref] = useState<number>(existingPref?.breakPreference ?? 5);
	const [screen, setScreen] = useState<number>(existingPref?.screenDiscomfort ?? 3);
	const [sleepTarget, setSleepTarget] = useState<number>(existingPref?.sleepTargetHours ?? 8);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		setSaved(false);
	}, [chronotype, deep, breakPref, screen, sleepTarget]);

	const onSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		const user: User = {
			id: LOCAL_USER_ID,
			locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
			timeZone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
			chronotype
		};
		const pref: Preference = {
			userId: LOCAL_USER_ID,
			areaWeights: existingPref?.areaWeights ?? {},
			deepWorkCapacity: deep,
			breakPreference: breakPref,
			sleepTargetHours: sleepTarget,
			screenDiscomfort: screen
		};
		await upsertUser(user);
		await upsertPreference(pref);
		setSaving(false);
		setSaved(true);
	};

	return (
		<main>
			<h1>Lifestyle & capacity</h1>
			<p style={{ color: 'var(--muted)' }}>These help seed your schedule defaults. You can change them later.</p>
			<form onSubmit={onSave} style={{ display: 'grid', gap: 16, maxWidth: 720, marginTop: 16 }}>
				<label>
					<span>Chronotype</span>
					<select value={chronotype} onChange={(e) => setChronotype(e.target.value as Chronotype)} style={{ marginLeft: 8 }}>
						<option value="early">Early</option>
						<option value="intermediate">Intermediate</option>
						<option value="late">Late</option>
					</select>
				</label>
				<label>
					<span>Deep focus capacity (blocks/day): {deep}</span>
					<input type="range" min={0} max={5} value={deep} onChange={(e) => setDeep(Number(e.target.value))} />
				</label>
				<label>
					<span>Break preference: {breakPref}</span>
					<input type="range" min={0} max={10} value={breakPref} onChange={(e) => setBreakPref(Number(e.target.value))} />
				</label>
				<label>
					<span>Screen discomfort: {screen}</span>
					<input type="range" min={0} max={10} value={screen} onChange={(e) => setScreen(Number(e.target.value))} />
				</label>
				<label>
					<span>Sleep target hours: {sleepTarget.toFixed(1)}</span>
					<input type="range" step={0.5} min={6} max={9.5} value={sleepTarget} onChange={(e) => setSleepTarget(Number(e.target.value))} />
				</label>
				<div>
					<button disabled={saving} type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>
						Save
					</button>
					{saved && <span style={{ marginLeft: 12, color: 'var(--muted)' }}>Saved</span>}
				</div>
			</form>
		</main>
	);
}


