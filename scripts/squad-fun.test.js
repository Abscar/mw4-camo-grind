// The squad's step 3 (src/lib/squad-fun.ts + the new document fields in squad-codec.ts): played
// time, usual play slot, roulette, burger bank, IOUs, Squad TV events, Wrapped. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIVERGENCE_REQUIRED, MAX_LEVEL } from '../src/lib/data/camos.ts';
import { WEAPONS, WEAPON_BY_ID } from '../src/lib/data/weapons.ts';
import { fromSquadWire, toSquadWire } from '../src/lib/squad-codec.ts';
import {
	BURGERS,
	PLAY_GAP_MS,
	addPlayed,
	betOutcome,
	burgerBank,
	burgersEarned,
	dayKey,
	debts,
	mergePlayed,
	newsKey,
	playedOn,
	raceWinner,
	roulettePool,
	settleDuel,
	spin,
	spinPhase,
	squadEvents,
	usualSlot,
	withBet,
	withPaid,
	wrapped,
	wrappedWeek,
	SPIN_MS
} from '../src/lib/squad-fun.ts';
import { startOfWeek } from '../src/lib/stats.ts';

const A = 'aaaaaaaaaaaa';
const B = 'bbbbbbbbbbbb';
const C = 'cccccccccccc';
const D1 = 'duel00000001';
const NOW = new Date(2026, 10, 14, 20, 0).getTime(); // a Saturday evening
const H = 3_600_000;
const member = (name, weapons = {}, extra = {}) => ({ name, seen: NOW, weapons, mastery: {}, ...extra });
const wire = (doc) => ({ app: 'mw4-camo-grind', squad: 1, members: {}, ...doc });

test('played time: only gaps of a normal page check count, per day, merged by the bigger number', () => {
	let p = addPlayed(undefined, NOW - 60_000, NOW);
	assert.equal(playedOn({ played: p }, dayKey(NOW)), 1);
	p = addPlayed(p, NOW, NOW + 2 * 60_000);
	assert.equal(playedOn({ played: p }, dayKey(NOW)), 3);
	// a sleeping computer / closed page adds nothing
	p = addPlayed(p, NOW, NOW + PLAY_GAP_MS + 1);
	assert.equal(playedOn({ played: p }, dayKey(NOW)), 3);
	assert.deepEqual(mergePlayed({ a: 5, b: 1 }, { b: 4, c: 2 }), { a: 5, b: 4, c: 2 });
	// stored and read back, junk dropped
	const doc = fromSquadWire(wire({ members: { [A]: { ...member('A'), played: { '2026-11-14': 75.4, nope: 3, '2026-11-13': -1 } } } }));
	assert.deepEqual(doc.members[A].played, { '2026-11-14': 75 });
});

test('the new document fields survive a write; junk is dropped', () => {
	const raw = wire({
		members: { [A]: member('A'), [B]: member('B') },
		roulette: { id: 'rrrrrrrrrrrr', by: A, at: NOW, mode: 'class', cls: 'ars', picks: { [A]: WEAPONS[0].id, [B]: 'nope' } },
		bets: [
			{ id: 'bet000000001', by: A, kind: 'race', ref: 'x', pick: B, amount: 5, at: NOW },
			{ id: 'bet000000002', by: A, kind: 'duel', ref: 'bad', pick: B, amount: 5, at: NOW },
			{ id: 'bet000000003', by: A, kind: 'race', ref: '', pick: B, amount: 0, at: NOW }
		],
		settled: [{ id: D1, w: A, l: B }, { id: D1, w: A, l: A }],
		paid: [D1, D1, 'x']
	});
	const doc = fromSquadWire(raw);
	assert.deepEqual(doc.roulette.picks, { [A]: WEAPONS[0].id });
	assert.equal(doc.bets.length, 1);
	assert.equal(doc.bets[0].ref, '');
	assert.equal(doc.settled.length, 1);
	assert.deepEqual(doc.paid, [D1]);
	assert.deepEqual(fromSquadWire(toSquadWire(doc)), doc);
});

test('usual slot needs enough ticks on more than one date', () => {
	const thu = (week, min) => new Date(2026, 10, 5 + week * 7, 21, min).getTime(); // Thursdays 21:xx
	const recent = {};
	WEAPONS.slice(0, 9).forEach((w, i) => (recent[w.id] = [thu(i % 2, i)]));
	assert.deepEqual(usualSlot([{ recent }]), { day: 3, from: 20, ticks: 9 });
	assert.equal(usualSlot([{ recent: { [WEAPONS[0].id]: [thu(0, 1)] } }]), null);
});

test('roulette: same seed same guns, never one maxed by anyone, class mode stays in one class', () => {
	const maxed = Object.fromEntries(WEAPONS.slice(0, 30).map((w) => [w.id, MAX_LEVEL]));
	const members = { [A]: { weapons: maxed }, [B]: { weapons: {} }, [C]: { weapons: {} } };
	const pool = roulettePool(Object.values(members));
	assert.ok(pool.every((id) => !maxed[id]));
	const one = spin(members, [A, B, C], 'each', 42);
	assert.deepEqual(spin(members, [A, B, C], 'each', 42), one);
	assert.ok(Object.values(one.picks).every((id) => pool.includes(id)));
	assert.equal(new Set(Object.values(one.picks)).size, Math.min(3, pool.length));
	const cls = spin(members, [A, B, C], 'class', 7);
	assert.ok(cls.cls);
	assert.ok(Object.values(cls.picks).every((id) => WEAPON_BY_ID.get(id).classId === cls.cls));
	const all = Object.fromEntries(WEAPONS.map((w) => [w.id, MAX_LEVEL]));
	assert.equal(spin({ [A]: { weapons: all } }, [A], 'each', 1), null);
	assert.equal(spinPhase(NOW, NOW - 1), 'wait');
	assert.equal(spinPhase(NOW, NOW + SPIN_MS / 2), 0.5);
	assert.equal(spinPhase(NOW, NOW + SPIN_MS), 'done');
});

test('burgers: earned from camos, bets won and lost, open bets held, no betting more than you have', () => {
	const w = WEAPONS[0].id;
	assert.equal(burgersEarned({ weapons: {}, mastery: {} }), BURGERS.start);
	assert.equal(burgersEarned({ weapons: { [w]: 3 }, mastery: {} }), BURGERS.start + 6);
	const duel = { id: D1, a: A, b: B, weapon: w, goal: 1, stake: 'x', at: NOW };
	const members = { [A]: member('A'), [B]: member('B'), [C]: member('C') };
	let doc = { members, duels: [duel] };
	const bet = { id: 'bet000000001', by: C, kind: 'duel', ref: D1, pick: A, amount: 4, at: NOW };
	doc = withBet(doc, bet, members);
	assert.ok(doc);
	assert.equal(burgerBank(doc, members)[C].balance, BURGERS.start - 4);
	assert.equal(withBet(doc, { ...bet, id: 'bet000000002' }, members), null, 'same bet twice');
	assert.equal(withBet(doc, { ...bet, id: 'bet000000003', by: B, amount: 999 }, members), null, 'too many burgers');
	// A wins
	const won = { ...members, [A]: member('A', { [w]: 1 }) };
	assert.equal(betOutcome(bet, doc, won), 'won');
	assert.equal(burgerBank(doc, won)[C].balance, BURGERS.start + 4);
	assert.equal(withBet(doc, { ...bet, id: 'bet000000004', by: B }, won), null, 'already decided');
	// the duel is taken off the list: the result stays
	const settled = settleDuel(doc, D1, won);
	assert.equal(settled.duels.length, 0);
	assert.equal(betOutcome(bet, settled, won), 'won');
	// a duel removed before it was decided: bets come back
	const gone = settleDuel(doc, D1, members);
	assert.equal(betOutcome(bet, gone, members), 'void');
	assert.equal(burgerBank(gone, members)[C].balance, BURGERS.start);
});

test('IOUs: one real burger per lost duel, netted, gone when paid', () => {
	const w = WEAPONS[0].id;
	const members = { [A]: member('A', { [w]: 1 }), [B]: member('B') };
	const doc = {
		members,
		duels: [{ id: D1, a: A, b: B, weapon: w, goal: 1, stake: '', at: NOW }],
		settled: [{ id: 'duel00000002', w: A, l: B }, { id: 'duel00000003', w: B, l: A }, { id: 'duel00000004', w: A, l: B }]
	};
	const list = debts(doc, members);
	assert.equal(list.length, 1);
	assert.deepEqual([list[0].from, list[0].to, list[0].n], [B, A, 2]);
	assert.deepEqual(debts(withPaid(doc, list[0].ids), members), []);
});

test('race to Divergence: winner by the 33rd Harmonic Break time, draw when it can’t be told', () => {
	const hb = (offset) => Object.fromEntries(WEAPONS.slice(0, DIVERGENCE_REQUIRED).map((w, i) => [w.id, 3]));
	const times = (base) => Object.fromEntries(WEAPONS.slice(0, DIVERGENCE_REQUIRED).map((w, i) => [w.id, [1, 2, base + i]]));
	assert.equal(raceWinner({ [A]: member('A'), [B]: member('B') }), null);
	assert.equal(raceWinner({ [A]: member('A', hb()), [B]: member('B') }), A);
	assert.equal(raceWinner({ [A]: member('A', hb(), { recent: times(NOW) }), [B]: member('B', hb(), { recent: times(NOW - H) }) }), B);
	assert.equal(raceWinner({ [A]: member('A', hb()), [B]: member('B', hb()) }), 'draw');
});

test('Squad TV: maxed weapons are news, the rest is teasing; the news key follows the newest', () => {
	const w = WEAPONS[0].id;
	const entries = [
		{ id: A, member: member('Da Jeeven', { [w]: 3 }, { recent: { [w]: [NOW - 3 * H, NOW - 2 * H, NOW - H] } }) },
		{ id: B, member: member('Abscar', {}, { seen: NOW - 5 * H, away: true }) },
		{ id: C, member: member('Lars', {}, { seen: NOW - 3 * 86_400_000 }) }
	];
	const events = squadEvents(entries, null, NOW);
	assert.equal(events[0].kind, 'maxed');
	assert.equal(events[0].who, 'Da Jeeven');
	assert.ok(events.some((e) => e.kind === 'asleep' && e.who === 'Abscar'));
	assert.ok(events.some((e) => e.kind === 'missing' && e.who === 'Lars' && e.days === 3));
	assert.match(newsKey(events), /^maxed:Da Jeeven:/);
	assert.equal(newsKey(events.filter((e) => e.kind !== 'maxed')), null);
});

test('Wrapped: Sunday = this week, other days = last week; counts, night owl, top class, slacker', () => {
	const sun = new Date(2026, 10, 15, 12).getTime();
	assert.equal(wrappedWeek(sun).from, startOfWeek(sun));
	const sat = NOW;
	assert.equal(wrappedWeek(sat).from, startOfWeek(startOfWeek(sat) - 12 * H));
	const { from, to } = wrappedWeek(sun);
	const w1 = WEAPONS[0].id;
	const w2 = WEAPONS[1].id;
	const night = new Date(2026, 10, 12, 3).getTime();
	const members = {
		[A]: { name: 'A', recent: { [w1]: [night, night + 60_000, night + 120_000], [w2]: [from - 1000] }, played: { [dayKey(night)]: 90 } },
		[B]: { name: 'B', recent: { [w2]: [from + H] } }
	};
	const r = wrapped(members, from, to);
	assert.equal(r.total, 4);
	assert.deepEqual(r.mvps, [A]);
	assert.equal(r.nightOwl, A);
	assert.equal(r.slacker, B);
	assert.equal(r.mostHours, A);
	assert.deepEqual(r.members[0].maxed, [w1]);
	assert.equal(r.topClass.cls, WEAPON_BY_ID.get(w1).classId);
});
