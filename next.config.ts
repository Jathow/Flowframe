import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const withPWANext = withPWA({
	dest: 'public',
	register: true,
	skipWaiting: true
});

const nextConfig: NextConfig = {};

export default withPWANext(nextConfig);


