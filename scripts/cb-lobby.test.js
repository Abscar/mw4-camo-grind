// Case Battles against each other: the squad's lobby document (src/lib/cb-lobby.ts). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	ackLobby,
	battleOf,
	createLobby,
	emptyLobbies,
	fillBots,
	fromLobbyWire,
	joinLobby,
	leaveLobby,
	lobbyEnd,
	phaseOf,
	pruneLobbies,
	resultFor,
	toLobbyWire,
	COUNTDOWN,
	LOBBY_MAX,
	ROUND_MS,
	WAIT_MS
} from '../src/lib/cb-lobby.ts';

const T = Date.UTC(2026, 10, 24, 20);
const A = { id: 'AAAAAAAAAAAA', name: 'Abscar', op: 'abscar', dev: 'devA1' };
const B = { id: 'BBBBBBBBBBBB', name: 'Phillestar', op: 'phillestar', dev: 'devB1' };
const C = { id: 'CCCCCCCCCCCC', name: 'Ingman', op: 'ingman', dev: 'devC1' };
const D = { id: 'DDDDDDDDDDDD', name: 'AW', op: 'aw', dev: 'devD1' };
const make = (size = '1v1', mode = 'normal', id = 'lobby01') => createLobby(emptyLobbies(), { id, me: A, cases: ['holk', 'fade', 'gold-rush'], size, mode, seed: 12345, now: T });

test('open a lobby, a friend joins, it starts after the countdown', () => {
	let d = make();
	assert.equal(d.lobbies.length, 1);
	assert.equal(phaseOf(d.lobbies[0], T), 'open');
	d = joinLobby(d, 'lobby01', 1, B, T + 1000);
	const l = d.lobbies[0];
	assert.equal(l.start, T + 1000 + COUNTDOWN);
	assert.equal(phaseOf(l, T + 2000), 'countdown');
	assert.equal(phaseOf(l, l.start + 10), 'live');
	assert.equal(lobbyEnd(l), l.start + 3 * ROUND_MS);
	assert.equal(phaseOf(l, lobbyEnd(l)), 'done');
});

test('refused: a taken seat, joining twice, joining after the start, a second open lobby', () => {
	let d = make('1v1v1');
	assert.equal(joinLobby(d, 'lobby01', 0, B, T), null, 'taken');
	d = joinLobby(d, 'lobby01', 1, B, T);
	assert.equal(joinLobby(d, 'lobby01', 2, B, T), null, 'twice');
	d = joinLobby(d, 'lobby01', 2, C, T);
	assert.ok(d.lobbies[0].start);
	assert.equal(createLobby(make(), { id: 'lobby02', me: A, cases: ['holk'], size: '1v1', mode: 'normal', seed: 1, now: T }), null, 'one open lobby each');
});

test('2v2: the seat picks the team; the winning team splits the pot; same battle on every page', () => {
	let d = make('2v2');
	d = joinLobby(d, 'lobby01', 2, B, T);
	d = joinLobby(d, 'lobby01', 1, C, T);
	d = joinLobby(d, 'lobby01', 3, D, T);
	const l = d.lobbies[0];
	const b = battleOf(l);
	const again = battleOf(fromLobbyWire(JSON.parse(JSON.stringify(toLobbyWire(d)))).lobbies[0]);
	assert.deepEqual(b.pulls, again.pulls, 'the wire copy deals the same');
	assert.equal(b.winners.length % 2, 0);
	const rA = resultFor(l, A.id),
		rC = resultFor(l, C.id);
	assert.equal(rA.payout, rC.payout, 'teammates get the same');
	assert.equal(rA.net, rA.payout - rA.cost);
});

test('leave: a joiner frees the seat, the creator closes the lobby; bots fill the rest', () => {
	let d = make('1v1v1v1');
	d = joinLobby(d, 'lobby01', 1, B, T);
	d = leaveLobby(d, 'lobby01', B.id);
	assert.equal(d.lobbies[0].seats[1], null);
	assert.equal(fillBots(d, 'lobby01', B.id, T), null, 'only the creator');
	d = joinLobby(d, 'lobby01', 1, B, T);
	d = fillBots(d, 'lobby01', A.id, T);
	const l = d.lobbies[0];
	assert.ok(l.start);
	const bots = l.seats.filter((s) => s.bot);
	assert.equal(bots.length, 2);
	assert.ok(!bots.some((s) => s.op === 'abscar' || s.op === 'phillestar'), 'bots are operators nobody sits as');
	assert.equal(leaveLobby(d, 'lobby01', A.id), null, 'too late to leave');
	assert.equal(leaveLobby(make(), 'lobby01', A.id).lobbies.length, 0);
});

test('booking acks and pruning', () => {
	let d = joinLobby(make(), 'lobby01', 1, B, T);
	const l = d.lobbies[0];
	d = ackLobby(d, 'lobby01', A.id);
	assert.equal(ackLobby(d, 'lobby01', A.id), null, 'once');
	const end = lobbyEnd(l);
	assert.equal(pruneLobbies(d, end + 60 * 60_000).lobbies.length, 1, 'B never booked: kept');
	d = ackLobby(d, 'lobby01', B.id);
	assert.equal(pruneLobbies(d, end + 60 * 60_000).lobbies.length, 0, 'everyone booked + shown: gone');
	assert.equal(pruneLobbies(make(), T + WAIT_MS + 1).lobbies.length, 0, 'an open lobby nobody filled');
});

test('wire: junk thrown out, at most LOBBY_MAX new ones', () => {
	assert.equal(fromLobbyWire({ app: 'x' }), null);
	const d = fromLobbyWire({ app: 'mw4-camo-grind', cb: 1, lobbies: [{ id: 'x' }, ...toLobbyWire(make()).lobbies] });
	assert.equal(d.lobbies.length, 1);
	let doc = emptyLobbies();
	for (let i = 0; i < LOBBY_MAX; i++) {
		const me = { ...A, id: `M${String(i).padStart(11, '0')}` };
		doc = createLobby(doc, { id: `lobby${i}xx`, me, cases: ['holk'], size: '1v1', mode: 'normal', seed: i, now: T });
	}
	assert.equal(createLobby(doc, { id: 'lobbyMore', me: B, cases: ['holk'], size: '1v1', mode: 'normal', seed: 1, now: T }), null, 'full of open lobbies');
});
