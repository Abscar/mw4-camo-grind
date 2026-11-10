/**
 * What a challenge text counts, so a counter can use the right unit (2026-11-10, the user's brief:
 * "a counter must match the right unit; '15 kills in a single match' must not be reachable by
 * adding up kills from several matches"). Pure, tested in scripts/challenge.test.js against every
 * challenge in the data.
 *
 * - `total`  "50 Headshots", "Destroy 30 Killstreaks or Vehicles": one running total, any number
 *            of matches. Counter = how many so far.
 * - `repeat` "3 Kills without Dying ×15", "10 Kills in a Match ×7": a feat done again and again.
 *            Counter = how many times the feat is done (not the kills inside it).
 * - `once`   "15 Kills in a Single Match": has to happen inside one match, so there is nothing to add
 *            up across matches. No counter: tick it when it happens.
 */

export type ChallengeUnit =
	| { kind: 'total'; target: number; unit: string }
	| { kind: 'repeat'; target: number; feat: string }
	| { kind: 'once' };

const REPEAT = /^(.+?)\s*[×x]\s*(\d[\d,]*)$/;
const IN_ONE_MATCH = /\bin a (single )?match\b/i;
const DESTROY = /^Destroy (\d[\d,]*) (.+)$/i;
const TOTAL = /^(\d[\d,]*) (.+)$/;

const num = (s: string) => Number.parseInt(s.replace(/,/g, ''), 10);

export function parseChallenge(text: string): ChallengeUnit {
	const t = text.trim();
	const repeat = REPEAT.exec(t);
	if (repeat) return { kind: 'repeat', target: num(repeat[2]), feat: repeat[1].trim() };
	if (IN_ONE_MATCH.test(t)) return { kind: 'once' };
	const destroy = DESTROY.exec(t);
	if (destroy) return { kind: 'total', target: num(destroy[1]), unit: `${destroy[2]} destroyed` };
	const total = TOTAL.exec(t);
	if (total) return { kind: 'total', target: num(total[1]), unit: total[2] };
	return { kind: 'once' };
}

/** The target of a counted challenge, or 0 for one that has no counter. */
export function targetOf(unit: ChallengeUnit): number {
	return unit.kind === 'once' ? 0 : unit.target;
}

/**
 * The bigger step buttons a counter gets next to +1, where they fit: running totals of 25 or more
 * get +5 (100 or more: +10). A repeated feat counts one at a time (each one is a separate feat).
 */
export function bigStep(unit: ChallengeUnit): number {
	if (unit.kind !== 'total') return 0;
	if (unit.target >= 100) return 10;
	if (unit.target >= 25) return 5;
	return 0;
}
