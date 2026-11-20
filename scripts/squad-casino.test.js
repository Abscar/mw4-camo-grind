// The daily burger bonus, BurgiCasino's tally, roulette and blackjack (src/lib/squad-casino.ts), and
// how they travel in the squad document and count in the burger bank. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	casinoTotal,
	cleanCasino,
	cleanOnline,
	colorOf,
	countDay,
	dailyRate,
	dailyTotal,
	daysToNextRate,
	dealerPlays,
	handNet,
	handResult,
	handValue,
	isBlackjack,
	isSpot,
	mergeCasino,
	mergeOnline,
	newShoe,
	rouletteNet,
	seedOnline,
	spinNumber,
	spotPays,
	withGame,
	CASINO_DEVICES,
	RED,
	WHEEL
} from '../src/lib/squad-casino.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank, houseOf, BURGERS } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 16, 18);
const seeded = (seed) => () => {
	seed ^= seed << 13;
	seed ^= seed >>> 17;
	seed ^= seed << 5;
	return (seed >>> 0) / 4294967296;
};

test('daily bonus: 2,500 a day, +2,500 every 5 days online (×100 since 2026-11-20)', () => {
	assert.deepEqual([1, 5, 6, 10, 11, 16].map(dailyRate), [2500, 2500, 5000, 5000, 7500, 10000]);
	assert.equal(dailyRate(0), 0);
	assert.equal(dailyTotal(0), 0);
	assert.equal(dailyTotal(1), 2500);
	assert.equal(dailyTotal(5), 12500);
	assert.equal(dailyTotal(6), 17500);
	assert.equal(dailyTotal(10), 37500);
	assert.equal(dailyTotal(12), 52500);
	assert.equal(dailyTotal(31), 280000, 'days 1–31: 2,500·5 + 5,000·5 + … + 15,000·5 + 17,500');
	// the closed form matches adding day by day
	let sum = 0;
	for (let n = 1; n <= 60; n++) {
		sum += dailyRate(n);
		assert.equal(dailyTotal(n), sum, `day ${n}`);
	}
	assert.equal(daysToNextRate(1), 5, 'day 1 → day 6');
	assert.equal(daysToNextRate(5), 1, 'day 5 → tomorrow');
	assert.equal(daysToNextRate(31), 5, 'day 31 → day 36');
	for (const n of [1, 4, 5, 6, 12, 31, 35]) assert.ok(dailyRate(n + daysToNextRate(n)) > dailyRate(n) && dailyRate(n + daysToNextRate(n) - 1) === dailyRate(n), `day ${n}`);
});

test('a day counts once, two devices merge, the start comes from played days', () => {
	let { next, added } = countDay(undefined, '2026-11-16');
	assert.deepEqual(next, { n: 1, last: '2026-11-16' });
	assert.equal(added, 2500);
	assert.equal(countDay(next, '2026-11-16').added, 0, 'same day again');
	({ next, added } = countDay({ n: 5, last: '2026-11-10' }, '2026-11-16'));
	assert.deepEqual([next.n, added], [6, 5000], 'days need not be in a row');
	assert.deepEqual(
		countDay({ n: 5, last: '2026-11-15', b420: 25, d420: '2026-11-15' }, '2026-11-16').next,
		{ n: 6, last: '2026-11-16', b420: 25, d420: '2026-11-15' },
		'a new day keeps the 4:20 extras'
	);
	assert.deepEqual(mergeOnline({ n: 3, last: '2026-11-15' }, { n: 4, last: '2026-11-14' }), { n: 4, last: '2026-11-14' });
	assert.deepEqual(mergeOnline({ n: 4, last: '2026-11-15' }, { n: 4, last: '2026-11-16' }), { n: 4, last: '2026-11-16' });
	assert.equal(mergeOnline(undefined, undefined), undefined);
	assert.deepEqual(seedOnline({ '2026-11-12': 30, '2026-11-14': 0, '2026-11-15': 12 }), { n: 2, last: '2026-11-15' });
	assert.equal(seedOnline({}), undefined);
	assert.equal(cleanOnline({ n: 0, last: '2026-11-16' }), undefined);
	assert.equal(cleanOnline({ n: 2, last: 'yesterday' }), undefined);
	assert.deepEqual(cleanOnline({ n: 2, last: '2026-11-16' }), { n: 2, last: '2026-11-16' });
});

test('casino tally: per device, merged, capped', () => {
	let l = withGame(undefined, 'pcdev1', -10, T);
	l = withGame(l, 'pcdev1', 35, T + 1);
	l = withGame(l, 'phone22', -5, T + 2);
	assert.deepEqual(casinoTotal(l), { net: 20, games: 3, lost: 15 });
	const other = { pcdev1: { net: 100, games: 9, at: T + 50 } };
	assert.deepEqual(casinoTotal(mergeCasino(l, other)), { net: 95, games: 10, lost: 5 }, 'the later tally of a device wins');
	let many = {};
	for (let i = 0; i < CASINO_DEVICES + 3; i++) many = withGame(many, `dev${i}xx`, 1, T + i);
	assert.equal(Object.keys(many).length, CASINO_DEVICES);
	assert.equal(cleanCasino({ 'b a d': { net: 1, games: 1, at: T } }), undefined);
	assert.equal(cleanCasino({ okdev1: { net: 1.5, games: 1, at: T } }), undefined);
	assert.deepEqual(cleanCasino({ okdev1: { net: -40, games: 2, at: T } }), { okdev1: { net: -40, games: 2, at: T } });
	// a huge win stays: past 100M the whole tally used to be thrown away (burgers and leaderboard row gone)
	const rich = withGame({ okdev1: { net: 99_000_000, games: 400, at: T, lost: 5 } }, 'okdev1', 100_000_000, T + 1);
	assert.deepEqual(cleanCasino(JSON.parse(JSON.stringify(rich))), rich);
	assert.equal(casinoTotal(cleanCasino(rich)).net, 199_000_000);
	assert.equal(cleanCasino({ okdev1: { net: 5e18, games: 1, at: T } }).okdev1.net, 1e15, 'held at the limit, not dropped');
});

test('the bank counts the daily bonus and the casino', () => {
	const members = {
		aaaaaaaa1111: { name: 'Abscar', weapons: {}, mastery: {}, online: { n: 6, last: '2026-11-16' }, casino: { pcdev1: { net: 40, games: 2, at: T } } },
		bbbbbbbb2222: { name: 'Ingman', weapons: {}, mastery: {}, casino: { phone1: { net: -500, games: 9, at: T } } }
	};
	const bank = burgerBank({ members: {} }, members);
	assert.equal(bank.aaaaaaaa1111.daily, 17500, 'the days counted before the ×100 pay the new rate too');
	assert.equal(bank.aaaaaaaa1111.balance, BURGERS.start + 17500 + 40);
	assert.equal(bank.bbbbbbbb2222.balance, 0, 'never below zero on show');
});

test('the house: everything the others lose goes to Abscar (but not Abscar’s own losses)', () => {
	// lost burgers are counted per game, not just what's below zero
	let l = withGame(undefined, 'pcdev1', -10, T);
	l = withGame(l, 'pcdev1', 35, T + 1);
	l = withGame(l, 'pcdev1', -5, T + 2);
	assert.deepEqual(casinoTotal(l), { net: 20, games: 3, lost: 15 });
	// a tally from before `lost` existed counts what's below zero of its net
	assert.equal(casinoTotal({ olddev: { net: -40, games: 3, at: T } }).lost, 40);
	assert.equal(casinoTotal({ olddev: { net: 25, games: 3, at: T } }).lost, 0);
	assert.equal(withGame({ olddev: { net: -40, games: 3, at: T } }, 'olddev', -10, T + 1).olddev.lost, 50);
	assert.deepEqual(cleanCasino({ d1d1: { net: 5, games: 2, at: T, lost: 20 } }), { d1d1: { net: 5, games: 2, at: T, lost: 20 } });

	const members = {
		aaaaaaaa1111: { name: 'Abscar', op: 'abscar', weapons: {}, mastery: {}, casino: { pc: { net: -30, games: 2, at: T, lost: 30 } } },
		bbbbbbbb2222: { name: 'Ingman', op: 'ingman', weapons: {}, mastery: {}, casino: { ph: { net: -100, games: 6, at: T, lost: 160 } } },
		cccccccc3333: { name: 'Lars', op: 'lars', weapons: {}, mastery: {}, casino: { ph: { net: 40, games: 2, at: T, lost: 10 } } }
	};
	assert.equal(houseOf(members), 'aaaaaaaa1111');
	// a lost bet on the race counts too
	const doc = { members: {}, bets: [{ id: 'bet1', by: 'cccccccc3333', kind: 'duel', ref: 'gone-duel', pick: 'bbbbbbbb2222', amount: 7, at: T }] };
	const withSettled = { ...doc, settled: [{ id: 'gone-duel', w: 'aaaaaaaa1111', l: 'bbbbbbbb2222' }] };
	const bank = burgerBank(withSettled, members);
	assert.equal(bank.cccccccc3333.lost, 7, 'Lars lost his bet');
	assert.equal(bank.aaaaaaaa1111.house, 160 + 10 + 7, "Ingman's and Lars's casino losses + Lars's lost bet");
	assert.equal(bank.aaaaaaaa1111.balance, BURGERS.start - 30 + 177);
	assert.equal(bank.bbbbbbbb2222.house, 0);
	// nobody is Abscar: lost burgers just go
	const noHouse = { bbbbbbbb2222: members.bbbbbbbb2222 };
	assert.equal(houseOf(noHouse), null);
	assert.equal(burgerBank({ members: {} }, noHouse).bbbbbbbb2222.house, 0);
});

test('roulette: wheel, colours, payouts', () => {
	assert.equal(WHEEL.length, 37);
	assert.equal(new Set(WHEEL).size, 37);
	assert.equal(RED.size, 18);
	assert.equal(colorOf(0), 'green');
	assert.equal(colorOf(32), 'red');
	assert.equal(colorOf(15), 'black');
	// on the wheel the colours alternate after the zero
	for (let i = 1; i < 36; i++) assert.notEqual(colorOf(WHEEL[i]), colorOf(WHEEL[i + 1]));
	assert.equal(spotPays('n17', 17), 35);
	assert.equal(spotPays('n17', 18), -1);
	assert.equal(spotPays('red', 1), 1);
	assert.equal(spotPays('red', 2), -1);
	assert.equal(spotPays('red', 0), -1, 'the zero loses outside bets');
	assert.equal(spotPays('d2', 13), 2);
	assert.equal(spotPays('c1', 34), 2);
	assert.equal(spotPays('c3', 36), 2);
	assert.equal(spotPays('high', 19), 1);
	assert.equal(rouletteNet({ red: 10, n17: 1, d1: 5 }, 17), -10 + 35 - 5);
	assert.ok(isSpot('n0') && isSpot('n36') && isSpot('odd') && !isSpot('n37') && !isSpot('x'));
	// house edge: every single bet type returns 36/37 of the stake over all 37 numbers
	for (const spot of ['red', 'odd', 'low', 'd1', 'c2', 'n5', 'n0']) {
		const total = Array.from({ length: 37 }, (_, n) => spotPays(spot, n)).reduce((a, b) => a + b, 0);
		assert.equal(total, -1, spot);
	}
	const rand = seeded(7);
	const counts = new Array(37).fill(0);
	for (let i = 0; i < 37_000; i++) counts[spinNumber(rand)]++;
	assert.ok(counts.every((c) => c > 800 && c < 1200), 'every number comes up about equally');
});

test('blackjack: hand values, the dealer, results and payouts', () => {
	const c = (r, s = 'S') => ({ r, s });
	assert.deepEqual(handValue([c(1), c(13)]), { total: 21, soft: true });
	assert.deepEqual(handValue([c(1), c(1), c(9)]), { total: 21, soft: true });
	assert.deepEqual(handValue([c(1), c(9), c(5)]), { total: 15, soft: false });
	assert.deepEqual(handValue([c(10), c(12), c(2)]), { total: 22, soft: false });
	assert.ok(isBlackjack([c(1), c(11)]));
	assert.ok(!isBlackjack([c(7), c(7), c(7)]));
	// the dealer stands on soft 17, draws on 16
	const deck = [c(5), c(10)];
	assert.equal(handValue(dealerPlays([c(1), c(6)], () => deck.pop())).total, 17);
	const deck2 = [c(3)];
	assert.deepEqual(dealerPlays([c(10), c(6)], () => deck2.pop()).length, 3);
	assert.equal(handResult([c(1), c(13)], [c(10), c(9)]), 'blackjack');
	assert.equal(handResult([c(1), c(13)], [c(1), c(12)]), 'push');
	assert.equal(handResult([c(10), c(9)], [c(1), c(12)]), 'lose');
	assert.equal(handResult([c(10), c(9), c(5)], [c(10), c(6), c(10)]), 'bust', 'the player busts first');
	assert.equal(handResult([c(10), c(8)], [c(10), c(6), c(10)]), 'dealerBust');
	assert.equal(handResult([c(10), c(8)], [c(10), c(8)]), 'push');
	assert.equal(handNet('blackjack', 10), 15);
	assert.equal(handNet('blackjack', 5), 7, '3:2 rounded down');
	assert.equal(handNet('win', 10, true), 20);
	assert.equal(handNet('bust', 10, true), -20);
	assert.equal(handNet('push', 10), 0);
	const shoe = newShoe(seeded(3));
	assert.equal(shoe.length, 312);
	assert.equal(new Set(shoe.map((x) => `${x.r}${x.s}`)).size, 52);
});

test('the daily days and the casino travel in the squad document', () => {
	const me = { name: 'Abscar', op: 'abscar' };
	const progress = { weapons: {}, mastery: {}, lastTickAt: null };
	const online = { n: 3, last: '2026-11-16' };
	const casino = { pcdev1: { net: -25, games: 4, at: T } };
	const entry = memberEntry(me, progress, T, false, { online, casino });
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { abcdefgh1234: entry } }))));
	assert.deepEqual(doc.members.abcdefgh1234.online, online);
	assert.deepEqual(doc.members.abcdefgh1234.casino, casino);
	assert.equal(doc.members.abcdefgh1234.more, undefined);
	const old = memberEntry(me, progress, T);
	assert.equal(old.online, undefined);
	assert.equal(old.casino, undefined);
});
