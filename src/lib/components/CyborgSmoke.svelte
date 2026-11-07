<!--
	Cyborg banner between Divergence & Mastery and Backup (the user's ask, 2026-11-07: a picture of a
	chrome robot skull with red eyes "as the banner, with smoke behind him"; it replaced the beach
	holiday cyborg from earlier the same day). Our own drawing in that style, not the picture itself
	(the site is public): a black-chrome cyborg skull with glowing red eyes, steel teeth, cheek
	pistons, a hydraulic neck with coiled cables and shoulder plates, on black, lit red from behind,
	with smoke billowing behind him. No names or film quotes in the UI.
	Built from three stacked SVGs with the same viewBox: two smoke layers (feTurbulence, rendered once
	and then only moved / faded with CSS, so the browser can slide them without redrawing the filter)
	and the cyborg on top (eye pulse, a glint over the skull, rising sparks).
	Decorative and aria-hidden; prefers-reduced-motion freezes it.
-->
<script lang="ts" module>
	type Tooth = [x: number, y: number, w: number, h: number];

	/** A row of teeth across the mouth, smaller towards the corners. */
	function teeth(top: number, height: number, spread: number, upper: boolean): Tooth[] {
		return Array.from({ length: 10 }, (_, i) => {
			const t = (i - 4.5) / 4.5;
			const w = 7.2 - Math.abs(t) * 1.8;
			const h = height - Math.abs(t) * 3.2;
			const y = upper ? top + Math.abs(t) * 2.4 : top + height - h - Math.abs(t) * 1.6;
			return [600 + t * spread - w / 2, y, w, h];
		});
	}
	const UPPER = teeth(157, 13.5, 33, true);
	const LOWER = teeth(173, 11.5, 30, false);

	const SPINE = [202, 211, 220, 229, 238, 247, 256];

	/** Smoke blobs [cx, cy, rx, ry] before the turbulence frays them. */
	const SMOKE_FAR = [
		[200, 110, 200, 55],
		[1000, 100, 210, 60],
		[600, 140, 300, 70],
		[120, 220, 140, 40],
		[1090, 210, 130, 45],
		[330, 30, 160, 40],
		[880, 28, 170, 40]
	];
	const SMOKE_NEAR = [
		[600, 40, 220, 50],
		[470, 130, 110, 80],
		[730, 125, 120, 85],
		[540, 60, 80, 100],
		[664, 50, 90, 110],
		[400, 220, 130, 45],
		[800, 215, 140, 48]
	];

	/** Sparks drifting up: [x, delay s, duration s, sideways drift px]. */
	const SPARKS = [
		[470, 0, 5.2, -18],
		[522, 1.6, 6.1, 12],
		[690, 0.8, 5.6, 20],
		[742, 2.4, 6.6, -14],
		[612, 3.1, 5.1, 8],
		[404, 3.8, 7, 16],
		[818, 1.1, 6.2, -20],
		[560, 4.4, 5.8, -10],
		[652, 2, 6.4, 14],
		[300, 2.9, 7.2, 10],
		[904, 0.4, 6.9, -12]
	];

	/** The cranium outline (also the clip for the moving glint). */
	const CRANIUM = 'M530 108 C520 72 532 34 562 22 C576 16 588 14 600 14 C612 14 624 16 638 22 C668 34 680 72 670 108 Q600 98 530 108 Z';
</script>

<script lang="ts">
	const uid = $props.id();
	const ref = (name: string) => `${uid}-${name}`;
	const url = (name: string) => `url(#${ref(name)})`;
	const LINE = '#040506';
</script>

{#snippet smokeFilter(id: string, seed: number)}
	<filter {id} filterUnits="userSpaceOnUse" x="-160" y="-160" width="1520" height="580" color-interpolation-filters="sRGB">
		<feGaussianBlur in="SourceGraphic" stdDeviation="12" result="soft" />
		<feTurbulence type="fractalNoise" baseFrequency="0.009 0.026" numOctaves="4" {seed} result="noise" />
		<feDisplacementMap in="soft" in2="noise" scale="120" xChannelSelector="R" yChannelSelector="G" result="wisp" />
		<feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -1.3" result="mask" />
		<feComposite in="wisp" in2="mask" operator="in" />
	</filter>
{/snippet}

<div class="cyborg-smoke relative h-full w-full overflow-hidden" aria-hidden="true">
	<!-- far smoke: wide and dim -->
	<svg class="cs-layer cs-far" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" focusable="false">
		<defs>{@render smokeFilter(ref('smoke-far'), 11)}</defs>
		<g filter={url('smoke-far')} fill="#5a6068">
			{#each SMOKE_FAR as [cx, cy, rx, ry], i (i)}<ellipse {cx} {cy} {rx} {ry} />{/each}
		</g>
	</svg>
	<!-- near smoke: billowing up behind his head and shoulders -->
	<svg class="cs-layer cs-near" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" focusable="false">
		<defs>{@render smokeFilter(ref('smoke-near'), 4)}</defs>
		<g filter={url('smoke-near')} fill="#8a9098">
			{#each SMOKE_NEAR as [cx, cy, rx, ry], i (i)}<ellipse {cx} {cy} {rx} {ry} />{/each}
		</g>
	</svg>

	<!-- the cyborg -->
	<svg class="cs-layer" viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" focusable="false">
		<defs>
			<!-- black chrome: bright sky reflection on top, dark middle, a lighter band low down -->
			<linearGradient id={ref('gun')} x1="0" y1="0" x2="0.15" y2="1">
				<stop offset="0" stop-color="#dfe4ea" />
				<stop offset="0.1" stop-color="#8a929c" />
				<stop offset="0.26" stop-color="#2a2f36" />
				<stop offset="0.52" stop-color="#0b0d10" />
				<stop offset="0.74" stop-color="#262b32" />
				<stop offset="0.88" stop-color="#8e97a1" />
				<stop offset="1" stop-color="#16191d" />
			</linearGradient>
			<!-- cylinders: lit down the middle -->
			<linearGradient id={ref('rod')} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#090a0c" />
				<stop offset="0.3" stop-color="#5d656f" />
				<stop offset="0.46" stop-color="#eef1f4" />
				<stop offset="0.62" stop-color="#3f454d" />
				<stop offset="1" stop-color="#08090b" />
			</linearGradient>
			<linearGradient id={ref('tooth')} x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#f1f4f7" />
				<stop offset="0.55" stop-color="#9aa2ac" />
				<stop offset="1" stop-color="#3a4048" />
			</linearGradient>
			<radialGradient id={ref('socket')} cx="0.5" cy="0.55">
				<stop offset="0" stop-color="#000" />
				<stop offset="0.7" stop-color="#040405" />
				<stop offset="1" stop-color="#22262c" />
			</radialGradient>
			<radialGradient id={ref('eye')}>
				<stop offset="0" stop-color="#fff4f0" />
				<stop offset="0.3" stop-color="#ff4a3a" />
				<stop offset="1" stop-color="#b30000" />
			</radialGradient>
			<radialGradient id={ref('eyeglow')}>
				<stop offset="0" stop-color="#ff2414" stop-opacity="0.75" />
				<stop offset="0.4" stop-color="#ff1408" stop-opacity="0.28" />
				<stop offset="1" stop-color="#ff1408" stop-opacity="0" />
			</radialGradient>
			<radialGradient id={ref('backlight')} cx="0.5" cy="0.45">
				<stop offset="0" stop-color="#ff2a14" stop-opacity="0.34" />
				<stop offset="0.5" stop-color="#a0140a" stop-opacity="0.12" />
				<stop offset="1" stop-color="#a0140a" stop-opacity="0" />
			</radialGradient>
			<radialGradient id={ref('vignette')} cx="0.5" cy="0.5" r="0.75">
				<stop offset="0.45" stop-color="#000" stop-opacity="0" />
				<stop offset="1" stop-color="#000" stop-opacity="0.75" />
			</radialGradient>
			<linearGradient id={ref('glint')} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#fff" stop-opacity="0" />
				<stop offset="0.5" stop-color="#fff" stop-opacity="0.5" />
				<stop offset="1" stop-color="#fff" stop-opacity="0" />
			</linearGradient>
			<filter id={ref('soft')} x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="1.4" />
			</filter>
			<clipPath id={ref('cranium')}><path d={CRANIUM} /></clipPath>

			<!-- the left half of the body; the right half is the same, mirrored -->
			<g id={ref('body-half')}>
				<path d="M300 262 L352 244 L404 238 L364 262 Z" fill="#101215" stroke={LINE} stroke-width="1.5" />
				<path d="M352 262 L404 238 L472 226 L542 232 L558 262 Z" fill={url('gun')} stroke={LINE} stroke-width="1.5" stroke-linejoin="round" />
				<path d="M404 238 L472 226 L542 232" fill="none" stroke="#d4dae1" stroke-width="1.3" opacity="0.6" />
				<path d="M420 248 L520 240 M452 262 L470 244" fill="none" stroke={LINE} stroke-width="1.2" opacity="0.8" />
				<circle cx="432" cy="250" r="2.6" fill={url('rod')} stroke={LINE} stroke-width="0.8" />
				<circle cx="512" cy="244" r="2.6" fill={url('rod')} stroke={LINE} stroke-width="0.8" />
				<rect x="470" y="223" width="104" height="9" rx="4" fill={url('rod')} stroke={LINE} stroke-width="1.2" transform="rotate(-9 470 227)" />
				<!-- coiled cables from the neck out to the shoulder -->
				<path d="M584 206 C560 220 520 232 468 238 C440 242 420 250 404 262" fill="none" stroke={LINE} stroke-width="13" stroke-linecap="round" />
				<path d="M584 206 C560 220 520 232 468 238 C440 242 420 250 404 262" fill="none" stroke="#7f8892" stroke-width="10" stroke-dasharray="1.6 2.6" />
				<path d="M578 216 C556 236 520 246 480 262" fill="none" stroke={LINE} stroke-width="10" stroke-linecap="round" />
				<path d="M578 216 C556 236 520 246 480 262" fill="none" stroke="#6b737d" stroke-width="7.5" stroke-dasharray="1.4 2.4" />
				<path d="M590 200 Q583 230 590 262" fill="none" stroke="#1a1d22" stroke-width="4" />
				<!-- neck piston -->
				<rect x="563.5" y="196" width="9" height="34" rx="2" fill={url('rod')} stroke={LINE} stroke-width="1" transform="rotate(8.6 568 196)" />
				<rect x="565.5" y="228" width="5" height="40" rx="1.5" fill={url('rod')} stroke={LINE} stroke-width="0.8" transform="rotate(8.6 568 196)" />
			</g>

			<!-- the left half of the face plates; mirrored for the right -->
			<g id={ref('face-half')}>
				<path d="M531 100 L550 102 L552 140 L534 146 Q526 124 531 100 Z" fill={url('gun')} stroke={LINE} stroke-width="1.2" stroke-linejoin="round" />
				<circle cx="528" cy="126" r="9" fill={url('gun')} stroke={LINE} stroke-width="1.2" />
				<circle cx="528" cy="126" r="4" fill={url('rod')} stroke={LINE} stroke-width="0.8" />
				<!-- cheekbone -->
				<path d="M534 124 L556 126 L572 134 L566 145 L546 149 L536 142 Z" fill={url('gun')} stroke={LINE} stroke-width="1.2" stroke-linejoin="round" />
				<path d="M536 124.5 L556 126.5 L571 134" fill="none" stroke="#d4dae1" stroke-width="1" opacity="0.65" />
				<!-- cheek piston: sleeve, rod and the bolts at either end -->
				<rect x="529.5" y="134" width="9" height="28" rx="2" fill={url('rod')} stroke={LINE} stroke-width="1" transform="rotate(-19.1 534 134)" />
				<rect x="531.5" y="160" width="5" height="29" rx="1.5" fill={url('rod')} stroke={LINE} stroke-width="0.8" transform="rotate(-19.1 534 134)" />
				<circle cx="534" cy="134" r="4" fill={url('gun')} stroke={LINE} stroke-width="1" />
				<circle cx="552" cy="186" r="4" fill={url('gun')} stroke={LINE} stroke-width="1" />
				<!-- skull plate seams and a bolt -->
				<path d="M548 36 Q560 70 549 100" fill="none" stroke={LINE} stroke-width="1.4" />
				<path d="M549.5 38 Q561.5 70 551 99" fill="none" stroke="#aab2bc" stroke-width="0.8" opacity="0.45" />
				<circle cx="540" cy="88" r="2.2" fill={url('rod')} stroke={LINE} stroke-width="0.8" />
			</g>
		</defs>

		<!-- red light from behind, tinting the smoke -->
		<ellipse cx="600" cy="110" rx="270" ry="170" fill={url('backlight')} />

		<!-- shoulders, neck, spine -->
		<use href="#{ref('body-half')}" />
		<use href="#{ref('body-half')}" transform="matrix(-1 0 0 1 1200 0)" />
		<path d="M572 194 L628 194 L622 210 L578 210 Z" fill="#050607" />
		{#each SPINE as y (y)}
			<rect x="587" {y} width="26" height="7" rx="2" fill={url('rod')} stroke={LINE} stroke-width="1" />
		{/each}

		<!-- cranium with its seams and reflections -->
		<path d={CRANIUM} fill={url('gun')} stroke={LINE} stroke-width="1.6" />
		<path d="M600 15 L600 98" stroke={LINE} stroke-width="1.6" />
		<path d="M601.6 17 L601.6 96" stroke="#b9c1ca" stroke-width="0.8" opacity="0.5" />
		<g filter={url('soft')} fill="#fff">
			<path d="M548 42 Q572 18 612 17 Q578 26 556 48 Z" opacity="0.6" />
			<path d="M654 46 Q668 70 664 98 L659 98 Q663 74 650 50 Z" opacity="0.32" />
			<circle cx="567" cy="32" r="3" opacity="0.85" />
		</g>
		<g clip-path={url('cranium')}>
			<rect class="cs-glint" x="470" y="0" width="56" height="120" fill={url('glint')} transform="skewX(-18)" />
		</g>

		<!-- the dark mid-face the sockets, nose and cheekbones sit in -->
		<path d="M538 100 L662 100 L665 128 L648 154 L600 160 L552 154 L535 128 Z" fill="#0b0d10" stroke={LINE} stroke-width="1.4" stroke-linejoin="round" />
		<path d="M552 150 Q600 160 648 150" fill="none" stroke="#3a4048" stroke-width="1.2" opacity="0.8" />

		<use href="#{ref('face-half')}" />
		<use href="#{ref('face-half')}" transform="matrix(-1 0 0 1 1200 0)" />

		<!-- brow ridge -->
		<path d="M534 98 Q568 88 600 96 Q632 88 666 98 L662 108 Q632 100 600 108 Q568 100 538 108 Z" fill={url('gun')} stroke={LINE} stroke-width="1.4" stroke-linejoin="round" />
		<path d="M537 98.5 Q568 89.5 600 97.2 Q632 89.5 663 98.5" fill="none" stroke="#e3e8ee" stroke-width="1.1" opacity="0.7" />

		<!-- eye sockets, slanted for a glare, with the red eyes -->
		<ellipse cx="573" cy="117" rx="20" ry="13.5" fill={url('socket')} stroke="#1c2026" stroke-width="2.5" transform="rotate(8 573 117)" />
		<ellipse cx="627" cy="117" rx="20" ry="13.5" fill={url('socket')} stroke="#1c2026" stroke-width="2.5" transform="rotate(-8 627 117)" />
		<path d="M556 124 Q572 134 590 124 M610 124 Q628 134 644 124" fill="none" stroke="#ff3a2a" stroke-width="1.4" opacity="0.45" />

		<!-- nose cavity -->
		<path d="M600 122 C591 124 587 134 589 144 L600 151 L611 144 C613 134 609 124 600 122 Z" fill="#020203" stroke="#1c2026" stroke-width="1.6" />
		<path d="M600 127 L600 148" stroke="#5d656f" stroke-width="2.2" />

		<!-- mouth: dark gap, jaw, steel teeth -->
		<path d="M562 154 L638 154 L636 188 L564 188 Z" fill="#030304" />
		<path d="M554 166 L566 172 Q600 177 634 172 L646 166 L649 190 Q641 205 621 209 L579 209 Q559 205 551 190 Z" fill={url('gun')} stroke={LINE} stroke-width="1.4" stroke-linejoin="round" />
		<path d="M562 196 Q600 204 638 196" fill="none" stroke={LINE} stroke-width="1.2" />
		<path d="M566 200 Q600 207 634 200" fill="none" stroke="#c9d0d8" stroke-width="0.9" opacity="0.5" />
		{#each LOWER as [x, y, w, h], i (i)}
			<rect {x} {y} width={w} height={h} rx="1.6" fill={url('tooth')} stroke={LINE} stroke-width="0.9" />
		{/each}
		<path d="M562 146 Q600 139 638 146 L640 160 Q600 155 560 160 Z" fill={url('gun')} stroke={LINE} stroke-width="1.4" stroke-linejoin="round" />
		{#each UPPER as [x, y, w, h], i (i)}
			<rect {x} {y} width={w} height={h} rx="1.8" fill={url('tooth')} stroke={LINE} stroke-width="0.9" />
		{/each}

		<!-- the eyes glow over everything -->
		<g class="cs-eyes">
			<circle cx="574" cy="118" r="30" fill={url('eyeglow')} />
			<circle cx="626" cy="118" r="30" fill={url('eyeglow')} />
		</g>
		<circle cx="574" cy="118" r="5.6" fill={url('eye')} />
		<circle cx="626" cy="118" r="5.6" fill={url('eye')} />
		<circle cx="572.6" cy="116.6" r="1.4" fill="#fff" opacity="0.9" />
		<circle cx="624.6" cy="116.6" r="1.4" fill="#fff" opacity="0.9" />

		<!-- sparks drifting up -->
		{#each SPARKS as [x, delay, dur, dx], i (i)}
			<circle
				class="cs-spark"
				cx={x}
				cy="252"
				r={i % 3 === 0 ? 1.8 : 1.2}
				fill="#ff7a2a"
				style:animation-delay="{delay}s"
				style:animation-duration="{dur}s"
				style:--dx="{dx}px"
			/>
		{/each}

		<rect width="1200" height="260" fill={url('vignette')} />
	</svg>
</div>

<style>
	.cyborg-smoke {
		background: radial-gradient(ellipse at 50% 45%, #1c1416 0%, #0a0809 45%, #030303 100%);
	}
	.cs-layer {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	/* the smoke layers are only moved and faded, so the browser can slide them without redrawing */
	.cs-far {
		opacity: 0.75;
		animation: cs-drift-far 19s ease-in-out infinite alternate;
		will-change: transform, opacity;
	}
	.cs-near {
		opacity: 0.85;
		animation: cs-drift-near 13s ease-in-out infinite alternate;
		will-change: transform, opacity;
	}
	.cs-eyes,
	.cs-glint,
	.cs-spark {
		transform-box: fill-box;
		transform-origin: center;
	}
	.cs-eyes {
		animation: cs-eyes 2.6s ease-in-out infinite;
	}
	.cs-glint {
		animation: cs-glint 7s ease-in-out infinite;
	}
	.cs-spark {
		opacity: 0;
		animation-name: cs-spark;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes cs-drift-far {
		from {
			transform: translate(-2%, 2%) scale(1.06);
			opacity: 0.6;
		}
		to {
			transform: translate(2%, -3%) scale(1.12);
			opacity: 0.85;
		}
	}
	@keyframes cs-drift-near {
		from {
			transform: translate(1.5%, 3%) scale(1.04);
			opacity: 0.95;
		}
		to {
			transform: translate(-1.5%, -4%) scale(1.1);
			opacity: 0.7;
		}
	}
	@keyframes cs-eyes {
		0%,
		100% {
			opacity: 0.75;
			transform: scale(0.92);
		}
		50% {
			opacity: 1;
			transform: scale(1.12);
		}
	}
	@keyframes cs-glint {
		0%,
		55% {
			transform: translateX(-120px);
		}
		85%,
		100% {
			transform: translateX(260px);
		}
	}
	@keyframes cs-spark {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		12% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), -190px);
		}
	}
</style>
