/**
 * Local audio engine. Every sound is a committed file generated on this Mac by
 * tools/generate-audio.mjs through the music-sfx-voice-studio API.
 * No browser speech synthesis, no runtime network, no external CDN.
 */
import type { Lang } from '#lib/save';

const VOICE_KEYS = [
	'tutorial_steer',
	'tutorial_boost',
	'tutorial_balloons',
	'count_3',
	'count_2',
	'count_1',
	'go',
	'great',
	'three_stars',
	'new_car',
	'trophy',
	'turn',
	'pick_driver'
] as const;

export type VoiceKey = (typeof VOICE_KEYS)[number];

const SFX_KEYS = [
	'click',
	'beep',
	'rail',
	'bump',
	'pop',
	'boost',
	'star',
	'unlock',
	'trophy',
	'engine'
] as const;

export type SfxKey = (typeof SFX_KEYS)[number];

const BASE = `${import.meta.env.BASE_URL ?? '/'}audio/`;

const MUSIC_GAIN = 0.18;
const MUSIC_DUCKED = 0.05;
const SFX_GAIN = 0.6;
const VOICE_GAIN = 1;

function clamp01(value: number): number {
	if (!Number.isFinite(value)) return 1;
	return Math.min(1, Math.max(0, value));
}

function pathFor(key: string): string {
	return `${BASE}${key}`;
}

export class AudioEngine {
	private ctx: AudioContext | null = null;
	private master: GainNode | null = null;
	private musicGain: GainNode | null = null;
	private sfxGain: GainNode | null = null;
	private voiceGain: GainNode | null = null;
	private engineGain: GainNode | null = null;
	private buffers = new Map<string, AudioBuffer>();
	private raw = new Map<string, ArrayBuffer>();
	private musicSource: AudioBufferSourceNode | null = null;
	private engineSource: AudioBufferSourceNode | null = null;
	private voiceSource: AudioBufferSourceNode | null = null;
	private preloading: Promise<void> | null = null;
	private decoding: Promise<void> | null = null;
	private wantsMusic = false;
	private wantsEngine = false;
	/** Base engine level (before the effects bar) from the last update. */
	private engineLevel = 0;
	ready = false;
	soundOn = true;
	lang: Lang = 'it';
	/** User level bars, 0–1. `sound` remains the master mute. */
	musicVolume = 1;
	effectsVolume = 1;

	constructor(lang: Lang = 'it') {
		this.lang = lang;
		// Deferred so the first frame paints before 1.2 MB of audio competes for
		// bandwidth. `unlock()` forces it early if the child reaches the race
		// before the idle callback fires.
		this.schedulePreload();
	}

	private schedulePreload(): void {
		if (typeof window === 'undefined') return;
		const idle = window.requestIdleCallback;
		if (typeof idle === 'function') {
			idle.call(window, () => this.preload(), { timeout: 1500 });
		} else {
			setTimeout(() => this.preload(), 400);
		}
	}

	preload(): void {
		if (this.preloading) return;
		const paths = [
			...VOICE_KEYS.flatMap((key) => [`voice/it/${key}.m4a`, `voice/en/${key}.m4a`]),
			...SFX_KEYS.map((key) => `sfx/${key}.m4a`),
			'music/town-loop.m4a'
		];
		this.preloading = Promise.all(
			paths.map(async (key) => {
				try {
					const response = await fetch(pathFor(key));
					if (!response.ok) return;
					this.raw.set(key, await response.arrayBuffer());
				} catch {
					// A missing optional sound must never stop the game.
				}
			})
		).then(() => undefined);
	}

	async unlock(): Promise<void> {
		if (!this.ctx) {
			const Ctor =
				window.AudioContext ??
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (!Ctor) return;
			this.ctx = new Ctor();
			this.master = this.ctx.createGain();
			this.master.gain.value = this.soundOn ? 0.9 : 0;
			this.master.connect(this.ctx.destination);

			this.musicGain = this.ctx.createGain();
			this.musicGain.gain.value = MUSIC_GAIN * this.musicVolume;
			this.musicGain.connect(this.master);

			this.sfxGain = this.ctx.createGain();
			this.sfxGain.gain.value = SFX_GAIN * this.effectsVolume;
			this.sfxGain.connect(this.master);

			this.voiceGain = this.ctx.createGain();
			this.voiceGain.gain.value = VOICE_GAIN * this.effectsVolume;
			this.voiceGain.connect(this.master);

			this.engineGain = this.ctx.createGain();
			this.engineGain.gain.value = 0;
			this.engineGain.connect(this.master);
		}
		if (this.ctx.state === 'suspended') await this.ctx.resume();
		this.preload();
		await this.preloading;
		await this.decode();
		if (this.soundOn && this.wantsMusic) this.startMusic();
		if (this.soundOn && this.wantsEngine) this.startEngine();
	}

	private async decode(): Promise<void> {
		if (!this.ctx || this.ready || this.decoding) return this.decoding ?? Promise.resolve();
		const ctx = this.ctx;
		this.decoding = Promise.all(
			[...this.raw.entries()].map(async ([key, data]) => {
				try {
					const buffer = await ctx.decodeAudioData(data.slice(0));
					this.buffers.set(key, buffer);
				} catch {
					// Ignore a corrupt file; the rest still play.
				}
			})
		).then(() => {
			this.ready = this.buffers.size > 0;
			this.decoding = null;
			// The encoded bytes are no longer needed once decoded.
			this.raw.clear();
		});
		return this.decoding;
	}

	setLang(lang: Lang): void {
		this.lang = lang;
	}

	setSound(on: boolean): void {
		this.soundOn = on;
		if (this.master && this.ctx) {
			this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.04);
		}
		if (!on) {
			this.stopMusic();
			this.stopEngine();
			this.stopVoice();
		} else {
			if (this.wantsMusic) this.startMusic();
			if (this.wantsEngine) this.startEngine();
		}
	}

	private get musicTarget(): number {
		return MUSIC_GAIN * this.musicVolume;
	}

	private get musicDuckedTarget(): number {
		return MUSIC_DUCKED * this.musicVolume;
	}

	/** Music bar, 0–1. Applies live, including under a ducked voice line. */
	setMusicVolume(value: number): void {
		this.musicVolume = clamp01(value);
		if (!this.ctx || !this.musicGain) return;
		const target = this.voiceSource ? this.musicDuckedTarget : this.musicTarget;
		this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.06);
	}

	/** Effects bar, 0–1: one-shots, the engine loop and voice lines. */
	setEffectsVolume(value: number): void {
		this.effectsVolume = clamp01(value);
		if (!this.ctx) return;
		const now = this.ctx.currentTime;
		this.sfxGain?.gain.setTargetAtTime(SFX_GAIN * this.effectsVolume, now, 0.06);
		this.voiceGain?.gain.setTargetAtTime(VOICE_GAIN * this.effectsVolume, now, 0.06);
		if (this.engineGain && this.engineSource) {
			const target = this.soundOn ? this.engineLevel * this.effectsVolume : 0;
			this.engineGain.gain.setTargetAtTime(target, now, 0.06);
		}
	}

	private buffer(key: string): AudioBuffer | null {
		return this.buffers.get(key) ?? null;
	}

	private oneShot(key: string, gainValue = 1, rate = 1): void {
		if (!this.ctx || !this.sfxGain || !this.soundOn) return;
		const buffer = this.buffer(key);
		if (!buffer) return;
		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.playbackRate.value = rate;
		const gain = this.ctx.createGain();
		gain.gain.value = gainValue;
		source.connect(gain);
		gain.connect(this.sfxGain);
		source.start();
	}

	playSfx(key: SfxKey, gainValue = 1, rate = 1): void {
		this.oneShot(`sfx/${key}.m4a`, gainValue, rate);
	}

	playVoice(key: VoiceKey): void {
		if (!this.ctx || !this.voiceGain || !this.soundOn) return;
		const buffer = this.buffer(`voice/${this.lang}/${key}.m4a`);
		if (!buffer) return;
		this.stopVoice();
		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.connect(this.voiceGain);
		source.onended = () => {
			if (this.voiceSource === source) this.voiceSource = null;
			if (this.musicGain && this.ctx) {
				this.musicGain.gain.setTargetAtTime(this.musicTarget, this.ctx.currentTime, 0.12);
			}
		};
		this.voiceSource = source;
		if (this.musicGain && this.ctx) {
			this.musicGain.gain.setTargetAtTime(this.musicDuckedTarget, this.ctx.currentTime, 0.08);
		}
		source.start();
	}

	stopVoice(): void {
		if (this.voiceSource) {
			try {
				this.voiceSource.stop();
			} catch {
				// already stopped
			}
			this.voiceSource = null;
		}
		// stop() never fires onended, so an interrupted line would otherwise
		// leave the music ducked for the rest of the session.
		if (this.musicGain && this.ctx) {
			this.musicGain.gain.setTargetAtTime(this.musicTarget, this.ctx.currentTime, 0.12);
		}
	}

	startMusic(): void {
		this.wantsMusic = true;
		if (!this.ctx || !this.musicGain || !this.soundOn || this.musicSource) return;
		const buffer = this.buffer('music/town-loop.m4a');
		if (!buffer) return;
		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;
		source.connect(this.musicGain);
		source.start();
		this.musicSource = source;
	}

	stopMusic(): void {
		if (this.musicSource) {
			try {
				this.musicSource.stop();
			} catch {
				// already stopped
			}
			this.musicSource = null;
		}
	}

	startEngine(): void {
		this.wantsEngine = true;
		if (!this.ctx || !this.engineGain || !this.soundOn || this.engineSource) return;
		const buffer = this.buffer('sfx/engine.m4a');
		if (!buffer) return;
		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;
		source.playbackRate.value = 0.8;
		source.connect(this.engineGain);
		source.start();
		this.engineSource = source;
	}

	stopEngine(): void {
		this.wantsEngine = false;
		if (this.engineSource) {
			try {
				this.engineSource.stop();
			} catch {
				// already stopped
			}
			this.engineSource = null;
		}
		if (this.engineGain && this.ctx) {
			this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
		}
	}

	updateEngine(speedRatio: number, boosting: boolean): void {
		this.engineLevel = 0.09 + speedRatio * 0.05 + (boosting ? 0.03 : 0);
		if (!this.ctx || !this.engineGain || !this.engineSource) return;
		const target = this.soundOn ? this.engineLevel * this.effectsVolume : 0;
		this.engineGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
		this.engineSource.playbackRate.setTargetAtTime(
			0.78 + speedRatio * 0.55 + (boosting ? 0.18 : 0),
			this.ctx.currentTime,
			0.08
		);
	}

	pop(): void {
		this.playSfx('pop', 0.9);
	}

	boost(): void {
		this.playSfx('boost', 0.85);
	}

	bump(): void {
		this.playSfx('bump', 0.8);
	}

	rail(): void {
		this.playSfx('rail', 0.55);
	}

	chime(): void {
		this.playSfx('star', 0.9);
	}

	unlockCar(): void {
		this.playSfx('unlock', 0.9);
	}

	trophy(): void {
		this.playSfx('trophy', 0.9);
	}

	click(): void {
		this.playSfx('click', 0.7);
	}

	countdown(final = false): void {
		this.playSfx('beep', final ? 0.8 : 0.55, final ? 1.4 : 1);
	}

	dispose(): void {
		this.stopMusic();
		this.stopEngine();
		this.stopVoice();
		void this.ctx?.close();
		this.ctx = null;
		this.buffers.clear();
		this.raw.clear();
	}
}
