"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../../src/state/store';
import { AREAS, type Area } from '../../../src/models/area';

const LOCAL_USER_ID = 'local-user';

export default function AreaImportancePage() {
	const preferences = useAppStore((s) => s.preferences);
	const upsertPreference = useAppStore((s) => s.upsertPreference);

	const existing = useMemo(() => preferences.find((p) => p.userId === LOCAL_USER_ID), [preferences]);

	const [weights, setWeights] = useState<Record<Area, number>>(() => {
		const initial: Record<Area, number> = {
			work: 5,
			health: 5,
			social: 5,
			learning: 5,
			admin: 5,
			creative: 5,
			recovery: 5
		};
		if (existing?.areaWeights) {
			for (const a of AREAS) {
				const val = existing.areaWeights[a];
				if (typeof val === 'number') initial[a] = val;
			}
		}
		return initial;
	});

	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => setSaved(false), [weights]);

	const onSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		await upsertPreference({
			userId: LOCAL_USER_ID,
			areaWeights: weights,
			deepWorkCapacity: existing?.deepWorkCapacity ?? 3,
			breakPreference: existing?.breakPreference ?? 5,
			sleepTargetHours: existing?.sleepTargetHours ?? 8,
			screenDiscomfort: existing?.screenDiscomfort
		});
		setSaving(false);
		setSaved(true);
	};

	return (
		<main>
			<h1>Area importance</h1>
			<p style={{ color: 'var(--muted)' }}>Rate each area 0–10 to guide scheduling priorities.</p>
			<form onSubmit={onSave} style={{ display: 'grid', gap: 16, maxWidth: 720, marginTop: 16 }}>
				{AREAS.map((area) => (
					<label key={area} style={{ display: 'grid', gap: 6 }}>
						<span style={{ textTransform: 'capitalize' }}>{area}: {weights[area]}</span>
						<input
							type="range"
							min={0}
							max={10}
							value={weights[area]}
							onChange={(e) => setWeights((w) => ({ ...w, [area]: Number(e.target.value) }))}
						/>
					</label>
				))}
				<div>
					<button disabled={saving} type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Save</button>
					{saved && <span style={{ marginLeft: 12, color: 'var(--muted)' }}>Saved</span>}
				</div>
			</form>
		</main>
	);
}


