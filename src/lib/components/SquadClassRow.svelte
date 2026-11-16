<!--
	One shared squad class (squad-classes.ts): gun (in the Squad tab's list), the class's name and
	where it's played, who shares it, the build code with a copy button, and Remove on your own.
	Used by SquadClasses.svelte (Squad tab) and MetaBuilds.svelte (weapon card's Meta tab).
-->
<script lang="ts">
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import type { SquadClass } from '#lib/squad-classes.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import BuildCopy from './BuildCopy.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	let {
		cls,
		who,
		op,
		mine = false,
		showGun = true,
		ago,
		onremove
	}: {
		cls: SquadClass & { id: string };
		who: string;
		op?: SquadOp;
		mine?: boolean;
		showGun?: boolean;
		/** "Shared 2 h ago" */
		ago: string;
		onremove?: () => void;
	} = $props();
	const c = t.squad.classes;
	const gun = $derived(WEAPON_BY_ID.get(cls.w)?.name ?? cls.w);
	const title = $derived(showGun ? gun : (cls.name ?? c.kinds[cls.kind]));
</script>

<li class="sq-class rounded-lg border border-line bg-panel-2" class:mine data-kind={cls.kind}>
	<span class="sq-kface" aria-hidden="true"><SquadAvatar name={who} {op} size={30} /></span>
	<div class="min-w-0">
		<p class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
			<b class="min-w-0 truncate font-head text-[14px] font-bold tracking-wide">{title}</b>
			<span class="sq-ktag font-head">{c.kinds[cls.kind]}</span>
			{#if showGun && cls.name}<span class="min-w-0 truncate text-[12.5px] text-fg">“{cls.name}”</span>{/if}
		</p>
		<p class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted">
			<code class="sq-kcode">{cls.code}</code>
			<span class="whitespace-nowrap">{c.by(who)}{mine ? ` (${t.squad.you})` : ''}</span>
			<span class="whitespace-nowrap">{ago}</span>
		</p>
	</div>
	<div class="flex items-center gap-1">
		<BuildCopy code={cls.code} text={cls.code} what={c.copyWhat(who, gun, cls.name ?? '')} />
		{#if mine && onremove}
			<button type="button" class="sq-kdel" aria-label={c.removeLabel(gun, cls.name ?? '')} title={c.remove} onclick={onremove}>
				<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"
					><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg
				>
			</button>
		{/if}
	</div>
</li>

<style>
	.sq-class {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		column-gap: 10px;
		padding: 6px 6px 6px 10px;
	}
	.sq-class.mine {
		border-color: var(--t-accent);
	}
	.sq-kface {
		display: flex;
	}
	.sq-ktag {
		flex: none;
		padding: 0 6px;
		border: 1px solid var(--t-line);
		border-radius: 999px;
		color: var(--t-muted);
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	/* Hardcore in red, like its card in the weapon card's Meta tab */
	.sq-class[data-kind='hc'] .sq-ktag {
		border-color: #e0424f;
		background: rgb(224 66 79 / 0.18);
		color: var(--t-fg);
	}
	.sq-kcode {
		font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--t-fg);
		overflow-wrap: anywhere;
	}
	/* Remove: a 44 px target around a small ring */
	.sq-kdel {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 999px;
		color: var(--t-muted);
	}
	.sq-kdel:hover,
	.sq-kdel:focus-visible {
		color: var(--t-nerf, #ff5a5a);
	}
</style>
