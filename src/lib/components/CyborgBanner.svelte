<!--
	Banner between Divergence & Mastery and Backup (Abscar only): the user's own picture of a chrome
	cyborg skull with glowing red eyes in front of flames (assets/cyborg-banner.webp, from their Pictures
	folder, 2026-11-07; it replaced our drawn CyborgSmoke banner at their ask).
	Drawn as an SVG <image> with the picture's own size as viewBox and "slice", so it fills the box like
	object-fit: cover (the middle shows) and the extras stay in place on the picture whatever the box size:
	the eyes pulse, a few embers drift up from the flames, a dark inner edge blends it into the page.
	Decorative and aria-hidden; prefers-reduced-motion freezes it (the embers then stay hidden).
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** Centres of the two glowing eyes in the picture. */
	const EYES = [
		[678, 329],
		[979, 329]
	];

	/** Embers over the flames on both sides: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[120, 760, 4, 0, 5.4, 30],
		[260, 820, 3, 1.7, 6.2, -24],
		[380, 700, 3.5, 3.2, 5.8, 18],
		[60, 600, 2.5, 2.4, 6.8, 22],
		[310, 560, 3, 4.4, 5.6, -16],
		[200, 900, 4.5, 0.9, 6.6, 26],
		[1330, 780, 4, 0.5, 5.8, -26],
		[1460, 860, 3, 2.1, 6.4, 20],
		[1580, 700, 3.5, 3.6, 5.5, -18],
		[1240, 620, 2.5, 1.3, 7, 16],
		[1620, 560, 3, 4.8, 6, -22],
		[1400, 920, 4.5, 2.8, 6.3, 24]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/cyborg-banner.webp';

	const uid = $props.id();
</script>

<div class="cyborg-banner relative h-full w-full overflow-hidden" aria-hidden="true">
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" focusable="false">
		<defs>
			<radialGradient id="{uid}-glow">
				<stop offset="0" stop-color="#ffd8cc" stop-opacity="0.9" />
				<stop offset="0.12" stop-color="#ff3a22" stop-opacity="0.75" />
				<stop offset="0.45" stop-color="#ff1a08" stop-opacity="0.25" />
				<stop offset="1" stop-color="#ff1a08" stop-opacity="0" />
			</radialGradient>
		</defs>

		<image href={picture} width={W} height={H} />

		<!-- the eyes flare up and calm down -->
		{#each EYES as [cx, cy], i (i)}
			<circle class="cb-eye" {cx} {cy} r="64" fill="url(#{uid}-glow)" />
			<ellipse class="cb-flare" {cx} {cy} rx="190" ry="2.6" fill="#ff5a3c" />
		{/each}

		<!-- embers rising from the flames -->
		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="cb-ember"
				{cx}
				{cy}
				{r}
				fill={i % 2 ? '#ffb347' : '#ff7a2a'}
				style:animation-delay="{delay}s"
				style:animation-duration="{dur}s"
				style:--dx="{dx}px"
			/>
		{/each}
	</svg>
</div>

<style>
	.cyborg-banner {
		background: #120806;
	}
	.cyborg-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	/* a dark inner edge so the picture sinks into the page instead of ending in a hard line */
	.cyborg-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		box-shadow:
			inset 0 0 70px 14px rgb(0 0 0 / 0.7),
			inset 0 -3px 0 rgb(255 60 30 / 0.35);
	}
	.cb-eye,
	.cb-flare,
	.cb-ember {
		transform-box: fill-box;
		transform-origin: center;
	}
	.cb-eye,
	.cb-flare {
		mix-blend-mode: screen;
	}
	.cb-eye {
		opacity: 0.55;
		animation: cb-eye 2.8s ease-in-out infinite;
	}
	.cb-flare {
		opacity: 0.35;
		animation: cb-flare 2.8s ease-in-out infinite;
	}
	.cb-ember {
		opacity: 0;
		animation-name: cb-ember;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes cb-eye {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.85);
		}
		50% {
			opacity: 0.95;
			transform: scale(1.15);
		}
	}
	@keyframes cb-flare {
		0%,
		100% {
			opacity: 0.15;
			transform: scaleX(0.6);
		}
		50% {
			opacity: 0.6;
			transform: scaleX(1.1);
		}
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
			transform: translate(var(--dx), -360px);
		}
	}
</style>
