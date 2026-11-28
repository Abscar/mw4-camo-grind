// Abscars Madness' secret entrances + bonus levels (levels.ts `secret` / `BONUS`, engine.ts foundSecret): each
// secret is reachable with a double jump on the real engine, never with one jump, and opens its bonus level.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Mayhem, NO_INPUT } from '../src/lib/mayhem/engine.ts';
import { ALL_LEVELS, BONUS, LEVEL_BY_ID, LEVELS, secretOf } from '../src/lib/mayhem/levels.ts';

const secrets = LEVELS.filter((l) => l.secret);

/** stand at (x, y) facing `dir`, then jump: hold `dir` for `hold` frames, second jump after `second` frames (0 = none) */
function attempt(id, x, y, dir, hold, second) {
	const g = new Mayhem(id, undefined, [], 7);
	g.enemies = [];
	// zone doors open once their area is cleared (the test has no enemies)
	for (const b of g.blocks) if (b.kind === 'door') b.open = true;
	Object.assign(g.player, { x, y, vx: 0, vy: 0, onGround: true });
	for (let i = 0; i < 150 && !g.complete; i++) {
		const inp = { ...NO_INPUT, aimX: x + dir * 300, aimY: y - 60 };
		if (dir > 0) inp.right = i < hold;
		if (dir < 0) inp.left = i < hold;
		inp.jump = i < 14 || (second > 0 && i >= second && i < second + 14);
		g.step(1 / 60, inp);
	}
	return g.foundSecret;
}
/** try a spread of timings; any success counts */
function reach(id, x, y, dir, double) {
	for (const hold of dir ? [10, 20, 30, 40, 55, 70, 90] : [0])
		for (const second of double ? [16, 20, 24, 28, 34, 40] : [0]) if (attempt(id, x, y, dir, hold, second)) return true;
	return false;
}

test('every secret points at a bonus level, each bonus level has exactly one entrance', () => {
	assert.ok(secrets.length >= 2);
	for (const b of BONUS) {
		assert.equal(b.bonus, true);
		assert.equal(LEVELS.filter((l) => l.secret?.to === b.id).length, 1, b.id);
		assert.equal(secretOf(b.id)?.secret?.to, b.id);
		assert.equal(LEVEL_BY_ID.get(b.id), b);
	}
	for (const l of secrets) {
		assert.ok(BONUS.some((b) => b.id === l.secret.to), l.id);
		// it stands on a ledge of that level
		assert.ok(l.platforms.some((p) => p.y === l.secret.y && l.secret.x > p.x && l.secret.x < p.x + p.w), `${l.id}: no ledge under the vent`);
	}
	assert.equal(new Set(ALL_LEVELS.map((l) => l.id)).size, ALL_LEVELS.length, 'ids are unique');
});

test('level 3 hides a bonus entrance (the user’s example)', () => {
	assert.equal(LEVELS[2].secret?.to, BONUS[0].id);
});

test('the level-3 vent: a double jump from the floor below reaches it, one jump does not', () => {
	const l = LEVELS[2];
	assert.equal(reach(l.id, l.secret.x, 500, 0, false), false, 'one jump must not be enough');
	assert.equal(reach(l.id, l.secret.x, 500, 0, true), true, 'a double jump reaches it');
});

test('the Loading Dock vent: a double jump from the ledge before the first door, never one jump, not from the ground', () => {
	const l = LEVEL_BY_ID.get('w1');
	const ledge = l.platforms.find((p) => p.x === 700);
	const sx = ledge.x + ledge.w - 12;
	assert.equal(reach(l.id, sx, ledge.y, 1, false), false, 'one jump from the ledge');
	assert.equal(reach(l.id, 1130, 500, 1, true), false, 'from the ground edge');
	assert.equal(reach(l.id, sx, ledge.y, 1, true), true, 'double jump from the ledge');
});

test('stepping into the vent ends the level as a secret, not a clear', () => {
	const l = LEVELS[2];
	const g = new Mayhem(l.id, undefined, [], 1);
	g.enemies = [];
	Object.assign(g.player, { x: l.secret.x, y: l.secret.y, vx: 0, vy: 0, onGround: true });
	g.step(1 / 60, { ...NO_INPUT });
	assert.equal(g.complete, true);
	assert.equal(g.foundSecret, l.secret.to);
	assert.ok(g.events.some((e) => e.t === 'complete'));
});

test('bonus levels load and can be finished at their exit', () => {
	for (const b of BONUS) {
		const g = new Mayhem(b.id, undefined, [], 3);
		assert.equal(g.level.id, b.id);
		g.enemies = [];
		Object.assign(g.player, { x: b.exit + 10, y: 500, vx: 0, vy: 0, onGround: true });
		for (let i = 0; i < 10; i++) g.step(1 / 60, { ...NO_INPUT });
		assert.equal(g.complete, true, b.id);
		assert.equal(g.foundSecret, null);
	}
});
