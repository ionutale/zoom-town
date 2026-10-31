<script lang="ts">
	import type { HudState } from '#lib/game/game';
	import Speedometer from './Speedometer.svelte';

	let {
		hud,
		onSteer,
		onBoost,
		onPause
	}: {
		hud: HudState;
		onSteer: (value: number) => void;
		onBoost: () => void;
		onPause: () => void;
	} = $props();

	let leftDown = $state(false);
	let rightDown = $state(false);
	let lastPhase = $state<string | null>(null);

	$effect(() => {
		if (hud.phase !== lastPhase) {
			lastPhase = hud.phase;
			if (hud.phase === 'countdown' || hud.phase === 'finished') {
				leftDown = false;
				rightDown = false;
				onSteer(0);
			}
		}
	});

	$effect(() => {
		const release = () => steerRelease();
		window.addEventListener('pointerup', release);
		window.addEventListener('pointercancel', release);
		return () => {
			window.removeEventListener('pointerup', release);
			window.removeEventListener('pointercancel', release);
		};
	});

	function steerPress(direction: number, event: PointerEvent) {
		event.preventDefault();
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture?.(event.pointerId);
		if (direction < 0) leftDown = true;
		else rightDown = true;
		onSteer(direction);
	}

	function steerRelease() {
		leftDown = false;
		rightDown = false;
		onSteer(0);
	}

	function boostPress(event: PointerEvent) {
		event.preventDefault();
		onBoost();
	}

	const dots = $derived(Array.from({ length: hud.totalBalloons }, (_, i) => i));
</script>

<div class="hud" class:boost={hud.boostTime > 0}>
	<div class="top">
		<div class="balloon-count" aria-label={`${hud.balloons} balloons`}>
			<svg viewBox="0 0 24 30" width="24" height="30" aria-hidden="true">
				<ellipse cx="12" cy="12" rx="9" ry="11" fill="#E8433F" stroke="#26313C" stroke-width="2" />
				<path d="M10 23 L12 27 L14 23" fill="#FFF6E3" stroke="#26313C" stroke-width="1.5" />
			</svg>
			<div class="dots">
				{#each dots as dot}
					<span class="dot" class:on={dot < hud.balloons}></span>
				{/each}
			</div>
		</div>

		<div class="laps" aria-label={`Lap ${hud.lap} of ${hud.laps}`}>
			{#each Array.from({ length: hud.laps }, (_, i) => i) as lap}
				<span class="pip" class:on={hud.lap - 1 > lap}></span>
			{/each}
		</div>

		<button class="pause" onclick={onPause} aria-label="Pause">
			<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
				<rect x="5" y="4" width="5" height="16" rx="2" fill="#26313C" />
				<rect x="14" y="4" width="5" height="16" rx="2" fill="#26313C" />
			</svg>
		</button>
	</div>

	<Speedometer speed={hud.speedKmh} boosting={hud.boostTime > 0} />

	{#if hud.autoSteer}
		<div class="auto-steer" aria-label="Auto steering" aria-live="polite">
			<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">
				<circle cx="20" cy="20" r="13" fill="none" stroke="#26313C" stroke-width="3.2" />
				<circle cx="20" cy="20" r="4" fill="#26313C" />
				<path d="M20 24 V32 M8 17 H16 M24 17 H32" fill="none" stroke="#26313C" stroke-width="3.2" stroke-linecap="round" />
			</svg>
			<span>AUTO</span>
		</div>
	{/if}

	<div class="ribbon" aria-hidden="true">
		<div class="rail"></div>
		<div
			class="player-dot"
			style={`bottom: calc(${hud.playerProgress * 100}% - 7px); background:${hud.carColor}`}
		></div>
		{#each hud.rivalProgress as progress, index}
			<div
				class="rival-dot"
				style={`bottom: calc(${progress * 100}% - 4px); left:${index % 2 === 0 ? '2px' : '12px'}`}
			></div>
		{/each}
	</div>

	{#if hud.phase === 'countdown'}
		<div class="countdown" aria-live="polite">
			<span>{Math.ceil(hud.countdown)}</span>
		</div>
	{/if}

	<div class="bottom">
		<button
			class="steer left"
			class:down={leftDown}
			onpointerdown={(e) => steerPress(-1, e)}
			onpointerup={steerRelease}
			onpointercancel={steerRelease}
			onpointerleave={steerRelease}
			onlostpointercapture={steerRelease}
			aria-label="Steer left"
		>
			<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
				<path
					d="M30 10 L14 24 L30 38"
					fill="none"
					stroke="#26313C"
					stroke-width="7"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>

		<div class="boost-wrap">
			<div class="meter" aria-label={`${hud.charges} boosts`}>
				{#each Array.from({ length: hud.maxCharges }, (_, i) => i) as slot}
					<span class="charge" class:on={slot < hud.charges}></span>
				{/each}
			</div>
			<button
				class="boost-button"
				class:ready={hud.charges > 0}
				class:boosting={hud.boostTime > 0}
				onpointerdown={boostPress}
				aria-label="Boost"
			>
				<svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
					<path d="M26 5 L12 27 H23 L21 43 L36 20 H25 Z" fill="#26313C" />
				</svg>
			</button>
		</div>

		<button
			class="steer right"
			class:down={rightDown}
			onpointerdown={(e) => steerPress(1, e)}
			onpointerup={steerRelease}
			onpointercancel={steerRelease}
			onpointerleave={steerRelease}
			onlostpointercapture={steerRelease}
			aria-label="Steer right"
		>
			<svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
				<path
					d="M18 10 L34 24 L18 38"
					fill="none"
					stroke="#26313C"
					stroke-width="7"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>

	{#if hud.boostTime > 0}
		<div class="speed-lines" aria-hidden="true">
			{#each Array.from({ length: 8 }, (_, i) => i) as line}
				<span style={`--i:${line}`}></span>
			{/each}
		</div>
	{/if}
</div>

<style>
	.hud {
		position: absolute;
		inset: 0;
		z-index: 5;
		pointer-events: none;
		color: var(--zt-ink);
	}

	.top {
		position: absolute;
		top: calc(10px + var(--zt-safe-top));
		left: calc(12px + var(--zt-safe-left));
		right: calc(12px + var(--zt-safe-right));
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.balloon-count {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 7px 10px 7px 8px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--zt-cream) 86%, transparent);
		box-shadow: 0 3px 0 var(--zt-shadow);
	}

	.dots {
		display: grid;
		grid-template-columns: repeat(5, 8px);
		gap: 4px;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--zt-ink) 18%, transparent);
	}
	.dot.on {
		background: var(--zt-red);
		box-shadow: inset 0 0 0 1.5px var(--zt-ink);
	}

	.laps {
		display: flex;
		gap: 8px;
		margin-top: 4px;
	}
	.pip {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 3px solid var(--zt-cream);
		background: color-mix(in srgb, var(--zt-ink) 18%, transparent);
	}
	.pip.on {
		background: var(--zt-gold);
		border-color: var(--zt-ink);
	}

	.pause {
		pointer-events: auto;
		width: 54px;
		height: 54px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-cream);
		box-shadow: 0 4px 0 var(--zt-shadow);
		transition: transform var(--zt-t-fast) var(--zt-ease-snap);
	}
	.pause:active {
		transform: translateY(3px) scale(0.96);
	}

	.auto-steer {
		position: absolute;
		top: calc(46px + var(--zt-safe-top));
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 11px 5px 7px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--zt-cream) 92%, transparent);
		box-shadow:
			0 3px 0 var(--zt-shadow),
			inset 0 0 0 2px var(--zt-white);
		color: var(--zt-ink);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		animation: auto-in 360ms var(--zt-ease-boing) both;
	}
	.auto-steer svg {
		animation: auto-wheel 1.8s ease-in-out infinite;
	}
	@keyframes auto-in {
		from {
			transform: translateX(-50%) scale(0.6);
			opacity: 0;
		}
		to {
			transform: translateX(-50%) scale(1);
			opacity: 1;
		}
	}
	@keyframes auto-wheel {
		50% {
			transform: rotate(-18deg);
		}
	}

	.ribbon {
		position: absolute;
		left: calc(5px + var(--zt-safe-left));
		bottom: 26%;
		width: 18px;
		height: 50%;
	}
	.rail {
		position: absolute;
		left: 6px;
		top: 0;
		bottom: 0;
		width: 6px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--zt-cream) 55%, transparent);
		box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--zt-ink) 22%, transparent);
	}
	.player-dot {
		position: absolute;
		left: 2px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 3px solid var(--zt-white);
		box-shadow: 0 2px 4px var(--zt-shadow);
		transition: bottom 100ms linear;
	}
	.rival-dot {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--zt-ink-soft);
		box-shadow: 0 0 0 1.5px var(--zt-white);
		transition: bottom 100ms linear;
	}

	.countdown {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		font-size: clamp(96px, 30vw, 180px);
		font-weight: 700;
		color: var(--zt-gold);
		-webkit-text-stroke: 6px var(--zt-ink);
		text-shadow: 0 8px 0 rgb(38 49 60 / 0.28);
		animation: count-pop 320ms var(--zt-ease-boing);
	}
	@keyframes count-pop {
		from {
			transform: scale(0.5);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.bottom {
		position: absolute;
		inset: 0;
	}

	.steer,
	.boost-button {
		pointer-events: auto;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-cream);
		box-shadow:
			0 5px 0 var(--zt-shadow),
			inset 0 -5px 0 rgb(38 49 60 / 0.09);
		transition:
			transform var(--zt-t-fast) var(--zt-ease-snap),
			background var(--zt-t-fast);
	}
	.steer {
		position: absolute;
		bottom: calc(20px + var(--zt-safe-bottom));
		width: 88px;
		height: 88px;
	}
	.steer.left {
		left: calc(16px + var(--zt-safe-left));
	}
	.steer.right {
		right: calc(16px + var(--zt-safe-right));
	}
	.steer.down,
	.steer:active {
		transform: translateY(4px) scale(0.96);
		background: var(--zt-yellow);
	}

	.boost-wrap {
		position: absolute;
		bottom: calc(106px + var(--zt-safe-bottom));
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}
	.boost-button {
		pointer-events: auto;
		width: 84px;
		height: 84px;
		background: color-mix(in srgb, var(--zt-cream) 62%, transparent);
		opacity: 0.55;
	}
	.boost-button.ready {
		opacity: 1;
		background: var(--zt-teal);
	}
	.boost-button.boosting {
		transform: scale(1.06);
		box-shadow:
			0 0 0 6px color-mix(in srgb, var(--zt-teal) 40%, transparent),
			0 5px 0 var(--zt-shadow);
	}
	.boost-button:active {
		transform: translateY(4px) scale(0.95);
	}

	.meter {
		display: flex;
		gap: 4px;
		padding: 4px 7px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--zt-cream) 72%, transparent);
	}
	.charge {
		width: 22px;
		height: 9px;
		border-radius: 5px;
		background: color-mix(in srgb, var(--zt-ink) 18%, transparent);
	}
	.charge.on {
		background: var(--zt-teal);
		box-shadow: inset 0 0 0 1.5px var(--zt-ink);
	}

	.speed-lines {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.speed-lines span {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: 26%;
		border-radius: 2px;
		background: linear-gradient(
			to top,
			transparent,
			color-mix(in srgb, var(--zt-cream) 80%, transparent)
		);
		transform-origin: 50% 0;
		transform: rotate(calc(var(--i) * 45deg)) translateY(30%);
		animation: speed-line 260ms linear infinite;
		opacity: 0.7;
	}
	@keyframes speed-line {
		from {
			opacity: 0;
			transform: rotate(calc(var(--i) * 45deg)) translateY(18%) scaleY(0.4);
		}
		50% {
			opacity: 0.8;
		}
		to {
			opacity: 0;
			transform: rotate(calc(var(--i) * 45deg)) translateY(52%) scaleY(1);
		}
	}

	@media (max-height: 700px) {
		.steer {
			width: 76px;
			height: 76px;
		}
		.boost-wrap {
			bottom: calc(94px + var(--zt-safe-bottom));
		}
		.boost-button {
			width: 74px;
			height: 74px;
		}
	}
</style>
