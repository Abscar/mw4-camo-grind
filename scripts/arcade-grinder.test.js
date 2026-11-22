// Camo Grinder (BurgiArcade, src/lib/arcade/grinder.ts): the difficulty curve, the needle, judging, scoring and
// the seeded weapon order / zones. `node --test scripts/arcade-grinder.test.js`
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	difficulty,
	zoneCentre,
	needleStart,
	moveNeedle,
	judge,
	pointsFor,
	makeGrind,
	GRIND_CAMOS,
	STRIKES,
	HIT_POINTS,
	PERFECT_POINTS,
	MAX_BONUS
} from '../src/lib/arcade/grinder.ts';
import { rng } from '../src/lib/arcade/rng.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';

const IDS = WEAPONS.map((w) => w.id);

test('the camo ladder is Gold → Platinum → Harmonic Break → Divergence', () => {
	assert.deepEqual([...GRIND_CAMOS], ['gold', 'platinum', 'harmonicBreak', 'divergence']);
	assert.equal(STRIKES, 3);
});

test('each weapon is faster with a smaller zone; each camo a little harder; limits hold', () => {
	let prev = difficulty(0, 0);
	for (let w = 0; w < 30; w++) {
		for (let s = 0; s < 4; s++) {
			if (w === 0 && s === 0) continue;
			const d = difficulty(w, s);
			assert.ok(d.speed >= prev.speed, `speed ${w}/${s}`);
			assert.ok(d.zone <= prev.zone, `zone ${w}/${s}`);
			assert.ok(d.perfect < d.zone, 'the perfect core is inside the zone');
			assert.ok(d.speed <= 2.4 && d.zone >= 0.07 && d.perfect >= 0.022, 'limits');
			prev = d;
		}
	}
	assert.ok(difficulty(1, 0).speed > difficulty(0, 3).speed, 'a new weapon is harder than the last camo of the one before');
	assert.ok(difficulty(0, 0).zone >= 0.25 && difficulty(0, 0).speed < 0.8, 'the first target is gentle');
});

test('zones stay on the meter, clear of its ends; the needle starts at the far end', () => {
	for (const u of [0, 0.01, 0.5, 0.99, 1]) {
		for (const z of [0.07, 0.15, 0.26]) {
			const c = zoneCentre(u, z);
			assert.ok(c - z / 2 >= 0.05 && c + z / 2 <= 0.95, `${u} ${z}`);
		}
	}
	assert.deepEqual(needleStart(0.8), { pos: 0, dir: 1 });
	assert.deepEqual(needleStart(0.2), { pos: 1, dir: -1 });
});

test('the needle bounces off both ends', () => {
	assert.deepEqual(moveNeedle(0.5, 1, 0.3), { pos: 0.8, dir: 1 });
	const a = moveNeedle(0.9, 1, 0.3);
	assert.ok(Math.abs(a.pos - 0.8) < 1e-9 && a.dir === -1);
	const b = moveNeedle(0.1, -1, 0.3);
	assert.ok(Math.abs(b.pos - 0.2) < 1e-9 && b.dir === 1);
	const c = moveNeedle(0.5, 1, 2);
	assert.ok(Math.abs(c.pos - 0.5) < 1e-9 && c.dir === 1, 'a full round trip');
});

test('judging and points', () => {
	assert.equal(judge(0.5, 0.5, 0.2, 0.05), 'perfect');
	assert.equal(judge(0.52, 0.5, 0.2, 0.05), 'perfect');
	assert.equal(judge(0.56, 0.5, 0.2, 0.05), 'hit');
	assert.equal(judge(0.6, 0.5, 0.2, 0.05), 'hit');
	assert.equal(judge(0.61, 0.5, 0.2, 0.05), 'miss');
	assert.equal(pointsFor('perfect'), PERFECT_POINTS);
	assert.equal(pointsFor('hit'), HIT_POINTS);
	assert.equal(pointsFor('miss'), 0);
	assert.equal(PERFECT_POINTS, 2 * HIT_POINTS);
});

test('the same seed gives the same weapons and zones; another seed differs', () => {
	const a = makeGrind(12345, IDS);
	const b = makeGrind(12345, IDS);
	const c = makeGrind(999, IDS);
	const wa = Array.from({ length: 37 }, (_, i) => a.weapon(i));
	assert.deepEqual(wa, Array.from({ length: 37 }, (_, i) => b.weapon(i)));
	assert.notDeepEqual(wa.slice(0, 8), Array.from({ length: 8 }, (_, i) => c.weapon(i)));
	assert.equal(new Set(wa).size, IDS.length, 'every weapon once before any repeats');
	assert.equal(a.weapon(IDS.length), a.weapon(0));
	const za = Array.from({ length: 20 }, () => a.nextZone());
	assert.deepEqual(za, Array.from({ length: 20 }, () => b.nextZone()));
	assert.ok(za.every((u) => u >= 0 && u < 1));
});

/** A simulated player who taps with a timing error of σ seconds; returns the score of one run. */
function play(seed, sigma) {
	const g = makeGrind(seed, IDS);
	const r = rng(seed * 31 + 7);
	const gauss = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
	let score = 0;
	let strikes = 0;
	for (let w = 0; w < 400; w++) {
		for (let s = 0; s < 4; s++) {
			const d = difficulty(w, s);
			const centre = zoneCentre(g.nextZone(), d.zone);
			for (;;) {
				const pos = centre + gauss() * sigma * d.speed;
				const j = judge(pos, centre, d.zone, d.perfect);
				if (j !== 'miss') {
					score += pointsFor(j);
					break;
				}
				if (++strikes >= STRIKES) return { score, weapons: w };
			}
		}
		score += MAX_BONUS;
	}
	return { score, weapons: 400 };
}

test('better timing scores more (simulated players)', () => {
	const median = (sigma) => {
		const xs = Array.from({ length: 300 }, (_, i) => play(1000 + i, sigma).score).sort((a, b) => a - b);
		return xs[150];
	};
	const weak = median(0.07);
	const avg = median(0.04);
	const great = median(0.022);
	assert.ok(weak < avg && avg < great, `${weak} < ${avg} < ${great}`);
	assert.ok(weak > 1500, `even a weak player maxes a few weapons (${weak})`);
	assert.ok(great < 40000, `a great run ends eventually (${great})`);
});
