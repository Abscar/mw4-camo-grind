<!--
	Callout Typer (BurgiArcade, 2026-11-22). A tactical map screen (dark blue-green grid, our own made-up town
	in faint outlines, a radar light sweeping from the gun at the bottom): enemy markers drift down towards the
	defence line, each with a tag naming a callout. Type a callout to shoot it: the gun turns, every right
	letter pings the marker, the last one sends a tracer and pops it. Three callouts reaching the line break it
	and the run is over. Score = 10 per correct letter × the combo (one step per two clean callouts in a row,
	max ×8); the HUD shows WPM and accuracy. Plan, matching and scoring: src/lib/arcade/typer.ts; the callout
	words: src/lib/i18n/arcade/typer.ts.
	Typing goes into a real <input> styled as the terminal line under the map, so phone keyboards open (a tap
	anywhere on the game focuses it); the box is 4:3 + that line, short enough to stay usable with a phone
	keyboard open. Canvas: logical 800 × 600, scaled to the box (devicePixelRatio ≤ 2), the map drawn once.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import * as T from '#lib/arcade/typer.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import s from '#lib/i18n/arcade/typer.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let input: HTMLInputElement;
	let paused = $state(false);
	let focused = $state(false);
	let empty = $state(true);
	let bad = $state(false);
	let liveWords = $state<string[]>([]);
	let resume = () => {};
	let focusInput = () => {};

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		const { W, H, LINE_Y } = T;
		const O = '#06080c';
		const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
		const TAU = Math.PI * 2;
		const TEAL = '#2fd0b8';
		const LIME = '#8dff5a';
		const plan = T.makePlan(seed, s.callouts);
		const GUN = { x: 400, y: 566 };

		// ---------------------------------------------------------------- state
		interface Live {
			sp: T.Spawn;
			die: number; // game time it was shot / broke through (−1 = alive)
			breach: boolean;
			shake: number; // game time of the last wrong letter on it
			pts: number; // points this callout has given
			ping: number; // game time of the last right letter
		}
		let time = 0;
		let next = 0;
		let live: Live[] = [];
		let st: T.TypeState = T.EMPTY;
		let score = 0;
		let shown = 0;
		let streak = 0;
		let ok = 0;
		let wrong = 0;
		let lives = T.LIVES;
		let lostAt = [-9, -9, -9];
		let ended = false;
		let endAt = -1;
		let shake = 0;
		let lineFlash = -9;
		let comboPop = -9;
		let gunAngle = -Math.PI / 2;
		let gunAim = -Math.PI / 2;
		let recoil = 0;
		type Tracer = { x: number; y: number; t: number; big: boolean };
		let tracers: Tracer[] = [];
		interface P {
			x: number;
			y: number;
			vx: number;
			vy: number;
			life: number;
			max: number;
			size: number;
			color: string;
			k: 'spark' | 'shard' | 'ring' | 'smoke';
			rot: number;
		}
		let parts: P[] = [];
		const floaters: { text: string; x: number; y: number; t: number; color: string; size: number }[] = [];
		let missFlash = -9;
		let narrow = false;

		const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
		const ease = (v: number) => 1 - Math.pow(1 - clamp(v, 0, 1), 3);
		const alive = () => live.filter((l) => l.die < 0);
		const onScreen = (): T.OnScreen[] => alive().map((l) => ({ id: l.sp.i, key: l.sp.key, y: T.posAt(l.sp, time).y }));
		const byId = (id: number | null) => (id === null ? undefined : live.find((l) => l.sp.i === id && l.die < 0));
		const lots = (n: number) => (reduce ? Math.ceil(n / 2) : n);
		let seedFx = seed >>> 0;
		const fx = () => {
			seedFx = (seedFx + 0x6d2b79f5) >>> 0;
			let t = seedFx;
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};

		// ---------------------------------------------------------------- drawing helpers
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

		// ---------------------------------------------------------------- the map (drawn once per size)
		let map: HTMLCanvasElement | null = null;
		let scale = 1;
		function drawMap(c: CanvasRenderingContext2D) {
			c.fillStyle = rad(c, 400, 280, 40, 560, [
				[0, '#0d4446'],
				[0.55, '#072a30'],
				[1, '#020e13']
			]);
			c.fillRect(0, 0, W, H);
			// the river with a bridge, roads, blocks
			c.beginPath();
			c.moveTo(560, 0);
			c.bezierCurveTo(600, 140, 520, 260, 640, 360);
			c.bezierCurveTo(700, 410, 690, 470, 720, 600);
			c.lineTo(770, 600);
			c.bezierCurveTo(740, 470, 750, 400, 690, 350);
			c.bezierCurveTo(580, 250, 650, 140, 612, 0);
			c.closePath();
			c.fillStyle = 'rgba(20,90,120,0.32)';
			c.fill();
			c.lineWidth = 2;
			c.strokeStyle = 'rgba(80,190,210,0.35)';
			c.stroke();
			const road = (pts: [number, number][], w: number) => {
				c.beginPath();
				pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
				c.lineCap = 'round';
				c.lineJoin = 'round';
				c.lineWidth = w + 4;
				c.strokeStyle = 'rgba(60,170,160,0.28)';
				c.stroke();
				c.lineWidth = w;
				c.strokeStyle = 'rgba(6,30,34,0.9)';
				c.stroke();
				c.setLineDash([10, 12]);
				c.lineWidth = 1.6;
				c.strokeStyle = 'rgba(120,220,200,0.28)';
				c.stroke();
				c.setLineDash([]);
			};
			road(
				[
					[-10, 292],
					[300, 300],
					[520, 286],
					[820, 296]
				],
				22
			);
			road(
				[
					[250, 40],
					[246, 300],
					[262, 610]
				],
				18
			);
			road(
				[
					[300, 300],
					[420, 420],
					[470, 610]
				],
				14
			);
			// the bridge over the river
			c.fillStyle = 'rgba(140,230,210,0.22)';
			c.fillRect(600, 278, 70, 26);
			c.strokeStyle = 'rgba(140,230,210,0.55)';
			c.lineWidth = 2;
			c.strokeRect(600, 278, 70, 26);
			const blocks: [number, number, number, number][] = [
				[40, 80, 120, 70],
				[60, 170, 80, 60],
				[150, 170, 70, 90],
				[290, 70, 100, 70],
				[410, 90, 70, 100],
				[300, 160, 90, 100],
				[420, 210, 90, 50],
				[40, 330, 110, 80],
				[60, 430, 140, 50],
				[290, 330, 80, 60],
				[490, 330, 90, 70],
				[330, 440, 70, 50],
				[520, 430, 110, 60],
				[680, 90, 90, 80],
				[700, 200, 70, 60],
				[760, 330, 40, 120]
			];
			for (const [x, y, w, h] of blocks) {
				c.fillStyle = 'rgba(10,60,62,0.75)';
				c.fillRect(x, y, w, h);
				c.save();
				c.beginPath();
				c.rect(x, y, w, h);
				c.clip();
				c.strokeStyle = 'rgba(60,180,160,0.14)';
				c.lineWidth = 1;
				for (let k = -h; k < w; k += 9) {
					c.beginPath();
					c.moveTo(x + k, y + h);
					c.lineTo(x + k + h, y);
					c.stroke();
				}
				c.restore();
				c.lineWidth = 2;
				c.strokeStyle = 'rgba(70,210,180,0.5)';
				c.strokeRect(x, y, w, h);
			}
			// grid
			for (let x = 0; x <= W; x += 25) {
				c.fillStyle = x % 100 === 0 ? 'rgba(80,220,200,0.16)' : 'rgba(80,220,200,0.06)';
				c.fillRect(x, 0, x % 100 === 0 ? 1.4 : 1, H);
			}
			for (let y = 0; y <= H; y += 25) {
				c.fillStyle = y % 100 === 0 ? 'rgba(80,220,200,0.16)' : 'rgba(80,220,200,0.06)';
				c.fillRect(0, y, W, y % 100 === 0 ? 1.4 : 1);
			}
			c.font = `700 11px ${FONT}`;
			c.fillStyle = 'rgba(120,230,210,0.45)';
			c.textAlign = 'left';
			c.textBaseline = 'top';
			'ABCDEFGH'.split('').forEach((l, i) => c.fillText(l, i * 100 + 5, 60));
			for (let i = 1; i < 6; i++) c.fillText(String(i), 5, i * 100 + 4);
			// place names
			const labels: [string, number, number][] = [
				[s.mapLabels[0], 345, 196],
				[s.mapLabels[1], 95, 362],
				[s.mapLabels[2], 300, 470],
				[s.mapLabels[3], 636, 266],
				[s.mapLabels[4], 340, 100],
				[s.mapLabels[5], 575, 456],
				[s.mapLabels[6], 185, 212]
			];
			c.font = `800 13px ${FONT}`;
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.fillStyle = 'rgba(140,240,215,0.42)';
			for (const [l, x, y] of labels) c.fillText(l, x, y);
			// compass
			c.save();
			c.translate(752, 104);
			c.strokeStyle = 'rgba(140,240,215,0.5)';
			c.lineWidth = 1.6;
			c.beginPath();
			c.arc(0, 0, 18, 0, TAU);
			c.stroke();
			c.beginPath();
			c.moveTo(0, -24);
			c.lineTo(5, 0);
			c.lineTo(0, 24);
			c.lineTo(-5, 0);
			c.closePath();
			c.fillStyle = 'rgba(140,240,215,0.45)';
			c.fill();
			c.fillStyle = 'rgba(255,120,90,0.8)';
			c.beginPath();
			c.moveTo(0, -24);
			c.lineTo(5, 0);
			c.lineTo(-5, 0);
			c.closePath();
			c.fill();
			c.font = `800 11px ${FONT}`;
			c.fillStyle = 'rgba(200,255,240,0.7)';
			c.fillText('N', 0, -32);
			c.restore();
			// the defence zone under the line: hazard edge, sandbags, the gun's pit
			c.fillStyle = lin(c, 0, LINE_Y, 0, H, [
				[0, 'rgba(30,8,14,0.55)'],
				[1, 'rgba(6,2,6,0.92)']
			]);
			c.fillRect(0, LINE_Y, W, H - LINE_Y);
			c.save();
			c.beginPath();
			c.rect(0, LINE_Y + 4, W, 9);
			c.clip();
			for (let x = -20; x < W + 20; x += 22) {
				c.beginPath();
				c.moveTo(x, LINE_Y + 13);
				c.lineTo(x + 11, LINE_Y + 13);
				c.lineTo(x + 20, LINE_Y + 4);
				c.lineTo(x + 9, LINE_Y + 4);
				c.closePath();
				c.fillStyle = 'rgba(255,200,40,0.55)';
				c.fill();
			}
			c.restore();
			for (let row = 0; row < 2; row++) {
				for (let x = -10 + row * 22; x < W + 20; x += 44) {
					const y = H - 34 + row * -20;
					if (Math.abs(x + 20 - GUN.x) < 70 && row === 1) continue;
					c.beginPath();
					c.roundRect(x, y, 44, 26, [13, 13, 10, 10]);
					paint(c, lin(c, 0, y, 0, y + 26, [
						[0, '#a8a07a'],
						[0.55, '#6e6a4c'],
						[1, '#3a3826']
					]), 2.4);
					c.beginPath();
					c.moveTo(x + 10, y + 8);
					c.quadraticCurveTo(x + 22, y + 4, x + 34, y + 8);
					c.strokeStyle = 'rgba(240,240,200,0.4)';
					c.lineWidth = 1.6;
					c.stroke();
				}
			}
			c.font = `800 12px ${FONT}`;
			c.textAlign = 'left';
			c.textBaseline = 'middle';
			c.fillStyle = 'rgba(255,200,60,0.8)';
			c.fillText(s.line.toUpperCase(), 10, LINE_Y - 9);
		}

		// ---------------------------------------------------------------- live drawing
		function sweepAngle(t: number) {
			return Math.sin(t * 0.85) * 1.25 - Math.PI / 2;
		}
		function drawSweep(c: CanvasRenderingContext2D) {
			const a = sweepAngle(time);
			const dir = Math.cos(time * 0.85) >= 0 ? 1 : -1;
			const R = 640;
			for (let k = 0; k < 9; k++) {
				const a0 = a - dir * k * 0.045;
				const a1 = a - dir * (k + 1) * 0.045;
				c.beginPath();
				c.moveTo(GUN.x, GUN.y);
				c.arc(GUN.x, GUN.y, R, Math.min(a0, a1), Math.max(a0, a1));
				c.closePath();
				c.fillStyle = `rgba(110,255,220,${0.085 * (1 - k / 9)})`;
				c.fill();
			}
			c.beginPath();
			c.moveTo(GUN.x, GUN.y);
			c.lineTo(GUN.x + Math.cos(a) * R, GUN.y + Math.sin(a) * R);
			c.lineWidth = 2;
			c.strokeStyle = 'rgba(160,255,230,0.35)';
			c.stroke();
		}
		function blipNear(x: number, y: number) {
			const a = Math.atan2(y - GUN.y, x - GUN.x);
			const d = Math.abs(a - sweepAngle(time));
			return d < 0.12 ? 1 - d / 0.12 : 0;
		}

		function drawMarker(c: CanvasRenderingContext2D, x: number, y: number, k: number, locked: boolean, glow: number) {
			c.save();
			c.translate(x, y);
			c.scale(k, k);
			c.beginPath();
			c.arc(0, 0, 26 + glow * 10, 0, TAU);
			c.fillStyle = rad(c, 0, 0, 0, 26 + glow * 10, [
				[0, `rgba(255,70,50,${0.4 + glow * 0.4})`],
				[1, 'rgba(255,40,40,0)']
			]);
			c.fill();
			c.beginPath();
			c.moveTo(0, -16);
			c.lineTo(14, 0);
			c.lineTo(0, 16);
			c.lineTo(-14, 0);
			c.closePath();
			paint(c, lin(c, 0, -16, 0, 16, [
				[0, '#ff9a7a'],
				[0.5, '#ec3a2e'],
				[1, '#9a1018']
			]), 3);
			c.beginPath();
			c.moveTo(-1, -13);
			c.lineTo(-10, -1);
			c.lineTo(-5, -1);
			c.closePath();
			c.fillStyle = 'rgba(255,255,255,0.45)';
			c.fill();
			// a little helmet
			c.beginPath();
			c.arc(0, 2, 6.5, Math.PI, TAU);
			c.closePath();
			c.fillStyle = '#fff3e0';
			c.fill();
			c.fillRect(-8, 1.5, 16, 2.4);
			if (locked) {
				const r = 25 + Math.sin(time * 10) * 2;
				c.rotate(time * 2.2);
				c.strokeStyle = LIME;
				c.lineWidth = 3;
				c.lineCap = 'round';
				for (let q = 0; q < 4; q++) {
					c.rotate(Math.PI / 2);
					c.beginPath();
					c.moveTo(r, -8);
					c.lineTo(r, -r + 10);
					c.stroke();
				}
			}
			c.restore();
		}

		function plateFont() {
			return narrow ? 34 : 28;
		}
		function drawPlate(c: CanvasRenderingContext2D, l: Live, x: number, y: number, locked: boolean, alpha: number, lift: number) {
			const size = plateFont();
			c.font = `800 ${size}px ${FONT}`;
			const word = l.sp.word;
			const typed = locked ? T.shownPart(word, st.buf.length) : 0;
			const wTxt = c.measureText(word).width;
			const pw = wTxt + 26;
			const ph = size + 12;
			const danger = clamp((y - (LINE_Y - 150)) / 150, 0, 1);
			let px = clamp(x, pw / 2 + 6, W - pw / 2 - 6);
			const shaking = time - l.shake < 0.3;
			if (shaking) px += Math.sin(time * 90) * 5 * (1 - (time - l.shake) / 0.3);
			const py = y - 24 - ph / 2 - lift;
			c.save();
			c.globalAlpha = alpha;
			const edge = shaking ? '#ff4a3a' : locked ? LIME : danger > 0 && Math.sin(time * 14) > 0 ? '#ff7a4a' : TEAL;
			if (locked || shaking) {
				c.shadowColor = edge;
				c.shadowBlur = 14;
			}
			c.beginPath();
			c.roundRect(px - pw / 2, py - ph / 2, pw, ph, 10);
			c.moveTo(x - 8, py + ph / 2);
			c.lineTo(x, py + ph / 2 + 9);
			c.lineTo(x + 8, py + ph / 2);
			paint(c, shaking ? 'rgba(80,10,14,0.95)' : 'rgba(4,20,24,0.93)', locked ? 3.6 : 2.6, edge);
			c.shadowBlur = 0;
			c.textAlign = 'left';
			c.textBaseline = 'middle';
			const tx = px - wTxt / 2;
			const ty = py + 1;
			c.lineJoin = 'round';
			c.lineWidth = 5;
			c.strokeStyle = O;
			c.strokeText(word, tx, ty);
			const head = word.slice(0, typed);
			const tail = word.slice(typed);
			const hw = c.measureText(head).width;
			if (head) {
				c.fillStyle = LIME;
				c.shadowColor = LIME;
				c.shadowBlur = 10;
				c.fillText(head, tx, ty);
				c.shadowBlur = 0;
			}
			c.fillStyle = danger > 0.6 ? '#ffd8cc' : '#f4fffb';
			c.fillText(tail, tx + hw, ty);
			c.restore();
		}

		function drawGun(c: CanvasRenderingContext2D) {
			gunAngle += (gunAim - gunAngle) * 0.25;
			const back = recoil * 7;
			c.save();
			c.translate(GUN.x, GUN.y);
			c.rotate(gunAngle);
			c.beginPath();
			c.roundRect(-back + 8, -6, 46, 12, 4);
			paint(c, lin(c, 0, -6, 0, 6, [
				[0, '#c8d2da'],
				[0.5, '#5a6670'],
				[1, '#2a3238']
			]), 2.6);
			c.beginPath();
			c.roundRect(-back + 46, -8, 12, 16, 3);
			paint(c, '#3a444c', 2.4);
			if (recoil > 0.5) {
				c.beginPath();
				for (let k = 0; k < 10; k++) {
					const a = (k / 10) * TAU;
					const r = k % 2 ? 7 : 18 * recoil;
					c.lineTo(64 - back + Math.cos(a) * r, Math.sin(a) * r * 0.7);
				}
				c.closePath();
				c.fillStyle = 'rgba(255,240,150,0.95)';
				c.fill();
			}
			c.restore();
			c.beginPath();
			c.arc(GUN.x, GUN.y, 26, Math.PI, TAU);
			c.closePath();
			paint(c, lin(c, 0, GUN.y - 26, 0, GUN.y, [
				[0, '#e2eaf0'],
				[0.4, '#7a8792'],
				[1, '#2e363c']
			]), 3);
			c.beginPath();
			c.ellipse(GUN.x - 8, GUN.y - 15, 8, 4, -0.4, 0, TAU);
			c.fillStyle = 'rgba(255,255,255,0.55)';
			c.fill();
			c.beginPath();
			c.arc(GUN.x, GUN.y - 8, 4, 0, TAU);
			c.fillStyle = Math.sin(time * 6) > 0 ? '#ff4a3a' : '#7a1a14';
			c.fill();
			c.beginPath();
			c.roundRect(GUN.x - 46, GUN.y - 2, 92, 40, 8);
			paint(c, lin(c, 0, GUN.y, 0, GUN.y + 40, [
				[0, '#4a5258'],
				[1, '#1a1e22']
			]), 3);
		}

		function drawParts(c: CanvasRenderingContext2D) {
			for (const p of parts) {
				const u = p.life / p.max;
				c.globalAlpha = 1 - u;
				if (p.k === 'spark') {
					c.strokeStyle = p.color;
					c.lineWidth = p.size;
					c.lineCap = 'round';
					c.beginPath();
					c.moveTo(p.x, p.y);
					c.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
					c.stroke();
				} else if (p.k === 'ring') {
					c.beginPath();
					c.arc(p.x, p.y, p.size * (0.3 + ease(u) * 1.2), 0, TAU);
					c.lineWidth = 5 * (1 - u) + 1;
					c.strokeStyle = p.color;
					c.stroke();
				} else if (p.k === 'smoke') {
					c.globalAlpha = 0.4 * (1 - u);
					c.beginPath();
					c.arc(p.x, p.y, p.size * (1 + u * 2), 0, TAU);
					c.fillStyle = p.color;
					c.fill();
				} else {
					c.save();
					c.translate(p.x, p.y);
					c.rotate(p.rot + u * 6);
					c.fillStyle = p.color;
					c.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
					c.restore();
				}
			}
			c.globalAlpha = 1;
		}

		function drawHud(c: CanvasRenderingContext2D) {
			const k = narrow ? 1.18 : 1;
			c.fillStyle = lin(c, 0, 0, 0, 50 * k, [
				[0, 'rgba(2,10,14,0.92)'],
				[1, 'rgba(2,10,14,0.6)']
			]);
			c.fillRect(0, 0, W, 48 * k);
			c.fillStyle = 'rgba(47,208,184,0.55)';
			c.fillRect(0, 48 * k, W, 2);
			text(c, s.score.toUpperCase(), 16, 15 * k, 12 * k, TEAL, 'left');
			text(c, Math.round(shown).toLocaleString('en-US'), 16, 34 * k, 24 * k, '#ffffff', 'left', 900);
			const combo = T.comboOf(streak);
			const pop = time - comboPop < 0.3 ? 1 + 0.35 * (1 - (time - comboPop) / 0.3) : 1;
			c.save();
			c.translate(250 * (narrow ? 0.94 : 1), 25 * k);
			c.scale(pop, pop);
			text(c, `×${combo}`, 0, 0, 30 * k, combo > 1 ? LIME : '#9ab8b0', 'center', 900);
			c.restore();
			const pips = T.COMBO_STEP;
			const into = combo >= T.COMBO_MAX ? pips : streak % pips;
			for (let i = 0; i < pips; i++) {
				c.beginPath();
				c.arc(250 * (narrow ? 0.94 : 1) + 34 * k + i * 12 * k, 25 * k, 4 * k, 0, TAU);
				paint(c, i < into ? LIME : 'rgba(80,120,110,0.5)', 1.6);
			}
			const sec = Math.max(time, 1);
			text(c, s.wpm, 432 * (narrow ? 0.96 : 1), 15 * k, 12 * k, TEAL);
			text(c, String(T.wpmOf(ok, sec)), 432 * (narrow ? 0.96 : 1), 34 * k, 22 * k, '#ffffff', 'center', 900);
			text(c, s.accuracy.toUpperCase(), 528, 15 * k, 12 * k, TEAL);
			text(c, `${T.accuracyOf(ok, wrong)}%`, 528, 34 * k, 22 * k, '#ffffff', 'center', 900);
			for (let i = 0; i < T.LIVES; i++) {
				const x = W - 26 * k - (T.LIVES - 1 - i) * 38 * k;
				const y = 25 * k;
				const lost = i >= lives;
				const hit = time - lostAt[i];
				c.save();
				c.translate(x, y + (hit < 0.4 ? Math.sin(hit * 60) * 3 : 0));
				c.scale(k, k);
				c.beginPath();
				c.moveTo(0, -15);
				c.lineTo(13, -10);
				c.quadraticCurveTo(13, 8, 0, 16);
				c.quadraticCurveTo(-13, 8, -13, -10);
				c.closePath();
				paint(c, lost ? '#2a1a1e' : lin(c, 0, -15, 0, 16, [
					[0, '#7affe0'],
					[1, '#14806e']
				]), 2.6);
				if (lost) {
					c.beginPath();
					c.moveTo(-3, -14);
					c.lineTo(2, -4);
					c.lineTo(-3, 3);
					c.lineTo(3, 14);
					c.lineWidth = 2;
					c.strokeStyle = '#ff5a4a';
					c.stroke();
				} else {
					c.beginPath();
					c.moveTo(-6, -9);
					c.lineTo(5, -9);
					c.strokeStyle = 'rgba(255,255,255,0.6)';
					c.lineWidth = 2.2;
					c.stroke();
				}
				c.restore();
			}
		}

		function draw() {
			const c = ctx;
			if (!map) return;
			c.setTransform(1, 0, 0, 1, 0, 0);
			c.clearRect(0, 0, canvas.width, canvas.height);
			const sx = shake > 0 ? (fx() - 0.5) * shake * 30 * scale : 0;
			const sy = shake > 0 ? (fx() - 0.5) * shake * 30 * scale : 0;
			c.drawImage(map, sx, sy);
			c.setTransform(scale, 0, 0, scale, sx, sy);
			drawSweep(c);
			// the line glows, red when something is close
			const close = alive().reduce((m, l) => Math.max(m, T.posAt(l.sp, time).y), 0);
			const heat = clamp((close - (LINE_Y - 120)) / 120, 0, 1);
			const fl = time - lineFlash < 0.5 ? 1 - (time - lineFlash) / 0.5 : 0;
			c.setLineDash([16, 10]);
			c.lineDashOffset = -time * 30;
			c.beginPath();
			c.moveTo(0, LINE_Y);
			c.lineTo(W, LINE_Y);
			c.lineWidth = 9 + fl * 8;
			c.strokeStyle = `rgba(255,${Math.round(200 - heat * 150)},60,${0.18 + heat * 0.25 + fl * 0.5})`;
			c.stroke();
			c.lineWidth = 3;
			c.strokeStyle = fl > 0 ? '#ff5a4a' : heat > 0 ? `rgb(255,${Math.round(210 - heat * 140)},70)` : '#ffcf3a';
			c.stroke();
			c.setLineDash([]);
			if (fl > 0) {
				c.fillStyle = `rgba(255,40,30,${0.22 * fl})`;
				c.fillRect(0, 0, W, H);
			}
			// callouts: the ones further up first, so tags closer to the line sit on top
			const order = [...live].sort((a, b) => T.posAt(a.sp, time).y - T.posAt(b.sp, time).y);
			for (const l of order) {
				const p = T.posAt(l.sp, time);
				const y = Math.min(p.y, LINE_Y);
				const locked = st.target === l.sp.i && l.die < 0;
				if (l.die >= 0) {
					const u = (time - l.die) / 0.4;
					if (u >= 1) continue;
					drawMarker(c, p.x, y, 1 + u * 0.8, false, 1);
					drawPlate(c, l, p.x, y, false, 1 - u, u * 40);
					continue;
				}
				const pinged = time - l.ping < 0.12 ? 1 - (time - l.ping) / 0.12 : 0;
				// a new callout blinks in: grows from small and fades up over a quarter second
				const born = ease((time - l.sp.at) / 0.25);
				c.globalAlpha = born;
				drawMarker(c, p.x, y, (0.4 + 0.6 * born) * (1 + pinged * 0.15), locked, Math.max(blipNear(p.x, y), pinged));
				c.globalAlpha = 1;
				drawPlate(c, l, p.x, y, locked, born, 0);
			}
			// tracers from the gun
			tracers = tracers.filter((tr) => time - tr.t < (tr.big ? 0.16 : 0.07));
			for (const tr of tracers) {
				const u = (time - tr.t) / (tr.big ? 0.16 : 0.07);
				const mx = GUN.x + Math.cos(gunAngle) * 60;
				const my = GUN.y + Math.sin(gunAngle) * 60;
				c.lineCap = 'round';
				c.beginPath();
				c.moveTo(mx, my);
				c.lineTo(tr.x, tr.y);
				c.lineWidth = (tr.big ? 10 : 4) * (1 - u) + 1;
				c.strokeStyle = `rgba(255,220,90,${0.45 * (1 - u)})`;
				c.stroke();
				c.lineWidth = (tr.big ? 3 : 1.5) * (1 - u) + 0.5;
				c.strokeStyle = `rgba(255,255,230,${1 - u})`;
				c.stroke();
			}
			drawParts(c);
			drawGun(c);
			for (const f of floaters) {
				const u = f.t / 1;
				const pop = f.t < 0.1 ? 0.6 + f.t * 6 : 1.2 - Math.min(0.2, (f.t - 0.1) * 1.4);
				c.save();
				c.globalAlpha = u > 0.65 ? (1 - u) / 0.35 : 1;
				c.translate(clamp(f.x, 60, W - 60), f.y - ease(u) * 40);
				c.scale(pop, pop);
				text(c, f.text, 0, 0, f.size * (narrow ? 1.2 : 1), f.color, 'center', 900);
				c.restore();
			}
			if (endAt >= 0) {
				const u = clamp((time - endAt) / 0.25, 0, 1);
				c.fillStyle = `rgba(30,0,4,${0.45 * u})`;
				c.fillRect(0, 0, W, H);
				c.save();
				c.translate(W / 2, H / 2 - 20);
				c.scale(0.6 + 0.4 * ease(u), 0.6 + 0.4 * ease(u));
				text(c, s.breached.toUpperCase(), 0, 0, narrow ? 64 : 56, '#ff5a4a', 'center', 900);
				c.restore();
			}
			c.setTransform(scale, 0, 0, scale, 0, 0);
			drawHud(c);
		}

		// ---------------------------------------------------------------- rules in motion
		function burst(x: number, y: number, color: string, n: number) {
			for (let i = 0; i < lots(n); i++) {
				const a = fx() * TAU;
				const v = 120 + fx() * 280;
				parts.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.3 + fx() * 0.3, size: 2.4, color, rot: 0 });
			}
		}
		function kill(l: Live) {
			const p = T.posAt(l.sp, time);
			l.die = time;
			tracers.push({ x: p.x, y: p.y, t: time, big: true });
			recoil = 1;
			burst(p.x, p.y, '#fff3a0', 16);
			parts.push({ k: 'ring', x: p.x, y: p.y, vx: 0, vy: 0, life: 0, max: 0.4, size: 46, color: LIME, rot: 0 });
			for (let i = 0; i < lots(8); i++) {
				const a = -Math.PI * fx();
				const v = 100 + fx() * 200;
				parts.push({ k: 'shard', x: p.x + (fx() - 0.5) * 60, y: p.y - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.5 + fx() * 0.3, size: 3 + fx() * 4, color: fx() < 0.5 ? TEAL : '#0a2a30', rot: fx() * 6 });
			}
			floaters.push({ text: `+${l.pts}`, x: p.x, y: p.y - 70, t: 0, color: LIME, size: 30 });
			sound.play('camo');
			refreshList();
		}
		function breach(l: Live) {
			const p = T.posAt(l.sp, time);
			l.die = time;
			l.breach = true;
			lives = Math.max(0, lives - 1);
			lostAt[lives] = time;
			streak = 0;
			st = T.dropTarget(st, l.sp.i);
			syncInput();
			lineFlash = time;
			if (!reduce) shake = 0.35;
			burst(p.x, LINE_Y, '#ff6a4a', 20);
			parts.push({ k: 'ring', x: p.x, y: LINE_Y, vx: 0, vy: 0, life: 0, max: 0.5, size: 70, color: '#ff4a3a', rot: 0 });
			for (let i = 0; i < lots(6); i++) parts.push({ k: 'smoke', x: p.x + (fx() - 0.5) * 40, y: LINE_Y, vx: (fx() - 0.5) * 40, vy: -30 - fx() * 40, life: 0, max: 1 + fx() * 0.6, size: 10 + fx() * 8, color: '#3a1a1e', rot: 0 });
			floaters.push({ text: s.breach, x: p.x, y: LINE_Y - 30, t: 0, color: '#ff5a4a', size: 30 });
			sound.play('clack');
			refreshList();
			if (lives <= 0 && endAt < 0) {
				endAt = time;
				st = T.EMPTY;
				syncInput();
			}
		}
		function typed(ch: string) {
			if (endAt >= 0 || ended || paused) return;
			const r = T.typeChar(st, ch, onScreen());
			if (r.kind === 'ignored') return;
			if (r.kind === 'miss') {
				wrong++;
				if (streak >= T.COMBO_STEP) floaters.push({ text: s.streakLost, x: 250, y: 92, t: 0, color: '#ff8a6a', size: 20 });
				streak = 0;
				missFlash = time;
				const tg = byId(st.target);
				if (tg) tg.shake = time;
				flashBad();
				return;
			}
			ok++;
			const pts = T.charPoints(streak);
			score += pts;
			st = r.st;
			const tg = byId(r.target);
			if (!tg) return;
			tg.pts += pts;
			tg.ping = time;
			const p = T.posAt(tg.sp, time);
			gunAim = Math.atan2(p.y - GUN.y, p.x - GUN.x);
			if (r.kind === 'done') {
				const before = T.comboOf(streak);
				streak++;
				kill(tg);
				const after = T.comboOf(streak);
				if (after > before) {
					comboPop = time;
					floaters.push({ text: s.comboUp(after), x: 250, y: 96, t: 0, color: LIME, size: 22 });
					if (after === T.COMBO_MAX) sound.play('maxed');
				}
			} else {
				tracers.push({ x: p.x, y: p.y, t: time, big: false });
				recoil = Math.max(recoil, 0.4);
				burst(p.x, p.y, '#fff3a0', 3);
			}
			syncInput();
		}

		function refreshList() {
			liveWords = alive()
				.sort((a, b) => T.posAt(b.sp, time).y - T.posAt(a.sp, time).y)
				.map((l) => l.sp.word);
		}
		function syncInput() {
			const tg = byId(st.target);
			const v = tg ? tg.sp.word.slice(0, T.shownPart(tg.sp.word, st.buf.length)) : '';
			if (input.value !== v) input.value = v;
			empty = v === '';
		}
		let badTimer = 0;
		function flashBad() {
			bad = true;
			clearTimeout(badTimer);
			badTimer = window.setTimeout(() => (bad = false), 200);
		}

		function update(dt: number) {
			time += dt;
			if (endAt < 0) {
				let added = false;
				while (next < plan.length && plan[next].at <= time) {
					live.push({ sp: plan[next++], die: -1, breach: false, shake: -9, pts: 0, ping: -9 });
					added = true;
				}
				if (added) refreshList();
				for (const l of live) if (l.die < 0 && T.posAt(l.sp, time).u >= 1) breach(l);
			}
			live = live.filter((l) => l.die < 0 || time - l.die < 0.45);
			for (const p of parts) {
				p.life += dt;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				if (p.k === 'shard') p.vy += 500 * dt;
				if (p.k === 'spark') {
					p.vx *= 1 - 3 * dt;
					p.vy *= 1 - 3 * dt;
				}
			}
			parts = parts.filter((p) => p.life < p.max);
			for (const f of floaters) f.t += dt;
			while (floaters.length && floaters[0].t > 1) floaters.shift();
			shake = Math.max(0, shake - dt);
			recoil = Math.max(0, recoil - dt * 6);
			shown += (score - shown) * Math.min(1, dt * 9);
			if (Math.abs(score - shown) < 1) shown = score;
			if (endAt >= 0 && time - endAt > 0.95 && !ended) {
				ended = true;
				onend(Math.max(0, Math.round(score)));
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
			narrow = r.width < 500;
			const cv = document.createElement('canvas');
			cv.width = canvas.width;
			cv.height = canvas.height;
			const c = cv.getContext('2d')!;
			c.setTransform(scale, 0, 0, scale, 0, 0);
			drawMap(c);
			map = cv;
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

		// ---------------------------------------------------------------- input
		let composing = false;
		const onKey = (e: KeyboardEvent) => {
			if (ended) return;
			if (paused) {
				e.preventDefault();
				resume();
				return;
			}
			if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.key === 'Backspace') {
				e.preventDefault();
				st = T.backspace(st, onScreen());
				syncInput();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				st = T.EMPTY;
				syncInput();
			} else if (e.key === 'Enter') e.preventDefault();
			else if (e.key.length === 1) {
				// a real key: take it here (a phone keyboard's "Unidentified" keys come through `input` instead)
				e.preventDefault();
				if (document.activeElement !== input) input.focus({ preventScroll: true });
				typed(e.key);
			}
		};
		const onInput = () => {
			if (composing) return;
			const k = T.keyOf(input.value);
			if (k.startsWith(st.buf)) for (const ch of k.slice(st.buf.length)) typed(ch);
			else if (st.buf.startsWith(k)) while (st.buf.length > k.length) st = T.backspace(st, onScreen());
			else {
				st = T.EMPTY;
				for (const ch of k) typed(ch);
			}
			syncInput();
		};
		const onCompStart = () => (composing = true);
		const onCompEnd = () => {
			composing = false;
			onInput();
		};
		const onFocus = () => (focused = true);
		const onBlur = () => (focused = false);
		const onVis = () => {
			if (document.hidden && !ended) paused = true;
		};
		focusInput = () => input.focus({ preventScroll: true });
		resume = () => {
			paused = false;
			last = performance.now();
			focusInput();
		};
		const onTap = () => {
			if (paused) resume();
			else focusInput();
		};
		root.addEventListener('keydown', onKey);
		root.addEventListener('pointerup', onTap);
		input.addEventListener('input', onInput);
		input.addEventListener('compositionstart', onCompStart);
		input.addEventListener('compositionend', onCompEnd);
		input.addEventListener('focus', onFocus);
		input.addEventListener('blur', onBlur);
		document.addEventListener('visibilitychange', onVis);
		focusInput();
		focused = document.activeElement === input;

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			clearTimeout(badTimer);
			root.removeEventListener('keydown', onKey);
			root.removeEventListener('pointerup', onTap);
			input.removeEventListener('input', onInput);
			input.removeEventListener('compositionstart', onCompStart);
			input.removeEventListener('compositionend', onCompEnd);
			input.removeEventListener('focus', onFocus);
			input.removeEventListener('blur', onBlur);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<!-- the terminal line's <input> is the tab stop and takes the typing; the box around it hands taps to it -->
<div class="ct" bind:this={root} role="group" aria-label={s.label}>
	<div class="ct-screen">
		<canvas bind:this={canvas} class="ct-cv" aria-hidden="true"></canvas>
		<div class="ct-crt" aria-hidden="true"></div>
		{#if !focused && !paused}
			<div class="ct-tap" aria-hidden="true">{s.tapToType}</div>
		{/if}
		{#if paused}
			<button type="button" class="ct-pause" onclick={() => resume()}>
				<b>{s.paused}</b>
				<span>{s.tapToGo}</span>
			</button>
		{/if}
	</div>
	<label class="ct-term" class:bad>
		<span class="ct-prompt" aria-hidden="true">&gt;</span>
		<input
			bind:this={input}
			class="ct-input"
			type="text"
			autocapitalize="off"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
			inputmode="text"
			enterkeyhint="done"
			aria-label={s.inputLabel}
		/>
		{#if empty}<span class="ct-ph" aria-hidden="true">{s.prompt}</span>{/if}
	</label>
	<ol class="sr-only" aria-label={s.liveLabel} aria-live="polite" data-callouts>
		{#each liveWords as w (w)}<li>{w}</li>{/each}
	</ol>
</div>

<style>
	.ct {
		--term: 46px;
		position: relative;
		width: min(100%, calc((min(72vh, 640px) - var(--term)) * 4 / 3));
		/* never stretched by a grid / flex parent: the screen (4:3) + the terminal line is the whole box */
		height: fit-content;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #020e13;
		box-shadow:
			inset 0 0 0 2px #000,
			0 0 0 1px rgb(120 255 220 / 0.12),
			0 10px 30px rgb(0 0 0 / 0.45);
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.ct:focus-within {
		box-shadow:
			inset 0 0 0 2px #000,
			0 0 0 2px rgb(141 255 90 / 0.55),
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.ct-screen {
		position: relative;
		aspect-ratio: 4 / 3;
		cursor: text;
	}
	.ct-cv {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.ct-crt {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background:
			repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.12) 0 1px, transparent 1px 3px),
			radial-gradient(ellipse at center, transparent 58%, rgb(0 0 0 / 0.5) 100%);
		box-shadow:
			inset 0 0 0 3px rgb(0 0 0 / 0.5),
			inset 0 0 30px rgb(0 20 20 / 0.7);
	}
	.ct-tap {
		position: absolute;
		left: 50%;
		bottom: 30%;
		translate: -50% 0;
		padding: 8px 16px;
		border-radius: 999px;
		background: rgb(2 14 18 / 0.85);
		border: 2px solid #8dff5a;
		color: #eafff4;
		font: 800 clamp(13px, 2.6vw, 17px) / 1 Bahnschrift, 'Segoe UI', sans-serif;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		pointer-events: none;
		animation: ct-blink 1.2s ease-in-out infinite;
	}
	@keyframes ct-blink {
		50% {
			opacity: 0.55;
		}
	}
	.ct-pause {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		gap: 6px;
		border: 0;
		background: rgb(2 12 16 / 0.7);
		color: #fff;
		font-family: Bahnschrift, 'Segoe UI', sans-serif;
		text-align: center;
		text-shadow:
			0 2px 0 #06080c,
			0 0 12px rgb(0 0 0 / 0.8);
		cursor: pointer;
	}
	.ct-pause b {
		font-size: clamp(26px, 6vw, 44px);
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #8dff5a;
	}
	.ct-pause span {
		font-size: clamp(14px, 3vw, 20px);
		font-weight: 700;
	}
	.ct-term {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		height: var(--term);
		padding: 0 14px;
		background: linear-gradient(#031317, #01090c);
		border-top: 2px solid rgb(47 208 184 / 0.7);
		cursor: text;
		transition: background 0.15s;
	}
	.ct-term.bad {
		background: linear-gradient(#4a0c10, #22060a);
		border-top-color: #ff4a3a;
	}
	.ct-prompt {
		color: #2fd0b8;
		font: 900 20px/1 'Cascadia Mono', Consolas, monospace;
	}
	.ct-input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: none;
		background: transparent;
		color: #8dff5a;
		caret-color: #8dff5a;
		font: 700 18px/1 'Cascadia Mono', Consolas, monospace;
		letter-spacing: 0.04em;
		text-shadow: 0 0 8px rgb(141 255 90 / 0.6);
		user-select: text;
		-webkit-user-select: text;
	}
	.ct-ph {
		position: absolute;
		left: 40px;
		color: rgb(140 220 200 / 0.45);
		font: 700 16px/1 'Cascadia Mono', Consolas, monospace;
		pointer-events: none;
		text-transform: lowercase;
	}
	@media (prefers-reduced-motion: reduce) {
		.ct-tap {
			animation: none;
		}
		.ct-term {
			transition: none;
		}
	}
</style>
