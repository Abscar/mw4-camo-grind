<!--
	Hitmarker Rush (BurgiArcade, 2026-11-22): a 30-second aim trainer on a ruined street at dusk. Cartoon
	targets (masked soldiers, plywood bullseye dummies, burger-faced practice dummies, a gold HVT that moves
	sideways) pop up from behind windows, crates, a burger-joint counter and sandbag walls on a seeded
	schedule (arcade/hitmarker.ts); civilians with a halo (a burger mascot, a duck) must not be shot.
	Click / tap = a shot: a white hitmarker, "+100", debris; head / bullseye = headshot bonus; a streak
	multiplies points, a miss breaks it. Final score = points × (0.5 + 0.5 × accuracy).
	One <canvas> (logical 800 × 600, scaled to the box × devicePixelRatio ≤ 2): the street, the window sills,
	the crates + counter and the sandbags are drawn once into offscreen layers, targets go between them.
	Our own drawings, no game's art.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { rng } from '#lib/arcade/rng.ts';
	import {
		CIVILIAN_PENALTY,
		DUCK_MS,
		DURATION,
		RISE_H,
		RISE_MS,
		SPOTS,
		accuracy,
		comboMult,
		finalScore,
		hitPoints,
		hitZone,
		isCivilian,
		schedule,
		type Spawn,
		type Spot,
		type TargetKind
	} from '#lib/arcade/hitmarker.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import s from '#lib/i18n/arcade/hitmarker.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();

	type Ctx = CanvasRenderingContext2D;
	const W = 800;
	const H = 600;
	const O = '#1a0630';
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
	/** how far below its cover a ducked target sits (local px), so nothing peeks out */
	const SINK = RISE_H + 45;

	// ── drawing helpers ──────────────────────────────────────────────────────────────────────────────
	type Stops = [number, string][];
	function lin(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: Stops): CanvasGradient {
		const g = c.createLinearGradient(x0, y0, x1, y1);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}
	function rad(c: Ctx, x: number, y: number, r: number, stops: Stops, x0 = x, y0 = y): CanvasGradient {
		const g = c.createRadialGradient(x0, y0, 0, x, y, r);
		for (const [o, col] of stops) g.addColorStop(o, col);
		return g;
	}
	function ink(c: Ctx, lw = 5, col = O) {
		c.lineWidth = lw;
		c.strokeStyle = col;
		c.lineJoin = 'round';
		c.lineCap = 'round';
		c.stroke();
	}
	function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
		c.beginPath();
		c.roundRect(x, y, w, h, r);
	}
	function circle(c: Ctx, x: number, y: number, r: number) {
		c.beginPath();
		c.arc(x, y, r, 0, Math.PI * 2);
	}
	function text(c: Ctx, str: string, x: number, y: number, size: number, fill: string | CanvasGradient, align: CanvasTextAlign = 'center', lw = size * 0.24) {
		c.font = `700 ${size}px ${FONT}`;
		c.textAlign = align;
		c.textBaseline = 'alphabetic';
		c.lineJoin = 'round';
		c.lineWidth = lw;
		c.strokeStyle = O;
		c.strokeText(str, x, y);
		c.fillStyle = fill;
		c.fillText(str, x, y);
	}
	/** a gloss arc: the white highlight that makes things look shiny */
	function gloss(c: Ctx, x: number, y: number, r: number, a0: number, a1: number, lw: number, alpha = 0.45) {
		c.beginPath();
		c.arc(x, y, r, a0, a1);
		c.lineWidth = lw;
		c.lineCap = 'round';
		c.strokeStyle = `rgba(255,255,255,${alpha})`;
		c.stroke();
	}

	// ── the targets (local coordinates: origin = top of the cover, y down, scale 1) ─────────────────
	function soldier(c: Ctx, gold: boolean, t: number) {
		const jacket = gold
			? lin(c, -66, -70, 66, 80, [[0, '#fff6b0'], [0.35, '#ffd23a'], [0.7, '#e09a10'], [1, '#9a5a00']])
			: lin(c, 0, -70, 0, 80, [[0, '#7d9c42'], [1, '#33461b']]);
		c.beginPath();
		c.moveTo(-66, 90);
		c.lineTo(-66, -18);
		c.quadraticCurveTo(-66, -64, -22, -68);
		c.lineTo(22, -68);
		c.quadraticCurveTo(66, -64, 66, -18);
		c.lineTo(66, 90);
		c.closePath();
		c.fillStyle = jacket;
		c.fill();
		ink(c, 5);
		// shoulder light
		c.beginPath();
		c.moveTo(-56, -22);
		c.quadraticCurveTo(-56, -56, -22, -58);
		ink(c, 4, gold ? 'rgba(255,255,220,.7)' : 'rgba(220,240,170,.45)');
		// vest + pouches
		rr(c, -40, -56, 80, 140, 10);
		c.fillStyle = gold ? lin(c, 0, -56, 0, 60, [[0, '#ffe27a'], [1, '#c98400']]) : lin(c, 0, -56, 0, 60, [[0, '#3f4f2a'], [1, '#232d16']]);
		c.fill();
		ink(c, 3.5);
		for (const px of [-31, -9, 13]) {
			rr(c, px, -10, 18, 24, 4);
			c.fillStyle = gold ? '#fff0a0' : '#556a31';
			c.fill();
			ink(c, 2.6);
			c.beginPath();
			c.moveTo(px + 2, -3);
			c.lineTo(px + 16, -3);
			ink(c, 1.6);
		}
		// chest badge: red star on the HVT, a burger patch on the grunts
		if (gold) {
			c.beginPath();
			for (let i = 0; i < 10; i++) {
				const a = -Math.PI / 2 + (i * Math.PI) / 5;
				const r = i % 2 ? 6 : 14;
				c.lineTo(-20 + Math.cos(a) * r, -34 + Math.sin(a) * r);
			}
			c.closePath();
			c.fillStyle = '#e2261f';
			c.fill();
			ink(c, 2.6);
		} else {
			circle(c, -20, -36, 9);
			c.fillStyle = '#e8a63a';
			c.fill();
			ink(c, 2.4);
			c.beginPath();
			c.moveTo(-27, -36);
			c.lineTo(-13, -36);
			ink(c, 2.4, '#6b3a1c');
		}
		// radio antenna
		c.beginPath();
		c.moveTo(46, -58);
		c.lineTo(58, -124);
		ink(c, 4.5);
		c.beginPath();
		c.moveTo(46, -58);
		c.lineTo(58, -124);
		ink(c, 2, gold ? '#ffe27a' : '#7a8a6a');
		circle(c, 58, -126, 3.6);
		c.fillStyle = '#ff3b3b';
		c.fill();
		ink(c, 2);
		// neck
		rr(c, -17, -84, 34, 22, 6);
		c.fillStyle = gold ? '#c98400' : '#26222c';
		c.fill();
		ink(c, 3);
		// head (balaclava)
		circle(c, 0, -108, 36);
		c.fillStyle = gold ? rad(c, 0, -108, 40, [[0, '#ffe68a'], [1, '#b87800']], -12, -120) : rad(c, 0, -108, 40, [[0, '#4a4452'], [1, '#1c1922']], -12, -120);
		c.fill();
		ink(c, 5);
		// knit lines low on the mask
		for (const y of [-80, -76]) {
			c.beginPath();
			c.moveTo(-16, y);
			c.quadraticCurveTo(0, y + 4, 16, y);
			ink(c, 1.4, gold ? 'rgba(120,70,0,.5)' : 'rgba(255,255,255,.12)');
		}
		// eye slit + angry eyes
		rr(c, -27, -106, 54, 20, 9);
		c.fillStyle = lin(c, 0, -106, 0, -86, [[0, '#f6c39a'], [1, '#c98058']]);
		c.fill();
		ink(c, 3);
		for (const ex of [-12, 12]) {
			c.beginPath();
			c.ellipse(ex, -96, 7, 5.5, 0, 0, Math.PI * 2);
			c.fillStyle = '#fffaf0';
			c.fill();
			ink(c, 2);
			circle(c, ex + (ex < 0 ? 2 : -2), -95.5, 3.1);
			c.fillStyle = O;
			c.fill();
		}
		c.beginPath();
		c.moveTo(-22, -104);
		c.lineTo(-5, -99);
		c.moveTo(22, -104);
		c.lineTo(5, -99);
		ink(c, 3.6);
		// helmet
		c.beginPath();
		c.moveTo(-44, -112);
		c.quadraticCurveTo(-44, -158, 0, -158);
		c.quadraticCurveTo(44, -158, 44, -112);
		c.lineTo(49, -105);
		c.quadraticCurveTo(0, -117, -49, -105);
		c.closePath();
		c.fillStyle = gold ? lin(c, -40, -158, 40, -105, [[0, '#fffbd0'], [0.4, '#ffd23a'], [1, '#a86400']]) : lin(c, 0, -158, 0, -105, [[0, '#8aa64e'], [1, '#3e5520']]);
		c.fill();
		ink(c, 5);
		c.beginPath();
		c.moveTo(-43, -120);
		c.quadraticCurveTo(0, -128, 43, -120);
		ink(c, 3, gold ? 'rgba(140,80,0,.6)' : 'rgba(30,40,15,.6)');
		gloss(c, -8, -126, 26, -2.6, -1.7, 5, gold ? 0.75 : 0.4);
		// goggles on the helmet
		rr(c, -26, -146, 52, 14, 7);
		c.fillStyle = '#2a2530';
		c.fill();
		ink(c, 2.6);
		for (const gx of [-12, 12]) {
			circle(c, gx, -139, 8);
			c.fillStyle = lin(c, 0, -147, 0, -131, [[0, '#ffd27a'], [1, '#ff6a2a']]);
			c.fill();
			ink(c, 2.4);
			circle(c, gx - 2.5, -141.5, 2.2);
			c.fillStyle = 'rgba(255,255,255,.85)';
			c.fill();
		}
		if (gold) {
			// the HVT marker bobbing over his head
			const by = -190 + Math.sin(t / 170) * 4;
			c.beginPath();
			c.moveTo(0, by + 16);
			c.lineTo(-13, by);
			c.lineTo(0, by - 14);
			c.lineTo(13, by);
			c.closePath();
			c.fillStyle = lin(c, 0, by - 14, 0, by + 16, [[0, '#ff7a6a'], [1, '#b3141b']]);
			c.fill();
			ink(c, 3);
			text(c, s.hvt, 0, by - 20, 22, '#ffd23a');
		}
	}

	function dummy(c: Ctx) {
		const wood = lin(c, -60, -150, 60, 80, [[0, '#f8d596'], [0.5, '#dda55f'], [1, '#a7672e']]);
		const body = new Path2D();
		body.moveTo(-62, 90);
		body.lineTo(-62, -44);
		body.quadraticCurveTo(-62, -82, -28, -84);
		body.lineTo(-13, -84);
		body.lineTo(-13, -96);
		body.lineTo(13, -96);
		body.lineTo(13, -84);
		body.lineTo(28, -84);
		body.quadraticCurveTo(62, -82, 62, -44);
		body.lineTo(62, 90);
		body.closePath();
		body.moveTo(30, -118);
		body.arc(0, -118, 30, 0, Math.PI * 2);
		c.fillStyle = wood;
		c.fill(body);
		// wood grain
		c.save();
		c.clip(body);
		c.strokeStyle = 'rgba(122,62,20,.35)';
		c.lineWidth = 1.6;
		for (let i = 0; i < 9; i++) {
			const x = -58 + i * 14;
			c.beginPath();
			c.moveTo(x, -150);
			c.bezierCurveTo(x + 6, -90, x - 6, -40, x + 4, 90);
			c.stroke();
		}
		c.beginPath();
		c.ellipse(38, 30, 5, 9, 0.3, 0, Math.PI * 2);
		c.stroke();
		c.restore();
		c.lineWidth = 5;
		c.strokeStyle = O;
		c.lineJoin = 'round';
		c.stroke(body);
		// edge light
		c.beginPath();
		c.moveTo(-54, -44);
		c.quadraticCurveTo(-54, -74, -28, -76);
		ink(c, 3, 'rgba(255,245,215,.6)');
		gloss(c, 0, -118, 22, -2.7, -1.6, 4, 0.55);
		// bullseye on the chest + a little one on the head
		const rings: [number, string][] = [
			[30, '#fff6ea'],
			[23, '#e2261f'],
			[16, '#fff6ea'],
			[9, '#e2261f']
		];
		for (const [r, col] of rings) {
			circle(c, 0, -40, r);
			c.fillStyle = col;
			c.fill();
			ink(c, r === 30 ? 3.5 : 1.4);
		}
		circle(c, 0, -118, 12);
		c.fillStyle = '#e2261f';
		c.fill();
		ink(c, 2);
		circle(c, 0, -118, 5);
		c.fillStyle = '#fff6ea';
		c.fill();
		// bolts
		for (const bx of [-48, 48]) {
			circle(c, bx, -58, 4.5);
			c.fillStyle = '#c9c4cf';
			c.fill();
			ink(c, 2);
		}
	}

	function burgerDummy(c: Ctx, t: number) {
		// burlap sack body
		const sack = new Path2D();
		sack.moveTo(-56, 90);
		sack.lineTo(-58, -34);
		sack.quadraticCurveTo(-56, -68, -18, -70);
		sack.lineTo(18, -70);
		sack.quadraticCurveTo(56, -68, 58, -34);
		sack.lineTo(56, 90);
		sack.closePath();
		c.fillStyle = lin(c, 0, -70, 0, 90, [[0, '#d9ad6a'], [1, '#8c6230']]);
		c.fill(sack);
		c.save();
		c.clip(sack);
		c.strokeStyle = 'rgba(90,55,20,.25)';
		c.lineWidth = 1.2;
		for (let i = -60; i < 60; i += 7) {
			c.beginPath();
			c.moveTo(i, -70);
			c.lineTo(i, 90);
			c.stroke();
		}
		for (let y = -70; y < 90; y += 7) {
			c.beginPath();
			c.moveTo(-60, y);
			c.lineTo(60, y);
			c.stroke();
		}
		c.restore();
		c.lineWidth = 5;
		c.strokeStyle = O;
		c.stroke(sack);
		// stitches + patch
		c.setLineDash([5, 5]);
		c.beginPath();
		c.moveTo(0, -60);
		c.lineTo(0, 60);
		ink(c, 2, '#5a3a14');
		c.setLineDash([]);
		rr(c, 18, -40, 26, 22, 3);
		c.fillStyle = '#7a3fd0';
		c.fill();
		ink(c, 2.4);
		c.beginPath();
		c.moveTo(22, -36);
		c.lineTo(40, -22);
		c.moveTo(40, -36);
		c.lineTo(22, -22);
		ink(c, 1.6, '#e8d8ff');
		// rope at the neck
		rr(c, -22, -80, 44, 13, 6);
		c.fillStyle = '#c9a36a';
		c.fill();
		ink(c, 2.6);
		// the burger head
		rr(c, -42, -88, 84, 18, 9);
		c.fillStyle = lin(c, 0, -88, 0, -70, [[0, '#f0a24a'], [1, '#b0581b']]);
		c.fill();
		ink(c, 3.5);
		rr(c, -46, -102, 92, 16, 8);
		c.fillStyle = '#6b3a1c';
		c.fill();
		ink(c, 3.5);
		// grin on the patty
		c.beginPath();
		c.moveTo(-22, -96);
		c.quadraticCurveTo(0, -84, 22, -96);
		c.closePath();
		c.fillStyle = '#2a0d05';
		c.fill();
		ink(c, 2);
		rr(c, -12, -96, 24, 4.5, 1.5);
		c.fillStyle = '#fffaf0';
		c.fill();
		// cheese + lettuce
		c.beginPath();
		c.moveTo(-44, -104);
		c.lineTo(44, -104);
		c.lineTo(36, -94);
		c.lineTo(28, -104);
		c.lineTo(-14, -104);
		c.lineTo(-22, -92);
		c.lineTo(-30, -104);
		c.closePath();
		c.fillStyle = '#ffc928';
		c.fill();
		ink(c, 2.4);
		c.beginPath();
		c.moveTo(-48, -104);
		for (let x = -48; x <= 48; x += 12) c.quadraticCurveTo(x + 6, -114, x + 12, -105);
		c.lineTo(48, -100);
		c.lineTo(-48, -100);
		c.closePath();
		c.fillStyle = '#4fb23a';
		c.fill();
		ink(c, 2.4);
		// top bun with googly eyes
		c.beginPath();
		c.moveTo(-45, -106);
		c.quadraticCurveTo(-45, -150, 0, -150);
		c.quadraticCurveTo(45, -150, 45, -106);
		c.closePath();
		c.fillStyle = rad(c, -6, -122, 56, [[0, '#ffd896'], [0.5, '#f0a24a'], [1, '#b0581b']], -18, -138);
		c.fill();
		ink(c, 4.5);
		for (const [x, y] of [
			[-28, -118],
			[-20, -134],
			[24, -136],
			[32, -120],
			[0, -144],
			[-6, -112],
			[10, -112]
		]) {
			c.beginPath();
			c.ellipse(x, y, 2.6, 1.6, 0.3, 0, Math.PI * 2);
			c.fillStyle = '#fff6d0';
			c.fill();
		}
		const jx = Math.sin(t / 90) * 2;
		const jy = Math.cos(t / 120) * 2;
		for (const ex of [-14, 14]) {
			circle(c, ex, -126, 10);
			c.fillStyle = '#fffaf0';
			c.fill();
			ink(c, 2.6);
			circle(c, ex + jx * (ex < 0 ? 1 : -1), -125 + jy, 4.6);
			c.fillStyle = O;
			c.fill();
		}
		gloss(c, -6, -118, 30, -2.6, -1.9, 4, 0.5);
	}

	function halo(c: Ctx, x: number, y: number, t: number) {
		const by = y + Math.sin(t / 220) * 3;
		c.beginPath();
		c.ellipse(x, by, 30, 8, 0, 0, Math.PI * 2);
		c.lineWidth = 16;
		c.strokeStyle = 'rgba(255,224,110,.25)';
		c.stroke();
		ink(c, 9);
		c.lineWidth = 5;
		c.strokeStyle = lin(c, x - 30, by, x + 30, by, [[0, '#ffe98a'], [0.5, '#fffbe0'], [1, '#ffc928']]);
		c.stroke();
	}

	function mascot(c: Ctx, t: number) {
		const bun = rad(c, -8, -112, 70, [[0, '#ffd896'], [0.5, '#f0a24a'], [1, '#b0581b']], -24, -132);
		// waving arm (behind)
		c.save();
		c.translate(54, -66);
		c.rotate(-1 + Math.sin(t / 110) * 0.45);
		rr(c, -8, -50, 16, 52, 8);
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 3.5);
		circle(c, 0, -56, 13);
		c.fillStyle = '#ffffff';
		c.fill();
		ink(c, 3.5);
		c.beginPath();
		c.moveTo(-5, -64);
		c.lineTo(-5, -56);
		c.moveTo(1, -66);
		c.lineTo(1, -57);
		c.moveTo(7, -63);
		c.lineTo(7, -56);
		ink(c, 1.6);
		c.restore();
		// resting arm
		rr(c, -72, -64, 18, 46, 9);
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 3.5);
		circle(c, -64, -18, 12);
		c.fillStyle = '#ffffff';
		c.fill();
		ink(c, 3.5);
		// bottom bun, patty, cheese, lettuce, top bun
		c.beginPath();
		c.moveTo(-58, -44);
		c.lineTo(58, -44);
		c.quadraticCurveTo(58, -14, 30, -12);
		c.lineTo(-30, -12);
		c.quadraticCurveTo(-58, -14, -58, -44);
		c.closePath();
		c.fillStyle = lin(c, 0, -44, 0, -12, [[0, '#f0a24a'], [1, '#b0581b']]);
		c.fill();
		ink(c, 4.5);
		rr(c, -64, -64, 128, 22, 11);
		c.fillStyle = '#6b3a1c';
		c.fill();
		ink(c, 4);
		c.beginPath();
		c.moveTo(-60, -66);
		c.lineTo(60, -66);
		c.lineTo(50, -52);
		c.lineTo(40, -66);
		c.lineTo(-18, -66);
		c.lineTo(-28, -50);
		c.lineTo(-38, -66);
		c.closePath();
		c.fillStyle = '#ffc928';
		c.fill();
		ink(c, 2.6);
		c.beginPath();
		c.moveTo(-64, -68);
		for (let x = -64; x < 64; x += 16) c.quadraticCurveTo(x + 8, -80, x + 16, -68);
		c.lineTo(64, -62);
		c.lineTo(-64, -62);
		c.closePath();
		c.fillStyle = '#4fb23a';
		c.fill();
		ink(c, 2.6);
		c.beginPath();
		c.moveTo(-60, -70);
		c.quadraticCurveTo(-62, -146, 0, -146);
		c.quadraticCurveTo(62, -146, 60, -70);
		c.closePath();
		c.fillStyle = bun;
		c.fill();
		ink(c, 5);
		for (const [x, y] of [
			[-36, -118],
			[-20, -134],
			[22, -136],
			[40, -118],
			[0, -140]
		]) {
			c.beginPath();
			c.ellipse(x, y, 3, 1.8, -0.3, 0, Math.PI * 2);
			c.fillStyle = '#fff6d0';
			c.fill();
		}
		// happy face
		for (const ex of [-20, 20]) {
			c.beginPath();
			c.arc(ex, -106, 8, Math.PI * 1.1, Math.PI * 1.9);
			ink(c, 4);
		}
		for (const cx of [-36, 36]) {
			c.beginPath();
			c.ellipse(cx, -94, 8, 5, 0, 0, Math.PI * 2);
			c.fillStyle = 'rgba(255,110,130,.55)';
			c.fill();
		}
		c.beginPath();
		c.arc(0, -96, 16, 0.12 * Math.PI, 0.88 * Math.PI);
		c.closePath();
		c.fillStyle = '#5a1408';
		c.fill();
		ink(c, 3);
		c.beginPath();
		c.ellipse(0, -84, 8, 4, 0, 0, Math.PI * 2);
		c.fillStyle = '#ff7a8a';
		c.fill();
		gloss(c, -10, -112, 40, -2.7, -1.9, 5, 0.5);
		halo(c, 0, -160, t);
	}

	function duck(c: Ctx, t: number) {
		const yellow = rad(c, -6, -60, 80, [[0, '#fff7a0'], [0.5, '#ffd23a'], [1, '#e08a00']], -20, -78);
		// tail
		c.beginPath();
		c.moveTo(-50, -54);
		c.lineTo(-74, -78);
		c.lineTo(-56, -36);
		c.closePath();
		c.fillStyle = yellow;
		c.fill();
		ink(c, 4);
		// body
		c.beginPath();
		c.ellipse(0, -38, 60, 42, 0, 0, Math.PI * 2);
		c.fillStyle = yellow;
		c.fill();
		ink(c, 5);
		// wing
		c.beginPath();
		c.moveTo(-34, -44);
		c.quadraticCurveTo(-10, -64, 20, -42);
		c.quadraticCurveTo(-4, -20, -34, -44);
		c.closePath();
		c.fillStyle = '#ffe36a';
		c.fill();
		ink(c, 3);
		// head
		circle(c, 18, -96, 30);
		c.fillStyle = yellow;
		c.fill();
		ink(c, 5);
		// beak
		c.beginPath();
		c.moveTo(40, -100);
		c.quadraticCurveTo(68, -102, 70, -92);
		c.quadraticCurveTo(62, -82, 40, -86);
		c.closePath();
		c.fillStyle = lin(c, 40, -102, 40, -82, [[0, '#ffb04a'], [1, '#ff6a1a']]);
		c.fill();
		ink(c, 3.5);
		c.beginPath();
		c.moveTo(44, -92);
		c.quadraticCurveTo(56, -90, 66, -93);
		ink(c, 2);
		// eye + blush
		circle(c, 26, -104, 7);
		c.fillStyle = '#fffaf0';
		c.fill();
		ink(c, 2.4);
		circle(c, 28, -103, 4);
		c.fillStyle = O;
		c.fill();
		circle(c, 29.5, -105, 1.5);
		c.fillStyle = '#fff';
		c.fill();
		c.beginPath();
		c.ellipse(16, -88, 6, 3.6, 0, 0, Math.PI * 2);
		c.fillStyle = 'rgba(255,110,90,.5)';
		c.fill();
		// tuft
		c.beginPath();
		c.moveTo(12, -124);
		c.quadraticCurveTo(8, -136, 16, -138);
		c.moveTo(18, -126);
		c.quadraticCurveTo(20, -140, 28, -136);
		ink(c, 3.5);
		gloss(c, 10, -98, 22, -2.8, -1.8, 4, 0.55);
		gloss(c, -6, -44, 46, -2.6, -2, 5, 0.4);
		halo(c, 18, -140, t);
	}

	function drawKind(c: Ctx, kind: TargetKind, t: number) {
		if (kind === 'soldier') soldier(c, false, t);
		else if (kind === 'hvt') soldier(c, true, t);
		else if (kind === 'dummy') dummy(c);
		else if (kind === 'burger') burgerDummy(c, t);
		else if (kind === 'mascot') mascot(c, t);
		else duck(c, t);
	}

	// ── the static layers (drawn once per size) ─────────────────────────────────────────────────────
	const SUN = { x: 400, y: 170, r: 82 };

	function skyline(c: Ctx, seedN: number, base: number, minH: number, maxH: number, col: string, lit: string) {
		const r = rng(seedN);
		const tops: [number, number, number][] = [];
		c.beginPath();
		c.moveTo(-10, 420);
		let x = -10;
		while (x < W + 10) {
			const w = 26 + r() * 46;
			const top = base - minH - r() * (maxH - minH);
			c.lineTo(x, top + r() * 5);
			if (r() < 0.45) {
				c.lineTo(x + w * 0.35, top - 6 + r() * 4);
				c.lineTo(x + w * 0.5, top + 9 + r() * 6);
				c.lineTo(x + w * 0.7, top + 2);
			}
			c.lineTo(x + w, top + r() * 5);
			tops.push([x, w, top]);
			x += w;
		}
		c.lineTo(W + 10, 420);
		c.closePath();
		c.fillStyle = col;
		c.fill();
		for (const [bx, bw, top] of tops)
			for (let wy = top + 12; wy < base - 8; wy += 13)
				for (let wx = bx + 6; wx < bx + bw - 8; wx += 11)
					if (r() < 0.09) {
						c.fillStyle = lit;
						c.fillRect(wx, wy, 4, 5);
					}
	}

	function brickWall(c: Ctx, path: Path2D, top: string, bottom: string, y0: number, y1: number, x0: number, x1: number, seedN: number) {
		c.fillStyle = lin(c, 0, y0, 0, y1, [[0, top], [1, bottom]]);
		c.fill(path);
		c.save();
		c.clip(path);
		const r = rng(seedN);
		for (let y = y0, row = 0; y < y1; y += 13, row++)
			for (let x = x0 - (row % 2) * 14; x < x1; x += 28) {
				if (r() < 0.16) {
					c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.16)' : 'rgba(255,190,150,.07)';
					c.fillRect(x + 1, y + 1, 26, 11);
				}
			}
		c.strokeStyle = 'rgba(10,2,12,.32)';
		c.lineWidth = 1.4;
		for (let y = y0, row = 0; y < y1; y += 13, row++) {
			c.beginPath();
			c.moveTo(x0, y);
			c.lineTo(x1, y);
			c.stroke();
			for (let x = x0 - (row % 2) * 14; x < x1; x += 28) {
				c.beginPath();
				c.moveTo(x, y);
				c.lineTo(x, y + 13);
				c.stroke();
			}
		}
		// rim light from the sunset along the top
		c.restore();
	}

	function bulletHoles(c: Ctx, pts: [number, number][]) {
		for (const [x, y] of pts) {
			circle(c, x, y, 4);
			c.fillStyle = '#0a0308';
			c.fill();
			circle(c, x, y, 6.5);
			c.lineWidth = 2;
			c.strokeStyle = 'rgba(255,200,170,.18)';
			c.stroke();
		}
	}

	function windowOpening(c: Ctx, sp: Spot) {
		const cl = sp.clip!;
		const w = cl.x1 - cl.x0;
		const h = sp.base - cl.y0;
		// stone frame
		rr(c, cl.x0 - 10, cl.y0 - 12, w + 20, h + 14, 4);
		c.fillStyle = lin(c, 0, cl.y0 - 12, 0, sp.base, [[0, '#a8766a'], [1, '#6a3f3c']]);
		c.fill();
		ink(c, 3.5);
		// keystone
		c.beginPath();
		c.moveTo(sp.x - 9, cl.y0 - 14);
		c.lineTo(sp.x + 9, cl.y0 - 14);
		c.lineTo(sp.x + 6, cl.y0 - 2);
		c.lineTo(sp.x - 6, cl.y0 - 2);
		c.closePath();
		c.fillStyle = '#c4948a';
		c.fill();
		ink(c, 2.4);
		// the dark room inside with a fire's glow low down
		c.fillStyle = lin(c, 0, cl.y0, 0, sp.base, [[0, '#07020c'], [1, '#2b0d18']]);
		c.fillRect(cl.x0, cl.y0, w, h);
		c.fillStyle = rad(c, sp.x, sp.base + 10, w * 0.75, [[0, 'rgba(255,120,50,.35)'], [1, 'rgba(255,90,40,0)']]);
		c.fillRect(cl.x0, cl.y0, w, h);
		c.lineWidth = 3;
		c.strokeStyle = O;
		c.strokeRect(cl.x0, cl.y0, w, h);
	}

	function paintBg(c: Ctx) {
		// sky
		// the sunset sits low behind the burger joint, so the warm colours start high up
		const sky = lin(c, 0, 0, 0, 250, [
			[0, '#0c0420'],
			[0.24, '#2c0b46'],
			[0.44, '#7a1f5e'],
			[0.62, '#d8453f'],
			[0.8, '#ff8a3d'],
			[1, '#ffc46a']
		]);
		c.fillStyle = sky;
		c.fillRect(0, 0, W, 392);
		const r = rng(11);
		for (let i = 0; i < 50; i++) {
			const y = r() * 90;
			circle(c, r() * W, y, 0.5 + r() * 1.3);
			c.fillStyle = `rgba(255,240,225,${(0.3 + r() * 0.6) * (1 - y / 110)})`;
			c.fill();
		}
		// sun: glow, light beams, disc, cloud streaks
		c.fillStyle = rad(c, SUN.x, SUN.y, 360, [
			[0, 'rgba(255,210,110,.85)'],
			[0.2, 'rgba(255,130,70,.42)'],
			[1, 'rgba(255,80,60,0)']
		]);
		c.fillRect(0, 0, W, 392);
		for (let i = 0; i < 12; i++) {
			const a0 = Math.PI + (i / 12) * Math.PI;
			const a1 = a0 + Math.PI / 30;
			c.beginPath();
			c.moveTo(SUN.x, SUN.y);
			c.arc(SUN.x, SUN.y, 560, a0, a1);
			c.closePath();
			c.fillStyle = `rgba(255,220,150,${i % 2 ? 0.05 : 0.08})`;
			c.fill();
		}
		circle(c, SUN.x, SUN.y, SUN.r);
		c.fillStyle = lin(c, 0, SUN.y - SUN.r, 0, SUN.y + SUN.r, [[0, '#fff7cc'], [0.4, '#ffd36a'], [1, '#ff6a3a']]);
		c.fill();
		for (const [x, y, w, a] of [
			[360, 120, 300, 0.5],
			[470, 104, 200, 0.4],
			[150, 142, 220, 0.35],
			[660, 136, 240, 0.35]
		]) {
			c.beginPath();
			c.ellipse(x, y, w / 2, 4.5, 0, 0, Math.PI * 2);
			c.fillStyle = `rgba(90,20,80,${a})`;
			c.fill();
		}
		// far ruins (they show in the gaps beside the burger joint)
		skyline(c, 21, 206, 30, 96, '#4a1a52', 'rgba(255,190,110,.55)');
		skyline(c, 37, 220, 10, 56, '#2c0c36', 'rgba(255,150,80,.6)');
		// a crane on the skyline
		c.strokeStyle = '#1c0724';
		c.lineWidth = 4;
		c.beginPath();
		c.moveTo(522, 230);
		c.lineTo(522, 100);
		c.lineTo(436, 108);
		c.moveTo(522, 100);
		c.lineTo(550, 104);
		c.stroke();
		c.lineWidth = 1.5;
		for (let y = 108; y < 230; y += 13) {
			c.beginPath();
			c.moveTo(518, y);
			c.lineTo(526, y + 13);
			c.stroke();
		}
		c.beginPath();
		c.moveTo(452, 107);
		c.lineTo(452, 136);
		c.stroke();
		circle(c, 522, 98, 2.6);
		c.fillStyle = '#ff3b3b';
		c.fill();
		// ground + street
		c.fillStyle = lin(c, 0, 372, 0, 600, [[0, '#4e2536'], [0.3, '#2f1626'], [1, '#150812']]);
		c.fillRect(0, 372, W, 228);
		c.beginPath();
		c.moveTo(150, 600);
		c.lineTo(650, 600);
		c.lineTo(500, 374);
		c.lineTo(436, 374);
		c.closePath();
		c.fillStyle = lin(c, 0, 374, 0, 600, [[0, '#3a1e2c'], [1, '#1e0e18']]);
		c.fill();
		c.fillStyle = lin(c, 0, 374, 0, 600, [[0, 'rgba(255,150,80,.28)'], [1, 'rgba(255,120,60,0)']]);
		c.beginPath();
		c.moveTo(380, 600);
		c.lineTo(560, 600);
		c.lineTo(480, 374);
		c.lineTo(456, 374);
		c.closePath();
		c.fill();
		for (let k = 0; k < 7; k++) {
			const p0 = (k / 7) ** 1.7;
			const p1 = ((k + 0.5) / 7) ** 1.7;
			const y0 = 374 + p0 * 226;
			const y1 = 374 + p1 * 226;
			const w0 = 1 + p0 * 7;
			const w1 = 1 + p1 * 7;
			const cx0 = 468 - (468 - 400) * p0;
			const cx1 = 468 - (468 - 400) * p1;
			c.beginPath();
			c.moveTo(cx0 - w0, y0);
			c.lineTo(cx0 + w0, y0);
			c.lineTo(cx1 + w1, y1);
			c.lineTo(cx1 - w1, y1);
			c.closePath();
			c.fillStyle = 'rgba(255,200,90,.55)';
			c.fill();
		}
		// left ruin
		const left = new Path2D();
		left.moveTo(0, 384);
		left.lineTo(0, 92);
		for (const [x, y] of [
			[34, 86],
			[62, 98],
			[92, 78],
			[126, 92],
			[150, 84],
			[178, 102],
			[204, 90],
			[230, 106],
			[252, 98],
			[270, 124],
			[262, 160],
			[272, 196],
			[272, 384]
		])
			left.lineTo(x, y);
		left.closePath();
		brickWall(c, left, '#6a2f3a', '#3a1626', 80, 384, 0, 280, 5);
		c.lineWidth = 5;
		c.strokeStyle = O;
		c.stroke(left);
		c.beginPath();
		c.moveTo(4, 92);
		for (const [x, y] of [
			[34, 86],
			[62, 98],
			[92, 78],
			[126, 92],
			[150, 84],
			[178, 102],
			[204, 90],
			[230, 106],
			[252, 98],
			[270, 124]
		])
			c.lineTo(x, y + 4);
		ink(c, 3, 'rgba(255,150,90,.55)');
		// stone band + boarded shop window downstairs
		c.fillStyle = '#7a4a46';
		c.fillRect(0, 238, 272, 12);
		c.lineWidth = 3;
		c.strokeStyle = O;
		c.strokeRect(-2, 238, 274, 12);
		rr(c, 26, 268, 220, 106, 4);
		c.fillStyle = '#1a0812';
		c.fill();
		ink(c, 3.5);
		for (let k = 0; k < 4; k++) {
			c.save();
			c.translate(136, 290 + k * 24);
			c.rotate((k % 2 ? -1 : 1) * 0.05);
			rr(c, -112, -9, 224, 18, 3);
			c.fillStyle = lin(c, 0, -9, 0, 9, [[0, '#a8743e'], [1, '#6e4520']]);
			c.fill();
			ink(c, 2.6);
			for (const nx of [-100, 100]) {
				circle(c, nx, 0, 2.2);
				c.fillStyle = '#cfc6d6';
				c.fill();
			}
			c.restore();
		}
		bulletHoles(c, [
			[40, 160],
			[148, 248],
			[252, 140],
			[120, 106]
		]);
		// right ruin (concrete)
		const right = new Path2D();
		right.moveTo(540, 384);
		right.lineTo(540, 150);
		for (const [x, y] of [
			[552, 106],
			[574, 92],
			[604, 100],
			[630, 80],
			[662, 94],
			[690, 76],
			[722, 90],
			[760, 74],
			[800, 86],
			[800, 384]
		])
			right.lineTo(x, y);
		right.closePath();
		c.fillStyle = lin(c, 0, 76, 0, 384, [[0, '#4a3d5e'], [1, '#231b33']]);
		c.fill(right);
		c.save();
		c.clip(right);
		c.strokeStyle = 'rgba(10,4,20,.35)';
		c.lineWidth = 1.5;
		for (let y = 120; y < 384; y += 38) {
			c.beginPath();
			c.moveTo(540, y);
			c.lineTo(800, y);
			c.stroke();
		}
		for (let x = 560; x < 800; x += 60) {
			c.beginPath();
			c.moveTo(x, 76);
			c.lineTo(x, 384);
			c.stroke();
		}
		c.restore();
		c.lineWidth = 5;
		c.strokeStyle = O;
		c.stroke(right);
		// a torn burger poster on the wall
		c.save();
		c.translate(572, 278);
		c.rotate(-0.08);
		rr(c, -20, -28, 40, 54, 3);
		c.fillStyle = lin(c, 0, -28, 0, 26, [[0, '#f4e6c4'], [1, '#c9b48a']]);
		c.fill();
		ink(c, 2.6);
		c.fillStyle = '#c4141b';
		c.fillRect(-18, -26, 36, 10);
		c.beginPath();
		c.moveTo(-11, 4);
		c.quadraticCurveTo(-11, -10, 0, -10);
		c.quadraticCurveTo(11, -10, 11, 4);
		c.closePath();
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 1.8);
		rr(c, -12, 6, 24, 4, 2);
		c.fillStyle = '#6b3a1c';
		c.fill();
		rr(c, -11, 11, 22, 5, 2.5);
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 1.4);
		c.beginPath();
		c.moveTo(20, 14);
		c.lineTo(10, 26);
		c.lineTo(20, 26);
		c.closePath();
		c.fillStyle = '#3a2f4a';
		c.fill();
		c.fillStyle = 'rgba(255,255,255,.5)';
		c.fillRect(-24, -31, 12, 6);
		c.restore();
		c.beginPath();
		c.moveTo(540, 150);
		c.lineTo(552, 106);
		c.lineTo(574, 92);
		c.lineTo(604, 100);
		c.lineTo(630, 80);
		ink(c, 3, 'rgba(255,150,100,.5)');
		// a rolled-down shutter downstairs
		rr(c, 600, 268, 170, 106, 3);
		c.fillStyle = lin(c, 0, 268, 0, 374, [[0, '#6b6378'], [1, '#3b3448']]);
		c.fill();
		ink(c, 3.5);
		for (let y = 278; y < 374; y += 9) {
			c.beginPath();
			c.moveTo(602, y);
			c.lineTo(768, y);
			ink(c, 1.4, 'rgba(10,4,20,.5)');
		}
		// graffiti leaf on the shutter (the site's joke)
		c.save();
		c.translate(684, 296);
		c.scale(2.6, 2.6);
		c.translate(-12, -14);
		c.beginPath();
		c.moveTo(12, 20);
		c.lineTo(12, 23.4);
		c.lineWidth = 1.4;
		c.strokeStyle = '#1f6a2a';
		c.stroke();
		for (const d of LEAF_PATHS) {
			const p = new Path2D(d);
			c.fillStyle = 'rgba(95,227,106,.75)';
			c.fill(p);
			c.lineWidth = 0.7;
			c.strokeStyle = '#0b3d14';
			c.stroke(p);
		}
		c.restore();
		bulletHoles(c, [
			[560, 128],
			[700, 240],
			[790, 200],
			[612, 236]
		]);
		// AC unit hanging off the wall
		rr(c, 556, 196, 34, 24, 3);
		c.fillStyle = '#9a96a6';
		c.fill();
		ink(c, 2.6);
		for (let y = 201; y < 218; y += 4) {
			c.beginPath();
			c.moveTo(560, y);
			c.lineTo(586, y);
			ink(c, 1.2, '#4a4658');
		}
		// windows (the spots at the back)
		for (const sp of SPOTS) if (sp.cover === 'window') windowOpening(c, sp);
		// the burger joint: posts, back wall, menu boards, roof, sign board, awning
		c.fillStyle = lin(c, 0, 240, 0, 384, [[0, '#2a0812'], [1, '#5c1a2a']]);
		c.fillRect(298, 238, 204, 146);
		for (const [mx, items] of [
			[316, 3],
			[412, 3]
		]) {
			rr(c, mx, 256, 72, 50, 4);
			c.fillStyle = '#160a0e';
			c.fill();
			ink(c, 2.6);
			for (let k = 0; k < items; k++) {
				c.beginPath();
				c.moveTo(mx + 8, 270 + k * 12);
				c.lineTo(mx + 44, 270 + k * 12);
				ink(c, 2, 'rgba(255,240,220,.55)');
				circle(c, mx + 60, 270 + k * 12, 2.4);
				c.fillStyle = '#ffc928';
				c.fill();
			}
		}
		c.fillStyle = rad(c, 400, 384, 120, [[0, 'rgba(255,150,60,.5)'], [1, 'rgba(255,120,40,0)']]);
		c.fillRect(298, 238, 204, 146);
		for (const px of [284, 502]) {
			rr(c, px, 196, 14, 188, 3);
			c.fillStyle = lin(c, px, 0, px + 14, 0, [[0, '#7a2230'], [1, '#4a1220']]);
			c.fill();
			ink(c, 3);
		}
		rr(c, 276, 188, 248, 14, 3);
		c.fillStyle = '#2c1420';
		c.fill();
		ink(c, 3.5);
		rr(c, 318, 136, 164, 50, 8);
		c.fillStyle = lin(c, 0, 136, 0, 186, [[0, '#221030'], [1, '#12081a']]);
		c.fill();
		ink(c, 4);
		for (const lx of [340, 460]) {
			c.beginPath();
			c.moveTo(lx, 186);
			c.lineTo(lx, 190);
			ink(c, 4);
		}
		// awning stripes with a scalloped edge
		c.save();
		c.beginPath();
		c.moveTo(270, 200);
		c.lineTo(530, 200);
		c.lineTo(538, 236);
		for (let x = 538; x > 262; x -= 23) c.arc(x - 11.5, 236, 11.5, 0, Math.PI);
		c.lineTo(262, 236);
		c.closePath();
		c.clip();
		for (let k = 0, x = 262; x < 540; x += 23, k++) {
			c.fillStyle = k % 2 ? '#fff1d6' : '#e2261f';
			c.fillRect(x, 198, 23, 52);
		}
		c.fillStyle = lin(c, 0, 200, 0, 248, [[0, 'rgba(255,255,255,.18)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(40,0,10,.35)']]);
		c.fillRect(262, 198, 280, 52);
		c.restore();
		c.beginPath();
		c.moveTo(270, 200);
		c.lineTo(530, 200);
		c.lineTo(538, 236);
		for (let x = 538; x > 262; x -= 23) c.arc(x - 11.5, 236, 11.5, 0, Math.PI);
		c.lineTo(262, 236);
		c.closePath();
		ink(c, 3.5);
		// street lamp
		c.beginPath();
		c.moveTo(262, 384);
		c.lineTo(262, 150);
		c.quadraticCurveTo(262, 134, 280, 134);
		ink(c, 7);
		c.beginPath();
		c.moveTo(262, 384);
		c.lineTo(262, 150);
		c.quadraticCurveTo(262, 134, 280, 134);
		ink(c, 3, '#4a3a58');
		rr(c, 272, 132, 22, 10, 4);
		c.fillStyle = '#2a2236';
		c.fill();
		ink(c, 2.6);
		// rubble at the foot of the buildings
		const rb = rng(77);
		for (const [cx, cy, n] of [
			[250, 380, 7],
			[540, 382, 6],
			[20, 386, 5],
			[760, 384, 6]
		]) {
			for (let k = 0; k < n; k++) {
				const x = cx + (rb() - 0.5) * 70;
				const y = cy + rb() * 10;
				const sz = 6 + rb() * 10;
				c.beginPath();
				c.moveTo(x - sz, y + sz * 0.4);
				c.lineTo(x - sz * 0.4, y - sz * 0.6);
				c.lineTo(x + sz * 0.6, y - sz * 0.5);
				c.lineTo(x + sz, y + sz * 0.4);
				c.closePath();
				c.fillStyle = rb() < 0.5 ? '#6a4a5a' : '#8a5a5a';
				c.fill();
				ink(c, 2.2);
			}
		}
		// burning barrel (the flames are drawn live)
		rr(c, 282, 452, 34, 46, 5);
		c.fillStyle = lin(c, 282, 0, 316, 0, [[0, '#3a4a6a'], [0.5, '#5a6a8a'], [1, '#26324a']]);
		c.fill();
		ink(c, 3.5);
		for (const y of [464, 486]) {
			c.beginPath();
			c.moveTo(283, y);
			c.lineTo(315, y);
			ink(c, 2.4);
		}
		c.beginPath();
		c.ellipse(299, 453, 16, 4, 0, 0, Math.PI * 2);
		c.fillStyle = '#ffb347';
		c.fill();
		ink(c, 2.4);
	}

	function sill(c: Ctx, sp: Spot) {
		const cl = sp.clip!;
		rr(c, cl.x0 - 14, sp.base - 4, cl.x1 - cl.x0 + 28, 14, 3);
		c.fillStyle = lin(c, 0, sp.base - 4, 0, sp.base + 10, [[0, '#d8aa9a'], [1, '#8a5a52']]);
		c.fill();
		ink(c, 3.5);
		c.beginPath();
		c.moveTo(cl.x0 - 10, sp.base - 1);
		c.lineTo(cl.x1 + 10, sp.base - 1);
		ink(c, 2, 'rgba(255,240,230,.55)');
		// broken glass in a top corner + a bit of a frame
		const left = sp.id === 'w0' || sp.id === 'w2';
		const gx = left ? cl.x0 : cl.x1;
		const d = left ? 1 : -1;
		c.beginPath();
		c.moveTo(gx, cl.y0);
		c.lineTo(gx + d * 30, cl.y0);
		c.lineTo(gx + d * 12, cl.y0 + 14);
		c.lineTo(gx + d * 18, cl.y0 + 30);
		c.lineTo(gx, cl.y0 + 42);
		c.closePath();
		c.fillStyle = 'rgba(190,225,255,.32)';
		c.fill();
		ink(c, 2);
		c.beginPath();
		c.moveTo(gx + d * 6, cl.y0 + 6);
		c.lineTo(gx + d * 16, cl.y0 + 4);
		ink(c, 1.6, 'rgba(255,255,255,.7)');
		const gx2 = left ? cl.x1 : cl.x0;
		c.beginPath();
		c.moveTo(gx2, sp.base - 4);
		c.lineTo(gx2 - d * 16, sp.base - 4);
		c.lineTo(gx2 - d * 6, sp.base - 18);
		c.closePath();
		c.fillStyle = 'rgba(190,225,255,.3)';
		c.fill();
		ink(c, 1.8);
	}

	function crate(c: Ctx, x: number, y: number, w: number, h: number, mark: 'ammo' | 'burger' | 'leaf' | '') {
		rr(c, x, y, w, h, 4);
		c.fillStyle = lin(c, 0, y, 0, y + h, [[0, '#c27d3c'], [1, '#7a4520']]);
		c.fill();
		ink(c, 4);
		c.save();
		rr(c, x, y, w, h, 4);
		c.clip();
		c.strokeStyle = 'rgba(70,30,8,.55)';
		c.lineWidth = 2;
		for (let py = y + h / 3; py < y + h - 2; py += h / 3) {
			c.beginPath();
			c.moveTo(x, py);
			c.lineTo(x + w, py);
			c.stroke();
		}
		c.lineWidth = 7;
		c.strokeStyle = 'rgba(150,90,40,.9)';
		c.beginPath();
		c.moveTo(x + 6, y + h - 6);
		c.lineTo(x + w - 6, y + 6);
		c.stroke();
		c.lineWidth = 2;
		c.strokeStyle = 'rgba(70,30,8,.6)';
		c.stroke();
		c.restore();
		c.lineWidth = 4;
		c.strokeStyle = O;
		c.strokeRect(x + 5, y + 5, w - 10, h - 10);
		c.strokeStyle = 'rgba(255,220,170,.35)';
		c.lineWidth = 2;
		c.beginPath();
		c.moveTo(x + 4, y + 3);
		c.lineTo(x + w - 4, y + 3);
		c.stroke();
		for (const [bx, by] of [
			[x + 2, y + 2],
			[x + w - 12, y + 2],
			[x + 2, y + h - 12],
			[x + w - 12, y + h - 12]
		]) {
			rr(c, bx, by, 10, 10, 2);
			c.fillStyle = '#9a96a6';
			c.fill();
			ink(c, 2);
		}
		const cx = x + w / 2;
		const cy = y + h / 2;
		if (mark === 'ammo') {
			rr(c, cx - 26, cy - 11, 52, 22, 3);
			c.fillStyle = 'rgba(30,20,10,.55)';
			c.fill();
			c.font = `700 16px ${FONT}`;
			c.textAlign = 'center';
			c.fillStyle = '#ffd23a';
			c.fillText(s.crate, cx, cy + 6);
		} else if (mark === 'burger') {
			c.fillStyle = 'rgba(30,15,5,.6)';
			c.beginPath();
			c.moveTo(cx - 16, cy);
			c.quadraticCurveTo(cx - 16, cy - 16, cx, cy - 16);
			c.quadraticCurveTo(cx + 16, cy - 16, cx + 16, cy);
			c.closePath();
			c.fill();
			c.fillRect(cx - 17, cy + 3, 34, 5);
			rr(c, cx - 15, cy + 10, 30, 6, 3);
			c.fill();
		} else if (mark === 'leaf') {
			c.save();
			c.translate(cx - 18, cy - 20);
			c.scale(1.5, 1.5);
			c.fillStyle = 'rgba(30,15,5,.55)';
			for (const d of LEAF_PATHS) c.fill(new Path2D(d));
			c.strokeStyle = 'rgba(30,15,5,.55)';
			c.lineWidth = 1.2;
			c.stroke(new Path2D(LEAF_STEM));
			c.restore();
		}
	}

	function paintRow1(c: Ctx) {
		// left crate stack (spot k0) + right one (k1)
		crate(c, 66, 426, 82, 58, 'ammo');
		crate(c, 148, 426, 84, 58, 'leaf');
		crate(c, 94, 372, 112, 56, 'burger');
		crate(c, 586, 418, 82, 58, 'burger');
		crate(c, 668, 418, 78, 58, 'ammo');
		crate(c, 608, 364, 112, 56, 'ammo');
		// the counter: steel top, red front with stripes and the burger badge
		rr(c, 292, 392, 216, 82, 4);
		c.fillStyle = lin(c, 0, 392, 0, 474, [[0, '#d63a2a'], [1, '#8a1414']]);
		c.fill();
		ink(c, 4);
		c.save();
		rr(c, 292, 392, 216, 82, 4);
		c.clip();
		for (let x = 300; x < 510; x += 26) {
			c.fillStyle = 'rgba(255,241,214,.85)';
			c.fillRect(x, 392, 8, 82);
		}
		c.fillStyle = 'rgba(0,0,0,.25)';
		c.fillRect(292, 392, 216, 10);
		c.restore();
		circle(c, 400, 432, 27);
		c.fillStyle = rad(c, 400, 432, 30, [[0, '#fff6b0'], [0.5, '#ffc928'], [1, '#b86e00']], 392, 422);
		c.fill();
		ink(c, 3.5);
		c.beginPath();
		c.moveTo(384, 430);
		c.quadraticCurveTo(384, 414, 400, 414);
		c.quadraticCurveTo(416, 414, 416, 430);
		c.closePath();
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 2);
		rr(c, 383, 432, 34, 5, 2);
		c.fillStyle = '#4fb23a';
		c.fill();
		rr(c, 383, 438, 34, 6, 3);
		c.fillStyle = '#6b3a1c';
		c.fill();
		rr(c, 385, 445, 30, 6, 3);
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 1.6);
		rr(c, 284, 374, 232, 20, 5);
		c.fillStyle = lin(c, 0, 374, 0, 394, [[0, '#f4ecf6'], [0.5, '#bdb4c8'], [1, '#7a7090']]);
		c.fill();
		ink(c, 4);
		c.beginPath();
		c.moveTo(290, 378);
		c.lineTo(510, 378);
		ink(c, 2, 'rgba(255,255,255,.8)');
		// ketchup + mustard bottles and a napkin box on the counter
		for (const [bx, col] of [
			[302, '#e2261f'],
			[318, '#ffc928']
		] as const) {
			c.beginPath();
			c.moveTo(bx - 6, 376);
			c.lineTo(bx - 6, 352);
			c.quadraticCurveTo(bx - 6, 344, bx, 342);
			c.lineTo(bx, 334);
			c.lineTo(bx + 2, 334);
			c.lineTo(bx + 2, 342);
			c.quadraticCurveTo(bx + 8, 344, bx + 8, 352);
			c.lineTo(bx + 8, 376);
			c.closePath();
			c.fillStyle = col;
			c.fill();
			ink(c, 2.6);
			c.beginPath();
			c.moveTo(bx - 3, 354);
			c.lineTo(bx - 3, 368);
			ink(c, 2, 'rgba(255,255,255,.6)');
		}
		rr(c, 484, 358, 20, 18, 3);
		c.fillStyle = '#c9c4d6';
		c.fill();
		ink(c, 2.6);
		c.beginPath();
		c.moveTo(490, 358);
		c.lineTo(492, 350);
		c.lineTo(498, 352);
		c.lineTo(497, 358);
		c.fillStyle = '#ffffff';
		c.fill();
		ink(c, 1.6);
	}

	function sandbags(c: Ctx, x0: number, x1: number, top: number, seedN: number) {
		const r = rng(seedN);
		for (let row = 2; row >= 0; row--) {
			const y = top + row * 24;
			const off = row % 2 ? 0 : -24;
			for (let x = x0 + off; x < x1 - 10; x += 50) {
				const bx = Math.max(x0, x);
				const bw = Math.min(x1, x + 52) - bx;
				if (bw < 18) continue;
				const lift = row === 0 ? r() * 4 : 0;
				rr(c, bx, y - lift, bw, 30 + lift, 13);
				c.fillStyle = lin(c, 0, y - lift, 0, y + 30, [[0, '#e6c88a'], [0.5, '#bf9a5c'], [1, '#7f5f30']]);
				c.fill();
				ink(c, 3.5);
				c.beginPath();
				c.moveTo(bx + 10, y + 7 - lift);
				c.quadraticCurveTo(bx + bw / 2, y + 2 - lift, bx + bw - 10, y + 7 - lift);
				ink(c, 2, 'rgba(255,245,215,.55)');
				c.beginPath();
				c.moveTo(bx + bw - 12, y + 8);
				c.lineTo(bx + bw - 8, y + 22);
				ink(c, 1.6, 'rgba(70,45,15,.55)');
			}
		}
		c.fillStyle = 'rgba(10,2,10,.35)';
		c.fillRect(x0 + 6, top + 74, x1 - x0 - 12, 6);
	}

	function paintRow2(c: Ctx) {
		c.fillStyle = lin(c, 0, 552, 0, 600, [[0, '#1d0b16'], [1, '#0d0409']]);
		c.fillRect(0, 556, W, 44);
		sandbags(c, 14, 280, 484, 3);
		sandbags(c, 318, 482, 484, 4);
		sandbags(c, 520, 788, 484, 6);
		// brass casings in the dirt
		const r = rng(91);
		for (let k = 0; k < 9; k++) {
			c.save();
			c.translate(30 + r() * 740, 570 + r() * 22);
			c.rotate(r() * Math.PI);
			rr(c, -6, -2.5, 12, 5, 2);
			c.fillStyle = '#e8b84a';
			c.fill();
			ink(c, 1.6);
			c.restore();
		}
	}

	function paintRow0(c: Ctx) {
		for (const sp of SPOTS) if (sp.cover === 'window') sill(c, sp);
	}

	// ── the game ─────────────────────────────────────────────────────────────────────────────────────
	type Live = {
		sp: Spawn;
		dead: number;
		deadRise: number;
		deadX: number;
		tilt: number;
		flee: number;
		fleeFrom: number;
	};
	type Part = { k: 0 | 1 | 2 | 3; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; rot: number; vr: number; color: string };
	type Pop = { x: number; y: number; text: string; sub: string; color: string; size: number; life: number; max: number };
	type Mark = { x: number; y: number; life: number; max: number; tone: 'white' | 'red' | 'gold' };
	type Hole = { x: number; y: number; life: number };

	const DEBRIS: Record<TargetKind, string[]> = {
		soldier: ['#6f8f3a', '#33461b', '#2a2530', '#c98058'],
		hvt: ['#ffd65a', '#fff3a0', '#c98a00', '#ffffff'],
		dummy: ['#f8d596', '#dda55f', '#a7672e', '#e2261f'],
		burger: ['#fff6d0', '#4fb23a', '#f0a24a', '#6b3a1c', '#ffc928'],
		mascot: ['#ffffff'],
		duck: ['#ffd23a']
	};

	$effect(() => {
		if (!root || !canvas) return;
		const el = root;
		const cv = canvas;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const c = ctx;
		const runSeed = untrack(() => seed) >>> 0;
		const plan = schedule(runSeed);
		const fx = rng((runSeed ^ 0x5bd1e995) >>> 0);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

		// layers
		const layers = { bg: document.createElement('canvas'), r0: document.createElement('canvas'), r1: document.createElement('canvas'), r2: document.createElement('canvas') };
		const puff = document.createElement('canvas');
		let sx = 1;
		let sy = 1;
		let hudK = 1;
		function resize() {
			const box = el.getBoundingClientRect();
			if (box.width < 10) return;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const pw = Math.round(box.width * dpr);
			const ph = Math.round(box.height * dpr);
			hudK = Math.max(1, Math.min(1.25, 520 / box.width));
			if (pw === cv.width && ph === cv.height) return;
			cv.width = pw;
			cv.height = ph;
			sx = pw / W;
			sy = ph / H;
			for (const [name, paint] of [
				['bg', paintBg],
				['r0', paintRow0],
				['r1', paintRow1],
				['r2', paintRow2]
			] as const) {
				const lc = layers[name];
				lc.width = pw;
				lc.height = ph;
				const g = lc.getContext('2d');
				if (!g) continue;
				g.setTransform(sx, 0, 0, sy, 0, 0);
				paint(g);
			}
			puff.width = puff.height = 64;
			const pc = puff.getContext('2d');
			if (pc) {
				pc.fillStyle = rad(pc, 32, 32, 32, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
				pc.fillRect(0, 0, 64, 64);
			}
			draw();
		}

		// state
		let clock = 0;
		let last = performance.now();
		let raf = 0;
		let paused = false;
		let ended = false;
		let endAt = 0;
		let reported = false;
		let next = 0;
		let points = 0;
		let shown = 0;
		let hits = 0;
		let shots = 0;
		let combo = 0;
		let shake = 0;
		let redFlash = 0;
		let streakPop = 0;
		let streakText = '';
		let recoil = 0;
		const live: Live[] = [];
		const parts: Part[] = [];
		const pops: Pop[] = [];
		const marks: Mark[] = [];
		const holes: Hole[] = [];
		const pointer = { x: 0, y: 0, mouse: false, inside: false };
		const flashes: { x: number; y: number; life: number }[] = [];

		const easeOutBack = (p: number) => {
			const k = reduce ? 0 : 1.4;
			return 1 + (k + 1) * (p - 1) ** 3 + k * (p - 1) ** 2;
		};
		function riseOf(L: Live): number {
			if (L.dead >= 0) return L.deadRise;
			if (L.flee >= 0) {
				const p = Math.min(1, (clock - L.flee) / 140);
				return L.fleeFrom * (1 - p * p);
			}
			const age = clock - L.sp.t;
			if (age < RISE_MS) return easeOutBack(Math.max(0, age / RISE_MS));
			const up = age - RISE_MS;
			if (up < L.sp.stay) return 1 + (reduce ? 0 : Math.sin(up / 150) * 0.012);
			const p = (up - L.sp.stay) / DUCK_MS;
			return p >= 1 ? 0 : 1 - p * p;
		}
		function xOf(L: Live): number {
			const sp = SPOTS[L.sp.spot];
			if (L.dead >= 0) return L.deadX;
			if (L.sp.kind !== 'hvt' || !sp.hvt) return sp.x;
			return sp.x + sp.hvt * Math.sin(((clock - L.sp.t) / 1000) * 2.5) * L.sp.dir;
		}
		function yOf(L: Live, rise: number): number {
			const sp = SPOTS[L.sp.spot];
			return sp.base + (1 - rise) * SINK * sp.scale;
		}
		function gone(L: Live): boolean {
			if (L.dead >= 0) return clock - L.dead > 320;
			if (L.flee >= 0) return clock - L.flee > 160;
			return clock - L.sp.t > RISE_MS + L.sp.stay + DUCK_MS;
		}

		function burst(x: number, y: number, colors: string[], n: number, power = 1) {
			const count = reduce ? Math.ceil(n / 2) : n;
			for (let i = 0; i < count; i++) {
				const a = -Math.PI / 2 + (fx() - 0.5) * 2.6;
				const v = (160 + fx() * 320) * power;
				parts.push({ k: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 520 + fx() * 380, size: 3 + fx() * 5, rot: fx() * 6, vr: (fx() - 0.5) * 18, color: colors[Math.floor(fx() * colors.length)] });
			}
			for (let i = 0; i < (reduce ? 2 : 5); i++) {
				const a = fx() * Math.PI * 2;
				parts.push({ k: 2, x, y, vx: Math.cos(a) * (300 + fx() * 300), vy: Math.sin(a) * (300 + fx() * 300), life: 0, max: 140 + fx() * 80, size: 2, rot: a, vr: 0, color: '#fff2b0' });
			}
		}
		function dust(x: number, y: number, n: number, color = '#b88a6a') {
			for (let i = 0; i < (reduce ? 1 : n); i++)
				parts.push({ k: 1, x: x + (fx() - 0.5) * 10, y: y + (fx() - 0.5) * 6, vx: (fx() - 0.5) * 60, vy: -30 - fx() * 50, life: 0, max: 500 + fx() * 300, size: 10 + fx() * 10, rot: 0, vr: 0, color });
		}
		function pop(x: number, y: number, txt: string, color: string, size: number, sub = '') {
			pops.push({ x, y, text: txt, sub, color, size, life: 0, max: 820 });
		}

		/** the target under a point, front row first */
		function targetAt(px: number, py: number): { L: Live; zone: 'head' | 'body' } | null {
			const order = [...live].sort((a, b) => SPOTS[b.sp.spot].row - SPOTS[a.sp.spot].row || b.sp.t - a.sp.t);
			for (const L of order) {
				if (L.dead >= 0 || L.flee >= 0) continue;
				const rise = riseOf(L);
				if (rise < 0.3) continue;
				const sp = SPOTS[L.sp.spot];
				if (py > sp.base + 4) continue;
				if (sp.clip && (px < sp.clip.x0 || px > sp.clip.x1 || py < sp.clip.y0)) continue;
				const lx = (px - xOf(L)) / sp.scale;
				const ly = (py - yOf(L, rise)) / sp.scale;
				const zone = hitZone(L.sp.kind, lx, ly);
				if (zone) return { L, zone };
			}
			return null;
		}

		function shoot(px: number, py: number) {
			if (ended || paused) return;
			shots++;
			recoil = 1;
			const hit = targetAt(px, py);
			if (!hit) {
				if (combo >= 3) pop(px, py - 20, s.streakLost, '#ff6a5a', 24);
				combo = 0;
				holes.push({ x: px, y: py, life: 0 });
				if (holes.length > 14) holes.shift();
				dust(px, py, 4);
				burst(px, py, ['#8a6a5a', '#5a4048', '#c9a080'], 4, 0.45);
				return;
			}
			const { L, zone } = hit;
			const sp = SPOTS[L.sp.spot];
			if (isCivilian(L.sp.kind)) {
				combo = 0;
				points = Math.max(0, points - CIVILIAN_PENALTY);
				redFlash = 1;
				if (!reduce) shake = Math.max(shake, 11);
				L.flee = clock;
				L.fleeFrom = riseOf(L);
				pop(px, py - 24, `−${CIVILIAN_PENALTY}`, '#ff4a3d', 36, s.civilian);
				sound.play('clack');
				return;
			}
			hits++;
			combo++;
			const head = zone === 'head';
			const before = comboMult(combo - 1);
			const gain = hitPoints(L.sp.kind, head, combo);
			points += gain;
			L.deadRise = riseOf(L);
			L.deadX = xOf(L);
			L.dead = clock;
			L.tilt = (fx() < 0.5 ? -1 : 1) * (0.15 + fx() * 0.2);
			const hvt = L.sp.kind === 'hvt';
			marks.push({ x: px, y: py, life: 0, max: 360, tone: hvt ? 'gold' : head ? 'red' : 'white' });
			flashes.push({ x: px, y: py, life: 0 });
			const label = hvt ? s.hvtDown : head ? (L.sp.kind === 'dummy' && Math.abs(py - (yOf(L, L.deadRise) - 40 * sp.scale)) < 20 * sp.scale ? s.bullseye : s.headshot) : '';
			pop(px, py - 26, `+${gain.toLocaleString('en-US')}`, hvt ? '#ffd23a' : head ? '#ffe36a' : '#ffffff', hvt ? 46 : head ? 38 : 32, label);
			burst(px, py, DEBRIS[L.sp.kind], hvt ? 22 : 14, sp.scale);
			if (hvt)
				for (let i = 0; i < (reduce ? 4 : 12); i++) {
					const a = fx() * Math.PI * 2;
					parts.push({ k: 3, x: px, y: py, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220 - 80, life: 0, max: 700, size: 7 + fx() * 6, rot: 0, vr: 4, color: '#fff3a0' });
				}
			if (!reduce) shake = Math.max(shake, hvt ? 8 : head ? 4.5 : 3);
			const after = comboMult(combo);
			if (after > before) {
				streakPop = 1;
				streakText = s.streak(after % 1 ? after.toFixed(1) : String(after));
			}
			sound.play(hvt ? 'maxed' : 'camo');
		}

		function finish() {
			if (reported) return;
			reported = true;
			cancelAnimationFrame(raf);
			onend(finalScore(points, hits, shots));
		}

		function update(dt: number) {
			clock += dt;
			if (!ended && clock >= DURATION) {
				ended = true;
				endAt = clock;
				for (const L of live)
					if (L.dead < 0 && L.flee < 0) {
						L.fleeFrom = riseOf(L);
						L.flee = clock;
					}
				sound.play('maxed');
			}
			while (!ended && next < plan.length && plan[next].t <= clock) {
				live.push({ sp: plan[next], dead: -1, deadRise: 0, deadX: 0, tilt: 0, flee: -1, fleeFrom: 0 });
				next++;
			}
			for (let i = live.length - 1; i >= 0; i--) if (gone(live[i])) live.splice(i, 1);
			// HVT sparkle trail
			for (const L of live)
				if (L.sp.kind === 'hvt' && L.dead < 0 && L.flee < 0 && fx() < dt / (reduce ? 400 : 120)) {
					const sp = SPOTS[L.sp.spot];
					const rise = riseOf(L);
					parts.push({ k: 3, x: xOf(L) + (fx() - 0.5) * 100 * sp.scale, y: yOf(L, rise) - (40 + fx() * 110) * sp.scale, vx: 0, vy: -20, life: 0, max: 500, size: 5 + fx() * 5, rot: 0, vr: 3, color: '#fff6c0' });
				}
			const k = dt / 1000;
			for (let i = parts.length - 1; i >= 0; i--) {
				const p = parts[i];
				p.life += dt;
				if (p.life >= p.max) {
					parts.splice(i, 1);
					continue;
				}
				p.x += p.vx * k;
				p.y += p.vy * k;
				p.rot += p.vr * k;
				if (p.k === 0) p.vy += 980 * k;
				else if (p.k === 1) {
					p.vx *= 0.96;
					p.size += 24 * k;
				}
			}
			for (const list of [pops, marks, holes, flashes] as { life: number; max?: number }[][]) for (const it of list) it.life += dt;
			for (let i = pops.length - 1; i >= 0; i--) if (pops[i].life > pops[i].max) pops.splice(i, 1);
			for (let i = marks.length - 1; i >= 0; i--) if (marks[i].life > marks[i].max) marks.splice(i, 1);
			for (let i = holes.length - 1; i >= 0; i--) if (holes[i].life > 1800) holes.splice(i, 1);
			for (let i = flashes.length - 1; i >= 0; i--) if (flashes[i].life > 90) flashes.splice(i, 1);
			shake *= Math.pow(0.0015, k);
			if (shake < 0.2) shake = 0;
			redFlash = Math.max(0, redFlash - k * 2.4);
			streakPop = Math.max(0, streakPop - k * 1.3);
			recoil = Math.max(0, recoil - k * 7);
			shown += (points - shown) * Math.min(1, k * 12);
			if (Math.abs(points - shown) < 1) shown = points;
			if (ended && clock - endAt > 950) finish();
		}

		// ── frame drawing ──
		function blit(layer: HTMLCanvasElement, ox: number, oy: number) {
			c.setTransform(1, 0, 0, 1, ox * sx, oy * sy);
			c.drawImage(layer, 0, 0);
			c.setTransform(sx, 0, 0, sy, ox * sx, oy * sy);
		}
		function drawTarget(L: Live) {
			const sp = SPOTS[L.sp.spot];
			const rise = riseOf(L);
			if (rise <= 0.001) return;
			const t = clock - L.sp.t;
			c.save();
			c.beginPath();
			if (sp.clip) c.rect(sp.clip.x0, sp.clip.y0, sp.clip.x1 - sp.clip.x0, sp.base + 6 - sp.clip.y0);
			else c.rect(0, 0, W, sp.base + 16);
			c.clip();
			c.translate(xOf(L), yOf(L, rise));
			c.scale(sp.scale, sp.scale);
			if (L.dead >= 0) {
				const p = Math.min(1, (clock - L.dead) / 280);
				c.translate(0, 50 + p * 40);
				c.rotate(L.tilt * p);
				c.scale(1 + 0.12 * p, Math.max(0.03, Math.cos((p * Math.PI) / 2)));
				c.translate(0, -50);
				if (clock - L.dead < 70) c.filter = 'brightness(2.4) saturate(.3)';
			} else if (L.flee >= 0) {
				c.rotate(Math.sin((clock - L.flee) / 18) * 0.08);
			}
			drawKind(c, L.sp.kind, t);
			c.restore();
			if (L.flee >= 0 && !ended) {
				const p = (clock - L.flee) / 160;
				text(c, '!', xOf(L), sp.base - 70 * sp.scale - p * 20, 44 * sp.scale, '#ff4a3d');
			}
		}
		function drawAmbient() {
			const t = clock;
			// smoke from the roofs
			for (const [ox, oy, seedOff] of [
				[120, 84, 0],
				[700, 80, 0.5]
			]) {
				for (let i = 0; i < 9; i++) {
					const a = ((t * 0.00011 + i / 9 + seedOff) % 1 + 1) % 1;
					const x = ox - a * 70 + Math.sin(a * 7 + i) * 8;
					const y = oy - a * 150;
					const size = 20 + a * 70;
					c.globalAlpha = 0.32 * (1 - a) * Math.min(1, a * 6);
					c.filter = 'none';
					c.drawImage(puff, x - size / 2, y - size / 2, size, size);
				}
			}
			c.globalAlpha = 1;
			// neon sign
			const flick = reduce ? 1 : Math.sin(t / 60) > 0.96 || (t % 3700 > 3550 && t % 140 < 70) ? 0.35 : 1;
			c.save();
			c.font = `700 34px ${FONT}`;
			c.textAlign = 'center';
			c.lineWidth = 10;
			c.strokeStyle = `rgba(255,70,170,${0.28 * flick})`;
			c.strokeText(s.sign, 400, 174);
			c.lineWidth = 4;
			c.strokeStyle = `rgba(255,120,200,${0.9 * flick})`;
			c.strokeText(s.sign, 400, 174);
			c.fillStyle = `rgba(255,230,245,${0.95 * flick})`;
			c.fillText(s.sign, 400, 174);
			c.restore();
			// lamp
			const lamp = reduce ? 1 : 0.85 + Math.sin(t / 47) * 0.08 + (t % 2300 < 90 ? -0.5 : 0);
			c.fillStyle = rad(c, 283, 146, 90, [[0, `rgba(255,220,140,${0.5 * lamp})`], [1, 'rgba(255,200,120,0)']]);
			c.fillRect(193, 56, 180, 180);
			circle(c, 283, 144, 5);
			c.fillStyle = `rgba(255,245,200,${lamp})`;
			c.fill();
			// barrel fire
			for (let i = 0; i < 4; i++) {
				const ph = t / (90 + i * 23) + i * 2;
				const h = 26 + Math.sin(ph) * 8 + i * 3;
				const x = 288 + i * 7.5;
				c.beginPath();
				c.moveTo(x - 7, 454);
				c.quadraticCurveTo(x - 6 + Math.sin(ph * 1.3) * 4, 454 - h * 0.6, x + Math.sin(ph) * 3, 454 - h);
				c.quadraticCurveTo(x + 6, 454 - h * 0.5, x + 7, 454);
				c.closePath();
				c.fillStyle = i % 2 ? 'rgba(255,190,70,.9)' : 'rgba(255,100,40,.85)';
				c.fill();
			}
			c.fillStyle = rad(c, 299, 440, 60, [[0, 'rgba(255,150,60,.35)'], [1, 'rgba(255,120,40,0)']]);
			c.fillRect(239, 380, 120, 120);
		}
		function drawHole(h: Hole) {
			const a = h.life < 1200 ? 1 : 1 - (h.life - 1200) / 600;
			c.globalAlpha = Math.max(0, a);
			circle(c, h.x, h.y, 4.5);
			c.fillStyle = '#0a0308';
			c.fill();
			c.strokeStyle = 'rgba(255,220,190,.5)';
			c.lineWidth = 1.6;
			c.stroke();
			c.beginPath();
			for (let k = 0; k < 4; k++) {
				const ang = k * 1.7 + h.x;
				c.moveTo(h.x + Math.cos(ang) * 6, h.y + Math.sin(ang) * 6);
				c.lineTo(h.x + Math.cos(ang) * 12, h.y + Math.sin(ang) * 12);
			}
			c.strokeStyle = 'rgba(20,5,15,.6)';
			c.stroke();
			c.globalAlpha = 1;
		}
		function drawParts() {
			for (const p of parts) {
				const a = 1 - p.life / p.max;
				if (p.k === 0) {
					c.save();
					c.translate(p.x, p.y);
					c.rotate(p.rot);
					c.globalAlpha = Math.min(1, a * 2);
					c.beginPath();
					c.moveTo(-p.size, -p.size * 0.5);
					c.lineTo(p.size * 0.9, -p.size * 0.7);
					c.lineTo(p.size * 0.5, p.size * 0.6);
					c.lineTo(-p.size * 0.7, p.size * 0.5);
					c.closePath();
					c.fillStyle = p.color;
					c.fill();
					ink(c, 1.6);
					c.restore();
				} else if (p.k === 1) {
					c.globalAlpha = a * 0.5;
					c.filter = 'none';
					c.drawImage(puff, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
					c.globalAlpha = a * 0.35;
					circle(c, p.x, p.y, p.size * 0.6);
					c.fillStyle = p.color;
					c.fill();
				} else if (p.k === 2) {
					c.globalAlpha = a;
					c.beginPath();
					c.moveTo(p.x, p.y);
					c.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
					c.lineWidth = 2.4;
					c.lineCap = 'round';
					c.strokeStyle = p.color;
					c.stroke();
				} else {
					c.globalAlpha = Math.min(1, a * 2);
					const r = p.size * (0.6 + 0.4 * Math.sin(p.life / 60));
					c.beginPath();
					c.moveTo(p.x, p.y - r);
					c.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
					c.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
					c.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
					c.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
					c.fillStyle = p.color;
					c.fill();
				}
			}
			c.globalAlpha = 1;
		}
		function drawMark(m: Mark) {
			const p = m.life / m.max;
			const sc = 1 + Math.max(0, 1 - p * 5) * 0.6;
			c.globalAlpha = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
			const g = 7 * sc * hudK;
			const l = (m.tone === 'white' ? 13 : 17) * sc * hudK;
			const col = m.tone === 'gold' ? '#ffd23a' : m.tone === 'red' ? '#ff3b3b' : '#ffffff';
			for (const [dx, dy] of [
				[1, 1],
				[1, -1],
				[-1, 1],
				[-1, -1]
			]) {
				c.beginPath();
				c.moveTo(m.x + dx * g, m.y + dy * g);
				c.lineTo(m.x + dx * (g + l), m.y + dy * (g + l));
				c.lineCap = 'round';
				c.lineWidth = 8 * hudK;
				c.strokeStyle = O;
				c.stroke();
				c.lineWidth = 3.6 * hudK;
				c.strokeStyle = col;
				c.stroke();
			}
			c.globalAlpha = 1;
		}
		function drawPop(p: Pop) {
			const t = p.life / p.max;
			const sc = t < 0.1 ? 0.5 + (t / 0.1) * 0.7 : t < 0.2 ? 1.2 - ((t - 0.1) / 0.1) * 0.2 : 1;
			c.globalAlpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
			const size = p.size * sc * hudK;
			const y = Math.max(78 * hudK + size * 1.4, p.y - t * 50);
			const x = Math.max(60 * hudK, Math.min(W - 60 * hudK, p.x));
			text(c, p.text, x, y, size, p.color);
			if (p.sub) text(c, p.sub, x, y - size * 0.95, size * 0.5, p.color === '#ff4a3d' ? '#ffb0a8' : '#ffd23a');
			c.globalAlpha = 1;
		}
		function chip(x: number, y: number, w: number, h: number) {
			rr(c, x, y, w, h, h / 2.6);
			c.fillStyle = lin(c, 0, y, 0, y + h, [[0, 'rgba(46,16,66,.86)'], [1, 'rgba(18,6,30,.86)']]);
			c.fill();
			ink(c, 3);
			rr(c, x + 4, y + 3, w - 8, h * 0.4, h / 4);
			c.fillStyle = 'rgba(255,255,255,.07)';
			c.fill();
		}
		function drawHud() {
			const k = hudK;
			const left = Math.max(0, DURATION - clock) / DURATION;
			// time bar
			const bh = 11 * k;
			rr(c, 14, 7, W - 28, bh, bh / 2);
			c.fillStyle = 'rgba(12,4,22,.85)';
			c.fill();
			ink(c, 3);
			const low = left < 5000 / DURATION;
			const bw = (W - 32) * left;
			if (bw > 2) {
				rr(c, 16, 9, bw, bh - 4, (bh - 4) / 2);
				const col = left > 0.5 ? ['#b6ff7a', '#2fae46'] : left > 0.2 ? ['#ffe27a', '#e09a10'] : ['#ff8a7a', '#c4141b'];
				c.fillStyle = lin(c, 0, 9, 0, 9 + bh - 4, [[0, col[0]], [1, col[1]]]);
				c.globalAlpha = low && !reduce ? 0.65 + 0.35 * Math.sin(clock / 70) : 1;
				c.fill();
				c.globalAlpha = 1;
			}
			const y = 7 + bh + 6;
			const h = 40 * k;
			// score
			chip(14, y, 196 * k, h);
			c.save();
			c.translate(14 + 22 * k, y + h / 2);
			c.scale(k, k);
			c.beginPath();
			for (let i = 0; i < 10; i++) {
				const a = -Math.PI / 2 + (i * Math.PI) / 5;
				const r = i % 2 ? 5 : 11;
				c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
			}
			c.closePath();
			c.fillStyle = lin(c, 0, -11, 0, 11, [[0, '#fff6b0'], [1, '#e09a10']]);
			c.fill();
			ink(c, 2.4);
			c.restore();
			text(c, Math.round(shown).toLocaleString('en-US'), 14 + 40 * k, y + h * 0.74, 29 * k, '#ffffff', 'left');
			// time + accuracy
			const tw = 108 * k;
			chip(W - 14 - tw, y, tw, h);
			const secs = Math.max(0, (DURATION - clock) / 1000);
			c.save();
			c.translate(W - 14 - tw + 20 * k, y + h / 2);
			c.scale(k, k);
			circle(c, 0, 1, 10);
			c.fillStyle = low ? '#ff6a5a' : '#cfe8ff';
			c.fill();
			ink(c, 2.4);
			c.beginPath();
			c.moveTo(0, 1);
			c.lineTo(0, -5);
			c.moveTo(0, 1);
			c.lineTo(4, 3);
			ink(c, 2.2);
			rr(c, -3, -13, 6, 4, 1);
			c.fillStyle = O;
			c.fill();
			c.restore();
			text(c, secs < 10 ? secs.toFixed(1) : String(Math.ceil(secs)), W - 14 - 12 * k, y + h * 0.74, 29 * k, low ? '#ff8a7a' : '#ffffff', 'right');
			const aw = 118 * k;
			const ax = W - 14 - tw - 8 - aw;
			chip(ax, y, aw, h);
			c.save();
			c.translate(ax + 20 * k, y + h / 2);
			c.scale(k, k);
			circle(c, 0, 0, 9);
			ink(c, 6);
			circle(c, 0, 0, 9);
			ink(c, 2.6, '#9affb0');
			c.beginPath();
			c.moveTo(-13, 0);
			c.lineTo(-5, 0);
			c.moveTo(5, 0);
			c.lineTo(13, 0);
			c.moveTo(0, -13);
			c.lineTo(0, -5);
			c.moveTo(0, 5);
			c.lineTo(0, 13);
			ink(c, 2.4, '#9affb0');
			c.restore();
			const pct = shots ? Math.round(accuracy(hits, shots) * 100) : 100;
			text(c, `${pct}%`, ax + aw - 12 * k, y + h * 0.74, 29 * k, pct >= 80 ? '#b6ff7a' : pct >= 55 ? '#ffffff' : '#ffb0a8', 'right');
			// streak in the middle
			const cw = 128 * k;
			const mult = comboMult(Math.max(1, combo));
			const pulse = 1 + streakPop * 0.25;
			c.save();
			c.translate(W / 2, y + h / 2);
			c.scale(pulse, pulse);
			chip(-cw / 2, -h / 2, cw, h);
			const hot = combo >= 6;
			c.globalAlpha = combo > 0 ? 1 : 0.45;
			// flame icon
			c.save();
			c.translate(-cw / 2 + 20 * k, 2 * k);
			c.scale(k, k);
			c.beginPath();
			c.moveTo(0, 11);
			c.quadraticCurveTo(-11, 9, -9, -2);
			c.quadraticCurveTo(-7, -8, -2, -13);
			c.quadraticCurveTo(-1, -6, 3, -6);
			c.quadraticCurveTo(10, -2, 9, 4);
			c.quadraticCurveTo(8, 10, 0, 11);
			c.closePath();
			c.fillStyle = lin(c, 0, -13, 0, 11, [[0, '#ffe27a'], [1, hot ? '#ff3b1a' : '#ff8a2a']]);
			c.fill();
			ink(c, 2.4);
			c.restore();
			const multTxt = `×${mult % 1 ? mult.toFixed(1) : mult}`;
			text(c, multTxt, -cw / 2 + 38 * k, h * 0.24, 27 * k, hot ? lin(c, 0, -h / 2, 0, h / 2, [[0, '#fff6b0'], [1, '#ffb020']]) : '#ffffff', 'left');
			text(c, String(combo), cw / 2 - 12 * k, h * 0.2, 19 * k, '#ffd98a', 'right');
			c.globalAlpha = 1;
			c.restore();
		}
		function drawCrosshair() {
			if (!pointer.mouse || !pointer.inside || paused) return;
			const g = 7 + recoil * 9;
			const l = 11;
			const { x, y } = pointer;
			const over = targetAt(x, y);
			const col = over && !isCivilian(over.L.sp.kind) ? '#ff5a4a' : '#ffffff';
			c.lineCap = 'round';
			for (const [w, cc] of [
				[6, O],
				[2.6, col]
			] as const) {
				c.beginPath();
				c.moveTo(x - g - l, y);
				c.lineTo(x - g, y);
				c.moveTo(x + g, y);
				c.lineTo(x + g + l, y);
				c.moveTo(x, y - g - l);
				c.lineTo(x, y - g);
				c.moveTo(x, y + g);
				c.lineTo(x, y + g + l);
				c.lineWidth = w;
				c.strokeStyle = cc;
				c.stroke();
			}
			circle(c, x, y, 2.6);
			c.fillStyle = col;
			c.fill();
			ink(c, 1.4);
		}

		function draw() {
			if (!cv.width) return;
			const ox = shake ? (fx() - 0.5) * 2 * shake : 0;
			const oy = shake ? (fx() - 0.5) * 2 * shake : 0;
			c.setTransform(1, 0, 0, 1, 0, 0);
			c.fillStyle = '#0c0420';
			c.fillRect(0, 0, cv.width, cv.height);
			blit(layers.bg, ox, oy);
			c.filter = 'none';
			drawAmbient();
			for (const h of holes) drawHole(h);
			for (let row = 0; row < 3; row++) {
				for (const L of live) if (SPOTS[L.sp.spot].row === row) drawTarget(L);
				c.filter = 'none';
				blit(row === 0 ? layers.r0 : row === 1 ? layers.r1 : layers.r2, ox, oy);
			}
			for (const f of flashes) {
				const r = 18 + (f.life / 90) * 26;
				c.globalCompositeOperation = 'lighter';
				c.fillStyle = rad(c, f.x, f.y, r, [[0, 'rgba(255,255,230,.95)'], [0.4, 'rgba(255,220,120,.5)'], [1, 'rgba(255,180,60,0)']]);
				c.fillRect(f.x - r, f.y - r, r * 2, r * 2);
				c.globalCompositeOperation = 'source-over';
			}
			drawParts();
			for (const m of marks) drawMark(m);
			for (const p of pops) drawPop(p);
			// civilian hit: red edges
			if (redFlash > 0) {
				c.fillStyle = rad(c, W / 2, H / 2, 520, [[0, 'rgba(255,40,40,0)'], [0.6, `rgba(255,30,30,${0.18 * redFlash})`], [1, `rgba(200,0,0,${0.6 * redFlash})`]]);
				c.fillRect(-20, -20, W + 40, H + 40);
			}
			c.setTransform(sx, 0, 0, sy, 0, 0);
			drawHud();
			// GO! / streak pop / TIME!
			if (clock < 700) {
				const p = clock / 700;
				c.globalAlpha = 1 - p * p;
				const size = (90 + p * 40) * hudK;
				text(c, s.go, W / 2, H / 2 + size * 0.35, size, lin(c, 0, H / 2 - size * 0.6, 0, H / 2 + size * 0.4, [[0, '#fff6b0'], [1, '#ffb020']]));
				c.globalAlpha = 1;
			}
			if (streakPop > 0 && !ended) {
				c.globalAlpha = Math.min(1, streakPop * 2);
				const size = (40 + (1 - streakPop) * 10) * hudK;
				text(c, streakText, W / 2, 180 + (1 - streakPop) * -14, size, lin(c, 0, 150, 0, 185, [[0, '#fff6b0'], [1, '#ff9a20']]));
				c.globalAlpha = 1;
			}
			if (ended) {
				const p = Math.min(1, (clock - endAt) / 240);
				c.fillStyle = `rgba(8,2,16,${0.45 * p})`;
				c.fillRect(0, 0, W, H);
				const size = 110 * hudK * (reduce ? 1 : 1 + (1 - p) * 0.5);
				text(c, s.time, W / 2, H / 2 + 20, size, lin(c, 0, H / 2 - 70, 0, H / 2 + 20, [[0, '#fff6b0'], [1, '#ff7a20']]));
				text(c, s.accuracy(shots ? Math.round(accuracy(hits, shots) * 100) : 0), W / 2, H / 2 + 20 + 50 * hudK, 30 * hudK, '#ffffff');
			}
			drawCrosshair();
			if (paused) {
				c.fillStyle = 'rgba(8,2,16,.72)';
				c.fillRect(0, 0, W, H);
				text(c, s.paused, W / 2, H / 2 - 4, 64 * hudK, '#ffffff');
				text(c, s.tapToContinue, W / 2, H / 2 + 46 * hudK, 26 * hudK, '#ffd98a');
			}
		}

		function frame(now: number) {
			const dt = Math.min(50, Math.max(0, now - last));
			last = now;
			if (!paused) update(dt);
			if (reported) return;
			draw();
			raf = requestAnimationFrame(frame);
		}

		// ── input ──
		function toLocal(e: PointerEvent): [number, number] {
			const b = cv.getBoundingClientRect();
			return [((e.clientX - b.left) / b.width) * W, ((e.clientY - b.top) / b.height) * H];
		}
		function onDown(e: PointerEvent) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			e.preventDefault();
			el.focus({ preventScroll: true });
			if (paused) {
				paused = false;
				last = performance.now();
				return;
			}
			const [x, y] = toLocal(e);
			pointer.x = x;
			pointer.y = y;
			pointer.mouse = e.pointerType === 'mouse';
			shoot(x, y);
		}
		function onMove(e: PointerEvent) {
			const [x, y] = toLocal(e);
			pointer.x = x;
			pointer.y = y;
			pointer.mouse = e.pointerType === 'mouse';
			pointer.inside = true;
		}
		function onLeave() {
			pointer.inside = false;
		}
		function onKey(e: KeyboardEvent) {
			if (paused && !e.repeat) {
				paused = false;
				last = performance.now();
				if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
			}
		}
		function onVis() {
			if (document.hidden && !ended) paused = true;
		}

		cv.addEventListener('pointerdown', onDown);
		cv.addEventListener('pointermove', onMove);
		cv.addEventListener('pointerleave', onLeave);
		el.addEventListener('keydown', onKey);
		document.addEventListener('visibilitychange', onVis);
		const ro = new ResizeObserver(resize);
		ro.observe(el);
		resize();
		el.focus({ preventScroll: true });
		raf = requestAnimationFrame(frame);

		/** for check scripts: where the live targets are on the page right now */
		(el as HTMLElement & { __probe?: () => unknown[] }).__probe = () => {
			const b = cv.getBoundingClientRect();
			return live
				.filter((L) => L.dead < 0 && L.flee < 0 && riseOf(L) > 0.8)
				.map((L) => {
					const sp = SPOTS[L.sp.spot];
					const y = yOf(L, riseOf(L));
					const headY = y + (L.sp.kind === 'duck' ? -40 : L.sp.kind === 'mascot' ? -80 : L.sp.kind === 'dummy' ? -118 : -108) * sp.scale;
					const bodyY = y + (L.sp.kind === 'duck' || L.sp.kind === 'mascot' ? -40 : -30) * sp.scale;
					const px = (v: number) => b.left + (v / W) * b.width;
					const py = (v: number) => b.top + (v / H) * b.height;
					return { kind: L.sp.kind, civilian: isCivilian(L.sp.kind), head: { x: px(xOf(L)), y: py(headY) }, body: { x: px(xOf(L)), y: py(bodyY) } };
				});
		};

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			cv.removeEventListener('pointerdown', onDown);
			cv.removeEventListener('pointermove', onMove);
			cv.removeEventListener('pointerleave', onLeave);
			el.removeEventListener('keydown', onKey);
			document.removeEventListener('visibilitychange', onVis);
			delete (el as HTMLElement & { __probe?: unknown }).__probe;
		};
	});
</script>

<!-- the play area takes the keyboard (pause / continue), so it is focusable -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="hm-root" bind:this={root} tabindex="0" role="application" aria-label={s.aria}>
	<canvas bind:this={canvas} class="hm-canvas"></canvas>
</div>

<style>
	.hm-root {
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 4 / 3));
		aspect-ratio: 4 / 3;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #0c0420;
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.06),
			0 10px 30px rgb(0 0 0 / 0.45);
		outline: none;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	.hm-root:focus-visible {
		box-shadow:
			0 0 0 3px #ffc928,
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.hm-canvas {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
		cursor: none;
	}
	/* the arcade screen: faint scanlines + a dark inner edge and vignette */
	.hm-root::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 0) 0 2px, rgb(0 0 0 / 0.09) 2px 3px);
		box-shadow:
			inset 0 0 0 3px rgb(10 2 16 / 0.85),
			inset 0 0 50px rgb(0 0 0 / 0.5);
	}
</style>
