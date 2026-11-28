/**
 * Abscars Madness: the headquarters (2026-11-28, the user: "remove the main menu, you walk around your own
 * headquarters, and picking things on the menu takes you to different places in the HQ", "a bit Metroidvania").
 * The menu is now a small side-view base you walk through: two floors of three rooms, joined by ladders, each room
 * with one station (locker = operator, war room = levels, helipad = deploy, armory = starting gun, lab = skill tree,
 * comms = settings). Pure: no DOM; MadnessHQ.svelte runs it, hqRender.ts draws it, scripts/madness-hq.test.js tests it.
 */

/** the HQ is 3 rooms wide and 2 floors tall; the camera shows one floor (VIEW_H tall) */
export const HQ_W = 1440;
export const ROOM_W = 480;
/** feet height of the two floors, and their ceilings */
export const FLOORS = [250, 500] as const;
export const CEILS = [20, 282] as const;
export const VIEW_H = 270;

export type Station = 'operator' | 'levels' | 'deploy' | 'gun' | 'skills' | 'settings';
export type RoomId = 'locker' | 'war' | 'heli' | 'armory' | 'lab' | 'comms';

export interface Room {
	id: RoomId;
	floor: 0 | 1;
	x0: number;
	x1: number;
	station: Station | null;
	/** where the station stands (its middle) */
	sx: number;
}

export const ROOMS: Room[] = [
	{ id: 'locker', floor: 0, x0: 0, x1: 480, station: 'operator', sx: 190 },
	{ id: 'war', floor: 0, x0: 480, x1: 960, station: 'levels', sx: 735 },
	{ id: 'heli', floor: 0, x0: 960, x1: 1440, station: 'deploy', sx: 1250 },
	{ id: 'armory', floor: 1, x0: 0, x1: 480, station: 'gun', sx: 230 },
	{ id: 'lab', floor: 1, x0: 480, x1: 960, station: 'skills', sx: 735 },
	{ id: 'comms', floor: 1, x0: 960, x1: 1440, station: 'settings', sx: 1220 }
];
export const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));

/** ladders between the floors (x of the middle) */
export const LADDERS = [400, 1020] as const;
/** one-way ledges you can jump onto (and drop through with down) */
export interface Ledge {
	x: number;
	y: number;
	w: number;
}
export const LEDGES: Ledge[] = [
	{ x: 34, y: 196, w: 92 }, // the top bunk
	{ x: 560, y: 186, w: 104 }, // the war room catwalk
	{ x: 880, y: 140, w: 64 }, // a high vent ledge only a double jump reaches (the secret stash)
	{ x: 290, y: 452, w: 74 }, // ammo crates
	{ x: 842, y: 432, w: 96 }, // the lab catwalk
	{ x: 1330, y: 448, w: 70 } // the comms server rack
];
/** the secret: standing on the vent ledge opens the hidden stash (an easter egg, nothing to win) */
export const SECRET_LEDGE = 2;

const GRAV = 1500;
const WALK = 150;
const JUMP = 520;
const JUMP2 = 470;
const CLIMB = 120;
const DASH_V = 420;
const DASH_T = 0.16;
/** how near a station you must stand to use it */
export const NEAR = 46;
/** body height (head top above the feet), like the game's BODY.top */
const BODY_TOP = 92;

export interface HqInput {
	left: boolean;
	right: boolean;
	jump: boolean;
	down: boolean;
	dash: boolean;
}
export const HQ_NO_INPUT: HqInput = { left: false, right: false, jump: false, down: false, dash: false };

export type HqEvent = { t: 'jump'; n: number } | { t: 'land' } | { t: 'step' } | { t: 'room'; id: RoomId } | { t: 'arrive'; station: Station } | { t: 'secret' } | { t: 'dash' };

export interface Walker {
	x: number;
	y: number;
	vx: number;
	vy: number;
	facing: 1 | -1;
	onGround: boolean;
	/** standing on ledge i (-1 = a floor) */
	ledge: number;
	climbing: number | null;
	jumps: number;
	drop: number;
	dashT: number;
	dashCool: number;
	walk: number;
	stepAt: number;
}

export const floorOf = (y: number): 0 | 1 => (y > FLOORS[0] + 10 ? 1 : 0);
export function roomAt(x: number, y: number): Room {
	const f = floorOf(y);
	return ROOMS.find((r) => r.floor === f && x >= r.x0 && x < r.x1) ?? ROOMS[f * 3];
}

export class Hq {
	p: Walker;
	events: HqEvent[] = [];
	t = 0;
	room: RoomId;
	/** walking somewhere by itself (a tap on a station) */
	target: { x: number; floor: 0 | 1; station: Station | null } | null = null;
	secretFound = false;
	#prev: HqInput = { ...HQ_NO_INPUT };

	constructor(at: RoomId = 'locker') {
		const r = ROOM_BY_ID.get(at) ?? ROOMS[0];
		this.p = { x: r.sx - 60, y: FLOORS[r.floor], vx: 0, vy: 0, facing: 1, onGround: true, ledge: -1, climbing: null, jumps: 0, drop: 0, dashT: 0, dashCool: 0, walk: 0, stepAt: 0 };
		this.room = r.id;
	}

	/** the station you stand at, if any */
	near(): Room | null {
		const p = this.p;
		if (p.climbing !== null || !p.onGround) return null;
		const f = floorOf(p.y);
		for (const r of ROOMS) if (r.station && r.floor === f && Math.abs(p.x - r.sx) < NEAR) return r;
		return null;
	}

	/** walk to a station by yourself (up or down a ladder if needed) */
	goTo(station: Station) {
		const r = ROOMS.find((x) => x.station === station);
		if (r) this.target = { x: r.sx, floor: r.floor, station };
	}
	/** fast travel (the map): stand in front of a room's station at once */
	teleport(id: RoomId) {
		const r = ROOM_BY_ID.get(id);
		if (!r) return;
		const p = this.p;
		p.x = r.sx - 34;
		p.y = FLOORS[r.floor];
		p.vx = p.vy = 0;
		p.onGround = true;
		p.ledge = -1;
		p.climbing = null;
		p.facing = 1;
		this.target = null;
		this.#roomCheck();
	}

	step(dt: number, inp: HqInput) {
		dt = Math.min(dt, 0.05);
		this.events = [];
		this.t += dt;
		const p = this.p;
		const press = (k: keyof HqInput) => inp[k] && !this.#prev[k];
		const manual = inp.left || inp.right || inp.jump || inp.down || inp.dash;
		if (manual) this.target = null;
		let want = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
		let up = inp.jump;
		let downHeld = inp.down;

		// walking by itself: to the ladder first when the station is on the other floor
		if (this.target) {
			const tg = this.target;
			const f = floorOf(p.y);
			if (p.climbing !== null) {
				up = tg.floor === 0;
				downHeld = tg.floor === 1;
			} else if (f !== tg.floor) {
				const lx = LADDERS.reduce((a, b) => (Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a), LADDERS[0] as number);
				if (Math.abs(lx - p.x) > 6) want = Math.sign(lx - p.x);
				else this.#climb(lx, tg.floor === 0 ? -1 : 1);
			} else if (Math.abs(tg.x - p.x) > 5) want = Math.sign(tg.x - p.x);
			else {
				this.target = null;
				p.vx = 0;
				if (tg.station) this.events.push({ t: 'arrive', station: tg.station });
			}
		}

		p.dashCool -= dt;
		p.drop -= dt;

		if (p.climbing !== null) {
			p.vx = 0;
			p.vy = up ? -CLIMB : downHeld ? CLIMB : 0;
			p.y += p.vy * dt;
			p.walk += Math.abs(p.vy) * dt * 0.05;
			if (p.y <= FLOORS[0] && p.vy < 0) this.#standOn(FLOORS[0]);
			else if (p.y >= FLOORS[1]) this.#standOn(FLOORS[1]);
			else if (want && p.y > CEILS[1] + BODY_TOP) {
				// let go in the bottom room: drop to its floor
				p.climbing = null;
				p.onGround = false;
				p.facing = want > 0 ? 1 : -1;
			}
			this.#roomCheck();
			this.#prev = { ...inp };
			return;
		}

		// start climbing: down at a ladder's top, up at its foot
		const lad = LADDERS.find((lx) => Math.abs(lx - p.x) < 16);
		if (lad !== undefined && p.onGround && p.ledge < 0) {
			const f = floorOf(p.y);
			if (f === 0 && press('down')) {
				this.#climb(lad, 1);
				this.#prev = { ...inp };
				return;
			}
			if (f === 1 && press('jump') && !manualJumpWanted(inp)) {
				this.#climb(lad, -1);
				this.#prev = { ...inp };
				return;
			}
		}

		if (want) p.facing = want > 0 ? 1 : -1;
		if (p.dashT > 0) {
			p.dashT -= dt;
			p.vx = p.facing * DASH_V;
		} else {
			const acc = p.onGround ? 1400 : 900;
			p.vx += Math.max(-acc * dt, Math.min(acc * dt, want * WALK - p.vx));
		}
		if (press('dash') && p.dashCool <= 0) {
			p.dashT = DASH_T;
			p.dashCool = 0.55;
			this.events.push({ t: 'dash' });
		}

		if (press('jump')) {
			if (p.onGround) {
				p.vy = -JUMP;
				p.onGround = false;
				p.jumps = 1;
				this.events.push({ t: 'jump', n: 1 });
			} else if (p.jumps < 2) {
				p.vy = -JUMP2;
				p.jumps = 2;
				this.events.push({ t: 'jump', n: 2 });
			}
		}
		if (press('down') && p.onGround && p.ledge >= 0) {
			p.drop = 0.2;
			p.onGround = false;
			p.ledge = -1;
		}

		// move + land
		const py = p.y;
		if (!p.onGround) p.vy = Math.min(900, p.vy + GRAV * (p.vy < 0 && !inp.jump && !this.target ? 1.8 : 1) * dt);
		p.x = Math.max(14, Math.min(HQ_W - 14, p.x + p.vx * dt));
		if (!p.onGround) {
			p.y += p.vy * dt;
			const f = floorOf(py);
			// head against the ceiling
			if (p.y - BODY_TOP < CEILS[f] && p.vy < 0) {
				p.y = CEILS[f] + BODY_TOP;
				p.vy = 0;
			}
			let land: number | null = null;
			let li = -1;
			if (p.vy >= 0) {
				if (p.drop <= 0)
					LEDGES.forEach((l, i) => {
						if (py <= l.y && p.y >= l.y && p.x > l.x && p.x < l.x + l.w && (land === null || l.y < land)) {
							land = l.y;
							li = i;
						}
					});
				const fl = FLOORS[f];
				if (land === null && py <= fl && p.y >= fl) land = fl;
			}
			if (land !== null) {
				const hard = p.vy > 380;
				this.#standOn(land, li);
				if (hard) this.events.push({ t: 'land' });
				if (li === SECRET_LEDGE && !this.secretFound) {
					this.secretFound = true;
					this.events.push({ t: 'secret' });
				}
			}
		} else if (p.ledge >= 0) {
			const l = LEDGES[p.ledge];
			if (p.x < l.x || p.x > l.x + l.w) {
				p.onGround = false;
				p.ledge = -1;
			}
		}
		if (p.onGround && Math.abs(p.vx) > 40) {
			p.walk += Math.abs(p.vx) * dt * 0.05;
			if (p.walk - p.stepAt > 1.45) {
				p.stepAt = p.walk;
				this.events.push({ t: 'step' });
			}
		}
		this.#roomCheck();
		this.#prev = { ...inp };
	}

	#climb(lx: number, dir: 1 | -1) {
		const p = this.p;
		p.climbing = lx;
		p.x = lx;
		p.vx = 0;
		p.vy = dir * CLIMB;
		p.onGround = false;
		p.ledge = -1;
		p.y += dir * 2;
	}
	#standOn(y: number, ledge = -1) {
		const p = this.p;
		p.y = y;
		p.vy = 0;
		p.onGround = true;
		p.climbing = null;
		p.jumps = 0;
		p.ledge = ledge;
	}
	#roomCheck() {
		const r = roomAt(this.p.x, this.p.y);
		if (r.id !== this.room) {
			this.room = r.id;
			this.events.push({ t: 'room', id: r.id });
		}
	}
}

/** at a ladder's foot, jump climbs instead of jumping, unless you also steer sideways */
function manualJumpWanted(inp: HqInput) {
	return inp.left || inp.right;
}
