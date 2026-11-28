<!--
	Cards & bets in a hideout (hangout.ts duels): challenge whoever is there to a coin flip, high card or dice for
	a stake, or bet on anything (free text; settled when both say who won). The result comes from the duel's
	seed, so both pages show the same coin, cards and dice; the loser's burgers go to the winner (never the house).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { duelDraw, duelPhase, duelWinner, DUEL_KINDS, DUEL_STAKES, type Card, type Duel, type DuelKind } from '#lib/hangout.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import SquadAvatar from '../SquadAvatar.svelte';

	let { ho, balance }: { ho: string; balance: number } = $props();
	const G = t.hideout.games;
	const fmt = (n: number) => n.toLocaleString('en-US');
	const meId = $derived(squad.me?.id ?? null);
	let kind = $state<DuelKind>('high');
	let stake = $state(1000);
	let text = $state('');
	let busy = $state(false);
	const list = $derived(hangout.duelsIn(ho).slice(0, 12));

	async function challenge() {
		if (kind === 'bet' && !text.trim()) return toast.show(G.needText);
		if (balance < stake) return toast.show(G.broke);
		busy = true;
		const r = await hangout.openDuel(ho, kind, stake, kind === 'bet' ? text : undefined);
		busy = false;
		if (r === 'ok') text = '';
		else toast.show(r === 'broke' ? G.broke : G.refused);
	}
	async function accept(d: Duel) {
		if (balance < d.stake) return toast.show(G.broke);
		busy = true;
		const r = await hangout.acceptDuel(d.id);
		busy = false;
		if (r !== 'ok') toast.show(r === 'broke' ? G.broke : G.refused);
	}
	const SUITS = ['♠', '♥', '♦', '♣'];
	const RANK = (r: number) => (r <= 10 ? String(r) : ['J', 'Q', 'K', 'A'][r - 11]);
	const pip = (n: number) => ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][n];
	const nameOf = (d: Duel, id: string | null) => (id === d.by.id ? d.by.name : id === d.acc?.id ? d.acc.name : '?');
</script>

{#snippet card(c: Card, show: boolean)}
	<span class="card" class:red={c.s === 1 || c.s === 2} class:back={!show}>{#if show}<b>{RANK(c.r)}</b><i>{SUITS[c.s]}</i>{/if}</span>
{/snippet}

<div class="ho-card grid gap-2">
	<p class="text-[12.5px] text-muted">{G.intro}</p>
	<div class="flex flex-wrap gap-1.5" role="group" aria-label={G.open}>
		{#each DUEL_KINDS as k (k)}<button type="button" class="chip g-chip" aria-pressed={kind === k} onclick={() => (kind = k)}>{G.kinds[k]}</button>{/each}
	</div>
	<p class="text-[12px] text-muted">{G.kindHelp[kind]}</p>
	{#if kind === 'bet'}
		<label class="grid gap-1 text-[12px] font-bold" for="ho-bet">{G.text}<input id="ho-bet" class="field" maxlength="80" placeholder={G.textPh} bind:value={text} /></label>
	{/if}
	<div class="flex flex-wrap gap-1.5" role="group" aria-label={G.stake}>
		{#each DUEL_STAKES as n (n)}<button type="button" class="chip g-chip" aria-pressed={stake === n} onclick={() => (stake = n)}>{fmt(n)}</button>{/each}
	</div>
	<button type="button" class="btn btn-primary g-go" disabled={busy} onclick={challenge}>{G.challenge(fmt(stake))}</button>
</div>

<div class="ho-card grid gap-2">
	<p class="ho-h font-head">{G.open}</p>
	{#if !list.length}<p class="text-[13px] text-muted">{G.none}</p>{/if}
	<ul class="grid gap-2" role="list">
		{#each list as d (d.id)}
			{@const phase = duelPhase(d, hangout.now)}
			{@const draw = d.kind !== 'bet' && d.acc ? duelDraw(d) : null}
			{@const shown = phase === 'done'}
			{@const w = shown ? duelWinner(d) : null}
			<li class="duel" data-duel={d.id} data-phase={phase}>
				<div class="duel-who">
					<span class="duel-p" class:win={w === d.by.id}><SquadAvatar name={d.by.name} op={d.by.op} size={30} /> {d.by.name}</span>
					<span class="duel-vs font-head">{G.vs}</span>
					{#if d.acc}<span class="duel-p" class:win={w === d.acc.id}><SquadAvatar name={d.acc.name} op={d.acc.op} size={30} /> {d.acc.name}</span>{:else}<span class="text-[12px] text-muted">?</span>{/if}
					<span class="duel-stake font-head">{G.kinds[d.kind]} · {fmt(d.stake)} 🍔</span>
				</div>
				{#if d.text}<p class="duel-text">“{d.text}”</p>{/if}

				{#if !d.acc}
					{#if d.by.id === meId}
						<div class="flex flex-wrap items-center gap-2"><span class="text-[12px] text-muted">{G.waiting}</span><button type="button" class="btn btn-sm" onclick={() => hangout.cancelDuel(d.id)}>{G.cancel}</button></div>
					{:else}
						<button type="button" class="btn btn-primary btn-sm g-go" disabled={busy} onclick={() => accept(d)}>{G.accept(fmt(d.stake))}</button>
					{/if}
				{:else if draw}
					<div class="duel-show" class:rolling={!shown}>
						{#if d.kind === 'flip'}
							<span class="coin" class:flip={!shown}>{shown ? (draw.coin ? G.heads : G.tails) : '🪙'}</span>
						{:else if d.kind === 'high' && draw.cards}
							{@render card(draw.cards[0], shown)} <span class="duel-vs font-head">{G.vs}</span> {@render card(draw.cards[1], shown)}
						{:else if draw.dice}
							<span class="dice">{shown ? pip(draw.dice[0][0]) + pip(draw.dice[0][1]) : '🎲🎲'}</span> <span class="duel-vs font-head">{G.vs}</span>
							<span class="dice">{shown ? pip(draw.dice[1][0]) + pip(draw.dice[1][1]) : '🎲🎲'}</span>
						{/if}
						{#if shown && draw.ties}<span class="text-[11px] text-muted">{G.ties(draw.ties)}</span>{/if}
					</div>
					{#if shown && w}<p class="duel-res font-head" class:me={w === meId} role="status">{G.won(nameOf(d, w), fmt(d.stake))}</p>{/if}
				{:else}
					<!-- a bet: both say who won -->
					{#if w}
						<p class="duel-res font-head" class:me={w === meId} role="status">{G.won(nameOf(d, w), fmt(d.stake))}</p>
					{:else if meId === d.by.id || meId === d.acc.id}
						{@const myVote = d.v?.[meId]}
						{@const other = meId === d.by.id ? d.v?.[d.acc.id] : d.v?.[d.by.id]}
						<p class="text-[12px] font-bold">{G.whoWon}</p>
						<div class="flex flex-wrap gap-1.5">
							{#each [d.by, d.acc] as p (p.id)}<button type="button" class="btn btn-sm" aria-pressed={myVote === p.id} onclick={() => hangout.vote(d.id, p.id)}>{p.name}</button>{/each}
						</div>
						{#if myVote && other && other !== myVote}<p class="text-[12px] text-muted">{G.disagree}</p>{:else if myVote}<p class="text-[12px] text-muted">{G.voted(nameOf(d, myVote))}</p>{/if}
					{:else}
						<p class="text-[12px] text-muted">{G.whoWon}</p>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.ho-card {
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid var(--t-line);
		background: rgb(0 0 0 / 0.28);
	}
	.ho-h {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #ffb24a;
	}
	.g-chip {
		min-height: 36px;
	}
	.g-go {
		min-height: 44px;
		justify-self: start;
	}
	.duel {
		display: grid;
		gap: 6px;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid rgb(255 154 58 / 0.4);
		background: linear-gradient(90deg, rgb(20 70 40 / 0.45), rgb(0 0 0 / 0.2));
	}
	.duel-who {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
	}
	.duel-p {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 13px;
		font-weight: 700;
	}
	.duel-p.win {
		color: #ffd23a;
	}
	.duel-vs {
		font-size: 11px;
		font-weight: 900;
		color: #ff9a3a;
	}
	.duel-stake {
		margin-left: auto;
		font-size: 12px;
		font-weight: 800;
		color: #ffe9a6;
	}
	.duel-text {
		font-size: 13px;
		font-style: italic;
	}
	.duel-show {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.card {
		display: inline-grid;
		place-items: center;
		width: 38px;
		height: 52px;
		border-radius: 6px;
		background: #fff;
		color: #111;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.5);
		line-height: 1;
		animation: deal 0.4s ease-out both;
	}
	.card b {
		font-size: 17px;
	}
	.card i {
		font-style: normal;
		font-size: 16px;
	}
	.card.red {
		color: #d0142c;
	}
	.card.back {
		background: repeating-linear-gradient(45deg, #b0122a 0 5px, #7a0a1c 5px 10px);
		border: 3px solid #fff;
	}
	@keyframes deal {
		from {
			transform: rotateY(90deg);
		}
	}
	.coin {
		display: inline-grid;
		place-items: center;
		min-width: 60px;
		height: 40px;
		padding: 0 10px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ffe066, #c98a10);
		color: #2a1400;
		font-weight: 900;
	}
	.coin.flip {
		animation: coin 0.4s linear infinite;
	}
	@keyframes coin {
		50% {
			transform: scaleX(0.1);
		}
	}
	.dice {
		font-size: 28px;
		line-height: 1;
	}
	.rolling .dice {
		animation: roll 0.3s linear infinite;
	}
	@keyframes roll {
		50% {
			transform: rotate(20deg);
		}
	}
	.duel-res {
		font-size: 15px;
		font-weight: 900;
		color: #ffe9a6;
	}
	.duel-res.me {
		color: #5dff86;
		text-shadow: 0 0 10px rgb(90 255 130 / 0.5);
	}
	@media (prefers-reduced-motion: reduce) {
		.card,
		.coin.flip,
		.rolling .dice {
			animation: none;
		}
	}
</style>
