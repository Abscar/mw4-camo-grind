/**
 * The Camo Armory (2026-11-20, the user: "skapa en flik i burgishoppen där man kan köpa guld, plat,
 * divergence osv skins till vapen som ens operator kan hålla. Dom ska vara jättedyra, ett guldvapen ska
 * vara 1 miljon burgare, och man måste köpa alla guld för att få köpa platinum osv precis som unlocksen i
 * spelet"). A third door in the BurgiShop page tab: buy a weapon in a camo with pretend burgers, and your
 * operator holds the one you pick (OpGear's `hold`, on the header's squad frame, squad cards and the shop).
 *
 * The camos are the game's own ladder: Gold → Platinum → Harmonic Break, then Divergence, then the three
 * Multiplayer Mastery camos (Mercurial Drift → Polyatomic Reforged → Orion Reforged). The order to buy them
 * in (my reading of "like the unlocks in the game", told to the user):
 * - Gold: any weapon, any time.
 * - Every camo after Gold (except Divergence) needs the camo before it on EVERY weapon in that weapon's
 *   class: Platinum on an SMG opens once you own Gold on all the SMGs, and so on (how the classic CoD
 *   ladders gated Platinum on "Gold on every weapon in the category").
 * - Divergence is MW4's own rule: it opens once you own Harmonic Break on DIVERGENCE_REQUIRED (33) weapons
 *   anywhere, and then goes on any weapon that has Harmonic Break.
 * Only weapons that are out count (the unreleased event guns have no challenges yet, steps.ts isReleased):
 * when one comes out, its class needs it too before the next camo there opens, like in the game.
 *
 * Prices: very expensive on purpose (the user: a Gold weapon = 1,000,000 burgers), roughly doubling per
 * step. Stored like every BurgiShop item in the member field `shop` (shop.ts): `own` id → burgers paid,
 * the held one in `eq.hold`. So spending goes to the house (Abscar) like the rest of the shop, and two
 * devices merge the same way. Item ids `gun-<camo key>-<weapon slot>`: the slot is the weapon's permanent
 * number (weapons.ts), so ids never change. Never reuse one.
 *
 * The last tab, CS2 Skins (2026-11-22, data/cs2Skins.ts): famous Counter-Strike skins on the guns that have
 * a CS2 twin, 100,000,000 burgers and up, no order. Item ids `cs2-<key>`, held in the same `hold` slot.
 *
 * Pure (no runes, no browser): tested in scripts/armory.test.js. Imports only types from shop.ts (which
 * imports this file for ITEM_BY_ID).
 */
import { DIVERGENCE, DIVERGENCE_REQUIRED, LADDER, MASTERY, type IconCamo } from './data/camos.ts';
import { CS2_SKINS, CS2_WEAPON, cs2Name, type Cs2Skin } from './data/cs2Skins.ts';
import { CLASSES, WEAPONS, type Weapon } from './data/weapons.ts';
import type { Rarity, ShopItem, ShopState } from './shop.ts';

export interface ArmoryCamo {
	id: IconCamo;
	/** Short key in item ids. Never change. */
	key: string;
	name: string;
	price: number;
	rarity: Rarity;
}

const ladderName = (id: string) => LADDER.find((c) => c.id === id)?.name ?? id;
const masteryName = (id: string) => MASTERY.find((c) => c.id === id)?.name ?? id;

/** The camos in buying order. */
export const ARMORY_CAMOS: readonly ArmoryCamo[] = [
	{ id: 'gold', key: 'g', name: ladderName('gold'), price: 1_000_000, rarity: 'rare' },
	{ id: 'platinum', key: 'p', name: ladderName('platinum'), price: 2_500_000, rarity: 'epic' },
	{ id: 'harmonicBreak', key: 'hb', name: ladderName('harmonicBreak'), price: 5_000_000, rarity: 'epic' },
	{ id: 'divergence', key: 'dv', name: DIVERGENCE.name, price: 10_000_000, rarity: 'legendary' },
	{ id: 'mercurialDrift', key: 'md', name: masteryName('mercurialDrift'), price: 20_000_000, rarity: 'legendary' },
	{ id: 'polyatomicReforged', key: 'pa', name: masteryName('polyatomicReforged'), price: 40_000_000, rarity: 'legendary' },
	{ id: 'orionReforged', key: 'or', name: masteryName('orionReforged'), price: 80_000_000, rarity: 'legendary' }
];
export type ArmoryCamoId = (typeof ARMORY_CAMOS)[number]['id'];
const DIV = ARMORY_CAMOS.findIndex((c) => c.id === 'divergence');
const HB = ARMORY_CAMOS.findIndex((c) => c.id === 'harmonicBreak');

/** A weapon is out when its challenges are known (the same test as steps.ts isReleased). */
const isOut = (w: Weapon) => w.specials.length > 0;
/** The weapons on sale, in the game's order, with their class. */
export const ARMORY_WEAPONS = WEAPONS.filter(isOut);
/** The classes with weapons on sale, each with its weapons. */
export const ARMORY_CLASSES = CLASSES.map((c) => ({ id: c.id, name: c.name, short: c.short, weapons: c.weapons.filter(isOut) })).filter((c) => c.weapons.length);

export const gunId = (camo: number, w: Pick<Weapon, 'slot'>) => `gun-${ARMORY_CAMOS[camo].key}-${w.slot}`;

/** Every weapon in every camo, as BurgiShop items (worn in the slot `hold`). */
export const GUN_ITEMS: ShopItem[] = ARMORY_CAMOS.flatMap((c, i) =>
	ARMORY_WEAPONS.map((w) => ({ id: gunId(i, w), slot: 'hold' as const, name: `${c.name} ${w.name}`, price: c.price, rarity: c.rarity, gun: { w: w.id, c: c.id } }))
);
export const GUN_BY_ID: ReadonlyMap<string, ShopItem & { gun: { w: string; c: IconCamo } }> = new Map(GUN_ITEMS.map((i) => [i.id, i as ShopItem & { gun: { w: string; c: IconCamo } }]));

// ----- the CS2 Skins tab -----

export const cs2ItemId = (s: Pick<Cs2Skin, 'key'>) => `cs2-${s.key}`;
/** Every CS2 skin as a BurgiShop item (worn in `hold`; bought with buyCs2, any time). */
export const CS2_ITEMS: ShopItem[] = CS2_SKINS.map((s) => ({ id: cs2ItemId(s), slot: 'hold' as const, name: cs2Name(s), price: s.price, rarity: 'legendary' as const, cs2: s.key }));
/** A CS2 skin by its item id. */
export const CS2_BY_ID: ReadonlyMap<string, Cs2Skin> = new Map(CS2_SKINS.map((s) => [cs2ItemId(s), s]));
/** The tab's groups: each weapon with a CS2 twin (game order) and its skins, dearest first. */
export const CS2_GROUPS = WEAPONS.map((w) => ({ weapon: w, skins: CS2_SKINS.filter((s) => CS2_WEAPON[s.model] === w.id) })).filter((g) => g.skins.length);

export const isGunId = (id: string | null | undefined): boolean => !!id && (GUN_BY_ID.has(id) || CS2_BY_ID.has(id));
/** A held item's name: a camo gun's or a CS2 skin's. */
export const holdName = (id: string | null | undefined): string => (id ? (GUN_BY_ID.get(id)?.name ?? (CS2_BY_ID.has(id) ? cs2Name(CS2_BY_ID.get(id)!) : '')) : '');

/** The camo's place in ARMORY_CAMOS. */
export const camoIndex = (c: string): number => ARMORY_CAMOS.findIndex((x) => x.id === c);

type Own = Record<string, number> | undefined;
const owns = (own: Own, camo: number, w: Pick<Weapon, 'slot'>) => own?.[gunId(camo, w)] !== undefined;

/** How many weapons you own in a camo: in one class, or everywhere. */
export function ownedCount(own: Own, camo: number, classId?: string): { have: number; total: number } {
	const list = classId ? (ARMORY_CLASSES.find((c) => c.id === classId)?.weapons ?? []) : ARMORY_WEAPONS;
	return { have: list.filter((w) => owns(own, camo, w)).length, total: list.length };
}

/**
 * Why a camo isn't open yet on a weapon:
 * - `class`: you need `need` on every weapon in the class (`left` of them still missing),
 * - `count`: Divergence needs Harmonic Break on DIVERGENCE_REQUIRED weapons (`left` more),
 * - `weapon`: Divergence needs Harmonic Break on this weapon first.
 */
export type GunLock = { kind: 'class'; need: number; left: number; classId: string } | { kind: 'count'; need: number; left: number } | { kind: 'weapon'; need: number };
export type GunStatus = { state: 'owned' } | { state: 'open' } | { state: 'locked'; lock: GunLock };

/** Is this weapon in this camo yours, for sale, or not open yet (and why)? */
export function gunStatus(own: Own, camo: number, weaponId: string): GunStatus {
	const w = ARMORY_WEAPONS.find((x) => x.id === weaponId);
	if (!w || camo < 0 || camo >= ARMORY_CAMOS.length) return { state: 'locked', lock: { kind: 'weapon', need: 0 } };
	if (owns(own, camo, w)) return { state: 'owned' };
	if (camo === 0) return { state: 'open' };
	if (camo === DIV) {
		const hb = ownedCount(own, HB).have;
		if (hb < DIVERGENCE_REQUIRED) return { state: 'locked', lock: { kind: 'count', need: HB, left: DIVERGENCE_REQUIRED - hb } };
		if (!owns(own, HB, w)) return { state: 'locked', lock: { kind: 'weapon', need: HB } };
		return { state: 'open' };
	}
	const cls = ARMORY_CLASSES.find((c) => c.weapons.some((x) => x.id === w.id))!;
	const left = cls.weapons.filter((x) => !owns(own, camo - 1, x)).length;
	return left ? { state: 'locked', lock: { kind: 'class', need: camo - 1, left, classId: cls.id } } : { state: 'open' };
}

/** Is a whole camo shut for a class (every weapon in it locked)? For the camo tabs' little locks. */
export function camoOpenAnywhere(own: Own, camo: number): boolean {
	return ARMORY_WEAPONS.some((w) => gunStatus(own, camo, w.id).state !== 'locked');
}

export type GunBuyResult = 'ok' | 'owned' | 'broke' | 'locked' | 'unknown';

/** Buy a weapon in a camo (held at once): the new shop state, or why not. */
export function buyGun(s: ShopState | undefined, id: string, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: Exclude<GunBuyResult, 'ok'> } {
	const it = GUN_BY_ID.get(id);
	if (!it) return { result: 'unknown' };
	const st = gunStatus(s?.own, camoIndex(it.gun.c), it.gun.w);
	if (st.state === 'owned') return { result: 'owned' };
	if (st.state === 'locked') return { result: 'locked' };
	if (balance < it.price) return { result: 'broke' };
	return { result: 'ok', state: { ...s, own: { ...s?.own, [id]: it.price }, eq: { ...s?.eq, hold: id }, at } };
}

/** Buy a CS2 skin (held at once): no order, only the burgers. */
export function buyCs2(s: ShopState | undefined, id: string, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: Exclude<GunBuyResult, 'ok' | 'locked'> } {
	const sk = CS2_BY_ID.get(id);
	if (!sk) return { result: 'unknown' };
	if (s?.own[id] !== undefined) return { result: 'owned' };
	if (balance < sk.price) return { result: 'broke' };
	return { result: 'ok', state: { ...s, own: { ...s?.own, [id]: sk.price }, eq: { ...s?.eq, hold: id }, at } };
}

/** How many CS2 skins you own (all of them, or on one weapon). */
export function cs2Count(own: Own, weaponId?: string): { have: number; total: number } {
	const list = weaponId ? CS2_SKINS.filter((s) => CS2_WEAPON[s.model] === weaponId) : CS2_SKINS;
	return { have: list.filter((s) => own?.[cs2ItemId(s)] !== undefined).length, total: list.length };
}

/** What a member holds (from their shop's `eq.hold`): a camo gun (weapon id + camo) or a CS2 skin (weapon id + skin key), or null. */
export function heldGun(s: ShopState | undefined): { w: string; c?: IconCamo; cs2?: string; id: string } | null {
	const id = s?.eq.hold;
	if (!id || s?.own[id] === undefined) return null;
	const it = GUN_BY_ID.get(id);
	if (it) return { ...it.gun, id };
	const sk = CS2_BY_ID.get(id);
	return sk ? { w: CS2_WEAPON[sk.model], cs2: sk.key, id } : null;
}

/** Your best camo on a weapon (its highest owned), for the armory's weapon pictures. */
export function bestCamo(own: Own, weaponId: string): number {
	const w = ARMORY_WEAPONS.find((x) => x.id === weaponId);
	if (!w) return -1;
	for (let i = ARMORY_CAMOS.length - 1; i >= 0; i--) if (owns(own, i, w)) return i;
	return -1;
}

/** Burgers spent in the armory (part of shopSpent; shown on its own in the armory). */
export const armorySpent = (s: ShopState | undefined): number => Object.entries(s?.own ?? {}).reduce((n, [id, p]) => n + (GUN_BY_ID.has(id) || CS2_BY_ID.has(id) ? p : 0), 0);
