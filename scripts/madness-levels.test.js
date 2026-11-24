// Abscars Madness' levels (src/lib/mayhem/levels.ts): every level can be finished. Geometry rules from the
// engine's physics: a jump rises ≈ 150 px and carries ≈ 200 px; the player is 91 px tall and grabs a key within
// ≈ 100 px above their feet; a pistol carries 900 px.
// Chapter 2 (2026-11-23) also counts on the double jump, the dash, moving platforms, jump pads and wall-jump
// shafts. Their reach is measured on the real engine below, so the rules can't drift away from the game.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FLOOR, LEVELS, levelOpen, pointsOf } from '../src/lib/mayhem/levels.ts';
import { Mayhem, NO_INPUT, PAD_W } from '../src/lib/mayhem/engine.ts';

const RISE = 140;
const ACROSS = 190;
const CRATE = 44;
// chapter 2: double jump, double jump + dash (kept well under what the engine measures)
const DBL_RISE = 260;
const DBL_ACROSS = 320;
const DASH_RISE = 120;
const DASH_ACROSS = 460;
const GRAV = 2000;

/** the surfaces the player can stand on and reach from the start (doors treated as open) */
function reachable(l) {
	const tech = (l.chapter ?? 1) === 2;
	const surf = [
		...l.ground.map(([a, b]) => ({ x0: a, x1: b, y: FLOOR })),
		...l.platforms.map((p) => ({ x0: p.x, x1: p.x + p.w, y: p.y })),
		...l.blocks.filter((b) => b.kind === 'wall' || b.kind === 'shelf').map((b) => ({ x0: b.x, x1: b.x + b.w, y: b.y })),
		// a crate can be pushed anywhere along the ground it stands on: its top is a step there
		...l.crates.map((c) => {
			const seg = l.ground.find(([a, b]) => c.x >= a && c.x <= b);
			return { x0: seg[0], x1: seg[1], y: FLOOR - CRATE };
		})
	];
	// a moving platform: both ends are surfaces, and riding it takes you from one to the other
	const rides = [];
	for (const m of l.movers ?? []) {
		const a = surf.push({ x0: m.x, x1: m.x + m.w, y: m.y }) - 1;
		const b = surf.push({ x0: m.x + m.dx, x1: m.x + m.dx + m.w, y: m.y + m.dy }) - 1;
		rides.push([a, b], [b, a]);
	}
	const sy = l.startY ?? FLOOR;
	const first = surf.findIndex((s) => s.y === sy && l.start >= s.x0 && l.start <= s.x1);
	assert.ok(first >= 0, 'the start stands on something');
	const gapOf = (a, b) => Math.max(0, b.x0 - a.x1, a.x0 - b.x1);
	const link = (a, b) => {
		const gap = gapOf(a, b);
		const up = a.y - b.y;
		if ((up <= RISE && gap <= ACROSS) || (up < 0 && gap <= ACROSS + 80)) return true;
		if (!tech) return false;
		if (up <= DBL_RISE && gap <= DBL_ACROSS) return true;
		if (up <= DASH_RISE && gap <= DASH_ACROSS) return true;
		if (up < 0 && gap <= DASH_ACROSS) return true;
		// a jump pad on a: a launch straight up, then a normal jump's carry sideways
		for (const pd of l.pads ?? []) {
			if ((pd.y ?? FLOOR) !== a.y || pd.x + PAD_W < a.x0 || pd.x > a.x1) continue;
			const high = (0.85 * (pd.power ?? 1450) ** 2) / (2 * GRAV);
			const g2 = Math.max(0, b.x0 - (pd.x + PAD_W), pd.x - b.x1);
			if (up <= high && g2 <= ACROSS) return true;
		}
		return false;
	};
	// wall-jump shafts: two tall walls facing each other close enough to jump between
	const walls = l.blocks.filter((b) => b.kind === 'wall' && b.h >= 300);
	const shafts = [];
	for (const a of walls)
		for (const b of walls) {
			const inner = b.x - (a.x + a.w);
			const top = Math.max(a.y, b.y), bottom = Math.min(a.y + a.h, b.y + b.h);
			if (a === b || inner < 60 || inner > 170 || bottom - top < 300) continue;
			const ia = surf.findIndex((s) => s.x0 === a.x && s.y === a.y);
			const ib = surf.findIndex((s) => s.x0 === b.x && s.y === b.y);
			shafts.push({ x0: a.x + a.w, x1: b.x, bottom, tops: [ia, ib] });
		}
	const ok = new Set([first]);
	let grew = true;
	while (grew) {
		grew = false;
		for (let i = 0; i < surf.length; i++) {
			if (ok.has(i)) continue;
			for (const j of ok) {
				if (link(surf[j], surf[i]) || rides.some(([a, b]) => a === j && b === i)) {
					ok.add(i);
					grew = true;
					break;
				}
			}
		}
		if (tech)
			for (const sh of shafts) {
				if (sh.tops.every((t) => ok.has(t))) continue;
				// standing on the shaft's floor (between the walls, not far below their bottom ends)
				const inside = [...ok].some((j) => surf[j].x0 < sh.x1 && surf[j].x1 > sh.x0 && surf[j].y >= sh.bottom - 20 && surf[j].y - sh.bottom <= 140);
				if (inside) {
					for (const t of sh.tops) ok.add(t);
					grew = true;
				}
			}
	}
	return [...ok].map((i) => surf[i]);
}

for (const l of LEVELS) {
	test(`${l.id} ${l.name} can be finished`, () => {
		const tech = (l.chapter ?? 1) === 2;
		const segs = [...l.ground].sort((a, b) => a[0] - b[0]);
		const onGround = (x) => segs.some(([a, b]) => x >= a && x <= b);
		const sy = l.startY ?? FLOOR, ey = l.exitY ?? FLOOR;
		if (sy === FLOOR) assert.ok(onGround(l.start), 'start on the ground');
		if (ey === FLOOR) assert.ok(onGround(l.exit), 'exit on the ground');
		assert.ok(l.exit < l.w && (l.exitY !== undefined || l.start < l.exit));
		for (let i = 1; i < segs.length; i++) {
			const gap = segs[i][0] - segs[i - 1][1];
			const bridged = [...l.platforms, ...(l.movers ?? []).map((m) => ({ x: Math.min(m.x, m.x + m.dx), w: m.w + Math.abs(m.dx) }))].some((p) => p.x < segs[i][0] && p.x + p.w > segs[i - 1][1]);
			assert.ok(gap <= (tech ? DASH_ACROSS : 200) || bridged || l.top !== undefined, `pit ${segs[i - 1][1]}–${segs[i][0]} is jumpable`);
		}
		const surf = reachable(l);
		const standsOn = (x, y) => surf.some((s) => s.y === y && x >= s.x0 && x <= s.x1);
		let prev = l.start;
		for (const c of l.checkpoints) {
			if (typeof c === 'number') {
				assert.ok(c > prev && c < l.exit && onGround(c), `checkpoint ${c}`);
				prev = c;
			} else assert.ok(standsOn(c[0], c[1]), `checkpoint ${c} stands on a surface you can reach`);
		}
		const reach = (x, y) => surf.some((s) => x >= s.x0 - 20 && x <= s.x1 + 20 && y < s.y && s.y - y <= 240);
		assert.ok(standsOn(l.exit, ey), 'the exit can be reached');

		for (const k of l.keys) assert.ok(reach(k.x, k.y), `${k.colour} key at ${k.x},${k.y} is in reach`);
		for (const e of l.enemies) {
			const y = e.y ?? FLOOR;
			const stands = (y === FLOOR && onGround(e.x)) || l.platforms.some((p) => p.y === y && e.x >= p.x && e.x <= p.x + p.w);
			assert.ok(stands, `${e.kind} at ${e.x},${y} stands on something`);
		}
		for (const b of l.blocks) {
			if (b.kind === 'cracked') {
				const fuse = l.barrels.some((r) => (r.y ?? FLOOR) >= b.y - 10 && (r.y ?? FLOOR) <= b.y + b.h + 10 && r.x < b.x && b.x - r.x <= 120);
				assert.ok(fuse, `cracked wall ${b.id} has a barrel right before it`);
			}
			if (b.kind !== 'door' || !b.lock) continue;
			if ('kill' in b.lock) {
				const zone = l.enemies.filter((e) => e.zone === b.lock.kill);
				assert.ok(zone.length > 0, `door ${b.id}: its area has enemies`);
				// a hatch in a floor (wider than tall): its area is above it
				for (const e of zone) assert.ok(b.w > b.h ? (e.y ?? FLOOR) < b.y : e.x < b.x, `door ${b.id}: ${e.kind} at ${e.x} is on this side`);
			} else if ('key' in b.lock) {
				const key = l.keys.find((k) => k.colour === b.lock.key);
				assert.ok(key && key.x < b.x, `door ${b.id}: its ${b.lock.key} key comes first`);
			} else {
				const sw = l.switches.find((s) => s.opens.includes(b.id));
				assert.ok(sw, `door ${b.id}: a switch opens it`);
			}
		}
		for (const z of l.lasers) {
			const sw = l.switches.find((s) => s.opens.includes(z.id));
			assert.ok(sw, `laser ${z.id} has a switch`);
			// stand next to it, or shoot it from this side of the laser
			const near = sw.x < z.x && reach(sw.x, sw.y + 60);
			const shot = Math.hypot(sw.x - (z.x - 40), sw.y - (FLOOR - 62)) <= 880;
			assert.ok(near || shot, `switch ${sw.id} can be pressed or shot`);
		}
		for (const s of l.switches) for (const id of s.opens) assert.ok(l.lasers.some((z) => z.id === id) || l.blocks.some((b) => b.id === id), `switch ${s.id} opens ${id}`);
		for (const p of [...l.keys, ...l.guns, ...l.burgers, ...l.barrels, ...l.crates, ...(l.pads ?? []), ...(l.spikes ?? [])]) assert.ok(p.x > 0 && p.x < l.w);
		// nothing sits above the world's top
		const top = l.top ?? 0;
		for (const p of [...l.platforms, ...(l.movers ?? [])]) assert.ok(p.y - 100 > top && (p.y + (p.dy ?? 0)) - 100 > top, `platform at ${p.x},${p.y} has head room`);
		// spikes never sit where you must stand: not on the start, exit or a checkpoint
		for (const sp of l.spikes ?? []) {
			const y = sp.y ?? FLOOR;
			const spots = [[l.start, sy], [l.exit, ey], ...l.checkpoints.map((c) => (typeof c === 'number' ? [c, FLOOR] : c))];
			for (const [x, yy] of spots) assert.ok(!(yy === y && x >= sp.x - 30 && x <= sp.x + sp.w + 30), `spikes at ${sp.x} clear of ${x},${yy}`);
		}
	});
}

test('level ids are unique, chapters open one level after another, points add up', () => {
	assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
	assert.ok(LEVELS.length >= 20);
	assert.equal(levelOpen(0, {}), true);
	assert.equal(levelOpen(1, {}), false);
	assert.equal(levelOpen(1, { [LEVELS[0].id]: { clear: 1 } }), true);
	// chapter 2's first level is open from the start, the next one waits for it
	const c2 = LEVELS.findIndex((l) => l.chapter === 2);
	assert.ok(c2 > 0);
	assert.equal(levelOpen(c2, {}), true);
	assert.equal(levelOpen(c2 + 1, {}), false);
	assert.equal(levelOpen(c2 + 1, { [LEVELS[c2].id]: { clear: 1 } }), true);
	assert.equal(pointsOf({ clear: 1, all: 1, clean: 1 }), 4);
	assert.equal(pointsOf(undefined), 0);
});

// ---------- the reach the rules above count on, measured on the real engine ----------

/** run the player with a plan of inputs from standing still; how high and far until they land again */
function measure(plan) {
	const g = new Mayhem('o4', undefined, [], 1);
	g.enemies = [];
	for (let i = 0; i < 10; i++) g.step(1 / 60, { ...NO_INPUT });
	const x0 = g.player.x, y0 = g.player.y;
	let minY = y0, t = 0, left = false;
	for (let i = 0; i < 240; i++) {
		g.step(1 / 60, { ...NO_INPUT, aimX: g.player.x + 300, aimY: g.player.y - 50, right: true, ...plan(t) });
		t += 1 / 60;
		minY = Math.min(minY, g.player.y);
		if (!g.player.onGround) left = true;
		if (left && g.player.onGround) break;
	}
	return { rise: y0 - minY, across: g.player.x - x0 };
}

test('the jumps reach what chapter 2 counts on', () => {
	const one = measure((t) => ({ jump: t < 0.5 }));
	assert.ok(one.rise >= RISE + 20 && one.across >= ACROSS + 20, `one jump ${JSON.stringify(one)}`);
	const two = measure((t) => ({ jump: t < 0.4 || (t > 0.48 && t < 0.9) }));
	assert.ok(two.rise >= DBL_RISE + 20 && two.across >= DBL_ACROSS + 30, `double jump ${JSON.stringify(two)}`);
	const dash = measure((t) => ({ jump: t < 0.4 || (t > 0.48 && t < 0.9), dash: t > 0.95 && t < 1 }));
	assert.ok(dash.across >= DASH_ACROSS + 40, `double jump + dash ${JSON.stringify(dash)}`);
});

test('a jump pad throws you as high as the rule says', () => {
	const g = new Mayhem('v3', undefined, [], 1);
	g.enemies = [];
	const pd = g.level.pads[0];
	g.player.x = pd.x + PAD_W / 2;
	g.player.y = pd.y - 1;
	let minY = g.player.y;
	for (let i = 0; i < 90; i++) {
		g.step(1 / 60, { ...NO_INPUT, aimX: g.player.x + 100, aimY: g.player.y - 50 });
		minY = Math.min(minY, g.player.y);
	}
	assert.ok(pd.y - minY >= (0.85 * pd.power ** 2) / (2 * GRAV), `rose ${pd.y - minY}`);
});

test('the wall-jump shafts can be climbed', () => {
	for (const [id, x, y] of [['v4', 960, -90], ['v8', 540, 0]]) {
		const g = new Mayhem(id, undefined, [], 1);
		g.enemies = [];
		const wl = g.level.blocks.find((b) => b.id === 'sl');
		g.player.x = x;
		g.player.y = y;
		// steer into a wall, jump the moment you touch it, then head for the other one
		let dir = 1, prev = false, hold = 0, best = y;
		for (let i = 0; i < 60 * 8; i++) {
			const p = g.player;
			let start = p.onGround && i % 40 === 0;
			if (p.wall && hold <= 0 && !prev) {
				start = true;
				dir = -p.wall;
			}
			if (start) hold = 14;
			const jump = hold > 0 && !(start && prev);
			hold--;
			g.step(1 / 60, { ...NO_INPUT, aimX: p.x + dir * 200, aimY: p.y - 60, right: dir > 0, left: dir < 0, jump });
			prev = jump;
			best = Math.min(best, g.player.y);
		}
		assert.ok(best < wl.y, `${id}: climbed to ${Math.round(best)}, the wall's top is ${wl.y}`);
	}
});

test('moving platforms carry you; the rising sludge rises and kills', () => {
	const g = new Mayhem('v4', undefined, [], 1);
	g.enemies = [];
	const m = g.level.movers[0];
	g.player.x = m.x + m.w / 2;
	g.player.y = g.movers[0].y - 1;
	for (let i = 0; i < 60 * 3.5; i++) g.step(1 / 60, { ...NO_INPUT, aimX: g.player.x + 100, aimY: g.player.y - 50 });
	assert.ok(g.player.y < m.y - 400, `rode up to ${Math.round(g.player.y)}`);
	assert.ok(g.player.onGround);

	const s = new Mayhem('v7', undefined, [], 1);
	s.enemies = [];
	const start = s.flood;
	let low = start;
	for (let i = 0; i < 60 * 8; i++) {
		s.step(1 / 60, { ...NO_INPUT, aimX: 600, aimY: 400 });
		low = Math.min(low, s.flood);
	}
	assert.ok(low < FLOOR - 10, `the sludge rose to ${Math.round(low)}`);
	assert.ok(s.deaths > 0, 'standing still in it is deadly');
	// after a death it sinks back below where you come back
	assert.ok(s.flood >= s.respawnY + 200 || s.player.hp <= 0);
});
