// BurgiCasino's floor (src/lib/casinoFloor.ts): which radio lines the jackpot ticker shows, the
// biggest win, the HOT tile, the coin bursts and the daily-bonus meter. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { asWin, bonusMeter, floorNews, gainFx, hotGame, minutesAgo, seeded, TICKER_MAX, WIN_DAYS } from '../src/lib/casinoFloor.ts';
import { DAILY, daysToNextRate } from '../src/lib/squad-casino.ts';
import { t } from '../src/lib/i18n/en.ts';

const NOW = Date.UTC(2026, 10, 20, 20);
let n = 0;
const msg = (text, ago = 0, kind = 'event', name = 'Ingman') => ({ id: `m${n++}`, from: 'x', name, text, at: NOW - ago, kind });
const ev = t.casino.event;

test('every casino win line the games post is read as a win, with its amount and game', () => {
	const cases = [
		[ev.slots(42000, 'big'), 42000, 'slots'],
		[ev.slots(5000, 'jackpot'), 5000, 'slots'],
		[ev.fortune2(184250, 'mega'), 184250, 'fortune2'],
		[ev.book(12000, 'big'), 12000, 'book'],
		[ev.kushburst(9000, 'kushburst'), 9000, 'kushburst'],
		[ev.roulette(3500, 17, 'black'), 3500, 'roulette'],
		[ev.blackjack(7500, true), 7500, 'blackjack'],
		[ev.blackjack(250, false), 250, 'blackjack'],
		[ev.bjSide('Perfect Pairs', 'perfect pair', 1250), 1250, 'blackjack']
	];
	for (const [text, amount, game] of cases) {
		const w = asWin(msg(text));
		assert.ok(w, text);
		assert.equal(w.amount, amount, text);
		assert.equal(w.game, game, text);
	}
});

test('every game’s own radio line is known by its emoji (a new game: add its emoji to GAME_MARK in casinoFloor.ts)', () => {
	const sideLines = new Set(['bjSide', 'bookGamble']);
	for (const [key, fn] of Object.entries(ev)) {
		if (sideLines.has(key) || typeof fn !== 'function') continue;
		const w = asWin(msg(fn(5000, 'big', 'red')));
		assert.ok(w, `${key}: not read as a win`);
		assert.equal(w.game, key, `${key}: its radio line's last emoji isn't in GAME_MARK`);
	}
});

test('losses, chat lines and other events are not wins', () => {
	assert.equal(asWin(msg(ev.roulette(-300, 4, 'black'))), null);
	assert.equal(asWin(msg(ev.blackjack(-50, false))), null);
	assert.equal(asWin(msg('won 500 🍔 on roulette (2 black) 🎡', 0, 'msg')), null, 'a typed chat line');
	assert.equal(asWin(msg('gave Ingman 300 🍔 (admin) 🎁')), null);
	assert.equal(asWin(msg(t.donate.event(500, 'Holk Relief'))), null, 'a donation');
	assert.equal(asWin(msg('maxed the M4 🔥')), null);
	assert.equal(asWin(msg('hit a BIG WIN on Something: +0 🍔 🎰')), null);
});

test('a win line from a game the floor doesn’t know yet still counts, without a game', () => {
	const w = asWin(msg('hit a BIG WIN on Something New: +9,000 🍔 🌿'));
	assert.equal(w?.amount, 9000);
	assert.equal(w?.game, null);
});

test('the ticker: newest first, at most TICKER_MAX, only the last WIN_DAYS days; the biggest among them all', () => {
	const msgs = [];
	for (let i = 0; i < 14; i++) msgs.push(msg(ev.slots(100 + i, 'big'), i * 60_000));
	msgs.push(msg(ev.fortune2(90000, 'mega'), 3 * 86_400_000)); // older than the 10 newest, still the biggest
	msgs.push(msg(ev.fortune2(999999, 'epic'), (WIN_DAYS + 1) * 86_400_000)); // too old
	msgs.push(msg(ev.roulette(-50, 1, 'red'), 0));
	const { recent, biggest } = floorNews(msgs, NOW);
	assert.equal(recent.length, TICKER_MAX);
	assert.equal(recent[0].amount, 100);
	assert.ok(recent.every((w, i) => i === 0 || recent[i - 1].at >= w.at));
	assert.equal(biggest?.amount, 90000);
	assert.deepEqual(floorNews(undefined, NOW), { recent: [], biggest: null });
	assert.deepEqual(floorNews([msg('hello', 0, 'msg')], NOW), { recent: [], biggest: null });
});

test('HOT tile: the game with the most wins in the last 24 h, a tie goes to the newest', () => {
	const wins = [
		msg(ev.roulette(100, 1, 'red'), 10 * 60_000),
		msg(ev.roulette(100, 1, 'red'), 20 * 60_000),
		msg(ev.slots(500, 'big'), 5 * 60_000),
		msg(ev.slots(500, 'big'), 50 * 60_000),
		msg(ev.fortune2(500, 'big'), 2 * 86_400_000),
		msg(ev.fortune2(500, 'big'), 2 * 86_400_000),
		msg(ev.fortune2(500, 'big'), 2 * 86_400_000)
	].map(asWin);
	assert.equal(hotGame(wins, NOW), 'slots', 'two each in the last day, slots won last; the old fortune2 wins don’t count');
	assert.equal(hotGame([], NOW), null);
});

test('coin bursts: more coins for bigger gains (4–14), confetti only for a big one', () => {
	assert.deepEqual(gainFx(0, 100), { coins: 0, confetti: false });
	assert.deepEqual(gainFx(-50, 100), { coins: 0, confetti: false });
	assert.equal(gainFx(1, 100).coins, 4);
	assert.ok(gainFx(500, 100).coins > gainFx(20, 100).coins);
	assert.equal(gainFx(10 ** 9, 100).coins, 14);
	assert.equal(gainFx(999, 0).confetti, false, 'under 1,000');
	assert.equal(gainFx(1000, 5000).confetti, true);
	assert.equal(gainFx(5000, 400000).confetti, false, 'small next to what you have');
	assert.equal(gainFx(50000, 400000).confetti, true);
});

test('daily-bonus meter: day n of the current block of DAILY.every days', () => {
	const every = DAILY.every;
	assert.equal(bonusMeter(0, every, daysToNextRate(0)), 0);
	const got = Array.from({ length: every * 2 + 1 }, (_, i) => bonusMeter(i + 1, every, daysToNextRate(i + 1)));
	assert.deepEqual(got.slice(0, every), Array.from({ length: every }, (_, i) => i + 1));
	assert.equal(got[every], 1, 'a new block starts');
});

test('small helpers', () => {
	assert.equal(minutesAgo(NOW - 59_000, NOW), 0);
	assert.equal(minutesAgo(NOW - 61_000, NOW), 1);
	assert.equal(minutesAgo(NOW + 5000, NOW), 0);
	const a = seeded(7);
	const b = seeded(7);
	const xs = Array.from({ length: 20 }, () => a());
	assert.deepEqual(xs, Array.from({ length: 20 }, () => b()));
	assert.ok(xs.every((x) => x >= 0 && x < 1));
});
