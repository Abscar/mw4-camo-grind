<!--
	Abscar's Stash, the tumble slot (stash.ts; 2026-11-20, the user's ask: "a slot that works like 'sweet
	bonanza' with an Abscar-friendly name, drugs instead of sweets"). A smoky stash-box cabinet: 6 × 5
	symbols that pay anywhere (8 or more alike), tumble away and drop new ones in, THE HOLK as the scatter
	(4+ = Sky High Spins), smoke clouds that multiply a winning spin, Double chance, buy bonus, auto spin,
	turbo and skip.
	The whole play is worked out and booked at once (squad.recordGame), then played back step by step from
	the engine's tumbles; `hidden` = burgers won but not shown yet. Reduced motion: nothing moves, but it
	still goes step by step.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import {
		anteCost,
		burgersOf,
		buy,
		colOfKey,
		finalGrid,
		play,
		rowOfKey,
		winTier,
		BUY_KINDS,
		BUY_PRICE,
		COLS,
		FREE_SPINS,
		HOLK_PAYS,
		HOLKS_TO_RETRIGGER,
		HOLKS_TO_START,
		MAX_WIN,
		PAYS,
		RETRIGGER,
		ROWS,
		STASH_BETS,
		SYMS,
		type Grid,
		type Kind,
		type Piece,
		type StashBuy,
		type StashPlay,
		type StashSpin,
		type Step,
		type WinTier
	} from '#lib/stash.ts';
	import { drawUntil, lucky, stashMatches, STASH_TRIES } from '#lib/casino-rig.ts';
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import StashSymbol from './StashSymbol.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	$effect(() => {
		pending = hidden;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const s = t.casino.stash;
	const sl = t.casino.slots;

	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
	/** two frames (so a new piece is drawn above the board before it falls); a hidden tab gets no frames, so a timer too */
	const frame = () => Promise.race([new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))), sleep(80)]);
	const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

	/* ---------- remembered per device: turbo and Double chance ---------- */
	const TURBO_KEY = 'mw4-camo-grind:stash-turbo';
	const ANTE_KEY = 'mw4-camo-grind:stash-ante';
	let turbo = $state(false);
	let ante = $state(false);
	$effect(() => {
		try {
			turbo = localStorage.getItem(TURBO_KEY) === '1';
			ante = localStorage.getItem(ANTE_KEY) === '1';
		} catch {
			// storage blocked: normal speed, no Double chance
		}
	});
	function remember(key: string, on: boolean) {
		try {
			localStorage.setItem(key, on ? '1' : '0');
		} catch {
			// this visit only
		}
	}
	function toggleTurbo() {
		turbo = !turbo;
		remember(TURBO_KEY, turbo);
	}
	function toggleAnte() {
		ante = !ante;
		buyAsk = null;
		remember(ANTE_KEY, ante);
	}

	/* ---------- speed ---------- */
	let skip = $state(false);
	/** how long things take: 0 = at once (skip); reduced motion = nothing moves but it still goes step by step, quicker */
	const k = () => (skip ? 0 : reduce() ? 0.3 : turbo ? 0.45 : 1);
	const still = () => skip || reduce();
	const MS = { out: 300, fall: 430, stagger: 42, win: 700, pop: 260, cloud: 1100, holk: 1000 };
	const ms = (n: number) => Math.round(n * k());
	const wait = (n: number) => (k() ? sleep(ms(n)) : Promise.resolve());

	/* ---------- what the board shows ---------- */
	interface RP {
		/** unique across plays (piece ids start over every play) */
		k: string;
		p: Piece;
		c: number;
		r: number;
		/** where a new piece falls to (it starts above the board) */
		to?: number;
		fx: '' | 'win' | 'pop' | 'glow';
		/** no movement this frame */
		snap: boolean;
		/** transition delay, ms */
		d: number;
	}
	let gen = 0;
	let pieces = $state<RP[]>([]);
	let pops = $state<{ id: number; x: number; y: number; text: string; kind: string }[]>([]);
	let popId = 0;
	const keyOf = (p: Piece) => `${gen}-${p.id}`;
	function pop(x: number, y: number, text: string, kind = 'pay', life = 1100) {
		const id = ++popId;
		pops = [...pops, { id, x, y, text, kind }];
		setTimeout(() => (pops = pops.filter((q) => q.id !== id)), still() ? Math.min(life, 700) : life);
	}
	const live = $derived(pieces.filter((x) => x.fx !== 'pop'));
	const holksOn = $derived(live.filter((x) => x.p.kind === 'holk').length);
	const cloudsOn = $derived(live.reduce((n, x) => n + (x.p.kind === 'cloud' ? (x.p.x ?? 0) : 0), 0));

	/** the board exactly as worked out (after an animation, or at once when skipping) */
	function place(grid: Grid) {
		pieces = grid.flatMap((col, c) => col.map((p, r) => ({ k: keyOf(p), p, c, r, fx: '' as const, snap: true, d: 0 })));
	}
	/** a new spin: everything drops out of the bottom, the new screen drops in reel by reel */
	async function dropIn(grid: Grid) {
		if (still()) {
			place(grid);
			await wait(MS.fall);
			return;
		}
		if (pieces.length) {
			pieces = pieces.map((x) => ({ ...x, r: x.r + ROWS + 1, fx: '', snap: false, d: ms(x.c * MS.stagger) }));
			await wait(MS.out + COLS * MS.stagger);
		}
		pieces = grid.flatMap((col, c) => col.map((p, r) => ({ k: keyOf(p), p, c, r: r - ROWS - 1, to: r, fx: '' as const, snap: true, d: ms(c * MS.stagger) })));
		await frame();
		pieces = pieces.map((x) => ({ ...x, r: x.to ?? x.r, snap: false }));
		await wait(MS.fall + COLS * MS.stagger);
		pieces = pieces.map((x) => ({ ...x, d: 0 }));
	}

	/* ---------- the money ---------- */
	let bet = $state(STASH_BETS[0]);
	const cost = $derived(ante ? anteCost(bet) : bet);
	const shown = $derived(Math.max(0, balance - hidden));
	let busy = $state(false);
	let cur: StashPlay | null = null;
	let shownCents = 0;
	let lastWin = $state(0);
	/** this spin's tumble win so far, hundredths of the bet */
	let tumbleCents = $state(0);
	const shownText = $derived(shown.toLocaleString('en-US'));
	const winText = $derived(lastWin.toLocaleString('en-US'));
	let message = $state('');
	let tier = $state<WinTier>('none');
	let celebrate = $state(false);
	let freeState = $state<{ n: number; total: number; won: number } | null>(null);
	let banner = $state<{ kind: 'intro'; bonus: 'free' | 'super'; spins: number } | { kind: 'more'; spins: number } | { kind: 'outro'; spins: number; won: number } | null>(null);
	let spinBtn = $state<HTMLButtonElement>();
	let overlayEl = $state<HTMLElement>();
	let alive = true;

	function addCents(n: number) {
		if (!cur || !n) return;
		shownCents += n;
		lastWin = Math.min(cur.win, Math.round(burgersOf(shownCents, bet)));
		hidden = Math.max(0, cur.win - lastWin);
	}
	const name = (kind: Kind) => s.symbols[kind];
	/** the middle of some cells, in cell units */
	function centre(cells: number[]) {
		const x = cells.reduce((n, key) => n + colOfKey(key), 0) / cells.length;
		const y = cells.reduce((n, key) => n + rowOfKey(key), 0) / cells.length;
		return { x, y };
	}

	/** One tumble: the winners light up and burst, everything above falls, new pieces drop in. */
	async function showStep(prev: Grid, step: Step) {
		const goneIds = new Set(step.gone.map((key) => prev[colOfKey(key)][rowOfKey(key)].id));
		pieces = pieces.map((x) => (goneIds.has(x.p.id) ? { ...x, fx: 'win' } : x));
		const lines: string[] = [];
		for (const w of step.wins) {
			const { x, y } = centre(w.cells);
			const n = burgersOf(w.pay, bet);
			pop(x, y, `+${fmt(n)}`);
			lines.push(s.winLine(w.count, name(w.sym), fmt(n)));
			tumbleCents += w.pay;
		}
		message = lines.join(' · ');
		sound.play('camo');
		await wait(MS.win);
		if (!alive) return;
		pieces = pieces.map((x) => (goneIds.has(x.p.id) ? { ...x, fx: 'pop' } : x));
		await wait(MS.pop);
		const byId = new Map(pieces.filter((x) => !goneIds.has(x.p.id)).map((x) => [x.p.id, x]));
		const instant = still();
		const next: RP[] = [];
		step.grid.forEach((col, c) => {
			const fresh = col.filter((p) => !byId.has(p.id)).length;
			col.forEach((p, r) => {
				const old = byId.get(p.id);
				if (old) next.push({ ...old, c, r, snap: instant, d: 0 });
				else next.push({ k: keyOf(p), p, c, r: instant ? r : r - fresh - 0.4, to: r, fx: '', snap: true, d: 0 });
			});
		});
		pieces = next;
		if (!instant) {
			await frame();
			pieces = pieces.map((x) => (x.to !== undefined ? { ...x, r: x.to, to: undefined, snap: false } : x));
		}
		await wait(MS.fall);
	}

	async function playSpin(sp: StashSpin) {
		tumbleCents = 0;
		await dropIn(sp.start);
		let prev = sp.start;
		for (const step of sp.steps) {
			if (!alive) return;
			await showStep(prev, step);
			prev = step.grid;
		}
		if (!alive) return;
		// whatever the animation did, the board ends exactly as worked out
		const end = finalGrid(sp);
		const want = end.flatMap((col, c) => col.map((p, r) => ({ p, c, r })));
		if (want.length !== pieces.length || want.some(({ p, c, r }) => !pieces.some((x) => x.p.id === p.id && x.c === c && x.r === r))) place(end);
		const raw = burgersOf(sp.raw, bet);
		if (sp.mult > 1) {
			pieces = pieces.map((x) => (x.p.kind === 'cloud' ? { ...x, fx: 'glow' } : x));
			pop(COLS / 2 - 0.5, ROWS / 2 - 0.6, `×${sp.mult}`, 'mult', 1500);
			tumbleCents = sp.raw * sp.mult;
			message = s.cloudWin(sp.mult, fmt(raw), fmt(raw * sp.mult));
			sound.play('maxed');
			await wait(MS.cloud);
		}
		const holkGoal = sp.mode === 'base' ? HOLKS_TO_START : HOLKS_TO_RETRIGGER;
		if (sp.holks >= holkGoal) {
			pieces = pieces.map((x) => (x.p.kind === 'holk' ? { ...x, fx: 'glow' } : x));
			message = sp.holkPay ? s.holkWin(sp.holks, fmt(burgersOf(sp.holkPay, bet)), sp.more) : s.holkMore(sp.holks, sp.more);
			sound.play('divergence');
			await wait(MS.holk);
		} else if (sp.pay && sp.mult === 1) {
			message = s.spinWon(fmt(burgersOf(sp.pay, bet)), sp.steps.length);
		} else if (!sp.pay) {
			message = s.noWin;
		}
		addCents(sp.pay);
	}

	/* ---------- waiting for a tap or a timer; everything waiting lets go when the machine goes away ---------- */
	let tapGo: (() => void) | null = null;
	function waitTap(n: number): Promise<void> {
		return new Promise((res) => {
			const done = () => {
				clearTimeout(timer);
				if (tapGo === done) tapGo = null;
				res();
			};
			const timer = setTimeout(done, skip ? 300 : reduce() ? Math.round(n * 0.7) : ms(n));
			tapGo = done;
		});
	}
	async function focusOverlay() {
		await tick();
		if (autoLeft === 0) overlayEl?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
	}
	function focusBack() {
		if (overlayEl && overlayEl.contains(document.activeElement)) void tick().then(() => spinBtn?.focus());
	}

	/* ---------- Sky High Spins ---------- */
	async function runFree(p: StashPlay) {
		let total = Math.min(FREE_SPINS, p.free.length);
		let won = 0;
		await wait(500);
		banner = { kind: 'intro', bonus: p.bonus === 'super' ? 'super' : 'free', spins: total };
		sound.play('maxed');
		void focusOverlay();
		await waitTap(autoLeft > 0 ? 1800 : 4200);
		focusBack();
		banner = null;
		for (const [i, fs] of p.free.entries()) {
			if (!alive) return;
			freeState = { n: i + 1, total, won: Math.round(burgersOf(won, bet)) };
			await playSpin(fs);
			won += fs.pay;
			if (freeState) freeState.won = Math.round(burgersOf(won, bet));
			if (fs.more) {
				total += fs.more;
				if (freeState) freeState.total = total;
				banner = { kind: 'more', spins: fs.more };
				await wait(1500);
				banner = null;
			}
			await wait(fs.pay ? 550 : 300);
		}
		freeState = null;
		banner = { kind: 'outro', spins: p.free.length, won: Math.min(p.win, Math.round(burgersOf(won, bet))) };
		void focusOverlay();
		await waitTap(autoLeft > 0 ? 1800 : 3800);
		focusBack();
		banner = null;
	}

	/** Book a paid spin or a bought bonus at once, then show it all. */
	async function run(p: StashPlay) {
		squad.recordGame(p.net);
		cur = p;
		gen += 1;
		shownCents = 0;
		hidden = p.win;
		lastWin = 0;
		busy = true;
		skip = false;
		tier = 'none';
		celebrate = false;
		message = s.spinning;
		if (p.base) await playSpin(p.base);
		if (p.free.length) await runFree(p);
		if (!alive) return;
		lastWin = p.win;
		hidden = 0;
		tumbleCents = 0;
		if (p.bonus || p.capped) message = `${s.won(fmt(p.win))}${p.capped ? ` · ${sl.maxWin(MAX_WIN)}` : ''}`;
		tier = winTier(p);
		if (tier === 'big' || tier === 'mega' || tier === 'epic') {
			celebrate = true;
			sound.play(tier === 'epic' ? 'divergence' : 'maxed');
			setTimeout(() => (celebrate = false), reduce() ? 2200 : 3400);
			squad.casinoNews(t.casino.event.stash(p.win, tier));
		}
		busy = false;
		skip = false;
		cur = null;
	}

	async function spin() {
		if (busy) return;
		if (cost > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		buyAsk = null;
		// Abscar's control room (casino-rig.ts): something he picked for this spin (spins are drawn until one
		// has it), or your luck
		const forced = squad.takeForced('stash');
		const withAnte = ante;
		const draw = () => play(bet, rand, withAnte);
		await run(forced ? drawUntil(draw, (p) => stashMatches(p, forced.what), STASH_TRIES) : lucky(squad.luck('stash'), rand, draw, (p) => p.net));
	}

	/* ---------- buy bonus: asked first ---------- */
	let buyAsk = $state<StashBuy | null>(null);
	const price = (kind: StashBuy) => BUY_PRICE[kind] * bet;
	function askBuy(kind: StashBuy) {
		if (price(kind) > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		buyAsk = kind;
	}
	async function confirmBuy() {
		const kind = buyAsk;
		buyAsk = null;
		if (!kind || busy || ante || price(kind) > shown) return;
		message = s.buyKinds[kind];
		await run(lucky(squad.luck('stash'), rand, () => buy(kind, bet, rand), (p) => p.net));
	}

	/* ---------- auto spin ---------- */
	const AUTO_COUNTS = [10, 25, 50, 100];
	let autoCount = $state(25);
	let autoLeft = $state(0);
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
			if (cost > shown) {
				stopAuto(t.casino.broke);
				break;
			}
			await spin();
			if (!alive || autoLeft === 0) break;
			autoLeft -= 1;
			await sleep(celebrate ? (reduce() ? 1800 : 3000) : reduce() ? 250 : 450);
		}
		if (alive && autoLeft === 0 && !busy) message = message || sl.autoDone;
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
	function stepBet(dir: 1 | -1) {
		const i = STASH_BETS.indexOf(bet);
		bet = STASH_BETS[Math.max(0, Math.min(STASH_BETS.length - 1, i + dir))];
		buyAsk = null;
	}

	/* ---------- the screen at rest before the first spin: a fixed demo screen ---------- */
	{
		let x = 0x57a5a5;
		const seeded = () => {
			x ^= x << 13;
			x ^= x >>> 17;
			x ^= x << 5;
			return (x >>> 0) / 0x1_0000_0000;
		};
		const demo = play(10, seeded).base!;
		pieces = finalGrid(demo).flatMap((col, c) => col.map((p, r) => ({ k: `0-${p.id}`, p, c, r, fx: '' as const, snap: true, d: 0 })));
	}

	/* ---------- words for screen readers ---------- */
	const boardLabel = $derived.by(() => {
		const counts = new Map<Kind, number>();
		for (const x of live) counts.set(x.p.kind, (counts.get(x.p.kind) ?? 0) + 1);
		const parts = [...SYMS, 'holk' as const].flatMap((kind) => (counts.get(kind) ? [s.countLabel(counts.get(kind) ?? 0, name(kind))] : []));
		if (cloudsOn) parts.push(s.cloudsLabel(cloudsOn));
		return s.boardLabel(parts.join(', '));
	});
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.5 + (i % 4) * 0.25, kind: (['holk', 'cloud', 'heart', 'bud', 'tab'] as const)[i % 5] }));
	const pay = (cents: number) => fmt(burgersOf(cents, bet));
</script>

<div class="st" class:busy style:--ms-fall="{ms(MS.fall)}ms" style:--ms-pop="{ms(MS.pop)}ms">
	<div class="st-cab">
		<!-- the marquee: neon title; in Sky High Spins their counter -->
		<div class="st-marquee" class:free-on={!!freeState}>
			<span class="st-haze" aria-hidden="true"></span>
			{#if freeState}
				<p class="st-title st-free-title font-head" role="status">{s.free.title(freeState.n, freeState.total)}</p>
				<p class="st-sub font-head">{s.free.sub(freeState.won.toLocaleString('en-US'))}</p>
			{:else}
				<p class="st-title font-head">{t.casino.games.stash}</p>
				<p class="st-sub font-head">{s.sub}</p>
			{/if}
		</div>

		<!-- the screen -->
		<div class="st-board-wrap">
			<div class="st-board" class:free-on={!!freeState} role="img" aria-label={boardLabel}>
				<div class="st-cells" aria-hidden="true">
					{#each Array.from({ length: COLS * ROWS }) as _, i (i)}<span class="st-cell"></span>{/each}
				</div>
				<div class="st-layer" aria-hidden="true">
					{#each pieces as rp (rp.k)}
						<div class="st-piece" class:snap={rp.snap} data-fx={rp.fx || undefined} data-kind={rp.p.kind} style:--c={rp.c} style:--r={rp.r} style:--d="{rp.d}ms">
							<div class="st-in"><StashSymbol kind={rp.p.kind} value={rp.p.x} /></div>
						</div>
					{/each}
					{#each pops as q (q.id)}
						<span class="st-pop font-head num" data-kind={q.kind} style:--x={q.x} style:--y={q.y}>{q.text}</span>
					{/each}
				</div>
			</div>

			{#if banner?.kind === 'more'}
				<p class="st-more font-head" role="status">{s.free.more(banner.spins)}</p>
			{:else if banner}
				<div class="st-over" data-kind={banner.kind} bind:this={overlayEl}>
					<span class="st-rain" aria-hidden="true">
						{#each RAIN as rain, i (i)}<span style:left="{rain.x}%" style:animation-delay="{rain.d}s" style:animation-duration="{rain.dur}s"
								><StashSymbol kind={banner.kind === 'intro' ? (i % 2 ? 'cloud' : 'holk') : rain.kind} value={i % 2 ? [2, 5, 10, 25][i % 4] : undefined} /></span
							>{/each}
					</span>
					{#if banner.kind === 'intro'}
						<p class="st-big font-head">{s.free.intro[banner.bonus]}</p>
						<p class="st-help">{s.free.introSub[banner.bonus](banner.spins)}</p>
					{:else}
						<p class="st-kicker font-head">{s.free.outro}</p>
						<p class="st-amount font-head num">+{banner.won.toLocaleString('en-US')} 🍔</p>
						<p class="st-help">{s.free.outroSub(banner.spins)}</p>
					{/if}
					<button type="button" class="st-go font-head" onclick={() => tapGo?.()}>{sl.continue} ▸</button>
				</div>
			{/if}

			{#if celebrate}
				<div class="st-celebrate" data-tier={tier} role="status">
					<p class="st-big font-head">{s.tiers[tier === 'none' ? 'win' : tier]}</p>
					<p class="st-amount font-head num">+{lastWin.toLocaleString('en-US')} 🍔</p>
				</div>
			{/if}
		</div>

		<!-- this spin: tumble win, holks, clouds -->
		<div class="st-stats font-head">
			<span class="st-stat" class:hot={tumbleCents > 0}><small>{s.tumbleWin}</small><b class="num">{pay(tumbleCents)}</b></span>
			<span class="st-stat" class:hot={holksOn >= (freeState ? HOLKS_TO_RETRIGGER : HOLKS_TO_START) - 1}
				><small>{s.holks}</small><b class="num">{holksOn}/{freeState ? HOLKS_TO_RETRIGGER : HOLKS_TO_START}</b></span
			>
			<span class="st-stat" class:hot={cloudsOn > 0}><small>{s.clouds}</small><b class="num">{cloudsOn ? `×${cloudsOn}` : '–'}</b></span>
		</div>

		<p class="st-msg" aria-live="polite">{message}</p>

		<!-- credits, bet, win, spin -->
		<div class="st-panel">
			<div class="st-led"><span>{s.credits}</span><b class="num" style:--n={shownText.length}>{shownText}</b></div>
			<div class="st-led st-bet">
				<div class="st-bet-ctl">
					<span class="st-bet-lbl">{ante ? s.betAnte(cost) : t.casino.bet}</span>
					<button type="button" class="st-step minus" aria-label="−" disabled={busy || bet === STASH_BETS[0]} onclick={() => stepBet(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={t.casino.betLabel(bet)}>{bet.toLocaleString('en-US')}</b>
					<button type="button" class="st-step plus" aria-label="+" disabled={busy || bet === STASH_BETS[STASH_BETS.length - 1]} onclick={() => stepBet(1)}>+</button>
				</div>
			</div>
			<div class="st-led win"><span>{s.lastWin}</span><b class="num" style:--n={winText.length}>{winText}</b></div>
			<button type="button" class="st-spin font-head" bind:this={spinBtn} disabled={busy || autoLeft > 0} onclick={() => void spin()}>{busy ? '…' : s.spin}</button>
		</div>

		<!-- Double chance -->
		<button type="button" class="st-ante" aria-pressed={ante} disabled={busy || autoLeft > 0} onclick={toggleAnte}>
			<span class="st-ante-ico" aria-hidden="true"><StashSymbol kind="holk" /></span>
			<span class="min-w-0 text-left">
				<b class="block font-head">{s.ante} · {ante ? s.anteOn : s.anteOff}</b>
				<span class="st-ante-help">{s.anteHelp(anteCost(bet))}</span>
			</span>
			<span class="st-switch" aria-hidden="true"><span></span></span>
		</button>

		<!-- auto spin, turbo, skip -->
		<div class="st-auto" role="group" aria-label={sl.autoLabel}>
			<button type="button" class="st-auto-btn font-head" aria-pressed={autoLeft > 0} disabled={autoLeft === 0 && (busy || cost > shown)} onclick={() => void runAuto()}>
				{autoLeft > 0 ? sl.autoStop(autoLeft) : sl.auto(autoCount)}
			</button>
			{#if autoLeft === 0}
				{#each AUTO_COUNTS as n (n)}
					<button type="button" class="st-auto-n num font-head" aria-pressed={autoCount === n} aria-label={sl.autoCount(n)} onclick={() => (autoCount = n)}>{n}</button>
				{/each}
			{/if}
			<span class="flex-1"></span>
			<button type="button" class="st-auto-n font-head" aria-pressed={turbo} onclick={toggleTurbo}>⚡ {s.turbo}</button>
			<button type="button" class="st-auto-n font-head" aria-label={s.skipLabel} disabled={!busy || skip} onclick={() => (skip = true)}>{s.skip} ▸▸</button>
		</div>

		<!-- buy bonus -->
		<div class="st-buy" role="group" aria-label={sl.buy}>
			{#if buyAsk}
				<p class="st-buy-ask" role="status">{sl.buyAsk(s.buyWhat[buyAsk](FREE_SPINS), price(buyAsk))}</p>
				<div class="flex gap-1.5">
					<button type="button" class="st-buy-yes font-head" disabled={busy || price(buyAsk) > shown} onclick={() => void confirmBuy()}>{sl.buyYes}</button>
					<button type="button" class="st-buy-no font-head" onclick={() => (buyAsk = null)}>{sl.buyNo}</button>
				</div>
			{:else}
				<span class="st-buy-label font-head">{sl.buy}{#if ante}<span class="st-buy-off"> · {s.buyOff}</span>{/if}</span>
				<div class="st-buy-list">
					{#each BUY_KINDS as kind (kind)}
						<button type="button" class="st-buy-btn" data-buy={kind} disabled={busy || ante || autoLeft > 0 || price(kind) > shown} onclick={() => askBuy(kind)}>
							<span class="st-buy-ico"><StashSymbol kind={kind === 'super' ? 'cloud' : 'holk'} value={kind === 'super' ? 10 : undefined} /></span>
							<span class="min-w-0 text-left">
								<b class="block font-head">{s.buyKinds[kind]}</b>
								<span class="num">{sl.buyPrice(price(kind))}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<details class="st-paytable mt-3 text-xs text-muted">
	<summary class="min-h-11 cursor-pointer content-center font-semibold">{sl.paytable}</summary>
	<p class="pb-2">{s.how}</p>
	<p class="pb-1 font-semibold text-fg">{s.payNote(bet.toLocaleString('en-US'))}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-1.5 pb-2">
		{#each [...SYMS].reverse() as sym (sym)}
			<li class="st-pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				<span class="st-pay-ico"><StashSymbol kind={sym} /></span>
				<span class="min-w-0"><b class="block text-fg">{name(sym)}</b>{s.payRow(pay(PAYS[sym][0]), pay(PAYS[sym][1]), pay(PAYS[sym][2]))}</span>
			</li>
		{/each}
		<li class="st-pay-row flex items-center gap-2 rounded-lg px-2 py-1">
			<span class="st-pay-ico"><StashSymbol kind="holk" /></span>
			<span class="min-w-0"><b class="block text-fg">{name('holk')}</b>{s.holkRow(HOLK_PAYS[4], HOLK_PAYS[5], HOLK_PAYS[6], FREE_SPINS, HOLKS_TO_RETRIGGER, RETRIGGER)}</span>
		</li>
		<li class="st-pay-row flex items-center gap-2 rounded-lg px-2 py-1">
			<span class="st-pay-ico"><StashSymbol kind="cloud" value={5} /></span>
			<span class="min-w-0"><b class="block text-fg">{name('cloud')}</b>{s.cloudRow}</span>
		</li>
	</ul>
	<p class="pb-1">{s.anteNote}</p>
	<p class="pb-1">{s.buyNote(BUY_PRICE.free, BUY_PRICE.super)}</p>
	<p class="pb-1">{s.rtpNote}</p>
	<p class="pb-1">{sl.maxNote(MAX_WIN)}</p>
</details>

<style>
	.st {
		container-type: inline-size;
		max-width: 640px;
	}
	/* the cabinet: a smoky stash box, deep green felt and purple haze with gold trim */
	.st-cab {
		position: relative;
		padding: 10px 10px 12px;
		border: 4px solid #ffc928;
		border-radius: 22px 22px 14px 14px;
		background:
			radial-gradient(120% 50% at 50% 0%, rgb(180 120 255 / 0.22), transparent 60%),
			radial-gradient(80% 60% at 0% 100%, rgb(95 227 106 / 0.16), transparent 60%),
			linear-gradient(180deg, #0f3a2a, #082219 60%, #04120c);
		box-shadow:
			0 0 0 3px #04120c,
			0 0 26px rgb(180 120 255 / 0.35),
			inset 0 2px 0 rgb(255 255 255 / 0.2);
		color: #fff6e0;
	}
	.st-marquee {
		position: relative;
		margin-bottom: 10px;
		padding: 10px 8px 8px;
		border-radius: 14px;
		background: linear-gradient(180deg, #1c0b30, #0a0414);
		box-shadow:
			inset 0 0 0 2px #b57cff,
			0 0 12px rgb(181 124 255 / 0.4);
		text-align: center;
		overflow: hidden;
	}
	.st-marquee.free-on {
		box-shadow:
			inset 0 0 0 2px #5fe36a,
			0 0 16px rgb(95 227 106 / 0.55);
	}
	/* smoke drifting across the sign */
	.st-haze {
		position: absolute;
		inset: -30% -10%;
		pointer-events: none;
		background:
			radial-gradient(30% 45% at 15% 60%, rgb(230 220 255 / 0.18), transparent 70%),
			radial-gradient(28% 40% at 70% 40%, rgb(200 255 210 / 0.14), transparent 70%),
			radial-gradient(25% 40% at 45% 80%, rgb(255 220 250 / 0.12), transparent 70%);
		filter: blur(4px);
		animation: st-haze 16s ease-in-out infinite alternate;
	}
	@keyframes st-haze {
		to {
			transform: translateX(8%) scale(1.1);
		}
	}
	.st-title {
		position: relative;
		text-shadow: none !important;
		font-size: clamp(22px, 7cqi, 38px);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #f4ffe8, #8dff6a 50%, #22b14c);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 2px 0 #2a0a3a) drop-shadow(0 0 10px rgb(181 124 255 / 0.6));
	}
	.st-free-title {
		background: linear-gradient(180deg, #fff, #d3a8ff 55%, #9b4dff);
		-webkit-background-clip: text;
		background-clip: text;
		filter: drop-shadow(0 2px 0 #1a0630) drop-shadow(0 0 10px rgb(95 227 106 / 0.6));
	}
	.st-sub {
		position: relative;
		margin-top: 2px;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #e2c8ff;
	}
	/* the screen: its own width is the unit for everything drawn on it */
	.st-board-wrap {
		position: relative;
		container-type: inline-size;
	}
	.st-board {
		position: relative;
		width: 100%;
		aspect-ratio: 6 / 5;
		overflow: hidden;
		border-radius: 12px;
		background:
			radial-gradient(70% 60% at 50% 40%, rgb(120 60 200 / 0.35), transparent 70%),
			linear-gradient(180deg, #170a2a, #0a0414);
		box-shadow:
			inset 0 0 0 2px #ffc928,
			inset 0 0 24px rgb(0 0 0 / 0.8);
	}
	.st-board.free-on {
		background:
			radial-gradient(70% 60% at 50% 40%, rgb(95 227 106 / 0.28), transparent 70%),
			linear-gradient(180deg, #0f2a1a, #050f09);
	}
	.st-cells,
	.st-layer {
		position: absolute;
		inset: 0;
	}
	.st-cells {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-template-rows: repeat(5, 1fr);
	}
	.st-cell {
		margin: 1.5px;
		border-radius: 8px;
		background: rgb(255 255 255 / 0.04);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.05);
	}
	.st-piece {
		position: absolute;
		left: 0;
		top: 0;
		width: calc(100% / 6);
		height: 20%;
		transform: translate(calc(var(--c) * 100%), calc(var(--r) * 100%));
		transition: transform var(--ms-fall) cubic-bezier(0.32, 0.7, 0.4, 1.08);
		transition-delay: var(--d, 0ms);
	}
	.st-piece.snap {
		transition: none;
	}
	.st-in {
		width: 100%;
		height: 100%;
		padding: 7%;
	}
	.st-in :global(svg) {
		width: 100%;
		height: 100%;
	}
	/* a winning symbol lights up and throbs, then bursts */
	.st-piece[data-fx='win'] .st-in {
		border-radius: 12px;
		background: radial-gradient(circle, rgb(255 230 120 / 0.55), transparent 70%);
		animation: st-throb 0.35s ease-in-out infinite alternate;
	}
	.st-piece[data-fx='pop'] .st-in {
		animation: st-burst var(--ms-pop) ease-in forwards;
	}
	.st-piece[data-fx='glow'] .st-in {
		border-radius: 12px;
		background: radial-gradient(circle, rgb(255 210 58 / 0.5), transparent 70%);
		animation: st-throb 0.45s ease-in-out infinite alternate;
	}
	.st-piece[data-kind='cloud'] .st-in {
		filter: drop-shadow(0 0 6px rgb(255 255 255 / 0.5));
	}
	@keyframes st-throb {
		to {
			transform: scale(1.12);
			filter: brightness(1.25);
		}
	}
	@keyframes st-burst {
		to {
			transform: scale(1.5);
			opacity: 0;
			filter: brightness(2) blur(2px);
		}
	}
	/* pop-ups: burgers per win over its symbols; the clouds' ×total big in the middle */
	.st-pop {
		position: absolute;
		left: calc((var(--x) + 0.5) * 100% / 6);
		top: calc((var(--y) + 0.5) * 20%);
		z-index: 4;
		translate: -50% -50%;
		font-size: clamp(14px, 5cqi, 26px);
		font-weight: 900;
		white-space: nowrap;
		color: #fff6b0;
		text-shadow:
			0 2px 0 #2a0a3a,
			0 0 8px #000,
			0 0 14px rgb(255 210 58 / 0.85);
		pointer-events: none;
		animation: st-float 1.1s ease-out forwards;
	}
	.st-pop[data-kind='mult'] {
		font-size: clamp(36px, 15cqi, 84px);
		color: #d3a8ff;
		text-shadow:
			0 3px 0 #1a0630,
			0 0 22px #9b4dff,
			0 0 40px rgb(95 227 106 / 0.6);
		animation: st-zoom 1.5s ease-out forwards;
	}
	@keyframes st-float {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.8);
		}
		15% {
			opacity: 1;
			transform: translateY(0) scale(1.12);
		}
		to {
			opacity: 0;
			transform: translateY(-30px) scale(1);
		}
	}
	@keyframes st-zoom {
		from {
			opacity: 0;
			transform: scale(0.4);
		}
		20% {
			opacity: 1;
			transform: scale(1.15);
		}
		75% {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(1.05);
		}
	}
	/* overlays: Sky High Spins in / more / out, big wins */
	.st-over,
	.st-celebrate {
		position: absolute;
		inset: 0;
		z-index: 6;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		border-radius: 12px;
		text-align: center;
		overflow: clip;
	}
	.st-over {
		background: radial-gradient(circle at 50% 40%, rgb(60 20 110 / 0.95), rgb(6 2 14 / 0.97));
		box-shadow: inset 0 0 0 3px #5fe36a;
	}
	.st-over[data-kind='outro'] {
		box-shadow: inset 0 0 0 3px #ffd23a;
	}
	.st-big {
		position: relative;
		font-size: clamp(24px, 9cqi, 46px);
		font-weight: 900;
		line-height: 1.05;
		color: #d9ffb8;
		text-shadow:
			0 2px 0 #1a0630,
			0 0 16px rgb(95 227 106 / 0.75);
	}
	.st-kicker {
		position: relative;
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.2em;
		color: #ffd23a;
	}
	.st-amount {
		position: relative;
		font-size: clamp(28px, 10cqi, 50px);
		font-weight: 900;
		color: #fff;
		text-shadow: 0 0 16px rgb(255 210 58 / 0.9);
	}
	.st-help {
		position: relative;
		max-width: 32em;
		font-size: 12px;
		line-height: 1.35;
		color: #ead8ff;
	}
	.st-go {
		position: relative;
		min-height: 44px;
		min-width: 140px;
		margin-top: 4px;
		padding: 0 18px;
		border-radius: 999px;
		background: linear-gradient(180deg, #e8ffb0, #5fe36a);
		color: #062a0a;
		font-weight: 900;
		letter-spacing: 0.06em;
		box-shadow:
			0 3px 0 #13801f,
			0 0 14px rgb(95 227 106 / 0.6);
	}
	.st-rain {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.st-rain > span {
		position: absolute;
		top: -16%;
		width: 11%;
		aspect-ratio: 1;
		animation: st-rain 1.6s linear infinite;
		opacity: 0.5;
	}
	@keyframes st-rain {
		to {
			transform: translateY(1000%) rotate(200deg);
		}
	}
	.st-more {
		position: absolute;
		inset: 40% 0 auto;
		z-index: 6;
		text-align: center;
		font-size: clamp(22px, 8cqi, 42px);
		font-weight: 900;
		color: #b6ff7a;
		text-shadow:
			0 2px 0 #1a0630,
			0 0 18px #22b14c;
		animation: st-zoom 1.5s ease-out forwards;
	}
	.st-celebrate {
		pointer-events: none;
		background: radial-gradient(circle, rgb(30 10 60 / 0.75), rgb(0 0 0 / 0.55));
		animation: st-zoom 3.4s ease-out forwards;
	}
	.st-celebrate[data-tier='epic'] .st-big {
		color: #e6c8ff;
		text-shadow:
			0 2px 0 #1a0630,
			0 0 22px #9b4dff,
			0 0 44px #5fe36a;
	}
	/* this spin's numbers */
	.st-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 6px;
		margin-top: 8px;
	}
	.st-stat {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0 4px;
		min-width: 0;
		padding: 5px 8px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.35);
	}
	.st-stat small {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #cdb6ff;
	}
	.st-stat b {
		font-size: 16px;
		font-weight: 900;
	}
	/* narrow: the label over the number in all three, so they line up */
	@container (max-width: 420px) {
		.st-stat {
			display: grid;
			gap: 0;
		}
	}
	.st-stat.hot {
		box-shadow:
			inset 0 0 0 1.5px #5fe36a,
			0 0 8px rgb(95 227 106 / 0.5);
	}
	.st-msg {
		min-height: 2.6em;
		margin: 8px 2px 4px;
		font-size: 13px;
		line-height: 1.3;
		color: #fff6e0;
	}
	/* the panel */
	.st-panel {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
		align-items: stretch;
		gap: 6px;
	}
	@container (max-width: 420px) {
		.st-panel {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
		}
		.st-spin {
			grid-column: 1 / -1;
		}
		.st-led {
			padding: 4px 6px;
		}
		.st-step {
			width: 28px;
			height: 28px;
		}
		.st-step::after {
			inset: -8px;
		}
	}
	.st-led {
		container-type: inline-size;
		display: grid;
		align-content: center;
		gap: 1px;
		min-width: 0;
		padding: 4px 8px;
		border-radius: 10px;
		background: #04100a;
		box-shadow: inset 0 0 0 1.5px rgb(181 124 255 / 0.55);
	}
	.st-led span {
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #d3b8ff;
	}
	.st-led b {
		font-size: min(17px, calc(100cqi / (var(--n, 1) * 0.6)));
		white-space: nowrap;
		font-weight: 900;
		color: #8dff6a;
		text-shadow: 0 0 6px rgb(141 255 106 / 0.7);
	}
	.st-led.win b {
		color: #ffd23a;
		text-shadow: 0 0 6px rgb(255 210 58 / 0.7);
	}
	.st-step {
		position: relative;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: rgb(181 124 255 / 0.18);
		color: #e2c8ff;
		font-weight: 900;
	}
	.st-step::after {
		content: '';
		position: absolute;
		inset: -7px;
	}
	.st-step:disabled {
		opacity: 0.35;
	}
	.st-bet-ctl {
		display: grid;
		grid-template-columns: auto auto auto;
		grid-template-areas: 'lbl lbl lbl' 'minus num plus';
		justify-content: start;
		align-items: center;
		column-gap: 4px;
		row-gap: 1px;
	}
	.st-bet-lbl {
		grid-area: lbl;
		white-space: nowrap;
	}
	.st-bet-ctl .minus {
		grid-area: minus;
	}
	.st-bet-ctl b {
		grid-area: num;
	}
	.st-bet-ctl .plus {
		grid-area: plus;
	}
	@container (max-width: 133px) {
		.st-bet-ctl {
			grid-template-areas: 'minus lbl plus' 'num num num';
			justify-content: center;
			justify-items: center;
			column-gap: 8px;
		}
	}
	@container (max-width: 100px) {
		.st-bet-ctl {
			column-gap: 3px;
		}
		.st-bet-ctl .st-step {
			width: 24px;
			height: 24px;
		}
		.st-bet-ctl .st-step::after {
			inset: -10px;
		}
	}
	.st-spin {
		min-height: 52px;
		min-width: 96px;
		padding: 0 18px;
		border-radius: 999px;
		background: radial-gradient(circle at 50% 30%, #f0dcff, #a35cff 50%, #5a1fb0);
		color: #fff;
		font-size: 20px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-shadow: 0 1px 1px #2a0a50;
		box-shadow:
			0 4px 0 #3a0f78,
			0 0 18px rgb(181 124 255 / 0.65);
	}
	.st-spin:disabled {
		filter: grayscale(0.5) brightness(0.8);
	}
	/* Double chance: a switch row */
	.st-ante {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 48px;
		margin-top: 8px;
		padding: 4px 10px 4px 6px;
		border-radius: 12px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1.5px rgb(255 210 58 / 0.45);
		font-size: 12px;
	}
	.st-ante[aria-pressed='true'] {
		background: linear-gradient(180deg, rgb(255 210 58 / 0.2), rgb(255 210 58 / 0.06));
		box-shadow:
			inset 0 0 0 2px #ffd23a,
			0 0 10px rgb(255 210 58 / 0.4);
	}
	.st-ante:disabled {
		opacity: 0.55;
	}
	.st-ante b {
		font-size: 13px;
	}
	.st-ante-help {
		display: block;
		color: #e8dcc8;
		line-height: 1.3;
	}
	.st-ante-ico {
		flex: none;
		width: 34px;
		height: 34px;
	}
	.st-switch {
		position: relative;
		flex: none;
		width: 40px;
		height: 22px;
		margin-left: auto;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.15);
		box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 0.3);
	}
	.st-switch span {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: #fff;
		transition: transform 0.15s ease;
	}
	.st-ante[aria-pressed='true'] .st-switch {
		background: #ffb000;
	}
	.st-ante[aria-pressed='true'] .st-switch span {
		transform: translateX(18px);
	}
	.st-auto,
	.st-buy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
	}
	.st-auto-btn,
	.st-auto-n,
	.st-buy-yes,
	.st-buy-no {
		min-height: 44px;
		padding: 0 12px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.08);
		box-shadow: inset 0 0 0 1.5px rgb(205 182 255 / 0.5);
		font-size: 13px;
		font-weight: 800;
	}
	.st-auto-n {
		min-width: 44px;
	}
	.st-auto-btn[aria-pressed='true'],
	.st-auto-n[aria-pressed='true'] {
		background: rgb(95 227 106 / 0.2);
		box-shadow: inset 0 0 0 2px #5fe36a;
		color: #c8ffb8;
	}
	.st-auto button:disabled,
	.st-buy button:disabled {
		opacity: 0.4;
	}
	.st-buy-label {
		flex: 1 1 100%;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.st-buy-off {
		letter-spacing: 0.04em;
		text-transform: none;
		color: #e8dcc8;
		font-weight: 600;
	}
	.st-buy-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 6px;
		flex: 1;
		min-width: 0;
	}
	.st-buy-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		padding: 4px 10px 4px 6px;
		border-radius: 12px;
		background: linear-gradient(180deg, rgb(255 210 58 / 0.18), rgb(255 210 58 / 0.06));
		box-shadow: inset 0 0 0 1.5px rgb(255 210 58 / 0.6);
		font-size: 12px;
	}
	.st-buy-btn b {
		font-size: 13px;
	}
	.st-buy-ico {
		flex: none;
		width: 34px;
		height: 34px;
	}
	.st-buy-ask {
		flex: 1 1 100%;
		font-size: 13px;
	}
	.st-buy-yes {
		background: linear-gradient(180deg, #ffe680, #ffb000);
		color: #3a1400;
	}
	/* the paytable */
	.st-pay-ico {
		width: 38px;
		height: 38px;
		flex: none;
	}
	.st-pay-row {
		background: var(--t-panel-2, rgb(0 0 0 / 0.2));
	}
	@media (prefers-reduced-motion: reduce) {
		.st-haze,
		.st-rain > span,
		.st-piece[data-fx='win'] .st-in,
		.st-piece[data-fx='glow'] .st-in {
			animation: none;
		}
		.st-rain {
			display: none;
		}
		.st-piece {
			transition: none;
		}
	}
</style>
