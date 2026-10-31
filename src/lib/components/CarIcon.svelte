<script lang="ts">
	import type { CarSpec } from '#lib/game/cars';

	let { car, size = 128 }: { car: CarSpec; size?: number } = $props();
</script>

<svg viewBox="0 0 120 90" width={size} height={(size * 90) / 120} aria-hidden="true">
	<ellipse cx="60" cy="78" rx="44" ry="7" fill="rgba(38,49,60,0.18)" />

	{#if car.ears === 'round'}
		<circle cx="43" cy="20" r="9" fill={car.fur} stroke="#26313C" stroke-width="3" />
		<circle cx="77" cy="20" r="9" fill={car.fur} stroke="#26313C" stroke-width="3" />
	{:else if car.ears === 'long'}
		<ellipse cx="43" cy="12" rx="6" ry="16" fill={car.fur} stroke="#26313C" stroke-width="3" />
		<ellipse cx="77" cy="12" rx="6" ry="16" fill={car.fur} stroke="#26313C" stroke-width="3" />
	{:else if car.ears === 'pointed'}
		<path
			d="M36 26 L42 7 L49 24 Z"
			fill={car.fur}
			stroke="#26313C"
			stroke-width="3"
			stroke-linejoin="round"
		/>
		<path
			d="M71 24 L78 7 L84 26 Z"
			fill={car.fur}
			stroke="#26313C"
			stroke-width="3"
			stroke-linejoin="round"
		/>
	{:else}
		<path
			d="M38 24 L42 9 L49 22 Z"
			fill={car.fur}
			stroke="#26313C"
			stroke-width="3"
			stroke-linejoin="round"
		/>
		<path
			d="M71 22 L78 9 L82 24 Z"
			fill={car.fur}
			stroke="#26313C"
			stroke-width="3"
			stroke-linejoin="round"
		/>
	{/if}

	<rect
		x="36"
		y="24"
		width="48"
		height="28"
		rx="10"
		fill="#FFF6E3"
		stroke="#26313C"
		stroke-width="3"
	/>
	<rect x="42" y="29" width="36" height="14" rx="6" fill="#26313C" opacity="0.82" />

	<rect
		x="14"
		y="42"
		width="92"
		height="28"
		rx="13"
		fill={car.color}
		stroke="#26313C"
		stroke-width="3"
	/>
	<rect x="20" y="48" width="30" height="9" rx="4.5" fill="#FFF6E3" opacity="0.35" />
	<circle cx="38" cy="72" r="11" fill="#26313C" />
	<circle cx="38" cy="72" r="4.5" fill="#FFF6E3" />
	<circle cx="82" cy="72" r="11" fill="#26313C" />
	<circle cx="82" cy="72" r="4.5" fill="#FFF6E3" />

	<ellipse cx="101" cy="55" rx="5" ry="4" fill="#FFF6E3" />
	<rect x="12" y="54" width="6" height="7" rx="2" fill="#E8433F" />

	<circle cx="51" cy="39" r="2.4" fill="#26313C" />
	<circle cx="69" cy="39" r="2.4" fill="#26313C" />
	<path
		d="M55 45 Q60 49 65 45"
		fill="none"
		stroke="#26313C"
		stroke-width="2.2"
		stroke-linecap="round"
	/>

	{#if car.tail}
		<path
			d="M13 47 Q2 39 7 55 Q10 62 18 56 Z"
			fill={car.fur}
			stroke="#26313C"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
	{/if}
</svg>
