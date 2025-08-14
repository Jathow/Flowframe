"use client";

import { useState } from 'react';
import { useAppStore } from '../../../src/state/store';
import type { Constraint, ConstraintType } from '../../../src/models/constraint';

type NewConstraint = {
	type: ConstraintType;
	label?: string;
	start: string; // datetime-local
	end: string; // datetime-local
};

const defaultNewConstraint: NewConstraint = {
	type: 'sleep',
	label: 'Sleep',
	start: '',
	end: ''
};

export default function HardConstraintsPage() {
	const constraints = useAppStore((s) => s.constraints);
	const addConstraint = useAppStore((s) => s.addConstraint);
	const deleteConstraint = useAppStore((s) => s.deleteConstraint);

	const [form, setForm] = useState<NewConstraint>(defaultNewConstraint);
	const [busy, setBusy] = useState(false);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.start || !form.end) return;
		setBusy(true);
		const input: Omit<Constraint, 'id'> = {
			userId: 'local-user',
			type: form.type,
			start: new Date(form.start).toISOString(),
			end: new Date(form.end).toISOString(),
			label: form.label?.trim() || undefined
		};
		await addConstraint(input as any);
		setForm((prev) => ({ ...defaultNewConstraint, type: prev.type }));
		setBusy(false);
	};

	return (
		<main>
			<h1>Onboarding: Hard constraints</h1>
			<p style={{ color: 'var(--muted)' }}>Add sleep windows, fixed events, commute, or no-go times.</p>
			<form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 720, marginTop: 16 }}>
				<label>
					<span>Type</span>
					<select
						value={form.type}
						onChange={(e) =>
							setForm((f) => ({
								...f,
								type: e.target.value as ConstraintType,
								label: e.target.value === 'sleep' ? 'Sleep' : f.label
							}))
						}
						style={{ marginLeft: 8 }}
					>
						<option value="sleep">Sleep</option>
						<option value="fixed">Fixed event</option>
						<option value="commute">Commute</option>
						<option value="no-go">No-go</option>
					</select>
				</label>
				{form.type !== 'sleep' && (
					<label>
						<span>Label</span>
						<input
							type="text"
							value={form.label || ''}
							onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
							placeholder="e.g., Team standup"
							style={{ marginLeft: 8 }}
						/>
					</label>
				)}
				<label>
					<span>Start</span>
					<input
						type="datetime-local"
						value={form.start}
						onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
						style={{ marginLeft: 8 }}
					/>
				</label>
				<label>
					<span>End</span>
					<input
						type="datetime-local"
						value={form.end}
						onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
						style={{ marginLeft: 8 }}
					/>
				</label>
				<div>
					<button disabled={busy} type="submit" style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>
						Add constraint
					</button>
				</div>
			</form>

			<section style={{ marginTop: 24 }}>
				<h2>Existing constraints</h2>
				<ul>
					{constraints
						.filter((c) => c.type === 'sleep' || c.type === 'fixed' || c.type === 'commute' || c.type === 'no-go')
						.map((c) => (
							<li key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
								<span style={{ minWidth: 80, textTransform: 'uppercase', fontSize: 12, color: 'var(--muted)' }}>{c.type}</span>
								<span>{c.label ?? '—'}</span>
								<span style={{ color: 'var(--muted)' }}>{new Date(c.start).toLocaleString()} → {new Date(c.end).toLocaleString()}</span>
								<button onClick={() => deleteConstraint(c.id)} style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Delete</button>
							</li>
						))}
				</ul>
			</section>
		</main>
	);
}


