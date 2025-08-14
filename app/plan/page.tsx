"use client";

import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { EmptyState, SkeletonBlock } from '../ui';
import { scheduleDay } from '../../src/engine/schedule';
import { scoreSchedule } from '../../src/engine/confidence';
import { preferredDeepWindows as _preferredDeepWindows } from '../../src/engine/schedule';

type BlockType = 'deep' | 'shallow' | 'break' | 'sleep' | 'commute' | 'workout' | 'meal' | 'buffer';
type BlockItem = { id: string; title: string; minutes: number; type: BlockType };

const GRID_MIN = 15; // snap-to-grid minutes
const SLOT_ORDER = ['morning', 'afternoon', 'evening'] as const;
type SlotId = (typeof SLOT_ORDER)[number];

function roundToGrid(minutes: number) {
	const snapped = Math.round(minutes / GRID_MIN) * GRID_MIN;
	return Math.max(5, snapped);
}

function Draggable({ id, title, type }: { id: string; title: string; type: BlockType }) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
	const style: React.CSSProperties = {
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
		padding: 8,
		borderRadius: 8,
		border: '1px solid rgba(255,255,255,0.12)'
	};
	return (
		<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
			<span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', marginRight: 8 }}>{type}</span>
			{title}
		</div>
	);
}

function Droppable({ id, children }: { id: string; children: React.ReactNode }) {
	const { isOver, setNodeRef } = useDroppable({ id });
	const style: React.CSSProperties = {
		background: isOver ? 'rgba(34,211,238,0.12)' : 'transparent',
		border: '1px dashed rgba(255,255,255,0.12)',
		minHeight: 120,
		borderRadius: 8,
		padding: 8
	};
	return (
		<div ref={setNodeRef} style={style}>
			{children}
		</div>
	);
}

export default function PlanPage() {
	const backlog = useMemo<BlockItem[]>(
		() => [
			{ id: 'b1', title: 'Write draft (90m)', minutes: 90, type: 'deep' },
			{ id: 'b2', title: 'Email sweep (30m)', minutes: 30, type: 'shallow' },
			{ id: 'b3', title: 'Admin (45m)', minutes: 45, type: 'shallow' },
			{ id: 'b4', title: 'Break (10m)', minutes: 10, type: 'break' },
			{ id: 'b5', title: 'Lunch (45m)', minutes: 45, type: 'meal' }
		],
		[]
	);
	const [customBacklog, setCustomBacklog] = useState<BlockItem[]>([]);
	const [newType, setNewType] = useState<BlockType>('deep');
	const [newTitle, setNewTitle] = useState<string>('');
	const [newMinutes, setNewMinutes] = useState<number>(60);
	const [quick, setQuick] = useState<string>('');

	const [slots, setSlots] = useState<Record<SlotId, BlockItem[]>>({
		morning: [],
		afternoon: [],
		evening: []
	});

	const removeFromAllSlots = (id: string) => {
		setSlots((prev) => ({
			morning: prev.morning.filter((b) => b.id !== id),
			afternoon: prev.afternoon.filter((b) => b.id !== id),
			evening: prev.evening.filter((b) => b.id !== id)
		}));
	};

	const addToSlot = (slot: SlotId, item: BlockItem) => {
		setSlots((prev) => ({ ...prev, [slot]: [...prev[slot], item] }));
	};

	const moveItemToSlot = (id: string, toSlot: SlotId) => {
		const sourceItem = [...slots.morning, ...slots.afternoon, ...slots.evening, ...backlog, ...customBacklog].find((b) => b.id === id);
		if (!sourceItem) return;
		setSlots((prev) => ({
			morning: prev.morning.filter((b) => b.id !== id),
			afternoon: prev.afternoon.filter((b) => b.id !== id),
			evening: prev.evening.filter((b) => b.id !== id)
		}));
		setSlots((prev) => ({ ...prev, [toSlot]: [...prev[toSlot], sourceItem] }));
	};

	const resizeItem = (id: string, deltaMinutes: number) => {
		setSlots((prev) => {
			const updateList = (list: BlockItem[]) =>
				list.map((b) =>
					b.id === id ? { ...b, minutes: Math.max(5, roundToGrid(b.minutes + deltaMinutes)) } : b
				);
			return {
				morning: updateList(prev.morning),
				afternoon: updateList(prev.afternoon),
				evening: updateList(prev.evening)
			};
		});
	};

	const onDragEnd = (ev: DragEndEvent) => {
		const overId = ev.over?.id as string | undefined;
		const activeId = ev.active.id as string;
		if (!overId) return;
		const item = [...backlog, ...customBacklog].find((b) => b.id === activeId);
		if (!item) return;
		// Remove if exists in any slot, then add to the new slot
		removeFromAllSlots(activeId);
		addToSlot(overId as SlotId, item);
	};

	const addCustom = () => {
		if (!newTitle.trim()) return;
		const id = `cb_${Date.now()}`;
		setCustomBacklog((prev) => [
			...prev,
			{ id, title: `${newTitle.trim()} (${newMinutes}m)`, minutes: newMinutes, type: newType }
		]);
		setNewTitle('');
	};

	function parseQuickCapture(input: string): { item: BlockItem; targetSlot?: SlotId } | null {
		const trimmed = input.trim();
		if (!trimmed) return null;
		// Example forms:
		// /deep 90 Write draft Fri morning
		// shallow 30 Email sweep
		const tokens = trimmed.split(/\s+/);
		let idx = 0;
		let typeToken = tokens[idx]?.toLowerCase() || '';
		if (typeToken.startsWith('/')) typeToken = typeToken.slice(1);
		const type: BlockType =
			(typeToken === 'deep' || typeToken === 'shallow' || typeToken === 'break' || typeToken === 'sleep' || typeToken === 'commute' || typeToken === 'workout' || typeToken === 'meal' || typeToken === 'buffer')
				? (typeToken as BlockType)
				: 'shallow';
		if (typeToken === tokens[idx].toLowerCase() || `/${typeToken}` === tokens[idx].toLowerCase()) idx++;

		let minutes = 60;
		if (idx < tokens.length && /^\d{1,3}$/.test(tokens[idx])) {
			minutes = roundToGrid(parseInt(tokens[idx], 10));
			idx++;
		}

		const remaining = tokens.slice(idx);
		let targetSlot: SlotId | undefined = undefined;
		const slotIdx = remaining.findIndex((t) => ['morning', 'afternoon', 'evening'].includes(t.toLowerCase()));
		if (slotIdx >= 0) {
			targetSlot = remaining[slotIdx].toLowerCase() as SlotId;
			remaining.splice(slotIdx, 1);
		}
		// Ignore day-of-week tokens for MVP
		const filtered = remaining.filter((t) => !/^mon|tue|wed|thu|fri|sat|sun$/i.test(t));
		const title = filtered.join(' ').trim() || `${type} block`;
		return {
			item: { id: `qc_${Date.now()}`, title: `${title} (${minutes}m)`, minutes, type },
			targetSlot
		};
	}

	const onQuickSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		const parsed = parseQuickCapture(quick);
		if (!parsed) return;
		setQuick('');
		if (parsed.targetSlot) {
			addToSlot(parsed.targetSlot, parsed.item);
		} else {
			setCustomBacklog((prev) => [...prev, parsed.item]);
		}
	};

	// Loading skeleton placeholder (MVP: lightweight, always visible very briefly)
	const loading = false;

	return (
		<main>
			<h1>Plan</h1>
			<p style={{ color: 'var(--muted)' }}>Drag items from backlog into day slots.</p>
			{loading && (
				<div style={{ margin: '12px 0' }}>
					<SkeletonBlock lines={3} />
				</div>
			)}
			<div style={{ margin: '12px 0', padding: 8, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
				<strong style={{ fontSize: 14 }}>Auto-schedule (demo)</strong>
				<p style={{ color: 'var(--muted)' }}>Generate a plan and show confidence.</p>
				<button
					onClick={() => {
						const demoTasks = [...backlog, ...customBacklog].map((b, i) => ({
							id: b.id,
							userId: 'u',
							title: b.title,
							area: 'work' as const,
							estimateMinutes: b.minutes,
							importance: 5,
							energyType: b.type === 'deep' ? 'deep' : 'shallow',
							flexibility: 5
						}));
						const constraints: any[] = [];
						const prefs = { userId: 'u', areaWeights: { work: 5 }, deepWorkCapacity: 2, breakPreference: 5, sleepTargetHours: 8 };
						const scheduled = scheduleDay(demoTasks as any, constraints as any, prefs as any, '2025-01-02', { chronotype: 'intermediate' });
						const total = demoTasks.reduce((s, t) => s + t.estimateMinutes, 0);
						const windows = _preferredDeepWindows('intermediate');
						const score = scoreSchedule(scheduled as any, prefs as any, constraints as any, total, { deepWindows: windows });
						alert(`Confidence: ${(score * 100).toFixed(0)}% with ${scheduled.length} blocks`);
					}}
					style={{ padding: '6px 10px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}
				>
					Generate
				</button>
			</div>
			<DndContext onDragEnd={onDragEnd}>
				<section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
					<div>
						<h2>Backlog</h2>
						<form onSubmit={onQuickSubmit} style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
							<input
								type="text"
								value={quick}
								onChange={(e) => setQuick(e.target.value)}
								placeholder="Quick capture: /deep 90 Write draft morning"
								style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text)' }}
							/>
							<button type="submit" style={{ padding: '6px 10px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Add</button>
						</form>
						<div style={{ display: 'grid', gap: 8, marginBottom: 12, padding: 8, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
							<strong style={{ fontSize: 14 }}>New block</strong>
							<label>
								<span>Type</span>
								<select value={newType} onChange={(e) => setNewType(e.target.value as BlockType)} style={{ marginLeft: 8 }}>
									<option value="deep">deep</option>
									<option value="shallow">shallow</option>
									<option value="break">break</option>
									<option value="sleep">sleep</option>
									<option value="commute">commute</option>
									<option value="workout">workout</option>
									<option value="meal">meal</option>
									<option value="buffer">buffer</option>
								</select>
							</label>
							<label>
								<span>Title</span>
								<input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ marginLeft: 8 }} placeholder="e.g., Deep: Write draft" />
							</label>
							<label>
								<span>Minutes</span>
								<input type="number" min={5} max={300} step={5} value={newMinutes} onChange={(e) => setNewMinutes(Number(e.target.value))} style={{ marginLeft: 8, width: 100 }} />
							</label>
							<div>
								<button type="button" onClick={addCustom} style={{ padding: '6px 10px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Add</button>
							</div>
						</div>
						<div style={{ display: 'grid', gap: 8 }}>
							{[...backlog, ...customBacklog].length === 0 ? (
								<EmptyState title="No backlog yet" description="Use quick capture or the form to add tasks." />
							) : (
								[...backlog, ...customBacklog].map((b) => (
									<Draggable key={b.id} id={b.id} title={b.title} type={b.type} />
								))
							)}
						</div>
					</div>
					<div style={{ display: 'grid', gap: 12 }}>
						<h2>Today</h2>
						<label>Morning< Droppable id="morning">{slots.morning.length === 0 ? <EmptyState title="Nothing planned" description="Drag items here to plan your morning." /> : slots.morning.map((s) => (
							<SlotBlock key={s.id} slotId="morning" item={s} onResize={resizeItem} onMove={moveItemToSlot} />
						))}</Droppable></label>
						<label>Afternoon< Droppable id="afternoon">{slots.afternoon.length === 0 ? <EmptyState title="Nothing planned" description="Drag items here to plan your afternoon." /> : slots.afternoon.map((s) => (
							<SlotBlock key={s.id} slotId="afternoon" item={s} onResize={resizeItem} onMove={moveItemToSlot} />
						))}</Droppable></label>
						<label>Evening< Droppable id="evening">{slots.evening.length === 0 ? <EmptyState title="Nothing planned" description="Drag items here to plan your evening." /> : slots.evening.map((s) => (
							<SlotBlock key={s.id} slotId="evening" item={s} onResize={resizeItem} onMove={moveItemToSlot} />
						))}</Droppable></label>
					</div>
				</section>
			</DndContext>
		</main>
	);
}

function SlotBlock({ item, slotId, onResize, onMove }: { item: BlockItem; slotId: SlotId; onResize: (id: string, delta: number) => void; onMove: (id: string, to: SlotId) => void }) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
	const style: React.CSSProperties = {
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
		padding: 8,
		borderRadius: 8,
		border: '1px solid rgba(255,255,255,0.12)',
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		margin: '6px 0'
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			onResize(item.id, -GRID_MIN);
		}
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			onResize(item.id, +GRID_MIN);
		}
		if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
			e.preventDefault();
			const idx = SLOT_ORDER.indexOf(slotId);
			if (e.key === 'ArrowUp' && idx > 0) onMove(item.id, SLOT_ORDER[idx - 1]);
			if (e.key === 'ArrowDown' && idx < SLOT_ORDER.length - 1) onMove(item.id, SLOT_ORDER[idx + 1]);
		}
	};

	return (
		<div ref={setNodeRef} style={style} tabIndex={0} onKeyDown={onKeyDown} {...listeners} {...attributes}>
			<span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', minWidth: 70 }}>{item.type}</span>
			<span style={{ flex: 1 }}>{item.title}</span>
			<span style={{ fontVariantNumeric: 'tabular-nums' }}>{roundToGrid(item.minutes)}m</span>
			<div style={{ display: 'flex', gap: 6 }}>
				<button type="button" onClick={() => onResize(item.id, -GRID_MIN)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>-15</button>
				<button type="button" onClick={() => onResize(item.id, +GRID_MIN)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>+15</button>
			</div>
		</div>
	);
}


