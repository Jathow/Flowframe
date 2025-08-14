import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
const PwaUi = dynamic(() => import('./pwa-ui').then((m) => m.PwaUi), { ssr: false });
const ThemeToolbar = dynamic(() => import('./theme-toggle').then((m) => m.ThemeToolbar), {
	ssr: false,
});
import './globals.css';
import { AnalyticsProvider } from './analytics-optin';
const AnalyticsRouter = dynamic(() => import('./analytics-router').then((m) => m.AnalyticsRouter), {
	ssr: false,
});
const InitState = dynamic(() => import('./init-state').then((m) => m.InitState), { ssr: false });
const PushOptIn = dynamic(() => import('./push-optin').then((m) => m.PushOptIn), { ssr: false });
const BreakTimer = dynamic(() => import('./break-timer').then((m) => m.BreakTimer), { ssr: false });
import { I18nProvider } from './i18n';

export const metadata: Metadata = {
	title: 'Planner',
	description: 'Day-to-Day Optimization Planner',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<link rel="manifest" href="/manifest.webmanifest" />
				<meta name="theme-color" content="#0b0b0b" />
				<link rel="icon" href="/icon.svg" />
			</head>
			<body>
				<a href="#main" className="skip-link">
					Skip to main content
				</a>
				<AnalyticsProvider>
					<I18nProvider>
						<PwaUi />
						<PushOptIn />
						<BreakTimer />
						<ThemeToolbar />
						<AnalyticsRouter />
						<InitState />
						<main id="main" role="main">
							{children}
						</main>
					</I18nProvider>
				</AnalyticsProvider>
			</body>
		</html>
	);
}
