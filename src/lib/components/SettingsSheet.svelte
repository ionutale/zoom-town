<script lang="ts">
	import { onDestroy } from 'svelte';
	import { messages } from '#lib/i18n';
	import type { Lang, Settings } from '#lib/save';
	import { modal } from './modal';

	let {
		settings,
		lang = 'it',
		hasProfile,
		showInstall = false,
		onSound,
		onMusic,
		onEffects,
		onLang,
		onMotion,
		onAdvanced,
		onInstall,
		onReset,
		onClose
	}: {
		settings: Settings;
		lang?: Lang;
		hasProfile: boolean;
		showInstall?: boolean;
		onSound: () => void;
		onMusic: (value: number) => void;
		onEffects: (value: number) => void;
		onLang: (lang: Lang) => void;
		onMotion: () => void;
		onAdvanced: () => void;
		onInstall?: () => void;
		onReset: () => void;
		onClose: () => void;
	} = $props();

	const t = $derived(messages(lang));

	const percent = (value: number) => Math.round(value * 100);

	let hold = $state(0);
	let timer: number | null = null;

	function startHold() {
		if (!hasProfile) return;
		stopHold();
		hold = 0;
		timer = window.setInterval(() => {
			hold = Math.min(1, hold + 0.05 / 3);
			if (hold >= 1) {
				stopHold();
				onReset();
			}
		}, 50);
	}

	function stopHold() {
		if (timer !== null) {
			window.clearInterval(timer);
			timer = null;
		}
		if (hold < 1) hold = 0;
	}

	onDestroy(stopHold);
</script>

<div
	class="overlay"
	role="dialog"
	aria-modal="true"
	aria-label={t.settings}
	use:modal={{ onEscape: onClose }}
>
	<div class="card">
		<button class="close" onclick={onClose} aria-label={t.closeSettings}>
			<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
				<path
					d="M8 8 L24 24 M24 8 L8 24"
					stroke="#26313C"
					stroke-width="4"
					stroke-linecap="round"
				/>
			</svg>
		</button>

		<div class="body">
			<div class="row">
				<span class="icon">
					{#if settings.sound}
						<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
							<path d="M8 16 H14 L21 10 V30 L14 24 H8 Z" fill="#26313C" />
							<path
								d="M26 15a7 7 0 0 1 0 10M30 11a12 12 0 0 1 0 18"
								fill="none"
								stroke="#26313C"
								stroke-width="3.4"
								stroke-linecap="round"
							/>
						</svg>
					{:else}
						<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
							<path d="M8 16 H14 L21 10 V30 L14 24 H8 Z" fill="#26313C" />
							<path
								d="M26 15 L34 25 M34 15 L26 25"
								fill="none"
								stroke="#26313C"
								stroke-width="3.4"
								stroke-linecap="round"
							/>
						</svg>
					{/if}
				</span>
				<span class="label">{t.sound}</span>
				<button
					class="switch"
					class:on={settings.sound}
					onclick={onSound}
					aria-label={t.toggleSound}
				>
					<span></span>
				</button>
			</div>

			<div class="row">
				<span class="icon">
					<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
						<circle cx="13" cy="29" r="4.2" fill="#26313C" />
						<circle cx="27" cy="26" r="4.2" fill="#26313C" />
						<path
							d="M17 29 V12 L31 9 V26"
							fill="none"
							stroke="#26313C"
							stroke-width="3.4"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<span class="label">{t.music}</span>
				<input
					class="bar"
					type="range"
					min="0"
					max="100"
					step="5"
					value={percent(settings.musicVolume)}
					style={`--fill:${percent(settings.musicVolume)}%`}
					aria-label={t.music}
					oninput={(event) => onMusic(Number(event.currentTarget.value) / 100)}
				/>
			</div>

			<div class="row">
				<span class="icon">
					<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
						<rect x="8" y="18" width="5" height="13" rx="2.5" fill="#26313C" />
						<rect x="17.5" y="9" width="5" height="22" rx="2.5" fill="#26313C" />
						<rect x="27" y="14" width="5" height="17" rx="2.5" fill="#26313C" />
					</svg>
				</span>
				<span class="label">{t.effects}</span>
				<input
					class="bar"
					type="range"
					min="0"
					max="100"
					step="5"
					value={percent(settings.effectsVolume)}
					style={`--fill:${percent(settings.effectsVolume)}%`}
					aria-label={t.effects}
					oninput={(event) => onEffects(Number(event.currentTarget.value) / 100)}
				/>
			</div>

			<div class="row">
				<span class="icon lang">
					<strong>IT</strong>
					<strong>EN</strong>
				</span>
				<span class="label">{t.language}</span>
				<div class="pills">
					<button class="pill" class:on={settings.lang === 'it'} onclick={() => onLang('it')}
						>IT</button
					>
					<button class="pill" class:on={settings.lang === 'en'} onclick={() => onLang('en')}
						>EN</button
					>
				</div>
			</div>

			<div class="row">
				<span class="icon">
					<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
						<path
							d="M5 20 Q12 10 20 20 T35 20"
							fill="none"
							stroke="#26313C"
							stroke-width="3.6"
							stroke-linecap="round"
						/>
						<path
							d="M5 28 Q12 18 20 28 T35 28"
							fill="none"
							stroke="#26313C"
							stroke-width="3.6"
							stroke-linecap="round"
							opacity="0.45"
						/>
					</svg>
				</span>
				<span class="label">{t.calm}</span>
				<button
					class="switch"
					class:on={settings.reducedMotion}
					onclick={onMotion}
					aria-label={t.toggleMotion}
				>
					<span></span>
				</button>
			</div>

			<div class="row">
				<span class="icon">
					<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
						<path
							d="M11 21 V12a3 3 0 0 1 6 0v9"
							fill="none"
							stroke="#26313C"
							stroke-width="3"
							stroke-linecap="round"
						/>
						<path
							d="M17 20v-7a3 3 0 0 1 6 0v8"
							fill="none"
							stroke="#26313C"
							stroke-width="3"
							stroke-linecap="round"
						/>
						<path
							d="M23 21v-5a3 3 0 0 1 6 0v9c0 5-4 9-9 9h-2c-3 0-5-1.6-6.4-4L7 21.5a2.8 2.8 0 0 1 4.7-3L14 22"
							fill="none"
							stroke="#26313C"
							stroke-width="3"
							stroke-linejoin="round"
						/>
						<path
							d="M5 9 H2 M30 9 H33"
							fill="none"
							stroke="#26313C"
							stroke-width="3"
							stroke-linecap="round"
							opacity="0.45"
						/>
					</svg>
				</span>
				<span class="label">{t.advanced}</span>
				<button
					class="switch"
					class:on={settings.advancedDriving}
					onclick={onAdvanced}
					aria-label={t.toggleAdvanced}
				>
					<span></span>
				</button>
			</div>

			{#if showInstall && onInstall}
				<button class="install-row" onclick={() => onInstall?.()}>
					<span class="icon">
						<svg viewBox="0 0 40 40" width="28" height="28" aria-hidden="true">
							<rect
								x="8"
								y="4"
								width="24"
								height="32"
								rx="6"
								fill="#FFF6E3"
								stroke="#26313C"
								stroke-width="2.4"
							/>
							<path
								d="M20 9 V19 M16 13 L20 9 L24 13"
								fill="none"
								stroke="#26313C"
								stroke-width="2.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path d="M14 26 H26" stroke="#7CC242" stroke-width="3" stroke-linecap="round" />
						</svg>
					</span>
					<span class="label">{t.installApp}</span>
					<span class="chevron" aria-hidden="true">›</span>
				</button>
			{/if}

			{#if hasProfile}
				<button
					class="reset"
					onpointerdown={startHold}
					onpointerup={stopHold}
					onpointerleave={stopHold}
					onpointercancel={stopHold}
					aria-label={t.resetHold}
				>
					<span class="fill" style={`width:${hold * 100}%`}></span>
					<span class="trash" aria-hidden="true">
						<svg viewBox="0 0 32 32" width="26" height="26">
							<path
								d="M9 10 H23 L21 27 H11 Z"
								fill="none"
								stroke="#FFF6E3"
								stroke-width="3.2"
								stroke-linejoin="round"
							/>
							<path
								d="M7 9 H25 M13 9 V6 H19 V9"
								fill="none"
								stroke="#FFF6E3"
								stroke-width="3.2"
								stroke-linecap="round"
							/>
						</svg>
					</span>
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 40;
		display: grid;
		place-items: center;
		padding: 20px;
		background: rgb(38 49 60 / 0.5);
		backdrop-filter: blur(4px);
	}
	.card {
		position: relative;
		width: min(100%, 330px);
		max-height: calc(100dvh - 32px);
		display: flex;
		flex-direction: column;
		padding: 20px 16px 16px;
		border-radius: 28px;
		background: var(--zt-cream);
		box-shadow:
			0 9px 0 rgb(38 49 60 / 0.24),
			inset 0 0 0 4px var(--zt-white);
	}
	/* Only the rows scroll. The close button overhangs the card, so the card
	   itself must not clip its overflow. */
	.body {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		touch-action: pan-y;
	}
	.close {
		position: absolute;
		top: -12px;
		right: -8px;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-white);
		box-shadow: 0 3px 0 var(--zt-shadow);
	}
	.row {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--zt-white) 62%, transparent);
	}
	.icon {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
	}
	.icon.lang {
		display: flex;
		gap: 2px;
		font-size: 11px;
	}
	.icon.lang strong {
		padding: 2px 3px;
		border-radius: 4px;
		background: var(--zt-cream-2);
	}
	.label {
		font-size: 19px;
		font-weight: 600;
	}
	.switch {
		width: 58px;
		height: 34px;
		border-radius: 999px;
		background: rgb(38 49 60 / 0.18);
		padding: 3px;
		display: flex;
		align-items: center;
		transition: background 160ms;
	}
	.switch span {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--zt-white);
		box-shadow: 0 2px 3px rgb(38 49 60 / 0.22);
		transition: transform 180ms var(--zt-ease-boing);
	}
	.switch.on {
		background: var(--zt-teal);
	}
	.switch.on span {
		transform: translateX(24px);
	}
	/* Level bars: native range inputs, restyled, so keyboard and screen readers
	   get the behaviour for free. */
	.bar {
		-webkit-appearance: none;
		appearance: none;
		width: 112px;
		height: 34px;
		margin: 0;
		background: transparent;
		cursor: pointer;
		touch-action: pan-y;
	}
	.bar::-webkit-slider-runnable-track {
		height: 10px;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			var(--zt-teal) 0 var(--fill),
			color-mix(in srgb, var(--zt-ink) 16%, transparent) var(--fill) 100%
		);
	}
	.bar::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 24px;
		height: 24px;
		margin-top: -7px;
		border-radius: 50%;
		background: var(--zt-white);
		border: 3px solid var(--zt-ink);
		box-shadow: 0 2px 0 var(--zt-shadow);
	}
	.bar::-moz-range-track {
		height: 10px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--zt-ink) 16%, transparent);
	}
	.bar::-moz-range-progress {
		height: 10px;
		border-radius: 999px;
		background: var(--zt-teal);
	}
	.bar::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--zt-white);
		border: 3px solid var(--zt-ink);
		box-shadow: 0 2px 0 var(--zt-shadow);
	}
	.bar:focus-visible {
		outline: 4px solid var(--zt-ink);
		outline-offset: 2px;
		border-radius: 10px;
	}

	.pills {
		display: flex;
		gap: 4px;
		padding: 3px;
		border-radius: 999px;
		background: rgb(38 49 60 / 0.12);
	}
	.pill {
		padding: 6px 10px;
		border-radius: 999px;
		font-size: 15px;
		font-weight: 700;
		color: var(--zt-ink-soft);
	}
	.pill.on {
		background: var(--zt-white);
		color: var(--zt-ink);
		box-shadow: 0 2px 0 var(--zt-shadow);
	}
	.install-row {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--zt-teal) 18%, var(--zt-white));
		text-align: left;
	}
	.chevron {
		font-size: 30px;
		line-height: 1;
		color: var(--zt-ink-soft);
	}
	.reset {
		position: relative;
		overflow: hidden;
		display: grid;
		place-items: center;
		height: 54px;
		margin-top: 4px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--zt-red) 78%, var(--zt-ink));
		box-shadow: inset 0 0 0 3px rgb(255 246 227 / 0.28);
	}
	.fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: var(--zt-red);
		transition: width 50ms linear;
	}
	.trash {
		position: relative;
		z-index: 1;
	}
</style>
