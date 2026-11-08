/**
 * MW4 Camo Grind sync service: a tiny Cloudflare Worker that keeps one person's ticks in step
 * between their devices. No accounts: each "sync code" (a long random code that only lives in
 * the user's sync link) owns one small document. Whoever has the link can read and write it.
 *
 * Storage is a Durable Object per sync code (SQLite-backed, on Cloudflare's free plan): reads
 * and writes for one code always go through one place, so a write based on an old version is
 * refused (409) and the app merges instead of overwriting.
 *
 *   GET  /v1/<code>   → 200 { rev, savedAt, data }   or 404
 *   PUT  /v1/<code>   { baseRev, data } → 200 { rev, savedAt }
 *                     or 409 { rev, savedAt, data } when baseRev isn't the current rev
 *
 * Plain JavaScript without imports, so Node can run the same code in tests
 * (scripts/sync.test.js) and in the local test server (scripts/sync-dev-server.js).
 * Deploy: see sync-worker/wrangler.toml.
 */

/** Long random codes only (the app makes 22 characters = 128 random bits). */
const CODE = /^[A-Za-z0-9_-]{22,64}$/;
/** Plenty for 37 weapons + notes; keeps the service from being used as free storage. */
const MAX_BODY = 64 * 1024;
const DOC_KEY = 'doc';

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Max-Age': '86400'
};

function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS }
	});
}

function isObject(x) {
	return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * One sync code's document. `store` has async get(key) / put(key, value) (Durable Object
 * storage, or a Map-backed stand-in in tests). In a Durable Object nothing else runs between
 * the read and the write below, so the version check can't be raced.
 */
export async function handleDoc(request, store, now = Date.now()) {
	const current = (await store.get(DOC_KEY)) ?? null;

	if (request.method === 'GET') {
		return current ? json(current) : json({ error: 'not-found' }, 404);
	}

	if (request.method === 'PUT') {
		let body;
		try {
			body = JSON.parse(await request.text());
		} catch {
			return json({ error: 'bad-json' }, 400);
		}
		if (!isObject(body) || !Number.isInteger(body.baseRev) || body.baseRev < 0 || !isObject(body.data)) {
			return json({ error: 'bad-body' }, 400);
		}
		const rev = current ? current.rev : 0;
		if (body.baseRev !== rev) return json(current ?? { error: 'not-found' }, current ? 409 : 404);
		const next = { rev: rev + 1, savedAt: new Date(now).toISOString(), data: body.data };
		await store.put(DOC_KEY, next);
		return json({ rev: next.rev, savedAt: next.savedAt });
	}

	return json({ error: 'method' }, 405);
}

/** The front door: CORS, checks, then hand the request to that code's Durable Object. */
export async function route(request, env) {
	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

	const url = new URL(request.url);
	if (url.pathname === '/' || url.pathname === '') return json({ ok: true, service: 'mw4-camo-grind-sync' });

	const match = /^\/v1\/([^/]+)$/.exec(url.pathname);
	if (!match || !CODE.test(match[1])) return json({ error: 'not-found' }, 404);
	if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'method' }, 405);

	let forward = request;
	if (request.method === 'PUT') {
		const text = await request.text();
		if (text.length > MAX_BODY) return json({ error: 'too-big' }, 413);
		forward = new Request(request.url, { method: 'PUT', body: text, headers: { 'Content-Type': 'application/json' } });
	}

	const stub = env.STORE.get(env.STORE.idFromName(match[1]));
	const response = await stub.fetch(forward);
	// the Durable Object's response already carries the CORS headers (json() adds them)
	return response;
}

/** One Durable Object per sync code. */
export class SyncStore {
	constructor(state) {
		this.storage = state.storage;
	}

	fetch(request) {
		return handleDoc(request, this.storage);
	}
}

export default {
	fetch(request, env) {
		return route(request, env);
	}
};
