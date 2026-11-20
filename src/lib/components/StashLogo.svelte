<!--
	Abscar's Stash's logo (2026-11-20, with the other machines' logos; drawn before the machine is out, for its
	session to build in). Our own drawing in the stash box's smoky purple and green: "ABSCAR'S" in green letters
	over a big puffy "STASH" in pill colours, sitting on a smoke cloud, Abscar peeking over the H with his holk,
	pills, a shroom and a ×10 smoke cloud floating round (the game's own kinds of symbols, drawn simply here).
	Moves a little; the pause button and reduced motion stop it.
-->
<script lang="ts">
	import { layoutWord, wordWidth } from '#lib/logoGlyphs.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import LogoFig from './LogoFig.svelte';
	import LogoShell from './LogoShell.svelte';
	import LogoWord, { type WordStyle } from './LogoWord.svelte';

	let { label = 'Abscar’s Stash', tile = false, live = true }: { label?: string; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -30, w: 640, h: 296 };

	const TOP: WordStyle = {
		stroke: 26,
		outline: 5,
		rim: 4,
		depth: 8,
		dx: 2,
		gloss: true,
		shadow: true,
		faces: [{ hi: '#e6ffc8', mid: '#5ad13a', lo: '#1f7a20', side: '#0d3a10', edge: '#14521a' }]
	};
	const BIG: WordStyle = {
		stroke: 30,
		outline: 5,
		rim: 5,
		rimColour: '#ffffff',
		depth: 11,
		dx: 2.5,
		gloss: true,
		shadow: true,
		faces: [
			{ hi: '#ecd2ff', mid: '#a456f0', lo: '#5d1fb0', side: '#2e0d60' },
			{ hi: '#d8ffd0', mid: '#4fdc5a', lo: '#1c8a2b', side: '#0d4a18' },
			{ hi: '#ffd6ee', mid: '#ff5ca8', lo: '#c41f6e', side: '#66093a' },
			{ hi: '#c8f0ff', mid: '#2ea8f0', lo: '#1050b0', side: '#0a2560' },
			{ hi: '#fff0c0', mid: '#ff9a1a', lo: '#c45a00', side: '#6a2a00' }
		]
	};
	const top = layoutWord("ABSCAR'S", { x: 104, y: 44, stroke: 26, scale: 0.56, arch: -8, tilts: [-4, 3, -2, 4, -3, 2, 0, 4] });
	const stash = layoutWord('STASH', { x: (640 - wordWidth('STASH', { stroke: 30, scale: 1.12 })) / 2, y: 142, stroke: 30, scale: 1.12, arch: 6, tilts: [-5, 4, -3, 5, -4], bob: [0, -4, 2, -3, 1] });

	/** the smoke cloud under the words: blurred puffs */
	const PUFFS = [
		[120, 200, 70],
		[210, 220, 80],
		[320, 210, 96],
		[430, 222, 82],
		[520, 200, 70],
		[180, 150, 64],
		[460, 150, 64],
		[320, 120, 80]
	];
	const PILLS = [
		{ x: 36, y: 58, r: -30, a: '#ff5ca8', b: '#fff3f8', d: 0 },
		{ x: 606, y: 214, r: 24, a: '#2ea8f0', b: '#e8f8ff', d: -1.4 }
	];
	const STAR = 'M0 -12 C1.5 -3 3 -1.5 12 0 C3 1.5 1.5 3 0 12 C-1.5 3 -3 1.5 -12 0 C-3 -1.5 -1.5 -3 0 -12 Z';
</script>

<LogoShell w={VB.w} h={VB.h} {label} {tile} {live}>
	<!-- behind: the smoke cloud, purple and green -->
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<filter id={u('blur')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14" /></filter>
		</defs>
		<g class="sl-smoke" filter="url(#{u('blur')})">
			{#each PUFFS as [x, y, r], i (i)}<circle cx={x} cy={y} {r} fill={i % 3 === 1 ? '#3fae4a' : '#7a3ac0'} opacity={i % 3 === 1 ? 0.35 : 0.5} />{/each}
		</g>
	</svg>

	<!-- Abscar behind the H -->
	<LogoFig box={VB} x={470} y={14} size={116} r={6} delay={-1.2} move="peek"><AbscarOperator variant="ghillie" smoke={0.7} /></LogoFig>

	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<LogoWord letters={top} style={TOP} />
		<LogoWord letters={stash} style={BIG} anim="wave" />

		<!-- pills, a shroom, a ×10 cloud -->
		{#each PILLS as p, i (i)}
			<g transform="translate({p.x} {p.y}) rotate({p.r})">
				<g class="sl-float" style:--d="{p.d}s">
					<path d="M0 -9 H-12 A9 9 0 0 0 -12 9 H0 Z" fill={p.a} stroke="#1a0630" stroke-width="2.4" />
					<path d="M0 -9 H12 A9 9 0 0 1 12 9 H0 Z" fill={p.b} stroke="#1a0630" stroke-width="2.4" />
					<path d="M-16 -4 H-6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6" />
				</g>
			</g>
		{/each}
		<g transform="translate(40 222) rotate(-10)">
			<g class="sl-float" style:--d="-0.7s">
				<path d="M-7 0 Q-8 16 -4 20 H5 Q8 16 7 0 Z" fill="#fff3dc" stroke="#1a0630" stroke-width="2.4" stroke-linejoin="round" />
				<path d="M-22 2 Q-22 -20 0 -21 Q22 -20 22 2 Q0 8 -22 2 Z" fill="#e8322b" stroke="#1a0630" stroke-width="2.6" stroke-linejoin="round" />
				<circle cx="-10" cy="-8" r="3.4" fill="#fff" /><circle cx="4" cy="-13" r="2.8" fill="#fff" /><circle cx="12" cy="-4" r="2.4" fill="#fff" />
				<path d="M-15 -12 Q-10 -18 -3 -18" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5" />
			</g>
		</g>
		<g transform="translate(598 72)">
			<g class="sl-float" style:--d="-2s">
				<path d="M-22 10 Q-30 10 -30 2 Q-30 -7 -21 -7 Q-19 -18 -6 -17 Q2 -25 12 -17 Q24 -18 25 -6 Q33 -4 31 4 Q30 10 22 10 Z" fill="#f4eaff" stroke="#1a0630" stroke-width="2.4" stroke-linejoin="round" />
				<text x="0" y="6" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="17" fill="#7a2ad0">×10</text>
			</g>
		</g>
		<g transform="translate(330 96) scale(.7)"><path class="sl-spark" d={STAR} fill="#fffbe0" /></g>
	</svg>
</LogoShell>

<style>
	.sl-smoke {
		transform-box: fill-box;
		transform-origin: 50% 70%;
		animation: sl-breathe 5s ease-in-out infinite;
	}
	@keyframes sl-breathe {
		50% {
			transform: scale(1.05, 0.95);
			opacity: 0.8;
		}
	}
	.sl-float {
		animation: sl-float 3.2s var(--d) ease-in-out infinite;
	}
	@keyframes sl-float {
		0%,
		100% {
			translate: 0 0;
			rotate: -6deg;
		}
		50% {
			translate: 0 -6px;
			rotate: 8deg;
		}
	}
	.sl-spark {
		transform-box: fill-box;
		transform-origin: 50% 50%;
		animation: sl-twinkle 2.4s ease-in-out infinite;
	}
	@keyframes sl-twinkle {
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
