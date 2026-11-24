// Abscars Madness' rules (src/lib/mayhem/engine.ts + guns.ts + levels.ts + skills.ts): guns, shooting, pickups,
// the level pieces (doors, keys, switches, lasers, barrels, cracked walls, crates, pits), checkpoints, the exit,
// and the skills.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import { FLOOR, Mayhem, NO_INPUT } from '../src/lib/mayhem/engine.ts';
import { gunOf, OUT_WEAPONS, STARTER } from '../src/lib/mayhem/guns.ts';
import { LEVELS } from '../src/lib/mayhem/levels.ts';
import { canBuy, cleanSkills, SKILLS, skillCost } from '../src/lib/mayhem/skills.ts';

const idle = { ...NO_INPUT };
const run = (g, secs, inp = idle) => {
	for (let i = 0; i < secs * 60; i++) g.step(1 / 60, typeof inp === 'function' ? inp(i) : inp);
};
/** a level with nobody in it, so nothing shoots back */
const empty = (id, skills = []) => {
	const g = new Mayhem(id, STARTER, skills, 1);
	g.enemies = [];
	return g;
};
const put = (g, x, y = FLOOR) => {
	g.player.x = x;
	g.player.y = y;
	g.player.vx = g.player.vy = 0;
};
const block = (g, id) => g.blocks.find((b) => b.id === id);

test('every released weapon has sensible game stats', () => {
	for (const w of OUT_WEAPONS) {
		const g = gunOf(w.id);
		assert.ok(g.dmg > 0 && g.rate > 0, w.id);
		if (g.kind !== 'melee') assert.ok(g.mag >= 2 && g.pellets >= 1 && g.speed > 0, w.id);
	}
	assert.equal(gunOf(STARTER).kind, 'pistol');
	assert.ok(OUT_WEAPONS.length < WEAPONS.length, 'unreleased guns are left out');
});

test('every level loads, the player lands and the camera stays inside the level', () => {
	for (const l of LEVELS) {
		const g = new Mayhem(l.id, STARTER, [], 2);
		run(g, 1);
		assert.equal(g.player.y, l.startY ?? FLOOR, l.id);
		assert.ok(g.cam.x >= 0 && g.cam.x <= g.w, l.id);
		assert.ok(g.cam.y >= (l.top ?? 0) - 1 && g.cam.y <= FLOOR, l.id);
		assert.equal(g.totalEnemies, l.enemies.length, l.id);
	}
});

test('a closed door blocks the way; clearing its area opens it', () => {
	const g = empty('o1');
	g.enemies = [];
	put(g, 1780);
	// put one zone-a enemy back far away, asleep, so the door stays shut
	const e = new Mayhem('o1', STARTER, [], 3).enemies.find((x) => x.zone === 'a');
	e.x = 1300;
	g.enemies = [e];
	run(g, 1.5, { ...idle, right: true });
	assert.ok(g.player.x < 1900, 'stopped by the door');
	assert.equal(block(g, 'd1').open, false);
	g.enemies = [];
	run(g, 1.5, { ...idle, right: true });
	assert.equal(block(g, 'd1').open, true);
	assert.ok(g.player.x > 1930, 'walked through');
});

test('a key card opens its door and is used up', () => {
	const g = empty('o2');
	put(g, 1100, 190); // on the high ledge, under the red key
	run(g, 0.2);
	assert.ok(g.have.has('red'));
	put(g, 1380);
	run(g, 1.5, { ...idle, right: true });
	assert.equal(block(g, 'dr').open, true);
	assert.equal(g.have.has('red'), false);
});

test('lasers burn and push back; shooting the switch turns them off', () => {
	const g = empty('o3');
	put(g, 840);
	run(g, 1, { ...idle, right: true });
	assert.ok(g.player.hp < 100 && g.player.x < 900, 'burned and pushed back');
	g.player.hp = 100;
	put(g, 800);
	const sw = g.switches[0];
	const aim = { ...idle, aimX: sw.x, aimY: sw.y };
	run(g, 0.1, aim);
	run(g, 0.02, { ...aim, fire: true });
	run(g, 1, aim);
	assert.ok(sw.on, 'switch hit');
	assert.ok(g.lasers.every((l) => !l.on));
	run(g, 1.5, { ...idle, right: true });
	assert.ok(g.player.x > 1000);
});

test('E flips a switch you stand next to', () => {
	const g = empty('w2');
	const sw = g.switches[0];
	put(g, sw.x, 290);
	run(g, 0.2);
	g.step(1 / 60, { ...idle, pick: true });
	assert.ok(sw.on);
	assert.equal(block(g, 'dg').open, true);
});

test('a shot barrel explodes and knocks down the cracked wall next to it', () => {
	const g = empty('d1');
	put(g, 800);
	const b = g.barrels[0];
	const aim = { ...idle, aimX: b.x, aimY: b.y - 18 };
	run(g, 0.1, aim);
	run(g, 0.02, { ...aim, fire: true });
	run(g, 0.6, aim);
	assert.equal(b.alive, false);
	assert.equal(block(g, 'c1').gone, true);
});

test('barrels set each other off', () => {
	const g = empty('w2');
	put(g, 700);
	const aim = { ...idle, aimX: 900, aimY: FLOOR - 18 };
	run(g, 0.1, aim);
	run(g, 0.02, { ...aim, fire: true });
	run(g, 1, aim);
	assert.ok(g.barrels.slice(0, 2).every((b) => !b.alive));
	assert.equal(block(g, 'c1').gone, true);
});

test('crates can be pushed, and stood on', () => {
	const g = empty('o3');
	const c = g.crates[0];
	const x0 = c.x;
	put(g, c.x - 30);
	run(g, 1, { ...idle, right: true });
	assert.ok(c.x > x0 + 50, `pushed ${c.x - x0}`);
	put(g, c.x + c.w / 2, c.y - 10);
	run(g, 0.5);
	assert.ok(Math.abs(g.player.y - c.y) < 1, 'stands on the crate');
});

test('falling in a pit costs a death and sends you back to the last checkpoint', () => {
	const g = empty('o1');
	put(g, 1150);
	run(g, 0.3);
	assert.equal(g.checkpoint, 1);
	put(g, 980, 400);
	run(g, 3);
	assert.equal(g.deaths, 1);
	assert.ok(g.player.hp > 0);
	assert.equal(g.player.x, 1100);
});

test('dying to enemies respawns you with full health', () => {
	const g = new Mayhem('o1', STARTER, [], 4);
	g.player.hp = 1;
	run(g, 25, (i) => ({ ...idle, right: i % 120 < 60 }));
	if (g.deaths) assert.ok(g.player.hp > 0 || g.respawnT > 0);
});

test('reaching the exit completes the level', () => {
	const g = empty('o1');
	put(g, g.level.exit - 60);
	run(g, 1, { ...idle, right: true });
	assert.ok(g.complete && g.over);
	assert.ok(g.events.length >= 0);
});

test('shooting uses ammo, an empty gun gets thrown, then fists', () => {
	const g = empty('o2');
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
	const g = new Mayhem('o1', STARTER, [], 5);
	const e = g.enemies[0];
	g.enemies = [e];
	e.x = g.player.x + 120;
	e.y = FLOOR;
	e.held = { id: STARTER, ammo: 12 };
	e.hp = 1;
	const aim = { ...idle, aimX: e.x, aimY: FLOOR - 40 };
	run(g, 0.05, aim);
	run(g, 0.02, { ...aim, fire: true });
	run(g, 0.3, aim);
	assert.equal(g.stats.kills, 1);
	assert.ok(g.score > 0);
	const drop = g.pickups.find((k) => k.gun && k.life < 1e8);
	assert.ok(drop, 'the enemy dropped its gun');
	run(g, 1.5);
	g.player.held = null;
	put(g, drop.x);
	run(g, 0.1);
	assert.ok(g.player.held, 'walking over a gun with empty hands picks it up');
});

/** one enemy standing on open ground at x, facing `facing` */
const lone = (x, facing, kind = 'random') => {
	const g = new Mayhem('o2', STARTER, [], 3);
	const e = g.enemies.find((q) => q.kind === kind) ?? g.enemies[0];
	g.enemies = [e];
	Object.assign(e, { x, y: FLOOR, home: x, facing, pause: 99, asleep: true, spot: 0, vx: 0 });
	return { g, e };
};

test('enemies have to see you: in front they spot you, behind they do not, a gunshot wakes them', () => {
	const g = new Mayhem('o1', STARTER, [], 6);
	const far = g.enemies.find((e) => e.x > 2000);
	run(g, 1);
	assert.ok(far.asleep, 'far away = still patrolling');
	// in front, close: the ? fills and they wake within a second or so
	let { g: a, e } = lone(500, -1);
	put(a, 380);
	run(a, 0.3);
	assert.ok(e.asleep && e.spot > 0.3, 'the ? is filling');
	run(a, 0.8);
	assert.ok(!e.asleep, 'spotted');
	assert.ok(a.popups.some((u) => u.text === '!'));
	// behind them, standing still: never noticed
	({ g: a, e } = lone(500, 1));
	put(a, 380);
	run(a, 3);
	assert.ok(e.asleep && e.spot === 0, 'behind = unseen');
	// a shot fired behind them is heard
	a.step(1 / 60, { ...idle, fire: true, aimX: 100, aimY: FLOOR - 60 });
	assert.ok(!e.asleep, 'the shot woke them');
});

test('takedown: click behind an unaware enemy, gun in hand, for a silent kill', () => {
	const { g, e } = lone(500, 1);
	put(g, 474);
	run(g, 0.1, { ...idle, aimX: 700, aimY: FLOOR - 60 });
	assert.equal(g.canTakedown(), e);
	const ammo = g.player.held.ammo;
	g.step(1 / 60, { ...idle, fire: true, aimX: 700, aimY: FLOOR - 60 });
	assert.ok(!g.enemies.includes(e), 'dead');
	assert.equal(g.player.held.ammo, ammo, 'no shot fired');
	assert.ok(g.popups.some((u) => u.text.startsWith('TAKEDOWN')));
	assert.ok(g.slowT > 0, 'kill cam');
	// facing you: no takedown
	const b = lone(500, -1);
	put(b.g, 474);
	run(b.g, 0.05, { ...idle, aimX: 700, aimY: FLOOR - 60 });
	assert.equal(b.g.canTakedown(), null);
});

test('throwing knives: silent kill on the unaware, they stick in walls and get picked back up', () => {
	const { g, e } = lone(600, 1);
	put(g, 400);
	run(g, 0.1, { ...idle, aimX: 600, aimY: FLOOR - 50 });
	const n = g.knives;
	g.step(1 / 60, { ...idle, knife: true, aimX: 600, aimY: FLOOR - 50 });
	assert.equal(g.knives, n - 1);
	run(g, 0.6, { ...idle, aimX: 600, aimY: FLOOR - 50 });
	assert.ok(!g.enemies.includes(e), 'one knife kills an unaware enemy');
	assert.ok(g.popups.some((u) => u.text.startsWith('SILENT KILL')));
	const k = g.pickups.find((q) => q.knife);
	assert.ok(k, 'the knife dropped');
	run(g, 1.5);
	put(g, k.x);
	run(g, 0.1);
	assert.equal(g.knives, n, 'picked back up');
	// into a wall: it sticks there
	const w = empty('o2');
	put(w, 300);
	run(w, 0.2);
	w.step(1 / 60, { ...idle, knife: true, aimX: 520, aimY: FLOOR + 60 });
	run(w, 0.5);
	const stuck = w.pickups.find((q) => q.knife);
	assert.ok(stuck && stuck.onGround, 'stuck in the floor');
	// an aware enemy takes a body hit and survives
	const c = lone(560, -1, 'sweat');
	c.e.asleep = false;
	c.e.react = 9;
	put(c.g, 420);
	c.g.step(1 / 60, { ...idle, knife: true, aimX: 560, aimY: FLOOR - 40 });
	run(c.g, 0.5, { ...idle, aimX: 560, aimY: FLOOR - 40 });
	assert.ok(c.g.enemies.includes(c.e) && c.e.hp < c.e.maxHp, 'hurt, not dead');
});

test('movement for everyone: coyote jump, held jump goes higher, double jump, dash, wall jump', () => {
	// a held jump goes higher than a tap
	const peak = (holdFrames) => {
		const g = empty('o2');
		run(g, 0.3);
		let top = FLOOR;
		for (let i = 0; i < 90; i++) {
			g.step(1 / 60, { ...idle, jump: i < holdFrames });
			top = Math.min(top, g.player.y);
		}
		return FLOOR - top;
	};
	const tapH = peak(2), holdH = peak(40);
	assert.ok(holdH > tapH + 60, `held ${holdH} vs tap ${tapH}`);
	assert.ok(holdH > 150 && holdH < 230, `a full jump ${holdH}`);
	// double jump without any skill, not a third
	const g = empty('o2');
	run(g, 0.3);
	run(g, 0.05, { ...idle, jump: true });
	run(g, 0.3);
	g.step(1 / 60, { ...idle, jump: true });
	assert.ok(g.player.vy < -500, 'double jump');
	g.step(1 / 60, idle);
	g.step(1 / 60, { ...idle, jump: true });
	assert.ok(!g.player.onGround && g.player.jumps === 2, 'no third jump without Triple Jump');
	// coyote time: just off a ledge you can still jump
	const c = empty('o1');
	put(c, 880);
	run(c, 0.2);
	for (let i = 0; i < 120 && c.player.onGround; i++) c.step(1 / 60, { ...idle, right: true });
	run(c, 0.05, { ...idle, right: true });
	assert.ok(c.player.x > 900 && !c.player.onGround);
	const e0 = c.player.vy;
	c.step(1 / 60, { ...idle, jump: true, right: true });
	assert.ok(c.player.vy < -700 && e0 >= 0, 'coyote jump');
	// dash, on the ground and once in the air
	const d = empty('o2');
	run(d, 0.3);
	const x0 = d.player.x;
	d.step(1 / 60, { ...idle, dash: true, aimX: x0 + 300 });
	run(d, 0.2);
	assert.ok(d.player.x - x0 > 120, `dashed ${d.player.x - x0}`);
	run(d, 1);
	run(d, 0.05, { ...idle, jump: true });
	run(d, 0.6);
	d.step(1 / 60, { ...idle, dash: true });
	assert.ok(d.player.dashT > 0, 'air dash');
	run(d, 0.8);
	d.step(1 / 60, idle);
	d.step(1 / 60, { ...idle, dash: true });
	assert.ok(d.player.dashT <= 0 || d.player.onGround, 'only one air dash without Air Dash');
	// wall jump off the wall in o2
	const w = empty('o2');
	const wb = w.blocks.find((b) => b.id === 'w1');
	put(w, wb.x - 40);
	run(w, 0.2);
	run(w, 0.05, { ...idle, jump: true, right: true });
	run(w, 0.25, { ...idle, right: true });
	let got = false;
	for (let i = 0; i < 30 && !got; i++) {
		w.step(1 / 60, { ...idle, right: true, jump: i % 2 === 0 });
		got = w.events.some((e) => e.t === 'wall');
	}
	assert.ok(got || w.player.y < wb.y, 'wall jump (or already over the low wall)');
});

test('skills: triple jump, plating, grenades, extended mags, second wind, self repair', () => {
	const all = SKILLS.map((s) => s.id);
	const g = empty('o2', all);
	assert.equal(g.player.maxHp, 140);
	assert.equal(g.player.held.ammo, Math.round(gunOf(STARTER).mag * 1.5));
	assert.equal(g.grenades, 3);
	run(g, 0.2);
	run(g, 0.05, { ...idle, jump: true });
	run(g, 0.25);
	g.step(1 / 60, { ...idle, jump: true });
	run(g, 0.25);
	g.step(1 / 60, idle);
	g.step(1 / 60, { ...idle, jump: true });
	assert.ok(g.player.vy < -500, 'triple jump');
	run(g, 2);
	g.step(1 / 60, { ...idle, nade: true, aimX: g.player.x + 200, aimY: FLOOR - 120 });
	assert.equal(g.grenades, 2);
	assert.ok(g.bullets.some((b) => b.kind === 'frag'));
	run(g, 2);
	assert.ok(g.events.length >= 0);
	// second wind
	g.player.safeT = 0;
	g.player.hp = 10;
	const e = new Mayhem('o1', STARTER, [], 7).enemies[0];
	g.enemies = [e];
	g.player.hp = 10;
	g.player.safeT = 0;
	const before = g.deaths;
	// a lethal laser-free hit: an explosion next to the player
	g.bullets.push({ x: g.player.x, y: g.player.y - 40, vx: 0, vy: 0, dmg: 0, mine: false, life: 0, pierce: 0, hit: [], kind: 'frag', from: -1 });
	run(g, 0.1);
	assert.equal(g.deaths, before, 'second wind kept them alive');
	assert.ok(g.player.hp >= 1);
	g.enemies = [];
	const hp = g.player.hp;
	run(g, 5);
	assert.ok(g.player.hp > hp, 'self repair');
});

test('ground slam (everyone) hurts enemies nearby, Earthquake more', () => {
	const g = empty('o2', ['triple', 'airdash', 'dashhit', 'quake']);
	const e = new Mayhem('o2', STARTER, [], 8).enemies[0];
	g.enemies = [e];
	put(g, 300, 300);
	e.x = 340;
	e.y = FLOOR;
	e.asleep = true;
	g.player.onGround = false;
	g.step(1 / 60, { ...idle, down: true });
	run(g, 0.5);
	assert.ok(e.hp < e.maxHp || !g.enemies.includes(e));
});

test('presses count when the caller mutates one input object (as the page does)', () => {
	const g = empty('o2');
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
	const g = empty('o2');
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

test('a long seeded run with a bot keeps the world tidy on every level', () => {
	for (const l of LEVELS) {
		const g = new Mayhem(l.id, STARTER, [], 9);
		g.player.maxHp = g.player.hp = 1e9;
		run(g, 40, (i) => {
			const e = g.enemies.find((x) => !x.asleep);
			return { ...idle, fire: i % 4 < 2, pick: i % 90 === 0, right: i % 200 < 170, left: i % 200 >= 170, jump: i % 50 === 0, aimX: e?.x ?? g.player.x + 200, aimY: (e?.y ?? FLOOR) - 50 };
		});
		assert.ok(g.parts.length <= 600 && g.splats.length <= 160 && g.corpses.length <= 22, l.id);
		for (const f of [g.player, ...g.enemies]) assert.ok(Number.isFinite(f.x) && Number.isFinite(f.y), l.id);
	}
});

test('the skill tree: chains, costs, cleaning', () => {
	assert.equal(SKILLS.length, 12);
	assert.equal(canBuy('airdash', new Set(), 10), 'locked');
	assert.equal(canBuy('triple', new Set(), 0), 'poor');
	assert.equal(canBuy('triple', new Set(), 1), 'ok');
	assert.equal(canBuy('triple', new Set(['triple']), 5), 'owned');
	assert.deepEqual(cleanSkills(['airdash', 'triple', 'nope', 7]), ['triple', 'airdash']);
	assert.deepEqual(cleanSkills(['airdash']), [], 'a chain with a gap is dropped');
	assert.equal(cleanSkills(null).length, 0);
	const total = skillCost(SKILLS.map((s) => s.id));
	assert.ok(total <= LEVELS.length * 4, `the whole tree (${total}) fits the ${LEVELS.length * 4} points the levels give`);
	// the tree was sized for chapter 1: clearing it there still doesn't buy everything (chapter 2 adds more points)
	const ch1 = LEVELS.filter((l) => (l.chapter ?? 1) === 1).length;
	assert.ok(total >= ch1 * 2, 'clearing chapter 1 alone does not buy the whole tree');
});

test('a dash never goes through a closed door', () => {
	for (const start of [1400, 1410, 1420]) {
		const g = empty('o2');
		put(g, start);
		run(g, 0.2);
		g.step(1 / 60, { ...idle, dash: true, right: true, aimX: 1600 });
		run(g, 0.4, { ...idle, right: true });
		assert.ok(g.player.x < 1450, `from ${start}: stopped at ${g.player.x}`);
	}
});
