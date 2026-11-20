<!--
	Book Of Skedd (book.ts; 2026-11-20, the user's ask: "gör en till slot. den ska likna 'Book Of Dead' men
	heta 'Book Of Skedd', ett majablad på boken, bonusen ska fungera likadant, även att man kan gambla sin
	vinst"). A classic book slot in a green-and-gold grimoire cabinet:
	 - 5 reels on parchment, 1–10 lines (LINES stepper), the bet per line (BET stepper shows the whole bet).
	 - 3+ books: the free-spins screen opens the book over the reels, its page flips through the symbols and
	   stops on the special symbol; the marquee counts the free spins; when the special symbol is on enough
	   reels it spreads over each whole reel (a gold-framed column) and pays every played line.
	 - Gamble after a win (not in auto spin): a face-down card flashing red / black, guess the colour (×2) or
	   the suit (×4), up to 5 in a row, Collect any time; the last 5 cards are shown like the real thing.
	The spin with its free spins is worked out and booked at once (squad.recordGame), then shown; `hidden` =
	burgers won but not shown yet (and, while the gamble is open, what's at stake there), so the balance
	above never gives a result away. Each gamble is booked the moment it's guessed (as part of the same
	game). Abscar's control room (casino-rig.ts) can pick the next result and sets luck, which also
	steers the gamble's card.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import {
		bookMatches,
		bookTier,
		canGamble,
		drawCard,
		evaluateBook,
		gamble,
		guessPays,
		guessRight,
		isRed,
		needFor,
		playBook,
		BOOK_FREE,
		BOOK_FREE_STRIPS,
		BOOK_PAYING,
		BOOK_PAYS,
		BOOK_SCATTER,
		BOOK_STRIPS,
		BOOK_SYMBOLS,
		BOOK_TRIES,
		GAMBLE_LIMIT,
		GAMBLE_STEPS,
		LINE_BETS,
		LINES,
		MAX_LINES,
		MAX_WIN,
		REELS,
		ROWS,
		type BookExpand,
		type BookLineWin,
		type BookPay,
		type BookPlay,
		type BookSpin,
		type BookSymbol,
		type BookTier,
		type GambleGuess
	} from '#lib/book.ts';
	import { drawUntil, lucky } from '#lib/casino-rig.ts';
	import { t } from '#lib/i18n/en.ts';
	import { rankLabel, SUIT_SYMBOL, type Card, type Suit } from '#lib/squad-casino.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import BookLogo from './BookLogo.svelte';
	import BookSymbolView from './BookSymbol.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	// everything held back here is a win not shown yet, or what's at stake in the gamble
	$effect(() => {
		pending = hidden;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const s = t.casino.book;
	const fmt = (n: number) => n.toLocaleString('en-US');

	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	/* ----- bet and lines ----- */
	let lineBet = $state(LINE_BETS[0]);
	let lines = $state(MAX_LINES);
	const bet = $derived(lineBet * lines);
	const shown = $derived(Math.max(0, balance - hidden));
	function stepBet(dir: 1 | -1) {
		const i = LINE_BETS.indexOf(lineBet);
		lineBet = LINE_BETS[Math.max(0, Math.min(LINE_BETS.length - 1, i + dir))];
	}
	const stepLines = (dir: 1 | -1) => (lines = Math.max(1, Math.min(MAX_LINES, lines + dir)));

	/* ----- the screen ----- */
	const START: BookSymbol[][] = [
		['jack', 'book', 'ace'],
		['king', 'abscar', 'ten'],
		['queen', 'book', 'bong'],
		['lighter', 'abscar', 'jack'],
		['ace', 'grinder', 'queen']
	];
	let screen = $state<BookSpin>(evaluateBook(START, 1, MAX_LINES));
	let cols = $state(START.map((items) => ({ items, y: 0, dur: 0 })));
	let wins = $state<BookLineWin[]>([]);
	let scatterHit = $state(false);
	let spinning = $state(false);
	let lastWin = $state(0);
	let message = $state('');
	let tier = $state<BookTier>('none');
	let celebrate = $state(false);
	/** Free spins: which one, of how many, the special symbol, burgers so far. */
	let freeState = $state<{ n: number; total: number; won: number; special: BookPay } | null>(null);
	/** The special symbol spread over its reels on the screen shown. */
	let expand = $state<BookExpand | null>(null);
	/** Screens over the reels: the book opening on the special symbol, "+10 more", the total. */
	let banner = $state<{ kind: 'book'; special: BookPay; page: BookSymbol; open: boolean; done: boolean } | { kind: 'more'; spins: number } | { kind: 'outro'; spins: number; won: number } | null>(null);
	let spinBtn = $state<HTMLButtonElement>();

	/** Cells that are part of a win (for the glow): "reel-row". */
	const winCells = $derived.by(() => {
		const set = new Set<string>();
		for (const w of wins) LINES[w.line].slice(0, w.count).forEach((row, r) => set.add(`${r}-${row}`));
		if (scatterHit) screen.grid.forEach((col, r) => col.forEach((sym, row) => sym === 'book' && set.add(`${r}-${row}`)));
		return set;
	});
	const LINE_COLORS = ['#ffd23a', '#ff5ca8', '#5ce1ff', '#7dff6a', '#ff8a1a', '#c98bff', '#ff4b4b', '#4bffd1', '#fff6b0', '#9ab8ff'];

	async function spinReels(result: BookSpin, strips: BookSymbol[][]) {
		expand = null;
		if (!reduce()) {
			cols = cols.map((c, r) => {
				const filler = Array.from({ length: 10 + r * 3 }, () => strips[r][Math.floor(rand() * strips[r].length)]);
				return { items: [...c.items.slice(0, ROWS), ...filler, ...result.grid[r]], y: 0, dur: 0 };
			});
			await tick();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			cols = cols.map((c, r) => ({ ...c, y: c.items.length - ROWS, dur: 600 + r * 220 }));
			await sleep(600 + (REELS - 1) * 220 + 140);
		}
		cols = result.grid.map((items) => ({ items, y: 0, dur: 0 }));
		screen = result;
	}

	function show(result: BookSpin) {
		wins = result.lines;
		scatterHit = result.books >= 3;
		const shownWin = result.win - (result.expand?.win ?? 0);
		hidden = Math.max(0, hidden - shownWin);
		lastWin = shownWin;
		const parts = [
			...result.lines.map((l) => s.lineWin(l.line + 1, l.count, s.symbols[l.symbol], l.win)),
			...(result.scatterWin ? [s.bookWin(result.books, result.scatterWin, result.freeSpins)] : [])
		];
		message = parts.length ? parts.join(' · ') : result.expand ? '' : s.noWin;
		if (result.freeSpins) sound.play('maxed');
		else if (shownWin > 0) sound.play('camo');
	}

	/** The special symbol spreading: the gold columns grow over its reels, then it pays. */
	async function showExpand(result: BookSpin) {
		const e = result.expand;
		if (!e) return;
		await sleep(reduce() ? 150 : 650);
		if (!alive) return;
		expand = e;
		sound.play('maxed');
		await sleep(reduce() ? 300 : 900);
		hidden = Math.max(0, hidden - e.win);
		lastWin += e.win;
		const line = s.expandWin(s.symbols[e.symbol], e.reels.length, e.win);
		message = message ? `${message} · ${line}` : line;
		await sleep(reduce() ? 400 : 1100);
	}

	/* ----- waiting for a tap on a screen (or a timeout); everything waiting lets go when the machine goes ----- */
	let tapGo: (() => void) | null = null;
	function waitTap(ms: number): Promise<void> {
		return new Promise((res) => {
			const done = () => {
				clearTimeout(timer);
				if (tapGo === done) tapGo = null;
				res();
			};
			const timer = setTimeout(done, ms);
			tapGo = done;
		});
	}

	/** The book opens and its page flips through the symbols until it stops on the special one. */
	async function openBook(special: BookPay) {
		banner = { kind: 'book', special, page: 'book', open: false, done: false };
		sound.play('maxed');
		await sleep(reduce() ? 100 : 500);
		const b = banner;
		if (b?.kind !== 'book') return;
		b.open = true;
		if (!reduce()) {
			// the pages flip: fast, then slower, then the special symbol
			let delay = 70;
			for (let i = 0; i < 18 && alive; i++) {
				b.page = BOOK_PAYING[(i * 4 + Math.floor(rand() * 3)) % BOOK_PAYING.length];
				await sleep(delay);
				if (i > 10) delay += 35;
			}
		}
		b.page = special;
		b.done = true;
		sound.play('divergence');
		await waitTap(autoLeft > 0 ? 1600 : reduce() ? 2600 : 4200);
		banner = null;
	}

	async function runFree(p: BookPlay) {
		const special = p.special!;
		let total = Math.min(p.freeStart, p.free.length);
		let won = 0;
		await sleep(reduce() ? 200 : 900);
		await openBook(special);
		for (let i = 0; i < p.free.length && alive; i++) {
			const fs = p.free[i];
			freeState = { n: i + 1, total, won, special };
			wins = [];
			scatterHit = false;
			await spinReels(fs, BOOK_FREE_STRIPS);
			show(fs);
			won += fs.win - (fs.expand?.win ?? 0);
			freeState = { n: i + 1, total, won, special };
			await showExpand(fs);
			won += fs.expand?.win ?? 0;
			const more = Math.min(fs.freeSpins, p.free.length - total);
			if (more > 0) {
				total += more;
				banner = { kind: 'more', spins: more };
				await sleep(reduce() ? 700 : 1600);
				banner = null;
			}
			freeState = { n: i + 1, total, won, special };
			await sleep(reduce() ? 250 : 700);
		}
		freeState = null;
		expand = null;
		// a capped play (MAX_WIN) pays less than the spins added up
		won = Math.min(won, Math.max(0, p.win - p.base.win));
		banner = { kind: 'outro', spins: p.free.length, won };
		lastWin = p.win;
		await waitTap(autoLeft > 0 ? 1800 : reduce() ? 1500 : 3200);
		banner = null;
	}

	/** Book a paid spin at once, then show it all. */
	async function run(p: BookPlay) {
		squad.recordGame(p.net);
		hidden = p.win;
		spinning = true;
		offer = null;
		wins = [];
		scatterHit = false;
		tier = 'none';
		celebrate = false;
		lastWin = 0;
		expand = null;
		message = s.spinning;
		await spinReels(p.base, BOOK_STRIPS);
		show(p.base);
		if (p.free.length) await runFree(p);
		if (!alive) return;
		if (p.free.length || p.capped) {
			lastWin = p.win;
			message = `${s.lastWin}: ${fmt(p.win)} 🍔${p.capped ? ` · ${s.maxWin(MAX_WIN)}` : ''}`;
		}
		hidden = 0;
		tier = bookTier(p);
		if (tier === 'big' || tier === 'mega' || tier === 'epic') {
			celebrate = true;
			sound.play(tier === 'epic' ? 'divergence' : 'maxed');
			setTimeout(() => (celebrate = false), reduce() ? 2200 : 3400);
			squad.casinoNews(t.casino.event.book(p.win, tier));
		}
		spinning = false;
		// the gamble is offered after a win (auto spin collects by itself)
		if (p.win > 0 && autoLeft === 0 && canGamble(p.win, p.bet, 'red', 0)) offer = { amount: p.win, bet: p.bet, start: p.win };
	}

	async function spin() {
		if (spinning || gambleOpen) return;
		offer = null;
		if (bet > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		const lb = lineBet;
		const ln = lines;
		// Abscar's control room (casino-rig.ts): a result he picked for this spin, or your luck
		const forced = squad.takeForced('book');
		const p = forced
			? drawUntil(
					() => playBook(lb, ln, rand, forced.what === 'abscar' ? { special: 'abscar' } : {}),
					(x) => bookMatches(x, forced.what),
					BOOK_TRIES
				)
			: lucky(squad.luck('book'), rand, () => playBook(lb, ln, rand), (x) => x.net);
		await run(p);
	}

	/* ----- the gamble ----- */
	/** A win that may be gambled (until the next spin). `start` = the win it started from. */
	let offer = $state<{ amount: number; bet: number; start: number } | null>(null);
	let gambleOpen = $state(false);
	let done = $state(0);
	/** The card being turned (null = face down), and how the last guess went. */
	let card = $state<Card | null>(null);
	let flipping = $state(false);
	let outcome = $state<'right' | 'wrong' | null>(null);
	/** The last cards drawn, newest first (like the real thing shows them). */
	let history = $state<Card[]>([]);
	let gambleEl = $state<HTMLDivElement>();
	const can = (g: GambleGuess) => !!offer && !flipping && outcome !== 'wrong' && canGamble(offer.amount, offer.bet, g, done);

	async function openGamble() {
		if (!offer || spinning) return;
		gambleOpen = true;
		done = 0;
		card = null;
		outcome = null;
		hidden = offer.amount;
		await tick();
		gambleEl?.querySelector<HTMLButtonElement>('.g-colour')?.focus();
	}

	async function guess(g: GambleGuess) {
		const o = offer;
		if (!o || !can(g)) return;
		// your luck (the control room) steers the card the same way it steers a spin
		const c = lucky(squad.luck('book'), rand, () => drawCard(rand), (x) => (guessRight(g, x) ? 1 : 0));
		const r = gamble(o.amount, g, c);
		// booked now, as part of the spin it gambles; the balance holds what's still at stake
		squad.recordGame(r.net, undefined, { sameGame: true });
		hidden = r.amount;
		flipping = true;
		outcome = null;
		card = null;
		await sleep(reduce() ? 120 : 620);
		if (!alive) return;
		card = c;
		flipping = false;
		history = [c, ...history].slice(0, 5);
		done += 1;
		if (r.right) {
			o.amount = r.amount;
			lastWin = r.amount;
			outcome = 'right';
			message = s.gambleRight(r.amount);
			sound.play(guessPays(g) === 4 ? 'maxed' : 'camo');
			// nothing more to guess: collect by itself
			if (!GUESSES.some((x) => canGamble(o.amount, o.bet, x, done))) setTimeout(() => offer === o && gambleOpen && collect(), reduce() ? 900 : 1500);
		} else {
			lastWin = 0;
			outcome = 'wrong';
			message = s.gambleWrong;
			setTimeout(() => offer === o && closeGamble(), reduce() ? 1200 : 1900);
		}
	}

	function collect() {
		const o = offer;
		if (!o) return;
		hidden = 0;
		lastWin = o.amount;
		message = s.collected(o.amount);
		// a win gambled up by a lot goes on the radio
		if (done > 0 && o.amount > o.start && o.amount >= o.bet * 25) squad.casinoNews(t.casino.event.bookGamble(o.amount, done));
		closeGamble();
	}

	function closeGamble() {
		const focusBack = !!gambleEl && gambleEl.contains(document.activeElement);
		gambleOpen = false;
		offer = null;
		card = null;
		outcome = null;
		hidden = 0;
		if (focusBack) void tick().then(() => spinBtn?.focus());
	}
	const GUESSES: GambleGuess[] = ['red', 'black', 'H', 'D', 'C', 'S'];
	const SUITS: Suit[] = ['H', 'D', 'C', 'S'];
	const cardText = (c: Card) => s.cardIs(rankLabel(c.r), s.suits[c.s]);

	/* ----- auto spin ----- */
	const AUTO_COUNTS = [10, 25, 50, 100];
	let autoCount = $state(25);
	let autoLeft = $state(0);
	let alive = true;
	const stopAuto = (text?: string) => {
		if (autoLeft > 0 && text) toast.show(text, undefined, 4000);
		autoLeft = 0;
	};
	async function runAuto() {
		if (autoLeft > 0) {
			stopAuto();
			return;
		}
		if (gambleOpen) return;
		offer = null;
		autoLeft = autoCount;
		while (alive && autoLeft > 0) {
			if (bet > shown) {
				stopAuto(t.casino.broke);
				break;
			}
			await spin();
			offer = null;
			if (!alive || autoLeft === 0) break;
			autoLeft -= 1;
			await sleep(celebrate ? (reduce() ? 1800 : 3000) : reduce() ? 250 : 600);
		}
		if (alive && autoLeft === 0) message = message || t.casino.slots.autoDone;
		autoLeft = 0;
	}

	$effect(() => {
		const hide = () => document.visibilityState === 'hidden' && stopAuto();
		document.addEventListener('visibilitychange', hide);
		return () => {
			alive = false;
			autoLeft = 0;
			document.removeEventListener('visibilitychange', hide);
			tapGo?.();
		};
	});

	const reelText = (r: number) => s.reelLabel(r + 1, screen.grid[r].map((x) => s.symbols[x]).join(', '));
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.4 + (i % 4) * 0.25 }));
	const rainSym = (i: number): BookSymbol => (i % 4 === 0 ? 'book' : i % 4 === 1 ? 'abscar' : i % 4 === 2 ? 'bong' : 'lighter');
</script>

<div class="book-machine" class:spinning>
	<div class="cabinet">
		<!-- the marquee: the logo (2026-11-20, BookLogo: the book in its glow, the title in carved gold); under it the
		     line, in free spins their counter (the logo stays, so the reels never jump) -->
		<div class="marquee" class:free-on={!!freeState}>
			<div class="logo"><BookLogo label={t.casino.games.book} /></div>
			<div class="lines">
				{#if freeState}
					<p class="title free-title font-head" role="status">{s.freeTitle(freeState.n, freeState.total)}</p>
					<p class="subtitle font-head">
						<span class="sub-sym" aria-hidden="true"><BookSymbolView symbol={freeState.special} size={18} /></span>{s.freeSub(s.symbols[freeState.special], freeState.won)}
					</p>
				{:else}
					<p class="subtitle font-head">{s.sub}</p>
				{/if}
			</div>
		</div>

		<!-- the reels on parchment -->
		<div class="window" role="group" aria-label={t.casino.games.book}>
			<div class="reels">
				{#each cols as col, r (r)}
					<div class="reel" role="img" aria-label={reelText(r)}>
						<div class="strip" style:transform={`translateY(calc(var(--cell) * ${-col.y}))`} style:transition={col.dur ? `transform ${col.dur}ms cubic-bezier(0.18, 0.7, 0.28, 1.06)` : 'none'}>
							{#each col.items as sym, i (i)}
								<div class="cell" class:win={(!spinning || !!freeState) && col.items.length === ROWS && winCells.has(`${r}-${i}`)}>
									<BookSymbolView symbol={sym} size={48} />
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<!-- free spins: the special symbol spread over whole reels -->
			{#if expand}
				<div class="expand-layer" aria-hidden="true">
					{#each expand.reels as reel (reel)}
						<div class="expand-col" style:grid-column={reel + 1} data-reel={reel}>
							<BookSymbolView symbol={expand.symbol} size={96} />
							<BookSymbolView symbol={expand.symbol} size={96} />
							<BookSymbolView symbol={expand.symbol} size={96} />
						</div>
					{/each}
				</div>
			{/if}
			{#if (!spinning || freeState) && wins.length}
				<svg class="paylines" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true">
					{#each wins as w (w.line)}
						<polyline
							points={LINES[w.line].map((row, r) => `${r * 100 + 50},${row * 100 + 50}`).join(' ')}
							fill="none"
							stroke={LINE_COLORS[w.line]}
							stroke-width="7"
							stroke-linejoin="round"
							stroke-linecap="round"
							vector-effect="non-scaling-stroke"
						/>
					{/each}
				</svg>
			{/if}
			{#if banner?.kind === 'more'}
				<p class="fs-more font-head" role="status">{s.freeMore(banner.spins)}</p>
			{:else if banner?.kind === 'book'}
				<!-- the book opens and flips to the special symbol: tap to go on once it's chosen -->
				<button type="button" class="book-screen" data-done={banner.done} onclick={() => banner?.kind === 'book' && banner.done && tapGo?.()}>
					<span class="bs-kicker font-head">{s.freeIntro(BOOK_FREE)}</span>
					<span class="open-book" class:open={banner.open} aria-hidden="true">
						<span class="page left-page">
							<span class="page-leaf"><BookSymbolView symbol="book" size={44} /></span>
							<span class="page-title font-head">{s.special}</span>
						</span>
						<span class="page right-page" class:landed={banner.done}>
							{#key banner.page}<span class="page-sym"><BookSymbolView symbol={banner.page} size={72} /></span>{/key}
						</span>
					</span>
					<span class="bs-sub" role="status">{banner.done ? s.specialPick(s.symbols[banner.special], needFor(banner.special)) : s.bookOpens}</span>
					{#if banner.done}<span class="fs-tap">{s.continue} ▸</span>{/if}
				</button>
			{:else if banner}
				<button type="button" class="fs-screen" onclick={() => tapGo?.()}>
					<span class="fs-kicker font-head">{s.freeOutro}</span>
					<span class="amount font-head num">+{fmt(banner.won)} 🍔</span>
					<span class="bs-sub">{s.freeOutroSub(banner.spins)}</span>
					<span class="fs-tap">{s.continue} ▸</span>
				</button>
			{/if}
			{#if celebrate}
				<div class="celebrate" data-tier={tier} role="status">
					<div class="rain" aria-hidden="true">
						{#each RAIN as drop, i (i)}<span style:left="{drop.x}%" style:animation-delay="{drop.d}s" style:animation-duration="{drop.dur}s"><BookSymbolView symbol={rainSym(i)} size={30} /></span>{/each}
					</div>
					<p class="big font-head">{s.tiers[tier === 'none' ? 'win' : tier]}</p>
					<p class="amount font-head num">+{fmt(lastWin)} 🍔</p>
				</div>
			{/if}
		</div>

		<p class="msg" aria-live="polite">{message}</p>

		<!-- the panel: burgers, bet, lines, win, spin -->
		<div class="panel">
			<div class="led cred"><span>{s.credits}</span><b class="num">{fmt(shown)}</b></div>
			<div class="led bet">
				<div class="ctl">
					<span class="lbl">{t.casino.bet}</span>
					<button type="button" class="stepper minus" aria-label="−" disabled={spinning || gambleOpen || lineBet === LINE_BETS[0]} onclick={() => stepBet(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={s.betLabel(bet, lineBet)}>{fmt(bet)}</b>
					<button type="button" class="stepper plus" aria-label="+" disabled={spinning || gambleOpen || lineBet === LINE_BETS[LINE_BETS.length - 1]} onclick={() => stepBet(1)}>+</button>
				</div>
				<small class="per-line num">{s.perLine(lineBet)}</small>
			</div>
			<div class="led lines">
				<div class="ctl">
					<span class="lbl">{s.lines}</span>
					<button type="button" class="stepper minus" aria-label="−" disabled={spinning || gambleOpen || lines === 1} onclick={() => stepLines(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={s.linesLabel(lines)}>{lines}</b>
					<button type="button" class="stepper plus" aria-label="+" disabled={spinning || gambleOpen || lines === MAX_LINES} onclick={() => stepLines(1)}>+</button>
				</div>
			</div>
			<div class="led win"><span>{s.lastWin}</span><b class="num">{fmt(lastWin)}</b></div>
			<button type="button" class="spin font-head" bind:this={spinBtn} disabled={spinning || gambleOpen || autoLeft > 0} onclick={() => void spin()}>{spinning ? '…' : s.spin}</button>
		</div>

		<!-- gamble the last win, or auto spin -->
		<div class="row2">
			{#if offer && !spinning && !gambleOpen}
				<button type="button" class="gamble-btn font-head" onclick={() => void openGamble()}>
					<span aria-hidden="true">🃏</span>
					{s.gambleOffer(offer.amount)}
				</button>
			{/if}
			<div class="auto" role="group" aria-label={t.casino.slots.autoLabel}>
				<button type="button" class="auto-btn font-head" aria-pressed={autoLeft > 0} disabled={autoLeft === 0 && (spinning || gambleOpen || bet > shown)} onclick={() => void runAuto()}>
					{autoLeft > 0 ? t.casino.slots.autoStop(autoLeft) : t.casino.slots.auto(autoCount)}
				</button>
				{#if autoLeft === 0}
					{#each AUTO_COUNTS as n (n)}
						<button type="button" class="auto-n num font-head" aria-pressed={autoCount === n} aria-label={t.casino.slots.autoCount(n)} onclick={() => (autoCount = n)}>{n}</button>
					{/each}
				{/if}
			</div>
		</div>

		<!-- the gamble: over the whole cabinet -->
		{#if gambleOpen && offer}
			<div class="gamble" role="group" aria-label={s.gambleTitle} bind:this={gambleEl} data-outcome={outcome ?? ''}>
				<p class="g-title font-head">{s.gambleTitle}</p>
				<p class="g-help">{s.gambleHelp}</p>
				<div class="g-amounts">
					<p><span>{s.gambleAmount}</span><b class="num">{fmt(outcome === 'wrong' ? 0 : offer.amount)}</b></p>
					<p><span>{s.colourWin}</span><b class="num">{fmt(offer.amount * 2)}</b></p>
					<p><span>{s.suitWin}</span><b class="num">{fmt(offer.amount * 4)}</b></p>
				</div>
				<div class="g-table">
					<div class="g-card" class:face={!!card} class:flip={flipping} data-red={card ? isRed(card.s) : undefined} role="img" aria-label={card ? cardText(card) : s.cardBack}>
						{#if card}
							<span class="g-rank num">{rankLabel(card.r)}</span>
							<span class="g-suit">{SUIT_SYMBOL[card.s]}</span>
							<span class="g-rank bottom num" aria-hidden="true">{rankLabel(card.r)}</span>
						{:else}
							<span class="g-back" aria-hidden="true"><BookSymbolView symbol="book" size={44} /></span>
						{/if}
					</div>
					<div class="g-history" role="group" aria-label={s.history}>
						<span class="g-hist-lbl">{s.history}</span>
						<ol>
							{#each history as h, i (i)}<li class="g-mini" data-red={isRed(h.s)} aria-label={cardText(h)}>{rankLabel(h.r)}{SUIT_SYMBOL[h.s]}</li>{/each}
							{#each Array.from({ length: 5 - history.length }) as _, i (i)}<li class="g-mini empty" aria-hidden="true"></li>{/each}
						</ol>
					</div>
				</div>
				<p class="g-result font-head" role="status">{outcome === 'right' ? s.gambleRight(offer.amount) : outcome === 'wrong' ? s.gambleWrong : s.gamblesLeft(GAMBLE_STEPS - done)}</p>
				<div class="g-guesses">
					<button type="button" class="g-colour red font-head" disabled={!can('red')} onclick={() => void guess('red')}>{s.red} <small>×2</small></button>
					<button type="button" class="g-colour black font-head" disabled={!can('black')} onclick={() => void guess('black')}>{s.black} <small>×2</small></button>
				</div>
				<div class="g-suits">
					{#each SUITS as su (su)}
						<button type="button" class="g-suit-btn" data-red={isRed(su)} disabled={!can(su)} aria-label={`${s.suits[su]} ×4`} onclick={() => void guess(su)}>
							<span aria-hidden="true">{SUIT_SYMBOL[su]}</span><small aria-hidden="true">×4</small>
						</button>
					{/each}
				</div>
				{#if offer.amount * 2 > GAMBLE_LIMIT * offer.bet && outcome !== 'wrong'}<p class="g-help">{s.gambleLimit(GAMBLE_LIMIT)}</p>{/if}
				<button type="button" class="g-collect font-head" disabled={flipping || outcome === 'wrong'} onclick={collect}>{s.collect} · {fmt(offer.amount)} 🍔</button>
			</div>
		{/if}
	</div>
</div>

<details class="paytable mt-3 text-xs text-muted">
	<summary class="min-h-11 cursor-pointer content-center font-semibold">{s.paytable}</summary>
	<p class="pb-2">{s.how}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-1.5 pb-1">
		{#each [...BOOK_SYMBOLS].reverse() as sym (sym)}
			<li class="pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				<BookSymbolView symbol={sym} size={34} />
				<span class="min-w-0">
					<b class="block text-fg">{s.symbols[sym]}</b>
					{#if sym === 'book'}
						{s.bookRow(...BOOK_SCATTER, BOOK_FREE)}
					{:else}
						{s.payRow(...BOOK_PAYS[sym as BookPay])}
					{/if}
				</span>
			</li>
		{/each}
	</ul>
	<p class="pb-1">{s.payNote}</p>
	<p class="pb-1">{s.gambleNote(GAMBLE_STEPS, GAMBLE_LIMIT)}</p>
	<p class="pb-1">{s.oddsNote(MAX_WIN)}</p>
</details>

<style>
	.book-machine {
		--cell: clamp(38px, calc((100cqi - 52px) / 5), 114px);
		container-type: inline-size;
		max-width: 640px;
	}
	@supports not (width: 1cqi) {
		.book-machine {
			--cell: 48px;
		}
	}
	.cabinet {
		position: relative;
		padding: 10px 10px 12px;
		border: 4px solid #d9a521;
		border-radius: 22px 22px 14px 14px;
		background:
			radial-gradient(120% 60% at 50% 0%, rgb(255 210 58 / 0.18), transparent 60%),
			repeating-linear-gradient(115deg, rgb(255 255 255 / 0.025) 0 2px, transparent 2px 7px),
			linear-gradient(180deg, #145a2e, #0b3a1d 65%, #06210f);
		box-shadow:
			0 0 0 3px #04170a,
			0 0 24px rgb(120 255 120 / 0.25),
			inset 0 2px 0 rgb(255 255 255 / 0.2);
		color: #fff6d8;
	}
	/* the marquee */
	.marquee {
		position: relative;
		margin-bottom: 10px;
		padding: 12px 8px 8px;
		border-radius: 14px;
		background:
			radial-gradient(80% 120% at 50% 0%, rgb(255 210 80 / 0.22), transparent 70%),
			linear-gradient(180deg, #0a2412, #041008);
		box-shadow: inset 0 0 0 2px #d9a521;
		text-align: center;
		overflow: hidden;
	}
	/* the logo, centred; the skull and the book's top may reach the marquee's edge */
	.logo {
		position: relative;
		max-width: 440px;
		margin: -4px auto 0;
	}
	/* under it: always room for the free-spins counter + its line (with the special symbol), so the reels never move */
	.lines {
		position: relative;
		display: grid;
		align-content: center;
		min-height: 48px;
	}
	.title {
		position: relative;
		font-size: clamp(22px, 7.2cqi, 42px);
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff6b0 0%, #ffc928 45%, #b0700a 55%, #ffd23a 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-stroke: 1px #3a2400;
		filter: drop-shadow(0 2px 0 #021006) drop-shadow(0 0 10px rgb(255 200 60 / 0.5));
	}
	.subtitle {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		color: #c9f0b0;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}
	.sub-sym {
		flex: none;
	}
	.marquee.free-on {
		background:
			radial-gradient(80% 120% at 50% 0%, rgb(255 230 120 / 0.35), transparent 70%),
			linear-gradient(180deg, #2a1c04, #120a01);
		box-shadow:
			inset 0 0 0 2px #ffe680,
			0 0 16px rgb(255 210 60 / 0.6);
	}
	.free-title {
		font-size: clamp(15px, 4.4cqi, 21px);
	}
	/* phones: the counter and its line stay on one line each */
	@container (max-width: 440px) {
		.title {
			white-space: nowrap;
		}
		.subtitle {
			font-size: 9.5px;
			letter-spacing: 0.12em;
			white-space: nowrap;
		}
	}
	/* the reel window: parchment pages */
	.window {
		position: relative;
		padding: 6px;
		border-radius: 12px;
		background: #1a1004;
		box-shadow:
			inset 0 0 0 3px #b8860b,
			inset 0 10px 18px rgb(0 0 0 / 0.8);
	}
	.reels {
		display: grid;
		grid-template-columns: repeat(5, var(--cell));
		justify-content: center;
		gap: 4px;
	}
	.reel {
		height: calc(var(--cell) * 3);
		overflow: hidden;
		border-radius: 8px;
		background:
			radial-gradient(120% 70% at 50% 50%, transparent 55%, rgb(120 80 20 / 0.35)),
			linear-gradient(180deg, #c9b07a, #f4e6bf 18%, #f8edcc 82%, #c9b07a);
		box-shadow: inset 0 6px 8px rgb(0 0 0 / 0.35), inset 0 -6px 8px rgb(0 0 0 / 0.35);
	}
	.strip {
		will-change: transform;
	}
	.cell {
		display: grid;
		place-items: center;
		width: var(--cell);
		height: var(--cell);
	}
	.cell :global(.book-sym) {
		width: calc(var(--cell) * 0.84);
		height: calc(var(--cell) * 0.84);
	}
	.cell.win {
		background: radial-gradient(circle, rgb(255 230 80 / 0.8), rgb(255 160 0 / 0.25) 60%, transparent 72%);
		animation: win-pop 0.8s ease-in-out infinite alternate;
	}
	@keyframes win-pop {
		to {
			transform: scale(1.08);
		}
	}
	.paylines {
		position: absolute;
		inset: 6px;
		width: calc(var(--cell) * 5 + 16px);
		height: calc(100% - 12px);
		margin: 0 auto;
		pointer-events: none;
		filter: drop-shadow(0 0 4px rgb(0 0 0 / 0.8));
	}
	/* the special symbol spread over whole reels: gold-framed columns that grow from the middle */
	.expand-layer {
		position: absolute;
		inset: 6px;
		display: grid;
		grid-template-columns: repeat(5, var(--cell));
		grid-template-rows: calc(var(--cell) * 3);
		justify-content: center;
		column-gap: 4px;
		pointer-events: none;
	}
	.expand-col {
		grid-row: 1;
		display: grid;
		grid-template-rows: repeat(3, 1fr);
		place-items: center;
		border-radius: 8px;
		background:
			radial-gradient(90% 60% at 50% 50%, rgb(255 240 170 / 0.95), rgb(255 200 60 / 0.85) 70%, rgb(200 130 10 / 0.9)),
			#f8edcc;
		box-shadow:
			inset 0 0 0 3px #ffd23a,
			0 0 18px rgb(255 210 58 / 0.9);
		animation: expand-in 0.75s cubic-bezier(0.2, 1.4, 0.4, 1) both;
		transform-origin: 50% 50%;
	}
	.expand-col :global(.book-sym) {
		width: calc(var(--cell) * 0.9);
		height: calc(var(--cell) * 0.9);
	}
	@keyframes expand-in {
		from {
			transform: scaleY(0.33);
			opacity: 0.6;
		}
	}
	/* "+10 FREE SPINS!" */
	.fs-more {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 3;
		transform: translate(-50%, -50%);
		padding: 8px 16px;
		border: 3px solid #ffd23a;
		border-radius: 12px;
		background: rgb(20 80 40 / 0.95);
		color: #fff6b0;
		font-size: clamp(15px, 5cqi, 24px);
		font-weight: 900;
		letter-spacing: 0.08em;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 0 20px rgb(255 210 58 / 0.7);
		animation: big-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	/* the screens over the reels: the book opening, the total */
	.book-screen,
	.fs-screen {
		position: absolute;
		inset: 0;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		width: 100%;
		padding: 6px;
		border-radius: 12px;
		background: radial-gradient(circle, rgb(30 70 30 / 0.92), rgb(2 12 4 / 0.96));
		color: #fff6b0;
		overflow: hidden;
		text-align: center;
	}
	.book-screen[data-done='false'] {
		cursor: default;
	}
	.bs-kicker {
		color: #ffd23a;
		font-size: clamp(14px, 4.6cqi, 22px);
		font-weight: 900;
		letter-spacing: 0.1em;
		text-shadow: 0 2px 0 #3a2400, 0 0 12px rgb(255 210 60 / 0.7);
	}
	.bs-sub {
		max-width: 34em;
		font-size: 12px;
		font-weight: 700;
		line-height: 1.25;
	}
	/* the open book: two parchment pages in a green cover */
	.open-book {
		display: grid;
		grid-template-columns: 1fr 1fr;
		width: min(300px, 86%);
		height: calc(var(--cell) * 1.75);
		min-height: 84px;
		max-height: 150px;
		padding: 5px;
		border-radius: 8px;
		background: linear-gradient(180deg, #1f6a30, #0a3a18);
		box-shadow:
			inset 0 0 0 2px #d9a521,
			0 6px 14px rgb(0 0 0 / 0.6);
		transform: perspective(500px) rotateX(18deg) scaleX(0.5);
		transition: transform 0.45s cubic-bezier(0.2, 1.2, 0.4, 1);
	}
	.open-book.open {
		transform: perspective(500px) rotateX(10deg) scaleX(1);
	}
	.page {
		display: grid;
		place-items: center;
		align-content: center;
		gap: 2px;
		background: linear-gradient(90deg, #e8d6a4, #f8edcc 30%, #f8edcc 70%, #e2cf98);
		color: #3a2400;
	}
	.left-page {
		border-radius: 4px 0 0 4px;
		box-shadow: inset -6px 0 8px rgb(120 80 20 / 0.35);
	}
	.right-page {
		border-radius: 0 4px 4px 0;
		box-shadow: inset 6px 0 8px rgb(120 80 20 / 0.35);
	}
	.page-title {
		font-size: clamp(9px, 2.6cqi, 12px);
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.page-leaf :global(.book-sym) {
		width: calc(var(--cell) * 0.7);
		height: calc(var(--cell) * 0.7);
		max-width: 52px;
		max-height: 52px;
	}
	.page-sym {
		display: grid;
		animation: page-flip 0.12s ease-out;
	}
	.page-sym :global(.book-sym) {
		width: calc(var(--cell) * 1.2);
		height: calc(var(--cell) * 1.2);
		max-width: 110px;
		max-height: 110px;
	}
	.right-page.landed .page-sym {
		animation: page-land 0.6s cubic-bezier(0.2, 1.6, 0.4, 1) both;
		filter: drop-shadow(0 0 10px rgb(255 190 30 / 0.95));
	}
	@keyframes page-flip {
		from {
			transform: scaleX(0.2);
			opacity: 0.4;
		}
	}
	@keyframes page-land {
		from {
			transform: scale(1.6);
		}
	}
	.fs-kicker {
		color: #c9f0b0;
		font-size: clamp(14px, 4.4cqi, 20px);
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.fs-tap {
		margin-top: 4px;
		padding: 2px 10px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.12);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.celebrate {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		border-radius: 12px;
		background: radial-gradient(circle, rgb(20 50 10 / 0.55), rgb(0 0 0 / 0.75));
		overflow: hidden;
		pointer-events: none;
	}
	.big {
		font-size: clamp(26px, 9cqi, 52px);
		font-weight: 900;
		letter-spacing: 0.06em;
		color: #ffd23a;
		-webkit-text-stroke: 1.5px #3a2400;
		text-shadow: 0 3px 0 #0b3a1d, 0 0 18px rgb(255 200 40 / 0.8);
		animation: big-in 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.celebrate[data-tier='epic'] .big {
		color: #fff;
		text-shadow: 0 3px 0 #0b3a1d, 0 0 22px #7dff6a, 0 0 34px #ffd23a;
	}
	.amount {
		font-size: clamp(18px, 5.5cqi, 30px);
		font-weight: 900;
		color: #fff6b0;
		text-shadow: 0 2px 0 #062a12;
	}
	@keyframes big-in {
		from {
			transform: scale(2.4);
			opacity: 0;
		}
	}
	.rain span {
		position: absolute;
		top: -36px;
		animation: rain 1.6s linear infinite;
	}
	@keyframes rain {
		to {
			transform: translateY(calc(var(--cell) * 3 + 80px)) rotate(200deg);
		}
	}
	.msg {
		min-height: 2.4em;
		margin: 8px 2px 6px;
		color: #e6f6d0;
		font-size: 12.5px;
		line-height: 1.25;
		text-align: center;
	}
	/* the panel */
	.panel {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
		grid-template-areas: 'cred bet lines win spin';
		align-items: stretch;
		gap: 6px;
	}
	.led.cred {
		grid-area: cred;
	}
	.led.bet {
		grid-area: bet;
		container-type: inline-size;
	}
	.led.lines {
		grid-area: lines;
		container-type: inline-size;
	}
	.led.win {
		grid-area: win;
	}
	.spin {
		grid-area: spin;
	}
	/* narrow: burgers + win on top, bet + lines, then spin across */
	@container (max-width: 520px) {
		.panel {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			grid-template-areas:
				'cred win'
				'bet lines'
				'spin spin';
		}
	}
	.led {
		display: grid;
		align-content: center;
		justify-items: center;
		min-width: 0;
		padding: 4px 4px 5px;
		border-radius: 8px;
		background: #031008;
		box-shadow: inset 0 0 0 2px #1f5a2a;
	}
	.led > span,
	.lbl {
		color: #a8e08a;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.led b {
		color: #ffd23a;
		font-family: ui-monospace, Consolas, monospace;
		font-size: 17px;
		font-weight: 800;
		text-shadow: 0 0 8px rgb(255 200 40 / 0.7);
	}
	.led.win b {
		color: #7dff6a;
		text-shadow: 0 0 8px rgb(100 255 90 / 0.7);
	}
	.per-line {
		color: #8fbf78;
		font-size: 10px;
	}
	/* LABEL over − n +; when the box is narrow: − LABEL + on top, the number under them */
	.ctl {
		display: grid;
		justify-self: stretch;
		grid-template-columns: auto auto auto;
		grid-template-areas:
			'lbl lbl lbl'
			'minus num plus';
		justify-content: center;
		justify-items: center;
		align-items: center;
		column-gap: 4px;
	}
	.ctl .lbl {
		grid-area: lbl;
	}
	.ctl .minus {
		grid-area: minus;
	}
	.ctl b {
		grid-area: num;
	}
	.ctl .plus {
		grid-area: plus;
	}
	@container (max-width: 125px) {
		.ctl {
			grid-template-areas:
				'minus lbl plus'
				'num num num';
			column-gap: 8px;
			row-gap: 1px;
		}
	}
	@container (max-width: 100px) {
		.ctl {
			column-gap: 3px;
		}
		.ctl .stepper {
			width: 24px;
			height: 24px;
		}
		.ctl .stepper::after {
			inset: -10px;
		}
	}
	.stepper {
		position: relative;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: #0b3a1d;
		color: #ffd23a;
		font-weight: 900;
		box-shadow: inset 0 0 0 1.5px #d9a521;
	}
	/* 44 px to tap, the ring is the drawing */
	.stepper::after {
		content: '';
		position: absolute;
		inset: -8px;
	}
	.stepper:disabled {
		opacity: 0.4;
	}
	.spin {
		min-width: 76px;
		min-height: 54px;
		padding: 0 12px;
		border: 3px solid #fff0a0;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 30%, #ffe680, #e0a400 55%, #8a5a00);
		color: #2a1a00;
		font-size: 17px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.5);
		box-shadow: 0 4px 0 #5a3a00, 0 0 14px rgb(255 210 60 / 0.6);
	}
	.spin:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: 0 1px 0 #5a3a00;
	}
	.spin:disabled {
		filter: grayscale(0.5) brightness(0.8);
	}
	/* gamble + auto row */
	.row2 {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
	}
	.gamble-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 0 16px;
		border: 2px solid #ff6a6a;
		border-radius: 999px;
		background: linear-gradient(180deg, #b3141b, #5a060b);
		color: #fff;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.06em;
		box-shadow: 0 0 12px rgb(255 60 60 / 0.5);
		animation: gamble-pulse 1.1s ease-in-out infinite alternate;
	}
	@keyframes gamble-pulse {
		to {
			box-shadow: 0 0 4px rgb(255 60 60 / 0.3);
		}
	}
	.auto {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.auto-btn {
		min-height: 44px;
		padding: 0 16px;
		border: 2px solid #d9a521;
		border-radius: 999px;
		background: #0b3a1d;
		color: #ffd23a;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.auto-btn[aria-pressed='true'] {
		background: #ffc928;
		color: #0b3a1d;
		box-shadow: 0 0 12px rgb(255 201 40 / 0.7);
	}
	.auto-btn:disabled {
		opacity: 0.45;
	}
	.auto-n {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		background: #031008;
		color: #a8e08a;
		font-size: 13px;
		font-weight: 800;
		box-shadow: inset 0 0 0 2px #1f5a2a;
	}
	.auto-n[aria-pressed='true'] {
		color: #ffd23a;
		box-shadow: inset 0 0 0 2px #d9a521;
	}
	/* ---------- the gamble (over the whole cabinet) ---------- */
	.gamble {
		position: absolute;
		inset: 0;
		z-index: 6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: safe center;
		gap: 6px;
		padding: 12px 10px;
		border-radius: 18px 18px 10px 10px;
		overflow-y: auto;
		background:
			radial-gradient(90% 55% at 50% 40%, rgb(40 120 60 / 0.6), transparent 70%),
			linear-gradient(180deg, #0f4a24, #041a0b);
		color: #fff6d8;
		text-align: center;
		animation: gamble-in 0.3s ease-out both;
	}
	@keyframes gamble-in {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
	}
	.g-title {
		font-size: clamp(22px, 7cqi, 34px);
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff6b0, #ffc928 50%, #b0700a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-stroke: 1px #3a2400;
	}
	.g-help {
		max-width: 34em;
		color: #c9e8b8;
		font-size: 11.5px;
		line-height: 1.3;
	}
	.g-amounts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
		width: min(100%, 420px);
	}
	.g-amounts p {
		display: grid;
		padding: 3px 4px;
		border-radius: 8px;
		background: #031008;
		box-shadow: inset 0 0 0 1.5px #1f5a2a;
	}
	.g-amounts span {
		color: #a8e08a;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.g-amounts b {
		color: #ffd23a;
		font-family: ui-monospace, Consolas, monospace;
		font-size: 15px;
		font-weight: 800;
		overflow-wrap: anywhere;
	}
	.g-table {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
	}
	.g-card {
		position: relative;
		display: grid;
		place-items: center;
		width: 76px;
		height: 106px;
		border: 2.5px solid #1a0e05;
		border-radius: 9px;
		background: repeating-linear-gradient(45deg, #b3141b 0 6px, #7a0a10 6px 12px);
		box-shadow: 0 5px 12px rgb(0 0 0 / 0.55);
		animation: back-flash 0.5s steps(1) infinite;
	}
	/* the face-down card flashes red / black, like the real thing */
	@keyframes back-flash {
		50% {
			background: repeating-linear-gradient(45deg, #2a2f36 0 6px, #111418 6px 12px);
		}
	}
	.g-card.flip {
		animation:
			back-flash 0.12s steps(1) infinite,
			card-flip 0.6s ease-in-out;
	}
	@keyframes card-flip {
		50% {
			transform: rotateY(90deg);
		}
	}
	.g-card.face {
		background: #fffaf0;
		animation: face-in 0.35s ease-out;
		color: #151515;
	}
	.g-card.face[data-red='true'] {
		color: #d8261f;
	}
	@keyframes face-in {
		from {
			transform: rotateY(90deg);
		}
	}
	.g-back {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.35);
	}
	.g-rank {
		position: absolute;
		top: 4px;
		left: 6px;
		font-family: Bahnschrift, 'Arial Black', sans-serif;
		font-size: 18px;
		font-weight: 900;
		line-height: 1;
	}
	.g-rank.bottom {
		top: auto;
		left: auto;
		right: 6px;
		bottom: 4px;
		transform: rotate(180deg);
	}
	.g-suit {
		font-size: 42px;
		line-height: 1;
	}
	.g-history {
		display: grid;
		gap: 3px;
		justify-items: start;
	}
	.g-hist-lbl {
		color: #a8e08a;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.g-history ol {
		display: grid;
		grid-template-columns: repeat(5, 30px);
		gap: 3px;
		min-height: 40px;
	}
	.g-mini {
		display: grid;
		place-items: center;
		height: 40px;
		border-radius: 5px;
		background: #fffaf0;
		color: #151515;
		font-size: 12px;
		font-weight: 900;
		line-height: 1;
		box-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
	}
	.g-mini[data-red='true'] {
		color: #d8261f;
	}
	.g-mini.empty {
		background: none;
		box-shadow: inset 0 0 0 1.5px rgb(255 246 216 / 0.25);
	}
	.g-mini:first-child:not(.empty) {
		box-shadow:
			0 0 0 2px #ffd23a,
			0 2px 4px rgb(0 0 0 / 0.5);
	}
	.g-result {
		min-height: 1.4em;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.04em;
	}
	.gamble[data-outcome='right'] .g-result {
		color: #7dff6a;
		text-shadow: 0 0 8px rgb(100 255 90 / 0.6);
	}
	.gamble[data-outcome='wrong'] .g-result {
		color: #ff7a6a;
	}
	.g-guesses {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		width: min(100%, 360px);
	}
	.g-colour {
		min-height: 48px;
		border: 3px solid #fff0c0;
		border-radius: 999px;
		color: #fff;
		font-size: 16px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		box-shadow: 0 4px 0 rgb(0 0 0 / 0.5);
	}
	.g-colour small {
		font-size: 11px;
		opacity: 0.85;
	}
	.g-colour.red {
		background: radial-gradient(circle at 40% 30%, #ff6a5a, #d8261f 55%, #7a0a10);
	}
	.g-colour.black {
		background: radial-gradient(circle at 40% 30%, #5a626c, #1c2026 60%, #050607);
	}
	.g-suits {
		display: grid;
		grid-template-columns: repeat(4, minmax(44px, 64px));
		gap: 8px;
	}
	.g-suit-btn {
		display: grid;
		place-items: center;
		min-height: 52px;
		border: 2px solid #d9a521;
		border-radius: 12px;
		background: #fffaf0;
		color: #151515;
		font-size: 26px;
		line-height: 1;
		box-shadow: 0 3px 0 rgb(0 0 0 / 0.5);
	}
	.g-suit-btn small {
		color: #5a4a2a;
		font-size: 10px;
		font-weight: 800;
	}
	.g-suit-btn[data-red='true'] {
		color: #d8261f;
	}
	.g-colour:disabled,
	.g-suit-btn:disabled {
		opacity: 0.4;
	}
	.g-collect {
		min-height: 48px;
		margin-top: 2px;
		padding: 0 22px;
		border: 3px solid #fff0a0;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 30%, #ffe680, #e0a400 55%, #8a5a00);
		color: #2a1a00;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		box-shadow: 0 4px 0 #5a3a00;
	}
	.g-collect:disabled {
		opacity: 0.5;
	}
	.pay-row {
		background: rgb(127 127 127 / 0.1);
	}
	@media (prefers-reduced-motion: reduce) {
		.cell.win,
		.rain,
		.expand-col,
		.page-sym,
		.right-page.landed .page-sym,
		.g-card,
		.g-card.flip,
		.g-card.face,
		.gamble,
		.gamble-btn,
		.big,
		.fs-more {
			animation: none;
		}
		.open-book {
			transition: none;
		}
	}
</style>
