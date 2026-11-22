<!--
	A BurgiArcade game's sign (2026-11-22, the user: "se till att loggorna … blir lite snyggare så att det ser ut
	som resten av hemsidan"): built like the casino machines' logos (logoGlyphs.ts + LogoWord + LogoShell +
	LogoFig): a small word arched over a big one in chunky candy letters (rim, outline, 3D side, gloss) or neon
	tubes, the game's hero picture beside it, rays in the game's colours behind. The looks are in arcade/looks.ts.
	`tile` = the small copy on a cabinet; `live = false` stands it still.
-->
<script lang="ts">
	import { layoutWord, wordWidth } from '#lib/logoGlyphs.ts';
	import { GAME_LOOKS } from '#lib/arcade/looks.ts';
	import type { ArcadeGame } from '#lib/arcade/game.ts';
	import { GAME_ART } from './registry.ts';
	import { GAME_WORDS } from '#lib/i18n/arcade/index.ts';
	import LogoFig from '../LogoFig.svelte';
	import LogoShell from '../LogoShell.svelte';
	import LogoWord, { type WordStyle } from '../LogoWord.svelte';

	let { game, tile = false, live = true }: { game: ArcadeGame; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -30, w: 640, h: 290 };
	const FIG = 150;

	const L = $derived(GAME_LOOKS[game]);
	const Art = $derived(GAME_ART[game]);
	const neon = $derived(L.style === 'neon');
	const topStroke = $derived(neon ? 12 : 24);
	const bigStroke = $derived(neon ? 14 : 28);
	const gap = $derived(neon ? 10 : 4);

	const TOP = $derived<WordStyle>(
		neon ? { stroke: topStroke, neon: true, faces: L.topFaces } : { stroke: topStroke, outline: 5, ink: L.ink, rim: 4, rimColour: L.rim, depth: 7, dx: 2, gloss: true, shadow: true, faces: L.topFaces }
	);
	const BIG = $derived<WordStyle>(
		neon ? { stroke: bigStroke, neon: true, faces: L.bigFaces } : { stroke: bigStroke, outline: 5, ink: L.ink, rim: 4, rimColour: L.rim, depth: 11, dx: 2.5, gloss: true, shadow: true, faces: L.bigFaces }
	);
	/** the big word fits beside the picture; the top word across the middle */
	const bigScale = $derived(Math.min(1.08, 440 / wordWidth(L.big, { stroke: bigStroke, gap, scale: 1 })));
	const bigW = $derived(wordWidth(L.big, { stroke: bigStroke, gap, scale: bigScale }));
	const bigX = $derived(L.fig === 'right' ? 30 + (450 - bigW) / 2 : 160 + (450 - bigW) / 2);
	const topScale = $derived(Math.min(0.66, 540 / wordWidth(L.top, { stroke: topStroke, gap, scale: 1 })));
	const topW = $derived(wordWidth(L.top, { stroke: topStroke, gap, scale: topScale }));
	const top = $derived(layoutWord(L.top, { x: (640 - topW) / 2, y: 28, stroke: topStroke, gap, scale: topScale, arch: -12, tilts: [-4, 3, -2, 4, -3, 2, -1, 4, -3, 2] }));
	const big = $derived(layoutWord(L.big, { x: bigX, y: 128 + (1 - bigScale) * 30, stroke: bigStroke, gap, scale: bigScale, arch: 10, tilts: [-4, 2, 4, -3, 3, -2, 4] }));
	const figX = $derived(L.fig === 'right' ? 640 - FIG - 14 : 14);

	const RAYS = Array.from({ length: 16 }, (_, i) => {
		const a0 = (i / 16) * Math.PI * 2,
			a1 = ((i + 0.5) / 16) * Math.PI * 2,
			R = 420;
		return `M0 0 L${(Math.cos(a0) * R).toFixed(1)} ${(Math.sin(a0) * R).toFixed(1)} L${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)} Z`;
	});
	const STAR = 'M0 -12 C1.5 -3 3 -1.5 12 0 C3 1.5 1.5 3 0 12 C-1.5 3 -3 1.5 -12 0 C-3 -1.5 -1.5 -3 0 -12 Z';
	const SPARKS = $derived(
		L.fig === 'right'
			? [
					{ x: 46, y: 70, s: 0.8, d: 0 },
					{ x: 600, y: 18, s: 0.7, d: -1.1 },
					{ x: 340, y: 238, s: 0.6, d: -1.9 }
				]
			: [
					{ x: 594, y: 70, s: 0.8, d: 0 },
					{ x: 40, y: 20, s: 0.7, d: -1.1 },
					{ x: 300, y: 238, s: 0.6, d: -1.9 }
				]
	);
</script>

<LogoShell w={VB.w} h={VB.h} label={GAME_WORDS[game].name} {tile} {live}>
	<!-- behind: rays in the game's colours -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('fade')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" /><stop offset=".55" stop-color="#fff" stop-opacity=".5" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></radialGradient>
			<mask id={u('rm')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}><ellipse cx="320" cy="130" rx="330" ry="150" fill="url(#{u('fade')})" /></mask>
		</defs>
		<g mask="url(#{u('rm')})">
			<g transform="translate(320 130)"><g class="gl-rays">{#each RAYS as d, i (i)}<path {d} fill={i % 2 ? L.glow : L.c1} opacity={i % 2 ? 0.14 : 0.2} />{/each}</g></g>
		</g>
	</svg>

	<!-- the hero picture beside the big word -->
	<LogoFig box={VB} x={figX} y={58} size={FIG} r={L.fig === 'right' ? 7 : -7} delay={-0.8} move="bob"><Art size={FIG} /></LogoFig>

	<!-- the words -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<LogoWord letters={top} style={TOP} anim={neon ? 'flicker' : 'none'} />
		<LogoWord letters={big} style={BIG} anim={neon ? 'flicker' : 'wave'} />
		{#each SPARKS as sp, i (i)}
			<g transform="translate({sp.x} {sp.y}) scale({sp.s})"><path class="gl-spark" style:--d="{sp.d}s" d={STAR} fill="#fffbe0" /></g>
		{/each}
	</svg>
</LogoShell>

<style>
	.gl-rays {
		animation: gl-turn 60s linear infinite;
	}
	@keyframes gl-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.gl-spark {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: gl-twinkle 2.4s var(--d) ease-in-out infinite;
	}
	@keyframes gl-twinkle {
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
