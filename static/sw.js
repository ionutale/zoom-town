const CACHE = 'zoom-town-v2';
const SHELL = [
	'/',
	'/manifest.webmanifest',
	'/favicon.ico',
	'/icons/icon-192.png',
	'/icons/icon-512.png',
	'/icons/apple-touch-icon.png'
];

async function cacheAudio(cache) {
	try {
		const response = await fetch('/audio/manifest.json');
		if (!response.ok) return;
		const manifest = await response.json();
		const paths = [];
		for (const languages of Object.values(manifest.voice ?? {})) {
			for (const file of Object.values(languages)) paths.push(`/audio/${file}`);
		}
		for (const file of Object.values(manifest.sfx ?? {})) paths.push(`/audio/${file}`);
		for (const file of Object.values(manifest.music ?? {})) paths.push(`/audio/${file}`);
		if (paths.length) await cache.addAll(paths);
	} catch {
		// Audio is optional at install; the fetch handler fills the cache later.
	}
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			await cache.addAll(SHELL);
			await cacheAudio(cache);
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const hit = await cache.match(request, { ignoreSearch: true });
			if (hit) return hit;
			try {
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			} catch {
				if (request.mode === 'navigate') {
					const shell = await cache.match('/');
					if (shell) return shell;
				}
				throw new Error('offline');
			}
		})()
	);
});
