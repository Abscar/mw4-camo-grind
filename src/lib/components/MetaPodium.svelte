<!--
	"Absolute meta" (2026-11-22, the user: "a small box above Meta top 5 with the absolute meta guns,
	maybe the 3 best guns in the game with classes and everything"). The first META_PODIUM guns of the
	overall list in data/metaRanks.ts, each with its meta class from data/loadouts.ts (the same build the
	weapon card calls "Our pick"), a copy button (the game code when codmunity publishes one with exactly
	these parts, otherwise the parts as text) and a way into all its builds (the meta popup). Multiplayer or
	Warzone: one switch shared with Meta top 5 (metaMode.svelte.ts).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { buildText, codeFor } from '#lib/buildCopy.ts';
	import { codeView } from '#lib/codeView.svelte.ts';
	import { LOADOUTS, type LoadoutMode } from '#lib/data/loadouts.ts';
	import { META_PODIUM, META_RANKS, metaName } from '#lib/data/metaRanks.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { metaMode } from '#lib/metaMode.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import AttachmentIcon from './AttachmentIcon.svelte';
	import BuildCopy from './BuildCopy.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const MODES: LoadoutMode[] = ['mp', 'wz'];
	const uid = $props.id();

	const mode = $derived(metaMode.mode);
	const board = $derived(META_RANKS[mode]);
	const classShort = (id: string) => CLASSES.find((c) => c.id === WEAPON_BY_ID.get(id)?.classId)?.short ?? '';

	const picks = $derived(
		board.overall.slice(0, META_PODIUM).map((pick, i) => {
			const build = LOADOUTS[pick.id]?.[mode];
			return {
				pick,
				place: i + 1,
				name: metaName(pick.id),
				look: WEAPON_LOOKS[pick.id],
				build,
				code: codeFor(pick.id, mode, build),
				// Warzone picks say what they're for; Multiplayer uses the build's own role
				role: pick.role ?? build?.role ?? ''
			};
		})
	);

	onMount(() => metaMode.load());
</script>

<section class="class-card meta-list meta-podium overflow-hidden rounded-card bg-panel shadow-card" style:--c="var(--t-accent)" aria-labelledby="{uid}-h">
	<header class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-4 pb-3 sm:px-5">
		<div class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
			<h2 id="{uid}-h" class="pod-title font-head text-base font-bold tracking-wide uppercase">
				<svg class="pod-crown" viewBox="0 0 24 18" aria-hidden="true"
					><path d="M2 15 L1 4 L7 9 L12 1 L17 9 L23 4 L22 15 Z" /><rect x="2" y="15" width="20" height="2.6" rx="1" /></svg
				>{t.podium.heading}
			</h2>
			<span class="font-head text-[11px] font-semibold tracking-widest text-muted uppercase">{t.podium.sub}</span>
		</div>
		<!-- the same switch as Meta top 5 below (shared state); phones: its own row, two equal halves -->
		<div class="flex gap-1.5 max-sm:w-full" role="group" aria-label={t.metaList.modeGroup}>
			{#each MODES as m (m)}
				<button
					type="button"
					class="meta-mode font-head min-h-11 rounded-full border px-4 text-[13px] font-semibold max-sm:flex-1"
					aria-pressed={mode === m}
					onclick={() => metaMode.set(m)}>{t.loadout.modes[m]}</button
				>
			{/each}
		</div>
	</header>

	<ol class="grid gap-3 border-t border-line px-4 py-4 sm:px-5 md:grid-cols-3">
		{#each picks as p (p.pick.id)}
			{@const placeText = t.podium.place(p.place)}
			<li class="pod-card min-w-0" data-place={p.place}>
				<div class="pod-hero" aria-hidden="true">
					<span class="pod-medal"><span>{p.place}</span></span>
					<span class="meta-tier font-head pod-tier" data-tier={p.pick.tier}>{p.pick.tier}</span>
					{#if p.look}<span class="pod-gun-art"><WeaponIcon look={p.look} /></span>{/if}
				</div>

				<div class="px-3">
					<button
						type="button"
						class="pod-name min-h-11 w-full text-left"
						aria-haspopup="dialog"
						aria-label="{t.podium.placeLabel(placeText, p.name, p.pick.tier)} – {t.podium.allBuildsLabel(p.name)}"
						onclick={() => loadoutView.show(p.pick.id)}
					>
						<span class="pod-place font-head">{placeText}</span>
						<span class="flex min-w-0"
							><span class="weapon-name block truncate font-semibold" class:unverified={!p.pick.verified}>{p.name}</span></span
						>
					</button>
					<p class="text-[12px] leading-tight text-muted">{[classShort(p.pick.id), p.role].filter(Boolean).join(' · ')}</p>
				</div>

				{#if p.build}
					{@const label = t.podium.build(t.loadout.modes[mode])}
					<div class="pod-build mx-3 mt-3 border-t border-line pt-2.5">
						<div class="flex items-center gap-2">
							<h3 class="pod-build-h font-head min-w-0 flex-1">{label}</h3>
							<BuildCopy code={p.code} text={buildText(p.name, label, p.build)} what="{p.name} {label}" />
						</div>
						{#if p.code && codeView.show}
							<p class="pod-code"><span>{t.loadout.code}</span><code>{p.code}</code></p>
						{/if}
						<dl class="pod-parts">
							{#each p.build.attachments as a (a.slot)}
								<div class="pod-part" class:apex={a.slot === 'Apex'}>
									<dt><span class="pod-part-icon"><AttachmentIcon slot={a.slot} bare /></span>{a.slot}</dt>
									<dd>{a.name}</dd>
								</div>
							{/each}
						</dl>
						{#if p.build.note}
							<p class="mt-2 flex gap-1.5 text-xs text-fg">
								<span class="text-accent" aria-hidden="true">{p.build.verified ? 'ⓘ' : '⚠'}</span><span>{p.build.note}</span>
							</p>
						{/if}
					</div>
				{:else}
					<p class="mx-3 mt-3 text-[13px] text-muted">{t.podium.noBuild}</p>
				{/if}

				<footer class="mt-auto flex items-center gap-2 px-3 pt-2 pb-1">
					{#if p.build}<span class="min-w-0 flex-1 text-[11px] leading-tight text-muted">{p.build.source} · {shortDate(p.build.date)}</span>{/if}
					<button
						type="button"
						class="pod-more font-head ml-auto min-h-11 flex-none px-1 text-[12px] font-bold tracking-wider uppercase"
						aria-haspopup="dialog"
						aria-label={t.podium.allBuildsLabel(p.name)}
						onclick={() => loadoutView.show(p.pick.id)}>{t.podium.allBuilds} ›</button
					>
				</footer>
			</li>
		{/each}
	</ol>

	<p class="border-t border-line px-4 py-3 text-xs text-muted sm:px-5">{t.podium.snapshot(board.sources, shortDate(board.date))}</p>
</section>

<style>
	/* Abscar: the same worn gunmetal as Meta top 5, but scratched somewhere else */
	:global([data-theme='blackout']) .meta-podium {
		--worn-at: -40px -260px;
	}

	/* medal colours per place: gold, silver, bronze */
	.pod-card {
		--m1: #ffe58a;
		--m2: #e0a92a;
		--m3: #8a5a0c;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--t-line);
		border-top: 3px solid var(--m2);
		border-radius: var(--radius-card, 10px);
		background: var(--t-panel-2);
		overflow: hidden;
	}
	.pod-card[data-place='2'] {
		--m1: #ffffff;
		--m2: #b9c2cc;
		--m3: #5d6670;
	}
	.pod-card[data-place='3'] {
		--m1: #ffd2a6;
		--m2: #c27a3c;
		--m3: #6b3a14;
	}

	.pod-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.pod-crown {
		width: 22px;
		height: 17px;
		flex: none;
		fill: var(--t-gold-ink, var(--t-gold, #e0a92a));
	}

	/* the gun on a little lit stage: medal top left, tier top right */
	.pod-hero {
		position: relative;
		display: grid;
		place-items: center;
		height: 84px;
		background:
			radial-gradient(60% 75% at 50% 62%, color-mix(in srgb, var(--m2) 30%, transparent), transparent 72%),
			linear-gradient(180deg, color-mix(in srgb, var(--m2) 10%, transparent), transparent);
	}
	.pod-gun-art :global(.weapon-icon) {
		width: 150px;
		height: 56px;
		filter: drop-shadow(0 5px 6px rgb(0 0 0 / 0.45));
	}
	.pod-medal {
		position: absolute;
		top: 8px;
		left: 10px;
		width: 36px;
		height: 44px;
	}
	/* the ribbon behind the coin */
	.pod-medal::before {
		content: '';
		position: absolute;
		left: 9px;
		top: 22px;
		width: 18px;
		height: 22px;
		background: linear-gradient(90deg, #c4202c 0 33%, #f4f1e8 33% 67%, #2547a8 67%);
		clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 74%, 0 100%);
	}
	.pod-medal > span {
		position: absolute;
		top: 0;
		left: 0;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, var(--m1), var(--m2) 55%, var(--m3));
		box-shadow:
			inset 0 0 0 2px color-mix(in srgb, var(--m3) 55%, transparent),
			0 2px 4px rgb(0 0 0 / 0.45);
		color: #1a1206;
		font: 800 17px/1 var(--t-font-head);
		text-shadow: 0 1px 0 rgb(255 255 255 / 0.5);
	}
	.pod-tier {
		position: absolute;
		top: 10px;
		right: 10px;
	}

	.pod-name {
		display: grid;
		align-content: center;
		gap: 1px;
		border-radius: 6px;
	}
	.pod-name:hover .weapon-name {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.pod-place {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--m2) 75%, var(--t-fg));
	}

	.pod-build-h {
		font-size: 11.5px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.pod-code {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 2px 8px;
		margin-top: 2px;
		font-size: 11px;
		color: var(--t-muted);
	}
	.pod-code code {
		font: 700 13px var(--font-hud);
		letter-spacing: 0.04em;
		color: var(--t-fg);
		user-select: all;
		overflow-wrap: anywhere;
	}

	/* attachments like the weapon card's builds: slot cartoon left, slot name small, part below */
	.pod-parts {
		display: grid;
		gap: 7px;
		margin-top: 8px;
	}
	.pod-part {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: center;
		min-height: 31px;
		padding-left: 60px;
	}
	.pod-part-icon {
		position: absolute;
		top: 50%;
		left: 0;
		translate: 0 -50%;
	}
	.pod-part dt {
		font-size: 10.5px;
		line-height: 1.25;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.pod-part dd {
		font-size: 13px;
		line-height: 1.3;
		font-weight: 600;
		color: var(--t-fg);
		overflow-wrap: break-word;
	}
	.pod-part.apex dt {
		color: color-mix(in srgb, #b9a3f0 80%, var(--t-fg));
		font-weight: 700;
	}
	.pod-part.apex dd {
		color: color-mix(in srgb, #b9a3f0 45%, var(--t-fg));
	}

	.pod-more {
		color: var(--t-accent);
	}
	.pod-more:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}
</style>
