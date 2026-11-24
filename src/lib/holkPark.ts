/**
 * Holk Park, Burgi City's park as a place of its own (2026-11-24, the user: "Gör Holkpark till en riktig
 * destination. Låt fantasin flöda."). A night scene seen from the side, our own drawing: the neon park sign
 * in the sky, Burgi City's skyline far away, the Munchie Truck, a stump with a boombox, a campfire with log
 * benches, the Golden Holk monument on its plinth, a leaf-shaped wishing pond with a fountain, two trees
 * with a hammock, and grass to touch. This file draws the parts that never change, as one SVG string; the
 * moving and tappable parts are drawn by HolkPark.svelte on top. Also the park's little rules (what the
 * grass counter calls you, which line comes next) and the per-device counters' cleaning.
 * Pure (no browser APIs), tested in scripts/holk-park.test.js.
 */
import { holk } from './abscarOperator.ts';
import { LEAF_PATHS } from './leaf.ts';

export const SCENE_W = 1200;
export const SCENE_H = 640;

/** where things stand in the scene (viewBox units), shared by the drawing, the effects and the tap areas */
export const SPOT = {
	truck: { x: 40, y: 300, w: 250, h: 230 },
	radio: { x: 150, y: 548, w: 96, h: 84 },
	fire: { x: 400, y: 418, w: 104, h: 134, cx: 452, cy: 528 },
	monument: { x: 586, y: 196, w: 158, h: 376, ember: [712, 252] as const },
	pond: { x: 742, y: 498, w: 236, h: 104, cx: 860, cy: 556 },
	hammock: { x: 984, y: 372, w: 196, h: 170 },
	grass: { x: 380, y: 590, w: 420, h: 50 }
} as const;
export type Station = keyof typeof SPOT;

/** seats round the fire, front ones last so they're drawn over the back ones */
export const SEATS: readonly (readonly [number, number])[] = [
	[392, 474],
	[512, 474],
	[340, 522],
	[564, 522],
	[312, 588],
	[580, 584]
];

const INK = '#0b0816';
const f = (n: number) => Math.round(n * 10) / 10;

/** a tiny seeded random, so the stars and grass are the same on every load (and in the prerender) */
export function seeded(seed: number) {
	let s = seed >>> 0 || 1;
	return () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return (s >>> 0) / 4294967296;
	};
}

const leaf = (x: number, y: number, k: number, fill: string, rot = 0, extra = '') =>
	`<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${k}) translate(-12 -22)" fill="${fill}"${extra ? ' ' + extra : ''}>${LEAF_PATHS.map((d) => `<path d="${d}"/>`).join('')}</g>`;

function sky(): string {
	const rnd = seeded(420);
	let stars = '';
	for (let i = 0; i < 70; i++) {
		const x = f(rnd() * SCENE_W);
		const y = f(rnd() * 300);
		const rr = f(0.6 + rnd() * 1.4);
		stars += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" class="hp-star" style="animation-delay:-${f(rnd() * 4)}s"/>`;
	}
	return `<defs>
		<linearGradient id="hp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090720"/><stop offset=".55" stop-color="#26124a"/><stop offset=".78" stop-color="#5a1f5e"/><stop offset="1" stop-color="#8a3a4a"/></linearGradient>
		<radialGradient id="hp-moon" cx=".4" cy=".35"><stop offset="0" stop-color="#fffbe6"/><stop offset=".7" stop-color="#f3e6b4"/><stop offset="1" stop-color="#d9c27a"/></radialGradient>
		<radialGradient id="hp-moonglow"><stop offset="0" stop-color="#fff2b0" stop-opacity=".35"/><stop offset="1" stop-color="#fff2b0" stop-opacity="0"/></radialGradient>
		<linearGradient id="hp-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f5a2a"/><stop offset="1" stop-color="#0c2a14"/></linearGradient>
		<linearGradient id="hp-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fa0e0"/><stop offset="1" stop-color="#14467a"/></linearGradient>
		<linearGradient id="hp-stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f8aa0"/><stop offset=".5" stop-color="#b9b4c8"/><stop offset="1" stop-color="#6a6580"/></linearGradient>
		<radialGradient id="hp-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity=".95"/><stop offset="1" stop-color="#ff5a00" stop-opacity="0"/></radialGradient>
		<radialGradient id="hp-fireglow"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a00" stop-opacity="0"/></radialGradient>
	</defs>
	<rect width="${SCENE_W}" height="${SCENE_H}" fill="url(#hp-sky)"/>
	${stars}
	<circle cx="1080" cy="96" r="120" fill="url(#hp-moonglow)"/>
	<circle cx="1080" cy="96" r="44" fill="url(#hp-moon)"/>
	<circle cx="1066" cy="84" r="7" fill="#d9c27a" opacity=".7"/><circle cx="1094" cy="110" r="10" fill="#d9c27a" opacity=".6"/><circle cx="1092" cy="78" r="4" fill="#d9c27a" opacity=".6"/>
	${leaf(1080, 96, 0.9, '#2f7a34', -12, 'opacity=".22"')}`;
}

/** Burgi City far away: the Ranked tower, the casino's sign, the base's dish */
function skyline(): string {
	const rnd = seeded(77);
	const blocks: [number, number, number][] = [
		[0, 60, 40], [60, 50, 70], [110, 70, 52], [180, 40, 150], [220, 80, 60], [300, 60, 84], [360, 90, 46], [450, 50, 96],
		[500, 70, 58], [570, 60, 72], [630, 80, 40], [710, 50, 88], [760, 110, 66], [870, 60, 104], [930, 70, 48], [1000, 60, 76], [1060, 90, 54], [1150, 50, 70]
	];
	let s = '';
	for (const [x, w, h] of blocks) {
		const y = 400 - h;
		s += `<rect x="${x}" y="${y}" width="${w}" height="${h + 4}" fill="#1a1036"/>`;
		for (let wy = y + 10; wy < 392; wy += 14) {
			for (let wx = x + 7; wx < x + w - 8; wx += 13) {
				if (rnd() > 0.72) s += `<rect x="${wx}" y="${wy}" width="5" height="6" fill="#ffd86a" opacity="${f(0.35 + rnd() * 0.5)}" class="${rnd() > 0.8 ? 'hp-win' : ''}"/>`;
			}
		}
	}
	// the Ranked tower's beacon + the casino's neon far away
	s += `<rect x="196" y="236" width="8" height="16" fill="#1a1036"/><circle cx="200" cy="232" r="4" fill="#4d8dff" class="hp-beacon"/>`;
	s += `<text x="822" y="320" font-size="15" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" fill="#ff4a3d" text-anchor="middle" class="hp-neon">CASINO</text>`;
	return s;
}

function ground(): string {
	const rnd = seeded(9);
	let s = `<path d="M0 410 C180 380 340 420 520 404 C700 388 880 420 1040 400 C1120 392 1170 398 1200 402 V640 H0Z" fill="#163d1f"/>`;
	s += `<path d="M0 452 C220 430 420 462 640 446 C860 430 1040 458 1200 444 V640 H0Z" fill="url(#hp-grass)"/>`;
	// a gravel path winding from the front to the monument
	s += `<path d="M600 640 C620 600 640 590 660 572 L690 572 C700 590 720 610 760 640Z" fill="#6b5a40" opacity=".75"/>`;
	// grass blades along the front, a few flowers
	for (let i = 0; i < 160; i++) {
		const x = f(rnd() * SCENE_W);
		const y = f(560 + rnd() * 80);
		const h = f(6 + rnd() * 12);
		const lean = f((rnd() - 0.5) * 8);
		s += `<path d="M${x} ${y}q${lean} ${-h / 2} ${lean * 1.6} ${-h}" stroke="${rnd() > 0.5 ? '#3ec24a' : '#2a8a36'}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
	}
	return s;
}

function truck(): string {
	const { x, y } = SPOT.truck;
	const X = x + 6, Y = y + 70;
	return `<g>
		<rect x="${X}" y="${Y}" width="230" height="138" rx="14" fill="#ff5cb8" stroke="${INK}" stroke-width="3"/>
		<path d="M${X + 168} ${Y} h44 q18 0 18 18 v66 h-62z" fill="#ffd54a" stroke="${INK}" stroke-width="3"/>
		<rect x="${X + 178}" y="${Y + 12}" width="38" height="34" rx="5" fill="#9fe6ff" stroke="${INK}" stroke-width="2.5"/>
		<path d="M${X - 6} ${Y - 8} h184 l-10 26 h-164z" fill="#43d35e" stroke="${INK}" stroke-width="3"/>
		<path d="M${X + 14} ${Y + 18} l12 -26 M${X + 54} ${Y + 18} l12 -26 M${X + 94} ${Y + 18} l12 -26 M${X + 134} ${Y + 18} l12 -26" stroke="#fff" stroke-width="7" opacity=".7"/>
		<rect x="${X + 18}" y="${Y + 30}" width="134" height="58" rx="6" fill="#140b24" stroke="${INK}" stroke-width="3"/>
		<rect x="${X + 18}" y="${Y + 30}" width="134" height="58" rx="6" fill="#ffe7a0" opacity=".9" class="hp-window"/>
		<rect x="${X + 12}" y="${Y + 86}" width="146" height="10" rx="3" fill="#c9c2d8" stroke="${INK}" stroke-width="2"/>
		<text x="${X + 85}" y="${Y + 124}" font-size="20" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" fill="#fff" stroke="${INK}" stroke-width="4" paint-order="stroke" text-anchor="middle">MUNCHIE TRUCK</text>
		<circle cx="${X + 46}" cy="${Y + 142}" r="22" fill="#222" stroke="${INK}" stroke-width="3"/><circle cx="${X + 46}" cy="${Y + 142}" r="9" fill="#bbb"/>
		<circle cx="${X + 186}" cy="${Y + 142}" r="22" fill="#222" stroke="${INK}" stroke-width="3"/><circle cx="${X + 186}" cy="${Y + 142}" r="9" fill="#bbb"/>
		<g transform="translate(${X + 85} ${Y - 46})">
			<rect x="-58" y="-20" width="116" height="34" rx="10" fill="#140b24" stroke="#ffd54a" stroke-width="2.5"/>
			<text y="5" font-size="17" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" fill="#ffd54a" text-anchor="middle" class="hp-neon">OPEN 24/7</text>
			<path d="M-40 14v20M40 14v20" stroke="${INK}" stroke-width="3"/>
		</g>
	</g>`;
}

function radio(): string {
	const { x, y } = SPOT.radio;
	const cx = x + 48;
	return `<g>
		<ellipse cx="${cx}" cy="${y + 76}" rx="36" ry="9" fill="#000" opacity=".35"/>
		<rect x="${cx - 30}" y="${y + 44}" width="60" height="32" fill="#7a4a22" stroke="${INK}" stroke-width="2.5"/>
		<ellipse cx="${cx}" cy="${y + 44}" rx="30" ry="8" fill="#c48a52" stroke="${INK}" stroke-width="2.5"/>
		<ellipse cx="${cx}" cy="${y + 44}" rx="18" ry="4.5" fill="none" stroke="#7a4a22" stroke-width="1.5"/>
		<g transform="translate(${cx} ${y + 22})">
			<path d="M-22 -14q22 -14 44 0" stroke="#cfd6dc" stroke-width="3" fill="none"/>
			<rect x="-34" y="-14" width="68" height="34" rx="6" fill="#2a2440" stroke="${INK}" stroke-width="2.5"/>
			<circle cx="-18" cy="4" r="10" fill="#140b24" stroke="#ff8a2a" stroke-width="2"/><circle cx="-18" cy="4" r="4" fill="#ff8a2a"/>
			<circle cx="18" cy="4" r="10" fill="#140b24" stroke="#ff8a2a" stroke-width="2"/><circle cx="18" cy="4" r="4" fill="#ff8a2a"/>
			<rect x="-7" y="-9" width="14" height="7" rx="1.5" fill="#9dff2e" opacity=".8"/>
		</g>
	</g>`;
}

function fire(): string {
	const { cx, cy } = SPOT.fire;
	const log = (x: number, y: number, w: number) =>
		`<rect x="${x - w / 2}" y="${y - 11}" width="${w}" height="22" rx="11" fill="#7a4a22" stroke="${INK}" stroke-width="2.5"/><ellipse cx="${x + w / 2 - 6}" cy="${y}" rx="6" ry="10" fill="#c48a52" stroke="${INK}" stroke-width="2"/>`;
	return `<g>
		<circle cx="${cx}" cy="${cy - 20}" r="150" fill="url(#hp-fireglow)" class="hp-glow"/>
		${log(cx - 60, cy - 46, 74)}${log(cx + 60, cy - 46, 74)}
		${log(cx - 100, cy - 8, 82)}${log(cx + 100, cy - 8, 82)}
		<ellipse cx="${cx}" cy="${cy + 8}" rx="44" ry="13" fill="#3a3046" stroke="${INK}" stroke-width="2"/>
		${[-34, -18, 0, 18, 34].map((d, i) => `<ellipse cx="${cx + d}" cy="${cy + 4 + (i % 2) * 6}" rx="10" ry="6" fill="#8f8aa0" stroke="${INK}" stroke-width="1.5"/>`).join('')}
		<path d="M${cx - 30} ${cy + 2} l60 -14 M${cx - 30} ${cy - 12} l60 14" stroke="#5a3a1a" stroke-width="9" stroke-linecap="round"/>
		${log(cx - 116, cy + 46, 86)}${log(cx + 116, cy + 46, 86)}
	</g>`;
}

function monument(): string {
	const [ex, ey] = SPOT.monument.ember;
	return `<g>
		<ellipse cx="664" cy="566" rx="96" ry="16" fill="#000" opacity=".35"/>
		<path d="M580 566 h168 v-12 h-168z" fill="#6a6580" stroke="${INK}" stroke-width="2.5"/>
		<path d="M594 554 h140 v-10 h-140z" fill="#8f8aa0" stroke="${INK}" stroke-width="2.5"/>
		<rect x="610" y="462" width="108" height="82" fill="url(#hp-stone)" stroke="${INK}" stroke-width="2.5"/>
		<rect x="602" y="452" width="124" height="14" fill="#b9b4c8" stroke="${INK}" stroke-width="2.5"/>
		<rect x="622" y="476" width="84" height="54" rx="4" fill="#3a2a10" stroke="#e9bd4a" stroke-width="2"/>
		<text x="664" y="494" font-size="9" font-weight="800" font-family="Bahnschrift, Arial, sans-serif" fill="#f6cf5a" text-anchor="middle">IN HONOUR OF</text>
		<text x="664" y="507" font-size="9" font-weight="800" font-family="Bahnschrift, Arial, sans-serif" fill="#f6cf5a" text-anchor="middle">THE SMOKE BREAK</text>
		<text x="664" y="521" font-size="7" font-family="Bahnschrift, Arial, sans-serif" fill="#d9a52e" text-anchor="middle">BURGI CITY · EST. 2026</text>
		<g class="hp-statue">${holk('hp', 640, 452, ex, ey, 14, 46, 46, true)}</g>
		${leaf(608, 452, 0.9, '#3ec24a', -30)}${leaf(720, 452, 0.9, '#3ec24a', 30)}
	</g>`;
}

function pond(): string {
	const { cx, cy } = SPOT.pond;
	return `<g>
		<ellipse cx="${cx}" cy="${cy}" rx="116" ry="38" fill="#4b4658" stroke="${INK}" stroke-width="3"/>
		<ellipse cx="${cx}" cy="${cy - 2}" rx="104" ry="31" fill="url(#hp-water)"/>
		<ellipse cx="${cx - 30}" cy="${cy - 10}" rx="40" ry="6" fill="#bfe6ff" opacity=".35"/>
		${leaf(cx - 62, cy + 6, 0.8, '#2f9a3a', -70)}${leaf(cx + 66, cy + 2, 0.7, '#2f9a3a', 64)}${leaf(cx + 30, cy + 16, 0.55, '#3ec24a', 20)}
		<rect x="${cx - 8}" y="${cy - 36}" width="16" height="30" fill="url(#hp-stone)" stroke="${INK}" stroke-width="2"/>
		<ellipse cx="${cx}" cy="${cy - 36}" rx="22" ry="7" fill="#b9b4c8" stroke="${INK}" stroke-width="2"/>
		<text x="${cx}" y="${cy + 54}" font-size="11" font-weight="800" font-family="Bahnschrift, Arial, sans-serif" fill="#bfe6ff" text-anchor="middle" opacity=".85">WISHING POND</text>
	</g>`;
}

function trees(): string {
	const tree = (x: number, y: number) => {
		let s = `<path d="M${x - 9} ${y} q-4 -70 4 -140 h10 q8 70 4 140z" fill="#5a3a1a" stroke="${INK}" stroke-width="2.5"/>`;
		const rnd = seeded(x);
		for (let i = 0; i < 9; i++) {
			const a = (i / 9) * Math.PI * 2;
			s += leaf(x + Math.cos(a) * 34 + (rnd() - 0.5) * 10, y - 170 + Math.sin(a) * 26, 2.4 + rnd() * 0.6, i % 2 ? '#2f9a3a' : '#3ec24a', f((a * 180) / Math.PI + 90), 'stroke="#0e3312" stroke-width=".4"');
		}
		s += leaf(x, y - 176, 2.8, '#46d454', 0, 'stroke="#0e3312" stroke-width=".4"');
		return `<g class="hp-tree">${s}</g>`;
	};
	return `${tree(1000, 548)}${tree(1158, 548)}
		<path d="M1004 446 Q1079 512 1154 446" stroke="#e8d8a8" stroke-width="3" fill="none"/>
		<path d="M1010 452 Q1079 520 1148 452 Q1079 498 1010 452z" fill="#e05a3a" stroke="${INK}" stroke-width="2.5"/>
		<path d="M1030 466 Q1079 504 1128 466" stroke="#ffd54a" stroke-width="3" fill="none" opacity=".8"/>`;
}

function grassSign(): string {
	return `<g>
		<path d="M443 640 v-42" stroke="#5a3a1a" stroke-width="6"/>
		<path d="M405 588 h76 l10 12 l-10 12 h-76z" fill="#c48a52" stroke="${INK}" stroke-width="2.5"/>
		<text x="443" y="605" font-size="11" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" fill="#3a2410" text-anchor="middle">TOUCH GRASS</text>
	</g>`;
}

/** The neon park sign in the sky: drawn in the scene so it scales with it */
function parkSign(): string {
	return `<g transform="translate(600 72)">
		<text y="0" font-size="58" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" text-anchor="middle" fill="none" stroke="#43d35e" stroke-width="10" opacity=".35" class="hp-neon">HOLK PARK</text>
		<text y="0" font-size="58" font-weight="900" font-family="Bahnschrift, Arial Black, sans-serif" text-anchor="middle" fill="#d9ffd6" stroke="#43d35e" stroke-width="2.5" class="hp-neon">HOLK PARK</text>
		<text y="28" font-size="15" font-weight="800" letter-spacing="4" font-family="Bahnschrift, Arial, sans-serif" text-anchor="middle" fill="#ffd54a">BURGI CITY’S FINEST CHILL ZONE</text>
		${leaf(-196, -18, 1.6, '#43d35e', -20, 'class="hp-neon"')}${leaf(196, -18, 1.6, '#43d35e', 20, 'class="hp-neon"')}
	</g>`;
}

/** Everything in the scene that never changes, back to front (the moving bits go on top). */
export function parkScene(): string {
	return sky() + parkSign() + skyline() + ground() + truck() + radio() + fire() + monument() + pond() + trees() + grassSign();
}

// ——— the park's little rules ———

/** The grass counter's title: what touching grass this often makes you. */
export const GRASS_RANKS = [0, 1, 5, 20, 50, 100, 420] as const;
export function grassRank(n: number): number {
	let r = 0;
	for (let i = 0; i < GRASS_RANKS.length; i++) if (n >= GRASS_RANKS[i]) r = i;
	return r;
}

/** Which line to say next: never the same one twice in a row. `rnd` in [0, 1). */
export function nextLine(count: number, last: number, rnd: number): number {
	if (count <= 1) return 0;
	const i = Math.floor(rnd * (count - 1));
	return i >= last && last >= 0 ? i + 1 : i;
}

/** The park's counters, per device (`mw4-camo-grind:park`): smoke breaks, grass, wishes, munchies. */
export interface ParkLog {
	breaks: number;
	grass: number;
	wishes: number;
	munchies: number;
	fires: number;
}
export const EMPTY_LOG: ParkLog = { breaks: 0, grass: 0, wishes: 0, munchies: 0, fires: 0 };
const MAX = 1_000_000_000;
export function cleanLog(raw: unknown): ParkLog {
	const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(MAX, Math.max(0, Math.floor(v))) : 0);
	return { breaks: n(o.breaks), grass: n(o.grass), wishes: n(o.wishes), munchies: n(o.munchies), fires: n(o.fires) };
}
