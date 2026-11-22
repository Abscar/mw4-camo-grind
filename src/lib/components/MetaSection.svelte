<!--
	"Meta top 5" (the user's ask, 2026-11-10): the best guns per weapon class right now plus an
	overall top 5, for Multiplayer or Warzone (a switch, remembered on this device). Data: the dated
	snapshot in data/metaRanks.ts. Tapping a gun opens its meta class (the same popup as the
	crosshair button on each weapon, LoadoutDialog). The switch is shared with "Absolute meta"
	(MetaPodium, right above) through metaMode.svelte.ts.
	Tidied up 2026-11-22 (the user: "snygga till topp 5 metafliken lite, allmänt snyggare"): a header
	with a crosshair mark + the snapshot date, one two-part MP / WZ switch, cards with a count pill,
	gold / silver / bronze for the top three (grind.css, shared with ClassMeta), a faint picture of the
	class's #1 gun in each card's corner, notes as small callouts and a tier key in the footer.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { LoadoutMode } from '#lib/data/loadouts.ts';
	import { META_RANKS, META_TOP, metaLists, metaName } from '#lib/data/metaRanks.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { metaMode } from '#lib/metaMode.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;

	// one switch for both meta boxes (Absolute meta above shares it), remembered per device
	const mode = $derived(metaMode.mode);
	const board = $derived(META_RANKS[mode]);
	const lists = $derived(metaLists(mode));

	onMount(() => metaMode.load());

	const choose = (m: LoadoutMode) => metaMode.set(m);
</script>

<section
	class="class-card meta-list meta-board overflow-hidden rounded-card bg-panel shadow-card"
	style:--c="var(--t-accent)"
	aria-labelledby="meta-heading"
>
	<header class="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-4 pb-3.5 sm:px-5">
		<div class="flex min-w-0 flex-1 items-center gap-3">
			<span class="mb-mark" aria-hidden="true">
				<svg viewBox="0 0 24 24"
					><circle cx="12" cy="12" r="7.2" /><circle cx="12" cy="12" r="1.6" class="dot" /><path
						d="M12 1.8v5M12 17.2v5M1.8 12h5M17.2 12h5"
					/></svg
				>
			</span>
			<div class="min-w-0">
				<h2 id="meta-heading" class="font-head text-lg leading-tight font-bold tracking-wide uppercase">{t.metaList.heading}</h2>
				<p class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
					<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.metaList.sub}</span>
					<span class="mb-date font-head"><span class="mb-dot" aria-hidden="true"></span>{t.metaList.updated(shortDate(board.date))}</span>
				</p>
			</div>
		</div>
		<!-- Abscar: his operator with a sniper rifle on the shoulder (2026-11-11, one of three around the page) -->
		<div class="abscar-only compact-hide section-op -my-2 flex-none"><AbscarOperator variant="sniper" smoke={0.45} class="size-[68px]" /></div>
		<!-- one two-part switch; phones: its own row, two equal halves -->
		<div class="mb-switch flex max-sm:w-full" role="group" aria-label={t.metaList.modeGroup}>
			{#each MODES as m (m)}
				<button
					type="button"
					class="meta-mode font-head inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold max-sm:flex-1"
					aria-pressed={mode === m}
					onclick={() => choose(m)}
				>
					{#if m === 'mp'}
						<svg viewBox="0 0 16 16" aria-hidden="true"
							><circle cx="8" cy="8" r="4.6" /><path d="M8 1.2v3.4M8 11.4v3.4M1.2 8h3.4M11.4 8h3.4" /></svg
						>
					{:else}
						<svg viewBox="0 0 16 16" aria-hidden="true"
							><path d="M1.6 7.4a6.4 5.6 0 0 1 12.8 0Z" class="fill" /><path d="M1.8 7.6 8 13.6l6.2-6M5.6 7.6 8 13.6l2.4-6" /><rect
								x="6.6"
								y="12.6"
								width="2.8"
								height="2.4"
								rx=".6"
								class="fill"
							/></svg
						>
					{/if}
					{t.loadout.modes[m]}
				</button>
			{/each}
		</div>
	</header>

	<div class="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-2 sm:px-5 xl:grid-cols-4">
		{#each lists as list (list.key)}
			{@const headingId = `meta-${list.key}`}
			{@const total = list.className ? (board.classes[list.key]?.length ?? 0) : 0}
			{@const lead = WEAPON_LOOKS[list.picks[0]?.id ?? '']}
			<section
				class="meta-card mb-card relative flex min-w-0 flex-col rounded-card border border-line bg-panel-2"
				class:mb-overall={!list.className}
				aria-labelledby={headingId}
			>
				<!-- a faint picture of the class's #1 gun in the corner (fills the empty space in short lists) -->
				{#if lead}<div class="mb-ghost" aria-hidden="true"><WeaponIcon look={lead} /></div>{/if}
				<header class="mb-card-head flex items-center gap-2 px-3 pt-2.5 pb-2">
					{#if !list.className}
						<svg class="mb-star" viewBox="0 0 16 16" aria-hidden="true"
							><path d="m8 1.3 2 4.3 4.7.5-3.5 3.2 1 4.6L8 11.5l-4.2 2.4 1-4.6L1.3 6.1 6 5.6Z" /></svg
						>
					{/if}
					<h3 id={headingId} class="font-head min-w-0 flex-1 truncate text-[12.5px] font-bold tracking-[0.14em] text-fg uppercase">
						{list.className ?? t.metaList.overall}
					</h3>
					<span class="mb-count font-head"
						>{list.className ? t.metaList.count(list.picks.length, total, META_TOP) : t.metaList.allClasses}</span
					>
				</header>
				<ol class="mb-rows grid px-1.5 pt-1 pb-1.5">
					{#each list.picks as pick, i (pick.id)}
						{@const name = metaName(pick.id)}
						{@const look = WEAPON_LOOKS[pick.id]}
						<li>
							<button
								type="button"
								class="meta-pick grid min-h-11 w-full grid-cols-[1.5rem_auto_minmax(0,1fr)_auto] items-center gap-x-2 rounded-[7px] px-1.5 py-1 text-left"
								aria-haspopup="dialog"
								onclick={() => loadoutView.show(pick.id)}
							>
								<span class="meta-rank font-head tabular-nums" class:first={i === 0} data-rank={i + 1} aria-hidden="true">{i + 1}</span>
								{#if look}<WeaponIcon {look} />{:else}<span></span>{/if}
								<span class="min-w-0">
									<span class="flex min-w-0">
										<span class="weapon-name block truncate font-semibold" class:unverified={!pick.verified}>{name}</span>
									</span>
									{#if pick.role}<span class="mt-0.5 block text-[11.5px] leading-tight text-muted">{pick.role}</span>{/if}
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
					<p class="mb-note flex gap-1.5 text-xs text-fg">
						<span class="text-accent" aria-hidden="true">⚠</span><span
							><b class="font-semibold">{metaName(pick.id)}:</b> {pick.note}</span
						>
					</p>
				{/each}
			</section>
		{/each}
	</div>

	<footer class="mb-foot flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-line px-4 py-3 sm:px-5">
		<!-- phones: a neat 3 + 2 grid instead of one item left alone on the second line -->
		<ul class="grid grid-cols-3 items-center gap-x-3 gap-y-1.5 sm:flex sm:flex-wrap" aria-label={t.metaList.legendLabel}>
			{#each TIERS as tier (tier)}
				<li class="flex items-center gap-1.5 text-xs text-muted">
					<span class="meta-tier font-head" data-tier={tier} aria-hidden="true">{tier}</span>{t.metaList.legend[tier]}
				</li>
			{/each}
		</ul>
		<p class="min-w-[16rem] flex-1 text-xs text-muted">{t.metaList.snapshot(board.sources, shortDate(board.date))}</p>
	</footer>
</section>

<style>
	/* the crosshair mark next to the heading */
	.mb-mark {
		display: grid;
		flex: none;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		border: 1.5px solid color-mix(in srgb, var(--t-accent) 70%, transparent);
		border-radius: 12px;
		background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--t-accent) 26%, transparent), transparent 72%), var(--t-panel-2);
		box-shadow: 0 0 14px color-mix(in srgb, var(--t-accent) 30%, transparent);
	}
	.mb-mark svg {
		width: 1.6rem;
		height: 1.6rem;
		fill: none;
		stroke: var(--t-accent);
		stroke-width: 1.9;
		stroke-linecap: round;
	}
	.mb-mark .dot {
		fill: var(--t-accent);
		stroke: none;
	}
	/* Abscar phones: his operator already stands in the header, so the mark gives the title the room */
	@media (max-width: 639px) {
		:global([data-theme='blackout']) .mb-mark {
			display: none;
		}
	}

	/* "Updated 12 Nov 2026" */
	.mb-date {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.15rem 0.55rem;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		background: var(--t-panel-2);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--t-fg);
		white-space: nowrap;
	}
	.mb-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--t-ok, #3ecf6a);
		box-shadow: 0 0 6px var(--t-ok, #3ecf6a);
	}

	/* one track, two halves */
	.mb-switch {
		gap: 3px;
		padding: 3px;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		background: var(--t-panel-2);
	}
	.mb-switch .meta-mode {
		border: 0;
		background: transparent;
		color: var(--t-muted);
		transition:
			background-color 0.15s,
			color 0.15s,
			box-shadow 0.15s;
	}
	.mb-switch .meta-mode:hover {
		color: var(--t-fg);
		background: color-mix(in srgb, var(--t-fg) 7%, transparent);
	}
	.mb-switch .meta-mode[aria-pressed='true'] {
		background: var(--t-accent);
		color: var(--t-on-accent);
		box-shadow: 0 2px 10px color-mix(in srgb, var(--t-accent) 40%, transparent);
	}
	.mb-switch svg {
		width: 15px;
		height: 15px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.mb-switch svg .fill {
		fill: currentColor;
		stroke: none;
	}

	/* the cards */
	.mb-card {
		isolation: isolate;
		overflow: hidden;
		transition: border-color 0.15s;
	}
	.mb-card:hover {
		border-color: color-mix(in srgb, var(--t-accent) 45%, var(--t-line));
	}
	.mb-card-head {
		position: relative;
		border-bottom: 1px solid var(--t-line);
	}
	/* a short accent bar under the class name */
	.mb-card-head::after {
		content: '';
		position: absolute;
		left: 0.75rem;
		bottom: -1px;
		width: 1.75rem;
		height: 2px;
		border-radius: 2px;
		background: var(--t-accent);
	}
	.mb-count {
		flex: none;
		padding: 0.12rem 0.5rem;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--t-muted);
		white-space: nowrap;
	}
	/* a one-colour silhouette: light on the dark themes, dark on the light ones */
	.mb-ghost {
		position: absolute;
		right: -18px;
		bottom: -6px;
		z-index: -1;
		opacity: 0.07;
		filter: brightness(0) invert(1);
		transform: rotate(-9deg);
		pointer-events: none;
	}
	:global([data-theme='field']) .mb-ghost,
	:global([data-theme='command']) .mb-ghost {
		opacity: 0.06;
		filter: brightness(0);
	}
	.mb-ghost :global(.weapon-icon) {
		width: 168px;
		height: 63px;
	}

	/* the overall list: a gold edge and star */
	.mb-overall {
		border-color: color-mix(in srgb, var(--t-gold) 60%, var(--t-line));
		background-image: linear-gradient(180deg, color-mix(in srgb, var(--t-gold) 11%, transparent), transparent 46%);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--t-gold) 18%, transparent);
	}
	.mb-overall .mb-card-head::after {
		background: var(--t-gold);
	}
	.mb-star {
		width: 15px;
		height: 15px;
		flex: none;
		fill: var(--t-gold);
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--t-gold) 55%, transparent));
	}

	/* where the sites disagree */
	.mb-note {
		margin: 0.15rem 0.6rem 0.6rem;
		padding: 0.4rem 0.55rem;
		border-left: 2px solid var(--t-accent);
		border-radius: 0 6px 6px 0;
		background: color-mix(in srgb, var(--t-accent) 9%, transparent);
		line-height: 1.35;
	}

	/* Abscar: the gunmetal box keeps its worn look; the cards get a little darker glass + shadows on
	   the text like the class boxes */
	:global([data-theme='blackout']) .mb-card {
		background-color: rgb(6 9 12 / 0.34);
		box-shadow: inset 0 1px 0 rgb(225 235 245 / 0.07);
	}
	:global([data-theme='blackout']) .mb-overall {
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--t-gold) 22%, transparent),
			0 0 18px color-mix(in srgb, var(--t-gold) 14%, transparent);
	}
	:global([data-theme='blackout']) .mb-card h3,
	:global([data-theme='blackout']) .meta-board h2,
	:global([data-theme='blackout']) .mb-note,
	:global([data-theme='blackout']) .mb-foot p {
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
	}
	:global([data-theme='blackout']) .mb-ghost {
		opacity: 0.08;
	}
</style>
