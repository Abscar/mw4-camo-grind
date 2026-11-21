<!--
	BurgiCasino's roulette (squad-casino.ts; 2026-11-16): European wheel (one zero), chips on any spots
	(numbers 35:1, dozens / columns 2:1, red/black, odd/even, 1–18/19–36 1:1), the wheel spins to the
	number. The table lies across on wide screens and stands up on phones (3 numbers per row, 44 px).
	A spin is booked at once (squad.recordGame), then shown; `hidden` holds the chips on the table and,
	while the wheel turns, the result, so the balance above never gives it away. Pretend burgers.
	No table limit since 2026-11-21 (the user: "så att man kan lägga oändligt på roulettebordet"): only your own
	burgers limit the chips; chips up to 1M, "All in" (puts all your free burgers on the spot) and an own amount.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { colorOf, rouletteNet, spinNumber, spotPays, WHEEL, type OutsideBet, type RouletteSpot } from '#lib/squad-casino.ts';
	import { parseAmount } from '#lib/donations.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { lucky } from '#lib/casino-rig.ts';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	const r = t.casino.roulette;
	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	const CHIPS = [1, 5, 25, 100, 500, 1_000, 10_000, 100_000, 1_000_000];
	let chip = $state(5);
	/** "All in": each tap puts all your free burgers on the spot. */
	let allIn = $state(false);
	let custom = $state('');
	/** 1,500 → "1.5k", 2,000,000 → "2M" (chip faces and the stacks on the table). */
	const short = (n: number) => {
		const f = (x: number, u: string) => `${Number((n / x).toFixed(n / x < 10 ? 1 : 0))}${u}`;
		return n >= 1e9 ? f(1e9, 'B') : n >= 1e6 ? f(1e6, 'M') : n >= 1e3 ? f(1e3, 'k') : String(n);
	};
	function useCustom() {
		const n = parseAmount(custom);
		if (n === null || n < 1) {
			if (custom.trim()) toast.show(r.badAmount, undefined, 4000);
			return;
		}
		chip = n;
		allIn = false;
	}
	let bets = $state<Partial<Record<RouletteSpot, number>>>({});
	let spinning = $state(false);
	let result = $state<number | null>(null);
	let net = $state<number | null>(null);
	let history = $state<number[]>([]);
	const uid = $props.id();

	// ---- the spin (2026-11-21, the user: "gör en ny snygg animation när man snurrar roulettebordet") ----
	// One rAF loop moves the wheel and the ball together: the wheel turns clockwise and slows down, the ball
	// is launched the other way round the track, slows, drops in with a few bounces over the frets and is
	// carried into the winning pocket, which ends at the top under the marker. The result is worked out
	// (and booked) before any of it moves; the animation only shows it.
	const T = 6200; // whole spin, ms
	const T_DROP = 3500; // the ball leaves the track
	const T_LOCK = 4800; // the ball sits in its pocket and rides with the wheel
	const R_TRACK = 99;
	const R_POCKET = 69;
	const BALL_TURNS = 1800; // degrees the ball rolls before it drops in
	const DROP_BOUNCES = 3;
	const outCubic = (u: number) => 1 - (1 - u) ** 3;
	const outQuad = (u: number) => 1 - (1 - u) ** 2;
	const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

	/** The wheel's turn (degrees, clockwise). */
	let wheelAngle = $state(0);
	let ball = $state<{ x: number; y: number } | null>(null);
	/** The light streak behind the fast ball: a few arc pieces along its track, fading out. */
	let tail = $state<{ d: string; o: number; w: number }[]>([]);
	/** 0–1: how smeared the numbers look (the wheel's speed). */
	let blur = $state(0);
	let callout = $state(false);
	/** Win show after the ball lands: sparkles + "+n 🍔" (+ BIG WIN / STRAIGHT UP). */
	let show = $state<{ key: number; win: number; big: boolean; straight: boolean } | null>(null);
	let showKey = 0;
	let showTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(showTimer));

	const polar = (deg: number, r: number) => {
		const a = ((deg - 90) * Math.PI) / 180;
		return { x: Math.cos(a) * r, y: Math.sin(a) * r };
	};

	/** Plays the spin from the wheel's turn now to `Wf`; resolves when the ball has landed. */
	function animate(Wf: number): Promise<void> {
		const W0 = wheelAngle;
		const dW = Wf - W0;
		const W = (t: number) => W0 + dW * outCubic(clamp01(t / T));
		const Wv = (t: number) => (dW * 3 * (1 - clamp01(t / T)) ** 2) / T; // deg per ms
		// the winning pocket's place right now: at the top (0°) once the wheel stops
		const P = (t: number) => W(t) - Wf;
		// the ball's free roll (counter-clockwise), placed so it meets its pocket at a natural pace:
		// relative to the pocket it starts the drop `rho` degrees away and closes in on it smoothly
		const uDrop = T_DROP / T_LOCK;
		const ballV = (-BALL_TURNS * 2 * (1 - uDrop)) / T_LOCK;
		const rel = ballV - Wv(T_DROP);
		const span = T_LOCK - T_DROP;
		const rho = (-rel * span) / 1.5;
		const m0 = Math.max(-3, Math.min(-0.2, (rel * span) / rho));
		const base = P(T_DROP) + rho - BALL_TURNS * (1 - outQuad(uDrop));
		const free = (t: number) => base + BALL_TURNS * (1 - outQuad(clamp01(t / T_LOCK)));
		const hermite = (v: number) => 2 * v ** 3 - 3 * v ** 2 + 1 + m0 * (v ** 3 - 2 * v ** 2 + v);
		/** The ball's angle (deg) and distance from the middle at time t. */
		const ballAt = (t: number) => {
			if (t >= T_LOCK) {
				const s = (t - T_LOCK) / 1000;
				return { a: P(t), r: R_POCKET + 1.4 * Math.sin(s * 24) * Math.exp(-s * 7) };
			}
			if (t <= T_DROP) return { a: free(t), r: R_TRACK + 0.5 * Math.sin(t / 41) };
			const v = (t - T_DROP) / span;
			const hop = 8 * Math.abs(Math.sin(v * Math.PI * DROP_BOUNCES)) * (1 - v) ** 1.3;
			const skip = 7 * Math.sin(v * Math.PI * 4) * (1 - v) ** 2;
			return { a: P(t) + rho * hermite(v) + skip, r: R_POCKET + (R_TRACK - R_POCKET) * (1 - v) ** 1.6 + hop };
		};
		const arcPiece = (r: number, from: number, to: number) => {
			const p = polar(from, r);
			const q = polar(to, r);
			return `M${f2(p.x)} ${f2(p.y)}A${f2(r)} ${f2(r)} 0 0 1 ${f2(q.x)} ${f2(q.y)}`;
		};
		let clacks = 0;
		const frame = (t: number) => {
			wheelAngle = W(t);
			blur = 0.78 * clamp01(t / 350) * (1 - clamp01(t / T)) ** 2;
			const { a, r } = ballAt(t);
			ball = polar(a, r);
			// the streak behind it (the ball runs counter-clockwise, so behind = larger angles)
			const fast = t < T_DROP ? 1 : t < T_LOCK ? 1 - (t - T_DROP) / span : 0;
			const len = fast * Math.min(55, ((BALL_TURNS * 2 * (1 - clamp01(t / T_LOCK))) / T_LOCK) * 75 + 8);
			tail = len < 2 ? [] : Array.from({ length: 5 }, (_, j) => ({ d: arcPiece(r, a + 3 + (len * j) / 5, a + 3 + (len * (j + 1)) / 5), o: (0.42 - j * 0.08) * fast, w: 5 - j * 0.7 }));
			callout = t > 1500 && t < 2900;
			// the ball's clacks: dropping off the track, each bounce, then into the pocket
			const hits = t < T_DROP ? 0 : t >= T_LOCK ? DROP_BOUNCES + 1 : 1 + Math.floor(((t - T_DROP) / span) * DROP_BOUNCES);
			while (clacks < hits) {
				clacks++;
				sound.play('clack');
			}
		};
		return new Promise((done) => {
			const start = performance.now();
			let raf = 0;
			let finished = false;
			const finish = () => {
				if (finished) return;
				finished = true;
				cancelAnimationFrame(raf);
				clearTimeout(timer);
				frame(T);
				tail = [];
				blur = 0;
				callout = false;
				done();
			};
			const step = (now: number) => {
				const t = now - start;
				if (t >= T) return finish();
				frame(t);
				raf = requestAnimationFrame(step);
			};
			raf = requestAnimationFrame(step);
			// a hidden tab draws no frames: land the ball anyway
			const timer = setTimeout(finish, T + 400);
		});
	}

	const onTable = $derived(Object.values(bets).reduce<number>((sum, x) => sum + (x ?? 0), 0));
	// the chips on the table are set aside (and, while the wheel turns, the result too)
	let unrevealed = $state(0);
	$effect(() => {
		hidden = onTable + unrevealed;
		pending = unrevealed;
	});
	$effect(() => () => {
		hidden = 0;
		pending = 0;
	});
	const free = $derived(Math.max(0, balance - onTable - unrevealed));

	function place(spot: RouletteSpot) {
		if (spinning) return;
		const amount = allIn ? free : chip;
		if (amount < 1 || amount > free) {
			toast.show(t.casino.broke, undefined, 5000);
			return;
		}
		bets = { ...bets, [spot]: (bets[spot] ?? 0) + amount };
	}

	const SEG = 360 / WHEEL.length;

	async function spin() {
		if (spinning || onTable < 1) return;
		// Abscar's control room (casino-rig.ts): the number he picked for this spin, or your luck
		const forced = squad.takeForced('roulette');
		const n = forced ? forced.what : lucky(squad.luck('roulette'), rand, () => spinNumber(rand), (x) => rouletteNet(bets, x));
		const won = rouletteNet(bets, n);
		const staked = onTable;
		squad.recordGame(won);
		unrevealed = won;
		spinning = true;
		result = null;
		net = null;
		show = null;
		clearTimeout(showTimer);
		const k = WHEEL.indexOf(n as (typeof WHEEL)[number]);
		// the wheel ends with the winning pocket at the top: at least 3 more turns from where it is
		const want = (((-k * SEG) % 360) + 360) % 360;
		const now = ((wheelAngle % 360) + 360) % 360;
		const Wf = wheelAngle + ((want - now + 360) % 360) + 360 * 3;
		if (reduce()) {
			wheelAngle = Wf;
			ball = polar(0, R_POCKET);
		} else await animate(Wf);
		result = n;
		net = won;
		unrevealed = 0;
		history = [n, ...history].slice(0, 12);
		spinning = false;
		if (won > 0) sound.play(won >= 100 ? 'maxed' : 'camo');
		const straight = (bets[`n${n}` as RouletteSpot] ?? 0) > 0;
		if (won > 0) {
			show = { key: ++showKey, win: won, big: won >= staked * 10, straight };
			showTimer = setTimeout(() => (show = null), 2600);
		}
		if (Math.abs(won) >= 100 || (straight && won > 0)) squad.casinoNews(t.casino.event.roulette(won, n, r.colors[colorOf(n)]));
	}

	// the wheel's drawing (fixed; the rotor turns as one group)
	const f2 = (x: number) => Number(x.toFixed(2));
	const ring = (i: number, r0: number, r1: number) => {
		const a = polar((i - 0.5) * SEG, r1);
		const b = polar((i + 0.5) * SEG, r1);
		const c = polar((i + 0.5) * SEG, r0);
		const d = polar((i - 0.5) * SEG, r0);
		return `M${f2(a.x)} ${f2(a.y)}A${r1} ${r1} 0 0 1 ${f2(b.x)} ${f2(b.y)}L${f2(c.x)} ${f2(c.y)}A${r0} ${r0} 0 0 0 ${f2(d.x)} ${f2(d.y)}Z`;
	};
	const FACE = { red: '#c8141c', black: '#171717', green: '#1b8a34' } as const;
	const POCKET = { red: '#76090e', black: '#0a0a0a', green: '#0d5320' } as const;
	const SEGS = WHEEL.map((n, i) => ({ n, i, c: colorOf(n), face: ring(i, 76, 90), pocket: ring(i, 62, 76) }));
	const FRETS = WHEEL.map((_, i) => {
		const a = polar((i + 0.5) * SEG, 62);
		const b = polar((i + 0.5) * SEG, 90);
		return `M${f2(a.x)} ${f2(a.y)}L${f2(b.x)} ${f2(b.y)}`;
	}).join('');
	const DEFLECTORS = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);
	const TURRET = [45, 135, 225, 315];
	const SPARKS = Array.from({ length: 22 }, (_, i) => ({ a: i * (360 / 22) + (i % 2) * 7, d: 70 + ((i * 37) % 45), kind: i % 3 }));
	const winPocket = $derived(result === null || spinning ? null : ring(WHEEL.indexOf(result as (typeof WHEEL)[number]), 62, 90));

	// the numbers' places: across (wide) and standing up (phones)
	const NUMS = Array.from({ length: 36 }, (_, i) => i + 1).map((n) => ({
		n,
		c: Math.ceil(n / 3) + 1,
		r: 3 - ((n - 1) % 3),
		pc: ((n - 1) % 3) + 1,
		pr: Math.ceil(n / 3) + 1
	}));
	const COLS: { spot: OutsideBet; r: number; pc: number }[] = [
		{ spot: 'c3', r: 1, pc: 3 },
		{ spot: 'c2', r: 2, pc: 2 },
		{ spot: 'c1', r: 3, pc: 1 }
	];
	const OUTSIDE: OutsideBet[] = ['d1', 'd2', 'd3', 'low', 'even', 'red', 'black', 'odd', 'high'];
	const spotName = (spot: RouletteSpot) => (spot.startsWith('n') ? spot.slice(1) : spot.startsWith('c') ? r.colLabel(Number(spot.slice(1))) : r.spots[spot as OutsideBet]);
	const winning = (spot: RouletteSpot) => result !== null && spotPays(spot, result) > 0;
</script>

{#snippet stake(spot: RouletteSpot)}
	{#if bets[spot]}<span class="rl-chip num" aria-hidden="true">{short(bets[spot])}</span>{/if}
{/snippet}

<div class="rl">
	<div class="rl-top">
		<!-- the wheel -->
		<div class="rl-wheel-wrap" class:spinning>
			<svg class="rl-wheel" viewBox="-113 -113 226 226" role="img" aria-label={result !== null ? `${r.wheel}: ${r.result(result, r.colors[colorOf(result)])}` : r.wheel}>
				<defs>
					<radialGradient id="{uid}-wood" r="50%"><stop offset="0.82" stop-color="#7a3a14" /><stop offset="0.93" stop-color="#4a1f08" /><stop offset="1" stop-color="#2a1004" /></radialGradient>
					<radialGradient id="{uid}-track" r="50%"><stop offset="0.86" stop-color="#140c07" /><stop offset="0.95" stop-color="#3a2516" /><stop offset="1" stop-color="#1c110a" /></radialGradient>
					<radialGradient id="{uid}-cone" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#b8682a" /><stop offset="0.6" stop-color="#6e3412" /><stop offset="1" stop-color="#341505" /></radialGradient>
					<radialGradient id="{uid}-chrome" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff" /><stop offset="0.45" stop-color="#c9d1d8" /><stop offset="1" stop-color="#5d666e" /></radialGradient>
					<linearGradient id="{uid}-arm" x1="0" x2="1"><stop offset="0" stop-color="#7d868e" /><stop offset="0.5" stop-color="#f2f5f7" /><stop offset="1" stop-color="#7d868e" /></linearGradient>
					<radialGradient id="{uid}-ball" cx="34%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff" /><stop offset="0.55" stop-color="#eef0f2" /><stop offset="1" stop-color="#9ea4aa" /></radialGradient>
					<radialGradient id="{uid}-gold" cx="35%" cy="30%"><stop offset="0" stop-color="#fff6b0" /><stop offset="1" stop-color="#c98a00" /></radialGradient>
				</defs>
				<!-- the bowl: wooden rim, polished ball track, gold deflectors -->
				<circle r="111" fill="url(#{uid}-wood)" stroke="#ffc928" stroke-width="2.2" />
				<circle r="104" fill="url(#{uid}-track)" />
				<path d="M-74.9 -72.1A104 104 0 0 1 49.6 -91.4" fill="none" stroke="#fff" stroke-opacity="0.13" stroke-width="5" stroke-linecap="round" transform="scale(0.95)" />
				{#each DEFLECTORS as a (a)}
					<path d="M0 -95.6L1.4 -93L0 -90.4L-1.4 -93Z" fill="url(#{uid}-gold)" stroke="#6a4400" stroke-width="0.4" transform="rotate({a})" />
				{/each}
				<!-- the rotor: numbers, pockets, frets, cone and turret, turning as one -->
				<g class="rl-rotor" style:transform="rotate({wheelAngle}deg)">
					{#each SEGS as s (s.n)}
						<path d={s.face} fill={FACE[s.c]} />
						<path d={s.pocket} fill={POCKET[s.c]} />
						<text x="0" y="-83" transform="rotate({s.i * SEG})" text-anchor="middle" dominant-baseline="central" font-size="8.2" font-weight="800" fill="#fff" font-family="Bahnschrift, sans-serif">{s.n}</text>
					{/each}
					<path d={FRETS} stroke="#e6d39c" stroke-width="0.7" fill="none" />
					<circle r="90" fill="none" stroke="#e8c070" stroke-width="1.3" />
					<circle r="76" fill="none" stroke="#e8c070" stroke-width="0.8" />
					<circle r="62" fill="url(#{uid}-cone)" stroke="#e8c070" stroke-width="1.5" />
					<circle r="46" fill="none" stroke="#2a1004" stroke-opacity="0.55" stroke-width="5" />
					<circle r="44" fill="none" stroke="url(#{uid}-chrome)" stroke-width="1.6" />
					{#each TURRET as a (a)}
						<g transform="rotate({a})">
							<rect x="-1.7" y="-34" width="3.4" height="34" rx="1.7" fill="url(#{uid}-arm)" />
							<circle cy="-34" r="3.4" fill="url(#{uid}-chrome)" />
						</g>
					{/each}
					<circle r="9" fill="url(#{uid}-chrome)" stroke="#4d555c" stroke-width="0.8" />
					<circle r="3.2" fill="url(#{uid}-gold)" />
					{#if winPocket}<path class="rl-win-pocket" d={winPocket} fill="#ffe066" fill-opacity="0.18" stroke="#ffe066" stroke-width="1.8" />{/if}
				</g>
				<!-- speed smear over the numbers while the wheel is fast -->
				{#if blur > 0.01}<circle r="76" fill="none" stroke="#4a0d10" stroke-width="28" opacity={blur} />{/if}
				<!-- the ball and the light streak behind it -->
				{#if tail.length}
					<g class="rl-tail" fill="none" stroke="#fff6dc" stroke-linecap="round">
						{#each tail as s, i (i)}<path d={s.d} stroke-width={s.w} opacity={s.o} />{/each}
					</g>
				{/if}
				{#if ball}
					<circle cx={ball.x + 0.9} cy={ball.y + 1.4} r="4.3" fill="#000" opacity="0.4" />
					<circle class="rl-ballpt" cx={ball.x} cy={ball.y} r="4.3" fill="url(#{uid}-ball)" stroke="#8a9096" stroke-width="0.4" />
				{/if}
				<!-- the marker over the winning pocket -->
				<path d="M0 -102.5L-4.6 -111.5L4.6 -111.5Z" fill="url(#{uid}-gold)" stroke="#5a2a00" stroke-width="1" />
				<!-- the result in the middle once it lands -->
				{#if result !== null && !spinning}
					{#key history.length}
						<g class="rl-medal">
							<circle r="21" fill={FACE[colorOf(result)]} stroke="#ffd23a" stroke-width="2.6" />
							<circle r="17" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="0.8" />
							<text y="1" text-anchor="middle" dominant-baseline="central" font-size="19" font-weight="900" fill="#fff" font-family="Bahnschrift, sans-serif">{result}</text>
						</g>
					{/key}
				{/if}
			</svg>
			{#if callout}<span class="rl-call font-head" aria-hidden="true">{r.noMoreBets}</span>{/if}
			{#if show}
				{#key show.key}
					<div class="rl-burst" class:big={show.big} aria-hidden="true">
						{#each SPARKS.slice(0, show.big ? 22 : 14) as s, i (i)}
							<i data-kind={s.kind} style:--a="{s.a}deg" style:--d="{show.big ? s.d + 20 : s.d}px"></i>
						{/each}
					</div>
					<span class="rl-float font-head num" aria-hidden="true">
						{#if show.straight || show.big}<small>{show.straight ? r.straightUp : r.bigWin}</small>{/if}
						+{show.win.toLocaleString('en-US')} 🍔
					</span>
				{/key}
			{/if}
		</div>
		<div class="rl-side">
			<p class="rl-result font-head" aria-live="polite">
				{#if spinning}…{:else if result !== null}
					<span class="rl-ball num" data-color={colorOf(result)}>{result}</span>
					<span>{net! > 0 ? r.won(net!) : net! < 0 ? r.lost(-net!) : r.even}</span>
				{/if}
			</p>
			{#if history.length}
				<p class="mt-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{r.history}</p>
				<p class="mt-1 flex flex-wrap gap-1">
					{#each history as h, i (i)}<span class="rl-hist num" data-color={colorOf(h)}>{h}</span>{/each}
				</p>
			{/if}
			<!-- chips -->
			<div class="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={r.chip}>
				{#each CHIPS as c (c)}
					<button type="button" class="rl-pick num font-head" aria-pressed={!allIn && chip === c} aria-label={c.toLocaleString('en-US')} disabled={c > free && (allIn || chip !== c)} onclick={() => ((chip = c), (allIn = false))}>{short(c)}</button>
				{/each}
				<button type="button" class="rl-pick rl-allin font-head" aria-pressed={allIn} disabled={free < 1 && !allIn} onclick={() => (allIn = true)}>{r.allIn}</button>
			</div>
			<form class="mt-2 flex items-center gap-1.5" onsubmit={(e) => (e.preventDefault(), useCustom())}>
				<input class="field rl-amount num" type="text" inputmode="decimal" autocomplete="off" placeholder={r.amountHint} aria-label={r.amountLabel} bind:value={custom} />
				<button type="submit" class="btn btn-sm">{r.amountUse}</button>
			</form>
			<p class="mt-1 text-xs text-muted">{allIn ? r.chipAllIn(free) : r.chipNow(chip, chip > free)}</p>
			<p class="mt-2 text-xs text-muted">{r.onTable(onTable)}</p>
			<div class="mt-2 flex flex-wrap gap-2">
				<button type="button" class="btn" disabled={spinning || !onTable} onclick={() => (bets = {})}>{r.clear}</button>
				<button type="button" class="btn btn-primary" disabled={spinning || !onTable} onclick={() => void spin()}>{r.spin}</button>
			</div>
		</div>
	</div>

	<!-- the table -->
	<div class="rl-board-wrap">
		<div class="rl-board">
			<button type="button" class="rl-cell rl-zero num" data-color="green" class:hit={winning('n0')} aria-label={r.spotLabel('0', bets.n0 ?? 0)} onclick={() => place('n0')}>0{@render stake('n0')}</button>
			{#each NUMS as x (x.n)}
				<button
					type="button"
					class="rl-cell rl-num num"
					data-color={colorOf(x.n)}
					class:hit={winning(`n${x.n}`)}
					style:--c={x.c}
					style:--r={x.r}
					style:--pc={x.pc}
					style:--pr={x.pr}
					aria-label={r.spotLabel(String(x.n), bets[`n${x.n}`] ?? 0)}
					onclick={() => place(`n${x.n}`)}>{x.n}{@render stake(`n${x.n}`)}</button
				>
			{/each}
			{#each COLS as col (col.spot)}
				<button type="button" class="rl-cell rl-col font-head" class:hit={winning(col.spot)} style:--r={col.r} style:--pc={col.pc} aria-label={r.spotLabel(spotName(col.spot), bets[col.spot] ?? 0)} onclick={() => place(col.spot)}
					>2:1{@render stake(col.spot)}</button
				>
			{/each}
		</div>
		<div class="rl-outside">
			{#each OUTSIDE as spot (spot)}
				<button type="button" class="rl-cell rl-out font-head" data-spot={spot} class:hit={winning(spot)} aria-label={r.spotLabel(spotName(spot), bets[spot] ?? 0)} onclick={() => place(spot)}
					>{r.spots[spot]}{@render stake(spot)}</button
				>
			{/each}
		</div>
	</div>
	<details class="mt-3 text-xs text-muted">
		<summary class="min-h-11 cursor-pointer content-center font-semibold">{t.casino.how}</summary>
		<p class="pb-1">{r.how}</p>
	</details>
</div>

<style>
	.rl {
		container-type: inline-size;
	}
	.rl-top {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 14px;
		align-items: center;
	}
	@container (min-width: 560px) {
		.rl-top {
			grid-template-columns: 240px minmax(0, 1fr);
		}
	}
	.rl-wheel-wrap {
		position: relative;
		justify-self: center;
		width: min(240px, 80cqi);
		transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.rl-wheel-wrap.spinning {
		transform: scale(1.04);
	}
	.rl-wheel {
		display: block;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.5));
		transition: filter 0.45s;
	}
	.rl-wheel-wrap.spinning .rl-wheel {
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.5)) drop-shadow(0 0 16px rgb(255 200 60 / 0.45));
	}
	.rl-rotor {
		transform-origin: 0 0;
	}
	/* the winning pocket blinks a few times, then stays lit */
	.rl-win-pocket {
		filter: drop-shadow(0 0 3px #ffd23a);
		animation: rl-pocket 0.42s ease-in-out 6 alternate;
	}
	@keyframes rl-pocket {
		from {
			fill-opacity: 0.05;
			stroke-opacity: 0.4;
		}
		to {
			fill-opacity: 0.35;
			stroke-opacity: 1;
		}
	}
	.rl-medal {
		transform-box: fill-box;
		transform-origin: center;
		animation: rl-medal 0.55s cubic-bezier(0.3, 1.7, 0.5, 1) both;
	}
	@keyframes rl-medal {
		from {
			transform: scale(0);
		}
		to {
			transform: scale(1);
		}
	}
	/* the croupier's call while the ball runs */
	.rl-call {
		position: absolute;
		left: 50%;
		top: 66%;
		padding: 4px 12px;
		border: 2px solid #ffd23a;
		border-radius: 999px;
		background: rgb(20 8 2 / 0.86);
		color: #ffe066;
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
		pointer-events: none;
		box-shadow: 0 0 14px rgb(255 200 60 / 0.5);
		animation: rl-call 1.4s ease both;
	}
	@keyframes rl-call {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.6);
		}
		14% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.1);
		}
		24%,
		80% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -80%) scale(0.95);
		}
	}
	/* the win: sparkles out of the middle + the burgers floating up */
	.rl-burst {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.rl-burst i {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 9px;
		height: 9px;
		margin: -4.5px 0 0 -4.5px;
		background: radial-gradient(circle, #fff9c4 0 30%, #ffc928 60%, transparent 70%);
		clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%);
		animation: rl-spark 1.1s cubic-bezier(0.15, 0.7, 0.3, 1) both;
	}
	.rl-burst i[data-kind='1'] {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		clip-path: none;
		background: radial-gradient(circle, #fff 0 25%, #e2261f 30% 70%, #fff 72%);
	}
	.rl-burst i[data-kind='2'] {
		width: 6px;
		height: 6px;
		clip-path: none;
		border-radius: 999px;
		background: #ffe066;
		box-shadow: 0 0 6px #ffd23a;
	}
	.rl-burst.big i {
		animation-duration: 1.5s;
	}
	@keyframes rl-spark {
		0% {
			opacity: 0;
			transform: rotate(var(--a)) translateY(0) scale(0.4);
		}
		12% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: rotate(var(--a)) translateY(calc(var(--d) * -1)) scale(1.1);
		}
	}
	.rl-float {
		position: absolute;
		left: 50%;
		top: 30%;
		display: grid;
		justify-items: center;
		color: #ffe066;
		font-size: 22px;
		font-weight: 900;
		white-space: nowrap;
		text-shadow:
			0 2px 0 #5a2a00,
			0 0 12px rgb(255 190 40 / 0.8);
		pointer-events: none;
		animation: rl-float 2.4s ease-out both;
	}
	.rl-float small {
		font-size: 13px;
		letter-spacing: 0.1em;
		color: #fff;
	}
	@keyframes rl-float {
		0% {
			opacity: 0;
			transform: translate(-50%, 10px) scale(0.6);
		}
		12% {
			opacity: 1;
			transform: translate(-50%, 0) scale(1.12);
		}
		22% {
			transform: translate(-50%, 0) scale(1);
		}
		75% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -46px) scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rl-wheel-wrap,
		.rl-wheel-wrap.spinning {
			transform: none;
			transition: none;
		}
		.rl-win-pocket,
		.rl-medal {
			animation: none;
		}
		.rl-call,
		.rl-burst {
			display: none;
		}
		.rl-float {
			animation: none;
			transform: translate(-50%, 0);
		}
	}
	.rl-result {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		min-height: 44px;
		font-size: 16px;
		font-weight: 800;
	}
	.rl-ball,
	.rl-hist {
		display: inline-grid;
		place-items: center;
		border-radius: 999px;
		color: #fff;
		font-weight: 800;
	}
	.rl-ball {
		width: 44px;
		height: 44px;
		font-size: 20px;
		box-shadow: 0 0 0 3px #ffc928;
	}
	.rl-hist {
		width: 26px;
		height: 26px;
		font-size: 12px;
	}
	[data-color='red'] {
		background: #d2161e;
	}
	[data-color='black'] {
		background: #161616;
	}
	[data-color='green'] {
		background: #1f9a3a;
	}
	.rl-pick {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		border: 3px dashed #fff;
		background: radial-gradient(circle, #e2261f 55%, #8a0a10);
		color: #fff;
		font-size: 13px;
		font-weight: 900;
	}
	.rl-pick[aria-pressed='true'] {
		box-shadow: 0 0 0 3px #ffd23a, 0 0 12px #ffd23a;
	}
	.rl-pick:disabled {
		opacity: 0.4;
	}
	/* big chips: blue / purple / black / gold like a real high-limit rack */
	.rl-pick[aria-label='1,000'] {
		background: radial-gradient(circle, #2a6ae0 55%, #0f2f7a);
	}
	.rl-pick[aria-label='10,000'] {
		background: radial-gradient(circle, #8a3fd0 55%, #3d0f6e);
	}
	.rl-pick[aria-label='100,000'] {
		background: radial-gradient(circle, #2b2b2b 55%, #050505);
	}
	.rl-pick[aria-label='1,000,000'] {
		background: radial-gradient(circle, #ffd23a 55%, #a86d00);
		color: #3a2200;
	}
	.rl-allin {
		width: auto;
		padding: 0 12px;
		background: linear-gradient(180deg, #ffe066, #e09a00);
		color: #3a2200;
		border-color: #fff6c0;
	}
	.rl-amount {
		width: 11rem;
		max-width: 100%;
		min-height: 44px;
	}
	/* the table: felt green, numbers standing up on phones */
	.rl-board-wrap {
		margin-top: 14px;
		padding: 8px;
		border-radius: 12px;
		background: radial-gradient(120% 120% at 50% 0%, #1f7a3a, #0c4420);
		box-shadow: inset 0 0 0 3px #c9a050;
	}
	.rl-board {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 3px;
	}
	.rl-cell {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 44px;
		border-radius: 6px;
		color: #fff;
		font-weight: 800;
		box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / 0.55);
	}
	.rl-zero {
		grid-column: 1 / span 3;
		grid-row: 1;
	}
	.rl-num {
		grid-column: var(--pc);
		grid-row: var(--pr);
		font-size: 15px;
	}
	.rl-col {
		grid-column: var(--pc);
		grid-row: 14;
		background: rgb(0 0 0 / 0.25);
		font-size: 12px;
	}
	@container (min-width: 600px) {
		.rl-board {
			grid-template-columns: 1.2fr repeat(12, minmax(0, 1fr)) 1.2fr;
			grid-template-rows: repeat(3, 44px);
		}
		.rl-zero {
			grid-column: 1;
			grid-row: 1 / span 3;
		}
		.rl-num {
			grid-column: var(--c);
			grid-row: var(--r);
		}
		.rl-col {
			grid-column: 14;
			grid-row: var(--r);
		}
	}
	.rl-outside {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 3px;
		margin-top: 3px;
	}
	@container (min-width: 600px) {
		.rl-outside {
			grid-template-columns: repeat(6, minmax(0, 1fr));
		}
		.rl-out[data-spot^='d'] {
			grid-column: span 2;
		}
	}
	.rl-out {
		background: rgb(0 0 0 / 0.22);
		font-size: 12px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.rl-out[data-spot='red'] {
		background: #d2161e;
	}
	.rl-out[data-spot='black'] {
		background: #161616;
	}
	.rl-cell.hit {
		box-shadow: inset 0 0 0 3px #ffd23a, 0 0 12px #ffd23a;
		animation: rl-hit 0.42s ease-in-out 6 alternate;
	}
	@keyframes rl-hit {
		from {
			filter: brightness(1);
		}
		to {
			filter: brightness(1.45);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rl-cell.hit {
			animation: none;
		}
	}
	.rl-chip {
		position: absolute;
		top: 2px;
		right: 2px;
		min-width: 20px;
		height: 20px;
		padding: 0 4px;
		border: 2px dashed #fff;
		border-radius: 999px;
		background: #e2261f;
		color: #fff;
		font-size: 10px;
		line-height: 16px;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.6);
	}
</style>
