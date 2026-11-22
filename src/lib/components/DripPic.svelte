<!--
	A BurgiDrip item's picture (dripArt.ts dripCard): the piece on a plain mannequin, or the kicks on their own.
	Decoration: the item's name is always written next to it.
-->
<script lang="ts">
	import { dripCard } from '#lib/dripArt.ts';

	let { id }: { id: string } = $props();
	const uid = $props.id();
	const card = $derived(dripCard(`dp-${uid}`, id));
</script>

{#if card}
	<svg class="drip-pic" viewBox={card.vb} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
		<!-- trusted: built from our own constants -->
		{@html card.markup}
	</svg>
{/if}

<style>
	.drip-pic {
		display: block;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
