<script lang="ts">
	import { CARS, type CarId } from '#lib/game/cars';
	import type { TrackId } from '#lib/game/track';
	import { messages } from '#lib/i18n';
	import type { Lang, ProfileData } from '#lib/save';
	import AvatarIcon from './AvatarIcon.svelte';
	import CarIcon from './CarIcon.svelte';
	import StarRow from './StarRow.svelte';
	import TrackPicker from './TrackPicker.svelte';

	let {
		profile,
		selectedTrack,
		lang = 'it',
		onPick,
		onTrack,
		onGo,
		onBack,
		onSettings
	}: {
		profile: ProfileData;
		selectedTrack: TrackId;
		lang?: Lang;
		onPick: (id: CarId) => void;
		onTrack: (id: TrackId) => void;
		onGo: () => void;
		onBack: () => void;
		onSettings: () => void;
	} = $props();

	const t = $derived(messages(lang));
</script>

<div class="screen garage">
	<header class="bar">
		<button class="round" onclick={onBack} aria-label={t.back}>
			<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
				<path
					d="M20 7 L11 16 L20 25"
					fill="none"
					stroke="#26313C"
					stroke-width="4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		<div class="who">
			<span class="mini-avatar">
				<AvatarIcon id={profile.avatar} size={34} />
			</span>
			<StarRow stars={profile.bestStars} size={24} {lang} />
		</div>

		<button class="round" onclick={onSettings} aria-label={t.settings}>
			<svg viewBox="0 0 32 32" width="27" height="27" aria-hidden="true">
				<path
					d="M16 10.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
					fill="#26313C"
				/>
				<path
					d="M14.2 4h3.6l.7 3.1 2.4 1.4 3-1 1.8 3.1-2.2 2.3v2.8l2.2 2.3-1.8 3.1-3-1-2.4 1.4-.7 3.1h-3.6l-.7-3.1-2.4-1.4-3 1-1.8-3.1 2.2-2.3v-2.8L6.1 10.6l1.8-3.1 3 1 2.4-1.4Z"
					fill="none"
					stroke="#26313C"
					stroke-width="2.4"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</header>

	<div class="cars">
		{#each CARS as car}
			{@const unlocked = profile.unlocked.includes(car.id)}
			{@const selected = profile.selectedCar === car.id}
			<button
				class="car-card"
				class:locked={!unlocked}
				class:selected
				onclick={() => unlocked && onPick(car.id)}
				aria-label={unlocked ? car.driver : t.carLocked(car.driver, car.unlockedAt)}
			>
				<div class="car-art">
					<CarIcon {car} size={136} />
				</div>
				{#if !unlocked}
					<span class="lock" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20">
							<rect
								x="5"
								y="10"
								width="14"
								height="11"
								rx="3"
								fill="#FFF6E3"
								stroke="#26313C"
								stroke-width="2"
							/>
							<path
								d="M8 10V7a4 4 0 0 1 8 0v3"
								fill="none"
								stroke="#26313C"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
						<span class="need">★ {car.unlockedAt}</span>
					</span>
				{:else if selected}
					<span class="check" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="22" height="22">
							<path
								d="M5 12 L10 17 L19 6"
								fill="none"
								stroke="#FFF6E3"
								stroke-width="4"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<TrackPicker selected={selectedTrack} {lang} onPick={onTrack} />

	<button class="go" onclick={onGo} aria-label={t.race}>
		<svg viewBox="0 0 48 48" width="52" height="52" aria-hidden="true">
			<path d="M17 10 L38 24 L17 38 Z" fill="#26313C" />
		</svg>
		<span class="go-ring"></span>
	</button>

	<p class="keys">{t.keyboardHint}</p>
</div>

<style>
	.screen {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		padding: calc(12px + var(--zt-safe-top)) 16px calc(18px + var(--zt-safe-bottom));
		background:
			linear-gradient(to bottom, rgb(79 179 232 / 0.2), transparent 30%),
			linear-gradient(to top, rgb(38 49 60 / 0.42), transparent 32%);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.round {
		width: 52px;
		height: 52px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: color-mix(in srgb, var(--zt-cream) 86%, transparent);
		box-shadow: 0 4px 0 var(--zt-shadow);
	}
	.round:active {
		transform: translateY(3px) scale(0.96);
	}
	.who {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 12px 5px 6px;
		border-radius: 22px;
		background: color-mix(in srgb, var(--zt-cream) 82%, transparent);
	}
	.mini-avatar {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--zt-white);
	}

	.cars {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 12px;
		margin: 10px 0 6px;
		min-height: 0;
	}
	.car-card {
		position: relative;
		display: grid;
		place-items: center;
		border-radius: 24px;
		background: color-mix(in srgb, var(--zt-cream) 86%, transparent);
		box-shadow:
			0 6px 0 var(--zt-shadow),
			inset 0 0 0 3px color-mix(in srgb, var(--zt-white) 45%, transparent);
		transition:
			transform 180ms var(--zt-ease-boing),
			background 180ms;
		overflow: hidden;
	}
	.car-card:active {
		transform: scale(0.96);
	}
	.car-card.selected {
		background: var(--zt-cream);
		box-shadow:
			0 6px 0 var(--zt-shadow),
			inset 0 0 0 5px var(--zt-teal);
	}
	.car-card.locked {
		background: color-mix(in srgb, var(--zt-cream) 94%, transparent);
	}
	.car-card.locked .car-art {
		filter: saturate(0.35);
		opacity: 0.68;
	}
	.car-art {
		width: 92%;
		display: grid;
		place-items: center;
	}
	.lock {
		position: absolute;
		top: 10px;
		right: 10px;
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 4px 7px;
		border-radius: 12px;
		background: var(--zt-cream);
		box-shadow: 0 2px 0 var(--zt-shadow);
	}
	.need {
		font-size: 14px;
		font-weight: 700;
		color: var(--zt-ink);
	}
	.check {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-teal);
		box-shadow: 0 0 0 3px var(--zt-white);
	}

	.go {
		position: relative;
		align-self: center;
		margin-top: 5px;
		width: 88px;
		height: 88px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-teal);
		box-shadow:
			0 7px 0 var(--zt-shadow),
			inset 0 -6px 0 rgb(38 49 60 / 0.16);
		animation: go-breathe 2.4s ease-in-out infinite;
	}
	.go:active {
		transform: translateY(5px) scale(0.96);
	}
	.go-ring {
		position: absolute;
		inset: -7px;
		border-radius: 50%;
		border: 4px solid color-mix(in srgb, var(--zt-gold) 75%, transparent);
		animation: ring-pulse 2.4s ease-in-out infinite;
	}
	/* Desktop-only hint: the game is a phone product, the laptop is for parents. */
	.keys {
		display: none;
		margin-top: 6px;
		text-align: center;
		font-size: 12px;
		font-weight: 500;
		color: var(--zt-ink-soft);
		opacity: 0.85;
	}
	@media (hover: hover) and (pointer: fine) and (min-height: 740px) {
		.keys {
			display: block;
		}
	}
	@keyframes go-breathe {
		50% {
			transform: scale(1.04);
		}
	}
	@keyframes ring-pulse {
		50% {
			transform: scale(1.08);
			opacity: 0.35;
		}
	}

	@media (max-height: 720px) {
		.cars {
			margin: 10px 0 8px;
		}
		.go {
			width: 82px;
			height: 82px;
		}
	}
</style>
