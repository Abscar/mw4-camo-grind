// Quickscope Duel (src/lib/arcade/quickscope.ts): the seeded five-round schedule (waits, friendlies) and the
// scoring. `node --test scripts/arcade-quickscope.test.js` (also part of `npm test`).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	FEINT_MIN_WAIT,
	FRIENDLIES,
	LOOKS,
	MAX_WAIT,
	MIN_WAIT,
	ROUNDS,
	SPOT_COUNT,
	TOO_SLOW_MS,
	judge,
	roundEntry,
	roundPoints,
	schedule,
	totalScore
} from '#lib/arcade/quickscope.ts';

test('the same seed gives the same five rounds; another seed other rounds', () => {
	assert.deepEqual(schedule(12345), schedule(12345));
	assert.notDeepEqual(schedule(12345), schedule(12346));
	assert.equal(schedule(7).length, ROUNDS);
});

test('waits, spots and friendlies stay in their ranges', () => {
	for (let seed = 0; seed < 2000; seed++) {
		const rounds = schedule(seed * 2654435761);
		assert.equal(rounds.length, ROUNDS);
		assert.equal(rounds[0].feint, null, 'round 1 never has a friendly');
		const feints = rounds.filter((r) => r.feint).length;
		assert.ok(feints >= 1 && feints <= 3, `seed ${seed}: ${feints} friendlies`);
		for (const r of rounds) {
			assert.ok(r.wait >= MIN_WAIT && r.wait <= MAX_WAIT, `wait ${r.wait}`);
			assert.ok(Number.isInteger(r.wait));
			assert.ok(r.spot >= 0 && r.spot < SPOT_COUNT);
			assert.ok(r.look >= 0 && r.look < LOOKS);
			if (!r.feint) continue;
			const f = r.feint;
			assert.ok(r.wait >= FEINT_MIN_WAIT);
			assert.ok(f.at >= 600, 'not right at the start');
			assert.ok(f.at + f.dur <= r.wait - 400, 'gone well before the enemy shows');
			assert.ok(f.dur >= 600 && f.dur <= 900);
			assert.ok(FRIENDLIES.includes(f.kind));
			assert.notEqual(f.spot, r.spot, 'never in the enemy’s spot');
		}
	}
});

test('every kind of friendly and every spot turns up across seeds', () => {
	const kinds = new Set();
	const spots = new Set();
	for (let seed = 0; seed < 300; seed++)
		for (const r of schedule(seed)) {
			spots.add(r.spot);
			if (r.feint) kinds.add(r.feint.kind);
		}
	assert.equal(kinds.size, FRIENDLIES.length);
	assert.equal(spots.size, SPOT_COUNT);
});

test('judge: early, friendly fire, a hit, too slow', () => {
	const round = { wait: 3000, spot: 0, look: 0, feint: { at: 1000, dur: 700, kind: 'pigeon', spot: 2 } };
	assert.equal(judge(round, 500), 'early');
	assert.equal(judge(round, 1200), 'friendly');
	assert.equal(judge(round, 1700), 'friendly');
	assert.equal(judge(round, 1701), 'early');
	assert.equal(judge(round, 3000), 'hit');
	assert.equal(judge(round, 3000 + TOO_SLOW_MS), 'hit');
	assert.equal(judge(round, 3001 + TOO_SLOW_MS), 'slow');
	assert.equal(judge({ ...round, feint: null }, 1200), 'early');
});

test('round entries and the score', () => {
	assert.equal(roundEntry('hit', 187.4), 187);
	assert.equal(roundEntry('hit', 0.2), 1, 'a hit is always > 0');
	assert.equal(roundEntry('early', 0), -1);
	assert.equal(roundEntry('friendly', 0), -1);
	assert.equal(roundEntry('slow', 0), 0);
	assert.equal(roundPoints(187), 813);
	assert.equal(roundPoints(1400), 0);
	assert.equal(roundPoints(-1), 0);
	assert.equal(roundPoints(0), 0);
	assert.equal(totalScore([200, 250, -1, 0, 300]), 800 + 750 + 700);
	assert.equal(totalScore([1, 1, 1, 1, 1]), 4995);
});
