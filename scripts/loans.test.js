// BurgiBank loans (src/lib/loans.ts), 4:20 (four20.ts + squad-casino.ts count420), pranks (shop.ts),
// Abscar's admin grants, and how they all count in the burger bank. `npm test`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { is420, minutesLeft420 } from '../src/lib/four20.ts';
import { cleanLoans, interestOf, loanEffect, loanState, mergeLoans, openLoan, owedOn, repayLoan, takeLoan, LOAN_DAYS, LOAN_SIZES } from '../src/lib/loans.ts';
import { cleanShop, pranksOn, shopSpent, throwPrank, PRANK_KEEP } from '../src/lib/shop.ts';
import { cleanOnline, count420, dailyRate, mergeOnline } from '../src/lib/squad-casino.ts';
import { cleanGrants, fromSquadWire, memberEntry, toSquadWire } from '../src/lib/squad-codec.ts';
import { burgerBank, BURGERS } from '../src/lib/squad-fun.ts';

const T = Date.UTC(2026, 10, 16, 18);
const DAY = 86_400_000;
const A = 'aaaaaaaa1111';
const B = 'bbbbbbbb2222';

test('loans: borrow, one at a time, pay back with 10 % interest', () => {
	assert.equal(interestOf(100), 10);
	assert.equal(interestOf(250), 25);
	assert.equal(takeLoan(undefined, 'loan1', 123, T), null, 'only the sizes on offer');
	const book = takeLoan(undefined, 'loan1', 500, T);
	assert.deepEqual(book.loans.loan1, { p: 500, at: T, due: T + LOAN_DAYS * DAY });
	assert.equal(takeLoan(book, 'loan2', 100, T + 1), null, 'one open loan at a time');
	assert.deepEqual(loanEffect(book, T + 1), { balance: 500, interest: 0, owed: 550 });
	assert.equal(repayLoan(book, 549, T + DAY), null, 'not enough to pay back');
	const paid = repayLoan(book, 550, T + DAY);
	assert.equal(loanState(paid.loans.loan1, T + DAY), 'paid');
	assert.deepEqual(loanEffect(paid, T + DAY), { balance: -50, interest: 50, owed: 0 });
	assert.ok(takeLoan(paid, 'loan2', 1000, T + DAY + 1), 'a new loan once paid');
});

test('loans: the bank takes it back by itself on the due date', () => {
	const book = takeLoan(undefined, 'loan1', 1000, T);
	assert.equal(openLoan(book, T + 6 * DAY).id, 'loan1');
	assert.equal(loanState(book.loans.loan1, T + LOAN_DAYS * DAY), 'collected');
	assert.equal(openLoan(book, T + LOAN_DAYS * DAY), null);
	assert.deepEqual(loanEffect(book, T + 8 * DAY), { balance: -100, interest: 100, owed: 0 });
});

test('loans: cleaning, two devices, old loans keep their interest', () => {
	assert.equal(cleanLoans('x'), undefined);
	assert.deepEqual(cleanLoans({ loans: { ok12: { p: 250, at: T, due: T + 7 * DAY }, bad1: { p: 99, at: T, due: T + DAY }, 'x y': { p: 100, at: T, due: T + DAY } } }), {
		loans: { ok12: { p: 250, at: T, due: T + 7 * DAY } }
	});
	const pc = takeLoan(undefined, 'loan1', 250, T);
	const phone = repayLoan(pc, 9999, T + DAY);
	const merged = mergeLoans(pc, phone, T + DAY);
	assert.equal(merged.loans.loan1.paid, T + DAY, 'the payment on the phone counts');
	// 25 settled loans: the oldest drop off the list but their interest stays
	let book;
	for (let i = 0; i < 25; i++) {
		book = takeLoan(book, `ln${String(i).padStart(3, '0')}`, 100, T + i * 10 * DAY);
		book = repayLoan(book, 9999, T + i * 10 * DAY + 1);
	}
	assert.equal(Object.keys(book.loans).length <= 21, true);
	assert.equal(loanEffect(book, T + 400 * DAY).interest, 25 * 10);
	assert.equal(loanEffect(book, T + 400 * DAY).balance, -250);
	assert.deepEqual(LOAN_SIZES, [100, 250, 500, 1000]);
	assert.equal(owedOn({ p: 1000, at: T, due: T }), 1100);
});

test('4:20: 16:20 to 17:20 local time', () => {
	const at = (h, m) => new Date(2026, 10, 16, h, m);
	assert.equal(is420(at(16, 19)), false);
	assert.equal(is420(at(16, 20)), true);
	assert.equal(is420(at(17, 19)), true);
	assert.equal(is420(at(17, 20)), false);
	assert.equal(is420(at(4, 20)), false, 'only the afternoon one');
	assert.equal(minutesLeft420(at(16, 20)), 60);
	assert.equal(minutesLeft420(at(17, 0)), 20);
	assert.equal(minutesLeft420(at(12, 0)), 0);
});

test('4:20: the day’s bonus once more, once a day, only when counted today', () => {
	const o = { n: 12, last: '2026-11-16' };
	assert.equal(count420(o, '2026-11-16', false).added, 0, 'not 4:20');
	const r = count420(o, '2026-11-16', true);
	assert.equal(r.added, dailyRate(12));
	assert.deepEqual(r.next, { n: 12, last: '2026-11-16', b420: dailyRate(12), d420: '2026-11-16' });
	assert.equal(count420(r.next, '2026-11-16', true).added, 0, 'once a day');
	assert.equal(count420({ n: 12, last: '2026-11-15' }, '2026-11-16', true).added, 0, 'today not counted yet');
	assert.deepEqual(cleanOnline({ n: 3, last: '2026-11-16', b420: 25, d420: '2026-11-16' }), { n: 3, last: '2026-11-16', b420: 25, d420: '2026-11-16' });
	const merged = mergeOnline({ n: 13, last: '2026-11-17' }, r.next);
	assert.deepEqual(merged, { n: 13, last: '2026-11-17', b420: dailyRate(12), d420: '2026-11-16' }, 'the 4:20 extra survives a merge');
});

test('pranks: paid per throw, on the target for their time, kept short', () => {
	const r = throwPrank(undefined, 'smoke-bomb', B, 1000, T, 'pr001');
	assert.equal(r.result, 'ok');
	assert.equal(shopSpent(r.state), 250);
	assert.equal(throwPrank(undefined, 'too-high', B, 399, T, 'pr002').result, 'broke');
	assert.equal(throwPrank(undefined, 'nope', B, 9999, T, 'pr003').result, 'unknown');
	const r2 = throwPrank(r.state, 'too-high', B, 9999, T + 1, 'pr002');
	const members = { [A]: { shop: r2.state }, [B]: {} };
	const on = pranksOn(B, members, T + 30 * 60_000);
	assert.deepEqual(Object.keys(on).sort(), ['smoke-bomb', 'too-high']);
	assert.equal(on['smoke-bomb'].by, A);
	assert.deepEqual(Object.keys(pranksOn(B, members, T + 2 * 3_600_000)), ['too-high'], 'the smoke clears after an hour');
	assert.deepEqual(pranksOn(B, members, T + 25 * 3_600_000), {}, 'the stamp after a day');
	assert.deepEqual(pranksOn(A, members, T), {});
	// a buyer with only pranks keeps their shop state; old pranks still count as spent
	let s;
	for (let i = 0; i < PRANK_KEEP + 5; i++) s = throwPrank(s, 'smoke-bomb', B, 1e9, T + i, `p${String(i).padStart(4, '0')}`).state;
	assert.equal(Object.keys(s.pranks).length, PRANK_KEEP);
	assert.equal(shopSpent(s), (PRANK_KEEP + 5) * 250);
	assert.equal(shopSpent(cleanShop(JSON.parse(JSON.stringify(s)))), (PRANK_KEEP + 5) * 250);
});

test('the bank: loans, interest to the house, admin grants, the 4:20 extra', () => {
	const now = T + 10 * DAY;
	const members = {
		[A]: { name: 'Abscar', op: 'abscar', weapons: {}, mastery: {} },
		[B]: {
			name: 'Ingman',
			op: 'ingman',
			weapons: {},
			mastery: {},
			online: { n: 1, last: '2026-11-16', b420: 25, d420: '2026-11-16' },
			loans: { loans: { loan1: { p: 500, at: T, due: T + 7 * DAY } } }
		}
	};
	const doc = { members: {}, grants: { [B]: 300, [A]: -5 } };
	const bank = burgerBank(doc, members, now);
	assert.equal(bank[B].daily, 25 + 25, 'daily bonus + the 4:20 extra');
	assert.equal(bank[B].loan, -50, 'the collected loan cost its interest');
	assert.equal(bank[B].grant, 300);
	assert.equal(bank[B].balance, BURGERS.start + 50 - 50 + 300);
	assert.equal(bank[A].house, 50, "Ingman's loan interest went to the house");
	assert.equal(bank[A].balance, BURGERS.start + 50 - 5);
	// while the loan is open it's money in the pocket
	assert.equal(burgerBank(doc, members, T + DAY)[B].loan, 500);
	assert.equal(burgerBank(doc, members, T + DAY)[B].owed, 550);
	assert.equal(burgerBank(doc, members, T + DAY)[A].house, 0);
});

test('grants and loans travel in the squad document', () => {
	assert.deepEqual(cleanGrants({ [A]: 100, [B]: 0, short: 5, ['c'.repeat(12)]: 1.5 }), { [A]: 100 });
	const doc = fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: {}, grants: { [B]: -200 } }))));
	assert.deepEqual(doc.grants, { [B]: -200 });
	assert.equal(doc.more, undefined);
	const loans = { loans: { loan1: { p: 250, at: T, due: T + 7 * DAY } } };
	const entry = memberEntry({ name: 'Ingman', op: 'ingman' }, { weapons: {}, mastery: {}, lastTickAt: null }, T, false, { loans });
	assert.deepEqual(fromSquadWire(JSON.parse(JSON.stringify(toSquadWire({ members: { [B]: entry } })))).members[B].loans, loans);
});
