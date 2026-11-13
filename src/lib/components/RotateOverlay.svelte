<script lang="ts">
	import { messages } from '#lib/i18n';
	import type { Lang } from '#lib/save';

	let { lang }: { lang: Lang } = $props();

	const t = $derived(messages(lang));
</script>

<div class="rotate">
	<div class="phone" aria-hidden="true">
		<span class="screen"></span>
		<span class="button"></span>
	</div>
	<p>{t.rotate}</p>
</div>

<style>
	.rotate {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 26px;
		background:
			radial-gradient(circle at 50% 30%, rgb(255 246 227 / 0.28), transparent 46%), var(--zt-sky);
		color: var(--zt-ink);
		text-align: center;
		padding: 24px;
	}
	.phone {
		position: relative;
		width: 92px;
		height: 160px;
		border-radius: 18px;
		background: var(--zt-ink);
		box-shadow: 0 8px 0 rgb(38 49 60 / 0.24);
		animation: turn 2.4s var(--zt-ease-boing) infinite;
	}
	.screen {
		position: absolute;
		inset: 7px;
		border-radius: 12px;
		background: linear-gradient(to bottom, var(--zt-sky), var(--zt-grass));
	}
	.button {
		position: absolute;
		left: 50%;
		bottom: 3px;
		width: 26px;
		height: 3px;
		border-radius: 2px;
		background: rgb(255 246 227 / 0.5);
		transform: translateX(-50%);
	}
	@keyframes turn {
		0%,
		15% {
			transform: rotate(90deg) scale(0.82);
		}
		45%,
		100% {
			transform: rotate(0) scale(1);
		}
	}
	p {
		font-size: 24px;
		font-weight: 600;
		max-width: 260px;
	}
</style>
