<!--
	One of Abscar's operator figures (the bronze cyborg skull with the holk, on armoured shoulders; 2026-11-11,
	the user's picks from a draft sheet). The drawing is built by abscarOperator.ts (a deterministic string,
	so the prerendered page and the browser agree) and dropped into a 64×64 SVG. Decoration only.
	  ghillie = the header emblem (moss ghillie with weed leaves + buds), lighter = Continue grinding,
	  sniper = Meta top 5, nvg = Backup & sync.
-->
<script lang="ts">
	import { operatorMarkup, type OperatorVariant } from '#lib/abscarOperator.ts';

	let {
		variant,
		smoke = 0.9,
		class: cls = ''
	}: {
		variant: OperatorVariant;
		/** size of the smoke column: 0.9 = the header's full one, ~0.45 = a small one that stays round the head */
		smoke?: number;
		class?: string;
	} = $props();

	const uid = $props.id();
	const markup = $derived(operatorMarkup(variant, uid, smoke));
</script>

<svg viewBox="0 0 64 64" class="abscar-op overflow-visible {cls}" aria-hidden="true" focusable="false">
	<!-- trusted: built from our own constants, no user input -->
	{@html markup}
</svg>

<style>
	/* the lighter's flame flickers; the night-vision lenses breathe (both frozen by reduced motion in app.css) */
	.abscar-op :global(.aop-flame) {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: aop-flame 0.22s ease-in-out infinite alternate;
	}
	@keyframes aop-flame {
		from {
			transform: scale(0.9, 0.86) skewX(-4deg);
		}
		to {
			transform: scale(1.06, 1.12) skewX(4deg);
		}
	}
	.abscar-op :global(.aop-nvg) {
		animation: aop-nvg 2.6s ease-in-out infinite;
	}
	@keyframes aop-nvg {
		0%,
		100% {
			opacity: 0.75;
		}
		50% {
			opacity: 1;
		}
	}
</style>
