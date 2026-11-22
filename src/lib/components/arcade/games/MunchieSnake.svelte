<!--
	Munchie Snake (BurgiArcade, 2026-11-22): snake on a 17 × 17 board in a dim stoner den. The head is a little
	weed-leaf creature with red eyes and a lit holk (cone joint) in his mouth; his body is the trail of smoke
	puffs behind him, longer with every munchie (burger, fries, donut, pizza, taco). Golden burgers blink and
	vanish after a few seconds; from the 10th munchie on, traffic cones drop onto the board. The rules live
	in arcade/snake.ts (seeded, so everyone gets the same munchies); this file draws it on a 720 × 720 canvas
	(the board and every sprite pre-rendered once per size; the snake glides between cells) and takes the
	arrow keys / WASD, swipes, and an on-screen pad on phones.
-->
<script lang="ts" module>
	import { LEAF_PATHS } from '#lib/leaf.ts';
	import { GRID, type Munchie } from '#lib/arcade/snake.ts';

	type Ctx = CanvasRenderingContext2D;
	const L = 720;
	const HUD_H = 64;
	const C = 37;
	const B = C * GRID;
	const X0 = (L - B) / 2;
	const Y0 = 72;
	const O = '#1a0630';
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';

	function canvasOf(w: number, h: number, scale: number): [HTMLCanvasElement, Ctx] {
		const cv = document.createElement('canvas');
		cv.width = Math.max(1, Math.ceil(w * scale));
		cv.height = Math.max(1, Math.ceil(h * scale));
		const c = cv.getContext('2d')!;
		c.setTransform(scale, 0, 0, scale, 0, 0);
		c.lineJoin = 'round';
		c.lineCap = 'round';
		return [cv, c];
	}
	function lgrad(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
		const g = c.createLinearGradient(x0, y0, x1, y1);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}
	function rgrad(c: Ctx, x: number, y: number, r: number, stops: [number, string][], fx = x, fy = y): CanvasGradient {
		const g = c.createRadialGradient(fx, fy, 0, x, y, r);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}
	/** fill a path, then outline it */
	function fs(c: Ctx, p: Path2D, fill: string | CanvasGradient, line = 3, stroke = O) {
		c.fillStyle = fill;
		c.fill(p);
		if (line > 0) {
			c.lineWidth = line;
			c.strokeStyle = stroke;
			c.stroke(p);
		}
	}
	const P = (d: string) => new Path2D(d);
	function ell(x: number, y: number, rx: number, ry: number, rot = 0): Path2D {
		const p = new Path2D();
		p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
		return p;
	}
	function rr(x: number, y: number, w: number, h: number, r: number): Path2D {
		const p = new Path2D();
		p.roundRect(x, y, w, h, r);
		return p;
	}

	// ── the munchies, each in a 64 × 64 box (in the style of the casino's reel symbols) ──
	function burger(c: Ctx, gold: boolean) {
		const bun = gold
			? rgrad(c, 32, 30, 34, [[0, '#fff6b0'], [0.45, '#ffc928'], [1, '#b86e00']], 24, 18)
			: lgrad(c, 0, 12, 0, 58, [[0, '#f9c56a'], [0.5, '#e8a046'], [1, '#a4531a']]);
		if (gold) {
			fs(c, P('M18 14 L22 4 L28 10 L32 1 L36 10 L42 4 L46 14 Z'), bun, 2.5);
			fs(c, ell(32, 7, 1.9, 1.9), '#e2261f', 1);
		}
		fs(c, P('M8 32 Q8 12 32 12 Q56 12 56 32 Z'), bun);
		c.fillStyle = '#fff6d0';
		for (const [x, y] of [
			[22, 20],
			[30, 17],
			[38, 19],
			[44, 24],
			[17, 26],
			[28, 25]
		])
			c.fill(ell(x, y, 1.9, 1.1));
		c.strokeStyle = 'rgba(255,250,230,.7)';
		c.lineWidth = 2.2;
		c.beginPath();
		c.moveTo(14, 26);
		c.quadraticCurveTo(16, 17, 26, 15);
		c.stroke();
		fs(c, P('M6 34 Q12 30 16 35 Q22 30 28 35 Q34 30 40 35 Q46 30 52 35 Q56 31 58 34 L58 37 L6 37 Z'), '#4fb23a', 2.4);
		fs(c, P('M8 37 L56 37 L50 43 L14 43 Z'), '#ffc928', 2.2);
		fs(c, rr(7, 41, 50, 8, 4), '#6b3a1c');
		fs(c, P('M9 50 L55 50 Q55 58 46 58 L18 58 Q9 58 9 50 Z'), bun);
	}
	function fries(c: Ctx) {
		for (const [x, y, r] of [
			[18, 10, -8],
			[24, 6, -3],
			[30, 4, 0],
			[36, 6, 4],
			[42, 9, 8],
			[27, 9, -1],
			[34, 10, 3]
		]) {
			c.save();
			c.translate(x + 3, y + 30);
			c.rotate((r * Math.PI) / 180);
			fs(c, rr(-3, -30, 6, 30, 1.5), lgrad(c, -3, 0, 3, 0, [[0, '#fff08a'], [1, '#f5b81c']]), 2.2);
			c.restore();
		}
		fs(c, P('M12 28 L52 28 L46 58 L18 58 Z'), lgrad(c, 12, 0, 52, 0, [[0, '#ff5a4a'], [0.5, '#e2261f'], [1, '#a8140e']]));
		c.strokeStyle = '#ffd23a';
		c.lineWidth = 3.5;
		c.beginPath();
		c.moveTo(24, 38);
		c.quadraticCurveTo(32, 46, 40, 38);
		c.stroke();
		c.strokeStyle = 'rgba(255,255,255,.35)';
		c.lineWidth = 2.5;
		c.beginPath();
		c.moveTo(16, 31);
		c.lineTo(20, 55);
		c.stroke();
	}
	function donut(c: Ctx) {
		fs(c, ell(32, 34, 25, 23), rgrad(c, 32, 34, 25, [[0, '#f6c27a'], [0.7, '#d98f45'], [1, '#a8601f']]));
		const ic = new Path2D();
		for (let i = 0; i <= 60; i++) {
			const a = (i / 60) * Math.PI * 2;
			const r = 20 + 1.8 * Math.sin(a * 7) + (Math.sin(a * 3 + 1) > 0.7 ? 2.5 : 0);
			const x = 32 + Math.cos(a) * r;
			const y = 33 + Math.sin(a) * r * 0.92;
			if (i === 0) ic.moveTo(x, y);
			else ic.lineTo(x, y);
		}
		ic.closePath();
		fs(c, ic, rgrad(c, 32, 30, 22, [[0, '#ffb3dd'], [0.6, '#ff6fb5'], [1, '#e0408f']], 26, 24), 2.4);
		const cols = ['#fff6b0', '#5dd3ff', '#7dff6a', '#ffffff', '#ffd23a', '#b48cff'];
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * Math.PI * 2 + 0.3;
			const r = 12.5 + (i % 3) * 2.2;
			c.save();
			c.translate(32 + Math.cos(a) * r, 33 + Math.sin(a) * r * 0.92);
			c.rotate(a * 2.3);
			c.fillStyle = cols[i % cols.length];
			c.fill(rr(-2.6, -0.9, 5.2, 1.8, 0.9));
			c.restore();
		}
		fs(c, ell(32, 33, 8.5, 7.6), '#c27a35', 0);
		fs(c, ell(32, 34, 6, 5.2), '#170b22', 2.4);
		c.strokeStyle = 'rgba(255,255,255,.65)';
		c.lineWidth = 2.6;
		c.beginPath();
		c.ellipse(32, 33, 17, 15, 0, Math.PI * 1.1, Math.PI * 1.45);
		c.stroke();
	}
	function pizza(c: Ctx) {
		fs(c, P('M9 15 Q32 3 55 15 L33 60 Q32 62 31 60 Z'), lgrad(c, 0, 10, 0, 60, [[0, '#ffe066'], [1, '#f2a91c']]));
		c.fillStyle = '#ffd23a';
		c.fill(P('M20 22 Q22 30 20 34 Q18 30 20 22 Z M42 24 Q44 33 41 37 Q39 31 42 24 Z'));
		for (const [x, y, r] of [
			[24, 22, 5.6],
			[40, 22, 5],
			[32, 36, 5.2],
			[30, 50, 3.6]
		]) {
			fs(c, ell(x, y, r, r * 0.9), rgrad(c, x - 1.5, y - 1.5, r, [[0, '#ff6a50'], [1, '#b0201a']]), 2);
			c.fillStyle = 'rgba(90,10,6,.5)';
			c.fill(ell(x + r * 0.3, y + r * 0.2, r * 0.25, r * 0.2));
		}
		fs(c, P('M7 16 Q32 0 57 16 L54 23 Q32 10 10 23 Z'), lgrad(c, 0, 4, 0, 23, [[0, '#f0a050'], [1, '#b8661f']]), 2.6);
		c.fillStyle = 'rgba(255,240,200,.6)';
		c.fill(ell(22, 12.5, 4, 1.2, -0.3));
		c.fill(ell(40, 11.5, 4, 1.2, 0.3));
	}
	function taco(c: Ctx) {
		// fillings over the top of the shell
		fs(c, P('M9 32 Q12 22 20 25 Q25 16 33 22 Q40 15 46 23 Q53 21 55 32 Z'), '#7a3e1a', 2.2);
		for (const [x, y] of [
			[16, 25],
			[30, 20],
			[44, 21]
		])
			fs(c, P(`M${x - 6} ${y + 5} Q${x - 3} ${y - 4} ${x} ${y + 1} Q${x + 3} ${y - 5} ${x + 6} ${y + 4} Z`), '#5cc23e', 1.8);
		for (const [x, y] of [
			[22, 24],
			[37, 22],
			[48, 26]
		])
			fs(c, rr(x - 3, y - 3, 6, 5, 1.5), '#e2261f', 1.6);
		c.strokeStyle = '#ffd23a';
		c.lineWidth = 1.8;
		for (const [x, y] of [
			[13, 28],
			[27, 26],
			[42, 27]
		]) {
			c.beginPath();
			c.moveTo(x, y);
			c.lineTo(x + 5, y - 2);
			c.stroke();
		}
		// the shell
		fs(c, P('M5 30 Q5 58 32 58 Q59 58 59 30 Q46 36 32 36 Q18 36 5 30 Z'), lgrad(c, 0, 30, 0, 58, [[0, '#ffe07a'], [0.6, '#f6bd3c'], [1, '#d48a16']]));
		c.fillStyle = 'rgba(176,100,10,.45)';
		for (const [x, y] of [
			[16, 44],
			[28, 50],
			[42, 46],
			[50, 40],
			[22, 40],
			[36, 42]
		])
			c.fill(ell(x, y, 1.6, 1.1));
		c.strokeStyle = 'rgba(255,255,230,.6)';
		c.lineWidth = 2.4;
		c.beginPath();
		c.moveTo(11, 38);
		c.quadraticCurveTo(14, 50, 24, 54);
		c.stroke();
	}
	function cone(c: Ctx) {
		c.fillStyle = 'rgba(0,0,0,.35)';
		c.fill(ell(32, 60, 24, 4));
		fs(c, rr(8, 52, 48, 8, 2.5), lgrad(c, 0, 52, 0, 60, [[0, '#3a3440'], [1, '#18141c']]));
		fs(c, P('M27 5 Q32 2 37 5 L50 53 L14 53 Z'), lgrad(c, 14, 0, 50, 0, [[0, '#ffb35a'], [0.45, '#ff7a1a'], [1, '#c8460a']]));
		c.save();
		c.clip(P('M27 5 Q32 2 37 5 L50 53 L14 53 Z'));
		c.fillStyle = '#fbf6ee';
		c.fillRect(0, 19, 64, 7);
		c.fillRect(0, 35, 64, 7);
		c.fillStyle = 'rgba(255,255,255,.35)';
		c.fill(P('M27 6 L30 6 L22 52 L17 52 Z'));
		c.restore();
		c.lineWidth = 3;
		c.strokeStyle = O;
		c.stroke(P('M27 5 Q32 2 37 5 L50 53 L14 53 Z'));
	}

	/** One smoke puff of the trail (a 64 × 64 box, centre 32,32), three bump layouts. */
	function puff(c: Ctx, v: number) {
		const bumps = [
			[
				[32, 35, 19],
				[20, 28, 12],
				[42, 25, 13]
			],
			[
				[32, 34, 19],
				[44, 31, 12],
				[24, 23, 12]
			],
			[
				[31, 36, 18],
				[19, 33, 11],
				[34, 22, 13],
				[45, 34, 10]
			]
		][v];
		const p = new Path2D();
		for (const [x, y, r] of bumps) {
			p.moveTo(x + r, y);
			p.arc(x, y, r, 0, Math.PI * 2);
		}
		c.lineWidth = 4.4;
		c.strokeStyle = '#46386c';
		c.stroke(p);
		c.fillStyle = rgrad(c, 30, 32, 26, [[0, '#ffffff'], [0.5, '#e9e4f6'], [1, '#aca2cc']], 24, 22);
		c.fill(p);
		c.fillStyle = 'rgba(255,255,255,.8)';
		c.fill(ell(25, 24, 5, 2.6, -0.5));
	}

	/** The head (a 100 × 100 box, facing right): leaf fan, round face, a holk in the mouth; eyes go on live. */
	function head(c: Ctx) {
		// the leaf fan behind the face (leaf.ts's leaf, big and fattened: a dark outline pass, then the fill)
		const fan = (rot: number, k: number, top: string, bottom: string) => {
			c.save();
			c.translate(50, 70);
			c.rotate(rot);
			c.scale(k, k);
			c.translate(-12, -20);
			c.lineJoin = 'round';
			const paths = LEAF_PATHS.map(P);
			c.strokeStyle = '#0c3412';
			c.lineWidth = 2.3;
			for (const p of paths) c.stroke(p);
			const g = lgrad(c, 0, 5, 0, 20, [[0, top], [1, bottom]]);
			c.strokeStyle = g;
			c.fillStyle = g;
			c.lineWidth = 1.2;
			for (const p of paths) {
				c.stroke(p);
				c.fill(p);
			}
			c.strokeStyle = 'rgba(220,255,180,.7)';
			c.lineWidth = 0.32;
			c.beginPath();
			for (const [x, y] of [
				[12, 8.5],
				[7.2, 11.4],
				[16.8, 11.4],
				[4.4, 15.6],
				[19.6, 15.6]
			]) {
				c.moveTo(12, 20);
				c.lineTo(x, y);
			}
			c.stroke();
			c.restore();
		};
		fan(-0.3, 4.1, '#4fae36', '#1d5a14');
		fan(0.3, 4.1, '#4fae36', '#1d5a14');
		fan(0, 4.6, '#a6f06a', '#2f9a26');
		// face
		fs(c, ell(52, 61, 25, 23.5), rgrad(c, 52, 61, 28, [[0, '#b4f27a'], [0.55, '#62c641'], [1, '#2d8424']], 44, 51), 3.4);
		// little leaf ears
		c.fillStyle = 'rgba(255,255,255,.22)';
		c.fill(ell(42, 44, 9, 4, -0.5));
		// rosy cheeks
		c.fillStyle = 'rgba(255,120,140,.45)';
		c.fill(ell(40, 68, 5, 3));
		c.fill(ell(70, 67, 5, 3));
		// lazy grin
		fs(c, P('M48 70 Q58 80 70 70 Q60 74 48 70 Z'), '#5a1414', 2.2);
		c.fillStyle = '#ffffff';
		c.fill(P('M52 71.6 L66 71.2 L64 73.6 L54 73.8 Z'));
		// the holk: crutch in the mouth corner, white cone widening to the tip
		const holk = P('M66 70 L92 76.5 Q94.5 79 92.6 81.6 L66.2 74.6 Z');
		fs(c, holk, lgrad(c, 0, 70, 0, 82, [[0, '#ffffff'], [1, '#d9d2c2']]), 2.2);
		fs(c, P('M66 70 L72.4 71.6 L72.6 76.2 L66.2 74.6 Z'), '#d9b27a', 1.6);
		c.strokeStyle = 'rgba(140,120,90,.55)';
		c.lineWidth = 0.9;
		c.beginPath();
		c.moveTo(76, 73);
		c.lineTo(88, 78.4);
		c.stroke();
		fs(c, ell(93.4, 79, 2, 3.2, 0.25), '#9a9590', 1.4);
	}

	/** The board: a dim den, a neon-edged rug with faint leaves, the HUD panel. */
	function board(c: Ctx, scale: number) {
		c.fillStyle = '#0c0512';
		c.fillRect(0, 0, L, L);
		c.strokeStyle = 'rgba(255,255,255,.025)';
		c.lineWidth = 6;
		for (let i = -L; i < L * 2; i += 26) {
			c.beginPath();
			c.moveTo(i, 0);
			c.lineTo(i - L, L);
			c.stroke();
		}
		// HUD panel
		const hud = rr(12, 8, L - 24, HUD_H - 10, 14);
		fs(c, hud, lgrad(c, 0, 8, 0, HUD_H, [[0, '#26123a'], [1, '#140920']]), 2.5, '#41285e');
		// the board frame: neon green tube + pink inner line
		const frame = rr(X0 - 9, Y0 - 9, B + 18, B + 18, 16);
		c.fillStyle = '#140a20';
		c.fill(frame);
		// rug cells
		for (let y = 0; y < GRID; y++)
			for (let x = 0; x < GRID; x++) {
				c.fillStyle = (x + y) % 2 ? '#1c1230' : '#22163a';
				c.fillRect(X0 + x * C, Y0 + y * C, C, C);
			}
		// faint leaves woven into the rug
		c.save();
		c.beginPath();
		c.rect(X0, Y0, B, B);
		c.clip();
		for (const [x, y, s, r] of [
			[X0 + B * 0.22, Y0 + B * 0.3, 7, -0.4],
			[X0 + B * 0.78, Y0 + B * 0.24, 5.6, 0.5],
			[X0 + B * 0.5, Y0 + B * 0.62, 9, 0.1],
			[X0 + B * 0.16, Y0 + B * 0.86, 5, 0.7],
			[X0 + B * 0.86, Y0 + B * 0.84, 6, -0.6]
		]) {
			c.save();
			c.translate(x, y);
			c.rotate(r);
			c.scale(s, s);
			c.translate(-12, -14);
			c.fillStyle = 'rgba(110,255,120,.045)';
			for (const d of LEAF_PATHS) c.fill(P(d));
			c.restore();
		}
		c.fillStyle = rgrad(c, X0 + B / 2, Y0 + B / 2, B * 0.75, [[0, 'rgba(120,80,200,.10)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']]);
		c.fillRect(X0, Y0, B, B);
		c.restore();
		c.strokeStyle = 'rgba(0,0,0,.18)';
		c.lineWidth = 1;
		for (let i = 1; i < GRID; i++) {
			c.beginPath();
			c.moveTo(X0 + i * C, Y0);
			c.lineTo(X0 + i * C, Y0 + B);
			c.moveTo(X0, Y0 + i * C);
			c.lineTo(X0 + B, Y0 + i * C);
			c.stroke();
		}
		c.shadowColor = '#5dff6a';
		c.shadowBlur = 16 * scale;
		c.lineWidth = 4.5;
		c.strokeStyle = '#5dff6a';
		c.stroke(frame);
		c.stroke(frame);
		c.shadowBlur = 0;
		c.lineWidth = 1.6;
		c.strokeStyle = 'rgba(230,255,220,.9)';
		c.stroke(frame);
		c.strokeStyle = 'rgba(255,79,163,.7)';
		c.lineWidth = 2;
		c.stroke(rr(X0 - 2, Y0 - 2, B + 4, B + 4, 10));
		for (const [x, y] of [
			[X0 - 2, Y0 - 2],
			[X0 + B + 2, Y0 - 2],
			[X0 - 2, Y0 + B + 2],
			[X0 + B + 2, Y0 + B + 2]
		]) {
			fs(c, ell(x, y, 5, 5), rgrad(c, x - 1.5, y - 1.5, 6, [[0, '#ffffff'], [1, '#7e8596']]), 1.6);
		}
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { SnakeGame, stepMs, paceLevel, type Cell, type Dir } from '#lib/arcade/snake.ts';
	import w from '#lib/i18n/arcade/snake.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	/** the on-screen pad steers through this (set while the game runs) */
	const pad: { steer: (d: Dir) => void } = { steer: () => {} };

	$effect(() => {
		if (!root || !canvas) return;
		return run(
			root,
			canvas,
			untrack(() => seed),
			untrack(() => onend)
		);
	});

	interface Bit {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		max: number;
		r: number;
		color: string;
		kind: 'dot' | 'star' | 'wisp';
		rot: number;
	}
	interface Float {
		text: string;
		x: number;
		y: number;
		t0: number;
		size: number;
		color: string;
	}

	const FOOD_COLORS: Record<Munchie, string[]> = {
		burger: ['#e8a046', '#4fb23a', '#ffc928', '#6b3a1c'],
		fries: ['#ffd23a', '#e2261f'],
		donut: ['#ff6fb5', '#5dd3ff', '#fff6b0', '#d98f45'],
		pizza: ['#ffd23a', '#c8302a', '#e8963a'],
		taco: ['#f6bd3c', '#5cc23e', '#e2261f', '#7a3e1a']
	};

	function run(el: HTMLDivElement, cv: HTMLCanvasElement, seed0: number, end: ArcadeGameProps['onend']): () => void {
		const ctx = cv.getContext('2d')!;
		const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		const game = new SnakeGame(seed0);
		const px = (x: number) => X0 + (x + 0.5) * C;
		const py = (y: number) => Y0 + (y + 0.5) * C;

		let scale = 1;
		let art: { board: HTMLCanvasElement; head: HTMLCanvasElement; puffs: HTMLCanvasElement[]; cone: HTMLCanvasElement; food: Record<Munchie | 'gold', HTMLCanvasElement> } | null = null;

		let time = 0;
		let acc = 0;
		let paused = false;
		let done = false;
		let over = false;
		let overAt = 0;
		let prev: Cell[] = game.body.map((c) => ({ ...c }));
		let facing: 1 | -1 = 1;
		let chompAt = -9;
		let foodAt = 0;
		let goldAt = -9;
		let flashAt = -9;
		let flashColor = '#ffd23a';
		let shakeAt = -9;
		let shakeAmp = 0;
		let banner: { text: string; at: number; color: string } | null = { text: w.go, at: 0, color: '#7dff6a' };
		let nextWisp = 0;
		let blinkAt = 2.4;
		const coneAt = new Map<string, number>();
		const bits: Bit[] = [];
		const floats: Float[] = [];

		function burst(x: number, y: number, colors: string[], count: number, speed = 180) {
			const k = reduce ? Math.ceil(count / 2) : count;
			for (let i = 0; i < k; i++) {
				const a = Math.random() * Math.PI * 2;
				const v = speed * (0.4 + Math.random() * 0.8);
				bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: 0.45 + Math.random() * 0.35, r: 2.2 + Math.random() * 2.6, color: colors[i % colors.length], kind: 'dot', rot: 0 });
			}
		}
		function stars(x: number, y: number, count: number) {
			const k = reduce ? Math.ceil(count / 2) : count;
			for (let i = 0; i < k; i++) {
				const a = (i / k) * Math.PI * 2 + Math.random() * 0.4;
				const v = 120 + Math.random() * 160;
				bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.6 + Math.random() * 0.4, r: 6 + Math.random() * 6, color: i % 2 ? '#fff6b0' : '#ffd23a', kind: 'star', rot: Math.random() * 3 });
			}
		}
		function wisp(x: number, y: number, big = false) {
			bits.push({ x, y, vx: (Math.random() - 0.5) * 18, vy: -30 - Math.random() * 30, life: 0, max: big ? 1.1 : 0.9 + Math.random() * 0.5, r: big ? 9 + Math.random() * 6 : 4 + Math.random() * 3, color: '#ffffff', kind: 'wisp', rot: Math.random() * 6 });
		}
		function float(text: string, x: number, y: number, size: number, color: string) {
			floats.push({ text, x, y, t0: time, size, color });
		}
		function shake(a: number) {
			if (reduce) return;
			shakeAt = time;
			shakeAmp = a;
		}

		function tick() {
			prev = game.body.map((c) => ({ ...c }));
			const ev = game.step();
			if (ev.died) {
				over = true;
				overAt = time;
				prev = game.body.map((c) => ({ ...c }));
				const h = game.head;
				burst(px(h.x), py(h.y), ['#ffffff', '#e7e2f4', '#a59bc6'], 18, 260);
				for (let i = 0; i < (reduce ? 4 : 10); i++) wisp(px(h.x) + (Math.random() - 0.5) * 30, py(h.y) + (Math.random() - 0.5) * 30, true);
				flashAt = time;
				flashColor = '#ff3a2a';
				shake(12);
				banner = { text: w.busted, at: time, color: '#ff5a4a' };
				sound.play('clack');
				return;
			}
			const h = game.head;
			const ph = prev[0];
			if (h.x > ph.x) facing = 1;
			else if (h.x < ph.x) facing = -1;
			if (ev.ate) {
				chompAt = time;
				foodAt = time;
				burst(px(h.x), py(h.y), FOOD_COLORS[ev.ate], 14);
				float(`+${ev.points}`, px(h.x), py(h.y) - 26, 30, '#ffffff');
				sound.play('camo');
			}
			if (ev.paceUp) {
				banner = { text: w.paceUp, at: time, color: '#5dd3ff' };
				sound.play('clack');
			}
			if (ev.gold) {
				chompAt = time;
				stars(px(h.x), py(h.y), 16);
				burst(px(h.x), py(h.y), ['#ffd23a', '#fff6b0', '#ff9a1a'], 14, 240);
				float(`+50`, px(h.x), py(h.y) - 30, 40, '#ffd23a');
				flashAt = time;
				flashColor = '#ffd23a';
				banner = { text: w.golden, at: time, color: '#ffd23a' };
				shake(5);
				sound.play('maxed');
			}
			if (ev.goldSpawned) goldAt = time;
			if (ev.cone) coneAt.set(`${ev.cone.x},${ev.cone.y}`, time);
		}

		function finish() {
			if (done) return;
			done = true;
			cancelAnimationFrame(raf);
			end(Math.max(0, Math.round(game.score)));
		}

		function update(dt: number) {
			time += dt;
			if (!over) {
				acc += dt * 1000;
				let ms = stepMs(game.eaten);
				while (acc >= ms && !over) {
					acc -= ms;
					tick();
					ms = stepMs(game.eaten);
				}
			} else if (time - overAt >= 1.05) finish();
			// smoke curling off the holk's ember
			if (!over && time >= nextWisp) {
				nextWisp = time + (reduce ? 0.3 : 0.13);
				const e = ember();
				wisp(e.x, e.y);
			}
			if (time >= blinkAt + 0.14) blinkAt = time + 2 + Math.random() * 2.5;
			for (let i = bits.length - 1; i >= 0; i--) {
				const b = bits[i];
				b.life += dt;
				if (b.kind === 'dot') b.vy += 700 * dt;
				else if (b.kind === 'star') {
					b.vx *= 1 - 2.4 * dt;
					b.vy *= 1 - 2.4 * dt;
				} else b.vx += Math.sin(time * 3 + b.rot) * 10 * dt;
				b.x += b.vx * dt;
				b.y += b.vy * dt;
				b.rot += dt * 2;
				if (b.life >= b.max) bits.splice(i, 1);
			}
			for (let i = floats.length - 1; i >= 0; i--) if (time - floats[i].t0 > 1) floats.splice(i, 1);
		}

		/** where each part of the snake is drawn right now (gliding between cells) */
		function positions(): { x: number; y: number }[] {
			const t = over ? 1 : Math.min(1, acc / stepMs(game.eaten));
			const out: { x: number; y: number }[] = [];
			for (let i = 0; i < game.body.length; i++) {
				const a = prev[i] ?? prev[prev.length - 1];
				const b = game.body[i];
				out.push({ x: px(a.x + (b.x - a.x) * t), y: py(a.y + (b.y - a.y) * t) });
			}
			if (over) {
				// bump a little into what he hit
				const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[game.dir];
				const k = Math.min(1, (time - overAt) / 0.08);
				const back = Math.max(0, (time - overAt - 0.08) / 0.25);
				const amt = 0.38 * k * Math.max(0, 1 - back * 0.6);
				out[0] = { x: out[0].x + dx * C * amt, y: out[0].y + dy * C * amt };
			}
			return out;
		}
		const HEAD = 98;
		/** this frame's snake positions (render() fills it) */
		let pos: { x: number; y: number }[] = [];
		function headPose() {
			const p = pos[0] ?? positions()[0];
			const k = time - chompAt;
			const chomp = k < 0.25 && !reduce ? 1 + 0.22 * Math.sin((k / 0.25) * Math.PI) : 1;
			const bob = reduce ? 0 : Math.sin(time * 6) * 1.2;
			const tilt = game.dir === 'up' ? -0.16 * facing : game.dir === 'down' ? 0.16 * facing : 0;
			return { x: p.x, y: p.y + bob, chomp, tilt };
		}
		function ember() {
			const hp = headPose();
			const s = (HEAD / 100) * hp.chomp;
			const lx = (93.6 - 50) * s * facing;
			const ly = (79 - 50) * s;
			const c = Math.cos(hp.tilt);
			const sn = Math.sin(hp.tilt);
			return { x: hp.x + lx * c - ly * sn, y: hp.y + lx * sn + ly * c };
		}

		function text(s: string, x: number, y: number, size: number, fill: string, align: CanvasTextAlign = 'left') {
			ctx.font = `800 ${size}px ${FONT}`;
			ctx.textAlign = align;
			ctx.textBaseline = 'middle';
			ctx.lineJoin = 'round';
			ctx.lineWidth = Math.max(3, size * 0.2);
			ctx.strokeStyle = O;
			ctx.strokeText(s, x, y);
			ctx.fillStyle = fill;
			ctx.fillText(s, x, y);
		}

		function sprite(img: HTMLCanvasElement, x: number, y: number, size: number, rot = 0, sx = 1, sy = 1) {
			const c = Math.cos(rot) * scale;
			const s = Math.sin(rot) * scale;
			ctx.setTransform(c * sx, s * sx, -s * sy, c * sy, x * scale + shakeX * scale, y * scale + shakeY * scale);
			ctx.drawImage(img, -size / 2, -size / 2, size, size);
		}
		let shakeX = 0;
		let shakeY = 0;

		function drawSnake() {
			if (!art) return;
			const n = pos.length;
			const fade = over ? Math.max(0, 1 - (time - overAt) / 1) : 1;
			// smoke, tail first, with a smaller puff between each pair so it reads as one trail
			for (let i = n - 1; i >= 1; i--) {
				const p = pos[i];
				const q = pos[i - 1];
				const taper = 1 - 0.42 * (i / Math.max(n, 6));
				const wob = reduce ? 0 : Math.sin(time * 3.2 + i * 0.9) * 0.06;
				const spin = reduce ? 0 : time * 0.6 + i * 1.7;
				ctx.globalAlpha = fade * (0.6 + 0.4 * taper);
				const size = C * 1.62 * (taper + wob);
				sprite(art.puffs[i % 3], p.x, p.y, size, spin);
				sprite(art.puffs[(i + 1) % 3], (p.x + q.x) / 2, (p.y + q.y) / 2, size * 0.9, -spin * 0.8);
			}
			ctx.globalAlpha = 1;
			// the head
			const hp = headPose();
			const size = HEAD * hp.chomp;
			const shakeHead = over && !reduce ? Math.sin(time * 70) * 2 * Math.max(0, 1 - (time - overAt) * 2) : 0;
			sprite(art.head, hp.x + shakeHead, hp.y, size, hp.tilt, facing, 1);
			// eyes on top (look where he's going, blink now and then)
			const s = size / 100;
			const look = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[game.dir];
			const closed = time >= blinkAt && time < blinkAt + 0.14;
			for (const ex of [44, 61]) {
				const c = Math.cos(hp.tilt) * scale;
				const sn = Math.sin(hp.tilt) * scale;
				ctx.setTransform(c * facing, sn * facing, -sn, c, (hp.x + shakeHead + shakeX) * scale, (hp.y + shakeY) * scale);
				const x = (ex - 50) * s;
				const y = (55 - 50) * s;
				const rx = 7.4 * s;
				const ry = 7 * s;
				ctx.fillStyle = '#ffe1e1';
				ctx.beginPath();
				ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = 'rgba(220,40,50,.75)';
				ctx.lineWidth = 0.9 * s;
				ctx.beginPath();
				ctx.moveTo(x - rx * 0.9, y + 1 * s);
				ctx.lineTo(x - rx * 0.4, y + 0.4 * s);
				ctx.moveTo(x + rx * 0.9, y + 1.6 * s);
				ctx.lineTo(x + rx * 0.45, y + 0.8 * s);
				ctx.stroke();
				const lx = (game.dir === 'left' ? 1 : game.dir === 'right' ? 1 : 0) * 2.2 * s;
				const ly = look[1] * 2 * s;
				ctx.fillStyle = '#d0202a';
				ctx.beginPath();
				ctx.arc(x + lx, y + 1 * s + ly, 3.8 * s, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#1a0606';
				ctx.beginPath();
				ctx.arc(x + lx, y + 1 * s + ly, 1.9 * s, 0, Math.PI * 2);
				ctx.fill();
				// heavy lids (stoned), shut when blinking or busted
				const lid = closed || over ? 1 : 0.48;
				const ly0 = y - ry + ry * 2 * lid;
				ctx.save();
				ctx.beginPath();
				ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
				ctx.clip();
				ctx.fillStyle = '#4fae36';
				ctx.beginPath();
				ctx.moveTo(x - rx - 1, y - ry - 1);
				ctx.lineTo(x + rx + 1, y - ry - 1);
				ctx.lineTo(x + rx + 1, ly0);
				ctx.quadraticCurveTo(x, ly0 + 2.4 * s, x - rx - 1, ly0);
				ctx.closePath();
				ctx.fill();
				ctx.restore();
				ctx.strokeStyle = O;
				ctx.lineWidth = 1.7 * s;
				ctx.beginPath();
				ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(x - rx, ly0);
				ctx.quadraticCurveTo(x, ly0 + 2.4 * s, x + rx, ly0);
				ctx.stroke();
			}
			// the ember's glow
			if (!over) {
				const e = ember();
				const pulse = 0.75 + 0.25 * Math.sin(time * 9);
				ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
				const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 10 * pulse);
				g.addColorStop(0, 'rgba(255,200,80,.95)');
				g.addColorStop(0.4, 'rgba(255,90,20,.7)');
				g.addColorStop(1, 'rgba(255,60,0,0)');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.arc(e.x, e.y, 10 * pulse, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#ff8a1a';
				ctx.beginPath();
				ctx.arc(e.x, e.y, 2.4, 0, Math.PI * 2);
				ctx.fill();
			}
		}

		function drawItems() {
			if (!art) return;
			// cones (they drop in)
			for (const k of game.cones) {
				const at = coneAt.get(`${k.x},${k.y}`) ?? -9;
				const t = (time - at) / 0.4;
				const x = px(k.x);
				const y = py(k.y);
				if (t < 1) {
					ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
					ctx.strokeStyle = `rgba(255,90,40,${0.8 * (1 - t)})`;
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.arc(x, y + 6, C * 0.5 * (1 + t * 0.6), 0, Math.PI * 2);
					ctx.stroke();
				}
				const drop = t < 1 ? (reduce ? 0 : -90 * (1 - t) * (1 - t)) : 0;
				const squash = t >= 1 && t < 1.6 && !reduce ? 1 - 0.12 * Math.sin(((t - 1) / 0.6) * Math.PI) : 1;
				sprite(art.cone, x, y - 4 + drop, C * 1.3, 0, 1 / squash, squash);
			}
			// the munchie: pops in, bobs, a soft glow under it
			const f = game.food;
			const fx = px(f.cell.x);
			const fy = py(f.cell.y);
			const pk = (time - foodAt) / 0.3;
			const pop = pk < 1 ? (reduce ? 1 : Math.sin(pk * Math.PI * 0.75) * 1.25) : 1;
			const bob = reduce ? 0 : Math.sin(time * 4) * 2.4;
			ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
			ctx.fillStyle = 'rgba(0,0,0,.35)';
			ctx.beginPath();
			ctx.ellipse(fx, fy + C * 0.42, C * 0.42 * pop, C * 0.12 * pop, 0, 0, Math.PI * 2);
			ctx.fill();
			const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, C * 0.95);
			glow.addColorStop(0, 'rgba(255,220,120,.28)');
			glow.addColorStop(1, 'rgba(255,220,120,0)');
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.arc(fx, fy, C * 0.95, 0, Math.PI * 2);
			ctx.fill();
			sprite(art.food[f.kind], fx, fy - 3 + bob, C * 1.55 * Math.max(0.01, pop), reduce ? 0 : Math.sin(time * 2.2) * 0.08);
			// the golden burger: glows, a timer ring, blinks before it's gone
			const g = game.gold;
			if (g) {
				const gx = px(g.cell.x);
				const gy = py(g.cell.y);
				const total = g.until - g.at;
				const left = Math.max(0, (g.until - game.steps - acc / stepMs(game.eaten)) / total);
				const leftMs = left * total * stepMs(game.eaten);
				const visible = leftMs > 1500 || Math.floor(time * 8) % 2 === 0;
				const gp = Math.min(1, (time - goldAt) / 0.35);
				ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
				const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, C * 1.3);
				gl.addColorStop(0, 'rgba(255,214,58,.75)');
				gl.addColorStop(1, 'rgba(255,214,58,0)');
				ctx.fillStyle = gl;
				ctx.beginPath();
				ctx.arc(gx, gy, C * 1.3, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = 'rgba(20,6,30,.6)';
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.arc(gx, gy, C * 0.82, 0, Math.PI * 2);
				ctx.stroke();
				ctx.strokeStyle = left < 0.3 ? '#ff5a4a' : '#ffd23a';
				ctx.lineWidth = 3.2;
				ctx.beginPath();
				ctx.arc(gx, gy, C * 0.82, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
				ctx.stroke();
				if (visible) sprite(art.food.gold, gx, gy - 3 + bob, C * 1.85 * Math.max(0.01, gp), reduce ? 0 : Math.sin(time * 3) * 0.1);
				if (!reduce)
					for (let i = 0; i < 3; i++) {
						const a = time * 2.4 + (i * Math.PI * 2) / 3;
						const sx = gx + Math.cos(a) * C * 0.9;
						const sy = gy + Math.sin(a) * C * 0.9;
						ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
						star(sx, sy, 4.5 + Math.sin(time * 8 + i) * 1.5, '#fff6b0');
					}
			}
		}

		function star(x: number, y: number, k: number, color: string) {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.moveTo(x, y - k);
			ctx.quadraticCurveTo(x, y, x + k, y);
			ctx.quadraticCurveTo(x, y, x, y + k);
			ctx.quadraticCurveTo(x, y, x - k, y);
			ctx.quadraticCurveTo(x, y, x, y - k);
			ctx.fill();
		}

		function drawFx() {
			if (!art) return;
			for (const b of bits) {
				const a = Math.max(0, 1 - b.life / b.max);
				if (b.kind === 'wisp') {
					ctx.globalAlpha = a * 0.55;
					sprite(art.puffs[Math.floor(b.rot) % 3], b.x, b.y, b.r * 2.6 * (1 + b.life * 0.9), b.rot);
					continue;
				}
				ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
				ctx.globalAlpha = a;
				if (b.kind === 'star') star(b.x, b.y, b.r * (0.5 + 0.5 * a), b.color);
				else {
					ctx.fillStyle = b.color;
					ctx.strokeStyle = O;
					ctx.lineWidth = 1.2;
					ctx.beginPath();
					ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
				}
			}
			ctx.globalAlpha = 1;
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			for (const f of floats) {
				const k = (time - f.t0) / 1;
				const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.55 : k < 0.3 ? 1.15 - ((k - 0.15) / 0.15) * 0.15 : 1;
				ctx.globalAlpha = k > 0.65 ? Math.max(0, 1 - (k - 0.65) / 0.35) : 1;
				text(f.text, Math.max(X0 + 30, Math.min(X0 + B - 30, f.x)), Math.max(Y0 + 20, f.y - k * 40), f.size * pop, f.color, 'center');
			}
			ctx.globalAlpha = 1;
		}

		function drawHud() {
			if (!art) return;
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			text(w.score, 34, 24, 16, '#7dff6a');
			text(String(game.score), 34, 49, 30, '#fff6e0');
			// munchies eaten
			ctx.drawImage(art.food.burger, L / 2 - 52, 14, 40, 40);
			text(`×${game.eaten}`, L / 2 - 6, 36, 30, '#fff6e0');
			text(w.pace, L - 34, 24, 16, '#7dff6a', 'right');
			const lvl = paceLevel(game.eaten);
			text(String(lvl), L - 34, 49, 30, '#fff6e0', 'right');
			ctx.font = `800 30px ${FONT}`;
			const tw = ctx.measureText(String(lvl)).width;
			for (let i = 0; i < 5; i++) {
				const x = L - 44 - tw - i * 11;
				ctx.fillStyle = i < lvl ? '#5dd3ff' : '#2a3a52';
				ctx.strokeStyle = O;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x - 8, 40);
				ctx.lineTo(x - 2, 49);
				ctx.lineTo(x - 8, 58);
				ctx.lineTo(x - 13, 58);
				ctx.lineTo(x - 7, 49);
				ctx.lineTo(x - 13, 40);
				ctx.closePath();
				ctx.stroke();
				ctx.fill();
			}
			// flash over the board
			const fk = (time - flashAt) / 0.4;
			if (fk < 1) {
				ctx.globalAlpha = (1 - fk) * 0.35;
				ctx.fillStyle = flashColor;
				ctx.fillRect(X0, Y0, B, B);
				ctx.globalAlpha = 1;
			}
			if (banner) {
				const k = (time - banner.at) / 1.1;
				if (k >= 1) banner = null;
				else {
					const pop = k < 0.12 ? 0.4 + (k / 0.12) * 0.8 : k < 0.24 ? 1.2 - ((k - 0.12) / 0.12) * 0.2 : 1;
					ctx.globalAlpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
					ctx.setTransform(scale * pop, 0, 0, scale * pop, (L / 2) * scale, (Y0 + B * 0.42) * scale);
					ctx.rotate(-0.05);
					text(banner.text, 0, 0, 64, banner.color, 'center');
					ctx.globalAlpha = 1;
					ctx.setTransform(scale, 0, 0, scale, 0, 0);
				}
			}
			if (paused) {
				ctx.fillStyle = 'rgba(10,3,16,.76)';
				ctx.fillRect(0, 0, L, L);
				text(w.paused, L / 2, L / 2 - 22, 56, '#fff6e0', 'center');
				text(w.resume, L / 2, L / 2 + 30, 24, '#7dff6a', 'center');
			}
		}

		function render() {
			if (!art) return;
			const sk = time - shakeAt;
			if (sk < 0.3) {
				const a = shakeAmp * (1 - sk / 0.3);
				shakeX = Math.sin(time * 91) * a;
				shakeY = Math.cos(time * 77) * a * 0.6;
			} else shakeX = shakeY = 0;
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			ctx.drawImage(art.board, 0, 0, L, L);
			pos = positions();
			drawItems();
			drawSnake();
			drawFx();
			drawHud();
		}

		function resize() {
			const cssW = cv.clientWidth;
			if (!cssW) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const p = Math.round(cssW * dpr);
			if (p === cv.width && art) return;
			cv.width = p;
			cv.height = p;
			scale = p / L;
			const mk = (wd: number, ht: number, draw: (c: Ctx) => void) => {
				const [c2, x] = canvasOf(wd, ht, scale);
				draw(x);
				return c2;
			};
			const box = (draw: (c: Ctx) => void) => mk(64, 64, draw);
			art = {
				board: mk(L, L, (c) => board(c, scale)),
				head: mk(100, 100, head),
				puffs: [0, 1, 2].map((v) => box((c) => puff(c, v))),
				cone: box(cone),
				food: {
					burger: box((c) => burger(c, false)),
					gold: box((c) => burger(c, true)),
					fries: box(fries),
					donut: box(donut),
					pizza: box(pizza),
					taco: box(taco)
				}
			};
			render();
		}

		let raf = 0;
		let last = performance.now();
		function frame(now: number) {
			const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
			last = now;
			if (!paused && !done) update(dt);
			if (!done) {
				render();
				raf = requestAnimationFrame(frame);
			}
		}

		function resume() {
			paused = false;
			last = performance.now();
		}
		function turn(d: Dir) {
			if (done || over) return;
			if (paused) {
				resume();
				return;
			}
			game.turn(d);
		}
		pad.steer = turn;
		const KEYS: Record<string, Dir> = {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right',
			w: 'up',
			s: 'down',
			a: 'left',
			d: 'right',
			W: 'up',
			S: 'down',
			A: 'left',
			D: 'right'
		};
		const editable = (t: EventTarget | null) =>
			t instanceof HTMLElement && t !== el && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
		function onKey(e: KeyboardEvent) {
			if (done || editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
			const d = KEYS[e.key];
			if (d && e.key.startsWith('Arrow')) e.preventDefault();
			if (paused) {
				if (!e.repeat) resume();
				return;
			}
			if (d) game.turn(d);
		}
		// swipes on the board
		let sw: { x: number; y: number; id: number } | null = null;
		function onDown(e: PointerEvent) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			el.focus({ preventScroll: true });
			if (paused) {
				resume();
				return;
			}
			sw = { x: e.clientX, y: e.clientY, id: e.pointerId };
			try {
				cv.setPointerCapture(e.pointerId);
			} catch {
				/* synthetic events have no capture */
			}
		}
		function onMove(e: PointerEvent) {
			if (!sw || e.pointerId !== sw.id) return;
			const dx = e.clientX - sw.x;
			const dy = e.clientY - sw.y;
			if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
			turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
			sw = { x: e.clientX, y: e.clientY, id: e.pointerId };
		}
		function onUp() {
			sw = null;
		}
		function onVis() {
			if (document.hidden && !done) paused = true;
		}

		const ro = new ResizeObserver(resize);
		ro.observe(cv);
		resize();
		cv.addEventListener('pointerdown', onDown);
		cv.addEventListener('pointermove', onMove);
		cv.addEventListener('pointerup', onUp);
		cv.addEventListener('pointercancel', onUp);
		window.addEventListener('keydown', onKey);
		document.addEventListener('visibilitychange', onVis);
		el.focus({ preventScroll: true });
		raf = requestAnimationFrame(frame);

		if (import.meta.env.DEV) {
			// test bench only: lets check scripts see the board
			(window as unknown as Record<string, unknown>).__snakeDbg = () => ({
				head: game.head,
				dir: game.dir,
				food: game.food.cell,
				gold: game.gold?.cell ?? null,
				cones: game.cones,
				body: game.body,
				eaten: game.eaten,
				score: game.score,
				steps: game.steps,
				over
			});
		}

		return () => {
			done = true;
			pad.steer = () => {};
			cancelAnimationFrame(raf);
			ro.disconnect();
			cv.removeEventListener('pointerdown', onDown);
			cv.removeEventListener('pointermove', onMove);
			cv.removeEventListener('pointerup', onUp);
			cv.removeEventListener('pointercancel', onUp);
			window.removeEventListener('keydown', onKey);
			document.removeEventListener('visibilitychange', onVis);
		};
	}

	function press(e: PointerEvent, d: Dir) {
		e.preventDefault();
		pad.steer(d);
	}
	const PAD: { d: Dir; area: string; rot: number }[] = [
		{ d: 'up', area: 'u', rot: 0 },
		{ d: 'left', area: 'l', rot: -90 },
		{ d: 'right', area: 'r', rot: 90 },
		{ d: 'down', area: 'd', rot: 180 }
	];
</script>

<!-- the game takes the keyboard itself (arrows / WASD), so its area is focusable -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="msnake" bind:this={root} tabindex="0" role="application" aria-label={w.aria}>
	<div class="screen">
		<canvas bind:this={canvas}></canvas>
	</div>
	<div class="pad" role="group" aria-label={w.pad}>
		{#each PAD as b (b.d)}
			<button type="button" class="pad-btn" style:grid-area={b.area} aria-label={w[b.d]} onpointerdown={(e) => press(e, b.d)} onclick={() => pad.steer(b.d)}>
				<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" style:transform="rotate({b.rot}deg)">
					<path d="M12 4 L20 15 H15 V20 H9 V15 H4 Z" fill="#7dff6a" stroke="#1a0630" stroke-width="2" stroke-linejoin="round" />
				</svg>
			</button>
		{/each}
		<span class="pad-hub" aria-hidden="true"></span>
	</div>
</div>

<style>
	.msnake {
		--pad: 170px;
		width: min(100%, min(72vh, 640px));
		margin-inline: auto;
		display: grid;
		gap: 10px;
		justify-items: center;
		outline: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.screen {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 14px;
		overflow: hidden;
		background: #0c0512;
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.6),
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.msnake:focus-visible .screen {
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.6),
			0 0 0 3px #7dff6a;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
	.screen::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		background:
			repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.03) 0 1px, transparent 1px 3px),
			radial-gradient(120% 120% at 50% 50%, transparent 62%, rgb(0 0 0 / 0.5) 100%);
		box-shadow: inset 0 0 0 3px rgb(0 0 0 / 0.55), inset 0 0 24px rgb(0 0 0 / 0.5);
	}
	.pad {
		display: none;
		grid-template-areas: '. u .' 'l h r' '. d .';
		grid-template-columns: repeat(3, 52px);
		grid-template-rows: repeat(3, 52px);
		gap: 4px;
		touch-action: none;
	}
	.pad-btn {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 14px;
		border: 2px solid #1a0630;
		background: linear-gradient(180deg, #3a2156, #1d0f2e);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.14),
			0 0 0 2px rgb(125 255 106 / 0.35),
			0 4px 0 #0c0514;
		cursor: pointer;
		touch-action: none;
	}
	.pad-btn:active {
		transform: translateY(3px);
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.1),
			0 0 0 2px rgb(125 255 106 / 0.7),
			0 1px 0 #0c0514;
		background: linear-gradient(180deg, #4a2c6c, #26143a);
	}
	.pad-btn:focus-visible {
		outline: 3px solid #7dff6a;
		outline-offset: 2px;
	}
	.pad-hub {
		grid-area: h;
		place-self: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: radial-gradient(circle at 40% 35%, #5a3a7a, #1d0f2e);
		border: 2px solid #1a0630;
	}
	/* phones and other touch screens: the pad under the board, the board a bit smaller so both fit */
	@media (pointer: coarse), (max-width: 639px) {
		.msnake {
			width: min(100%, calc(min(72vh, 640px) - var(--pad)));
		}
		.pad {
			display: grid;
		}
	}
	/* a phone on its side: the pad beside the board */
	@media (pointer: coarse) and (orientation: landscape) and (max-height: 540px) {
		.msnake {
			grid-auto-flow: column;
			align-items: center;
			width: auto;
		}
		.screen {
			width: min(80vh, calc(100vw - 220px));
		}
	}
</style>
