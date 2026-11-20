<!--
	Abscar's Fortune's logo (2026-11-20, the user: "rita nu en logga till alla andra kommande slots … även en rolig
	till abscars fortune!"). Our own drawing in the Burger Bandit's colours: "ABSCAR'S" in red candy letters arched
	over a big gold "FORTUNE" whose O is the machine's crowned gold WILD burger (SlotSymbol), Abscar peeking over
	the end of the word with his holk, burger coins and rays. Moves a little (rays turn, the word waves, the burger
	and coins bob, Abscar pops up now and then); the pause button and reduced motion stop it.
-->
<script lang="ts">
	import { layoutWord } from '#lib/logoGlyphs.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import LogoFig from './LogoFig.svelte';
	import LogoShell from './LogoShell.svelte';
	import LogoWord, { type WordStyle } from './LogoWord.svelte';
	import SlotSymbol from './SlotSymbol.svelte';

	let { label = 'Abscar’s Fortune', tile = false, live = true }: { label?: string; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -30, w: 640, h: 290 };

	const TOP: WordStyle = {
		stroke: 26,
		outline: 5,
		ink: '#2a0606',
		rim: 4,
		depth: 9,
		dx: 2,
		gloss: true,
		shadow: true,
		faces: [{ hi: '#ffb3a0', mid: '#f2382a', lo: '#9a0f16', side: '#5a0710', edge: '#7a0a12' }]
	};
	const BIG: WordStyle = {
		stroke: 28,
		outline: 5,
		ink: '#2a0606',
		rim: 4,
		depth: 11,
		dx: 2.5,
		gloss: true,
		shadow: true,
		faces: [
			{ hi: '#fffbe0', mid: '#ffd23a', lo: '#ff8a00', side: '#8a2a06', edge: '#a8400a' },
			{ hi: '#fff6c8', mid: '#ffc21a', lo: '#f07800', side: '#8a2a06', edge: '#a8400a' }
		]
	};
	const top = layoutWord("ABSCAR'S", { x: 34, y: 50, stroke: 26, scale: 0.6, arch: -10, tilts: [-4, 3, -2, 4, -3, 2, 0, 4] });
	const fortune = layoutWord('FORTUNE', { x: 42, y: 150, stroke: 28, arch: 10, tilts: [-4, 0, 3, -3, 4, -2, 5] });
	/** the O is the WILD burger */
	const O = fortune.find((p) => p.ch === 'O')!;
	const letters = fortune.filter((p) => p !== O);

	const RAYS = Array.from({ length: 16 }, (_, i) => {
		const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 0.5) / 16) * Math.PI * 2, R = 420;
		return `M0 0 L${(Math.cos(a0) * R).toFixed(1)} ${(Math.sin(a0) * R).toFixed(1)} L${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)} Z`;
	});
	const COINS = [
		{ x: 452, y: 70, s: 1, d: 0 },
		{ x: 18, y: 232, s: 0.8, d: -1.2 },
		{ x: 616, y: 236, s: 0.9, d: -2.1 }
	];
	const SPARKS = [
		{ x: 420, y: 28, s: 0.9, d: 0 },
		{ x: 22, y: 134, s: 0.7, d: -0.8 },
		{ x: 248, y: 118, s: 0.6, d: -1.6 }
	];
	const STAR = 'M0 -12 C1.5 -3 3 -1.5 12 0 C3 1.5 1.5 3 0 12 C-1.5 3 -3 1.5 -12 0 C-3 -1.5 -1.5 -3 0 -12 Z';
</script>

<LogoShell w={VB.w} h={VB.h} {label} {tile} {live}>
	<!-- behind: red and gold rays -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('fade')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" /><stop offset=".55" stop-color="#fff" stop-opacity=".5" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
			<mask id={u('rm')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><ellipse cx="320" cy="140" rx="330" ry="150" fill="url(#{u('fade')})" /></mask>
		</defs>
		<g mask="url(#{u('rm')})">
			<g transform="translate(320 140)"><g class="fl-rays">{#each RAYS as d, i (i)}<path {d} fill={i % 2 ? '#ffc928' : '#ff3b2e'} opacity={i % 2 ? 0.13 : 0.16} />{/each}</g></g>
		</g>
	</svg>

	<!-- Abscar behind the end of FORTUNE -->
	<LogoFig box={VB} x={482} y={22} size={118} r={6} delay={-1.5} move="peek"><AbscarOperator variant="ghillie" smoke={0.7} /></LogoFig>

	<!-- the words -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<LogoWord letters={top} style={TOP} />
		<LogoWord {letters} style={BIG} anim="wave" />
	</svg>

	<!-- in front: the WILD burger as the O, coins, sparkles -->
	<LogoFig box={VB} x={O.x + 30 - 64} y={O.y + 40 - 72} size={128} r={-6} delay={-0.6} move="bob"><SlotSymbol symbol="wild" size={128} /></LogoFig>
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('coin')} cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></radialGradient>
		</defs>
		{#each COINS as c, i (i)}
			<g transform="translate({c.x} {c.y}) scale({c.s})">
				<g class="fl-coin" style:--d="{c.d}s">
					<circle r="15" fill="url(#{u('coin')})" stroke="#5a2a00" stroke-width="2.2" />
					<circle r="10.5" fill="none" stroke="#fff3b0" stroke-width="1.2" opacity=".7" />
					<path d="M-6 0 Q-6 -6 0 -6 Q6 -6 6 0 Z" fill="#c97a1f" stroke="#5a2a00" stroke-width="1.2" />
					<rect x="-6.5" y="0.6" width="13" height="2.2" rx="1" fill="#6b3a1c" />
					<path d="M-6 3.6 H6 Q6 6.4 3 6.4 H-3 Q-6 6.4 -6 3.6 Z" fill="#c97a1f" stroke="#5a2a00" stroke-width="1.2" />
				</g>
			</g>
		{/each}
		{#each SPARKS as sp, i (i)}
			<g transform="translate({sp.x} {sp.y}) scale({sp.s})"><path class="fl-spark" style:--d="{sp.d}s" d={STAR} fill="#fffbe0" /></g>
		{/each}
	</svg>
</LogoShell>

<style>
	.fl-rays {
		animation: fl-turn 60s linear infinite;
	}
	@keyframes fl-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.fl-coin {
		animation: fl-coin 3s var(--d) ease-in-out infinite;
	}
	@keyframes fl-coin {
		0%,
		100% {
			translate: 0 0;
			rotate: -8deg;
		}
		50% {
			translate: 0 -6px;
			rotate: 10deg;
		}
	}
	.fl-spark {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: fl-twinkle 2.4s var(--d) ease-in-out infinite;
	}
	@keyframes fl-twinkle {
		0%,
		100% {
			opacity: 0;
			scale: 0.4;
		}
		50% {
			opacity: 1;
			scale: 1;
		}
	}
</style>
