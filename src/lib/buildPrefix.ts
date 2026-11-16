/**
 * Which gun a build code belongs to, and the codes we already know per gun (for "Add my class" in
 * the Squad tab, squad-classes.ts). A game build code starts with the gun ("B04-…" = Patriot XMR):
 * every code we have (loadoutCodes.ts, siteBuilds.ts, hardcoreBuilds.ts) is read for that, so the
 * map follows the data instead of a hand-typed list. Tested in scripts/squad-classes.test.js
 * (every prefix names exactly one gun).
 */
import { HARDCORE_BUILDS } from './data/hardcoreBuilds.ts';
import { LOADOUT_CODES } from './data/loadoutCodes.ts';
import { SITE_BUILDS } from './data/siteBuilds.ts';
import type { ClassKind } from './squad-classes.ts';

/** A published build of a gun that has a code: what "pick one of this gun's builds" lists. */
export interface KnownCode {
	code: string;
	/** "Hardcore · One-Shot Kill", "Versatile #1", "Close range #2" … */
	label: string;
	kind: ClassKind;
	/** The one the weapon row's META button copies. */
	meta: boolean;
}

function collect(): Map<string, KnownCode[]> {
	const out = new Map<string, KnownCode[]>();
	const add = (w: string, k: KnownCode) => {
		const list = out.get(w) ?? [];
		if (!list.some((x) => x.code === k.code)) list.push(k);
		out.set(w, list);
	};
	for (const [w, list] of Object.entries(HARDCORE_BUILDS)) {
		for (const h of list) if (h.code) add(w, { code: h.code, label: `Hardcore · ${h.build.role}`, kind: 'hc', meta: false });
	}
	for (const [w, modes] of Object.entries(SITE_BUILDS)) {
		for (const b of modes.mp ?? []) add(w, { code: b.code, label: `${b.role} #${b.rank}`, kind: 'mp', meta: LOADOUT_CODES[w]?.code === b.code });
		for (const b of modes.wz ?? []) add(w, { code: b.code, label: `Warzone · ${b.role} #${b.rank}`, kind: 'wz', meta: false });
	}
	for (const [w, c] of Object.entries(LOADOUT_CODES)) add(w, { code: c.code, label: c.role, kind: 'mp', meta: true });
	return out;
}

const KNOWN = collect();

/** First part of a code ("B04") → weapon id, from every code we know. */
export const CODE_PREFIX: ReadonlyMap<string, string> = new Map(
	[...KNOWN].flatMap(([w, list]) => list.map((k) => [k.code.split('-')[0], w] as const))
);

/** The gun a (tidied) build code belongs to, if we know its prefix. */
export function weaponFromCode(code: string | null): string | null {
	return code ? (CODE_PREFIX.get(code.split('-')[0]) ?? null) : null;
}

/** A gun's published builds with codes: the META one first, then Hardcore, Multiplayer, Warzone. */
export function knownCodes(weaponId: string): KnownCode[] {
	const list = KNOWN.get(weaponId) ?? [];
	return [...list.filter((k) => k.meta), ...list.filter((k) => !k.meta)];
}
