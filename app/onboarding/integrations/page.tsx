"use client";

import Papa from 'papaparse';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useAppStore } from '../../../src/state/store';
import type { Task } from '../../../src/models/task';

const LOCAL_USER_ID = 'local-user';

function parseICS(icsText: string) {
	const events: { summary?: string; start?: string; end?: string }[] = [];
	const lines = icsText.split(/\r?\n/);
	let current: any = null;
	for (const raw of lines) {
		const line = raw.trim();
		if (line === 'BEGIN:VEVENT') current = {};
		else if (line === 'END:VEVENT') {
			if (current) events.push(current);
			current = null;
		} else if (current) {
			if (line.startsWith('SUMMARY:')) current.summary = line.slice('SUMMARY:'.length);
			if (line.startsWith('DTSTART')) {
				const [, value] = line.split(':');
				current.start = value;
			}
			if (line.startsWith('DTEND')) {
				const [, value] = line.split(':');
				current.end = value;
			}
		}
	}
	return events;
}

export default function IntegrationsPage() {
	const addTask = useAppStore((s) => s.addTask);
	const addConstraint = useAppStore((s) => s.addConstraint);
	const [icsCount, setIcsCount] = useState<number | null>(null);
	const [csvCount, setCsvCount] = useState<number | null>(null);

	const onIcsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const text = await file.text();
		const events = parseICS(text).slice(0, 100); // MVP: import first 100
		for (const ev of events) {
			if (!ev.start || !ev.end) continue;
			await addConstraint({
				userId: LOCAL_USER_ID,
				type: 'fixed',
				start: new Date(ev.start).toISOString(),
				end: new Date(ev.end).toISOString(),
				label: ev.summary
			} as any);
		}
		setIcsCount(events.length);
	};

	const onCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const csv = await file.text();
		const parsed = Papa.parse(csv, { header: true });
		let count = 0;
		for (const row of parsed.data as any[]) {
			const title = String(row.title || row.Name || row.Task || '').trim();
			if (!title) continue;
			const minutes = Number(row.minutes || row.Estimate || row.Duration || 30);
			const area = String(row.area || 'work').toLowerCase();
			const task: Omit<Task, 'id'> = {
				userId: LOCAL_USER_ID,
				title,
				area: ['work','health','social','learning','admin','creative','recovery'].includes(area) ? area : 'work',
				estimateMinutes: Number.isFinite(minutes) ? minutes : 30,
				importance: Number(row.importance ?? 5),
				energyType: String(row.energyType || 'shallow').toLowerCase() === 'deep' ? 'deep' : 'shallow',
				flexibility: Number(row.flexibility ?? 5)
			};
			await addTask(task as any);
			count++;
		}
		setCsvCount(count);
	};

	return (
		<main>
			<h1>Integrations</h1>
			<p style={{ color: 'var(--muted)' }}>Import calendars (ICS) and tasks (CSV) for the MVP.</p>
			<section style={{ display: 'grid', gap: 16, maxWidth: 720, marginTop: 16 }}>
				<div>
					<h2>Calendar import (ICS)</h2>
					<input type="file" accept="text/calendar,.ics" onChange={onIcsUpload} />
					{icsCount !== null && <p style={{ color: 'var(--muted)' }}>Imported {icsCount} events</p>}
				</div>
				<div>
					<h2>Task import (CSV)</h2>
					<input type="file" accept=".csv,text/csv" onChange={onCsvUpload} />
					{csvCount !== null && <p style={{ color: 'var(--muted)' }}>Imported {csvCount} tasks</p>}
				</div>
			</section>
		</main>
	);
}


