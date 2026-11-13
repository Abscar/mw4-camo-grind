<!--
	Banner between the nuke banner and the cyborg banner (Abscar only): the user's own comic-style picture of
	Drängen Lars Åke's operator (their friend Robin, see LarsAkeEmblem): black helmet, glowing lime-green
	goggles with a lens flare across them, a mic, a black vest with lime shoulder buckles, in front of red and
	orange flames (assets/lars-ake-banner.webp, 1672×941, sent in chat 2026-11-13, the user's ask: "add this at
	the bottom of the page by the other 2 similar pictures"). The chest logo is part of the user's picture; we
	draw none ourselves.
	Same box height as the other two banners (h-[clamp(190px,38vw,470px)] in +page.svelte), so the three look in
	proportion: the picture fills it like object-fit: cover (desktop shows helmet brim to shoulders, phones
	almost all of it).
	Our extras, drawn in picture coordinates so they stay put at any width: the goggles glow and flicker, the
	lens flare across them pulses, and embers drift up from the flames on both sides. prefers-reduced-motion
	freezes them (the embers are hidden). Decoration only, so the alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** The bright spot of the lens flare on the goggles, and the goggles' middle. */
	const FLARE = [940, 285];
	const LENS = [848, 292];

	/** Embers over the flames on both sides: [x, y, radius, delay s, duration s, sideways drift px]. */
	const EMBERS = [
		[110, 760, 4, 0, 5.4, 28],
		[250, 680, 3, 1.6, 6.2, -22],
		[380, 780, 4.5, 3.1, 5.7, 18],
		[70, 560, 2.5, 2.3, 6.8, 20],
		[300, 520, 3, 4.3, 5.6, -16],
		[460, 640, 3.5, 0.8, 6.4, 24],
		[1260, 700, 4, 0.5, 5.8, -24],
		[1400, 780, 3, 2, 6.3, 20],
		[1540, 640, 3.5, 3.5, 5.5, -18],
		[1610, 760, 4.5, 1.2, 6.6, -22],
		[1330, 540, 2.5, 4.6, 7, 16],
		[1480, 500, 3, 2.8, 6, -20]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/lars-ake-banner.webp';

	const uid = $props.id();
</script>

<div class="la-banner relative h-full w-full overflow-hidden">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<!-- "slice" crops the overlay exactly like object-fit: cover crops the picture, so the glow stays on the goggles -->
	<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-lens">
				<stop offset="0" stop-color="#d8ff7a" stop-opacity="0.75" />
				<stop offset="0.45" stop-color="#7dff2a" stop-opacity="0.35" />
				<stop offset="1" stop-color="#3aff00" stop-opacity="0" />
			</radialGradient>
			<radialGradient id="{uid}-spot">
				<stop offset="0" stop-color="#ffffff" stop-opacity="0.95" />
				<stop offset="0.25" stop-color="#e6ffb0" stop-opacity="0.75" />
				<stop offset="0.6" stop-color="#8dff3a" stop-opacity="0.25" />
				<stop offset="1" stop-color="#5cff00" stop-opacity="0" />
			</radialGradient>
			<linearGradient id="{uid}-streak" x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#ffb347" stop-opacity="0" />
				<stop offset="0.3" stop-color="#ffcf5a" stop-opacity="0.55" />
				<stop offset="0.5" stop-color="#ffffff" stop-opacity="0.95" />
				<stop offset="0.7" stop-color="#ffcf5a" stop-opacity="0.55" />
				<stop offset="1" stop-color="#ffb347" stop-opacity="0" />
			</linearGradient>
		</defs>
		<ellipse class="lb-lens" cx={LENS[0]} cy={LENS[1]} rx="230" ry="85" fill="url(#{uid}-lens)" />
		<ellipse class="lb-streak" cx={FLARE[0]} cy={FLARE[1]} rx="470" ry="7" fill="url(#{uid}-streak)" />
		<circle class="lb-spot" cx={FLARE[0]} cy={FLARE[1]} r="70" fill="url(#{uid}-spot)" />
		{#each EMBERS as [cx, cy, r, delay, dur, dx], i (i)}
			<circle
				class="lb-ember"
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
	.la-banner {
		border-radius: inherit;
		background: #160603;
	}
	.la-banner img,
	.la-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	.la-banner img {
		object-fit: cover;
	}
	/* the same dark inner edge as the other banners, so the picture sinks into the page */
	.la-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(140 255 60 / 0.3);
	}
	.lb-lens,
	.lb-streak,
	.lb-spot,
	.lb-ember {
		transform-box: fill-box;
		transform-origin: center;
	}
	/* the goggles glow and flicker now and then, like a screen */
	.lb-lens {
		mix-blend-mode: screen;
		opacity: 0.5;
		animation: lb-lens 4s ease-in-out infinite;
	}
	@keyframes lb-lens {
		0%,
		100% {
			opacity: 0.35;
		}
		40% {
			opacity: 0.7;
		}
		52% {
			opacity: 0.4;
		}
		55% {
			opacity: 0.75;
		}
		70% {
			opacity: 0.55;
		}
	}
	/* the lens flare across the goggles stretches and fades in a slow pulse */
	.lb-streak,
	.lb-spot {
		mix-blend-mode: screen;
		opacity: 0.6;
	}
	.lb-streak {
		animation: lb-streak 3.2s ease-in-out infinite;
	}
	@keyframes lb-streak {
		0%,
		100% {
			opacity: 0.35;
			transform: scaleX(0.8);
		}
		50% {
			opacity: 0.85;
			transform: scaleX(1.12);
		}
	}
	.lb-spot {
		animation: lb-spot 3.2s ease-in-out infinite;
	}
	@keyframes lb-spot {
		0%,
		100% {
			opacity: 0.45;
			transform: scale(0.85);
		}
		50% {
			opacity: 0.95;
			transform: scale(1.15);
		}
	}
	.lb-ember {
		opacity: 0;
		animation-name: lb-ember;
		animation-timing-function: ease-out;
		animation-iteration-count: infinite;
	}
	@keyframes lb-ember {
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
		.lb-ember {
			display: none;
		}
	}
</style>
