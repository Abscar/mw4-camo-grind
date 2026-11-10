/** Small presentation helpers shared by components. */

import { LADDER, type LadderCamo, type LadderCamoId, type MasteryStatus } from './data/camos.ts';
import { CLASSES, UNLOCK_LEVEL_NOTE, type Fact, type Unlock } from './data/weapons.ts';
import { t } from './i18n/en.ts';

/** The next ladder camo a weapon needs and its class's challenge for it, or null when maxed. */
export function nextChallenge(classId: string, level: number): { camo: LadderCamo; fact: Fact } | null {
	const camo = LADDER[level];
	const cls = CLASSES.find((c) => c.id === classId);
	return camo && cls ? { camo, fact: cls.challenges[camo.id] } : null;
}

/** All 3 ladder camos (Gold, Platinum, Harmonic Break) with their challenge for a weapon class. */
export function ladderChallenges(classId: string): { camo: LadderCamo; fact: Fact }[] {
	const cls = CLASSES.find((c) => c.id === classId);
	return cls ? LADDER.map((camo) => ({ camo, fact: cls.challenges[camo.id] })) : [];
}

/** Fill colour of each ladder camo (CSS value). */
export const CAMO_FILL: Record<LadderCamoId, string> = {
	gold: 'var(--t-gold)',
	platinum: 'var(--t-plat)',
	harmonicBreak: 'var(--t-hb)'
};

/** Tailwind text class that is readable on panels, per ladder camo. */
export const CAMO_INK: Record<LadderCamoId, string> = {
	gold: 'text-gold-ink',
	platinum: 'text-plat-ink',
	harmonicBreak: 'text-hb-ink'
};

/**
 * Abscar: what a ticked box shows instead of ✔ (StashTick.svelte). The user asked for "a good mix"
 * of weed things instead of only leaves (2026-11-10). Papers come in two looks without any brand.
 */
export const TICK_ICONS = [
	'leaf',
	'bong',
	'blunt',
	'papersBrown',
	'pipe',
	'joint',
	'grinder',
	'lighter',
	'nug',
	'papersBlack',
	'brownie'
] as const;
export type TickIcon = (typeof TICK_ICONS)[number];

/**
 * The same icon for a box every time (worked out from the weapon's name, so the prerendered page
 * and the browser agree), and G / P / HB on one weapon are always three different ones (step 4,
 * which shares no factor with 11).
 */
export function tickIcon(weaponName: string, ladderIndex: number): TickIcon {
	let h = 0x811c9dc5;
	for (let i = 0; i < weaponName.length; i++) h = Math.imul(h ^ weaponName.charCodeAt(i), 0x01000193) >>> 0;
	return TICK_ICONS[(h + ladderIndex * 4) % TICK_ICONS.length];
}

export function percent(done: number, total: number): number {
	return total > 0 ? Math.round((done * 100) / total) : 0;
}

export function unlockFact(u: Unlock): Fact {
	switch (u.kind) {
		case 'level':
			return { text: t.weapon.level(u.level), verified: u.verified, note: UNLOCK_LEVEL_NOTE };
		case 'battlePass':
			return { text: t.weapon.battlePass(u.tier), verified: u.verified };
		case 'event':
			return { text: t.weapon.event, verified: u.verified, note: u.note };
	}
}

export function statusLabel(s: MasteryStatus): string {
	return t.mastery.status[s];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A moment (ms) → "17 Nov", in the viewer's time zone. */
export function dayMonth(ms: number): string {
	const d = new Date(ms);
	return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "2026-11-06" → "6 Nov 2026" (no Date object, so no time-zone surprises). */
export function shortDate(iso: string): string {
	const [y, m, d] = iso.split('-').map(Number);
	return `${d} ${MONTHS[m - 1]} ${y}`;
}
