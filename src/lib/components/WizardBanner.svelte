<!--
	The second-to-last banner of the banner block, between the crowned skull and the doomsday picture (Abscar
	only): the user's own comic-style picture of an old bearded wizard in a rainbow-banded hat with a gold
	weed leaf, red glowing eyes behind round glasses, a pipe in his mouth with smoke curling up, a purple robe
	over a bandolier, flames all around (assets/wizard-banner.webp, 1672×941, sent in chat 2026-11-14, the
	user's ask: "add this banner with the others, above the bottom one"). Everything in the picture is the
	user's; we draw only the light effects.
	Same box height as the other banners (h-[clamp(190px,38vw,470px)] in +page.svelte). The picture is pinned
	to the TOP of the box (object-position top + "xMidYMin slice"), so on desktop the hat with its leaf, the
	eyes and the pipe all show (picture y 0–655 at 1200 × 470; the bandolier is trimmed); phones show almost all.
	Our extras, drawn in picture coordinates so they stay put at any width: the eyes pulse with a red streak
	through the glasses, the pipe's ember glows and flickers, smoke puffs well up from the bowl and drift up to
	the right, the gold leaf on the hat twinkles, and embers rise from the flames on both sides.
	prefers-reduced-motion freezes the glows and hides the smoke, sparkles and embers. Decoration only, so the
	alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** The wizard's two eyes (behind the glasses). */
	const EYES = [
		[765, 308],
		[955, 310]
	];

	/** The opening of the pipe's bowl. */
	const BOWL = [1241, 526];

	/**
	 * Smoke puffs from the bowl: [radius, delay s, duration s, sideways drift px, rise px]. They follow the
	 * painted smoke (up and right to about 1295, 450, on to 1350, 330, then out past the brim's tip to about
	 * 1480, 150), so they never smudge the dark underside of the brim.
	 */
	const PUFFS = [
		[13, 0, 6.4, 235, 365],
		[11, -0.9, 6.8, 215, 345],
		[14, -1.8, 6.1, 255, 380],
		[10, -2.7, 7, 225, 335],
		[12, -3.6, 6.5, 245, 370],
		[11, -4.5, 6.9, 210, 340],
		[13, -5.4, 6.3, 240, 355],
		[10, -6.2, 7.2, 260, 390]
	];

	/** Twinkles on the gold leaf of the hat: [x, y, size, delay s]. */
	const SPARKLES = [
		[751, 24, 15, 0],
		[786, 48, 11, 1.7],
		[699, 90, 10, 3.1]
	];

	/** Embers: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[70, 600, 4, 0, 5.4, 26],
		[180, 470, 3, 1.6, 6.2, -20],
		[300, 620, 4.5, 3.1, 5.7, 18],
		[40, 380, 2.5, 2.3, 6.8, 20],
		[410, 520, 3, 4.3, 5.6, -16],
		[250, 300, 2.5, 0.8, 6.4, 22],
		[1400, 620, 3.5, 2.6, 5.9, -20],
		[1480, 470, 4, 0.5, 5.8, -24],
		[1560, 600, 3, 2, 6.3, 20],
		[1630, 420, 3.5, 3.5, 5.5, -18],
		[1520, 300, 2.5, 1.2, 6.6, -22],
		[1600, 220, 2.5, 4.6, 7, 16]
	];

	/** A four-pointed star centred on 0,0 with the given size (tip to centre). */
	const star = (s: number) => {
		const k = s * 0.22;
		return `M0 ${-s} L${k} ${-k} L${s} 0 L${k} ${k} L0 ${s} L${-k} ${k} L${-s} 0 L${-k} ${-k}Z`;
	};
</script>

<script lang="ts">
	import picture from '#lib/assets/wizard-banner.webp';

	const uid = $props.id();
</script>

<div class="wz-banner relative h-full w-full overflow-hidden">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<!-- "xMidYMin slice" crops the overlay exactly like object-fit: cover + object-position top crops the picture -->
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMin slice" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-eye">
				<stop offset="0" stop-color="#ffffff" stop-opacity="0.95" />
				<stop offset="0.25" stop-color="#ff8a6a" stop-opacity="0.8" />
				<stop offset="0.6" stop-color="#ff1a0a" stop-opacity="0.35" />
				<stop offset="1" stop-color="#ff0000" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="{uid}-ember">
				<stop offset="0" stop-color="#fff2b0" stop-opacity="0.95" />
				<stop offset="0.35" stop-color="#ffab3a" stop-opacity="0.75" />
				<stop offset="0.7" stop-color="#ff5a14" stop-opacity="0.3" />
				<stop offset="1" stop-color="#ff3a00" stop-opacity="0" />
			</radialGradient>
			<filter id="{uid}-smoke" x="-100%" y="-100%" width="300%" height="300%">
				<feGaussianBlur stdDeviation="7" />
			</filter>
		</defs>

		<!-- the red streak through the glasses brightens with the eyes -->
		<ellipse class="wz-streak" cx="860" cy="302" rx="430" ry="3.5" fill="#ff4a32" />
		{#each EYES as [cx, cy], i (i)}
			<ellipse class="wz-flare" {cx} {cy} rx="130" ry="2.5" fill="#ff7a5c" />
			<circle class="wz-eye" {cx} {cy} r="22" fill="url(#{uid}-eye)" />
		{/each}

		<!-- the ember in the pipe: a soft glow over the bowl and a hot core in the opening -->
		<ellipse class="wz-pipe wz-pipe-glow" cx={BOWL[0]} cy={BOWL[1] - 6} rx="80" ry="46" fill="url(#{uid}-ember)" />
		<ellipse class="wz-pipe" cx={BOWL[0]} cy={BOWL[1] + 1} rx="38" ry="12" fill="url(#{uid}-ember)" />

		<!-- smoke welling up from the bowl, one blurred group -->
		<g class="wz-smoke" filter="url(#{uid}-smoke)">
			{#each PUFFS as [r, delay, dur, dx, rise], i (i)}
				<circle
					class="wz-puff"
					cx={BOWL[0]}
					cy={BOWL[1] - 14}
					{r}
					fill={i % 2 ? '#f6e0d6' : '#e6cdc4'}
					style:animation-delay="{delay}s"
					style:animation-duration="{dur}s"
					style:--dx="{dx}px"
					style:--rise="{-rise}px"
				/>
			{/each}
		</g>

		{#each SPARKLES as [x, y, s, delay], i (i)}
			<g transform="translate({x} {y})">
				<path class="wz-sparkle" d={star(s)} fill="#fff6d0" style:animation-delay="{delay}s" />
			</g>
		{/each}

		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="wz-spark"
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
	.wz-banner {
		border-radius: inherit;
		background: #1a0603;
	}
	.wz-banner img,
	.wz-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.wz-banner img {
		object-fit: cover;
		object-position: center top;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.wz-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(255 120 30 / 0.4);
	}
	.wz-eye,
	.wz-flare,
	.wz-streak,
	.wz-pipe,
	.wz-puff,
	.wz-sparkle,
	.wz-spark {
		transform-box: fill-box;
		transform-origin: center;
	}

	/* the eyes pulse, and the streak through the glasses swells with them */
	.wz-eye,
	.wz-flare,
	.wz-streak {
		mix-blend-mode: screen;
		animation: wz-eye 2.8s ease-in-out infinite;
	}
	.wz-streak {
		animation-name: wz-streak;
	}
	@keyframes wz-eye {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.85);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
	@keyframes wz-streak {
		0%,
		100% {
			opacity: 0.2;
			transform: scaleX(0.9);
		}
		50% {
			opacity: 0.75;
			transform: scaleX(1.05);
		}
	}

	/* the pipe's ember glows on each draw and flickers in between */
	.wz-pipe {
		mix-blend-mode: screen;
		opacity: 0.5;
		animation: wz-pipe 4.6s ease-in-out infinite;
	}
	.wz-pipe-glow {
		animation-delay: -0.2s;
	}
	@keyframes wz-pipe {
		0%,
		100% {
			opacity: 0.35;
			transform: scale(0.92);
		}
		30% {
			opacity: 0.95;
			transform: scale(1.08);
		}
		36% {
			opacity: 0.6;
		}
		42% {
			opacity: 0.9;
		}
		70% {
			opacity: 0.45;
			transform: scale(0.96);
		}
	}

	/* each puff wells up at the bowl, rises, swells and curls off to the right before it fades */
	.wz-puff {
		opacity: 0;
		animation-name: wz-puff;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes wz-puff {
		0% {
			opacity: 0;
			transform: translate(0, 0) scale(0.6);
		}
		12% {
			opacity: 0.45;
		}
		22% {
			transform: translate(50px, calc(var(--rise) * 0.2)) scale(1.5);
		}
		45% {
			opacity: 0.28;
			transform: translate(110px, calc(var(--rise) * 0.5)) scale(2.2);
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), var(--rise)) scale(3.4);
		}
	}

	/* the gold leaf on the hat twinkles now and then */
	.wz-sparkle {
		opacity: 0;
		mix-blend-mode: screen;
		animation: wz-sparkle 4.8s ease-in-out infinite;
	}
	@keyframes wz-sparkle {
		0%,
		70%,
		100% {
			opacity: 0;
			transform: scale(0.2) rotate(0deg);
		}
		80% {
			opacity: 1;
			transform: scale(1) rotate(45deg);
		}
		90% {
			opacity: 0;
			transform: scale(0.3) rotate(90deg);
		}
	}

	.wz-spark {
		opacity: 0;
		animation-name: wz-spark;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes wz-spark {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		12% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), -300px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wz-smoke,
		.wz-sparkle,
		.wz-spark {
			display: none;
		}
		.wz-eye,
		.wz-flare,
		.wz-streak,
		.wz-pipe {
			animation: none;
		}
	}
</style>
