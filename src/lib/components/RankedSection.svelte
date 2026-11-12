<!--
	The Ranked prep tab (2026-11-12, the user's ask: "a Ranked tab you can open with everything: the
	allowed weapons, everything banned, the banned attachments, a list of meta classes for the guns in
	ranked, a bit about ranked in general, all you need to prepare before ranked launches"; then
	"draw small pictures of the tacticals, lethals etc that are allowed, attachments as well").
	Data: data/ranked.ts (dated snapshot, every line with how sure it is). Pictures: GearIcon (our own
	equipment cartoons) and AttachmentIcon (the user's attachment icon sheet).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { LOADOUTS, type Loadout } from '#lib/data/loadouts.ts';
	import {
		BANNED_ATTACHMENTS,
		BANNED_CLASSES,
		BANNED_WEAPONS,
		CDL_RULES,
		CDL_START,
		COMMUNITY_EXTRA,
		GEAR,
		HP_ROTATIONS,
		HP_SOURCES,
		LAST_YEAR,
		LAST_YEAR_RANKS,
		MODES,
		PREP,
		PRO_BUILDS,
		PRO_ORDER,
		RANKED_CHECKED,
		RANKED_STATUS,
		SECONDARY_NOTE,
		SHARED_SETTINGS,
		attachmentBanned,
		type InfoLine,
		type Trust
	} from '#lib/data/ranked.ts';
	import { dayNumber, today } from '#lib/data/season.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { CLASSES, WEAPON_BY_ID, type Weapon } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import AttachmentIcon from './AttachmentIcon.svelte';
	import GearIcon from './GearIcon.svelte';
	import HpMinimap from './HpMinimap.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const S = t.ranked;
	const SECTIONS = ['weapons', 'attachments', 'gear', 'classes', 'maps', 'hp', 'info', 'prep'] as const;

	const CLASS_OF = new Map(CLASSES.flatMap((c) => c.weapons.map((w) => [w.id, c.id] as const)));
	const legal = (w: Weapon) => !BANNED_CLASSES.includes(CLASS_OF.get(w.id) ?? '') && !BANNED_WEAPONS.includes(w.id);
	const allowedClasses = CLASSES.map((c) => ({ cls: c, weapons: c.weapons.filter(legal) })).filter((x) => x.weapons.length);
	const bannedWholeClasses = CLASSES.filter((c) => BANNED_CLASSES.includes(c.id));
	const bannedSingles = BANNED_WEAPONS.map((id) => WEAPON_BY_ID.get(id)).filter((w) => w !== undefined);

	/** Ranked classes: pro builds, then every other legal primary (not pistols, melee) that has an MP build. */
	const PRIMARY_CLASSES = new Set(['assault-rifles', 'smgs', 'sniper-rifles']);
	const proList = PRO_ORDER.map((id) => ({ w: WEAPON_BY_ID.get(id)!, pro: PRO_BUILDS[id] }));
	const restList = CLASSES.flatMap((c) => c.weapons)
		.filter((w) => PRIMARY_CLASSES.has(CLASS_OF.get(w.id) ?? '') && legal(w) && !(w.id in PRO_BUILDS))
		.map((w) => ({ w, build: LOADOUTS[w.id]?.mp }));
	const secondary = WEAPON_BY_ID.get(SECONDARY_NOTE.weapon);

	// the day count is worked out in the browser (the prerendered page doesn't know "today")
	let daysToCdl = $state<number | null>(null);
	onMount(() => {
		daysToCdl = dayNumber(CDL_START) - today(new Date());
	});
</script>

{#snippet trust(k: Trust)}
	<span class="trust" data-trust={k} title={S.trustHint[k]}>{S.trust[k]}<span class="sr-only">: {S.trustHint[k]}</span></span>
{/snippet}

{#snippet lines(list: InfoLine[])}
	<ul class="grid gap-2">
		{#each list as l (l.text)}
			<li class="info-line">
				<p class="text-[13.5px] leading-snug text-fg">{l.text}</p>
				<p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">{@render trust(l.trust)}<span>{l.source}</span></p>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet weaponChip(w: Weapon, banned: boolean)}
	{@const look = WEAPON_LOOKS[w.id]}
	<button
		type="button"
		class="gun-chip"
		class:banned
		aria-haspopup="dialog"
		onclick={() => weaponSheet.show(w.id)}
	>
		{#if look}<span class="gun-art"><WeaponIcon {look} /></span>{/if}
		<span class="weapon-name truncate font-semibold">{w.name}</span>
		<span class="sr-only">{banned ? `, ${S.bannedTag}` : ''} – {S.classes.openCard}</span>
	</button>
{/snippet}

{#snippet buildCard(w: Weapon, l: Loadout | undefined, tag: string, pros?: string[])}
	{@const look = WEAPON_LOOKS[w.id]}
	<article class="build-card" aria-labelledby="rb-{w.id}">
		<header class="flex items-center gap-2.5">
			{#if look}<span class="gun-art"><WeaponIcon {look} /></span>{/if}
			<div class="min-w-0 flex-1">
				<h4 id="rb-{w.id}" class="flex min-w-0">
					<button type="button" class="name-btn min-w-0" aria-haspopup="dialog" onclick={() => weaponSheet.show(w.id)}
						><span class="weapon-name block truncate font-semibold">{w.name}</span><span class="sr-only"> – {S.classes.openCard}</span></button
					>
				</h4>
				<p class="build-tag font-head">{tag}</p>
			</div>
		</header>
		{#if l}
			<ul class="mt-2.5 grid gap-1.5">
				{#each l.attachments as a (a.slot)}
					{@const bad = attachmentBanned(a)}
					<li class="att-row" class:bad>
						<AttachmentIcon slot={a.slot} />
						<span class="min-w-0">
							<span class="block text-[10.5px] tracking-[0.12em] text-muted uppercase">{a.slot}</span>
							<span class="block text-[13px] leading-tight font-semibold break-words text-fg">{a.name}</span>
							{#if bad}<span class="bad-note">⛔ {S.classes.bannedPart}</span>{/if}
						</span>
					</li>
				{/each}
			</ul>
			{#if l.note}
				<p class="mt-2.5 flex gap-1.5 text-xs text-fg"><span class="text-accent" aria-hidden="true">ⓘ</span><span>{l.note}</span></p>
			{/if}
			{#if pros?.length}<p class="mt-1.5 text-xs text-muted">{S.classes.pros(pros.join(', '))}</p>{/if}
			<p class="mt-2 text-[11px] text-muted">{l.source} · {shortDate(l.date)}</p>
		{:else}
			<p class="mt-2 text-[13px] text-muted">{S.classes.noBuild}</p>
		{/if}
	</article>
{/snippet}

<div class="ranked grid gap-5">
	<!-- top: the three facts that matter + where everything is -->
	<section class="class-card meta-list rk-box overflow-hidden rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" aria-labelledby="rk-heading">
		<header class="px-4 pt-4 pb-3 sm:px-5">
			<h2 id="rk-heading" class="font-head text-lg font-bold tracking-wide uppercase">{S.heading}</h2>
			<p class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{S.sub}</p>
		</header>
		<div class="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-3 sm:px-5">
			<div class="rk-tile">
				<p class="rk-tile-k">{S.tiles.ranked}</p>
				<p class="rk-tile-v font-head">{S.tiles.rankedValue}</p>
				<p class="rk-tile-s">{S.tiles.rankedSub} · {@render trust('official')}</p>
			</div>
			<div class="rk-tile">
				<p class="rk-tile-k">{S.tiles.cdl}</p>
				<p class="rk-tile-v font-head">{shortDate(CDL_START)}</p>
				<p class="rk-tile-s">{daysToCdl === null ? ' ' : S.tiles.cdlIn(daysToCdl)} · {@render trust('official')}</p>
			</div>
			<div class="rk-tile">
				<p class="rk-tile-k">{S.tiles.rules}</p>
				<p class="rk-tile-v font-head">CDL V 1.0</p>
				<p class="rk-tile-s">{S.tiles.rulesSub(shortDate(CDL_RULES.published))}</p>
			</div>
		</div>
		<nav class="border-t border-line px-4 py-3 sm:px-5" aria-label={S.jump}>
			<ul class="flex flex-wrap gap-2">
				{#each SECTIONS as k (k)}
					<li><a class="jump-chip font-head" href="#rk-{k}">{S.sections[k]}</a></li>
				{/each}
			</ul>
		</nav>
	</section>

	<!-- weapons -->
	<section id="rk-weapons" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-120px -260px">
		<header class="rk-head">
			<h3 class="rk-h font-head">{S.sections.weapons}</h3>
			<p class="mt-1 text-[13px] text-muted">{S.rulesIntro(CDL_RULES.name)} <a class="underline" href={CDL_RULES.url} target="_blank" rel="noopener noreferrer">{S.rulesLink}<span class="sr-only"> ({t.news.newTab})</span></a></p>
		</header>
		<div class="rk-body">
			<h4 class="rk-sub ok font-head">✔ {S.allowed}</h4>
			<div class="mt-2 grid gap-3">
				{#each allowedClasses as g (g.cls.id)}
					<div>
						<p class="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{g.cls.name}</p>
						<div class="gun-grid mt-1.5">
							{#each g.weapons as w (w.id)}{@render weaponChip(w, false)}{/each}
						</div>
					</div>
				{/each}
			</div>
			<h4 class="rk-sub no font-head mt-5">⛔ {S.restricted}</h4>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each bannedWholeClasses as c (c.id)}
					<span class="ban-pill">{S.allClass(c.name)}</span>
				{/each}
			</div>
			<div class="gun-grid mt-2.5">
				{#each bannedSingles as w (w.id)}{@render weaponChip(w, true)}{/each}
			</div>
			<p class="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">{@render trust('official')}<span>{CDL_RULES.name} · {shortDate(CDL_RULES.published)} · {S.weaponsHint}</span></p>
		</div>
	</section>

	<!-- attachments -->
	<section id="rk-attachments" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-380px -40px">
		<header class="rk-head"><h3 class="rk-h font-head">{S.sections.attachments}</h3></header>
		<div class="rk-body">
			<h4 class="rk-sub no font-head">⛔ {S.restricted}</h4>
			<ul class="mt-2.5 grid gap-2.5 sm:grid-cols-2">
				<li class="att-ban">
					<span class="att-x"><AttachmentIcon slot="Apex" /></span>
					<span class="font-semibold text-fg">{S.attachments.apexAll}</span>
				</li>
				<li class="att-ban">
					<span class="att-x"><AttachmentIcon slot="Laser" /></span>
					<span class="font-semibold text-fg">{S.attachments.laserAll}</span>
				</li>
				{#each BANNED_ATTACHMENTS as g (g.slot)}
					<li class="att-ban items-start {g.names.length < 4 ? '' : 'sm:col-span-2'}">
						<span class="att-x"><AttachmentIcon slot={g.slot} /></span>
						<span class="min-w-0">
							<span class="block text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{g.slot}</span>
							<span class="mt-1 flex flex-wrap gap-1.5">
								{#each g.names as n (n)}<span class="ban-pill sm">{n}</span>{/each}
							</span>
						</span>
					</li>
				{/each}
			</ul>
			<p class="mt-3 text-[13px] text-fg">✔ {S.attachments.rest}</p>
			<p class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">{@render trust('official')}<span>{CDL_RULES.name} · {shortDate(CDL_RULES.published)}</span></p>
		</div>
	</section>

	<!-- equipment, perks, streaks -->
	<section id="rk-gear" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-200px -400px">
		<header class="rk-head">
			<h3 class="rk-h font-head">{S.sections.gear}</h3>
			<p class="mt-1 text-[13px] text-muted">{S.gearNote}</p>
		</header>
		<div class="rk-body grid gap-4 md:grid-cols-2">
			{#each GEAR as g (g.id)}
				{@const okItems = g.items.filter((i) => !i.banned)}
				{@const noItems = g.items.filter((i) => i.banned)}
				<div class="gear-group" class:wide={g.id === 'streak'}>
					<h4 class="text-[12px] font-bold tracking-[0.14em] text-fg uppercase">{g.name}</h4>
					<ul class="mt-2 flex flex-wrap gap-2.5" aria-label="{g.name}: {S.allowed}">
						{#each okItems as i (i.name)}
							<li class="gear-ok">
								{#if i.icon}<GearIcon id={i.icon} size={52} />{/if}
								<span class="min-w-0">
									<span class="block text-[13.5px] leading-tight font-bold text-fg">{i.name}</span>
									<span class="block text-[11px] text-muted">✔ {S.allowed}{#if i.note}{' · '}{i.note}{/if}</span>
								</span>
							</li>
						{/each}
					</ul>
					{#if noItems.length}
						<ul class="mt-2.5 flex flex-wrap gap-1.5" aria-label="{g.name}: {S.restricted}">
							{#each noItems as i (i.name)}
								<li class="gear-no" title="{i.name}: {S.restricted}">
									{#if i.icon}<GearIcon id={i.icon} size={26} banned />{/if}
									<span>{i.name}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/each}
		</div>
		<p class="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 text-[11px] text-muted sm:px-5">{@render trust('official')}<span>{CDL_RULES.name} · {shortDate(CDL_RULES.published)}</span></p>
	</section>

	<!-- ranked classes -->
	<section id="rk-classes" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-500px -220px">
		<header class="rk-head">
			<h3 class="rk-h font-head">{S.sections.classes}</h3>
			<p class="mt-1 text-[13px] text-muted">{S.classes.intro}</p>
		</header>
		<div class="rk-body">
			<h4 class="rk-sub font-head flex flex-wrap items-center gap-2">{S.classes.proHeading} {@render trust('pro')}</h4>
			<div class="build-grid mt-2.5">
				{#each proList as x (x.w.id)}{@render buildCard(x.w, x.pro.build, x.pro.pick, x.pro.pros)}{/each}
			</div>
			{#if secondary}<p class="mt-3 text-[13px] text-fg">{S.classes.secondary(secondary.name)} <span class="text-[11px] text-muted">({SECONDARY_NOTE.source})</span></p>{/if}

			<h4 class="rk-sub font-head mt-6">{S.classes.restHeading}</h4>
			<div class="build-grid mt-2.5">
				{#each restList as x (x.w.id)}{@render buildCard(x.w, x.build, x.build ? `${S.classes.publicBuild} · ${x.build.role}` : S.classes.publicBuild)}{/each}
			</div>
		</div>
	</section>

	<!-- maps and modes -->
	<section id="rk-maps" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-60px -120px">
		<header class="rk-head"><h3 class="rk-h font-head">{S.sections.maps}</h3></header>
		<div class="rk-body grid gap-3 md:grid-cols-3">
			{#each MODES as m (m.id)}
				<div class="mode-card" data-mode={m.id}>
					<h4 class="font-head text-[15px] font-bold tracking-wide text-fg uppercase">{m.name}</h4>
					<p class="mt-1 text-xs text-muted">{m.rules}</p>
					<ul class="mt-2.5 flex flex-wrap gap-1.5">
						{#each m.maps as map (map)}<li class="map-pill">{map}</li>{/each}
					</ul>
				</div>
			{/each}
		</div>
		<p class="px-4 pb-1 text-[13px] text-fg sm:px-5"><b class="font-semibold">{S.maps.shared}:</b> {SHARED_SETTINGS.join(' · ')}</p>
		<p class="flex flex-wrap items-center gap-2 px-4 pt-2 pb-4 text-[11px] text-muted sm:px-5">{@render trust('official')}<span>{CDL_RULES.name} · {shortDate(CDL_RULES.published)}</span></p>

		<!-- Hardpoint rotations (2026-11-12, the user's ask: "where are the hardpoints and in what order") -->
		<div id="rk-hp" class="rk-body scroll-mt-4">
			<h4 class="rk-sub font-head flex flex-wrap items-center gap-2">{S.hp.heading} {@render trust('guide')}</h4>
			<p class="mt-1 text-[13px] text-muted">{S.hp.intro}</p>
			<div class="hp-grid mt-3">
				{#each HP_ROTATIONS as r (r.map)}
					<article class="hp-card" aria-labelledby="hp-{r.map.replace(/\W+/g, '-')}">
						<header class="flex items-baseline justify-between gap-2">
							<h5 id="hp-{r.map.replace(/\W+/g, '-')}" class="font-head text-[15px] font-bold tracking-wide text-fg uppercase">{r.map}</h5>
							<span class="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">{S.hp.hills(r.hills.length)}</span>
						</header>
						<HpMinimap {r} />
						<ol class="hp-steps mt-2">
							{#each r.hills as h, i (i)}
								<li class:long={r.longest.from === i + 1} class:short={r.shortest?.from === i + 1}>
									<span class="hp-no font-head" aria-hidden="true">P{i + 1}</span>
									<span class="min-w-0">
										<span class="sr-only">P{i + 1}: </span><b class="text-[13.5px] font-semibold text-fg">{h.name}</b
										>{#if h.note}{' '}<span class="text-xs text-muted">({h.note})</span>{/if}
										{#if h.disputed}<span class="hp-warn"><span aria-hidden="true">⚠ </span>{h.disputed}</span>{/if}
									</span>
								</li>
							{/each}
							<li class="hp-loop"><span class="hp-no" aria-hidden="true">↻</span><span class="text-xs text-muted">{S.hp.loop}</span></li>
						</ol>
						<p class="hp-run long-run">
							<i class="hp-key" aria-hidden="true"></i>
							{S.hp.longest(r.longest.from, r.longest.from + 1)}{#if r.longest.seconds}{', '}{S.hp.seconds(r.longest.seconds)}{/if}{#if r.longest.way}{' · '}{r.longest.way}{/if}
						</p>
						{#if r.shortest}
							<p class="hp-run"><i class="hp-key short" aria-hidden="true"></i>{S.hp.shortest(r.shortest.from, r.shortest.from + 1, r.shortest.seconds)}</p>
						{/if}
					</article>
				{/each}
			</div>
			<p class="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">{@render trust('guide')}<span>{HP_SOURCES.text}</span></p>
		</div>
	</section>

	<!-- about ranked -->
	<section id="rk-info" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-330px -460px">
		<header class="rk-head"><h3 class="rk-h font-head">{S.sections.info}</h3></header>
		<div class="rk-body grid gap-5 lg:grid-cols-2">
			<div>
				<h4 class="rk-sub font-head">{S.info.status}</h4>
				<div class="mt-2">{@render lines(RANKED_STATUS)}</div>
				<h4 class="rk-sub font-head mt-5">{S.info.lastYear}</h4>
				<div class="mt-2">{@render lines(LAST_YEAR)}</div>
			</div>
			<div>
				<h4 class="rk-sub font-head flex flex-wrap items-center gap-2">{S.info.ranksHeading} {@render trust('lastYear')}</h4>
				<ol class="mt-2.5 grid gap-1.5">
					{#each LAST_YEAR_RANKS as r (r.name)}
						<li class="rank-row" style:--r={r.color}>
							<span class="rank-gem" aria-hidden="true"></span>
							<span class="font-head font-bold tracking-wide text-fg uppercase">{r.name}</span>
							<span class="rank-sr num">
								{#if r.sr.length === 3}
									{#each r.sr as sr, i (i)}<span><b>{S.info.tier(i)}</b> {sr.toLocaleString('en-US')}</span>{/each}
								{:else if r.sr.length === 1}
									<span>{r.sr[0].toLocaleString('en-US')}+ SR</span>
								{:else}
									<span>Top 250 at Iridescent</span>
								{/if}
							</span>
						</li>
					{/each}
				</ol>
				<p class="mt-2 text-[11px] text-muted">{S.info.ranksNote}</p>
			</div>
		</div>
	</section>

	<!-- prep list -->
	<section id="rk-prep" class="class-card meta-list rk-box scroll-mt-4 rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" style:--worn-at="-450px -330px">
		<header class="rk-head"><h3 class="rk-h font-head">{S.prepHeading}</h3></header>
		<div class="rk-body">
			{@render lines(PREP)}
			<details class="community mt-4">
				<summary class="font-head">{S.community.summary}</summary>
				<p class="mt-2 text-[13px] text-fg">{S.community.intro}</p>
				<ul class="mt-2 grid list-disc gap-1 pl-5 text-[13px] text-fg">
					{#each COMMUNITY_EXTRA.lines as l (l)}<li>{l}</li>{/each}
				</ul>
				<p class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">{@render trust('community')}<span>{COMMUNITY_EXTRA.source}</span></p>
			</details>
		</div>
		<p class="border-t border-line px-4 py-3 text-xs text-muted sm:px-5">{S.snapshot(shortDate(RANKED_CHECKED))}</p>
	</section>
</div>

<style>
	.rk-head {
		padding: 16px 16px 12px;
	}
	.rk-body {
		padding: 14px 16px 16px;
		border-top: 1px solid var(--t-line);
	}
	@media (min-width: 640px) {
		.rk-head {
			padding-inline: 20px;
		}
		.rk-body {
			padding-inline: 20px;
		}
	}
	.rk-h {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.rk-sub {
		font-size: 12.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-fg);
	}
	.rk-sub.ok {
		color: var(--t-ok, #3ee06a);
	}
	.rk-sub.no {
		color: color-mix(in srgb, #f0473a 80%, var(--t-fg));
	}

	/* the three tiles */
	.rk-tile {
		padding: 10px 12px;
		border: 1px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	.rk-tile-k {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.rk-tile-v {
		font-size: 24px;
		font-weight: 700;
		line-height: 1.15;
		color: var(--t-fg);
	}
	.rk-tile-s {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 6px;
		margin-top: 2px;
		font-size: 12px;
		color: var(--t-muted);
	}
	.jump-chip {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 14px;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		background: var(--t-panel-2);
		color: var(--t-fg);
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.jump-chip:hover {
		border-color: var(--t-accent);
	}

	/* how sure a line is */
	.trust {
		display: inline-block;
		padding: 1px 7px;
		border-radius: 999px;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		color: #10141a;
		background: #b6c0c8;
	}
	.trust[data-trust='official'] {
		background: #5fd68a;
	}
	.trust[data-trust='pro'] {
		background: #ffc24a;
	}
	.trust[data-trust='community'] {
		background: #7cc4ff;
	}
	.trust[data-trust='estimate'] {
		background: #c9d1d6;
	}
	.trust[data-trust='lastYear'] {
		background: #c9a7ff;
	}

	/* weapons */
	.gun-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
		gap: 8px;
	}
	.gun-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 2.75rem;
		padding: 4px 10px 4px 6px;
		border: 1px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
		text-align: left;
		min-width: 0;
	}
	.gun-chip:hover {
		border-color: var(--t-accent);
	}
	.gun-chip.banned {
		opacity: 0.7;
		border-style: dashed;
	}
	.gun-chip.banned .gun-art {
		filter: grayscale(1);
	}
	.gun-chip.banned .weapon-name {
		text-decoration: line-through;
		text-decoration-color: #ff4d4d;
		text-decoration-thickness: 2px;
	}
	.gun-art {
		flex: none;
		display: grid;
		place-items: center;
	}
	/* phones: two columns, the cartoon above the name */
	@media (max-width: 519px) {
		.gun-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.gun-chip {
			flex-direction: column;
			justify-content: center;
			gap: 4px;
			padding: 6px 6px 8px;
			text-align: center;
		}
		.gun-chip .weapon-name {
			max-width: 100%;
		}
	}
	.gun-art :global(svg) {
		width: 62px;
		height: auto;
	}
	.ban-pill {
		display: inline-flex;
		align-items: center;
		min-height: 2rem;
		padding: 2px 12px;
		border: 1px dashed color-mix(in srgb, #ff5a4a 70%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, #ff3b2f 12%, transparent);
		color: var(--t-fg);
		font-size: 13px;
		font-weight: 600;
	}
	.ban-pill.sm {
		min-height: 1.6rem;
		padding: 1px 9px;
		font-size: 12.5px;
	}

	/* attachments */
	.att-ban {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border: 1px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	.att-x {
		position: relative;
		flex: none;
	}
	.att-x::after {
		content: '';
		position: absolute;
		inset: 50% -2px auto -2px;
		height: 4px;
		margin-top: -2px;
		border-radius: 2px;
		background: #e11d2a;
		transform: rotate(-28deg);
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.35);
	}

	/* gear */
	.gear-group {
		padding: 10px 12px 12px;
		border: 1px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	@media (min-width: 768px) {
		.gear-group.wide {
			grid-column: 1 / -1;
		}
	}
	.gear-ok {
		display: flex;
		align-items: center;
		gap: 9px;
		min-width: min(100%, 190px);
		padding: 5px 12px 5px 5px;
		border: 1px solid color-mix(in srgb, #3ee06a 45%, var(--t-line));
		border-radius: 12px;
		background: color-mix(in srgb, #3ee06a 8%, transparent);
	}
	.gear-no {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 2px 8px 2px 3px;
		border-radius: 8px;
		background: rgb(0 0 0 / 0.14);
		color: var(--t-muted);
		font-size: 12px;
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, #ff4d4d 70%, transparent);
	}
	.gear-no:not(:has(svg)) {
		padding-left: 8px;
	}

	/* classes */
	.build-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
		gap: 12px;
	}
	.build-card {
		min-width: 0;
		padding: 10px 12px 12px;
		border: 1px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	.name-btn {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		min-width: 2.75rem;
		text-align: left;
	}
	.build-tag {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.att-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 9px;
	}
	.att-row.bad {
		padding: 4px;
		margin: -4px;
		border-radius: 8px;
		background: color-mix(in srgb, #ff3b2f 14%, transparent);
	}
	.bad-note {
		display: block;
		margin-top: 1px;
		font-size: 11px;
		font-weight: 600;
		color: color-mix(in srgb, #f0473a 75%, var(--t-fg));
	}

	/* maps */
	.mode-card {
		padding: 10px 12px 12px;
		border: 1px solid var(--t-line);
		border-left: 3px solid var(--mode, var(--t-accent));
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	.mode-card[data-mode='hp'] {
		--mode: #ffcc33;
	}
	.mode-card[data-mode='snd'] {
		--mode: #ff4418;
	}
	.mode-card[data-mode='hijack'] {
		--mode: #3ee06a;
	}
	.map-pill {
		padding: 3px 10px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--mode) 18%, transparent);
		border: 1px solid color-mix(in srgb, var(--mode) 50%, transparent);
		color: var(--t-fg);
		font-size: 12.5px;
		font-weight: 600;
	}

	/* Hardpoint rotations: a numbered path per map, the longest run's link in red */
	.hp-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
		gap: 12px;
	}
	.hp-card {
		padding: 10px 12px 12px;
		border: 1px solid var(--t-line);
		border-left: 3px solid #ffcc33;
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	.hp-steps {
		display: grid;
	}
	.hp-steps li {
		position: relative;
		display: grid;
		grid-template-columns: 2.1rem minmax(0, 1fr);
		align-items: center;
		gap: 8px;
		padding: 4px 0;
	}
	/* the line from one hill to the next */
	.hp-steps li:not(:last-child)::after {
		content: '';
		position: absolute;
		left: calc(1.05rem - 1.5px);
		top: calc(50% + 12px);
		height: calc(100% - 16px);
		width: 3px;
		border-radius: 2px;
		background: color-mix(in srgb, #ffcc33 45%, transparent);
	}
	.hp-steps li.long::after {
		background: #ff4d3d;
		box-shadow: 0 0 6px rgb(255 77 61 / 0.6);
	}
	.hp-steps li.short::after {
		background: #3ee06a;
	}
	.hp-no {
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 1.6rem;
		border-radius: 999px;
		background: #ffcc33;
		color: #1b1405;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.hp-loop .hp-no {
		background: transparent;
		border: 2px dashed color-mix(in srgb, #ffcc33 70%, transparent);
		color: var(--t-fg);
		font-size: 14px;
	}
	.hp-warn {
		display: block;
		margin-top: 1px;
		font-size: 11px;
		color: color-mix(in srgb, #ff9f1c 75%, var(--t-fg));
	}
	.hp-run {
		margin-top: 6px;
		font-size: 12px;
		color: var(--t-muted);
	}
	.hp-run.long-run {
		color: var(--t-fg);
	}
	/* the colour key: the same red / green as the line between the hills */
	.hp-key {
		display: inline-block;
		width: 14px;
		height: 3px;
		margin-right: 6px;
		vertical-align: middle;
		border-radius: 2px;
		background: #ff4d3d;
	}
	.hp-key.short {
		background: #3ee06a;
	}

	/* info */
	.info-line {
		padding: 8px 10px;
		border: 1px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
	}
	.rank-row {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr);
		align-items: center;
		gap: 10px;
		padding: 6px 10px;
		border: 1px solid color-mix(in srgb, var(--r) 40%, var(--t-line));
		border-radius: 10px;
		background: linear-gradient(90deg, color-mix(in srgb, var(--r) 16%, transparent), transparent 70%);
		font-size: 13px;
	}
	.rank-gem {
		width: 16px;
		height: 16px;
		transform: rotate(45deg);
		border-radius: 3px;
		background: linear-gradient(135deg, #fff, var(--r) 45%, color-mix(in srgb, var(--r) 60%, #000));
		box-shadow: 0 0 8px color-mix(in srgb, var(--r) 70%, transparent);
	}
	.rank-sr {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 2px 12px;
		color: var(--t-muted);
		font-size: 12px;
	}
	.rank-sr b {
		color: var(--t-fg);
		font-weight: 700;
	}

	.community summary::before {
		content: '▸';
		margin-right: 8px;
		color: var(--t-accent);
		transition: transform 0.15s;
	}
	.community[open] summary::before {
		transform: rotate(90deg);
	}
	.community summary {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		cursor: pointer;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--t-fg);
	}

	/* Abscar: text over the worn gunmetal gets the same shadow as the class boxes */
	:global([data-theme='blackout']) .ranked .rk-box {
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
	}
	:global([data-theme='blackout']) .ranked .rk-tile-v {
		color: #fff;
	}
</style>
