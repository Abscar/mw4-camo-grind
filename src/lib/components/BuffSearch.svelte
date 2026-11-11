<!--
	A small CS2 skin price search in the header's top row (2026-11-11, the user's ask: "a little search
	box up in the corner to look up BUFF163 prices on CS2 skins, wherever it fits WITHOUT moving
	anything"). BUFF163 needs a login to show its market and sends no data to other sites, so we can't
	show prices here: the search opens BUFF's own market search in a new tab.
	It has its own CS2 look in every theme (the user, same day: "separate it from the operator stuff
	under it, this is CS2 not COD, make it stand out"): dark slate with a CS2-style amber edge and a
	solid "CS2" tag, not the page's theme colours.
	≥ 640 px: a slim field between the save status and the theme buttons (the row's empty middle).
	Phones: a 44 px amber-ringed button with a small "CS2" tag; the field drops down under the row in
	its own CS2 panel, so the row itself doesn't change (hidden under 375 px: no free room there).
	All themes, also in compact mode.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';

	const id = $props.id();
	let query = $state('');
	let open = $state(false);
	let root: HTMLDivElement | undefined = $state();
	let toggle: HTMLButtonElement | undefined = $state();
	let dropInput: HTMLInputElement | undefined = $state();

	/** BUFF163's market search for a skin name (BUFF keeps the search in the address's # part). */
	function buffUrl(name: string): string {
		return `https://buff.163.com/market/csgo#game=csgo&page_num=1&search=${encodeURIComponent(name.trim())}&tab=selling`;
	}

	function search(e: SubmitEvent) {
		e.preventDefault();
		const q = query.trim();
		if (!q) return;
		window.open(buffUrl(q), '_blank', 'noopener,noreferrer');
	}

	$effect(() => {
		if (!open) return;
		queueMicrotask(() => dropInput?.focus());
		const onPointer = (e: PointerEvent) => {
			if (root && !root.contains(e.target as Node)) open = false;
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				open = false;
				toggle?.focus();
			}
		};
		document.addEventListener('pointerdown', onPointer);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('pointerdown', onPointer);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

{#snippet glass(cls: string)}
	<svg viewBox="0 0 16 16" class={cls} aria-hidden="true" focusable="false">
		<circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.9" />
		<path d="M10.4 10.4 14 14" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" />
	</svg>
{/snippet}

{#snippet field(inputId: string, where: 'wide' | 'drop')}
	<!-- 44 px tall including the border, like the save status beside it, so the row keeps its height -->
	<form class="cs-field flex h-11 items-stretch rounded-full" role="search" aria-label={t.buff.label} onsubmit={search}>
		<label for={inputId} class="cs-tag flex flex-none items-center gap-1 rounded-full">
			{@render glass('size-3.5 flex-none')}<span aria-hidden="true">CS2</span><span class="sr-only">{t.buff.label}</span>
		</label>
		{#if where === 'drop'}
			<input
				bind:this={dropInput}
				bind:value={query}
				id={inputId}
				type="search"
				enterkeyhint="search"
				autocomplete="off"
				spellcheck="false"
				placeholder={t.buff.placeholder}
				class="cs-input min-w-0 flex-1"
			/>
		{:else}
			<input
				bind:value={query}
				id={inputId}
				type="search"
				enterkeyhint="search"
				autocomplete="off"
				spellcheck="false"
				placeholder={t.buff.placeholder}
				title={t.buff.hint}
				class="cs-input min-w-0 flex-1"
			/>
		{/if}
		<button type="submit" class="cs-go grid w-10 flex-none place-items-center rounded-full" aria-label={t.buff.go} title={t.buff.go}>
			<svg viewBox="0 0 16 16" class="size-4" aria-hidden="true" focusable="false">
				<path d="M3 8h9M8.5 4.2 12.3 8l-3.8 3.8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>
	</form>
{/snippet}

<!-- phones: the button sits in the row's gaps (−8 px each side) so it fits the free room between the
     save status and the theme buttons from 375 px; under 375 px there is no room, so it's left out -->
<div class="buff-search ml-auto flex-none max-sm:-mx-2 max-[374px]:hidden" bind:this={root}>
	<!-- desktop / tablet: the field itself -->
	<div class="hidden w-[232px] sm:block md:w-[256px]">{@render field(`${id}-wide`, 'wide')}</div>

	<!-- phones: an amber-ringed magnifier with a "CS2" tag; it drops the field down under the row -->
	<button
		bind:this={toggle}
		type="button"
		class="cs-btn relative grid size-11 place-items-center rounded-full sm:hidden"
		aria-expanded={open}
		aria-controls="{id}-drop-box"
		aria-label={open ? t.buff.close : t.buff.open}
		title={t.buff.open}
		onclick={() => (open = !open)}
	>
		<span class="cs-btn-ring grid size-9 place-items-center rounded-full">{@render glass('size-4')}</span>
		<span class="cs-btn-tag" aria-hidden="true">CS2</span>
	</button>
	<div id="{id}-drop-box" class="cs-drop absolute inset-x-4 top-12 z-40 grid gap-2 rounded-[14px] p-2.5 sm:hidden" hidden={!open}>
		<p class="cs-drop-head flex items-center gap-2 px-1">
			<span class="cs-chip">CS2</span><span>{t.buff.heading}</span>
		</p>
		{@render field(`${id}-drop`, 'drop')}
		<p class="cs-hint px-1 text-[12px] leading-snug">{t.buff.hint}</p>
	</div>
</div>

<style>
	/* CS2's own colours, the same in every theme, so it doesn't read as part of the CoD tracker */
	.buff-search {
		--cs-bg: #14181d;
		--cs-bg-2: #1d232a;
		--cs-amber: #f0a634;
		--cs-amber-hi: #ffc35c;
		--cs-ink: #e9edf1;
		--cs-muted: #9aa6b2;
	}

	.cs-field {
		border: 1.5px solid var(--cs-amber);
		background: linear-gradient(180deg, var(--cs-bg-2), var(--cs-bg));
		color: var(--cs-ink);
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.55),
			0 0 14px rgb(240 166 52 / 0.28),
			0 4px 12px rgb(0 0 0 / 0.45);
		text-shadow: none;
	}
	.cs-field:focus-within {
		border-color: var(--cs-amber-hi);
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.55),
			0 0 0 3px rgb(240 166 52 / 0.35),
			0 0 18px rgb(240 166 52 / 0.4);
	}

	/* the solid "CS2" tag at the left end of the field (it's also the field's label) */
	.cs-tag {
		margin: 3px 0 3px 3px;
		padding: 0 0.6rem 0 0.55rem;
		background: linear-gradient(180deg, var(--cs-amber-hi), var(--cs-amber));
		color: #1a1206;
		font: 800 12px/1 var(--font-head, inherit);
		letter-spacing: 0.06em;
		cursor: text;
	}

	.cs-input {
		height: 100%;
		padding: 0 0.25rem 0 0.55rem;
		border: 0;
		background: transparent;
		color: inherit;
		font-size: 13px;
		outline: none;
	}
	/* the drop-down on phones: 16px so iPhone Safari doesn't zoom in when the field gets focus */
	.cs-drop .cs-input {
		font-size: 16px;
	}
	.cs-input::placeholder {
		color: var(--cs-muted);
		opacity: 1;
	}
	.cs-input::-webkit-search-cancel-button {
		cursor: pointer;
	}
	.cs-go {
		color: var(--cs-amber);
	}
	.cs-go:hover,
	.cs-go:focus-visible {
		color: var(--cs-amber-hi);
		background: rgb(240 166 52 / 0.14);
	}

	/* phones: the round button */
	.cs-btn {
		color: var(--cs-amber);
	}
	.cs-btn-ring {
		border: 1.5px solid var(--cs-amber);
		background: linear-gradient(180deg, var(--cs-bg-2), var(--cs-bg));
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.55),
			0 0 10px rgb(240 166 52 / 0.35);
	}
	.cs-btn[aria-expanded='true'] .cs-btn-ring {
		border-color: var(--cs-amber-hi);
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.55),
			0 0 0 3px rgb(240 166 52 / 0.35);
	}
	/* the panel below has its own CS2 heading, and the tag would touch its top edge */
	.cs-btn[aria-expanded='true'] .cs-btn-tag {
		visibility: hidden;
	}
	.cs-btn-tag {
		position: absolute;
		bottom: -1px;
		left: 50%;
		translate: -50% 0;
		padding: 1px 4px;
		border-radius: 4px;
		background: var(--cs-amber);
		color: #1a1206;
		font: 800 8.5px/1 var(--font-head, inherit);
		letter-spacing: 0.05em;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.5);
	}

	/* phones: the drop-down panel, clearly its own thing over the header */
	.cs-drop {
		border: 1.5px solid var(--cs-amber);
		background: linear-gradient(180deg, #1f262e, var(--cs-bg));
		color: var(--cs-ink);
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.6),
			0 0 22px rgb(240 166 52 / 0.25),
			0 18px 40px rgb(0 0 0 / 0.6);
		text-shadow: none;
	}
	.cs-drop-head {
		font: 700 12px/1.2 var(--font-head, inherit);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--cs-ink);
	}
	.cs-chip {
		padding: 3px 6px;
		border-radius: 5px;
		background: var(--cs-amber);
		color: #1a1206;
		font-weight: 800;
	}
	.cs-hint {
		color: var(--cs-muted);
	}
</style>
