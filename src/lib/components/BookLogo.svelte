<!--
	Book Of Skedd's logo (2026-11-20, with the other machines' logos). Our own drawing: the machine's own green
	leather book with its gold leaf (BookSymbol) standing in a glow of green and gold rays, Abscar's cyborg skull
	(the game's top symbol) peeking out behind it, "BOOK OF" and a big "SKEDD" in carved gold letters with dark
	green sides, gold leaves floating round. Moves a little; the pause button and reduced motion stop it.
-->
<script lang="ts">
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { layoutWord, wordWidth } from '#lib/logoGlyphs.ts';
	import BookSymbol from './BookSymbol.svelte';
	import LogoFig from './LogoFig.svelte';
	import LogoShell from './LogoShell.svelte';
	import LogoWord, { type WordStyle } from './LogoWord.svelte';

	let { label = 'Book Of Skedd', tile = false, live = true }: { label?: string; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -30, w: 640, h: 296 };

	const GOLD = { hi: '#fff8d6', mid: '#f0c24a', lo: '#9a6410', side: '#0b3a1c', edge: '#14522a' };
	const STYLE: WordStyle = { stroke: 24, caps: 'square', joins: 'bevel', outline: 4.5, ink: '#061a0c', rim: 3.5, rimColour: '#b8ffd0', depth: 9, dx: 2, gloss: true, shadow: true, faces: [GOLD] };
	const centre = (word: string, scale: number) => (640 - wordWidth(word, { stroke: 24, scale })) / 2;
	const top = layoutWord('BOOK OF', { x: centre('BOOK OF', 0.64), y: 60, stroke: 24, scale: 0.64, tilts: [-2, 2, -1, 3, 0, -3, 2] });
	const skedd = layoutWord('SKEDD', { x: centre('SKEDD', 1.04), y: 150, stroke: 24, scale: 1.04, arch: 8, tilts: [-4, 3, -2, 4, -3] });

	const RAYS = Array.from({ length: 20 }, (_, i) => {
		const a0 = (i / 20) * Math.PI * 2, a1 = ((i + 0.45) / 20) * Math.PI * 2, R = 420;
		return `M0 0 L${(Math.cos(a0) * R).toFixed(1)} ${(Math.sin(a0) * R).toFixed(1)} L${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)} Z`;
	});
	const LEAVES = [
		{ x: 40, y: 70, s: 2.2, r: -24, d: 0 },
		{ x: 586, y: 54, s: 1.8, r: 28, d: -1.4 },
		{ x: 70, y: 214, s: 1.5, r: 18, d: -2.3 },
		{ x: 566, y: 218, s: 2, r: -16, d: -0.7 }
	];
</script>

<LogoShell w={VB.w} h={VB.h} {label} {tile} {live}>
	<!-- behind: green and gold rays from the book, a gold glow -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('fade')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" /><stop offset=".5" stop-color="#fff" stop-opacity=".55" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
			<mask id={u('rm')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><ellipse cx="320" cy="110" rx="330" ry="160" fill="url(#{u('fade')})" /></mask>
			<radialGradient id={u('glow')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe27a" stop-opacity=".6" /><stop offset=".5" stop-color="#4ff09a" stop-opacity=".22" /><stop offset="1" stop-color="#4ff09a" stop-opacity="0" /></radialGradient>
		</defs>
		<g mask="url(#{u('rm')})">
			<g transform="translate(320 100)"><g class="bl-rays">{#each RAYS as d, i (i)}<path {d} fill={i % 2 ? '#ffd23a' : '#4ff09a'} opacity={i % 2 ? 0.14 : 0.12} />{/each}</g></g>
		</g>
		<ellipse class="bl-glow" cx="320" cy="100" rx="190" ry="140" fill="url(#{u('glow')})" />
	</svg>

	<!-- Abscar's skull peeking out behind the book, then the book -->
	<LogoFig box={VB} x={352} y={-34} size={118} r={14} delay={-2} move="peek"><BookSymbol symbol="abscar" size={118} /></LogoFig>
	<LogoFig box={VB} x={212} y={-28} size={216} r={-5} delay={-0.4} move="bob"><BookSymbol symbol="book" size={216} /></LogoFig>

	<!-- the words, and gold leaves -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id={u('leaf')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0" /><stop offset=".5" stop-color="#f0c24a" /><stop offset="1" stop-color="#a86a10" /></linearGradient>
		</defs>
		<LogoWord letters={top} style={STYLE} />
		<LogoWord letters={skedd} style={STYLE} anim="wave" />
		{#each LEAVES as l, i (i)}
			<g transform="translate({l.x} {l.y}) rotate({l.r}) scale({l.s}) translate(-12 -14)">
				<g class="bl-leaf" style:--d="{l.d}s">
					<g fill="url(#{u('leaf')})" stroke="#5a3a06" stroke-width=".7" stroke-linejoin="round">{#each LEAF_PATHS as d, k (k)}<path {d} />{/each}</g>
					<path d={LEAF_STEM} stroke="#5a3a06" stroke-width="1.2" stroke-linecap="round" />
				</g>
			</g>
		{/each}
	</svg>
</LogoShell>

<style>
	.bl-rays {
		animation: bl-turn 70s linear infinite;
	}
	@keyframes bl-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.bl-glow {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: bl-breathe 3.6s ease-in-out infinite;
	}
	@keyframes bl-breathe {
		50% {
			opacity: 0.6;
			transform: scale(0.92);
		}
	}
	.bl-leaf {
		transform-box: fill-box;
		transform-origin: 50% 90%;
		animation: bl-float 4s var(--d) ease-in-out infinite;
	}
	@keyframes bl-float {
		0%,
		100% {
			translate: 0 0;
			rotate: 0deg;
		}
		50% {
			translate: 0 -2px;
			rotate: 8deg;
		}
	}
</style>
