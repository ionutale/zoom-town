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
	//
	// The language is pinned to English so the accessible names asserted below do
	// not depend on the product default (Italian).
	await page.addInitScript((pinned) => {
		try {
			const lang = pinned === 'it' ? 'it' : 'en';
			const fresh = !sessionStorage.getItem('zoomtown.e2e.fresh');
			if (fresh) {
				localStorage.clear();
				sessionStorage.setItem('zoomtown.e2e.fresh', '1');
			}
			const raw = localStorage.getItem('zoomtown.save.v1');
			const save = raw ? JSON.parse(raw) : null;
			// Pin the language on the first load only; later navigations keep
			// whatever the app itself saved, so language switching stays testable.
			const language = fresh ? lang : (save?.settings?.lang ?? lang);
			localStorage.setItem(
				'zoomtown.save.v1',
				JSON.stringify({
					version: 1,
					profiles: save?.profiles ?? [null, null, null],
					settings: {
						sound: save?.settings?.sound ?? true,
						lang: language,
						reducedMotion: save?.settings?.reducedMotion ?? false,
						advancedDriving: save?.settings?.advancedDriving ?? false,
						musicVolume: save?.settings?.musicVolume ?? 1,
						effectsVolume: save?.settings?.effectsVolume ?? 1
					}
				})
			);
		} catch {
			// Storage unavailable: the fresh context is already isolated.
		}
	}, 'en');
});

async function openGarage(page: Page): Promise<void> {
	await page.goto('/?debug=1');
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
	await page.goto('/?debug=1');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	expect(await page.evaluate(() => (window as any).__zoomtown.screen())).toBe('profiles');
	await page.getByRole('button', { name: 'Profile 1' }).click();
	await expect(page.getByRole('button', { name: 'Park Loop' })).toBeVisible();

	await page.evaluate(() => {
		(window as any).__zoomtown.start('bear', 'park-loop');
		(window as any).__zoomtown.skipCountdown();
	});
	await expect
		.poll(async () => (await debugState(page)).audioReady, { timeout: 8000, intervals: [100] })
		.toBe(true);
	const state = await debugState(page);
	expect(state.phase).toBe('racing');
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

	// The results dialog must stay operable even though the game behind it is
	// inert: it is rendered outside the inert world container.
	await page.getByRole('button', { name: 'Race again' }).click();
	await expect(page.getByRole('dialog', { name: 'Race results' })).toBeHidden();
	await expect.poll(async () => (await debugState(page)).phase).not.toBe('finished');

	const save = await page.evaluate(() => (window as any).__zoomtown.save());
	expect(save.profiles[0].bestStars).toBe(3);
	expect(save.profiles[0].unlocked).toEqual(['bear', 'bunny', 'fox', 'cat']);

	await page.reload();
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	const persisted = await page.evaluate(() => (window as any).__zoomtown.save());
	expect(persisted.profiles[0].bestStars).toBe(3);

	await page.setViewportSize({ width: 844, height: 390 });
	await expect(page.getByText('Turn me upright')).toBeVisible();
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
		await page.goto('/?debug=1');
		await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();

		await expect(page.getByText('Install Zoom Town')).toBeVisible();
		await page.getByText('Install Zoom Town').click();

		await expect(page.getByRole('dialog', { name: 'Install Zoom Town' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Install Zoom Town' })).toBeVisible();
		await expect(page.getByText('Tap the Share button.')).toBeVisible();
		await expect(page.getByText('Choose Add to Home Screen.')).toBeVisible();
		await expect(page.getByText('Tap Add. Done!')).toBeVisible();

		await page.getByRole('button', { name: "Don't show again" }).click();
		await expect(page.getByText('Install Zoom Town')).toBeHidden();

		await page.getByRole('button', { name: 'Settings' }).click();
		await expect(page.getByText('Install app')).toBeVisible();
		await page.getByText('Install app').click();
		await expect(page.getByRole('heading', { name: 'Install Zoom Town' })).toBeVisible();
		await page.getByRole('button', { name: 'Got it' }).click();
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

test('speedometer shows live speed and the results screen disables the HUD', async ({ page }) => {
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

	// The results screen is a modal dialog: the HUD behind it must be inert so
	// its buttons cannot be focused and its speed is not announced.
	await expect(page.getByRole('dialog', { name: 'Race results' })).toBeVisible();
	await expect(page.locator('.hud')).toHaveAttribute('inert', '');
	await expect(page.locator('.hud')).toHaveAttribute('aria-hidden', 'true');

	const focusStolen = await page.evaluate(() => {
		const steer = document.querySelector('.hud .steer') as HTMLElement | null;
		if (!steer) return false;
		steer.focus();
		return document.activeElement === steer;
	});
	expect(focusStolen).toBe(false);

	// Home is the other results action and must be tappable too.
	await page.getByRole('button', { name: 'Back to garage' }).click();
	await expect(page.getByRole('button', { name: 'Sunny Town' })).toBeVisible();
});

test('autopilot takes over after five idle seconds and clears on input', async ({ page }) => {
	await openGarage(page);
	await startRace(page, 'bear', 'park-loop');

	const autoBadge = page.getByLabel('Auto steering');
	await expect(autoBadge).toBeHidden();
	expect((await debugState(page)).autoSteer).toBe(false);

	// No steering input: the car drives itself after five quiet seconds.
	await expect
		.poll(async () => (await debugState(page)).idleTime, { timeout: 12_000, intervals: [200] })
		.toBeGreaterThan(5.2);
	await expect
		.poll(async () => (await debugState(page)).autoSteer, { timeout: 4000, intervals: [100] })
		.toBe(true);
	await expect(autoBadge).toBeVisible();

	// Steering hands control back immediately — no timeout involved.
	await page.evaluate(() => (window as any).__zoomtown.steer(1));
	await expect
		.poll(async () => (await debugState(page)).autoSteer, { timeout: 4000, intervals: [100] })
		.toBe(false);
	await expect(autoBadge).toBeHidden();
});

test.describe('advanced driving', () => {
	async function enableAdvanced(page: Page): Promise<void> {
		await page.goto('/?debug=1');
		await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
		await page.getByRole('button', { name: 'Settings' }).click();
		await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
		await page.getByRole('button', { name: 'Toggle advanced driving' }).click();
		await page.getByRole('button', { name: 'Close settings' }).click();
	}

	test('steers with one-finger drag and hides the arrow buttons', async ({ page }) => {
		await enableAdvanced(page);
		await page.getByRole('button', { name: 'Profile 1' }).click();
		await startRace(page, 'bear', 'park-loop');

		await expect(page.getByRole('button', { name: 'Steer left' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Steer right' })).toHaveCount(0);

		const surface = page.getByRole('slider', { name: 'Drag left or right to steer' });
		await expect(surface).toBeVisible();
		const box = await surface.boundingBox();
		if (!box) throw new Error('drag surface has no box');
		const y = box.y + box.height * 0.55;
		const x = box.x + box.width / 2;

		await page.mouse.move(x, y);
		await page.mouse.down();
		await page.mouse.move(x + 72, y, { steps: 6 });
		await expect
			.poll(async () => (await debugState(page)).steer, { timeout: 4000 })
			.toBeGreaterThan(0.5);

		await page.mouse.move(x - 72, y, { steps: 6 });
		await expect
			.poll(async () => (await debugState(page)).steer, { timeout: 4000 })
			.toBeLessThan(-0.5);

		await page.mouse.up();
		await expect.poll(async () => (await debugState(page)).steer, { timeout: 4000 }).toBe(0);
	});

	test('never engages autopilot, even when the child stops steering', async ({ page }) => {
		await enableAdvanced(page);
		await page.getByRole('button', { name: 'Profile 1' }).click();
		await startRace(page, 'bear', 'park-loop');

		// Long enough for the assisted autopilot to have taken over twice.
		await expect
			.poll(async () => (await debugState(page)).idleTime, { timeout: 12_000, intervals: [200] })
			.toBeGreaterThan(5.5);

		expect((await debugState(page)).autoSteer).toBe(false);
		await expect(page.getByLabel('Auto steering')).toHaveCount(0);
	});

	test('can still pause while the drag surface covers the screen', async ({ page }) => {
		await enableAdvanced(page);
		await page.getByRole('button', { name: 'Profile 1' }).click();
		await startRace(page, 'bear', 'park-loop');

		await expect(page.getByRole('slider', { name: 'Drag left or right to steer' })).toBeVisible();

		// Regression: the full-screen drag surface used to paint over the pause
		// button, so a child in Advanced driving could not pause at all.
		await page.getByRole('button', { name: 'Pause' }).click();
		await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
		await page.getByRole('button', { name: 'Resume' }).click();
		await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
	});
});

test('races three laps and does not end on balloons', async ({ page }) => {
	await openGarage(page);
	await startRace(page, 'bear', 'park-loop');

	await expect(page.getByLabel('Lap 1 of 3')).toBeVisible();

	// Collecting every balloon must not finish the race; only lap 3 does.
	await page.evaluate(() => (window as any).__zoomtown.collectAll());
	await expect.poll(async () => (await debugState(page)).phase, { timeout: 4000 }).toBe('racing');
	await expect(page.getByLabel('Lap 1 of 3')).toBeVisible();

	await page.evaluate(() => (window as any).__zoomtown.finish(3));
	await expect(page.getByLabel('3 of 3 stars')).toBeVisible();
});

test('boots offline from the precached build and shows a recovery card on failure', async ({
	page,
	context
}) => {
	await page.goto('/?debug=1');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();

	await expect
		.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 })
		.toBe(true);

	// Playwright's context.setOffline also disables service-worker handling, so
	// cut the network through CDP instead: this is real offline behaviour.
	const cdp = await context.newCDPSession(page);
	await cdp.send('Network.enable');
	await cdp.send('Network.emulateNetworkConditions', {
		offline: true,
		latency: 0,
		downloadThroughput: 0,
		uploadThroughput: 0
	});
	try {
		await page.reload();
		await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
		await page.getByRole('button', { name: 'Profile 1' }).click();
		await expect(page.getByRole('button', { name: 'Sunny Town' })).toBeVisible();
	} finally {
		await cdp.send('Network.emulateNetworkConditions', {
			offline: false,
			latency: 0,
			downloadThroughput: -1,
			uploadThroughput: -1
		});
	}

	// A stray rejection after a successful boot must not cover a working game.
	await page.evaluate(() => {
		const event = new Event('unhandledrejection');
		(event as unknown as { reason: unknown }).reason = new Error('e2e late failure');
		window.dispatchEvent(event);
	});
	await expect(page.getByText('Il gioco non si è avviato.')).toBeHidden();

	// A boot that never mounts must surface the recovery card instead of a black
	// screen. Removing the mounted tree reproduces that state.
	await page.evaluate(() => {
		document.querySelector('.stage')?.remove();
		const event = new Event('unhandledrejection');
		(event as unknown as { reason: unknown }).reason = new Error('e2e chunk failure');
		window.dispatchEvent(event);
	});
	await expect(page.getByText('Il gioco non si è avviato.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Ricarica' })).toBeVisible();
});

test('a broken stylesheet cannot fake a boot failure', async ({ page }) => {
	await openGarage(page);
	await page.evaluate(() => {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '/definitely-missing.css';
		document.head.appendChild(link);
	});
	// Give the failed request time to fire its error event.
	await page.waitForTimeout(400);
	await expect(page.getByText('Il gioco non si è avviato.')).toBeHidden();
	await expect(page.getByRole('button', { name: 'Sunny Town' })).toBeVisible();
});

test('pause screen is a dialog and disables the racing HUD', async ({ page }) => {
	await openGarage(page);
	await startRace(page, 'bear', 'park-loop');

	await page.getByRole('button', { name: 'Pause' }).click();
	await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
	await expect(page.locator('.hud')).toHaveAttribute('inert', '');

	// Escape closes the dialog (the modal action owns the key handler).
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
	await expect(page.locator('.hud')).not.toHaveAttribute('inert', '');

	await page.getByRole('button', { name: 'Pause' }).click();
	await page.getByRole('button', { name: 'Resume' }).click();
	await expect(page.locator('.hud')).not.toHaveAttribute('inert', '');
});

test('ships without the debug hook unless it is asked for', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	expect(await page.evaluate(() => (window as any).__zoomtown)).toBeUndefined();
});

test('drives with the keyboard on a desktop', async ({ page }) => {
	await openGarage(page);
	await startRace(page, 'bear', 'park-loop');
	// No button keeps focus after the debug start, so Space is the boost key.
	await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

	// Arrow keys steer while held, and releasing recentres.
	await page.keyboard.down('ArrowRight');
	await expect
		.poll(async () => (await debugState(page)).steer, { timeout: 3000 })
		.toBeGreaterThan(0.5);

	await page.keyboard.down('ArrowLeft');
	await expect.poll(async () => (await debugState(page)).steer, { timeout: 3000 }).toBe(0);

	await page.keyboard.up('ArrowLeft');
	await expect
		.poll(async () => (await debugState(page)).steer, { timeout: 3000 })
		.toBeGreaterThan(0.5);

	await page.keyboard.up('ArrowRight');
	await expect.poll(async () => (await debugState(page)).steer, { timeout: 3000 }).toBe(0);

	// A is the left alias, and it must not double-fire.
	await page.keyboard.down('a');
	await expect
		.poll(async () => (await debugState(page)).steer, { timeout: 3000 })
		.toBeLessThan(-0.5);
	await page.keyboard.up('a');

	// Space spends one boost charge.
	await page.evaluate(() => (window as any).__zoomtown.collectAll());
	expect((await debugState(page)).charges).toBe(3);
	await page.keyboard.press('Space');
	await expect.poll(async () => (await debugState(page)).charges, { timeout: 3000 }).toBe(2);

	// Escape pauses, P resumes.
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
	await page.keyboard.press('p');
	await expect(page.getByRole('dialog', { name: 'Paused' })).toBeHidden();
});

test('keeps separate music and effects level bars', async ({ page }) => {
	await page.goto('/?debug=1');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	await page.getByRole('button', { name: 'Settings' }).click();

	const music = page.getByRole('slider', { name: 'Music' });
	const effects = page.getByRole('slider', { name: 'Effects' });
	await expect(music).toHaveValue('100');
	await expect(effects).toHaveValue('100');

	await music.focus();
	await page.keyboard.press('Home');
	await expect
		.poll(
			async () =>
				(await page.evaluate(() => (window as any).__zoomtown.save())).settings.musicVolume,
			{
				timeout: 3000
			}
		)
		.toBe(0);

	// The bars are independent.
	await expect(effects).toHaveValue('100');
	expect(
		(await page.evaluate(() => (window as any).__zoomtown.save())).settings.effectsVolume
	).toBe(1);

	// The level survives a reload, and the dialog still closes on a short screen.
	await page.reload();
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();
	await page.getByRole('button', { name: 'Settings' }).click();
	await expect(page.getByRole('slider', { name: 'Music' })).toHaveValue('0');
	await page.getByRole('button', { name: 'Close settings' }).click();
});

test('follows the saved language in the document and in the labels', async ({ page }) => {
	await page.goto('/?debug=1');
	await expect(page.getByRole('heading', { name: /ZOOM/i })).toBeVisible();

	expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');

	await page.getByRole('button', { name: 'Settings' }).click();
	await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
	await page.getByRole('button', { name: 'IT', exact: true }).click();

	expect(await page.evaluate(() => document.documentElement.lang)).toBe('it');
	await page.getByRole('button', { name: 'Chiudi impostazioni' }).click();
	await expect(page.getByRole('button', { name: 'Profilo 1' })).toBeVisible();

	await page.reload();
	await expect(page.getByRole('button', { name: 'Profilo 1' })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.lang)).toBe('it');
});
