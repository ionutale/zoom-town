<script lang="ts">
	import { TRACK_DEFS, type TrackId } from '#lib/game/track';
	import TrackMiniMap from './TrackMiniMap.svelte';

	let {
		selected,
		onPick
	}: {
		selected: TrackId;
		onPick: (id: TrackId) => void;
	} = $props();
</script>

<div class="track-picker" aria-label="Choose a circuit">
	{#each TRACK_DEFS as track (track.id)}
		<button
			class="track"
			class:on={track.id === selected}
			onclick={() => onPick(track.id)}
			aria-label={track.name}
			aria-pressed={track.id === selected}
		>
			<span class="map"><TrackMiniMap {track} size={38} /></span>
			<span class="name">{track.name}</span>
		</button>
	{/each}
</div>

<style>
	.track-picker {
		display: flex;
		align-items: stretch;
		justify-content: center;
		gap: 5px;
		width: 100%;
		padding: 4px 2px;
	}
	.track {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 4px 2px 3px;
		border-radius: 14px;
		background: color-mix(in srgb, var(--zt-cream) 65%, transparent);
		color: var(--zt-ink);
		box-shadow: inset 0 0 0 2px transparent;
		transition:
			transform 140ms var(--zt-ease-boing),
			background 140ms,
			box-shadow 140ms;
	}
	.track.on {
		background: var(--zt-cream);
		box-shadow: inset 0 0 0 2.5px var(--zt-teal);
	}
	.track:active {
		transform: scale(0.95);
	}
	.map {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgb(255 246 227 / 0.42);
		color: var(--zt-ink-soft);
	}
	.track.on .map {
		color: var(--zt-teal);
		background: var(--zt-white);
	}
	.name {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 8.5px;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
</style>
