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
	Abscar's Fortune II (CasinoFortune2, 2026-11-19; Mybots 5 since 2026-11-20) is the second tile, Book Of
	Skedd (CasinoBook, 2026-11-20) the third, Kushburst (CasinoKushburst, 2026-11-20) the fourth, Abscar's Stash (CasinoStash, the tumble slot) the fifth,
	Skeddwood (CasinoSkeddwood, the nudging-wild ways slot) the sixth. Donations
	(BurgiGives, CasinoDonate, 2026-11-20) sits next to BurgiBank: the games are big tiles,
	BurgiBank, Donations and (Abscar only) Admin a row of smaller tiles under them.
	The casino floor (2026-11-20, the user: "snygga till hela 'Burgicasino' fliken, mycket dopamin och kul
	grejer på skärmen"): the box is a dark casino in every theme (carpet, drifting lights and props,
	CasinoFloorFx), a marquee sign with chasing bulbs and the counting balance pill (CasinoSign,
	CasinoBalance: coins spill out when it grows, confetti for a big jump, CasinoConfetti), a jackpot
	ticker of the squad's wins (CasinoTicker), a gift box + day meter on the daily bonus, tiles that shine,
	lift and wear a HOT badge (the game with most wins today, casinoFloor.ts), and a podium for the
	leaderboard (CasinoPodium).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { bonus420, daysToNextRate, dailyRate, dailyTotal, DAILY } from '#lib/squad-casino.ts';
	import { burgerBank, houseOf } from '#lib/squad-fun.ts';
	import { casinoSince, houseSince } from '#lib/casino-zero.ts';
	import { bonusMeter, floorNews, hotGame } from '#lib/casinoFloor.ts';
	import CasinoSign from './CasinoSign.svelte';
	import CasinoTicker from './CasinoTicker.svelte';
	import CasinoPodium from './CasinoPodium.svelte';
	import CasinoGift from './CasinoGift.svelte';
	import CasinoFloorFx from './CasinoFloorFx.svelte';
	import CasinoConfetti from './CasinoConfetti.svelte';
	import FloorArt from './FloorArt.svelte';
	import CasinoBlackjack from './CasinoBlackjack.svelte';
	import CasinoRoulette from './CasinoRoulette.svelte';
	import CasinoSlots from './CasinoSlots.svelte';
	import CasinoFortune2 from './CasinoFortune2.svelte';
	import CasinoBook from './CasinoBook.svelte';
	import CasinoKushburst from './CasinoKushburst.svelte';
	import CasinoStash from './CasinoStash.svelte';
	import CasinoSkeddwood from './CasinoSkeddwood.svelte';
	import CasinoCases from './cases/CasinoCases.svelte';
	import CasesTileArt from './cases/CasesTileArt.svelte';
	import CasinoTabArt, { type CasinoTab } from './CasinoTabArt.svelte';
	import MybotsLogo from './MybotsLogo.svelte';
	import FortuneLogo from './FortuneLogo.svelte';
	import BookLogo from './BookLogo.svelte';
	import KushLogo from './KushLogo.svelte';
	import StashLogo from './StashLogo.svelte';
	import SkeddwoodLogo from './SkeddwoodLogo.svelte';
	import CasinoRig from './CasinoRig.svelte';
	import CasinoKarmaLuck from './CasinoKarmaLuck.svelte';
	import { karmaCounts } from '#lib/casino-rig.ts';
	import CasinoLoans from './CasinoLoans.svelte';
	import CasinoDonate from './CasinoDonate.svelte';
	import { bjTable } from '#lib/bjTable.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import CasinoLobby from './hangout/CasinoLobby.svelte';
	import CasinoHideouts from './hangout/CasinoHideouts.svelte';
	import HideoutTileArt from './hangout/HideoutTileArt.svelte';

	let { onSquad }: { onSquad?: () => void } = $props();
	/** The blackjack table's "n at the table" on its button (read now and then while this is on screen). */
	let casinoEl = $state<HTMLElement>();
	$effect(() => (casinoEl && squad.on ? bjTable.lobby(casinoEl) : undefined));
	const atTable = $derived(squad.on && bjTable.online ? bjTable.seated.filter((s) => s.id !== squad.me?.id).length : 0);
	const c = t.casino;
	type Game = Exclude<CasinoTab, 'shop'> | 'hideout';
	const ALL_GAMES: Game[] = ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'skeddwood', 'cases', 'roulette', 'blackjack', 'bank', 'donate', 'hideout', 'admin'];
	/** Not games: a row of smaller tiles of their own under the game tiles. */
	const UTIL: Game[] = ['bank', 'donate', 'hideout', 'admin'];
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
	const houseTake = $derived(houseId && squad.doc ? houseSince(houseId, burgerBank(squad.doc, members, squad.now)[houseId]?.house ?? 0, squad.doc.zero) : 0);
	/** The tiles: Admin (Abscar's control room, CasinoRig) only for the member who is the house. */
	const GAMES = $derived(houseEntry?.mine ? ALL_GAMES : ALL_GAMES.filter((g) => g !== 'admin'));
	const PLAY = $derived(GAMES.filter((g) => !UTIL.includes(g)));
	const UTILS = $derived(GAMES.filter((g) => UTIL.includes(g)));
	/** Game tiles a row from 560 px: all of them up to five, else half (rounded up) until 900 px, then all. */
	const colsMd = $derived(PLAY.length <= 5 ? PLAY.length : Math.ceil(PLAY.length / 2));
	/** Phones: three game tiles a row (a 6-column grid), the last row's tiles share their row. */
	const spanOf = (i: number, n: number) => {
		const last = n % 3 || 3;
		return i >= n - last ? 6 / last : 2;
	};
	const game = $derived.by((): Game => {
		const want = picked ?? savedGame;
		return want && (GAMES as string[]).includes(want) ? (want as Game) : 'slots';
	});

	const board = $derived(
		squad.entries
			.map((e) => {
				const tally = casinoSince(e.id, e.member.casino, squad.doc?.zero);
				return { e, ...tally, net: e.mine ? tally.net - pending : tally.net };
			})
			.filter((x) => x.games > 0)
			.sort((a, b) => b.net - a.net || a.e.member.name.localeCompare(b.e.member.name))
	);

	/** The casino floor: the HOT tile (most wins on the radio today; Mybots 5 until someone wins), the
	 *  daily-bonus meter, and confetti when your burgers jump (CasinoBalance → CasinoConfetti). */
	const f = c.floor;
	const hotWon = $derived(squad.on ? hotGame(floorNews(squad.radio?.msgs, squad.now).recent, squad.now) : null);
	const hot = $derived(hotWon ?? 'fortune2');
	const meter = $derived(bonusMeter(days, DAILY.every, daysToNextRate(days)));
	let confetti = $state<CasinoConfetti>();

	/** The casino lobby (hangout.ts): who's here, what they play; a hideout you're visiting. */
	$effect(() => (squad.on ? hangout.watch() : undefined));
	$effect(() => {
		if (squad.on && game !== 'hideout') hangout.at(game);
	});
	let visitHo = $state<string | null>(null);
	function visit(id: string) {
		visitHo = id;
		pick('hideout');
	}
</script>

<section bind:this={casinoEl} class="class-card meta-list casino overflow-hidden rounded-card bg-panel shadow-card" style:--c="#ffc928" aria-labelledby="casino-h">
	<CasinoFloorFx neon={squad.on && ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'skeddwood', 'cases', 'roulette', 'blackjack'].includes(game)} />
	<CasinoSign on={squad.on} value={shown} snapKey={game} onbig={() => confetti?.fire()} />
	<CasinoConfetti bind:this={confetti} />

	{#if !squad.on}
		<div class="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
			<p class="max-w-3xl text-sm text-fg">{c.notIn}</p>
			<div><button type="button" class="btn btn-primary" onclick={() => onSquad?.()}>{c.toSquad}</button></div>
		</div>
	{:else}
		<div class="grid grid-cols-[minmax(0,1fr)] gap-4 border-t border-line px-4 py-4 sm:px-5">
			<!-- the squad's big wins on an LED board -->
			<CasinoTicker />

			<!-- the daily bonus -->
			<div class="casino-bonus grid gap-0.5 rounded-lg px-3 py-2">
				<CasinoGift size={58} />
				<p class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">{c.bonus.heading}</p>
				<p class="text-[13px] text-fg">
					{days ? c.bonus.line(days, dailyRate(days), daysToNextRate(days), dailyRate(days + daysToNextRate(days))) : c.bonus.none}
				</p>
				{#if days}<p class="text-[11px] text-muted">{c.bonus.total(dailyTotal(days) + bonus420(squad.online))}</p>{/if}

				{#if days}
					<!-- where today is in the current block of days: one burger coin per day -->
					<div class="bonus-meter" aria-hidden="true">
						{#each Array.from({ length: DAILY.every }, (_, i) => i) as i (i)}<span class="bm-coin" class:on={i < meter} class:today={i === meter - 1}><FloorArt kind="coin" size={22} /></span>{/each}
						<span class="bm-text font-head">{f.meter(meter, DAILY.every)} · {f.meterNext(dailyRate(days + daysToNextRate(days)))}</span>
					</div>
				{/if}
			</div>

			<!-- which game: big picture tiles -->
			{#snippet tile(g: Game, span: number)}
				<button type="button" class="casino-game" class:util={!span} data-game={g} aria-pressed={game === g} style:--span={span || undefined} onclick={() => pick(g)}>
					<span class="tile-fx" aria-hidden="true"></span>
					{#if g === hot}<span class="casino-hot font-head" title={hotWon ? f.hotLabel : f.hotParty}><span aria-hidden="true">🔥</span> {f.hot}</span>{/if}
					{#if g === 'fortune2'}<MybotsLogo tile />{:else if g === 'slots'}<FortuneLogo tile live={game === g} />{:else if g === 'book'}<BookLogo tile live={game === g} />{:else if g === 'kushburst'}<KushLogo tile live={game === g} />{:else if g === 'stash'}<StashLogo tile live={game === g} />{:else if g === 'skeddwood'}<SkeddwoodLogo tile live={game === g} />{:else if g === 'cases'}<CasesTileArt live={game === g} />{:else if g === 'hideout'}<HideoutTileArt />{:else}<CasinoTabArt kind={g} />{/if}
					<span class="casino-game-name font-head">{c.games[g]}</span>
					{#if g === 'blackjack' && atTable}<span class="casino-live num" title={c.blackjack.atTable(atTable)}
							><span aria-hidden="true">{atTable}</span><span class="sr-only"> ({c.blackjack.atTable(atTable)})</span></span
						>{:else if g === 'blackjack' && squad.on && !bjTable.online}<span class="casino-live off font-head" title={c.blackjack.online.tileOff}
							><span aria-hidden="true">{c.blackjack.online.off}</span><span class="sr-only"> ({c.blackjack.online.tileOff})</span></span
						>{/if}
				</button>
			{/snippet}
			<div class="casino-pick" style:--n={PLAY.length} style:--n-md={colsMd} style:--u={UTILS.length} role="group" aria-label={c.gamesLabel}>
				<div class="casino-tabs">
					{#each PLAY as g, i (g)}{@render tile(g, spanOf(i, PLAY.length))}{/each}
				</div>
				<div class="casino-utils">
					{#each UTILS as g (g)}{@render tile(g, 0)}{/each}
				</div>
			</div>

			<!-- who else is in the casino right now, and what they play -->
			<CasinoLobby games={{ ...c.games, hideout: c.games.hideout, lobby: t.hang.inLobby }} onVisit={visit} />

			<!-- karma luck: hearts from giving burgers away make the slot machines kinder (casino-rig.ts) -->
			{#if karmaCounts(game) || game === 'donate'}
				<CasinoKarmaLuck onGive={game === 'donate' ? undefined : () => pick('donate')} />
			{/if}

			{#key game}
				{#if game === 'slots'}
					<CasinoSlots {balance} bind:hidden bind:pending />
				{:else if game === 'fortune2'}
					<CasinoFortune2 {balance} bind:hidden bind:pending />
				{:else if game === 'book'}
					<CasinoBook {balance} bind:hidden bind:pending />
				{:else if game === 'kushburst'}
					<CasinoKushburst {balance} bind:hidden bind:pending />
				{:else if game === 'stash'}
					<CasinoStash {balance} bind:hidden bind:pending />
				{:else if game === 'skeddwood'}
					<CasinoSkeddwood {balance} bind:hidden bind:pending />
				{:else if game === 'cases'}
					<CasinoCases {balance} bind:hidden bind:pending />
				{:else if game === 'roulette'}
					<CasinoRoulette {balance} bind:hidden bind:pending />
				{:else if game === 'blackjack'}
					<CasinoBlackjack {balance} bind:hidden />
				{:else if game === 'admin'}
					<CasinoRig />
				{:else if game === 'hideout'}
					<CasinoHideouts bind:visit={visitHo} />
				{:else if game === 'donate'}
					<CasinoDonate balance={shown} />
				{:else}
					<!-- BurgiBank: a big bank, your burgers, loans and the house -->
					<div class="grid gap-3">
						<div class="bank-stage flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card px-4 py-3">
							<span class="bank-tw" aria-hidden="true"><FloorArt kind="sparkle" size={16} tint="#fff6b0" /><FloorArt kind="sparkle" size={11} tint="#ffd23a" /><FloorArt kind="sparkle" size={13} tint="#ffffff" /></span>
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

			<!-- who's up, who's down: a podium -->
			<CasinoPodium rows={board} />
			<p class="text-xs text-muted">{c.note}</p>
		</div>
	{/if}
</section>

<style>
	/* the casino floor: a dark carpet in every theme (the theme's colours re-tuned inside, so text, buttons
	   and fields in the games, loans, donations and the control room stay readable on it), a stacking
	   context of its own so the floor's lights and props (CasinoFloorFx, z-index −1) sit behind everything */
	.casino {
		position: relative;
		isolation: isolate;
	}
	:global([data-theme]) .casino {
		--t-fg: #fff3dc;
		--t-muted: #dcc59c;
		--t-dim: #9a7f58;
		--t-panel: #1e0a1c;
		--t-panel-2: rgb(0 0 0 / 0.32);
		--t-line: rgb(255 201 40 / 0.24);
		--t-accent: #ffc928;
		--t-on-accent: #1d0d00;
		--t-tick: rgb(0 0 0 / 0.45);
		--t-tick-line: rgb(255 220 150 / 0.32);
		--t-track: rgb(255 255 255 / 0.1);
		--t-danger: #ff6b6b;
		--t-buff: #5dff86;
		--t-nerf: #ff6b6b;
		--t-gold-ink: #ffd23a;
		--t-plat-ink: #d6e0ee;
		--t-hb-ink: #c9a2ff;
		--t-div-ink: #5ff0dc;
		--t-new-ink: #ff9a6a;
		color: var(--t-fg);
		background:
			radial-gradient(circle, rgb(255 201 40 / 0.1) 0 1.6px, transparent 2.3px) 0 0 / 34px 34px,
			radial-gradient(circle, rgb(255 92 168 / 0.08) 0 4.5px, transparent 5.2px) 17px 17px / 34px 34px,
			conic-gradient(from 45deg, rgb(255 255 255 / 0.03) 0 25%, transparent 0 50%, rgb(255 255 255 / 0.03) 0 75%, transparent 0) 0 0 / 34px 34px,
			radial-gradient(120% 60% at 50% 0%, #3a0c34, transparent 70%),
			linear-gradient(180deg, #240a24 0%, #180617 45%, #10040e 100%);
	}
	/* the daily bonus: a velvet ticket with the gift box on the left and a coin per day under the text */
	.casino-bonus {
		grid-template-columns: auto minmax(0, 1fr);
		column-gap: 14px;
		align-items: center;
		padding: 10px 14px;
		border: 1.5px solid rgb(255 201 40 / 0.75);
		background:
			radial-gradient(70% 150% at 0% 50%, rgb(255 80 140 / 0.3), transparent 65%),
			linear-gradient(90deg, #3e0b30, #1e0719);
		box-shadow:
			inset 0 0 0 4px rgb(0 0 0 / 0.22),
			0 0 16px rgb(255 110 170 / 0.2);
		color: #fff3dc;
	}
	.casino-bonus > :global(.gift) {
		grid-column: 1;
		grid-row: 1 / span 4;
	}
	.casino-bonus > p,
	.casino-bonus > .bonus-meter {
		grid-column: 2;
	}
	.casino-bonus > p:first-of-type {
		color: #ffd23a;
		text-shadow: 0 0 8px rgb(255 190 40 / 0.5);
	}
	.bonus-meter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 5px;
		margin-top: 4px;
	}
	.bm-coin {
		filter: grayscale(1) brightness(0.45);
		opacity: 0.75;
	}
	.bm-coin.on {
		filter: drop-shadow(0 0 4px rgb(255 200 60 / 0.6));
		opacity: 1;
	}
	.bm-coin.today {
		animation: bm-today 1.8s ease-in-out infinite alternate;
	}
	@keyframes bm-today {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.18) translateY(-2px);
		}
	}
	.bm-text {
		margin-left: 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: #ffd76a;
	}
	.casino-house {
		border: 1px solid rgb(255 201 40 / 0.6);
		background: rgb(255 201 40 / 0.06);
	}
	/* the game tabs: a picture tile each, in its own casino colours (the same in every theme) */
	/* the game tiles: on phones three a row (a 6-column grid; the last row's tiles share it), from 560 px all in
	   one row up to five games, else two rows (--n-md a row) until 900 px, then all (--n) in one row. BurgiBank,
	   Donations and (Abscar only) Admin aren't games: a row of smaller tiles under them (--u), standing up on
	   phones, picture beside the name from 560 px (2026-11-20, when Abscar's Stash made it five games) */
	.casino-pick {
		display: grid;
		gap: 8px;
	}
	.casino-tabs {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 8px;
	}
	.casino-tabs .casino-game {
		grid-column: span var(--span, 2);
	}
	.casino-utils {
		display: grid;
		grid-template-columns: repeat(var(--u), minmax(0, 1fr));
		gap: 8px;
	}
	.casino-tabs :global(svg.ta) {
		width: 56px;
		height: 49px;
	}
	.casino-game.util {
		min-height: 76px;
		padding: 6px 4px;
	}
	.casino-game.util :global(svg.ta) {
		width: 42px;
		height: 37px;
	}
	@media (min-width: 560px) {
		.casino-pick {
			max-width: calc(var(--n-md) * 160px);
		}
		.casino-tabs {
			grid-template-columns: repeat(var(--n-md), minmax(0, 1fr));
		}
		.casino-tabs .casino-game {
			grid-column: auto;
		}
		/* more room per tile here: bigger pictures */
		.casino-tabs :global(svg.ta) {
			width: 80px;
			height: 70px;
		}
		.casino-game.util {
			grid-auto-flow: column;
			justify-content: center;
			align-items: center;
			gap: 10px;
			min-height: 56px;
			padding: 6px 12px;
		}
		.casino-game.util :global(svg.ta) {
			width: 46px;
			height: 40px;
		}
	}
	@media (min-width: 900px) {
		.casino-pick {
			max-width: calc(var(--n) * 160px);
		}
		.casino-tabs {
			grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		}
	}
	/* eight games in one row from 900 px leave tiles a little narrower than the 80 px picture: it shrinks to fit */
	.casino-tabs :global(svg.ta) {
		max-width: 100%;
		height: auto;
	}
	.casino-game[data-game='skeddwood'] {
		--tile: #7a3a12;
		--tile-2: #2a1206;
	}
	.casino-game[data-game='cases'] {
		--tile: #6a4a10;
		--tile-2: #1a1004;
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
	.casino-game[data-game='book'] {
		--tile: #145a2e;
		--tile-2: #04170a;
	}
	/* Kushburst: blacklight violet with a green neon edge */
	.casino-game[data-game='kushburst'] {
		--tile: #2a0a5a;
		--tile-2: #0b021c;
		border-color: rgb(141 255 90 / 0.5);
	}
	.casino-game[data-game='stash'] {
		--tile: #5e4214;
		--tile-2: #1f1405;
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
	/* the online table switched off on this device (CasinoBlackjack's switch): a grey OFF tag instead */
	.casino-live.off {
		background: #4a4a4a;
		box-shadow: 0 0 0 1.5px #9a9a9a;
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	/* ---------- the casino floor's tiles (2026-11-20): a light sweeps across them in turn, the picked one
	   glows on and off, they lift and tilt under the mouse, press in on a tap, and one wears a HOT badge */
	.casino-game {
		isolation: isolate;
	}
	.tile-fx {
		position: absolute;
		inset: 0;
		z-index: 1;
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;
	}
	.tile-fx::before {
		content: '';
		position: absolute;
		top: -20%;
		bottom: -20%;
		left: 0;
		width: 45%;
		background: linear-gradient(100deg, transparent, rgb(255 255 255 / 0.3), transparent);
		transform: translateX(-130%) skewX(-18deg);
		animation: tile-shine 10s ease-in-out infinite;
	}
	.casino-game:nth-child(2) .tile-fx::before {
		animation-delay: -8.6s;
	}
	.casino-game:nth-child(3) .tile-fx::before {
		animation-delay: -7.2s;
	}
	.casino-game:nth-child(4) .tile-fx::before {
		animation-delay: -5.8s;
	}
	.casino-game:nth-child(5) .tile-fx::before {
		animation-delay: -4.4s;
	}
	.casino-game:nth-child(6) .tile-fx::before {
		animation-delay: -3s;
	}
	.casino-game:nth-child(7) .tile-fx::before {
		animation-delay: -1.6s;
	}
	.casino-game:nth-child(8) .tile-fx::before {
		animation-delay: -0.8s;
	}
	@keyframes tile-shine {
		0%,
		84% {
			transform: translateX(-130%) skewX(-18deg);
		}
		100% {
			transform: translateX(330%) skewX(-18deg);
		}
	}
	/* the picked tile: a gold glow that slowly swells and fades round it */
	.casino-game[aria-pressed='true']::before {
		content: '';
		position: absolute;
		inset: -2px;
		z-index: -1;
		border-radius: 16px;
		box-shadow:
			0 0 24px 5px rgb(255 200 60 / 0.6),
			0 0 46px 8px rgb(255 80 170 / 0.28);
		opacity: 0.35;
		animation: tile-glow 2.4s ease-in-out infinite alternate;
		pointer-events: none;
	}
	@keyframes tile-glow {
		from {
			opacity: 0.35;
		}
		to {
			opacity: 1;
		}
	}
	.casino-game[aria-pressed='true'] .casino-game-name {
		text-shadow:
			0 0 8px rgb(255 200 60 / 0.7),
			0 1px 1px rgb(0 0 0 / 0.8);
	}
	@media (hover: hover) {
		.casino-game:hover {
			border-color: #ffd23a;
			transform: translateY(-4px) rotate(-1.5deg) scale(1.04);
			box-shadow:
				inset 0 1px 0 rgb(255 255 255 / 0.25),
				0 0 18px rgb(255 200 60 / 0.4),
				0 10px 18px rgb(0 0 0 / 0.45);
		}
		.casino-game:nth-child(even):hover {
			transform: translateY(-4px) rotate(1.5deg) scale(1.04);
		}
		.casino-game:hover :global(svg.ta),
		.casino-game:hover :global(.lg-wrap.tile),
		.casino-game:hover :global(.mb-wrap.tile) {
			transform: scale(1.08);
		}
	}
	.casino-game :global(svg.ta),
	.casino-game :global(.lg-wrap.tile),
	.casino-game :global(.mb-wrap.tile) {
		transition: transform 0.2s ease;
	}
	.casino-game:active {
		transform: translateY(0) scale(0.96);
	}
	.casino-hot {
		position: absolute;
		top: -8px;
		left: -5px;
		z-index: 2;
		padding: 2px 8px 2px 6px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ff8a2e, #e0142c);
		color: #fff;
		font-size: 10px;
		font-weight: 900;
		line-height: 1.5;
		letter-spacing: 0.1em;
		white-space: nowrap;
		box-shadow:
			0 0 0 1.5px #ffd23a,
			0 0 10px rgb(255 90 40 / 0.7),
			0 2px 4px rgb(0 0 0 / 0.5);
		animation: hot-wobble 1.8s ease-in-out infinite alternate;
	}
	@keyframes hot-wobble {
		from {
			transform: rotate(-12deg) scale(1);
		}
		to {
			transform: rotate(-6deg) scale(1.08);
		}
	}
	.casino-live {
		z-index: 2;
	}
	/* BurgiBank's stage: a light sweeps over the bank now and then, twinkles round its roof */
	.bank-stage {
		position: relative;
		overflow: hidden;
	}
	.bank-stage::after {
		content: '';
		position: absolute;
		top: -30%;
		bottom: -30%;
		left: 0;
		width: 30%;
		background: linear-gradient(100deg, transparent, rgb(255 236 170 / 0.22), transparent);
		transform: translateX(-140%) skewX(-18deg);
		animation: bank-shine 8s ease-in-out infinite;
		pointer-events: none;
	}
	@keyframes bank-shine {
		0%,
		70% {
			transform: translateX(-140%) skewX(-18deg);
		}
		100% {
			transform: translateX(440%) skewX(-18deg);
		}
	}
	.bank-tw {
		position: absolute;
		left: 16px;
		top: 8px;
		width: 140px;
		height: 120px;
		pointer-events: none;
	}
	.bank-tw :global(svg) {
		position: absolute;
		animation: bank-tw 2.6s ease-in-out infinite;
	}
	.bank-tw :global(svg:nth-child(1)) {
		left: 6px;
		top: 4px;
	}
	.bank-tw :global(svg:nth-child(2)) {
		right: 4px;
		top: 18px;
		animation-delay: -0.9s;
	}
	.bank-tw :global(svg:nth-child(3)) {
		right: 18px;
		bottom: 6px;
		animation-delay: -1.7s;
	}
	@keyframes bank-tw {
		0%,
		100% {
			opacity: 0.1;
			transform: scale(0.5) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1) rotate(45deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tile-fx::before,
		.casino-game[aria-pressed='true']::before,
		.casino-hot,
		.bm-coin.today,
		.bank-stage::after,
		.bank-tw :global(svg) {
			animation: none;
		}
		.casino-game:hover,
		.casino-game:nth-child(even):hover,
		.casino-game:active,
		.casino-game:hover :global(svg.ta),
		.casino-game:hover :global(.lg-wrap.tile),
		.casino-game:hover :global(.mb-wrap.tile) {
			transform: none;
		}
	}
</style>
