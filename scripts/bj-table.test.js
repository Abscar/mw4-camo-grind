// BurgiCasino's shared blackjack table (src/lib/bj-table.ts): seats, bets, the seeded deal, actions,
// timeouts, settling, booking, and several players writing to the real sync service code at once.
// `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	act,
	betState,
	canAct,
	dealNow,
	dealerFinal,
	dealerStart,
	emptyTable,
	finish,
	fromTableWire,
	handSides,
	leave,
	liveStake,
	markBooked,
	nextOpenAt,
	placeBet,
	playHand,
	pruneTable,
	roundShoe,
	seatedNow,
	sit,
	sitCheck,
	tableCode,
	toTableWire,
	unbooked,
	viewRound,
	ACT_TIME,
	BET_WINDOW,
	GRACE,
	PAST_KEEP,
	RESULT_PAUSE,
	SEATS,
	SEAT_FRESH
} from '../src/lib/bj-table.ts';
import { boostedNet, cardBoost, handNet, handResult, handValue, isBlackjack, nextStreak, pairKind, sideResult } from '../src/lib/squad-casino.ts';
import { handleDoc } from '../sync-worker/worker.js';

const T0 = 1_800_000_000_000;
const A = { id: 'memberAAAA01', name: 'Abscar', op: 'abscar', dev: 'devA0001' };
const B = { id: 'memberBBBB02', name: 'Ingman', op: 'ingman', dev: 'devB0002' };
const C = { id: 'memberCCCC03', name: 'Robin', op: null, dev: 'devC0003' };
const R1 = { id: 'round0000001', seed: 1 };
const wire = (doc) => fromTableWire(JSON.parse(JSON.stringify(toTableWire(doc))));

/** A seed where the dealer has no blackjack and seat `n` has none either (and optionally more). */
function seedWhere(pred, from = 1) {
	for (let s = from; s < from + 200_000; s++) {
		const shoe = roundShoe(s);
		if (pred(shoe, s)) return s;
	}
	throw new Error('no seed');
}
const plain = (n) => (shoe) => !isBlackjack(dealerStart(shoe)) && !isBlackjack(playHand(shoe, n, '', false).cards);

function seated(...who) {
	let doc = emptyTable();
	for (const p of who) doc = sit(doc, p, T0);
	return doc;
}

test('the table document: round trip, and nothing else is taken for one', () => {
	const doc = placeBet(seated(A, B), A, 25, T0 + 1000, R1);
	assert.deepEqual(wire(doc), doc);
	assert.equal(fromTableWire({ app: 'mw4-camo-grind', radio: 1, msgs: [] }), null);
	assert.equal(fromTableWire({ app: 'mw4-camo-grind', squad: 1, members: {} }), null);
	assert.equal(fromTableWire({ app: 'other', bj: 1 }), null);
	assert.equal(tableCode('abcdefghijklmnopqrstuv'), 'abcdefghijklmnopqrstuv-bj');
	// bad hands are dropped; two seats on one number keep the newer hello; a bad round = none
	const raw = toTableWire(doc);
	raw.round.hands.bad = { n: 1, name: 'x', dev: 'devX', bet: 5, acts: '', at: T0 };
	raw.round.hands.memberZZZZ99 = { n: 0, name: 'Dup', dev: 'devZ0001', bet: 5, acts: '', at: T0 };
	raw.round.hands.memberYYYY98 = { n: 3, name: 'Y', dev: 'devY0001', bet: 0, acts: '', at: T0 };
	raw.seats.memberZZZZ99 = { n: 0, name: 'Old', dev: 'devZ0001', seen: T0 - 1 };
	const back = fromTableWire(raw);
	assert.deepEqual(Object.keys(back.round.hands), [A.id]);
	assert.equal(back.seats[A.id].n, 0);
	assert.equal(back.seats.memberZZZZ99, undefined);
	assert.equal(fromTableWire({ ...raw, round: { id: 'x' } }).round, null);
});

test('seats: lowest free number, one device per member, five at most, stale ones go', () => {
	let doc = seated(A, B, C);
	assert.deepEqual(
		seatedNow(doc, T0).map((s) => [s.seat.name, s.seat.n]),
		[['Abscar', 0], ['Ingman', 1], ['Robin', 2]]
	);
	assert.equal(doc.seats[C.id].op, undefined);
	// the same member on another device watches while the first seat is fresh
	assert.equal(sitCheck(doc, { ...A, dev: 'devA9999' }, T0 + 1000), 'other-device');
	assert.equal(sit(doc, { ...A, dev: 'devA9999' }, T0 + 1000), null);
	// … and takes the seat over once it went quiet
	const later = T0 + SEAT_FRESH + 1;
	const moved = sit(doc, { ...A, dev: 'devA9999' }, later);
	assert.equal(moved.seats[A.id].dev, 'devA9999');
	assert.equal(moved.seats[B.id], undefined, 'quiet seats are pruned on every write');
	// a hello keeps your number
	doc = sit(doc, B, T0 + 5000);
	assert.equal(doc.seats[B.id].n, 1);
	assert.equal(doc.seats[B.id].seen, T0 + 5000);
	// leaving frees the seat for the next one
	doc = leave(doc, A.id, A.dev, T0 + 6000);
	assert.equal(doc.seats[A.id], undefined);
	assert.equal(leave(doc, B.id, 'devWrong', T0 + 6000), null);
	const D = { id: 'memberDDDD04', name: 'D', op: null, dev: 'devD0004' };
	doc = sit(doc, D, T0 + 7000);
	assert.equal(doc.seats[D.id].n, 0);
	// full table
	for (let i = 0; i < SEATS; i++) doc = sit(doc, { id: `memberFILL0${i}`, name: `F${i}`, op: null, dev: `devF000${i}` }, T0 + 8000) ?? doc;
	assert.equal(seatedNow(doc, T0 + 8000).length, SEATS);
	assert.equal(sitCheck(doc, { id: 'memberLATE99', name: 'L', op: null, dev: 'devL0001' }, T0 + 8000), 'full');
});

test('alone at the table the cards come at once; with others there the bets stay open', () => {
	const solo = placeBet(seated(A), A, 25, T0 + 1000, R1);
	assert.equal(solo.round.dealAt, T0 + 1000);
	assert.equal(viewRound(solo.round, T0 + 1000).phase === 'betting', false);

	let doc = placeBet(seated(A, B), A, 25, T0 + 1000, R1);
	assert.equal(doc.round.dealAt, T0 + 1000 + BET_WINDOW);
	assert.equal(viewRound(doc.round, T0 + 2000).phase, 'betting');
	assert.equal(betState(doc, B.id, B.dev, T0 + 2000), 'join');
	assert.equal(betState(doc, A.id, A.dev, T0 + 2000), 'in');
	assert.equal(placeBet(doc, A, 50, T0 + 2000, R1), null, 'one bet per hand');
	// everyone seated has bet: it deals right away
	doc = placeBet(doc, B, 10, T0 + 3000, R1);
	assert.equal(doc.round.dealAt, T0 + 3000);
	assert.deepEqual(
		viewRound(doc.round, T0 + 3000).seats.map((s) => s.hand.name),
		['Abscar', 'Ingman']
	);

	// a third seated player who doesn't bet: the window runs out, or someone deals now
	let three = placeBet(seated(A, B, C), A, 25, T0 + 1000, R1);
	three = placeBet(three, B, 25, T0 + 2000, R1);
	assert.equal(three.round.dealAt, T0 + 1000 + BET_WINDOW);
	assert.equal(dealNow(three, C.id, C.dev, T0 + 2500), null, 'only someone in the hand may');
	three = dealNow(three, B.id, B.dev, T0 + 2500);
	assert.equal(three.round.dealAt, T0 + 2500);
	assert.equal(betState(three, C.id, C.dev, T0 + 2600), 'wait');
	assert.equal(placeBet(three, C, 25, T0 + 2600, R1), null, 'too late to join');
	// bad amounts, no seat
	assert.equal(placeBet(seated(A), A, 0, T0, R1), null);
	assert.equal(placeBet(seated(A), A, 2.5, T0, R1), null);
	assert.equal(placeBet(seated(A), A, 10_001, T0, R1), null);
	assert.equal(placeBet(seated(B), A, 10, T0, R1), null);
	assert.equal(betState(seated(B), A.id, A.dev, T0), 'seat');
});

test('the deal is the same on every page, and nobody’s cards depend on who else plays', () => {
	const seed = seedWhere(plain(1));
	const withA = placeBet(placeBet(seated(A, B), A, 5, T0, { id: R1.id, seed }), B, 5, T0 + 100, R1);
	const shoeAgain = roundShoe(seed);
	const ingman = viewRound(withA.round, T0 + 200).seats.find((s) => s.id === B.id);
	assert.deepEqual(ingman.play.cards, playHand(shoeAgain, 1, '', false).cards);
	// Ingman alone in seat 1 of the same round gets the same two cards
	let alone = sit(sit(emptyTable(), A, T0), B, T0);
	alone = leave(alone, A.id, A.dev, T0);
	alone = placeBet(alone, B, 5, T0 + 100, { id: R1.id, seed });
	assert.equal(alone.round.hands[B.id].n, 1);
	assert.deepEqual(viewRound(alone.round, T0 + 200).seats[0].play.cards, ingman.play.cards);
	// the dealer hides nothing different either
	assert.deepEqual(viewRound(withA.round, T0 + 200).dealer, dealerStart(shoeAgain));
});

test('hit, stand, double: the solo rules, and the last move settles the round', () => {
	// a seed where seat 0 starts on 11 or less without a blackjack anywhere: hitting can't bust
	const seed = seedWhere((shoe) => plain(0)(shoe) && handValue(playHand(shoe, 0, '', false).cards).total <= 11);
	let doc = placeBet(seated(A), A, 20, T0, { id: R1.id, seed });
	assert.equal(canAct(doc.round, A.id, A.dev, T0 + 1), true);
	assert.equal(canAct(doc.round, A.id, 'devOther', T0 + 1), false);
	assert.equal(act(doc, B.id, B.dev, 'h', T0 + 1), null);
	doc = act(doc, A.id, A.dev, 'h', T0 + 1000);
	const after = viewRound(doc.round, T0 + 1000).seats[0].play;
	assert.equal(after.cards.length, 3);
	if (!after.finished) {
		assert.equal(act(doc, A.id, A.dev, 'd', T0 + 1500), null, 'double only on the first two cards');
		assert.equal(liveStake(doc, A.id, A.dev, T0 + 1500), 20);
		doc = act(doc, A.id, A.dev, 's', T0 + 2000);
	}
	assert.ok(doc.round.done, 'standing on the only hand settles the round');
	assert.equal(act(doc, A.id, A.dev, 'h', T0 + 2500), null, 'nothing changes after `done`');
	assert.equal(liveStake(doc, A.id, A.dev, T0 + 2500), 0);
	const v = viewRound(doc.round, T0 + 3000);
	assert.equal(v.phase, 'done');
	assert.equal(v.seats[0].result, handResult(v.seats[0].play.cards, v.dealer));
	assert.equal(v.seats[0].net, handNet(v.seats[0].result, 20, false));

	// double: one card, stake twice, finished
	let dbl = placeBet(seated(A), A, 20, T0, { id: R1.id, seed });
	dbl = act(dbl, A.id, A.dev, 'd', T0 + 500);
	const dv = viewRound(dbl.round, T0 + 600);
	assert.equal(dv.seats[0].play.cards.length, 3);
	assert.equal(dv.seats[0].play.doubled, true);
	assert.equal(dv.phase, 'done');
	assert.equal(Math.abs(dv.seats[0].net) === 40 || dv.seats[0].net === 0, true);
});

test('the dealer: draws to 17, stands on a soft 17, no draw when every hand is bust', () => {
	for (let s = 1; s < 400; s++) {
		const shoe = roundShoe(s);
		const hands = [playHand(shoe, 0, 's', false)];
		const d = dealerFinal(shoe, hands);
		const total = handValue(d).total;
		if (hands[0].status === 'blackjack') continue;
		assert.ok(total >= 17, `seed ${s}: dealer stops on ${total}`);
		// no extra card once 17 was reached (a soft 17 included)
		assert.ok(handValue(d.slice(0, -1)).total < 17 || d.length === 2);
	}
	const bust = seedWhere((shoe) => {
		const p = playHand(shoe, 0, 'hhhhhh', false);
		return plain(0)(shoe) && p.status === 'bust' && handValue(dealerStart(shoe)).total < 17;
	});
	const shoe = roundShoe(bust);
	assert.equal(dealerFinal(shoe, [playHand(shoe, 0, 'hhhhhh', false)]).length, 2);
});

test('a dealer blackjack ends every hand at once (alone: the round is settled by the bet)', () => {
	const seed = seedWhere((shoe) => isBlackjack(dealerStart(shoe)) && !isBlackjack(playHand(shoe, 0, '', false).cards));
	const doc = placeBet(seated(A), A, 30, T0, { id: R1.id, seed });
	assert.ok(doc.round.done);
	const v = viewRound(doc.round, T0);
	assert.equal(v.seats[0].result, 'lose');
	assert.equal(v.seats[0].net, -30);
	// your own blackjack against the dealer's: push
	const both = seedWhere((shoe) => isBlackjack(dealerStart(shoe)) && isBlackjack(playHand(shoe, 0, '', false).cards));
	const p = placeBet(seated(A), A, 30, T0, { id: R1.id, seed: both });
	assert.equal(viewRound(p.round, T0).seats[0].net, 0);
	// a player blackjack alone pays 3:2 at once
	const bj = seedWhere((shoe) => !isBlackjack(dealerStart(shoe)) && isBlackjack(playHand(shoe, 0, '', false).cards));
	const w = placeBet(seated(A), A, 30, T0, { id: R1.id, seed: bj });
	assert.ok(w.round.done);
	assert.equal(viewRound(w.round, T0).seats[0].net, 45);
});

test('an AFK player can’t hold the table: their hand stands after ACT_TIME (+ GRACE for the others)', () => {
	const seed = seedWhere((shoe) => plain(0)(shoe) && plain(1)(shoe));
	let doc = placeBet(seated(A, B), A, 10, T0, { id: R1.id, seed });
	doc = placeBet(doc, B, 10, T0 + 1000, R1); // deals at T0 + 1000
	doc = act(doc, A.id, A.dev, 's', T0 + 2000);
	assert.equal(doc.round.done, undefined, 'Ingman is still thinking');
	assert.equal(viewRound(doc.round, T0 + 5000, GRACE).phase, 'play');
	// Ingman's own page stops him at his deadline; the others wait GRACE longer
	const deadline = T0 + 1000 + ACT_TIME;
	assert.equal(canAct(doc.round, B.id, B.dev, deadline - 1), true);
	assert.equal(canAct(doc.round, B.id, B.dev, deadline), false);
	assert.equal(finish(doc, deadline + GRACE - 1), null);
	const done = finish(doc, deadline + GRACE);
	assert.ok(done.round.done);
	const ing = viewRound(done.round, deadline + GRACE).seats.find((s) => s.id === B.id);
	assert.equal(ing.play.status, 'timeout');
	assert.equal(ing.play.cards.length, 2, 'timed out = stands on what he has');
	// every action restarts the clock
	let slow = placeBet(seated(A), A, 10, T0, { id: R1.id, seed: seedWhere((s) => plain(0)(s) && handValue(playHand(s, 0, '', false).cards).total <= 8) });
	slow = act(slow, A.id, A.dev, 'h', T0 + ACT_TIME - 100);
	if (!slow.round.done) assert.equal(canAct(slow.round, A.id, A.dev, T0 + ACT_TIME + 5000), true);
	// a round nobody finishes is settled by whoever comes by later
	const left = placeBet(seated(A), A, 10, T0, { id: R1.id, seed });
	assert.equal(left.round.done, undefined);
	assert.ok(finish(left, T0 + ACT_TIME + GRACE).round.done);
});

test('the next hand: a short pause after a hand with others, none alone; the old one moves to past', () => {
	const seed = seedWhere((shoe) => plain(0)(shoe) && plain(1)(shoe));
	let doc = placeBet(seated(A, B), A, 10, T0, { id: R1.id, seed });
	doc = placeBet(doc, B, 10, T0 + 1000, R1);
	doc = act(doc, A.id, A.dev, 's', T0 + 2000);
	doc = act(doc, B.id, B.dev, 's', T0 + 3000);
	assert.equal(doc.round.done, T0 + 3000);
	assert.equal(nextOpenAt(doc.round), T0 + 3000 + RESULT_PAUSE);
	assert.equal(betState(doc, A.id, A.dev, T0 + 4000), 'pause');
	assert.equal(placeBet(doc, A, 10, T0 + 4000, { id: 'round0000002', seed: 2 }), null);
	doc = placeBet(doc, A, 10, T0 + 3000 + RESULT_PAUSE, { id: 'round0000002', seed: 2 });
	assert.equal(doc.round.id, 'round0000002');
	assert.equal(doc.past[0].id, R1.id);

	let solo = placeBet(seated(A), A, 10, T0, { id: R1.id, seed });
	solo = act(solo, A.id, A.dev, 's', T0 + 500);
	assert.equal(betState(solo, A.id, A.dev, T0 + 501), 'open');
	assert.ok(placeBet(solo, A, 10, T0 + 501, { id: 'round0000002', seed: 3 }));
});

test('booking: each device books its own settled hands once; past waits for whoever hasn’t', () => {
	const seed = seedWhere((shoe) => plain(0)(shoe) && plain(1)(shoe));
	let doc = placeBet(seated(A, B), A, 10, T0, { id: R1.id, seed });
	doc = placeBet(doc, B, 40, T0 + 1000, R1);
	assert.equal(liveStake(doc, B.id, B.dev, T0 + 1500), 40);
	assert.deepEqual(unbooked(doc, A.id, A.dev), [], 'nothing until it is settled');
	doc = act(doc, A.id, A.dev, 's', T0 + 2000);
	doc = act(doc, B.id, B.dev, 's', T0 + 3000);
	const v = viewRound(doc.round, T0 + 3000);
	const mine = unbooked(doc, B.id, B.dev);
	assert.equal(mine.length, 1);
	assert.equal(mine[0].net, v.seats.find((s) => s.id === B.id).net);
	assert.deepEqual(unbooked(doc, B.id, 'devOther'), [], 'another device of yours never books it');
	// Abscar books his; Ingman closed the page
	doc = markBooked(doc, A.id, [R1.id]);
	assert.equal(unbooked(doc, A.id, A.dev).length, 0);
	// Ingman got up; Abscar plays many more hands alone: Ingman's unbooked round is kept
	doc = leave(doc, B.id, B.dev, T0 + 4000);
	let t = T0 + 10_000;
	for (let i = 0; i < PAST_KEEP + 4; i++) {
		doc = sit(doc, A, t);
		doc = placeBet(doc, A, 5, t, { id: `round10000${String(i).padStart(2, '0')}`, seed: 100 + i });
		if (!doc.round.done) doc = act(doc, A.id, A.dev, 's', t + 100);
		doc = markBooked(doc, A.id, unbooked(doc, A.id, A.dev).map((r) => r.id));
		t += 1000;
	}
	doc = pruneTable(placeBet(sit(doc, A, t), A, 5, t, { id: 'round2000000', seed: 999 }), t);
	assert.ok(doc.past.length >= PAST_KEEP);
	assert.ok(doc.past.some((r) => r.id === R1.id), 'Ingman’s hand waits for him');
	assert.equal(unbooked(doc, B.id, B.dev)[0].net, mine[0].net);
	doc = markBooked(doc, B.id, [R1.id]);
	assert.ok(!pruneTable(doc, t).past.some((r) => r.id === R1.id), 'once booked it goes');
});

test('side bets and the win streak travel with the hand: every page pays the same boosted result', () => {
	// a pair in seat 0's first two cards, so Perfect Pairs wins on the deal
	const seed = seedWhere((shoe) => plain(0)(shoe) && pairKind(playHand(shoe, 0, '', false).cards) !== null);
	let doc = placeBet(seated(A), A, 20, T0, { id: R1.id, seed }, { sides: ['plus3', 'pairs', 'pairs'], streak: 4 });
	const h = doc.round.hands[A.id];
	assert.equal(h.sides, 'pt');
	assert.equal(h.st, 4);
	assert.deepEqual(handSides(h), ['pairs', 'plus3']);
	assert.deepEqual(wire(doc), doc);
	// the stake held back: the bet + a chip per side bet (+ one more bet on a double)
	assert.equal(liveStake(doc, A.id, A.dev, T0 + 1), 60);
	const playing = viewRound(doc.round, T0 + 1).seats[0];
	const shoe = roundShoe(seed);
	const two = playing.play.cards.slice(0, 2);
	const up = dealerStart(shoe)[0];
	assert.deepEqual(
		playing.sides,
		['pairs', 'plus3'].map((bet) => ({ bet, ...sideResult(bet, two, up, 20) }))
	);
	assert.ok(playing.sides[0].net > 0, 'the pair pays on the deal');
	assert.equal(playing.boost, cardBoost(two, up));
	const dbl = act(doc, A.id, A.dev, 'd', T0 + 500);
	assert.equal(liveStake(placeBet(seated(A), A, 20, T0, { id: R1.id, seed }, { sides: ['pairs'] }), A.id, A.dev, T0 + 1), 40);
	// settled: the hand × card boost × streak boost, plus the side bets; the streak goes on
	doc = act(doc, A.id, A.dev, 's', T0 + 1000);
	const v = viewRound(doc.round, T0 + 2000).seats[0];
	const base = handNet(v.result, 20, false);
	const streak = nextStreak(4, v.result);
	const want = boostedNet(base, cardBoost(two, up), streak).net + v.sides.reduce((n, x) => n + x.net, 0);
	assert.equal(v.net, want);
	assert.equal(v.streak, streak);
	const mine = unbooked(doc, A.id, A.dev)[0];
	assert.equal(mine.net, want);
	assert.equal(mine.streak, streak);
	assert.equal(mine.sides.length, 2);
	// the doubled one settled too (double finishes the only hand), with the doubled stake in it
	assert.ok(dbl.round.done);
	const dv = viewRound(dbl.round, T0 + 600).seats[0];
	assert.equal(dv.net, boostedNet(handNet(dv.result, 20, true), dv.boost, nextStreak(4, dv.result)).net + dv.sides.reduce((n, x) => n + x.net, 0));
	// a bad side bet code or streak from somebody's page is dropped, the hand kept
	const raw = toTableWire(doc);
	raw.round.hands[A.id] = { ...raw.round.hands[A.id], sides: 'pp', st: -3 };
	const back = fromTableWire(raw).round.hands[A.id];
	assert.equal(back.sides, undefined);
	assert.equal(back.st, undefined);
});

test('several pages writing at once through the sync service: every act lands, one settle', async () => {
	const stored = new Map();
	const store = { get: async (k) => stored.get(k), put: async (k, v) => void stored.set(k, v) };
	// one request at a time, like the Durable Object
	let queue = Promise.resolve();
	const call = (method, body) => {
		const run = queue.then(async () => {
			const res = await handleDoc(new Request('https://x/v1/code', { method, ...(body ? { body: JSON.stringify(body) } : {}) }), store, T0);
			return { status: res.status, body: await res.json() };
		});
		queue = run.catch(() => {});
		return run;
	};
	// a page: its own copy + rev; write(change) redone on 409 like squad.svelte.ts Channel
	const page = () => ({ rev: 0, doc: emptyTable() });
	async function write(p, change) {
		for (let i = 0; i < 5; i++) {
			const next = change(p.doc);
			if (!next) return 'refused';
			const r = await call('PUT', { baseRev: p.rev, data: toTableWire(next) });
			if (r.status === 200) {
				p.rev = r.body.rev;
				p.doc = next;
				return 'ok';
			}
			if (r.status === 409) {
				p.rev = r.body.rev;
				p.doc = fromTableWire(r.body.data);
			} else return 'error';
		}
		return 'error';
	}
	const seed = seedWhere((shoe) => plain(0)(shoe) && plain(1)(shoe) && plain(2)(shoe));
	const [pa, pb, pc] = [page(), page(), page()];
	await Promise.all([write(pa, (d) => sit(d, A, T0)), write(pb, (d) => sit(d, B, T0)), write(pc, (d) => sit(d, C, T0))]);
	await write(pa, (d) => placeBet(d, A, 10, T0 + 100, { id: R1.id, seed }));
	// B and C join from stale copies at the same moment
	await Promise.all([write(pb, (d) => placeBet(d, B, 20, T0 + 200, R1)), write(pc, (d) => placeBet(d, C, 30, T0 + 200, R1))]);
	const after = fromTableWire((await call('GET')).body.data);
	assert.deepEqual(Object.keys(after.round.hands).sort(), [A.id, B.id, C.id].sort());
	assert.equal(after.round.dealAt, T0 + 200, 'everyone in: dealt');
	// every page reads the dealt table (they poll), then all three stand at the same moment: two
	// writes are refused by the service and redone on the newer copy, the last one settles it
	const pull = async (p) => {
		const r = await call('GET');
		p.rev = r.body.rev;
		p.doc = fromTableWire(r.body.data);
	};
	for (const p of [pa, pb, pc]) await pull(p);
	const outcomes = await Promise.all([pa, pb, pc].map((p, i) => write(p, (d) => act(d, [A, B, C][i].id, [A, B, C][i].dev, 's', T0 + 300 + i))));
	assert.deepEqual(outcomes, ['ok', 'ok', 'ok']);
	const final = fromTableWire((await call('GET')).body.data);
	assert.ok(final.round.done);
	assert.ok(Object.values(final.round.hands).every((h) => h.acts === 's'));
	// every page settles the same nets
	const nets = (doc) => viewRound(doc.round, T0 + 1000).seats.map((s) => [s.id, s.net]);
	for (const p of [pa, pb, pc]) await pull(p);
	assert.deepEqual(nets(pa.doc), nets(final));
	assert.deepEqual(nets(pc.doc), nets(final));
});

test('the odds: standing on 17+ gives back about what solo blackjack does', () => {
	let staked = 0;
	let back = 0;
	for (let s = 1; s <= 20_000; s++) {
		const shoe = roundShoe(s * 7919);
		let acts = '';
		let play = playHand(shoe, 0, acts, isBlackjack(dealerStart(shoe)));
		while (!play.finished && handValue(play.cards).total < 17) play = playHand(shoe, 0, (acts += 'h'), false);
		if (!play.finished) play = playHand(shoe, 0, (acts += 's'), false);
		const dealer = dealerFinal(shoe, [play]);
		const net = handNet(handResult(play.cards, dealer), 10, play.doubled);
		staked += 10;
		back += 10 + net;
	}
	const rtp = back / staked;
	// "dealer's strategy" for the player is known to give back ≈ 94–96 %
	assert.ok(rtp > 0.92 && rtp < 0.98, `RTP ${rtp}`);
});
