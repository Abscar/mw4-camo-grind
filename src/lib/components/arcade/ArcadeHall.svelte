<!--
	A BurgiArcade game's high scores (2026-11-22): the squad's board for it, all time / this week / today's
	daily challenge (arcade.ts hallOf), on an LED scoreboard: gold, silver and bronze places, each with their
	operator and the score in big digits, your own row marked. Outside a squad: only your own best.
-->
<script lang="ts">
	import { hallOf, type ArcadeState, type Board } from '#lib/arcade.ts';
	import type { ArcadeGame } from '#lib/arcade/game.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import { t } from '#lib/i18n/en.ts';
	import SquadAvatar from '../SquadAvatar.svelte';

	let {
		game,
		members,
		me,
		now,
		board = $bindable('all'),
		flash = null
	}: {
		game: ArcadeGame;
		members: Record<string, { name: string; op?: SquadOp; arcade?: ArcadeState }>;
		me: string | null;
		now: number;
		board?: Board;
		/** a row to light up (your score that just landed) */
		flash?: string | null;
	} = $props();
	const h = t.arcade.hall;
	const BOARDS: Board[] = ['all', 'week', 'day'];
	const rows = $derived(hallOf(members, game, board, now).slice(0, 10));
	const medal = (i: number) => (i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '');
</script>

<div class="hall">
	<div class="hall-head">
		<p class="hall-title font-head">{h.heading}</p>
		<div class="hall-tabs" role="group" aria-label={h.label}>
			{#each BOARDS as b (b)}<button type="button" class="hall-tab font-head" aria-pressed={board === b} onclick={() => (board = b)}>{h[b]}</button>{/each}
		</div>
	</div>
	{#if !rows.length}
		<p class="hall-empty">{h.empty}</p>
	{:else}
		<ol class="hall-rows">
			{#each rows as r, i (r.id)}
				{@const m = members[r.id]}
				<li class="hall-row" class:mine={r.id === me} class:flash={r.id === flash} data-medal={medal(i)}>
					<span class="hall-rank font-head num">{i + 1}</span>
					<SquadAvatar name={m?.name ?? '?'} op={m?.op} size={30} />
					<b class="hall-name font-head">{m?.name ?? '?'}{#if r.id === me}<span class="hall-you">{h.you}</span>{/if}</b>
					<span class="hall-score num">{r.score.toLocaleString('en-US')}</span>
				</li>
			{/each}
		</ol>
	{/if}
	{#if !me}<p class="hall-note">{h.outside}</p>{/if}
</div>

<style>
	.hall {
		display: grid;
		gap: 8px;
		padding: 10px;
		border-radius: 14px;
		background:
			radial-gradient(circle, rgb(255 255 255 / 0.05) 0 1px, transparent 1.4px) 0 0 / 6px 6px,
			linear-gradient(180deg, #0c0716, #05030a);
		box-shadow:
			inset 0 0 0 2px #1d1430,
			inset 0 0 0 4px rgb(255 201 40 / 0.3),
			0 0 16px rgb(120 60 255 / 0.25);
	}
	.hall-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
	}
	.hall-title {
		font-size: 13px;
		font-weight: 900;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #ffd23a;
		text-shadow: 0 0 8px rgb(255 190 40 / 0.6);
	}
	.hall-tabs {
		display: flex;
		gap: 4px;
	}
	.hall-tab {
		min-height: 32px;
		padding: 0 10px;
		border-radius: 999px;
		border: 1px solid rgb(255 255 255 / 0.18);
		background: rgb(255 255 255 / 0.06);
		color: #e8dcff;
		font-size: 11.5px;
		font-weight: 800;
		letter-spacing: 0.04em;
	}
	.hall-tab[aria-pressed='true'] {
		background: #ffd23a;
		border-color: #ffd23a;
		color: #1d0d00;
	}
	.hall-empty,
	.hall-note {
		font-size: 12.5px;
		color: #cbbde8;
	}
	.hall-rows {
		display: grid;
		gap: 4px;
	}
	.hall-row {
		display: grid;
		grid-template-columns: 26px 30px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		padding: 5px 8px;
		border-radius: 10px;
		background: rgb(255 255 255 / 0.04);
	}
	.hall-row.mine {
		background: rgb(255 210 58 / 0.13);
		box-shadow: inset 0 0 0 1px rgb(255 210 58 / 0.55);
	}
	.hall-row.flash {
		animation: hall-flash 1.2s ease-in-out 3;
	}
	@keyframes hall-flash {
		50% {
			background: rgb(255 210 58 / 0.4);
		}
	}
	.hall-rank {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: rgb(255 255 255 / 0.1);
		font-size: 13px;
		font-weight: 900;
		color: #e8dcff;
	}
	.hall-row[data-medal='gold'] .hall-rank {
		background: radial-gradient(circle at 35% 30%, #fff6b0, #ffc928 50%, #a86000);
		color: #3a1a00;
		box-shadow: 0 0 10px rgb(255 200 60 / 0.6);
	}
	.hall-row[data-medal='silver'] .hall-rank {
		background: radial-gradient(circle at 35% 30%, #ffffff, #c8d2e0 50%, #6a788a);
		color: #1a2230;
	}
	.hall-row[data-medal='bronze'] .hall-rank {
		background: radial-gradient(circle at 35% 30%, #ffd8b0, #d8843a 50%, #7a3a0a);
		color: #2a1000;
	}
	.hall-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13.5px;
		color: #fff6e6;
	}
	.hall-you {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		background: #ffd23a;
		color: #1d0d00;
		font-size: 10px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	/* LED digits */
	.hall-score {
		font-family: 'Cascadia Mono', Consolas, monospace;
		font-size: 16px;
		font-weight: 800;
		color: #ff5a4a;
		text-shadow:
			0 0 6px rgb(255 70 50 / 0.8),
			0 0 1px #ffd0c8;
		letter-spacing: 0.04em;
	}
	.hall-row[data-medal='gold'] .hall-score {
		color: #ffd23a;
		text-shadow: 0 0 8px rgb(255 200 60 / 0.8);
	}
	@media (prefers-reduced-motion: reduce) {
		.hall-row.flash {
			animation: none;
		}
	}
</style>
