<!--
	One word of a casino machine's logo (2026-11-20), drawn inside the logo's own <svg> from the centre-line
	letters in logoGlyphs.ts. The style decides the look: chunky cartoon letters (a light rim, a dark outline, a 3D
	side, a gradient face with a gloss), square sign letters (wood grain), or neon tubes (a glow, the coloured tube,
	a white-hot core). `anim` adds a little endless motion (the pause button and reduced motion stop it).
	Decoration: the logo's box carries the name as its label.
-->
<svelte:options namespace="svg" />

<script module lang="ts">
	export type Pal = { hi: string; mid: string; lo: string; side?: string; edge?: string };
	export type WordStyle = {
		stroke: number;
		caps?: 'round' | 'square';
		joins?: 'round' | 'miter' | 'bevel';
		/** dark outline, each side */
		outline?: number;
		ink?: string;
		/** light sticker rim outside the outline (round the whole word) */
		rim?: number;
		rimColour?: string;
		/** 3D side: depth down, dx right */
		depth?: number;
		dx?: number;
		/** a face per letter, cycled */
		faces: Pal[];
		gloss?: boolean;
		/** wood grain over the faces */
		grain?: boolean;
		/** neon tubes instead of solid letters: the colour is each face's `mid` */
		neon?: boolean;
		shadow?: boolean;
	};
</script>

<script lang="ts">
	import { placedTransform, type Placed } from '#lib/logoGlyphs.ts';

	let {
		letters,
		style,
		anim = 'none',
		holes = []
	}: {
		letters: Placed[];
		style: WordStyle;
		/** wave = the letters bob one after another; flicker = neon letters flicker now and then */
		anim?: 'none' | 'wave' | 'flicker';
		/** bullet holes: [letter index, x, y] in the letter's own units */
		holes?: [number, number, number][];
	} = $props();

	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const W = $derived(style.stroke);
	const OL = $derived(style.outline ?? 0);
	const RIM = $derived(style.rim ?? 0);
	const D = $derived(style.depth ?? 0);
	const DX = $derived(style.dx ?? 0);
	const INK = $derived(style.ink ?? '#1a0630');
	const caps = $derived(style.caps ?? 'round');
	const joins = $derived(style.joins ?? 'round');
	const steps = $derived(D ? [0, 0.34, 0.67, 1] : [0]);
	const face = (i: number) => style.faces[i % style.faces.length];
	/** neon flicker: which letters stutter (the 2nd and the 2nd-to-last), at different times */
	const flickers = (i: number) => anim === 'flicker' && (i === 1 || i === letters.length - 2);
</script>

<defs>
	{#each letters as p (p.i)}
		<path id={u(`p${p.i}`)} d={p.d} />
		{#if !style.neon}
			<linearGradient id={u(`f${p.i}`)} gradientUnits="userSpaceOnUse" x1="0" y1={-W / 2} x2="0" y2={80 + W / 2}>
				<stop offset="0" stop-color={face(p.i).hi} /><stop offset=".45" stop-color={face(p.i).mid} /><stop offset="1" stop-color={face(p.i).lo} />
			</linearGradient>
		{/if}
		{#if style.gloss || style.grain}
			<mask id={u(`m${p.i}`)} maskUnits="userSpaceOnUse" x="-60" y="-60" width="200" height="220">
				<use href="#{u(`p${p.i}`)}" fill="none" stroke="#fff" stroke-width={W - 3} stroke-linecap={caps} stroke-linejoin={joins} />
			</mask>
		{/if}
	{/each}
	{#if style.gloss}
		<linearGradient id={u('gloss')} gradientUnits="userSpaceOnUse" x1="0" y1={-W / 2} x2="0" y2="36">
			<stop offset="0" stop-color="#fff" stop-opacity=".85" /><stop offset=".55" stop-color="#fff" stop-opacity=".25" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
		</linearGradient>
	{/if}
	{#if style.grain}
		<!-- wood grain: wavy dark lines along the letters' length -->
		<pattern id={u('grain')} patternUnits="userSpaceOnUse" width="40" height="9" patternTransform="rotate(-8)">
			<path d="M0 3 C10 1 20 5 40 3 M0 7.5 C12 6 26 9 40 7" fill="none" stroke="#3a1a06" stroke-width="1.1" opacity=".45" />
		</pattern>
	{/if}
	{#if style.neon}
		<filter id={u('glow')} x="-30%" y="-30%" width="160%" height="160%">
			<feGaussianBlur stdDeviation={W * 0.9} />
		</filter>
	{/if}
	{#if style.shadow}
		<filter id={u('drop')} x="-10%" y="-10%" width="120%" height="140%">
			<feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".55" />
		</filter>
	{/if}
</defs>

<g fill="none" stroke-linecap={caps} stroke-linejoin={joins}>
	{#if style.neon}
		<!-- neon: dark mounting line under each tube, the glow, the tube, the white-hot core -->
		{#each letters as p (p.i)}
			<g transform={placedTransform(p)}>
				<g class="lw-letter" class:lw-wave={anim === 'wave'} class:lw-flicker={flickers(p.i)} style:--i={p.i}>
					<use href="#{u(`p${p.i}`)}" x="2" y="3" stroke="#000" stroke-opacity=".55" stroke-width={W + 2} />
					<use href="#{u(`p${p.i}`)}" stroke={face(p.i).mid} stroke-width={W * 2.2} opacity=".75" filter="url(#{u('glow')})" />
					<use href="#{u(`p${p.i}`)}" stroke={face(p.i).mid} stroke-width={W} />
					<use href="#{u(`p${p.i}`)}" stroke={face(p.i).hi} stroke-width={W * 0.55} />
					<use href="#{u(`p${p.i}`)}" stroke="#fff" stroke-width={W * 0.22} opacity=".9" />
				</g>
			</g>
		{/each}
	{:else}
		{#if RIM}
			<!-- the light rim round the whole word, behind everything -->
			<g filter={style.shadow ? `url(#${u('drop')})` : undefined}>
				{#each letters as p (p.i)}
					<g transform={placedTransform(p)}>
						{#each steps as t (t)}<use href="#{u(`p${p.i}`)}" x={DX * t} y={D * t} stroke={style.rimColour ?? '#fff1c9'} stroke-width={W + 2 * OL + 2 * RIM} />{/each}
					</g>
				{/each}
			</g>
		{/if}
		{#each letters as p (p.i)}
			{@const f = face(p.i)}
			<g transform={placedTransform(p)}>
				<g class="lw-letter" class:lw-wave={anim === 'wave'} style:--i={p.i}>
					{#if OL}{#each steps as t (t)}<use href="#{u(`p${p.i}`)}" x={DX * t} y={D * t} stroke={INK} stroke-width={W + 2 * OL} />{/each}{/if}
					{#each steps.slice(1) as t (t)}<use href="#{u(`p${p.i}`)}" x={DX * t} y={D * t} stroke={f.side ?? f.lo} stroke-width={W} />{/each}
					{#if D}<use href="#{u(`p${p.i}`)}" stroke={f.edge ?? f.side ?? f.lo} stroke-width={W + 2.2} />{/if}
					<use href="#{u(`p${p.i}`)}" stroke="url(#{u(`f${p.i}`)})" stroke-width={W} />
					{#if style.grain}<g mask="url(#{u(`m${p.i}`)})"><rect x="-60" y="-60" width="200" height="220" fill="url(#{u('grain')})" stroke="none" /></g>{/if}
					{#if style.gloss}<g mask="url(#{u(`m${p.i}`)})"><rect x="-60" y={-W} width="200" height={36 + W} fill="url(#{u('gloss')})" stroke="none" /></g>{/if}
					{#each holes.filter((h) => h[0] === p.i) as [, hx, hy], k (k)}
						<!-- a bullet hole: dark hole, splintered light rim -->
						<g stroke="none">
							<circle cx={hx} cy={hy} r="5.2" fill="#f6d9a0" opacity=".7" />
							<path d="M{hx - 6} {hy - 1} l3 1 M{hx + 5} {hy - 4} l-2 2.4 M{hx + 1} {hy + 6} l-.6 -3" stroke="#f6d9a0" stroke-width="1.2" />
							<circle cx={hx} cy={hy} r="3.6" fill="#120804" />
							<circle cx={hx - 1} cy={hy - 1} r="1.2" fill="#3a2410" />
						</g>
					{/each}
				</g>
			</g>
		{/each}
	{/if}
</g>

<style>
	.lw-wave {
		animation: lw-wave 2.8s calc(var(--i) * -0.18s) ease-in-out infinite;
	}
	@keyframes lw-wave {
		0%,
		100% {
			translate: 0 0;
		}
		50% {
			translate: 0 -3px;
		}
	}
	.lw-flicker {
		animation: lw-flicker 5.5s calc(var(--i) * -1.3s) steps(1) infinite;
	}
	@keyframes lw-flicker {
		0%,
		70%,
		74%,
		77%,
		100% {
			opacity: 1;
		}
		72%,
		75.5% {
			opacity: 0.25;
		}
	}
</style>
