/**
 * The season countdown (SeasonStrip, under the news radar; 2026-11-11, the user's pick from a
 * brainstorm). A dated SNAPSHOT: refresh it when Activision posts a date (the Season 1 Reloaded blog
 * should bring the mid-season dates), or when the user asks ("uppdatera").
 *
 * Checked 2026-11-11. Only the Season 1 start is official. callofduty.com couldn't be read directly,
 * so "official" = Activision's own wording as quoted by Impulse Gamer, timesaver.gg and GamerFuzion.
 * Everything not announced is `verified: false` with where the guess comes from, so the page marks it.
 * Dates are whole days ("YYYY-MM-DD", the viewer's calendar): no source gives times for the guesses.
 */

import type { Fact } from './weapons.ts';

export const SEASON_CHECKED = '2026-11-11';

export interface SeasonInfo {
	name: string;
	/** First day, "YYYY-MM-DD". */
	start: string;
	/** Last day ("YYYY-MM-DD"), and how sure we are about it. */
	end: string;
	endFact: Fact;
}

export const SEASON: SeasonInfo = {
	name: 'Season 1',
	// 6 Nov 2026, 00:00 ET = 06:00 Swedish time (callofduty.com Season 1 blog, 28 Oct, via timesaver.gg / GamerFuzion)
	start: '2026-11-06',
	end: '2027-01-06',
	endFact: {
		text: 'Season 1 ends',
		verified: false,
		note: 'Estimate: ggseason.com (7 Nov), from past season lengths. Activision hasn’t announced the end. The Battle Pass catch-up runs to day 50 (25 Dec), so it lasts at least until then.'
	}
};

/**
 * What's coming that matters for the grind, in the order shown. `on` ("YYYY-MM-DD") when a date is
 * known: the strip counts down to it, or says it's on once the day has come. Without `on`, `when`.
 */
export interface SeasonEvent {
	id: string;
	name: string;
	on?: string;
	when?: string;
	fact: Fact;
}

export const SEASON_EVENTS: SeasonEvent[] = [
	{
		id: 'wager',
		name: 'Wager Match event',
		on: '2026-11-11',
		fact: {
			text: 'Starts 11 Nov',
			verified: false,
			note: 'Reported by Dot Esports and Gamelevate (7 Nov) from the in-game timer; no time or end date given. The launch blog first said it was live at launch, the 5 Nov patch notes said “coming soon”.'
		}
	},
	{
		id: 'reloaded',
		name: 'Season 1 Reloaded',
		when: 'early December',
		fact: {
			text: 'Mid-season update',
			verified: false,
			note: 'No date announced (Keengamer, 7 Nov). The Bonus Rewards timer seen on launch day points to about 2–3 Dec (COD Central).'
		}
	},
	{
		id: 'newGuns',
		name: 'JAK 12 + ZLR Talonhawk',
		when: 'later in Season 1',
		fact: {
			text: 'Two more weapons to grind',
			verified: true,
			note: 'Activision’s Season 1 blog: “Later in the season, gain access to the full-auto JAK 12 Shotgun and the … ZLR Talonhawk” (in-season event rewards). Which event: not announced.'
		}
	},
	{
		id: 'doubleXp',
		name: 'Double Weapon XP',
		when: 'none announced yet',
		fact: {
			text: 'No event announced',
			verified: true,
			note: 'Nothing announced for November–December as of 11 Nov (lfcarry, Game8). Older CoDs ran one over US Thanksgiving, but that is a pattern, not news.'
		}
	}
];

/** "YYYY-MM-DD" → a day number (days since 1970 on the viewer's calendar), so day counts ignore clock times. */
export function dayNumber(isoDay: string): number {
	const [y, m, d] = isoDay.split('-').map(Number);
	return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Today's day number on the viewer's calendar. */
export function today(now: Date): number {
	return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
}

export interface SeasonView {
	/** 1 on the first day. */
	day: number;
	/** Days in the season, first and last day included. */
	length: number;
	/** Days until the last day (0 on it), never below 0. */
	daysLeft: number;
	/** How far through the season, 0–1. */
	share: number;
	ended: boolean;
}

export function seasonView(nowDay: number, s: SeasonInfo = SEASON): SeasonView {
	const start = dayNumber(s.start);
	const end = dayNumber(s.end);
	const length = end - start + 1;
	const day = nowDay - start + 1;
	return {
		day,
		length,
		daysLeft: Math.max(0, end - nowDay),
		share: Math.max(0, Math.min(1, day / length)),
		ended: nowDay > end
	};
}
