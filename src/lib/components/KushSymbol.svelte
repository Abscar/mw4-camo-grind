<!--
	One reel symbol of Kushburst (kushburst.ts; 2026-11-20): our own chunky blacklight-neon cartoons, thick
	dark outlines and one bright neon colour each so they read at 44 px: a pink lighter, a cyan grinder, an
	orange pack of rolling papers, a space brownie, a purple bong, a holk (Abscar's own, abscarOperator.ts)
	and the top symbol, a neon "420" sign with a leaf growing out of it. The LEAF is the WILD: a glowing
	cannabis leaf (leaf.ts) on a soft burst, with a pink WILD banner. Decorative: the reel's label says the
	symbols.
-->
<script lang="ts">
	import type { KushSymbol } from '#lib/kushburst.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { holk } from '#lib/abscarOperator.ts';

	let { symbol, size = 56 }: { symbol: KushSymbol; size?: number } = $props();
	const uid = $props.id();
	const u = `ks-${uid}`;
	const O = '#12051f';
	/** the WILD's soft burst: 12 rays round the leaf */
	const RAYS = Array.from({ length: 12 }, (_, i) => {
		const a = (i * 30 * Math.PI) / 180;
		const b = ((i * 30 + 9) * Math.PI) / 180;
		const p = (r: number, x: number) => `${(32 + r * Math.sin(x)).toFixed(2)} ${(30 - r * Math.cos(x)).toFixed(2)}`;
		return `M32 30 L${p(31, a)} L${p(31, b)} Z`;
	});
	/** the grinder's knurling: short ticks between the seam and the bottom edge (both are curves) */
	const KNURL = [0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.82, 0.92].map((t) => ({
		x: +(11 + 42 * t).toFixed(2),
		y1: +(39.5 + 21 * t * (1 - t) + 1.8).toFixed(2),
		y2: +(47 + 22 * t * (1 - t) - 1.8).toFixed(2)
	}));
</script>

<svg class="kush-sym" data-sym={symbol} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	<defs>
		<radialGradient id="{u}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<linearGradient id="{u}-leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2ffc8" /><stop offset="0.4" stop-color="#8dff5a" /><stop offset="1" stop-color="#16b84a" /></linearGradient>
		<linearGradient id="{u}-chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a7480" /><stop offset="0.4" stop-color="#f4f7fa" /><stop offset="0.7" stop-color="#a8b4c0" /><stop offset="1" stop-color="#4a525c" /></linearGradient>
	</defs>
	{#if symbol === 'lighter'}
		<!-- a hot-pink lighter: chrome hood with the spark wheel, a flame -->
		<path d="M28.4 17 C21 12.6 24.6 6.4 28.6 1.6 C30.4 6.4 36.6 9.4 32.6 16.4 Z" fill="#ff9a1a" stroke={O} stroke-width="2" stroke-linejoin="round" />
		<path d="M29.4 15.6 C26.6 12.8 28 9.6 29.4 7.4 C30.4 10 32.6 11.8 30.8 15.4 Z" fill="#fff36a" />
		<rect x="20" y="25" width="24" height="34" rx="6" fill="#ff3fb4" stroke={O} stroke-width="3" />
		<rect x="23.6" y="29" width="4" height="26" rx="2" fill="#fff" opacity="0.45" />
		<rect x="36" y="31" width="4" height="20" rx="2" fill="#a0106a" opacity="0.5" />
		<rect x="21" y="16" width="22" height="10.5" rx="2.5" fill="url(#{u}-chrome)" stroke={O} stroke-width="2.6" />
		<circle cx="38.5" cy="15.6" r="4.6" fill="#8a96a2" stroke={O} stroke-width="2.2" />
		<path d="M35 15.6 h7 M38.5 12 v7.2" stroke="#4a525c" stroke-width="1" />
	{:else if symbol === 'grinder'}
		<!-- a cyan herb grinder: knurled body, a lid with a leaf on it -->
		<path d="M11 30 L11 47 Q32 58 53 47 L53 30 Z" fill="#0f9cc8" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M11 39.5 Q32 50 53 39.5" fill="none" stroke={O} stroke-width="2.2" />
		{#each KNURL as k (k.x)}
			<path d="M{k.x} {k.y1} V{k.y2}" stroke="#5feaff" stroke-width="1.6" stroke-linecap="round" opacity="0.8" />
		{/each}
		<ellipse cx="32" cy="30" rx="21" ry="8.5" fill="#5feaff" stroke={O} stroke-width="3" />
		<ellipse cx="32" cy="29" rx="15" ry="5.4" fill="#2fd0f0" />
		<g transform="translate(32 29.4) scale(1.05 0.46) translate(-12 -15.5)">
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="#0a4a5e" />{/each}
		</g>
		<path d="M17 27 Q22 23.5 30 23" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.7" />
	{:else if symbol === 'papers'}
		<!-- an orange pack of rolling papers, a sheet sticking out, a zigzag on the front -->
		<path d="M18 23 L18 9 Q27 5.4 46 9.6 L46 23 Z" fill="#fffaf0" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<path d="M22 13.4 Q30 11 42 13" fill="none" stroke="#d8cdb6" stroke-width="1.4" />
		<rect x="13" y="22" width="38" height="36" rx="4" fill="#ff8a1a" stroke={O} stroke-width="3" />
		<path d="M13 22 H51 V31 Q32 34 13 31 Z" fill="#d85a0c" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
		<polyline points="18,46 23.5,39.5 29,46 34.5,39.5 40,46 45.5,39.5" fill="none" stroke="#fff3c8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" />
		<rect x="17" y="34.4" width="5" height="2.4" rx="1.2" fill="#ffd23a" opacity="0.8" />
		<rect x="17" y="50" width="30" height="3" rx="1.5" fill="#b8480a" opacity="0.7" />
	{:else if symbol === 'brownie'}
		<!-- a space brownie: a fudgy block with neon icing drips, a little leaf and sprinkles on top -->
		<path d="M8 30 L32 21 L56 30 L32 39 Z" fill="#8a4a22" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<path d="M8 30 L32 39 L32 55 L8 46 Z" fill="#4e2610" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<path d="M32 39 L56 30 L56 46 L32 55 Z" fill="#663418" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<path d="M11 30 L32 22.4 L53 30 L45 33 Q46 38 43 38.4 Q40.6 38 41.4 34.4 L32 37.8 Q32.6 43 29.6 43 Q27 42.6 28.4 37 L19 33.6 Q19.6 37 17.2 37.2 Q15 36.8 15.8 32.4 Z" fill="#ffe14a" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<g transform="translate(32 24.4) scale(0.95) translate(-12 -15.5)">
			<path d={LEAF_STEM} stroke="#0b3d14" stroke-width="1.6" stroke-linecap="round" />
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="url(#{u}-leaf)" stroke="#0b3d14" stroke-width="0.8" stroke-linejoin="round" />{/each}
		</g>
		{#each [[18, 30, '#ff3fb4', 20], [44, 29, '#5feaff', -30], [26, 33.6, '#5feaff', 60], [39, 33.4, '#ff3fb4', -10]] as [x, y, c, a] (`${x}-${y}`)}
			<rect x={Number(x) - 2} y={Number(y) - 0.8} width="4" height="1.6" rx="0.8" fill={String(c)} transform="rotate({a} {x} {y})" />
		{/each}
	{:else if symbol === 'bong'}
		<!-- a purple glass bong with green water, bubbles, a downstem and a glowing bowl -->
		<path d="M22.6 47 L11.6 35.6" stroke={O} stroke-width="5" stroke-linecap="round" />
		<path d="M22.6 47 L11.6 35.6" stroke="url(#{u}-chrome)" stroke-width="2.6" stroke-linecap="round" />
		<path d="M5.4 33.4 L16 29.6 L17.6 34.6 Q12 39.4 7.4 38 Z" fill="url(#{u}-chrome)" stroke={O} stroke-width="2" stroke-linejoin="round" />
		<circle cx="10.6" cy="32" r="5.4" fill="url(#{u}-ember)" class="kush-glow" />
		<path d="M27 7 L37 7 L37 33 Q46 37 47 47 Q48 60 32 60 Q16 60 17 47 Q18 37 27 33 Z" fill="#b65cff" fill-opacity="0.82" stroke={O} stroke-width="3" stroke-linejoin="round" />
		<path d="M18.2 46 Q32 50 45.8 46 Q46.6 58.6 32 58.6 Q17.4 58.6 18.2 46 Z" fill="#5fe36a" opacity="0.9" />
		<circle cx="27" cy="51" r="1.8" fill="#eaffd8" /><circle cx="35" cy="53.6" r="1.3" fill="#eaffd8" /><circle cx="31.4" cy="49" r="1" fill="#eaffd8" />
		<rect x="25.4" y="4" width="13.2" height="5" rx="2.4" fill="#e7b8ff" stroke={O} stroke-width="2.2" />
		<path d="M30 12 V30 M22.6 42 Q22 38 26 35.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.6" />
	{:else if symbol === 'holk'}
		<!-- Abscar's holk: a fat cone with a glowing end, a curl of smoke -->
		<path class="kush-curl" d="M52 13 C47 8 55 4 50 -1" fill="none" stroke="#e2e7e2" stroke-width="2.6" stroke-linecap="round" opacity="0.75" />
		{@html holk(u, 12, 54, 50, 17, 7.5, 16, 11)}
		<path d="M10 56 L14.6 51 M7.6 52.6 L11 49" stroke="#ffd23a" stroke-width="1.6" stroke-linecap="round" opacity="0.9" />
	{:else if symbol === 'x420'}
		<!-- the top symbol: a neon 420 sign on a gold-edged plate, a leaf sprouting out of its top -->
		<g transform="translate(32 13) scale(1.05) translate(-12 -16)">
			<path d={LEAF_STEM} stroke="#0b3d14" stroke-width="1.6" stroke-linecap="round" />
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="url(#{u}-leaf)" stroke="#0b3d14" stroke-width="0.8" stroke-linejoin="round" />{/each}
		</g>
		<rect x="3" y="20" width="58" height="34" rx="8" fill="#12051f" stroke="#ffc928" stroke-width="3.2" />
		<rect x="6.4" y="23.4" width="51.2" height="27.2" rx="5" fill="none" stroke="#ff3fb4" stroke-width="1.2" opacity="0.8" />
		{#each [[8.4, 25.4], [55.6, 25.4], [8.4, 48.6], [55.6, 48.6]] as [x, y] (`${x}-${y}`)}<circle cx={x} cy={y} r="1.2" fill="#ffe9a0" />{/each}
		<text x="32" y="46.4" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="25" letter-spacing="0.5" fill="none" stroke="#3aff6a" stroke-width="5" opacity="0.35">420</text>
		<text x="32" y="46.4" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="25" letter-spacing="0.5" fill="#8dff5a" stroke="#eaffd8" stroke-width="0.9" paint-order="stroke">420</text>
	{:else}
		<!-- the LEAF (WILD): a glowing cannabis leaf on a soft burst, a pink WILD banner -->
		<g class="kush-rays" opacity="0.55">
			{#each RAYS as d, i (i)}<path {d} fill={i % 2 ? '#ff7ad9' : '#b6ff7a'} />{/each}
		</g>
		<circle cx="32" cy="30" r="17" fill="#eaffd0" opacity="0.35" />
		<g transform="translate(-4 -18) scale(3)">
			<path d={LEAF_STEM} stroke="#0b3d14" stroke-width="1.2" stroke-linecap="round" />
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="url(#{u}-leaf)" stroke="#0b3d14" stroke-width="0.55" stroke-linejoin="round" />{/each}
			<path d="M12 20 L12 8.6 M12 20 L7.2 11.6 M12 20 L16.8 11.6 M12 20 L6.6 16.6 M12 20 L17.4 16.6" stroke="#f2ffc8" stroke-width="0.35" stroke-linecap="round" opacity="0.85" />
		</g>
		<rect x="11" y="47" width="42" height="14.5" rx="7.2" fill="#ff2fa8" stroke={O} stroke-width="2.6" />
		<text x="32" y="58.2" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="11.5" fill="#fff" letter-spacing="1.4">WILD</text>
	{/if}
</svg>

<style>
	.kush-sym {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45));
	}
	/* each symbol glows in its own neon colour, like under a blacklight */
	.kush-sym[data-sym='lighter'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(255 63 180 / 0.65));
	}
	.kush-sym[data-sym='grinder'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(95 234 255 / 0.65));
	}
	.kush-sym[data-sym='papers'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(255 138 26 / 0.6));
	}
	.kush-sym[data-sym='brownie'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(255 225 74 / 0.55));
	}
	.kush-sym[data-sym='bong'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(182 92 255 / 0.7));
	}
	.kush-sym[data-sym='holk'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 5px rgb(255 160 60 / 0.6));
	}
	.kush-sym[data-sym='x420'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 6px rgb(141 255 90 / 0.7));
	}
	.kush-sym[data-sym='leaf'] {
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.45)) drop-shadow(0 0 8px rgb(141 255 90 / 0.9));
	}
	.kush-rays {
		transform-box: fill-box;
		transform-origin: center;
		animation: kush-turn 14s linear infinite;
	}
	@keyframes kush-turn {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.kush-rays {
			animation: none;
		}
	}
</style>
