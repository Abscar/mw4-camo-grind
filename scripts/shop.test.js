// BurgiShop (src/lib/shop.ts): the catalogue, buying, wearing, two devices, the squad document and the
// burger bank (spending goes to the house). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buy, cleanShop, equip, mergeShop, shopSpent, worn, ITEM_BY_ID, SHOP_ITEMS, SLOTS } from '../src/lib/shop.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank, BURGERS } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 16, 20);

test('the catalogue: unique ids, every slot stocked, sane prices, titles have words', () => {
	assert.equal(new Set(SHOP_ITEMS.map((i) => i.id)).size, SHOP_ITEMS.length);
	for (const slot of SLOTS) assert.ok(SHOP_ITEMS.filter((i) => i.slot === slot).length >= 4, slot);
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

test('buying: needs the burgers, once, and is worn at once', () => {
	assert.equal(buy(undefined, 'aura-gold', 399, T).result, 'broke');
	assert.equal(buy(undefined, 'nope', 9999, T).result, 'unknown');
	const r = buy(undefined, 'aura-gold', 400, T);
	assert.equal(r.result, 'ok');
	assert.deepEqual(r.state, { own: { 'aura-gold': 400 }, eq: { aura: 'aura-gold' }, at: T });
	assert.equal(buy(r.state, 'aura-gold', 9999, T).result, 'owned');
	const r2 = buy(r.state, 'aura-fire', 1500, T + 1);
	assert.deepEqual(r2.state.eq, { aura: 'aura-fire' }, 'a new aura replaces the old one on');
	assert.equal(shopSpent(r2.state), 1900);
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
