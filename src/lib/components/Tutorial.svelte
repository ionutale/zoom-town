<script lang="ts">
	import type { Lang } from '#lib/save';

	let {
		lang,
		advanced = false,
		onDone,
		onStep
	}: {
		lang: Lang;
		advanced?: boolean;
		onDone: (skipped: boolean) => void;
		onStep?: (index: number) => void;
	} = $props();

	let step = $state(0);

	const lines: Record<Lang, string[]> = {
		it: [
			'Tieni premuto a sinistra o a destra per sterzare.',
			'Tocca il pulsante grande per il turbo.',
			'Raccogli i palloncini per guadagnare stelle.'
		],
		en: [
			'Hold left or right to steer.',
			'Tap the big button to boost.',
			'Collect balloons to earn stars.'
		]
	};

	$effect(() => {
		onStep?.(step);
	});

	function next() {
		if (step < 2) {
			step++;
		} else {
			finish(false);
		}
	}

	function finish(skipped: boolean) {
		onDone(skipped);
	}

	const dragLines: Record<Lang, string> = {
		it: 'Trascina il dito a sinistra o a destra per sterzare.',
		en: 'Drag your finger left or right to steer.'
	};

	const caption = $derived(advanced && step === 0 ? dragLines[lang] : lines[lang][step]);
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Tutorial">
	<div class="card">
		<button class="skip" onclick={() => finish(true)} aria-label="Skip tutorial">
			<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
				<path
					d="M8 8 L24 24 M24 8 L8 24"
					stroke="#26313C"
					stroke-width="4"
					stroke-linecap="round"
				/>
			</svg>
		</button>

		<div class="stage">
			{#if step === 0 && advanced}
				<div class="drag-demo">
					<div class="drag-bar">
						<span class="drag-finger" aria-hidden="true"></span>
					</div>
					<div class="drag-arrows" aria-hidden="true">
						<svg viewBox="0 0 48 48" width="30" height="30">
							<path
								d="M30 10 L14 24 L30 38"
								fill="none"
								stroke="#26313C"
								stroke-width="6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<svg viewBox="0 0 48 48" width="30" height="30">
							<path
								d="M18 10 L34 24 L18 38"
								fill="none"
								stroke="#26313C"
								stroke-width="6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</div>
			{:else if step === 0}
				<div class="steer-demo">
					<div class="ghost-button left">
						<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
							<path
								d="M30 10 L14 24 L30 38"
								fill="none"
								stroke="#26313C"
								stroke-width="7"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<span class="thumb" aria-hidden="true"></span>
					</div>
					<div class="ghost-button">
						<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
							<path
								d="M18 10 L34 24 L18 38"
								fill="none"
								stroke="#26313C"
								stroke-width="7"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</div>
			{:else if step === 1}
				<div class="boost-demo">
					<div class="mini-balloon" aria-hidden="true">
						<svg viewBox="0 0 24 30" width="30" height="38">
							<ellipse
								cx="12"
								cy="12"
								rx="9"
								ry="11"
								fill="#E8433F"
								stroke="#26313C"
								stroke-width="2"
							/>
							<path d="M10 23 L12 27 L14 23" fill="#FFF6E3" stroke="#26313C" stroke-width="1.5" />
						</svg>
					</div>
					<div class="flow" aria-hidden="true">→</div>
					<div class="mini-meter"><span></span></div>
					<div class="flow" aria-hidden="true">→</div>
					<div class="ghost-boost">
						<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
							<path d="M26 5 L12 27 H23 L21 43 L36 20 H25 Z" fill="#26313C" />
						</svg>
						<span class="thumb" aria-hidden="true"></span>
					</div>
				</div>
			{:else}
				<div class="star-demo">
					{#each [0, 1, 2] as i}
						<span class="balloon" style={`--i:${i}`} aria-hidden="true"></span>
						<svg
							class="demo-star"
							style={`--i:${i}`}
							viewBox="0 0 100 100"
							width="46"
							height="46"
							aria-hidden="true"
						>
							<path
								d="M50 7 L62 36 L93 39 L69 59 L77 90 L50 72 L23 90 L31 59 L7 39 L38 36 Z"
								fill="#FFC93C"
								stroke="#26313C"
								stroke-width="5"
								stroke-linejoin="round"
							/>
						</svg>
					{/each}
				</div>
			{/if}
		</div>

		<p class="caption">{caption}</p>

		<div class="footer">
			<div class="dots" aria-hidden="true">
				{#each [0, 1, 2] as dot}
					<span class:on={dot <= step}></span>
				{/each}
			</div>
			<button class="next" onclick={next} aria-label={step < 2 ? 'Next' : 'Start racing'}>
				{#if step < 2}
					<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
						<path
							d="M15 8 L28 20 L15 32"
							fill="none"
							stroke="#26313C"
							stroke-width="6"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{:else}
					<svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
						<path d="M16 10 L38 24 L16 38 Z" fill="#26313C" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.drag-demo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 22px;
	}
	.drag-bar {
		position: relative;
		width: 210px;
		height: 62px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--zt-ink) 12%, transparent);
	}
	.drag-finger {
		position: absolute;
		top: 8px;
		left: 50%;
		width: 58px;
		height: 46px;
		margin-left: -29px;
		border-radius: 999px;
		background: var(--zt-teal);
		box-shadow: inset 0 0 0 3px var(--zt-ink);
		animation: drag-slide 2.6s var(--zt-ease-boing) infinite;
	}
	@keyframes drag-slide {
		0%,
		100% {
			transform: translateX(-56px);
		}
		50% {
			transform: translateX(56px);
		}
	}
	.drag-arrows {
		display: flex;
		gap: 96px;
		opacity: 0.6;
	}

	.overlay {
		position: absolute;
		inset: 0;
		z-index: 35;
		display: grid;
		place-items: center;
		padding: 18px;
		background: rgb(38 49 60 / 0.5);
		backdrop-filter: blur(3px);
	}
	.card {
		position: relative;
		width: min(100%, 340px);
		padding: 22px 20px 18px;
		border-radius: 30px;
		background: var(--zt-cream);
		box-shadow:
			0 9px 0 rgb(38 49 60 / 0.24),
			inset 0 0 0 4px var(--zt-white);
	}
	.skip {
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
	.stage {
		display: grid;
		place-items: center;
		min-height: 190px;
	}
	.steer-demo {
		display: flex;
		gap: 26px;
	}
	.ghost-button {
		position: relative;
		width: 88px;
		height: 88px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-yellow);
		box-shadow: 0 5px 0 var(--zt-shadow);
	}
	.ghost-button.left {
		animation: press 1.8s ease-in-out infinite;
	}
	.thumb {
		position: absolute;
		right: -2px;
		bottom: -2px;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: #f2b28b;
		box-shadow: inset 0 -3px 0 rgb(38 49 60 / 0.18);
	}
	@keyframes press {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(4px) scale(0.96);
		}
	}
	.boost-demo {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.mini-balloon {
		animation: bob 1.8s ease-in-out infinite;
	}
	@keyframes bob {
		50% {
			transform: translateY(-7px);
		}
	}
	.flow {
		font-size: 30px;
		font-weight: 700;
		color: var(--zt-ink-soft);
	}
	.mini-meter {
		width: 26px;
		height: 76px;
		border-radius: 13px;
		background: rgb(38 49 60 / 0.14);
		padding: 4px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.mini-meter span {
		display: block;
		height: 34%;
		border-radius: 9px;
		background: var(--zt-teal);
		animation: fill 2.4s ease-in-out infinite;
	}
	@keyframes fill {
		0%,
		100% {
			height: 34%;
		}
		50% {
			height: 100%;
		}
	}
	.ghost-boost {
		position: relative;
		width: 82px;
		height: 82px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-teal);
		box-shadow: 0 5px 0 var(--zt-shadow);
		animation: boost-pulse 1.8s ease-in-out infinite;
	}
	@keyframes boost-pulse {
		50% {
			transform: scale(1.06);
			box-shadow:
				0 0 0 8px rgb(47 184 166 / 0.25),
				0 5px 0 var(--zt-shadow);
		}
	}
	.star-demo {
		position: relative;
		width: 260px;
		height: 170px;
	}
	.balloon,
	.demo-star {
		position: absolute;
		left: calc(50% + (var(--i) - 1) * 70px);
		top: 50%;
		transform: translate(-50%, -50%);
	}
	.balloon {
		width: 34px;
		height: 44px;
		border-radius: 50% 50% 46% 46%;
		background: var(--zt-red);
		box-shadow: inset -6px -6px 0 rgb(38 49 60 / 0.12);
		animation: balloon-pop 2.4s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.18s);
	}
	.demo-star {
		opacity: 0;
		animation: star-pop 2.4s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.18s + 0.35s);
	}
	@keyframes balloon-pop {
		0%,
		40% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		55%,
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(1.4);
		}
	}
	@keyframes star-pop {
		0%,
		45% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.2);
		}
		65%,
		100% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
	.caption {
		margin: 8px auto 16px;
		max-width: 270px;
		text-align: center;
		font-size: 20px;
		line-height: 1.2;
		font-weight: 600;
	}
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.dots {
		display: flex;
		gap: 7px;
	}
	.dots span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: rgb(38 49 60 / 0.16);
	}
	.dots span.on {
		background: var(--zt-teal);
	}
	.next {
		width: 62px;
		height: 62px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-yellow);
		box-shadow: 0 4px 0 var(--zt-shadow);
	}
	.next:active {
		transform: translateY(3px) scale(0.96);
	}
</style>
