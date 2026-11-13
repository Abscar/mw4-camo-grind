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

test('sync: Special camos and tick times travel and merge without losing a tick', () => {
	const withSpecials = (specials, extra = {}) => {
		const d = doc({ 'csg-35': 0, m4: 2 }, extra);
		d.progress.specials = specials;
		return d;
	};
	const d = withSpecials({ 'csg-35': 1 }, { stamps: { m4: [0, 1762600000000] } });
	const back = fromWire(JSON.parse(JSON.stringify(toWire(d))));
	assert.ok(sameDoc(back, d));
	assert.deepEqual(back.progress.specials, { 'csg-35': 1 });
	assert.deepEqual(back.stamps, { m4: [0, 1762600000000] });
	assert.ok(!sameDoc(d, withSpecials({ 'csg-35': 3 })));

	const base = withSpecials({ 'csg-35': 1, 'cronen-osprey': 2 });
	const merged = merge3(base, withSpecials({ 'csg-35': 3, 'cronen-osprey': 2 }), withSpecials({ 'csg-35': 5 }));
	assert.deepEqual(merged.progress.specials, { 'csg-35': 7 });
	assert.deepEqual(combine(withSpecials({ m4: 1 }), withSpecials({ m4: 4, oden: 2 })).progress.specials, { m4: 5, oden: 2 });
	const stamped = merge3(doc({ m4: 1 }), doc({ m4: 2 }, { stamps: { m4: [0, 50] } }), doc({ m4: 1 }));
	assert.deepEqual(stamped.stamps, { m4: [0, 50] });
});

test('sync: Warzone / DMZ Mastery merge; a device on the old page (no such counts) changes nothing', () => {
	const withMastery = (mastery) => {
		const d = doc();
		Object.assign(d.progress.mastery, mastery);
		return d;
	};
	const base = withMastery({ parallax: 10, chiral: 100 });
	const merged = merge3(base, withMastery({ parallax: 12, chiral: 100 }), withMastery({ parallax: 10, chiral: 150 }));
	assert.equal(merged.progress.mastery.parallax, 12);
	assert.equal(merged.progress.mastery.chiral, 150);
	// the other device's document has no Warzone/DMZ counts at all (read through fromWire, like the app)
	const oldPage = fromWire({ app: 'mw4-camo-grind', sync: 1, progress: { weapons: {}, mastery: { mercurialDrift: 4 } }, notes: {}, focus: [] });
	assert.ok(!('parallax' in oldPage.progress.mastery));
	const kept = merge3(base, withMastery({ parallax: 10, chiral: 100 }), oldPage);
	assert.equal(kept.progress.mastery.parallax, 10);
	assert.equal(kept.progress.mastery.chiral, 100);
	assert.equal(kept.progress.mastery.mercurialDrift, 4);
	assert.equal(combine(withMastery({ helio: 900 }), withMastery({ helio: 20 })).progress.mastery.helio, 900);
	assert.ok(!sameDoc(withMastery({ empyros: 1 }), withMastery({ empyros: 2 })));
});

test('sync: Extra camos "Got it" ticks travel and merge; an older page (none at all) changes nothing', () => {
	const withExtras = (extraCamos) => {
		const d = doc();
		if (extraCamos) d.progress.extraCamos = extraCamos;
		return d;
	};
	const d = withExtras({ 'event-venom-pile': 1 });
	const back = fromWire(JSON.parse(JSON.stringify(toWire(d))));
	assert.ok(sameDoc(back, d));
	assert.deepEqual(back.progress.extraCamos, { 'event-venom-pile': 1 });
	assert.ok(!sameDoc(d, withExtras({})));

	const base = withExtras({ a: 1, b: 1 });
	// this device ticked c and unticked a; the other one unticked b
	const merged = merge3(base, withExtras({ b: 1, c: 1 }), withExtras({ a: 1 }));
	assert.deepEqual(merged.progress.extraCamos, { c: 1 });
	// a document from an older page has no ticks at all: it leaves this device's alone
	const oldPage = fromWire({ app: 'mw4-camo-grind', sync: 1, progress: { weapons: {}, mastery: {} }, notes: {}, focus: [] });
	assert.equal(oldPage.progress.extraCamos, undefined);
	assert.deepEqual(merge3(base, withExtras({ a: 1, b: 1, c: 1 }), oldPage).progress.extraCamos, { a: 1, b: 1, c: 1 });
	assert.deepEqual(combine(withExtras({ a: 1 }), withExtras({ b: 1 })).progress.extraCamos, { a: 1, b: 1 });
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
