// BurgiDrip, the clothing store (src/lib/drip.ts + dripArt.ts): the catalogue, prices, buying through BurgiShop,
// and every piece drawn on every operator and on the store's mannequin. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { operatorMarkup } from '../src/lib/abscarOperator.ts';
import { DRIP_BY_ID, DRIP_DEFS, DRIP_ITEMS, DRIP_RACKS, DRIP_SLOTS, dripDealOf, RAID_SETS, setBonus, setCount } from '../src/lib/drip.ts';
import { BODY_AT, dripCard, dripOver, dripUnder, MANNEQUIN_HEAD } from '../src/lib/dripArt.ts';
import { faceOf, FACES, hatItem } from '../src/lib/faceGear.ts';
import { KARMA_ITEMS } from '../src/lib/karma-shop.ts';
import { GUN_ITEMS } from '../src/lib/armory.ts';
import { buy, cleanShop, dayKey, equip, ITEM_BY_ID, mergeShop, priceOf, sellItem, shopSpent, worn, SHOP_ITEMS, WEAR_SLOTS } from '../src/lib/shop.ts';

const KEYS = Object.keys(BODY_AT).filter((k) => k !== 'mannequin');
const AT = Date.UTC(2026, 10, 22, 12);

/** ids unique + scoped to `u`, every url(#…) points at one of them, no broken numbers, tags closed */
function sound(m, u, what) {
	assert.doesNotMatch(m, /NaN|undefined|Infinity|null/, `${what}: a coordinate went wrong`);
	const ids = [...m.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
	assert.equal(new Set(ids).size, ids.length, `${what}: duplicate id`);
	for (const id of ids) assert.ok(id.startsWith(`${u}-`), `${what}: id ${id} isn't scoped`);
	for (const r of [...m.matchAll(/url\(#([^)]+)\)/g)].map((x) => x[1])) assert.ok(ids.includes(r), `${what}: #${r} isn't defined`);
	for (const tag of ['g', 'defs', 'clipPath', 'pattern', 'linearGradient', 'radialGradient', 'text']) {
		assert.equal((m.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length, (m.match(new RegExp(`</${tag}>`, 'g')) ?? []).length, `${what}: <${tag}> left open`);
	}
}

test('the catalogue: about a hundred pieces, ids scoped and never shared with another shop', () => {
	assert.ok(DRIP_DEFS.length >= 100, `${DRIP_DEFS.length} pieces`);
	const ids = DRIP_DEFS.map((d) => d.id);
	assert.equal(new Set(ids).size, ids.length, 'unique ids');
	const others = new Set([...SHOP_ITEMS, ...KARMA_ITEMS, ...GUN_ITEMS].map((i) => i.id));
	for (const d of DRIP_DEFS) {
		assert.match(d.id, /^d-[a-z0-9-]{1,22}$/, `${d.id}: "d-" + a short id`);
		assert.ok(!others.has(d.id), `${d.id}: taken by another shop`);
		assert.ok([...DRIP_SLOTS, 'hat'].includes(d.draw.slot), `${d.id}: slot`);
		assert.ok(DRIP_RACKS.includes(d.rack), `${d.id}: rack`);
		assert.ok(d.name.length >= 3 && d.name.length <= 32, `${d.id}: name length`);
		assert.doesNotMatch(d.name, /supreme|nike|jordan|yeezy|bape|gucci|louis|adidas|balenciaga|off-white|warcraft|lich|blizzard|judgement|tier/i, `${d.id}: no brand or game names`);
		assert.equal(ITEM_BY_ID.get(d.id)?.drip, true, `${d.id}: in ITEM_BY_ID as a drip item`);
	}
	for (const r of DRIP_RACKS) assert.ok(DRIP_DEFS.some((d) => d.rack === r), `rack ${r} has pieces`);
	assert.equal(new Set(DRIP_DEFS.map((d) => d.name)).size, DRIP_DEFS.length, 'unique names');
	for (const slot of DRIP_SLOTS) assert.ok(WEAR_SLOTS.includes(slot), `${slot} is a wear slot`);
});

test('prices: rarer costs more, in bands', () => {
	const band = { common: [1, 20_000], rare: [20_000, 100_000], epic: [100_000, 500_000], legendary: [500_000, 10_000_000], ultimate: [10_000_000, 1_000_000_000] };
	for (const d of DRIP_DEFS) {
		const [lo, hi] = band[d.rarity];
		assert.ok(Number.isInteger(d.price) && d.price >= lo && d.price < hi, `${d.id}: ${d.price} is ${d.rarity}`);
	}
});

test('the raid sets: chest + pauldrons + helm each, and the set bonus needs all three', () => {
	for (const set of Object.keys(RAID_SETS)) {
		const pieces = DRIP_DEFS.filter((d) => d.set === set);
		assert.deepEqual(pieces.map((d) => d.draw.slot).sort(), ['hat', 'shoulders', 'top'], `${set}: three pieces`);
		const [top, shoulders, hat] = ['top', 'shoulders', 'hat'].map((s) => pieces.find((d) => d.draw.slot === s).id);
		assert.equal(setBonus({ top, shoulders, hat }), set);
		assert.equal(setBonus({ top, shoulders, hat: 'hat-rasta' }), null);
		assert.equal(setCount(set, { top, shoulders }), 2);
	}
	assert.equal(setBonus({ top: 'd-rd-judge-c', shoulders: 'd-rd-frost-s', hat: 'd-rd-judge-h' }), null, 'mixed sets: no bonus');
	assert.equal(setBonus(null), null);
});

test('buying: worn at once, kept by cleanShop, merged, sold back, spent counted (to the house)', () => {
	const id = 'd-hd-box';
	const price = priceOf(id, AT);
	assert.equal((buy(undefined, id, price - 1, AT)).result, 'broke');
	const r = buy(undefined, id, 10_000_000, AT);
	assert.equal(r.result, 'ok');
	assert.equal(r.state.eq.top, id);
	assert.equal(r.state.own[id], price);
	assert.equal(shopSpent(r.state), price);
	const r2 = buy(r.state, 'd-rd-doom-h', 10_000_000, AT + 1);
	assert.equal(r2.state.eq.hat, 'd-rd-doom-h', 'a raid helm goes in the shared hat slot');
	const clean = cleanShop(JSON.parse(JSON.stringify(r2.state)));
	assert.equal(clean.eq.top, id);
	assert.equal(clean.eq.hat, 'd-rd-doom-h');
	assert.equal(worn(clean).top?.id, id);
	assert.deepEqual(faceOf(worn(clean)).top, id);
	const off = equip(clean, 'top', null, AT + 2);
	assert.equal(off.eq.top, undefined);
	assert.equal(equip(clean, 'neck', 'd-nk-iced', AT + 2), null, 'not owned: refused');
	const merged = mergeShop(off, r2.state);
	assert.ok(merged.own[id] && merged.own['d-rd-doom-h']);
	const sold = sellItem(clean, id, AT + 3);
	assert.equal(sold.result, 'ok');
	assert.equal(sold.back, Math.floor(price / 2));
	assert.equal(sold.state.eq.top, undefined, 'sold: taken off');
});

test('today’s drop: the same for everyone on a day, 30–50 % off, and buy charges it', () => {
	const day = dayKey(AT);
	const a = dripDealOf(day);
	assert.deepEqual(dripDealOf(day), a);
	assert.ok(DRIP_BY_ID.has(a.id) && a.off >= 30 && a.off <= 50 && a.off % 5 === 0);
	const full = DRIP_BY_ID.get(a.id).price;
	assert.equal(priceOf(a.id, AT), Math.round((full * (100 - a.off)) / 100));
	const other = DRIP_DEFS.find((d) => d.id !== a.id);
	assert.equal(priceOf(other.id, AT), other.price);
	const seen = new Set(Array.from({ length: 40 }, (_, i) => dripDealOf(`2026-12-${String((i % 28) + 1).padStart(2, '0')}`).id));
	assert.ok(seen.size > 10, 'the drop changes from day to day');
});

test('every piece on every operator: drawn, deterministic, ids scoped, references defined, small', () => {
	for (const key of KEYS) {
		for (const d of DRIP_DEFS) {
			const u = `t-${key}`;
			const w = { [d.draw.slot]: d.id };
			let m;
			if (d.draw.slot === 'hat') m = hatItem(u, d.id, FACES[key].head);
			else if (d.draw.slot === 'shoulders') m = dripOver(u, w, key);
			else m = dripUnder(u, w, key);
			assert.ok(m.length > 100, `${key} × ${d.id}: drawn`);
			assert.ok(m.length < 24_000, `${key} × ${d.id}: ${m.length} chars`);
			const again = d.draw.slot === 'hat' ? hatItem(u, d.id, FACES[key].head) : d.draw.slot === 'shoulders' ? dripOver(u, w, key) : dripUnder(u, w, key);
			assert.equal(again, m, `${key} × ${d.id}: deterministic`);
			sound(m, u, `${key} × ${d.id}`);
		}
	}
	assert.equal(dripUnder('t', null, 'lars'), '', 'nothing worn: nothing drawn');
	assert.equal(dripOver('t', { top: 'd-hd-box' }, 'lars'), '', 'no pauldrons: nothing over the head');
	assert.equal(dripUnder('t', { top: 'd-from-the-future' }, 'lars'), '', 'an unknown id draws nothing');
	assert.equal(hatItem('t', 'd-from-the-future', FACES.lars.head), '');
});

test('a whole outfit at once, with a full set sparkling', () => {
	const w = { top: 'd-rd-frost-c', neck: 'd-nk-iced', kicks: 'd-kk-gold', shoulders: 'd-rd-frost-s', hat: 'd-rd-frost-h' };
	for (const key of KEYS) {
		const u = `fit-${key}`;
		const m = dripUnder(u, w, key) + dripOver(u, w, key) + hatItem(u, w.hat, FACES[key].head);
		sound(m, u, `${key} outfit`);
		assert.match(dripOver(u, w, key), /dr-setglow/, `${key}: the set bonus glows`);
		assert.doesNotMatch(dripOver(u, { ...w, hat: 'd-rd-judge-h' }, key), /dr-setglow/, `${key}: a mixed set doesn't`);
	}
});

test('Abscar: clothes go over the ghillie, before his holk, which stays', () => {
	const body = dripUnder('aop-x', { top: 'd-puf-gold', shoulders: 'd-rd-doom-s' }, 'abscar') + dripOver('aop-x', { top: 'd-puf-gold', shoulders: 'd-rd-doom-s' }, 'abscar');
	const plain = operatorMarkup('ghillie', 'x', 0.9, { holk: 'white' });
	const dressed = operatorMarkup('ghillie', 'x', 0.9, { holk: 'white', body });
	assert.ok(dressed.includes(body), 'the clothes are in');
	assert.equal(dressed.replace(body, ''), plain, 'nothing else changed');
	assert.ok(dressed.indexOf(body) < dressed.lastIndexOf('#f3efe4'), 'the holk is drawn after the clothes');
	const gold = operatorMarkup('ghillie', 'x', 0.9, { holk: 'gold', body });
	assert.ok(gold.includes(body) && gold.includes('-hg'), 'with the Golden Holk too');
	const none = operatorMarkup('ghillie', 'x', 0.9, { holk: 'none', body });
	assert.ok(none.includes(body) && !none.includes('#f3efe4'), 'something else in his mouth: no holk, clothes still on');
});

test('the store’s pictures: one per piece, a viewBox, sound markup', () => {
	for (const d of DRIP_DEFS) {
		const c = dripCard(`c-${d.id}`, d.id);
		assert.ok(c, d.id);
		assert.match(c.vb, /^-?\d+(\.\d+)? -?\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/, `${d.id}: viewBox`);
		sound(c.markup, `c-${d.id}`, `${d.id} picture`);
	}
	assert.equal(dripCard('c', 'd-nope'), null);
	assert.ok(MANNEQUIN_HEAD.w > 0);
});

test('the Kush Crown: the one ultimate piece, a hat for 100,000,000, never the daily drop', () => {
	const ult = DRIP_DEFS.filter((d) => d.rarity === 'ultimate');
	assert.deepEqual(ult.map((d) => d.id), ['d-hat-kushcrown']);
	const c = DRIP_BY_ID.get('d-hat-kushcrown');
	assert.equal(c.price, 100_000_000);
	assert.equal(c.draw.slot, 'hat');
	assert.ok(DRIP_DEFS.every((d) => d === c || d.price < c.price), 'the dearest piece in the store');
	for (let i = 1; i <= 400; i++) assert.notEqual(dripDealOf(`2027-${i}`).id, c.id);
	const r = buy(undefined, c.id, 100_000_000, AT);
	assert.equal(r.result, 'ok');
	assert.equal(r.state.own[c.id], 100_000_000);
	assert.equal(cleanShop(JSON.parse(JSON.stringify(r.state))).own[c.id], 100_000_000, 'a 100M purchase survives cleaning');
	for (const key of KEYS) assert.match(hatItem(`kc-${key}`, c.id, FACES[key].head), /dr-glow/, `${key}: it glows`);
});

test('DRIP_ITEMS mirror the catalogue', () => {
	assert.equal(DRIP_ITEMS.length, DRIP_DEFS.length);
	for (const it of DRIP_ITEMS) {
		const d = DRIP_BY_ID.get(it.id);
		assert.equal(it.slot, d.draw.slot);
		assert.equal(it.price, d.price);
		assert.equal(it.rarity, d.rarity === 'ultimate' ? 'legendary' : d.rarity, `${it.id}: ultimate counts as legendary in the shop`);
	}
});
