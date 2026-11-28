/**
 * Draws the Abscars Madness headquarters (hq.ts) on a canvas. Our own simple drawings: a night-time underground base,
 * two floors of three rooms, ladders, ledges, one station per room, and your operator painted like in the game.
 */
import { CEILS, FLOORS, HQ_W, LADDERS, LEDGES, ROOMS, ROOM_W, SECRET_LEDGE, type Hq, type Room, type RoomId } from './hq.ts';
import type { GunKind } from './guns.ts';
import { paintFigure, type GunPic, type Look } from './painter.ts';

type Ctx = CanvasRenderingContext2D;

export interface HqDrawOpts {
	/** canvas pixels per world unit */
	scale: number;
	pw: number;
	ph: number;
	cam: { x: number; y: number };
	look: Look;
	gun: GunPic | null;
	gunKind: GunKind | null;
	near: Room | null;
	/** rooms seen (unseen ones are drawn darker, like a Metroidvania map) */
	seen: Set<RoomId>;
	stats: { cleared: number; total: number; free: number; secret: boolean };
	reduce: boolean;
}

/** each room's wall colours: top, bottom, accent light */
const TONE: Record<RoomId, [string, string, string]> = {
	locker: ['#1d2420', '#121713', '#9dff2e'],
	war: ['#1a2219', '#0f140f', '#5dff7a'],
	heli: ['#0a1022', '#1a2240', '#ffb43a'],
	armory: ['#24201a', '#15120e', '#ff8a2a'],
	lab: ['#132225', '#0b1517', '#37e6d0'],
	comms: ['#1b1a26', '#111018', '#7a8cff']
};

const STARS = Array.from({ length: 46 }, (_, i) => {
	const r = Math.sin(i * 91.7) * 43758.5453;
	const s = Math.sin(i * 12.9) * 15731.743;
	return { x: 962 + (r - Math.floor(r)) * 476, y: 24 + (s - Math.floor(s)) * 150, k: (i % 5) / 5 };
});

export function drawHq(c: Ctx, hq: Hq, o: HqDrawOpts) {
	const t = o.reduce ? 0 : hq.t;
	c.setTransform(1, 0, 0, 1, 0, 0);
	c.fillStyle = '#050605';
	c.fillRect(0, 0, o.pw, o.ph);
	c.setTransform(o.scale, 0, 0, o.scale, -o.cam.x * o.scale, -o.cam.y * o.scale);

	for (const r of ROOMS) room(c, r, t, o);
	structure(c);
	for (const lx of LADDERS) ladder(c, lx);
	LEDGES.forEach((l, i) => ledge(c, l.x, l.y, l.w, i === SECRET_LEDGE));
	for (const r of ROOMS) {
		station(c, r, t, o);
		if (!o.seen.has(r.id)) {
			c.fillStyle = 'rgba(0,0,0,0.55)';
			c.fillRect(r.x0, CEILS[r.floor], ROOM_W, FLOORS[r.floor] - CEILS[r.floor]);
		}
	}

	// you
	const p = hq.p;
	const sh = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
	sh.addColorStop(0, 'rgba(0,0,0,0.5)');
	sh.addColorStop(1, 'rgba(0,0,0,0)');
	c.fillStyle = sh;
	c.fillRect(p.x - 20, p.y - 4, 40, 8);
	const aim = p.climbing !== null ? -1.2 : 0.55;
	paintFigure(
		c,
		o.look,
		p.x,
		p.y,
		1,
		{ facing: p.facing, aim: p.facing > 0 ? aim : Math.PI - aim, walk: p.walk, onGround: p.onGround || p.climbing !== null, vx: p.climbing !== null ? 60 : p.vx, recoil: 0, gun: o.gunKind, punch: 0, t: hq.t },
		7,
		o.gun
	);
}

function room(c: Ctx, r: Room, t: number, o: HqDrawOpts) {
	const top = CEILS[r.floor];
	const bot = FLOORS[r.floor];
	const [a, b, acc] = TONE[r.id];
	const g = c.createLinearGradient(0, top, 0, bot);
	g.addColorStop(0, a);
	g.addColorStop(1, b);
	c.fillStyle = g;
	c.fillRect(r.x0, top, ROOM_W, bot - top);

	if (r.id === 'heli') {
		// open sky over the pad
		for (const s of STARS) {
			c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + s.k * 6));
			c.fillStyle = '#fff';
			c.fillRect(s.x, s.y, 1.3, 1.3);
		}
		c.globalAlpha = 1;
		c.fillStyle = '#d8dce8';
		c.beginPath();
		c.arc(1390, 60, 14, 0, Math.PI * 2);
		c.fill();
		c.fillStyle = TONE.heli[0];
		c.beginPath();
		c.arc(1384, 55, 12, 0, Math.PI * 2);
		c.fill();
		// city skyline far away
		c.fillStyle = '#0b0f1c';
		for (let x = 962; x < 1440; x += 22) {
			const h = 30 + ((x * 7) % 40);
			c.fillRect(x, bot - h, 18, h);
		}
	} else {
		// wall panels + a lamp with its light cone
		c.strokeStyle = 'rgba(255,255,255,0.05)';
		c.lineWidth = 1;
		for (let x = r.x0 + 40; x < r.x1; x += 60) {
			c.beginPath();
			c.moveTo(x, top + 4);
			c.lineTo(x, bot);
			c.stroke();
		}
		c.fillStyle = 'rgba(0,0,0,0.25)';
		c.fillRect(r.x0, bot - 26, ROOM_W, 26);
		const lx = r.x0 + ROOM_W / 2;
		const cone = c.createLinearGradient(0, top, 0, bot);
		cone.addColorStop(0, hexA(acc, 0.16));
		cone.addColorStop(1, hexA(acc, 0));
		c.fillStyle = cone;
		c.beginPath();
		c.moveTo(lx - 16, top + 8);
		c.lineTo(lx + 16, top + 8);
		c.lineTo(lx + 150, bot);
		c.lineTo(lx - 150, bot);
		c.fill();
		c.fillStyle = '#2a2f2b';
		c.fillRect(lx - 18, top, 36, 7);
		c.fillStyle = acc;
		c.fillRect(lx - 14, top + 6, 28, 2.5);
	}
	props(c, r, t, o);
}

function props(c: Ctx, r: Room, t: number, o: HqDrawOpts) {
	const bot = FLOORS[r.floor];
	if (r.id === 'locker') {
		// bunk bed
		c.fillStyle = '#3a3226';
		c.fillRect(34, 150, 5, bot - 150);
		c.fillRect(121, 150, 5, bot - 150);
		c.fillStyle = '#4c5a3a';
		c.fillRect(34, 196, 92, 8);
		c.fillRect(34, 236, 92, 8);
		c.fillStyle = '#d8d3c0';
		c.fillRect(38, 190, 22, 7);
		c.fillRect(38, 230, 22, 7);
		// lockers
		for (let i = 0; i < 4; i++) {
			const x = 250 + i * 34;
			c.fillStyle = i === 1 ? '#3c4a3e' : '#2f3a32';
			c.fillRect(x, 136, 30, bot - 136);
			c.fillStyle = 'rgba(0,0,0,0.4)';
			for (let v = 0; v < 4; v++) c.fillRect(x + 7, 146 + v * 5, 16, 2);
			c.fillStyle = '#9aa69c';
			c.fillRect(x + 24, 190, 2, 12);
		}
		// a poster
		c.fillStyle = '#5a1a14';
		c.fillRect(150, 70, 46, 60);
		c.fillStyle = '#ff6a1a';
		c.font = 'bold 9px sans-serif';
		c.fillText('GRIND', 155, 92);
		c.fillText('MORE', 158, 106);
	} else if (r.id === 'war') {
		// wall screens: the campaign so far
		for (let i = 0; i < 3; i++) {
			const x = 640 + i * 64;
			c.fillStyle = '#0a0f0a';
			c.fillRect(x, 60, 56, 38);
			c.strokeStyle = '#2c3a2c';
			c.strokeRect(x, 60, 56, 38);
		}
		c.fillStyle = '#5dff7a';
		const share = o.stats.total ? o.stats.cleared / o.stats.total : 0;
		c.fillRect(646, 86, 44 * share, 5);
		c.font = '8px monospace';
		c.fillText(`${o.stats.cleared}/${o.stats.total}`, 648, 76);
		for (let i = 0; i < 6; i++) c.fillRect(712 + i * 7, 92 - ((i * 13 + Math.floor(t * 3)) % 20), 4, ((i * 13 + Math.floor(t * 3)) % 20) + 2);
		c.fillStyle = '#ff3b2f';
		c.beginPath();
		c.arc(800, 79, 6 + Math.sin(t * 3) * 1.5, 0, Math.PI * 2);
		c.fill();
		// the vent high on the wall (the secret)
		c.fillStyle = '#20281f';
		c.fillRect(884, 96, 56, 40);
		c.fillStyle = o.stats.secret ? '#151a14' : '#3b4a3a';
		if (!o.stats.secret) for (let v = 0; v < 5; v++) c.fillRect(888, 100 + v * 7, 48, 3);
		else {
			c.fillStyle = '#ffcf40';
			c.fillRect(902, 120, 22, 6);
			c.fillStyle = '#fff2b0';
			c.fillRect(922, 120, 4, 6);
		}
	} else if (r.id === 'heli') {
		// pad
		c.fillStyle = '#20263a';
		c.fillRect(1150, bot - 6, 200, 6);
		c.fillStyle = '#ffd23b';
		c.font = 'bold 12px sans-serif';
		c.fillText('H', 1244, bot - 1);
		// windsock
		c.fillStyle = '#8a8f9a';
		c.fillRect(1400, bot - 70, 3, 70);
		c.fillStyle = '#ff6a1a';
		c.beginPath();
		const sw = Math.sin(t * 2) * 4;
		c.moveTo(1403, bot - 70);
		c.lineTo(1430, bot - 66 + sw);
		c.lineTo(1430, bot - 58 + sw);
		c.lineTo(1403, bot - 60);
		c.fill();
	} else if (r.id === 'armory') {
		// gun racks
		for (let row = 0; row < 3; row++) {
			const y = 330 + row * 34;
			c.fillStyle = '#3a2e22';
			c.fillRect(40, y + 14, 140, 4);
			for (let i = 0; i < 4; i++) {
				c.fillStyle = '#16181a';
				c.fillRect(48 + i * 34, y, 26, 7);
				c.fillRect(48 + i * 34 + 18, y - 3, 12, 3);
				c.fillRect(48 + i * 34 + 4, y + 7, 5, 8);
			}
		}
		// crates
		c.fillStyle = '#4a3e26';
		c.fillRect(290, 452, 74, 48);
		c.strokeStyle = '#2a2214';
		c.strokeRect(292, 454, 70, 44);
		c.fillStyle = '#ffcf40';
		c.font = 'bold 8px sans-serif';
		c.fillText('AMMO', 312, 480);
	} else if (r.id === 'lab') {
		// screen: skill points
		c.fillStyle = '#081416';
		c.fillRect(560, 320, 70, 44);
		c.fillStyle = '#37e6d0';
		c.font = '8px monospace';
		c.fillText('SKILL PTS', 566, 334);
		c.font = 'bold 16px monospace';
		c.fillText(String(o.stats.free), 580, 356);
	} else if (r.id === 'comms') {
		// server rack
		c.fillStyle = '#16151e';
		c.fillRect(1330, 448, 70, 52);
		for (let i = 0; i < 6; i++) {
			c.fillStyle = Math.sin(t * 5 + i * 1.7) > 0 ? '#5dff7a' : '#1d3a24';
			c.fillRect(1338 + (i % 3) * 20, 456 + Math.floor(i / 3) * 16, 4, 3);
		}
		// a dish poster
		c.strokeStyle = '#7a8cff';
		c.lineWidth = 2;
		c.beginPath();
		c.arc(1060, 360, 20, Math.PI * 0.9, Math.PI * 1.9);
		c.stroke();
		c.lineWidth = 1;
	}
}

function station(c: Ctx, r: Room, t: number, o: HqDrawOpts) {
	if (!r.station) return;
	const x = r.sx;
	const bot = FLOORS[r.floor];
	const on = o.near?.id === r.id;
	const acc = TONE[r.id][2];
	if (on) {
		const g = c.createRadialGradient(x, bot - 40, 0, x, bot - 40, 70);
		g.addColorStop(0, hexA(acc, 0.25));
		g.addColorStop(1, hexA(acc, 0));
		c.fillStyle = g;
		c.fillRect(x - 70, bot - 110, 140, 110);
	}
	switch (r.station) {
		case 'operator': {
			// the open locker with a spare suit
			c.fillStyle = '#4a5a4c';
			c.fillRect(x - 22, bot - 114, 44, 114);
			c.fillStyle = '#0d110e';
			c.fillRect(x - 18, bot - 108, 36, 104);
			c.fillStyle = o.look.top;
			c.fillRect(x - 12, bot - 96, 24, 34);
			c.fillStyle = o.look.accent;
			c.fillRect(x - 4, bot - 92, 8, 4);
			c.fillStyle = '#4a5a4c';
			c.save();
			c.translate(x + 22, bot - 114);
			c.transform(1, 0.2, 0, 1, 0, 0);
			c.fillRect(0, 0, 14, 114);
			c.restore();
			break;
		}
		case 'levels': {
			// the mission table with a green holo map
			c.fillStyle = '#2e3a2e';
			c.fillRect(x - 70, bot - 44, 140, 8);
			c.fillStyle = '#1c241c';
			c.fillRect(x - 62, bot - 36, 8, 36);
			c.fillRect(x + 54, bot - 36, 8, 36);
			c.fillStyle = 'rgba(93,255,122,0.18)';
			c.beginPath();
			c.moveTo(x - 60, bot - 46);
			c.lineTo(x + 60, bot - 46);
			c.lineTo(x + 40, bot - 96);
			c.lineTo(x - 40, bot - 96);
			c.fill();
			c.strokeStyle = 'rgba(93,255,122,0.7)';
			c.beginPath();
			for (let i = 0; i < 5; i++) {
				const yy = bot - 52 - i * 9;
				c.moveTo(x - 54 + i * 4, yy);
				c.lineTo(x + 54 - i * 4, yy);
			}
			c.stroke();
			c.fillStyle = '#ff3b2f';
			const bx = x - 30 + ((t * 20) % 60);
			c.fillRect(bx, bot - 70, 4, 4);
			break;
		}
		case 'deploy': {
			// the helicopter, rotor turning
			c.fillStyle = '#2b3324';
			c.beginPath();
			c.ellipse(x, bot - 34, 54, 22, 0, 0, Math.PI * 2);
			c.fill();
			c.fillRect(x - 120, bot - 42, 80, 10);
			c.fillRect(x - 126, bot - 58, 10, 26);
			c.fillStyle = '#7fb8d8';
			c.beginPath();
			c.ellipse(x + 28, bot - 40, 18, 11, 0, 0, Math.PI * 2);
			c.fill();
			c.fillStyle = '#1a1e16';
			c.fillRect(x - 40, bot - 6, 90, 4);
			c.fillRect(x - 28, bot - 14, 4, 10);
			c.fillRect(x + 30, bot - 14, 4, 10);
			c.fillRect(x - 2, bot - 62, 4, 8);
			const w = 90 * Math.abs(Math.cos(t * 14));
			c.fillStyle = 'rgba(30,34,26,0.9)';
			c.fillRect(x - w, bot - 64, w * 2, 3);
			c.fillStyle = '#ffd23b';
			c.font = 'bold 10px sans-serif';
			c.fillText('DEPLOY', x - 20, bot - 80 + Math.sin(t * 3) * 2);
			break;
		}
		case 'gun': {
			// the bench with your starting gun on it
			c.fillStyle = '#3a2e22';
			c.fillRect(x - 50, bot - 40, 100, 8);
			c.fillRect(x - 44, bot - 32, 6, 32);
			c.fillRect(x + 38, bot - 32, 6, 32);
			if (o.gun) c.drawImage(o.gun.img, x - o.gun.w / 2, bot - 40 - o.gun.h, o.gun.w, o.gun.h);
			break;
		}
		case 'skills': {
			// the augment tube
			c.fillStyle = '#1d2a2c';
			c.fillRect(x - 32, bot - 12, 64, 12);
			c.fillRect(x - 32, bot - 150, 64, 10);
			c.fillStyle = 'rgba(55,230,208,0.22)';
			c.fillRect(x - 26, bot - 140, 52, 128);
			for (let i = 0; i < 7; i++) {
				const yy = bot - 14 - ((t * 30 + i * 19) % 124);
				c.fillStyle = 'rgba(200,255,250,0.6)';
				c.beginPath();
				c.arc(x - 18 + ((i * 11) % 36), yy, 2, 0, Math.PI * 2);
				c.fill();
			}
			c.strokeStyle = 'rgba(200,255,250,0.45)';
			c.strokeRect(x - 26, bot - 140, 52, 128);
			break;
		}
		case 'settings': {
			// the desk with screens
			c.fillStyle = '#26243a';
			c.fillRect(x - 60, bot - 40, 120, 8);
			c.fillRect(x - 54, bot - 32, 6, 32);
			c.fillRect(x + 48, bot - 32, 6, 32);
			for (let i = 0; i < 3; i++) {
				c.fillStyle = '#0a0a14';
				c.fillRect(x - 54 + i * 38, bot - 78, 32, 26);
				c.fillStyle = '#7a8cff';
				c.fillRect(x - 50 + i * 38, bot - 72, 12 + ((i * 7 + Math.floor(t * 2)) % 14), 2);
				c.fillRect(x - 50 + i * 38, bot - 66, 18, 2);
			}
			c.fillStyle = '#7a8cff';
			c.font = 'bold 9px sans-serif';
			c.fillText('⚙', x - 4, bot - 84);
			break;
		}
	}
	if (on) {
		// a bouncing arrow over the station
		const y = bot - 132 + Math.sin(t * 5) * 3;
		c.fillStyle = acc;
		c.beginPath();
		c.moveTo(x - 7, y);
		c.lineTo(x + 7, y);
		c.lineTo(x, y + 8);
		c.fill();
	}
}

function structure(c: Ctx) {
	// ceiling, the slab between the floors, the ground
	const slab = (y0: number, y1: number) => {
		c.fillStyle = '#2a2c28';
		c.fillRect(0, y0, HQ_W, y1 - y0);
		c.fillStyle = '#3b3e38';
		c.fillRect(0, y0, HQ_W, 3);
		c.strokeStyle = 'rgba(0,0,0,0.35)';
		for (let x = 0; x < HQ_W; x += 40) {
			c.beginPath();
			c.moveTo(x, y0 + 3);
			c.lineTo(x + 20, y1);
			c.stroke();
		}
	};
	c.fillStyle = '#1b1c1a';
	c.fillRect(0, -40, 960, CEILS[0] + 40);
	slab(FLOORS[0], CEILS[1]);
	slab(FLOORS[1], FLOORS[1] + 60);
	// walls between rooms, each with a door
	for (const f of [0, 1] as const)
		for (const wx of [ROOM_W, ROOM_W * 2]) {
			const top = CEILS[f];
			const bot = FLOORS[f];
			const doorTop = bot - 124;
			c.fillStyle = '#20231f';
			c.fillRect(wx - 7, top, 14, doorTop - top);
			c.fillStyle = '#3a3e37';
			c.fillRect(wx - 9, doorTop - 4, 18, 5);
			c.fillRect(wx - 9, doorTop, 3, bot - doorTop);
			c.fillRect(wx + 6, doorTop, 3, bot - doorTop);
			c.fillStyle = '#9dff2e';
			c.fillRect(wx - 4, doorTop - 12, 8, 4);
		}
	// the outer walls
	c.fillStyle = '#1b1c1a';
	c.fillRect(-60, -40, 64, 640);
	c.fillRect(HQ_W - 4, CEILS[1] - 32, 64, 400);
}

function ladder(c: Ctx, lx: number) {
	const top = FLOORS[0] - 34;
	const bot = FLOORS[1];
	c.fillStyle = '#0c0d0b';
	c.fillRect(lx - 15, FLOORS[0], 30, CEILS[1] - FLOORS[0]);
	c.fillStyle = '#8a8f86';
	c.fillRect(lx - 12, top, 3, bot - top);
	c.fillRect(lx + 9, top, 3, bot - top);
	c.fillStyle = '#6b7067';
	for (let y = top + 6; y < bot; y += 14) c.fillRect(lx - 10, y, 20, 2.5);
	c.fillStyle = '#ffd23b';
	c.fillRect(lx - 15, FLOORS[0] - 2, 30, 2);
}

function ledge(c: Ctx, x: number, y: number, w: number, secret: boolean) {
	c.fillStyle = secret ? '#2e3a2c' : '#3f453c';
	c.fillRect(x, y, w, 5);
	c.fillStyle = 'rgba(0,0,0,0.4)';
	for (let i = x + 3; i < x + w - 2; i += 6) c.fillRect(i, y + 1, 3, 3);
	if (!secret) {
		c.fillStyle = '#2b2f29';
		c.fillRect(x + 4, y + 5, 3, 10);
		c.fillRect(x + w - 7, y + 5, 3, 10);
	}
}

function hexA(hex: string, a: number) {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
