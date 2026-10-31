// Legacy cleanup worker.
//
// Versions up to service worker v9 were served from /sw.js and cached HTML
// with a cache-first strategy. Installed apps still register this path, so it
// stays as a one-job bridge: clear every old cache, then reload each window.
// The reloaded page registers the real worker at /service-worker.js.
self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.map((key) => caches.delete(key)));
			await self.clients.claim();
			const windows = await self.clients.matchAll({ type: 'window' });
			await Promise.all(
				windows.map((client) => client.navigate(client.url).catch(() => undefined))
			);
			const registration = self.registration;
			if (registration && typeof registration.unregister === 'function') {
				await registration.unregister().catch(() => undefined);
			}
		})()
	);
});

self.addEventListener('fetch', () => {
	// No interception: the page must reach the network for a fresh build.
});
