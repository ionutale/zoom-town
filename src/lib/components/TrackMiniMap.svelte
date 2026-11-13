<script lang="ts">
	import type { TrackDef } from '#lib/game/track';

	let { track, size = 42 }: { track: TrackDef; size?: number } = $props();

	// One projection for the outline and the start dot: they used to carry two
	// copies of the same maths and could drift apart.
	const shape = $derived.by(() => {
		const xs = track.points.map(([x]) => x);
		const zs = track.points.map(([, z]) => z);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minZ = Math.min(...zs);
		const maxZ = Math.max(...zs);
		const span = Math.max(maxX - minX, maxZ - minZ) || 1;
		const pad = 4;
		const scale = (48 - pad * 2) / span;
		const offsetX = (48 - (maxX - minX) * scale) / 2;
		const offsetZ = (48 - (maxZ - minZ) * scale) / 2;
		const dots = track.points.map(([x, z]) => ({
			x: pad + offsetX + (x - minX) * scale,
			y: pad + offsetZ + (z - minZ) * scale
		}));
		return { dots, start: dots[0] };
	});

	const path = $derived(
		`M${shape.dots.map((dot) => `${dot.x.toFixed(1)},${dot.y.toFixed(1)}`).join(' L')} Z`
	);
</script>

<svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
	<path
		d={path}
		fill="none"
		stroke="currentColor"
		stroke-width="4.5"
		stroke-linejoin="round"
		stroke-linecap="round"
	/>
	<circle
		cx={shape.start.x}
		cy={shape.start.y}
		r="3.4"
		fill="var(--zt-gold)"
		stroke="var(--zt-ink)"
		stroke-width="1.6"
	/>
</svg>
