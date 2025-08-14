"use client";

import Papa from 'papaparse';
import { useState } from 'react';
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
	const [googleCount, setGoogleCount] = useState<number | null>(null);
	const [msCount, setMsCount] = useState<number | null>(null);

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

	// Stub connectors for Google/Microsoft read-only import
	function simulateGoogleEvents(): { summary: string; start: string; end: string }[] {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const e1Start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0);
		const e1End = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0);
		const e2Start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0);
		const e2End = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30);
		const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
		const e3Start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 30);
		const e3End = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0);
		return [
			{ summary: 'Google: Standup', start: e1Start.toISOString(), end: e1End.toISOString() },
			{ summary: 'Google: 1:1', start: e2Start.toISOString(), end: e2End.toISOString() },
			{ summary: 'Google: Daily planning', start: e3Start.toISOString(), end: e3End.toISOString() }
		];
	}

	function simulateMicrosoftEvents(): { summary: string; start: string; end: string }[] {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const e1Start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0);
		const e1End = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 45);
		const e2Start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0);
		const e2End = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0);
		return [
			{ summary: 'Microsoft: Lunch catch-up', start: e1Start.toISOString(), end: e1End.toISOString() },
			{ summary: 'Microsoft: Status review', start: e2Start.toISOString(), end: e2End.toISOString() }
		];
	}

	const onConnectGoogleStub = async () => {
		const events = simulateGoogleEvents();
		for (const ev of events) {
			await addConstraint({
				userId: LOCAL_USER_ID,
				type: 'fixed',
				start: ev.start,
				end: ev.end,
				label: ev.summary
			} as any);
		}
		setGoogleCount(events.length);
	};

	const onConnectMicrosoftStub = async () => {
		const events = simulateMicrosoftEvents();
		for (const ev of events) {
			await addConstraint({
				userId: LOCAL_USER_ID,
				type: 'fixed',
				start: ev.start,
				end: ev.end,
				label: ev.summary
			} as any);
		}
		setMsCount(events.length);
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
			<p style={{ color: 'var(--muted)' }}>Import calendars (ICS) and tasks (CSV). Connectors below are read-only stubs.</p>
			<section style={{ display: 'grid', gap: 16, maxWidth: 720, marginTop: 16 }}>
				<div>
					<h2>Calendar import (ICS)</h2>
					<input type="file" accept="text/calendar,.ics" onChange={onIcsUpload} />
					{icsCount !== null && <p style={{ color: 'var(--muted)' }}>Imported {icsCount} events</p>}
				</div>
				<div>
					<h2>Calendar connect (Google/Microsoft) — stub</h2>
					<div style={{ display: 'flex', gap: 8 }}>
						<button onClick={onConnectGoogleStub}>Connect Google (stub)</button>
						<button onClick={onConnectMicrosoftStub}>Connect Microsoft (stub)</button>
					</div>
					{googleCount !== null && <p style={{ color: 'var(--muted)' }}>Imported {googleCount} Google events</p>}
					{msCount !== null && <p style={{ color: 'var(--muted)' }}>Imported {msCount} Microsoft events</p>}
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


