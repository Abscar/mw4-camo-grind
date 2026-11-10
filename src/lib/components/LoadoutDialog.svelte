<!--
	The meta-class popup: the Multiplayer and Warzone build for one weapon, side by side on wide
	screens and stacked on a phone. Opened from the Meta lists (MetaSection, ClassMeta); the builds themselves are MetaBuilds.
-->
<script lang="ts">
	import { LOADOUTS_AS_OF } from '#lib/data/loadouts.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import Dialog from './Dialog.svelte';
	import MetaBuilds from './MetaBuilds.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const weapon = $derived(loadoutView.weaponId ? WEAPON_BY_ID.get(loadoutView.weaponId) : undefined);
	const look = $derived(weapon ? WEAPON_LOOKS[weapon.id] : undefined);
</script>

<Dialog
	bind:open={
		() => loadoutView.open,
		(v) => {
			if (!v) loadoutView.close();
		}
	}
	title={weapon ? t.loadout.title(weapon.name) : ''}
	wide
>
	{#if weapon}
		{#if look}<div class="loadout-gun mb-3"><WeaponIcon {look} /></div>{/if}

		<MetaBuilds weaponId={weapon.id} />

		<p class="mt-3 text-xs">{t.loadout.snapshot(shortDate(LOADOUTS_AS_OF))}</p>
	{/if}

	{#snippet actions()}
		<button
			type="button"
			class="font-head min-h-11 rounded-full border border-accent bg-accent px-5 text-[13px] font-semibold text-on-accent"
			onclick={() => loadoutView.close()}>{t.loadout.close}</button
		>
	{/snippet}
</Dialog>

<style>
	/* the cartoon gun at the top of the popup, a bit bigger than in the list */
	.loadout-gun :global(.weapon-icon) {
		width: 112px;
		height: 42px;
	}
</style>
