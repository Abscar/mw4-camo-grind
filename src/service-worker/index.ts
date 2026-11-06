/**
 * Small offline cache (no Workbox): after the first visit, the tracker opens without internet.
 * Build files and the page are cached on install; everything else is network-first with a
 * cache fallback. A new deployment gets a new cache and the old one is removed.
 */

import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

const CACHE = `mw4-camo-grind-${version}`;

/** The site's base path with a trailing slash, e.g. "/" or "/mw4-camo-grind/" on GitHub Pages. */
const BASE = new URL('./', self.location.href).pathname;
/** Manifest paths are relative to the base path. */
const abs = (path: string) => BASE + path.replace(/^\//, '');

const PRECACHE = [...immutable, ...assets, ...prerendered].map((f) => abs(f.path));
/** Served cache-first (hashed file names never change). */
const PRECACHED = new Set(PRECACHE);
/**
 * SvelteKit checks this file for new deployments when the tab regains focus. Cache it too
 * (but keep it network-first), so that check gets an answer instead of an error when offline.
 */
const VERSION_FILE = abs('_app/version.json');

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...PRECACHE, VERSION_FILE]))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
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

			// Hashed build files never change: serve them straight from the cache.
			if (PRECACHED.has(url.pathname) && !request.headers.get('accept')?.includes('text/html')) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			try {
				const response = await fetch(request);
				if (response.ok && response.type === 'basic') void cache.put(request, response.clone());
				return response;
			} catch (error) {
				// Offline: fall back to the cache. Pages ignore "?…" and "#…" so a progress link still opens.
				const hit =
					(await cache.match(request, { ignoreSearch: true })) ??
					(request.mode === 'navigate' ? await cache.match(BASE) : undefined);
				if (hit) return hit;
				throw error;
			}
		})()
	);
});
