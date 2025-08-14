import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home has no serious a11y violations (including color contrast)', async ({ page }) => {
	await page.goto('/');
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa'])
		.analyze();

	const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
	expect(serious).toEqual([]);
});


