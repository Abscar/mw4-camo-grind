// Abscars Madness' levels (src/lib/mayhem/levels.ts): every level can be finished. Geometry rules from the
// engine's physics: a jump rises ≈ 150 px and carries ≈ 200 px; the player is 91 px tall and grabs a key within
// ≈ 100 px above their feet; a pistol carries 900 px.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FLOOR, LEVELS, levelOpen, pointsOf } from '../src/lib/mayhem/levels.ts';

const RISE = 140;
const ACROSS = 190;
const CRATE = 44;

/** the surfaces the player can stand on and reach from the start (doors treated as open) */
function reachable(l) {
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
	const ok = new Set([surf.findIndex((s) => s.y === FLOOR && l.start >= s.x0 && l.start <= s.x1)]);
	let grew = true;
	while (grew) {
		grew = false;
		for (let i = 0; i < surf.length; i++) {
			if (ok.has(i)) continue;
			const b = surf[i];
			for (const j of ok) {
				const a = surf[j];
				const gap = Math.max(0, b.x0 - a.x1, a.x0 - b.x1);
				const up = a.y - b.y;
				if ((up <= RISE && gap <= ACROSS) || (up < 0 && gap <= ACROSS + 80)) {
					ok.add(i);
					grew = true;
					break;
				}
			}
		}
	}
	return [...ok].map((i) => surf[i]);
}

for (const l of LEVELS) {
	test(`${l.id} ${l.name} can be finished`, () => {
		const segs = [...l.ground].sort((a, b) => a[0] - b[0]);
		const onGround = (x) => segs.some(([a, b]) => x >= a && x <= b);
		assert.ok(onGround(l.start) && onGround(l.exit), 'start and exit on the ground');
		assert.ok(l.exit < l.w && l.start < l.exit);
		for (let i = 1; i < segs.length; i++) {
			const gap = segs[i][0] - segs[i - 1][1];
			const bridged = l.platforms.some((p) => p.x < segs[i][0] && p.x + p.w > segs[i - 1][1]);
			assert.ok(gap <= 200 || bridged, `pit ${segs[i - 1][1]}–${segs[i][0]} is jumpable`);
		}
		let prev = l.start;
		for (const c of l.checkpoints) {
			assert.ok(c > prev && c < l.exit && onGround(c), `checkpoint ${c}`);
			prev = c;
		}
		const surf = reachable(l);
		const reach = (x, y) => surf.some((s) => x >= s.x0 - 20 && x <= s.x1 + 20 && y < s.y && s.y - y <= 240);
		assert.ok(surf.some((s) => s.y === FLOOR && l.exit >= s.x0 && l.exit <= s.x1), 'the exit can be reached');

		for (const k of l.keys) assert.ok(reach(k.x, k.y), `${k.colour} key at ${k.x},${k.y} is in reach`);
		for (const e of l.enemies) {
			const y = e.y ?? FLOOR;
			const stands = (y === FLOOR && onGround(e.x)) || l.platforms.some((p) => p.y === y && e.x >= p.x && e.x <= p.x + p.w);
			assert.ok(stands, `${e.kind} at ${e.x},${y} stands on something`);
		}
		for (const b of l.blocks) {
			if (b.kind === 'cracked') {
				const fuse = l.barrels.some((r) => r.x < b.x && b.x - r.x <= 120);
				assert.ok(fuse, `cracked wall ${b.id} has a barrel right before it`);
			}
			if (b.kind !== 'door' || !b.lock) continue;
			if ('kill' in b.lock) {
				const zone = l.enemies.filter((e) => e.zone === b.lock.kill);
				assert.ok(zone.length > 0, `door ${b.id}: its area has enemies`);
				for (const e of zone) assert.ok(e.x < b.x, `door ${b.id}: ${e.kind} at ${e.x} is on this side`);
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
		for (const p of [...l.keys, ...l.guns, ...l.burgers, ...l.barrels, ...l.crates]) assert.ok(p.x > 0 && p.x < l.w);
	});
}

test('level ids are unique, levels open one after another, points add up', () => {
	assert.equal(new Set(LEVELS.map((l) => l.id)).size, LEVELS.length);
	assert.ok(LEVELS.length >= 12);
	assert.equal(levelOpen(0, {}), true);
	assert.equal(levelOpen(1, {}), false);
	assert.equal(levelOpen(1, { [LEVELS[0].id]: { clear: 1 } }), true);
	assert.equal(pointsOf({ clear: 1, all: 1, clean: 1 }), 4);
	assert.equal(pointsOf(undefined), 0);
});
