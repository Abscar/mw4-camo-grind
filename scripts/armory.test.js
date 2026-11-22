// The Camo Armory (src/lib/armory.ts): weapons in camo bought with burgers in the game's order, held by the
// operator (shop.ts slot `hold`), stored in the member's shop like every BurgiShop item. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	armorySpent,
	bestCamo,
	buyGun,
	camoIndex,
	gunId,
	gunStatus,
	heldGun,
	ownedCount,
	ARMORY_CAMOS,
	ARMORY_CLASSES,
	ARMORY_WEAPONS,
	GUN_BY_ID,
	GUN_ITEMS
} from '../src/lib/armory.ts';
import { buy, cleanShop, equip, mergeShop, shopSpent, worn, ITEM_BY_ID, PRICE_MAX } from '../src/lib/shop.ts';
import { DIVERGENCE_REQUIRED } from '../src/lib/data/camos.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { WEAPON_LOOKS, camoLook } from '../src/lib/data/weaponLooks.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 20, 20);
const RICH = 1e12;
const G = camoIndex('gold');
const P = camoIndex('platinum');
const HB = camoIndex('harmonicBreak');
const DV = camoIndex('divergence');
const MD = camoIndex('mercurialDrift');

/** Buy in order, failing loudly on anything but 'ok'. */
function buyAll(s, ids) {
	for (const id of ids) {
		const r = buyGun(s, id, RICH, T);
		assert.equal(r.result, 'ok', id);
		s = r.state;
	}
	return s;
}
const cls = (id) => ARMORY_CLASSES.find((c) => c.id === id);
const idsOf = (camo, weapons) => weapons.map((w) => gunId(camo, w));

test('the catalogue: every released weapon in every camo, unique stable ids, gold = 1,000,000, prices climb', () => {
	assert.equal(ARMORY_CAMOS[0].id, 'gold');
	assert.equal(ARMORY_CAMOS[0].price, 1_000_000, 'the user: a Gold weapon costs a million');
	for (let i = 1; i < ARMORY_CAMOS.length; i++) assert.ok(ARMORY_CAMOS[i].price > ARMORY_CAMOS[i - 1].price, ARMORY_CAMOS[i].id);
	// the order is the game's: ladder, Divergence, then the Multiplayer Mastery camos
	assert.deepEqual(
		ARMORY_CAMOS.map((c) => c.id),
		['gold', 'platinum', 'harmonicBreak', 'divergence', 'mercurialDrift', 'polyatomicReforged', 'orionReforged']
	);
	// only weapons that are out (the unreleased event guns have no challenges yet)
	assert.ok(ARMORY_WEAPONS.length > 30 && ARMORY_WEAPONS.length <= WEAPONS.length);
	for (const w of ARMORY_WEAPONS) assert.ok(w.specials.length > 0, w.id);
	assert.equal(GUN_ITEMS.length, ARMORY_CAMOS.length * ARMORY_WEAPONS.length);
	assert.equal(new Set(GUN_ITEMS.map((i) => i.id)).size, GUN_ITEMS.length);
	for (const i of GUN_ITEMS) {
		assert.match(i.id, /^gun-[a-z]{1,2}-\d{1,2}$/, i.id);
		assert.ok(i.id.length <= 24);
		assert.equal(i.slot, 'hold');
		assert.ok(i.price <= PRICE_MAX, 'under shop.ts PRICE_MAX, or a stored price would be dropped');
		assert.equal(ITEM_BY_ID.get(i.id), i, 'worn like every BurgiShop item');
	}
	// ids come from the weapon's permanent slot number
	assert.equal(gunId(G, { slot: 0 }), 'gun-g-0');
	assert.equal(GUN_BY_ID.get('gun-g-0').gun.w, WEAPONS.find((w) => w.slot === 0).id);
	// every gun can be drawn in camo (the CS2-skinned ones get a plain cartoon of the same gun)
	for (const w of ARMORY_WEAPONS) {
		const look = camoLook(w.id);
		assert.ok(look && look.kind !== 'cs2', w.id);
		if (WEAPON_LOOKS[w.id].kind !== 'cs2') assert.equal(look, WEAPON_LOOKS[w.id]);
	}
});

test('Gold is open on any weapon; Platinum needs Gold on every weapon in the class', () => {
	const ars = cls('assault-rifles').weapons;
	const first = ars[0];
	assert.equal(gunStatus(undefined, G, first.id).state, 'open');
	const p0 = gunStatus(undefined, P, first.id);
	assert.equal(p0.state, 'locked');
	assert.deepEqual(p0.lock, { kind: 'class', need: G, left: ars.length, classId: 'assault-rifles' });
	// all ARs but one with Gold: still locked, one left
	let s = buyAll(undefined, idsOf(G, ars.slice(0, -1)));
	assert.equal(gunStatus(s.own, P, first.id).lock.left, 1);
	assert.equal(buyGun(s, gunId(P, first), RICH, T).result, 'locked', 'the order can’t be skipped');
	assert.equal(buy(s, gunId(P, first), RICH, T).result, 'unknown', 'nor bought through the plain shop buy');
	s = buyAll(s, [gunId(G, ars.at(-1))]);
	assert.equal(gunStatus(s.own, P, first.id).state, 'open');
	// another class stays shut
	const smg = cls('smgs').weapons[0];
	assert.equal(gunStatus(s.own, P, smg.id).state, 'locked');
	// HB needs Platinum on every AR
	s = buyAll(s, [gunId(P, first)]);
	assert.equal(gunStatus(s.own, HB, first.id).lock.left, ars.length - 1);
	s = buyAll(s, idsOf(P, ars.slice(1)));
	assert.equal(gunStatus(s.own, HB, first.id).state, 'open');
	assert.equal(buyGun(s, gunId(G, first), RICH, T).result, 'owned');
});

test('Divergence: 33 Harmonic Breaks anywhere, then on a weapon that has HB; Mastery needs the class again', () => {
	let s;
	let hb = 0;
	// buy whole classes up to HB until there are 33 or more
	for (const c of ARMORY_CLASSES) {
		if (hb >= DIVERGENCE_REQUIRED) break;
		s = buyAll(s, [...idsOf(G, c.weapons), ...idsOf(P, c.weapons), ...idsOf(HB, c.weapons)]);
		hb += c.weapons.length;
		if (hb < DIVERGENCE_REQUIRED) {
			const st = gunStatus(s.own, DV, c.weapons[0].id);
			assert.deepEqual(st.lock, { kind: 'count', need: HB, left: DIVERGENCE_REQUIRED - hb });
		}
	}
	assert.equal(ownedCount(s.own, HB).have, hb);
	const withHb = ARMORY_WEAPONS.find((w) => s.own[gunId(HB, w)] !== undefined);
	const withoutHb = ARMORY_WEAPONS.find((w) => s.own[gunId(HB, w)] === undefined);
	assert.equal(gunStatus(s.own, DV, withHb.id).state, 'open');
	if (withoutHb) assert.deepEqual(gunStatus(s.own, DV, withoutHb.id).lock, { kind: 'weapon', need: HB });
	// Mercurial Drift on a weapon: Divergence on every weapon of its class
	const c = ARMORY_CLASSES.find((x) => x.weapons.some((w) => w.id === withHb.id));
	s = buyAll(s, [gunId(DV, withHb)]);
	const md = gunStatus(s.own, MD, withHb.id);
	if (c.weapons.length > 1) assert.equal(md.lock.kind, 'class');
	s = buyAll(s, idsOf(DV, c.weapons.filter((w) => w.id !== withHb.id)));
	assert.equal(gunStatus(s.own, MD, withHb.id).state, 'open');
	assert.equal(bestCamo(s.own, withHb.id), DV);
	assert.equal(bestCamo(s.own, 'nope'), -1);
});

test('buying: costs exactly the price, needs the burgers, is held at once; holding and putting down', () => {
	const w = ARMORY_WEAPONS[0];
	const id = gunId(G, w);
	assert.equal(buyGun(undefined, id, 999_999, T).result, 'broke');
	assert.equal(buyGun(undefined, 'gun-g-999', RICH, T).result, 'unknown');
	const r = buyGun(undefined, id, 1_000_000, T);
	assert.equal(r.result, 'ok');
	assert.equal(r.state.own[id], 1_000_000);
	assert.equal(r.state.eq.hold, id);
	assert.deepEqual(heldGun(r.state), { w: w.id, c: 'gold', id });
	assert.equal(worn(r.state).hold.id, id);
	assert.equal(shopSpent(r.state), 1_000_000);
	assert.equal(armorySpent(r.state), 1_000_000);
	// keeps the rest of the shop (items, pranks)
	const withItem = buy(undefined, 'pin-burger', RICH, T).state;
	const both = buyGun(withItem, id, RICH, T + 1).state;
	assert.equal(both.eq.badge, 'pin-burger');
	assert.equal(shopSpent(both), 1_000_000 + 1000);
	assert.equal(armorySpent(both), 1_000_000);
	// put it down, pick it up again; a gun you don't own can't be held
	const down = equip(both, 'hold', null, T + 2);
	assert.equal(heldGun(down), null);
	assert.equal(equip(down, 'hold', id, T + 3).eq.hold, id);
	assert.equal(equip(down, 'hold', gunId(P, w), T + 3), null);
	assert.equal(equip(down, 'hold', 'pin-burger', T + 3), null, 'a pin isn’t held');
});

test('stored, merged and published like every BurgiShop item; the house gets what you spend', () => {
	const ars = cls('assault-rifles').weapons;
	const s = buyAll(undefined, idsOf(G, ars));
	const back = cleanShop(JSON.parse(JSON.stringify(s)));
	assert.deepEqual(back.own, s.own);
	assert.equal(back.eq.hold, s.eq.hold);
	// an unknown eq.hold (not owned) is dropped
	assert.equal(cleanShop({ ...s, eq: { hold: 'gun-p-0' } }).eq.hold, undefined);
	// two devices: owned on either, the later held one
	const a = buyAll(undefined, [gunId(G, ars[0])]);
	const b = { ...buyAll(undefined, [gunId(G, ars[1])]), at: T + 10 };
	const m = mergeShop(a, b);
	assert.ok(m.own[gunId(G, ars[0])] && m.own[gunId(G, ars[1])]);
	assert.equal(m.eq.hold, gunId(G, ars[1]));
	// the squad document carries it, and the burger bank takes it off the buyer and gives it to the house
	const entry = memberEntry({ name: 'Ingman', op: 'ingman' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { shop: s });
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { bbbbbbbb2222: entry } }))));
	assert.deepEqual(doc.members.bbbbbbbb2222.shop, s);
	const members = {
		aaaaaaaa1111: { name: 'Abscar', op: 'abscar', weapons: {}, mastery: {} },
		bbbbbbbb2222: { name: 'Ingman', op: 'ingman', weapons: {}, mastery: {}, shop: s }
	};
	const bank = burgerBank({ members: {} }, members);
	assert.equal(bank.bbbbbbbb2222.spent, ars.length * 1_000_000);
	assert.equal(bank.aaaaaaaa1111.house, ars.length * 1_000_000, 'the armory’s burgers go to the house');
});
