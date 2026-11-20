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

/**
 * What install downloads (2026-11-20, less data and battery on phones): the code and the page, not the
 * pictures (the banners, the old Hot Rod tile, the app icons ≈ 3 MB): a picture is cached the first time
 * the page shows it, like everything else. A new deployment reuses every hashed file the previous one
 * already has (same name = same file), so after one of the many deploys a phone only downloads what changed
 * (it used to fetch all ≈ 6 MB again after every deploy, and the news deploys run hourly).
 */
const PICTURE = /\.(webp|png|jpe?g|gif|avif)$/i;
const PRECACHE = [...immutable, ...assets, ...prerendered]
	.map((f) => abs(f.path))
	.filter((path) => !PICTURE.test(path));
/** The COD headlines change every hour: always asked for fresh (the cached copy is the offline fallback). */
const NEWS_FILE = abs('news.json');
/** Served cache-first (hashed file names never change). */
const PRECACHED = new Set(PRECACHE.filter((path) => path !== NEWS_FILE));
/** Hashed build files: the same name is the same file, in any deployment. */
const IMMUTABLE_DIR = abs('_app/immutable/');
/**
 * SvelteKit checks this file for new deployments when the tab regains focus. Cache it too
 * (but keep it network-first), so that check gets an answer instead of an error when offline.
 */
const VERSION_FILE = abs('_app/version.json');

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			const older = await Promise.all(
				(await caches.keys()).filter((key) => key !== CACHE).map((key) => caches.open(key))
			);
			// hashed files (and pictures seen before) the last deployment already has: copy, don't download
			const missing: string[] = [];
			await Promise.all(
				PRECACHE.map(async (path) => {
					if (path.startsWith(IMMUTABLE_DIR)) {
						for (const old of older) {
							const hit = await old.match(path);
							if (hit) return cache.put(path, hit);
						}
					}
					missing.push(path);
				})
			);
			for (const old of older) {
				for (const request of await old.keys()) {
					const path = new URL(request.url).pathname;
					if (path.startsWith(IMMUTABLE_DIR) && PICTURE.test(path)) {
						const hit = await old.match(request);
						if (hit) await cache.put(path, hit);
					}
				}
			}
			await cache.addAll([...missing, VERSION_FILE]);
			await self.skipWaiting();
		})()
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

			// Hashed build files never change: serve them straight from the cache (pictures too, once
			// they've been shown).
			if ((PRECACHED.has(url.pathname) || url.pathname.startsWith(IMMUTABLE_DIR)) && !request.headers.get('accept')?.includes('text/html')) {
				const hit = await cache.match(url.pathname);
				if (hit) return hit;
			}

			try {
				// Pages always ask the server for the current version: GitHub Pages lets browsers reuse a
				// page for 10 minutes, and that copy can point at build files a newer deployment deleted.
				const page = request.mode === 'navigate';
				const response = page
					? await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' })
					: await fetch(request);
				// a navigation must not get a followed redirect back: hand the browser the redirect instead
				if (page && response.redirected) return Response.redirect(response.url, 302);
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
