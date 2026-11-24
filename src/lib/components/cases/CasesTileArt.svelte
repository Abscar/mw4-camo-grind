<!--
	The Case Battles casino tile's picture: two crates facing off with a "VS" between them. Moves only while
	its tile is picked (`live`). Decoration (the tile writes the name).
-->
<script lang="ts">
	import CaseBox from './CaseBox.svelte';

	let { live = false }: { live?: boolean } = $props();
</script>

<span class="ta cta" class:live aria-hidden="true">
	<span class="a"><CaseBox id="blue-gem" size={46} /></span>
	<span class="b"><CaseBox id="dragon-lore" size={46} /></span>
	<span class="vs font-head">VS</span>
</span>

<style>
	.cta {
		position: relative;
		display: block;
		width: 80px;
		height: 70px;
		max-width: 100%;
	}
	.a,
	.b {
		position: absolute;
		top: 22px;
	}
	.a {
		left: -4px;
		transform: rotate(-8deg);
	}
	.b {
		right: -4px;
		transform: rotate(8deg);
	}
	.vs {
		position: absolute;
		left: 50%;
		top: 4px;
		translate: -50% 0;
		font-size: 17px;
		font-weight: 900;
		font-style: italic;
		color: #ffd23a;
		-webkit-text-stroke: 1px #2a1004;
		text-shadow: 0 0 8px rgb(255 160 40 / 0.9);
	}
	.live .a {
		animation: cta-a 1.6s ease-in-out infinite;
	}
	.live .b {
		animation: cta-b 1.6s ease-in-out infinite;
	}
	.live .vs {
		animation: cta-vs 0.8s ease-in-out infinite alternate;
	}
	@keyframes cta-a {
		50% {
			transform: rotate(-3deg) translate(3px, -2px);
		}
	}
	@keyframes cta-b {
		50% {
			transform: rotate(3deg) translate(-3px, -2px);
		}
	}
	@keyframes cta-vs {
		to {
			scale: 1.15;
		}
	}
	@media (max-width: 559px) {
		.cta {
			width: 64px;
			height: 49px;
		}
		.cta :global(.cb) {
			--s: 36px !important;
		}
		.a,
		.b {
			top: 15px;
		}
		.vs {
			top: 0;
			font-size: 14px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.live .a,
		.live .b,
		.live .vs {
			animation: none;
		}
	}
</style>
