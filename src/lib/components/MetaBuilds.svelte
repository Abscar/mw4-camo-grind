<!--
	One weapon's meta builds, Multiplayer and Warzone (data/loadouts.ts): attachments, role, a note
	where the sites disagree, source and date. Used in the meta popup (LoadoutDialog, from the Meta
	lists) and inside the weapon card under the camo challenges (2026-11-10, the user's ask).
	Below them the gun's Apex attachment (2026-11-12, the user's ask): what it does, which slots it
	closes, and published builds that use it (data/apex.ts + data/apexBuilds.ts).
-->
<script lang="ts">
	import { APEX } from '#lib/data/apex.ts';
	import { APEX_BUILDS } from '#lib/data/apexBuilds.ts';
	import { LOADOUTS, type Loadout, type LoadoutMode } from '#lib/data/loadouts.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let { weaponId, columns = true }: { weaponId: string; columns?: boolean } = $props();

	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const builds = $derived(LOADOUTS[weaponId] ?? {});
	const apex = $derived(APEX[weaponId]);
	const apexBuilds = $derived(APEX_BUILDS[weaponId] ?? {});
	const apexModes = $derived(MODES.filter((m) => apexBuilds[m]));
</script>

{#snippet role(l: Loadout)}
	{#if l.verified}
		<span class="text-xs text-muted">{l.role}</span>
	{:else}
		<span class="unverified text-xs text-muted" title={t.unverifiedHint}>{l.role}<span class="sr-only"> ({t.unverified})</span></span>
	{/if}
{/snippet}

{#snippet parts(l: Loadout)}
	<dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
		{#each l.attachments as a (a.slot)}
			<dt class="text-muted" class:apex-slot={a.slot === 'Apex'}>{a.slot}</dt>
			<dd class="font-semibold break-words text-fg" class:apex-part={a.slot === 'Apex'}>{a.name}</dd>
		{/each}
	</dl>
	{#if l.note}
		<p class="mt-2.5 flex gap-1.5 text-xs text-fg">
			<!-- ⚠ when the build is unconfirmed, ⓘ when it's just a tip -->
			<span class="text-accent" aria-hidden="true">{l.verified ? 'ⓘ' : '⚠'}</span><span>{l.note}</span>
		</p>
	{/if}
	<p class="mt-2.5 text-[11px] text-muted">{l.source} · {shortDate(l.date)}</p>
{/snippet}

<div class="grid gap-3 {columns ? 'sm:grid-cols-2' : ''}">
	{#each MODES as mode (mode)}
		{@const l = builds[mode]}
		<section class="rounded-card border border-line bg-panel-2 p-3" aria-label={t.loadout.modes[mode]}>
			<h4 class="font-head flex flex-wrap items-baseline justify-between gap-x-2 text-[13px] font-bold">
				<span class="tracking-[0.12em] text-fg uppercase">{t.loadout.modes[mode]}</span>
				{#if l}{@render role(l)}{/if}
			</h4>
			{#if l}
				{@render parts(l)}
			{:else}
				<p class="mt-2 text-[13px] text-muted">{t.loadout.none[mode]}</p>
			{/if}
		</section>
	{/each}
</div>

{#if apex}
	<section class="apex-box mt-3 rounded-card border p-3" aria-label={t.loadout.apex.heading(apex.name)}>
		<h4 class="font-head flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold">
			<span class="apex-tag">{t.loadout.apex.tag}</span>
			<span class="text-fg">{apex.name}</span>
		</h4>
		<p class="mt-1.5 text-[13px] leading-snug text-fg">{apex.effect}</p>
		<p class="mt-1 text-xs text-muted">
			{t.loadout.apex.unlock}{#if apex.blocks.length}{' '}{t.loadout.apex.blocks(apex.blocks.join(', '))}{/if}
		</p>

		{#if apexModes.length}
			<div class="mt-2.5 grid gap-3 {columns && apexModes.length > 1 ? 'sm:grid-cols-2' : ''}">
				{#each apexModes as mode (mode)}
					{@const l = apexBuilds[mode]!}
					<section class="rounded-card border border-line bg-panel-2 p-3" aria-label={t.loadout.apex.build(t.loadout.modes[mode])}>
						<h5 class="font-head flex flex-wrap items-baseline justify-between gap-x-2 text-[13px] font-bold">
							<span class="tracking-[0.12em] text-fg uppercase">{t.loadout.modes[mode]}</span>
							{@render role(l)}
						</h5>
						{@render parts(l)}
					</section>
				{/each}
			</div>
		{:else}
			<p class="mt-2 text-[13px] text-muted">{t.loadout.apex.none}</p>
		{/if}
	</section>
{/if}

<style>
	/* the Apex box: a lilac edge (the colour the Apex slot has had since the attachment tiles) */
	.apex-box {
		--apex: #b9a3f0;
		border-color: color-mix(in srgb, var(--apex) 55%, var(--t-line));
		background: color-mix(in srgb, var(--apex) 7%, var(--t-panel));
	}
	.apex-tag {
		padding: 1px 7px;
		border-radius: 999px;
		background: var(--apex);
		color: #1c1233;
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.apex-slot {
		color: color-mix(in srgb, var(--apex, #b9a3f0) 80%, var(--t-fg));
		font-weight: 700;
	}
	.apex-part {
		color: color-mix(in srgb, var(--apex, #b9a3f0) 45%, var(--t-fg));
	}
</style>
