// Abscars Madness: sprint, slide and crouch (2026-11-28), and the key that moved for them.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanSettings, DEFAULT_KEYS } from '../src/lib/mayhem/controls.ts';
import { FLOOR, LOW, Mayhem, NO_INPUT, SLIDE_T } from '../src/lib/mayhem/engine.ts';
import { STARTER } from '../src/lib/mayhem/guns.ts';

const idle = { ...NO_INPUT };
const run = (g, secs, inp = idle) => {
	for (let i = 0; i < Math.round(secs * 60); i++) g.step(1 / 60, inp);
};
const empty = (id = 'o1') => {
	const g = new Mayhem(id, STARTER, [], 1);
	g.enemies = [];
	return g;
};
const put = (g, x, y = FLOOR) => {
	Object.assign(g.player, { x, y, vx: 0, vy: 0, onGround: true });
};
const lone = (x, facing) => {
	const g = new Mayhem('o2', STARTER, [], 3);
	const e = g.enemies.find((q) => q.kind === 'random') ?? g.enemies[0];
	g.enemies = [e];
	Object.assign(e, { x, y: FLOOR, home: x, facing, pause: 99, asleep: true, spot: 0, vx: 0 });
	return { g, e };
};
const right = { ...idle, right: true, aimX: 3000, aimY: FLOOR - 60 };
const sprintRight = { ...right, sprint: true };

test('sprint: faster on the ground, gun down, no shots / knives / grenades until it comes back up', () => {
	const a = empty();
	put(a, 100);
	run(a, 0.8, right);
	const walked = a.player.x - 100;
	const b = empty();
	put(b, 100);
	run(b, 0.8, sprintRight);
	const sprinted = b.player.x - 100;
	assert.ok(b.player.sprint, 'sprinting');
	assert.ok(sprinted > walked * 1.3, `sprint ${sprinted} vs run ${walked}`);
	// standing still with sprint held = no sprint
	const c = empty();
	put(c, 100);
	run(c, 0.3, { ...idle, sprint: true });
	assert.equal(c.player.sprint, false);
	// no knife while sprinting
	const knives = b.knives;
	b.step(1 / 60, { ...sprintRight, knife: true });
	assert.equal(b.knives, knives, 'no knife thrown mid-sprint');
	// fire stops the sprint, but the gun takes a moment to come up
	const ammo = b.player.held.ammo;
	b.step(1 / 60, { ...sprintRight, fire: true });
	assert.equal(b.player.sprint, false, 'fire ends the sprint');
	assert.equal(b.player.held.ammo, ammo, 'no shot on the same click');
	run(b, 0.25, right);
	b.step(1 / 60, { ...right, fire: true });
	assert.equal(b.player.held.ammo, ammo - 1, 'a fresh click once the gun is up fires');
});

test('slide: ▼ while sprinting = a low, fast slide under chest-high bullets; jump out of it for a hop', () => {
	const g = empty();
	put(g, 100);
	run(g, 0.5, sprintRight);
	g.step(1 / 60, { ...sprintRight, down: true });
	assert.equal(g.player.stance, 'slide');
	assert.equal(g.lowOf(g.player), LOW.slide);
	assert.ok(Math.abs(g.player.vx) > 300, 'keeps its speed');
	// a bullet at standing chest height flies over
	g.player.safeT = 0;
	const hp = g.player.hp;
	g.bullets.push({ x: g.player.x + 60, y: FLOOR - 60, vx: -900, vy: 0, dmg: 20, mine: false, life: 1, pierce: 0, hit: [], kind: 'bullet', from: -1 });
	run(g, 0.15, { ...sprintRight, down: true });
	assert.equal(g.player.hp, hp, 'the bullet missed');
	// jump out: a hop with extra speed
	const vx = Math.abs(g.player.vx);
	g.step(1 / 60, { ...sprintRight, down: true, jump: true });
	assert.ok(g.player.vy < 0, 'hopped');
	assert.equal(g.player.stance, 'stand');
	assert.ok(Math.abs(g.player.vx) >= vx, 'kept the speed');
	// a slide on its own ends after SLIDE_T and slows down
	const h = empty();
	put(h, 100);
	run(h, 0.5, sprintRight);
	h.step(1 / 60, { ...sprintRight, down: true });
	run(h, SLIDE_T + 0.1, right);
	assert.equal(h.player.stance, 'stand');
	// the same bullet hits someone standing
	const s = empty();
	put(s, 300);
	s.player.safeT = 0;
	s.bullets.push({ x: 360, y: FLOOR - 60, vx: -900, vy: 0, dmg: 20, mine: false, life: 1, pierce: 0, hit: [], kind: 'bullet', from: -1 });
	run(s, 0.15);
	assert.ok(s.player.hp < 100, 'standing = hit');
});

test('crouch: hold ▼ on the floor = slow and low, seen from half as far; a tap on a ledge still drops you', () => {
	const a = empty();
	put(a, 100);
	run(a, 0.8, { ...right, down: true });
	assert.equal(a.player.stance, 'crouch');
	assert.equal(a.player.y, FLOOR, 'crouching on the floor, not falling');
	const b = empty();
	put(b, 100);
	run(b, 0.8, right);
	assert.ok(a.player.x - 100 < (b.player.x - 100) * 0.6, 'crouch walk is slow');
	// 200 px in front of an enemy: standing gets spotted, crouching doesn't
	let { g, e } = lone(500, -1);
	put(g, 300);
	run(g, 1.2);
	assert.ok(!e.asleep, 'standing = spotted');
	({ g, e } = lone(500, -1));
	put(g, 300);
	run(g, 2, { ...idle, down: true });
	assert.ok(e.asleep && e.spot === 0, 'crouched = unseen');
	// on a thin ledge a tap of ▼ drops through (o1 has one at x 520–720, y 380)
	const l = empty();
	put(l, 620, 380);
	run(l, 0.1);
	assert.equal(l.player.y, 380, 'standing on the ledge');
	l.step(1 / 60, { ...idle, down: true });
	run(l, 0.6);
	assert.ok(l.player.y > 380, 'dropped through');
});

test('keys: Shift sprints, Holk Time moved to V / X, old saves follow along', () => {
	assert.deepEqual(DEFAULT_KEYS.sprint, ['ShiftLeft', 'ShiftRight']);
	assert.deepEqual(DEFAULT_KEYS.holk, ['KeyV', 'KeyX']);
	// a save from before: Holk Time on its old Shift keys, no sprint
	const old = { ...DEFAULT_KEYS, holk: ['ShiftLeft', 'ShiftRight'] };
	delete old.sprint;
	const s = cleanSettings({ keys: old });
	assert.deepEqual(s.keys.sprint, ['ShiftLeft', 'ShiftRight']);
	assert.deepEqual(s.keys.holk, ['KeyV', 'KeyX']);
	// a save where Holk Time had been moved by hand keeps it
	const own = { ...DEFAULT_KEYS, holk: ['KeyH', ''] };
	delete own.sprint;
	const t = cleanSettings({ keys: own });
	assert.deepEqual(t.keys.holk, ['KeyH', '']);
	assert.deepEqual(t.keys.sprint, ['ShiftLeft', 'ShiftRight']);
});
