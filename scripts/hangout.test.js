// The casino lobby + hideout games (src/lib/hangout.ts) and hideouts (src/lib/hideout.ts). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	acceptDuel,
	ackCollab,
	cancelDuel,
	collabPhase,
	collabPlay,
	collabPot,
	collabResult,
	collabShares,
	duelDraw,
	duelNet,
	duelPhase,
	duelWinner,
	emptyHang,
	fromHangWire,
	hello,
	joinCollab,
	openCollab,
	openDuel,
	present,
	prune,
	toHangWire,
	voteDuel,
	withPing,
	withSay,
	withWave,
	COLLAB_SEATS,
	COLLAB_SPIN,
	COLLAB_WAIT,
	DUEL_SHOW,
	FRESH_MS
} from '../src/lib/hangout.ts';
import { arrange, buyHideout, cleanHideout, hideoutSpent, mergeHideout, showSlots, HIDEOUT_ID, HIDEOUT_PRICE } from '../src/lib/hideout.ts';
import { burgerBank } from '../src/lib/squad-fun.ts';

const A = { id: 'aaaaaaaaaaaaaaaaaaaaaa', name: 'Abscar', op: 'abscar', dev: 'devA1234' };
const B = { id: 'bbbbbbbbbbbbbbbbbbbbbb', name: 'Phillestar', op: 'phillestar', dev: 'devB1234' };
const C = { id: 'cccccccccccccccccccccc', name: 'Ingman', dev: 'devC1234' };
const T = 1_800_000_000_000;
const roundTrip = (d) => fromHangWire(JSON.parse(JSON.stringify(toHangWire(d))));

test('presence: hello, fresh, left, ping / wave / line survive the wire', () => {
	let d = hello(emptyHang(), A.id, A, 'slots', T);
	d = hello(d, B.id, B, `ho:${A.id}`, T + 1000);
	d = withPing(d, A.id, 12345, 'slots', T + 2000);
	d = withWave(d, B.id, A.id, T + 2000);
	d = withSay(d, A.id, 'gg', T + 2000);
	const r = roundTrip(d);
	assert.deepEqual(r, d);
	assert.equal(present(r, T + 3000).length, 2);
	assert.equal(present(r, T + 2000 + FRESH_MS + 1).length, 0);
	assert.equal(r.here[A.id].ping.n, 12345);
	// left = '' → not present
	const gone = hello(r, A.id, A, '', T + 4000);
	assert.deepEqual(present(gone, T + 4000).map(([id]) => id), [B.id]);
	assert.equal(withWave(d, A.id, A.id, T), null, 'no waving at yourself');
	assert.equal(fromHangWire({ app: 'x', hang: 1 }), null);
});

test('collab spin: chip in, same spin on every page, shares add up to the win', () => {
	let d = openCollab(emptyHang(), { id: 'collab0001', seat: A, stake: 1000, seed: 42, now: T });
	assert.ok(d);
	assert.equal(openCollab(d, { id: 'collab0002', seat: A, stake: 100, seed: 1, now: T + 1 }), null, 'one open collab each');
	d = joinCollab(d, 'collab0001', B, 5000, T + 5000);
	d = joinCollab(d, 'collab0001', C, 500, T + 6000);
	assert.equal(joinCollab(d, 'collab0001', C, 500, T + 7000), null, 'no joining twice');
	assert.equal(joinCollab(d, 'collab0001', { ...C, id: 'dddddddddddddddddddddd' }, 500, T + COLLAB_WAIT), null, 'closed when the timer runs out');
	const c = roundTrip(d).collabs[0];
	assert.equal(collabPot(c), 6500);
	assert.equal(collabPhase(c, T + 1), 'open');
	assert.equal(collabPhase(c, T + COLLAB_WAIT), 'spin');
	assert.equal(collabPhase(c, T + COLLAB_WAIT + COLLAB_SPIN), 'done');
	const p1 = collabPlay(c);
	const p2 = collabPlay(JSON.parse(JSON.stringify(c)));
	assert.equal(p1.win, p2.win);
	assert.equal(p1.bet, 6500);
	// shares over many seeds: always the whole win, never negative, by stake
	for (let seed = 0; seed < 300; seed++) {
		const x = { ...c, seed };
		const win = collabPlay(x).win;
		const s = collabShares(x, win);
		assert.equal(Object.values(s).reduce((a, b) => a + b, 0), win);
		assert.ok(Object.values(s).every((n) => n >= 0));
		assert.ok(s[B.id] >= s[C.id]);
	}
	const r = collabResult(c, B.id);
	assert.equal(r.net, r.share - 5000);
	assert.equal(collabResult(c, 'zzzzzzzzzzzzzzzzzzzzzz'), null);
	assert.ok(ackCollab(d, 'collab0001', B.id).collabs[0].ok[B.id]);
	assert.equal(ackCollab(d, 'collab0001', 'zzzzzzzzzzzzzzzzzzzzzz'), null);
	const full = Array.from({ length: COLLAB_SEATS + 2 }, (_, i) => ({ ...C, id: `${'e'.repeat(20)}${String(i).padStart(2, '0')}` }));
	let f = openCollab(emptyHang(), { id: 'collab0003', seat: A, stake: 100, seed: 3, now: T });
	for (const s of full) f = joinCollab(f, 'collab0003', s, 100, T + 10) ?? f;
	assert.equal(f.collabs[0].seats.length, COLLAB_SEATS);
});

test('duels: coin / cards / dice are the same on every page, the loser pays the winner', () => {
	for (const kind of ['flip', 'high', 'dice']) {
		let wins = 0;
		for (let seed = 0; seed < 400; seed++) {
			let d = openDuel(emptyHang(), { id: `duel${String(seed).padStart(6, '0')}`, ho: A.id, kind, stake: 1000, seat: A, seed, now: T });
			assert.equal(duelPhase(d.duels[0], T), 'open');
			assert.equal(acceptDuel(d, d.duels[0].id, A, T), null, 'not against yourself');
			d = acceptDuel(d, d.duels[0].id, B, T + 1000);
			const x = roundTrip(d).duels[0];
			assert.equal(duelPhase(x, T + 1000), 'show');
			assert.equal(duelPhase(x, T + 1000 + DUEL_SHOW), 'done');
			assert.deepEqual(duelDraw(x), duelDraw(d.duels[0]));
			const w = duelWinner(x);
			assert.ok(w === A.id || w === B.id);
			assert.equal(duelNet(x, A.id) + duelNet(x, B.id), 0);
			if (w === A.id) wins++;
			if (kind === 'high') assert.notEqual(duelDraw(x).cards[0].r === duelDraw(x).cards[1].r && duelDraw(x).ties < 20, true);
		}
		assert.ok(wins > 150 && wins < 250, `${kind} is fair (${wins}/400)`);
	}
});

test('duels: a bet is settled when both say the same winner; open ones can be taken back', () => {
	let d = openDuel(emptyHang(), { id: 'bet0000001', ho: A.id, kind: 'bet', stake: 500, seat: A, seed: 1, now: T, text: 'Ogge drops a nuke tonight' });
	assert.equal(openDuel(emptyHang(), { id: 'bet0000002', ho: A.id, kind: 'bet', stake: 500, seat: A, seed: 1, now: T, text: '  ' }), null, 'a bet needs words');
	assert.ok(cancelDuel(d, 'bet0000001', A.id));
	assert.equal(cancelDuel(d, 'bet0000001', B.id), null);
	d = acceptDuel(d, 'bet0000001', B, T + 10);
	assert.equal(cancelDuel(d, 'bet0000001', A.id), null, 'not after it was accepted');
	assert.equal(duelPhase(d.duels[0], T + 99_999), 'vote');
	d = voteDuel(d, 'bet0000001', A.id, A.id);
	d = voteDuel(d, 'bet0000001', B.id, B.id);
	assert.equal(duelWinner(d.duels[0]), null, 'they disagree');
	d = voteDuel(d, 'bet0000001', B.id, A.id);
	assert.equal(duelWinner(roundTrip(d).duels[0]), A.id);
	assert.equal(duelNet(d.duels[0], A.id), 500);
	assert.equal(duelNet(d.duels[0], B.id), -500);
	assert.equal(voteDuel(d, 'bet0000001', A.id, B.id), null, 'settled stays settled');
});

test('prune: gone people, offers nobody took and finished things everyone booked go away', () => {
	let d = hello(emptyHang(), A.id, A, 'slots', T);
	d = openDuel(d, { id: 'duelold001', ho: A.id, kind: 'flip', stake: 1, seat: A, seed: 1, now: T });
	d = openCollab(d, { id: 'collabold1', seat: A, stake: 10, seed: 1, now: T });
	d = ackCollab(d, 'collabold1', A.id);
	const later = prune(d, T + 60 * 60_000);
	assert.equal(Object.keys(later.here).length, 0);
	assert.equal(later.duels.length, 0);
	assert.equal(later.collabs.length, 0);
});

test('hideouts: buy first, rooms and furniture after, layout, display wall, merge, bank', () => {
	assert.equal(buyHideout(undefined, 'couch-old', 1e9, T).result, 'first');
	assert.equal(buyHideout(undefined, HIDEOUT_ID, HIDEOUT_PRICE - 1, T).result, 'broke');
	let h = buyHideout(undefined, HIDEOUT_ID, 1e9, T).state;
	assert.equal(h.th, 'den');
	assert.equal(buyHideout(h, HIDEOUT_ID, 1e9, T).result, 'owned');
	h = buyHideout(h, 'room-neon', 1e9, T + 1).state;
	assert.equal(h.th, 'neon');
	h = buyHideout(h, 'couch-leather', 1e9, T + 2).state;
	assert.equal(h.sp.couch, 'couch-leather');
	assert.equal(arrange(h, { spot: ['couch', 'couch-gold'] }, T + 3), null, 'only owned furniture');
	assert.equal(arrange(h, { th: 'vault' }, T + 3), null, 'only owned rooms');
	h = arrange(h, { th: 'den', sign: 'ABSCAR<script> LOUNGE IS OPEN 24/7' }, T + 3);
	assert.equal(h.sign, 'ABSCARscript LOUNG');
	assert.equal(showSlots(h), 2);
	h = arrange(h, { show: ['gun-g-0', 'gun-g-1', 'gun-g-2', 'not-a-thing'] }, T + 4);
	assert.equal(h.show.length, 2);
	h = buyHideout(h, 'display-case', 1e9, T + 5).state;
	assert.equal(showSlots(h), 6);
	assert.deepEqual(cleanHideout(JSON.parse(JSON.stringify(h))), h);
	assert.equal(hideoutSpent(h), HIDEOUT_PRICE + 150_000 + 250_000 + 1_500_000);
	// two copies: owned on either, the later layout
	const other = buyHideout(buyHideout(undefined, HIDEOUT_ID, 1e9, T).state, 'plant-weed', 1e9, T + 99).state;
	const m = mergeHideout(h, other);
	assert.ok(m.own['plant-weed'] !== undefined && m.own['couch-leather'] !== undefined);
	assert.equal(m.sp.plant, 'plant-weed');
	assert.equal(cleanHideout({ own: { 'couch-old': 1 } }), undefined, 'no hideout, no furniture');

	// the bank: hideout spending goes to the house, pvp from player to player
	const base = { weapons: {}, mastery: {}, recent: {}, online: { n: 0, last: '' } };
	const members = {
		[A.id]: { ...base, name: 'Abscar', op: 'abscar', casino: {} },
		[B.id]: { ...base, name: 'Phillestar', op: 'phillestar', casino: {}, hideout: other, pvp: { devB1234: { net: -500, games: 1, at: T } } },
		[C.id]: { ...base, name: 'Ingman', casino: {}, pvp: { devC1234: { net: 500, games: 1, at: T } } }
	};
	const bank = burgerBank({ members }, members, T);
	assert.equal(bank[B.id].spent, HIDEOUT_PRICE + 42_000);
	assert.equal(bank[A.id].house, HIDEOUT_PRICE + 42_000);
	assert.equal(bank[B.id].pvp + bank[C.id].pvp, 0);
});
