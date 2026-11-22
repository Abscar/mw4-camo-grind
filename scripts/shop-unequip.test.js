// "Take everything off" (src/lib/shop.ts unequipAll + wearSet, 2026-11-22, the user: "an unequip everything
// button in the shop to take all cosmetics off quickly, to make a new outfit"). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanShop, mergeShop, sellItem, unequipAll, wearSet, worn, ITEM_BY_ID, WEAR_SLOTS } from '../src/lib/shop.ts';

const T = new Date(2026, 10, 22, 18).getTime();
const roundTrip = (s) => cleanShop(JSON.parse(JSON.stringify(s)));
/** the first item of a kind: BurgiShop's, a Camo Armory gun, BurgiDrip clothes, a KarmaShop item, an arcade prize */
const first = (test) => [...ITEM_BY_ID.values()].find(test);

/** someone wearing one thing from every shop: BurgiShop aura + title, an Armory gun, a BurgiDrip top, KarmaShop wings */
function dressed() {
	const pick = [
		first((i) => i.slot === 'aura' && !i.karma && !i.tickets && !i.secret),
		first((i) => i.slot === 'title' && !i.karma && !i.secret),
		first((i) => i.slot === 'hold' && i.gun),
		first((i) => i.drip && i.slot === 'top'),
		first((i) => i.karma && i.slot === 'effect')
	];
	for (const it of pick) assert.ok(it, 'every shop has an item to wear');
	const own = Object.fromEntries(pick.map((i) => [i.id, i.karma || i.tickets ? 0 : i.price]));
	const eq = Object.fromEntries(pick.map((i) => [i.slot, i.id]));
	return { state: { own, eq, at: T }, pick };
}

test('take everything off: every slot from every shop, the gun too; nothing owned is lost', () => {
	const { state, pick } = dressed();
	assert.equal(Object.keys(worn(state)).length, pick.length);
	const off = unequipAll(state, T + 1);
	assert.deepEqual(off.eq, {}, 'nothing worn');
	assert.deepEqual(off.own, state.own, 'everything still owned');
	assert.equal(off.at, T + 1, 'the change is dated, so it wins over an older device');
	assert.equal(unequipAll(off, T + 2), null, 'nothing on: nothing to do');
	assert.equal(unequipAll(undefined, T), null);
	assert.ok(WEAR_SLOTS.includes('hold') && WEAR_SLOTS.includes('top'), 'the gun and the clothes are worn slots');
	const back = roundTrip(off);
	assert.deepEqual(back.eq, {});
	assert.equal(back.at, T + 1, 'the time survives cleaning');
});

test('the other device: the empty set is newer, so it wins the merge', () => {
	const { state } = dressed();
	const off = unequipAll(state, T + 5);
	assert.deepEqual(mergeShop(state, off).eq, {});
	assert.deepEqual(mergeShop(off, state).eq, {});
});

test('Undo puts the same set back on, minus what was sold since', () => {
	const { state } = dressed();
	const before = { ...state.eq };
	const off = unequipAll(state, T + 1);
	assert.deepEqual(wearSet(off, before, T + 2).eq, before);
	const aura = before.aura;
	const sold = sellItem(off, aura, T + 3).state;
	const again = wearSet(sold, before, T + 4).eq;
	assert.equal(again.aura, undefined, 'a sold item stays off');
	assert.equal(Object.keys(again).length, Object.keys(before).length - 1);
	assert.equal(wearSet(off, {}, T), null, 'nothing to put back');
	assert.equal(wearSet(off, { aura: before.title }, T), null, 'an item only goes in its own slot');
});
