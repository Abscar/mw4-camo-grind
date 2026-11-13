<!--
	The weapon card: opens when you tap a weapon's name (WeaponCard, Continue grinding, Meta top 5).
	Everything about one weapon in one place (2026-11-10, the user's brief): class and season, how it
	unlocks, every step of its grind with its exact challenge, status and counter (StepRow; the 3
	challenges before Gold first, then Gold, Platinum and Harmonic Break), the focus list, its change
	in the latest balance patch with source and date, its Multiplayer meta standing and builds, and
	your note (saved as you type).

	Look (2026-11-11, the user picked draft "B" of three: "tidy up that menu so it matches the rest
	of the page"): a HUD weapon file. Header with the name, cartoon, ★ focus and ×, a progress track
	(one segment per step + "5 of 6 steps done · Next up: …"), then tabs Camos / Meta / Info; only
	the tab's panel scrolls, so the header and tabs stay put. Steps sit on a timeline. Abscar gets the
	red terminal look (scanlines, red edge + glow); the other themes keep their own panel colours.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { BALANCE, BALANCE_PATCH } from '#lib/data/balance.ts';
	import { LADDER } from '#lib/data/camos.ts';
	import { LOADOUTS, LOADOUTS_AS_OF } from '#lib/data/loadouts.ts';
	import { META_RANKS } from '#lib/data/metaRanks.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { FOCUS_MAX, NOTE_MAX } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { stepStatus, stepsOf, type StepInfo, type StepStatus } from '#lib/steps.ts';
	import { CAMO_FILL, shortDate, unlockFact } from '#lib/ui.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import Dialog from './Dialog.svelte';
	import FactText from './FactText.svelte';
	import MetaBuilds from './MetaBuilds.svelte';
	import CamoStep from './CamoStep.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const id = $props.id();
	const weapon = $derived(weaponSheet.weaponId ? WEAPON_BY_ID.get(weaponSheet.weaponId) : undefined);
	const cls = $derived(weapon ? CLASSES.find((c) => c.id === weapon.classId) : undefined);
	const look = $derived(weapon ? WEAPON_LOOKS[weapon.id] : undefined);
	const balance = $derived(weapon ? BALANCE[weapon.id] : undefined);
	const focused = $derived(weapon ? progress.isFocused(weapon.id) : false);
	const steps = $derived(weapon ? stepsOf(weapon.id) : []);
	const specials = $derived(steps.filter((s) => s.kind === 'special'));
	const hasBuilds = $derived(weapon ? weapon.id in LOADOUTS : false);
	const unlock = $derived(weapon ? unlockFact(weapon.unlock) : null);
	const season = $derived(weapon?.season === 'launch' ? t.sheet.seasonLaunch : t.sheet.seasonS1);
	/** Its place in the Multiplayer list of its class (metaRanks.ts), if it has one. */
	const meta = $derived.by(() => {
		if (!weapon) return null;
		const list = META_RANKS.mp.classes[weapon.classId];
		const i = list ? list.findIndex((p) => p.id === weapon.id) : -1;
		return list && i >= 0 ? { pick: list[i], rank: i + 1 } : null;
	});

	/** Every step with its status, for the progress track and the timeline. */
	type Tracked = { s: StepInfo; status: StepStatus; fill: string };
	const level = $derived(weapon ? progress.level(weapon.id) : 0);
	const mask = $derived(weapon ? (progress.specials[weapon.id] ?? 0) : 0);
	const track = $derived<Tracked[]>(
		weapon
			? steps.map((s) => ({
					s,
					status: stepStatus(weapon.id, s, level, mask),
					fill: s.kind === 'ladder' ? CAMO_FILL[LADDER[s.index].id] : 'var(--t-accent)'
				}))
			: []
	);
	const doneCount = $derived(track.filter((x) => x.status === 'done').length);
	const nextStep = $derived(track.find((x) => x.status === 'active')?.s);
	const LADDER_SHORT = [t.sheet.trackShort.g, t.sheet.trackShort.p, t.sheet.trackShort.hb];

	/** The text box keeps its own copy while you type; every change is saved straight away. */
	let draft = $state('');
	let full = $state(false);
	type Tab = 'camos' | 'meta' | 'info';
	const TABS: Tab[] = ['camos', 'meta', 'info'];
	let tab = $state<Tab>('camos');
	$effect(() => {
		if (weaponSheet.open && weapon) {
			const weaponId = weapon.id;
			// untracked: saving a keystroke must not reset the box (the saved note is trimmed)
			draft = untrack(() => progress.note(weaponId));
			full = false;
			tab = 'camos';
		}
	});

	function toggleFocus() {
		if (!weapon) return;
		full = progress.toggleFocus(weapon.id) === 'full';
	}

	/** Arrow keys, Home and End move between the tabs (the usual tablist keyboard pattern). */
	function tabKeys(e: KeyboardEvent) {
		const i = TABS.indexOf(tab);
		const next =
			e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null;
		if (next === null) return;
		e.preventDefault();
		tab = TABS[(next + TABS.length) % TABS.length];
		document.getElementById(`${id}-tab-${tab}`)?.focus();
	}
</script>

{#snippet stepList(list: Tracked[])}
	{#if weapon}
		<ol class="wc-steps">
			{#each list as x (x.s.key)}<li data-status={x.status}><CamoStep weaponId={weapon.id} step={x.s} status={x.status} /></li>{/each}
		</ol>
	{/if}
{/snippet}

{#snippet card(titleId: string)}
	{#if weapon}
		<header class="wc-head">
			<div class="flex items-start gap-3">
				<div class="min-w-0 flex-1">
					<p class="wc-kicker"><span aria-hidden="true">▸ </span>{t.sheet.file} // {cls?.name} · {season}</p>
					<h2 id={titleId} class="wc-title">{weapon.name}</h2>
				</div>
				{#if look}<div class="wc-gun"><WeaponIcon {look} camo={progress.wears(weapon.id)} /></div>{/if}
				<div class="flex">
					<button
						type="button"
						class="icon-btn wc-star"
						aria-pressed={focused}
						aria-label={focused ? t.sheet.focusRemove : t.sheet.focusAdd}
						title={focused ? t.sheet.focusRemove : t.sheet.focusAdd}
						onclick={toggleFocus}
					>
						<span aria-hidden="true">{focused ? '★' : '☆'}</span>
					</button>
					<button type="button" class="icon-btn wc-x" aria-label={t.sheet.closeCard} title={t.sheet.closeCard} onclick={() => weaponSheet.close()}>
						<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
							><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg
						>
					</button>
				</div>
			</div>
			{#if full}<p class="wc-alert" role="alert">{t.sheet.focusFull(FOCUS_MAX)}</p>{/if}

			<!-- the progress track: one segment per step, labels under it, the same in words next to it -->
			<div class="wc-track">
				<ol class="wc-track-bar" aria-hidden="true">
					{#each track as x (x.s.key)}
						<li
							class="wc-seg"
							data-status={x.status}
							data-gold={x.s.key === 'g' && specials.length ? '' : undefined}
							style:--k={x.fill}
						>
							<i></i><span>{x.s.kind === 'special' ? x.s.index + 1 : LADDER_SHORT[x.s.index]}</span>
						</li>
					{/each}
				</ol>
				<p class="wc-track-text">
					<b class="num">{t.sheet.trackDone(doneCount, track.length)}</b
					>{#if nextStep}{' · '}{t.sheet.trackNext(nextStep.name)}{:else if doneCount === track.length}{' · '}{t.sheet.trackAll}{/if}
				</p>
			</div>

			<div class="wc-tabs" role="tablist" aria-label={t.sheet.tabsLabel}>
				{#each TABS as k (k)}
					<button
						type="button"
						role="tab"
						id="{id}-tab-{k}"
						aria-selected={tab === k}
						aria-controls="{id}-panel"
						tabindex={tab === k ? 0 : -1}
						onclick={() => (tab = k)}
						onkeydown={tabKeys}>{t.sheet.tabs[k]}</button
					>
				{/each}
			</div>
		</header>

		<div class="weapon-sheet wc-panel" role="tabpanel" id="{id}-panel" aria-labelledby="{id}-tab-{tab}">
			{#if tab === 'camos'}
				<section class="pre-gold" aria-labelledby="{id}-pre">
					<h3 id="{id}-pre" class="wc-h">
						<span>{specials.length ? t.sheet.preGold : t.sheet.preGoldSoon}</span>
					</h3>
					{#if specials.length}
						{@render stepList(track.filter((x) => x.s.kind === 'special'))}
						<p class="wc-fine">{t.sheet.preGoldHint}</p>
					{:else}
						<p class="text-fg">{t.sheet.preGoldUnknown}</p>
					{/if}
				</section>
				<section class="mt-5" aria-labelledby="{id}-camos">
					<h3 id="{id}-camos" class="wc-h"><span>{t.sheet.camos}</span></h3>
					{@render stepList(track.filter((x) => x.s.kind === 'ladder'))}
					{#if weapon.season !== 'launch'}<p class="wc-fine">{t.weapon.s1Divergence}.</p>{/if}
				</section>
			{:else if tab === 'meta'}
				<h3 class="wc-h"><span>{t.sheet.metaHeading}</span></h3>
				<p class="wc-meta-line">
					{#if meta && cls}
						{t.sheet.metaTier(meta.pick.tier, meta.rank, cls.name, shortDate(META_RANKS.mp.date))}{#if !meta.pick.verified}<span
								class="unverified ml-1">({t.unverified}{meta.pick.note ? `: ${meta.pick.note}` : ''})</span
							>{/if}
					{:else}
						{t.sheet.metaNone}
					{/if}
				</p>
				{#if hasBuilds}
					<div class="mt-2.5"><MetaBuilds weaponId={weapon.id} /></div>
					<p class="wc-fine">{t.loadout.snapshot(shortDate(LOADOUTS_AS_OF))}</p>
				{/if}
			{:else}
				<section aria-labelledby="{id}-balance">
					<h3 id="{id}-balance" class="wc-h"><span>{t.sheet.balanceHeading}</span></h3>
					<div class="wc-box">
						{#if balance}
							<p class="flex flex-wrap items-center gap-1.5 text-[12.5px]">
								<span class="balance-badge font-head" data-change={balance.change}
									><span aria-hidden="true">{balance.change === 'buff' ? '▲' : '▼'}</span>{balance.change === 'buff'
										? t.weapon.buff
										: t.weapon.nerf}</span
								>
								<span class="text-muted">{t.sheet.balance(balance.change, BALANCE_PATCH.name, shortDate(BALANCE_PATCH.date))}</span>
							</p>
							<p class="mt-1.5 text-[13.5px] text-fg">{balance.text}</p>
							<p class="wc-fine">{t.sheet.balanceSource(BALANCE_PATCH.sources)}</p>
						{:else}
							<p class="text-[13.5px]">{t.sheet.noBalance(BALANCE_PATCH.name)}</p>
						{/if}
					</div>
				</section>
				{#if unlock}
					<section class="mt-5" aria-labelledby="{id}-unlock">
						<h3 id="{id}-unlock" class="wc-h"><span>{t.sheet.unlock}</span></h3>
						<div class="wc-box text-[13.5px] text-fg">
							<FactText fact={unlock} />{#if !unlock.verified}<span class="block text-[11.5px] text-muted"
									>({t.unverified}: {unlock.note ?? t.unverifiedHint})</span
								>{/if}
						</div>
					</section>
				{/if}
				<section class="mt-5">
					<h3 class="wc-h"><label for="{id}-note">{t.sheet.note}</label></h3>
					<textarea
						id="{id}-note"
						rows="3"
						maxlength={NOTE_MAX}
						placeholder={t.sheet.notePlaceholder}
						class="block w-full resize-y rounded-lg border border-line bg-panel-2 px-3 py-2 text-base text-fg outline-none placeholder:text-muted focus:border-accent"
						bind:value={draft}
						oninput={(e) => progress.setNote(weapon.id, e.currentTarget.value)}
					></textarea>
					<p class="mt-1 flex justify-between gap-3 text-[11px]">
						<span>{t.sheet.noteSaved}</span><span class="num">{t.sheet.charsLeft(NOTE_MAX - draft.length)}</span>
					</p>
				</section>
			{/if}
		</div>
	{/if}
{/snippet}

<Dialog
	bind:open={
		() => weaponSheet.open,
		(v) => {
			if (!v) weaponSheet.close();
		}
	}
	title={weapon?.name ?? ''}
	class="wc-dlg"
	custom={card}
/>

<style>
	/* the dialog: fixed height so switching tabs never makes it jump; only the panel scrolls */
	:global(dialog.wc-dlg) {
		margin: auto;
		width: min(34rem, calc(100vw - 1.5rem));
		height: min(48rem, calc(100dvh - 1.5rem));
		max-width: none;
		max-height: none;
		padding: 0;
		overflow: hidden;
		border: 1px solid var(--t-line);
		border-radius: var(--t-radius);
		background: var(--t-panel);
		color: var(--t-fg);
		box-shadow: 0 25px 60px rgb(0 0 0 / 0.5);
	}
	:global(dialog.wc-dlg[open]) {
		display: flex;
		flex-direction: column;
	}
	/* Abscar: a red terminal screen (scanlines, a red glow from the top, red edge) */
	:global([data-theme='blackout'] dialog.wc-dlg) {
		background:
			repeating-linear-gradient(0deg, rgb(255 60 30 / 0.035) 0 1px, transparent 1px 3px),
			radial-gradient(ellipse at 50% 0%, rgb(255 50 16 / 0.16), transparent 60%),
			#0e0807;
		border-color: rgb(255 68 24 / 0.6);
		box-shadow:
			0 0 0 1px #000,
			0 0 34px rgb(255 50 16 / 0.28),
			0 25px 60px rgb(0 0 0 / 0.65);
		--t-line: rgb(255 80 40 / 0.22);
		--t-panel-2: rgb(255 60 30 / 0.06);
		--t-tick: rgb(0 0 0 / 0.5);
		--t-track: rgb(255 255 255 / 0.07);
		--t-muted: #b8a9a4;
	}

	.wc-head {
		flex: none;
		padding: 14px 10px 0 18px;
		border-bottom: 1px solid var(--t-line);
	}
	.wc-kicker {
		font: 600 11px var(--font-hud);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.wc-title {
		margin-top: 2px;
		font: 800 27px/1.05 var(--t-font-head);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--t-fg);
		overflow-wrap: anywhere;
	}
	:global([data-theme='blackout']) .wc-title {
		text-shadow:
			0 0 12px rgb(255 68 24 / 0.55),
			0 2px 0 #000;
	}
	.wc-gun {
		align-self: center;
	}
	.wc-gun :global(.weapon-icon) {
		width: 96px;
		height: 36px;
	}
	/* phones: no room for the cartoon next to the name and the two buttons */
	@media (max-width: 519px) {
		.wc-gun {
			display: none;
		}
	}
	.wc-star {
		font-size: 22px;
		color: var(--t-gold);
	}
	.wc-x {
		color: var(--t-fg);
	}
	.wc-star:hover,
	.wc-x:hover {
		background: color-mix(in srgb, var(--t-fg) 8%, transparent);
	}
	.wc-alert {
		margin-top: 6px;
		font-size: 12px;
		color: var(--t-fg);
	}

	.wc-track {
		padding: 12px 8px 0 0;
	}
	.wc-track-bar {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.wc-seg {
		display: grid;
		justify-items: center;
		gap: 4px;
		font: 700 10.5px var(--t-font-head);
		letter-spacing: 0.08em;
		color: var(--t-muted);
	}
	/* a small gap between the 3 before-Gold steps and the ladder */
	.wc-seg[data-gold] {
		margin-left: 8px;
	}
	.wc-seg i {
		display: block;
		width: 100%;
		height: 9px;
		border: 1px solid color-mix(in srgb, var(--t-fg) 14%, transparent);
		border-radius: 2px;
		background: var(--t-track);
	}
	.wc-seg[data-status='done'] i {
		border-color: var(--k);
		background: var(--k);
		box-shadow: 0 0 calc(var(--t-glow) * 10px) var(--k);
	}
	.wc-seg[data-status='done'] span {
		color: var(--t-fg);
	}
	.wc-seg[data-status='active'] i {
		border-color: var(--k);
		background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--k) 45%, transparent) 0 4px, transparent 4px 8px);
		animation: wc-pulse 1.4s ease-in-out infinite alternate;
	}
	.wc-seg[data-status='active'] span {
		color: var(--k);
	}
	@keyframes wc-pulse {
		to {
			box-shadow: 0 0 10px var(--k);
		}
	}
	.wc-track-text {
		margin-top: 8px;
		font-size: 13px;
		color: var(--t-muted);
	}
	.wc-track-text b {
		color: var(--t-fg);
		font-weight: 600;
	}

	.wc-tabs {
		display: flex;
		margin: 12px 0 0 -18px;
		padding-left: 10px;
	}
	.wc-tabs button {
		flex: 1 1 0;
		min-height: 2.9rem;
		border-bottom: 3px solid transparent;
		font: 700 13px var(--t-font-head);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.wc-tabs button:hover {
		color: var(--t-fg);
	}
	.wc-tabs button[aria-selected='true'] {
		border-bottom-color: var(--t-accent);
		background: linear-gradient(to top, color-mix(in srgb, var(--t-accent) 20%, transparent), transparent);
		color: var(--t-fg);
	}

	.wc-panel {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 16px 18px 22px;
		font-size: 14px;
		color: var(--t-muted);
	}
	.wc-h {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 4px 12px;
		margin-bottom: 10px;
		font: 700 12px var(--font-hud);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.wc-h > :first-child::before {
		content: '▸ ';
	}
	.wc-box {
		padding: 12px;
		border: 1px solid var(--t-line);
		border-radius: var(--t-radius);
		background: var(--t-panel-2);
	}
	.wc-fine {
		margin-top: 8px;
		font-size: 11.5px;
		line-height: 1.4;
	}
	.wc-meta-line {
		font-size: 13.5px;
		color: var(--t-fg);
	}

	/* the timeline: a line from each tick box down to the next one (green once that step is done) */
	.wc-steps {
		display: grid;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.wc-steps > li {
		position: relative;
		padding-bottom: 4px;
	}
	.wc-steps > li:not(:last-child)::before {
		content: '';
		position: absolute;
		left: calc(1.875rem - 1px);
		top: 4rem;
		bottom: -8px;
		width: 2px;
		border-radius: 2px;
		background: var(--t-line);
	}
	.wc-steps > li[data-status='done']:not(:last-child)::before {
		background: color-mix(in srgb, var(--t-ok, #3ee06a) 70%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.wc-seg[data-status='active'] i {
			animation: none;
		}
	}
</style>
