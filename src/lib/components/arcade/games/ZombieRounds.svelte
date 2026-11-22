<!--
	Zombie Rounds (BurgiArcade, 2026-11-22): top-down wave survival in a burger joint's parking lot at night.
	Your helmeted operator holds the middle of the lot; cartoon zombies (green skin, torn shirts, some in
	burger-chef hats) shamble in from the dark in rounds (zombies.ts: the plan, spawns and scoring come from
	the seed), with a Brute and a health bar every 5th round. PC: WASD / arrows move, the mouse aims, click /
	hold (or Space) fires, R reloads. Touch: drag anywhere to move; the gun aims at the nearest zombie in sight
	and fires by itself. Power-ups: Nuke, Insta-Kill, Double Points. 3 hearts. One canvas, one rAF loop, the
	game clock stops while the tab is hidden. Our own drawings throughout.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { rng } from '#lib/arcade/rng.ts';
	import s from '#lib/i18n/arcade/zombies.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import {
		ARENA,
		BULLET_SPEED,
		COVER,
		DOOR,
		FIRE_RATE,
		MAG,
		MAX_ALIVE,
		PLAYER_HEARTS,
		PLAYER_RADIUS,
		PLAYER_SPEED,
		PLAYER_START,
		POINTS,
		POWER_LIFE,
		POWER_TIME,
		RADIUS,
		RELOAD_TIME,
		award,
		clearBonus,
		dropRoller,
		isBruteRound,
		lineClear,
		pushOut,
		roundPlan,
		segCircle,
		segRect,
		spawnPoint,
		type Cover,
		type PowerKind,
		type RoundPlan,
		type Spawn,
		type ZombieKind
	} from '#lib/arcade/zombies.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let paused = $state(false);

	$effect(() => {
		if (!root || !canvas) return;
		const el = root;
		const cv = canvas;
		return untrack(() => run(el, cv, seed, onend));
	});

	type C2D = CanvasRenderingContext2D;
	interface Z {
		id: number;
		kind: ZombieKind;
		x: number;
		y: number;
		r: number;
		hp: number;
		max: number;
		speed: number;
		chef: boolean;
		look: number;
		face: number;
		phase: number;
		flash: number;
		kx: number;
		ky: number;
		side: number;
		sideT: number;
		stuck: number;
		entering: boolean;
		bar: number;
	}
	interface Bullet {
		x: number;
		y: number;
		vx: number;
		vy: number;
		ox: number;
		oy: number;
		life: number;
	}
	interface Part {
		kind: 'goo' | 'smoke' | 'spark' | 'casing' | 'ring' | 'dust' | 'star';
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
	}
	interface Float {
		x: number;
		y: number;
		text: string;
		life: number;
		max: number;
		size: number;
		color: string;
		rise: number;
	}
	interface Power {
		x: number;
		y: number;
		kind: PowerKind;
		t: number;
	}

	const O = '#140a06';
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
	const SKIN = ['#8fcf52', '#7cbf4c', '#a2d46a', '#74b45a', '#a9c95a', '#86c87e'];
	const SKIN_D = ['#4f8a2a', '#457a26', '#5f9436', '#3f7432', '#66852c', '#4a8446'];
	const SHIRT = ['#4a6fb0', '#8a3fa0', '#b0483c', '#3a8c7c', '#c8902c', '#5c5c74'];
	const SHIRT_D = ['#2c4474', '#55236a', '#6e2620', '#205a4e', '#7e5410', '#36364a'];
	const BANNER = 2.6;
	const CLEAR_PAUSE = 1.5;
	const AUTO_RANGE = 380;
	const JOY_R = 58;

	function run(el: HTMLDivElement, cv: HTMLCanvasElement, seed: number, onend: ArcadeGameProps['onend']): () => void {
		const ctx = cv.getContext('2d') as C2D;
		const W = ARENA.w;
		const H = ARENA.h;
		const TOP = ARENA.top;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const coarse = matchMedia('(pointer: coarse)').matches;
		/** gameplay randomness that isn't part of the level (bullet spread): seeded too */
		const fx = rng((seed ^ 0x5bd1e995) >>> 0);
		const deco = Math.random;
		const roll = dropRoller(seed);

		let scale = 1;
		let pxW = 0;
		let cssW = 640;
		let hud = 1;
		let bg: HTMLCanvasElement | null = null;
		let coverLayer: HTMLCanvasElement | null = null;
		let decals: HTMLCanvasElement | null = null;
		let chalk: CanvasPattern | string = '#f6eed6';

		// ---- game state
		let clock = 0;
		let last = performance.now();
		let raf = 0;
		let ended = false;
		let isPaused = false;
		let score = 0;
		let round = 1;
		let plan: RoundPlan = roundPlan(seed, 1);
		let spawnIdx = 0;
		let roundT = 0;
		let state: 'banner' | 'fight' | 'clear' | 'dead' = 'banner';
		let stateT = 0;
		let instaUntil = -1;
		let doubleUntil = -1;
		let nukeFlash = 0;
		let hurtFlash = 0;
		let shake = 0;
		let doorGlow = 0;
		let heartPop = -1;
		let heartPopT = 0;
		let nextId = 1;
		let lastKillSound = 0;
		const P = { x: PLAYER_START.x as number, y: PLAYER_START.y as number, aim: -Math.PI / 2, hearts: PLAYER_HEARTS, inv: 0, mag: MAG, reload: 0, cd: 0, flash: 0, kick: 0, walk: 0, moving: 0 };
		let zs: Z[] = [];
		let bullets: Bullet[] = [];
		let parts: Part[] = [];
		let floats: Float[] = [];
		let marks: { x: number; y: number; life: number; insta: boolean }[] = [];
		let powers: Power[] = [];

		// ---- input
		const keys = new Set<string>();
		const mouse = { x: W / 2, y: H / 2 };
		let firing = false;
		let spaceFire = false;
		let mode: 'mouse' | 'touch' | 'keys' = coarse ? 'touch' : 'keys';
		let joy: { id: number; bx: number; by: number; x: number; y: number } | null = null;

		const dbl = () => clock < doubleUntil;
		const insta = () => clock < instaUntil;
		const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
		const angDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
		const turn = (a: number, b: number, max: number) => a + clamp(angDiff(a, b), -max, max);
		const jit = (i: number, k: number) => {
			const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
			return v - Math.floor(v) - 0.5;
		};

		// ---------------------------------------------------------------- sizing + static layers
		function layer(): HTMLCanvasElement {
			const c = document.createElement('canvas');
			c.width = pxW;
			c.height = pxW;
			return c;
		}
		function paintLayer(fn: (g: C2D) => void): HTMLCanvasElement {
			const c = layer();
			const g = c.getContext('2d') as C2D;
			g.setTransform(scale, 0, 0, scale, 0, 0);
			fn(g);
			return c;
		}
		function resize() {
			cssW = el.clientWidth || 640;
			hud = clamp(560 / cssW, 1, 1.5);
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const px = Math.max(240, Math.round(cssW * dpr));
			if (px === pxW) return;
			pxW = px;
			scale = px / W;
			cv.width = px;
			cv.height = px;
			bg = paintLayer(drawBackground);
			coverLayer = paintLayer(drawCover);
			const old = decals;
			decals = layer();
			if (old) (decals.getContext('2d') as C2D).drawImage(old, 0, 0, px, px);
			chalk = makeChalk();
		}
		function makeChalk(): CanvasPattern | string {
			const c = document.createElement('canvas');
			c.width = 96;
			c.height = 96;
			const g = c.getContext('2d') as C2D;
			g.fillStyle = '#f7efd8';
			g.fillRect(0, 0, 96, 96);
			const r = rng(77);
			g.globalCompositeOperation = 'destination-out';
			for (let i = 0; i < 650; i++) {
				g.globalAlpha = 0.2 + r() * 0.8;
				g.fillRect(r() * 96, r() * 96, 1 + r() * 2.4, 1 + r() * 1.3);
			}
			return ctx.createPattern(c, 'repeat') ?? '#f6eed6';
		}
		function rr(g: C2D, x: number, y: number, w: number, h: number, r: number) {
			const k = Math.min(r, w / 2, h / 2);
			g.beginPath();
			g.moveTo(x + k, y);
			g.arcTo(x + w, y, x + w, y + h, k);
			g.arcTo(x + w, y + h, x, y + h, k);
			g.arcTo(x, y + h, x, y, k);
			g.arcTo(x, y, x + w, y, k);
			g.closePath();
		}
		function withShadow(g: C2D, blur: number, ox: number, oy: number, fn: () => void) {
			g.save();
			g.shadowColor = 'rgba(0,0,0,0.6)';
			g.shadowBlur = blur * scale;
			g.shadowOffsetX = ox * scale;
			g.shadowOffsetY = oy * scale;
			fn();
			g.restore();
		}

		// ---------------------------------------------------------------- the lot (drawn once)
		function drawBackground(g: C2D) {
			const r = rng(20261122);
			const base = g.createLinearGradient(0, TOP, 0, H);
			base.addColorStop(0, '#2c2a36');
			base.addColorStop(1, '#1c1b24');
			g.fillStyle = base;
			g.fillRect(0, 0, W, H);
			for (let i = 0; i < 16; i++) {
				const x = r() * W;
				const y = TOP + r() * (H - TOP);
				const rad = 40 + r() * 100;
				const gr = g.createRadialGradient(x, y, 0, x, y, rad);
				gr.addColorStop(0, r() < 0.45 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.14)');
				gr.addColorStop(1, 'rgba(0,0,0,0)');
				g.fillStyle = gr;
				g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
			}
			// painted parking bays (worn by the grit drawn on top)
			const paint = (pts: number[][], color = 'rgba(236,230,212,0.55)', w = 5) => {
				g.strokeStyle = color;
				g.lineWidth = w;
				g.lineCap = 'round';
				g.beginPath();
				for (const [x1, y1, x2, y2] of pts) {
					g.moveTo(x1, y1);
					g.lineTo(x2, y2);
				}
				g.stroke();
			};
			paint([
				[104, 204, 104, 462],
				[104, 204, 274, 204],
				[104, 290, 274, 290],
				[104, 376, 274, 376],
				[104, 462, 274, 462],
				[452, 610, 710, 610],
				[452, 440, 452, 610],
				[538, 440, 538, 610],
				[624, 440, 624, 610],
				[710, 440, 710, 610]
			]);
			// oil stains in the empty bays
			for (const [x, y] of [
				[190, 246],
				[188, 420],
				[494, 528],
				[668, 520]
			]) {
				const gr = g.createRadialGradient(x, y, 0, x, y, 30);
				gr.addColorStop(0, 'rgba(6,4,10,0.55)');
				gr.addColorStop(1, 'rgba(6,4,10,0)');
				g.fillStyle = gr;
				g.beginPath();
				g.ellipse(x, y, 30, 20, 0.3, 0, Math.PI * 2);
				g.fill();
			}
			// drive-thru lane: a big arrow + words
			g.save();
			g.globalAlpha = 0.5;
			g.fillStyle = '#ece6d4';
			g.beginPath();
			g.moveTo(360, 588);
			g.lineTo(392, 622);
			g.lineTo(372, 622);
			g.lineTo(372, 664);
			g.lineTo(348, 664);
			g.lineTo(348, 622);
			g.lineTo(328, 622);
			g.closePath();
			g.fill();
			g.font = `700 22px ${FONT}`;
			g.textAlign = 'center';
			g.fillStyle = '#f2c94c';
			g.fillText(s.drive, 360, 692);
			g.restore();
			// grit over everything painted
			for (let i = 0; i < 3200; i++) {
				const light = r() < 0.45;
				g.fillStyle = light ? `rgba(255,255,255,${0.03 + r() * 0.07})` : `rgba(0,0,0,${0.12 + r() * 0.2})`;
				g.fillRect(r() * W, TOP + r() * (H - TOP), 1.1 + r() * 1.8, 1.1 + r() * 1.5);
			}
			// cracks
			g.strokeStyle = 'rgba(6,4,10,0.6)';
			g.lineWidth = 1.7;
			g.lineCap = 'round';
			for (let i = 0; i < 10; i++) {
				let x = r() * W;
				let y = TOP + 40 + r() * (H - TOP - 60);
				let a = r() * Math.PI * 2;
				g.beginPath();
				g.moveTo(x, y);
				for (let k = 0; k < 6; k++) {
					a += (r() - 0.5) * 1.3;
					x += Math.cos(a) * (10 + r() * 16);
					y += Math.sin(a) * (10 + r() * 16);
					g.lineTo(x, y);
				}
				g.stroke();
			}
			// a puddle catching the neon
			const pg = g.createRadialGradient(560, 158, 4, 560, 158, 52);
			pg.addColorStop(0, 'rgba(255,90,190,0.28)');
			pg.addColorStop(0.6, 'rgba(70,40,110,0.35)');
			pg.addColorStop(1, 'rgba(20,16,30,0)');
			g.fillStyle = pg;
			g.beginPath();
			g.ellipse(560, 158, 54, 22, 0.08, 0, Math.PI * 2);
			g.fill();
			// grass strip + curb along the bottom
			const grass = g.createLinearGradient(0, 704, 0, H);
			grass.addColorStop(0, '#1d3a1a');
			grass.addColorStop(1, '#0f230e');
			g.fillStyle = grass;
			g.fillRect(0, 706, W, H - 706);
			g.fillStyle = '#5a5866';
			g.fillRect(0, 700, W, 7);
			g.fillStyle = 'rgba(255,255,255,0.12)';
			g.fillRect(0, 700, W, 2);
			g.strokeStyle = '#2e5a24';
			g.lineWidth = 1.6;
			for (let x = 2; x < W; x += 5 + r() * 6) {
				g.beginPath();
				g.moveTo(x, H);
				g.lineTo(x + (r() - 0.5) * 6, 708 + r() * 6);
				g.stroke();
			}
			drawFacade(g, r);
			// warm light from the windows and the door on the asphalt
			g.save();
			g.globalCompositeOperation = 'lighter';
			for (const [x0, x1] of [
				[56, 262],
				[458, 664],
				[324, 396]
			]) {
				const lg = g.createLinearGradient(0, TOP, 0, TOP + 130);
				lg.addColorStop(0, 'rgba(255,170,80,0.16)');
				lg.addColorStop(1, 'rgba(255,170,80,0)');
				g.fillStyle = lg;
				g.beginPath();
				g.moveTo(x0, TOP);
				g.lineTo(x1, TOP);
				g.lineTo(x1 + 40, TOP + 130);
				g.lineTo(x0 - 40, TOP + 130);
				g.closePath();
				g.fill();
			}
			g.restore();
		}

		function drawFacade(g: C2D, r: () => number) {
			const wall = g.createLinearGradient(0, 0, 0, TOP);
			wall.addColorStop(0, '#3e1a2a');
			wall.addColorStop(1, '#22101a');
			g.fillStyle = wall;
			g.fillRect(0, 0, W, TOP - 4);
			g.strokeStyle = 'rgba(0,0,0,0.35)';
			g.lineWidth = 1.2;
			for (let row = 0, y = 2; y < TOP - 8; row++, y += 11) {
				g.beginPath();
				g.moveTo(0, y);
				g.lineTo(W, y);
				for (let x = (row % 2) * 13; x < W; x += 26) {
					g.moveTo(x, y);
					g.lineTo(x, y + 11);
				}
				g.stroke();
			}
			for (let i = 0; i < 40; i++) {
				g.fillStyle = `rgba(255,140,120,${0.03 + r() * 0.05})`;
				g.fillRect(r() * W, r() * (TOP - 10), 12 + r() * 10, 9);
			}
			// windows: warm inside, a burger poster, booth shapes, reflections
			for (const [x0, x1] of [
				[56, 262],
				[458, 664]
			]) {
				const glass = g.createLinearGradient(0, 32, 0, 90);
				glass.addColorStop(0, '#ffd27a');
				glass.addColorStop(1, '#e46a26');
				rr(g, x0, 32, x1 - x0, 58, 3);
				g.fillStyle = glass;
				g.fill();
				g.fillStyle = 'rgba(90,30,20,0.45)';
				for (let x = x0 + 14; x < x1 - 30; x += 58) {
					rr(g, x, 70, 40, 20, 6);
					g.fill();
				}
				g.fillStyle = 'rgba(255,255,255,0.18)';
				for (const dx of [20, 60, 120]) {
					g.beginPath();
					g.moveTo(x0 + dx, 90);
					g.lineTo(x0 + dx + 22, 32);
					g.lineTo(x0 + dx + 34, 32);
					g.lineTo(x0 + dx + 12, 90);
					g.closePath();
					g.fill();
				}
				g.lineWidth = 4;
				g.strokeStyle = '#120610';
				rr(g, x0, 32, x1 - x0, 58, 3);
				g.stroke();
				g.lineWidth = 2.5;
				g.beginPath();
				g.moveTo((x0 + x1) / 2, 32);
				g.lineTo((x0 + x1) / 2, 90);
				g.stroke();
				// striped awning with a scalloped edge
				const stripes = Math.round((x1 - x0 + 16) / 16);
				for (let i = 0; i < stripes; i++) {
					g.fillStyle = i % 2 ? '#fff1d8' : '#d8263a';
					g.fillRect(x0 - 8 + i * 16, 14, 16, 14);
				}
				g.beginPath();
				for (let i = 0; i < stripes; i++) {
					g.moveTo(x0 - 8 + i * 16, 28);
					g.arc(x0 - 8 + i * 16 + 8, 28, 8, Math.PI, 0, true);
				}
				g.fillStyle = '#d8263a';
				g.fill();
				g.lineWidth = 2.5;
				g.strokeStyle = O;
				g.strokeRect(x0 - 8, 14, stripes * 16, 14);
			}
			// burger poster in the left window
			const bx = 214;
			const by = 56;
			g.lineWidth = 2;
			g.strokeStyle = O;
			g.fillStyle = '#f0a24a';
			g.beginPath();
			g.arc(bx, by + 2, 14, Math.PI, 0);
			g.closePath();
			g.fill();
			g.stroke();
			g.fillStyle = '#4fb23a';
			g.fillRect(bx - 15, by + 2, 30, 4);
			g.fillStyle = '#6b3a1c';
			rr(g, bx - 14, by + 6, 28, 6, 3);
			g.fill();
			g.stroke();
			g.fillStyle = '#f0a24a';
			rr(g, bx - 13, by + 12, 26, 6, 3);
			g.fill();
			g.stroke();
			// the door (lit from inside)
			const dg = g.createLinearGradient(0, 50, 0, TOP);
			dg.addColorStop(0, '#ffe2a0');
			dg.addColorStop(1, '#ff9a3a');
			g.fillStyle = dg;
			g.fillRect(DOOR.x - 36, 50, 72, TOP - 54);
			g.lineWidth = 4;
			g.strokeStyle = '#120610';
			g.strokeRect(DOOR.x - 36, 50, 72, TOP - 54);
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(DOOR.x, 50);
			g.lineTo(DOOR.x, TOP - 4);
			g.stroke();
			g.strokeStyle = '#8a8f9a';
			g.lineWidth = 3;
			g.beginPath();
			g.moveTo(DOOR.x - 26, 76);
			g.lineTo(DOOR.x - 8, 76);
			g.moveTo(DOOR.x + 8, 76);
			g.lineTo(DOOR.x + 26, 76);
			g.stroke();
			// the neon sign's board + unlit tubes
			rr(g, 262, 4, 196, 40, 6);
			g.fillStyle = '#14081c';
			g.fill();
			g.lineWidth = 3;
			g.strokeStyle = O;
			g.stroke();
			g.fillStyle = '#5a5866';
			for (const x of [270, 450]) {
				g.beginPath();
				g.arc(x, 24, 2.4, 0, Math.PI * 2);
				g.fill();
			}
			neonTubes(g, 0.22, false);
			// base trim + a yellow-painted curb
			g.fillStyle = '#12080e';
			g.fillRect(0, TOP - 8, W, 6);
			g.fillStyle = '#6a6876';
			g.fillRect(0, TOP - 3, W, 9);
			g.fillStyle = '#e8b52a';
			for (let x = 0; x < W; x += 36) g.fillRect(x, TOP - 3, 24, 4);
			g.fillStyle = 'rgba(0,0,0,0.35)';
			g.fillRect(0, TOP + 6, W, 3);
		}

		/** The sign's tubes: a burger and the joint's name. `lit` adds the glow. */
		function neonTubes(g: C2D, a: number, lit: boolean) {
			g.save();
			g.lineCap = 'round';
			g.lineJoin = 'round';
			const pass = (color: string, w: number, blur: number, glow: string) => {
				g.shadowBlur = lit ? blur * scale : 0;
				g.shadowColor = glow;
				g.strokeStyle = color;
				g.lineWidth = w;
				g.beginPath();
				g.arc(292, 22, 12, Math.PI, 0);
				g.closePath();
				g.moveTo(279, 27);
				g.lineTo(305, 27);
				g.moveTo(280, 32);
				g.quadraticCurveTo(292, 38, 304, 32);
				g.stroke();
			};
			const word = (color: string, w: number, blur: number, glow: string) => {
				g.shadowBlur = lit ? blur * scale : 0;
				g.shadowColor = glow;
				g.strokeStyle = color;
				g.lineWidth = w;
				g.font = `900 28px ${FONT}`;
				g.textAlign = 'center';
				g.textBaseline = 'middle';
				g.strokeText(s.sign, 384, 25);
			};
			if (lit) {
				pass(`rgba(255,170,40,${a})`, 3.4, 14, '#ff9a1a');
				pass(`rgba(255,236,190,${a})`, 1.1, 0, '#000');
				word(`rgba(255,60,175,${a})`, 3.2, 16, '#ff2fa8');
				word(`rgba(255,226,246,${a})`, 1.1, 0, '#000');
			} else {
				pass(`rgba(150,90,40,${a + 0.3})`, 3, 0, '#000');
				word(`rgba(140,40,100,${a + 0.3})`, 3, 0, '#000');
			}
			g.restore();
		}

		// ---------------------------------------------------------------- cover (drawn once)
		function drawCover(g: C2D) {
			// spilled munchies next to the dumpster (under everything)
			g.save();
			g.translate(142, 160);
			g.rotate(0.5);
			g.fillStyle = '#ffd23a';
			for (const [x, y, a] of [
				[-6, -4, 0.3],
				[4, 6, -0.6],
				[10, -6, 1.1],
				[-12, 8, -1.2]
			]) {
				g.save();
				g.translate(x, y);
				g.rotate(a);
				g.fillRect(-1.5, -6, 3, 12);
				g.restore();
			}
			rr(g, -6, -8, 13, 16, 2);
			g.fillStyle = '#d8263a';
			g.fill();
			g.lineWidth = 1.5;
			g.strokeStyle = O;
			g.stroke();
			g.restore();
			for (const c of COVER) {
				if (c.kind === 'car') car(g, c);
				else if (c.kind === 'crate') crate(g, c);
				else dumpster(g, c);
			}
		}
		function car(g: C2D, c: Cover) {
			const vertical = c.h > c.w;
			const L = vertical ? c.h : c.w;
			const D = vertical ? c.w : c.h;
			const col = c.variant === 0 ? ['#7ff0f0', '#2aa8b8', '#11586a'] : ['#ff9a88', '#d8343a', '#741018'];
			g.save();
			g.translate(c.x + c.w / 2, c.y + c.h / 2);
			g.rotate(vertical ? Math.PI / 2 : Math.PI);
			g.fillStyle = '#0c0a10';
			for (const sx of [-1, 1])
				for (const sy of [-1, 1]) {
					rr(g, sx * L * 0.3 - 12, sy > 0 ? D / 2 - 5 : -D / 2 - 3, 24, 8, 3);
					g.fill();
				}
			const body = g.createLinearGradient(0, -D / 2, 0, D / 2);
			body.addColorStop(0, col[0]);
			body.addColorStop(0.42, col[1]);
			body.addColorStop(1, col[2]);
			withShadow(g, 16, 6, 9, () => {
				rr(g, -L / 2, -D / 2, L, D, 16);
				g.fillStyle = body;
				g.fill();
			});
			g.lineWidth = 3.2;
			g.strokeStyle = O;
			rr(g, -L / 2, -D / 2, L, D, 16);
			g.stroke();
			// mirrors
			g.fillStyle = col[2];
			for (const sy of [-1, 1]) {
				rr(g, L * 0.1, sy * (D / 2) + (sy > 0 ? 0 : -5), 8, 5, 2);
				g.fill();
				g.lineWidth = 1.5;
				g.stroke();
			}
			// hood creases
			g.strokeStyle = 'rgba(0,0,0,0.28)';
			g.lineWidth = 1.6;
			g.beginPath();
			g.moveTo(L * 0.27, -D * 0.28);
			g.lineTo(L * 0.46, -D * 0.22);
			g.moveTo(L * 0.27, D * 0.28);
			g.lineTo(L * 0.46, D * 0.22);
			g.stroke();
			const glassG = g.createLinearGradient(L * 0.06, 0, L * 0.25, 0);
			glassG.addColorStop(0, '#0d1f36');
			glassG.addColorStop(1, '#4a8cc0');
			// windshield
			g.beginPath();
			g.moveTo(L * 0.06, -D * 0.36);
			g.lineTo(L * 0.25, -D * 0.41);
			g.quadraticCurveTo(L * 0.29, 0, L * 0.25, D * 0.41);
			g.lineTo(L * 0.06, D * 0.36);
			g.closePath();
			g.fillStyle = glassG;
			g.fill();
			g.lineWidth = 2.2;
			g.strokeStyle = O;
			g.stroke();
			g.strokeStyle = 'rgba(255,255,255,0.45)';
			g.lineWidth = 2;
			g.beginPath();
			g.moveTo(L * 0.12, -D * 0.3);
			g.lineTo(L * 0.2, -D * 0.1);
			g.stroke();
			if (c.variant === 0) {
				g.strokeStyle = 'rgba(230,245,255,0.8)';
				g.lineWidth = 1;
				g.beginPath();
				g.moveTo(L * 0.18, D * 0.12);
				g.lineTo(L * 0.12, D * 0.22);
				g.moveTo(L * 0.18, D * 0.12);
				g.lineTo(L * 0.23, D * 0.24);
				g.moveTo(L * 0.18, D * 0.12);
				g.lineTo(L * 0.1, D * 0.04);
				g.moveTo(L * 0.18, D * 0.12);
				g.lineTo(L * 0.24, D * 0.02);
				g.stroke();
			}
			// rear window
			g.beginPath();
			g.moveTo(-L * 0.25, -D * 0.36);
			g.lineTo(-L * 0.36, -D * 0.32);
			g.quadraticCurveTo(-L * 0.39, 0, -L * 0.36, D * 0.32);
			g.lineTo(-L * 0.25, D * 0.36);
			g.closePath();
			g.fillStyle = '#16304e';
			g.fill();
			g.lineWidth = 2.2;
			g.strokeStyle = O;
			g.stroke();
			// roof with gloss
			const roof = g.createLinearGradient(0, -D * 0.34, 0, D * 0.34);
			roof.addColorStop(0, col[0]);
			roof.addColorStop(1, col[1]);
			rr(g, -L * 0.25, -D * 0.36, L * 0.31, D * 0.72, 9);
			g.fillStyle = roof;
			g.fill();
			g.lineWidth = 2.2;
			g.stroke();
			g.fillStyle = 'rgba(255,255,255,0.3)';
			g.beginPath();
			g.ellipse(-L * 0.1, -D * 0.16, L * 0.1, D * 0.08, 0, 0, Math.PI * 2);
			g.fill();
			// lights
			g.fillStyle = '#fff2a8';
			for (const sy of [-1, 1]) {
				rr(g, L / 2 - 8, sy > 0 ? D * 0.26 : -D * 0.26 - 9, 6, 9, 2);
				g.fill();
			}
			g.fillStyle = '#ff3a32';
			for (const sy of [-1, 1]) {
				rr(g, -L / 2 + 2, sy > 0 ? D * 0.26 : -D * 0.26 - 9, 5, 9, 2);
				g.fill();
			}
			g.restore();
		}
		function crate(g: C2D, c: Cover) {
			const { x, y, w, h } = c;
			const wood = g.createLinearGradient(x, y, x + w, y + h);
			wood.addColorStop(0, c.variant ? '#ecc070' : '#dda050');
			wood.addColorStop(1, c.variant ? '#b47c34' : '#965a22');
			withShadow(g, 10, 5, 7, () => {
				rr(g, x, y, w, h, 4);
				g.fillStyle = wood;
				g.fill();
			});
			g.lineWidth = 3;
			g.strokeStyle = O;
			rr(g, x, y, w, h, 4);
			g.stroke();
			g.strokeStyle = 'rgba(70,32,8,0.55)';
			g.lineWidth = 1.5;
			g.beginPath();
			for (let k = 1; k < 3; k++) {
				g.moveTo(x + (w * k) / 3, y + 5);
				g.lineTo(x + (w * k) / 3, y + h - 5);
			}
			g.stroke();
			g.lineWidth = 2.5;
			g.strokeStyle = '#6e3c12';
			rr(g, x + 5, y + 5, w - 10, h - 10, 2);
			g.stroke();
			g.lineCap = 'round';
			g.lineWidth = 7;
			g.strokeStyle = O;
			g.beginPath();
			g.moveTo(x + 8, y + h - 8);
			g.lineTo(x + w - 8, y + 8);
			g.stroke();
			g.lineWidth = 4;
			g.strokeStyle = c.variant ? '#f4cc84' : '#e8b060';
			g.stroke();
			g.fillStyle = '#3a2410';
			for (const [nx, ny] of [
				[x + 7, y + 7],
				[x + w - 7, y + 7],
				[x + 7, y + h - 7],
				[x + w - 7, y + h - 7]
			]) {
				g.beginPath();
				g.arc(nx, ny, 1.6, 0, Math.PI * 2);
				g.fill();
			}
			if (!c.variant) {
				g.font = `900 9px ${FONT}`;
				g.textAlign = 'center';
				g.textBaseline = 'middle';
				g.fillStyle = 'rgba(70,24,4,0.6)';
				g.fillText('FRIES', x + w / 2, y + h / 2 + 10);
			}
		}
		function dumpster(g: C2D, c: Cover) {
			const { x, y, w, h } = c;
			const body = g.createLinearGradient(x, y, x, y + h);
			body.addColorStop(0, '#4ea25a');
			body.addColorStop(1, '#1e4a28');
			withShadow(g, 12, 5, 8, () => {
				rr(g, x, y, w, h, 5);
				g.fillStyle = body;
				g.fill();
			});
			g.lineWidth = 3;
			g.strokeStyle = O;
			rr(g, x, y, w, h, 5);
			g.stroke();
			for (const [lx, open] of [
				[x + 4, false],
				[x + w / 2 + 1, true]
			] as [number, boolean][]) {
				const lw = w / 2 - 5;
				if (open) {
					g.fillStyle = '#0c140c';
					rr(g, lx, y + 4, lw, h - 8, 3);
					g.fill();
				}
				const lid = g.createLinearGradient(lx, y, lx, y + h);
				lid.addColorStop(0, '#62b86c');
				lid.addColorStop(1, '#2c6a36');
				rr(g, lx + (open ? 6 : 0), y + 4 - (open ? 3 : 0), lw, h - 8, 3);
				g.fillStyle = lid;
				g.fill();
				g.lineWidth = 2;
				g.strokeStyle = O;
				g.stroke();
				g.strokeStyle = 'rgba(0,0,0,0.25)';
				g.lineWidth = 1.5;
				g.beginPath();
				for (let k = 1; k < 4; k++) {
					g.moveTo(lx + (open ? 6 : 0) + (lw * k) / 4, y + 7 - (open ? 3 : 0));
					g.lineTo(lx + (open ? 6 : 0) + (lw * k) / 4, y + h - 7 - (open ? 3 : 0));
				}
				g.stroke();
			}
			g.fillStyle = 'rgba(150,80,30,0.5)';
			for (const [rx, ry, rs] of [
				[x + 10, y + h - 7, 3],
				[x + 30, y + 9, 2],
				[x + w - 12, y + h - 9, 2.5]
			]) {
				g.beginPath();
				g.arc(rx, ry, rs, 0, Math.PI * 2);
				g.fill();
			}
		}

		// ---------------------------------------------------------------- spawning + rounds
		function startBanner(n: number) {
			round = n;
			plan = roundPlan(seed, n);
			spawnIdx = 0;
			roundT = 0;
			state = 'banner';
			stateT = 0;
		}
		function spawn(sp: Spawn) {
			const r = RADIUS[sp.kind];
			const p = spawnPoint(sp, r);
			const hp = sp.kind === 'brute' ? plan.bruteHp : plan.hp;
			const base = sp.kind === 'brute' ? plan.bruteSpeed : sp.kind === 'runner' ? plan.runnerSpeed : plan.speed;
			zs.push({
				id: nextId++,
				kind: sp.kind,
				x: p.x,
				y: p.y,
				r,
				hp,
				max: hp,
				speed: base * (0.93 + sp.look * 0.028),
				chef: sp.chef,
				look: sp.look,
				face: Math.atan2(P.y - p.y, P.x - p.x),
				phase: sp.look * 1.1,
				flash: 0,
				kx: 0,
				ky: 0,
				side: sp.look % 2 ? 1 : -1,
				sideT: 0,
				stuck: 0,
				entering: true,
				bar: 1
			});
			if (sp.edge === 'door') {
				doorGlow = 1;
				for (let i = 0; i < (reduce ? 3 : 7); i++) addPart('smoke', p.x + (deco() - 0.5) * 30, TOP + 4, (deco() - 0.5) * 40, 20 + deco() * 30, 0.7, 9 + deco() * 6, 'rgba(200,190,170,');
			}
		}
		function roundClear() {
			const bonus = award(clearBonus(round), dbl());
			score += bonus;
			bigText(s.clear, W / 2, 300, 46, '#ffe066');
			bigText(`+${bonus.toLocaleString('en-US')}`, W / 2, 352, 38, dbl() ? '#ffd23a' : '#9dff6a');
			sound.play('maxed');
			if (isBruteRound(round) && P.hearts < PLAYER_HEARTS) {
				P.hearts++;
				heartPop = P.hearts - 1;
				heartPopT = 0.6;
				bigText(s.heartBack, W / 2, 398, 28, '#ff6b7a');
			}
			if (decals) {
				const g = decals.getContext('2d') as C2D;
				g.save();
				g.setTransform(1, 0, 0, 1, 0, 0);
				g.globalCompositeOperation = 'destination-out';
				g.fillStyle = 'rgba(0,0,0,0.3)';
				g.fillRect(0, 0, pxW, pxW);
				g.restore();
			}
			state = 'clear';
			stateT = 0;
		}

		// ---------------------------------------------------------------- effects
		function addPart(kind: Part['kind'], x: number, y: number, vx: number, vy: number, life: number, size: number, color = '') {
			if (parts.length > (reduce ? 160 : 420)) return;
			parts.push({ kind, x, y, vx, vy, life, max: life, size, rot: deco() * 6.28, vr: (deco() - 0.5) * 18, color });
		}
		function bigText(text: string, x: number, y: number, size: number, color: string) {
			floats.push({ x, y, text, life: 1.6, max: 1.6, size, color, rise: 14 });
		}
		function splat(x: number, y: number, size: number) {
			if (!decals) return;
			const g = decals.getContext('2d') as C2D;
			g.save();
			g.setTransform(scale, 0, 0, scale, 0, 0);
			// one ragged goo puddle, a darker middle, a wet shine and a few drops round it
			const blobPath = (rad: number, n: number) => {
				g.beginPath();
				for (let i = 0; i <= n; i++) {
					const a = (i / n) * Math.PI * 2;
					const k = i === n ? 1 : 0.72 + deco() * 0.5;
					const px = x + Math.cos(a) * rad * k;
					const py = y + Math.sin(a) * rad * k * 0.85;
					if (i === 0) g.moveTo(px, py);
					else g.lineTo(px, py);
				}
				g.closePath();
			};
			g.lineJoin = 'round';
			g.fillStyle = 'rgba(70,150,36,0.55)';
			blobPath(size, 14);
			g.fill();
			g.fillStyle = 'rgba(34,90,20,0.6)';
			blobPath(size * 0.55, 10);
			g.fill();
			g.fillStyle = 'rgba(190,255,120,0.28)';
			g.beginPath();
			g.ellipse(x - size * 0.25, y - size * 0.25, size * 0.22, size * 0.12, -0.5, 0, Math.PI * 2);
			g.fill();
			g.fillStyle = 'rgba(70,150,36,0.6)';
			for (let i = 0; i < 6; i++) {
				const a = deco() * Math.PI * 2;
				const d = size * (1.15 + deco() * 0.7);
				g.beginPath();
				g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85, 1.6 + deco() * 2.6, 0, Math.PI * 2);
				g.fill();
			}
			g.restore();
		}

		// ---------------------------------------------------------------- combat
		function startReload() {
			if (P.reload > 0 || P.mag === MAG) return;
			P.reload = RELOAD_TIME;
			sound.play('clack');
		}
		function fire() {
			P.mag--;
			P.flash = 0.055;
			P.kick = 1;
			const spread = (fx() - 0.5) * 0.07;
			const a = P.aim + spread;
			const ca = Math.cos(P.aim);
			const sa = Math.sin(P.aim);
			const mz = PLAYER_RADIUS * 2.45;
			const mx = P.x + ca * mz - sa * 4;
			const my = P.y + sa * mz + ca * 4;
			if (!lineClear(P.x, P.y, mx, my)) {
				for (let i = 0; i < 4; i++) addPart('spark', mx, my, (deco() - 0.5) * 260, (deco() - 0.5) * 260, 0.18, 2);
			} else bullets.push({ x: mx, y: my, vx: Math.cos(a) * BULLET_SPEED, vy: Math.sin(a) * BULLET_SPEED, ox: mx, oy: my, life: 0.8 });
			// a brass casing out of the right side
			addPart('casing', P.x + ca * 10 - sa * 10, P.y + sa * 10 + ca * 10, -sa * (110 + deco() * 60) + ca * (deco() - 0.5) * 50, ca * (110 + deco() * 60) + sa * (deco() - 0.5) * 50, 0.55, 1);
			if (P.mag === 0) startReload();
		}
		function hitZombie(z: Z, hx: number, hy: number, dx: number, dy: number) {
			const ik = insta();
			const dmg = ik ? (z.kind === 'brute' ? 8 : 999) : 1;
			z.hp -= dmg;
			z.flash = 0.08;
			const kb = z.kind === 'brute' ? 26 : z.kind === 'runner' ? 120 : 150;
			z.kx += dx * kb;
			z.ky += dy * kb;
			score += award(POINTS.hit, dbl());
			marks.push({ x: hx, y: hy, life: 0.16, insta: ik });
			for (let i = 0; i < (reduce ? 2 : 4); i++) addPart('goo', hx, hy, dx * (60 + deco() * 120) + (deco() - 0.5) * 120, dy * (60 + deco() * 120) + (deco() - 0.5) * 120, 0.35 + deco() * 0.2, 2 + deco() * 2.5);
			if (z.hp <= 0) killZombie(z, true);
		}
		function killZombie(z: Z, canDrop: boolean) {
			const i = zs.indexOf(z);
			if (i < 0) return;
			zs.splice(i, 1);
			const pts = award(POINTS.kill, dbl());
			score += pts;
			const big = z.kind === 'brute';
			floats.push({ x: clamp(z.x, 34, W - 34), y: clamp(z.y - z.r - 6, TOP + 24, H - 30), text: `+${pts}`, life: 0.9, max: 0.9, size: big ? 30 : 22, color: dbl() ? '#ffd23a' : '#ffffff', rise: 42 });
			if (big) {
				bigText(s.bruteDown, W / 2, 250, 40, '#ff8a3d');
				if (!reduce) shake = Math.max(shake, 0.35);
			}
			// the puff
			const n = reduce ? 4 : big ? 16 : 9;
			for (let k = 0; k < n; k++) {
				const a = (k / n) * Math.PI * 2 + deco();
				const sp = (big ? 90 : 60) + deco() * 50;
				addPart('smoke', z.x, z.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.55 + deco() * 0.3, (big ? 13 : 8) + deco() * 5, 'rgba(176,204,150,');
			}
			for (let k = 0; k < (reduce ? 3 : big ? 14 : 7); k++) {
				const a = deco() * Math.PI * 2;
				addPart('goo', z.x, z.y, Math.cos(a) * (120 + deco() * 160), Math.sin(a) * (120 + deco() * 160), 0.4 + deco() * 0.25, 2.5 + deco() * 3);
			}
			addPart('ring', z.x, z.y, 0, 0, 0.32, big ? 60 : 32);
			if (z.chef && !reduce) addPart('star', z.x, z.y, (deco() - 0.5) * 80, -60 - deco() * 40, 0.8, 9, 'hat');
			splat(z.x, z.y, big ? 30 : 15);
			const now = performance.now();
			if (now - lastKillSound > 90) {
				lastKillSound = now;
				sound.play('camo');
			}
			if (canDrop) {
				const pk = roll();
				if (pk) powers.push({ x: clamp(z.x, 30, W - 30), y: clamp(z.y, TOP + 30, H - 40), kind: pk, t: 0 });
			}
		}
		function hurtPlayer() {
			P.hearts--;
			P.inv = 1.6;
			hurtFlash = 0.45;
			heartPop = P.hearts;
			heartPopT = 0.6;
			if (!reduce) shake = Math.max(shake, 0.35);
			for (const z of zs) {
				const dx = z.x - P.x;
				const dy = z.y - P.y;
				const d = Math.hypot(dx, dy) || 1;
				if (d < 110) {
					const k = z.kind === 'brute' ? 120 : 340;
					z.kx += (dx / d) * k;
					z.ky += (dy / d) * k;
				}
			}
			if (P.hearts <= 0) {
				state = 'dead';
				stateT = 0;
				firing = false;
				sound.play('divergence');
			} else sound.play('clack');
		}
		function applyPower(kind: PowerKind) {
			bigText(s.power[kind], W / 2, 230, 42, kind === 'nuke' ? '#fff3a0' : kind === 'insta' ? '#d9a6ff' : '#ffd23a');
			if (kind === 'nuke') {
				nukeFlash = 1;
				if (!reduce) shake = Math.max(shake, 0.4);
				sound.play('divergence');
				for (const z of [...zs]) {
					if (z.kind === 'brute') {
						z.hp -= Math.ceil(z.max * 0.3);
						z.flash = 0.2;
						if (z.hp <= 0) killZombie(z, false);
					} else killZombie(z, false);
				}
			} else {
				if (kind === 'insta') instaUntil = clock + POWER_TIME;
				else doubleUntil = clock + POWER_TIME;
				sound.play('maxed');
			}
		}

		// ---------------------------------------------------------------- the step
		function nearestTarget(): Z | null {
			let best: Z | null = null;
			let bd = AUTO_RANGE * AUTO_RANGE;
			for (const z of zs) {
				if (z.x < -6 || z.x > W + 6 || z.y > H + 6 || z.y < TOP - 30) continue;
				const dx = z.x - P.x;
				const dy = z.y - P.y;
				const d = dx * dx + dy * dy;
				if (d < bd && lineClear(P.x, P.y, z.x, z.y)) {
					bd = d;
					best = z;
				}
			}
			return best;
		}
		function step(dt: number) {
			stateT += dt;
			P.inv = Math.max(0, P.inv - dt);
			P.flash -= dt;
			P.kick = Math.max(0, P.kick - dt * 9);
			shake = Math.max(0, shake - dt);
			hurtFlash = Math.max(0, hurtFlash - dt);
			nukeFlash = Math.max(0, nukeFlash - dt * 1.1);
			doorGlow = Math.max(0, doorGlow - dt * 1.5);
			heartPopT = Math.max(0, heartPopT - dt);
			if (state === 'banner' && stateT >= BANNER) {
				state = 'fight';
				stateT = 0;
				roundT = 0;
			}
			if (state === 'fight') {
				roundT += dt;
				while (spawnIdx < plan.spawns.length && plan.spawns[spawnIdx].at <= roundT && zs.length < MAX_ALIVE) spawn(plan.spawns[spawnIdx++]);
				if (spawnIdx >= plan.spawns.length && zs.length === 0) roundClear();
			} else if (state === 'clear' && stateT >= CLEAR_PAUSE) startBanner(round + 1);
			const alive = state !== 'dead';
			if (alive) movePlayer(dt);
			if (alive) aimAndFire(dt);
			moveBullets(dt);
			moveZombies(dt, alive);
			for (const p of powers) p.t += dt;
			powers = powers.filter((p) => {
				if (p.t > POWER_LIFE) return false;
				if (alive && Math.hypot(p.x - P.x, p.y - P.y) < PLAYER_RADIUS + 20) {
					applyPower(p.kind);
					return false;
				}
				return true;
			});
			for (const p of parts) {
				p.life -= dt;
				const drag = p.kind === 'smoke' ? 2 : p.kind === 'casing' ? 5 : p.kind === 'star' ? 0.5 : 6;
				const k = Math.exp(-drag * dt);
				p.vx *= k;
				p.vy *= k;
				if (p.kind === 'star') p.vy += 160 * dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.rot += p.vr * dt;
			}
			parts = parts.filter((p) => p.life > 0);
			for (const f of floats) {
				f.life -= dt;
				f.y -= f.rise * dt;
			}
			floats = floats.filter((f) => f.life > 0);
			for (const m of marks) m.life -= dt;
			marks = marks.filter((m) => m.life > 0);
			if (state === 'dead' && stateT >= 1.0) finish();
		}
		function movePlayer(dt: number) {
			let mx = 0;
			let my = 0;
			if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
			if (keys.has('d') || keys.has('arrowright')) mx += 1;
			if (keys.has('w') || keys.has('arrowup')) my -= 1;
			if (keys.has('s') || keys.has('arrowdown')) my += 1;
			if (joy) {
				const dx = joy.x - joy.bx;
				const dy = joy.y - joy.by;
				const d = Math.hypot(dx, dy);
				if (d > 6) {
					const k = Math.min(1, d / JOY_R);
					mx += (dx / d) * k;
					my += (dy / d) * k;
				}
			}
			const m = Math.hypot(mx, my);
			if (m > 1) {
				mx /= m;
				my /= m;
			}
			P.moving = Math.min(1, m);
			P.x += mx * PLAYER_SPEED * dt;
			P.y += my * PLAYER_SPEED * dt;
			P.walk += Math.min(1, m) * dt * 11;
			for (const c of COVER) {
				const o = pushOut(P.x, P.y, PLAYER_RADIUS, c);
				P.x = o.x;
				P.y = o.y;
			}
			P.x = clamp(P.x, PLAYER_RADIUS, W - PLAYER_RADIUS);
			P.y = clamp(P.y, TOP + PLAYER_RADIUS, H - PLAYER_RADIUS - 4);
			if (mode === 'keys' && m > 0.1 && !nearestTarget()) P.aim = turn(P.aim, Math.atan2(my, mx), 10 * dt);
		}
		function aimAndFire(dt: number) {
			let want = false;
			if (mode === 'mouse') {
				P.aim = Math.atan2(mouse.y - P.y, mouse.x - P.x);
				want = firing || spaceFire;
			} else {
				const t = nearestTarget();
				if (t) {
					const a = Math.atan2(t.y - P.y, t.x - P.x);
					P.aim = turn(P.aim, a, 18 * dt);
					if (mode === 'touch') want = Math.abs(angDiff(P.aim, a)) < 0.3;
				}
				if (mode === 'keys') want = spaceFire || firing;
			}
			if (P.reload > 0) {
				P.reload -= dt;
				if (P.reload <= 0) {
					P.reload = 0;
					P.mag = MAG;
				}
				P.cd = Math.max(0, P.cd - dt);
				return;
			}
			P.cd -= dt;
			if (want && P.cd <= 0 && P.mag > 0) {
				fire();
				P.cd += 1 / FIRE_RATE;
				if (P.cd < 0) P.cd = 0;
			} else if (P.cd < 0) P.cd = 0;
		}
		function moveBullets(dt: number) {
			const keep: Bullet[] = [];
			for (const b of bullets) {
				b.life -= dt;
				const nx = b.x + b.vx * dt;
				const ny = b.y + b.vy * dt;
				let tHit = 2;
				let hitZ: Z | null = null;
				let wall = false;
				for (const c of COVER) {
					const t = segRect(b.x, b.y, nx, ny, c);
					if (t >= 0 && t < tHit) {
						tHit = t;
						wall = true;
					}
				}
				for (const z of zs) {
					const t = segCircle(b.x, b.y, nx, ny, z.x, z.y, z.r + 2);
					if (t >= 0 && t < tHit) {
						tHit = t;
						hitZ = z;
						wall = false;
					}
				}
				const sp = Math.hypot(b.vx, b.vy) || 1;
				const dx = b.vx / sp;
				const dy = b.vy / sp;
				if (hitZ) {
					hitZombie(hitZ, b.x + (nx - b.x) * tHit, b.y + (ny - b.y) * tHit, dx, dy);
					continue;
				}
				if (wall) {
					const hx = b.x + (nx - b.x) * tHit;
					const hy = b.y + (ny - b.y) * tHit;
					for (let i = 0; i < (reduce ? 2 : 5); i++) addPart('spark', hx, hy, -dx * 120 + (deco() - 0.5) * 240, -dy * 120 + (deco() - 0.5) * 240, 0.16 + deco() * 0.1, 2);
					continue;
				}
				if (ny < TOP - 24) {
					for (let i = 0; i < (reduce ? 2 : 5); i++) addPart('dust', nx, TOP - 24, (deco() - 0.5) * 160, 40 + deco() * 90, 0.4, 2.5, 'rgba(150,80,90,');
					continue;
				}
				b.x = nx;
				b.y = ny;
				if (b.life > 0 && nx > -40 && nx < W + 40 && ny < H + 40) keep.push(b);
			}
			bullets = keep;
		}
		function moveZombies(dt: number, alive: boolean) {
			const drag = Math.exp(-7 * dt);
			for (const z of zs) {
				z.flash -= dt;
				z.bar += (z.hp / z.max - z.bar) * Math.min(1, dt * 6);
				const dx = P.x - z.x;
				const dy = P.y - z.y;
				const d = Math.hypot(dx, dy) || 1;
				let ux = dx / d;
				let uy = dy / d;
				if (z.sideT > 0) {
					z.sideT -= dt;
					const px = -uy * z.side;
					const py = ux * z.side;
					ux = ux * 0.35 + px;
					uy = uy * 0.35 + py;
					const m = Math.hypot(ux, uy) || 1;
					ux /= m;
					uy /= m;
				}
				let sx = 0;
				let sy = 0;
				for (const o of zs) {
					if (o === z) continue;
					const ex = z.x - o.x;
					const ey = z.y - o.y;
					const min = z.r + o.r;
					const e2 = ex * ex + ey * ey;
					if (e2 < min * min && e2 > 0.01) {
						const e = Math.sqrt(e2);
						const push = (min - e) / min;
						sx += (ex / e) * push;
						sy += (ey / e) * push;
					}
				}
				const gait = z.kind === 'runner' ? 0.9 + 0.12 * Math.sin(z.phase * 2) : z.kind === 'brute' ? 0.8 + 0.25 * Math.max(0, Math.sin(z.phase)) : 0.6 + 0.55 * Math.max(0, Math.sin(z.phase));
				const sp = alive ? z.speed * gait : z.speed * 0.25;
				const ox = z.x;
				const oy = z.y;
				z.x += (ux * sp + sx * 90 + z.kx) * dt;
				z.y += (uy * sp + sy * 90 + z.ky) * dt;
				z.kx *= drag;
				z.ky *= drag;
				if (z.entering) {
					if (z.x >= z.r && z.x <= W - z.r && z.y >= TOP + z.r && z.y <= H - z.r) z.entering = false;
				} else {
					for (const c of COVER) {
						const o = pushOut(z.x, z.y, z.r, c);
						z.x = o.x;
						z.y = o.y;
					}
					z.x = clamp(z.x, z.r, W - z.r);
					z.y = clamp(z.y, TOP + z.r * 0.6, H - z.r);
					const moved = Math.hypot(z.x - ox, z.y - oy);
					if (moved < sp * dt * 0.35 && z.sideT <= 0 && d > z.r + PLAYER_RADIUS + 8) {
						z.stuck += dt;
						if (z.stuck > 0.25) {
							z.sideT = 0.9;
							z.stuck = 0;
							z.side = -z.side;
						}
					} else z.stuck = Math.max(0, z.stuck - dt);
				}
				z.phase += dt * (z.kind === 'runner' ? 11 : z.kind === 'brute' ? 4 : 6.5);
				z.face = turn(z.face, Math.atan2(dy, dx), 5 * dt);
				if (alive && P.inv <= 0 && d < z.r + PLAYER_RADIUS - 3) hurtPlayer();
			}
		}
		function finish() {
			if (ended) return;
			ended = true;
			cancelAnimationFrame(raf);
			onend(Math.max(0, Math.round(score)));
		}

		// ---------------------------------------------------------------- drawing: characters
		function limb(x0: number, y0: number, x1: number, y1: number, w: number, color: string) {
			ctx.lineCap = 'round';
			ctx.strokeStyle = O;
			ctx.lineWidth = w + 4.5;
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.lineTo(x1, y1);
			ctx.stroke();
			ctx.strokeStyle = color;
			ctx.lineWidth = w;
			ctx.stroke();
		}
		function blob(x: number, y: number, r: number, fill: string | CanvasGradient, lw = 3) {
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fillStyle = fill;
			ctx.fill();
			if (lw) {
				ctx.lineWidth = lw;
				ctx.strokeStyle = O;
				ctx.stroke();
			}
		}
		function drawZombie(z: Z) {
			const r = z.r;
			const brute = z.kind === 'brute';
			const runner = z.kind === 'runner';
			const white = z.flash > 0;
			const skin = white ? '#ffffff' : SKIN[z.look];
			const skinD = white ? '#dddddd' : SKIN_D[z.look];
			const shirt = white ? '#ffffff' : brute ? '#a8262a' : SHIRT[z.look];
			const shirtD = white ? '#dddddd' : brute ? '#4a0c10' : SHIRT_D[z.look];
			ctx.save();
			ctx.translate(z.x, z.y);
			ctx.rotate(z.face + Math.sin(z.phase) * (runner ? 0.06 : brute ? 0.05 : 0.14));
			const sw = Math.sin(z.phase) * r * (runner ? 0.42 : 0.2);
			// arms: reaching out (walkers, Brutes) or pumping (runners), clawed hands
			const aw = r * (brute ? 0.46 : 0.36);
			const hands: [number, number][] = runner
				? [
						[r * 0.6 + sw, -r * 0.98],
						[r * 0.6 - sw, r * 0.98]
					]
				: [
						[r * 1.38 + sw, -r * 0.5],
						[r * 1.38 - sw, r * 0.5]
					];
			limb(r * 0.02, -r * 0.84, hands[0][0], hands[0][1], aw, skin);
			limb(r * 0.02, r * 0.84, hands[1][0], hands[1][1], aw, skin);
			for (const [hx0, hy0] of hands) {
				ctx.strokeStyle = O;
				ctx.lineCap = 'round';
				ctx.lineWidth = 2;
				ctx.beginPath();
				for (const k of [-1, 0, 1]) {
					ctx.moveTo(hx0, hy0 + k * aw * 0.32);
					ctx.lineTo(hx0 + aw * 0.75, hy0 + k * aw * 0.42);
				}
				ctx.stroke();
				blob(hx0, hy0, aw * 0.62, skinD, 2);
			}
			if (brute) {
				// a giant greasy spatula in the right hand
				ctx.save();
				ctx.translate(hands[1][0], hands[1][1]);
				ctx.rotate(-0.25);
				limb(0, 0, r * 0.9, 0, 4.5, '#7a4420');
				const blade = ctx.createLinearGradient(r * 0.9, -12, r * 0.9, 12);
				blade.addColorStop(0, '#f2f6fa');
				blade.addColorStop(1, '#8a96a2');
				rr(ctx, r * 0.9, -12, r * 0.8, 24, 4);
				ctx.fillStyle = white ? '#fff' : blade;
				ctx.fill();
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = O;
				ctx.stroke();
				ctx.strokeStyle = '#5a6470';
				ctx.lineWidth = 2;
				ctx.beginPath();
				for (const yy of [-5.5, 0, 5.5]) {
					ctx.moveTo(r * 1.02, yy);
					ctx.lineTo(r * 1.55, yy);
				}
				ctx.stroke();
				ctx.fillStyle = 'rgba(120,70,20,0.55)';
				ctx.beginPath();
				ctx.arc(r * 1.45, 6, 3, 0, Math.PI * 2);
				ctx.fill();
				ctx.restore();
			}
			// shoulders: a torn shirt (a tank top on the Brute) with a ragged back hem
			const bodyG = ctx.createLinearGradient(0, -r, 0, r);
			bodyG.addColorStop(0, shirt);
			bodyG.addColorStop(1, shirtD);
			const bw = r * (brute ? 1.2 : 1.08);
			ctx.beginPath();
			ctx.ellipse(-r * 0.04, 0, r * 0.62, bw, 0, -Math.PI / 2, Math.PI / 2);
			const teeth = 7;
			for (let k = 0; k <= teeth; k++) {
				const a = Math.PI / 2 + (k / teeth) * Math.PI;
				const rad = k % 2 ? 0.78 : 1;
				ctx.lineTo(-r * 0.04 + Math.cos(a) * r * 0.62 * rad, Math.sin(a) * bw * (k % 2 ? 0.92 : 1));
			}
			ctx.closePath();
			ctx.fillStyle = bodyG;
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.lineJoin = 'round';
			ctx.strokeStyle = O;
			ctx.stroke();
			if (!white) {
				// a rip showing green skin, and claw slashes
				ctx.fillStyle = skin;
				ctx.beginPath();
				ctx.moveTo(-r * 0.36, -r * 0.62);
				ctx.lineTo(-r * 0.12, -r * 0.7);
				ctx.lineTo(-r * 0.2, -r * 0.5);
				ctx.lineTo(-r * 0.02, -r * 0.42);
				ctx.lineTo(-r * 0.3, -r * 0.3);
				ctx.closePath();
				ctx.fill();
				ctx.lineWidth = 1.5;
				ctx.stroke();
				ctx.strokeStyle = shirtD;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(-r * 0.5, r * 0.36);
				ctx.lineTo(-r * 0.2, r * 0.72);
				ctx.moveTo(-r * 0.42, r * 0.18);
				ctx.lineTo(-r * 0.12, r * 0.52);
				ctx.stroke();
				ctx.fillStyle = 'rgba(255,255,255,0.18)';
				ctx.beginPath();
				ctx.ellipse(-r * 0.1, -bw * 0.5, r * 0.3, bw * 0.22, 0, 0, Math.PI * 2);
				ctx.fill();
			}
			// head, pushed forward, with a gaping jaw on its front
			const hx = runner ? r * 0.42 : r * 0.3;
			const hr = r * (brute ? 0.46 : 0.52);
			const headG = ctx.createRadialGradient(hx - hr * 0.3, -hr * 0.35, hr * 0.1, hx, 0, hr);
			headG.addColorStop(0, white ? '#fff' : '#e2ffb0');
			headG.addColorStop(0.45, skin);
			headG.addColorStop(1, skinD);
			blob(hx, 0, hr, headG);
			ctx.fillStyle = white ? '#ccc' : '#3a0a14';
			ctx.beginPath();
			ctx.ellipse(hx + hr * 0.92, 0, hr * 0.24, hr * 0.42, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.lineWidth = 1.6;
			ctx.strokeStyle = O;
			ctx.stroke();
			ctx.fillStyle = '#fff6d8';
			ctx.fillRect(hx + hr * 0.98, -hr * 0.24, hr * 0.14, hr * 0.14);
			ctx.fillRect(hx + hr * 0.98, hr * 0.1, hr * 0.14, hr * 0.14);
			if (!white) {
				ctx.fillStyle = skinD;
				ctx.beginPath();
				ctx.arc(hx - hr * 0.4, hr * 0.32, hr * 0.2, 0, Math.PI * 2);
				ctx.arc(hx - hr * 0.05, -hr * 0.5, hr * 0.13, 0, Math.PI * 2);
				ctx.fill();
			}
			if (brute) {
				ctx.strokeStyle = '#2a1408';
				ctx.lineWidth = 1.8;
				ctx.beginPath();
				ctx.moveTo(hx - hr * 0.75, -hr * 0.05);
				ctx.quadraticCurveTo(hx - hr * 0.1, -hr * 0.3, hx + hr * 0.35, -hr * 0.05);
				for (let k = 0; k < 4; k++) {
					const tx = hx - hr * 0.6 + k * hr * 0.3;
					ctx.moveTo(tx, -hr * 0.36);
					ctx.lineTo(tx + 1, hr * 0.05);
				}
				ctx.stroke();
			} else if (!z.chef && z.look % 2 === 0) {
				// a patch of brain showing
				ctx.fillStyle = white ? '#fff' : '#ff9cb8';
				ctx.beginPath();
				ctx.arc(hx - hr * 0.3, -hr * 0.05, hr * 0.38, 0, Math.PI * 2);
				ctx.fill();
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = O;
				ctx.stroke();
				ctx.strokeStyle = '#d0587a';
				ctx.lineWidth = 1.2;
				ctx.beginPath();
				ctx.moveTo(hx - hr * 0.55, -hr * 0.1);
				ctx.quadraticCurveTo(hx - hr * 0.3, -hr * 0.35, hx - hr * 0.08, -hr * 0.08);
				ctx.moveTo(hx - hr * 0.5, hr * 0.12);
				ctx.quadraticCurveTo(hx - hr * 0.3, -hr * 0.02, hx - hr * 0.1, hr * 0.14);
				ctx.stroke();
			} else if (!z.chef) {
				// greasy hair strands at the back
				ctx.strokeStyle = '#2a1a10';
				ctx.lineWidth = 2.2;
				ctx.lineCap = 'round';
				ctx.beginPath();
				for (let k = -2; k <= 2; k++) {
					ctx.moveTo(hx - hr * 0.55, k * hr * 0.22);
					ctx.lineTo(hx - hr * 1.12, k * hr * 0.3 + (k % 2) * 2);
				}
				ctx.stroke();
			}
			// glowing eyes near the front
			for (const sy of [-1, 1]) {
				ctx.fillStyle = O;
				ctx.beginPath();
				ctx.arc(hx + hr * 0.5, sy * hr * 0.42, hr * 0.28, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = runner ? '#ff5a3a' : '#ffe14a';
				ctx.beginPath();
				ctx.arc(hx + hr * 0.53, sy * hr * 0.42, hr * 0.2, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#fffbe0';
				ctx.beginPath();
				ctx.arc(hx + hr * 0.58, sy * hr * 0.38, hr * 0.08, 0, Math.PI * 2);
				ctx.fill();
			}
			if (z.chef) drawChefHat(hx - hr * 0.55, 0, hr * 0.88, white);
			ctx.restore();
		}
		/** A burger-chef hat seen from above: a puffy top with a band showing at the front, a ketchup stain. */
		function drawChefHat(x: number, y: number, hr: number, white: boolean) {
			const puffs: [number, number, number][] = [[0, 0, hr * 0.7]];
			for (let k = 0; k < 5; k++) {
				const a = (k / 5) * Math.PI * 2 + 0.6;
				puffs.push([Math.cos(a) * hr * 0.42, Math.sin(a) * hr * 0.42, hr * 0.5]);
			}
			ctx.fillStyle = O;
			ctx.beginPath();
			ctx.arc(x + hr * 0.42, y, hr * 0.62 + 2.4, -Math.PI / 2, Math.PI / 2);
			ctx.fill();
			for (const [px, py, pr] of puffs) {
				ctx.beginPath();
				ctx.arc(x + px, y + py, pr + 2.4, 0, Math.PI * 2);
				ctx.fill();
			}
			// the band at the front
			ctx.fillStyle = white ? '#fff' : '#d8dee6';
			ctx.beginPath();
			ctx.arc(x + hr * 0.42, y, hr * 0.62, -Math.PI / 2, Math.PI / 2);
			ctx.fill();
			const hg = ctx.createRadialGradient(x - hr * 0.25, y - hr * 0.3, 1, x, y, hr * 1.1);
			hg.addColorStop(0, '#ffffff');
			hg.addColorStop(0.7, '#f2f4f8');
			hg.addColorStop(1, white ? '#ffffff' : '#bcc6d0');
			ctx.fillStyle = hg;
			for (const [px, py, pr] of puffs) {
				ctx.beginPath();
				ctx.arc(x + px, y + py, pr, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.strokeStyle = 'rgba(110,122,136,0.75)';
			ctx.lineWidth = 1.3;
			ctx.beginPath();
			for (let k = 0; k < 5; k++) {
				const a = (k / 5) * Math.PI * 2 + 0.6 + Math.PI / 5;
				ctx.moveTo(x + Math.cos(a) * hr * 0.2, y + Math.sin(a) * hr * 0.2);
				ctx.quadraticCurveTo(x + Math.cos(a + 0.3) * hr * 0.5, y + Math.sin(a + 0.3) * hr * 0.5, x + Math.cos(a) * hr * 0.78, y + Math.sin(a) * hr * 0.78);
			}
			ctx.stroke();
			if (!white) {
				ctx.fillStyle = '#d8263a';
				ctx.beginPath();
				ctx.arc(x + hr * 0.18, y - hr * 0.32, hr * 0.16, 0, Math.PI * 2);
				ctx.arc(x + hr * 0.34, y - hr * 0.2, hr * 0.09, 0, Math.PI * 2);
				ctx.arc(x + hr * 0.02, y - hr * 0.44, hr * 0.07, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		function drawPlayer(T: number) {
			const r = PLAYER_RADIUS;
			const deadT = state === 'dead' ? Math.min(1, stateT / 0.8) : 0;
			ctx.save();
			ctx.translate(P.x, P.y);
			// a cyan team glow on the ground
			const gg = ctx.createRadialGradient(0, 2, r * 0.6, 0, 2, r * 1.9);
			gg.addColorStop(0, 'rgba(60,240,220,0.28)');
			gg.addColorStop(1, 'rgba(60,240,220,0)');
			ctx.fillStyle = gg;
			ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
			ctx.strokeStyle = 'rgba(110,255,230,0.6)';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.ellipse(0, 3, r * 1.45, r * 1.3, 0, 0, Math.PI * 2);
			ctx.stroke();
			if (P.reload > 0) {
				ctx.strokeStyle = O;
				ctx.lineWidth = 6.5;
				ctx.lineCap = 'round';
				ctx.beginPath();
				ctx.arc(0, 0, r * 1.7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - P.reload / RELOAD_TIME));
				ctx.stroke();
				ctx.strokeStyle = '#ffd23a';
				ctx.lineWidth = 3.5;
				ctx.stroke();
			}
			ctx.rotate(P.aim + deadT * 2.4);
			ctx.scale(1 - deadT * 0.25, 1 - deadT * 0.25);
			ctx.globalAlpha = 1 - deadT * 0.35;
			const kick = P.kick * 3;
			const bob = Math.sin(P.walk) * 1.4 * P.moving;
			ctx.lineJoin = 'round';
			// backpack + radio whip
			ctx.strokeStyle = O;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(-r * 1.0, -r * 0.4);
			ctx.lineTo(-r * 1.9, -r * 0.95);
			ctx.stroke();
			blob(-r * 1.9, -r * 0.95, 2.4, '#ff3a3a', 1.2);
			const pack = ctx.createLinearGradient(-r * 1.25, 0, -r * 0.5, 0);
			pack.addColorStop(0, '#34421f');
			pack.addColorStop(1, '#5e7038');
			rr(ctx, -r * 1.24, -r * 0.62, r * 0.76, r * 1.24, 6);
			ctx.fillStyle = pack;
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = O;
			ctx.stroke();
			ctx.strokeStyle = 'rgba(0,0,0,0.35)';
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(-r * 0.86, -r * 0.5);
			ctx.lineTo(-r * 0.86, r * 0.5);
			ctx.stroke();
			// shoulders: a tan vest with olive plates
			const vest = ctx.createLinearGradient(0, -r, 0, r);
			vest.addColorStop(0, '#e2cc92');
			vest.addColorStop(1, '#8e7646');
			ctx.beginPath();
			ctx.ellipse(-r * 0.05, bob * 0.3, r * 0.74, r * 1.1, 0, 0, Math.PI * 2);
			ctx.fillStyle = vest;
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = O;
			ctx.stroke();
			ctx.fillStyle = '#5e7432';
			for (const sy of [-1, 1]) {
				rr(ctx, -r * 0.46, sy > 0 ? r * 0.3 : -r * 0.76, r * 0.5, r * 0.46, 3);
				ctx.fill();
				ctx.lineWidth = 1.6;
				ctx.stroke();
			}
			ctx.fillStyle = '#2ad4c8';
			ctx.beginPath();
			ctx.arc(-r * 0.2, -r * 0.53, 2.2, 0, Math.PI * 2);
			ctx.fill();
			// the rifle
			ctx.save();
			ctx.translate(-kick, 0);
			const gun = ctx.createLinearGradient(0, 0, 0, 8);
			gun.addColorStop(0, '#7a8090');
			gun.addColorStop(1, '#30323c');
			rr(ctx, r * 0.25, 0.5, r * 2.25, 7, 2);
			ctx.fillStyle = gun;
			ctx.fill();
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = O;
			ctx.stroke();
			rr(ctx, r * 2.25, 2, r * 0.35, 4, 1);
			ctx.fillStyle = '#22242c';
			ctx.fill();
			ctx.stroke();
			rr(ctx, r * 0.95, 7, 7, 8, 1.5);
			ctx.fillStyle = '#3c3f4a';
			ctx.fill();
			ctx.stroke();
			rr(ctx, r * 1.05, -2.5, 9, 5, 1.5);
			ctx.fillStyle = '#22242c';
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = '#ff3a3a';
			ctx.beginPath();
			ctx.arc(r * 1.05 + 7.5, 0, 1.6, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
			// arms holding it
			limb(r * 0.12, -r * 0.8, r * 1.55 - kick, 2, 6.5, '#6e7e40');
			limb(r * 0.05, r * 0.82, r * 0.8 - kick, 6, 6.5, '#6e7e40');
			blob(r * 1.55 - kick, 2, 3.8, '#24241c', 1.6);
			blob(r * 0.8 - kick, 6, 3.8, '#24241c', 1.6);
			// helmet with a blinking IR strobe
			const hg = ctx.createRadialGradient(-r * 0.2, -r * 0.25, 1, 0, 0, r * 0.72);
			hg.addColorStop(0, '#b8cc7a');
			hg.addColorStop(0.5, '#6a7c3c');
			hg.addColorStop(1, '#3a4620');
			blob(r * 0.02, 0, r * 0.68, hg, 3);
			ctx.strokeStyle = 'rgba(30,36,14,0.65)';
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			ctx.arc(r * 0.02, 0, r * 0.46, -2.3, 2.3);
			ctx.stroke();
			ctx.fillStyle = '#1e2214';
			rr(ctx, r * 0.5, -4, 6, 8, 1.5);
			ctx.fill();
			const strobe = Math.sin(T * 7) > 0.6;
			blob(-r * 0.42, 0, 2.6, strobe ? '#9ffcff' : '#2a6a70', 1.2);
			if (strobe) {
				ctx.save();
				ctx.globalCompositeOperation = 'lighter';
				const sg = ctx.createRadialGradient(-r * 0.42, 0, 0, -r * 0.42, 0, 10);
				sg.addColorStop(0, 'rgba(150,255,255,0.7)');
				sg.addColorStop(1, 'rgba(150,255,255,0)');
				ctx.fillStyle = sg;
				ctx.fillRect(-r * 0.42 - 10, -10, 20, 20);
				ctx.restore();
			}
			ctx.fillStyle = 'rgba(255,255,255,0.32)';
			ctx.beginPath();
			ctx.ellipse(-r * 0.12, -r * 0.28, r * 0.26, r * 0.14, -0.4, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
			// muzzle flash
			if (P.flash > 0 && state !== 'dead') {
				const ca = Math.cos(P.aim);
				const sa = Math.sin(P.aim);
				const mz = r * 2.5 - kick;
				const fxp = P.x + ca * mz - sa * 4;
				const fyp = P.y + sa * mz + ca * 4;
				ctx.save();
				ctx.globalCompositeOperation = 'lighter';
				const gl = ctx.createRadialGradient(fxp, fyp, 0, fxp, fyp, 34);
				gl.addColorStop(0, 'rgba(255,230,140,0.75)');
				gl.addColorStop(1, 'rgba(255,140,40,0)');
				ctx.fillStyle = gl;
				ctx.fillRect(fxp - 34, fyp - 34, 68, 68);
				ctx.translate(fxp, fyp);
				ctx.rotate(P.aim + T * 40);
				ctx.fillStyle = '#fff3b8';
				ctx.beginPath();
				for (let k = 0; k < 10; k++) {
					const a = (k / 10) * Math.PI * 2;
					const rad = k % 2 ? 4 : k === 0 ? 15 : 9;
					ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
				}
				ctx.closePath();
				ctx.fill();
				ctx.restore();
			}
		}
		function drawToken(kind: PowerKind, x: number, y: number, rad: number, T: number) {
			const glow = ctx.createRadialGradient(x, y, rad * 0.4, x, y, rad * 2.1);
			const c = kind === 'nuke' ? '255,226,60' : kind === 'insta' ? '190,120,255' : '255,200,40';
			glow.addColorStop(0, `rgba(${c},${0.55 + 0.2 * Math.sin(T * 6)})`);
			glow.addColorStop(1, `rgba(${c},0)`);
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			ctx.fillStyle = glow;
			ctx.fillRect(x - rad * 2.2, y - rad * 2.2, rad * 4.4, rad * 4.4);
			ctx.restore();
			const disc = ctx.createRadialGradient(x - rad * 0.35, y - rad * 0.4, 1, x, y, rad);
			if (kind === 'nuke') {
				disc.addColorStop(0, '#fff6a0');
				disc.addColorStop(1, '#e8b000');
			} else if (kind === 'insta') {
				disc.addColorStop(0, '#9a6ad8');
				disc.addColorStop(1, '#3a1a6a');
			} else {
				disc.addColorStop(0, '#fff6b0');
				disc.addColorStop(0.5, '#ffc928');
				disc.addColorStop(1, '#b86e00');
			}
			blob(x, y, rad, disc, 2.6);
			if (kind === 'nuke') {
				ctx.fillStyle = '#1a1208';
				for (let k = 0; k < 3; k++) {
					const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
					ctx.beginPath();
					ctx.moveTo(x + Math.cos(a - 0.5) * rad * 0.24, y + Math.sin(a - 0.5) * rad * 0.24);
					ctx.arc(x, y, rad * 0.78, a - 0.5, a + 0.5);
					ctx.arc(x, y, rad * 0.24, a + 0.5, a - 0.5, true);
					ctx.closePath();
					ctx.fill();
				}
				blob(x, y, rad * 0.14, '#1a1208', 0);
			} else if (kind === 'insta') {
				ctx.fillStyle = '#f4f0ff';
				ctx.beginPath();
				ctx.arc(x, y - rad * 0.12, rad * 0.5, 0, Math.PI * 2);
				ctx.fill();
				rr(ctx, x - rad * 0.3, y + rad * 0.1, rad * 0.6, rad * 0.42, 2);
				ctx.fill();
				ctx.fillStyle = '#2a1050';
				for (const sx of [-1, 1]) {
					ctx.beginPath();
					ctx.arc(x + sx * rad * 0.2, y - rad * 0.12, rad * 0.14, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.fillRect(x - rad * 0.04, y + rad * 0.12, rad * 0.08, rad * 0.3);
			} else {
				ctx.font = `900 ${rad * 1.05}px ${FONT}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.lineWidth = 3;
				ctx.strokeStyle = '#7a3a00';
				ctx.strokeText('×2', x, y + 1);
				ctx.fillStyle = '#fffbe0';
				ctx.fillText('×2', x, y + 1);
			}
			ctx.fillStyle = 'rgba(255,255,255,0.45)';
			ctx.beginPath();
			ctx.ellipse(x - rad * 0.35, y - rad * 0.5, rad * 0.35, rad * 0.16, -0.5, 0, Math.PI * 2);
			ctx.fill();
		}

		// ---------------------------------------------------------------- drawing: HUD bits
		function text(str: string, x: number, y: number, size: number, color: string | CanvasGradient, align: CanvasTextAlign = 'center', outline = 5) {
			ctx.font = `700 ${size}px ${FONT}`;
			ctx.textAlign = align;
			ctx.textBaseline = 'middle';
			ctx.lineJoin = 'round';
			ctx.strokeStyle = O;
			ctx.lineWidth = outline;
			ctx.strokeText(str, x, y);
			ctx.fillStyle = color;
			ctx.fillText(str, x, y);
		}
		function heart(x: number, y: number, sz: number, full: boolean) {
			ctx.save();
			ctx.translate(x, y);
			ctx.scale(sz, sz);
			ctx.beginPath();
			ctx.moveTo(0, 0.95);
			ctx.bezierCurveTo(-0.5, 0.55, -1.05, 0.2, -1.0, -0.25);
			ctx.bezierCurveTo(-0.95, -0.85, -0.25, -1.0, 0, -0.5);
			ctx.bezierCurveTo(0.25, -1.0, 0.95, -0.85, 1.0, -0.25);
			ctx.bezierCurveTo(1.05, 0.2, 0.5, 0.55, 0, 0.95);
			ctx.closePath();
			ctx.restore();
			if (full) {
				const g = ctx.createRadialGradient(x - sz * 0.35, y - sz * 0.4, 1, x, y, sz * 1.2);
				g.addColorStop(0, '#ff9aa8');
				g.addColorStop(0.5, '#ff2f4f');
				g.addColorStop(1, '#a8001c');
				ctx.fillStyle = g;
			} else ctx.fillStyle = 'rgba(30,14,24,0.85)';
			ctx.fill();
			ctx.lineWidth = 3;
			ctx.strokeStyle = O;
			ctx.stroke();
			if (full) {
				ctx.fillStyle = 'rgba(255,255,255,0.6)';
				ctx.beginPath();
				ctx.ellipse(x - sz * 0.45, y - sz * 0.35, sz * 0.22, sz * 0.13, -0.6, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		function chalkStroke(x1: number, y1: number, x2: number, y2: number, w: number, seedK: number, grow = 1) {
			const ex = x1 + (x2 - x1) * grow;
			const ey = y1 + (y2 - y1) * grow;
			ctx.lineCap = 'round';
			ctx.strokeStyle = 'rgba(120,8,16,0.55)';
			ctx.lineWidth = w;
			ctx.beginPath();
			ctx.moveTo(x1 + 3, y1 + 4);
			ctx.lineTo(ex + 3, ey + 4);
			ctx.stroke();
			ctx.strokeStyle = chalk;
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.quadraticCurveTo((x1 + ex) / 2 + jit(seedK, 1) * w * 0.8, (y1 + ey) / 2 + jit(seedK, 2) * w * 0.4, ex, ey);
			ctx.stroke();
			ctx.globalAlpha *= 0.6;
			ctx.lineWidth = w * 0.55;
			ctx.beginPath();
			ctx.moveTo(x1 + jit(seedK, 3) * 3, y1 + 2);
			ctx.lineTo(ex + jit(seedK, 4) * 3, ey - 2);
			ctx.stroke();
			ctx.globalAlpha /= 0.6;
		}
		/** The round in chalk: tally marks up to 15, a chalk number after that. */
		function roundMark(x: number, cy: number, size: number, n: number, align: 'left' | 'center', grow: number) {
			ctx.save();
			if (n <= 15) {
				const gw = size * 0.92;
				const gap = size * 0.42;
				const groups = Math.ceil(n / 5);
				const total = groups * gw + (groups - 1) * gap;
				const x0 = align === 'center' ? x - total / 2 : x;
				const w = Math.max(3, size * 0.11);
				for (let i = 0; i < n; i++) {
					const g = Math.floor(i / 5);
					const k = i % 5;
					const gx = x0 + g * (gw + gap);
					const gr = i === n - 1 ? grow : 1;
					if (gr <= 0) continue;
					if (k < 4) {
						const sx = gx + (k * gw) / 3.3 + jit(i, 5) * size * 0.05;
						chalkStroke(sx, cy - size / 2 + jit(i, 6) * size * 0.06, sx + jit(i, 7) * size * 0.08, cy + size / 2, w, i, gr);
					} else chalkStroke(gx - gw * 0.12, cy + size * 0.3, gx + gw * 1.02, cy - size * 0.26, w, i, gr);
				}
			} else {
				const str = String(n);
				ctx.font = `900 ${size * 1.2}px ${FONT}`;
				ctx.textAlign = align;
				ctx.textBaseline = 'middle';
				ctx.globalAlpha *= Math.min(1, grow * 1.5);
				ctx.fillStyle = 'rgba(120,8,16,0.6)';
				ctx.fillText(str, x + 4, cy + 5);
				ctx.fillStyle = chalk;
				ctx.fillText(str, x, cy);
				ctx.globalAlpha *= 0.5;
				ctx.fillText(str, x + 1.5, cy - 1.5);
			}
			ctx.restore();
		}

		// ---------------------------------------------------------------- draw
		function draw() {
			const T = clock;
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			ctx.save();
			if (shake > 0 && !reduce) ctx.translate((deco() - 0.5) * 14 * shake, (deco() - 0.5) * 14 * shake);
			if (bg) ctx.drawImage(bg, 0, 0, W, H);
			// the sign's flicker + the door
			const buzz = Math.sin(T * 2.1) * Math.sin(T * 5.3 + 1.7) * Math.sin(T * 0.7 + 0.4);
			const on = buzz > 0.5 ? (Math.sin(T * 60) > 0 ? 0.15 : 0.9) : 1;
			neonTubes(ctx, on, true);
			if (doorGlow > 0) {
				ctx.fillStyle = `rgba(255,240,200,${doorGlow * 0.6})`;
				ctx.fillRect(DOOR.x - 36, 50, 72, TOP - 54);
			}
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			const ng = ctx.createRadialGradient(370, TOP, 10, 370, TOP, 300);
			ng.addColorStop(0, `rgba(255,60,170,${0.2 * on})`);
			ng.addColorStop(1, 'rgba(255,60,170,0)');
			ctx.fillStyle = ng;
			ctx.fillRect(0, 0, W, TOP + 300);
			ctx.restore();
			if (decals) ctx.drawImage(decals, 0, 0, W, H);
			if (coverLayer) ctx.drawImage(coverLayer, 0, 0, W, H);
			// power-ups on the ground
			for (const p of powers) {
				const blink = p.t > POWER_LIFE - 3 && Math.sin(p.t * 20) < 0;
				if (!blink) drawToken(p.kind, p.x, p.y + Math.sin(p.t * 4) * 3, 15, T);
			}
			// shadows
			ctx.fillStyle = 'rgba(0,0,0,0.35)';
			for (const z of zs) {
				ctx.beginPath();
				ctx.ellipse(z.x + 3, z.y + 5, z.r * 1.15, z.r * 0.9, 0, 0, Math.PI * 2);
				ctx.fill();
			}
			if (state !== 'dead' || stateT < 0.9) {
				ctx.beginPath();
				ctx.ellipse(P.x + 3, P.y + 5, PLAYER_RADIUS * 1.2, PLAYER_RADIUS * 0.95, 0, 0, Math.PI * 2);
				ctx.fill();
			}
			for (const z of zs) if (z.kind !== 'brute') drawZombie(z);
			for (const z of zs) if (z.kind === 'brute') drawZombie(z);
			const blinkOff = state !== 'dead' && P.inv > 0 && Math.sin(P.inv * 30) < 0;
			if (!blinkOff) drawPlayer(T);
			// Brute health bars
			for (const z of zs) {
				if (z.kind !== 'brute') continue;
				const bw = 66;
				const bx = z.x - bw / 2;
				const by = z.y - z.r - 22;
				rr(ctx, bx - 2, by - 2, bw + 4, 11, 5);
				ctx.fillStyle = O;
				ctx.fill();
				const hg = ctx.createLinearGradient(0, by, 0, by + 7);
				hg.addColorStop(0, '#ff8a6a');
				hg.addColorStop(1, '#c81e1e');
				ctx.fillStyle = 'rgba(255,255,255,0.25)';
				ctx.fillRect(bx, by, bw * z.bar, 7);
				ctx.fillStyle = hg;
				ctx.fillRect(bx, by, Math.max(0, bw * (z.hp / z.max)), 7);
			}
			// bullets
			ctx.save();
			ctx.globalCompositeOperation = 'lighter';
			ctx.lineCap = 'round';
			for (const b of bullets) {
				const sp = Math.hypot(b.vx, b.vy) || 1;
				const len = Math.min(26, Math.hypot(b.x - b.ox, b.y - b.oy));
				const tx = b.x - (b.vx / sp) * len;
				const ty = b.y - (b.vy / sp) * len;
				ctx.strokeStyle = 'rgba(255,190,80,0.35)';
				ctx.lineWidth = 6;
				ctx.beginPath();
				ctx.moveTo(tx, ty);
				ctx.lineTo(b.x, b.y);
				ctx.stroke();
				ctx.strokeStyle = insta() ? '#ff9adf' : '#fff6c8';
				ctx.lineWidth = 2.2;
				ctx.stroke();
			}
			ctx.restore();
			// particles
			for (const p of parts) {
				const k = p.life / p.max;
				if (p.kind === 'goo') {
					ctx.fillStyle = '#86d84a';
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size * Math.sqrt(k), 0, Math.PI * 2);
					ctx.fill();
				} else if (p.kind === 'smoke' || p.kind === 'dust') {
					ctx.fillStyle = `${p.color}${(0.55 * k).toFixed(3)})`;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.kind === 'smoke' ? p.size * (1 + (1 - k) * 1.4) : p.size, 0, Math.PI * 2);
					ctx.fill();
				} else if (p.kind === 'spark') {
					ctx.strokeStyle = `rgba(255,214,110,${k})`;
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.moveTo(p.x, p.y);
					ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
					ctx.stroke();
				} else if (p.kind === 'casing') {
					ctx.save();
					ctx.translate(p.x, p.y);
					ctx.rotate(p.rot);
					ctx.fillStyle = '#e8b840';
					ctx.fillRect(-3, -1.3, 6, 2.6);
					ctx.restore();
				} else if (p.kind === 'ring') {
					ctx.strokeStyle = `rgba(200,255,150,${k * 0.7})`;
					ctx.lineWidth = 3 * k + 0.5;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size * (1 - k * 0.8), 0, Math.PI * 2);
					ctx.stroke();
				} else if (p.kind === 'star') {
					// a flying chef hat
					ctx.save();
					ctx.globalAlpha = Math.min(1, k * 1.5);
					ctx.translate(p.x, p.y);
					ctx.rotate(p.rot * 0.3);
					drawChefHat(0, 0, 9, false);
					ctx.restore();
				}
			}
			// hitmarkers
			ctx.lineCap = 'round';
			for (const m of marks) {
				const k = m.life / 0.16;
				ctx.globalAlpha = k;
				ctx.beginPath();
				for (const [sx, sy] of [
					[-1, -1],
					[1, -1],
					[-1, 1],
					[1, 1]
				]) {
					ctx.moveTo(m.x + sx * 3, m.y + sy * 3);
					ctx.lineTo(m.x + sx * 8, m.y + sy * 8);
				}
				ctx.strokeStyle = O;
				ctx.lineWidth = 4.5;
				ctx.stroke();
				ctx.strokeStyle = m.insta ? '#ff4a5a' : '#ffffff';
				ctx.lineWidth = 2;
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.restore();
			// night: darker away from the player
			const vg = ctx.createRadialGradient(P.x, P.y, 110, P.x, P.y, 640);
			vg.addColorStop(0, 'rgba(6,3,14,0)');
			vg.addColorStop(1, 'rgba(6,3,14,0.6)');
			ctx.fillStyle = vg;
			ctx.fillRect(0, 0, W, H);
			if (insta()) {
				ctx.fillStyle = `rgba(120,40,200,${0.08 + 0.04 * Math.sin(T * 8)})`;
				ctx.fillRect(0, 0, W, H);
			}
			// floating scores + big words
			for (const f of floats) {
				const age = f.max - f.life;
				const pop = age < 0.12 ? 1.35 - (age / 0.12) * 0.35 : 1;
				ctx.globalAlpha = Math.min(1, f.life / (f.max * 0.4));
				text(f.text, f.x, f.y, f.size * pop * (f.size > 26 ? hud : 1), f.color, 'center', f.size > 26 ? 7 : 5);
			}
			ctx.globalAlpha = 1;
			drawHud(T);
			if (state === 'banner') drawBanner();
			if (nukeFlash > 0) {
				ctx.fillStyle = `rgba(255,255,245,${Math.min(1, nukeFlash * 1.1)})`;
				ctx.fillRect(0, 0, W, H);
			}
			if (hurtFlash > 0 || state === 'dead') {
				const a = state === 'dead' ? Math.min(0.6, stateT * 0.8) : hurtFlash / 0.45;
				const hg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 520);
				hg.addColorStop(0, 'rgba(200,0,20,0)');
				hg.addColorStop(1, `rgba(200,0,20,${0.55 * a})`);
				ctx.fillStyle = hg;
				ctx.fillRect(0, 0, W, H);
			}
			if (state === 'dead' && stateT > 0.15) text(s.down, W / 2, H / 2 - 20, 52 * hud, '#ff5a5a', 'center', 8);
			if (joy) {
				const dx = joy.x - joy.bx;
				const dy = joy.y - joy.by;
				const d = Math.hypot(dx, dy) || 1;
				const k = Math.min(1, JOY_R / d);
				ctx.fillStyle = 'rgba(10,8,20,0.35)';
				ctx.beginPath();
				ctx.arc(joy.bx, joy.by, JOY_R, 0, Math.PI * 2);
				ctx.fill();
				ctx.lineWidth = 3;
				ctx.strokeStyle = 'rgba(255,255,255,0.35)';
				ctx.stroke();
				const kg = ctx.createRadialGradient(joy.bx + dx * k - 8, joy.by + dy * k - 8, 2, joy.bx + dx * k, joy.by + dy * k, 28);
				kg.addColorStop(0, '#ffffff');
				kg.addColorStop(1, '#9aa4b8');
				blob(joy.bx + dx * k, joy.by + dy * k, 26, kg, 3);
			}
		}
		function drawHud(T: number) {
			const u = hud;
			// hearts
			for (let i = 0; i < PLAYER_HEARTS; i++) {
				const pop = i === heartPop && heartPopT > 0 ? 1 + Math.sin((heartPopT / 0.6) * Math.PI) * 0.45 : 1;
				heart(30 * u + i * 38 * u, 30 * u, 14 * u * pop, i < P.hearts);
			}
			// score
			const sc = Math.round(score).toLocaleString('en-US');
			text(sc, W - 18, 30 * u, 32 * u, dbl() ? '#ffd23a' : '#ffffff', 'right', 6);
			if (dbl()) {
				ctx.font = `700 ${32 * u}px ${FONT}`;
				const w = ctx.measureText(sc).width;
				text('×2', W - 30 - w - 14 * u, 30 * u, 22 * u, '#ffd23a', 'right', 5);
			}
			// active power-ups with a countdown ring
			let px = W - 30 * u;
			for (const [kind, until] of [
				['double', doubleUntil],
				['insta', instaUntil]
			] as [PowerKind, number][]) {
				if (clock >= until) continue;
				const left = until - clock;
				const py = 72 * u;
				drawToken(kind, px, py, 13 * u, T);
				ctx.strokeStyle = '#ffffff';
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(px, py, 18 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / POWER_TIME));
				ctx.stroke();
				px -= 46 * u;
			}
			// round mark + what's left, bottom left
			const leftN = plan.spawns.length - spawnIdx + zs.length;
			if (state !== 'banner') {
				roundMark(18, H - 34 * u, 34 * u, round, 'left', 1);
				if (state === 'fight') text(s.left(leftN), 18, H - 66 * u, 14 * u, '#cfe8b0', 'left', 4);
			}
			// ammo, bottom right
			const ax = W - 18;
			const ay = H - 26 * u;
			const reloading = P.reload > 0;
			const shown = reloading ? Math.floor(MAG * (1 - P.reload / RELOAD_TIME)) : P.mag;
			text(String(P.mag), ax - 44 * u, ay, 34 * u, P.mag <= 6 && !reloading ? '#ff6a5a' : '#ffffff', 'right', 6);
			text(`/${MAG}`, ax, ay + 4 * u, 18 * u, '#c8c0b0', 'right', 4);
			const bw = 4 * u;
			const gap = 2 * u;
			for (let i = 0; i < MAG; i++) {
				const col = i % 15;
				const row = Math.floor(i / 15);
				const x = ax - (15 - col) * (bw + gap);
				const y = ay - 50 * u + row * 13 * u;
				ctx.fillStyle = i < shown ? (reloading ? '#ffd23a' : '#e8b840') : 'rgba(40,30,30,0.85)';
				ctx.fillRect(x, y, bw, 10 * u);
				if (i < shown) {
					ctx.fillStyle = '#b5651d';
					ctx.fillRect(x, y, bw, 3 * u);
				}
			}
			if (reloading && Math.sin(T * 14) > -0.4) text(s.reloading, ax, ay - 68 * u, 16 * u, '#ffd23a', 'right', 4);
			else if (!reloading && P.mag < 10 && mode !== 'touch') text(`${s.reloadKey} ⟳`, ax, ay - 68 * u, 15 * u, '#ffd23a', 'right', 4);
			// a hint at the start
			if (round === 1 && clock < 6.5) {
				const a = Math.min(1, (6.5 - clock) / 0.6, clock / 0.4);
				const hint = mode === 'touch' ? s.hintTouch : mode === 'mouse' ? s.hintMouse : s.hintKeys;
				ctx.globalAlpha = a;
				ctx.font = `700 ${17 * u}px ${FONT}`;
				const w = Math.min(W - 40, ctx.measureText(hint).width + 36 * u);
				rr(ctx, W / 2 - w / 2, H - 150 * u, w, 34 * u, 17 * u);
				ctx.fillStyle = 'rgba(12,6,20,0.78)';
				ctx.fill();
				ctx.lineWidth = 2;
				ctx.strokeStyle = 'rgba(255,210,80,0.7)';
				ctx.stroke();
				text(hint, W / 2, H - 133 * u, 17 * u, '#fff3d0', 'center', 3);
				ctx.globalAlpha = 1;
				if (mode === 'touch' && !joy) {
					ctx.globalAlpha = a * 0.6;
					ctx.lineWidth = 3;
					ctx.strokeStyle = 'rgba(255,255,255,0.6)';
					ctx.beginPath();
					ctx.arc(110, H - 230, JOY_R, 0, Math.PI * 2);
					ctx.stroke();
					blob(110 + Math.sin(T * 3) * 24, H - 230 + Math.cos(T * 2.3) * 14, 24, 'rgba(255,255,255,0.5)', 0);
					ctx.globalAlpha = 1;
				}
			}
		}
		function drawBanner() {
			const t = stateT;
			const a = Math.min(1, t / 0.3, (BANNER - t) / 0.4);
			if (a <= 0) return;
			ctx.save();
			ctx.globalAlpha = a;
			const sm = ctx.createRadialGradient(W / 2, 320, 20, W / 2, 320, 300);
			sm.addColorStop(0, 'rgba(6,3,12,0.7)');
			sm.addColorStop(1, 'rgba(6,3,12,0)');
			ctx.fillStyle = sm;
			ctx.fillRect(0, 0, W, H);
			ctx.font = `900 ${38 * hud}px ${FONT}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'rgba(120,8,16,0.6)';
			ctx.fillText(s.round, W / 2 + 3, 232 + 4);
			ctx.fillStyle = chalk;
			ctx.fillText(s.round, W / 2, 232);
			const grow = round === 1 ? Math.min(1, Math.max(0, (t - 0.35) / 0.4)) : Math.min(1, Math.max(0, (t - 0.45) / 0.35));
			roundMark(W / 2, 330, 120, round, 'center', grow);
			if (isBruteRound(round) && t > 0.6) {
				const pulse = 1 + 0.06 * Math.sin(t * 10);
				text(s.bruteIncoming, W / 2, 430, 30 * hud * pulse, '#ff5a3a', 'center', 6);
			}
			ctx.restore();
		}

		// ---------------------------------------------------------------- loop + input
		function frame(now: number) {
			raf = requestAnimationFrame(frame);
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			if (!isPaused && !ended) {
				clock += dt;
				step(dt);
			}
			if (!ended) draw();
		}
		function pause() {
			if (ended || isPaused) return;
			isPaused = true;
			paused = true;
			keys.clear();
			firing = false;
			spaceFire = false;
			joy = null;
		}
		function resume() {
			if (!isPaused) return;
			isPaused = false;
			paused = false;
			last = performance.now();
		}
		const toWorld = (e: PointerEvent) => {
			const b = cv.getBoundingClientRect();
			return { x: ((e.clientX - b.left) / (b.width || 1)) * W, y: ((e.clientY - b.top) / (b.height || 1)) * H };
		};
		function onResumeCapture(e: Event) {
			if (!isPaused) return;
			e.preventDefault();
			e.stopPropagation();
			resume();
		}
		function onDown(e: PointerEvent) {
			if (ended) return;
			el.focus({ preventScroll: true });
			const p = toWorld(e);
			if (e.pointerType === 'mouse') {
				mode = 'mouse';
				mouse.x = p.x;
				mouse.y = p.y;
				if (e.button === 0) firing = true;
			} else {
				mode = 'touch';
				if (!joy) joy = { id: e.pointerId, bx: clamp(p.x, JOY_R + 6, W - JOY_R - 6), by: clamp(p.y, TOP + JOY_R, H - JOY_R - 6), x: p.x, y: p.y };
			}
			try {
				cv.setPointerCapture(e.pointerId);
			} catch {
				/* synthetic events have no capturable pointer */
			}
			e.preventDefault();
		}
		function onMove(e: PointerEvent) {
			const p = toWorld(e);
			if (e.pointerType === 'mouse') {
				mode = 'mouse';
				mouse.x = p.x;
				mouse.y = p.y;
			} else if (joy && joy.id === e.pointerId) {
				joy.x = p.x;
				joy.y = p.y;
			}
		}
		function onUp(e: PointerEvent) {
			if (e.pointerType === 'mouse') firing = false;
			else if (joy && joy.id === e.pointerId) joy = null;
		}
		const KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
		function onKey(e: KeyboardEvent) {
			if (ended) return;
			if (isPaused) {
				if (e.type === 'keydown') {
					resume();
					e.preventDefault();
				}
				return;
			}
			const k = e.key.toLowerCase();
			const downK = e.type === 'keydown';
			if (KEYS.has(k)) {
				if (downK) keys.add(k);
				else keys.delete(k);
				e.preventDefault();
			} else if (k === ' ' || e.code === 'Space') {
				spaceFire = downK;
				e.preventDefault();
			} else if (k === 'r' && downK) startReload();
		}
		function onBlur() {
			keys.clear();
			firing = false;
			spaceFire = false;
		}
		function onVis() {
			if (document.hidden) pause();
		}

		const ro = new ResizeObserver(() => resize());
		ro.observe(el);
		resize();
		el.addEventListener('pointerdown', onResumeCapture, true);
		cv.addEventListener('pointerdown', onDown);
		cv.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
		el.addEventListener('keydown', onKey);
		el.addEventListener('keyup', onKey);
		window.addEventListener('blur', onBlur);
		document.addEventListener('visibilitychange', onVis);
		const noMenu = (e: Event) => e.preventDefault();
		cv.addEventListener('contextmenu', noMenu);
		el.focus({ preventScroll: true });
		startBanner(1);
		last = performance.now();
		raf = requestAnimationFrame(frame);
		if (document.hidden) pause();

		return () => {
			ended = true;
			cancelAnimationFrame(raf);
			ro.disconnect();
			el.removeEventListener('pointerdown', onResumeCapture, true);
			cv.removeEventListener('pointerdown', onDown);
			cv.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			el.removeEventListener('keydown', onKey);
			el.removeEventListener('keyup', onKey);
			window.removeEventListener('blur', onBlur);
			document.removeEventListener('visibilitychange', onVis);
			cv.removeEventListener('contextmenu', noMenu);
		};
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div bind:this={root} class="zr" tabindex="0" role="application" aria-label={s.label}>
	<canvas bind:this={canvas} class="zr-cv"></canvas>
	{#if paused}
		<div class="zr-pause"><span>{s.paused}</span></div>
	{/if}
</div>

<style>
	.zr {
		position: relative;
		width: min(100%, min(72vh, 640px));
		aspect-ratio: 1;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #0b0710;
		outline: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
		box-shadow:
			0 0 0 2px #1a0630,
			0 10px 30px rgb(0 0 0 / 0.5);
	}
	.zr:focus-visible {
		box-shadow:
			0 0 0 3px #ffc928,
			0 10px 30px rgb(0 0 0 / 0.5);
	}
	.zr::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.1) 0 1px, transparent 1px 3px);
		box-shadow:
			inset 0 0 0 3px rgb(0 0 0 / 0.6),
			inset 0 0 50px rgb(0 0 0 / 0.55);
	}
	.zr-cv {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
		cursor: crosshair;
	}
	.zr-pause {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: grid;
		place-items: center;
		background: rgb(8 4 14 / 0.62);
		cursor: pointer;
	}
	.zr-pause span {
		padding: 12px 22px;
		border-radius: 999px;
		background: #140a1e;
		border: 2px solid #ffc928;
		color: #fff3d0;
		font: 700 clamp(15px, 3.4vw, 20px) / 1.2 Bahnschrift, 'Segoe UI', sans-serif;
		text-shadow: 0 2px 0 #000;
	}
</style>
