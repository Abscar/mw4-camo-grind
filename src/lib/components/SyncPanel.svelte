<script lang="ts">
	import { backupFilename, copyText, downloadText, progressLink } from '#lib/browser.ts';
	import { t } from '#lib/i18n/en.ts';
	import { migrate } from '#lib/progress-codec.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';

	let fileInput = $state<HTMLInputElement>();
	let linkOpen = $state(false);
	let resetOpen = $state(false);
	let link = $state<string | null>(null);
	let linkInput = $state<HTMLInputElement>();
	let copied = $state<boolean | null>(null);
	const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

	const btn =
		'font-head min-h-11 rounded-full border px-4 text-[13px] font-semibold transition-colors';
	const plain = `${btn} border-line bg-panel-2 text-fg hover:border-accent`;
	const primary = `${btn} border-accent bg-accent text-on-accent`;
	const danger = `${btn} border-line bg-panel-2 text-danger hover:border-danger`;

	function exportBackup() {
		downloadText(backupFilename(), progress.exportJson());
		toast.show(t.toast.exported);
	}

	function openLink() {
		link = progressLink(progress.snapshot());
		copied = null;
		linkOpen = true;
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

	async function importBackup(file: File) {
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
		const before = progress.replace(migrated.progress);
		toast.show(t.toast.imported, { label: t.toast.undo, run: () => progress.replace(before) });
	}

	function doReset() {
		resetOpen = false;
		const before = progress.reset();
		toast.show(t.toast.reset, { label: t.toast.undo, run: () => progress.replace(before) });
	}
</script>

<section id="sync" class="rounded-card bg-panel px-4 py-4 shadow-card sm:px-5" aria-labelledby="sync-heading">
	<h2 id="sync-heading" class="font-head text-base font-bold tracking-wide uppercase">{t.sync.heading}</h2>
	<p class="mt-1.5 max-w-3xl text-sm text-muted">{t.sync.intro}</p>
	<div class="mt-4 flex flex-wrap gap-2">
		<button type="button" class={primary} onclick={openLink}>{t.sync.copyLink}</button>
		<button type="button" class={plain} onclick={exportBackup}>{t.sync.exportFile}</button>
		<button type="button" class={plain} onclick={() => fileInput?.click()}>{t.sync.importFile}</button>
		<button type="button" class={danger} onclick={() => (resetOpen = true)}>{t.sync.reset}</button>
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

<Dialog bind:open={linkOpen} title={t.sync.linkDialogTitle}>
	{#if link}
		<p>{t.sync.linkDialogBody}</p>
		<input
			bind:this={linkInput}
			readonly
			value={link}
			aria-label={t.sync.linkDialogTitle}
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

<Dialog bind:open={resetOpen} title={t.reset.title}>
	<p>{t.reset.body}</p>
	{#snippet actions()}
		<button type="button" class={plain} onclick={() => (resetOpen = false)}>{t.reset.cancel}</button>
		<button type="button" class={plain} onclick={exportBackup}>{t.reset.exportFirst}</button>
		<button type="button" class="{btn} border-danger bg-danger text-white" onclick={doReset}>{t.reset.confirm}</button>
	{/snippet}
</Dialog>
