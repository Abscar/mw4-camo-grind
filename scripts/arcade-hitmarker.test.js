// Hitmarker Rush (src/lib/arcade/hitmarker.ts): the seeded pop-up schedule, the hit zones and the scoring.
// `node --test scripts/arcade-hitmarker.test.js` (also part of `npm test`).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	CIVILIAN_PENALTY,
	DUCK_MS,
	DURATION,
	RISE_H,
	RISE_MS,
	SPOTS,
	accuracy,
	comboMult,
	finalScore,
	hitPoints,
	hitZone,
	isCivilian,
	schedule,
	stayAt
} from '#lib/arcade/hitmarker.ts';
import { rng } from '#lib/arcade/rng.ts';

test('the same seed gives the same run, another seed another one', () => {
	assert.deepEqual(schedule(12345), schedule(12345));
	assert.notDeepEqual(schedule(12345), schedule(54321));
});

test('a run is full of targets, inside the 30 seconds, in time order', () => {
	for (const seed of [1, 2, 3, 12345, 987654321, 4294967295]) {
		const run = schedule(seed);
		assert.ok(run.length >= 45 && run.length <= 95, `seed ${seed}: ${run.length} pop-ups`);
		for (let i = 0; i < run.length; i++) {
			const s = run[i];
			assert.ok(s.t >= 0 && s.t + RISE_MS + s.stay <= DURATION + 2200, `seed ${seed}: pop-up ${i} too late`);
			if (i) assert.ok(s.t >= run[i - 1].t);
			assert.ok(s.spot >= 0 && s.spot < SPOTS.length);
			assert.ok(s.dir === 1 || s.dir === -1);
		}
	}
});

test('a spot never holds two targets at once', () => {
	for (let seed = 0; seed < 200; seed++) {
		const busy = SPOTS.map(() => -1);
		for (const s of schedule(seed)) {
			assert.ok(s.t >= busy[s.spot], `seed ${seed}: spot ${SPOTS[s.spot].id} reused at ${s.t}`);
			busy[s.spot] = s.t + RISE_MS + s.stay + DUCK_MS;
		}
	}
});

test('three HVTs, only where they have room to move; civilians not in the first seconds', () => {
	for (let seed = 0; seed < 200; seed++) {
		const run = schedule(seed);
		const hvts = run.filter((s) => s.kind === 'hvt');
		assert.equal(hvts.length, 3, `seed ${seed}`);
		for (const h of hvts) assert.ok(SPOTS[h.spot].hvt > 0);
		for (const c of run.filter((s) => isCivilian(s.kind))) assert.ok(c.t > 2500);
		const civ = run.filter((s) => isCivilian(s.kind)).length;
		assert.ok(civ <= 16, `seed ${seed}: ${civ} civilians`);
	}
});

test('targets stay up for a shorter time as the run goes on', () => {
	assert.ok(stayAt(0) > stayAt(15000) && stayAt(15000) > stayAt(DURATION));
	assert.ok(stayAt(DURATION) >= 650);
});

test('spots: windows fit a risen target, rows sit back to front', () => {
	for (const s of SPOTS) {
		if (s.clip) {
			const top = s.base - RISE_H * 1.08 * s.scale;
			assert.ok(top >= s.clip.y0 - 2, `${s.id}: target pokes out of its window`);
			assert.ok(s.x - 64 * s.scale >= s.clip.x0 - 4 && s.x + 64 * s.scale <= s.clip.x1 + 4, `${s.id}: too narrow`);
		}
		assert.ok(s.base - RISE_H * 1.08 * s.scale > 80, `${s.id}: under the HUD`);
	}
	// a back row's targets (cut off just under their cover) never reach down to a front row's cover
	const lowest = (row) => Math.max(...SPOTS.filter((s) => s.row === row).map((s) => s.base + 16));
	const highest = (row) => Math.min(...SPOTS.filter((s) => s.row === row).map((s) => s.base - 14));
	assert.ok(lowest(0) < highest(1) && lowest(1) < highest(2));
});

test('hit zones: heads and the bullseye are headshots, the body is a hit, the air is a miss', () => {
	assert.equal(hitZone('soldier', 0, -108), 'head');
	assert.equal(hitZone('soldier', 0, -20), 'body');
	assert.equal(hitZone('soldier', 100, -100), null);
	assert.equal(hitZone('dummy', 0, -40), 'head');
	assert.equal(hitZone('dummy', 0, -118), 'head');
	assert.equal(hitZone('dummy', 40, -10), 'body');
	assert.equal(hitZone('burger', 0, -110), 'head');
	assert.equal(hitZone('hvt', 0, -108), 'head');
	assert.equal(hitZone('mascot', 0, -80), 'body');
	assert.equal(hitZone('duck', 0, -40), 'body');
	assert.equal(hitZone('duck', -90, -140), null);
});

test('scoring: combo multiplier, headshots, HVT, accuracy', () => {
	assert.equal(comboMult(1), 1);
	assert.equal(comboMult(5), 1);
	assert.equal(comboMult(6), 1.5);
	assert.equal(comboMult(11), 2);
	assert.equal(comboMult(200), 4);
	assert.equal(hitPoints('soldier', false, 1), 100);
	assert.equal(hitPoints('dummy', true, 1), 150);
	assert.equal(hitPoints('burger', true, 6), 225);
	assert.equal(hitPoints('hvt', false, 1), 1000);
	assert.equal(hitPoints('hvt', true, 11), 3000);
	assert.equal(accuracy(0, 0), 0);
	assert.equal(accuracy(3, 4), 0.75);
	assert.equal(finalScore(1000, 10, 10), 1000);
	assert.equal(finalScore(1000, 5, 10), 750);
	assert.equal(finalScore(1000, 0, 0), 500);
	assert.equal(finalScore(-50, 0, 3), 0);
	assert.ok(Number.isInteger(finalScore(333, 2, 3)));
	assert.equal(CIVILIAN_PENALTY, 300);
});

/** A rough player: notices a target `react` ms after it starts rising, takes `aim` ms per shot, hits with
    probability `hit`, a hit is a headshot with `head`, shoots a civilian by mistake with `oops`. */
function simulate(seed, { react, spread, aim, hit, head, oops }) {
	const r = rng(seed ^ 0x5eed);
	let free = 0;
	let points = 0;
	let hits = 0;
	let shots = 0;
	let combo = 0;
	for (const s of schedule(seed)) {
		const start = Math.max(s.t + react + (r() - 0.5) * 2 * spread, free);
		if (start > s.t + RISE_MS + s.stay) continue;
		if (isCivilian(s.kind)) {
			if (r() < oops) {
				shots++;
				combo = 0;
				points = Math.max(0, points - CIVILIAN_PENALTY);
				free = start + aim;
			}
			continue;
		}
		let t = start;
		while (t <= s.t + RISE_MS + s.stay) {
			shots++;
			t += aim;
			if (r() < hit) {
				hits++;
				combo++;
				points += hitPoints(s.kind, r() < head, combo);
				break;
			}
			combo = 0;
		}
		free = t;
	}
	return finalScore(points, hits, shots);
}

const PLAYERS = {
	weak: { react: 700, spread: 250, aim: 420, hit: 0.5, head: 0.12, oops: 0.35 },
	average: { react: 520, spread: 180, aim: 320, hit: 0.7, head: 0.3, oops: 0.15 },
	great: { react: 360, spread: 90, aim: 230, hit: 0.9, head: 0.55, oops: 0.04 }
};

test('typical scores: weak < average < great, in sensible ranges', (t) => {
	const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
	const res = {};
	for (const [name, p] of Object.entries(PLAYERS)) res[name] = median(Array.from({ length: 101 }, (_, i) => simulate(i * 7919, p)));
	t.diagnostic(`median scores: ${JSON.stringify(res)}`);
	assert.ok(res.weak < res.average && res.average < res.great);
	assert.ok(res.weak > 300 && res.great < 60000);
});
