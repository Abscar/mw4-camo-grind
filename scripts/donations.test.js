// BurgiGives, BurgiCasino's donations tab (src/lib/donations.ts): giving, two devices, the squad's
// totals and "who gave to what", goals, typed amounts, and how donations count in the burger bank.
// `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	cleanDonations,
	donationTotal,
	donationsByOrg,
	giveTo,
	goalOf,
	goalPassed,
	mergeDonations,
	parseAmount,
	squadGiving,
	DON_LOG,
	ORG_IDS,
	ORGS,
	cleanKarma,
	heartsGiftedTo,
	karmaBalance,
	karmaGiven,
	loveFor,
	loveLog,
	lovedTotal,
	withLove,
	KARMA_LOG,
	LOVE_LINES
} from '../src/lib/donations.ts';
import { fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank, BURGERS } from '../src/lib/squad-fun.ts';
import { t } from '../src/lib/i18n/en.ts';

const T = Date.UTC(2026, 10, 20, 18);
const A = 'aaaaaaaa1111';
const B = 'bbbbbbbb2222';
const give = (book, dev, id, org, n, balance = 1e12, at = T) => {
	const r = giveTo(book, dev, id, org, n, balance, at);
	assert.equal(r.result, 'ok', `${org} ${n}`);
	return r.book;
};

test('donations: eleven causes (the first five kept their ids and order), each with its words and colours', () => {
	assert.equal(ORG_IDS.length, 11);
	assert.deepEqual(ORG_IDS.slice(0, 5), ['holk', 'barn', 'campaign', 'hardcore', 'wrists'], 'never reorder or reuse an id');
	assert.deepEqual(
		ORGS.map((o) => o.id),
		[...ORG_IDS]
	);
	for (const o of ORG_IDS) {
		const s = t.donate.orgs[o];
		assert.ok(s.name && s.short && s.mission && s.paysFor && s.thanks, o);
	}
	assert.equal(new Set(ORG_IDS.map((o) => t.donate.orgs[o].name)).size, ORG_IDS.length, 'no two causes share a name');
	assert.equal(new Set(ORGS.map((o) => o.accent)).size, ORGS.length, 'no two causes share a colour');
	assert.equal(t.donate.karma.lines.length, LOVE_LINES, 'one text per love line');
});

test('donations: give, balance check, bad gifts refused', () => {
	let book = give(undefined, 'devA', 'g1', 'holk', 500);
	book = give(book, 'devA', 'g2', 'holk', 250, 1e12, T + 1);
	book = give(book, 'devA', 'g3', 'wrists', 100, 1e12, T + 2);
	const by = donationsByOrg(book);
	assert.deepEqual(Object.keys(by), [...ORG_IDS]);
	assert.deepEqual({ holk: by.holk, barn: by.barn, wrists: by.wrists, rehab: by.rehab }, { holk: 750, barn: 0, wrists: 100, rehab: 0 });
	assert.equal(donationTotal(book), 850);
	assert.equal(Object.keys(book.log).length, 3);
	assert.deepEqual(giveTo(book, 'devA', 'g4', 'barn', 101, 100, T), { result: 'broke' });
	assert.equal(giveTo(book, 'devA', 'g4', 'barn', 100, 100, T).result, 'ok', 'all of it is fine');
	assert.deepEqual(giveTo(book, 'devA', 'g4', 'redcross', 10, 1e9, T), { result: 'bad' }, 'only our causes');
	assert.deepEqual(giveTo(book, 'devA', 'g4', 'barn', 0, 1e9, T), { result: 'bad' });
	assert.deepEqual(giveTo(book, 'devA', 'g4', 'barn', 2.5, 1e9, T), { result: 'bad' });
	assert.equal(giveTo(book, 'devA', 'g4', 'barn', 5e12, 1e13, T).result, 'ok', 'no cap on a gift (was 100,000,000)');
	assert.deepEqual(giveTo(book, 'devA', 'g4', 'barn', 5e12, 1e12, T), { result: 'broke' }, 'only your burgers limit it');
	assert.deepEqual(giveTo(book, 'devA', 'g4', 'barn', 1e20, 1e21, T), { result: 'bad' }, 'past what JavaScript counts exactly');
	const huge = give(give(undefined, 'devA', 'h1', 'barn', 9e12, 1e15), 'devA', 'h2', 'holk', 8e12, 1e15, T + 1);
	const back = cleanDonations(JSON.parse(JSON.stringify(huge)));
	assert.equal(donationTotal(back), 17e12, 'a device past 10 billion is kept when read back (it used to be dropped)');
	assert.equal(back.log.h1.n, 9e12, 'and so is a gift past 100 million in the log');
	assert.deepEqual(giveTo(book, 'no!', 'g4', 'barn', 10, 1e9, T), { result: 'bad' });
});

test('donations: the log keeps the newest, the totals keep everything', () => {
	let book;
	for (let i = 0; i < DON_LOG + 15; i++) book = give(book, 'devA', `gift${i}`, ORG_IDS[i % 5], 10, 1e12, T + i);
	assert.equal(Object.keys(book.log).length, DON_LOG);
	assert.ok(book.log[`gift${DON_LOG + 14}`] && !book.log.gift0, 'oldest gifts drop off the list');
	assert.equal(donationTotal(book), (DON_LOG + 15) * 10, 'but every burger still counts');
});

test('donations: two devices merge without losing or doubling anything', () => {
	const base = give(undefined, 'devA', 'g1', 'holk', 500);
	// both devices start from the same copy, then give on their own
	const pc = give(base, 'devA', 'g2', 'holk', 100, 1e12, T + 10);
	const phone = give(base, 'devB', 'g3', 'holk', 40, 1e12, T + 20);
	const m1 = mergeDonations(pc, phone);
	const m2 = mergeDonations(phone, pc);
	assert.deepEqual(donationsByOrg(m1), donationsByOrg(m2));
	assert.equal(donationsByOrg(m1).holk, 640);
	assert.equal(Object.keys(m1.log).length, 3);
	assert.deepEqual(mergeDonations(m1, m1), m1, 'merging again changes nothing');
	assert.equal(donationTotal(mergeDonations(m1, base)), 640, 'an older copy takes nothing back');
	assert.equal(mergeDonations(undefined, pc), pc);
	assert.equal(mergeDonations(pc, undefined), pc);
});

test('donations: cleaning drops what isn’t a gift', () => {
	assert.equal(cleanDonations(null), undefined);
	assert.equal(cleanDonations({ dev: {} }), undefined);
	const raw = {
		dev: {
			devA: { s: { holk: 500, barn: -4, campaign: 1.5, unicef: 99, wrists: 20 }, at: T },
			'bad id!': { s: { holk: 9 }, at: T },
			devB: { s: {}, at: T },
			devC: { s: { holk: 5 }, at: 'yesterday' }
		},
		log: {
			g1: { o: 'holk', n: 500, at: T },
			g2: { o: 'nope', n: 5, at: T },
			g3: { o: 'barn', n: 0, at: T }
		}
	};
	assert.deepEqual(cleanDonations(raw), { dev: { devA: { s: { holk: 500, wrists: 20 }, at: T } }, log: { g1: { o: 'holk', n: 500, at: T } } });
});

test('donations: the squad’s totals, top donors, who gave to what, the latest gifts', () => {
	const a = give(give(undefined, 'devA', 'ga1', 'holk', 5000, 1e12, T), 'devA', 'ga2', 'barn', 100, 1e12, T + 5);
	const b = give(give(undefined, 'devB', 'gb1', 'holk', 6000, 1e12, T + 1), 'devB', 'gb2', 'campaign', 50, 1e12, T + 9);
	const g = squadGiving({ [A]: { name: 'Abscar', donations: a }, [B]: { name: 'Ingman', donations: b }, cccccccc3333: { name: 'Lurker' } });
	assert.equal(g.total, 11150);
	assert.deepEqual(g.byOrg.holk, { total: 11000, donors: 2, top: { id: B, n: 6000 } });
	assert.deepEqual(g.byOrg.barn, { total: 100, donors: 1, top: { id: A, n: 100 } });
	assert.deepEqual(g.byOrg.hardcore, { total: 0, donors: 0, top: null });
	assert.deepEqual(
		g.donors.map((d) => d.id),
		[B, A],
		'most given first; nobody who gave nothing'
	);
	assert.deepEqual(g.donors[1].per, [
		{ o: 'holk', n: 5000 },
		{ o: 'barn', n: 100 }
	]);
	assert.deepEqual(
		g.recent.map((x) => [x.by, x.id]),
		[
			[B, 'gb2'],
			[A, 'ga2'],
			[B, 'gb1'],
			[A, 'ga1']
		]
	);
});

test('donations: goals', () => {
	assert.deepEqual(goalOf(0), { reached: 0, from: 0, to: 10_000, frac: 0 });
	assert.deepEqual(goalOf(5_000), { reached: 0, from: 0, to: 10_000, frac: 0.5 });
	assert.deepEqual(goalOf(10_000), { reached: 1, from: 10_000, to: 50_000, frac: 0 });
	assert.equal(goalOf(1_000_000).to, 2_000_000, 'after the list, each goal twice the last');
	assert.equal(goalOf(3_000_000).reached, 7);
	assert.equal(goalPassed(9_000, 9_999), null);
	assert.equal(goalPassed(9_000, 10_000), 10_000);
	assert.equal(goalPassed(9_000, 120_000), 100_000, 'the highest goal passed');
});

test('donations: typed amounts', () => {
	assert.equal(parseAmount('1500'), 1500);
	assert.equal(parseAmount(' 12,345 '), 12345);
	assert.equal(parseAmount('12 345'), 12345);
	assert.equal(parseAmount('10k'), 10000);
	assert.equal(parseAmount('2.5M'), 2500000);
	assert.equal(parseAmount('3b'), 3_000_000_000);
	assert.equal(parseAmount('1.5T'), 1_500_000_000_000);
	assert.equal(parseAmount('25000000000'), 25_000_000_000);
	assert.equal(parseAmount('2.5'), null, 'no half burgers');
	assert.equal(parseAmount('0'), null);
	assert.equal(parseAmount('-5'), null);
	assert.equal(parseAmount('lots'), null);
	assert.equal(parseAmount(''), null);
});

test('karma bank: hearts = burgers donated minus love sent; love goes out n each, never past the bank', () => {
	assert.equal(karmaBalance(1000, undefined), 1000);
	const k1 = withLove(undefined, [B], 300, 1000, ['k1'], T, 2);
	assert.deepEqual(k1, { given: { [B]: 300 }, log: { k1: { to: B, n: 300, at: T, m: 2 } } });
	assert.equal(karmaGiven(k1), 300);
	assert.equal(karmaBalance(1000, k1), 700);
	assert.equal(withLove(k1, [A, B], 400, 700, ['k2', 'k3'], T + 1), null, '2 × 400 is more than the 700 in the bank');
	const k2 = withLove(k1, [A, B], 350, 700, ['k2', 'k3'], T + 1);
	assert.deepEqual(k2.given, { [B]: 650, [A]: 350 });
	assert.equal(karmaBalance(1000, k2), 0);
	assert.equal(karmaBalance(500, k2), 0, 'never below zero (a donor left the squad)');
	assert.equal(withLove(k1, [B, B], 10, 700, ['k2', 'k3'], T), null, 'nobody twice in one go');
	assert.equal(withLove(k1, ['bad id'], 10, 700, ['k2'], T), null);
	assert.equal(withLove(k1, [B], 0, 700, ['k2'], T), null);
	assert.equal(withLove(k1, [B], 10, 700, ['k2', 'k3'], T), null, 'one log id per member');
	assert.equal(withLove(k1, [B], 10, 700, ['k2'], T, 99).log.k2.m, undefined, 'an unknown love line is dropped');
});

test('karma bank: the log keeps the newest, cleaning, love for me since a time', () => {
	let k;
	for (let i = 0; i < KARMA_LOG + 5; i++) k = withLove(k, [i % 2 ? A : B], 10, 1e9, [`kk${i}`], T + i);
	assert.equal(Object.keys(k.log).length, KARMA_LOG);
	assert.equal(karmaGiven(k), (KARMA_LOG + 5) * 10, 'totals keep everything');
	assert.deepEqual(cleanKarma(JSON.parse(JSON.stringify(k))), k);
	assert.equal(cleanKarma({ given: {} }), undefined);
	assert.deepEqual(cleanKarma({ given: { [A]: 5, 'no!': 9, [B]: -3 }, log: { x1: { to: A, n: 5, at: T, m: 1 }, x2: { to: 'nope', n: 1, at: T } } }), { given: { [A]: 5 }, log: { x1: { to: A, n: 5, at: T, m: 1 } } });
	const mine = loveFor(k, B, T + KARMA_LOG);
	assert.ok(mine.length > 0 && mine.every((g) => g.to === B && g.at > T + KARMA_LOG));
	assert.deepEqual(
		mine.map((g) => g.at),
		[...mine.map((g) => g.at)].sort((a, b) => a - b),
		'oldest first'
	);
});

test('karma bank: in the squad document and the burger bank', () => {
	const progress = { weapons: {}, mastery: {}, lastTickAt: null };
	const abscar = memberEntry({ name: 'Abscar', op: 'abscar' }, progress, T);
	const ingman = memberEntry({ name: 'Ingman', op: 'ingman' }, progress, T, false, { donations: give(undefined, 'devB', 'gb1', 'beer', 6) });
	const karma = withLove(undefined, [B], 5, 6, ['k1'], T, 0);
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { [A]: abscar, [B]: ingman }, karma }))));
	assert.deepEqual(doc.karma, karma, 'survives the trip through the document');
	const bank = burgerBank(doc, doc.members, T);
	assert.equal(bank[B].karma, 5);
	assert.equal(bank[B].balance, BURGERS.start - 6 + 5, 'gave 6, got 5 back with love');
	assert.equal(bank[A].karma, 0);
	assert.equal(bank[A].house, 0, 'the house gets none of the donations');
});

test('karma bank since 2026-11-22: gifts are KarmaShop hearts (`karmaHearts`), never burgers; the old list still counts as hearts', () => {
	const progress = { weapons: {}, mastery: {}, lastTickAt: null };
	const abscar = memberEntry({ name: 'Abscar', op: 'abscar' }, progress, T);
	const ingman = memberEntry({ name: 'Ingman', op: 'ingman' }, progress, T, false, { donations: give(undefined, 'devB', 'gb1', 'beer', 1000) });
	// sent before (arrived as burgers) and since (hearts)
	const karma = withLove(undefined, [B], 5, 1000, ['k1'], T, 0);
	const karmaHearts = withLove(undefined, [B], 200, karmaBalance(1000, karma), ['h1'], T + 60_000, 3);
	assert.equal(withLove(undefined, [B], 996, karmaBalance(1000, karma), ['h2'], T), null, 'what went out in the old list comes off the bank too');
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { [A]: abscar, [B]: ingman }, karma, karmaHearts }))));
	assert.deepEqual(doc.karmaHearts, karmaHearts, 'survives the trip through the document');
	assert.equal(doc.more, undefined, 'a field this page knows');
	assert.equal(karmaBalance(1000, doc.karma, doc.karmaHearts), 795);
	assert.equal(lovedTotal(doc), 205);
	assert.equal(heartsGiftedTo(doc, B), 205, 'old + new gifts are hearts');
	assert.equal(heartsGiftedTo(doc, A), 0);
	assert.equal(heartsGiftedTo(doc, null), 0);
	assert.deepEqual(
		loveLog(doc).map((g) => g.id),
		['h1', 'k1'],
		'both logs, newest first'
	);
	const bank = burgerBank(doc, doc.members, T);
	assert.equal(bank[B].karma, 5, 'only the old gift is burgers');
	assert.equal(bank[B].raw, BURGERS.start - 1000 + 5, 'the 200 hearts never touch burgers');
	assert.equal(bank[A].house, 0);
});

test('donations: in the squad document and the burger bank (not to the house)', () => {
	const donations = give(undefined, 'devB', 'gb1', 'hardcore', 4);
	const progress = { weapons: {}, mastery: {}, lastTickAt: null };
	const abscar = memberEntry({ name: 'Abscar', op: 'abscar' }, progress, T);
	const ingman = memberEntry({ name: 'Ingman', op: 'ingman' }, progress, T, false, { donations });
	assert.deepEqual(ingman.donations, donations);
	const doc = fromSquadWire(toSquadWire({ members: { [A]: abscar, [B]: ingman } }));
	assert.deepEqual(doc.members[B].donations, donations, 'survives the trip through the document');
	const bank = burgerBank(doc, doc.members, T);
	assert.equal(bank[B].donated, 4);
	assert.equal(bank[B].balance, BURGERS.start - 4);
	assert.equal(bank[A].house, 0, 'the house gets none of it');
	assert.equal(bank[A].balance, BURGERS.start);
});
