<!--
	The trophy shelf (shop.ts slot `shelf`, the 18-ideas pack, 2026-11-21): a wooden or gold shelf with the
	trophies a member has earned in the shop (shop.ts trophies()). On their squad card while they wear a shelf,
	and as the shelf's item card in BurgiShop (`sample`: every trophy, the ones not earned yet dimmed).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { TROPHIES, type TrophyId } from '#lib/shop.ts';

	let { shelf, got, sample = false }: { shelf: string; got: Record<TrophyId, boolean>; sample?: boolean } = $props();
	const ICON: Record<TrophyId, string> = {
		spent1m: '🍔',
		spent10m: '💎',
		own25: '🔮',
		own50: '🏆',
		c420: '🌿',
		gifter: '🎅',
		pranker: '😈',
		boxer: '🎁',
		statue: '🗿',
		throne: '👑'
	};
	const shown = $derived(TROPHIES.filter((id) => sample || got[id]));
</script>

<span class="shelf" data-shelf={shelf} role="img" aria-label="{t.shop.trophies.heading}: {shown.filter((id) => got[id]).map((id) => t.shop.trophies.names[id]).join(', ') || t.shop.trophies.none}">
	<span class="shelf-row">
		{#each shown as id (id)}
			<span class="trophy" class:dim={!got[id]} title={t.shop.trophies.names[id]} aria-hidden="true"><span class="cup">{ICON[id]}</span></span>
		{:else}
			<span class="shelf-none text-[11px]">{t.shop.trophies.none}</span>
		{/each}
	</span>
	<span class="plank" aria-hidden="true"></span>
</span>

<style>
	.shelf {
		display: inline-flex;
		flex-direction: column;
		align-items: stretch;
		max-width: 100%;
	}
	.shelf-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 3px;
		padding: 0 6px;
		min-height: 26px;
	}
	.trophy {
		display: grid;
		place-items: center;
		width: 24px;
		height: 26px;
		border-radius: 6px 6px 2px 2px;
		background: radial-gradient(circle at 50% 30%, rgb(255 230 140 / 0.35), transparent 70%);
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.6));
	}
	.cup {
		font-size: 17px;
		line-height: 1;
	}
	.trophy.dim {
		opacity: 0.3;
		filter: grayscale(1);
	}
	.plank {
		display: block;
		height: 7px;
		border-radius: 2px;
		background: linear-gradient(180deg, #b07a46, #6b4320 70%, #3e260f);
		box-shadow: 0 2px 3px rgb(0 0 0 / 0.5);
	}
	.shelf[data-shelf='shelf-gold'] .plank {
		background: linear-gradient(180deg, #fff3a0, #ffc928 50%, #a8740c);
		box-shadow:
			0 2px 3px rgb(0 0 0 / 0.5),
			0 0 8px rgb(255 201 40 / 0.6);
	}
	.shelf-none {
		align-self: center;
		color: var(--t-muted);
	}
</style>
