"use client";

import { useEffect, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaUi() {
	const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
	const [showInstall, setShowInstall] = useState(false);
	const [updateReady, setUpdateReady] = useState<(() => void) | null>(null);

	useEffect(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			deferredPromptRef.current = e as BeforeInstallPromptEvent;
			setShowInstall(true);
		};
		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	}, []);

	useEffect(() => {
		if (!('serviceWorker' in navigator)) return;
		navigator.serviceWorker.ready.then((registration) => {
			registration.addEventListener('updatefound', () => {
				const installing = registration.installing;
				if (!installing) return;
				installing.addEventListener('statechange', () => {
					if (installing.state === 'installed' && navigator.serviceWorker.controller) {
						const reload = () => {
							registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
							navigator.serviceWorker.addEventListener('controllerchange', () => {
								window.location.reload();
							});
						};
						setUpdateReady(() => reload);
					}
				});
			});
		});
	}, []);

	const onInstallClick = async () => {
		const evt = deferredPromptRef.current;
		if (!evt) return setShowInstall(false);
		await evt.prompt();
		await evt.userChoice;
		deferredPromptRef.current = null;
		setShowInstall(false);
	};

	return (
		<>
			{showInstall && (
				<div style={{ position: 'fixed', left: 16, right: 16, bottom: 16, padding: 12, background: '#1f2937', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
					<span>Install Planner?</span>
					<span style={{ display: 'flex', gap: 8 }}>
						<button onClick={onInstallClick} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Install</button>
						<button onClick={() => setShowInstall(false)} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', border: 0, borderRadius: 6, cursor: 'pointer' }}>Dismiss</button>
					</span>
				</div>
			)}
			{updateReady && (
				<div style={{ position: 'fixed', left: 16, right: 16, bottom: 16, padding: 12, background: '#0ea5e9', color: '#06211a', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 51 }}>
					<span>Update available. Refresh?</span>
					<span style={{ display: 'flex', gap: 8 }}>
						<button onClick={() => updateReady()} style={{ padding: '6px 10px', background: '#022c22', color: '#a7f3d0', border: 0, borderRadius: 6, cursor: 'pointer' }}>Refresh</button>
						<button onClick={() => setUpdateReady(null)} style={{ padding: '6px 10px', background: '#0369a1', color: '#e0f2fe', border: 0, borderRadius: 6, cursor: 'pointer' }}>Later</button>
					</span>
				</div>
			)}
		</>
	);
}


