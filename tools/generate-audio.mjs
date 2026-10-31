#!/usr/bin/env node
/**
 * Generates Zoom Town's voice, SFX and music on this Mac using the local
 * music-sfx-voice-studio API. No cloud service and no browser speech synthesis.
 *
 *   node tools/generate-audio.mjs --voices
 *   node tools/generate-audio.mjs --sfx
 *   node tools/generate-audio.mjs --music
 *   node tools/generate-audio.mjs --all --force
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const AUDIO = path.join(ROOT, 'static', 'audio');
const RAW = path.join(ROOT, '.audio-raw');
const STUDIO = process.env.STUDIO_URL ?? 'http://127.0.0.1:7910';
const TOKEN =
	process.env.STUDIO_TOKEN ??
	(
		await readFile(
			process.env.STUDIO_TOKEN_FILE ??
				path.resolve(ROOT, '..', 'music-sfx-voice-studio', 'data', 'token'),
			'utf8'
		)
	).trim();

const FORCE = process.argv.includes('--force');
const ALL = process.argv.includes('--all') || process.argv.length === 2;
const DO_VOICES = ALL || process.argv.includes('--voices');
const DO_SFX = ALL || process.argv.includes('--sfx');
const DO_MUSIC = ALL || process.argv.includes('--music');

const VOICES = {
	tutorial_steer: {
		it: 'Tieni premuto a sinistra o a destra per sterzare.',
		en: 'Hold left or right to steer.'
	},
	tutorial_boost: {
		it: 'Tocca il pulsante grande per il turbo.',
		en: 'Tap the big button to boost.'
	},
	tutorial_balloons: {
		it: 'Raccogli i palloncini per guadagnare stelle.',
		en: 'Collect balloons to earn stars.'
	},
	count_3: { it: 'Tre.', en: 'Three.' },
	count_2: { it: 'Due.', en: 'Two.' },
	count_1: { it: 'Uno.', en: 'One.' },
	go: { it: 'Via!', en: 'Go!' },
	great: { it: 'Che bravo! Ottima guida!', en: 'Great driving!' },
	three_stars: {
		it: 'Tre stelle! Fantastico!',
		en: 'Three stars! Amazing!'
	},
	new_car: {
		it: 'Hai una nuova auto!',
		en: 'You got a new car!'
	},
	trophy: {
		it: 'Trofeo! Hai vinto tutto!',
		en: 'Trophy! You earned it all!'
	},
	turn: {
		it: 'Mettimi in verticale.',
		en: 'Turn me upright.'
	},
	pick_driver: {
		it: 'Scegli il tuo pilota.',
		en: 'Pick your driver.'
	}
};

const TEXT_SFX = {
	pop: { prompt: 'single cute balloon pop, short and bright', seconds: 1 },
	boost: { prompt: 'soft magical whoosh of a toy car boosting, short', seconds: 2 },
	star: { prompt: 'sparkly ascending star chime, short and gentle', seconds: 2 },
	unlock: { prompt: 'short cheerful toy fanfare for unlocking a new car', seconds: 4 },
	trophy: { prompt: 'celebratory children fanfare with bells, short', seconds: 5 },
	engine: {
		prompt: 'small toy car engine humming steadily, low volume, seamless loop',
		seconds: 4
	}
};

const PROCEDURAL_SFX = {
	click: { preset: 'click', duration_ms: 70, gain: 0.45 },
	beep: { preset: 'blip', duration_ms: 180, gain: 0.4, pitch_hz: 880 },
	rail: { preset: 'blip', duration_ms: 120, gain: 0.3, pitch_hz: 520, pitch_end_hz: 420 },
	bump: { preset: 'hit', duration_ms: 160, gain: 0.5, cutoff_hz: 900 }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file) {
	try {
		await stat(file);
		return true;
	} catch {
		return false;
	}
}

async function request(route, body, label) {
	for (let attempt = 1; attempt <= 60; attempt++) {
		const response = await fetch(`${STUDIO}${route}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});
		if (response.ok) return response.json();
		const text = await response.text();
		if (response.status === 409 && text.includes('BUSY')) {
			console.log(`  ${label}: GPU busy, waiting...`);
			await sleep(2500);
			continue;
		}
		throw new Error(`${label}: ${response.status} ${text}`);
	}
	throw new Error(`${label}: GPU stayed busy`);
}

async function takeWav(id, destination) {
	const response = await fetch(`${STUDIO}/takes/${id}/audio`, {
		headers: { Authorization: `Bearer ${TOKEN}` }
	});
	if (!response.ok) throw new Error(`download ${id}: ${response.status}`);
	const buffer = Buffer.from(await response.arrayBuffer());
	await writeFile(destination, buffer);
	return destination;
}

async function convert(
	input,
	output,
	{ mono = true, bitrate = '64k', normalize = false, filters = [] } = {}
) {
	await mkdir(path.dirname(output), { recursive: true });
	const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', input];
	const filter = [...filters];
	if (normalize) filter.push('loudnorm=I=-16:TP=-1.5:LRA=11');
	if (filter.length) args.push('-af', filter.join(','));
	if (mono) args.push('-ac', '1');
	args.push('-c:a', 'aac', '-b:a', bitrate, output);
	await run('ffmpeg', args);
	return output;
}

async function generateVoices() {
	console.log('\nVoice lines (Qwen3-TTS, local)');
	for (const [key, languages] of Object.entries(VOICES)) {
		for (const lang of ['it', 'en']) {
			const out = path.join(AUDIO, 'voice', lang, `${key}.m4a`);
			if (!FORCE && (await exists(out))) continue;
			const text = languages[lang];
			const label = `voice ${lang}/${key}`;
			console.log(`  ${label}: "${text}"`);
			const take = await request(
				'/voice',
				{
					text,
					voice: 'serena',
					instruct:
						lang === 'it'
							? 'voce calda, allegra e giocosa per bambini piccoli, chiara e lenta'
							: 'warm, cheerful, playful storyteller for young children, clear and slow',
					language: lang === 'it' ? 'Italian' : 'English'
				},
				label
			);
			const raw = path.join(RAW, 'voice', lang, `${key}.wav`);
			await mkdir(path.dirname(raw), { recursive: true });
			await takeWav(take.id, raw);
			await convert(raw, out, {
				mono: true,
				bitrate: '64k',
				normalize: true,
				filters: [
					'silenceremove=start_periods=1:start_duration=0.04:start_threshold=-45dB:stop_periods=1:stop_duration=0.12:stop_threshold=-45dB'
				]
			});
			console.log(`    -> ${path.relative(ROOT, out)} (${take.seconds.toFixed(2)}s)`);
		}
	}
}

async function generateSfx() {
	console.log('\nProcedural SFX (local)');
	for (const [key, body] of Object.entries(PROCEDURAL_SFX)) {
		const out = path.join(AUDIO, 'sfx', `${key}.m4a`);
		if (!FORCE && (await exists(out))) continue;
		const label = `sfx ${key}`;
		console.log(`  ${label}`);
		const take = await request('/sfx', body, label);
		const raw = path.join(RAW, 'sfx', `${key}.wav`);
		await mkdir(path.dirname(raw), { recursive: true });
		await takeWav(take.id, raw);
		await convert(raw, out, { mono: true, bitrate: '96k', normalize: false });
		console.log(`    -> ${path.relative(ROOT, out)}`);
	}

	console.log('\nText SFX (Stable Audio 3, local)');
	for (const [key, { prompt, seconds }] of Object.entries(TEXT_SFX)) {
		const out = path.join(AUDIO, 'sfx', `${key}.m4a`);
		if (!FORCE && (await exists(out))) continue;
		const label = `sfx ${key}`;
		console.log(`  ${label}: "${prompt}"`);
		const take = await request('/sfx/text', { prompt, seconds, seed: 11 }, label);
		const raw = path.join(RAW, 'sfx', `${key}.wav`);
		await mkdir(path.dirname(raw), { recursive: true });
		await takeWav(take.id, raw);
		await convert(raw, out, { mono: true, bitrate: '96k', normalize: true });
		console.log(`    -> ${path.relative(ROOT, out)} (${take.seconds.toFixed(2)}s)`);
	}
}

async function generateMusic() {
	const out = path.join(AUDIO, 'music', 'town-loop.m4a');
	if (!FORCE && (await exists(out))) {
		console.log('\nMusic already exists; use --force to regenerate.');
		return;
	}
	console.log('\nMusic (Stable Audio 3, local)');
	const prompt =
		'cheerful toy town racing music for young children, toy piano, ukulele, whistling melody, upbeat playful, 100 bpm, no vocals, seamless loop';
	const take = await request('/music', { prompt, seconds: 45, seed: 7 }, 'music');
	const raw = path.join(RAW, 'music', 'town-loop.wav');
	await mkdir(path.dirname(raw), { recursive: true });
	await takeWav(take.id, raw);
	await convert(raw, out, {
		mono: false,
		bitrate: '112k',
		normalize: true,
		filters: ['afade=t=in:st=0:d=0.15', 'afade=t=out:st=44.85:d=0.15']
	});
	console.log(`  -> ${path.relative(ROOT, out)} (${take.seconds.toFixed(2)}s)`);
}

async function writeManifest() {
	const manifest = {
		voice: {
			it: Object.fromEntries(Object.keys(VOICES).map((key) => [key, `voice/it/${key}.m4a`])),
			en: Object.fromEntries(Object.keys(VOICES).map((key) => [key, `voice/en/${key}.m4a`]))
		},
		sfx: Object.fromEntries(
			[...Object.keys(PROCEDURAL_SFX), ...Object.keys(TEXT_SFX)].map((key) => [
				key,
				`sfx/${key}.m4a`
			])
		),
		music: { town: 'music/town-loop.m4a' }
	};
	await writeFile(path.join(AUDIO, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

await mkdir(AUDIO, { recursive: true });
await mkdir(RAW, { recursive: true });
if (DO_VOICES) await generateVoices();
if (DO_SFX) await generateSfx();
if (DO_MUSIC) await generateMusic();
await writeManifest();
console.log('\nAudio generation complete.');
