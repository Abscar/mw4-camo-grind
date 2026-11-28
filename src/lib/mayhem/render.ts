/**
 * Abscars Madness' canvas drawing (2026-11-22; levels 2026-11-23). Our own drawings throughout:
 * - three indoor arenas (the user: "more zoomed in, indoors"): a dark office floor at night, the Burgi Burgers
 *   diner and a warehouse; each with a ceiling, lamps and a vignette;
 * - enemies drawn as CoD-style operators (the user: "opponents that look like cod operators"): a rookie in
 *   woodland camo with a balaclava and chest rig, a black-kit sweat in a FAST helmet with quad night vision, a
 *   breacher with a visored helmet and heavy vest, a camper in a ghillie hood, and the juggernaut suit;
 * - the level pieces (levels.ts): pits, walkways, walls, doors with lock lights, cracked walls, crates, red
 *   barrels, laser gates, switches, key cards, checkpoint flags and the EXIT;
 * - bullets, ketchup, explosions, floating texts, arrows for enemies off camera.
 * - chapter 2 (2026-11-23): two more arenas, a skyscraper going up at night (tower) and the depths under the
 *   city (sewer bricks, pipes, glowing slime), each with a tile that repeats upwards for the tall levels; moving
 *   platforms, jump pads, spikes and the rising sludge.
 * The arena picture is one W-wide tile, repeated along the level (its patterns repeat every W).
 * The camera (engine `cam`, VW × VH) is zoomed in and follows the player. The player's head + gun and the guns
 * on the floor are SVG on top (MayhemPage); every character is painted by painter.ts.
 */
import { bodyOf, CEIL, FLOOR, H, PAD_W, SPIKE_H, VH, VW, W, type Arena, type Corpse, type Fighter, type Mayhem, type Platform } from './engine.ts';
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
	for (let x = 90; x < W; x += 240) {
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
	for (let x = 20; x < W; x += 160) {
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
	for (let x = 0; x < W; x += 40) {
		c.fillStyle = x % 80 ? '#4a1818' : '#541c1c';
		c.fillRect(x, 0, 40, FLOOR);
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
	for (let x = 30; x < W; x += 240) {
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

// ---------- chapter 2 arenas: a tile UH tall that repeats upwards (the base picture uses it too) ----------
const UH = 480;

function towerTile(c: Ctx) {
	c.fillStyle = '#0a1230';
	c.fillRect(0, 0, W, UH);
	// distant skyscrapers with lit windows (rows every 24, so the tile repeats cleanly)
	const r = seeded(31);
	for (const [x, w, shade] of [[40, 130, '#121c3e'], [230, 90, '#0f1736'], [390, 160, '#141f44'], [610, 110, '#101a3a'], [790, 140, '#131d40']] as const) {
		c.fillStyle = shade;
		c.fillRect(x, 0, w, UH);
		for (let y = 6; y < UH; y += 24)
			for (let wx = x + 8; wx < x + w - 10; wx += 16) {
				if (r() < 0.32) {
					c.fillStyle = r() < 0.75 ? 'rgba(255,214,140,0.55)' : 'rgba(140,200,255,0.45)';
					c.fillRect(wx, y, 7, 10);
				}
			}
	}
	// the tower's own steel frame in front: columns, X-bracing and a girder at the tile's foot
	c.strokeStyle = 'rgba(150,160,175,0.18)';
	c.lineWidth = 5;
	for (const x0 of [0, 480]) {
		c.beginPath();
		c.moveTo(x0 + 26, 0);
		c.lineTo(x0 + 480, UH - 20);
		c.moveTo(x0 + 480, 0);
		c.lineTo(x0 + 26, UH - 20);
		c.stroke();
	}
	for (const x of [0, 480]) {
		const g = c.createLinearGradient(x, 0, x + 26, 0);
		g.addColorStop(0, '#2a3038');
		g.addColorStop(0.5, '#4a525c');
		g.addColorStop(1, '#2a3038');
		c.fillStyle = g;
		c.fillRect(x, 0, 26, UH);
		c.fillStyle = 'rgba(0,0,0,0.4)';
		for (let y = 12; y < UH; y += 40) c.fillRect(x + 5, y, 3, 3), c.fillRect(x + 18, y, 3, 3);
	}
	c.fillStyle = '#6a2a1c';
	c.fillRect(0, UH - 20, W, 20);
	c.fillStyle = '#8a3a24';
	c.fillRect(0, UH - 20, W, 4);
	c.fillStyle = 'rgba(0,0,0,0.35)';
	for (let x = 10; x < W; x += 30) c.fillRect(x, UH - 12, 3, 3);
	// a red warning light on each column
	c.fillStyle = '#ff3b3b';
	for (const x of [13, 493]) {
		c.beginPath();
		c.arc(x, 200, 3, 0, Math.PI * 2);
		c.fill();
	}
}

function depthsTile(c: Ctx) {
	c.fillStyle = '#101510';
	c.fillRect(0, 0, W, UH);
	// old bricks (30 tall, 16 rows a tile)
	for (let y = 0; y < UH; y += 30)
		for (let x = (y / 30) % 2 ? -30 : 0; x < W; x += 60) {
			c.fillStyle = ((x + y) / 30) % 3 === 0 ? '#1a2219' : '#161d15';
			c.fillRect(x + 1, y + 1, 58, 28);
		}
	// slime running down from the joints
	const r = seeded(53);
	for (let i = 0; i < 26; i++) {
		const x = r() * W, y = r() * UH, h = 20 + r() * 70;
		const g = c.createLinearGradient(0, y, 0, y + h);
		g.addColorStop(0, 'rgba(90,255,90,0.25)');
		g.addColorStop(1, 'rgba(90,255,90,0)');
		c.fillStyle = g;
		c.fillRect(x, y, 3 + r() * 4, h);
	}
	// pipes: two going up, one across
	for (const x of [190, 730]) {
		c.fillStyle = '#25332a';
		c.fillRect(x, 0, 30, UH);
		c.fillStyle = 'rgba(255,255,255,0.08)';
		c.fillRect(x + 5, 0, 5, UH);
		for (let y = 40; y < UH; y += 120) {
			c.fillStyle = '#37473b';
			c.fillRect(x - 4, y, 38, 12);
		}
	}
	c.fillStyle = '#2c3a30';
	c.fillRect(0, 236, W, 22);
	c.fillStyle = 'rgba(255,255,255,0.07)';
	c.fillRect(0, 240, W, 4);
	// glowing fungus
	for (let i = 0; i < 18; i++) {
		const x = r() * W, y = r() * UH;
		const g = c.createRadialGradient(x, y, 0, x, y, 12);
		g.addColorStop(0, 'rgba(140,255,120,0.55)');
		g.addColorStop(1, 'rgba(140,255,120,0)');
		c.fillStyle = g;
		c.fillRect(x - 12, y - 12, 24, 24);
	}
}

const TILES: Partial<Record<Arena['id'], (c: Ctx) => void>> = { tower: towerTile, depths: depthsTile };

function drawTall(c: Ctx, id: Arena['id']) {
	const tile = TILES[id]!;
	for (const y of [40 - UH, 40]) {
		c.save();
		c.translate(0, y);
		tile(c);
		c.restore();
	}
	if (id === 'tower') {
		c.fillStyle = '#2c3034';
		c.fillRect(0, FLOOR, W, H - FLOOR);
		for (let x = 0; x < W; x += 40) {
			c.fillStyle = (x / 40) % 2 ? '#ffcc22' : '#1a1a1a';
			c.fillRect(x, FLOOR, 40, 5);
		}
	} else {
		c.fillStyle = '#1c241c';
		c.fillRect(0, FLOOR, W, H - FLOOR);
		c.fillStyle = 'rgba(90,255,90,0.18)';
		c.fillRect(0, FLOOR, W, 3);
	}
}

/** the repeating tile above the base picture (tall levels) */
function upperTile(id: Arena['id'], scale: number): HTMLCanvasElement | null {
	const tile = TILES[id];
	if (!tile) return null;
	const sc = Math.min(scale, 2.2);
	const key = `up:${id}:${sc.toFixed(3)}`;
	const hit = bgCache.get(key);
	if (hit) return hit;
	const cv = document.createElement('canvas');
	cv.width = Math.ceil(W * sc);
	cv.height = Math.ceil(UH * sc);
	const c = cv.getContext('2d')!;
	c.setTransform(sc, 0, 0, sc, 0, 0);
	tile(c);
	c.fillStyle = 'rgba(0,0,0,0.12)';
	c.fillRect(0, 0, W, UH);
	bgCache.set(key, cv);
	if (bgCache.size > 10) bgCache.delete(bgCache.keys().next().value!);
	return cv;
}

function background(a: Arena, scale: number): HTMLCanvasElement {
	const s = Math.min(scale, 2.2);
	const key = `${a.id}:${s.toFixed(3)}`; // the picture has no level pieces: one per theme
	const hit = bgCache.get(key);
	if (hit) return hit;
	const cv = document.createElement('canvas');
	cv.width = Math.ceil(W * s);
	cv.height = Math.ceil(H * s);
	const c = cv.getContext('2d')!;
	c.setTransform(s, 0, 0, s, 0, 0);
	if (a.id === 'office') drawOffice(c);
	else if (a.id === 'diner') drawDiner(c);
	else if (a.id === 'warehouse') drawWarehouse(c);
	else drawTall(c, a.id);
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

function platform(c: Ctx, theme: Arena['id'], p: Platform) {
	if (theme === 'office') {
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
	} else if (theme === 'diner') {
		c.fillStyle = '#d4202c';
		c.fillRect(p.x, p.y, p.w, 9);
		c.fillStyle = '#c9ccd2';
		c.fillRect(p.x, p.y + 9, p.w, 3);
		c.fillStyle = '#7a1218';
		c.fillRect(p.x + 8, p.y + 12, p.w - 16, 20);
	} else if (theme === 'tower') {
		// a steel I-beam with rivets
		c.fillStyle = '#7a838c';
		c.fillRect(p.x, p.y, p.w, 6);
		c.fillStyle = '#3a4048';
		c.fillRect(p.x + 4, p.y + 6, p.w - 8, 12);
		c.fillStyle = '#5a636c';
		c.fillRect(p.x, p.y + 18, p.w, 5);
		c.fillStyle = 'rgba(0,0,0,0.45)';
		for (let x = p.x + 8; x < p.x + p.w - 4; x += 18) c.fillRect(x, p.y + 10, 3, 3);
	} else if (theme === 'depths') {
		// a rusty grate with a green glow under it
		const g = c.createLinearGradient(0, p.y, 0, p.y + 40);
		g.addColorStop(0, 'rgba(90,255,90,0.18)');
		g.addColorStop(1, 'rgba(90,255,90,0)');
		c.fillStyle = g;
		c.fillRect(p.x, p.y + 10, p.w, 30);
		c.fillStyle = '#6a5038';
		c.fillRect(p.x, p.y, p.w, 10);
		c.fillStyle = '#2a1e14';
		for (let x = p.x + 5; x < p.x + p.w - 6; x += 12) c.fillRect(x, p.y + 3, 6, 4);
		c.fillStyle = '#8a6a48';
		c.fillRect(p.x, p.y, p.w, 2);
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

// ---------- characters (painter.ts) ----------

const gunShape = gunPaint;

function poseOf(f: Fighter, t: number): Pose {
	const pose: Pose = { facing: f.facing, aim: f.aim, walk: f.walk, onGround: f.onGround, vx: f.vx, recoil: f.recoil, gun: f.held ? gunOf(f.held.id).kind : null, punch: f.punch, t };
	if (f.player) {
		// crouch / slide / dive / lying flat / sprint: the engine says how the body sits, the painter draws it the same way
		const b = bodyOf(f);
		if (b.drop) pose.drop = b.drop;
		if (b.lean) pose.lean = b.lean;
		pose.slide = f.stance === 'slide';
		pose.lie = f.stance === 'dive' || f.stance === 'prone';
	}
	return pose;
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

/** a bundle of loot cash: a green banknote stack with a paper band, a soft gold glow, blinking before it fades */
function cashBundle(c: Ctx, x: number, y: number, t: number, spin: number, onGround: boolean, life: number) {
	if (life < 3 && Math.floor(life * 6) % 2) return;
	c.save();
	c.translate(x, y - 3 + (onGround ? Math.sin(t * 4 + x) * 1.2 : 0));
	c.rotate(onGround ? -0.08 : t * spin);
	c.shadowColor = 'rgba(255,220,90,0.75)';
	c.shadowBlur = 6 + Math.sin(t * 6 + x) * 3;
	c.fillStyle = '#1d5a2a';
	c.fillRect(-10, -3, 20, 8);
	c.shadowBlur = 0;
	c.fillStyle = '#4fa85a';
	c.fillRect(-10, -5, 20, 7);
	c.strokeStyle = '#173f20';
	c.lineWidth = 1;
	c.strokeRect(-9.5, -4.5, 19, 6);
	c.fillStyle = '#9fe0a0';
	c.beginPath();
	c.ellipse(0, -1.5, 3, 2.2, 0, 0, Math.PI * 2);
	c.fill();
	c.fillStyle = '#f2e6b8';
	c.fillRect(-2.2, -5.5, 4.4, 8.5);
	c.fillStyle = '#1d5a2a';
	c.font = 'bold 6px system-ui, sans-serif';
	c.textAlign = 'center';
	c.fillText('$', 0, 0.6);
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

// ---------- level pieces ----------

const KEY_COL = { red: '#ff3b3b', blue: '#3b8bff', yellow: '#ffd23b' } as const;

function pit(c: Ctx, x0: number, x1: number) {
	const g = c.createLinearGradient(0, FLOOR, 0, H);
	g.addColorStop(0, '#07080a');
	g.addColorStop(1, '#000');
	c.fillStyle = g;
	c.fillRect(x0, FLOOR - 1, x1 - x0, H - FLOOR + 2);
	// hazard edges
	for (const x of [x0, x1 - 6]) {
		for (let y = FLOOR; y < FLOOR + 22; y += 8) {
			c.fillStyle = (y / 8) % 2 ? '#ffcc22' : '#1a1a1a';
			c.fillRect(x, y, 6, 8);
		}
	}
	c.fillStyle = 'rgba(255,60,30,0.10)';
	c.fillRect(x0 + 6, H - 40, x1 - x0 - 12, 40);
}

function wallBlock(c: Ctx, theme: Arena['id'], b: { x: number; y: number; w: number; h: number; kind: string }) {
	const base = theme === 'office' ? '#4a5358' : theme === 'diner' ? '#5a2a26' : theme === 'tower' ? '#3a4048' : theme === 'depths' ? '#24302a' : '#5a4a34';
	const g = c.createLinearGradient(b.x, 0, b.x + b.w, 0);
	g.addColorStop(0, base);
	g.addColorStop(0.5, '#6d777c');
	g.addColorStop(1, base);
	c.fillStyle = b.kind === 'shelf' ? '#3a3f44' : g;
	c.fillRect(b.x, b.y, b.w, b.h);
	c.fillStyle = 'rgba(255,255,255,0.18)';
	c.fillRect(b.x, b.y, b.w, 3);
	c.fillStyle = 'rgba(0,0,0,0.35)';
	for (let y = b.y + 14; y < b.y + b.h; y += 18) c.fillRect(b.x, y, b.w, 1.5);
	c.strokeStyle = 'rgba(0,0,0,0.6)';
	c.lineWidth = 1.5;
	c.strokeRect(b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5);
}

function cracked(c: Ctx, b: { x: number; y: number; w: number; h: number }) {
	c.fillStyle = '#7a6e62';
	c.fillRect(b.x, b.y, b.w, b.h);
	for (let y = b.y; y < b.y + b.h; y += 14)
		for (let x = b.x + ((y / 14) % 2 ? -8 : 0); x < b.x + b.w; x += 17) {
			c.fillStyle = (x + y) % 3 ? '#8f8173' : '#83766a';
			c.fillRect(Math.max(b.x, x + 1), y + 1, Math.min(15, b.x + b.w - x - 1), 12);
		}
	c.strokeStyle = '#1b1612';
	c.lineWidth = 2;
	c.beginPath();
	const cx = b.x + b.w / 2;
	c.moveTo(cx - 6, b.y + 40);
	c.lineTo(cx + 5, b.y + 130);
	c.lineTo(cx - 4, b.y + 220);
	c.lineTo(cx + 7, b.y + 300);
	c.lineTo(cx - 3, b.y + 400);
	c.moveTo(cx + 5, b.y + 130);
	c.lineTo(b.x + b.w, b.y + 170);
	c.moveTo(cx - 4, b.y + 300);
	c.lineTo(b.x, b.y + 340);
	c.stroke();
	c.save();
	c.font = '800 9px Bahnschrift, Arial Black, sans-serif';
	c.fillStyle = '#ffcc22';
	c.translate(cx + 3, FLOOR - 90);
	c.rotate(-Math.PI / 2);
	c.textAlign = 'center';
	c.fillText('WEAK', 0, 0);
	c.restore();
}

function door(c: Ctx, b: { x: number; y: number; w: number; h: number; openT: number; lock?: unknown }, t: number) {
	const hh = b.h * (1 - b.openT);
	// the frame
	c.fillStyle = '#1c2024';
	c.fillRect(b.x - 4, b.y, b.w + 8, 8);
	if (hh > 1) {
		const g = c.createLinearGradient(b.x, 0, b.x + b.w, 0);
		g.addColorStop(0, '#5d666d');
		g.addColorStop(0.5, '#9aa3a9');
		g.addColorStop(1, '#4e565c');
		c.fillStyle = g;
		c.fillRect(b.x, b.y, b.w, hh);
		c.fillStyle = 'rgba(0,0,0,0.3)';
		for (let y = b.y + 30; y < b.y + hh; y += 40) c.fillRect(b.x, y, b.w, 3);
		// hazard foot
		for (let x = b.x; x < b.x + b.w; x += 8) {
			c.fillStyle = (x - b.x) % 16 ? '#1a1a1a' : '#ffcc22';
			c.fillRect(x, b.y + hh - 10, 8, 10);
		}
	}
	// the lock light: key colour, red = clear the area, cyan = a switch, green = open
	const L = b.lock as { key?: keyof typeof KEY_COL; kill?: string; sw?: string } | undefined;
	const col = b.openT > 0 ? '#3bff6a' : L?.key ? KEY_COL[L.key] : L?.sw ? '#3be8ff' : '#ff3b3b';
	const ly = b.w > b.h ? b.y - 12 : b.y + b.h - 120;
	c.save();
	c.shadowColor = col;
	c.shadowBlur = 10 + Math.sin(t * 5) * 3;
	c.fillStyle = col;
	c.fillRect(b.x - 2, ly, b.w + 4, 10);
	c.restore();
	if (b.openT === 0 && L) {
		c.save();
		c.font = '800 7px Bahnschrift, Arial Black, sans-serif';
		c.textAlign = 'center';
		c.fillStyle = '#000';
		c.fillText(L.key ? 'KEY' : L.sw ? 'SW' : 'CLEAR', b.x + b.w / 2, ly + 7.5);
		c.restore();
	}
}

function crate(c: Ctx, k: { x: number; y: number; w: number; h: number }) {
	c.fillStyle = '#9a6a36';
	c.fillRect(k.x, k.y, k.w, k.h);
	c.strokeStyle = '#5a3a18';
	c.lineWidth = 4;
	c.strokeRect(k.x + 2, k.y + 2, k.w - 4, k.h - 4);
	c.lineWidth = 3;
	c.beginPath();
	c.moveTo(k.x + 4, k.y + 4);
	c.lineTo(k.x + k.w - 4, k.y + k.h - 4);
	c.moveTo(k.x + k.w - 4, k.y + 4);
	c.lineTo(k.x + 4, k.y + k.h - 4);
	c.stroke();
	c.fillStyle = 'rgba(255,230,180,0.25)';
	c.fillRect(k.x, k.y, k.w, 3);
}

function barrel(c: Ctx, x: number, y: number, t: number, fuse: number) {
	const g = c.createLinearGradient(x - 12, 0, x + 12, 0);
	g.addColorStop(0, '#7a0f0f');
	g.addColorStop(0.45, '#e0302a');
	g.addColorStop(1, '#6a0c0c');
	c.fillStyle = g;
	c.fillRect(x - 12, y - 36, 24, 36);
	c.fillStyle = '#3a0808';
	c.fillRect(x - 13, y - 26, 26, 3);
	c.fillRect(x - 13, y - 12, 26, 3);
	c.fillStyle = '#ffcc22';
	c.beginPath();
	c.moveTo(x, y - 23);
	c.lineTo(x + 6, y - 14);
	c.lineTo(x - 6, y - 14);
	c.closePath();
	c.fill();
	c.fillStyle = '#000';
	c.fillRect(x - 0.8, y - 21, 1.6, 4);
	if (fuse > 0 && Math.sin(t * 60) > 0) {
		c.fillStyle = 'rgba(255,240,180,0.6)';
		c.fillRect(x - 12, y - 36, 24, 36);
	}
}

function laser(c: Ctx, l: { x: number; top: number; bottom: number; on: boolean }, t: number) {
	// emitters top and bottom
	c.fillStyle = '#2a2f35';
	c.fillRect(l.x - 7, l.top, 14, 10);
	c.fillRect(l.x - 7, l.bottom - 8, 14, 8);
	if (!l.on) {
		c.fillStyle = '#444';
		c.fillRect(l.x - 2, l.top + 10, 4, 3);
		return;
	}
	c.save();
	c.globalCompositeOperation = 'lighter';
	const w = 3 + Math.sin(t * 30) * 0.8;
	const g = c.createLinearGradient(l.x - 10, 0, l.x + 10, 0);
	g.addColorStop(0, 'rgba(255,30,30,0)');
	g.addColorStop(0.5, 'rgba(255,40,40,0.55)');
	g.addColorStop(1, 'rgba(255,30,30,0)');
	c.fillStyle = g;
	c.fillRect(l.x - 10, l.top + 10, 20, l.bottom - l.top - 18);
	c.fillStyle = 'rgba(255,220,220,0.95)';
	c.fillRect(l.x - w / 2, l.top + 10, w, l.bottom - l.top - 18);
	c.restore();
}

function switchBox(c: Ctx, sw: { x: number; y: number; on: boolean }, t: number) {
	c.fillStyle = '#20252a';
	c.fillRect(sw.x - 10, sw.y - 14, 20, 28);
	c.strokeStyle = '#8a959c';
	c.lineWidth = 1.5;
	c.strokeRect(sw.x - 10, sw.y - 14, 20, 28);
	const col = sw.on ? '#3bff6a' : '#3be8ff';
	c.save();
	c.shadowColor = col;
	c.shadowBlur = sw.on ? 6 : 8 + Math.sin(t * 6) * 4;
	c.fillStyle = col;
	c.fillRect(sw.x - 5, sw.y - 9, 10, 5);
	c.restore();
	c.strokeStyle = '#d0d6da';
	c.lineWidth = 3;
	c.beginPath();
	c.moveTo(sw.x, sw.y + 6);
	c.lineTo(sw.x + (sw.on ? 7 : -7), sw.y - 2);
	c.stroke();
	if (!sw.on) {
		c.save();
		c.font = '800 8px Bahnschrift, Arial Black, sans-serif';
		c.textAlign = 'center';
		c.fillStyle = 'rgba(59,232,255,' + (0.6 + Math.sin(t * 4) * 0.3) + ')';
		c.fillText('E / SHOOT', sw.x, sw.y - 20);
		c.restore();
	}
}

function keyCard(c: Ctx, k: { colour: keyof typeof KEY_COL; x: number; y: number }, t: number) {
	const y = k.y - 10 + Math.sin(t * 3 + k.x) * 3;
	c.save();
	c.shadowColor = KEY_COL[k.colour];
	c.shadowBlur = 14;
	c.fillStyle = KEY_COL[k.colour];
	c.translate(k.x, y);
	c.rotate(Math.sin(t * 2) * 0.2);
	c.fillRect(-10, -7, 20, 14);
	c.restore();
	c.fillStyle = 'rgba(0,0,0,0.5)';
	c.fillRect(k.x - 7, y - 3, 8, 3);
	c.fillStyle = 'rgba(255,255,255,0.8)';
	c.fillRect(k.x + 3, y - 4, 4, 5);
}

function flag(c: Ctx, x: number, got: boolean, t: number, fy = FLOOR) {
	c.save();
	c.translate(0, fy - FLOOR);
	c.fillStyle = '#9aa3a9';
	c.fillRect(x - 1.5, FLOOR - 80, 3, 80);
	c.fillStyle = got ? '#3bff6a' : '#6a7378';
	c.beginPath();
	const wave = Math.sin(t * 4) * 3;
	c.moveTo(x + 1.5, FLOOR - 80);
	c.quadraticCurveTo(x + 14, FLOOR - 76 + wave, x + 28, FLOOR - 72);
	c.lineTo(x + 1.5, FLOOR - 62);
	c.fill();
	c.restore();
}

function exitDoor(c: Ctx, x: number, t: number, ey = FLOOR) {
	c.save();
	c.translate(0, ey - FLOOR);
	c.fillStyle = '#0c1a10';
	c.fillRect(x - 6, FLOOR - 120, 60, 120);
	const g = c.createLinearGradient(x, FLOOR - 120, x, FLOOR);
	g.addColorStop(0, 'rgba(80,255,120,0.15)');
	g.addColorStop(1, 'rgba(80,255,120,0.55)');
	c.fillStyle = g;
	c.fillRect(x, FLOOR - 112, 48, 112);
	c.save();
	c.shadowColor = '#3bff6a';
	c.shadowBlur = 12 + Math.sin(t * 4) * 5;
	c.fillStyle = '#3bff6a';
	c.font = '800 16px Bahnschrift, Arial Black, sans-serif';
	c.textAlign = 'center';
	c.fillText('EXIT', x + 24, FLOOR - 128);
	c.restore();
	c.strokeStyle = '#3bff6a';
	c.lineWidth = 2;
	c.strokeRect(x - 6, FLOOR - 120, 60, 120);
	// a big arrow
	c.fillStyle = 'rgba(59,255,106,' + (0.5 + Math.sin(t * 5) * 0.4) + ')';
	const ax = x - 40 + Math.sin(t * 5) * 4;
	c.beginPath();
	c.moveTo(ax + 18, FLOOR - 60);
	c.lineTo(ax, FLOOR - 72);
	c.lineTo(ax, FLOOR - 48);
	c.closePath();
	c.fill();
	c.restore();
}

/** a secret entrance (levels.ts `secret`): an open vent in the wall over a high ledge, a faint gold glow inside */
function secretVent(c: Ctx, x: number, y: number, t: number) {
	c.save();
	const g = c.createRadialGradient(x, y - 22, 2, x, y - 22, 46);
	g.addColorStop(0, `rgba(255,207,64,${0.3 + Math.sin(t * 2.4) * 0.12})`);
	g.addColorStop(1, 'rgba(255,207,64,0)');
	c.fillStyle = g;
	c.fillRect(x - 48, y - 70, 96, 70);
	// the hole and its frame
	c.fillStyle = '#07080a';
	c.fillRect(x - 20, y - 40, 40, 40);
	c.strokeStyle = '#5a5f66';
	c.lineWidth = 3;
	c.strokeRect(x - 20, y - 40, 40, 40);
	// the grille, kicked loose and hanging off one screw
	c.translate(x - 20, y - 40);
	c.rotate(0.5);
	c.fillStyle = '#4a4f56';
	c.fillRect(0, 0, 38, 6);
	c.fillStyle = '#2a2d32';
	for (let i = 4; i < 36; i += 6) c.fillRect(i, 1, 3, 4);
	c.restore();
	// something shiny deep inside
	c.fillStyle = `rgba(255,226,138,${0.55 + Math.sin(t * 5) * 0.35})`;
	c.fillRect(x - 2, y - 22, 4, 4);
}

// ---------- chapter 2 pieces ----------

function moverDeco(c: Ctx, m: Platform, t: number) {
	// hazard stripes on its edge + lights so you can tell it moves
	c.save();
	c.beginPath();
	c.rect(m.x, m.y - 3, m.w, 4);
	c.clip();
	for (let x = m.x - 10; x < m.x + m.w; x += 10) {
		c.fillStyle = (x / 10) % 2 ? '#ffcc22' : '#1a1a1a';
		c.fillRect(x, m.y - 3, 10, 4);
	}
	c.restore();
	const on = Math.sin(t * 6) > 0;
	c.fillStyle = on ? '#3bff6a' : '#1a5a2a';
	c.fillRect(m.x + 3, m.y + 6, 4, 4);
	c.fillRect(m.x + m.w - 7, m.y + 6, 4, 4);
}

function pad(c: Ctx, x: number, y: number, t: number) {
	c.fillStyle = '#20262c';
	c.fillRect(x, y - 8, PAD_W, 8);
	c.strokeStyle = '#9aa3a9';
	c.lineWidth = 2;
	c.beginPath();
	for (let i = 0; i < 4; i++) {
		c.moveTo(x + 8 + i * 9, y - 8);
		c.lineTo(x + 12 + i * 9, y - 12);
	}
	c.stroke();
	c.save();
	c.shadowColor = '#3be8ff';
	c.shadowBlur = 10 + Math.sin(t * 6) * 4;
	c.fillStyle = '#3be8ff';
	c.fillRect(x - 2, y - 15, PAD_W + 4, 4);
	c.restore();
	// chevrons pulsing upwards
	for (let i = 0; i < 3; i++) {
		const k = (t * 1.6 + i / 3) % 1;
		c.strokeStyle = `rgba(59,232,255,${0.7 * (1 - k)})`;
		c.lineWidth = 2;
		const cy = y - 22 - k * 40;
		c.beginPath();
		c.moveTo(x + PAD_W / 2 - 9, cy + 6);
		c.lineTo(x + PAD_W / 2, cy);
		c.lineTo(x + PAD_W / 2 + 9, cy + 6);
		c.stroke();
	}
}

function spikes(c: Ctx, x: number, w: number, y: number) {
	const n = Math.max(1, Math.round(w / 12));
	const sw = w / n;
	for (let i = 0; i < n; i++) {
		const x0 = x + i * sw;
		const g = c.createLinearGradient(x0, 0, x0 + sw, 0);
		g.addColorStop(0, '#5a6066');
		g.addColorStop(0.5, '#c8ced4');
		g.addColorStop(1, '#4a5056');
		c.fillStyle = g;
		c.beginPath();
		c.moveTo(x0, y);
		c.lineTo(x0 + sw / 2, y - SPIKE_H);
		c.lineTo(x0 + sw, y);
		c.fill();
		c.fillStyle = '#c8161e';
		c.beginPath();
		c.moveTo(x0 + sw / 2 - 2, y - SPIKE_H + 4);
		c.lineTo(x0 + sw / 2, y - SPIKE_H);
		c.lineTo(x0 + sw / 2 + 2, y - SPIKE_H + 4);
		c.fill();
	}
	c.fillStyle = '#2a2e32';
	c.fillRect(x, y - 2, w, 2);
}

function sludge(c: Ctx, y: number, x0: number, x1: number, t: number) {
	const g = c.createLinearGradient(0, y - 30, 0, y + 260);
	g.addColorStop(0, 'rgba(120,255,80,0)');
	g.addColorStop(0.12, 'rgba(120,255,80,0.35)');
	g.addColorStop(0.2, '#4ad62a');
	g.addColorStop(1, '#0c3a08');
	c.fillStyle = g;
	c.beginPath();
	c.moveTo(x0, y + 400);
	for (let x = x0; x <= x1 + 20; x += 20) c.lineTo(x, y + Math.sin(x * 0.03 + t * 3) * 5 + Math.sin(x * 0.011 - t * 2) * 4);
	c.lineTo(x1 + 20, y + 400);
	c.closePath();
	c.fill();
	c.fillStyle = 'rgba(200,255,160,0.7)';
	for (let i = 0; i < 14; i++) {
		const bx = x0 + ((i * 97.3 + t * 20 * (1 + (i % 3))) % (x1 - x0 + 40));
		const by = y + 14 + ((i * 37 + t * 30) % 60);
		c.beginPath();
		c.arc(bx, by, 1.5 + (i % 3), 0, Math.PI * 2);
		c.fill();
	}
}

/** a throwing knife, pointing along +x, centred on its balance point */
function knife(c: Ctx) {
	c.fillStyle = '#1c1d20';
	c.fillRect(-10, -1.8, 8, 3.6);
	c.fillStyle = '#6b5a3a';
	c.fillRect(-9, -0.6, 6, 1.2);
	c.fillStyle = '#9aa1a8';
	c.fillRect(-2.5, -3, 1.6, 6);
	const bl = c.createLinearGradient(0, -2.4, 0, 2.4);
	bl.addColorStop(0, '#f2f5f8');
	bl.addColorStop(1, '#8c949c');
	c.fillStyle = bl;
	c.beginPath();
	c.moveTo(-1, -2.2);
	c.lineTo(9, -1.2);
	c.lineTo(12, 0.4);
	c.lineTo(-1, 2.2);
	c.closePath();
	c.fill();
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
	c.setTransform(s, 0, 0, s, -cx * s, -cy * s);
	for (let tx = Math.floor(cx / W) * W; tx < cx + VW; tx += W) c.drawImage(bg, tx, 0, W, H);
	// tall levels: the arena's tile keeps going up to the world's top
	const up = g.top < 0 && cy < 40 ? upperTile(g.arena.id, s) : null;
	if (up)
		for (let ty = 40 - UH; ty + UH > Math.max(cy, g.top - UH); ty -= UH)
			for (let tx = Math.floor(cx / W) * W; tx < cx + VW; tx += W) c.drawImage(up, tx, ty, W, UH);
	const L = g.level;
	const inView = (x0: number, x1: number) => x1 > cx - 40 && x0 < cx + VW + 40;
	// pits: the gaps between ground segments (and before / after them)
	let gx = 0;
	for (const [a, b] of [...L.ground].sort((p, q) => p[0] - q[0])) {
		if (a > gx && inView(gx, a)) pit(c, gx, a);
		gx = Math.max(gx, b);
	}
	if (gx < g.w && inView(gx, g.w)) pit(c, gx, g.w + 60);
	for (const p of L.platforms) if (inView(p.x, p.x + p.w)) platform(c, g.arena.id, p);
	for (const m of g.movers)
		if (inView(m.x, m.x + m.w)) {
			platform(c, g.arena.id, m);
			moverDeco(c, m, g.t);
		}
	for (const pd of L.pads ?? []) if (inView(pd.x, pd.x + PAD_W)) pad(c, pd.x, pd.y ?? FLOOR, g.t);
	for (const sp of L.spikes ?? []) if (inView(sp.x, sp.x + sp.w)) spikes(c, sp.x, sp.w, sp.y ?? FLOOR);
	for (let i = 0; i < g.cps.length; i++) if (inView(g.cps[i].x - 10, g.cps[i].x + 40)) flag(c, g.cps[i].x, g.checkpoint > i, g.t, g.cps[i].y);
	if (inView(L.exit - 50, L.exit + 60)) exitDoor(c, L.exit, g.t, L.exitY ?? FLOOR);
	if (L.secret && inView(L.secret.x - 40, L.secret.x + 40)) secretVent(c, L.secret.x, L.secret.y, g.t);
	for (const l of g.lasers) if (inView(l.x - 10, l.x + 10)) laser(c, l, g.t);
	for (const b of g.blocks) {
		if (b.gone || !inView(b.x, b.x + b.w)) continue;
		if (b.kind === 'door') door(c, b, g.t);
		else if (b.kind === 'cracked') cracked(c, b);
		else wallBlock(c, g.arena.id, b);
	}
	for (const sw of g.switches) if (inView(sw.x - 12, sw.x + 12)) switchBox(c, sw, g.t);
	for (const k of g.crates) if (!k.gone && inView(k.x, k.x + k.w)) crate(c, k);
	for (const b of g.barrels) if (b.alive && inView(b.x - 12, b.x + 12)) barrel(c, b.x, b.y, g.t, b.fuse);
	for (const k of g.keys) if (!k.taken && inView(k.x - 12, k.x + 12)) keyCard(c, k, g.t);
	void CEIL;

	for (const sp of g.splats) {
		c.fillStyle = `rgba(200,22,30,${sp.a})`;
		c.beginPath();
		c.ellipse(sp.x, sp.y - 0.5, sp.r, sp.r * 0.35, 0, 0, Math.PI * 2);
		c.fill();
	}
	for (const k of g.corpses) drawCorpse(c, k, v.op);
	for (const k of g.pickups) if (k.heal > 0) burger(c, k.x, k.y, g.t);
	for (const k of g.pickups) if (k.cash && inView(k.x - 14, k.x + 14)) cashBundle(c, k.x, k.y, g.t, k.spin, k.onGround, k.life);
	for (const k of g.pickups) {
		if (!k.knife || !inView(k.x - 20, k.x + 20)) continue;
		c.save();
		c.translate(k.x, k.y);
		// stuck in a wall / the floor at the angle it hit; loose ones spin, then lie flat
		c.rotate(k.onGround ? (k.ang ?? 0) : g.t * k.spin);
		if (k.onGround && k.ang) c.translate(-6, 0);
		c.shadowColor = 'rgba(255,255,255,0.7)';
		c.shadowBlur = 4 + Math.sin(g.t * 5) * 3;
		knife(c);
		c.restore();
	}

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
		let gy = L.ground.some(([a, b]) => x >= a && x <= b) ? FLOOR : H + 200;
		for (const pl of g.plats) if (x > pl.x && x < pl.x + pl.w && pl.y >= y - 1 && pl.y < gy) gy = pl.y;
		for (const sd of g.solids()) if (x > sd.x && x < sd.x + sd.w && sd.y >= y - 1 && sd.y < gy) gy = sd.y;
		return gy;
	};
	for (const f of [...g.enemies, ...(g.player.hp > 0 ? [g.player] : [])]) {
		const gy = groundUnder(f.x, f.y);
		if (gy < H && gy - f.y < 400) contactShadow(c, f.x, gy, f.scale, gy - f.y);
	}
	for (const e of g.enemies) drawEnemy(c, e, g.t);
	if (g.player.hp > 0) drawPlayer(c, g.player, v.op, g.t, v.gun ?? null);

	if (g.flood < Infinity && g.flood < cy + VH + 40) sludge(c, g.flood, cx - 20, cx + VW + 20, g.t);

	// who hasn't seen you yet: a "?" that fills up while they're seeing you; who you can take down
	const td = g.canTakedown();
	c.textAlign = 'center';
	for (const e of g.enemies) {
		if (!e.asleep || !inView(e.x - 20, e.x + 20)) continue;
		const hx = e.x, hy = e.y - 120 * e.scale;
		if (e === td) {
			c.font = '800 9px Bahnschrift, Arial Black, sans-serif';
			c.fillStyle = `rgba(190,140,255,${0.75 + Math.sin(g.t * 8) * 0.25})`;
			c.strokeStyle = 'rgba(0,0,0,0.75)';
			c.lineWidth = 3;
			c.strokeText('CLICK: TAKEDOWN', hx, hy - 4);
			c.fillText('CLICK: TAKEDOWN', hx, hy - 4);
			continue;
		}
		if (e.spot <= 0.02) continue;
		c.font = '800 15px Bahnschrift, Arial Black, sans-serif';
		c.lineWidth = 3;
		c.strokeStyle = 'rgba(0,0,0,0.8)';
		c.strokeText('?', hx, hy);
		c.fillStyle = 'rgba(255,255,255,0.35)';
		c.fillText('?', hx, hy);
		// the meter: the ? fills from the bottom in yellow → red
		c.save();
		c.beginPath();
		c.rect(hx - 8, hy - 12 * e.spot + 1, 16, 14);
		c.clip();
		c.fillStyle = e.spot > 0.7 ? '#ff4a30' : '#ffd23a';
		c.fillText('?', hx, hy);
		c.restore();
	}

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
		} else if (b.kind === 'knife') {
			c.save();
			c.translate(b.x, b.y);
			c.rotate(g.t * (b.spin ?? 20));
			c.scale(1.15, 1.15);
			knife(c);
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
		} else if (q.kind === 'ring') {
			// a double jump / slam shockwave ring
			const r = q.r + (1 - k) * q.r * 2.2;
			c.strokeStyle = `rgba(220,240,255,${0.7 * k})`;
			c.lineWidth = 2.5 * k + 0.5;
			c.beginPath();
			c.ellipse(q.x, q.y, r, r * 0.28, 0, 0, Math.PI * 2);
			c.stroke();
		} else if (q.kind === 'ghost') {
			// a dash afterimage: the player's own figure, faded and tinted
			c.save();
			c.globalAlpha = 0.35 * k;
			paintFigure(c, LOOKS[v.op] ?? LOOKS.abscar, q.x, q.y, 1, poseOf(g.player, g.t), 7, null);
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
		c.font = big ? '800 44px Bahnschrift, Arial Black, sans-serif' : `800 ${u.screen ? 18 : u.tone === 'alert' ? 20 : u.tone === 'head' || u.tone === 'stealth' ? 13 : 11}px Bahnschrift, Arial Black, sans-serif`;
		c.fillStyle =
			u.tone === 'head' || u.tone === 'alert' ? `rgba(255,70,50,${a})` : u.tone === 'stealth' ? `rgba(190,140,255,${a})` : u.tone === 'combo' ? `rgba(255,214,60,${a})` : u.tone === 'heal' ? `rgba(110,255,120,${a})` : u.tone === 'cash' ? `rgba(255,214,80,${a})` : u.tone === 'gun' ? `rgba(160,220,255,${a})` : `rgba(255,255,255,${a})`;
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
		const dx2 = cx + ((((i * 137.5 + g.t * (6 + (i % 5))) % VW) + VW) % VW);
		const dy2 = g.top < 0 ? cy + 10 + ((i * 89.3 + Math.sin(g.t * 0.6 + i) * 14) % (VH - 20)) : 60 + ((i * 89.3 + Math.sin(g.t * 0.6 + i) * 14) % (FLOOR - 80));
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
