<!--
	One weapon's builds, used in the weapon card's Meta tab and in the meta popup (LoadoutDialog).
	Per mode (Multiplayer, then Warzone): our meta class first (data/loadouts.ts, weighed across the
	meta sites), then every published subclass with a build code (data/siteBuilds.ts: codmunity's
	Versatile / Close range / Long range / Sniper / Sniper support / Apex builds, in its rank order;
	2026-11-12, the user's ask: "all the multiplayer and warzone subclasses, neatly with the other
	metas on the red gun card"). A subclass with exactly the meta class's parts isn't listed twice:
	the meta card gets its code. Then "Stat builds" (data/extraBuilds.ts: Min ADS, Max sprint, Max
	range, worked out from the attachment stats, both modes, no code), then the gun's Apex attachment
	(data/apex.ts + data/apexBuilds.ts).
	Every build card has a small copy button (BuildCopy): the game code when one is published or a
	subclass has exactly the same parts (buildCopy.ts), otherwise the parts as text. The codes themselves only show with "Show codes"
	(codeView, the same switch as above the weapon list). A modal dialog covers the page's toasts, so
	the button itself says how it went.
	Every attachment line shows its slot's cartoon (AttachmentIcon, drawn after the user's own icon
	sheet; `bare` = no pastel tile behind it, the user's ask 2026-11-12), the slot name small above
	the part's name; the same `parts` snippet in the build cards and the Apex box.
-->
<script lang="ts">
	import AttachmentIcon from './AttachmentIcon.svelte';
	import BuildCopy from './BuildCopy.svelte';
	import SquadClassRow from './SquadClassRow.svelte';
	import { squad } from '#lib/squad.svelte.ts';
	import { liveClasses } from '#lib/squad-classes.ts';
	import { agoParts } from '#lib/squad-codec.ts';
	import { buildText, codeFor, twinOf } from '#lib/buildCopy.ts';
	import { codeView } from '#lib/codeView.svelte.ts';
	import { APEX } from '#lib/data/apex.ts';
	import { APEX_BUILDS } from '#lib/data/apexBuilds.ts';
	import { EXTRA_BUILDS, EXTRA_KINDS } from '#lib/data/extraBuilds.ts';
	import { HARDCORE_BUILDS, HARDCORE_NO } from '#lib/data/hardcoreBuilds.ts';
	import { LOADOUTS, type Loadout, type LoadoutMode } from '#lib/data/loadouts.ts';
	import { SITE_BUILDS, type SiteBuild } from '#lib/data/siteBuilds.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let { weaponId, columns = true }: { weaponId: string; columns?: boolean } = $props();

	const uid = $props.id();
	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const grid = $derived(`grid gap-3 ${columns ? 'sm:grid-cols-2' : ''}`);

	const weaponName = $derived(WEAPON_BY_ID.get(weaponId)?.name ?? weaponId);

	/** Per mode: the meta class (with a code when a subclass has exactly its parts) and the other subclasses. */
	const modes = $derived(
		MODES.map((mode) => {
			const meta = LOADOUTS[weaponId]?.[mode];
			const site = SITE_BUILDS[weaponId]?.[mode] ?? [];
			const twin = twinOf(weaponId, mode, meta);
			return { mode, meta, twin, others: site.filter((b) => b !== twin) };
		})
	);
	/** Multiplayer Hardcore (codmunity's app, data/hardcoreBuilds.ts): next to the meta class, at the top. */
	const hardcore = $derived(HARDCORE_BUILDS[weaponId] ?? []);
	const hardcoreNo = $derived(HARDCORE_NO.includes(weaponId));
	const extra = $derived(EXTRA_BUILDS[weaponId] ?? {});
	const extraKinds = $derived(EXTRA_KINDS.filter((k) => extra[k]));
	/** "Your squad runs" (2026-11-16): classes squad members shared for this gun, yours first (squad-classes.ts). */
	const squadClasses = $derived(
		squad.on
			? squad.entries
					.flatMap((e) => liveClasses(e.member.classes).filter((cls) => cls.w === weaponId).map((cls) => ({ cls, e })))
					.sort((a, b) => Number(b.e.mine) - Number(a.e.mine) || b.cls.at - a.cls.at)
			: []
	);
	const apex = $derived(APEX[weaponId]);
	const apexBuilds = $derived(APEX_BUILDS[weaponId] ?? {});
	const apexModes = $derived(MODES.filter((m) => apexBuilds[m]));
</script>

{#snippet roleText(l: Loadout)}
	{#if l.verified}
		<span class="text-xs text-muted">{l.role}</span>
	{:else}
		<span class="unverified text-xs text-muted" title={t.unverifiedHint}>{l.role}<span class="sr-only"> ({t.unverified})</span></span>
	{/if}
{/snippet}

<!-- a build's attachments: tile, slot name, part (the tile sits inside the <dt>, so <dt>/<dd> stay plain) -->
{#snippet parts(l: Loadout)}
	<dl class="mb-parts">
		{#each l.attachments as a (a.slot)}
			<div class="mb-part" class:apex={a.slot === 'Apex'}>
				<dt><span class="mb-part-icon"><AttachmentIcon slot={a.slot} bare /></span>{a.slot}</dt>
				<dd>{a.name}</dd>
			</div>
		{/each}
	</dl>
{/snippet}

<!-- one build card: title (+ small tags) and copy button on top, the parts, a note, the source -->
{#snippet card(title: string, l: Loadout, opts: { code?: string; label: string; tags?: string[]; role?: boolean; apex?: boolean; hc?: boolean })}
	<section class="mb-card rounded-card border border-line bg-panel-2 p-3" class:mb-card-hc={opts.hc} aria-label={title}>
		<header class="flex items-start gap-2">
			<div class="min-w-0 flex-1">
				<h5 class="font-head text-[13px] font-bold tracking-[0.12em] text-fg uppercase">{title}</h5>
				{#if opts.role || opts.tags?.length}
					<p class="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
						{#if opts.role}{@render roleText(l)}{/if}
						{#each opts.tags ?? [] as tag (tag)}<span class="mb-tag">{tag}</span>{/each}
						{#if opts.apex}<span class="mb-tag mb-tag-apex">{t.loadout.apex.tag}</span>{/if}
					</p>
				{/if}
			</div>
			<BuildCopy code={opts.code} text={buildText(weaponName, opts.label, l)} what={opts.label} />
		</header>
		{#if opts.code && codeView.show}
			<p class="mb-code-line"><span>{t.loadout.code}</span><code>{opts.code}</code></p>
		{/if}
		{@render parts(l)}
		{#if l.note}
			<p class="mt-2.5 flex gap-1.5 text-xs text-fg">
				<!-- ⚠ when the build is unconfirmed, ⓘ when it's just a tip -->
				<span class="text-accent" aria-hidden="true">{l.verified ? 'ⓘ' : '⚠'}</span><span>{l.note}</span>
			</p>
		{/if}
		<p class="mt-2.5 text-[11px] text-muted">{l.source} · {shortDate(l.date)}</p>
	</section>
{/snippet}

<label class="mb-show">
	<input type="checkbox" checked={codeView.show} onchange={(e) => codeView.set(e.currentTarget.checked)} />
	<span>{t.codes.show}</span>
</label>

{#each modes as m (m.mode)}
	<section class="mb-mode" aria-labelledby="{uid}-{m.mode}">
		<h4 id="{uid}-{m.mode}" class="mb-h font-head">{t.loadout.modes[m.mode]}</h4>
		<div class={grid}>
			{#if m.meta}
				{@const twin = m.twin as SiteBuild | undefined}
				{@render card(t.loadout.metaTitle, m.meta, {
					code: twin?.code,
					label: `${t.loadout.metaTitle} (${t.loadout.modes[m.mode]})`,
					role: true,
					tags: [t.loadout.ourPick, ...(twin ? [t.loadout.rank(twin.rank)] : [])],
					apex: m.meta.attachments.some((a) => a.slot === 'Apex')
				})}
			{:else}
				<section class="rounded-card border border-line bg-panel-2 p-3">
					<p class="text-[13px] text-muted">{t.loadout.none[m.mode]}</p>
				</section>
			{/if}
			{#if m.mode === 'mp'}
				<!-- Hardcore right beside the meta class (2026-11-15, the user: "the 2 we'll use most") -->
				{#each hardcore as h (h.build.role)}
					{@render card(t.loadout.hardcore.title, h.build, {
						code: h.code,
						label: `${t.loadout.hardcore.title} ${h.build.role} (${t.loadout.modes.mp})`,
						role: true,
						hc: true,
						apex: h.build.attachments.some((a) => a.slot === 'Apex')
					})}
				{/each}
				{#if hardcoreNo}
					<section class="mb-card mb-card-hc rounded-card border border-line bg-panel-2 p-3" aria-label={t.loadout.hardcore.title}>
						<h5 class="font-head text-[13px] font-bold tracking-[0.12em] text-fg uppercase">{t.loadout.hardcore.title}</h5>
						<p class="mt-1 text-[13px] text-fg">{t.loadout.hardcore.notRecommended}</p>
						<p class="mt-2.5 text-[11px] text-muted">{t.loadout.hardcore.noSource}</p>
					</section>
				{/if}
			{/if}
			{#each m.others as b (b.code)}
				{@render card(b.role, b, {
					code: b.code,
					label: `${b.role} (${t.loadout.modes[m.mode]})`,
					tags: [t.loadout.rank(b.rank), ...(b.pro ? [t.loadout.pro] : [])],
					apex: b.attachments.some((a) => a.slot === 'Apex')
				})}
			{/each}
		</div>
	</section>
{/each}

{#if squadClasses.length}
	<section class="mb-mode" aria-labelledby="{uid}-squad">
		<h4 id="{uid}-squad" class="mb-h font-head">{t.squad.classes.cardHeading}</h4>
		<p class="mb-sub">{t.squad.classes.cardSub}</p>
		<ul class="grid gap-1.5">
			{#each squadClasses as { cls, e } (e.id + cls.id)}
				<SquadClassRow {cls} who={e.member.name} op={e.member.op} mine={e.mine} showGun={false} ago={t.squad.classes.saved(t.squad.ago(agoParts(cls.at, squad.now)))} />
			{/each}
		</ul>
	</section>
{/if}

{#if extraKinds.length}
	<section class="mb-mode" aria-labelledby="{uid}-stat">
		<h4 id="{uid}-stat" class="mb-h font-head">{t.loadout.extra.heading}</h4>
		<p class="mb-sub">{t.loadout.extra.sub}</p>
		<div class={grid}>
			{#each extraKinds as kind (kind)}
				{@render card(t.loadout.extra.kinds[kind], extra[kind]!, { role: true, label: `${t.loadout.extra.kinds[kind]} (${t.loadout.extra.heading})` })}
			{/each}
		</div>
	</section>
{/if}

{#if apex}
	<section class="apex-box mt-4 rounded-card border p-3" aria-label={t.loadout.apex.heading(apex.name)}>
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
					{@const label = t.loadout.apex.build(t.loadout.modes[mode])}
					{@const code = codeFor(weaponId, mode, l)}
					<section class="rounded-card border border-line bg-panel-2 p-3" aria-label={label}>
						<header class="flex items-start gap-2">
							<h5 class="font-head flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-2 text-[13px] font-bold">
								<span class="tracking-[0.12em] text-fg uppercase">{t.loadout.modes[mode]}</span>
								{@render roleText(l)}
							</h5>
							<BuildCopy {code} text={buildText(weaponName, label, l)} what={label} />
						</header>
						{#if code && codeView.show}
							<p class="mb-code-line"><span>{t.loadout.code}</span><code>{code}</code></p>
						{/if}
						{@render parts(l)}
						{#if l.note}
							<p class="mt-2.5 flex gap-1.5 text-xs text-fg">
								<span class="text-accent" aria-hidden="true">{l.verified ? 'ⓘ' : '⚠'}</span><span>{l.note}</span>
							</p>
						{/if}
						<p class="mt-2.5 text-[11px] text-muted">{l.source} · {shortDate(l.date)}</p>
					</section>
				{/each}
			</div>
		{:else}
			<p class="mt-2 text-[13px] text-muted">{t.loadout.apex.none}</p>
		{/if}
	</section>
{/if}

<style>
	/* "Show codes": a small tick at the top right, the same switch as above the weapon list */
	.mb-show {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
		min-height: 2.75rem;
		margin: -10px 0 -4px auto;
		width: fit-content;
		padding: 0 2px 0 8px;
		font: 600 11px var(--font-hud);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--t-muted);
		cursor: pointer;
		user-select: none;
	}
	.mb-show input {
		width: 15px;
		height: 15px;
		accent-color: var(--t-accent);
	}
	.mb-show:hover {
		color: var(--t-fg);
	}

	.mb-mode + .mb-mode {
		margin-top: 18px;
	}
	.mb-h {
		margin-bottom: 8px;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.mb-h::before {
		content: '▸ ';
	}
	.mb-sub {
		margin: -4px 0 8px;
		font-size: 11.5px;
		color: var(--t-muted);
	}
	.mb-tag {
		padding: 0 6px;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		font: 700 10px/16px var(--t-font-head);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	/* the Hardcore card: a red edge and a red title, so it stands apart next to the meta class */
	.mb-card-hc {
		border-color: color-mix(in srgb, #ff3b3b 65%, var(--t-line));
		box-shadow: inset 3px 0 0 #ff3b3b;
	}
	.mb-card-hc h5 {
		color: color-mix(in srgb, #ff5a4a 75%, var(--t-fg));
	}
	.mb-tag-apex {
		border-color: color-mix(in srgb, #b9a3f0 60%, var(--t-line));
		color: color-mix(in srgb, #b9a3f0 70%, var(--t-fg));
	}

	.mb-code-line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 2px 8px;
		margin-top: 4px;
		font-size: 11px;
		color: var(--t-muted);
	}
	.mb-code-line code {
		font: 700 13px var(--font-hud);
		letter-spacing: 0.04em;
		color: var(--t-fg);
		user-select: all;
		overflow-wrap: anywhere;
	}

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

	/* attachment lines: the 52 × 31 cartoon on the left, slot name small on top, the part below */
	.mb-parts {
		display: grid;
		gap: 8px;
		margin-top: 10px;
	}
	.mb-part {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 31px;
		padding-left: 62px;
	}
	.mb-part-icon {
		position: absolute;
		top: 50%;
		left: 0;
		translate: 0 -50%;
	}
	.mb-part dt {
		font-size: 11px;
		line-height: 1.25;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.mb-part dd {
		font-size: 13px;
		line-height: 1.3;
		font-weight: 600;
		color: var(--t-fg);
		overflow-wrap: break-word;
	}
	.mb-part.apex dt {
		color: color-mix(in srgb, var(--apex, #b9a3f0) 80%, var(--t-fg));
		font-weight: 700;
	}
	.mb-part.apex dd {
		color: color-mix(in srgb, var(--apex, #b9a3f0) 45%, var(--t-fg));
	}
</style>
