<!--
	Quickscope duels in BurgiArcade (2026-11-22): challenge someone in the squad (both play the same five rounds
	from one seed, each on their own page, whenever they get to it), take up challenges sent to you, and see
	who won each round. Lives in the squad document (arcade.ts duelsFor): each side's rounds are in their own
	entry, so it works even when you don't play at the same time.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import SquadAvatar from '../SquadAvatar.svelte';
	import type { DuelPlay } from './ArcadeMachine.svelte';

	let { onplay }: { onplay: (d: DuelPlay) => void } = $props();
	const d = t.arcade.duel;
	const others = $derived(squad.entries.filter((e) => !e.mine));
	const list = $derived(squad.duels.slice(0, 6));
	const nameOf = (id: string) => squad.byId(id)?.member.name ?? '?';

	function challenge(id: string) {
		const made = squad.challenge(id);
		if (made) onplay({ id: made.id, seed: made.seed, other: id, name: nameOf(id) });
	}
	const cell = (x: number | undefined) => (x === undefined ? '–' : x > 0 ? d.ms(x) : x === 0 ? d.slow : d.foul);
</script>

<div class="duels">
	<div class="duels-head">
		<p class="duels-title font-head">🎯 {d.heading}</p>
		<p class="duels-hint">{d.hint}</p>
	</div>
	{#if !others.length}
		<p class="duels-hint">{d.none}</p>
	{:else}
		<div class="duels-pick" role="group" aria-label={d.pick}>
			{#each others as e (e.id)}
				<button type="button" class="duel-chip font-head" aria-label={d.challengeLabel(e.member.name)} onclick={() => challenge(e.id)}>
					<SquadAvatar name={e.member.name} op={e.member.op} size={28} />
					<span class="truncate">{e.member.name}</span>
					<span class="duel-vs" aria-hidden="true">VS</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if list.length}
		<ul class="duels-list">
			{#each list as v (v.id)}
				{@const name = nameOf(v.other)}
				<li class="duel-row" class:won={v.result?.winner === 'you'} class:lost={v.result?.winner === 'them'}>
					<div class="duel-top">
						<SquadAvatar name={name} op={squad.byId(v.other)?.member.op} size={30} />
						<p class="duel-line">
							{#if v.result}
								<b>{v.result.winner === 'you' ? d.won(name, v.result.you, v.result.them) : v.result.winner === 'them' ? d.lost(name, v.result.you, v.result.them) : d.draw(name, v.result.you, v.result.them)}</b>
							{:else if !v.you}
								<b>{v.mine ? d.sent(name) : d.incoming(name)}</b>
							{:else}
								<b>{d.waiting(name)}</b>
							{/if}
						</p>
						{#if !v.you}
							<button type="button" class="duel-go font-head" onclick={() => onplay({ id: v.id, seed: v.seed, other: v.other, name, accept: v.mine ? undefined : v.at })}>{v.mine ? d.playMine : d.accept}</button>
						{/if}
					</div>
					{#if v.you}
						<div class="duel-rounds" role="table" aria-label={d.heading}>
							<div class="duel-r" role="row"><span class="duel-who font-head" role="rowheader">{d.you}</span>{#each v.you as x, i (i)}<span role="cell" class:best={v.result?.per[i] === 'you'}>{cell(x)}</span>{/each}</div>
							<div class="duel-r" role="row"><span class="duel-who font-head" role="rowheader">{name}</span>{#each [0, 1, 2, 3, 4] as i (i)}<span role="cell" class:best={v.result?.per[i] === 'them'}>{v.them ? cell(v.them[i]) : '…'}</span>{/each}</div>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.duels {
		display: grid;
		gap: 10px;
		padding: 12px;
		border-radius: 16px;
		background:
			radial-gradient(90% 120% at 0% 0%, rgb(69 230 255 / 0.16), transparent 60%),
			linear-gradient(180deg, #0a1e2e, #040c14);
		box-shadow:
			inset 0 0 0 1.5px rgb(69 230 255 / 0.5),
			0 0 16px rgb(69 230 255 / 0.18);
		color: #e8fbff;
	}
	.duels-title {
		font-size: 14px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #8ff4ff;
		text-shadow: 0 0 8px rgb(69 230 255 / 0.6);
	}
	.duels-hint {
		font-size: 12.5px;
		color: #b8dde6;
	}
	.duels-pick {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.duel-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		max-width: 100%;
		min-height: 44px;
		padding: 4px 10px 4px 5px;
		border-radius: 999px;
		border: 1.5px solid rgb(69 230 255 / 0.55);
		background: rgb(69 230 255 / 0.08);
		color: #e8fbff;
		font-size: 13px;
		font-weight: 800;
	}
	.duel-chip:hover {
		background: rgb(69 230 255 / 0.2);
	}
	.duel-vs {
		padding: 1px 6px;
		border-radius: 6px;
		background: #ff4a5a;
		color: #fff;
		font-size: 10px;
		letter-spacing: 0.08em;
	}
	.duels-list {
		display: grid;
		gap: 6px;
	}
	.duel-row {
		display: grid;
		gap: 6px;
		padding: 8px 10px;
		border-radius: 12px;
		background: rgb(255 255 255 / 0.05);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1);
	}
	.duel-row.won {
		box-shadow: inset 0 0 0 1.5px rgb(168 240 58 / 0.7);
	}
	.duel-row.lost {
		box-shadow: inset 0 0 0 1.5px rgb(255 90 90 / 0.6);
	}
	.duel-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}
	.duel-line {
		flex: 1 1 10rem;
		min-width: 0;
		font-size: 13px;
	}
	.duel-go {
		min-height: 44px;
		padding: 0 14px;
		border-radius: 999px;
		border: 2px solid #3a1a00;
		background: linear-gradient(180deg, #fff6b0, #ffc928 50%, #e07a00);
		color: #3a1a00;
		font-size: 13px;
		font-weight: 900;
	}
	.duel-rounds {
		display: grid;
		gap: 3px;
		overflow-x: auto;
	}
	.duel-r {
		display: grid;
		grid-template-columns: minmax(3.5rem, 6rem) repeat(5, minmax(3rem, 1fr));
		gap: 3px;
		font-size: 11.5px;
	}
	.duel-r span {
		padding: 2px 4px;
		border-radius: 6px;
		background: rgb(0 0 0 / 0.3);
		text-align: center;
		white-space: nowrap;
	}
	.duel-r .duel-who {
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: left;
		background: none;
		font-weight: 800;
	}
	.duel-r span.best {
		background: rgb(168 240 58 / 0.25);
		color: #e8ffd0;
		font-weight: 800;
	}
</style>
