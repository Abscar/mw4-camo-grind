<!--
	Abscar's Fortune II, the Munchie Squad (fortune2.ts; 2026-11-19, the user's ask: "build a new Abscar's
	Fortune but like Pirots 5, with our own symbols; come up with crazy bonuses and free spins like the
	Pirots games"). A neon hotbox cabinet: the 8 × 8 board with its walls, four of the squad walking about
	taking their own munchies (Phillestar burgers, Drängen beer, Da Jeeven energy drinks, Ingman purple buds),
	frags that blow walls open, smoke swaps, Abscar dropping features when his holk meter fills, Hotbox Spins
	with a multiplier that grows, Super Hotbox and The Munchies coin game.
	The whole play is worked out and booked at once (squad.recordGame), then played back event by event
	(fortune2.ts applyEvent keeps the truth; this file only animates it). `hidden` = burgers won but not
	shown yet. Turbo and Skip make it quicker; reduced motion plays it back without movement.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import {
		applyEvent,
		burgersOf,
		buy,
		colOf,
		fieldSize,
		isOpen,
		play,
		rowOf,
		startView,
		winTier,
		BUY_KINDS,
		BUY_PRICE,
		CREW,
		F2_BETS,
		FREE_SPINS,
		LETTERS,
		LEVEL_PAYS,
		MAX_WIN,
		METER_MAX,
		MUNCH_CORNERS,
		MUNCH_SIDE,
		SIDE,
		type Crew,
		type Ev,
		type F2Buy,
		type F2Play,
		type F2Spin,
		type MunchCoin,
		type Munchies,
		type Piece,
		type WinTier
	} from '#lib/fortune2.ts';
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Fortune2Piece, { CREW_COLOUR, short } from './Fortune2Piece.svelte';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import IngmanEmblem from './IngmanEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	$effect(() => {
		pending = hidden;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const s = t.casino.fortune2;
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

	/* ---------- speed: turbo (remembered per device), skip (this play), reduced motion ---------- */
	const TURBO_KEY = 'mw4-camo-grind:f2-turbo';
	let turbo = $state(false);
	$effect(() => {
		try {
			turbo = localStorage.getItem(TURBO_KEY) === '1';
		} catch {
			// storage blocked: normal speed
		}
	});
	function toggleTurbo() {
		turbo = !turbo;
		try {
			localStorage.setItem(TURBO_KEY, turbo ? '1' : '0');
		} catch {
			// this visit only
		}
	}
	let skip = $state(false);
	/** how long things take: 0 = at once (skip); reduced motion = nothing moves but it still goes step by step, quicker */
	const k = () => (skip ? 0 : reduce() ? 0.3 : turbo ? 0.45 : 1);
	const still = () => skip || reduce();
	const MS = { step: 230, fall: 340, fill: 520, place: 380, boom: 600, level: 560, swap: 640, grow: 700, drop: 850, mult: 850 };
	const ms = (n: number) => Math.round(n * k());
	const wait = (n: number) => (k() ? sleep(ms(n)) : Promise.resolve());

	/* ---------- what the board shows ---------- */
	interface RP {
		/** a key unique across plays (ids start over every play) */
		k: string;
		p: Piece;
		r: number;
		c: number;
		fx: '' | 'taken' | 'boom' | 'pop' | 'swap';
		/** no movement this frame (placed above the board before falling in) */
		snap: boolean;
	}
	let gen = 0;
	let pieces = $state<RP[]>([]);
	let crewAt = $state<Record<Crew, number>>({ phil: 9, lars: 14, jeeven: 49, ingman: 54 });
	let levels = $state<Record<Crew, number>>({ phil: 1, lars: 1, jeeven: 1, ingman: 1 });
	let letters = $state<boolean[]>(LETTERS.map(() => false));
	let meter = $state(0);
	let mult = $state(1);
	let open = $state(0);
	let flash = $state<Crew | null>(null);
	let letterFlash = $state(-1);
	let pops = $state<{ id: number; cell: number; text: string; kind: string }[]>([]);
	let booms = $state<{ id: number; cell: number }[]>([]);
	let popId = 0;
	const ketchups = $derived(pieces.filter((x) => x.p.kind === 'ketchup' && x.fx === '').length);
	const find = (id: number) => pieces.find((x) => x.k === `${gen}-${id}`);

	function pop(cell: number, text: string, kind = 'pay', life = 1000) {
		const id = ++popId;
		pops.push({ id, cell, text, kind });
		setTimeout(() => (pops = pops.filter((x) => x.id !== id)), Math.max(400, ms(life)) + 200);
	}

	/** New pieces: above the board, then falling into their cells (or popping in where they are). */
	async function enter(add: [Piece, number][], how: 'fall' | 'pop' = 'fall') {
		if (!add.length) return;
		const instant = still();
		for (const [p, cell] of add) pieces.push({ k: `${gen}-${p.id}`, p: { ...p }, r: instant || how === 'pop' ? rowOf(cell) : rowOf(cell) - SIDE, c: colOf(cell), fx: how === 'pop' && !instant ? 'pop' : '', snap: true });
		if (instant || how === 'pop') return;
		await tick();
		await frame();
		for (const [p, cell] of add) {
			const rp = find(p.id);
			if (rp) {
				rp.snap = false;
				rp.r = rowOf(cell);
			}
		}
	}
	const clearFx = (fx: RP['fx']) => (pieces = pieces.filter((x) => x.fx !== fx));

	/* ---------- the play in progress ---------- */
	let bet = $state(F2_BETS[0]);
	const shown = $derived(Math.max(0, balance - hidden));
	let busy = $state(false);
	let cur: F2Play | null = null;
	let shownCents = 0;
	let lastWin = $state(0);
	let message = $state('');
	let tier = $state<WinTier>('none');
	let celebrate = $state(false);
	/** free spins running: which one, of how many, burgers won in them so far */
	let freeState = $state<{ n: number; total: number; won: number } | null>(null);
	let banner = $state<{ kind: 'intro'; bonus: 'hotbox' | 'super'; spins: number } | { kind: 'more'; spins: number } | { kind: 'outro'; spins: number; won: number } | null>(null);
	let munch = $state<{ coins: (MunchCoin | null)[]; left: number; cash: number; mults: number; lit: number[]; done: boolean; m: Munchies } | null>(null);
	let spinBtn = $state<HTMLButtonElement>();
	let overlayEl = $state<HTMLElement>();
	let alive = true;

	function addCents(n: number) {
		if (!cur || !n) return;
		shownCents += n;
		lastWin = Math.min(cur.win, Math.round(burgersOf(shownCents, bet)));
		hidden = Math.max(0, cur.win - lastWin);
	}

	async function show(ev: Ev) {
		switch (ev.t) {
			case 'place':
				crewAt = { ...ev.crew };
				await wait(MS.place);
				break;
			case 'fill': {
				// the last spin's pieces fall away, the new ones fall in
				const old = pieces.length;
				if (old && !still()) {
					for (const x of pieces) {
						x.snap = false;
						x.r += SIDE + 1;
					}
					await wait(MS.fall * 0.7);
				}
				pieces = [];
				await enter(ev.add);
				await wait(MS.fill);
				break;
			}
			case 'walk': {
				crewAt[ev.who] = ev.to;
				const rp = find(ev.took.id);
				if (rp) rp.fx = 'taken';
				if (ev.pay) {
					addCents(ev.pay);
					pop(ev.to, `+${short(burgersOf(ev.pay, bet))}`, ev.took.kind === 'coin' ? 'coin' : 'pay');
				}
				if (ev.took.kind !== 'item' && ev.took.kind !== 'wild' && ev.took.kind !== 'letter') sound.play('camo');
				await wait(MS.step);
				clearFx('taken');
				break;
			}
			case 'level':
				levels[ev.who] = ev.level;
				flash = ev.who;
				pop(crewAt[ev.who], s.pops.level(ev.level), 'level');
				await wait(MS.level);
				flash = null;
				break;
			case 'swap':
				for (const id of ev.ids) {
					const rp = find(id);
					if (rp) {
						rp.p = { ...rp.p, crew: ev.who };
						rp.fx = 'swap';
					}
				}
				pop(-1, s.pops.swap, 'big');
				await wait(MS.swap);
				for (const x of pieces) if (x.fx === 'swap') x.fx = '';
				break;
			case 'boom': {
				const id = ++popId;
				booms.push({ id, cell: ev.at });
				setTimeout(() => (booms = booms.filter((b) => b.id !== id)), Math.max(300, ms(MS.boom)) + 100);
				let sum = 0;
				for (const { piece, pay } of ev.took) {
					const rp = find(piece.id);
					if (rp) rp.fx = 'boom';
					sum += pay;
				}
				if (sum) {
					addCents(sum);
					pop(ev.at, `+${short(burgersOf(sum, bet))}`, 'boom');
				}
				sound.play('maxed');
				await wait(MS.boom);
				clearFx('boom');
				break;
			}
			case 'grow':
				open = ev.open;
				pop(-1, s.pops.grow(fieldSize(ev.open)), 'big');
				await wait(MS.grow);
				break;
			case 'letter':
				letters[ev.i] = true;
				letterFlash = ev.i;
				setTimeout(() => letterFlash === ev.i && (letterFlash = -1), 900);
				await wait(160);
				break;
			case 'meter':
				meter = ev.n;
				break;
			case 'mult':
				mult = ev.mult;
				pop(-1, s.pops.mult(ev.mult), 'mult', 1300);
				sound.play('maxed');
				await wait(MS.mult);
				break;
			case 'drop': {
				pop(-1, s.pops.drop, 'abscar', 1300);
				pieces = pieces.filter((x) => !ev.gone.some((id) => x.k === `${gen}-${id}`));
				await enter(ev.add, 'pop');
				sound.play('maxed');
				await wait(MS.drop);
				for (const x of pieces) if (x.fx === 'pop') x.fx = '';
				break;
			}
			case 'fall': {
				for (const [id, cell] of ev.moves) {
					const rp = find(id);
					if (rp) {
						rp.snap = false;
						rp.r = rowOf(cell);
						rp.c = colOf(cell);
					}
				}
				await enter(ev.add);
				await wait(MS.fall);
				break;
			}
		}
	}

	/** One spin played back; the truth is kept by applyEvent, the animation follows. */
	async function playSpin(sp: F2Spin) {
		const truth = startView(sp);
		open = sp.start.open;
		levels = { ...sp.start.levels };
		letters = [...sp.start.letters];
		meter = sp.start.meter;
		mult = sp.start.mult;
		crewAt = { ...sp.start.crew };
		for (const ev of sp.events) {
			if (!alive) return;
			applyEvent(truth, ev);
			await show(ev);
		}
		if (!alive) return;
		// whatever the animation did, the board ends exactly as worked out
		const want = truth.grid.flatMap((p, cell) => (p ? [{ p, cell }] : []));
		if (want.length !== pieces.length || want.some(({ p, cell }) => find(p.id)?.r !== rowOf(cell) || find(p.id)?.c !== colOf(cell))) {
			pieces = want.map(({ p, cell }) => ({ k: `${gen}-${p.id}`, p: { ...p }, r: rowOf(cell), c: colOf(cell), fx: '', snap: true }));
		}
		crewAt = { ...truth.crew };
		levels = { ...truth.levels };
		open = truth.open;
		const n = Math.round(burgersOf(sp.pay, bet));
		message = n ? s.spinWon(n.toLocaleString('en-US'), sp.ketchups) : sp.pay ? s.crumbs : s.noWin;
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

	/* ---------- The Munchies ---------- */
	const mRow = (i: number) => Math.floor(i / MUNCH_SIDE);
	const mCol = (i: number) => i % MUNCH_SIDE;
	async function runMunchies(m: Munchies) {
		pop(-1, s.pops.munchies, 'abscar', 1200);
		sound.play('maxed');
		await wait(1000);
		munch = { coins: Array(MUNCH_SIDE * MUNCH_SIDE).fill(null), left: 3, cash: 0, mults: 0, lit: [], done: false, m };
		for (const [ri, round] of m.rounds.entries()) {
			if (!alive || !munch) return;
			for (const [cell, coin] of round.add) {
				munch.coins[cell] = coin;
				if (coin.kind === 'mult') munch.mults += coin.value;
				else munch.cash += coin.value;
				munch.lit = coin.kind === 'squad' ? munch.coins.flatMap((c, i) => (c && c.kind !== 'mult' && i !== cell && (mRow(i) === mRow(cell) || mCol(i) === mCol(cell)) ? [i] : [])) : [];
				if (coin.kind !== 'cash') sound.play('camo');
				await wait(ri === 0 ? 140 : coin.kind === 'squad' ? 900 : 340);
			}
			munch.lit = [];
			munch.left = round.left;
			await wait(round.add.length ? 520 : 620);
		}
		if (!alive || !munch) return;
		munch.done = true;
		addCents(m.pay);
		message = `${s.munch.won}: +${short(burgersOf(m.pay, bet))} 🍔`;
		sound.play(m.full ? 'divergence' : 'maxed');
		void focusOverlay();
		await waitTap(autoLeft > 0 ? 1900 : 5200);
		focusBack();
		munch = null;
	}

	/* ---------- free spins ---------- */
	async function runFree(p: F2Play) {
		let total = Math.min(FREE_SPINS, p.free.length);
		let won = 0;
		await wait(600);
		banner = { kind: 'intro', bonus: p.bonus ?? 'hotbox', spins: total };
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
			if (fs.munchies) {
				await runMunchies(fs.munchies);
				won += fs.munchies.pay;
			}
			freeState = { n: i + 1, total, won: Math.round(burgersOf(won, bet)) };
			if (fs.more) {
				total += fs.more;
				freeState = { n: i + 1, total, won: freeState.won };
				banner = { kind: 'more', spins: fs.more };
				sound.play('maxed');
				await wait(1500);
				banner = null;
			}
			await wait(550);
		}
		freeState = null;
		banner = { kind: 'outro', spins: p.free.length, won: Math.min(p.win, Math.round(burgersOf(won, bet))) };
		void focusOverlay();
		await waitTap(autoLeft > 0 ? 1800 : 3800);
		focusBack();
		banner = null;
	}

	/** Book a paid spin or a bought feature at once, then show it all. */
	async function run(p: F2Play) {
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
		if (p.base) {
			await playSpin(p.base);
			if (p.base.munchies) await runMunchies(p.base.munchies);
		}
		if (p.munchies) await runMunchies(p.munchies);
		if (p.free.length) await runFree(p);
		if (!alive) return;
		lastWin = p.win;
		hidden = 0;
		if (p.bonus || p.munchies || p.base?.munchies || p.capped) message = `${s.won(p.win)}${p.capped ? ` · ${s.maxWin(MAX_WIN)}` : ''}`;
		tier = winTier(p);
		if (tier === 'big' || tier === 'mega' || tier === 'epic') {
			celebrate = true;
			sound.play(tier === 'epic' ? 'divergence' : 'maxed');
			setTimeout(() => (celebrate = false), reduce() ? 2200 : 3400);
			squad.casinoNews(t.casino.event.fortune2(p.win, tier));
		}
		busy = false;
		skip = false;
		cur = null;
	}

	async function spin() {
		if (busy) return;
		if (bet > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		buyAsk = null;
		await run(play(bet, rand));
	}

	/* ---------- buy bonus: asked first ---------- */
	let buyAsk = $state<F2Buy | null>(null);
	const price = (kind: F2Buy) => BUY_PRICE[kind] * bet;
	const buyWhat = (kind: F2Buy) => (kind === 'munchies' ? s.buyWhat.munchies : s.buyWhat[kind](FREE_SPINS));
	function askBuy(kind: F2Buy) {
		if (price(kind) > shown) {
			toast.show(t.casino.broke, undefined, 6000);
			return;
		}
		buyAsk = kind;
	}
	async function confirmBuy() {
		const kind = buyAsk;
		buyAsk = null;
		if (!kind || busy || price(kind) > shown) return;
		message = s.buyKinds[kind];
		await run(buy(kind, bet, rand));
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
			if (bet > shown) {
				stopAuto(t.casino.broke);
				break;
			}
			await spin();
			if (!alive || autoLeft === 0) break;
			autoLeft -= 1;
			await sleep(celebrate ? (reduce() ? 1800 : 3000) : reduce() ? 250 : 500);
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
		const i = F2_BETS.indexOf(bet);
		bet = F2_BETS[Math.max(0, Math.min(F2_BETS.length - 1, i + dir))];
	}

	/* ---------- the board at rest before the first spin: a fixed demo board ---------- */
	{
		let x = 0x5eed1234;
		const seeded = () => {
			x ^= x << 13;
			x ^= x >>> 17;
			x ^= x << 5;
			return (x >>> 0) / 0x1_0000_0000;
		};
		const demo = play(10, seeded).base!;
		const fill = demo.events.find((e) => e.t === 'fill');
		crewAt = { ...demo.start.crew };
		if (fill?.t === 'fill') pieces = fill.add.map(([p, cell]) => ({ k: `0-${p.id}`, p: { ...p }, r: rowOf(cell), c: colOf(cell), fx: '', snap: true }));
	}

	/* ---------- words for screen readers ---------- */
	const each = (w: Crew) => short(burgersOf(LEVEL_PAYS[levels[w] - 1], bet));
	const boardLabel = $derived(s.boardLabel(fieldSize(open), CREW.map((w) => s.levelLabel(s.crew[w], s.items[w], levels[w], each(w))).join('; '), ketchups));
	const munchLabel = (c: MunchCoin | null) =>
		!c ? s.munch.empty : c.kind === 'mult' ? s.munch.multLabel(c.value) : c.kind === 'squad' ? s.munch.squadLabel(short(burgersOf(c.value, bet))) : s.munch.coinLabel(short(burgersOf(c.value, bet)));
	const RAIN = Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 5) * 0.18, dur: 1.4 + (i % 4) * 0.25, crew: CREW[i % 4] }));
	const CELLS = Array.from({ length: SIDE * SIDE }, (_, i) => i);
	const FEATURE_ROWS = ['wild', 'up', 'swap', 'coin', 'frag', 'letter', 'ketchup'] as const;
</script>

{#snippet face(w: Crew)}
	{#if w === 'phil'}<PhillestarEmblem />{:else if w === 'lars'}<LarsAkeEmblem />{:else if w === 'jeeven'}<DaJeevenEmblem />{:else}<IngmanEmblem />{/if}
{/snippet}

<div class="f2" class:busy style:--ms-step="{ms(MS.step)}ms" style:--ms-fall="{ms(MS.fall)}ms" style:--ms-fill="{ms(MS.fill)}ms">
	<div class="f2-cab">
		<!-- the marquee: neon title; in free spins their counter and the Hotbox multiplier -->
		<div class="f2-marquee" class:free-on={!!freeState}>
			<div class="f2-bulbs" aria-hidden="true">{#each Array.from({ length: 18 }) as _, i (i)}<span style:--i={i}></span>{/each}</div>
			{#if freeState}
				<p class="f2-title f2-free-title font-head" role="status">{s.free.title(freeState.n, freeState.total)}</p>
				<p class="f2-sub font-head">{s.free.sub(mult, freeState.won)}</p>
			{:else}
				<p class="f2-title font-head">Abscar’s Fortune <span class="f2-two">II</span></p>
				<p class="f2-sub font-head">{s.sub}</p>
			{/if}
		</div>

		<div class="f2-main">
			<!-- the board -->
			<div class="f2-board-wrap">
				<div class="f2-board" class:smoky={mult > 1} style:--smoke={Math.min(1, (mult - 1) / 8)} role="img" aria-label={boardLabel}>
					<div class="f2-cells" aria-hidden="true">
						{#each CELLS as i (i)}<span class="f2-cell" class:wall={!isOpen(open, i)}></span>{/each}
					</div>
					<div class="f2-layer" aria-hidden="true">
						{#each pieces as rp (rp.k)}
							<div class="f2-piece" class:snap={rp.snap} data-fx={rp.fx || undefined} style:--r={rp.r} style:--c={rp.c}>
								<div class="f2-in"><Fortune2Piece piece={rp.p} level={rp.p.crew ? levels[rp.p.crew] : 1} {bet} /></div>
							</div>
						{/each}
						{#each CREW as w (w)}
							<div class="f2-crew" data-crew={w} class:flash={flash === w} style:--r={rowOf(crewAt[w])} style:--c={colOf(crewAt[w])} style:--cc={CREW_COLOUR[w]}>
								<span class="f2-crew-base"></span>
								<span class="f2-crew-face">{@render face(w)}</span>
								<span class="f2-crew-item"><Fortune2Piece piece={{ kind: 'item', crew: w }} level={levels[w]} /></span>
							</div>
						{/each}
						{#each booms as b (b.id)}<span class="f2-boom" style:--r={rowOf(b.cell)} style:--c={colOf(b.cell)}></span>{/each}
						{#each pops as p (p.id)}
							<span class="f2-pop font-head num" data-kind={p.kind} class:center={p.cell < 0} style:--r={p.cell < 0 ? 0 : rowOf(p.cell)} style:--c={p.cell < 0 ? 0 : colOf(p.cell)}>{p.text}</span>
						{/each}
					</div>
					{#if mult > 1}<div class="f2-smoke" aria-hidden="true"></div>{/if}
				</div>

				<!-- The Munchies: the coin board over the board -->
				{#if munch}
					<div class="f2-over f2-munch" role="group" aria-label={s.munch.title} bind:this={overlayEl}>
						<p class="f2-over-title font-head">{s.munch.title}</p>
						<div class="f2-respins" aria-live="polite">
							<span class="sr-only">{s.munch.respins(munch.left)}</span>
							{#each [0, 1, 2] as i (i)}<span class="f2-dot" class:on={i < munch.left} aria-hidden="true"></span>{/each}
						</div>
						<div class="f2-mgrid">
							{#each munch.coins as c, i (i)}
								{#if MUNCH_CORNERS.includes(i)}
									<span class="f2-mcell corner" aria-hidden="true">{@render face(CREW[MUNCH_CORNERS.indexOf(i)])}</span>
								{:else}
									<span class="f2-mcell" class:lit={munch.lit.includes(i)} data-coin={c?.kind} aria-label={s.munch.cell(i + 1, munchLabel(c))} role="img">
										{#if c?.kind === 'cash'}
											<Fortune2Piece piece={{ kind: 'coin', coin: c.value }} {bet} />
										{:else if c?.kind === 'mult'}
											<span class="f2-mcoin mult font-head num">×{c.value}</span>
										{:else if c?.kind === 'squad'}
											<span class="f2-mcoin squad font-head num" style:--cc={CREW_COLOUR[c.crew ?? 'phil']}><small>{s.munch.squad}</small>{short(burgersOf(c.value, bet))}</span>
										{/if}
									</span>
								{/if}
							{/each}
						</div>
						<p class="f2-msum font-head num" aria-live="polite">
							{s.munch.coins(short(burgersOf(munch.cash, bet)))}{#if munch.mults > 1}<b>{` · ×${munch.mults}`}</b>{/if}{#if munch.done && munch.m.full}<b>{` · ${s.munch.full}`}</b>{/if}
						</p>
						{#if munch.done}
							<!-- the result: a card on top of the coin board -->
							<div class="f2-mdone" role="status">
								<p class="f2-kicker font-head">{s.munch.won}</p>
								<p class="f2-amount font-head num">+{short(burgersOf(munch.m.pay, bet))} 🍔</p>
								<button type="button" class="f2-go font-head" onclick={() => tapGo?.()}>{s.continue}</button>
							</div>
						{:else}
							<p class="f2-help f2-mhelp">{s.munch.short}</p>
						{/if}
					</div>
				{/if}

				<!-- free spins: intro / "+3 more" / total -->
				{#if banner?.kind === 'more'}
					<p class="f2-more font-head" role="status">{s.free.more(banner.spins)}</p>
				{:else if banner}
					<div class="f2-over f2-fs" data-kind={banner.kind} bind:this={overlayEl}>
						<span class="f2-rain" aria-hidden="true">
							{#each RAIN as rain, i (i)}<span style:left="{rain.x}%" style:animation-delay="{rain.d}s" style:animation-duration="{rain.dur}s"
									><Fortune2Piece piece={banner.kind === 'intro' ? { kind: i % 3 ? 'ketchup' : 'wild' } : { kind: 'item', crew: rain.crew }} /></span
								>{/each}
						</span>
						{#if banner.kind === 'intro'}
							<p class="f2-big font-head">{s.free.intro[banner.bonus]}</p>
							<p class="f2-help">{s.free.introSub[banner.bonus](banner.spins)}</p>
						{:else}
							<p class="f2-kicker font-head">{s.free.outro}</p>
							<p class="f2-amount font-head num">+{banner.won.toLocaleString('en-US')} 🍔</p>
							<p class="f2-help">{s.free.outroSub(banner.spins)}</p>
						{/if}
						<button type="button" class="f2-go font-head" onclick={() => tapGo?.()}>{s.continue} ▸</button>
					</div>
				{/if}

				{#if celebrate}
					<div class="f2-celebrate" data-tier={tier} role="status">
						<p class="f2-big font-head">{s.tiers[tier === 'none' ? 'win' : tier]}</p>
						<p class="f2-amount font-head num">+{lastWin.toLocaleString('en-US')} 🍔</p>
					</div>
				{/if}
			</div>

			<!-- the side panel: the squad's levels, the letters, Abscar's holk meter, ketchups, the multiplier -->
			<div class="f2-side">
				<section class="f2-squad" aria-label={s.levels}>
					{#each CREW as w (w)}
						<div class="f2-lv" class:flash={flash === w} style:--cc={CREW_COLOUR[w]} title={s.levelLabel(s.crew[w], s.items[w], levels[w], each(w))}>
							<span class="f2-lv-face" aria-hidden="true">{@render face(w)}</span>
							<span class="min-w-0 flex-1">
								<span class="f2-lv-name font-head">{s.crew[w]}</span>
								<span class="f2-pips" aria-hidden="true">{#each Array.from({ length: 7 }) as _, i (i)}<span class:on={i < levels[w]}></span>{/each}</span>
								<span class="sr-only">{s.levelLabel(s.crew[w], s.items[w], levels[w], each(w))}</span>
							</span>
							<span class="f2-lv-n font-head num" aria-hidden="true"><small>{s.lv}</small>{levels[w]}</span>
						</div>
					{/each}
				</section>
				<div class="f2-letters" role="img" aria-label={s.lettersLabel(LETTERS.filter((_, i) => letters[i]).join(' '))}>
					{#each LETTERS as L, i (L)}<span class="f2-letter font-head" class:on={letters[i]} class:pulse={letterFlash === i}>{L}</span>{/each}
				</div>
				<div class="f2-meter" role="img" aria-label={s.meterLabel(meter, METER_MAX)}>
					<span class="f2-meter-label font-head">{s.meter}</span>
					<span class="f2-meter-bar"><span style:width="{(100 * meter) / METER_MAX}%"></span></span>
					<span class="f2-meter-n font-head num">{meter}/{METER_MAX}</span>
				</div>
				<div class="f2-stats font-head">
					<span class="f2-stat" class:hot={ketchups >= 2}><small>{s.ketchup}</small><b class="num">{ketchups}/3</b></span>
					<span class="f2-stat" class:hot={mult > 1}><small>{s.hotbox}</small><b class="num">×{mult}</b></span>
				</div>
			</div>
		</div>

		<p class="f2-msg" aria-live="polite">{message}</p>

		<!-- credits, bet, win, spin -->
		<div class="f2-panel">
			<div class="f2-led"><span>{s.credits}</span><b class="num">{shown.toLocaleString('en-US')}</b></div>
			<div class="f2-led">
				<span>{t.casino.bet}</span>
				<div class="flex items-center gap-1">
					<button type="button" class="f2-step" aria-label="−" disabled={busy || bet === F2_BETS[0]} onclick={() => stepBet(-1)}>−</button>
					<b class="num" aria-live="polite" aria-label={t.casino.betLabel(bet)}>{bet}</b>
					<button type="button" class="f2-step" aria-label="+" disabled={busy || bet === F2_BETS[F2_BETS.length - 1]} onclick={() => stepBet(1)}>+</button>
				</div>
			</div>
			<div class="f2-led win"><span>{s.lastWin}</span><b class="num">{lastWin.toLocaleString('en-US')}</b></div>
			<button type="button" class="f2-spin font-head" bind:this={spinBtn} disabled={busy || autoLeft > 0} onclick={() => void spin()}>{busy ? '…' : s.spin}</button>
		</div>

		<!-- auto spin, turbo, skip -->
		<div class="f2-auto" role="group" aria-label={sl.autoLabel}>
			<button type="button" class="f2-auto-btn font-head" aria-pressed={autoLeft > 0} disabled={autoLeft === 0 && (busy || bet > shown)} onclick={() => void runAuto()}>
				{autoLeft > 0 ? sl.autoStop(autoLeft) : sl.auto(autoCount)}
			</button>
			{#if autoLeft === 0}
				{#each AUTO_COUNTS as n (n)}
					<button type="button" class="f2-auto-n num font-head" aria-pressed={autoCount === n} aria-label={sl.autoCount(n)} onclick={() => (autoCount = n)}>{n}</button>
				{/each}
			{/if}
			<span class="flex-1"></span>
			<button type="button" class="f2-auto-n f2-turbo font-head" aria-pressed={turbo} onclick={toggleTurbo}>⚡ {s.turbo}</button>
			<button type="button" class="f2-auto-n f2-skip font-head" aria-label={s.skipLabel} disabled={!busy || skip} onclick={() => (skip = true)}>{s.skip} ▸▸</button>
		</div>

		<!-- buy bonus -->
		<div class="f2-buy" role="group" aria-label={s.buy}>
			{#if buyAsk}
				<p class="f2-buy-ask" role="status">{sl.buyAsk(buyWhat(buyAsk), price(buyAsk))}</p>
				<div class="flex gap-1.5">
					<button type="button" class="f2-buy-yes font-head" disabled={busy || price(buyAsk) > shown} onclick={() => void confirmBuy()}>{sl.buyYes}</button>
					<button type="button" class="f2-buy-no font-head" onclick={() => (buyAsk = null)}>{sl.buyNo}</button>
				</div>
			{:else}
				<span class="f2-buy-label font-head">{s.buy}</span>
				<div class="f2-buy-list">
					{#each BUY_KINDS as kind (kind)}
						<button type="button" class="f2-buy-btn" data-buy={kind} disabled={busy || autoLeft > 0 || price(kind) > shown} onclick={() => askBuy(kind)}>
							<span class="f2-buy-ico"><Fortune2Piece piece={kind === 'munchies' ? { kind: 'letter', letter: 0 } : kind === 'super' ? { kind: 'wild' } : { kind: 'ketchup' }} /></span>
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

<details class="f2-paytable mt-3 text-xs text-muted">
	<summary class="min-h-11 cursor-pointer content-center font-semibold">{s.paytable}</summary>
	<p class="pb-2">{s.how}</p>
	<p class="pb-1 font-semibold text-fg">{s.levelTable}</p>
	<div class="f2-pay-levels pb-2">
		{#each LEVEL_PAYS as v, i (i)}
			<span class="f2-pay-lv"><span class="f2-pay-ico"><Fortune2Piece piece={{ kind: 'item', crew: CREW[i % 4] }} level={i + 1} /></span><b class="num text-fg">{short(burgersOf(v, bet))}</b></span>
		{/each}
	</div>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-1.5 pb-2">
		{#each FEATURE_ROWS as kind (kind)}
			<li class="f2-pay-row flex items-center gap-2 rounded-lg px-2 py-1">
				<span class="f2-pay-ico big"><Fortune2Piece piece={{ kind, coin: 50, letter: 0 }} {bet} /></span>
				<span class="min-w-0">{s.features[kind]}</span>
			</li>
		{/each}
	</ul>
	<p class="pb-1">{s.meterNote(METER_MAX)}</p>
	<p class="pb-1">{s.freeNote}</p>
	<p class="pb-1">{s.munchNote}</p>
	<p class="pb-1">{s.buyNote(BUY_PRICE.hotbox, BUY_PRICE.super, BUY_PRICE.munchies)}</p>
	<p class="pb-1">{s.rtpNote}</p>
	<p class="pb-1">{s.maxNote(MAX_WIN)}</p>
</details>

<style>
	.f2 {
		container-type: inline-size;
		max-width: 780px;
	}
	/* the cabinet: a neon hotbox, purple and green with gold trim */
	.f2-cab {
		position: relative;
		padding: 10px 10px 12px;
		border: 4px solid #ffc928;
		border-radius: 22px 22px 14px 14px;
		background:
			radial-gradient(120% 50% at 50% 0%, rgb(125 255 106 / 0.18), transparent 60%),
			radial-gradient(80% 60% at 100% 100%, rgb(255 92 168 / 0.16), transparent 60%),
			linear-gradient(180deg, #3a1468, #1d0838 60%, #0e031c);
		box-shadow:
			0 0 0 3px #12051f,
			0 0 26px rgb(125 255 106 / 0.35),
			inset 0 2px 0 rgb(255 255 255 / 0.2);
		color: #fff6e0;
	}
	.f2-marquee {
		position: relative;
		margin-bottom: 10px;
		padding: 12px 8px 8px;
		border-radius: 14px;
		background: linear-gradient(180deg, #160626, #07020d);
		box-shadow:
			inset 0 0 0 2px #7dff6a,
			0 0 12px rgb(125 255 106 / 0.35);
		text-align: center;
		overflow: hidden;
	}
	.f2-marquee.free-on {
		box-shadow:
			inset 0 0 0 2px #ff5ca8,
			0 0 16px rgb(255 92 168 / 0.5);
	}
	.f2-bulbs {
		position: absolute;
		inset: 3px 6px auto;
		display: flex;
		justify-content: space-between;
	}
	.f2-bulbs span {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: #7dff6a;
		box-shadow: 0 0 6px #7dff6a;
		animation: f2-bulb 1.2s calc(var(--i) * -0.07s) infinite steps(2);
	}
	.free-on .f2-bulbs span {
		background: #ff5ca8;
		box-shadow: 0 0 6px #ff5ca8;
	}
	@keyframes f2-bulb {
		50% {
			opacity: 0.25;
		}
	}
	.f2-title {
		text-shadow: none !important;
		font-size: clamp(20px, 6.2cqi, 34px);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fffbe0, #ffd23a 55%, #ff9a00);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 2px 0 #2a0a3a) drop-shadow(0 0 10px rgb(125 255 106 / 0.45));
	}
	.f2-two {
		background: linear-gradient(180deg, #e8ffe0, #7dff6a 55%, #22b14c);
		-webkit-background-clip: text;
		background-clip: text;
	}
	.f2-free-title {
		background: linear-gradient(180deg, #fff, #ff9ad0 55%, #ff3d9a);
		-webkit-background-clip: text;
		background-clip: text;
	}
	.f2-sub {
		margin-top: 2px;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #b9ffb0;
	}
	/* board + side panel: side by side from 600 px of room */
	.f2-main {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 10px;
	}
	@container (min-width: 600px) {
		.f2-main {
			grid-template-columns: minmax(0, 1fr) 212px;
			align-items: start;
		}
	}
	/* the board's own width is the unit for everything drawn on it (pop-ups, overlays) */
	.f2-board-wrap {
		position: relative;
		container-type: inline-size;
	}
	.f2-board {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 12px;
		background: #0b0414;
		box-shadow:
			inset 0 0 0 2px #ffc928,
			inset 0 0 24px rgb(0 0 0 / 0.8);
	}
	.f2-cells,
	.f2-layer {
		position: absolute;
		inset: 0;
	}
	.f2-cells {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		grid-template-rows: repeat(8, 1fr);
	}
	.f2-cell {
		margin: 1px;
		border-radius: 6px;
		background: radial-gradient(circle at 50% 40%, #2a1446, #170a28);
		transition: background 0.5s ease;
	}
	/* the walls round the field: dark bricks, blown open by frags */
	.f2-cell.wall {
		margin: 0;
		border-radius: 0;
		background:
			linear-gradient(0deg, rgb(0 0 0 / 0.55) 1px, transparent 1px) 0 0 / 100% 50%,
			linear-gradient(90deg, rgb(0 0 0 / 0.55) 1px, transparent 1px) 0 0 / 50% 50%,
			linear-gradient(180deg, #4a2a22, #2a1610);
		opacity: 0.92;
	}
	.f2-piece,
	.f2-crew {
		position: absolute;
		left: 0;
		top: 0;
		width: 12.5%;
		height: 12.5%;
		transform: translate(calc(var(--c) * 100%), calc(var(--r) * 100%));
	}
	.f2-piece {
		transition: transform var(--ms-fall) cubic-bezier(0.3, 0.7, 0.4, 1.06);
	}
	.f2-piece.snap {
		transition: none;
	}
	.f2-in {
		width: 100%;
		height: 100%;
		padding: 6%;
	}
	.f2-piece[data-fx='taken'] .f2-in {
		animation: f2-taken var(--ms-step) ease-in forwards;
	}
	.f2-piece[data-fx='boom'] .f2-in {
		animation: f2-boomed 0.5s ease-in forwards;
	}
	.f2-piece[data-fx='pop'] .f2-in {
		animation: f2-popin 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) both;
	}
	.f2-piece[data-fx='swap'] .f2-in {
		animation: f2-swap 0.6s ease-in-out;
	}
	@keyframes f2-taken {
		to {
			transform: scale(1.35);
			opacity: 0;
		}
	}
	@keyframes f2-boomed {
		40% {
			transform: scale(1.25) rotate(12deg);
			filter: brightness(2.5);
		}
		to {
			transform: scale(0) rotate(-30deg);
			opacity: 0;
		}
	}
	@keyframes f2-popin {
		from {
			transform: scale(0) rotate(-40deg);
		}
	}
	@keyframes f2-swap {
		50% {
			transform: scale(0.6) rotate(180deg);
			filter: blur(1px) brightness(1.6);
		}
	}
	/* the squad: a glowing disc in their colour, their operator, their munchie on a badge */
	.f2-crew {
		z-index: 2;
		transition: transform var(--ms-step) cubic-bezier(0.4, 0, 0.3, 1.2);
	}
	.f2-crew-base {
		position: absolute;
		inset: 6%;
		border-radius: 999px;
		background: radial-gradient(circle at 50% 35%, color-mix(in srgb, var(--cc) 55%, #fff), var(--cc) 55%, color-mix(in srgb, var(--cc) 55%, #000));
		box-shadow:
			0 0 0 2px #fff,
			0 0 10px var(--cc),
			0 3px 6px rgb(0 0 0 / 0.6);
	}
	.f2-crew-face {
		position: absolute;
		inset: 4% 6% 8%;
		display: grid;
		place-items: center;
	}
	.f2-crew-face :global(svg),
	.f2-lv-face :global(svg),
	.f2-mcell.corner :global(svg) {
		width: 100% !important;
		height: 100% !important;
	}
	.f2-crew-item {
		position: absolute;
		right: -4%;
		bottom: -4%;
		width: 38%;
		height: 38%;
	}
	.f2-crew.flash .f2-crew-base {
		animation: f2-flash 0.55s ease-in-out 2;
	}
	@keyframes f2-flash {
		50% {
			box-shadow:
				0 0 0 3px #ffd23a,
				0 0 22px #ffd23a,
				0 0 40px var(--cc);
			transform: scale(1.12);
		}
	}
	.f2-boom {
		position: absolute;
		left: 0;
		top: 0;
		width: 37.5%;
		height: 37.5%;
		transform: translate(calc((var(--c) - 1) * 33.333%), calc((var(--r) - 1) * 33.333%));
		border-radius: 999px;
		background: radial-gradient(circle, #fff 0 12%, #ffd23a 25%, #ff6a1a 45%, rgb(255 60 20 / 0.5) 60%, transparent 70%);
		animation: f2-boom 0.6s ease-out forwards;
		z-index: 3;
		pointer-events: none;
	}
	@keyframes f2-boom {
		from {
			opacity: 1;
			scale: 0.3;
		}
		to {
			opacity: 0;
			scale: 1.4;
		}
	}
	/* pop-ups: burgers taken float up from the cell; big words sit in the middle */
	.f2-pop {
		position: absolute;
		left: calc((var(--c) + 0.5) * 12.5%);
		top: calc((var(--r) + 0.35) * 12.5%);
		z-index: 4;
		translate: -50% -50%;
		font-size: clamp(11px, 3.4cqi, 17px);
		font-weight: 900;
		white-space: nowrap;
		color: #fff6b0;
		text-shadow:
			0 1px 0 #2a0a3a,
			0 0 6px #000,
			0 0 10px rgb(255 210 58 / 0.8);
		pointer-events: none;
		animation: f2-float 1s ease-out forwards;
	}
	.f2-pop[data-kind='coin'] {
		color: #ffe26a;
		font-size: clamp(13px, 4cqi, 20px);
	}
	.f2-pop[data-kind='boom'] {
		color: #ffb04a;
		font-size: clamp(14px, 4.4cqi, 22px);
	}
	.f2-pop[data-kind='level'] {
		color: #7dff6a;
	}
	.f2-pop.center {
		left: 50%;
		top: 46%;
		font-size: clamp(20px, 7cqi, 40px);
		letter-spacing: 0.04em;
		animation: f2-zoom 1.1s ease-out forwards;
	}
	.f2-pop.center[data-kind='mult'] {
		color: #ff9ad0;
		font-size: clamp(28px, 10cqi, 56px);
		text-shadow:
			0 2px 0 #2a0a3a,
			0 0 18px #ff3d9a;
	}
	.f2-pop.center[data-kind='abscar'] {
		color: #ff6a3a;
		text-shadow:
			0 2px 0 #1a0505,
			0 0 18px #ff2a00;
	}
	@keyframes f2-float {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.8);
		}
		15% {
			opacity: 1;
			transform: translateY(0) scale(1.1);
		}
		to {
			opacity: 0;
			transform: translateY(-26px) scale(1);
		}
	}
	@keyframes f2-zoom {
		from {
			opacity: 0;
			transform: scale(0.4);
		}
		20% {
			opacity: 1;
			transform: scale(1.12);
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
	/* Hotbox: the room gets smokier as the multiplier grows */
	.f2-smoke {
		position: absolute;
		inset: -10%;
		z-index: 3;
		pointer-events: none;
		opacity: calc(0.15 + var(--smoke) * 0.4);
		background:
			radial-gradient(40% 30% at 20% 30%, rgb(220 210 240 / 0.5), transparent 70%),
			radial-gradient(35% 28% at 75% 60%, rgb(200 240 210 / 0.45), transparent 70%),
			radial-gradient(45% 30% at 50% 90%, rgb(230 220 255 / 0.5), transparent 70%);
		filter: blur(6px);
		animation: f2-drift 14s ease-in-out infinite alternate;
	}
	@keyframes f2-drift {
		to {
			transform: translate(6%, -4%) scale(1.08);
		}
	}
	/* overlays over the board: the coin game, the free-spin screens, big wins */
	.f2-over,
	.f2-celebrate {
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
		/* clip, not hidden: focusing the button inside must not scroll the overlay */
		overflow: clip;
	}
	.f2-fs {
		background: radial-gradient(circle at 50% 40%, rgb(80 20 120 / 0.95), rgb(10 2 20 / 0.97));
		box-shadow: inset 0 0 0 3px #ff5ca8;
	}
	.f2-fs[data-kind='outro'] {
		box-shadow: inset 0 0 0 3px #ffd23a;
	}
	.f2-munch {
		justify-content: flex-start;
		background: radial-gradient(circle at 50% 30%, rgb(40 90 30 / 0.97), rgb(6 16 6 / 0.98));
		box-shadow: inset 0 0 0 3px #7dff6a;
	}
	.f2-over-title,
	.f2-big {
		font-size: clamp(22px, 7cqi, 40px);
		font-weight: 900;
		line-height: 1.05;
		color: #fff6b0;
		text-shadow:
			0 2px 0 #2a0a3a,
			0 0 16px rgb(255 210 58 / 0.7);
	}
	.f2-over-title {
		font-size: clamp(16px, 5cqi, 28px);
	}
	.f2-kicker {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.2em;
		color: #ffd23a;
	}
	.f2-amount {
		font-size: clamp(26px, 8cqi, 46px);
		font-weight: 900;
		color: #fff;
		text-shadow: 0 0 16px rgb(255 210 58 / 0.9);
	}
	.f2-help {
		max-width: 34em;
		font-size: 12px;
		line-height: 1.35;
		color: #e8dcff;
	}
	.f2-go {
		min-height: 44px;
		min-width: 140px;
		margin-top: 4px;
		padding: 0 18px;
		border-radius: 999px;
		background: linear-gradient(180deg, #ffe680, #ffb000);
		color: #3a1400;
		font-weight: 900;
		letter-spacing: 0.06em;
		box-shadow:
			0 3px 0 #8a4a00,
			0 0 14px rgb(255 190 40 / 0.6);
	}
	.f2-rain {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.f2-rain > span {
		position: absolute;
		top: -14%;
		width: 9%;
		aspect-ratio: 1;
		animation: f2-rain 1.6s linear infinite;
		opacity: 0.55;
	}
	@keyframes f2-rain {
		to {
			transform: translateY(1200%) rotate(220deg);
		}
	}
	.f2-more {
		position: absolute;
		inset: 40% 0 auto;
		z-index: 6;
		text-align: center;
		font-size: clamp(22px, 7cqi, 40px);
		font-weight: 900;
		color: #ff9ad0;
		text-shadow:
			0 2px 0 #2a0a3a,
			0 0 18px #ff3d9a;
		animation: f2-zoom 1.5s ease-out forwards;
	}
	.f2-celebrate {
		pointer-events: none;
		background: radial-gradient(circle, rgb(40 10 60 / 0.75), rgb(0 0 0 / 0.55));
		animation: f2-zoom 3.4s ease-out forwards;
	}
	.f2-celebrate[data-tier='epic'] .f2-big {
		color: #ff9ad0;
		text-shadow:
			0 2px 0 #2a0a3a,
			0 0 22px #ff3d9a,
			0 0 40px #7dff6a;
	}
	/* The Munchies' coin board */
	.f2-respins {
		display: flex;
		gap: 6px;
	}
	.f2-dot {
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.15);
		box-shadow: inset 0 0 0 1.5px #7dff6a;
	}
	.f2-dot.on {
		background: #7dff6a;
		box-shadow: 0 0 8px #7dff6a;
	}
	.f2-mgrid {
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 3px;
		width: min(100%, 72cqi);
	}
	@container (max-width: 420px) {
		.f2-mgrid {
			width: min(100%, 66cqi);
		}
	}
	.f2-mhelp {
		max-width: 30em;
		font-size: 11px;
	}
	@container (max-width: 420px) {
		.f2-mhelp {
			display: none;
		}
	}
	.f2-mcell {
		position: relative;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		border-radius: 8px;
		background: rgb(0 0 0 / 0.35);
		box-shadow: inset 0 0 0 1px rgb(125 255 106 / 0.35);
	}
	.f2-mcell[data-coin] {
		animation: f2-popin 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) both;
	}
	.f2-mcell.lit {
		box-shadow:
			inset 0 0 0 2px #ffd23a,
			0 0 10px #ffd23a;
	}
	.f2-mcell.corner {
		padding: 6%;
		background: rgb(255 255 255 / 0.08);
	}
	.f2-mcoin {
		display: grid;
		place-items: center;
		width: 86%;
		aspect-ratio: 1;
		border-radius: 999px;
		font-size: clamp(10px, 2.6cqi, 15px);
		font-weight: 900;
		line-height: 1;
	}
	.f2-mcoin.mult {
		background: radial-gradient(circle at 35% 30%, #f0d0ff, #9b4be6 55%, #4a1880);
		color: #fff;
		box-shadow:
			0 0 0 2px #2a1408,
			0 0 10px #c98bff;
		font-size: clamp(13px, 3.4cqi, 20px);
	}
	.f2-mcoin.squad {
		background: radial-gradient(circle at 35% 30%, #fff, var(--cc) 55%, color-mix(in srgb, var(--cc) 55%, #000));
		color: #fff;
		text-shadow: 0 1px 1px #000;
		box-shadow:
			0 0 0 2px #ffd23a,
			0 0 10px #ffd23a;
	}
	.f2-mcoin.squad small {
		display: block;
		font-size: 0.6em;
		letter-spacing: 0.06em;
	}
	.f2-msum {
		font-size: 14px;
		font-weight: 800;
		color: #fff6b0;
	}
	.f2-msum b {
		color: #ff9ad0;
	}
	.f2-mdone {
		position: absolute;
		left: 50%;
		top: 52%;
		translate: -50% -50%;
		display: grid;
		justify-items: center;
		gap: 2px;
		min-width: min(78%, 280px);
		padding: 14px 20px;
		border-radius: 16px;
		background: rgb(6 20 6 / 0.93);
		box-shadow:
			inset 0 0 0 2px #ffd23a,
			0 0 30px rgb(0 0 0 / 0.75);
		animation: f2-popin 0.45s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	/* the side panel */
	.f2-side {
		display: grid;
		gap: 8px;
		grid-template-columns: minmax(0, 1fr);
	}
	.f2-squad {
		display: grid;
		gap: 4px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	@container (min-width: 600px) {
		.f2-squad {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.f2-lv {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		padding: 4px 6px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.35);
		box-shadow: inset 3px 0 0 var(--cc);
	}
	.f2-lv.flash {
		animation: f2-flash 0.55s ease-in-out 2;
	}
	.f2-lv-face {
		flex: none;
		width: 30px;
		height: 30px;
	}
	.f2-lv-name {
		display: block;
		overflow: hidden;
		font-size: 11px;
		font-weight: 800;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.f2-pips {
		display: flex;
		gap: 2px;
		margin-top: 2px;
	}
	.f2-pips span {
		flex: 1;
		height: 5px;
		border-radius: 2px;
		background: rgb(255 255 255 / 0.15);
	}
	.f2-pips span.on {
		background: var(--cc);
		box-shadow: 0 0 4px var(--cc);
	}
	.f2-lv-n {
		flex: none;
		font-size: 17px;
		font-weight: 900;
		line-height: 1;
	}
	.f2-lv-n small {
		margin-right: 1px;
		font-size: 9px;
		color: #c9b6ff;
	}
	.f2-letters {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 4px;
	}
	.f2-letter {
		display: grid;
		place-items: center;
		height: 34px;
		border-radius: 8px;
		background: #12061e;
		box-shadow: inset 0 0 0 1.5px rgb(255 92 168 / 0.35);
		color: rgb(255 255 255 / 0.25);
		font-size: 18px;
		font-weight: 900;
	}
	.f2-letter.on {
		color: #fff;
		box-shadow:
			inset 0 0 0 2px #ff5ca8,
			0 0 10px #ff5ca8;
		text-shadow: 0 0 6px #ff5ca8;
	}
	.f2-letter.pulse {
		animation: f2-popin 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	.f2-meter {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 6px;
		padding: 5px 8px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.35);
	}
	.f2-meter-label,
	.f2-meter-n {
		font-size: 11px;
		font-weight: 800;
	}
	.f2-meter-bar {
		height: 10px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.12);
		overflow: hidden;
	}
	.f2-meter-bar span {
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #7a4a2a, #ffb04a 70%, #ff5a00);
		box-shadow: 0 0 8px #ff7a1a;
		transition: width 0.3s ease;
	}
	.f2-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
	}
	.f2-stat {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 4px;
		padding: 5px 8px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.35);
	}
	.f2-stat small {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #c9b6ff;
	}
	.f2-stat b {
		font-size: 16px;
		font-weight: 900;
	}
	.f2-stat.hot {
		box-shadow:
			inset 0 0 0 1.5px #ff5ca8,
			0 0 8px rgb(255 92 168 / 0.5);
	}
	.f2-msg {
		min-height: 2.6em;
		margin: 8px 2px 4px;
		font-size: 13px;
		line-height: 1.3;
		color: #fff6e0;
	}
	/* the panel */
	.f2-panel {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
		align-items: stretch;
		gap: 6px;
	}
	@container (max-width: 420px) {
		/* the bet box gets the most room: − 500 + has to fit */
		.f2-panel {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
		}
		.f2-spin {
			grid-column: 1 / -1;
		}
		.f2-led {
			padding: 4px 6px;
		}
		.f2-step {
			width: 28px;
			height: 28px;
		}
		.f2-step::after {
			inset: -8px;
		}
	}
	.f2-led {
		display: grid;
		align-content: center;
		gap: 1px;
		min-width: 0;
		padding: 4px 8px;
		border-radius: 10px;
		background: #07020d;
		box-shadow: inset 0 0 0 1.5px rgb(125 255 106 / 0.5);
	}
	.f2-led span {
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #9aff8e;
	}
	.f2-led b {
		font-size: 17px;
		font-weight: 900;
		color: #7dff6a;
		text-shadow: 0 0 6px rgb(125 255 106 / 0.7);
	}
	.f2-led.win b {
		color: #ffd23a;
		text-shadow: 0 0 6px rgb(255 210 58 / 0.7);
	}
	.f2-step {
		position: relative;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: rgb(125 255 106 / 0.15);
		color: #b9ffb0;
		font-weight: 900;
	}
	/* a 44 px tap target round the small round button */
	.f2-step::after {
		content: '';
		position: absolute;
		inset: -7px;
	}
	.f2-step:disabled {
		opacity: 0.35;
	}
	.f2-spin {
		min-height: 52px;
		min-width: 96px;
		padding: 0 18px;
		border-radius: 999px;
		background: radial-gradient(circle at 50% 30%, #c8ffb8, #3fd34a 50%, #13801f);
		color: #062a0a;
		font-size: 20px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		box-shadow:
			0 4px 0 #0a4a12,
			0 0 18px rgb(125 255 106 / 0.6);
	}
	.f2-spin:disabled {
		filter: grayscale(0.5) brightness(0.8);
	}
	.f2-auto,
	.f2-buy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
	}
	.f2-auto-btn,
	.f2-auto-n,
	.f2-buy-yes,
	.f2-buy-no {
		min-height: 44px;
		padding: 0 12px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.08);
		box-shadow: inset 0 0 0 1.5px rgb(201 182 255 / 0.5);
		font-size: 13px;
		font-weight: 800;
	}
	.f2-auto-n {
		min-width: 44px;
	}
	.f2-auto-btn[aria-pressed='true'],
	.f2-auto-n[aria-pressed='true'] {
		background: rgb(125 255 106 / 0.2);
		box-shadow: inset 0 0 0 2px #7dff6a;
		color: #c8ffb8;
	}
	.f2-auto button:disabled,
	.f2-buy button:disabled {
		opacity: 0.4;
	}
	.f2-buy-label {
		flex: 1 1 100%;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ffd23a;
	}
	.f2-buy-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 6px;
		flex: 1;
		min-width: 0;
	}
	.f2-buy-btn {
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
	.f2-buy-btn b {
		font-size: 13px;
	}
	.f2-buy-ico {
		flex: none;
		width: 34px;
		height: 34px;
	}
	.f2-buy-ask {
		flex: 1 1 100%;
		font-size: 13px;
	}
	.f2-buy-yes {
		background: linear-gradient(180deg, #ffe680, #ffb000);
		color: #3a1400;
	}
	/* the paytable */
	.f2-pay-levels {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.f2-pay-lv {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 2px;
		border-radius: 10px;
		background: var(--t-panel-2, rgb(0 0 0 / 0.2));
	}
	.f2-pay-ico {
		width: 30px;
		height: 30px;
		flex: none;
	}
	.f2-pay-ico.big {
		width: 36px;
		height: 36px;
	}
	.f2-pay-row {
		background: var(--t-panel-2, rgb(0 0 0 / 0.2));
	}
	@media (prefers-reduced-motion: reduce) {
		.f2-bulbs span,
		.f2-smoke,
		.f2-rain > span {
			animation: none;
		}
		.f2-rain {
			display: none;
		}
		.f2-piece,
		.f2-crew,
		.f2-meter-bar span {
			transition: none;
		}
		.f2-piece .f2-in,
		.f2-pop,
		.f2-pop.center,
		.f2-more,
		.f2-celebrate,
		.f2-mcell[data-coin],
		.f2-letter.pulse,
		.f2-lv.flash,
		.f2-crew.flash .f2-crew-base {
			animation: none !important;
		}
		.f2-piece[data-fx='taken'],
		.f2-piece[data-fx='boom'] {
			opacity: 0;
		}
	}
</style>
