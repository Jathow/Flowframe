"use client";

import { useEffect, useState } from 'react';
import { useI18n } from './i18n';

function getTheme(): 'dark' | 'light' {
	if (typeof window === 'undefined') return 'dark';
	const stored = window.localStorage.getItem('theme');
	if (stored === 'dark' || stored === 'light') return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToolbar() {
    const { locale, setLocale } = useI18n();
	const [theme, setTheme] = useState<'dark' | 'light'>(getTheme());
	const [contrast, setContrast] = useState<'normal' | 'high'>(() => (typeof window === 'undefined' ? 'normal' : (window.localStorage.getItem('contrast') as 'normal' | 'high') || 'normal'));
	const [motion, setMotion] = useState<'normal' | 'reduce'>(() => (typeof window === 'undefined' ? 'normal' : (window.localStorage.getItem('motion') as 'normal' | 'reduce') || 'normal'));

	useEffect(() => {
		const html = document.documentElement;
		html.setAttribute('data-theme', theme);
		window.localStorage.setItem('theme', theme);
	}, [theme]);

	useEffect(() => {
		const html = document.documentElement;
		if (contrast === 'high') html.setAttribute('data-contrast', 'high');
		else html.removeAttribute('data-contrast');
		window.localStorage.setItem('contrast', contrast);
	}, [contrast]);

	useEffect(() => {
		const html = document.documentElement;
		if (motion === 'reduce') html.setAttribute('data-motion', 'reduce');
		else html.removeAttribute('data-motion');
		window.localStorage.setItem('motion', motion);
	}, [motion]);

	return (
		<div className="toolbar" role="toolbar" aria-label="Theme and accessibility controls">
			<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-pressed={theme === 'light'} aria-label="Toggle light theme">
				{theme === 'dark' ? 'Light' : 'Dark'}
			</button>
			<button onClick={() => setContrast(contrast === 'normal' ? 'high' : 'normal')} aria-pressed={contrast === 'high'} aria-label="Toggle high contrast">
				Contrast
			</button>
			<button onClick={() => setMotion(motion === 'normal' ? 'reduce' : 'normal')} aria-pressed={motion === 'reduce'} aria-label="Toggle reduced motion">
				Motion
			</button>
            <select value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language">
                <option value="en">EN</option>
                <option value="es">ES</option>
            </select>
		</div>
	);
}


