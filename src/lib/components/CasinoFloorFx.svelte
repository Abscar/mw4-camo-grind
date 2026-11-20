<!--
	The casino floor behind BurgiCasino's tab (2026-11-20, the user: "lots of dopamine and fun things on the
	screen"): coloured light pools that slowly swell over the carpet, casino chips, burger coins, dice and
	cards lying about that bob and turn a little, and on wide screens two neon signs on the wall beside the
	machines (a burger, "OPEN 24/7", the four card suits). It sits behind everything (z-index −1 inside
	CasinoSection's own stacking context), taps go through, it's decorative, and every prop stays inside the box.
	Seeded, so the props lie in the same places on every visit. Light on the CPU: only transforms and
	opacity move. Endless animations: the page's pause button stops them; off with reduced motion.
-->
<script lang="ts">
	import { seeded } from '#lib/casinoFloor.ts';
	import FloorArt, { type FloorProp } from './FloorArt.svelte';

	/** The neon signs only beside the machines and tables (they'd shine through the text panels of the
	 *  bank, donations and control room). */
	let { neon = false }: { neon?: boolean } = $props();

	const CHIPS = ['#d8263a', '#1f6fd8', '#1f9a4a', '#7a2fc8', '#111111', '#e07a10'];
	const KINDS: FloorProp[] = ['chip', 'coin', 'chip', 'dice', 'chip', 'card', 'coin', 'chip', 'chip', 'coin', 'dice', 'chip'];
	const rand = seeded(420);
	/** Twelve props spread over the box: x and y as shares of the free space, a size, a tilt and a pace. */
	const PROPS = KINDS.map((kind, i) => ({
		kind,
		x: (i % 4) / 4 + rand() * 0.22,
		y: Math.floor(i / 4) / 3 + 0.04 + rand() * 0.24,
		size: Math.round(26 + rand() * 18),
		tilt: Math.round((rand() - 0.5) * 50),
		dur: (7 + rand() * 6).toFixed(1),
		delay: (-rand() * 8).toFixed(1),
		tint: CHIPS[i % CHIPS.length],
		phone: i % 2 === 0
	}));
</script>

<div class="floor-fx" aria-hidden="true">
	<span class="pool p1"></span>
	<span class="pool p2"></span>
	<span class="pool p3"></span>
	<!-- neon signs on the wall beside the games (wide screens: there's room next to the machines) -->
	{#if neon}
	<svg class="neon n1" viewBox="0 0 200 190" focusable="false">
		<path class="nl pink" d="M38 84 Q38 34 100 34 Q162 34 162 84 Z" />
		<path class="nl pink thin" d="M70 56 l4 -3 M98 48 l4 -2 M126 56 l4 -3" />
		<path class="nl lime" d="M30 96 l14 10 l14 -10 l14 10 l14 -10 l14 10 l14 -10 l14 10 l14 -10 l14 10 l14 -10 l12 9" />
		<rect class="nl amber" x="36" y="114" width="128" height="20" rx="10" />
		<path class="nl pink" d="M40 146 H160 Q160 168 136 168 H64 Q40 168 40 146 Z" />
		<text class="nt cyan" x="100" y="22" text-anchor="middle">OPEN 24/7</text>
	</svg>
	<svg class="neon n2" viewBox="0 0 260 70" focusable="false">
		<path class="nl white" d="M30 10 C30 22 8 30 8 44 a10 10 0 0 0 18 6 l-4 12 h16 l-4 -12 a10 10 0 0 0 18 -6 C52 30 30 22 30 10 Z" />
		<path class="nl pink" d="M95 60 C76 46 70 36 70 28 a12 12 0 0 1 25 -4 a12 12 0 0 1 25 4 c0 8 -6 18 -25 32 Z" />
		<path class="nl pink" d="M165 8 L184 34 L165 60 L146 34 Z" />
		<circle class="nl white" cx="230" cy="20" r="10" />
		<circle class="nl white" cx="217" cy="40" r="10" />
		<circle class="nl white" cx="243" cy="40" r="10" />
		<path class="nl white" d="M230 44 l-5 18 h10 z" />
	</svg>
	{/if}
	{#each PROPS as p, i (i)}
		<span class="prop" class:wide-only={!p.phone} style:--x={p.x} style:--y={p.y} style:--tilt="{p.tilt}deg" style:--dur="{p.dur}s" style:--delay="{p.delay}s">
			<FloorArt kind={p.kind} size={p.size} tint={p.tint} />
		</span>
	{/each}
</div>

<style>
	.floor-fx {
		position: absolute;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		pointer-events: none;
	}
	/* big soft lights in casino colours that slowly swell and fade (kept inside the box: no moving) */
	.pool {
		position: absolute;
		width: 60%;
		aspect-ratio: 1;
		border-radius: 50%;
		animation: pool-breathe 13s ease-in-out infinite alternate;
	}
	.p1 {
		left: 0;
		top: 2%;
		background: radial-gradient(closest-side, rgb(255 60 160 / 0.22), transparent);
	}
	.p2 {
		right: 0;
		top: 28%;
		background: radial-gradient(closest-side, rgb(45 226 230 / 0.15), transparent);
		animation-delay: -6s;
	}
	.p3 {
		left: 20%;
		bottom: 0;
		background: radial-gradient(closest-side, rgb(255 201 40 / 0.15), transparent);
		animation-delay: -10s;
	}
	@keyframes pool-breathe {
		from {
			opacity: 0.45;
		}
		to {
			opacity: 1;
		}
	}
	/* props lying about: inside the box with room for their tilt and bob */
	.prop {
		position: absolute;
		left: calc(14px + (100% - 76px) * var(--x));
		top: calc(30px + (100% - 90px) * var(--y));
		opacity: 0.38;
		transform: rotate(var(--tilt));
		animation: prop-bob var(--dur) ease-in-out var(--delay) infinite alternate;
		filter: drop-shadow(0 4px 4px rgb(0 0 0 / 0.5));
	}
	@keyframes prop-bob {
		from {
			transform: translateY(0) rotate(var(--tilt));
		}
		to {
			transform: translateY(-10px) rotate(calc(var(--tilt) + 14deg));
		}
	}
	/* neon tubes: a bright core with a soft glow, humming a little (slow, never a flash) */
	.neon {
		position: absolute;
		display: none;
		overflow: visible;
		opacity: 0.6;
		animation: neon-hum 6s ease-in-out infinite alternate;
	}
	@media (min-width: 1024px) {
		.neon {
			display: block;
		}
	}
	.n1 {
		right: 7%;
		top: 600px;
		width: 210px;
	}
	.n2 {
		right: 9%;
		top: 900px;
		width: 230px;
		animation-delay: -3s;
	}
	.nl {
		fill: none;
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.nl.thin {
		stroke-width: 3;
	}
	.nt {
		font-family: var(--t-font-head);
		font-size: 19px;
		font-weight: 800;
		letter-spacing: 0.14em;
	}
	.pink {
		stroke: #ffb3dc;
		filter: drop-shadow(0 0 3px #ff3e9a) drop-shadow(0 0 9px #ff3e9a);
	}
	.lime {
		stroke: #d4ffc8;
		filter: drop-shadow(0 0 3px #3ee06a) drop-shadow(0 0 9px #3ee06a);
	}
	.amber {
		stroke: #ffe7a6;
		filter: drop-shadow(0 0 3px #ffb000) drop-shadow(0 0 9px #ffb000);
	}
	.white {
		stroke: #ffffff;
		filter: drop-shadow(0 0 3px #b9a6ff) drop-shadow(0 0 9px #8f6bff);
	}
	.cyan {
		fill: #d8fbff;
		filter: drop-shadow(0 0 3px #2de2e6) drop-shadow(0 0 9px #2de2e6);
	}
	@keyframes neon-hum {
		from {
			opacity: 0.45;
		}
		to {
			opacity: 0.7;
		}
	}
	@media (max-width: 639px) {
		.prop.wide-only {
			display: none;
		}
		.prop {
			opacity: 0.3;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pool,
		.prop,
		.neon {
			animation: none;
		}
	}
</style>
