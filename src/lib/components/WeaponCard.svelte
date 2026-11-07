<script lang="ts">
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import type { Weapon } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { LOADOUTS } from '#lib/data/loadouts.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import CamoToggle from './CamoToggle.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	let { weapon, columns }: { weapon: Weapon; columns: string } = $props();

	const maxed = $derived(progress.level(weapon.id) >= MAX_LEVEL);
	const look = $derived(WEAPON_LOOKS[weapon.id]);
	const hasMetaClass = $derived(weapon.id in LOADOUTS);
	const metaLabel = $derived(t.loadout.open(weapon.name));
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
		{#if look || hasMetaClass}
			<div class="flex items-center gap-1.5">
				{#if look}<WeaponIcon {look} />{/if}
				{#if hasMetaClass}
					<!-- 28 px to look at, 44 px to tap (the ::before extends the hit area) -->
					<button
						type="button"
						class="meta-class-btn relative grid size-7 flex-none place-items-center rounded-full border border-tick-line bg-tick text-accent transition-colors before:absolute before:-inset-2 hover:border-accent"
						aria-label={metaLabel}
						aria-haspopup="dialog"
						title={metaLabel}
						onclick={() => loadoutView.show(weapon.id)}
					>
						<svg viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true" focusable="false">
							<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
								<circle cx="12" cy="12" r="6.5" />
								<path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
							</g>
							<circle cx="12" cy="12" r="1.6" fill="currentColor" />
						</svg>
					</button>
				{/if}
			</div>
		{/if}
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
