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
	Every build with a code has a small copy button; the codes themselves only show with "Show codes"
	(codeView, the same switch as above the weapon list). A modal dialog covers the page's toasts, so
	the button itself says how it went.
	Every attachment line shows its slot's cartoon (AttachmentIcon, drawn after the user's own icon
	sheet; `bare` = no pastel tile behind it, the user's ask 2026-11-12), the slot name small above
	the part's name; the same `parts` snippet in the build cards and the Apex box.
-->
<script lang="ts">
	import AttachmentIcon from './AttachmentIcon.svelte';
	import { copyCode } from '#lib/browser.ts';
	import { codeView } from '#lib/codeView.svelte.ts';
	import { APEX } from '#lib/data/apex.ts';
	import { APEX_BUILDS } from '#lib/data/apexBuilds.ts';
	import { EXTRA_BUILDS, EXTRA_KINDS } from '#lib/data/extraBuilds.ts';
	import { LOADOUTS, type Loadout, type LoadoutMode } from '#lib/data/loadouts.ts';
	import { SITE_BUILDS, type SiteBuild } from '#lib/data/siteBuilds.ts';
	import { t } from '#lib/i18n/en.ts';
	import { shortDate } from '#lib/ui.ts';

	let { weaponId, columns = true }: { weaponId: string; columns?: boolean } = $props();

	const uid = $props.id();
	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const grid = $derived(`grid gap-3 ${columns ? 'sm:grid-cols-2' : ''}`);

	const norm = (s: string) => s.toLowerCase().replace(/["”″]/g, '').replace(/\s+/g, ' ').trim();
	const sameParts = (a: Loadout, b: Loadout) =>
		a.attachments.length === b.attachments.length &&
		a.attachments.every((x) => b.attachments.some((y) => y.slot === x.slot && norm(y.name) === norm(x.name)));

	/** Per mode: the meta class (with a code when a subclass has exactly its parts) and the other subclasses. */
	const modes = $derived(
		MODES.map((mode) => {
			const meta = LOADOUTS[weaponId]?.[mode];
			const site = SITE_BUILDS[weaponId]?.[mode] ?? [];
			const twin = meta ? site.find((b) => sameParts(meta, b)) : undefined;
			return { mode, meta, twin, others: site.filter((b) => b !== twin) };
		})
	);
	const extra = $derived(EXTRA_BUILDS[weaponId] ?? {});
	const extraKinds = $derived(EXTRA_KINDS.filter((k) => extra[k]));
	const apex = $derived(APEX[weaponId]);
	const apexBuilds = $derived(APEX_BUILDS[weaponId] ?? {});
	const apexModes = $derived(MODES.filter((m) => apexBuilds[m]));

	/** The code whose copy button was pressed last, and how it went (shown on that button). */
	let copied = $state<{ code: string; ok: boolean } | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	async function copy(code: string, el: HTMLElement | null) {
		const ok = await copyCode(code, el);
		copied = { code, ok };
		clearTimeout(timer);
		timer = setTimeout(() => (copied = null), ok ? 2200 : 6000);
	}
</script>

{#snippet roleText(l: Loadout)}
	{#if l.verified}
		<span class="text-xs text-muted">{l.role}</span>
	{:else}
		<span class="unverified text-xs text-muted" title={t.unverifiedHint}>{l.role}<span class="sr-only"> ({t.unverified})</span></span>
	{/if}
{/snippet}

{#snippet copyButton(code: string, what: string)}
	{@const cs = copied?.code === code ? copied : null}
	<button
		type="button"
		class="mb-copy group"
		class:done={cs?.ok}
		aria-label={t.codes.copyBuild(what)}
		title={cs?.ok ? t.codes.copied : t.codes.copyShort}
		onclick={(e) => copy(code, e.currentTarget.querySelector('.code-src'))}
	>
		<span class="mb-copy-ring" aria-hidden="true">
			{#if cs?.ok}
				<svg viewBox="0 0 16 16" width="14" height="14"
					><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg
				>
			{:else}
				<svg viewBox="0 0 24 24" width="14" height="14"
					><rect x="8" y="8" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.4" /><path
						d="M5 15V6a2 2 0 0 1 2-2h8"
						fill="none"
						stroke="currentColor"
						stroke-width="2.4"
						stroke-linecap="round"
					/></svg
				>
			{/if}
		</span>
		<span class="code-src" aria-hidden="true">{code}</span>
	</button>
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
{#snippet card(title: string, l: Loadout, opts: { code?: string; tags?: string[]; role?: boolean; apex?: boolean })}
	<section class="mb-card rounded-card border border-line bg-panel-2 p-3" aria-label={title}>
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
			{#if opts.code}{@render copyButton(opts.code, title)}{/if}
		</header>
		{#if opts.code && codeView.show}
			<p class="mb-code-line"><span>{t.loadout.code}</span><code>{opts.code}</code></p>
		{/if}
		{#if opts.code && copied?.code === opts.code && !copied.ok}
			<p class="mt-1 text-xs text-fg" role="status">{t.loadout.copyFailed}</p>
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
					role: true,
					tags: [t.loadout.ourPick, ...(twin ? [t.loadout.rank(twin.rank)] : [])],
					apex: m.meta.attachments.some((a) => a.slot === 'Apex')
				})}
			{:else}
				<section class="rounded-card border border-line bg-panel-2 p-3">
					<p class="text-[13px] text-muted">{t.loadout.none[m.mode]}</p>
				</section>
			{/if}
			{#each m.others as b (b.code)}
				{@render card(b.role, b, {
					code: b.code,
					tags: [t.loadout.rank(b.rank), ...(b.pro ? [t.loadout.pro] : [])],
					apex: b.attachments.some((a) => a.slot === 'Apex')
				})}
			{/each}
		</div>
	</section>
{/each}

{#if extraKinds.length}
	<section class="mb-mode" aria-labelledby="{uid}-stat">
		<h4 id="{uid}-stat" class="mb-h font-head">{t.loadout.extra.heading}</h4>
		<p class="mb-sub">{t.loadout.extra.sub}</p>
		<div class={grid}>
			{#each extraKinds as kind (kind)}
				{@render card(t.loadout.extra.kinds[kind], extra[kind]!, { role: true })}
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
					<section class="rounded-card border border-line bg-panel-2 p-3" aria-label={t.loadout.apex.build(t.loadout.modes[mode])}>
						<h5 class="font-head flex flex-wrap items-baseline justify-between gap-x-2 text-[13px] font-bold">
							<span class="tracking-[0.12em] text-fg uppercase">{t.loadout.modes[mode]}</span>
							{@render roleText(l)}
						</h5>
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
	.mb-tag-apex {
		border-color: color-mix(in srgb, #b9a3f0 60%, var(--t-line));
		color: color-mix(in srgb, #b9a3f0 70%, var(--t-fg));
	}

	/* the small copy button: a 28 px ring inside a 44 px tap target */
	.mb-copy {
		position: relative;
		display: grid;
		flex: none;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		margin: -8px -8px -8px 0;
		border-radius: 999px;
		color: var(--t-accent);
	}
	.mb-copy-ring {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 1px solid var(--t-tick-line, var(--t-line));
		border-radius: 999px;
		background: var(--t-tick);
		transition: border-color 0.15s;
	}
	.mb-copy:hover .mb-copy-ring {
		border-color: var(--t-accent);
	}
	.mb-copy.done {
		color: var(--t-ok);
	}
	.mb-copy.done .mb-copy-ring {
		border-color: var(--t-ok);
	}
	/* invisible but selectable, for the fallback copy (select + copy command) */
	.code-src {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		user-select: text;
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
