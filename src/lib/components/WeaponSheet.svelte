<!--
	The weapon card: opens when you tap a weapon's name (WeaponCard). Its 3 challenges before Gold
	(Special camos, weapons.ts), pin the weapon to the focus list, write your own note about it (saved
	as you type), see its change in the latest balance patch (data/balance.ts) and the challenges of
	all 3 ladder camos (always all three, whatever is ticked); a shortcut to its meta class.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { BALANCE, BALANCE_PATCH } from '#lib/data/balance.ts';
	import { LOADOUTS } from '#lib/data/loadouts.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { FOCUS_MAX, NOTE_MAX } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { CAMO_FILL, CAMO_INK, ladderChallenges, shortDate } from '#lib/ui.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import Dialog from './Dialog.svelte';
	import FactText from './FactText.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const id = $props.id();
	const weapon = $derived(weaponSheet.weaponId ? WEAPON_BY_ID.get(weaponSheet.weaponId) : undefined);
	const look = $derived(weapon ? WEAPON_LOOKS[weapon.id] : undefined);
	const balance = $derived(weapon ? BALANCE[weapon.id] : undefined);
	const focused = $derived(weapon ? progress.isFocused(weapon.id) : false);
	const level = $derived(weapon ? progress.level(weapon.id) : 0);
	const challenges = $derived(weapon ? ladderChallenges(weapon.classId) : []);
	const hasMeta = $derived(weapon ? weapon.id in LOADOUTS : false);

	/** The text box keeps its own copy while you type; every change is saved straight away. */
	let draft = $state('');
	let full = $state(false);
	$effect(() => {
		if (weaponSheet.open && weapon) {
			const weaponId = weapon.id;
			// untracked: saving a keystroke must not reset the box (the saved note is trimmed)
			draft = untrack(() => progress.note(weaponId));
			full = false;
		}
	});

	function toggleFocus() {
		if (!weapon) return;
		full = progress.toggleFocus(weapon.id) === 'full';
	}

	function openMeta() {
		if (!weapon) return;
		const weaponId = weapon.id;
		weaponSheet.close();
		loadoutView.show(weaponId);
	}

	const btn = 'font-head min-h-11 rounded-full border px-4 text-[13px] font-semibold transition-colors';
</script>

<Dialog
	bind:open={
		() => weaponSheet.open,
		(v) => {
			if (!v) weaponSheet.close();
		}
	}
	title={weapon?.name ?? ''}
>
	{#if weapon}
		<div class="weapon-sheet grid gap-4">
			<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
				{#if look}<span class="sheet-gun"><WeaponIcon {look} /></span>{/if}
				<button
					type="button"
					class="{btn} inline-flex items-center gap-1.5 {focused
						? 'border-accent bg-accent text-on-accent'
						: 'border-line bg-panel-2 text-fg hover:border-accent'}"
					aria-pressed={focused}
					onclick={toggleFocus}
				>
					<span aria-hidden="true">{focused ? '★' : '☆'}</span>{focused ? t.sheet.focusRemove : t.sheet.focusAdd}
				</button>
			</div>
			{#if full}
				<p class="-mt-2 text-xs text-fg" role="alert">{t.sheet.focusFull(FOCUS_MAX)}</p>
			{/if}

			<!-- the 3 Special camos: what you have to do on this gun before Gold opens -->
			<section class="pre-gold rounded-card border border-line bg-panel-2 p-3" aria-labelledby="{id}-pre">
				<h3
					id="{id}-pre"
					class="font-head flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-bold tracking-[0.12em] text-muted uppercase"
				>
					<span>{weapon.specials.length ? t.sheet.preGold : t.sheet.preGoldSoon}</span>
					{#if level >= 1 && weapon.specials.length}
						<span class="pre-gold-done text-gold-ink" title={t.sheet.preGoldDoneLong}
							><span aria-hidden="true">✔ </span>{t.sheet.preGoldDone}<span class="sr-only"
								>: {t.sheet.preGoldDoneLong}</span
							></span
						>
					{/if}
				</h3>
				{#if weapon.specials.length}
					<ul class="mt-1.5 grid gap-1.5">
						{#each weapon.specials as special (special.name)}
							<li class="flex gap-2 text-fg">
								<span class="pre-gold-dot mt-[0.45em] size-2 flex-none rotate-45 rounded-[1px]" aria-hidden="true"></span>
								<span class="min-w-0"><b class="font-semibold">{special.name}:</b> <FactText fact={special.challenge} /></span>
							</li>
						{/each}
					</ul>
					<p class="mt-2 text-[11px] leading-snug">{t.sheet.preGoldHint}</p>
				{:else}
					<p class="mt-1 text-fg">{t.sheet.preGoldUnknown}</p>
				{/if}
			</section>

			<!-- Gold, Platinum and Harmonic Break with their challenges: always all three (the user's ask),
			     a ticked one only gets a small "✔ Done" -->
			<section class="rounded-card border border-line bg-panel-2 p-3" aria-labelledby="{id}-camos">
				<h3 id="{id}-camos" class="font-head text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
					{t.sheet.camos}
				</h3>
				<ul class="mt-1.5 grid gap-1.5">
					{#each challenges as { camo, fact }, i (camo.id)}
						<li class="flex items-start gap-2 text-fg">
							<span
								class="camo-dot mt-[0.45em] size-2 flex-none rotate-45 rounded-[1px]"
								style:--c={CAMO_FILL[camo.id]}
								aria-hidden="true"
							></span>
							<span class="min-w-0 flex-1"
								><b class="font-semibold {CAMO_INK[camo.id]}">{camo.name}:</b> <FactText {fact} /></span
							>
							{#if level > i}
								<span class="flex-none text-[11px] leading-[1.6] font-bold whitespace-nowrap {CAMO_INK[camo.id]}"
									><span aria-hidden="true">✔ </span>{t.sheet.camoDone}</span
								>
							{/if}
						</li>
					{/each}
				</ul>
			</section>

			<section class="rounded-card border border-line bg-panel-2 p-3">
				{#if balance}
					<h3
						class="font-head flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase"
					>
						<span class="balance-badge" data-change={balance.change}
							><span aria-hidden="true">{balance.change === 'buff' ? '▲' : '▼'}</span>{balance.change ===
							'buff'
								? t.weapon.buff
								: t.weapon.nerf}</span
						>
						<span class="text-muted">{t.sheet.balance(balance.change, BALANCE_PATCH.name, shortDate(BALANCE_PATCH.date))}</span>
					</h3>
					<p class="mt-1.5 text-fg">{balance.text}</p>
					<p class="mt-1.5 text-[11px]">{t.sheet.balanceSource(BALANCE_PATCH.sources)}</p>
				{:else}
					<p>{t.sheet.noBalance(BALANCE_PATCH.name)}</p>
				{/if}
			</section>

			<div>
				<label for="{id}-note" class="font-head text-[11px] font-bold tracking-[0.12em] text-muted uppercase"
					>{t.sheet.note}</label
				>
				<textarea
					id="{id}-note"
					rows="3"
					maxlength={NOTE_MAX}
					placeholder={t.sheet.notePlaceholder}
					class="mt-1 block w-full resize-y rounded-lg border border-line bg-panel-2 px-3 py-2 text-base text-fg outline-none placeholder:text-muted focus:border-accent"
					bind:value={draft}
					oninput={(e) => progress.setNote(weapon.id, e.currentTarget.value)}
				></textarea>
				<p class="mt-1 flex justify-between gap-3 text-[11px]">
					<span>{t.sheet.noteSaved}</span><span class="tabular-nums">{t.sheet.charsLeft(NOTE_MAX - draft.length)}</span>
				</p>
			</div>
		</div>
	{/if}

	{#snippet actions()}
		{#if hasMeta}
			<button type="button" class="{btn} border-line bg-panel-2 text-fg hover:border-accent" onclick={openMeta}
				>{t.sheet.meta}</button
			>
		{/if}
		<button type="button" class="{btn} border-accent bg-accent text-on-accent" onclick={() => weaponSheet.close()}
			>{t.sheet.close}</button
		>
	{/snippet}
</Dialog>

<style>
	/* a little gold diamond in front of each pre-Gold challenge */
	.pre-gold-dot {
		background: var(--t-gold);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--t-gold) 55%, black);
	}

	/* the same diamond in each ladder camo's own colour */
	.camo-dot {
		background: var(--c);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 55%, black);
	}

	/* the cartoon gun at the top of the card, a bit bigger than in the list */
	.sheet-gun :global(.weapon-icon) {
		width: 112px;
		height: 42px;
	}
</style>
