// BurgiShop's 18-ideas pack (src/lib/shop.ts, 2026-11-21): daily deal, Munchie Boxes, gifts, selling back,
// outfits, the ad space, holiday items, the 420 collection reward, the throne's title, trophies, new pranks,
// and that all of it survives cleaning, merging two devices and the squad document. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	adOf,
	boxPool,
	buy,
	buyAd,
	buyable,
	claimGifts,
	cleanAdText,
	cleanShop,
	dayKey,
	dealOf,
	equip,
	giftsFor,
	giveItem,
	grantRewards,
	mergeShop,
	openBox,
	owns,
	priceOf,
	prankTimes,
	pranksOn,
	saveFit,
	sellItem,
	sellValue,
	shopSpent,
	throwPrank,
	trophies,
	wearFit,
	windowOpen,
	worn,
	AD_PRICE,
	BOX_PRICE,
	COLLECTION_420,
	ITEM_BY_ID,
	SHOP_ITEMS
} from '../src/lib/shop.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';

const T = new Date(2026, 10, 21, 18).getTime();
const RICH = 1e9;
const A = 'aaaaaaaa1111';
const B = 'bbbbbbbb2222';
const roundTrip = (s) => cleanShop(JSON.parse(JSON.stringify(s)));

test('daily deal: one item a day for everyone, 30–50 % off, the price buy() charges', () => {
	const day = dayKey(T);
	assert.equal(day, '2026-11-21');
	const d = dealOf(day);
	assert.deepEqual(dealOf(day), d, 'the same for every page');
	assert.ok(d.off >= 30 && d.off <= 50 && d.off % 5 === 0);
	const it = ITEM_BY_ID.get(d.id);
	assert.ok(it && !it.secret && !it.window && it.price <= 100_000);
	const price = Math.round((it.price * (100 - d.off)) / 100);
	assert.equal(priceOf(d.id, T), price);
	const r = buy(undefined, d.id, price, T);
	assert.equal(r.result, 'ok');
	assert.equal(r.state.own[d.id], price);
	assert.equal(shopSpent(r.state), price);
	// the deal moves on: over a month, several different items
	const ids = new Set(Array.from({ length: 30 }, (_, i) => dealOf(dayKey(T + i * 86_400_000)).id));
	assert.ok(ids.size >= 10);
});

test('Munchie Box: an item of the rarity, worn; a duplicate gives half the box back', () => {
	for (const r of ['common', 'rare', 'epic', 'legendary']) {
		const pool = boxPool(r);
		assert.ok(pool.length >= 4 && pool.every((i) => i.rarity === r && !i.secret && !i.window && i.slot !== 'throne' && i.id !== 'title-roller'), r);
	}
	assert.equal(openBox(undefined, 'rare', BOX_PRICE.rare - 1, T, 0.5).result, 'broke');
	const first = openBox(undefined, 'epic', RICH, T, 0);
	assert.equal(first.result, 'ok');
	assert.equal(first.dup, false);
	assert.equal(first.state.own[first.id], BOX_PRICE.epic);
	assert.equal(first.state.eq[ITEM_BY_ID.get(first.id).slot], first.id, 'worn at once');
	const again = openBox(first.state, 'epic', RICH, T + 1, 0);
	assert.equal(again.dup, true);
	assert.equal(again.back, BOX_PRICE.epic / 2);
	assert.equal(shopSpent(again.state), BOX_PRICE.epic + BOX_PRICE.epic / 2, 'paid two boxes, got half of one back');
	assert.deepEqual(roundTrip(again.state), again.state);
});

test('selling back: half of what was paid, taken off, can be bought again; gifts / rewards / guns can’t', () => {
	const it = SHOP_ITEMS.find((i) => i.id === 'aura-gold');
	const bought = buy(undefined, it.id, RICH, T).state;
	const paid = bought.own[it.id];
	assert.equal(sellValue(bought, it.id), Math.floor(paid / 2));
	const sold = sellItem(bought, it.id, T + 10);
	assert.equal(sold.result, 'ok');
	assert.equal(owns(sold.state, it.id), false);
	assert.equal(sold.state.eq.aura, undefined, 'taken off');
	assert.equal(shopSpent(sold.state), paid - Math.floor(paid / 2));
	assert.equal(sellItem(sold.state, it.id, T + 11).result, 'no', 'not twice');
	assert.equal(equip(sold.state, 'aura', it.id, T + 12), null, 'can’t wear what you sold');
	// buy it again: owned again, a second sale gives half of the second price
	const re = buy(sold.state, it.id, RICH, T + 20).state;
	assert.equal(owns(re, it.id), true);
	const p2 = priceOf(it.id, T + 20);
	assert.equal(sellValue(re, it.id), Math.floor(p2 / 2));
	assert.deepEqual(roundTrip(re), re);
	// two devices: one sold, the other didn't → sold (and taken off)
	const merged = mergeShop(bought, sold.state);
	assert.equal(owns(merged, it.id), false);
	assert.equal(merged.eq.aura, undefined);
	// a gift (paid 0) can't be sold
	const gifted = claimGifts(undefined, [['gift0001', B, { i: 'pin-skull', to: A, at: T, p: 2000 }]], T);
	assert.equal(sellValue(gifted, 'pin-skull'), 0);
	assert.equal(sellItem(gifted, 'pin-skull', T).result, 'no');
});

test('gifts: the giver pays, the friend gets it in their shop once, not worn', () => {
	const r = giveItem(undefined, 'pin-crown', B, undefined, RICH, T, 'gift0001');
	assert.equal(r.result, 'ok');
	const price = priceOf('pin-crown', T);
	assert.equal(shopSpent(r.state), price, 'the giver paid');
	assert.equal(owns(r.state, 'pin-crown'), false, 'not the giver’s');
	const members = { [A]: { shop: r.state }, [B]: {} };
	const list = giftsFor(B, undefined, members);
	assert.equal(list.length, 1);
	const mine = claimGifts(undefined, list, T + 5);
	assert.equal(owns(mine, 'pin-crown'), true);
	assert.equal(mine.eq.badge, undefined, 'not worn');
	assert.equal(shopSpent(mine), 0, 'free for the friend');
	assert.equal(giftsFor(B, mine, members).length, 0, 'claimed once');
	assert.equal(giveItem(r.state, 'pin-crown', B, mine, RICH, T + 6, 'gift0002').result, 'owned');
	assert.equal(giveItem(undefined, 'pin-crown', B, undefined, price - 1, T, 'gift0003').result, 'broke');
	assert.deepEqual(roundTrip(r.state), r.state);
	assert.deepEqual(roundTrip(mine), mine);
});

test('outfits: save what you wear, wear it back (only what you still own)', () => {
	let s = buy(undefined, 'aura-gold', RICH, T).state;
	s = buy(s, 'pin-skull', RICH, T + 1).state;
	s = saveFit(s, 1, T + 2);
	s = equip(s, 'aura', null, T + 3);
	s = equip(s, 'badge', null, T + 4);
	const back = wearFit(s, 1, T + 5);
	assert.deepEqual(back.eq, { aura: 'aura-gold', badge: 'pin-skull' });
	assert.equal(wearFit(s, 0, T), null, 'an empty outfit');
	const sold = sellItem(back, 'pin-skull', T + 6).state;
	assert.deepEqual(wearFit(sold, 1, T + 7).eq, { aura: 'aura-gold' });
	assert.deepEqual(roundTrip(back), back);
});

test('the ad space: cleaned text, the latest ad within 24 h runs', () => {
	assert.equal(cleanAdText('  hi\n\tthere  ' + 'x'.repeat(80)).length, 60);
	assert.equal(cleanAdText('a\u0000b‮c'), 'a b c');
	assert.equal(buyAd(undefined, '   ', RICH, T).result, 'empty');
	assert.equal(buyAd(undefined, 'Buy my stuff', AD_PRICE - 1, T).result, 'broke');
	const a = buyAd(undefined, 'Abscar rules', RICH, T).state;
	const b = buyAd(undefined, 'No, Ingman rules', RICH, T + 60_000).state;
	assert.equal(shopSpent(a), AD_PRICE);
	const members = { [A]: { shop: a }, [B]: { shop: b } };
	assert.deepEqual(adOf(members, T + 120_000), { id: B, t: 'No, Ingman rules', at: T + 60_000 });
	assert.equal(adOf(members, T + 25 * 3_600_000), null, 'over after a day');
	assert.deepEqual(roundTrip(a), a);
});

test('holiday items: only in their window; owners keep them', () => {
	const xmas = new Date(2026, 11, 10, 12).getTime();
	const ny = new Date(2027, 0, 2, 12).getTime();
	assert.equal(windowOpen('xmas', T), false);
	assert.equal(windowOpen('xmas', xmas), true);
	assert.equal(windowOpen('newyear', ny), true);
	assert.equal(windowOpen('newyear', xmas), false);
	assert.equal(buy(undefined, 'hat-santa', RICH, T).result, 'closed');
	const got = buy(undefined, 'hat-santa', RICH, xmas).state;
	assert.equal(owns(got, 'hat-santa'), true);
	assert.equal(worn(got).hat?.id, 'hat-santa');
	assert.equal(buyable(ITEM_BY_ID.get('fx-newyear'), ny), true);
});

test('rewards: the whole 420 collection → 420 Legend + Legend Haze; the throne → its title', () => {
	assert.equal(buy(undefined, 'title-420legend', RICH, T).result, 'unknown', 'never sold');
	let s;
	for (const id of COLLECTION_420.slice(0, -1)) s = buy(s, id, RICH, T).state;
	assert.equal(grantRewards(s, T), s, 'not yet');
	s = buy(s, COLLECTION_420.at(-1), RICH, T).state;
	const g = grantRewards(s, T);
	assert.equal(owns(g, 'title-420legend'), true);
	assert.equal(owns(g, 'aura-420legend'), true);
	assert.equal(trophies(g).c420, true);
	const spent = shopSpent(s);
	assert.equal(shopSpent(g), spent, 'free');
	const th = buy(undefined, 'throne-abscar', 100_000_000, T).state;
	assert.equal(owns(th, 'title-throne'), true, 'the title comes with it');
	assert.equal(th.eq.throne, 'throne-abscar');
	assert.equal(trophies(th).throne, true);
	assert.equal(trophies(th).spent10m, true);
});

test('new pranks: on for their time, Mmmph’s times for the radio', () => {
	const s = throwPrank(undefined, 'mmmph', B, RICH, T, 'pr0001').state;
	const s2 = throwPrank(s, 'flip', B, RICH, T, 'pr0002').state;
	const members = { [A]: { shop: s2 } };
	const on = pranksOn(B, members, T + 60_000);
	assert.ok(on.mmmph && on.flip);
	assert.equal(pranksOn(B, members, T + 31 * 60_000).mmmph, undefined, 'Mmmph lasts half an hour');
	assert.ok(pranksOn(B, members, T + 31 * 60_000).flip, 'Upside Down an hour');
	assert.deepEqual(prankTimes(B, 'mmmph', members), [[T, T + 30 * 60_000]]);
});

test('everything new survives the squad document and two devices', () => {
	let s = buy(undefined, 'aura-gold', RICH, T).state;
	s = openBox(s, 'rare', RICH, T + 1, 0.3).state;
	s = giveItem(s, 'pin-crown', B, undefined, RICH, T + 2, 'gift0001').state;
	s = buyAd(s, 'GG', RICH, T + 3).state;
	s = saveFit(s, 0, T + 4);
	s = sellItem(s, 'aura-gold', T + 5).state;
	const e = memberEntry({ name: 'Abscar', op: 'abscar' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { shop: s });
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { [A]: e } })))).members[A].shop;
	assert.deepEqual(back, s);
	// the other device bought something else meanwhile: both kept, the sale kept
	const other = buy(undefined, 'pin-skull', RICH, T + 6).state;
	const m = mergeShop(other, back);
	assert.equal(owns(m, 'pin-skull'), true);
	assert.equal(owns(m, 'aura-gold'), false);
	assert.ok(m.gifts && m.ad && m.boxes && m.fits);
});
