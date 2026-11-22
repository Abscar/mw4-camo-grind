/**
 * Letters for the casino machines' logos (2026-11-20, after the Mybots 5 logo): each letter is a centre line
 * (cap height 0–80) that a logo strokes thick (chunky cartoon letters), thin with a glow (neon tubes) or square
 * (wooden sign letters). Our own shapes, not a font. `layoutWord` places a word: advance = the letter's width +
 * the stroke + a gap, an optional arch (a smile or a frown) and a little tilt per letter so it looks hand-made.
 */

export type Glyph = { d: string; w: number };

export const GLYPHS: Record<string, Glyph> = {
	A: { d: 'M0 80 L30 0 L60 80 M15 52 H45', w: 60 },
	B: { d: 'M0 80 V0 H18 C48 0 48 38 18 38 H0 M18 38 H22 C54 38 54 80 22 80 H0', w: 46 },
	C: { d: 'M54 14 C47 4 38 0 29 0 C12 0 0 18 0 40 C0 62 12 80 29 80 C38 80 47 76 54 66', w: 54 },
	D: { d: 'M0 80 V0 H20 C44 0 56 18 56 40 C56 62 44 80 20 80 Z', w: 56 },
	E: { d: 'M48 0 H0 V80 H48 M0 40 H38', w: 48 },
	F: { d: 'M48 0 H0 V80 M0 40 H38', w: 46 },
	H: { d: 'M0 0 V80 M52 0 V80 M0 40 H52', w: 52 },
	K: { d: 'M0 0 V80 M50 0 L4 46 M18 32 L52 80', w: 52 },
	M: { d: 'M0 80 V0 L32 44 L64 0 V80', w: 64 },
	N: { d: 'M0 80 V0 L52 80 V0', w: 52 },
	O: { d: 'M30 0 A30 40 0 1 1 30 80 A30 40 0 1 1 30 0 Z', w: 60 },
	R: { d: 'M0 80 V0 H22 C52 0 52 42 22 42 H0 M22 42 L50 80', w: 50 },
	S: { d: 'M50 10 C44 2 36 0 28 0 C10 0 2 9 2 21 C2 33 12 37 26 40 C42 43 52 48 52 60 C52 73 42 80 26 80 C14 80 6 76 0 69', w: 52 },
	T: { d: 'M0 0 H56 M28 0 V80', w: 56 },
	U: { d: 'M0 0 V52 C0 70 12 80 26 80 C40 80 52 70 52 52 V0', w: 52 },
	W: { d: 'M0 0 L16 80 L36 24 L56 80 L72 0', w: 72 },
	Y: { d: 'M0 2 L26 40 L52 2 M26 40 V80', w: 52 },
	// BurgiArcade's names (2026-11-22): G, I, L, P, Q, V, X, Z
	G: { d: 'M54 14 C47 4 38 0 29 0 C12 0 0 18 0 40 C0 62 12 80 29 80 C41 80 50 74 54 62 V44 H32', w: 54 },
	I: { d: 'M2 0 V80', w: 4 },
	L: { d: 'M0 0 V80 H44', w: 44 },
	P: { d: 'M0 80 V0 H22 C52 0 52 44 22 44 H0', w: 46 },
	Q: { d: 'M30 0 A30 40 0 1 1 30 80 A30 40 0 1 1 30 0 Z M38 60 L60 84', w: 60 },
	V: { d: 'M0 0 L28 80 L56 0', w: 56 },
	X: { d: 'M0 0 L52 80 M52 0 L0 80', w: 52 },
	Z: { d: 'M2 0 H52 L0 80 H54', w: 54 },
	"'": { d: 'M5 -4 L2 20', w: 6 }
};

export type Placed = { ch: string; d: string; x: number; y: number; r: number; cx: number; cy: number; s: number; i: number };

export type WordOpts = {
	/** where the word's first letter's centre line starts, and its top (before the arch) */
	x: number;
	y: number;
	/** the stroke the logo will use (sets the gap between letters) and an extra gap */
	stroke: number;
	gap?: number;
	scale?: number;
	/** arch: + = the middle letters sit lower (a smile), − = higher (a frown); in drawing units at the middle */
	arch?: number;
	/** tilt per letter in degrees, cycled (a little wobble so it looks hand-made) */
	tilts?: number[];
	/** small up/down offsets per letter, cycled */
	bob?: number[];
};

/** the word's width in drawing units (for centring) */
export function wordWidth(word: string, o: Pick<WordOpts, 'stroke' | 'gap' | 'scale'>): number {
	const s = o.scale ?? 1;
	const chars = [...word].filter((c) => c !== ' ');
	let w = 0;
	for (const [i, c] of [...word].entries()) {
		if (c === ' ') {
			w += 26 * s;
			continue;
		}
		const g = GLYPHS[c] ?? GLYPHS.O;
		w += g.w * s;
		if (i < word.length - 1) w += (o.stroke + (o.gap ?? 4)) * s;
	}
	return chars.length ? w : 0;
}

/** places the letters of a word; letters the table lacks fall back to O (never happens with our names) */
export function layoutWord(word: string, o: WordOpts): Placed[] {
	const s = o.scale ?? 1;
	const total = wordWidth(word, o);
	const out: Placed[] = [];
	let x = o.x;
	let i = 0;
	for (const c of word) {
		if (c === ' ') {
			x += 26 * s;
			continue;
		}
		const g = GLYPHS[c] ?? GLYPHS.O;
		const mid = x + (g.w * s) / 2;
		const t = total ? (mid - o.x) / total : 0.5; // 0 … 1 along the word
		const arch = (o.arch ?? 0) * (1 - (2 * t - 1) ** 2);
		const r = o.tilts?.length ? o.tilts[i % o.tilts.length] : 0;
		const bob = o.bob?.length ? o.bob[i % o.bob.length] : 0;
		out.push({ ch: c, d: g.d, x, y: o.y + arch + bob, r, cx: g.w / 2, cy: 40, s, i });
		x += (g.w + o.stroke + (o.gap ?? 4)) * s;
		i++;
	}
	return out;
}

export const placedTransform = (p: Placed) => `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.r} ${(p.cx * p.s).toFixed(1)} ${(p.cy * p.s).toFixed(1)}) scale(${p.s})`;
