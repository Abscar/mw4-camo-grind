// The sync service (sync-worker/worker.js) running locally with in-memory storage, for testing
// the app's automatic sync without Cloudflare: `node scripts/sync-dev-server.js [port]`
// (default 8788). Point the app at it with VITE_SYNC_URL=http://127.0.0.1:8788 (e.g. a
// `.env.synctest` file + `vite dev --mode synctest`). Everything is forgotten when it stops.
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { SyncStore, route } from '../sync-worker/worker.js';

/** A stand-in for Cloudflare's Durable Object namespace: one Map-backed store per sync code. */
export function memoryEnv() {
	const objects = new Map();
	return {
		STORE: {
			idFromName: (name) => name,
			get(id) {
				if (!objects.has(id)) {
					const data = new Map();
					const storage = { get: async (k) => structuredClone(data.get(k)), put: async (k, v) => void data.set(k, structuredClone(v)) };
					objects.set(id, new SyncStore({ storage }));
				}
				const object = objects.get(id);
				// a Durable Object handles one request at a time; queue them the same way here
				return { fetch: (req) => (object.queue = (object.queue ?? Promise.resolve()).then(() => object.fetch(req))) };
			}
		}
	};
}

export function startServer(port = 8788) {
	const env = memoryEnv();
	const server = createServer(async (req, res) => {
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		const body = chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined;
		const request = new Request(`http://127.0.0.1:${port}${req.url}`, {
			method: req.method,
			headers: req.headers,
			body: req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' ? undefined : body
		});
		const response = await route(request, env);
		res.writeHead(response.status, Object.fromEntries(response.headers));
		res.end(response.body ? Buffer.from(await response.arrayBuffer()) : undefined);
	});
	return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const port = Number(process.argv[2]) || 8788;
	await startServer(port);
	console.log(`sync test server on http://127.0.0.1:${port}`);
}
