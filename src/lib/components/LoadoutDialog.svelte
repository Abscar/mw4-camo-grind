<!--
	The meta-class popup: the Multiplayer and Warzone build for one weapon (+ its Apex box), side by
	side on wide screens and stacked on a phone. Opened from the Meta lists (MetaSection, ClassMeta);
	the builds themselves are MetaBuilds.

	Look (2026-11-12, the user's ask: "the nice red menu, I'd like that when I click the meta classes"):
	the weapon card's HUD file. It borrows the card's dialog shell (`wc-dlg`, global in WeaponSheet:
	fixed height, red terminal screen in Abscar, own panel colours in the other themes) and draws the
	same header (kicker, big name, cartoon, ×); only the panel scrolls.
-->
<script lang="ts">
	import { LOADOUTS_AS_OF } from '#lib/data/loadouts.ts';
	import { META_RANKS } from '#lib/data/metaRanks.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { loadoutView } from '#lib/loadoutView.svelte.ts';
	import { shortDate } from '#lib/ui.ts';
	import Dialog from './Dialog.svelte';
	import MetaBuilds from './MetaBuilds.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const weapon = $derived(loadoutView.weaponId ? WEAPON_BY_ID.get(loadoutView.weaponId) : undefined);
	const look = $derived(weapon ? WEAPON_LOOKS[weapon.id] : undefined);
	const cls = $derived(weapon ? CLASSES.find((c) => c.id === weapon.classId) : undefined);
	/** Its place in the Multiplayer list of its class (metaRanks.ts), as in the weapon card. */
	const meta = $derived.by(() => {
		if (!weapon) return null;
		const list = META_RANKS.mp.classes[weapon.classId];
		const i = list ? list.findIndex((p) => p.id === weapon.id) : -1;
		return list && i >= 0 ? { pick: list[i], rank: i + 1 } : null;
	});
</script>

{#snippet card(titleId: string)}
	{#if weapon}
		<header class="ld-head">
			<div class="flex items-start gap-3">
				<div class="min-w-0 flex-1">
					<p class="ld-kicker"><span aria-hidden="true">▸ </span>{t.loadout.file} // {cls?.name}</p>
					<h2 id={titleId} class="ld-title">{weapon.name}</h2>
				</div>
				{#if look}<div class="ld-gun"><WeaponIcon {look} /></div>{/if}
				<button type="button" class="icon-btn ld-x" aria-label={t.loadout.close} title={t.loadout.close} onclick={() => loadoutView.close()}>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
						><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" /></svg
					>
				</button>
			</div>
			{#if meta && cls}
				<p class="ld-tier">
					{t.sheet.metaTier(meta.pick.tier, meta.rank, cls.name, shortDate(META_RANKS.mp.date))}{#if !meta.pick.verified}<span
							class="unverified ml-1">({t.unverified}{meta.pick.note ? `: ${meta.pick.note}` : ''})</span
						>{/if}
				</p>
			{/if}
		</header>

		<div class="ld-panel">
			<h3 class="ld-h"><span>{t.sheet.metaHeading}</span></h3>
			<MetaBuilds weaponId={weapon.id} />
			<p class="ld-fine">{t.loadout.snapshot(shortDate(LOADOUTS_AS_OF))}</p>
		</div>
	{/if}
{/snippet}

<Dialog
	bind:open={
		() => loadoutView.open,
		(v) => {
			if (!v) loadoutView.close();
		}
	}
	title={weapon ? t.loadout.title(weapon.name) : ''}
	class="wc-dlg ld-dlg"
	custom={card}
/>

<style>
	/* a little wider than the weapon card (the MP and WZ builds sit side by side), and only as tall
	   as its content: no tabs here, so nothing jumps (fit-content, not auto: a modal <dialog> is
	   fixed with top and bottom 0, so auto would stretch it to the full screen) */
	:global(dialog.wc-dlg.ld-dlg) {
		width: min(40rem, calc(100vw - 1.5rem));
		height: fit-content;
		max-height: min(48rem, calc(100dvh - 1.5rem));
	}

	.ld-head {
		flex: none;
		padding: 14px 10px 12px 18px;
		border-bottom: 1px solid var(--t-line);
	}
	.ld-kicker {
		font: 600 11px var(--font-hud);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.ld-title {
		margin-top: 2px;
		font: 800 27px/1.05 var(--t-font-head);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--t-fg);
		overflow-wrap: anywhere;
	}
	:global([data-theme='blackout']) .ld-title {
		text-shadow:
			0 0 12px rgb(255 68 24 / 0.55),
			0 2px 0 #000;
	}
	.ld-gun {
		align-self: center;
	}
	.ld-gun :global(.weapon-icon) {
		width: 96px;
		height: 36px;
	}
	/* phones: no room for the cartoon next to the name and the × */
	@media (max-width: 519px) {
		.ld-gun {
			display: none;
		}
	}
	.ld-x {
		color: var(--t-fg);
	}
	.ld-x:hover {
		background: color-mix(in srgb, var(--t-fg) 8%, transparent);
	}
	.ld-tier {
		margin-top: 8px;
		padding-right: 8px;
		font-size: 13px;
		color: var(--t-muted);
	}

	.ld-panel {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 16px 18px 22px;
		font-size: 14px;
		color: var(--t-muted);
	}
	.ld-h {
		margin-bottom: 10px;
		font: 700 12px var(--font-hud);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.ld-h > :first-child::before {
		content: '▸ ';
	}
	.ld-fine {
		margin-top: 10px;
		font-size: 11.5px;
		line-height: 1.4;
	}
</style>
