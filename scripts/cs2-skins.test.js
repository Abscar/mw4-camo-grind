// The Camo Armory's CS2 Skins tab (src/lib/data/cs2Skins.ts, src/lib/cs2SkinArt.ts, armory.ts buyCs2):
// famous CS2 skins on the guns with a CS2 twin, held by the operator like the camo guns. `npm test`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { armorySpent, buyCs2, cs2Count, cs2ItemId, heldGun, holdName, ARMORY_CAMOS, ARMORY_WEAPONS, CS2_BY_ID, CS2_GROUPS, CS2_ITEMS } from '../src/lib/armory.ts';
import { SKIN_ART } from '../src/lib/cs2SkinArt.ts';
import { CS2_GRADES, CS2_MODEL_NAME, CS2_SKINS, CS2_WEAPON, cs2Name } from '../src/lib/data/cs2Skins.ts';
import { WEAPON_LOOKS } from '../src/lib/data/weaponLooks.ts';
import { buy, cleanShop, equip, giveItem, sellItem, sellValue, shopSpent, worn, ITEM_BY_ID, PRICE_MAX } from '../src/lib/shop.ts';
import { burgerBank } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 22, 20);
const EGGS = { 'fire-serpent': ['ak47'], asiimov: ['m4a4'], blaze: ['deagle', 'r8'], printstream: ['usps'], bloodsport: ['mp7'], 'frost-borre': ['xm1014'], fade: ['karambit'], 'lightning-strike': ['awp'] };
const ORION = ARMORY_CAMOS.find((c) => c.id === 'orionReforged').price;

/** Which parts each CS2 gun drawing paints with P.<part> (read from Cs2Gun.svelte itself). */
function modelParts() {
	const src = readFileSync(new URL('../src/lib/components/Cs2Gun.svelte', import.meta.url), 'utf8');
	const out = {};
	const re = /\{(?:#if|:else if) model === '([a-z0-9]+)'\}([\s\S]*?)(?=\{:else if model ===|\{\/if\}\s*<\/g>)/g;
	for (const [, model, body] of src.matchAll(re)) out[model] = new Set([...body.matchAll(/P\.([a-z]+)/g)].map((m) => m[1]));
	return out;
}

/** Balanced tags, every id scoped to `u`, every url(#…) defined. */
function checkSvg(svg, u, label) {
	const stack = [];
	for (const [, close, tag, , self] of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
		if (self) continue;
		if (close) assert.equal(stack.pop(), tag, `${label}: </${tag}> closes the wrong tag`);
		else stack.push(tag);
	}
	assert.equal(stack.length, 0, `${label}: unclosed ${stack.join(', ')}`);
	const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
	for (const id of ids) assert.ok(id.startsWith(`${u}-`), `${label}: id ${id} isn't scoped`);
	assert.equal(new Set(ids).size, ids.length, `${label}: an id twice`);
	for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.includes(ref), `${label}: url(#${ref}) isn't defined`);
	assert.ok(!/NaN|undefined/.test(svg), `${label}: NaN or undefined in the drawing`);
	return ids;
}

test('the catalogue: famous skins on the guns with a CS2 twin, stable ids, dearer than Orion', () => {
	assert.ok(CS2_SKINS.length >= 50, 'the user asked for all the famous ones');
	assert.equal(new Set(CS2_SKINS.map((s) => s.key)).size, CS2_SKINS.length);
	assert.equal(new Set(CS2_SKINS.map(cs2Name)).size, CS2_SKINS.length, 'no two with the same name');
	const released = new Set(ARMORY_WEAPONS.map((w) => w.id));
	for (const s of CS2_SKINS) {
		const id = cs2ItemId(s);
		assert.match(id, /^cs2-[a-z0-9-]+$/);
		assert.ok(id.length <= 24, `${id}: shop.ts keeps ids of 24 characters at most`);
		assert.ok(s.price >= 100_000_000 && s.price > ORION, `${id}: the user: more than Orion costs`);
		assert.ok(s.price <= PRICE_MAX, `${id}: under PRICE_MAX, or a stored price would be dropped`);
		assert.ok(Number.isInteger(s.price));
		assert.ok(CS2_GRADES[s.grade], s.grade);
		// on the MW4 gun built on the same gun: its weapon is out and its own cartoon is that CS2 gun
		const w = CS2_WEAPON[s.model];
		assert.ok(released.has(w), `${id}: ${w} isn't for sale in the armory`);
		const look = WEAPON_LOOKS[w];
		assert.equal(look.kind, 'cs2', w);
		assert.ok(look.model === s.model || (s.model === 'm4a1s' && look.model === 'm4a4'), `${id} on ${w}`);
		// drawable: an easter egg on its own gun, or one of the tab's drawings
		if (EGGS[s.art]) assert.ok(EGGS[s.art].includes(s.model), `${id}: ${s.art} is drawn for ${EGGS[s.art]}`);
		else assert.ok(SKIN_ART[s.art], `${id}: no drawing for ${s.art}`);
	}
	// every drawing is sold, once
	const used = CS2_SKINS.map((s) => s.art).filter((a) => !EGGS[a]);
	assert.deepEqual([...used].sort(), Object.keys(SKIN_ART).sort());
	// the tab's groups: in the game's weapon order, every skin once, dearest first
	assert.equal(
		CS2_GROUPS.reduce((n, g) => n + g.skins.length, 0),
		CS2_SKINS.length
	);
	for (const g of CS2_GROUPS) for (let i = 1; i < g.skins.length; i++) assert.ok(g.skins[i].price <= g.skins[i - 1].price, `${g.weapon.id} dearest first`);
	assert.equal(CS2_MODEL_NAME.karambit.startsWith('★'), true, 'knives get CS2’s star');
	assert.equal(cs2Name(CS2_BY_ID.get('cs2-ak-case-hardened')), 'AK-47 | Case Hardened (Blue Gem)');
});

test('every drawing: well-formed, ids scoped, references defined, only parts its gun has', () => {
	const parts = modelParts();
	for (const m of Object.keys(CS2_MODEL_NAME)) assert.ok(parts[m]?.size, `found ${m}'s drawing in Cs2Gun.svelte`);
	for (const s of CS2_SKINS) {
		const art = SKIN_ART[s.art];
		if (!art) continue;
		const svg = art.defs('u1');
		const ids = checkSvg(svg, 'u1', s.art);
		assert.equal(art.defs('u1'), svg, `${s.art}: the same picture every time`);
		assert.ok(svg.length < 12_000, `${s.art}: ${svg.length} characters`);
		for (const [part, paint] of Object.entries(art.paint)) {
			assert.ok(parts[s.model].has(part), `${s.art}: ${s.model} has no ${part}`);
			if (paint.startsWith('#')) assert.match(paint, /^#[0-9a-f]{3,6}$/i, s.art);
			else assert.ok(ids.includes(`u1-${paint}`), `${s.art}: ${part} paints with ${paint}, which isn't defined`);
		}
		assert.ok(Object.keys(art.paint).length, `${s.art} paints something`);
	}
});

test('buying: any skin any time, costs exactly its price, held at once; not through the plain shop', () => {
	const sk = CS2_SKINS.find((s) => s.key === 'awp-dragon-lore');
	const id = cs2ItemId(sk);
	assert.equal(buyCs2(undefined, id, sk.price - 1, T).result, 'broke');
	assert.equal(buyCs2(undefined, 'cs2-nope', 1e13, T).result, 'unknown');
	assert.equal(buyCs2(undefined, 'gun-g-0', 1e13, T).result, 'unknown', 'a camo gun goes through buyGun');
	const r = buyCs2(undefined, id, sk.price, T);
	assert.equal(r.result, 'ok');
	assert.equal(r.state.own[id], sk.price);
	assert.equal(r.state.eq.hold, id);
	assert.deepEqual(heldGun(r.state), { w: 'kg-7-vulcan', cs2: 'awp-dragon-lore', id });
	assert.equal(holdName(id), 'AWP | Dragon Lore');
	assert.equal(worn(r.state).hold.id, id);
	assert.equal(shopSpent(r.state), sk.price);
	assert.equal(armorySpent(r.state), sk.price);
	assert.deepEqual(cs2Count(r.state.own, 'kg-7-vulcan'), { have: 1, total: CS2_SKINS.filter((s) => s.model === 'awp').length });
	assert.equal(buyCs2(r.state, id, 1e13, T).result, 'owned');
	// not bought, gifted or sold through the BurgiShop's own buttons
	assert.equal(buy(undefined, id, 1e13, T).result, 'unknown');
	assert.equal(sellValue(r.state, id), 0);
	assert.equal(sellItem(r.state, id, T).result, 'no');
	assert.equal(giveItem(undefined, id, 'abcdefgh1234', undefined, 1e13, T, 'g1234567').result, 'unknown');
	// a second skin: held now; the first can be picked up again
	const kb = cs2ItemId(CS2_SKINS.find((s) => s.key === 'kb-ruby'));
	const two = buyCs2(r.state, kb, 1e13, T + 1).state;
	assert.equal(two.eq.hold, kb);
	assert.equal(equip(two, 'hold', id, T + 2).eq.hold, id);
	assert.equal(equip(two, 'hold', cs2ItemId(CS2_SKINS[0]), T + 2), null, 'not one you don’t own');
	for (const it of CS2_ITEMS) assert.equal(ITEM_BY_ID.get(it.id), it);
});

test('stored with a 10,000,000,000 price, and the house gets it', () => {
	const sk = CS2_SKINS.find((s) => s.key === 'ak-case-hardened');
	assert.equal(sk.price, 10_000_000_000);
	const s = buyCs2(undefined, cs2ItemId(sk), sk.price, T).state;
	const back = cleanShop(JSON.parse(JSON.stringify(s)));
	assert.deepEqual(back.own, s.own, 'a price over the old 100,000,000 cap is kept');
	assert.equal(back.eq.hold, cs2ItemId(sk));
	const members = {
		aaaaaaaa1111: { name: 'Abscar', op: 'abscar', weapons: {}, mastery: {} },
		bbbbbbbb2222: { name: 'Ingman', op: 'ingman', weapons: {}, mastery: {}, shop: s }
	};
	const bank = burgerBank({ members: {} }, members);
	assert.equal(bank.bbbbbbbb2222.spent, sk.price);
	assert.equal(bank.aaaaaaaa1111.house, sk.price);
});
