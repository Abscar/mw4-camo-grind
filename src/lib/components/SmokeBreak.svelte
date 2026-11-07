<!--
	Smoke-break banner between Divergence & Mastery and Backup (the user's ask, 2026-11-07):
	two cartoon stoner buddies in the spirit of Cheech & Chong sharing a cone joint ("holk") on a
	beat-up 70s couch, under a striped retro sunset with palm trees, a potted plant and a lava lamp.
	Lanky one: long hair, red bandana headband, full beard, suede vest, sleepy red eyes, exhaling.
	Stocky one: slicked black hair, thick moustache, buffalo-check flannel buttoned to the top,
	big grin, reaching for the joint. Our own drawing; no names or film quotes in the UI.
	Decorative and aria-hidden; smoke, ember, stars and lava drift (prefers-reduced-motion freezes it).
-->
<script lang="ts" module>
	const INK = '#140a06';

	const f = (n: number) => n.toFixed(1);

	/** A palm-tree silhouette: a leaning trunk and drooping fronds. */
	function palm(x: number, base: number, h: number, lean: number): string {
		const tx = x + lean;
		const ty = base - h;
		let d = `M${f(x - 5)} ${base} Q${f(x + lean * 0.25 - 3)} ${f(base - h * 0.55)} ${f(tx - 2.5)} ${f(ty)} L${f(tx + 2.5)} ${f(ty)} Q${f(x + lean * 0.25 + 3)} ${f(base - h * 0.55)} ${f(x + 5)} ${base} Z`;
		for (const [a, len] of [
			[-168, 58],
			[-140, 66],
			[-108, 46],
			[-72, 46],
			[-40, 66],
			[-12, 58],
			[-90, 34]
		]) {
			const rad = (a * Math.PI) / 180;
			const dx = Math.cos(rad) * len;
			const ex = tx + dx;
			const ey = ty + Math.sin(rad) * len * 0.45 + Math.abs(dx) * 0.55;
			const cx = tx + dx * 0.5;
			const cy = ty + Math.sin(rad) * len * 0.5 - 14;
			d += ` M${f(tx)} ${f(ty)} Q${f(cx)} ${f(cy - 6)} ${f(ex)} ${f(ey)} Q${f(cx)} ${f(cy + 8)} ${f(tx)} ${f(ty + 3)} Z`;
		}
		return d;
	}

	/** The cartoon smoke cloud: overlapping circles [cx, cy, r] (outlined underneath, filled on top). */
	const CLOUD = [
		[440, 10, 22],
		[470, -4, 26],
		[505, 14, 24],
		[532, -8, 30],
		[566, 8, 28],
		[600, -12, 30],
		[632, 12, 26],
		[662, -6, 28],
		[696, 12, 24],
		[726, -4, 24],
		[756, 12, 20],
		[590, 24, 22],
		[548, 24, 18],
		[676, 26, 18]
	];

	const PALMS = [palm(108, 206, 168, 22), palm(196, 206, 124, -14), palm(1004, 206, 140, 16), palm(1094, 206, 178, -24)].join(' ');

	/** A simple seven-leaflet cannabis leaf around (0,0), pointing up. */
	const LEAF = [
		[-100, 9, 2.4],
		[100, 9, 2.4],
		[-62, 15, 3.4],
		[62, 15, 3.4],
		[-30, 20, 4.2],
		[30, 20, 4.2],
		[0, 24, 4.8]
	]
		.map(([a, l, w]) => {
			const r = (a * Math.PI) / 180;
			const tip = [Math.sin(r) * l, -Math.cos(r) * l];
			const side = [Math.cos(r) * w, Math.sin(r) * w];
			const mid = [tip[0] * 0.5, tip[1] * 0.5];
			return `M0 0 Q${f(mid[0] + side[0])} ${f(mid[1] + side[1])} ${f(tip[0])} ${f(tip[1])} Q${f(mid[0] - side[0])} ${f(mid[1] - side[1])} 0 0 Z`;
		})
		.join(' ');
</script>

<script lang="ts">
	const uid = $props.id();
	const ref = (name: string) => `${uid}-${name}`;
	const url = (name: string) => `url(#${ref(name)})`;

	const SKIN_A = '#d3a27a'; // the lanky one
	const SKIN_B = '#b27a4f'; // the stocky one
	const HAIR_A = '#3a281c';
	const JEANS = '#35558e';
	const SLACKS = '#2a2b37';
</script>

{#snippet limb(d: string, color: string, w: number)}
	<path {d} fill="none" stroke={INK} stroke-width={w + 5} stroke-linecap="round" stroke-linejoin="round" />
	<path {d} fill="none" stroke={color} stroke-width={w} stroke-linecap="round" stroke-linejoin="round" />
{/snippet}

<svg
	class="smoke-break block h-full w-full"
	viewBox="0 0 1200 260"
	preserveAspectRatio="xMidYMax slice"
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<linearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#1a0a2c" />
			<stop offset="0.42" stop-color="#5a1c56" />
			<stop offset="0.68" stop-color="#b8383f" />
			<stop offset="0.8" stop-color="#ff8a3a" />
		</linearGradient>
		<linearGradient id={ref('sun')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#fff07a" />
			<stop offset="0.55" stop-color="#ffb347" />
			<stop offset="1" stop-color="#ff5a36" />
		</linearGradient>
		<radialGradient id={ref('glow')}>
			<stop offset="0.45" stop-color="#ffb04a" stop-opacity="0.55" />
			<stop offset="1" stop-color="#ff5a36" stop-opacity="0" />
		</radialGradient>
		<mask id={ref('stripes')}>
			<rect width="1200" height="260" fill="#fff" />
			{#each [[146, 2], [158, 3], [170, 4], [182, 5], [194, 6]] as [y, h] (y)}
				<rect x="0" {y} width="1200" height={h} fill="#000" />
			{/each}
		</mask>
		<linearGradient id={ref('ground')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#3a1630" />
			<stop offset="1" stop-color="#140810" />
		</linearGradient>
		<linearGradient id={ref('couch')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#d9733a" />
			<stop offset="1" stop-color="#9a4316" />
		</linearGradient>
		<radialGradient id={ref('puff')}>
			<!-- soft puffs that rise off the mouth and the ember -->
			<stop offset="0" stop-color="#eef4ea" stop-opacity="0.85" />
			<stop offset="0.6" stop-color="#d7e3d2" stop-opacity="0.45" />
			<stop offset="1" stop-color="#d7e3d2" stop-opacity="0" />
		</radialGradient>
		<radialGradient id={ref('ember')}>
			<stop offset="0" stop-color="#fff2a0" />
			<stop offset="0.35" stop-color="#ff8a1e" stop-opacity="0.9" />
			<stop offset="1" stop-color="#ff3a0a" stop-opacity="0" />
		</radialGradient>
		<linearGradient id={ref('lava')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffd35a" />
			<stop offset="1" stop-color="#ff7a2a" />
		</linearGradient>
		<pattern id={ref('plaid')} width="12" height="12" patternUnits="userSpaceOnUse">
			<rect width="12" height="12" fill="#b3202a" />
			<rect width="12" height="6" fill="#120808" opacity="0.6" />
			<rect width="6" height="12" fill="#120808" opacity="0.6" />
		</pattern>
		<pattern id={ref('bandana')} width="7" height="7" patternUnits="userSpaceOnUse">
			<rect width="7" height="7" fill="#d4262b" />
			<circle cx="2" cy="2" r="0.9" fill="#fff" />
			<circle cx="5.5" cy="5.5" r="0.7" fill="#fff" />
		</pattern>
	</defs>

	<!-- dusk sky, stars, striped retro sun -->
	<rect width="1200" height="260" fill={url('sky')} />
	<g class="sb-stars" fill="#fff">
		{#each [[60, 22], [170, 48], [300, 16], [380, 60], [470, 30], [740, 20], [860, 52], [950, 18], [1060, 40], [1150, 70], [250, 84], [1010, 96]] as [x, y], i (i)}
			<circle cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} style:animation-delay="{-i * 0.7}s" />
		{/each}
	</g>
	<circle cx="600" cy="196" r="230" fill={url('glow')} />
	<circle cx="600" cy="196" r="122" fill={url('sun')} mask={url('stripes')} />

	<!-- hills, palms, street -->
	<path
		d="M0 206 L0 176 Q70 158 150 172 T320 166 T500 178 T690 164 T880 176 T1060 162 T1200 172 L1200 206 Z"
		fill="#4a1848"
	/>
	<path d="M0 206 L0 188 Q120 176 260 190 T560 186 T860 192 T1200 184 L1200 206 Z" fill="#2c0f2c" />
	<path d={PALMS} fill="#12061a" />
	<rect y="204" width="1200" height="56" fill={url('ground')} />
	<rect y="204" width="1200" height="2" fill="#ff8a3a" opacity="0.35" />

	<!-- potted plant (left) -->
	<g transform="translate(318 0)">
		<path d="M-6 236 L-2 160" stroke="#2b5a1e" stroke-width="3" />
		<g fill="#3f8a2c" stroke="#1d4a16" stroke-width="0.8">
			<path d={LEAF} transform="translate(-2 160) scale(1.25)" />
			<path d={LEAF} transform="translate(-4 186) rotate(-58) scale(1)" />
			<path d={LEAF} transform="translate(-4 194) rotate(60) scale(1)" />
			<path d={LEAF} transform="translate(-5 214) rotate(-70) scale(0.8)" />
		</g>
		<path d="M-22 226 L22 226 L16 252 L-16 252 Z" fill="#9c4a22" stroke={INK} stroke-width="2.5" stroke-linejoin="round" />
		<rect x="-24" y="222" width="48" height="8" rx="2" fill="#b85a2a" stroke={INK} stroke-width="2.5" />
	</g>

	<!-- side table + lava lamp (right) -->
	<g>
		<rect x="852" y="206" width="66" height="8" rx="2" fill="#6b3a1c" stroke={INK} stroke-width="2.5" />
		<path d="M860 214 L858 250 M910 214 L912 250" stroke={INK} stroke-width="4" stroke-linecap="round" />
		<path d="M872 206 L876 188 L896 188 L900 206 Z" fill="#c9c9d2" stroke={INK} stroke-width="2.5" stroke-linejoin="round" />
		<path d="M876 188 Q868 150 880 118 L892 118 Q904 150 896 188 Z" fill="#5a1d6a" stroke={INK} stroke-width="2.5" />
		<g fill={url('lava')}>
			<ellipse class="sb-lava" cx="886" cy="172" rx="7" ry="9" />
			<ellipse class="sb-lava sb-lava-2" cx="884" cy="140" rx="5" ry="7" />
			<ellipse cx="886" cy="185" rx="9" ry="3" />
		</g>
		<path d="M878 118 L880 108 L892 108 L894 118 Z" fill="#c9c9d2" stroke={INK} stroke-width="2.5" stroke-linejoin="round" />
		<circle cx="886" cy="150" r="40" fill={url('glow')} opacity="0.35" />
	</g>

	<!-- the couch -->
	<g stroke={INK} stroke-width="2.5" stroke-linejoin="round">
		<rect x="410" y="124" width="380" height="80" rx="30" fill={url('couch')} />
		<path d="M600 132 L600 196" fill="none" stroke="#7a3210" stroke-width="2" />
		<path d="M424 140 Q505 132 588 140 M612 140 Q695 132 776 140" fill="none" stroke="#f3a064" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.6" />
		<rect x="398" y="184" width="404" height="36" rx="12" fill="#c8622a" />
		<path d="M600 186 L600 218" fill="none" stroke="#7a3210" stroke-width="2" />
		<rect x="390" y="214" width="420" height="14" rx="6" fill="#8a3a14" />
		<rect x="404" y="226" width="10" height="16" rx="2" fill="#3a1a08" />
		<rect x="786" y="226" width="10" height="16" rx="2" fill="#3a1a08" />
		<rect x="368" y="148" width="56" height="80" rx="22" fill={url('couch')} />
		<rect x="776" y="148" width="56" height="80" rx="22" fill={url('couch')} />
	</g>

	<!-- ===== the lanky one (left) ===== -->
	<g stroke-linejoin="round">
		<!-- long hair behind -->
		<path
			d="M490 52 Q500 24 522 25 Q548 26 554 54 Q560 80 562 104 Q566 124 574 136 Q556 138 548 122 L494 122 Q486 138 468 136 Q478 122 480 102 Q482 78 490 52 Z"
			fill={HAIR_A}
			stroke={INK}
			stroke-width="2.5"
		/>
		<path d="M484 96 Q482 116 474 130 M558 96 Q560 116 568 130" fill="none" stroke="#8d8378" stroke-width="2" opacity="0.8" />
		<!-- legs: knees towards us, shins down, sandals -->
		<path d="M488 206 L490 246 L510 246 L514 206 Z" fill={JEANS} stroke={INK} stroke-width="2.5" />
		<path d="M530 206 L542 246 L562 246 L556 206 Z" fill={JEANS} stroke={INK} stroke-width="2.5" />
		<ellipse cx="501" cy="204" rx="18" ry="12" fill={JEANS} stroke={INK} stroke-width="2.5" />
		<ellipse cx="542" cy="205" rx="18" ry="12" fill={JEANS} stroke={INK} stroke-width="2.5" />
		<ellipse cx="499" cy="249" rx="16" ry="6" fill="#6a4426" stroke={INK} stroke-width="2.5" />
		<ellipse cx="554" cy="250" rx="16" ry="6" fill="#6a4426" stroke={INK} stroke-width="2.5" />
		<!-- jeans waist, tank top, open suede vest with fringe -->
		<rect x="482" y="182" width="78" height="20" rx="6" fill={JEANS} stroke={INK} stroke-width="2.5" />
		<path d="M488 116 Q520 108 554 116 L558 188 Q520 194 484 188 Z" fill="#ece4d4" stroke={INK} stroke-width="2.5" />
		<path d="M486 117 Q479 152 483 192 L504 192 Q507 150 501 119 Z" fill="#a06c3c" stroke={INK} stroke-width="2.5" />
		<path d="M556 117 Q563 152 559 192 L538 192 Q535 150 541 119 Z" fill="#a06c3c" stroke={INK} stroke-width="2.5" />
		<path
			d="M486 192 l-1 7 M490 192 l0 8 M494 192 l0 7 M498 192 l1 8 M502 192 l1 7 M540 192 l-1 7 M544 192 l-1 8 M548 192 l0 7 M552 192 l0 8 M556 192 l1 7"
			stroke="#7a4e26"
			stroke-width="1.6"
			stroke-linecap="round"
		/>
		<rect x="510" y="102" width="22" height="16" fill={SKIN_A} stroke={INK} stroke-width="2.5" />
		<!-- arms: one hand on the knee, the other passing the joint -->
		{@render limb('M489 123 L471 163 L486 197', SKIN_A, 11)}
		<ellipse cx="490" cy="201" rx="8.5" ry="6.5" fill={SKIN_A} stroke={INK} stroke-width="2.2" />
		<path d="M484 205 Q490 208 496 205.5 M486 202 Q491 204 497 202" fill="none" stroke={INK} stroke-width="1.4" stroke-linecap="round" />
		{@render limb('M553 122 Q572 140 578 152 Q590 150 601 142', SKIN_A, 11)}
		<!-- face -->
		<ellipse cx="521" cy="78" rx="22" ry="27" fill={SKIN_A} stroke={INK} stroke-width="2.5" />
		<!-- hair on top, falling past the cheeks -->
		<path d="M497 60 Q497 32 521 31 Q546 32 545 60 Q534 52 521 52 Q508 52 497 60 Z" fill={HAIR_A} stroke={INK} stroke-width="2.5" />
		<path d="M499 62 Q492 86 494 110 Q489 90 489 66 Z M543 62 Q550 86 548 110 Q553 90 553 66 Z" fill={HAIR_A} stroke={INK} stroke-width="2" />
		<!-- bandana headband with knot -->
		<path d="M497 55 Q521 47 545 55 L545 63 Q521 55 497 63 Z" fill={url('bandana')} stroke={INK} stroke-width="2.2" />
		<path d="M545 57 L562 52 L558 62 Z M545 60 L560 70 L551 71 Z" fill={url('bandana')} stroke={INK} stroke-width="2" />
		<!-- heavy-lidded red eyes, bags, relaxed brows -->
		<g stroke={INK}>
			<ellipse cx="512" cy="75" rx="5.6" ry="3.3" fill="#f4d4cc" stroke-width="1.6" />
			<ellipse cx="530" cy="75" rx="5.6" ry="3.3" fill="#f4d4cc" stroke-width="1.6" />
			<circle cx="512" cy="76.3" r="1.9" fill="#2a1a10" stroke="none" />
			<circle cx="530" cy="76.3" r="1.9" fill="#2a1a10" stroke="none" />
			<path d="M506 75.2 Q512 70 518 75.2 L518 73 Q512 68 506 73 Z" fill={SKIN_A} stroke="none" />
			<path d="M524 75.2 Q530 70 536 75.2 L536 73 Q530 68 524 73 Z" fill={SKIN_A} stroke="none" />
			<path d="M506 75.2 Q512 72.6 518 75.2 M524 75.2 Q530 72.6 536 75.2" fill="none" stroke-width="2" stroke-linecap="round" />
			<path d="M507 80 Q512 82 517 80 M525 80 Q530 82 535 80" fill="none" stroke-width="1" opacity="0.55" />
			<path d="M505 67.5 Q511 66 517 67.8 M525 67.8 Q531 66 537 67.5" fill="none" stroke-width="2.2" stroke-linecap="round" />
			<path d="M509 76.5 l2 -0.6 M533 76.5 l-2 -0.6" stroke="#d0303a" stroke-width="0.7" />
			<path d="M521 76 Q517 85 518 88 Q521 90.5 525 88" fill="none" stroke-width="1.8" stroke-linecap="round" />
		</g>
		<!-- full beard + moustache, mouth blowing smoke -->
		<path
			d="M497 82 Q495 106 508 114 Q521 122 534 114 Q547 106 545 82 Q540 94 533 93 Q521 97 509 93 Q502 94 497 82 Z"
			fill="#4a3828"
			stroke={INK}
			stroke-width="2.2"
		/>
		<path d="M505 100 Q508 108 512 111 M537 100 Q534 108 530 111 M521 106 L521 116" fill="none" stroke="#8d8378" stroke-width="1.4" opacity="0.8" />
		<path d="M507 92 Q514 86 521 89.5 Q528 86 535 92 Q528 96.5 521 93 Q514 96.5 507 92 Z" fill="#3a2a1e" stroke={INK} stroke-width="1.8" />
		<ellipse cx="521" cy="99" rx="3.4" ry="2.8" fill="#3a1410" stroke={INK} stroke-width="1.4" />
	</g>

	<!-- ===== the stocky one (right) ===== -->
	<g stroke-linejoin="round">
		<!-- legs, shoes -->
		<path d="M656 207 L658 246 L680 246 L686 207 Z" fill={SLACKS} stroke={INK} stroke-width="2.5" />
		<path d="M696 207 L702 246 L724 246 L726 207 Z" fill={SLACKS} stroke={INK} stroke-width="2.5" />
		<ellipse cx="671" cy="205" rx="20" ry="12" fill={SLACKS} stroke={INK} stroke-width="2.5" />
		<ellipse cx="711" cy="205" rx="20" ry="12" fill={SLACKS} stroke={INK} stroke-width="2.5" />
		<ellipse cx="667" cy="249" rx="18" ry="6.5" fill="#0c0c10" stroke={INK} stroke-width="2.5" />
		<ellipse cx="716" cy="249" rx="18" ry="6.5" fill="#0c0c10" stroke={INK} stroke-width="2.5" />
		<!-- waist, flannel buttoned to the top -->
		<rect x="648" y="184" width="86" height="20" rx="6" fill={SLACKS} stroke={INK} stroke-width="2.5" />
		<path d="M652 126 Q691 115 730 126 L734 190 Q691 197 648 190 Z" fill={url('plaid')} stroke={INK} stroke-width="2.5" />
		<path d="M691 122 L691 190" stroke={INK} stroke-width="1.5" />
		{#each [134, 150, 166, 182] as y (y)}
			<circle cx="694" cy={y} r="1.7" fill="#f1e6d0" stroke={INK} stroke-width="0.8" />
		{/each}
		<path d="M706 140 L722 140 L722 154 L706 154 Z" fill="none" stroke={INK} stroke-width="1.4" />
		<rect x="681" y="110" width="20" height="14" fill={SKIN_B} stroke={INK} stroke-width="2.5" />
		<path d="M676 121 L691 128 L706 121 L702 131 L691 133 L680 131 Z" fill={url('plaid')} stroke={INK} stroke-width="2" />
		<!-- arms: reaching for the joint; thumbs-up on the armrest -->
		{@render limb('M656 132 Q632 172 640 152 Q643 142 644 136', 'url(#' + ref('plaid') + ')', 15)}
		{@render limb('M727 132 Q752 158 768 152', 'url(#' + ref('plaid') + ')', 15)}
		<circle cx="644" cy="132" r="7.5" fill={SKIN_B} stroke={INK} stroke-width="2.2" />
		<path d="M637 129 Q634 127 635 123.5 M639.5 126 Q638 122.5 640.5 121" fill="none" stroke={INK} stroke-width="2" stroke-linecap="round" />
		<rect x="766" y="143" width="15" height="15" rx="5" fill={SKIN_B} stroke={INK} stroke-width="2.2" />
		<path d="M772 144 L772 132 Q772 128 776 129 Q779 130 778 135 L777 144" fill={SKIN_B} stroke={INK} stroke-width="2.2" />
		<!-- head: ears, face, slicked hair, sideburns -->
		<ellipse cx="666" cy="92" rx="5" ry="7" fill={SKIN_B} stroke={INK} stroke-width="2.2" />
		<ellipse cx="716" cy="92" rx="5" ry="7" fill={SKIN_B} stroke={INK} stroke-width="2.2" />
		<ellipse cx="691" cy="89" rx="25" ry="27" fill={SKIN_B} stroke={INK} stroke-width="2.5" />
		<path d="M666 86 Q663 58 691 56 Q719 58 716 86 Q712 71 700 69 Q690 66 682 69 Q670 72 666 86 Z" fill="#14100c" stroke={INK} stroke-width="2.2" />
		<path d="M676 61 Q690 56 706 62" fill="none" stroke="#4a4a58" stroke-width="1.6" opacity="0.8" />
		<path d="M667 84 L670 98 L673 84 Z M715 84 L712 98 L709 84 Z" fill="#14100c" />
		<!-- giggling squinty red eyes, raised brows -->
		<g stroke={INK} fill="none" stroke-linecap="round">
			<path d="M675 87 Q681 81 687 87" stroke-width="2.6" />
			<path d="M695 87 Q701 81 707 87" stroke-width="2.6" />
			<path d="M676 89 Q681 91 686 89 M696 89 Q701 91 706 89" stroke="#d0303a" stroke-width="1.2" opacity="0.8" />
			<path d="M674 77 Q681 72 688 76 M694 76 Q701 72 708 77" stroke-width="2.4" />
			<path d="M691 89 Q686 98 688 101 Q691 104 695 101" stroke-width="1.8" />
		</g>
		<!-- big grin under a thick moustache, soul patch -->
		<path d="M675 108 Q691 126 707 108 Q691 115 675 108 Z" fill="#5a1612" stroke={INK} stroke-width="2" />
		<path d="M678 109.5 Q691 116 704 109.5 Q691 112.5 678 109.5 Z" fill="#fff" />
		<path
			d="M671 106 Q680 98 691 101 Q702 98 711 106 Q714 113 708 115 Q702 106 691 108 Q680 106 674 115 Q668 113 671 106 Z"
			fill="#14100c"
			stroke={INK}
			stroke-width="1.6"
		/>
		<path d="M688 120 L694 120 L691 125 Z" fill="#14100c" />
	</g>

	<!-- the cone joint being passed: crutch end to the stocky one, lit end glowing -->
	<g stroke-linejoin="round">
		<path d="M576 144.3 L635.3 127.9 L636.7 132.1 L580 155.7 Z" fill="#f4efe6" stroke={INK} stroke-width="2" />
		<path d="M627.7 130.5 L635.3 127.9 L636.7 132.1 L629.1 134.7 Z" fill="#c9a26a" stroke={INK} stroke-width="1.5" />
		<path d="M586 147.5 L626 134" stroke="#d8cfbf" stroke-width="1" />
		<ellipse cx="578" cy="150" rx="3.4" ry="6.2" transform="rotate(-19 578 150)" fill="#6d6a66" stroke={INK} stroke-width="1.5" />
		<circle class="sb-ember" cx="577" cy="150" r="11" fill={url('ember')} />
		<circle cx="577" cy="150" r="2.8" fill="#ff7a1e" />
		<!-- fingers around the middle -->
		<ellipse cx="604" cy="141" rx="6.5" ry="7.5" fill={SKIN_A} stroke={INK} stroke-width="2.2" />
		<path d="M599.5 135.5 Q604 133.5 608.5 135.5" fill="none" stroke={INK} stroke-width="1.6" stroke-linecap="round" />
	</g>

	<!-- smoke: a cartoon cloud hanging over them, the exhale and the ember's curl feeding it -->
	<g class="sb-cloud" opacity="0.88">
		<g fill="none" stroke="#9fb09b" stroke-width="5">
			{#each CLOUD as [cx, cy, r], i (i)}<circle {cx} {cy} {r} />{/each}
		</g>
		<g fill="#e9efe5">
			{#each CLOUD as [cx, cy, r], i (i)}<circle {cx} {cy} {r} />{/each}
		</g>
		<path
			d="M470 18 q10 -10 20 0 M548 30 q12 -12 24 0 q12 12 24 0 M650 22 q10 -10 20 0 M716 30 q9 -9 18 0"
			fill="none"
			stroke="#b9c8b5"
			stroke-width="2.5"
			stroke-linecap="round"
		/>
	</g>
	<g fill="none" stroke-linecap="round" stroke="#e9efe5">
		<path
			class="sb-curl"
			d="M519 101 C505 108 488 106 476 96 C462 84 470 70 458 58 C448 48 452 38 446 30"
			stroke-width="7"
			opacity="0.55"
		/>
		<path
			class="sb-curl sb-curl-2"
			d="M575 145 C565 130 585 118 575 104 C565 90 585 78 579 62 C575 52 585 46 582 38"
			stroke-width="4.5"
			opacity="0.6"
		/>
	</g>
	{#each [[510, 100, 'l'], [576, 146, 'u'], [512, 101, 'l'], [578, 144, 'u']] as [cx, cy, way], i (i)}
		<circle
			class="sb-puff"
			class:sb-puff-left={way === 'l'}
			{cx}
			{cy}
			r="8"
			fill={url('puff')}
			style:animation-delay="{i * 1.6}s"
		/>
	{/each}
</svg>

<style>
	.smoke-break :global(*) {
		transform-box: fill-box;
	}
	.sb-stars circle {
		animation: sb-twinkle 3.2s ease-in-out infinite alternate;
	}
	.sb-ember {
		transform-origin: center;
		animation: sb-ember 2.4s ease-in-out infinite;
	}
	.sb-lava {
		animation: sb-lava 9s ease-in-out infinite alternate;
	}
	.sb-lava-2 {
		animation-duration: 12s;
		animation-direction: alternate-reverse;
	}
	.sb-curl {
		transform-origin: 50% 100%;
		animation: sb-sway 6s ease-in-out infinite alternate;
	}
	.sb-curl-2 {
		animation-duration: 4.5s;
	}
	.sb-cloud {
		transform-origin: center;
		animation: sb-drift 10s ease-in-out infinite alternate;
	}
	.sb-puff {
		transform-origin: center;
		opacity: 0;
		animation: sb-rise 6.4s ease-out infinite;
	}
	.sb-puff-left {
		animation-name: sb-rise-left;
	}
	@keyframes sb-twinkle {
		from {
			opacity: 0.25;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes sb-ember {
		0%,
		100% {
			opacity: 0.7;
			transform: scale(0.9);
		}
		45% {
			opacity: 1;
			transform: scale(1.25);
		}
	}
	@keyframes sb-lava {
		from {
			transform: translateY(0) scale(1, 1);
		}
		to {
			transform: translateY(-22px) scale(0.85, 1.15);
		}
	}
	@keyframes sb-sway {
		from {
			transform: skewX(-4deg);
		}
		to {
			transform: skewX(5deg) translateX(3px);
		}
	}
	@keyframes sb-drift {
		from {
			transform: translate(-6px, 2px) scale(0.95);
		}
		to {
			transform: translate(8px, -3px) scale(1.08);
		}
	}
	@keyframes sb-rise {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.5);
		}
		15% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
			transform: translate(-14px, -90px) scale(2.6);
		}
	}
	@keyframes sb-rise-left {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.5);
		}
		15% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
			transform: translate(-60px, -64px) scale(2.6);
		}
	}
</style>
