// Abscars Madness' Armory (src/lib/mayhem/gunsmith.ts + the engine's own-gun stats): guns land in it when you
// finish a level holding them, ranks open better parts, parts cost gun parts and change the gun's stats.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Mayhem } from '../src/lib/mayhem/engine.ts';
import { gunOf, weaponsOfKind } from '../src/lib/mayhem/guns.ts';
import {
	addClear,
	ATT_BY_ID,
	ATTACHMENTS,
	buyPart,
	canBuyPart,
	cleanArmory,
	equipPart,
	kitStats,
	partsFor,
	partsSpent,
	rankOf,
	SLOTS,
	takesParts
} from '../src/lib/mayhem/gunsmith.ts';
import { LEVELS } from '../src/lib/mayhem/levels.ts';

const ar = weaponsOfKind('ar')[0].id;
const knife = weaponsOfKind('melee')[0]?.id;

test('catalogue: unique ids, three parts per slot, one of each rank, cost grows with rank', () => {
	assert.equal(new Set(ATTACHMENTS.map((a) => a.id)).size, ATTACHMENTS.length);
	for (const s of SLOTS) {
		const list = ATTACHMENTS.filter((a) => a.slot === s);
		assert.deepEqual(
			list.map((a) => a.rank),
			[1, 2, 3],
			s
		);
		assert.ok(list[0].cost < list[1].cost && list[1].cost < list[2].cost, s);
	}
});

test('finishing levels adds the gun and ranks it up', () => {
	let a = {};
	a = addClear(a, ar);
	assert.equal(a[ar].n, 1);
	assert.equal(rankOf(a[ar].n), 1);
	a = addClear(addClear(a, ar), ar);
	assert.equal(rankOf(a[ar].n), 2);
	for (let i = 0; i < 3; i++) a = addClear(a, ar);
	assert.equal(rankOf(a[ar].n), 3);
	assert.equal(partsFor(12, true, false), 32);
	assert.equal(partsFor(0, false, false), 10);
});

test('buying: rank, money, owned; bought parts go on and can be swapped or taken off', () => {
	let a = addClear({}, ar);
	assert.equal(canBuyPart(a, ar, 'holo', 999), 'rank');
	assert.equal(canBuyPart(a, ar, 'reflex', 5), 'poor');
	assert.equal(canBuyPart(a, 'nope', 'reflex', 999), 'none');
	a = buyPart(a, ar, 'reflex', 100);
	assert.deepEqual(a[ar].own, ['reflex']);
	assert.equal(a[ar].eq.optic, 'reflex');
	assert.equal(canBuyPart(a, ar, 'reflex', 100), 'owned');
	assert.equal(partsSpent(a), ATT_BY_ID.get('reflex').cost);
	// can't afford = nothing changes
	assert.equal(buyPart(a, ar, 'ext', 1), a);
	a = equipPart(a, ar, 'optic', null);
	assert.equal(a[ar].eq.optic, undefined);
	assert.equal(equipPart(a, ar, 'optic', 'holo'), a, 'not owned');
	assert.equal(equipPart(a, ar, 'muzzle', 'reflex'), a, 'wrong slot');
	a = equipPart(a, ar, 'optic', 'reflex');
	assert.equal(a[ar].eq.optic, 'reflex');
});

test('parts change the stats the way their words say', () => {
	const b = gunOf(ar);
	const k = kitStats(ar, { optic: 'scope', muzzle: 'supp', barrel: 'heavy', mag: 'drum', stock: 'grip' });
	assert.ok(k.spread < b.spread);
	assert.ok(k.mag > b.mag);
	assert.equal(k.pierce, b.pierce + 1);
	assert.ok(k.noise < 1);
	assert.ok(k.weight < b.weight);
	assert.deepEqual(kitStats(ar), { ...b, noise: 1 });
	if (knife) {
		assert.equal(takesParts(knife), false);
		assert.deepEqual(kitStats(knife, { optic: 'scope' }), { ...gunOf(knife), noise: 1 });
	}
});

test('cleaning keeps only real guns and bought parts in their own slot', () => {
	const c = cleanArmory({
		[ar]: { n: 4, own: ['reflex', 'reflex', 'bogus', 'ext'], eq: { optic: 'reflex', mag: 'holo', stock: 'ext' } },
		notagun: { n: 3, own: [], eq: {} },
		...(knife ? { [knife]: { n: 2, own: ['reflex'], eq: { optic: 'reflex' } } } : {})
	});
	assert.deepEqual(Object.keys(c).sort(), [ar, ...(knife ? [knife] : [])].sort());
	assert.deepEqual(c[ar], { n: 4, own: ['reflex', 'ext'], eq: { optic: 'reflex' } });
	if (knife) assert.deepEqual(c[knife], { n: 2, own: [], eq: {} });
	assert.deepEqual(cleanArmory(null), {});
	assert.deepEqual(cleanArmory('x'), {});
});

test('the engine: your Armory gun starts with its parts; the same gun off the floor has plain stats', () => {
	const kit = kitStats(ar, { mag: 'drum', barrel: 'heavy' });
	const g = new Mayhem(LEVELS[0].id, ar, [], 1, kit);
	assert.equal(g.player.held.own, 1);
	assert.equal(g.player.held.ammo, kit.mag);
	assert.equal(g.statsOf(g.player.held).dmg, kit.dmg);
	assert.equal(g.statsOf({ id: ar, ammo: 5 }).dmg, gunOf(ar).dmg);
	// a kit for another gun is ignored
	const g2 = new Mayhem(LEVELS[0].id, weaponsOfKind('pistol')[0].id, [], 1, kit);
	assert.equal(g2.player.held.own, undefined);
	// no kit = as before
	const g3 = new Mayhem(LEVELS[0].id, ar, [], 1);
	assert.equal(g3.player.held.ammo, gunOf(ar).mag);
});
