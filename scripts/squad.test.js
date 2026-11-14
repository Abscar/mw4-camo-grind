// The squad (src/lib/squad-codec.ts): the document format, entries, Online, Mastery statuses,
// ranking, the header's boxes, squad links; plus several members writing to the real sync
// service code (sync-worker/worker.js, in-memory). `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DIVERGENCE_REQUIRED, MASTERY, MASTERY_WZ } from '../src/lib/data/camos.ts';
import { WEAPONS } from '../src/lib/data/weapons.ts';
import {
	MAX_MEMBERS,
	NAME_MAX,
	ONLINE_MS,
	agoParts,
	cleanName,
	emptySquad,
	fromSquadWire,
	headerStatuses,
	isMemberId,
	isOnline,
	makeMemberId,
	masteryStatuses,
	memberByName,
	memberEntry,
	memberStats,
	rankMembers,
	squadCodeFromHash,
	squadCodeFromText,
	toSquadWire,
	withMember,
	withoutMember,
	recentFrom,
	camosThisWeek,
	streakDays,
	weeklyMvps,
	isReady,
	pingsFor,
	withDuel,
	withoutDuel,
	duelResult,
	squadGains,
	MAX_DUELS,
	READY_MS
} from '../src/lib/squad-codec.ts';
import { MAX_MSGS, TEXT_MAX, cleanText, emptyRadio, fromRadioWire, newMsg, radioCode, toRadioWire, toggleFire, unreadCount, withMsg } from '../src/lib/squad-radio.ts';
import { isSyncCode } from '../src/lib/sync-codec.ts';
import { makeSyncCode, toWire } from '../src/lib/sync-codec.ts';
import { defaultProgress } from '../src/lib/progress-codec.ts';
import { memoryEnv } from './sync-dev-server.js';
import { route } from '../sync-worker/worker.js';

const NOW = Date.UTC(2026, 10, 14, 12);
const allAt = (level, n = WEAPONS.length) => Object.fromEntries(WEAPONS.slice(0, n).map((w) => [w.id, level]));
const progressOf = (weapons = {}, mastery = {}, lastTickAt = null) => ({ weapons, mastery, lastTickAt });
const entry = (name, weapons = {}, mastery = {}, extra = {}) => ({
	...memberEntry({ name, op: null }, progressOf(weapons, mastery), NOW),
	...extra
});

test('names are tidied and capped', () => {
	assert.equal(cleanName('  Da   Jeeven \n'), 'Da Jeeven');
	assert.equal(cleanName('x'.repeat(40)).length, NAME_MAX);
	assert.equal(cleanName('\u0007'), '');
	assert.equal(cleanName(42), '');
});

test('member ids', () => {
	const id = makeMemberId();
	assert.ok(isMemberId(id), id);
	assert.notEqual(id, makeMemberId());
	assert.ok(!isMemberId('short'));
});

test('an entry keeps only real weapons, levels 1–3 and real Mastery camos', () => {
	const w = WEAPONS[0].id;
	const e = memberEntry(
		{ name: 'Abscar', op: 'abscar' },
		progressOf({ [w]: 3, [WEAPONS[1].id]: 0, nope: 2 }, { [MASTERY[0].id]: 12, fake: 3 }, '2026-11-14T10:00:00.000Z'),
		NOW
	);
	assert.deepEqual(e.weapons, { [w]: 3 });
	assert.deepEqual(e.mastery, { [MASTERY[0].id]: 12 });
	assert.equal(e.op, 'abscar');
	assert.equal(e.tickAt, Date.parse('2026-11-14T10:00:00.000Z'));
	assert.equal(e.away, undefined);
});

test('the stored document reads back, and junk is dropped', () => {
	const id = makeMemberId();
	const doc = withMember(emptySquad(), id, entry('Phillestar', { [WEAPONS[2].id]: 2 }));
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire(doc))));
	assert.deepEqual(back, doc);

	const wire = toSquadWire(doc);
	wire.members['bad id!'] = entry('X');
	wire.members[makeMemberId()] = { name: '', seen: NOW, weapons: {}, mastery: {} };
	wire.members[makeMemberId()] = { name: 'Y', seen: 'yesterday', weapons: {}, mastery: {} };
	wire.members[makeMemberId()] = { ...entry('Z'), op: 'ghost', weapons: { [WEAPONS[0].id]: 9 } };
	const cleaned = fromSquadWire(wire);
	assert.equal(Object.keys(cleaned.members).length, 2);
	const z = Object.values(cleaned.members).find((m) => m.name === 'Z');
	assert.equal(z.op, undefined);
	assert.equal(z.weapons[WEAPONS[0].id], 3);
});

test('fields from a newer page survive this page reading and writing the document', () => {
	const id = makeMemberId();
	const other = makeMemberId();
	const wire = toSquadWire(withMember(withMember(emptySquad(), id, entry('Abscar')), other, entry('Phillestar')));
	wire.members[other].stamps = { m4: [1, 2, 3] };
	wire.radio = [{ from: other, text: 'GG' }];
	const doc = fromSquadWire(JSON.parse(JSON.stringify(wire)));
	// this page updates its own entry and writes the whole document back
	const back = toSquadWire(withMember(doc, id, entry('Abscar', { [WEAPONS[0].id]: 1 })));
	assert.deepEqual(back.members[other].stamps, { m4: [1, 2, 3] });
	assert.deepEqual(back.radio, [{ from: other, text: 'GG' }]);
	assert.equal(back.app, 'mw4-camo-grind');
	assert.equal(back.members[id].weapons[WEAPONS[0].id], 1);
	assert.deepEqual(toSquadWire(withoutMember(doc, id)).radio, [{ from: other, text: 'GG' }]);
});

test('a sync document is not a squad (never written over by mistake)', () => {
	const syncDoc = toWire({ progress: defaultProgress(), notes: {}, focus: [], lastTickAt: null });
	assert.equal(fromSquadWire(syncDoc), null);
	assert.equal(fromSquadWire(null), null);
	assert.equal(fromSquadWire({ app: 'mw4-camo-grind', squad: 2, members: {} }), null);
});

test('adding, replacing and removing members; a full squad takes nobody new', () => {
	let doc = emptySquad();
	const ids = [];
	for (let i = 0; i < MAX_MEMBERS; i++) {
		ids.push(makeMemberId());
		doc = withMember(doc, ids[i], entry(`M${i}`));
	}
	assert.equal(withMember(doc, makeMemberId(), entry('One too many')), null);
	const replaced = withMember(doc, ids[0], entry('M0 renamed'));
	assert.equal(replaced.members[ids[0]].name, 'M0 renamed');
	const fewer = withoutMember(replaced, ids[1]);
	assert.equal(Object.keys(fewer.members).length, MAX_MEMBERS - 1);
	assert.ok(withMember(fewer, makeMemberId(), entry('Now there is room')));
});

test('the same name on another device is the same member', () => {
	const id = makeMemberId();
	const doc = withMember(emptySquad(), id, entry('Drängen Lars Åke'));
	assert.equal(memberByName(doc, '  drängen   lars åke '), id);
	assert.equal(memberByName(doc, 'Someone else'), null);
});

test('online: said hello in the last 5 minutes and not away', () => {
	assert.ok(isOnline(entry('A'), NOW + ONLINE_MS - 1000));
	assert.ok(!isOnline(entry('A'), NOW + ONLINE_MS + 1000));
	assert.ok(!isOnline(entry('A', {}, {}, { away: true }), NOW));
	// a clock far in the future isn't "online forever"
	assert.ok(!isOnline(entry('A', {}, {}, { seen: NOW + 60 * 60_000 }), NOW));
});

test('Mastery statuses follow the tracker: locked until Divergence, then in order per mode', () => {
	assert.deepEqual(masteryStatuses({}, {}).mp, ['locked', 'locked', 'locked']);
	const maxed = allAt(3);
	assert.deepEqual(masteryStatuses(maxed, {}).mp, ['active', 'locked', 'locked']);
	assert.deepEqual(masteryStatuses(maxed, {}).wz, ['active', 'locked', 'locked']);
	const done = { [MASTERY[0].id]: MASTERY[0].target, [MASTERY_WZ[0].id]: MASTERY_WZ[0].target, [MASTERY_WZ[1].id]: 1 };
	assert.deepEqual(masteryStatuses(maxed, done).mp, ['complete', 'active', 'locked']);
	assert.deepEqual(masteryStatuses(maxed, done).wz, ['complete', 'active', 'locked']);
	// a count without Divergence doesn't open anything
	assert.deepEqual(masteryStatuses(allAt(3, DIVERGENCE_REQUIRED - 1), done).mp, ['locked', 'locked', 'locked']);
});

test('stats: ladder counts, Harmonic Breaks left to Divergence', () => {
	const st = memberStats({ weapons: { ...allAt(1), [WEAPONS[0].id]: 3, [WEAPONS[1].id]: 2 }, mastery: {} });
	assert.deepEqual(st.ladder, [WEAPONS.length, 2, 1]);
	assert.equal(st.divergenceLeft, DIVERGENCE_REQUIRED - 1);
	assert.equal(memberStats({ weapons: allAt(3), mastery: {} }).divergenceLeft, 0);
});

test('ranking: Mastery camos done, then Harmonic Breaks, Platinum, Gold, name', () => {
	const make = (name, weapons, mastery = {}) => ({ member: entry(name, weapons, mastery), stats: memberStats({ weapons, mastery }) });
	const list = [
		make('Gold guy', allAt(1)),
		make('Bea', { [WEAPONS[0].id]: 3 }),
		make('Ann', { [WEAPONS[0].id]: 3 }),
		make('Master', allAt(3), { [MASTERY[0].id]: MASTERY[0].target })
	];
	assert.deepEqual(
		rankMembers(list).map((x) => x.member.name),
		['Master', 'Ann', 'Bea', 'Gold guy']
	);
});

test('header boxes: the higher of what was typed in and what the ticks say', () => {
	assert.deepEqual(headerStatuses(['done', 'done', 'active'], ['active', 'locked', 'locked']), ['done', 'done', 'active']);
	assert.deepEqual(headerStatuses(['todo', 'todo', 'todo'], ['complete', 'active', 'locked']), ['done', 'active', 'todo']);
	assert.deepEqual(headerStatuses(['done', 'active', 'todo'], null), ['done', 'active', 'todo']);
});

test('squad links', () => {
	const code = makeSyncCode();
	assert.equal(squadCodeFromHash(`#squad=${code}`), code);
	assert.equal(squadCodeFromHash(`#sync=${code}`), null);
	assert.equal(squadCodeFromText(`https://abscar.github.io/mw4-camo-grind/#squad=${code}`), code);
	assert.equal(squadCodeFromText(code), code);
	assert.equal(squadCodeFromText(`https://x/#sync=${code}`), null);
	assert.equal(squadCodeFromText('hello'), null);
});

test('"x ago"', () => {
	assert.deepEqual(agoParts(NOW - 20_000, NOW), { unit: 'now' });
	assert.deepEqual(agoParts(NOW - 5 * 60_000, NOW), { unit: 'min', n: 5 });
	assert.deepEqual(agoParts(NOW - 3 * 3600_000, NOW), { unit: 'h', n: 3 });
	assert.deepEqual(agoParts(NOW - 50 * 3600_000, NOW), { unit: 'd', n: 2 });
});

test('the sync service keeps several members apart: a refused write is redone on the newer copy', async () => {
	const env = memoryEnv();
	const code = makeSyncCode();
	const call = async (method, body) => {
		const res = await route(new Request(`https://sync.test/v1/${code}`, { method, body: body && JSON.stringify(body) }), env);
		return { status: res.status, body: await res.json() };
	};
	// two members' pages, each with what it last read
	const a = { id: makeMemberId(), rev: 0, doc: emptySquad() };
	const b = { id: makeMemberId(), rev: 0, doc: emptySquad() };
	async function publish(page, member) {
		for (let i = 0; i < 5; i++) {
			const next = withMember(page.doc, page.id, member);
			const res = await call('PUT', { baseRev: page.rev, data: toSquadWire(next) });
			if (res.status === 200) {
				page.rev = res.body.rev;
				page.doc = next;
				return;
			}
			assert.equal(res.status, 409);
			page.rev = res.body.rev;
			page.doc = fromSquadWire(res.body.data);
		}
		assert.fail('never got through');
	}
	await publish(a, entry('Abscar', { [WEAPONS[0].id]: 1 }));
	await publish(b, entry('Phillestar', { [WEAPONS[1].id]: 3 })); // b's copy was stale: 409, then redone
	await publish(a, entry('Abscar', { [WEAPONS[0].id]: 2 })); // and a's now
	const stored = fromSquadWire((await call('GET')).body.data);
	assert.equal(stored.members[a.id].weapons[WEAPONS[0].id], 2);
	assert.equal(stored.members[b.id].weapons[WEAPONS[1].id], 3);
	assert.equal(Object.keys(stored.members).length, 2);
});

// ----- step 2 -----

const DAY = 86_400_000;
const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

test('recent tick times: only the last weeks, per weapon and level', () => {
	const now = at(2026, 11, 14);
	const w = WEAPONS.map((x) => x.id);
	const r = recentFrom({ [w[0]]: [now - DAY, now - 2 * DAY, 0], [w[1]]: [now - 90 * DAY], bad: 'x' }, now);
	assert.deepEqual(r, { [w[0]]: [now - DAY, now - 2 * DAY] });
	// kept through the document for levels the weapon has
	const e = { ...entry('A', { [w[0]]: 1 }), recent: r };
	const back = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire(withMember(emptySquad(), makeMemberId(), e)))));
	assert.deepEqual(Object.values(back.members)[0].recent, { [w[0]]: [now - DAY] });
});

test('camos this week (from Monday 00:00), streaks and the weekly MVP', () => {
	const now = at(2026, 11, 14); // a Saturday
	const w = WEAPONS.map((x) => x.id);
	const a = { recent: { [w[0]]: [at(2026, 11, 14, 9), at(2026, 11, 13), at(2026, 11, 12)], [w[1]]: [at(2026, 11, 8)] } };
	const b = { recent: { [w[2]]: [at(2026, 11, 10), at(2026, 11, 11)] } };
	assert.equal(camosThisWeek(a, now), 3); // Sunday the 8th is last week
	assert.equal(camosThisWeek(b, now), 2);
	assert.equal(streakDays(a, now), 3);
	assert.equal(streakDays(b, now), 0); // last tick on Wednesday
	assert.equal(streakDays({ recent: { [w[0]]: [at(2026, 11, 13), at(2026, 11, 12)] } }, now), 2); // today not yet
	assert.deepEqual(weeklyMvps({ a, b }, now), ['a']);
	assert.deepEqual(weeklyMvps({ a, c: a }, now).sort(), ['a', 'c']);
	assert.deepEqual(weeklyMvps({ x: {}, y: {} }, now), []);
});

test('ready up shows while online and fresh; pings reach only their target', () => {
	const a = entry('A', {}, {}, { readyAt: NOW - 60_000 });
	assert.ok(isReady(a, NOW));
	assert.ok(!isReady({ ...a, readyAt: NOW - READY_MS - 1000 }, NOW));
	assert.ok(!isReady({ ...a, away: true }, NOW));
	const me = makeMemberId();
	const other = makeMemberId();
	const doc = withMember(withMember(emptySquad(), other, entry('B', {}, {}, { ping: { to: me, at: NOW - 1000 } })), me, entry('Me'));
	assert.deepEqual(pingsFor(doc, me, NOW), [{ from: other, at: NOW - 1000 }]);
	assert.deepEqual(pingsFor(doc, other, NOW), []);
	assert.deepEqual(pingsFor(doc, me, NOW + 60 * 60_000), []);
});

test('duels: added, kept through the document, won by who got the camo (first by tick time)', () => {
	const a = makeMemberId();
	const b = makeMemberId();
	const w = WEAPONS[0].id;
	const duel = { id: makeMemberId(), a, b, weapon: w, goal: 2, stake: 'Buys the burgers', at: NOW };
	let doc = withDuel(withMember(withMember(emptySquad(), a, entry('A')), b, entry('B')), duel);
	doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire(doc))));
	assert.deepEqual(doc.duels, [duel]);
	const members = (wa, wb, ra, rb) => ({ [a]: { weapons: { [w]: wa }, recent: ra }, [b]: { weapons: { [w]: wb }, recent: rb } });
	assert.equal(duelResult(duel, members(1, 1)), null);
	assert.deepEqual(duelResult(duel, members(2, 1)), { winner: a, loser: b, draw: false });
	assert.deepEqual(duelResult(duel, members(3, 2, { [w]: [1, NOW + 500] }, { [w]: [1, NOW + 100] })), { winner: b, loser: a, draw: false });
	assert.equal(duelResult(duel, members(2, 2)).draw, true);
	let full = doc;
	for (let i = 1; i < MAX_DUELS; i++) full = withDuel(full, { ...duel, id: makeMemberId() });
	assert.equal(withDuel(full, { ...duel, id: makeMemberId() }), null);
	assert.equal(withoutDuel(doc, duel.id).duels.length, 0);
	// a duel against yourself or on a made-up weapon is dropped
	const wire = toSquadWire(doc);
	wire.duels.push({ ...duel, id: makeMemberId(), b: a }, { ...duel, id: makeMemberId(), weapon: 'nope' });
	assert.equal(fromSquadWire(wire).duels.length, 1);
});

test('squad kill feed: only the others\' new camos, nothing for someone seen the first time', () => {
	const me = makeMemberId();
	const p = makeMemberId();
	const w = WEAPONS.map((x) => x.id);
	const doc1 = withMember(withMember(emptySquad(), me, entry('Me')), p, entry('Phille', { [w[0]]: 1 }));
	const first = squadGains(null, doc1, me);
	assert.deepEqual(first.gains, []);
	const doc2 = withMember(doc1, p, entry('Phille', { [w[0]]: 3, [w[1]]: 1 }));
	const second = squadGains(first.next, doc2, me);
	assert.deepEqual(second.gains.map((g) => [g.weaponId, g.level]), [[w[0], 3], [w[1], 1]]);
	assert.deepEqual(second.nukes, []);
	// my own ticks never come back as news
	const doc3 = withMember(doc2, me, entry('Me', { [w[5]]: 3 }));
	assert.deepEqual(squadGains(second.next, doc3, me).gains, []);
	// Divergence = a nuke
	const doc4 = withMember(doc3, p, entry('Phille', allAt(3)));
	assert.deepEqual(squadGains(squadGains(second.next, doc3, me).next, doc4, me).nukes, ['Phille']);
});

test('the radio: its own code, text only, newest 100, 🔥 on and off, unread count', () => {
	const code = makeSyncCode();
	assert.ok(isSyncCode(radioCode(code)));
	assert.equal(cleanText('  hej\n\nhej  '), 'hej hej');
	assert.equal(cleanText('x'.repeat(500)).length, TEXT_MAX);
	const me = makeMemberId();
	const other = makeMemberId();
	let doc = emptyRadio();
	for (let i = 0; i < MAX_MSGS + 5; i++) doc = withMsg(doc, newMsg(i % 2 ? me : other, 'N', `m${i}`, NOW + i));
	assert.equal(doc.msgs.length, MAX_MSGS);
	assert.equal(doc.msgs[0].text, 'm5');
	const id = doc.msgs.at(-1).id;
	doc = toggleFire(doc, id, me);
	assert.deepEqual(doc.msgs.at(-1).fire, [me]);
	doc = toggleFire(doc, id, me);
	assert.equal(doc.msgs.at(-1).fire, undefined);
	assert.equal(newMsg(me, 'N', '   ', NOW), null);
	const back = fromRadioWire(JSON.parse(JSON.stringify(toRadioWire(doc))));
	assert.equal(back.msgs.length, MAX_MSGS);
	assert.equal(unreadCount(back, me, NOW + MAX_MSGS), 2); // the others' last two (NOW+100, NOW+102 … from other)
	assert.equal(fromRadioWire(toSquadWire(emptySquad())), null);
});
