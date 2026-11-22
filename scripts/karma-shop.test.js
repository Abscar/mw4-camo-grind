// KarmaShop (src/lib/karma-shop.ts + karmaShopArt.ts + karma-shop.css): the catalogue, hearts from BurgiGives, buying
// with hearts (never burgers), wearing, two devices, the squad document, the kindest list and the drawings.
// `npm test`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
	buyKarmaItem,
	cleanKarmaShop,
	heartsEarned,
	heartsOf,
	kindest,
	heartsSpent,
	mergeKarmaShop,
	ownKarmaItems,
	CAUSE_BONUS,
	HEART_BURGERS,
	KARMA_BY_ID,
	KARMA_ITEMS,
	KARMA_SLOTS
} from '../src/lib/karma-shop.ts';
import { karmaEyes, karmaHat, karmaPet, karmaPin, DRAWN } from '../src/lib/karmaShopArt.ts';
import { buy, cleanShop, equip, mergeShop, shopSpent, worn, ITEM_BY_ID, SHOP_ITEMS, SLOTS } from '../src/lib/shop.ts';
import { eyesItem, hatItem, FACES } from '../src/lib/faceGear.ts';
import { giveTo } from '../src/lib/donations.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 20, 20);
const PROG = { weapons: {}, mastery: {}, lastTickAt: null };

/** A donation book with these gifts (cause → burgers) from one device. */
function gifts(per, device = 'dev-aaaa') {
	let b;
	let i = 0;
	for (const [org, n] of Object.entries(per)) b = giveTo(b, device, `g${i++}`, org, n, Infinity, T + i).book;
	return b;
}

test('the catalogue: own ids, every kind stocked, rarer costs more, nothing shared with BurgiShop', () => {
	assert.equal(new Set(KARMA_ITEMS.map((i) => i.id)).size, KARMA_ITEMS.length);
	assert.equal(new Set(KARMA_ITEMS.map((i) => i.name)).size, KARMA_ITEMS.length, 'no two items share a name');
	const burgiIds = new Set(SHOP_ITEMS.map((i) => i.id));
	const burgiNames = new Set(SHOP_ITEMS.map((i) => i.name));
	for (const i of KARMA_ITEMS) {
		assert.match(i.id, /^k-[a-z0-9-]{2,22}$/, i.id);
		assert.match(i.id, /^[a-z0-9-]{2,24}$/, 'fits BurgiShop’s stored ids');
		assert.ok(!burgiIds.has(i.id) && !burgiNames.has(i.name), `${i.id} is KarmaShop’s own`);
		assert.equal(i.karma, true, i.id);
		assert.ok(SLOTS.includes(i.slot) && KARMA_SLOTS.includes(i.slot), i.id);
		assert.ok(Number.isInteger(i.price) && i.price > 0 && i.price <= 1000, i.id);
		if (i.slot === 'title') assert.ok(i.text, i.id);
		assert.equal(ITEM_BY_ID.get(i.id), i, 'worn and drawn like a BurgiShop item');
	}
	for (const slot of KARMA_SLOTS) assert.ok(KARMA_ITEMS.some((i) => i.slot === slot), slot);
	const rank = { common: 0, rare: 1, epic: 2, legendary: 3 };
	for (const slot of KARMA_SLOTS) {
		const list = KARMA_ITEMS.filter((i) => i.slot === slot);
		for (const a of list) for (const b of list) if (rank[a.rarity] < rank[b.rarity]) assert.ok(a.price < b.price, `${a.id} < ${b.id}`);
	}
	// the burger shop's catalogue is untouched
	assert.ok(SHOP_ITEMS.every((i) => !i.karma));
});

test('hearts: 1 per 1,000 burgers given, +10 once per cause given 1,000, past gifts count', () => {
	assert.deepEqual(heartsEarned(undefined), { given: 0, causes: 0, earned: 0 });
	assert.equal(heartsEarned(gifts({ holk: 999 })).earned, 0);
	assert.deepEqual(heartsEarned(gifts({ holk: 1000 })), { given: 1000, causes: 1, earned: 1 + CAUSE_BONUS });
	// 500 + 500 to two causes = 1 heart, no cause bonus (neither reached 1,000)
	assert.deepEqual(heartsEarned(gifts({ holk: 500, barn: 500 })), { given: 1000, causes: 0, earned: 1 });
	// all five at 10,000 = 50 + 50
	const big = gifts({ holk: 10_000, barn: 10_000, campaign: 10_000, hardcore: 10_000, wrists: 10_000 });
	assert.equal(heartsEarned(big).earned, 50 + 5 * CAUSE_BONUS);
	// two devices add up (each device's own numbers)
	const two = giveTo(gifts({ holk: 1500 }, 'dev-aaaa'), 'dev-bbbb', 'g9', 'holk', 600, Infinity, T).book;
	assert.deepEqual(heartsEarned(two), { given: 2100, causes: 1, earned: 2 + CAUSE_BONUS });
	assert.equal(HEART_BURGERS, 1000);
	// spent comes off, never below zero on show
	assert.deepEqual(heartsOf({ donations: gifts({ holk: 5000 }), karmaShop: { own: { 'k-pin-heart': 5 } } }), { given: 5000, causes: 1, earned: 15, gifted: 0, spent: 5, balance: 10 });
	assert.equal(heartsOf({ karmaShop: { own: { 'k-pin-heart': 5 } } }).balance, 0);
});

test('hearts from the karma bank (2026-11-22): spendable like earned ones, but not "earned"', () => {
	const h = heartsOf({ karmaShop: { own: { 'k-pin-heart': 5 } } }, 200);
	assert.deepEqual(h, { given: 0, causes: 0, earned: 0, gifted: 200, spent: 5, balance: 195 }, 'someone who never gave can shop with gifted hearts');
	assert.equal(heartsOf({ donations: gifts({ holk: 5000 }) }, 100).balance, 115, 'earned + gifted');
	for (const junk of [-5, NaN, Infinity, 1.5]) assert.equal(heartsOf(undefined, junk).gifted, 0);
	const r = buyKarmaItem(undefined, undefined, 'k-pet-cherub', h.balance, T);
	assert.equal(r.result, 'broke', '500 ❤️ needed');
	assert.equal(buyKarmaItem(undefined, undefined, 'k-pet-heart', h.balance, T).result, 'ok');
});

test('buying with hearts: worn at once, owned at 0 burgers, the burger bank never sees it', () => {
	const hearts = heartsOf({ donations: gifts({ holk: 400_000 }) }).balance; // 410
	assert.equal(buyKarmaItem(undefined, undefined, 'k-hat-halo', 349, T).result, 'broke');
	assert.equal(buyKarmaItem(undefined, undefined, 'aura-gold', hearts, T).result, 'unknown', 'a BurgiShop item can’t be bought with hearts');
	assert.equal(buyKarmaItem(undefined, undefined, 'k-nope', hearts, T).result, 'unknown');
	const shopBefore = buy(undefined, 'aura-gold', 999_999, T - 1000).state;
	const withPrank = { ...shopBefore, pranks: { pr01: { k: 'smoke-bomb', to: 'bbbbbbbb2222', at: T - 500, p: 3750 } } };
	const r = buyKarmaItem(undefined, withPrank, 'k-hat-halo', hearts, T);
	assert.equal(r.result, 'ok');
	assert.deepEqual(r.karmaShop, { own: { 'k-hat-halo': 350 } });
	assert.equal(r.shop.own['k-hat-halo'], 0);
	assert.equal(r.shop.eq.hat, 'k-hat-halo');
	assert.equal(r.shop.eq.aura, 'aura-gold', 'what you wore stays on');
	assert.equal(r.shop.at, T);
	assert.ok(r.shop.pranks.pr01, 'pranks thrown are kept');
	assert.equal(shopSpent(r.shop), shopSpent(withPrank), 'no burgers spent');
	assert.equal(heartsSpent(r.karmaShop), 350);
	assert.equal(buyKarmaItem(r.karmaShop, r.shop, 'k-hat-halo', 9999, T).result, 'owned');
	// with no shop yet
	const fresh = buyKarmaItem(undefined, undefined, 'k-title-egg', 8, T);
	assert.deepEqual(fresh.shop, { own: { 'k-title-egg': 0 }, eq: { title: 'k-title-egg' }, at: T });
	// BurgiShop's buy() refuses hearts items
	assert.equal(buy(undefined, 'k-title-egg', 999_999, T).result, 'unknown');
	// worn like any item, and the take-off / wear-again path works
	assert.equal(worn(r.shop).hat.name, 'Halo');
	const off = equip(r.shop, 'hat', null, T + 1);
	assert.equal(worn(off).hat, undefined);
	assert.equal(equip(off, 'hat', 'k-hat-halo', T + 2).eq.hat, 'k-hat-halo');
	assert.equal(equip(off, 'hat', 'k-hat-band', T + 2), null, 'not owned');
	// survives cleaning (the 0-burger price and the worn karma id)
	assert.deepEqual(cleanShop(JSON.parse(JSON.stringify(r.shop))), r.shop);
	// the burger bank: the same balance with or without the karma item
	const donations = gifts({ holk: 400_000 });
	const before = memberEntry({ name: 'Ingman', op: 'ingman' }, PROG, T, false, { shop: withPrank, donations });
	const after = memberEntry({ name: 'Ingman', op: 'ingman' }, PROG, T, false, { shop: r.shop, donations, karmaShop: r.karmaShop });
	const bank = (m) => burgerBank({ members: { ingmanaa1111: m } }, { ingmanaa1111: m }, T).ingmanaa1111;
	assert.equal(bank(after).balance, bank(before).balance);
	assert.equal(bank(after).spent, bank(before).spent);
});

test('two devices, the squad document, pages from before KarmaShop', () => {
	assert.equal(cleanKarmaShop(undefined), undefined);
	assert.equal(cleanKarmaShop({ own: {} }), undefined);
	assert.deepEqual(cleanKarmaShop({ own: { 'k-pin-heart': 5, 'k-future-thing': 70, 'aura-gold': 5, 'k-bad': -1, 'k-x': 1.5 } }), { own: { 'k-pin-heart': 5, 'k-future-thing': 70 } });
	assert.deepEqual(mergeKarmaShop({ own: { 'k-pin-heart': 5 } }, { own: { 'k-pin-heart': 4, 'k-hat-halo': 350 } }), { own: { 'k-pin-heart': 5, 'k-hat-halo': 350 } });
	assert.deepEqual(mergeKarmaShop(undefined, { own: { 'k-pin-heart': 5 } }), { own: { 'k-pin-heart': 5 } });
	// a shop that lost the item gets it back at 0 burgers (and the same object when nothing is missing)
	const k = { own: { 'k-pin-heart': 5, 'k-hat-halo': 350 } };
	const shop = { own: { 'aura-gold': 5200, 'k-pin-heart': 0 }, eq: { aura: 'aura-gold' }, at: T };
	assert.deepEqual(ownKarmaItems(shop, k).own, { 'aura-gold': 5200, 'k-pin-heart': 0, 'k-hat-halo': 0 });
	const whole = ownKarmaItems(shop, k);
	assert.equal(ownKarmaItems(whole, k), whole);
	assert.deepEqual(ownKarmaItems(undefined, { own: { 'k-pin-heart': 5 } }), { own: { 'k-pin-heart': 0 }, eq: {}, at: 0 });
	// two devices' shops: the 0-burger item stays owned
	assert.equal(mergeShop(shop, { own: { 'k-hat-halo': 0 }, eq: { hat: 'k-hat-halo' }, at: T + 5 }).eq.hat, 'k-hat-halo');
	// through the squad document
	const r = buyKarmaItem(undefined, undefined, 'k-pet-cherub', 500, T);
	const e = memberEntry({ name: 'Abscar', op: 'abscar' }, PROG, T, false, { shop: r.shop, karmaShop: r.karmaShop });
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { abscaraa1111: e } })))).members.abscaraa1111;
	assert.deepEqual(back.karmaShop, { own: { 'k-pet-cherub': 500 } });
	assert.equal(worn(back.shop).pet.id, 'k-pet-cherub');
	// read and written back, the karma field stays (pages from before KarmaShop keep it too, as `more`)
	const wire = JSON.parse(JSON.stringify(toSquadWire({ members: { abscaraa1111: e } })));
	wire.members.abscaraa1111.karmaShop = { own: { 'k-pet-cherub': 500 } };
	assert.ok(JSON.stringify(toSquadWire(fromSquadWire(wire))).includes('k-pet-cherub'));
});

test('the kindest list: most hearts first, only givers', () => {
	const rows = kindest({
		aaaaaaaa1111: { name: 'Abscar', donations: gifts({ holk: 3000 }) },
		bbbbbbbb2222: { name: 'Ingman', donations: gifts({ holk: 2000, barn: 2000 }), karmaShop: { own: { 'k-pin-heart': 5, 'k-future': 9 } } },
		cccccccc3333: { name: 'Lars' }
	});
	assert.deepEqual(rows, [
		{ id: 'bbbbbbbb2222', given: 4000, earned: 24, items: 1 },
		{ id: 'aaaaaaaa1111', given: 3000, earned: 13, items: 0 }
	]);
});

test('the drawings: every item has a look, ids scoped, numbers sane', () => {
	const svg = (s, id) => {
		assert.ok(s.length > 80, `${id} draws something`);
		assert.ok(!/NaN|undefined|Infinity/.test(s), `${id}: no broken numbers`);
		for (const ref of s.matchAll(/url\(#([^)]+)\)/g)) assert.ok(s.includes(`id="${ref[1]}"`), `${id}: ${ref[1]} is defined`);
		assert.equal((s.match(/<g[\s>]/g) ?? []).length, (s.match(/<\/g>/g) ?? []).length, `${id}: groups closed`);
	};
	const bySlot = (slot) => KARMA_ITEMS.filter((i) => i.slot === slot).map((i) => i.id);
	assert.deepEqual([...DRAWN.badge].sort(), bySlot('badge').sort());
	assert.deepEqual([...DRAWN.pet].sort(), bySlot('pet').sort());
	assert.deepEqual([...DRAWN.eyes].sort(), bySlot('eyes').sort());
	assert.deepEqual([...DRAWN.hat].sort(), bySlot('hat').sort());
	for (const id of DRAWN.badge) svg(karmaPin('u1', id), id);
	for (const id of DRAWN.pet) svg(karmaPet('u1', id), id);
	for (const [key, face] of Object.entries(FACES)) {
		for (const id of DRAWN.eyes) {
			if (face.eyes) svg(karmaEyes(`u-${key}`, id, face.eyes), `${id} on ${key}`);
			assert.equal(eyesItem(`u-${key}`, id, face.eyes), karmaEyes(`u-${key}`, id, face.eyes), 'faceGear hands it over');
		}
		for (const id of DRAWN.hat) {
			svg(karmaHat(`u-${key}`, id, face.head), `${id} on ${key}`);
			assert.equal(hatItem(`u-${key}`, id, face.head), karmaHat(`u-${key}`, id, face.head), 'faceGear hands it over');
		}
	}
	// ids are scoped: two copies on one page don't share gradients
	assert.ok(!karmaPet('aa', 'k-pet-cherub').includes('id="bb'));
	assert.ok(karmaPin('zz', 'k-pin-medal').includes('id="zz-'));
	assert.equal(karmaPin('u', 'pin-burger'), '', 'BurgiShop’s pins stay ShopPin’s');
	assert.equal(karmaHat('u', null, FACES.abscar.head), '');
	// the CSS-only kinds: karma-shop.css styles every one of them
	const css = readFileSync(new URL('../src/karma-shop.css', import.meta.url), 'utf8');
	for (const i of KARMA_ITEMS) {
		if (i.slot === 'aura') assert.ok(css.includes(`[data-aura='${i.id}']`), i.id);
		if (i.slot === 'effect') assert.ok(css.includes(`[data-effect='${i.id}']`), i.id);
		if (i.slot === 'name') assert.ok(css.includes(`[data-style='${i.id}']`), i.id);
		if (i.slot === 'smoke') assert.ok(css.includes(`[data-smoke='${i.id}']`), i.id);
	}
	assert.equal(KARMA_BY_ID.size, KARMA_ITEMS.length);
});
