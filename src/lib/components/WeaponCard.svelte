<script lang="ts">
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import type { Weapon } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import CamoToggle from './CamoToggle.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	let { weapon, columns }: { weapon: Weapon; columns: string } = $props();

	const maxed = $derived(progress.level(weapon.id) >= MAX_LEVEL);
	const look = $derived(WEAPON_LOOKS[weapon.id]);
</script>

<li
	class="grid items-center gap-1.5 rounded-[calc(var(--t-radius)-1px)] px-2 py-1 transition-colors hover:bg-panel-2"
	style:grid-template-columns={columns}
>
	<div class="min-w-0">
		<div class="flex min-w-0 items-center gap-1.5">
			<div class="weapon-name truncate font-semibold" title={weapon.name}>
				{weapon.name}{#if maxed}<span class="ml-1 text-xs text-hb-ink" title={t.weapon.maxed}
						><span class="maxed-mark" aria-hidden="true">◆</span><span class="sr-only">({t.weapon.maxed})</span></span
					>{/if}
			</div>
			{#if weapon.season === 'season1'}
				<span
					class="font-head flex-none rounded-full border border-current px-1.5 text-[10px] leading-4 font-bold tracking-wider text-new-ink uppercase"
					title={t.weapon.newBadgeLong}>{t.weapon.newBadge}</span
				>
			{/if}
		</div>
		{#if look}<WeaponIcon {look} />{/if}
	</div>
	{#each LADDER as camo, i (camo.id)}
		<CamoToggle
			{camo}
			pressed={progress.has(weapon.id, i)}
			weaponName={weapon.name}
			ontoggle={() => progress.toggle(weapon.id, i)}
		/>
	{/each}
</li>
