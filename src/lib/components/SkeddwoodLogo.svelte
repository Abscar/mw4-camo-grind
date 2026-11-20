<!--
	Skeddwood's logo (2026-11-20, with the other machines' logos; drawn before the machine is out, for its session
	to build in). Our own drawing of the saloon's sunset sign: "SKEDDWOOD" in square wooden letters with grain,
	a gold rim and bullet holes, a striped sunset sun and mesas behind, Abscar (his sniper figure) in a cowboy hat
	peeking over the middle with his holk, and two sheriff stars. Moves a little; the pause button and reduced
	motion stop it.
-->
<script lang="ts">
	import { layoutWord, wordWidth } from '#lib/logoGlyphs.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import LogoFig from './LogoFig.svelte';
	import LogoShell from './LogoShell.svelte';
	import LogoWord, { type WordStyle } from './LogoWord.svelte';

	let { label = 'Skeddwood', tile = false, live = true }: { label?: string; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -30, w: 640, h: 290 };

	const WOOD = [
		{ hi: '#f2c27a', mid: '#c27a34', lo: '#7a4214', side: '#3a1a06', edge: '#4e2408' },
		{ hi: '#e8b46a', mid: '#b46c2a', lo: '#6e3a10', side: '#3a1a06', edge: '#4e2408' }
	];
	const STYLE: WordStyle = { stroke: 26, caps: 'square', joins: 'bevel', outline: 4.5, ink: '#1a0a02', rim: 3.5, rimColour: '#ffd27a', depth: 10, dx: 2.5, grain: true, shadow: true, faces: WOOD };
	const S = 0.82;
	const word = layoutWord('SKEDDWOOD', { x: (640 - wordWidth('SKEDDWOOD', { stroke: 26, scale: S })) / 2, y: 150, stroke: 26, scale: S, arch: 8, tilts: [-4, 3, -2, 4, -3, 3, -4, 2, -3], bob: [0, 3, -2, 2, -3, 0, 3, -2, 1] });
	/** bullet holes: [letter index, x, y] on the letters' centre lines */
	const HOLES: [number, number, number][] = [
		[1, 0, 22],
		[3, 0, 60],
		[5, 8, 40],
		[7, 0, 40]
	];
	/** the sun's stripes (gaps) in its lower half */
	const STRIPES = [148, 170, 190, 208, 224];
</script>

<LogoShell w={VB.w} h={VB.h} {label} {tile} {live}>
	<!-- behind: a striped sunset sun over mesas -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id={u('sun')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe86a" /><stop offset=".45" stop-color="#ff9a2a" /><stop offset=".8" stop-color="#ff4a3a" /><stop offset="1" stop-color="#c41f6e" /></linearGradient>
			<mask id={u('stripes')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}>
				<rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="#fff" />
				{#each STRIPES as y, i (y)}<rect x="0" {y} width="640" height={3 + i * 1.6} fill="#000" />{/each}
			</mask>
			<radialGradient id={u('haze')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9a2a" stop-opacity=".5" /><stop offset="1" stop-color="#ff9a2a" stop-opacity="0" /></radialGradient>
			<!-- the horizon: the sun sets behind it -->
			<clipPath id={u('sky')}><rect x={VB.x} y={VB.y} width={VB.w} height={236 - VB.y} /></clipPath>
		</defs>
		<ellipse class="sk-haze" cx="320" cy="150" rx="300" ry="140" fill="url(#{u('haze')})" />
		<g clip-path="url(#{u('sky')})"><circle cx="320" cy="186" r="140" fill="url(#{u('sun')})" mask="url(#{u('stripes')})" /></g>
		<path d="M14 236 L14 214 L60 214 L68 196 L126 196 L136 214 L184 214 L184 236 Z M456 236 L456 206 L484 206 L494 186 L554 186 L562 206 L626 206 L626 236 Z" fill="#3a1236" opacity=".9" />
	</svg>

	<!-- Abscar in a cowboy hat, behind the middle letters -->
	<LogoFig box={VB} x={258} y={20} size={124} r={-4} delay={-1} move="peek">
		<span class="sk-fig">
			<AbscarOperator variant="sniper" smoke={0.7} />
			<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
				<defs>
					<linearGradient id={u('hat')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b07a3e" /><stop offset="1" stop-color="#6a4018" /></linearGradient>
				</defs>
				<!-- the hat: crown with a pinched top, a band with a gold star, a wide curled brim -->
				<g transform="rotate(-6 32 4)" stroke="#1a0a02" stroke-width="1.1" stroke-linejoin="round">
					<path d="M19 4 C18 -6 21 -13 26 -14 C29 -11 35 -11 38 -14 C43 -13 46 -6 45 4 Z" fill="url(#{u('hat')})" />
					<path d="M26 -14 C29 -9 35 -9 38 -14" fill="none" stroke-width=".8" />
					<path d="M19.6 0 H44.4 L45 4 H19 Z" fill="#2a1408" />
					<path d="M32 -0.2 L32.9 1.6 L34.8 1.8 L33.4 3 L33.8 4.8 L32 3.9 L30.2 4.8 L30.6 3 L29.2 1.8 L31.1 1.6 Z" fill="#ffd23a" stroke-width=".4" />
					<path d="M4 4 C6 9 14 8 20 6 C27 4.6 37 4.6 44 6 C50 8 58 9 60 4 C62 9 54 12.5 44 10.6 C37 9.4 27 9.4 20 10.6 C10 12.5 2 9 4 4 Z" fill="url(#{u('hat')})" />
					<path d="M10 8 C20 7 44 7 54 8" fill="none" stroke="#f0c890" stroke-width=".6" opacity=".7" />
				</g>
			</svg>
		</span>
	</LogoFig>

	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id={u('star')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0" /><stop offset=".5" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></linearGradient>
		</defs>
		<LogoWord letters={word} style={STYLE} holes={HOLES} />
		<!-- two sheriff stars -->
		{#each [{ x: 40, y: 92, s: 1, d: 0 }, { x: 600, y: 96, s: 0.85, d: -1.6 }] as st, i (i)}
			<g transform="translate({st.x} {st.y}) scale({st.s})">
				<g class="sk-star" style:--d="{st.d}s">
					<path d="M0 -24 L6.5 -11 L21 -12 L13 0 L21 12 L6.5 11 L0 24 L-6.5 11 L-21 12 L-13 0 L-21 -12 L-6.5 -11 Z" fill="url(#{u('star')})" stroke="#4a2a00" stroke-width="2.2" stroke-linejoin="round" />
					{#each [[0, -24], [21, -12], [21, 12], [0, 24], [-21, 12], [-21, -12]] as [x, y] (`${x}${y}`)}<circle cx={x} cy={y} r="3.2" fill="url(#{u('star')})" stroke="#4a2a00" stroke-width="1.6" />{/each}
					<circle r="7" fill="none" stroke="#7a4a00" stroke-width="1.6" />
				</g>
			</g>
		{/each}
	</svg>
</LogoShell>

<style>
	.sk-fig {
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
	}
	.sk-fig > :global(svg) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.sk-haze {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: sk-breathe 4s ease-in-out infinite;
	}
	@keyframes sk-breathe {
		50% {
			opacity: 0.6;
			transform: scale(0.94);
		}
	}
	.sk-star {
		animation: sk-spin 4.5s var(--d) ease-in-out infinite;
	}
	@keyframes sk-spin {
		0%,
		100% {
			rotate: -10deg;
			translate: 0 0;
		}
		50% {
			rotate: 12deg;
			translate: 0 -5px;
		}
	}
</style>
