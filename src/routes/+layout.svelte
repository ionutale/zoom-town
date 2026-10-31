<script lang="ts">
	import '@fontsource-variable/fredoka';
	import '#lib/styles/tokens.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>Zoom Town</title>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
	<link rel="icon" href="/icons/icon-32.png" sizes="32x32" type="image/png" />
	<link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
	<link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
	<meta name="format-detection" content="telephone=no" />
	<meta
		name="description"
		content="A sunny toy-town racing game for little drivers. Steer, pop balloons, and boost!"
	/>
	<meta name="theme-color" content="#7EC8F2" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Zoom Town" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{@render children()}
