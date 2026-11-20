<!--
	BurgiBank (loans.ts; 2026-11-16, the user's ask: "let players take a loan from the house (not Abscar)
	with a week to pay back with interest; the interest goes to Abscar"). A box in BurgiCasino: borrow
	1,000–100,000 burgers (100–1,000 until 2026-11-20; one loan at a time), see what you owe and when, pay it back early. If you don't,
	the bank takes it back by itself on the due date. Pretend burgers, never money.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { interestOf, loanState, openLoan, owedOn, LOAN_DAYS, LOAN_RATE, LOAN_SIZES } from '#lib/loans.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';

	const l = t.loans;
	const now = $derived(Math.max(squad.now, Date.now()));
	const open = $derived(openLoan(squad.loans, now));
	const balance = $derived(squad.myBank?.balance ?? 0);
	const history = $derived.by(() => {
		let paid = 0;
		let collected = 0;
		for (const loan of Object.values(squad.loans?.loans ?? {})) {
			const st = loanState(loan, now);
			if (st === 'paid') paid++;
			else if (st === 'collected') collected++;
		}
		return { paid, collected };
	});
	const dueText = (ms: number) => new Date(ms).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	const leftText = (ms: number) => {
		const h = Math.max(0, Math.floor((ms - now) / 3_600_000));
		return l.left(Math.floor(h / 24), h);
	};

	function borrow(p: number) {
		if (squad.borrow(p)) toast.show(l.taken(p, p + interestOf(p)), undefined, 5000);
		else toast.show(l.oneAtATime, undefined, 5000);
	}

	function repay() {
		if (!open) return;
		if (squad.repay()) toast.show(l.repaid);
		else toast.show(l.cantRepay(owedOn(open)), undefined, 5000);
	}
</script>

<section class="casino-loans grid gap-2 rounded-lg px-3 py-2.5" aria-labelledby="casino-loans-h">
	<p id="casino-loans-h" class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">🏦 {l.heading}</p>
	<p class="text-[13px] text-fg">{l.intro(Math.round(LOAN_RATE * 100), LOAN_DAYS)}</p>
	{#if open}
		<p class="loan-open font-head text-[13px]" role="status">{l.open(owedOn(open), dueText(open.due), leftText(open.due))}</p>
		<div><button type="button" class="btn btn-sm btn-primary" disabled={balance < owedOn(open)} title={balance < owedOn(open) ? l.cantRepay(owedOn(open)) : undefined} onclick={repay}>{l.repay(owedOn(open))}</button></div>
	{:else}
		<div class="flex flex-wrap gap-1.5">
			{#each LOAN_SIZES as p (p)}
				<button type="button" class="btn btn-sm" onclick={() => borrow(p)}>{l.take(p)}</button>
			{/each}
		</div>
	{/if}
	{#if history.paid || history.collected}<p class="text-[11px] text-muted">{l.history(history.paid, history.collected)}</p>{/if}
</section>

<style>
	.casino-loans {
		border: 1px solid rgb(120 200 255 / 0.55);
		background: rgb(80 160 255 / 0.07);
	}
	.loan-open {
		color: var(--t-fg);
		font-weight: 800;
	}
</style>
