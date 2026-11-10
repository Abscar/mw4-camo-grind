<!--
	"Meta top 5" (the user's ask, 2026-11-10): the best guns per weapon class right now plus an
	overall top 5, for Multiplayer or Warzone (a switch, remembered on this device). Data: the dated
	snapshot in data/metaRanks.ts. Tapping a gun opens its meta class (the same popup as the
	crosshair button on each weapon, LoadoutDialog).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { LoadoutMode } from '#lib/data/loadouts.ts';
	import { META_RANKS, META_TOP, metaLists, metaName } from '#lib/data/metaRanks.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import WeaponIcon from './WeaponIcon.svelte';

	const STORE_KEY = 'mw4-camo-grind:meta';
	const MODES: LoadoutMode[] = ['mp', 'wz'];

	// Multiplayer in the prerendered page; the saved choice is read after load
	let mode = $state<LoadoutMode>('mp');
	const board = $derived(META_RANKS[mode]);
	const lists = $derived(metaLists(mode));

	onMount(() => {
		try {
			const saved = localStorage.getItem(STORE_KEY);
			if (saved === 'mp' || saved === 'wz') mode = saved;
		} catch {
			// storage blocked: start on Multiplayer every time
		}
	});

	function choose(m: LoadoutMode) {
		mode = m;
		try {
			localStorage.setItem(STORE_KEY, m);
		} catch {
			// not remembered, still switches
		}
	}
</script>

<section
	class="class-card meta-list overflow-hidden rounded-card bg-panel shadow-card"
	style:--c="var(--t-accent)"
	aria-labelledby="meta-heading"
>
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="meta-heading" class="font-head text-base font-bold tracking-wide uppercase">{t.metaList.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.metaList.sub}</span>
		</div>
		<!-- phones: the switch gets its own row, two equal halves -->
		<div class="flex gap-1.5 max-sm:w-full" role="group" aria-label={t.metaList.modeGroup}>
			{#each MODES as m (m)}
				<button
					type="button"
					class="meta-mode font-head min-h-11 rounded-full border px-4 text-[13px] font-semibold max-sm:flex-1"
					aria-pressed={mode === m}
					onclick={() => choose(m)}>{t.loadout.modes[m]}</button
				>
			{/each}
		</div>
	</header>

	<div class="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
		{#each lists as list (list.key)}
			{@const headingId = `meta-${list.key}`}
			<section class="meta-card min-w-0 rounded-card border border-line bg-panel-2 px-2 pt-2.5 pb-2" aria-labelledby={headingId}>
				<h3 id={headingId} class="font-head px-1.5 text-[12px] font-bold tracking-[0.14em] text-fg uppercase">
					{list.className ?? t.metaList.overall}
				</h3>
				<ol class="mt-1 grid">
					{#each list.picks as pick, i (pick.id)}
						{@const name = metaName(pick.id)}
						{@const look = WEAPON_LOOKS[pick.id]}
						<li>
							<button
								type="button"
								class="meta-pick grid min-h-11 w-full grid-cols-[1rem_auto_minmax(0,1fr)_auto] items-center gap-x-2 rounded-[6px] px-1.5 py-1 text-left"
								aria-haspopup="dialog"
								onclick={() => loadoutView.show(pick.id)}
							>
								<span class="meta-rank font-head text-[15px] font-bold tabular-nums" class:first={i === 0} aria-hidden="true"
									>{i + 1}</span
								>
								{#if look}<WeaponIcon {look} />{:else}<span></span>{/if}
								<span class="min-w-0">
									<span class="flex min-w-0">
										<span class="weapon-name block truncate font-semibold" class:unverified={!pick.verified}>{name}</span>
									</span>
									{#if pick.role}<span class="block text-[11.5px] leading-tight text-muted">{pick.role}</span>{/if}
								</span>
								<span class="meta-tier font-head" data-tier={pick.tier} aria-hidden="true">{pick.tier}</span>
								<span class="sr-only"
									>, {t.metaList.tier(pick.tier)}{#if !pick.verified}, {t.unverified}{/if} – {t.metaList.openHint}</span
								>
							</button>
						</li>
					{/each}
				</ol>
				{#each list.picks.filter((x) => !x.verified && x.note) as pick (pick.id)}
					<!-- where the sites disagree, say how (a tooltip alone never shows on a phone) -->
					<p class="mt-1 flex gap-1.5 px-1.5 text-xs text-fg">
						<span class="text-accent" aria-hidden="true">⚠</span><span
							><b class="font-semibold">{metaName(pick.id)}:</b> {pick.note}</span
						>
					</p>
				{/each}
				{#if list.className && list.picks.length < META_TOP}
					<p class="mt-1 px-1.5 text-xs text-muted">{t.metaList.onlyN(list.picks.length)}</p>
				{/if}
			</section>
		{/each}
	</div>

	<p class="border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
		{t.metaList.snapshot(board.sources, shortDate(board.date))}
	</p>
</section>
