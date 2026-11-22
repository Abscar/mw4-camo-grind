<!--
	Grenade Toss (BurgiArcade, 2026-11-22). Side view of a war-torn street at dusk: your operator crouches
	behind sandbags on the left (helmet with ghillie scraps, a holk in his mouth), to the right plywood enemy
	cut-outs behind cover, a building whose windows open and close, a burn barrel that works like a basket and,
	later on, a truck patrolling with a rider in its bed. Drag back from anywhere (slingshot style; the first
	part of the arc shows as dots) and let go to throw, or aim with the arrow keys and throw with Space. The
	grenade flies with gravity + wind (the roof flag and the HUD arrow), bounces once, and goes off when its
	fuse runs out. Ten grenades, one per round. Rules, physics and scoring: src/lib/arcade/grenade.ts.
	One canvas, logical 800 × 600, scaled to the box (devicePixelRatio ≤ 2); the static street is drawn once
	into offscreen canvases. Pauses itself while the tab is hidden (game clock only).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { rng } from '#lib/arcade/rng.ts';
	import * as G from '#lib/arcade/grenade.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import s from '#lib/i18n/arcade/grenade.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let paused = $state(false);
	let resume = () => {};

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const { W, H, GROUND, ROOF_Y } = G;
		const O = '#140a06';
		const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
		const TAU = Math.PI * 2;
		const level = G.makeLevel(seed);
		const bx = level.buildingX;

		// ---------------------------------------------------------------- state
		type Phase = 'intro' | 'aim' | 'flight' | 'blast' | 'outro' | 'end';
		let ri = 0;
		let phase: Phase = 'intro';
		let rt = 0; // the round's clock
		let phaseT = 0;
		let clock = 0; // whole run (decoration)
		let score = 0;
		let shown = 0;
		let nade: G.Nade | null = null;
		let trail: { x: number; y: number }[] = [];
		let aimAngle = 40;
		let aimPower = 0.55;
		let dragging = false;
		let dragId = -1;
		let dragStart = { x: 0, y: 0 };
		let dragNow = { x: 0, y: 0 };
		let keyAim = false;
		let throwT = -1; // seconds since release (arm swing)
		let throwDir = { x: 1, y: -1 };
		let hint = true;
		let ended = false;
		const used: ('hit' | 'miss' | 'lost')[] = [];
		const gone = new Map<string, number>();
		let blast: G.Blast | null = null;
		let blastT = 0;
		let shake = 0;
		let flash = 0;

		type Kind = 'smoke' | 'fire' | 'debris' | 'spark' | 'splinter' | 'dust' | 'ember' | 'pin' | 'spoon' | 'far';
		interface P {
			k: Kind;
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			max: number;
			size: number;
			rot: number;
			vr: number;
			color: string;
			grav: number;
		}
		let parts: P[] = [];
		const floaters: { text: string; x: number; y: number; t: number; color: string; size: number }[] = [];
		const banners: { text: string; t: number; color: string; size: number }[] = [];
		const scorches: { x: number; r: number }[] = [];
		const fx = rng((seed ^ 0x51ed270b) >>> 0); // decoration only: never touches the level
		const add = (p: Partial<P> & { k: Kind; x: number; y: number }) => {
			if (parts.length > 420) return;
			parts.push({ vx: 0, vy: 0, life: 0, max: 1, size: 4, rot: 0, vr: 0, color: '#fff', grav: 0, ...p });
		};
		const lots = (n: number) => (reduce ? Math.ceil(n / 2) : n);

		// ---------------------------------------------------------------- drawing helpers
		const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
		const ease = (v: number) => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
		function lin(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
			const g = c.createLinearGradient(x0, y0, x1, y1);
			for (const [o, col] of stops) g.addColorStop(o, col);
			return g;
		}
		function rad(c: CanvasRenderingContext2D, x: number, y: number, r0: number, r1: number, stops: [number, string][]) {
			const g = c.createRadialGradient(x, y, r0, x, y, r1);
			for (const [o, col] of stops) g.addColorStop(o, col);
			return g;
		}
		function paint(c: CanvasRenderingContext2D, fill: string | CanvasGradient, lw = 3, stroke = O) {
			c.fillStyle = fill;
			c.fill();
			if (lw > 0) {
				c.lineWidth = lw;
				c.strokeStyle = stroke;
				c.lineJoin = 'round';
				c.stroke();
			}
		}
		function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
			c.beginPath();
			c.roundRect(x, y, w, h, r);
		}
		function text(c: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = 'center', weight = 800) {
			c.font = `${weight} ${size}px ${FONT}`;
			c.textAlign = align;
			c.textBaseline = 'middle';
			c.lineJoin = 'round';
			c.lineWidth = Math.max(3, size * 0.24);
			c.strokeStyle = O;
			c.strokeText(str, x, y);
			c.fillStyle = color;
			c.fillText(str, x, y);
		}
		function blob(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, jag: number, rand: () => number) {
			c.beginPath();
			for (let i = 0; i < n; i++) {
				const a = (i / n) * TAU;
				const rr2 = r * (1 - jag + rand() * jag * 2);
				const x = cx + Math.cos(a) * rr2;
				const y = cy + Math.sin(a) * rr2;
				if (i) c.lineTo(x, y);
				else c.moveTo(x, y);
			}
			c.closePath();
		}

		// ---------------------------------------------------------------- the static street (drawn once per size)
		let far: HTMLCanvasElement | null = null;
		let near: HTMLCanvasElement | null = null;
		let front: HTMLCanvasElement | null = null;
		let scale = 1;
		function layer(draw: (c: CanvasRenderingContext2D) => void) {
			const cv = document.createElement('canvas');
			cv.width = canvas.width;
			cv.height = canvas.height;
			const c = cv.getContext('2d')!;
			c.setTransform(scale, 0, 0, scale, 0, 0);
			draw(c);
			return cv;
		}

		function drawFar(c: CanvasRenderingContext2D) {
			const r = rng((seed ^ 0x9e3779b9) >>> 0);
			c.fillStyle = lin(c, 0, 0, 0, 520, [
				[0, '#10031c'],
				[0.35, '#330c3c'],
				[0.62, '#7d2453'],
				[0.8, '#de5a3f'],
				[0.93, '#ffb257']
			]);
			c.fillRect(0, 0, W, H);
			for (let i = 0; i < 46; i++) {
				const y = r() * 220;
				c.globalAlpha = 0.25 + r() * 0.6 * (1 - y / 240);
				c.fillStyle = '#ffe9c8';
				c.beginPath();
				c.arc(r() * W, y, 0.6 + r() * 1.3, 0, TAU);
				c.fill();
			}
			c.globalAlpha = 1;
			c.fillStyle = rad(c, 380, 470, 0, 300, [
				[0, 'rgba(255,200,110,0.6)'],
				[0.4, 'rgba(255,120,70,0.22)'],
				[1, 'rgba(255,90,60,0)']
			]);
			c.fillRect(0, 160, W, 360);
			c.beginPath();
			c.arc(380, 452, 50, 0, TAU);
			c.fillStyle = rad(c, 372, 440, 4, 54, [
				[0, '#fff6c8'],
				[0.6, '#ffc35a'],
				[1, '#ff8a3a']
			]);
			c.fill();
			// two rows of ruined skyline, the far one hazy
			for (const [col, lo, hi, lit] of [
				['#5c1e52', 70, 170, 0],
				['#2a0b2c', 40, 120, 0.5]
			] as [string, number, number, number][]) {
				let x = -20;
				while (x < W + 20) {
					const w = 34 + r() * 62;
					const h = lo + r() * (hi - lo);
					const top = 506 - h;
					c.beginPath();
					c.moveTo(x, 510);
					c.lineTo(x, top + r() * 10);
					const steps = 3 + Math.floor(r() * 4);
					for (let k = 1; k < steps; k++) c.lineTo(x + (w * k) / steps, top + (r() < 0.45 ? r() * 26 : r() * 6));
					c.lineTo(x + w, top + r() * 12);
					c.lineTo(x + w, 510);
					c.closePath();
					c.fillStyle = col;
					c.fill();
					if (lit && r() < 0.8) {
						for (let k = 0; k < 6; k++) {
							if (r() > lit) continue;
							c.fillStyle = r() < 0.5 ? '#ffb44a' : '#ff7a3a';
							c.globalAlpha = 0.5 + r() * 0.5;
							c.fillRect(x + 6 + r() * (w - 14), top + 16 + r() * (h - 30), 4, 5);
						}
						c.globalAlpha = 1;
					}
					if (r() < 0.25) {
						c.strokeStyle = col;
						c.lineWidth = 2;
						c.beginPath();
						c.moveTo(x + w * 0.6, top + 4);
						c.lineTo(x + w * 0.6 + 3, top - 22 - r() * 16);
						c.stroke();
					}
					x += w + r() * 8;
				}
			}
			c.fillStyle = lin(c, 0, 430, 0, 510, [
				[0, 'rgba(255,120,80,0)'],
				[1, 'rgba(255,140,90,0.28)']
			]);
			c.fillRect(0, 430, W, 80);
		}

		function bricks(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
			c.fillStyle = '#8c3f30';
			c.fillRect(x, y, w, h);
			c.strokeStyle = 'rgba(40,14,10,0.6)';
			c.lineWidth = 1.2;
			for (let yy = y, row = 0; yy < y + h; yy += 8, row++) {
				c.beginPath();
				c.moveTo(x, yy);
				c.lineTo(x + w, yy);
				c.stroke();
				for (let xx = x + (row % 2) * 9; xx < x + w; xx += 18) {
					c.beginPath();
					c.moveTo(xx, yy);
					c.lineTo(xx, yy + 8);
					c.stroke();
				}
			}
		}

		function drawNear(c: CanvasRenderingContext2D) {
			const r = rng((seed ^ 0x2545f491) >>> 0);
			// rubble mounds and a broken wall behind the street
			c.fillStyle = '#3a1f36';
			for (let i = 0; i < 7; i++) {
				const x = 170 + r() * 420;
				blob(c, x, 504, 26 + r() * 30, 9, 0.35, r);
				c.fill();
			}
			c.beginPath();
			c.moveTo(186, 500);
			c.lineTo(186, 468);
			c.lineTo(214, 462);
			c.lineTo(232, 474);
			c.lineTo(262, 458);
			c.lineTo(300, 470);
			c.lineTo(318, 500);
			c.closePath();
			c.fillStyle = lin(c, 0, 456, 0, 500, [
				[0, '#6b3a48'],
				[1, '#3a1d2c']
			]);
			c.fill();
			c.lineWidth = 2.5;
			c.strokeStyle = O;
			c.stroke();
			// a bent street lamp
			c.lineCap = 'round';
			c.strokeStyle = O;
			c.lineWidth = 7;
			c.beginPath();
			c.moveTo(196, 500);
			c.lineTo(196, 330);
			c.quadraticCurveTo(198, 306, 222, 312);
			c.stroke();
			c.strokeStyle = '#4c3a52';
			c.lineWidth = 3.5;
			c.stroke();
			c.beginPath();
			c.ellipse(226, 316, 9, 5, 0.4, 0, TAU);
			paint(c, '#2b2230', 2.5);

			// the street
			c.fillStyle = lin(c, 0, 496, 0, 520, [
				[0, '#5a4256'],
				[1, '#3e2c40']
			]);
			c.fillRect(0, 496, W, 24);
			c.fillStyle = '#7a5f72';
			c.fillRect(0, 494, W, 3);
			c.fillStyle = lin(c, 0, 518, 0, H, [
				[0, '#2e2433'],
				[1, '#120c16']
			]);
			c.fillRect(0, 518, W, H - 518);
			c.fillStyle = '#9a7f8a';
			c.fillRect(0, 517, W, 2.5);
			c.fillStyle = 'rgba(232,190,90,0.38)';
			for (let x = 210; x < W; x += 74) c.fillRect(x, 566, 38, 5);
			c.strokeStyle = 'rgba(0,0,0,0.5)';
			c.lineWidth = 1.5;
			for (let i = 0; i < 9; i++) {
				let x = 200 + r() * 580;
				let y = 528 + r() * 64;
				c.beginPath();
				c.moveTo(x, y);
				for (let k = 0; k < 4; k++) {
					x += 6 + r() * 14;
					y += (r() - 0.5) * 10;
					c.lineTo(x, y);
				}
				c.stroke();
			}
			// a puddle with the sky in it
			c.beginPath();
			c.ellipse(470, 584, 70, 9, 0, 0, TAU);
			c.fillStyle = lin(c, 0, 576, 0, 592, [
				[0, '#ff9a5a'],
				[1, '#5a1f4a']
			]);
			c.globalAlpha = 0.45;
			c.fill();
			c.globalAlpha = 1;

			// the building
			const top = ROOF_Y;
			c.fillStyle = lin(c, bx, 0, bx + G.BUILDING_W, 0, [
				[0, '#a07f8c'],
				[0.18, '#8a6a7a'],
				[1, '#5a4256']
			]);
			c.fillRect(bx, top, G.BUILDING_W, GROUND - top);
			c.save();
			c.beginPath();
			c.rect(bx, top, G.BUILDING_W, GROUND - top);
			c.clip();
			// plaster gone: bricks show through
			for (const [px, py, pr] of [
				[bx + 150, top + 60, 26],
				[bx + 20, top + 240, 20],
				[bx + 120, top + 200, 14]
			]) {
				const k = Math.floor(px * 7 + py);
				c.save();
				blob(c, px, py, pr, 10, 0.3, rng(k));
				c.clip();
				bricks(c, px - pr - 4, py - pr - 4, pr * 2 + 8, pr * 2 + 8);
				c.restore();
				blob(c, px, py, pr, 10, 0.3, rng(k));
				c.lineWidth = 2;
				c.strokeStyle = 'rgba(30,10,20,0.7)';
				c.stroke();
			}
			// a shell hole in the corner
			c.beginPath();
			c.moveTo(bx + G.BUILDING_W, top + 8);
			c.lineTo(bx + 168, top + 14);
			c.lineTo(bx + 160, top + 34);
			c.lineTo(bx + 172, top + 52);
			c.lineTo(bx + G.BUILDING_W, top + 46);
			c.closePath();
			c.fillStyle = '#1a0a18';
			c.fill();
			c.strokeStyle = '#2a1018';
			c.lineWidth = 1.6;
			for (const [x1, y1, x2, y2] of [
				[bx + 166, top + 20, bx + 176, top + 34],
				[bx + 164, top + 40, bx + 180, top + 44]
			]) {
				c.beginPath();
				c.moveTo(x1, y1);
				c.lineTo(x2, y2);
				c.stroke();
			}
			// cornices between the floors
			for (const y of [284, 388]) {
				c.fillStyle = '#b89aa6';
				c.fillRect(bx, y, G.BUILDING_W, 8);
				c.fillStyle = 'rgba(30,10,30,0.45)';
				c.fillRect(bx, y + 8, G.BUILDING_W, 4);
			}
			// bullet holes and cracks
			for (let i = 0; i < 16; i++) {
				const x = bx + 8 + r() * (G.BUILDING_W - 16);
				const y = top + 20 + r() * 230;
				c.beginPath();
				c.arc(x, y, 1.6 + r() * 1.6, 0, TAU);
				c.fillStyle = '#1a0a18';
				c.fill();
				c.beginPath();
				c.arc(x - 0.6, y - 0.6, 3.2, Math.PI, Math.PI * 1.7);
				c.strokeStyle = 'rgba(255,230,230,0.35)';
				c.lineWidth = 1;
				c.stroke();
			}
			// shop front: torn awning, a burger neon sign, boarded window, door
			c.fillStyle = '#1e0f1c';
			c.fillRect(bx + 14, 434, 68, 70);
			for (let k = 0; k < 4; k++) {
				c.save();
				c.translate(bx + 48, 446 + k * 16);
				c.rotate(k % 2 ? 0.08 : -0.06);
				rr(c, -38, -5, 76, 11, 2);
				paint(c, lin(c, 0, -5, 0, 6, [
					[0, '#a8743e'],
					[1, '#6a4420']
				]), 2);
				c.restore();
			}
			rr(c, bx + 102, 430, 64, 90, [8, 8, 0, 0]);
			paint(c, lin(c, 0, 430, 0, 520, [
				[0, '#2a1426'],
				[1, '#0e0610']
			]), 3);
			c.fillStyle = 'rgba(255,190,90,0.25)';
			c.fillRect(bx + 110, 444, 48, 30);
			c.restore();
			c.lineWidth = 3;
			c.strokeStyle = O;
			c.strokeRect(bx, top, G.BUILDING_W, GROUND - top);
			// awning
			for (let k = 0; k < 9; k++) {
				c.beginPath();
				const x0 = bx + 8 + k * 19.5;
				c.moveTo(x0, 404);
				c.lineTo(x0 + 19.5, 404);
				c.lineTo(x0 + 19.5 + (k === 6 ? -6 : 0), 422 + (k === 6 ? 10 : 0));
				c.lineTo(x0, 422 + (k === 7 ? 6 : 0));
				c.closePath();
				c.fillStyle = k % 2 ? '#f3e6d6' : '#d8332a';
				c.fill();
			}
			c.beginPath();
			c.rect(bx + 8, 404, 175, 18);
			c.lineWidth = 2.5;
			c.strokeStyle = O;
			c.stroke();
			rr(c, bx + 36, 396, 118, 26, 6);
			paint(c, '#1a0820', 3);
			c.save();
			c.shadowColor = '#ff4fb8';
			c.shadowBlur = 12;
			c.font = `900 19px ${FONT}`;
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.fillStyle = '#ff9ad8';
			c.fillText(s.sign, bx + 95, 410);
			c.restore();
			// window casings and stone sills (the openings are drawn live)
			for (const wr of level.windows) {
				rr(c, wr.x - 6, wr.y - 7, wr.w + 12, wr.h + 10, 3);
				paint(c, lin(c, 0, wr.y - 7, 0, wr.y + wr.h, [
					[0, '#c9b0b8'],
					[1, '#8a6f7c']
				]), 2.5);
				c.fillStyle = '#12060f';
				c.fillRect(wr.x, wr.y, wr.w, wr.h);
				rr(c, wr.x - 8, wr.y + wr.h, wr.w + 16, 9, 2);
				paint(c, lin(c, 0, wr.y + wr.h, 0, wr.y + wr.h + 9, [
					[0, '#e2cdd2'],
					[1, '#9a7f8a']
				]), 2.5);
			}
			// the roof's flagpole
			c.lineCap = 'round';
			c.strokeStyle = O;
			c.lineWidth = 6;
			c.beginPath();
			c.moveTo(bx + 16, ROOF_Y - 14);
			c.lineTo(bx + 16, ROOF_Y - 78);
			c.stroke();
			c.strokeStyle = '#c9ced6';
			c.lineWidth = 2.6;
			c.stroke();
			c.beginPath();
			c.arc(bx + 16, ROOF_Y - 80, 4, 0, TAU);
			paint(c, '#ffd23a', 2);
			// the operator's spot: a dirt slope
			c.beginPath();
			c.moveTo(0, 470);
			c.quadraticCurveTo(90, 452, 196, 498);
			c.lineTo(196, 520);
			c.lineTo(0, 520);
			c.closePath();
			c.fillStyle = lin(c, 0, 456, 0, 520, [
				[0, '#5b3e2e'],
				[1, '#2e1d18']
			]);
			c.fill();
		}

		function sandbag(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tone = 0) {
			rr(c, x, y, w, h, [h * 0.5, h * 0.5, h * 0.42, h * 0.42]);
			paint(c, lin(c, 0, y, 0, y + h, [
				[0, tone ? '#e2cc94' : '#d7bf86'],
				[0.55, tone ? '#b39466' : '#a88a58'],
				[1, '#6e5634']
			]), 2.6);
			c.beginPath();
			c.moveTo(x + w * 0.22, y + h * 0.3);
			c.quadraticCurveTo(x + w * 0.5, y + h * 0.18, x + w * 0.78, y + h * 0.3);
			c.strokeStyle = 'rgba(255,248,220,0.55)';
			c.lineWidth = 2;
			c.stroke();
			c.beginPath();
			c.moveTo(x + w * 0.86, y + h * 0.3);
			c.lineTo(x + w * 0.86, y + h * 0.72);
			c.strokeStyle = 'rgba(60,40,20,0.5)';
			c.lineWidth = 1.4;
			c.stroke();
		}

		function drawCover(c: CanvasRenderingContext2D, cv: G.Cover) {
			const { x, y, w, h } = cv;
			c.beginPath();
			c.ellipse(x + w / 2, GROUND + 2, w * 0.56, 5, 0, 0, TAU);
			c.fillStyle = 'rgba(0,0,0,0.4)';
			c.fill();
			if (cv.kind === 'sandbags') {
				const bw = w / 3;
				for (let i = 0; i < 3; i++) sandbag(c, x + i * bw - 1, y + h / 2, bw + 2, h / 2, i % 2);
				for (let i = 0; i < 2; i++) sandbag(c, x + bw * 0.5 + i * bw - 1, y, bw + 2, h / 2 + 2, (i + 1) % 2);
			} else if (cv.kind === 'crates') {
				rr(c, x, y, w, h, 3);
				paint(c, lin(c, 0, y, 0, y + h, [
					[0, '#d79a52'],
					[1, '#8a5626']
				]), 3);
				c.strokeStyle = 'rgba(70,35,10,0.75)';
				c.lineWidth = 2;
				for (let k = 1; k < 3; k++) {
					c.beginPath();
					c.moveTo(x + 3, y + (h * k) / 3);
					c.lineTo(x + w - 3, y + (h * k) / 3);
					c.stroke();
				}
				c.lineWidth = 5;
				c.strokeStyle = O;
				c.beginPath();
				c.moveTo(x + 6, y + 6);
				c.lineTo(x + w - 6, y + h - 6);
				c.stroke();
				c.lineWidth = 3;
				c.strokeStyle = '#b8783a';
				c.stroke();
				rr(c, x + 1.5, y + 1.5, 8, h - 3, 1);
				paint(c, '#9a6230', 1.5);
				rr(c, x + w - 9.5, y + 1.5, 8, h - 3, 1);
				paint(c, '#9a6230', 1.5);
				// a burger stencil, because munchies
				c.save();
				c.globalAlpha = 0.55;
				c.fillStyle = '#3a1a08';
				c.beginPath();
				c.arc(x + w / 2 + 12, y + 14, 6, Math.PI, 0);
				c.fill();
				c.fillRect(x + w / 2 + 5, y + 15, 14, 2.6);
				c.fillRect(x + w / 2 + 6, y + 19, 12, 2.6);
				c.restore();
			} else if (cv.kind === 'barrier') {
				c.beginPath();
				c.moveTo(x, GROUND);
				c.lineTo(x + 6, y + h * 0.45);
				c.lineTo(x + w * 0.3, y);
				c.lineTo(x + w * 0.7, y);
				c.lineTo(x + w - 6, y + h * 0.45);
				c.lineTo(x + w, GROUND);
				c.closePath();
				paint(c, lin(c, 0, y, 0, GROUND, [
					[0, '#d9d2d6'],
					[1, '#7e7480']
				]), 3);
				c.save();
				c.clip();
				for (let k = -2; k < 9; k++) {
					c.beginPath();
					const sx = x + k * 14;
					c.moveTo(sx, y + h * 0.42);
					c.lineTo(sx + 8, y + h * 0.42);
					c.lineTo(sx + 16, y + h * 0.66);
					c.lineTo(sx + 8, y + h * 0.66);
					c.closePath();
					c.fillStyle = k % 2 ? '#1a1416' : '#ffc928';
					c.fill();
				}
				c.restore();
				c.beginPath();
				c.moveTo(x + w * 0.3 + 4, y + 3);
				c.lineTo(x + w * 0.7 - 4, y + 3);
				c.strokeStyle = 'rgba(255,255,255,0.6)';
				c.lineWidth = 2;
				c.stroke();
			} else if (cv.kind === 'car') {
				c.beginPath();
				c.moveTo(x + 2, GROUND - 10);
				c.lineTo(x + 2, y + 20);
				c.quadraticCurveTo(x + 4, y + 14, x + 14, y + 13);
				c.lineTo(x + 24, y + 1);
				c.lineTo(x + 58, y + 1);
				c.lineTo(x + 70, y + 13);
				c.quadraticCurveTo(x + w - 2, y + 15, x + w - 2, y + 24);
				c.lineTo(x + w - 2, GROUND - 10);
				c.closePath();
				paint(c, lin(c, 0, y, 0, GROUND, [
					[0, '#5a4650'],
					[0.6, '#3a2c34'],
					[1, '#221a20']
				]), 3);
				c.fillStyle = 'rgba(160,70,30,0.65)';
				for (const [rx, ry, rs] of [
					[x + 18, y + 26, 7],
					[x + 60, y + 30, 9],
					[x + 40, y + 20, 4]
				]) {
					blob(c, rx, ry, rs, 8, 0.4, r0);
					c.fill();
				}
				// smashed windows
				c.beginPath();
				c.moveTo(x + 26, y + 5);
				c.lineTo(x + 39, y + 5);
				c.lineTo(x + 39, y + 13);
				c.lineTo(x + 17, y + 13);
				c.closePath();
				c.moveTo(x + 43, y + 5);
				c.lineTo(x + 56, y + 5);
				c.lineTo(x + 65, y + 13);
				c.lineTo(x + 43, y + 13);
				c.closePath();
				paint(c, '#140c14', 1.5);
				c.fillStyle = 'rgba(200,220,255,0.35)';
				c.beginPath();
				c.moveTo(x + 28, y + 6);
				c.lineTo(x + 33, y + 6);
				c.lineTo(x + 27, y + 12);
				c.closePath();
				c.fill();
				for (const wx of [x + 20, x + w - 20]) {
					c.beginPath();
					c.arc(wx, GROUND - 8, 9, 0, TAU);
					paint(c, '#1a1216', 2.5);
					c.beginPath();
					c.arc(wx, GROUND - 8, 4, 0, TAU);
					paint(c, '#7a6a70', 1.5);
				}
			} else {
				// dumpster
				c.beginPath();
				c.moveTo(x + 4, GROUND - 6);
				c.lineTo(x, y + 8);
				c.lineTo(x + w, y + 8);
				c.lineTo(x + w - 4, GROUND - 6);
				c.closePath();
				paint(c, lin(c, 0, y, 0, GROUND, [
					[0, '#4a9a5a'],
					[1, '#1e4a2a']
				]), 3);
				c.beginPath();
				c.moveTo(x - 3, y + 8);
				c.lineTo(x + 6, y - 2);
				c.lineTo(x + w + 2, y + 4);
				c.lineTo(x + w + 3, y + 9);
				c.closePath();
				paint(c, '#2a6a3a', 2.5);
				c.strokeStyle = 'rgba(10,30,15,0.6)';
				c.lineWidth = 2;
				for (let k = 1; k < 4; k++) {
					c.beginPath();
					c.moveTo(x + (w * k) / 4, y + 12);
					c.lineTo(x + (w * k) / 4, GROUND - 10);
					c.stroke();
				}
				c.fillStyle = 'rgba(150,80,30,0.55)';
				c.fillRect(x + 10, y + 18, 3, 16);
				c.fillRect(x + w - 20, y + 14, 3, 12);
				for (const wx of [x + 10, x + w - 10]) {
					c.beginPath();
					c.arc(wx, GROUND - 4, 4.5, 0, TAU);
					paint(c, '#1a1216', 2);
				}
			}
		}
		let r0 = rng(1);

		function drawFront(c: CanvasRenderingContext2D) {
			r0 = rng((seed ^ 0x7f4a7c15) >>> 0);
			// the roof's parapet: hides the roof sniper's legs
			c.beginPath();
			c.moveTo(bx - 6, ROOF_Y + 2);
			c.lineTo(bx - 6, ROOF_Y - 18);
			c.lineTo(bx + 60, ROOF_Y - 18);
			c.lineTo(bx + 66, ROOF_Y - 12);
			c.lineTo(bx + 74, ROOF_Y - 17);
			c.lineTo(bx + 140, ROOF_Y - 18);
			c.lineTo(bx + 146, ROOF_Y - 10);
			c.lineTo(bx + 156, ROOF_Y - 18);
			c.lineTo(bx + G.BUILDING_W + 6, ROOF_Y - 18);
			c.lineTo(bx + G.BUILDING_W + 6, ROOF_Y + 2);
			c.closePath();
			paint(c, lin(c, 0, ROOF_Y - 18, 0, ROOF_Y + 2, [
				[0, '#c9b0b8'],
				[1, '#7a5f6c']
			]), 3);
			c.fillStyle = 'rgba(255,240,240,0.45)';
			c.fillRect(bx - 4, ROOF_Y - 16, 62, 2.5);
			c.fillRect(bx + 76, ROOF_Y - 16, 62, 2.5);
			for (const cv of level.covers) drawCover(c, cv);
			// the operator's sandbag wall
			c.beginPath();
			c.ellipse(122, GROUND + 2, 70, 6, 0, 0, TAU);
			c.fillStyle = 'rgba(0,0,0,0.4)';
			c.fill();
			for (let i = 0; i < 4; i++) sandbag(c, 60 + i * 31, 490, 34, 30, i % 2);
			for (let i = 0; i < 4; i++) sandbag(c, 66 + i * 30, 461, 33, 31, (i + 1) % 2);
			for (let i = 0; i < 3; i++) sandbag(c, 76 + i * 32, 433, 35, 31, i % 2);
		}

		// ---------------------------------------------------------------- live drawings
		/** a plywood enemy: post, board, painted soldier, bullseye. (x, base) = the ground point under it */
		function board(c: CanvasRenderingContext2D, x: number, base: number, up: number, flip: number, hurt: number, sc = 1, rifle = false) {
			const k = flip * Math.cos(Math.min(1, hurt) * (Math.PI / 2));
			if (k < 0.03) return;
			c.save();
			c.translate(x, base + (1 - up) * G.BOARD.drop * sc);
			c.scale(sc, sc * k);
			if (hurt > 0) c.rotate(-hurt * 0.25);
			rr(c, -4, -26, 8, 26, 2);
			paint(c, '#5b3b1d', 2.5);
			if (rifle) {
				c.lineCap = 'round';
				c.strokeStyle = O;
				c.lineWidth = 7;
				c.beginPath();
				c.moveTo(4, -50);
				c.lineTo(-58, -44);
				c.stroke();
				c.strokeStyle = '#3a3f46';
				c.lineWidth = 3.5;
				c.stroke();
				rr(c, -26, -56, 16, 6, 2);
				paint(c, '#2a2e34', 2);
			}
			// the board's outline in one go, then the plywood
			const shape = () => {
				c.beginPath();
				c.roundRect(-21, -68, 42, 46, [12, 12, 4, 4]);
				c.rect(-6, -76, 12, 10);
				c.moveTo(11, -82);
				c.arc(0, -82, 11, 0, TAU);
				c.moveTo(15, -84);
				c.ellipse(0, -84, 15, 14, 0, Math.PI, TAU);
				c.rect(-16, -86, 32, 5);
			};
			shape();
			c.lineWidth = 6;
			c.strokeStyle = O;
			c.lineJoin = 'round';
			c.stroke();
			c.fillStyle = lin(c, 0, -98, 0, -22, [
				[0, '#f0cf96'],
				[1, '#c49058']
			]);
			c.fill();
			// painted soldier
			rr(c, -18, -65, 36, 40, [10, 10, 3, 3]);
			c.fillStyle = lin(c, -18, 0, 18, 0, [
				[0, '#56683a'],
				[1, '#33421f']
			]);
			c.fill();
			c.fillStyle = 'rgba(25,35,12,0.7)';
			c.beginPath();
			c.ellipse(-8, -40, 6, 4, 0.5, 0, TAU);
			c.ellipse(9, -30, 5, 3.5, -0.4, 0, TAU);
			c.fill();
			c.beginPath();
			c.ellipse(0, -84, 12.5, 11.5, 0, Math.PI, TAU);
			c.fillStyle = '#2f3d1c';
			c.fill();
			c.beginPath();
			c.ellipse(-3, -90, 6, 3, -0.3, Math.PI, TAU);
			c.strokeStyle = 'rgba(200,220,150,0.5)';
			c.lineWidth = 1.6;
			c.stroke();
			c.beginPath();
			c.arc(0, -79, 8.5, 0, TAU);
			c.fillStyle = '#26232c';
			c.fill();
			c.fillStyle = '#ff3b2f';
			c.beginPath();
			c.ellipse(-3.6, -80, 2.2, 1.6, 0, 0, TAU);
			c.ellipse(3.6, -80, 2.2, 1.6, 0, 0, TAU);
			c.fill();
			// bullseye
			c.beginPath();
			c.arc(0, -G.BOARD.eye, 10, 0, TAU);
			paint(c, '#e3342b', 1.6);
			c.beginPath();
			c.arc(0, -G.BOARD.eye, 6.5, 0, TAU);
			c.fillStyle = '#fff3e0';
			c.fill();
			c.beginPath();
			c.arc(0, -G.BOARD.eye, 3, 0, TAU);
			c.fillStyle = '#e3342b';
			c.fill();
			c.fillStyle = '#7a5226';
			for (const [bx2, by] of [
				[-16, -62],
				[16, -62],
				[-16, -28],
				[16, -28]
			]) {
				c.beginPath();
				c.arc(bx2, by, 1.4, 0, TAU);
				c.fill();
			}
			if (hurt > 0) {
				c.globalAlpha = Math.min(0.6, hurt);
				shape();
				c.fillStyle = '#1a0a06';
				c.fill();
				c.globalAlpha = 1;
			}
			c.restore();
		}

		function drawGrenade(c: CanvasRenderingContext2D, x: number, y: number, rot: number, sc = 1, fuse = -1, spoon = false) {
			c.save();
			c.translate(x, y);
			c.rotate(rot);
			c.scale(sc, sc);
			if (spoon) {
				c.beginPath();
				c.moveTo(1, -10);
				c.quadraticCurveTo(10, -9, 8.5, 2);
				c.lineWidth = 4.4;
				c.strokeStyle = O;
				c.lineCap = 'round';
				c.stroke();
				c.lineWidth = 2;
				c.strokeStyle = '#b8c0c8';
				c.stroke();
				c.beginPath();
				c.arc(-7, -11, 3.6, 0, TAU);
				c.lineWidth = 3.4;
				c.strokeStyle = O;
				c.stroke();
				c.lineWidth = 1.6;
				c.strokeStyle = '#ffd23a';
				c.stroke();
			}
			rr(c, -3.6, -13, 7.2, 6, 1.5);
			paint(c, lin(c, -4, 0, 4, 0, [
				[0, '#7c848c'],
				[0.5, '#e6eaee'],
				[1, '#5a6068']
			]), 2.2);
			c.beginPath();
			c.ellipse(0, 0, 8, 9.2, 0, 0, TAU);
			paint(c, rad(c, -3, -4, 1, 11, [
				[0, '#b9d27a'],
				[0.45, '#5e7a2e'],
				[1, '#26340f']
			]), 2.4);
			c.strokeStyle = 'rgba(20,30,8,0.65)';
			c.lineWidth = 1.3;
			c.beginPath();
			c.moveTo(-7.6, 0);
			c.lineTo(7.6, 0);
			c.moveTo(-6.4, -4.6);
			c.lineTo(6.4, -4.6);
			c.moveTo(-6.4, 4.6);
			c.lineTo(6.4, 4.6);
			c.moveTo(0, -9);
			c.lineTo(0, 9);
			c.stroke();
			c.beginPath();
			c.ellipse(-3, -4.5, 2.4, 1.6, -0.6, 0, TAU);
			c.fillStyle = 'rgba(255,255,230,0.55)';
			c.fill();
			if (fuse >= 0) {
				const rate = 3 + fuse * 14;
				const on = Math.sin(clock * rate * TAU) > 0;
				if (on) {
					c.beginPath();
					c.arc(0, -14, 6, 0, TAU);
					c.fillStyle = rad(c, 0, -14, 0, 6, [
						[0, 'rgba(255,90,60,0.95)'],
						[1, 'rgba(255,40,30,0)']
					]);
					c.fill();
				}
			}
			c.restore();
		}

		function drawFlag(c: CanvasRenderingContext2D, wind: number) {
			const px = bx + 16;
			const top = ROOF_Y - 74;
			const dir = wind >= 0 ? 1 : -1;
			const ext = Math.min(1, Math.abs(wind) / 95 + 0.1);
			const L = 50;
			const Wd = 26;
			const N = 10;
			const pts: [number, number][] = [];
			for (let i = 0; i <= N; i++) {
				const u = i / N;
				const wave = Math.sin(clock * (5 + ext * 7) - u * 5.2) * (1.5 + ext * 3) * u;
				pts.push([px + dir * L * u * (0.22 + 0.78 * ext), top + (1 - ext) * L * u * 0.95 + wave]);
			}
			const edge = (f: number) => pts.map(([x, y], i) => [x - dir * (1 - ext) * f * 4 * (i / N), y + Wd * f] as [number, number]);
			const fill = (a: number, b: number, col: string) => {
				const A = edge(a);
				const B = edge(b);
				c.beginPath();
				A.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
				for (let i = B.length - 1; i >= 0; i--) c.lineTo(B[i][0], B[i][1]);
				c.closePath();
				c.fillStyle = col;
				c.fill();
			};
			fill(0, 1, '#ff4a2a');
			fill(0.36, 0.64, '#ffd23a');
			const A = edge(0);
			const B = edge(1);
			c.beginPath();
			A.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
			for (let i = B.length - 1; i >= 0; i--) c.lineTo(B[i][0], B[i][1]);
			c.closePath();
			c.lineWidth = 2.6;
			c.strokeStyle = O;
			c.stroke();
		}

		function drawWindows(c: CanvasRenderingContext2D, round: G.Round, flip: number) {
			level.windows.forEach((wr, idx) => {
				const plan = round.windows.find((p) => p.idx === idx);
				const tgId = `w${idx}`;
				const dead = gone.get(tgId);
				let o = plan ? G.windowOpen(plan, rt) * flip : 0;
				if (dead !== undefined) o = 1;
				c.save();
				c.beginPath();
				c.rect(wr.x, wr.y, wr.w, wr.h);
				c.clip();
				c.fillStyle = lin(c, 0, wr.y, 0, wr.y + wr.h, [
					[0, '#3a1420'],
					[1, '#14060c']
				]);
				c.fillRect(wr.x, wr.y, wr.w, wr.h);
				c.fillStyle = rad(c, wr.x + wr.w * 0.6, wr.y + 14, 0, 40, [
					[0, 'rgba(255,170,90,0.45)'],
					[1, 'rgba(255,120,60,0)']
				]);
				c.fillRect(wr.x, wr.y, wr.w, wr.h);
				if (plan && dead === undefined && o > 0.02) {
					board(c, wr.x + wr.w / 2, wr.y + 96 + (1 - o) * 26, 1, 1, 0, 1);
				}
				if (dead !== undefined) {
					const t = rt - dead;
					const fl = 0.55 + 0.25 * Math.sin(clock * 21 + idx) + 0.2 * Math.sin(clock * 13);
					c.fillStyle = rad(c, wr.x + wr.w / 2, wr.y + wr.h, 0, 50, [
						[0, `rgba(255,220,120,${0.9 * fl})`],
						[0.5, `rgba(255,110,40,${0.6 * fl})`],
						[1, 'rgba(120,20,10,0)']
					]);
					c.fillRect(wr.x, wr.y, wr.w, wr.h);
					if (t < 0.25) {
						c.fillStyle = `rgba(255,250,220,${1 - t / 0.25})`;
						c.fillRect(wr.x, wr.y, wr.w, wr.h);
					}
				}
				if (nade?.caught?.kind === 'window' && nade.caught.idx === idx) {
					drawGrenade(c, wr.x + wr.w / 2, wr.y + wr.h - G.NADE_R - 4, 0.3, 1, nade.t / G.FUSE);
				}
				if (!plan) {
					// boarded up for this round
					for (const [yy, a] of [
						[0.25, -0.12],
						[0.55, 0.1],
						[0.82, -0.05]
					]) {
						c.save();
						c.translate(wr.x + wr.w / 2, wr.y + wr.h * yy);
						c.rotate(a);
						rr(c, -wr.w * 0.62, -6, wr.w * 1.24, 12, 2);
						paint(c, lin(c, 0, -6, 0, 6, [
							[0, '#b08050'],
							[1, '#6a4422']
						]), 2);
						c.fillStyle = '#d8d0c8';
						c.fillRect(-wr.w * 0.45, -1.5, 3, 3);
						c.fillRect(wr.w * 0.42, -1.5, 3, 3);
						c.restore();
					}
				} else {
					// shutters fold away to the sides as it opens
					const pw = (wr.w / 2) * (1 - o * 0.84);
					const char = dead !== undefined;
					for (const side of [0, 1]) {
						const sx = side ? wr.x + wr.w - pw : wr.x;
						c.beginPath();
						c.rect(sx, wr.y, pw, wr.h);
						paint(c, char ? '#2a1a14' : lin(c, sx, 0, sx + pw, 0, [
							[0, '#3f8a80'],
							[1, '#245650']
						]), 2.2);
						c.strokeStyle = char ? 'rgba(0,0,0,0.5)' : 'rgba(10,40,36,0.7)';
						c.lineWidth = 1.4;
						for (let yy = wr.y + 7; yy < wr.y + wr.h - 3; yy += 7) {
							c.beginPath();
							c.moveTo(sx + 2, yy);
							c.lineTo(sx + pw - 2, yy);
							c.stroke();
						}
					}
				}
				c.restore();
				c.lineWidth = 3;
				c.strokeStyle = O;
				c.strokeRect(wr.x, wr.y, wr.w, wr.h);
			});
		}

		function drawBarrel(c: CanvasRenderingContext2D, x: number) {
			const y = GROUND - G.BARREL_H;
			const w = G.BARREL_W;
			c.beginPath();
			c.ellipse(x + w / 2, GROUND + 2, w * 0.62, 5, 0, 0, TAU);
			c.fillStyle = 'rgba(0,0,0,0.4)';
			c.fill();
			// fire on top
			const glow = 0.8 + 0.2 * Math.sin(clock * 9);
			c.fillStyle = rad(c, x + w / 2, y - 6, 0, 60, [
				[0, `rgba(255,170,60,${0.42 * glow})`],
				[1, 'rgba(255,90,30,0)']
			]);
			c.fillRect(x - 40, y - 66, w + 80, 90);
			for (let k = 0; k < 4; k++) {
				const fx0 = x + 9 + k * 8.5;
				const hgt = 18 + 10 * Math.sin(clock * (7 + k * 1.7) + k * 2) + (k === 1 || k === 2 ? 8 : 0);
				const sway = Math.sin(clock * 5 + k) * 3;
				c.beginPath();
				c.moveTo(fx0 - 6, y + 2);
				c.quadraticCurveTo(fx0 - 7, y - hgt * 0.5, fx0 + sway, y - hgt);
				c.quadraticCurveTo(fx0 + 7, y - hgt * 0.5, fx0 + 6, y + 2);
				c.closePath();
				c.fillStyle = lin(c, 0, y - hgt, 0, y + 2, [
					[0, '#fff3a0'],
					[0.4, '#ffb030'],
					[1, '#ff4a1a']
				]);
				c.fill();
			}
			rr(c, x, y, w, G.BARREL_H, 5);
			paint(c, lin(c, x, 0, x + w, 0, [
				[0, '#7a2414'],
				[0.3, '#d2552e'],
				[0.55, '#e8703e'],
				[1, '#6a1c10']
			]), 3);
			c.strokeStyle = 'rgba(40,8,4,0.75)';
			c.lineWidth = 2.5;
			for (const yy of [y + 18, y + 40]) {
				c.beginPath();
				c.moveTo(x + 1, yy);
				c.lineTo(x + w - 1, yy);
				c.stroke();
			}
			// a painted hoop ring: it really is a basket
			c.beginPath();
			c.arc(x + w / 2, y + 29, 7, 0, TAU);
			c.lineWidth = 2.6;
			c.strokeStyle = '#fff3c8';
			c.stroke();
			c.beginPath();
			c.ellipse(x + w / 2, y + 1, w / 2 - 1, 5, 0, 0, TAU);
			paint(c, '#2a0a06', 2.6);
			c.beginPath();
			c.ellipse(x + w / 2, y + 2, w / 2 - 6, 2.6, 0, 0, TAU);
			c.fillStyle = `rgba(255,160,60,${0.7 * glow})`;
			c.fill();
		}

		function drawTruck(c: CanvasRenderingContext2D, round: G.Round) {
			const tr = round.truck;
			if (!tr) return;
			const { x, dir } = G.truckX(tr, rt);
			const p = G.truckParts(x);
			const dead = gone.get('truck');
			c.beginPath();
			c.ellipse(x + G.TRUCK_W / 2, GROUND + 3, G.TRUCK_W * 0.52, 6, 0, 0, TAU);
			c.fillStyle = 'rgba(0,0,0,0.45)';
			c.fill();
			// the rider stands in the bed (the side panel hides his post)
			if (dead === undefined) board(c, p.bed.x + p.bed.w / 2, p.bed.y, 1, introFlip(9), 0, G.TRUCK_SCALE);
			else if (rt - dead < 0.4) board(c, p.bed.x + p.bed.w / 2, p.bed.y, 1, 1, (rt - dead) / 0.3, G.TRUCK_SCALE);
			if (nade?.caught?.kind === 'truck') {
				const cp = G.caughtPos(level, round, nade, rt);
				c.beginPath();
				c.arc(cp.x, p.back.y - 6, 9 + 3 * Math.sin(clock * 20), 0, TAU);
				c.fillStyle = 'rgba(255,60,40,0.55)';
				c.fill();
			}
			// chassis + wheels
			rr(c, x + 2, GROUND - 42, G.TRUCK_W - 4, 18, 4);
			paint(c, '#22261a', 3);
			const spin = (x / 18) % TAU;
			for (const wx of [x + 38, x + 160]) {
				c.beginPath();
				c.arc(wx, GROUND - 18, 18, 0, TAU);
				paint(c, '#1a1a1c', 3);
				c.beginPath();
				c.arc(wx, GROUND - 18, 9, 0, TAU);
				paint(c, lin(c, wx - 9, 0, wx + 9, 0, [
					[0, '#6a7060'],
					[1, '#b8bea8']
				]), 2);
				c.strokeStyle = '#3a3e34';
				c.lineWidth = 2;
				for (let k = 0; k < 3; k++) {
					const a = spin + (k * TAU) / 3;
					c.beginPath();
					c.moveTo(wx, GROUND - 18);
					c.lineTo(wx + Math.cos(a) * 8, GROUND - 18 + Math.sin(a) * 8);
					c.stroke();
				}
			}
			// bed side panel
			rr(c, x, GROUND - 74, 138, 38, 3);
			paint(c, lin(c, 0, GROUND - 74, 0, GROUND - 36, [
				[0, dead === undefined ? '#6f8648' : '#3a3428'],
				[1, dead === undefined ? '#3a4a22' : '#1e1a14']
			]), 3);
			c.strokeStyle = 'rgba(20,30,10,0.6)';
			c.lineWidth = 2;
			for (let k = 1; k < 6; k++) {
				c.beginPath();
				c.moveTo(x + k * 23, GROUND - 71);
				c.lineTo(x + k * 23, GROUND - 39);
				c.stroke();
			}
			c.fillStyle = 'rgba(255,255,220,0.25)';
			c.fillRect(x + 3, GROUND - 71, 132, 3);
			// cab
			const cx = p.cab.x;
			c.beginPath();
			c.moveTo(cx, GROUND - 36);
			c.lineTo(cx, GROUND - 98);
			c.quadraticCurveTo(cx, GROUND - 104, cx + 8, GROUND - 104);
			c.lineTo(cx + 34, GROUND - 104);
			c.lineTo(cx + 50, GROUND - 74);
			c.lineTo(cx + 58, GROUND - 72);
			c.quadraticCurveTo(cx + 62, GROUND - 70, cx + 62, GROUND - 62);
			c.lineTo(cx + 62, GROUND - 36);
			c.closePath();
			paint(c, lin(c, 0, GROUND - 104, 0, GROUND - 36, [
				[0, dead === undefined ? '#7d9652' : '#3e3a2c'],
				[1, dead === undefined ? '#3e4e24' : '#1e1a14']
			]), 3);
			c.beginPath();
			c.moveTo(cx + 8, GROUND - 98);
			c.lineTo(cx + 31, GROUND - 98);
			c.lineTo(cx + 43, GROUND - 76);
			c.lineTo(cx + 8, GROUND - 76);
			c.closePath();
			paint(c, lin(c, cx, GROUND - 98, cx + 40, GROUND - 76, [
				[0, '#bfe6ff'],
				[1, '#4a7aa0']
			]), 2.4);
			c.fillStyle = 'rgba(255,255,255,0.5)';
			c.beginPath();
			c.moveTo(cx + 12, GROUND - 96);
			c.lineTo(cx + 18, GROUND - 96);
			c.lineTo(cx + 12, GROUND - 84);
			c.closePath();
			c.fill();
			c.beginPath();
			c.arc(cx + 58, GROUND - 58, 4.5, 0, TAU);
			paint(c, '#fff3b0', 2);
			c.fillStyle = 'rgba(255,240,170,0.18)';
			c.beginPath();
			c.moveTo(cx + 60, GROUND - 60);
			c.lineTo(cx + 110, GROUND - 74);
			c.lineTo(cx + 110, GROUND - 40);
			c.closePath();
			c.fill();
			// a white star on the door
			c.save();
			c.translate(cx + 22, GROUND - 58);
			c.beginPath();
			for (let k = 0; k < 10; k++) {
				const a = -Math.PI / 2 + (k * Math.PI) / 5;
				const rr3 = k % 2 ? 3.4 : 8;
				c.lineTo(Math.cos(a) * rr3, Math.sin(a) * rr3);
			}
			c.closePath();
			c.fillStyle = 'rgba(240,235,210,0.85)';
			c.fill();
			c.restore();
			// dust behind the wheels, exhaust while it drives
			if (!reduce && Math.abs(Math.sin((rt / tr.period + tr.phase) * TAU)) > 0.2 && fx() < 0.3) {
				add({ k: 'dust', x: dir > 0 ? x + 10 : x + G.TRUCK_W - 10, y: GROUND - 4, vx: -dir * (20 + fx() * 30), vy: -10 - fx() * 20, max: 0.9, size: 6 + fx() * 6, color: '#8a7466' });
			}
			if (dead !== undefined) {
				if (fx() < 0.5) add({ k: 'smoke', x: x + 40 + fx() * 80, y: GROUND - 74, vx: (fx() - 0.5) * 20, vy: -40 - fx() * 30, max: 1.6, size: 10 + fx() * 8, color: '#2a2228' });
				if (fx() < 0.4) add({ k: 'ember', x: x + 30 + fx() * 90, y: GROUND - 74, vx: (fx() - 0.5) * 30, vy: -60 - fx() * 60, max: 0.8, size: 2, color: '#ffb040' });
			}
		}

		let pullBack = 0;
		function handPos(): { s: { x: number; y: number }; h: { x: number; y: number } } {
			const bob = Math.sin(clock * 2.2) * 1.2;
			const S = { x: 106, y: 424 + bob };
			const rest = { x: 140, y: 428 + bob };
			const wind = { x: S.x - 30 - 8 * aimPower, y: S.y - 30 - 6 * aimPower };
			if (throwT >= 0 && throwT < 0.6) {
				const F = { x: S.x + throwDir.x * 40, y: S.y + throwDir.y * 40 };
				if (throwT < 0.16) {
					const a0 = Math.atan2(wind.y - S.y, wind.x - S.x);
					let a1 = Math.atan2(F.y - S.y, F.x - S.x);
					if (a1 < a0) a1 += TAU;
					const u = ease(throwT / 0.16);
					const a = a0 + (a1 - a0) * u;
					const len = 44 + (40 - 44) * u;
					return { s: S, h: { x: S.x + Math.cos(a) * len, y: S.y + Math.sin(a) * len } };
				}
				const u = ease((throwT - 0.16) / 0.44);
				return { s: S, h: { x: F.x + (rest.x - F.x) * u, y: F.y + (rest.y - F.y) * u } };
			}
			const show = phase === 'aim' && (dragging || keyAim) ? 1 : 0;
			pullBack += (show - pullBack) * 0.25;
			return { s: S, h: { x: rest.x + (wind.x - rest.x) * pullBack, y: rest.y + (wind.y - rest.y) * pullBack } };
		}

		function drawOperator(c: CanvasRenderingContext2D) {
			const bob = Math.sin(clock * 2.2) * 1.2;
			const { s: S, h: Hd } = handPos();
			c.save();
			c.translate(0, bob);
			// radio antenna + back
			c.lineCap = 'round';
			c.strokeStyle = O;
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(76, 440);
			c.quadraticCurveTo(66, 400, 58, 368);
			c.stroke();
			c.beginPath();
			c.arc(58, 366, 3, 0, TAU);
			paint(c, '#ff4a2a', 1.6);
			c.beginPath();
			c.moveTo(62, 474);
			c.bezierCurveTo(62, 440, 84, 418, 110, 416);
			c.bezierCurveTo(138, 416, 152, 436, 154, 474);
			c.closePath();
			paint(c, lin(c, 0, 416, 0, 474, [
				[0, '#5f7038'],
				[1, '#2c3a1a']
			]), 3);
			rr(c, 64, 424, 26, 34, 8);
			paint(c, lin(c, 0, 424, 0, 458, [
				[0, '#4a5a2a'],
				[1, '#26321a']
			]), 2.6);
			c.restore();
			// throwing arm (behind the head)
			const dx = Hd.x - S.x;
			const dy = Hd.y - S.y;
			const len = Math.hypot(dx, dy) || 1;
			let px = -dy / len;
			let py = dx / len;
			if (py < 0) {
				px = -px;
				py = -py;
			}
			const E = { x: (S.x + Hd.x) / 2 + px * 9, y: (S.y + Hd.y) / 2 + py * 9 };
			c.lineCap = 'round';
			c.lineJoin = 'round';
			c.beginPath();
			c.moveTo(S.x, S.y);
			c.lineTo(E.x, E.y);
			c.lineTo(Hd.x, Hd.y);
			c.strokeStyle = O;
			c.lineWidth = 15;
			c.stroke();
			c.strokeStyle = '#56683a';
			c.lineWidth = 10;
			c.stroke();
			if (phase === 'intro' || phase === 'aim') drawGrenade(c, Hd.x + 2, Hd.y - 7, -0.3, 0.95, -1, true);
			c.beginPath();
			c.arc(Hd.x, Hd.y, 6.5, 0, TAU);
			paint(c, '#3a2a1a', 2.4);
			c.save();
			c.translate(0, bob);
			// face
			c.beginPath();
			c.ellipse(119, 397, 14, 15, 0, 0, TAU);
			paint(c, lin(c, 0, 382, 0, 412, [
				[0, '#e2ab74'],
				[1, '#a8683c']
			]), 2.6);
			c.beginPath();
			c.moveTo(131, 393);
			c.quadraticCurveTo(138, 397, 132, 401);
			paint(c, '#d39a62', 2.2);
			c.fillStyle = 'rgba(40,60,20,0.75)';
			c.beginPath();
			c.moveTo(106, 400);
			c.lineTo(128, 397);
			c.lineTo(127, 401);
			c.lineTo(107, 404);
			c.closePath();
			c.fill();
			c.beginPath();
			c.ellipse(125, 391, 4, 3.4, 0, 0, TAU);
			paint(c, '#fff', 1.6);
			c.beginPath();
			c.arc(126.6, 391.4, 1.9, 0, TAU);
			c.fillStyle = O;
			c.fill();
			c.beginPath();
			c.moveTo(120, 385);
			c.lineTo(130, 386.5);
			c.lineWidth = 2.4;
			c.strokeStyle = O;
			c.stroke();
			// the holk
			c.beginPath();
			c.moveTo(129, 405);
			c.lineTo(150, 409);
			c.lineTo(149, 415);
			c.lineTo(129, 408);
			c.closePath();
			paint(c, lin(c, 0, 405, 0, 415, [
				[0, '#ffffff'],
				[1, '#cfc8bc']
			]), 1.8);
			c.fillStyle = '#d6b07a';
			c.fillRect(128.5, 404.6, 4, 3.6);
			c.beginPath();
			c.arc(150, 412, 4.6, 0, TAU);
			c.fillStyle = rad(c, 150, 412, 0, 6, [
				[0, 'rgba(255,200,80,1)'],
				[0.5, 'rgba(255,90,20,0.9)'],
				[1, 'rgba(255,60,0,0)']
			]);
			c.fill();
			// helmet with ghillie scraps and goggles
			c.beginPath();
			c.ellipse(114, 386, 25, 22, 0, Math.PI, TAU);
			c.closePath();
			paint(c, lin(c, 0, 364, 0, 388, [
				[0, '#6f8240'],
				[1, '#34431c']
			]), 3);
			c.save();
			c.clip();
			c.strokeStyle = 'rgba(20,30,8,0.35)';
			c.lineWidth = 1.1;
			for (let k = -4; k < 6; k++) {
				c.beginPath();
				c.moveTo(90 + k * 9, 360);
				c.lineTo(110 + k * 9, 390);
				c.moveTo(110 + k * 9, 360);
				c.lineTo(90 + k * 9, 390);
				c.stroke();
			}
			c.restore();
			c.beginPath();
			c.ellipse(104, 372, 9, 4, -0.5, Math.PI, TAU);
			c.strokeStyle = 'rgba(230,255,180,0.55)';
			c.lineWidth = 2.4;
			c.stroke();
			for (const [lx, ly, la, col] of [
				[96, 368, -0.9, '#8bc34a'],
				[108, 363, -0.2, '#5a9a2e'],
				[122, 366, 0.5, '#9ad24a'],
				[90, 378, -1.3, '#4a8a26']
			] as [number, number, number, string][]) {
				c.save();
				c.translate(lx, ly);
				c.rotate(la);
				c.beginPath();
				c.moveTo(0, 0);
				c.quadraticCurveTo(4, -6, 0, -13);
				c.quadraticCurveTo(-4, -6, 0, 0);
				paint(c, col, 1.6);
				c.restore();
			}
			rr(c, 86, 383, 56, 7, 3.5);
			paint(c, '#3a4a20', 2.6);
			c.save();
			c.translate(130, 374);
			c.rotate(0.35);
			rr(c, -8, -5, 16, 10, 4);
			paint(c, lin(c, 0, -5, 0, 5, [
				[0, '#ffd27a'],
				[1, '#ff7a2a']
			]), 2.4);
			c.fillStyle = 'rgba(255,255,255,0.7)';
			c.fillRect(-5, -3, 4, 2);
			c.restore();
			c.restore();
			if (fx() < (reduce ? 0.04 : 0.1)) add({ k: 'smoke', x: 152, y: 410 + bob, vx: 6 + fx() * 8, vy: -22 - fx() * 14, max: 1.8, size: 3 + fx() * 2, color: '#e8e2ea' });
		}

		// ---------------------------------------------------------------- particles + effects
		function stepParts(dt: number, wind: number) {
			for (const p of parts) {
				p.life += dt;
				p.vy += p.grav * dt;
				if (p.k === 'smoke' || p.k === 'far' || p.k === 'dust') p.vx += wind * 0.18 * dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.vr * dt;
				if ((p.k === 'debris' || p.k === 'splinter' || p.k === 'pin' || p.k === 'spoon') && p.y > GROUND + 4 && p.vy > 0) {
					p.y = GROUND + 4;
					p.vy *= -0.3;
					p.vx *= 0.6;
					p.vr *= 0.6;
				}
				if (p.k === 'smoke' || p.k === 'far') {
					p.vx *= 1 - 0.6 * dt;
					p.vy *= 1 - 0.4 * dt;
				}
			}
			parts = parts.filter((p) => p.life < p.max);
		}
		function drawParts(c: CanvasRenderingContext2D, which: (k: Kind) => boolean) {
			for (const p of parts) {
				if (!which(p.k)) continue;
				const u = p.life / p.max;
				if (p.k === 'smoke' || p.k === 'far' || p.k === 'dust') {
					const r = p.size * (1 + u * (p.k === 'far' ? 3 : 2.2));
					c.globalAlpha = (p.k === 'far' ? 0.38 : p.k === 'dust' ? 0.45 : 0.55) * (1 - u) * Math.min(1, p.life * 8);
					c.beginPath();
					c.arc(p.x, p.y, r, 0, TAU);
					c.fillStyle = p.color;
					c.fill();
				} else if (p.k === 'fire') {
					const r = p.size * (0.6 + ease(u * 2) * 0.8) * (1 - u * 0.3);
					c.globalAlpha = 1 - u * u;
					c.beginPath();
					c.arc(p.x, p.y, r, 0, TAU);
					c.fillStyle = rad(c, p.x, p.y, 0, r, [
						[0, '#fffbe0'],
						[0.3, '#ffd23a'],
						[0.65, '#ff7a1a'],
						[1, 'rgba(200,30,10,0)']
					]);
					c.fill();
				} else if (p.k === 'spark' || p.k === 'ember') {
					c.globalAlpha = 1 - u;
					c.strokeStyle = p.color;
					c.lineWidth = p.size;
					c.lineCap = 'round';
					c.beginPath();
					c.moveTo(p.x, p.y);
					c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
					c.stroke();
				} else if (p.k === 'pin' || p.k === 'spoon') {
					c.globalAlpha = Math.min(1, (1 - u) * 3);
					c.save();
					c.translate(p.x, p.y);
					c.rotate(p.rot);
					c.beginPath();
					if (p.k === 'pin') c.arc(0, 0, 3.8, 0, TAU);
					else {
						c.moveTo(-5, -3);
						c.quadraticCurveTo(5, -4, 5, 5);
					}
					c.lineWidth = 3.6;
					c.strokeStyle = O;
					c.stroke();
					c.lineWidth = 1.8;
					c.strokeStyle = p.k === 'pin' ? '#ffd23a' : '#c8d0d8';
					c.stroke();
					c.restore();
				} else {
					c.globalAlpha = Math.min(1, (1 - u) * 2.5);
					c.save();
					c.translate(p.x, p.y);
					c.rotate(p.rot);
					c.beginPath();
					if (p.k === 'splinter') c.rect(-p.size, -1.6, p.size * 2, 3.2);
					else {
						c.moveTo(-p.size, -p.size * 0.6);
						c.lineTo(p.size * 0.8, -p.size);
						c.lineTo(p.size, p.size * 0.7);
						c.lineTo(-p.size * 0.5, p.size);
						c.closePath();
					}
					paint(c, p.color, 1.6);
					c.restore();
				}
			}
			c.globalAlpha = 1;
		}

		function boom(x: number, y: number, radius: number) {
			flash = 1;
			if (!reduce) shake = 0.45;
			const big = radius > G.BLAST_R;
			for (let i = 0; i < lots(big ? 12 : 8); i++) {
				const a = fx() * TAU;
				const d = fx() * radius * 0.28;
				add({ k: 'fire', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.7, vx: Math.cos(a) * 40, vy: Math.sin(a) * 30 - 30, max: 0.45 + fx() * 0.3, size: radius * (0.32 + fx() * 0.22) });
			}
			for (let i = 0; i < lots(12); i++) {
				const a = fx() * TAU;
				add({ k: 'smoke', x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 10, vx: Math.cos(a) * (40 + fx() * 50), vy: -30 - fx() * 60, max: 1.4 + fx() * 1.2, size: 12 + fx() * 14, color: fx() < 0.5 ? '#4a3a4e' : '#2e2430' });
			}
			for (let i = 0; i < lots(14); i++) {
				const a = -Math.PI * (0.1 + fx() * 0.8);
				const v = 220 + fx() * 380;
				add({ k: 'debris', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: 1.2 + fx() * 0.6, size: 2.5 + fx() * 4, rot: fx() * TAU, vr: (fx() - 0.5) * 20, color: fx() < 0.5 ? '#5a4a52' : '#3a2a22', grav: 900 });
			}
			for (let i = 0; i < lots(20); i++) {
				const a = fx() * TAU;
				const v = 260 + fx() * 420;
				add({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, max: 0.35 + fx() * 0.35, size: 2.4, color: fx() < 0.5 ? '#fff3a0' : '#ffb030', grav: 600 });
			}
			if (y > GROUND - 40) {
				scorches.push({ x, r: radius * 0.45 });
				if (scorches.length > 10) scorches.shift();
			}
		}
		function splinters(x: number, y: number) {
			for (let i = 0; i < lots(10); i++) {
				const a = -Math.PI * fx();
				const v = 120 + fx() * 260;
				add({ k: 'splinter', x: x + (fx() - 0.5) * 30, y: y + (fx() - 0.5) * 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v, max: 1 + fx() * 0.5, size: 3 + fx() * 5, rot: fx() * TAU, vr: (fx() - 0.5) * 24, color: fx() < 0.6 ? '#e8c088' : '#56683a', grav: 900 });
			}
		}

		// ---------------------------------------------------------------- game flow
		function introFlip(i: number) {
			if (phase === 'intro') return ease((phaseT - i * 0.05) / 0.35);
			if (phase === 'outro') return 1 - ease(phaseT / 0.3);
			return 1;
		}
		function setPhase(p: Phase) {
			phase = p;
			phaseT = 0;
			// for check scripts: which grenade and what's happening
			root.dataset.phase = p;
			root.dataset.round = String(ri);
		}
		function startRound() {
			rt = 0;
			gone.clear();
			nade = null;
			trail = [];
			blast = null;
			setPhase('intro');
			if (ri === G.ROUNDS - 1) banners.push({ text: s.lastOne, t: -0.2, color: '#ffd23a', size: 34 });
		}
		function throwNade() {
			if (phase !== 'aim') return;
			const v = G.launch(aimAngle, aimPower);
			nade = G.newNade(v.vx, v.vy);
			trail = [];
			const sp = Math.hypot(v.vx, v.vy);
			throwDir = { x: v.vx / sp, y: v.vy / sp };
			throwT = 0;
			hint = false;
			keyAim = false;
			add({ k: 'pin', x: G.ORIGIN.x - 6, y: G.ORIGIN.y - 8, vx: -70 - fx() * 40, vy: -220, max: 1.6, rot: 0, vr: 14, grav: 900 });
			add({ k: 'spoon', x: G.ORIGIN.x + 4, y: G.ORIGIN.y - 6, vx: -30 + fx() * 30, vy: -260, max: 1.6, rot: 0, vr: -18, grav: 900 });
			sound.play('clack');
			setPhase('flight');
		}
		function explode() {
			if (!nade) return;
			const round = level.rounds[ri];
			const b = G.scoreBlast(level, round, nade, rt, new Set(gone.keys()));
			blast = b;
			blastT = 0;
			boom(b.x, b.y, b.radius);
			for (const h of b.hits) {
				gone.set(h.id, rt);
				splinters(h.x, h.y);
				floaters.push({ text: s.hit(h.points), x: h.x, y: h.y - 28, t: 0, color: h.bullseye ? '#ffd23a' : '#ffffff', size: h.bullseye ? 34 : 28 });
			}
			score += b.total;
			used[ri] = b.total > 0 ? 'hit' : 'miss';
			let delay = 0.05;
			const ban = (text: string, color: string, size = 38) => {
				banners.push({ text, t: -delay, color, size });
				delay += 0.22;
			};
			if (b.hits.some((h) => h.bullseye) && !nade.caught) ban(s.bullseye, '#ffd23a', 42);
			if (b.hits.length >= 2) ban(`${s.combo[Math.min(b.hits.length, s.combo.length - 1)]} ×${b.mult}`, '#ff7ad9');
			for (const bo of b.bonus) ban(`${s[bo.kind]} +${bo.points}`, bo.kind === 'window' ? '#5feaff' : bo.kind === 'barrel' ? '#ffa04a' : '#8dff5a', 34);
			if (b.total === 0) {
				const airburst = !nade.caught && b.y < GROUND - 90;
				floaters.push({ text: airburst ? s.airburst : s.miss, x: clamp(b.x, 70, W - 70), y: clamp(b.y - 30, 120, 500), t: 0, color: '#c9b8c8', size: 30 });
			} else if (b.hits.length >= 4 || b.total >= 1200) sound.play('maxed');
			else sound.play('camo');
			nade = null;
			setPhase('blast');
		}
		function lose() {
			used[ri] = 'lost';
			banners.push({ text: s.tooSlow, t: 0, color: '#ff5a4a', size: 40 });
			keyAim = false;
			dragging = false;
			setPhase('blast');
		}
		function finish() {
			if (ended) return;
			ended = true;
			onend(Math.max(0, Math.round(score)));
		}

		function update(dt: number) {
			clock += dt;
			rt += dt;
			phaseT += dt;
			const round = level.rounds[Math.min(ri, G.ROUNDS - 1)];
			if (throwT >= 0) throwT += dt;
			if (phase === 'intro' && phaseT >= 0.55) setPhase('aim');
			else if (phase === 'aim' && phaseT >= G.AIM_TIME) lose();
			else if (phase === 'flight' && nade) {
				let left = dt;
				const before = nade.bounces;
				while (left > 1e-9) {
					const h = Math.min(1 / 240, left);
					nade = G.stepNade(nade, h, G.envAt(level, round, rt - left + h));
					left -= h;
					if (nade.t >= G.FUSE) break;
				}
				if (nade.bounces > before) sound.play('clack');
				const p = G.caughtPos(level, round, nade, rt);
				trail.push(p);
				if (trail.length > 8) trail.shift();
				if (nade.t >= G.FUSE) explode();
			} else if (phase === 'blast') {
				blastT += dt;
				if (phaseT >= 1.5) setPhase('outro');
			} else if (phase === 'outro' && phaseT >= 0.34) {
				ri++;
				if (ri >= G.ROUNDS) {
					setPhase('end');
					banners.push({ text: s.done, t: 0, color: '#8dff5a', size: 44 });
				} else startRound();
			} else if (phase === 'end' && phaseT >= 0.95) finish();
			// background fires
			if (fx() < dt * 3.2) add({ k: 'far', x: 262 + fx() * 10, y: 430, vx: 0, vy: -16 - fx() * 8, max: 5 + fx() * 2, size: 9 + fx() * 6, color: '#2a1424' });
			if (fx() < dt * 2.4) add({ k: 'far', x: 470 + fx() * 8, y: 446, vx: 0, vy: -14 - fx() * 8, max: 4.5 + fx() * 2, size: 8 + fx() * 5, color: '#33182c' });
			stepParts(dt, round.wind);
			shake = Math.max(0, shake - dt);
			flash = Math.max(0, flash - dt * 6);
			shown += (score - shown) * Math.min(1, dt * 7);
			if (Math.abs(score - shown) < 1) shown = score;
			for (const f of floaters) f.t += dt;
			for (const b of banners) b.t += dt;
			while (floaters.length && floaters[0].t > 1.2) floaters.shift();
			while (banners.length && banners[0].t > 1.5) banners.shift();
		}

		// ---------------------------------------------------------------- the frame
		function draw() {
			const c = ctx;
			if (!far || !near || !front) return;
			const round = level.rounds[Math.min(ri, G.ROUNDS - 1)];
			c.setTransform(1, 0, 0, 1, 0, 0);
			c.clearRect(0, 0, canvas.width, canvas.height);
			c.save();
			if (shake > 0) {
				const a = shake * 26;
				c.translate((fx() - 0.5) * a * scale, (fx() - 0.5) * a * scale);
			}
			c.drawImage(far, 0, 0);
			c.setTransform(scale, 0, 0, scale, c.getTransform().e, c.getTransform().f);
			// fires on the skyline + their smoke
			for (const [x, y] of [
				[266, 436],
				[474, 450]
			]) {
				const g = 0.7 + 0.3 * Math.sin(clock * 11 + x);
				c.fillStyle = rad(c, x, y, 0, 26, [
					[0, `rgba(255,190,80,${0.85 * g})`],
					[1, 'rgba(255,80,30,0)']
				]);
				c.fillRect(x - 30, y - 30, 60, 60);
			}
			drawParts(c, (k) => k === 'far');
			c.save();
			c.setTransform(1, 0, 0, 1, c.getTransform().e, c.getTransform().f);
			c.drawImage(near, 0, 0);
			c.restore();
			for (const sc of scorches) {
				c.beginPath();
				c.ellipse(sc.x, GROUND + 6, sc.r, sc.r * 0.16, 0, 0, TAU);
				c.fillStyle = 'rgba(10,4,8,0.55)';
				c.fill();
			}
			drawFlag(c, round.wind);
			drawWindows(c, round, introFlip(4));
			// the roof sniper, clipped above the roof line (the parapet hides his post)
			round.targets.forEach((tg, i) => {
				if (tg.kind !== 'roof') return;
				const st = G.targetAt(level, round, tg, rt);
				const dead = gone.get(tg.id);
				if (dead !== undefined && rt - dead > 0.4) return;
				c.save();
				c.beginPath();
				c.rect(bx - 10, 0, G.BUILDING_W + 20, ROOF_Y);
				c.clip();
				board(c, st.x, ROOF_Y + G.BOARD.post, st.up, introFlip(i), dead === undefined ? 0 : (rt - dead) / 0.3, 1, true);
				c.restore();
			});
			round.targets.forEach((tg, i) => {
				if (tg.kind !== 'cutout') return;
				const st = G.targetAt(level, round, tg, rt);
				const dead = gone.get(tg.id);
				if (dead !== undefined && rt - dead > 0.4) return;
				board(c, st.x, GROUND, st.up, introFlip(i), dead === undefined ? 0 : (rt - dead) / 0.3);
			});
			drawOperator(c);
			c.save();
			c.setTransform(1, 0, 0, 1, c.getTransform().e, c.getTransform().f);
			c.drawImage(front, 0, 0);
			c.restore();
			drawBarrel(c, round.barrel);
			if (nade?.caught?.kind === 'barrel') {
				const g = 0.5 + 0.5 * Math.sin(clock * 22);
				c.fillStyle = rad(c, round.barrel + G.BARREL_W / 2, GROUND - G.BARREL_H, 0, 24, [
					[0, `rgba(255,60,40,${0.8 * g})`],
					[1, 'rgba(255,60,40,0)']
				]);
				c.fillRect(round.barrel - 10, GROUND - G.BARREL_H - 24, G.BARREL_W + 20, 48);
			}
			drawTruck(c, round);
			drawParts(c, (k) => k === 'dust');
			// the grenade in flight
			if (nade && !nade.caught) {
				trail.forEach((p, i) => {
					c.globalAlpha = (i / trail.length) * 0.35;
					c.beginPath();
					c.arc(p.x, p.y, 3 + i * 0.6, 0, TAU);
					c.fillStyle = '#fff3c8';
					c.fill();
				});
				c.globalAlpha = 1;
				drawGrenade(c, nade.x, nade.y, nade.spin, 1, nade.t / G.FUSE);
			}
			drawParts(c, (k) => k === 'smoke' || k === 'debris' || k === 'splinter' || k === 'pin' || k === 'spoon');
			drawParts(c, (k) => k === 'fire' || k === 'spark' || k === 'ember');
			if (blast && blastT < 0.4) {
				const u = blastT / 0.4;
				c.beginPath();
				c.arc(blast.x, blast.y, blast.radius * (0.25 + ease(u) * 1.05), 0, TAU);
				c.lineWidth = 9 * (1 - u) + 1;
				c.strokeStyle = `rgba(255,245,220,${0.85 * (1 - u)})`;
				c.stroke();
				c.lineWidth = 3 * (1 - u) + 0.5;
				c.strokeStyle = `rgba(255,150,60,${0.7 * (1 - u)})`;
				c.beginPath();
				c.arc(blast.x, blast.y, blast.radius * (0.15 + ease(u) * 0.8), 0, TAU);
				c.stroke();
			}
			if (flash > 0 && blast) {
				c.fillStyle = rad(c, blast.x, blast.y, 0, 260, [
					[0, `rgba(255,250,230,${0.85 * flash})`],
					[1, 'rgba(255,240,200,0)']
				]);
				c.fillRect(0, 0, W, H);
			}
			drawAim(c);
			c.restore();
			c.setTransform(scale, 0, 0, scale, 0, 0);
			drawFloaters(c);
			drawHud(c, round);
		}

		function drawAim(c: CanvasRenderingContext2D) {
			if (phase !== 'aim' || !(dragging || keyAim)) return;
			const v = G.launch(aimAngle, aimPower);
			const dots = G.previewDots(v.vx, v.vy, 12, 0.036);
			dots.forEach((d, i) => {
				const a = 1 - i / dots.length;
				c.globalAlpha = 0.25 + 0.75 * a;
				c.beginPath();
				c.arc(d.x, d.y, 2.6 + 3.4 * a, 0, TAU);
				paint(c, '#fff8e8', 2);
			});
			c.globalAlpha = 1;
			// power ring round the release point
			const ox = G.ORIGIN.x;
			const oy = G.ORIGIN.y;
			c.lineCap = 'round';
			c.beginPath();
			c.arc(ox, oy, 26, -Math.PI * 0.75, Math.PI * 0.75);
			c.lineWidth = 9;
			c.strokeStyle = 'rgba(20,10,6,0.7)';
			c.stroke();
			const col = aimPower < 0.5 ? '#8dff5a' : aimPower < 0.8 ? '#ffd23a' : '#ff5a3a';
			c.beginPath();
			c.arc(ox, oy, 26, -Math.PI * 0.75, -Math.PI * 0.75 + Math.PI * 1.5 * Math.max(0.02, aimPower));
			c.lineWidth = 5;
			c.strokeStyle = col;
			c.stroke();
			if (dragging) {
				c.setLineDash([6, 7]);
				c.beginPath();
				c.moveTo(dragStart.x, dragStart.y);
				c.lineTo(dragNow.x, dragNow.y);
				c.lineWidth = 2.4;
				c.strokeStyle = 'rgba(255,255,255,0.45)';
				c.stroke();
				c.setLineDash([]);
				c.beginPath();
				c.arc(dragStart.x, dragStart.y, 7, 0, TAU);
				c.lineWidth = 2.4;
				c.stroke();
			}
		}

		function drawFloaters(c: CanvasRenderingContext2D) {
			for (const f of floaters) {
				const u = f.t / 1.2;
				const pop = f.t < 0.12 ? 0.6 + (f.t / 0.12) * 0.6 : 1.2 - Math.min(0.2, (f.t - 0.12) * 1.2);
				c.save();
				c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
				c.translate(clamp(f.x, 50, W - 50), f.y - ease(u) * 46);
				c.scale(pop, pop);
				text(c, f.text, 0, 0, f.size, f.color);
				c.restore();
			}
			let row = 0;
			for (const b of banners) {
				if (b.t < 0) continue;
				const u = b.t / 1.5;
				const pop = b.t < 0.14 ? 0.4 + (b.t / 0.14) * 0.8 : 1.2 - Math.min(0.2, (b.t - 0.14) * 1.4);
				c.save();
				c.globalAlpha = u > 0.75 ? (1 - u) / 0.25 : 1;
				c.translate(360, 200 + row * 50);
				c.rotate(-0.03);
				c.scale(pop, pop);
				text(c, b.text.toUpperCase(), 0, 0, b.size, b.color, 'center', 900);
				c.restore();
				row++;
			}
		}

		function drawHud(c: CanvasRenderingContext2D, round: G.Round) {
			// score
			rr(c, 12, 10, 176, 62, 12);
			paint(c, 'rgba(16,6,20,0.62)', 2.5, 'rgba(0,0,0,0.8)');
			text(c, s.score.toUpperCase(), 26, 28, 15, '#ffd23a', 'left');
			text(c, Math.round(shown).toLocaleString('en-US'), 26, 53, 30, '#ffffff', 'left', 900);
			// wind
			const wv = round.wind;
			rr(c, 300, 10, 200, 52, 12);
			paint(c, 'rgba(16,6,20,0.62)', 2.5, 'rgba(0,0,0,0.8)');
			text(c, s.wind.toUpperCase(), 344, 27, 14, '#bfe6ff');
			const mag = Math.abs(wv);
			if (mag < 6) text(c, s.calm.toUpperCase(), 344, 47, 18, '#ffffff');
			else text(c, (mag / 40).toFixed(1), 344, 47, 20, '#ffffff', 'center', 900);
			const len = 16 + (Math.min(mag, 150) / 150) * 74;
			const dir = wv >= 0 ? 1 : -1;
			const acx = 432;
			const acy = 36;
			const col = mag < 50 ? '#8dff5a' : mag < 100 ? '#ffd23a' : '#ff6a3a';
			c.save();
			c.translate(acx, acy);
			c.scale(dir, 1);
			const wob = Math.sin(clock * 6) * 2 * Math.min(1, mag / 60);
			c.beginPath();
			c.moveTo(-len / 2 - 4, -5);
			c.lineTo(len / 2 - 6 + wob, -5);
			c.lineTo(len / 2 - 6 + wob, -11);
			c.lineTo(len / 2 + 10 + wob, 0);
			c.lineTo(len / 2 - 6 + wob, 11);
			c.lineTo(len / 2 - 6 + wob, 5);
			c.lineTo(-len / 2 - 4, 5);
			c.closePath();
			paint(c, mag < 6 ? '#6a5a6e' : col, 2.6);
			c.restore();
			// grenades left
			for (let i = 0; i < G.ROUNDS; i++) {
				const col2 = i % 5;
				const row = Math.floor(i / 5);
				const x = W - 148 + col2 * 30;
				const y = 26 + row * 30;
				const cur = i === ri && phase !== 'end' && (phase === 'intro' || phase === 'aim');
				if (cur) {
					c.beginPath();
					c.arc(x, y + 1, 14, 0, TAU);
					c.fillStyle = 'rgba(255,210,60,0.28)';
					c.fill();
					// the throw clock runs round the current grenade
					const left = phase === 'aim' ? Math.max(0, G.AIM_TIME - phaseT) : G.AIM_TIME;
					c.beginPath();
					c.arc(x, y + 1, 14, -Math.PI / 2, -Math.PI / 2 + TAU * (left / G.AIM_TIME));
					c.lineWidth = 6;
					c.strokeStyle = O;
					c.stroke();
					c.lineWidth = 3;
					c.strokeStyle = left < 4 ? (Math.sin(clock * 16) > 0 ? '#ff5a4a' : '#ffb0a0') : '#ffd23a';
					c.stroke();
				}
				if (i < ri || (i === ri && phase !== 'intro' && phase !== 'aim')) {
					c.globalAlpha = 0.35;
					drawGrenade(c, x, y + 2, 0, 0.95);
					c.globalAlpha = 1;
					const u = used[i];
					if (u === 'hit') {
						c.beginPath();
						c.moveTo(x - 5, y + 2);
						c.lineTo(x - 1, y + 6);
						c.lineTo(x + 7, y - 4);
						c.lineWidth = 5;
						c.strokeStyle = O;
						c.stroke();
						c.lineWidth = 2.6;
						c.strokeStyle = '#8dff5a';
						c.stroke();
					} else if (u) {
						c.beginPath();
						c.moveTo(x - 5, y - 3);
						c.lineTo(x + 5, y + 7);
						c.moveTo(x + 5, y - 3);
						c.lineTo(x - 5, y + 7);
						c.lineWidth = 5;
						c.strokeStyle = O;
						c.stroke();
						c.lineWidth = 2.6;
						c.strokeStyle = '#ff5a4a';
						c.stroke();
					}
				} else drawGrenade(c, x, y + 2, 0, cur ? 1.05 : 0.95, -1, true);
			}
			if (hint && phase === 'aim' && !dragging) {
				const a = 0.75 + 0.25 * Math.sin(clock * 4);
				c.globalAlpha = a;
				rr(c, 196, 230, 330, 74, 14);
				paint(c, 'rgba(16,6,20,0.72)', 2.5, 'rgba(255,210,60,0.7)');
				text(c, s.hint, 361, 255, 21, '#ffffff');
				text(c, s.hintKeys, 361, 284, 15, '#ffd23a', 'center', 700);
				c.globalAlpha = 1;
				// a little drag arrow by the operator
				const k = (clock * 0.9) % 1;
				c.beginPath();
				c.arc(220 - k * 50, 340 + k * 34, 9, 0, TAU);
				c.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`;
				c.fill();
			}
		}

		// ---------------------------------------------------------------- sizing + loop
		function resize() {
			const r = canvas.getBoundingClientRect();
			if (r.width < 2) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			canvas.width = Math.round(r.width * dpr);
			canvas.height = Math.round(r.width * dpr * 0.75);
			scale = canvas.width / W;
			far = layer(drawFar);
			near = layer(drawNear);
			front = layer(drawFront);
		}
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();

		let raf = 0;
		let last = performance.now();
		const frame = (now: number) => {
			raf = requestAnimationFrame(frame);
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			if (!paused && !ended) update(dt);
			draw();
		};
		raf = requestAnimationFrame(frame);
		startRound();

		// ---------------------------------------------------------------- input
		const toWorld = (e: PointerEvent) => {
			const r = canvas.getBoundingClientRect();
			return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
		};
		const onDown = (e: PointerEvent) => {
			if (paused || ended) return;
			root.focus({ preventScroll: true });
			if (phase !== 'aim' || dragging) return;
			e.preventDefault();
			dragging = true;
			dragId = e.pointerId;
			dragStart = dragNow = toWorld(e);
			keyAim = false;
			try {
				canvas.setPointerCapture(e.pointerId);
			} catch {
				/* synthetic events can't be captured */
			}
		};
		const onMove = (e: PointerEvent) => {
			if (!dragging || e.pointerId !== dragId) return;
			dragNow = toWorld(e);
			const a = G.aimFromPull(dragNow.x - dragStart.x, dragNow.y - dragStart.y);
			if (a.power > 0) {
				aimAngle = a.angle;
				aimPower = a.power;
			}
		};
		const onUp = (e: PointerEvent) => {
			if (!dragging || e.pointerId !== dragId) return;
			dragging = false;
			const pull = Math.hypot(dragNow.x - dragStart.x, dragNow.y - dragStart.y);
			if (phase === 'aim' && pull > 16 && G.aimFromPull(dragNow.x - dragStart.x, dragNow.y - dragStart.y).power > 0.02) throwNade();
		};
		const onCancel = () => (dragging = false);
		const onKey = (e: KeyboardEvent) => {
			if (ended) return;
			if (paused) {
				e.preventDefault();
				resume();
				return;
			}
			const k = e.key;
			if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
				e.preventDefault();
				if (phase !== 'aim' && phase !== 'intro') return;
				keyAim = true;
				if (k === 'ArrowUp') aimAngle = clamp(aimAngle + 1.5, G.MIN_ANGLE, G.MAX_ANGLE);
				if (k === 'ArrowDown') aimAngle = clamp(aimAngle - 1.5, G.MIN_ANGLE, G.MAX_ANGLE);
				if (k === 'ArrowRight') aimPower = clamp(aimPower + 0.02, 0, 1);
				if (k === 'ArrowLeft') aimPower = clamp(aimPower - 0.02, 0, 1);
			} else if (k === ' ' || k === 'Enter') {
				e.preventDefault();
				if (e.repeat) return;
				if (phase === 'aim') throwNade();
			}
		};
		const onVis = () => {
			if (document.hidden && !ended) {
				paused = true;
				dragging = false;
			}
		};
		resume = () => {
			paused = false;
			last = performance.now();
			root.focus({ preventScroll: true });
		};
		canvas.addEventListener('pointerdown', onDown);
		canvas.addEventListener('pointermove', onMove);
		canvas.addEventListener('pointerup', onUp);
		canvas.addEventListener('pointercancel', onCancel);
		root.addEventListener('keydown', onKey);
		document.addEventListener('visibilitychange', onVis);
		root.focus({ preventScroll: true });

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			canvas.removeEventListener('pointerdown', onDown);
			canvas.removeEventListener('pointermove', onMove);
			canvas.removeEventListener('pointerup', onUp);
			canvas.removeEventListener('pointercancel', onCancel);
			root.removeEventListener('keydown', onKey);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<!-- the play area takes the keyboard itself (arrows aim, Space throws), so it's focusable -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="gt" bind:this={root} tabindex="0" role="application" aria-label={s.label}>
	<canvas bind:this={canvas} class="gt-cv"></canvas>
	<div class="gt-crt" aria-hidden="true"></div>
	{#if paused}
		<button type="button" class="gt-pause" onclick={() => resume()}>
			<b>{s.paused}</b>
			<span>{s.tapToGo}</span>
		</button>
	{/if}
</div>

<style>
	.gt {
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 4 / 3));
		aspect-ratio: 4 / 3;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #12041f;
		box-shadow:
			inset 0 0 0 2px #000,
			0 0 0 1px rgb(255 255 255 / 0.07),
			0 10px 30px rgb(0 0 0 / 0.45);
		outline: none;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.gt:focus-visible {
		box-shadow:
			inset 0 0 0 2px #000,
			0 0 0 3px #ffd23a;
	}
	.gt-cv {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		cursor: crosshair;
	}
	.gt-crt {
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		background:
			repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 3px),
			radial-gradient(ellipse at center, transparent 60%, rgb(0 0 0 / 0.45) 100%);
		box-shadow:
			inset 0 0 0 3px rgb(0 0 0 / 0.55),
			inset 0 0 24px rgb(0 0 0 / 0.55);
	}
	.gt-pause {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 6px;
		border: 0;
		background: rgb(12 4 18 / 0.66);
		color: #fff;
		font-family: Bahnschrift, 'Segoe UI', sans-serif;
		text-align: center;
		text-shadow:
			0 2px 0 #140a06,
			0 0 12px rgb(0 0 0 / 0.8);
		cursor: pointer;
	}
	.gt-pause b {
		font-size: clamp(26px, 6vw, 44px);
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.gt-pause span {
		font-size: clamp(14px, 3vw, 20px);
		font-weight: 700;
	}
</style>
