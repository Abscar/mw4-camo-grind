<!--
	The "Hide" button on a part of the page (2026-11-20; the parts are in hideSections.ts). By default a small
	tab sitting on the top-right edge of its box (the parent must be `position: relative`); `inline` puts it in
	a row instead. The pill is 22 px, the tap area 44 px around it. Hiding shows a toast with Undo and moves
	focus to the "Hidden" bar's Choose button (the button itself is gone then).
	`abscar` wraps it in .abscar-only, for parts only that theme draws.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { hidden } from '#lib/hidden.svelte.ts';
	import type { HideId } from '#lib/hideSections.ts';
	import { t } from '#lib/i18n/en.ts';
	import { toast } from '#lib/toast.svelte.ts';

	let {
		id,
		label = t.hide.button,
		inline = false,
		short = false,
		abscar = false,
		class: cls = '',
		style = ''
	}: {
		id: HideId;
		/** the word on the pill */
		label?: string;
		inline?: boolean;
		/** only the icon on phones (< 640 px), for tight rows */
		short?: boolean;
		abscar?: boolean;
		class?: string;
		/** e.g. `--hb-right: 60px` to move an edge tab clear of something */
		style?: string;
	} = $props();

	const name = $derived(t.hide.names[id]);

	async function hide() {
		hidden.set(id, true);
		toast.show(t.hide.hiddenToast(name), { label: t.toast.undo, run: () => hidden.set(id, false) });
		await tick();
		document.getElementById('hidden-choose')?.focus({ preventScroll: true });
	}
</script>

{#snippet button()}
	<button
		type="button"
		class={['hide-btn', inline ? 'inline' : 'edge', cls]}
		{style}
		aria-label={t.hide.buttonLabel(name)}
		title={t.hide.buttonLabel(name)}
		onclick={hide}
	>
		<span class="hide-pill font-head">
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
				<path d="M2.8 12S6.3 5.8 12 5.8 21.2 12 21.2 12 17.7 18.2 12 18.2 2.8 12 2.8 12Z" />
				<circle cx="12" cy="12" r="2.7" />
				<path d="M4.5 19.5 19.5 4.5" />
			</svg>
			<span class={short ? 'max-sm:sr-only' : ''}>{label}</span>
		</span>
	</button>
{/snippet}

{#if abscar}
	<div class="abscar-only">{@render button()}</div>
{:else}
	{@render button()}
{/if}

<style>
	.hide-btn {
		display: inline-grid;
		place-items: center;
		min-width: 44px;
		min-height: 44px;
		flex: none;
		color: var(--t-muted);
		cursor: pointer;
	}
	/* on the box's top-right edge: half the pill above the border, half on it */
	.hide-btn.edge {
		position: absolute;
		z-index: 6;
		top: calc(-22px + var(--hb-dy, 0px));
		right: var(--hb-right, 10px);
	}
	/* in a row: takes only the pill's height there, the tap area hangs over the gaps */
	.hide-btn.inline {
		margin-block: -11px;
	}
	.hide-pill {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 22px;
		padding: 0 8px 0 6px;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		background: var(--t-panel);
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.22);
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.hide-btn.inline .hide-pill {
		box-shadow: none;
		background: color-mix(in srgb, var(--t-panel) 80%, transparent);
	}
	.hide-pill svg {
		width: 13px;
		height: 13px;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2.2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.hide-btn:hover,
	.hide-btn:focus-visible {
		color: var(--t-fg);
	}
	.hide-btn:hover .hide-pill,
	.hide-btn:focus-visible .hide-pill {
		border-color: var(--t-accent);
	}
	.hide-btn:focus-visible {
		outline: none;
	}
	.hide-btn:focus-visible .hide-pill {
		outline: 2px solid var(--t-accent);
		outline-offset: 2px;
	}
	/* Abscar: a dark pill with a thin red edge, readable over the busy header and pictures */
	:global([data-theme='blackout']) .hide-pill {
		background: rgb(20 10 6 / 0.88);
		border-color: rgb(255 68 24 / 0.45);
		color: #e8cfc0;
	}
	:global([data-theme='blackout']) .hide-btn:hover .hide-pill,
	:global([data-theme='blackout']) .hide-btn:focus-visible .hide-pill {
		border-color: #ff4418;
		color: #fff;
	}
</style>
