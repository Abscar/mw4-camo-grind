<!--
	The META button in every weapon row: the small "META" sign + red crosshair circle the rows had
	before the 2026-11-10 redesign, now one tap COPIES the gun's Multiplayer meta loadout code
	(data/loadoutCodes.ts) to the clipboard (2026-11-12, the user's ask: "a little button on the guns
	where you tick your camos, tap it and the meta code is copied"). Nine guns only have Apex builds in
	Multiplayer: their code has the Apex, and the toast says so. The code itself only shows when
	"Show codes" is on (codeView), as a small line under the badges; WeaponCard puts that line after
	this button.
	Wide screens: sign left of the circle, level with the name. Phones: sign on top, circle below,
	placed under the name (grind.css) so the long names keep the whole line.
-->
<script lang="ts">
	import { copyCode } from '#lib/browser.ts';
	import { LOADOUT_CODES } from '#lib/data/loadoutCodes.ts';
	import { t } from '#lib/i18n/en.ts';
	import { toast } from '#lib/toast.svelte.ts';

	let { weaponId, weaponName }: { weaponId: string; weaponName: string } = $props();

	const entry = $derived(LOADOUT_CODES[weaponId]);
	/** The Apex in the copied build, if it has one. */
	const apex = $derived(entry?.attachments.find((a) => a.slot === 'Apex')?.name);
	const label = $derived(entry ? t.codes.copyLabel(weaponName, apex) : '');

	/** A copy of the code inside the button, invisible, for the fallback copy (select + copy). */
	let el = $state<HTMLElement>();
	let done = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		if (!entry) return;
		const ok = await copyCode(entry.code, el ?? null);
		clearTimeout(timer);
		done = ok;
		if (ok) timer = setTimeout(() => (done = false), 2200);
		toast.show(ok ? t.codes.toastCopied(weaponName, entry.code, apex) : t.codes.toastFailed(entry.code), undefined, apex ? 6000 : 3500);
	}
</script>

{#if entry}
	<button
		type="button"
		class="meta-class-btn group flex min-h-11 min-w-11 flex-none flex-col items-center justify-start gap-0.5 rounded-full sm:-mt-[7px] sm:h-11 sm:flex-row sm:items-center sm:gap-1 sm:pr-1"
		class:done
		aria-label={label}
		title={label}
		onclick={copy}
	>
		<span
			class="meta-tag font-head rounded-[3px] border border-tick-line bg-tick px-1 text-[9.5px] leading-[15px] font-bold tracking-[0.08em] text-accent uppercase"
			aria-hidden="true">{done ? t.codes.copied : t.codes.tag}</span
		>
		<span class="meta-ring grid size-7 place-items-center rounded-full border border-tick-line bg-tick text-accent transition-colors group-hover:border-accent">
			{#if done}
				<svg viewBox="0 0 16 16" class="size-[15px]" aria-hidden="true" focusable="false"
					><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg
				>
			{:else}
				<svg viewBox="0 0 24 24" class="size-[18px]" aria-hidden="true" focusable="false">
					<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<circle cx="12" cy="12" r="6.5" />
						<path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
					</g>
					<circle cx="12" cy="12" r="1.6" fill="currentColor" />
				</svg>
			{/if}
		</span>
		<span class="code-src" bind:this={el} aria-hidden="true">{entry.code}</span>
	</button>
{/if}

<style>
	/* invisible but selectable, so the old copy command can copy it when the clipboard is blocked */
	.code-src {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		user-select: text;
	}
	.meta-class-btn {
		position: relative;
	}
	.meta-class-btn.done .meta-ring {
		border-color: var(--t-ok);
		color: var(--t-ok);
	}
</style>
