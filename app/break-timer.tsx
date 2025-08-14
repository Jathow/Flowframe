"use client";

import { useEffect, useRef, useState } from 'react';

type TimerState = 'stopped' | 'running' | 'paused' | 'microbreak';
type PomodoroMode = 'off' | 'p25' | 'p50';
type PomodoroPhase = 'stopped' | 'focus' | 'break';

export function BreakTimer() {
	const MICROBREAK_INTERVAL_MIN = 20;
	const MICROBREAK_SECONDS = 20;
	const MOVEMENT_INTERVAL_MIN = 60; // MVP default

	const [state, setState] = useState<TimerState>('stopped');
	const [focusSeconds, setFocusSeconds] = useState(0);
	const [microbreakRemaining, setMicrobreakRemaining] = useState<number | null>(null);
	const [movementDue, setMovementDue] = useState(false);
	const lastMicroRef = useRef<number>(0);
	const lastMoveRef = useRef<number>(0);
	const snoozeUntilRef = useRef<number | null>(null);

	// Pomodoro state
	const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('off');
	const [pPhase, setPPhase] = useState<PomodoroPhase>('stopped');
	const [pRemaining, setPRemaining] = useState<number>(0);

	// Pause when page hidden; only active when tab visible
	useEffect(() => {
		const onVisibility = () => {
			if (document.hidden && state === 'running') {
				setState('paused');
			}
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	}, [state]);

	useEffect(() => {
		if (state === 'running') {
			const id = window.setInterval(() => {
				setFocusSeconds((s) => s + 1);
				// Suppress microbreak/movement prompts while Pomodoro is active
				if (pomodoroMode === 'off') {
					// Microbreak trigger
					const sinceMicro = focusSeconds - lastMicroRef.current;
					if (sinceMicro >= MICROBREAK_INTERVAL_MIN * 60) {
						lastMicroRef.current = focusSeconds;
						setState('microbreak');
						setMicrobreakRemaining(MICROBREAK_SECONDS);
					}
					// Movement reminder
					const nowSec = focusSeconds;
					const snoozeOk = snoozeUntilRef.current === null || nowSec >= snoozeUntilRef.current;
					if (snoozeOk && nowSec - lastMoveRef.current >= MOVEMENT_INTERVAL_MIN * 60) {
						setMovementDue(true);
					}
				}
			}, 1000);
			return () => window.clearInterval(id);
		}
		if (state === 'microbreak') {
			const id = window.setInterval(() => {
				setMicrobreakRemaining((r) => {
					if (r === null) return null;
					if (r <= 1) {
						window.clearInterval(id);
						setState('running');
						return null;
					}
					return r - 1;
				});
			}, 1000);
			return () => window.clearInterval(id);
		}
	}, [state, focusSeconds, pomodoroMode]);

	// Pomodoro engine
	useEffect(() => {
		if (pomodoroMode === 'off' || pPhase === 'stopped') return;
		const id = window.setInterval(() => {
			setPRemaining((r) => {
				if (r <= 1) {
					// Switch phase
					if (pPhase === 'focus') {
						const breakMin = pomodoroMode === 'p25' ? 5 : 10;
						setPPhase('break');
						return breakMin * 60;
					} else {
						const focusMin = pomodoroMode === 'p25' ? 25 : 50;
						setPPhase('focus');
						return focusMin * 60;
					}
				}
				return r - 1;
			});
		}, 1000);
		return () => window.clearInterval(id);
	}, [pomodoroMode, pPhase]);

	const start = () => {
		setState('running');
		setFocusSeconds(0);
		lastMicroRef.current = 0;
		lastMoveRef.current = 0;
		snoozeUntilRef.current = null;
	};

	const pause = () => setState('paused');
	const resume = () => setState('running');
	const stop = () => {
		setState('stopped');
		setFocusSeconds(0);
		setMicrobreakRemaining(null);
		setMovementDue(false);
	};

	const movementDone = () => {
		lastMoveRef.current = focusSeconds;
		setMovementDue(false);
	};

	const movementSnooze = () => {
		snoozeUntilRef.current = focusSeconds + 10 * 60; // snooze 10 minutes
		setMovementDue(false);
	};

	function fmt(sec: number) {
		const m = Math.floor(sec / 60).toString().padStart(2, '0');
		const s = Math.floor(sec % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}

	// Pomodoro controls
	const startPomodoro = (mode: PomodoroMode) => {
		if (mode === 'off') return;
		setPomodoroMode(mode);
		setPPhase('focus');
		setPRemaining((mode === 'p25' ? 25 : 50) * 60);
		// Stop regular break timer to avoid overlap
		setState('stopped');
	};

	const pausePomodoro = () => setPPhase('stopped');
	const resumePomodoro = () => {
		if (pomodoroMode !== 'off' && pPhase === 'stopped') setPPhase('focus');
	};
	const stopPomodoro = () => {
		setPomodoroMode('off');
		setPPhase('stopped');
		setPRemaining(0);
	};

	return (
		<>
			<div style={{ position: 'fixed', left: 16, right: 16, bottom: 212, padding: 12, background: '#0b1220', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 53 }}>
				<span>
					<strong>Break timer</strong>: {state === 'microbreak' ? 'Microbreak' : state === 'running' ? 'Running' : state === 'paused' ? 'Paused' : 'Stopped'} • Focus {fmt(focusSeconds)}
					<span style={{ marginLeft: 8, color: '#93c5fd' }}>20-20-20 every 20m; movement every 60m</span>
				</span>
				<span style={{ display: 'flex', gap: 8 }}>
					{state === 'stopped' && <button onClick={start} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Start</button>}
					{state === 'running' && <button onClick={pause} style={{ padding: '6px 10px', background: '#f59e0b', color: '#1f2937', border: 0, borderRadius: 6, cursor: 'pointer' }}>Pause</button>}
					{state === 'paused' && <button onClick={resume} style={{ padding: '6px 10px', background: '#0ea5e9', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Resume</button>}
					{state !== 'stopped' && <button onClick={stop} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', border: 0, borderRadius: 6, cursor: 'pointer' }}>Stop</button>}
				</span>
			</div>

			{/* Pomodoro controls */}
			<div style={{ position: 'fixed', left: 16, right: 16, bottom: 160, padding: 12, background: '#0b1220', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 52 }}>
				<span>
					<strong>Pomodoro</strong>: {pomodoroMode === 'off' ? 'Off' : pomodoroMode === 'p25' ? '25/5' : '50/10'}
					{pomodoroMode !== 'off' && pPhase !== 'stopped' && (
						<span style={{ marginLeft: 8 }}>• {pPhase === 'focus' ? 'Focus' : 'Break'} {fmt(pRemaining)}</span>
					)}
				</span>
				<span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					{pomodoroMode === 'off' && (
						<>
							<button onClick={() => startPomodoro('p25')} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Start 25/5</button>
							<button onClick={() => startPomodoro('p50')} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Start 50/10</button>
						</>
					)}
					{pomodoroMode !== 'off' && pPhase !== 'stopped' && (
						<button onClick={pausePomodoro} style={{ padding: '6px 10px', background: '#f59e0b', color: '#1f2937', border: 0, borderRadius: 6, cursor: 'pointer' }}>Pause</button>
					)}
					{pomodoroMode !== 'off' && pPhase === 'stopped' && (
						<button onClick={resumePomodoro} style={{ padding: '6px 10px', background: '#0ea5e9', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Resume</button>
					)}
					{pomodoroMode !== 'off' && (
						<button onClick={stopPomodoro} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', border: 0, borderRadius: 6, cursor: 'pointer' }}>Stop</button>
					)}
				</span>
			</div>

			{state === 'microbreak' && (
				<div role="dialog" aria-label="Microbreak" style={{ position: 'fixed', left: 16, right: 16, bottom: 268, padding: 12, background: '#111827', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 56 }}>
					<span>Look 20 feet away for 20 seconds • {microbreakRemaining ?? 0}s</span>
				</div>
			)}

			{movementDue && (
				<div role="dialog" aria-label="Movement reminder" style={{ position: 'fixed', left: 16, right: 16, bottom: 320, padding: 12, background: '#1f2937', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 57 }}>
					<span>Time to move for 5–10 minutes</span>
					<span style={{ display: 'flex', gap: 8 }}>
						<button onClick={movementDone} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Done</button>
						<button onClick={movementSnooze} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', border: 0, borderRadius: 6, cursor: 'pointer' }}>Snooze 10m</button>
					</span>
				</div>
			)}
		</>
	);
}


