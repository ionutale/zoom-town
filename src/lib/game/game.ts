import * as THREE from 'three';
import { AudioEngine } from './audio';
import { Balloons } from './balloons';
import { ChaseCamera } from './camera';
import { BOOST_DURATION, CRUISE_SPEED, MAX_CHARGES, PlayerCar } from './car';
import { TOTAL_BALLOONS, starsForBalloons } from './rules';
import type { CarId } from './cars';
import { Effects } from './effects';
import { COLORS } from './palette';
import { createRivals, type Rival } from './rivals';
import { TRACK_LENGTH, buildSceneryGroup, buildTrackGroup, nearestSample } from './track';
import type { Lang } from '#lib/save';

export type GamePhase = 'attract' | 'countdown' | 'racing' | 'paused' | 'finished';

export interface HudState {
	phase: GamePhase;
	lap: number;
	laps: number;
	balloons: number;
	totalBalloons: number;
	charges: number;
	maxCharges: number;
	boostTime: number;
	countdown: number;
	playerProgress: number;
	rivalProgress: number[];
	carId: CarId;
	carColor: string;
}

export interface RaceResult {
	stars: number;
	balloons: number;
	totalBalloons: number;
}

export interface GameOptions {
	canvas: HTMLCanvasElement;
	carId: CarId;
	sound: boolean;
	reducedMotion: boolean;
	lang: Lang;
	onHud?: (state: HudState) => void;
	onFinish?: (result: RaceResult) => void;
	onPickup?: (total: number) => void;
	onBump?: () => void;
}

export class ZoomTownGame {
	private renderer: THREE.WebGLRenderer;
	private scene = new THREE.Scene();
	private cameraRig: ChaseCamera;
	private player: PlayerCar;
	private rivals: Rival[] = [];
	private balloons = new Balloons();
	private effects = new Effects();
	private audio: AudioEngine;
	private options: GameOptions;
	private phase: GamePhase = 'attract';
	private phaseBeforePause: GamePhase = 'racing';
	private countdown = 0;
	private steer = 0;
	private lastLap = 1;
	private hudTimer = 0;
	private lastTime = 0;
	private raf = 0;
	private resizeObserver: ResizeObserver | null = null;
	private disposed = false;
	private resultSent = false;
	private lastRailContact = false;
	private frames = 0;

	constructor(options: GameOptions) {
		this.options = options;
		this.audio = new AudioEngine(options.lang);
		this.renderer = new THREE.WebGLRenderer({
			canvas: options.canvas,
			antialias: true,
			powerPreference: 'high-performance'
		});
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;

		this.scene.background = new THREE.Color(COLORS.sky);
		this.scene.fog = new THREE.Fog(COLORS.sky, 55, 160);

		this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
		const hemi = new THREE.HemisphereLight(COLORS.sky, COLORS.grass2, 1.25);
		this.scene.add(hemi);
		const sun = new THREE.DirectionalLight(0xfff3d6, 1.4);
		sun.position.set(35, 55, 18);
		this.scene.add(sun);

		this.scene.add(buildTrackGroup());
		this.scene.add(buildSceneryGroup());
		this.scene.add(this.balloons.root);
		this.scene.add(this.effects.root);

		this.player = new PlayerCar(options.carId);
		this.scene.add(this.player.visual.group);

		this.cameraRig = new ChaseCamera(1);
		this.cameraRig.calm = options.reducedMotion;
		this.audio.soundOn = options.sound;

		this.resize();
		if (typeof ResizeObserver !== 'undefined') {
			this.resizeObserver = new ResizeObserver(() => this.resize());
			this.resizeObserver.observe(options.canvas);
		}
		window.addEventListener('resize', this.resize);

		this.lastTime = performance.now();
		this.raf = requestAnimationFrame(this.loop);
		this.emitHud(true);
	}

	attract(carId?: CarId): void {
		if (carId && carId !== this.player.spec.id) this.replaceCar(carId);
		this.player.reset();
		this.clearRivals();
		this.balloons.reset();
		this.effects.clear();
		this.phase = 'attract';
		this.resultSent = false;
		this.lastLap = 1;
		this.cameraRig.resetAttract();
		this.audio.stopMusic();
		this.audio.stopEngine();
		this.audio.stopVoice();
		this.emitHud(true);
	}

	startRace(carId: CarId): void {
		if (carId !== this.player.spec.id) this.replaceCar(carId);
		this.player.reset();
		this.clearRivals();
		this.rivals = createRivals(carId);
		for (const rival of this.rivals) this.scene.add(rival.visual.group);
		this.balloons.reset();
		this.effects.clear();
		this.phase = 'countdown';
		this.countdown = 3.0;
		this.steer = 0;
		this.lastLap = 1;
		this.resultSent = false;
		this.hudTimer = 0;
		const near = nearestSample(this.player.pos, this.player.prevIndex);
		this.cameraRig.setChase(this.player, near);
		void this.audio.unlock();
		this.audio.startMusic();
		this.audio.startEngine();
		this.audio.countdown(false);
		this.audio.playVoice('count_3');
		this.emitHud(true);
	}

	pause(): void {
		if (this.phase !== 'racing' && this.phase !== 'countdown') return;
		this.phaseBeforePause = this.phase;
		this.phase = 'paused';
		this.steer = 0;
		this.audio.updateEngine(0, false);
		this.audio.stopMusic();
		this.audio.stopEngine();
		this.audio.stopVoice();
		this.emitHud(true);
	}

	resume(): void {
		if (this.phase !== 'paused') return;
		this.phase = this.phaseBeforePause;
		this.audio.startMusic();
		this.audio.startEngine();
		this.emitHud(true);
	}

	restart(carId: CarId): void {
		this.startRace(carId);
	}

	setSteer(value: number): void {
		this.steer = Math.max(-1, Math.min(1, value));
	}

	requestBoost(): void {
		if (this.phase !== 'racing') return;
		if (this.player.requestBoost()) {
			this.audio.boost();
			this.emitHud(true);
		}
	}

	setSound(on: boolean): void {
		this.audio.setSound(on);
	}

	unlockSound(): void {
		this.audio.unlockCar();
	}

	setReducedMotion(on: boolean): void {
		this.cameraRig.calm = on;
	}

	setLang(lang: Lang): void {
		this.options.lang = lang;
		this.audio.setLang(lang);
	}

	unlockAudio(): void {
		void this.audio.unlock();
	}

	playVoice(
		key:
			| 'tutorial_steer'
			| 'tutorial_boost'
			| 'tutorial_balloons'
			| 'count_3'
			| 'count_2'
			| 'count_1'
			| 'go'
			| 'great'
			| 'three_stars'
			| 'new_car'
			| 'trophy'
			| 'turn'
			| 'pick_driver'
	): void {
		this.audio.playVoice(key);
	}

	playSfx(
		key: 'pop' | 'boost' | 'star' | 'unlock' | 'trophy' | 'click' | 'beep' | 'rail' | 'bump'
	): void {
		this.audio.playSfx(key);
	}

	trophySound(): void {
		this.audio.trophy();
	}

	debugCollectAll(): void {
		this.balloons.forceCollect(TOTAL_BALLOONS);
		this.player.charges = MAX_CHARGES;
		this.emitHud(true);
	}

	debugSkipCountdown(): void {
		if (this.phase !== 'countdown') return;
		this.countdown = 0;
		this.phase = 'racing';
		this.audio.countdown(true);
		this.audio.playVoice('go');
		this.emitHud(true);
	}

	debugFinish(stars = 3): void {
		this.balloons.forceCollect(stars === 3 ? TOTAL_BALLOONS : stars === 2 ? TOTAL_BALLOONS / 2 : 0);
		this.player.raceDistance = TRACK_LENGTH * 2;
		this.player.lap = 2;
		this.player.finished = true;
		this.finishRace();
	}

	debugState(): object {
		return {
			phase: this.phase,
			car: this.player.spec.id,
			lap: this.player.lap,
			raceDistance: this.player.raceDistance,
			heading: this.player.heading,
			speed: this.player.speed,
			balloons: this.balloons.collectedTotal,
			charges: this.player.charges,
			steer: this.steer,
			lateral: nearestSample(this.player.pos, this.player.prevIndex).lateral,
			sampleDistance: nearestSample(this.player.pos, this.player.prevIndex).sample.distance,
			prevIndex: this.player.prevIndex,
			touchingRail: this.player.touchingRail,
			rivalCount: this.rivals.length,
			rivals: this.rivals.map((rival) => ({
				id: rival.id,
				distance: rival.distance,
				position: { x: rival.visual.group.position.x, z: rival.visual.group.position.z }
			})),
			audioReady: this.audio.ready,
			frames: this.frames,
			calls: this.renderer.info.render.calls,
			triangles: this.renderer.info.render.triangles,
			position: { x: this.player.pos.x, z: this.player.pos.z }
		};
	}

	private replaceCar(carId: CarId): void {
		this.player.visual.group.removeFromParent();
		this.player = new PlayerCar(carId);
		this.scene.add(this.player.visual.group);
	}

	private clearRivals(): void {
		for (const rival of this.rivals) rival.visual.group.removeFromParent();
		this.rivals = [];
	}

	private finishRace(): void {
		if (this.phase === 'finished' || this.resultSent) return;
		this.resultSent = true;
		this.phase = 'finished';
		this.player.finished = true;
		this.player.speed = 0;
		this.steer = 0;
		const balloons = this.balloons.collectedTotal;
		const stars = starsForBalloons(balloons);
		this.effects.confettiBurst(this.player.pos);
		this.audio.chime();
		this.audio.stopEngine();
		this.audio.updateEngine(0, false);
		this.emitHud(true);
		this.options.onFinish?.({ stars, balloons, totalBalloons: TOTAL_BALLOONS });
	}

	private resize = (): void => {
		const canvas = this.options.canvas;
		const width = canvas.clientWidth || 390;
		const height = canvas.clientHeight || 844;
		this.renderer.setSize(width, height, false);
		this.cameraRig.resize(width / height);
	};

	private loop = (time: number): void => {
		if (this.disposed) return;
		const dt = Math.min(0.05, Math.max(0, (time - this.lastTime) / 1000));
		this.lastTime = time;
		this.update(dt);
		this.renderer.render(this.scene, this.cameraRig.camera);
		this.raf = requestAnimationFrame(this.loop);
	};

	private update(dt: number): void {
		this.frames++;
		if (this.phase === 'attract') {
			this.cameraRig.update(dt, null, null, false);
			this.emitHud(false, dt);
			return;
		}

		if (this.phase === 'paused') {
			this.emitHud(false, dt);
			return;
		}

		if (this.phase === 'countdown') {
			const before = Math.ceil(this.countdown);
			this.countdown = Math.max(0, this.countdown - dt);
			const after = Math.ceil(this.countdown);
			if (after !== before && after >= 1) {
				this.audio.countdown(false);
				this.audio.playVoice(after === 2 ? 'count_2' : 'count_1');
			}
			const near = this.player.update(dt, 0, true);
			this.cameraRig.update(dt, this.player, near.near, false);
			if (this.countdown <= 0) {
				this.phase = 'racing';
				this.audio.countdown(true);
				this.audio.playVoice('go');
			}
			this.emitHud(false, dt);
			return;
		}

		if (this.phase === 'finished') {
			const near = this.player.update(dt, 0, false);
			this.cameraRig.update(dt, this.player, near.near, false);
			this.effects.update(dt);
			this.emitHud(false, dt);
			return;
		}

		if (this.phase === 'racing') {
			const update = this.player.update(dt, this.steer, false);
			const near = update.near;
			if (update.railContact && !this.lastRailContact) this.audio.rail();
			this.lastRailContact = update.railContact;

			for (const rival of this.rivals) {
				rival.update(dt, this.player);
				if (rival.tryBump(this.player)) {
					this.audio.bump();
					this.options.onBump?.();
				}
			}

			if (this.player.lap !== this.lastLap) {
				this.lastLap = this.player.lap;
				this.balloons.setLap(this.player.lap);
			}

			const pickups = this.balloons.update(dt, this.player.pos, this.player.lap);
			for (const pickup of pickups) {
				this.player.addCharge();
				this.effects.pop(pickup.position, pickup.color);
				this.audio.pop();
				this.options.onPickup?.(this.balloons.collectedTotal);
			}

			this.effects.update(dt);
			this.cameraRig.update(dt, this.player, near, this.player.boostTime > 0);
			this.audio.updateEngine(
				Math.min(1, this.player.speed / CRUISE_SPEED),
				this.player.boostTime > 0
			);

			if (this.player.finished) this.finishRace();
			this.emitHud(false, dt);
		}
	}

	private emitHud(force: boolean, dt = 0.016): void {
		this.hudTimer += dt;
		if (!force && this.hudTimer < 0.05) return;
		this.hudTimer = 0;
		const near = nearestSample(this.player.pos, this.player.prevIndex);
		const playerProgress = Math.min(1, Math.max(0, this.player.raceDistance / (TRACK_LENGTH * 2)));
		const rivalProgress = this.rivals.map((rival) =>
			Math.min(1, Math.max(0, (rival.distance - rival.startDistance) / (TRACK_LENGTH * 2)))
		);
		this.options.onHud?.({
			phase: this.phase,
			lap: this.player.lap,
			laps: 2,
			balloons: this.balloons.collectedTotal,
			totalBalloons: TOTAL_BALLOONS,
			charges: this.player.charges,
			maxCharges: MAX_CHARGES,
			boostTime: Math.max(0, this.player.boostTime / BOOST_DURATION),
			countdown: this.countdown,
			playerProgress,
			rivalProgress,
			carId: this.player.spec.id,
			carColor: this.player.spec.color
		});
		void near;
	}

	dispose(): void {
		this.disposed = true;
		cancelAnimationFrame(this.raf);
		this.resizeObserver?.disconnect();
		window.removeEventListener('resize', this.resize);
		this.audio.dispose();
		this.renderer.dispose();
	}
}
