<!--
	The squad's operator tags for the header: emblem, "Operator //", callsign, "Online".
	Only shown in the Abscar theme (.abscar-only).
	Abscar's emblem (2026-11-11, the user's pick "6B" from a draft sheet) is the bronze skull with red eyes and
	the holk in its teeth, on armoured shoulders, wearing a moss ghillie poncho with weed leaves and buds woven
	in; drawn by AbscarOperator / abscarOperator.ts (variant "ghillie").
	Next to it his squadmates: Phillestar (PhillestarEmblem: a hamburger, no holk; 2026-11-10) and Drängen Lars
	Åke (LarsAkeEmblem: helmet, lime goggles and a big cold beer; 2026-11-13, the user's friend Robin).
	All three share one row inside the "Squad" frame (stacked on phones). The frame stays at most 716 px wide
	from 768 px up, so the old TV still fits beside it from 1140 px (+page.svelte).
	History: an Iridescent rank badge (RankBadge) sat in the frame from 2026-11-10 ("both ranked"); the user
	asked to remove it entirely when Lars Åke joined (2026-11-13). The component is deleted (git history).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';
	import { MASTERY } from '#lib/data/camos.ts';

	/**
	 * How far each squad member is on the Multiplayer Mastery camos, shown as three small boxes under
	 * their tag (the user's asks, 2026-11-13: first Phillestar's, then "give all of us the same
	 * checkboxes", "write mine in by hand too", not started = grey). Typed in by hand, in MASTERY
	 * order: nobody's row follows the tracker's own ticks, since friends open the page too.
	 * Names come from camos.ts.
	 */
	type Status = 'done' | 'active' | 'todo';
	const SQUAD_MASTERY = {
		abscar: ['todo', 'todo', 'todo'],
		phillestar: ['done', 'done', 'active'],
		lars: ['done', 'active', 'todo']
	} satisfies Record<string, Status[]>;
	const camos = MASTERY.map((camo) => ({ id: camo.id, name: camo.name.replace(' Reforged', '') }));
	const STATUS_TEXT: Record<Status, string> = {
		done: t.operator.masteryDone,
		active: t.operator.masteryInProgress,
		todo: t.operator.masteryTodo
	};
</script>

{#snippet callsign(name: string, wrap = false)}
	<div class="min-w-0">
		<p class="font-hud text-[11px] tracking-[0.22em] text-band-muted uppercase">
			{t.operator.label} <span class="text-accent" aria-hidden="true">//</span>
		</p>
		<!-- a long callsign breaks into two lines where its text allows (min-content), never wider -->
		<p class="font-head text-xl leading-tight font-bold tracking-[0.2em] uppercase" class:op-wrap={wrap}>{name}</p>
		<p class="font-hud flex items-center gap-1.5 text-[10.5px] tracking-[0.2em] text-accent uppercase">
			<span class="op-online-dot size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
			{t.operator.online}
		</p>
	</div>
{/snippet}

{#snippet mastery(who: string, statuses: Status[])}
	<ul class="squad-mastery font-hud" aria-label={t.operator.masteryOf(who)}>
		{#each camos as camo, i (camo.id)}
			{@const status = statuses[i] ?? 'todo'}
			<li class="sq-camo" data-camo={camo.id} data-status={status}>
				<span class="sq-box" aria-hidden="true">
					{#if status === 'done'}
						<svg viewBox="0 0 12 12"><path d="M2.6 6.4 5 8.8 9.6 3.6" /></svg>
					{/if}
				</span>
				<span class="sq-name">{camo.name}</span>
				{#if status === 'active'}
					<span class="sq-wip">{STATUS_TEXT[status]}</span>
				{:else}
					<span class="sr-only">({STATUS_TEXT[status]})</span>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<div class="abscar-only mb-4 pt-1">
	<div class="squad-frame relative inline-flex max-w-full flex-wrap items-center gap-x-3.5 gap-y-3 rounded-lg px-3 pt-4 pb-3">
		<span class="squad-legend font-hud">{t.operator.squad}</span>
		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<AbscarOperator variant="ghillie" class="size-16 flex-none sm:size-20" />
				{@render callsign(t.operator.callsign)}
			</div>
			{@render mastery(t.operator.callsign, SQUAD_MASTERY.abscar)}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<PhillestarEmblem />
				{@render callsign(t.operator.mate)}
			</div>
			{@render mastery(t.operator.mate, SQUAD_MASTERY.phillestar)}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<LarsAkeEmblem />
				{@render callsign(t.operator.lars, true)}
			</div>
			{@render mastery(t.operator.lars, SQUAD_MASTERY.lars)}
		</div>
	</div>
</div>

<style>
	/* one frame round the squad: an iridescent border that slowly shifts colour */
	.squad-frame {
		border: 1.5px solid transparent;
		background:
			linear-gradient(135deg, rgb(28 8 52 / 0.62), rgb(10 4 24 / 0.5)) padding-box,
			linear-gradient(110deg, #7a3ff0, #ff6ad5, #4fe6ff, #b265ff, #7a3ff0) border-box;
		background-size:
			100% 100%,
			300% 100%;
		box-shadow:
			0 0 20px rgb(190 90 255 / 0.3),
			inset 0 0 16px rgb(255 95 216 / 0.1);
		animation: squad-sheen 9s linear infinite;
	}
	@keyframes squad-sheen {
		to {
			background-position:
				0 0,
				300% 0;
		}
	}
	/* "Drängen / Lars Åke" on two lines (the no-break space keeps "Lars Åke" together) */
	.op-wrap {
		width: min-content;
	}
	/* each member's Mastery camos under their tag: three small boxes, one per line so all three
	   members look alike. Done = filled in the camo's colours + tick, in progress = half filled and
	   breathing + a small sign, not started = grey. */
	.op-member {
		display: flex;
		flex-direction: column;
		gap: 7px;
		align-self: flex-start;
	}
	.op-member > .op-tag {
		min-height: 80px;
	}
	.squad-mastery {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 10px;
		line-height: 1.3;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #f3e6ff;
	}
	.sq-camo {
		display: flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
	}
	.sq-camo[data-camo='mercurialDrift'] {
		--glow: rgb(255 95 180 / 0.7);
		--fill: linear-gradient(135deg, #ff3f9f, #f6a58c 55%, #c48bff);
	}
	.sq-camo[data-camo='polyatomicReforged'] {
		--glow: rgb(120 110 255 / 0.75);
		--fill: linear-gradient(135deg, #2f63ff, #8a5cff 55%, #cdb8ff);
	}
	.sq-camo[data-camo='orionReforged'] {
		--glow: rgb(190 70 220 / 0.6);
		--fill: linear-gradient(135deg, #5a1fb0, #c92f8f 60%, #ff7a6a);
	}
	.sq-box {
		position: relative;
		flex: none;
		width: 13px;
		height: 13px;
		border-radius: 3px;
		border: 1px solid rgb(255 255 255 / 0.75);
		background: #0d0720;
		overflow: hidden;
	}
	.sq-box svg {
		position: absolute;
		inset: 0;
		fill: none;
		stroke: #fff;
		stroke-width: 2.2;
		stroke-linecap: round;
		stroke-linejoin: round;
		filter: drop-shadow(0 0.5px 0.5px rgb(0 0 0 / 0.7));
	}
	.sq-camo[data-status='done'] .sq-box {
		background: var(--fill);
		box-shadow: 0 0 6px var(--glow);
	}
	.sq-camo[data-status='active'] .sq-box {
		box-shadow: 0 0 6px var(--glow);
	}
	.sq-camo[data-status='active'] .sq-box::before {
		content: '';
		position: absolute;
		inset: 50% 0 0;
		background: var(--fill);
		animation: sq-fill 2.4s ease-in-out infinite alternate;
	}
	@keyframes sq-fill {
		from {
			opacity: 0.55;
		}
		to {
			opacity: 1;
		}
	}
	.sq-camo[data-status='todo'] .sq-box {
		border-color: rgb(190 190 200 / 0.55);
		background: rgb(120 120 130 / 0.35);
	}
	.sq-camo[data-status='todo'] .sq-name {
		color: rgb(200 198 210 / 0.7);
	}
	.sq-wip {
		padding: 0 5px;
		border: 1px solid rgb(255 204 51 / 0.7);
		border-radius: 999px;
		background: rgb(0 0 0 / 0.45);
		color: #ffd75a;
		font-size: 8.5px;
		letter-spacing: 0.12em;
	}
	@media (prefers-reduced-motion: reduce) {
		.sq-camo[data-status='active'] .sq-box::before {
			animation: none;
		}
	}

	/* the "Squad" label sitting on the frame's top edge */
	.squad-legend {
		position: absolute;
		top: 0;
		left: 14px;
		transform: translateY(-50%);
		padding: 1px 9px;
		border: 1px solid rgb(255 106 213 / 0.6);
		border-radius: 999px;
		background: #1a0b33;
		color: #f3e6ff;
		font-size: 10px;
		line-height: 1.5;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		box-shadow: 0 0 10px rgb(190 90 255 / 0.35);
	}
</style>
