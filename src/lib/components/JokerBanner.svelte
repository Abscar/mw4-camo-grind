<!--
	The last banner of the banner block, under the scooter picture (Abscar only): the user's own comic-style
	picture of TheJoker_BPL's look, the clown villain screaming with glowing red eyes, green hair, white face
	paint and a purple coat, in front of a wall of flames (assets/joker-banner.webp, 1672×941, from the user's
	Pictures folder, sent in chat 2026-11-21 with "lägg till nere på sidan").
	Everything in the picture is the user's; we draw only light effects. Same box height as the other banners
	(h-[clamp(190px,38vw,470px)] in +page.svelte). The picture is pinned to the TOP of the box (object-position
	top + "xMidYMin slice") so the hair, eyes and mouth always show; on desktop the bottom of the coat is
	trimmed, phones show almost all of it.
	Our extras, in picture coordinates so they stay put at any width: the red eyes pulse with a flickering
	streak through them, the flames on both sides breathe, and embers drift up. prefers-reduced-motion freezes
	the glows and hides the embers. Decoration only, so the alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** The glowing eyes in the picture. */
	const EYES = [
		[723, 327],
		[885, 323]
	];

	/** Flame glows: [cx, cy, rx, ry, delay s]. */
	const GLOWS = [
		[230, 470, 300, 320, 0],
		[1450, 450, 300, 330, -1.9],
		[820, 120, 360, 170, -3.3]
	];

	/** Embers: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[70, 620, 4, 0, 5.2, 24],
		[190, 500, 3, 1.4, 6.1, -18],
		[320, 660, 4.5, 2.9, 5.6, 16],
		[110, 360, 2.5, 2.2, 6.7, 22],
		[430, 420, 3, 4.1, 5.5, -14],
		[520, 600, 3.5, 0.7, 6.3, 20],
		[1160, 600, 3.5, 2.4, 5.8, -20],
		[1270, 470, 4, 0.4, 5.7, -24],
		[1400, 640, 3, 1.9, 6.2, 18],
		[1530, 420, 3.5, 3.3, 5.4, -16],
		[1620, 600, 4.5, 1.1, 6.5, -22],
		[1340, 300, 2.5, 4.4, 6.9, 14],
		[640, 250, 2.5, 3.6, 6.4, -12],
		[1010, 240, 2.5, 4.8, 6.8, 12]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/joker-banner.webp';

	const uid = $props.id();
	const midX = (EYES[0][0] + EYES[1][0]) / 2;
	const midY = (EYES[0][1] + EYES[1][1]) / 2;
</script>

<div class="jk-banner relative h-full w-full overflow-hidden">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<!-- "xMidYMin slice" crops the overlay exactly like object-fit: cover + object-position top crops the picture -->
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMin slice" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-fire">
				<stop offset="0" stop-color="#fff2b0" stop-opacity="0.75" />
				<stop offset="0.35" stop-color="#ffa030" stop-opacity="0.45" />
				<stop offset="0.7" stop-color="#ff4a10" stop-opacity="0.18" />
				<stop offset="1" stop-color="#ff2a00" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="{uid}-eye">
				<stop offset="0" stop-color="#ffffff" stop-opacity="0.95" />
				<stop offset="0.18" stop-color="#ff6a5a" stop-opacity="0.85" />
				<stop offset="0.5" stop-color="#ff1a10" stop-opacity="0.35" />
				<stop offset="1" stop-color="#ff0000" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="{uid}-streak" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#ff1a10" stop-opacity="0" />
				<stop offset="0.35" stop-color="#ff3a20" stop-opacity="0.7" />
				<stop offset="0.5" stop-color="#ffd0c0" stop-opacity="0.95" />
				<stop offset="0.65" stop-color="#ff3a20" stop-opacity="0.7" />
				<stop offset="1" stop-color="#ff1a10" stop-opacity="0" />
			</linearGradient>
		</defs>
		{#each GLOWS as [cx, cy, rx, ry, delay], i (i)}
			<ellipse class="jk-glow" {cx} {cy} {rx} {ry} fill="url(#{uid}-fire)" style:animation-delay="{delay}s" />
		{/each}
		<!-- the red eyes: a streak of light through both, and a glow on each that pulses -->
		<ellipse class="jk-streak" cx={midX} cy={midY} rx="360" ry="9" fill="url(#{uid}-streak)" />
		{#each EYES as [cx, cy], i (i)}
			<circle class="jk-eye" {cx} {cy} r="64" fill="url(#{uid}-eye)" style:animation-delay="{i * -0.18}s" />
		{/each}
		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="jk-ember"
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
	.jk-banner {
		border-radius: inherit;
		background: #1a0503;
	}
	.jk-banner img,
	.jk-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.jk-banner img {
		object-fit: cover;
		object-position: center top;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.jk-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(255 60 40 / 0.45);
	}
	.jk-glow,
	.jk-eye,
	.jk-streak {
		mix-blend-mode: screen;
	}
	/* the flames breathe, with a flicker now and then */
	.jk-glow {
		opacity: 0.35;
		animation: jk-glow 4.6s ease-in-out infinite;
	}
	@keyframes jk-glow {
		0%,
		100% {
			opacity: 0.2;
		}
		36% {
			opacity: 0.6;
		}
		42% {
			opacity: 0.38;
		}
		48% {
			opacity: 0.66;
		}
		74% {
			opacity: 0.3;
		}
	}
	/* the eyes burn brighter and dimmer, the streak flickers with them */
	.jk-eye {
		opacity: 0.7;
		animation: jk-eye 2.2s ease-in-out infinite;
	}
	@keyframes jk-eye {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 1;
		}
	}
	.jk-streak {
		opacity: 0.6;
		animation: jk-streak 2.2s steps(1, end) infinite;
	}
	@keyframes jk-streak {
		0%,
		100% {
			opacity: 0.55;
		}
		40% {
			opacity: 0.9;
		}
		46% {
			opacity: 0.4;
		}
		52% {
			opacity: 1;
		}
		70% {
			opacity: 0.65;
		}
	}
	.jk-ember {
		transform-box: fill-box;
		transform-origin: center;
		opacity: 0;
		animation-name: jk-ember;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes jk-ember {
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
		.jk-ember {
			display: none;
		}
		.jk-glow,
		.jk-eye,
		.jk-streak {
			animation: none;
		}
	}
</style>
