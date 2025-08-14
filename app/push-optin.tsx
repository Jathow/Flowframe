"use client";

import { useEffect, useMemo, useState } from 'react';

function getVapidKey(): Uint8Array | null {
	const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	if (!key) return null;
	try {
		const padding = '='.repeat((4 - (key.length % 4)) % 4);
		const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/');
		const raw = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
		const output = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
		return output;
	} catch {
		return null;
	}
}

export function PushOptIn() {
	const [supported, setSupported] = useState(false);
	const [permission, setPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
	const [subscribed, setSubscribed] = useState<boolean | null>(null);
	const [busy, setBusy] = useState(false);
	const vapid = useMemo(() => getVapidKey(), []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const ok = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
		setSupported(ok);
		if (!ok) return;
		navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((sub) => setSubscribed(!!sub)).catch(() => setSubscribed(false));
	}, []);

	const requestPermission = async () => {
		if (!supported) return;
		setBusy(true);
		try {
			const result = await Notification.requestPermission();
			setPermission(result);
			if (result !== 'granted') {
				setBusy(false);
				return;
			}
			if (!vapid) {
				setBusy(false);
				return; // permission granted, but no VAPID configured — capability only
			}
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapid });
			setSubscribed(!!sub);
		} catch {
			// ignore
		} finally {
			setBusy(false);
		}
	};

	const unsubscribe = async () => {
		if (!supported) return;
		setBusy(true);
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) await sub.unsubscribe();
			setSubscribed(false);
		} catch {
			// ignore
		} finally {
			setBusy(false);
		}
	};

	if (!supported) return null;

	return (
		<div style={{ position: 'fixed', left: 16, right: 16, bottom: 148, padding: 12, background: '#111827', color: '#e5e7eb', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', zIndex: 54 }}>
			<span>
				<strong>Notifications</strong>: {permission === 'granted' ? 'Permission granted' : permission === 'denied' ? 'Blocked' : 'Not enabled'}
				{permission === 'granted' && (vapid ? (subscribed ? ' • Subscribed' : ' • Not subscribed') : ' • Server not configured')}
			</span>
			<span style={{ display: 'flex', gap: 8 }}>
				{permission !== 'granted' && (
					<button onClick={requestPermission} disabled={busy} style={{ padding: '6px 10px', background: '#10b981', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Enable</button>
				)}
				{permission === 'granted' && vapid && !subscribed && (
					<button onClick={requestPermission} disabled={busy} style={{ padding: '6px 10px', background: '#0ea5e9', color: '#06211a', border: 0, borderRadius: 6, cursor: 'pointer' }}>Subscribe</button>
				)}
				{permission === 'granted' && subscribed && (
					<button onClick={unsubscribe} disabled={busy} style={{ padding: '6px 10px', background: '#374151', color: '#e5e7eb', border: 0, borderRadius: 6, cursor: 'pointer' }}>Unsubscribe</button>
				)}
			</span>
		</div>
	);
}


