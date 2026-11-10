<!--
	Where your ticks are, in the header (2026-11-10, the user's brief: show the truth): "Saved in this
	browser", or with automatic sync on: "Syncing…", "Synced" (only once the sync service has
	confirmed it), "Couldn't sync" (your changes stay here and go out on the next try). A tap goes to
	Backup & other devices. Icon + words, never colour alone.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { sync } from '#lib/sync.svelte.ts';

	const state = $derived.by((): { key: 'saved' | 'notSaving' | 'syncing' | 'synced' | 'offline' | 'error'; tone: string } => {
		if (!progress.canSave) return { key: 'notSaving', tone: 'bad' };
		if (!sync.on) return { key: 'saved', tone: 'ok' };
		if (sync.status === 'synced') return { key: 'synced', tone: 'ok' };
		if (sync.status === 'offline') return { key: 'offline', tone: 'bad' };
		if (sync.status === 'error') return { key: 'error', tone: 'bad' };
		return { key: 'syncing', tone: 'busy' };
	});
	const text = $derived(t.saveStatus[state.key]);
</script>

<a
	href="#sync"
	class="save-status font-head inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold"
	data-tone={state.tone}
	title={t.saveStatus.open}
	onclick={(e) => {
		e.preventDefault();
		document.getElementById('sync')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		document.getElementById('sync-heading')?.focus({ preventScroll: true });
	}}
>
	<svg viewBox="0 0 16 16" class="size-3.5 flex-none" aria-hidden="true" focusable="false">
		{#if state.tone === 'ok'}
			<path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
		{:else if state.tone === 'busy'}
			<path class="spin" d="M8 2.5a5.5 5.5 0 1 1-5.2 3.7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		{:else}
			<path d="M8 2.2 14.3 13.5H1.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><path
				d="M8 6.5v3.2M8 11.6v.1"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
		{/if}
	</svg>
	<span class="truncate" role="status">{text}</span>
</a>

<style>
	.save-status {
		border: 1px solid var(--t-band-line, var(--t-line));
		background: var(--t-band-chip, var(--t-panel));
		color: var(--t-band-fg, var(--t-fg));
		text-shadow: none;
	}
	.save-status[data-tone='ok'] svg {
		color: var(--t-ok);
	}
	.save-status[data-tone='bad'] {
		border-color: var(--t-danger);
	}
	.save-status[data-tone='bad'] svg {
		color: var(--t-danger);
	}
	.spin {
		transform-origin: 8px 8px;
		animation: save-spin 0.9s linear infinite;
	}
	@keyframes save-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spin {
			animation: none;
		}
	}
</style>
