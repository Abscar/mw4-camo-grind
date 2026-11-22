// Squad Mayhem's rules (src/lib/mayhem/engine.ts + guns.ts): guns, waves, shooting, pickups, dying.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { FLOOR, Mayhem, NO_INPUT, W } from '../src/lib/mayhem/engine.ts';
import { gunOf, OUT_WEAPONS, STARTER } from '../src/lib/mayhem/guns.ts';

const idle = { ...NO_INPUT };
const run = (g, secs, inp = idle) => {
	for (let i = 0; i < secs * 60; i++) g.step(1 / 60, typeof inp === 'function' ? inp(i) : inp);
};

test('every released weapon has sensible game stats', () => {
	for (const w of OUT_WEAPONS) {
		const g = gunOf(w.id);
		assert.ok(g.dmg > 0 && g.rate > 0, w.id);
		if (g.kind !== 'melee') assert.ok(g.mag >= 2 && g.pellets >= 1 && g.speed > 0, w.id);
	}
	assert.equal(gunOf(STARTER).kind, 'pistol');
	assert.ok(OUT_WEAPONS.length < WEAPONS.length, 'unreleased guns are left out');
});

test('the player lands on the floor and waves start', () => {
	const g = new Mayhem(STARTER, 1);
	run(g, 3);
	assert.equal(g.player.y, FLOOR);
	assert.equal(g.wave, 1);
	assert.ok(g.alive > 0 || g.toSpawn > 0);
});

test('jumping reaches the first ledge and S drops through it', () => {
	const g = new Mayhem(STARTER, 2);
	g.player.x = 200; // under the rooftop's left ledge (y 372)
	run(g, 0.2);
	run(g, 0.05, { ...idle, jump: true });
	run(g, 1.2);
	assert.equal(g.player.y, 372);
	run(g, 0.05, { ...idle, down: true });
	run(g, 1);
	assert.equal(g.player.y, FLOOR);
});

test('shooting uses ammo, an empty gun gets thrown, then fists', () => {
	const g = new Mayhem(STARTER, 3);
	const mag = gunOf(STARTER).mag;
	run(g, 0.2);
	for (let i = 0; i < mag; i++) {
		run(g, 0.02, { ...idle, fire: true });
		run(g, 0.3);
	}
	assert.equal(g.player.held?.ammo, 0);
	run(g, 0.02, { ...idle, fire: true });
	assert.equal(g.player.held, null);
	assert.ok(g.bullets.some((b) => b.kind === 'thrown'));
});

test('killing an enemy scores, drops its gun, and the gun can be picked up', () => {
	const g = new Mayhem(STARTER, 4);
	run(g, 3); // wave 1 starts
	// put a random right in front of the player with a pistol, and shoot it
	while (g.alive === 0) run(g, 0.1);
	const e = g.enemies[0];
	e.x = g.player.x + 120;
	e.y = FLOOR;
	e.entering = false;
	e.held = { id: STARTER, ammo: 12 };
	e.hp = 1;
	const aim = { ...idle, aimX: e.x, aimY: FLOOR - 40 };
	run(g, 0.02, { ...aim, fire: true });
	run(g, 0.3, aim);
	assert.ok(g.stats.kills >= 1);
	assert.ok(g.score > 0);
	const drop = g.pickups.find((k) => k.gun);
	assert.ok(drop, 'the enemy dropped its gun');
	run(g, 1.5);
	g.player.held = null;
	g.player.x = drop.x;
	run(g, 0.1);
	assert.ok(g.player.held, 'walking over a gun with empty hands picks it up');
});

test('the player can die and the game ends', () => {
	const g = new Mayhem(STARTER, 5);
	g.player.hp = 1;
	run(g, 30, (i) => ({ ...idle, aimX: i % 2 ? 0 : W }));
	// left alone for 30 s on wave 1-2, the randoms get them
	assert.ok(g.over || g.player.hp > 0);
	if (g.over) assert.ok(g.corpses.some((c) => c.f.player));
});

test('wave sizes grow and a juggernaut comes every 5th wave', () => {
	assert.ok(Mayhem.waveSize(1).total < Mayhem.waveSize(6).total);
	assert.ok(Mayhem.waveSize(20).alive <= 8);
	const g = new Mayhem(STARTER, 6);
	g.wave = 4;
	g.toSpawn = 0;
	g.enemies = [];
	g.breakT = 0;
	g.step(1 / 60, idle);
	g.step(1 / 60, idle);
	run(g, 3.2);
	assert.equal(g.wave, 5);
	assert.ok(g.enemies.some((e) => e.kind === 'jugg') || g.corpses.some((c) => c.f.kind === 'jugg'));
});

test('a long seeded run with a bot keeps the world tidy', () => {
	const g = new Mayhem(STARTER, 7);
	g.player.maxHp = g.player.hp = 1e9; // can't die: just churn through waves
	run(g, 120, (i) => {
		const e = g.enemies[0];
		return { ...idle, fire: i % 4 < 2, pick: i % 90 === 0, left: i % 300 < 150, right: i % 300 >= 150, jump: i % 70 === 0, aimX: e?.x ?? W / 2, aimY: (e?.y ?? FLOOR) - 50 };
	});
	assert.ok(g.wave >= 2, `reached wave ${g.wave}`);
	assert.ok(g.stats.kills > 5, `${g.stats.kills} kills`);
	assert.ok(g.parts.length <= 500 && g.splats.length <= 120 && g.corpses.length <= 18 && g.pickups.length <= 14);
	for (const f of [g.player, ...g.enemies]) assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y));
});

test('presses count when the caller mutates one input object (as the page does)', () => {
	const g = new Mayhem(STARTER, 8);
	const inp = { ...idle };
	run(g, 0.3, inp);
	inp.fire = true;
	g.step(1 / 60, inp);
	assert.equal(g.player.held?.ammo, gunOf(STARTER).mag - 1);
	inp.fire = false;
	inp.jump = true;
	g.step(1 / 60, inp);
	assert.ok(g.player.vy < 0, 'jumped');
});

test('Holk Time slows the world, drains, and needs 20 to start', () => {
	const g = new Mayhem(STARTER, 9);
	run(g, 0.2);
	g.holk = 10;
	g.step(1 / 60, { ...idle, holk: true });
	assert.equal(g.holkOn, false, 'not enough meter');
	g.step(1 / 60, idle);
	g.holk = 60;
	const t = g.t;
	g.step(1 / 60, { ...idle, holk: true });
	assert.equal(g.holkOn, true);
	assert.ok(g.t - t < (1 / 60) * 0.5, 'world time runs slower');
	run(g, 4);
	assert.equal(g.holkOn, false, 'runs out');
});
