<!--
	Kushburst's logo (2026-11-20, with the other machines' logos; drawn before the machine is out, for its session
	to build in). Our own drawing in the blacklight den's neon: "KUSH" in pink and "BURST" in green neon tubes
	(LogoWord's neon style, two letters flicker now and then) over a big turning magenta burst with a cannabis
	leaf (leaf.ts) glowing in green neon. Moves a little; the pause button and reduced motion stop it.
-->
<script lang="ts">
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { layoutWord, wordWidth } from '#lib/logoGlyphs.ts';
	import LogoShell from './LogoShell.svelte';
	import LogoWord, { type WordStyle } from './LogoWord.svelte';

	let { label = 'Kushburst', tile = false, live = true }: { label?: string; tile?: boolean; live?: boolean } = $props();
	const uid = $props.id();
	const u = (n: string) => `${uid}-${n}`;
	const VB = { x: 0, y: -10, w: 640, h: 270 };
	/** the burst + leaf sit above the word, the word across the burst's lower half */
	const CX = 320, CY = 100;

	const PINK = { hi: '#ffd0f6', mid: '#ff3fd0', lo: '#ff3fd0' };
	const GREEN = { hi: '#dcffd4', mid: '#39ff6a', lo: '#39ff6a' };
	const NEON: WordStyle = { stroke: 12, neon: true, faces: [PINK, PINK, PINK, PINK, GREEN, GREEN, GREEN, GREEN, GREEN] };
	const S = 0.92;
	const word = layoutWord('KUSHBURST', { x: (640 - wordWidth('KUSHBURST', { stroke: 12, gap: 12, scale: S })) / 2, y: 156, stroke: 12, gap: 12, scale: S, arch: -10, tilts: [-3, 2, -2, 3, -3, 2, -2, 3, -2] });

	/** the burst: a 14-point star */
	const BURST = (() => {
		const n = 14, R = 122, r = 64, pts: string[] = [];
		for (let i = 0; i < n * 2; i++) {
			const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r : R;
			pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
		}
		return pts.join(' ');
	})();
	const LEAF_K = 9.4;
</script>

<LogoShell w={VB.w} h={VB.h} {label} {tile} {live}>
	<svg class="lg-layer" viewBox="{VB.x} {VB.y} {VB.w} {VB.h}" aria-hidden="true" focusable="false">
		<defs>
			<radialGradient id={u('burst')} cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7ae6" stop-opacity=".75" /><stop offset=".6" stop-color="#9b3cff" stop-opacity=".45" /><stop offset="1" stop-color="#5a1aa0" stop-opacity="0" /></radialGradient>
			<filter id={u('glow')} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" /></filter>
			<filter id={u('soft')} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" /></filter>
		</defs>
		<!-- the burst, turning, with a soft glow -->
		<g transform="translate({CX} {CY})">
			<g class="kl-burst">
				<polygon points={BURST} fill="url(#{u('burst')})" filter="url(#{u('soft')})" />
				<polygon points={BURST} fill="none" stroke="#ff7ae6" stroke-width="2.4" stroke-linejoin="round" opacity=".55" />
			</g>
		</g>
		<!-- the leaf in green neon -->
		<g class="kl-leaf" transform="translate({CX - 12 * LEAF_K} {CY - 14.4 * LEAF_K}) scale({LEAF_K})" fill="none" stroke-linejoin="round" stroke-linecap="round">
			<g stroke="#39ff6a" stroke-width=".9" opacity=".7" filter="url(#{u('glow')})">{#each LEAF_PATHS as d, k (k)}<path {d} />{/each}<path d={LEAF_STEM} /></g>
			<g fill="#39ff6a" fill-opacity=".1" stroke="#39ff6a" stroke-width=".42">{#each LEAF_PATHS as d, k (k)}<path {d} />{/each}<path d={LEAF_STEM} /></g>
			<g stroke="#eaffea" stroke-width=".14" opacity=".85">{#each LEAF_PATHS as d, k (k)}<path {d} />{/each}</g>
		</g>
		<LogoWord letters={word} style={NEON} anim="flicker" />
	</svg>
</LogoShell>

<style>
	.kl-burst {
		animation: kl-turn 40s linear infinite;
	}
	@keyframes kl-turn {
		to {
			transform: rotate(360deg);
		}
	}
	.kl-leaf {
		animation: kl-pulse 2.6s ease-in-out infinite;
	}
	@keyframes kl-pulse {
		50% {
			opacity: 0.55;
		}
	}
</style>
