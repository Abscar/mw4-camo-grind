/**
 * Squad Mayhem's guns (2026-11-22): every MW4 weapon in weapons.ts gets game stats from its class, nudged a
 * little per weapon so two guns of one class don't feel the same. Pure, no DOM.
 */
import { WEAPONS, WEAPON_BY_ID } from '#lib/data/weapons.ts';

export type GunKind = 'pistol' | 'smg' | 'ar' | 'shotgun' | 'lmg' | 'marksman' | 'sniper' | 'launcher' | 'melee';

export interface GunStats {
	id: string;
	name: string;
	kind: GunKind;
	/** damage per bullet (per pellet for shotguns), in the player's hands */
	dmg: number;
	/** seconds between shots */
	rate: number;
	mag: number;
	/** spread, radians either side */
	spread: number;
	pellets: number;
	speed: number;
	auto: boolean;
	/** how many fighters a bullet goes through */
	pierce: number;
	/** how far it carries before it's gone (px) */
	reach: number;
	/** run speed multiplier while holding it */
	weight: number;
	/** how far away a shot is heard, × the kind's distance (Armory muzzle parts; unset = 1) */
	noise?: number;
}

const CLASS_KIND: Record<string, GunKind> = {
	'assault-rifles': 'ar',
	smgs: 'smg',
	shotguns: 'shotgun',
	lmgs: 'lmg',
	'marksman-rifles': 'marksman',
	'sniper-rifles': 'sniper',
	pistols: 'pistol',
	launchers: 'launcher',
	melee: 'melee'
};

const BASE: Record<GunKind, Omit<GunStats, 'id' | 'name' | 'kind'>> = {
	pistol: { dmg: 34, rate: 0.2, mag: 12, spread: 0.03, pellets: 1, speed: 1500, auto: false, pierce: 0, reach: 900, weight: 1 },
	smg: { dmg: 20, rate: 0.075, mag: 32, spread: 0.075, pellets: 1, speed: 1550, auto: true, pierce: 0, reach: 700, weight: 1 },
	ar: { dmg: 27, rate: 0.105, mag: 30, spread: 0.04, pellets: 1, speed: 1750, auto: true, pierce: 0, reach: 1100, weight: 0.95 },
	shotgun: { dmg: 17, rate: 0.62, mag: 7, spread: 0.2, pellets: 8, speed: 1400, auto: false, pierce: 0, reach: 420, weight: 0.95 },
	lmg: { dmg: 24, rate: 0.085, mag: 80, spread: 0.07, pellets: 1, speed: 1700, auto: true, pierce: 1, reach: 1100, weight: 0.8 },
	marksman: { dmg: 70, rate: 0.32, mag: 10, spread: 0.012, pellets: 1, speed: 2100, auto: false, pierce: 1, reach: 1400, weight: 0.92 },
	sniper: { dmg: 160, rate: 1.0, mag: 5, spread: 0.004, pellets: 1, speed: 2600, auto: false, pierce: 3, reach: 1600, weight: 0.85 },
	launcher: { dmg: 160, rate: 1.1, mag: 3, spread: 0.01, pellets: 1, speed: 820, auto: false, pierce: 0, reach: 1400, weight: 0.8 },
	melee: { dmg: 85, rate: 0.34, mag: 0, spread: 0, pellets: 0, speed: 0, auto: false, pierce: 0, reach: 0, weight: 1.08 }
};

/** A small, fixed nudge per weapon (−8 % … +8 %), from its slot. */
const nudge = (slot: number, salt: number) => 1 + ((((slot * 37 + salt * 11) % 17) - 8) / 100);

const cache = new Map<string, GunStats>();

/** Game stats for an MW4 weapon id (unknown ids fall back to a plain pistol). */
export function gunOf(id: string): GunStats {
	const hit = cache.get(id);
	if (hit) return hit;
	const w = WEAPON_BY_ID.get(id);
	const kind = (w && CLASS_KIND[w.classId]) || 'pistol';
	const b = BASE[kind];
	const slot = w?.slot ?? 0;
	const g: GunStats = {
		...b,
		id,
		name: w?.name ?? 'Pistol',
		kind,
		dmg: Math.round(b.dmg * nudge(slot, 1)),
		rate: +(b.rate * nudge(slot, 2)).toFixed(3),
		mag: b.mag ? Math.max(2, Math.round(b.mag * nudge(slot, 3))) : 0
	};
	// the big pistols hit harder and slower
	if (/50 GS|Mojave/i.test(g.name)) Object.assign(g, { dmg: 62, rate: 0.36, mag: 7 });
	cache.set(id, g);
	return g;
}

/** Weapons that are out (JAK-12 / ZLR have no specials yet = not released). */
export const OUT_WEAPONS = WEAPONS.filter((w) => w.specials.length > 0);

export const weaponsOfKind = (k: GunKind) => OUT_WEAPONS.filter((w) => CLASS_KIND[w.classId] === k);

/** The first released pistol: what you start with when nothing else is picked. */
export const STARTER = weaponsOfKind('pistol')[0]?.id ?? OUT_WEAPONS[0].id;
