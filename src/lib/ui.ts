/** Small presentation helpers shared by components. */

import type { LadderCamoId, MasteryStatus } from './data/camos.ts';
import { UNLOCK_LEVEL_NOTE, type Fact, type Unlock } from './data/weapons.ts';
import { t } from './i18n/en.ts';

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

/** "2026-11-06" → "6 Nov 2026" (no Date object, so no time-zone surprises). */
export function shortDate(iso: string): string {
	const [y, m, d] = iso.split('-').map(Number);
	return `${d} ${MONTHS[m - 1]} ${y}`;
}
