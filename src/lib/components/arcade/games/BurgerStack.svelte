<!--
	Burger Stack (BurgiArcade, 2026-11-22): stack burger layers in a late-night diner. A bottom bun sits on
	a plate on the counter; each filling (order from the seed, arcade/stack.ts) slides left ↔ right above the
	stack and a tap / click / Space drops it. What hangs over is cut off and tumbles away; a perfect drop keeps
	the width (three in a row grow it back). Every 10 fillings a top bun lands (BURGER COMPLETE) and the next
	burger starts on a fresh bottom bun. The camera rises with the tower, past the diner's roof into the night
	sky. Missing the stack ends the run (a short wobble, then onend).
	Drawn on a 600×800 canvas: the diner (wall, neon sign, counter, plate) is pre-rendered once per size,
	every placed layer is cached as its own little picture, all our own cartoon drawings.
-->
<script lang="ts" module>
	import { THICK, type StackPiece, type DropResult } from '#lib/arcade/stack.ts';

	type Ctx = CanvasRenderingContext2D;
	/** The game's own units: the field is 600 × 800. */
	const LW = 600;
	const LH = 800;
	const O = '#140a06';
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
	/** Room around a layer's picture for outlines, frills and cheese drips. */
	const PADX = 14;
	const PADT = 16;
	const PADB = 30;

	/** A stable number in [0, 1) for a layer's decoration (deco) at grid step k (pure looks, not gameplay). */
	function h01(seed: number, k: number, salt = 0): number {
		let x = (seed ^ Math.imul(k | 0, 0x9e3779b1) ^ Math.imul(salt + 1, 0x85ebca77)) >>> 0;
		x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
		x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
		x ^= x >>> 16;
		return (x >>> 0) / 4294967296;
	}

	/** Each layer's top and bottom edge at local x (wavy for patty, lettuce, bacon, pickle). */
	function edgeTop(kind: StackPiece, x: number, d: number): number {
		switch (kind) {
			case 'patty':
				return 2.2 + 1.4 * Math.sin(x * 0.41 + d) + 0.9 * Math.sin(x * 0.17);
			case 'lettuce':
				return 3 + 2.2 * Math.sin(x * 0.33 + d) + 1.2 * Math.sin(x * 0.12 + 1);
			case 'bacon':
				return 2.5 + 3 * Math.sin(x * 0.055 + d);
			case 'pickle':
				return 4 - 4 * Math.abs(Math.sin((Math.PI * x) / 14));
			default:
				return 0;
		}
	}
	function edgeBot(kind: StackPiece, x: number, t: number, d: number): number {
		switch (kind) {
			case 'patty':
				return t - 1.2 - 1.2 * Math.sin(x * 0.33 + 2 + d);
			case 'lettuce':
				return t - 2 + 4.5 * Math.abs(Math.sin(x * 0.15 + d));
			case 'bacon':
				return t - 2.5 + 3 * Math.sin(x * 0.055 + d);
			case 'pickle':
				return t - 4 + 4 * Math.abs(Math.sin((Math.PI * x) / 14));
			default:
				return t;
		}
	}

	/** A layer's outline from a0 to b0 with round caps of radius r (the caps stay inside a0..b0). */
	function wavePath(kind: StackPiece, a0: number, b0: number, t: number, d: number, r0: number): Path2D {
		const r = Math.max(1, Math.min(r0, (b0 - a0) / 2 - 0.5));
		const x0 = a0 + r;
		const x1 = b0 - r;
		const k = r * 1.333;
		const p = new Path2D();
		p.moveTo(x0, edgeTop(kind, x0, d));
		for (let x = x0 + 3; x < x1; x += 3) p.lineTo(x, edgeTop(kind, x, d));
		const tr = edgeTop(kind, x1, d);
		const br = edgeBot(kind, x1, t, d);
		p.lineTo(x1, tr);
		p.bezierCurveTo(x1 + k, tr, x1 + k, br, x1, br);
		for (let x = x1 - 3; x > x0; x -= 3) p.lineTo(x, edgeBot(kind, x, t, d));
		const tl = edgeTop(kind, x0, d);
		const bl = edgeBot(kind, x0, t, d);
		p.lineTo(x0, bl);
		p.bezierCurveTo(x0 - k, bl, x0 - k, tl, x0, tl);
		p.closePath();
		return p;
	}

	/** Steps along a layer at a fixed local grid, so cut pieces keep their spots, seeds and drips. */
	function grid(a0: number, b0: number, step: number, f: (k: number, x: number) => void) {
		for (let k = Math.floor(a0 / step) - 1; k * step <= b0 + step; k++) f(k, k * step);
	}

	function vgrad(c: Ctx, y0: number, y1: number, stops: [number, string][]): CanvasGradient {
		const g = c.createLinearGradient(0, y0, 0, y1);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}

	/** Fill + clipped details + outline. */
	function shape(c: Ctx, p: Path2D, fill: string | CanvasGradient, details?: () => void, line = 3) {
		c.fillStyle = fill;
		c.fill(p);
		if (details) {
			c.save();
			c.clip(p);
			details();
			c.restore();
		}
		c.lineWidth = line;
		c.strokeStyle = O;
		c.stroke(p);
	}

	/** A whole piece from local a0 to b0, its top at y 0 and bottom at y t. */
	function drawPiece(c: Ctx, kind: StackPiece, a0: number, b0: number, t: number, deco: number) {
		const d = h01(deco, 0, 9) * 6;
		const w = b0 - a0;
		c.lineJoin = 'round';
		c.lineCap = 'round';
		if (kind === 'bunBottom') {
			const r1 = Math.min(7, w / 4);
			const r2 = Math.max(2, Math.min(18, w / 3, t - r1 - 1));
			const p = new Path2D();
			p.moveTo(a0 + r1, 0);
			p.lineTo(b0 - r1, 0);
			p.quadraticCurveTo(b0, 0, b0, r1);
			p.lineTo(b0, t - r2);
			p.quadraticCurveTo(b0, t, b0 - r2, t);
			p.lineTo(a0 + r2, t);
			p.quadraticCurveTo(a0, t, a0, t - r2);
			p.lineTo(a0, r1);
			p.quadraticCurveTo(a0, 0, a0 + r1, 0);
			p.closePath();
			shape(c, p, vgrad(c, 0, t, [[0, '#f9c56a'], [0.45, '#e8a046'], [1, '#a4531a']]), () => {
				c.fillStyle = '#fde4b4';
				c.fillRect(a0 - 4, -4, w + 8, 11);
				c.fillStyle = 'rgba(176,88,27,.5)';
				c.fillRect(a0 - 4, 7, w + 8, 2.5);
				c.fillStyle = 'rgba(255,236,190,.35)';
				c.beginPath();
				c.ellipse(a0 + w * 0.32, t * 0.52, w * 0.24, 4, 0, 0, Math.PI * 2);
				c.fill();
				c.fillStyle = 'rgba(70,24,4,.3)';
				c.fillRect(a0 - 4, t - 8, w + 8, 10);
				grid(a0, b0, 13, (k, x) => {
					c.fillStyle = 'rgba(214,150,80,.7)';
					c.beginPath();
					c.arc(x + h01(deco, k, 1) * 9, 2.5 + h01(deco, k, 2) * 3, 1.1, 0, Math.PI * 2);
					c.fill();
				});
			});
		} else if (kind === 'bunTop') {
			const p = new Path2D();
			p.moveTo(a0 + 6, t);
			p.quadraticCurveTo(a0, t, a0, t - 8);
			p.bezierCurveTo(a0, t * 0.22, a0 + w * 0.2, 0, a0 + w / 2, 0);
			p.bezierCurveTo(b0 - w * 0.2, 0, b0, t * 0.22, b0, t - 8);
			p.quadraticCurveTo(b0, t, b0 - 6, t);
			p.closePath();
			const g = c.createRadialGradient(a0 + w * 0.36, t * 0.22, 3, a0 + w * 0.45, t * 0.4, w * 0.62);
			g.addColorStop(0, '#ffe6ad');
			g.addColorStop(0.45, '#f2a64c');
			g.addColorStop(1, '#ad571b');
			shape(c, p, g, () => {
				c.fillStyle = 'rgba(96,40,8,.3)';
				c.fillRect(a0 - 4, t - 15, w + 8, 8);
				c.fillStyle = '#fde4b4';
				c.fillRect(a0 - 4, t - 7, w + 8, 9);
				c.strokeStyle = 'rgba(255,248,226,.6)';
				c.lineWidth = 5;
				c.beginPath();
				c.moveTo(a0 + w * 0.14, t * 0.5);
				c.quadraticCurveTo(a0 + w * 0.2, t * 0.14, a0 + w * 0.42, t * 0.1);
				c.stroke();
				const n = Math.max(3, Math.round(w / 24));
				for (let i = 0; i < n; i++) {
					const u = 0.08 + 0.84 * ((i + 0.2 + h01(deco, i, 3) * 0.6) / n);
					const x = a0 + w * u;
					const top = t * 0.04 + (t - 10) * Math.pow(1 - Math.sin(Math.PI * u), 1.6);
					const y = top + 6 + h01(deco, i, 4) * Math.max(4, t - 26 - top);
					c.save();
					c.translate(x, y);
					c.rotate((u - 0.5) * 1.3 + (h01(deco, i, 5) - 0.5));
					c.fillStyle = '#fff5da';
					c.strokeStyle = 'rgba(150,86,26,.7)';
					c.lineWidth = 1;
					c.beginPath();
					c.ellipse(0, 0, 4.4, 2.4, 0, 0, Math.PI * 2);
					c.fill();
					c.stroke();
					c.restore();
				}
			});
		} else if (kind === 'patty') {
			const p = wavePath(kind, a0, b0, t, d, 14);
			shape(c, p, vgrad(c, 0, t, [[0, '#a8622f'], [0.45, '#6e3a18'], [1, '#3a1a08']]), () => {
				c.fillStyle = 'rgba(255,190,140,.22)';
				c.fillRect(a0, 0, w, 8);
				grid(a0, b0, 15, (k, x) => {
					const px = x + h01(deco, k, 1) * 11;
					const py = 9 + h01(deco, k, 2) * (t - 18);
					c.fillStyle = 'rgba(28,9,2,.5)';
					c.beginPath();
					c.ellipse(px, py, 2 + h01(deco, k, 3) * 3, 1.6 + h01(deco, k, 4) * 1.6, 0, 0, Math.PI * 2);
					c.fill();
					if (h01(deco, k, 5) > 0.55) {
						c.fillStyle = 'rgba(255,214,170,.35)';
						c.beginPath();
						c.ellipse(px + 5, py - 3, 2.2, 1, 0, 0, Math.PI * 2);
						c.fill();
					}
				});
				c.fillStyle = 'rgba(20,5,0,.35)';
				c.fillRect(a0, t - 8, w, 10);
			});
		} else if (kind === 'cheese') {
			// slab, corner droops and drips in one shape: outline pass first, then the fill, so they merge
			const p = new Path2D();
			p.rect(a0, 0, w, t);
			const droop = (x: number, dir: 1 | -1) => {
				p.moveTo(x + dir * 1, t - 3);
				p.quadraticCurveTo(x - dir * 4, t + 6, x - dir * 2, t + 12);
				p.quadraticCurveTo(x + dir * 6, t + 8, x + dir * 14, t - 3);
				p.closePath();
			};
			droop(a0, 1);
			droop(b0, -1);
			const drips: [number, number, number][] = [];
			grid(a0, b0, 32, (k, x) => {
				const dx = x + 8 + h01(deco, k, 1) * 16;
				const dw = 7 + h01(deco, k, 2) * 5;
				if (dx - dw / 2 < a0 + 10 || dx + dw / 2 > b0 - 10 || h01(deco, k, 7) < 0.25) return;
				const len = 6 + h01(deco, k, 3) * 15;
				drips.push([dx, dw, len]);
				p.moveTo(dx - dw / 2, t - 3);
				p.lineTo(dx - dw / 2, t + len - dw / 2);
				p.arc(dx, t + len - dw / 2, dw / 2, Math.PI, 0, true);
				p.lineTo(dx + dw / 2, t - 3);
				p.closePath();
			});
			c.lineWidth = 6;
			c.strokeStyle = O;
			c.stroke(p);
			c.fillStyle = vgrad(c, 0, t + 22, [[0, '#ffe066'], [0.45, '#ffc928'], [1, '#e89a00']]);
			c.fill(p);
			c.save();
			c.clip(p);
			c.fillStyle = 'rgba(255,251,210,.85)';
			c.fillRect(a0, 2, w, 3.4);
			c.fillStyle = 'rgba(176,110,0,.25)';
			c.fillRect(a0, t - 4, w, 4);
			c.fillStyle = 'rgba(255,255,255,.7)';
			for (const [dx, dw, len] of drips) {
				c.beginPath();
				c.ellipse(dx - dw * 0.18, t + len - dw * 0.7, dw * 0.13, dw * 0.24, 0, 0, Math.PI * 2);
				c.fill();
			}
			c.restore();
		} else if (kind === 'lettuce') {
			const p = wavePath(kind, a0, b0, t, d, 9);
			shape(c, p, vgrad(c, 0, t + 5, [[0, '#aef06e'], [0.5, '#5cc23e'], [1, '#2a7a1f']]), () => {
				c.strokeStyle = 'rgba(214,255,170,.65)';
				c.lineWidth = 1.6;
				grid(a0, b0, 21, (k, x) => {
					const vx = x + h01(deco, k, 1) * 8;
					c.beginPath();
					c.moveTo(vx, t + 2);
					c.quadraticCurveTo(vx + 2, t * 0.5, vx + 7 + h01(deco, k, 2) * 4, 3);
					c.stroke();
				});
				c.strokeStyle = 'rgba(16,70,14,.35)';
				c.lineWidth = 2;
				grid(a0, b0, 21, (k, x) => {
					const vx = x + 12 + h01(deco, k, 3) * 6;
					c.beginPath();
					c.moveTo(vx, t);
					c.lineTo(vx - 3, t * 0.45);
					c.stroke();
				});
				c.strokeStyle = 'rgba(232,255,200,.7)';
				c.lineWidth = 2;
				c.beginPath();
				for (let x = a0; x <= b0; x += 3) c.lineTo(x, edgeTop(kind, x, d) + 2.6);
				c.stroke();
			});
		} else if (kind === 'tomato') {
			const p = wavePath(kind, a0, b0, t, d, 11);
			shape(c, p, vgrad(c, 0, t, [[0, '#ff6d55'], [0.5, '#e2261f'], [1, '#9a110b']]), () => {
				const band = new Path2D();
				band.roundRect(a0 + 5, 6, w - 10, t - 12, 5);
				c.fillStyle = 'rgba(255,146,118,.9)';
				c.fill(band);
				grid(a0, b0, 22, (k, x) => {
					const sx = x + 11;
					c.fillStyle = 'rgba(255,216,150,.95)';
					c.beginPath();
					c.ellipse(sx, t / 2, 5.6, 3.1, 0, 0, Math.PI * 2);
					c.fill();
					c.fillStyle = '#fff3b8';
					c.beginPath();
					c.arc(sx - 2, t / 2, 1, 0, Math.PI * 2);
					c.arc(sx + 2, t / 2 + 0.5, 1, 0, Math.PI * 2);
					c.fill();
				});
				c.strokeStyle = 'rgba(110,8,4,.6)';
				c.lineWidth = 2.2;
				grid(a0, b0, 66, (k, x) => {
					if (x - 4 <= a0 || x + 4 >= b0) return;
					c.beginPath();
					c.moveTo(x, 1);
					c.lineTo(x, t - 1);
					c.stroke();
				});
				c.fillStyle = 'rgba(255,255,255,.4)';
				c.fillRect(a0, 2.2, w, 2.6);
			});
		} else if (kind === 'onion') {
			const p = wavePath(kind, a0, b0, t, d, 9);
			shape(c, p, vgrad(c, 0, t, [[0, '#fdf7ff'], [0.5, '#e5d0f2'], [1, '#ad85cc']]), () => {
				c.strokeStyle = 'rgba(150,88,196,.75)';
				c.lineWidth = 1.8;
				for (const y of [6.5, 12]) {
					c.beginPath();
					c.moveTo(a0, y);
					c.lineTo(b0, y);
					c.stroke();
				}
				c.strokeStyle = 'rgba(164,108,200,.7)';
				c.lineWidth = 1.5;
				grid(a0, b0, 34, (k, x) => {
					const rx = x + 10 + h01(deco, k, 1) * 12;
					c.beginPath();
					c.ellipse(rx, 2, 8 + h01(deco, k, 2) * 4, 2.6, 0, 0, Math.PI * 2);
					c.stroke();
				});
				c.fillStyle = 'rgba(255,255,255,.55)';
				c.fillRect(a0, 2, w, 2);
			});
		} else if (kind === 'bacon') {
			const p = wavePath(kind, a0, b0, t, d, 6);
			shape(c, p, vgrad(c, 0, t, [[0, '#d64e38'], [0.5, '#a8281c'], [1, '#68120a']]), () => {
				for (const [y, wd, col] of [
					[7.5, 3.4, 'rgba(255,212,192,.95)'],
					[13.5, 2.4, 'rgba(255,190,170,.8)']
				] as [number, number, string][]) {
					c.strokeStyle = col;
					c.lineWidth = wd;
					c.beginPath();
					for (let x = a0; x <= b0; x += 3) c.lineTo(x, y + 3 * Math.sin(x * 0.055 + d));
					c.stroke();
				}
				grid(a0, b0, 17, (k, x) => {
					c.fillStyle = 'rgba(56,8,2,.5)';
					c.beginPath();
					const bx = x + h01(deco, k, 1) * 12;
					c.ellipse(bx, 4 + h01(deco, k, 2) * 12 + 3 * Math.sin(bx * 0.055 + d), 2.4, 1.2, 0.3, 0, Math.PI * 2);
					c.fill();
				});
			});
		} else {
			// pickle chips
			const p = wavePath(kind, a0, b0, t, d, 7);
			shape(c, p, vgrad(c, 0, t, [[0, '#93d652'], [0.5, '#4f9f2c'], [1, '#27621a']]), () => {
				c.fillStyle = 'rgba(222,248,160,.55)';
				c.fillRect(a0, 5.5, w, t - 11);
				grid(a0, b0, 14, (k, x) => {
					c.strokeStyle = 'rgba(20,60,10,.5)';
					c.lineWidth = 1.6;
					c.beginPath();
					c.moveTo(x, 3);
					c.lineTo(x, t - 3);
					c.stroke();
					c.fillStyle = '#f6ffd6';
					c.beginPath();
					c.ellipse(x + 4.5, t / 2, 1.5, 2.2, 0, 0, Math.PI * 2);
					c.ellipse(x + 9.5, t / 2, 1.5, 2.2, 0, 0, Math.PI * 2);
					c.fill();
				});
			});
		}
	}

	/** The colour a cut shows (the inside of the food). */
	const INSIDE: Record<StackPiece, string> = {
		patty: '#b8743f',
		cheese: '#fff1a6',
		lettuce: '#d2f7a8',
		tomato: '#ffb4a0',
		onion: '#fffaff',
		bacon: '#ffb8a4',
		pickle: '#daf2a6',
		bunBottom: '#fde4b4',
		bunTop: '#fde4b4'
	};
	/** Crumbs that fly when a layer lands. */
	const CRUMB: Record<StackPiece, string> = {
		patty: '#6b3a1c',
		cheese: '#ffd23a',
		lettuce: '#5cc23e',
		tomato: '#ff4a36',
		onion: '#efe0f8',
		bacon: '#d24a36',
		pickle: '#79c043',
		bunBottom: '#f0a24a',
		bunTop: '#f6b955'
	};

	interface LayerLook {
		kind: StackPiece;
		/** the full piece's ends (rounded) and the part that's there (a cut end is square) */
		a0: number;
		b0: number;
		a: number;
		b: number;
		t: number;
		deco: number;
	}

	/** A layer, clipped to the part that's left, with a clean cut face where it was cut. */
	function drawLayer(c: Ctx, L: LayerLook) {
		const d = h01(L.deco, 0, 9) * 6;
		const cutL = L.a > L.a0 + 0.5;
		const cutR = L.b < L.b0 - 0.5;
		c.save();
		c.beginPath();
		const l = cutL ? L.a : L.a - PADX;
		const r = cutR ? L.b : L.b + PADX;
		c.rect(l, -PADT, r - l, L.t + PADT + PADB);
		c.clip();
		drawPiece(c, L.kind, L.a0, L.b0, L.t, L.deco);
		c.restore();
		for (const [cut, x, side] of [
			[cutL, L.a, 1],
			[cutR, L.b, -1]
		] as [boolean, number, number][]) {
			if (!cut) continue;
			const y0 = edgeTop(L.kind, x, d) + 1.5;
			const y1 = edgeBot(L.kind, x, L.t, d) - 1.5;
			c.fillStyle = INSIDE[L.kind];
			c.fillRect(side > 0 ? x : x - 3.5, y0, 3.5, Math.max(0, y1 - y0));
			c.strokeStyle = O;
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(x, y0 - 1.5);
			c.lineTo(x, y1 + 1.5);
			c.stroke();
		}
	}

	/** A cached picture of a layer: drawn at (x, y) relative to the layer's local origin and top. */
	interface Spr {
		cv: HTMLCanvasElement;
		x: number;
		y: number;
		w: number;
		h: number;
	}
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
	function layerSprite(L: LayerLook, scale: number): Spr {
		const x = L.a - PADX;
		const w = L.b - L.a + PADX * 2;
		const h = L.t + PADT + PADB;
		const [cv, c] = canvasOf(w, h, scale);
		c.translate(-x, PADT);
		drawLayer(c, L);
		return { cv, x, y: -PADT, w, h };
	}

	// ── the diner (pre-rendered once per size) ──────────────────────────────

	function bottle(c: Ctx, x: number, yb: number, body: [string, string, string], cap: string, mark: string) {
		const p = new Path2D();
		p.moveTo(x - 15, yb - 5);
		p.quadraticCurveTo(x - 15, yb, x - 10, yb);
		p.lineTo(x + 10, yb);
		p.quadraticCurveTo(x + 15, yb, x + 15, yb - 5);
		p.lineTo(x + 15, yb - 44);
		p.quadraticCurveTo(x + 15, yb - 54, x + 6, yb - 58);
		p.lineTo(x + 6, yb - 63);
		p.lineTo(x - 6, yb - 63);
		p.lineTo(x - 6, yb - 58);
		p.quadraticCurveTo(x - 15, yb - 54, x - 15, yb - 44);
		p.closePath();
		const g = c.createLinearGradient(x - 15, 0, x + 15, 0);
		g.addColorStop(0, body[0]);
		g.addColorStop(0.4, body[1]);
		g.addColorStop(1, body[2]);
		c.fillStyle = g;
		c.fill(p);
		c.lineWidth = 2.5;
		c.strokeStyle = O;
		c.stroke(p);
		const capP = new Path2D();
		capP.roundRect(x - 7.5, yb - 74, 15, 12, 3);
		c.fillStyle = cap;
		c.fill(capP);
		c.stroke(capP);
		c.beginPath();
		c.moveTo(x - 3, yb - 74);
		c.lineTo(x, yb - 82);
		c.lineTo(x + 3, yb - 74);
		c.closePath();
		c.fill();
		c.stroke();
		const label = new Path2D();
		label.roundRect(x - 12, yb - 38, 24, 19, 3);
		c.fillStyle = '#fff6e8';
		c.fill(label);
		c.lineWidth = 1.5;
		c.stroke(label);
		c.strokeStyle = mark;
		c.lineWidth = 2.4;
		c.beginPath();
		c.moveTo(x - 7, yb - 28);
		c.quadraticCurveTo(x - 3, yb - 34, x, yb - 28);
		c.quadraticCurveTo(x + 3, yb - 22, x + 7, yb - 28);
		c.stroke();
		c.strokeStyle = 'rgba(255,255,255,.4)';
		c.lineWidth = 3;
		c.beginPath();
		c.moveTo(x - 9, yb - 47);
		c.lineTo(x - 9, yb - 8);
		c.stroke();
	}

	function drawCounter(c: Ctx) {
		const Y = (h: number) => 110 - h;
		// the counter top: glossy red, seen going back
		c.fillStyle = vgrad(c, Y(26), Y(0), [[0, '#5e0b15'], [0.3, '#b51a28'], [1, '#e8434a']]);
		c.fillRect(0, Y(26), LW, 26);
		c.fillStyle = 'rgba(255,255,255,.12)';
		for (const x of [30, 205, 390, 545]) {
			c.beginPath();
			c.moveTo(x, Y(26));
			c.lineTo(x + 34, Y(26));
			c.lineTo(x + 14, Y(0));
			c.lineTo(x - 20, Y(0));
			c.fill();
		}
		// chrome edge
		c.fillStyle = vgrad(c, Y(0), Y(-16), [[0, '#ffffff'], [0.25, '#c9ced8'], [0.55, '#5f6678'], [0.8, '#e8ecf2'], [1, '#7e8596']]);
		c.fillRect(0, Y(0), LW, 16);
		c.strokeStyle = 'rgba(0,0,0,.25)';
		c.lineWidth = 1;
		for (const y of [Y(-5), Y(-11)]) {
			c.beginPath();
			c.moveTo(0, y);
			c.lineTo(LW, y);
			c.stroke();
		}
		// checker front
		const sz = 26;
		for (let row = 0; row * sz < 110; row++)
			for (let col = 0; col * sz < LW + sz; col++) {
				c.fillStyle = (row + col) % 2 ? '#22121a' : '#efe2c6';
				c.fillRect(col * sz, Y(-16) + row * sz, sz, sz);
			}
		c.fillStyle = vgrad(c, Y(-16), Y(-120), [[0, 'rgba(0,0,0,.45)'], [0.12, 'rgba(0,0,0,.1)'], [1, 'rgba(10,0,6,.7)']]);
		c.fillRect(0, Y(-16), LW, 104);
		c.strokeStyle = O;
		c.lineWidth = 2.5;
		for (const y of [Y(0), Y(-16)]) {
			c.beginPath();
			c.moveTo(0, y);
			c.lineTo(LW, y);
			c.stroke();
		}
		// things standing at the back of the counter
		bottle(c, 58, Y(14), ['#ff6a5a', '#e2261f', '#8e0f0c'], '#f4f0e6', '#e2261f');
		bottle(c, 98, Y(16), ['#fff07a', '#ffc928', '#b98200'], '#e2261f', '#c98a00');
		// salt shaker
		const sh = new Path2D();
		sh.moveTo(476, Y(14));
		sh.lineTo(472, Y(52));
		sh.lineTo(500, Y(52));
		sh.lineTo(496, Y(14));
		sh.closePath();
		c.fillStyle = 'rgba(210,235,255,.55)';
		c.fill(sh);
		c.fillStyle = '#f4f6fa';
		c.fillRect(475, Y(36), 22, 21);
		c.lineWidth = 2.5;
		c.strokeStyle = O;
		c.stroke(sh);
		const lid = new Path2D();
		lid.moveTo(472, Y(52));
		lid.quadraticCurveTo(486, Y(70), 500, Y(52));
		lid.closePath();
		c.fillStyle = vgrad(c, Y(68), Y(52), [[0, '#ffffff'], [1, '#8a91a2']]);
		c.fill(lid);
		c.stroke(lid);
		// napkin holder
		const nb = new Path2D();
		nb.roundRect(516, Y(48), 62, 34, 5);
		c.fillStyle = '#ffffff';
		c.beginPath();
		c.moveTo(522, Y(48));
		c.lineTo(530, Y(64));
		c.lineTo(566, Y(62));
		c.lineTo(572, Y(48));
		c.closePath();
		c.fill();
		c.lineWidth = 2;
		c.stroke();
		c.fillStyle = vgrad(c, Y(48), Y(14), [[0, '#ffffff'], [0.35, '#b8bfcc'], [0.6, '#636a7c'], [1, '#d7dbe4']]);
		c.fill(nb);
		c.lineWidth = 2.5;
		c.stroke(nb);
		c.fillStyle = '#e2261f';
		c.beginPath();
		c.arc(547, Y(31), 7, 0, Math.PI * 2);
		c.fill();
		c.lineWidth = 1.5;
		c.stroke();
		// the plate
		c.fillStyle = 'rgba(0,0,0,.4)';
		c.beginPath();
		c.ellipse(300, Y(-1), 178, 10, 0, 0, Math.PI * 2);
		c.fill();
		const pl = new Path2D();
		pl.ellipse(300, Y(6), 198, 17, 0, 0, Math.PI * 2);
		c.fillStyle = vgrad(c, Y(23), Y(-11), [[0, '#ffffff'], [0.5, '#e8eef6'], [1, '#aab6c8']]);
		c.fill(pl);
		c.lineWidth = 2.5;
		c.strokeStyle = O;
		c.stroke(pl);
		c.strokeStyle = 'rgba(70,140,210,.65)';
		c.lineWidth = 2;
		c.beginPath();
		c.ellipse(300, Y(6), 186, 13.5, 0, 0, Math.PI * 2);
		c.stroke();
		c.fillStyle = '#dde5f0';
		c.strokeStyle = 'rgba(110,128,156,.7)';
		c.lineWidth = 1.5;
		c.beginPath();
		c.ellipse(300, Y(8), 150, 9, 0, 0, Math.PI * 2);
		c.fill();
		c.stroke();
		c.strokeStyle = 'rgba(255,255,255,.9)';
		c.lineWidth = 3;
		c.beginPath();
		c.ellipse(300, Y(6), 192, 15, 0, Math.PI * 1.08, Math.PI * 1.32);
		c.stroke();
	}

	function drawTiles(c: Ctx) {
		// dark teal glazed subway tiles behind the counter (h 0 → 240), a chrome rail on top
		c.fillStyle = '#05191a';
		c.fillRect(0, 0, LW, 240);
		for (let row = 0; row < 10; row++) {
			const y = 240 - 26 - row * 24;
			for (let col = -1; col < 13; col++) {
				const x = col * 50 + (row % 2 ? 25 : 0);
				const tile = new Path2D();
				tile.roundRect(x + 1.5, y + 1.5, 47, 21, 3);
				const k = h01(77, row * 31 + col);
				c.fillStyle = vgrad(c, y, y + 24, [[0, k > 0.5 ? '#1d5a5a' : '#184e50'], [1, '#0c3234']]);
				c.fill(tile);
				c.fillStyle = 'rgba(190,255,250,.16)';
				c.fillRect(x + 5, y + 4, 26, 2.4);
			}
		}
		c.fillStyle = vgrad(c, 0, 240, [[0, 'rgba(0,0,0,.1)'], [1, 'rgba(0,0,0,.55)']]);
		c.fillRect(0, 0, LW, 240);
		c.fillStyle = vgrad(c, 0, 14, [[0, '#ffffff'], [0.3, '#b9c0cc'], [0.6, '#596071'], [1, '#d5d9e2']]);
		c.fillRect(0, 0, LW, 14);
		c.strokeStyle = O;
		c.lineWidth = 2.5;
		c.beginPath();
		c.moveTo(0, 14);
		c.lineTo(LW, 14);
		c.stroke();
	}

	function drawPaper(c: Ctx) {
		// deep maroon diner wallpaper (a 600 × 200 tile, seamless top to bottom)
		c.fillStyle = '#341020';
		c.fillRect(0, 0, LW, 200);
		c.fillStyle = 'rgba(255,190,120,.045)';
		for (let x = 10; x < LW; x += 40) c.fillRect(x, 0, 14, 200);
		c.fillStyle = 'rgba(255,205,90,.12)';
		for (let row = 0; row < 4; row++)
			for (let col = 0; col < 11; col++) {
				const x = col * 60 + (row % 2 ? 30 : 0);
				const y = row * 50 + 25;
				c.beginPath();
				c.moveTo(x, y - 6);
				c.lineTo(x + 5, y);
				c.lineTo(x, y + 6);
				c.lineTo(x - 5, y);
				c.closePath();
				c.fill();
			}
	}

	function neonText(c: Ctx, text: string, x: number, y: number, size: number, color: string, glow: number, scale: number) {
		c.font = `800 ${size}px ${FONT}`;
		c.textAlign = 'center';
		c.textBaseline = 'middle';
		c.lineJoin = 'round';
		c.shadowColor = color;
		c.shadowBlur = glow * scale;
		c.strokeStyle = color;
		c.lineWidth = size * 0.13;
		c.strokeText(text, x, y);
		c.strokeText(text, x, y);
		c.shadowBlur = 0;
		c.strokeStyle = 'rgba(255,255,255,.85)';
		c.lineWidth = size * 0.035;
		c.strokeText(text, x, y);
	}

	function drawNeon(c: Ctx, scale: number, top: string, bottom: string, open: string) {
		// backing board
		const b = new Path2D();
		b.roundRect(8, 8, 364, 164, 18);
		c.fillStyle = 'rgba(14,4,10,.88)';
		c.fill(b);
		c.lineWidth = 4;
		c.strokeStyle = '#8a91a2';
		c.stroke(b);
		c.lineWidth = 1.5;
		c.strokeStyle = 'rgba(255,255,255,.35)';
		c.stroke(b);
		for (const [x, y] of [
			[22, 22],
			[358, 22],
			[22, 158],
			[358, 158]
		]) {
			c.fillStyle = '#c9ced8';
			c.beginPath();
			c.arc(x, y, 3.4, 0, Math.PI * 2);
			c.fill();
		}
		// a neon burger
		c.lineCap = 'round';
		c.lineJoin = 'round';
		const tube = (draw: () => void, color: string, wd: number) => {
			c.shadowColor = color;
			c.shadowBlur = 16 * scale;
			c.strokeStyle = color;
			c.lineWidth = wd;
			draw();
			c.stroke();
			draw();
			c.stroke();
			c.shadowBlur = 0;
			c.strokeStyle = 'rgba(255,255,255,.8)';
			c.lineWidth = wd * 0.3;
			draw();
			c.stroke();
		};
		tube(
			() => {
				c.beginPath();
				c.moveTo(34, 78);
				c.bezierCurveTo(34, 38, 120, 38, 120, 78);
				c.closePath();
			},
			'#ffad2e',
			5
		);
		tube(
			() => {
				c.beginPath();
				c.moveTo(30, 90);
				for (let i = 0; i <= 8; i++) c.lineTo(30 + i * 11.75, i % 2 ? 98 : 88);
			},
			'#5dff6a',
			4.5
		);
		tube(
			() => {
				c.beginPath();
				c.moveTo(34, 108);
				c.lineTo(120, 108);
			},
			'#ff4a3d',
			7
		);
		tube(
			() => {
				c.beginPath();
				c.moveTo(34, 120);
				c.lineTo(120, 120);
				c.quadraticCurveTo(120, 136, 104, 136);
				c.lineTo(50, 136);
				c.quadraticCurveTo(34, 136, 34, 120);
				c.closePath();
			},
			'#ffad2e',
			5
		);
		neonText(c, top, 250, 62, 56, '#ff4fa3', 20, scale);
		neonText(c, bottom, 250, 112, 40, '#3fe8ff', 18, scale);
		neonText(c, open, 250, 150, 17, '#fff17a', 10, scale);
	}

	function drawStars(c: Ctx) {
		let s = 9;
		const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
		for (let i = 0; i < 140; i++) {
			const x = r() * LW;
			const y = r() * LH;
			const rad = 0.6 + r() * r() * 2.2;
			c.fillStyle = `rgba(${220 + r() * 35},${215 + r() * 40},255,${0.35 + r() * 0.6})`;
			c.beginPath();
			c.arc(x, y, rad, 0, Math.PI * 2);
			c.fill();
		}
		for (let i = 0; i < 9; i++) {
			const x = r() * LW;
			const y = r() * LH;
			const k = 5 + r() * 5;
			c.fillStyle = 'rgba(255,250,220,.9)';
			c.beginPath();
			c.moveTo(x, y - k);
			c.quadraticCurveTo(x, y, x + k, y);
			c.quadraticCurveTo(x, y, x, y + k);
			c.quadraticCurveTo(x, y, x - k, y);
			c.quadraticCurveTo(x, y, x, y - k);
			c.fill();
		}
	}

	function drawCloud(c: Ctx) {
		const p = new Path2D();
		for (const [x, y, r] of [
			[50, 60, 30],
			[90, 42, 36],
			[138, 50, 32],
			[172, 64, 24],
			[110, 70, 30]
		]) {
			p.moveTo(x + r, y);
			p.arc(x, y, r, 0, Math.PI * 2);
		}
		c.lineWidth = 6;
		c.strokeStyle = '#140a2a';
		c.stroke(p);
		c.fillStyle = vgrad(c, 6, 96, [[0, '#9a86d8'], [0.5, '#5d4a9a'], [1, '#33275e']]);
		c.fill(p);
		c.fillStyle = 'rgba(255,255,255,.18)';
		c.beginPath();
		c.ellipse(88, 26, 18, 6, -0.2, 0, Math.PI * 2);
		c.fill();
	}

	function drawUav(c: Ctx) {
		// a little spy drone (our own drawing): long wings, round nose, a tail, a pusher prop
		c.lineJoin = 'round';
		const wing = new Path2D();
		wing.moveTo(30, 22);
		wing.lineTo(98, 18);
		wing.lineTo(100, 24);
		wing.lineTo(30, 28);
		wing.closePath();
		c.fillStyle = '#6f7686';
		c.fill(wing);
		c.lineWidth = 2;
		c.strokeStyle = O;
		c.stroke(wing);
		const body = new Path2D();
		body.moveTo(10, 26);
		body.quadraticCurveTo(14, 16, 30, 17);
		body.lineTo(88, 22);
		body.lineTo(104, 14);
		body.lineTo(110, 16);
		body.lineTo(102, 28);
		body.lineTo(30, 33);
		body.quadraticCurveTo(12, 34, 10, 26);
		body.closePath();
		c.fillStyle = vgrad(c, 14, 34, [[0, '#c4cad6'], [1, '#535a6a']]);
		c.fill(body);
		c.stroke(body);
		c.fillStyle = '#1d2230';
		c.beginPath();
		c.ellipse(20, 23, 6, 3.6, 0, 0, Math.PI * 2);
		c.fill();
		c.fillStyle = 'rgba(120,220,255,.7)';
		c.beginPath();
		c.ellipse(19, 22, 2.6, 1.4, 0, 0, Math.PI * 2);
		c.fill();
		c.strokeStyle = '#2a2f3c';
		c.lineWidth = 2.4;
		c.beginPath();
		c.moveTo(112, 12);
		c.lineTo(112, 32);
		c.stroke();
	}

	function drawIcon(c: Ctx) {
		// a mini burger for the HUD's burger count (36 × 30)
		const top = new Path2D();
		top.moveTo(4, 13);
		top.bezierCurveTo(4, 2, 32, 2, 32, 13);
		top.closePath();
		c.fillStyle = '#f2a64c';
		c.fill(top);
		c.lineWidth = 2;
		c.strokeStyle = O;
		c.stroke(top);
		c.fillStyle = '#fff5da';
		for (const [x, y] of [
			[12, 8],
			[18, 6],
			[24, 8]
		]) {
			c.beginPath();
			c.ellipse(x, y, 1.6, 0.9, 0, 0, Math.PI * 2);
			c.fill();
		}
		c.fillStyle = '#5cc23e';
		c.fillRect(3, 13, 30, 3);
		c.fillStyle = '#ffc928';
		c.fillRect(4, 16, 28, 2.5);
		const pat = new Path2D();
		pat.roundRect(3, 18, 30, 5, 2.5);
		c.fillStyle = '#6b3a1c';
		c.fill(pat);
		c.stroke(pat);
		const bot = new Path2D();
		bot.moveTo(4, 24);
		bot.lineTo(32, 24);
		bot.quadraticCurveTo(32, 29, 27, 29);
		bot.lineTo(9, 29);
		bot.quadraticCurveTo(4, 29, 4, 24);
		bot.closePath();
		c.fillStyle = '#e8a046';
		c.fill(bot);
		c.stroke(bot);
	}

	/** RGB colour stops of the sky by height (the diner wall covers the first ~1000 units). */
	const SKY: [number, [number, number, number]][] = [
		[0, [42, 16, 32]],
		[1000, [42, 16, 32]],
		[1150, [70, 30, 96]],
		[1800, [30, 18, 78]],
		[2700, [12, 8, 40]],
		[4200, [4, 3, 14]]
	];
	function skyAt(h: number): string {
		let i = 0;
		while (i < SKY.length - 1 && SKY[i + 1][0] < h) i++;
		const [h0, c0] = SKY[i];
		const [h1, c1] = SKY[Math.min(i + 1, SKY.length - 1)];
		const k = h1 === h0 ? 0 : Math.max(0, Math.min(1, (h - h0) / (h1 - h0)));
		const m = (j: number) => Math.round(c0[j] + (c1[j] - c0[j]) * k);
		return `rgb(${m(0)},${m(1)},${m(2)})`;
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { makePlan, dropLayer, speedAt, sideOf, finishesBurger, BURGER_BONUS, SWING, AUTO_DROP } from '#lib/arcade/stack.ts';
	import w from '#lib/i18n/arcade/stack.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();

	$effect(() => {
		if (!root || !canvas) return;
		return run(
			root,
			canvas,
			untrack(() => seed),
			untrack(() => onend)
		);
	});

	/** A layer on the tower: its look, where its local 0 sits (wx) and its bottom height (h). */
	interface Lay extends LayerLook {
		wx: number;
		h: number;
		at: number;
		spr?: Spr | null;
	}
	interface Mover {
		kind: StackPiece;
		w: number;
		x: number;
		dir: number;
		deco: number;
		spr?: Spr | null;
	}
	interface Faller {
		look: LayerLook;
		wx: number;
		h: number;
		vy: number;
		res: DropResult | null;
		spr?: Spr | null;
	}
	interface Debris {
		spr: Spr;
		mid: number;
		t: number;
		cx: number;
		ch: number;
		vx: number;
		vh: number;
		rot: number;
		vr: number;
	}
	interface Bit {
		x: number;
		h: number;
		vx: number;
		vh: number;
		life: number;
		max: number;
		r: number;
		color: string;
		star: boolean;
		rot: number;
	}
	interface Float {
		text: string;
		x: number;
		h: number;
		t0: number;
		size: number;
		color: string;
	}

	function run(el: HTMLDivElement, cv: HTMLCanvasElement, seed0: number, end: ArcadeGameProps['onend']): () => void {
		const ctx = cv.getContext('2d')!;
		const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		const plan = makePlan(seed0);
		/** screen y of the counter top when the camera is at 0 */
		const BASE_Y = 712;
		const PLATE = 9;
		const HOVER = 64;
		const TOP_AT = 430;
		const G = 3200;
		const CX = LW / 2;

		let scale = 1;
		let art: Record<'counter' | 'tiles' | 'paper' | 'neon' | 'stars' | 'cloud' | 'uav' | 'icon', HTMLCanvasElement> | null = null;

		let time = 0;
		let cam = 0;
		let paused = false;
		let done = false;
		let phase: 'play' | 'drop' | 'bun' | 'over' = 'play';
		let score = 0;
		let n = 0;
		let streak = 0;
		let burgers = 0;
		let spawnAt = 0;
		let overAt = 0;
		let shakeAt = -9;
		let shakeAmp = 0;
		let bunQueue: StackPiece[] = [];
		let nextBunAt = 0;
		let banner: { at: number } | null = null;
		const tower: Lay[] = [];
		let mov: Mover | null = null;
		let falling: Faller | null = null;
		const debris: Debris[] = [];
		const bits: Bit[] = [];
		const floats: Float[] = [];
		const rings: { l: number; r: number; h: number; t: number; at: number }[] = [];
		const deco = () => Math.floor(Math.random() * 4294967296) >>> 0;

		const sy = (h: number) => BASE_Y - (h - cam);
		const topLay = () => tower[tower.length - 1];
		const topH = () => topLay().h + topLay().t;
		const topSpan = () => ({ l: topLay().wx + topLay().a, r: topLay().wx + topLay().b });

		// the first bottom bun, on the plate
		tower.push({ kind: 'bunBottom', wx: CX - 160, a0: 0, b0: 320, a: 0, b: 320, t: THICK.bunBottom, deco: deco(), h: PLATE, at: -9 });

		function spawn() {
			const kind = plan(n);
			const s = topSpan();
			const side = sideOf(n);
			mov = { kind, w: s.r - s.l, x: CX + side * SWING, dir: -side, deco: deco() };
			spawnAt = time;
			phase = 'play';
		}
		spawn();

		function moverLook(m: Mover): LayerLook {
			return { kind: m.kind, a0: 0, b0: m.w, a: 0, b: m.w, t: THICK[m.kind], deco: m.deco };
		}

		function drop() {
			if (phase !== 'play' || !mov || done) return;
			const top = topSpan();
			const wx = mov.x - mov.w / 2;
			const res = dropLayer(top, { l: wx, r: wx + mov.w }, streak);
			falling = { look: moverLook(mov), wx, h: topH() + HOVER, vy: 260, res, spr: mov.spr };
			mov = null;
			phase = 'drop';
		}

		function crumbs(x0: number, x1: number, h: number, color: string, count: number) {
			const k = reduce ? Math.ceil(count / 2) : count;
			for (let i = 0; i < k; i++) {
				const left = i % 2 === 0;
				bits.push({
					x: left ? x0 + Math.random() * 10 : x1 - Math.random() * 10,
					h: h + Math.random() * 6,
					vx: (left ? -1 : 1) * (60 + Math.random() * 140),
					vh: 120 + Math.random() * 200,
					life: 0,
					max: 0.5 + Math.random() * 0.4,
					r: 2 + Math.random() * 2.6,
					color,
					star: false,
					rot: 0
				});
			}
		}
		function sparkles(x: number, h: number, count: number, spread: number) {
			const k = reduce ? Math.ceil(count / 2) : count;
			for (let i = 0; i < k; i++) {
				const a = Math.random() * Math.PI * 2;
				const v = 80 + Math.random() * spread;
				bits.push({
					x,
					h,
					vx: Math.cos(a) * v,
					vh: Math.sin(a) * v + 80,
					life: 0,
					max: 0.55 + Math.random() * 0.45,
					r: 5 + Math.random() * 6,
					color: Math.random() < 0.5 ? '#fff6b0' : '#ffd23a',
					star: true,
					rot: Math.random() * 3
				});
			}
		}
		function float(text: string, x: number, h: number, size: number, color: string) {
			floats.push({ text, x, h, t0: time, size, color });
		}
		function shake(amp: number) {
			if (reduce) return;
			shakeAt = time;
			shakeAmp = amp;
		}

		function land(f: Faller) {
			const res = f.res;
			const L = f.look;
			const h = topH();
			if (!res) {
				// a bun landing by itself
				tower.push({ ...L, wx: f.wx, h, at: time, spr: null });
				crumbs(f.wx + L.a, f.wx + L.b, h, CRUMB[L.kind], 10);
				if (L.kind === 'bunTop') {
					burgers++;
					score += BURGER_BONUS;
					banner = { at: time };
					sparkles(f.wx + (L.a + L.b) / 2, h + L.t, 26, 360);
					float(`+${BURGER_BONUS}`, f.wx + (L.a + L.b) / 2, h + L.t + 30, 40, '#ffd23a');
					shake(9);
					sound.play('maxed');
					nextBunAt = time + 0.55;
				} else {
					shake(3);
					sound.play('clack');
					spawn();
				}
				return;
			}
			if (res.type === 'miss') return;
			let lay: Lay;
			const W = L.b0 - L.a0;
			if (res.type === 'perfect') {
				// snap onto the stack; a grown layer is a fresh full piece
				const g = res.grow;
				lay = { ...L, a0: -g / 2, b0: W + g / 2, a: -g / 2, b: W + g / 2, wx: res.keep.l + g / 2, h, at: time, spr: g ? null : f.spr };
				rings.push({ l: res.keep.l, r: res.keep.r, h, t: L.t, at: time });
				sparkles((res.keep.l + res.keep.r) / 2, h + L.t / 2, 14, 220);
				float(w.perfect, (res.keep.l + res.keep.r) / 2, h + L.t + 26, 34, '#fff6b0');
				if (g) float(w.wider, (res.keep.l + res.keep.r) / 2, h + L.t + 62, 26, '#7dff6a');
				sound.play('camo');
				streak = res.streak;
			} else {
				lay = { ...L, a: res.keep.l - f.wx, b: res.keep.r - f.wx, wx: f.wx, h, at: time, spr: null };
				const cut: LayerLook = { ...L, a: res.cut.l - f.wx, b: res.cut.r - f.wx };
				const side = res.cut.l < res.keep.l ? -1 : 1;
				debris.push({
					spr: layerSprite(cut, scale),
					mid: (cut.a + cut.b) / 2,
					t: L.t,
					cx: (res.cut.l + res.cut.r) / 2,
					ch: h + L.t / 2,
					vx: side * (50 + Math.random() * 70),
					vh: 90 + Math.random() * 60,
					rot: 0,
					vr: side * (2.4 + Math.random() * 2.2)
				});
				crumbs(res.keep.l, res.keep.r, h + 4, CRUMB[L.kind], 8);
				sound.play('clack');
				streak = 0;
			}
			tower.push(lay);
			score += res.points;
			float(`+${res.points}`, lay.wx + lay.b + 34, h + L.t / 2, 24, '#ffffff');
			shake(res.type === 'perfect' ? 4 : 2.5);
			n++;
			if (finishesBurger(n - 1)) {
				phase = 'bun';
				bunQueue = ['bunTop', 'bunBottom'];
				nextBunAt = time + 0.18;
			} else spawn();
		}

		function miss(f: Faller) {
			const L = f.look;
			const top = topSpan();
			const side = f.wx + (L.a + L.b) / 2 < (top.l + top.r) / 2 ? -1 : 1;
			debris.push({
				spr: f.spr ?? layerSprite(L, scale),
				mid: (L.a + L.b) / 2,
				t: L.t,
				cx: f.wx + (L.a + L.b) / 2,
				ch: f.h + L.t / 2,
				vx: side * 90,
				vh: -f.vy * 0.5,
				rot: 0,
				vr: side * 2.6
			});
			falling = null;
			phase = 'over';
			overAt = time;
			streak = 0;
			float(w.missed, CX, topH() + 90, 46, '#ff5a4a');
			shake(10);
			sound.play('clack');
		}

		function finish() {
			if (done) return;
			done = true;
			cancelAnimationFrame(raf);
			end(Math.max(0, Math.round(score)));
		}

		function update(dt: number) {
			time += dt;
			if (phase === 'play' && mov) {
				mov.x += mov.dir * speedAt(n) * dt;
				if (mov.x > CX + SWING) {
					mov.x = CX + SWING - (mov.x - CX - SWING);
					mov.dir = -1;
				} else if (mov.x < CX - SWING) {
					mov.x = CX - SWING + (CX - SWING - mov.x);
					mov.dir = 1;
				}
				if (time - spawnAt >= AUTO_DROP) drop();
			}
			if (phase === 'bun' && !falling && bunQueue.length && time >= nextBunAt) {
				const kind = bunQueue.shift()!;
				const s = topSpan();
				// a narrow tower gets flatter buns (a full-height bun on a sliver looks like a pill)
				const bw = s.r - s.l;
				const t = Math.round(Math.max(kind === 'bunTop' ? 22 : 18, Math.min(THICK[kind], bw * (kind === 'bunTop' ? 0.34 : 0.26))));
				const look: LayerLook = { kind, a0: 0, b0: bw, a: 0, b: bw, t, deco: deco() };
				falling = { look, wx: s.l, h: topH() + 280, vy: 0, res: null };
			}
			if (falling) {
				falling.vy += G * dt;
				falling.h -= falling.vy * dt;
				const f = falling;
				if (f.res?.type === 'miss') {
					if (f.h <= topH() + 4) miss(f);
				} else if (f.h <= topH()) {
					falling = null;
					land(f);
				}
			}
			for (let i = debris.length - 1; i >= 0; i--) {
				const d = debris[i];
				d.vh -= G * 0.7 * dt;
				d.cx += d.vx * dt;
				d.ch += d.vh * dt;
				d.rot += d.vr * dt;
				if (sy(d.ch) > LH + 260) debris.splice(i, 1);
			}
			for (let i = bits.length - 1; i >= 0; i--) {
				const b = bits[i];
				b.life += dt;
				b.vh -= (b.star ? 300 : 1100) * dt;
				b.x += b.vx * dt;
				b.h += b.vh * dt;
				b.rot += dt * 4;
				if (b.life >= b.max) bits.splice(i, 1);
			}
			for (let i = floats.length - 1; i >= 0; i--) if (time - floats[i].t0 > 1.1) floats.splice(i, 1);
			for (let i = rings.length - 1; i >= 0; i--) if (time - rings[i].at > 0.55) rings.splice(i, 1);
			const target = Math.max(0, topH() - (BASE_Y - TOP_AT));
			cam += (target - cam) * (1 - Math.exp(-dt * 5));
			if (phase === 'over' && time - overAt >= 1.15) finish();
		}

		// ── drawing ──
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

		function sprOf(L: Lay | Mover | Faller): Spr {
			if (!L.spr) {
				const look = 'look' in L ? L.look : 'wx' in L ? L : moverLook(L);
				L.spr = layerSprite(look, scale);
			}
			return L.spr;
		}

		function drawBackdrop() {
			if (!art) return;
			const hTop = cam + BASE_Y;
			const hBot = cam + BASE_Y - LH;
			const g = ctx.createLinearGradient(0, 0, 0, LH);
			g.addColorStop(0, skyAt(hTop));
			g.addColorStop(0.5, skyAt((hTop + hBot) / 2));
			g.addColorStop(1, skyAt(hBot));
			ctx.fillStyle = g;
			ctx.fillRect(0, 0, LW, LH);
			const starA = Math.max(0, Math.min(1, (hTop - 1250) / 900));
			if (starA > 0) {
				ctx.globalAlpha = starA;
				const off = (cam * 0.25) % LH;
				ctx.drawImage(art.stars, 0, off - LH, LW, LH);
				ctx.drawImage(art.stars, 0, off, LW, LH);
				ctx.globalAlpha = 1;
			}
			// the moon: far away, so it drifts down slowly once the tower is past the roof
			const my = sy(1000 + cam * 0.8);
			if (my > -90 && my < LH + 90) {
				ctx.fillStyle = 'rgba(255,240,190,.12)';
				ctx.beginPath();
				ctx.arc(470, my, 78, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#f7ecc6';
				ctx.strokeStyle = O;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(470, my, 52, 0, Math.PI * 2);
				ctx.fill();
				ctx.stroke();
				ctx.fillStyle = 'rgba(190,170,120,.6)';
				for (const [x, y, r] of [
					[452, -14, 10],
					[488, 8, 13],
					[460, 22, 7],
					[494, -24, 6]
				]) {
					ctx.beginPath();
					ctx.arc(x, my + y, r, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			// clouds drifting by
			for (const [h, base, sp] of [
				[1260, 40, 14],
				[1520, 380, -10],
				[1830, 140, 18],
				[2180, 460, -12]
			]) {
				const y = sy(h) - 50;
				if (y < -120 || y > LH + 20) continue;
				const x = ((((base + time * sp) % 900) + 900) % 900) - 220;
				ctx.drawImage(art.cloud, x, y, 220, 100);
			}
			// a UAV crossing high above the diner
			const uy = sy(1700) - 25;
			if (uy > -60 && uy < LH) {
				const ux = ((time * 55) % 1000) - 160;
				ctx.drawImage(art.uav, ux, uy, 120, 50);
				if (Math.floor(time * 2.5) % 2 === 0) {
					ctx.fillStyle = '#ff3a2a';
					ctx.beginPath();
					ctx.arc(ux + 98, uy + 20, 3.2, 0, Math.PI * 2);
					ctx.fill();
				}
			}
			// the diner wall: tiles, wallpaper, roof edge
			const WALL_TOP = 1040;
			if (sy(WALL_TOP) < LH) {
				for (let h0 = 240; h0 < WALL_TOP; h0 += 200) {
					const y = sy(h0 + 200);
					if (y > LH || y + 200 < 0) continue;
					ctx.drawImage(art.paper, 0, y, LW, 200);
				}
				const ty = sy(240);
				if (ty < LH && ty + 240 > 0) ctx.drawImage(art.tiles, 0, ty, LW, 240);
				const ry = sy(WALL_TOP + 30);
				if (ry < LH && ry + 30 > 0) {
					ctx.fillStyle = '#1b0a12';
					ctx.fillRect(0, ry, LW, 30);
					ctx.fillStyle = vgrad(ctx, ry, ry + 10, [[0, '#ffffff'], [1, '#7e8596']]);
					ctx.fillRect(0, ry, LW, 9);
					ctx.fillStyle = '#ff4fa3';
					ctx.shadowColor = '#ff4fa3';
					ctx.shadowBlur = 12 * scale;
					ctx.fillRect(0, ry + 18, LW, 3);
					ctx.shadowBlur = 0;
				}
				// the neon sign (a little parallax: it's on the wall behind)
				const nh = 470 + cam * 0.12;
				const ny = sy(nh + 180);
				if (ny < LH && ny + 180 > 0) {
					const flick = Math.sin(time * 37) > 0.97 ? 0.75 : 1;
					ctx.globalAlpha = flick;
					ctx.drawImage(art.neon, 110, ny, 380, 180);
					ctx.globalAlpha = 1;
				}
			}
			const cy = sy(110);
			if (cy < LH) ctx.drawImage(art.counter, 0, cy, LW, 230);
		}

		function drawLay(L: Lay) {
			const top = sy(L.h + L.t);
			if (top > LH + 40 || top + L.t + 60 < 0) return;
			const s = sprOf(L);
			const age = time - L.at;
			if (age < 0.35 && !reduce) {
				const amt = Math.exp(-age * 12);
				const wob = Math.cos(age * 28);
				const sx = 1 + 0.14 * amt * wob;
				const syy = 1 - 0.26 * amt * wob;
				const mx = L.wx + (L.a + L.b) / 2;
				const by = sy(L.h);
				ctx.save();
				ctx.translate(mx, by);
				ctx.scale(sx, syy);
				ctx.drawImage(s.cv, L.wx + s.x - mx, top + s.y - by, s.w, s.h);
				ctx.restore();
			} else ctx.drawImage(s.cv, L.wx + s.x, top + s.y, s.w, s.h);
		}

		function drawTower() {
			let sway = 0;
			if (phase === 'over') {
				const k = time - overAt;
				sway = (reduce ? 0.02 : 0.06) * Math.exp(-k * 2.6) * Math.sin(k * 15);
			}
			ctx.save();
			if (sway) {
				ctx.translate(CX, sy(PLATE));
				ctx.rotate(sway);
				ctx.translate(-CX, -sy(PLATE));
			}
			// skip what's far below the screen
			let first = 0;
			for (let i = tower.length - 1; i >= 0; i--)
				if (sy(tower[i].h + tower[i].t) > LH + 60) {
					first = i;
					break;
				}
			for (let i = first; i < tower.length; i++) drawLay(tower[i]);
			// free pictures of layers far below
			for (let i = 0; i < first - 2; i++) tower[i].spr = null;
			ctx.restore();
		}

		function drawMoving() {
			if (mov && phase === 'play') {
				const s = sprOf(mov);
				const wx = mov.x - mov.w / 2;
				const top = sy(topH() + HOVER + THICK[mov.kind]);
				// a soft shadow on the stack under it
				const st = topSpan();
				const l = Math.max(wx, st.l);
				const r = Math.min(wx + mov.w, st.r);
				if (r > l) {
					ctx.fillStyle = 'rgba(0,0,0,.28)';
					ctx.beginPath();
					ctx.ellipse((l + r) / 2, sy(topH()) + 2, (r - l) / 2, 5, 0, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.drawImage(s.cv, wx + s.x, top + s.y, s.w, s.h);
				// running out of time: a countdown over it
				const left = AUTO_DROP - (time - spawnAt);
				if (left < 3) {
					const pulse = 1 + 0.12 * Math.sin(time * 12);
					text(String(Math.ceil(left)), mov.x, top - 26, 30 * pulse, '#ff5a4a', 'center');
					text(w.hurry, mov.x, top - 54, 16, '#fff6e0', 'center');
				}
			}
			if (falling) {
				const f = falling;
				const s = (f.spr ??= layerSprite(f.look, scale));
				ctx.drawImage(s.cv, f.wx + s.x, sy(f.h + f.look.t) + s.y, s.w, s.h);
			}
		}

		function drawDebris() {
			for (const d of debris) {
				ctx.save();
				ctx.translate(d.cx, sy(d.ch));
				ctx.rotate(d.rot);
				ctx.drawImage(d.spr.cv, d.spr.x - d.mid, d.spr.y - d.t / 2, d.spr.w, d.spr.h);
				ctx.restore();
			}
		}

		function drawFx() {
			for (const r of rings) {
				const k = (time - r.at) / 0.55;
				const e = 4 + k * 34;
				const y = sy(r.h + r.t);
				ctx.globalAlpha = 1 - k;
				const p = new Path2D();
				p.roundRect(r.l - e, y - e, r.r - r.l + 2 * e, r.t + 2 * e, 12 + e * 0.4);
				ctx.strokeStyle = 'rgba(255,214,58,.55)';
				ctx.lineWidth = 10;
				ctx.stroke(p);
				ctx.strokeStyle = '#fffbe0';
				ctx.lineWidth = 3.5;
				ctx.stroke(p);
				ctx.globalAlpha = 1;
			}
			for (const b of bits) {
				const a = 1 - b.life / b.max;
				const x = b.x;
				const y = sy(b.h);
				ctx.globalAlpha = Math.max(0, a);
				if (b.star) {
					const k = b.r * (0.6 + 0.4 * a);
					ctx.save();
					ctx.translate(x, y);
					ctx.rotate(b.rot * 0.3);
					ctx.fillStyle = b.color;
					ctx.beginPath();
					ctx.moveTo(0, -k);
					ctx.quadraticCurveTo(0, 0, k, 0);
					ctx.quadraticCurveTo(0, 0, 0, k);
					ctx.quadraticCurveTo(0, 0, -k, 0);
					ctx.quadraticCurveTo(0, 0, 0, -k);
					ctx.fill();
					ctx.restore();
				} else {
					ctx.fillStyle = b.color;
					ctx.strokeStyle = O;
					ctx.lineWidth = 1.2;
					ctx.beginPath();
					ctx.arc(x, y, b.r, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
				}
			}
			ctx.globalAlpha = 1;
			for (const f of floats) {
				const k = (time - f.t0) / 1.1;
				const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.55 : k < 0.3 ? 1.15 - ((k - 0.15) / 0.15) * 0.15 : 1;
				ctx.globalAlpha = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
				text(f.text, Math.max(60, Math.min(LW - 60, f.x)), sy(f.h) - k * 50, f.size * pop, f.color, 'center');
				ctx.globalAlpha = 1;
			}
		}

		function drawHud() {
			if (!art) return;
			ctx.fillStyle = vgrad(ctx, 0, 120, [[0, 'rgba(10,3,8,.7)'], [1, 'rgba(10,3,8,0)']]);
			ctx.fillRect(0, 0, LW, 120);
			text(w.score, 24, 30, 16, '#ffd23a');
			text(String(score), 24, 64, 38, '#fff6e0');
			text(w.layers, LW - 24, 30, 16, '#ffd23a', 'right');
			text(String(n), LW - 24, 64, 38, '#fff6e0', 'right');
			if (burgers > 0) {
				const s = `×${burgers}`;
				text(s, LW - 24, 106, 24, '#fff6e0', 'right');
				ctx.drawImage(art.icon, LW - 24 - ctx.measureText(s).width - 42, 90, 36, 30);
			}
			if (streak >= 2 && phase !== 'over') {
				const pulse = 1 + 0.05 * Math.sin(time * 10);
				text(`${w.streak} ×${streak}`, CX, 44, 24 * pulse, '#ffe066', 'center');
			}
			if (banner) {
				const k = (time - banner.at) / 1.5;
				if (k >= 1) banner = null;
				else {
					const pop = k < 0.12 ? 0.4 + (k / 0.12) * 0.8 : k < 0.24 ? 1.2 - ((k - 0.12) / 0.12) * 0.2 : 1;
					ctx.globalAlpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
					ctx.save();
					ctx.translate(CX, 250);
					ctx.rotate(-0.05);
					ctx.scale(pop, pop);
					const p = new Path2D();
					p.roundRect(-230, -40, 460, 80, 22);
					ctx.fillStyle = 'rgba(20,6,12,.82)';
					ctx.fill(p);
					ctx.lineWidth = 4;
					ctx.strokeStyle = '#ffd23a';
					ctx.stroke(p);
					text(w.burgerDone, 0, -2, 40, '#ffe066', 'center');
					ctx.restore();
					ctx.globalAlpha = 1;
				}
			}
			if (paused) {
				ctx.fillStyle = 'rgba(10,3,8,.74)';
				ctx.fillRect(0, 0, LW, LH);
				text(w.paused, CX, LH / 2 - 24, 54, '#fff6e0', 'center');
				text(w.resume, CX, LH / 2 + 30, 24, '#ffd23a', 'center');
			}
		}

		function render() {
			if (!art) return;
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			ctx.save();
			const sk = time - shakeAt;
			if (sk < 0.3) {
				const a = shakeAmp * (1 - sk / 0.3);
				ctx.translate(Math.sin(time * 91) * a, Math.cos(time * 77) * a * 0.6);
			}
			drawBackdrop();
			drawTower();
			drawDebris();
			drawMoving();
			drawFx();
			ctx.restore();
			drawHud();
		}

		function resize() {
			const cssW = cv.clientWidth;
			if (!cssW) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const pw = Math.round(cssW * dpr);
			const ph = Math.round((pw * LH) / LW);
			if (pw === cv.width && ph === cv.height && art) return;
			cv.width = pw;
			cv.height = ph;
			scale = pw / LW;
			const mk = (wd: number, ht: number, draw: (c: Ctx) => void) => {
				const [c2, x] = canvasOf(wd, ht, scale);
				draw(x);
				return c2;
			};
			art = {
				counter: mk(LW, 230, drawCounter),
				tiles: mk(LW, 240, drawTiles),
				paper: mk(LW, 200, drawPaper),
				neon: mk(380, 180, (c) => drawNeon(c, scale, w.signTop, w.signBottom, w.signOpen)),
				stars: mk(LW, LH, drawStars),
				cloud: mk(220, 100, drawCloud),
				uav: mk(120, 50, drawUav),
				icon: mk(36, 30, drawIcon)
			};
			for (const L of tower) L.spr = null;
			if (mov) mov.spr = null;
			if (falling) falling.spr = null;
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
		function onDown(e: PointerEvent) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			e.preventDefault();
			el.focus({ preventScroll: true });
			if (paused) resume();
			else drop();
		}
		const editable = (t: EventTarget | null) =>
			t instanceof HTMLElement && t !== el && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
		function onKey(e: KeyboardEvent) {
			if (done || editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
			const use = e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter' || e.key === 'ArrowDown';
			if (use) e.preventDefault();
			if (paused) {
				if (!e.repeat) resume();
				return;
			}
			if (use && !e.repeat) drop();
		}
		function onVis() {
			if (document.hidden && !done) paused = true;
		}

		const ro = new ResizeObserver(resize);
		ro.observe(cv);
		resize();
		cv.addEventListener('pointerdown', onDown);
		window.addEventListener('keydown', onKey);
		document.addEventListener('visibilitychange', onVis);
		el.focus({ preventScroll: true });
		raf = requestAnimationFrame(frame);

		if (import.meta.env.DEV) {
			// test bench only: lets check scripts drop at the right moment
			(window as unknown as Record<string, unknown>).__stackDbg = () => ({
				phase,
				n,
				score,
				streak,
				off: mov ? mov.x - (topSpan().l + topSpan().r) / 2 : null,
				dir: mov?.dir ?? 0,
				speed: speedAt(n)
			});
		}

		return () => {
			done = true;
			cancelAnimationFrame(raf);
			ro.disconnect();
			cv.removeEventListener('pointerdown', onDown);
			window.removeEventListener('keydown', onKey);
			document.removeEventListener('visibilitychange', onVis);
		};
	}
</script>

<!-- the game takes the keyboard itself (Space / Enter / ↓), so its area is focusable -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="bstack" bind:this={root} tabindex="0" role="application" aria-label={w.aria}>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.bstack {
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 3 / 4));
		aspect-ratio: 3 / 4;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #1a0812;
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.6),
			0 10px 30px rgb(0 0 0 / 0.45);
		outline: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.bstack:focus-visible {
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.6),
			0 0 0 3px #ffd23a;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: manipulation;
		cursor: pointer;
	}
	/* an arcade screen: faint scanlines and a vignette, over the canvas, clicks go through */
	.bstack::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		background:
			repeating-linear-gradient(to bottom, rgb(255 255 255 / 0.03) 0 1px, transparent 1px 3px),
			radial-gradient(120% 90% at 50% 45%, transparent 60%, rgb(0 0 0 / 0.5) 100%);
		box-shadow: inset 0 0 0 3px rgb(0 0 0 / 0.55), inset 0 0 24px rgb(0 0 0 / 0.5);
	}
</style>
