<!--
	A Camo Armory gun (armory.ts; 2026-11-20, the user: skins "till vapen som ens operator kan hålla") in two
	gloved fists: the weapon's own cartoon (WeaponIcon, the plain one for the CS2-skinned guns) painted in
	the camo, with a fist on the grip and one on the handguard. OpGear puts it across the emblem's chest,
	muzzle up. Our own drawing; decorative (the shop and the header say in words what's held).
-->
<script lang="ts">
	import { GUN_BY_ID } from '#lib/armory.ts';
	import { camoLook } from '#lib/data/weaponLooks.ts';
	import WeaponIcon from './WeaponIcon.svelte';

	let { id }: { id: string } = $props();

	const gun = $derived(GUN_BY_ID.get(id));
	const look = $derived(gun ? camoLook(gun.gun.w) : undefined);

	/** Where the fists go, in WeaponIcon's 64 × 24 units: trigger hand first, then the support hand (if any). */
	const fists = $derived.by((): [number, number][] => {
		if (!look) return [];
		if (look.kind === 'rifle') {
			const gs = look.bullpup ? 34 : 36;
			const gl = 8 + 4 * look.barrel;
			const gripX = look.bullpup ? 29 : 25;
			return [
				[gripX + 2.2, 17.4],
				[gs + gl * 0.5, 12.8]
			];
		}
		if (look.kind === 'pistol') return look.style === 'revolver' ? [[22.4, 18.6]] : [[24.2, 18.2]];
		if (look.kind === 'launcher') return [
			[24.6, 16.8],
			[39, 12.6]
		];
		return look.style === 'knife' ? [[14, 12.6]] : [[21, 17.6]];
	});
</script>

{#if gun && look}
	<span class="held" data-camo={gun.gun.c} data-kind={look.kind}>
		<WeaponIcon {look} camo={gun.gun.c} />
		<svg class="held-fists" viewBox="0 0 64 24" aria-hidden="true" focusable="false">
			{#each fists as [x, y], i (i)}
				<g transform="translate({x} {y})">
					<rect x="-2.9" y="-2.5" width="5.8" height="5" rx="2" fill="#2e2923" stroke="#100d0a" stroke-width="0.7" />
					<path d="M-1.1 -2.2 V0.6 M0.8 -2.2 V0.6" stroke="#100d0a" stroke-width="0.45" stroke-linecap="round" />
					<path d="M-2.2 -1.7 Q0 -2.4 2.2 -1.7" fill="none" stroke="#6d6458" stroke-width="0.5" stroke-linecap="round" />
				</g>
			{/each}
		</svg>
	</span>
{/if}

<style>
	.held {
		position: relative;
		display: block;
		width: 100%;
	}
	.held :global(.weapon-icon) {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.held-fists {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
	}
</style>
