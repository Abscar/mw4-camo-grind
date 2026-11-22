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
 * The ideas pack (2026-11-20, the user picked all 15 ideas: "bygg alla"): a gun on the back in camo, the
 * Nuke aura, a Glitch effect, emotes (tap your operator, the squad sees it for a few seconds), a camo
 * background for your squad card, a style for your squad-radio lines, gold chips at the blackjack table,
 * your operator posing on the slots' big-win screens, your own effect when a tick maxes a weapon, clothes
 * for the weed buddy, five titles, three pranks (Clown Nose, Slacker Sticker, Gas Mask = no pranks on you
 * for a day) and the Golden Statue (one stands at a time: whoever put one up last).
 *
 * No browser APIs and no runes, so Node tests it directly (scripts/shop.test.js). Doesn't import
 * squad-codec.ts (which imports this file).
 */
import { KARMA_ITEMS } from './karma-shop.ts';
import { CS2_ITEMS, GUN_ITEMS } from './armory.ts';
import { DRIP_ITEMS, DRIP_SLOTS, dripDealOf } from './drip.ts';
import type { IconCamo } from './data/camos.ts';

// eyes / hat / smoke / pet: the 420 pack 2 (2026-11-16); eyes + hat are drawn by the emblems (faceGear.ts),
// smoke tints whatever smokes on them, the pet sits on the shoulder (OpGear + ShopPet).
// back / emote (on the operator, OpGear), card / radio (Squad tab), table (blackjack), win (the slots'
// big-win screens), maxfx (your weapon rows), buddy (the weed buddy): the ideas pack (2026-11-20)
/** BurgiShop's own kinds (its kind buttons; every one has items in SHOP_ITEMS). */
// entry / trail / sound / feed / shelf / throne: the 18-ideas pack (2026-11-21): an entrance in the header when
// you come online, a trail after your pointer, your own tick sounds, your kill feed rows, a trophy shelf on
// your squad card, and Abscar's throne behind your operator.
export const SLOTS = [
	'aura',
	'effect',
	'badge',
	'mouth',
	'eyes',
	'hat',
	'smoke',
	'pet',
	'back',
	'emote',
	'name',
	'title',
	'card',
	'radio',
	'table',
	'win',
	'maxfx',
	'buddy',
	'entry',
	'trail',
	'sound',
	'feed',
	'shelf',
	'throne'
] as const;
/** Every slot something can be worn in: BurgiShop's, plus `hold` = the Camo Armory's gun in the operator's hands (armory.ts),
    plus BurgiDrip's clothes (drip.ts: top, neck, kicks, shoulders; its hats go in `hat`). */
export const WEAR_SLOTS = [...SLOTS, 'hold', ...DRIP_SLOTS] as const;
export type ShopSlot = (typeof WEAR_SLOTS)[number];
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
	id: string;
	slot: ShopSlot;
	name: string;
	price: number;
	rarity: Rarity;
	/** For titles: the words on the plate. */
	text?: string;
	/** KarmaShop (karma-shop.ts): paid with hearts, never burgers. */
	karma?: true;
	/** The Camo Armory (armory.ts): which weapon in which camo. Bought in order (buyGun), not with buy(). */
	gun?: { w: string; c: IconCamo };
	/** BurgiDrip (drip.ts): clothes, bought with buy() on the store's own door, drawn by dripArt.ts. */
	drip?: true;
	/** The Camo Armory's CS2 Skins tab (armory.ts, data/cs2Skins.ts): the skin's key. Bought with buyCs2, not with buy(). */
	cs2?: string;
	/** Never sold: given for free when earned (grantRewards: the 420 collection, the throne's title). */
	secret?: true;
	/** Only in the shop around Christmas / New Year (windowOpen); whoever bought one keeps it. */
	window?: ShopWindow;
	/** Buying this also gives these (free). */
	grants?: string[];
}
export type ShopWindow = 'xmas' | 'newyear';

const item = (id: string, slot: ShopSlot, name: string, price: number, rarity: Rarity, text?: string): ShopItem => ({ id, slot, name, price, rarity, ...(text ? { text } : {}) });
const extra = (base: ShopItem, more: Partial<ShopItem>): ShopItem => ({ ...base, ...more });

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
	item('pet-bud', 'pet', 'Lil’ Bud', 84000, 'legendary'),
	// the ideas pack (2026-11-20, "bygg alla"): prices at the ×10–×20 levels
	// a rifle on the back, painted in a ladder camo (OpGear, WeaponIcon's camo paint)
	item('back-gold', 'back', 'Gold Rifle', 8000, 'rare'),
	item('back-plat', 'back', 'Platinum Rifle', 18000, 'epic'),
	item('back-hb', 'back', 'Harmonic Rifle', 28000, 'epic'),
	item('back-div', 'back', 'Divergence Rifle', 75000, 'legendary'),
	// radioactive glow with a mushroom cloud growing behind the emblem now and then
	item('aura-nuke', 'aura', 'Nuke', 90000, 'legendary'),
	// the emblem glitches red / cyan like the Abscar HUD box
	item('fx-glitch', 'effect', 'Glitch', 20000, 'epic'),
	// tap your operator (header or squad card): the whole squad sees it for a few seconds
	item('emote-ring', 'emote', 'Smoke Ring', 15000, 'epic'),
	item('emote-flex', 'emote', 'Flex', 15000, 'epic'),
	item('emote-burger', 'emote', 'Burger Bite', 15000, 'epic'),
	// your card in the Squad tab wears a moving ladder camo
	item('card-gold', 'card', 'Gold Card', 8000, 'rare'),
	item('card-plat', 'card', 'Platinum Card', 16000, 'epic'),
	item('card-hb', 'card', 'Harmonic Card', 30000, 'epic'),
	item('card-div', 'card', 'Divergence Card', 75000, 'legendary'),
	// your lines in the squad radio
	item('radio-gold', 'radio', 'Gold Frame', 6000, 'rare'),
	item('radio-fire', 'radio', 'Burning Words', 50000, 'legendary'),
	// your chips and cards at the shared blackjack table (everyone at the table sees them)
	item('table-gold', 'table', 'Gold Chips', 15000, 'epic'),
	// your operator dances on the BIG / MEGA WIN screens of both slots (your own page)
	item('win-pose', 'win', 'Win Pose', 20000, 'epic'),
	// plays over a weapon row when your tick maxes it (your own page, every theme)
	item('maxfx-fireworks', 'maxfx', 'Fireworks', 18000, 'epic'),
	item('maxfx-nuke', 'maxfx', 'Mini Nuke', 18000, 'epic'),
	item('maxfx-rainbow', 'maxfx', 'Rainbow Burst', 18000, 'epic'),
	// the weed buddy at the top of your page (Abscar theme) wears it
	item('buddy-cap', 'buddy', 'Buddy Snapback', 5000, 'rare'),
	item('buddy-shades', 'buddy', 'Buddy Shades', 6500, 'rare'),
	item('buddy-chain', 'buddy', 'Buddy Gold Chain', 9000, 'rare'),
	item('title-slots', 'title', 'Slots Goblin', 1500, 'common', 'Slots Goblin'),
	item('title-chemist', 'title', 'Ketchup Chemist', 2000, 'common', 'Ketchup Chemist'),
	item('title-pranklord', 'title', 'Prank Lord', 5000, 'rare', 'Prank Lord'),
	item('title-daddy', 'title', 'Divergence Daddy', 12000, 'epic', 'Divergence Daddy'),
	item('title-house', 'title', 'House Always Wins', 15000, 'epic', 'House Always Wins'),
	// the 18-ideas pack (2026-11-21, the user: "gör alla 18")
	// an entrance in the header when you come online (everyone online sees it once)
	item('entry-smoke', 'entry', 'Smoke Entrance', 8000, 'rare'),
	item('entry-heli', 'entry', 'Chopper Drop', 24000, 'epic'),
	item('entry-nuke', 'entry', 'Nuke Drop', 80000, 'legendary'),
	// a trail after your mouse / finger (your own page)
	item('trail-leaves', 'trail', 'Leaf Trail', 5000, 'rare'),
	item('trail-burgers', 'trail', 'Burger Trail', 7000, 'rare'),
	item('trail-smoke', 'trail', 'Smoke Trail', 16000, 'epic'),
	item('trail-rainbow', 'trail', 'Rainbow Trail', 55000, 'legendary'),
	// your tick sounds instead of the hitmarker (when sound is on)
	item('sound-bong', 'sound', 'Bong Bubbles', 6500, 'rare'),
	item('sound-horn', 'sound', 'Air Horn', 6500, 'rare'),
	item('sound-chomp', 'sound', 'Burger Chomp', 6500, 'rare'),
	// your rows in the kill feed
	item('feed-gold', 'feed', 'Gold Feed', 7000, 'rare'),
	item('feed-neon', 'feed', 'Neon Feed', 15000, 'epic'),
	item('feed-fire', 'feed', 'Fire Feed', 48000, 'legendary'),
	// a trophy shelf on your squad card (the trophies are earned, trophies())
	item('shelf-oak', 'shelf', 'Oak Trophy Shelf', 10000, 'rare'),
	item('shelf-gold', 'shelf', 'Gold Trophy Shelf', 60000, 'legendary'),
	// the big one: a golden throne behind your operator, and its title
	extra(item('throne-abscar', 'throne', 'Abscar’s Throne', 100_000_000, 'legendary'), { grants: ['title-throne'] }),
	extra(item('title-throne', 'title', 'Throne Title', 0, 'legendary', 'On Abscar’s Throne'), { secret: true }),
	// own every 420 item and these are yours (grantRewards)
	extra(item('title-420legend', 'title', '420 Legend', 0, 'legendary', '420 Legend'), { secret: true }),
	extra(item('aura-420legend', 'aura', 'Legend Haze', 0, 'legendary'), { secret: true }),
	// only around the holidays
	extra(item('hat-santa', 'hat', 'Santa Hat', 7000, 'rare'), { window: 'xmas' }),
	extra(item('aura-snow', 'aura', 'Snowfall', 20000, 'epic'), { window: 'xmas' }),
	extra(item('pet-ginger', 'pet', 'Gingerbread Burger', 20000, 'epic'), { window: 'xmas' }),
	extra(item('fx-newyear', 'effect', 'New Year Fireworks', 21000, 'epic'), { window: 'newyear' })
];

/** The 420 collection (the two 420 packs): own them all and the 420 Legend title + Legend Haze are yours. */
export const COLLECTION_420: readonly string[] = [
	'aura-kush',
	'fx-leaves',
	'fx-munchies',
	'pin-brownie',
	'pin-leaf',
	'pin-grinder',
	'pin-420',
	'name-rasta',
	'title-puff',
	'title-couch',
	'title-snack',
	'title-stoner',
	'title-baked',
	'title-hotbox',
	'title-blazed',
	'title-holklord',
	'mouth-blunt',
	'mouth-pipe',
	'mouth-double',
	'mouth-bong',
	'mouth-cloud9',
	'eyes-shades',
	'eyes-rasta',
	'eyes-baked',
	'eyes-laser',
	'hat-bucket',
	'hat-rasta',
	'hat-propeller',
	'hat-leafcrown',
	'smoke-green',
	'smoke-purple',
	'smoke-rainbow',
	'smoke-gold',
	'pet-burger',
	'pet-smokey',
	'pet-bud'
];
const COLLECTION_REWARDS = ['title-420legend', 'aura-420legend'];

/** Is a holiday window open on this day (the viewer's local date)? Christmas 1–26 Dec, New Year 27 Dec – 3 Jan. */
export function windowOpen(w: ShopWindow, at: number): boolean {
	const d = new Date(at);
	const m = d.getMonth();
	const day = d.getDate();
	if (w === 'xmas') return m === 11 && day <= 26;
	return (m === 11 && day >= 27) || (m === 0 && day <= 3);
}

/** Can this item be bought (or given, or come out of a box) right now? */
export function buyable(it: ShopItem | undefined, at: number): it is ShopItem {
	return !!it && !it.karma && !it.gun && !it.cs2 && !it.secret && (!it.window || windowOpen(it.window, at));
}

/** The viewer's local day, "2026-11-21" (the daily deal changes at midnight). */
export function dayKey(at: number): string {
	const d = new Date(at);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hash(text: string): number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	return h >>> 0;
}

/** The daily deal's pool: ordinary items up to 100,000 (no holiday, secret, throne or High Roller). */
const DEAL_POOL = SHOP_ITEMS.filter((i) => !i.secret && !i.window && i.price <= 100_000);
/** Today's deal: the same item and discount for the whole squad (30–50 % off), from the day alone. */
export function dealOf(day: string): { id: string; off: number } {
	const h = hash(`deal:${day}`);
	return { id: DEAL_POOL[h % DEAL_POOL.length].id, off: 30 + ((h >>> 8) % 5) * 5 };
}
/** What an item costs right now (today's deal, or BurgiDrip's daily drop, included). */
export function priceOf(id: string, at: number): number {
	const it = ITEM_BY_ID_LOCAL.get(id);
	if (!it) return 0;
	const deal = it.drip ? dripDealOf(dayKey(at)) : dealOf(dayKey(at));
	return deal.id === id ? Math.round((it.price * (100 - deal.off)) / 100) : it.price;
}
const ITEM_BY_ID_LOCAL: ReadonlyMap<string, ShopItem> = new Map([...SHOP_ITEMS, ...DRIP_ITEMS].map((i) => [i.id, i]));

/**
 * Pranks (the 420 pack): bought once per use and thrown at another squad member. A Smoke Bomb covers
 * their operator in smoke for an hour; TOO HIGH TO PLAY stamps them for a day (like the BANNED stamp).
 * The ideas pack (2026-11-20) added a Clown Nose (an hour), the Slacker Sticker (a day, the header's red
 * sticker on someone else) and the Gas Mask: `self`, put on yourself, and for a day no prank shows on you
 * (not even one thrown before) and nobody can throw one at you.
 */
export const PRANKS = [
	// ×15 on 2026-11-20 (were 250 / 400; pranks have no rarity, so the middle of the shop's ×10–×20)
	{ id: 'smoke-bomb', name: 'Smoke Bomb', price: 3750, hours: 1, self: false },
	{ id: 'too-high', name: 'TOO HIGH TO PLAY', price: 6000, hours: 24, self: false },
	{ id: 'clown', name: 'Clown Nose', price: 4500, hours: 1, self: false },
	{ id: 'slacker', name: 'Slacker Sticker', price: 7500, hours: 24, self: false },
	{ id: 'mask', name: 'Gas Mask', price: 12000, hours: 24, self: true },
	// the 18-ideas pack (2026-11-21): their operator upside down / a burger for a head for an hour, their radio
	// lines come out as "mmmph" for half an hour, and confetti bursts over their page the next time they open it
	{ id: 'flip', name: 'Upside Down', price: 6000, hours: 1, self: false },
	{ id: 'burgerhead', name: 'Burger Head', price: 6750, hours: 1, self: false },
	{ id: 'mmmph', name: 'Mmmph', price: 5250, hours: 0.5, self: false },
	{ id: 'confetti', name: 'Confetti Bomb', price: 3000, hours: 24, self: false }
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
// KarmaShop's items too (karma-shop.ts): worn and drawn like these, but bought with hearts (buyKarmaItem), not here;
// and the Camo Armory's guns (armory.ts), bought in the game's order with buyGun, and its CS2 skins (buyCs2)
export const ITEM_BY_ID: ReadonlyMap<string, ShopItem> = new Map([...SHOP_ITEMS, ...KARMA_ITEMS, ...GUN_ITEMS, ...CS2_ITEMS, ...DRIP_ITEMS].map((i) => [i.id, i]));

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
	/** The last emote played (the worn one, when), for the squad to see (emoteAge). */
	em?: { k: string; at: number };
	/** Golden Statues put up: the latest time, how many, burgers paid for them all. */
	statue?: { at: number; n: number; p: number };
	/** Sold back (item id → when, burgers back so far, `own` total at that sale). Owned again once `bought` is later. */
	sold?: Record<string, { at: number; back: number; paid: number }>;
	/** When a sold item was bought (or given) again. */
	bought?: Record<string, number>;
	/** Items given to friends (gift id → item, to whom, when, burgers paid), the newest GIFT_KEEP. */
	gifts?: Record<string, Gift>;
	/** Burgers paid for gifts that dropped off the list. */
	gOld?: number;
	/** Gifts from friends already put in `own` (gift ids). */
	rx?: string[];
	/** Munchie Boxes opened: how many, burgers paid for them all (minus what duplicates gave back). */
	boxes?: { n: number; p: number };
	/** Your three saved outfits (a worn set each, or null), and when they last changed. */
	fits?: { at: number; l: (Partial<Record<ShopSlot, string>> | null)[] };
	/** Your latest ad on the tickers: its text, when, how many bought, burgers paid for them all. */
	ad?: { t: string; at: number; n: number; p: number };
}

/** One item given to a friend. */
export interface Gift {
	i: string;
	to: string;
	at: number;
	p: number;
}
export const GIFT_KEEP = 40;
const RX_KEEP = 120;
/** Munchie Box prices per rarity; a duplicate gives back half (BOX_BACK). */
export const BOX_PRICE: Record<Rarity, number> = { common: 2500, rare: 7500, epic: 18000, legendary: 70000 };
export const BOX_BACK = 0.5;
/** Selling gives back half of what you paid. */
export const SELL_BACK = 0.5;
export const FIT_COUNT = 3;
/** The ad space on the tickers: price, how long it runs, longest text. */
export const AD_PRICE = 100_000;
export const AD_HOURS = 24;
export const AD_MAX = 60;

/** The Golden Statue (2026-11-20): one stands in the Squad tab, whoever put theirs up last. */
export const STATUE_PRICE = 250_000;
/** An emote shows on a page that sees it within this long of being played (pages read every 30 s)… */
export const EMOTE_FRESH = 60_000;
/** …and plays for this long there. */
export const EMOTE_PLAY = 8_000;

const ID = /^[a-z0-9-]{2,24}$/;
// a sanity cap on stored prices (was 1,000,000; raised for the 10-million High Roller title, 2026-11-20; then
// for the Camo Armory's CS2 skins, up to 10,000,000,000, 2026-11-22). A price over it drops that item when read.
export const PRICE_MAX = 1_000_000_000_000;
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
	const st = isObject(raw.statue) ? raw.statue : null;
	const statue =
		st && typeof st.at === 'number' && Number.isFinite(st.at) && st.at > 0 && Number.isInteger(st.n) && (st.n as number) >= 1 && Number.isInteger(st.p) && (st.p as number) >= 0
			? { at: Math.round(st.at), n: Math.min(st.n as number, 100_000), p: Math.min(st.p as number, PRICE_MAX * 100) }
			: undefined;
	const sold: Record<string, { at: number; back: number; paid: number }> = {};
	for (const [id, v] of Object.entries(isObject(raw.sold) ? raw.sold : {})) {
		if (ID.test(id) && isObject(v) && isTime(v.at) && isAmount(v.back) && isAmount(v.paid)) sold[id] = { at: Math.round(v.at as number), back: v.back as number, paid: v.paid as number };
	}
	const bought: Record<string, number> = {};
	for (const [id, v] of Object.entries(isObject(raw.bought) ? raw.bought : {})) if (ID.test(id) && isTime(v)) bought[id] = Math.round(v as number);
	const gifts: Record<string, Gift> = {};
	for (const [gid, g] of Object.entries(isObject(raw.gifts) ? raw.gifts : {})) {
		if (PRANK_ID.test(gid) && isObject(g) && typeof g.i === 'string' && ID.test(g.i) && typeof g.to === 'string' && MEMBER_ID.test(g.to) && isTime(g.at) && isAmount(g.p)) {
			gifts[gid] = { i: g.i, to: g.to, at: Math.round(g.at as number), p: g.p as number };
		}
	}
	const gPruned = pruneGifts(gifts, isAmount(raw.gOld) ? (raw.gOld as number) : 0);
	const rx = Array.isArray(raw.rx) ? raw.rx.filter((x): x is string => typeof x === 'string' && PRANK_ID.test(x)).slice(-RX_KEEP) : [];
	const bx = isObject(raw.boxes) ? raw.boxes : null;
	const boxes = bx && Number.isInteger(bx.n) && (bx.n as number) >= 1 && isAmount(bx.p) ? { n: Math.min(bx.n as number, 1_000_000), p: bx.p as number } : undefined;
	const ad0 = isObject(raw.ad) ? raw.ad : null;
	const adText = ad0 && typeof ad0.t === 'string' ? cleanAdText(ad0.t) : '';
	const ad = ad0 && adText && isTime(ad0.at) && Number.isInteger(ad0.n) && (ad0.n as number) >= 1 && isAmount(ad0.p) ? { t: adText, at: Math.round(ad0.at as number), n: ad0.n as number, p: ad0.p as number } : undefined;
	if (!Object.keys(own).length && !Object.keys(pruned.pranks).length && !pruned.pOld && !statue && !Object.keys(gPruned.gifts).length && !gPruned.gOld && !boxes && !ad) return undefined;
	const base: ShopState = { own, eq: {}, at: 0, sold, bought };
	const eq: Partial<Record<ShopSlot, string>> = {};
	if (isObject(raw.eq)) {
		for (const slot of WEAR_SLOTS) {
			const id = raw.eq[slot];
			if (typeof id === 'string' && owns(base, id) && ITEM_BY_ID.get(id)?.slot === slot) eq[slot] = id;
		}
	}
	const at = typeof raw.at === 'number' && Number.isFinite(raw.at) && raw.at > 0 ? Math.round(raw.at) : 0;
	const out: ShopState = { own, eq, at };
	if (Object.keys(pruned.pranks).length) out.pranks = pruned.pranks;
	if (pruned.pOld) out.pOld = pruned.pOld;
	const em = isObject(raw.em) ? raw.em : null;
	if (em && typeof em.k === 'string' && own[em.k] !== undefined && ITEM_BY_ID.get(em.k)?.slot === 'emote' && typeof em.at === 'number' && Number.isFinite(em.at) && em.at > 0) {
		out.em = { k: em.k, at: Math.round(em.at) };
	}
	if (statue) out.statue = statue;
	if (Object.keys(sold).length) out.sold = sold;
	if (Object.keys(bought).length) out.bought = bought;
	if (Object.keys(gPruned.gifts).length) out.gifts = gPruned.gifts;
	if (gPruned.gOld) out.gOld = gPruned.gOld;
	if (rx.length) out.rx = rx;
	if (boxes) out.boxes = boxes;
	const fr = isObject(raw.fits) ? raw.fits : null;
	if (fr && isTime(fr.at) && Array.isArray(fr.l)) {
		const l = Array.from({ length: FIT_COUNT }, (_, i) => {
			const f = (fr.l as unknown[])[i];
			if (!isObject(f)) return null;
			const set: Partial<Record<ShopSlot, string>> = {};
			for (const slot of WEAR_SLOTS) if (typeof f[slot] === 'string' && ITEM_BY_ID.get(f[slot] as string)?.slot === slot) set[slot] = f[slot] as string;
			return set;
		});
		if (l.some(Boolean)) out.fits = { at: Math.round(fr.at as number), l };
	}
	if (ad) out.ad = ad;
	return out;
}

const isTime = (x: unknown): boolean => typeof x === 'number' && Number.isFinite(x) && x > 0;
const isAmount = (x: unknown): boolean => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= PRICE_MAX * 100;

function pruneGifts(gifts: Record<string, Gift>, gOld: number): { gifts: Record<string, Gift>; gOld: number } {
	const list = Object.entries(gifts).sort(([, a], [, b]) => b.at - a.at);
	const gone = list.slice(GIFT_KEEP).reduce((n, [, g]) => n + g.p, 0);
	return { gifts: Object.fromEntries(list.slice(0, GIFT_KEEP)), gOld: gOld + gone };
}

/** An ad's text: one line, no control characters, at most AD_MAX characters. */
export function cleanAdText(text: string): string {
	// control characters, zero-width marks and line / direction separators become spaces
	const plain = [...text]
		.map((ch) => {
			const c = ch.codePointAt(0) ?? 32;
			return c < 32 || (c >= 127 && c < 160) || (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202e) ? ' ' : ch;
		})
		.join('');
	return plain.replace(/\s+/g, ' ').trim().slice(0, AD_MAX).trim();
}

/** Do you own this item now (bought or given, and not sold since)? */
export function owns(s: ShopState | undefined, id: string): boolean {
	if (!s || s.own[id] === undefined) return false;
	const sd = s.sold?.[id];
	return !sd || sd.at < (s.bought?.[id] ?? 0);
}

/** Burgers spent in the shop (items + pranks + statues). */
export const shopSpent = (s: ShopState | undefined) =>
	Object.values(s?.own ?? {}).reduce((n, p) => n + p, 0) +
	Object.values(s?.pranks ?? {}).reduce((n, p) => n + p.p, 0) +
	(s?.pOld ?? 0) +
	(s?.statue?.p ?? 0) +
	Object.values(s?.gifts ?? {}).reduce((n, g) => n + g.p, 0) +
	(s?.gOld ?? 0) +
	(s?.boxes?.p ?? 0) +
	(s?.ad?.p ?? 0) -
	Object.values(s?.sold ?? {}).reduce((n, x) => n + x.back, 0);

/** Put up a Golden Statue (it stands until someone else puts one up; you can put yours up again). */
export function buyStatue(s: ShopState | undefined, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: 'broke' } {
	if (balance < STATUE_PRICE) return { result: 'broke' };
	const base: ShopState = s ?? { own: {}, eq: {}, at: 0 };
	return { result: 'ok', state: { ...base, statue: { at, n: (base.statue?.n ?? 0) + 1, p: (base.statue?.p ?? 0) + STATUE_PRICE } } };
}

/** Whose Golden Statue stands: the member who put one up last (null: nobody has). */
export function statueOf(members: Record<string, { shop?: ShopState }>): { id: string; at: number } | null {
	let best: { id: string; at: number } | null = null;
	for (const [id, m] of Object.entries(members)) {
		const at = m.shop?.statue?.at;
		if (at && (!best || at > best.at || (at === best.at && id < best.id))) best = { id, at };
	}
	return best;
}

/** Play the worn emote (null: no emote worn). */
export function playEmote(s: ShopState | undefined, at: number): ShopState | null {
	const k = s?.eq.emote;
	if (!s || !k || !owns(s, k)) return null;
	return { ...s, em: { k, at } };
}

/** The emote a member just played, while it's fresh enough to show (EMOTE_FRESH). */
export function freshEmote(s: ShopState | undefined, now: number): { k: string; at: number } | null {
	const em = s?.em;
	return em && now - em.at < EMOTE_FRESH && em.at - now < 10_000 ? em : null;
}

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

/**
 * The pranks on a member right now (the latest of each kind), from everyone's shop lists. While their own
 * Gas Mask is on, that's all there is: nothing else shows (not even a prank thrown before it).
 */
export function pranksOn(target: string, members: Record<string, { shop?: ShopState }>, now: number): Partial<Record<PrankKind, ActivePrank>> {
	const out: Partial<Record<PrankKind, ActivePrank>> = {};
	for (const [by, m] of Object.entries(members)) {
		for (const p of Object.values(m.shop?.pranks ?? {})) {
			if (p.to !== target) continue;
			const def = PRANK_BY_ID.get(p.k);
			if (!def || (def.self && by !== target)) continue;
			const until = p.at + def.hours * 3_600_000;
			if (p.at <= now + 60_000 && until > now && (!out[p.k] || until > out[p.k]!.until)) out[p.k] = { by, until };
		}
	}
	return out.mask ? { mask: out.mask } : out;
}

export type BuyResult = 'ok' | 'owned' | 'broke' | 'unknown' | 'closed';

/** Put an item in `own` (paid `price`), owned again if it was sold before. */
function addOwned(s: ShopState, id: string, price: number, at: number): ShopState {
	const out: ShopState = { ...s, own: { ...s.own, [id]: (s.own[id] ?? 0) + price } };
	if (s.sold?.[id]) out.bought = { ...s.bought, [id]: Math.max(at, s.sold[id].at + 1) };
	return out;
}

/** Buy an item at today's price (the daily deal included); it's worn at once, and what it grants comes with it. */
export function buy(s: ShopState | undefined, id: string, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: Exclude<BuyResult, 'ok'> } {
	const it = ITEM_BY_ID.get(id);
	// hearts items have their own buy (karma-shop.ts), the armory's guns theirs (armory.ts buyGun: in order)
	if (!it || it.karma || it.gun || it.cs2 || it.secret) return { result: 'unknown' };
	if (owns(s, id)) return { result: 'owned' };
	if (!buyable(it, at)) return { result: 'closed' };
	const price = priceOf(id, at);
	if (balance < price) return { result: 'broke' };
	// `...s` keeps the pranks thrown (and `pOld`): without it a buy dropped them until the next merge
	let state = addOwned(s ?? { own: {}, eq: {}, at: 0 }, id, price, at);
	for (const g of it.grants ?? []) if (!owns(state, g)) state = addOwned(state, g, 0, at);
	return { result: 'ok', state: { ...state, eq: { ...state.eq, [it.slot]: id }, at } };
}

/** Wear an owned item in its slot, or take the slot off (id null). Unowned items are refused (null). */
export function equip(s: ShopState | undefined, slot: ShopSlot, id: string | null, at: number): ShopState | null {
	if (!s) return null;
	if (id !== null && (!owns(s, id) || ITEM_BY_ID.get(id)?.slot !== slot)) return null;
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
	// the later emote; the statue record with more put up (then the later one)
	const em = !a.em ? b.em : !b.em ? a.em : b.em.at > a.em.at ? b.em : a.em;
	if (em) out.em = { ...em };
	const st = !a.statue ? b.statue : !b.statue ? a.statue : b.statue.n > a.statue.n || (b.statue.n === a.statue.n && b.statue.at > a.statue.at) ? b.statue : a.statue;
	if (st) out.statue = { ...st };
	// the 18-ideas pack: sales (the later one per item), re-buys (the later), gifts (both lists), claimed
	// gifts (both), boxes / ad (the one with more bought), outfits (the later change)
	const sold = { ...a.sold };
	for (const [id, x] of Object.entries(b.sold ?? {})) if (!sold[id] || x.at > sold[id].at) sold[id] = x;
	if (Object.keys(sold).length) out.sold = sold;
	const bought = { ...a.bought };
	for (const [id, x] of Object.entries(b.bought ?? {})) bought[id] = Math.max(bought[id] ?? 0, x);
	if (Object.keys(bought).length) out.bought = bought;
	const gp = pruneGifts({ ...a.gifts, ...b.gifts }, Math.max(a.gOld ?? 0, b.gOld ?? 0));
	if (Object.keys(gp.gifts).length) out.gifts = gp.gifts;
	if (gp.gOld) out.gOld = gp.gOld;
	const rx = [...new Set([...(a.rx ?? []), ...(b.rx ?? [])])].slice(-RX_KEEP);
	if (rx.length) out.rx = rx;
	const boxes = !a.boxes ? b.boxes : !b.boxes ? a.boxes : b.boxes.n > a.boxes.n ? b.boxes : a.boxes;
	if (boxes) out.boxes = { ...boxes };
	const ad = !a.ad ? b.ad : !b.ad ? a.ad : b.ad.n > a.ad.n || (b.ad.n === a.ad.n && b.ad.at > a.ad.at) ? b.ad : a.ad;
	if (ad) out.ad = { ...ad };
	const fits = !a.fits ? b.fits : !b.fits ? a.fits : b.fits.at > a.fits.at ? b.fits : a.fits;
	if (fits) out.fits = { at: fits.at, l: fits.l.map((f) => (f ? { ...f } : null)) };
	// an item worn on one copy but sold on the other is taken off
	for (const [slot, id] of Object.entries(out.eq)) if (id && !owns(out, id)) delete out.eq[slot as ShopSlot];
	return out;
}

/** What a member wears, as items (only known, owned ones). */
export function worn(s: ShopState | undefined): Partial<Record<ShopSlot, ShopItem>> {
	const out: Partial<Record<ShopSlot, ShopItem>> = {};
	for (const slot of WEAR_SLOTS) {
		const id = s?.eq[slot];
		const it = id ? ITEM_BY_ID.get(id) : undefined;
		if (it && owns(s, it.id)) out[slot] = it;
	}
	return out;
}

// ---------- the 18-ideas pack (2026-11-21) ----------

/** What selling an item gives back now (0 = can't: gifts, rewards, KarmaShop items and guns can't be sold). */
export function sellValue(s: ShopState | undefined, id: string): number {
	const it = ITEM_BY_ID.get(id);
	if (!s || !it || it.karma || it.gun || it.cs2 || it.secret || !owns(s, id)) return 0;
	return Math.floor((s.own[id] - (s.sold?.[id]?.paid ?? 0)) * SELL_BACK);
}

/** Sell an item back for half of what you paid (it's taken off; you can buy it again later). */
export function sellItem(s: ShopState | undefined, id: string, at: number): { state: ShopState; back: number; result: 'ok' } | { result: 'no' } {
	const back = sellValue(s, id);
	if (!s || back <= 0) return { result: 'no' };
	const prev = s.sold?.[id];
	const t = Math.max(at, (s.bought?.[id] ?? 0) + 1);
	const eq = { ...s.eq };
	for (const [slot, x] of Object.entries(eq)) if (x === id) delete eq[slot as ShopSlot];
	return { result: 'ok', back, state: { ...s, eq, at, sold: { ...s.sold, [id]: { at: t, back: (prev?.back ?? 0) + back, paid: s.own[id] } } } };
}

/** The boxes' pools: every ordinary item of that rarity (no holiday, secret, throne or High Roller). */
export const boxPool = (r: Rarity): ShopItem[] => SHOP_ITEMS.filter((i) => i.rarity === r && !i.secret && !i.window && i.slot !== 'throne' && i.id !== 'title-roller');

/** Open a Munchie Box: a random item of that rarity (`roll` 0–1), worn at once; one you own gives half the box back. */
export function openBox(
	s: ShopState | undefined,
	rarity: Rarity,
	balance: number,
	at: number,
	roll: number
): { state: ShopState; id: string; dup: boolean; back: number; result: 'ok' } | { result: 'broke' } {
	const price = BOX_PRICE[rarity];
	if (balance < price) return { result: 'broke' };
	const pool = boxPool(rarity);
	const it = pool[Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(0.999999, roll)) * pool.length))];
	const base: ShopState = s ?? { own: {}, eq: {}, at: 0 };
	if (owns(base, it.id)) {
		const back = Math.floor(price * BOX_BACK);
		return { result: 'ok', id: it.id, dup: true, back, state: { ...base, boxes: { n: (base.boxes?.n ?? 0) + 1, p: (base.boxes?.p ?? 0) + price - back } } };
	}
	const state = addOwned(base, it.id, price, at);
	return { result: 'ok', id: it.id, dup: false, back: 0, state: { ...state, eq: { ...state.eq, [it.slot]: it.id }, at, boxes: { n: (base.boxes?.n ?? 0) + 1, p: base.boxes?.p ?? 0 } } };
}

/** Give an item to a friend (paid at today's price): it lands in their shop the next time their page reads the squad. */
export function giveItem(
	s: ShopState | undefined,
	id: string,
	to: string,
	theirs: ShopState | undefined,
	balance: number,
	at: number,
	gid: string
): { state: ShopState; result: 'ok' } | { result: Exclude<BuyResult, 'ok'> } {
	const it = ITEM_BY_ID.get(id);
	if (!it || it.karma || it.gun || it.cs2 || it.secret || !MEMBER_ID.test(to) || !PRANK_ID.test(gid)) return { result: 'unknown' };
	if (owns(theirs, id)) return { result: 'owned' };
	if (!buyable(it, at)) return { result: 'closed' };
	const price = priceOf(id, at);
	if (balance < price) return { result: 'broke' };
	const base: ShopState = s ?? { own: {}, eq: {}, at: 0 };
	const gp = pruneGifts({ ...base.gifts, [gid]: { i: id, to, at, p: price } }, base.gOld ?? 0);
	const state: ShopState = { ...base, gifts: gp.gifts };
	if (gp.gOld) state.gOld = gp.gOld;
	return { result: 'ok', state };
}

/** Gifts from friends to `me` not yet put in my shop: [gift id, giver's member id, the gift]. */
export function giftsFor(me: string, mine: ShopState | undefined, members: Record<string, { shop?: ShopState }>): [string, string, Gift][] {
	const seen = new Set(mine?.rx ?? []);
	const out: [string, string, Gift][] = [];
	for (const [by, m] of Object.entries(members)) {
		if (by === me) continue;
		for (const [gid, g] of Object.entries(m.shop?.gifts ?? {})) if (g.to === me && !seen.has(gid) && ITEM_BY_ID.has(g.i)) out.push([gid, by, g]);
	}
	return out.sort((x, y) => x[2].at - y[2].at);
}

/** Put gifts in my shop (free, not worn; one I already own just counts as claimed). */
export function claimGifts(s: ShopState | undefined, gifts: [string, string, Gift][], at: number): ShopState | undefined {
	if (!gifts.length) return s;
	let state: ShopState = s ?? { own: {}, eq: {}, at: 0 };
	for (const [, , g] of gifts) if (!owns(state, g.i)) state = addOwned(state, g.i, 0, at);
	return { ...state, rx: [...(state.rx ?? []), ...gifts.map(([gid]) => gid)].slice(-RX_KEEP) };
}

/** Save what you wear now as outfit `i`. */
export function saveFit(s: ShopState | undefined, i: number, at: number): ShopState | null {
	if (!s || i < 0 || i >= FIT_COUNT) return null;
	const l = Array.from({ length: FIT_COUNT }, (_, j) => (j === i ? { ...s.eq } : (s.fits?.l[j] ?? null)));
	return { ...s, fits: { at, l } };
}

/** Wear outfit `i` (what you still own of it; the rest of the slots off). */
export function wearFit(s: ShopState | undefined, i: number, at: number): ShopState | null {
	const f = s?.fits?.l[i];
	if (!s || !f) return null;
	const eq: Partial<Record<ShopSlot, string>> = {};
	for (const [slot, id] of Object.entries(f)) if (id && owns(s, id) && ITEM_BY_ID.get(id)?.slot === slot) eq[slot as ShopSlot] = id;
	// the Camo Armory gun stays in your hands unless the outfit has one
	if (!eq.hold && s.eq.hold) eq.hold = s.eq.hold;
	return { ...s, eq, at };
}

/** Buy the ad space: your line runs on the shop's and the casino's tickers for AD_HOURS (the latest ad wins). */
export function buyAd(s: ShopState | undefined, text: string, balance: number, at: number): { state: ShopState; result: 'ok' } | { result: 'broke' | 'empty' } {
	const t = cleanAdText(text);
	if (!t) return { result: 'empty' };
	if (balance < AD_PRICE) return { result: 'broke' };
	const base: ShopState = s ?? { own: {}, eq: {}, at: 0 };
	return { result: 'ok', state: { ...base, ad: { t, at, n: (base.ad?.n ?? 0) + 1, p: (base.ad?.p ?? 0) + AD_PRICE } } };
}

/** The ad running now: the latest one bought within AD_HOURS (null: none). */
export function adOf(members: Record<string, { shop?: ShopState }>, now: number): { id: string; t: string; at: number } | null {
	let best: { id: string; t: string; at: number } | null = null;
	for (const [id, m] of Object.entries(members)) {
		const ad = m.shop?.ad;
		if (ad && now - ad.at < AD_HOURS * 3_600_000 && ad.at - now < 60_000 && (!best || ad.at > best.at)) best = { id, t: ad.t, at: ad.at };
	}
	return best;
}

/** Earned rewards not in the shop yet: the whole 420 collection → 420 Legend + Legend Haze; the throne → its title. */
export function grantRewards(s: ShopState | undefined, at: number): ShopState | undefined {
	if (!s) return s;
	let state = s;
	if (COLLECTION_420.every((id) => owns(s, id))) for (const id of COLLECTION_REWARDS) if (state.own[id] === undefined) state = addOwned(state, id, 0, at);
	for (const it of SHOP_ITEMS) if (it.grants && owns(s, it.id)) for (const g of it.grants) if (state.own[g] === undefined) state = addOwned(state, g, 0, at);
	return state;
}

/** The trophies on a shelf, earned from what you've done in the shop. */
export const TROPHIES = ['spent1m', 'spent10m', 'own25', 'own50', 'c420', 'gifter', 'pranker', 'boxer', 'statue', 'throne'] as const;
export type TrophyId = (typeof TROPHIES)[number];
export function trophies(s: ShopState | undefined): Record<TrophyId, boolean> {
	const spent = shopSpent(s);
	const owned = s ? Object.keys(s.own).filter((id) => owns(s, id)).length : 0;
	return {
		spent1m: spent >= 1_000_000,
		spent10m: spent >= 10_000_000,
		own25: owned >= 25,
		own50: owned >= 50,
		c420: owns(s, 'title-420legend'),
		gifter: Object.keys(s?.gifts ?? {}).length >= 5 || (s?.gOld ?? 0) > 0,
		pranker: Object.keys(s?.pranks ?? {}).length >= 10 || (s?.pOld ?? 0) > 0,
		boxer: (s?.boxes?.n ?? 0) >= 10,
		statue: (s?.statue?.n ?? 0) >= 1,
		throne: owns(s, 'throne-abscar')
	};
}

/** When a prank of this kind was on a member (from–until, ms), every time: e.g. to mmmph their radio lines from back then. */
export function prankTimes(target: string, kind: PrankKind, members: Record<string, { shop?: ShopState }>): [number, number][] {
	const def = PRANK_BY_ID.get(kind);
	if (!def) return [];
	const out: [number, number][] = [];
	for (const m of Object.values(members)) for (const p of Object.values(m.shop?.pranks ?? {})) if (p.to === target && p.k === kind) out.push([p.at, p.at + def.hours * 3_600_000]);
	return out;
}
