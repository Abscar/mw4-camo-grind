<!--
	Banner at the bottom of the banner block, after the cyborg banner (Abscar only): the user's own comic-style
	picture of DaJeeven's crowned skull operator (gold crown with purple gems, purple goggles, headset, purple
	scarf) in front of flames (assets/crown-banner.webp, 1173×662, sent in chat 2026-11-13 as two versions; the user's
	ask: "take the lower picture without the nickname and put it at the bottom of the page with the other 3").
	Cut from Pictures\b654f16d-….png below its gold divider line (y 679 onward).
	Same box height as the other banners (h-[clamp(190px,38vw,470px)] in +page.svelte). The picture is
	pinned to the TOP of the box (object-position top + "xMidYMin slice"), so on desktop the crown stays whole
	and the bottom (shoulder straps) is trimmed; phones show almost all of it.
	Our extras, drawn in picture coordinates so they stay put at any width: the goggles glow, a glint sweeps
	across them now and then, the crown's gems sparkle one after another, and embers drift up from the flames
	on both sides. prefers-reduced-motion hides the moving bits (the glow stays). Decoration only, empty alt.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1173;
	const H = 662;

	/** The middle of the goggles. */
	const LENS = [618, 176];

	/** The goggles' outline (two lenses with a dip over the nose), so the glint stays on the glass. */
	const VISOR =
		'M490 132 L750 132 Q762 134 760 150 L756 205 Q752 224 730 224 L655 224 Q630 200 605 224 L505 224 Q482 222 480 205 L476 150 Q476 134 490 132 Z';

	/** Sparkles on the crown's gems and tips: [x, y, size, delay s]. */
	const SPARKLES = [
		[548, 18, 22, 0],
		[706, 30, 18, 1.4],
		[826, 34, 16, 0.7],
		[376, 14, 14, 3.4],
		[630, 8, 15, 2.6],
		[540, 60, 11, 2],
		[670, 58, 11, 4.1]
	];

	/** Embers over the flames on both sides: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[80, 470, 3, 0, 5.4, 22],
		[190, 400, 2.5, 1.6, 6.2, -18],
		[290, 500, 3.5, 3.1, 5.7, 14],
		[50, 330, 2, 2.3, 6.8, 16],
		[230, 300, 2.5, 4.3, 5.6, -12],
		[140, 560, 3, 0.8, 6.4, 18],
		[900, 420, 3, 0.5, 5.8, -18],
		[1000, 520, 2.5, 2, 6.3, 16],
		[1100, 380, 3, 3.5, 5.5, -14],
		[1140, 500, 3.5, 1.2, 6.6, -18],
		[960, 300, 2, 4.6, 7, 12],
		[1060, 250, 2.5, 2.8, 6, -16]
	];

	/** A thin four-pointed star around (x, y). */
	function star(x: number, y: number, s: number): string {
		return `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;
	}
</script>

<script lang="ts">
	import picture from '#lib/assets/crown-banner.webp';

	const uid = $props.id();
</script>

<div class="cr-banner relative h-full w-full overflow-hidden">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<!-- "xMidYMin slice" crops the overlay exactly like object-fit: cover + object-position top crops the picture -->
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMin slice" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-lens">
				<stop offset="0" stop-color="#f0b8ff" stop-opacity="0.7" />
				<stop offset="0.45" stop-color="#b44dff" stop-opacity="0.35" />
				<stop offset="1" stop-color="#8a00ff" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="{uid}-twinkle">
				<stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
				<stop offset="0.35" stop-color="#ffe7a0" stop-opacity="0.45" />
				<stop offset="1" stop-color="#ffcc33" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="{uid}-glint" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#ffffff" stop-opacity="0" />
				<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.85" />
				<stop offset="1" stop-color="#ffffff" stop-opacity="0" />
			</linearGradient>
			<clipPath id="{uid}-visor"><path d={VISOR} /></clipPath>
		</defs>
		<ellipse class="cb-lens" cx={LENS[0]} cy={LENS[1]} rx="180" ry="72" fill="url(#{uid}-lens)" />
		<g clip-path="url(#{uid}-visor)">
			<path class="cb-glint" d="M420 120 L470 120 L420 236 L370 236 Z" fill="url(#{uid}-glint)" />
			<path class="cb-glint cb-glint-thin" d="M486 120 L500 120 L450 236 L436 236 Z" fill="url(#{uid}-glint)" />
		</g>
		{#each SPARKLES as [x, y, s, delay], i (i)}
			<g class="cb-sparkle" style:animation-delay="{delay}s">
				<circle cx={x} cy={y} r={s * 0.9} fill="url(#{uid}-twinkle)" />
				<path d={star(x, y, s)} fill="#fffbe8" />
			</g>
		{/each}
		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="cb-ember"
				{cx}
				{cy}
				{r}
				fill={i % 2 ? '#ffd27a' : '#ff8a2a'}
				style:animation-delay="{delay}s"
				style:animation-duration="{dur}s"
				style:--dx="{dx}px"
			/>
		{/each}
	</svg>
</div>

<style>
	.cr-banner {
		border-radius: inherit;
		background: #1a0603;
	}
	.cr-banner img,
	.cr-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.cr-banner img {
		object-fit: cover;
		object-position: center top;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.cr-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(190 80 255 / 0.35);
	}
	.cb-sparkle,
	.cb-ember {
		transform-box: fill-box;
		transform-origin: center;
	}
	/* the goggles glow in a slow breath */
	.cb-lens {
		mix-blend-mode: screen;
		opacity: 0.45;
		animation: cb-lens 4.4s ease-in-out infinite;
	}
	@keyframes cb-lens {
		0%,
		100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.7;
		}
	}
	/* a glint sweeps across the glass, then a long pause */
	.cb-glint {
		mix-blend-mode: screen;
		opacity: 0;
		animation: cb-glint 6s ease-in-out infinite;
	}
	.cb-glint-thin {
		animation-delay: 0.08s;
	}
	@keyframes cb-glint {
		0% {
			opacity: 0;
			transform: translateX(0);
		}
		4% {
			opacity: 0.8;
		}
		22% {
			opacity: 0.8;
			transform: translateX(420px);
		}
		24%,
		100% {
			opacity: 0;
			transform: translateX(420px);
		}
	}
	/* the gems twinkle one at a time */
	.cb-sparkle {
		opacity: 0;
		animation: cb-sparkle 4.8s ease-in-out infinite;
	}
	@keyframes cb-sparkle {
		0%,
		100% {
			opacity: 0;
			transform: scale(0.2) rotate(0deg);
		}
		8% {
			opacity: 1;
			transform: scale(1) rotate(25deg);
		}
		16%,
		99% {
			opacity: 0;
			transform: scale(0.2) rotate(50deg);
		}
	}
	.cb-ember {
		opacity: 0;
		animation-name: cb-ember;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes cb-ember {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		12% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), -280px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cb-glint,
		.cb-sparkle,
		.cb-ember {
			display: none;
		}
		.cb-lens {
			animation: none;
		}
	}
</style>
