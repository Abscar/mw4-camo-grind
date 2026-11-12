<!--
	The page's two big tabs (2026-11-12, the user's ask): "Camo grind" (the tracker as before) and
	"Ranked prep" (RankedSection: CDL rules, bans, ranked meta classes, ranked info). A real tablist:
	arrow keys / Home / End move between them; the choice is remembered per device (pageTab.svelte.ts).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { PAGE_TABS, pageTab, type PageTab } from '#lib/pageTab.svelte.ts';

	let { panelId }: { panelId: string } = $props();

	function keys(e: KeyboardEvent) {
		const i = PAGE_TABS.indexOf(pageTab.current);
		const n = PAGE_TABS.length;
		const next =
			e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
		if (next === null) return;
		e.preventDefault();
		const tab: PageTab = PAGE_TABS[(next + n) % n];
		pageTab.set(tab);
		document.getElementById(`page-tab-${tab}`)?.focus();
	}
</script>

<div class="rank-tabs" role="tablist" aria-label={t.rankTabs.label}>
	{#each PAGE_TABS as k (k)}
		<button
			type="button"
			role="tab"
			id="page-tab-{k}"
			class="rank-tab"
			data-tab={k}
			aria-selected={pageTab.current === k}
			aria-controls={panelId}
			tabindex={pageTab.current === k ? 0 : -1}
			onclick={() => pageTab.set(k)}
			onkeydown={keys}
		>
			<span class="pt-icon" aria-hidden="true">
				{#if k === 'grind'}
					<!-- a camo swatch: three stripes -->
					<svg viewBox="0 0 24 24" width="22" height="22"
						><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2" /><path
							d="M3 13c4-3 7 2 11-1s5-2 7-3M3 17c4-2 6 1 10-1s6-3 8-2"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
						/></svg
					>
				{:else}
					<!-- a ranked chevron shield -->
					<svg viewBox="0 0 24 24" width="22" height="22"
						><path d="M12 2.5l8 3v6.2c0 4.6-3.3 8.3-8 9.8-4.7-1.5-8-5.2-8-9.8V5.5z" fill="none" stroke="currentColor" stroke-width="2" /><path
							d="M8 10.5l4 3 4-3M8 14.5l4 3 4-3"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linejoin="round"
						/></svg
					>
				{/if}
			</span>
			<span class="min-w-0 text-left">
				<span class="pt-name font-head">{t.rankTabs.tabs[k].name}</span>
				<span class="pt-sub">{t.rankTabs.tabs[k].sub}</span>
			</span>
		</button>
	{/each}
</div>

<style>
	.rank-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.rank-tab {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 3.6rem;
		padding: 8px 14px;
		border: 1px solid var(--t-line);
		border-bottom-width: 3px;
		border-radius: var(--t-radius);
		background: var(--t-panel);
		color: var(--t-muted);
		box-shadow: var(--t-shadow);
		transition:
			color 0.15s,
			border-color 0.15s,
			background 0.15s;
	}
	.rank-tab:hover {
		color: var(--t-fg);
		border-color: color-mix(in srgb, var(--t-accent) 55%, var(--t-line));
	}
	.rank-tab[aria-selected='true'] {
		color: var(--t-fg);
		border-color: color-mix(in srgb, var(--t-accent) 45%, var(--t-line));
		border-bottom-color: var(--t-accent);
		background: linear-gradient(to top, color-mix(in srgb, var(--t-accent) 18%, var(--t-panel)), var(--t-panel));
	}
	.pt-icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 9px;
		background: color-mix(in srgb, var(--t-fg) 7%, transparent);
	}
	.rank-tab[aria-selected='true'] .pt-icon {
		color: var(--t-accent);
		background: color-mix(in srgb, var(--t-accent) 16%, transparent);
	}
	.pt-name {
		display: block;
		font-size: 15px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		line-height: 1.15;
	}
	.pt-sub {
		display: block;
		font-size: 11.5px;
		line-height: 1.25;
		color: var(--t-muted);
	}
	@media (max-width: 479px) {
		.rank-tab {
			padding: 8px 10px;
			gap: 8px;
		}
		.pt-icon {
			width: 30px;
			height: 30px;
		}
		.pt-name {
			font-size: 13.5px;
			letter-spacing: 0.05em;
		}
		.pt-sub {
			display: none;
		}
	}

	/* Abscar: dark gunmetal glass, the selected tab glows like the fire-edged boxes */
	:global([data-theme='blackout']) .rank-tab {
		background: linear-gradient(180deg, #3a4249, #1f2427);
		border-color: rgba(255, 255, 255, 0.14);
		border-bottom-color: rgba(255, 255, 255, 0.2);
		color: #c9d1d6;
	}
	:global([data-theme='blackout']) .rank-tab[aria-selected='true'] {
		color: #fff;
		border-color: #ffd23a;
		border-bottom-color: #ff8a1e;
		background: linear-gradient(180deg, #4b555d, #242a2e);
		box-shadow:
			0 0 0 1px rgba(255, 200, 40, 0.35),
			0 0 14px rgba(255, 120, 20, 0.45),
			0 -4px 18px rgba(255, 50, 20, 0.25);
	}
	:global([data-theme='blackout']) .rank-tab[aria-selected='true'] .pt-icon {
		color: #ffcc33;
		background: rgba(255, 140, 30, 0.16);
	}
	:global([data-theme='blackout']) .pt-sub {
		color: #9aa6ad;
	}
	:global([data-theme='blackout']) .rank-tab[aria-selected='true'] .pt-name {
		text-shadow: 0 1px 2px #000;
	}
</style>
