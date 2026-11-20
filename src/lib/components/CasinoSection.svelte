<!--
	BurgiCasino, the fifth page tab (2026-11-16, the user's ask: "a roulette and a blackjack mode, a
	whole new tab called 'BurgiCasino'", then "a one-armed bandit in burger theme", "'Abscar's fortune'
	on it, the arm a big smoking holk"). Plays with the squad's burger bank (squad-fun.ts): your balance,
	the daily bonus (squad-casino.ts: 2,500 a day, +2,500 every 5 days online), a switch between Abscar's
	Fortune (CasinoSlots), roulette and blackjack, and a leaderboard of what everyone won or lost.
	Pretend burgers, never money. Outside a squad it points to the Squad tab.
	The game tabs are big picture tiles (2026-11-16, the user's ask: "tidy up the tabs, e.g. BurgiBank can
	have a big bank, so everything shows what it is beyond text"; CasinoTabArt.svelte), and BurgiBank is a
	tab of its own: loans, the house and (Abscar only) the admin menu, under a big bank. BurgiShop moved
	out to a page tab of its own the same evening (ShopPage.svelte; the user: "BurgiShop can have a tab of
	its own instead of being among the casino games"); a saved 'shop' pick opens the slot machine.
	Abscar's Fortune II (CasinoFortune2, 2026-11-19) is the second tile. Donations (BurgiGives,
	CasinoDonate, 2026-11-20) sits next to BurgiBank: six tiles for everyone, seven for Abscar (Admin).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { bonus420, casinoTotal, daysToNextRate, dailyRate, dailyTotal } from '#lib/squad-casino.ts';
	import { burgerBank, houseOf } from '#lib/squad-fun.ts';
	import CasinoBlackjack from './CasinoBlackjack.svelte';
	import CasinoRoulette from './CasinoRoulette.svelte';
	import CasinoSlots from './CasinoSlots.svelte';
	import CasinoFortune2 from './CasinoFortune2.svelte';
	import CasinoTabArt, { type CasinoTab } from './CasinoTabArt.svelte';
	import CasinoRig from './CasinoRig.svelte';
	import CasinoLoans from './CasinoLoans.svelte';
	import CasinoDonate from './CasinoDonate.svelte';
	import SquadAvatar from './SquadAvatar.svelte';
	import { bjTable } from '#lib/bjTable.svelte.ts';

	let { onSquad }: { onSquad?: () => void } = $props();
	/** The blackjack table's "n at the table" on its button (read now and then while this is on screen). */
	let casinoEl = $state<HTMLElement>();
	$effect(() => (casinoEl && squad.on ? bjTable.lobby(casinoEl) : undefined));
	const atTable = $derived(squad.on ? bjTable.seated.filter((s) => s.id !== squad.me?.id).length : 0);
	const c = t.casino;
	type Game = Exclude<CasinoTab, 'shop'>;
	const ALL_GAMES: Game[] = ['slots', 'fortune2', 'roulette', 'blackjack', 'bank', 'donate', 'admin'];
	const GAME_KEY = 'mw4-camo-grind:casino-game';

	let savedGame = $state<string | null>(null);
	let picked = $state<Game | null>(null);
	$effect(() => {
		try {
			savedGame = localStorage.getItem(GAME_KEY);
		} catch {
			// storage blocked: start on the slot machine
		}
	});
	function pick(g: Game) {
		picked = g;
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
	const houseTake = $derived(houseId && squad.doc ? (burgerBank(squad.doc, members, squad.now)[houseId]?.house ?? 0) : 0);
	/** The tiles: Admin (Abscar's control room, CasinoRig) only for the member who is the house. */
	const GAMES = $derived(houseEntry?.mine ? ALL_GAMES : ALL_GAMES.filter((g) => g !== 'admin'));
	const game = $derived.by((): Game => {
		const want = picked ?? savedGame;
		return want && (GAMES as string[]).includes(want) ? (want as Game) : 'slots';
	});

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

<section bind:this={casinoEl} class="class-card meta-list casino overflow-hidden rounded-card bg-panel shadow-card" style:--c="#ffc928" aria-labelledby="casino-h">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<!-- at least 13rem, so on a phone the burgers pill goes to its own line instead of squeezing the names -->
		<div class="flex min-w-[13rem] flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
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
				{#if days}<p class="text-[11px] text-muted">{c.bonus.total(dailyTotal(days) + bonus420(squad.online))}</p>{/if}
			</div>

			<!-- which game: big picture tiles -->
			<div class="casino-tabs" class:seven={GAMES.length > 6} role="group" aria-label={c.gamesLabel}>
				{#each GAMES as g (g)}
					<button type="button" class="casino-game" data-game={g} aria-pressed={game === g} onclick={() => pick(g)}>
						<CasinoTabArt kind={g} />
						<span class="casino-game-name font-head">{c.games[g]}</span>
						{#if g === 'blackjack' && atTable}<span class="casino-live num" title={c.blackjack.atTable(atTable)}
								><span aria-hidden="true">{atTable}</span><span class="sr-only"> ({c.blackjack.atTable(atTable)})</span></span
							>{/if}
					</button>
				{/each}
			</div>

			{#key game}
				{#if game === 'slots'}
					<CasinoSlots {balance} bind:hidden bind:pending />
				{:else if game === 'fortune2'}
					<CasinoFortune2 {balance} bind:hidden bind:pending />
				{:else if game === 'roulette'}
					<CasinoRoulette {balance} bind:hidden bind:pending />
				{:else if game === 'blackjack'}
					<CasinoBlackjack {balance} bind:hidden />
				{:else if game === 'admin'}
					<CasinoRig />
				{:else if game === 'donate'}
					<CasinoDonate balance={shown} />
				{:else}
					<!-- BurgiBank: a big bank, your burgers, loans and the house -->
					<div class="grid gap-3">
						<div class="bank-stage flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card px-4 py-3">
							<CasinoTabArt kind="bank" size={132} />
							<div class="min-w-0">
								<p class="bank-title font-head">{c.games.bank}</p>
								<p class="text-[13px] text-fg">{c.bank.line}</p>
								<p class="mt-1 font-head text-[15px] font-bold">{c.bank.balance(shown)}</p>
							</div>
						</div>
						<CasinoLoans />
						<!-- the house: everything the others lose goes to Abscar (squad-casino.ts HOUSE_OP) -->
						<div class="casino-house grid gap-0.5 rounded-lg px-3 py-2">
							<p class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">🏦 {c.house.heading}</p>
							<p class="text-[13px] text-fg">
								{#if !houseEntry}{c.house.none}{:else if houseEntry.mine}{c.house.mine(houseTake)}{:else}{c.house.line(houseEntry.member.name, houseTake)}{/if}
							</p>
						</div>
					</div>
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
	/* the gradient paints the letters with their background; the Abscar theme's heading shadow would be drawn
	   on top of it and turn them dark, so it's switched off here (the drop-shadow filters give the edge) */
	.casino-title {
		text-shadow: none !important;
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
	/* the game tabs: a picture tile each, in its own casino colours (the same in every theme) */
	/* six tiles (Donations came 2026-11-20): three a row until there's room for all six in one row. Abscar
	   sees a seventh, Admin: under 900 px it's a slim strip under the two rows, from 900 px all seven in a row */
	.casino-tabs {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
	.casino-tabs :global(svg.ta) {
		width: 56px;
		height: 49px;
	}
	@media (min-width: 560px) {
		.casino-tabs {
			max-width: 560px;
		}
		/* more room per tile here: bigger pictures */
		.casino-tabs :global(svg.ta) {
			width: 80px;
			height: 70px;
		}
	}
	@media (min-width: 820px) {
		.casino-tabs:not(.seven) {
			grid-template-columns: repeat(6, minmax(0, 1fr));
			max-width: 920px;
		}
	}
	@media (max-width: 899px) {
		.casino-tabs.seven .casino-game[data-game='admin'] {
			grid-column: 1 / -1;
			grid-auto-flow: column;
			justify-content: center;
			align-items: center;
			gap: 10px;
			min-height: 56px;
			padding: 6px 12px;
		}
		.casino-tabs.seven .casino-game[data-game='admin'] :global(svg.ta) {
			width: 46px;
			height: 40px;
		}
	}
	@media (min-width: 900px) {
		.casino-tabs.seven {
			grid-template-columns: repeat(7, minmax(0, 1fr));
			max-width: 1040px;
		}
	}
	.casino-game[data-game='admin'] {
		--tile: #4a1218;
		--tile-2: #160608;
		border-color: rgb(255 90 90 / 0.55);
	}
	.casino-game {
		--tile: #5a0a10;
		--tile-2: #250306;
		position: relative;
		display: grid;
		justify-items: center;
		align-content: center;
		gap: 4px;
		min-height: 104px;
		padding: 10px 6px 8px;
		border: 1.5px solid rgb(255 201 40 / 0.35);
		border-radius: 14px;
		background:
			radial-gradient(90% 70% at 50% 30%, rgb(255 255 255 / 0.14), transparent 70%),
			linear-gradient(180deg, var(--tile), var(--tile-2));
		color: #fff6e0;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 2px 6px rgb(0 0 0 / 0.35);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
	}
	.casino-game[data-game='fortune2'] {
		--tile: #4a1a86;
		--tile-2: #14062a;
	}
	.casino-game[data-game='roulette'] {
		--tile: #11683a;
		--tile-2: #052a15;
	}
	.casino-game[data-game='blackjack'] {
		--tile: #0f5a52;
		--tile-2: #04241f;
	}
	.casino-game[data-game='shop'] {
		--tile: #5a2290;
		--tile-2: #220a3c;
	}
	.casino-game[data-game='bank'] {
		--tile: #1f3a6e;
		--tile-2: #0a1530;
	}
	.casino-game[data-game='donate'] {
		--tile: #8a1f4e;
		--tile-2: #34081c;
	}
	.casino-game:hover {
		border-color: rgb(255 201 40 / 0.7);
		transform: translateY(-1px);
	}
	.casino-game[aria-pressed='true'] {
		border: 2.5px solid #ffc928;
		transform: translateY(-2px);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.25),
			0 0 0 2px rgb(255 201 40 / 0.25),
			0 0 18px rgb(255 190 40 / 0.55),
			0 4px 10px rgb(0 0 0 / 0.4);
	}
	.casino-game-name {
		font-size: 13px;
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: 0.02em;
		text-align: center;
		text-wrap: balance;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.7);
	}
	.casino-game[aria-pressed='true'] .casino-game-name {
		color: #ffd23a;
	}
	/* BurgiBank's head: the big bank on night blue, gold edge */
	.bank-stage {
		background:
			radial-gradient(70% 120% at 15% 50%, rgb(255 201 40 / 0.18), transparent 60%),
			linear-gradient(180deg, rgb(20 40 90 / 0.65), rgb(8 16 40 / 0.55));
		box-shadow: inset 0 0 0 1.5px rgb(255 201 40 / 0.55);
		color: #fff6e0;
	}
	.bank-stage .text-fg {
		color: #f1e6cc;
	}
	.bank-title {
		text-shadow: none !important;
		font-size: 24px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fffbe0, #ffd23a 55%, #ffae00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
	}
	@media (prefers-reduced-motion: reduce) {
		.casino-game {
			transition: none;
		}
		.casino-game:hover,
		.casino-game[aria-pressed='true'] {
			transform: none;
		}
	}
	/* people at the blackjack table: a green "live" count in the corner of its tile */
	.casino-live {
		position: absolute;
		top: 6px;
		right: 6px;
		display: inline-grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 6px;
		border-radius: 999px;
		background: #1f9a45;
		box-shadow: 0 0 0 1.5px #7dff6a, 0 0 8px rgb(125 255 106 / 0.6);
		color: #fff;
		font-size: 12px;
		font-weight: 900;
		line-height: 1;
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
