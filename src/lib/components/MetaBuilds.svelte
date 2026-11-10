<!--
	One weapon's meta builds, Multiplayer and Warzone (data/loadouts.ts): attachments, role, a note
	where the sites disagree, source and date. Used in the meta popup (LoadoutDialog, from the Meta
	lists) and inside the weapon card under the camo challenges (2026-11-10, the user's ask).
-->
<script lang="ts">
	import { LOADOUTS, type LoadoutMode } from '#lib/data/loadouts.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let { weaponId, columns = true }: { weaponId: string; columns?: boolean } = $props();

	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const builds = $derived(LOADOUTS[weaponId] ?? {});
</script>

<div class="grid gap-3 {columns ? 'sm:grid-cols-2' : ''}">
	{#each MODES as mode (mode)}
		{@const l = builds[mode]}
		<section class="rounded-card border border-line bg-panel-2 p-3" aria-label={t.loadout.modes[mode]}>
			<h4 class="font-head flex flex-wrap items-baseline justify-between gap-x-2 text-[13px] font-bold">
				<span class="tracking-[0.12em] text-fg uppercase">{t.loadout.modes[mode]}</span>
				{#if l}
					{#if l.verified}
						<span class="text-xs text-muted">{l.role}</span>
					{:else}
						<span class="unverified text-xs text-muted" title={t.unverifiedHint}>{l.role}<span class="sr-only"> ({t.unverified})</span></span>
					{/if}
				{/if}
			</h4>

			{#if l}
				<dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[13px]">
					{#each l.attachments as a (a.slot)}
						<dt class="text-muted">{a.slot}</dt>
						<dd class="font-semibold break-words text-fg">{a.name}</dd>
					{/each}
				</dl>
				{#if l.note}
					<p class="mt-2.5 flex gap-1.5 text-xs text-fg">
						<!-- ⚠ when the build is unconfirmed, ⓘ when it's just a tip -->
						<span class="text-accent" aria-hidden="true">{l.verified ? 'ⓘ' : '⚠'}</span><span>{l.note}</span>
					</p>
				{/if}
				<p class="mt-2.5 text-[11px] text-muted">{l.source} · {shortDate(l.date)}</p>
			{:else}
				<p class="mt-2 text-[13px] text-muted">{t.loadout.none[mode]}</p>
			{/if}
		</section>
	{/each}
</div>
