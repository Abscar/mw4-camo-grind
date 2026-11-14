/**
 * The latest weapon balance patch: which guns got a buff or a nerf, shown as a small badge on
 * each weapon and explained in its weapon card. A dated SNAPSHOT (like loadouts.ts): refresh it
 * when a new balance patch lands. Research notes: mw4-kunskap/meta.md ("Patch 13 nov 2026") and
 * mw4-kunskap/uppdateringar-och-leaks.md ("Vapenbalans 13 november").
 *
 * 13 Nov 2026 update (a new dated section in Activision's Season 1 patch notes): longer damage
 * ranges for 18 guns plus three Apex attachments and the Krait's headshot; the same weapons and
 * numbers in codmunity's copy of the official text (codmunity.gg/patch-notes/mw4/2026-11-13) and
 * GamerFuzion. The Mosin-Nagant's max range got much shorter, but its damage went up so that it
 * hits as hard or harder at every distance, so it counts as a buff here. Class-wide flinch cuts
 * and aim assist through smoke aren't per-weapon, so they have no badge. It replaces the Season 1
 * list (6 Nov), which is in git history. Keyed by weapon id (see weapons.ts).
 */

export type BalanceChange = 'buff' | 'nerf';

export interface BalanceEntry {
	change: BalanceChange;
	/** What changed, short and plain. */
	text: string;
}

export const BALANCE_PATCH = {
	name: '13 Nov update',
	/** The day the patch went live (YYYY-MM-DD). */
	date: '2026-11-13',
	sources: 'codmunity (official numbers) and GamerFuzion'
} as const;

export const BALANCE: Record<string, BalanceEntry> = {
	// Assault rifles
	m4: { change: 'buff', text: 'Max damage range 27.9 → 35.3 m (+26 %). Damage itself unchanged.' },
	'han-86': { change: 'buff', text: 'Max damage range 30.5 → 32 m.' },
	'hyeon-burst': { change: 'buff', text: 'Max damage range 21.3 → 22.9 m and mid range 42.9 → 45.7 m.' },
	'kastov-762': { change: 'buff', text: 'Max damage range 26.7 → 28.7 m and mid range 42.2 → 44.1 m.' },
	oden: { change: 'buff', text: 'Mid damage range 50 → 58.4 m (+17 %).' },
	'patriot-xmr': { change: 'buff', text: 'Max damage range 33.5 → 35.6 m and min damage 22 → 24.' },
	axion: { change: 'buff', text: 'Mid damage range 38.6 → 40.1 m.' },
	'cronen-squall': { change: 'buff', text: 'Max damage range 26.4 → 27.9 m and mid range 37.3 → 43.2 m (+16 %).' },
	// SMGs
	'iso-nightshade': { change: 'buff', text: 'Max damage range 11.7 → 12.5 m, mid range 20.5 → 23 m and min damage 14 → 16.' },
	'ppsh-41': { change: 'buff', text: 'Max damage range 10.8 → 13.3 m (+24 %), mid range 20.2 → 21.3 m and min damage 13 → 14.' },
	'wz-55-striga': { change: 'buff', text: 'Max damage range 11.9 → 14.6 m and mid range 21.3 → 28.7 m (+34 %).' },
	'x-58-nyx': { change: 'buff', text: 'Max damage range 10.8 → 11.9 m and mid range 19.9 → 21.6 m.' },
	'csg-35': { change: 'buff', text: 'Mid damage range 19.2 → 19.8 m and min damage 13 → 14.' },
	// Shotguns
	'rezi-12': { change: 'buff', text: 'All three mid damage ranges a little longer (4.1 → 4.6 m, 6.4 → 7.1 m, 8.8 → 9.1 m).' },
	warlord: { change: 'buff', text: 'First mid damage range 3.8 → 4.1 m.' },
	// LMGs
	'finn-lmg': {
		change: 'buff',
		text: 'FiNN Adverse Apex: max damage range 16 → 21.3 m, mid range 35 → 38.6 m, and arm / leg hits do more (0.86 → 1 / 0.9).'
	},
	// Marksman rifles
	'mar-9': { change: 'buff', text: 'Max damage range 19.8 → 21.3 m and mid range 28.7 → 30.2 m.' },
	'mosin-nagant': {
		change: 'buff',
		text: 'Max damage 93 → 95, but only to 15 m (was 40 m); after that 93 to 45 m and 86 to 58 m. As hard or harder at every distance.'
	},
	// Pistols
	'krait-p68': { change: 'buff', text: 'Headshot multiplier 1.3 → 1.4, mid damage 39 → 40 and min damage 30 → 32.' },
	'sang-9mm': { change: 'buff', text: 'Both mid damage ranges longer (18.5 → 20.1 m and 25.9 → 27.9 m).' },
	'50-gs': { change: 'buff', text: 'Mid damage range 42 → 43.6 m and min damage 45 → 46.' },
	'mojave-357': { change: 'buff', text: 'Lawless Apex: mid damage range 12.2 → 13.7 m.' }
};
