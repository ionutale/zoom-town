<script lang="ts">
	import type { AvatarId } from '#lib/game/cars';

	let {
		id,
		size = 96,
		color
	}: {
		id: AvatarId;
		size?: number;
		color?: string;
	} = $props();

	const palette: Record<AvatarId, string> = {
		star: '#F7C948',
		flower: '#F06E9C',
		moon: '#3B82D6'
	};
	const fill = $derived(color ?? palette[id]);
</script>

<svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
	{#if id === 'star'}
		<path
			d="M50 7 L62 36 L93 39 L69 59 L77 90 L50 72 L23 90 L31 59 L7 39 L38 36 Z"
			{fill}
			stroke="#26313C"
			stroke-width="4"
			stroke-linejoin="round"
		/>
		<circle cx="41" cy="50" r="2.6" fill="#26313C" />
		<circle cx="59" cy="50" r="2.6" fill="#26313C" />
		<path
			d="M44 57 Q50 63 56 57"
			fill="none"
			stroke="#26313C"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
	{:else if id === 'flower'}
		{#each [0, 60, 120, 180, 240, 300] as angle}
			<ellipse
				cx="50"
				cy="25"
				rx="15"
				ry="20"
				{fill}
				stroke="#26313C"
				stroke-width="3.5"
				transform={`rotate(${angle} 50 50)`}
			/>
		{/each}
		<circle cx="50" cy="50" r="17" fill="#FFF6E3" stroke="#26313C" stroke-width="3.5" />
		<circle cx="44" cy="47" r="2.6" fill="#26313C" />
		<circle cx="56" cy="47" r="2.6" fill="#26313C" />
		<path
			d="M44 55 Q50 60 56 55"
			fill="none"
			stroke="#26313C"
			stroke-width="2.6"
			stroke-linecap="round"
		/>
	{:else}
		<path
			d="M64 10 A42 42 0 1 0 64 90 A34 34 0 1 1 64 10 Z"
			{fill}
			stroke="#26313C"
			stroke-width="4"
			stroke-linejoin="round"
		/>
		<path
			d="M78 24 L82 34 L92 38 L82 42 L78 52 L74 42 L64 38 L74 34 Z"
			fill="#F7C948"
			stroke="#26313C"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
	{/if}
</svg>
