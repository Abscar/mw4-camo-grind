/**
 * Abscars Madness' Armory (2026-11-28, the user: "när du är färdig en bana med ett vapen så kan du ha det
 * liggande i ditt armory, och lägga till attachments och grejer på dem så att de blir bättre").
 *
 * - Finishing a level with a gun in your hands puts that gun in your Armory (or ranks it up: one rank per clear
 *   with it). Armory guns can be your starting gun.
 * - Attachments cost the cash you loot from the enemies you kill (engine.ts CASH; 2026-11-28, the user: "Ja, byt
 *   till pengar", they cost Gun Parts for the first hour). A bought one stays on that gun and can be swapped freely.
 * - Five slots (optic, muzzle, barrel, magazine, stock), three parts each; the better ones need the gun's rank.
 *   Each part changes the gun's game stats (guns.ts) with a small trade-off. Melee weapons take no attachments.
 * Pure, no DOM: the page stores it under `camp.armory` (+ `camp.spent` = dollars spent), the engine gets `kitStats()`.
 */
import { gunOf, OUT_WEAPONS, type GunStats } from './guns.ts';

const KNOWN = new Set(OUT_WEAPONS.map((w) => w.id));

export type Slot = 'optic' | 'muzzle' | 'barrel' | 'mag' | 'stock';
export const SLOTS: Slot[] = ['optic', 'muzzle', 'barrel', 'mag', 'stock'];

/** what a part does: multipliers on the gun's stats (1 = unchanged), `pierce` is added */
export interface Mods {
	dmg?: number;
	rate?: number;
	mag?: number;
	spread?: number;
	reach?: number;
	speed?: number;
	weight?: number;
	pierce?: number;
	/** how far away enemies hear the shot */
	noise?: number;
}

export interface Attachment {
	/** stored: never change or reuse one */
	id: string;
	slot: Slot;
	name: string;
	/** price in looted dollars */
	cost: number;
	/** the gun rank needed (rank = levels finished with it) */
	rank: number;
	mods: Mods;
}

export const ATTACHMENTS: Attachment[] = [
	{ id: 'reflex', slot: 'optic', name: 'Red Dot', cost: 200, rank: 1, mods: { spread: 0.85 } },
	{ id: 'holo', slot: 'optic', name: 'Holo Sight', cost: 450, rank: 2, mods: { spread: 0.75, reach: 1.1 } },
	{ id: 'scope', slot: 'optic', name: '4x Scope', cost: 800, rank: 3, mods: { spread: 0.55, reach: 1.35, weight: 0.97 } },
	{ id: 'comp', slot: 'muzzle', name: 'Compensator', cost: 200, rank: 1, mods: { spread: 0.88, noise: 1.1 } },
	{ id: 'supp', slot: 'muzzle', name: 'Suppressor', cost: 500, rank: 2, mods: { noise: 0.3, dmg: 0.95 } },
	{ id: 'brake', slot: 'muzzle', name: 'Muzzle Brake', cost: 750, rank: 3, mods: { dmg: 1.1, spread: 0.9, noise: 1.2 } },
	{ id: 'short', slot: 'barrel', name: 'Short Barrel', cost: 250, rank: 1, mods: { rate: 0.9, reach: 0.85, weight: 1.04 } },
	{ id: 'long', slot: 'barrel', name: 'Long Barrel', cost: 550, rank: 2, mods: { dmg: 1.12, reach: 1.25, speed: 1.15, weight: 0.96 } },
	{ id: 'heavy', slot: 'barrel', name: 'Heavy Barrel', cost: 900, rank: 3, mods: { dmg: 1.22, pierce: 1, rate: 1.06, weight: 0.93 } },
	{ id: 'ext', slot: 'mag', name: 'Extended Mag', cost: 250, rank: 1, mods: { mag: 1.4, weight: 0.98 } },
	{ id: 'hollow', slot: 'mag', name: 'Hollow Points', cost: 500, rank: 2, mods: { dmg: 1.15, mag: 0.85 } },
	{ id: 'drum', slot: 'mag', name: 'Drum Mag', cost: 850, rank: 3, mods: { mag: 2, weight: 0.92 } },
	{ id: 'light', slot: 'stock', name: 'Light Stock', cost: 200, rank: 1, mods: { weight: 1.06, spread: 1.05 } },
	{ id: 'grip', slot: 'stock', name: 'Vertical Grip', cost: 450, rank: 2, mods: { spread: 0.85, rate: 0.95 } },
	{ id: 'tac', slot: 'stock', name: 'Tactical Stock', cost: 700, rank: 3, mods: { weight: 1.05, spread: 0.88, dmg: 1.05 } }
];
export const ATT_BY_ID = new Map(ATTACHMENTS.map((a) => [a.id, a]));

/** one Armory gun: levels finished with it, parts bought, parts on it */
export interface ArmoryGun {
	n: number;
	own: string[];
	eq: Partial<Record<Slot, string>>;
}
export type Armory = Record<string, ArmoryGun>;

export const RANK_MAX = 3;
/** rank from levels finished with the gun: 1 at once, 2 after 3, 3 after 6 */
export const rankOf = (n: number) => (n >= 6 ? 3 : n >= 3 ? 2 : 1);
export const nextRankAt = (n: number) => (n < 3 ? 3 : n < 6 ? 6 : null);

export const takesParts = (gunId: string) => gunOf(gunId).kind !== 'melee';

/** what a part costs (0 for an unknown id) */
export const costOf = (attId: string) => ATT_BY_ID.get(attId)?.cost ?? 0;

/** A level finished holding this gun: add it to the Armory or rank it up */
export function addClear(a: Armory, gunId: string): Armory {
	const old = a[gunId] ?? { n: 0, own: [], eq: {} };
	return { ...a, [gunId]: { ...old, n: Math.min(9999, old.n + 1) } };
}

export type BuyCheck = 'ok' | 'owned' | 'rank' | 'poor' | 'none';
export function canBuyPart(a: Armory, gunId: string, attId: string, money: number): BuyCheck {
	const g = a[gunId];
	const att = ATT_BY_ID.get(attId);
	if (!g || !att || !takesParts(gunId)) return 'none';
	if (g.own.includes(attId)) return 'owned';
	if (rankOf(g.n) < att.rank) return 'rank';
	return att.cost <= money ? 'ok' : 'poor';
}

/** buy a part and put it on at once */
export function buyPart(a: Armory, gunId: string, attId: string, money: number): Armory {
	if (canBuyPart(a, gunId, attId, money) !== 'ok') return a;
	const g = a[gunId];
	const att = ATT_BY_ID.get(attId)!;
	return { ...a, [gunId]: { ...g, own: [...g.own, attId], eq: { ...g.eq, [att.slot]: attId } } };
}

/** put a bought part on (or `null` = take that slot's part off) */
export function equipPart(a: Armory, gunId: string, slot: Slot, attId: string | null): Armory {
	const g = a[gunId];
	if (!g) return a;
	const eq = { ...g.eq };
	if (attId === null) delete eq[slot];
	else {
		const att = ATT_BY_ID.get(attId);
		if (!att || att.slot !== slot || !g.own.includes(attId)) return a;
		eq[slot] = attId;
	}
	return { ...a, [gunId]: { ...g, eq } };
}

/** The gun's stats with its parts on. `noise` is a multiplier on how far a shot is heard. */
export function kitStats(gunId: string, eq: Partial<Record<Slot, string>> = {}): GunStats & { noise: number } {
	const b = gunOf(gunId);
	const out = { ...b, noise: 1 };
	if (b.kind === 'melee') return out;
	for (const s of SLOTS) {
		const att = eq[s] ? ATT_BY_ID.get(eq[s]!) : undefined;
		if (!att || att.slot !== s) continue;
		const m = att.mods;
		if (m.dmg) out.dmg *= m.dmg;
		if (m.rate) out.rate *= m.rate;
		if (m.mag) out.mag *= m.mag;
		if (m.spread) out.spread *= m.spread;
		if (m.reach) out.reach *= m.reach;
		if (m.speed) out.speed *= m.speed;
		if (m.weight) out.weight *= m.weight;
		if (m.noise) out.noise *= m.noise;
		if (m.pierce) out.pierce += m.pierce;
	}
	out.dmg = Math.round(out.dmg);
	out.rate = +out.rate.toFixed(3);
	out.mag = Math.max(1, Math.round(out.mag));
	out.weight = Math.min(1.15, +out.weight.toFixed(3));
	return out;
}

/** Keep only known guns, known parts that were really bought and sit in their own slot. */
export function cleanArmory(v: unknown): Armory {
	const out: Armory = {};
	if (!v || typeof v !== 'object') return out;
	for (const [id, raw] of Object.entries(v as Record<string, unknown>)) {
		if (!raw || typeof raw !== 'object' || !KNOWN.has(id)) continue;
		const r = raw as Partial<ArmoryGun>;
		const n = Math.max(1, Math.min(9999, Math.floor(Number(r.n) || 1)));
		const own = Array.isArray(r.own) ? [...new Set(r.own.filter((x): x is string => typeof x === 'string' && ATT_BY_ID.has(x)))] : [];
		const eq: Partial<Record<Slot, string>> = {};
		if (r.eq && typeof r.eq === 'object')
			for (const s of SLOTS) {
				const x = (r.eq as Record<string, unknown>)[s];
				if (typeof x === 'string' && own.includes(x) && ATT_BY_ID.get(x)?.slot === s) eq[s] = x;
			}
		out[id] = { n, own: takesParts(id) ? own : [], eq: takesParts(id) ? eq : {} };
	}
	return out;
}
