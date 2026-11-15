/*
	What a build's copy button copies (2026-11-14, the user's ask: "weapon build code copy buttons for all
	weapon builds available"). A build has a game code only when a site published one (codmunity's subclasses,
	data/siteBuilds.ts). Any other build card (our meta class, the Apex builds, the Ranked classes) gets that
	code too when it has exactly the same parts as one of the gun's codmunity subclasses in that mode. The rest
	(builds from sites without codes, our worked-out stat builds) copy their parts as plain text instead, to
	paste in a chat; a game code is the game's own encoding and is never made up here.
*/
import type { Loadout, LoadoutMode } from './data/loadouts.ts';
import { SITE_BUILDS } from './data/siteBuilds.ts';

const norm = (s: string) => s.toLowerCase().replace(/["”″]/g, '').replace(/\s+/g, ' ').trim();

/** Same attachments in the same slots (names compared loosely: case, spaces, the inch mark). */
export function sameParts(a: Pick<Loadout, 'attachments'>, b: Pick<Loadout, 'attachments'>): boolean {
	return (
		a.attachments.length === b.attachments.length &&
		a.attachments.every((x) => b.attachments.some((y) => y.slot === x.slot && norm(y.name) === norm(x.name)))
	);
}

/** The published subclass with exactly this build's parts, if there is one (it carries the code). */
export function twinOf(weaponId: string, mode: LoadoutMode, l: Pick<Loadout, 'attachments'> | undefined) {
	if (!l) return undefined;
	return (SITE_BUILDS[weaponId]?.[mode] ?? []).find((b) => sameParts(l, b));
}

/** The game code for this build, when a published subclass has exactly its parts. */
export const codeFor = (weaponId: string, mode: LoadoutMode, l: Pick<Loadout, 'attachments'> | undefined) =>
	twinOf(weaponId, mode, l)?.code;

/**
 * A build as text: "HAN 86 – Meta class (Multiplayer)", then one "Slot: part" line per attachment.
 * `label` names the build (and mode) as the card does.
 */
export function buildText(weapon: string, label: string, l: Pick<Loadout, 'attachments'>): string {
	return [`${weapon} – ${label}`, ...l.attachments.map((a) => `${a.slot}: ${a.name}`)].join('\n');
}
