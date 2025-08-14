import { test, expect } from '@playwright/test';

test('home page shows title', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /Day-to-Day Optimization Planner/i })).toBeVisible();
});


