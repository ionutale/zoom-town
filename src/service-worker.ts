import { self } from '$app/service-worker';
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';

// Minimal service-worker typings. The app's tsconfig uses the DOM lib, which
// does not ship FetchEvent/ExtendableEvent, so the scope is described here.
interface ExtendableLike {
	waitUntil(promise: Promise<unknown>): void;
}
interface FetchLike extends ExtendableLike {
	request: Request;
	respondWith(response: Promise<Response>): void;
}
interface MessageLike {
	data: unknown;
}
interface ServiceWorkerScope {
	addEventListener(type: 'install' | 'activate', handler: (event: ExtendableLike) => void): void;
	addEventListener(type: 'fetch', handler: (event: FetchLike) => void): void;
	addEventListener(type: 'message', handler: (event: MessageLike) => void): void;
	skipWaiting(): Promise<void>;
	clients: { claim(): Promise<void> };
	location: { origin: string };
}

const scope = self as unknown as ServiceWorkerScope;

// One cache per build: a new deployment always starts from a clean slate, so a
// stale shell can never reference chunks that no longer exist.
const CACHE = `zoom-town-${version}`;
const NAVIGATION_TIMEOUT = 3000;

function toUrl(path: string): string {
	return `/${String(path).replace(/^\/+/, '')}`;
}

const PRECACHE = [
	'/',
	...immutable.map(({ path }) => toUrl(path)),
	...assets.map(({ path }) => toUrl(path))
];

scope.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			// Add entries individually: one missing file must not abort the whole
			// install and leave the app with no service worker at all.
			await Promise.allSettled(
				PRECACHE.map(async (url) => {
					const response = await fetch(url, { cache: 'reload' });
					if (response.ok) await cache.put(url, response);
				})
			);
			await scope.skipWaiting();
		})()
	);
});

scope.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
			await scope.clients.claim();
		})()
	);
});

scope.addEventListener('message', (event) => {
	if (event.data === 'SKIP_WAITING') void scope.skipWaiting();
});

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
	]);
}

async function navigationResponse(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	try {
		// Always ask the network first for the document: an installed app must
		// pick up new chunk names as soon as it is online.
		const response = await withTimeout(fetch(request), NAVIGATION_TIMEOUT);
		if (response.ok) {
			void cache.put('/', response.clone());
			return response;
		}
	} catch {
		// Offline or slow network: fall through to the cached shell.
	}
	const cached =
		(await cache.match(request, { ignoreSearch: true })) ?? (await cache.match('/'));
	return cached ?? Response.error();
}

async function assetResponse(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const hit = await cache.match(request);
	if (hit) return hit;
	try {
		const response = await fetch(request);
		// Never store an HTML SPA fallback under a script or style URL: that is
		// exactly the failure that turns a missing chunk into a black screen.
		if (response.ok && !response.headers.get('content-type')?.includes('text/html')) {
			void cache.put(request, response.clone());
		}
		return response;
	} catch {
		return (await cache.match(request, { ignoreSearch: true })) ?? Response.error();
	}
}

scope.addEventListener('fetch', (event) => {
	const request = event.request;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== scope.location.origin) return;

	// Range requests (audio) must go straight to the network; caching partial
	// responses breaks playback on iOS.
	if (request.headers.has('range')) return;

	if (request.mode === 'navigate') {
		event.respondWith(navigationResponse(request));
	} else {
		event.respondWith(assetResponse(request));
	}
});

export {};
