<!--
	Kushburst, BurgiCasino's third slot machine (kushburst.ts; 2026-11-20, the user's ask: "make another slot
	that's like Starburst, come up with a fun name for what Abscar's version would be called; it should look
	like Starburst but the stars can be weed leaves instead").
	A blacklight stoner den of a cabinet: violet glass, pink and green neon tubes, lava-lamp blobs drifting
	behind the reels, a neon KUSHBURST marquee. The reels stop one by one; a leaf that lands on reel 2, 3 or 4
	lights up, then grows over the whole reel (a tall leaf column on its own layer, so it stays put while the
	other reels respin under nothing), the leaf reels hold and the rest spin again. Wins pay both ways: the
	payline is drawn over the cells it pays on, from whichever end. A KUSHBURST (all three middle reels leaves)
	pops up big with its ×3. The whole play with its respins is worked out and booked at once
	(squad.recordGame), then shown; `hidden` = burgers won but not shown yet, so the balance above doesn't give
	the result away. Auto spin and two buys (a leaf / a KUSHBURST) like the other machines.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import {
		kushBuy,
		kushPlay,
		kushTier,
		KUSH_BUYS,
		KUSH_BUY_PRICE,
		KUSH_MAX_WIN,
		KUSH_MULT,
		KUSH_PAYING,
		KUSH_PAYS,
		KUSH_REELS,
		KUSH_ROWS,
		KUSH_STRIPS,
		LEAF_RAIN,
		LINES,
		type KushBuy,
		type KushGrid,
		type KushLine,
		type KushPlay,
		type KushStep,
		type KushSymbol,
		type KushTier
	} from '#lib/kushburst.ts';
	import { SLOT_BETS } from '#lib/casino-slots.ts';
	import { kushForced, lucky } from '#lib/casino-rig.ts';
	import { t } from '#lib/i18n/en.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import KushSymbolView from './KushSymbol.svelte';
	import KushLogo from './KushLogo.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	// everything held back here is a win not shown yet (the leaderboard waits for it too)
	$effect(() => {
		pending = hidden;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const s = t.casino.kushburst;
	const sym = s.symbols as Record<KushSymbol, string>;
	const uid = $props.id();
	const u = `kush-${uid}`;

	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

	let bet = $state(SLOT_BETS[0]);
	const shown = $derived(Math.max(0, balance - hidden));
	/** What the machine shows before the first spin (no leaves, no win). */
	const START: KushGrid = [
		['papers', 'x420', 'grinder'],
		['bong', 'lighter', 'holk'],
		['grinder', 'brownie', 'papers'],
		['holk', 'papers', 'bong'],
		['lighter', 'x420', 'brownie']
	];
	/** What each reel shows: during a spin a long strip that slides; at rest the 3 visible symbols. */
	let cols = $state(START.map((items) => ({ items: [...items], y: 0, dur: 0 })));
	/** Leaf reels on screen (the tall leaf columns), and the row each new one grew from (for the animation). */
	let wildReels = $state<number[]>([]);
	let growFrom = $state<Record<number, number>>({});
	/** Landed leaves lighting up just before they grow ("reel-row"). */
	let freshCells = $state<string[]>([]);
	let wins = $state<KushLine[]>([]);
	let spinning = $state(false);
	let lastWin = $state(0);
	let message = $state('');
	let tier = $state<KushTier>('none');
	let celebrate = $state(false);
	let celebrateId = 0;
	/** Respins running: which one (the marquee shows it). */
	let respin = $state<number | null>(null);
	/** Words popping up over the reels: KUSHBURST ×3, RESPIN!, LEAF RAIN. */
	let pop = $state<{ kind: 'burst' | 'respin' | 'rain'; text: string } | null>(null);
	let popId = 0;
	let spinBtn = $state<HTMLButtonElement>();

	function showPop(kind: 'burst' | 'respin' | 'rain', text: string, ms: number) {
		pop = { kind, text };
		const id = ++popId;
		setTimeout(() => popId === id && (pop = null), reduce() ? Math.min(ms, 1200) : ms);
	}

	/** The reels a line win pays on: from the left, from the right, or all five. */
	const reelsOf = (w: KushLine) => (w.dir === 'right' ? Array.from({ length: w.count }, (_, i) => KUSH_REELS - w.count + i) : Array.from({ length: w.count }, (_, i) => i));
	/** Cells that are part of a win (for the glow): "reel-row". */
	const winCells = $derived.by(() => {
		const set = new Set<string>();
		for (const w of wins) for (const r of reelsOf(w)) set.add(`${r}-${LINES[w.line][r]}`);
		return set;
	});
	const reelWins = (r: number) => [0, 1, 2].some((row) => winCells.has(`${r}-${row}`));
	const LINE_COLORS = ['#8dff5a', '#ff3fb4', '#5feaff', '#ffe14a', '#ff8a1a', '#c98bff', '#ff5a5a', '#4bffd1', '#fff6b0', '#9ab8ff'];

	/** A random symbol from a reel's strip to fly past while it spins (no leaves: only a landed leaf is one). */
	function filler(r: number): KushSymbol {
		const strip = KUSH_STRIPS[r];
		for (;;) {
			const x = strip[Math.floor(rand() * strip.length)];
			if (x !== 'leaf') return x;
		}
	}

	async function spinReels(step: KushStep) {
		const moving = Array.from({ length: KUSH_REELS }, (_, r) => r).filter((r) => !step.held.includes(r));
		if (!reduce()) {
			cols = cols.map((c, r) => {
				if (step.held.includes(r)) return c;
				const extra = Array.from({ length: 9 + moving.indexOf(r) * 3 }, () => filler(r));
				return { items: [...c.items.slice(0, KUSH_ROWS), ...extra, ...step.landed[r]], y: 0, dur: 0 };
			});
			await tick();
			await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
			cols = cols.map((c, r) => (step.held.includes(r) ? c : { ...c, y: c.items.length - KUSH_ROWS, dur: 560 + moving.indexOf(r) * 210 }));
			await sleep(560 + (moving.length - 1) * 210 + 140);
		}
		cols = step.landed.map((items) => ({ items: [...items], y: 0, dur: 0 }));
	}

	/** What a screen won, in words (a few lines in full, more as a sum). */
	function describe(st: KushStep): string {
		const parts: string[] = [];
		if (st.mult > 1) parts.push(s.burstWin(st.mult));
		if (st.lines.length > 3) parts.push(s.manyLines(st.lines.length, st.win));
		else for (const l of st.lines) parts.push(s.lineWin(l.line + 1, s.dirs[l.dir], l.count, sym[l.symbol], l.win));
		if (st.fresh.length) parts.push(s.grows(st.fresh.length));
		return parts.length ? parts.join(' · ') : s.noWin;
	}

	/** Book a paid spin or a bought one at once, then show it step by step. */
	async function run(p: KushPlay) {
		// booked now (closing the page changes nothing), shown below
		squad.recordGame(p.net);
		hidden = p.win;
		spinning = true;
		wins = [];
		tier = 'none';
		celebrate = false;
		celebrateId++;
		lastWin = 0;
		pop = null;
		respin = null;
		wildReels = [];
		growFrom = {};
		freshCells = [];
		let total = 0;
		for (let i = 0; i < p.steps.length && alive; i++) {
			const st = p.steps[i];
			wins = [];
			if (i > 0) {
				respin = i;
				message = s.respinning(i);
				showPop('respin', s.respinPop, 900);
				await sleep(reduce() ? 150 : 650);
			} else message = s.spinning;
			await spinReels(st);
			if (!alive) return;
			if (st.fresh.length) {
				// the leaves that landed light up, then grow over their reels
				freshCells = st.fresh.map((f) => `${f.reel}-${f.row}`);
				if (st.rain.length && p.kind === 'spin') showPop('rain', s.rainPop(st.rain.length), 1300);
				sound.play('camo');
				await sleep(reduce() ? 120 : 420);
				growFrom = Object.fromEntries(st.fresh.map((f) => [f.reel, f.row]));
				wildReels = st.wild;
				freshCells = [];
				sound.play('maxed');
				await sleep(reduce() ? 150 : 720);
			}
			wins = st.lines;
			total += st.win;
			lastWin = Math.min(total, p.win);
			hidden = Math.max(0, p.win - lastWin);
			message = describe(st);
			if (st.mult > 1) {
				showPop('burst', s.burstPop(KUSH_MULT), 2400);
				sound.play('divergence');
			} else if (st.win > 0) sound.play('camo');
			if (i < p.steps.length - 1) await sleep(reduce() ? 500 : st.mult > 1 ? 2200 : st.win ? 1400 : 650);
		}
		if (!alive) return;
		respin = null;
		if (p.steps.length > 1 || p.capped) message = `${s.total(p.steps.length - 1)}: ${p.win.toLocaleString('en-US')} 🍔${p.capped ? ` · ${s.maxWin(KUSH_MAX_WIN)}` : ''}`;
		hidden = 0;
		lastWin = p.win;
		tier = kushTier(p);
		if (tier === 'big' || tier === 'mega' || tier === 'kushburst') {
			celebrate = true;
			sound.play(tier === 'kushburst' ? 'divergence' : 'maxed');
			// only this play's timer closes it (an earlier win's timer mustn't cut it short)
			const id = ++celebrateId;
			setTimeout(() => celebrateId === id && (celebrate = false), reduce() ? 2200 : 3400);
			squad.casinoNews(t.casino.event.kushburst(p.win, tier));
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
		// Abscar's control room (casino-rig.ts): a result he picked for this spin, or your luck
		const forced = squad.takeForced('kushburst');
		await run(forced ? kushForced(forced.what, bet, rand) : lucky(squad.luck('kushburst'), rand, () => kushPlay(bet, rand), (x) => x.net));
	}

	/* ----- buy: a spin that starts with a leaf / as a KUSHBURST; asked first ----- */
	let buyAsk = $state<KushBuy | null>(null);
	const price = (k: KushBuy) => KUSH_BUY_PRICE[k] * bet;
	function askBuy(k: KushBuy) {
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
		await run(lucky(squad.luck('kushburst'), rand, () => kushBuy(k, bet, rand), (x) => x.net));
		void tick().then(() => spinBtn?.focus());
	}

	/* ----- auto spin ----- */
	const AUTO_COUNTS = [10, 25, 50, 100];
	let autoCount = $state(25);
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
		};
	});

	function stepBet(dir: 1 | -1) {
		const i = SLOT_BETS.indexOf(bet);
		bet = SLOT_BETS[Math.max(0, Math.min(SLOT_BETS.length - 1, i + dir))];
	}

	const reelText = (r: number) => (wildReels.includes(r) ? s.reelLeaf(r + 1) : s.reelLabel(r + 1, cols[r].items.slice(-KUSH_ROWS).map((x) => sym[x]).join(', ')));
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.4 + (i % 4) * 0.25 }));
	/** the leaf column's rays and smoke */
	const COL_RAYS = Array.from({ length: 16 }, (_, i) => {
		const a = (i * 22.5 * Math.PI) / 180;
		const b = ((i * 22.5 + 7) * Math.PI) / 180;
		const p = (x: number) => `${(32 + 140 * Math.sin(x)).toFixed(1)} ${(92 - 140 * Math.cos(x)).toFixed(1)}`;
		return `M32 92 L${p(a)} L${p(b)} Z`;
	});
	const PUFFS = [
		{ x: 18, d: 0, r: 9 },
		{ x: 44, d: -1.1, r: 11 },
		{ x: 30, d: -2.2, r: 8 },
		{ x: 50, d: -3.1, r: 9 },
		{ x: 14, d: -3.9, r: 10 }
	];
</script>

<div class="kush-wrap">
	<div class="kush" class:spinning>
		<div class="cab">
			<div class="lava" aria-hidden="true"><span></span><span></span><span></span></div>
			<!-- the marquee: the neon logo (2026-11-20, KushLogo); under it the line, in respins their counter (the
			     logo stays, so the reels never jump) -->
			<div class="marquee" class:respin-on={respin !== null}>
				<div class="logo"><KushLogo label={t.casino.games.kushburst} /></div>
				<div class="lines">
					{#if respin !== null}
						<p class="title respin-title font-head" role="status">{s.respinTitle(respin)}</p>
						<p class="subtitle font-head">{s.respinSub(wildReels.length)}</p>
					{:else}
						<p class="subtitle font-head"><span class="arrow" aria-hidden="true">◀</span> {s.sub} <span class="arrow" aria-hidden="true">▶</span></p>
					{/if}
				</div>
			</div>

			<!-- the reels -->
			<div class="window" role="group" aria-label={t.casino.games.kushburst}>
				<div class="reels">
					{#each cols as col, r (r)}
						<div class="reel" role="img" aria-label={reelText(r)}>
							<div class="strip" style:transform={`translateY(calc(var(--cell) * ${-col.y}))`} style:transition={col.dur ? `transform ${col.dur}ms cubic-bezier(0.18, 0.7, 0.28, 1.06)` : 'none'}>
								{#each col.items as x, i (i)}
									{@const k = `${r}-${i}`}
									<div class="cell" class:win={!wildReels.includes(r) && col.items.length === KUSH_ROWS && winCells.has(k)} class:fresh={col.items.length === KUSH_ROWS && freshCells.includes(k)}>
										<KushSymbolView symbol={x} size={48} />
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<!-- leaf reels: a tall leaf column over the reel (it holds while the others respin) -->
				{#if wildReels.length}
					<div class="leaf-layer" aria-hidden="true">
						{#each wildReels as r (r)}
							<div class="leaf-col" data-reel={r} class:grow={growFrom[r] !== undefined} class:win={reelWins(r)} style:grid-column={r + 1} style:--from="{((growFrom[r] ?? 1) + 0.5) * 33.333}%">
								<svg viewBox="0 0 64 192" preserveAspectRatio="xMidYMid slice">
									<defs>
										<linearGradient id="{u}-col{r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0a6a" /><stop offset="0.5" stop-color="#0f6a4a" /><stop offset="1" stop-color="#3a0a6a" /></linearGradient>
										<radialGradient id="{u}-glow{r}" cx="50%" cy="48%" r="50%"><stop offset="0" stop-color="#eaffb0" stop-opacity="0.9" /><stop offset="0.5" stop-color="#8dff5a" stop-opacity="0.35" /><stop offset="1" stop-color="#8dff5a" stop-opacity="0" /></radialGradient>
										<linearGradient id="{u}-cleaf{r}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ffd8" /><stop offset="0.45" stop-color="#8dff5a" /><stop offset="1" stop-color="#16b84a" /></linearGradient>
										<filter id="{u}-blur{r}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" /></filter>
									</defs>
									<rect width="64" height="192" fill="url(#{u}-col{r})" />
									<g class="col-rays" opacity="0.35">{#each COL_RAYS as d, i (i)}<path {d} fill={i % 2 ? '#ff7ad9' : '#b6ff7a'} />{/each}</g>
									<g class="col-smoke" filter="url(#{u}-blur{r})">
										{#each PUFFS as p, i (i)}<circle cx={p.x} cy="170" r={p.r} fill="#e2e7e2" opacity="0.5" style:animation-delay="{p.d}s" />{/each}
									</g>
									<ellipse cx="32" cy="92" rx="34" ry="46" fill="url(#{u}-glow{r})" />
									<g transform="translate(32 90) scale(4.2) translate(-12 -15.5)">
										<path d={LEAF_STEM} stroke="#0b3d14" stroke-width="0.9" stroke-linecap="round" />
										{#each LEAF_PATHS as d, i (i)}<path {d} fill="url(#{u}-cleaf{r})" stroke="#0b3d14" stroke-width="0.4" stroke-linejoin="round" />{/each}
										<path d="M12 20 L12 8.6 M12 20 L7.2 11.6 M12 20 L16.8 11.6 M12 20 L6.6 16.6 M12 20 L17.4 16.6" stroke="#f6ffd8" stroke-width="0.3" stroke-linecap="round" opacity="0.85" />
									</g>
									<rect x="6" y="146" width="52" height="19" rx="9.5" fill="#ff2fa8" stroke="#12051f" stroke-width="2.6" />
									<text x="32" y="160.2" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="13" fill="#fff" letter-spacing="1.6">WILD</text>
									{#each [[10, 30], [54, 44], [12, 128], [52, 120]] as [x, y], i (i)}
										<path class="col-spark" style:animation-delay="{-i * 0.45}s" d="M{x} {y - 4} l1.2 2.8 l2.8 1.2 l-2.8 1.2 l-1.2 2.8 l-1.2 -2.8 l-2.8 -1.2 l2.8 -1.2 Z" fill="#fff6b0" />
									{/each}
								</svg>
							</div>
						{/each}
					</div>
				{/if}
				<!-- the winning paylines, over the cells they pay on (from either end) -->
				<svg class="paylines" viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true">
					{#each wins as w, i (`${w.line}-${w.dir}-${i}`)}
						<polyline
							points={reelsOf(w)
								.map((r) => `${r * 100 + 50},${LINES[w.line][r] * 100 + 50}`)
								.join(' ')}
							fill="none"
							stroke={LINE_COLORS[w.line]}
							stroke-width="7"
							stroke-linejoin="round"
							stroke-linecap="round"
							vector-effect="non-scaling-stroke"
						/>
					{/each}
				</svg>
				{#if pop}
					<p class="pop font-head" data-kind={pop.kind} aria-hidden="true">{pop.text}</p>
				{/if}
				{#if celebrate}
					<div class="celebrate" data-tier={tier} role="status">
						<div class="rain" aria-hidden="true">
							{#each RAIN as drop, i (i)}<span style:left="{drop.x}%" style:animation-delay="{drop.d}s" style:animation-duration="{drop.dur}s"><KushSymbolView symbol={i % 3 ? 'leaf' : 'x420'} size={30} /></span>{/each}
						</div>
						<p class="big font-head">{s.tiers[tier === 'none' ? 'win' : tier]}</p>
						<p class="amount font-head num">+{lastWin.toLocaleString('en-US')} 🍔</p>
					</div>
				{/if}
			</div>

			<p class="msg" aria-live="polite">{message}</p>

			<!-- the panel: burgers, bet, win, spin -->
			<div class="panel">
				<div class="led cred"><span>{s.credits}</span><b class="num">{shown.toLocaleString('en-US')}</b></div>
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

			<!-- auto spin -->
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

			<!-- buy: a spin that starts with a leaf, or one that starts as a KUSHBURST; asked first -->
			<div class="buy" role="group" aria-label={s.buy}>
				{#if buyAsk}
					<p class="buy-ask" role="status">{s.buyAsk(s.buyWhat[buyAsk], price(buyAsk))}</p>
					<div class="flex gap-1.5">
						<button type="button" class="buy-yes font-head" disabled={spinning || price(buyAsk) > shown} onclick={() => void confirmBuy()}>{s.buyYes}</button>
						<button type="button" class="buy-no font-head" onclick={() => (buyAsk = null)}>{s.buyNo}</button>
					</div>
				{:else}
					<span class="buy-label font-head">{s.buy}</span>
					<div class="buy-list">
						{#each KUSH_BUYS as k (k)}
							<button type="button" class="buy-btn" data-buy={k} disabled={spinning || autoLeft > 0 || price(k) > shown} onclick={() => askBuy(k)}>
								<KushSymbolView symbol={k === 'burst' ? 'x420' : 'leaf'} size={30} />
								<span class="min-w-0 text-left">
									<b class="block font-head">{s.buyKinds[k]}</b>
									<span class="num">{s.buyPrice(price(k))}</span>
								</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<details class="paytable mt-3 text-xs text-muted">
	<summary class="min-h-11 cursor-pointer content-center font-semibold">{s.paytable}</summary>
	<p class="pb-2">{s.how}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-1.5 pb-1">
		<li class="pay-row flex items-center gap-2 rounded-lg px-2 py-1">
			<KushSymbolView symbol="leaf" size={34} />
			<span class="min-w-0"><b class="block text-fg">{sym.leaf}</b>{s.leafRow}</span>
		</li>
		{#each [...KUSH_PAYING].reverse() as x (x)}
			<li class="pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				<KushSymbolView symbol={x} size={34} />
				<span class="min-w-0"><b class="block text-fg">{sym[x]}</b>{s.payRow(...KUSH_PAYS[x])}</span>
			</li>
		{/each}
	</ul>
	<p class="pb-1">{s.payNote}</p>
	<p class="pb-1">{s.burstNote(KUSH_MULT)}</p>
	<p class="pb-1">{s.rainNote(Math.round(LEAF_RAIN * 100))}</p>
	<p class="pb-1">{s.buyNote(KUSH_BUY_PRICE.leaf, KUSH_BUY_PRICE.burst)}</p>
	<p class="pb-1">{s.maxNote(KUSH_MAX_WIN)}</p>
</details>

<style>
	.kush-wrap {
		container-type: inline-size;
	}
	/* the reels fill the width: 5 cells + the window's and cabinet's edges (≈ 56 px) */
	.kush {
		--cell: clamp(40px, calc((100cqi - 56px) / 5), 108px);
		max-width: 600px;
	}
	@supports not (width: 1cqi) {
		.kush {
			--cell: 48px;
		}
	}
	.cab {
		position: relative;
		isolation: isolate;
		overflow: hidden;
		padding: 10px 10px 12px;
		border: 3px solid #ff3fb4;
		border-radius: 22px 22px 14px 14px;
		background:
			radial-gradient(120% 60% at 50% 0%, rgb(255 63 180 / 0.22), transparent 60%),
			radial-gradient(100% 60% at 50% 100%, rgb(141 255 90 / 0.14), transparent 60%),
			linear-gradient(180deg, #2a0a5a, #160436 60%, #0b021c);
		box-shadow:
			0 0 0 3px #12042a,
			0 0 0 5px #8dff5a,
			0 0 26px rgb(141 255 90 / 0.4),
			0 0 40px rgb(255 63 180 / 0.25),
			inset 0 2px 0 rgb(255 255 255 / 0.18);
		color: #f2e6ff;
	}
	/* lava-lamp blobs drifting behind everything */
	.lava {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		overflow: hidden;
	}
	.lava span {
		position: absolute;
		width: 44%;
		aspect-ratio: 1;
		border-radius: 46% 54% 60% 40%;
		filter: blur(26px);
		opacity: 0.3;
		animation: lava 18s ease-in-out infinite alternate;
	}
	.lava span:nth-child(1) {
		left: -10%;
		top: 20%;
		background: #ff3fb4;
	}
	.lava span:nth-child(2) {
		right: -12%;
		top: 46%;
		background: #3aff6a;
		animation-duration: 23s;
		animation-delay: -6s;
	}
	.lava span:nth-child(3) {
		left: 30%;
		bottom: -18%;
		background: #8a3aff;
		animation-duration: 27s;
		animation-delay: -12s;
	}
	@keyframes lava {
		50% {
			transform: translate(18%, -14%) scale(1.15) rotate(40deg);
		}
		100% {
			transform: translate(-8%, 10%) scale(0.9) rotate(-20deg);
		}
	}
	/* the marquee */
	.marquee {
		position: relative;
		margin-bottom: 10px;
		padding: 10px 8px 8px;
		border-radius: 14px;
		background: linear-gradient(180deg, rgb(10 2 24 / 0.92), rgb(20 4 44 / 0.85));
		box-shadow:
			inset 0 0 0 2px #8dff5a,
			inset 0 0 14px rgb(141 255 90 / 0.25);
		text-align: center;
		overflow: hidden;
	}
	.logo {
		position: relative;
		max-width: 440px;
		margin: 4px auto 0;
	}
	/* under it: always room for the respin counter + its line, so the reels never move */
	.lines {
		position: relative;
		display: grid;
		align-content: center;
		min-height: 42px;
	}
	.title {
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: 0.08em;
	}
	.subtitle {
		margin-top: 4px;
		color: #ffb3e6;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		text-shadow: 0 0 6px rgb(255 63 180 / 0.7);
	}
	.subtitle .arrow {
		color: #8dff5a;
		text-shadow: 0 0 6px #8dff5a;
	}
	.marquee.respin-on {
		box-shadow:
			inset 0 0 0 2px #ff3fb4,
			0 0 16px rgb(255 63 180 / 0.55);
	}
	.respin-title {
		font-size: clamp(15px, 4.4cqi, 21px);
		color: #fff0fa;
		text-shadow:
			0 0 6px #ff3fb4,
			0 0 16px #ff3fb4;
		-webkit-text-stroke: 1px #8dff5a;
	}
	/* the reel window */
	.window {
		position: relative;
		padding: 6px;
		border-radius: 12px;
		background: #07020f;
		box-shadow:
			inset 0 0 0 2px #ff3fb4,
			inset 0 10px 18px rgb(0 0 0 / 0.8),
			0 0 12px rgb(255 63 180 / 0.35);
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
			radial-gradient(80% 50% at 50% 50%, rgb(138 58 255 / 0.25), transparent 70%),
			linear-gradient(180deg, #12042a, #24094a 50%, #12042a);
		box-shadow:
			inset 0 6px 8px rgb(0 0 0 / 0.55),
			inset 0 -6px 8px rgb(0 0 0 / 0.55),
			inset 0 0 0 1px rgb(255 63 180 / 0.25);
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
	.cell :global(.kush-sym) {
		width: calc(var(--cell) * 0.8);
		height: calc(var(--cell) * 0.8);
	}
	.cell.win {
		background: radial-gradient(circle, rgb(141 255 90 / 0.55), rgb(255 63 180 / 0.2) 60%, transparent 72%);
		animation: win-pop 0.8s ease-in-out infinite alternate;
	}
	.cell.fresh {
		background: radial-gradient(circle, rgb(242 255 200 / 0.9), rgb(141 255 90 / 0.45) 55%, transparent 72%);
		animation: fresh 0.42s ease-out both;
	}
	@keyframes win-pop {
		to {
			transform: scale(1.08);
		}
	}
	@keyframes fresh {
		from {
			transform: scale(1.35);
		}
	}
	/* the leaf columns: the same grid as the reels, over them */
	.leaf-layer {
		position: absolute;
		inset: 6px;
		display: grid;
		grid-template-columns: repeat(5, var(--cell));
		grid-template-rows: calc(var(--cell) * 3);
		justify-content: center;
		column-gap: 4px;
		pointer-events: none;
	}
	.leaf-col {
		grid-row: 1;
		overflow: hidden;
		border-radius: 8px;
		box-shadow:
			inset 0 0 0 2.5px #8dff5a,
			0 0 14px rgb(141 255 90 / 0.75);
	}
	.leaf-col svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.leaf-col.grow {
		transform-origin: 50% var(--from);
		animation: grow 0.7s cubic-bezier(0.2, 1.4, 0.4, 1) both;
	}
	.leaf-col.win {
		box-shadow:
			inset 0 0 0 3px #fff6b0,
			0 0 20px rgb(242 255 160 / 0.95);
	}
	@keyframes grow {
		0% {
			transform: scaleY(0.33);
			filter: brightness(2.2);
		}
		60% {
			filter: brightness(1.4);
		}
		100% {
			transform: scaleY(1);
			filter: none;
		}
	}
	.col-rays {
		transform-box: view-box;
		transform-origin: 32px 92px;
		animation: col-turn 16s linear infinite;
	}
	@keyframes col-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.col-smoke circle {
		animation: col-puff 4.6s ease-in infinite;
	}
	@keyframes col-puff {
		0% {
			transform: translateY(0) scale(0.6);
			opacity: 0;
		}
		20% {
			opacity: 0.55;
		}
		100% {
			transform: translateY(-170px) scale(1.8);
			opacity: 0;
		}
	}
	.col-spark {
		transform-box: fill-box;
		transform-origin: center;
		animation: col-twinkle 1.8s ease-in-out infinite;
	}
	@keyframes col-twinkle {
		0%,
		100% {
			opacity: 0.15;
			transform: scale(0.5);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
	.paylines {
		position: absolute;
		inset: 6px;
		width: calc(var(--cell) * 5 + 16px);
		height: calc(100% - 12px);
		margin: 0 auto;
		pointer-events: none;
		filter: drop-shadow(0 0 4px rgb(0 0 0 / 0.85));
	}
	/* KUSHBURST ×3, RESPIN!, LEAF RAIN over the reels */
	.pop {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 3;
		margin: 0;
		max-width: 94%;
		transform: translate(-50%, -50%);
		padding: 4px 18px;
		border-radius: 14px;
		font-size: clamp(20px, 7cqi, 40px);
		font-weight: 900;
		line-height: 1.1;
		text-align: center;
		pointer-events: none;
		animation: pop 1.2s ease-out both;
	}
	.pop[data-kind='burst'] {
		border: 3px solid #f2ffc8;
		background: radial-gradient(circle, #2fae46, #0b4a1c);
		color: #fff;
		text-shadow:
			0 3px 0 #083a17,
			0 0 14px #ff3fb4;
		box-shadow:
			0 0 26px rgb(141 255 90 / 0.95),
			0 0 50px rgb(255 63 180 / 0.6);
		animation-duration: 2.4s;
	}
	.pop[data-kind='respin'] {
		top: 18%;
		padding: 2px 14px;
		border: 2px solid #ffb3e6;
		background: rgb(120 10 90 / 0.9);
		color: #fff0fa;
		font-size: clamp(15px, 4.6cqi, 24px);
		letter-spacing: 0.12em;
		box-shadow: 0 0 16px rgb(255 63 180 / 0.7);
	}
	.pop[data-kind='rain'] {
		top: 22%;
		padding: 2px 14px;
		border: 2px solid #b6ff7a;
		background: rgb(10 60 30 / 0.92);
		color: #eaffd8;
		font-size: clamp(14px, 4.4cqi, 22px);
		letter-spacing: 0.08em;
		box-shadow: 0 0 16px rgb(141 255 90 / 0.7);
		animation-duration: 1.3s;
	}
	@keyframes pop {
		0% {
			transform: translate(-50%, -50%) scale(2);
			opacity: 0;
		}
		16% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		82% {
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -60%) scale(0.94);
			opacity: 0;
		}
	}
	.celebrate {
		position: absolute;
		inset: 0;
		z-index: 4;
		display: grid;
		place-content: center;
		justify-items: center;
		border-radius: 12px;
		background: radial-gradient(circle, rgb(40 6 70 / 0.55), rgb(4 0 12 / 0.8));
		overflow: hidden;
		pointer-events: none;
	}
	.big {
		position: relative;
		font-size: clamp(26px, 9cqi, 52px);
		font-weight: 900;
		letter-spacing: 0.06em;
		color: #f2ffe0;
		-webkit-text-stroke: 1.5px #ff3fb4;
		text-shadow:
			0 3px 0 #3a0a6a,
			0 0 18px #8dff5a;
		animation: big-in 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.celebrate[data-tier='kushburst'] .big {
		color: #fff;
		text-shadow:
			0 3px 0 #3a0a6a,
			0 0 22px #ff3fb4,
			0 0 34px #8dff5a;
	}
	.amount {
		position: relative;
		font-size: clamp(18px, 5.5cqi, 30px);
		font-weight: 900;
		color: #fff6b0;
		text-shadow: 0 2px 0 #3a0a6a;
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
	@media (prefers-reduced-motion: reduce) {
		.lava span,
		.cell.win,
		.cell.fresh,
		.leaf-col.grow,
		.col-rays,
		.col-spark,
		.pop,
		.big {
			animation: none;
		}
		.col-smoke,
		.rain {
			display: none;
		}
	}
	.msg {
		min-height: 2.4em;
		margin: 8px 2px 6px;
		color: #eadcff;
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
	.led.cred {
		grid-area: cred;
	}
	.led.bet {
		grid-area: bet;
		container-type: inline-size;
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
		background: #07020f;
		box-shadow: inset 0 0 0 2px #4a1a7a;
	}
	.led span {
		color: #ff9ad9;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.led b {
		max-width: 100%;
		overflow: hidden;
		color: #8dff5a;
		font-family: ui-monospace, Consolas, monospace;
		font-size: 17px;
		font-weight: 800;
		text-overflow: clip;
		white-space: nowrap;
		text-shadow: 0 0 8px rgb(141 255 90 / 0.75);
	}
	.led.win b {
		color: #ffe14a;
		text-shadow: 0 0 8px rgb(255 225 74 / 0.7);
	}
	/* BET over − 1,000 +; when the box is too narrow for "10,000" between the buttons: − BET + on top,
	   the number under them */
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
	.stepper {
		position: relative;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: #2a0a4a;
		color: #ffb3e6;
		font-weight: 900;
		box-shadow: inset 0 0 0 1.5px #ff3fb4;
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
		border: 3px solid #f2ffe0;
		border-radius: 999px;
		background: radial-gradient(circle at 40% 30%, #eaffb0, #5fe36a 50%, #138a3a);
		color: #0b2a12;
		font-size: 17px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.5);
		box-shadow:
			0 4px 0 #0b4a1c,
			0 0 16px rgb(141 255 90 / 0.65);
	}
	.spin:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: 0 1px 0 #0b4a1c;
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
		border: 2px solid #8dff5a;
		border-radius: 999px;
		background: #12042a;
		color: #b6ff7a;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.auto-btn[aria-pressed='true'] {
		background: #8dff5a;
		color: #12042a;
		box-shadow: 0 0 12px rgb(141 255 90 / 0.7);
	}
	.auto-btn:disabled {
		opacity: 0.45;
	}
	.auto-n {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		background: #07020f;
		color: #ff9ad9;
		font-size: 13px;
		font-weight: 800;
		box-shadow: inset 0 0 0 2px #4a1a7a;
	}
	.auto-n[aria-pressed='true'] {
		color: #b6ff7a;
		box-shadow: inset 0 0 0 2px #8dff5a;
	}
	/* buy */
	.buy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed rgb(255 63 180 / 0.45);
	}
	.buy-label {
		color: #ffb3e6;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}
	.buy-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		width: 100%;
	}
	.buy-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		min-height: 48px;
		padding: 4px 8px;
		border-radius: 10px;
		background: #07020f;
		box-shadow: inset 0 0 0 2px #4a1a7a;
		color: #ff9ad9;
		font-size: 11px;
		line-height: 1.15;
	}
	.buy-btn b {
		color: #b6ff7a;
		font-size: 11.5px;
		overflow-wrap: anywhere;
	}
	.buy-btn:not(:disabled):hover {
		box-shadow: inset 0 0 0 2px #8dff5a;
	}
	.buy-btn:disabled {
		opacity: 0.45;
	}
	.buy-btn :global(.kush-sym) {
		flex: none;
	}
	.buy-ask {
		flex: 1 1 14em;
		color: #f2e6ff;
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
		border: 2px solid #f2ffe0;
		background: #2fae46;
		color: #fff;
	}
	.buy-yes:disabled {
		opacity: 0.5;
	}
	.buy-no {
		border: 2px solid #ff3fb4;
		background: #2a0a4a;
		color: #ffb3e6;
	}
	.pay-row {
		background: rgb(40 10 80 / 0.25);
		box-shadow: inset 0 0 0 1px rgb(255 63 180 / 0.25);
	}
</style>
