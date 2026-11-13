<script lang="ts">
	import { tickLadder } from '#lib/actions.ts';
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import type { Weapon } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { META_RANKS } from '#lib/data/metaRanks.ts';
	import { BALANCE, BALANCE_PATCH } from '#lib/data/balance.ts';
	import { LOADOUT_CODES } from '#lib/data/loadoutCodes.ts';
	import { codeView } from '#lib/codeView.svelte.ts';
	import { feed } from '#lib/feed.svelte.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import CamoToggle from './CamoToggle.svelte';
	import WeaponCode from './WeaponCode.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	let {
		weapon,
		columns
	}: {
		weapon: Weapon;
		columns: string;
	} = $props();

	const level = $derived(progress.level(weapon.id));
	const maxed = $derived(level >= MAX_LEVEL);
	const look = $derived(WEAPON_LOOKS[weapon.id]);
	const balance = $derived(BALANCE[weapon.id]);
	const note = $derived(progress.note(weapon.id));
	/**
	 * "MP meta" only where there's a clear basis in the right mode: the weapon list is Multiplayer's,
	 * so only guns in the Multiplayer overall top list (metaRanks.ts) that the sites agree on.
	 */
	const metaPick = $derived(META_RANKS.mp.overall.find((p) => p.id === weapon.id && p.verified));
	/** The meta loadout code the META button copies (loadoutCodes.ts); none for launchers / melee. */
	const codeEntry = $derived(LOADOUT_CODES[weapon.id]);
	const hasCode = $derived(!!codeEntry);
	/** The 3 challenges before Gold (ticked in the weapon card): diamonds on the G box while no Gold. */
	const specialsTotal = $derived(weapon.specials.length);
	const pips = $derived(specialsTotal && level === 0 ? progress.specialsDone(weapon.id, specialsTotal) : null);
	const goldReady = $derived(pips !== null && pips === specialsTotal);

	/** Abscar: a shine + smoke puff runs over the row when this tick maxed the weapon. */
	const shine = $derived(feed.lastMaxed?.weaponId === weapon.id ? feed.lastMaxed.id : 0);

	/** A ticked box's label says what unticking it also clears. */
	function extra(i: number): string {
		const parts: string[] = [];
		if (i < LADDER.length - 1 && level > i + 1 && progress.has(weapon.id, i)) {
			parts.push(t.weapon.untickClears(LADDER.slice(i + 1, level).map((c) => c.name).join(t.tickToast.and)));
		}
		if (i === LADDER.length - 1 && weapon.season !== 'launch') parts.push(t.weapon.s1Divergence);
		return parts.join('; ');
	}
</script>

<li
	class="weapon-row relative grid items-center gap-x-1.5 gap-y-1 rounded-[calc(var(--t-radius)-1px)] px-2 py-1 transition-colors hover:bg-panel-2"
	style:grid-template-columns={columns}
>
	<!-- name + cartoon: one button that opens the weapon's card (details); the boxes beside it change
	     progress. Nothing tappable sits inside anything else. The META button (copies the meta loadout
	     code) in its own column on the right, level with the name, so all the buttons in a box line up;
	     with "Show codes" on, the code itself as a small line underneath. -->
	<div class="weapon-main grid min-w-0 items-start gap-x-1 {hasCode ? 'has-code grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)]'}">
	<button
		type="button"
		class="weapon-open block min-w-0 text-left"
		aria-haspopup="dialog"
		onclick={() => weaponSheet.show(weapon.id)}
	>
		<span class="flex min-w-0 items-center gap-1">
			<span class="weapon-name block truncate font-semibold" title={weapon.name}>
				{weapon.name}{#if maxed}<span class="ml-1 text-xs text-hb-ink" title={t.weapon.maxed}
						><span class="maxed-mark" aria-hidden="true">◆</span><span class="sr-only">({t.weapon.maxed})</span></span
					>{/if}
			</span>
			<svg viewBox="0 0 16 16" class="open-chevron size-3.5 flex-none" aria-hidden="true" focusable="false"
				><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg
			>
		</span>
		<span class="weapon-badges flex flex-wrap items-center gap-1">
			{#if look}
				<span class="relative flex-none">
					<WeaponIcon {look} camo={progress.wears(weapon.id)} />
				</span>
			{/if}
			{#if weapon.season === 'season1'}
				<span
					class="font-head flex-none rounded-full border border-current px-1.5 text-[10px] leading-4 font-bold tracking-wider text-new-ink uppercase"
					title={t.weapon.newBadgeLong}>{t.weapon.newBadge}</span
				>
			{/if}
			{#if balance}
				<span
					class="balance-badge font-head flex-none"
					data-change={balance.change}
					title={t.weapon.balanceLong(balance.change, BALANCE_PATCH.name)}
					><span aria-hidden="true">{balance.change === 'buff' ? '▲' : '▼'}</span>{balance.change === 'buff'
						? t.weapon.buff
						: t.weapon.nerf}</span
				>
			{/if}
			{#if metaPick}
				<span class="meta-badge font-head flex-none" title={t.weapon.metaBadgeLong(shortDate(META_RANKS.mp.date), META_RANKS.mp.sources)}
					>{t.weapon.metaBadge}</span
				>
			{/if}
		</span>
		{#if pips !== null && pips > 0}
			<span class="progress-line num block text-[12px] leading-tight">{t.weapon.preGoldLine(pips, specialsTotal)}</span>
		{/if}
		<span class="sr-only"
			> – {t.weapon.openHint}</span
		>
	</button>
	<WeaponCode weaponId={weapon.id} weaponName={weapon.name} />
	{#if codeEntry && codeView.show}
		<p class="row-code col-span-full" title={codeEntry.note}>
			<span class="row-code-tag">{t.codes.tag}</span><span class="row-code-text">{codeEntry.code}</span>
		</p>
	{/if}
	</div>
	{#each LADDER as camo, i (camo.id)}
		<CamoToggle
			{camo}
			pressed={progress.has(weapon.id, i)}
			weaponName={weapon.name}
			ontoggle={() => tickLadder(weapon.id, i)}
			pips={i === 0 ? pips : null}
			ready={i === 0 && goldReady}
			note={extra(i)}
			unsure={i === LADDER.length - 1 && weapon.season !== 'launch'}
		/>
	{/each}

	{#if note}
		<button
			type="button"
			class="weapon-note col-span-full -my-1 flex min-h-11 min-w-0 items-center gap-1.5 rounded-[3px] px-1 py-0.5 text-left text-[12.5px] leading-snug"
			aria-haspopup="dialog"
			onclick={() => weaponSheet.show(weapon.id)}
		>
			<svg viewBox="0 0 16 16" class="size-3 flex-none" aria-hidden="true" focusable="false">
				<path
					d="M10.6 2.2l3.2 3.2-8.3 8.3-3.9.7.7-3.9zM9.4 3.4l3.2 3.2"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="line-clamp-2 min-w-0 break-words"><span class="sr-only">{t.weapon.editNote}: </span>{note}</span>
		</button>
	{/if}

	{#key shine}
		{#if shine}
			<span class="max-shine" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
		{/if}
	{/key}
</li>
