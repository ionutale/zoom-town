<script lang="ts">
	import { messages } from '#lib/i18n';
	import type { Lang } from '#lib/save';

	let {
		lang,
		onOpen,
		onDismiss
	}: {
		lang: Lang;
		onOpen: () => void;
		onDismiss: () => void;
	} = $props();

	const t = $derived(messages(lang));
</script>

<div class="banner">
	<button class="open" onclick={onOpen}>
		<span class="icon" aria-hidden="true">
			<svg viewBox="0 0 40 40" width="34" height="34">
				<rect
					x="8"
					y="4"
					width="24"
					height="32"
					rx="6"
					fill="#FFF6E3"
					stroke="#26313C"
					stroke-width="2.4"
				/>
				<path d="M14 26 H26" stroke="#7CC242" stroke-width="3" stroke-linecap="round" />
				<path
					d="M14 31 H22"
					stroke="#7CC242"
					stroke-width="3"
					stroke-linecap="round"
					opacity="0.6"
				/>
				<path
					d="M20 9 V19 M16 13 L20 9 L24 13"
					fill="none"
					stroke="#26313C"
					stroke-width="2.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</span>
		<span>{t.installTitle}</span>
	</button>
	<button class="x" onclick={onDismiss} aria-label={t.dismiss}>
		<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
			<path d="M6 6 L18 18 M18 6 L6 18" stroke="#26313C" stroke-width="3" stroke-linecap="round" />
		</svg>
	</button>
</div>

<style>
	.banner {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: calc(20px + var(--zt-safe-bottom));
		z-index: 12;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 8px 7px 10px;
		border-radius: 22px;
		background: color-mix(in srgb, var(--zt-cream) 94%, transparent);
		box-shadow:
			0 5px 0 var(--zt-shadow),
			inset 0 0 0 2px var(--zt-white);
	}
	.open {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 48px;
		font-size: 18px;
		font-weight: 600;
		text-align: left;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 12px;
		background: var(--zt-sky);
	}
	.x {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-white);
	}
	button:active {
		transform: scale(0.97);
	}
</style>
