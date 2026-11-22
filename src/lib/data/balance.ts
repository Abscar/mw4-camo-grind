/**
 * The latest weapon balance patch: which guns got a buff or a nerf, shown as a small badge on
 * each weapon and explained in its weapon card. A dated SNAPSHOT (like loadouts.ts): refresh it
 * when a new balance patch lands. Research notes: mw4-kunskap/meta.md ("Patch 19 nov 2026") and
 * mw4-kunskap/uppdateringar-och-leaks.md ("Vapenbalans 19 november").
 *
 * 19 Nov 2026 update (a new dated section in Activision's Season 1 patch notes on callofduty.com,
 * read 2026-11-22): 14 guns, more range and damage for full-auto guns and LMGs, three Apex
 * attachments (Hyeon Auto, Kastov 545, Rezi 12 Enforcer's explosive slugs) and a Mosin-Nagant nerf;
 * codmunity's copy of the official text (codmunity.gg/patch-notes/mw4/2026-11-19) has the same
 * numbers. The Mosin-Nagant does less damage out to 45 m (Infinity Ward said it was
 * over-performing), so it's a nerf even though its top damage now reaches further. The FiNN LMG's
 * max damage range got a little shorter, but it hits harder up to 20 m and lower-torso hits do
 * more everywhere, so it counts as a buff here (codmunity calls both nerfs). It replaces the
 * 13 Nov list, which is in git history. Keyed by weapon id (see weapons.ts).
 */

export type BalanceChange = 'buff' | 'nerf';

export interface BalanceEntry {
	change: BalanceChange;
	/** What changed, short and plain. */
	text: string;
}

export const BALANCE_PATCH = {
	name: '19 Nov update',
	/** The day the patch went live (YYYY-MM-DD). */
	date: '2026-11-19',
	sources: 'callofduty.com and codmunity'
} as const;

export const BALANCE: Record<string, BalanceEntry> = {
	// Assault rifles
	m4: { change: 'buff', text: 'Headshot multiplier 1.3 → 1.35. Nothing else changed.' },
	'cronen-squall': { change: 'buff', text: 'Max damage range 27.9 → 31.2 m, mid range 43.2 → 47.2 m and min damage 22 → 24.' },
	oden: { change: 'buff', text: 'Max damage range 33 → 36.8 m (+12 %) and min damage 32 → 34.' },
	'patriot-xmr': { change: 'buff', text: 'Min damage 24 → 25.' },
	'hyeon-burst': {
		change: 'buff',
		text: 'Hyeon Auto Apex: max damage range 26.4 → 33.5 m (+27 %), min damage 29 → 30 and headshot multiplier 1.3 → 1.4.'
	},
	'kastov-762': { change: 'buff', text: 'Kastov 545 Apex: max damage range 11 → 13.7 m (+25 %) and mid range 20.6 → 27.7 m (+35 %).' },
	// SMGs
	'csg-35': { change: 'buff', text: 'Max damage range 10.4 → 11.2 m and mid range 19.8 → 22.6 m (+14 %).' },
	'iso-nightshade': { change: 'buff', text: 'Max damage range 12.5 → 14 m (+12 %), and leg and foot hits no longer do less (0.95 → 1).' },
	'ppsh-41': { change: 'buff', text: 'Max damage 18 → 19, and neck and torso hits do 6 % more (1 → 1.06).' },
	'x-58-nyx': { change: 'buff', text: 'Max damage range 11.9 → 12.5 m.' },
	// LMGs
	'finn-lmg': {
		change: 'buff',
		text: 'Max damage 30 → 31 and lower-torso hits 1 → 1.1, but max damage range 21.8 → 20.3 m. Harder hits up to 20 m; only from 20 to 22 m it now does 28 instead of 30.'
	},
	'type-73': {
		change: 'buff',
		text: 'Max damage 22 → 23, min damage 19 → 20 and lower-torso hits 1 → 1.1. Type 73 Assault Apex: +1 damage up close and at mid range, which now reaches 58.4 m (was 43.1).'
	},
	// Marksman rifles
	'mosin-nagant': {
		change: 'nerf',
		text: 'Max damage 95 → 91, now out to 43 m (was 15 m); then 86 to 58 m and 68 past that (was 60). Less damage up to 45 m, more only past 58 m: Infinity Ward said it was over-performing.'
	},
	// Shotguns
	'rezi-12': {
		change: 'buff',
		text: 'Rezi 12 Enforcer Apex, explosive slugs only: mid damage range 27.7 → 29.6 m and bullet speed 220 → 245 m/s.'
	}
};
