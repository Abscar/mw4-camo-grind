// Quick checks of the pure progress helpers: `npm test` (Node runs the .ts sources directly).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIVERGENCE_REQUIRED, MASTERY, MAX_LEVEL } from '../src/lib/data/camos.ts';
import { CLASSES, NEXT_FREE_SLOT, WEAPONS } from '../src/lib/data/weapons.ts';
import {
	decodeLink,
	defaultProgress,
	encodeLink,
	linkCodeFromHash,
	migrate
} from '../src/lib/progress-codec.ts';

test('data: ids and link slots are unique, slots below NEXT_FREE_SLOT', () => {
	assert.equal(new Set(WEAPONS.map((w) => w.id)).size, WEAPONS.length);
	assert.equal(new Set(WEAPONS.map((w) => w.slot)).size, WEAPONS.length);
	assert.ok(WEAPONS.every((w) => w.slot >= 0 && w.slot < NEXT_FREE_SLOT));
	assert.equal(new Set(CLASSES.map((c) => c.id)).size, CLASSES.length);
	assert.equal(new Set(MASTERY.map((m) => m.id)).size, MASTERY.length);
});

test('data: counts match the known launch + Season 1 roster', () => {
	assert.equal(WEAPONS.length, 37);
	assert.equal(WEAPONS.filter((w) => w.season === 'launch').length, 33);
	assert.equal(CLASSES.length, 9);
	assert.equal(DIVERGENCE_REQUIRED, 33);
});

test('defaults: launch weapons have Gold, Season 1 weapons start empty', () => {
	const d = defaultProgress();
	for (const w of WEAPONS) assert.equal(d.weapons[w.id], w.season === 'launch' ? 1 : 0, w.id);
	for (const m of MASTERY) assert.equal(d.mastery[m.id], 0);
});

test('migrate: old tracker localStorage (v1) keeps every tick and mastery count', () => {
	const v1 = {
		v: 1,
		ticks: Object.fromEntries(WEAPONS.map((w) => [w.id, [w.season === 'launch' ? 1 : 0, 0, 0]])),
		mastery: { md: 12, pr: 0, or: 999999 },
		theme: 'neon',
		hideMaxed: true
	};
	v1.ticks['m4'] = [1, 1, 0];
	v1.ticks['han-86'] = [1, 1, 1];
	v1.ticks['csg-35'] = [0, 1, 0]; // malformed: highest tick wins
	const m = migrate(v1);
	assert.ok(m);
	assert.equal(m.from, 1);
	assert.equal(m.progress.weapons['m4'], 2);
	assert.equal(m.progress.weapons['han-86'], 3);
	assert.equal(m.progress.weapons['csg-35'], 2);
	assert.equal(m.progress.weapons['cronen-osprey'], 0);
	assert.equal(m.progress.mastery.mercurialDrift, 12);
	assert.equal(m.progress.mastery.orionReforged, 500); // clamped to target
	assert.deepEqual(m.prefs, { theme: 'neon', hideMaxed: true, classFilter: null });
});

test('migrate: old tracker export file (v1) works too', () => {
	const m = migrate({ app: 'mw4-camo-grind', v: 1, exported: '2026-11-06T10:00:00Z', ticks: { oden: [1, 1, 1] }, mastery: { md: 3 } });
	assert.ok(m);
	assert.equal(m.progress.weapons.oden, 3);
	assert.equal(m.progress.weapons.m4, 1); // missing → default
	assert.equal(m.progress.mastery.mercurialDrift, 3);
	assert.equal(m.prefs, undefined);
});

test('migrate: unknown weapon ids are kept, junk is rejected', () => {
	const m = migrate({ v: 2, progress: { weapons: { 'future-gun': 2, m4: 9 }, mastery: {} } });
	assert.ok(m);
	assert.equal(m.progress.weapons['future-gun'], 2);
	assert.equal(m.progress.weapons.m4, MAX_LEVEL);
	assert.equal(migrate(null), null);
	assert.equal(migrate('hello'), null);
	assert.equal(migrate({ foo: 1 }), null);
});

test('link: round trip, and it stays short', () => {
	const p = defaultProgress();
	p.weapons['han-86'] = 3;
	p.weapons['zlr-talonhawk'] = 2;
	p.weapons['cronen-osprey'] = 1;
	p.mastery.mercurialDrift = 250;
	p.mastery.polyatomicReforged = 17;
	const code = encodeLink(p);
	assert.ok(code.length < 40, code);
	assert.deepEqual(decodeLink(code), p);
	assert.equal(linkCodeFromHash(`#p=${code}`), code);
	assert.equal(linkCodeFromHash('#something-else'), null);
});

test('link: broken codes are rejected', () => {
	assert.equal(decodeLink(''), null);
	assert.equal(decodeLink('9.AAAA'), null);
	assert.equal(decodeLink('1.AA!A'), null);
	assert.equal(decodeLink('1.AAAA.ZZ'), null);
});
