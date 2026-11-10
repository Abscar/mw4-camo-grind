<!--
	The weapon card: opens when you tap a weapon's name (WeaponCard, Continue grinding, Meta top 5).
	Everything about one weapon in one place (2026-11-10, the user's brief): class and season, how it
	unlocks, every step of its grind with its exact challenge, status and counter (StepRow; the 3
	challenges before Gold first, then Gold, Platinum and Harmonic Break), the focus list, its change
	in the latest balance patch with source and date, its Multiplayer meta standing and a way to its
	builds, and your note (saved as you type).
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { BALANCE, BALANCE_PATCH } from '#lib/data/balance.ts';
	import { LOADOUTS } from '#lib/data/loadouts.ts';
	import { META_RANKS } from '#lib/data/metaRanks.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { FOCUS_MAX, NOTE_MAX } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { stepsOf } from '#lib/steps.ts';
	import { shortDate, unlockFact } from '#lib/ui.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import Dialog from './Dialog.svelte';
	import FactText from './FactText.svelte';
	import StepRow from './StepRow.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const id = $props.id();
	const weapon = $derived(weaponSheet.weaponId ? WEAPON_BY_ID.get(weaponSheet.weaponId) : undefined);
	const cls = $derived(weapon ? CLASSES.find((c) => c.id === weapon.classId) : undefined);
	const look = $derived(weapon ? WEAPON_LOOKS[weapon.id] : undefined);
	const balance = $derived(weapon ? BALANCE[weapon.id] : undefined);
	const focused = $derived(weapon ? progress.isFocused(weapon.id) : false);
	const steps = $derived(weapon ? stepsOf(weapon.id) : []);
	const specials = $derived(steps.filter((s) => s.kind === 'special'));
	const ladder = $derived(steps.filter((s) => s.kind === 'ladder'));
	const hasBuilds = $derived(weapon ? weapon.id in LOADOUTS : false);
	const unlock = $derived(weapon ? unlockFact(weapon.unlock) : null);
	/** Its place in the Multiplayer list of its class (metaRanks.ts), if it has one. */
	const meta = $derived.by(() => {
		if (!weapon) return null;
		const list = META_RANKS.mp.classes[weapon.classId];
		const i = list ? list.findIndex((p) => p.id === weapon.id) : -1;
		return list && i >= 0 ? { pick: list[i], rank: i + 1 } : null;
	});

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

	function openBuilds() {
		if (!weapon) return;
		const weaponId = weapon.id;
		weaponSheet.close();
		loadoutView.show(weaponId);
	}
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
				<div class="min-w-0 flex-1">
					<p class="text-[13px] text-fg">
						{t.sheet.classLine(cls?.name ?? '', weapon.season === 'launch' ? t.sheet.seasonLaunch : t.sheet.seasonS1)}
					</p>
					{#if unlock}
						<p class="text-[12.5px]">
							<span class="eyebrow mr-1">{t.sheet.unlock}</span><FactText fact={unlock} />{#if !unlock.verified}<span
									class="block text-[11.5px]">({t.unverified}: {unlock.note ?? t.unverifiedHint})</span
								>{/if}
						</p>
					{/if}
				</div>
				<button
					type="button"
					class="btn {focused ? 'btn-primary' : ''}"
					aria-pressed={focused}
					onclick={toggleFocus}
				>
					<span aria-hidden="true">{focused ? '★' : '☆'}</span>{focused ? t.sheet.focusRemove : t.sheet.focusAdd}
				</button>
			</div>
			{#if full}
				<p class="-mt-2 text-xs text-fg" role="alert">{t.sheet.focusFull(FOCUS_MAX)}</p>
			{/if}

			<!-- every step with its challenge, status and (while you're on it) a counter -->
			<section class="pre-gold rounded-card border border-line bg-panel-2 p-3" aria-labelledby="{id}-pre">
				<h3 id="{id}-pre" class="eyebrow flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
					<span>{specials.length ? t.sheet.preGold : t.sheet.preGoldSoon}</span>
					{#if specials.length && progress.level(weapon.id) === 0}
						<span class="num text-gold-ink">{t.sheet.preGoldCount(progress.specialsDone(weapon.id, specials.length), specials.length)}</span>
					{/if}
				</h3>
				{#if specials.length}
					<div class="mt-2 grid gap-3">
						{#each specials as step (step.key)}<StepRow weaponId={weapon.id} {step} />{/each}
					</div>
					<p class="mt-2 text-[11.5px] leading-snug">{t.sheet.preGoldHint}</p>
				{:else}
					<p class="mt-1 text-fg">{t.sheet.preGoldUnknown}</p>
				{/if}
			</section>

			<section class="rounded-card border border-line bg-panel-2 p-3" aria-labelledby="{id}-camos">
				<h3 id="{id}-camos" class="eyebrow">{t.sheet.camos}</h3>
				<div class="mt-2 grid gap-3">
					{#each ladder as step (step.key)}<StepRow weaponId={weapon.id} {step} />{/each}
				</div>
				{#if weapon.season !== 'launch'}
					<p class="mt-2 text-[11.5px] leading-snug">{t.weapon.s1Divergence}.</p>
				{/if}
			</section>

			<section class="rounded-card border border-line bg-panel-2 p-3" aria-labelledby="{id}-balance">
				<h3 id="{id}-balance" class="eyebrow">{t.sheet.balanceHeading}</h3>
				{#if balance}
					<p class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12.5px]">
						<span class="balance-badge font-head" data-change={balance.change}
							><span aria-hidden="true">{balance.change === 'buff' ? '▲' : '▼'}</span>{balance.change === 'buff'
								? t.weapon.buff
								: t.weapon.nerf}</span
						>
						<span class="text-muted">{t.sheet.balance(balance.change, BALANCE_PATCH.name, shortDate(BALANCE_PATCH.date))}</span>
					</p>
					<p class="mt-1.5 text-fg">{balance.text}</p>
					<p class="mt-1.5 text-[11.5px]">{t.sheet.balanceSource(BALANCE_PATCH.sources)}</p>
				{:else}
					<p class="mt-1">{t.sheet.noBalance(BALANCE_PATCH.name)}</p>
				{/if}
			</section>

			{#if hasBuilds || meta}
				<section class="rounded-card border border-line bg-panel-2 p-3" aria-labelledby="{id}-meta">
					<h3 id="{id}-meta" class="eyebrow">{t.loadout.tag}</h3>
					<p class="mt-1 text-[13px] text-fg">
						{#if meta && cls}
							{t.sheet.metaTier(meta.pick.tier, meta.rank, cls.name, shortDate(META_RANKS.mp.date))}{#if !meta.pick.verified}<span
									class="unverified ml-1">({t.unverified}{meta.pick.note ? `: ${meta.pick.note}` : ''})</span
								>{/if}
						{:else}
							{t.sheet.metaNone}
						{/if}
					</p>
					{#if hasBuilds}
						<button type="button" class="btn mt-2" onclick={openBuilds}>{t.sheet.builds}</button>
					{/if}
				</section>
			{/if}

			<div>
				<label for="{id}-note" class="eyebrow">{t.sheet.note}</label>
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
					<span>{t.sheet.noteSaved}</span><span class="num">{t.sheet.charsLeft(NOTE_MAX - draft.length)}</span>
				</p>
			</div>
		</div>
	{/if}

	{#snippet actions()}
		<button type="button" class="btn btn-primary" onclick={() => weaponSheet.close()}>{t.sheet.close}</button>
	{/snippet}
</Dialog>

<style>
	/* the cartoon gun at the top of the card, a bit bigger than in the list */
	.sheet-gun :global(.weapon-icon) {
		width: 112px;
		height: 42px;
	}
</style>
