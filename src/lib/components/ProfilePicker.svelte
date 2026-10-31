<script lang="ts">
	import { AVATARS } from '#lib/game/cars';
	import type { SaveData } from '#lib/save';
	import AvatarIcon from './AvatarIcon.svelte';
	import StarRow from './StarRow.svelte';

	let {
		save,
		onPick,
		onSettings
	}: {
		save: SaveData;
		onPick: (slot: number) => void;
		onSettings: () => void;
	} = $props();
</script>

<div class="screen profiles">
	<button class="gear" onclick={onSettings} aria-label="Settings">
		<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
			<path
				d="M16 10.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 3a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
				fill="#26313C"
			/>
			<path
				d="M14.2 4h3.6l.7 3.1 2.4 1.4 3-1 1.8 3.1-2.2 2.3v2.8l2.2 2.3-1.8 3.1-3-1-2.4 1.4-.7 3.1h-3.6l-.7-3.1-2.4-1.4-3 1-1.8-3.1 2.2-2.3v-2.8L6.1 10.6l1.8-3.1 3 1 2.4-1.4Z"
				fill="none"
				stroke="#26313C"
				stroke-width="2.4"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	<header class="brand">
		<div class="sun" aria-hidden="true"></div>
		<h1>ZOOM<br />TOWN</h1>
		<div class="cloud c1" aria-hidden="true"></div>
		<div class="cloud c2" aria-hidden="true"></div>
	</header>

	<div class="slots">
		{#each AVATARS as avatar, index}
			{@const profile = save.profiles[index]}
			<button
				class="slot"
				class:empty={!profile}
				onclick={() => onPick(index)}
				aria-label={`Profile ${index + 1}`}
			>
				<span class="disc" style={`--ring:${avatar.color}`}>
					<AvatarIcon id={avatar.id} size={78} color={profile ? undefined : '#D9D2C2'} />
					{#if !profile}
						<span class="plus" aria-hidden="true">+</span>
					{/if}
				</span>
				{#if profile}
					<StarRow stars={profile.bestStars} size={22} />
				{:else}
					<span class="new-dot" aria-hidden="true"></span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.screen {
		position: absolute;
		inset: 0;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: calc(24px + var(--zt-safe-top)) 22px calc(28px + var(--zt-safe-bottom));
		background:
			linear-gradient(to bottom, rgb(79 179 232 / 0.18), transparent 38%),
			linear-gradient(to top, rgb(38 49 60 / 0.32), transparent 34%);
	}

	.gear {
		position: absolute;
		top: calc(14px + var(--zt-safe-top));
		right: calc(14px + var(--zt-safe-right));
		width: 54px;
		height: 54px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: color-mix(in srgb, var(--zt-cream) 84%, transparent);
		box-shadow: 0 4px 0 var(--zt-shadow);
	}
	.gear:active {
		transform: translateY(3px) scale(0.96);
	}

	.brand {
		position: relative;
		width: min(100%, 360px);
		display: grid;
		place-items: center;
		margin-bottom: 18px;
	}
	.brand h1 {
		position: relative;
		z-index: 2;
		font-size: clamp(58px, 17vw, 86px);
		line-height: 0.82;
		letter-spacing: 0.02em;
		text-align: center;
		color: var(--zt-cream);
		-webkit-text-stroke: 5px var(--zt-ink);
		text-shadow:
			0 7px 0 var(--zt-red),
			0 12px 18px rgb(38 49 60 / 0.28);
		transform: rotate(-3deg);
		paint-order: stroke fill;
	}
	.sun {
		position: absolute;
		top: -26px;
		right: 2px;
		width: 84px;
		height: 84px;
		border-radius: 50%;
		background: var(--zt-gold);
		box-shadow: 0 0 0 10px rgb(247 201 72 / 0.28);
	}
	.cloud {
		position: absolute;
		width: 60px;
		height: 22px;
		border-radius: 20px;
		background: var(--zt-white);
		opacity: 0.9;
	}
	.cloud::before,
	.cloud::after {
		content: '';
		position: absolute;
		bottom: 4px;
		border-radius: 50%;
		background: inherit;
	}
	.cloud::before {
		left: 8px;
		width: 26px;
		height: 26px;
	}
	.cloud::after {
		right: 8px;
		width: 18px;
		height: 18px;
	}
	.c1 {
		left: -12px;
		top: 8px;
		animation: drift 7s ease-in-out infinite alternate;
	}
	.c2 {
		right: -18px;
		bottom: -6px;
		transform: scale(0.7);
		animation: drift 9s ease-in-out infinite alternate-reverse;
	}
	@keyframes drift {
		to {
			transform: translateX(14px);
		}
	}

	.slots {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		width: min(100%, 360px);
	}
	.slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 8px 4px 10px;
		border-radius: 24px;
		background: color-mix(in srgb, var(--zt-cream) 80%, transparent);
		box-shadow:
			0 5px 0 var(--zt-shadow),
			inset 0 0 0 3px color-mix(in srgb, var(--zt-white) 55%, transparent);
		transition:
			transform 160ms var(--zt-ease-boing),
			background 160ms;
	}
	.slot:active {
		transform: scale(0.95);
		background: var(--zt-cream);
	}
	.disc {
		position: relative;
		display: grid;
		place-items: center;
		width: 82px;
		height: 82px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--ring) 18%, var(--zt-white));
		box-shadow: inset 0 0 0 4px var(--ring);
	}
	.empty .disc {
		background: rgb(255 246 227 / 0.42);
		box-shadow: inset 0 0 0 4px rgb(255 246 227 / 0.8);
	}
	.plus {
		position: absolute;
		right: -2px;
		bottom: -2px;
		width: 26px;
		height: 26px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--zt-teal);
		color: var(--zt-white);
		font-size: 22px;
		font-weight: 700;
		line-height: 1;
		box-shadow: 0 0 0 3px var(--zt-white);
	}
	.new-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--zt-teal);
	}

	@media (max-height: 700px) {
		.brand h1 {
			font-size: 54px;
		}
		.disc {
			width: 68px;
			height: 68px;
		}
	}
</style>
