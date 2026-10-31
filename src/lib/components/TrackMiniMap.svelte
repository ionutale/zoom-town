<script lang="ts">
	import type { TrackDef } from '#lib/game/track';

	let { track, size = 42 }: { track: TrackDef; size?: number } = $props();

	const path = $derived.by(() => {
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
		const points = track.points.map(([x, z]) => {
			const px = pad + offsetX + (x - minX) * scale;
			const py = pad + offsetZ + (z - minZ) * scale;
			return `${px.toFixed(1)},${py.toFixed(1)}`;
		});
		return `M${points.join(' L')} Z`;
	});

	const start = $derived.by(() => {
		const [x, z] = track.points[0];
		const xs = track.points.map(([px]) => px);
		const zs = track.points.map(([, pz]) => pz);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minZ = Math.min(...zs);
		const maxZ = Math.max(...zs);
		const span = Math.max(maxX - minX, maxZ - minZ) || 1;
		const pad = 4;
		const scale = (48 - pad * 2) / span;
		const offsetX = (48 - (maxX - minX) * scale) / 2;
		const offsetZ = (48 - (maxZ - minZ) * scale) / 2;
		return {
			x: pad + offsetX + (x - minX) * scale,
			y: pad + offsetZ + (z - minZ) * scale
		};
	});
</script>

<svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
	<path d={path} fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round" />
	<circle cx={start.x} cy={start.y} r="3.4" fill="var(--zt-gold)" stroke="var(--zt-ink)" stroke-width="1.6" />
</svg>
