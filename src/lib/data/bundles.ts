/**
 * Store bundles (the user's ask, 2026-11-20: "vad dom innehåller, inte bara bild på den … allt jag
 * hade fått om jag köpte den"): every Modern Warfare 4 bundle in Activision's web store, with
 * everything that comes in it. A dated SNAPSHOT, shown under Cosmetics → Bundles.
 *
 * Sources, read 20 Nov:
 * - Contents, weapon per blueprint, rarity, Mastercraft / Reactive, tracers / death effect, price:
 *   Activision's own store page for each bundle (callofduty.com/en/store/bundles/<id>, read from a
 *   callofduty.com tab with fetch + DOMParser; ids 7740–7880 and 6773 tried, the ones whose "Usable
 *   In" names Modern Warfare 4 kept). Every item count matches itemshop.gg's.
 * - First day in the web store, and whose operator a skin is: itemshop.gg's store tracker
 *   (itemshop.gg/call-of-duty, its catalogue pages and its free shop JSON). It only sees the web
 *   store, which is a selection: the in-game store can have bundles that aren't listed here.
 *
 * `id` is Activision's store id (never reuse one). A bundle's stickers, charms and large decals are
 * in cosmetics.ts too (the test checks), so the tab can show our drawing of them. Prices are COD
 * Points; `price: null` = sold for real money in the platform stores (PlayStation, Xbox, PC).
 * `left` = the day it left the web store, once it has. Refreshed by the weekly Friday check.
 * Tested in scripts/bundles.test.js.
 */

export const BUNDLES_CHECKED = '2026-11-20';
export const BUNDLES_SOURCES = 'Activision’s store pages (callofduty.com/store), itemshop.gg';

/** How long a bundle counts as new after its first day in the store. */
export const BUNDLE_NEW_DAYS = 7;

export const BUNDLE_RARITIES = ['rare', 'epic', 'legendary', 'ultra'] as const;
export type BundleRarity = (typeof BUNDLE_RARITIES)[number];

/** The kinds of things a bundle can hold, in the order the list shows them. */
export const BUNDLE_ITEM_KINDS = [
	'operator',
	'weapon',
	'finisher',
	'camo',
	'decal',
	'sticker',
	'charm',
	'reticle',
	'equipment',
	'card',
	'emblem',
	'loading',
	'spray',
	'token',
	'cp'
] as const;
export type BundleItemKind = (typeof BUNDLE_ITEM_KINDS)[number];

/** Extras Activision lists on a weapon blueprint. */
export type BlueprintTag = 'mastercraft' | 'reactive' | 'tracers' | 'deathfx';

export interface BundleItem {
	kind: BundleItemKind;
	name: string;
	/** Weapon blueprints: our weapon id (weapons.ts). */
	weapon?: string;
	/** Operator skins: whose operator, when known. */
	operator?: string;
	/** Operator skins and weapon blueprints (Activision doesn't show it for the small items). */
	rarity?: BundleRarity;
	tags?: BlueprintTag[];
	/** Operator skin: changes as you play ("Reactive"). */
	reactive?: boolean;
}

export interface Bundle {
	id: number;
	name: string;
	/** Activision's labels for the bundle, e.g. "Tracer Pack", "Mastercraft", "Ultra Skin". */
	labels: string[];
	/** COD Points; null = platform stores. */
	price: number | null;
	/** First day in the web store ("YYYY-MM-DD"). */
	from: string;
	/** The day it left the web store, once it has. */
	left?: string;
	items: BundleItem[];
	/** Anything worth knowing that the list doesn't say. */
	note?: string;
}

type Opts = Partial<Pick<BundleItem, 'tags' | 'reactive'>>;

const op = (name: string, operator: string | null, rarity: BundleRarity, extra: Opts = {}): BundleItem => ({
	kind: 'operator',
	name,
	...(operator ? { operator } : {}),
	rarity,
	...extra
});
const gun = (weapon: string, name: string, rarity: BundleRarity, tags = ''): BundleItem => ({
	kind: 'weapon',
	name,
	weapon,
	rarity,
	...(tags ? { tags: tags.split(' ') as BlueprintTag[] } : {})
});
const x = (kind: BundleItemKind, name: string): BundleItem => ({ kind, name });

/** Mastercraft blueprints in a Tracer Pack carry both effects. */
const MC_FX = 'mastercraft tracers deathfx';
const FX = 'tracers deathfx';

export const BUNDLES: Bundle[] = [
	{
		id: 7770,
		name: 'Deadly Grounds',
		labels: [],
		price: 1800,
		from: '2026-11-19',
		items: [
			op('Hallow', 'Coffey', 'legendary'),
			gun('vel-46', 'Dark Essence', 'legendary'),
			gun('oden', 'Final Rest', 'legendary'),
			x('loading', 'No Survivors'),
			x('reticle', 'Bite'),
			x('emblem', 'Lethal Reverence')
		]
	},
	{
		id: 7806,
		name: 'Drone Out',
		labels: ['Ultra Blueprint'],
		price: 2400,
		from: '2026-11-18',
		items: [
			op('Flyby', 'Coffey', 'legendary'),
			gun('csg-35', 'Drag Out', 'ultra'),
			gun('finn-lmg', 'Show Stopper', 'legendary'),
			x('card', 'Fire First'),
			x('sticker', 'Bad Landing'),
			x('loading', 'Terminus'),
			x('emblem', 'Electro-charged')
		]
	},
	{
		id: 7440,
		name: 'Las Almas Eternal',
		labels: ['Legends Pack', 'Mastercraft'],
		price: 3000,
		from: '2026-11-17',
		items: [
			op('Santa Muerte', 'Valeria', 'legendary'),
			gun('hyeon-burst', 'Mordida Final', 'ultra', MC_FX),
			gun('krait-p68', 'Vibora Negra', 'legendary', FX),
			x('finisher', 'Get Shocked'),
			x('card', 'Exhume'),
			x('charm', 'Reina de la Muerte'),
			x('charm', 'Las Almas Eternal'),
			x('emblem', 'Si Nombre'),
			x('reticle', 'Presagio Funesto')
		]
	},
	{
		id: 7767,
		name: 'Crimson Ritual',
		labels: ['Tracer Pack', 'Mastercraft', 'Ultra Skin'],
		price: 3000,
		from: '2026-11-15',
		items: [
			op('Shrouded', 'Park', 'ultra'),
			gun('iso-nightshade', 'Absolution', 'ultra', 'mastercraft reactive tracers deathfx'),
			gun('m4', 'Black Rite', 'legendary', FX),
			x('finisher', 'Blink Strike'),
			x('card', 'Forbidden Way'),
			x('charm', 'Bleed Out'),
			x('loading', 'Recondite'),
			x('emblem', 'Blood Pore')
		]
	},
	{
		id: 7789,
		name: 'Gaksuli',
		labels: ['Elite Squad', 'Ultra Skin'],
		price: 3000,
		from: '2026-11-14',
		items: [
			op('Oedari', 'Park', 'ultra'),
			op('Chonggak', 'Kal', 'ultra'),
			op('Oenun', 'Blix', 'ultra'),
			op('Cham', 'Jae', 'ultra'),
			gun('hyeon-burst', 'Saja Fire', 'legendary'),
			gun('type-73', 'Soulmark', 'legendary'),
			x('sticker', 'Masquerade'),
			x('reticle', 'Seared Wing'),
			x('emblem', 'Squad Anarchy'),
			x('card', 'Face It')
		],
		note: 'Four operator skins, one each for Park, Kal, Blix and Jae.'
	},
	{
		id: 7869,
		name: 'Emerald Reaper',
		labels: ['Starter Pack'],
		price: null,
		from: '2026-11-13',
		items: [
			op('Ozone', 'Blackwell', 'legendary', { reactive: true }),
			gun('patriot-xmr', 'Malachite', 'legendary'),
			x('sticker', 'Greens Eat You'),
			x('sticker', 'Finders Keepers'),
			x('charm', 'Gem Heart'),
			x('cp', '500 COD Points')
		],
		note: 'Sold for real money in the console and PC stores, not for COD Points. It comes with 500 COD Points.'
	},
	{
		id: 7785,
		name: 'No Man’s Land',
		labels: [],
		price: 2400,
		from: '2026-11-11',
		items: [
			op('Catalyst', 'Dallas', 'legendary'),
			gun('x-58-nyx', 'Wayward', 'ultra'),
			gun('sang-9mm', 'Nightglass', 'legendary'),
			x('loading', 'Death’s Approach'),
			x('emblem', 'Caustic Way'),
			x('card', 'Storm Watch'),
			x('sticker', 'No Path')
		]
	},
	{
		id: 7790,
		name: 'Hollow Hunter',
		labels: ['Adaptive Camo'],
		price: 2800,
		from: '2026-11-10',
		items: [
			op('Hunter’s Veil', null, 'ultra'),
			gun('cronen-osprey', 'Vanish', 'legendary'),
			gun('kg-7-vulcan', 'Low Profile', 'legendary'),
			x('charm', 'Bushy'),
			x('reticle', 'Out of Sight'),
			x('card', 'Conceal and Eliminate'),
			x('emblem', 'Ghillie Ops')
		],
		note: 'The operator skin can switch a ghillie suit on and off with a gesture.'
	},
	{
		id: 7766,
		name: 'Bone Chiller II',
		labels: ['Tracer Pack', 'Mastercraft', 'Ultra Skin'],
		price: 3000,
		from: '2026-11-07',
		items: [
			op('Golden Wraith', 'Ghost', 'ultra'),
			gun('patriot-xmr', 'Regalis', 'ultra', MC_FX),
			gun('hyeon-burst', 'Aurum', 'legendary', FX),
			gun('finn-lmg', 'Auric', 'legendary', FX),
			x('finisher', 'You’re Done'),
			x('charm', 'Visage'),
			x('reticle', 'Cryptic'),
			x('card', 'Gone Loud'),
			x('emblem', 'Dipped'),
			x('loading', 'Fortune’s Fate')
		]
	},
	{
		id: 7777,
		name: 'The Valkyrie',
		labels: ['Tracer Pack', 'Mastercraft', 'Ultra'],
		price: 3000,
		from: '2026-11-06',
		items: [
			op('Hildr', 'Valen', 'ultra'),
			gun('csg-35', 'Wings of Reckoning', 'ultra', 'mastercraft reactive tracers deathfx'),
			gun('m4', 'Skyfall', 'legendary', FX),
			x('finisher', 'Taken by Fate'),
			x('card', 'Fires of War'),
			x('charm', 'War Crest'),
			x('emblem', 'Burning Oath'),
			x('reticle', 'Mark of the Chosen'),
			x('equipment', 'Thunderclap')
		]
	},
	{
		id: 7795,
		name: 'Glitched State',
		labels: ['Tracer Pack', 'Mastercraft', 'Reactive'],
		price: 3000,
		from: '2026-11-06',
		items: [
			op('Debugged', 'Kal', 'ultra'),
			gun('cronen-osprey', 'Digital Drifter', 'ultra', MC_FX),
			gun('apoc-338', 'Unplugger', 'legendary', FX),
			x('finisher', 'Hop Off'),
			x('card', 'Tech Tyrant'),
			x('charm', 'High Score'),
			x('loading', 'System Breach'),
			x('emblem', 'Glitchwear'),
			x('reticle', 'Pixel U')
		]
	},
	{
		id: 7783,
		name: 'The Captain',
		labels: ['Legends Pack'],
		price: 2400,
		from: '2026-11-06',
		items: [
			op('Blackout', 'Price', 'legendary'),
			gun('iso-nightshade', 'Priced Out', 'ultra', 'tracers'),
			gun('mar-9', 'Priceless', 'legendary', 'tracers'),
			x('card', 'Final Smoke'),
			x('charm', 'Seen Action'),
			x('sticker', 'Still Hot'),
			x('charm', 'The Captain'),
			x('loading', 'If Ya Got ’Em'),
			x('reticle', '141')
		]
	},
	{
		id: 7792,
		name: 'CDL Launch Pack 2027',
		labels: ['Call of Duty League'],
		price: 2400,
		from: '2026-11-06',
		items: [
			op('CDL – Home – Male', null, 'rare'),
			op('CDL – Home – Female', null, 'rare'),
			op('CDL – Away – Male', null, 'rare'),
			op('CDL – Away – Female', null, 'rare'),
			x('camo', 'Blooming Skulls'),
			x('charm', 'Pineapple Grenade'),
			x('sticker', 'Death Skull'),
			x('card', 'The Final Grind'),
			x('emblem', 'Ice Cold'),
			x('spray', 'Choked'),
			x('card', 'Pumped Up'),
			x('emblem', 'Fist Bump')
		],
		note: 'The four skins are Call of Duty League kits (home and away, male and female); the weapon camo goes on any gun.'
	},
	{
		id: 7801,
		name: 'Steadfast',
		labels: ['Reactive'],
		price: 2400,
		from: '2026-11-06',
		items: [
			op('Rockslide', 'Reece', 'legendary'),
			gun('hyeon-burst', 'Glaive', 'legendary', 'reactive'),
			gun('signal-50', 'Infernum', 'legendary', 'reactive'),
			x('card', 'Firing Force'),
			x('sticker', 'Cross Section'),
			x('charm', 'Hoot')
		]
	},
	{
		id: 7769,
		name: 'Into the Fight',
		labels: [],
		price: 1800,
		from: '2026-11-06',
		items: [
			op('Marked', 'Blackwell', 'legendary'),
			gun('cronen-squall', 'Siegefire', 'legendary'),
			gun('signal-50', 'Counter Stand', 'legendary'),
			x('card', 'Skilled Hunter'),
			x('charm', 'Chained Up'),
			x('sticker', 'Out Rocked'),
			x('emblem', 'Op Ready'),
			x('reticle', 'Frey')
		]
	},
	{
		id: 7802,
		name: 'Deltabeast',
		labels: [],
		price: 1800,
		from: '2026-11-06',
		items: [
			op('Coiled', 'Reece', 'legendary'),
			gun('type-73', 'Mire Hunter', 'legendary'),
			gun('iso-nightshade', 'Coilfang', 'legendary'),
			x('emblem', 'Barbed Fang'),
			x('loading', 'Wound Up')
		]
	},
	{
		id: 7774,
		name: 'Northern Elite',
		labels: [],
		price: 1400,
		from: '2026-11-06',
		items: [
			op('JTF2', null, 'epic'),
			gun('mar-9', 'Northern Protector', 'epic'),
			x('sticker', 'Knife Way'),
			x('sticker', 'Maple Patrol'),
			x('emblem', 'Proud North')
		]
	},
	{
		id: 7775,
		name: 'Jadefire',
		labels: [],
		price: 1000,
		from: '2026-11-06',
		items: [gun('han-86', 'Verdigris', 'legendary'), x('sticker', 'Regal Snake'), x('emblem', 'Copper Dragon'), x('reticle', 'Tail Biter')],
		note: 'No operator skin: a weapon bundle.'
	},
	{
		id: 6773,
		name: 'C.O.D.E. Valor Pack',
		labels: ['Charity pack'],
		price: null,
		from: '2026-10-23',
		items: [
			op('Valor', 'Kyle', 'epic'),
			op('Relentless', 'Kyle', 'epic'),
			gun('m4', 'Forged Resolve', 'legendary'),
			gun('rezi-12', 'Still Standing', 'legendary'),
			gun('fss-carbon-edge-1095', 'Worth Fighting For', 'legendary'),
			x('sticker', 'Steel Talon'),
			x('emblem', 'Earned, Not Given'),
			x('charm', 'Nice Try'),
			x('loading', 'Blood, Sweat, & Sand'),
			x('card', 'Forged in Valor'),
			x('token', 'XP Token – 1 Hour'),
			x('token', 'Weapon XP Token – 1 Hour')
		],
		note: 'Made with Medal of Honor recipient Kyle Carpenter. Sold for real money in the console and PC stores; Activision gives all its net proceeds to the Call of Duty Endowment, which helps veterans find jobs.'
	}
];

/** Bundles newest first (then by store id, newest first). */
export function bundlesNewestFirst(list: readonly Bundle[] = BUNDLES): Bundle[] {
	return [...list].sort((a, b) => (a.from === b.from ? b.id - a.id : a.from < b.from ? 1 : -1));
}

/** The bundle's items in list order: skins, then blueprints, then the rest grouped by kind (stable). */
export function bundleItemsInOrder(b: Bundle): BundleItem[] {
	const rank = (k: BundleItemKind) => BUNDLE_ITEM_KINDS.indexOf(k);
	return b.items.map((it, i) => ({ it, i })).sort((p, q) => rank(p.it.kind) - rank(q.it.kind) || p.i - q.i).map((p) => p.it);
}

/** New in the store: from its first day for BUNDLE_NEW_DAYS days. `today` is "" before load (never new then). */
export function bundleIsNew(b: Bundle, today: string): boolean {
	if (!today || b.left) return false;
	const days = Math.round((Date.parse(today) - Date.parse(b.from)) / 86_400_000);
	return days >= 0 && days < BUNDLE_NEW_DAYS;
}

/** Every word a search should find a bundle by: its name, labels and every item (with gun and operator). */
export function bundleSearchText(b: Bundle, weaponName: (id: string) => string): string {
	return [b.name, ...b.labels, ...b.items.flatMap((it) => [it.name, it.operator ?? '', it.weapon ? weaponName(it.weapon) : ''])]
		.join(' ')
		.toLowerCase();
}
