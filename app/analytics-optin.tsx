"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isTelemetryEnabled, setTelemetryEnabled } from '../lib/analytics';

type AnalyticsContextValue = {
	enabled: boolean;
	setEnabled: (enabled: boolean) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function useAnalytics() {
	const ctx = useContext(AnalyticsContext);
	if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
	return ctx;
}

function loadInitial(): boolean | null {
	if (typeof window === 'undefined') return false;
	const raw = window.localStorage.getItem('telemetryEnabled');
	if (raw === 'true') return true;
	if (raw === 'false') return false;
	return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
	const [pref, setPref] = useState<boolean | null>(loadInitial());

	useEffect(() => {
		// hydrate module flag from stored pref
		const enabled = pref === true;
		setTelemetryEnabled(enabled);
	}, [pref]);

	useEffect(() => {
		if (pref === null) return;
		window.localStorage.setItem('telemetryEnabled', String(pref));
	}, [pref]);

	const value = useMemo<AnalyticsContextValue>(
		() => ({ enabled: pref === true, setEnabled: (e) => setPref(e) }),
		[pref]
	);

	return (
		<AnalyticsContext.Provider value={value}>
			{children}
			{pref === null && (
				<div style={{ position: 'fixed', left: 16, right: 16, bottom: 84, padding: 12, background: '#1f2937', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 55 }} role="dialog" aria-label="Telemetry opt-in">
					<span>Help improve Planner by sending minimal anonymous usage data?</span>
					<span style={{ display: 'flex', gap: 8 }}>
						<button onClick={() => setPref(true)} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Allow</button>
						<button onClick={() => setPref(false)} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', border: 0, borderRadius: 6, cursor: 'pointer' }}>No thanks</button>
					</span>
				</div>
			)}
		</AnalyticsContext.Provider>
	);
}


