// BurgiCasino's Case Battles (src/lib/cases.ts). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { battleCost, botsFor, caseRtp, drawItem, gradeOf, lookOf, openCases, runBattle, BATTLE_MODES, BATTLE_SIZES, CASE_BY_ID, CASES, RTP, SEATS } from '../src/lib/cases.ts';

function seeded(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

test('lots of cases, unique ids, every item drawable, chances add up', () => {
	assert.ok(CASES.length >= 40, `${CASES.length} cases`);
	assert.equal(new Set(CASES.map((c) => c.id)).size, CASES.length);
	for (const c of CASES) {
		assert.ok(c.items.length >= 2, c.id);
		assert.equal(new Set(c.items.map((i) => i.ref)).size, c.items.length, `${c.id}: duplicate item`);
		for (const it of c.items) {
			assert.ok(lookOf(it.ref), `${c.id}: ${it.ref} can't be drawn`);
			assert.ok(it.value >= 1 && Number.isInteger(it.value), `${c.id}: ${it.ref} value`);
			assert.ok(it.p > 0, `${c.id}: ${it.ref} chance`);
		}
		const sum = c.items.reduce((a, i) => a + i.p, 0);
		assert.ok(Math.abs(sum - 1) < 1e-9, `${c.id}: chances add to ${sum}`);
		assert.equal(c.items[0].ref, c.cover);
		// dearest first
		for (let i = 1; i < c.items.length; i++) assert.ok(c.items[i - 1].value >= c.items[i].value * 0.99, `${c.id}: order at ${i}`);
	}
});

test('every case pays back about RTP', () => {
	for (const c of CASES) {
		const r = caseRtp(c);
		assert.ok(Math.abs(r - RTP) < 0.02, `${c.id}: ${r.toFixed(3)}`);
	}
});

test('uses the drawn CS2 skins a lot', () => {
	const cs2 = new Set(CASES.flatMap((c) => c.items.filter((i) => i.ref.startsWith('cs2:')).map((i) => i.ref)));
	assert.ok(cs2.size >= 50, `${cs2.size} different CS2 skins`);
});

test('drawItem follows the chances', () => {
	const c = CASE_BY_ID.get('fifty-fifty');
	const r = seeded(4);
	const n = [0, 0];
	for (let i = 0; i < 20000; i++) n[drawItem(c, r)]++;
	assert.ok(Math.abs(n[0] / 20000 - 0.5) < 0.02);
	assert.equal(gradeOf(0.1), 'consumer');
	assert.equal(gradeOf(500), 'gold');
});

test('opening: cost, won and net add up; at most 5', () => {
	const o = openCases('holk', 9, seeded(1));
	assert.equal(o.pulls.length, 5);
	assert.equal(o.cost, 5 * CASE_BY_ID.get('holk').price);
	assert.equal(o.net, o.won - o.cost);
});

test('battles: payouts never more than the pot, the right winners per mode', () => {
	const r = seeded(9);
	for (const size of BATTLE_SIZES)
		for (const mode of BATTLE_MODES) {
			const b = runBattle(['holk', 'gold-rush', 'fade'], size, mode, r);
			assert.equal(b.pulls.length, SEATS[size]);
			assert.equal(b.cost, battleCost(['holk', 'gold-rush', 'fade']));
			assert.ok(b.payout.reduce((a, x) => a + x, 0) <= b.pot);
			assert.equal(b.net, b.payout[0] - b.cost);
			if (mode === 'share') assert.equal(b.winners.length, SEATS[size]);
			if (size === '2v2' && mode !== 'share') assert.ok(b.winners.length >= 2, 'a team wins together');
			if (mode === 'crazy' && size !== '2v2') assert.equal(b.score[b.winners[0]], Math.min(...b.score));
			if (mode === 'terminal') assert.equal(b.score[0], b.values[0][2] + (size === '2v2' ? b.values[1][2] : 0));
		}
});

test('a battle pays back about RTP on average (fair between seats)', () => {
	const r = seeded(77);
	let cost = 0,
		got = 0;
	for (let i = 0; i < 40000; i++) {
		const b = runBattle(['pocket-change', 'burger-box'], '1v1v1', 'normal', r);
		cost += b.cost;
		got += b.payout[0];
	}
	assert.ok(Math.abs(got / cost - RTP) < 0.04, (got / cost).toFixed(3));
});

test('bots are never your own operator', () => {
	for (let s = 0; s < 50; s++) {
		const b = botsFor('1v1v1v1', 'phillestar', s);
		assert.equal(b.length, 3);
		assert.ok(!b.some((x) => x.op === 'phillestar'));
		assert.equal(new Set(b.map((x) => x.op)).size, 3);
	}
});
