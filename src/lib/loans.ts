/**
 * BurgiBank loans (2026-11-16, the user's ask: "let players take a loan from the house (not Abscar) with
 * a week to pay it back with interest; the interest goes to Abscar"). Pretend burgers, never money.
 *
 * The bank (not Abscar's account) lends 1,000–100,000 burgers (100–1,000 until 2026-11-20, the user: "höj
 * lånen i banken till 100k max", the same day the daily bonus went ×100); you get them at once. Within LOAN_DAYS you pay
 * back the loan + LOAN_RATE interest (you can pay early, the interest is the same). If you don't, the bank
 * takes it back by itself on the due date, even if that leaves you with nothing. Only the interest goes
 * to the house (Abscar, squad-casino.ts HOUSE_OP); the loan itself goes back to the bank. One open loan
 * at a time.
 *
 * Stored as member field `loans` (squad-codec.ts): loan id → { p, at, due, paid? }, the newest LOAN_KEEP;
 * the interest of settled loans that dropped off the list stays in `old`. Kept on the device too
 * (`mw4-camo-grind:loans`); two devices merge by id (the earliest payment wins).
 * No browser APIs and no runes, so Node tests it directly (scripts/loans.test.js).
 */

export const LOAN_SIZES = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000];
/** Sizes lent before 2026-11-20: loans taken then still read back (and keep their interest). */
const OLD_SIZES = [100, 250, 500];
const KNOWN_SIZES = new Set([...LOAN_SIZES, ...OLD_SIZES]);
/** Interest for the week (10 %), rounded up to whole burgers. */
export const LOAN_RATE = 0.1;
export const LOAN_DAYS = 7;
export const LOAN_KEEP = 20;
const DAY = 86_400_000;

export interface Loan {
	/** Burgers lent. */
	p: number;
	/** When it was taken / is due (ms). */
	at: number;
	due: number;
	/** When it was paid back (ms), if it was. */
	paid?: number;
}
export interface LoanBook {
	loans: Record<string, Loan>;
	/** Interest of settled loans that dropped off the list. */
	old?: number;
}

const ID = /^[A-Za-z0-9_-]{4,16}$/;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTime = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

export const interestOf = (p: number) => Math.ceil(p * LOAN_RATE);
export const owedOn = (l: Loan) => l.p + interestOf(l.p);

export type LoanState = 'open' | 'paid' | 'collected';
/** Open until paid; collected by the bank once the due date has passed. */
export function loanState(l: Loan, now: number): LoanState {
	if (l.paid !== undefined && l.paid <= l.due) return 'paid';
	if (now >= l.due) return 'collected';
	return l.paid !== undefined ? 'paid' : 'open';
}

function prune(book: LoanBook, now: number): LoanBook {
	const list = Object.entries(book.loans).sort(([, a], [, b]) => b.at - a.at);
	let old = book.old ?? 0;
	const keep: [string, Loan][] = [];
	for (const [id, l] of list) {
		if (keep.length < LOAN_KEEP || loanState(l, now) === 'open') keep.push([id, l]);
		else old += interestOf(l.p);
	}
	const out: LoanBook = { loans: Object.fromEntries(keep) };
	if (old) out.old = old;
	return out;
}

export function cleanLoans(raw: unknown): LoanBook | undefined {
	if (!isObject(raw) || !isObject(raw.loans)) return undefined;
	const loans: Record<string, Loan> = {};
	for (const [id, l] of Object.entries(raw.loans)) {
		if (!ID.test(id) || !isObject(l) || !KNOWN_SIZES.has(l.p as number) || !isTime(l.at) || !isTime(l.due) || (l.due as number) < (l.at as number)) continue;
		const loan: Loan = { p: l.p as number, at: Math.round(l.at as number), due: Math.round(l.due as number) };
		if (isTime(l.paid)) loan.paid = Math.round(l.paid as number);
		loans[id] = loan;
	}
	const old = Number.isInteger(raw.old) && (raw.old as number) > 0 ? (raw.old as number) : 0;
	if (!Object.keys(loans).length && !old) return undefined;
	return old ? { loans, old } : { loans };
}

/** The loan that's still open, if any. */
export function openLoan(book: LoanBook | undefined, now: number): (Loan & { id: string }) | null {
	for (const [id, l] of Object.entries(book?.loans ?? {})) if (loanState(l, now) === 'open') return { id, ...l };
	return null;
}

/** Take a loan (null: one is already open, or not a size the bank lends). */
export function takeLoan(book: LoanBook | undefined, id: string, p: number, now: number): LoanBook | null {
	if (!ID.test(id) || !LOAN_SIZES.includes(p) || openLoan(book, now)) return null;
	return prune({ loans: { ...book?.loans, [id]: { p, at: now, due: now + LOAN_DAYS * DAY } }, old: book?.old }, now);
}

/** Pay back the open loan (null: none open, or not enough burgers for loan + interest). */
export function repayLoan(book: LoanBook | undefined, balance: number, now: number): LoanBook | null {
	const l = openLoan(book, now);
	if (!l || !book || balance < owedOn(l)) return null;
	const { id, ...loan } = l;
	return { ...book, loans: { ...book.loans, [id]: { ...loan, paid: now } } };
}

/** Two copies of your loans (two devices): by id, the earliest payment wins. */
export function mergeLoans(a: LoanBook | undefined, b: LoanBook | undefined, now: number): LoanBook | undefined {
	if (!a || !b) return a ?? b;
	const loans = { ...a.loans };
	for (const [id, l] of Object.entries(b.loans)) {
		const mine = loans[id];
		if (!mine) loans[id] = l;
		else if (l.paid !== undefined && (mine.paid === undefined || l.paid < mine.paid)) loans[id] = { ...mine, paid: l.paid };
	}
	return prune({ loans, old: Math.max(a.old ?? 0, b.old ?? 0) || undefined }, now);
}

/**
 * What a member's loans do to their burgers right now: +the loans, −loan and interest for each one paid
 * or collected; `interest` = what's been settled (it goes to the house).
 */
export function loanEffect(book: LoanBook | undefined, now: number): { balance: number; interest: number; owed: number } {
	let balance = -(book?.old ?? 0);
	let interest = book?.old ?? 0;
	let owed = 0;
	for (const l of Object.values(book?.loans ?? {})) {
		balance += l.p;
		if (loanState(l, now) === 'open') owed += owedOn(l);
		else {
			balance -= owedOn(l);
			interest += interestOf(l.p);
		}
	}
	return { balance, interest, owed };
}
