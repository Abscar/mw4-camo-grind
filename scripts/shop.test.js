// BurgiShop (src/lib/shop.ts): the catalogue, buying, wearing, two devices, the squad document and the
// burger bank (spending goes to the house). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buy, cleanShop, equip, mergeShop, shopSpent, throwPrank, worn, ITEM_BY_ID, PRANKS, SHOP_ITEMS, SLOTS } from '../src/lib/shop.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank, BURGERS } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 16, 20);

test('the catalogue: unique ids, every slot stocked, sane prices, titles have words', () => {
	assert.equal(new Set(SHOP_ITEMS.map((i) => i.id)).size, SHOP_ITEMS.length);
	// every kind is stocked (the sidekicks with three)
	for (const slot of SLOTS) assert.ok(SHOP_ITEMS.filter((i) => i.slot === slot).length >= (slot === 'pet' ? 3 : 4), slot);
	assert.equal(new Set(SHOP_ITEMS.map((i) => i.name)).size, SHOP_ITEMS.length, 'no two items share a name');
	for (const i of SHOP_ITEMS) {
		assert.ok(Number.isInteger(i.price) && i.price > 0, i.id);
		assert.match(i.id, /^[a-z0-9-]{2,24}$/);
		if (i.slot === 'title') assert.ok(i.text, i.id);
	}
	// rarer costs more within a slot
	const rank = { common: 0, rare: 1, epic: 2, legendary: 3 };
	for (const slot of SLOTS) {
		const list = SHOP_ITEMS.filter((i) => i.slot === slot);
		for (const a of list) for (const b of list) if (rank[a.rarity] < rank[b.rarity]) assert.ok(a.price < b.price, `${a.id} < ${b.id}`);
	}
});

test('prices (2026-11-20, ×10–×20 by rarity): each rarity in its band, pranks ×15', () => {
	// common ×10, rare ×13, epic ×16, legendary ×20 of the old prices (100–5,000), rounded
	const band = { common: [1000, 3500], rare: [3900, 10500], epic: [9600, 32000], legendary: [48000, 100000] };
	for (const i of SHOP_ITEMS) {
		if (i.id === 'title-roller') continue; // the user's own pick, below
		const [lo, hi] = band[i.rarity];
		assert.ok(i.price >= lo && i.price <= hi, `${i.id} ${i.rarity} ${i.price} not in ${lo}–${hi}`);
	}
	assert.deepEqual(
		PRANKS.map((p) => [p.id, p.price]),
		[['smoke-bomb', 3750], ['too-high', 6000]]
	);
	// High Roller: 10 million (the user, 2026-11-20), legendary so the titles still go up by rarity
	const roller = ITEM_BY_ID.get('title-roller');
	assert.deepEqual({ price: roller.price, rarity: roller.rarity, text: roller.text }, { price: 10_000_000, rarity: 'legendary', text: 'High Roller' });
	assert.equal(Math.max(...SHOP_ITEMS.map((i) => i.price)), 10_000_000, 'the dearest item');
	assert.equal(Math.min(...SHOP_ITEMS.map((i) => i.price)), 1000, 'the cheapest (Burger Pin)');
	// 10 million survives cleaning (the stored-price cap used to be 1 million) and the squad document
	const rich = buy(undefined, 'title-roller', 10_000_000, T).state;
	assert.equal(buy(undefined, 'title-roller', 9_999_999, T).result, 'broke');
	assert.deepEqual(cleanShop(JSON.parse(JSON.stringify(rich))), rich);
	const e = memberEntry({ name: 'Abscar', op: 'abscar' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { shop: rich });
	assert.equal(fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { aaaaaaaa1111: e } })))).members.aaaaaaaa1111.shop.own['title-roller'], 10_000_000);
	assert.equal(shopSpent(rich), 10_000_000);
	// a prank is paid at its new price
	assert.equal(throwPrank(undefined, 'smoke-bomb', 'bbbbbbbb2222', 3749, T, 'pr01').result, 'broke');
	const p = throwPrank(undefined, 'smoke-bomb', 'bbbbbbbb2222', 3750, T, 'pr01');
	assert.equal(shopSpent(p.state), 3750);
});

test('bought at the old prices: still owned, still worn, nothing refunded or charged', () => {
	// a member who shopped before 2026-11-20 (prices stored as paid)
	const old = { own: { 'aura-gold': 400, 'mouth-goldholk': 2500 }, eq: { aura: 'aura-gold', mouth: 'mouth-goldholk' }, at: T, pranks: { pr01: { k: 'too-high', to: 'bbbbbbbb2222', at: T, p: 400 } } };
	const c = cleanShop(JSON.parse(JSON.stringify(old)));
	assert.deepEqual(c, old, 'cleaning keeps the old prices');
	assert.equal(shopSpent(c), 3300, 'what they spent stays what they paid');
	assert.equal(buy(c, 'aura-gold', 999_999, T + 1).result, 'owned', 'not sold again');
	assert.deepEqual(Object.keys(worn(c)).sort(), ['aura', 'mouth']);
	const wearOff = equip(equip(c, 'aura', null, T + 2), 'aura', 'aura-gold', T + 3);
	assert.equal(wearOff.eq.aura, 'aura-gold', 'can take it off and wear it again');
	assert.equal(wearOff.own['aura-gold'], 400);
	// buying something new now costs the new price, the old ones stay
	const more = buy(c, 'aura-fire', 24000, T + 4).state;
	assert.deepEqual(more.own, { 'aura-gold': 400, 'mouth-goldholk': 2500, 'aura-fire': 24000 });
	assert.equal(shopSpent(more), 3300 + 24000);
	// the same member on a device that never synced the old buys
	assert.deepEqual(mergeShop(c, { own: {}, eq: {}, at: 0 }).own, c.own);
	// the bank: their balance only moves by what they really paid
	const members = { bbbbbbbb2222: { name: 'Ingman', op: 'ingman', weapons: {}, mastery: {}, shop: c } };
	assert.equal(burgerBank({ members: {} }, members).bbbbbbbb2222.spent, 3300);
});

test('buying: needs the burgers, once, and is worn at once', () => {
	assert.equal(buy(undefined, 'aura-gold', 5199, T).result, 'broke');
	assert.equal(buy(undefined, 'nope', 999_999, T).result, 'unknown');
	const r = buy(undefined, 'aura-gold', 5200, T);
	assert.equal(r.result, 'ok');
	assert.deepEqual(r.state, { own: { 'aura-gold': 5200 }, eq: { aura: 'aura-gold' }, at: T });
	assert.equal(buy(r.state, 'aura-gold', 999_999, T).result, 'owned');
	const r2 = buy(r.state, 'aura-fire', 24000, T + 1);
	assert.deepEqual(r2.state.eq, { aura: 'aura-fire' }, 'a new aura replaces the old one on');
	assert.equal(shopSpent(r2.state), 29200);
});

test('the Golden Holk: 50,000 burgers, worn in the mouth next to a pin, survives cleaning and the squad document', () => {
	const it = ITEM_BY_ID.get('mouth-goldholk');
	assert.deepEqual({ slot: it.slot, price: it.price, name: it.name, rarity: it.rarity }, { slot: 'mouth', price: 50000, name: 'Golden Holk', rarity: 'legendary' });
	assert.equal(ITEM_BY_ID.get('pin-holk').name, 'Holk Pin', 'the old pin kept its id, new name');
	assert.equal(buy(undefined, 'mouth-goldholk', 49999, T).result, 'broke');
	const pin = buy(undefined, 'pin-holk', 999_999, T).state;
	const s = buy(pin, 'mouth-goldholk', 999_999, T + 1).state;
	assert.deepEqual(s.eq, { badge: 'pin-holk', mouth: 'mouth-goldholk' });
	assert.equal(shopSpent(s), 100000);
	assert.deepEqual(cleanShop(JSON.parse(JSON.stringify(s))), s);
	assert.equal(worn(s).mouth?.id, 'mouth-goldholk');
	assert.equal(equip(s, 'badge', 'mouth-goldholk', T + 2), null, 'not a pin');
	const entry = memberEntry({ name: 'Abscar', op: 'abscar' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { shop: s });
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { aaaaaaaa1111: entry } }))));
	assert.deepEqual(doc.members.aaaaaaaa1111.shop.eq, { badge: 'pin-holk', mouth: 'mouth-goldholk' });
});

test('the 420 pack 2: one of each new kind worn together, cleaned and sent through the squad document', () => {
	let s;
	for (const id of ['mouth-bong', 'eyes-laser', 'hat-leafcrown', 'smoke-rainbow', 'pet-bud']) s = buy(s, id, 99_999, T).state;
	assert.deepEqual(s.eq, { mouth: 'mouth-bong', eyes: 'eyes-laser', hat: 'hat-leafcrown', smoke: 'smoke-rainbow', pet: 'pet-bud' });
	assert.equal(shopSpent(s), 29000 + 60000 + 48400 + 25500 + 84000);
	assert.deepEqual(cleanShop(JSON.parse(JSON.stringify(s))), s);
	assert.equal(equip(s, 'hat', 'eyes-laser', T + 1), null, 'eyes are not a hat');
	const entry = memberEntry({ name: 'Ingman', op: 'ingman' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { shop: s });
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { cccccccc3333: entry } }))));
	assert.deepEqual(doc.members.cccccccc3333.shop.eq, s.eq);
});

test('wearing: only what you own, in its slot; taking off', () => {
	const s = buy(buy(undefined, 'pin-skull', 9999, T).state, 'title-baron', 9999, T).state;
	assert.equal(equip(s, 'aura', 'aura-gold', T + 1), null, 'not owned');
	assert.equal(equip(s, 'aura', 'pin-skull', T + 1), null, 'wrong slot');
	const off = equip(s, 'badge', null, T + 2);
	assert.deepEqual(off.eq, { title: 'title-baron' });
	const on = equip(off, 'badge', 'pin-skull', T + 3);
	assert.deepEqual(worn(on), { badge: ITEM_BY_ID.get('pin-skull'), title: ITEM_BY_ID.get('title-baron') });
	assert.equal(equip(undefined, 'badge', null, T), null);
});

test('two devices: everything owned on either, the later worn set', () => {
	const pc = { own: { 'aura-gold': 400, 'pin-crown': 1000 }, eq: { aura: 'aura-gold' }, at: T };
	const phone = { own: { 'fx-embers': 500 }, eq: { effect: 'fx-embers' }, at: T + 10 };
	const m = mergeShop(pc, phone);
	assert.deepEqual(Object.keys(m.own).sort(), ['aura-gold', 'fx-embers', 'pin-crown']);
	assert.deepEqual(m.eq, { effect: 'fx-embers' });
	assert.deepEqual(mergeShop(phone, pc), m);
	assert.equal(mergeShop(undefined, undefined), undefined);
});

test('cleaning: bad entries dropped, worn must be owned and in its slot, unknown owned ids kept', () => {
	assert.equal(cleanShop('x'), undefined);
	assert.equal(cleanShop({ own: {} }), undefined);
	const c = cleanShop({
		own: { 'aura-gold': 400, 'future-hat': 999, 'BAD ID': 5, 'pin-7s': -1 },
		eq: { aura: 'aura-gold', badge: 'pin-7s', name: 'aura-gold', title: 'title-whale' },
		at: T
	});
	assert.deepEqual(c, { own: { 'aura-gold': 400, 'future-hat': 999 }, eq: { aura: 'aura-gold' }, at: T });
});

test('the shop travels in the squad document; the bank takes what you spent, the house gets it', () => {
	const shop = { own: { 'aura-iri': 3000, 'title-whale': 5000 }, eq: { aura: 'aura-iri', title: 'title-whale' }, at: T };
	const entry = memberEntry({ name: 'Ingman', op: 'ingman' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { shop });
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { bbbbbbbb2222: entry } }))));
	assert.deepEqual(doc.members.bbbbbbbb2222.shop, shop);
	const members = {
		aaaaaaaa1111: { name: 'Abscar', op: 'abscar', weapons: {}, mastery: {}, shop: { own: { 'pin-burger': 100 }, eq: {}, at: T } },
		bbbbbbbb2222: { name: 'Ingman', op: 'ingman', weapons: {}, mastery: {}, online: { n: 40, last: '2026-11-16' }, shop }
	};
	const bank = burgerBank({ members: {} }, members);
	assert.equal(bank.bbbbbbbb2222.spent, 8000);
	assert.equal(bank.aaaaaaaa1111.spent, 100);
	assert.equal(bank.aaaaaaaa1111.house, 8000, "Ingman's shopping goes to the house; Abscar's own doesn't come back");
	assert.equal(bank.aaaaaaaa1111.balance, BURGERS.start - 100 + 8000);
});
