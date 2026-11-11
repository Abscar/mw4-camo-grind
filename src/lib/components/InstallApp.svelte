<!--
	"Get it as an app" (2026-11-11, the user's pick): a box in "Backup & other devices" that explains
	how to put the tracker on the phone's home screen (manifest + icons in static/, install.svelte.ts).
	Where the browser offers its own install prompt (Chrome, Edge, Android) there's an "Install the
	app" button; on iPhone the Safari steps, plus how to bring the ticks along (an iPhone home-screen
	app can start with its own, empty storage). Hidden when the page already runs as the app, and in
	the offline file (it can't be installed). Shown only after the page has started in the browser.
-->
<script lang="ts">
	import { asset } from '$app/paths';
	import { OFFLINE_FILE } from '#lib/browser.ts';
	import { t } from '#lib/i18n/en.ts';
	import { install } from '#lib/install.svelte.ts';
	import { sync } from '#lib/sync.svelte.ts';

	$effect(() => install.start());

	const show = $derived(!OFFLINE_FILE && install.platform !== null && !install.standalone);
	const icon = OFFLINE_FILE ? '' : asset('icons/icon-192.png');
</script>

{#if show}
	<div class="install-app mt-4 max-w-3xl rounded-card border border-line bg-panel-2 p-3 sm:p-4">
		<div class="flex items-start gap-3">
			<img src={icon} alt="" width="48" height="48" class="size-12 flex-none rounded-[11px] shadow-card" />
			<div class="min-w-0">
				<h3 class="font-head text-[12px] font-bold tracking-[0.12em] uppercase">{t.installApp.heading}</h3>
				<p class="mt-1 text-sm text-muted">{t.installApp.body}</p>
			</div>
		</div>

		{#if install.installed}
			<p class="mt-3 text-sm font-semibold text-fg" role="status"><span aria-hidden="true">✔ </span>{t.installApp.installed}</p>
		{:else}
			{#if install.canPrompt}
				<div class="mt-3"><button type="button" class="btn btn-primary" onclick={() => void install.prompt()}>{t.installApp.install}</button></div>
			{/if}
			{#if install.platform === 'ios'}
				<p class="mt-3 text-[13px] font-semibold text-fg">{t.installApp.iosTitle}</p>
				<ol class="mt-1 grid list-decimal gap-1 pl-5 text-[13px] text-muted">
					{#each t.installApp.iosSteps as step, i (i)}<li>{step}</li>{/each}
					{#if sync.available}<li>{t.installApp.iosSync}</li>{/if}
				</ol>
			{:else if install.platform === 'android' && !install.canPrompt}
				<p class="mt-3 text-[13px] font-semibold text-fg">{t.installApp.androidTitle}</p>
				<ol class="mt-1 grid list-decimal gap-1 pl-5 text-[13px] text-muted">
					{#each t.installApp.androidSteps as step, i (i)}<li>{step}</li>{/each}
				</ol>
			{:else if install.platform === 'other'}
				<p class="mt-3 text-[13px] text-muted"><b class="font-semibold text-fg">{t.installApp.otherTitle}</b> {t.installApp.other}</p>
			{/if}
		{/if}
	</div>
{/if}
