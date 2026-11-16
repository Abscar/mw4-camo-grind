<!--
	Squad classes (2026-11-16, idea 3 of the squad-link brainstorm: "everyone saves the code of the
	class they actually run on a gun, the others copy it in one tap"). A box in the Squad tab: every
	member's shared classes, newest first, filter by gun, a copy button each; "Share a class" pastes a
	build code (the gun is read from the code, buildPrefix.ts) or starts from one of the gun's
	published builds. The same classes show in the weapon card's Meta tab ("Your squad runs",
	MetaBuilds.svelte).
-->
<script lang="ts">
	import { knownCodes, weaponFromCode } from '#lib/buildPrefix.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad, type SquadEntry } from '#lib/squad.svelte.ts';
	import { cleanClassName, liveClasses, normaliseCode, CLASS_KINDS, CLASS_MAX, CLASS_NAME_MAX, type ClassKind } from '#lib/squad-classes.ts';
	import { agoParts } from '#lib/squad-codec.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';
	import SquadClassRow from './SquadClassRow.svelte';

	let { entries }: { entries: SquadEntry[] } = $props();
	const c = t.squad.classes;

	/** Every shared class, newest first, with who shares it. */
	const all = $derived(entries.flatMap((e) => liveClasses(e.member.classes).map((cls) => ({ cls, e }))).sort((a, b) => b.cls.at - a.cls.at));
	/** Guns with at least one shared class, in the catalogue's order (for the filter). */
	const guns = $derived(CLASSES.flatMap((k) => k.weapons.filter((w) => all.some((x) => x.cls.w === w.id))));
	let gun = $state('');
	const shown = $derived(gun ? all.filter((x) => x.cls.w === gun) : all);
	const ago = (ms: number) => c.saved(t.squad.ago(agoParts(ms, squad.now)));
	const mineCount = $derived(liveClasses(squad.classes).length);

	// ----- the form -----

	let open = $state(false);
	let codeText = $state('');
	let w = $state('');
	let kind = $state<ClassKind>('mp');
	let name = $state('');
	let known = $state('');
	let tried = $state(false);
	let busy = $state(false);
	let fullMsg = $state(false);

	/** Classes that have a Gunsmith (launchers and the knife have no build codes). */
	const GUN_CLASSES = CLASSES.filter((k) => k.weapons.some((g) => knownCodes(g.id).length));
	const code = $derived(normaliseCode(codeText));
	const codeGun = $derived(weaponFromCode(code));
	const knownList = $derived(w ? knownCodes(w) : []);

	function openForm() {
		codeText = '';
		w = '';
		kind = 'mp';
		name = '';
		known = '';
		tried = false;
		fullMsg = mineCount >= CLASS_MAX;
		open = true;
	}

	// a pasted code names its gun: pick it (the select can still be changed)
	let lastAuto: string | null = null;
	$effect(() => {
		const g = codeGun;
		if (g && g !== lastAuto) {
			lastAuto = g;
			w = g;
		}
	});

	function pickKnown(value: string) {
		known = value;
		const k = knownList.find((x) => x.code === value);
		if (!k) return;
		codeText = k.code;
		kind = k.kind;
		if (!name.trim()) name = cleanClassName(k.label);
	}

	async function save() {
		tried = true;
		if (!code || !w || !WEAPON_BY_ID.has(w)) return;
		busy = true;
		const result = await squad.addClass({ w, code, kind, ...(cleanClassName(name) ? { name: cleanClassName(name) } : {}) });
		busy = false;
		if (result === 'full') {
			fullMsg = true;
			return;
		}
		open = false;
		gun = '';
		toast.show(result === 'ok' ? c.sharedOk : c.sharedOffline);
	}

	async function remove(id: string) {
		await squad.removeClass(id);
		toast.show(c.removed);
	}
</script>

<section class="sq-classes" aria-labelledby="sq-classes-h">
	<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
		<h3 id="sq-classes-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{c.heading}</h3>
		<button type="button" class="btn btn-sm btn-primary" onclick={openForm}>{c.add}</button>
	</div>
	<p class="mt-1 max-w-3xl text-xs text-muted">{c.note}</p>

	{#if all.length === 0}
		<p class="mt-3 text-sm text-muted">{c.empty}</p>
	{:else}
		{#if guns.length > 1}
			<label class="mt-2 flex flex-wrap items-center gap-2">
				<span class="text-[11px] font-semibold tracking-wider text-muted uppercase">{c.filterLabel}</span>
				<select bind:value={gun} class="field h-11 min-w-0 rounded-lg border border-line bg-panel-2 px-2 text-sm text-fg">
					<option value="">{c.allGuns} ({all.length})</option>
					{#each guns as g (g.id)}
						<option value={g.id}>{g.name} ({all.filter((x) => x.cls.w === g.id).length})</option>
					{/each}
				</select>
			</label>
		{/if}
		<ul class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,330px),1fr))] gap-1.5">
			{#each shown as { cls, e } (e.id + cls.id)}
				<SquadClassRow {cls} who={e.member.name} op={e.member.op} mine={e.mine} ago={ago(cls.at)} onremove={() => void remove(cls.id)} />
			{/each}
		</ul>
	{/if}
</section>

<Dialog bind:open title={c.title}>
	<p>{c.where}</p>
	<form
		id="sq-classes-form"
		class="mt-3 grid gap-3"
		novalidate
		onsubmit={(ev) => {
			ev.preventDefault();
			void save();
		}}
	>
		{#if fullMsg}
			<p class="text-[13px] font-semibold text-fg" role="alert">{c.full(CLASS_MAX)}</p>
		{/if}
		<label class="grid min-w-0 gap-1">
			<span class="text-[13px] font-semibold text-fg">{c.codeField}</span>
			<input
				bind:value={codeText}
				autocomplete="off"
				autocapitalize="characters"
				spellcheck="false"
				placeholder="B04-3KA95-TI247-BF11"
				aria-invalid={tried && !code}
				class="sq-kin h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-3 font-mono text-base text-fg uppercase outline-none focus:border-accent"
			/>
			{#if codeText.trim() && !code}
				<span class="text-xs text-fg" role="alert">{c.codeBad}</span>
			{:else if tried && !code}
				<span class="text-xs text-fg" role="alert">{c.codeEmpty}</span>
			{:else if code && codeGun && codeGun === w}
				<span class="sq-kfound text-xs">✔ {c.gunFound(WEAPON_BY_ID.get(codeGun)?.name ?? codeGun)}</span>
			{:else if code && codeGun && w && codeGun !== w}
				<span class="text-xs font-semibold text-fg" role="alert">{c.gunMismatch(WEAPON_BY_ID.get(codeGun)?.name ?? codeGun)}</span>
			{/if}
		</label>
		<label class="grid min-w-0 gap-1">
			<span class="text-[13px] font-semibold text-fg">{c.gunField}</span>
			<select bind:value={w} aria-invalid={tried && !w} class="field h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-2 text-base text-fg">
				<option value="" disabled>{c.gunPick}</option>
				{#each GUN_CLASSES as k (k.id)}
					<optgroup label={k.name}>
						{#each k.weapons as g (g.id)}<option value={g.id}>{g.name}</option>{/each}
					</optgroup>
				{/each}
			</select>
			{#if tried && !w}<span class="text-xs text-fg" role="alert">{c.gunNeeded}</span>{/if}
		</label>
		{#if knownList.length}
			<label class="grid min-w-0 gap-1">
				<span class="text-[13px] font-semibold text-fg">{c.knownField}</span>
				<select value={known} onchange={(ev) => pickKnown(ev.currentTarget.value)} class="field h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-2 text-sm text-fg">
					<option value="">{c.knownNone}</option>
					{#each knownList as k (k.code)}<option value={k.code}>{k.meta ? `META · ${k.label}` : k.label}</option>{/each}
				</select>
			</label>
		{/if}
		<div class="grid min-w-0 gap-1" role="group" aria-label={c.kindLabel}>
			<span class="text-[13px] font-semibold text-fg" aria-hidden="true">{c.kindLabel}</span>
			<div class="flex flex-wrap gap-1.5">
				{#each CLASS_KINDS as k (k)}
					<button type="button" class="chip" aria-pressed={kind === k} onclick={() => (kind = k)}>{c.kinds[k]}</button>
				{/each}
			</div>
		</div>
		<label class="grid min-w-0 gap-1">
			<span class="text-[13px] font-semibold text-fg">{c.nameField}</span>
			<input
				bind:value={name}
				maxlength={CLASS_NAME_MAX}
				autocomplete="off"
				placeholder={c.namePlaceholder}
				class="h-11 w-full min-w-0 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent"
			/>
		</label>
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (open = false)}>{t.squad.cancel}</button>
		<button type="submit" form="sq-classes-form" class="btn btn-primary" disabled={busy || fullMsg}>{c.save}</button>
	{/snippet}
</Dialog>

<style>
	.sq-kin[aria-invalid='true'],
	select[aria-invalid='true'] {
		border-color: var(--t-nerf, #ff5a5a);
	}
	.sq-kfound {
		color: var(--t-buff, #3ee06a);
	}
</style>
