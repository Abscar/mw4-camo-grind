<!--
	Nuke Run (BurgiArcade, 2026-11-22): a side-scrolling runner. A cartoon operator (ghillie-tufted helmet, plate
	carrier, rifle on the back) sprints right across a burning city at dusk, a mushroom cloud on the horizon.
	Jump wire, sandbags, mines, burning wrecks and air-strike craters, slide under drones, grab burger coins.
	The course comes from the seed (arcade/nukerun.ts, shared with its test); everything here is the look and
	the feel: one canvas (800 × 600 logical, scaled to the device), pre-rendered parallax layers, squash and
	stretch, dust, embers, explosions and a screen shake (none with reduced motion). One hit ends the run.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { rng } from '#lib/arcade/rng.ts';
	import s from '#lib/i18n/arcade/nukerun.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import {
		W,
		H,
		GROUND_Y,
		PLAYER_X,
		PX_PER_M,
		PHYS,
		OBSTACLES,
		STRIKE_BLAST_AHEAD,
		FIRST_AT,
		makeCourse,
		newRunner,
		pressJump,
		pressSlide,
		stepRunner,
		airborne,
		hits,
		grabs,
		speedAt,
		scoreOf,
		type Obstacle
	} from '#lib/arcade/nukerun.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let paused = $state(false);
	let resume = $state<() => void>(() => {});

	const OUT = '#140a06';
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
	const FAR_H = 300;
	const MID_H = 250;
	const FORE_H = 92;
	const STRIP = 1600;

	type Ctx = CanvasRenderingContext2D;
	type PKind = 'dust' | 'fire' | 'smoke' | 'spark' | 'debris' | 'ring' | 'star' | 'text';
	interface Particle {
		k: PKind;
		/** world x (or screen x when `scr`) */
		x: number;
		/** screen y */
		y: number;
		vx: number;
		vy: number;
		life: number;
		max: number;
		size: number;
		rot: number;
		vr: number;
		col: string;
		scr?: boolean;
		text?: string;
		g?: number;
	}
	interface Fire {
		x: number;
		y: number;
		w: number;
		ph: number;
	}

	onMount(() => {
		const cv = canvas;
		const ctx = cv.getContext('2d') as Ctx;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const coarse = matchMedia('(pointer: coarse)').matches;
		const finish = onend;
		const course = makeCourse(seed);
		const run = newRunner();

		let scale = 1;
		let k = 1; // HUD size factor: bigger words on a small screen
		let dist = 0;
		let coins = 0;
		let clock = 0;
		let phase = 0;
		let lastStep = 0;
		let oi = 0;
		let ci = 0;
		let slideHeld = false;
		let dead = false;
		let deadT = 0;
		let ended = false;
		let deathV = 0;
		let scoreDist = 0;
		const corpse = { x: 0, y: 0, vx: 0, vy: 0, rot: 0, vr: 0 };
		let shake = 0;
		let flash = 0;
		let flashCol = '255,190,110';
		let sq = 1;
		let nextMile = 250;
		let banner: { text: string; sub: string; t: number } | null = null;
		const got = new Set<number>();
		const blown = new Map<number, number>(); // strike id → clock when it blew
		const wrecked = new Set<number>(); // obstacles that blew up with the runner
		const tagged = new Set<string>(); // kinds already passed once (their "JUMP!" tag is gone)
		const parts: Particle[] = [];
		const maxParts = reduce ? 140 : 320;

		// ---------- pre-rendered layers ----------
		let L: {
			sky: HTMLCanvasElement;
			far: HTMLCanvasElement;
			mid: HTMLCanvasElement;
			ground: HTMLCanvasElement;
			fore: HTMLCanvasElement;
			over: HTMLCanvasElement;
			smoke: HTMLCanvasElement;
			coin: HTMLCanvasElement;
		} | null = null;
		const fires: Fire[] = [];

		function mk(w: number, h: number): [HTMLCanvasElement, Ctx] {
			const c = document.createElement('canvas');
			c.width = Math.max(1, Math.round(w * scale));
			c.height = Math.max(1, Math.round(h * scale));
			const g = c.getContext('2d') as Ctx;
			g.setTransform(scale, 0, 0, scale, 0, 0);
			return [c, g];
		}

		function buildSky(): HTMLCanvasElement {
			const [c, g] = mk(W, H);
			const gr = g.createLinearGradient(0, 0, 0, GROUND_Y);
			gr.addColorStop(0, '#10051c');
			gr.addColorStop(0.26, '#2e0d34');
			gr.addColorStop(0.5, '#741b3a');
			gr.addColorStop(0.68, '#c9412a');
			gr.addColorStop(0.84, '#ff8a36');
			gr.addColorStop(1, '#ffc66c');
			g.fillStyle = gr;
			g.fillRect(0, 0, W, H);
			const r = rng(11);
			for (let i = 0; i < 70; i++) {
				const y = r() * H * 0.34;
				g.fillStyle = `rgba(255,236,220,${(0.2 + r() * 0.7) * (1 - y / (H * 0.36))})`;
				g.beginPath();
				g.arc(r() * W, y, 0.6 + r() * 1.1, 0, Math.PI * 2);
				g.fill();
			}
			// long dusk clouds, lit from below
			for (let i = 0; i < 7; i++) {
				const x = r() * W;
				const y = 120 + r() * 170;
				const w = 120 + r() * 220;
				g.fillStyle = 'rgba(42,10,40,0.42)';
				g.beginPath();
				g.ellipse(x, y, w, 9 + r() * 8, 0, 0, Math.PI * 2);
				g.fill();
				g.strokeStyle = 'rgba(255,150,80,0.35)';
				g.lineWidth = 2;
				g.beginPath();
				g.ellipse(x, y + 2, w * 0.85, 8, 0, 0.15, Math.PI - 0.15);
				g.stroke();
			}
			mushroom(g, 585, 452);
			return c;
		}

		/** The distant mushroom cloud: a lit stem, a collar and a smoky cap (outline pass, then fills). */
		function mushroom(g: Ctx, cx: number, by: number) {
			const glow = g.createRadialGradient(cx, by - 30, 10, cx, by - 30, 260);
			glow.addColorStop(0, 'rgba(255,200,90,0.75)');
			glow.addColorStop(0.4, 'rgba(255,120,50,0.3)');
			glow.addColorStop(1, 'rgba(255,90,40,0)');
			g.fillStyle = glow;
			g.fillRect(cx - 270, by - 300, 540, 330);
			const capY = 150;
			type Puff = [number, number, number, boolean];
			const puffs: Puff[] = [];
			// stem puffs (bottom → top)
			for (let i = 0; i <= 10; i++) {
				const f = i / 10;
				const y = by - f * (by - capY - 30);
				const w = 60 - 26 * f + Math.sin(i * 1.7) * 4;
				puffs.push([cx - w * 0.5 + Math.sin(i * 2.3) * 5, y, 17 + 10 * (1 - f), false]);
				puffs.push([cx + w * 0.5 + Math.cos(i * 1.9) * 5, y, 17 + 10 * (1 - f), false]);
				puffs.push([cx + Math.sin(i) * 4, y, 22 + 8 * (1 - f), false]);
			}
			// collar ring
			for (let i = 0; i < 9; i++) puffs.push([cx - 78 + i * 19.5, by - 196 + Math.sin(i * 2) * 4, 14 + (i % 3) * 3, false]);
			// cap
			const cap: Puff[] = [];
			for (let i = 0; i < 13; i++) {
				const a = Math.PI + (i / 12) * Math.PI;
				cap.push([cx + Math.cos(a) * 128, capY + Math.sin(a) * 62, 34 + (i % 3) * 7, true]);
			}
			for (let i = 0; i < 9; i++) cap.push([cx - 108 + i * 27, capY + 30 + Math.sin(i * 1.3) * 5, 30, true]);
			cap.push([cx - 40, capY - 24, 44, true], [cx + 34, capY - 30, 46, true], [cx, capY - 6, 50, true]);
			const all = [...puffs, ...cap];
			g.lineJoin = 'round';
			g.strokeStyle = 'rgba(30,6,24,0.7)';
			g.lineWidth = 7;
			for (const [x, y, r] of all) {
				g.beginPath();
				g.arc(x, y, r, 0, Math.PI * 2);
				g.stroke();
			}
			for (const [x, y, r, top] of all) {
				const gr = g.createLinearGradient(x, y + r, x, y - r);
				if (top) {
					gr.addColorStop(0, '#ffb04c');
					gr.addColorStop(0.45, '#c2563a');
					gr.addColorStop(1, '#4a1d34');
				} else {
					const hot = Math.max(0, Math.min(1, (y - capY) / (by - capY)));
					gr.addColorStop(0, hot > 0.6 ? '#fff0a8' : '#ffc565');
					gr.addColorStop(0.6, hot > 0.5 ? '#ff9a3c' : '#e0703a');
					gr.addColorStop(1, '#8e3a3a');
				}
				g.fillStyle = gr;
				g.beginPath();
				g.arc(x, y, r, 0, Math.PI * 2);
				g.fill();
			}
			// glowing underside of the cap
			g.globalCompositeOperation = 'lighter';
			const under = g.createRadialGradient(cx, capY + 40, 4, cx, capY + 40, 130);
			under.addColorStop(0, 'rgba(255,96,36,0.5)');
			under.addColorStop(0.5, 'rgba(255,70,30,0.22)');
			under.addColorStop(1, 'rgba(255,60,20,0)');
			g.fillStyle = under;
			g.beginPath();
			g.ellipse(cx, capY + 40, 130, 34, 0, 0, Math.PI * 2);
			g.fill();
			g.globalCompositeOperation = 'source-over';
		}

		/** One ruined building: jagged broken top, windows, a beam or an antenna. */
		function building(g: Ctx, r: () => number, x: number, top: number, w: number, base: number, col: string, lit: number, rim: string) {
			g.beginPath();
			g.moveTo(x, base);
			g.lineTo(x, top + r() * 18);
			const steps = Math.max(2, Math.floor(w / 14));
			for (let i = 1; i <= steps; i++) {
				const bx = x + (w * i) / steps;
				const broken = r() < 0.55;
				g.lineTo(bx - w / steps / 2, top + (broken ? 6 + r() * 30 : r() * 6));
				g.lineTo(bx, top + (broken ? r() * 22 : 0));
			}
			g.lineTo(x + w, base);
			g.closePath();
			g.fillStyle = col;
			g.fill();
			g.save();
			g.clip();
			g.strokeStyle = rim;
			g.lineWidth = 3;
			g.stroke();
			// windows
			for (let wy = top + 26; wy < base - 12; wy += 16 + (w > 80 ? 2 : 0)) {
				for (let wx = x + 7; wx < x + w - 9; wx += 13) {
					const v = r();
					if (v < lit) {
						g.fillStyle = v < lit * 0.35 ? '#ffd27a' : '#ff9a3c';
						g.globalAlpha = 0.55 + r() * 0.45;
					} else {
						g.fillStyle = 'rgba(0,0,0,0.28)';
						g.globalAlpha = 1;
					}
					g.fillRect(wx, wy, 6, 8);
				}
			}
			g.globalAlpha = 1;
			g.restore();
			if (r() < 0.35) {
				// a bent beam sticking out of the broken top
				g.strokeStyle = col;
				g.lineWidth = 3;
				g.beginPath();
				const bx = x + w * (0.2 + r() * 0.6);
				g.moveTo(bx, top + 10);
				g.lineTo(bx + (r() - 0.5) * 30, top - 16 - r() * 14);
				g.stroke();
			} else if (r() < 0.3) {
				g.strokeStyle = col;
				g.lineWidth = 2;
				const ax = x + w * 0.3;
				g.beginPath();
				g.moveTo(ax, top + 4);
				g.lineTo(ax + 2, top - 36);
				g.moveTo(ax - 6, top - 22);
				g.lineTo(ax + 9, top - 24);
				g.stroke();
			}
		}

		function buildFar(): HTMLCanvasElement {
			const [c, g] = mk(STRIP, FAR_H);
			const r = rng(21);
			let x = 0;
			while (x < STRIP - 30) {
				let w = 44 + r() * 92;
				if (x + w > STRIP) w = STRIP - x;
				const h = 70 + r() * 165;
				building(g, r, x, FAR_H - h, w, FAR_H, '#2d1032', 0.13, 'rgba(255,140,80,0.22)');
				x += w + (r() < 0.25 ? r() * 26 : -3);
			}
			g.globalCompositeOperation = 'source-atop';
			const hz = g.createLinearGradient(0, 0, 0, FAR_H);
			hz.addColorStop(0, 'rgba(255,110,60,0)');
			hz.addColorStop(1, 'rgba(255,110,60,0.42)');
			g.fillStyle = hz;
			g.fillRect(0, 0, STRIP, FAR_H);
			g.globalCompositeOperation = 'source-over';
			return c;
		}

		function buildMid(): HTMLCanvasElement {
			const [c, g] = mk(STRIP, MID_H);
			const r = rng(34);
			fires.length = 0;
			let x = 10;
			while (x < STRIP - 60) {
				let w = 70 + r() * 110;
				if (x + w > STRIP - 10) w = STRIP - 10 - x;
				const h = 60 + r() * 150;
				const top = MID_H - h;
				building(g, r, x, top, w, MID_H, '#190a16', 0.06, 'rgba(255,120,60,0.45)');
				// blown-out holes glowing from inside
				const holes = Math.floor(r() * 3);
				for (let i = 0; i < holes; i++) {
					const hx = x + 10 + r() * (w - 40);
					const hy = top + 30 + r() * (h - 60);
					const hw = 12 + r() * 10;
					const gl = g.createLinearGradient(0, hy, 0, hy + 16);
					gl.addColorStop(0, '#ff8a2e');
					gl.addColorStop(1, '#a8281a');
					g.fillStyle = gl;
					g.beginPath();
					g.moveTo(hx, hy + 3);
					g.lineTo(hx + hw * 0.3, hy);
					g.lineTo(hx + hw * 0.55, hy + 4);
					g.lineTo(hx + hw, hy + 1);
					g.lineTo(hx + hw, hy + 15);
					g.lineTo(hx, hy + 15);
					g.closePath();
					g.fill();
					g.fillStyle = '#190a16';
					g.fillRect(hx + hw / 2 - 1, hy + 2, 2, 13);
					g.fillRect(hx, hy + 8, hw, 2);
				}
				if (r() < 0.55) fires.push({ x: x + 14 + r() * (w - 28), y: top + 8, w: 18 + r() * 16, ph: r() * 10 });
				x += w + 26 + r() * 70;
			}
			// a leaning lamp post and a crane silhouette
			g.strokeStyle = '#190a16';
			g.lineCap = 'round';
			g.lineWidth = 4;
			g.beginPath();
			g.moveTo(520, MID_H);
			g.lineTo(536, MID_H - 92);
			g.lineTo(560, MID_H - 96);
			g.stroke();
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(1180, MID_H);
			g.lineTo(1180, 20);
			g.lineTo(1330, 32);
			g.moveTo(1180, 30);
			g.lineTo(1120, 40);
			g.moveTo(1300, 31);
			g.lineTo(1300, 90);
			g.stroke();
			for (let i = 0; i < 9; i++) {
				g.beginPath();
				g.moveTo(1172, MID_H - i * 25);
				g.lineTo(1188, MID_H - i * 25 - 25);
				g.stroke();
			}
			return c;
		}

		function buildGround(): HTMLCanvasElement {
			const SH = H - GROUND_Y + 10;
			const [c, g] = mk(W, SH);
			const r = rng(55);
			const gr = g.createLinearGradient(0, 8, 0, SH);
			gr.addColorStop(0, '#4a2a1a');
			gr.addColorStop(0.18, '#2c1910');
			gr.addColorStop(1, '#0d0705');
			// bumpy rubble top (periodic, so the strip tiles)
			const top = (x: number) => 10 - 2.2 * Math.abs(Math.sin((x / W) * Math.PI * 13)) - 1.5 * Math.abs(Math.sin((x / W) * Math.PI * 31 + 1));
			g.beginPath();
			g.moveTo(0, SH);
			for (let x = 0; x <= W; x += 4) g.lineTo(x, top(x));
			g.lineTo(W, SH);
			g.closePath();
			g.fillStyle = gr;
			g.fill();
			g.beginPath();
			for (let x = 0; x <= W; x += 4) (x ? g.lineTo(x, top(x)) : g.moveTo(x, top(x)));
			g.strokeStyle = OUT;
			g.lineWidth = 3;
			g.stroke();
			g.beginPath();
			for (let x = 0; x <= W; x += 4) (x ? g.lineTo(x, top(x) + 2) : g.moveTo(x, top(x) + 2));
			g.strokeStyle = 'rgba(255,160,90,0.6)';
			g.lineWidth = 1.6;
			g.stroke();
			// cracks
			g.strokeStyle = 'rgba(0,0,0,0.45)';
			g.lineWidth = 1.5;
			for (let i = 0; i < 14; i++) {
				let x = r() * W;
				let y = 18 + r() * 60;
				g.beginPath();
				g.moveTo(x, y);
				for (let j = 0; j < 4; j++) {
					x += 8 + r() * 18;
					y += (r() - 0.5) * 10;
					g.lineTo(x, y);
				}
				g.stroke();
			}
			// rubble: bricks, concrete chunks, rebar, casings (drawn twice at the seam)
			const items: (() => void)[] = [];
			for (let i = 0; i < 46; i++) {
				const x = r() * W;
				const y = 16 + Math.pow(r(), 1.4) * 100;
				const kind = r();
				const rot = (r() - 0.5) * 1.2;
				const sz = 0.7 + r() * 0.8 * (y / 60);
				const tint = r();
				items.push(() => {
					for (const ox of [0, -W, W]) {
						g.save();
						g.translate(x + ox, y);
						g.rotate(rot);
						g.scale(sz, sz);
						if (kind < 0.42) {
							g.beginPath();
							g.roundRect(-8, -4, 16, 8, 2);
							g.fillStyle = tint < 0.5 ? '#8a3d26' : '#6e3020';
							g.fill();
							g.strokeStyle = OUT;
							g.lineWidth = 1.6;
							g.stroke();
							g.fillStyle = 'rgba(255,170,120,0.35)';
							g.fillRect(-6.5, -3, 13, 1.4);
						} else if (kind < 0.78) {
							g.beginPath();
							g.moveTo(-9, 4);
							g.lineTo(-6, -5);
							g.lineTo(4, -7);
							g.lineTo(10, 1);
							g.lineTo(6, 5);
							g.closePath();
							g.fillStyle = tint < 0.5 ? '#5d545c' : '#4a4049';
							g.fill();
							g.strokeStyle = OUT;
							g.lineWidth = 1.6;
							g.stroke();
							g.strokeStyle = 'rgba(255,200,160,0.3)';
							g.beginPath();
							g.moveTo(-5, -4);
							g.lineTo(3, -6);
							g.stroke();
						} else if (kind < 0.9) {
							g.strokeStyle = '#7a4a2e';
							g.lineWidth = 1.8;
							g.beginPath();
							g.moveTo(-12, 2);
							g.quadraticCurveTo(0, -6, 12, -2);
							g.stroke();
						} else {
							g.fillStyle = '#d9a43a';
							g.fillRect(-2, -1, 5, 2);
						}
						g.restore();
					}
				});
			}
			for (const f of items) f();
			return c;
		}

		function buildFore(): HTMLCanvasElement {
			const [c, g] = mk(STRIP, FORE_H);
			const r = rng(77);
			const col = '#0b0407';
			let x = 40;
			while (x < STRIP - 200) {
				const kind = r();
				const w = 90 + r() * 140;
				g.fillStyle = col;
				g.strokeStyle = 'rgba(255,120,60,0.4)';
				g.lineWidth = 2;
				if (kind < 0.5) {
					// rubble heap
					g.beginPath();
					g.moveTo(x, FORE_H);
					const n = 7;
					for (let i = 0; i <= n; i++) {
						const f = i / n;
						g.lineTo(x + f * w, FORE_H - Math.sin(f * Math.PI) * (26 + r() * 22) - r() * 6);
					}
					g.lineTo(x + w, FORE_H);
					g.closePath();
					g.fill();
					g.stroke();
				} else if (kind < 0.75) {
					// broken wall stub with rebar
					const h = 40 + r() * 26;
					g.beginPath();
					g.moveTo(x, FORE_H);
					g.lineTo(x + 4, FORE_H - h);
					g.lineTo(x + 18, FORE_H - h + 10);
					g.lineTo(x + 30, FORE_H - h - 6);
					g.lineTo(x + 44, FORE_H - h + 14);
					g.lineTo(x + 50, FORE_H);
					g.closePath();
					g.fill();
					g.stroke();
					g.strokeStyle = col;
					g.lineWidth = 2.4;
					for (let i = 0; i < 3; i++) {
						g.beginPath();
						g.moveTo(x + 10 + i * 13, FORE_H - h + 8);
						g.lineTo(x + 6 + i * 15 + r() * 8, FORE_H - h - 16 - r() * 10);
						g.stroke();
					}
				} else {
					// sandbag pile
					for (let row = 0; row < 3; row++) {
						for (let i = 0; i < 4 - row; i++) {
							g.beginPath();
							g.roundRect(x + i * 26 + row * 13, FORE_H - 14 - row * 13, 28, 15, 7);
							g.fill();
							g.stroke();
						}
					}
				}
				x += w + 110 + r() * 220;
			}
			return c;
		}

		function buildOverlay(): HTMLCanvasElement {
			const [c, g] = mk(W, H);
			const v = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, W * 0.72);
			v.addColorStop(0, 'rgba(8,0,8,0)');
			v.addColorStop(1, 'rgba(8,0,8,0.62)');
			g.fillStyle = v;
			g.fillRect(0, 0, W, H);
			const t = g.createLinearGradient(0, 0, 0, 110);
			t.addColorStop(0, 'rgba(6,0,10,0.4)');
			t.addColorStop(1, 'rgba(6,0,10,0)');
			g.fillStyle = t;
			g.fillRect(0, 0, W, 110);
			g.fillStyle = 'rgba(0,0,0,0.075)';
			for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
			return c;
		}

		function buildSmoke(): HTMLCanvasElement {
			const [c, g] = mk(160, 160);
			const r = rng(91);
			for (let i = 0; i < 7; i++) {
				const x = 50 + r() * 60;
				const y = 50 + r() * 60;
				const rad = 30 + r() * 26;
				const gr = g.createRadialGradient(x, y, 2, x, y, rad);
				gr.addColorStop(0, 'rgba(46,26,40,0.55)');
				gr.addColorStop(0.6, 'rgba(46,26,40,0.28)');
				gr.addColorStop(1, 'rgba(46,26,40,0)');
				g.fillStyle = gr;
				g.fillRect(0, 0, 160, 160);
			}
			return c;
		}

		function buildCoin(): HTMLCanvasElement {
			const [c, g] = mk(44, 44);
			g.translate(22, 22);
			const rim = g.createLinearGradient(0, -20, 0, 20);
			rim.addColorStop(0, '#fff6b0');
			rim.addColorStop(0.45, '#ffc928');
			rim.addColorStop(1, '#b86e00');
			g.beginPath();
			g.arc(0, 0, 19, 0, Math.PI * 2);
			g.fillStyle = rim;
			g.fill();
			g.lineWidth = 2.6;
			g.strokeStyle = '#5a3200';
			g.stroke();
			g.setLineDash([2.4, 2.6]);
			g.strokeStyle = 'rgba(255,243,176,0.85)';
			g.lineWidth = 1.2;
			g.beginPath();
			g.arc(0, 0, 16, 0, Math.PI * 2);
			g.stroke();
			g.setLineDash([]);
			const inner = g.createRadialGradient(-4, -5, 1, 0, 0, 14);
			inner.addColorStop(0, '#ffe680');
			inner.addColorStop(0.7, '#f0a800');
			inner.addColorStop(1, '#c47a00');
			g.beginPath();
			g.arc(0, 0, 13, 0, Math.PI * 2);
			g.fillStyle = inner;
			g.fill();
			g.strokeStyle = '#9a6000';
			g.lineWidth = 1.2;
			g.stroke();
			// a tiny burger
			g.lineWidth = 1.3;
			g.strokeStyle = '#2a1408';
			g.beginPath();
			g.moveTo(-7.5, -0.6);
			g.quadraticCurveTo(-7.5, -8, 0, -8);
			g.quadraticCurveTo(7.5, -8, 7.5, -0.6);
			g.closePath();
			g.fillStyle = '#f0a24a';
			g.fill();
			g.stroke();
			g.fillStyle = '#4fb23a';
			g.fillRect(-8, -0.8, 16, 2.4);
			g.beginPath();
			g.roundRect(-7.5, 1.4, 15, 3.2, 1.4);
			g.fillStyle = '#6b3a1c';
			g.fill();
			g.stroke();
			g.beginPath();
			g.moveTo(-7, 5.2);
			g.lineTo(7, 5.2);
			g.quadraticCurveTo(7, 8.8, 3.4, 8.8);
			g.lineTo(-3.4, 8.8);
			g.quadraticCurveTo(-7, 8.8, -7, 5.2);
			g.closePath();
			g.fillStyle = '#f0a24a';
			g.fill();
			g.stroke();
			g.fillStyle = '#fff3d0';
			for (const [x, y] of [
				[-3, -4.6],
				[1, -5.8],
				[4, -3.4]
			])
				g.fillRect(x, y, 1.4, 0.9);
			g.strokeStyle = 'rgba(255,255,255,0.7)';
			g.lineWidth = 2;
			g.lineCap = 'round';
			g.beginPath();
			g.arc(0, 0, 15.5, Math.PI * 1.1, Math.PI * 1.45);
			g.stroke();
			return c;
		}

		function buildLayers() {
			L = {
				sky: buildSky(),
				far: buildFar(),
				mid: buildMid(),
				ground: buildGround(),
				fore: buildFore(),
				over: buildOverlay(),
				smoke: buildSmoke(),
				coin: buildCoin()
			};
		}

		function resize() {
			const cw = cv.clientWidth || W;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const pw = Math.max(1, Math.round(cw * dpr));
			const ph = Math.round((pw * H) / W);
			k = Math.max(1, Math.min(1.6, 0.62 / (cw / W)));
			if (cv.width !== pw || cv.height !== ph || !L) {
				cv.width = pw;
				cv.height = ph;
				scale = pw / W;
				buildLayers();
				if (paused) draw();
			}
		}

		// ---------- particles ----------
		function emit(p: Partial<Particle> & { k: PKind; x: number; y: number }) {
			if (parts.length >= maxParts) parts.shift();
			parts.push({ vx: 0, vy: 0, life: 0, max: 0.6, size: 6, rot: 0, vr: 0, col: '#fff', g: 0, ...p });
		}
		const R = () => Math.random();

		function dust(x: number, y: number, n: number, dir = -1, big = 1) {
			const m = reduce ? Math.ceil(n / 2) : n;
			for (let i = 0; i < m; i++)
				emit({
					k: 'dust',
					x,
					y,
					vx: dir * (40 + R() * 110) * big + (R() - 0.5) * 60,
					vy: -(20 + R() * 70) * big,
					max: 0.35 + R() * 0.35,
					size: (5 + R() * 7) * big,
					col: R() < 0.5 ? '#8a6a4a' : '#a5825c'
				});
		}

		function explode(x: number, y: number, power = 1) {
			const n = Math.round((reduce ? 16 : 34) * power);
			for (let i = 0; i < n; i++) {
				const a = R() * Math.PI * 2;
				const sp = (80 + R() * 340) * power;
				emit({ k: 'fire', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 80, max: 0.35 + R() * 0.45, size: (14 + R() * 18) * power, col: R() < 0.4 ? '#fff0a0' : R() < 0.7 ? '#ffae3a' : '#ff5a1f' });
			}
			for (let i = 0; i < Math.round((reduce ? 6 : 14) * power); i++) {
				const a = -Math.PI * (0.1 + R() * 0.8);
				const sp = 220 + R() * 420;
				emit({ k: 'debris', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, max: 0.9 + R() * 0.6, size: 3 + R() * 5, rot: R() * 6, vr: (R() - 0.5) * 16, col: R() < 0.5 ? '#3a2a24' : '#6a4a3a', g: 1300 });
			}
			for (let i = 0; i < Math.round((reduce ? 4 : 10) * power); i++)
				emit({ k: 'smoke', x: x + (R() - 0.5) * 40, y: y - R() * 30, vx: (R() - 0.5) * 60, vy: -30 - R() * 60, max: 1 + R() * 0.8, size: 26 + R() * 26 });
			for (let i = 0; i < (reduce ? 4 : 10); i++) {
				const a = R() * Math.PI * 2;
				emit({ k: 'spark', x, y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300 - 120, max: 0.5 + R() * 0.5, size: 2 + R() * 2, col: '#ffe08a', g: 500 });
			}
			emit({ k: 'ring', x, y, max: 0.45, size: 20 * power, col: '#fff3c0' });
		}

		function floatText(text: string, x: number, y: number, col: string) {
			emit({ k: 'text', x, y, vy: -70, max: 0.8, size: 26, col, text, scr: true });
		}

		// ---------- the run ----------
		function onJump() {
			sq = 1.3;
			dust(PLAYER_X - 6, GROUND_Y, 6, -1, 0.9);
		}
		function onLand() {
			sq = 0.68;
			dust(PLAYER_X, GROUND_Y, 8, -1, 1.1);
			dust(PLAYER_X, GROUND_Y, 4, 1, 0.7);
		}

		function die(o: Obstacle) {
			dead = true;
			deadT = 0;
			deathV = speedAt(dist);
			scoreDist = dist;
			slideHeld = false;
			const y = GROUND_Y - run.h - (run.slide > 0 ? 20 : 44);
			corpse.x = PLAYER_X;
			corpse.y = y;
			corpse.vx = -120;
			corpse.vy = -640;
			corpse.rot = 0;
			corpse.vr = -9;
			const big = o.kind === 'mine' || o.kind === 'car' || o.kind === 'strike' || o.kind === 'drone';
			if (o.kind === 'drone' || o.kind === 'mine') wrecked.add(o.id);
			explode(PLAYER_X + 18, y + 10, big ? 1.2 : 0.8);
			shake = reduce ? 0 : big ? 18 : 12;
			flash = reduce ? 0.25 : 0.75;
			flashCol = '255,190,110';
			sound.play('divergence');
		}

		function blast(o: Obstacle) {
			blown.set(o.id, clock);
			const cx = o.x + OBSTACLES.strike.w / 2;
			explode(cx, GROUND_Y - 14, 1.5);
			for (let i = 0; i < (reduce ? 4 : 10); i++)
				emit({ k: 'fire', x: cx + (R() - 0.5) * 60, y: GROUND_Y - 30 - R() * 110, vx: (R() - 0.5) * 60, vy: -160 - R() * 160, max: 0.6 + R() * 0.4, size: 30 + R() * 24, col: R() < 0.5 ? '#ffd27a' : '#ff7a2a' });
			shake = Math.max(shake, reduce ? 0 : 14);
			flash = Math.max(flash, reduce ? 0.15 : 0.45);
			flashCol = '255,210,140';
			sound.play('divergence');
		}

		function update(dt: number) {
			clock += dt;
			const obs = course.obstacles;
			if (!dead) {
				let left = dt;
				while (left > 1e-6 && !dead) {
					const h = Math.min(1 / 240, left);
					left -= h;
					const v = speedAt(dist);
					const ev = stepRunner(run, h, slideHeld);
					if (ev.jumped) onJump();
					if (ev.landed) onLand();
					dist += v * h;
					course.extend(dist + W * 1.8);
					while (oi < obs.length && obs[oi].x + OBSTACLES[obs[oi].kind].w < dist - PLAYER_X - 260) oi++;
					for (let i = oi; i < obs.length; i++) {
						const o = obs[i];
						if (o.x > dist + 60) break;
						if (hits(run, dist, o)) {
							die(o);
							break;
						}
					}
					const cs = course.coins;
					while (ci < cs.length && cs[ci].x < dist - PLAYER_X - 60) ci++;
					for (let i = ci; i < cs.length; i++) {
						const c = cs[i];
						if (c.x > dist + 60) break;
						if (!got.has(c.id) && grabs(run, dist, c)) {
							got.add(c.id);
							coins++;
							const sy = GROUND_Y - c.h;
							const sx = c.x - dist + PLAYER_X;
							for (let j = 0; j < (reduce ? 3 : 7); j++) {
								const a = R() * Math.PI * 2;
								emit({ k: 'star', x: c.x, y: sy, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, max: 0.45, size: 5 + R() * 4, col: R() < 0.5 ? '#fff6b0' : '#ffc928' });
							}
							floatText('+10', sx, sy - 18, '#ffd23a');
							sound.play('clack');
						}
					}
				}
				const v = speedAt(dist);
				// run cycle + footstep dust
				if (!airborne(run) && run.slide <= 0) {
					phase += dt * Math.min(26, v / 30);
					const step = Math.floor(phase / Math.PI);
					if (step !== lastStep) {
						lastStep = step;
						if (!reduce || step % 2 === 0) dust(PLAYER_X - 4, GROUND_Y, 2, -1, 0.55);
					}
				}
				if (run.slide > 0 && !airborne(run) && R() < (reduce ? 0.25 : 0.7)) {
					emit({ k: 'dust', x: dist + 24, y: GROUND_Y - 2, vx: -60 - R() * 80, vy: -40 - R() * 70, max: 0.4, size: 5 + R() * 6, col: '#a5825c' });
					if (R() < 0.3) emit({ k: 'spark', x: dist + 30, y: GROUND_Y - 3, vx: -150 - R() * 120, vy: -60 - R() * 80, max: 0.3, size: 1.6, col: '#ffd27a', g: 600 });
				}
				// air strikes go off as you come close
				for (let i = oi; i < obs.length; i++) {
					const o = obs[i];
					if (o.x - dist > STRIKE_BLAST_AHEAD + 2) break;
					if (o.kind === 'strike' && !blown.has(o.id)) blast(o);
				}
				// burning wrecks smoke
				for (let i = oi; i < obs.length; i++) {
					const o = obs[i];
					const sx = o.x - dist + PLAYER_X;
					if (sx > W + 40) break;
					if (o.kind === 'car' && R() < dt * (reduce ? 4 : 10))
						emit({ k: 'smoke', x: o.x + 30 + R() * 80, y: GROUND_Y - 70, vx: -20, vy: -50 - R() * 40, max: 1.4, size: 16 + R() * 12 });
				}
				const m = Math.floor(dist / PX_PER_M);
				if (m >= nextMile) {
					banner = { text: s.milestone(nextMile), sub: nextMile <= 1500 ? s.speedUp : s.keepGoing, t: 0 };
					nextMile += nextMile < 1000 ? 250 : 500;
					sound.play('camo');
				}
				// the tag above a new kind of obstacle goes once it has been passed
				for (let i = oi; i < obs.length; i++) {
					const o = obs[i];
					if (o.x + OBSTACLES[o.kind].w < dist - 20) tagged.add(o.kind);
					else break;
				}
			} else {
				deadT += dt;
				deathV *= Math.exp(-dt * 5);
				dist += deathV * dt;
				corpse.vy += 1700 * dt;
				corpse.x += corpse.vx * dt;
				corpse.y += corpse.vy * dt;
				corpse.rot += corpse.vr * dt;
				const floor = GROUND_Y - 14;
				if (corpse.y > floor) {
					corpse.y = floor;
					corpse.vy *= -0.35;
					corpse.vx *= 0.6;
					corpse.vr *= 0.5;
					if (Math.abs(corpse.vy) > 60) dust(corpse.x + dist - PLAYER_X, GROUND_Y, 6, 1, 1);
				}
				if (deadT > 1.0 && !ended) {
					ended = true;
					stop();
					finish(scoreOf(scoreDist, coins));
					return;
				}
			}
			// particles
			for (let i = parts.length - 1; i >= 0; i--) {
				const p = parts[i];
				p.life += dt;
				if (p.life >= p.max) {
					parts.splice(i, 1);
					continue;
				}
				p.vy += (p.g ?? 0) * dt;
				if (p.k === 'dust' || p.k === 'smoke' || p.k === 'fire') {
					p.vx *= Math.exp(-dt * 2.4);
					p.vy *= Math.exp(-dt * 2);
				}
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.vr * dt;
				if (p.k === 'debris' && p.y > GROUND_Y + 4) {
					p.y = GROUND_Y + 4;
					p.vy *= -0.3;
					p.vx *= 0.5;
				}
			}
			sq += (1 - sq) * (1 - Math.exp(-dt * 14));
			shake *= Math.exp(-dt * 7);
			if (shake < 0.3) shake = 0;
			flash *= Math.exp(-dt * 5);
			if (banner) {
				banner.t += dt;
				if (banner.t > 1.6) banner = null;
			}
		}

		// ---------- drawing ----------
		const sx = (x: number) => x - dist + PLAYER_X;

		function strip(img: HTMLCanvasElement, off: number, y: number) {
			const sw = img.width / scale;
			const sh = img.height / scale;
			let o = off % sw;
			if (o < 0) o += sw;
			o = Math.round(o * scale) / scale;
			const px = 1 / scale;
			ctx.drawImage(img, -o, y, sw + px, sh);
			if (sw - o < W) ctx.drawImage(img, sw - o - px, y, sw + px, sh);
		}

		function tongue(x: number, y: number, w: number, h: number, lean: number, col: string, line?: string) {
			ctx.beginPath();
			ctx.moveTo(x - w / 2, y);
			ctx.bezierCurveTo(x - w / 2, y - h * 0.5, x + lean - w * 0.18, y - h * 0.72, x + lean, y - h);
			ctx.bezierCurveTo(x + lean + w * 0.18, y - h * 0.72, x + w / 2, y - h * 0.5, x + w / 2, y);
			ctx.closePath();
			ctx.fillStyle = col;
			ctx.fill();
			if (line) {
				ctx.strokeStyle = line;
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}

		function flame(x: number, y: number, w: number, h: number, ph: number, outline = true) {
			const f = 0.82 + 0.13 * Math.sin(clock * 13 + ph) + 0.07 * Math.sin(clock * 27 + ph * 3);
			const lean = Math.sin(clock * 5 + ph) * w * 0.18 - w * 0.12;
			tongue(x, y, w, h * f, lean, '#ff4a1a', outline ? '#6a1206' : undefined);
			tongue(x + w * 0.05, y, w * 0.66, h * f * 0.74, lean * 0.8, '#ffa62a');
			tongue(x + w * 0.08, y, w * 0.34, h * f * 0.44, lean * 0.5, '#fff2b0');
		}

		function glow(x: number, y: number, r: number, col: string, a: number) {
			const g = ctx.createRadialGradient(x, y, 0, x, y, r);
			g.addColorStop(0, `rgba(${col},${a})`);
			g.addColorStop(1, `rgba(${col},0)`);
			ctx.fillStyle = g;
			ctx.fillRect(x - r, y - r, r * 2, r * 2);
		}

		function ink(fill: string | CanvasGradient, lw = 3, line = OUT) {
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.lineWidth = lw;
			ctx.strokeStyle = line;
			ctx.stroke();
		}

		function drawBackground() {
			if (!L) return;
			ctx.drawImage(L.sky, 0, 0, W, H);
			// the mushroom cloud's fireball breathes
			ctx.globalCompositeOperation = 'lighter';
			glow(585, 236, 150, '255,170,80', 0.16 + 0.06 * Math.sin(clock * 1.7));
			glow(585, 440, 120, '255,190,90', 0.18 + 0.07 * Math.sin(clock * 2.3 + 1));
			ctx.globalCompositeOperation = 'source-over';
			strip(L.far, dist * 0.08, GROUND_Y - FAR_H + 6);
			// smoke band between the far and the mid layer
			const sm = L.smoke;
			for (let i = 0; i < 7; i++) {
				const span = 1900;
				let x = (i * 290 - dist * 0.2 - clock * 14) % span;
				if (x < -200) x += span;
				ctx.globalAlpha = 0.55;
				ctx.drawImage(sm, x - 100, GROUND_Y - 240 - (i % 3) * 40, 260, 260);
			}
			ctx.globalAlpha = 1;
			const midY = GROUND_Y - MID_H + 4;
			strip(L.mid, dist * 0.3, midY);
			// rooftop fires on the mid layer (with smoke columns)
			let o = (dist * 0.3) % STRIP;
			if (o < 0) o += STRIP;
			for (const f of fires) {
				for (const base of [-o, STRIP - o]) {
					const x = base + f.x;
					if (x < -80 || x > W + 80) continue;
					const y = midY + f.y;
					for (let j = 0; j < 4; j++) {
						const age = (clock * 0.28 + j / 4 + f.ph) % 1;
						ctx.globalAlpha = 0.5 * (1 - age);
						const sz = 40 + age * 110;
						ctx.drawImage(sm, x - sz / 2 - age * 40, y - 30 - age * 150 - sz / 2, sz, sz);
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'lighter';
					glow(x, y - 8, f.w * 2.2, '255,120,50', 0.35 + 0.1 * Math.sin(clock * 9 + f.ph));
					ctx.globalCompositeOperation = 'source-over';
					flame(x - f.w * 0.3, y + 2, f.w * 0.7, f.w * 1.3, f.ph, false);
					flame(x + f.w * 0.2, y + 2, f.w * 0.9, f.w * 1.8, f.ph + 2, false);
				}
			}
			strip(L.ground, dist, GROUND_Y - 10);
		}

		function drawStrikeGround(o: Obstacle) {
			const cx = sx(o.x + OBSTACLES.strike.w / 2);
			const when = blown.get(o.id);
			if (when === undefined) {
				// red target on the ground, pulsing faster as it nears
				const near = Math.max(0, Math.min(1, 1 - (o.x - dist - STRIKE_BLAST_AHEAD) / 600));
				const pulse = 0.5 + 0.5 * Math.sin(clock * (6 + near * 18));
				ctx.save();
				ctx.translate(cx, GROUND_Y + 4);
				ctx.scale(1, 0.24);
				ctx.globalCompositeOperation = 'lighter';
				glow(0, 0, 90, '255,40,60', 0.25 + 0.25 * pulse);
				ctx.globalCompositeOperation = 'source-over';
				ctx.lineWidth = 8;
				ctx.strokeStyle = OUT;
				ctx.beginPath();
				ctx.arc(0, 0, 62, 0, Math.PI * 2);
				ctx.stroke();
				ctx.lineWidth = 5;
				ctx.strokeStyle = `rgba(255,${50 + pulse * 60},70,1)`;
				ctx.stroke();
				ctx.setLineDash([14, 12]);
				ctx.lineDashOffset = -clock * 60;
				ctx.lineWidth = 4;
				ctx.beginPath();
				ctx.arc(0, 0, 40, 0, Math.PI * 2);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.beginPath();
				ctx.moveTo(-76, 0);
				ctx.lineTo(-20, 0);
				ctx.moveTo(20, 0);
				ctx.lineTo(76, 0);
				ctx.moveTo(0, -76);
				ctx.lineTo(0, -20);
				ctx.moveTo(0, 20);
				ctx.lineTo(0, 76);
				ctx.stroke();
				ctx.restore();
				// the shell coming down
				const lead = speedAt(dist) * 0.5;
				const until = o.x - dist - STRIKE_BLAST_AHEAD;
				if (until < lead) {
					const f = Math.max(0, Math.min(1, 1 - until / lead));
					const my = -60 + f * (GROUND_Y + 40);
					ctx.save();
					ctx.translate(cx + (1 - f) * 40, my);
					ctx.rotate(-0.2 + 0.2 * f);
					ctx.globalCompositeOperation = 'lighter';
					glow(0, -40, 26, '255,180,80', 0.5);
					ctx.globalCompositeOperation = 'source-over';
					tongue(0, -34, 10, 22 + Math.random() * 12, 0, '#ffb02e');
					ctx.beginPath();
					ctx.roundRect(-7, -34, 14, 40, 6);
					ink('#5a6068', 2.5);
					ctx.beginPath();
					ctx.moveTo(-7, 2);
					ctx.quadraticCurveTo(0, 22, 7, 2);
					ctx.closePath();
					ink('#e2261f', 2.5);
					ctx.beginPath();
					ctx.moveTo(-7, -30);
					ctx.lineTo(-14, -40);
					ctx.lineTo(-7, -22);
					ctx.moveTo(7, -30);
					ctx.lineTo(14, -40);
					ctx.lineTo(7, -22);
					ink('#3a3f46', 2);
					ctx.fillStyle = '#ffd23a';
					ctx.fillRect(-7, -14, 14, 4);
					ctx.restore();
				}
			} else {
				// the crater it leaves, still burning
				ctx.save();
				ctx.translate(cx, GROUND_Y + 2);
				ctx.beginPath();
				ctx.ellipse(0, 0, 58, 12, 0, 0, Math.PI * 2);
				const g = ctx.createRadialGradient(0, -2, 4, 0, 0, 58);
				g.addColorStop(0, '#120604');
				g.addColorStop(0.75, '#2a120a');
				g.addColorStop(1, '#ff7a2a');
				ink(g, 3);
				ctx.restore();
				const age = clock - when;
				const hot = Math.max(0.55, 1 - age * 0.15);
				ctx.globalCompositeOperation = 'lighter';
				glow(cx, GROUND_Y - 6, 70, '255,120,40', 0.4 * hot);
				ctx.globalCompositeOperation = 'source-over';
				for (let i = 0; i < 5; i++) flame(cx - 40 + i * 20, GROUND_Y + 2, 18, (30 + (i % 2) * 12) * hot, o.id + i * 1.7);
			}
		}

		function drawObstacle(o: Obstacle) {
			const spec = OBSTACLES[o.kind];
			const x0 = sx(o.x);
			const cx = x0 + spec.w / 2;
			const g = GROUND_Y;
			if (o.kind !== 'drone' && o.kind !== 'strike') {
				ctx.fillStyle = 'rgba(0,0,0,0.35)';
				ctx.beginPath();
				ctx.ellipse(cx, g + 3, spec.w * 0.6, 6, 0, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			if (o.kind === 'wire') {
				for (const px of [cx - 30, cx + 30]) {
					for (const a of [-0.42, 0.42]) {
						ctx.save();
						ctx.translate(px, g - 20);
						ctx.rotate(a);
						ctx.beginPath();
						ctx.roundRect(-3.5, -26, 7, 50, 2);
						const wd = ctx.createLinearGradient(-4, 0, 4, 0);
						wd.addColorStop(0, '#a46a3c');
						wd.addColorStop(1, '#5e3618');
						ink(wd, 2.5);
						ctx.restore();
					}
				}
				for (let i = 0; i < 8; i++) {
					const lx = cx - 33 + i * 9.4;
					ctx.beginPath();
					ctx.ellipse(lx, g - 19, 8, 17, 0.35, 0, Math.PI * 2);
					ctx.strokeStyle = OUT;
					ctx.lineWidth = 4.2;
					ctx.stroke();
					ctx.strokeStyle = i % 2 ? '#c9d1d8' : '#9aa3ad';
					ctx.lineWidth = 2;
					ctx.stroke();
				}
				ctx.strokeStyle = '#e6ecf2';
				ctx.lineWidth = 1.6;
				for (let i = 0; i < 7; i++) {
					const bx = cx - 30 + i * 10;
					const by = g - 36 + (i % 2) * 34;
					ctx.beginPath();
					ctx.moveTo(bx - 3, by - 3);
					ctx.lineTo(bx + 3, by + 3);
					ctx.moveTo(bx + 3, by - 3);
					ctx.lineTo(bx - 3, by + 3);
					ctx.stroke();
				}
			} else if (o.kind === 'sandbags') {
				const rows = [
					[x0 - 3, x0 + 22, x0 + 47],
					[x0 + 8, x0 + 35],
					[x0 + 20]
				];
				const widths = [28, 30, 32];
				rows.forEach((row, ri) => {
					for (const bx of row) {
						const by = g - 19 - ri * 18;
						ctx.beginPath();
						ctx.roundRect(bx, by, widths[ri], 19, 9);
						const sg = ctx.createLinearGradient(0, by, 0, by + 19);
						sg.addColorStop(0, '#ecd29a');
						sg.addColorStop(0.55, '#c6a368');
						sg.addColorStop(1, '#8a6a3a');
						ink(sg, 2.6);
						ctx.strokeStyle = 'rgba(90,60,30,0.6)';
						ctx.lineWidth = 1.2;
						ctx.setLineDash([2.5, 2.5]);
						ctx.beginPath();
						ctx.moveTo(bx + 5, by + 9.5);
						ctx.lineTo(bx + widths[ri] - 5, by + 9.5);
						ctx.stroke();
						ctx.setLineDash([]);
						ctx.strokeStyle = 'rgba(255,245,215,0.6)';
						ctx.lineWidth = 2;
						ctx.beginPath();
						ctx.moveTo(bx + 6, by + 4);
						ctx.lineTo(bx + widths[ri] - 9, by + 4);
						ctx.stroke();
					}
				});
			} else if (o.kind === 'mine') {
				if (wrecked.has(o.id)) return;
				ctx.beginPath();
				ctx.ellipse(cx, g + 1, 24, 7, 0, Math.PI, 0);
				ink('#5a3a24', 2.5);
				ctx.beginPath();
				ctx.ellipse(cx, g - 5, 17, 6, 0, 0, Math.PI * 2);
				const mg = ctx.createLinearGradient(0, g - 11, 0, g + 1);
				mg.addColorStop(0, '#8a9468');
				mg.addColorStop(1, '#3e4628');
				ink(mg, 2.5);
				ctx.beginPath();
				ctx.ellipse(cx, g - 8, 10, 3.4, 0, 0, Math.PI * 2);
				ink('#5d6b3c', 2);
				for (const px of [-6, 0, 6]) {
					ctx.beginPath();
					ctx.moveTo(cx + px, g - 9);
					ctx.lineTo(cx + px, g - 14);
					ctx.strokeStyle = OUT;
					ctx.lineWidth = 2.2;
					ctx.stroke();
				}
				const on = (clock * 1.6 + o.id * 0.3) % 1 < 0.45;
				if (on) {
					ctx.globalCompositeOperation = 'lighter';
					glow(cx, g - 15, 22, '255,40,40', 0.75);
					ctx.globalCompositeOperation = 'source-over';
				}
				ctx.beginPath();
				ctx.arc(cx, g - 15, 3.2, 0, Math.PI * 2);
				ink(on ? '#ff4a4a' : '#7a1a1a', 1.6);
			} else if (o.kind === 'drone') {
				if (wrecked.has(o.id)) return;
				const bob = Math.sin(clock * 6 + o.id) * 3;
				const cy = g - 76 + bob;
				// scanning beam
				ctx.globalCompositeOperation = 'lighter';
				const bg = ctx.createLinearGradient(0, cy + 8, 0, g);
				bg.addColorStop(0, 'rgba(255,40,50,0.32)');
				bg.addColorStop(1, 'rgba(255,40,50,0)');
				ctx.fillStyle = bg;
				ctx.beginPath();
				const sweep = Math.sin(clock * 3 + o.id) * 14;
				ctx.moveTo(cx - 2, cy + 10);
				ctx.lineTo(cx - 26 + sweep, g);
				ctx.lineTo(cx + 22 + sweep, g);
				ctx.lineTo(cx + 2, cy + 10);
				ctx.fill();
				glow(cx, cy + 10, 26, '255,50,50', 0.6);
				ctx.globalCompositeOperation = 'source-over';
				// arms + rotors
				for (const side of [-1, 1]) {
					ctx.beginPath();
					ctx.moveTo(cx + side * 10, cy - 2);
					ctx.lineTo(cx + side * 34, cy - 9);
					ctx.strokeStyle = OUT;
					ctx.lineWidth = 7;
					ctx.stroke();
					ctx.strokeStyle = '#3a3f46';
					ctx.lineWidth = 3.5;
					ctx.stroke();
					ctx.beginPath();
					ctx.roundRect(cx + side * 34 - 4, cy - 14, 8, 7, 2);
					ink('#23262b', 2);
					const spin = Math.sin(clock * 60 + side) * 0.5 + 0.5;
					ctx.beginPath();
					ctx.ellipse(cx + side * 34, cy - 15, 19, 3.4 + spin, 0, 0, Math.PI * 2);
					ctx.fillStyle = 'rgba(220,232,242,0.38)';
					ctx.fill();
					ctx.strokeStyle = 'rgba(20,10,6,0.8)';
					ctx.lineWidth = 1.6;
					ctx.stroke();
				}
				// skids
				ctx.strokeStyle = OUT;
				ctx.lineWidth = 2.5;
				ctx.beginPath();
				ctx.moveTo(cx - 12, cy + 6);
				ctx.lineTo(cx - 16, cy + 16);
				ctx.lineTo(cx - 4, cy + 16);
				ctx.moveTo(cx + 12, cy + 6);
				ctx.lineTo(cx + 16, cy + 16);
				ctx.lineTo(cx + 4, cy + 16);
				ctx.stroke();
				// body
				ctx.beginPath();
				ctx.moveTo(cx - 22, cy - 2);
				ctx.lineTo(cx - 14, cy - 10);
				ctx.lineTo(cx + 16, cy - 10);
				ctx.lineTo(cx + 24, cy - 1);
				ctx.lineTo(cx + 14, cy + 8);
				ctx.lineTo(cx - 14, cy + 8);
				ctx.closePath();
				const dg = ctx.createLinearGradient(0, cy - 10, 0, cy + 8);
				dg.addColorStop(0, '#6a717c');
				dg.addColorStop(0.5, '#3a3f48');
				dg.addColorStop(1, '#1f2228');
				ink(dg, 3);
				ctx.fillStyle = '#ffc928';
				ctx.fillRect(cx - 12, cy - 7, 24, 3);
				ctx.fillStyle = OUT;
				for (let i = 0; i < 4; i++) ctx.fillRect(cx - 10 + i * 6, cy - 7, 3, 3);
				ctx.strokeStyle = 'rgba(255,255,255,0.35)';
				ctx.lineWidth = 1.6;
				ctx.beginPath();
				ctx.moveTo(cx - 12, cy - 8.5);
				ctx.lineTo(cx + 14, cy - 8.5);
				ctx.stroke();
				// camera eye
				ctx.beginPath();
				ctx.arc(cx + 6, cy + 7, 6, 0, Math.PI);
				ink('#1a1a1a', 2);
				ctx.beginPath();
				ctx.arc(cx + 6, cy + 9, 2.6, 0, Math.PI * 2);
				ctx.fillStyle = (clock * 4) % 1 < 0.7 ? '#ff3b3b' : '#ffb0a0';
				ctx.fill();
				// antenna
				ctx.strokeStyle = OUT;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(cx - 8, cy - 10);
				ctx.lineTo(cx - 12, cy - 20);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(cx - 12, cy - 21, 2.2, 0, Math.PI * 2);
				ctx.fillStyle = (clock * 2) % 1 < 0.5 ? '#ff3b3b' : '#5a1010';
				ctx.fill();
			} else if (o.kind === 'car') {
				ctx.globalCompositeOperation = 'lighter';
				glow(cx, g - 60, 110, '255,110,40', 0.34 + 0.08 * Math.sin(clock * 8 + o.id));
				ctx.globalCompositeOperation = 'source-over';
				// body
				ctx.beginPath();
				ctx.moveTo(x0 - 4, g - 12);
				ctx.lineTo(x0 - 2, g - 34);
				ctx.quadraticCurveTo(x0 + 4, g - 42, x0 + 24, g - 42);
				ctx.lineTo(x0 + 38, g - 42);
				ctx.lineTo(x0 + 50, g - 62);
				ctx.lineTo(x0 + 98, g - 62);
				ctx.lineTo(x0 + 114, g - 42);
				ctx.lineTo(x0 + 132, g - 40);
				ctx.quadraticCurveTo(x0 + 142, g - 36, x0 + 140, g - 22);
				ctx.lineTo(x0 + 138, g - 12);
				ctx.closePath();
				const cg = ctx.createLinearGradient(0, g - 62, 0, g - 10);
				cg.addColorStop(0, '#2a1a16');
				cg.addColorStop(0.35, '#7a2e1c');
				cg.addColorStop(1, '#3a160e');
				ink(cg, 3);
				// rust + soot
				ctx.fillStyle = 'rgba(176,90,40,0.55)';
				for (const [rx, ry, rr] of [
					[x0 + 20, g - 26, 6],
					[x0 + 70, g - 20, 8],
					[x0 + 118, g - 28, 5]
				]) {
					ctx.beginPath();
					ctx.arc(rx, ry, rr, 0, Math.PI * 2);
					ctx.fill();
				}
				// broken windows
				ctx.beginPath();
				ctx.moveTo(x0 + 52, g - 44);
				ctx.lineTo(x0 + 58, g - 58);
				ctx.lineTo(x0 + 72, g - 58);
				ctx.lineTo(x0 + 72, g - 44);
				ctx.closePath();
				ink('#140806', 2);
				ctx.beginPath();
				ctx.moveTo(x0 + 78, g - 44);
				ctx.lineTo(x0 + 78, g - 58);
				ctx.lineTo(x0 + 94, g - 58);
				ctx.lineTo(x0 + 106, g - 44);
				ctx.closePath();
				ink('#140806', 2);
				ctx.strokeStyle = 'rgba(190,220,240,0.6)';
				ctx.lineWidth = 1.4;
				ctx.beginPath();
				ctx.moveTo(x0 + 80, g - 56);
				ctx.lineTo(x0 + 86, g - 48);
				ctx.lineTo(x0 + 84, g - 45);
				ctx.moveTo(x0 + 58, g - 56);
				ctx.lineTo(x0 + 63, g - 50);
				ctx.stroke();
				ctx.strokeStyle = 'rgba(255,170,110,0.45)';
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(x0 + 6, g - 37);
				ctx.lineTo(x0 + 36, g - 38);
				ctx.moveTo(x0 + 112, g - 38);
				ctx.lineTo(x0 + 130, g - 36);
				ctx.stroke();
				// flat tyres
				for (const wx of [x0 + 28, x0 + 112]) {
					ctx.beginPath();
					ctx.ellipse(wx, g - 7, 15, 10, 0, 0, Math.PI * 2);
					ink('#1c1a1a', 3);
					ctx.beginPath();
					ctx.ellipse(wx, g - 8, 6, 4.5, 0, 0, Math.PI * 2);
					ink('#5a5a60', 2);
				}
				// fire on the roof and the bonnet
				flame(x0 + 60, g - 58, 26, 46, o.id);
				flame(x0 + 84, g - 58, 32, 62, o.id + 2.2);
				flame(x0 + 104, g - 44, 22, 36, o.id + 4.1);
				flame(x0 + 22, g - 40, 18, 28, o.id + 5.3);
			}
		}

		function drawCoins() {
			if (!L) return;
			const cs = course.coins;
			for (let i = ci; i < cs.length; i++) {
				const c = cs[i];
				const x = sx(c.x);
				if (x > W + 30) break;
				if (got.has(c.id) || x < -30) continue;
				const y = GROUND_Y - c.h + Math.sin(clock * 4 + c.id) * 2;
				const spin = Math.cos(clock * 5 + c.id * 0.7);
				const wv = Math.max(0.14, Math.abs(spin));
				ctx.globalCompositeOperation = 'lighter';
				glow(x, y, 26, '255,200,60', 0.22);
				ctx.globalCompositeOperation = 'source-over';
				if (wv < 0.5) {
					ctx.beginPath();
					ctx.ellipse(x, y, 19 * wv + 2.5, 19, 0, 0, Math.PI * 2);
					ctx.fillStyle = '#9a5c00';
					ctx.fill();
				}
				ctx.drawImage(L.coin, x - 22 * wv, y - 22, 44 * wv, 44);
			}
		}

		type J = [number, number];
		const at = (p: J, len: number, a: number): J => [p[0] + Math.sin(a) * len, p[1] + Math.cos(a) * len];

		function limb(a: J, b: J, c: J, w: number, col: string) {
			ctx.beginPath();
			ctx.moveTo(a[0], a[1]);
			ctx.lineTo(b[0], b[1]);
			ctx.lineTo(c[0], c[1]);
			ctx.strokeStyle = OUT;
			ctx.lineWidth = w + 5;
			ctx.stroke();
			ctx.strokeStyle = col;
			ctx.lineWidth = w;
			ctx.stroke();
		}

		function boot(foot: J, angle: number, col: string) {
			ctx.save();
			ctx.translate(foot[0], foot[1]);
			ctx.rotate(angle);
			ctx.beginPath();
			ctx.roundRect(-4, -4, 15, 8, 3.5);
			ink(col, 2.4);
			ctx.fillStyle = '#5a3a22';
			ctx.fillRect(-3, 2, 13, 1.6);
			ctx.restore();
		}

		/** The operator, feet centre at (0, 0), facing right. */
		function drawOperator(mode: 'run' | 'air' | 'slide' | 'tumble', ph: number, vy: number) {
			let hip: J;
			let lean: number;
			let legs: [number, number][]; // [thigh, shin] back, front
			let arms: [number, number][]; // [upper, fore] back, front
			if (mode === 'slide') {
				hip = [-2, -15];
				lean = -1.22;
				legs = [
					[1.05, -1.62],
					[1.3, 1.47]
				];
				arms = [
					[-1.2, -0.9],
					[1.9, 2.7]
				];
			} else if (mode === 'air' || mode === 'tumble') {
				const up = Math.max(-1, Math.min(1, vy / PHYS.jumpV));
				const flail = mode === 'tumble' ? Math.sin(clock * 30) * 0.6 : 0;
				hip = [0, -44];
				lean = 0.14;
				legs = [
					[-0.5 - 0.2 * up + flail, -1.5],
					[1.05 + 0.25 * up - flail, 0.1 - 0.7 * Math.max(0, up)]
				];
				arms = [
					[-1.0 + flail, -0.4],
					[2.3 - flail, 3.0]
				];
			} else {
				hip = [0, -42 - 3 * Math.abs(Math.sin(ph))];
				lean = 0.24;
				const leg = (p: number): [number, number] => {
					const th = 0.85 * Math.sin(p);
					return [th, th - (0.25 + 1.1 * (0.5 + 0.5 * Math.cos(p)))];
				};
				legs = [leg(ph + Math.PI), leg(ph)];
				arms = [
					[0.9 * Math.sin(ph), 0.9 * Math.sin(ph) + 1.6],
					[-0.9 * Math.sin(ph), -0.9 * Math.sin(ph) + 1.6]
				];
			}
			const sh: J = [hip[0] + Math.sin(lean) * 30, hip[1] - Math.cos(lean) * 30];
			const head: J = [hip[0] + Math.sin(lean) * 45 + 2, hip[1] - Math.cos(lean) * 45];
			const C = { pants: '#46512e', pantsB: '#323b20', boot: '#2a1b10', shirt: '#5a6a3a', shirtB: '#434f2b', glove: '#221d18' };
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			// back arm + back leg
			const bArm = [sh[0] - 3, sh[1] + 2] as J;
			const be = at(bArm, 16, arms[0][0]);
			const bh = at(be, 15, arms[0][1]);
			limb(bArm, be, bh, 8, C.shirtB);
			ctx.beginPath();
			ctx.arc(bh[0], bh[1], 4.2, 0, Math.PI * 2);
			ink(C.glove, 2);
			const bk = at(hip, 21, legs[0][0]);
			const bf = at(bk, 22, legs[0][1]);
			limb(hip, bk, bf, 10, C.pantsB);
			boot(bf, -legs[0][1] * 0.6, '#1e140b');
			// ghillie strands streaming back
			ctx.save();
			for (let i = 0; i < 6; i++) {
				const base: J = [sh[0] - 9 + i * 2.2, sh[1] + 2 + i * 3.4];
				const wig = Math.sin(clock * 14 + i * 1.3) * 3;
				const len = 14 + (i % 3) * 5;
				ctx.beginPath();
				ctx.moveTo(base[0], base[1]);
				ctx.quadraticCurveTo(base[0] - len * 0.5, base[1] + 4 + wig, base[0] - len, base[1] + 9 + wig * 1.6);
				ctx.strokeStyle = OUT;
				ctx.lineWidth = 5.4;
				ctx.stroke();
				ctx.strokeStyle = ['#4e7d2a', '#6b9334', '#3a5c1d', '#857a3c', '#5e8a2e', '#3f6620'][i];
				ctx.lineWidth = 3;
				ctx.stroke();
			}
			ctx.restore();
			// rifle on the back + torso
			ctx.save();
			ctx.translate(hip[0], hip[1]);
			ctx.rotate(lean);
			ctx.save();
			ctx.translate(-11, -18);
			ctx.rotate(-0.5);
			ctx.beginPath();
			ctx.roundRect(-3.5, 8, 8, 16, 3);
			ink('#9a7a4a', 2.2);
			ctx.beginPath();
			ctx.roundRect(-3.2, -16, 7, 26, 2);
			ink('#2b2f36', 2.2);
			ctx.beginPath();
			ctx.roundRect(-1.4, -34, 3, 19, 1);
			ink('#3a3f46', 2);
			ctx.beginPath();
			ctx.roundRect(-2.6, -38, 5.4, 6, 1.4);
			ink('#23262b', 2);
			ctx.beginPath();
			ctx.roundRect(-8.4, -12, 5, 13, 2);
			ink('#23262b', 2);
			ctx.restore();
			// plate carrier
			ctx.beginPath();
			ctx.roundRect(-12.5, -33, 25, 36, 8);
			const vg = ctx.createLinearGradient(-12, 0, 12, 0);
			vg.addColorStop(0, '#6b5832');
			vg.addColorStop(0.55, '#9a8352');
			vg.addColorStop(1, '#7a6640');
			ink(vg, 3);
			ctx.beginPath();
			ctx.roundRect(-12.5, -6, 25, 9, 4);
			ink('#3a3a2a', 2.2);
			for (const [px, py] of [
				[1, -24],
				[1, -15]
			]) {
				ctx.beginPath();
				ctx.roundRect(px, py, 10, 8, 2);
				ink('#6a5634', 2);
			}
			ctx.strokeStyle = 'rgba(255,240,200,0.45)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(-8, -29);
			ctx.lineTo(4, -29);
			ctx.stroke();
			// radio antenna
			ctx.strokeStyle = OUT;
			ctx.lineWidth = 1.8;
			ctx.beginPath();
			ctx.moveTo(-10, -30);
			ctx.lineTo(-15, -48);
			ctx.stroke();
			ctx.restore();
			// head
			ctx.save();
			ctx.translate(head[0], head[1]);
			ctx.rotate(mode === 'slide' ? -0.25 : 0.05);
			for (let i = 0; i < 4; i++) {
				const wig = Math.sin(clock * 16 + i) * 2.5;
				ctx.beginPath();
				ctx.moveTo(-8, -8 + i * 2.5);
				ctx.quadraticCurveTo(-16, -6 + i * 3 + wig, -22 - i * 2, -2 + i * 4 + wig * 1.5);
				ctx.strokeStyle = OUT;
				ctx.lineWidth = 5;
				ctx.stroke();
				ctx.strokeStyle = ['#5e8a2e', '#857a3c', '#4e7d2a', '#3a5c1d'][i];
				ctx.lineWidth = 2.8;
				ctx.stroke();
			}
			ctx.beginPath();
			ctx.arc(0, 1, 10.5, 0, Math.PI * 2);
			ink('#e9b48c', 2.6);
			ctx.beginPath();
			ctx.arc(-3, 2, 2.6, 0, Math.PI * 2);
			ctx.fillStyle = '#c98d68';
			ctx.fill();
			// face paint, eye, brow, mouth
			ctx.strokeStyle = 'rgba(47,74,30,0.85)';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(-1, 4.5);
			ctx.lineTo(10, 3.5);
			ctx.stroke();
			ctx.beginPath();
			ctx.ellipse(5.6, 0.6, 2.9, 2.5, 0, 0, Math.PI * 2);
			ctx.fillStyle = '#fff';
			ctx.fill();
			ctx.beginPath();
			ctx.arc(6.6, 0.8, 1.4, 0, Math.PI * 2);
			ctx.fillStyle = OUT;
			ctx.fill();
			ctx.strokeStyle = OUT;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(2.4, -3);
			ctx.lineTo(8.6, -1.6);
			ctx.stroke();
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			if (mode === 'tumble') ctx.arc(7, 7.4, 2, 0, Math.PI * 2);
			else {
				ctx.moveTo(5.5, 7.4);
				ctx.quadraticCurveTo(8, 8.4, 9.6, 6.6);
			}
			ctx.stroke();
			// helmet
			ctx.beginPath();
			ctx.ellipse(0, -2, 13, 11.5, 0, Math.PI, 0);
			ctx.lineTo(14.5, -1);
			ctx.lineTo(-14, -1);
			ctx.closePath();
			const hg = ctx.createLinearGradient(0, -14, 0, -1);
			hg.addColorStop(0, '#76854a');
			hg.addColorStop(1, '#3b4626');
			ink(hg, 2.8);
			ctx.strokeStyle = 'rgba(20,10,6,0.35)';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(-9, -10);
			ctx.lineTo(4, -2);
			ctx.moveTo(-3, -12.5);
			ctx.lineTo(10, -4);
			ctx.moveTo(6, -12);
			ctx.lineTo(-6, -2);
			ctx.stroke();
			// goggles on the helmet
			ctx.beginPath();
			ctx.roundRect(2.5, -9.5, 10, 5.6, 2.4);
			ink('#ffb02e', 2);
			ctx.fillStyle = 'rgba(255,255,255,0.8)';
			ctx.fillRect(4.6, -8.4, 2.4, 1.6);
			// leafy tufts on top
			for (const [tx, ty, ta, tc] of [
				[-8, -11, -0.7, '#4e7d2a'],
				[-2, -13.5, -0.2, '#6b9334'],
				[5, -13, 0.3, '#3f6620'],
				[-11, -6, -1.1, '#857a3c']
			] as [number, number, number, string][]) {
				ctx.save();
				ctx.translate(tx, ty);
				ctx.rotate(ta + Math.sin(clock * 12 + tx) * 0.12);
				ctx.beginPath();
				ctx.moveTo(0, 0);
				ctx.quadraticCurveTo(-3, -5, 0, -9);
				ctx.quadraticCurveTo(3, -5, 0, 0);
				ink(tc, 1.6);
				ctx.restore();
			}
			ctx.strokeStyle = OUT;
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			ctx.moveTo(-6, -1);
			ctx.quadraticCurveTo(-4, 8, 2, 10.5);
			ctx.stroke();
			ctx.restore();
			// front leg + front arm
			const fk = at(hip, 21, legs[1][0]);
			const ff = at(fk, 22, legs[1][1]);
			limb(hip, fk, ff, 10.5, C.pants);
			boot(ff, -legs[1][1] * 0.6, C.boot);
			const fArm = [sh[0] + 1, sh[1] + 3] as J;
			const fe = at(fArm, 16, arms[1][0]);
			const fh = at(fe, 15, arms[1][1]);
			limb(fArm, fe, fh, 8.5, C.shirt);
			ctx.beginPath();
			ctx.arc(fh[0], fh[1], 4.4, 0, Math.PI * 2);
			ink(C.glove, 2);
		}

		function drawRunner() {
			if (dead) {
				ctx.save();
				ctx.translate(corpse.x, corpse.y);
				ctx.rotate(corpse.rot);
				ctx.translate(0, 40);
				drawOperator('tumble', phase, 0);
				ctx.restore();
				// dizzy stars
				for (let i = 0; i < 3; i++) {
					const a = clock * 7 + (i * Math.PI * 2) / 3;
					star(corpse.x + Math.cos(a) * 20, corpse.y - 22 + Math.sin(a) * 6, 6, '#ffd23a');
				}
				return;
			}
			const y = GROUND_Y - run.h;
			const shw = 34 * Math.max(0.35, 1 - run.h / 260);
			ctx.fillStyle = `rgba(0,0,0,${0.38 * Math.max(0.25, 1 - run.h / 220)})`;
			ctx.beginPath();
			ctx.ellipse(PLAYER_X + 2, GROUND_Y + 2, shw, 6, 0, 0, Math.PI * 2);
			ctx.fill();
			const air = airborne(run);
			const mode = air ? 'air' : run.slide > 0 ? 'slide' : 'run';
			const stretch = air ? 1 + Math.max(-0.08, Math.min(0.12, run.vy / 4200)) : 1;
			const ss = sq * stretch;
			ctx.save();
			ctx.translate(PLAYER_X, y);
			ctx.scale(1 / ss, ss);
			drawOperator(mode, phase, run.vy);
			ctx.restore();
		}

		function star(x: number, y: number, r: number, col: string) {
			ctx.beginPath();
			for (let i = 0; i < 10; i++) {
				const a = -Math.PI / 2 + (i * Math.PI) / 5;
				const rr = i % 2 ? r * 0.45 : r;
				ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
			}
			ctx.closePath();
			ink(col, 1.6);
		}

		function drawParticles(front: boolean) {
			for (const p of parts) {
				const isFront = p.k === 'text' || p.k === 'star' || p.k === 'spark' || p.k === 'ring' || p.k === 'fire' || p.k === 'debris';
				if (isFront !== front) continue;
				const f = p.life / p.max;
				const x = p.scr ? p.x : sx(p.x);
				const y = p.y;
				if (x < -80 || x > W + 80) continue;
				switch (p.k) {
					case 'dust':
						ctx.globalAlpha = 0.55 * (1 - f);
						ctx.fillStyle = p.col;
						ctx.beginPath();
						ctx.arc(x, y, p.size * (0.6 + f * 0.9), 0, Math.PI * 2);
						ctx.fill();
						break;
					case 'smoke':
						if (L) {
							ctx.globalAlpha = 0.75 * (1 - f) * Math.min(1, f * 6);
							const sz = p.size * (1 + f * 2.2) * 2;
							ctx.drawImage(L.smoke, x - sz / 2, y - sz / 2, sz, sz);
						}
						break;
					case 'fire': {
						ctx.globalCompositeOperation = 'lighter';
						ctx.globalAlpha = 1 - f;
						const r = p.size * (1 - f * 0.4);
						const g = ctx.createRadialGradient(x, y, 0, x, y, r);
						g.addColorStop(0, p.col);
						g.addColorStop(0.5, 'rgba(255,110,30,0.6)');
						g.addColorStop(1, 'rgba(255,60,20,0)');
						ctx.fillStyle = g;
						ctx.fillRect(x - r, y - r, r * 2, r * 2);
						ctx.globalCompositeOperation = 'source-over';
						break;
					}
					case 'spark':
						ctx.globalCompositeOperation = 'lighter';
						ctx.globalAlpha = 1 - f;
						ctx.fillStyle = p.col;
						ctx.beginPath();
						ctx.arc(x, y, p.size, 0, Math.PI * 2);
						ctx.fill();
						ctx.globalCompositeOperation = 'source-over';
						break;
					case 'debris':
						ctx.globalAlpha = Math.min(1, 3 * (1 - f));
						ctx.save();
						ctx.translate(x, y);
						ctx.rotate(p.rot);
						ctx.beginPath();
						ctx.rect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2);
						ink(p.col, 1.4);
						ctx.restore();
						break;
					case 'ring':
						ctx.globalAlpha = 1 - f;
						ctx.strokeStyle = p.col;
						ctx.lineWidth = 6 * (1 - f) + 1;
						ctx.beginPath();
						ctx.ellipse(x, y, p.size + f * 160, (p.size + f * 160) * 0.5, 0, 0, Math.PI * 2);
						ctx.stroke();
						break;
					case 'star':
						ctx.globalAlpha = 1 - f;
						star(x, y, p.size * (1 - f * 0.5), p.col);
						break;
					case 'text': {
						ctx.globalAlpha = Math.min(1, 2.5 * (1 - f));
						const pop = 1 + 0.5 * Math.max(0, 1 - f * 6);
						text(p.text ?? '', x, y, p.size * k * pop, 'center', p.col);
						break;
					}
				}
				ctx.globalAlpha = 1;
			}
		}

		function text(t: string, x: number, y: number, size: number, align: CanvasTextAlign, fill: string | CanvasGradient, line = OUT) {
			ctx.font = `800 ${size}px ${FONT}`;
			ctx.textAlign = align;
			ctx.textBaseline = 'middle';
			ctx.lineJoin = 'round';
			ctx.lineWidth = size * 0.22;
			ctx.strokeStyle = 'rgba(0,0,0,0.45)';
			ctx.strokeText(t, x, y + size * 0.08);
			ctx.strokeStyle = line;
			ctx.strokeText(t, x, y);
			ctx.fillStyle = fill;
			ctx.fillText(t, x, y);
		}

		function pill(x: number, y: number, w: number, h: number, fill: string, edge: string) {
			ctx.beginPath();
			ctx.roundRect(x, y, w, h, h / 2);
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = edge;
			ctx.stroke();
		}

		function keycap(label: string, x: number, y: number, size: number): number {
			ctx.font = `800 ${size}px ${FONT}`;
			const w = Math.max(size * 1.7, ctx.measureText(label).width + size * 1.1);
			ctx.beginPath();
			ctx.roundRect(x, y - size * 0.95, w, size * 1.9, size * 0.4);
			ctx.fillStyle = '#2a1430';
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = '#ffd27a';
			ctx.stroke();
			ctx.fillStyle = 'rgba(255,255,255,0.12)';
			ctx.fillRect(x + 4, y - size * 0.8, w - 8, size * 0.5);
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = '#fff3dc';
			ctx.fillText(label, x + w / 2, y + 1);
			return w;
		}

		function drawHud() {
			if (!L) return;
			// distance
			const m = Math.floor((dead ? scoreDist : dist) / PX_PER_M).toLocaleString('en-US');
			const big = 40 * k;
			ctx.font = `800 ${big}px ${FONT}`;
			const mw = ctx.measureText(m).width;
			pill(14, 14, mw + 70 * k, 58 * k, 'rgba(24,6,20,0.62)', 'rgba(255,190,110,0.5)');
			const gold = ctx.createLinearGradient(0, 18, 0, 14 + 54 * k);
			gold.addColorStop(0, '#fff7cc');
			gold.addColorStop(1, '#ffb02e');
			text(m, 32, 14 + 30 * k, big, 'left', gold);
			text(s.metres, 38 + mw, 14 + 34 * k, 24 * k, 'left', '#ffd9a8');
			// coins
			const cs = `× ${coins}`;
			ctx.font = `800 ${34 * k}px ${FONT}`;
			const cw = ctx.measureText(cs).width;
			const bw = cw + 76 * k;
			pill(W - 14 - bw, 14, bw, 58 * k, 'rgba(24,6,20,0.62)', 'rgba(255,190,110,0.5)');
			const csz = 40 * k;
			ctx.drawImage(L.coin, W - 14 - bw + 10 * k, 14 + 29 * k - csz / 2, csz, csz);
			text(cs, W - 26, 14 + 30 * k, 34 * k, 'right', '#fff3dc');
			// air strike warning
			const obs = course.obstacles;
			let warn = false;
			for (let i = oi; i < obs.length; i++) {
				const o = obs[i];
				const x = sx(o.x);
				if (x > W + 60) break;
				if (o.kind === 'strike' && !blown.has(o.id)) warn = true;
			}
			if (warn && !dead) {
				const on = (clock * 4) % 1 < 0.65;
				const sz = 24 * k;
				ctx.font = `800 ${sz}px ${FONT}`;
				const tw = ctx.measureText(s.strike).width + sz * 2.6;
				const y = 14 + 58 * k + 14 + sz;
				pill(W / 2 - tw / 2, y - sz, tw, sz * 2, on ? 'rgba(200,20,40,0.9)' : 'rgba(110,10,24,0.9)', '#ffd23a');
				// warning triangle
				const tx = W / 2 - tw / 2 + sz * 1.05;
				ctx.beginPath();
				ctx.moveTo(tx, y - sz * 0.6);
				ctx.lineTo(tx + sz * 0.62, y + sz * 0.5);
				ctx.lineTo(tx - sz * 0.62, y + sz * 0.5);
				ctx.closePath();
				ink('#ffd23a', 2);
				ctx.fillStyle = OUT;
				ctx.fillRect(tx - sz * 0.06, y - sz * 0.25, sz * 0.12, sz * 0.42);
				ctx.fillRect(tx - sz * 0.06, y + sz * 0.26, sz * 0.12, sz * 0.12);
				text(s.strike, W / 2 + sz * 0.5, y, sz, 'center', '#fff3dc');
			}
			// first-time tags over new kinds of obstacle
			if (!dead) {
				for (let i = oi; i < obs.length; i++) {
					const o = obs[i];
					const spec = OBSTACLES[o.kind];
					const x = sx(o.x) + spec.w / 2;
					if (x > W - 30) break;
					if (tagged.has(o.kind) || o.kind === 'wire' || o.kind === 'sandbags') continue;
					if (x < PLAYER_X) continue;
					const slide = spec.act === 'slide';
					const label = slide ? s.tagSlide : s.tagJump;
					const sz = 22 * k;
					const y = GROUND_Y - (slide ? 150 : o.kind === 'car' ? 170 : 120) - Math.abs(Math.sin(clock * 6)) * 6;
					ctx.font = `800 ${sz}px ${FONT}`;
					const tw = ctx.measureText(label).width + sz * 1.4;
					pill(x - tw / 2, y - sz * 0.9, tw, sz * 1.8, slide ? '#1aa7c9' : '#3fb43a', OUT);
					text(label, x, y, sz, 'center', '#fff');
					ctx.beginPath();
					const ay = y + sz * 0.9;
					ctx.moveTo(x - 7, ay);
					ctx.lineTo(x + 7, ay);
					ctx.lineTo(x, ay + 9);
					ctx.closePath();
					ink(slide ? '#1aa7c9' : '#3fb43a', 2);
				}
			}
			// milestone banner
			if (banner) {
				const t = banner.t;
				const a = Math.min(1, t * 6) * Math.min(1, (1.6 - t) * 4);
				const pop = 1 + 0.45 * Math.exp(-t * 9) * Math.cos(t * 18);
				ctx.globalAlpha = Math.max(0, a);
				const by = 200;
				const g = ctx.createLinearGradient(0, by - 30, 0, by + 30);
				g.addColorStop(0, '#fff7cc');
				g.addColorStop(0.5, '#ffc928');
				g.addColorStop(1, '#ff7a1a');
				text(banner.text, W / 2, by, 58 * k * pop, 'center', g);
				text(banner.sub, W / 2, by + 50 * k, 26 * k, 'center', '#fff3dc');
				ctx.globalAlpha = 1;
			}
			// the controls, until the first obstacle comes close (it must not hide the first jump)
			const hintLeft = (FIRST_AT - 420 - dist) / 160;
			if (hintLeft > 0 && !dead) {
				const a = Math.min(1, hintLeft) * Math.min(1, clock * 4 + 0.3);
				ctx.globalAlpha = a;
				if (coarse) {
					ctx.fillStyle = 'rgba(80,220,120,0.10)';
					ctx.fillRect(0, 0, W, H / 2);
					ctx.fillStyle = 'rgba(60,190,230,0.10)';
					ctx.fillRect(0, H / 2, W, H / 2);
					ctx.setLineDash([16, 12]);
					ctx.strokeStyle = 'rgba(255,243,220,0.7)';
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.moveTo(0, H / 2);
					ctx.lineTo(W, H / 2);
					ctx.stroke();
					ctx.setLineDash([]);
					const sz = 30 * k;
					text(s.tapJump, W / 2, H / 2 - 70, sz, 'center', '#8dff9a');
					text(s.tapSlide, W / 2, H / 2 + 50, sz, 'center', '#8fe6ff');
					text(s.orSwipe, W / 2, H / 2 + 50 + sz * 1.2, sz * 0.6, 'center', '#fff3dc');
				} else {
					const sz = 22 * Math.min(k, 1.35);
					ctx.font = `800 ${sz}px ${FONT}`;
					const capW = (l: string) => Math.max(sz * 1.7, ctx.measureText(l).width + sz * 1.1);
					const parts1 = [s.space, '↑'];
					const inner = capW(s.space) + capW('↑') + capW('↓') + ctx.measureText(s.jump).width + ctx.measureText(s.slide).width + 8 + 4 + 36 + 10 + 2;
					const pw = Math.min(W - 24, inner + 44);
					const y = 150 + 30 * k;
					pill(W / 2 - pw / 2, y - sz * 1.5, pw, sz * 4.3, 'rgba(24,6,20,0.8)', 'rgba(255,190,110,0.6)');
					let x = W / 2 - inner / 2;
					for (const p of parts1) x += keycap(p, x, y, sz) + 8;
					text(s.jump, x + 4, y, sz, 'left', '#8dff9a');
					ctx.font = `800 ${sz}px ${FONT}`;
					x += ctx.measureText(s.jump).width + 36;
					x += keycap('↓', x, y, sz) + 10;
					text(s.slide, x + 2, y, sz, 'left', '#8fe6ff');
					text(s.orClick, W / 2, y + sz * 1.75, sz * 0.72, 'center', '#ffd9a8');
				}
				ctx.globalAlpha = 1;
			}
		}

		function drawSpeedLines() {
			const v = speedAt(dist) / PX_PER_M;
			if (v < 12.5 || reduce || dead) return;
			const a = Math.min(0.35, (v - 12.5) * 0.06);
			ctx.strokeStyle = `rgba(255,230,200,${a})`;
			ctx.lineWidth = 2;
			for (let i = 0; i < 9; i++) {
				const y = 110 + ((i * 97) % 330);
				const len = 60 + (i % 3) * 50;
				const x = W - ((clock * (900 + i * 120) + i * 211) % (W + len * 2)) + len;
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x + len, y);
				ctx.stroke();
			}
		}

		const embers = Array.from({ length: reduce ? 14 : 36 }, () => ({ x: R() * W, y: R() * H, v: 20 + R() * 50, s: 1 + R() * 2.2, ph: R() * 6 }));
		function drawEmbers(dt: number) {
			ctx.globalCompositeOperation = 'lighter';
			const drift = speedAt(dist) * 0.25;
			for (const e of embers) {
				if (!paused) {
					e.y -= e.v * dt;
					e.x -= (drift * 0.3 + Math.sin(clock + e.ph) * 20) * dt;
					if (e.y < -10 || e.x < -10) {
						e.y = H + 10 - R() * 60;
						e.x = R() * (W + 100);
					}
				}
				const tw = 0.5 + 0.5 * Math.sin(clock * 6 + e.ph);
				ctx.fillStyle = `rgba(255,${150 + tw * 80},70,${0.35 + tw * 0.5})`;
				ctx.beginPath();
				ctx.arc(e.x, e.y, e.s, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalCompositeOperation = 'source-over';
		}

		function draw(dt = 0) {
			if (!L) return;
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			ctx.clearRect(0, 0, W, H);
			const ox = shake ? (R() * 2 - 1) * shake : 0;
			const oy = shake ? (R() * 2 - 1) * shake : 0;
			ctx.save();
			ctx.translate(ox * 0.4, oy * 0.4);
			drawBackground();
			ctx.restore();
			ctx.save();
			ctx.translate(ox, oy);
			const obs = course.obstacles;
			const vis: Obstacle[] = [];
			for (let i = oi; i < obs.length; i++) {
				const o = obs[i];
				const x = sx(o.x);
				if (x > W + 160) break;
				if (x + OBSTACLES[o.kind].w < -160) continue;
				vis.push(o);
			}
			for (const o of vis) if (o.kind === 'strike') drawStrikeGround(o);
			drawParticles(false);
			for (const o of vis) if (o.kind !== 'strike') drawObstacle(o);
			drawCoins();
			drawRunner();
			drawParticles(true);
			if (L) strip(L.fore, dist * 1.35, H - FORE_H + 4);
			ctx.restore();
			drawSpeedLines();
			drawEmbers(dt);
			ctx.drawImage(L.over, 0, 0, W, H);
			drawHud();
			if (flash > 0.02) {
				ctx.fillStyle = `rgba(${flashCol},${flash * 0.6})`;
				ctx.fillRect(0, 0, W, H);
			}
		}

		// ---------- loop, input, pause ----------
		let raf = 0;
		let last = 0;
		function frame(now: number) {
			raf = requestAnimationFrame(frame);
			const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
			last = now;
			if (paused) return;
			update(dt);
			if (!ended) draw(dt);
		}
		function stop() {
			cancelAnimationFrame(raf);
			raf = 0;
		}

		function doResume() {
			if (!paused || ended) return;
			paused = false;
			last = 0;
		}
		resume = doResume;

		const isJump = (e: KeyboardEvent) => e.key === ' ' || e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W';
		const isSlide = (e: KeyboardEvent) => e.key === 'ArrowDown' || e.key === 's' || e.key === 'S';
		function onKey(e: KeyboardEvent) {
			const t = e.target as HTMLElement | null;
			if (t && t !== root && t.closest?.('input, textarea, select, [contenteditable="true"]')) return;
			const j = isJump(e);
			const sl = isSlide(e);
			if (j || sl) e.preventDefault();
			if (e.type === 'keyup') {
				if (sl) slideHeld = false;
				return;
			}
			if (paused) {
				doResume();
				return;
			}
			if (dead || e.repeat) return;
			if (j) pressJump(run);
			else if (sl) {
				pressSlide(run);
				slideHeld = true;
			}
		}

		let gesture: { id: number; y: number; did: 'jump' | 'slide' | 'both' } | null = null;
		function onDown(e: PointerEvent) {
			if (paused) {
				e.preventDefault();
				doResume();
				return;
			}
			root.focus({ preventScroll: true });
			if (dead) return;
			const b = cv.getBoundingClientRect();
			const top = (e.clientY - b.top) / b.height < 0.5;
			gesture = { id: e.pointerId, y: e.clientY, did: top ? 'jump' : 'slide' };
			if (top) pressJump(run);
			else {
				pressSlide(run);
				slideHeld = true;
			}
			try {
				root.setPointerCapture(e.pointerId);
			} catch {
				/* synthetic pointers can't be captured */
			}
		}
		function onMove(e: PointerEvent) {
			if (!gesture || e.pointerId !== gesture.id || dead || paused) return;
			const dy = e.clientY - gesture.y;
			const b = cv.getBoundingClientRect();
			const lim = Math.max(24, b.height * 0.06);
			if (dy < -lim && gesture.did === 'slide') {
				pressJump(run);
				slideHeld = false;
				gesture.did = 'both';
			} else if (dy > lim && gesture.did === 'jump') {
				pressSlide(run);
				slideHeld = true;
				gesture.did = 'both';
			}
		}
		function onUp(e: PointerEvent) {
			if (gesture && e.pointerId === gesture.id) gesture = null;
			slideHeld = false;
		}
		function onVis() {
			if (document.hidden && !ended) {
				paused = true;
				slideHeld = false;
			}
		}

		Object.defineProperty(cv, '__nukerun', { value: () => ({ dist, h: run.h, vy: run.vy, slide: run.slide, dead, paused }), configurable: true });
		const ro = new ResizeObserver(() => resize());
		ro.observe(cv);
		resize();
		course.extend(W * 2);
		window.addEventListener('keydown', onKey);
		window.addEventListener('keyup', onKey);
		root.addEventListener('pointerdown', onDown);
		root.addEventListener('pointermove', onMove);
		root.addEventListener('pointerup', onUp);
		root.addEventListener('pointercancel', onUp);
		document.addEventListener('visibilitychange', onVis);
		root.focus({ preventScroll: true });
		if (document.hidden) paused = true;
		draw();
		raf = requestAnimationFrame(frame);

		return () => {
			stop();
			ro.disconnect();
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('keyup', onKey);
			root.removeEventListener('pointerdown', onDown);
			root.removeEventListener('pointermove', onMove);
			root.removeEventListener('pointerup', onUp);
			root.removeEventListener('pointercancel', onUp);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="nr" bind:this={root} tabindex="0" role="application" aria-label={s.aria}>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	{#if paused}
		<button type="button" class="nr-pause" onclick={() => resume()}>
			<span class="nr-pause-title">{s.paused}</span>
			<span class="nr-pause-sub">{s.tapToContinue}</span>
		</button>
	{/if}
</div>

<style>
	.nr {
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 4 / 3));
		aspect-ratio: 4 / 3;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #12060e;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
		outline: none;
		box-shadow:
			0 0 0 1px rgb(255 170 90 / 0.25),
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.nr::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.7),
			inset 0 0 28px rgb(0 0 0 / 0.55);
	}
	.nr:focus-visible {
		box-shadow:
			0 0 0 3px #ffc928,
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.nr-pause {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: grid;
		place-content: center;
		gap: 6px;
		border: 0;
		cursor: pointer;
		background: rgb(14 4 16 / 0.62);
		backdrop-filter: blur(2px);
		color: #fff3dc;
		font-family: Bahnschrift, 'Segoe UI', sans-serif;
		text-shadow:
			0 2px 0 #140a06,
			0 0 14px rgb(0 0 0 / 0.7);
	}
	.nr-pause-title {
		font-size: clamp(28px, 7vw, 52px);
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.nr-pause-sub {
		font-size: clamp(14px, 3vw, 20px);
		font-weight: 700;
	}
</style>
