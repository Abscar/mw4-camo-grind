<!--
	The "MYBOTS 5" logo (2026-11-20, the user's ask: "a fun logo for Mybots 5, like that kind of slot's logo but
	with the gang instead"). Our own drawing: chunky, glossy cartoon letters in the collectors' colours (built
	from thick round strokes along a centre line: a light sticker rim, a dark outline, a 3D side, the face with a
	gloss), a big gold 5, and the squad's own emblems peeking over the letters: Phillestar over the M, Drängen
	over the Y, Da Jeeven over the B, Ingman over the T and Abscar (the house) behind the 5 with his holk.
	Three layers in one box: rays behind, the emblems, the letters in front (so the letters hide their shoulders).
	Moves a little: the rays turn, the gang pop up now and then, a glint runs over the letters, the 5 wobbles.
	Endless animations, so the pause button and reduced motion stop them (app.html / app.css).
	Decoration: the box is role="img" with the name as its label.
-->
<script lang="ts">
	import AbscarOperator from './AbscarOperator.svelte';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import IngmanEmblem from './IngmanEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';

	let {
		label = 'Mybots 5',
		tile = false
	}: {
		label?: string;
		/** the small copy on the casino's game tile: decoration (the tile says the name), no sparkles, and it
		    only moves while its tile is the picked one (like the other tiles' pictures) */
		tile?: boolean;
	} = $props();

	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;

	/** the drawing's own box (the letters' coordinates); the page scales it to the width it gets */
	const VB = { x: 0, y: -40, w: 640, h: 296 };
	const W = 28; // letter thickness
	const OL = 5; // dark outline, each side
	const RIM = 4; // light sticker rim outside the outline
	const D = 10; // depth of the 3D side (down, a little right)
	const DX = 2.5;
	const INK = '#1a0630';

	type Pal = { hi: string; mid: string; lo: string; side: string; edge: string };
	const PAL: Record<string, Pal> = {
		red: { hi: '#ffb59a', mid: '#ff3b2e', lo: '#b5121b', side: '#6e0a12', edge: '#8e0f17' },
		amber: { hi: '#fff3b0', mid: '#ffbe1a', lo: '#de7a00', side: '#7a3d00', edge: '#a85400' },
		blue: { hi: '#b8ecff', mid: '#2d8cf0', lo: '#1046b0', side: '#0a2560', edge: '#0d3286' },
		green: { hi: '#eaffbc', mid: '#62dc3e', lo: '#1c8a2b', side: '#0d4a18', edge: '#126a22' },
		purple: { hi: '#ecd2ff', mid: '#a456f0', lo: '#5d1fb0', side: '#2e0d60', edge: '#46158c' },
		pink: { hi: '#ffd6ee', mid: '#ff5ca8', lo: '#c41f6e', side: '#66093a', edge: '#93104f' },
		gold: { hi: '#fffbe0', mid: '#ffd23a', lo: '#ff8a00', side: '#8a3a06', edge: '#b85a00' }
	};

	type Glyph = { k: string; d: string; x: number; y: number; r: number; s: number; pal: string; cx: number; cy: number };
	/** centre lines (cap height 0–80 before scale); x/y place the glyph, r tilts it round (cx, cy) */
	const GLYPHS: Glyph[] = [
		{ k: 'M', d: 'M0 80 V0 L32 44 L64 0 V80', x: 34, y: 140, r: -5, s: 1, pal: 'red', cx: 32, cy: 40 },
		{ k: 'Y', d: 'M0 2 L26 40 L52 2 M26 40 V80', x: 124, y: 146, r: 4, s: 1, pal: 'amber', cx: 26, cy: 40 },
		{ k: 'B', d: 'M0 80 V0 H18 C48 0 48 38 18 38 H0 M18 38 H22 C54 38 54 80 22 80 H0', x: 200, y: 138, r: -3, s: 1, pal: 'blue', cx: 24, cy: 40 },
		{ k: 'O', d: 'M30 0 A30 40 0 1 1 30 80 A30 40 0 1 1 30 0 Z', x: 276, y: 144, r: 5, s: 1, pal: 'green', cx: 30, cy: 40 },
		{ k: 'T', d: 'M0 0 H56 M28 0 V80', x: 360, y: 137, r: -4, s: 1, pal: 'purple', cx: 28, cy: 40 },
		{
			k: 'S',
			d: 'M50 10 C44 2 36 0 28 0 C10 0 2 9 2 21 C2 33 12 37 26 40 C42 43 52 48 52 60 C52 73 42 80 26 80 C14 80 6 76 0 69',
			x: 442,
			y: 143,
			r: 6,
			s: 1,
			pal: 'pink',
			cx: 26,
			cy: 40
		},
		{ k: '5', d: 'M50 0 H10 L7 44 C13 39 21 37 29 37 C49 37 60 50 60 67 C60 86 46 100 28 100 C15 100 6 95 0 88', x: 532, y: 100, r: 8, s: 1.18, pal: 'gold', cx: 30, cy: 50 }
	];
	const STEPS = [0, 0.5, 1];

	/** the gang: which emblem, where its box sits (drawing units), how big, a tilt, when it pops up */
	type Op = { who: 'abscar' | 'phil' | 'lars' | 'jeeven' | 'ingman'; x: number; y: number; size: number; r: number; delay: number };
	const OPS: Op[] = [
		{ who: 'phil', x: 10, y: 20, size: 114, r: -6, delay: 0 },
		{ who: 'lars', x: 130, y: 22, size: 114, r: 4, delay: -1.6 },
		{ who: 'jeeven', x: 250, y: 24, size: 114, r: -3, delay: -3.1 },
		{ who: 'ingman', x: 374, y: 20, size: 114, r: 3, delay: -4.7 },
		{ who: 'abscar', x: 524, y: -16, size: 114, r: 7, delay: -2.4 }
	];
	const pct = (v: number, of: number) => `${(v / of) * 100}%`;

	/** rays behind the word, alternating */
	const RAYS = Array.from({ length: 18 }, (_, i) => {
		const a0 = (i / 18) * Math.PI * 2;
		const a1 = ((i + 0.5) / 18) * Math.PI * 2;
		const R = 420;
		return `M0 0 L${(Math.cos(a0) * R).toFixed(1)} ${(Math.sin(a0) * R).toFixed(1)} L${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)} Z`;
	});
	/** four-point sparkles round the 5 and the word */
	const SPARKS = [
		{ x: 618, y: 70, s: 1.1, d: 0 },
		{ x: 505, y: 112, s: 0.7, d: -0.9 },
		{ x: 628, y: 238, s: 0.8, d: -1.7 },
		{ x: 14, y: 128, s: 0.8, d: -0.5 },
		{ x: 330, y: 100, s: 0.6, d: -2.2 }
	];
	const glyphTf = (g: Glyph) => `translate(${g.x} ${g.y}) rotate(${g.r} ${g.cx * g.s} ${g.cy * g.s}) scale(${g.s})`;
</script>

{#snippet emblem(who: Op['who'])}
	{#if who === 'abscar'}<AbscarOperator variant="ghillie" smoke={0.7} />{:else if who === 'phil'}<PhillestarEmblem />{:else if who === 'lars'}<LarsAkeEmblem />{:else if who === 'jeeven'}<DaJeevenEmblem />{:else}<IngmanEmblem />{/if}
{/snippet}

<!-- (the wrap: on the tile a box as tall as the other tiles' pictures, the logo centred in it) -->
<div class="mb-wrap" class:tile>
<div class="mb-logo" class:tile role={tile ? undefined : 'img'} aria-label={tile ? undefined : label} aria-hidden={tile ? 'true' : undefined} style:aspect-ratio="{VB.w} / {VB.h}">
	<!-- behind: turning rays + a green glow round the 5 -->
	<svg class="mb-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('fade')} cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stop-color="#fff" stop-opacity="1" /><stop offset=".55" stop-color="#fff" stop-opacity=".55" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
			</radialGradient>
			<mask id={u('raymask')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}>
				<ellipse cx="320" cy="150" rx="330" ry="150" fill="url(#{u('fade')})" />
			</mask>
			<radialGradient id={u('glow5')} cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stop-color="#7dff6a" stop-opacity=".55" /><stop offset="1" stop-color="#7dff6a" stop-opacity="0" />
			</radialGradient>
		</defs>
		<g mask="url(#{u('raymask')})">
			<g transform="translate(320 150)">
				<g class="mb-rays">
					{#each RAYS as d, i (i)}<path {d} fill={i % 2 ? '#ff5ca8' : '#7dff6a'} opacity={i % 2 ? 0.16 : 0.12} />{/each}
				</g>
			</g>
		</g>
		<ellipse class="mb-glow" cx="584" cy="160" rx="96" ry="110" fill="url(#{u('glow5')})" />
	</svg>

	<!-- the gang, behind the letters -->
	{#each OPS as o (o.who)}
		<span
			class="mb-op"
			data-who={o.who}
			style:left={pct(o.x - VB.x, VB.w)}
			style:top={pct(o.y - VB.y, VB.h)}
			style:width={pct(o.size, VB.w)}
			style:--r="{o.r}deg"
			style:--delay="{o.delay}s"
		>
			<span class="mb-op-in">{@render emblem(o.who)}</span>
		</span>
	{/each}

	<!-- in front: the letters -->
	<svg class="mb-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			{#each GLYPHS as g, i (g.k)}<path id={u(`g${i}`)} d={g.d} />{/each}
			{#each Object.entries(PAL) as [name, p] (name)}
				<linearGradient id={u(`face-${name}`)} gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="94">
					<stop offset="0" stop-color={p.hi} /><stop offset=".42" stop-color={p.mid} /><stop offset="1" stop-color={p.lo} />
				</linearGradient>
			{/each}
			<linearGradient id={u('gloss')} gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="34">
				<stop offset="0" stop-color="#fff" stop-opacity=".85" /><stop offset=".55" stop-color="#fff" stop-opacity=".28" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
			</linearGradient>
			<linearGradient id={u('glint')} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".5" stop-color="#fff" stop-opacity=".75" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
			</linearGradient>
			<!-- each letter's face, for its gloss -->
			{#each GLYPHS as g, i (g.k)}
				<mask id={u(`m${i}`)} maskUnits="userSpaceOnUse" x="-40" y="-40" width="160" height="200">
					<use href="#{u(`g${i}`)}" fill="none" stroke="#fff" stroke-width={W - 4} stroke-linecap="round" stroke-linejoin="round" />
				</mask>
			{/each}
			<!-- every face at once, for the glint that runs over the word -->
			<mask id={u('all')} maskUnits="userSpaceOnUse" x={VB.x} y={VB.y} width={VB.w} height={VB.h}>
				{#each GLYPHS as g, i (g.k)}
					<g transform={glyphTf(g)}><use href="#{u(`g${i}`)}" fill="none" stroke="#fff" stroke-width={W} stroke-linecap="round" stroke-linejoin="round" /></g>
				{/each}
			</mask>
			<filter id={u('drop')} x="-10%" y="-10%" width="120%" height="130%">
				<feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000" flood-opacity=".55" />
			</filter>
		</defs>

		<g fill="none" stroke-linecap="round" stroke-linejoin="round">
			<!-- the light sticker rim round the whole word, behind everything -->
			<g filter="url(#{u('drop')})">
				{#each GLYPHS as g, i (g.k)}
					<g transform={glyphTf(g)}>
						{#each STEPS as t (t)}<use href="#{u(`g${i}`)}" x={DX * t} y={D * t} stroke={g.k === '5' ? '#c8ffb8' : '#fff1c9'} stroke-width={W + 2 * OL + 2 * RIM} />{/each}
					</g>
				{/each}
			</g>
			{#each GLYPHS as g, i (g.k)}
				{@const p = PAL[g.pal]}
				<!-- (the animation sits on an inner group: transform-box on the outer one would move its transform) -->
				<g transform={glyphTf(g)}>
					<g class:mb-five={g.k === '5'}>
						<!-- outline, then the 3D side, a thin edge where the face meets the side, the face, its gloss -->
						{#each STEPS as t (t)}<use href="#{u(`g${i}`)}" x={DX * t} y={D * t} stroke={INK} stroke-width={W + 2 * OL} />{/each}
						{#each STEPS.slice(1) as t (t)}<use href="#{u(`g${i}`)}" x={DX * t} y={D * t} stroke={p.side} stroke-width={W} />{/each}
						<use href="#{u(`g${i}`)}" stroke={p.edge} stroke-width={W + 2.4} />
						<use href="#{u(`g${i}`)}" stroke="url(#{u(`face-${g.pal}`)})" stroke-width={W} />
						<g mask="url(#{u(`m${i}`)})"><rect x="-40" y="-20" width="160" height="56" fill="url(#{u('gloss')})" stroke="none" /></g>
					</g>
				</g>
			{/each}
		</g>

		<!-- a glint now and then -->
		<g mask="url(#{u('all')})">
			<rect class="mb-glint" x="-160" y={VB.y} width="90" height={VB.h} fill="url(#{u('glint')})" transform="skewX(-20)" />
		</g>

		<!-- sparkles (not on the small tile copy) -->
		{#each tile ? [] : SPARKS as sp, i (i)}
			<g transform="translate({sp.x} {sp.y}) scale({sp.s})">
				<path class="mb-spark" style:--d="{sp.d}s" d="M0 -12 C1.5 -3 3 -1.5 12 0 C3 1.5 1.5 3 0 12 C-1.5 3 -3 1.5 -12 0 C-3 -1.5 -1.5 -3 0 -12 Z" fill="#fffbe0" />
			</g>
		{/each}
	</svg>
</div>
</div>

<style>
	.mb-wrap,
	.mb-logo {
		position: relative;
		width: 100%;
	}
	/* the casino tile: a box as tall as the other tiles' pictures (49 px, 70 px from 560 px), the logo as wide
	   as fits (106 / 151 px = that height), centred in it when the tile is narrower */
	.mb-wrap.tile {
		display: grid;
		place-items: center;
		height: 49px;
	}
	.mb-logo.tile {
		width: min(100%, 106px);
	}
	@media (min-width: 560px) {
		.mb-wrap.tile {
			height: 70px;
		}
		.mb-logo.tile {
			width: min(100%, 151px);
		}
	}
	/* on the tile it stands still until its tile is picked */
	.mb-logo.tile .mb-op-in,
	.mb-logo.tile .mb-rays,
	.mb-logo.tile .mb-glow,
	.mb-logo.tile .mb-glint,
	.mb-logo.tile .mb-five {
		animation: none;
	}
	:global([aria-pressed='true']) .mb-logo.tile .mb-op-in {
		animation: mb-peek 6.5s var(--delay) ease-in-out infinite;
	}
	:global([aria-pressed='true']) .mb-logo.tile .mb-glint {
		animation: mb-glint 5.5s ease-in-out infinite;
	}
	:global([aria-pressed='true']) .mb-logo.tile .mb-five {
		animation: mb-wobble 3.6s ease-in-out infinite;
	}
	.mb-layer {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.mb-op {
		position: absolute;
		aspect-ratio: 1;
		transform: rotate(var(--r));
		transform-origin: 50% 100%;
	}
	.mb-op-in {
		display: block;
		width: 100%;
		height: 100%;
		animation: mb-peek 6.5s var(--delay) ease-in-out infinite;
	}
	.mb-op-in > :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	/* now and then each one pops up a bit higher over its letter and ducks back */
	@keyframes mb-peek {
		0%,
		62%,
		100% {
			transform: translateY(0);
		}
		70% {
			transform: translateY(-9%) rotate(-3deg);
		}
		76% {
			transform: translateY(-6%) rotate(2deg);
		}
		84% {
			transform: translateY(0);
		}
	}
	.mb-rays {
		animation: mb-turn 60s linear infinite;
	}
	@keyframes mb-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.mb-glow {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: mb-breathe 3.2s ease-in-out infinite;
	}
	@keyframes mb-breathe {
		50% {
			opacity: 0.6;
			transform: scale(0.92);
		}
	}
	.mb-glint {
		animation: mb-glint 5.5s ease-in-out infinite;
	}
	@keyframes mb-glint {
		0%,
		55% {
			transform: skewX(-20deg) translateX(0);
		}
		85%,
		100% {
			transform: skewX(-20deg) translateX(960px);
		}
	}
	.mb-five {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: mb-wobble 3.6s ease-in-out infinite;
	}
	@keyframes mb-wobble {
		0%,
		100% {
			rotate: 0deg;
		}
		50% {
			rotate: -2.5deg;
		}
	}
	.mb-spark {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: mb-twinkle 2.4s var(--d) ease-in-out infinite;
	}
	@keyframes mb-twinkle {
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
