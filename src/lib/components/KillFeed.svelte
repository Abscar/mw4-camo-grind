<!--
	Abscar theme: a kill-feed row slides in at the top right whenever a tick adds a camo, like the
	game's kill feed: your callsign, the gun's cartoon, the camo you just got. Rows come from
	feed.svelte.ts and leave after a few seconds. Decoration: the box itself says it's ticked.
-->
<script lang="ts">
	import { LADDER, MAX_LEVEL } from '#lib/data/camos.ts';
	import { WEAPON_LOOKS } from '#lib/data/weaponLooks.ts';
	import { WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { feed } from '#lib/feed.svelte.ts';
	import { t } from '#lib/i18n/en.ts';
	import WeaponIcon from './WeaponIcon.svelte';
</script>

<div class="abscar-only" aria-hidden="true">
	<div class="kill-feed">
		{#each feed.rows as row (row.id)}
			{@const weapon = WEAPON_BY_ID.get(row.weaponId)}
			{@const camo = LADDER[row.level - 1]}
			{@const look = WEAPON_LOOKS[row.weaponId]}
			{#if weapon && camo}
				<div class="kill-row" data-camo={camo.id} data-squad={row.who ? true : undefined}>
					<span class="kill-player">{row.who ?? t.operator.callsign}</span>
					{#if look}<span class="kill-gun"><WeaponIcon {look} camo={camo.id} /></span>{/if}
					<span class="kill-camo">{camo.name}{#if row.level >= MAX_LEVEL}&nbsp;◆{/if}</span>
					<span class="kill-weapon">{weapon.name}</span>
				</div>
			{/if}
		{/each}
	</div>
</div>
