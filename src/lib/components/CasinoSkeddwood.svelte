<!--
	Skeddwood, BurgiCasino's third slot (skeddwood.ts; 2026-11-20, the user's ask: "another slot like the
	'Deadwood 2' slot but called Skeddwood; the cowboy can be Abscar's terminator exoskeleton with a cowboy
	hat; bonus and free spins like it; the camo grinder's theme but keep how the game plays").
	A saloon cabinet in dark oak and brass: a "SKEDDWOOD" marquee with bullet holes, five reels of 3-4-4-4-2
	symbols (every reel as tall as the others), the cowboy WILD (Abscar's figure, 4 symbols tall) nudging step
	by step with his multiplier, High Noon flipping the letters WILD, the Skedd's puff splitting the middle
	symbols, Quick Draw's shots, Gold Rush / Divergence free spins with sticky cowboys on a layer over their
	reels, buy bonus, auto spin and turbo. Abscar's cowboy stands beside the cabinet.
	Every symbol is drawn once in SkeddSprite and shown with <use>. The whole play is worked out and booked at
	once (squad.recordGame), then shown; `hidden` = burgers won but not shown yet.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import {
		buy,
		play,
		skwMatches,
		skwTier,
		BUY_PRICE,
		COWBOY_REELS,
		FREE_START,
		FREE_STRIPS,
		HIGHS,
		LOWS,
		MAX_WIN,
		PAYS,
		REELS,
		ROWS,
		SKEDD_REEL,
		SKW_BETS,
		SKW_BUYS,
		STRIPS,
		ALLOWED,
		WILDISH,
		type Cell,
		type Nudge,
		type SkwBuy,
		type SkwMode,
		type SkwPay,
		type SkwPlay,
		type SkwSpin,
		type SkwSym,
		type SkwTier,
		type Stop
	} from '#lib/skeddwood.ts';
	import { drawUntil, lucky, SKW_TRIES } from '#lib/casino-rig.ts';
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { AutoSpin } from '#lib/autoSpin.svelte.ts';
	import AutoSpinControls from './AutoSpinControls.svelte';
	import SkeddSprite from './SkeddSprite.svelte';
	import SkeddwoodLogo from './SkeddwoodLogo.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	$effect(() => {
		pending = hidden;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const s = t.casino.skeddwood;
	const sl = t.casino.slots;
	const uid = $props.id();
	const u = `skw-${uid}`;

	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
	const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
	/** Two frames (so the reels' start position is drawn before they slide); a hidden tab draws no frames, so a timer goes too. */
	const frames = () => Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), sleep(80)]);

	/* ---------- turbo: everything faster (remembered per device) ---------- */
	const TURBO_KEY = 'mw4-camo-grind:skw-turbo';
	let turbo = $state(false);
	$effect(() => {
		try {
			turbo = localStorage.getItem(TURBO_KEY) === '1';
		} catch {
			// storage blocked: normal speed
		}
	});
	function setTurbo(on: boolean) {
		turbo = on;
		try {
			localStorage.setItem(TURBO_KEY, on ? '1' : '0');
		} catch {
			// this visit only
		}
	}
	/** A wait or an animation length at the current speed. */
	const T = (ms: number) => (reduce() ? Math.min(ms, 400) * 0.35 : turbo ? ms * 0.45 : ms);

	let bet = $state(SKW_BETS[0]);
	const shown = $derived(Math.max(0, balance - hidden));

	/* ---------- the reels: each a strip of cells sliding up; at rest 3 cells either side of the window ---------- */
	const CTX = 3;
	interface Col {
		items: Cell[];
		y: number;
		dur: number;
		ease: string;
	}
	const SPIN_EASE = 'cubic-bezier(0.18, 0.7, 0.28, 1.04)';
	const NUDGE_EASE = 'cubic-bezier(0.3, 1.5, 0.5, 1)';
	const wrap = (i: number, n: number) => ((i % n) + n) % n;
	/** The strip around a stop: CTX cells above the window, the window, CTX below. */
	const contextAt = (strips: Stop[][], r: number, stop: number): Cell[] =>
		Array.from({ length: ROWS[r] + 2 * CTX }, (_, k) => ({ ...strips[r][wrap(stop - CTX + k, strips[r].length)] }));
	/** A calm first screen: the first stops whose windows show paying symbols only. */
	const START = STRIPS.map((strip, r) => ALLOWED[r].find((st) => st > 4 && Array.from({ length: ROWS[r] }, (_, k) => strip[(st + k) % strip.length]).every((x) => (LOWS as SkwSym[]).includes(x.s) || (HIGHS as SkwSym[]).includes(x.s))) ?? 0);
	let cols = $state<Col[]>(START.map((st, r) => ({ items: contextAt(STRIPS, r, st), y: CTX, dur: 0, ease: SPIN_EASE })));
	/** The screen whose results are showing (for the labels and the win glow). */
	let screen = $state<SkwSpin | null>(null);

	/* ---------- what shows over the reels ---------- */
	/** Cowboy reels: the multiplier badge (as it builds up through the spin). */
	let badges = $state<Record<number, number>>({});
	/** Free spins: the sticky cowboys on their layer (reel → stored multiplier). */
	let sticky = $state<Record<number, number>>({});
	/** "+3" on a sticky cowboy when another lands on his reel. */
	let grows = $state<Record<number, number>>({});
	let pop = $state<{ text: string; kind: string; id: number } | null>(null);
	let popId = 0;
	let puff = $state(false);
	let firing = $state(false);
	let winOn = $state(false);
	let message = $state('');
	let lastWin = $state(0);
	let spinning = $state(false);
	let tier = $state<SkwTier>('none');
	let celebrate = $state(false);
	let freeState = $state<{ mode: SkwMode; n: number; total: number; won: number } | null>(null);
	let banner = $state<
		| { kind: 'intro'; mode: SkwMode; spins: number }
		| { kind: 'lucky'; mode: SkwMode }
		| { kind: 'more'; spins: number }
		| { kind: 'upgrade'; spins: number }
		| { kind: 'outro'; spins: number; won: number }
		| null
	>(null);
	let buyAsk = $state<SkwBuy | null>(null);
	let spinBtn = $state<HTMLButtonElement>();

	function showPop(text: string, kind: string, ms = 1500) {
		const id = ++popId;
		pop = { text, kind, id };
		setTimeout(() => popId === id && (pop = null), T(ms));
	}

	/** Cells that are part of a win: "reel-row", or "reel-*" for a cowboy reel. */
	const winCells = $derived.by(() => {
		const set = new Set<string>();
		if (!screen || !winOn) return set;
		for (const w of screen.wins)
			for (let r = 0; r < w.reels; r++) {
				if (screen.cowboys[r]) set.add(`${r}-*`);
				else screen.grid[r].forEach((c, row) => (c.s === w.sym || WILDISH.has(c.s)) && set.add(`${r}-${row}`));
			}
		// the golden skulls that start free spins, the tombstones that add more
		const glow = (s: SkwSym) => screen!.grid.forEach((col, r) => col.forEach((c, row) => c.s === s && set.add(`${r}-${row}`)));
		if (screen.trigger) glow('skull');
		if (screen.graves >= 3) glow('grave');
		return set;
	});

	/* ---------- a spin, shown ---------- */
	async function spinTo(sp: SkwSpin) {
		const strips = sp.mode ? FREE_STRIPS : STRIPS;
		const ctx = sp.stops.map((st, r) => contextAt(strips, r, st));
		// Divergence: the Skedd stands on reel 5 and doesn't spin
		const still = (r: number) => sp.mode === 'divergence' && r === SKEDD_REEL;
		if (!reduce()) {
			const filler = (r: number) =>
				Array.from({ length: (turbo ? 5 : 9) + r * (turbo ? 1 : 3) }, (): Cell => {
					const x = strips[r][Math.floor(rand() * strips[r].length)];
					// tall pieces would show chopped up: a paying symbol instead
					return x.s === 'cowboy' || x.s === 'skedd' ? { s: r === SKEDD_REEL ? 'jeeven' : 'ten' } : { ...x };
				});
			cols = cols.map((c, r) => (still(r) ? { items: ctx[r], y: CTX, dur: 0, ease: SPIN_EASE } : { items: [...c.items.slice(c.y - CTX, c.y + ROWS[r] + CTX), ...filler(r), ...ctx[r]], y: CTX, dur: 0, ease: SPIN_EASE }));
			await tick();
			await frames();
			const len = (r: number) => T(600 + r * 210);
			cols = cols.map((c, r) => (still(r) ? c : { ...c, y: c.items.length - ROWS[r] - CTX, dur: len(r) }));
			await sleep(len(REELS - 1) + 120);
		}
		cols = ctx.map((items) => ({ items, y: CTX, dur: 0, ease: SPIN_EASE }));
	}

	/** One cowboy nudging in, a step at a time, his badge counting up. */
	async function nudge(n: Nudge, strips: Stop[][]) {
		badges = { ...badges, [n.reel]: 1 };
		for (let k = 1; k <= n.steps; k++) {
			cols[n.reel] = { ...cols[n.reel], y: CTX + n.dir * k, dur: T(300), ease: NUDGE_EASE };
			badges = { ...badges, [n.reel]: 1 + k };
			sound.play('camo');
			await sleep(T(380));
		}
		cols[n.reel] = { items: contextAt(strips, n.reel, n.to), y: CTX, dur: 0, ease: SPIN_EASE };
	}

	/** Put a cell of the result into the reel's window (High Noon, splits, shots). */
	function setCell(r: number, row: number, c: Cell) {
		const items = [...cols[r].items];
		items[CTX + row] = { ...c };
		cols[r] = { ...cols[r], items };
	}

	async function playSpin(sp: SkwSpin) {
		const strips = sp.mode ? FREE_STRIPS : STRIPS;
		winOn = false;
		screen = null;
		grows = {};
		// sticky cowboys keep their badge through the spin; everything else starts over
		badges = Object.fromEntries(Object.keys(sticky).map((r) => [r, sticky[Number(r)]]));
		await spinTo(sp);
		screen = sp;

		// sticky cowboys: another landing on their reel adds to them
		for (const r of COWBOY_REELS)
			if (sp.mode && sp.held[r] && sp.grow[r]) {
				grows = { ...grows, [r]: sp.grow[r] };
				badges = { ...badges, [r]: sp.held[r] + sp.grow[r] };
				sound.play('camo');
			}
		// new cowboys: nudge in (or stand, if they landed whole)
		for (const r of COWBOY_REELS) {
			if (!sp.cowboys[r] || (sp.mode && sp.held[r])) continue;
			const n = sp.nudges.find((x) => x.reel === r);
			if (n) {
				message = s.nudgeMsg(n.mult);
				await nudge(n, strips);
			} else badges = { ...badges, [r]: 1 };
			if (sp.mode) {
				// he sticks from here
				await sleep(T(160));
				sticky = { ...sticky, [r]: sp.grow[r] };
			}
		}
		if (sp.nudges.length || Object.keys(grows).length) await sleep(T(320));

		// High Noon
		if (sp.highNoon) {
			message = s.highNoonMsg;
			showPop(s.pops.highNoon, 'noon');
			sound.play('maxed');
			await sleep(T(500));
			for (const r of COWBOY_REELS) if (!sp.cowboys[r]) sp.grid[r].forEach((c, row) => c.flip && setCell(r, row, c));
			await sleep(T(700));
		}
		// the Skedd's puff
		if (sp.skedd) {
			message = s.skeddMsg;
			puff = true;
			showPop(s.pops.skedd, 'skedd');
			sound.play('maxed');
			await sleep(T(650));
			for (let r = 0; r < SKEDD_REEL; r++) {
				if (sp.cowboys[r]) badges = { ...badges, [r]: (badges[r] ?? 1) * 2 };
				else sp.grid[r].forEach((c, row) => c.split && setCell(r, row, { ...cols[r].items[CTX + row], split: true }));
			}
			await sleep(T(700));
			puff = false;
		}
		// Quick Draw
		if (sp.shots.length) {
			message = s.quickMsg(sp.shots.length);
			showPop(s.pops.quick, 'quick', 1100);
			await sleep(T(500));
			const xs: Record<string, number> = {};
			for (const sh of sp.shots) {
				firing = true;
				sound.play('camo');
				if (sp.cowboys[sh.reel]) badges = { ...badges, [sh.reel]: (badges[sh.reel] ?? 1) * 2 };
				else {
					const k = `${sh.reel}-${sh.row}`;
					xs[k] = (xs[k] ?? 1) * 2;
					setCell(sh.reel, sh.row, { ...cols[sh.reel].items[CTX + sh.row], x: xs[k] });
				}
				await sleep(T(160));
				firing = false;
				await sleep(T(220));
			}
		}
		// the screen as worked out (the reel windows match it now), the wins
		for (let r = 0; r < REELS; r++) if (!sp.cowboys[r]) sp.grid[r].forEach((c, row) => setCell(r, row, c));
		badges = { ...sp.cowboys };
		// free spins: what this spin added stays on the sticky cowboys
		if (sp.mode) for (const [r, g] of Object.entries(sp.grow)) sticky = { ...sticky, [r]: (sp.held[Number(r)] ?? 0) + g };
		winOn = true;
		hidden = Math.max(0, hidden - sp.win);
		lastWin = sp.win;
		message = winText(sp);
		if (sp.win >= bet * 10) sound.play('maxed');
		else if (sp.win > 0) sound.play('camo');
	}

	const symName = (x: SkwSym) => s.symbols[x];
	function winText(sp: SkwSpin): string {
		if (!sp.wins.length) return sp.trigger ? '' : s.noWin;
		const top = [...sp.wins].sort((a, b) => b.win - a.win);
		const parts = top.slice(0, 2).map((w) => s.wayWin(symName(w.sym), w.reels, w.ways, w.mult, w.win));
		if (top.length > 2) parts.push(s.moreWins(top.length - 2));
		return `${parts.join(' · ')}${top.length > 1 ? ` · ${sl.lastWin}: ${sp.win.toLocaleString('en-US')} 🍔` : ''}`;
	}

	/* ---------- waiting for a tap on a screen (or a timer) ---------- */
	let tapGo: (() => void) | null = null;
	function waitTap(ms: number): Promise<void> {
		return new Promise((res) => {
			const done = () => {
				clearTimeout(timer);
				if (tapGo === done) tapGo = null;
				res();
			};
			const timer = setTimeout(done, auto.running ? Math.min(ms, 1800) : ms);
			tapGo = done;
		});
	}

	/* ---------- free spins ---------- */
	async function runFree(p: SkwPlay) {
		if (!p.mode) return;
		let total = Math.min(p.freeStart, p.free.length);
		let won = 0;
		await sleep(T(600));
		if (p.kind === 'lucky') {
			banner = { kind: 'lucky', mode: p.mode };
			sound.play(p.mode === 'divergence' ? 'divergence' : 'maxed');
			await waitTap(reduce() ? 1200 : 2200);
		}
		banner = { kind: 'intro', mode: p.mode, spins: total };
		sound.play('maxed');
		await waitTap(reduce() ? 1500 : 3200);
		banner = null;
		sticky = {};
		for (let i = 0; i < p.free.length && alive; i++) {
			const fs = p.free[i];
			freeState = { mode: fs.mode ?? p.mode, n: i + 1, total, won };
			await playSpin(fs);
			won += fs.win;
			freeState = { mode: fs.mode ?? p.mode, n: i + 1, total, won };
			const more = Math.min(fs.more ?? 0, p.free.length - total);
			if (more > 0) {
				total += more;
				freeState = { mode: fs.upgrade ? 'divergence' : (fs.mode ?? p.mode), n: i + 1, total, won };
				banner = fs.upgrade ? { kind: 'upgrade', spins: more } : { kind: 'more', spins: more };
				sound.play(fs.upgrade ? 'divergence' : 'maxed');
				await sleep(T(1700));
				banner = null;
			}
			await sleep(T(fs.win > 0 ? 900 : 450));
		}
		freeState = null;
		// the sticky cowboys walk off: their win glow goes with them
		sticky = {};
		badges = {};
		winOn = false;
		won = Math.min(won, p.win);
		banner = { kind: 'outro', spins: p.free.length, won };
		lastWin = won;
		await waitTap(reduce() ? 1500 : 3200);
		banner = null;
	}

	/** Book a play at once, then show it. */
	async function run(p: SkwPlay) {
		squad.recordGame(p.net);
		hidden = p.win;
		spinning = true;
		tier = 'none';
		celebrate = false;
		lastWin = 0;
		sticky = {};
		if (p.base) {
			message = s.spinning;
			await playSpin(p.base);
			if (p.base.trigger) {
				message = p.base.trigger === 'divergence' ? s.pops.divergence : s.pops.gold;
				showPop(p.base.trigger === 'divergence' ? s.pops.divergence : s.pops.gold, p.base.trigger, 1800);
				sound.play('divergence');
				await sleep(T(1200));
			}
		}
		if (p.free.length) await runFree(p);
		if (!alive) return;
		if (p.free.length || p.capped) {
			lastWin = p.win;
			message = `${sl.lastWin}: ${p.win.toLocaleString('en-US')} 🍔${p.capped ? ` · ${s.maxWin(MAX_WIN)}` : ''}`;
		}
		hidden = 0;
		tier = skwTier(p);
		if (tier === 'big' || tier === 'mega' || tier === 'legend') {
			celebrate = true;
			lastWin = p.win;
			sound.play(tier === 'legend' ? 'divergence' : 'maxed');
			setTimeout(() => (celebrate = false), reduce() ? 2200 : 3400);
			squad.casinoNews(t.casino.event.skeddwood(p.win, tier));
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
		// Abscar's control room (casino-rig.ts): a feature he picked for this spin, or your luck
		const forced = squad.takeForced('skeddwood');
		const draw = () => play(bet, rand);
		await run(forced ? drawUntil(draw, (p) => skwMatches(p, forced.what), SKW_TRIES) : lucky(squad.luck('skeddwood'), rand, draw, (p) => p.net));
	}

	/* ---------- buy bonus: asked first ---------- */
	const price = (k: SkwBuy) => BUY_PRICE[k] * bet;
	const buyWhat = (k: SkwBuy) => (k === 'lucky' ? s.buyWhat.lucky : s.buyWhat[k](FREE_START[k]));
	function askBuy(k: SkwBuy) {
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
		await run(lucky(squad.luck('skeddwood'), rand, () => buy(k, bet, rand), (p) => p.net));
	}

	/* ---------- auto spin (the same on every machine: autoSpin.svelte.ts) ---------- */
	const auto = new AutoSpin();
	let alive = true;
	async function runAuto() {
		const end = await auto.run({
			spin,
			ready: () => bet <= shown,
			wait: () => (celebrate ? T(3000) : T(600))
		});
		if (end === 'done' && alive) message = message || t.casino.autoSpin.done;
	}
	$effect(() => () => {
		alive = false;
		tapGo?.();
	});

	function stepBet(dir: 1 | -1) {
		const i = SKW_BETS.indexOf(bet);
		bet = SKW_BETS[Math.max(0, Math.min(SKW_BETS.length - 1, i + dir))];
	}

	/* ---------- labels ---------- */
	function cellText(c: Cell): string {
		let name: string = symName(c.s);
		if (c.split) name = s.splitLabel(name);
		if ((c.x ?? 1) > 1) name = s.shotLabel(name, c.x!);
		return name;
	}
	const reelText = (r: number) => {
		if (badges[r] && (sticky[r] || cols[r].items.slice(CTX, CTX + ROWS[r]).every((c) => c.s === 'cowboy'))) return s.reelLabel(r + 1, s.cowboyLabel(badges[r]));
		return s.reelLabel(r + 1, cols[r].items.slice(CTX, CTX + ROWS[r]).map(cellText).join(', '));
	};
	const fmt = (n: number) => +(n / 100).toFixed(2);
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.4 + (i % 4) * 0.25 }));
	/** where on the sign (in %): clear of the logo's sheriff stars and the line under it at every width */
	const BULLET_HOLES = [
		[3, 12],
		[95, 78],
		[11, 90]
	];
</script>

<SkeddSprite {u} />

{#snippet art(c: Cell, r: number)}
	{#if c.s === 'cowboy'}
		<svg viewBox="0 {(c.p ?? 0) * 64} 64 64" preserveAspectRatio="none" aria-hidden="true"><use href="#{u}-cowboy" width="64" height="256" /></svg>
	{:else if c.s === 'skedd'}
		<svg viewBox="0 {(c.p ?? 0) * 128} 64 128" preserveAspectRatio="none" aria-hidden="true"><use href="#{u}-skedd" width="64" height="256" /></svg>
	{:else if r === SKEDD_REEL}
		<svg viewBox="0 0 64 128" aria-hidden="true"><use href="#{u}-plank" width="64" height="128" /><use href="#{u}-{c.s}" y="30" width="64" height="64" /></svg>
	{:else if c.split}
		<span class="halves" aria-hidden="true">
			<svg viewBox="0 0 64 64"><use href="#{u}-{c.s}" width="64" height="64" /></svg>
			<svg viewBox="0 0 64 64"><use href="#{u}-{c.s}" width="64" height="64" /></svg>
		</span>
	{:else}
		<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#{u}-{c.s}" width="64" height="64" /></svg>
	{/if}
{/snippet}

<div class="skw" class:spinning class:free={!!freeState} data-mode={freeState?.mode}>
	<div class="cabinet">
		<!-- the marquee: the logo on a sunset sign with bullet holes (2026-11-20, SkeddwoodLogo); under it the line,
		     in free spins their counter (the logo stays, so the reels never jump) -->
		<div class="marquee" class:free-on={!!freeState}>
			{#each BULLET_HOLES as [x, y], i (i)}<span class="hole" style:left="{x}%" style:top="{y}%" aria-hidden="true"></span>{/each}
			<div class="logo"><SkeddwoodLogo label={t.casino.games.skeddwood} /></div>
			<div class="lines">
				{#if freeState}
					<p class="title free-title font-head" role="status">{s.free.title(freeState.mode === 'gold', freeState.n, freeState.total)}</p>
					<p class="subtitle font-head">{s.free.sub(freeState.won)}</p>
				{:else}
					<p class="subtitle font-head">{s.sub}</p>
				{/if}
			</div>
		</div>

		<!-- the reels -->
		<div class="window" role="group" aria-label={t.casino.games.skeddwood} data-firing={firing || undefined}>
			<div class="reels">
				{#each cols as col, r (r)}
					<div class="reel" role="img" aria-label={reelText(r)} style:--rows={ROWS[r]} class:locked={freeState?.mode === 'divergence' && r === SKEDD_REEL} class:cow-win={winCells.has(`${r}-*`)}>
						<div class="strip" style:transform={`translateY(calc(var(--h) / ${ROWS[r]} * ${-col.y}))`} style:transition={col.dur ? `transform ${col.dur}ms ${col.ease}` : 'none'}>
							{#each col.items as c, i (i)}
								{@const row = i - col.y}
								<div
									class="cell"
									data-sym={c.s}
									class:win={winCells.has(`${r}-${row}`)}
									class:flip={c.flip}
									class:split={c.split}
								>
									{@render art(c, r)}
									{#if (c.x ?? 1) > 1}<span class="shot" aria-hidden="true"></span><span class="xbadge font-head num" aria-hidden="true">×{c.x}</span>{/if}
								</div>
							{/each}
						</div>
						{#if sticky[r]}
							<!-- a sticky cowboy: on his own layer, the reel spins under him -->
							<div class="sticky-cow" aria-hidden="true">
								<svg viewBox="0 0 64 256" preserveAspectRatio="none"><use href="#{u}-cowboy" width="64" height="256" /></svg>
								<span class="sticky-tag font-head">{s.sticky}</span>
								{#if grows[r]}<span class="grow font-head num">+{grows[r]}</span>{/if}
							</div>
						{/if}
						{#if badges[r]}<span class="cow-badge font-head num" aria-hidden="true">×{badges[r]}</span>{/if}
					</div>
				{/each}
			</div>
			{#if puff}<span class="puff" aria-hidden="true"><i></i><i></i><i></i><i></i></span>{/if}
			{#if pop && !banner}
				{#key pop.id}<p class="pop font-head" data-kind={pop.kind} aria-hidden="true">{pop.text}</p>{/key}
			{/if}
			{#if banner?.kind === 'more' || banner?.kind === 'upgrade'}
				<p class="fs-more font-head" data-kind={banner.kind} role="status">{banner.kind === 'upgrade' ? s.free.upgrade(banner.spins) : s.free.more(banner.spins)}</p>
			{:else if banner}
				<button type="button" class="fs-screen" data-kind={banner.kind} data-mode={banner.kind === 'intro' || banner.kind === 'lucky' ? banner.mode : undefined} onclick={() => tapGo?.()}>
					<span class="rain" aria-hidden="true">
						{#each RAIN as drop, i (i)}<svg style:left="{drop.x}%" style:animation-delay="{drop.d}s" style:animation-duration="{drop.dur}s" viewBox="0 0 64 64"><use href="#{u}-{i % 3 ? 'skull' : 'sixgun'}" width="64" height="64" /></svg>{/each}
					</span>
					{#if banner.kind === 'lucky'}
						<span class="big font-head">{s.free.lucky[banner.mode]}</span>
					{:else if banner.kind === 'intro'}
						<span class="big font-head">{s.free.intro[banner.mode]}</span>
						<span class="fs-sub">{s.free.introSub[banner.mode](banner.spins)}</span>
					{:else}
						<span class="fs-kicker font-head">{s.free.outro}</span>
						<span class="amount font-head num">+{banner.won.toLocaleString('en-US')} 🍔</span>
						<span class="fs-sub">{s.free.outroSub(banner.spins)}</span>
					{/if}
					<span class="fs-tap">{s.continue} ▸</span>
				</button>
			{/if}
			{#if celebrate}
				<div class="celebrate" data-tier={tier} role="status">
					<div class="rain" aria-hidden="true">
						{#each RAIN as drop, i (i)}<svg style:left="{drop.x}%" style:animation-delay="{drop.d}s" style:animation-duration="{drop.dur}s" viewBox="0 0 64 64"><use href="#{u}-{i % 3 ? 'skull' : 'sixgun'}" width="64" height="64" /></svg>{/each}
					</div>
					<p class="big font-head">{s.tiers[tier === 'none' ? 'win' : tier]}</p>
					<p class="amount font-head num">+{lastWin.toLocaleString('en-US')} 🍔</p>
				</div>
			{/if}
		</div>

		<p class="msg" aria-live="polite">{message}</p>

		<!-- the panel: burgers, bet, win, spin -->
		<div class="panel">
			<div class="led"><span>{s.credits}</span><b class="num">{shown.toLocaleString('en-US')}</b></div>
			<div class="led bet">
				<div class="bet-ctl">
					<span class="bet-lbl">{t.casino.bet}</span>
					<button type="button" class="stepper minus" aria-label="−" disabled={spinning || bet === SKW_BETS[0]} onclick={() => stepBet(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={t.casino.betLabel(bet)}>{bet.toLocaleString('en-US')}</b>
					<button type="button" class="stepper plus" aria-label="+" disabled={spinning || bet === SKW_BETS[SKW_BETS.length - 1]} onclick={() => stepBet(1)}>+</button>
				</div>
			</div>
			<div class="led win"><span>{s.lastWin}</span><b class="num">{lastWin.toLocaleString('en-US')}</b></div>
			<button type="button" class="spin font-head" bind:this={spinBtn} disabled={spinning || auto.running} onclick={() => void spin()}>{spinning ? '…' : s.spin}</button>
		</div>

		<!-- auto spin (10 · 25 · 50 · 100 · 1,000) + turbo -->
		<AutoSpinControls {auto} blocked={spinning || bet > shown} onstart={() => void runAuto()}>
			{#snippet extra()}
				<button type="button" class="turbo font-head" aria-pressed={turbo} onclick={() => setTurbo(!turbo)}>⚡ {s.turbo}</button>
			{/snippet}
		</AutoSpinControls>

		<!-- buy bonus -->
		<div class="buy" role="group" aria-label={s.buy}>
			{#if buyAsk}
				<p class="buy-ask" role="status">{sl.buyAsk(buyWhat(buyAsk), price(buyAsk))}</p>
				<div class="flex gap-1.5">
					<button type="button" class="buy-yes font-head" disabled={spinning || price(buyAsk) > shown} onclick={() => void confirmBuy()}>{sl.buyYes}</button>
					<button type="button" class="buy-no font-head" onclick={() => (buyAsk = null)}>{sl.buyNo}</button>
				</div>
			{:else}
				<span class="buy-label font-head">{s.buy}</span>
				<div class="buy-list">
					{#each SKW_BUYS as k (k)}
						<button type="button" class="buy-btn" data-buy={k} disabled={spinning || auto.running || price(k) > shown} onclick={() => askBuy(k)}>
							<svg viewBox="0 0 64 64" aria-hidden="true"><use href="#{u}-{k === 'gold' ? 'skull' : k === 'lucky' ? 'star' : 'sixgun'}" width="64" height="64" /></svg>
							<span class="min-w-0 text-left">
								<b class="block font-head">{s.buyKinds[k]}</b>
								<span class="num">{sl.buyPrice(price(k))}</span>
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Abscar the cowboy, beside the cabinet -->
	<div class="mascot" aria-hidden="true">
		<svg viewBox="-6 -10 76 270"><use href="#{u}-cowboy" width="64" height="256" /></svg>
	</div>
</div>

<details class="paytable mt-3 text-xs text-muted">
	<summary class="min-h-11 cursor-pointer content-center font-semibold">{s.paytable}</summary>
	<p class="pb-2">{s.how}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-1.5 pb-1">
		{#each [...HIGHS].reverse().concat([...LOWS].reverse()) as sym (sym)}
			<li class="pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				<svg class="pay-sym" viewBox="0 0 64 64" aria-hidden="true"><use href="#{u}-{sym}" width="64" height="64" /></svg>
				<span class="min-w-0">
					<b class="block text-fg">{symName(sym)}</b>
					{s.payRow(fmt(PAYS[sym as SkwPay][0]), fmt(PAYS[sym as SkwPay][1]), fmt(PAYS[sym as SkwPay][2]))}
				</span>
			</li>
		{/each}
	</ul>
	<ul class="grid gap-1.5 pt-1 pb-1">
		{#each ['cowboy', 'skedd', 'cylinder', 'star', 'hwild', 'skull', 'grave'] as const as sym (sym)}
			<li class="pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				{#if sym === 'cowboy' || sym === 'skedd'}
					<svg class="pay-sym tall" viewBox="0 0 64 256" aria-hidden="true"><use href="#{u}-{sym}" width="64" height="256" /></svg>
				{:else}
					<svg class="pay-sym" viewBox="0 0 64 64" aria-hidden="true"><use href="#{u}-{sym}" width="64" height="64" /></svg>
				{/if}
				<span class="min-w-0">
					<b class="block text-fg">{symName(sym)}</b>
					{s.features[sym]}
				</span>
			</li>
		{/each}
	</ul>
	<p class="pb-1">{s.freeNote}</p>
	<p class="pb-1">{s.buyNote(BUY_PRICE.gold, BUY_PRICE.lucky, BUY_PRICE.divergence)}</p>
	<p class="pb-1">{s.rtpNote}</p>
	<p class="pb-1">{s.maxNote(MAX_WIN)}</p>
	<p class="pb-1">{s.fun}</p>
</details>

<style>
	/* the reels fill what's left beside the cowboy: 5 cells + the window's and cabinet's edges (≈ 62 px) */
	.skw {
		--side: 92px;
		--cell: clamp(36px, calc((100cqi - var(--side) - 62px) / 5), 96px);
		--h: calc(var(--cell) * 4);
		container-type: inline-size;
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--side);
		align-items: end;
		gap: 4px;
		max-width: 700px;
	}
	@media (max-width: 519px) {
		.skw {
			--side: 52px;
		}
	}
	@supports not (width: 1cqi) {
		.skw {
			--cell: 44px;
		}
	}
	.cabinet {
		position: relative;
		padding: 10px 10px 12px;
		border: 4px solid #c98a3a;
		border-radius: 18px 18px 12px 12px;
		background:
			repeating-linear-gradient(90deg, rgb(0 0 0 / 0.12) 0 2px, transparent 2px 23px),
			linear-gradient(180deg, #5a3218, #3a1e0c 60%, #24120a);
		box-shadow:
			0 0 0 3px #1a0c04,
			0 0 26px rgb(255 120 40 / 0.35),
			inset 0 2px 0 rgb(255 230 180 / 0.25);
	}
	/* the marquee: a sunset sign */
	.marquee {
		position: relative;
		margin-bottom: 10px;
		padding: 12px 8px 8px;
		border-radius: 12px;
		background:
			radial-gradient(120% 90% at 50% 120%, #ffb347 0%, #ff6a2a 35%, #b3141b 62%, #3a0a14 100%);
		box-shadow:
			inset 0 0 0 2px #e8b84a,
			inset 0 -10px 18px rgb(0 0 0 / 0.35);
		text-align: center;
		overflow: hidden;
	}
	.marquee .hole {
		position: absolute;
		width: 9px;
		height: 9px;
		border-radius: 999px;
		background: radial-gradient(circle, #120602 40%, #5a2a0c 55%, transparent 72%);
		box-shadow: 0 0 0 1px rgb(255 220 160 / 0.35);
	}
	.logo {
		position: relative;
		max-width: 440px;
		margin: -6px auto 0;
	}
	/* under it: always room for the free-spins counter + its line, so the reels never move */
	.lines {
		position: relative;
		display: grid;
		align-content: center;
		min-height: 42px;
	}
	.title {
		position: relative;
		font-family: Rockwell, 'Rockwell Extra Bold', Bahnschrift, 'Arial Black', serif;
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fffbe0 0%, #ffd23a 45%, #c97a00 55%, #ffe27a 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		-webkit-text-stroke: 1.2px #3a1404;
		filter: drop-shadow(0 3px 0 #2a0a04) drop-shadow(0 0 10px rgb(255 160 40 / 0.55));
	}
	.subtitle {
		position: relative;
		margin-top: 4px;
		color: #ffe9c0;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.7);
	}
	.marquee.free-on {
		background: radial-gradient(120% 90% at 50% 120%, #fff1a0 0%, #ffc928 35%, #b86e00 70%, #3a2204 100%);
	}
	.skw[data-mode='divergence'] .marquee.free-on {
		background: linear-gradient(110deg, #4affc0, #4a8aff, #c84aff, #ff5ca8, #ffd23a);
		background-size: 300% 100%;
		animation: div-flow 6s linear infinite;
	}
	@keyframes div-flow {
		to {
			background-position: 300% 0;
		}
	}
	.free-title {
		font-size: clamp(15px, 4.4cqi, 21px);
	}
	.skw.free .cabinet {
		border-color: #ffd23a;
		box-shadow:
			0 0 0 3px #1a0c04,
			0 0 30px rgb(255 210 58 / 0.55),
			inset 0 2px 0 rgb(255 230 180 / 0.25);
	}
	.skw[data-mode='divergence'] .cabinet {
		border-color: #c84aff;
		box-shadow:
			0 0 0 3px #1a0c04,
			0 0 30px rgb(200 74 255 / 0.6),
			inset 0 2px 0 rgb(255 230 180 / 0.25);
	}
	/* the reel window */
	.window {
		position: relative;
		padding: 6px;
		border-radius: 10px;
		background: #140803;
		box-shadow:
			inset 0 0 0 3px #c98a3a,
			inset 0 10px 18px rgb(0 0 0 / 0.8);
	}
	.reels {
		display: grid;
		grid-template-columns: repeat(5, var(--cell));
		justify-content: center;
		gap: 4px;
	}
	.reel {
		position: relative;
		height: var(--h);
		overflow: hidden;
		border-radius: 7px;
		background:
			linear-gradient(180deg, rgb(0 0 0 / 0.45), transparent 14%, transparent 86%, rgb(0 0 0 / 0.45)),
			linear-gradient(90deg, #2e1a0c, #4a2c16 50%, #2e1a0c);
	}
	.reel.locked {
		box-shadow:
			0 0 0 2px #c84aff,
			0 0 14px rgb(200 74 255 / 0.7);
	}
	.strip {
		will-change: transform;
	}
	.cell {
		position: relative;
		display: grid;
		place-items: center;
		width: var(--cell);
		height: calc(var(--h) / var(--rows));
		padding: 2px;
	}
	.cell > svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.cell > .halves {
		width: 100%;
		height: 100%;
	}
	.cell[data-sym='cowboy'],
	.cell[data-sym='skedd'] {
		padding: 0;
	}
	.halves {
		display: grid;
		grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1px;
		min-height: 0;
		overflow: hidden;
		animation: split-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.halves svg {
		width: 100%;
		height: 100%;
		min-height: 0;
		display: block;
	}
	.cell {
		min-height: 0;
		overflow: hidden;
	}
	.cell.split {
		box-shadow: inset 0 0 0 1.5px rgb(200 74 255 / 0.8);
		border-radius: 6px;
	}
	@keyframes split-in {
		from {
			transform: scaleY(0.6);
			filter: blur(2px);
		}
	}
	.cell.flip > svg {
		animation: flip-in 0.5s ease-out both;
	}
	@keyframes flip-in {
		from {
			transform: rotateY(90deg) scale(1.2);
		}
	}
	.cell.win {
		background: radial-gradient(circle, rgb(255 210 58 / 0.7), rgb(255 140 0 / 0.25) 60%, transparent 74%);
		animation: win-pop 0.8s ease-in-out infinite alternate;
	}
	@keyframes win-pop {
		to {
			transform: scale(1.06);
		}
	}
	.reel.cow-win {
		box-shadow:
			inset 0 0 0 3px #ffd23a,
			0 0 14px rgb(255 210 58 / 0.8);
	}
	/* Quick Draw: a bullet hole and the cell's ×value */
	.shot {
		position: absolute;
		left: 58%;
		top: 18%;
		width: 22%;
		aspect-ratio: 1;
		border-radius: 999px;
		background: radial-gradient(circle, #050201 34%, #3a2a1a 48%, rgb(255 230 180 / 0.6) 58%, transparent 70%);
		animation: shot-in 0.25s ease-out both;
		pointer-events: none;
	}
	@keyframes shot-in {
		from {
			transform: scale(2.4);
			opacity: 0;
		}
	}
	.xbadge {
		position: absolute;
		left: 50%;
		bottom: 2px;
		transform: translateX(-50%);
		padding: 0 5px;
		border-radius: 6px;
		background: #ff4418;
		color: #fff;
		font-size: clamp(9px, calc(var(--cell) * 0.2), 15px);
		font-weight: 900;
		line-height: 1.3;
		box-shadow:
			0 0 0 1.5px #fff6b0,
			0 0 8px rgb(255 68 24 / 0.8);
	}
	.window[data-firing] .cell[data-sym='cylinder']::after {
		content: '';
		position: absolute;
		right: -18%;
		top: 30%;
		width: 50%;
		height: 40%;
		border-radius: 999px;
		background: radial-gradient(circle, #fffbe0, #ffd23a 40%, rgb(255 90 0 / 0.7) 60%, transparent 72%);
	}
	/* the cowboy's multiplier, at the foot of his reel */
	.cow-badge {
		position: absolute;
		left: 50%;
		bottom: 4px;
		z-index: 2;
		transform: translateX(-50%);
		padding: 1px 8px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ff6a3a, #b3141b);
		color: #fff6b0;
		font-size: clamp(13px, calc(var(--cell) * 0.3), 22px);
		font-weight: 900;
		line-height: 1.15;
		text-shadow: 0 2px 0 #5a0508;
		box-shadow:
			0 0 0 2px #ffd23a,
			0 0 12px rgb(255 120 40 / 0.85);
		animation: badge-pop 0.35s cubic-bezier(0.2, 1.8, 0.4, 1);
	}
	@keyframes badge-pop {
		from {
			transform: translateX(-50%) scale(1.6);
		}
	}
	/* free spins: a sticky cowboy on his layer */
	.sticky-cow {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, #2e1a0c, #4a2c16 50%, #2e1a0c);
		box-shadow:
			inset 0 0 0 3px #ffd23a,
			0 0 12px rgb(255 210 58 / 0.7);
		border-radius: 7px;
		animation: stick-in 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) both;
	}
	.skw[data-mode='divergence'] .sticky-cow {
		box-shadow:
			inset 0 0 0 3px #c84aff,
			0 0 14px rgb(200 74 255 / 0.75);
	}
	.sticky-cow svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	@keyframes stick-in {
		from {
			opacity: 0.3;
			transform: scale(1.12);
		}
	}
	.sticky-tag {
		position: absolute;
		top: 3px;
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
	.grow {
		position: absolute;
		top: 34%;
		left: 50%;
		transform: translateX(-50%);
		color: #7dff6a;
		font-size: clamp(18px, calc(var(--cell) * 0.45), 34px);
		font-weight: 900;
		text-shadow: 0 2px 0 #0b4a1c, 0 0 10px rgb(125 255 106 / 0.8);
		animation: grow-up 1.4s ease-out both;
	}
	@keyframes grow-up {
		to {
			transform: translate(-50%, -40px);
			opacity: 0;
		}
	}
	/* the Skedd's puff drifting left over the middle rows */
	.puff {
		position: absolute;
		inset: 22% 6px 22% 6px;
		z-index: 2;
		pointer-events: none;
		animation: puff-drift 1.4s ease-out both;
	}
	.puff i {
		position: absolute;
		width: 40%;
		aspect-ratio: 1;
		border-radius: 999px;
		background: radial-gradient(circle, rgb(240 236 255 / 0.9), rgb(200 170 255 / 0.5) 45%, transparent 70%);
		filter: blur(4px);
	}
	.puff i:nth-child(1) {
		left: 60%;
		top: 10%;
	}
	.puff i:nth-child(2) {
		left: 38%;
		top: 30%;
	}
	.puff i:nth-child(3) {
		left: 16%;
		top: 5%;
	}
	.puff i:nth-child(4) {
		left: -4%;
		top: 28%;
	}
	@keyframes puff-drift {
		from {
			transform: translateX(45%) scale(0.6);
			opacity: 0;
		}
		30% {
			opacity: 1;
		}
		to {
			transform: translateX(-10%) scale(1.1);
			opacity: 0;
		}
	}
	/* words over the reels */
	.pop {
		position: absolute;
		left: 50%;
		top: 40%;
		z-index: 3;
		margin: 0;
		max-width: 94%;
		transform: translate(-50%, -50%);
		padding: 4px 18px;
		border: 3px solid #fff6b0;
		border-radius: 14px;
		background: linear-gradient(180deg, #ffd23a, #ff8a1a 55%, #b3141b);
		color: #fff;
		font-size: clamp(20px, 7cqi, 40px);
		font-weight: 900;
		line-height: 1.1;
		text-align: center;
		white-space: nowrap;
		text-shadow:
			0 3px 0 #7a1010,
			0 0 12px rgb(0 0 0 / 0.5);
		box-shadow: 0 0 28px rgb(255 210 58 / 0.9);
		pointer-events: none;
		animation: pop-in 1.5s ease-out both;
	}
	.pop[data-kind='skedd'],
	.pop[data-kind='divergence'] {
		background: linear-gradient(110deg, #4affc0, #4a8aff, #c84aff, #ff5ca8);
		box-shadow: 0 0 28px rgb(200 74 255 / 0.9);
	}
	.pop[data-kind='noon'] {
		background: linear-gradient(180deg, #fff1a0, #ffc928 55%, #b86e00);
		color: #3a1404;
		text-shadow: 0 2px 0 #fff6d0;
	}
	@keyframes pop-in {
		0% {
			transform: translate(-50%, -50%) scale(2.2);
			opacity: 0;
		}
		16% {
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
	.fs-more {
		position: absolute;
		left: 50%;
		top: 50%;
		z-index: 3;
		transform: translate(-50%, -50%);
		padding: 8px 16px;
		border: 3px solid #ffd23a;
		border-radius: 12px;
		background: rgb(122 60 10 / 0.95);
		color: #fff6b0;
		font-size: clamp(14px, 4.6cqi, 24px);
		font-weight: 900;
		letter-spacing: 0.06em;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 0 20px rgb(255 210 58 / 0.7);
		animation: big-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.fs-more[data-kind='upgrade'] {
		border-color: #fff;
		background: linear-gradient(110deg, #3a8aff, #8a3fd0, #d82a8a);
	}
	.fs-screen {
		position: absolute;
		inset: 0;
		z-index: 4;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-content: center;
		justify-items: center;
		gap: 4px;
		width: 100%;
		padding: 10px;
		border-radius: 10px;
		background: radial-gradient(circle, rgb(120 70 10 / 0.88), rgb(20 8 0 / 0.95));
		color: #fff6b0;
		overflow: hidden;
		text-align: center;
	}
	.fs-screen[data-mode='divergence'] {
		background: radial-gradient(circle, rgb(90 30 140 / 0.9), rgb(10 0 24 / 0.95));
	}
	.fs-screen .big {
		position: relative;
		max-width: 100%;
		font-size: clamp(22px, 6.2cqi, 42px);
		color: #ffd23a;
		text-shadow: 0 3px 0 #7a3a00, 0 0 18px rgb(255 210 58 / 0.9);
	}
	.fs-screen[data-mode='divergence'] .big {
		color: #fff;
		text-shadow: 0 3px 0 #4a1a86, 0 0 18px #c84aff, 0 0 30px #4affc0;
	}
	.fs-sub {
		position: relative;
		max-width: 36em;
		font-size: 12px;
		font-weight: 700;
		line-height: 1.3;
	}
	.fs-kicker {
		position: relative;
		color: #ffd9a0;
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
	.celebrate {
		position: absolute;
		inset: 0;
		z-index: 3;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-content: center;
		justify-items: center;
		border-radius: 10px;
		background: radial-gradient(circle, rgb(60 20 0 / 0.55), rgb(0 0 0 / 0.75));
		overflow: hidden;
		pointer-events: none;
	}
	.big {
		font-size: clamp(24px, 8.4cqi, 50px);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: 0.05em;
		text-align: center;
		color: #ffd23a;
		-webkit-text-stroke: 1.5px #5a2a00;
		text-shadow: 0 3px 0 #b3141b, 0 0 18px rgb(255 200 40 / 0.8);
		animation: big-in 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	.celebrate[data-tier='legend'] .big {
		color: #fff;
		text-shadow: 0 3px 0 #4a1a86, 0 0 22px #c84aff, 0 0 34px #ffd23a;
	}
	.amount {
		position: relative;
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
	.rain svg {
		position: absolute;
		top: -36px;
		width: 28px;
		height: 28px;
		animation: rain 1.6s linear infinite;
	}
	@keyframes rain {
		to {
			transform: translateY(calc(var(--h) + 80px)) rotate(200deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.halves,
		.cell.flip > svg,
		.cell.win,
		.cow-badge,
		.sticky-cow,
		.grow,
		.puff,
		.pop,
		.fs-more,
		.big,
		.rain svg,
		.shot,
		.skw[data-mode='divergence'] .marquee.free-on {
			animation: none;
		}
		.rain {
			display: none;
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
	/* the panel (as on Abscar's Fortune) */
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
	.led.win {
		grid-area: win;
	}
	.spin {
		grid-area: spin;
	}
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
		background: #0c0502;
		box-shadow: inset 0 0 0 2px #5a3218;
	}
	.led span {
		color: #ffc98a;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.led b {
		color: #ff7a2b;
		font-family: ui-monospace, Consolas, monospace;
		font-size: 17px;
		font-weight: 800;
		text-shadow: 0 0 8px rgb(255 120 30 / 0.8);
	}
	.led.win b {
		color: #7dff6a;
		text-shadow: 0 0 8px rgb(100 255 90 / 0.7);
	}
	.stepper {
		position: relative;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: #3a1e0c;
		color: #ffd23a;
		font-weight: 900;
		box-shadow: inset 0 0 0 1.5px #e8b84a;
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
		background: radial-gradient(circle at 40% 30%, #ffb84a, #e07a1a 50%, #8a3a06);
		color: #fff;
		font-size: 17px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 2px 0 #5a2504;
		box-shadow:
			0 4px 0 #5a2504,
			0 0 14px rgb(255 150 40 / 0.6);
	}
	.spin:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: 0 1px 0 #5a2504;
	}
	.spin:disabled {
		filter: grayscale(0.5) brightness(0.8);
	}
	/* the auto spin controls (AutoSpinControls) in this cabinet's colours */
	.skw {
		--auto-accent: #e8b84a;
		--auto-bg: #3a1e0c;
		--auto-ink: #ffd23a;
		--auto-on-ink: #3a1404;
		--auto-chip-bg: #0c0502;
		--auto-chip-ink: #ffc98a;
		--auto-line: #5a3218;
	}
	.turbo {
		min-height: 44px;
		padding: 0 12px;
		border: 2px solid #e8b84a;
		border-radius: 999px;
		background: #3a1e0c;
		color: #ffd23a;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.turbo[aria-pressed='true'] {
		background: #ffc928;
		color: #3a1404;
		box-shadow: 0 0 12px rgb(255 201 40 / 0.7);
	}
	.buy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed rgb(232 184 74 / 0.4);
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
		background: #0c0502;
		box-shadow: inset 0 0 0 2px #5a3218;
		color: #ffc98a;
		font-size: 11px;
		line-height: 1.15;
	}
	.buy-btn svg {
		flex: none;
		width: 30px;
		height: 30px;
	}
	.buy-btn b {
		color: #ffd23a;
		font-size: 11.5px;
		overflow-wrap: anywhere;
	}
	.buy-btn:not(:disabled):hover {
		box-shadow: inset 0 0 0 2px #e8b84a;
	}
	.buy-btn:disabled {
		opacity: 0.45;
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
		background: #e07a1a;
		color: #fff;
	}
	.buy-yes:disabled {
		opacity: 0.5;
	}
	.buy-no {
		border: 2px solid #e8b84a;
		background: #3a1e0c;
		color: #ffd23a;
	}
	@container (max-width: 420px) {
		.buy-btn svg {
			display: none;
		}
	}
	/* Abscar the cowboy beside the cabinet */
	.mascot {
		align-self: end;
		display: flex;
		justify-content: center;
	}
	.mascot svg {
		width: 100%;
		height: auto;
		max-height: calc(var(--h) + 180px);
		overflow: visible;
		filter: drop-shadow(0 6px 8px rgb(0 0 0 / 0.5));
	}
	.skw.spinning .mascot svg {
		animation: mascot-bob 0.9s ease-in-out infinite alternate;
	}
	@keyframes mascot-bob {
		to {
			transform: translateY(-4px) rotate(-1deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skw.spinning .mascot svg {
			animation: none;
		}
	}
	.pay-row {
		background: rgb(0 0 0 / 0.18);
	}
	.pay-sym {
		flex: none;
		width: 38px;
		height: 38px;
	}
	.pay-sym.tall {
		width: 22px;
		height: 88px;
	}
</style>
