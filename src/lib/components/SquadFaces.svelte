<!--
	Small faces on a weapon row (2026-11-14, squad step 2): which of your squad mates have maxed this
	weapon (Harmonic Break). Initials badges, at most 4 + "+n". Nothing outside a squad.
-->
<script lang="ts">
	import { MAX_LEVEL } from '#lib/data/camos.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import SquadAvatar from './SquadAvatar.svelte';

	let { weaponId }: { weaponId: string } = $props();
	const maxedBy = $derived(squad.on ? squad.entries.filter((e) => !e.mine && (e.member.weapons[weaponId] ?? 0) >= MAX_LEVEL) : []);
</script>

{#if maxedBy.length}
	<span class="sq-faces flex-none" title={t.squad.maxedBy(maxedBy.map((e) => e.member.name).join(', '))}>
		{#each maxedBy.slice(0, 4) as e (e.id)}<SquadAvatar name={e.member.name} op={e.member.op} size={18} emblem={false} />{/each}
		{#if maxedBy.length > 4}<span class="sq-more num">+{maxedBy.length - 4}</span>{/if}
		<span class="sr-only">{t.squad.maxedBy(maxedBy.map((e) => e.member.name).join(', '))}</span>
	</span>
{/if}

<style>
	.sq-faces {
		display: inline-flex;
		align-items: center;
	}
	.sq-faces > :global(.sq-avatar + .sq-avatar) {
		margin-left: -5px;
	}
	.sq-more {
		margin-left: 3px;
		font-size: 10px;
		color: var(--t-muted);
	}
</style>
