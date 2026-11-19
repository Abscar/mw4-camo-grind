<!--
	Abscar's Fortune, the Burger Bandit (casino-slots.ts; 2026-11-16, the user's asks: "a one-armed
	bandit in burger theme, fun, fat and nice with lots of different wins, like a real one", then
	"'Abscar's fortune' somewhere on it, the machine's arm a big smoking holk / cigar").
	A cabinet with a marquee of chasing bulbs, 5 reels that spin and stop one by one, the 10 paylines
	drawn over the winning cells, free spins, BIG / MEGA WIN / BURGER JACKPOT, and the lever: a big
	holk with a glowing ember and Abscar's own smoke (abscarOperator.ts), pulled down to spin.
	Bonuses (2026-11-16, the user's "add free spins and bonus", all four picks): the Burger Box pick game
	and the bonus wheel open over the whole cabinet; a Buy bonus row starts free spins, the Burger Box or
	a wheel spin at once (asked first); free spins get an intro, the marquee turns into their counter,
	"+8 FREE SPINS" when they come again and the total at the end.
	Weeds + sticky WILDs (2026-11-16, the user's "sticky wilds in the free spins, and special weed symbols
	that give ×2, ×5, ×10 and so on"): a weed shows its ×value on the reel; on a winning screen they glow
	and a big "×n" pops up. In free spins every WILD that lands is drawn again on a layer over the reels
	(.sticky-layer, the same grid as the cells) so it stays put while the reels spin under it.
	The whole spin with its bonuses and free spins is worked out and booked at once (squad.recordGame),
	then shown; the boxes you tap only decide the order the worked-out prizes come in. `hidden` = burgers
	won but not shown yet, so the balance above doesn't give the result away.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { holk, smoke } from '#lib/abscarOperator.ts';
	import {
		buy,
		cellKey,
		evaluate,
		play,
		spinsFrom,
		winTier,
		MAX_WIN,
		BOX_COUNT,
		BOX_REELS,
		BUY_FREE_SPINS,
		BUY_KINDS,
		BUY_PRICE,
		FREE_SPINS,
		LINES,
		PAYS,
		PAYS2,
		REELS,
		ROWS,
		SCATTER_PAYS,
		SLOT_BETS,
		STRIPS,
		SYMBOLS,
		WHEEL,
		WHEEL_REELS,
		type BoxBonus,
		type BuyKind,
		type LineWin,
		type PaySymbol,
		type Play,
		type SpinResult,
		type WheelBonus,
		type WinTier
	} from '#lib/casino-slots.ts';
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import SlotSymbolView from './SlotSymbol.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	// here everything held back is a win not shown yet (the leaderboard waits for it too)
	$effect(() => {
		pending = hidden;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const s = t.casino.slots;
	const uid = $props.id();
	const u = `slot-${uid}`;

	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	let bet = $state(SLOT_BETS[0]);
	const shown = $derived(Math.max(0, balance - hidden));
	const START = evaluate([3, 11, 19, 27, 35], SLOT_BETS[0]);
	let screen = $state<SpinResult>(START);
	let wins = $state<LineWin[]>([]);
	let scatterHit = $state(false);
	let spinning = $state(false);
	let pulled = $state(false);
	let lastWin = $state(0);
	let message = $state('');
	let tier = $state<WinTier>('none');
	let celebrate = $state(false);
	/** Bonus symbols that opened a bonus on the screen shown (for the glow). */
	let boxHit = $state(false);
	let wheelHit = $state(false);
	/** Free spins running: which one, of how many, burgers won in them so far (the marquee shows it). */
	let freeState = $state<{ n: number; total: number; won: number } | null>(null);
	/** A free-spins screen over the reels: the intro, "+8 more", the total at the end. */
	let banner = $state<{ kind: 'intro' | 'more'; spins: number } | { kind: 'outro'; spins: number; won: number } | null>(null);
	/** The Burger Box pick game: what each box showed once opened (null = closed). */
	let boxGame = $state<{ bonus: BoxBonus; cells: (number | 'collect' | null)[]; next: number; won: number; done: boolean } | null>(null);
	/** The bonus wheel: its turn in degrees (the stop is worked out already). */
	let wheelGame = $state<{ bonus: WheelBonus; angle: number; turning: boolean; done: boolean } | null>(null);
	/** Buy bonus: the feature waiting for a yes. */
	let buyAsk = $state<BuyKind | null>(null);
	/** Free spins: the sticky WILDs held ("reel-row"), and the ones that just landed (they flash). */
	let stickyCells = $state<string[]>([]);
	let stickyNew = $state<string[]>([]);
	/** The weeds' sum popping up over the reels after a winning spin with weeds. */
	let weedPop = $state<number | null>(null);
	/** Which pop is showing (a later one isn't cleared by an earlier one's timer). */
	let popId = 0;
	/** A weed's ×value on the screen shown. */
	const weedAt = (reel: number, row: number) => screen.weeds.find((w) => w.reel === reel && w.row === row)?.x;
	let spinBtn = $state<HTMLButtonElement>();
	let bonusEl = $state<HTMLDivElement>();

	/** What each reel shows: during a spin a long strip that slides up; at rest the 3 visible symbols. */
	let cols = $state(START.grid.map((items) => ({ items, y: 0, dur: 0 })));

	/** Cells that are part of a win (for the glow): "reel-row". */
	const winCells = $derived.by(() => {
		const set = new Set<string>();
		for (const w of wins) LINES[w.line].slice(0, w.count).forEach((row, r) => set.add(`${r}-${row}`));
		if (scatterHit) screen.grid.forEach((col, r) => col.forEach((sym, row) => sym === 'scatter' && set.add(`${r}-${row}`)));
		if (boxHit) for (const r of BOX_REELS) screen.grid[r].forEach((sym, row) => sym === 'box' && set.add(`${r}-${row}`));
		if (wheelHit) for (const r of WHEEL_REELS) screen.grid[r].forEach((sym, row) => sym === 'wheel' && set.add(`${r}-${row}`));
		// weeds glow when they multiplied a win
		if (screen.raw > 0 && (wins.length || scatterHit)) for (const w of screen.weeds) set.add(`${w.reel}-${w.row}`);
		return set;
	});
	const LINE_COLORS = ['#ffd23a', '#ff5ca8', '#5ce1ff', '#7dff6a', '#ff8a1a', '#c98bff', '#ff4b4b', '#4bffd1', '#fff6b0', '#9ab8ff'];

	async function spinReels(result: SpinResult) {
		const fast = reduce();
		if (!fast) {
			cols = cols.map((c, r) => {
				const filler = Array.from({ length: 10 + r * 3 }, () => STRIPS[r][Math.floor(rand() * STRIPS[r].length)]);
				return { items: [...c.items.slice(0, ROWS), ...filler, ...result.grid[r]], y: 0, dur: 0 };
			});
			await tick();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			cols = cols.map((c, r) => ({ ...c, y: c.items.length - ROWS, dur: 650 + r * 230 }));
			await sleep(650 + (REELS - 1) * 230 + 140);
		}
		cols = result.grid.map((items) => ({ items, y: 0, dur: 0 }));
		screen = result;
	}

	function show(result: SpinResult) {
		wins = result.lines;
		scatterHit = result.scatters >= 3;
		boxHit = result.box;
		wheelHit = result.wheel;
		hidden = Math.max(0, hidden - result.win);
		lastWin = result.win;
		const weedHit = result.weedMult > 0 && result.raw > 0;
		const parts = [
			...result.lines.map((l) => s.lineWin(l.line + 1, l.count, s.symbols[l.symbol], l.win)),
			...(result.scatterWin || result.freeSpins ? [s.scatterWin(result.scatters, result.scatterWin, result.freeSpins)] : []),
			...(weedHit ? [s.weedWin(result.weedMult, result.raw, result.win)] : []),
			...(result.newSticky.length ? [s.sticky(result.newSticky.length)] : []),
			...(result.box ? [s.boxHit] : []),
			...(result.wheel ? [s.wheelHit] : [])
		];
		message = parts.length ? parts.join(' · ') : s.noWin;
		if (weedHit) {
			weedPop = result.weedMult;
			const id = ++popId;
			setTimeout(() => popId === id && (weedPop = null), reduce() ? 1400 : 1900);
		}
		if (result.box || result.wheel || weedHit) sound.play('maxed');
		else if (result.win > 0 || result.newSticky.length) sound.play('camo');
	}

	/* ----- waiting: a tap on a screen or a timeout; everything waiting lets go when the machine goes away ----- */
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
	let bonusDone: (() => void) | null = null;
	/** Wait until the open bonus screen is closed (Continue, or a timer once it's finished). */
	const untilClosed = () => new Promise<void>((res) => (bonusDone = res));
	function closeBonus() {
		const done = bonusDone;
		bonusDone = null;
		const focusBack = !!bonusEl && bonusEl.contains(document.activeElement);
		boxGame = null;
		wheelGame = null;
		if (focusBack) void tick().then(() => spinBtn?.focus());
		done?.();
	}
	/** A finished bonus closes by itself after a while (sooner in auto spin). */
	function closeLater() {
		const done = bonusDone;
		setTimeout(() => bonusDone === done && closeBonus(), autoLeft > 0 ? 1900 : reduce() ? 3500 : 4800);
	}
	async function focusFirst() {
		await tick();
		if (autoLeft === 0) bonusEl?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
	}

	/* ----- the Burger Box ----- */
	async function runBox(bonus: BoxBonus) {
		await sleep(reduce() ? 200 : 900);
		boxGame = { bonus, cells: Array(BOX_COUNT).fill(null), next: 0, won: 0, done: false };
		void focusFirst();
		// auto spin opens the boxes by itself (the player can stop auto and pick)
		void (async () => {
			while (alive && boxGame && !boxGame.done && autoLeft > 0) {
				await sleep(reduce() ? 150 : 700);
				const g = boxGame;
				if (!g || g.done || autoLeft === 0) break;
				const closed = g.cells.flatMap((c, i) => (c === null ? [i] : []));
				openBox(closed[Math.floor(rand() * closed.length)]);
			}
		})();
		await untilClosed();
	}
	function openBox(i: number) {
		const g = boxGame;
		if (!g || g.done || g.cells[i] !== null) return;
		const prize = g.next < g.bonus.picks.length ? g.bonus.picks[g.next] : 'collect';
		g.cells[i] = prize;
		g.next += 1;
		if (prize !== 'collect') {
			g.won += prize;
			sound.play('camo');
			return;
		}
		g.done = true;
		hidden = Math.max(0, hidden - g.bonus.win);
		lastWin = g.bonus.win;
		message = s.boxEvent(g.bonus.win);
		sound.play('maxed');
		void tick().then(() => bonusEl?.querySelector<HTMLButtonElement>('.bonus-go')?.focus());
		closeLater();
	}

	/* ----- the bonus wheel ----- */
	const SLICE = 360 / WHEEL.length;
	/** Where the wheel was left (it starts the next bonus from there). */
	let wheelRest = 0;
	async function runWheel(bonus: WheelBonus) {
		await sleep(reduce() ? 200 : 900);
		wheelGame = { bonus, angle: wheelRest, turning: false, done: false };
		void focusFirst();
		if (autoLeft > 0) setTimeout(() => void spinWheel(), reduce() ? 200 : 1000);
		await untilClosed();
	}
	async function spinWheel() {
		const g = wheelGame;
		if (!g || g.turning || g.done) return;
		// the worked-out slice comes to the pointer at the top, a few turns on, a little off its middle
		const target = -g.bonus.slice * SLICE + (rand() - 0.5) * SLICE * 0.6;
		const from = g.angle;
		g.angle = from + 360 * 5 + ((((target - from) % 360) + 360) % 360);
		g.turning = true;
		await sleep(reduce() ? 60 : 4300);
		if (wheelGame !== g) return;
		wheelRest = g.angle % 360;
		g.turning = false;
		g.done = true;
		hidden = Math.max(0, hidden - g.bonus.win);
		lastWin = g.bonus.win;
		const slice = WHEEL[g.bonus.slice];
		const what = slice.jackpot ? s.wheelJackpot(g.bonus.win) : g.bonus.spins ? s.wheelSpins(g.bonus.spins) : s.wheelWin(g.bonus.win);
		message = s.wheelEvent(what);
		sound.play(slice.jackpot ? 'divergence' : 'maxed');
		void tick().then(() => bonusEl?.querySelector<HTMLButtonElement>('.bonus-go')?.focus());
		closeLater();
	}
	/** A wheel slice's words: burgers at the current bet (short), free spins or the jackpot. */
	const short = (n: number) =>
		n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n);
	const sliceLabel = (i: number, b: number) => (WHEEL[i].spins ? s.freeSlice(WHEEL[i].spins!) : short((WHEEL[i].win ?? 0) * b));

	/** The bonuses a spin opened, one after the other; what they won. */
	async function bonusesOf(sp: SpinResult): Promise<number> {
		let n = 0;
		if (sp.boxBonus) {
			await runBox(sp.boxBonus);
			n += sp.boxBonus.win;
		}
		if (sp.wheelBonus) {
			await runWheel(sp.wheelBonus);
			n += sp.wheelBonus.win;
		}
		return n;
	}

	/* ----- free spins: intro, the marquee as the counter, "+n more", the total ----- */
	async function runFree(p: Play) {
		let total = Math.min(p.freeStart, p.free.length);
		let won = 0;
		await sleep(reduce() ? 200 : 700);
		banner = { kind: 'intro', spins: total };
		sound.play('maxed');
		await waitTap(reduce() ? 1200 : 2400);
		banner = null;
		for (let i = 0; i < p.free.length && alive; i++) {
			const fs = p.free[i];
			freeState = { n: i + 1, total, won };
			wins = [];
			scatterHit = false;
			boxHit = false;
			wheelHit = false;
			weedPop = null;
			// the WILDs held so far stay on their layer while the reels spin under them
			stickyNew = [];
			stickyCells = fs.sticky;
			await spinReels(fs);
			show(fs);
			if (fs.newSticky.length) {
				stickyNew = fs.newSticky;
				stickyCells = [...fs.sticky, ...fs.newSticky];
			}
			won += fs.win;
			freeState = { n: i + 1, total, won };
			won += await bonusesOf(fs);
			const more = Math.min(spinsFrom(fs), p.free.length - total);
			if (more > 0) {
				total += more;
				freeState = { n: i + 1, total, won };
				banner = { kind: 'more', spins: more };
				await sleep(reduce() ? 700 : 1500);
				banner = null;
			} else freeState = { n: i + 1, total, won };
			await sleep(reduce() ? 250 : 800);
		}
		freeState = null;
		stickyCells = [];
		stickyNew = [];
		// a capped play (MAX_WIN) pays less than the spins added up
		won = Math.min(won, p.win);
		banner = { kind: 'outro', spins: p.free.length, won };
		lastWin = won;
		await waitTap(reduce() ? 1500 : 3000);
		banner = null;
	}

	/** Book a paid spin or a bought feature at once, then show it all. */
	async function run(p: Play) {
		// booked now (closing the page changes nothing), shown below
		squad.recordGame(p.net);
		hidden = p.win;
		spinning = true;
		wins = [];
		scatterHit = false;
		boxHit = false;
		wheelHit = false;
		tier = 'none';
		celebrate = false;
		lastWin = 0;
		weedPop = null;
		stickyCells = [];
		stickyNew = [];
		const bonuses = !!(p.box || p.wheel || p.free.length || p.base?.boxBonus || p.base?.wheelBonus);
		if (p.base) {
			pulled = true;
			setTimeout(() => (pulled = false), 520);
			message = s.spinning;
			await spinReels(p.base);
			show(p.base);
			await bonusesOf(p.base);
		}
		if (p.box) await runBox(p.box);
		if (p.wheel) await runWheel(p.wheel);
		if (p.free.length) await runFree(p);
		if (!alive) return;
		if (bonuses || p.capped) {
			lastWin = p.win;
			message = `${s.lastWin}: ${p.win.toLocaleString('en-US')} 🍔${p.capped ? ` · ${s.maxWin(MAX_WIN)}` : ''}`;
		}
		hidden = 0;
		tier = winTier(p);
		if (tier === 'big' || tier === 'mega' || tier === 'jackpot') {
			celebrate = true;
			sound.play(tier === 'jackpot' ? 'divergence' : 'maxed');
			setTimeout(() => (celebrate = false), reduce() ? 2200 : 3400);
			squad.casinoNews(t.casino.event.slots(p.win, tier));
		}
		spinning = false;
	}

	async function spin() {
		if (spinning) return;
		if (bet > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		buyAsk = null;
		await run(play(bet, rand));
	}

	/* ----- buy bonus: asked first, since it's a big stake ----- */
	const price = (k: BuyKind) => BUY_PRICE[k] * bet;
	const buyWhat = (k: BuyKind) => (k === 'free' ? s.buyWhat.free(BUY_FREE_SPINS) : s.buyWhat[k]);
	function askBuy(k: BuyKind) {
		if (price(k) > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		buyAsk = k;
	}
	async function confirmBuy() {
		const k = buyAsk;
		buyAsk = null;
		if (!k || spinning || price(k) > shown) return;
		message = s.buyKinds[k];
		await run(buy(k, bet, rand));
	}

	// ----- auto spin (2026-11-16, the user's ask: "an auto spin button for Abscar's Fortune") -----
	const AUTO_COUNTS = [10, 25, 50, 100];
	let autoCount = $state(25);
	/** Spins left in an auto run (0 = off). */
	let autoLeft = $state(0);
	let alive = true;

	function stopAuto(text?: string) {
		if (autoLeft > 0 && text) toast.show(text, undefined, 4000);
		autoLeft = 0;
	}

	async function runAuto() {
		if (autoLeft > 0) {
			stopAuto();
			return;
		}
		autoLeft = autoCount;
		while (alive && autoLeft > 0) {
			if (bet > shown) {
				stopAuto(t.casino.broke);
				break;
			}
			await spin();
			if (!alive || autoLeft === 0) break;
			autoLeft -= 1;
			// a big win gets its moment before the next spin
			await sleep(celebrate ? (reduce() ? 1800 : 3000) : reduce() ? 250 : 650);
		}
		if (alive && autoLeft === 0) message = message || s.autoDone;
		autoLeft = 0;
	}

	$effect(() => {
		const hide = () => document.visibilityState === 'hidden' && stopAuto();
		document.addEventListener('visibilitychange', hide);
		return () => {
			alive = false;
			autoLeft = 0;
			document.removeEventListener('visibilitychange', hide);
			// let anything waiting on a screen go (the machine is gone)
			tapGo?.();
			bonusDone?.();
		};
	});

	function stepBet(dir: 1 | -1) {
		const i = SLOT_BETS.indexOf(bet);
		bet = SLOT_BETS[Math.max(0, Math.min(SLOT_BETS.length - 1, i + dir))];
	}

	const reelText = (r: number) =>
		s.reelLabel(
			r + 1,
			screen.grid[r].map((x, row) => (x === 'weed' && weedAt(r, row) ? s.weedLabel(weedAt(r, row)!) : stickyCells.includes(cellKey(r, row)) ? `${s.symbols.wild} (${s.stickyTag})` : s.symbols[x])).join(', ')
		);
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.4 + (i % 4) * 0.25 }));
</script>

<div class="bandit" class:spinning>
	<div class="cabinet">
		<!-- the marquee: chasing bulbs round "ABSCAR'S FORTUNE" -->
		<div class="marquee" class:free-on={!!freeState}>
			<div class="bulbs" aria-hidden="true">
				{#each Array.from({ length: 22 }) as _, i (i)}<span style:--i={i}></span>{/each}
			</div>
			{#if freeState}
				<!-- in free spins the marquee is their counter -->
				<p class="title free-title font-head" role="status">{s.freeTitle(freeState.n, freeState.total)}</p>
				<p class="subtitle font-head">{s.freeSub(freeState.won)}</p>
			{:else}
				<p class="title font-head">Abscar’s Fortune</p>
				<p class="subtitle font-head">{t.casino.games.slotsSub} · {s.lines}</p>
			{/if}
		</div>

		<!-- the reels -->
		<div class="window" role="group" aria-label={t.casino.games.slots}>
			<div class="reels">
				{#each cols as col, r (r)}
					<div class="reel" role="img" aria-label={reelText(r)}>
						<div class="strip" style:transform={`translateY(calc(var(--cell) * ${-col.y}))`} style:transition={col.dur ? `transform ${col.dur}ms cubic-bezier(0.18, 0.7, 0.28, 1.06)` : 'none'}>
							{#each col.items as sym, i (i)}
								<div class="cell" class:win={(!spinning || !!freeState) && col.items.length === ROWS && winCells.has(`${r}-${i}`)}>
									<SlotSymbolView symbol={sym} size={48} value={sym === 'weed' && col.items.length === ROWS ? weedAt(r, i) : undefined} />
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<!-- free spins: the sticky WILDs, on their own layer so they stay put while the reels spin -->
			{#if stickyCells.length}
				<div class="sticky-layer" aria-hidden="true">
					{#each stickyCells as k (k)}
						{@const [reel, row] = k.split('-').map(Number)}
						<div class="sticky-cell" data-cell={k} class:fresh={stickyNew.includes(k)} class:win={winCells.has(k)} style:grid-column={reel + 1} style:grid-row={row + 1}>
							<SlotSymbolView symbol="wild" size={48} />
							<span class="sticky-tag font-head">{s.stickyTag}</span>
						</div>
					{/each}
				</div>
			{/if}
			<!-- the winning paylines, drawn over the cells -->
			{#if !spinning || freeState}
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
			{#if weedPop && !banner}
				<!-- the weeds' sum, after a winning spin with weeds -->
				<p class="weed-pop font-head num" aria-hidden="true">×{weedPop}</p>
			{/if}
			{#if banner?.kind === 'more'}
				<p class="fs-more font-head" role="status">{s.freeMore(banner.spins)}</p>
			{:else if banner}
				<!-- the free-spins intro / total: tap anywhere to go on -->
				<button type="button" class="fs-screen" data-kind={banner.kind} onclick={() => tapGo?.()}>
					<span class="rain" aria-hidden="true">
						{#each RAIN as drop, i (i)}<span style:left="{drop.x}%" style:animation-delay="{drop.d}s" style:animation-duration="{drop.dur}s"><SlotSymbolView symbol={banner.kind === 'intro' ? (i % 3 ? 'scatter' : 'weed') : i % 3 ? 'burger' : 'fries'} size={28} /></span>{/each}
					</span>
					{#if banner.kind === 'intro'}
						<span class="big font-head">{s.freeIntro(banner.spins)}</span>
						<span class="fs-sub">{s.freeIntroSub}</span>
					{:else if banner.kind === 'outro'}
						<span class="fs-kicker font-head">{s.freeOutro}</span>
						<span class="amount font-head num">+{banner.won.toLocaleString('en-US')} 🍔</span>
						<span class="fs-sub">{s.freeOutroSub(banner.spins)}</span>
					{/if}
					<span class="fs-tap">{s.continue} ▸</span>
				</button>
			{/if}
			{#if celebrate}
				<div class="celebrate" data-tier={tier} role="status">
					<div class="rain" aria-hidden="true">
						{#each RAIN as drop, i (i)}<span style:left="{drop.x}%" style:animation-delay="{drop.d}s" style:animation-duration="{drop.dur}s"><SlotSymbolView symbol={i % 3 ? 'burger' : 'fries'} size={30} /></span>{/each}
					</div>
					<p class="big font-head">{s.tiers[tier === 'none' ? 'win' : tier]}</p>
					<p class="amount font-head num">+{lastWin.toLocaleString('en-US')} 🍔</p>
				</div>
			{/if}
		</div>

		<p class="msg" aria-live="polite">{message}</p>

		<!-- the panel: credits, bet, win, spin -->
		<div class="panel">
			<div class="led"><span>{s.credits}</span><b class="num">{shown.toLocaleString('en-US')}</b></div>
			<div class="led bet">
				<div class="bet-ctl">
					<span class="bet-lbl">{t.casino.bet}</span>
					<button type="button" class="stepper minus" aria-label="−" disabled={spinning || bet === SLOT_BETS[0]} onclick={() => stepBet(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={t.casino.betLabel(bet)}>{bet.toLocaleString('en-US')}</b>
					<button type="button" class="stepper plus" aria-label="+" disabled={spinning || bet === SLOT_BETS[SLOT_BETS.length - 1]} onclick={() => stepBet(1)}>+</button>
				</div>
			</div>
			<div class="led win"><span>{s.lastWin}</span><b class="num">{lastWin.toLocaleString('en-US')}</b></div>
			<button type="button" class="spin font-head" bind:this={spinBtn} disabled={spinning || autoLeft > 0} onclick={() => void spin()}>{spinning ? '…' : s.spin}</button>
		</div>

		<!-- auto spin: how many, then AUTO (it turns into STOP while running) -->
		<div class="auto" role="group" aria-label={s.autoLabel}>
			<button type="button" class="auto-btn font-head" aria-pressed={autoLeft > 0} disabled={autoLeft === 0 && (spinning || bet > shown)} onclick={() => void runAuto()}>
				{autoLeft > 0 ? s.autoStop(autoLeft) : s.auto(autoCount)}
			</button>
			{#if autoLeft === 0}
				{#each AUTO_COUNTS as n (n)}
					<button type="button" class="auto-n num font-head" aria-pressed={autoCount === n} aria-label={s.autoCount(n)} onclick={() => (autoCount = n)}>{n}</button>
				{/each}
			{/if}
		</div>

		<!-- buy bonus: free spins, the Burger Box or a wheel spin at the current bet; asked first -->
		<div class="buy" role="group" aria-label={s.buy}>
			{#if buyAsk}
				<p class="buy-ask" role="status">{s.buyAsk(buyWhat(buyAsk), price(buyAsk))}</p>
				<div class="flex gap-1.5">
					<button type="button" class="buy-yes font-head" disabled={spinning || price(buyAsk) > shown} onclick={() => void confirmBuy()}>{s.buyYes}</button>
					<button type="button" class="buy-no font-head" onclick={() => (buyAsk = null)}>{s.buyNo}</button>
				</div>
			{:else}
				<span class="buy-label font-head">{s.buy}</span>
				<div class="buy-list">
					{#each BUY_KINDS as k (k)}
						<button type="button" class="buy-btn" disabled={spinning || autoLeft > 0 || price(k) > shown} onclick={() => askBuy(k)}>
							<SlotSymbolView symbol={k === 'free' ? 'scatter' : k} size={28} />
							<span class="min-w-0 text-left">
								<b class="block font-head">{s.buyKinds[k]}</b>
								<span class="num">{s.buyPrice(price(k))}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- the Burger Box: open boxes until one says COLLECT (the prizes are worked out already) -->
		{#if boxGame}
			<div class="bonus-screen box-screen" role="group" aria-label={s.box} bind:this={bonusEl}>
				<p class="bonus-title font-head">{s.box}</p>
				<p class="bonus-help">{s.boxHelp}</p>
				<p class="bonus-sofar font-head num" aria-live="polite">{s.boxSoFar(boxGame.won)}</p>
				<div class="boxes">
					{#each boxGame.cells as c, i (i)}
						<button
							type="button"
							class="pick"
							class:opened={c !== null}
							class:collect={c === 'collect'}
							disabled={boxGame.done || c !== null}
							aria-label={c === null ? s.boxClosed(i + 1) : s.boxOpen(i + 1, c === 'collect' ? s.collect : s.boxPrize(c))}
							onclick={() => openBox(i)}
						>
							{#if c === null}
								<SlotSymbolView symbol="box" size={40} />
							{:else if c === 'collect'}
								<span class="pick-text font-head">{s.collect}</span>
							{:else}
								<span class="pick-text font-head num">{s.boxPrize(c)}</span>
							{/if}
						</button>
					{/each}
				</div>
				{#if boxGame.done}
					<div class="bonus-result" role="status">
						<p class="fs-kicker font-head">{s.boxWon}</p>
						<p class="amount font-head num">+{boxGame.bonus.win.toLocaleString('en-US')} 🍔</p>
						<button type="button" class="bonus-go font-head" onclick={closeBonus}>{s.continue}</button>
					</div>
				{/if}
			</div>
		{/if}

		<!-- the bonus wheel: every slice as likely; it turns to the slice worked out already -->
		{#if wheelGame}
			<div class="bonus-screen wheel-screen" role="group" aria-label={s.wheel} bind:this={bonusEl}>
				<p class="bonus-title font-head">{s.wheel}</p>
				<p class="bonus-help">{s.wheelHelp}</p>
				<div class="wheel-wrap">
					<svg viewBox="-116 -124 232 240" role="img" aria-label={s.wheelLabel(WHEEL.map((_, i) => (WHEEL[i].jackpot ? `${s.jackpot} ${sliceLabel(i, bet)}` : sliceLabel(i, bet))).join(', '))}>
						<defs>
							<radialGradient id="{u}-wgold" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#fff6b0" /><stop offset="0.45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
						</defs>
						<circle r="112" fill="url(#{u}-wgold)" stroke="#2a1408" stroke-width="4" />
						<g class="wheel-rot" style:transform="rotate({wheelGame.angle}deg)" style:transition={wheelGame.turning && !reduce() ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none'}>
							{#each WHEEL as sl, i (i)}
								{@const a0 = ((i * SLICE - SLICE / 2) * Math.PI) / 180}
								{@const a1 = ((i * SLICE + SLICE / 2) * Math.PI) / 180}
								<path
									d="M0 0 L{(100 * Math.sin(a0)).toFixed(2)} {(-100 * Math.cos(a0)).toFixed(2)} A100 100 0 0 1 {(100 * Math.sin(a1)).toFixed(2)} {(-100 * Math.cos(a1)).toFixed(2)} Z"
									fill={sl.jackpot ? `url(#${u}-wgold)` : sl.spins ? '#7a3fd0' : i % 2 ? '#ffb020' : '#e2261f'}
									stroke="#2a1408"
									stroke-width="1.6"
								/>
								<g transform="rotate({i * SLICE})">
									{#if sl.jackpot}
										<text y="-80" class="w-small" fill="#7a1a00">{s.jackpot}</text>
										<text y="-63" class="w-big" fill="#7a1a00">{sliceLabel(i, bet)}</text>
									{:else if sl.spins}
										<text y="-74" class="w-big" fill="#fff6b0">{sl.spins}</text>
										<text y="-60" class="w-small" fill="#fff6b0">FREE</text>
									{:else}
										<text y="-68" class="w-big" fill={i % 2 ? '#3d0508' : '#fff6b0'}>{sliceLabel(i, bet)}</text>
									{/if}
								</g>
							{/each}
						</g>
						{#each Array.from({ length: 24 }) as _, i (i)}
							<circle class="w-bulb" cx={(106 * Math.sin((i * 15 * Math.PI) / 180)).toFixed(2)} cy={(-106 * Math.cos((i * 15 * Math.PI) / 180)).toFixed(2)} r="3" style:--i={i} />
						{/each}
						<circle r="17" fill="url(#{u}-wgold)" stroke="#2a1408" stroke-width="3" />
						<path d="M-9 -8 Q0 -16 9 -8" fill="none" stroke="#fff6d0" stroke-width="2.4" stroke-linecap="round" />
						<!-- the pointer at the top -->
						<path d="M-13 -123 L13 -123 L0 -96 Z" fill="#e2261f" stroke="#2a1408" stroke-width="3" stroke-linejoin="round" />
					</svg>
				</div>
				{#if wheelGame.done}
					<div class="bonus-result" role="status">
						<p class="fs-kicker font-head">
							{WHEEL[wheelGame.bonus.slice].jackpot ? s.jackpot : wheelGame.bonus.spins ? s.wheelSpins(wheelGame.bonus.spins) : s.wheel}
						</p>
						{#if wheelGame.bonus.win}<p class="amount font-head num">+{wheelGame.bonus.win.toLocaleString('en-US')} 🍔</p>{/if}
						<button type="button" class="bonus-go font-head" onclick={closeBonus}>{s.continue}</button>
					</div>
				{:else}
					<button type="button" class="wheel-btn font-head" disabled={wheelGame.turning} onclick={() => void spinWheel()}>{wheelGame.turning ? s.wheelSpinning : s.wheelSpin}</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- the lever: a big smoking holk, pulled down to spin -->
	<button type="button" class="lever" class:pulled aria-label={s.pull} disabled={spinning} onclick={() => void spin()}>
		<svg viewBox="-40 -90 102 316" aria-hidden="true">
			<defs>
				<radialGradient id="{u}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
				<filter id="{u}-puff-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.4" /></filter>
				<filter id="{u}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" /></filter>
				<linearGradient id="{u}-chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a6470" /><stop offset="0.35" stop-color="#f4f7fa" /><stop offset="0.6" stop-color="#9aa6b2" /><stop offset="1" stop-color="#3a424c" /></linearGradient>
			</defs>
			<!-- the mount on the cabinet's side -->
			<rect x="-14" y="170" width="50" height="50" rx="10" fill="url(#{u}-chrome)" stroke="#1a0e05" stroke-width="2.5" />
			<circle cx="11" cy="190" r="13" fill="#2a1c0c" stroke="url(#{u}-chrome)" stroke-width="4" />
			<!-- the arm: a fat holk, filter end in the mount, glowing end up top, smoking -->
			<g class="arm">
				{@html holk(u, 11, 196, 11, 14, 15, 40, 36)}
				{@html smoke(u, 11, -4, 1.5)}
			</g>
		</svg>
	</button>
</div>

<details class="paytable mt-3 text-xs text-muted">
	<summary class="min-h-11 cursor-pointer content-center font-semibold">{s.paytable}</summary>
	<p class="pb-2">{s.how}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-1.5 pb-1">
		{#each SYMBOLS as sym (sym)}
			<li class="pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				<SlotSymbolView symbol={sym} size={34} value={sym === 'weed' ? 5 : undefined} />
				<span class="min-w-0">
					<b class="block text-fg">{s.symbols[sym]}</b>
					{#if sym === 'scatter'}
						{s.scatterRow(...SCATTER_PAYS, ...FREE_SPINS)}
					{:else if sym === 'weed'}
						{s.weedRow}
					{:else if sym === 'box'}
						{s.boxRow}
					{:else if sym === 'wheel'}
						{s.wheelRow}
					{:else}
						{s.payRow(...PAYS[sym as PaySymbol], PAYS2[sym as PaySymbol])}
					{/if}
				</span>
			</li>
		{/each}
	</ul>
	<p class="pb-1">{s.payNote}</p>
	<p class="pb-1">{s.buyNote(BUY_PRICE.free, BUY_PRICE.box, BUY_PRICE.wheel)}</p>
	<p class="pb-1">{s.maxNote(MAX_WIN)}</p>
</details>

<style>
	/* the reels fill what's left beside the lever: 5 cells + the window's and cabinet's edges (≈ 58 px) */
	.bandit {
		--lever: 92px;
		--cell: clamp(38px, calc((100cqi - var(--lever) - 58px) / 5), 92px);
		container-type: inline-size;
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--lever);
		align-items: end;
		gap: 2px;
		max-width: 660px;
	}
	@media (max-width: 519px) {
		.bandit {
			--lever: 58px;
		}
	}
	@supports not (width: 1cqi) {
		.bandit {
			--cell: 44px;
		}
	}
	.cabinet {
		position: relative;
		padding: 10px 10px 12px;
		border: 4px solid #ffc928;
		border-radius: 22px 22px 14px 14px;
		background:
			radial-gradient(120% 60% at 50% 0%, rgb(255 210 58 / 0.25), transparent 60%),
			linear-gradient(180deg, #b3141b, #6d0a10 70%, #3d0508);
		box-shadow:
			0 0 0 3px #3d0508,
			0 0 24px rgb(255 130 30 / 0.45),
			inset 0 2px 0 rgb(255 255 255 / 0.25);
	}
	/* the marquee */
	.marquee {
		position: relative;
		margin-bottom: 10px;
		padding: 12px 8px 8px;
		border-radius: 14px;
		background: linear-gradient(180deg, #2a0a06, #120302);
		box-shadow: inset 0 0 0 2px #ffc928;
		text-align: center;
		overflow: hidden;
	}
	.bulbs {
		position: absolute;
		inset: 4px;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-content: space-between;
		pointer-events: none;
	}
	.bulbs span {
		width: 7px;
		height: 7px;
		margin: 0 2px;
		border-radius: 999px;
		background: #ffe9a0;
		box-shadow: 0 0 6px #ffc928;
		animation: bulb 1.1s steps(1) infinite;
		animation-delay: calc(var(--i) * -0.1s);
	}
	@keyframes bulb {
		50% {
			background: #7a4a10;
			box-shadow: none;
		}
	}
	.title {
		position: relative;
		font-size: clamp(22px, 7.4cqi, 42px);
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff6b0 0%, #ffc928 45%, #e07a00 55%, #ffd23a 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-stroke: 1px #5a2a00;
		filter: drop-shadow(0 2px 0 #3d0508) drop-shadow(0 0 10px rgb(255 160 40 / 0.6));
	}
	.subtitle {
		position: relative;
		margin-top: 4px;
		color: #ffd9a0;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.26em;
		text-transform: uppercase;
	}
	/* the reel window */
	.window {
		position: relative;
		padding: 6px;
		border-radius: 12px;
		background: #120302;
		box-shadow:
			inset 0 0 0 3px #e0a400,
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
		background: linear-gradient(180deg, #d8cdb6, #fffaf0 18%, #fffaf0 82%, #d8cdb6);
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
	.cell :global(.slot-sym) {
		width: calc(var(--cell) * 0.82);
		height: calc(var(--cell) * 0.82);
	}
	.cell.win {
		background: radial-gradient(circle, rgb(255 230 80 / 0.75), rgb(255 160 0 / 0.25) 60%, transparent 72%);
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
	/* sticky WILDs: the same grid as the cells, over the reels (the reels spin under them) */
	/* no z-index: it paints over the reels, and under the paylines and screens that come after it */
	.sticky-layer {
		position: absolute;
		inset: 6px;
		display: grid;
		grid-template-columns: repeat(5, var(--cell));
		grid-template-rows: repeat(3, var(--cell));
		justify-content: center;
		column-gap: 4px;
		pointer-events: none;
	}
	.sticky-cell {
		position: relative;
		display: grid;
		place-items: center;
		border-radius: 8px;
		background: radial-gradient(circle, #fff6d0, #ffe9a8 60%, #e8c76a);
		box-shadow:
			inset 0 0 0 3px #b265ff,
			0 0 10px rgb(178 101 255 / 0.85);
	}
	.sticky-cell :global(.slot-sym) {
		width: calc(var(--cell) * 0.78);
		height: calc(var(--cell) * 0.78);
	}
	.sticky-cell.win {
		box-shadow:
			inset 0 0 0 3px #ffd23a,
			0 0 14px rgb(255 210 58 / 0.95);
	}
	.sticky-cell.fresh {
		animation: stick-in 0.55s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	@keyframes stick-in {
		from {
			transform: scale(1.5);
			opacity: 0.4;
		}
	}
	.sticky-tag {
		position: absolute;
		bottom: 1px;
		left: 50%;
		transform: translateX(-50%);
		padding: 0 4px;
		border-radius: 4px;
		background: #7a3fd0;
		color: #fff6b0;
		font-size: clamp(7px, calc(var(--cell) * 0.13), 11px);
		font-weight: 900;
		letter-spacing: 0.08em;
		line-height: 1.35;
	}
	/* the weeds' sum after a winning spin with weeds */
	.weed-pop {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 3;
		margin: 0;
		transform: translate(-50%, -50%);
		padding: 2px 18px;
		border: 3px solid #b6ff7a;
		border-radius: 999px;
		background: radial-gradient(circle, #2f9e45, #0b4a1c);
		color: #fff6b0;
		font-size: clamp(26px, 9cqi, 50px);
		font-weight: 900;
		text-shadow: 0 3px 0 #083a17;
		box-shadow: 0 0 22px rgb(125 255 106 / 0.75);
		pointer-events: none;
		animation: weed-pop 1.8s ease-out both;
	}
	@keyframes weed-pop {
		0% {
			transform: translate(-50%, -50%) scale(2.2);
			opacity: 0;
		}
		18% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -62%) scale(0.92);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sticky-cell.fresh,
		.weed-pop {
			animation: none;
		}
	}
	/* ---------- free spins ---------- */
	/* the marquee turns purple and counts the free spins */
	.marquee.free-on {
		background: linear-gradient(180deg, #3a0a5a, #170326);
		box-shadow:
			inset 0 0 0 2px #ff5ca8,
			0 0 16px rgb(255 92 168 / 0.6);
	}
	.free-title {
		font-size: clamp(20px, 6.4cqi, 36px);
		background: linear-gradient(180deg, #ffffff 0%, #ffb3d9 45%, #ff5ca8 55%, #ffd23a 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-stroke: 1px #4a0a3a;
	}
	.bandit:has(.free-on) .cabinet {
		border-color: #ff5ca8;
		box-shadow:
			0 0 0 3px #3a0a5a,
			0 0 28px rgb(255 92 168 / 0.55),
			inset 0 2px 0 rgb(255 255 255 / 0.25);
	}
	/* "+8 FREE SPINS!" when they come again */
	.fs-more {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 3;
		transform: translate(-50%, -50%);
		padding: 8px 16px;
		border: 3px solid #ffd23a;
		border-radius: 12px;
		background: rgb(122 20 160 / 0.94);
		color: #fff6b0;
		font-size: clamp(15px, 5cqi, 24px);
		font-weight: 900;
		letter-spacing: 0.08em;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 0 20px rgb(255 92 168 / 0.7);
		animation: big-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	/* the intro and the total: over the reels, tap to go on */
	.fs-screen {
		position: absolute;
		inset: 0;
		z-index: 3;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 2px;
		width: 100%;
		border-radius: 12px;
		background: radial-gradient(circle, rgb(90 10 120 / 0.8), rgb(10 0 20 / 0.92));
		color: #fff6b0;
		overflow: hidden;
		text-align: center;
	}
	.fs-screen .big {
		position: relative;
		color: #ffd23a;
		text-shadow: 0 3px 0 #7a1aa0, 0 0 18px rgb(255 92 168 / 0.9);
	}
	.fs-sub {
		position: relative;
		font-size: 12.5px;
		font-weight: 700;
	}
	.fs-kicker {
		position: relative;
		color: #ffb3d9;
		font-size: clamp(14px, 4.4cqi, 20px);
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.fs-tap {
		position: relative;
		margin-top: 6px;
		padding: 2px 10px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.12);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	/* ---------- the bonus screens (over the whole cabinet) ---------- */
	.bonus-screen {
		position: absolute;
		inset: 0;
		z-index: 6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: safe center;
		gap: 4px;
		padding: 12px 10px;
		border-radius: 18px 18px 10px 10px;
		overflow-y: auto;
		color: #fff6b0;
		text-align: center;
		animation: bonus-in 0.35s ease-out both;
	}
	@keyframes bonus-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}
	.box-screen {
		background:
			radial-gradient(90% 60% at 50% 0%, rgb(255 210 58 / 0.3), transparent 60%),
			linear-gradient(180deg, #8a0a10, #3d0508);
	}
	.wheel-screen {
		background:
			radial-gradient(90% 60% at 50% 40%, rgb(255 92 168 / 0.25), transparent 65%),
			linear-gradient(180deg, #2a0a4a, #0e0218);
	}
	.bonus-title {
		font-size: clamp(22px, 7cqi, 36px);
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff6b0 0%, #ffc928 45%, #e07a00 55%, #ffd23a 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-stroke: 1px #5a2a00;
		filter: drop-shadow(0 2px 0 #3d0508);
	}
	.bonus-help {
		max-width: 34em;
		color: #ffe1c0;
		font-size: 11.5px;
		line-height: 1.3;
	}
	.bonus-sofar {
		color: #7dff6a;
		font-size: 15px;
		font-weight: 900;
		text-shadow: 0 0 8px rgb(100 255 90 / 0.6);
	}
	.boxes {
		display: grid;
		grid-template-columns: repeat(4, minmax(44px, 72px));
		gap: 8px;
		margin-top: 2px;
	}
	.pick {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		min-height: 44px;
		border: 2px solid #ffc928;
		border-radius: 12px;
		background: radial-gradient(circle at 40% 30%, #5a0a10, #2a0306);
		box-shadow: 0 3px 0 #1a0203;
		transition: transform 0.15s;
	}
	.pick:not(:disabled):hover {
		transform: translateY(-2px) rotate(-3deg);
	}
	.pick:not(.opened):disabled {
		opacity: 0.45;
	}
	.pick.opened {
		background: radial-gradient(circle, #fff6d0, #ffc928 80%);
		border-color: #fff6b0;
		animation: pick-pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1);
	}
	.pick.collect {
		background: radial-gradient(circle, #ff7a6a, #b3141b 80%);
	}
	@keyframes pick-pop {
		from {
			transform: rotateY(90deg) scale(0.8);
		}
	}
	.pick-text {
		color: #3d0508;
		font-size: clamp(12px, 3.6cqi, 17px);
		font-weight: 900;
	}
	.pick.collect .pick-text {
		color: #fff6b0;
		font-size: clamp(9px, 2.6cqi, 12px);
		letter-spacing: 0.04em;
	}
	.bonus-result {
		display: grid;
		justify-items: center;
		gap: 2px;
		margin-top: 4px;
		animation: big-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.bonus-go,
	.wheel-btn {
		min-height: 48px;
		margin-top: 4px;
		padding: 0 22px;
		border: 3px solid #ffe9a0;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 30%, #ff7a4a, #e2261f 55%, #8a0a10);
		color: #fff;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 2px 0 #5a0508;
		box-shadow: 0 4px 0 #5a0508;
	}
	.wheel-btn:disabled {
		filter: grayscale(0.4) brightness(0.85);
	}
	.wheel-wrap {
		width: min(270px, 88%);
		margin-top: 2px;
	}
	.wheel-wrap svg {
		display: block;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.6));
	}
	.wheel-rot {
		transform-box: fill-box;
		transform-origin: center;
	}
	.w-big,
	.w-small {
		font-family: Bahnschrift, 'Arial Black', sans-serif;
		font-weight: 900;
		text-anchor: middle;
		paint-order: stroke;
	}
	.w-big {
		font-size: 15px;
	}
	.w-small {
		font-size: 9px;
		letter-spacing: 0.06em;
	}
	.w-bulb {
		fill: #fff6b0;
		animation: bulb 1.1s steps(1) infinite;
		animation-delay: calc(var(--i) * -0.12s);
	}
	/* ---------- buy bonus ---------- */
	.buy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed rgb(255 201 40 / 0.4);
	}
	.buy-label {
		color: #ffd23a;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.buy-list {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
		width: 100%;
	}
	.buy-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		min-height: 48px;
		padding: 4px 6px;
		border-radius: 10px;
		background: #0c0201;
		box-shadow: inset 0 0 0 2px #5a1a0a;
		color: #ffb27a;
		font-size: 11px;
		line-height: 1.15;
	}
	.buy-btn b {
		color: #ffd23a;
		font-size: 11.5px;
		overflow-wrap: anywhere;
	}
	.buy-btn:not(:disabled):hover {
		box-shadow: inset 0 0 0 2px #ffc928;
	}
	.buy-btn:disabled {
		opacity: 0.45;
	}
	.buy-btn :global(.slot-sym) {
		flex: none;
	}
	.buy-ask {
		flex: 1 1 14em;
		color: #fff6b0;
		font-size: 13px;
		font-weight: 700;
	}
	.buy-yes,
	.buy-no {
		min-height: 44px;
		padding: 0 16px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.buy-yes {
		border: 2px solid #ffe9a0;
		background: #e2261f;
		color: #fff;
	}
	.buy-yes:disabled {
		opacity: 0.5;
	}
	.buy-no {
		border: 2px solid #ffc928;
		background: #3d0508;
		color: #ffd23a;
	}
	@container (max-width: 420px) {
		.buy-btn :global(.slot-sym) {
			display: none;
		}
	}
	.celebrate {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		border-radius: 12px;
		background: radial-gradient(circle, rgb(60 10 0 / 0.55), rgb(0 0 0 / 0.75));
		overflow: hidden;
		pointer-events: none;
	}
	.big {
		font-size: clamp(26px, 9cqi, 52px);
		font-weight: 900;
		letter-spacing: 0.06em;
		color: #ffd23a;
		-webkit-text-stroke: 1.5px #5a2a00;
		text-shadow: 0 3px 0 #b3141b, 0 0 18px rgb(255 200 40 / 0.8);
		animation: big-in 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.celebrate[data-tier='jackpot'] .big {
		color: #fff;
		text-shadow: 0 3px 0 #b3141b, 0 0 22px #ff5ca8, 0 0 34px #ffd23a;
	}
	.amount {
		font-size: clamp(18px, 5.5cqi, 30px);
		font-weight: 900;
		color: #fff6b0;
		text-shadow: 0 2px 0 #3d0508;
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
		color: #ffe9c0;
		font-size: 12.5px;
		line-height: 1.25;
		text-align: center;
	}
	/* the panel */
	.panel {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
		grid-template-areas: 'cred bet win spin';
		align-items: stretch;
		gap: 6px;
	}
	.led:first-child {
		grid-area: cred;
	}
	.led.bet {
		grid-area: bet;
		container-type: inline-size;
	}
	/* BET over − 1,000 +; when the box is too narrow for "10,000" between the buttons (phones, 4 columns
	   at ≈ 560–700 px): − BET + on top, the number under them */
	.bet-ctl {
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
	.bet-lbl {
		grid-area: lbl;
	}
	.bet-ctl .minus {
		grid-area: minus;
	}
	.bet-ctl b {
		grid-area: num;
	}
	.bet-ctl .plus {
		grid-area: plus;
	}
	@container (max-width: 135px) {
		.bet-ctl {
			grid-template-areas:
				'minus lbl plus'
				'num num num';
			column-gap: 8px;
			row-gap: 1px;
		}
	}
	/* very narrow (4 columns at ≈ 560 px): smaller rings, the tap area stays 44 px */
	@container (max-width: 104px) {
		.bet-ctl {
			column-gap: 3px;
		}
		.bet-ctl .stepper {
			width: 24px;
			height: 24px;
		}
		.bet-ctl .stepper::after {
			inset: -10px;
		}
	}
	.led.win {
		grid-area: win;
	}
	.spin {
		grid-area: spin;
	}
	/* narrow: burgers + win on top, bet + spin under them */
	@container (max-width: 470px) {
		.panel {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			grid-template-areas:
				'cred win'
				'bet spin';
		}
	}
	.led {
		display: grid;
		align-content: center;
		justify-items: center;
		min-width: 0;
		padding: 4px 4px 5px;
		border-radius: 8px;
		background: #0c0201;
		box-shadow: inset 0 0 0 2px #5a1a0a;
	}
	.led span {
		color: #ffb27a;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.led b {
		color: #ff4b2b;
		font-family: ui-monospace, Consolas, monospace;
		font-size: 17px;
		font-weight: 800;
		text-shadow: 0 0 8px rgb(255 60 30 / 0.8);
	}
	.led.win b {
		color: #7dff6a;
		text-shadow: 0 0 8px rgb(100 255 90 / 0.7);
	}
	.stepper {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: #3d0508;
		color: #ffd23a;
		font-weight: 900;
		box-shadow: inset 0 0 0 1.5px #ffc928;
		/* 44 px to tap, the ring is the drawing */
		position: relative;
	}
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
		border: 3px solid #ffe9a0;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 30%, #ff7a4a, #e2261f 55%, #8a0a10);
		color: #fff;
		font-size: 17px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 2px 0 #5a0508;
		box-shadow: 0 4px 0 #5a0508, 0 0 14px rgb(255 80 40 / 0.6);
	}
	.spin:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: 0 1px 0 #5a0508;
	}
	.spin:disabled {
		filter: grayscale(0.5) brightness(0.8);
	}
	/* auto spin row */
	.auto {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
	}
	.auto-btn {
		min-height: 44px;
		padding: 0 16px;
		border: 2px solid #ffc928;
		border-radius: 999px;
		background: #3d0508;
		color: #ffd23a;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.auto-btn[aria-pressed='true'] {
		background: #ffc928;
		color: #3d0508;
		box-shadow: 0 0 12px rgb(255 201 40 / 0.7);
		animation: auto-pulse 1.2s ease-in-out infinite alternate;
	}
	.auto-btn:disabled {
		opacity: 0.45;
	}
	@keyframes auto-pulse {
		to {
			box-shadow: 0 0 4px rgb(255 201 40 / 0.4);
		}
	}
	.auto-n {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		background: #0c0201;
		color: #ffb27a;
		font-size: 13px;
		font-weight: 800;
		box-shadow: inset 0 0 0 2px #5a1a0a;
	}
	.auto-n[aria-pressed='true'] {
		color: #ffd23a;
		box-shadow: inset 0 0 0 2px #ffc928;
	}
	/* the lever: a big holk on a chrome mount */
	.lever {
		align-self: stretch;
		display: flex;
		align-items: flex-end;
		min-width: 44px;
		padding: 0;
		border-radius: 12px;
	}
	.lever svg {
		width: 100%;
		height: auto;
		max-height: 100%;
		overflow: visible;
	}
	.lever .arm {
		transform-origin: 11px 190px;
		transition: transform 0.25s ease-in;
	}
	.lever.pulled .arm {
		transform: rotate(68deg) scaleY(0.88);
	}
	.lever:not(.pulled) .arm {
		transition: transform 0.55s cubic-bezier(0.3, 1.8, 0.5, 1);
	}
	.lever:hover:not(:disabled) .arm {
		transform: rotate(8deg);
	}
	.pay-row {
		background: rgb(127 127 127 / 0.1);
	}
	@media (prefers-reduced-motion: reduce) {
		.bulbs span,
		.cell.win,
		.rain,
		.w-bulb,
		.pick.opened,
		.bonus-screen,
		.bonus-result,
		.fs-more {
			animation: none;
		}
		.rain {
			display: none;
		}
		.lever .arm,
		.lever:not(.pulled) .arm {
			transition: none;
		}
		.auto-btn[aria-pressed='true'] {
			animation: none;
		}
	}
</style>
