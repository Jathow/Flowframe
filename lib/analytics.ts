let telemetryEnabled = false;

export function setTelemetryEnabled(enabled: boolean) {
	telemetryEnabled = enabled;
}

export function isTelemetryEnabled() {
	return telemetryEnabled;
}

type EventPayload = Record<string, unknown> | undefined;

export function trackEvent(eventName: string, payload?: EventPayload) {
	if (!telemetryEnabled || typeof window === 'undefined') return;
	// Minimal, privacy-friendly stub: log locally for now
	// Replace with navigator.sendBeacon to your endpoint when backend exists.
	// eslint-disable-next-line no-console
	console.debug('[telemetry]', eventName, payload ?? {});
}

export function trackPageView(pathname: string) {
	trackEvent('page_view', { pathname, ts: Date.now() });
}

export function trackError(message: string, stack?: string) {
	trackEvent('error', { message, stack, ts: Date.now() });
}


