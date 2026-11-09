<script lang="ts">
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import type { Weapon } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { LOADOUTS } from '#lib/data/loadouts.ts';
	import { BALANCE, BALANCE_PATCH } from '#lib/data/balance.ts';
	import { feed } from '#lib/feed.svelte.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import { nextChallenge } from '#lib/ui.ts';
	import CamoToggle from './CamoToggle.svelte';
	import FactText from './FactText.svelte';
	import SpecialTick from './SpecialTick.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	let {
		weapon,
		columns,
		classId,
		showNext = false
	}: {
		weapon: Weapon;
		columns: string;
		classId: string;
		/** The focus list shows the next camo's challenge under each weapon. */
		showNext?: boolean;
	} = $props();

	const level = $derived(progress.level(weapon.id));
	const maxed = $derived(level >= MAX_LEVEL);
	const look = $derived(WEAPON_LOOKS[weapon.id]);
	const hasMetaClass = $derived(weapon.id in LOADOUTS);
	const metaLabel = $derived(t.loadout.open(weapon.name));
	const balance = $derived(BALANCE[weapon.id]);
	const focused = $derived(progress.isFocused(weapon.id));
	const note = $derived(progress.note(weapon.id));
	const next = $derived(showNext ? nextChallenge(classId, level) : null);
	/** The 3 challenges before Gold: how many are ticked (only while the weapon has no Gold). */
	const specialsTotal = $derived(weapon.specials.length);
	const pips = $derived(specialsTotal && level === 0 ? progress.specialsDone(weapon.id, specialsTotal) : null);
	const goldReady = $derived(pips !== null && pips === specialsTotal);
	/** Focus list: before Gold, the next unticked challenge comes first. */
	const nextSpecial = $derived(
		showNext && level === 0 ? weapon.specials.find((_, i) => !progress.special(weapon.id, i)) : undefined
	);

	/** Abscar: a shine + smoke puff runs over the row when this tick maxed the weapon. */
	const shine = $derived(feed.lastMaxed?.weaponId === weapon.id ? feed.lastMaxed.id : 0);
</script>

<li
	class="weapon-row relative grid items-center gap-x-1.5 gap-y-1 rounded-[calc(var(--t-radius)-1px)] px-2 py-1 transition-colors hover:bg-panel-2"
	style:grid-template-columns={columns}
>
	<!-- name + cartoon on the left (one button that opens the weapon's card); the meta button in its
	     own column on the right, level with the name, so all the buttons in a box line up -->
	<div
		class="grid min-w-0 items-start gap-x-1 {hasMetaClass
			? 'grid-cols-[minmax(0,1fr)_auto]'
			: 'grid-cols-[minmax(0,1fr)]'}"
	>
		<button
			type="button"
			class="weapon-open block min-w-0 text-left"
			aria-haspopup="dialog"
			onclick={() => weaponSheet.show(weapon.id)}
		>
			<span class="flex min-w-0">
				<span class="weapon-name block truncate font-semibold" title={weapon.name}>
					{weapon.name}{#if maxed}<span class="ml-1 text-xs text-hb-ink" title={t.weapon.maxed}
							><span class="maxed-mark" aria-hidden="true">◆</span><span class="sr-only">({t.weapon.maxed})</span></span
						>{/if}
				</span>
			</span>
			<span class="flex items-center gap-1">
				{#if look}
					<span class="relative flex-none">
						<WeaponIcon {look} />
						{#if focused}<span class="focus-pin" aria-hidden="true">★</span>{/if}
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
			</span>
			<span class="sr-only"
				>{#if focused}({t.weapon.focused}){/if} – {t.weapon.openHint}</span
			>
		</button>
		{#if hasMetaClass}
			<!-- a ≥44 px tap target holding a small "META" sign and a 28 px circle. Wide screens: sign to
			     the left of the circle, pulled up so both sit level with the name. Phones (no room for
			     that next to the long names): the sign sits on top, level with the name, circle below. -->
			<button
				type="button"
				class="meta-class-btn group flex min-h-11 min-w-11 flex-none flex-col items-center justify-start gap-0.5 rounded-full sm:-mt-[11px] sm:h-11 sm:flex-row sm:items-center sm:gap-1 sm:pr-2"
				aria-label={metaLabel}
				aria-haspopup="dialog"
				title={metaLabel}
				onclick={() => loadoutView.show(weapon.id)}
			>
				<span
					class="meta-tag font-head rounded-[3px] border border-tick-line bg-tick px-1 text-[9.5px] leading-[15px] font-bold tracking-[0.08em] text-accent uppercase"
					aria-hidden="true">{t.loadout.tag}</span
				>
				<span
					class="grid size-7 place-items-center rounded-full border border-tick-line bg-tick text-accent transition-colors group-hover:border-accent"
				>
					<svg viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true" focusable="false">
						<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
							<circle cx="12" cy="12" r="6.5" />
							<path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
						</g>
						<circle cx="12" cy="12" r="1.6" fill="currentColor" />
					</svg>
				</span>
			</button>
		{/if}
	</div>
	{#each LADDER as camo, i (camo.id)}
		<CamoToggle
			{camo}
			pressed={progress.has(weapon.id, i)}
			weaponName={weapon.name}
			ontoggle={() => progress.toggle(weapon.id, i)}
			pips={i === 0 ? pips : null}
			ready={i === 0 && goldReady}
		/>
	{/each}

	<!-- the 3 challenges before Gold as tick chips, only while the weapon has no Gold. Waits for
	     progress.ready: the prerendered page has no saved data, so it must not draw them yet. -->
	{#if progress.ready && pips !== null}
		<div class="col-span-full -mt-0.5 flex flex-wrap items-center gap-1 pb-1 pl-0.5" role="group" aria-label="{t.weapon.preGoldShort}: {weapon.name}">
			<span class="font-head mr-0.5 w-full text-[9.5px] font-bold tracking-[0.12em] text-muted uppercase sm:w-auto" aria-hidden="true"
				>{t.weapon.preGoldShort}</span
			>
			{#each weapon.specials as special, i (special.name)}
				<SpecialTick
					weaponId={weapon.id}
					weaponName={weapon.name}
					index={i}
					total={specialsTotal}
					name={special.name}
					challenge={special.challenge}
					chip
				/>
			{/each}
		</div>
	{/if}

	{#if showNext}
		<p class="col-span-full -mt-0.5 pl-0.5 text-[12.5px] leading-snug text-muted">
			{#if nextSpecial}
				<b class="font-head mr-1 text-[10.5px] font-bold tracking-[0.12em] uppercase">{t.focus.next}</b><b
					class="font-semibold text-fg">{nextSpecial.name} ({t.weapon.preGoldShort}):</b
				>
				<FactText fact={nextSpecial.challenge} />
			{:else if next}
				<b class="font-head mr-1 text-[10.5px] font-bold tracking-[0.12em] uppercase">{t.focus.next}</b><b
					class="font-semibold text-fg">{next.camo.name}:</b
				>
				<FactText fact={next.fact} />
			{:else}
				<b class="font-semibold text-fg">{t.focus.maxed}</b>
			{/if}
		</p>
	{/if}

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
