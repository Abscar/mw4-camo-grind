/**
 * BurgiDrip, the clothing store (2026-11-22, the user: "Bygg en klädesaffär också som man kan köpa och bära.
 * Typ 100 olika plagg av massa coola hype-based grejer. Och så måste ta lite armors och sånt från World of
 * Warcraft bara för att det är kul"). A fourth door in the BurgiShop page tab: clothes bought with burgers and
 * worn by your operator in the header's squad frame, on your squad card and in the shops, like BurgiShop's
 * cosmetics. Spending goes to the house (Abscar) like the rest of the shop.
 *
 * Five kinds: a top (hoodies, tees, puffers, jackets, shirts and the raid chest pieces), something round the
 * neck (chains, pendants), kicks (sneakers tied together and hung round the neck by their laces, the
 * sneakerhead flex: the emblems are head-and-shoulders, there are no feet to put them on), shoulders (the raid
 * gear's huge pauldrons) and hats (BurgiShop's own `hat` slot: one hat at a time, whichever shop it's from).
 *
 * The hype gear is our own: no brand names, logos or real designs; the text on the clothes is ours (BURGI,
 * SKEDD, the squad's own words). The raid gear is armour in the style of the big fantasy MMO the user meant,
 * drawn and named by us (no game names, set names or art): seven three-piece sets (chest + pauldrons + helm)
 * and three odd pauldrons. Wear all three pieces of a set for its set bonus (a glow in the set's colour).
 *
 * Stored like every BurgiShop item (shop.ts): `own` id → burgers paid, worn in `eq` (slots `top`, `neck`,
 * `kicks`, `shoulders`, `hat`). Every id starts with "d-" (faceGear.ts hands "d-" hats to the drawings) and is
 * never reused. Bought with BurgiShop's `buy` (today's price, worn at once); one drop a day is 30–50 % off for
 * the whole squad (`dripDealOf`). The drawings are dripArt.ts (each emblem draws them on itself).
 *
 * Pure (no runes, no browser): tested in scripts/drip.test.js. Imports only types from shop.ts (which imports
 * this file for ITEM_BY_ID).
 */
import type { Rarity, ShopItem } from './shop.ts';

/** BurgiDrip's own slots (hats go in BurgiShop's `hat`). */
export const DRIP_SLOTS = ['top', 'neck', 'kicks', 'shoulders'] as const;
export type DripSlot = (typeof DRIP_SLOTS)[number] | 'hat';
/** The store's racks, in the order its buttons show them. */
export const DRIP_RACKS = ['tops', 'neck', 'kicks', 'hats', 'raid'] as const;
export type DripRack = (typeof DRIP_RACKS)[number];
/**
 * BurgiDrip's rarities: BurgiShop's four plus **ultimate**, above legendary (2026-11-23, the user: the Kush Crown
 * "ultimate rare, högsta rarity på sidan, den ska kosta 100 miljoner"). Only BurgiDrip knows it: as a shop item an
 * ultimate piece counts as legendary (radio line, boxes, cleanShop never see a fifth rarity).
 */
export type DripRarity = Rarity | 'ultimate';

/* ---------- what the drawings need (dripArt.ts) ---------- */

/** A fill: a plain colour or one of the patterns (dripArt.ts draws them). */
export type PatternKind =
	| 'camo'
	| 'tiedye'
	| 'check'
	| 'plaid'
	| 'leopard'
	| 'zebra'
	| 'galaxy'
	| 'money'
	| 'iri'
	| 'chrome'
	| 'gold'
	| 'splatter'
	| 'flames'
	| 'stripes'
	| 'blocks'
	| 'floral'
	| 'heather'
	| 'satin';
export type Fill = string | { p: PatternKind; c: string[] };

/** Something printed on the chest. */
export type Print =
	| { k: 'box'; t: string; bg: string; fg: string }
	| { k: 'text'; t: string[]; c: string }
	| { k: 'big'; t: string; c: string[] }
	| { k: 'num'; t: string; c: string; o: string }
	| { k: 'letter'; t: string; c: string; o: string }
	| { k: 'smiley' | 'skull' | 'flame' | 'leaf' | 'burger' | 'bolt' | 'star' | 'web' | 'dragon' | 'patches' | 'cyborg' | 'nuke'; c?: string };

export type TopKind =
	| 'tee'
	| 'hoodie'
	| 'zip'
	| 'puffer'
	| 'varsity'
	| 'bomber'
	| 'track'
	| 'jersey'
	| 'denim'
	| 'leather'
	| 'flannel'
	| 'hawaii'
	| 'fur'
	| 'wind'
	| 'moto'
	| 'plate'
	| 'robe'
	| 'harness';
export interface TopLook {
	kind: TopKind;
	body: Fill;
	/** collar, cuffs, ribbing, trim */
	trim: string;
	/** a different colour on the sleeves (varsity, colour blocks, an undershirt under a jersey) */
	sleeve?: Fill;
	print?: Print;
	/** raid gear: the glow of its runes and gems; the emblem on a breastplate */
	glow?: string;
	emblem?: 'sun' | 'skull' | 'rune' | 'eye' | 'flame' | 'claw';
}

export type NeckKind =
	| 'cuban'
	| 'iced'
	| 'rope'
	| 'tennis'
	| 'pearls'
	| 'tags'
	| 'bandana'
	| 'choker'
	// the Abscar drop (2026-11-23)
	| 'ammo'
	| 'beads'
	| 'kushlei'
	| 'burgerlei'
	| 'cable'
	| 'rgb'
	| 'double'
	| 'skulls'
	| 'fire'
	| 'headset';
export type Pendant =
	| 'burger'
	| 'holk'
	| 'leaf'
	| 'ab'
	| 'skull'
	| 'dollar'
	| 'crown'
	// the Abscar drop (2026-11-23)
	| 'cyborg'
	| 'iri'
	| 'nuke'
	| 'divergence'
	| 'slacker'
	| 'banned'
	| 'controller'
	| 'fries'
	| 'ketchup'
	| 'seven'
	| 'grinder'
	| 'eye'
	| 'gg';
export interface NeckLook {
	kind: NeckKind;
	metal: 'gold' | 'silver' | 'iced' | 'black' | 'red' | 'bronze' | 'iri';
	pendant?: Pendant;
}

export type KickKind = 'high' | 'low' | 'chunky' | 'knit' | 'foam' | 'moon';
export interface KickLook {
	kind: KickKind;
	/** upper, overlay panels / stripe, sole */
	upper: Fill;
	accent: string;
	sole: string;
}

export type HatKind =
	| 'cap'
	| 'back'
	| 'fitted'
	| 'trucker'
	| 'bucket'
	| 'skully'
	| 'watch'
	| 'durag'
	| 'ushanka'
	| 'crown'
	| 'kush-crown'
	| 'helm-judge'
	| 'helm-frost'
	| 'helm-fel'
	| 'helm-dread'
	| 'helm-wrath'
	| 'hood-shadow'
	| 'helm-doom';
export interface HatLook {
	kind: HatKind;
	body: Fill;
	accent: string;
	/** a letter on the front */
	t?: string;
	/** raid helms: the glow */
	glow?: string;
}

export type PauldronKind = 'judge' | 'frost' | 'fel' | 'dread' | 'wrath' | 'shadow' | 'doom' | 'arcane' | 'totem' | 'burger';
export interface ShoulderLook {
	kind: PauldronKind;
	metal: string;
	trim: string;
	glow: string;
}

/** The raid sets (chest + pauldrons + helm): their name and set-bonus glow. */
export const RAID_SETS = {
	judge: { name: 'Holy Judge', glow: '#ffe27a' },
	frost: { name: 'Frost King', glow: '#7fe8ff' },
	fel: { name: 'Felfire', glow: '#7dff3a' },
	dread: { name: 'Dreadlord', glow: '#c06cff' },
	wrath: { name: 'Blood Wrath', glow: '#ff3a3a' },
	shadow: { name: 'Shadowstalker', glow: '#9a8cff' },
	doom: { name: 'Doomforge', glow: '#ff8a1a' }
} as const;
export type RaidSet = keyof typeof RAID_SETS;

export type DripLook =
	| { slot: 'top'; look: TopLook }
	| { slot: 'neck'; look: NeckLook }
	| { slot: 'kicks'; look: KickLook }
	| { slot: 'hat'; look: HatLook }
	| { slot: 'shoulders'; look: ShoulderLook };

export interface DripDef {
	id: string;
	name: string;
	price: number;
	rarity: DripRarity;
	rack: DripRack;
	set?: RaidSet;
	draw: DripLook;
}

/* ---------- the catalogue ---------- */

const top = (id: string, name: string, price: number, rarity: DripRarity, look: TopLook, rack: DripRack = 'tops', set?: RaidSet): DripDef => ({
	id,
	name,
	price,
	rarity,
	rack,
	...(set ? { set } : {}),
	draw: { slot: 'top', look }
});
const neck = (id: string, name: string, price: number, rarity: DripRarity, look: NeckLook): DripDef => ({ id, name, price, rarity, rack: 'neck', draw: { slot: 'neck', look } });
const kick = (id: string, name: string, price: number, rarity: DripRarity, look: KickLook): DripDef => ({ id, name, price, rarity, rack: 'kicks', draw: { slot: 'kicks', look } });
const hat = (id: string, name: string, price: number, rarity: DripRarity, look: HatLook, rack: DripRack = 'hats', set?: RaidSet): DripDef => ({
	id,
	name,
	price,
	rarity,
	rack,
	...(set ? { set } : {}),
	draw: { slot: 'hat', look }
});
const pauld = (id: string, name: string, price: number, rarity: DripRarity, look: ShoulderLook, set?: RaidSet): DripDef => ({
	id,
	name,
	price,
	rarity,
	rack: 'raid',
	...(set ? { set } : {}),
	draw: { slot: 'shoulders', look }
});

const CAMO: Fill = { p: 'camo', c: ['#5a6b3a', '#2f3a1f', '#8a7a4a', '#1a1f12'] };
const TIEDYE: Fill = { p: 'tiedye', c: ['#ff4fa0', '#ffd23a', '#3fe0ff', '#9b5cff'] };

/** Never reuse an id: owned clothes are kept by id. Prices: common < 20,000 ≤ rare < 100,000 ≤ epic < 500,000 ≤ legendary. */
export const DRIP_DEFS: DripDef[] = [
	// ----- hoodies -----
	top('d-hd-box', 'Box Logo Hoodie', 120_000, 'epic', { kind: 'hoodie', body: { p: 'heather', c: ['#9aa0a6', '#7d838a'] }, trim: '#6e747a', print: { k: 'box', t: 'BURGI', bg: '#d8192a', fg: '#ffffff' } }),
	top('d-hd-boxblk', 'Black Box Logo Hoodie', 135_000, 'epic', { kind: 'hoodie', body: '#18191c', trim: '#0c0d0f', print: { k: 'box', t: 'BURGI', bg: '#d8192a', fg: '#ffffff' } }),
	top('d-hd-boxcamo', 'Camo Box Logo Hoodie', 150_000, 'epic', { kind: 'hoodie', body: CAMO, trim: '#2f3a1f', print: { k: 'box', t: 'BURGI', bg: '#f4f1e8', fg: '#d8192a' } }),
	top('d-hd-flame', 'Flame Hoodie', 45_000, 'rare', { kind: 'hoodie', body: { p: 'flames', c: ['#141416', '#ff3a1a', '#ffb02a', '#fff2a0'] }, trim: '#0c0c0e' }),
	top('d-hd-tiedye', 'Tie-Dye Hoodie', 35_000, 'rare', { kind: 'hoodie', body: TIEDYE, trim: '#7a3ac8' }),
	top('d-hd-smiley', 'Smiley Hoodie', 30_000, 'rare', { kind: 'hoodie', body: '#f1ead8', trim: '#d9cfb6', print: { k: 'smiley' } }),
	top('d-hd-camozip', 'Camo Zip Hoodie', 40_000, 'rare', { kind: 'zip', body: CAMO, trim: '#2f3a1f' }),
	top('d-hd-holk', 'Holk Club Hoodie', 42_000, 'rare', { kind: 'hoodie', body: '#2f8a3e', trim: '#1c5a26', print: { k: 'leaf', c: '#c8ff5a' } }),
	top('d-hd-splat', 'Paint Splatter Hoodie', 38_000, 'rare', { kind: 'hoodie', body: { p: 'splatter', c: ['#f4f2ee', '#ff3a6a', '#3ac8ff', '#ffd23a', '#7dff3a'] }, trim: '#d8d4cc' }),
	top('d-hd-galaxy', 'Galaxy Hoodie', 100_000, 'epic', { kind: 'hoodie', body: { p: 'galaxy', c: ['#1a0a3a', '#6a2ac8', '#ff4fd8', '#3fe0ff'] }, trim: '#12062a' }),
	top('d-hd-web', 'Spider Web Hoodie', 105_000, 'epic', { kind: 'hoodie', body: '#ff5cb8', trim: '#d83a92', print: { k: 'web', c: '#ffffff' } }),
	top('d-hd-check', 'Checkerboard Hoodie', 32_000, 'rare', { kind: 'zip', body: { p: 'check', c: ['#f4f2ee', '#16171a'] }, trim: '#16171a' }),
	top('d-hd-grind', 'Certified Grinder Hoodie', 18_000, 'common', { kind: 'hoodie', body: '#2a2d33', trim: '#1a1c20', print: { k: 'text', t: ['CERTIFIED', 'GRINDER'], c: '#ffd23a' } }),
	// ----- tees -----
	top('d-tee-white', 'Plain White Tee', 5_000, 'common', { kind: 'tee', body: '#f6f5f1', trim: '#dcd9d0' }),
	top('d-tee-logo', 'Burgi Logo Tee', 8_000, 'common', { kind: 'tee', body: '#16171a', trim: '#0c0d0f', print: { k: 'text', t: ['BURGI'], c: '#ffffff' } }),
	top('d-tee-skull', 'Skull Tee', 12_000, 'common', { kind: 'tee', body: '#2c2c30', trim: '#1c1c20', print: { k: 'skull', c: '#e8e4da' } }),
	top('d-tee-burger', 'Burger Tee', 9_000, 'common', { kind: 'tee', body: '#ffd23a', trim: '#e0b020', print: { k: 'burger' } }),
	top('d-tee-bolt', 'Lightning Tee', 11_000, 'common', { kind: 'tee', body: '#2a5ad8', trim: '#1a3a98', print: { k: 'bolt', c: '#ffe23a' } }),
	top('d-tee-rainbow', 'Rainbow Stripe Tee', 14_000, 'common', { kind: 'tee', body: { p: 'stripes', c: ['#ff3a3a', '#ff9a1a', '#ffe23a', '#3ad84a', '#3a8aff', '#9a4aff'] }, trim: '#f6f5f1' }),
	top('d-tee-gg', 'GG Tee', 7_000, 'common', { kind: 'tee', body: '#f6f5f1', trim: '#dcd9d0', print: { k: 'big', t: 'GG', c: ['#16171a'] } }),
	top('d-tee-tiedye', 'Tie-Dye Tee', 15_000, 'common', { kind: 'tee', body: TIEDYE, trim: '#f6f5f1' }),
	top('d-tee-rap', 'Vintage Rap Tee', 25_000, 'rare', { kind: 'tee', body: '#232326', trim: '#151517', print: { k: 'big', t: 'SKEDD', c: ['#ffe23a', '#ff6a1a', '#d8192a'] } }),
	// ----- puffers -----
	top('d-puf-black', 'Black Puffer', 60_000, 'rare', { kind: 'puffer', body: '#1c1d21', trim: '#0e0f12' }),
	top('d-puf-red', 'Glossy Red Puffer', 75_000, 'rare', { kind: 'puffer', body: '#d8192a', trim: '#8a0612' }),
	top('d-puf-silver', 'Silver Puffer', 140_000, 'epic', { kind: 'puffer', body: { p: 'chrome', c: ['#f4f6f8', '#a8b0b8', '#5a626a'] }, trim: '#6a7278' }),
	top('d-puf-camo', 'Camo Puffer', 110_000, 'epic', { kind: 'puffer', body: CAMO, trim: '#2f3a1f' }),
	top('d-puf-iri', 'Iridescent Puffer', 450_000, 'epic', { kind: 'puffer', body: { p: 'iri', c: ['#ff7ad8', '#7af0ff', '#b48aff', '#fff0a0'] }, trim: '#8a6ad8' }),
	top('d-puf-gold', 'Gold Puffer', 750_000, 'legendary', { kind: 'puffer', body: { p: 'gold', c: ['#fff4b0', '#e0a520', '#7a5208'] }, trim: '#7a5208' }),
	// ----- jackets -----
	top('d-var-red', 'Red Varsity Jacket', 70_000, 'rare', { kind: 'varsity', body: '#c8102e', trim: '#f4f1e8', sleeve: '#f4f1e8', print: { k: 'letter', t: 'A', c: '#f4f1e8', o: '#c8102e' } }),
	top('d-var-blk', 'Black & Gold Varsity', 130_000, 'epic', { kind: 'varsity', body: '#16171a', trim: '#e0a520', sleeve: '#e8c25a', print: { k: 'letter', t: 'B', c: '#e0a520', o: '#16171a' } }),
	top('d-bmb-olive', 'Olive Bomber', 50_000, 'rare', { kind: 'bomber', body: '#4e5a32', trim: '#ff7a1a' }),
	top('d-bmb-dragon', 'Dragon Souvenir Jacket', 160_000, 'epic', { kind: 'bomber', body: { p: 'satin', c: ['#1c1d24', '#3a3d4a'] }, trim: '#c8102e', print: { k: 'dragon', c: '#e8b830' } }),
	top('d-denim', 'Denim Jacket', 40_000, 'rare', { kind: 'denim', body: '#4a6a9a', trim: '#e0b060' }),
	top('d-leather', 'Biker Leather Jacket', 120_000, 'epic', { kind: 'leather', body: '#141416', trim: '#c8ccd2' }),
	top('d-track', 'Retro Track Jacket', 45_000, 'rare', { kind: 'track', body: '#1aa79a', trim: '#6a2ac8', sleeve: '#f4f1e8' }),
	top('d-wind', 'Colour-Block Windbreaker', 48_000, 'rare', { kind: 'wind', body: { p: 'blocks', c: ['#2a5ad8', '#ff5a8a', '#ffe23a', '#f4f1e8'] }, trim: '#16171a' }),
	top('d-moto', 'Racing Jacket', 140_000, 'epic', { kind: 'moto', body: '#e8e8ea', trim: '#d8192a', print: { k: 'patches' } }),
	top('d-fur', 'Pink Fur Coat', 600_000, 'legendary', { kind: 'fur', body: '#ff8ac8', trim: '#ffc2e2', sleeve: '#16171a' }),
	top('d-ski', 'Neon Ski Jacket', 65_000, 'rare', { kind: 'wind', body: { p: 'blocks', c: ['#b6ff2a', '#16171a', '#ff4fd8', '#16171a'] }, trim: '#16171a' }),
	top('d-money', 'Money Print Tracksuit', 200_000, 'epic', { kind: 'track', body: { p: 'money', c: ['#3e7a3a', '#a8d89a', '#1c3a1a'] }, trim: '#e0a520', sleeve: '#e0a520' }),
	top('d-chrome', 'Liquid Chrome Jacket', 900_000, 'legendary', { kind: 'bomber', body: { p: 'chrome', c: ['#ffffff', '#9aa4ae', '#2a3038'] }, trim: '#2a3038' }),
	// ----- shirts + jerseys -----
	top('d-flannel', 'Red Flannel', 16_000, 'common', { kind: 'flannel', body: { p: 'plaid', c: ['#b81c24', '#16171a', '#e8443a'] }, trim: '#16171a' }),
	top('d-hawaii', 'Hawaiian Shirt', 19_000, 'common', { kind: 'hawaii', body: { p: 'floral', c: ['#1aa0c8', '#ff5a8a', '#ffe23a', '#2fb84a'] }, trim: '#0e7898' }),
	top('d-bowling', 'Flame Bowling Shirt', 34_000, 'rare', { kind: 'hawaii', body: { p: 'flames', c: ['#16171a', '#ff3a1a', '#ffb02a', '#fff2a0'] }, trim: '#16171a' }),
	top('d-jsy-hoops', 'Hoops Jersey #33', 30_000, 'rare', { kind: 'jersey', body: '#6a2ac8', trim: '#ffd23a', sleeve: '#f6f5f1', print: { k: 'num', t: '33', c: '#ffd23a', o: '#2a0a5a' } }),
	top('d-jsy-grid', 'Gridiron Jersey #420', 30_000, 'rare', { kind: 'tee', body: '#2f8a3e', trim: '#f6f5f1', print: { k: 'num', t: '420', c: '#f6f5f1', o: '#123a1a' } }),

	// ----- round the neck -----
	neck('d-nk-cuban', 'Gold Cuban Link', 60_000, 'rare', { kind: 'cuban', metal: 'gold' }),
	neck('d-nk-iced', 'Iced-Out Cuban', 250_000, 'epic', { kind: 'iced', metal: 'iced' }),
	neck('d-nk-rope', 'Silver Rope Chain', 19_000, 'common', { kind: 'rope', metal: 'silver' }),
	neck('d-nk-tennis', 'Diamond Tennis Chain', 180_000, 'epic', { kind: 'tennis', metal: 'iced' }),
	neck('d-nk-pearls', 'Pearl Necklace', 45_000, 'rare', { kind: 'pearls', metal: 'silver' }),
	neck('d-nk-burger', 'Burger Pendant', 55_000, 'rare', { kind: 'cuban', metal: 'gold', pendant: 'burger' }),
	neck('d-nk-holk', 'Golden Holk Pendant', 142_000, 'epic', { kind: 'rope', metal: 'gold', pendant: 'holk' }),
	neck('d-nk-leaf', 'Iced Leaf Pendant', 160_000, 'epic', { kind: 'tennis', metal: 'iced', pendant: 'leaf' }),
	neck('d-nk-ab', 'Iced AB Pendant', 500_000, 'legendary', { kind: 'iced', metal: 'iced', pendant: 'ab' }),
	neck('d-nk-tags', 'Dog Tags', 8_000, 'common', { kind: 'tags', metal: 'silver' }),
	neck('d-nk-bandana', 'Red Bandana', 6_000, 'common', { kind: 'bandana', metal: 'red' }),
	neck('d-nk-choker', 'Spiked Choker', 12_000, 'common', { kind: 'choker', metal: 'black' }),
	neck('d-nk-skull', 'Skull Pendant', 40_000, 'rare', { kind: 'rope', metal: 'silver', pendant: 'skull' }),
	neck('d-nk-dollar', 'Dollar Sign Chain', 200_000, 'epic', { kind: 'cuban', metal: 'gold', pendant: 'dollar' }),
	neck('d-nk-crown', 'Crown Pendant', 800_000, 'legendary', { kind: 'cuban', metal: 'gold', pendant: 'crown' }),

	// ----- kicks -----
	kick('d-kk-redhi', 'Red Retro Highs', 180_000, 'epic', { kind: 'high', upper: '#f6f5f1', accent: '#d8192a', sole: '#f6f5f1' }),
	kick('d-kk-bred', 'Black & Red Highs', 90_000, 'rare', { kind: 'high', upper: '#16171a', accent: '#d8192a', sole: '#f6f5f1' }),
	kick('d-kk-royal', 'Royal Blue Highs', 85_000, 'rare', { kind: 'high', upper: '#16171a', accent: '#2a5ad8', sole: '#f6f5f1' }),
	kick('d-kk-panda', 'Panda Lows', 45_000, 'rare', { kind: 'low', upper: '#f6f5f1', accent: '#16171a', sole: '#f6f5f1' }),
	kick('d-kk-white', 'Triple White Lows', 18_000, 'common', { kind: 'low', upper: '#f6f5f1', accent: '#e4e2dc', sole: '#f6f5f1' }),
	kick('d-kk-chunky', 'Triple Chunk Dad Shoes', 140_000, 'epic', { kind: 'chunky', upper: '#e8e4da', accent: '#9aa0a6', sole: '#f2efe6' }),
	kick('d-kk-zebra', 'Zebra Knit Runners', 160_000, 'epic', { kind: 'knit', upper: { p: 'zebra', c: ['#f6f5f1', '#1c1d20'] }, accent: '#d8192a', sole: '#f6f5f1' }),
	kick('d-kk-foam', 'Foam Holes', 55_000, 'rare', { kind: 'foam', upper: '#cfc4a8', accent: '#a89a78', sole: '#cfc4a8' }),
	kick('d-kk-neon', 'Neon Runners', 50_000, 'rare', { kind: 'knit', upper: '#b6ff2a', accent: '#ff4fd8', sole: '#16171a' }),
	kick('d-kk-galaxy', 'Galaxy Lows', 130_000, 'epic', { kind: 'low', upper: { p: 'galaxy', c: ['#1a0a3a', '#6a2ac8', '#ff4fd8', '#3fe0ff'] }, accent: '#f6f5f1', sole: '#f6f5f1' }),
	kick('d-kk-moon', 'Moon Boots', 70_000, 'rare', { kind: 'moon', upper: '#e8ecf0', accent: '#ff5a1a', sole: '#9aa4ae' }),
	kick('d-kk-420', '420 Lows', 42_000, 'rare', { kind: 'low', upper: '#2f8a3e', accent: '#c8ff5a', sole: '#f6f5f1' }),
	kick('d-kk-gold', 'Solid Gold Highs', 1_200_000, 'legendary', { kind: 'high', upper: { p: 'gold', c: ['#fff4b0', '#e0a520', '#7a5208'] }, accent: '#fff4b0', sole: '#e0a520' }),

	// ----- hats -----
	hat('d-hat-snap', 'Burgi Snapback', 15_000, 'common', { kind: 'cap', body: '#16171a', accent: '#d8192a', t: 'B' }),
	hat('d-hat-back', 'Backwards Red Cap', 12_000, 'common', { kind: 'back', body: '#d8192a', accent: '#f6f5f1' }),
	hat('d-hat-fitted', 'Fitted Cap with Sticker', 28_000, 'rare', { kind: 'fitted', body: '#1a2a5a', accent: '#e0a520', t: 'A' }),
	hat('d-hat-trucker', 'Camo Trucker', 14_000, 'common', { kind: 'trucker', body: CAMO, accent: '#f4f1e8' }),
	hat('d-hat-fuzzy', 'Fuzzy Bucket Hat', 35_000, 'rare', { kind: 'bucket', body: '#ff9ac8', accent: '#ffc2e2' }),
	hat('d-hat-leopard', 'Leopard Bucket Hat', 38_000, 'rare', { kind: 'bucket', body: { p: 'leopard', c: ['#d8a24a', '#3a2410', '#8a5a1a'] }, accent: '#3a2410' }),
	hat('d-hat-skully', 'Black Skully', 9_000, 'common', { kind: 'skully', body: '#1c1d21', accent: '#2c2e33' }),
	hat('d-hat-watch', 'Orange Watch Beanie', 11_000, 'common', { kind: 'watch', body: '#ff7a1a', accent: '#16171a' }),
	hat('d-hat-durag', 'Silk Durag', 30_000, 'rare', { kind: 'durag', body: { p: 'satin', c: ['#6a2ac8', '#b48aff'] }, accent: '#4a1a98' }),
	hat('d-hat-ushanka', 'Fur Trapper Hat', 48_000, 'rare', { kind: 'ushanka', body: '#6a4a2c', accent: '#3a2a1a' }),
	hat('d-hat-crown', 'Bejeweled Crown', 1_000_000, 'legendary', { kind: 'crown', body: { p: 'gold', c: ['#fff4b0', '#e0a520', '#7a5208'] }, accent: '#d8192a' }),

	// ----- raid gear: seven three-piece sets + three odd pauldrons -----
	// Holy Judge: polished gold plate with royal blue, a sun on the chest, winged helm
	top('d-rd-judge-c', 'Holy Judge Breastplate', 400_000, 'epic', { kind: 'plate', body: { p: 'gold', c: ['#fff4b0', '#e0a520', '#7a5208'] }, trim: '#2a4ad8', glow: '#ffe27a', emblem: 'sun' }, 'raid', 'judge'),
	pauld('d-rd-judge-s', 'Holy Judge Pauldrons', 350_000, 'epic', { kind: 'judge', metal: '#e0a520', trim: '#2a4ad8', glow: '#ffe27a' }, 'judge'),
	hat('d-rd-judge-h', 'Holy Judge Helm', 300_000, 'epic', { kind: 'helm-judge', body: { p: 'gold', c: ['#fff4b0', '#e0a520', '#7a5208'] }, accent: '#2a4ad8', glow: '#ffe27a' }, 'raid', 'judge'),
	// Frost King: frozen steel, skulls and icy spikes, a spiked crown-helm
	top('d-rd-frost-c', 'Frost King Plate', 1_500_000, 'legendary', { kind: 'plate', body: { p: 'chrome', c: ['#dff4ff', '#6a8aa8', '#1c2a3a'] }, trim: '#2a3a4a', glow: '#7fe8ff', emblem: 'skull' }, 'raid', 'frost'),
	pauld('d-rd-frost-s', 'Frost King Pauldrons', 1_200_000, 'legendary', { kind: 'frost', metal: '#6a8aa8', trim: '#1c2a3a', glow: '#7fe8ff' }, 'frost'),
	hat('d-rd-frost-h', 'Frost King Crown', 1_400_000, 'legendary', { kind: 'helm-frost', body: { p: 'chrome', c: ['#dff4ff', '#6a8aa8', '#1c2a3a'] }, accent: '#1c2a3a', glow: '#7fe8ff' }, 'raid', 'frost'),
	// Felfire: a dark robe with green fire runes, burning spiked pauldrons, fel horns
	top('d-rd-fel-c', 'Felfire Robe', 380_000, 'epic', { kind: 'robe', body: '#1c2a14', trim: '#4a3a1a', glow: '#7dff3a', emblem: 'eye' }, 'raid', 'fel'),
	pauld('d-rd-fel-s', 'Felfire Spikes', 320_000, 'epic', { kind: 'fel', metal: '#2a2e26', trim: '#4a3a1a', glow: '#7dff3a' }, 'fel'),
	hat('d-rd-fel-h', 'Felfire Horns', 280_000, 'epic', { kind: 'helm-fel', body: '#2a2e26', accent: '#4a3a1a', glow: '#7dff3a' }, 'raid', 'fel'),
	// Dreadlord: black plate and bone, skull pauldrons with purple eyes, a horned skull helm
	top('d-rd-dread-c', 'Dreadlord Plate', 420_000, 'epic', { kind: 'plate', body: { p: 'chrome', c: ['#5a5a66', '#26262e', '#0c0c10'] }, trim: '#e8e0c8', glow: '#c06cff', emblem: 'skull' }, 'raid', 'dread'),
	pauld('d-rd-dread-s', 'Dreadlord Skulls', 360_000, 'epic', { kind: 'dread', metal: '#26262e', trim: '#e8e0c8', glow: '#c06cff' }, 'dread'),
	hat('d-rd-dread-h', 'Dreadlord Helm', 320_000, 'epic', { kind: 'helm-dread', body: '#e8e0c8', accent: '#26262e', glow: '#c06cff' }, 'raid', 'dread'),
	// Blood Wrath: blood-red and black plate, dragon-claw spikes, a horned helm
	top('d-rd-wrath-c', 'Blood Wrath Plate', 400_000, 'epic', { kind: 'plate', body: { p: 'chrome', c: ['#ff6a5a', '#a8141e', '#3a0408'] }, trim: '#16171a', glow: '#ff3a3a', emblem: 'claw' }, 'raid', 'wrath'),
	pauld('d-rd-wrath-s', 'Blood Wrath Pauldrons', 340_000, 'epic', { kind: 'wrath', metal: '#a8141e', trim: '#16171a', glow: '#ff3a3a' }, 'wrath'),
	hat('d-rd-wrath-h', 'Blood Wrath Helm', 300_000, 'epic', { kind: 'helm-wrath', body: { p: 'chrome', c: ['#ff6a5a', '#a8141e', '#3a0408'] }, accent: '#16171a', glow: '#ff3a3a' }, 'raid', 'wrath'),
	// Shadowstalker: dark leather, crossed straps and daggers, a deep hood
	top('d-rd-shadow-c', 'Shadowstalker Harness', 95_000, 'rare', { kind: 'harness', body: '#2a2238', trim: '#6a5a3a', glow: '#9a8cff' }, 'raid', 'shadow'),
	pauld('d-rd-shadow-s', 'Shadowstalker Spaulders', 90_000, 'rare', { kind: 'shadow', metal: '#2a2238', trim: '#6a5a3a', glow: '#9a8cff' }, 'shadow'),
	hat('d-rd-shadow-h', 'Shadowstalker Hood', 85_000, 'rare', { kind: 'hood-shadow', body: '#2a2238', accent: '#16121e', glow: '#9a8cff' }, 'raid', 'shadow'),
	// Doomforge: obsidian with molten cracks and flames, the biggest flex in the store
	top('d-rd-doom-c', 'Doomforge Plate', 3_000_000, 'legendary', { kind: 'plate', body: { p: 'chrome', c: ['#4a4038', '#1a1410', '#050302'] }, trim: '#ff8a1a', glow: '#ff8a1a', emblem: 'flame' }, 'raid', 'doom'),
	pauld('d-rd-doom-s', 'Doomforge Pauldrons', 2_500_000, 'legendary', { kind: 'doom', metal: '#1a1410', trim: '#ff8a1a', glow: '#ff8a1a' }, 'doom'),
	hat('d-rd-doom-h', 'Doomforge Helm', 2_800_000, 'legendary', { kind: 'helm-doom', body: { p: 'chrome', c: ['#4a4038', '#1a1410', '#050302'] }, accent: '#ff8a1a', glow: '#ff8a1a' }, 'raid', 'doom'),
	// three odd pauldrons, no set
	pauld('d-rd-arcane', 'Arcane Orb Pauldrons', 300_000, 'epic', { kind: 'arcane', metal: '#3a2a6a', trim: '#e0a520', glow: '#c08aff' }),
	pauld('d-rd-totem', 'Thunder Wolf Pauldrons', 300_000, 'epic', { kind: 'totem', metal: '#8a8f96', trim: '#6a4a2c', glow: '#7ad8ff' }),
	pauld('d-rd-burger', 'Burger Pauldrons', 250_000, 'epic', { kind: 'burger', metal: '#f0a24a', trim: '#5c2f18', glow: '#ffd23a' }),

	// ----- the Abscar drop (2026-11-23, the user: "mer roliga/snygga/feta abscarrelaterade saker … mer halsband …
	// gå lite crazy, behöver inte vara verklighetstroget") -----
	neck('d-nk-cyborg', 'Abscar Cyborg Skull Chain', 4_200_000, 'legendary', { kind: 'cuban', metal: 'bronze', pendant: 'cyborg' }),
	neck('d-nk-div', 'Divergence Diamond', 2_500_000, 'legendary', { kind: 'tennis', metal: 'iced', pendant: 'divergence' }),
	neck('d-nk-iri', 'Iridescent Rank Medallion', 1_500_000, 'legendary', { kind: 'rope', metal: 'iri', pendant: 'iri' }),
	neck('d-nk-nuke', 'Tactical Nuke Pendant', 900_000, 'legendary', { kind: 'cuban', metal: 'gold', pendant: 'nuke' }),
	neck('d-nk-777', 'Lucky 777 Chain', 777_777, 'legendary', { kind: 'cuban', metal: 'gold', pendant: 'seven' }),
	neck('d-nk-fire', 'Chain on Fire', 666_000, 'legendary', { kind: 'fire', metal: 'black' }),
	neck('d-nk-double', 'Double Stack Chains', 420_000, 'epic', { kind: 'double', metal: 'gold' }),
	neck('d-nk-controller', 'Iced Controller Chain', 350_000, 'epic', { kind: 'iced', metal: 'iced', pendant: 'controller' }),
	neck('d-nk-cable', 'Cyborg Neural Cable', 300_000, 'epic', { kind: 'cable', metal: 'black' }),
	neck('d-nk-banned', 'BANNED Pendant', 250_000, 'epic', { kind: 'cuban', metal: 'silver', pendant: 'banned' }),
	neck('d-nk-eye', 'Red Eye Pendant', 190_000, 'epic', { kind: 'rope', metal: 'black', pendant: 'eye' }),
	neck('d-nk-gg', 'Iced GG Pendant', 160_000, 'epic', { kind: 'tennis', metal: 'iced', pendant: 'gg' }),
	neck('d-nk-rgb', 'RGB Gamer Chain', 120_000, 'epic', { kind: 'rgb', metal: 'silver' }),
	neck('d-nk-skulls', 'Mini Skull Chain', 80_000, 'rare', { kind: 'skulls', metal: 'bronze' }),
	neck('d-nk-ammo', 'Bandolier Necklace', 65_000, 'rare', { kind: 'ammo', metal: 'gold' }),
	neck('d-nk-burgerlei', 'Burger Lei', 48_000, 'rare', { kind: 'burgerlei', metal: 'gold' }),
	neck('d-nk-kushlei', 'Kush Lei', 42_000, 'rare', { kind: 'kushlei', metal: 'gold' }),
	neck('d-nk-fries', 'Fries Pendant', 30_000, 'rare', { kind: 'rope', metal: 'gold', pendant: 'fries' }),
	neck('d-nk-ketchup', 'Ketchup Bottle Chain', 28_000, 'rare', { kind: 'rope', metal: 'silver', pendant: 'ketchup' }),
	neck('d-nk-headset', 'Headset Round the Neck', 25_000, 'rare', { kind: 'headset', metal: 'black' }),
	neck('d-nk-grinder', 'Grinder Pendant', 18_000, 'common', { kind: 'rope', metal: 'silver', pendant: 'grinder' }),
	neck('d-nk-rasta', 'Rasta Beads', 9_000, 'common', { kind: 'beads', metal: 'gold' }),
	neck('d-nk-slacker', 'Slacker Tag', 7_000, 'common', { kind: 'rope', metal: 'silver', pendant: 'slacker' }),
	top('d-puf-hotrod', 'Hot Rod Flame Puffer', 300_000, 'epic', { kind: 'puffer', body: { p: 'flames', c: ['#3a0a08', '#ff3a1a', '#ffb02a', '#fff2a0'] }, trim: '#1a0604' }),
	top('d-hd-iri', 'Iridescent Rank Hoodie', 260_000, 'epic', { kind: 'hoodie', body: { p: 'iri', c: ['#ff7ad8', '#7af0ff', '#b48aff', '#fff0a0'] }, trim: '#5a2a98', print: { k: 'bolt', c: '#7af0ff' } }),
	top('d-hd-abscar', 'Abscar Cyborg Hoodie', 180_000, 'epic', { kind: 'hoodie', body: '#16171a', trim: '#8a1a10', print: { k: 'cyborg' } }),
	top('d-hd-ghillie', 'Moss Ghillie Hoodie', 90_000, 'rare', { kind: 'hoodie', body: { p: 'camo', c: ['#4f7a2a', '#2a4a14', '#8ab84a', '#1a2a0a'] }, trim: '#2a4a14', print: { k: 'leaf', c: '#c8ff5a' } }),
	top('d-jsy-abscar', 'Abscar Jersey', 35_000, 'rare', { kind: 'jersey', body: '#c8102e', trim: '#16171a', sleeve: '#16171a', print: { k: 'num', t: 'AB', c: '#f6f5f1', o: '#16171a' } }),
	top('d-tee-nuke', 'Nuke Tee', 22_000, 'rare', { kind: 'tee', body: '#2a2d22', trim: '#1a1c14', print: { k: 'nuke' } }),
	top('d-tee-campaign', 'Refuses Campaign Tee', 10_000, 'common', { kind: 'tee', body: '#4f6a2a', trim: '#2f4214', print: { k: 'text', t: ['NO', 'CAMPAIGN'], c: '#f4f1e8' } }),
	top('d-tee-slacker', 'Slacker Tee', 6_000, 'common', { kind: 'tee', body: '#d8192a', trim: '#8a0612', print: { k: 'text', t: ['SLACKER'], c: '#ffffff' } }),
	kick('d-kk-bronze', 'Cyborg Bronze Highs', 1_800_000, 'legendary', { kind: 'high', upper: { p: 'chrome', c: ['#f0c890', '#a8743a', '#3a200a'] }, accent: '#ff2a1a', sole: '#2a1608' }),
	kick('d-kk-iri', 'Iridescent Lows', 220_000, 'epic', { kind: 'low', upper: { p: 'iri', c: ['#ff7ad8', '#7af0ff', '#b48aff', '#fff0a0'] }, accent: '#f6f5f1', sole: '#f6f5f1' }),
	kick('d-kk-hotrod', 'Hot Rod Highs', 95_000, 'rare', { kind: 'high', upper: { p: 'flames', c: ['#16171a', '#ff3a1a', '#ffb02a', '#fff2a0'] }, accent: '#ff3a1a', sole: '#16171a' }),
	kick('d-kk-ghillie', 'Ghillie Runners', 60_000, 'rare', { kind: 'knit', upper: { p: 'camo', c: ['#4f7a2a', '#2a4a14', '#8ab84a', '#1a2a0a'] }, accent: '#c8ff5a', sole: '#2a2a20' }),
	hat('d-hat-iri', 'Iridescent Bucket Hat', 140_000, 'epic', { kind: 'bucket', body: { p: 'iri', c: ['#ff7ad8', '#7af0ff', '#b48aff', '#fff0a0'] }, accent: '#5a2a98' }),
	hat('d-hat-flame', 'Flame Durag', 45_000, 'rare', { kind: 'durag', body: { p: 'flames', c: ['#c8180e', '#ff6a1a', '#ffd23a', '#fff2a0'] }, accent: '#5a0604' }),
	hat('d-hat-abscar', 'Abscar Snapback', 16_000, 'common', { kind: 'cap', body: '#16171a', accent: '#ff2a1a', t: 'A' }),

	// ----- the one and only ultimate piece (2026-11-23): a crown of weed leaves on a gold band, glowing -----
	hat('d-hat-kushcrown', 'Kush Crown', 100_000_000, 'ultimate', { kind: 'kush-crown', body: { p: 'gold', c: ['#fff4b0', '#e0a520', '#7a5208'] }, accent: '#2fd36a', glow: '#7dff3a' })
];

/** How the rest of the shop sees a BurgiDrip rarity: ultimate counts as legendary. */
export function shopRarity(r: DripRarity): Rarity {
	return r === 'ultimate' ? 'legendary' : r;
}
/** A piece's BurgiDrip rarity by id (ultimate included), for the store's colours and labels. */
export function dripRarity(id: string): DripRarity | null {
	return DRIP_BY_ID.get(id)?.rarity ?? null;
}

/** The catalogue as shop items (shop.ts ITEM_BY_ID): bought, worn and drawn like BurgiShop's. */
export const DRIP_ITEMS: ShopItem[] = DRIP_DEFS.map((d) => ({ id: d.id, slot: d.draw.slot, name: d.name, price: d.price, rarity: shopRarity(d.rarity), drip: true as const }));
export const DRIP_BY_ID: ReadonlyMap<string, DripDef> = new Map(DRIP_DEFS.map((d) => [d.id, d]));

/** The raid set a member has all three pieces of on (null: none), from what's worn (slot → item id). */
export function setBonus(eq: { top?: string | null; shoulders?: string | null; hat?: string | null } | null | undefined): RaidSet | null {
	if (!eq?.top || !eq.shoulders || !eq.hat) return null;
	const set = DRIP_BY_ID.get(eq.top)?.set;
	return set && DRIP_BY_ID.get(eq.shoulders)?.set === set && DRIP_BY_ID.get(eq.hat)?.set === set ? set : null;
}
/** How many pieces of a set are worn. */
export function setCount(set: RaidSet, eq: { top?: string | null; shoulders?: string | null; hat?: string | null } | null | undefined): number {
	return [eq?.top, eq?.shoulders, eq?.hat].filter((id) => id && DRIP_BY_ID.get(id)?.set === set).length;
}

function hash(text: string): number {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
	return h >>> 0;
}
/** The pool for the daily drop: everything up to 1,000,000. */
const DROP_POOL = DRIP_DEFS.filter((d) => d.price <= 1_000_000);
/** Today's drop: one piece 30–50 % off for the whole squad, from the day alone (shop.ts dayKey). */
export function dripDealOf(day: string): { id: string; off: number } {
	const h = hash(`drip:${day}`);
	return { id: DROP_POOL[h % DROP_POOL.length].id, off: 30 + ((h >>> 8) % 5) * 5 };
}
