<!--
	The last banner of the banner block, under the crowned skull (Abscar only): the user's own comic-style
	picture of five operators in front of a mushroom cloud over a burning base: a ghillie sniper covered in
	leaves, a gas-mask soldier, a chrome cyborg with red eyes in the middle, a leaf-filled dome helmet and a
	moss creature, with a water tower, a helicopter and radiation barrels around them
	(assets/doomsday-banner.webp, 1672×941, sent in chat 2026-11-14, the user's ask: "add this at the very
	bottom under the other banners"). Everything in the picture is the user's; we draw only the light effects.
	Same box height as the other banners (h-[clamp(190px,38vw,470px)] in +page.svelte). The picture is pinned
	to the TOP of the box (object-position top + "xMidYMin slice"), so on desktop the whole mushroom cloud and
	all five heads show and the rubble at the bottom is trimmed; phones show almost all of it.
	Our extras, drawn in picture coordinates so they stay put at any width: the fireball breathes and flickers,
	the cyborg's eyes pulse, and embers drift up across the whole picture. prefers-reduced-motion freezes the
	glows and hides the embers. Decoration only, so the alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** The middle of the fireball. */
	const BLAST = [832, 105];

	/** The cyborg's two eyes. */
	const EYES = [
		[801, 288],
		[849, 288]
	];

	/** Embers: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[90, 620, 4, 0, 5.4, 28],
		[230, 520, 3, 1.6, 6.2, -22],
		[360, 640, 4.5, 3.1, 5.7, 18],
		[60, 420, 2.5, 2.3, 6.8, 20],
		[470, 470, 3, 4.3, 5.6, -16],
		[610, 600, 3.5, 0.8, 6.4, 24],
		[700, 380, 2.5, 3.8, 6.9, -14],
		[980, 420, 2.5, 1.1, 6.6, 16],
		[1090, 600, 3.5, 2.6, 5.9, -20],
		[1250, 520, 4, 0.5, 5.8, -24],
		[1390, 640, 3, 2, 6.3, 20],
		[1530, 480, 3.5, 3.5, 5.5, -18],
		[1610, 620, 4.5, 1.2, 6.6, -22],
		[1320, 380, 2.5, 4.6, 7, 16]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/doomsday-banner.webp';

	const uid = $props.id();
</script>

<div class="dd-banner relative h-full w-full overflow-hidden">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<!-- "xMidYMin slice" crops the overlay exactly like object-fit: cover + object-position top crops the picture -->
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMin slice" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-blast">
				<stop offset="0" stop-color="#fff6c8" stop-opacity="0.85" />
				<stop offset="0.3" stop-color="#ffc14a" stop-opacity="0.5" />
				<stop offset="0.65" stop-color="#ff6a1a" stop-opacity="0.2" />
				<stop offset="1" stop-color="#ff3a00" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="{uid}-eye">
				<stop offset="0" stop-color="#ffffff" stop-opacity="0.95" />
				<stop offset="0.25" stop-color="#ff8a6a" stop-opacity="0.8" />
				<stop offset="0.6" stop-color="#ff1a0a" stop-opacity="0.35" />
				<stop offset="1" stop-color="#ff0000" stop-opacity="0" />
			</radialGradient>
		</defs>
		<ellipse class="dd-blast" cx={BLAST[0]} cy={BLAST[1]} rx="360" ry="170" fill="url(#{uid}-blast)" />
		<!-- the hot column under the cloud -->
		<ellipse class="dd-blast dd-stem" cx={BLAST[0] - 8} cy="225" rx="90" ry="120" fill="url(#{uid}-blast)" />
		{#each EYES as [cx, cy], i (i)}
			<circle class="dd-eye" {cx} {cy} r="19" fill="url(#{uid}-eye)" />
		{/each}
		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="dd-ember"
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
	.dd-banner {
		border-radius: inherit;
		background: #1a0603;
	}
	.dd-banner img,
	.dd-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.dd-banner img {
		object-fit: cover;
		object-position: center top;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.dd-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(255 120 30 / 0.4);
	}
	.dd-eye,
	.dd-ember {
		transform-box: fill-box;
		transform-origin: center;
	}
	/* the fireball breathes, with a quick flicker now and then */
	.dd-blast {
		mix-blend-mode: screen;
		opacity: 0.4;
		animation: dd-blast 5.2s ease-in-out infinite;
	}
	.dd-stem {
		animation-delay: -1.3s;
	}
	@keyframes dd-blast {
		0%,
		100% {
			opacity: 0.25;
		}
		38% {
			opacity: 0.7;
		}
		44% {
			opacity: 0.45;
		}
		50% {
			opacity: 0.75;
		}
		72% {
			opacity: 0.35;
		}
	}
	/* the cyborg's eyes pulse */
	.dd-eye {
		mix-blend-mode: screen;
		opacity: 0.55;
		animation: dd-eye 2.6s ease-in-out infinite;
	}
	@keyframes dd-eye {
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
	.dd-ember {
		opacity: 0;
		animation-name: dd-ember;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes dd-ember {
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
		.dd-ember {
			display: none;
		}
		.dd-blast,
		.dd-eye {
			animation: none;
		}
	}
</style>
