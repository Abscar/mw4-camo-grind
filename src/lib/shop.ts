/**
 * BurgiShop (2026-11-16, the user's ask: "a shop where you can buy cosmetics with your burgers, that you
 * can then equip on your operator"). Pretend burgers from the squad's burger bank (squad-fun.ts), never
 * money. What you buy is yours to keep; one item per slot is worn on your header operator (OperatorTag,
 * OpGear.svelte): an aura behind the emblem, an effect around it, a pin on it, something in its mouth,
 * on its eyes and on its head (drawn by the emblem itself, faceGear.ts), a smoke colour, a sidekick on its
 * shoulder, a style for the callsign and a title under it.
 *
 * Stored as member field `shop` (squad-codec.ts): what you own with the price paid (so a later price
 * change never moves anyone's balance), what's worn, and when that last changed. Spending goes to the
 * house (Abscar) like casino losses. Kept on the device too (`mw4-camo-grind:shop`); two devices merge:
 * everything owned on either, the worn set of the later change.
 *
 * Prices (2026-11-20, the user: "öka priserna på allt i shoppen med x10-x20 beroende på rarity", since the
 * slots' party odds made burger balances much bigger): every price went up by rarity, common ×10, rare ×13,
 * epic ×16, legendary ×20, rounded to tidy numbers (the 420 items keep a 420 ending where it fits, Lucky 7s
 * costs 4,777). The one exception is the user's own pick: the High Roller title costs 10 million (made
 * legendary). Within a slot rarer always costs more (shop.test.js). Items bought before keep the price paid.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/shop.test.js). Doesn't import
 * squad-codec.ts (which imports this file).
 */

// eyes / hat / smoke / pet: the 420 pack 2 (2026-11-16); eyes + hat are drawn by the emblems (faceGear.ts),
// smoke tints whatever smokes on them, the pet sits on the shoulder (OpGear + ShopPet)
export const SLOTS = ['aura', 'effect', 'badge', 'mouth', 'eyes', 'hat', 'smoke', 'pet', 'name', 'title'] as const;
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
	item('aura-gold', 'aura', 'Golden Glow', 5200, 'rare'),
	item('aura-toxic', 'aura', 'Toxic Cloud', 7800, 'rare'),
	item('aura-neon', 'aura', 'Neon Pulse', 14500, 'epic'),
	item('aura-fire', 'aura', 'Hellfire', 24000, 'epic'),
	item('aura-iri', 'aura', 'Iridescent', 60000, 'legendary'),
	item('aura-storm', 'aura', 'Thunderstorm', 80000, 'legendary'),
	// effects: something moving around the emblem
	item('fx-sparkle', 'effect', 'Sparkles', 3000, 'common'),
	item('fx-embers', 'effect', 'Embers', 6500, 'rare'),
	item('fx-smoke', 'effect', 'Thick Smoke', 10500, 'rare'),
	item('fx-burgers', 'effect', 'Burger Orbit', 19000, 'epic'),
	item('fx-diamonds', 'effect', 'Diamond Dust', 50000, 'legendary'),
	// pins: a small badge on the emblem's corner
	item('pin-burger', 'badge', 'Burger Pin', 1000, 'common'),
	item('pin-skull', 'badge', 'Skull Pin', 2000, 'common'),
	item('pin-7s', 'badge', 'Lucky 7s', 4777, 'rare'),
	item('pin-crown', 'badge', 'Crown', 16000, 'epic'),
	item('pin-diamond', 'badge', 'Diamond', 32000, 'epic'),
	// renamed from "Golden Holk" (2026-11-16) when the real one went in the mouth; same id, so owners keep it
	item('pin-holk', 'badge', 'Holk Pin', 50000, 'legendary'),
	// in the mouth (2026-11-16, the user: "golden holk in the shop for 2500 burgers", then picked "a gold holk
	// in the mouth"; 50,000 since the 2026-11-20 price rise): drawn by each operator's own emblem at its mouth
	item('mouth-goldholk', 'mouth', 'Golden Holk', 50000, 'legendary'),
	// name styles: how the callsign is written
	item('name-gold', 'name', 'Gold Letters', 6500, 'rare'),
	item('name-chrome', 'name', 'Chrome', 9100, 'rare'),
	item('name-toxic', 'name', 'Toxic', 14500, 'epic'),
	item('name-fire', 'name', 'Burning Name', 19000, 'epic'),
	item('name-rainbow', 'name', 'Rainbow', 50000, 'legendary'),
	// titles: a plate under the callsign
	// 10 million (2026-11-20, the user: "high roller titeln ska kosta 10 miljoner"); was a 150-burger common,
	// made legendary so rarer still costs more within the titles. People who bought it before keep it.
	item('title-roller', 'title', 'High Roller', 10_000_000, 'legendary', 'High Roller'),
	item('title-goblin', 'title', 'Camo Goblin', 2000, 'common', 'Camo Goblin'),
	item('title-ketchup', 'title', 'Ketchup King', 2500, 'common', 'Ketchup King'),
	item('title-baron', 'title', 'Burger Baron', 3900, 'rare', 'Burger Baron'),
	item('title-degen', 'title', 'Certified Degen', 5200, 'rare', 'Certified Degen'),
	item('title-grinder', 'title', 'No-Life Grinder', 6500, 'rare', 'No-Life Grinder'),
	item('title-jackpot', 'title', 'Jackpot Junkie', 9600, 'epic', 'Jackpot Junkie'),
	item('title-whale', 'title', 'Burger Whale', 100000, 'legendary', 'Burger Whale'),
	// the 420 pack (2026-11-16, the user's pick "build the 420 pack": "lots of 420, we like that")
	item('aura-kush', 'aura', 'Kush Cloud', 17500, 'epic'),
	item('fx-leaves', 'effect', 'Leaf Storm', 9100, 'rare'),
	item('fx-munchies', 'effect', 'Munchies', 22500, 'epic'),
	item('pin-brownie', 'badge', 'Space Brownie', 1500, 'common'),
	item('pin-leaf', 'badge', 'Weed Leaf', 1800, 'common'),
	item('pin-grinder', 'badge', 'Grinder', 5420, 'rare'),
	item('pin-420', 'badge', '420 Badge', 22420, 'epic'),
	item('name-rasta', 'name', 'Rasta', 17500, 'epic'),
	item('title-puff', 'title', 'Puff Puff Pass', 1600, 'common', 'Puff Puff Pass'),
	item('title-couch', 'title', 'Couch Commander', 1800, 'common', 'Couch Commander'),
	item('title-snack', 'title', 'Snack Overflow', 2200, 'common', 'Snack Overflow'),
	item('title-stoner', 'title', 'Certified Stoner', 5420, 'rare', 'Certified Stoner'),
	item('title-baked', 'title', 'Ranked While Baked', 5420, 'rare', 'Ranked While Baked'),
	item('title-hotbox', 'title', 'Hotbox Hero', 6200, 'rare', 'Hotbox Hero'),
	item('title-blazed', 'title', 'Blazed & Amazed', 10500, 'epic', 'Blazed & Amazed'),
	item('title-holklord', 'title', 'Holk Lord', 84000, 'legendary', 'Holk Lord'),
	// the 420 pack 2 (2026-11-16, the user: "kör 420 paketet"): the mouthpieces, eyes, hats, smoke colours
	// and shoulder sidekicks left over from the first pack. Face items are drawn per emblem (faceGear.ts).
	// "Cloud Nine" is the pack list's "Snoop mode", named without a real person's name.
	item('mouth-blunt', 'mouth', 'Blunt', 5900, 'rare'),
	item('mouth-pipe', 'mouth', 'Long Pipe', 7800, 'rare'),
	item('mouth-double', 'mouth', 'Double Holk', 17500, 'epic'),
	item('mouth-bong', 'mouth', 'Bong', 29000, 'epic'),
	item('mouth-cloud9', 'mouth', 'Cloud Nine', 84000, 'legendary'),
	item('eyes-shades', 'eyes', 'Shades', 2500, 'common'),
	item('eyes-rasta', 'eyes', 'Rasta Shades', 6500, 'rare'),
	item('eyes-baked', 'eyes', 'Baked Eyes', 8500, 'rare'),
	item('eyes-laser', 'eyes', 'Laser Eyes', 60000, 'legendary'),
	item('hat-bucket', 'hat', 'Tie-Dye Bucket', 3500, 'common'),
	item('hat-rasta', 'hat', 'Rasta Beanie', 7800, 'rare'),
	item('hat-propeller', 'hat', 'Propeller Cap', 19000, 'epic'),
	item('hat-leafcrown', 'hat', 'Leaf Crown', 48400, 'legendary'),
	item('smoke-green', 'smoke', 'Green Smoke', 3000, 'common'),
	item('smoke-purple', 'smoke', 'Purple Haze', 9100, 'rare'),
	item('smoke-rainbow', 'smoke', 'Rainbow Smoke', 25500, 'epic'),
	item('smoke-gold', 'smoke', 'Golden Smoke', 52000, 'legendary'),
	item('pet-burger', 'pet', 'Burger Buddy', 9100, 'rare'),
	item('pet-smokey', 'pet', 'Smokey', 22500, 'epic'),
	item('pet-bud', 'pet', 'Lil’ Bud', 84000, 'legendary')
];

/**
 * Pranks (the 420 pack): bought once per use and thrown at another squad member. A Smoke Bomb covers
 * their operator in smoke for an hour; TOO HIGH TO PLAY stamps them for a day (like the BANNED stamp).
 */
export const PRANKS = [
	// ×15 on 2026-11-20 (were 250 / 400; pranks have no rarity, so the middle of the shop's ×10–×20)
	{ id: 'smoke-bomb', name: 'Smoke Bomb', price: 3750, hours: 1 },
	{ id: 'too-high', name: 'TOO HIGH TO PLAY', price: 6000, hours: 24 }
] as const;
export type PrankKind = (typeof PRANKS)[number]['id'];
export const PRANK_BY_ID: ReadonlyMap<string, (typeof PRANKS)[number]> = new Map(PRANKS.map((p) => [p.id, p]));
/** One thrown prank: which, at whom (member id), when, burgers paid. */
export interface Prank {
	k: PrankKind;
	to: string;
	at: number;
	p: number;
}
/** Pranks kept in the list (the newest); older ones only count as burgers spent (`pOld`). */
export const PRANK_KEEP = 30;
export const ITEM_BY_ID: ReadonlyMap<string, ShopItem> = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

export interface ShopState {
	/** Item id → burgers paid. */
	own: Record<string, number>;
	/** What's worn, one per slot (only owned items). */
	eq: Partial<Record<ShopSlot, string>>;
	/** When `eq` last changed (ms). */
	at: number;
	/** Pranks thrown (prank id → prank), the newest PRANK_KEEP. */
	pranks?: Record<string, Prank>;
	/** Burgers paid for pranks that dropped off the list. */
	pOld?: number;
}

const ID = /^[a-z0-9-]{2,24}$/;
// a sanity cap on stored prices (was 1,000,000; raised for the 10-million High Roller title, 2026-11-20)
const PRICE_MAX = 100_000_000;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

const MEMBER_ID = /^[A-Za-z0-9_-]{8,32}$/;
const PRANK_ID = /^[A-Za-z0-9_-]{4,16}$/;

/** Newest PRANK_KEEP pranks; the burgers of the dropped ones move to `pOld`. */
function prunePranks(pranks: Record<string, Prank>, pOld: number): { pranks: Record<string, Prank>; pOld: number } {
	const list = Object.entries(pranks).sort(([, a], [, b]) => b.at - a.at);
	const keep = list.slice(0, PRANK_KEEP);
	const gone = list.slice(PRANK_KEEP).reduce((n, [, p]) => n + p.p, 0);
	return { pranks: Object.fromEntries(keep), pOld: pOld + gone };
}

function cleanPranks(raw: unknown): Record<string, Prank> {
	const out: Record<string, Prank> = {};
	if (!isObject(raw)) return out;
	for (const [id, p] of Object.entries(raw)) {
		if (!PRANK_ID.test(id) || !isObject(p) || !PRANK_BY_ID.has(p.k as string) || typeof p.to !== 'string' || !MEMBER_ID.test(p.to)) continue;
		if (typeof p.at !== 'number' || !Number.isFinite(p.at) || p.at <= 0 || !Number.isInteger(p.p) || (p.p as number) < 0 || (p.p as number) > PRICE_MAX) continue;
		out[id] = { k: p.k as PrankKind, to: p.to, at: Math.round(p.at), p: p.p as number };
	}
	return out;
}

/** A stored or published shop state, cleaned; undefined when nothing was ever bought. */
export function cleanShop(raw: unknown): ShopState | undefined {
	if (!isObject(raw)) return undefined;
	const own: Record<string, number> = {};
	for (const [id, paid] of Object.entries(isObject(raw.own) ? raw.own : {})) {
		// unknown ids are kept (a newer page's items), as long as they look like ids
		if (ID.test(id) && Number.isInteger(paid) && (paid as number) >= 0 && (paid as number) <= PRICE_MAX) own[id] = paid as number;
	}
	const pruned = prunePranks(cleanPranks(raw.pranks), Number.isInteger(raw.pOld) && (raw.pOld as number) > 0 ? Math.min(raw.pOld as number, PRICE_MAX * 100) : 0);
	if (!Object.keys(own).length && !Object.keys(pruned.pranks).length && !pruned.pOld) return undefined;
	const eq: Partial<Record<ShopSlot, string>> = {};
	if (isObject(raw.eq)) {
		for (const slot of SLOTS) {
			const id = raw.eq[slot];
			if (typeof id === 'string' && own[id] !== undefined && ITEM_BY_ID.get(id)?.slot === slot) eq[slot] = id;
		}
	}
	const at = typeof raw.at === 'number' && Number.isFinite(raw.at) && raw.at > 0 ? Math.round(raw.at) : 0;
	const out: ShopState = { own, eq, at };
	if (Object.keys(pruned.pranks).length) out.pranks = pruned.pranks;
	if (pruned.pOld) out.pOld = pruned.pOld;
	return out;
}

/** Burgers spent in the shop (items + pranks). */
export const shopSpent = (s: ShopState | undefined) =>
	Object.values(s?.own ?? {}).reduce((n, p) => n + p, 0) + Object.values(s?.pranks ?? {}).reduce((n, p) => n + p.p, 0) + (s?.pOld ?? 0);

/** Throw a prank at another member (paid once per throw). */
export function throwPrank(
	s: ShopState | undefined,
	kind: string,
	to: string,
	balance: number,
	at: number,
	id: string
): { state: ShopState; result: 'ok' } | { result: 'broke' | 'unknown' } {
	const def = PRANK_BY_ID.get(kind);
	if (!def || !MEMBER_ID.test(to) || !PRANK_ID.test(id)) return { result: 'unknown' };
	if (balance < def.price) return { result: 'broke' };
	const base: ShopState = s ?? { own: {}, eq: {}, at: 0 };
	const pruned = prunePranks({ ...base.pranks, [id]: { k: def.id, to, at, p: def.price } }, base.pOld ?? 0);
	const state: ShopState = { ...base, pranks: pruned.pranks };
	if (pruned.pOld) state.pOld = pruned.pOld;
	return { result: 'ok', state };
}

export interface ActivePrank {
	by: string;
	until: number;
}

/** The pranks on a member right now (the latest of each kind), from everyone's shop lists. */
export function pranksOn(target: string, members: Record<string, { shop?: ShopState }>, now: number): Partial<Record<PrankKind, ActivePrank>> {
	const out: Partial<Record<PrankKind, ActivePrank>> = {};
	for (const [by, m] of Object.entries(members)) {
		for (const p of Object.values(m.shop?.pranks ?? {})) {
			if (p.to !== target) continue;
			const def = PRANK_BY_ID.get(p.k);
			if (!def) continue;
			const until = p.at + def.hours * 3_600_000;
			if (p.at <= now + 60_000 && until > now && (!out[p.k] || until > out[p.k]!.until)) out[p.k] = { by, until };
		}
	}
	return out;
}

export type BuyResult = 'ok' | 'owned' | 'broke' | 'unknown';

/** Buy an item (it's worn at once): the new state, or why not. */
export function buy(s: ShopState | undefined, id: string, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: Exclude<BuyResult, 'ok'> } {
	const it = ITEM_BY_ID.get(id);
	if (!it) return { result: 'unknown' };
	if (s?.own[id] !== undefined) return { result: 'owned' };
	if (balance < it.price) return { result: 'broke' };
	// `...s` keeps the pranks thrown (and `pOld`): without it a buy dropped them until the next merge
	return { result: 'ok', state: { ...s, own: { ...s?.own, [id]: it.price }, eq: { ...s?.eq, [it.slot]: id }, at } };
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
	const out: ShopState = { own, eq: b.at > a.at ? { ...b.eq } : { ...a.eq }, at: Math.max(a.at, b.at) };
	const pruned = prunePranks({ ...a.pranks, ...b.pranks }, Math.max(a.pOld ?? 0, b.pOld ?? 0));
	if (Object.keys(pruned.pranks).length) out.pranks = pruned.pranks;
	if (pruned.pOld) out.pOld = pruned.pOld;
	return out;
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
