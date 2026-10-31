<script lang="ts">
	let {
		sound,
		onResume,
		onRestart,
		onHome,
		onSound,
		onTutorial
	}: {
		sound: boolean;
		onResume: () => void;
		onRestart: () => void;
		onHome: () => void;
		onSound: () => void;
		onTutorial: () => void;
	} = $props();
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Paused">
	<div class="card">
		<button class="big resume" onclick={onResume} aria-label="Resume">
			<svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
				<path d="M16 10 L38 24 L16 38 Z" fill="#26313C" />
			</svg>
		</button>

		<div class="row">
			<button class="small" onclick={onRestart} aria-label="Restart race">
				<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
					<path
						d="M32 20a12 12 0 1 1-3.5-8.5"
						fill="none"
						stroke="#26313C"
						stroke-width="4.5"
						stroke-linecap="round"
					/>
					<path
						d="M32 6 V17 H21"
						fill="none"
						stroke="#26313C"
						stroke-width="4.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<button class="small" onclick={onTutorial} aria-label="Tutorial">
				<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
					<circle cx="20" cy="20" r="14" fill="none" stroke="#26313C" stroke-width="4" />
					<path
						d="M16 15a4.5 4.5 0 1 1 6 4.2c-1.2.5-2 1.5-2 2.8v1"
						fill="none"
						stroke="#26313C"
						stroke-width="3.6"
						stroke-linecap="round"
					/>
					<circle cx="20" cy="29" r="2" fill="#26313C" />
				</svg>
			</button>

			<button class="small" onclick={onSound} aria-label={sound ? 'Mute' : 'Unmute'}>
				{#if sound}
					<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
						<path d="M8 16 H14 L21 10 V30 L14 24 H8 Z" fill="#26313C" />
						<path
							d="M26 15a7 7 0 0 1 0 10M30 11a12 12 0 0 1 0 18"
							fill="none"
							stroke="#26313C"
							stroke-width="3.4"
							stroke-linecap="round"
						/>
					</svg>
				{:else}
					<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
						<path d="M8 16 H14 L21 10 V30 L14 24 H8 Z" fill="#26313C" />
						<path
							d="M26 15 L34 25 M34 15 L26 25"
							fill="none"
							stroke="#26313C"
							stroke-width="3.4"
							stroke-linecap="round"
						/>
					</svg>
				{/if}
			</button>

			<button class="small" onclick={onHome} aria-label="Back to garage">
				<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
					<path
						d="M6 19 L20 7 L34 19"
						fill="none"
						stroke="#26313C"
						stroke-width="4.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
					<path
						d="M11 18 V33 H29 V18"
						fill="none"
						stroke="#26313C"
						stroke-width="4.2"
						stroke-linejoin="round"
					/>
					<path d="M17 33 V25 H23 V33" fill="none" stroke="#26313C" stroke-width="3.4" />
				</svg>
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		z-index: 30;
		display: grid;
		place-items: center;
		padding: 24px;
		background: rgb(38 49 60 / 0.52);
		backdrop-filter: blur(4px);
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		width: min(100%, 320px);
		padding: 22px;
		border-radius: 30px;
		background: var(--zt-cream);
		box-shadow:
			0 10px 0 rgb(38 49 60 / 0.24),
			inset 0 0 0 4px var(--zt-white);
		animation: menu-in 380ms var(--zt-ease-boing) both;
	}
	@keyframes menu-in {
		from {
			transform: scale(0.88);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	.resume {
		width: 94px;
		height: 94px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-teal);
		box-shadow:
			0 6px 0 var(--zt-shadow),
			inset 0 -6px 0 rgb(38 49 60 / 0.14);
	}
	.row {
		display: flex;
		gap: 12px;
	}
	.small {
		width: 60px;
		height: 60px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-white);
		box-shadow: 0 4px 0 var(--zt-shadow);
	}
	button:active {
		transform: translateY(4px) scale(0.95);
	}
</style>
