/**
 * 4:20 (the 420 pack, 2026-11-16): every day from 16:20 to 17:20 by the viewer's own clock the page goes
 * green, the news buddy lights a holk, and anyone online with the squad gets the day's daily bonus a
 * second time (squad-casino.ts `count420`). Pure, so Node tests it (scripts/four20.test.js).
 */

export const F420 = { hour: 16, minute: 20, minutes: 60 } as const;

const START = F420.hour * 60 + F420.minute;

/** Whether it's 4:20 hour at this moment (local time). */
export function is420(d: Date): boolean {
	const m = d.getHours() * 60 + d.getMinutes();
	return m >= START && m < START + F420.minutes;
}

/** Minutes left of the 4:20 hour (0 outside it). */
export function minutesLeft420(d: Date): number {
	if (!is420(d)) return 0;
	return START + F420.minutes - (d.getHours() * 60 + d.getMinutes());
}
