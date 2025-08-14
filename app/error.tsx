"use client";

import { useEffect } from 'react';
import { trackError } from '../lib/analytics';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	useEffect(() => {
		trackError(error.message, error.stack);
	}, [error]);

	return (
		<main>
			<h2>Something went wrong</h2>
			<p style={{ color: 'var(--muted)' }}>An unexpected error occurred. You can try again.</p>
			<button onClick={() => reset()} style={{ padding: '8px 12px', borderRadius: 8, border: 0, background: 'var(--accent)', color: 'var(--accent-contrast)', cursor: 'pointer' }}>Try again</button>
		</main>
	);
}


