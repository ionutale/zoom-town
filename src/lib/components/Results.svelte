<script lang="ts">
	import type { CarSpec } from '#lib/game/cars';
	import type { RaceResult } from '#lib/game/game';
	import CarIcon from './CarIcon.svelte';
	import StarRow from './StarRow.svelte';

	let {
		result,
		newCar,
		trophy,
		onAgain,
		onHome
	}: {
		result: RaceResult;
		newCar: CarSpec | null;
		trophy: boolean;
		onAgain: () => void;
		onHome: () => void;
	} = $props();

	const confetti = Array.from({ length: 22 }, (_, i) => i);
</script>

<div class="overlay">
	<div class="confetti" aria-hidden="true">
		{#each confetti as piece}
			<span style={`--i:${piece}`}></span>
		{/each}
	</div>

	<div class="card">
		{#if trophy}
			<div class="trophy" aria-label="Trophy">
				<svg viewBox="0 0 120 120" width="110" height="110" aria-hidden="true">
					<path
						d="M34 18 H86 V36 C86 55 75 66 60 66 C45 66 34 55 34 36 Z"
						fill="#FFC93C"
						stroke="#26313C"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<path
						d="M34 26 H20 V36 C20 46 28 52 38 52"
						fill="none"
						stroke="#26313C"
						stroke-width="5"
						stroke-linecap="round"
					/>
					<path
						d="M86 26 H100 V36 C100 46 92 52 82 52"
						fill="none"
						stroke="#26313C"
						stroke-width="5"
						stroke-linecap="round"
					/>
					<path d="M54 66 H66 V82 H54 Z" fill="#FFC93C" stroke="#26313C" stroke-width="5" />
					<path
						d="M38 94 H82 V104 H38 Z"
						fill="#E8433F"
						stroke="#26313C"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<path d="M42 82 H78 V94 H42 Z" fill="#FFF6E3" stroke="#26313C" stroke-width="5" />
					<circle cx="60" cy="36" r="7" fill="#FFF6E3" stroke="#26313C" stroke-width="4" />
				</svg>
			</div>
		{/if}

		<StarRow stars={result.stars} size={64} animate />

		<div class="tally" aria-label={`${result.balloons} of ${result.totalBalloons} balloons`}>
			<svg viewBox="0 0 24 30" width="26" height="32" aria-hidden="true">
				<ellipse cx="12" cy="12" rx="9" ry="11" fill="#E8433F" stroke="#26313C" stroke-width="2" />
				<path d="M10 23 L12 27 L14 23" fill="#FFF6E3" stroke="#26313C" stroke-width="1.5" />
			</svg>
			<strong>{result.balloons}</strong>
			<span>/ {result.totalBalloons}</span>
		</div>

		{#if newCar}
			<div class="unlock">
				<span class="new">NEW</span>
				<CarIcon car={newCar} size={150} />
			</div>
		{/if}

		<div class="actions">
			<button class="action" onclick={onAgain} aria-label="Race again">
				<svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
					<path
						d="M38 24a14 14 0 1 1-4.1-9.9"
						fill="none"
						stroke="#26313C"
						stroke-width="5"
						stroke-linecap="round"
					/>
					<path
						d="M38 7 V19 H26"
						fill="none"
						stroke="#26313C"
						stroke-width="5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
			<button class="action home" onclick={onHome} aria-label="Back to garage">
				<svg viewBox="0 0 48 48" width="38" height="38" aria-hidden="true">
					<path
						d="M8 23 L24 9 L40 23"
						fill="none"
						stroke="#26313C"
						stroke-width="5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M13 21 V39 H35 V21"
						fill="none"
						stroke="#26313C"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<path d="M21 39 V29 H27 V39" fill="none" stroke="#26313C" stroke-width="4" />
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 20;
		display: grid;
		place-items: center;
		padding: calc(24px + var(--zt-safe-top)) 20px calc(24px + var(--zt-safe-bottom));
		background: rgb(38 49 60 / 0.46);
		backdrop-filter: blur(3px);
	}
	.card {
		position: relative;
		width: min(100%, 340px);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 22px 20px 20px;
		border-radius: 32px;
		background: var(--zt-cream);
		box-shadow:
			0 10px 0 rgb(38 49 60 / 0.24),
			inset 0 0 0 4px var(--zt-white);
		animation: card-in 520ms var(--zt-ease-boing) both;
	}
	@keyframes card-in {
		from {
			transform: translateY(30px) scale(0.9);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}
	.trophy {
		margin-top: -64px;
		filter: drop-shadow(0 8px 0 rgb(38 49 60 / 0.18));
		animation: trophy-in 700ms var(--zt-ease-boing) both;
	}
	@keyframes trophy-in {
		from {
			transform: scale(0.2) rotate(-18deg);
			opacity: 0;
		}
		60% {
			transform: scale(1.12) rotate(5deg);
		}
		to {
			transform: scale(1) rotate(0);
			opacity: 1;
		}
	}
	.tally {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-size: 24px;
		color: var(--zt-ink);
	}
	.tally strong {
		font-size: 38px;
		line-height: 1;
	}
	.tally span {
		opacity: 0.55;
		font-size: 20px;
	}
	.unlock {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		padding: 2px 0 0;
	}
	.new {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -50%) rotate(-4deg);
		padding: 3px 12px;
		border-radius: 999px;
		background: var(--zt-red);
		color: var(--zt-cream);
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 0.08em;
		box-shadow: 0 0 0 3px var(--zt-cream);
		z-index: 2;
	}
	.actions {
		display: flex;
		gap: 18px;
		margin-top: 4px;
	}
	.action {
		width: 74px;
		height: 74px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-teal);
		box-shadow:
			0 5px 0 var(--zt-shadow),
			inset 0 -5px 0 rgb(38 49 60 / 0.12);
		transition: transform 140ms var(--zt-ease-snap);
	}
	.action.home {
		background: var(--zt-yellow);
	}
	.action:active {
		transform: translateY(4px) scale(0.96);
	}

	.confetti {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.confetti span {
		position: absolute;
		top: -12%;
		left: calc((var(--i) * 4.6%) + 2%);
		width: 9px;
		height: 14px;
		border-radius: 2px;
		background: var(--zt-gold);
		animation: fall 2.6s linear infinite;
		animation-delay: calc(var(--i) * -0.12s);
	}
	.confetti span:nth-child(3n) {
		background: var(--zt-red);
	}
	.confetti span:nth-child(3n + 1) {
		background: var(--zt-teal);
	}
	.confetti span:nth-child(4n) {
		background: var(--zt-pink);
	}
	@keyframes fall {
		to {
			transform: translateY(120vh) rotate(720deg);
		}
	}

	@media (max-height: 720px) {
		.card {
			gap: 8px;
			padding: 16px 16px 14px;
		}
		.trophy :global(svg) {
			width: 82px;
			height: 82px;
		}
		.action {
			width: 64px;
			height: 64px;
		}
	}
</style>
