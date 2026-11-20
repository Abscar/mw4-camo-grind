<!--
	BurgiGives' pictures (2026-11-20, the user's ask: "a 'donations' page … 5 different organisations just
	for fun … its own logo … draw fun pictures for all the orgs"). Our own chunky cartoons in the casino's
	style (CasinoTabArt / SlotSymbol), decorative (the page says every name in words):
	- logo: a holy burger: halo, two angel wings, a ketchup heart on the bun
	- holk: Holk Relief Fund: a holk whose smoke curls into a heart, a lighter beside it
	- barn: Drängen's Barn: a falu-red Swedish barn on a hill, hay in the loft, pitchfork and a beer can
	- campaign: Save the Campaign: a sad, dusty game disc in a life ring, cobwebs in the corner
	- hardcore: Friendly Fire Fund: a dented helmet with a band-aid X, a bullet hole and dizzy stars
	- wrists: Camo Grinders' Wrist Clinic: a controller with a bandaged grip and an ice pack, sweat flying
	The six of 2026-11-21 (the user's tips about the squad):
	- gains: Ingman's Gains Fund: a fat dumbbell with a little wizard hat on the bar
	- jardin: Da Jeeven's Spanish Garden: warm Spanish sky, bunting, a whitewashed wall, a potted leafy plant
	  wearing shades
	- beer: Strategic Beer Reserve (Drängen): two foaming beer mugs clinking
	- nitro: Phillestar's Nitro Fund: a flaming red race car jumping a ramp on nitro, a burger on the roof
	- rehab: Ogge's Rehab: a DAY 1 calendar (the days before crossed out), herbal tea steaming into a heart
	- ragequit: Rage Quit Relief: a controller snapped in two, a cracked screen, an angry mark
	No real charity's name, logo or symbol (the band-aids are beige strips, not a red cross).
	`animate` lets the picture move a little (wings, smoke, stars …); frozen by reduced motion.
-->
<script lang="ts">
	import { holk } from '#lib/abscarOperator.ts';
	import { LEAF_PATHS, LEAF_STEM } from '#lib/leaf.ts';
	import { ORG_BY_ID, type OrgId } from '#lib/donations.ts';

	let { kind, size = 88, animate = false }: { kind: OrgId | 'logo'; size?: number; animate?: boolean } = $props();
	const uid = $props.id();
	const u = `dna-${uid}`;
	const O = '#2a1408';
	const org = $derived(kind === 'logo' ? null : ORG_BY_ID.get(kind)!);
	const W = $derived(kind === 'logo' ? 120 : 96);

	/** A five-point star centred on (x, y), radius r. */
	const star = (x: number, y: number, r: number) =>
		Array.from({ length: 10 }, (_, i) => {
			const a = (i * Math.PI) / 5 - Math.PI / 2;
			const rr = i % 2 ? r * 0.45 : r;
			return `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(2)} ${(y + rr * Math.sin(a)).toFixed(2)}`;
		}).join(' ') + 'Z';
	/** A heart with its point at (x, y + s), s = half its width. */
	const heart = (x: number, y: number, s: number) =>
		`M${x} ${y + s} C${x - s * 1.6} ${y} ${x - s * 1.1} ${y - s * 0.95} ${x} ${y - s * 0.35} C${x + s * 1.1} ${y - s * 0.95} ${x + s * 1.6} ${y} ${x} ${y + s}Z`;
	/** A sparkle (four points) centred on (x, y). */
	const sparkle = (x: number, y: number, r: number) =>
		`M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28}Z`;
	/** The ring buoy's eight red / white stripes (Save the Campaign). */
	const BUOY = Array.from({ length: 8 }, (_, i) => {
		const a0 = (i * Math.PI) / 4 - Math.PI / 2;
		const a1 = a0 + Math.PI / 4;
		const p = (r: number, a: number) => `${(48 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
		return { d: `M${p(23, a0)} A23 23 0 0 1 ${p(23, a1)} L${p(32, a1)} A32 32 0 0 0 ${p(32, a0)}Z`, fill: i % 2 ? '#f6f1e6' : '#e0352b' };
	});
	/** The wing's outline (the left one; the right one is mirrored). */
	const WING =
		'M44 44 C34 30 18 24 4 28 C9 31 8 34 12 36 C7 38 8 42 13 43.5 C9 46 11 50 17 50.5 C15 54.5 21 57 27 55.5 C31 58 38 56 44 51 Z';
</script>

<svg class="dna" class:moving={animate} data-kind={kind} viewBox="0 0 {W} 96" width={size * (W / 96)} height={size} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{u}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6b0" /><stop offset=".45" stop-color="#ffc928" /><stop offset="1" stop-color="#b86e00" /></linearGradient>
		<linearGradient id="{u}-bun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a" /><stop offset=".6" stop-color="#e8952e" /><stop offset="1" stop-color="#b8661a" /></linearGradient>
		<linearGradient id="{u}-wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#c9dcf0" /></linearGradient>
		<radialGradient id="{u}-ember"><stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" /><stop offset="1" stop-color="#ff5a00" stop-opacity="0" /></radialGradient>
		<radialGradient id="{u}-disc" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#ffffff" /><stop offset=".35" stop-color="#d9dee6" /><stop offset=".7" stop-color="#aeb6c4" /><stop offset="1" stop-color="#8a93a3" /></radialGradient>
		<linearGradient id="{u}-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9" stop-opacity=".0" /><stop offset=".35" stop-color="#ff7ad9" stop-opacity=".45" /><stop offset=".55" stop-color="#7ae8ff" stop-opacity=".45" /><stop offset=".75" stop-color="#b8ff7a" stop-opacity=".35" /><stop offset="1" stop-color="#b8ff7a" stop-opacity="0" /></linearGradient>
		<linearGradient id="{u}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc8ff" /><stop offset=".7" stop-color="#cfeeff" /><stop offset="1" stop-color="#fff2c0" /></linearGradient>
		<linearGradient id="{u}-helmet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a9a56" /><stop offset=".6" stop-color="#5d6b34" /><stop offset="1" stop-color="#3e4822" /></linearGradient>
		<linearGradient id="{u}-ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff" /><stop offset=".5" stop-color="#8fe0ff" /><stop offset="1" stop-color="#3aa6e0" /></linearGradient>
		<linearGradient id="{u}-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa" /><stop offset=".5" stop-color="#a9b3bd" /><stop offset="1" stop-color="#5e6872" /></linearGradient>
		<linearGradient id="{u}-iron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a4a56" /><stop offset=".5" stop-color="#26262e" /><stop offset="1" stop-color="#3a3a44" /></linearGradient>
		<linearGradient id="{u}-beer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd24a" /><stop offset=".6" stop-color="#f2a01c" /><stop offset="1" stop-color="#c46a06" /></linearGradient>
		<linearGradient id="{u}-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe58a" /><stop offset=".55" stop-color="#ffb35a" /><stop offset="1" stop-color="#ff7a48" /></linearGradient>
		<linearGradient id="{u}-nitro" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffffff" /><stop offset=".35" stop-color="#7ad8ff" /><stop offset=".75" stop-color="#2a7aff" /><stop offset="1" stop-color="#2a7aff" stop-opacity="0" /></linearGradient>
		<clipPath id="{u}-padl"><path d="M0 0 H47 L50 40 L45 46 L51 52 L46 60 L49 96 H0 Z" /></clipPath>
		<clipPath id="{u}-padr"><path d="M96 0 H47 L50 40 L45 46 L51 52 L46 60 L49 96 H96 Z" /></clipPath>
		{#if org}
			<radialGradient id="{u}-badge" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color={org.tile} stop-opacity=".95" /><stop offset="1" stop-color={org.deep} /></radialGradient>
			<clipPath id="{u}-clip"><circle cx="48" cy="48" r="42" /></clipPath>
		{/if}
	</defs>

	{#if kind === 'logo'}
		<!-- the holy burger: halo, wings, a ketchup heart on the bun, sparkles -->
		<g class="dna-halo">
			<ellipse cx="60" cy="13" rx="19" ry="5.4" fill="none" stroke={O} stroke-width="6.2" />
			<ellipse cx="60" cy="13" rx="19" ry="5.4" fill="none" stroke="url(#{u}-gold)" stroke-width="3.6" />
			<ellipse cx="54" cy="10.6" rx="6" ry="1.1" fill="#fffbe0" opacity=".85" />
		</g>
		{#each [0, 1] as side (side)}
			<g transform={side ? 'translate(120 0) scale(-1 1)' : undefined}>
				<g class="dna-wing">
					<path d={WING} fill="url(#{u}-wing)" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
					<path d="M40 44 C30 36 20 33 10 33 M38 47 C30 43 22 42 14 43 M38 50 C32 49 26 50 20 51" fill="none" stroke="#9fb6cf" stroke-width="1.3" stroke-linecap="round" />
				</g>
			</g>
		{/each}
		<!-- the burger -->
		<path d="M37 64 H83 Q83 74 74 74 H46 Q37 74 37 64 Z" fill="url(#{u}-bun)" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
		<rect x="35" y="55" width="50" height="10" rx="4.5" fill="#6b3a1c" stroke={O} stroke-width="1.6" />
		<path d="M38 57.5 H82" stroke="#8a4f2a" stroke-width="1.2" stroke-linecap="round" />
		<path d="M34 51 H86 L86 54 L79 60 L74 54 L64 59 L58 54 L48 60 L42 54 L34 54 Z" fill="#ffc933" stroke={O} stroke-width="1.4" stroke-linejoin="round" />
		<path d="M32 50 Q36 46 40 50 T48 50 T56 50 T64 50 T72 50 T80 50 T88 50 L88 53 Q84 56 80 53 T72 53 T64 53 T56 53 T48 53 T40 53 T32 53 Z" fill="#5fc23f" stroke={O} stroke-width="1.3" stroke-linejoin="round" />
		<path d="M35 49 Q35 22 60 22 Q85 22 85 49 Z" fill="url(#{u}-bun)" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
		<path d="M42 33 Q48 26 58 25.4" fill="none" stroke="#fff3cf" stroke-width="2.4" stroke-linecap="round" opacity=".7" />
		{#each [[45, 40, -20], [53, 30, 15], [70, 29, -10], [77, 39, 25], [62, 43, 0], [47, 47, 10], [74, 46, -15]] as [x, y, r] (`${x}-${y}`)}
			<ellipse cx={x} cy={y} rx="1.9" ry="1" transform="rotate({r} {x} {y})" fill="#fffaf0" stroke="#b8661a" stroke-width=".4" />
		{/each}
		<path class="dna-heart" d={heart(60, 34, 7.5)} fill="#e0261f" stroke="#7a0a0a" stroke-width="1.2" stroke-linejoin="round" />
		<path d="M56.6 31 Q58 29.6 59.4 30.4" fill="none" stroke="#ffb0a0" stroke-width="1.2" stroke-linecap="round" />
		<g class="dna-spark" fill="#fff6b0" stroke="#b86e00" stroke-width=".5">
			<path d={sparkle(16, 66, 4.5)} />
			<path d={sparkle(104, 64, 4)} />
			<path d={sparkle(98, 84, 3)} />
			<path d={sparkle(22, 84, 3)} />
		</g>
	{:else if org}
		<!-- every cause is a round badge in its colours; the picture sits on it -->
		<circle cx="48" cy="48" r="45" fill={O} />
		<circle cx="48" cy="48" r="43" fill="url(#{u}-badge)" stroke={org.accent} stroke-width="2.6" />
		<circle cx="48" cy="48" r="39" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1" stroke-dasharray="2 3" />

		{#if kind === 'holk'}
			<!-- a holk on the diagonal, its smoke curling up into a heart; a lighter and a leaf beside it -->
			<g transform="translate(9 66) scale(1.25)" fill="#3e9a3a" stroke="#123a10" stroke-width=".6" opacity=".9">
				{#each LEAF_PATHS as d (d)}<path {d} transform="translate(-12 -20)" />{/each}
				<path d={LEAF_STEM} transform="translate(-12 -20)" stroke="#123a10" stroke-width="1.2" fill="none" />
			</g>
			<g class="dna-smoke" fill="#eef3ef" stroke="#a9b6ad" stroke-width=".8">
				<circle cx="65.5" cy="27" r="3" />
				<circle cx="68" cy="21" r="3.8" />
				<path d={heart(71, 13, 8.5)} />
			</g>
			{@html holk(u, 20, 74, 61, 33, 7, 15, 9)}
			<!-- the lighter -->
			<rect x="68" y="56" width="11" height="20" rx="2.6" fill="#e0352b" stroke={O} stroke-width="1.4" />
			<rect x="69" y="51" width="9" height="6" rx="1" fill="#c9d3dc" stroke={O} stroke-width="1.2" />
			<circle cx="76" cy="54" r="1.6" fill="#7a8590" stroke={O} stroke-width=".7" />
			<path class="dna-flame" d="M71.6 51 C70 47 72 44.6 73.4 42 C74.2 45 76.4 46.4 75.2 51 Z" fill="#ffb21a" stroke="#c4560a" stroke-width=".8" />
			<rect x="70" y="60" width="2.6" height="12" rx="1.2" fill="#fff" opacity=".35" />
		{:else if kind === 'barn'}
			<!-- a falu-red Swedish barn on a hill under the sun: hay in the loft, a pitchfork, a beer can -->
			<g clip-path="url(#{u}-clip)">
				<rect x="0" y="0" width="96" height="96" fill="url(#{u}-sky)" />
				<g class="dna-sun"><circle cx="22" cy="24" r="8" fill="#ffd23a" stroke="#d98a00" stroke-width="1.2" /></g>
				<path d="M8 33 Q14 29 20 33 Q26 30 30 34 Z" fill="#fff" opacity=".9" />
				<path d="M60 18 Q66 13 72 17 Q78 14 82 19 Z" fill="#fff" opacity=".85" />
				<path d="M0 72 Q24 62 48 66 Q72 70 96 62 L96 96 L0 96 Z" fill="#5cb83a" stroke="#2f6a1c" stroke-width="1.2" />
				<path d="M0 80 Q30 74 60 79 Q80 82 96 76 L96 96 L0 96 Z" fill="#46a02c" />
			</g>
			<!-- the barn -->
			<path d="M25 46 L32 31 L48 24 L64 31 L71 46 Z" fill="#3a2e2a" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
			<path d="M25 46 L32 31 L48 24 L64 31 L71 46" fill="none" stroke="#f6f1e6" stroke-width="1.4" stroke-linejoin="round" />
			<rect x="28" y="45" width="40" height="30" fill="#b3261e" stroke={O} stroke-width="1.6" />
			{#each [33, 38, 58, 63] as x (x)}<path d="M{x} 46 V74" stroke="#8a1a14" stroke-width=".9" />{/each}
			<path d="M28 45 V75 M68 45 V75" stroke="#f6f1e6" stroke-width="1.6" />
			<rect x="41.5" y="31.5" width="13" height="10" fill="#2a1408" stroke="#f6f1e6" stroke-width="1.6" />
			<path d="M42.5 41 Q45 35 47 38 Q48.6 34 50.4 38 Q52 35 54 41 Z" fill="#ffd96a" stroke="#c48a10" stroke-width=".7" />
			<rect x="38" y="55" width="20" height="20" fill="#b3261e" stroke="#f6f1e6" stroke-width="1.8" />
			<path d="M38 55 L58 75 M58 55 L38 75 M48 55 V75" stroke="#f6f1e6" stroke-width="1.6" />
			<!-- pitchfork leaning on the barn -->
			<path d="M80 80 L72 47" stroke="#8a5a2a" stroke-width="2.4" stroke-linecap="round" />
			<path d="M68.6 47.8 L67 39.6 M72 47 L70.6 38.6 M75.4 46.2 L74.2 37.6 M68.6 47.8 L75.4 46.2" fill="none" stroke="#b8c0c8" stroke-width="1.6" stroke-linecap="round" />
			<!-- a beer can in the grass -->
			<rect x="13" y="64" width="9" height="14" rx="1.6" fill="#f2c230" stroke={O} stroke-width="1.3" />
			<rect x="13" y="68.5" width="9" height="4.4" fill="#2a6ad8" />
			<ellipse cx="17.5" cy="64" rx="4.5" ry="1.3" fill="#c9d3dc" stroke={O} stroke-width=".9" />
			<rect x="14.4" y="66" width="1.6" height="10" rx=".8" fill="#fff" opacity=".45" />
		{:else if kind === 'campaign'}
			<!-- a lonely game disc with a sad face, a tear and dust, rescued by a life ring; cobwebs -->
			<g clip-path="url(#{u}-clip)" fill="none" stroke="#efe9fa" stroke-opacity=".85" stroke-width=".9">
				<path d="M6 6 L30 18 M6 6 L22 30 M6 6 L34 8 M6 6 L8 34" />
				<path d="M15 9.5 Q18 14 12 16.6 M23 13.4 Q26 22 17 23.4 M28 9 Q30 12 26 14.6" />
				<path d="M90 90 L72 82 M90 90 L80 72 M90 90 L88 70" />
				<path d="M82 86 Q80 82 85 80 M77 84 Q74 78 82 75" />
			</g>
			<circle cx="48" cy="50" r="22" fill="url(#{u}-disc)" stroke={O} stroke-width="1.6" />
			<circle cx="48" cy="50" r="22" fill="url(#{u}-sheen)" />
			<circle cx="48" cy="50" r="7" fill="#e9edf2" stroke="#8a93a3" stroke-width="1" />
			<circle cx="48" cy="50" r="2.8" fill={org.deep} stroke={O} stroke-width=".8" />
			<!-- the sad face (round the hole) -->
			<path d="M36.6 42.4 L42 39.6 M59.4 42.4 L54 39.6" stroke={O} stroke-width="1.6" stroke-linecap="round" />
			<circle cx="40" cy="45" r="1.8" fill={O} /><circle cx="56" cy="45" r="1.8" fill={O} />
			<path d="M40 62 Q48 56 56 62" fill="none" stroke={O} stroke-width="1.8" stroke-linecap="round" />
			<path class="dna-tear" d="M56.6 48 Q54.8 51.6 56.6 52.8 Q58.4 51.6 56.6 48 Z" fill="#6ac8ff" stroke="#1a6a9a" stroke-width=".6" />
			<!-- dust -->
			{#each [[33, 34], [62, 36], [36, 64], [64, 60], [52, 32]] as [x, y] (`${x}-${y}`)}<circle cx={x} cy={y} r=".9" fill="#8a7a6a" opacity=".8" />{/each}
			<!-- the life ring (ring buoy) and its rope -->
			<g class="dna-buoy">
				{#each BUOY as b, i (i)}<path d={b.d} fill={b.fill} stroke={O} stroke-width="1.1" stroke-linejoin="round" />{/each}
				<path d="M48 18 Q54 16 56 19 M80 50 Q82 56 79 58 M48 82 Q42 84 40 81 M16 50 Q14 44 17 42" fill="none" stroke="#e8c27a" stroke-width="1.8" stroke-linecap="round" />
			</g>
		{:else if kind === 'hardcore'}
			<!-- a dented helmet with a band-aid X, a bullet hole in the back, dizzy stars and a sorry heart -->
			<g class="dna-stars" fill="#ffd23a" stroke="#7a4a00" stroke-width=".7" stroke-linejoin="round">
				<path d={star(28, 22, 5.5)} />
				<path d={star(48, 14, 6)} />
				<path d={star(68, 22, 5.5)} />
			</g>
			<path d="M20 26 Q48 6 76 26" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1" stroke-dasharray="2 3" />
			<!-- the helmet -->
			<path d="M18 62 Q16 30 48 28 Q80 30 78 62 Z" fill="url(#{u}-helmet)" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
			<path d="M12 62 Q48 70 84 62 L84 66 Q48 76 12 66 Z" fill="#4a5628" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
			<path d="M26 40 Q34 32 46 31" fill="none" stroke="#c9d89a" stroke-width="2.2" stroke-linecap="round" opacity=".55" />
			{#each [[30, 50], [40, 56], [60, 46], [66, 56], [52, 38]] as [x, y] (`${x}-${y}`)}<circle cx={x} cy={y} r="1.6" fill="#3e4822" opacity=".7" />{/each}
			<!-- the bullet hole: dark, cracked -->
			<circle cx="66" cy="42" r="3.4" fill="#120a06" stroke={O} stroke-width=".8" />
			<path d="M66 37 L65.6 34 M70.4 40 L73.4 38.6 M70 45.6 L72.6 48 M62 44 L59.4 46" stroke="#1e1408" stroke-width="1" stroke-linecap="round" />
			<!-- the band-aid X (beige strips with a pad) -->
			<g transform="rotate(35 40 46)">
				<rect x="24" y="41.5" width="32" height="9" rx="4.5" fill="#f2c9a0" stroke={O} stroke-width="1.3" />
				<rect x="34" y="42.6" width="12" height="6.8" rx="1.4" fill="#e3ad7e" />
				{#each [27, 30, 50, 53] as x (x)}<circle cx={x} cy="46" r=".7" fill="#c48a5a" />{/each}
			</g>
			<g transform="rotate(-35 40 46)">
				<rect x="24" y="41.5" width="32" height="9" rx="4.5" fill="#f6d2ae" stroke={O} stroke-width="1.3" />
				<rect x="34" y="42.6" width="12" height="6.8" rx="1.4" fill="#e3ad7e" />
				{#each [27, 30, 50, 53] as x (x)}<circle cx={x} cy="46" r=".7" fill="#c48a5a" />{/each}
			</g>
			<!-- the chin straps hanging loose, and a little "sorry" heart -->
			<path d="M21 67 Q22 75 26 80 M75 67 Q74 75 70 80" fill="none" stroke="#3a2a14" stroke-width="2.2" stroke-linecap="round" />
			<rect x="23.6" y="78.6" width="5" height="3.6" rx="1" fill="#b8c0c8" stroke={O} stroke-width=".8" />
			<path d={heart(72, 76, 6)} fill="#ff5a8a" stroke="#7a0a2a" stroke-width="1.1" stroke-linejoin="round" />
		{:else if kind === 'gains'}
			<!-- Ingman's Gains Fund: a fat dumbbell with a little wizard hat perched on the bar (Ingman's
			     operator is a wizard who lifts), lift lines, sparkles -->
			<path d="M24 26 Q30 20 36 26 M60 26 Q66 20 72 26" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round" />
			<rect x="14" y="50" width="68" height="4.4" rx="2" fill="url(#{u}-chrome)" stroke={O} stroke-width="1.2" />
			{#each [41, 44, 47, 50, 53] as x (x)}<path d="M{x} 50.6 V53.8" stroke="#6e7882" stroke-width=".7" />{/each}
			{#each [[15, 40, 7, 24], [22, 35, 8.5, 34], [65.5, 35, 8.5, 34], [74, 40, 7, 24]] as [x, y, w, h] (`${x}`)}
				<rect {x} {y} width={w} height={h} rx="2.2" fill="url(#{u}-iron)" stroke={O} stroke-width="1.4" />
				<rect x={x + 1.2} y={y + 2} width="1.6" height={h - 4} rx=".8" fill="#fff" opacity=".18" />
			{/each}
			<rect x="30.5" y="47" width="3.6" height="10.4" rx="1" fill="url(#{u}-chrome)" stroke={O} stroke-width="1" />
			<rect x="61.9" y="47" width="3.6" height="10.4" rx="1" fill="url(#{u}-chrome)" stroke={O} stroke-width="1" />
			<path d={star(26.2, 52, 3)} fill="url(#{u}-gold)" stroke={O} stroke-width=".5" />
			<path d={star(69.8, 52, 3)} fill="url(#{u}-gold)" stroke={O} stroke-width=".5" />
			<!-- the wizard hat on the bar -->
			<g transform="rotate(-10 48 50)">
				<path d="M38 49 Q43 40 46 30 Q48 22 56 16 Q53 26 55 34 Q57 42 59 49 Z" fill="#7a32c8" stroke={O} stroke-width="1.5" stroke-linejoin="round" />
				<path d="M40.4 45 Q49 43 57.6 45 L58.4 48 Q49 46 39.6 48 Z" fill="#ffd23a" stroke={O} stroke-width=".8" />
				<ellipse cx="48.5" cy="49.2" rx="13.5" ry="3" fill="#5a2096" stroke={O} stroke-width="1.4" />
				<path d={star(50, 36, 2.4)} fill="#ffe14a" />
				<path d={star(54.6, 24, 1.6)} fill="#ffe14a" />
			</g>
			<g class="dna-spark" fill="#fff6b0" stroke="#b86e00" stroke-width=".4">
				<path d={sparkle(16, 30, 3.2)} />
				<path d={sparkle(80, 30, 3.2)} />
				<path d={sparkle(48, 76, 2.6)} />
			</g>
			<path d="M33 68 Q35 72 33 74 Q31 72 33 68 Z M63 68 Q65 72 63 74 Q61 72 63 68 Z" fill="#9fe6ff" stroke="#1a6a9a" stroke-width=".5" />
		{:else if kind === 'jardin'}
			<!-- Da Jeeven's Spanish Garden: a warm Spanish sky with fiesta bunting, a whitewashed wall with
			     terracotta roof tiles, a terracotta pot with a big leafy plant, the sun -->
			<g clip-path="url(#{u}-clip)">
				<rect x="0" y="0" width="96" height="96" fill="url(#{u}-dusk)" />
				<g class="dna-sun"><circle cx="72" cy="26" r="10" fill="#fff3a0" stroke="#e89a10" stroke-width="1.2" /></g>
				{#each Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4) as a (a)}<path d="M{(72 + 13 * Math.cos(a)).toFixed(1)} {(26 + 13 * Math.sin(a)).toFixed(1)} L{(72 + 17 * Math.cos(a)).toFixed(1)} {(26 + 17 * Math.sin(a)).toFixed(1)}" stroke="#fff3a0" stroke-width="1.8" stroke-linecap="round" />{/each}
				<path d="M4 14 Q26 24 50 12" fill="none" stroke="#5a3a1a" stroke-width=".8" />
				{#each [[9, 16.4, '#e0261f'], [16, 19.4, '#ffd23a'], [23, 21.4, '#e0261f'], [30, 22, '#ffd23a'], [37, 20.4, '#e0261f'], [44, 16.8, '#ffd23a']] as [x, y, c] (`${x}`)}
					<path d="M{(x as number) - 3} {y} L{(x as number) + 3} {y} L{x} {(y as number) + 6} Z" fill={c as string} stroke={O} stroke-width=".5" />
				{/each}
				<!-- the white wall with roof tiles and an arched window -->
				<rect x="0" y="46" width="38" height="50" fill="#f8f2e6" stroke={O} stroke-width="1.2" />
				<path d="M-2 47 H40 L38 41 H0 Z" fill="#c8542a" stroke={O} stroke-width="1.2" stroke-linejoin="round" />
				{#each [3, 9, 15, 21, 27, 33] as x (x)}<path d="M{x} 41.4 Q{x + 3} 45 {x + 6} 41.4" fill="none" stroke="#8a2e10" stroke-width=".9" />{/each}
				<path d="M12 72 V60 Q18 53 24 60 V72 Z" fill="#1f4a8a" stroke={O} stroke-width="1.1" />
				<rect x="10" y="72" width="16" height="4" fill="#c8642a" stroke={O} stroke-width=".9" />
				{#each [13, 17, 21, 25] as x, i (x)}<circle cx={x} cy="70.6" r="1.6" fill={i % 2 ? '#ff4f8a' : '#ffd23a'} stroke={O} stroke-width=".4" />{/each}
				<rect x="0" y="82" width="96" height="14" fill="#c8643a" />
				<path d="M0 82 H96 M24 82 V96 M48 82 V96 M72 82 V96" stroke="#9a4422" stroke-width=".8" />
			</g>
			<!-- the pot and the plant -->
			<g fill="#3e9a3a" stroke="#123a10" stroke-width=".55">
				<g transform="translate(63 60) rotate(-34) scale(1.35) translate(-12 -20)">{#each LEAF_PATHS as d (d)}<path {d} />{/each}</g>
				<g transform="translate(63 60) rotate(34) scale(1.35) translate(-12 -20)">{#each LEAF_PATHS as d (d)}<path {d} />{/each}</g>
				<g transform="translate(63 61) scale(1.85) translate(-12 -20)" fill="#4cb444">{#each LEAF_PATHS as d (d)}<path {d} />{/each}</g>
			</g>
			<path d="M51 66 H75 L72 84 H54 Z" fill="#c8642a" stroke={O} stroke-width="1.4" stroke-linejoin="round" />
			<rect x="49" y="61" width="28" height="6" rx="1.4" fill="#d8743a" stroke={O} stroke-width="1.3" />
			<path d="M55 72 H71" stroke="#ffd23a" stroke-width="1.6" /><path d="M56 76 H70" stroke="#e0261f" stroke-width="1.6" />
			<!-- shades on the pot rim -->
			<path d="M55.4 62.6 h6 v2.6 q0 2 -3 2 q-3 0 -3 -2 Z M64.6 62.6 h6 v2.6 q0 2 -3 2 q-3 0 -3 -2 Z M61.4 63.4 h3.2" fill="#14141a" stroke="#14141a" stroke-width=".7" />
		{:else if kind === 'beer'}
			<!-- the Strategic Beer Reserve: two foaming beer mugs clinking (skål!), a splash between them -->
			{#each [-1, 1] as side (side)}
				<g transform="translate({48 + side * 14} 56) rotate({side * 13}) translate(-12 -20)">
					<!-- handle on the outer side -->
					<path d={side < 0 ? 'M1 12 Q-8 12 -8 22 Q-8 32 1 32' : 'M23 12 Q32 12 32 22 Q32 32 23 32'} fill="none" stroke={O} stroke-width="6" />
					<path d={side < 0 ? 'M1 12 Q-8 12 -8 22 Q-8 32 1 32' : 'M23 12 Q32 12 32 22 Q32 32 23 32'} fill="none" stroke="#e6eef4" stroke-width="3.4" />
					<rect x="0" y="6" width="24" height="34" rx="3" fill="url(#{u}-beer)" stroke={O} stroke-width="1.6" />
					<rect x="3" y="9" width="3" height="27" rx="1.5" fill="#fff" opacity=".45" />
					<path d="M9 10 V36 M15 10 V36" stroke="#fff" stroke-opacity=".22" stroke-width="1.6" />
					{#each [[12, 30, 1.2], [18, 24, 0.9], [8, 20, 0.8], [16, 15, 1]] as [x, y, r] (`${x}-${y}`)}<circle cx={x} cy={y} {r} fill="#fff" opacity=".75" />{/each}
					<!-- the foam, spilling over -->
					<path d="M-2 8 Q-2 1 4 2 Q6 -3 12 -1 Q17 -4 21 1 Q27 1 26 7 Q26 11 22 10 L22 15 Q20 18 19 14 L19 10 L4 10 Q1 12 -1 11 Q-3 10 -2 8 Z" fill="#fffaf0" stroke={O} stroke-width="1.3" stroke-linejoin="round" />
				</g>
			{/each}
			<g class="dna-spark" fill="#fff6b0" stroke="#b86e00" stroke-width=".4">
				<path d={sparkle(48, 26, 5)} />
				<path d={sparkle(36, 18, 2.6)} />
				<path d={sparkle(61, 17, 2.8)} />
			</g>
			{#each [[42, 30], [54, 31], [47, 20], [40, 22], [57, 23]] as [x, y] (`${x}-${y}`)}<path d="M{x} {y} q-1.6 2.8 0 3.8 q1.6 -1 0 -3.8 Z" fill="#ffd24a" stroke="#a85a00" stroke-width=".4" />{/each}
		{:else if kind === 'nitro'}
			<!-- Phillestar's Nitro Fund: a red race car with flames flying off a ramp on a nitro boost, a
			     burger strapped to its roof, speed lines -->
			<g clip-path="url(#{u}-clip)">
				{#each [[4, 30, 22], [2, 40, 30], [6, 64, 18]] as [x, y, w] (`${y}`)}<path d="M{x} {y} h{w}" stroke="#ffd400" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round" />{/each}
				{#each Array.from({ length: 24 }, (_, i) => i) as i (i)}<rect x={(i % 12) * 8} y={82 + Math.floor(i / 12) * 6} width="8" height="6" fill={(i + Math.floor(i / 12)) % 2 ? '#f2f2f2' : '#14141a'} />{/each}
				<path d="M0 82 L38 82 L38 69 Z" fill="#9a7440" stroke={O} stroke-width="1.4" stroke-linejoin="round" />
				<path d="M8 82 L38 73 M20 82 L38 77" stroke="#5a4020" stroke-width=".8" />
			</g>
			<g transform="rotate(-12 54 52)">
				<path class="dna-flame" d="M30 51.4 L12 48 L18 53 L10 57 L30 56.4 Z" fill="url(#{u}-nitro)" />
				<path d="M27 54 Q27 46 36 45 L44 44 Q50 36 60 36 L66 37 Q72 41 75 46 Q80 47 80 52 L80 56 Q80 58 78 58 L29 58 Q27 58 27 56 Z" fill="#e0251b" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
				<path d="M47 44 Q52 39.4 59 39.4 L64 40 Q67 42 69.4 45 Z" fill="#20303e" stroke={O} stroke-width="1.1" />
				<path d="M57 39.6 L56 44.6" stroke={O} stroke-width="1.1" />
				<path d="M49.6 41.8 Q53 40.6 56 40.6" stroke="#9fd8ff" stroke-width="1" stroke-linecap="round" opacity=".8" />
				<!-- flames on the side -->
				<path d="M77 51 Q70 47 66 50 Q69 50 69 52 Q63 48 58 51 Q62 51 62 53 Q55 49 48 53 Q54 53 54 55 L77 55 Z" fill="#ffd400" stroke="#c46a06" stroke-width=".7" stroke-linejoin="round" />
				<path d="M29.4 43 L30.4 48.6 M33.4 43 L33.8 47" stroke="#14141a" stroke-width="1.6" stroke-linecap="round" />
				<rect x="25" y="40.6" width="11" height="3" rx="1" fill="#14141a" stroke={O} stroke-width=".8" />
				{#each [37, 69] as x (x)}
					<circle cx={x} cy="58" r="6" fill="#14141a" stroke={O} stroke-width="1" />
					<circle cx={x} cy="58" r="2.8" fill="url(#{u}-chrome)" />
				{/each}
				<circle cx="78" cy="50" r="1.4" fill="#fff6b0" />
				<!-- the burger on the roof -->
				<path d="M52 35.2 q0 -5 5.6 -5 q5.6 0 5.6 5 Z" fill="url(#{u}-bun)" stroke={O} stroke-width=".9" />
				<rect x="51.6" y="35" width="11.6" height="1.4" fill="#5fc23f" />
				<rect x="51.8" y="36.2" width="11.2" height="1.8" rx=".8" fill="#6b3a1c" />
				<path d="M58 30 l-.6 -2.4 M60 30.4 l.4 -2.4" stroke="#fff" stroke-opacity=".6" stroke-width=".7" stroke-linecap="round" />
			</g>
		{:else if kind === 'rehab'}
			<!-- Ogge's Rehab: a calendar on DAY 1 (the days before crossed out), a cup of herbal tea with a
			     leaf, its steam curling into a heart -->
			<g transform="rotate(-6 36 46)">
				<rect x="16" y="22" width="40" height="48" rx="4" fill="#fffaf0" stroke={O} stroke-width="1.6" />
				<path d="M16 26 Q16 22 20 22 H52 Q56 22 56 26 V33 H16 Z" fill="#e0352b" stroke={O} stroke-width="1.4" />
				<rect x="24" y="18" width="3" height="8" rx="1.4" fill="url(#{u}-chrome)" stroke={O} stroke-width=".8" />
				<rect x="45" y="18" width="3" height="8" rx="1.4" fill="url(#{u}-chrome)" stroke={O} stroke-width=".8" />
				<text x="36" y="31" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="7" letter-spacing="1" fill="#fff">DAY</text>
				<text x="36" y="58" text-anchor="middle" font-family="Bahnschrift, 'Arial Black', sans-serif" font-weight="900" font-size="24" fill="#2a1408">1</text>
				<path d="M22 64 V60 M25 64 V60 M28 64 V60 M31 64 V60 M20.6 63 L32.4 60.6" stroke="#8a8478" stroke-width="1" stroke-linecap="round" />
				<path d="M38 64 V60 M41 64 V60 M44 64 V60 M47 64 V60 M36.6 63 L48.4 60.6" stroke="#8a8478" stroke-width="1" stroke-linecap="round" />
			</g>
			<!-- the tea -->
			<g class="dna-smoke" fill="none" stroke="#e8fff8" stroke-opacity=".85" stroke-width="1.6" stroke-linecap="round">
				<path d="M64 56 Q60 50 64 46 Q68 42 64 38" />
				<path d="M72 56 Q76 50 72 46 Q68 42 72 38" />
			</g>
			<path d={heart(68, 30, 6)} fill="#ff7ac0" stroke="#7a0a3a" stroke-width="1" stroke-linejoin="round" />
			<ellipse cx="68" cy="78" rx="18" ry="3.6" fill="#e9f6f2" stroke={O} stroke-width="1.2" />
			<path d="M54 58 H82 Q82 76 68 76 Q54 76 54 58 Z" fill="#fffaf0" stroke={O} stroke-width="1.5" stroke-linejoin="round" />
			<path d="M82 61 Q89 61 89 66 Q89 71 81 71" fill="none" stroke={O} stroke-width="4.2" />
			<path d="M82 61 Q89 61 89 66 Q89 71 81 71" fill="none" stroke="#fffaf0" stroke-width="2.2" />
			<ellipse cx="68" cy="59" rx="13" ry="2.4" fill="#a8d86a" stroke="#4a7a1a" stroke-width=".8" />
			<path d="M58 66 Q61 63 64 66 Q61 69 58 66 Z" fill="#3e9a3a" stroke="#123a10" stroke-width=".6" />
			<path d="M58 66 L64 66" stroke="#123a10" stroke-width=".5" />
		{:else if kind === 'ragequit'}
			<!-- Rage Quit Relief: a controller snapped in two over a cracked screen, buttons flying, an angry mark -->
			<g clip-path="url(#{u}-clip)" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".8">
				<path d="M70 24 L90 10 M70 24 L94 30 M70 24 L82 50 M70 24 L56 6 M70 24 L40 18 M70 24 L48 34" />
				<path d="M64 20 Q70 16 76 20 Q80 26 74 30 Q66 32 63 26 Z" />
			</g>
			<!-- the angry mark -->
			<g stroke="#ff4040" stroke-width="2.6" stroke-linecap="round" fill="none">
				<path d="M20 18 Q24 22 20 26" /><path d="M24 14 Q28 18 32 14" /><path d="M36 18 Q32 22 36 26" /><path d="M24 30 Q28 26 32 30" />
			</g>
			{#each [0, 1] as half (half)}
				<g transform={half ? 'translate(4 2) rotate(16 60 58)' : 'translate(-4 2) rotate(-16 36 58)'}>
					<g clip-path="url(#{u}-{half ? 'padr' : 'padl'})">
						<path d="M28 40 H68 C78 40 84 48 86 60 C88 72 82 78 76 76 C72 75 70 70 66 66 H30 C26 70 24 75 20 76 C14 78 8 72 10 60 C12 48 18 40 28 40 Z" fill="#2b2f36" stroke={O} stroke-width="1.8" stroke-linejoin="round" />
						<path d="M27 50 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 Z" fill="#14171c" stroke="#5a626e" stroke-width=".7" />
						<circle cx="66" cy="47" r="2.4" fill="#ffd23a" stroke={O} stroke-width=".7" /><circle cx="71" cy="52" r="2.4" fill="#ff6a6a" stroke={O} stroke-width=".7" />
						<circle cx="40" cy="60" r="4.2" fill="#14171c" stroke="#5a626e" stroke-width=".8" /><circle cx="56" cy="60" r="4.2" fill="#14171c" stroke="#5a626e" stroke-width=".8" />
					</g>
					<path d={half ? 'M50 40 L45 46 L51 52 L46 60 L49 66' : 'M47 40 L50 40 L45 46 L51 52 L46 60 L49 66'} fill="none" stroke="#9aa3ae" stroke-width="1" stroke-linejoin="round" />
				</g>
			{/each}
			<!-- bits flying off -->
			<circle cx="48" cy="26" r="2.6" fill="#6ad8ff" stroke={O} stroke-width=".7" />
			<circle cx="56" cy="84" r="2.4" fill="#7dff6a" stroke={O} stroke-width=".7" />
			<path d="M40 82 l3 -2 l2 3 l-3 2 Z" fill="#5a626e" stroke={O} stroke-width=".6" />
			<path d="M46 30 Q47 34 50 33 M53 80 Q50 78 51 75" stroke="#fff" stroke-opacity=".5" stroke-width=".8" fill="none" />
		{:else}
			<!-- a controller with a bandaged left grip and an ice pack on the right, sweat flying off -->
			<g class="dna-sweat" fill="#9fe6ff" stroke="#1a6a9a" stroke-width=".6">
				<path d="M14 36 Q11.6 40 14 41.6 Q16.4 40 14 36 Z" />
				<path d="M82 34 Q79.6 38 82 39.6 Q84.4 38 82 34 Z" />
				<path d="M20 24 Q18.2 27 20 28.2 Q21.8 27 20 24 Z" />
			</g>
			<path d="M10 46 L4 44 M10 52 L3 53 M86 46 L92 44 M86 52 L93 53" stroke="#fff" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round" />
			<!-- the controller -->
			<path
				d="M28 38 H68 C78 38 84 46 86 58 C88 70 82 76 76 74 C72 73 70 68 66 64 H30 C26 68 24 73 20 74 C14 76 8 70 10 58 C12 46 18 38 28 38 Z"
				fill="#2b2f36"
				stroke={O}
				stroke-width="1.8"
				stroke-linejoin="round"
			/>
			<path d="M30 41 H66" stroke="#4a515c" stroke-width="1.6" stroke-linecap="round" />
			<!-- d-pad and four buttons -->
			<path d="M27 48 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 Z" fill="#14171c" stroke="#5a626e" stroke-width=".7" />
			{#each [[66, 45, '#ffd23a'], [71, 50, '#ff6a6a'], [61, 50, '#6ad8ff'], [66, 55, '#7dff6a']] as [x, y, c] (`${x}-${y}`)}
				<circle cx={x} cy={y} r="2.4" fill={c as string} stroke={O} stroke-width=".7" />
			{/each}
			<circle cx="40" cy="58" r="4.2" fill="#14171c" stroke="#5a626e" stroke-width=".8" /><circle cx="56" cy="58" r="4.2" fill="#14171c" stroke="#5a626e" stroke-width=".8" />
			<!-- the bandage round the left grip -->
			<g transform="rotate(-24 18 62)">
				{#each [0, 1, 2] as i (i)}<rect x="7" y={55 + i * 4.6} width="22" height="4.4" rx="1.2" fill={i % 2 ? '#f6f1e6' : '#e9e2d2'} stroke="#9a8f7a" stroke-width=".7" />{/each}
			</g>
			<!-- the ice pack on the right grip, frosty, with a snowflake -->
			<g transform="rotate(18 78 60)">
				<rect x="68" y="52" width="20" height="16" rx="4" fill="url(#{u}-ice)" stroke="#0d4a7a" stroke-width="1.3" />
				<path d="M78 55 V65 M73.6 57.4 L82.4 62.6 M82.4 57.4 L73.6 62.6" stroke="#fff" stroke-width="1.2" stroke-linecap="round" />
				<rect x="70" y="53.6" width="6" height="2" rx="1" fill="#fff" opacity=".7" />
			</g>
		{/if}
	{/if}
</svg>

<style>
	.dna {
		display: block;
		overflow: visible;
		flex: none;
		filter: drop-shadow(0 2px 1px rgb(0 0 0 / 0.45));
	}
	.moving .dna-wing {
		transform-box: fill-box;
		transform-origin: 100% 60%;
		animation: dna-flap 2.2s ease-in-out infinite;
	}
	.moving .dna-halo {
		animation: dna-bob 3s ease-in-out infinite;
	}
	.moving .dna-heart {
		transform-box: fill-box;
		transform-origin: center;
		animation: dna-beat 1.6s ease-in-out infinite;
	}
	.moving .dna-spark path,
	.moving .dna-stars path {
		transform-box: fill-box;
		transform-origin: center;
		animation: dna-twinkle 1.8s ease-in-out infinite;
	}
	.moving .dna-spark path:nth-child(2n),
	.moving .dna-stars path:nth-child(2) {
		animation-delay: -0.9s;
	}
	.moving .dna-smoke {
		animation: dna-rise 3.2s ease-in-out infinite;
	}
	.moving .dna-flame {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: dna-flicker 0.5s ease-in-out infinite alternate;
	}
	.moving .dna-sun {
		transform-box: fill-box;
		transform-origin: center;
		animation: dna-beat 3s ease-in-out infinite;
	}
	.moving .dna-tear {
		animation: dna-tear 2.4s ease-in infinite;
	}
	.moving .dna-buoy {
		transform-box: fill-box;
		transform-origin: center;
		animation: dna-sway 3.4s ease-in-out infinite;
	}
	.moving .dna-sweat {
		animation: dna-bob 1.2s ease-in-out infinite;
	}
	@keyframes dna-flap {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-10deg);
		}
	}
	@keyframes dna-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-2px);
		}
	}
	@keyframes dna-beat {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.12);
		}
	}
	@keyframes dna-twinkle {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.6);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
	@keyframes dna-rise {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.85;
		}
		50% {
			transform: translateY(-2.5px);
			opacity: 1;
		}
	}
	@keyframes dna-flicker {
		to {
			transform: scale(0.85, 1.12);
		}
	}
	@keyframes dna-tear {
		0%,
		30% {
			transform: translateY(0);
			opacity: 0;
		}
		40% {
			opacity: 1;
		}
		100% {
			transform: translateY(9px);
			opacity: 0;
		}
	}
	@keyframes dna-sway {
		0%,
		100% {
			transform: rotate(-4deg);
		}
		50% {
			transform: rotate(4deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dna :global(*) {
			animation: none !important;
		}
	}
</style>
