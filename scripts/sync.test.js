// Automatic sync: the merge rules (src/lib/sync-codec.ts) and the sync service itself
// (sync-worker/worker.js, run here with in-memory storage). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultProgress } from '../src/lib/progress-codec.ts';
import {
	combine,
	fromWire,
	isSyncCode,
	makeSyncCode,
	merge3,
	sameDoc,
	syncCodeFromHash,
	syncCodeFromText,
	toWire
} from '../src/lib/sync-codec.ts';
import { memoryEnv } from './sync-dev-server.js';
import { route } from '../sync-worker/worker.js';

const doc = (weapons = {}, extra = {}) => {
	const progress = defaultProgress();
	Object.assign(progress.weapons, weapons);
	return { progress, notes: {}, focus: [], lastTickAt: null, ...extra };
};

test('sync: wire format round trip, junk rejected', () => {
	const d = doc({ m4: 3 }, { notes: { m4: 'longshots' }, focus: ['m4', 'oden'], lastTickAt: '2026-11-08T10:00:00.000Z' });
	assert.ok(sameDoc(fromWire(JSON.parse(JSON.stringify(toWire(d)))), d));
	assert.equal(fromWire({ hello: 1 }), null);
	assert.equal(fromWire(null), null);
	assert.deepEqual(fromWire({ progress: {}, focus: ['m4', 'nope', 'm4'] }).focus, ['m4']);
});

test('sync: merge keeps changes from both sides', () => {
	const base = doc({ m4: 1, oden: 1 });
	const local = doc({ m4: 2, oden: 1 }, { notes: { m4: 'mine' } });
	const remote = doc({ m4: 1, oden: 3 }, { focus: ['oden'] });
	const merged = merge3(base, local, remote);
	assert.equal(merged.progress.weapons.m4, 2);
	assert.equal(merged.progress.weapons.oden, 3);
	assert.equal(merged.notes.m4, 'mine');
	assert.deepEqual(merged.focus, ['oden']);
});

test('sync: an untick on one device carries over; when both changed a weapon the higher tick wins', () => {
	const base = doc({ m4: 3, oden: 1 });
	assert.equal(merge3(base, doc({ m4: 3, oden: 1 }), doc({ m4: 1, oden: 1 })).progress.weapons.m4, 1);
	assert.equal(merge3(base, doc({ m4: 0, oden: 1 }), doc({ m4: 3, oden: 1 })).progress.weapons.m4, 0);
	assert.equal(merge3(base, doc({ m4: 2 }), doc({ m4: 1 })).progress.weapons.m4, 2);
	assert.equal(merge3(base, doc({ m4: 3, oden: 2 }), doc({ m4: 3, oden: 3 })).progress.weapons.oden, 3);
});

test('sync: deleting a note on one device deletes it everywhere; both edited = this device wins', () => {
	const base = doc({}, { notes: { m4: 'old', oden: 'keep' } });
	const merged = merge3(base, doc({}, { notes: { oden: 'keep' } }), doc({}, { notes: { m4: 'old', oden: 'theirs' } }));
	assert.deepEqual(merged.notes, { oden: 'theirs' });
	const both = merge3(base, doc({}, { notes: { m4: 'mine', oden: 'keep' } }), doc({}, { notes: { m4: 'theirs', oden: 'keep' } }));
	assert.equal(both.notes.m4, 'mine');
});

test('sync: joining combines without losing a tick', () => {
	const c = combine(doc({ m4: 3, oden: 0 }, { notes: { m4: 'a' } }), doc({ m4: 1, oden: 2 }, { notes: { oden: 'b' }, focus: ['oden'] }));
	assert.equal(c.progress.weapons.m4, 3);
	assert.equal(c.progress.weapons.oden, 2);
	assert.deepEqual(c.notes, { m4: 'a', oden: 'b' });
	assert.deepEqual(c.focus, ['oden']);
});

test('sync: codes are long and random, links and pasted text are read', () => {
	const a = makeSyncCode();
	assert.equal(a.length, 22);
	assert.ok(isSyncCode(a));
	assert.notEqual(a, makeSyncCode());
	assert.equal(syncCodeFromHash(`#sync=${a}`), a);
	assert.equal(syncCodeFromHash(`#p=1.x&sync=${a}`), a);
	assert.equal(syncCodeFromHash('#sync=short'), null);
	assert.equal(syncCodeFromHash(`#p=${a}`), null);
	assert.equal(syncCodeFromText(` https://abscar.github.io/mw4-camo-grind/#sync=${a} `), a);
	assert.equal(syncCodeFromText(a), a);
	assert.equal(syncCodeFromText('hello'), null);
});

test('sync service: create, read, refuse a write based on an old version, CORS, limits', async () => {
	const env = memoryEnv();
	const code = makeSyncCode();
	const url = `https://sync.test/v1/${code}`;
	const put = (baseRev, data) => route(new Request(url, { method: 'PUT', body: JSON.stringify({ baseRev, data }) }), env);

	assert.equal((await route(new Request(url), env)).status, 404);
	const created = await put(0, { n: 1 });
	assert.equal(created.status, 200);
	assert.equal((await created.json()).rev, 1);
	assert.equal(created.headers.get('access-control-allow-origin'), '*');

	const read = await (await route(new Request(url), env)).json();
	assert.deepEqual([read.rev, read.data], [1, { n: 1 }]);

	const stale = await put(0, { n: 2 });
	assert.equal(stale.status, 409);
	assert.deepEqual((await stale.json()).data, { n: 1 });
	assert.equal((await put(1, { n: 3 })).status, 200);

	assert.equal((await route(new Request('https://sync.test/v1/short'), env)).status, 404);
	assert.equal((await route(new Request(url, { method: 'OPTIONS' }), env)).status, 204);
	assert.equal((await route(new Request(url, { method: 'DELETE' }), env)).status, 405);
	assert.equal((await route(new Request(url, { method: 'PUT', body: 'x'.repeat(70_000) }), env)).status, 413);
	assert.equal((await route(new Request(url, { method: 'PUT', body: '{"baseRev":-1,"data":{}}' }), env)).status, 400);
	assert.equal((await route(new Request(url, { method: 'PUT', body: 'not json' }), env)).status, 400);

	// two writes at once from the same version: exactly one wins
	const [a, b] = await Promise.all([put(2, { who: 'a' }), put(2, { who: 'b' })]);
	assert.deepEqual([a.status, b.status].sort(), [200, 409]);
});
