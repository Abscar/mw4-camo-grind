/**
 * How each weapon's little cartoon icon looks (presentation only, keyed by weapon id).
 * The shapes follow the real-world gun each MW4 weapon is based on (see mw4-kunskap):
 * stock, magazine, sight, handguard, muzzle and so on. Drawn by WeaponIcon.svelte.
 * Exception: the CS2 easter eggs (`Cs2Look`, see below) are drawn as the CS2 gun instead.
 * Every weapon in weapons.ts must have an entry (checked by the tests).
 */

export type Stock = 'fixed' | 'skeleton' | 'wood' | 'folded';
export type Mag = 'straight' | 'curved' | 'drum' | 'box' | 'tube' | 'grip' | 'none';
export type Optic = 'irons' | 'red' | 'scope' | 'big';
export type Guard = 'rail' | 'slim' | 'wood' | 'shroud';
export type Muzzle = 'plain' | 'brake' | 'can' | 'cone';

export type RifleLook = {
	kind: 'rifle';
	stock: Stock;
	mag: Mag;
	optic: Optic;
	guard: Guard;
	muzzle: Muzzle;
	/** Barrel length, roughly 0.3 (compact SMG) to 1.5 (anti-materiel rifle). */
	barrel: number;
	body: string;
	furniture: string;
	bullpup?: boolean;
	bipod?: boolean;
	bolt?: boolean;
	pump?: boolean;
	carry?: boolean;
};
export type PistolLook = { kind: 'pistol'; style: 'auto' | 'deagle' | 'revolver'; body: string; grip: string };
export type LauncherLook = { kind: 'launcher'; style: 'rpg' | 'javelin' | 'manpads' | 'grenade'; body: string };
export type MeleeLook = { kind: 'melee'; style: 'knife' | 'axe'; body: string; handle: string };

/**
 * Easter eggs (the user's picks, 2026-11-07): MW4 guns built on the same real-world gun as a
 * CS2 gun are drawn as that CS2 gun wearing the user's favourite CS2 skin for it (Cs2Gun.svelte).
 * Our own cartoons in the skin's style (researched from item pictures), never the game textures,
 * and no names in the UI.
 */
export type Skin = 'fire-serpent' | 'asiimov' | 'blaze' | 'printstream' | 'bloodsport' | 'frost-borre' | 'fade' | 'lightning-strike';
export type Cs2Model = 'ak47' | 'm4a4' | 'deagle' | 'usps' | 'mp7' | 'r8' | 'xm1014' | 'karambit' | 'awp';
export type Cs2Look = { kind: 'cs2'; model: Cs2Model; skin: Skin };

export type GunLook = RifleLook | PistolLook | LauncherLook | MeleeLook | Cs2Look;

const BLACK = '#2b2f36';
const GUNMETAL = '#4a5059';
const TAN = '#c2a170';
const OD = '#6b7448';
const WOOD = '#9a5f2e';
const GREY = '#8d959e';

const rifle = (look: Omit<RifleLook, 'kind'>): RifleLook => ({ kind: 'rifle', ...look });

export const WEAPON_LOOKS: Record<string, GunLook> = {
	// Assault rifles
	'han-86': rifle({ stock: 'fixed', mag: 'straight', optic: 'irons', guard: 'slim', muzzle: 'brake', barrel: 1, body: BLACK, furniture: BLACK }),
	m4: { kind: 'cs2', model: 'm4a4', skin: 'asiimov' },
	'hyeon-burst': rifle({ bullpup: true, stock: 'fixed', mag: 'straight', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.8, body: TAN, furniture: BLACK }),
	'patriot-xmr': rifle({ stock: 'fixed', mag: 'straight', optic: 'scope', guard: 'rail', muzzle: 'brake', barrel: 1.1, body: OD, furniture: BLACK }),
	'kastov-762': { kind: 'cs2', model: 'ak47', skin: 'fire-serpent' },
	oden: rifle({ bullpup: true, stock: 'fixed', mag: 'straight', optic: 'red', guard: 'slim', muzzle: 'brake', barrel: 0.9, body: GUNMETAL, furniture: BLACK }),
	axion: rifle({ stock: 'fixed', mag: 'straight', optic: 'red', guard: 'rail', muzzle: 'can', barrel: 0.7, body: BLACK, furniture: BLACK }),
	'cronen-squall': rifle({ stock: 'fixed', mag: 'straight', optic: 'scope', guard: 'rail', muzzle: 'brake', barrel: 1.1, body: TAN, furniture: BLACK }),
	'cronen-osprey': rifle({ stock: 'skeleton', mag: 'straight', optic: 'red', guard: 'rail', muzzle: 'brake', barrel: 1, body: OD, furniture: BLACK }),

	// SMGs
	'iso-nightshade': rifle({ stock: 'skeleton', mag: 'grip', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.5, body: BLACK, furniture: BLACK }),
	'vel-46': { kind: 'cs2', model: 'mp7', skin: 'bloodsport' },
	'wz-55-striga': rifle({ stock: 'folded', mag: 'grip', optic: 'irons', guard: 'slim', muzzle: 'plain', barrel: 0.35, body: GUNMETAL, furniture: BLACK }),
	'ppsh-41': rifle({ stock: 'wood', mag: 'drum', optic: 'irons', guard: 'shroud', muzzle: 'plain', barrel: 0.6, body: BLACK, furniture: WOOD }),
	'x-58-nyx': rifle({ stock: 'skeleton', mag: 'straight', optic: 'irons', guard: 'shroud', muzzle: 'plain', barrel: 0.6, body: BLACK, furniture: BLACK }),
	'csg-35': rifle({ stock: 'folded', mag: 'grip', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.4, body: TAN, furniture: BLACK }),

	// Shotguns
	'rezi-12': { kind: 'cs2', model: 'xm1014', skin: 'frost-borre' },
	warlord: rifle({ bullpup: true, stock: 'fixed', mag: 'tube', optic: 'irons', guard: 'slim', muzzle: 'plain', barrel: 0.8, pump: true, body: GUNMETAL, furniture: BLACK }),
	'jak-12': rifle({ stock: 'fixed', mag: 'drum', optic: 'irons', guard: 'slim', muzzle: 'plain', barrel: 0.8, body: BLACK, furniture: TAN }),

	// LMGs
	'finn-lmg': rifle({ stock: 'fixed', mag: 'box', optic: 'red', guard: 'rail', muzzle: 'brake', barrel: 1.1, bipod: true, body: BLACK, furniture: TAN }),
	'type-73': rifle({ stock: 'fixed', mag: 'box', optic: 'irons', guard: 'slim', muzzle: 'cone', barrel: 1.1, bipod: true, carry: true, body: GUNMETAL, furniture: OD }),
	'apoc-338': rifle({ stock: 'fixed', mag: 'box', optic: 'scope', guard: 'rail', muzzle: 'brake', barrel: 1.2, bipod: true, body: OD, furniture: BLACK }),

	// Marksman rifles
	'mar-9': rifle({ stock: 'fixed', mag: 'straight', optic: 'scope', guard: 'rail', muzzle: 'brake', barrel: 1.2, body: TAN, furniture: BLACK }),
	'oris-8-6': rifle({ stock: 'skeleton', mag: 'straight', optic: 'scope', guard: 'slim', muzzle: 'can', barrel: 0.9, bolt: true, body: GREY, furniture: BLACK }),
	'mosin-nagant': rifle({ stock: 'wood', mag: 'none', optic: 'irons', guard: 'wood', muzzle: 'plain', barrel: 1.4, bolt: true, body: BLACK, furniture: WOOD }),

	// Sniper rifles
	'kg-7-vulcan': { kind: 'cs2', model: 'awp', skin: 'lightning-strike' }, // the user's pick (2026-11-07), not a same-gun match
	'astaroth-57': rifle({ stock: 'fixed', mag: 'none', optic: 'big', guard: 'slim', muzzle: 'brake', barrel: 1.5, bolt: true, bipod: true, body: GUNMETAL, furniture: BLACK }),
	'signal-50': rifle({ bullpup: true, stock: 'fixed', mag: 'straight', optic: 'big', guard: 'slim', muzzle: 'brake', barrel: 1.2, bipod: true, body: BLACK, furniture: BLACK }),

	// Pistols
	'sang-9mm': { kind: 'pistol', style: 'auto', body: BLACK, grip: BLACK },
	'krait-p68': { kind: 'cs2', model: 'usps', skin: 'printstream' },
	'50-gs': { kind: 'cs2', model: 'deagle', skin: 'blaze' },
	'mojave-357': { kind: 'cs2', model: 'r8', skin: 'blaze' },

	// Launchers
	pila: { kind: 'launcher', style: 'manpads', body: OD },
	'rpg-8': { kind: 'launcher', style: 'rpg', body: OD },
	jokr: { kind: 'launcher', style: 'javelin', body: TAN },
	'pm-40-anvil': { kind: 'launcher', style: 'grenade', body: BLACK },

	// Melee
	'fss-carbon-edge-1095': { kind: 'cs2', model: 'karambit', skin: 'fade' },
	'zlr-talonhawk': { kind: 'melee', style: 'axe', body: BLACK, handle: OD }
};
