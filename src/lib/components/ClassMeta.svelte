<!--
	The picked class's meta top 5, right above its weapons (2026-11-10, the user's ask: "meta for every
	class at the top when I tap them"). Shows when a class button (AR, SMG …) is chosen: Multiplayer and
	Warzone side by side (stacked on phones), from the same snapshot as "Meta top 5" (metaRanks.ts).
	Tapping a gun opens its builds. Launchers and melee have no meta list, so nothing shows for them.
-->
<script lang="ts">
	import type { LoadoutMode } from '#lib/data/loadouts.ts';
	import { META_RANKS, META_TOP, metaName } from '#lib/data/metaRanks.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { CLASSES } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import WeaponIcon from './WeaponIcon.svelte';

	let { classId }: { classId: string } = $props();

	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const cls = $derived(CLASSES.find((c) => c.id === classId));
	const lists = $derived(
		MODES.map((mode) => ({ mode, picks: (META_RANKS[mode].classes[classId] ?? []).slice(0, META_TOP) })).filter(
			(l) => l.picks.length > 0
		)
	);
</script>

{#if cls && lists.length > 0}
	<section class="class-card meta-list overflow-hidden rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" aria-labelledby="class-meta-heading">
		<header class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-3.5 pb-2.5 sm:px-5">
			<h2 id="class-meta-heading" class="font-head text-base font-bold tracking-wide uppercase">{t.classMeta.heading(cls.name)}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.metaList.sub}</span>
		</header>
		<div class="grid gap-3 border-t border-line px-4 py-3.5 sm:grid-cols-2 sm:px-5">
			{#each lists as list (list.mode)}
				{@const headingId = `class-meta-${list.mode}`}
				<section class="meta-card min-w-0 rounded-card border border-line bg-panel-2 px-2 pt-2.5 pb-2" aria-labelledby={headingId}>
					<h3 id={headingId} class="font-head px-1.5 text-[12px] font-bold tracking-[0.14em] text-fg uppercase">
						{t.loadout.modes[list.mode]}
					</h3>
					<ol class="mt-1 grid">
						{#each list.picks as pick, i (pick.id)}
							{@const look = WEAPON_LOOKS[pick.id]}
							<li>
								<button
									type="button"
									class="meta-pick grid min-h-11 w-full grid-cols-[1rem_auto_minmax(0,1fr)_auto] items-center gap-x-2 rounded-[6px] px-1.5 py-1 text-left"
									aria-haspopup="dialog"
									onclick={() => loadoutView.show(pick.id)}
								>
									<span class="meta-rank font-head text-[15px] font-bold tabular-nums" class:first={i === 0} aria-hidden="true">{i + 1}</span>
									{#if look}<WeaponIcon {look} />{:else}<span></span>{/if}
									<span class="min-w-0">
										<span class="flex min-w-0">
											<span class="weapon-name block truncate font-semibold" class:unverified={!pick.verified}>{metaName(pick.id)}</span>
										</span>
										{#if pick.role}<span class="block text-[11.5px] leading-tight text-muted">{pick.role}</span>{/if}
									</span>
									<span class="meta-tier font-head" data-tier={pick.tier} aria-hidden="true">{pick.tier}</span>
									<span class="sr-only">, {t.metaList.tier(pick.tier)}{#if !pick.verified}, {t.unverified}{/if} – {t.metaList.openHint}</span>
								</button>
							</li>
						{/each}
					</ol>
					{#each list.picks.filter((x) => !x.verified && x.note) as pick (pick.id)}
						<p class="mt-1 flex gap-1.5 px-1.5 text-xs text-fg">
							<span class="text-accent" aria-hidden="true">⚠</span><span><b class="font-semibold">{metaName(pick.id)}:</b> {pick.note}</span>
						</p>
					{/each}
					{#if list.picks.length < META_TOP}
						<p class="mt-1 px-1.5 text-xs text-muted">{t.metaList.onlyN(list.picks.length)}</p>
					{/if}
					<p class="mt-1.5 px-1.5 text-[11px] text-muted">{t.classMeta.snapshot(META_RANKS[list.mode].sources, shortDate(META_RANKS[list.mode].date))}</p>
				</section>
			{/each}
		</div>
	</section>
{/if}
