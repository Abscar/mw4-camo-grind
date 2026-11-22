// BurgiArcade (src/lib/arcade.ts + arcade-prizes.ts + arcade/rng.ts + arcade/looks.ts): high scores, week/day
// boards, tickets, the record bonus, two devices, the hall of fame, the champ race, rematches, Quickscope duels,
// the prize counter (worn like BurgiShop items, paid in tickets, never burgers), the squad document. `npm test`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
	addDuel,
	bestOfOthers,
	cleanArcade,
	dailySeed,
	dayKey,
	duelOutcome,
	duelsFor,
	hallOf,
	mergeArcade,
	playDuel,
	recordPlay,
	rematches,
	ticketsFor,
	ticketsOf,
	weekChampions,
	weekKey,
	weekStandings,
	ARCADE_GAMES,
	GAME_META,
	TICKETS_DAILY,
	TICKETS_MIN,
	TICKETS_PB,
	TICKETS_RECORD
} from '../src/lib/arcade.ts';
import { ARCADE_ITEMS, buyPrize, ownPrizes, PRIZE_KINDS } from '../src/lib/arcade-prizes.ts';
import { rng, hashSeed, shuffled } from '../src/lib/arcade/rng.ts';
import { GAME_LOOKS } from '../src/lib/arcade/looks.ts';
import { GLYPHS } from '../src/lib/logoGlyphs.ts';
import { buy, cleanShop, giveItem, sellValue, worn, ITEM_BY_ID, WEAR_SLOTS } from '../src/lib/shop.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';

const T0 = new Date(2026, 10, 22, 20, 0).getTime(); // a Sunday evening, local time
const DAY = 86_400_000;
const dev = 'dev-aaaa';

test('days, weeks and the daily seed', () => {
	assert.equal(dayKey(T0), '2026-11-22');
	assert.equal(weekKey(T0), '2026-11-16'); // Sunday belongs to the week that started on Monday the 16th
	assert.equal(weekKey(T0 + DAY), '2026-11-23');
	assert.equal(dailySeed('snake', '2026-11-22'), dailySeed('snake', '2026-11-22'));
	assert.notEqual(dailySeed('snake', '2026-11-22'), dailySeed('snake', '2026-11-23'));
	assert.notEqual(dailySeed('snake', '2026-11-22'), dailySeed('stack', '2026-11-22'));
});

test('the seeded randomness repeats itself', () => {
	const a = rng(42),
		b = rng(42);
	for (let i = 0; i < 100; i++) assert.equal(a(), b());
	const r = rng(7);
	for (let i = 0; i < 1000; i++) {
		const x = r();
		assert.ok(x >= 0 && x < 1);
	}
	assert.deepEqual(shuffled(rng(3), [1, 2, 3, 4, 5]), shuffled(rng(3), [1, 2, 3, 4, 5]));
	assert.equal(hashSeed('x'), hashSeed('x'));
});

test('tickets per score: at least the minimum, at most the game cap', () => {
	for (const g of ARCADE_GAMES) {
		assert.equal(ticketsFor(g, 0), TICKETS_MIN);
		assert.equal(ticketsFor(g, 1e9), GAME_META[g].max);
		assert.ok(ticketsFor(g, GAME_META[g].per * 30) > ticketsFor(g, GAME_META[g].per * 5));
	}
});

test('a play: best, week, day marks, plays, tickets per device, bonuses', () => {
	let r = recordPlay(undefined, 'snake', 300, { at: T0, device: dev, daily: false, squadBest: null });
	assert.equal(r.pb, true);
	assert.equal(r.prev, 0);
	assert.equal(r.record, false); // outside a squad: no record bonus
	assert.equal(r.parts.pb, TICKETS_PB);
	assert.equal(r.tickets, ticketsFor('snake', 300) + TICKETS_PB);
	assert.deepEqual(r.state.g.snake, { b: 300, at: T0, n: 1, w: { k: '2026-11-16', s: 300, at: T0 } });
	// a worse play: no PB, the best stays, plays count up
	r = recordPlay(r.state, 'snake', 200, { at: T0 + 1000, device: dev, daily: false, squadBest: 0 });
	assert.equal(r.pb, false);
	assert.equal(r.state.g.snake.b, 300);
	assert.equal(r.state.g.snake.n, 2);
	// a daily play: the day mark + the daily bonus once a day
	r = recordPlay(r.state, 'snake', 250, { at: T0 + 2000, device: dev, daily: true, squadBest: 0 });
	assert.equal(r.parts.daily, TICKETS_DAILY);
	assert.deepEqual(r.state.g.snake.d, { k: '2026-11-22', s: 250, at: T0 + 2000 });
	r = recordPlay(r.state, 'snake', 100, { at: T0 + 3000, device: dev, daily: true, squadBest: 0 });
	assert.equal(r.parts.daily, 0);
	assert.equal(r.state.g.snake.d.s, 250);
	// the squad's record: beat everyone else's best and your own
	r = recordPlay(r.state, 'snake', 500, { at: T0 + 4000, device: dev, daily: false, squadBest: 450 });
	assert.equal(r.record, true);
	assert.equal(r.parts.record, TICKETS_RECORD);
	r = recordPlay(r.state, 'snake', 501, { at: T0 + 5000, device: dev, daily: false, squadBest: 900 });
	assert.equal(r.record, false);
	// a new week resets the week mark
	r = recordPlay(r.state, 'snake', 10, { at: T0 + DAY, device: dev, daily: false, squadBest: 0 });
	assert.deepEqual(r.state.g.snake.w, { k: '2026-11-23', s: 10, at: T0 + DAY });
	// tickets add up on the device
	const tk = ticketsOf(r.state);
	assert.equal(tk.earned, r.state.tk[dev].e);
	assert.equal(r.state.tk[dev].n, 7);
});

test('cleaning keeps good data, drops junk, keeps a newer page’s games', () => {
	const raw = {
		g: { snake: { b: 5, at: T0, n: 1, w: { k: '2026-11-16', s: 5, at: T0 } }, future: { b: 9, at: T0, n: 1 }, bad: { b: -1, at: T0, n: 1 }, 'x y': { b: 1, at: T0, n: 1 } },
		tk: { [dev]: { e: 40, n: 2, at: T0 }, '?': { e: 1, n: 1, at: T0 } },
		own: { 'a-pet-ghost': 150, 'k-pet-heart': 3 },
		du: { duel1234: { o: 'memberAAAA1', s: 7, at: T0, c: 1, r: [100, 200, -1, 0, 300], ra: T0 + 5 }, bad: { o: 'x', s: 1, at: T0, c: 1 } }
	};
	const c = cleanArcade(raw);
	assert.deepEqual(Object.keys(c.g).sort(), ['future', 'snake']);
	assert.deepEqual(Object.keys(c.tk), [dev]);
	assert.deepEqual(c.own, { 'a-pet-ghost': 150 });
	assert.deepEqual(Object.keys(c.du), ['duel1234']);
	assert.equal(cleanArcade({}), undefined);
	assert.equal(cleanArcade('x'), undefined);
});

test('two devices merge: higher best, later marks, later tally per device, everything owned, duels joined', () => {
	const a = { g: { snake: { b: 300, at: T0, n: 3, w: { k: '2026-11-16', s: 300, at: T0 } } }, tk: { dev1: { e: 50, n: 3, at: T0 } }, own: { 'a-pet-ghost': 150 }, du: { d1: { o: 'memberAAAA1', s: 1, at: T0, c: 1 } } };
	const b = {
		g: { snake: { b: 280, at: T0 + 5, n: 5, w: { k: '2026-11-23', s: 10, at: T0 + DAY } }, stack: { b: 40, at: T0, n: 1 } },
		tk: { dev1: { e: 60, n: 4, at: T0 + 9 }, dev2: { e: 10, n: 1, at: T0 } },
		own: { 'a-mount-cart': 300 },
		du: { d1: { o: 'memberAAAA1', s: 1, at: T0, c: 1, r: [1, 2, 3, 4, 5], ra: T0 + 1 } }
	};
	const m = mergeArcade(a, b);
	assert.equal(m.g.snake.b, 300);
	assert.equal(m.g.snake.n, 5);
	assert.equal(m.g.snake.w.k, '2026-11-23');
	assert.equal(m.g.stack.b, 40);
	assert.equal(m.tk.dev1.e, 60);
	assert.equal(m.tk.dev2.e, 10);
	assert.deepEqual(Object.keys(m.own).sort(), ['a-mount-cart', 'a-pet-ghost']);
	assert.deepEqual(m.du.d1.r, [1, 2, 3, 4, 5]);
	assert.deepEqual(mergeArcade(undefined, b), b);
});

const member = (scores, extra = {}) => ({ arcade: { g: scores, ...extra } });

test('the hall of fame, the best of the others, the champ race and rematches', () => {
	const wk = weekKey(T0);
	const day = dayKey(T0);
	const members = {
		memberAAAA1: member({ snake: { b: 500, at: T0 - 10, n: 4, w: { k: wk, s: 400, at: T0 - 10 }, d: { k: day, s: 120, at: T0 - 5 } }, stack: { b: 80, at: T0 - 50, n: 1, w: { k: wk, s: 80, at: T0 - 50 } } }),
		memberBBBB2: member({ snake: { b: 700, at: T0 - 1, n: 2, w: { k: wk, s: 700, at: T0 - 1 } }, stack: { b: 60, at: T0 - 100, n: 1, w: { k: wk, s: 60, at: T0 - 100 } } }),
		memberCCCC3: member({ snake: { b: 700, at: T0 - 2, n: 9, w: { k: '2026-11-09', s: 700, at: T0 - 2 } } })
	};
	const all = hallOf(members, 'snake', 'all', T0);
	assert.deepEqual(
		all.map((r) => r.id),
		['memberCCCC3', 'memberBBBB2', 'memberAAAA1']
	); // a tie: who got there first
	assert.deepEqual(
		hallOf(members, 'snake', 'week', T0).map((r) => r.id),
		['memberBBBB2', 'memberAAAA1']
	);
	assert.deepEqual(
		hallOf(members, 'snake', 'day', T0).map((r) => r.score),
		[120]
	);
	assert.equal(bestOfOthers(members, 'snake', 'memberAAAA1'), 700);
	assert.equal(bestOfOthers(members, 'zombies', 'memberAAAA1'), 0);
	// week: snake B 5 + A 3, stack A 5 + B 3 → both 8 points, one first each → shared champs
	const st = weekStandings(members, T0);
	assert.deepEqual(
		st.map((c) => [c.id, c.points, c.firsts]),
		[
			['memberAAAA1', 8, 1],
			['memberBBBB2', 8, 1]
		]
	);
	assert.equal(weekChampions(members, T0).length, 2);
	// rematch: A's snake best (T0 − 10) was beaten later by B (T0 − 1) and C (T0 − 2): the top one shows
	const rm = rematches(members, 'memberAAAA1');
	assert.equal(rm.length, 1);
	assert.equal(rm[0].game, 'snake');
	assert.equal(rm[0].score, 700);
	// B's stack best (T0 − 100) was beaten later by A (T0 − 50)
	assert.deepEqual(
		rematches(members, 'memberBBBB2').map((x) => [x.game, x.by]),
		[['stack', 'memberAAAA1']]
	);
});

test('Quickscope duels: challenge, take up, play, who won', () => {
	const A = 'memberAAAA1',
		B = 'memberBBBB2';
	let a = addDuel(undefined, 'duelAAAA', B, 99, T0, false);
	a = playDuel(a, 'duelAAAA', [200, 300, -1, 250, 0], T0 + 10);
	assert.equal(playDuel(a, 'duelAAAA', [1, 1, 1, 1, 1], T0 + 20), null); // only once
	let members = { [A]: { arcade: a }, [B]: { arcade: { g: {} } } };
	// B sees the challenge before taking it up
	let bv = duelsFor(members, B, T0 + 100);
	assert.equal(bv.length, 1);
	assert.equal(bv[0].mine, false);
	assert.equal(bv[0].waiting, 'you');
	assert.equal(bv[0].seed, 99);
	// A waits for B
	assert.equal(duelsFor(members, A, T0 + 100)[0].waiting, 'them');
	// B takes it up and plays
	let b = addDuel(undefined, 'duelAAAA', A, 99, T0, true);
	b = playDuel(b, 'duelAAAA', [180, 320, 400, 0, 0], T0 + 200);
	members = { [A]: { arcade: a }, [B]: { arcade: b } };
	const av = duelsFor(members, A, T0 + 300)[0];
	assert.equal(av.waiting, null);
	// rounds: A loses 1 (180 < 200), wins 2 (300 < 320), loses 3 (foul vs hit), wins 4 (hit vs slow), draws 5 (slow vs slow)
	assert.deepEqual(av.result.per, ['them', 'you', 'them', 'you', 'draw']);
	assert.equal(av.result.winner, 'draw');
	bv = duelsFor(members, B, T0 + 300);
	assert.equal(bv.length, 1);
	assert.equal(bv[0].result.winner, 'draw');
	assert.equal(duelOutcome([100, 100, 100, 100, 100], [200, 200, 200, 200, 200]).winner, 'you');
	// an unanswered challenge expires after a few days
	assert.equal(duelsFor({ [A]: { arcade: addDuel(undefined, 'old12345', B, 1, T0, false) }, [B]: {} }, B, T0 + 10 * DAY).length, 0);
});

test('the prize counter: catalogue, buying with tickets, worn like shop items, never burgers', () => {
	assert.equal(ARCADE_ITEMS.length, 24);
	for (const k of PRIZE_KINDS) assert.equal(ARCADE_ITEMS.filter((i) => i.slot === k).length, 8);
	const ids = new Set();
	for (const it of ARCADE_ITEMS) {
		assert.match(it.id, /^a-(pet|plush|mount)-[a-z]+$/);
		assert.ok(!ids.has(it.id));
		ids.add(it.id);
		assert.equal(it.tickets, true);
		assert.equal(ITEM_BY_ID.get(it.id), it);
	}
	// rarer costs more within a kind
	const order = ['common', 'rare', 'epic', 'legendary'];
	for (const k of PRIZE_KINDS) {
		const list = ARCADE_ITEMS.filter((i) => i.slot === k);
		for (const x of list) for (const y of list) if (order.indexOf(x.rarity) < order.indexOf(y.rarity)) assert.ok(x.price < y.price, `${x.id} < ${y.id}`);
	}
	assert.ok(WEAR_SLOTS.includes('plush') && WEAR_SLOTS.includes('mount'));
	// buy with tickets: owned at 0 burgers, worn at once
	let r = buyPrize(undefined, undefined, 'a-mount-cart', 100, T0);
	assert.equal(r.result, 'broke');
	r = buyPrize({ g: {} }, undefined, 'a-mount-cart', 300, T0);
	assert.equal(r.result, 'ok');
	assert.equal(r.arcade.own['a-mount-cart'], 300);
	assert.equal(r.shop.own['a-mount-cart'], 0);
	assert.equal(r.shop.eq.mount, 'a-mount-cart');
	assert.equal(worn(r.shop).mount.id, 'a-mount-cart');
	assert.equal(buyPrize(r.arcade, r.shop, 'a-mount-cart', 9999, T0).result, 'owned');
	assert.equal(buyPrize(r.arcade, r.shop, 'nope', 9999, T0).result, 'unknown');
	// BurgiShop can't sell, give or buy them with burgers
	assert.equal(buy(undefined, 'a-pet-ghost', 1e9, T0).result, 'unknown');
	assert.equal(sellValue(r.shop, 'a-mount-cart'), 0);
	assert.equal(giveItem(r.shop, 'a-pet-ghost', 'memberBBBB2', undefined, 1e9, T0, 'gift1234').result, 'unknown');
	// cleanShop keeps a worn mount; a lost copy is owned again
	const c = cleanShop(r.shop);
	assert.equal(c.eq.mount, 'a-mount-cart');
	const lost = ownPrizes({ own: {}, eq: {}, at: 0 }, r.arcade);
	assert.equal(lost.own['a-mount-cart'], 0);
	assert.equal(ownPrizes(r.shop, r.arcade), r.shop);
	// tickets spent
	assert.equal(ticketsOf({ g: {}, tk: { dev1: { e: 500, n: 3, at: T0 } }, own: { 'a-mount-cart': 300 } }).balance, 200);
});

test('the squad document carries the arcade', () => {
	const arcade = recordPlay(undefined, 'stack', 120, { at: T0, device: dev, daily: false, squadBest: 0 }).state;
	const e = memberEntry({ id: 'memberAAAA1', name: 'Abscar', op: 'abscar' }, { weapons: {}, mastery: {}, lastTickAt: null }, T0, false, { arcade });
	assert.equal(e.arcade.g.stack.b, 120);
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { memberAAAA1: e } })))).members.memberAAAA1;
	assert.deepEqual(back.arcade, e.arcade);
});

test('every game has a look, its logo letters exist, and its files are there', () => {
	for (const g of ARCADE_GAMES) {
		const L = GAME_LOOKS[g];
		assert.ok(L, g);
		for (const ch of `${L.top}${L.big}BURGIARCADE`) assert.ok(GLYPHS[ch], `${g}: letter ${ch}`);
		const words = readFileSync(new URL(`../src/lib/i18n/arcade/${g}.ts`, import.meta.url), 'utf8');
		assert.match(words, /name:/);
		assert.match(words, /tagline:/);
	}
});
