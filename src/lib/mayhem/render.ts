/**
 * Squad Mayhem's canvas drawing (2026-11-22). Our own drawings throughout:
 * - three indoor arenas (the user: "more zoomed in, indoors"): a dark office floor at night, the Burgi Burgers
 *   diner and a warehouse; each with a ceiling, lamps and a vignette;
 * - enemies drawn as CoD-style operators (the user: "opponents that look like cod operators"): a rookie in
 *   woodland camo with a balaclava and chest rig, a black-kit sweat in a FAST helmet with quad night vision, a
 *   breacher with a visored helmet and heavy vest, a camper in a ghillie hood, and the juggernaut suit;
 * - bullets, ketchup, explosions, floating texts, arrows for enemies off camera.
 * The camera (engine `cam`, VW × VH) is zoomed in and follows the player. The player's head + gun and the guns
 * on the floor are SVG on top (MayhemPage); every character is painted by painter.ts.
 */
import { FLOOR, H, VH, VW, W, type Arena, type Corpse, type Fighter, type Mayhem } from './engine.ts';
import { gunOf, type GunKind } from './guns.ts';
import { contactShadow, gunPaint, LOOKS, paintFigure, RIG, type GunPic, type Pose } from './painter.ts';

type Ctx = CanvasRenderingContext2D;
// ---------- the arenas (whole world, drawn once per scale into an offscreen canvas) ----------

const bgCache = new Map<string, HTMLCanvasElement>();
function seeded(seed: number) {
	let s = (seed % 2147483646) + 1;
	return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function ceiling(c: Ctx, col: string, lamp: string) {
	c.fillStyle = col;
	c.fillRect(0, 0, W, 34);
	c.fillStyle = 'rgba(0,0,0,0.35)';
	c.fillRect(0, 34, W, 4);
	for (let x = 90; x < W; x += 190) {
		c.fillStyle = lamp;
		c.fillRect(x - 30, 30, 60, 5);
		const g = c.createLinearGradient(0, 35, 0, FLOOR);
		g.addColorStop(0, 'rgba(255,240,200,0.14)');
		g.addColorStop(1, 'rgba(255,240,200,0)');
		c.fillStyle = g;
		c.beginPath();
		c.moveTo(x - 30, 35);
		c.lineTo(x + 30, 35);
		c.lineTo(x + 110, FLOOR);
		c.lineTo(x - 110, FLOOR);
		c.fill();
	}
}

function drawOffice(c: Ctx) {
	c.fillStyle = '#2a3236';
	c.fillRect(0, 0, W, H);
	for (let x = 0; x < W; x += 80) {
		c.fillStyle = x % 160 ? '#2e373b' : '#283034';
		c.fillRect(x, 38, 80, FLOOR - 38);
	}
	// night windows with half-open blinds
	const r = seeded(11);
	for (const x of [40, 280, 520, 760]) {
		c.fillStyle = '#0d1424';
		c.fillRect(x, 70, 160, 130);
		for (let i = 0; i < 18; i++) {
			c.fillStyle = 'rgba(255,214,140,0.55)';
			if (r() < 0.5) c.fillRect(x + 8 + r() * 140, 80 + r() * 100, 4, 5);
		}
		c.fillStyle = 'rgba(200,205,210,0.75)';
		for (let y = 72; y < 140; y += 7) c.fillRect(x, y, 160, 3);
		c.strokeStyle = '#151a1d';
		c.lineWidth = 6;
		c.strokeRect(x, 70, 160, 130);
	}
	// cubicle walls + desks with monitors in the back
	for (let x = 20; x < W; x += 150) {
		c.fillStyle = '#3d4a50';
		c.fillRect(x, FLOOR - 70, 120, 70);
		c.fillStyle = '#4a585f';
		c.fillRect(x, FLOOR - 70, 120, 5);
		c.fillStyle = '#111';
		c.fillRect(x + 40, FLOOR - 92, 34, 22);
		c.fillStyle = 'rgba(80,180,255,0.35)';
		c.fillRect(x + 43, FLOOR - 89, 28, 16);
	}
	c.fillStyle = '#b8d8ec';
	c.fillRect(905, FLOOR - 80, 22, 30);
	c.fillStyle = '#ddd';
	c.fillRect(902, FLOOR - 50, 28, 50);
	ceiling(c, '#1a1f22', '#e8f4ff');
	c.fillStyle = '#3a3f52';
	c.fillRect(0, FLOOR, W, H - FLOOR);
	c.fillStyle = '#4a5068';
	c.fillRect(0, FLOOR, W, 4);
}

function drawDiner(c: Ctx) {
	c.fillStyle = '#3b1414';
	c.fillRect(0, 0, W, H);
	for (let x = 0; x < W; x += 36) {
		c.fillStyle = x % 72 ? '#4a1818' : '#541c1c';
		c.fillRect(x, 0, 36, FLOOR);
	}
	c.fillStyle = '#c9ccd2';
	c.fillRect(0, 300, W, 8);
	for (const x of [70, 300, 530, 760]) {
		c.fillStyle = '#1a2a44';
		c.fillRect(x, 80, 150, 110);
		c.strokeStyle = '#c9ccd2';
		c.lineWidth = 5;
		c.strokeRect(x, 80, 150, 110);
		c.beginPath();
		c.moveTo(x + 75, 80);
		c.lineTo(x + 75, 190);
		c.stroke();
	}
	c.save();
	c.font = 'bold 34px Bahnschrift, Arial Black, sans-serif';
	c.textAlign = 'center';
	c.shadowColor = '#ff3b7a';
	c.shadowBlur = 22;
	c.fillStyle = '#ffd0e0';
	c.fillText('BURGI BURGERS', W / 2, 72);
	c.restore();
	ceiling(c, '#240c0c', '#fff0d0');
	for (let x = 0; x < W; x += 30)
		for (let y = FLOOR; y < H; y += 20) {
			c.fillStyle = (x / 30 + (y - FLOOR) / 20) % 2 ? '#e8e4da' : '#1f1f22';
			c.fillRect(x, y, 30, 20);
		}
	c.fillStyle = '#c9ccd2';
	c.fillRect(0, FLOOR, W, 4);
}

function drawWarehouse(c: Ctx) {
	const g = c.createLinearGradient(0, 0, 0, FLOOR);
	g.addColorStop(0, '#15181c');
	g.addColorStop(1, '#2a2f35');
	c.fillStyle = g;
	c.fillRect(0, 0, W, H);
	for (let x = 0; x < W; x += 12) {
		c.fillStyle = x % 24 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.12)';
		c.fillRect(x, 38, 12, FLOOR - 38);
	}
	// shelving with boxes in the back
	for (let x = 30; x < W; x += 230) {
		c.fillStyle = '#1b1e22';
		c.fillRect(x, 120, 6, FLOOR - 120);
		c.fillRect(x + 150, 120, 6, FLOOR - 120);
		for (const y of [200, 300, 400]) {
			c.fillStyle = '#1b1e22';
			c.fillRect(x, y, 156, 5);
			c.fillStyle = '#4e3c24';
			c.fillRect(x + 12, y - 30, 40, 30);
			c.fillRect(x + 60, y - 22, 30, 22);
			c.fillRect(x + 100, y - 34, 44, 34);
		}
	}
	ceiling(c, '#0d0f12', '#e8d080');
	c.fillStyle = '#383d44';
	c.fillRect(0, FLOOR, W, H - FLOOR);
	for (let x = -20; x < W; x += 40) {
		c.fillStyle = '#d8b21c';
		c.beginPath();
		c.moveTo(x, FLOOR);
		c.lineTo(x + 20, FLOOR);
		c.lineTo(x + 30, FLOOR + 8);
		c.lineTo(x + 10, FLOOR + 8);
		c.fill();
	}
}

function background(a: Arena, scale: number): HTMLCanvasElement {
	const s = Math.min(scale, 2.2);
	const key = `${a.id}:${s.toFixed(3)}`;
	const hit = bgCache.get(key);
	if (hit) return hit;
	const cv = document.createElement('canvas');
	cv.width = Math.ceil(W * s);
	cv.height = Math.ceil(H * s);
	const c = cv.getContext('2d')!;
	c.setTransform(s, 0, 0, s, 0, 0);
	if (a.id === 'office') drawOffice(c);
	else if (a.id === 'diner') drawDiner(c);
	else drawWarehouse(c);
	for (const p of a.platforms) {
		if (a.id === 'office') {
			// a mezzanine walkway with a railing
			c.fillStyle = '#5a646a';
			c.fillRect(p.x, p.y, p.w, 8);
			c.fillStyle = '#20262a';
			c.fillRect(p.x, p.y + 8, p.w, 14);
			c.strokeStyle = '#8a959c';
			c.lineWidth = 2;
			c.beginPath();
			c.moveTo(p.x, p.y - 22);
			c.lineTo(p.x + p.w, p.y - 22);
			for (let x = p.x + 4; x < p.x + p.w; x += 22) {
				c.moveTo(x, p.y - 22);
				c.lineTo(x, p.y);
			}
			c.stroke();
		} else if (a.id === 'diner') {
			c.fillStyle = '#d4202c';
			c.fillRect(p.x, p.y, p.w, 9);
			c.fillStyle = '#c9ccd2';
			c.fillRect(p.x, p.y + 9, p.w, 3);
			c.fillStyle = '#7a1218';
			c.fillRect(p.x + 8, p.y + 12, p.w - 16, 20);
		} else {
			c.fillStyle = '#8a6438';
			c.fillRect(p.x, p.y, p.w, 30);
			c.strokeStyle = '#5a3f20';
			c.lineWidth = 3;
			c.strokeRect(p.x + 1.5, p.y + 1.5, p.w - 3, 27);
			c.beginPath();
			c.moveTo(p.x, p.y);
			c.lineTo(p.x + p.w, p.y + 30);
			c.stroke();
			c.fillStyle = '#a57a48';
			c.fillRect(p.x, p.y, p.w, 4);
		}
	}
	// less flat: a haze that thickens towards the back wall, a sheen on the floor, film grain, darker corners
	const haze = c.createLinearGradient(0, 0, 0, FLOOR);
	haze.addColorStop(0, 'rgba(0,0,0,0.25)');
	haze.addColorStop(0.55, 'rgba(120,130,140,0.06)');
	haze.addColorStop(1, 'rgba(0,0,0,0.18)');
	c.fillStyle = haze;
	c.fillRect(0, 0, W, FLOOR);
	const sheen = c.createLinearGradient(0, FLOOR, 0, H);
	sheen.addColorStop(0, 'rgba(255,255,255,0.10)');
	sheen.addColorStop(0.25, 'rgba(255,255,255,0.02)');
	sheen.addColorStop(1, 'rgba(0,0,0,0.35)');
	c.fillStyle = sheen;
	c.fillRect(0, FLOOR, W, H - FLOOR);
	// a shadow line where the wall meets the floor
	const ao = c.createLinearGradient(0, FLOOR - 14, 0, FLOOR);
	ao.addColorStop(0, 'rgba(0,0,0,0)');
	ao.addColorStop(1, 'rgba(0,0,0,0.35)');
	c.fillStyle = ao;
	c.fillRect(0, FLOOR - 14, W, 14);
	const rnd = seeded(77);
	for (let i = 0; i < 9000; i++) {
		c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
		c.fillRect(rnd() * W, rnd() * H, 0.6, 0.6);
	}
	bgCache.set(key, cv);
	if (bgCache.size > 8) bgCache.delete(bgCache.keys().next().value!);
	return cv;
}

// ---------- characters (painter.ts) ----------

const gunShape = gunPaint;

function poseOf(f: Fighter, t: number): Pose {
	return { facing: f.facing, aim: f.aim, walk: f.walk, onGround: f.onGround, vx: f.vx, recoil: f.recoil, gun: f.held ? gunOf(f.held.id).kind : null, punch: f.punch, t };
}

function drawEnemy(c: Ctx, f: Fighter, t: number) {
	const L = LOOKS[f.kind] ?? LOOKS.random;
	paintFigure(c, L, f.x, f.y, f.scale, poseOf(f, t), f.uid);
	if (f.hurt > 0) {
		c.save();
		c.globalCompositeOperation = 'lighter';
		const g = c.createRadialGradient(f.x, f.y - 50 * f.scale, 2, f.x, f.y - 50 * f.scale, 40 * f.scale);
		g.addColorStop(0, 'rgba(255,80,60,0.35)');
		g.addColorStop(1, 'rgba(255,80,60,0)');
		c.fillStyle = g;
		c.fillRect(f.x - 40 * f.scale, f.y - 95 * f.scale, 80 * f.scale, 100 * f.scale);
		c.restore();
	}
	c.save();
	c.font = '600 8px Segoe UI, sans-serif';
	c.textAlign = 'center';
	c.fillStyle = f.kind === 'jugg' ? '#ff6a5a' : 'rgba(255,255,255,0.7)';
	c.fillText(f.tag, f.x, f.y - (RIG.top + 9) * f.scale);
	if (f.hp < f.maxHp) {
		const w = f.kind === 'jugg' ? 50 : 26;
		c.fillStyle = 'rgba(0,0,0,0.6)';
		c.fillRect(f.x - w / 2, f.y - (RIG.top + 5) * f.scale, w, 2.6);
		c.fillStyle = '#ff4433';
		c.fillRect(f.x - w / 2, f.y - (RIG.top + 5) * f.scale, (w * f.hp) / f.maxHp, 2.6);
	}
	c.restore();
}

function drawPlayer(c: Ctx, f: Fighter, op: string, t: number, pic: GunPic | null) {
	paintFigure(c, LOOKS[op] ?? LOOKS.abscar, f.x, f.y, 1, poseOf(f, t), 7, pic);
}

function drawCorpse(c: Ctx, k: Corpse, op: string) {
	const f = k.f;
	const L = f.player ? (LOOKS[op] ?? LOOKS.abscar) : (LOOKS[f.kind] ?? LOOKS.random);
	c.save();
	c.globalAlpha = k.t > 9 ? Math.max(0, 1 - (k.t - 9) / 2) : 1;
	c.translate(k.x, k.y);
	c.rotate(k.ang);
	paintFigure(c, L, 0, 46 * f.scale, f.scale, { facing: f.facing, aim: 0, walk: k.t * 3, onGround: false, vx: 0, recoil: 0, gun: null, punch: 0, limp: true, t: k.t }, f.uid);
	c.restore();
}

function burger(c: Ctx, x: number, y: number, t: number) {
	c.save();
	c.translate(x, y - 4 + Math.sin(t * 4) * 2);
	c.fillStyle = '#d98a2b';
	c.beginPath();
	c.ellipse(0, -5, 11, 7, 0, Math.PI, 0);
	c.fill();
	c.fillStyle = '#5bbd3a';
	c.fillRect(-11, -5, 22, 2.5);
	c.fillStyle = '#ffcc33';
	c.fillRect(-10, -2.5, 20, 2);
	c.fillStyle = '#6b3a1f';
	c.fillRect(-11, -0.5, 22, 4);
	c.fillStyle = '#d98a2b';
	c.fillRect(-10, 3.5, 20, 4);
	c.restore();
}

export interface View {
	op: string;
	/** device px per world px (the camera's VW wide view fills the canvas) */
	scale: number;
	pw: number;
	ph: number;
	/** the player's gun picture (their camo), drawn in their hands */
	gun?: GunPic | null;
}

export function render(c: Ctx, g: Mayhem, v: View) {
	const s = v.scale;
	const sx = g.shake ? (Math.random() - 0.5) * g.shake : 0;
	const sy = g.shake ? (Math.random() - 0.5) * g.shake : 0;
	const cx = g.cam.x - sx;
	const cy = g.cam.y - sy;
	c.setTransform(1, 0, 0, 1, 0, 0);
	c.fillStyle = '#000';
	c.fillRect(0, 0, v.pw, v.ph);
	const bg = background(g.arena, s);
	const bs = bg.width / W; // the cached picture's own scale
	c.drawImage(bg, cx * bs, cy * bs, VW * bs, VH * bs, 0, 0, v.pw, v.ph);
	c.setTransform(s, 0, 0, s, -cx * s, -cy * s);

	for (const sp of g.splats) {
		c.fillStyle = `rgba(200,22,30,${sp.a})`;
		c.beginPath();
		c.ellipse(sp.x, sp.y - 0.5, sp.r, sp.r * 0.35, 0, 0, Math.PI * 2);
		c.fill();
	}
	for (const k of g.corpses) drawCorpse(c, k, v.op);
	for (const k of g.pickups) if (k.heal > 0) burger(c, k.x, k.y, g.t);

	// a camper's laser while they line up a shot
	for (const e of g.enemies) {
		if (e.charge <= 0) continue;
		const m = g.muzzle(e);
		c.strokeStyle = `rgba(255,30,30,${0.25 + e.charge * 0.55})`;
		c.lineWidth = 1 + e.charge;
		c.beginPath();
		c.moveTo(m.x, m.y);
		c.lineTo(m.x + Math.cos(e.aim) * 1400, m.y + Math.sin(e.aim) * 1400);
		c.stroke();
	}

	// soft contact shadows on whatever they stand over
	const groundUnder = (x: number, y: number) => {
		let gy = FLOOR;
		for (const pl of g.arena.platforms) if (x > pl.x && x < pl.x + pl.w && pl.y >= y - 1 && pl.y < gy) gy = pl.y;
		return gy;
	};
	for (const f of [...g.enemies, ...(g.player.hp > 0 ? [g.player] : [])]) {
		const gy = groundUnder(f.x, f.y);
		contactShadow(c, f.x, gy, f.scale, gy - f.y);
	}
	for (const e of g.enemies) drawEnemy(c, e, g.t);
	if (g.player.hp > 0) drawPlayer(c, g.player, v.op, g.t, v.gun ?? null);

	c.lineCap = 'round';
	for (const b of g.bullets) {
		if (b.kind === 'rocket') {
			c.fillStyle = '#2a2d33';
			c.save();
			c.translate(b.x, b.y);
			c.rotate(Math.atan2(b.vy, b.vx));
			c.fillRect(-10, -3, 20, 6);
			c.fillStyle = '#ff8a1a';
			c.beginPath();
			c.arc(-12, 0, 4, 0, Math.PI * 2);
			c.fill();
			c.restore();
		} else if (b.kind === 'thrown') {
			c.save();
			c.translate(b.x, b.y);
			c.rotate(g.t * (b.spin ?? 10));
			gunShape(c, gunOf(b.gun!.id).kind);
			c.restore();
		} else {
			// a glowing tracer
			const sp = Math.hypot(b.vx, b.vy) || 1;
			const tx = b.x - (b.vx / sp) * 22, ty = b.y - (b.vy / sp) * 22;
			const tg = c.createLinearGradient(tx, ty, b.x, b.y);
			tg.addColorStop(0, 'rgba(255,200,120,0)');
			tg.addColorStop(1, b.mine ? 'rgba(255,240,170,1)' : 'rgba(255,140,100,1)');
			c.save();
			c.globalCompositeOperation = 'lighter';
			c.strokeStyle = tg;
			c.lineWidth = 1.4;
			c.shadowColor = b.mine ? '#ffd27a' : '#ff6a4a';
			c.shadowBlur = 6;
			c.beginPath();
			c.moveTo(tx, ty);
			c.lineTo(b.x, b.y);
			c.stroke();
			c.restore();
		}
	}

	for (const q of g.parts) {
		const k = Math.max(0, q.life / q.max);
		if (q.kind === 'ketchup') {
			c.fillStyle = '#c8161e';
			c.beginPath();
			c.arc(q.x, q.y, q.r, 0, Math.PI * 2);
			c.fill();
		} else if (q.kind === 'spark') {
			c.fillStyle = `rgba(255,220,120,${k})`;
			c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
		} else if (q.kind === 'shell') {
			c.fillStyle = '#d9a84a';
			c.fillRect(q.x - 2, q.y - 1, 4, 2);
		} else if (q.kind === 'flash') {
			// a muzzle flash that lights up its surroundings
			c.save();
			c.globalCompositeOperation = 'lighter';
			const lg = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 5);
			lg.addColorStop(0, `rgba(255,220,140,${0.45 * k})`);
			lg.addColorStop(1, 'rgba(255,160,60,0)');
			c.fillStyle = lg;
			c.fillRect(q.x - q.r * 5, q.y - q.r * 5, q.r * 10, q.r * 10);
			c.fillStyle = `rgba(255,245,200,${k})`;
			c.beginPath();
			c.ellipse(q.x, q.y, q.r * 0.9, q.r * 0.45, 0, 0, Math.PI * 2);
			c.fill();
			c.restore();
		} else if (q.kind === 'boom') {
			c.save();
			c.globalCompositeOperation = 'lighter';
			const bg2 = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
			bg2.addColorStop(0, `rgba(255,240,180,${k})`);
			bg2.addColorStop(0.4, `rgba(255,140,40,${k * 0.8})`);
			bg2.addColorStop(1, 'rgba(200,40,10,0)');
			c.fillStyle = bg2;
			c.beginPath();
			c.arc(q.x, q.y, q.r, 0, Math.PI * 2);
			c.fill();
			c.restore();
		} else {
			c.fillStyle = `rgba(120,120,120,${k * 0.45})`;
			c.beginPath();
			c.arc(q.x, q.y, q.r, 0, Math.PI * 2);
			c.fill();
		}
	}

	const text = (u: (typeof g.popups)[number], x: number, y: number) => {
		const a = Math.max(0, 1 - u.t / 1.3);
		const big = u.tone === 'wave';
		c.font = big ? '800 44px Bahnschrift, Arial Black, sans-serif' : `800 ${u.screen ? 18 : u.tone === 'head' ? 13 : 11}px Bahnschrift, Arial Black, sans-serif`;
		c.fillStyle =
			u.tone === 'head' ? `rgba(255,70,50,${a})` : u.tone === 'combo' ? `rgba(255,214,60,${a})` : u.tone === 'heal' ? `rgba(110,255,120,${a})` : u.tone === 'gun' ? `rgba(160,220,255,${a})` : `rgba(255,255,255,${a})`;
		c.strokeStyle = `rgba(0,0,0,${a * 0.7})`;
		c.lineWidth = big ? 6 : 3;
		const yy = y - u.t * (big ? 8 : 24);
		c.strokeText(u.text, x, yy);
		c.fillText(u.text, x, yy);
	};
	c.textAlign = 'center';
	for (const u of g.popups) if (!u.screen) text(u, u.x, u.y);

	// dust drifting in the lamp light
	c.save();
	c.globalCompositeOperation = 'lighter';
	for (let i = 0; i < 46; i++) {
		const dx2 = ((i * 137.5 + g.t * (6 + (i % 5))) % W + W) % W;
		const dy2 = 60 + ((i * 89.3 + Math.sin(g.t * 0.6 + i) * 14) % (FLOOR - 80));
		c.fillStyle = `rgba(255,240,210,${0.05 + (i % 4) * 0.025})`;
		c.beginPath();
		c.arc(dx2, dy2, 0.6 + (i % 3) * 0.35, 0, Math.PI * 2);
		c.fill();
	}
	c.restore();

	// screen space: colour grade, vignette (green in Holk Time), arrows to enemies off camera, banners
	c.setTransform(s, 0, 0, s, 0, 0);
	const grade = c.createLinearGradient(0, 0, 0, VH);
	grade.addColorStop(0, 'rgba(255,170,90,0.07)');
	grade.addColorStop(1, 'rgba(40,90,120,0.10)');
	c.save();
	c.globalCompositeOperation = 'soft-light';
	c.fillStyle = grade;
	c.fillRect(0, 0, VW, VH);
	c.restore();
	const vg = c.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VH * 0.95);
	vg.addColorStop(0, g.holkOn ? 'rgba(60,255,90,0)' : 'rgba(0,0,0,0)');
	vg.addColorStop(1, g.holkOn ? 'rgba(60,255,90,0.34)' : 'rgba(0,0,0,0.45)');
	c.fillStyle = vg;
	c.fillRect(0, 0, VW, VH);
	for (const e of g.enemies) {
		const ex = e.x - g.cam.x;
		const ey = e.y - 46 - g.cam.y;
		if (ex > -4 && ex < VW + 4 && ey > 0 && ey < VH) continue;
		const ax = Math.max(12, Math.min(VW - 12, ex));
		const ay = Math.max(48, Math.min(VH - 20, ey));
		c.save();
		c.translate(ax, ay);
		c.rotate(Math.atan2(ey - ay, ex - ax));
		c.fillStyle = e.kind === 'jugg' ? 'rgba(255,60,40,0.95)' : 'rgba(255,90,70,0.75)';
		c.beginPath();
		c.moveTo(9, 0);
		c.lineTo(-5, -6);
		c.lineTo(-5, 6);
		c.closePath();
		c.fill();
		c.restore();
	}
	for (const u of g.popups) if (u.screen) text(u, VW / 2, u.tone === 'wave' ? 120 : 160);
}
