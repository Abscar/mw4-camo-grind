<!--
	The meta-class popup: the Multiplayer and Warzone build for one weapon, side by side on wide
	screens and stacked on a phone. Opened by the crosshair button on each weapon (WeaponCard).
-->
<script lang="ts">
	import { LOADOUTS, LOADOUTS_AS_OF, type Loadout, type LoadoutMode } from '#lib/data/loadouts.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import Dialog from './Dialog.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const MODES: LoadoutMode[] = ['mp', 'wz'];

	const weapon = $derived(loadoutView.weaponId ? WEAPON_BY_ID.get(loadoutView.weaponId) : undefined);
	const builds = $derived(weapon ? (LOADOUTS[weapon.id] ?? {}) : {});
	const look = $derived(weapon ? WEAPON_LOOKS[weapon.id] : undefined);

	function extras(l: Loadout): [string, string[]][] {
		const rows: [string, string[] | undefined][] = [
			[t.loadout.perks, l.perks],
			[t.loadout.equipment, l.equipment],
			[t.loadout.streaks, l.streaks]
		];
		return rows.filter((r): r is [string, string[]] => !!r[1]?.length);
	}
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

		<div class="grid gap-3 sm:grid-cols-2">
			{#each MODES as mode (mode)}
				{@const l = builds[mode]}
				<section class="rounded-card border border-line bg-panel-2 p-3" aria-label={t.loadout.modes[mode]}>
					<h3 class="font-head flex flex-wrap items-baseline justify-between gap-x-2 text-[13px] font-bold">
						<span class="tracking-[0.12em] text-fg uppercase">{t.loadout.modes[mode]}</span>
						{#if l}
							{#if l.verified}
								<span class="text-xs text-muted">{l.role}</span>
							{:else}
								<span class="unverified text-xs text-muted" title={t.unverifiedHint}
									>{l.role}<span class="sr-only"> ({t.unverified})</span></span
								>
							{/if}
						{/if}
					</h3>

					{#if l}
						<dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
							{#each l.attachments as a (a.slot)}
								<dt class="text-muted">{a.slot}</dt>
								<dd class="font-semibold break-words text-fg">{a.name}</dd>
							{/each}
						</dl>

						{#if extras(l).length > 0}
							<dl class="mt-2.5 grid gap-1 border-t border-line pt-2.5 text-xs">
								{#each extras(l) as [label, items] (label)}
									<div>
										<dt class="inline font-semibold text-fg">{label}:</dt>
										<dd class="inline">{items.join(', ')}</dd>
									</div>
								{/each}
							</dl>
						{/if}

						{#if l.note}
							<p class="mt-2.5 flex gap-1.5 text-xs text-fg">
								<!-- ⚠ when the build is unconfirmed, ⓘ when it's just a tip -->
								<span class="text-accent" aria-hidden="true">{l.verified ? 'ⓘ' : '⚠'}</span><span>{l.note}</span>
							</p>
						{/if}

						<p class="mt-2.5 text-[11px]">{l.source} · {shortDate(l.date)}</p>
					{:else}
						<p class="mt-2">{t.loadout.none[mode]}</p>
					{/if}
				</section>
			{/each}
		</div>

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
