<!--
	A Camo Armory gun (armory.ts; 2026-11-20, the user: skins "till vapen som ens operator kan hålla") in two
	gloved fists: the weapon's own cartoon (WeaponIcon, the plain one for the CS2-skinned guns) painted in
	the camo, with a fist on the grip and one on the handguard. OpGear puts it across the emblem's chest,
	muzzle up. Our own drawing; decorative (the shop and the header say in words what's held).
	A CS2 skin from the armory's last tab (2026-11-22) is held the same way: the CS2 gun wearing that skin.
-->
<script lang="ts">
	import { CS2_BY_ID, GUN_BY_ID } from '#lib/armory.ts';
	import { camoLook, type Cs2Model, type GunLook } from '#lib/data/weaponLooks.ts';
	import WeaponIcon from './WeaponIcon.svelte';

	let { id }: { id: string } = $props();

	const gun = $derived(GUN_BY_ID.get(id));
	const skin = $derived(gun ? undefined : CS2_BY_ID.get(id));
	const look = $derived<GunLook | undefined>(gun ? camoLook(gun.gun.w) : skin ? { kind: 'cs2', model: skin.model, skin: skin.art } : undefined);

	/** Where the fists go on a CS2 gun (Cs2Gun.svelte's 64 × 24 units): trigger hand, then the support hand. */
	const CS2_FISTS: Record<Cs2Model, [number, number][]> = {
		ak47: [
			[23, 17.2],
			[41.2, 12.6]
		],
		m4a4: [
			[23.4, 17.4],
			[41, 11.4]
		],
		m4a1s: [
			[23.4, 17.4],
			[40.4, 11.4]
		],
		awp: [
			[21.4, 17.2],
			[36.4, 11.8]
		],
		deagle: [[17, 16.6]],
		usps: [[17, 16.6]],
		r8: [[19.2, 17]],
		mp7: [
			[24.2, 18],
			[38.7, 17.6]
		],
		xm1014: [
			[21, 17],
			[38.3, 12.2]
		],
		karambit: [[22, 11.8]]
	};

	/** Where the fists go, in WeaponIcon's 64 × 24 units: trigger hand first, then the support hand (if any). */
	const fists = $derived.by((): [number, number][] => {
		if (!look) return [];
		if (look.kind === 'cs2') return CS2_FISTS[look.model];
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

{#if look}
	<span class="held" data-camo={gun ? gun.gun.c : 'cs2'} data-kind={look.kind}>
		<WeaponIcon {look} camo={gun ? gun.gun.c : null} />
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
