"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Primitive = string | number;
type Vars = Record<string, Primitive> | undefined;

type I18nContextValue = {
	locale: string;
	t: (key: string, vars?: Vars) => string;
	setLocale: (locale: string) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

// Base English messages (scaffold). Keys are dot-notation strings.
const enMessages: Record<string, string> = {
	'home.title': 'Day-to-Day Optimization Planner',
	'home.init': 'Initialized Next.js (TypeScript) app.',
	'nav.onboarding.hard': 'Start onboarding: Hard constraints',
	'nav.onboarding.lifestyle': 'Next: Lifestyle & capacity',
	'nav.onboarding.areas': 'Next: Area importance',
	'nav.onboarding.wellbeing': 'Next: Well-being targets',
	'nav.onboarding.integrations': 'Onboarding: Integrations (ICS/CSV)',
	'nav.plan': 'Open Plan view (drag & drop)'
};

function format(template: string, vars?: Vars): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (_m, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocale] = useState<string>(() => {
		if (typeof window === 'undefined') return 'en';
		return window.localStorage.getItem('locale') || 'en';
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem('locale', locale);
	}, [locale]);

	const t = useCallback((key: string, vars?: Vars) => {
		// Only 'en' for now; scaffold for future locales
		const message = enMessages[key] || key;
		return format(message, vars);
	}, [locale]);

	const value = useMemo<I18nContextValue>(() => ({ locale, t, setLocale }), [locale, t]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error('useI18n must be used within I18nProvider');
	return ctx;
}


