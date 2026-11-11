<!--
	"Road to Divergence" (2026-11-11, the user's pick from a brainstorm): how many Harmonic Breaks
	Divergence still needs (a 33-cell track), and the weapons closest to Harmonic Break, by how many of
	their 6 steps are done (road.ts: facts from your own ticks and counters only, never "fastest").
	6 weapons at first, "Show all" for the rest; past the number you need, the rest are marked as extra.
	A weapon's name opens its card. Under "Continue grinding"; gone once Divergence is unlocked.
	Hide / Show is remembered per device (`mw4-camo-grind:road`). All themes (gunmetal box in Abscar).
-->
<script lang="ts">
	import { LADDER, SEASON_1_COUNTS_TOWARD_DIVERGENCE } from '#lib/data/camos.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { roadToDivergence, type RoadRow } from '#lib/road.ts';
	import { weaponSheet } from '#lib/weaponSheet.svelte.ts';
	import WeaponIcon from './WeaponIcon.svelte';

	const KEY = 'mw4-camo-grind:road';
	const FIRST = 6;

	const road = $derived(
		roadToDivergence({
			weapons: progress.weapons,
			specials: progress.specials,
			counts: progress.counts,
			focus: progress.prefs.focus
		})
	);
	let open = $state(true);
	let all = $state(false);
	const rows = $derived(all ? road.rows : road.rows.slice(0, FIRST));
	const className = (id: string) => CLASSES.find((c) => c.id === id)?.name ?? '';

	$effect(() => {
		try {
			open = localStorage.getItem(KEY) !== 'closed';
		} catch {
			// storage blocked: stays open
		}
	});
	function toggle() {
		open = !open;
		try {
			if (open) localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, 'closed');
		} catch {
			// nothing to remember it in
		}
	}

	/** What you're on: the next ladder camo with its challenge, or how many before-Gold challenges are left. */
	function nextText(row: RoadRow): string {
		const step = row.next[0];
		if (!step) return '';
		const c = row.counter;
		const tail = c ? ` · ${t.road.counter(c.step.name, c.count, c.step.target)}` : '';
		if (step.kind === 'ladder') return `${step.name}: ${step.fact.text}${c && c.step.key === step.key ? ` · ${c.count}/${c.step.target}` : ''}`;
		return `${t.road.preGold(row.next.length)}${tail}`;
	}
</script>

{#if road.toGo > 0}
	<section
		id="road"
		class="class-card weapon-class road-card overflow-hidden rounded-card bg-panel shadow-card"
		style:--c="var(--t-div)"
		aria-labelledby="road-heading"
	>
		<header class="class-head flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-3">
			<svg viewBox="0 0 20 20" class="road-mark size-5 flex-none" aria-hidden="true" focusable="false">
				<path d="M10 1.5 18.5 10 10 18.5 1.5 10Z" fill="none" stroke="currentColor" stroke-width="1.8" />
				<path d="M10 5.5 14.5 10 10 14.5 5.5 10Z" fill="currentColor" />
			</svg>
			<h2 id="road-heading" class="class-title font-head flex-1 text-[15px] font-bold tracking-wide uppercase">{t.road.heading}</h2>
			<span class="font-head num text-xs font-bold">{t.road.count(road.have, road.needed)}</span>
			<button type="button" class="btn btn-sm" aria-expanded={open} aria-controls="road-body" onclick={toggle}
				>{open ? t.road.hide : t.road.show}</button
			>
		</header>

		<div id="road-body" class="road-body grid gap-3 p-3 sm:p-4" hidden={!open}>
			<p class="text-[13.5px] leading-snug text-fg">{t.road.intro(road.toGo)}</p>

			<!-- one cell per Harmonic Break Divergence needs -->
			<div class="road-track" role="img" aria-label={t.road.track(road.have, road.needed)}>
				{#each Array.from({ length: road.needed }, (_, i) => i) as i (i)}
					<i class:on={i < road.have}></i>
				{/each}
			</div>

			<ol class="grid grid-cols-[minmax(0,1fr)] gap-2 md:grid-cols-[repeat(2,minmax(0,1fr))]">
				{#each rows as row, i (row.weaponId)}
					{@const w = WEAPON_BY_ID.get(row.weaponId)}
					{@const look = WEAPON_LOOKS[row.weaponId]}
					{@const level = progress.level(row.weaponId)}
					{#if w}
						{#if i === road.toGo && road.rows.length > road.toGo}
							<li class="road-divider text-[12.5px] text-muted md:col-span-2">{t.road.spares(road.toGo)}</li>
						{/if}
						<li class="grind-card road-row grid min-w-0 gap-1.5 rounded-card px-3 py-2" class:road-spare={i >= road.toGo}>
							<div class="flex min-w-0 items-center gap-2.5">
								<span class="road-rank font-head num flex-none text-[13px] font-bold" aria-hidden="true">{i + 1}</span>
								<button
									type="button"
									class="weapon-open flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left"
									aria-haspopup="dialog"
									onclick={() => weaponSheet.show(w.id)}
								>
									{#if look}<span class="compact-hide flex-none max-sm:hidden"><WeaponIcon {look} /></span>{/if}
									<span class="min-w-0">
										<span class="weapon-name inline-block max-w-full truncate font-semibold">{w.name}</span>
										<span class="block text-[12px] text-muted"
											>{className(w.classId)}{#if row.season1 && SEASON_1_COUNTS_TOWARD_DIVERGENCE}{' · '}<span
													class="unverified"
													title={t.weapon.s1Divergence}>{t.road.s1}</span
												>{/if}</span
										>
									</span>
									<span class="sr-only">– {t.weapon.openHint}</span>
								</button>
								<span class="flex flex-none flex-col items-end gap-0.5">
									<span class="road-pips" aria-hidden="true">
										{#each [0, 1, 2] as s (s)}<i class="pre" class:on={row.done - level > s || level >= 1}></i>{/each}
										{#each LADDER as camo, li (camo.id)}<b class:on={level > li}>{camo.short}</b>{/each}
									</span>
									<span class="num text-[11.5px] font-semibold text-muted">{t.road.stepsLeft(row.total - row.done)}</span>
									<span class="sr-only">{t.road.stepsDone(row.done, row.total)}</span>
								</span>
							</div>
							{#if row.next.length > 0}
								<p class="road-next text-[12.5px] leading-snug text-fg"><b class="font-semibold">{t.road.next}:</b> {nextText(row)}</p>
							{/if}
						</li>
					{/if}
				{/each}
			</ol>

			<div class="flex flex-wrap items-center justify-between gap-2">
				<p class="text-[12px] text-muted">{t.road.note}</p>
				{#if road.rows.length > FIRST}
					<button type="button" class="btn btn-sm" aria-expanded={all} onclick={() => (all = !all)}
						>{all ? t.road.showFewer : t.road.showAll(road.rows.length)}</button
					>
				{/if}
			</div>
		</div>
	</section>
{/if}

<style>
	/* the header strip is the Divergence colour in most themes, so the mark takes the heading's colour;
	   on Abscar's gunmetal it's the Divergence colour itself */
	.road-mark {
		color: inherit;
	}
	:global([data-theme='blackout']) .road-mark {
		color: var(--t-div);
	}
	/* 33 cells, one per Harmonic Break Divergence needs */
	.road-track {
		display: grid;
		grid-template-columns: repeat(33, minmax(0, 1fr));
		gap: 2px;
	}
	.road-track i {
		height: 10px;
		border-radius: 2px;
		background: var(--t-track, rgb(127 127 127 / 0.25));
	}
	.road-track i.on {
		background: var(--t-hb);
		box-shadow: 0 0 6px color-mix(in srgb, var(--t-hb) 60%, transparent);
	}
	.road-rank {
		width: 1.6em;
		text-align: center;
		color: var(--t-muted);
	}
	/* 3 dots for the challenges before Gold, then G / P / HB */
	.road-pips {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.road-pips i {
		width: 7px;
		height: 7px;
		border-radius: 999px;
		border: 1.5px solid var(--t-muted);
	}
	.road-pips i.on {
		border-color: var(--t-gold);
		background: var(--t-gold);
	}
	.road-pips b {
		min-width: 19px;
		padding: 0 3px;
		border: 1.5px solid var(--t-line);
		border-radius: 4px;
		font-size: 9.5px;
		line-height: 14px;
		font-weight: 800;
		text-align: center;
		color: var(--t-muted);
	}
	.road-pips b.on {
		border-color: var(--t-gold);
		background: var(--t-gold);
		color: #1a1206;
	}
	.road-pips b.on:last-child {
		border-color: var(--t-hb);
		background: var(--t-hb);
		color: #fff;
	}
	.road-spare {
		opacity: 0.72;
	}
	.road-divider {
		padding: 4px 2px 0;
		list-style: none;
	}
	:global([data-theme='blackout']) .road-card .road-body {
		background: rgb(6 9 12 / 0.2);
	}
	:global([data-theme='blackout']) .road-pips i,
	:global([data-theme='blackout']) .road-pips b {
		border-color: rgb(255 255 255 / 0.55);
		color: rgb(255 255 255 / 0.75);
	}
	:global([data-theme='blackout']) .road-pips i.on,
	:global([data-theme='blackout']) .road-pips b.on {
		border-color: #ffcc33;
		background: #ffcc33;
		color: #2a1a00;
	}
	:global([data-theme='blackout']) .road-track i {
		background: rgb(255 255 255 / 0.16);
	}
	:global([data-theme='blackout']) .road-track i.on {
		background: #ffcc33;
		box-shadow: 0 0 6px rgb(255 150 40 / 0.75);
	}
	:global([data-theme='blackout']) .road-rank {
		color: #fff;
	}
</style>
