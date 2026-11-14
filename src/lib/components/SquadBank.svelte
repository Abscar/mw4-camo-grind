<!--
	The burger bank (squad step 3, 2026-11-14; the user's pick): pretend burgers, never money.
	Everyone earns burgers from their own camos (squad-fun.ts BURGERS), bets them on duels and on
	the race to Divergence (win = the bet back doubled, lose = gone, called off = back), and a
	real-burger IOU list: one burger per lost duel, netted between each pair, "Paid" clears it.
	Balances are worked out from everyone's ticks + the bets in the squad document; nothing else is stored.
-->
<script lang="ts">
	import { LADDER } from '#lib/data/camos.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { duelResult } from '#lib/squad-codec.ts';
	import { betOutcome, burgerBank, debts, raceWinner, BURGERS } from '#lib/squad-fun.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';

	const b = t.squad.bank;
	const doc = $derived(squad.doc ?? { members: {} });
	const members = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])));
	const bank = $derived(burgerBank(doc, members));
	const ranking = $derived(squad.entries.map((e) => ({ id: e.id, name: e.member.name, row: bank[e.id] })).sort((x, y) => (y.row?.balance ?? 0) - (x.row?.balance ?? 0)));
	const owed = $derived(debts(doc, members));
	const bets = $derived([...(doc.bets ?? [])].reverse());
	const nameOf = (id: string) => members[id]?.name ?? '?';
	const mine = $derived(squad.me ? (bank[squad.me.id]?.balance ?? 0) : 0);

	// what you can bet on: open duels, and the race while nobody has Divergence
	const openDuels = $derived((doc.duels ?? []).filter((d) => !duelResult(d, members)));
	const raceOpen = $derived(raceWinner(members) === null && squad.entries.length >= 2);

	let open = $state(false);
	let target = $state('race');
	let pick = $state('');
	let amount = $state(5);
	let busy = $state(false);

	const choices = $derived.by(() => {
		if (target === 'race') return squad.entries.map((e) => e.id);
		const d = openDuels.find((x) => x.id === target);
		return d ? [d.a, d.b] : [];
	});

	function openForm() {
		target = raceOpen ? 'race' : (openDuels[0]?.id ?? 'race');
		pick = '';
		amount = Math.max(1, Math.min(5, mine));
		open = true;
	}

	$effect(() => {
		if (!choices.includes(pick)) pick = choices[0] ?? '';
	});

	async function place() {
		if (!pick || amount < 1) return;
		busy = true;
		const ok = await squad.placeBet(target === 'race' ? 'race' : 'duel', target, pick, amount);
		busy = false;
		if (ok) {
			open = false;
			toast.show(b.placed);
		} else toast.show(b.refused, undefined, 6000);
	}

	function what(kind: 'duel' | 'race', ref: string): string {
		if (kind === 'race') return b.whatRace;
		const d = doc.duels?.find((x) => x.id === ref);
		return b.whatDuel(d ? (WEAPON_BY_ID.get(d.weapon)?.name ?? '') : '…');
	}
</script>

{#snippet burger(size = 16)}
	<svg class="bk-burger" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
		<path d="M3 11c0-4.4 4-7 9-7s9 2.6 9 7z" fill="#e0a040" stroke="#5a3200" stroke-width="1.2" />
		<path d="M2.5 12.5h19l-1.5 2h-16z" fill="#4fb23a" />
		<rect x="3" y="14.2" width="18" height="2.8" rx="1.2" fill="#6b3a1c" />
		<path d="M3.5 17.5h17c0 2-1.5 3-3.5 3H7c-2 0-3.5-1-3.5-3z" fill="#e0a040" stroke="#5a3200" stroke-width="1.2" />
		<circle cx="8" cy="7.5" r=".7" fill="#fff6d0" /><circle cx="12" cy="6.3" r=".7" fill="#fff6d0" /><circle cx="15.6" cy="8" r=".7" fill="#fff6d0" />
	</svg>
{/snippet}

<section class="sq-box sq-bank rounded-card border border-line bg-panel-2 p-3" aria-labelledby="sq-bank-h">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h3 id="sq-bank-h" class="flex items-center gap-1.5 font-head text-[13px] font-bold tracking-[0.12em] uppercase">{@render burger(18)}{b.heading}</h3>
		<button type="button" class="btn btn-sm" disabled={!openDuels.length && !raceOpen} onclick={openForm}>{b.bet}</button>
	</div>
	<p class="mt-1 text-xs text-muted">{b.note}</p>
	<details class="mt-1 text-xs text-muted">
		<summary class="min-h-11 cursor-pointer content-center">{b.howLabel}</summary>
		<p class="pb-1">{b.how(BURGERS)}</p>
	</details>

	<!-- who's richest -->
	<ol class="mt-1 grid gap-1">
		{#each ranking as r, i (r.id)}
			<li class="bk-row flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5" class:bk-mine={r.id === squad.me?.id}>
				<span class="num w-5 flex-none text-[12px] text-muted">{i + 1}</span>
				<b class="min-w-0 flex-1 truncate text-[13px]">{r.name}</b>
				{#if r.row?.held}<span class="text-[11px] text-muted">{b.onBets(r.row.held)}</span>{/if}
				<span class="bk-n num flex flex-none items-center gap-1 font-head">{@render burger(14)}{(r.row?.balance ?? 0).toLocaleString('en-US')}<span class="sr-only"> {b.icon}</span></span>
			</li>
		{/each}
	</ol>

	<!-- bets -->
	<h4 class="mt-3 font-head text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{b.betsHeading}</h4>
	{#if !bets.length}
		<p class="mt-1 text-xs text-muted">{!openDuels.length && !raceOpen ? b.nothingOpen : b.noBets}</p>
	{:else}
		<ul class="mt-1 grid gap-1">
			{#each bets.slice(0, 8) as bet (bet.id)}
				{@const state = betOutcome(bet, doc, members)}
				<li class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
					<span class="bk-state font-head" data-state={state}>{b.states[state]}</span>
					<span class="min-w-0 flex-1">{b.betLine(nameOf(bet.by), bet.amount, nameOf(bet.pick), what(bet.kind, bet.ref))}</span>
					{#if state === 'open' && bet.by === squad.me?.id}
						<button type="button" class="-my-2.5 min-h-11 px-1 text-muted underline-offset-2 hover:text-fg hover:underline" onclick={() => void squad.withdrawBet(bet.id)}>{b.withdraw}</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- real burgers -->
	<h4 class="mt-3 font-head text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{b.iouHeading}</h4>
	<p class="text-[11px] text-muted">{b.iouNote}</p>
	{#if !owed.length}
		<p class="mt-1 text-xs text-muted">{b.noIou}</p>
	{:else}
		<ul class="mt-1 grid gap-1">
			{#each owed as debt (debt.from + debt.to)}
				<li class="bk-iou flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1 text-[13px]">
					<span class="min-w-0">{b.iou(nameOf(debt.from), nameOf(debt.to), debt.n)}</span>
					<button type="button" class="btn btn-sm flex-none" onclick={() => void squad.markPaid(debt.ids)}>{b.paid}</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<Dialog bind:open title={b.betTitle}>
	<form
		id="bk-form"
		class="grid gap-3"
		onsubmit={(e) => {
			e.preventDefault();
			void place();
		}}
	>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{b.on}</span>
			<select bind:value={target} class="field h-11">
				{#if raceOpen}<option value="race">{b.race}</option>{/if}
				{#each openDuels as d (d.id)}
					<option value={d.id}>{b.duelOpt(nameOf(d.a), nameOf(d.b), LADDER[d.goal - 1]?.name ?? '', WEAPON_BY_ID.get(d.weapon)?.name ?? '')}</option>
				{/each}
			</select>
		</label>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{b.winner}</span>
			<select bind:value={pick} class="field h-11">
				{#each choices as id (id)}<option value={id}>{nameOf(id)}</option>{/each}
			</select>
		</label>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{b.amount}</span>
			<input type="number" min="1" max={Math.max(1, mine)} step="1" bind:value={amount} class="field h-11" />
			<span class="text-xs">{b.youHave(mine)}</span>
		</label>
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (open = false)}>{b.cancel}</button>
		<button type="submit" form="bk-form" class="btn btn-primary" disabled={busy || mine < 1 || amount < 1 || amount > mine}>{b.go}</button>
	{/snippet}
</Dialog>

<style>
	.bk-row {
		background: rgb(127 127 127 / 0.1);
	}
	.bk-mine {
		box-shadow: inset 0 0 0 1px var(--t-accent);
	}
	.bk-n {
		font-size: 15px;
		font-weight: 800;
	}
	.bk-state {
		padding: 0 6px;
		border-radius: 999px;
		border: 1px solid currentColor;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.bk-state[data-state='won'] {
		color: var(--t-buff, #3ee06a);
	}
	.bk-state[data-state='lost'] {
		color: var(--t-nerf, #ff5a5a);
	}
	.bk-state[data-state='open'] {
		color: #e0a420;
	}
	.bk-iou {
		background: rgb(224 164 32 / 0.12);
		border: 1px dashed rgb(224 164 32 / 0.6);
	}
</style>
