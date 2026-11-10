<!--
	Banner right above the cyborg banner (Abscar only): the user's own poster of their operator (the green,
	moss-covered cyborg sniper "Abscar") next to their mate's (the red "Philestar"), with the Iridescent rank
	emblem and the MW4 logo (assets/squad-banner.webp, from their Pictures folder, 2026-11-10; 1672×941,
	webp q 0.8). Unlike the cyborg banner it is shown whole (the box keeps the picture's shape): it has
	names and a logo right up to its edges, and cropping would cut them off.
	Our only extra: Abscar's two red eyes glow a little, drawn in picture coordinates so they stay on the
	eyes at any width (prefers-reduced-motion freezes the pulse). Decoration only, so the alt text is empty.
-->
<script lang="ts" module>
	/** The picture's size in pixels. */
	const W = 1672;
	const H = 941;

	/** Centres of Abscar's two red eyes in the picture. */
	const EYES = [
		[612, 134],
		[666, 121]
	];
</script>

<script lang="ts">
	import picture from '#lib/assets/squad-banner.webp';

	const uid = $props.id();
</script>

<div class="squad-banner relative overflow-hidden" style:aspect-ratio="{W} / {H}">
	<img src={picture} alt="" width={W} height={H} loading="lazy" decoding="async" />
	<svg viewBox="0 0 {W} {H}" focusable="false" aria-hidden="true">
		<defs>
			<radialGradient id="{uid}-glow">
				<stop offset="0" stop-color="#ffd8cc" stop-opacity="0.85" />
				<stop offset="0.18" stop-color="#ff3a22" stop-opacity="0.7" />
				<stop offset="0.5" stop-color="#ff1a08" stop-opacity="0.22" />
				<stop offset="1" stop-color="#ff1a08" stop-opacity="0" />
			</radialGradient>
		</defs>
		{#each EYES as [cx, cy], i (i)}
			<circle
				class="sb-eye"
				{cx}
				{cy}
				r="38"
				fill="url(#{uid}-glow)"
				style:animation-delay="{i * 0.2}s"
			/>
		{/each}
	</svg>
</div>

<style>
	.squad-banner {
		border-radius: inherit;
		background: #0c0a06;
	}
	.squad-banner img,
	.squad-banner svg {
		position: absolute;
		inset: 0;
		display: block;
		width: 100%;
		height: 100%;
	}
	/* the same dark inner edge as the cyborg banner, so the picture sinks into the page */
	.squad-banner::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		box-shadow:
			inset 0 0 60px 10px rgb(0 0 0 / 0.6),
			inset 0 -3px 0 rgb(255 60 30 / 0.35);
	}
	.sb-eye {
		mix-blend-mode: screen;
		opacity: 0.5;
		transform-box: fill-box;
		transform-origin: center;
		animation: sb-eye 2.8s ease-in-out infinite;
	}
	@keyframes sb-eye {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 0.9;
			transform: scale(1.2);
		}
	}
</style>
