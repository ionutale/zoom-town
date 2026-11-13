<script lang="ts">
	import { messages } from '#lib/i18n';
	import type { Lang } from '#lib/save';

	let {
		stars,
		size = 34,
		animate = false,
		lang = 'it'
	}: {
		stars: number;
		size?: number;
		animate?: boolean;
		lang?: Lang;
	} = $props();

	const t = $derived(messages(lang));
	const path = 'M50 7 L62 36 L93 39 L69 59 L77 90 L50 72 L23 90 L31 59 L7 39 L38 36 Z';
</script>

<div class="stars" style={`--size:${size}px`} aria-label={t.stars(stars)}>
	{#each [0, 1, 2] as index}
		<svg
			class:filled={index < stars}
			class:pop={animate && index < stars}
			style={`--delay:${index * 120}ms`}
			viewBox="0 0 100 100"
			width={size}
			height={size}
			aria-hidden="true"
		>
			<path
				d={path}
				fill={index < stars ? '#FFC93C' : 'transparent'}
				stroke={index < stars ? '#26313C' : '#FFF6E3'}
				stroke-width={index < stars ? 5 : 7}
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		</svg>
	{/each}
</div>

<style>
	.stars {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: calc(var(--size) * 0.12);
	}
	svg {
		overflow: visible;
	}
	.pop {
		animation: star-pop 420ms var(--zt-ease-boing) both;
		animation-delay: var(--delay);
	}
	@keyframes star-pop {
		0% {
			transform: scale(0.2) rotate(-20deg);
			opacity: 0;
		}
		60% {
			transform: scale(1.18) rotate(4deg);
			opacity: 1;
		}
		100% {
			transform: scale(1) rotate(0);
			opacity: 1;
		}
	}
</style>
