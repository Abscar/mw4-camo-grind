<!--
	The small copy button on a build card (weapon card's Meta tab, the meta popup, Ranked classes).
	With a `code` it copies the game's loadout code (copy icon); without one it copies the parts as
	text (list icon), since only some sites publish codes (see buildCopy.ts). A little bubble under
	the button says how it went: a modal dialog covers the page's toasts. When copying fails the
	bubble shows the code itself, selected, to copy by hand.
-->
<script lang="ts">
	import { copyCode } from '#lib/browser.ts';
	import { t } from '#lib/i18n/en.ts';

	let { code, text, what }: { code?: string; text: string; what: string } = $props();

	const value = $derived(code ?? text);
	let status = $state<'ok' | 'fail' | null>(null);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let src: HTMLElement | undefined = $state();

	async function copy() {
		const ok = await copyCode(value, src ?? null);
		status = ok ? 'ok' : 'fail';
		clearTimeout(timer);
		timer = setTimeout(() => (status = null), ok ? 2400 : 7000);
	}
</script>

<span class="bc-wrap">
	<button
		type="button"
		class="bc"
		class:done={status === 'ok'}
		class:as-text={!code}
		aria-label={code ? t.codes.copyBuild(what) : t.codes.copyText(what)}
		title={code ? t.codes.copyShort : t.codes.copyTextShort}
		onclick={copy}
	>
		<span class="bc-ring" aria-hidden="true">
			{#if status === 'ok'}
				<svg viewBox="0 0 16 16" width="14" height="14"
					><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg
				>
			{:else if code}
				<svg viewBox="0 0 24 24" width="14" height="14"
					><rect x="8" y="8" width="11" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.4" /><path
						d="M5 15V6a2 2 0 0 1 2-2h8"
						fill="none"
						stroke="currentColor"
						stroke-width="2.4"
						stroke-linecap="round"
					/></svg
				>
			{:else}
				<!-- a list: copies the parts as text -->
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
					><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="0.6" /><circle cx="4.5" cy="12" r="0.6" /><circle
						cx="4.5"
						cy="18"
						r="0.6"
					/></svg
				>
			{/if}
		</span>
		{#if !code}<span class="bc-txt font-head" aria-hidden="true">{t.codes.textTag}</span>{/if}
		<span class="bc-src" bind:this={src} aria-hidden="true">{value}</span>
	</button>
	<span class="bc-bubble" class:show={status} class:fail={status === 'fail'} role="status">
		{#if status === 'ok'}
			{code ? t.codes.copied : t.codes.textCopied}
		{:else if status === 'fail'}
			{t.codes.copyFailedShort}{#if code}<code>{code}</code>{/if}
		{/if}
	</span>
</span>

<style>
	.bc-wrap {
		position: relative;
		display: inline-flex;
		flex: none;
		margin: -8px -8px -8px 0;
	}
	/* a 28 px ring inside a 44 px tap target */
	.bc {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-width: 2.75rem;
		height: 2.75rem;
		border-radius: 999px;
		color: var(--t-accent);
	}
	.bc.as-text {
		padding: 0 8px 0 4px;
	}
	.bc-ring {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 1px solid var(--t-tick-line, var(--t-line));
		border-radius: 999px;
		background: var(--t-tick);
		transition: border-color 0.15s;
	}
	.bc:hover .bc-ring {
		border-color: var(--t-accent);
	}
	.bc-txt {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.bc:hover .bc-txt {
		color: var(--t-fg);
	}
	.bc.done {
		color: var(--t-ok);
	}
	.bc.done .bc-ring {
		border-color: var(--t-ok);
	}
	/* invisible but selectable, for the fallback copy (select + copy command) */
	.bc-src {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: pre;
		user-select: text;
	}
	.bc-bubble {
		position: absolute;
		top: calc(100% - 4px);
		right: 0;
		z-index: 3;
		display: none;
		max-width: 15rem;
		padding: 3px 8px;
		border: 1px solid var(--t-ok);
		border-radius: 6px;
		background: var(--t-panel);
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.4);
		font-size: 11px;
		font-weight: 600;
		line-height: 1.35;
		color: var(--t-fg);
		white-space: nowrap;
	}
	.bc-bubble.show {
		display: block;
	}
	.bc-bubble.fail {
		border-color: var(--t-accent);
		white-space: normal;
		width: max-content;
	}
	.bc-bubble code {
		display: block;
		margin-top: 2px;
		font: 700 13px var(--font-hud);
		user-select: all;
	}
</style>
