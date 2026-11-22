/**
 * KarmaShop (2026-11-20, the user: "gör en till shop som är karmashop, där man kommer kunna köpa saker med
 * hjärtan"): a second shop next to BurgiShop where you pay with hearts (❤️), never burgers. Pretend hearts,
 * never money.
 *
 * Hearts are earned by being kind in BurgiGives (donations.ts), worked out from what a member has given, so
 * past gifts count too and every page agrees without anything typed in:
 *   - 1 ❤️ per HEART_BURGERS (1,000) burgers given in total (rounded down), and
 *   - CAUSE_BONUS (10) ❤️ once for each cause you've given at least CAUSE_MIN (1,000) burgers to.
 * Gifts only ever grow, so hearts earned never go down. (Paying a duel IOU was considered too: the `paid`
 * list in the squad document is trimmed with the settled duels, so hearts from it could disappear again.)
 * On top of that, since 2026-11-22, the hearts Abscar sends from BurgiGives' karma bank (`gifted`,
 * donations.ts heartsGiftedTo), 1 💗 = 1 ❤️. They're spendable like earned ones but aren't "earned": the
 * karma luck on the slots (casino-rig.ts) and the kindest list only count what a member gave themself.
 *
 * The items are "good karma" cosmetics in BurgiShop's own slots (shop.ts SLOTS), worn exactly like
 * BurgiShop items: they're in shop.ts's ITEM_BY_ID, owned in the member's `shop.own` at 0 burgers (so the
 * burger bank never counts them) and worn through `shop.eq`. What was paid in hearts is kept separately in
 * member field `karmaShop` (squad-codec.ts; BurgiGives' karma bank is the document field `karma`, a different thing) = { own: item id → hearts paid }, so a later price change never
 * moves anyone's hearts. Kept on the device too (`mw4-camo-grind:karma-shop`); two devices merge by taking
 * everything owned on either (the higher price paid). Pages from before KarmaShop keep the `karmaShop` field
 * untouched (squad-codec's `more`), keep the 0-burger items in `shop.own` (unknown ids are kept) and just
 * don't draw them.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/karma-shop.test.js). Only types come from
 * shop.ts (which imports this file for its catalogue).
 */
import type { Rarity, ShopItem, ShopSlot, ShopState } from './shop.ts';
import { donationsByOrg, ORG_IDS, type DonationBook } from './donations.ts';

/** Burgers given per heart. */
export const HEART_BURGERS = 1_000;
/** Hearts once for each cause given at least CAUSE_MIN burgers. */
export const CAUSE_BONUS = 10;
export const CAUSE_MIN = 1_000;

/** The kinds KarmaShop sells, in the order its chips show them (all of them BurgiShop slots). */
export const KARMA_SLOTS = ['aura', 'effect', 'badge', 'eyes', 'hat', 'smoke', 'pet', 'name', 'title'] as const satisfies readonly ShopSlot[];
export type KarmaSlot = (typeof KARMA_SLOTS)[number];

const item = (id: string, slot: KarmaSlot, name: string, price: number, rarity: Rarity, text?: string): ShopItem => ({
	id,
	slot,
	name,
	price,
	rarity,
	karma: true,
	...(text ? { text } : {})
});

/**
 * The catalogue, prices in hearts. Every id starts with "k-" (the drawings use that to tell them apart) and
 * is never reused for something else, in this shop or BurgiShop: owned items are kept by id.
 */
export const KARMA_ITEMS: ShopItem[] = [
	// auras (behind the emblem; karma-shop.css)
	item('k-aura-heart', 'aura', 'Heart Glow', 40, 'rare'),
	item('k-aura-wings', 'aura', 'Angel Wings', 160, 'epic'),
	item('k-aura-light', 'aura', 'Heavenly Light', 450, 'legendary'),
	// effects (around it; karma-shop.css)
	item('k-fx-hearts', 'effect', 'Floating Hearts', 10, 'common'),
	item('k-fx-petals', 'effect', 'Rose Petals', 35, 'rare'),
	item('k-fx-doves', 'effect', 'Peace Doves', 120, 'epic'),
	// pins (karmaShopArt.ts karmaPin)
	item('k-pin-heart', 'badge', 'Heart Pin', 5, 'common'),
	item('k-pin-angel', 'badge', 'Winged Heart', 25, 'rare'),
	item('k-pin-burger', 'badge', 'Holy Burger', 30, 'rare'),
	item('k-pin-medal', 'badge', 'Golden Heart Medal', 90, 'epic'),
	// on the eyes and the head (drawn by each emblem at its own face, karmaShopArt.ts karmaEyes / karmaHat)
	item('k-eyes-rose', 'eyes', 'Rose-Tinted Glasses', 12, 'common'),
	item('k-eyes-hearts', 'eyes', 'Heart Eyes', 45, 'rare'),
	item('k-hat-band', 'hat', 'Heart Boppers', 15, 'common'),
	item('k-hat-flowers', 'hat', 'Flower Crown', 50, 'rare'),
	item('k-hat-halo', 'hat', 'Halo', 350, 'legendary'),
	// a smoke colour (karma-shop.css)
	item('k-smoke-candy', 'smoke', 'Cotton Candy Smoke', 30, 'rare'),
	// sidekicks on the shoulder (karmaShopArt.ts karmaPet)
	item('k-pet-heart', 'pet', 'Heart Buddy', 60, 'rare'),
	item('k-pet-pup', 'pet', 'Rescue Pup', 150, 'epic'),
	item('k-pet-cherub', 'pet', 'Lil’ Cherub', 500, 'legendary'),
	// callsign styles (karma-shop.css)
	item('k-name-sweet', 'name', 'Sweetheart', 35, 'rare'),
	item('k-name-angel', 'name', 'Angelic', 120, 'epic'),
	// title plates
	item('k-title-egg', 'title', 'Good Egg', 8, 'common', 'Good Egg'),
	item('k-title-wholesome', 'title', 'Wholesome Grinder', 12, 'common', 'Wholesome Grinder'),
	item('k-title-donor', 'title', 'Burger Donor', 30, 'rare', 'Burger Donor'),
	item('k-title-holk', 'title', 'Holk Relief Hero', 40, 'rare', 'Holk Relief Hero'),
	item('k-title-police', 'title', 'Karma Police', 100, 'epic', 'Karma Police'),
	item('k-title-phil', 'title', 'Philanthropist', 150, 'epic', 'Philanthropist'),
	item('k-title-saint', 'title', 'Saint', 400, 'legendary', 'Saint')
];
export const KARMA_BY_ID: ReadonlyMap<string, ShopItem> = new Map(KARMA_ITEMS.map((i) => [i.id, i]));
export const isKarmaId = (id: string | null | undefined): boolean => !!id && id.startsWith('k-');

/* ---------- hearts ---------- */

export interface Hearts {
	/** Burgers given in BurgiGives (all devices). */
	given: number;
	/** Causes given at least CAUSE_MIN burgers. */
	causes: number;
	/** Hearts earned so far (gifts + cause bonuses). */
	earned: number;
	/** Hearts sent to you from the karma bank (Abscar's). */
	gifted: number;
	/** Hearts spent in KarmaShop. */
	spent: number;
	/** What's left to spend (never below zero on show). */
	balance: number;
}

/** Hearts earned from a member's gifts. */
export function heartsEarned(d: DonationBook | undefined): { given: number; causes: number; earned: number } {
	const per = donationsByOrg(d);
	const given = ORG_IDS.reduce((n, o) => n + per[o], 0);
	const causes = ORG_IDS.filter((o) => per[o] >= CAUSE_MIN).length;
	return { given, causes, earned: Math.floor(given / HEART_BURGERS) + causes * CAUSE_BONUS };
}

export interface KarmaShopState {
	/** Item id → hearts paid. */
	own: Record<string, number>;
}

const ID = /^k-[a-z0-9-]{1,22}$/;
const HEARTS_MAX = 10_000_000;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** A stored or published karma state, cleaned; undefined when nothing was ever bought. */
export function cleanKarmaShop(raw: unknown): KarmaShopState | undefined {
	if (!isObject(raw) || !isObject(raw.own)) return undefined;
	const own: Record<string, number> = {};
	// unknown "k-" ids are kept (a newer page's items)
	for (const [id, paid] of Object.entries(raw.own)) if (ID.test(id) && Number.isInteger(paid) && (paid as number) >= 0 && (paid as number) <= HEARTS_MAX) own[id] = paid as number;
	return Object.keys(own).length ? { own } : undefined;
}

/** Hearts spent in KarmaShop. */
export const heartsSpent = (k: KarmaShopState | undefined): number => Object.values(k?.own ?? {}).reduce((n, p) => n + p, 0);

/** A member's hearts: earned from their gifts + sent from the karma bank (`gifted`), spent in KarmaShop, left. */
export function heartsOf(m: { donations?: DonationBook; karmaShop?: KarmaShopState } | undefined, gifted = 0): Hearts {
	const e = heartsEarned(m?.donations);
	const g = Number.isSafeInteger(gifted) && gifted > 0 ? gifted : 0;
	const spent = heartsSpent(m?.karmaShop);
	return { ...e, gifted: g, spent, balance: Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, e.earned + g) - spent) };
}

/** Two copies of your karma (two devices): everything owned on either, the higher price paid. */
export function mergeKarmaShop(a: KarmaShopState | undefined, b: KarmaShopState | undefined): KarmaShopState | undefined {
	if (!a || !b) return a ?? b;
	const own = { ...a.own };
	for (const [id, p] of Object.entries(b.own)) own[id] = Math.max(own[id] ?? 0, p);
	return { own };
}

export type KarmaBuyResult = 'ok' | 'owned' | 'broke' | 'unknown';

/**
 * Buy a KarmaShop item with hearts: the new karma state (hearts paid) and shop state (owned at 0 burgers and
 * worn at once, so it shows like any BurgiShop item), or why not.
 */
export function buyKarmaItem(
	karma: KarmaShopState | undefined,
	shop: ShopState | undefined,
	id: string,
	hearts: number,
	at: number
): { result: 'ok'; karmaShop: KarmaShopState; shop: ShopState } | { result: Exclude<KarmaBuyResult, 'ok'> } {
	const it = KARMA_BY_ID.get(id);
	if (!it) return { result: 'unknown' };
	if (karma?.own[id] !== undefined) return { result: 'owned' };
	if (hearts < it.price) return { result: 'broke' };
	const base: ShopState = shop ?? { own: {}, eq: {}, at: 0 };
	return {
		result: 'ok',
		karmaShop: { own: { ...karma?.own, [id]: it.price } },
		// `...base` keeps everything else in the shop (pranks, newer pages' fields)
		shop: { ...base, own: { ...base.own, [id]: 0 }, eq: { ...base.eq, [it.slot]: id }, at }
	};
}

/**
 * Bought in KarmaShop but missing from the shop's `own` (only if a copy lost it): put back at 0 burgers so
 * it can be worn again. Returns the same object when nothing was missing.
 */
export function ownKarmaItems(shop: ShopState | undefined, karma: KarmaShopState | undefined): ShopState | undefined {
	const missing = Object.keys(karma?.own ?? {}).filter((id) => KARMA_BY_ID.has(id) && shop?.own[id] === undefined);
	if (!missing.length) return shop;
	const base: ShopState = shop ?? { own: {}, eq: {}, at: 0 };
	return { ...base, own: { ...base.own, ...Object.fromEntries(missing.map((id) => [id, 0])) } };
}

export interface KindRow {
	id: string;
	given: number;
	earned: number;
	/** KarmaShop items owned. */
	items: number;
}

/** The squad's kindest: most hearts earned first (then most given, then name). Only members who gave. */
export function kindest(members: Record<string, { name: string; donations?: DonationBook; karmaShop?: KarmaShopState }>): KindRow[] {
	return Object.entries(members)
		.map(([id, m]) => {
			const h = heartsEarned(m.donations);
			return { id, given: h.given, earned: h.earned, items: Object.keys(m.karmaShop?.own ?? {}).filter((k) => KARMA_BY_ID.has(k)).length, name: m.name };
		})
		.filter((r) => r.given > 0)
		.sort((a, b) => b.earned - a.earned || b.given - a.given || (a.name < b.name ? -1 : 1))
		.map(({ name: _name, ...r }) => r);
}
