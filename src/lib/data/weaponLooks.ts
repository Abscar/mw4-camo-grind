/**
 * How each weapon's little cartoon icon looks (presentation only, keyed by weapon id).
 * The shapes follow the real-world gun each MW4 weapon is based on (see mw4-kunskap):
 * stock, magazine, sight, handguard, muzzle and so on. Drawn by WeaponIcon.svelte.
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
export type GunLook = RifleLook | PistolLook | LauncherLook | MeleeLook;

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
	m4: rifle({ stock: 'fixed', mag: 'straight', optic: 'red', guard: 'rail', muzzle: 'brake', barrel: 1, body: BLACK, furniture: BLACK }),
	'hyeon-burst': rifle({ bullpup: true, stock: 'fixed', mag: 'straight', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.8, body: TAN, furniture: BLACK }),
	'patriot-xmr': rifle({ stock: 'fixed', mag: 'straight', optic: 'scope', guard: 'rail', muzzle: 'brake', barrel: 1.1, body: OD, furniture: BLACK }),
	'kastov-762': rifle({ stock: 'wood', mag: 'curved', optic: 'irons', guard: 'wood', muzzle: 'cone', barrel: 1, body: BLACK, furniture: WOOD }),
	oden: rifle({ bullpup: true, stock: 'fixed', mag: 'straight', optic: 'red', guard: 'slim', muzzle: 'brake', barrel: 0.9, body: GUNMETAL, furniture: BLACK }),
	axion: rifle({ stock: 'fixed', mag: 'straight', optic: 'red', guard: 'rail', muzzle: 'can', barrel: 0.7, body: BLACK, furniture: BLACK }),
	'cronen-squall': rifle({ stock: 'fixed', mag: 'straight', optic: 'scope', guard: 'rail', muzzle: 'brake', barrel: 1.1, body: TAN, furniture: BLACK }),
	'cronen-osprey': rifle({ stock: 'skeleton', mag: 'straight', optic: 'red', guard: 'rail', muzzle: 'brake', barrel: 1, body: OD, furniture: BLACK }),

	// SMGs
	'iso-nightshade': rifle({ stock: 'skeleton', mag: 'grip', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.5, body: BLACK, furniture: BLACK }),
	'vel-46': rifle({ stock: 'folded', mag: 'grip', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.4, body: BLACK, furniture: BLACK }),
	'wz-55-striga': rifle({ stock: 'folded', mag: 'grip', optic: 'irons', guard: 'slim', muzzle: 'plain', barrel: 0.35, body: GUNMETAL, furniture: BLACK }),
	'ppsh-41': rifle({ stock: 'wood', mag: 'drum', optic: 'irons', guard: 'shroud', muzzle: 'plain', barrel: 0.6, body: BLACK, furniture: WOOD }),
	'x-58-nyx': rifle({ stock: 'skeleton', mag: 'straight', optic: 'irons', guard: 'shroud', muzzle: 'plain', barrel: 0.6, body: BLACK, furniture: BLACK }),
	'csg-35': rifle({ stock: 'folded', mag: 'grip', optic: 'red', guard: 'slim', muzzle: 'plain', barrel: 0.4, body: TAN, furniture: BLACK }),

	// Shotguns
	'rezi-12': rifle({ stock: 'fixed', mag: 'tube', optic: 'irons', guard: 'slim', muzzle: 'plain', barrel: 1.1, body: BLACK, furniture: BLACK }),
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
	'kg-7-vulcan': rifle({ stock: 'fixed', mag: 'straight', optic: 'big', guard: 'slim', muzzle: 'can', barrel: 1.3, bolt: true, bipod: true, body: OD, furniture: OD }),
	'astaroth-57': rifle({ stock: 'fixed', mag: 'none', optic: 'big', guard: 'slim', muzzle: 'brake', barrel: 1.5, bolt: true, bipod: true, body: GUNMETAL, furniture: BLACK }),
	'signal-50': rifle({ bullpup: true, stock: 'fixed', mag: 'straight', optic: 'big', guard: 'slim', muzzle: 'brake', barrel: 1.2, bipod: true, body: BLACK, furniture: BLACK }),

	// Pistols
	'sang-9mm': { kind: 'pistol', style: 'auto', body: BLACK, grip: BLACK },
	'krait-p68': { kind: 'pistol', style: 'auto', body: BLACK, grip: TAN },
	'50-gs': { kind: 'pistol', style: 'deagle', body: GREY, grip: BLACK },
	'mojave-357': { kind: 'pistol', style: 'revolver', body: GREY, grip: WOOD },

	// Launchers
	pila: { kind: 'launcher', style: 'manpads', body: OD },
	'rpg-8': { kind: 'launcher', style: 'rpg', body: OD },
	jokr: { kind: 'launcher', style: 'javelin', body: TAN },
	'pm-40-anvil': { kind: 'launcher', style: 'grenade', body: BLACK },

	// Melee
	'fss-carbon-edge-1095': { kind: 'melee', style: 'knife', body: GREY, handle: BLACK },
	'zlr-talonhawk': { kind: 'melee', style: 'axe', body: BLACK, handle: OD }
};
