<!--
	Banner right above the squad banner (Abscar only): the user's own picture of the nuke operator
	(Phillestar's favourite, see NukeOperator) as a cracked black-chrome skull with glowing orange eyes in a
	helmet with a headset, in front of a burning city with helicopters (assets/nuke-banner.webp, from their
	Pictures folder, 2026-11-10; 1672×941, webp q 0.8). Shown whole like the squad banner (the box keeps the
	picture's shape), so the helmet top and the radiation patch on the chest stay in.
	Our extras, drawn in picture coordinates so they stay put at any width: the eyes glow and flicker like
	embers, and a few sparks drift up from the fire on both sides. prefers-reduced-motion freezes them
	(the sparks are hidden). Decoration only, so the alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** Centres of the two glowing eyes in the picture. */
	const EYES = [
		[745, 225],
		[925, 222]
	];

	/** Sparks over the fire on both sides: [x, y, radius, delay s, duration s, sideways drift px]. */
	const SPARKS = [
		[90, 820, 4, 0, 5.2, 26],
		[220, 700, 3, 1.5, 6, -20],
		[360, 860, 4.5, 2.8, 5.6, 18],
		[150, 560, 2.5, 3.9, 6.6, 22],
		[420, 620, 3, 0.8, 5.8, -16],
		[1300, 760, 4, 0.4, 5.6, -24],
		[1440, 860, 3, 2.2, 6.2, 18],
		[1560, 640, 3.5, 3.4, 5.4, -20],
		[1620, 820, 4.5, 1.2, 6.4, 22],
		[1380, 560, 2.5, 4.4, 6.8, 16]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/nuke-banner.webp';

	const uid = $props.id();
</script>

<div class="nuke-banner relative overflow-hidden" style:aspect-ratio="{W} / {H}">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<svg viewBox="0 0 {W} {H}" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-glow">
				<stop offset="0" stop-color="#fff2c0" stop-opacity="0.85" />
				<stop offset="0.2" stop-color="#ffb02a" stop-opacity="0.7" />
				<stop offset="0.5" stop-color="#ff5a0a" stop-opacity="0.25" />
				<stop offset="1" stop-color="#ff3a00" stop-opacity="0" />
			</radialGradient>
		</defs>
		{#each EYES as [cx, cy], i (i)}
			<circle
				class="nb-eye"
				{cx}
				{cy}
				r="110"
				fill="url(#{uid}-glow)"
				style:animation-delay="{i * 0.35}s"
			/>
		{/each}
		{#each SPARKS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="nb-spark"
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
	.nuke-banner {
		border-radius: inherit;
		background: #140803;
	}
	.nuke-banner img,
	.nuke-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.nuke-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(255 120 30 / 0.35);
	}
	.nb-eye,
	.nb-spark {
		transform-box: fill-box;
		transform-origin: center;
	}
	/* the eyes flicker like embers: an uneven pulse */
	.nb-eye {
		mix-blend-mode: screen;
		opacity: 0.45;
		animation: nb-eye 3.2s ease-in-out infinite;
	}
	@keyframes nb-eye {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.85);
		}
		30% {
			opacity: 0.75;
			transform: scale(1.08);
		}
		42% {
			opacity: 0.5;
			transform: scale(0.98);
		}
		60% {
			opacity: 0.9;
			transform: scale(1.15);
		}
	}
	.nb-spark {
		opacity: 0;
		animation-name: nb-spark;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes nb-spark {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		12% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(var(--dx), -380px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.nb-spark {
			display: none;
		}
	}
</style>
