/**
 * Squad Mayhem (2026-11-22, the user: "a game connected to my camo grinder, operators playing as themselves"):
 * our own side-view arena brawler-shooter. You run, jump, aim with the mouse, punch or shoot, take the guns
 * the enemies drop and throw empty ones at them, wave after wave. Pure game logic: no DOM, no drawing
 * (render.ts draws it, MayhemPage.svelte puts the operator's own emblem + camo'd gun on top).
 * Coordinates: a 960 × 540 world, y down, a fighter's `y` is where their feet are.
 */
import { gunOf, OUT_WEAPONS, STARTER, weaponsOfKind, type GunKind, type GunStats } from './guns.ts';

export const W = 960;
export const H = 540;
export const FLOOR = 500;
/** the camera shows this much of the world (zoomed in 1.5×, it follows the player) */
export const VW = 640;
export const VH = 360;
const GRAV = 2300;
const RUN = 290;
const JUMP = 830;

/** body proportions (from the feet up) */
export const BODY = { hip: 44, shoulder: 69, head: 82, headR: 8.5, half: 11, top: 91 } as const;

export interface Platform {
	x: number;
	y: number;
	w: number;
}
export interface Arena {
	id: 'office' | 'diner' | 'warehouse';
	platforms: Platform[];
}

export const ARENAS: Arena[] = [
	{ id: 'office', platforms: [{ x: 90, y: 372, w: 230 }, { x: 640, y: 372, w: 230 }, { x: 345, y: 250, w: 270 }] },
	{ id: 'diner', platforms: [{ x: 60, y: 382, w: 190 }, { x: 395, y: 362, w: 170 }, { x: 710, y: 382, w: 190 }, { x: 190, y: 250, w: 190 }, { x: 580, y: 250, w: 190 }] },
	{ id: 'warehouse', platforms: [{ x: 110, y: 398, w: 130 }, { x: 300, y: 300, w: 150 }, { x: 510, y: 300, w: 150 }, { x: 720, y: 398, w: 130 }, { x: 405, y: 182, w: 150 }] }
];

export type EnemyKind = 'random' | 'sweat' | 'shotty' | 'camper' | 'jugg';

export interface Held {
	id: string;
	ammo: number;
}

export interface Fighter {
	uid: number;
	player: boolean;
	kind: EnemyKind | 'player';
	tag: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	facing: 1 | -1;
	aim: number;
	hp: number;
	maxHp: number;
	held: Held | null;
	cool: number;
	onGround: boolean;
	drop: number;
	stun: number;
	hurt: number;
	punch: number;
	recoil: number;
	walk: number;
	entering: boolean;
	scale: number;
	// AI
	think: number;
	react: number;
	burst: number;
	rest: number;
	charge: number;
	err: number;
}

export interface Bullet {
	x: number;
	y: number;
	vx: number;
	vy: number;
	dmg: number;
	mine: boolean;
	life: number;
	pierce: number;
	hit: number[];
	kind: 'bullet' | 'rocket' | 'thrown';
	/** a thrown weapon: what lands afterwards */
	gun?: Held;
	spin?: number;
	from: number;
}

export interface Pickup {
	uid: number;
	x: number;
	y: number;
	vy: number;
	vx: number;
	gun: Held | null;
	/** a burger: heals */
	heal: number;
	life: number;
	spin: number;
	onGround: boolean;
}

export interface Corpse {
	f: Fighter;
	x: number;
	y: number;
	vx: number;
	vy: number;
	ang: number;
	spin: number;
	t: number;
	still: boolean;
}

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	max: number;
	kind: 'spark' | 'ketchup' | 'smoke' | 'shell' | 'flash' | 'boom';
	r: number;
}

export interface Splat {
	x: number;
	y: number;
	r: number;
	a: number;
}

export interface Popup {
	x: number;
	y: number;
	text: string;
	t: number;
	tone: 'kill' | 'head' | 'combo' | 'heal' | 'wave' | 'gun';
	/** drawn on the screen (centre), not in the world */
	screen?: boolean;
}

export type GameEvent =
	| { t: 'shot'; kind: GunKind; mine: boolean }
	| { t: 'hit'; head: boolean; mine: boolean }
	| { t: 'kill'; head: boolean }
	| { t: 'hurt' }
	| { t: 'boom' }
	| { t: 'punch' }
	| { t: 'throw' }
	| { t: 'pickup'; id: string | null }
	| { t: 'empty' }
	| { t: 'wave'; n: number }
	| { t: 'clear'; n: number }
	| { t: 'dead' };

export interface Input {
	left: boolean;
	right: boolean;
	jump: boolean;
	down: boolean;
	fire: boolean;
	pick: boolean;
	throw: boolean;
	holk: boolean;
	aimX: number;
	aimY: number;
}

export const NO_INPUT: Input = { left: false, right: false, jump: false, down: false, fire: false, pick: false, throw: false, holk: false, aimX: W, aimY: FLOOR - 60 };

/** A small seeded random (mulberry32), so tests can replay a run. */
export function rng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const ENEMY: Record<EnemyKind, { hp: number; speed: number; range: number; kinds: (GunKind | null)[]; dmg: number; scale: number; score: number }> = {
	random: { hp: 60, speed: 0.78, range: 240, kinds: [null, null, 'pistol', 'pistol', 'melee'], dmg: 0.22, scale: 1, score: 100 },
	sweat: { hp: 80, speed: 0.95, range: 300, kinds: ['smg', 'ar', 'ar', 'smg'], dmg: 0.22, scale: 1, score: 150 },
	shotty: { hp: 95, speed: 0.9, range: 130, kinds: ['shotgun'], dmg: 0.26, scale: 1, score: 175 },
	camper: { hp: 60, speed: 0.7, range: 520, kinds: ['sniper', 'marksman'], dmg: 0.3, scale: 1, score: 200 },
	jugg: { hp: 700, speed: 0.55, range: 300, kinds: ['lmg'], dmg: 0.2, scale: 1.3, score: 1500 }
};

const TAGS: Record<EnemyKind, string[]> = {
	random: ['Random#4521', 'xX_Random_Xx', 'noob_master', 'Random#0007', 'bot_frank', 'lagswitch', 'Random#1312', 'casual_carl'],
	sweat: ['TTV_sweatlord', 'tryhard_tim', 'meta_slave', 'sweaty_steve', 'YT_clipfarm', 'cracked_kev'],
	shotty: ['shotty_sam', 'corner_kid', 'doorway_dan', 'one_pump'],
	camper: ['camper_dad', 'bush_wookie', 'tent_tony', 'headglitch'],
	jugg: ['THE JUGGERNAUT', 'BIG RANDOM', 'MEGA SWEAT']
};

export interface Stats {
	kills: number;
	heads: number;
	shots: number;
	hits: number;
	bestCombo: number;
}

export class Mayhem {
	r: () => number;
	t = 0;
	uid = 1;
	wave = 0;
	arena: Arena = ARENAS[0];
	player: Fighter;
	enemies: Fighter[] = [];
	bullets: Bullet[] = [];
	pickups: Pickup[] = [];
	corpses: Corpse[] = [];
	parts: Particle[] = [];
	splats: Splat[] = [];
	popups: Popup[] = [];
	events: GameEvent[] = [];
	score = 0;
	combo = 0;
	comboT = 0;
	holk = 40;
	holkOn = false;
	shake = 0;
	/** the camera's top-left corner in the world */
	cam = { x: (W - VW) / 2, y: H - VH };
	toSpawn = 0;
	spawnT = 0;
	breakT = 2.2;
	over = false;
	overT = 0;
	stats: Stats = { kills: 0, heads: 0, shots: 0, hits: 0, bestCombo: 0 };
	#prev: Input = NO_INPUT;

	constructor(start: string = STARTER, seed = Date.now()) {
		this.r = rng(seed);
		const g = gunOf(start);
		this.player = this.#fighter(true, 'player', W / 2, FLOOR, g.kind === 'melee' ? { id: g.id, ammo: 0 } : { id: g.id, ammo: g.mag });
		this.player.hp = this.player.maxHp = 100;
		this.player.tag = '';
	}

	#fighter(player: boolean, kind: EnemyKind | 'player', x: number, y: number, held: Held | null): Fighter {
		return {
			uid: this.uid++,
			player,
			kind,
			tag: '',
			x,
			y,
			vx: 0,
			vy: 0,
			facing: 1,
			aim: 0,
			hp: 100,
			maxHp: 100,
			held,
			cool: 0,
			onGround: false,
			drop: 0,
			stun: 0,
			hurt: 0,
			punch: 0,
			recoil: 0,
			walk: 0,
			entering: false,
			scale: 1,
			think: 0,
			react: 0.6,
			burst: 0,
			rest: 0,
			charge: 0,
			err: 0
		};
	}

	/** How many enemies a wave sends, and how many can be on the map at once. */
	static waveSize(n: number) {
		return { total: Math.min(4 + n * 2, 26) + (n % 5 === 0 ? 1 : 0), alive: Math.min(3 + Math.floor(n / 2), 8) };
	}

	#pickKind(): EnemyKind {
		const n = this.wave;
		const pool: EnemyKind[] = ['random', 'random', 'random'];
		if (n >= 2) pool.push('sweat', 'sweat');
		if (n >= 3) pool.push('shotty');
		if (n >= 4) pool.push('camper');
		if (n >= 6) pool.push('sweat', 'shotty');
		if (n >= 8) pool.push('camper', 'sweat');
		return pool[Math.floor(this.r() * pool.length)];
	}

	#gunFor(kind: GunKind | null): Held | null {
		if (!kind) return null;
		const list = weaponsOfKind(kind);
		const w = list[Math.floor(this.r() * list.length)] ?? OUT_WEAPONS[0];
		const g = gunOf(w.id);
		return { id: w.id, ammo: g.mag };
	}

	#spawn(kind: EnemyKind) {
		const spec = ENEMY[kind];
		const fromTop = kind !== 'jugg' && this.r() < 0.3;
		const side = this.r() < 0.5 ? -1 : 1;
		const x = fromTop ? 80 + this.r() * (W - 160) : side < 0 ? -30 : W + 30;
		const y = fromTop ? -40 : FLOOR;
		const held = this.#gunFor(spec.kinds[Math.floor(this.r() * spec.kinds.length)]);
		const f = this.#fighter(false, kind, x, y, held);
		const boss = Math.floor(this.wave / 5);
		f.hp = f.maxHp = Math.round(spec.hp * (kind === 'jugg' ? 1 + (boss - 1) * 0.5 : 1 + this.wave * 0.03));
		f.entering = !fromTop;
		f.scale = spec.scale;
		f.facing = side < 0 ? 1 : -1;
		f.react = 0.5 + this.r() * 0.6 - Math.min(this.wave * 0.02, 0.25);
		f.err = 0.22;
		f.think = this.r() * 0.5;
		const tags = TAGS[kind];
		f.tag = tags[Math.floor(this.r() * tags.length)];
		this.enemies.push(f);
	}

	#startWave() {
		this.wave++;
		this.arena = ARENAS[Math.floor((this.wave - 1) / 3) % ARENAS.length];
		const s = Mayhem.waveSize(this.wave);
		this.toSpawn = s.total;
		this.spawnT = 0.4;
		if (this.wave % 5 === 0) {
			this.toSpawn--;
			this.#spawn('jugg');
		}
		this.events.push({ t: 'wave', n: this.wave });
		this.popups.push({ x: W / 2, y: 150, text: `WAVE ${this.wave}`, t: 0, tone: 'wave', screen: true });
	}

	get alive() {
		return this.enemies.length;
	}

	/** One step. `dt` in seconds (capped by the caller). */
	step(dt: number, inp: Input) {
		const prev = this.#prev;
		this.#prev = { ...inp }; // a copy: the page mutates one input object in place
		const press = (k: keyof Input) => !!inp[k] && !prev[k];
		this.events = [];
		if (this.over) {
			this.overT += dt;
			this.#world(dt, dt);
			this.#camera(dt, inp);
			return;
		}

		// Holk Time: the world slows, you a bit less
		if (press('holk')) {
			if (this.holkOn) this.holkOn = false;
			else if (this.holk >= 20) this.holkOn = true;
		}
		if (this.holkOn) {
			this.holk -= 24 * dt;
			if (this.holk <= 0) {
				this.holk = 0;
				this.holkOn = false;
			}
		}
		const wdt = this.holkOn ? dt * 0.35 : dt;
		const pdt = this.holkOn ? dt * 0.75 : dt;
		this.t += wdt;

		this.#playerStep(pdt, inp, press);
		for (const e of this.enemies) this.#ai(e, wdt);
		for (const f of [this.player, ...this.enemies]) this.#physics(f, f.player ? pdt : wdt);
		this.#world(wdt, pdt);
		this.#camera(dt, inp);

		// combo window runs in real time
		if (this.comboT > 0) {
			this.comboT -= dt;
			if (this.comboT <= 0) this.combo = 0;
		}

		// waves
		if (this.toSpawn <= 0 && this.enemies.length === 0) {
			if (this.wave > 0 && this.breakT <= 0) {
				this.breakT = 3;
				const bonus = 250 * this.wave;
				this.score += bonus;
				this.events.push({ t: 'clear', n: this.wave });
				this.popups.push({ x: W / 2, y: 190, text: `WAVE CLEAR +${bonus}`, t: 0, tone: 'combo', screen: true });
				this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
			}
			this.breakT -= dt;
			if (this.breakT <= 0) this.#startWave();
		} else if (this.toSpawn > 0) {
			this.spawnT -= wdt;
			if (this.spawnT <= 0 && this.enemies.length < Mayhem.waveSize(this.wave).alive) {
				this.toSpawn--;
				this.#spawn(this.#pickKind());
				this.spawnT = Math.max(0.5, 1.6 - this.wave * 0.06) * (0.6 + this.r() * 0.8);
			}
		}
	}

	/** Follow the player (a little ahead, towards where they aim), eased, kept inside the world. */
	#camera(dt: number, inp: Input) {
		const p = this.player;
		const ahead = Math.max(-90, Math.min(90, (inp.aimX - p.x) * 0.25));
		const tx = Math.max(0, Math.min(W - VW, p.x + ahead - VW / 2));
		const ty = Math.max(0, Math.min(H - VH, p.y - 60 - VH * 0.55));
		const k = Math.min(1, dt * 6);
		this.cam.x += (tx - this.cam.x) * k;
		this.cam.y += (ty - this.cam.y) * k;
	}

	#shoulder(f: Fighter) {
		return { x: f.x + f.facing * 6 * f.scale, y: f.y - (BODY.shoulder - 1) * f.scale };
	}

	/** Where a fighter's gun's muzzle is (the gun pivots near the shoulder). */
	muzzle(f: Fighter) {
		const s = this.#shoulder(f);
		const g = f.held ? gunOf(f.held.id) : null;
		// hand 13 out from the shoulder, then along the gun's barrel (MayhemPage draws the cartoon the same way)
		const len = g ? (g.kind === 'pistol' ? 31 : g.kind === 'melee' ? 36 : 45) : 18;
		const c = Math.cos(f.aim);
		const sn = Math.sin(f.aim);
		const up = g && g.kind !== 'melee' ? (c < 0 ? -5 : 5) : 0;
		return { x: s.x + (c * len + sn * up) * f.scale, y: s.y + (sn * len - c * up) * f.scale };
	}

	#playerStep(dt: number, inp: Input, press: (k: keyof Input) => boolean) {
		const p = this.player;
		if (p.hp <= 0) return;
		const s = this.#shoulder(p);
		p.aim = Math.atan2(inp.aimY - s.y, inp.aimX - s.x);
		p.facing = inp.aimX < p.x ? -1 : 1;
		const g = p.held ? gunOf(p.held.id) : null;
		const speed = RUN * (g?.weight ?? 1.05);
		const want = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
		if (p.stun <= 0) {
			const acc = p.onGround ? 3400 : 1900;
			p.vx += Math.max(-acc * dt, Math.min(acc * dt, want * speed - p.vx));
			if (press('jump') && p.onGround) {
				p.vy = -JUMP;
				p.onGround = false;
			}
			if (press('down') && p.onGround && p.y < FLOOR - 1) p.drop = 0.25;
		}
		p.cool -= dt;

		// pick up / swap
		if (press('pick')) this.#pickUp(p, true);
		else if (!p.held) this.#pickUp(p, false);

		if (press('throw') && p.held) this.#throw(p);
		else if (g && p.held) {
			if (g.kind === 'melee') {
				if (press('fire') && p.cool <= 0) this.#slash(p, g);
			} else if (p.held.ammo > 0) {
				if ((g.auto ? inp.fire : press('fire')) && p.cool <= 0) this.#shoot(p, g, 1);
			} else if (press('fire')) {
				// empty: throw it, like a real brawler would
				this.events.push({ t: 'empty' });
				this.#throw(p);
			}
		} else if (press('fire') && p.cool <= 0) this.#punch(p);
	}

	#pickUp(f: Fighter, swap: boolean) {
		let best: Pickup | null = null;
		let bd = swap ? 54 : 34;
		for (const k of this.pickups) {
			if (!k.gun || k.heal < 0) continue;
			const d = Math.hypot(k.x - f.x, k.y - (f.y - 10));
			if (d < bd) {
				bd = d;
				best = k;
			}
		}
		if (!best?.gun) return;
		if (f.held) this.#dropGun(f, f.held, 0);
		f.held = best.gun;
		f.cool = 0.15;
		this.pickups = this.pickups.filter((k) => k !== best);
		if (f.player) {
			this.events.push({ t: 'pickup', id: best.gun.id });
			this.popups.push({ x: f.x, y: f.y - 110, text: gunOf(best.gun.id).name, t: 0, tone: 'gun' });
		}
	}

	#dropGun(f: Fighter, gun: Held, vx: number) {
		this.pickups.push({ uid: this.uid++, x: f.x, y: f.y - 50, vx: vx + f.facing * 60, vy: -260, gun, heal: 0, life: 22, spin: (this.r() - 0.5) * 8, onGround: false });
	}

	#throw(f: Fighter) {
		if (!f.held) return;
		const m = this.muzzle(f);
		const sp = 980;
		this.bullets.push({ x: m.x, y: m.y, vx: Math.cos(f.aim) * sp + f.vx * 0.3, vy: Math.sin(f.aim) * sp - 120, dmg: 45, mine: f.player, life: 1.6, pierce: 0, hit: [], kind: 'thrown', gun: f.held, spin: 18 * f.facing, from: f.uid });
		f.held = null;
		f.cool = 0.25;
		this.events.push({ t: 'throw' });
	}

	#shoot(f: Fighter, g: GunStats, dmgMult: number) {
		if (!f.held) return;
		f.cool = f.player ? g.rate : g.rate * 1.7;
		if (f.player) {
			f.held.ammo--;
			this.stats.shots++;
		}
		f.recoil = 1;
		const m = this.muzzle(f);
		const err = f.player ? 0 : (this.r() - 0.5) * f.err;
		for (let i = 0; i < g.pellets; i++) {
			const a = f.aim + err + (this.r() - 0.5) * 2 * g.spread;
			const sp = g.speed * (g.pellets > 1 ? 0.85 + this.r() * 0.3 : 1);
			this.bullets.push({
				x: m.x,
				y: m.y,
				vx: Math.cos(a) * sp,
				vy: Math.sin(a) * sp,
				dmg: g.dmg * dmgMult,
				mine: f.player,
				life: g.reach / g.speed,
				pierce: g.pierce,
				hit: [],
				kind: g.kind === 'launcher' ? 'rocket' : 'bullet',
				from: f.uid
			});
		}
		// muzzle flash + an empty case
		this.parts.push({ x: m.x, y: m.y, vx: 0, vy: 0, life: 0.06, max: 0.06, kind: 'flash', r: g.kind === 'shotgun' || g.kind === 'sniper' ? 16 : 11 });
		if (g.kind !== 'launcher') this.parts.push({ x: m.x - Math.cos(f.aim) * 18, y: m.y, vx: -f.facing * (60 + this.r() * 80), vy: -180 - this.r() * 120, life: 1.2, max: 1.2, kind: 'shell', r: 2 });
		if (f.player) {
			f.vx -= Math.cos(f.aim) * (g.kind === 'shotgun' ? 120 : g.kind === 'sniper' ? 160 : 14);
			this.shake = Math.max(this.shake, g.kind === 'sniper' || g.kind === 'shotgun' || g.kind === 'launcher' ? 7 : 2);
		}
		this.events.push({ t: 'shot', kind: g.kind, mine: f.player });
	}

	#melee(f: Fighter, range: number, dmg: number, knock: number, arc: number) {
		f.punch = 0.2;
		const s = this.#shoulder(f);
		const targets = f.player ? this.enemies : [this.player];
		let any = false;
		for (const e of targets) {
			if (e.hp <= 0) continue;
			const dx = e.x - f.x;
			const dy = e.y - BODY.shoulder * e.scale - s.y;
			if (Math.abs(dx) > range + BODY.half * e.scale || Math.abs(dy) > arc) continue;
			if (Math.sign(dx) !== f.facing && Math.abs(dx) > 10) continue;
			any = true;
			e.vx += f.facing * knock;
			e.vy = Math.min(e.vy, -220);
			e.stun = 0.35;
			this.#damage(e, dmg, false, f, f.facing * knock, -260);
		}
		return any;
	}

	#punch(f: Fighter) {
		f.cool = 0.32;
		if (this.#melee(f, 40, f.player ? 34 : 10, 320, 46)) this.events.push({ t: 'punch' });
	}

	#slash(f: Fighter, g: GunStats) {
		f.cool = g.rate;
		if (this.#melee(f, 58, f.player ? g.dmg : 22, 260, 60)) this.events.push({ t: 'punch' });
	}

	#ai(e: Fighter, dt: number) {
		const p = this.player;
		const spec = ENEMY[e.kind as EnemyKind];
		if (e.hp <= 0) return;
		e.cool -= dt;
		e.think -= dt;
		e.react -= dt;
		if (e.entering && e.x > 20 && e.x < W - 20) e.entering = false;
		const pAlive = p.hp > 0;
		const tx = p.x;
		const ty = p.y - BODY.shoulder + 6;
		const dx = tx - e.x;
		const dist = Math.abs(dx);
		e.facing = dx < 0 ? -1 : 1;
		const g = e.held ? gunOf(e.held.id) : null;
		const range = g ? (g.kind === 'melee' ? 30 : Math.min(spec.range, g.kind === 'shotgun' ? 140 : 9999)) : 30;

		// aim: turn towards the player, with an error that shrinks the longer they look
		const s = this.#shoulder(e);
		const want = Math.atan2(ty - s.y, tx - s.x);
		let da = want - e.aim;
		while (da > Math.PI) da -= Math.PI * 2;
		while (da < -Math.PI) da += Math.PI * 2;
		e.aim += da * Math.min(1, dt * (g?.kind === 'sniper' ? 3 : 6));
		e.err = Math.max(0.07 - Math.min(this.wave * 0.003, 0.04), e.err - dt * 0.05);

		// walking
		let move = 0;
		if (e.stun <= 0 && pAlive) {
			if (!e.held) {
				// unarmed: grab a gun lying nearby, else run in
				const gun = this.pickups.find((k) => k.gun && k.heal >= 0 && Math.abs(k.x - e.x) < 220 && Math.abs(k.y - e.y) < 60 && k.onGround);
				if (gun && dist > 90) move = Math.sign(gun.x - e.x);
				else move = dist > 26 ? Math.sign(dx) : 0;
				if (gun && Math.abs(gun.x - e.x) < 24) this.#pickUp(e, false);
			} else if (dist > range + 50) move = Math.sign(dx);
			else if (dist < range - 90 && range > 100) move = -Math.sign(dx);
			if (e.entering) move = e.x < 0 ? 1 : -1;
			if (e.think <= 0) {
				e.think = 0.4 + this.r() * 0.6;
				if (e.onGround && p.y < e.y - 50 && this.r() < 0.55) {
					e.vy = -JUMP;
					e.onGround = false;
				} else if (e.onGround && p.y > e.y + 50 && e.y < FLOOR - 1) e.drop = 0.25;
				else if (e.onGround && this.r() < 0.08) {
					e.vy = -JUMP * 0.8;
					e.onGround = false;
				}
			}
		}
		const sp = RUN * spec.speed * (g?.weight ?? 1);
		const acc = e.onGround ? 2400 : 1200;
		if (e.stun <= 0) e.vx += Math.max(-acc * dt, Math.min(acc * dt, move * sp - e.vx));

		// attacking
		if (!pAlive || e.entering || e.react > 0 || e.stun > 0) return;
		if (!g) {
			if (dist < 44 && Math.abs(p.y - e.y) < 50 && e.cool <= 0) {
				e.cool = 0.9;
				this.#punch(e);
			}
			return;
		}
		if (g.kind === 'melee') {
			if (dist < 60 && Math.abs(p.y - e.y) < 50 && e.cool <= 0) {
				e.cool = 0.8;
				this.#slash(e, g);
			}
			return;
		}
		if (g.kind === 'shotgun' && dist > 380) return;
		if (g.kind === 'sniper') {
			// a laser sight: charges, then fires
			if (e.cool > 0) return;
			e.charge += dt;
			if (e.charge >= 1.15) {
				e.charge = 0;
				this.#shoot(e, g, spec.dmg * 0.9);
				e.cool = 1.8;
			}
			return;
		}
		if (e.rest > 0) {
			e.rest -= dt;
			return;
		}
		if (e.cool <= 0) {
			this.#shoot(e, g, spec.dmg);
			e.burst++;
			const max = g.auto ? 4 + Math.floor(this.r() * 4) : 2 + Math.floor(this.r() * 2);
			if (e.burst >= max) {
				e.burst = 0;
				e.rest = 0.7 + this.r() * 0.9;
			}
		}
	}

	#physics(f: Fighter, dt: number) {
		if (f.hp <= 0) return;
		f.stun -= dt;
		f.hurt -= dt;
		f.punch -= dt;
		f.drop -= dt;
		f.recoil = Math.max(0, f.recoil - dt * 8);
		const py = f.y;
		f.vy += GRAV * dt;
		f.x += f.vx * dt;
		f.y += f.vy * dt;
		if (f.onGround && !f.player && f.stun <= 0) f.vx *= 1 - Math.min(1, dt * 2);
		if (f.stun > 0 && f.onGround) f.vx *= 1 - Math.min(1, dt * 8);
		f.onGround = false;
		if (f.vy >= 0) {
			if (f.y >= FLOOR) {
				f.y = FLOOR;
				f.vy = 0;
				f.onGround = true;
			} else if (f.drop <= 0) {
				for (const p of this.arena.platforms) {
					if (py <= p.y + 0.5 && f.y >= p.y && f.x > p.x - 4 && f.x < p.x + p.w + 4) {
						f.y = p.y;
						f.vy = 0;
						f.onGround = true;
						break;
					}
				}
			}
		}
		if (!f.entering) {
			if (f.x < 14) (f.x = 14), (f.vx = Math.max(0, f.vx));
			if (f.x > W - 14) (f.x = W - 14), (f.vx = Math.min(0, f.vx));
		}
		if (f.onGround) f.walk += Math.abs(f.vx) * dt * 0.05;
	}

	/** Where a line from a to b first touches a fighter: head, body or nothing. */
	#touch(f: Fighter, x0: number, y0: number, x1: number, y1: number): 'head' | 'body' | null {
		const s = f.scale;
		const hx = f.x;
		const hy = f.y - BODY.head * s;
		const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6));
		for (let i = 0; i <= n; i++) {
			const x = x0 + ((x1 - x0) * i) / n;
			const y = y0 + ((y1 - y0) * i) / n;
			if (Math.hypot(x - hx, y - hy) < BODY.headR * s + 1) return 'head';
			if (Math.abs(x - f.x) < BODY.half * s && y > f.y - (BODY.shoulder + 4) * s && y < f.y) return 'body';
		}
		return null;
	}

	#damage(f: Fighter, dmg: number, head: boolean, by: Fighter | null, kx: number, ky: number) {
		if (f.hp <= 0) return;
		const real = head ? dmg * 2 : dmg;
		f.hp -= real;
		f.hurt = 0.12;
		const hx = f.x;
		const hy = f.y - (head ? BODY.head : 44) * f.scale;
		for (let i = 0; i < (head ? 10 : 5); i++) this.parts.push({ x: hx, y: hy, vx: kx * 0.5 + (this.r() - 0.5) * 260, vy: ky * 0.3 - this.r() * 260, life: 1.4, max: 1.4, kind: 'ketchup', r: 2 + this.r() * 2.5 });
		if (f.player) {
			this.events.push({ t: 'hurt' });
			this.shake = Math.max(this.shake, 6);
			if (f.hp <= 0) this.#die(f, kx, ky, head);
			return;
		}
		if (by?.player) {
			this.stats.hits++;
			this.events.push({ t: 'hit', head, mine: true });
		}
		if (f.hp <= 0) {
			this.#die(f, kx, ky, head);
			if (by?.player || by === null) this.#scoreKill(f, head);
		}
	}

	#scoreKill(f: Fighter, head: boolean) {
		const spec = ENEMY[f.kind as EnemyKind];
		this.combo++;
		this.comboT = 2.6;
		this.stats.kills++;
		if (head) this.stats.heads++;
		this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
		const mult = Math.min(this.combo, 6);
		const pts = (spec.score + (head ? 75 : 0)) * mult;
		this.score += pts;
		this.holk = Math.min(100, this.holk + (head ? 14 : 9));
		this.popups.push({ x: f.x, y: f.y - 100 * f.scale, text: head ? `HEADSHOT +${pts}` : `+${pts}`, t: 0, tone: head ? 'head' : 'kill' });
		if (this.combo >= 2) this.popups.push({ x: f.x, y: f.y - 124 * f.scale, text: `×${mult} COMBO`, t: 0, tone: 'combo' });
		this.events.push({ t: 'kill', head });
		// sometimes a burger
		if (this.r() < (f.kind === 'jugg' ? 1 : 0.14)) this.pickups.push({ uid: this.uid++, x: f.x, y: f.y - 40, vx: 0, vy: -300, gun: null, heal: f.kind === 'jugg' ? 60 : 30, life: 14, spin: 0, onGround: false });
	}

	#die(f: Fighter, kx: number, ky: number, head: boolean) {
		f.hp = 0;
		if (f.held && !f.player) {
			const g = gunOf(f.held.id);
			const ammo = g.kind === 'melee' ? 0 : Math.max(1, Math.round(g.mag * (0.4 + this.r() * 0.6)));
			this.#dropGun(f, { id: f.held.id, ammo }, kx * 0.2);
			f.held = null;
		}
		this.corpses.push({ f, x: f.x, y: f.y - 46 * f.scale, vx: f.vx + kx * 0.9, vy: Math.min(f.vy, 0) + ky - 120, ang: 0, spin: (kx >= 0 ? 1 : -1) * (6 + this.r() * 8) * (head ? 1.4 : 1), t: 0, still: false });
		for (let i = 0; i < 16; i++) this.parts.push({ x: f.x, y: f.y - 50 * f.scale, vx: kx * 0.4 + (this.r() - 0.5) * 420, vy: -this.r() * 420, life: 1.6, max: 1.6, kind: 'ketchup', r: 2 + this.r() * 3.5 });
		if (f.player) {
			this.over = true;
			this.events.push({ t: 'dead' });
		} else this.enemies = this.enemies.filter((e) => e !== f);
		if (this.corpses.length > 18) this.corpses.shift();
	}

	#boom(x: number, y: number, mine: boolean) {
		this.events.push({ t: 'boom' });
		this.shake = 14;
		for (let i = 0; i < 26; i++) {
			const a = this.r() * Math.PI * 2;
			const v = 80 + this.r() * 420;
			this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.5 + this.r() * 0.6, max: 1.1, kind: i < 8 ? 'boom' : i < 18 ? 'spark' : 'smoke', r: i < 8 ? 26 + this.r() * 20 : 3 + this.r() * 6 });
		}
		const R = 105;
		for (const f of [this.player, ...this.enemies]) {
			if (f.hp <= 0) continue;
			const d = Math.hypot(f.x - x, f.y - 46 - y);
			if (d > R) continue;
			const k = 1 - d / R;
			const dir = f.x < x ? -1 : 1;
			const dmg = (f.player ? (mine ? 30 : 45) : 170) * k + 10;
			f.vx += dir * 520 * k;
			f.vy = -560 * k - 120;
			f.stun = 0.5;
			this.#damage(f, dmg, false, mine ? this.player : null, dir * 520 * k, -560 * k);
		}
	}

	#world(dt: number, pdt: number) {
		// bullets
		const fighters = [this.player, ...this.enemies];
		for (const b of this.bullets) {
			const x0 = b.x;
			const y0 = b.y;
			if (b.kind === 'thrown') b.vy += GRAV * 0.55 * dt;
			if (b.kind === 'rocket') this.parts.push({ x: b.x, y: b.y, vx: -b.vx * 0.05, vy: -30, life: 0.5, max: 0.5, kind: 'smoke', r: 5 });
			b.x += b.vx * dt;
			b.y += b.vy * dt;
			b.life -= dt;
			for (const f of fighters) {
				if (f.hp <= 0 || f.uid === b.from || b.hit.includes(f.uid)) continue;
				if (b.mine === f.player) continue;
				const where = this.#touch(f, x0, y0, b.x, b.y);
				if (!where) continue;
				b.hit.push(f.uid);
				if (b.kind === 'rocket') {
					this.#boom(b.x, b.y, b.mine);
					b.life = 0;
					break;
				}
				const head = where === 'head' && b.kind !== 'thrown';
				const sp = Math.hypot(b.vx, b.vy) || 1;
				const kx = (b.vx / sp) * (b.kind === 'thrown' ? 360 : Math.min(260, b.dmg * 3));
				if (b.kind === 'thrown') {
					f.stun = 0.9;
					f.vx += kx;
					f.vy = -300;
				}
				this.#damage(f, b.dmg, head, b.mine ? this.player : (this.enemies.find((e) => e.uid === b.from) ?? null), kx, -200);
				for (let i = 0; i < 4; i++) this.parts.push({ x: b.x, y: b.y, vx: (this.r() - 0.5) * 300, vy: (this.r() - 0.5) * 300, life: 0.2, max: 0.2, kind: 'spark', r: 1.5 });
				if (b.pierce-- <= 0) {
					b.life = 0;
					break;
				}
			}
			if (b.life > 0 && b.y >= FLOOR) {
				if (b.kind === 'rocket') this.#boom(b.x, FLOOR - 4, b.mine);
				else if (b.kind === 'bullet') for (let i = 0; i < 3; i++) this.parts.push({ x: b.x, y: FLOOR - 1, vx: (this.r() - 0.5) * 200, vy: -this.r() * 200, life: 0.25, max: 0.25, kind: 'spark', r: 1.5 });
				b.life = 0;
			}
			if (b.life <= 0 && b.kind === 'thrown' && b.gun) {
				// the thrown gun lands where it is (an empty one fades away there)
				this.pickups.push({ uid: this.uid++, x: Math.max(20, Math.min(W - 20, b.x)), y: Math.min(b.y, FLOOR - 8), vx: -b.vx * 0.15, vy: -200, gun: b.gun.ammo > 0 || gunOf(b.gun.id).kind === 'melee' ? b.gun : null, heal: 0, life: b.gun.ammo > 0 || gunOf(b.gun.id).kind === 'melee' ? 22 : 1.2, spin: b.spin ?? 10, onGround: false });
				if (b.gun.ammo <= 0 && gunOf(b.gun.id).kind !== 'melee') {
					const last = this.pickups[this.pickups.length - 1];
					last.heal = -1; // marks an empty gun (drawn, not picked up)
					last.gun = b.gun;
				}
			}
			if (b.x < -200 || b.x > W + 200 || b.y < -300) b.life = 0;
		}
		this.bullets = this.bullets.filter((b) => b.life > 0);

		// pickups
		const p = this.player;
		for (const k of this.pickups) {
			k.life -= dt;
			if (!k.onGround) {
				const py = k.y;
				k.vy += GRAV * dt;
				k.x += k.vx * dt;
				k.y += k.vy * dt;
				k.spin *= 0.99;
				if (k.y >= FLOOR - 6) {
					k.y = FLOOR - 6;
					k.onGround = true;
				} else if (k.vy > 0)
					for (const pl of this.arena.platforms)
						if (py <= pl.y - 6 && k.y >= pl.y - 6 && k.x > pl.x && k.x < pl.x + pl.w) {
							k.y = pl.y - 6;
							k.onGround = true;
						}
				if (k.x < 16 || k.x > W - 16) k.vx = -k.vx * 0.5;
				k.x = Math.max(16, Math.min(W - 16, k.x));
			}
			if (k.heal > 0 && p.hp > 0 && Math.hypot(k.x - p.x, k.y - (p.y - 20)) < 40 && p.hp < p.maxHp) {
				p.hp = Math.min(p.maxHp, p.hp + k.heal);
				this.popups.push({ x: p.x, y: p.y - 110, text: `+${k.heal} HP`, t: 0, tone: 'heal' });
				this.events.push({ t: 'pickup', id: null });
				k.life = 0;
			}
		}
		this.pickups = this.pickups.filter((k) => k.life > 0);
		if (this.pickups.length > 14) this.pickups.splice(0, this.pickups.length - 14);

		// ragdolls
		for (const c of this.corpses) {
			c.t += dt;
			if (c.still) continue;
			const py = c.y;
			c.vy += GRAV * dt;
			c.x += c.vx * dt;
			c.y += c.vy * dt;
			c.ang += c.spin * dt;
			const ground = (y: number) => {
				c.y = y;
				if (Math.abs(c.vy) > 220) {
					c.vy = -c.vy * 0.32;
					c.spin *= 0.6;
				} else c.vy = 0;
				c.vx *= 0.82;
				const lie = Math.round(c.ang / Math.PI - 0.5) * Math.PI + Math.PI / 2;
				if (c.vy === 0) {
					c.ang += (lie - c.ang) * Math.min(1, dt * 10);
					c.spin *= 0.7;
					if (Math.abs(c.vx) < 8 && Math.abs(lie - c.ang) < 0.02) {
						c.ang = lie;
						c.still = true;
					}
				}
			};
			const rest = FLOOR - 9 * c.f.scale;
			if (c.y >= rest) ground(rest);
			else if (c.vy > 0)
				for (const pl of this.arena.platforms) if (py <= pl.y - 9 && c.y >= pl.y - 9 && c.x > pl.x && c.x < pl.x + pl.w) ground(pl.y - 9);
			if (c.x < 10 || c.x > W - 10) {
				c.vx = -c.vx * 0.5;
				c.x = Math.max(10, Math.min(W - 10, c.x));
			}
		}

		// particles
		for (const q of this.parts) {
			q.life -= q.kind === 'flash' ? pdt : dt;
			if (q.kind === 'smoke' || q.kind === 'boom') {
				q.vx *= 0.92;
				q.vy = q.vy * 0.92 - 40 * dt;
				q.r += dt * 14;
			} else if (q.kind !== 'flash') q.vy += GRAV * (q.kind === 'spark' ? 0.4 : 0.8) * dt;
			const py = q.y;
			q.x += q.vx * dt;
			q.y += q.vy * dt;
			if (q.kind === 'ketchup' && q.vy > 0) {
				let land = q.y >= FLOOR ? FLOOR : 0;
				if (!land) for (const pl of this.arena.platforms) if (py <= pl.y && q.y >= pl.y && q.x > pl.x && q.x < pl.x + pl.w) land = pl.y;
				if (land) {
					this.splats.push({ x: q.x, y: land, r: q.r * (1.6 + this.r()), a: 0.85 });
					q.life = 0;
				}
			}
			if (q.kind === 'shell' && q.y >= FLOOR - 2) {
				q.y = FLOOR - 2;
				q.vy = -q.vy * 0.3;
				q.vx *= 0.6;
			}
		}
		this.parts = this.parts.filter((q) => q.life > 0);
		if (this.parts.length > 500) this.parts.splice(0, this.parts.length - 500);
		if (this.splats.length > 120) this.splats.splice(0, this.splats.length - 120);
		for (const u of this.popups) u.t += pdt;
		this.popups = this.popups.filter((u) => u.t < 1.3);
		this.shake = Math.max(0, this.shake - pdt * 40);
	}
}
