import { expect, test, type Page } from '@playwright/test';

test.use({
	viewport: { width: 390, height: 844 },
	deviceScaleFactor: 3,
	isMobile: true,
	hasTouch: true
});

test.beforeEach(async ({ page }) => {
	// Each Playwright test already gets a fresh context. Clearing on the first
	// document load (sessionStorage survives reloads) also keeps tests that reuse
	// a context independent, without wiping the save mid-test.
	await page.addInitScript(() => {
		try {
			if (!sessionStorage.getItem('zoomtown.e2e.fresh')) {
				localStorage.clear();
				sessionStorage.setItem('zoomtown.e2e.fresh', '1');
			}
		} catch {
			// Storage unavailable: the fresh context is already isolated.
		}
	});
});

async function openGarage(page: Page): Promise<void> {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	await page.getByRole('button', { name: 'Profile 1' }).click();
	await expect(page.getByRole('button', { name: 'Sunny Town' })).toBeVisible();
}

async function startRace(page: Page, car = 'bear', track?: string): Promise<void> {
	await page.evaluate(
		({ car, track }) => {
			const zoom = (window as any).__zoomtown;
			if (track) zoom.start(car, track);
			else zoom.start(car);
			zoom.skipCountdown();
		},
		{ car, track }
	);
	await expect
		.poll(() => page.evaluate(() => (window as any).__zoomtown.state().phase))
		.toBe('racing');
}

async function debugState(page: Page): Promise<any> {
	return page.evaluate(() => (window as any).__zoomtown.state());
}

async function displayedSpeed(page: Page): Promise<number> {
	const label = await page.getByLabel(/Speed/).getAttribute('aria-label');
	const match = label?.match(/Speed (\d+) kilometres per hour/);
	return match ? Number(match[1]) : Number.NaN;
}

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

test('track picker selects Dino Valley and remembers it per profile', async ({ page }) => {
	await openGarage(page);

	const circuits = ['Sunny Town', 'Park Loop', 'Harbor Dash', 'Dino Valley', 'Candy Hills'];
	for (const name of circuits) {
		await expect(page.getByRole('button', { name })).toBeVisible();
	}

	const dinoValley = page.getByRole('button', { name: 'Dino Valley' });
	const sunnyTown = page.getByRole('button', { name: 'Sunny Town' });

	// A fresh profile starts on the default circuit.
	await expect(sunnyTown).toHaveAttribute('aria-pressed', 'true');
	await expect(dinoValley).toHaveAttribute('aria-pressed', 'false');

	await dinoValley.click();
	await expect(dinoValley).toHaveAttribute('aria-pressed', 'true');
	await expect(sunnyTown).toHaveAttribute('aria-pressed', 'false');

	// The hook's start() defaults to the profile's selectedTrack.
	await startRace(page);
	expect((await debugState(page)).track).toBe('dino-valley');

	await page.reload();
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	await page.getByRole('button', { name: 'Profile 1' }).click();

	await expect(page.getByRole('button', { name: 'Dino Valley' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.getByRole('button', { name: 'Sunny Town' })).toHaveAttribute(
		'aria-pressed',
		'false'
	);

	const save = await page.evaluate(() => (window as any).__zoomtown.save());
	expect(save.profiles[0].selectedTrack).toBe('dino-valley');
});

test('speedometer shows live speed and is covered by the results screen', async ({ page }) => {
	await openGarage(page);
	await startRace(page, 'bear', 'park-loop');

	const speedo = page.getByLabel(/Speed/);
	await expect(speedo).toBeVisible();
	await expect(speedo).toHaveAttribute('aria-label', /^Speed \d+ kilometres per hour$/);

	const initialSpeed = await displayedSpeed(page);
	await expect
		.poll(() => displayedSpeed(page), { timeout: 6000, intervals: [100] })
		.toBeGreaterThan(0);
	await expect
		.poll(() => displayedSpeed(page), { timeout: 6000, intervals: [100] })
		.not.toBe(initialSpeed);

	// Cross-check that the rendered digits track the game state.
	await expect
		.poll(async () => (await debugState(page)).speed, { timeout: 6000, intervals: [100] })
		.toBeGreaterThan(0);

	await page.evaluate(() => {
		(window as any).__zoomtown.collectAll();
		(window as any).__zoomtown.finish(3);
	});
	await expect(page.getByLabel('Race again')).toBeVisible();
	await expect(page.getByLabel('3 of 3 stars')).toBeVisible();

	// Verified behaviour: the HUD (and speedometer) stays mounted behind the
	// results overlay. The speed drops to zero and the overlay wins hit testing.
	await expect
		.poll(() => displayedSpeed(page), { timeout: 3000, intervals: [100] })
		.toBe(0);

	const coveredByResults = await page.evaluate(() => {
		const speedoElement = document.querySelector('[aria-label^="Speed"]');
		if (!speedoElement) return false;
		const rect = speedoElement.getBoundingClientRect();
		const topmost = document.elementFromPoint(
			rect.left + rect.width / 2,
			rect.top + rect.height / 2
		);
		return topmost !== null && !speedoElement.contains(topmost);
	});
	expect(coveredByResults).toBe(true);
});

test('auto-steer badge appears after sustained rail contact and clears after release', async ({
	page
}) => {
	await openGarage(page);
	await startRace(page, 'bear', 'park-loop');

	const autoBadge = page.getByLabel('Auto steering');
	await expect(autoBadge).toBeHidden();
	expect((await debugState(page)).autoSteer).toBe(false);

	// Hold full right until the car sits against the rail long enough to earn
	// the assist; poll instead of guessing a fixed sleep.
	await page.evaluate(() => (window as any).__zoomtown.steer(1));
	await expect
		.poll(async () => (await debugState(page)).wallContactTime, {
			timeout: 10_000,
			intervals: [100]
		})
		.toBeGreaterThan(0);
	await expect
		.poll(async () => (await debugState(page)).autoSteer, {
			timeout: 15_000,
			intervals: [100]
		})
		.toBe(true);
	await expect(autoBadge).toBeVisible();

	await page.evaluate(() => (window as any).__zoomtown.steer(0));
	await expect
		.poll(async () => (await debugState(page)).autoSteer, {
			timeout: 8000,
			intervals: [100]
		})
		.toBe(false);
	await expect(autoBadge).toBeHidden();
});
