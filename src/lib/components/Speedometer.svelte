<script lang="ts">
	import { messages } from '#lib/i18n';
	import type { Lang } from '#lib/save';

	let {
		speed,
		boosting = false,
		max = 60,
		lang = 'it'
	}: {
		speed: number;
		boosting?: boolean;
		max?: number;
		lang?: Lang;
	} = $props();

	const t = $derived(messages(lang));
	const clamped = $derived(Math.max(0, Math.min(max, speed)));
	const ratio = $derived(clamped / max);
	const angle = $derived(-90 + ratio * 180);
	const display = $derived(Math.round(clamped));

	const ticks = [0, 0.25, 0.5, 0.75, 1];
</script>

<div class="speedo" class:boosting aria-label={t.speed(display)} role="img">
	<svg viewBox="0 0 100 76" aria-hidden="true">
		<path
			d="M 12 62 A 38 38 0 0 1 88 62"
			fill="none"
			stroke="#26313C"
			stroke-opacity="0.16"
			stroke-width="9"
			stroke-linecap="round"
		/>
		<path
			d="M 12 62 A 38 38 0 0 1 88 62"
			fill="none"
			stroke="#2FB8A6"
			stroke-width="6"
			stroke-linecap="round"
			stroke-dasharray={`${ratio * 119.4} 149`}
		/>

		{#each ticks as tick}
			{@const needleAngle = -90 + tick * 180}
			<line
				x1="50"
				y1="62"
				x2="50"
				y2="20"
				stroke="#26313C"
				stroke-opacity={tick === 0 || tick === 1 ? 0.7 : 0.35}
				stroke-width={tick === 0 || tick === 1 ? 2.4 : 1.4}
				stroke-linecap="round"
				transform={`rotate(${needleAngle} 50 62)`}
				stroke-dasharray="0 34 3 100"
			/>
		{/each}

		<g transform={`rotate(${angle} 50 62)`}>
			<line
				x1="50"
				y1="62"
				x2="50"
				y2="26"
				stroke="#E8433F"
				stroke-width="3.6"
				stroke-linecap="round"
			/>
			<circle cx="50" cy="62" r="5" fill="#26313C" />
			<circle cx="50" cy="62" r="2.2" fill="#FFF6E3" />
		</g>

		<text
			x="50"
			y="50"
			text-anchor="middle"
			fill="#26313C"
			font-size="21"
			font-weight="700"
			font-family="Fredoka Variable, system-ui, sans-serif"
		>
			{display}
		</text>
		<text
			x="50"
			y="63"
			text-anchor="middle"
			fill="#5B6B78"
			font-size="8.5"
			font-weight="600"
			letter-spacing="1.2"
			font-family="Fredoka Variable, system-ui, sans-serif"
		>
			KM/H
		</text>
	</svg>
</div>

<style>
	.speedo {
		position: absolute;
		right: calc(16px + var(--zt-safe-right));
		bottom: calc(118px + var(--zt-safe-bottom));
		width: 104px;
		height: 82px;
		padding: 3px 3px 0;
		border-radius: 18px;
		background: color-mix(in srgb, var(--zt-cream) 82%, transparent);
		box-shadow:
			0 4px 0 var(--zt-shadow),
			inset 0 0 0 2px color-mix(in srgb, var(--zt-white) 55%, transparent);
		pointer-events: none;
		transition:
			transform 180ms var(--zt-ease-boing),
			box-shadow 180ms var(--zt-ease-boing);
	}
	.speedo.boosting {
		transform: scale(1.06);
		box-shadow:
			0 0 0 5px color-mix(in srgb, var(--zt-teal) 30%, transparent),
			0 4px 0 var(--zt-shadow),
			inset 0 0 0 2px var(--zt-white);
	}
	svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	@media (max-width: 360px) {
		.speedo {
			right: calc(10px + var(--zt-safe-right));
			bottom: calc(108px + var(--zt-safe-bottom));
			width: 88px;
			height: 72px;
		}
	}
</style>
