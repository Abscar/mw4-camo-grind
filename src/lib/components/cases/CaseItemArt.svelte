<!--
	One Case Battles item (cases.ts): a CS2 skin (the Camo Armory's drawings, via WeaponIcon's cs2 look) or an
	MW4 gun in its camo (WeaponIcon's camo paint), on a soft glow in the item's grade colour.
	Decoration: the item's name is always written next to it or in a tooltip.
-->
<script lang="ts">
	import { GRADES, lookOf, type Grade } from '#lib/cases.ts';
	import { camoLook, type GunLook } from '#lib/data/weaponLooks.ts';
	import WeaponIcon from '../WeaponIcon.svelte';

	let { ref, grade, glow = true }: { ref: string; grade: Grade; glow?: boolean } = $props();
	const item = $derived(lookOf(ref));
	const look = $derived<GunLook | undefined>(!item ? undefined : item.kind === 'cs2' ? { kind: 'cs2', model: item.skin.model, skin: item.skin.art } : camoLook(item.weapon));
</script>

<span class="ci" class:glow style:--g={GRADES[grade].colour} aria-hidden="true">
	{#if look}<WeaponIcon {look} camo={item?.kind === 'mw' ? item.camo : null} />{/if}
</span>

<style>
	.ci {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
	}
	.ci.glow::before {
		content: '';
		position: absolute;
		inset: 12% 6%;
		border-radius: 50%;
		background: radial-gradient(closest-side, color-mix(in srgb, var(--g) 55%, transparent), transparent);
		filter: blur(2px);
	}
	.ci :global(.weapon-icon) {
		position: relative;
		width: 92%;
		height: auto;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.55));
	}
</style>
