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
let enMessages: Record<string, string> = {};
let esMessages: Record<string, string> = {};

async function loadEnMessages(): Promise<Record<string, string>> {
	try {
		const res = await fetch('/locales/en.json', { cache: 'no-store' });
		if (!res.ok) return {};
		return (await res.json()) as Record<string, string>;
	} catch {
		return {};
	}
}

async function loadEsMessages(): Promise<Record<string, string>> {
	try {
		const res = await fetch('/locales/es.json', { cache: 'no-store' });
		if (!res.ok) return {};
		return (await res.json()) as Record<string, string>;
	} catch {
		return {};
	}
}

function format(template: string, vars?: Vars): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (_m, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
	const [locale, setLocale] = useState<string>(() => {
		if (typeof window === 'undefined') return 'en';
		return window.localStorage.getItem('locale') || 'en';
	});
	const [, setLoaded] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		window.localStorage.setItem('locale', locale);
	}, [locale]);

	useEffect(() => {
		(async () => {
			if (locale === 'en') {
				enMessages = await loadEnMessages();
				setLoaded((v) => !v);
			} else if (locale === 'es') {
				esMessages = await loadEsMessages();
				setLoaded((v) => !v);
			}
		})();
	}, [locale]);

	const t = useCallback((key: string, vars?: Vars) => {
		// Only 'en' for now; scaffold for future locales
		const dict = locale === 'en' ? enMessages : locale === 'es' ? esMessages : enMessages;
		const message = dict[key] || key;
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


