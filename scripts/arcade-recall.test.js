// Killstreak Recall (src/lib/arcade/recall.ts): the seeded call-in sequence, the buttons in play, playback speed
// and the score. `node --test scripts/arcade-recall.test.js` (also part of `npm test`).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	FIFTH_AT,
	MAX_STEPS,
	RECALL_STREAKS,
	SIXTH_AT,
	START_LENGTH,
	buttonsAt,
	firstRound,
	lengthOf,
	playbackTiming,
	recallScore,
	recallSequence,
	stepBonus
} from '../src/lib/arcade/recall.ts';

test('the same seed gives the same sequence, another seed a different one', () => {
	assert.deepEqual(recallSequence(12345), recallSequence(12345));
	assert.notDeepEqual(recallSequence(12345).slice(0, 12), recallSequence(12346).slice(0, 12));
	assert.equal(recallSequence(1).length, MAX_STEPS);
	assert.deepEqual(recallSequence(5, 20), recallSequence(5).slice(0, 20), 'a shorter draw is the same start');
});

test('rounds: 3 call-ins first, one more each round; 4 buttons, 5 from round 8, 6 from round 14', () => {
	assert.equal(lengthOf(1), START_LENGTH);
	assert.equal(lengthOf(2), START_LENGTH + 1);
	assert.equal(buttonsAt(1), 4);
	assert.equal(buttonsAt(FIFTH_AT - 1), 4);
	assert.equal(buttonsAt(FIFTH_AT), 5);
	assert.equal(buttonsAt(SIXTH_AT), 6);
	assert.equal(RECALL_STREAKS.length, 6);
	for (let r = 1; r < 30; r++) assert.equal(firstRound(lengthOf(r) - 1), r, "each round's newest step is new that round");
});

test('a step only uses the buttons in play when it first appears; new buttons debut as the new step', () => {
	for (const seed of [1, 2, 3, 12345, 987654321]) {
		const seq = recallSequence(seed);
		seq.forEach((b, i) => {
			assert.ok(Number.isInteger(b) && b >= 0 && b < buttonsAt(firstRound(i)), `step ${i}`);
			if (i >= 2) assert.ok(!(seq[i - 1] === b && seq[i - 2] === b), 'never three in a row');
		});
		assert.equal(seq[lengthOf(FIFTH_AT) - 1], 4, 'the Missile debuts in round 8');
		assert.equal(seq[lengthOf(SIXTH_AT) - 1], 5, 'the Nuke debuts in round 14');
		assert.ok(seq.slice(0, lengthOf(FIFTH_AT) - 1).every((b) => b < 4));
	}
});

test('playback gets faster each round, down to a floor', () => {
	let prev = playbackTiming(1);
	assert.deepEqual(prev, { on: 600, gap: 190 });
	for (let r = 2; r < 60; r++) {
		const t = playbackTiming(r);
		assert.ok(t.on <= prev.on && t.gap <= prev.gap);
		assert.ok(t.on >= 260 && t.gap >= 80);
		prev = t;
	}
	assert.ok(playbackTiming(10).on < playbackTiming(1).on);
});

test('score: 100 per step of the longest sequence + 0–10 speed bonus per tap', () => {
	assert.equal(stepBonus(100), 10);
	assert.equal(stepBonus(500), 10);
	assert.equal(stepBonus(750), 5);
	assert.equal(stepBonus(1000), 0);
	assert.equal(stepBonus(5000), 0);
	assert.equal(recallScore(0, 0), 0);
	assert.equal(recallScore(9, 240), 1140);
	assert.equal(recallScore(12, 0), 1200);
});
