// Quick checks of the pure progress helpers: `npm test` (Node runs the .ts sources directly).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ALL_MASTERY, DIVERGENCE_REQUIRED, MASTERY, MASTERY_DMZ, MASTERY_EXTRA, MASTERY_TRACKS, MASTERY_WZ, MAX_LEVEL } from '../src/lib/data/camos.ts';
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
	mergeStamps,
	migrate,
	normalisePrefs,
	normaliseSpecials,
	normaliseStamps,
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

test('data: Mastery per mode: 3 each (MP, Warzone, DMZ), ids and names unique, links keep MP first', () => {
	assert.deepEqual(MASTERY_TRACKS.map((t) => [t.mode, t.camos.length]), [['mp', 3], ['wz', 3], ['dmz', 3]]);
	assert.equal(new Set(ALL_MASTERY.map((m) => m.id)).size, ALL_MASTERY.length);
	assert.equal(new Set(ALL_MASTERY.map((m) => m.name)).size, ALL_MASTERY.length);
	assert.deepEqual(MASTERY.map((m) => m.id), ['mercurialDrift', 'polyatomicReforged', 'orionReforged']);
	assert.deepEqual(MASTERY_EXTRA.map((m) => m.id), ['parallax', 'damascusReforged', 'empyros', 'chiral', 'rippleTide', 'helio']);
	assert.ok(ALL_MASTERY.every((m) => Number.isInteger(m.target) && m.target > 0 && m.challenge.text.trim()));
});

test('data: every weapon has a cartoon icon look, and no look is orphaned', () => {
	const ids = new Set(WEAPONS.map((w) => w.id));
	assert.deepEqual(WEAPONS.filter((w) => !WEAPON_LOOKS[w.id]).map((w) => w.id), []);
	assert.deepEqual(Object.keys(WEAPON_LOOKS).filter((id) => !ids.has(id)), []);
});

test('data: Special camos (before Gold): 3 per launch weapon, 0 or 3 otherwise, names unique', () => {
	for (const w of WEAPONS) {
		if (w.season === 'launch') assert.equal(w.specials.length, 3, w.id);
		else assert.ok([0, 3].includes(w.specials.length), w.id);
		for (const s of w.specials) assert.ok(s.name.trim() && s.challenge.text.trim(), w.id);
	}
	const names = WEAPONS.flatMap((w) => w.specials.map((s) => s.name.toLowerCase()));
	assert.equal(new Set(names).size, names.length);
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
	assert.deepEqual(decodeLink(code), { ...p, specials: {} });
	assert.equal(linkCodeFromHash(`#p=${code}`), code);
	assert.equal(linkCodeFromHash('#something-else'), null);
});

test('link: Special camos (before Gold) ride along; older links without them leave them alone', () => {
	const p = defaultProgress();
	p.weapons['csg-35'] = 0;
	p.specials = { 'csg-35': 0b101, 'cronen-osprey': 0b010, 'han-86': 0b111 };
	const code = encodeLink(p);
	assert.ok(code.length < 60, code);
	assert.deepEqual(decodeLink(code)?.specials, p.specials);
	const old = code.split('.').slice(0, 2 + MASTERY.length).join('.');
	assert.equal(decodeLink(old)?.specials, undefined);
	assert.equal(decodeLink(`${old}.S!`), null);
});

test('link: Warzone and DMZ Mastery ride along; older links leave them alone; broken ones are rejected', () => {
	const p = defaultProgress();
	p.mastery.parallax = 300;
	p.mastery.empyros = 12;
	p.mastery.helio = 25000;
	p.mastery.orionReforged = 499;
	const code = encodeLink(p);
	assert.ok(code.length < 50, code);
	assert.deepEqual(decodeLink(code)?.mastery, p.mastery);
	// all zero → just "M", still read as zeros (not "leave alone")
	const zero = encodeLink(defaultProgress());
	assert.ok(zero.endsWith('.M'), zero);
	assert.equal(decodeLink(zero)?.mastery.helio, 0);
	// a link from before 2026-11-10 (no M part) has no Warzone/DMZ counts at all
	const old = code.split('.').slice(0, 3 + MASTERY.length).join('.');
	const decodedOld = decodeLink(old);
	assert.equal(decodedOld?.mastery.orionReforged, 499);
	assert.ok(MASTERY_EXTRA.every((m) => !(m.id in (decodedOld?.mastery ?? {}))));
	// too big counts are clamped, junk rejects the link
	assert.equal(decodeLink(`${old}.Mzzzz`)?.mastery.parallax, 300);
	assert.equal(decodeLink(`${old}.M1--2`), null);
	assert.equal(decodeLink(`${old}.X1`), null);
	// a newer page might add parts after M: ignored
	assert.equal(decodeLink(`${code}.Zfuture`)?.mastery.helio, 25000);
});

test('Warzone / DMZ Mastery in saves: kept; data without a track leaves that track out', () => {
	const p = defaultProgress();
	p.mastery.chiral = 2500;
	p.mastery.damascusReforged = 40;
	const m = migrate(JSON.parse(JSON.stringify(toStored(p, normalisePrefs({})))));
	assert.equal(m?.progress.mastery.chiral, 2500);
	assert.equal(m?.progress.mastery.damascusReforged, 40);
	assert.equal(m?.progress.mastery.helio, 0);
	const old = migrate({ v: 2, progress: { weapons: {}, mastery: { mercurialDrift: 9 } } });
	assert.equal(old?.progress.mastery.mercurialDrift, 9);
	assert.ok(MASTERY_EXTRA.every((x) => !(x.id in (old?.progress.mastery ?? {}))));
	// one Warzone id is enough to make the whole Warzone track known (missing ones = 0); DMZ stays out
	const partial = migrate({ v: 2, progress: { weapons: {}, mastery: { empyros: 999 } } });
	assert.deepEqual(MASTERY_WZ.map((x) => partial?.progress.mastery[x.id]), [0, 0, 75]);
	assert.ok(MASTERY_DMZ.every((x) => !(x.id in (partial?.progress.mastery ?? {}))));
});

test('specials and tick times: kept in saves, cleaned up, older saves still load', () => {
	const p = defaultProgress();
	p.specials = { 'csg-35': 3 };
	const stored = toStored(p, normalisePrefs({}), { notes: {}, lastTickAt: null, stamps: { m4: [0, 1762600000000] } });
	const m = migrate(JSON.parse(JSON.stringify(stored)));
	assert.deepEqual(m?.progress.specials, { 'csg-35': 3 });
	assert.deepEqual(m?.stamps, { m4: [0, 1762600000000] });
	assert.deepEqual(normaliseSpecials({ a: 9, b: 0, c: 'x', d: 7 }), { a: 1, d: 7 });
	assert.deepEqual(normaliseStamps({ a: [1, -5, 'x', 4], b: [0, 0], c: 'nope' }), { a: [1, 0, 0] });
	const old = migrate({ v: 2, progress: { weapons: { m4: 2 }, mastery: {} } });
	assert.equal(old?.progress.specials, undefined);
	assert.equal(old?.stamps, undefined);
	assert.equal(toStored(p, normalisePrefs({})).stamps, undefined);
});

test('tick times: only for camos the weapon still has; the earliest known time wins', () => {
	const merged = mergeStamps({ m4: 2, oden: 0, axion: 3 }, { m4: [5, 9, 12], oden: [3] }, { m4: [0, 7], axion: [0, 0, 4] });
	assert.deepEqual(merged, { m4: [5, 7], axion: [0, 0, 4] });
	assert.deepEqual(mergeStamps({ m4: 1 }, undefined, { m4: [0] }), {});
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
