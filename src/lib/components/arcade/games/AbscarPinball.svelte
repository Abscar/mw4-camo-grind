<!--
	Abscar's Pinball (BurgiArcade, 2026-11-22): a classic desktop-style pinball table with a score panel beside it.
	The rules and physics live in arcade/pinball.ts; this file draws the table on a 420 × 760 canvas (the static
	playfield pre-rendered once per size), a dot-matrix display (DMD) in the panel, and all the effects: bumper
	flashes, sparks, score pop-ups, big call-outs (JACKPOT, MULTIBALL, TACTICAL NUKE …), confetti in the camo's
	colours, Holk Time smoke, the end-of-ball bonus count. Our own table and drawings, themed on the camo grind.
	Keys: ← / Z and → / M for the flippers, Space / ↓ for the plunger, ↑ / X to nudge; touch: tap the table's left
	or right half, or the buttons under it.
-->
<script lang="ts" module>
	import {
		W,
		H,
		R,
		ARCH,
		WALLS,
		GATE,
		DIVIDERS,
		LANE_TOP,
		LANE_BOT,
		LANE_NAMES,
		SLINGS,
		BUMPERS,
		TARGET_X,
		TARGET_Y,
		TARGET_W,
		TARGET_NAMES,
		SAUCER,
		FLIPPERS,
		LANE_X,
		PLUNGER_Y,
		ORBIT_X,
		RAMP_X,
		rampPoint,
		flipperTip,
		STREAKS
	} from '#lib/arcade/pinball.ts';

	type Ctx = CanvasRenderingContext2D;
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
	const O = '#14060a';
	/** camo colours: G, P, HB, DIV */
	export const CAMO_COL = ['#ffd23a', '#dfe8f4', '#ff2a4a', '#5ff0dc'];
	const CAMO_CONFETTI = [
		['#ffd23a', '#fff6b0', '#c88a00'],
		['#ffffff', '#cfd8e6', '#8a98ac'],
		['#ff2a4a', '#1a0006', '#ff8a9a'],
		['#5ff0dc', '#ff5cb8', '#ffd23a', '#7a5cff']
	];
	export const INSERTS = {
		camo: [150, 182, 214, 246].map((x) => ({ x, y: 508 })),
		kills: [372, 404, 436, 468].map((y) => ({ x: 104, y })).reverse(),
		ramp: { x: 41, y: 360 },
		orbit: { x: 351, y: 455 },
		holk: { x: 197, y: 455 },
		kick: { x: 40, y: 650 },
		again: { x: 195, y: 742 },
		locks: [-1, 0, 1].map((k) => ({ x: SAUCER.x + k * 16, y: SAUCER.y + 26 }))
	};

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
	function lg(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]): CanvasGradient {
		const g = c.createLinearGradient(x0, y0, x1, y1);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}
	function rg(c: Ctx, x: number, y: number, r: number, stops: [number, string][], fx = x, fy = y): CanvasGradient {
		const g = c.createRadialGradient(fx, fy, 0, x, y, r);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}
	function seeded(seed: number) {
		let a = seed >>> 0;
		return () => {
			a = (a * 1664525 + 1013904223) >>> 0;
			return a / 4294967296;
		};
	}
	function polyPath(pts: { x: number; y: number }[], close = false): Path2D {
		const p = new Path2D();
		pts.forEach((q, i) => (i ? p.lineTo(q.x, q.y) : p.moveTo(q.x, q.y)));
		if (close) p.closePath();
		return p;
	}
	/** the inside of the table (arch + walls) as one shape */
	function tableShape(): Path2D {
		const p = new Path2D();
		p.moveTo(20, 780);
		for (const q of ARCH) p.lineTo(q.x, q.y);
		p.lineTo(400, 780);
		p.closePath();
		return p;
	}
	export function rampSpline(steps = 60): { x: number; y: number }[] {
		return Array.from({ length: steps + 1 }, (_, i) => rampPoint(i / steps));
	}
	function rail(c: Ctx, a: { x: number; y: number }, b: { x: number; y: number }, w = 6) {
		c.strokeStyle = O;
		c.lineWidth = w + 3;
		c.beginPath();
		c.moveTo(a.x, a.y);
		c.lineTo(b.x, b.y);
		c.stroke();
		c.strokeStyle = lg(c, a.x - 4, a.y - 4, a.x + 4, a.y + 4, [
			[0, '#f4f6fa'],
			[0.5, '#9aa4b4'],
			[1, '#4a5260']
		]);
		c.lineWidth = w;
		c.stroke();
		c.strokeStyle = 'rgba(255,255,255,.55)';
		c.lineWidth = 1.2;
		c.stroke();
	}

	/** the playfield without anything that lights or moves */
	function playfield(c: Ctx) {
		const shape = tableShape();
		// cabinet wood around the table
		c.fillStyle = lg(c, 0, 0, W, 0, [
			[0, '#3a1f0e'],
			[0.5, '#5a3218'],
			[1, '#3a1f0e']
		]);
		c.fillRect(0, 0, W, H);
		const rnd = seeded(420);
		c.strokeStyle = 'rgba(0,0,0,.18)';
		c.lineWidth = 1;
		for (let i = 0; i < 40; i++) {
			const y = rnd() * H;
			c.beginPath();
			c.moveTo(0, y);
			c.bezierCurveTo(W * 0.3, y + (rnd() - 0.5) * 30, W * 0.6, y + (rnd() - 0.5) * 30, W, y + (rnd() - 0.5) * 20);
			c.stroke();
		}
		c.save();
		c.clip(shape);
		// the playfield: deep night-blue with woodland camo blobs
		c.fillStyle = lg(c, 0, 0, 0, H, [
			[0, '#1a1036'],
			[0.45, '#141a3a'],
			[1, '#0a0c1e']
		]);
		c.fillRect(0, 0, W, H);
		const camoCols = ['rgba(38,60,44,.55)', 'rgba(70,48,30,.45)', 'rgba(10,12,20,.55)', 'rgba(52,70,90,.35)'];
		for (let i = 0; i < 70; i++) {
			const x = rnd() * W;
			const y = rnd() * H;
			const r = 14 + rnd() * 34;
			c.fillStyle = camoCols[i % camoCols.length];
			c.beginPath();
			for (let k = 0; k <= 10; k++) {
				const a = (k / 10) * Math.PI * 2;
				const rr = r * (0.6 + rnd() * 0.5);
				const px = x + Math.cos(a) * rr * 1.3;
				const py = y + Math.sin(a) * rr * 0.8;
				if (k) c.lineTo(px, py);
				else c.moveTo(px, py);
			}
			c.closePath();
			c.fill();
		}
		// red HUD grid, very faint
		c.strokeStyle = 'rgba(255,60,40,.06)';
		c.lineWidth = 1;
		for (let x = 20; x < W; x += 24) {
			c.beginPath();
			c.moveTo(x, 0);
			c.lineTo(x, H);
			c.stroke();
		}
		for (let y = 0; y < H; y += 24) {
			c.beginPath();
			c.moveTo(0, y);
			c.lineTo(W, y);
			c.stroke();
		}
		// centre art: the cyborg skull with a holk, big and faint
		c.save();
		c.translate(200, 352);
		c.globalAlpha = 0.28;
		c.fillStyle = rg(c, 0, -10, 70, [
			[0, '#c8a070'],
			[1, '#4a2a14']
		]);
		c.beginPath();
		c.moveTo(-40, -6);
		c.bezierCurveTo(-44, -60, 44, -60, 40, -6);
		c.bezierCurveTo(40, 14, 30, 22, 24, 30);
		c.lineTo(-24, 30);
		c.bezierCurveTo(-30, 22, -40, 14, -40, -6);
		c.fill();
		c.fillStyle = '#0a0408';
		c.beginPath();
		c.ellipse(-16, -6, 11, 9, 0.15, 0, Math.PI * 2);
		c.ellipse(16, -6, 11, 9, -0.15, 0, Math.PI * 2);
		c.fill();
		c.fillRect(-18, 30, 36, 10);
		c.globalAlpha = 0.4;
		c.fillStyle = '#f4ece0';
		c.save();
		c.rotate(-0.25);
		c.fillRect(14, 22, 44, 7);
		c.restore();
		c.restore();
		c.font = `900 26px ${FONT}`;
		c.textAlign = 'center';
		c.fillStyle = 'rgba(255,90,60,.16)';
		c.fillText('ABSCAR', 195, 588);
		// lane plates under G P H
		for (let i = 0; i < 3; i++) {
			const x = (DIVIDERS[i] + DIVIDERS[i + 1]) / 2;
			c.fillStyle = 'rgba(0,0,0,.4)';
			c.fillRect(DIVIDERS[i] + 3, LANE_TOP, DIVIDERS[i + 1] - DIVIDERS[i] - 6, LANE_BOT - LANE_TOP);
			c.strokeStyle = 'rgba(255,255,255,.12)';
			c.strokeRect(DIVIDERS[i] + 3, LANE_TOP, DIVIDERS[i + 1] - DIVIDERS[i] - 6, LANE_BOT - LANE_TOP);
			void x;
		}
		// orbit + ramp channel floors
		c.fillStyle = 'rgba(0,0,0,.28)';
		c.fillRect(ORBIT_X, 262, LANE_X - ORBIT_X, 163);
		c.fillRect(20, 282, RAMP_X - 20, 148);
		// plunger lane floor
		c.fillStyle = 'rgba(0,0,0,.45)';
		c.fillRect(LANE_X, 220, 400 - LANE_X, PLUNGER_Y - 220);
		// labels
		const label = (t: string, x: number, y: number, size: number, col: string, rot = 0) => {
			c.save();
			c.translate(x, y);
			c.rotate(rot);
			c.font = `800 ${size}px ${FONT}`;
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.lineWidth = 3;
			c.strokeStyle = 'rgba(0,0,0,.7)';
			c.strokeText(t, 0, 0);
			c.fillStyle = col;
			c.fillText(t, 0, 0);
			c.restore();
		};
		label('NUKE RAMP', 41, 395, 9, '#ff8a5a', -Math.PI / 2);
		label('ORBIT', 351, 330, 9, '#5ff0dc', -Math.PI / 2);
		label('STASH', SAUCER.x, SAUCER.y - 24, 9, '#c88aff');
		label('KILLSTREAK', 104, 350, 8, '#ff6a4a');
		label('CAMO', 198, 488, 8, '#ffd23a');
		label('BONUS ×2   ×3   ×4   ×5', 198, 530, 7, 'rgba(255,240,200,.75)');
		label('SHOOT AGAIN', 195, 757, 7, '#ffb0a0');
		label('KICKBACK', 40, 670, 7, '#ffcc66');
		// apron
		c.restore();
		c.fillStyle = lg(c, 0, 715, 0, H, [
			[0, '#2a1608'],
			[1, '#120804']
		]);
		c.beginPath();
		c.moveTo(20, 712);
		c.lineTo(150, 720);
		c.lineTo(150, H);
		c.lineTo(20, H);
		c.closePath();
		c.moveTo(LANE_X, 712);
		c.lineTo(240, 720);
		c.lineTo(240, H);
		c.lineTo(LANE_X, H);
		c.closePath();
		c.fill();
		c.font = `900 9px ${FONT}`;
		c.textAlign = 'center';
		c.fillStyle = '#ffb02a';
		c.fillText("ABSCAR'S", 85, 738);
		c.fillText('PINBALL', 85, 750);
		c.fillStyle = '#ff6a4a';
		c.fillText('CAMO GRIND', 305, 738);
		c.fillText('EDITION', 305, 750);
		// rails and walls
		c.strokeStyle = O;
		c.lineWidth = 9;
		c.stroke(polyPath(ARCH));
		c.strokeStyle = lg(c, 0, 0, W, 0, [
			[0, '#c8ced8'],
			[0.5, '#ffffff'],
			[1, '#c8ced8']
		]);
		c.lineWidth = 5;
		c.stroke(polyPath(ARCH));
		for (const [a, b] of WALLS) if (a.y < 775) rail(c, a, { x: b.x, y: Math.min(b.y, 760) });
		// lane dividers
		for (const x of DIVIDERS) {
			rail(c, { x, y: LANE_TOP }, { x, y: LANE_BOT }, 5);
			c.fillStyle = rg(c, x - 1, LANE_TOP - 1, 5, [
				[0, '#fff'],
				[1, '#6a7484']
			]);
			c.beginPath();
			c.arc(x, LANE_TOP, 4, 0, Math.PI * 2);
			c.fill();
		}
		// lane letters
		for (let i = 0; i < 3; i++) {
			const x = (DIVIDERS[i] + DIVIDERS[i + 1]) / 2;
			label(LANE_NAMES[i], x, LANE_BOT + 16, 11, CAMO_COL[i]);
		}
		// slingshot bodies
		SLINGS.forEach((s) => {
			const p = polyPath([s.a, s.b, s.c], true);
			c.fillStyle = lg(c, s.a.x, s.a.y, s.c.x, s.c.y, [
				[0, '#7a1010'],
				[1, '#3a0408']
			]);
			c.fill(p);
			c.strokeStyle = O;
			c.lineWidth = 3;
			c.stroke(p);
		});
		// saucer hole
		c.fillStyle = rg(c, SAUCER.x, SAUCER.y, SAUCER.r + 6, [
			[0, '#000'],
			[0.65, '#0a0410'],
			[1, '#5a3a7a']
		]);
		c.beginPath();
		c.arc(SAUCER.x, SAUCER.y, SAUCER.r + 4, 0, Math.PI * 2);
		c.fill();
		c.strokeStyle = '#c88aff';
		c.lineWidth = 2;
		c.stroke();
		// drop-target slots
		TARGET_X.forEach((x) => {
			c.fillStyle = '#05030a';
			c.fillRect(x - TARGET_W / 2 + 1, TARGET_Y - 3, TARGET_W - 2, 6);
		});
		// plunger lane gate
		rail(c, GATE[0], GATE[1], 3);
		// a wood frame's inner edge shadow
		c.save();
		c.clip(shape);
		c.strokeStyle = 'rgba(0,0,0,.6)';
		c.lineWidth = 18;
		c.stroke(shape);
		c.restore();
	}
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { PinballGame, type PinEvent, HOLK_TIME } from '#lib/arcade/pinball.ts';
	import w from '#lib/i18n/arcade/pinball.ts';

	let { seed, onend }: ArcadeGameProps = $props();

	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();
	let dmdCanvas = $state<HTMLCanvasElement>();
	/** the panel's numbers (refreshed a few times a second) */
	let hud = $state({ score: 0, ball: 1, of: 3, camo: 0, kills: 0, locks: 0, holk: 0, kick: true, mb: false, extra: 0 });
	const ctl: { press: (k: Control, down: boolean) => void } = { press: () => {} };
	type Control = 'left' | 'right' | 'plunger' | 'nudge';

	$effect(() => {
		if (!root || !canvas || !dmdCanvas) return;
		return run(
			root,
			canvas,
			dmdCanvas,
			untrack(() => seed),
			untrack(() => onend)
		);
	});

	/* ---------- little synth (only when the site's sound is on) ---------- */
	let actx: AudioContext | null = null;
	function audio(): AudioContext | null {
		sound.load();
		if (!sound.on) return null;
		try {
			actx ??= new AudioContext();
			if (actx.state === 'suspended') actx.resume().catch(() => {});
			return actx;
		} catch {
			return null;
		}
	}
	function blip(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.12, slide = 1) {
		const a = audio();
		if (!a) return;
		const t = a.currentTime;
		const o = a.createOscillator();
		const g = a.createGain();
		o.type = type;
		o.frequency.setValueAtTime(freq, t);
		o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
		g.gain.setValueAtTime(vol, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		o.connect(g).connect(a.destination);
		o.start(t);
		o.stop(t + dur + 0.02);
	}
	function thud(dur = 0.06, freq = 900, vol = 0.25) {
		const a = audio();
		if (!a) return;
		const t = a.currentTime;
		const len = Math.ceil(a.sampleRate * dur);
		const buf = a.createBuffer(1, len, a.sampleRate);
		const d = buf.getChannelData(0);
		for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
		const src = a.createBufferSource();
		src.buffer = buf;
		const f = a.createBiquadFilter();
		f.type = 'lowpass';
		f.frequency.value = freq;
		const g = a.createGain();
		g.gain.value = vol;
		src.connect(f).connect(g).connect(a.destination);
		src.start(t);
	}
	function arp(notes: number[], step = 0.07, type: OscillatorType = 'square', vol = 0.1) {
		notes.forEach((n, i) => setTimeout(() => blip(n, 0.16, type, vol), i * step * 1000));
	}

	/* ---------- the game ---------- */

	interface Bit {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		max: number;
		r: number;
		color: string;
		kind: 'spark' | 'confetti' | 'smoke' | 'coin' | 'star' | 'boom';
		rot: number;
		vr: number;
	}
	interface Pop {
		text: string;
		x: number;
		y: number;
		t0: number;
		size: number;
		color: string;
	}
	interface Call {
		text: string;
		sub?: string;
		color: string;
		t0: number;
		dur: number;
		style?: 'rainbow' | 'nuke';
	}
	interface Dmd {
		lines: string[];
		until: number;
		blink?: boolean;
		invert?: boolean;
	}

	function run(el: HTMLDivElement, cv: HTMLCanvasElement, dcv: HTMLCanvasElement, seed0: number, end: ArcadeGameProps['onend']): () => void {
		const ctx = cv.getContext('2d')!;
		const dctx = dcv.getContext('2d')!;
		const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		const game = new PinballGame(seed0);
		let scale = 1;
		let field: HTMLCanvasElement | null = null;
		let time = 0;
		let paused = false;
		let done = false;
		let overAt = -1;
		const bits: Bit[] = [];
		const pops: Pop[] = [];
		let call: Call | null = null;
		let dmdMsgs: Dmd[] = [];
		let flashAt = -9;
		let flashCol = '#fff';
		let flashMax = 0.5;
		let shakeAt = -9;
		let shakeAmp = 0;
		let shakeX = 0;
		let shakeY = 0;
		const bumpAt = [-9, -9, -9];
		const slingAt = [-9, -9];
		const laneAt = [-9, -9, -9];
		const targetAt = [-9, -9, -9, -9];
		let rampGlowAt = -9;
		let saucerAt = -9;
		let spinA = 0;
		let spinV = 0;
		let nukeAt = -9;
		let uavAt = -9;
		let airAt = -9;
		let mbAt = -9;
		let tiltAt = -9;
		let shownScore = 0;
		const trails = new Map<number, { x: number; y: number }[]>();
		let bonusShow: { base: number; mult: number; total: number; t0: number } | null = null;

		/* effects */
		function burst(x: number, y: number, colors: string[], n: number, speed = 220, kind: Bit['kind'] = 'spark') {
			const k = reduce ? Math.ceil(n / 3) : n;
			for (let i = 0; i < k; i++) {
				const a = Math.random() * Math.PI * 2;
				const v = speed * (0.35 + Math.random() * 0.9);
				bits.push({
					x,
					y,
					vx: Math.cos(a) * v,
					vy: Math.sin(a) * v - (kind === 'confetti' || kind === 'coin' ? 160 : 0),
					life: 0,
					max: kind === 'confetti' ? 1.6 + Math.random() : kind === 'smoke' ? 1.8 : 0.35 + Math.random() * 0.4,
					r: kind === 'confetti' ? 3 + Math.random() * 3 : kind === 'smoke' ? 10 + Math.random() * 14 : kind === 'coin' ? 5 : 1.6 + Math.random() * 2,
					color: colors[i % colors.length],
					kind,
					rot: Math.random() * 6,
					vr: (Math.random() - 0.5) * 12
				});
			}
		}
		function rain(colors: string[], n: number, kind: Bit['kind'] = 'confetti') {
			const k = reduce ? Math.ceil(n / 4) : n;
			for (let i = 0; i < k; i++)
				bits.push({ x: 20 + Math.random() * 380, y: -10 - Math.random() * 200, vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 120, life: 0, max: 3 + Math.random(), r: kind === 'coin' ? 5 : 3 + Math.random() * 3, color: colors[i % colors.length], kind, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10 });
		}
		function pop(text: string, x: number, y: number, size = 14, color = '#fff') {
			pops.push({ text, x, y, t0: time, size, color });
			if (pops.length > 18) pops.shift();
		}
		function callout(text: string, color: string, sub?: string, dur = 1.6, style?: Call['style']) {
			call = { text, sub, color, t0: time, dur, style };
		}
		function flash(col: string, max = 0.5) {
			flashAt = time;
			flashCol = col;
			flashMax = reduce ? Math.min(max, 0.2) : max;
		}
		function shake(a: number) {
			if (reduce) return;
			shakeAmp = time - shakeAt < 0.3 ? Math.max(a, shakeAmp) : a;
			shakeAt = time;
		}
		function dmd(lines: string[], dur = 2, opts: Partial<Dmd> = {}) {
			dmdMsgs.push({ ...opts, lines, until: dur });
			if (dmdMsgs.length > 4) dmdMsgs.shift();
		}
		const fmt = (n: number) => n.toLocaleString('en-US');

		function onEvent(e: PinEvent) {
			switch (e.k) {
				case 'bumper': {
					bumpAt[e.i] = time;
					const chop = time < game.chopperUntil;
					burst(e.x, e.y, chop ? ['#ff3a2a', '#ffd23a'] : ['#ffd23a', '#fff', '#ff8a1a'], 10, 240);
					pop(`+${fmt(e.pts)}`, e.x, e.y - 26, chop ? 16 : 12, chop ? '#ff6a4a' : '#fff6b0');
					blip(chop ? 220 : 520 + e.i * 90, 0.09, 'square', 0.1, 0.6);
					break;
				}
				case 'sling':
					slingAt[e.i] = time;
					burst(e.x, e.y, ['#fff', '#ff5a4a'], 6, 180);
					thud(0.05, 1800, 0.22);
					break;
				case 'flip':
					thud(0.04, 500, 0.3);
					break;
				case 'launch':
					thud(0.12, 300, 0.35);
					blip(160, 0.25, 'sawtooth', 0.06, 3);
					break;
				case 'wall':
					if (e.speed > 900) thud(0.03, 1200, 0.12);
					break;
				case 'lane':
					laneAt[e.i] = time;
					burst(e.x, e.y, [CAMO_COL[e.i], '#fff'], 8, 160);
					pop(`+${fmt(e.pts)}`, e.x, e.y + 34, 12, CAMO_COL[e.i]);
					blip(880 + e.i * 220, 0.12, 'triangle', 0.12);
					break;
				case 'camo': {
					const i = e.level - 1;
					callout(w.camoNames[e.level], CAMO_COL[i], `${w.msg.camoUp}  ${w.msg.bonusX(e.level + 1)}`, 2, e.level === 4 ? 'rainbow' : undefined);
					rain(CAMO_CONFETTI[i], 70);
					flash(CAMO_COL[i], 0.45);
					shake(5);
					dmd([w.msg.camoUp, w.camoNames[e.level]], 2.2, { blink: true });
					pop(`+${fmt(e.pts)}`, 210, 140, 20, CAMO_COL[i]);
					sound.play('maxed');
					arp([523, 659, 784, 1047, 1319]);
					break;
				}
				case 'target':
					targetAt[e.i] = time;
					burst(e.x, e.y, ['#5dff5a', '#fff'], 8, 180);
					pop(`+${fmt(e.pts)}`, e.x, e.y + 22, 11, '#9dff7a');
					blip(330, 0.07, 'square', 0.12, 0.5);
					break;
				case 'holk':
					callout(w.msg.holk, '#7dff5a', w.msg.holkSub, 2.2);
					for (let i = 0; i < 6; i++) burst(60 + Math.random() * 300, 200 + Math.random() * 400, ['rgba(220,255,220,.5)', 'rgba(200,200,220,.45)'], 4, 40, 'smoke');
					flash('#5dff5a', 0.35);
					shake(4);
					dmd([w.msg.holk, w.msg.holkSub], 2.4, { blink: true });
					sound.play('maxed');
					break;
				case 'ramp':
					rampGlowAt = time;
					pop(`+${fmt(e.pts)}`, e.x + 30, e.y, 14, '#ff8a5a');
					blip(300, 0.5, 'sawtooth', 0.07, 4);
					break;
				case 'jackpot':
					rampGlowAt = time;
					callout(w.msg.jackpot, '#ffd23a', fmt(e.pts), 2, 'rainbow');
					rain(['#ffd23a', '#fff6b0', '#ff9a1a'], 60, 'coin');
					flash('#ffd23a', 0.55);
					shake(8);
					dmd([w.msg.jackpot, fmt(e.pts)], 2.4, { invert: true, blink: true });
					sound.play('maxed');
					arp([784, 988, 1175, 1568, 1976, 2349], 0.06);
					break;
				case 'kill':
					dmd([w.msg.kill(e.kills), `${Math.max(0, (STREAKS.find((s) => s.at > e.kills)?.at ?? 10) - e.kills)} TO ${w.streakShort[STREAKS.findIndex((s) => s.at > e.kills)] ?? 'NUKE'}`], 1.6);
					break;
				case 'streak': {
					const name = w.streakNames[e.name];
					if (e.name === 'nuke') {
						nukeAt = time;
						callout(name, '#ffffff', w.msg.nukeSub, 3.4, 'nuke');
						flash('#ffffff', 1);
						shake(16);
						rain(['#ffb02a', '#ff5a1a', '#fff6b0'], 80);
						dmd([name, w.msg.nukeSub], 3.4, { invert: true, blink: true });
						sound.play('divergence');
					} else if (e.name === 'uav') {
						uavAt = time;
						callout(name, '#5dff8a', w.msg.uavSub, 1.8);
						dmd([name, `+${fmt(e.pts)}`], 2);
						blip(1200, 0.3, 'sine', 0.1, 0.5);
					} else if (e.name === 'airstrike') {
						airAt = time;
						callout(name, '#ff8a2a', w.msg.airSub, 2);
						dmd([name, `+${fmt(e.pts)}`], 2.2, { blink: true });
						for (let i = 0; i < 5; i++) setTimeout(() => !done && (burst(60 + Math.random() * 300, 120 + Math.random() * 380, ['#ffb02a', '#ff3a1a', '#fff'], 18, 260, 'boom'), shake(7), thud(0.3, 200, 0.5)), 300 + i * 220);
					} else {
						callout(name, '#ff3a3a', w.msg.chopperSub, 2);
						flash('#ff2a2a', 0.3);
						dmd([name, w.msg.chopperSub], 2.2, { blink: true });
						sound.play('maxed');
					}
					break;
				}
				case 'spinner':
					spinV = Math.min(60, spinV + e.n * 6);
					pop(`+${fmt(e.pts)}`, e.x, e.y - 18, 11, '#5ff0dc');
					for (let i = 0; i < Math.min(e.n, 6); i++) setTimeout(() => blip(1400 + i * 60, 0.03, 'square', 0.05), i * 45);
					break;
				case 'orbit':
					callout(w.msg.orbit, '#5ff0dc', `+${fmt(e.pts)}`, 1.2);
					burst(e.x, e.y, ['#5ff0dc', '#fff'], 14, 220);
					blip(600, 0.35, 'sawtooth', 0.07, 2.5);
					break;
				case 'combo':
					callout(w.msg.combo(e.n), '#ff5cb8', `+${fmt(e.pts)}`, 1.4, 'rainbow');
					dmd([w.msg.combo(e.n), `+${fmt(e.pts)}`], 1.6, { blink: true });
					arp([660, 880, 1100], 0.05);
					break;
				case 'saucer':
					saucerAt = time;
					burst(e.x, e.y, ['#c88aff', '#fff'], 14, 200);
					pop(`+${fmt(e.pts)}`, e.x, e.y - 30, 13, '#e0b0ff');
					if (!game.multiball) dmd([w.msg.lock(e.locks), e.locks < 3 ? `${3 - e.locks} MORE FOR MULTIBALL` : ''], 1.8);
					thud(0.15, 250, 0.4);
					break;
				case 'multiball':
					mbAt = time;
					callout(w.msg.multiball, '#ff5cb8', w.msg.multiballSub, 2.6, 'rainbow');
					flash('#ff5cb8', 0.5);
					shake(8);
					rain(['#ff5cb8', '#5ff0dc', '#ffd23a', '#7dff5a'], 80);
					dmd([w.msg.multiball, w.msg.multiballSub], 3, { invert: true, blink: true });
					sound.play('maxed');
					arp([392, 523, 659, 784, 1047, 784, 1047, 1319], 0.08);
					break;
				case 'eject':
					thud(0.08, 600, 0.3);
					break;
				case 'kickback':
					callout(w.msg.kickback, '#ffcc66', undefined, 1);
					burst(40, 700, ['#ffcc66', '#fff'], 14, 260);
					shake(6);
					thud(0.2, 220, 0.5);
					break;
				case 'skill':
					callout(w.msg.skill, '#ffd23a', `+${fmt(e.pts)}`, 1.6, 'rainbow');
					burst(e.x, e.y, ['#ffd23a', '#fff'], 20, 260, 'star');
					dmd([w.msg.skill, `+${fmt(e.pts)}`], 2, { blink: true });
					sound.play('maxed');
					break;
				case 'saved':
					callout(w.msg.saved, '#7dd8ff', w.msg.shootAgain, 1.4);
					dmd([w.msg.saved], 1.4);
					blip(700, 0.2, 'triangle', 0.1, 1.5);
					break;
				case 'drain':
					blip(300, 0.5, 'sawtooth', 0.08, 0.3);
					if (e.last) dmd([w.msg.drain], 1);
					break;
				case 'bonus':
					bonusShow = { base: e.base, mult: e.mult, total: e.total, t0: time };
					call = null;
					if (e.tilted) dmd([w.msg.tilt, 'NO BONUS'], 2.6);
					break;
				case 'extra':
					callout(w.msg.extra, '#7dff5a', w.msg.shootAgain, 2, 'rainbow');
					flash('#7dff5a', 0.4);
					dmd([w.msg.extra, w.msg.shootAgain], 2.4, { blink: true });
					sound.play('maxed');
					break;
				case 'warn':
					dmd([w.msg.warn, w.msg.warn], 1.2, { blink: true, invert: true });
					blip(180, 0.3, 'square', 0.12);
					shake(3);
					break;
				case 'tilt':
					tiltAt = time;
					callout(w.msg.tilt, '#ff2a2a', undefined, 2.4);
					dmd([w.msg.tilt], 3, { blink: true });
					blip(110, 0.8, 'square', 0.15, 0.7);
					break;
				case 'ballStart':
					dmd([w.msg.ballStart(e.ball), w.msg.skillLit(LANE_NAMES[game.skillLane])], 2.6);
					break;
				case 'over':
					overAt = time;
					dmd([w.msg.over, fmt(e.score)], 9, { blink: true });
					callout(w.msg.over, '#ff5a4a', fmt(e.score), 3);
					break;
			}
		}

		/* drawing helpers */
		function T() {
			ctx.setTransform(scale, 0, 0, scale, shakeX * scale, shakeY * scale);
		}
		function glow(x: number, y: number, r: number, col: string, a = 1) {
			ctx.globalAlpha = a;
			ctx.fillStyle = rg(ctx, x, y, r, [
				[0, col],
				[1, 'rgba(0,0,0,0)']
			]);
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
			ctx.globalAlpha = 1;
		}
		function insert(x: number, y: number, r: number, col: string, on: boolean, blink = false, label?: string, shape: 'circle' | 'arrow' | 'diamond' = 'circle', rot = 0) {
			const lit = on || (blink && Math.floor(time * 4) % 2 === 0);
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rot);
			const p = new Path2D();
			if (shape === 'circle') p.arc(0, 0, r, 0, Math.PI * 2);
			else if (shape === 'diamond') {
				p.moveTo(0, -r);
				p.lineTo(r * 0.8, 0);
				p.lineTo(0, r);
				p.lineTo(-r * 0.8, 0);
				p.closePath();
			} else {
				p.moveTo(0, -r * 1.2);
				p.lineTo(r, r * 0.4);
				p.lineTo(r * 0.4, r * 0.4);
				p.lineTo(r * 0.4, r);
				p.lineTo(-r * 0.4, r);
				p.lineTo(-r * 0.4, r * 0.4);
				p.lineTo(-r, r * 0.4);
				p.closePath();
			}
			if (lit) {
				ctx.restore();
				glow(x, y, r * 2.6, col, 0.55);
				ctx.save();
				ctx.translate(x, y);
				ctx.rotate(rot);
			}
			ctx.fillStyle = lit
				? rg(ctx, 0, 0, r * 1.2, [
						[0, '#fff'],
						[0.35, col],
						[1, col]
					])
				: 'rgba(30,24,40,.85)';
			ctx.fill(p);
			ctx.strokeStyle = lit ? 'rgba(255,255,255,.7)' : col;
			ctx.globalAlpha = lit ? 1 : 0.5;
			ctx.lineWidth = 1.4;
			ctx.stroke(p);
			ctx.globalAlpha = 1;
			if (label) {
				ctx.rotate(-rot);
				ctx.font = `900 ${Math.round(r * 0.95)}px ${FONT}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = lit ? '#1a0606' : col;
				ctx.globalAlpha = lit ? 1 : 0.65;
				ctx.fillText(label, 0, 0.5);
				ctx.globalAlpha = 1;
			}
			ctx.restore();
		}
		function text(s: string, x: number, y: number, size: number, fill: string | CanvasGradient, stroke = O, weight = 900) {
			ctx.font = `${weight} ${size}px ${FONT}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.lineJoin = 'round';
			ctx.lineWidth = Math.max(3, size * 0.18);
			ctx.strokeStyle = stroke;
			ctx.strokeText(s, x, y);
			ctx.fillStyle = fill;
			ctx.fillText(s, x, y);
		}

		function drawInserts() {
			const holkLeft = game.holkUntil - game.time;
			// lanes
			for (let i = 0; i < 3; i++) {
				const x = (DIVIDERS[i] + DIVIDERS[i + 1]) / 2;
				const skill = (game.phase === 'ready' || game.balls.some((b) => b.skill)) && i === game.skillLane;
				insert(x, 100, 9, CAMO_COL[Math.min(i, 3)], game.lanes[i] || time - laneAt[i] < 0.25, skill);
			}
			// camo ladder
			INSERTS.camo.forEach((p, i) => insert(p.x, p.y, 10, CAMO_COL[i], game.camo > i, game.camo === i, w.camoShort[i], 'diamond'));
			// killstreak ladder
			INSERTS.kills.forEach((p, i) => {
				const s = STREAKS[i];
				const lit = game.kills >= s.at;
				const next = !lit && (i === 0 || game.kills >= STREAKS[i - 1].at);
				insert(p.x, p.y, 10, i === 3 ? '#ffb02a' : '#ff5a3a', lit, next, w.streakShort[i].slice(0, i === 3 ? 4 : 3), 'circle');
			});
			// kill pips under the ladder
			for (let k = 0; k < 10; k++) insert(78 + (k % 5) * 13, 492 + Math.floor(k / 5) * 12, 3.6, '#ff5a3a', k < game.kills);
			// shot arrows
			insert(INSERTS.ramp.x, INSERTS.ramp.y, 9, game.multiball ? '#ffd23a' : '#ff8a5a', time - rampGlowAt < 0.4, true, undefined, 'arrow');
			insert(INSERTS.orbit.x, INSERTS.orbit.y, 9, '#5ff0dc', time - game.balls.reduce((m, b) => Math.max(m, b.orbitAt), -99) < 1.4, true, undefined, 'arrow');
			// holk time
			insert(INSERTS.holk.x, INSERTS.holk.y + 2, 9, '#7dff5a', holkLeft > 3, holkLeft > 0 && holkLeft <= 3, '2×');
			// stash locks
			INSERTS.locks.forEach((p, i) => insert(p.x, p.y, 5, '#c88aff', game.multiball || game.locks > i, game.locks === i && !game.multiball));
			// kickback, shoot again
			insert(INSERTS.kick.x, INSERTS.kick.y, 8, '#ffcc66', game.kickback, false, 'K');
			const saveLeft = game.saveUntil - game.time;
			insert(INSERTS.again.x, INSERTS.again.y - 12, 7, '#ff6a5a', saveLeft > 2, saveLeft > 0 && saveLeft <= 2);
		}

		function drawBumpers() {
			const chop = time < game.chopperUntil;
			BUMPERS.forEach((b, i) => {
				const k = time - bumpAt[i];
				const hit = k < 0.18;
				const s = hit && !reduce ? 1 + 0.15 * Math.sin((k / 0.18) * Math.PI) : 1;
				if (hit || chop) glow(b.x, b.y, b.r * 2.4, chop ? '#ff2a2a' : '#ffd23a', hit ? 0.9 : 0.35 + 0.15 * Math.sin(time * 8));
				// skirt
				ctx.fillStyle = '#1a0a04';
				ctx.beginPath();
				ctx.arc(b.x + 2, b.y + 3, b.r + 2, 0, Math.PI * 2);
				ctx.fill();
				// burger bumper: bun ring, patty, red cap with a ring of sesame
				ctx.fillStyle = lg(ctx, b.x, b.y - b.r, b.x, b.y + b.r, [
					[0, '#f9c56a'],
					[1, '#a4531a']
				]);
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.r * s, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = O;
				ctx.lineWidth = 2.5;
				ctx.stroke();
				ctx.fillStyle = '#5a2e14';
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.r * 0.8 * s, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = '#4fb23a';
				ctx.beginPath();
				for (let t = 0; t < 12; t++) {
					const a = (t / 12) * Math.PI * 2;
					const rr = b.r * (t % 2 ? 0.72 : 0.82) * s;
					ctx.lineTo(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr);
				}
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = hit
					? rg(ctx, b.x - 4, b.y - 4, b.r * 0.7, [
							[0, '#fff'],
							[1, '#ffd23a']
						])
					: rg(ctx, b.x - 4, b.y - 4, b.r * 0.7, [
							[0, chop ? '#ff9a8a' : '#ff6a5a'],
							[1, chop ? '#8a0000' : '#b0141a']
						]);
				ctx.beginPath();
				ctx.arc(b.x, b.y, b.r * 0.62 * s, 0, Math.PI * 2);
				ctx.fill();
				ctx.strokeStyle = O;
				ctx.lineWidth = 2;
				ctx.stroke();
				ctx.fillStyle = '#fff6d0';
				for (let t = 0; t < 6; t++) {
					const a = (t / 6) * Math.PI * 2 + 0.3;
					ctx.beginPath();
					ctx.ellipse(b.x + Math.cos(a) * b.r * 0.38, b.y + Math.sin(a) * b.r * 0.38, 1.6, 1, a, 0, Math.PI * 2);
					ctx.fill();
				}
				text('100', b.x, b.y + 1, 7, hit ? '#1a0606' : '#fff', 'rgba(0,0,0,.4)');
			});
		}

		function drawSlings() {
			SLINGS.forEach((s, i) => {
				const k = time - slingAt[i];
				const bulge = k < 0.12 && !reduce ? 6 * Math.sin((k / 0.12) * Math.PI) : 0;
				const mx = (s.a.x + s.c.x) / 2;
				const my = (s.a.y + s.c.y) / 2;
				const nx = (s.c.y - s.a.y) * (i === 0 ? 1 : -1);
				const ny = -(s.c.x - s.a.x) * (i === 0 ? 1 : -1);
				const l = Math.hypot(nx, ny);
				if (k < 0.2) glow(mx, my, 30, '#ff5a4a', 1 - k / 0.2);
				ctx.strokeStyle = '#fff';
				ctx.lineWidth = 4;
				ctx.beginPath();
				ctx.moveTo(s.a.x, s.a.y);
				ctx.quadraticCurveTo(mx + (nx / l) * bulge, my + (ny / l) * bulge, s.c.x, s.c.y);
				ctx.lineTo(s.b.x, s.b.y);
				ctx.closePath();
				ctx.stroke();
				for (const p of [s.a, s.b, s.c]) {
					ctx.fillStyle = '#d8dee8';
					ctx.beginPath();
					ctx.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
					ctx.fill();
				}
			});
		}

		function drawTargets() {
			TARGET_X.forEach((x, i) => {
				const up = game.targets[i];
				const k = time - targetAt[i];
				if (!up && k > 0.15) return;
				const drop = up ? 0 : k / 0.15;
				const h = 12 * (1 - drop);
				const y = TARGET_Y - h / 2;
				ctx.fillStyle = lg(ctx, 0, y - h / 2, 0, y + h / 2, [
					[0, '#9dff7a'],
					[1, '#1f8a1a']
				]);
				ctx.fillRect(x - TARGET_W / 2 + 2, y - h / 2, TARGET_W - 4, h);
				ctx.strokeStyle = O;
				ctx.lineWidth = 2;
				ctx.strokeRect(x - TARGET_W / 2 + 2, y - h / 2, TARGET_W - 4, h);
				if (h > 6) text(TARGET_NAMES[i], x, y, 10, '#0a2a06', 'rgba(255,255,255,.6)');
			});
		}

		function drawSaucer() {
			const k = time - saucerAt;
			const held = game.balls.some((b) => b.held !== undefined);
			if (held || k < 0.5) {
				ctx.strokeStyle = `rgba(200,138,255,${held ? 0.5 + 0.5 * Math.sin(time * 14) : 1 - k / 0.5})`;
				ctx.lineWidth = 3;
				ctx.beginPath();
				ctx.arc(SAUCER.x, SAUCER.y, SAUCER.r + 6 + (held ? 0 : k * 30), 0, Math.PI * 2);
				ctx.stroke();
			}
		}

		function drawSpinner() {
			const cx = (ORBIT_X + LANE_X) / 2;
			const y = 382;
			const s = Math.cos(spinA);
			ctx.fillStyle = '#4a5260';
			ctx.fillRect(ORBIT_X + 2, y - 1.5, LANE_X - ORBIT_X - 4, 3);
			ctx.fillStyle = lg(ctx, 0, y - 8, 0, y + 8, [
				[0, '#f4f6fa'],
				[1, '#7a8494']
			]);
			const hgt = Math.max(1.5, Math.abs(s) * 9);
			ctx.fillRect(cx - 16, y - hgt / 2, 32, hgt);
			if (Math.abs(s) > 0.4) {
				ctx.font = `900 7px ${FONT}`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = '#ff3a2a';
				ctx.fillText(s > 0 ? 'SPIN' : 'NIPS', cx, y + 0.5);
			}
		}

		function drawFlippers() {
			FLIPPERS.forEach((f, i) => {
				const a = game.flip[i].a;
				const tip = flipperTip(i, a);
				const dx = Math.cos(a);
				const dy = Math.sin(a);
				const nx = -dy;
				const ny = dx;
				const p = new Path2D();
				p.moveTo(f.p.x + nx * 11, f.p.y + ny * 11);
				p.lineTo(tip.x + nx * 6, tip.y + ny * 6);
				p.arc(tip.x, tip.y, 6, a + Math.PI / 2, a - Math.PI / 2, true);
				p.lineTo(f.p.x - nx * 11, f.p.y - ny * 11);
				p.arc(f.p.x, f.p.y, 11, a - Math.PI / 2, a + Math.PI / 2, true);
				p.closePath();
				ctx.fillStyle = 'rgba(0,0,0,.4)';
				ctx.save();
				ctx.translate(3, 4);
				ctx.fill(p);
				ctx.restore();
				ctx.fillStyle = game.tilted ? '#555' : lg(ctx, f.p.x, f.p.y - 10, f.p.x, f.p.y + 10, [
					[0, '#ffffff'],
					[0.6, '#d8dee8'],
					[1, '#8a94a4']
				]);
				ctx.fill(p);
				ctx.strokeStyle = game.tilted ? '#333' : '#d0141a';
				ctx.lineWidth = 3;
				ctx.stroke(p);
				ctx.fillStyle = '#d0141a';
				ctx.beginPath();
				ctx.arc(f.p.x, f.p.y, 4, 0, Math.PI * 2);
				ctx.fill();
			});
		}

		function drawPlunger() {
			const pull = game.plunger;
			const top = PLUNGER_Y + pull * 22;
			const x0 = LANE_X + 4;
			const x1 = 400 - 4;
			// spring
			ctx.strokeStyle = '#b0b8c4';
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			const coils = 7;
			for (let k = 0; k <= coils * 2; k++) {
				const y = top + 6 + (k / (coils * 2)) * (H - top - 6);
				ctx.lineTo(k % 2 ? x1 - 3 : x0 + 3, y);
			}
			ctx.stroke();
			ctx.fillStyle = lg(ctx, x0, 0, x1, 0, [
				[0, '#7a1010'],
				[0.5, '#ff4a3a'],
				[1, '#7a1010']
			]);
			ctx.fillRect(x0, top, x1 - x0, 7);
			ctx.strokeStyle = O;
			ctx.lineWidth = 1.5;
			ctx.strokeRect(x0, top, x1 - x0, 7);
			if (game.balls.some((b) => b.lane) && game.phase !== 'bonus' && game.phase !== 'over') {
				const a = 0.5 + 0.5 * Math.sin(time * 6);
				ctx.globalAlpha = a;
				text('▲', (LANE_X + 400) / 2, 660, 14, '#ffd23a');
				ctx.globalAlpha = 1;
				// power meter
				ctx.fillStyle = 'rgba(0,0,0,.6)';
				ctx.fillRect(LANE_X + 6, 560, 400 - LANE_X - 12, 80);
				ctx.fillStyle = lg(ctx, 0, 640, 0, 560, [
					[0, '#5dff5a'],
					[0.6, '#ffd23a'],
					[1, '#ff3a2a']
				]);
				const hgt = 80 * pull;
				ctx.fillRect(LANE_X + 6, 640 - hgt, 400 - LANE_X - 12, hgt);
			}
		}

		function drawBall(x: number, y: number, onRamp = false) {
			ctx.fillStyle = 'rgba(0,0,0,.45)';
			ctx.beginPath();
			ctx.ellipse(x + (onRamp ? 6 : 3), y + (onRamp ? 8 : 4), R, R * 0.85, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = rg(ctx, x, y, R, [
				[0, '#ffffff'],
				[0.25, '#dfe6ee'],
				[0.7, '#7a8696'],
				[1, '#2a303a']
			], x - 3.5, y - 4);
			ctx.beginPath();
			ctx.arc(x, y, R, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = 'rgba(0,0,0,.6)';
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.fillStyle = 'rgba(255,90,60,.55)';
			ctx.beginPath();
			ctx.ellipse(x + 2.5, y + 4, 4, 1.8, -0.3, 0, Math.PI * 2);
			ctx.fill();
		}

		function drawRamp() {
			const pts = rampSpline(48);
			const glowK = Math.max(0, 1 - (time - rampGlowAt) / 0.9);
			const jp = game.multiball;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			const path = polyPath(pts);
			ctx.strokeStyle = 'rgba(0,0,0,.35)';
			ctx.lineWidth = 22;
			ctx.save();
			ctx.translate(5, 7);
			ctx.stroke(path);
			ctx.restore();
			ctx.strokeStyle = jp ? `rgba(255,210,58,${0.35 + 0.15 * Math.sin(time * 6)})` : 'rgba(255,60,40,.28)';
			ctx.lineWidth = 20;
			ctx.stroke(path);
			if (glowK > 0) {
				ctx.strokeStyle = `rgba(255,220,120,${glowK * 0.6})`;
				ctx.lineWidth = 30;
				ctx.stroke(path);
			}
			ctx.strokeStyle = 'rgba(255,255,255,.55)';
			ctx.lineWidth = 2;
			for (const off of [-9.5, 9.5]) {
				ctx.beginPath();
				pts.forEach((p, i) => {
					const q = pts[Math.min(pts.length - 1, i + 1)];
					const r0 = pts[Math.max(0, i - 1)];
					const dx = q.x - r0.x;
					const dy = q.y - r0.y;
					const l = Math.hypot(dx, dy) || 1;
					const x = p.x + (-dy / l) * off;
					const y = p.y + (dx / l) * off;
					if (i) ctx.lineTo(x, y);
					else ctx.moveTo(x, y);
				});
				ctx.stroke();
			}
			// chevrons running along it
			if (!reduce) {
				const n = 7;
				for (let k = 0; k < n; k++) {
					const t = ((time * 0.25 + k / n) % 1) * 0.92;
					const p = rampPoint(t);
					const q = rampPoint(t + 0.01);
					const a = Math.atan2(q.y - p.y, q.x - p.x);
					ctx.save();
					ctx.translate(p.x, p.y);
					ctx.rotate(a);
					ctx.strokeStyle = jp ? 'rgba(255,230,120,.75)' : 'rgba(255,170,140,.5)';
					ctx.lineWidth = 2.5;
					ctx.beginPath();
					ctx.moveTo(-4, -6);
					ctx.lineTo(3, 0);
					ctx.lineTo(-4, 6);
					ctx.stroke();
					ctx.restore();
				}
			}
		}

		function drawBits(dt: number) {
			for (let i = bits.length - 1; i >= 0; i--) {
				const b = bits[i];
				b.life += dt;
				if (b.life >= b.max) {
					bits.splice(i, 1);
					continue;
				}
				if (b.kind === 'confetti' || b.kind === 'coin') {
					b.vy += 220 * dt;
					b.vx *= 1 - 0.8 * dt;
				} else if (b.kind === 'smoke') {
					b.vy -= 20 * dt;
					b.r += 12 * dt;
				} else if (b.kind === 'spark' || b.kind === 'boom') b.vy += 300 * dt;
				else {
					b.vx *= 1 - 3 * dt;
					b.vy *= 1 - 3 * dt;
				}
				b.x += b.vx * dt;
				b.y += b.vy * dt;
				b.rot += b.vr * dt;
				const k = 1 - b.life / b.max;
				ctx.globalAlpha = Math.min(1, k * 1.6);
				if (b.kind === 'confetti') {
					ctx.save();
					ctx.translate(b.x, b.y);
					ctx.rotate(b.rot);
					ctx.scale(1, Math.cos(b.rot * 2));
					ctx.fillStyle = b.color;
					ctx.fillRect(-b.r, -b.r * 0.5, b.r * 2, b.r);
					ctx.restore();
				} else if (b.kind === 'coin') {
					ctx.save();
					ctx.translate(b.x, b.y);
					ctx.scale(Math.cos(b.rot), 1);
					ctx.fillStyle = b.color;
					ctx.beginPath();
					ctx.arc(0, 0, b.r, 0, Math.PI * 2);
					ctx.fill();
					ctx.strokeStyle = '#8a4a00';
					ctx.lineWidth = 1.2;
					ctx.stroke();
					ctx.restore();
				} else if (b.kind === 'smoke') {
					ctx.globalAlpha = k * 0.5;
					glow(b.x, b.y, b.r, b.color, k * 0.6);
				} else if (b.kind === 'star') {
					ctx.save();
					ctx.translate(b.x, b.y);
					ctx.rotate(b.rot);
					ctx.fillStyle = b.color;
					ctx.beginPath();
					for (let t = 0; t < 10; t++) {
						const a = (t / 10) * Math.PI * 2;
						const rr = t % 2 ? 2.5 : 6;
						ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
					}
					ctx.closePath();
					ctx.fill();
					ctx.restore();
				} else if (b.kind === 'boom') {
					glow(b.x, b.y, 6 + (1 - k) * 18, b.color, k);
				} else {
					ctx.strokeStyle = b.color;
					ctx.lineWidth = b.r;
					ctx.beginPath();
					ctx.moveTo(b.x, b.y);
					ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
					ctx.stroke();
				}
				ctx.globalAlpha = 1;
			}
		}

		function drawPops() {
			for (let i = pops.length - 1; i >= 0; i--) {
				const p = pops[i];
				const k = (time - p.t0) / 0.9;
				if (k >= 1) {
					pops.splice(i, 1);
					continue;
				}
				ctx.globalAlpha = Math.min(1, (1 - k) * 2);
				const s = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : 1.1 - (k - 0.15) * 0.1;
				text(p.text, p.x, p.y - k * 30, p.size * s, p.color);
				ctx.globalAlpha = 1;
			}
		}

		function rainbow(x0: number, x1: number): CanvasGradient {
			const g = ctx.createLinearGradient(x0, 0, x1, 0);
			const off = (time * 0.6) % 1;
			const cols = ['#ff3a4a', '#ffd23a', '#7dff5a', '#5ff0dc', '#7a8aff', '#ff5cb8', '#ff3a4a'];
			cols.forEach((c, i) => g.addColorStop(((i / (cols.length - 1)) + off) % 1, c));
			return g;
		}

		function drawCall() {
			if (!call) return;
			const k = (time - call.t0) / call.dur;
			if (k >= 1) {
				call = null;
				return;
			}
			const inK = Math.min(1, (time - call.t0) / 0.18);
			const s = reduce ? 1 : inK < 1 ? 0.3 + inK * 0.85 : 1.15 - Math.min(0.15, (time - call.t0 - 0.18) * 0.6);
			const a = k > 0.8 ? (1 - k) / 0.2 : 1;
			const y = 300;
			ctx.globalAlpha = a * 0.55;
			ctx.fillStyle = '#05030a';
			ctx.fillRect(20, y - 44, 380, call.sub ? 96 : 76);
			ctx.globalAlpha = a;
			ctx.save();
			ctx.translate(210, y);
			ctx.scale(s, s);
			const size = call.text.length > 12 ? 30 : 42;
			const fill = call.style === 'rainbow' ? rainbow(-150, 150) : call.color;
			glow(0, 0, 150, call.color, 0.25 * a);
			if (call.style === 'nuke') {
				const pulse = Math.floor(time * 6) % 2;
				text(call.text, 0, 0, size, pulse ? '#ffffff' : '#ffd23a', '#3a0000');
			} else text(call.text, 0, 0, size, fill);
			if (call.sub) text(call.sub, 0, size * 0.9, 15, '#fff6e0', O, 800);
			ctx.restore();
			ctx.globalAlpha = 1;
		}

		function drawNuke() {
			const k = time - nukeAt;
			if (k > 3.4 || reduce) return;
			// a mushroom cloud rising from behind the bumpers
			const rise = Math.min(1, k / 1.4);
			const fade = k > 2.4 ? 1 - (k - 2.4) : 1;
			ctx.globalAlpha = Math.max(0, fade) * 0.85;
			const bx = 210;
			const by = 520 - rise * 120;
			ctx.fillStyle = lg(ctx, 0, by, 0, 600, [
				[0, '#ffb02a'],
				[1, 'rgba(255,90,20,0)']
			]);
			ctx.fillRect(bx - 18, by, 36, 600 - by);
			for (let t = 0; t < 9; t++) {
				const a = (t / 9) * Math.PI * 2 + time;
				glow(bx + Math.cos(a) * 46 * rise, by - 20 + Math.sin(a) * 22 * rise, 46 * rise + 10, t % 2 ? '#ff7a1a' : '#ffd27a', 0.8);
			}
			ctx.globalAlpha = 1;
		}

		function drawUav() {
			const k = time - uavAt;
			if (k > 1.8 || reduce) return;
			const r = k * 520;
			ctx.strokeStyle = `rgba(93,255,138,${1 - k / 1.8})`;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(210, 380, r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(210, 380, r * 0.6, 0, Math.PI * 2);
			ctx.stroke();
		}

		function drawHolkSmoke() {
			const left = game.holkUntil - game.time;
			if (left <= 0) return;
			const a = Math.min(1, left / 2) * 0.16;
			ctx.fillStyle = `rgba(120,255,120,${a})`;
			ctx.fillRect(0, 0, W, H);
			if (!reduce && Math.random() < 0.12) burst(40 + Math.random() * 340, 740, ['rgba(210,255,210,.35)'], 1, 30, 'smoke');
		}

		function drawBonus() {
			if (!bonusShow) return;
			const k = time - bonusShow.t0;
			if (k > 2.6) {
				bonusShow = null;
				return;
			}
			ctx.fillStyle = 'rgba(5,3,10,.72)';
			ctx.fillRect(40, 230, 340, 170);
			ctx.strokeStyle = '#ffb02a';
			ctx.lineWidth = 3;
			ctx.strokeRect(40, 230, 340, 170);
			const base = Math.round(bonusShow.base * Math.min(1, k / 0.9));
			text(w.msg.bonus, 210, 260, 22, '#ffd23a');
			text(fmt(base), 210, 300, 26, '#fff');
			if (k > 1) text(`× ${bonusShow.mult}`, 210, 334, 22, CAMO_COL[Math.max(0, bonusShow.mult - 2)] ?? '#fff');
			if (k > 1.5) {
				const tot = Math.round(bonusShow.total * Math.min(1, (k - 1.5) / 0.6));
				text(`= ${fmt(tot)}`, 210, 372, 28, rainbow(80, 340));
			}
			if (Math.floor(k * 18) !== Math.floor((k - 1 / 60) * 18) && k < 2.1) blip(900 + (k * 400), 0.03, 'square', 0.05);
		}

		function render(dt: number) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, cv.width, cv.height);
			const sk = time - shakeAt;
			if (sk < 0.4) {
				const a = shakeAmp * (1 - sk / 0.4);
				shakeX = (Math.random() - 0.5) * 2 * a;
				shakeY = (Math.random() - 0.5) * 2 * a;
			} else shakeX = shakeY = 0;
			T();
			if (field) ctx.drawImage(field, 0, 0, W, H);
			if (time - tiltAt < 2.4 || game.tilted) {
				ctx.fillStyle = 'rgba(0,0,0,.45)';
				ctx.fillRect(0, 0, W, H);
			}
			if (!game.tilted) drawInserts();
			drawSaucer();
			drawSpinner();
			drawTargets();
			drawSlings();
			drawBumpers();
			drawPlunger();
			drawFlippers();
			// balls on the table, with a trail when fast
			for (const b of game.balls) {
				if (b.ramp !== undefined) continue;
				const tr = trails.get(b.id) ?? [];
				const sp = Math.hypot(b.vx, b.vy);
				if (!reduce && sp > 900) {
					tr.forEach((p, i) => {
						ctx.globalAlpha = ((i + 1) / tr.length) * 0.25;
						ctx.fillStyle = time < game.holkUntil ? '#9dff7a' : '#ffb07a';
						ctx.beginPath();
						ctx.arc(p.x, p.y, R * (0.5 + (i / tr.length) * 0.5), 0, Math.PI * 2);
						ctx.fill();
					});
					ctx.globalAlpha = 1;
				}
				drawBall(b.x, b.y);
			}
			drawRamp();
			for (const b of game.balls) if (b.ramp !== undefined) drawBall(b.x, b.y, true);
			drawHolkSmoke();
			drawBits(dt);
			drawNuke();
			drawUav();
			drawPops();
			drawCall();
			drawBonus();
			// screen flash
			const fk = time - flashAt;
			if (fk < 0.5) {
				ctx.setTransform(scale, 0, 0, scale, 0, 0);
				ctx.globalAlpha = flashMax * (1 - fk / 0.5);
				ctx.fillStyle = flashCol;
				ctx.fillRect(0, 0, W, H);
				ctx.globalAlpha = 1;
			}
			if (paused && !done) {
				ctx.setTransform(scale, 0, 0, scale, 0, 0);
				ctx.fillStyle = 'rgba(0,0,0,.6)';
				ctx.fillRect(0, 0, W, H);
				text(w.paused, 210, 340, 40, '#ffd23a');
				text(w.resume, 210, 384, 13, '#fff', O, 700);
			}
		}

		/* ---------- the dot-matrix display ---------- */
		const DW = 128;
		const DH = 32;
		const [dsrc, dsc] = canvasOf(DW, DH, 1);
		let dmdKey = '';
		function dmdContent(): { lines: string[]; invert: boolean; blink: boolean; big: boolean } {
			while (dmdMsgs.length && dmdMsgs[0].until <= 0) dmdMsgs.shift();
			const m = dmdMsgs[0];
			if (m) return { lines: m.lines, invert: !!m.invert, blink: !!m.blink, big: false };
			const n = Math.round(shownScore);
			const sub = game.phase === 'ready' ? w.msg.pull : `${w.ball} ${game.ball}   ${w.camoNames[game.camo]}`;
			return { lines: [fmt(n), sub], invert: false, blink: false, big: true };
		}
		function drawDmd(dt: number) {
			if (dmdMsgs[0]) dmdMsgs[0].until -= dt;
			const c = dmdContent();
			const on = !c.blink || Math.floor(time * 5) % 2 === 0;
			const key = `${c.lines.join('|')}|${c.invert}|${on}`;
			if (key !== dmdKey) {
				dmdKey = key;
				dsc.setTransform(1, 0, 0, 1, 0, 0);
				dsc.fillStyle = c.invert && on ? '#fff' : '#000';
				dsc.fillRect(0, 0, DW, DH);
				if (on || !c.blink) {
					dsc.fillStyle = c.invert && on ? '#000' : '#fff';
					dsc.textAlign = 'center';
					dsc.textBaseline = 'middle';
					const [a, b] = c.lines;
					const big = c.big ? 17 : 13;
					dsc.font = `900 ${big}px ${FONT}`;
					let wA = dsc.measureText(a).width;
					if (wA > DW - 4) dsc.font = `900 ${Math.floor((big * (DW - 4)) / wA)}px ${FONT}`;
					dsc.fillText(a, DW / 2, b ? (c.big ? 12 : 10) : DH / 2);
					if (b) {
						dsc.font = `700 9px ${FONT}`;
						wA = dsc.measureText(b).width;
						if (wA > DW - 4) dsc.font = `700 ${Math.max(6, Math.floor((9 * (DW - 4)) / wA))}px ${FONT}`;
						dsc.fillText(b, DW / 2, 26);
					}
				}
				// dots
				const data = dsc.getImageData(0, 0, DW, DH).data;
				const pw = dcv.width / DW;
				dctx.setTransform(1, 0, 0, 1, 0, 0);
				dctx.fillStyle = '#0c0402';
				dctx.fillRect(0, 0, dcv.width, dcv.height);
				for (let y = 0; y < DH; y++)
					for (let x = 0; x < DW; x++) {
						const v = data[(y * DW + x) * 4];
						dctx.fillStyle = v > 110 ? '#ffb04a' : '#2a1006';
						dctx.beginPath();
						dctx.arc((x + 0.5) * pw, (y + 0.5) * pw, pw * 0.38, 0, Math.PI * 2);
						dctx.fill();
					}
			}
		}

		/* ---------- loop ---------- */
		function resize() {
			const cssW = cv.clientWidth;
			if (!cssW) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const pw = Math.round(cssW * dpr);
			if (pw !== cv.width || !field) {
				cv.width = pw;
				cv.height = Math.round((pw * H) / W);
				scale = pw / W;
				const [f, fc] = canvasOf(W, H, scale);
				playfield(fc);
				field = f;
			}
			const dw = Math.round((dcv.clientWidth || 256) * dpr);
			if (dw !== dcv.width) {
				dcv.width = dw;
				dcv.height = Math.round(dw / 4);
				dmdKey = '';
			}
		}

		let raf = 0;
		let last = performance.now();
		let hudAt = 0;
		function frame(now: number) {
			const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
			last = now;
			if (!paused && !done) {
				time += dt;
				game.update(dt);
				for (const e of game.take()) onEvent(e);
				spinA += spinV * dt;
				spinV *= 1 - 1.6 * dt;
				for (const b of game.balls) {
					const tr = trails.get(b.id) ?? [];
					tr.push({ x: b.x, y: b.y });
					if (tr.length > 7) tr.shift();
					trails.set(b.id, tr);
				}
				shownScore += (game.score - shownScore) * Math.min(1, dt * 10);
				if (Math.abs(game.score - shownScore) < 1) shownScore = game.score;
				if (overAt >= 0 && time - overAt > 2.2) {
					done = true;
					end(Math.max(0, Math.round(game.score)));
				}
			}
			render(paused ? 0 : dt);
			drawDmd(paused ? 0 : dt);
			if (now - hudAt > 120) {
				hudAt = now;
				hud = {
					score: Math.round(shownScore),
					ball: game.ball,
					of: game.ball + game.left,
					camo: game.camo,
					kills: game.kills,
					locks: game.locks,
					holk: Math.max(0, game.holkUntil - game.time) / HOLK_TIME,
					kick: game.kickback,
					mb: game.multiball,
					extra: game.left
				};
			}
			if (!done) raf = requestAnimationFrame(frame);
		}

		/* ---------- input ---------- */
		function resume() {
			paused = false;
			last = performance.now();
		}
		function press(k: Control, down: boolean) {
			if (done) return;
			if (paused) {
				if (down) resume();
				return;
			}
			audio();
			if (k === 'left') game.setFlipper(0, down);
			else if (k === 'right') game.setFlipper(1, down);
			else if (k === 'plunger') game.setPlunger(down);
			else if (down) {
				game.nudge();
				shake(5);
			}
		}
		ctl.press = press;
		const KEYS: Record<string, Control> = {
			ArrowLeft: 'left',
			z: 'left',
			Z: 'left',
			ArrowRight: 'right',
			m: 'right',
			M: 'right',
			'/': 'right',
			'-': 'right',
			' ': 'plunger',
			ArrowDown: 'plunger',
			Enter: 'plunger',
			ArrowUp: 'nudge',
			x: 'nudge',
			X: 'nudge'
		};
		const editable = (t: EventTarget | null) => t instanceof HTMLElement && t !== el && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName) && !el.contains(t));
		function keyOf(e: KeyboardEvent): Control | undefined {
			if (e.code === 'ShiftLeft') return 'left';
			if (e.code === 'ShiftRight') return 'right';
			return KEYS[e.key];
		}
		function onKey(e: KeyboardEvent) {
			if (done || editable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
			const k = keyOf(e);
			if (!k) {
				if (paused && !e.repeat) resume();
				return;
			}
			e.preventDefault();
			if (e.repeat) return;
			press(k, true);
		}
		function onKeyUp(e: KeyboardEvent) {
			const k = keyOf(e);
			if (!k || done) return;
			e.preventDefault();
			press(k, false);
		}
		const pointers = new Map<number, Control>();
		function onDown(e: PointerEvent) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			e.preventDefault();
			el.focus({ preventScroll: true });
			if (paused) {
				resume();
				return;
			}
			const r = cv.getBoundingClientRect();
			const tx = ((e.clientX - r.left) / r.width) * W;
			const ty = ((e.clientY - r.top) / r.height) * H;
			const k: Control = game.balls.some((b) => b.lane) && tx > 320 && ty > 520 ? 'plunger' : tx < W / 2 ? 'left' : 'right';
			pointers.set(e.pointerId, k);
			try {
				cv.setPointerCapture(e.pointerId);
			} catch {
				/* synthetic events */
			}
			press(k, true);
		}
		function onUp(e: PointerEvent) {
			const k = pointers.get(e.pointerId);
			if (!k) return;
			pointers.delete(e.pointerId);
			if (![...pointers.values()].includes(k)) press(k, false);
		}
		function pauseNow() {
			if (done) return;
			paused = true;
			game.setFlipper(0, false);
			game.setFlipper(1, false);
			if (game.plungerHeld) {
				game.plungerHeld = false;
				game.plunger = 0;
			}
		}
		function onVis() {
			if (document.hidden) pauseNow();
		}

		const ro = new ResizeObserver(resize);
		ro.observe(cv);
		ro.observe(dcv);
		resize();
		cv.addEventListener('pointerdown', onDown);
		cv.addEventListener('pointerup', onUp);
		cv.addEventListener('pointercancel', onUp);
		window.addEventListener('keydown', onKey);
		window.addEventListener('keyup', onKeyUp);
		window.addEventListener('blur', pauseNow);
		document.addEventListener('visibilitychange', onVis);
		el.focus({ preventScroll: true });
		raf = requestAnimationFrame(frame);
		if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__pinball = game;

		return () => {
			done = true;
			ctl.press = () => {};
			cancelAnimationFrame(raf);
			ro.disconnect();
			cv.removeEventListener('pointerdown', onDown);
			cv.removeEventListener('pointerup', onUp);
			cv.removeEventListener('pointercancel', onUp);
			window.removeEventListener('keydown', onKey);
			window.removeEventListener('keyup', onKeyUp);
			window.removeEventListener('blur', pauseNow);
			document.removeEventListener('visibilitychange', onVis);
		};
	}

	function btn(k: Control) {
		return {
			onpointerdown: (e: PointerEvent) => {
				e.preventDefault();
				(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
				ctl.press(k, true);
			},
			onpointerup: () => ctl.press(k, false),
			onpointercancel: () => ctl.press(k, false),
			oncontextmenu: (e: Event) => e.preventDefault()
		};
	}
	const fmtN = (n: number) => n.toLocaleString('en-US');
</script>

<!-- the game takes the keyboard itself, so its area is focusable -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="pb" bind:this={root} tabindex="0" role="application" aria-label={w.aria}>
	<div class="pb-in">
	<div class="pb-table">
		<canvas bind:this={canvas}></canvas>
	</div>
	<aside class="pb-panel">
		<div class="pb-dmd"><canvas bind:this={dmdCanvas} aria-hidden="true"></canvas></div>
		<p class="sr-only" aria-live="polite">{w.score} {fmtN(hud.score)}, {w.ball} {hud.ball}</p>
		<dl class="pb-stats">
			<div class="pb-score"><dt>{w.score}</dt><dd class="num">{fmtN(hud.score)}</dd></div>
			<div><dt>{w.ball}</dt><dd>{hud.ball} / {hud.of}</dd></div>
			<div>
				<dt>{w.camo}</dt>
				<dd class="pb-camo">
					{#each w.camoShort as c, i (c)}<span class="pip" class:on={hud.camo > i} style:--pc={CAMO_COL[i]}>{c}</span>{/each}
				</dd>
			</div>
			<div>
				<dt>{w.streak}</dt>
				<dd class="pb-kills">
					{#each Array(10) as _, k (k)}<span class="kill" class:on={hud.kills > k}></span>{/each}
				</dd>
			</div>
			<div><dt>{w.locks}</dt><dd>{#each [0, 1, 2] as k (k)}<span class="lock" class:on={hud.mb || hud.locks > k}></span>{/each}{#if hud.mb}<b class="mb">{w.multiball}</b>{/if}</dd></div>
			<div><dt>{w.holk}</dt><dd><span class="bar"><i style:width="{hud.holk * 100}%"></i></span></dd></div>
			<div><dt>{w.kickback}</dt><dd class:on-t={hud.kick}>{hud.kick ? w.on : w.off}</dd></div>
		</dl>
		<p class="pb-keys">{w.controls}</p>
	</aside>
	<div class="pb-pad" role="group" aria-label={w.buttons}>
		<button type="button" class="pb-btn flip" aria-label={w.left} {...btn('left')}>◀</button>
		<div class="pb-mid">
			<button type="button" class="pb-btn launch" {...btn('plunger')}>{w.launch}</button>
			<button type="button" class="pb-btn nudge" {...btn('nudge')}>{w.nudge}</button>
		</div>
		<button type="button" class="pb-btn flip" aria-label={w.right} {...btn('right')}>▶</button>
	</div>
	</div>
</div>

<style>
	.pb {
		container-type: inline-size;
		outline: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.pb-in {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-areas: 'panel' 'table' 'pad';
		gap: 10px;
		justify-items: center;
	}
	.pb-table {
		grid-area: table;
		width: min(100%, calc(min(80vh, 820px) * 420 / 760));
		aspect-ratio: 420 / 760;
		border-radius: 12px 12px 6px 6px;
		overflow: hidden;
		background: #120804;
		box-shadow:
			0 0 0 3px #2a1608,
			0 0 0 5px #6a3a1a,
			0 12px 30px rgb(0 0 0 / 0.55);
	}
	.pb:focus-visible .pb-table {
		box-shadow:
			0 0 0 3px #2a1608,
			0 0 0 5px #ffb02a;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
		touch-action: none;
	}
	.pb-panel {
		grid-area: panel;
		width: min(100%, 420px);
		display: grid;
		gap: 8px;
		padding: 10px;
		border-radius: 12px;
		background: linear-gradient(180deg, #1a0e06, #0a0402);
		border: 2px solid #6a3a1a;
		box-shadow: inset 0 0 18px rgb(0 0 0 / 0.8);
		color: #ffd9a8;
		font-size: 12px;
	}
	.pb-dmd {
		padding: 6px;
		border-radius: 6px;
		background: #050101;
		box-shadow:
			inset 0 0 0 2px #2a1006,
			0 0 18px rgb(255 140 40 / 0.18);
	}
	.pb-dmd canvas {
		aspect-ratio: 4 / 1;
		height: auto;
	}
	.pb-stats {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px 10px;
		margin: 0;
	}
	.pb-stats > div {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.pb-stats dt {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: #c88a5a;
	}
	.pb-stats dd {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 3px;
		flex-wrap: wrap;
		font-weight: 800;
		color: #fff1dc;
	}
	.pb-score {
		grid-column: 1 / -1;
	}
	.pb-score dd {
		font-size: 22px;
		color: #ffb02a;
		text-shadow: 0 0 10px rgb(255 140 40 / 0.6);
	}
	.pip {
		padding: 1px 4px;
		border-radius: 4px;
		font-size: 10px;
		border: 1px solid var(--pc);
		color: var(--pc);
		opacity: 0.5;
	}
	.pip.on {
		background: var(--pc);
		color: #140606;
		opacity: 1;
		box-shadow: 0 0 8px var(--pc);
	}
	.kill,
	.lock {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: #3a1a10;
		border: 1px solid #ff5a3a;
	}
	.kill.on {
		background: #ff5a3a;
		box-shadow: 0 0 6px #ff5a3a;
	}
	.lock {
		border-color: #c88aff;
	}
	.lock.on {
		background: #c88aff;
		box-shadow: 0 0 6px #c88aff;
	}
	.mb {
		color: #ff5cb8;
		font-size: 10px;
		margin-left: 4px;
	}
	.bar {
		display: block;
		width: 100%;
		height: 8px;
		border-radius: 4px;
		background: #1a2a10;
		border: 1px solid #7dff5a;
		overflow: hidden;
	}
	.bar i {
		display: block;
		height: 100%;
		background: #7dff5a;
	}
	.on-t {
		color: #ffcc66 !important;
	}
	.pb-keys {
		margin: 0;
		font-size: 11px;
		color: #b08a6a;
	}
	.pb-pad {
		grid-area: pad;
		display: none;
		width: min(100%, 460px);
		grid-template-columns: 1fr auto 1fr;
		gap: 8px;
		touch-action: none;
	}
	.pb-mid {
		display: grid;
		gap: 6px;
	}
	.pb-btn {
		min-height: 48px;
		border-radius: 14px;
		border: 2px solid #14060a;
		background: linear-gradient(180deg, #ff5a3a, #a8140e);
		color: #fff6e6;
		font-weight: 900;
		font-size: 15px;
		box-shadow:
			inset 0 2px 0 rgb(255 255 255 / 0.3),
			0 4px 0 #3a0404;
		touch-action: none;
		cursor: pointer;
	}
	.pb-btn.flip {
		min-height: 104px;
		font-size: 26px;
	}
	.pb-btn.launch {
		background: linear-gradient(180deg, #ffd23a, #e07a00);
		color: #3a1a00;
		padding-inline: 14px;
	}
	.pb-btn.nudge {
		background: linear-gradient(180deg, #5a6a7a, #2a323c);
		font-size: 13px;
	}
	.pb-btn:active {
		transform: translateY(3px);
		box-shadow: inset 0 2px 0 rgb(255 255 255 / 0.2);
	}
	.pb-btn:focus-visible {
		outline: 3px solid #ffd23a;
		outline-offset: 2px;
	}
	.pb-keys {
		display: block;
	}
	/* wide: the panel beside the table, like the old desktop pinball games */
	@container (min-width: 600px) {
		.pb-in {
			grid-template-columns: auto 230px;
			grid-template-areas: 'table panel' 'pad pad';
			justify-content: center;
			align-items: start;
		}
		.pb-table {
			width: calc(min(80vh, 820px) * 420 / 760);
			max-width: calc(100cqi - 240px);
		}
		.pb-panel {
			width: 230px;
		}
		.pb-stats {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	/* narrow: a compact panel on top */
	@container (max-width: 599px) {
		.pb-panel {
			grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
			align-items: center;
		}
		.pb-stats {
			grid-template-columns: minmax(0, 1fr);
			gap: 3px;
		}
		.pb-stats > div:not(.pb-score):not(:nth-child(2)):not(:nth-child(3)) {
			display: none;
		}
		.pb-score dd {
			font-size: 16px;
		}
		.pb-keys {
			display: none;
		}
		.pb-table {
			width: min(100%, calc((100svh - 330px) * 420 / 760));
			min-width: min(100%, 260px);
		}
	}
	@media (pointer: coarse), (max-width: 639px) {
		.pb-pad {
			display: grid;
		}
		.pb-keys {
			display: none;
		}
	}
</style>
