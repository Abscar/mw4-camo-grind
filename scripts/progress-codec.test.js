// Quick checks of the pure progress helpers: `npm test` (Node runs the .ts sources directly).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIVERGENCE_REQUIRED, MASTERY, MAX_LEVEL } from '../src/lib/data/camos.ts';
import { WEAPON_LOOKS } from '../src/lib/data/weaponLooks.ts';
import { CLASSES, NEXT_FREE_SLOT, WEAPONS } from '../src/lib/data/weapons.ts';
import { BALANCE, BALANCE_PATCH } from '../src/lib/data/balance.ts';
import {
	FOCUS_MAX,
	NOTE_MAX,
	decodeLink,
	defaultProgress,
	encodeLink,
	linkCodeFromHash,
	migrate,
	normalisePrefs,
	toExport,
	toStored
} from '../src/lib/progress-codec.ts';

test('data: ids and link slots are unique, slots below NEXT_FREE_SLOT', () => {
	assert.equal(new Set(WEAPONS.map((w) => w.id)).size, WEAPONS.length);
	assert.equal(new Set(WEAPONS.map((w) => w.slot)).size, WEAPONS.length);
	assert.ok(WEAPONS.every((w) => w.slot >= 0 && w.slot < NEXT_FREE_SLOT));
	assert.equal(new Set(CLASSES.map((c) => c.id)).size, CLASSES.length);
	assert.equal(new Set(MASTERY.map((m) => m.id)).size, MASTERY.length);
});

test('data: every weapon has a cartoon icon look, and no look is orphaned', () => {
	const ids = new Set(WEAPONS.map((w) => w.id));
	assert.deepEqual(WEAPONS.filter((w) => !WEAPON_LOOKS[w.id]).map((w) => w.id), []);
	assert.deepEqual(Object.keys(WEAPON_LOOKS).filter((id) => !ids.has(id)), []);
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
	assert.deepEqual(m.prefs, { theme: 'neon', hideMaxed: true, classFilter: null, focus: [] });
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

test('data: every buff/nerf entry belongs to a known weapon', () => {
	const ids = new Set(WEAPONS.map((w) => w.id));
	assert.deepEqual(Object.keys(BALANCE).filter((id) => !ids.has(id)), []);
	assert.ok(Object.values(BALANCE).every((b) => (b.change === 'buff' || b.change === 'nerf') && b.text.trim() !== ''));
	assert.match(BALANCE_PATCH.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('focus list: known ids only, no doubles, at most FOCUS_MAX', () => {
	const prefs = normalisePrefs({ focus: ['m4', 'm4', 'no-such-gun', 7, 'oden', 'axion', 'vel-46', 'han-86'] });
	assert.deepEqual(prefs.focus, ['m4', 'oden', 'axion', 'vel-46']);
	assert.equal(prefs.focus.length, FOCUS_MAX);
	assert.deepEqual(normalisePrefs({}).focus, []);
	assert.deepEqual(normalisePrefs({ focus: 'm4' }).focus, []);
});

test('notes: kept in saves and backups, trimmed and capped; older saves without notes still load', () => {
	const long = 'x'.repeat(NOTE_MAX + 50);
	const stored = toStored(defaultProgress(), normalisePrefs({}), {
		notes: { m4: 'longshots on big maps' },
		lastTickAt: '2026-11-07T08:00:00.000Z'
	});
	const m = migrate(JSON.parse(JSON.stringify(stored)));
	assert.ok(m);
	assert.deepEqual(m.notes, { m4: 'longshots on big maps' });
	assert.equal(m.lastTickAt, '2026-11-07T08:00:00.000Z');
	assert.ok(m.savedAt);

	const raw = migrate({ v: 2, progress: { weapons: {}, mastery: {} }, notes: { oden: `  ${long}  `, m4: '   ', 'future-gun': 'hi', axion: 5 } });
	assert.ok(raw);
	assert.equal(raw.notes?.oden.length, NOTE_MAX);
	assert.equal(raw.notes?.m4, undefined);
	assert.equal(raw.notes?.axion, undefined);
	assert.equal(raw.notes?.['future-gun'], 'hi');

	const old = migrate({ v: 2, progress: { weapons: { m4: 2 }, mastery: {} }, prefs: { theme: 'neon' } });
	assert.ok(old);
	assert.equal(old.notes, undefined);
	assert.equal(old.lastTickAt, undefined);
	assert.deepEqual(old.prefs?.focus, []);

	const file = toExport(defaultProgress(), { m4: 'note' });
	assert.deepEqual(migrate(JSON.parse(JSON.stringify(file)))?.notes, { m4: 'note' });
	assert.equal(toExport(defaultProgress()).notes, undefined);
});

test('link: broken codes are rejected', () => {
	assert.equal(decodeLink(''), null);
	assert.equal(decodeLink('9.AAAA'), null);
	assert.equal(decodeLink('1.AA!A'), null);
	assert.equal(decodeLink('1.AAAA.ZZ'), null);
});
