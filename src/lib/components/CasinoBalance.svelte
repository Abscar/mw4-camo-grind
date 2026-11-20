<!--
	BurgiCasino's balance pill (2026-11-20, the user: "lots of dopamine"): your burgers on a gold-rimmed
	LED pill with a spinning burger coin. When the number goes up it counts up to the new value, a little
	fountain of burger coins spills out of the coin and "+n" floats up; a big gain (casinoFloor.ts gainFx)
	also calls onbig, which rains confetti over the screen. Going down (a bet) is shown at once.
	The real number sits in the (visually hidden) <b>, which the polite live region reads once; the
	counting copy beside it is hidden from screen readers so they don't hear every step.
	Nothing moves with reduced motion, and nothing bursts while a game switch or the page's first
	seconds settle the number (snapKey changes, or under 2.5 s since it appeared).
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { gainFx } from '#lib/casinoFloor.ts';
	import FloorArt from './FloorArt.svelte';

	let { value, snapKey = '', onbig }: { value: number; snapKey?: string; onbig?: (gain: number) => void } = $props();
	const c = t.casino;

	interface Coin {
		dx: number;
		up: number;
		down: number;
		r: number;
		d: number;
		s: number;
	}
	interface Burst {
		id: number;
		gain: number;
		coins: Coin[];
	}

	let display = $state(untrack(() => value));
	let bursts = $state<Burst[]>([]);
	let bump = $state(0);
	let last = untrack(() => value);
	let lastKey = untrack(() => snapKey);
	let seen = untrack(() => value) > 0;
	let raf = 0;
	let nextId = 1;
	const born = typeof performance === 'undefined' ? 0 : performance.now();
	const reduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	$effect(() => {
		const v = value;
		const k = snapKey;
		untrack(() => change(v, k));
	});
	$effect(() => () => cancelAnimationFrame(raf));

	function change(v: number, k: string) {
		const before = last;
		last = v;
		const switched = k !== lastKey;
		lastKey = k;
		if (v === before) return;
		cancelAnimationFrame(raf);
		const first = !seen;
		if (v > 0) seen = true;
		if (v < before || switched || reduce()) {
			display = v;
			return;
		}
		countUp(display, v);
		if (first || performance.now() - born < 2500) return;
		const fx = gainFx(v - before, before);
		burst(v - before, fx.coins);
		if (fx.confetti) onbig?.(v - before);
	}

	/** Count from a to b, faster for small gains, ease-out. */
	function countUp(a: number, b: number) {
		const ms = Math.min(1400, 500 + Math.log10(Math.max(10, b - a)) * 160);
		const t0 = performance.now();
		const frame = (now: number) => {
			const p = Math.min(1, (now - t0) / ms);
			const e = 1 - (1 - p) ** 3;
			display = Math.round(a + (b - a) * e);
			if (p < 1) raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
	}

	function burst(gain: number, n: number) {
		bump++;
		const id = nextId++;
		const coins = Array.from({ length: n }, (_, i): Coin => {
			const spread = n > 1 ? i / (n - 1) : 0.5;
			return {
				// fan out mostly to the left (the pill sits at the right edge), never far right
				dx: Math.round(-78 + spread * 96 + (Math.random() - 0.5) * 14),
				up: Math.round(28 + Math.random() * 30),
				down: Math.round(34 + Math.random() * 40),
				r: Math.round((Math.random() - 0.5) * 540),
				d: Math.round(Math.random() * 180),
				s: 0.7 + Math.random() * 0.45
			};
		});
		bursts = [...bursts, { id, gain, coins }];
		setTimeout(() => (bursts = bursts.filter((b) => b.id !== id)), 1700);
	}
</script>

<p class="casino-bal font-head" aria-live="polite">
	<span class="bal-coin" aria-hidden="true">
		{#key bump}<span class="bal-coin-spin" class:hit={bump > 0}><FloorArt kind="coin" size={34} /></span>{/key}
	</span>
	<span class="bal-text">
		<span class="bal-label">{c.balance}</span>
		<b class="num sr-only">{c.burgers(value)}</b>
		<span class="bal-num num" aria-hidden="true">{display.toLocaleString('en-US')}</span>
	</span>
	{#each bursts as b (b.id)}
		<span class="bal-burst" aria-hidden="true">
			<span class="bal-plus num">{t.casino.floor.gain(b.gain)}</span>
			{#each b.coins as k, i (i)}
				<span class="bal-fly" style:--dx="{k.dx}px" style:--up="{-k.up}px" style:--down="{k.down}px" style:--r="{k.r}deg" style:--d="{k.d}ms" style:--s={k.s}>
					<FloorArt kind="coin" size={18} />
				</span>
			{/each}
		</span>
	{/each}
</p>

<style>
	.casino-bal {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 52px;
		padding: 5px 16px 5px 7px;
		border-radius: 999px;
		background:
			radial-gradient(120% 140% at 30% 0%, rgb(255 255 255 / 0.12), transparent 55%),
			linear-gradient(180deg, #1c0614, #0c0209);
		box-shadow:
			inset 0 0 0 2px #ffc928,
			inset 0 0 0 4px rgb(90 30 0 / 0.9),
			inset 0 0 14px rgb(255 160 0 / 0.25),
			0 0 16px rgb(255 190 40 / 0.35),
			0 3px 8px rgb(0 0 0 / 0.5);
		color: #fff3dc;
	}
	.bal-coin {
		position: relative;
		flex: none;
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		perspective: 120px;
	}
	/* the coin turns round now and then (and once more on every gain) */
	.bal-coin-spin {
		display: block;
		animation: coin-turn 6s ease-in-out infinite;
		filter: drop-shadow(0 0 6px rgb(255 200 60 / 0.6));
	}
	.bal-coin-spin.hit {
		animation:
			coin-hit 0.8s ease-out,
			coin-turn 6s ease-in-out 0.8s infinite;
	}
	@keyframes coin-turn {
		0%,
		78% {
			transform: rotateY(0deg);
		}
		92%,
		100% {
			transform: rotateY(360deg);
		}
	}
	@keyframes coin-hit {
		0% {
			transform: scale(1) rotateY(0deg);
		}
		35% {
			transform: scale(1.3) rotateY(180deg);
		}
		100% {
			transform: scale(1) rotateY(360deg);
		}
	}
	.bal-text {
		display: grid;
		line-height: 1.05;
	}
	.bal-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #e8c98a;
	}
	.bal-num {
		font-size: 23px;
		font-weight: 900;
		letter-spacing: 0.02em;
		color: #ffe27a;
		text-shadow:
			0 0 8px rgb(255 190 40 / 0.65),
			0 1px 0 rgb(0 0 0 / 0.8);
	}
	/* the coin fountain and the floating "+n" */
	.bal-burst {
		position: absolute;
		left: 26px;
		top: 50%;
		width: 0;
		height: 0;
		pointer-events: none;
	}
	.bal-plus {
		position: absolute;
		left: 34px;
		top: -26px;
		white-space: nowrap;
		font-size: 17px;
		font-weight: 900;
		color: #7dff6a;
		text-shadow:
			0 0 8px rgb(125 255 106 / 0.7),
			0 1px 0 #000;
		animation: plus-up 1.5s ease-out forwards;
	}
	@keyframes plus-up {
		0% {
			opacity: 0;
			transform: translateY(8px) scale(0.8);
		}
		15% {
			opacity: 1;
			transform: translateY(0) scale(1.08);
		}
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-22px) scale(1);
		}
	}
	.bal-fly {
		position: absolute;
		left: -9px;
		top: -9px;
		opacity: 0;
		animation: coin-fly 1.25s cubic-bezier(0.3, 0.7, 0.5, 1) var(--d) forwards;
	}
	@keyframes coin-fly {
		0% {
			opacity: 1;
			transform: translate(0, 0) scale(calc(var(--s) * 0.6)) rotate(0deg);
		}
		40% {
			opacity: 1;
			transform: translate(calc(var(--dx) * 0.6), var(--up)) scale(var(--s)) rotate(calc(var(--r) * 0.5));
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), var(--down)) scale(var(--s)) rotate(var(--r));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bal-coin-spin,
		.bal-coin-spin.hit {
			animation: none;
		}
		.bal-burst {
			display: none;
		}
	}
	@media (max-width: 420px) {
		.bal-num {
			font-size: 20px;
		}
	}
</style>
