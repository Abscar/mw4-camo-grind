/**
 * Abscars Madness (2026-11-23; was Squad Mayhem): our own side-scrolling brawler-shooter. You fight your way
 * through long levels (levels.ts) to the EXIT: run, jump, aim with the mouse, punch or shoot, take the guns
 * the enemies drop and throw empty ones at them. Puzzles: doors that open when an area is cleared, key cards,
 * switches (E or a bullet) that open doors / switch lasers off, crates you push to climb, explosive barrels that
 * blow cracked walls apart, pits. Checkpoints: dying sends you back to the last one. Abilities from the skill
 * tree (skills.ts): triple jump, air dash, dash strike, earthquake slam, grenades, more damage / ammo / health,
 * Holk Time lasting longer, self repair, second wind.
 * Movement (2026-11-23, the user: "better gravity, smoother controls, more fun movement, double jump, dash"):
 * everyone has a double jump, a dash (C, also in the air), wall slide + wall jump and a ground slam (S in the air).
 * Jumps feel like a platformer's: a short grace after running off a ledge ("coyote time"), a jump pressed just
 * before landing still counts, holding jump goes higher, a little hang at the top, falling faster than rising.
 * Pure game logic: no DOM, no drawing (render.ts + painter.ts draw it, MayhemPage.svelte runs it).
 * Coordinates: world px, y down; a fighter's `y` is where their feet are.
 */
import { gunOf, OUT_WEAPONS, STARTER, weaponsOfKind, type GunKind, type GunStats } from './guns.ts';
import { CEIL, FLOOR, LEVELS, type Block, type KeyColour, type Level } from './levels.ts';
import type { SkillId } from './skills.ts';

export { FLOOR, CEIL };
/** the background tile width (render.ts repeats the arena picture every W) */
export const W = 960;
export const H = 540;
/** the camera shows this much of the world (zoomed in 1.5×, it follows the player) */
export const VW = 640;
export const VH = 360;
const GRAV = 2300;
const RUN = 300;
const JUMP = 830;
/** the player's own gravity: rising (held jump), falling, a released jump, the hang at the top */
const P_GRAV = 2000;
const P_JUMP = 860;
const COYOTE = 0.11;
const BUFFER = 0.13;
const DASH_V = 980;
const DASH_T = 0.15;

/** body proportions (from the feet up) */
export const BODY = { hip: 44, shoulder: 69, head: 82, headR: 8.5, half: 11, top: 91 } as const;

export interface Platform {
	x: number;
	y: number;
	w: number;
}
/** what render.ts needs to know about the stage */
export interface Arena {
	id: Level['theme'];
	platforms: Platform[];
}

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
	asleep: boolean;
	zone?: string;
	// player moves
	jumps: number;
	dashT: number;
	dashCool: number;
	dashDir: 1 | -1;
	/** dashes used since leaving the ground */
	airDash: number;
	/** enemies a Dash Strike already hit in this dash */
	dashHit: number[];
	coyote: number;
	buffer: number;
	/** after a wall jump: steering back into the wall is weak for a moment */
	wallLock: number;
	stepAt: number;
	/** touching a wall in the air: -1 left, 1 right, 0 none */
	wall: number;
	slam: boolean;
	safeT: number;
	laserCool: number;
	quiet: number;
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
	kind: 'bullet' | 'rocket' | 'thrown' | 'frag';
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
	kind: 'spark' | 'ketchup' | 'smoke' | 'shell' | 'flash' | 'boom' | 'debris' | 'ring' | 'ghost';
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
	tone: 'kill' | 'head' | 'combo' | 'heal' | 'wave' | 'gun' | 'info';
	/** drawn on the screen (centre), not in the world */
	screen?: boolean;
}

export interface BlockState extends Block {
	open: boolean;
	/** 0 shut … 1 fully open (doors slide up) */
	openT: number;
	gone: boolean;
}
export interface Crate {
	x: number;
	y: number;
	w: number;
	h: number;
	vx: number;
	vy: number;
	onGround: boolean;
	gone: boolean;
}
export interface Barrel {
	x: number;
	y: number;
	alive: boolean;
	fuse: number;
}
export interface Laser {
	id: string;
	x: number;
	top: number;
	bottom: number;
	on: boolean;
}
export interface Switch {
	id: string;
	x: number;
	y: number;
	on: boolean;
	opens: string[];
}
export interface KeyCard {
	colour: KeyColour;
	x: number;
	y: number;
	taken: boolean;
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
	| { t: 'door' }
	| { t: 'key' }
	| { t: 'switch' }
	| { t: 'checkpoint' }
	| { t: 'dash' }
	| { t: 'slam'; big: boolean }
	| { t: 'jump'; n: number }
	| { t: 'wall' }
	| { t: 'land'; hard: boolean }
	| { t: 'step' }
	| { t: 'complete' }
	| { t: 'respawn' }
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
	dash: boolean;
	nade: boolean;
	aimX: number;
	aimY: number;
}

export const NO_INPUT: Input = { left: false, right: false, jump: false, down: false, fire: false, pick: false, throw: false, holk: false, dash: false, nade: false, aimX: W, aimY: FLOOR - 60 };

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
	random: { hp: 60, speed: 0.78, range: 240, kinds: [null, 'pistol', 'pistol', 'melee'], dmg: 0.2, scale: 1, score: 100 },
	sweat: { hp: 80, speed: 0.95, range: 300, kinds: ['smg', 'ar', 'ar', 'smg'], dmg: 0.2, scale: 1, score: 150 },
	shotty: { hp: 95, speed: 0.9, range: 130, kinds: ['shotgun'], dmg: 0.24, scale: 1, score: 175 },
	camper: { hp: 60, speed: 0.6, range: 520, kinds: ['sniper', 'marksman'], dmg: 0.28, scale: 1, score: 200 },
	jugg: { hp: 650, speed: 0.55, range: 300, kinds: ['lmg'], dmg: 0.18, scale: 1.3, score: 1500 }
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

type Rect = { x: number; y: number; w: number; h: number };
const CRATE = 44;

export class Mayhem {
	r: () => number;
	t = 0;
	uid = 1;
	level: Level;
	/** the level's width */
	w: number;
	arena: Arena;
	skills: Set<SkillId>;
	player: Fighter;
	enemies: Fighter[] = [];
	bullets: Bullet[] = [];
	pickups: Pickup[] = [];
	corpses: Corpse[] = [];
	parts: Particle[] = [];
	splats: Splat[] = [];
	popups: Popup[] = [];
	events: GameEvent[] = [];
	blocks: BlockState[];
	crates: Crate[];
	barrels: Barrel[];
	lasers: Laser[];
	switches: Switch[];
	keys: KeyCard[];
	have = new Set<KeyColour>();
	score = 0;
	combo = 0;
	comboT = 0;
	holk = 40;
	holkOn = false;
	shake = 0;
	grenades = 0;
	/** the camera's top-left corner in the world */
	cam = { x: 0, y: H - VH };
	/** kept for render.ts / older code: there are no waves any more */
	wave = 0;
	toSpawn = 0;
	totalEnemies: number;
	deaths = 0;
	time = 0;
	checkpoint = 0;
	respawnX: number;
	respawnT = 0;
	windUsed = false;
	complete = false;
	/** the run is over: true after the level is completed (the page shows the result) */
	over = false;
	overT = 0;
	stats: Stats = { kills: 0, heads: 0, shots: 0, hits: 0, bestCombo: 0 };
	#prev: Input = NO_INPUT;
	/** the jump key is held (higher jumps) / where the player steers (wall slide) */
	#held = false;
	#wasHeld = false;
	#want = 0;
	#startGun: string;

	constructor(levelId: string = LEVELS[0].id, start: string = STARTER, skills: Iterable<SkillId> = [], seed = Date.now()) {
		this.r = rng(seed);
		this.level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
		const L = this.level;
		this.w = L.w;
		this.skills = new Set(skills);
		this.arena = { id: L.theme, platforms: L.platforms };
		this.blocks = L.blocks.map((b) => ({ ...b, open: false, openT: 0, gone: false }));
		this.crates = L.crates.map((c) => ({ x: c.x, y: (c.y ?? FLOOR) - CRATE, w: CRATE, h: CRATE, vx: 0, vy: 0, onGround: true, gone: false }));
		this.barrels = L.barrels.map((b) => ({ x: b.x, y: b.y ?? FLOOR, alive: true, fuse: 0 }));
		this.lasers = L.lasers.map((l) => ({ id: l.id, x: l.x, top: l.top, bottom: l.bottom ?? FLOOR, on: true }));
		this.switches = L.switches.map((s) => ({ ...s, on: false }));
		this.keys = L.keys.map((k) => ({ ...k, taken: false }));
		this.#startGun = start;
		this.player = this.#fighter(true, 'player', L.start, FLOOR, this.#playerGun());
		this.player.hp = this.player.maxHp = this.skills.has('skin') ? 140 : 100;
		this.respawnX = L.start;
		this.grenades = this.skills.has('frag') ? 3 : 0;
		for (const s of L.enemies) this.#spawn(s.kind, s.x, s.y ?? FLOOR, s.zone, s.gun);
		this.totalEnemies = this.enemies.length;
		for (const g of L.guns) {
			const list = weaponsOfKind(g.kind);
			const w = list[Math.floor(this.r() * list.length)] ?? OUT_WEAPONS[0];
			const gs = gunOf(w.id);
			this.pickups.push({ uid: this.uid++, x: g.x, y: (g.y ?? FLOOR) - 6, vx: 0, vy: 0, gun: { id: w.id, ammo: this.#mag(gs) }, heal: 0, life: 1e9, spin: 0, onGround: true });
		}
		for (const b of L.burgers) this.pickups.push({ uid: this.uid++, x: b.x, y: (b.y ?? FLOOR) - 6, vx: 0, vy: 0, gun: null, heal: 35, life: 1e9, spin: 0, onGround: true });
		this.cam.x = Math.max(0, Math.min(this.w - VW, L.start - VW / 3));
		this.popups.push({ x: 0, y: 0, text: L.name.toUpperCase(), t: 0, tone: 'wave', screen: true });
	}

	#mag(g: GunStats) {
		return g.kind === 'melee' ? 0 : Math.round(g.mag * (this.skills.has('mags') ? 1.5 : 1));
	}

	#playerGun(): Held {
		const g = gunOf(this.#startGun);
		return { id: g.id, ammo: this.#mag(g) };
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
			err: 0,
			asleep: !player,
			jumps: 0,
			dashT: 0,
			dashCool: 0,
			dashDir: 1,
			airDash: 0,
			dashHit: [],
			coyote: 0,
			buffer: 0,
			wallLock: 0,
			stepAt: 0,
			wall: 0,
			slam: false,
			safeT: 0,
			laserCool: 0,
			quiet: 99
		};
	}

	#gunFor(kind: GunKind | null): Held | null {
		if (!kind) return null;
		const list = weaponsOfKind(kind);
		const w = list[Math.floor(this.r() * list.length)] ?? OUT_WEAPONS[0];
		return { id: w.id, ammo: gunOf(w.id).mag };
	}

	#spawn(kind: EnemyKind, x: number, y: number, zone?: string, gun?: GunKind | 'none') {
		const spec = ENEMY[kind];
		const held = gun === 'none' ? null : this.#gunFor(gun ?? spec.kinds[Math.floor(this.r() * spec.kinds.length)]);
		const f = this.#fighter(false, kind, x, y, held);
		f.hp = f.maxHp = spec.hp;
		f.scale = spec.scale;
		f.facing = -1;
		f.react = 0.45 + this.r() * 0.5;
		f.err = 0.22;
		f.think = this.r() * 0.5;
		f.zone = zone;
		f.onGround = true;
		const tags = TAGS[kind];
		f.tag = tags[Math.floor(this.r() * tags.length)];
		this.enemies.push(f);
	}

	get alive() {
		return this.enemies.length;
	}

	/** solid rectangles: walls, shut doors, standing cracked walls, crates */
	solids(except?: Crate): Rect[] {
		const out: Rect[] = [];
		for (const b of this.blocks) {
			if (b.gone) continue;
			if (b.kind === 'door') {
				if (b.openT >= 0.95) continue;
				const hh = b.h * (1 - b.openT);
				out.push({ x: b.x, y: b.y, w: b.w, h: hh });
			} else out.push(b);
		}
		for (const c of this.crates) if (!c.gone && c !== except) out.push(c);
		return out;
	}

	#onGroundAt(x: number) {
		for (const [a, b] of this.level.ground) if (x >= a && x <= b) return true;
		return false;
	}

	/** Is there something to stand on just below (x, y)? (for the AI's edge check) */
	#footing(x: number, y: number) {
		if (y >= FLOOR - 2 && this.#onGroundAt(x)) return true;
		for (const p of this.level.platforms) if (x > p.x && x < p.x + p.w && Math.abs(p.y - y) < 6) return true;
		for (const s of this.solids()) if (x > s.x && x < s.x + s.w && Math.abs(s.y - y) < 6) return true;
		return false;
	}

	/** Can a bullet travel from a to b without hitting a solid? */
	clearLine(x0: number, y0: number, x1: number, y1: number) {
		const sol = this.solids();
		const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 14));
		for (let i = 1; i < n; i++) {
			const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
			for (const s of sol) if (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) return false;
		}
		return true;
	}

	/** One step. `dt` in seconds (capped by the caller). */
	step(dt: number, inp: Input) {
		const prev = this.#prev;
		this.#wasHeld = prev.jump;
		this.#prev = { ...inp }; // a copy: the page mutates one input object in place
		const press = (k: keyof Input) => !!inp[k] && !prev[k];
		this.events = [];
		if (this.over) {
			this.overT += dt;
			this.#world(dt, dt);
			this.#camera(dt, inp);
			return;
		}
		if (this.player.hp > 0 && !this.complete) this.time += dt;

		// Holk Time: the world slows, you a bit less
		if (press('holk')) {
			if (this.holkOn) this.holkOn = false;
			else if (this.holk >= 20) this.holkOn = true;
		}
		if (this.holkOn) {
			this.holk -= (this.skills.has('lungs') ? 12 : 24) * dt;
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
		this.#crates(wdt);
		this.#puzzles(dt);
		this.#world(wdt, pdt);
		this.#camera(dt, inp);

		if (this.comboT > 0) {
			this.comboT -= dt;
			if (this.comboT <= 0) this.combo = 0;
		}

		// back to the last checkpoint after a death
		if (this.player.hp <= 0) {
			this.respawnT -= dt;
			if (this.respawnT <= 0) this.#respawn();
		}
	}

	#respawn() {
		const p = this.player;
		const fresh = this.#fighter(true, 'player', this.respawnX, FLOOR - 1, p.held ?? this.#playerGun());
		fresh.hp = fresh.maxHp = p.maxHp;
		fresh.safeT = 1.5;
		this.player = fresh;
		this.corpses = this.corpses.filter((c) => c.f !== p);
		this.windUsed = false;
		this.grenades = this.skills.has('frag') ? 3 : 0;
		this.holk = Math.max(this.holk, 40);
		this.events.push({ t: 'respawn' });
	}

	#camera(dt: number, inp: Input) {
		const p = this.player.hp > 0 ? this.player : (this.corpses.find((c) => c.f.player) ?? this.player);
		const ahead = Math.max(-90, Math.min(90, (inp.aimX - p.x) * 0.25));
		const tx = Math.max(0, Math.min(this.w - VW, p.x + ahead - VW / 2));
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
		const len = g ? (g.kind === 'pistol' ? 31 : g.kind === 'melee' ? 36 : 45) : 18;
		const c = Math.cos(f.aim);
		const sn = Math.sin(f.aim);
		const up = g && g.kind !== 'melee' ? (c < 0 ? -5 : 5) : 0;
		return { x: s.x + (c * len + sn * up) * f.scale, y: s.y + (sn * len - c * up) * f.scale };
	}

	#playerStep(dt: number, inp: Input, press: (k: keyof Input) => boolean) {
		const p = this.player;
		const prevJumpHeld = (_p: Fighter) => this.#wasHeld;
		if (p.hp <= 0 || this.complete) {
			p.vx *= 0.9;
			return;
		}
		const s = this.#shoulder(p);
		p.aim = Math.atan2(inp.aimY - s.y, inp.aimX - s.x);
		p.facing = inp.aimX < p.x ? -1 : 1;
		const g = p.held ? gunOf(p.held.id) : null;
		const speed = RUN * (g?.weight ?? 1.05);
		const want = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
		this.#held = inp.jump;
		this.#want = want;
		p.dashCool -= dt;
		p.safeT -= dt;
		p.quiet += dt;
		p.coyote -= dt;
		p.buffer -= dt;
		p.wallLock -= dt;
		if (p.onGround) {
			p.coyote = COYOTE;
			p.jumps = 0;
			p.airDash = 0;
			p.slam = false;
		}
		if (press('jump')) p.buffer = BUFFER;
		const maxJumps = this.skills.has('triple') ? 3 : 2;
		const maxAir = this.skills.has('airdash') ? 2 : 1;
		if (p.dashT > 0) {
			p.dashT -= dt;
			p.vy = 0;
			p.vx = p.dashDir * DASH_V;
			if (this.r() < 0.6) this.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.18, max: 0.18, kind: 'ghost', r: p.dashDir });
			if (this.skills.has('dashhit'))
				for (const e of this.enemies) {
					if (e.hp <= 0 || p.dashHit.includes(e.uid) || Math.abs(e.x - p.x) > 26 * e.scale || Math.abs(e.y - p.y) > 70) continue;
					p.dashHit.push(e.uid);
					e.stun = 0.7;
					e.asleep = false;
					e.vx = p.dashDir * 380;
					e.vy = -300;
					this.#damage(e, 60, false, p, p.dashDir * 380, -300);
					this.shake = Math.max(this.shake, 5);
				}
			if (p.dashT <= 0) p.vx = p.dashDir * speed * 1.2;
		} else if (p.stun <= 0) {
			const target = want * speed;
			let acc: number;
			if (p.onGround) acc = want === 0 ? 5200 : p.vx && Math.sign(target) !== Math.sign(p.vx) ? 7600 : 4200;
			else acc = want === 0 ? 700 : 2800;
			if (p.wallLock > 0 && want === p.wall) acc *= 0.2;
			p.vx += Math.max(-acc * dt, Math.min(acc * dt, target - p.vx));
			if (p.buffer > 0) {
				if (p.onGround || p.coyote > 0) {
					p.vy = -P_JUMP;
					p.onGround = false;
					p.coyote = 0;
					p.jumps = 1;
					p.buffer = 0;
					this.events.push({ t: 'jump', n: 1 });
					for (let i = 0; i < 5; i++) this.parts.push({ x: p.x + (this.r() - 0.5) * 16, y: p.y, vx: (this.r() - 0.5) * 140, vy: -this.r() * 40, life: 0.35, max: 0.35, kind: 'smoke', r: 2.5 });
				} else if (p.wall) {
					p.vy = -P_JUMP * 0.92;
					p.vx = -p.wall * 470;
					p.jumps = 1;
					p.airDash = 0;
					p.buffer = 0;
					p.wallLock = 0.16;
					this.events.push({ t: 'wall' });
					for (let i = 0; i < 6; i++) this.parts.push({ x: p.x + p.wall * 10, y: p.y - 30 - this.r() * 40, vx: -p.wall * this.r() * 160, vy: (this.r() - 0.5) * 120, life: 0.3, max: 0.3, kind: 'debris', r: 1.6 });
				} else if (p.jumps < maxJumps) {
					p.jumps = Math.max(1, p.jumps) + 1;
					p.vy = -P_JUMP * 0.86;
					p.buffer = 0;
					if (want) p.vx = want * Math.max(Math.abs(p.vx), speed);
					this.events.push({ t: 'jump', n: p.jumps });
					this.parts.push({ x: p.x, y: p.y + 2, vx: 0, vy: 0, life: 0.32, max: 0.32, kind: 'ring', r: 10 });
					for (let i = 0; i < 6; i++) this.parts.push({ x: p.x, y: p.y, vx: (this.r() - 0.5) * 180, vy: 40 + this.r() * 80, life: 0.4, max: 0.4, kind: 'smoke', r: 3 });
				}
			}
			// a short tap of jump gives a short hop
			if (!inp.jump && p.vy < -P_JUMP * 0.45 && !p.onGround && prevJumpHeld(p)) p.vy = -P_JUMP * 0.45;
			if (press('down')) {
				if (p.onGround && p.y < FLOOR - 1) p.drop = 0.25;
				else if (!p.onGround && !p.slam) {
					p.slam = true;
					p.vy = 1400;
					p.vx *= 0.25;
				}
			}
			if (press('dash') && p.dashCool <= 0 && (p.onGround || p.airDash < maxAir)) {
				p.dashT = DASH_T;
				p.dashCool = this.skills.has('airdash') ? 0.42 : 0.65;
				p.dashDir = (want || p.facing) as 1 | -1;
				p.dashHit = [];
				p.slam = false;
				if (!p.onGround) p.airDash++;
				p.safeT = Math.max(p.safeT, DASH_T + 0.06);
				this.events.push({ t: 'dash' });
			}
		}
		p.cool -= dt;
		// self repair
		if (this.skills.has('regen') && p.quiet > 3 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 7 * dt);

		if (press('nade') && this.grenades > 0) {
			this.grenades--;
			const m = this.muzzle(p);
			this.bullets.push({ x: m.x, y: m.y, vx: Math.cos(p.aim) * 620 + p.vx * 0.3, vy: Math.sin(p.aim) * 620 - 260, dmg: 0, mine: true, life: 1.4, pierce: 0, hit: [], kind: 'frag', spin: 8, from: p.uid });
			this.events.push({ t: 'throw' });
		}

		// pick up / swap / use a switch
		if (press('pick')) {
			if (!this.#useSwitch()) this.#pickUp(p, true);
		} else if (!p.held) this.#pickUp(p, false);

		if (press('throw') && p.held) this.#throw(p);
		else if (g && p.held) {
			if (g.kind === 'melee') {
				if (press('fire') && p.cool <= 0) this.#slash(p, g);
			} else if (p.held.ammo > 0) {
				if ((g.auto ? inp.fire : press('fire')) && p.cool <= 0) this.#shoot(p, g, this.skills.has('aim') ? 1.2 : 1);
			} else if (press('fire')) {
				this.events.push({ t: 'empty' });
				this.#throw(p);
			}
		} else if (press('fire') && p.cool <= 0) this.#punch(p);
	}

	#useSwitch() {
		const p = this.player;
		for (const s of this.switches) {
			if (s.on) continue;
			if (Math.abs(s.x - p.x) < 50 && s.y > p.y - 130 && s.y < p.y + 20) {
				this.#flip(s);
				return true;
			}
		}
		return false;
	}

	#flip(s: Switch) {
		if (s.on) return;
		s.on = true;
		for (const id of s.opens) {
			const l = this.lasers.find((x) => x.id === id);
			if (l) l.on = false;
			const d = this.blocks.find((b) => b.id === id);
			if (d) d.open = true;
		}
		this.events.push({ t: 'switch' });
		this.popups.push({ x: s.x, y: s.y - 20, text: 'SWITCH ON', t: 0, tone: 'info' });
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
		this.pickups.push({ uid: this.uid++, x: f.x, y: f.y - 50, vx: vx + f.facing * 60, vy: -260, gun, heal: 0, life: 30, spin: (this.r() - 0.5) * 8, onGround: false });
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
			this.bullets.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: g.dmg * dmgMult, mine: f.player, life: g.reach / g.speed, pierce: g.pierce, hit: [], kind: g.kind === 'launcher' ? 'rocket' : 'bullet', from: f.uid });
		}
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
			e.asleep = false;
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
		e.laserCool -= dt;
		const pAlive = p.hp > 0 && !this.complete;
		// asleep until the player comes close (or shoots them)
		if (e.asleep) {
			if (pAlive && Math.abs(p.x - e.x) < 560 && Math.abs(p.y - e.y) < 420 && this.clearLine(e.x, e.y - 70, p.x, p.y - 70)) e.asleep = false;
			else {
				e.vx *= 0.8;
				return;
			}
		}
		e.react -= dt;
		const tx = p.x;
		const ty = p.y - BODY.shoulder + 6;
		const dx = tx - e.x;
		const dist = Math.abs(dx);
		e.facing = dx < 0 ? -1 : 1;
		const g = e.held ? gunOf(e.held.id) : null;
		const range = g ? (g.kind === 'melee' ? 30 : Math.min(spec.range, g.kind === 'shotgun' ? 140 : 9999)) : 30;

		const s = this.#shoulder(e);
		const want = Math.atan2(ty - s.y, tx - s.x);
		let da = want - e.aim;
		while (da > Math.PI) da -= Math.PI * 2;
		while (da < -Math.PI) da += Math.PI * 2;
		e.aim += da * Math.min(1, dt * (g?.kind === 'sniper' ? 3 : 6));
		e.err = Math.max(0.06, e.err - dt * 0.05);
		const sees = pAlive && this.clearLine(s.x, s.y, tx, ty);

		// walking (campers hold their spot)
		let move = 0;
		if (e.stun <= 0 && pAlive && e.kind !== 'camper') {
			if (!e.held) {
				const gun = this.pickups.find((k) => k.gun && k.heal >= 0 && Math.abs(k.x - e.x) < 220 && Math.abs(k.y - e.y) < 60 && k.onGround);
				if (gun && dist > 90) move = Math.sign(gun.x - e.x);
				else move = dist > 26 ? Math.sign(dx) : 0;
				if (gun && Math.abs(gun.x - e.x) < 24) this.#pickUp(e, false);
			} else if (dist > range + 50 || !sees) move = Math.sign(dx);
			else if (dist < range - 90 && range > 100) move = -Math.sign(dx);
			// don't walk off ledges into pits; hop small walls
			if (move && e.onGround) {
				const ahead = e.x + move * 18;
				if (!this.#footing(ahead, e.y) && !(p.y > e.y + 30 && this.#onGroundAt(ahead))) move = 0;
				if (move && e.wall === move && e.think <= 0) {
					e.vy = -JUMP;
					e.onGround = false;
				}
			}
			if (e.think <= 0) {
				e.think = 0.4 + this.r() * 0.6;
				if (e.onGround && p.y < e.y - 50 && this.r() < 0.5) {
					e.vy = -JUMP;
					e.onGround = false;
				} else if (e.onGround && p.y > e.y + 50 && e.y < FLOOR - 1) e.drop = 0.25;
			}
		}
		const sp = RUN * spec.speed * (g?.weight ?? 1);
		const acc = e.onGround ? 2400 : 1200;
		if (e.stun <= 0) e.vx += Math.max(-acc * dt, Math.min(acc * dt, move * sp - e.vx));

		if (!pAlive || e.react > 0 || e.stun > 0 || !sees) {
			e.charge = 0;
			return;
		}
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
		if (dist > 640) return;
		if (g.kind === 'shotgun' && dist > 380) return;
		if (g.kind === 'sniper') {
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

	#box(f: Fighter): Rect {
		const hw = BODY.half * f.scale, top = BODY.top * f.scale;
		return { x: f.x - hw, y: f.y - top, w: hw * 2, h: top };
	}

	#physics(f: Fighter, dt: number) {
		if (f.hp <= 0) return;
		f.stun -= dt;
		f.hurt -= dt;
		f.punch -= dt;
		f.drop -= dt;
		f.recoil = Math.max(0, f.recoil - dt * 8);
		const hw = BODY.half * f.scale, top = BODY.top * f.scale;
		const wasAir = !f.onGround;
		const fallV = f.vy;
		if (!f.player) f.vy += GRAV * dt;
		else if (f.dashT <= 0) {
			let k = f.vy < 0 ? (this.#held ? 1 : 1.9) : 1.6;
			if (this.#held && Math.abs(f.vy) < 130 && !f.slam) k = 0.5; // a little hang at the top
			if (f.slam) k = 2.4;
			f.vy = Math.min(f.slam ? 1900 : 1180, f.vy + P_GRAV * k * dt);
			// sliding down a wall you push into
			if (f.wall && !f.onGround && f.vy > 200 && this.#want === f.wall) {
				f.vy = 200;
				if (this.r() < 0.3) this.parts.push({ x: f.x + f.wall * 11, y: f.y - 70, vx: -f.wall * 30, vy: -30, life: 0.3, max: 0.3, kind: 'spark', r: 1.2 });
			}
		}
		// --- across: walls, doors, crates (the player pushes crates) ---
		const dxMove = f.vx * dt;
		f.x += dxMove;
		f.wall = 0;
		if (f.player && f.onGround && dxMove)
			for (const c of this.crates) {
				if (c.gone) continue;
				const overlapY = f.y > c.y + 2 && f.y - top < c.y + c.h;
				const hit = f.x + hw > c.x && f.x - hw < c.x + c.w;
				if (overlapY && hit) this.#pushCrate(c, dxMove > 0 ? f.x + hw - c.x : f.x - hw - (c.x + c.w));
			}
		for (const s of this.solids()) {
			if (!(f.y > s.y + 2 && f.y - top < s.y + s.h)) continue;
			if (f.x + hw > s.x && f.x - hw < s.x + s.w) {
				// which side: where they stood before this step (a fast dash must not tunnel through a door)
				if (f.x - dxMove < s.x + s.w / 2) {
					f.x = s.x - hw;
					if (!f.onGround) f.wall = 1;
					else if (!f.player) f.wall = 1;
				} else {
					f.x = s.x + s.w + hw;
					if (!f.onGround) f.wall = -1;
					else if (!f.player) f.wall = -1;
				}
				// pushing a crate: keep a slow walk instead of stopping dead
				f.vx = f.player && f.onGround && this.crates.includes(s as Crate) ? Math.sign(f.vx) * Math.min(Math.abs(f.vx), 170) : 0;
			}
		}
		// touching a wall in the air (for wall slides and wall jumps)
		if (f.player && !f.onGround) {
			f.wall = 0;
			for (const s of this.solids())
				if (f.y > s.y + 2 && f.y - top < s.y + s.h) {
					if (Math.abs(f.x + hw - s.x) < 3) f.wall = 1;
					else if (Math.abs(f.x - hw - (s.x + s.w)) < 3) f.wall = -1;
				}
		}
		// --- down / up ---
		const py = f.y;
		f.y += f.vy * dt;
		f.onGround = false;
		if (f.vy >= 0) {
			let land = Infinity;
			if (this.#onGroundAt(f.x) && py <= FLOOR + 0.5 && f.y >= FLOOR) land = FLOOR;
			if (f.drop <= 0) for (const p of this.level.platforms) if (py <= p.y + 0.5 && f.y >= p.y && f.x > p.x - 4 && f.x < p.x + p.w + 4) land = Math.min(land, p.y);
			for (const s of this.solids()) if (py <= s.y + 0.5 && f.y >= s.y && f.x + hw * 0.7 > s.x && f.x - hw * 0.7 < s.x + s.w) land = Math.min(land, s.y);
			if (land < Infinity) {
				f.y = land;
				f.vy = 0;
				f.onGround = true;
			}
		} else {
			for (const s of this.solids())
				if (f.x + hw * 0.7 > s.x && f.x - hw * 0.7 < s.x + s.w && py - top >= s.y + s.h - 0.5 && f.y - top < s.y + s.h) {
					f.y = s.y + s.h + top;
					f.vy = 0;
				}
			if (f.y - top < CEIL - 30) {
				f.y = CEIL - 30 + top;
				f.vy = 0;
			}
		}
		// the ground slam lands; a hard landing puffs dust
		if (f.player && f.onGround && wasAir) {
			if (f.slam) {
				f.slam = false;
				this.#slamWave(f, fallV);
			} else if (fallV > 420) {
				this.events.push({ t: 'land', hard: fallV > 900 });
				for (let i = 0; i < (fallV > 900 ? 10 : 5); i++) this.parts.push({ x: f.x + (this.r() - 0.5) * 20, y: f.y - 2, vx: (this.r() < 0.5 ? -1 : 1) * (60 + this.r() * 160), vy: -this.r() * 60, life: 0.4, max: 0.4, kind: 'smoke', r: 2.5 + this.r() * 2 });
			}
		}
		if (f.player && f.onGround && Math.abs(f.vx) > 80 && f.walk - f.stepAt > 1.45) {
			f.stepAt = f.walk;
			this.events.push({ t: 'step' });
		}
		if (f.x < hw) (f.x = hw), (f.vx = Math.max(0, f.vx));
		if (f.x > this.w - hw) (f.x = this.w - hw), (f.vx = Math.min(0, f.vx));
		if (f.onGround) f.walk += Math.abs(f.vx) * dt * 0.05;
		// fell into a pit
		if (f.y > H + 80) {
			if (f.player) this.#kill(f, 0, 0, false, true);
			else {
				f.hp = 0;
				this.enemies = this.enemies.filter((x) => x !== f);
				this.stats.kills++;
				this.score += 100;
			}
		}
	}

	#pushCrate(c: Crate, by: number) {
		const old = c.x;
		c.x += by * 0.9;
		const sol = this.solids(c);
		for (const s of sol) if (c.x + c.w > s.x && c.x < s.x + s.w && c.y + c.h > s.y + 2 && c.y < s.y + s.h) c.x = old;
		if (c.x < 0 || c.x + c.w > this.w) c.x = old;
	}

	#crates(dt: number) {
		for (const c of this.crates) {
			if (c.gone) continue;
			const py = c.y;
			c.vy += GRAV * dt;
			c.y += c.vy * dt;
			c.onGround = false;
			const cx = c.x + c.w / 2;
			let land = Infinity;
			if ((this.#onGroundAt(c.x + 8) || this.#onGroundAt(c.x + c.w - 8)) && py + c.h <= FLOOR + 0.5 && c.y + c.h >= FLOOR) land = FLOOR;
			for (const p of this.level.platforms) if (py + c.h <= p.y + 0.5 && c.y + c.h >= p.y && cx > p.x && cx < p.x + p.w) land = Math.min(land, p.y);
			for (const s of this.solids(c)) if (py + c.h <= s.y + 0.5 && c.y + c.h >= s.y && c.x + c.w > s.x + 4 && c.x < s.x + s.w - 4) land = Math.min(land, s.y);
			if (land < Infinity) {
				c.y = land - c.h;
				c.vy = 0;
				c.onGround = true;
			}
			if (c.y > H + 100) c.gone = true;
		}
	}

	#slamWave(f: Fighter, fall: number) {
		const big = this.skills.has('quake');
		this.shake = big ? 18 : 10;
		this.events.push({ t: 'slam', big });
		if (big) this.parts.push({ x: f.x, y: f.y, vx: 0, vy: 0, life: 0.45, max: 0.45, kind: 'ring', r: 40 });
		for (let i = 0; i < (big ? 30 : 18); i++) this.parts.push({ x: f.x + (this.r() - 0.5) * 30, y: f.y, vx: (this.r() - 0.5) * 520, vy: -this.r() * 260, life: 0.6, max: 0.6, kind: i % 2 ? 'smoke' : 'debris', r: 3 + this.r() * 3 });
		const power = Math.min(1, Math.max(0.5, fall / 1400));
		for (const e of this.enemies) {
			if (e.hp <= 0) continue;
			const d = Math.hypot(e.x - f.x, e.y - f.y);
			if (d > (big ? 170 : 100)) continue;
			const dir = e.x < f.x ? -1 : 1;
			e.asleep = false;
			e.stun = big ? 1.5 : 0.7;
			e.vx = dir * (big ? 520 : 380);
			e.vy = big ? -480 : -340;
			this.#damage(e, (big ? 95 : 45) * power, false, f, dir * 420, -380);
		}
	}

	#puzzles(dt: number) {
		const p = this.player;
		const alive = p.hp > 0;
		// doors: clear the area, bring the key, or flip the switch
		for (const b of this.blocks) {
			if (b.kind !== 'door') continue;
			if (!b.open && b.lock) {
				if ('kill' in b.lock) {
					const z = b.lock.kill;
					if (!this.enemies.some((e) => e.zone === z && e.hp > 0)) b.open = true;
				} else if ('key' in b.lock) {
					if (alive && this.have.has(b.lock.key) && Math.abs(p.x - (b.x + b.w / 2)) < 60) {
						b.open = true;
						this.have.delete(b.lock.key);
					}
				}
				if (b.open) {
					this.events.push({ t: 'door' });
					this.popups.push({ x: b.x + b.w / 2, y: FLOOR - 170, text: 'DOOR OPEN', t: 0, tone: 'info' });
				}
			}
			if (b.open && b.openT < 1) b.openT = Math.min(1, b.openT + dt * 1.6);
		}
		if (!alive) return;
		// key cards
		for (const k of this.keys) {
			if (k.taken) continue;
			if (Math.abs(k.x - p.x) < 26 && k.y > p.y - BODY.top - 10 && k.y < p.y + 10) {
				k.taken = true;
				this.have.add(k.colour);
				this.events.push({ t: 'key' });
				this.popups.push({ x: p.x, y: p.y - 110, text: `${k.colour.toUpperCase()} KEY`, t: 0, tone: 'info' });
			}
		}
		// lasers
		for (const f of [p, ...this.enemies]) {
			if (f.hp <= 0 || f.laserCool > 0 || (f.player && f.safeT > 0)) continue;
			for (const l of this.lasers) {
				if (!l.on) continue;
				const b = this.#box(f);
				if (b.x < l.x + 2 && b.x + b.w > l.x - 2 && b.y < l.bottom && b.y + b.h > l.top) {
					f.laserCool = 0.4;
					const dir = f.x < l.x ? -1 : 1;
					f.vx = dir * 380;
					f.vy = Math.min(f.vy, -200);
					f.stun = 0.3;
					this.#damage(f, f.player ? 30 : 60, false, null, dir * 300, -200);
					for (let i = 0; i < 8; i++) this.parts.push({ x: l.x, y: f.y - 50, vx: (this.r() - 0.5) * 240, vy: -this.r() * 200, life: 0.3, max: 0.3, kind: 'spark', r: 1.6 });
				}
			}
		}
		p.laserCool -= dt;
		// barrels with a lit fuse (set off by another blast)
		for (const b of this.barrels) {
			if (!b.alive || b.fuse <= 0) continue;
			b.fuse -= dt;
			if (b.fuse <= 0) this.#blowBarrel(b);
		}
		// checkpoints
		const cps = this.level.checkpoints;
		while (this.checkpoint < cps.length && p.x >= cps[this.checkpoint]) {
			this.respawnX = cps[this.checkpoint];
			this.checkpoint++;
			this.windUsed = false;
			this.grenades = this.skills.has('frag') ? 3 : 0;
			this.events.push({ t: 'checkpoint' });
			this.popups.push({ x: 0, y: 0, text: 'CHECKPOINT', t: 0, tone: 'combo', screen: true });
		}
		// the exit
		if (!this.complete && p.x >= this.level.exit && p.onGround) {
			this.complete = true;
			this.over = true;
			p.vx = 0;
			this.events.push({ t: 'complete' });
			this.popups.push({ x: 0, y: 0, text: 'LEVEL COMPLETE', t: 0, tone: 'wave', screen: true });
		}
	}

	#blowBarrel(b: Barrel) {
		if (!b.alive) return;
		b.alive = false;
		this.#boom(b.x, b.y - 20, true, 1.2);
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
		if (f.player && (f.safeT > 0 || this.complete)) return;
		const mult = head ? (by?.player && this.skills.has('head') ? 2.5 : 2) : 1;
		let real = dmg * mult;
		f.hurt = 0.12;
		const hx = f.x;
		const hy = f.y - (head ? BODY.head : 44) * f.scale;
		for (let i = 0; i < (head ? 10 : 5); i++) this.parts.push({ x: hx, y: hy, vx: kx * 0.5 + (this.r() - 0.5) * 260, vy: ky * 0.3 - this.r() * 260, life: 1.4, max: 1.4, kind: 'ketchup', r: 2 + this.r() * 2.5 });
		if (f.player) {
			f.quiet = 0;
			if (f.hp - real <= 0 && this.skills.has('wind') && !this.windUsed) {
				this.windUsed = true;
				real = f.hp - 1;
				f.safeT = 1;
				this.popups.push({ x: f.x, y: f.y - 115, text: 'SECOND WIND', t: 0, tone: 'combo' });
			}
			f.hp -= real;
			this.events.push({ t: 'hurt' });
			this.shake = Math.max(this.shake, 6);
			if (f.hp <= 0) this.#kill(f, kx, ky, head);
			return;
		}
		f.hp -= real;
		f.asleep = false;
		if (by?.player) {
			this.stats.hits++;
			this.events.push({ t: 'hit', head, mine: true });
			if (head && this.skills.has('head') && this.player.held && gunOf(this.player.held.id).kind !== 'melee') this.player.held.ammo++;
		}
		if (f.hp <= 0) {
			this.#kill(f, kx, ky, head);
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
		if (this.r() < (f.kind === 'jugg' ? 1 : 0.12)) this.pickups.push({ uid: this.uid++, x: f.x, y: f.y - 40, vx: 0, vy: -300, gun: null, heal: f.kind === 'jugg' ? 60 : 30, life: 20, spin: 0, onGround: false });
	}

	#kill(f: Fighter, kx: number, ky: number, head: boolean, pit = false) {
		f.hp = 0;
		if (f.held && !f.player) {
			const g = gunOf(f.held.id);
			const ammo = g.kind === 'melee' ? 0 : Math.max(1, Math.round(g.mag * (0.4 + this.r() * 0.6) * (this.skills.has('mags') ? 1.5 : 1)));
			this.#dropGun(f, { id: f.held.id, ammo }, kx * 0.2);
			f.held = null;
		}
		if (!pit) {
			this.corpses.push({ f, x: f.x, y: f.y - 46 * f.scale, vx: f.vx + kx * 0.9, vy: Math.min(f.vy, 0) + ky - 120, ang: 0, spin: (kx >= 0 ? 1 : -1) * (6 + this.r() * 8) * (head ? 1.4 : 1), t: 0, still: false });
			for (let i = 0; i < 16; i++) this.parts.push({ x: f.x, y: f.y - 50 * f.scale, vx: kx * 0.4 + (this.r() - 0.5) * 420, vy: -this.r() * 420, life: 1.6, max: 1.6, kind: 'ketchup', r: 2 + this.r() * 3.5 });
		}
		if (f.player) {
			this.deaths++;
			this.respawnT = 1.6;
			this.holkOn = false;
			this.events.push({ t: 'dead' });
		} else this.enemies = this.enemies.filter((e) => e !== f);
		if (this.corpses.length > 22) this.corpses.shift();
	}

	#boom(x: number, y: number, mine: boolean, size = 1) {
		this.events.push({ t: 'boom' });
		this.shake = 14 * size;
		for (let i = 0; i < 30; i++) {
			const a = this.r() * Math.PI * 2;
			const v = 80 + this.r() * 460;
			this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.5 + this.r() * 0.6, max: 1.1, kind: i < 9 ? 'boom' : i < 20 ? 'spark' : 'smoke', r: i < 9 ? (26 + this.r() * 20) * size : 3 + this.r() * 6 });
		}
		const R = 110 * size;
		for (const f of [this.player, ...this.enemies]) {
			if (f.hp <= 0) continue;
			const d = Math.hypot(f.x - x, f.y - 46 - y);
			if (d > R) continue;
			const k = 1 - d / R;
			const dir = f.x < x ? -1 : 1;
			const dmg = (f.player ? (mine ? 28 : 45) : 170) * k + 10;
			f.vx += dir * 520 * k;
			f.vy = -560 * k - 120;
			f.stun = 0.5;
			f.asleep = false;
			this.#damage(f, dmg, false, mine ? this.player : null, dir * 520 * k, -560 * k);
		}
		// cracked walls break, other barrels go off
		for (const b of this.blocks) {
			if (b.kind !== 'cracked' || b.gone) continue;
			const nx = Math.max(b.x, Math.min(x, b.x + b.w)), ny = Math.max(b.y, Math.min(y, b.y + b.h));
			if (Math.hypot(nx - x, ny - y) < R + 10) {
				b.gone = true;
				this.events.push({ t: 'door' });
				this.popups.push({ x: b.x + b.w / 2, y: FLOOR - 170, text: 'WALL DOWN', t: 0, tone: 'info' });
				for (let i = 0; i < 28; i++) this.parts.push({ x: b.x + this.r() * b.w, y: b.y + this.r() * b.h, vx: (this.r() - 0.5) * 520, vy: -this.r() * 420, life: 1.2, max: 1.2, kind: 'debris', r: 2 + this.r() * 3.5 });
			}
		}
		for (const b of this.barrels) if (b.alive && b.fuse <= 0 && Math.hypot(b.x - x, b.y - 20 - y) < R) b.fuse = 0.15;
	}

	#world(dt: number, pdt: number) {
		const fighters = [this.player, ...this.enemies];
		const sol = this.solids();
		const inSolid = (x: number, y: number) => {
			for (const s of sol) if (x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h) return true;
			return false;
		};
		for (const b of this.bullets) {
			const x0 = b.x;
			const y0 = b.y;
			if (b.kind === 'thrown' || b.kind === 'frag') b.vy += GRAV * 0.55 * dt;
			if (b.kind === 'rocket') this.parts.push({ x: b.x, y: b.y, vx: -b.vx * 0.05, vy: -30, life: 0.5, max: 0.5, kind: 'smoke', r: 5 });
			b.x += b.vx * dt;
			b.y += b.vy * dt;
			b.life -= dt;
			if (b.kind === 'frag') {
				// bounces, then goes off
				if (inSolid(b.x, b.y) || (b.y >= FLOOR - 3 && this.#onGroundAt(b.x))) {
					if (b.y >= FLOOR - 3) b.y = FLOOR - 3;
					else b.x = x0;
					b.vy = -Math.abs(b.vy) * 0.35;
					b.vx *= 0.55;
				}
				if (b.life <= 0) this.#boom(b.x, b.y, true, 1);
				continue;
			}
			// switches and barrels take bullets
			{
				for (const s of this.switches) if (!s.on && Math.abs(b.x - s.x) < 12 && Math.abs(b.y - s.y) < 16) {
					this.#flip(s);
					b.life = 0;
				}
				for (const br of this.barrels) if (br.alive && b.mine && Math.abs(b.x - br.x) < 13 && b.y > br.y - 38 && b.y < br.y) {
					this.#blowBarrel(br);
					b.life = 0;
				}
			}
			if (b.life <= 0) continue;
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
			// walls, the floor
			if (b.life > 0 && (inSolid(b.x, b.y) || (b.y >= FLOOR && this.#onGroundAt(b.x)))) {
				if (b.kind === 'rocket') this.#boom(b.x - Math.sign(b.vx) * 6, Math.min(b.y, FLOOR - 4), b.mine);
				else if (b.kind === 'bullet') for (let i = 0; i < 3; i++) this.parts.push({ x: b.x, y: b.y, vx: (this.r() - 0.5) * 200, vy: -this.r() * 200, life: 0.25, max: 0.25, kind: 'spark', r: 1.5 });
				if (b.kind === 'thrown') {
					b.x = x0;
					b.y = Math.min(y0, FLOOR - 8);
				}
				b.life = 0;
			}
			if (b.life <= 0 && b.kind === 'thrown' && b.gun) {
				const usable = b.gun.ammo > 0 || gunOf(b.gun.id).kind === 'melee';
				this.pickups.push({ uid: this.uid++, x: Math.max(20, Math.min(this.w - 20, b.x)), y: Math.min(b.y, FLOOR - 8), vx: -b.vx * 0.15, vy: -200, gun: b.gun, heal: usable ? 0 : -1, life: usable ? 30 : 1.2, spin: b.spin ?? 10, onGround: false });
			}
			if (b.x < -200 || b.x > this.w + 200 || b.y < -300 || b.y > H + 200) b.life = 0;
		}
		this.bullets = this.bullets.filter((b) => b.life > 0);

		// pickups fall onto the ground, platforms and blocks
		const p = this.player;
		for (const k of this.pickups) {
			k.life -= dt;
			if (!k.onGround) {
				const py = k.y;
				k.vy += GRAV * dt;
				k.x += k.vx * dt;
				k.y += k.vy * dt;
				k.spin *= 0.99;
				let land = Infinity;
				if (this.#onGroundAt(k.x) && py <= FLOOR - 6 && k.y >= FLOOR - 6) land = FLOOR - 6;
				for (const pl of this.level.platforms) if (py <= pl.y - 6 && k.y >= pl.y - 6 && k.x > pl.x && k.x < pl.x + pl.w) land = Math.min(land, pl.y - 6);
				for (const s of sol) if (py <= s.y - 6 && k.y >= s.y - 6 && k.x > s.x && k.x < s.x + s.w) land = Math.min(land, s.y - 6);
				if (land < Infinity) {
					k.y = land;
					k.onGround = true;
				}
				if (inSolid(k.x, k.y)) {
					k.x -= k.vx * dt * 1.5;
					k.vx = -k.vx * 0.4;
				}
				if (k.y > H + 100) k.life = 0;
			}
			if (k.heal > 0 && p.hp > 0 && Math.hypot(k.x - p.x, k.y - (p.y - 20)) < 40 && p.hp < p.maxHp) {
				p.hp = Math.min(p.maxHp, p.hp + k.heal);
				this.popups.push({ x: p.x, y: p.y - 110, text: `+${k.heal} HP`, t: 0, tone: 'heal' });
				this.events.push({ t: 'pickup', id: null });
				k.life = 0;
			}
		}
		this.pickups = this.pickups.filter((k) => k.life > 0);
		if (this.pickups.length > 30) {
			const loose = this.pickups.filter((k) => k.life < 1e8);
			if (loose.length > 16) this.pickups = this.pickups.filter((k) => k.life > 1e8 || loose.indexOf(k) >= loose.length - 16);
		}

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
			const off = 9 * c.f.scale;
			if (this.#onGroundAt(c.x) && py <= FLOOR - off + 1 && c.y >= FLOOR - off) ground(FLOOR - off);
			else if (c.vy > 0) {
				for (const pl of this.level.platforms) if (py <= pl.y - off && c.y >= pl.y - off && c.x > pl.x && c.x < pl.x + pl.w) ground(pl.y - off);
				for (const s of sol) if (py <= s.y - off && c.y >= s.y - off && c.x > s.x && c.x < s.x + s.w) ground(s.y - off);
			}
			if (inSolid(c.x, c.y)) {
				c.x -= c.vx * dt;
				c.vx = -c.vx * 0.4;
			}
			if (c.y > H + 200) c.still = true;
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
			if ((q.kind === 'ketchup' || q.kind === 'debris') && q.vy > 0) {
				let land = q.y >= FLOOR && this.#onGroundAt(q.x) ? FLOOR : 0;
				if (!land) for (const pl of this.level.platforms) if (py <= pl.y && q.y >= pl.y && q.x > pl.x && q.x < pl.x + pl.w) land = pl.y;
				if (land) {
					if (q.kind === 'ketchup') {
						this.splats.push({ x: q.x, y: land, r: q.r * (1.6 + this.r()), a: 0.85 });
						q.life = 0;
					} else {
						q.y = land;
						q.vy = -q.vy * 0.25;
						q.vx *= 0.5;
					}
				}
			}
			if (q.kind === 'shell' && q.y >= FLOOR - 2 && this.#onGroundAt(q.x)) {
				q.y = FLOOR - 2;
				q.vy = -q.vy * 0.3;
				q.vx *= 0.6;
			}
		}
		this.parts = this.parts.filter((q) => q.life > 0);
		if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
		if (this.splats.length > 160) this.splats.splice(0, this.splats.length - 160);
		for (const u of this.popups) u.t += pdt;
		this.popups = this.popups.filter((u) => u.t < (u.tone === 'wave' ? 2.2 : 1.3));
		this.shake = Math.max(0, this.shake - pdt * 40);
	}
}
