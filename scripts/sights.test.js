// Checks of the sights data (src/lib/data/sights.ts): `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOADOUTS } from '../src/lib/data/loadouts.ts';
import { SIGHTS, SIGHT_BY_NAME, SIGHT_TIERS, SNIPERS, metaOptics, picksFor, screenKick, screenKickOf, sightsFor, zoomOn } from '../src/lib/data/sights.ts';

const GUNS = Object.keys(LOADOUTS);
const NORMAL = GUNS.filter((g) => !SNIPERS.includes(g));

test('sights: unique names, known guns, sane numbers', () => {
	assert.equal(SIGHT_BY_NAME.size, SIGHTS.length, 'a name is listed twice');
	for (const s of SIGHTS) {
		assert.ok(s.guns.length > 0, `${s.name}: no guns`);
		assert.equal(new Set(s.guns).size, s.guns.length, `${s.name}: a gun twice`);
		for (const g of s.guns) assert.ok(NORMAL.includes(g), `${s.name}: ${g} is not a non-sniper gun with a gunsmith`);
		for (const g of Object.keys(s.zoomOn ?? {})) assert.ok(s.guns.includes(g), `${s.name}: zoom for ${g}, which it doesn't fit`);
		assert.ok(s.zoom >= 1 && s.zoom <= 12, s.name);
		assert.ok(s.kick > 0 && s.kick <= 1 && s.recoil > 0 && s.recoil <= 1, `${s.name}: no sight makes it worse than iron sights`);
		// 1x and holo sights carry no multipliers; every magnified scope cuts both
		if (s.type === 'Mini Reflex' || s.type === 'Reflex' || s.type === 'Holo') assert.ok(s.kick === 1 && s.recoil === 1, s.name);
		else assert.ok(s.kick < 1 && s.recoil < 1, s.name);
	}
});

test('sights: the guns take the number of optics the game lists (ggranked, 20 Nov)', () => {
	// optic counts read off each weapon page (snipers left out, see sights.ts)
	const COUNT = {
		'han-86': 23, m4: 23, 'hyeon-burst': 23, 'patriot-xmr': 23, 'kastov-762': 22, oden: 23, axion: 23, 'cronen-squall': 23, 'cronen-osprey': 23,
		'iso-nightshade': 18, 'vel-46': 18, 'wz-55-striga': 16, 'ppsh-41': 18, 'x-58-nyx': 18, 'csg-35': 7,
		'rezi-12': 19, warlord: 19, 'finn-lmg': 16, 'type-73': 22, 'apoc-338': 22,
		'mar-9': 29, 'oris-8-6': 30, 'mosin-nagant': 28, 'sang-9mm': 3, 'krait-p68': 3, '50-gs': 16, 'mojave-357': 13
	};
	assert.deepEqual(Object.keys(COUNT).sort(), [...NORMAL].sort());
	for (const [gun, n] of Object.entries(COUNT)) assert.equal(sightsFor(gun).length, n, gun);
});

test('sights: every tier matches its sights and the list runs from steadiest to shakiest', () => {
	const seen = new Set();
	let last = 0;
	for (const tier of SIGHT_TIERS) {
		assert.ok(tier.sights.length > 0 && tier.note.trim() !== '', tier.id);
		for (const name of tier.sights) {
			const s = SIGHT_BY_NAME.get(name);
			assert.ok(s, `${tier.id}: unknown sight ${name}`);
			assert.ok(!seen.has(name), `${name} is in two tiers`);
			seen.add(name);
			assert.deepEqual([s.zoom, s.kick, s.recoil], [tier.zoom, tier.kick, tier.recoil], `${tier.id}: ${name}`);
		}
		const score = screenKickOf(tier.zoom, tier.kick);
		assert.ok(score >= last, `${tier.id} (${score}×) comes after a shakier tier`);
		last = score;
	}
	assert.deepEqual([...seen].sort(), SIGHTS.map((s) => s.name).sort(), 'every sight is in exactly one tier');
	assert.equal(screenKickOf(4, 0.7), 2.8);
	assert.equal(screenKickOf(SIGHT_TIERS[0].zoom, SIGHT_TIERS[0].kick), 1);
});

test('sights: zoom differs per gun where the game says so', () => {
	const holo = SIGHT_BY_NAME.get('SZ Lonewolf Holo');
	assert.equal(zoomOn(holo, 'm4'), 2);
	assert.equal(zoomOn(holo, 'vel-46'), 3);
	assert.equal(screenKick(holo, 'vel-46'), 3);
	const r808 = SIGHT_BY_NAME.get('Cronen R808');
	assert.equal(zoomOn(r808, 'vel-46'), 4);
	assert.equal(zoomOn(r808, 'rezi-12'), 5);
	assert.equal(zoomOn(SIGHT_BY_NAME.get('GL K230'), 'vel-46'), 5);
});

test('sights: every optic in a meta build fits that gun', () => {
	for (const gun of NORMAL) {
		const fits = new Set(sightsFor(gun).map((s) => s.name));
		for (const [mode, name] of Object.entries(metaOptics(gun))) {
			if (name) assert.ok(fits.has(name), `${gun} ${mode}: ${name} isn't one of its sights`);
		}
	}
});

test('sights: picks per gun', () => {
	for (const gun of NORMAL) {
		const { close, range } = picksFor(gun);
		assert.ok(close, `${gun}: no 1x sight`);
		assert.equal(zoomOn(close, gun), 1, gun);
		if (range) {
			assert.ok(zoomOn(range, gun) >= 4, gun);
			// nothing magnified on that gun shows less kick
			for (const s of sightsFor(gun)) if (zoomOn(s, gun) >= 4) assert.ok(screenKick(s, gun) >= screenKick(range, gun), `${gun}: ${s.name}`);
		}
	}
	for (const gun of SNIPERS) assert.deepEqual(picksFor(gun), {});
	// the meta build's own slim dot wins the tie between the 1x sights
	assert.equal(picksFor('han-86').close.name, 'SZ Prima-4 Dot');
	assert.equal(picksFor('ppsh-41').close.name, 'ZLR Type C');
	assert.equal(picksFor('m4').close.name, 'Slimline Elite');
	assert.equal(picksFor('kastov-762').close.name, 'Z-Dot 9');
	assert.equal(picksFor('han-86').range.name, 'Locus PX3 Canted');
	assert.equal(picksFor('iso-nightshade').range.name, 'Cronen R808');
	assert.equal(picksFor('finn-lmg').range.name, 'Cronen R808');
	assert.equal(picksFor('mosin-nagant').range.name, 'Cronen R808');
	assert.equal(picksFor('rezi-12').range.name, 'ZLR Swordfish');
	assert.equal(picksFor('50-gs').range.name, 'Bruen Field-Op');
	assert.equal(picksFor('krait-p68').range, undefined);
	assert.equal(picksFor('csg-35').range, undefined);
});
