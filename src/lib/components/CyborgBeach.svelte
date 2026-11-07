<!--
	Sun-holiday banner between Divergence & Mastery and Backup (the user's ask, 2026-11-07; it replaced
	the smoke-break couch duo): a big cartoon cyborg in the spirit of the classic film killer robot on a
	beach holiday. Flat-top, black shades with one red eye glowing through, part of the cheek torn away
	to chrome, a chrome forearm; lounging in a striped deck chair under a beach umbrella with a fat
	blunt clamped in his teeth, blowing smoke rings, a coconut cocktail in his metal hand. Hawaiian
	shirt, flame swim trunks, flip-flops; sun, sea, palms, a cooler with "SPF 800" sunscreen (a wink,
	not a name), a flame surfboard, a crab, a beach ball and a sandcastle.
	Our own drawing; no names or film quotes in the UI. Decorative and aria-hidden; the sun, clouds,
	waves, smoke, ember, red eye, gulls and crab move (prefers-reduced-motion freezes it).
-->
<script lang="ts" module>
	const INK = '#140a06';

	const f = (n: number) => n.toFixed(1);
	const rad = (deg: number) => (deg * Math.PI) / 180;

	type Palm = [x: number, base: number, h: number, lean: number];
	const PALMS: Palm[] = [
		[70, 238, 196, 30],
		[186, 232, 150, -20],
		[1030, 234, 156, 18],
		[1130, 242, 200, -30]
	];

	/** A point on the curve a palm trunk follows (t = 0 at the sand, 1 at the crown). */
	function trunkAt([x, base, h, lean]: Palm, t: number): [number, number] {
		const u = 1 - t;
		const cx = x + lean * 0.25;
		const cy = base - h * 0.55;
		return [u * u * x + 2 * u * t * cx + t * t * (x + lean), u * u * base + 2 * u * t * cy + t * t * (base - h)];
	}

	function trunk(p: Palm): string {
		const [x, base, h, lean] = p;
		const tx = x + lean;
		const ty = base - h;
		return `M${f(x - 7)} ${base} Q${f(x + lean * 0.25 - 4)} ${f(base - h * 0.55)} ${f(tx - 3)} ${f(ty)} L${f(tx + 3)} ${f(ty)} Q${f(x + lean * 0.25 + 4)} ${f(base - h * 0.55)} ${f(x + 7)} ${base} Z`;
	}

	function rings(p: Palm): string {
		let d = '';
		for (let t = 0.1; t < 0.93; t += 0.09) {
			const [px, py] = trunkAt(p, t);
			const w = 6.5 * (1 - t) + 2.8 * t;
			d += ` M${f(px - w)} ${f(py)} q${f(w)} 3 ${f(2 * w)} 0`;
		}
		return d;
	}

	function fronds([x, base, h, lean]: Palm): string {
		const tx = x + lean;
		const ty = base - h;
		let d = '';
		for (const [a, len] of [
			[-168, 60],
			[-140, 68],
			[-108, 48],
			[-72, 48],
			[-40, 68],
			[-12, 60],
			[-90, 36]
		]) {
			const r = rad(a);
			const dx = Math.cos(r) * len;
			const ex = tx + dx;
			const ey = ty + Math.sin(r) * len * 0.45 + Math.abs(dx) * 0.55;
			const cx = tx + dx * 0.5;
			const cy = ty + Math.sin(r) * len * 0.5 - 14;
			d += ` M${f(tx)} ${f(ty)} Q${f(cx)} ${f(cy - 7)} ${f(ex)} ${f(ey)} Q${f(cx)} ${f(cy + 9)} ${f(tx)} ${f(ty + 4)} Z`;
		}
		return d;
	}

	const TRUNKS = PALMS.map(trunk).join(' ');
	const RINGS = PALMS.map(rings).join(' ');
	const FRONDS = PALMS.map(fronds).join(' ');
	const CROWNS = PALMS.map(([x, base, h, lean]) => [x + lean, base - h]);

	/** Twelve sun rays around (0,0). */
	const RAYS = Array.from({ length: 12 }, (_, i) => {
		const a = rad(i * 30);
		const p = (r: number, da: number) => `${f(Math.cos(a + rad(da)) * r)} ${f(Math.sin(a + rad(da)) * r)}`;
		return `M${p(32, -7)} L${p(i % 2 ? 42 : 48, 0)} L${p(32, 7)} Z`;
	}).join(' ');

	/** A puffy cloud: circles [dx, dy, r]. */
	const CLOUD = [
		[0, 0, 15],
		[18, -9, 19],
		[38, -2, 15],
		[54, 5, 10],
		[-15, 5, 10],
		[22, 6, 13]
	];
	const CLOUDS: [x: number, y: number, s: number][] = [
		[140, 40, 1],
		[318, 22, 0.7],
		[990, 30, 1.1],
		[1150, 70, 0.75],
		[880, 104, 0.55]
	];

	/** Hibiscus petals around a centre. */
	const petals = (cx: number, cy: number, r: number) =>
		Array.from({ length: 5 }, (_, i) => [cx + Math.cos(rad(i * 72 - 90)) * r, cy + Math.sin(rad(i * 72 - 90)) * r]);

	/** Sand speckles: a fixed pseudo-random scatter so every render is the same. */
	const SPECKS = (() => {
		let s = 7;
		const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
		return Array.from({ length: 70 }, () => [rnd() * 1200, 206 + rnd() * 52, 0.6 + rnd() * 0.9]);
	})();

	const WAVES = [
		[90, 162],
		[262, 174],
		[402, 156],
		[766, 160],
		[880, 178],
		[1004, 158],
		[1118, 172],
		[196, 186],
		[958, 188]
	];
	const GLINTS = [
		[150, 152],
		[352, 168],
		[742, 150],
		[846, 170],
		[1080, 162],
		[460, 182],
		[230, 160]
	];
</script>

<script lang="ts">
	const uid = $props.id();
	const ref = (name: string) => `${uid}-${name}`;
	const url = (name: string) => `url(#${ref(name)})`;

	const SKIN = '#d9976a';
	const SKIN_DARK = '#a8663c';
	const WOOD = '#b9813f';
	const RAW = '#8a2a1c'; // the torn skin's edge
</script>

{#snippet limb(d: string, color: string, w: number)}
	<path {d} fill="none" stroke={INK} stroke-width={w + 5} stroke-linecap="round" stroke-linejoin="round" />
	<path {d} fill="none" stroke={color} stroke-width={w} stroke-linecap="round" stroke-linejoin="round" />
{/snippet}

<svg
	class="cyborg-beach block h-full w-full"
	viewBox="0 0 1200 260"
	preserveAspectRatio="xMidYMax slice"
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<linearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#0d58c2" />
			<stop offset="0.36" stop-color="#2f8fe6" />
			<stop offset="0.58" stop-color="#9fd8ff" />
		</linearGradient>
		<radialGradient id={ref('sunglow')}>
			<stop offset="0.3" stop-color="#fff6b0" stop-opacity="0.9" />
			<stop offset="1" stop-color="#fff6b0" stop-opacity="0" />
		</radialGradient>
		<radialGradient id={ref('sun')} cx="0.4" cy="0.35">
			<stop offset="0" stop-color="#fffbe0" />
			<stop offset="0.6" stop-color="#ffe14a" />
			<stop offset="1" stop-color="#ffb21f" />
		</radialGradient>
		<linearGradient id={ref('sea')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#1663c0" />
			<stop offset="0.4" stop-color="#178fd0" />
			<stop offset="1" stop-color="#3ed2cf" />
		</linearGradient>
		<linearGradient id={ref('sand')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#f7dc9a" />
			<stop offset="1" stop-color="#e6b663" />
		</linearGradient>
		<linearGradient id={ref('chrome')} x1="0" y1="0" x2="0.3" y2="1">
			<stop offset="0" stop-color="#fbfdff" />
			<stop offset="0.35" stop-color="#b9c3cf" />
			<stop offset="0.6" stop-color="#5f6a78" />
			<stop offset="0.85" stop-color="#e3e8ee" />
			<stop offset="1" stop-color="#8a95a3" />
		</linearGradient>
		<linearGradient id={ref('lens')} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#05070a" />
			<stop offset="0.5" stop-color="#22303f" />
			<stop offset="1" stop-color="#05070a" />
		</linearGradient>
		<radialGradient id={ref('redeye')}>
			<stop offset="0" stop-color="#ff3a2a" stop-opacity="1" />
			<stop offset="0.45" stop-color="#ff1a10" stop-opacity="0.65" />
			<stop offset="1" stop-color="#ff1a10" stop-opacity="0" />
		</radialGradient>
		<radialGradient id={ref('ember')}>
			<stop offset="0" stop-color="#fff2a0" />
			<stop offset="0.35" stop-color="#ff8a1e" stop-opacity="0.9" />
			<stop offset="1" stop-color="#ff3a0a" stop-opacity="0" />
		</radialGradient>
		<radialGradient id={ref('puff')}>
			<stop offset="0" stop-color="#f4f6f2" stop-opacity="0.85" />
			<stop offset="0.6" stop-color="#e2e8e0" stop-opacity="0.45" />
			<stop offset="1" stop-color="#e2e8e0" stop-opacity="0" />
		</radialGradient>
		<!-- Hawaiian shirt: teal with hibiscus flowers and leaves -->
		<pattern id={ref('shirt')} width="24" height="24" patternUnits="userSpaceOnUse">
			<rect width="24" height="24" fill="#0e9c96" />
			<ellipse cx="17" cy="17" rx="4.6" ry="1.8" transform="rotate(-35 17 17)" fill="#0a6644" />
			<ellipse cx="4" cy="19" rx="3.6" ry="1.5" transform="rotate(30 4 19)" fill="#0a6644" />
			{#each petals(7, 7, 2.5) as [x, y], i (i)}<circle cx={x} cy={y} r="2.3" fill="#ff4f6d" />{/each}
			<circle cx="7" cy="7" r="1.1" fill="#ffe066" />
			{#each petals(19, 6, 1.5) as [x, y], i (i)}<circle cx={x} cy={y} r="1.4" fill="#fff4dc" />{/each}
			<circle cx="19" cy="6" r="0.7" fill="#ff9a3a" />
		</pattern>
		<!-- deck-chair canvas -->
		<pattern id={ref('canvas')} width="16" height="16" patternUnits="userSpaceOnUse">
			<rect width="16" height="16" fill="#f3efe4" />
			<rect width="8" height="16" fill="#2f6fe0" />
		</pattern>
		<clipPath id={ref('canopy')}>
			<path d="M358 72 Q366 34 468 24 Q570 34 578 72 Q550.5 84 523 72 Q495.5 84 468 72 Q440.5 84 413 72 Q385.5 84 358 72 Z" />
		</clipPath>
	</defs>

	<!-- sky, sun, clouds, gulls -->
	<rect width="1200" height="260" fill={url('sky')} />
	<circle cx="784" cy="44" r="86" fill={url('sunglow')} />
	<g transform="translate(784 44)">
		<path class="cb-rays" d={RAYS} fill="#ffe56a" />
	</g>
	<circle cx="784" cy="44" r="25" fill={url('sun')} />
	{#each CLOUDS as [x, y, s], i (i)}
		<g transform="translate({x} {y}) scale({s})">
			<g class="cb-cloud" style:animation-delay="{-i * 4}s">
				<g fill="#cfe6fa">
					{#each CLOUD as [dx, dy, r], j (j)}<circle cx={dx} cy={dy + 4} {r} />{/each}
				</g>
				<g fill="#ffffff">
					{#each CLOUD as [dx, dy, r], j (j)}<circle cx={dx} cy={dy} {r} />{/each}
				</g>
			</g>
		</g>
	{/each}
	<g fill="none" stroke="#1d2a3a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
		{#each [[880, 64], [906, 52], [300, 72], [1060, 108]] as [x, y], i (i)}
			<path class="cb-gull" d="M{x} {y} q5 -6 10 0 q5 -6 10 0" style:animation-delay="{-i * 0.9}s" />
		{/each}
	</g>

	<!-- sea: waves, glints, a sailboat on the horizon -->
	<rect y="144" width="1200" height="56" fill={url('sea')} />
	<rect y="144" width="1200" height="1.6" fill="#e6f7ff" opacity="0.7" />
	<g transform="translate(250 0)">
		<path d="M-18 140 L18 140 L12 146 L-12 146 Z" fill="#f6f3ea" stroke="#22303f" stroke-width="1.2" />
		<path d="M0 104 L0 140" stroke="#22303f" stroke-width="1.4" />
		<path d="M1 106 L1 137 L22 137 Z" fill="#ffffff" stroke="#22303f" stroke-width="1" />
		<path d="M-1 112 L-1 137 L-16 137 Z" fill="#ff4418" stroke="#22303f" stroke-width="1" />
	</g>
	<g class="cb-waves" fill="none" stroke="#e6f7ff" stroke-width="2" stroke-linecap="round" opacity="0.7">
		{#each WAVES as [x, y], i (i)}<path d="M{x} {y} q6 -4 12 0 q6 4 12 0" />{/each}
	</g>
	<g fill="#ffffff">
		{#each GLINTS as [x, y], i (i)}
			<path class="cb-glint" d="M{x} {y - 4} L{x + 1.2} {y} L{x} {y + 4} L{x - 1.2} {y} Z M{x - 5} {y} L{x} {y - 1} L{x + 5} {y} L{x} {y + 1} Z" style:animation-delay="{-i * 0.6}s" />
		{/each}
	</g>

	<!-- sand, surf foam, speckles -->
	<rect y="196" width="1200" height="64" fill={url('sand')} />
	<rect y="196" width="1200" height="7" fill="#e3b469" opacity="0.8" />
	<path
		d="M0 197 Q30 191 60 197 T120 197 T180 197 T240 197 T300 197 T360 197 T420 197 T480 197 T540 197 T600 197 T660 197 T720 197 T780 197 T840 197 T900 197 T960 197 T1020 197 T1080 197 T1140 197 T1200 197 L1200 200 L0 200 Z"
		fill="#ffffff"
		opacity="0.9"
	/>
	<g fill="#c6964d" opacity="0.55">
		{#each SPECKS as [x, y, r], i (i)}<circle cx={x} cy={y} {r} />{/each}
	</g>

	<!-- palms -->
	<path d={TRUNKS} fill="#9a6a35" stroke={INK} stroke-width="2.2" stroke-linejoin="round" />
	<path d={RINGS} fill="none" stroke="#6b431e" stroke-width="1.4" />
	<g fill="#5b3a1a" stroke={INK} stroke-width="1.5">
		{#each CROWNS as [x, y], i (i)}
			<circle cx={x - 5} cy={y + 5} r="4.5" />
			<circle cx={x + 5} cy={y + 6} r="4.5" />
		{/each}
	</g>
	<path d={FRONDS} fill="#2e9a42" stroke="#145a24" stroke-width="1.6" stroke-linejoin="round" />

	<!-- sandcastle (left) and beach ball (right) -->
	<g stroke="#a7793a" stroke-width="1.6" stroke-linejoin="round" fill="#e9bf72">
		<path d="M280 236 L280 216 L288 216 L288 212 L292 212 L292 216 L308 216 L308 212 L312 212 L312 216 L320 216 L320 236 Z" />
		<path d="M292 216 L292 198 L296 198 L296 194 L300 194 L300 198 L304 198 L304 194 L308 194 L308 198 L308 216" />
		<path d="M297 226 Q300 221 303 226 L303 236 L297 236 Z" fill="#b98a46" />
	</g>
	<path d="M300 194 L300 180" stroke={INK} stroke-width="1.4" />
	<path d="M300 180 L312 184 L300 188 Z" fill="#ff4418" />
	<g transform="translate(908 238)" stroke={INK} stroke-width="2" stroke-linejoin="round">
		<circle r="14" fill="#fff8e6" />
		<path d="M0 -14 Q-20 0 0 14 Q-9 0 0 -14 Z" fill="#e8392c" />
		<path d="M0 -14 Q20 0 0 14 Q9 0 0 -14 Z" fill="#2f6fe0" />
		<path d="M-13 -5 Q0 -2 13 -5" fill="none" stroke="#ffd23f" stroke-width="3" />
		<circle cx="-5" cy="-7" r="2.5" fill="#ffffff" stroke="none" opacity="0.8" />
	</g>

	<!-- shadow under the umbrella and chair -->
	<ellipse cx="560" cy="251" rx="210" ry="8" fill="#9a6e2e" opacity="0.32" />

	<!-- beach umbrella -->
	{@render limb('M468 30 L468 252', '#efe9dc', 4)}
	<g>
		<path d="M358 72 Q366 34 468 24 Q570 34 578 72 Q550.5 84 523 72 Q495.5 84 468 72 Q440.5 84 413 72 Q385.5 84 358 72 Z" fill="#fff6e6" />
		<g clip-path={url('canopy')} fill="#e8392c">
			<path d="M468 24 L300 -10 L250 100 L380.9 100 Z" />
			<path d="M468 24 L468 100 L555.1 100 Z" />
		</g>
		<path d="M468 24 L413 72 M468 24 L468 72 M468 24 L523 72" fill="none" stroke={INK} stroke-width="1.2" opacity="0.45" />
		<path
			d="M358 72 Q366 34 468 24 Q570 34 578 72 Q550.5 84 523 72 Q495.5 84 468 72 Q440.5 84 413 72 Q385.5 84 358 72 Z"
			fill="none"
			stroke={INK}
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
		<circle cx="468" cy="22" r="4" fill="#efe9dc" stroke={INK} stroke-width="2" />
	</g>

	<!-- cooler with the SPF 800 sunscreen on it (left) -->
	<g stroke={INK} stroke-width="2.4" stroke-linejoin="round">
		<rect x="384" y="214" width="66" height="34" rx="5" fill="#2f6fe0" />
		<rect x="380" y="206" width="74" height="12" rx="4" fill="#f6f3ea" />
		<path d="M404 206 L404 200 L430 200 L430 206" fill="none" stroke-width="2.2" />
		<path d="M390 230 L444 230" stroke="#f6f3ea" stroke-width="3" />
		<!-- the bottle -->
		<rect x="436" y="172" width="20" height="34" rx="6" fill="#ff8a1f" />
		<rect x="441" y="164" width="10" height="9" rx="2" fill="#f6f3ea" />
		<rect x="438.5" y="180" width="15" height="18" rx="2" fill="#fff8e6" stroke-width="1.2" />
	</g>
	<g font-family="'Arial Black', 'Arial', sans-serif" font-weight="900" fill="#e8392c" text-anchor="middle">
		<text x="446" y="187.5" font-size="6">SPF</text>
		<text x="446" y="196" font-size="7.2">800</text>
	</g>

	<!-- surfboard with flames, stuck in the sand (right) -->
	<g transform="rotate(7 800 250)">
		<path d="M800 112 Q818 140 816 200 Q814 236 806 252 L794 252 Q786 236 784 200 Q782 140 800 112 Z" fill="#f6f3ea" stroke={INK} stroke-width="2.4" />
		<path
			d="M785 232 Q784 214 789 202 Q791 214 794 210 Q794 194 800 182 Q802 200 806 204 Q809 194 812 190 Q816 208 815 232 Q800 240 785 232 Z"
			fill="#ff4418"
			stroke={INK}
			stroke-width="1.6"
		/>
		<path d="M788 232 Q789 220 792 214 Q795 222 798 218 Q800 206 803 198 Q805 214 808 216 Q810 210 811 206 Q814 220 812 232 Q800 237 788 232 Z" fill="#ffc21f" />
		<path d="M800 118 L800 182" stroke="#c9c2b2" stroke-width="1.4" />
	</g>
	<ellipse cx="804" cy="251" rx="26" ry="6" fill="#d9a85a" stroke="#b78740" stroke-width="1.2" />

	<!-- ===== the deck chair, back half ===== -->
	<g stroke={INK} stroke-linejoin="round">
		<path d="M538 60 L662 60 L674 206 L526 206 Z" fill={url('canvas')} stroke-width="2.4" />
		<path d="M526 206 L674 206 L670 196 L530 196 Z" fill="#000" opacity="0.18" stroke="none" />
	</g>
	{@render limb('M534 58 L520 250', WOOD, 7)}
	{@render limb('M666 58 L680 250', WOOD, 7)}
	<rect x="530" y="53" width="140" height="10" rx="3" fill={WOOD} stroke={INK} stroke-width="2.4" />
	<rect x="524" y="204" width="152" height="9" rx="3" fill={WOOD} stroke={INK} stroke-width="2.4" />

	<!-- ===== the cyborg ===== -->
	<g stroke-linejoin="round">
		<!-- right arm folded behind the head (viewer's left) -->
		{@render limb('M548 134 L518 78 L574 48', SKIN, 20)}
		<path d="M530 104 Q522 92 524 80" fill="none" stroke={SKIN_DARK} stroke-width="2" stroke-linecap="round" opacity="0.7" />
		<!-- left arm resting on the armrest (viewer's right): skin to the elbow, chrome after (drawn further down) -->
		{@render limb('M658 144 L674 170', SKIN, 21)}
		<path d="M658 154 Q664 162 670 166" fill="none" stroke={SKIN_DARK} stroke-width="2" stroke-linecap="round" opacity="0.7" />

		<!-- chest and abs -->
		<path d="M548 130 Q570 120 586 120 L614 120 Q630 120 652 130 L646 170 Q642 186 636 196 L564 196 Q558 186 554 170 Z" fill={SKIN} stroke={INK} stroke-width="2.5" />
		<g fill="none" stroke={INK} stroke-linecap="round">
			<path d="M566 146 Q582 160 598 151 M602 151 Q618 160 634 146" stroke-width="2" />
			<path d="M600 154 L600 186" stroke-width="1.4" opacity="0.6" />
			<path d="M588 165 Q594 167 598 165 M602 165 Q606 167 612 165 M589 176 Q594 178 598 176 M602 176 Q606 178 611 176" stroke-width="1.4" opacity="0.6" />
			<path d="M598 190 Q600 192.5 602 190" stroke-width="1.4" />
		</g>

		<!-- swim trunks with hot-rod flames -->
		<path d="M560 186 L640 186 L650 214 Q632 222 612 214 L600 204 L588 214 Q568 222 550 214 Z" fill="#c81e26" stroke={INK} stroke-width="2.5" />
		<path
			d="M552 213 Q553 204 557 199 Q558 206 561 207 Q562 197 567 192 Q567 202 571 205 Q573 198 577 196 Q577 206 582 209 Q585 204 588 203 L588 214 Q568 222 552 213 Z M648 213 Q647 204 643 199 Q642 206 639 207 Q638 197 633 192 Q633 202 629 205 Q627 198 623 196 Q623 206 618 209 Q615 204 612 203 L612 214 Q632 222 648 213 Z"
			fill="#ffb11f"
			stroke="#7a1a10"
			stroke-width="1.2"
		/>
		<path d="M560 186 L640 186 L641 192 L559 192 Z" fill="#9c141b" stroke={INK} stroke-width="2" />
		<path d="M598 192 L595 200 M602 192 L605 200" stroke="#f6f3ea" stroke-width="1.6" stroke-linecap="round" />

		<!-- open Hawaiian shirt -->
		<path d="M548 128 Q542 150 548 176 L552 200 L574 200 Q570 178 572 150 L583 121 Q566 121 548 128 Z" fill={url('shirt')} stroke={INK} stroke-width="2.4" />
		<path d="M652 128 Q658 150 652 176 L648 200 L626 200 Q630 178 628 150 L617 121 Q634 121 652 128 Z" fill={url('shirt')} stroke={INK} stroke-width="2.4" />
		<path d="M583 121 L571 146 L563 128 Z M617 121 L629 146 L637 128 Z" fill="#0a7470" stroke={INK} stroke-width="1.8" />

		<!-- sleeves -->
		<path d="M551 135 L539 110" stroke={INK} stroke-width="33" />
		<path d="M551 135 L539 110" stroke={url('shirt')} stroke-width="29" />
		<path d="M649 135 L661 158" stroke={INK} stroke-width="33" />
		<path d="M649 135 L661 158" stroke={url('shirt')} stroke-width="29" />

		<!-- neck -->
		<rect x="585" y="102" width="30" height="22" fill={SKIN} />
		<path d="M585 102 L585 122 Q589 125 593 125 M615 102 L615 122 Q611 125 607 125" fill="none" stroke={INK} stroke-width="2.2" />
		<path d="M590 108 L597 123 M610 108 L603 123" fill="none" stroke={SKIN_DARK} stroke-width="1.4" opacity="0.7" />

		<!-- head: ears, square jaw, flat-top -->
		<ellipse cx="572" cy="80" rx="4.5" ry="8" fill={SKIN} stroke={INK} stroke-width="2.2" />
		<ellipse cx="628" cy="80" rx="4.5" ry="8" fill={SKIN} stroke={INK} stroke-width="2.2" />
		<path d="M574 54 L574 88 Q575 101 585 107 L594 112 Q600 114 606 112 L615 107 Q625 101 626 88 L626 54 Q600 48 574 54 Z" fill={SKIN} stroke={INK} stroke-width="2.5" />
		<!-- short faded sides, then the flat top with bristles -->
		<path d="M574 60 L574 50 L579 47 L579 54 Q576 55 574 60 Z M626 60 L626 50 L621 47 L621 54 Q624 55 626 60 Z" fill="#4a3b30" />
		<path d="M573 50 L572 38 Q572 32 578 32 L622 32 Q628 32 628 38 L627 50 Q624 47 620 47 Q600 44 580 47 Q576 47 573 50 Z" fill="#17110c" stroke={INK} stroke-width="2.2" />
		<path
			d="M578 33 L578 38 M583 33 L583 37 M588 33 L588 38 M593 33 L593 37 M598 33 L598 38 M603 33 L603 37 M608 33 L608 38 M613 33 L613 37 M618 33 L618 38 M623 33 L623 37"
			stroke="#4a3e34"
			stroke-width="1.3"
		/>

		<!-- torn cheek: chrome skull plate showing (viewer's left) -->
		<path d="M575 58 L586 56 L590 63 L587 70 L592 78 L586 86 L589 93 L580 97 L575 92 Z" fill={url('chrome')} stroke={RAW} stroke-width="2" />
		<path d="M577 84 L586 84 M578 63 L583 61" fill="none" stroke="#3f4752" stroke-width="1" />
		<circle cx="579" cy="90" r="1.2" fill="#3f4752" />

		<!-- sunburnt nose and cheek -->
		<ellipse cx="601" cy="86" rx="5" ry="3" fill="#ff6a5a" opacity="0.45" />
		<ellipse cx="616" cy="89" rx="5" ry="3" fill="#ff6a5a" opacity="0.35" />

		<!-- brows, nose, smirk, chin -->
		<g fill="none" stroke={INK} stroke-linecap="round">
			<path d="M590 61.5 Q594 60.5 597 62 M603 62 Q613 59 623 62" stroke-width="2.6" />
			<path d="M600 78 L597 88 Q600 91 604 88" stroke-width="1.8" />
			<path d="M589 99 Q598 101.5 610 97.5" stroke-width="2.2" />
			<path d="M600 108 L600 111.5" stroke-width="1.4" />
			<path d="M585 100 Q588 106 593 109" stroke={SKIN_DARK} stroke-width="1.4" opacity="0.8" />
		</g>

		<!-- black shades; the chrome eye glows red through the left lens -->
		<path d="M573 64.5 L627 64.5 L627 69 L573 69 Z" fill="#0b0d10" stroke={INK} stroke-width="1.6" />
		<path d="M575 66 L598 66 L597 75 Q595 80 587 80 Q578 80 576 75 Z" fill={url('lens')} stroke={INK} stroke-width="1.8" />
		<path d="M602 66 L625 66 L624 75 Q622 80 613 80 Q605 80 603 75 Z" fill={url('lens')} stroke={INK} stroke-width="1.8" />
		<circle class="cb-eye" cx="587" cy="73" r="8" fill={url('redeye')} />
		<circle cx="587" cy="73" r="1.7" fill="#ffd0c0" />
		<path d="M581 68 L585 68 L579.5 77 L578 75 Z M607 68 L611 68 L605.5 77 L604 75 Z" fill="#ffffff" opacity="0.4" />
		<circle cx="619" cy="70" r="1.6" fill="#ffd23f" opacity="0.9" />
		<path d="M573 66.5 L569.5 74" stroke="#0b0d10" stroke-width="2" stroke-linecap="round" />
	</g>

	<!-- the fat blunt in the corner of his mouth -->
	<g transform="translate(609 97.5) rotate(-13)" stroke-linejoin="round">
		<path d="M0 -3.6 C16 -5.8 40 -6.2 56 -5.4 L56 5.4 C40 6.2 16 5.8 0 3.6 Z" fill="#6e4120" stroke={INK} stroke-width="1.8" />
		<path d="M9 -4.6 L15 4.8 M20 -5.4 L26 5.6 M31 -5.8 L37 5.9 M42 -5.8 L48 5.8" fill="none" stroke="#4a2810" stroke-width="1.1" />
		<path d="M4 -2 Q30 -4.2 54 -3.6" fill="none" stroke="#a8703e" stroke-width="1.4" stroke-linecap="round" opacity="0.8" />
		<path d="M56 -5.4 L60 -4.8 Q62.5 0 60 4.8 L56 5.4 Z" fill="#9e9890" stroke={INK} stroke-width="1.4" />
		<path d="M56.2 -5 L56.2 5" stroke="#ff6a1a" stroke-width="1.8" />
		<circle class="cb-ember" cx="61" cy="0" r="10" fill={url('ember')} />
	</g>

	<!-- deck chair, front half: armrests and front legs -->
	<rect x="472" y="176" width="70" height="9" rx="3" fill={WOOD} stroke={INK} stroke-width="2.4" />
	<rect x="658" y="176" width="70" height="9" rx="3" fill={WOOD} stroke={INK} stroke-width="2.4" />
	{@render limb('M482 186 L478 250', WOOD, 7)}
	{@render limb('M718 186 L722 250', WOOD, 7)}

	<!-- chrome forearm and hand holding a coconut cocktail -->
	<g stroke-linejoin="round">
		{@render limb('M678 168 L708 161', '#c9d1db', 5)}
		{@render limb('M680 177 L708 169', '#aab4c0', 5)}
		<path d="M684 172.5 L703 167.5" stroke="#4f5865" stroke-width="2.4" stroke-linecap="round" />
		<path d="M679 166.5 L706 160" stroke="#ffffff" stroke-width="1.1" opacity="0.8" />
		<!-- torn skin cuff at the elbow -->
		<path d="M663 160 L670 157 L674 163 L680 161 L679 168 L684 173 L677 177 L679 182 L668 181 L662 174 Z" fill={SKIN} stroke={RAW} stroke-width="1.8" />
		<circle cx="709" cy="165" r="5" fill={url('chrome')} stroke={INK} stroke-width="1.8" />

		<!-- coconut, straw, paper umbrella, lime -->
		<path d="M732 137 L738 112 L746 108" fill="none" stroke={INK} stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M732 137 L738 112 L746 108" fill="none" stroke="#ff4f9a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
		<path d="M719 137 L713 116" stroke="#8a5a2b" stroke-width="1.6" />
		<path d="M701 119 Q712 104 725 114 Q713 112 701 119 Z" fill="#ffd23f" stroke={INK} stroke-width="1.3" />
		<path d="M713 109 L713 116" stroke={INK} stroke-width="0.8" opacity="0.6" />
		<circle cx="727" cy="151" r="15" fill="#6b4424" stroke={INK} stroke-width="2.5" />
		<path d="M716 156 Q720 160 724 161 M731 160 Q736 158 739 154 M729 146 Q734 147 737 145" fill="none" stroke="#3e2410" stroke-width="1.2" stroke-linecap="round" />
		<ellipse cx="727" cy="138" rx="11" ry="3.6" fill="#f7f1e3" stroke={INK} stroke-width="1.8" />
		<path d="M735 136 A6 6 0 0 1 745 140" fill="#b6e64e" stroke={INK} stroke-width="1.3" />
		<!-- chrome fingers around it -->
		<g fill={url('chrome')} stroke={INK} stroke-width="1.6">
			<rect x="705" y="142" width="18" height="6" rx="3" />
			<rect x="705" y="149" width="19" height="6" rx="3" />
			<rect x="705" y="156" width="17" height="6" rx="3" />
			<rect x="703" y="136" width="13" height="6" rx="3" transform="rotate(-18 709 139)" />
		</g>
		<path d="M714 142.5 L714 147.5 M715 149.5 L715 154.5 M713 156.5 L713 161.5" stroke="#3f4752" stroke-width="1" />
	</g>

	<!-- legs, flip-flops -->
	<g stroke-linejoin="round">
		<path d="M553 219 Q550 232 557 247 L579 247 Q585 232 585 219 Z" fill={SKIN} stroke={INK} stroke-width="2.5" />
		<path d="M615 219 Q615 232 621 247 L643 247 Q650 232 647 219 Z" fill={SKIN} stroke={INK} stroke-width="2.5" />
		<path d="M558 226 Q556 234 560 242 M642 226 Q644 234 640 242" fill="none" stroke={SKIN_DARK} stroke-width="1.6" opacity="0.7" />
		<ellipse cx="569" cy="217" rx="16" ry="9.5" fill={SKIN} stroke={INK} stroke-width="2.5" />
		<ellipse cx="631" cy="217" rx="16" ry="9.5" fill={SKIN} stroke={INK} stroke-width="2.5" />
		<ellipse cx="567" cy="251.5" rx="18" ry="5.5" fill="#ffd23f" stroke={INK} stroke-width="2.2" />
		<ellipse cx="633" cy="251.5" rx="18" ry="5.5" fill="#ffd23f" stroke={INK} stroke-width="2.2" />
		<ellipse cx="567" cy="248" rx="13" ry="5" fill={SKIN} stroke={INK} stroke-width="2" />
		<ellipse cx="633" cy="248" rx="13" ry="5" fill={SKIN} stroke={INK} stroke-width="2" />
		<path d="M558 249 L567 244.5 L576 249 M624 249 L633 244.5 L642 249" fill="none" stroke="#2f6fe0" stroke-width="2.4" stroke-linecap="round" />
	</g>

	<!-- a crab scuttling past -->
	<g transform="translate(758 243)">
		<g class="cb-crab" stroke={INK} stroke-linejoin="round" stroke-linecap="round">
			<path d="M-9 2 L-15 6 M-8 4 L-13 9 M9 2 L15 6 M8 4 L13 9" fill="none" stroke-width="1.8" />
			<path d="M-6 -4 L-12 -9 M6 -4 L12 -9" fill="none" stroke-width="2" />
			<path d="M-16 -13 Q-11 -16 -10 -10 Q-13 -9 -14 -11 Q-15 -8 -17 -9 Q-19 -12 -16 -13 Z M16 -13 Q11 -16 10 -10 Q13 -9 14 -11 Q15 -8 17 -9 Q19 -12 16 -13 Z" fill="#e2412f" stroke-width="1.5" />
			<ellipse rx="11" ry="6.5" fill="#e2412f" stroke-width="2" />
			<path d="M-3 -6 L-4 -11 M3 -6 L4 -11" fill="none" stroke-width="1.5" />
			<circle cx="-4" cy="-12" r="2.2" fill="#ffffff" stroke-width="1.2" />
			<circle cx="4" cy="-12" r="2.2" fill="#ffffff" stroke-width="1.2" />
			<circle cx="-4" cy="-12" r="0.9" fill={INK} stroke="none" />
			<circle cx="4" cy="-12" r="0.9" fill={INK} stroke="none" />
		</g>
	</g>

	<!-- smoke: a curl off the ember and smoke rings drifting up towards the sun -->
	<path
		class="cb-curl"
		d="M668 80 C678 66 660 56 670 42 C680 28 666 18 676 4"
		fill="none"
		stroke="#f1f3ef"
		stroke-width="4.5"
		stroke-linecap="round"
		opacity="0.6"
	/>
	{#each [0, 1, 2] as i (i)}
		<ellipse
			class="cb-ring"
			cx="680"
			cy="66"
			rx="7"
			ry="4.5"
			fill="none"
			stroke="#f4f6f2"
			stroke-width="3"
			style:animation-delay="{i * 2.2}s"
		/>
	{/each}
	{#each [0, 1] as i (i)}
		<circle class="cb-puff" cx="668" cy="82" r="7" fill={url('puff')} style:animation-delay="{i * 2.6 + 1}s" />
	{/each}
</svg>

<style>
	/* only the animated parts: fill-box on everything would also move the rotate()/scale() attributes */
	.cb-rays,
	.cb-cloud,
	.cb-gull,
	.cb-waves,
	.cb-glint,
	.cb-eye,
	.cb-ember,
	.cb-curl,
	.cb-ring,
	.cb-puff,
	.cb-crab {
		transform-box: fill-box;
	}
	.cb-rays {
		transform-origin: center;
		animation: cb-spin 60s linear infinite;
	}
	.cb-cloud {
		animation: cb-cloud 22s ease-in-out infinite alternate;
	}
	.cb-gull {
		animation: cb-bob 2.6s ease-in-out infinite alternate;
	}
	.cb-waves {
		animation: cb-wave 4s ease-in-out infinite alternate;
	}
	.cb-glint {
		transform-origin: center;
		animation: cb-glint 2.8s ease-in-out infinite;
	}
	.cb-eye {
		transform-origin: center;
		animation: cb-eye 2.2s ease-in-out infinite;
	}
	.cb-ember {
		transform-origin: center;
		animation: cb-ember 2.4s ease-in-out infinite;
	}
	.cb-curl {
		transform-origin: 50% 100%;
		animation: cb-sway 5s ease-in-out infinite alternate;
	}
	.cb-ring {
		transform-origin: center;
		opacity: 0;
		animation: cb-ring 6.6s ease-out infinite;
	}
	.cb-puff {
		transform-origin: center;
		opacity: 0;
		animation: cb-puff 5.2s ease-out infinite;
	}
	.cb-crab {
		animation: cb-crab 7s ease-in-out infinite alternate;
	}
	@keyframes cb-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes cb-cloud {
		from {
			transform: translateX(-10px);
		}
		to {
			transform: translateX(14px);
		}
	}
	@keyframes cb-bob {
		from {
			transform: translateY(0) scaleY(1);
		}
		to {
			transform: translateY(-4px) scaleY(0.7);
		}
	}
	@keyframes cb-wave {
		from {
			transform: translateX(-4px);
		}
		to {
			transform: translateX(5px);
		}
	}
	@keyframes cb-glint {
		0%,
		100% {
			opacity: 0;
			transform: scale(0.4);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
	@keyframes cb-eye {
		0%,
		100% {
			opacity: 0.7;
			transform: scale(0.9);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
	@keyframes cb-ember {
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
	@keyframes cb-sway {
		from {
			transform: skewX(-5deg);
		}
		to {
			transform: skewX(6deg) translateX(3px);
		}
	}
	@keyframes cb-ring {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.6);
		}
		15% {
			opacity: 0.9;
		}
		100% {
			opacity: 0;
			transform: translate(30px, -62px) scale(2.3);
		}
	}
	@keyframes cb-puff {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.5);
		}
		15% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
			transform: translate(10px, -80px) scale(2.6);
		}
	}
	@keyframes cb-crab {
		0%,
		20% {
			transform: translateX(0);
		}
		50%,
		70% {
			transform: translateX(-26px);
		}
		100% {
			transform: translateX(10px);
		}
	}
</style>
