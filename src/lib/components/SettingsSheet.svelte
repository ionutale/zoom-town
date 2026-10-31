<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Settings } from '#lib/save';

	let {
		settings,
		hasProfile,
		showInstall = false,
		onSound,
		onLang,
		onMotion,
		onInstall,
		onReset,
		onClose
	}: {
		settings: Settings;
		hasProfile: boolean;
		showInstall?: boolean;
		onSound: () => void;
		onLang: (lang: 'it' | 'en') => void;
		onMotion: () => void;
		onInstall?: () => void;
		onReset: () => void;
		onClose: () => void;
	} = $props();

	let hold = $state(0);
	let timer: number | null = null;
	const labels = $derived(
		settings.lang === 'it'
			? { sound: 'Suono', language: 'Lingua', calm: 'Calmo', install: 'Installa app' }
			: { sound: 'Sound', language: 'Language', calm: 'Calm', install: 'Install app' }
	);

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

<div class="overlay">
	<div class="card">
		<button class="close" onclick={onClose} aria-label="Close settings">
			<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
				<path
					d="M8 8 L24 24 M24 8 L8 24"
					stroke="#26313C"
					stroke-width="4"
					stroke-linecap="round"
				/>
			</svg>
		</button>

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
			<span class="label">{labels.sound}</span>
			<button class="switch" class:on={settings.sound} onclick={onSound} aria-label="Toggle sound">
				<span></span>
			</button>
		</div>

		<div class="row">
			<span class="icon lang">
				<strong>IT</strong>
				<strong>EN</strong>
			</span>
			<span class="label">{labels.language}</span>
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
			<span class="label">{labels.calm}</span>
			<button
				class="switch"
				class:on={settings.reducedMotion}
				onclick={onMotion}
				aria-label="Toggle reduced motion"
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
				<span class="label">{labels.install}</span>
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
				aria-label="Hold three seconds to reset this profile"
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
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 20px 16px 16px;
		border-radius: 28px;
		background: var(--zt-cream);
		box-shadow:
			0 9px 0 rgb(38 49 60 / 0.24),
			inset 0 0 0 4px var(--zt-white);
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
