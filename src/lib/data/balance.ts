/**
 * The latest weapon balance patch: which guns got a buff or a nerf, shown as a small badge on
 * each weapon and explained in its weapon card. A dated SNAPSHOT (like loadouts.ts): refresh it
 * when a new balance patch lands. Research notes: mw4-kunskap/meta.md ("Season 1, 5 nov 2026")
 * and mw4-kunskap/uppdateringar-och-leaks.md ("Vapenbalans 6 november").
 *
 * Season 1 (patch notes 5 Nov 2026, live 6 Nov): 14 buffs and 3 nerfs, the same list and numbers
 * in mp1st (official values), CODMunity and Vice. Keyed by weapon id (see weapons.ts).
 */

export type BalanceChange = 'buff' | 'nerf';

export interface BalanceEntry {
	change: BalanceChange;
	/** What changed, short and plain. */
	text: string;
}

export const BALANCE_PATCH = {
	name: 'Season 1',
	/** The day the patch went live (YYYY-MM-DD). */
	date: '2026-11-06',
	sources: 'mp1st (official numbers), CODMunity and Vice'
} as const;

export const BALANCE: Record<string, BalanceEntry> = {
	// Assault rifles
	axion: { change: 'buff', text: 'Longer mid damage range (34.8 → 38.6 m) and faster bullets (415 → 470 m/s).' },
	'han-86': { change: 'buff', text: 'Headshot multiplier 1.25 → 1.3.' },
	'hyeon-burst': {
		change: 'nerf',
		text: 'Hyeon Hyperburst Apex: max damage 30 → 23 and min damage 25 → 20, with a longer damage range. The base gun gets a little more mid damage (24 → 25).'
	},
	'kastov-762': {
		change: 'buff',
		text: 'Mid damage 24 → 25, longer mid range, headshot 1.33 → 1.35 and neck / upper torso 1.08 → 1.1.'
	},
	m4: { change: 'buff', text: 'Max damage range 25.9 → 27.9 m and headshot 1.25 → 1.3. The Hurricane Apex reaches further too.' },
	'patriot-xmr': { change: 'buff', text: 'Max damage range 31.2 → 33.5 m and faster movement while aiming.' },
	// SMGs
	'iso-nightshade': { change: 'buff', text: 'Max damage range 10.5 → 11.7 m and min damage 13 → 14.' },
	'ppsh-41': { change: 'buff', text: 'More damage further out: mid damage 13 → 14 and min damage 12 → 13.' },
	'vel-46': {
		change: 'nerf',
		text: 'Shorter damage ranges (max 10.1 → 9.7 m, mid 17.3 → 16.5 m). Min damage goes up a little (13 → 14).'
	},
	'wz-55-striga': { change: 'buff', text: 'Max damage 26 → 27, min damage 17 → 19 and headshot 1.3 → 1.4.' },
	'x-58-nyx': { change: 'buff', text: 'More damage further out: mid damage 15 → 16 and min damage 13 → 14.' },
	// LMGs
	'apoc-338': { change: 'nerf', text: 'Headshot 1.35 → 1.3 and min damage 33 → 32. Its second nerf in a row.' },
	'type-73': {
		change: 'buff',
		text: 'Longer max damage range and headshot 1.25 → 1.3. The Type 73 Assault Apex gets more range and damage.'
	},
	// Shotguns
	'rezi-12': { change: 'buff', text: 'Longer damage ranges and min damage 14 → 16 (Enforcer Apex 19 → 20).' },
	// Marksman rifles
	'mosin-nagant': { change: 'buff', text: 'Max damage range 36.8 → 40.1 m.' },
	'oris-8-6': { change: 'buff', text: 'Max damage range 19.1 → 22.6 m (+19 %) and min damage 58 → 63.' },
	// Pistols
	'krait-p68': { change: 'buff', text: 'Longer damage ranges and lower torso multiplier 1 → 1.1.' }
};
