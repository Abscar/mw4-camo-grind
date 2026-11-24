<!--
	A case's box (cases.ts): our own drawing of a weapon crate in the case's two colours, metal corners, a
	latch and the case's top item drawn on its lid. Decoration (the case's name is written under it).
-->
<script lang="ts">
	import { CASE_BY_ID } from '#lib/cases.ts';
	import CaseItemArt from './CaseItemArt.svelte';

	let { id, size = 120, open = false }: { id: string; size?: number; open?: boolean } = $props();
	const c = $derived(CASE_BY_ID.get(id));
</script>

{#if c}
	<span class="cb" class:open style:--c1={c.colour} style:--c2={c.colour2} style:--s="{size}px" aria-hidden="true">
		<span class="lid"></span>
		<span class="body">
			<span class="band"></span>
			<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>
			<span class="latch"></span>
		</span>
		<span class="cover"><CaseItemArt ref={c.cover} grade={c.items[0].grade} /></span>
	</span>
{/if}

<style>
	.cb {
		position: relative;
		display: block;
		width: var(--s);
		height: calc(var(--s) * 0.78);
		filter: drop-shadow(0 6px 8px rgb(0 0 0 / 0.5));
	}
	.lid,
	.body {
		position: absolute;
		left: 4%;
		right: 4%;
		border: 2px solid #0b0b0f;
		background:
			repeating-linear-gradient(135deg, rgb(255 255 255 / 0.07) 0 6px, transparent 6px 14px),
			linear-gradient(180deg, color-mix(in srgb, var(--c1) 85%, white), var(--c1) 45%, var(--c2));
	}
	.lid {
		top: 6%;
		height: 30%;
		border-radius: 10px 10px 4px 4px;
		transform-origin: 50% 100%;
		transition: transform 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
		z-index: 1;
	}
	.open .lid {
		transform: translateY(-14%) rotateX(35deg);
	}
	.body {
		top: 34%;
		bottom: 2%;
		border-radius: 4px 4px 10px 10px;
	}
	.band {
		position: absolute;
		left: 0;
		right: 0;
		top: 34%;
		height: 18%;
		background: linear-gradient(90deg, #0b0b0f 0 6%, var(--c2) 6% 94%, #0b0b0f 94%);
		opacity: 0.8;
	}
	.corner {
		position: absolute;
		width: 14%;
		height: 22%;
		background: linear-gradient(135deg, #e9edf2, #7b848d);
		border: 1.5px solid #0b0b0f;
	}
	.tl {
		top: -2px;
		left: -2px;
		border-radius: 0 0 6px 0;
	}
	.tr {
		top: -2px;
		right: -2px;
		border-radius: 0 0 0 6px;
	}
	.bl {
		bottom: -2px;
		left: -2px;
		border-radius: 0 6px 0 8px;
	}
	.br {
		bottom: -2px;
		right: -2px;
		border-radius: 6px 0 8px 0;
	}
	.latch {
		position: absolute;
		left: 44%;
		width: 12%;
		top: -6%;
		height: 26%;
		border-radius: 3px;
		background: linear-gradient(180deg, #ffe680, #b8860b);
		border: 1.5px solid #0b0b0f;
	}
	.cover {
		position: absolute;
		left: 12%;
		right: 12%;
		top: 0;
		height: 46%;
		z-index: 2;
		transition: transform 0.35s ease;
	}
	.open .cover {
		transform: translateY(-18%) scale(1.08);
	}
</style>
