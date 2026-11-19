<!--
	One reel symbol of Book Of Skedd (book.ts; 2026-11-20): our own drawings in a "stoner grimoire" style,
	thick dark outlines and bright fills so they read at 44 px. The letters 10–A are glossy carved letters
	in five colours; the four big symbols are a rasta lighter, a grinder, a gold-and-glass bong and Abscar's
	cyborg skull with a holk; THE BOOK is a green leather book with gold corners and a gold cannabis leaf
	(a "majablad", leaf.ts) on its cover. Decorative: the reel's label says the symbols.
-->
<script lang="ts">
	import type { BookSymbol } from '#lib/book.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';

	let { symbol, size = 56 }: { symbol: BookSymbol; size?: number } = $props();
	const uid = $props.id();
	const u = `bk-${uid}`;
	const O = '#1a0e05';
	/** The letters: text and colours (top of the gradient, middle, bottom edge). */
	const LETTERS: Partial<Record<BookSymbol, { text: string; c: [string, string, string] }>> = {
		ten: { text: '10', c: ['#b9fff4', '#2fd3c0', '#0b6f66'] },
		jack: { text: 'J', c: ['#e6ffb8', '#7dd83a', '#2f7a10'] },
		queen: { text: 'Q', c: ['#f6d6ff', '#c25cff', '#5e1a8a'] },
		king: { text: 'K', c: ['#ffe2bf', '#ff8a1a', '#9a3a00'] },
		ace: { text: 'A', c: ['#fff6c0', '#ffc928', '#a35f00'] }
	};
	const letter = $derived(LETTERS[symbol]);
	/** The gold leaf on the book's cover: leaf.ts's 24 × 24 leaf, scaled up round the cover's middle. */
	const leafAt = (cx: number, cy: number, k: number) => `translate(${cx - 12 * k} ${cy - 13 * k}) scale(${k})`;
</script>

<svg class="book-sym" data-sym={symbol} viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
	<defs>
		<linearGradient id="{u}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#a35f00" /></linearGradient>
		<radialGradient id="{u}-glow"><stop offset="0" stop-color="#ffe680" stop-opacity=".75" /><stop offset="1" stop-color="#ffb000" stop-opacity="0" /></radialGradient>
		{#if letter}
			<linearGradient id="{u}-let" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color={letter.c[0]} /><stop offset=".5" stop-color={letter.c[1]} /><stop offset="1" stop-color={letter.c[2]} /></linearGradient>
		{/if}
		{#if symbol === 'book'}
			<linearGradient id="{u}-cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f7a3a" /><stop offset=".55" stop-color="#14502a" /><stop offset="1" stop-color="#0a2c16" /></linearGradient>
		{:else if symbol === 'bong'}
			<linearGradient id="{u}-glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55" /><stop offset=".35" stop-color="#fff3c8" stop-opacity=".85" /><stop offset="1" stop-color="#c98a12" stop-opacity=".6" /></linearGradient>
			<linearGradient id="{u}-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dff8a" /><stop offset="1" stop-color="#1f8a3a" /></linearGradient>
		{:else if symbol === 'grinder'}
			<linearGradient id="{u}-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c7682" /><stop offset=".4" stop-color="#f2f6fa" /><stop offset=".7" stop-color="#a9b4bf" /><stop offset="1" stop-color="#4c5560" /></linearGradient>
			<radialGradient id="{u}-lid" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#7dff6a" /><stop offset=".6" stop-color="#2f9e45" /><stop offset="1" stop-color="#0f5a24" /></radialGradient>
		{:else if symbol === 'abscar'}
			<radialGradient id="{u}-bronze" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#ffe0a8" /><stop offset=".4" stop-color="#c98a4a" /><stop offset="1" stop-color="#5a3414" /></radialGradient>
			<radialGradient id="{u}-eye"><stop offset="0" stop-color="#fff" /><stop offset=".35" stop-color="#ff3b2b" /><stop offset="1" stop-color="#ff1a0a" stop-opacity="0" /></radialGradient>
			<radialGradient id="{u}-halo"><stop offset=".55" stop-color="#ff2a1a" stop-opacity=".0" /><stop offset=".8" stop-color="#ff2a1a" stop-opacity=".35" /><stop offset="1" stop-color="#ff2a1a" stop-opacity="0" /></radialGradient>
		{:else if symbol === 'lighter'}
			<linearGradient id="{u}-chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a949e" /><stop offset=".45" stop-color="#ffffff" /><stop offset="1" stop-color="#5c6670" /></linearGradient>
			<radialGradient id="{u}-flame" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#fff6c0" /><stop offset=".45" stop-color="#ffb020" /><stop offset="1" stop-color="#ff4a1a" /></radialGradient>
		{/if}
	</defs>

	{#if letter}
		<!-- a glossy carved letter with a soft glow behind it -->
		<circle cx="32" cy="33" r="24" fill="url(#{u}-glow)" opacity=".45" />
		<text
			x="32"
			y="47"
			text-anchor="middle"
			font-family="Bahnschrift, 'Arial Black', sans-serif"
			font-weight="900"
			font-size={letter.text.length > 1 ? 36 : 44}
			letter-spacing={letter.text.length > 1 ? -3 : 0}
			fill="url(#{u}-let)"
			stroke={O}
			stroke-width="5"
			stroke-linejoin="round"
			paint-order="stroke">{letter.text}</text
		>
		<text
			x="32"
			y="47"
			text-anchor="middle"
			font-family="Bahnschrift, 'Arial Black', sans-serif"
			font-weight="900"
			font-size={letter.text.length > 1 ? 36 : 44}
			letter-spacing={letter.text.length > 1 ? -3 : 0}
			fill="none"
			stroke="#fff"
			stroke-opacity=".45"
			stroke-width="1"
			transform="translate(-0.8 -1)">{letter.text}</text
		>
	{:else if symbol === 'lighter'}
		<!-- a rasta lighter: chrome chimney with holes, an open flame, the body in red / gold / green bands -->
		<path d="M32 3 C24 12 23 18 26 22 C27.5 24 36.5 24 38 22 C41 18 40 12 32 3 Z" fill="url(#{u}-flame)" stroke="#a32a0a" stroke-width="1.6" />
		<path d="M32 10 C29 15 29 18 30.5 20 C31.5 21 33.5 21 34 20 C35 18 35 15 32 10 Z" fill="#fff8d8" opacity=".8" />
		<rect x="22" y="20" width="20" height="11" rx="2" fill="url(#{u}-chrome)" stroke={O} stroke-width="2.2" />
		{#each [25, 29.5, 34, 38.5] as x (x)}<circle cx={x + 0.5} cy="25.5" r="1.4" fill="#2a2f36" />{/each}
		<rect x="17" y="30" width="30" height="28" rx="4" fill="#e2261f" stroke={O} stroke-width="2.6" />
		<rect x="18.4" y="39" width="27.2" height="9" fill="#ffc928" />
		<rect x="18.4" y="48" width="27.2" height="8.6" rx="2.6" fill="#2f9e45" />
		<rect x="17" y="30" width="30" height="28" rx="4" fill="none" stroke={O} stroke-width="2.6" />
		<path d="M20 33 V54" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-linecap="round" />
		<rect x="46" y="31" width="4" height="7" rx="1.6" fill="url(#{u}-chrome)" stroke={O} stroke-width="1.4" />
	{:else if symbol === 'grinder'}
		<!-- a grinder from the side: green lid with a gold leaf, knurled edge, steel body with grip ridges -->
		<path d="M10 24 V44 C10 50 20 54 32 54 C44 54 54 50 54 44 V24 Z" fill="url(#{u}-steel)" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<path d="M10 34 C10 40 20 43 32 43 C44 43 54 40 54 34" fill="none" stroke={O} stroke-width="1.8" />
		{#each [16, 22, 28, 34, 40, 46] as x (x)}<path d="M{x} {x < 20 || x > 44 ? 40 : 42} V{x < 20 || x > 44 ? 48 : 51}" stroke="#3a424c" stroke-width="1.3" opacity=".7" />{/each}
		<ellipse cx="32" cy="24" rx="22" ry="10" fill="url(#{u}-lid)" stroke={O} stroke-width="2.6" />
		<ellipse cx="32" cy="24" rx="22" ry="10" fill="none" stroke="#b9ffb0" stroke-width="1.4" stroke-dasharray="1.6 2.4" opacity=".7" />
		<g transform="translate(32 24) scale(1 0.5) translate(-32 -24)">
			<g transform={leafAt(32, 24, 1.05)} fill="url(#{u}-gold)" stroke="#5a3a00" stroke-width=".7" stroke-linejoin="round">
				{#each LEAF_PATHS as d (d)}<path {d} />{/each}
			</g>
		</g>
		<path d="M14 20 C18 17 24 15.6 30 15.4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round" />
	{:else if symbol === 'bong'}
		<!-- a gold-ringed glass bong: round flask with green water, tall neck, a bowl on its stem with an ember, smoke -->
		<path d="M30 4 C27 1 24 6 27 8" fill="none" stroke="#e8f0e8" stroke-width="2" stroke-linecap="round" opacity=".7" />
		<path d="M35 3 C38 0 41 4 38 7" fill="none" stroke="#e8f0e8" stroke-width="1.6" stroke-linecap="round" opacity=".55" />
		<path d="M26 8 H38 V34 C46 36 50 42 50 48 C50 56 42 61 32 61 C22 61 14 56 14 48 C14 42 18 36 26 34 Z" fill="url(#{u}-glass)" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<path d="M15.6 49 C17 57 24 59.6 32 59.6 C40 59.6 47 57 48.4 49 C43 51.4 21 51.4 15.6 49 Z" fill="url(#{u}-water)" opacity=".9" />
		{#each [[24, 54, 1.6], [30, 56, 1.1], [38, 53.6, 1.4], [43, 55.4, 1]] as [x, y, r] (`${x}`)}<circle cx={x} cy={y} {r} fill="#e9ffe8" opacity=".8" />{/each}
		<rect x="24.6" y="7" width="14.8" height="4" rx="1.6" fill="url(#{u}-gold)" stroke={O} stroke-width="1.6" />
		<rect x="25.2" y="28" width="13.6" height="3.4" rx="1.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1.4" />
		<path d="M28 13 V31 M28.6 38 C24 41 21 44 20 48" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-linecap="round" fill="none" />
		<!-- the stem and bowl, out to the left -->
		<path d="M21 46 L10 37" stroke={O} stroke-width="5" stroke-linecap="round" />
		<path d="M21 46 L10 37" stroke="url(#{u}-gold)" stroke-width="2.6" stroke-linecap="round" />
		<path d="M4 33 L16 33 L12.6 40 L7.4 40 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
		<ellipse cx="10" cy="33" rx="5.6" ry="1.8" fill="#ff6a1a" stroke="#7a1a00" stroke-width=".8" />
		<circle cx="10" cy="32.6" r="1.6" fill="#fff2a0" />
	{:else if symbol === 'abscar'}
		<!-- Abscar: the bronze cyborg skull with glowing red eyes and a holk in the corner of the mouth -->
		<circle cx="30" cy="30" r="30" fill="url(#{u}-halo)" />
		<path d="M30 6 C17 6 10 15 10 26 C10 33 13 37 16 40 L17 46 H43 L44 40 C47 37 50 33 50 26 C50 15 43 6 30 6 Z" fill="url(#{u}-bronze)" stroke={O} stroke-width="2.6" stroke-linejoin="round" />
		<!-- seams and a red sensor strip across the brow -->
		<path d="M30 7 V18 M14 22 C20 20 40 20 46 22" fill="none" stroke="#5a3414" stroke-width="1.3" opacity=".8" />
		<path d="M18 19.6 H42" stroke="#ff3b2b" stroke-width="1.4" stroke-linecap="round" opacity=".85" />
		<path d="M14 26 C14 22 18 21 23 22 C26 23 27 27 26 30 C25 33 20 34 17 32 C15 31 14 29 14 26 Z" fill="#140806" stroke={O} stroke-width="1.6" />
		<path d="M46 26 C46 22 42 21 37 22 C34 23 33 27 34 30 C35 33 40 34 43 32 C45 31 46 29 46 26 Z" fill="#140806" stroke={O} stroke-width="1.6" />
		<circle class="bk-eye" cx="20.4" cy="27.4" r="5.4" fill="url(#{u}-eye)" />
		<circle class="bk-eye" cx="39.6" cy="27.4" r="5.4" fill="url(#{u}-eye)" />
		<path d="M28 34 L30 39 L32 34 Z" fill="#140806" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
		<!-- the jaw: a steel plate with teeth -->
		<path d="M16 40 C18 50 24 54 30 54 C36 54 42 50 44 40" fill="#8a6a44" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
		<path d="M18 43 H42" stroke={O} stroke-width="1.6" />
		{#each [21, 25, 29, 33, 37] as x (x)}<rect x={x} y="40.4" width="3.2" height="4.6" rx=".8" fill="#fff6e0" stroke={O} stroke-width=".9" />{/each}
		<!-- the holk: white paper widening out to a glowing end, a little smoke -->
		<path d="M38 45.6 L57 51.4 L55.6 57 L37 48.6 Z" fill="#fbf8ee" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M38 45.6 L41.4 46.6 L40.6 49.8 L37 48.6 Z" fill="#c9a26a" stroke={O} stroke-width="1" />
		<ellipse cx="56.4" cy="54.2" rx="1.6" ry="3" transform="rotate(18 56.4 54.2)" fill="#ff6a1a" stroke="#7a1a00" stroke-width=".8" />
		<circle cx="56.6" cy="54" r="1.1" fill="#fff2a0" />
		<path d="M58 49 C61 45 57 42 60 38 M60 50 C63 47 61 44 63 41" fill="none" stroke="#e8e4dc" stroke-width="1.6" stroke-linecap="round" opacity=".75" />
	{:else}
		<!-- THE BOOK: green leather, gold corners and border, a gold cannabis leaf on the cover, pages on the side -->
		<circle cx="32" cy="32" r="31" fill="url(#{u}-glow)" opacity=".7" />
		<path d="M14 9 H52 L55 12 V57 L52 60 H14 Z" fill="#f6ecd0" stroke={O} stroke-width="2" stroke-linejoin="round" />
		{#each [14, 22, 30, 38, 46, 54] as y (y)}<path d="M52.6 {y} H54.4" stroke="#b9a77a" stroke-width=".8" />{/each}
		<rect x="9" y="6" width="43" height="52" rx="3" fill="url(#{u}-cover)" stroke={O} stroke-width="2.6" />
		<!-- the spine -->
		<rect x="9" y="6" width="7" height="52" rx="2" fill="#0a2c16" stroke={O} stroke-width="1.6" />
		<path d="M9.6 13 H15.4 M9.6 51 H15.4" stroke="url(#{u}-gold)" stroke-width="2" />
		<!-- gold border and corners -->
		<rect x="19" y="10" width="29.6" height="44" rx="1.6" fill="none" stroke="url(#{u}-gold)" stroke-width="1.6" />
		<path d="M41 6 H52 V17 Z M41 58 H52 V47 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.4" stroke-linejoin="round" />
		<path d="M16 6 H24 L16 14 Z M16 58 H24 L16 50 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
		<!-- the majablad -->
		<g transform={leafAt(33.8, 33, 1.32)} fill="url(#{u}-gold)" stroke="#5a3a00" stroke-width=".9" stroke-linejoin="round">
			{#each LEAF_PATHS as d (d)}<path {d} />{/each}
			<path d={LEAF_STEM} fill="none" stroke="url(#{u}-gold)" stroke-width="1.4" stroke-linecap="round" />
		</g>
		<path d="M21 12 L46 12" stroke="#fff6b0" stroke-opacity=".35" stroke-width="1.4" />
	{/if}
</svg>

<style>
	.book-sym {
		display: block;
		overflow: visible;
	}
	.bk-eye {
		animation: bk-eye 1.6s ease-in-out infinite alternate;
	}
	@keyframes bk-eye {
		to {
			opacity: 0.6;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bk-eye {
			animation: none;
		}
	}
</style>
