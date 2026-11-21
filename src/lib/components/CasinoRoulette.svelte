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
	let rotation = $state(0);
	let spinMs = $state(0);

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
	const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

	async function spin() {
		if (spinning || onTable < 1) return;
		// Abscar's control room (casino-rig.ts): the number he picked for this spin, or your luck
		const forced = squad.takeForced('roulette');
		const n = forced ? forced.what : lucky(squad.luck('roulette'), rand, () => spinNumber(rand), (x) => rouletteNet(bets, x));
		const won = rouletteNet(bets, n);
		squad.recordGame(won);
		unrevealed = won;
		spinning = true;
		result = null;
		net = null;
		const k = WHEEL.indexOf(n as (typeof WHEEL)[number]);
		const want = (((-k * SEG) % 360) + 360) % 360;
		const base = rotation - (((rotation % 360) + 360) % 360);
		spinMs = reduce() ? 0 : 4200;
		rotation = base + 360 * 5 + want;
		await sleep(spinMs + 120);
		result = n;
		net = won;
		unrevealed = 0;
		history = [n, ...history].slice(0, 12);
		spinning = false;
		if (won > 0) sound.play(won >= 100 ? 'maxed' : 'camo');
		const straight = Object.keys(bets).some((s) => s === `n${n}`);
		if (Math.abs(won) >= 100 || (straight && won > 0)) squad.casinoNews(t.casino.event.roulette(won, n, r.colors[colorOf(n)]));
	}

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
		<div class="rl-wheel-wrap">
			<svg class="rl-wheel" viewBox="-110 -110 220 220" role="img" aria-label={result !== null ? `${r.wheel}: ${r.result(result, r.colors[colorOf(result)])}` : r.wheel}>
				<circle r="108" fill="#5a2a10" stroke="#ffc928" stroke-width="4" />
				<g style:transform="rotate({rotation}deg)" style:transition={spinMs ? `transform ${spinMs}ms cubic-bezier(0.12, 0.75, 0.22, 1)` : 'none'}>
					{#each WHEEL as n, i (n)}
						{@const a0 = ((i - 0.5) * SEG - 90) * (Math.PI / 180)}
						{@const a1 = ((i + 0.5) * SEG - 90) * (Math.PI / 180)}
						<path
							d="M{Math.cos(a0) * 100} {Math.sin(a0) * 100} A100 100 0 0 1 {Math.cos(a1) * 100} {Math.sin(a1) * 100} L{Math.cos(a1) * 66} {Math.sin(a1) * 66} A66 66 0 0 0 {Math.cos(a0) * 66} {Math.sin(a0) * 66} Z"
							fill={colorOf(n) === 'red' ? '#d2161e' : colorOf(n) === 'black' ? '#141414' : '#1f9a3a'}
							stroke="#e8c070"
							stroke-width="0.8"
						/>
						<text x="0" y="-86" transform="rotate({i * SEG})" text-anchor="middle" dominant-baseline="middle" font-size="9.5" font-weight="800" fill="#fff" font-family="Bahnschrift, sans-serif">{n}</text>
					{/each}
					<circle r="66" fill="#3d1a08" stroke="#e8c070" stroke-width="1.5" />
					{#each Array.from({ length: 8 }) as _, i (i)}
						<path d="M0 0 L0 -58" stroke="#c9a050" stroke-width="3" transform="rotate({i * 45})" stroke-linecap="round" />
					{/each}
					<circle r="16" fill="url(#rl-hub)" stroke="#5a3200" stroke-width="2" />
				</g>
				<defs><radialGradient id="rl-hub" cx="35%" cy="30%"><stop offset="0" stop-color="#fff6b0" /><stop offset="1" stop-color="#b86e00" /></radialGradient></defs>
				<!-- the pointer and, once it stops, the ball in the top pocket -->
				<path d="M0 -96 L-7 -110 L7 -110 Z" fill="#ffd23a" stroke="#5a2a00" stroke-width="1.5" />
				{#if result !== null && !spinning}<circle cx="0" cy="-74" r="5" fill="#fff" stroke="#888" stroke-width="1" />{/if}
			</svg>
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
		justify-self: center;
		width: min(240px, 80cqi);
	}
	.rl-wheel {
		display: block;
		width: 100%;
		height: auto;
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.5));
	}
	.rl-wheel g {
		transform-origin: 0 0;
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
