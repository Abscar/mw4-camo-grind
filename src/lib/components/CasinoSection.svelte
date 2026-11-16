<!--
	BurgiCasino, the fifth page tab (2026-11-16, the user's ask: "a roulette and a blackjack mode, a
	whole new tab called 'BurgiCasino'", then "a one-armed bandit in burger theme", "'Abscar's fortune'
	on it, the arm a big smoking holk"). Plays with the squad's burger bank (squad-fun.ts): your balance,
	the daily bonus (squad-casino.ts: 25 a day, +25 every 5 days online), a switch between Abscar's
	Fortune (CasinoSlots), roulette and blackjack, and a leaderboard of what everyone won or lost.
	Pretend burgers, never money. Outside a squad it points to the Squad tab.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { casinoTotal, daysToNextRate, dailyRate, dailyTotal } from '#lib/squad-casino.ts';
	import { burgerBank, houseOf } from '#lib/squad-fun.ts';
	import CasinoBlackjack from './CasinoBlackjack.svelte';
	import CasinoRoulette from './CasinoRoulette.svelte';
	import CasinoSlots from './CasinoSlots.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	let { onSquad }: { onSquad?: () => void } = $props();
	const c = t.casino;
	type Game = 'slots' | 'roulette' | 'blackjack';
	const GAMES: Game[] = ['slots', 'roulette', 'blackjack'];
	const GAME_KEY = 'mw4-camo-grind:casino-game';

	let game = $state<Game>('slots');
	$effect(() => {
		try {
			const saved = localStorage.getItem(GAME_KEY);
			if (saved && (GAMES as string[]).includes(saved)) game = saved as Game;
		} catch {
			// storage blocked: start on the slot machine
		}
	});
	function pick(g: Game) {
		game = g;
		hidden = 0;
		pending = 0;
		try {
			localStorage.setItem(GAME_KEY, g);
		} catch {
			// works for this visit
		}
	}

	/** Burgers the game in play holds back (on the table, or won but not shown yet). */
	let hidden = $state(0);
	/** The part of your casino result that's booked but not shown yet (the leaderboard waits for it). */
	let pending = $state(0);
	const balance = $derived(squad.myBank?.balance ?? 0);
	const shown = $derived(Math.max(0, balance - hidden));
	const days = $derived(squad.online?.n ?? 0);

	/** The house (Abscar) and what the others have lost to it so far. */
	const members = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])));
	const houseId = $derived(houseOf(members));
	const houseEntry = $derived(houseId ? (squad.entries.find((e) => e.id === houseId) ?? null) : null);
	const houseTake = $derived(houseId && squad.doc ? (burgerBank(squad.doc, members)[houseId]?.house ?? 0) : 0);

	const board = $derived(
		squad.entries
			.map((e) => {
				const tally = casinoTotal(e.member.casino);
				return { e, ...tally, net: e.mine ? tally.net - pending : tally.net };
			})
			.filter((x) => x.games > 0)
			.sort((a, b) => b.net - a.net || a.e.member.name.localeCompare(b.e.member.name))
	);
	const signed = (n: number) => (n > 0 ? `+${n.toLocaleString('en-US')}` : n < 0 ? `−${(-n).toLocaleString('en-US')}` : '±0');
</script>

<section class="class-card meta-list casino overflow-hidden rounded-card bg-panel shadow-card" style:--c="#ffc928" aria-labelledby="casino-h">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="casino-h" class="casino-title font-head text-xl font-black tracking-wide uppercase">{c.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{c.sub}</span>
		</div>
		{#if squad.on}
			<p class="casino-bal font-head" aria-live="polite"><span>{c.balance}</span><b class="num">{c.burgers(shown)}</b></p>
		{/if}
	</header>

	{#if !squad.on}
		<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
			<p class="max-w-3xl text-sm text-fg">{c.notIn}</p>
			<div><button type="button" class="btn btn-primary" onclick={() => onSquad?.()}>{c.toSquad}</button></div>
		</div>
	{:else}
		<div class="grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line px-4 py-4 sm:px-5">
			<!-- the daily bonus -->
			<div class="casino-bonus grid gap-0.5 rounded-lg px-3 py-2">
				<p class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">{c.bonus.heading}</p>
				<p class="text-[13px] text-fg">
					{days ? c.bonus.line(days, dailyRate(days), daysToNextRate(days), dailyRate(days + daysToNextRate(days))) : c.bonus.none}
				</p>
				{#if days}<p class="text-[11px] text-muted">{c.bonus.total(dailyTotal(days))}</p>{/if}
			</div>

			<!-- the house: everything the others lose goes to Abscar (squad-casino.ts HOUSE_OP) -->
			<div class="casino-house grid gap-0.5 rounded-lg px-3 py-2">
				<p class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">🏦 {c.house.heading}</p>
				<p class="text-[13px] text-fg">
					{#if !houseEntry}{c.house.none}{:else if houseEntry.mine}{c.house.mine(houseTake)}{:else}{c.house.line(houseEntry.member.name, houseTake)}{/if}
				</p>
			</div>

			<!-- which game -->
			<div class="flex flex-wrap gap-1.5" role="group" aria-label={c.gamesLabel}>
				{#each GAMES as g (g)}
					<button type="button" class="chip casino-game" aria-pressed={game === g} onclick={() => pick(g)}>{c.games[g]}</button>
				{/each}
			</div>

			{#key game}
				{#if game === 'slots'}
					<CasinoSlots {balance} bind:hidden bind:pending />
				{:else if game === 'roulette'}
					<CasinoRoulette {balance} bind:hidden bind:pending />
				{:else}
					<CasinoBlackjack {balance} bind:hidden />
				{/if}
			{/key}

			<!-- who's up, who's down -->
			<section aria-labelledby="casino-board-h">
				<h3 id="casino-board-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{c.board.heading}</h3>
				{#if !board.length}
					<p class="mt-1 text-sm text-muted">{c.board.none}</p>
				{:else}
					<ol class="mt-2 grid gap-1.5">
						{#each board as row, i (row.e.id)}
							<li class="casino-row flex min-w-0 items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5" class:mine={row.e.mine}>
								<span class="num w-6 flex-none font-head text-[13px] font-bold text-accent">#{i + 1}</span>
								<SquadAvatar name={row.e.member.name} op={row.e.member.op} size={30} />
								<b class="min-w-0 flex-1 truncate font-head text-[14px]">{row.e.member.name}</b>
								<span class="casino-net num font-head" data-dir={row.net > 0 ? 'up' : row.net < 0 ? 'down' : 'flat'}>{c.board.row(signed(row.net), row.games)}</span>
							</li>
						{/each}
					</ol>
				{/if}
			</section>
			<p class="text-xs text-muted">{c.note}</p>
		</div>
	{/if}
</section>

<style>
	.casino-title {
		background: linear-gradient(180deg, #fffbe0, #ffd23a 55%, #ffae00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7)) drop-shadow(0 0 8px rgb(255 190 40 / 0.45));
	}
	.casino-bal {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1.5px #ffc928;
	}
	.casino-bal span {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.casino-bal b {
		font-size: 18px;
		font-weight: 900;
		color: var(--t-fg);
	}
	.casino-bonus {
		border: 1px dashed #ffc928;
		background: rgb(255 201 40 / 0.1);
	}
	.casino-house {
		border: 1px solid rgb(255 201 40 / 0.6);
		background: rgb(255 201 40 / 0.06);
	}
	.casino-row.mine {
		border-color: var(--t-accent);
	}
	.casino-net {
		flex: none;
		font-size: 13px;
		font-weight: 800;
	}
	.casino-net[data-dir='up'] {
		color: var(--t-buff, #3ee06a);
	}
	.casino-net[data-dir='down'] {
		color: var(--t-nerf, #ff5a5a);
	}
</style>
