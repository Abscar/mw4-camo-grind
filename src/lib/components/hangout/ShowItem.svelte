<!--
	One thing on a hideout's display wall (hideout.ts `show`): a Camo Armory gun in its camo, a CS2 skin, a
	BurgiDrip piece on its mannequin, or an arcade plushie. Decoration: the name is written next to it.
-->
<script lang="ts">
	import { CS2_BY_ID, GUN_BY_ID } from '#lib/armory.ts';
	import { camoLook, type GunLook } from '#lib/data/weaponLooks.ts';
	import { ITEM_BY_ID } from '#lib/shop.ts';
	import WeaponIcon from '../WeaponIcon.svelte';
	import DripPic from '../DripPic.svelte';
	import ArcadePrize from '../arcade/ArcadePrize.svelte';

	let { id, size = 64 }: { id: string; size?: number } = $props();
	const gun = $derived(GUN_BY_ID.get(id));
	const skin = $derived(gun ? undefined : CS2_BY_ID.get(id));
	const look = $derived<GunLook | undefined>(gun ? camoLook(gun.gun.w) : skin ? { kind: 'cs2', model: skin.model, skin: skin.art } : undefined);
	const it = $derived(ITEM_BY_ID.get(id));
</script>

<span class="show" style:--s="{size}px" data-kind={look ? 'gun' : it?.drip ? 'drip' : 'plush'}>
	{#if look}
		<WeaponIcon {look} camo={gun ? gun.gun.c : null} />
	{:else if it?.drip}
		<DripPic {id} />
	{:else if it}
		<ArcadePrize {id} size={size * 0.8} />
	{/if}
</span>

<style>
	.show {
		display: grid;
		place-items: center;
		width: var(--s);
		height: var(--s);
	}
	.show :global(svg) {
		max-width: 100%;
		max-height: 100%;
	}
	.show[data-kind='gun'] :global(svg) {
		width: 100%;
		height: auto;
		filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.5));
	}
</style>
