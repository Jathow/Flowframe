"use client";

import React from 'react';

export function SkeletonLine({ width = '100%', height = 12, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
	return (
		<div
			style={{
				width,
				height,
				borderRadius: radius,
				background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)',
				backgroundSize: '200% 100%',
				animation: 'skeleton-shimmer 1.2s ease-in-out infinite'
			}}
		/>
	);
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
	return (
		<div style={{ display: 'grid', gap: 8 }}>
			{Array.from({ length: lines }).map((_, i) => (
				<SkeletonLine key={i} width={i === lines - 1 ? '60%' : '100%'} />
			))}
		</div>
	);
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
	return (
		<div style={{
			padding: 16,
			border: '1px dashed rgba(255,255,255,0.12)',
			borderRadius: 8,
			textAlign: 'center',
			color: 'var(--muted)'
		}}>
			<strong style={{ display: 'block', marginBottom: 6 }}>{title}</strong>
			{description && <span>{description}</span>}
		</div>
	);
}

// Keyframes injected globally by consumers can use this name; fallback via inline styles above


