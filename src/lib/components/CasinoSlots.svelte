<!--
	Abscar's Fortune, the Burger Bandit (casino-slots.ts; 2026-11-16, the user's asks: "a one-armed
	bandit in burger theme, fun, fat and nice with lots of different wins, like a real one", then
	"'Abscar's fortune' somewhere on it, the machine's arm a big smoking holk / cigar").
	A cabinet with a marquee of chasing bulbs, 5 reels that spin and stop one by one, the 10 paylines
	drawn over the winning cells, free spins, BIG / MEGA WIN / BURGER JACKPOT, and the lever: a big
	holk with a glowing ember and Abscar's own smoke (abscarOperator.ts), pulled down to spin.
	The whole spin and its free spins are worked out and booked at once (squad.recordGame), then shown;
	`hidden` = burgers won but not shown yet, so the balance above doesn't give the result away.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { holk, smoke } from '#lib/abscarOperator.ts';
	import {
		evaluate,
		play,
		winTier,
		FREE_SPINS,
		LINES,
		PAYS,
		REELS,
		ROWS,
		SCATTER_PAYS,
		SLOT_BETS,
		STRIPS,
		SYMBOLS,
		type LineWin,
		type Play,
		type SlotSymbol,
		type SpinResult,
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
	let free = $state<{ left: number; total: number } | null>(null);

	/** What each reel shows: during a spin a long strip that slides up; at rest the 3 visible symbols. */
	let cols = $state(START.grid.map((items) => ({ items, y: 0, dur: 0 })));

	/** Cells that are part of a win (for the glow): "reel-row". */
	const winCells = $derived.by(() => {
		const set = new Set<string>();
		for (const w of wins) LINES[w.line].slice(0, w.count).forEach((row, r) => set.add(`${r}-${row}`));
		if (scatterHit) screen.grid.forEach((col, r) => col.forEach((sym, row) => sym === 'scatter' && set.add(`${r}-${row}`)));
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
		hidden = Math.max(0, hidden - result.win);
		lastWin = result.win;
		const parts = [
			...result.lines.map((l) => s.lineWin(l.line + 1, l.count, s.symbols[l.symbol], l.win)),
			...(result.scatterWin || result.freeSpins ? [s.scatterWin(result.scatters, result.scatterWin, result.freeSpins)] : [])
		];
		message = parts.length ? parts.join(' · ') : s.noWin;
		if (result.win > 0) sound.play('camo');
	}

	async function spin() {
		if (spinning) return;
		if (bet > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		const p: Play = play(bet, rand);
		// booked now (closing the page changes nothing), shown below
		squad.recordGame(p.net);
		hidden = p.win;
		spinning = true;
		pulled = true;
		setTimeout(() => (pulled = false), 520);
		wins = [];
		scatterHit = false;
		tier = 'none';
		celebrate = false;
		message = s.spinning;
		lastWin = 0;
		await spinReels(p.base);
		show(p.base);
		if (p.free.length) {
			let total = p.base.freeSpins;
			free = { left: total, total };
			message = `${s.freeWon(total)} ${message}`;
			await sleep(reduce() ? 300 : 1500);
			for (const fs of p.free) {
				wins = [];
				scatterHit = false;
				await spinReels(fs);
				show(fs);
				total += fs.freeSpins;
				free = { left: free!.left - 1 + fs.freeSpins, total };
				await sleep(reduce() ? 250 : 900);
			}
			free = null;
			lastWin = p.win;
			message = `${s.lastWin}: ${p.win.toLocaleString('en-US')} 🍔`;
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
		};
	});

	function stepBet(dir: 1 | -1) {
		const i = SLOT_BETS.indexOf(bet);
		bet = SLOT_BETS[Math.max(0, Math.min(SLOT_BETS.length - 1, i + dir))];
	}

	const reelText = (r: number) => s.reelLabel(r + 1, screen.grid[r].map((x) => s.symbols[x]).join(', '));
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.4 + (i % 4) * 0.25 }));
</script>

<div class="bandit" class:spinning>
	<div class="cabinet">
		<!-- the marquee: chasing bulbs round "ABSCAR'S FORTUNE" -->
		<div class="marquee">
			<div class="bulbs" aria-hidden="true">
				{#each Array.from({ length: 22 }) as _, i (i)}<span style:--i={i}></span>{/each}
			</div>
			<p class="title font-head">Abscar’s Fortune</p>
			<p class="subtitle font-head">{t.casino.games.slotsSub} · {s.lines}</p>
		</div>

		<!-- the reels -->
		<div class="window" role="group" aria-label={t.casino.games.slots}>
			<div class="reels">
				{#each cols as col, r (r)}
					<div class="reel" role="img" aria-label={reelText(r)}>
						<div class="strip" style:transform={`translateY(calc(var(--cell) * ${-col.y}))`} style:transition={col.dur ? `transform ${col.dur}ms cubic-bezier(0.18, 0.7, 0.28, 1.06)` : 'none'}>
							{#each col.items as sym, i (i)}
								<div class="cell" class:win={!spinning && col.items.length === ROWS && winCells.has(`${r}-${i}`)}>
									<SlotSymbolView symbol={sym} size={48} />
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<!-- the winning paylines, drawn over the cells -->
			{#if !spinning || free}
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
			{#if free}
				<p class="free-banner font-head" role="status">{s.free(free.left, free.total)}</p>
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
				<span>{t.casino.bet}</span>
				<div class="flex items-center gap-1">
					<button type="button" class="stepper" aria-label="−" disabled={spinning || bet === SLOT_BETS[0]} onclick={() => stepBet(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={t.casino.betLabel(bet)}>{bet}</b>
					<button type="button" class="stepper" aria-label="+" disabled={spinning || bet === SLOT_BETS[SLOT_BETS.length - 1]} onclick={() => stepBet(1)}>+</button>
				</div>
			</div>
			<div class="led win"><span>{s.lastWin}</span><b class="num">{lastWin.toLocaleString('en-US')}</b></div>
			<button type="button" class="spin font-head" disabled={spinning || autoLeft > 0} onclick={() => void spin()}>{spinning ? '…' : s.spin}</button>
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
				<SlotSymbolView symbol={sym} size={34} />
				<span class="min-w-0">
					<b class="block text-fg">{s.symbols[sym]}</b>
					{#if sym === 'scatter'}
						{s.scatterRow(...SCATTER_PAYS, ...FREE_SPINS)}
					{:else}
						{s.payRow(...PAYS[sym])}
					{/if}
				</span>
			</li>
		{/each}
	</ul>
	<p class="pb-1">{s.payNote}</p>
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
	.free-banner {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		padding: 6px 12px;
		border: 3px solid #ffc928;
		border-radius: 10px;
		background: rgb(179 20 27 / 0.92);
		color: #fff6b0;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.1em;
		white-space: nowrap;
		pointer-events: none;
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
		.rain {
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
