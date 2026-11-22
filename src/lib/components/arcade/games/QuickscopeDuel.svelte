<!--
	Quickscope Duel (BurgiArcade, 2026-11-22): a reaction duel through a sniper scope over a dusty desert
	town. Five rounds: "HOLD…", then after a seeded wait an enemy sniper pops up → "DRAW!" → click / tap /
	Space as fast as possible. Some rounds first show a friendly (a burger mascot with a halo, a pigeon, a
	squad buddy waving a white flag): shooting it is a foul, and so is firing before the enemy shows; no shot
	within 1.5 s = too slow. The rounds come from the seed alone (arcade/quickscope.ts), so both players in a
	duel get the same waits whatever they do. Reaction = performance.now() from the frame the enemy is drawn.
	onend(score, { rounds }): rounds = reaction ms per round, −1 for a foul, 0 for too slow.
	One <canvas> (logical 800 × 600): the town, the lens glass + reticle and the scope housing are drawn once
	into offscreen layers. Our own drawings, no game's art.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import { rng } from '#lib/arcade/rng.ts';
	import { ROUNDS, TOO_SLOW_MS, judge, roundEntry, roundPoints, schedule, totalScore, type Friendly, type Verdict } from '#lib/arcade/quickscope.ts';
	import { LEAF_PATHS } from '#lib/leaf.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import s from '#lib/i18n/arcade/quickscope.ts';

	let { seed, onend }: ArcadeGameProps = $props();
	let root = $state<HTMLDivElement>();
	let canvas = $state<HTMLCanvasElement>();

	type Ctx = CanvasRenderingContext2D;
	const W = 800;
	const H = 600;
	const O = '#1a0630';
	const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
	/** the lens: centre and radius (logical px); the town picture is SW × SH, centred on the lens */
	const LX = 400;
	const LY = 334;
	const LR = 236;
	const SW = 560;
	const SH = 540;
	const INTRO_MS = 1100;
	const RESULT_MS = 1550;
	const FINAL_MS = 900;
	const RISE = 130;

	type Cover = 'parapetL' | 'window' | 'parapetC' | 'billboard' | 'parapetR' | 'wall';
	/** where someone can pop up in the town (scene coordinates; QUICKSCOPE SPOT_COUNT = 6) */
	const SPOTS: { x: number; base: number; scale: number; cover: Cover; clip?: { x0: number; x1: number; y0: number } }[] = [
		{ x: 172, base: 232, scale: 0.68, cover: 'parapetL' },
		{ x: 280, base: 238, scale: 0.5, cover: 'window', clip: { x0: 240, x1: 320, y0: 158 } },
		{ x: 300, base: 136, scale: 0.48, cover: 'parapetC' },
		{ x: 404, base: 206, scale: 0.55, cover: 'billboard' },
		{ x: 430, base: 322, scale: 0.8, cover: 'parapetR' },
		{ x: 170, base: 368, scale: 0.95, cover: 'wall' }
	];

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
	/** `text`, shrunk to fit `maxW` */
	function fitText(c: Ctx, str: string, x: number, y: number, size: number, maxW: number, fill: string | CanvasGradient) {
		c.font = `700 ${size}px ${FONT}`;
		const w = c.measureText(str).width;
		text(c, str, x, y, w > maxW ? (size * maxW) / w : size, fill);
	}
	/** a dark pill behind a status word, so it reads on the bright sand */
	function pill(c: Ctx, str: string, x: number, y: number, size: number, edge: string) {
		c.font = `700 ${size}px ${FONT}`;
		const w = c.measureText(str).width + size * 1.1;
		const h = size * 1.25;
		rr(c, x - w / 2, y - size * 0.98, w, h, h / 2);
		c.fillStyle = 'rgba(16,6,14,.72)';
		c.fill();
		ink(c, 3, edge);
	}
	function gloss(c: Ctx, x: number, y: number, r: number, a0: number, a1: number, lw: number, alpha = 0.45) {
		c.beginPath();
		c.arc(x, y, r, a0, a1);
		c.lineWidth = lw;
		c.lineCap = 'round';
		c.strokeStyle = `rgba(255,255,255,${alpha})`;
		c.stroke();
	}
	function star(c: Ctx, x: number, y: number, r: number) {
		c.beginPath();
		c.moveTo(x, y - r);
		c.quadraticCurveTo(x, y, x + r, y);
		c.quadraticCurveTo(x, y, x, y + r);
		c.quadraticCurveTo(x, y, x - r, y);
		c.quadraticCurveTo(x, y, x, y - r);
	}

	// ── the people (local coordinates: origin = top of the cover, y down, scale 1) ──────────────────
	const LOOKS = [
		{ main: '#557f2c', dark: '#2c4716', light: '#86b043', mid: '#3f621f', eye: '#fffaf0' },
		{ main: '#c8a066', dark: '#83633a', light: '#ead08e', mid: '#a5834c', eye: '#fffaf0' },
		{ main: '#2e2a36', dark: '#121016', light: '#4a4554', mid: '#211e28', eye: '#ff3b3b' }
	];
	/** the ghillie suit's fringe strands: [x, y, length, angle] along the shoulders and the hood */
	const STRANDS: [number, number, number, number][] = (() => {
		const r = rng(5);
		const out: [number, number, number, number][] = [];
		for (let i = 0; i < 34; i++) {
			const a = Math.PI + (i / 33) * Math.PI;
			out.push([Math.cos(a) * 38, -102 + Math.sin(a) * 38, 10 + r() * 12, a + (r() - 0.5) * 0.6]);
		}
		for (let i = 0; i < 26; i++) {
			const x = -70 + (i / 25) * 140;
			out.push([x, -48 + Math.abs(x) * 0.18 + r() * 6, 12 + r() * 14, Math.PI / 2 + (r() - 0.5) * 0.9]);
		}
		return out;
	})();

	function sniper(c: Ctx, look: number, t: number, glint: number) {
		const p = LOOKS[look];
		const ghillie = look < 2;
		// shoulders
		c.beginPath();
		c.moveTo(-74, 70);
		c.lineTo(-72, -16);
		c.quadraticCurveTo(-68, -58, -24, -64);
		c.lineTo(24, -64);
		c.quadraticCurveTo(68, -58, 72, -16);
		c.lineTo(74, 70);
		c.closePath();
		c.fillStyle = lin(c, 0, -64, 0, 70, [[0, p.main], [1, p.dark]]);
		c.fill();
		ink(c, 5);
		if (!ghillie) {
			// tactical vest + straps
			rr(c, -40, -50, 80, 120, 10);
			c.fillStyle = '#1a181f';
			c.fill();
			ink(c, 3);
			for (const px of [-30, -8, 14]) {
				rr(c, px, -6, 16, 20, 4);
				c.fillStyle = '#3a3644';
				c.fill();
				ink(c, 2);
			}
		}
		// hood / head
		circle(c, 0, -102, 36);
		c.fillStyle = rad(c, 0, -102, 40, [[0, p.light], [1, p.main]], -12, -116);
		c.fill();
		ink(c, 5);
		// face in the shadow of the hood
		c.beginPath();
		c.ellipse(-4, -96, 22, 17, 0, 0, Math.PI * 2);
		c.fillStyle = look === 2 ? '#0c0a10' : lin(c, 0, -113, 0, -79, [[0, '#2a1a12'], [1, '#5a3a24']]);
		c.fill();
		ink(c, 3);
		if (look < 2) {
			// face paint stripes
			c.beginPath();
			c.moveTo(-20, -86);
			c.lineTo(10, -92);
			c.moveTo(-18, -80);
			c.lineTo(8, -84);
			ink(c, 2.4, p.dark);
		}
		// narrowed eyes (red glow on the balaclava)
		for (const ex of [-13, 5]) {
			if (look === 2) {
				circle(c, ex, -99, 7);
				c.fillStyle = 'rgba(255,40,40,.35)';
				c.fill();
			}
			c.beginPath();
			c.ellipse(ex, -99, 5.5, 3, 0, 0, Math.PI * 2);
			c.fillStyle = p.eye;
			c.fill();
			if (look < 2) {
				circle(c, ex + 1.2, -99, 2.2);
				c.fillStyle = O;
				c.fill();
			}
		}
		c.beginPath();
		c.moveTo(-21, -107);
		c.lineTo(-7, -103);
		c.moveTo(13, -107);
		c.lineTo(0, -103);
		ink(c, 3);
		// fringe
		if (ghillie) {
			for (let i = 0; i < STRANDS.length; i++) {
				const [x, y, len, a] = STRANDS[i];
				const sway = Math.sin(t / 260 + i) * 0.12;
				c.beginPath();
				c.moveTo(x, y);
				c.lineTo(x + Math.cos(a + sway) * len, y + Math.sin(a + sway) * len);
				c.lineWidth = 4.4;
				c.lineCap = 'round';
				c.strokeStyle = O;
				c.stroke();
				c.lineWidth = 2.4;
				c.strokeStyle = i % 3 === 0 ? p.light : i % 3 === 1 ? p.mid : p.dark;
				c.stroke();
			}
			// a few leaves in the netting
			for (const [lx, ly, a] of [
				[-30, -128, -0.6],
				[26, -132, 0.5],
				[-58, -40, -1.2],
				[54, -44, 1.1]
			]) {
				c.save();
				c.translate(lx, ly);
				c.rotate(a);
				c.scale(0.9, 0.9);
				c.translate(-12, -20);
				for (const d of LEAF_PATHS) {
					const pth = new Path2D(d);
					c.fillStyle = p.light;
					c.fill(pth);
					c.lineWidth = 1;
					c.strokeStyle = O;
					c.stroke(pth);
				}
				c.restore();
			}
		}
		// the rifle, pointing at you: glove, muzzle, scope with its glint
		rr(c, 6, -84, 34, 18, 7);
		c.fillStyle = '#2a2630';
		c.fill();
		ink(c, 3);
		circle(c, 24, -76, 9);
		c.fillStyle = '#3a3644';
		c.fill();
		ink(c, 3);
		circle(c, 24, -76, 4);
		c.fillStyle = '#050307';
		c.fill();
		circle(c, 24, -112, 15);
		c.fillStyle = '#1e1b24';
		c.fill();
		ink(c, 4);
		circle(c, 24, -112, 10);
		c.fillStyle = rad(c, 24, -112, 11, [[0, '#9adfff'], [0.5, '#3a6ad0'], [1, '#1a1460']], 20, -116);
		c.fill();
		circle(c, 20.5, -115.5, 3);
		c.fillStyle = 'rgba(255,255,255,.85)';
		c.fill();
		rr(c, -12, -72, 22, 14, 6);
		c.fillStyle = look === 2 ? '#2a2630' : p.mid;
		c.fill();
		ink(c, 2.6);
		if (glint > 0) {
			c.save();
			c.globalCompositeOperation = 'lighter';
			const r = 10 + glint * 46;
			c.fillStyle = rad(c, 24, -112, r, [[0, `rgba(255,255,230,${0.9 * glint})`], [0.3, `rgba(255,230,140,${0.5 * glint})`], [1, 'rgba(255,200,100,0)']]);
			c.fillRect(24 - r, -112 - r, r * 2, r * 2);
			star(c, 24, -112, r * 0.9);
			c.fillStyle = `rgba(255,255,240,${glint})`;
			c.fill();
			c.restore();
		}
	}

	function halo(c: Ctx, x: number, y: number, t: number) {
		const by = y + Math.sin(t / 220) * 3;
		c.beginPath();
		c.ellipse(x, by, 30, 8, 0, 0, Math.PI * 2);
		c.lineWidth = 16;
		c.strokeStyle = 'rgba(255,224,110,.3)';
		c.stroke();
		ink(c, 9);
		c.lineWidth = 5;
		c.strokeStyle = lin(c, x - 30, by, x + 30, by, [[0, '#ffe98a'], [0.5, '#fffbe0'], [1, '#ffc928']]);
		c.stroke();
	}

	function burgerMascot(c: Ctx, t: number) {
		c.save();
		c.translate(56, -60);
		c.rotate(-1 + Math.sin(t / 110) * 0.45);
		rr(c, -8, -48, 16, 50, 8);
		c.fillStyle = '#e8a050';
		c.fill();
		ink(c, 3.5);
		circle(c, 0, -54, 13);
		c.fillStyle = '#ffffff';
		c.fill();
		ink(c, 3.5);
		c.restore();
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
		c.fillStyle = rad(c, -8, -112, 70, [[0, '#ffd896'], [0.5, '#f0a24a'], [1, '#b0581b']], -24, -132);
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
		for (const ex of [-20, 20]) {
			c.beginPath();
			c.arc(ex, -106, 8, Math.PI * 1.1, Math.PI * 1.9);
			ink(c, 4);
		}
		c.beginPath();
		c.arc(0, -96, 16, 0.12 * Math.PI, 0.88 * Math.PI);
		c.closePath();
		c.fillStyle = '#5a1408';
		c.fill();
		ink(c, 3);
		gloss(c, -10, -112, 40, -2.7, -1.9, 5, 0.5);
		halo(c, 0, -160, t);
	}

	function pigeon(c: Ctx, t: number) {
		const peck = Math.max(0, Math.sin(t / 140)) * 6;
		// body
		c.beginPath();
		c.ellipse(-6, -40, 56, 38, -0.12, 0, Math.PI * 2);
		c.fillStyle = rad(c, -10, -52, 64, [[0, '#d2d6e2'], [0.6, '#9aa0b4'], [1, '#6a7088']], -24, -66);
		c.fill();
		ink(c, 5);
		// wing with bars
		c.beginPath();
		c.moveTo(-46, -50);
		c.quadraticCurveTo(-10, -70, 26, -44);
		c.quadraticCurveTo(-4, -18, -54, -34);
		c.closePath();
		c.fillStyle = '#8a90a6';
		c.fill();
		ink(c, 3.5);
		for (const x of [-30, -16]) {
			c.beginPath();
			c.moveTo(x, -56);
			c.lineTo(x + 6, -34);
			ink(c, 4, '#3a3f52');
		}
		// tail
		c.beginPath();
		c.moveTo(-58, -36);
		c.lineTo(-84, -24);
		c.lineTo(-60, -20);
		c.closePath();
		c.fillStyle = '#6a7088';
		c.fill();
		ink(c, 3.5);
		// neck + head (bobbing)
		c.save();
		c.translate(peck * 0.5, peck * 0.3);
		c.beginPath();
		c.ellipse(26, -78, 20, 22, 0.2, 0, Math.PI * 2);
		c.fillStyle = lin(c, 10, -96, 40, -60, [[0, '#6fe0a0'], [0.5, '#7a5ad0'], [1, '#9aa0b4']]);
		c.fill();
		ink(c, 4);
		circle(c, 32, -104, 18);
		c.fillStyle = rad(c, 32, -104, 20, [[0, '#c8ccd8'], [1, '#868ca2']], 26, -110);
		c.fill();
		ink(c, 4.5);
		c.beginPath();
		c.moveTo(46, -106);
		c.lineTo(60, -101);
		c.lineTo(46, -98);
		c.closePath();
		c.fillStyle = '#3a3a44';
		c.fill();
		ink(c, 2.4);
		circle(c, 46, -106, 3);
		c.fillStyle = '#f2f2f6';
		c.fill();
		circle(c, 36, -108, 5);
		c.fillStyle = '#ff8a2a';
		c.fill();
		ink(c, 2);
		circle(c, 36.6, -108, 2.2);
		c.fillStyle = O;
		c.fill();
		c.restore();
		gloss(c, -10, -44, 40, -2.6, -2, 5, 0.35);
	}

	function buddy(c: Ctx, t: number) {
		// flag on a stick, waving
		const wv = t / 120;
		c.beginPath();
		c.moveTo(48, -40);
		c.lineTo(62, -190);
		ink(c, 7);
		c.beginPath();
		c.moveTo(48, -40);
		c.lineTo(62, -190);
		ink(c, 3.5, '#b0743a');
		c.beginPath();
		c.moveTo(62, -188);
		for (let i = 0; i <= 6; i++) c.lineTo(62 + i * 11, -188 + Math.sin(wv + i * 0.9) * 6);
		for (let i = 6; i >= 0; i--) c.lineTo(60 + i * 11, -146 + Math.sin(wv + i * 0.9 + 0.4) * 6);
		c.closePath();
		c.fillStyle = lin(c, 62, -188, 128, -146, [[0, '#ffffff'], [1, '#dfe2ee']]);
		c.fill();
		ink(c, 3.5);
		// shoulders
		c.beginPath();
		c.moveTo(-66, 70);
		c.lineTo(-66, -16);
		c.quadraticCurveTo(-66, -60, -22, -64);
		c.lineTo(22, -64);
		c.quadraticCurveTo(66, -60, 66, -16);
		c.lineTo(66, 70);
		c.closePath();
		c.fillStyle = lin(c, 0, -64, 0, 70, [[0, '#7d9c42'], [1, '#33461b']]);
		c.fill();
		ink(c, 5);
		// raised arm holding the stick
		c.beginPath();
		c.moveTo(40, -40);
		c.quadraticCurveTo(56, -60, 52, -78);
		ink(c, 15);
		c.beginPath();
		c.moveTo(40, -40);
		c.quadraticCurveTo(56, -60, 52, -78);
		ink(c, 9, '#6f8f3a');
		circle(c, 52, -80, 9);
		c.fillStyle = '#f0b48a';
		c.fill();
		ink(c, 3);
		// burger patch
		circle(c, -26, -32, 9);
		c.fillStyle = '#e8a63a';
		c.fill();
		ink(c, 2.4);
		// head: grinning face + helmet
		circle(c, 0, -100, 32);
		c.fillStyle = rad(c, 0, -100, 36, [[0, '#ffd2ac'], [1, '#d08a5a']], -10, -110);
		c.fill();
		ink(c, 5);
		for (const ex of [-11, 11]) {
			c.beginPath();
			c.arc(ex, -100, 6, Math.PI * 1.1, Math.PI * 1.9);
			ink(c, 3.5);
		}
		c.beginPath();
		c.arc(0, -90, 14, 0.1 * Math.PI, 0.9 * Math.PI);
		c.closePath();
		c.fillStyle = '#fffaf0';
		c.fill();
		ink(c, 3);
		for (const cx of [-22, 22]) {
			c.beginPath();
			c.ellipse(cx, -88, 6, 4, 0, 0, Math.PI * 2);
			c.fillStyle = 'rgba(255,110,110,.45)';
			c.fill();
		}
		c.beginPath();
		c.moveTo(-40, -106);
		c.quadraticCurveTo(-40, -148, 0, -148);
		c.quadraticCurveTo(40, -148, 40, -106);
		c.lineTo(45, -100);
		c.quadraticCurveTo(0, -112, -45, -100);
		c.closePath();
		c.fillStyle = lin(c, 0, -148, 0, -100, [[0, '#8aa64e'], [1, '#3e5520']]);
		c.fill();
		ink(c, 5);
		gloss(c, -8, -120, 24, -2.6, -1.7, 4.5, 0.4);
	}

	function friendly(c: Ctx, kind: Friendly, t: number) {
		if (kind === 'burger') burgerMascot(c, t);
		else if (kind === 'pigeon') pigeon(c, t);
		else buddy(c, t);
	}

	// ── the town (scene coordinates, SW × SH) ───────────────────────────────────────────────────────
	function adobe(c: Ctx, x0: number, x1: number, top: number, bottom: number, light: string, dark: string, seedN: number) {
		rr(c, x0, top, x1 - x0, bottom - top, 6);
		c.fillStyle = lin(c, x0, top, x1, bottom, [[0, light], [1, dark]]);
		c.fill();
		ink(c, 4);
		// plaster patches + cracks
		const r = rng(seedN);
		c.save();
		rr(c, x0, top, x1 - x0, bottom - top, 6);
		c.clip();
		for (let i = 0; i < 6; i++) {
			c.beginPath();
			c.ellipse(x0 + r() * (x1 - x0), top + 20 + r() * (bottom - top - 30), 10 + r() * 18, 5 + r() * 8, 0, 0, Math.PI * 2);
			c.fillStyle = r() < 0.5 ? 'rgba(120,60,20,.12)' : 'rgba(255,240,210,.14)';
			c.fill();
		}
		for (let i = 0; i < 3; i++) {
			let x = x0 + 10 + r() * (x1 - x0 - 20);
			let y = top + 10 + r() * 40;
			c.beginPath();
			c.moveTo(x, y);
			for (let k = 0; k < 4; k++) {
				x += (r() - 0.5) * 14;
				y += 6 + r() * 8;
				c.lineTo(x, y);
			}
			c.lineWidth = 1.4;
			c.strokeStyle = 'rgba(90,40,10,.45)';
			c.stroke();
		}
		c.restore();
	}
	function parapet(c: Ctx, x0: number, x1: number, y: number) {
		rr(c, x0 - 4, y, x1 - x0 + 8, 16, 4);
		c.fillStyle = lin(c, 0, y, 0, y + 16, [[0, '#f7d6a6'], [1, '#c48a54']]);
		c.fill();
		ink(c, 3.5);
		c.beginPath();
		c.moveTo(x0, y + 3);
		c.lineTo(x1, y + 3);
		ink(c, 2, 'rgba(255,250,235,.7)');
		for (let x = x0 + 18; x < x1; x += 34) {
			c.beginPath();
			c.moveTo(x, y + 16);
			c.lineTo(x, y + 30);
			ink(c, 4, 'rgba(70,30,10,.35)');
		}
	}
	function archWindow(c: Ctx, x: number, y: number, w: number, h: number) {
		c.beginPath();
		c.moveTo(x, y + h);
		c.lineTo(x, y + w / 2);
		c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
		c.lineTo(x + w, y + h);
		c.closePath();
		c.fillStyle = lin(c, 0, y, 0, y + h, [[0, '#1a0c08'], [1, '#3a1c10']]);
		c.fill();
		ink(c, 3);
	}
	/** the bit of cover in front of a spot (drawn into the town and again over whoever pops up there) */
	function front(c: Ctx, i: number) {
		const sp = SPOTS[i];
		if (sp.cover === 'parapetL') parapet(c, 24, 252, 232);
		else if (sp.cover === 'parapetC') parapet(c, 212, 364, 136);
		else if (sp.cover === 'parapetR') parapet(c, 364, 560, 322);
		else if (sp.cover === 'window') {
			const cl = sp.clip!;
			rr(c, cl.x0 - 10, sp.base - 3, cl.x1 - cl.x0 + 20, 12, 3);
			c.fillStyle = lin(c, 0, sp.base - 3, 0, sp.base + 9, [[0, '#ffe2b8'], [1, '#c48a54']]);
			c.fill();
			ink(c, 3);
			// a potted plant on the sill
			rr(c, cl.x1 - 22, sp.base - 18, 16, 16, 3);
			c.fillStyle = '#c4582a';
			c.fill();
			ink(c, 2.4);
			for (const [dx, a] of [
				[-14, -0.5],
				[-10, 0.1],
				[-6, 0.6]
			]) {
				c.save();
				c.translate(cl.x1 + dx, sp.base - 18);
				c.rotate(a);
				c.beginPath();
				c.ellipse(0, -8, 3.5, 8, 0, 0, Math.PI * 2);
				c.fillStyle = '#5fa83a';
				c.fill();
				ink(c, 1.8);
				c.restore();
			}
		} else if (sp.cover === 'billboard') {
			// the burger billboard on its legs
			rr(c, 346, 206, 124, 58, 5);
			c.fillStyle = lin(c, 0, 206, 0, 264, [[0, '#ffefc8'], [1, '#e8c088']]);
			c.fill();
			ink(c, 4);
			c.fillStyle = '#d8261f';
			c.fillRect(350, 210, 116, 14);
			c.font = `700 13px ${FONT}`;
			c.textAlign = 'center';
			c.fillStyle = '#fff6d8';
			c.fillText(s.sign, 408, 221);
			c.beginPath();
			c.moveTo(384, 252);
			c.quadraticCurveTo(384, 230, 408, 230);
			c.quadraticCurveTo(432, 230, 432, 252);
			c.closePath();
			c.fillStyle = '#f0a24a';
			c.fill();
			ink(c, 2.4);
			rr(c, 382, 252, 52, 5, 2);
			c.fillStyle = '#4fb23a';
			c.fill();
			rr(c, 384, 256, 48, 5, 2);
			c.fillStyle = '#6b3a1c';
			c.fill();
			c.lineWidth = 2.6;
			c.strokeStyle = 'rgba(140,90,40,.6)';
			c.strokeRect(350, 210, 116, 50);
		} else {
			// the ruined wall in front, with sandbags on top
			c.beginPath();
			c.moveTo(40, 540);
			c.lineTo(40, 380);
			c.lineTo(86, 372);
			c.lineTo(254, 372);
			c.lineTo(270, 388);
			c.lineTo(262, 408);
			c.lineTo(284, 420);
			c.lineTo(290, 540);
			c.closePath();
			c.fillStyle = lin(c, 0, 372, 0, 540, [[0, '#d99a62'], [1, '#8a5430']]);
			c.fill();
			ink(c, 4);
			for (let k = 0; k < 4; k++) {
				const bx = 92 + k * 40;
				rr(c, bx, 352, 44, 24, 11);
				c.fillStyle = lin(c, 0, 352, 0, 376, [[0, '#ead09a'], [1, '#9a7840']]);
				c.fill();
				ink(c, 3);
				c.beginPath();
				c.moveTo(bx + 8, 357);
				c.quadraticCurveTo(bx + 22, 353, bx + 36, 357);
				ink(c, 1.6, 'rgba(255,248,225,.7)');
			}
			for (const [hx, hy] of [
				[120, 430],
				[200, 460],
				[238, 400]
			]) {
				circle(c, hx, hy, 4);
				c.fillStyle = '#2a1408';
				c.fill();
			}
		}
	}

	function paintScene(c: Ctx) {
		// hazy desert sky + sun glare
		c.fillStyle = lin(c, 0, 0, 0, 330, [
			[0, '#d06a48'],
			[0.4, '#f09a5c'],
			[0.75, '#ffd08e'],
			[1, '#ffe6b6']
		]);
		c.fillRect(0, 0, SW, 340);
		c.fillStyle = rad(c, 452, 118, 260, [[0, 'rgba(255,250,220,.95)'], [0.12, 'rgba(255,236,170,.6)'], [1, 'rgba(255,200,120,0)']]);
		c.fillRect(0, 0, SW, 340);
		circle(c, 452, 118, 24);
		c.fillStyle = '#fffbea';
		c.fill();
		// mesas + far town in the haze
		c.beginPath();
		c.moveTo(0, 300);
		c.lineTo(0, 246);
		c.lineTo(40, 240);
		c.lineTo(62, 214);
		c.lineTo(150, 210);
		c.lineTo(170, 238);
		c.lineTo(330, 244);
		c.lineTo(360, 222);
		c.lineTo(470, 220);
		c.lineTo(500, 250);
		c.lineTo(560, 252);
		c.lineTo(560, 300);
		c.closePath();
		c.fillStyle = 'rgba(176,104,104,.75)';
		c.fill();
		const r = rng(3);
		for (let x = -10; x < SW; ) {
			const w = 22 + r() * 34;
			const h = 14 + r() * 30;
			c.fillStyle = r() < 0.5 ? '#e6b98e' : '#d9a87e';
			c.fillRect(x, 300 - h, w - 3, h + 20);
			if (r() < 0.6) {
				c.fillStyle = 'rgba(90,50,30,.35)';
				c.fillRect(x + w * 0.3, 300 - h + 6, 5, 6);
			}
			if (r() < 0.25) {
				c.beginPath();
				c.arc(x + w / 2, 300 - h, w * 0.28, Math.PI, 0);
				c.fillStyle = '#efc9a0';
				c.fill();
			}
			x += w;
		}
		// sand
		c.fillStyle = lin(c, 0, 300, 0, SH, [[0, '#e8b47c'], [1, '#b47442']]);
		c.fillRect(0, 300, SW, SH - 300);
		c.strokeStyle = 'rgba(140,80,40,.25)';
		c.lineWidth = 2;
		for (let k = 0; k < 6; k++) {
			c.beginPath();
			c.moveTo(0, 330 + k * 34);
			c.quadraticCurveTo(SW / 2, 320 + k * 36, SW, 334 + k * 34);
			c.stroke();
		}
		// palm tree on the right
		const PX = 494;
		const PY = 178;
		c.beginPath();
		c.moveTo(PX - 4, 330);
		c.quadraticCurveTo(PX - 18, 250, PX, PY);
		ink(c, 13);
		c.beginPath();
		c.moveTo(PX - 4, 330);
		c.quadraticCurveTo(PX - 18, 250, PX, PY);
		ink(c, 8, '#9a6a3a');
		for (let y = 196; y < 326; y += 12) {
			c.beginPath();
			c.moveTo(PX - 14 + (y - 196) * 0.02, y);
			c.lineTo(PX + 2 - (y - 196) * 0.04, y + 3);
			ink(c, 1.6, 'rgba(60,30,10,.6)');
		}
		for (let k = 0; k < 7; k++) {
			const a = -Math.PI + (k / 6) * Math.PI + 0.2;
			for (const [lw, col] of [
				[9, O],
				[4.5, k % 2 ? '#4f9a3a' : '#3d7f2c']
			] as const) {
				c.beginPath();
				c.moveTo(PX, PY);
				c.quadraticCurveTo(PX + Math.cos(a) * 40, PY + Math.sin(a) * 40 - 10, PX + Math.cos(a) * 66, PY + Math.sin(a) * 30 + 24);
				ink(c, lw, col);
			}
		}
		for (const [cx, cy] of [
			[PX - 6, PY + 6],
			[PX + 5, PY + 8]
		]) {
			circle(c, cx, cy, 5);
			c.fillStyle = '#6a3a1a';
			c.fill();
			ink(c, 2);
		}
		// left building
		adobe(c, 24, 252, 240, 470, '#efbf86', '#b8743e', 11);
		archWindow(c, 54, 290, 34, 54);
		archWindow(c, 120, 290, 34, 54);
		archWindow(c, 186, 290, 34, 54);
		rr(c, 96, 390, 44, 80, 4);
		c.fillStyle = '#5a2f18';
		c.fill();
		ink(c, 3);
		// laundry line to the middle building
		c.beginPath();
		c.moveTo(40, 268);
		c.quadraticCurveTo(130, 290, 214, 262);
		ink(c, 1.6, '#3a2418');
		for (const [x, col] of [
			[70, '#3a7ad0'],
			[104, '#e2261f'],
			[150, '#ffd23a'],
			[186, '#ffffff']
		] as const) {
			const y = 268 + Math.sin(((x - 40) / 174) * Math.PI) * 14;
			rr(c, x - 8, y, 16, 20, 2);
			c.fillStyle = col;
			c.fill();
			ink(c, 2);
		}
		// middle building (two storeys)
		adobe(c, 212, 364, 144, 470, '#f4c890', '#bf7c44', 23);
		const cl = SPOTS[1].clip!;
		rr(c, cl.x0 - 8, cl.y0 - 8, cl.x1 - cl.x0 + 16, SPOTS[1].base - cl.y0 + 8, 4);
		c.fillStyle = '#9a5a30';
		c.fill();
		ink(c, 3);
		c.fillStyle = lin(c, 0, cl.y0, 0, SPOTS[1].base, [[0, '#120806'], [1, '#3a1a0e']]);
		c.fillRect(cl.x0, cl.y0, cl.x1 - cl.x0, SPOTS[1].base - cl.y0);
		c.lineWidth = 2.6;
		c.strokeStyle = O;
		c.strokeRect(cl.x0, cl.y0, cl.x1 - cl.x0, SPOTS[1].base - cl.y0);
		archWindow(c, 232, 290, 30, 48);
		archWindow(c, 300, 290, 30, 48);
		rr(c, 262, 380, 40, 90, 4);
		c.fillStyle = '#3a6a8a';
		c.fill();
		ink(c, 3);
		// satellite dish + AC on the roof edge
		c.beginPath();
		c.ellipse(232, 124, 12, 16, -0.5, 0, Math.PI * 2);
		c.fillStyle = '#e6e2ee';
		c.fill();
		ink(c, 2.6);
		c.beginPath();
		c.moveTo(232, 124);
		c.lineTo(244, 116);
		ink(c, 2);
		rr(c, 330, 170, 26, 20, 3);
		c.fillStyle = '#c9c4d6';
		c.fill();
		ink(c, 2.4);
		// right building (one storey)
		adobe(c, 364, 560, 330, 480, '#f2c48c', '#b8743e', 37);
		archWindow(c, 396, 368, 30, 44);
		archWindow(c, 500, 368, 30, 44);
		rr(c, 444, 384, 40, 96, 4);
		c.fillStyle = '#7a3a1c';
		c.fill();
		ink(c, 3);
		// billboard legs
		for (const lx of [364, 452]) {
			c.beginPath();
			c.moveTo(lx, 262);
			c.lineTo(lx, 330);
			ink(c, 6);
			c.beginPath();
			c.moveTo(lx, 262);
			c.lineTo(lx, 330);
			ink(c, 2.6, '#7a6a5a');
		}
		// all the covers
		for (let i = 0; i < SPOTS.length; i++) front(c, i);
		// a car wreck + rocks in the foreground sand
		rr(c, 360, 470, 150, 44, 14);
		c.fillStyle = lin(c, 0, 470, 0, 514, [[0, '#6a8aa8'], [1, '#34485e']]);
		c.fill();
		ink(c, 4);
		rr(c, 390, 450, 80, 28, 10);
		c.fillStyle = '#2a3a4a';
		c.fill();
		ink(c, 3.5);
		for (const wx of [384, 486]) {
			circle(c, wx, 514, 13);
			c.fillStyle = '#1a1418';
			c.fill();
			ink(c, 3);
		}
		// heat haze over everything
		c.fillStyle = lin(c, 0, 0, 0, SH, [[0, 'rgba(255,210,150,.10)'], [0.55, 'rgba(255,220,170,.16)'], [1, 'rgba(255,200,140,.05)']]);
		c.fillRect(0, 0, SW, SH);
	}

	/** the lens glass: vignette, tint, reflections, reticle (logical coordinates, full canvas size) */
	function paintLens(c: Ctx) {
		c.fillStyle = rad(c, LX, LY, LR, [
			[0, 'rgba(0,0,0,0)'],
			[0.68, 'rgba(0,0,0,0)'],
			[0.9, 'rgba(10,4,20,.45)'],
			[1, 'rgba(4,1,8,.92)']
		]);
		circle(c, LX, LY, LR);
		c.fill();
		circle(c, LX, LY, LR - 4);
		c.lineWidth = 7;
		c.strokeStyle = 'rgba(120,220,255,.16)';
		c.stroke();
		circle(c, LX, LY, LR - 11);
		c.lineWidth = 4;
		c.strokeStyle = 'rgba(255,90,140,.10)';
		c.stroke();
		gloss(c, LX, LY, LR * 0.82, Math.PI * 1.08, Math.PI * 1.36, 20, 0.1);
		gloss(c, LX, LY, LR * 0.7, Math.PI * 1.12, Math.PI * 1.22, 8, 0.12);
		// reticle: thick posts from the edge, thin cross in the middle, mil-dots
		c.save();
		circle(c, LX, LY, LR);
		c.clip();
		c.strokeStyle = 'rgba(8,4,10,.9)';
		c.lineCap = 'butt';
		c.lineWidth = 7;
		c.beginPath();
		c.moveTo(LX - LR, LY);
		c.lineTo(LX - LR * 0.42, LY);
		c.moveTo(LX + LR * 0.42, LY);
		c.lineTo(LX + LR, LY);
		c.moveTo(LX, LY + LR);
		c.lineTo(LX, LY + LR * 0.42);
		c.moveTo(LX, LY - LR);
		c.lineTo(LX, LY - LR * 0.42);
		c.stroke();
		c.lineWidth = 1.8;
		c.beginPath();
		c.moveTo(LX - LR * 0.42, LY);
		c.lineTo(LX - 7, LY);
		c.moveTo(LX + 7, LY);
		c.lineTo(LX + LR * 0.42, LY);
		c.moveTo(LX, LY - LR * 0.42);
		c.lineTo(LX, LY - 7);
		c.moveTo(LX, LY + 7);
		c.lineTo(LX, LY + LR * 0.42);
		c.stroke();
		c.fillStyle = 'rgba(8,4,10,.9)';
		for (let k = 1; k <= 4; k++) {
			const d = k * LR * 0.1;
			for (const [dx, dy] of [
				[d, 0],
				[-d, 0],
				[0, d],
				[0, -d]
			]) {
				circle(c, LX + dx, LY + dy, 2.6);
				c.fill();
			}
		}
		c.restore();
	}

	/** the scope housing around the lens (a hole where the lens is) */
	function paintFrame(c: Ctx) {
		c.fillStyle = rad(c, LX, LY, 520, [[0, '#24161e'], [0.6, '#120a10'], [1, '#050205']]);
		c.fillRect(0, 0, W, H);
		// side turrets
		for (const side of [-1, 1]) {
			const x = LX + side * (LR + 74);
			rr(c, x - 44, LY - 44, 88, 88, 18);
			c.fillStyle = lin(c, 0, LY - 44, 0, LY + 44, [[0, '#4a4252'], [0.5, '#2a2430'], [1, '#18141c']]);
			c.fill();
			ink(c, 4, '#000');
			for (let k = -36; k <= 36; k += 6) {
				c.beginPath();
				c.moveTo(x - 30, LY + k);
				c.lineTo(x + 30, LY + k);
				ink(c, 1.4, 'rgba(255,255,255,.08)');
			}
			circle(c, x, LY, 16);
			c.fillStyle = '#3a3442';
			c.fill();
			ink(c, 3, '#000');
			c.beginPath();
			c.moveTo(x, LY - 10);
			c.lineTo(x, LY + 10);
			ink(c, 3, '#d8b04a');
		}
		c.save();
		c.globalCompositeOperation = 'destination-out';
		circle(c, LX, LY, LR);
		c.fill();
		c.restore();
		// the metal ring
		c.beginPath();
		c.arc(LX, LY, LR + 26, 0, Math.PI * 2);
		c.arc(LX, LY, LR, 0, Math.PI * 2, true);
		c.fillStyle = lin(c, LX - LR, LY - LR, LX + LR, LY + LR, [[0, '#8a8296'], [0.35, '#4a4352'], [0.7, '#231e2a'], [1, '#3a3442']]);
		c.fill();
		for (let a = 0; a < 360; a += 4) {
			const rd = (a * Math.PI) / 180;
			c.beginPath();
			c.moveTo(LX + Math.cos(rd) * (LR + 15), LY + Math.sin(rd) * (LR + 15));
			c.lineTo(LX + Math.cos(rd) * (LR + 24), LY + Math.sin(rd) * (LR + 24));
			c.lineWidth = 1.6;
			c.strokeStyle = 'rgba(0,0,0,.4)';
			c.stroke();
		}
		circle(c, LX, LY, LR + 26);
		ink(c, 4, '#000');
		circle(c, LX, LY, LR);
		ink(c, 4, '#000');
		gloss(c, LX, LY, LR + 8, Math.PI * 1.05, Math.PI * 1.45, 4, 0.35);
		// engraving on the ring
		c.save();
		c.font = `700 11px ${FONT}`;
		c.fillStyle = 'rgba(255,230,170,.55)';
		c.textAlign = 'center';
		const label = `${s.sign} · 8×`;
		const start = Math.PI * 0.5 + 0.14;
		for (let i = 0; i < label.length; i++) {
			const a = start - i * 0.032;
			c.save();
			c.translate(LX + Math.cos(a) * (LR + 9), LY + Math.sin(a) * (LR + 9));
			c.rotate(a - Math.PI / 2);
			c.fillText(label[i], 0, 4);
			c.restore();
		}
		c.restore();
	}

	// ── the game ─────────────────────────────────────────────────────────────────────────────────────
	type Phase = 'intro' | 'hold' | 'draw' | 'result' | 'final';
	type Part = { k: 0 | 1 | 2 | 3; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; rot: number; vr: number; color: string };

	$effect(() => {
		if (!root || !canvas) return;
		const el = root;
		const cv = canvas;
		const ctx = cv.getContext('2d');
		if (!ctx) return;
		const c = ctx;
		const runSeed = untrack(() => seed) >>> 0;
		const plan = schedule(runSeed);
		const fx = rng((runSeed ^ 0x27d4eb2f) >>> 0);
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

		const layers = { scene: document.createElement('canvas'), lens: document.createElement('canvas'), frame: document.createElement('canvas') };
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
			const sc = layers.scene;
			sc.width = Math.round(SW * sx);
			sc.height = Math.round(SH * sy);
			const g1 = sc.getContext('2d');
			if (g1) {
				g1.setTransform(sx, 0, 0, sy, 0, 0);
				paintScene(g1);
			}
			for (const [name, paint] of [
				['lens', paintLens],
				['frame', paintFrame]
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
				pc.fillStyle = rad(pc, 32, 32, 32, [[0, 'rgba(255,240,220,1)'], [0.5, 'rgba(240,215,180,.5)'], [1, 'rgba(230,200,160,0)']]);
				pc.fillRect(0, 0, 64, 64);
			}
			draw();
		}

		// state
		let clock = 0;
		let lastNow = performance.now();
		let raf = 0;
		let paused = false;
		let restartRound = false;
		let reported = false;
		let ri = 0;
		let phase: Phase = 'intro';
		let phaseAt = 0;
		let shownAt = 0;
		let verdict: Verdict = 'early';
		let lastMs = 0;
		let resultPoints = 0;
		const results: (number | null)[] = Array.from({ length: ROUNDS }, () => null);
		/** why each round ended (the tracker says EARLY / FRIENDLY / SLOW) */
		const verdicts: Verdict[] = Array.from({ length: ROUNDS }, () => 'early');
		let shown = 0;
		let recoil = 0;
		let flash = 0;
		let redFlash = 0;
		let shake = 0;
		/** when someone in the town was hit / reacted (clock), to animate them falling or ducking */
		let enemyHitAt = -1;
		let friendHitAt = -1;
		let enemyGoneAt = -1;
		const parts: Part[] = [];

		function setPhase(p: Phase) {
			phase = p;
			phaseAt = clock;
			el.dataset.phase = p;
			el.dataset.round = String(ri + 1);
		}
		function startRound() {
			shownAt = 0;
			enemyHitAt = -1;
			friendHitAt = -1;
			enemyGoneAt = -1;
			restartRound = false;
			setPhase('intro');
		}
		const round = () => plan[ri];
		const holdT = () => clock - phaseAt;

		function sway(): [number, number] {
			if (reduce) return [0, recoil * 6];
			const t = clock;
			const steady = phase === 'draw' ? 0.5 : 1;
			return [(Math.sin(t * 0.0011) * 7 + Math.sin(t * 0.0029) * 3) * steady, (Math.cos(t * 0.0009) * 5 + Math.sin(t * 0.0023) * 2) * steady + recoil * 24];
		}
		/** scene → logical coordinates offset */
		function sceneOrigin(): [number, number] {
			const [wx, wy] = sway();
			return [LX - SW / 2 + wx, LY - SH / 2 + wy];
		}

		function dust(x: number, y: number, n: number) {
			for (let i = 0; i < (reduce ? Math.ceil(n / 3) : n); i++)
				parts.push({ k: 1, x: x + (fx() - 0.5) * 16, y: y + (fx() - 0.5) * 8, vx: (fx() - 0.5) * 70, vy: -20 - fx() * 50, life: 0, max: 600 + fx() * 400, size: 10 + fx() * 12, rot: 0, vr: 0, color: '#e8c89a' });
		}
		function bits(x: number, y: number, colors: string[], n: number) {
			for (let i = 0; i < (reduce ? Math.ceil(n / 2) : n); i++) {
				const a = -Math.PI / 2 + (fx() - 0.5) * 2.8;
				const v = 120 + fx() * 260;
				parts.push({ k: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 600 + fx() * 300, size: 2.5 + fx() * 3.5, rot: fx() * 6, vr: (fx() - 0.5) * 16, color: colors[Math.floor(fx() * colors.length)] });
			}
		}
		function feathers(x: number, y: number) {
			for (let i = 0; i < (reduce ? 3 : 9); i++)
				parts.push({ k: 2, x: x + (fx() - 0.5) * 30, y: y + (fx() - 0.5) * 20, vx: (fx() - 0.5) * 90, vy: -60 - fx() * 60, life: 0, max: 1200 + fx() * 400, size: 6 + fx() * 4, rot: fx() * 6, vr: (fx() - 0.5) * 4, color: '#d2d6e2' });
		}

		function resolve(v: Verdict, ms: number) {
			verdict = v;
			verdicts[ri] = v;
			const entry = roundEntry(v, ms);
			results[ri] = entry;
			lastMs = entry;
			resultPoints = roundPoints(entry);
			const r = round();
			const [ox, oy] = sceneOrigin();
			if (v === 'hit') {
				enemyHitAt = clock;
				const sp = SPOTS[r.spot];
				bits(sp.x, sp.base - 90 * sp.scale, ['#557f2c', '#86b043', '#2c4716', '#c8a066'].slice(r.look === 2 ? 2 : 0), 14);
				dust(sp.x, sp.base, 6);
				if (!reduce) shake = 5;
				sound.play(entry < 260 ? 'maxed' : 'camo');
			} else if (v === 'slow') {
				enemyGoneAt = clock;
				flash = 1;
				redFlash = 1;
				if (!reduce) shake = 12;
				sound.play('clack');
			} else {
				// a foul: the shot lands where the reticle points
				const hx = LX - ox;
				const hy = LY - oy;
				dust(hx, hy, 5);
				bits(hx, hy, ['#c48a54', '#8a5430', '#f7d6a6'], 6);
				if (v === 'friendly' && r.feint) {
					friendHitAt = clock;
					const sp = SPOTS[r.feint.spot];
					if (r.feint.kind === 'pigeon') feathers(sp.x, sp.base - 60 * sp.scale);
				}
				redFlash = 0.7;
				if (!reduce) shake = 6;
				sound.play('clack');
			}
			setPhase('result');
		}

		function fire(ts: number) {
			if (reported) return;
			if (paused) {
				resume();
				return;
			}
			if (phase !== 'hold' && phase !== 'draw') return;
			recoil = 1;
			const r = round();
			if (phase === 'hold' || !shownAt || ts < shownAt) {
				const t = holdT() + Math.min(50, performance.now() - lastNow);
				resolve(judge(r, Math.min(t, r.wait - 1)) === 'friendly' ? 'friendly' : 'early', 0);
				return;
			}
			const ms = ts - shownAt;
			resolve(ms > TOO_SLOW_MS ? 'slow' : 'hit', ms);
		}

		function finish() {
			if (reported) return;
			reported = true;
			cancelAnimationFrame(raf);
			const rounds = results.map((e) => e ?? 0);
			onend(totalScore(rounds), { rounds });
		}

		function update(dt: number) {
			clock += dt;
			const r = round();
			if (phase === 'intro' && clock - phaseAt >= INTRO_MS) setPhase('hold');
			else if (phase === 'hold' && holdT() >= r.wait) {
				phase = 'draw';
				phaseAt = clock;
				shownAt = 0; // set right after the first frame that shows him
			} else if (phase === 'draw' && shownAt && performance.now() - shownAt > TOO_SLOW_MS) resolve('slow', 0);
			else if (phase === 'result' && clock - phaseAt >= RESULT_MS) {
				if (ri < ROUNDS - 1) {
					ri++;
					startRound();
				} else setPhase('final');
			} else if (phase === 'final' && clock - phaseAt >= FINAL_MS) finish();
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
				if (p.k === 0) p.vy += 900 * k;
				else if (p.k === 1) {
					p.vx *= 0.95;
					p.size += 26 * k;
				} else if (p.k === 2) {
					p.vy = Math.min(p.vy + 120 * k, 40);
					p.vx = Math.sin(p.life / 200) * 40;
				}
			}
			recoil = Math.max(0, recoil - k * 6);
			flash = Math.max(0, flash - k * 3.5);
			redFlash = Math.max(0, redFlash - k * 1.4);
			shake *= Math.pow(0.002, k);
			if (shake < 0.2) shake = 0;
			const target = totalScore(results.map((e) => e ?? 0));
			shown += (target - shown) * Math.min(1, k * 8);
			if (Math.abs(target - shown) < 1) shown = target;
		}

		// ── frame drawing ──
		/** who is up in the town (data-up on the root, for check scripts; written only when it changes) */
		let up = '';
		function markUp(v: string) {
			if (v === up) return;
			up = v;
			el.dataset.up = v;
		}
		/** whoever is up in the town right now: the friendly feint and / or the enemy sniper */
		function drawActors() {
			const r = round();
			const t = clock;
			if (phase !== 'hold' && phase !== 'draw' && phase !== 'result') return markUp('');
			let who = '';
			// the friendly feint: up from `at` for `dur` ms; shot = flinches and ducks
			const f = r.feint;
			if (f) {
				let rise = 0;
				if (phase === 'hold') {
					const a = holdT() - f.at;
					if (a >= 0 && a <= f.dur) rise = Math.min(1, a / RISE, (f.dur - a) / RISE);
				} else if (phase === 'result' && friendHitAt >= 0) rise = Math.max(0, 1 - (clock - friendHitAt) / 300);
				if (rise > 0) {
					drawPerson(f.spot, rise, (cc) => friendly(cc, f.kind, t), friendHitAt >= 0 ? Math.sin((clock - friendHitAt) / 20) * 0.14 : 0, 0);
					who = f.kind;
				}
			}
			// the enemy sniper
			let rise = 0;
			let fall = 0;
			let glint = 0;
			if (phase === 'draw') {
				rise = 1;
				const a = clock - phaseAt;
				glint = Math.max(0, 1 - a / 320) + (reduce ? 0 : 0.25 + 0.15 * Math.sin(a / 70));
			} else if (phase === 'result' && verdict === 'hit' && enemyHitAt >= 0) {
				rise = 1;
				fall = Math.min(1, (clock - enemyHitAt) / 300);
			} else if (phase === 'result' && verdict === 'slow' && enemyGoneAt >= 0) {
				const a = clock - enemyGoneAt;
				rise = a < 420 ? 1 : Math.max(0, 1 - (a - 420) / 160);
				glint = a < 420 ? 1 - a / 420 : 0;
			}
			if (rise > 0) {
				const sq = phase === 'draw' && !reduce ? Math.max(0, 1 - (clock - phaseAt) / 110) : 0;
				drawPerson(r.spot, rise, (cc) => sniper(cc, r.look, t, Math.min(1, glint)), 0, fall, sq);
				who = 'enemy';
			}
			markUp(who);
		}
		function drawPerson(i: number, rise: number, paint: (cc: Ctx) => void, wobble: number, fall: number, squash = 0) {
			const sp = SPOTS[i];
			c.save();
			c.beginPath();
			if (sp.clip) c.rect(sp.clip.x0, sp.clip.y0, sp.clip.x1 - sp.clip.x0, sp.base + 4 - sp.clip.y0);
			else c.rect(0, 0, SW, sp.base + 12);
			c.clip();
			c.translate(sp.x, sp.base + (1 - rise) * 200 * sp.scale);
			c.scale(sp.scale, sp.scale);
			if (fall > 0) {
				c.translate(0, 40 + fall * 40);
				c.rotate(-0.3 * fall);
				c.scale(1 + 0.1 * fall, Math.max(0.03, Math.cos((fall * Math.PI) / 2)));
				c.translate(0, -40);
			}
			if (squash > 0) c.scale(1 + squash * 0.12, 1 - squash * 0.1);
			if (wobble) c.rotate(wobble);
			paint(c);
			c.restore();
			front(c, i);
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
					ink(c, 1.4);
					c.restore();
				} else if (p.k === 1) {
					c.globalAlpha = a * 0.55;
					c.drawImage(puff, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
				} else if (p.k === 2) {
					c.save();
					c.translate(p.x, p.y);
					c.rotate(p.rot + Math.sin(p.life / 180) * 0.6);
					c.globalAlpha = Math.min(1, a * 2);
					c.beginPath();
					c.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
					c.fillStyle = p.color;
					c.fill();
					ink(c, 1.2);
					c.restore();
				}
			}
			c.globalAlpha = 1;
		}
		function chip(x: number, y: number, w: number, h: number, edge = O) {
			rr(c, x, y, w, h, h / 2.6);
			c.fillStyle = lin(c, 0, y, 0, y + h, [[0, 'rgba(46,22,40,.92)'], [1, 'rgba(18,8,16,.92)']]);
			c.fill();
			ink(c, 3, edge);
			rr(c, x + 4, y + 3, w - 8, h * 0.4, h / 4);
			c.fillStyle = 'rgba(255,255,255,.07)';
			c.fill();
		}
		function drawHud() {
			const k = hudK;
			const h = 44 * k;
			const y = 10;
			const lw = 150 * k;
			const sw = 64 * k;
			const gap = 8 * k;
			const total = sw * ROUNDS + gap * (ROUNDS - 1);
			// on a narrow screen there's no room for the round chip: the tracker shows the round anyway
			const roomy = 14 + lw + 12 + total + 12 + lw + 14 <= W;
			if (roomy) {
				chip(14, y, lw, h);
				text(c, s.round(Math.min(ri + 1, ROUNDS), ROUNDS), 14 + lw / 2, y + h * 0.68, 21 * k, '#ffd98a');
			}
			// score
			chip(W - 14 - lw, y, lw, h);
			c.save();
			c.translate(W - 14 - lw + 22 * k, y + h / 2);
			c.scale(k, k);
			c.beginPath();
			for (let i = 0; i < 10; i++) {
				const a = -Math.PI / 2 + (i * Math.PI) / 5;
				const rr2 = i % 2 ? 5 : 11;
				c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
			}
			c.closePath();
			c.fillStyle = lin(c, 0, -11, 0, 11, [[0, '#fff6b0'], [1, '#e09a10']]);
			c.fill();
			ink(c, 2.4);
			c.restore();
			text(c, Math.round(shown).toLocaleString('en-US'), W - 14 - 14 * k, y + h * 0.72, 28 * k, '#ffffff', 'right');
			// the five rounds
			let x = roomy ? W / 2 - total / 2 : 14;
			for (let i = 0; i < ROUNDS; i++) {
				const e = results[i];
				const current = i === ri && phase !== 'final' && e === null;
				let edge = O;
				rr(c, x, y, sw, h, 9 * k);
				c.fillStyle = e === null ? 'rgba(30,14,26,.88)' : e > 0 ? (e < 260 ? '#e0a010' : '#2f9e45') : e < 0 ? (verdicts[i] === 'friendly' ? '#d8601a' : '#c4141b') : '#5a5464';
				c.fill();
				if (e !== null) {
					c.fillStyle = lin(c, 0, y, 0, y + h, [[0, 'rgba(255,255,255,.3)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,.22)']]);
					c.fill();
				}
				if (current) {
					edge = '#ffd23a';
					c.globalAlpha = reduce ? 1 : 0.6 + 0.4 * Math.sin(clock / 160);
				}
				ink(c, current ? 3.5 : 3, edge);
				c.globalAlpha = 1;
				const cx = x + sw / 2;
				if (e === null) text(c, String(i + 1), cx, y + h * 0.7, 22 * k, current ? '#ffd23a' : 'rgba(255,240,220,.4)');
				else if (e > 0) {
					text(c, String(e), cx, y + h * 0.62, 22 * k, '#ffffff');
					text(c, 'ms', cx, y + h * 0.9, 11 * k, '#fff6d8', 'center', 3);
				} else text(c, e < 0 ? (verdicts[i] === 'friendly' ? s.ff : s.early) : s.slow, cx, y + h * 0.66, 13.5 * k, '#ffffff', 'center', 3.6);
				x += sw + gap;
			}
		}
		function drawStatus() {
			const k = hudK;
			const t = clock - phaseAt;
			if (phase === 'intro') {
				const p = Math.min(1, t / 220);
				const out = t > INTRO_MS - 200 ? (INTRO_MS - t) / 200 : 1;
				c.globalAlpha = Math.max(0, Math.min(p, out));
				const size = 74 * k * (reduce ? 1 : 1.3 - 0.3 * p);
				fitText(c, s.round(ri + 1, ROUNDS), LX, LY + 18, size, LR * 1.7, lin(c, 0, LY - 50, 0, LY + 20, [[0, '#fff6b0'], [1, '#ffb020']]));
				if (ri === 0) text(c, s.hint, LX, LY + 18 + 44 * k, 21 * k, '#ffffff');
				c.globalAlpha = 1;
			} else if (phase === 'hold') {
				const yy = LY + LR * 0.7;
				pill(c, s.hold, LX, yy, 34 * k, 'rgba(255,211,106,.55)');
				c.globalAlpha = reduce ? 1 : 0.7 + 0.3 * Math.sin(clock / 180);
				text(c, s.hold, LX, yy, 34 * k, '#ffd36a');
				c.globalAlpha = 1;
			} else if (phase === 'draw') {
				const p = Math.min(1, t / 120);
				const size = 56 * k * (reduce ? 1 : 1.45 - 0.45 * p);
				const yy = LY + LR * 0.72;
				pill(c, s.draw, LX, yy, size, '#ff3b2a');
				text(c, s.draw, LX, yy, size, lin(c, 0, yy - size, 0, yy, [[0, '#ffd0c4'], [1, '#ff2a1a']]));
			} else if (phase === 'result') {
				const p = Math.min(1, t / 160);
				const out = t > RESULT_MS - 220 ? Math.max(0, (RESULT_MS - t) / 220) : 1;
				c.globalAlpha = out;
				const sc = reduce ? 1 : 1.6 - 0.6 * p;
				c.save();
				c.translate(LX, LY - 10);
				c.rotate(-0.06);
				c.scale(sc, sc);
				let big = '';
				let sub = '';
				let fill: string | CanvasGradient = '#ffffff';
				if (verdict === 'hit') {
					big = s.ms(lastMs);
					sub = lastMs < 220 ? s.insane : lastMs < 300 ? s.quick : s.clean;
					fill = lastMs < 260 ? lin(c, 0, -60, 0, 10, [[0, '#fff6b0'], [1, '#ffb020']]) : '#ffffff';
				} else if (verdict === 'slow') {
					big = s.tooSlow;
					sub = s.points(0);
					fill = '#ff8a7a';
				} else {
					big = verdict === 'friendly' ? s.friendlyFire : s.tooEarly;
					sub = s.foul;
					fill = verdict === 'friendly' ? '#ffb347' : '#ff6a5a';
				}
				fitText(c, big, 0, 0, 76 * k, LR * 1.7, fill);
				text(c, sub, 0, 40 * k, 28 * k, verdict === 'hit' ? '#b6ff7a' : '#ffd0c8');
				if (verdict === 'hit') text(c, s.points(resultPoints), 0, 76 * k, 26 * k, '#ffd23a');
				c.restore();
				c.globalAlpha = 1;
			} else if (phase === 'final') {
				const p = Math.min(1, t / 200);
				c.fillStyle = `rgba(6,2,8,${0.5 * p})`;
				c.fillRect(0, 0, W, H);
				const sc = reduce ? 1 : 1.3 - 0.3 * p;
				text(c, s.total, LX, LY - 44 * k, 34 * k, '#ffd98a');
				text(c, totalScore(results.map((e) => e ?? 0)).toLocaleString('en-US'), LX, LY + 40 * k, 92 * k * sc, lin(c, 0, LY - 40, 0, LY + 40, [[0, '#fff6b0'], [1, '#ffb020']]));
			}
		}
		function drawCrack() {
			if (phase !== 'result' || verdict !== 'slow') return;
			const t = clock - phaseAt;
			const a = t > RESULT_MS - 300 ? Math.max(0, (RESULT_MS - t) / 300) : 1;
			const cx = LX + 70;
			const cy = LY - 50;
			const r = rng(17);
			c.save();
			circle(c, LX, LY, LR);
			c.clip();
			c.globalAlpha = a;
			for (let i = 0; i < 9; i++) {
				let x = cx;
				let y = cy;
				const ang = (i / 9) * Math.PI * 2 + r() * 0.4;
				c.beginPath();
				c.moveTo(x, y);
				for (let k = 0; k < 6; k++) {
					const len = 20 + r() * 34;
					x += Math.cos(ang + (r() - 0.5) * 0.7) * len;
					y += Math.sin(ang + (r() - 0.5) * 0.7) * len;
					c.lineTo(x, y);
				}
				c.lineWidth = 4;
				c.strokeStyle = 'rgba(10,4,12,.55)';
				c.stroke();
				c.lineWidth = 1.6;
				c.strokeStyle = 'rgba(240,250,255,.85)';
				c.stroke();
			}
			circle(c, cx, cy, 10);
			c.fillStyle = 'rgba(230,245,255,.5)';
			c.fill();
			ink(c, 2, 'rgba(10,4,12,.6)');
			c.restore();
		}

		function draw() {
			if (!cv.width) return;
			const ox0 = shake ? (fx() - 0.5) * 2 * shake : 0;
			const oy0 = shake ? (fx() - 0.5) * 2 * shake : 0;
			c.setTransform(1, 0, 0, 1, 0, 0);
			c.fillStyle = '#050205';
			c.fillRect(0, 0, cv.width, cv.height);
			const [sox, soy] = sceneOrigin();
			// inside the lens: the town, whoever is up, dust
			c.save();
			c.setTransform(sx, 0, 0, sy, ox0 * sx, oy0 * sy);
			circle(c, LX, LY, LR);
			c.clip();
			c.setTransform(1, 0, 0, 1, (sox + ox0) * sx, (soy + oy0) * sy);
			c.drawImage(layers.scene, 0, 0);
			c.setTransform(sx, 0, 0, sy, (sox + ox0) * sx, (soy + oy0) * sy);
			drawActors();
			drawParts();
			c.setTransform(sx, 0, 0, sy, ox0 * sx, oy0 * sy);
			// the shot: muzzle light, hitmarker on a hit
			if (recoil > 0.5) {
				c.fillStyle = `rgba(255,240,200,${(recoil - 0.5) * 0.5})`;
				c.fillRect(LX - LR, LY - LR, LR * 2, LR * 2);
			}
			if (phase === 'result' && verdict === 'hit' && clock - phaseAt < 420) {
				const p = (clock - phaseAt) / 420;
				const sc = 1 + Math.max(0, 1 - p * 5) * 0.6;
				c.globalAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
				for (const [dx, dy] of [
					[1, 1],
					[1, -1],
					[-1, 1],
					[-1, -1]
				]) {
					c.beginPath();
					c.moveTo(LX + dx * 9 * sc, LY + dy * 9 * sc);
					c.lineTo(LX + dx * 26 * sc, LY + dy * 26 * sc);
					c.lineCap = 'round';
					c.lineWidth = 8;
					c.strokeStyle = O;
					c.stroke();
					c.lineWidth = 3.6;
					c.strokeStyle = lastMs < 260 ? '#ffd23a' : '#ffffff';
					c.stroke();
				}
				c.globalAlpha = 1;
			}
			if (flash > 0) {
				c.fillStyle = `rgba(255,255,245,${flash * 0.85})`;
				c.fillRect(LX - LR, LY - LR, LR * 2, LR * 2);
			}
			c.restore();
			// glass, reticle, the red dot, cracks
			c.setTransform(1, 0, 0, 1, ox0 * sx, oy0 * sy);
			c.drawImage(layers.lens, 0, 0);
			c.setTransform(sx, 0, 0, sy, ox0 * sx, oy0 * sy);
			const dotGlow = phase === 'draw' ? 1 : phase === 'hold' ? 0.5 + 0.2 * Math.sin(clock / 300) : 0.4;
			c.fillStyle = rad(c, LX, LY, 14, [[0, `rgba(255,60,40,${0.7 * dotGlow})`], [1, 'rgba(255,40,30,0)']]);
			c.fillRect(LX - 14, LY - 14, 28, 28);
			circle(c, LX, LY, phase === 'draw' ? 3.6 : 2.8);
			c.fillStyle = '#ff3b2a';
			c.fill();
			drawCrack();
			if (redFlash > 0) {
				c.save();
				circle(c, LX, LY, LR);
				c.clip();
				c.fillStyle = rad(c, LX, LY, LR, [[0, 'rgba(255,30,30,0)'], [0.6, `rgba(255,30,30,${0.15 * redFlash})`], [1, `rgba(220,0,0,${0.65 * redFlash})`]]);
				c.fillRect(LX - LR, LY - LR, LR * 2, LR * 2);
				c.restore();
			}
			// DRAW!: the ring flashes red
			c.setTransform(1, 0, 0, 1, ox0 * sx, oy0 * sy);
			c.drawImage(layers.frame, 0, 0);
			c.setTransform(sx, 0, 0, sy, ox0 * sx, oy0 * sy);
			if (phase === 'draw') {
				circle(c, LX, LY, LR + 13);
				c.lineWidth = 10;
				c.strokeStyle = `rgba(255,50,40,${0.55 + 0.35 * Math.sin(clock / 50)})`;
				c.stroke();
			}
			c.setTransform(sx, 0, 0, sy, 0, 0);
			drawStatus();
			drawHud();
			if (paused) {
				c.fillStyle = 'rgba(6,2,8,.74)';
				c.fillRect(0, 0, W, H);
				text(c, s.paused, W / 2, H / 2 - 4, 64 * hudK, '#ffffff');
				text(c, s.tapToContinue, W / 2, H / 2 + 46 * hudK, 24 * hudK, '#ffd98a');
			}
		}

		function frame(now: number) {
			const dt = Math.min(50, Math.max(0, now - lastNow));
			lastNow = now;
			if (!paused) update(dt);
			if (reported) return;
			draw();
			if (phase === 'draw' && !shownAt && !paused) {
				// the enemy is on screen from this frame: start the reaction clock now
				shownAt = performance.now();
				el.dataset.phase = 'draw';
			}
			raf = requestAnimationFrame(frame);
		}

		// ── input ──
		function stamp(e: Event): number {
			const now = performance.now();
			return e.timeStamp > 0 && Math.abs(e.timeStamp - now) < 1000 ? e.timeStamp : now;
		}
		function resume() {
			paused = false;
			lastNow = performance.now();
			if (restartRound) startRound();
		}
		function onDown(e: PointerEvent) {
			if (e.pointerType === 'mouse' && e.button !== 0) return;
			e.preventDefault();
			el.focus({ preventScroll: true });
			fire(stamp(e));
		}
		function onKey(e: KeyboardEvent) {
			if (e.key !== ' ' && e.key !== 'Enter' && e.code !== 'Space') {
				if (paused && !e.repeat) resume();
				return;
			}
			e.preventDefault();
			if (e.repeat) return;
			fire(stamp(e));
		}
		function onWinKey(e: KeyboardEvent) {
			// keys while the focus is nowhere in particular (the page body) still count
			if (e.target === document.body || e.target === document.documentElement) onKey(e);
		}
		function onVis() {
			if (!document.hidden || reported || phase === 'final') return;
			paused = true;
			if (phase === 'hold' || phase === 'draw') restartRound = true;
		}

		el.addEventListener('pointerdown', onDown);
		el.addEventListener('keydown', onKey);
		window.addEventListener('keydown', onWinKey);
		document.addEventListener('visibilitychange', onVis);
		const ro = new ResizeObserver(resize);
		ro.observe(el);
		startRound();
		resize();
		el.focus({ preventScroll: true });
		raf = requestAnimationFrame(frame);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			el.removeEventListener('pointerdown', onDown);
			el.removeEventListener('keydown', onKey);
			window.removeEventListener('keydown', onWinKey);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<!-- the play area takes the keyboard (Space fires), so it is focusable -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="qs-root" bind:this={root} tabindex="0" role="application" aria-label={s.aria}>
	<canvas bind:this={canvas} class="qs-canvas"></canvas>
</div>

<style>
	.qs-root {
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 4 / 3));
		aspect-ratio: 4 / 3;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #050205;
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.06),
			0 10px 30px rgb(0 0 0 / 0.45);
		outline: none;
		touch-action: none;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
		cursor: crosshair;
	}
	.qs-root:focus-visible {
		box-shadow:
			0 0 0 3px #ffc928,
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.qs-canvas {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.qs-root::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 0) 0 2px, rgb(0 0 0 / 0.08) 2px 3px);
		box-shadow:
			inset 0 0 0 3px rgb(10 2 16 / 0.85),
			inset 0 0 40px rgb(0 0 0 / 0.5);
	}
</style>
