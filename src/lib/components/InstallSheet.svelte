<script lang="ts">
	import { messages } from '#lib/i18n';
	import type { Lang } from '#lib/save';
	import { modal } from './modal';

	let {
		lang,
		safari,
		onClose,
		onDismiss
	}: {
		lang: Lang;
		safari: boolean;
		onClose: () => void;
		onDismiss: () => void;
	} = $props();

	const t = $derived(messages(lang));
</script>

<div
	class="overlay"
	role="dialog"
	aria-modal="true"
	aria-label={t.installTitle}
	use:modal={{ onEscape: onClose }}
>
	<div class="card">
		<button class="close" onclick={onClose} aria-label={t.close}>
			<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
				<path
					d="M8 8 L24 24 M24 8 L8 24"
					stroke="#26313C"
					stroke-width="4"
					stroke-linecap="round"
				/>
			</svg>
		</button>

		<div class="hero" aria-hidden="true">
			<svg viewBox="0 0 120 120" width="104" height="104">
				<rect x="31" y="10" width="58" height="100" rx="14" fill="#26313C" />
				<rect x="36" y="18" width="48" height="82" rx="9" fill="#7EC8F2" />
				<rect x="45" y="26" width="30" height="24" rx="6" fill="#FFF6E3" />
				<path d="M52 34 H68 M52 41 H62" stroke="#7CC242" stroke-width="4" stroke-linecap="round" />
				<path
					d="M60 57 V72 M54 63 L60 57 L66 63"
					fill="none"
					stroke="#26313C"
					stroke-width="4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				<rect x="48" y="79" width="24" height="8" rx="4" fill="#FFF6E3" />
			</svg>
		</div>

		<h2>{t.installTitle}</h2>
		<p class="lead">{t.installOffline}</p>

		{#if !safari}
			<p class="warning">
				<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
					<circle cx="16" cy="16" r="13" fill="#F7C948" stroke="#26313C" stroke-width="2.5" />
					<path
						d="M11 16 Q16 10 21 16"
						fill="none"
						stroke="#26313C"
						stroke-width="2.5"
						stroke-linecap="round"
					/>
					<path
						d="M11 21 Q16 15 21 21"
						fill="none"
						stroke="#26313C"
						stroke-width="2.5"
						stroke-linecap="round"
					/>
					<path d="M16 16 L20 12" stroke="#26313C" stroke-width="2.5" stroke-linecap="round" />
				</svg>
				<span>{t.installNotSafari}</span>
			</p>
		{/if}

		<ol>
			<li>
				<span class="step-icon" aria-hidden="true">
					<svg viewBox="0 0 40 40" width="34" height="34">
						<rect
							x="8"
							y="10"
							width="20"
							height="24"
							rx="5"
							fill="#FFF6E3"
							stroke="#26313C"
							stroke-width="2.4"
						/>
						<path
							d="M20 4 V18 M15 9 L20 4 L25 9"
							fill="none"
							stroke="#26313C"
							stroke-width="3"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<span>{t.installStep1}</span>
			</li>
			<li>
				<span class="step-icon" aria-hidden="true">
					<svg viewBox="0 0 40 40" width="34" height="34">
						<rect
							x="8"
							y="8"
							width="24"
							height="24"
							rx="6"
							fill="#FFF6E3"
							stroke="#26313C"
							stroke-width="2.4"
						/>
						<path
							d="M20 14 V26 M14 20 H26"
							stroke="#2FB8A6"
							stroke-width="4"
							stroke-linecap="round"
						/>
					</svg>
				</span>
				<span>{t.installStep2}</span>
			</li>
			<li>
				<span class="step-icon" aria-hidden="true">
					<svg viewBox="0 0 40 40" width="34" height="34">
						<rect
							x="7"
							y="15"
							width="26"
							height="16"
							rx="8"
							fill="#2FB8A6"
							stroke="#26313C"
							stroke-width="2.4"
						/>
						<path
							d="M15 23 L19 27 L26 18"
							fill="none"
							stroke="#FFF6E3"
							stroke-width="3.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</span>
				<span>{t.installStep3}</span>
			</li>
		</ol>

		<div class="actions">
			<button class="done" onclick={onClose}>{t.installDone}</button>
			<button class="never" onclick={onDismiss}>{t.installNever}</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 18px;
		background: rgb(38 49 60 / 0.54);
		backdrop-filter: blur(4px);
	}
	.card {
		position: relative;
		width: min(100%, 340px);
		padding: 18px 20px 18px;
		border-radius: 30px;
		background: var(--zt-cream);
		box-shadow:
			0 9px 0 rgb(38 49 60 / 0.24),
			inset 0 0 0 4px var(--zt-white);
		animation: sheet-in 380ms var(--zt-ease-boing) both;
	}
	@keyframes sheet-in {
		from {
			transform: translateY(18px) scale(0.92);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}
	.close {
		position: absolute;
		top: -10px;
		right: -6px;
		width: 42px;
		height: 42px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-white);
		box-shadow: 0 3px 0 var(--zt-shadow);
	}
	.hero {
		display: grid;
		place-items: center;
		margin: -4px 0 2px;
	}
	h2 {
		text-align: center;
		font-size: 25px;
		line-height: 1.1;
		color: var(--zt-ink);
	}
	.lead {
		margin: 6px 0 12px;
		text-align: center;
		font-size: 16px;
		line-height: 1.25;
		color: var(--zt-ink-soft);
	}
	.warning {
		display: flex;
		align-items: center;
		gap: 8px;
		margin: 0 0 12px;
		padding: 8px 10px;
		border-radius: 12px;
		background: color-mix(in srgb, var(--zt-yellow) 40%, var(--zt-white));
		font-size: 14px;
		line-height: 1.25;
	}
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 9px;
		counter-reset: steps;
	}
	li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 16px;
		font-weight: 500;
		line-height: 1.2;
		counter-increment: steps;
	}
	.step-icon {
		flex: 0 0 38px;
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 12px;
		background: var(--zt-white);
		box-shadow: 0 2px 0 var(--zt-shadow);
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 16px;
	}
	.done {
		height: 54px;
		border-radius: 18px;
		background: var(--zt-teal);
		color: var(--zt-cream);
		font-size: 20px;
		font-weight: 700;
		box-shadow: 0 4px 0 var(--zt-shadow);
	}
	.never {
		height: 42px;
		border-radius: 14px;
		color: var(--zt-ink-soft);
		font-size: 15px;
	}
	button:active {
		transform: translateY(3px) scale(0.98);
	}
</style>
