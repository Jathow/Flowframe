import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const withPWANext = withPWA({
	dest: 'public',
	register: true,
	skipWaiting: true,
});

const securityHeaders = (): { key: string; value: string }[] => {
	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data:",
		"font-src 'self' data:",
		"connect-src 'self' https://api.todoist.com",
		"frame-ancestors 'none'",
	].join('; ');
	return [
		{ key: 'Content-Security-Policy', value: csp },
		{ key: 'Referrer-Policy', value: 'no-referrer' },
		{ key: 'X-Content-Type-Options', value: 'nosniff' },
		{ key: 'X-Frame-Options', value: 'DENY' },
		{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
	];
};

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/:path*',
				headers: securityHeaders(),
			},
		];
	},
};

export default withPWANext(nextConfig);
