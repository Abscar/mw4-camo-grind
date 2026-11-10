<script lang="ts">
	import { untrack } from 'svelte';
	import { backupFilename, copyText, downloadText, progressLink } from '#lib/browser.ts';
	import { LADDER } from '#lib/data/camos.ts';
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { migrate, type Migrated, type ProgressData } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { fetchRemote, sync } from '#lib/sync.svelte.ts';
	import { syncCodeFromText, type SyncDoc } from '#lib/sync-codec.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';

	let fileInput = $state<HTMLInputElement>();
	let linkOpen = $state(false);
	let resetOpen = $state(false);
	let resetKind = $state<'preset' | 'zero'>('preset');
	/** A backup file that passed the checks, waiting for you to confirm. */
	let importOffer = $state<{ migrated: Migrated; exported: string | null } | null>(null);
	let importOpen = $state(false);
	/** The link dialog shows either the progress link or the sync link. */
	let linkKind = $state<'progress' | 'sync'>('progress');
	let link = $state<string | null>(null);
	let linkInput = $state<HTMLInputElement>();
	let copied = $state<boolean | null>(null);
	const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

	// automatic sync
	let busy = $state(false);
	let pasteOpen = $state(false);
	let pasteText = $state('');
	let pasteBad = $state(false);
	let joinOpen = $state(false);
	let joinOffer = $state<{ code: string; rev: number; doc: SyncDoc } | null>(null);

	const btn = 'btn';
	const plain = 'btn';
	const primary = 'btn btn-primary';
	const danger = 'btn btn-danger';

	// Sync starts once saved progress has been read (+page.svelte's onMount sets progress.ready).
	$effect(() => {
		if (!progress.ready) return;
		return untrack(() => sync.start());
	});

	// A sync link was opened on this page: look at it, then ask (or just join on a fresh device).
	$effect(() => {
		const code = sync.offer;
		if (!code) return;
		untrack(() => {
			sync.offer = null;
			void considerSyncCode(code);
		});
	});

	const syncStatus = $derived(
		sync.status === 'synced' && sync.syncedAt
			? t.autoSync.syncedAt(
					new Date(sync.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
				)
			: t.autoSync.status[sync.status]
	);

	function summary(p: ProgressData): string {
		const [gold, plat, hb] = LADDER.map((_, i) => WEAPONS.filter((w) => (p.weapons[w.id] ?? 0) > i).length);
		return t.summary(gold, plat, hb);
	}

	function exportBackup() {
		downloadText(backupFilename(), progress.exportJson());
		toast.show(t.toast.exported);
	}

	function showLink(kind: 'progress' | 'sync', url: string | null) {
		linkKind = kind;
		link = url;
		copied = null;
		linkOpen = true;
	}

	function openLink() {
		showLink('progress', progressLink(progress.snapshot()));
	}

	async function copyLink() {
		if (!link) return;
		copied = await copyText(link);
		if (!copied) {
			// The browser didn't allow it: select the link so a normal copy works.
			linkInput?.focus();
			linkInput?.select();
		}
	}

	async function shareLink() {
		if (!link) return;
		try {
			await navigator.share({ title: t.pageTitle, url: link });
		} catch {
			// user closed the share sheet
		}
	}

	async function turnOnSync() {
		busy = true;
		await sync.turnOn();
		busy = false;
		toast.show(t.autoSync.toastOn);
		showLink('sync', sync.link());
	}

	function turnOffSync() {
		sync.turnOff();
		toast.show(t.autoSync.toastOff);
	}

	function usePastedLink() {
		const code = syncCodeFromText(pasteText);
		pasteBad = code === null;
		if (!code) return;
		pasteOpen = false;
		pasteText = '';
		void considerSyncCode(code);
	}

	/** Nothing here worth keeping: no ticks beyond the defaults, no notes, no focus list. */
	function freshDevice(): boolean {
		return progress.isDefault() && Object.keys(progress.notes).length === 0 && progress.prefs.focus.length === 0;
	}

	async function considerSyncCode(code: string) {
		if (code === sync.code) {
			toast.show(t.autoSync.toastAlready);
			return;
		}
		busy = true;
		const remote = await fetchRemote(code);
		busy = false;
		if (remote === 'not-found') toast.show(t.autoSync.toastNotFound, undefined, 7000);
		else if (remote === 'offline') toast.show(t.autoSync.toastOffline, undefined, 7000);
		else if (remote === 'error') toast.show(t.autoSync.toastError, undefined, 7000);
		else if (freshDevice()) await joinSync(code, remote, 'use');
		else {
			joinOffer = { code, ...remote };
			joinOpen = true;
		}
	}

	async function joinSync(code: string, remote: { rev: number; doc: SyncDoc }, how: 'use' | 'combine') {
		joinOpen = false;
		joinOffer = null;
		const before = await sync.join(code, remote, how);
		toast.show(
			t.autoSync.toastJoined,
			how === 'use'
				? {
						label: t.toast.undo,
						// back to what this device had, and not syncing (so the other devices keep theirs)
						run: () => {
							sync.turnOff();
							progress.applySynced(before);
						}
					}
				: undefined
		);
	}

	/** Read and check a backup file first; nothing changes until you confirm (applyImport). */
	async function importBackup(file: File) {
		if (file.size > 1_000_000) {
			toast.show(t.importCheck.tooBig);
			return;
		}
		let data: unknown;
		try {
			data = JSON.parse(await file.text());
		} catch {
			data = undefined;
		}
		const migrated = migrate(data);
		if (!migrated) {
			toast.show(t.toast.badFile);
			return;
		}
		const raw = data as { exported?: unknown };
		const exported = typeof raw.exported === 'string' && Number.isFinite(Date.parse(raw.exported)) ? raw.exported : null;
		importOffer = { migrated, exported };
		importOpen = true;
	}

	function applyImport() {
		const offer = importOffer;
		importOpen = false;
		importOffer = null;
		if (!offer) return;
		const migrated = offer.migrated;
		// backups from 2026-11-07 on also hold your notes; older ones leave the notes you have alone
		const notesBefore = { ...progress.notes };
		const before = progress.replace(migrated.progress);
		if (migrated.notes) progress.setNotes(migrated.notes);
		toast.show(t.toast.imported, {
			label: t.toast.undo,
			run: () => {
				progress.replace(before);
				if (migrated.notes) progress.setNotes(notesBefore);
			}
		});
	}

	function doReset() {
		resetOpen = false;
		const before = progress.reset(resetKind);
		toast.show(t.toast.reset, { label: t.toast.undo, run: () => progress.replace(before) });
	}
</script>

<section id="sync" class="rounded-card bg-panel px-4 py-4 shadow-card sm:px-5" aria-labelledby="sync-heading">
	<h2 id="sync-heading" tabindex="-1" class="font-head text-base font-bold tracking-wide uppercase outline-none">{t.sync.heading}</h2>
	<p class="mt-1.5 max-w-3xl text-sm text-muted">{sync.available ? t.sync.introSync : t.sync.intro}</p>

	{#if sync.available}
		<div class="auto-sync mt-4 max-w-3xl rounded-card border border-line bg-panel-2 p-3 sm:p-4">
			<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
				<h3 class="font-head text-[12px] font-bold tracking-[0.12em] uppercase">{t.autoSync.heading}</h3>
				{#if sync.on}
					<p class="flex items-center gap-1.5 text-[13px] text-fg" role="status">
						<span class="sync-dot size-2 flex-none rounded-full" data-status={sync.status} aria-hidden="true"></span>
						{syncStatus}
					</p>
				{/if}
			</div>
			<p class="mt-1 text-sm text-muted">{sync.on ? t.autoSync.onText : t.autoSync.offText}</p>
			<div class="mt-3 flex flex-wrap gap-2">
				{#if sync.on}
					<button type="button" class={primary} onclick={() => showLink('sync', sync.link())}
						>{t.autoSync.showLink}</button
					>
					<button type="button" class={plain} onclick={() => void sync.syncNow()}>{t.autoSync.syncNow}</button>
					<button type="button" class={plain} onclick={turnOffSync}>{t.autoSync.turnOff}</button>
				{:else}
					<button type="button" class={primary} disabled={busy} onclick={turnOnSync}>{t.autoSync.turnOn}</button>
					<button type="button" class={plain} disabled={busy} onclick={() => (pasteOpen = true)}
						>{t.autoSync.haveLink}</button
					>
				{/if}
			</div>
		</div>
	{/if}

	<div class="mt-4 flex flex-wrap gap-2">
		<button type="button" class={sync.available ? plain : primary} onclick={openLink}>{t.sync.copyLink}</button>
		<button type="button" class={plain} onclick={exportBackup}>{t.sync.exportFile}</button>
		<button type="button" class={plain} onclick={() => fileInput?.click()}>{t.sync.importFile}</button>
		<button type="button" class={danger} onclick={() => {
				resetKind = 'preset';
				resetOpen = true;
			}}>{t.sync.reset}</button>
	</div>
	<input
		bind:this={fileInput}
		type="file"
		accept=".json,application/json"
		class="hidden"
		onchange={(e) => {
			const file = e.currentTarget.files?.[0];
			e.currentTarget.value = '';
			if (file) void importBackup(file);
		}}
	/>
</section>

<Dialog bind:open={linkOpen} title={linkKind === 'sync' ? t.autoSync.linkTitle : t.sync.linkDialogTitle}>
	{#if link}
		<p>{linkKind === 'sync' ? t.autoSync.linkBody : t.sync.linkDialogBody}</p>
		<input
			bind:this={linkInput}
			readonly
			value={link}
			aria-label={linkKind === 'sync' ? t.autoSync.linkTitle : t.sync.linkDialogTitle}
			class="mt-3 h-11 w-full rounded-lg border border-line bg-panel-2 px-3 font-mono text-xs text-fg"
			onfocus={(e) => e.currentTarget.select()}
		/>
		{#if copied === false}
			<p class="mt-2 text-xs" role="alert">{t.sync.linkCopyManual}</p>
		{/if}
	{:else}
		<p>{t.sync.linkNotAvailable}</p>
	{/if}
	{#snippet actions()}
		{#if link && canShare}
			<button type="button" class={plain} onclick={shareLink}>{t.sync.linkShare}</button>
		{/if}
		{#if link}
			<button type="button" class={primary} onclick={copyLink} aria-live="polite"
				>{copied === true ? `✔ ${t.sync.linkCopied}` : t.sync.linkCopy}</button
			>
		{/if}
		<button type="button" class={plain} onclick={() => (linkOpen = false)}>{t.sync.close}</button>
	{/snippet}
</Dialog>

<Dialog bind:open={pasteOpen} title={t.autoSync.pasteTitle}>
	<form
		id="sync-paste"
		onsubmit={(e) => {
			e.preventDefault();
			usePastedLink();
		}}
	>
		<label for="sync-paste-input">{t.autoSync.pasteBody}</label>
		<input
			id="sync-paste-input"
			bind:value={pasteText}
			autocomplete="off"
			spellcheck="false"
			placeholder="https://…#sync=…"
			aria-label={t.autoSync.pasteLabel}
			class="mt-3 h-11 w-full rounded-lg border border-line bg-panel-2 px-3 font-mono text-base text-fg outline-none focus:border-accent sm:text-xs"
			oninput={() => (pasteBad = false)}
		/>
		{#if pasteBad}
			<p class="mt-2 text-xs text-fg" role="alert">{t.autoSync.pasteBad}</p>
		{/if}
	</form>
	{#snippet actions()}
		<button type="button" class={plain} onclick={() => (pasteOpen = false)}>{t.autoSync.cancel}</button>
		<button type="submit" form="sync-paste" class={primary}>{t.autoSync.pasteUse}</button>
	{/snippet}
</Dialog>

<Dialog bind:open={joinOpen} title={t.autoSync.joinTitle}>
	{#if joinOffer}
		<p>{t.autoSync.joinBody(summary(joinOffer.doc.progress), summary(progress.snapshot()))}</p>
		<p class="mt-2">{t.autoSync.joinHint}</p>
	{/if}
	{#snippet actions()}
		<button type="button" class={plain} onclick={() => (joinOpen = false)}>{t.autoSync.cancel}</button>
		<button
			type="button"
			class={plain}
			onclick={() => joinOffer && void joinSync(joinOffer.code, joinOffer, 'use')}>{t.autoSync.joinUse}</button
		>
		<button
			type="button"
			class={primary}
			onclick={() => joinOffer && void joinSync(joinOffer.code, joinOffer, 'combine')}>{t.autoSync.joinCombine}</button
		>
	{/snippet}
</Dialog>

<Dialog bind:open={importOpen} title={t.importCheck.title}>
	{#if importOffer}
		<p>{t.importCheck.body(summary(importOffer.migrated.progress), summary(progress.snapshot()))}</p>
		{#if importOffer.exported}
			<p class="mt-2">{t.importCheck.exported(new Date(importOffer.exported).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))}</p>
		{/if}
		<p class="mt-2">
			{importOffer.migrated.notes ? t.importCheck.notes(Object.keys(importOffer.migrated.notes).length) : t.importCheck.noNotes}
		</p>
		{#if sync.on}<p class="mt-2 font-semibold text-fg">{t.autoSync.resetNote}</p>{/if}
	{/if}
	{#snippet actions()}
		<button type="button" class={plain} onclick={() => (importOpen = false)}>{t.importCheck.cancel}</button>
		<button type="button" class={plain} onclick={exportBackup}>{t.reset.exportFirst}</button>
		<button type="button" class={primary} onclick={applyImport}>{t.importCheck.use}</button>
	{/snippet}
</Dialog>

<Dialog bind:open={resetOpen} title={t.reset.title}>
	<p>{t.reset.body}</p>
	<fieldset class="mt-3 grid gap-2">
		<legend class="sr-only">{t.reset.title}</legend>
		{#each [{ kind: 'preset', label: t.reset.presetLabel, body: t.reset.presetBody(WEAPONS.filter((w) => w.season === 'launch').length) }, { kind: 'zero', label: t.reset.zeroLabel, body: t.reset.zeroBody }] as const as opt (opt.kind)}
			<label class="reset-opt flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-panel-2 p-3">
				<input type="radio" name="reset-kind" value={opt.kind} bind:group={resetKind} class="mt-1 size-4 flex-none accent-(--t-accent)" />
				<span><b class="font-semibold text-fg">{opt.label}</b><span class="mt-0.5 block text-[12.5px]">{opt.body}</span></span>
			</label>
		{/each}
	</fieldset>
	{#if sync.on}<p class="mt-2 font-semibold text-fg">{t.autoSync.resetNote}</p>{/if}
	{#snippet actions()}
		<button type="button" class={plain} onclick={() => (resetOpen = false)}>{t.reset.cancel}</button>
		<button type="button" class={plain} onclick={exportBackup}>{t.reset.exportFirst}</button>
		<button type="button" class="btn btn-danger-solid" onclick={doReset}>{t.reset.confirm}</button>
	{/snippet}
</Dialog>

<style>
	.sync-dot {
		background: var(--t-muted, currentColor);
	}
	.sync-dot[data-status='synced'] {
		background: var(--t-buff, #3fb950);
		box-shadow: 0 0 6px var(--t-buff, #3fb950);
	}
	.sync-dot[data-status='syncing'] {
		background: var(--t-accent);
		animation: sync-pulse 1s ease-in-out infinite alternate;
	}
	.sync-dot[data-status='error'] {
		background: var(--t-danger, #e5484d);
	}
	@keyframes sync-pulse {
		to {
			opacity: 0.3;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sync-dot[data-status='syncing'] {
			animation: none;
		}
	}
</style>
