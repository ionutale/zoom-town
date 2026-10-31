import { expect, test } from '@playwright/test';

test.use({
	viewport: { width: 390, height: 844 },
	deviceScaleFactor: 3,
	isMobile: true,
	hasTouch: true
});

test('portrait race, three stars, unlock and persistence', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	expect(await page.evaluate(() => (window as any).__zoomtown.screen())).toBe('profiles');
	await page.getByRole('button', { name: 'Profile 1' }).click();
	await expect(page.getByRole('button', { name: 'Park Loop' })).toBeVisible();

	await page.evaluate(() => {
		(window as any).__zoomtown.start('bear', 'park-loop');
		(window as any).__zoomtown.skipCountdown();
	});
	await page.waitForTimeout(800);
	const state = await page.evaluate(() => (window as any).__zoomtown.state());
	expect(state.phase).toBe('racing');
	expect(state.audioReady).toBe(true);
	expect(state.rivalCount).toBe(3);
	expect(state.track).toBe('park-loop');
	await expect(page.getByLabel(/Speed/)).toBeVisible();

	await page.evaluate(() => (window as any).__zoomtown.steer(1));
	await page.waitForTimeout(600);
	const steered = await page.evaluate(() => (window as any).__zoomtown.state());
	expect(steered.lateral).toBeGreaterThan(0.05);
	await page.evaluate(() => (window as any).__zoomtown.steer(0));

	await page.evaluate(() => {
		(window as any).__zoomtown.collectAll();
		(window as any).__zoomtown.finish(3);
	});

	await expect(page.getByLabel('3 of 3 stars')).toBeVisible();
	await expect(page.getByLabel('Race again')).toBeVisible();

	const save = await page.evaluate(() => (window as any).__zoomtown.save());
	expect(save.profiles[0].bestStars).toBe(3);
	expect(save.profiles[0].unlocked).toEqual(['bear', 'bunny', 'fox', 'cat']);

	await page.reload();
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	const persisted = await page.evaluate(() => (window as any).__zoomtown.save());
	expect(persisted.profiles[0].bestStars).toBe(3);

	await page.setViewportSize({ width: 844, height: 390 });
	await expect(page.getByText('Mettimi in verticale')).toBeVisible();
});

test.describe('iOS installation', () => {
	test.use({
		userAgent:
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true
	});

	test('shows Safari Add to Home Screen steps', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();

		await expect(page.getByText('Installa Zoom Town')).toBeVisible();
		await page.getByText('Installa Zoom Town').click();

		await expect(page.getByRole('heading', { name: 'Installa Zoom Town' })).toBeVisible();
		await expect(page.getByText('Tocca il pulsante Condividi.')).toBeVisible();
		await expect(page.getByText('Scegli Aggiungi alla schermata Home.')).toBeVisible();
		await expect(page.getByText('Tocca Aggiungi. Fatto!')).toBeVisible();

		await page.getByRole('button', { name: 'Non mostrare più' }).click();
		await expect(page.getByText('Installa Zoom Town')).toBeHidden();

		await page.getByRole('button', { name: 'Settings' }).click();
		await expect(page.getByText('Installa app')).toBeVisible();
		await page.getByText('Installa app').click();
		await expect(page.getByRole('heading', { name: 'Installa Zoom Town' })).toBeVisible();
		await page.getByRole('button', { name: 'Ho capito' }).click();
	});
});
