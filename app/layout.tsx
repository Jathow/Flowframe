import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PwaUi } from './pwa-ui';
import { ThemeToolbar } from './theme-toggle';
import './globals.css';
import { AnalyticsProvider } from './analytics-optin';
import { AnalyticsRouter } from './analytics-router';
import { InitState } from './init-state';
import { PushOptIn } from './push-optin';

export const metadata: Metadata = {
	title: 'Planner',
	description: 'Day-to-Day Optimization Planner'
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
				<AnalyticsProvider>
					<PwaUi />
					<PushOptIn />
					<ThemeToolbar />
					<AnalyticsRouter />
					<InitState />
					{children}
				</AnalyticsProvider>
			</body>
		</html>
	);
}


