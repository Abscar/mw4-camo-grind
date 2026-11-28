// Abscars Madness: sprint, slide and crouch (2026-11-28), and the key that moved for them.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanSettings, DEFAULT_KEYS } from '../src/lib/mayhem/controls.ts';
import { bodyOf, FLOOR, LOW, Mayhem, NO_INPUT, SLIDE_T, STAM, STAMINA_MAX, TACKLES } from '../src/lib/mayhem/engine.ts';
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
	assert.deepEqual(DEFAULT_KEYS.dive, ['KeyZ', '']);
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

test('stamina: a sprint drains it, run dry = winded (no sprint), a rest refills it; slides and dives cost a chunk', () => {
	const g = empty();
	put(g, 100);
	assert.equal(g.stamina, STAMINA_MAX);
	run(g, 1, sprintRight);
	assert.ok(g.stamina < STAMINA_MAX - STAM.sprint * 0.8, 'sprinting drains it');
	// long sprint: runs dry and stops sprinting (back to the start each second, o1 has a pit at 900)
	let n = 0;
	while (!g.winded && n++ < 8 * 60) {
		if (g.player.x > 700) g.player.x = 100;
		g.step(1 / 60, sprintRight);
	}
	assert.ok(g.winded && n < 5 * 60, `winded after ${n} frames`);
	g.step(1 / 60, sprintRight);
	assert.equal(g.player.sprint, false, 'no sprint while winded');
	// rest: refills, and the sprint comes back once past STAM.winded
	run(g, 2, idle);
	assert.ok(g.stamina >= STAM.winded && !g.winded, 'got its breath back');
	// a slide costs STAM.slide
	const s = empty();
	put(s, 100);
	run(s, 0.3, sprintRight);
	const before = s.stamina;
	s.step(1 / 60, { ...sprintRight, down: true });
	assert.equal(s.player.stance, 'slide');
	assert.ok(before - s.stamina >= STAM.slide - 1, 'slide paid for');
	// not enough for a dive: nothing happens, the bar flashes
	const d = empty();
	put(d, 100);
	run(d, 0.1);
	d.stamina = STAM.dive - 1;
	d.step(1 / 60, { ...idle, dive: true });
	assert.equal(d.player.stance, 'stand');
	assert.ok(d.staminaFlash > 0, 'flash');
});

test('dive: flies low in the direction you run, slow motion while airborne, shoot mid-air, land flat, get up', () => {
	const g = empty();
	put(g, 300);
	run(g, 0.1, right);
	const x0 = g.player.x;
	const t0 = g.t;
	g.step(1 / 60, { ...right, dive: true });
	assert.equal(g.player.stance, 'dive');
	assert.ok(g.player.vy < 0 && g.player.vx > 400, 'off the ground, fast');
	assert.ok(g.stamina <= STAMINA_MAX - STAM.dive + 1, 'paid for');
	// slow motion: the world's clock runs at DIVE_SLOW
	g.step(1 / 60, right);
	assert.ok(g.t - t0 < (2 / 60) * 0.75, 'world slowed');
	// forward dive = tipped forward (head first)
	assert.ok(bodyOf(g.player).lean > 1, 'head first');
	// shoot in the air
	const ammo = g.player.held.ammo;
	g.step(1 / 60, { ...right, fire: true });
	assert.equal(g.player.held.ammo, ammo - 1, 'fired mid-dive');
	run(g, 1.5, right);
	assert.ok(g.player.x - x0 > 180, `flew ${g.player.x - x0}`);
	assert.equal(g.player.stance, 'stand', 'landed, lay flat, got up');
	// a backwards dive: run away from where you aim → on your back
	const b = empty();
	put(b, 600);
	run(b, 0.1, { ...idle, left: true, aimX: 900, aimY: FLOOR - 60 });
	b.step(1 / 60, { ...idle, left: true, dive: true, aimX: 900, aimY: FLOOR - 60 });
	assert.equal(b.player.stance, 'dive');
	assert.ok(b.player.vx < -400, 'flies backwards');
	assert.equal(b.player.facing, 1, 'still facing the aim');
	assert.ok(bodyOf(b.player).lean < -1, 'on its back');
	// lands flat (prone), then jump gets up early
	let n = 0;
	while (b.player.stance === 'dive' && n++ < 300) b.step(1 / 60, { ...idle, aimX: 900, aimY: FLOOR - 60 });
	assert.equal(b.player.stance, 'prone');
	run(b, 0.2, { ...idle, aimX: 900, aimY: FLOOR - 60 });
	b.step(1 / 60, { ...idle, jump: true, aimX: 900, aimY: FLOOR - 60 });
	assert.equal(b.player.stance, 'stand', 'jump = up');
	assert.ok(b.player.vy >= 0, 'getting up is not a jump');
});

test('dive into an enemy = a wrestling takedown (a juggernaut only staggers); chest-high bullets fly over a dive', () => {
	let { g, e } = lone(500, -1);
	put(g, 380);
	e.asleep = false;
	run(g, 0.05, right);
	g.step(1 / 60, { ...right, dive: true });
	run(g, 1, right);
	assert.ok(!g.enemies.includes(e), 'taken down');
	assert.ok(g.popups.some((u) => TACKLES.some((m) => u.text.startsWith(m))), 'a wrestling move popup');
	assert.equal(g.stats.kills, 1);
	// juggernaut: staggers, survives
	({ g, e } = lone(500, -1));
	Object.assign(e, { kind: 'jugg', hp: 650, maxHp: 650, scale: 1.3, asleep: false });
	put(g, 380);
	run(g, 0.05, right);
	g.step(1 / 60, { ...right, dive: true });
	run(g, 0.3, right);
	assert.ok(g.enemies.includes(e) && e.hp < 650, 'jugg hurt, still up');
	// a bullet at standing chest height passes over a diver
	const d = empty();
	put(d, 300);
	run(d, 0.05, right);
	d.step(1 / 60, { ...right, dive: true });
	// at the top of the arc (no rising into the bullet), a shot at standing chest height
	let k = 0;
	while (d.player.vy < -40 && k++ < 200) d.step(1 / 60, right);
	d.player.safeT = 0;
	const hp = d.player.hp;
	d.bullets.push({ x: d.player.x + 30, y: d.player.y - 66, vx: -900, vy: 0, dmg: 20, mine: false, life: 1, pierce: 0, hit: [], kind: 'bullet', from: -1 });
	run(d, 0.08, right);
	assert.equal(d.player.hp, hp, 'missed the diver');
});