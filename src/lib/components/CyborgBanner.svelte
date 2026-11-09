<!--
	Banner between Divergence & Mastery and Backup (Abscar only): the user's own picture of a chrome
	cyborg skull with glowing red eyes in front of flames (assets/cyborg-banner.webp, from their Pictures
	folder, 2026-11-07; it replaced our drawn CyborgSmoke banner at their ask).
	Drawn as an SVG <image> with the picture's own size as viewBox and "slice", so it fills the box like
	object-fit: cover (the middle shows) and the extras stay in place on the picture whatever the box size:
	the eyes pulse, a few embers drift up from the flames, a dark inner edge blends it into the page.
	Just for fun (2026-11-08, the user's ask) the whole banner is a button ("Wake the cyborg"): a tap makes
	the eyes flare white-hot, two red lasers shoot out of them and sweep out across the picture and back, a
	red scan line runs down it, a burst of bright embers flies up from the flames and the picture shakes a
	little (~2 s; a new tap restarts it). Everything is drawn in picture coordinates, so the lasers start at
	the eyes at any box size. prefers-reduced-motion freezes it: the embers stay hidden and a tap only
	brightens the eyes for a moment.
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

	/**
	 * The lasers, one per eye: where each starts pointing (down and a little out) and how far out it
	 * sweeps (almost level, toward its own side). Degrees, clockwise from pointing right.
	 */
	const BEAMS = [
		{ eye: EYES[0], from: 112, to: 176 },
		{ eye: EYES[1], from: 68, to: 4 }
	];
	/** How far a laser reaches: past the picture's edge from either eye. */
	const BEAM_LEN = 1900;

	/** The burst of embers on a tap, left flames (mirrored for the right): [x, y, r, delay s, dur s, dx, dy]. */
	const SPARKS_LEFT = [
		[90, 740, 7, 0.05, 1.3, 40, -420],
		[170, 660, 5, 0.18, 1.1, -30, -380],
		[250, 780, 8, 0.1, 1.5, 25, -480],
		[330, 700, 6, 0.3, 1.2, -40, -420],
		[410, 620, 5, 0.22, 1, 30, -360],
		[60, 600, 6, 0.4, 1.3, 20, -380],
		[210, 560, 4.5, 0.5, 1.1, -20, -340],
		[360, 800, 7, 0.35, 1.4, 45, -480],
		[130, 800, 6, 0.6, 1.2, -25, -440]
	];
	const SPARKS = [
		...SPARKS_LEFT,
		...SPARKS_LEFT.map(([x, y, r, d, dur, dx, dy]) => [W - x, y, r, d + 0.07, dur, -dx, dy])
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/cyborg-banner.webp';
	import { t } from '#lib/i18n/en.ts';

	const uid = $props.id();

	let svg = $state<SVGSVGElement>();
	/** Bumped on every tap: the effect's elements are keyed on it, so a new tap restarts them. */
	let run = $state(0);
	/** Reduced motion: the eyes just brighten for a moment instead. */
	let bright = $state(false);
	let brightTimer: ReturnType<typeof setTimeout> | undefined;
	let shake: Animation | undefined;

	function wake() {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
			bright = true;
			clearTimeout(brightTimer);
			brightTimer = setTimeout(() => (bright = false), 700);
			return;
		}
		run++;
		shake?.cancel();
		const at = (x: number, y: number, offset: number) => ({
			transform: `translate(${x}px, ${y}px) scale(1.015)`,
			offset
		});
		shake = svg?.animate(
			[
				{ transform: 'none', offset: 0 },
				at(-3, 2, 0.12),
				at(3, -2, 0.26),
				at(-2, -1, 0.42),
				at(2, 1, 0.58),
				at(-1, 1, 0.76),
				{ transform: 'none', offset: 1 }
			],
			{ duration: 460, easing: 'ease-out' }
		);
	}
</script>

<button
	type="button"
	class="cyborg-banner relative block h-full w-full overflow-hidden"
	aria-label={t.cyborg.wake}
	title={t.cyborg.wake}
	onclick={wake}
>
	<svg
		bind:this={svg}
		viewBox="0 0 {W} {H}"
		preserveAspectRatio="xMidYMid slice"
		focusable="false"
		aria-hidden="true"
	>
		<defs>
			<radialGradient id="{uid}-glow">
				<stop offset="0" stop-color="#ffd8cc" stop-opacity="0.9" />
				<stop offset="0.12" stop-color="#ff3a22" stop-opacity="0.75" />
				<stop offset="0.45" stop-color="#ff1a08" stop-opacity="0.25" />
				<stop offset="1" stop-color="#ff1a08" stop-opacity="0" />
			</radialGradient>
			<!-- the white-hot core of a flaring eye -->
			<radialGradient id="{uid}-hot">
				<stop offset="0" stop-color="#ffffff" />
				<stop offset="0.28" stop-color="#fff1e8" stop-opacity="0.95" />
				<stop offset="0.55" stop-color="#ff6a4a" stop-opacity="0.6" />
				<stop offset="1" stop-color="#ff1a08" stop-opacity="0" />
			</radialGradient>
			<!-- the big red bloom around a flaring eye -->
			<radialGradient id="{uid}-bloom">
				<stop offset="0" stop-color="#ffe0d4" stop-opacity="0.95" />
				<stop offset="0.15" stop-color="#ff4a2a" stop-opacity="0.85" />
				<stop offset="0.5" stop-color="#ff200c" stop-opacity="0.35" />
				<stop offset="1" stop-color="#ff1a08" stop-opacity="0" />
			</radialGradient>
			<!-- a glowing ember of the burst -->
			<radialGradient id="{uid}-spark">
				<stop offset="0" stop-color="#fffbe8" />
				<stop offset="0.4" stop-color="#ffd25a" />
				<stop offset="0.7" stop-color="#ff7a1a" stop-opacity="0.55" />
				<stop offset="1" stop-color="#ff3a08" stop-opacity="0" />
			</radialGradient>
			<!-- a laser: hot at the eye, fading toward its far end -->
			<linearGradient id="{uid}-beam">
				<stop offset="0" stop-color="#ffd2c6" />
				<stop offset="0.06" stop-color="#ff4a2c" stop-opacity="0.95" />
				<stop offset="0.55" stop-color="#ff2410" stop-opacity="0.6" />
				<stop offset="1" stop-color="#ff1a08" stop-opacity="0.12" />
			</linearGradient>
			<linearGradient id="{uid}-core">
				<stop offset="0" stop-color="#ffffff" />
				<stop offset="0.5" stop-color="#ffd6cc" stop-opacity="0.75" />
				<stop offset="1" stop-color="#ffb4a4" stop-opacity="0" />
			</linearGradient>
			<!-- the glow trailing above the scan line -->
			<linearGradient id="{uid}-scan" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#ff2a12" stop-opacity="0" />
				<stop offset="1" stop-color="#ff2a12" stop-opacity="0.38" />
			</linearGradient>
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

		<!-- reduced motion: a tap only brightens the eyes for a moment -->
		{#if bright}
			{#each EYES as [cx, cy], i (i)}
				<circle class="cb-still" {cx} {cy} r="150" fill="url(#{uid}-glow)" />
				<circle class="cb-still" {cx} {cy} r="30" fill="url(#{uid}-hot)" />
			{/each}
		{/if}

		<!-- a tap: flash, lasers, scan line, ember burst (keyed, so a new tap restarts it) -->
		{#key run}
			{#if run}
				<g class="cb-fx">
					<rect class="cb-flash" width={W} height={H} fill="#ff2010" />

					{#each SPARKS as [cx, cy, r, delay, dur, dx, dy], i (i)}
						<circle
							class="cb-spark"
							{cx}
							{cy}
							r={r * 3}
							fill="url(#{uid}-spark)"
							style:animation-delay="{delay}s"
							style:animation-duration="{dur}s"
							style:--dx="{dx}px"
							style:--dy="{dy}px"
						/>
					{/each}

					<g class="cb-scan">
						<rect y="-80" width={W} height="80" fill="url(#{uid}-scan)" />
						<rect y="-3" width={W} height="6" fill="#ff3a22" />
						<rect y="-1" width={W} height="2" fill="#ffd8cc" />
					</g>

					{#each BEAMS as { eye: [cx, cy], from, to }, i (i)}
						<g
							class="cb-beam"
							style:transform-origin="{cx}px {cy}px"
							style:--a0="{from}deg"
							style:--a1="{to}deg"
						>
							<polygon
								points="{cx},{cy - 9} {cx + BEAM_LEN},{cy - 64} {cx + BEAM_LEN},{cy + 64} {cx},{cy + 9}"
								fill="url(#{uid}-beam)"
								opacity="0.35"
							/>
							<polygon
								points="{cx},{cy - 4} {cx + BEAM_LEN},{cy - 18} {cx + BEAM_LEN},{cy + 18} {cx},{cy + 4}"
								fill="url(#{uid}-beam)"
							/>
							<polygon
								points="{cx},{cy - 1.6} {cx + BEAM_LEN},{cy - 5} {cx + BEAM_LEN},{cy + 5} {cx},{cy + 1.6}"
								fill="url(#{uid}-core)"
							/>
						</g>
					{/each}

					{#each EYES as [cx, cy], i (i)}
						<circle class="cb-bloom" {cx} {cy} r="210" fill="url(#{uid}-bloom)" />
						<ellipse class="cb-streak" {cx} {cy} rx="560" ry="5" fill="#ff7a5c" />
						<circle class="cb-core" {cx} {cy} r="46" fill="url(#{uid}-hot)" />
					{/each}
				</g>
			{/if}
		{/key}
	</svg>
</button>

<style>
	.cyborg-banner {
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: inherit;
		background: #120806;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
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
		border-radius: inherit;
		box-shadow:
			inset 0 0 70px 14px rgb(0 0 0 / 0.7),
			inset 0 -3px 0 rgb(255 60 30 / 0.35);
	}
	/* the box around the banner clips anything outside it, so the focus ring is drawn inside */
	.cyborg-banner:focus-visible {
		outline: none;
	}
	.cyborg-banner:focus-visible::after {
		box-shadow:
			inset 0 0 0 3px var(--t-accent),
			inset 0 0 0 5px rgb(0 0 0 / 0.75),
			inset 0 0 70px 14px rgb(0 0 0 / 0.7);
	}
	.cb-eye,
	.cb-flare,
	.cb-ember,
	.cb-spark,
	.cb-bloom,
	.cb-streak,
	.cb-core {
		transform-box: fill-box;
		transform-origin: center;
	}
	.cb-eye,
	.cb-flare,
	.cb-still,
	.cb-fx {
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

	/* ---- the tap effect (the elements start hidden, so a finished or frozen effect shows nothing) ---- */
	.cb-flash,
	.cb-spark,
	.cb-scan,
	.cb-beam,
	.cb-bloom,
	.cb-streak,
	.cb-core {
		opacity: 0;
	}
	/* a quick red flash over the whole picture as it wakes */
	.cb-flash {
		animation: cb-flash 0.5s ease-out;
	}
	@keyframes cb-flash {
		0% {
			opacity: 0;
		}
		18% {
			opacity: 0.2;
		}
		100% {
			opacity: 0;
		}
	}
	/* the eyes: a big red bloom, a white-hot core and a level streak */
	.cb-bloom {
		animation: cb-bloom 2.1s ease-out;
	}
	@keyframes cb-bloom {
		0% {
			opacity: 0;
			transform: scale(0.3);
		}
		8% {
			opacity: 1;
			transform: scale(1.3);
		}
		20% {
			opacity: 0.9;
			transform: scale(1);
		}
		50% {
			opacity: 0.75;
			transform: scale(1.08);
		}
		80% {
			opacity: 0.85;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(0.6);
		}
	}
	.cb-core {
		animation: cb-core 2.1s ease-out;
	}
	@keyframes cb-core {
		0% {
			opacity: 0;
			transform: scale(0.4);
		}
		7% {
			opacity: 1;
			transform: scale(1.35);
		}
		15% {
			transform: scale(1);
		}
		45% {
			opacity: 0.85;
			transform: scale(1.1);
		}
		82% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(0.5);
		}
	}
	.cb-streak {
		animation: cb-streak 1.4s ease-out;
	}
	@keyframes cb-streak {
		0% {
			opacity: 0;
			transform: scaleX(0);
		}
		8% {
			opacity: 0.95;
			transform: scaleX(1);
		}
		35% {
			opacity: 0.5;
			transform: scaleX(0.75);
		}
		100% {
			opacity: 0;
			transform: scaleX(0.5);
		}
	}
	/* the lasers shoot out of the eyes, sweep out to the sides and back, then go out.
	   No transform-box here: they turn around the eye's centre in picture coordinates. */
	.cb-beam {
		animation: cb-beam 1.8s ease-in-out 0.12s;
	}
	@keyframes cb-beam {
		0% {
			opacity: 1;
			transform: rotate(var(--a0)) scaleX(0);
		}
		10% {
			opacity: 1;
			transform: rotate(var(--a0)) scaleX(1);
		}
		30% {
			opacity: 0.85;
		}
		50% {
			opacity: 1;
			transform: rotate(var(--a1)) scaleX(1);
		}
		70% {
			opacity: 0.85;
		}
		88% {
			opacity: 1;
			transform: rotate(var(--a0)) scaleX(1);
		}
		100% {
			opacity: 0;
			transform: rotate(var(--a0)) scaleX(1);
		}
	}
	/* a thin red line runs down over the picture */
	.cb-scan {
		animation: cb-scan 1.5s linear 0.2s;
	}
	@keyframes cb-scan {
		0% {
			opacity: 0;
			transform: translate(0, 60px);
		}
		8% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(0, 880px);
		}
	}
	/* a burst of bright embers flies up from the flames */
	.cb-spark {
		animation-name: cb-spark;
		animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
	}
	@keyframes cb-spark {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(1);
		}
		10%,
		55% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), var(--dy)) scale(0.4);
		}
	}
</style>
