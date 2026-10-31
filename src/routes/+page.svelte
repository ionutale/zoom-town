<script lang="ts">
	import { onMount } from 'svelte';
	import { AVATARS, CAR_BY_ID, type CarId } from '#lib/game/cars';
	import { LAPS, TOTAL_BALLOONS } from '#lib/game/rules';
	import { DEFAULT_TRACK_ID, TRACK_DEFS, type TrackId } from '#lib/game/track';
	import { ZoomTownGame, type HudState, type RaceResult } from '#lib/game/game';
	import {
		createProfile,
		defaultSave,
		loadSave,
		recordResult,
		resetProfile,
		storeSave,
		type SaveData
	} from '#lib/save';
	import Garage from '#lib/components/Garage.svelte';
	import Hud from '#lib/components/Hud.svelte';
	import InstallBanner from '#lib/components/InstallBanner.svelte';
	import InstallSheet from '#lib/components/InstallSheet.svelte';
	import PauseMenu from '#lib/components/PauseMenu.svelte';
	import ProfilePicker from '#lib/components/ProfilePicker.svelte';
	import Results from '#lib/components/Results.svelte';
	import RotateOverlay from '#lib/components/RotateOverlay.svelte';
	import SettingsSheet from '#lib/components/SettingsSheet.svelte';
	import Tutorial from '#lib/components/Tutorial.svelte';
	import { isIosDevice, isIosSafari, isStandalone } from '#lib/pwa';

	type Screen = 'profiles' | 'garage' | 'race';
	type TutorialMode = 'first' | 'replay' | null;

	let canvas: HTMLCanvasElement;
	let game: ZoomTownGame | null = null;
	let save = $state<SaveData>(defaultSave());
	let screen = $state<Screen>('profiles');
	let slot = $state<number | null>(null);
	let hud = $state<HudState>(blankHud());
	let result = $state<RaceResult | null>(null);
	let newCarId = $state<CarId | null>(null);
	let trophy = $state(false);
	let paused = $state(false);
	let settingsOpen = $state(false);
	let tutorialOpen = $state(false);
	let tutorialMode = $state<TutorialMode>(null);
	let rotate = $state(false);
	let rotateSpoke = false;
	let iosDevice = $state(false);
	let iosSafari = $state(true);
	let installed = $state(false);
	let installDismissed = $state(false);
	let installOpen = $state(false);
	let wakeLock: { release: () => Promise<void> } | null = null;

	let showInstallBanner = $derived(
		iosDevice && !installed && !installDismissed && screen === 'profiles' && !installOpen
	);

	const tutorialVoiceKeys = ['tutorial_steer', 'tutorial_boost', 'tutorial_balloons'] as const;

	let profile = $derived(slot !== null ? save.profiles[slot] : null);
	let selectedCar = $derived(profile?.selectedCar ?? 'bear');
	let selectedTrack = $derived(profile?.selectedTrack ?? DEFAULT_TRACK_ID);
	let newCarSpec = $derived(newCarId ? CAR_BY_ID[newCarId] : null);

	function blankHud(carId: CarId = 'bear'): HudState {
		return {
			phase: 'attract',
			lap: 1,
			laps: LAPS,
			balloons: 0,
			totalBalloons: TOTAL_BALLOONS,
			charges: 0,
			maxCharges: 3,
			boostTime: 0,
			speedKmh: 0,
			countdown: 0,
			playerProgress: 0,
			rivalProgress: [0, 0, 0],
			autoSteer: false,
			carId,
			carColor: CAR_BY_ID[carId].color
		};
	}

	onMount(() => {
		if (import.meta.env.PROD && 'serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js').catch(() => {});
		}
		save = loadSave();
		iosDevice = isIosDevice();
		iosSafari = isIosSafari();
		installed = isStandalone();
		try {
			installDismissed = localStorage.getItem('zoomtown.installDismissed') === '1';
		} catch {
			installDismissed = false;
		}
		document.documentElement.classList.toggle('reduced-motion', save.settings.reducedMotion);
		const existingProfile = save.profiles.find((p) => p !== null);
		const initialCar = existingProfile?.selectedCar ?? 'bear';
		const initialTrack = existingProfile?.selectedTrack ?? DEFAULT_TRACK_ID;
		game = new ZoomTownGame({
			canvas,
			carId: initialCar,
			advancedDriving: save.settings.advancedDriving,
			sound: save.settings.sound,
			reducedMotion: save.settings.reducedMotion,
			lang: save.settings.lang,
			trackId: initialTrack,
			onHud: (state) => (hud = state),
			onFinish: handleFinish,
			onPickup: () => navigator.vibrate?.(8),
			onBump: () => navigator.vibrate?.(16)
		});
		game.attract(initialCar, initialTrack);

		const rotateQuery = window.matchMedia('(orientation: landscape) and (pointer: coarse)');
		const updateRotate = () => {
			rotate = rotateQuery.matches;
			if (rotate && screen === 'race' && !paused && !result) pauseGame();
		};
		updateRotate();
		rotateQuery.addEventListener('change', updateRotate);

		const onVisibility = () => {
			if (document.visibilityState === 'hidden' && screen === 'race' && !paused && !result) {
				pauseGame();
			}
		};
		document.addEventListener('visibilitychange', onVisibility);

		const debug = {
			state: () => game?.debugState(),
			collectAll: () => game?.debugCollectAll(),
			finish: (stars = 3) => game?.debugFinish(stars),
			steer: (value: number) => game?.setSteer(value),
			boost: () => game?.requestBoost(),
			skipCountdown: () => game?.debugSkipCountdown(),
			start: (car: CarId = 'bear', track: TrackId = selectedTrack) => {
				if (slot === null) selectProfile(0);
				screen = 'race';
				result = null;
				paused = false;
				tutorialOpen = false;
				game?.startRace(car, track);
			},
			save: () => save,
			screen: () => screen
		};
		(window as unknown as Record<string, unknown>).__zoomtown = debug;

		return () => {
			rotateQuery.removeEventListener('change', updateRotate);
			document.removeEventListener('visibilitychange', onVisibility);
			void releaseWakeLock();
			game?.dispose();
			game = null;
			delete (window as unknown as Record<string, unknown>).__zoomtown;
		};
	});

	function selectProfile(index: number) {
		let next = save.profiles[index];
		if (!next) {
			next = createProfile(index, AVATARS[index].id);
			const profiles = [...save.profiles];
			profiles[index] = next;
			save = { ...save, profiles };
		}
		slot = index;
		storeSave(save);
		screen = 'garage';
		game?.unlockAudio();
		game?.playSfx('click');
		game?.attract(next.selectedCar, next.selectedTrack);
	}

	function pickCar(id: CarId) {
		if (slot === null || !profile || !profile.unlocked.includes(id)) return;
		const updated = { ...profile, selectedCar: id };
		const profiles = [...save.profiles];
		profiles[slot] = updated;
		save = { ...save, profiles };
		storeSave(save);
		game?.playSfx('click');
		game?.attract(id, selectedTrack);
	}

	function pickTrack(id: TrackId) {
		if (slot === null || !profile) return;
		const updated = { ...profile, selectedTrack: id };
		const profiles = [...save.profiles];
		profiles[slot] = updated;
		save = { ...save, profiles };
		storeSave(save);
		game?.playSfx('click');
		game?.attract(selectedCar, id);
	}

	function backToProfiles() {
		screen = 'profiles';
		slot = null;
		game?.attract();
	}

	function markTutorialSeen() {
		if (slot === null || !profile || profile.tutorialSeen) return;
		const updated = { ...profile, tutorialSeen: true };
		const profiles = [...save.profiles];
		profiles[slot] = updated;
		save = { ...save, profiles };
		storeSave(save);
	}

	function go() {
		if (!profile) return;
		if (!profile.tutorialSeen) {
			tutorialMode = 'first';
			tutorialOpen = true;
			return;
		}
		beginRace();
	}

	function beginRace() {
		tutorialOpen = false;
		tutorialMode = null;
		result = null;
		newCarId = null;
		trophy = false;
		paused = false;
		settingsOpen = false;
		screen = 'race';
		markTutorialSeen();
		game?.startRace(selectedCar, selectedTrack);
		void enterImmersive();
	}

	function onTutorialDone() {
		tutorialOpen = false;
		if (tutorialMode === 'first') {
			tutorialMode = null;
			beginRace();
		} else {
			tutorialMode = null;
			paused = false;
			game?.resume();
			void requestWakeLock();
		}
	}

	function openTutorialFromPause() {
		tutorialMode = 'replay';
		tutorialOpen = true;
		paused = false;
		game?.pause();
	}

	function handleTutorialStep(index: number) {
		game?.playVoice(tutorialVoiceKeys[index] ?? 'tutorial_steer');
	}

	$effect(() => {
		if (rotate && !rotateSpoke) {
			rotateSpoke = true;
			game?.playVoice('turn');
		}
		if (!rotate) rotateSpoke = false;
	});

	function handleFinish(raceResult: RaceResult) {
		if (slot === null) return;
		const recorded = recordResult(save, slot, raceResult.stars, selectedCar);
		save = recorded.save;
		storeSave(save);
		result = raceResult;
		newCarId = recorded.newCar;
		trophy = recorded.trophy;
		releaseWakeLock();
		if (recorded.trophy) {
			game?.trophySound();
			game?.playVoice('trophy');
		} else if (recorded.newCar) {
			game?.unlockSound();
			game?.playVoice('new_car');
		} else {
			game?.playVoice(raceResult.stars === 3 ? 'three_stars' : 'great');
		}
	}

	function again() {
		result = null;
		newCarId = null;
		trophy = false;
		paused = false;
		game?.startRace(selectedCar, selectedTrack);
		void requestWakeLock();
	}

	function home() {
		result = null;
		newCarId = null;
		trophy = false;
		paused = false;
		screen = 'garage';
		game?.attract(selectedCar, selectedTrack);
		releaseWakeLock();
	}

	function pauseGame() {
		if (screen !== 'race' || paused || result) return;
		game?.pause();
		paused = true;
		releaseWakeLock();
	}

	function resumeGame() {
		game?.resume();
		paused = false;
		void requestWakeLock();
	}

	function restartRace() {
		paused = false;
		result = null;
		newCarId = null;
		trophy = false;
		game?.startRace(selectedCar, selectedTrack);
		void requestWakeLock();
	}

	function toggleSound() {
		const settings = { ...save.settings, sound: !save.settings.sound };
		save = { ...save, settings };
		storeSave(save);
		game?.setSound(settings.sound);
	}

	function toggleMotion() {
		const settings = { ...save.settings, reducedMotion: !save.settings.reducedMotion };
		save = { ...save, settings };
		storeSave(save);
		game?.setReducedMotion(settings.reducedMotion);
		document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
	}

	function toggleAdvanced() {
		const settings = { ...save.settings, advancedDriving: !save.settings.advancedDriving };
		save = { ...save, settings };
		storeSave(save);
		game?.setAdvancedDriving(settings.advancedDriving);
	}

	function setLang(lang: 'it' | 'en') {
		const settings = { ...save.settings, lang };
		save = { ...save, settings };
		storeSave(save);
		game?.setLang(lang);
	}

	function resetCurrentProfile() {
		if (slot === null) return;
		save = resetProfile(save, slot);
		storeSave(save);
		slot = null;
		screen = 'profiles';
		settingsOpen = false;
		game?.attract();
		releaseWakeLock();
	}

	function dismissInstall() {
		installDismissed = true;
		installOpen = false;
		try {
			localStorage.setItem('zoomtown.installDismissed', '1');
		} catch {
			// Private mode can reject storage; the banner stays dismissed for this session.
		}
	}

	async function enterImmersive() {
		try {
			if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
				await document.documentElement.requestFullscreen();
			}
		} catch {
			// iOS Safari does not expose fullscreen for arbitrary elements.
		}
		await requestWakeLock();
	}

	async function requestWakeLock() {
		try {
			const wl = (
				navigator as unknown as {
					wakeLock?: { request: (type: string) => Promise<{ release: () => Promise<void> }> };
				}
			).wakeLock;
			if (wl && !wakeLock) wakeLock = await wl.request('screen');
		} catch {
			// Wake lock is best-effort.
		}
	}

	async function releaseWakeLock() {
		try {
			await wakeLock?.release();
		} catch {
			// Ignore.
		}
		wakeLock = null;
	}
</script>

<div class="stage">
	<div class="frame">
		<canvas bind:this={canvas} class="game-canvas" aria-label="Zoom Town race track"></canvas>

		{#if screen === 'profiles'}
			<ProfilePicker {save} onPick={selectProfile} onSettings={() => (settingsOpen = true)} />
		{:else if screen === 'garage' && profile}
			<Garage
				{profile}
				{selectedTrack}
				onPick={pickCar}
				onTrack={pickTrack}
				onGo={go}
				onBack={backToProfiles}
				onSettings={() => (settingsOpen = true)}
			/>
		{:else if screen === 'race'}
			<Hud
				{hud}
				advanced={save.settings.advancedDriving}
				onSteer={(value) => game?.setSteer(value)}
				onBoost={() => game?.requestBoost()}
				onPause={pauseGame}
			/>
			{#if result}
				<Results {result} newCar={newCarSpec} {trophy} onAgain={again} onHome={home} />
			{/if}
		{/if}

		{#if paused && !result && screen === 'race'}
			<PauseMenu
				sound={save.settings.sound}
				onResume={resumeGame}
				onRestart={restartRace}
				onHome={home}
				onSound={toggleSound}
				onTutorial={openTutorialFromPause}
			/>
		{/if}

		{#if tutorialOpen}
			<Tutorial
				lang={save.settings.lang}
				advanced={save.settings.advancedDriving}
				onDone={onTutorialDone}
				onStep={handleTutorialStep}
			/>
		{/if}

		{#if showInstallBanner}
			<InstallBanner
				lang={save.settings.lang}
				onOpen={() => (installOpen = true)}
				onDismiss={dismissInstall}
			/>
		{/if}

		{#if installOpen}
			<InstallSheet
				lang={save.settings.lang}
				safari={iosSafari}
				onClose={() => (installOpen = false)}
				onDismiss={dismissInstall}
			/>
		{/if}

		{#if settingsOpen}
			<SettingsSheet
				settings={save.settings}
				hasProfile={profile !== null}
				showInstall={iosDevice && !installed}
				onSound={toggleSound}
				onLang={setLang}
				onMotion={toggleMotion}
				onAdvanced={toggleAdvanced}
				onInstall={() => {
					settingsOpen = false;
					installOpen = true;
				}}
				onReset={resetCurrentProfile}
				onClose={() => (settingsOpen = false)}
			/>
		{/if}

		{#if rotate}
			<RotateOverlay lang={save.settings.lang} />
		{/if}
	</div>
</div>

<style>
	.stage {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		background: radial-gradient(circle at 50% 20%, #35505f, transparent 55%), var(--zt-ink);
		overflow: hidden;
	}
	.frame {
		position: relative;
		width: 100vw;
		height: 100dvh;
		max-width: 560px;
		overflow: hidden;
		background: var(--zt-sky);
	}
	.game-canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
	@media (min-width: 700px) {
		.frame {
			border-radius: 30px;
			box-shadow:
				0 24px 70px rgb(0 0 0 / 0.35),
				0 0 0 6px rgb(255 246 227 / 0.12);
		}
	}
</style>
