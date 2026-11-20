<!--
	The pictures on BurgiCasino's game tabs (2026-11-16, the user's ask: "tidy up the tabs in the casino,
	e.g. BurgiBank can have a big bank, so everything shows what it is beyond text"): Abscar's Fortune =
	a little red slot machine with burgers on its reels and a holk for a lever, roulette = the wheel seen
	from above, blackjack = an ace and a king fanned out with a chip stack, BurgiShop = a shopping bag
	with a burger on it, BurgiBank = a big bank with columns and a burger coin in its gable.
	Mybots 5 (Abscar's Fortune II until 2026-11-20; 2026-11-19) = a purple neon cabinet with a green "5" marquee,
	a 3 × 3 board in the squad's munchie
	colours, a gold star in the middle and a frag beside it.
	Abscar's Stash (2026-11-20) = an open wooden stash box full of the slot's symbols, a ×10 smoke cloud on top.
	Admin (Abscar's control room, 2026-11-19) = a mixing desk: a screen showing 777, three slider knobs
	and a big red button.
	Donations (BurgiGives, 2026-11-20) = a glass donation jar full of burgers and burger coins, a heart on
	its label, a burger coin dropping into the slot in its gold lid.
	Book Of Skedd (2026-11-20) = the green leather book with gold corners and the gold cannabis leaf on its
	cover, glowing, with sparkles (the halo breathes on the selected tab).
	Kushburst (2026-11-20) = a violet blacklight cabinet in pink and green neon, a glowing leaf grown over
	the middle reel (its rays turn on the selected tile), little neon symbols on the reels beside it.
	Skeddwood (2026-11-20) = Abscar's bronze skull in a cowboy hat with red eyes and the holk, a sunset behind
	him and a sheriff star; the selected tab tips his hat.
	Our own chunky cartoons in the Burger Bandit's style (SlotSymbol.svelte). Decorative: the tab says
	its name in words. The selected tab's picture moves a little (the wheel turns, the bulbs blink …).
-->
<script module lang="ts">
	export type CasinoTab = 'slots' | 'fortune2' | 'book' | 'kushburst' | 'stash' | 'skeddwood' | 'roulette' | 'blackjack' | 'shop' | 'bank' | 'donate' | 'admin';
</script>

<script lang="ts">
	import { holk } from '#lib/abscarOperator.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';

	let { kind, size = 64 }: { kind: CasinoTab; size?: number } = $props();
	const uid = $props.id();
	const u = `cta-${uid}`;
	const O = '#2a1408';

	/** Roulette: 13 pockets round the wheel, the first green, then red / black. */
	const POCKETS = Array.from({ length: 13 }, (_, i) => {
		const a0 = ((i * 360) / 13 - 90) * (Math.PI / 180);
		const a1 = (((i + 1) * 360) / 13 - 90) * (Math.PI / 180);
		const p = (r: number, a: number) => `${(32 + r * Math.cos(a)).toFixed(2)} ${(28 + r * Math.sin(a)).toFixed(2)}`;
		return { d: `M${p(11, a0)} L${p(20, a0)} A20 20 0 0 1 ${p(20, a1)} L${p(11, a1)} A11 11 0 0 0 ${p(11, a0)} Z`, fill: i === 0 ? '#1f9a4a' : i % 2 ? '#d8261f' : '#151515' };
	});
	/** A tiny burger for the slot machine's reels, centred on (x, y). */
	const burger = (x: number, y: number, gold = false) => {
		const bun = gold ? '#ffc928' : '#f0a24a';
		return `<path d="M${x - 3.4} ${y - 0.4} q0 -3.6 3.4 -3.6 q3.4 0 3.4 3.6 z" fill="${bun}" stroke="${O}" stroke-width=".7"/><rect x="${x - 3.6}" y="${y - 0.2}" width="7.2" height="1.1" fill="#4fb23a"/><rect x="${x - 3.4}" y="${y + 0.9}" width="6.8" height="1.5" rx=".6" fill="#6b3a1c"/><path d="M${x - 3.2} ${y + 2.5} h6.4 q0 1.8 -1.8 1.8 h-2.8 q-1.8 0 -1.8 -1.8 z" fill="${bun}" stroke="${O}" stroke-width=".7"/>`;
	};
</script>

<svg class="ta" data-kind={kind} viewBox="0 0 64 56" width={size} height={size * (56 / 64)} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{u}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></linearGradient>
		<linearGradient id="{u}-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2343a" /><stop offset=".7" stop-color="#9a0d14" /><stop offset="1" stop-color="#5a060b" /></linearGradient>
		<linearGradient id="{u}-marble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9b2a4" /><stop offset=".35" stop-color="#fffaf0" /><stop offset=".7" stop-color="#e2dccd" /><stop offset="1" stop-color="#9a9384" /></linearGradient>
		<linearGradient id="{u}-bag" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#b265ff" /><stop offset=".6" stop-color="#7a2fc8" /><stop offset="1" stop-color="#4a1580" /></linearGradient>
		<radialGradient id="{u}-wood" cx=".5" cy=".5" r=".5"><stop offset=".78" stop-color="#8a4a1c" /><stop offset=".9" stop-color="#5a2a0c" /><stop offset="1" stop-color="#3a1806" /></radialGradient>
		<radialGradient id="{u}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		{#if kind === 'book'}
			<linearGradient id="{u}-cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f7a3a" /><stop offset=".55" stop-color="#14502a" /><stop offset="1" stop-color="#0a2c16" /></linearGradient>
			<radialGradient id="{u}-halo"><stop offset="0" stop-color="#ffe680" stop-opacity=".85" /><stop offset="1" stop-color="#ffb000" stop-opacity="0" /></radialGradient>
		{:else if kind === 'skeddwood'}
			<radialGradient id="{u}-sun" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#ffd23a" /><stop offset=".5" stop-color="#ff6a2a" /><stop offset="1" stop-color="#b3141b" stop-opacity="0" /></radialGradient>
			<linearGradient id="{u}-bronze" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#fff0c4" /><stop offset=".25" stop-color="#d9ac62" /><stop offset=".55" stop-color="#7a5326" /><stop offset=".8" stop-color="#e0b874" /><stop offset="1" stop-color="#5b3c18" /></linearGradient>
		{/if}
	</defs>

	{#if kind === 'slots'}
		<!-- the lever: a small holk on a chrome knuckle, glowing end up -->
		<rect x="49.5" y="34" width="6" height="7" rx="2" fill="#c9d3dc" stroke={O} stroke-width="1" />
		{@html holk(u, 52.6, 36, 55.8, 10.5, 2.6, 6.4)}
		<!-- cabinet, marquee with bulbs, reel window with burgers (a gold WILD in the middle), tray -->
		<rect x="7" y="13" width="43" height="40" rx="5" fill="url(#{u}-red)" stroke={O} stroke-width="1.6" />
		<path d="M7 16 Q7 4 28.5 4 Q50 4 50 16 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<g class="ta-bulbs">
			{#each [12, 18.5, 25, 32, 38.5, 45] as x, i (x)}<circle cx={x} cy={i === 0 || i === 5 ? 12.4 : 9.4} r="1.5" fill="#fff6d0" stroke="#7a4a00" stroke-width=".5" />{/each}
		</g>
		<rect x="10.5" y="18.5" width="36" height="17" rx="2.5" fill="#120302" stroke="#e0a400" stroke-width="1.2" />
		{#each [12.2, 24, 35.8] as x (x)}<rect {x} y="20" width="9.6" height="14" rx="1.4" fill="#fffaf0" />{/each}
		{@html burger(17, 27.6) + burger(28.8, 27.6, true) + burger(40.6, 27.6)}
		<path d="M10.5 27 H46.5" stroke="#ff4b2b" stroke-width=".8" opacity=".7" />
		<circle cx="17" cy="41" r="2.6" fill="#ffd23a" stroke={O} stroke-width="1" /><circle cx="25" cy="41" r="2.6" fill="#ff5ca8" stroke={O} stroke-width="1" />
		<rect x="34" y="39.6" width="9" height="2.6" rx="1.3" fill="#120302" />
		<rect x="12" y="45.5" width="33" height="5" rx="1.6" fill="#3d0508" stroke={O} stroke-width="1" />
		<ellipse cx="22" cy="47.6" rx="2.4" ry="1" fill="url(#{u}-gold)" /><ellipse cx="27" cy="48" rx="2.4" ry="1" fill="url(#{u}-gold)" />
	{:else if kind === 'fortune2'}
		<!-- Abscar's Fortune II: a purple neon cabinet, a green "II" marquee, a 3 × 3 board of the squad's
		     munchie colours with a gold WILD star in the middle, a frag with a lit spark on the side -->
		<rect x="8" y="11" width="44" height="42" rx="5" fill="#3a1468" stroke={O} stroke-width="1.6" />
		<path d="M8 15 Q8 4 30 4 Q52 4 52 15 Z" fill="#160626" stroke="#7dff6a" stroke-width="1.6" stroke-linejoin="round" />
		<g class="ta-bulbs">
			{#each [14, 21, 39, 46] as x, i (x)}<circle cx={x} cy={i === 0 || i === 3 ? 12 : 8.6} r="1.4" fill="#b9ffb0" stroke="#1f6a18" stroke-width=".5" />{/each}
		</g>
		<text x="30" y="13.4" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="9" fill="#7dff6a" stroke="#0a2a06" stroke-width=".6" paint-order="stroke">5</text>
		<rect x="11.5" y="17" width="37" height="31" rx="3" fill="#0b0414" stroke="#ffc928" stroke-width="1.2" />
		{#each [0, 1, 2] as row (row)}
			{#each [0, 1, 2] as col (col)}
				{@const i = row * 3 + col}
				{#if i !== 4}
					<rect x={13.6 + col * 11.4} y={18.6 + row * 9.6} width="10" height="8.4" rx="2" fill={['#e23a2e', '#f2a91c', '#2d8cf0', '#9b4be6'][(i * 3 + 1) % 4]} stroke={O} stroke-width=".8" />
					<rect x={14.6 + col * 11.4} y={19.4 + row * 9.6} width="8" height="2" rx="1" fill="#fff" opacity=".3" />
				{/if}
			{/each}
		{/each}
		<path class="ta-star" d="M30 26.6 L31.7 30 L35.4 30.3 L32.6 32.6 L33.5 36.2 L30 34.2 L26.5 36.2 L27.4 32.6 L24.6 30.3 L28.3 30 Z" fill="url(#{u}-gold)" stroke={O} stroke-width=".8" stroke-linejoin="round" />
		<ellipse cx="56" cy="44" rx="5" ry="6" fill="#5f7a2a" stroke={O} stroke-width="1.2" />
		<path d="M51.6 42 H60.4 M51.4 45.6 H60.6 M56 38 V50" stroke="#3e5418" stroke-width=".8" />
		<rect x="53.6" y="36" width="5" height="3" rx="1" fill="#9aa6b2" stroke={O} stroke-width=".9" />
		<g class="ta-spark" fill="#fff36a"><path d="M59 30.5 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 z" /></g>
	{:else if kind === 'book'}
		<!-- Book Of Skedd: the glowing green book with gold corners and the gold leaf, pages on the side, sparkles -->
		<circle class="ta-halo" cx="32" cy="28" r="27" fill="url(#{u}-halo)" />
		<path d="M18 7 H48 L51 10 V51 L48 54 H18 Z" fill="#f6ecd0" stroke={O} stroke-width="1.4" stroke-linejoin="round" />
		{#each [14, 22, 30, 38, 46] as y (y)}<path d="M48.6 {y} H50.4" stroke="#b9a77a" stroke-width=".7" />{/each}
		<rect x="13" y="4" width="35" height="48" rx="2.6" fill="url(#{u}-cover)" stroke={O} stroke-width="1.8" />
		<rect x="13" y="4" width="6" height="48" rx="1.6" fill="#0a2c16" stroke={O} stroke-width="1.2" />
		<path d="M13.6 10 H18.4 M13.6 46 H18.4" stroke="url(#{u}-gold)" stroke-width="1.6" />
		<rect x="21.6" y="7.6" width="23.4" height="40.8" rx="1.2" fill="none" stroke="url(#{u}-gold)" stroke-width="1.2" />
		<path d="M38 4 H48 V14 Z M38 52 H48 V42 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<g transform="translate(19.4 13.4) scale(1.16)" fill="url(#{u}-gold)" stroke="#5a3a00" stroke-width=".7" stroke-linejoin="round">
			{#each LEAF_PATHS as d (d)}<path {d} />{/each}
			<path d={LEAF_STEM} fill="none" stroke="url(#{u}-gold)" stroke-width="1.2" stroke-linecap="round" />
		</g>
		<g class="ta-spark" fill="#fff6b0">
			<path d="M54 8 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" />
			<path d="M7 38 l.8 2.2 l2.2 .8 l-2.2 .8 l-.8 2.2 l-.8 -2.2 l-2.2 -.8 l2.2 -.8 z" />
		</g>
	{:else if kind === 'kushburst'}
		<!-- Kushburst: a violet cabinet with pink + green neon edges, a "KUSH" marquee, three reels: a tall
		     glowing leaf over the middle one, small neon symbols on the outer ones; ◀ ▶ = pays both ways -->
		<rect x="8" y="11" width="46" height="42" rx="5" fill="#1d0840" stroke={O} stroke-width="1.6" />
		<rect x="9.6" y="12.6" width="42.8" height="38.8" rx="4" fill="none" stroke="#ff3fb4" stroke-width="1" />
		<path d="M8 15 Q8 4 31 4 Q54 4 54 15 Z" fill="#0e0420" stroke="#8dff5a" stroke-width="1.5" stroke-linejoin="round" />
		<text class="ta-neon" x="31" y="13" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7.4" letter-spacing=".6" fill="#eaffd8" stroke="#3aff6a" stroke-width=".5" paint-order="stroke">KUSH</text>
		<rect x="11.5" y="18" width="39" height="25" rx="2.5" fill="#07020f" stroke="#ff3fb4" stroke-width="1.2" />
		{#each [13.2, 39] as x (x)}<rect {x} y="19.6" width="10" height="21.8" rx="1.4" fill="#24094a" />{/each}
		<!-- the outer reels: a pink lighter, a cyan grinder; orange papers, a purple bong -->
		<rect x="15.8" y="21.4" width="4.6" height="7" rx="1.2" fill="#ff3fb4" stroke={O} stroke-width=".7" />
		<rect x="16.2" y="20" width="3.8" height="2" rx=".5" fill="#c9d3dc" stroke={O} stroke-width=".5" />
		<ellipse cx="18.2" cy="34.6" rx="3.6" ry="1.5" fill="#5feaff" stroke={O} stroke-width=".7" />
		<path d="M14.6 34.6 V37.6 Q18.2 40 21.8 37.6 V34.6" fill="#0f9cc8" stroke={O} stroke-width=".7" />
		<rect x="41.2" y="22" width="5.8" height="6.6" rx=".8" fill="#ff8a1a" stroke={O} stroke-width=".7" />
		<path d="M41.8 22 V20.4 H46.4 V22" fill="#fffaf0" stroke={O} stroke-width=".5" />
		<path d="M42.8 31.6 H45.4 V35 Q48 36.4 47.6 38.6 Q47 40.6 44.1 40.6 Q41.2 40.6 40.6 38.6 Q40.2 36.4 42.8 35 Z" fill="#b65cff" stroke={O} stroke-width=".7" />
		<!-- the middle reel: a leaf column with rays -->
		<rect x="26" y="19.2" width="10.4" height="22.6" rx="1.6" fill="#0f5a40" stroke="#8dff5a" stroke-width="1" />
		<clipPath id="{u}-kcol"><rect x="26" y="19.2" width="10.4" height="22.6" rx="1.6" /></clipPath>
		<g clip-path="url(#{u}-kcol)">
			<g class="ta-rays" opacity=".55">
				{#each [0, 45, 90, 135] as a (a)}<rect x="30.7" y="21" width="1" height="19" fill={a % 90 ? '#ff7ad9' : '#b6ff7a'} transform="rotate({a} 31.2 30.5)" />{/each}
			</g>
		</g>
		<g class="ta-leaf" transform="translate(31.2 30.2) scale(.66) translate(-12 -15.5)">
			{#each LEAF_PATHS as d, i (i)}<path {d} fill="#8dff5a" stroke="#0b3d14" stroke-width=".7" stroke-linejoin="round" />{/each}
		</g>
		<path d="M5 30.5 L9 27.8 V33.2 Z M58 30.5 L54 27.8 V33.2 Z" fill="#8dff5a" stroke={O} stroke-width=".6" stroke-linejoin="round" />
		<circle cx="22" cy="47.6" r="2.8" fill="#8dff5a" stroke={O} stroke-width="1" />
		<rect x="28" y="46.2" width="18" height="2.8" rx="1.4" fill="#07020f" stroke="#4a1a7a" stroke-width=".6" />
	{:else if kind === 'skeddwood'}
		<!-- Skeddwood: a sunset, Abscar's bronze skull in a cowboy hat (red eyes, the holk), a sheriff star -->
		<circle cx="32" cy="30" r="24" fill="url(#{u}-sun)" />
		<path d="M4 46 C14 42 22 44 30 42 C40 40 50 44 60 42 L60 54 H4 Z" fill="#3a1e0c" />
		<path d="M19 32 C18 22 24 17 32 17 C40 17 46 22 45 32 L44 36 C43.4 38.4 42 39.4 40.4 39.6 L40 46 C37.6 48 26.4 48 24 46 L23.6 39.6 C22 39.4 20.6 38.4 20 36 Z" fill="url(#{u}-bronze)" stroke={O} stroke-width="1.3" />
		<path d="M21.6 29.4 L29.4 29 L29.6 33.6 L26.4 35.6 L22.2 34 Z" fill="#050302" /><path d="M42.4 29.4 L34.6 29 L34.4 33.6 L37.6 35.6 L41.8 34 Z" fill="#050302" />
		<circle class="ta-eye" cx="25.8" cy="32" r="1.8" fill="#ff3a3a" /><circle class="ta-eye" cx="38.2" cy="32" r="1.8" fill="#ff3a3a" />
		<path d="M31 36 L33 36 L32.6 38.6 L32 39.2 L31.4 38.6 Z" fill="#050302" />
		<rect x="25" y="40.4" width="14" height="3.4" fill="#0b0703" />
		{#each [26, 28.4, 30.8, 33.2, 35.6] as x (x)}<rect {x} y="40.6" width="1.8" height="2.6" rx=".4" fill="#efe2c4" />{/each}
		{@html holk(u, 37.6, 42, 54, 46, 1.6, 4.4)}
		<g class="ta-hat">
			<path d="M21 24 C20 16 23 9 27 8 C29 7.4 30.6 9 32 9 C33.4 9 35 7.4 37 8 C41 9 44 16 43 24 Z" fill="#6b4325" stroke={O} stroke-width="1.3" />
			<path d="M21.4 20.6 C27 22.4 37 22.4 42.6 20.6 L43 24 C37 25.8 27 25.8 21 24 Z" fill="#b3141b" stroke={O} stroke-width=".8" />
			<path d="M5 25 C9 21 17 23 23 24 C28 25 36 25 41 24 C47 23 55 21 59 25 C55 29 47 27 41 28 C36 28.6 28 28.6 23 28 C17 27 9 29 5 25 Z" fill="#7a4a24" stroke={O} stroke-width="1.3" />
		</g>
		<path class="ta-star" d="M11 40 L12.6 43.4 L16.2 43.6 L13.4 46 L14.4 49.6 L11 47.6 L7.6 49.6 L8.6 46 L5.8 43.6 L9.4 43.4 Z" fill="url(#{u}-gold)" stroke={O} stroke-width=".8" stroke-linejoin="round" />
	{:else if kind === 'roulette'}
		<!-- the wheel from above: wooden bowl, red / black pockets with one green, gold turret, the ball -->
		<ellipse cx="32" cy="50" rx="22" ry="3.4" fill="#000" opacity=".35" />
		<circle cx="32" cy="28" r="25" fill="url(#{u}-wood)" stroke={O} stroke-width="1.6" />
		<g class="ta-wheel">
			{#each POCKETS as p, i (i)}<path d={p.d} fill={p.fill} stroke="#e6c35a" stroke-width=".6" />{/each}
			<circle cx="32" cy="28" r="11" fill="#5a2a0c" stroke="#e6c35a" stroke-width=".8" />
			<circle cx="32" cy="28" r="7" fill="url(#{u}-gold)" stroke={O} stroke-width="1" />
			<path d="M32 19.5 V36.5 M23.5 28 H40.5" stroke="url(#{u}-gold)" stroke-width="2.4" stroke-linecap="round" />
			<circle cx="32" cy="28" r="2.4" fill="#fff6b0" stroke={O} stroke-width=".8" />
		</g>
		<circle cx="45.6" cy="16.6" r="2.4" fill="#fff" stroke={O} stroke-width=".8" />
		<circle cx="45" cy="16" r=".8" fill="#fff" opacity=".9" />
	{:else if kind === 'blackjack'}
		<!-- a king of hearts and the ace of spades fanned out: 21; a stack of chips beside them -->
		<g transform="rotate(-13 27 30)">
			<rect x="15" y="11" width="21" height="30" rx="2.6" fill="#fffaf0" stroke={O} stroke-width="1.4" />
			<text x="17.6" y="19" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7" fill="#d8261f">K</text>
			<path d="M25.5 33 C21 29.6 20.4 27.4 20.4 25.8 C20.4 24 21.8 22.8 23.2 22.8 C24.4 22.8 25.1 23.6 25.5 24.4 C25.9 23.6 26.6 22.8 27.8 22.8 C29.2 22.8 30.6 24 30.6 25.8 C30.6 27.4 30 29.6 25.5 33 Z" fill="#d8261f" />
		</g>
		<!-- (the rotation sits on an outer group: a CSS animation on the same element would replace it) -->
		<g transform="rotate(11 38 28)">
			<g class="ta-card">
				<rect x="27" y="9" width="21" height="30" rx="2.6" fill="#fffaf0" stroke={O} stroke-width="1.4" />
				<text x="29.6" y="17" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7" fill="#151515">A</text>
				<path d="M37.5 18.5 C34 22.4 31.8 24.4 31.8 27 C31.8 29 33.4 30.2 35 30.2 C35.9 30.2 36.6 29.8 37 29.2 C36.8 31 36.2 32.4 35 33.4 H40 C38.8 32.4 38.2 31 38 29.2 C38.4 29.8 39.1 30.2 40 30.2 C41.6 30.2 43.2 29 43.2 27 C43.2 24.4 41 22.4 37.5 18.5 Z" fill="#151515" />
			</g>
		</g>
		{#each [50, 46.4, 42.8] as y, i (y)}
			<ellipse cx="13" cy={y} rx="9" ry="3.4" fill={i === 2 ? '#2f7fe0' : '#d8261f'} stroke={O} stroke-width="1.1" />
			<ellipse cx="13" cy={y} rx="9" ry="3.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2.4 3.2" />
		{/each}
		<ellipse cx="13" cy="42.8" rx="5" ry="1.8" fill="none" stroke="#fff" stroke-width=".6" opacity=".7" />
		<text x="55" y="50" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="9" fill="#ffd23a" stroke={O} stroke-width=".6" paint-order="stroke">21</text>
	{:else if kind === 'shop'}
		<!-- a shopping bag with gold handles and a burger badge, a price tag, sparkles -->
		<path d="M24 19 C24 9 40 9 40 19" fill="none" stroke={O} stroke-width="4.4" stroke-linecap="round" />
		<path d="M24 19 C24 9 40 9 40 19" fill="none" stroke="url(#{u}-gold)" stroke-width="2.4" stroke-linecap="round" />
		<path d="M14 18 H50 L53 52 H11 Z" fill="url(#{u}-bag)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M14 18 H50 L50.5 23 H13.5 Z" fill="#4a1580" opacity=".55" />
		<circle cx="24" cy="21" r="1.4" fill="#2a0a40" /><circle cx="40" cy="21" r="1.4" fill="#2a0a40" />
		<circle cx="32" cy="36" r="9" fill="#fffaf0" stroke={O} stroke-width="1.2" />
		<g transform="translate(32 35) scale(1.5) translate(-32 -35)">{@html burger(32, 35)}</g>
		<path d="M7 26 L15 22 L18.4 28.6 L10.4 32.6 Z" fill="#ffd23a" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<circle cx="10.4" cy="27.8" r=".9" fill={O} />
		<g class="ta-spark" fill="#fff6b0">
			<path d="M52 8 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" />
			<path d="M57 22 l.7 2 l2 .7 l-2 .7 l-.7 2 l-.7 -2 l-2 -.7 l2 -.7 z" />
		</g>
	{:else if kind === 'stash'}
		<!-- Abscar's Stash (2026-11-20): an open wooden stash box, lid up behind, full of the slot's symbols (a
		     bud, a red mushroom, a red heart pill, a blue star pill), a smoke cloud with ×10 drifting off the top -->
		<path d="M9 31 L13 9 L51 9 L55 31 Z" fill="#5a2e10" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M13.4 28.5 L16.2 12.4 L47.8 12.4 L50.6 28.5 Z" fill="#7a4220" />
		<path d="M17 15 H47" stroke="#9a5a2a" stroke-width="1" />
		{#each [[18, 28, 6, 5], [26, 27, 5.5, 5], [22, 22.5, 5, 4.5]] as [x, y, rx, ry], i (i)}<ellipse cx={x} cy={y} rx={rx} ry={ry} fill={['#3fa63f', '#4fb846', '#6fd65a'][i]} stroke={O} stroke-width="1.1" />{/each}
		<path d="M19 27 q1.5 -1 1 -2.5 M25 25.5 q1.5 -1 1 -2.5" fill="none" stroke="#ff9a2e" stroke-width=".9" stroke-linecap="round" />
		<path d="M34 33 Q35.4 28.6 35 25" stroke="#fff3dc" stroke-width="3.4" stroke-linecap="round" />
		<path d="M28.4 26 Q28.4 18.6 35.2 18.6 Q42 18.6 42 26 Q35.2 28 28.4 26 Z" fill="#e6262e" stroke={O} stroke-width="1.1" />
		<circle cx="33" cy="22.4" r="1.3" fill="#fffaf0" /><circle cx="37.8" cy="21.8" r="1.1" fill="#fffaf0" /><circle cx="39.8" cy="24.6" r=".9" fill="#fffaf0" />
		<path d="M48 34 Q40.4 28.8 40.4 24.4 Q40.4 20.4 43.8 20.4 Q46.4 20.4 48 23 Q49.6 20.4 52.2 20.4 Q55.6 20.4 55.6 24.4 Q55.6 28.8 48 34 Z" fill="#ff3b5c" stroke={O} stroke-width="1.1" />
		<circle cx="12.5" cy="30" r="5" fill="#3d8bff" stroke={O} stroke-width="1.1" />
		<path d="M12.5 26.8 l.9 2.1 l2.3 .2 l-1.8 1.5 l.6 2.2 l-2 -1.2 l-2 1.2 l.6 -2.2 l-1.8 -1.5 l2.3 -.2 z" fill="#dbeaff" />
		<path d="M5 31 H59 L56 52 H8 Z" fill="url(#{u}-stashwood)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M5 31 H59 L58.6 34 H5.4 Z" fill="#b8763a" stroke={O} stroke-width="1" stroke-linejoin="round" />
		<path d="M10 40 H54 M11 46 H53" stroke="#4a240c" stroke-width=".8" opacity=".6" />
		<rect x="28" y="36" width="8" height="7" rx="1.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1" />
		<circle cx="32" cy="39.6" r="1.2" fill="#5a2e10" />
		<defs><linearGradient id="{u}-stashwood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5a28" /><stop offset="1" stop-color="#4e260c" /></linearGradient></defs>
		<g class="ta-cloud">
			<path d="M45 18 Q40.5 18 41 14.2 Q41.5 11 45 11.6 Q45.4 6.6 50.2 7 Q53 3.6 57 5.6 Q61.6 6.2 61 10.6 Q63.8 11.6 63 14.8 Q62.2 18 59 18 Z" fill="#c69cff" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
			<text x="52.2" y="15.6" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7" fill="#fff" stroke={O} stroke-width=".5" paint-order="stroke">×10</text>
		</g>
	{:else if kind === 'admin'}
		<!-- Abscar's control room: a desk with a screen (777), three slider knobs and a big red button -->
		<path d="M4 30 H60 L63 52 H1 Z" fill="#3a3f48" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M4 30 H60 L60.6 34 H3.4 Z" fill="#5a6270" />
		<rect x="11" y="4" width="42" height="22" rx="3" fill="#24272e" stroke={O} stroke-width="1.6" />
		<rect x="14" y="7" width="36" height="16" rx="1.6" fill="#140404" stroke="#ff3b3b" stroke-width=".8" />
		<text class="ta-777" x="32" y="19.6" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="11" letter-spacing="1.2" fill="#ffd23a">777</text>
		<rect x="29" y="26" width="6" height="4" fill="#24272e" stroke={O} stroke-width="1" />
		{#each [10, 19, 28] as x, i (x)}
			<rect x={x - 1} y="36" width="2" height="13" rx="1" fill="#14161a" />
			<rect class="ta-knob" style:--k={i} x={x - 3.4} y={[39, 43, 37][i]} width="6.8" height="3.6" rx="1" fill="url(#{u}-gold)" stroke={O} stroke-width=".8" />
		{/each}
		<circle cx="48" cy="42" r="8.2" fill="#6a0a10" stroke={O} stroke-width="1.4" />
		<circle cx="48" cy="40.8" r="6.6" fill="url(#{u}-red)" stroke={O} stroke-width="1" />
		<ellipse cx="45.8" cy="38.4" rx="2.4" ry="1.3" fill="#fff" opacity=".45" />
		<circle class="ta-led" cx="37" cy="34" r="1.3" fill="#7dff6a" />
	{:else if kind === 'donate'}
		<!-- BurgiGives: a glass donation jar full of burgers and burger coins, a heart on its label, a gold lid
		     with a slot, and a burger coin dropping in -->
		<ellipse cx="32" cy="53.4" rx="19" ry="2.4" fill="#000" opacity=".35" />
		<path d="M15 19 H49 V48 Q49 53 44 53 H20 Q15 53 15 48 Z" fill="#bfe6ff" fill-opacity=".22" />
		{#each [[20, 50], [27, 50.6], [35, 50.2], [43, 49.8], [24, 47.6], [40, 47.2]] as [x, y] (`${x}-${y}`)}<ellipse cx={x} cy={y} rx="4" ry="1.5" fill="url(#{u}-gold)" stroke={O} stroke-width=".6" />{/each}
		<g transform="translate(23 43) scale(1.35) translate(-23 -43)">{@html burger(23, 43)}</g>
		<g transform="translate(40.6 43.4) scale(1.35) translate(-40.6 -43.4)">{@html burger(40.6, 43.4, true)}</g>
		<g transform="translate(31.6 37.2) scale(1.3) translate(-31.6 -37.2)">{@html burger(31.6, 37.2)}</g>
		<ellipse cx="22" cy="37.6" rx="3.6" ry="1.4" fill="url(#{u}-gold)" stroke={O} stroke-width=".6" transform="rotate(-25 22 37.6)" />
		<ellipse cx="42.6" cy="37" rx="3.6" ry="1.4" fill="url(#{u}-gold)" stroke={O} stroke-width=".6" transform="rotate(20 42.6 37)" />
		<path d="M15 19 H49 V48 Q49 53 44 53 H20 Q15 53 15 48 Z" fill="none" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M18.6 23 V47" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55" />
		<path d="M45.4 25 V33" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".4" />
		<rect x="20" y="22.6" width="24" height="11" rx="2" fill="#fff6e0" stroke={O} stroke-width=".9" />
		<path d="M32 32 C27 28.6 26.6 26.6 26.6 25.6 C26.6 24.2 27.7 23.4 28.9 23.4 C30.2 23.4 31.3 24.2 32 25.4 C32.7 24.2 33.8 23.4 35.1 23.4 C36.3 23.4 37.4 24.2 37.4 25.6 C37.4 26.6 37 28.6 32 32 Z" fill="#ff3f7f" stroke="#7a0a2a" stroke-width=".8" stroke-linejoin="round" />
		<rect x="12.6" y="13" width="38.8" height="7" rx="2.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1.4" />
		<rect x="25.6" y="15.2" width="12.8" height="2.4" rx="1.2" fill="#3a1e00" />
		<g class="ta-drop">
			<circle cx="32" cy="7.6" r="4.6" fill="url(#{u}-gold)" stroke={O} stroke-width="1" />
			<g transform="translate(32 7.8) scale(.82) translate(-32 -7.8)">{@html burger(32, 7.8)}</g>
		</g>
		<g class="ta-spark" fill="#fff6b0">
			<path d="M54 22 l1 3 l3 1 l-3 1 l-1 3 l-1 -3 l-3 -1 l3 -1 z" />
			<path d="M9 30 l.7 2 l2 .7 l-2 .7 l-.7 2 l-.7 -2 l-2 -.7 l2 -.7 z" />
		</g>
	{:else}
		<!-- BurgiBank: a big bank with a gold gable (a burger coin in it), BANK on the frieze, four marble
		     columns in front of the dark hall, wide steps, and a stack of burger coins by the door -->
		<path d="M5 18.6 L32 3.6 L59 18.6 Z" fill="url(#{u}-gold)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M12 16.6 L32 6.6 L52 16.6 Z" fill="#c98a12" opacity=".55" />
		<g class="ta-coin">
			<circle cx="32" cy="12.4" r="4.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1" />
			<g transform="translate(32 12.6) scale(.8) translate(-32 -12.6)">{@html burger(32, 12.6)}</g>
		</g>
		<rect x="7" y="18.6" width="50" height="5.4" fill="url(#{u}-gold)" stroke={O} stroke-width="1.3" />
		<text x="32" y="22.9" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="4.6" letter-spacing=".9" fill="#5a2a00">BANK</text>
		<rect x="9" y="24" width="46" height="18.4" fill="#2a1a10" stroke={O} stroke-width="1.2" />
		<path d="M28 42.4 V31 Q32 27.4 36 31 V42.4 Z" fill="#120a05" stroke="#7a5a2a" stroke-width=".7" />
		{#each [10.6, 21.2, 37.8, 48.4] as x (x)}
			<rect x={x - 0.8} y="24" width="6.6" height="2" fill="url(#{u}-marble)" stroke={O} stroke-width=".7" />
			<rect {x} y="26" width="5" height="15" fill="url(#{u}-marble)" stroke={O} stroke-width=".7" />
			<path d="M{x + 1.7} 26.6 V40.4 M{x + 3.3} 26.6 V40.4" stroke="#9a9384" stroke-width=".45" />
			<rect x={x - 0.8} y="41" width="6.6" height="1.6" fill="url(#{u}-marble)" stroke={O} stroke-width=".7" />
		{/each}
		<rect x="6" y="42.6" width="52" height="3" fill="url(#{u}-marble)" stroke={O} stroke-width="1" />
		<rect x="3.5" y="45.6" width="57" height="3" fill="url(#{u}-marble)" stroke={O} stroke-width="1" />
		<rect x="1" y="48.6" width="62" height="3.4" fill="url(#{u}-marble)" stroke={O} stroke-width="1" />
		{#each [44, 41.8, 39.6] as y (y)}<ellipse cx="54.6" cy={y} rx="3.6" ry="1.3" fill="url(#{u}-gold)" stroke={O} stroke-width=".6" />{/each}
	{/if}
</svg>

<style>
	.ta {
		display: block;
		overflow: visible;
		filter: drop-shadow(0 2px 1px rgb(0 0 0 / 0.45));
	}
	/* the picture on the selected tab moves a little (frozen by reduced motion / the pause button) */
	:global([aria-pressed='true']) > .ta .ta-wheel {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-turn 9s linear infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-bulbs circle:nth-child(odd) {
		animation: ta-blink 0.9s steps(1) infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-bulbs circle:nth-child(even) {
		animation: ta-blink 0.9s steps(1) infinite -0.45s;
	}
	:global([aria-pressed='true']) > .ta .ta-spark path {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-twinkle 1.8s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-spark path:nth-child(2) {
		animation-delay: -0.9s;
	}
	:global([aria-pressed='true']) > .ta .ta-star {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-twinkle 1.6s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-coin {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-coin 2.4s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-card {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: ta-card 2.2s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-knob {
		animation: ta-slide 2.4s ease-in-out infinite;
		animation-delay: calc(var(--k) * -0.8s);
	}
	:global([aria-pressed='true']) > .ta .ta-led {
		animation: ta-blink-led 1.2s steps(1) infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-drop {
		animation: ta-drop 2.2s ease-in infinite;
	}
	@keyframes ta-drop {
		0% {
			transform: translateY(-5px);
			opacity: 0;
		}
		25%,
		55% {
			transform: translateY(0);
			opacity: 1;
		}
		85%,
		100% {
			transform: translateY(8px);
			opacity: 0;
		}
	}
	:global([aria-pressed='true']) > .ta .ta-halo {
		animation: ta-halo 2.2s ease-in-out infinite alternate;
	}
	@keyframes ta-halo {
		from {
			opacity: 0.35;
		}
	}
	:global([aria-pressed='true']) > .ta .ta-rays {
		transform-box: fill-box;
		transform-origin: center;
		animation: ta-turn 7s linear infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-neon {
		animation: ta-neon 2.6s steps(1) infinite;
	}
	@keyframes ta-neon {
		0%,
		86%,
		92%,
		100% {
			opacity: 1;
		}
		88% {
			opacity: 0.4;
		}
	}
	:global([aria-pressed='true']) > .ta .ta-cloud {
		animation: ta-drift 2.8s ease-in-out infinite;
	}
	@keyframes ta-drift {
		0%,
		100% {
			transform: translate(0, 0);
		}
		50% {
			transform: translate(-1.5px, -2.5px);
		}
	}
	:global([aria-pressed='true']) > .ta .ta-hat {
		transform-box: fill-box;
		transform-origin: 30% 100%;
		animation: ta-tip 2.6s ease-in-out infinite;
	}
	:global([aria-pressed='true']) > .ta .ta-eye {
		animation: ta-eye 1.6s ease-in-out infinite alternate;
	}
	@keyframes ta-tip {
		0%,
		70%,
		100% {
			transform: rotate(0deg) translateY(0);
		}
		80% {
			transform: rotate(-10deg) translateY(-3px);
		}
	}
	@keyframes ta-eye {
		to {
			fill: #ffb0b0;
		}
	}
	@keyframes ta-slide {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}
	@keyframes ta-blink-led {
		50% {
			fill: #1a4a14;
		}
	}
	@keyframes ta-turn {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes ta-blink {
		50% {
			fill: #7a4a10;
		}
	}
	@keyframes ta-twinkle {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.5);
		}
		50% {
			opacity: 1;
			transform: scale(1.15);
		}
	}
	@keyframes ta-coin {
		0%,
		100% {
			transform: scaleX(1);
		}
		50% {
			transform: scaleX(0.2);
		}
	}
	@keyframes ta-card {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(5deg);
		}
	}
</style>
