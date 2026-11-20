<!--
	The box every casino machine logo (FortuneLogo, BookLogo, StashLogo, KushLogo, SkeddwoodLogo; 2026-11-20) is
	drawn in: a box with the drawing's proportions holding the logo's layers (its <svg class="lg-layer">s and its
	LogoFig figures, stacked in the order the logo writes them). `tile` = the small copy on the casino's game tile:
	as tall as the other tiles' pictures (49 px, 70 px from 560 px), decoration only (the tile says the name).
	`live = false` stands every animation in it still (the tile until it's picked), so it starts fresh when it
	becomes live and the pause button's script still catches it.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		w,
		h,
		label,
		tile = false,
		live = true,
		children
	}: { w: number; h: number; label: string; tile?: boolean; live?: boolean; children: Snippet } = $props();
</script>

<div class="lg-wrap" class:tile>
	<div
		class="lg-logo"
		class:tile
		class:still={!live}
		role={tile ? undefined : 'img'}
		aria-label={tile ? undefined : label}
		aria-hidden={tile ? 'true' : undefined}
		style:aspect-ratio="{w} / {h}"
		style:--ar={w / h}
	>
		{@render children()}
	</div>
</div>

<style>
	.lg-wrap,
	.lg-logo {
		position: relative;
		width: 100%;
	}
	.lg-logo > :global(.lg-layer) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
	.lg-wrap.tile {
		display: grid;
		place-items: center;
		height: 49px;
	}
	.lg-logo.tile {
		width: min(100%, calc(49px * var(--ar)));
	}
	@media (min-width: 560px) {
		.lg-wrap.tile {
			height: 70px;
		}
		.lg-logo.tile {
			width: min(100%, calc(70px * var(--ar)));
		}
	}
	.lg-logo.still :global(*) {
		animation: none !important;
	}
</style>
