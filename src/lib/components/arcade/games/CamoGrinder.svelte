<!--
	Camo Grinder (BurgiArcade, 2026-11-22): a timing game about the camo grind. One of the site's own weapon
	cartoons (WeaponIcon) stands on a lit pedestal; under it a needle bounces across a meter. Tap while it's in
	the zone and the weapon re-paints in its next camo (Gold → Platinum → Harmonic Break → Divergence) with a glint
	and a banner; after Divergence it slides off and the next weapon (seeded order) slides in, faster, with a
	smaller zone. The bright core of the zone is a perfect hit (double points). Three misses end the grind.
	Rules and the curve: arcade/grinder.ts. The meter, its needle trail and all particles are one canvas over
	the stage; the weapon, banners and HUD are DOM so the site's own drawings and fonts stay crisp.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { ArcadeGameProps } from '#lib/arcade/game.ts';
	import WeaponIcon from '#lib/components/WeaponIcon.svelte';
	import { camoLook } from '#lib/data/weaponLooks.ts';
	import { WEAPONS, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import s from '#lib/i18n/arcade/grinder.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import {
		GRIND_CAMOS,
		STRIKES,
		MAX_BONUS,
		TARGET_TIME,
		difficulty,
		zoneCentre,
		needleStart,
		moveNeedle,
		judge,
		pointsFor,
		makeGrind,
		type GrindCamo
	} from '#lib/arcade/grinder.ts';

	let { seed, onend }: ArcadeGameProps = $props();

	const IDS = WEAPONS.map((w) => w.id).filter((id) => camoLook(id));
	const grind = $derived(makeGrind(seed, IDS));
	const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	let root: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let gunEl = $state<HTMLDivElement>();
	let glintEl = $state<HTMLDivElement>();

	let score = $state(0);
	let shown = $state(0); // the score as it counts up
	let strikes = $state(0);
	let wIdx = $state(0);
	let step = $state(0); // camos earned on this weapon
	let paused = $state(false);
	let banner = $state<{ text: string; camo: string; key: number; big?: boolean } | null>(null);
	let hint = $state(s.hintStart);
	let live = $state('');
	let over = $state(false);
	let resume = $state<() => void>(() => {});

	const weaponId = $derived(grind.weapon(wIdx));
	const look = $derived(camoLook(weaponId)!);
	const name = $derived(WEAPON_BY_ID.get(weaponId)?.name ?? '');
	const camo = $derived<GrindCamo | null>(step > 0 ? GRIND_CAMOS[step - 1] : null);
	/** the stage light follows what the weapon wears */
	const spot = $derived(camo === 'gold' ? '#ffc928' : camo === 'platinum' ? '#dce6ee' : camo === 'harmonicBreak' ? '#ff2d55' : camo === 'divergence' ? '#c9a2ff' : '#8a6cff');
	const nextCamo = $derived(GRIND_CAMOS[Math.min(3, step)]);

	/** the weapon slides in from the right with a little spin, and out to the left */
	function gunIn(_n: Element) {
		return { duration: reduce ? 0 : 560, css: (t: number) => `transform: translateX(${(1 - t) * 120}%) rotate(${(1 - t) * 18}deg) scale(${0.7 + 0.3 * t}); opacity: ${Math.min(1, t * 2)}` };
	}
	function gunOut(_n: Element) {
		return { duration: reduce ? 0 : 420, css: (t: number) => `transform: translateX(${(t - 1) * 130}%) rotate(${(t - 1) * 24}deg) scale(${0.6 + 0.4 * t}); opacity: ${t}` };
	}

	onMount(() => {
		const cv = canvas;
		const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
		const finish = onend;
		const W = 800;
		const H = 600;
		const MX = 104;
		const MW = 592;
		const MY = 474;
		const MH = 40;
		const OUT = '#140a06';
		const FONT = 'Bahnschrift, "Segoe UI", sans-serif';
		let scale = 1;
		let k = 1;

		let phase: 'aim' | 'paint' | 'swap' | 'end' = 'aim';
		let phaseT = 0;
		let clock = 0;
		let pos = 0;
		let dir: 1 | -1 = 1;
		let centre = 0.5;
		let diff = difficulty(0, 0);
		let left = TARGET_TIME;
		let lastTap = -1;
		let streak = 0;
		let shake = 0;
		let flash = 0;
		let flashCol = '255,255,255';
		let zoneIn = 0; // the zone fades in for each new target
		let missFlash = 0;
		let lockGlow = 0;
		const trail: number[] = [];

		type P = { k: 'spark' | 'star' | 'ring' | 'text' | 'dust'; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; col: string; text?: string; g?: number };
		const parts: P[] = [];
		const emit = (p: Partial<P> & { k: P['k']; x: number; y: number }) => {
			if (parts.length > (reduce ? 90 : 220)) parts.shift();
			parts.push({ vx: 0, vy: 0, life: 0, max: 0.6, size: 4, col: '#fff', ...p });
		};
		const R = () => Math.random();
		const dust = Array.from({ length: reduce ? 10 : 26 }, () => ({ x: 180 + R() * 440, y: 120 + R() * 260, v: 8 + R() * 22, s: 0.8 + R() * 1.8, ph: R() * 6 }));

		const CAMO_COLS: Record<string, string[]> = {
			gold: ['#fff0b0', '#ffc928', '#b5852b'],
			platinum: ['#ffffff', '#dfe5ea', '#8e969e'],
			harmonicBreak: ['#ff8aa0', '#ff2d55', '#8e0f22'],
			divergence: ['#ffc4ee', '#a3f5e6', '#b48cff']
		};

		function newTarget(restartNeedle: boolean) {
			diff = difficulty(wIdx, step);
			centre = zoneCentre(grind.nextZone(), diff.zone);
			if (restartNeedle) {
				const st = needleStart(centre);
				pos = st.pos;
				dir = st.dir;
				trail.length = 0;
			}
			left = TARGET_TIME;
			zoneIn = 0;
		}

		function resize() {
			const cw = cv.clientWidth || W;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const pw = Math.max(1, Math.round(cw * dpr));
			const ph = Math.round((pw * H) / W);
			k = Math.max(1, Math.min(1.7, 0.62 / (cw / W)));
			if (cv.width !== pw || cv.height !== ph) {
				cv.width = pw;
				cv.height = ph;
				scale = pw / W;
				if (paused) draw();
			}
		}

		function popGun(strength: number) {
			gunEl?.animate(
				[
					{ transform: 'scale(1)', filter: 'brightness(1)' },
					{ transform: `scale(${1 + 0.12 * strength}) rotate(-2deg)`, filter: `brightness(${1 + 0.9 * strength})`, offset: 0.25 },
					{ transform: 'scale(0.97) rotate(1deg)', filter: 'brightness(1.1)', offset: 0.6 },
					{ transform: 'scale(1)', filter: 'brightness(1)' }
				],
				{ duration: reduce ? 1 : 520, easing: 'ease-out' }
			);
			glintEl?.animate([{ transform: 'translateX(-120%) skewX(-22deg)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'translateX(320%) skewX(-22deg)', opacity: 0 }], {
				duration: 760,
				easing: 'cubic-bezier(.3,.6,.4,1)'
			});
		}

		function burst(x: number, y: number, cols: string[], n: number, power = 1) {
			const m = reduce ? Math.ceil(n / 3) : n;
			for (let i = 0; i < m; i++) {
				const a = -Math.PI / 2 + (R() - 0.5) * Math.PI * 1.6;
				const sp = (160 + R() * 420) * power;
				emit({ k: R() < 0.35 ? 'star' : 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, max: 0.5 + R() * 0.5, size: 2.5 + R() * 4, col: cols[Math.floor(R() * cols.length)], g: 700 });
			}
			emit({ k: 'ring', x, y, max: 0.45, size: 14, col: cols[1] });
		}

		function floatText(text: string, x: number, y: number, col: string, size = 30) {
			emit({ k: 'text', x, y, vy: -36, max: 0.95, size, col, text });
		}

		function tap() {
			if (paused) {
				doResume();
				return;
			}
			if (over || phase !== 'aim') return;
			if (clock - lastTap < 0.08) return;
			lastTap = clock;
			const j = judge(pos, centre, diff.zone, diff.perfect);
			const nx = MX + pos * MW;
			if (j === 'miss') {
				strike(s.miss);
				return;
			}
			const pts = pointsFor(j);
			score += pts;
			const earned = GRIND_CAMOS[step];
			step++;
			const cols = CAMO_COLS[earned];
			streak = j === 'perfect' ? streak + 1 : 0;
			burst(nx, MY - 10, cols, j === 'perfect' ? 30 : 18, j === 'perfect' ? 1.25 : 1);
			// sparks fly up to the weapon as it re-paints
			for (let i = 0; i < (reduce ? 4 : 14); i++) emit({ k: 'spark', x: 250 + R() * 300, y: 170 + R() * 120, vx: (R() - 0.5) * 240, vy: -60 - R() * 200, max: 0.6 + R() * 0.5, size: 2 + R() * 3, col: cols[Math.floor(R() * 3)], g: 300 });
			floatText(j === 'perfect' ? `${s.perfect} +${pts}` : `+${pts}`, nx, MY - 60, j === 'perfect' ? '#ffffff' : cols[0], j === 'perfect' ? 34 : 30);
			if (j === 'perfect') {
				flash = reduce ? 0.25 : 0.55;
				flashCol = '255,255,255';
			} else {
				flash = 0.18;
				flashCol = '255,230,160';
			}
			popGun(j === 'perfect' ? 1.2 : 1);
			banner = { text: s.banner(s.camos[earned]).toUpperCase(), camo: earned, key: (banner?.key ?? 0) + 1 };
			live = s.live.hit(s.camos[earned]);
			if (step >= GRIND_CAMOS.length) {
				score += MAX_BONUS;
				floatText(s.bonus(MAX_BONUS), 400, 250, '#ffe680', 40);
				for (let i = 0; i < (reduce ? 8 : 40); i++) {
					const a = R() * Math.PI * 2;
					const sp = 120 + R() * 380;
					emit({ k: R() < 0.5 ? 'star' : 'spark', x: 400, y: 220, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, max: 0.8 + R() * 0.6, size: 3 + R() * 4, col: ['#ffc4ee', '#a3f5e6', '#ffefae', '#b48cff', '#ffffff'][i % 5], g: 420 });
				}
				shake = reduce ? 0 : 10;
				sound.play('divergence');
				phase = 'paint';
				phaseT = 1.25;
				hint = s.maxed;
			} else {
				sound.play(j === 'perfect' ? 'maxed' : 'camo');
				phase = 'paint';
				phaseT = 0.62;
				hint = streak >= 2 ? s.streak(streak) : s.hintNext(s.camos[GRIND_CAMOS[step]]);
			}
		}

		function strike(label: string) {
			strikes++;
			streak = 0;
			shake = reduce ? 0 : 14;
			missFlash = 1;
			flash = reduce ? 0.12 : 0.3;
			flashCol = '255,40,60';
			floatText(label, Math.min(MX + MW - 60, Math.max(MX + 60, MX + pos * MW)), MY - 60, '#ff4a5e', 32);
			for (let i = 0; i < (reduce ? 3 : 10); i++) emit({ k: 'dust', x: MX + pos * MW, y: MY, vx: (R() - 0.5) * 200, vy: -40 - R() * 120, max: 0.5, size: 4 + R() * 4, col: '#5a2a34', g: 400 });
			sound.play('clack');
			live = s.live.miss(STRIKES - strikes);
			if (strikes >= STRIKES) {
				phase = 'end';
				phaseT = 0.95;
				over = true;
				live = s.live.over;
				hint = '';
			} else hint = strikes === STRIKES - 1 ? s.lastChance : hint;
		}

		function update(dt: number) {
			clock += dt;
			if (phase === 'aim') {
				zoneIn = Math.min(1, zoneIn + dt * 5);
				const m = moveNeedle(pos, dir, diff.speed * dt);
				pos = m.pos;
				dir = m.dir;
				left -= dt;
				if (left <= 0) {
					strike(s.tooSlow);
					if (!over) newTarget(true);
				}
			} else if (phase === 'paint') {
				phaseT -= dt;
				if (phaseT <= 0) {
					if (step >= GRIND_CAMOS.length) {
						phase = 'swap';
						phaseT = reduce ? 0.2 : 0.7;
						wIdx++;
						step = 0;
						banner = null;
						hint = s.hintNext(s.camos.gold);
						sound.play('clack');
					} else {
						phase = 'aim';
						banner = null;
						newTarget(true);
					}
				}
			} else if (phase === 'swap') {
				phaseT -= dt;
				if (phaseT <= 0) {
					phase = 'aim';
					newTarget(true);
				}
			} else if (phase === 'end') {
				phaseT -= dt;
				if (phaseT <= 0 && raf) {
					stop();
					finish(Math.max(0, Math.round(score)));
					return;
				}
			}
			const inZone = phase === 'aim' && Math.abs(pos - centre) <= diff.zone / 2;
			lockGlow += ((inZone ? 1 : 0) - lockGlow) * Math.min(1, dt * 18);
			trail.unshift(pos);
			if (trail.length > 9) trail.length = 9;
			for (let i = parts.length - 1; i >= 0; i--) {
				const p = parts[i];
				p.life += dt;
				if (p.life >= p.max) {
					parts.splice(i, 1);
					continue;
				}
				p.vy += (p.g ?? 0) * dt;
				if (p.k === 'text') p.vy *= Math.exp(-dt * 2.5);
				p.x += p.vx * dt;
				p.y += p.vy * dt;
			}
			for (const d of dust) {
				d.y -= d.v * dt;
				if (d.y < 90) {
					d.y = 390;
					d.x = 180 + R() * 440;
				}
			}
			shake *= Math.exp(-dt * 9);
			if (shake < 0.3) shake = 0;
			flash *= Math.exp(-dt * 7);
			missFlash *= Math.exp(-dt * 5);
			const diffScore = score - shown;
			if (diffScore !== 0) shown = Math.abs(diffScore) < 4 ? score : Math.round(shown + diffScore * Math.min(1, dt * 12));
		}

		function rr(x: number, y: number, w: number, h: number, r: number) {
			ctx.beginPath();
			ctx.roundRect(x, y, w, h, r);
		}
		function text(t: string, x: number, y: number, size: number, fill: string | CanvasGradient) {
			ctx.font = `800 ${size}px ${FONT}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.lineJoin = 'round';
			ctx.lineWidth = size * 0.22;
			ctx.strokeStyle = 'rgba(0,0,0,0.5)';
			ctx.strokeText(t, x, y + size * 0.08);
			ctx.strokeStyle = OUT;
			ctx.strokeText(t, x, y);
			ctx.fillStyle = fill;
			ctx.fillText(t, x, y);
		}
		function star(x: number, y: number, r: number, col: string) {
			ctx.beginPath();
			for (let i = 0; i < 10; i++) {
				const a = -Math.PI / 2 + (i * Math.PI) / 5;
				const q = i % 2 ? r * 0.45 : r;
				ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
			}
			ctx.closePath();
			ctx.fillStyle = col;
			ctx.fill();
			ctx.lineWidth = 1.2;
			ctx.strokeStyle = OUT;
			ctx.stroke();
		}

		function zoneFill(x0: number, x1: number): CanvasGradient {
			const c = nextCamo === 'platinum' ? ['#d5dde4', '#9aa4ad', '#59626a'] : (CAMO_COLS[nextCamo] ?? CAMO_COLS.gold);
			if (nextCamo === 'divergence') {
				const g = ctx.createLinearGradient(x0, 0, x1, 0);
				const sh = (clock * 0.6) % 1;
				const stops = ['#ffc4ee', '#a3f5e6', '#ffefae', '#b48cff', '#ffc4ee'];
				stops.forEach((col, i) => g.addColorStop(Math.min(1, Math.max(0, (i / 4 + sh) % 1)), col));
				return g;
			}
			const g = ctx.createLinearGradient(0, MY - MH / 2, 0, MY + MH / 2);
			g.addColorStop(0, c[0]);
			g.addColorStop(0.5, c[1]);
			g.addColorStop(1, c[2]);
			return g;
		}

		function drawMeter() {
			const ox = shake ? (R() * 2 - 1) * shake : 0;
			ctx.save();
			ctx.translate(ox, 0);
			// housing
			rr(MX - 26, MY - 40, MW + 52, 92, 22);
			const hg = ctx.createLinearGradient(0, MY - 40, 0, MY + 52);
			hg.addColorStop(0, '#4a3a5c');
			hg.addColorStop(0.12, '#2a1c38');
			hg.addColorStop(1, '#130a1c');
			ctx.fillStyle = hg;
			ctx.fill();
			ctx.lineWidth = 4;
			ctx.strokeStyle = OUT;
			ctx.stroke();
			ctx.strokeStyle = 'rgba(255,255,255,0.14)';
			ctx.lineWidth = 2;
			rr(MX - 22, MY - 36, MW + 44, 84, 19);
			ctx.stroke();
			for (const sx of [MX - 13, MX + MW + 13]) {
				ctx.beginPath();
				ctx.arc(sx, MY, 5, 0, Math.PI * 2);
				ctx.fillStyle = '#8a7a9a';
				ctx.fill();
				ctx.lineWidth = 2;
				ctx.strokeStyle = OUT;
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(sx - 3, MY - 3);
				ctx.lineTo(sx + 3, MY + 3);
				ctx.stroke();
			}
			// track
			rr(MX, MY - MH / 2, MW, MH, 12);
			const tg = ctx.createLinearGradient(0, MY - MH / 2, 0, MY + MH / 2);
			tg.addColorStop(0, '#07030c');
			tg.addColorStop(1, '#1e1030');
			ctx.fillStyle = tg;
			ctx.fill();
			ctx.save();
			ctx.clip();
			// ticks
			ctx.strokeStyle = 'rgba(200,170,255,0.22)';
			ctx.lineWidth = 1.5;
			for (let i = 1; i < 20; i++) {
				const x = MX + (i / 20) * MW;
				const big = i % 5 === 0;
				ctx.beginPath();
				ctx.moveTo(x, MY + MH / 2);
				ctx.lineTo(x, MY + MH / 2 - (big ? 14 : 7));
				ctx.stroke();
			}
			// the zone
			if (phase === 'aim' || phase === 'paint') {
				const zx0 = MX + (centre - diff.zone / 2) * MW;
				const zx1 = MX + (centre + diff.zone / 2) * MW;
				const a = phase === 'paint' ? Math.max(0, phaseT / 0.62) : zoneIn;
				const pulse = 0.5 + 0.5 * Math.sin(clock * 8);
				ctx.globalAlpha = a;
				ctx.globalCompositeOperation = 'lighter';
				const glowCol = CAMO_COLS[nextCamo]?.[1] ?? '#ffc928';
				const gg = ctx.createRadialGradient((zx0 + zx1) / 2, MY, 2, (zx0 + zx1) / 2, MY, (zx1 - zx0) * 0.9 + 30);
				gg.addColorStop(0, hexA(glowCol, 0.35 + 0.25 * pulse + 0.3 * lockGlow));
				gg.addColorStop(1, hexA(glowCol, 0));
				ctx.fillStyle = gg;
				ctx.fillRect(zx0 - 60, MY - MH, zx1 - zx0 + 120, MH * 2);
				ctx.globalCompositeOperation = 'source-over';
				const inset = 3 - pulse * 1.5;
				rr(zx0, MY - MH / 2 + inset, zx1 - zx0, MH - inset * 2, 7);
				ctx.fillStyle = zoneFill(zx0, zx1);
				ctx.fill();
				if (nextCamo === 'harmonicBreak') {
					ctx.save();
					ctx.clip();
					ctx.strokeStyle = 'rgba(28,4,8,0.55)';
					ctx.lineWidth = 3;
					for (let x = zx0 - 40; x < zx1 + 40; x += 9) {
						ctx.beginPath();
						ctx.moveTo(x, MY + MH);
						ctx.lineTo(x + 26, MY - MH);
						ctx.stroke();
					}
					ctx.restore();
				}
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = lockGlow > 0.5 ? '#ffffff' : OUT;
				ctx.stroke();
				// perfect core
				const px0 = MX + (centre - diff.perfect / 2) * MW;
				const pw = diff.perfect * MW;
				rr(px0, MY - MH / 2 + 2, pw, MH - 4, 4);
				ctx.fillStyle = `rgba(255,255,255,${0.75 + 0.25 * pulse})`;
				ctx.fill();
				ctx.lineWidth = 1.5;
				ctx.strokeStyle = 'rgba(20,10,6,0.6)';
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
			// miss tint
			if (missFlash > 0.02) {
				ctx.fillStyle = `rgba(255,30,60,${missFlash * 0.45})`;
				ctx.fillRect(MX, MY - MH / 2, MW, MH);
			}
			ctx.restore();
			// glass shine on the track
			rr(MX + 6, MY - MH / 2 + 3, MW - 12, 8, 4);
			ctx.fillStyle = 'rgba(255,255,255,0.08)';
			ctx.fill();
			rr(MX, MY - MH / 2, MW, MH, 12);
			ctx.lineWidth = 3;
			ctx.strokeStyle = OUT;
			ctx.stroke();
			// timer: drains while you wait
			if (phase === 'aim') {
				const f = Math.max(0, left / TARGET_TIME);
				const col = f > 0.5 ? '#5ee07a' : f > 0.25 ? '#ffc928' : '#ff4a5e';
				rr(MX, MY + MH / 2 + 9, MW, 6, 3);
				ctx.fillStyle = 'rgba(0,0,0,0.5)';
				ctx.fill();
				if (f > 0) {
					rr(MX, MY + MH / 2 + 9, MW * f, 6, 3);
					ctx.fillStyle = col;
					ctx.fill();
				}
			}
			// needle trail + needle
			const nCol = CAMO_COLS[nextCamo]?.[1] ?? '#ffc928';
			if (phase !== 'swap') {
				for (let i = trail.length - 1; i >= 1; i--) {
					const x = MX + trail[i] * MW;
					ctx.globalAlpha = (1 - i / trail.length) * 0.5;
					ctx.fillStyle = nCol;
					ctx.fillRect(x - 3, MY - MH / 2 + 4, 6, MH - 8);
				}
				ctx.globalAlpha = 1;
				const nx = MX + pos * MW;
				ctx.globalCompositeOperation = 'lighter';
				const ng = ctx.createRadialGradient(nx, MY, 1, nx, MY, 34);
				ng.addColorStop(0, hexA(lockGlow > 0.5 ? '#ffffff' : nCol, 0.65));
				ng.addColorStop(1, hexA(nCol, 0));
				ctx.fillStyle = ng;
				ctx.fillRect(nx - 34, MY - 34, 68, 68);
				ctx.globalCompositeOperation = 'source-over';
				rr(nx - 4, MY - MH / 2 - 12, 8, MH + 24, 4);
				ctx.fillStyle = lockGlow > 0.5 ? '#ffffff' : '#fff3dc';
				ctx.fill();
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = OUT;
				ctx.stroke();
				for (const sy of [-1, 1]) {
					const y = MY + sy * (MH / 2 + 14);
					ctx.beginPath();
					ctx.moveTo(nx - 10, y + sy * 8);
					ctx.lineTo(nx + 10, y + sy * 8);
					ctx.lineTo(nx, y - sy * 4);
					ctx.closePath();
					ctx.fillStyle = nCol;
					ctx.fill();
					ctx.lineWidth = 2.5;
					ctx.strokeStyle = OUT;
					ctx.stroke();
				}
			}
		}

		function hexA(hex: string, a: number): string {
			const n = parseInt(hex.slice(1), 16);
			return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
		}

		function draw() {
			ctx.setTransform(scale, 0, 0, scale, 0, 0);
			ctx.clearRect(0, 0, W, H);
			// floating sparkle dust round the weapon
			ctx.globalCompositeOperation = 'lighter';
			for (const d of dust) {
				const tw = 0.5 + 0.5 * Math.sin(clock * 3 + d.ph);
				ctx.fillStyle = hexA(spot, 0.15 + 0.45 * tw * Math.min(1, (d.y - 90) / 80));
				ctx.beginPath();
				ctx.arc(d.x + Math.sin(clock + d.ph) * 8, d.y, d.s, 0, Math.PI * 2);
				ctx.fill();
			}
			ctx.globalCompositeOperation = 'source-over';
			drawMeter();
			for (const p of parts) {
				const f = p.life / p.max;
				ctx.globalAlpha = p.k === 'text' ? Math.min(1, 2.6 * (1 - f)) : 1 - f;
				if (p.k === 'spark') {
					ctx.globalCompositeOperation = 'lighter';
					ctx.fillStyle = p.col;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size * (1 - f * 0.5), 0, Math.PI * 2);
					ctx.fill();
					ctx.globalCompositeOperation = 'source-over';
				} else if (p.k === 'star') star(p.x, p.y, p.size * 1.6 * (1 - f * 0.4), p.col);
				else if (p.k === 'ring') {
					ctx.strokeStyle = p.col;
					ctx.lineWidth = 5 * (1 - f) + 1;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size + f * 90, 0, Math.PI * 2);
					ctx.stroke();
				} else if (p.k === 'dust') {
					ctx.fillStyle = p.col;
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
					ctx.fill();
				} else if (p.k === 'text') {
					const pop = 1 + 0.45 * Math.max(0, 1 - f * 7);
					text(p.text ?? '', p.x, p.y, p.size * Math.min(k, 1.15) * pop, p.col);
				}
				ctx.globalAlpha = 1;
			}
			if (flash > 0.02) {
				ctx.fillStyle = `rgba(${flashCol},${flash * 0.5})`;
				ctx.fillRect(0, 0, W, H);
			}
		}

		let raf = 0;
		let last = 0;
		function frame(now: number) {
			raf = requestAnimationFrame(frame);
			const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
			last = now;
			if (paused) return;
			update(dt);
			if (raf) draw();
		}
		function stop() {
			cancelAnimationFrame(raf);
			raf = 0;
		}
		function doResume() {
			if (!paused || over) return;
			paused = false;
			last = 0;
		}
		resume = doResume;

		function onKey(e: KeyboardEvent) {
			const t = e.target as HTMLElement | null;
			if (t && t !== root && t.closest?.('input, textarea, select, [contenteditable="true"]')) return;
			const go = e.key === ' ' || e.code === 'Space' || e.key === 'Enter';
			if (go) e.preventDefault();
			if (paused) {
				doResume();
				return;
			}
			if (go && !e.repeat) tap();
		}
		function onDown(e: PointerEvent) {
			if (e.button > 0) return;
			root.focus({ preventScroll: true });
			e.preventDefault();
			tap();
		}
		function onVis() {
			if (document.hidden && !over) paused = true;
		}

		const ro = new ResizeObserver(() => resize());
		ro.observe(cv);
		resize();
		newTarget(true);
		window.addEventListener('keydown', onKey);
		root.addEventListener('pointerdown', onDown);
		document.addEventListener('visibilitychange', onVis);
		root.focus({ preventScroll: true });
		if (document.hidden) paused = true;
		Object.defineProperty(cv, '__grinder', { value: () => ({ pos, centre, zone: diff.zone, perfect: diff.perfect, phase, wIdx, step, strikes, score }), configurable: true });
		raf = requestAnimationFrame(frame);
		return () => {
			stop();
			ro.disconnect();
			window.removeEventListener('keydown', onKey);
			root.removeEventListener('pointerdown', onDown);
			document.removeEventListener('visibilitychange', onVis);
		};
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="cg" bind:this={root} tabindex="0" role="application" aria-label={s.aria} style:--spot={spot}>
	<svg class="cg-bg" viewBox="0 0 800 600" preserveAspectRatio="none" aria-hidden="true">
		<defs>
			<radialGradient id="cg-room" cx="50%" cy="40%" r="75%">
				<stop offset="0" stop-color="#3a1452" />
				<stop offset="0.55" stop-color="#1a0828" />
				<stop offset="1" stop-color="#08030e" />
			</radialGradient>
			<linearGradient id="cg-floor" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#b48cff" stop-opacity="0" />
				<stop offset="1" stop-color="#b48cff" stop-opacity="0.35" />
			</linearGradient>
			<linearGradient id="cg-beam" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" style="stop-color: var(--spot)" stop-opacity="0.3" />
				<stop offset="1" style="stop-color: var(--spot)" stop-opacity="0" />
			</linearGradient>
			<pattern id="cg-hex" width="42" height="24.25" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
				<path d="M0 12.1 L7 0 L21 0 L28 12.1 L21 24.25 L7 24.25 Z M28 12.1 L42 12.1" fill="none" stroke="#c9a2ff" stroke-opacity="0.07" stroke-width="1.2" />
			</pattern>
		</defs>
		<rect width="800" height="600" fill="url(#cg-room)" />
		<rect width="800" height="600" fill="url(#cg-hex)" />
		<!-- perspective floor -->
		<g stroke="url(#cg-floor)" stroke-width="2">
			{#each [-700, -480, -300, -160, -60, 0, 60, 160, 300, 480, 700] as dx (dx)}
				<line x1={400 + dx * 0.12} y1="316" x2={400 + dx * 1.4} y2="600" />
			{/each}
			{#each [328, 349, 377, 415, 466, 534] as y (y)}
				<line x1="0" y1={y} x2="800" y2={y} />
			{/each}
		</g>
		<path d="M330 -10 L470 -10 L640 315 L160 315 Z" fill="url(#cg-beam)" />
		<!-- pedestal -->
		<ellipse cx="400" cy="312" rx="250" ry="40" style="fill: var(--spot)" opacity="0.18" />
		<ellipse cx="400" cy="306" rx="214" ry="30" fill="#140a1e" stroke="#140a06" stroke-width="5" />
		<ellipse cx="400" cy="301" rx="206" ry="24" fill="#2e2040" />
		<ellipse cx="400" cy="301" rx="206" ry="24" fill="none" style="stroke: var(--spot)" stroke-width="3" opacity="0.85" />
		<ellipse cx="400" cy="297" rx="170" ry="15" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />
	</svg>
	<div class="cg-rays" aria-hidden="true"></div>

	<div class="cg-stage" aria-hidden="true">
		{#key wIdx}
			<div class="cg-gun" in:gunIn out:gunOut>
				<div class="cg-gun-inner" bind:this={gunEl}>
					<WeaponIcon {look} {camo} />
					<div class="cg-glint-wrap"><div class="cg-glint" bind:this={glintEl}></div></div>
				</div>
			</div>
		{/key}
	</div>

	{#if banner}
		{#key banner.key}
			<div class="cg-banner" data-camo={banner.camo} aria-hidden="true">{banner.text}</div>
		{/key}
	{/if}

	<div class="cg-hud" aria-hidden="true">
		<div class="cg-pill cg-score">
			<span class="cg-label">{s.score}</span>
			<span class="cg-num">{shown.toLocaleString('en-US')}</span>
		</div>
		<div class="cg-pill cg-weapon">
			<span class="cg-label">{s.weapon(wIdx + 1)}</span>
		</div>
		<div class="cg-pill cg-strikes" title={s.strikes}>
			{#each Array.from({ length: STRIKES }, (_, i) => i) as i (i)}
				<svg class="cg-x" class:on={i < strikes} viewBox="0 0 24 24" aria-hidden="true">
					<path d="M5 5 L19 19 M19 5 L5 19" stroke="#140a06" stroke-width="7" stroke-linecap="round" />
					<path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" />
				</svg>
			{/each}
		</div>
	</div>

	<div class="cg-name" aria-hidden="true">{name}</div>
	<div class="cg-ladder" aria-hidden="true">
		{#each GRIND_CAMOS as c, i (c)}
			<div class="cg-chip" data-camo={c} class:done={i < step} class:next={i === step && !over}>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M12 2 L22 12 L12 22 L2 12 Z" stroke="#140a06" stroke-width="2.4" stroke-linejoin="round" />
					{#if i < step}<path d="M7.5 12.5 L10.8 15.6 L16.8 8.8" fill="none" stroke="#140a06" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />{/if}
				</svg>
				<span>{s.short[c]}</span>
			</div>
		{/each}
	</div>

	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	<p class="cg-hint" aria-hidden="true">{hint}</p>
	<p class="sr-only" aria-live="polite">{live}</p>

	{#if paused}
		<button type="button" class="cg-pause" onclick={() => resume()}>
			<span class="cg-pause-title">{s.paused}</span>
			<span class="cg-pause-sub">{s.tapToContinue}</span>
		</button>
	{/if}
</div>

<style>
	.cg {
		--ink: #140a06;
		position: relative;
		width: min(100%, calc(min(72vh, 640px) * 4 / 3));
		aspect-ratio: 4 / 3;
		margin-inline: auto;
		border-radius: 14px;
		overflow: hidden;
		background: #0d0414;
		container-type: inline-size;
		touch-action: manipulation;
		user-select: none;
		-webkit-user-select: none;
		-webkit-tap-highlight-color: transparent;
		outline: none;
		cursor: pointer;
		font-family: Bahnschrift, 'Segoe UI', sans-serif;
		color: #fff3dc;
		box-shadow:
			0 0 0 1px rgb(201 162 255 / 0.25),
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.cg::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		z-index: 6;
		background: repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.07) 0 1px, transparent 1px 3px);
		box-shadow:
			inset 0 0 0 2px rgb(0 0 0 / 0.7),
			inset 0 0 60px rgb(0 0 0 / 0.6);
	}
	.cg:focus-visible {
		box-shadow:
			0 0 0 3px #ffc928,
			0 10px 30px rgb(0 0 0 / 0.45);
	}
	.cg-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.cg-rays {
		position: absolute;
		left: 50%;
		top: 33%;
		width: 120%;
		aspect-ratio: 1;
		translate: -50% -50%;
		border-radius: 50%;
		background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--spot) 22%, transparent) 0deg 7deg, transparent 7deg 22deg);
		mask-image: radial-gradient(circle, #000 0%, rgb(0 0 0 / 0.5) 30%, transparent 62%);
		animation: cg-spin 40s linear infinite;
		pointer-events: none;
		transition: background 0.4s;
	}
	@keyframes cg-spin {
		to {
			rotate: 360deg;
		}
	}
	.cg-stage {
		position: absolute;
		left: 10%;
		right: 10%;
		top: 12%;
		height: 39%;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.cg-gun {
		grid-area: 1 / 1;
		width: 92%;
		filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.55)) drop-shadow(0 0 18px color-mix(in srgb, var(--spot) 45%, transparent));
	}
	.cg-gun-inner {
		position: relative;
		animation: cg-hover 2.8s ease-in-out infinite;
	}
	.cg-gun-inner :global(.weapon-icon) {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	@keyframes cg-hover {
		0%,
		100% {
			translate: 0 0;
		}
		50% {
			translate: 0 -3%;
		}
	}
	.cg-glint-wrap {
		position: absolute;
		inset: 0;
		overflow: hidden;
		mix-blend-mode: overlay;
		pointer-events: none;
	}
	.cg-glint {
		position: absolute;
		top: -20%;
		bottom: -20%;
		left: 0;
		width: 34%;
		opacity: 0;
		background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.95) 45%, #fff 50%, rgb(255 255 255 / 0.95) 55%, transparent);
	}
	.cg-banner {
		position: absolute;
		left: 0;
		right: 0;
		top: 17%;
		z-index: 4;
		text-align: center;
		font-weight: 900;
		font-size: clamp(26px, 9cqi, 70px);
		letter-spacing: 0.04em;
		line-height: 1;
		pointer-events: none;
		background: linear-gradient(180deg, #fff6c8, #ffc928 55%, #b86e00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 3px 0 var(--ink)) drop-shadow(0 -2px 0 var(--ink)) drop-shadow(2px 0 0 var(--ink)) drop-shadow(-2px 0 0 var(--ink)) drop-shadow(0 0 14px rgb(0 0 0 / 0.6));
		animation: cg-banner 0.95s cubic-bezier(0.2, 1.4, 0.4, 1) both;
	}
	.cg-banner[data-camo='platinum'] {
		background-image: linear-gradient(180deg, #ffffff, #dfe5ea 50%, #7d858d);
	}
	.cg-banner[data-camo='harmonicBreak'] {
		background-image: repeating-linear-gradient(-32deg, #ff3b5c 0 6px, #8e0f22 6px 12px, #ff8aa0 12px 14px);
	}
	.cg-banner[data-camo='divergence'] {
		background-image: linear-gradient(90deg, #ffc4ee, #a3f5e6, #ffefae, #b48cff, #ffc4ee);
		background-size: 200% 100%;
		animation:
			cg-banner 1.2s cubic-bezier(0.2, 1.4, 0.4, 1) both,
			cg-rainbow 1.2s linear;
	}
	@keyframes cg-banner {
		0% {
			opacity: 0;
			transform: scale(0.3) rotate(-6deg);
		}
		18% {
			opacity: 1;
			transform: scale(1.12) rotate(2deg);
		}
		32% {
			transform: scale(1) rotate(0);
		}
		78% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(1.05) translateY(-14%);
		}
	}
	@keyframes cg-rainbow {
		to {
			background-position: 200% 0;
		}
	}
	.cg-hud {
		position: absolute;
		left: 2.4%;
		right: 2.4%;
		top: 2.6%;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2%;
		pointer-events: none;
	}
	.cg-pill {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.3em 0.9em;
		border-radius: 999px;
		background: rgb(24 8 34 / 0.7);
		border: 2px solid rgb(201 162 255 / 0.45);
		font-size: clamp(11px, 3.1cqi, 22px);
		font-weight: 800;
		text-shadow:
			0 2px 0 var(--ink),
			0 0 8px rgb(0 0 0 / 0.6);
	}
	.cg-label {
		font-size: 0.72em;
		letter-spacing: 0.12em;
		color: #d9c6ff;
	}
	.cg-num {
		font-size: 1.45em;
		min-width: 3.2ch;
		color: #ffd23a;
		font-variant-numeric: tabular-nums;
	}
	.cg-weapon .cg-label {
		font-size: 0.9em;
		color: #fff3dc;
	}
	.cg-strikes {
		gap: 0.25em;
		padding-inline: 0.6em;
	}
	.cg-x {
		width: 1.5em;
		height: 1.5em;
		color: #4a3a5c;
	}
	.cg-x.on {
		color: #ff3b55;
		filter: drop-shadow(0 0 6px rgb(255 40 70 / 0.8));
		animation: cg-slam 0.4s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	@keyframes cg-slam {
		0% {
			transform: scale(2.6) rotate(-30deg);
			opacity: 0;
		}
		60% {
			transform: scale(0.9) rotate(4deg);
			opacity: 1;
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}
	.cg-name {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% 0;
		z-index: 3;
		padding: 0.15em 0.9em;
		border-radius: 8px;
		background: linear-gradient(180deg, #ffe066, #f2b81f);
		border: 2px solid var(--ink);
		color: #1f5a1a;
		font-weight: 900;
		font-size: clamp(11px, 3.2cqi, 22px);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		box-shadow:
			0 3px 0 var(--ink),
			0 0 14px rgb(255 200 60 / 0.3);
	}
	.cg-ladder {
		position: absolute;
		left: 50%;
		top: 59.6%;
		translate: -50% 0;
		z-index: 3;
		display: flex;
		gap: clamp(8px, 3.4cqi, 26px);
	}
	.cg-chip {
		display: flex;
		align-items: center;
		gap: 0.3em;
		font-size: clamp(10px, 2.5cqi, 17px);
		font-weight: 800;
		color: rgb(255 243 220 / 0.45);
		text-shadow: 0 2px 0 var(--ink);
	}
	.cg-chip svg {
		width: 1.6em;
		height: 1.6em;
		fill: #2a1c38;
		overflow: visible;
	}
	.cg-chip.done {
		color: #fff3dc;
	}
	.cg-chip.done[data-camo='gold'] svg {
		fill: #ffc928;
	}
	.cg-chip.done[data-camo='platinum'] svg {
		fill: #dfe5ea;
	}
	.cg-chip.done[data-camo='harmonicBreak'] svg {
		fill: #ff2d55;
	}
	.cg-chip.done[data-camo='divergence'] svg {
		fill: #c9a2ff;
	}
	.cg-chip.done svg {
		filter: drop-shadow(0 0 5px color-mix(in srgb, currentColor 40%, transparent));
		animation: cg-chip 0.45s cubic-bezier(0.2, 1.6, 0.4, 1);
	}
	.cg-chip.next {
		color: #ffd23a;
	}
	.cg-chip.next svg {
		fill: #3a2450;
		animation: cg-next 0.9s ease-in-out infinite;
	}
	@keyframes cg-chip {
		0% {
			transform: scale(0.2) rotate(-90deg);
		}
		100% {
			transform: scale(1) rotate(0);
		}
	}
	@keyframes cg-next {
		0%,
		100% {
			transform: scale(1);
			filter: drop-shadow(0 0 0 rgb(255 210 58 / 0));
		}
		50% {
			transform: scale(1.18);
			filter: drop-shadow(0 0 6px rgb(255 210 58 / 0.9));
		}
	}
	canvas {
		position: absolute;
		inset: 0;
		z-index: 2;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.cg-hint {
		position: absolute;
		left: 4%;
		right: 4%;
		bottom: 3.2%;
		z-index: 3;
		margin: 0;
		text-align: center;
		font-size: clamp(11px, 2.6cqi, 18px);
		font-weight: 700;
		color: #e6d8ff;
		text-shadow:
			0 2px 0 var(--ink),
			0 0 8px rgb(0 0 0 / 0.7);
		pointer-events: none;
	}
	.cg-pause {
		position: absolute;
		inset: 0;
		z-index: 7;
		display: grid;
		place-content: center;
		gap: 6px;
		border: 0;
		cursor: pointer;
		background: rgb(14 4 22 / 0.66);
		backdrop-filter: blur(2px);
		color: #fff3dc;
		font-family: inherit;
		text-shadow:
			0 2px 0 var(--ink),
			0 0 14px rgb(0 0 0 / 0.7);
	}
	.cg-pause-title {
		font-size: clamp(28px, 8cqi, 52px);
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.cg-pause-sub {
		font-size: clamp(14px, 3cqi, 20px);
		font-weight: 700;
	}
	@media (prefers-reduced-motion: reduce) {
		.cg-rays,
		.cg-gun-inner,
		.cg-chip.next svg {
			animation: none;
		}
	}
</style>
