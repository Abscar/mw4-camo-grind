<!--
	The last banner of the banner block, under the doomsday picture (Abscar only): the user's own
	comic-style picture of a rider on a red electric scooter in a helmet and a blue striped track
	jacket, in front of a wall of flames over burning rocks (assets/scooter-banner.webp, 1672×941, sent
	in chat 2026-11-16, the user's ask: "add this at the bottom of the page with the others").
	Everything in the picture is the user's; we draw only light effects. Same box height as the other
	banners (h-[clamp(190px,38vw,470px)] in +page.svelte). The picture is pinned to the TOP of the box
	(object-position top + "xMidYMin slice") so the helmet and face always show; on desktop the bottom
	(wheels, rocks) is trimmed, phones show almost all of it.
	Our extras, in picture coordinates so they stay put at any width: the flames on both sides and behind
	the rider breathe and flicker, and embers drift up across the picture. prefers-reduced-motion
	freezes the glows and hides the embers. Decoration only, so the alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** Flame glows: [cx, cy, rx, ry, delay s]. */
	const GLOWS = [
		[300, 470, 330, 260, 0],
		[1400, 420, 320, 280, -1.7],
		[830, 300, 230, 260, -3.1]
	];

	/** Embers: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[80, 640, 4, 0, 5.2, 26],
		[210, 520, 3, 1.4, 6.1, -20],
		[340, 660, 4.5, 2.9, 5.6, 18],
		[60, 400, 2.5, 2.2, 6.7, 22],
		[470, 470, 3, 4.1, 5.5, -14],
		[590, 610, 3.5, 0.7, 6.3, 24],
		[1080, 620, 3.5, 2.4, 5.8, -22],
		[1210, 500, 4, 0.4, 5.7, -26],
		[1370, 650, 3, 1.9, 6.2, 18],
		[1500, 470, 3.5, 3.3, 5.4, -16],
		[1610, 620, 4.5, 1.1, 6.5, -24],
		[1300, 360, 2.5, 4.4, 6.9, 14],
		[1000, 420, 2.5, 3.6, 6.4, 12],
		[700, 380, 2.5, 4.8, 6.8, -12]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/scooter-banner.webp';

	const uid = $props.id();
</script>

<div class="sc-banner relative h-full w-full overflow-hidden">
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
		</defs>
		{#each GLOWS as [cx, cy, rx, ry, delay], i (i)}
			<ellipse class="sc-glow" {cx} {cy} {rx} {ry} fill="url(#{uid}-fire)" style:animation-delay="{delay}s" />
		{/each}
		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="sc-ember"
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
	.sc-banner {
		border-radius: inherit;
		background: #1a0603;
	}
	.sc-banner img,
	.sc-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.sc-banner img {
		object-fit: cover;
		object-position: center top;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.sc-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(255 120 30 / 0.4);
	}
	.sc-ember {
		transform-box: fill-box;
		transform-origin: center;
	}
	/* the flames breathe, with a flicker now and then */
	.sc-glow {
		mix-blend-mode: screen;
		opacity: 0.35;
		animation: sc-glow 4.6s ease-in-out infinite;
	}
	@keyframes sc-glow {
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
	.sc-ember {
		opacity: 0;
		animation-name: sc-ember;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes sc-ember {
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
		.sc-ember {
			display: none;
		}
		.sc-glow {
			animation: none;
		}
	}
</style>
