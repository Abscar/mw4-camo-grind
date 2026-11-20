/**
 * Abscar's operator figures (2026-11-11). The user picked them from a sheet of drafts
 * (`ritningar/abscar-operatorn/skissark.html`, private): the bronze cyborg skull with red eyes and the
 * holk (a cone joint) in its teeth, now at 80 % on armoured shoulders with a short hydraulic neck.
 *  - ghillie: a moss ghillie poncho with weed leaves and buds woven in (draft 6B) = the header emblem
 *  - lighter: his thumb is a lighter, lighting the holk (draft 3)
 *  - nvg: tactical helmet with flipped-up quad night vision, headset + mic, vest (draft 8)
 *  - sniper: a sniper rifle resting on his shoulder (draft 10)
 * A pure, deterministic string builder (seeded randomness), so the prerendered page and hydration match.
 * AbscarOperator.svelte puts the markup in an <svg viewBox="0 0 64 64">. The smoke reuses the live
 * emblem's classes in app.css (op-puff / op-wisp / op-eye-glow / op-ember-glow). Our own drawing.
 */

export type OperatorVariant = 'ghillie' | 'lighter' | 'nvg' | 'sniper';

const OUT = '#2a1c0c';
const MIRROR = 'matrix(-1 0 0 1 64 0)';
const f = (n: number, d = 2) => +n.toFixed(d);
const seeded = (seed: number) => {
	let s = seed;
	return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

function defs(u: string, v: OperatorVariant): string {
	const extra: Record<OperatorVariant, string> = {
		ghillie: `<linearGradient id="${u}-leaf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f7a1e"/><stop offset="0.5" stop-color="#5fb534"/><stop offset="1" stop-color="#aee35e"/></linearGradient>
	<linearGradient id="${u}-leafdk" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1b4510"/><stop offset="0.5" stop-color="#3a7a22"/><stop offset="1" stop-color="#6aa63a"/></linearGradient>
	<linearGradient id="${u}-moss" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#5a8a2e"/><stop offset="0.5" stop-color="#2e5a1d"/><stop offset="1" stop-color="#16300e"/></linearGradient>`,
		lighter: '',
		nvg: `<linearGradient id="${u}-gun" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#6a7158"/><stop offset="0.4" stop-color="#3a4030"/><stop offset="1" stop-color="#15180f"/></linearGradient>`,
		sniper: `<linearGradient id="${u}-rifle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5f63"/><stop offset="0.5" stop-color="#25282b"/><stop offset="1" stop-color="#0f1113"/></linearGradient>
	<linearGradient id="${u}-tan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b59a66"/><stop offset="1" stop-color="#5e4b2c"/></linearGradient>`
	};
	return `<defs>
	<linearGradient id="${u}-bronze" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff0c4"/><stop offset="0.22" stop-color="#d9ac62"/><stop offset="0.5" stop-color="#7a5326"/><stop offset="0.74" stop-color="#e0b874"/><stop offset="1" stop-color="#5b3c18"/></linearGradient>
	<linearGradient id="${u}-bronze-dark" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#e2bd7c"/><stop offset="0.45" stop-color="#6e4a20"/><stop offset="1" stop-color="#2e1e0b"/></linearGradient>
	<linearGradient id="${u}-bronze-soft" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#f5d79c"/><stop offset="0.45" stop-color="#b98a46"/><stop offset="1" stop-color="#5f3f1a"/></linearGradient>
	<radialGradient id="${u}-grime" cx="0.3" cy="0.7" r="0.8"><stop offset="0" stop-color="#1a0f05" stop-opacity="0.45"/><stop offset="1" stop-color="#1a0f05" stop-opacity="0"/></radialGradient>
	<radialGradient id="${u}-red"><stop offset="0" stop-color="#ff2a2a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff2a2a" stop-opacity="0"/></radialGradient>
	<radialGradient id="${u}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
	<linearGradient id="${u}-steel" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset="0.3" stop-color="#a6b1bd"/><stop offset="0.55" stop-color="#4b5562"/><stop offset="0.75" stop-color="#d3d9e0"/><stop offset="1" stop-color="#2a313a"/></linearGradient>
	${extra[v]}
	<filter id="${u}-puff-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4"/></filter>
	<filter id="${u}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5"/></filter>
	<filter id="${u}-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="0.9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
	<clipPath id="${u}-box"><rect x="-40" y="-80" width="144" height="144"/></clipPath>
	</defs>`;
}

const UPPER = [20.6, 23.5, 26.4, 29.3, 32.2, 35.1, 38, 40.9];
const LOWER = [21.2, 24, 26.8, 29.6, 32.4, 35.2, 38, 40.6];

/** The skull in the old 64×64 emblem's own coordinates (the same drawing the header used before). */
function head(u: string): string {
	const B = `url(#${u}-bronze)`, BD = `url(#${u}-bronze-dark)`;
	const CR = 'M12.5 25 C11.5 11.5 20.5 3 32 3 C43.5 3 52.5 11.5 51.5 25 L50.5 30 C49.5 33.5 47.5 35 45 35.5 L19 35.5 C16.5 35 14.5 33.5 13.5 30 Z';
	return `<path d="${CR}" fill="${B}" stroke="${OUT}" stroke-width="0.8"/><path d="${CR}" fill="url(#${u}-grime)"/>
	<ellipse cx="24.5" cy="9" rx="6.5" ry="2.6" fill="#fff6dc" opacity="0.4"/>
	<path d="M32 3.5 V13 M20.5 8.5 C25 10.8 39 10.8 43.5 8.5 M13.2 21 C16 20 17 15 16.5 12 M50.8 21 C48 20 47 15 47.5 12" stroke="${OUT}" stroke-opacity="0.55" stroke-width="0.8" fill="none"/>
	<path d="M14.5 19.8 C20 16.6 27.5 16.8 31 19.6 L33 19.6 C36.5 16.8 44 16.6 49.5 19.8 L48.8 21.6 L15.2 21.6 Z" fill="${BD}"/>
	<path d="M15.5 21.4 L28.8 21 L29.2 27.6 L24 30.8 L16.4 28.4 Z" fill="#050302"/><path d="M48.5 21.4 L35.2 21 L34.8 27.6 L40 30.8 L47.6 28.4 Z" fill="#050302"/>
	<circle class="op-eye-glow" cx="22.6" cy="25.4" r="8.5" fill="url(#${u}-red)"/><circle class="op-eye-glow" cx="41.4" cy="25.4" r="8.5" fill="url(#${u}-red)"/>
	<circle cx="22.6" cy="25.4" r="2.7" fill="#ff3a3a"/><circle cx="41.4" cy="25.4" r="2.7" fill="#ff3a3a"/>
	<circle cx="23.4" cy="24.6" r="0.85" fill="#ffd6d6"/><circle cx="42.2" cy="24.6" r="0.85" fill="#ffd6d6"/>
	<path d="M30.2 29 L33.8 29 L33.1 34 L32 35.2 L30.9 34 Z" fill="#050302"/>
	<path d="M13.6 28.6 L20 31 L19 36 L15 40 L12 35 Z" fill="${B}" stroke="${OUT}" stroke-width="0.6"/>
	<path d="M50.4 28.6 L44 31 L45 36 L49 40 L52 35 Z" fill="${B}" stroke="${OUT}" stroke-width="0.6"/>
	<rect x="11.8" y="36" width="3.8" height="11" rx="1.2" fill="${BD}" stroke="${OUT}" stroke-width="0.6"/>
	<rect x="48.4" y="36" width="3.8" height="11" rx="1.2" fill="${BD}" stroke="${OUT}" stroke-width="0.6"/>
	<path d="M12.3 41 H15.1 M48.9 41 H51.7" stroke="#fff0c4" stroke-opacity="0.5" stroke-width="0.6"/>
	<path d="M15.6 38 L19.5 41 M48.4 38 L44.5 41" stroke="#3a2610" stroke-width="1.4" stroke-linecap="round"/>
	<path d="M20 35.5 H44 V40.4 H20 Z" fill="#0b0703"/>
	${UPPER.map((x) => `<rect x="${x}" y="35.8" width="2.5" height="4.2" rx="0.5" fill="#efe2c4"/>`).join('')}
	<path d="M18.5 40.4 H45.5 L44.5 47 C43.5 52 39 55.5 32 55.5 C25 55.5 20.5 52 19.5 47 Z" fill="${BD}" stroke="${OUT}" stroke-width="0.8"/>
	<path d="M20.8 40.4 H43.2 V44 H20.8 Z" fill="#0b0703"/>
	${LOWER.map((x) => `<rect x="${x}" y="40.6" width="2.3" height="3.2" rx="0.5" fill="#d9caa6"/>`).join('')}
	<path d="M24.5 50.5 C28.5 53 35.5 53 39.5 50.5" stroke="#fff0c4" stroke-opacity="0.3" stroke-width="0.8" fill="none"/>`;
}

/* head-and-shoulders layout: the skull at 80 %, so there is room for neck and shoulders under it */
const S = 0.8, TX = 6.4, TY = -2.4;
const headAt = (u: string) => `<g transform="translate(${TX} ${TY}) scale(${S})">${head(u)}</g>`;
const MOUTH: [number, number] = [f(TX + S * 40), f(TY + S * 40.6)]; // the holk's tip, between the teeth

/**
 * A cone joint from the narrow filter tip P to the wide burning end Q. Exported for Da Jeeven's emblem
 * (DaJeevenEmblem.svelte, "a big smoking thing in his mouth like Abscar"); needs `${u}-ember` in defs.
 * `gold` = BurgiShop's Golden Holk (shop.ts `mouth-goldholk`): polished gold paper with a bright band, a dark
 * crutch with gold lines, a soft gold halo and two twinkling sparkles (`holk-halo` / `holk-spark` in
 * grind.css). Its gradient and halo blur come with it (ids `${u}-hg` / `${u}-hglow`), so callers only need
 * the ember, as before.
 */
export function holk(u: string, px: number, py: number, qx: number, qy: number, w1 = 2.2, w2 = 7, glowR?: number, gold = false): string {
	const dx = qx - px, dy = qy - py, L = Math.hypot(dx, dy);
	const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
	const a = f((Math.atan2(dy, dx) * 180) / Math.PI);
	const at = (t: number, off: number): [number, number] => {
		const w = w1 + (w2 - w1) * t;
		return [f(px + ux * L * t + (nx * off * w) / 2), f(py + uy * L * t + (ny * off * w) / 2)];
	};
	const pt = (t: number, off: number) => at(t, off).join(' ');
	const ex = f(qx + ux * 0.7), ey = f(qy + uy * 0.7);
	const ashR = f(Math.max(1.3, w2 * 0.22));
	const body = `M${pt(0, 1)} L${pt(1, 1)} L${pt(1, -1)} L${pt(0, -1)} Z`;
	const end = `<ellipse cx="${f(qx)}" cy="${f(qy)}" rx="${ashR}" ry="${f(w2 / 2)}" transform="rotate(${a} ${f(qx)} ${f(qy)})" fill="#7a7672"/>
	<circle class="op-ember-glow" cx="${ex}" cy="${ey}" r="${f(glowR ?? w2 * 0.95)}" fill="url(#${u}-ember)"/>
	<ellipse cx="${ex}" cy="${ey}" rx="${f(ashR * 0.62)}" ry="${f(w2 * 0.37)}" transform="rotate(${a} ${ex} ${ey})" fill="#ff8a1a"/>`;
	if (!gold) {
		return `<path d="${body}" fill="#f3efe4" stroke="#b9b09a" stroke-width="0.45" stroke-linejoin="round"/>
	<path d="M${pt(0, 1)} L${pt(0.2, 1)} L${pt(0.2, -1)} L${pt(0, -1)} Z" fill="#cdb98f"/>
	<path d="M${pt(0.08, 0.85)} L${pt(0.08, -0.85)} M${pt(0.14, 0.85)} L${pt(0.14, -0.85)}" stroke="#a8935f" stroke-width="0.35"/>
	<path d="M${pt(0.3, 0.45)} L${pt(0.9, 0.45)} M${pt(0.38, -0.4)} L${pt(0.95, -0.4)}" stroke="#d6cfbb" stroke-width="0.5" stroke-linecap="round"/>
	${end}`;
	}
	// the gold runs across the cone (edge → bright line → edge), so it reads as a round, polished roll
	const [g1x, g1y] = at(0.55, 1), [g2x, g2y] = at(0.55, -1);
	const spark = (t: number, off: number, r: number, delay: number) => {
		const [cx, cy] = at(t, off), s = f(r * 0.28);
		return `<path class="holk-spark" style="animation-delay:-${delay}s" d="M${cx} ${f(cy - r)} L${f(cx + s)} ${f(cy - s)} L${f(cx + r)} ${cy} L${f(cx + s)} ${f(cy + s)} L${cx} ${f(cy + r)} L${f(cx - s)} ${f(cy + s)} L${f(cx - r)} ${cy} L${f(cx - s)} ${f(cy - s)} Z" fill="#fffbe6"/>`;
	};
	return `<defs><linearGradient id="${u}-hg" gradientUnits="userSpaceOnUse" x1="${g1x}" y1="${g1y}" x2="${g2x}" y2="${g2y}"><stop offset="0" stop-color="#6b4306"/><stop offset="0.2" stop-color="#d9a52e"/><stop offset="0.4" stop-color="#fff4c0"/><stop offset="0.54" stop-color="#f6cf5a"/><stop offset="0.8" stop-color="#b8810f"/><stop offset="1" stop-color="#5a3804"/></linearGradient>
	<filter id="${u}-hglow" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>
	<path class="holk-halo" d="${body}" fill="#ffd23a" filter="url(#${u}-hglow)"/>
	<path d="${body}" fill="url(#${u}-hg)" stroke="#5a3a06" stroke-width="0.5" stroke-linejoin="round"/>
	<path d="M${pt(0, 1)} L${pt(0.2, 1)} L${pt(0.2, -1)} L${pt(0, -1)} Z" fill="#2e1d05"/>
	<path d="M${pt(0.07, 0.85)} L${pt(0.07, -0.85)} M${pt(0.13, 0.85)} L${pt(0.13, -0.85)}" stroke="#e9bd4a" stroke-width="0.35"/>
	<path d="M${pt(0.215, 1)} L${pt(0.215, -1)}" stroke="#fff1b0" stroke-width="0.7"/>
	<path d="M${pt(0.32, 0.5)} L${pt(0.9, 0.5)} M${pt(0.4, -0.42)} L${pt(0.95, -0.42)}" stroke="#fff6d0" stroke-opacity="0.75" stroke-width="0.45" stroke-linecap="round"/>
	${end}
	${spark(0.5, 0.3, Math.max(1.3, w2 * 0.22), 0)}${spark(0.78, -0.25, Math.max(1, w2 * 0.17), 1.1)}`;
}

/* the old emblem's thick smoke (13 puffs + 6 wisps), moved to (x, y) and scaled by k
   (exported for Da Jeeven's emblem; needs `${u}-puff-blur` and `${u}-blur` in defs) */
const PUFFS = [[0, 5.2, 9, -10, 7], [0.4, 4.6, -8, 6, 6.2], [0.8, 5.6, 10, -20, 7.6], [1.2, 4.9, -9, -4, 6.6], [1.6, 5.4, 8, -15, 7.2], [2, 4.7, -10, 7, 6.4], [2.4, 5.8, 9, -22, 7.8], [2.8, 5, -8, -8, 7], [3.2, 5.3, 10, 3, 6.6], [3.6, 5.5, -9, -16, 7.4], [4, 4.8, 8, -3, 6.4], [4.4, 5.6, -10, -12, 7.5], [4.8, 5.1, 9, -18, 7]];
const WISPS = ['M62 41 C58 33 66 27 61 19 C57 12 64 6 60 -2', 'M63 41 C67 33 59 26 64 18 C68 11 61 5 65 -3', 'M62 41 C60 35 65 30 62 24 C59 18 63 13 61 7', 'M63 42 C64 36 60 31 63 25 C66 19 62 14 64 8', 'M62 42 C57 36 61 29 57 22 C54 16 58 10 55 3', 'M63 41 C66 35 62 29 66 22 C69 16 64 10 67 4'];
export function smoke(u: string, x: number, y: number, k: number): string {
	if (k <= 0) return '';
	// op-smoke / op-smoke-puffs: BurgiShop's smoke colours tint these (`data-smoke` on the svg sets `color`, grind.css).
	// The puffs are soft discs (a radial fade in the puff's colour, a bit bigger than the old disc) instead of a
	// blur filter over the group (2026-11-20): the blur had to be redrawn on every frame the smoke moved and was
	// a third of the header's drawing work; side by side they look the same.
	const g = `${u}-pg${Math.round(x * 10)}_${Math.round(y * 10)}`;
	return `<g class="op-smoke" transform="translate(${f(x)} ${f(y)}) scale(${f(k)})">
	<defs><radialGradient id="${g}"><stop offset="0.4" stop-color="currentColor"/><stop offset="0.64" stop-color="currentColor" stop-opacity="0.5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
	<g class="op-smoke-puffs" color="#e2e7e2" fill="url(#${g})">${PUFFS.map(([st, dur, sway, dx, r]) => `<circle class="op-puff" cx="0" cy="0" r="${f(r + 4)}" style="animation-delay:-${st}s;animation-duration:${dur}s;--sway:${sway}px;--dx:${dx}px"/>`).join('')}</g>
	<g filter="url(#${u}-blur)"><g transform="translate(-62.5 -41.5)">${WISPS.map((d) => `<path class="op-wisp" d="${d}"/>`).join('')}</g></g>
	</g>`;
}

function neck(u: string): string {
	return `<path d="M24.4 36 L22.6 47.5 M39.6 36 L41.4 47.5" stroke="url(#${u}-bronze-dark)" stroke-width="3.6" stroke-linecap="round"/>
	<path d="M28 38 L27.4 47.5 M36 38 L36.6 47.5" stroke="#2a1c0c" stroke-width="2.4" stroke-linecap="round"/>
	<rect x="30.4" y="38" width="3.2" height="9.5" rx="0.8" fill="url(#${u}-bronze)" stroke="${OUT}" stroke-width="0.45"/>
	<path d="M30.4 42.4 h3.2 M30.4 44.8 h3.2" stroke="${OUT}" stroke-width="0.5"/>`;
}

/** Armoured bronze shoulders with a red core in the chest (or a vest with magazine pouches). */
function shoulders(u: string, vest = false): string {
	const B = `url(#${u}-bronze)`, BD = `url(#${u}-bronze-dark)`;
	const pad = `<path d="M1.5 60 C1 51 7 46.5 14.5 46.5 C19.5 46.5 22.5 49 22.5 52.5 L21.5 58 C15 56.5 7.5 57.5 1.5 62.5 Z" fill="${B}" stroke="${OUT}" stroke-width="0.8"/>
	<path d="M3.4 55.4 C8.6 51.6 15 51 21.8 53.6" stroke="${OUT}" stroke-opacity="0.5" stroke-width="0.6" fill="none"/>
	<ellipse cx="10" cy="49.2" rx="4.4" ry="1.3" fill="#fff6dc" opacity="0.35"/>
	<circle cx="6" cy="52.6" r="0.6" fill="#fff0c4" opacity="0.7"/><circle cx="12.4" cy="50.2" r="0.6" fill="#fff0c4" opacity="0.7"/><circle cx="18.4" cy="50.8" r="0.6" fill="#fff0c4" opacity="0.7"/>`;
	const chest = vest
		? `<path d="M20.5 50.5 L43.5 50.5 L45.2 67 L18.8 67 Z" fill="#30372a" stroke="${OUT}" stroke-width="0.7"/>
		${[22.4, 29, 35.6].map((x) => `<rect x="${x}" y="55.2" width="6" height="9" rx="1" fill="#414b38" stroke="${OUT}" stroke-width="0.5"/><path d="M${x} 57.6 h6" stroke="${OUT}" stroke-width="0.5"/>`).join('')}
		<rect x="29.4" y="51.6" width="5.2" height="2.2" rx="0.5" fill="#ff4418" opacity="0.85"/>`
		: `<circle class="op-eye-glow" cx="32" cy="57.8" r="5.2" fill="url(#${u}-red)"/>
		<circle cx="32" cy="57.8" r="2.2" fill="#2a0505" stroke="${OUT}" stroke-width="0.5"/><circle cx="32" cy="57.8" r="1.3" fill="#ff3a3a"/>`;
	return `<g transform="translate(0 -3)">
	<path d="M0.6 67 L1 64 C2 57 9 51.5 20 50 L44 50 C55 51.5 62 57 63 64 L63.4 67 Z" fill="${BD}" stroke="${OUT}" stroke-width="0.9"/>
	<path d="M23 50 L41 50 L39.4 67 L24.6 67 Z" fill="${B}" stroke="${OUT}" stroke-width="0.7"/>
	<path d="M25.6 54 H38.4 M25.2 61.6 H38.8" stroke="${OUT}" stroke-opacity="0.5" stroke-width="0.6"/>
	${chest}
	<path d="M21 48.5 Q32 52.5 43 48.5 L42.4 52 Q32 56 21.6 52 Z" fill="${BD}" stroke="${OUT}" stroke-width="0.7"/>
	${pad}<g transform="${MIRROR}">${pad}</g>
	</g>`;
}

/** A rounded finger segment from (x1,y1) to (x2,y2). */
function cap(x1: number, y1: number, x2: number, y2: number, w: number, fill: string, joint = true): string {
	const L = Math.hypot(x2 - x1, y2 - y1), a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
	const line = joint ? `<path d="M${f(L * 0.52)} ${f(-w / 2 + 0.35)} V${f(w / 2 - 0.35)}" stroke="${OUT}" stroke-opacity="0.7" stroke-width="0.5"/>` : '';
	return `<g transform="translate(${f(x1)} ${f(y1)}) rotate(${f(a)})"><rect x="${f(-w / 2)}" y="${f(-w / 2)}" width="${f(L + w)}" height="${w}" rx="${f(w / 2)}" fill="${fill}" stroke="${OUT}" stroke-width="0.6"/>${line}</g>`;
}
/** A robot forearm: bronze sleeve, lighter cuff, a steel piston on it. */
function forearm(u: string, x1: number, y1: number, x2: number, y2: number): string {
	const L = Math.hypot(x2 - x1, y2 - y1), a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
	return `<g transform="translate(${f(x1)} ${f(y1)}) rotate(${f(a)})">
	<rect x="-3.8" y="-3.9" width="${f(L + 3.8)}" height="7.8" rx="3" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.7"/>
	<rect x="1.6" y="-3.9" width="${f(L * 0.42)}" height="7.8" rx="2" fill="url(#${u}-bronze-soft)" stroke="${OUT}" stroke-width="0.5"/>
	<rect x="${f(L * 0.5)}" y="-0.8" width="${f(L * 0.4)}" height="1.6" rx="0.8" fill="url(#${u}-steel)" stroke="${OUT}" stroke-width="0.35"/>
	<circle cx="${f(L * 0.5)}" cy="0" r="1.3" fill="url(#${u}-bronze)" stroke="${OUT}" stroke-width="0.4"/>
	<path d="M${f(L * 0.55)} -3.8 V3.8" stroke="${OUT}" stroke-opacity="0.6" stroke-width="0.5"/>
	</g>`;
}
/** A closed fist seen from the side: four curled fingers stacked, the back of the hand behind them. */
function fist(u: string, x: number, y: number): string {
	const fingers = [0, 2.2, 4.4, 6.6].map((dy) => cap(x, y + 1.2 + dy, x + 6.2, y + 1.2 + dy, 2.25, `url(#${u}-bronze)`)).join('');
	return `<rect x="${f(x + 4.8)}" y="${y}" width="6.6" height="9.6" rx="2.4" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.6"/>${fingers}`;
}

/* ---------- ghillie (6B) ---------- */

/** One serrated finger of a weed leaf, pointing up from (0,0). */
function fingerPath(L: number, W: number, teeth: number): string {
	const n = teeth * 2, R: string[] = [], Lf: string[] = [];
	for (let i = 1; i < n; i++) {
		const t = i / n, w = W * Math.sin(Math.PI * Math.pow(t, 0.75)), r = i % 2 ? w : w * 0.62, ty = Math.min(0.97, t + (i % 2 ? 0.035 : 0));
		R.push(`${f(r, 1)} ${f(-L * ty, 1)}`);
		Lf.unshift(`${f(-r, 1)} ${f(-L * ty, 1)}`);
	}
	return `M0 0L${R.join('L')}L0 ${f(-L, 1)}L${Lf.join('L')}Z`;
}
type Fingers = 3 | 5 | 7;
const LEAF_SPEC: Record<Fingers, [number, number][]> = {
	7: [[0, 1], [27, 0.84], [-27, 0.84], [54, 0.62], [-54, 0.62], [84, 0.36], [-84, 0.36]],
	5: [[0, 1], [32, 0.78], [-32, 0.78], [66, 0.46], [-66, 0.46]],
	3: [[0, 1], [42, 0.68], [-42, 0.68]]
};
const LEAF_UNIT = 10; // leaves are defined once at this size and placed with <use> + scale
/**
 * A weed leaf shape (defined once per finger count in <defs>): fingers fanning out from the stem point,
 * middle one longest. No fill of its own: the <use> gives the fill (light or dark green) and, through
 * `color`, the vein colour, so one shape serves both.
 */
function leafDef(u: string, n: Fingers): string {
	const s = LEAF_UNIT;
	const fingers = LEAF_SPEC[n].slice().sort((p, q) => Math.abs(q[0]) - Math.abs(p[0])).map(([ang, k]) => {
		const L = s * k, W = s * 0.125 * (0.7 + 0.3 * k);
		return `<g transform="rotate(${ang})"><path d="${fingerPath(L, W, k > 0.5 ? 6 : 4)}"/><path d="M0 -.3V${f(-L * 0.86, 1)}" stroke="currentColor" stroke-width=".26" opacity=".85"/></g>`;
	}).join('');
	return `<g id="${u}-leaf${n}" stroke="#0d2a07" stroke-width=".34" stroke-linejoin="round"><path d="M0 0V${f(s * 0.36, 1)}" stroke="#3f7a22" stroke-width=".7" stroke-linecap="round"/>${fingers}</g>`;
}
const useLeaf = (u: string, x: number, y: number, s: number, a: number, n: Fingers, dark = false) =>
	`<use href="#${u}-leaf${n}" fill="url(#${u}-${dark ? 'leafdk' : 'leaf'})" color="${dark ? '#8fbf5a' : '#e2f8a8'}" transform="translate(${f(x)} ${f(y)}) rotate(${a}) scale(${f(s / LEAF_UNIT, 3)})"/>`;
/** A bud (defined once): light-green calyxes tapering to a tip, orange hairs, frost, two sugar leaves. */
function budDef(u: string): string {
	const s = LEAF_UNIT, r = seeded(2 * 7919 + 1);
	const COLS = ['#7fb23a', '#9cc94a', '#b8dc68', '#8cbf41'];
	let blobs = '', hairs = '', dots = '';
	for (let i = 0; i < 7; i++) {
		const t = i / 6, cy = -s * 0.82 * t, spread = s * 0.26 * (1 - t * 0.62), count = i === 6 ? 1 : 3;
		for (let j = 0; j < count; j++) {
			const cx = count === 1 ? 0 : (j - 1) * spread * 0.78 + (r() - 0.5) * 0.35, rx = spread * 0.6 + 0.3;
			blobs += `<ellipse cx="${f(cx)}" cy="${f(cy + (r() - 0.5) * 0.4)}" rx="${f(rx)}" ry="${f(rx * 1.2)}" fill="${COLS[Math.floor(r() * 4)]}" stroke="#2c5512" stroke-width="0.26"/>`;
		}
	}
	for (let i = 0; i < 10; i++) {
		const t = r(), px = (r() - 0.5) * s * 0.4 * (1 - t * 0.6), py = -s * 0.82 * t, dx = (r() - 0.5) * 1.8, dy = -0.4 - r() * 0.9;
		hairs += `<path d="M${f(px)} ${f(py)} q${f(dx * 0.5)} ${f(dy)} ${f(dx)} ${f(dy * 0.6)}" stroke="${i % 3 ? '#f08a2b' : '#ffb35a'}" stroke-width="0.3" fill="none" stroke-linecap="round"/>`;
	}
	for (let i = 0; i < 12; i++) {
		const t = r();
		dots += `<circle cx="${f((r() - 0.5) * s * 0.42 * (1 - t * 0.6))}" cy="${f(-s * 0.82 * t)}" r="0.17" fill="#fff" opacity="0.85"/>`;
	}
	const sugar = useLeaf(u, -s * 0.18, -s * 0.1, s * 0.5, -58, 3, true) + useLeaf(u, s * 0.18, -s * 0.16, s * 0.46, 56, 3, true);
	return `<g id="${u}-bud">${sugar}${blobs}${hairs}${dots}</g>`;
}
/** Little moss tufts over each leaf's stem, so it looks woven into the suit (grouped by colour). */
const TUFT_COLS = ['#21431a', '#2e5a1d', '#3f7a26', '#5a9331'];
function tufts(spots: [number, number, number, number][]): string {
	const byCol = TUFT_COLS.map(() => '');
	spots.forEach(([x, y, a, s], i) => {
		const r = seeded((i + 1) * 104729 + 7);
		const rad = (a * Math.PI) / 180, bx = x - Math.sin(rad) * s * 0.3, by = y + Math.cos(rad) * s * 0.3;
		for (let k = 0; k < 4; k++) {
			const ex = f(bx + (r() - 0.5) * 2.4, 1), ey = f(by + (r() - 0.5) * 1.6, 1);
			const rx = f(0.9 + r() * 0.6, 1), ry = f(0.5 + r() * 0.3, 1), rot = f(r() * 180, 0);
			byCol[Math.floor(r() * 4)] += `<ellipse transform="translate(${ex} ${ey})rotate(${rot})" rx="${rx}" ry="${ry}"/>`;
		}
	});
	return byCol.map((els, i) => (els ? `<g fill="${TUFT_COLS[i]}">${els}</g>` : '')).join('');
}

/** Draft 6B: [x, y, size, angle, fingers, dark] — dark leaves sit half under the moss. */
const LEAVES: [number, number, number, number, Fingers, boolean][] = [
	[27, 2, 6.5, -8, 5, true], [18, 55, 8, -20, 7, true], [48, 54, 7.5, 25, 7, true],
	[21, 7, 8.5, -38, 7, false], [10, 44, 9.5, -55, 7, false], [55, 46, 9, 50, 7, false], [47, 3, 7, 30, 5, false],
	[9, 30, 7.5, -75, 5, false], [56, 26, 7, 72, 5, false]
];
/** [x, y, size, angle] */
const BUDS: [number, number, number, number][] = [[33, -1.5, 6.5, 8], [11, 59, 6.5, -25], [53.5, 60, 6, 22], [4, 50, 5.5, -60], [60, 40, 5.5, 55]];

const INNER = 'M20 67 L17.6 49 C15.2 36 15.4 22 17.8 14.4 C22 9.4 42 9.4 46.2 14.4 C48.6 22 48.8 36 46.4 49 L44 67';
const OUTER = 'M-1 52 C3 42 7.6 31 8.6 20 C10 5.6 19.6 -4.4 32 -4.4 C44.4 -4.4 54 5.6 55.4 20 C56.4 31 61 42 65 52';
const OUTER_SEGS = [[[-1, 52], [3, 42], [7.6, 31], [8.6, 20]], [[8.6, 20], [10, 5.6], [19.6, -4.4], [32, -4.4]], [[32, -4.4], [44.4, -4.4], [54, 5.6], [55.4, 20]], [[55.4, 20], [56.4, 31], [61, 42], [65, 52]]];
const MOSS_COLS = ['#132a0b', '#1d3d14', '#2a5219', '#386b22', '#457d29', '#5a9331', '#79ad3a', '#9fca4c'];

/**
 * The moss texture: one 22-unit tile of little leaves (seeded), repeated and turned a bit so the repeat
 * doesn't line up with anything. Leaves near a tile edge are drawn on the other side too, so no seams.
 * The light-from-above shading is a gradient laid over it (see ghillie).
 */
const TILE = 22;
function mossPattern(u: string): string {
	const r = seeded(11);
	const byShade: string[] = MOSS_COLS.map(() => '');
	for (let i = 0; i < 42; i++) {
		const x = r() * TILE, y = r() * TILE, rx = 0.7 + r() * 1.4, ry = 0.4 + r() * 0.65, a = f(r() * 180, 0);
		const shade = 1 + Math.floor(r() * 6);
		const xs = [x, ...(x < 2.4 ? [x + TILE] : x > TILE - 2.4 ? [x - TILE] : [])];
		const ys = [y, ...(y < 2.4 ? [y + TILE] : y > TILE - 2.4 ? [y - TILE] : [])];
		for (const ex of xs) for (const ey of ys) byShade[shade] += `<ellipse transform="translate(${f(ex, 1)} ${f(ey, 1)})rotate(${a})" rx="${f(rx, 1)}" ry="${f(ry, 1)}"/>`;
	}
	return `<pattern id="${u}-mosstex" width="${TILE}" height="${TILE}" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">${byShade.map((els, i) => (els ? `<g fill="${MOSS_COLS[i]}">${els}</g>` : '')).join('')}</pattern>
	<linearGradient id="${u}-mosslight" gradientUnits="userSpaceOnUse" x1="0" y1="-6" x2="0" y2="68"><stop offset="0" stop-color="#c8ee6a" stop-opacity="0.3"/><stop offset="0.35" stop-color="#c8ee6a" stop-opacity="0"/><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/></linearGradient>`;
}

/** The moss ghillie poncho: hood widening out over the shoulders, the face + chest open in front. */
function ghillie(u: string, gold = false): string {
	const PONCHO = `${OUTER} L65 67 L-1 67 Z ${INNER} Z`;
	const r = seeded(13);
	/* loose jute strands poking out of the outline */
	const bez = (p0: number, p1: number, p2: number, p3: number, t: number) => p0 * (1 - t) ** 3 + 3 * p1 * t * (1 - t) ** 2 + 3 * p2 * t * t * (1 - t) + p3 * t ** 3;
	const strandD = ['', '', ''];
	OUTER_SEGS.forEach((s, si) => {
		for (let k = 0; k < 9; k++) {
			const t = (k + 0.5) / 9, x = bez(s[0][0], s[1][0], s[2][0], s[3][0], t), y = bez(s[0][1], s[1][1], s[2][1], s[3][1], t);
			const out = si < 2 ? -1 : 1, len = 1.6 + r() * 2;
			strandD[Math.floor(r() * 3)] += `M${f(x, 1)} ${f(y, 1)}q${f(out * len * 0.6, 1)} ${f(-len * 0.2 + r(), 1)} ${f(out * len, 1)} ${f(len * 0.5, 1)}`;
		}
	});
	const strands = `<g stroke-width=".7" fill="none" stroke-linecap="round">${strandD.map((d, i) => (d ? `<path d="${d}" stroke="${MOSS_COLS[3 + i]}"/>` : '')).join('')}</g>`;
	const under = LEAVES.filter((l) => l[5]).map(([x, y, s, a, n]) => useLeaf(u, x, y, s, a, n, true)).join('');
	const over = LEAVES.filter((l) => !l[5]).map(([x, y, s, a, n]) => useLeaf(u, x, y, s, a, n)).join('');
	const buds = BUDS.map(([x, y, s, a]) => `<use href="#${u}-bud" transform="translate(${x} ${y}) rotate(${a}) scale(${f(s / LEAF_UNIT, 3)})"/>`).join('');
	const tuftMarkup = tufts([...LEAVES.filter((l) => !l[5]).map(([x, y, s, a]) => [x, y, a, s] as [number, number, number, number]), ...BUDS.map(([x, y, s, a]) => [x, y, a, s * 0.6] as [number, number, number, number])]);
	const hang = `<path d="${[[18.6, 15], [22.4, 11.6], [28, 10.6], [35.6, 10.6], [41.4, 11.6], [45.4, 15.2], [16.6, 24], [47.4, 24.4], [17.2, 34], [46.8, 34.4]]
		.map(([x, y], i) => `M${x} ${y}q${i % 2 ? 0.8 : -0.8} 2.2 ${i % 2 ? -0.2 : 0.2} 3.8`).join('')}" stroke="#6aa836" stroke-width=".85" fill="none" stroke-linecap="round"/>`;
	return `<defs>${leafDef(u, 7)}${leafDef(u, 5)}${leafDef(u, 3)}${budDef(u)}${mossPattern(u)}</defs>
	<path d="${INNER} Z" fill="#070b05"/>
	${neck(u)}${shoulders(u)}${headAt(u)}
	<path d="M17.6 49 C15.2 36 15.4 22 17.8 14.4 C22 9.4 42 9.4 46.2 14.4 C48.6 22 48.8 36 46.4 49" fill="none" stroke="#050a03" stroke-width="3" opacity="0.75" filter="url(#${u}-blur)"/>
	<clipPath id="${u}-mossclip"><path d="${PONCHO}" clip-rule="evenodd"/></clipPath>
	${strands}
	<path d="${PONCHO}" fill="url(#${u}-moss)" fill-rule="evenodd" stroke="#0c1a07" stroke-width="0.8"/>
	${under}
	<g clip-path="url(#${u}-mossclip)">
		<rect x="-2" y="-6" width="68" height="74" fill="url(#${u}-mosstex)" opacity="0.92"/>
		<rect x="-2" y="-6" width="68" height="74" fill="url(#${u}-mosslight)"/>
		<path d="${INNER}" stroke="#061003" stroke-width="3.2" opacity="0.6" fill="none"/>
		<path d="M14 6 C19 -1.6 45 -1.6 50 6" stroke="#d2ec78" stroke-width="1.6" opacity="0.25" fill="none"/>
	</g>
	<g fill="none" stroke-width="1.9" stroke-dasharray="0.9 1.1" stroke-linecap="round"><path d="${INNER}" stroke="#4c8a2a"/><path d="${OUTER}" stroke="#2a5219"/></g>
	${hang}${over}${buds}${tuftMarkup}
	${holk(u, ...MOUTH, 57.4, 34, 2.2, 7, undefined, gold)}`;
}

/* ---------- the other three ---------- */

/** Draft 3: a fist comes up from below, the thumb is a lighter and its flame licks the holk's end. */
function lighter(u: string, gold = false): string {
	const B = `url(#${u}-bronze)`;
	return `${neck(u)}${shoulders(u)}${headAt(u)}
	${holk(u, ...MOUTH, 57.4, 34, 2.2, 7, 9, gold)}
	<g transform="translate(1.9 2.2)">
	${forearm(u, 58.6, 52, 61, 70)}
	${fist(u, 50.4, 43.4)}
	${cap(55.4, 44.2, 57.4, 40, 2.8, B)}
	<circle cx="57.7" cy="39.3" r="1.25" fill="#1a120a" stroke="#c9a46a" stroke-width="0.45"/>
	<g class="aop-flame">
		<path d="M57.7 39.6 C54.8 37.8 55.2 34.2 56.4 30.6 C57.2 33.2 60.2 34.8 59.9 37.4 C59.7 38.8 58.8 39.6 57.7 39.6 Z" fill="#ff6a12" opacity="0.92"/>
		<path d="M57.7 39.4 C56 38.2 56.2 35.8 57 33.4 C57.6 35.2 59.2 36.4 59 38 C58.9 38.9 58.4 39.4 57.7 39.4 Z" fill="#ffd23a"/>
		<path d="M57.7 39.3 C57.1 38.7 57.2 37.6 57.6 36.6 C58 37.4 58.4 38.2 58.2 38.8 Z" fill="#fff7e0"/>
	</g>
	</g>`;
}

/** Draft 8: helmet with flipped-up quad night vision (green lenses), headset + mic, vest with pouches. */
function nvg(u: string, gold = false): string {
	const tube = (x: number, rot: number) => `<g transform="rotate(${rot} ${f(x + 1.8)} 3)"><rect x="${x}" y="-6.4" width="3.6" height="9" rx="1.2" fill="#22271f" stroke="${OUT}" stroke-width="0.6"/>
		<circle cx="${f(x + 1.8)}" cy="-5.6" r="1.75" fill="#0b120b" stroke="#596152" stroke-width="0.5"/>
		<circle class="aop-nvg" cx="${f(x + 1.8)}" cy="-5.6" r="1.05" fill="#7dff9a" filter="url(#${u}-glow)"/></g>`;
	const rail = `<path d="M17.2 12 L21.4 6.6" stroke="#15180f" stroke-width="1.8" stroke-linecap="round"/>`;
	return `${neck(u)}${shoulders(u, true)}${headAt(u)}
	<ellipse cx="16.2" cy="21.4" rx="3.1" ry="4.9" fill="#23281f" stroke="${OUT}" stroke-width="0.7"/><ellipse cx="16.2" cy="21.4" rx="1.4" ry="2.6" fill="#3d4635"/>
	<ellipse cx="47.8" cy="21.4" rx="3.1" ry="4.9" fill="#23281f" stroke="${OUT}" stroke-width="0.7"/><ellipse cx="47.8" cy="21.4" rx="1.4" ry="2.6" fill="#3d4635"/>
	<path d="M15.6 19 C14.2 5.6 21.6 -2 32 -2 C42.4 -2 49.8 5.6 48.4 19 L46 19.4 C45 15.8 41.4 13.6 32 13.6 C22.6 13.6 19 15.8 18 19.4 Z" fill="url(#${u}-gun)" stroke="${OUT}" stroke-width="0.8"/>
	<path d="M18 19.4 C19 15.8 22.6 13.6 32 13.6 C41.4 13.6 45 15.8 46 19.4" fill="none" stroke="#0d0f0a" stroke-width="1.2"/>
	<ellipse cx="25" cy="3.4" rx="5.4" ry="1.6" fill="#fff" opacity="0.16"/>
	${rail}<g transform="${MIRROR}">${rail}</g>
	<rect x="28.8" y="6.4" width="6.4" height="5.6" rx="1" fill="#15180f" stroke="${OUT}" stroke-width="0.5"/>
	<rect x="22" y="1" width="20" height="5.6" rx="2" fill="#1d211a" stroke="${OUT}" stroke-width="0.6"/>
	${tube(22.4, -12)}${tube(26.8, -4)}${tube(33.6, 4)}${tube(38, 12)}
	<path d="M17.6 25 C18.4 29.4 21.4 31.2 25 30.8" fill="none" stroke="#15180f" stroke-width="1.2" stroke-linecap="round"/>
	<rect x="24.2" y="29.4" width="3.4" height="2.5" rx="1.2" fill="#15180f" stroke="#3d4635" stroke-width="0.4"/>
	${holk(u, ...MOUTH, 57.4, 34, 2.2, 7, undefined, gold)}`;
}

/** Draft 10: a sniper rifle stood up on his left shoulder, his fist round the grip. */
function sniper(u: string, gold = false): string {
	const B = `url(#${u}-bronze)`;
	/* drawn lying along +x (stock left, muzzle right), then stood up */
	const rifle = `<g transform="translate(15.4 60.6) rotate(-106) scale(0.9)">
	<path d="M-18 -3.6 L-3 -3 L-3 3 L-9 3.4 L-12 6.2 L-18 6.2 Z" fill="url(#${u}-tan)" stroke="${OUT}" stroke-width="0.6"/>
	<path d="M-16.6 -3.4 V6" stroke="#2a1c0c" stroke-width="1.4"/>
	<rect x="-3.4" y="-2.8" width="25" height="5.6" rx="1" fill="url(#${u}-rifle)" stroke="${OUT}" stroke-width="0.6"/>
	<path d="M0 2.8 L5 2.8 L4 8.6 L1 8.6 Z" fill="url(#${u}-tan)" stroke="${OUT}" stroke-width="0.5"/>
	<rect x="8.6" y="2.6" width="4.4" height="6" rx="0.8" fill="#1a1c1e" stroke="${OUT}" stroke-width="0.5"/>
	<path d="M16 2.8 L17.2 5.6" stroke="#1a1c1e" stroke-width="1.4" stroke-linecap="round"/><circle cx="17.4" cy="6" r="1" fill="#1a1c1e"/>
	<rect x="21.4" y="-1.25" width="22" height="2.5" fill="url(#${u}-rifle)" stroke="${OUT}" stroke-width="0.45"/>
	<rect x="40" y="-2.3" width="12" height="4.6" rx="1.2" fill="#1a1c1e" stroke="${OUT}" stroke-width="0.5"/>
	<path d="M42.4 -2.3 V2.3 M45 -2.3 V2.3" stroke="#3a3e42" stroke-width="0.5"/>
	<path d="M24 1.2 L37 1.6 L36.6 3 L24 2.6 Z" fill="#2c3033" stroke="${OUT}" stroke-width="0.4"/>
	<rect x="5.4" y="-4.8" width="2" height="2.2" fill="#1a1c1e"/><rect x="14" y="-4.8" width="2" height="2.2" fill="#1a1c1e"/>
	<rect x="1.4" y="-8.8" width="19.6" height="4.4" rx="1.8" fill="url(#${u}-rifle)" stroke="${OUT}" stroke-width="0.55"/>
	<rect x="17.8" y="-9.8" width="4.8" height="6.4" rx="1.4" fill="#1a1c1e" stroke="${OUT}" stroke-width="0.55"/>
	<rect x="-0.4" y="-9.2" width="3.2" height="5.2" rx="1.1" fill="#1a1c1e" stroke="${OUT}" stroke-width="0.55"/>
	<rect x="9.8" y="-10.2" width="2.4" height="1.6" rx="0.4" fill="#1a1c1e"/>
	<ellipse cx="22.7" cy="-6.6" rx="0.7" ry="2.3" fill="#ff3a3a" filter="url(#${u}-glow)"/>
	<path d="M-2.4 -2.2 H21 M3.4 -8 H17.4 M22 -0.7 H43" stroke="#fff" stroke-opacity="0.28" stroke-width="0.55"/>
	</g>`;
	return `${neck(u)}${shoulders(u)}${headAt(u)}${rifle}
	${forearm(u, 13.6, 58.4, 12, 72)}
	<rect x="8.4" y="48.4" width="5" height="10" rx="2.2" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.6"/>
	${[49.8, 52, 54.2, 56.4].map((y) => cap(10.6, y, 18.4, y - 0.6, 2.3, B)).join('')}
	${cap(10.8, 48.4, 16, 46.8, 2.4, B)}
	${holk(u, ...MOUTH, 57.4, 34, 2.2, 7, undefined, gold)}`;
}

const BODIES: Record<OperatorVariant, (u: string, gold?: boolean) => string> = { ghillie, lighter, nvg, sniper };
/** Where the smoke leaves the holk's burning end, per figure. */
const SMOKE_AT: Record<OperatorVariant, [number, number]> = { ghillie: [57.5, 31.2], lighter: [57.8, 31.4], nvg: [57.5, 31.2], sniper: [57.5, 31.2] };

/* ---------- Skeddwood (2026-11-20): the cowboy WILD and the golden skull ---------- */

/** A robot leg: bronze thigh, steel knee, piston shin (drawn from hip x at y0 down to the ankle at y1). */
function leg(u: string, x: number, y0: number, y1: number): string {
	const k = y0 + (y1 - y0) * 0.48;
	return `<rect x="${f(x - 5)}" y="${y0}" width="10" height="${f(k - y0 + 2)}" rx="3.6" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.8"/>
	<rect x="${f(x - 3.2)}" y="${f(y0 + 3)}" width="4" height="${f(k - y0 - 6)}" rx="1.6" fill="url(#${u}-bronze-soft)" opacity="0.8"/>
	<rect x="${f(x - 4)}" y="${f(k + 2)}" width="8" height="${f(y1 - k - 2)}" rx="3" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.8"/>
	<rect x="${f(x - 0.9)}" y="${f(k + 5)}" width="1.8" height="${f(y1 - k - 10)}" rx="0.9" fill="url(#${u}-steel)" stroke="${OUT}" stroke-width="0.35"/>
	<circle cx="${x}" cy="${f(k + 1)}" r="4.6" fill="url(#${u}-steel)" stroke="${OUT}" stroke-width="0.8"/><circle cx="${x}" cy="${f(k + 1)}" r="1.6" fill="#ff3a3a"/>`;
}

/**
 * Skeddwood's COWBOY WILD: Abscar's figure (bronze cyborg skull, red eyes, the holk, armoured shoulders) as a
 * whole terminator exoskeleton in a cowboy hat, 4 symbols tall: markup for an <svg viewBox="0 0 64 256">
 * (each reel cell shows a quarter: hat, face + shoulders, coat + gun belt, legs + boots). Our own drawing.
 */
export function cowboyFigure(uid: string): string {
	const u = `aop-${uid}`;
	const L = `url(#${u}-leather)`;
	const coat = (side: 1 | -1) => {
		const m = side === 1 ? '' : ` transform="${MIRROR}"`;
		return `<g${m}><path d="M9 104 C6 130 4 158 1 190 L14 196 C17 170 20 140 24 112 Z" fill="${L}" stroke="${OUT}" stroke-width="0.9"/>
		<path d="M9 108 C7 132 5 158 3 186" stroke="#5a3a1e" stroke-width="0.8" fill="none"/>
		<path d="M22 108 L25 160 L20 162 Z" fill="#2a170a" opacity="0.6"/></g>`;
	};
	const arm = (side: 1 | -1) => {
		const m = side === 1 ? '' : ` transform="${MIRROR}"`;
		return `<g${m}><path d="M6 98 C2 110 2 124 4 136 L13 136 C14 124 15 112 15 102 Z" fill="${L}" stroke="${OUT}" stroke-width="0.8"/>
		<path d="M4.4 132 L13.2 132 L13 137 L4.6 137 Z" fill="#c9a46a" stroke="${OUT}" stroke-width="0.5"/>
		${forearm(u, 8.6, 139, 9.8, 160)}
		<rect x="4.6" y="160" width="10" height="9" rx="3" fill="url(#${u}-bronze)" stroke="${OUT}" stroke-width="0.7"/>
		${[5.6, 8, 10.4, 12.8].map((x) => `<rect x="${x}" y="166" width="2" height="5" rx="1" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.4"/>`).join('')}</g>`;
	};
	const bullets = [16, 19.4, 22.8, 26.2, 37.8, 41.2, 44.6, 48]
		.map((x) => `<rect x="${x}" y="163.2" width="2.2" height="5.4" rx="1" fill="#e8b84a" stroke="#6b4306" stroke-width="0.4"/><rect x="${x}" y="163.2" width="2.2" height="1.6" rx="0.8" fill="#b9802a"/>`)
		.join('');
	const boot = (side: 1 | -1) => {
		const m = side === 1 ? '' : ` transform="${MIRROR}"`;
		return `<g${m}><path d="M19 228 L30 228 L31 244 C31 248 28 250 24 250 L8 250 C6 250 5 248 7 246 C11 244 15 243 18 241 Z" fill="${L}" stroke="${OUT}" stroke-width="0.9"/>
		<path d="M19 233 H30.6" stroke="#c9a46a" stroke-width="1.2"/><path d="M8 248 H30" stroke="#1a0e05" stroke-width="1.4"/>
		<path d="M31 244 L35 245" stroke="url(#${u}-steel)" stroke-width="1.2"/>
		<g transform="translate(36.4 245.2)">${[0, 45, 90, 135].map((a) => `<path d="M-2.6 0 H2.6" stroke="#d3d9e0" stroke-width="0.7" transform="rotate(${a})"/>`).join('')}<circle r="0.9" fill="#d3d9e0"/></g></g>`;
	};
	const extra = `<defs>
	<linearGradient id="${u}-leather" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#6b4325"/><stop offset="0.5" stop-color="#3e2512"/><stop offset="1" stop-color="#1e1108"/></linearGradient>
	<linearGradient id="${u}-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a30"/><stop offset="0.6" stop-color="#5a3518"/><stop offset="1" stop-color="#2e1a0a"/></linearGradient>
	<linearGradient id="${u}-scarf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a3a"/><stop offset="1" stop-color="#8a0d14"/></linearGradient>
	<linearGradient id="${u}-chaps" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3518"/><stop offset="0.5" stop-color="#8a5a30"/><stop offset="1" stop-color="#4a2a12"/></linearGradient>
	</defs>`;
	// the head-and-shoulders figure (as in the header emblem), moved down under the hat
	const top = `<g transform="translate(0 40)">${neck(u)}${shoulders(u)}${headAt(u)}</g>`;
	const hat = `<path d="M17 50 C16 36 19 24 24 20 C27 18 30 21 32 21 C34 21 37 18 40 20 C45 24 48 36 47 50 Z" fill="url(#${u}-hat)" stroke="${OUT}" stroke-width="0.9"/>
	<path d="M24 22 C27 30 29 40 30 49 M40 22 C37 30 35 40 34 49" stroke="#2e1a0a" stroke-opacity="0.55" stroke-width="0.8" fill="none"/>
	<path d="M17.4 43 C26 46 38 46 46.6 43 L47 49.6 C38 52.4 26 52.4 17 49.6 Z" fill="#8a0d14" stroke="${OUT}" stroke-width="0.6"/>
	${[22, 32, 42].map((x) => `<circle cx="${x}" cy="${x === 32 ? 48.6 : 47.6}" r="1.5" fill="#e8c76a" stroke="#6b4306" stroke-width="0.4"/>`).join('')}
	<path d="M1 51 C4 45 12 47 18 48.6 C26 50.6 38 50.6 46 48.6 C52 47 60 45 63 51 C60 56 50 54 44 54.6 C38 55.4 26 55.4 20 54.6 C14 54 4 56 1 51 Z" fill="url(#${u}-hat)" stroke="${OUT}" stroke-width="0.9"/>
	<path d="M4 50.6 C10 49 16 50.4 22 51.6 C28 52.6 36 52.6 42 51.6 C48 50.4 54 49 60 50.6" stroke="#a8703c" stroke-width="0.7" fill="none"/>
	<ellipse cx="25" cy="27" rx="3.4" ry="1.2" fill="#fff6dc" opacity="0.25"/>`;
	const scarf = `<path d="M20 84 C26 88 38 88 44 84 L41 92 C38 96 35 100 32 104 C29 100 26 96 23 92 Z" fill="url(#${u}-scarf)" stroke="${OUT}" stroke-width="0.8"/>
	<path d="M24 88 C28 90 36 90 40 88" stroke="#ffd6d0" stroke-opacity="0.5" stroke-width="0.6" fill="none"/>
	<circle cx="27" cy="91" r="0.8" fill="#fff"/><circle cx="35" cy="93" r="0.8" fill="#fff"/><circle cx="31" cy="97" r="0.8" fill="#fff"/>`;
	const chest = `<path d="M24 104 L40 104 L41.5 158 L22.5 158 Z" fill="url(#${u}-bronze-dark)" stroke="${OUT}" stroke-width="0.8"/>
	${[112, 122, 132, 142].map((y) => `<rect x="25.4" y="${y}" width="5.6" height="8" rx="1.4" fill="url(#${u}-bronze)" stroke="${OUT}" stroke-width="0.5"/><rect x="33" y="${y}" width="5.6" height="8" rx="1.4" fill="url(#${u}-bronze)" stroke="${OUT}" stroke-width="0.5"/>`).join('')}
	<path d="M32 108 V156" stroke="#ff2a2a" stroke-width="1" opacity="0.85"/><circle class="op-eye-glow" cx="32" cy="128" r="6" fill="url(#${u}-red)"/>`;
	const belt = `<path d="M13 160 C24 163 40 163 51 160 L51.6 170 C40 173 24 173 12.4 170 Z" fill="${L}" stroke="${OUT}" stroke-width="0.9"/>${bullets}
	<rect x="28" y="161.4" width="8" height="8.4" rx="1.6" fill="url(#${u}-bronze)" stroke="#6b4306" stroke-width="0.7"/><path d="M30 165.6 H34" stroke="#6b4306" stroke-width="1"/>
	<path d="M45 168 C49 168 53 169 54 172 L52 196 C51 199 46 199 45 196 Z" fill="${L}" stroke="${OUT}" stroke-width="0.9"/>
	<path d="M47 166 C49 160 54 158 57 160 L58 166 C56 168 52 168 49 170 Z" fill="url(#${u}-steel)" stroke="${OUT}" stroke-width="0.7"/>
	<path d="M53 160.6 L56.4 156.4 L58.6 157.6 L56.6 161" fill="url(#${u}-bronze)" stroke="${OUT}" stroke-width="0.5"/>`;
	const chaps = (side: 1 | -1) => {
		const m = side === 1 ? '' : ` transform="${MIRROR}"`;
		return `<g${m}><path d="M17 172 L30 172 L30.6 206 L18 206 C17 196 16.6 184 17 172 Z" fill="url(#${u}-chaps)" stroke="${OUT}" stroke-width="0.8" opacity="0.95"/>
		${[175, 181, 187, 193, 199].map((y) => `<path d="M17 ${y} l-3 2" stroke="#8a5a30" stroke-width="1.2" stroke-linecap="round"/>`).join('')}</g>`;
	};
	return `${defs(u, 'lighter')}${extra}
	${coat(1)}${coat(-1)}
	${leg(u, 24.6, 170, 232)}${leg(u, 39.4, 170, 232)}
	${chaps(1)}${chaps(-1)}
	${boot(1)}${boot(-1)}
	${arm(1)}${arm(-1)}
	${chest}${belt}${top}${scarf}${hat}
	${holk(u, MOUTH[0], MOUTH[1] + 40, 57.4, 74, 2.2, 7)}
	${smoke(u, 57.5, 71.2, 0.42)}`;
}

/** Skeddwood's GOLDEN SKULL: the same skull in polished gold (red eyes), for an <svg viewBox="0 0 64 64">. */
export function goldSkull(uid: string): string {
	const u = `aop-${uid}`;
	return `<defs>
	<linearGradient id="${u}-bronze" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.22" stop-color="#ffd23a"/><stop offset="0.5" stop-color="#b8810f"/><stop offset="0.74" stop-color="#ffe27a"/><stop offset="1" stop-color="#7a5204"/></linearGradient>
	<linearGradient id="${u}-bronze-dark" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="0.45" stop-color="#a87406"/><stop offset="1" stop-color="#4a3004"/></linearGradient>
	<radialGradient id="${u}-grime" cx="0.3" cy="0.7" r="0.8"><stop offset="0" stop-color="#3a2604" stop-opacity="0.3"/><stop offset="1" stop-color="#3a2604" stop-opacity="0"/></radialGradient>
	<radialGradient id="${u}-red"><stop offset="0" stop-color="#ff2a2a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff2a2a" stop-opacity="0"/></radialGradient>
	<radialGradient id="${u}-halo"><stop offset="0" stop-color="#ffe27a" stop-opacity="0.75"/><stop offset="0.6" stop-color="#ffb000" stop-opacity="0.25"/><stop offset="1" stop-color="#ffb000" stop-opacity="0"/></radialGradient>
	</defs>
	<circle cx="32" cy="31" r="31" fill="url(#${u}-halo)"/>
	<g transform="translate(1.6 2) scale(0.95)">${head(u)}</g>
	<path d="M10 12 l1.4 3.4 l3.4 1.4 l-3.4 1.4 l-1.4 3.4 l-1.4 -3.4 l-3.4 -1.4 l3.4 -1.4 Z" fill="#fffbe6"/>
	<path d="M53 44 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 Z" fill="#fffbe6"/>`;
}

/** BurgiShop on Abscar's figure (the 420 pack 2): another mouth item instead of his holk, plus eyes / hat. */
export interface OperatorWear {
	/** his own holk: white (default), gold (the Golden Holk) or none (something else is in his mouth) */
	holk?: 'white' | 'gold' | 'none';
	/** markup drawn over the figure, under the smoke (faceGear.ts: the mouth item, eyes, hat) */
	extra?: string;
	/** where the smoke rises from instead of the holk's end, and how much bigger it is */
	smokeAt?: [number, number];
	smokeBoost?: number;
}

/**
 * The inner markup of one figure, for an <svg viewBox="0 0 64 64"> with overflow visible.
 * `uid` keeps the gradient / clip ids unique per figure; `smoke` scales the smoke column (0 = none,
 * 0.9 = the header's full column, ~0.45 = a small one that stays round the head). `wear` = BurgiShop:
 * `true` = the Golden Holk (the same holk, in gold), or what he wears from the 420 pack 2 (OperatorWear).
 */
export function operatorMarkup(variant: OperatorVariant, uid: string, smokeScale = 0.9, wear: boolean | OperatorWear = false): string {
	const u = `aop-${uid}`;
	const w: OperatorWear = typeof wear === 'boolean' ? { holk: wear ? 'gold' : 'white' } : wear;
	let body = BODIES[variant](u, w.holk === 'gold');
	// no holk: drop the one between his teeth (the last thing every figure draws; the lighter's flame and fist
	// come after it there, so cut exactly that holk's markup out)
	if (w.holk === 'none') body = body.replace(holk(u, ...MOUTH, 57.4, 34, 2.2, 7, variant === 'lighter' ? 9 : undefined), '');
	const [sx, sy] = w.smokeAt ?? SMOKE_AT[variant];
	return `${defs(u, variant)}<g clip-path="url(#${u}-box)">${body}</g>${w.extra ?? ''}${smoke(u, sx, sy, smokeScale * (w.smokeBoost ?? 1))}`;
}
