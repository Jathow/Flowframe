export default function HomePage() {
	return (
		<main>
			<h1>Day-to-Day Optimization Planner</h1>
			<p>Initialized Next.js (TypeScript) app.</p>
			<p>
				<a href="/onboarding/hard-constraints" style={{ color: 'var(--accent)' }}>Start onboarding: Hard constraints</a>
			</p>
			<p>
				<a href="/onboarding/lifestyle" style={{ color: 'var(--accent)' }}>Next: Lifestyle & capacity</a>
			</p>
			<p>
				<a href="/onboarding/areas" style={{ color: 'var(--accent)' }}>Next: Area importance</a>
			</p>
			<p>
				<a href="/onboarding/wellbeing" style={{ color: 'var(--accent)' }}>Next: Well-being targets</a>
			</p>
			<p>
				<a href="/plan" style={{ color: 'var(--accent)' }}>Open Plan view (drag & drop)</a>
			</p>
			<p>
				<a href="/onboarding/integrations" style={{ color: 'var(--accent)' }}>Onboarding: Integrations (ICS/CSV)</a>
			</p>
		</main>
	);
}


