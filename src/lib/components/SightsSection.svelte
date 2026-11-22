<!--
	"Sights" (the user's ask, 2026-11-22: "which sights have the least visual recoil, and which sights are
	best for which weapons, under the top 5 meta, a little tab of its own"). Two lists behind a switch
	(remembered on this device): every sight ranked by how much the picture jumps (our estimate from the
	game's optic stats, data/sights.ts), and per gun the steadiest 1x sight, the steadiest scope and what
	its meta builds use. Tapping a gun opens its meta class (LoadoutDialog), like Meta top 5.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { LOADOUTS } from '#lib/data/loadouts.ts';
	import {
		SIGHT_BY_NAME,
		SIGHT_TIERS,
		SIGHTS_DATE,
		SIGHTS_SOURCE,
		SIGHTS_SOURCE_DATE,
		SNIPERS,
		metaOptics,
		picksFor,
		screenKick,
		screenKickOf,
		zoomOn
	} from '#lib/data/sights.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { CLASSES } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import SightIcon from './SightIcon.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	type Tab = 'kick' | 'guns';
	const TABS: Tab[] = ['kick', 'guns'];
	const STORE_KEY = 'mw4-camo-grind:sights';

	// the ranked list in the prerendered page; the saved choice is read after load
	let tab = $state<Tab>('kick');

	onMount(() => {
		try {
			const saved = localStorage.getItem(STORE_KEY);
			if (saved === 'kick' || saved === 'guns') tab = saved;
		} catch {
			// storage blocked: starts on the ranked list every time
		}
	});

	function choose(next: Tab) {
		tab = next;
		try {
			localStorage.setItem(STORE_KEY, next);
		} catch {
			// not remembered, still switches
		}
	}

	const tiers = SIGHT_TIERS.map((tier) => ({ ...tier, score: screenKickOf(tier.zoom, tier.kick), lead: SIGHT_BY_NAME.get(tier.sights[0])! }));
	const MAX = Math.max(...tiers.map((x) => x.score));

	// the guns with a gunsmith, by class (launchers, the knife and unreleased guns have no sights)
	const classes = CLASSES.map((c) => ({ id: c.id, name: c.name, guns: c.weapons.filter((w) => w.id in LOADOUTS) })).filter((c) => c.guns.length > 0);

	const MODES = ['mp', 'wz'] as const;
</script>

<section class="class-card meta-list sights overflow-hidden rounded-card bg-panel shadow-card" style:--worn-at="-520px -260px" aria-labelledby="sights-heading">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="sights-heading" class="font-head text-base font-bold tracking-wide uppercase">{t.sights.heading}</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.sights.sub}</span>
		</div>
		<!-- phones: the switch gets its own row, two equal halves -->
		<div class="flex gap-1.5 max-sm:w-full" role="group" aria-label={t.sights.tabsLabel}>
			{#each TABS as x (x)}
				<button
					type="button"
					class="meta-mode font-head min-h-11 rounded-full border px-4 text-[13px] font-semibold max-sm:flex-1"
					aria-pressed={tab === x}
					aria-controls="sights-panel"
					onclick={() => choose(x)}>{t.sights.tabs[x]}</button
				>
			{/each}
		</div>
	</header>

	<div id="sights-panel" class="border-t border-line px-4 py-4 sm:px-5">
		{#if tab === 'kick'}
			<p class="max-w-3xl text-[13px] text-fg">{t.sights.kickIntro}</p>
			<ol class="mt-3 grid gap-2 lg:grid-cols-2">
				{#each tiers as tier, i (tier.id)}
					<li class="sight-tier meta-card grid min-w-0 grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 rounded-card border border-line bg-panel-2 px-3 py-2.5 sm:grid-cols-[1.25rem_auto_minmax(0,1fr)_auto]">
						<span class="meta-rank font-head pt-0.5 text-[15px] font-bold tabular-nums" class:first={i === 0} aria-hidden="true">{i + 1}</span>
						<span class="pt-0.5 max-sm:hidden"><SightIcon type={tier.lead.type} /></span>
						<div class="min-w-0">
							<h3 class="font-head text-[13px] font-bold tracking-wider text-fg uppercase">{tier.title}</h3>
							<p class="text-[11.5px] leading-snug text-muted">
								{t.sights.zoom(tier.zoom)} · {t.sights.kickLabel(tier.kick)} · {t.sights.recoilLabel(tier.recoil)}
							</p>
							<ul class="mt-1.5 flex flex-wrap gap-1" aria-label={tier.title}>
								{#each tier.sights as name, j (name)}
									<li class="sight-name rounded-[5px] px-1.5 py-0.5 text-[12px] font-semibold" class:lead={j === 0}>{name}</li>
								{/each}
							</ul>
							<p class="mt-1.5 text-xs leading-snug text-fg">{tier.note}</p>
							{#if tier.zoomNote}<p class="mt-1 text-[11.5px] leading-snug text-muted">{tier.zoomNote}</p>{/if}
						</div>
						<div class="flex w-14 flex-col items-end gap-1 pt-0.5">
							<span class="sight-times font-head text-lg leading-none font-bold tabular-nums" aria-hidden="true">{t.sights.times(tier.score)}</span>
							<span class="sight-bar" aria-hidden="true"><i style:width="{(tier.score / MAX) * 100}%"></i></span>
							<span class="sr-only">{t.sights.timesLabel(tier.score)}</span>
						</div>
					</li>
				{/each}
			</ol>
			<div class="mt-4 rounded-card border border-line bg-panel-2 px-3 py-3 sm:px-4">
				<h3 class="font-head text-[12px] font-bold tracking-[0.14em] text-fg uppercase">{t.sights.tipsHeading}</h3>
				<ul class="mt-1.5 grid gap-1.5 text-[13px] text-fg">
					{#each t.sights.tips as tip (tip)}
						<li class="flex gap-2"><span class="text-accent" aria-hidden="true">▸</span><span>{tip}</span></li>
					{/each}
				</ul>
			</div>
			<p class="mt-2 text-xs text-muted">{t.sights.snipersLeftOut}</p>
		{:else}
			<p class="max-w-3xl text-[13px] text-fg">{t.sights.gunsIntro}</p>
			<!-- columns, not a grid: the classes have 2 to 9 guns, so a grid row would leave big empty boxes -->
			<div class="mt-3 gap-3 sm:columns-2 xl:columns-3">
				{#each classes as cls (cls.id)}
					{@const headingId = `sights-${cls.id}`}
					<section class="meta-card mb-3 min-w-0 break-inside-avoid rounded-card border border-line bg-panel-2 px-2 pt-2.5 pb-2" aria-labelledby={headingId}>
						<h3 id={headingId} class="font-head px-1.5 text-[12px] font-bold tracking-[0.14em] text-fg uppercase">{cls.name}</h3>
						<ul class="mt-1 grid">
							{#each cls.guns as gun (gun.id)}
								{@const look = WEAPON_LOOKS[gun.id]}
								{@const picks = picksFor(gun.id)}
								{@const meta = metaOptics(gun.id)}
								{@const sniper = SNIPERS.includes(gun.id)}
								<li>
									<button
										type="button"
										class="meta-pick sight-gun grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 rounded-[6px] px-1.5 py-1.5 text-left"
										aria-haspopup="dialog"
										onclick={() => loadoutView.show(gun.id)}
									>
										<span class="pt-0.5">{#if look}<WeaponIcon {look} />{/if}</span>
										<span class="min-w-0">
											<span class="flex min-w-0"><span class="weapon-name block truncate font-semibold">{gun.name}</span></span>
											{#if sniper}
												<span class="sg-line">{t.sights.sniper}</span>
											{:else}
												{#if picks.close}
													<span class="sg-line"><b>{t.sights.close}</b> {picks.close.name}</span>
												{/if}
												<span class="sg-line">
													<b>{t.sights.range}</b>
													{#if picks.range}
														{picks.range.name} · {t.sights.zoom(zoomOn(picks.range, gun.id))} ·
														<span class="sight-times">{t.sights.times(screenKick(picks.range, gun.id))}</span>
													{:else}
														<span class="text-muted">{t.sights.noScope}</span>
													{/if}
												</span>
											{/if}
											<span class="sg-line text-muted">
												<b>{t.sights.meta}</b>
												{#each MODES.filter((m) => m in meta) as m, k (m)}
													{k > 0 ? ' · ' : ''}{t.sights.modeShort[m]}
													{meta[m] ?? (sniper ? t.sights.ownScope : t.sights.noOptic)}
												{/each}
											</span>
										</span>
										<span class="sr-only"> – {t.sights.openHint}</span>
									</button>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</div>

	<p class="border-t border-line px-4 py-3 text-xs text-muted sm:px-5">
		{t.sights.snapshot(SIGHTS_SOURCE, shortDate(SIGHTS_SOURCE_DATE), shortDate(SIGHTS_DATE))}
	</p>
</section>

<style>
	.sight-name {
		border: 1px solid var(--t-line);
		background: var(--t-panel);
		color: var(--t-fg);
	}
	.sight-name.lead {
		border-color: var(--t-accent);
	}
	.sight-times {
		color: var(--t-fg);
	}
	.sight-bar {
		display: block;
		width: 100%;
		height: 5px;
		border-radius: 3px;
		background: var(--t-line);
		overflow: hidden;
	}
	.sight-bar i {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--t-accent);
	}
	.sg-line {
		display: block;
		font-size: 12px;
		line-height: 1.35;
		overflow-wrap: break-word;
	}
	.sg-line b {
		font-weight: 700;
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--t-muted);
		margin-right: 0.15rem;
	}
	.sight-gun :global(.weapon-icon) {
		width: 58px;
		height: 22px;
	}
</style>
