/**
 * BurgiArcade's prize counter (2026-11-22, the user: "bygger du en shop där också. Och där kan man köpa typ
 * pets och gosedjur och mounts"): what the arcade's tickets buy. Three kinds, worn on your operator in the
 * header and on your squad card: a pet on the shoulder (BurgiShop's `pet` slot, so a prize pet replaces a
 * shop pet), a plushie hugged in front of the chest (`plush`) and a mount to ride (`mount`, drawn under the
 * emblem). Our own drawings (components/arcade/ArcadePrize.svelte).
 *
 * Worn exactly like BurgiShop items (KarmaShop's way, karma-shop.ts): they're in shop.ts's ITEM_BY_ID, owned
 * in the member's `shop.own` at 0 burgers (the burger bank never counts them) and worn through `shop.eq`.
 * What was paid in tickets is kept in the member's `arcade.own` (arcade.ts) = prize id → tickets paid.
 * Every id starts with "a-" and is never reused.
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/arcade.test.js). Only types from shop.ts
 * (which imports this file for its catalogue).
 */
import type { Rarity, ShopItem, ShopState } from './shop.ts';
import type { ArcadeState } from './arcade.ts';

export const PRIZE_KINDS = ['pet', 'plush', 'mount'] as const;
export type PrizeKind = (typeof PRIZE_KINDS)[number];

const prize = (id: string, slot: PrizeKind, name: string, price: number, rarity: Rarity): ShopItem => ({ id, slot, name, price, rarity, tickets: true });

/** The catalogue, prices in tickets (an average play wins about 20–40). */
export const ARCADE_ITEMS: ShopItem[] = [
	// pets: on the shoulder
	prize('a-pet-ghost', 'pet', 'Pixel Ghost', 150, 'common'),
	prize('a-pet-ufo', 'pet', 'Mini UFO', 200, 'common'),
	prize('a-pet-duck', 'pet', 'Rubber Ducky', 250, 'common'),
	prize('a-pet-hamster', 'pet', 'Hamster Ball', 500, 'rare'),
	prize('a-pet-robo', 'pet', 'Robo Pup', 650, 'rare'),
	prize('a-pet-bat', 'pet', 'Burger Bat', 1200, 'epic'),
	prize('a-pet-fox', 'pet', 'Fire Fox', 1500, 'epic'),
	prize('a-pet-dragon', 'pet', 'Baby Dragon', 3500, 'legendary'),
	// plushies: hugged in front of the chest
	prize('a-plush-teddy', 'plush', 'Teddy Bear', 120, 'common'),
	prize('a-plush-burger', 'plush', 'Burger Plush', 180, 'common'),
	prize('a-plush-bunny', 'plush', 'Bunny', 220, 'common'),
	prize('a-plush-dino', 'plush', 'Dino', 450, 'rare'),
	prize('a-plush-shark', 'plush', 'Shark', 600, 'rare'),
	prize('a-plush-octo', 'plush', 'Octopus', 1100, 'epic'),
	prize('a-plush-uni', 'plush', 'Unicorn', 1400, 'epic'),
	prize('a-plush-gold', 'plush', 'Golden Teddy', 3000, 'legendary'),
	// mounts: ridden, under the emblem
	prize('a-mount-cart', 'mount', 'Shopping Cart', 300, 'common'),
	prize('a-mount-board', 'mount', 'Hoverboard', 400, 'common'),
	prize('a-mount-pony', 'mount', 'Rocking Horse', 800, 'rare'),
	prize('a-mount-quad', 'mount', 'Quad Bike', 1000, 'rare'),
	prize('a-mount-couch', 'mount', 'Jet Couch', 2000, 'epic'),
	prize('a-mount-duck', 'mount', 'Giant Duck', 2400, 'epic'),
	prize('a-mount-dragon', 'mount', 'Dragon', 5000, 'legendary'),
	prize('a-mount-unicorn', 'mount', 'Golden Unicorn', 6000, 'legendary')
];
export const PRIZE_BY_ID: ReadonlyMap<string, ShopItem> = new Map(ARCADE_ITEMS.map((i) => [i.id, i]));
export const isPrizeId = (id: string | null | undefined): boolean => !!id && id.startsWith('a-');

export type PrizeBuyResult = 'ok' | 'owned' | 'broke' | 'unknown';

/**
 * Buy a prize with tickets: the new arcade state (tickets paid) and shop state (owned at 0 burgers and worn
 * at once), or why not. `balance` = your tickets left (arcade.ts ticketsOf).
 */
export function buyPrize(
	arcade: ArcadeState | undefined,
	shop: ShopState | undefined,
	id: string,
	balance: number,
	at: number
): { result: 'ok'; arcade: ArcadeState; shop: ShopState } | { result: Exclude<PrizeBuyResult, 'ok'> } {
	const it = PRIZE_BY_ID.get(id);
	if (!it) return { result: 'unknown' };
	if (arcade?.own?.[id] !== undefined) return { result: 'owned' };
	if (balance < it.price) return { result: 'broke' };
	const a: ArcadeState = arcade ?? { g: {} };
	const base: ShopState = shop ?? { own: {}, eq: {}, at: 0 };
	return {
		result: 'ok',
		arcade: { ...a, own: { ...a.own, [id]: it.price } },
		shop: { ...base, own: { ...base.own, [id]: 0 }, eq: { ...base.eq, [it.slot]: id }, at }
	};
}

/** Bought at the prize counter but missing from the shop's `own` (a copy lost it): put back at 0 burgers. */
export function ownPrizes(shop: ShopState | undefined, arcade: ArcadeState | undefined): ShopState | undefined {
	const missing = Object.keys(arcade?.own ?? {}).filter((id) => PRIZE_BY_ID.has(id) && shop?.own[id] === undefined);
	if (!missing.length) return shop;
	const base: ShopState = shop ?? { own: {}, eq: {}, at: 0 };
	return { ...base, own: { ...base.own, ...Object.fromEntries(missing.map((id) => [id, 0])) } };
}
