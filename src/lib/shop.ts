/**
 * BurgiShop (2026-11-16, the user's ask: "a shop where you can buy cosmetics with your burgers, that you
 * can then equip on your operator"). Pretend burgers from the squad's burger bank (squad-fun.ts), never
 * money. What you buy is yours to keep; one item per slot is worn on your header operator (OperatorTag,
 * OpGear.svelte): an aura behind the emblem, an effect around it, a pin on it, a style for the callsign
 * and a title under it.
 *
 * Stored as member field `shop` (squad-codec.ts): what you own with the price paid (so a later price
 * change never moves anyone's balance), what's worn, and when that last changed. Spending goes to the
 * house (Abscar) like casino losses. Kept on the device too (`mw4-camo-grind:shop`); two devices merge:
 * everything owned on either, the worn set of the later change.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/shop.test.js). Doesn't import
 * squad-codec.ts (which imports this file).
 */

export const SLOTS = ['aura', 'effect', 'badge', 'name', 'title'] as const;
export type ShopSlot = (typeof SLOTS)[number];
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
	id: string;
	slot: ShopSlot;
	name: string;
	price: number;
	rarity: Rarity;
	/** For titles: the words on the plate. */
	text?: string;
}

const item = (id: string, slot: ShopSlot, name: string, price: number, rarity: Rarity, text?: string): ShopItem => ({ id, slot, name, price, rarity, ...(text ? { text } : {}) });

/** The catalogue. Never reuse an id for something else: owned items are kept by id. */
export const SHOP_ITEMS: ShopItem[] = [
	// auras: a glow behind the emblem
	item('aura-gold', 'aura', 'Golden Glow', 400, 'rare'),
	item('aura-toxic', 'aura', 'Toxic Cloud', 600, 'rare'),
	item('aura-neon', 'aura', 'Neon Pulse', 900, 'epic'),
	item('aura-fire', 'aura', 'Hellfire', 1500, 'epic'),
	item('aura-iri', 'aura', 'Iridescent', 3000, 'legendary'),
	item('aura-storm', 'aura', 'Thunderstorm', 4000, 'legendary'),
	// effects: something moving around the emblem
	item('fx-sparkle', 'effect', 'Sparkles', 300, 'common'),
	item('fx-embers', 'effect', 'Embers', 500, 'rare'),
	item('fx-smoke', 'effect', 'Thick Smoke', 800, 'rare'),
	item('fx-burgers', 'effect', 'Burger Orbit', 1200, 'epic'),
	item('fx-diamonds', 'effect', 'Diamond Dust', 2500, 'legendary'),
	// pins: a small badge on the emblem's corner
	item('pin-burger', 'badge', 'Burger Pin', 100, 'common'),
	item('pin-skull', 'badge', 'Skull Pin', 200, 'common'),
	item('pin-7s', 'badge', 'Lucky 7s', 350, 'rare'),
	item('pin-crown', 'badge', 'Crown', 1000, 'epic'),
	item('pin-diamond', 'badge', 'Diamond', 2000, 'epic'),
	item('pin-holk', 'badge', 'Golden Holk', 2500, 'legendary'),
	// name styles: how the callsign is written
	item('name-gold', 'name', 'Gold Letters', 500, 'rare'),
	item('name-chrome', 'name', 'Chrome', 700, 'rare'),
	item('name-toxic', 'name', 'Toxic', 900, 'epic'),
	item('name-fire', 'name', 'Burning Name', 1200, 'epic'),
	item('name-rainbow', 'name', 'Rainbow', 2500, 'legendary'),
	// titles: a plate under the callsign
	item('title-roller', 'title', 'High Roller', 150, 'common', 'High Roller'),
	item('title-goblin', 'title', 'Camo Goblin', 200, 'common', 'Camo Goblin'),
	item('title-ketchup', 'title', 'Ketchup King', 250, 'common', 'Ketchup King'),
	item('title-baron', 'title', 'Burger Baron', 300, 'rare', 'Burger Baron'),
	item('title-degen', 'title', 'Certified Degen', 400, 'rare', 'Certified Degen'),
	item('title-grinder', 'title', 'No-Life Grinder', 500, 'rare', 'No-Life Grinder'),
	item('title-jackpot', 'title', 'Jackpot Junkie', 600, 'epic', 'Jackpot Junkie'),
	item('title-whale', 'title', 'Burger Whale', 5000, 'legendary', 'Burger Whale')
];
export const ITEM_BY_ID: ReadonlyMap<string, ShopItem> = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

export interface ShopState {
	/** Item id → burgers paid. */
	own: Record<string, number>;
	/** What's worn, one per slot (only owned items). */
	eq: Partial<Record<ShopSlot, string>>;
	/** When `eq` last changed (ms). */
	at: number;
}

const ID = /^[a-z0-9-]{2,24}$/;
const PRICE_MAX = 1_000_000;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** A stored or published shop state, cleaned; undefined when nothing is owned. */
export function cleanShop(raw: unknown): ShopState | undefined {
	if (!isObject(raw) || !isObject(raw.own)) return undefined;
	const own: Record<string, number> = {};
	for (const [id, paid] of Object.entries(raw.own)) {
		// unknown ids are kept (a newer page's items), as long as they look like ids
		if (ID.test(id) && Number.isInteger(paid) && (paid as number) >= 0 && (paid as number) <= PRICE_MAX) own[id] = paid as number;
	}
	if (!Object.keys(own).length) return undefined;
	const eq: Partial<Record<ShopSlot, string>> = {};
	if (isObject(raw.eq)) {
		for (const slot of SLOTS) {
			const id = raw.eq[slot];
			if (typeof id === 'string' && own[id] !== undefined && ITEM_BY_ID.get(id)?.slot === slot) eq[slot] = id;
		}
	}
	const at = typeof raw.at === 'number' && Number.isFinite(raw.at) && raw.at > 0 ? Math.round(raw.at) : 0;
	return { own, eq, at };
}

/** Burgers spent in the shop. */
export const shopSpent = (s: ShopState | undefined) => Object.values(s?.own ?? {}).reduce((n, p) => n + p, 0);

export type BuyResult = 'ok' | 'owned' | 'broke' | 'unknown';

/** Buy an item (it's worn at once): the new state, or why not. */
export function buy(s: ShopState | undefined, id: string, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: Exclude<BuyResult, 'ok'> } {
	const it = ITEM_BY_ID.get(id);
	if (!it) return { result: 'unknown' };
	if (s?.own[id] !== undefined) return { result: 'owned' };
	if (balance < it.price) return { result: 'broke' };
	return { result: 'ok', state: { own: { ...s?.own, [id]: it.price }, eq: { ...s?.eq, [it.slot]: id }, at } };
}

/** Wear an owned item in its slot, or take the slot off (id null). Unowned items are refused (null). */
export function equip(s: ShopState | undefined, slot: ShopSlot, id: string | null, at: number): ShopState | null {
	if (!s) return null;
	if (id !== null && (s.own[id] === undefined || ITEM_BY_ID.get(id)?.slot !== slot)) return null;
	const eq = { ...s.eq };
	if (id === null) delete eq[slot];
	else eq[slot] = id;
	return { ...s, eq, at };
}

/** Two copies of your shop (two devices): everything owned on either (the higher price paid), the later worn set. */
export function mergeShop(a: ShopState | undefined, b: ShopState | undefined): ShopState | undefined {
	if (!a || !b) return a ?? b;
	const own = { ...a.own };
	for (const [id, p] of Object.entries(b.own)) own[id] = Math.max(own[id] ?? 0, p);
	return { own, eq: b.at > a.at ? { ...b.eq } : { ...a.eq }, at: Math.max(a.at, b.at) };
}

/** What a member wears, as items (only known, owned ones). */
export function worn(s: ShopState | undefined): Partial<Record<ShopSlot, ShopItem>> {
	const out: Partial<Record<ShopSlot, ShopItem>> = {};
	for (const slot of SLOTS) {
		const id = s?.eq[slot];
		const it = id ? ITEM_BY_ID.get(id) : undefined;
		if (it && s?.own[it.id] !== undefined) out[slot] = it;
	}
	return out;
}
