<!--
	The squad's operator tags for the header: emblem, "Operator //", callsign, "Online".
	Only shown in the Abscar theme (.abscar-only).
	Abscar's emblem (2026-11-11, the user's pick "6B" from a draft sheet) is the bronze skull with red eyes and
	the holk in its teeth, on armoured shoulders, wearing a moss ghillie poncho with weed leaves and buds woven
	in; drawn by AbscarOperator / abscarOperator.ts (variant "ghillie").
	Next to it his squadmates: Phillestar (PhillestarEmblem: a hamburger, no holk; 2026-11-10), Drängen Lars
	Åke (LarsAkeEmblem: helmet, lime goggles and a big cold beer; 2026-11-13, the user's friend Robin) and
	Da Jeeven (DaJeevenEmblem: the gold Ghost skull with a big holk; 2026-11-13), who also gets a gold
	"Certified grinder" sticker and his Black Ops 6 + 7 record (Prestige Master, max level, all calling cards).
	Fun stickers under the boxes: Phillestar "Ranked or nothing", Drängen "Held back by idiots", and Abscar
	"Refuses to play campaign mode" in moss green (2026-11-13: the user wanted it "under Abscar, not as checkpoints,
	just at the side a bit for fun"; it first sat as a ticked line in Da Jeeven's record; a second Abscar sticker,
	"Ranked, MP, WZ grinder", was removed the same day at their ask).
	The four share the "Squad" frame, laid out by its width (a container query on the wrapper): four in a row
	(emblems 64 px, names a bit smaller) when the column is wide enough (≥ 1280 px pages and 820–1139 px, where
	the frame gets the full width), two by two in between (1140–1279 px, beside the TV), one under the other on
	phones. The TV keeps its place beside the frame from 1140 px (+page.svelte).
	History: an Iridescent rank badge (RankBadge) sat in the frame from 2026-11-10 ("both ranked"); the user
	asked to remove it entirely when Lars Åke joined (2026-11-13). The component is deleted (git history).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';
	import { MASTERY } from '#lib/data/camos.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { agoParts, headerStatuses, type HeaderStatus, type SquadOp } from '#lib/squad-codec.ts';

	/**
	 * How far each squad member is on the Multiplayer Mastery camos, shown as three small boxes under
	 * their tag (the user's asks, 2026-11-13: first Phillestar's, then "give all of us the same
	 * checkboxes", "write mine in by hand too", not started = grey). Typed in by hand, in MASTERY
	 * order. Names come from camos.ts.
	 * Since 2026-11-14 (the Squad tab, squad.svelte.ts): for someone in your squad who picked this
	 * operator, the boxes show the higher of these and what their own ticks say, so they move by
	 * themselves and never go back. Visitors who aren't in the squad see these as typed.
	 */
	type Status = HeaderStatus;
	const SQUAD_MASTERY = {
		abscar: ['todo', 'todo', 'todo'],
		phillestar: ['done', 'done', 'active'],
		lars: ['done', 'active', 'todo'],
		/** none of the MW4 Mastery camos yet (the user, 2026-11-13) */
		jeeven: ['todo', 'todo', 'todo']
	} satisfies Record<SquadOp, Status[]>;

	/** The squad member who is this operator (only when you're in a squad yourself). */
	const live = (op: SquadOp) => (squad.on ? squad.forOp(op) : null);
	const statuses = $derived(
		Object.fromEntries(
			(Object.keys(SQUAD_MASTERY) as SquadOp[]).map((op) => [
				op,
				headerStatuses(SQUAD_MASTERY[op], live(op)?.stats.mastery.mp ?? null)
			])
		) as Record<SquadOp, Status[]>
	);

	/**
	 * Whoever is furthest behind gets a red "Slacker" sticker next to their boxes (the user's ask,
	 * 2026-11-13). Worked out from the boxes (done = 2, in progress = 1), so it moves by itself
	 * when the statuses change; nobody gets it while the last place is shared. Da Jeeven is a
	 * "Certified grinder" and never gets it (the user, 2026-11-13: "don't forget the slacker sticker on
	 * Abscar", when Da Jeeven joined with no Mastery camos either).
	 */
	const SLACKER_EXEMPT: SquadOp[] = ['jeeven'];
	const points = (list: Status[]) => list.reduce((sum, s) => sum + (s === 'done' ? 2 : s === 'active' ? 1 : 0), 0);
	const slacker = $derived.by(() => {
		const scores = (Object.keys(statuses) as SquadOp[])
			.filter((who) => !SLACKER_EXEMPT.includes(who))
			.map((who) => ({ who, n: points(statuses[who]) }));
		const lowest = Math.min(...scores.map((s) => s.n));
		const last = scores.filter((s) => s.n === lowest);
		return last.length === 1 ? last[0].who : null;
	});

	const camos = MASTERY.map((camo) => ({ id: camo.id, name: camo.name.replace(' Reforged', '') }));
	const STATUS_TEXT: Record<Status, string> = {
		done: t.operator.masteryDone,
		active: t.operator.masteryInProgress,
		todo: t.operator.masteryTodo
	};
</script>

{#snippet callsign(name: string, op: SquadOp, wrap = false)}
	<!-- "Online": decoration for visitors; for people in a squad, the real state of whoever picked
	     this operator (Squad tab): Online (green), Offline (grey, "Seen …" as tooltip), Not in squad -->
	{@const entry = live(op)}
	{@const presence = !squad.on ? 'deco' : !entry ? 'none' : entry.online ? 'on' : 'off'}
	<div class="min-w-0">
		<p class="font-hud text-[11px] tracking-[0.22em] text-band-muted uppercase">
			{t.operator.label} <span class="text-accent" aria-hidden="true">//</span>
		</p>
		<!-- a long callsign breaks into two lines where its text allows (min-content), never wider -->
		<p class="op-name font-head text-xl leading-tight font-bold tracking-[0.2em] uppercase" class:op-wrap={wrap}>{name}</p>
		<p
			class="op-presence font-hud flex items-center gap-1.5 text-[10.5px] tracking-[0.2em] text-accent uppercase"
			data-presence={presence}
			title={presence === 'off' && entry ? t.operator.seen(t.squad.ago(agoParts(entry.member.seen, squad.now))) : undefined}
		>
			<span class="op-online-dot size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
			{presence === 'off' ? t.operator.offline : presence === 'none' ? t.operator.notJoined : t.operator.online}
		</p>
	</div>
{/snippet}

{#snippet mastery(who: string, statuses: Status[], isSlacker = false, motto: string | readonly string[] = '', tone = 'purple')}
	<div class="sq-boxes">
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
	{#if isSlacker}
		<span class="sq-slacker font-head">{t.operator.slacker}</span>
	{/if}
	</div>
	{#each [motto].flat().filter(Boolean) as line, i (line)}
		<span class="sq-motto font-head" data-tone={tone} data-n={i}>{line}</span>
	{/each}
{/snippet}

<div class="squad-wrap abscar-only mb-4 pt-1">
	<div class="squad-frame relative max-w-full rounded-lg px-3 pt-4 pb-3">
		<span class="squad-legend font-hud">{t.operator.squad}</span>
		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<AbscarOperator variant="ghillie" class="size-16 flex-none sm:size-20" />
				{@render callsign(t.operator.callsign, 'abscar')}
			</div>
			{@render mastery(t.operator.callsign, statuses.abscar, slacker === 'abscar', t.operator.abscarStickers, 'moss')}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<PhillestarEmblem />
				{@render callsign(t.operator.mate, 'phillestar')}
			</div>
			{@render mastery(t.operator.mate, statuses.phillestar, slacker === 'phillestar', t.operator.mateMotto)}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<LarsAkeEmblem />
				{@render callsign(t.operator.lars, 'lars', true)}
			</div>
			{@render mastery(t.operator.lars, statuses.lars, slacker === 'lars', t.operator.larsMotto, 'lime')}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5">
				<DaJeevenEmblem />
				{@render callsign(t.operator.jeeven, 'jeeven')}
			</div>
			{@render mastery(t.operator.jeeven, statuses.jeeven, slacker === 'jeeven')}
			<!-- his Black Ops 6 + 7 record (the user, 2026-11-13) and the gold "Certified grinder" sticker -->
			<div class="sq-record-wrap">
				<p class="sq-record-title font-hud">{t.operator.recordTitle}</p>
				<ul class="squad-mastery sq-record font-hud" aria-label={t.operator.recordOf(t.operator.jeeven)}>
					{#each t.operator.record as line (line)}
						<li class="sq-camo" data-status="done">
							<span class="sq-box" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2.6 6.4 5 8.8 9.6 3.6" /></svg></span>
							<span class="sq-name">{line}</span>
						</li>
					{/each}
				</ul>
				<span class="sq-certified font-head">{t.operator.certified}</span>
			</div>
		</div>
	</div>
</div>

<style>
	/* the frame lays the members out by the width it gets (see the header comment) */
	.squad-wrap {
		container: squad / inline-size;
	}
	.squad-frame {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: 14px;
	}
	@container squad (min-width: 470px) {
		.squad-frame {
			display: inline-grid;
			grid-template-columns: repeat(2, auto);
			column-gap: 24px;
		}
	}
	@container squad (min-width: 860px) {
		.squad-frame {
			grid-template-columns: repeat(4, auto);
			column-gap: 14px;
		}
		.op-tag > :global(svg) {
			width: 64px;
			height: 64px;
		}
		.op-member > .op-tag {
			min-height: 64px;
		}
		.op-name {
			font-size: 18px;
		}
	}
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
	/* the presence line for people in a squad (2026-11-14): green Online, grey Offline / Not in squad */
	.op-presence[data-presence='on'] {
		color: #3ee06a;
	}
	.op-presence[data-presence='on'] .op-online-dot {
		background: #3ee06a;
		box-shadow: 0 0 6px #3ee06a;
	}
	.op-presence[data-presence='off'],
	.op-presence[data-presence='none'] {
		color: rgb(200 198 210 / 0.75);
	}
	.op-presence[data-presence='off'] .op-online-dot,
	.op-presence[data-presence='none'] .op-online-dot {
		background: #7c818a;
		animation: none;
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
		position: relative;
	}
	/* the boxes and (for whoever is last) the Slacker sticker beside them */
	.sq-boxes {
		position: relative;
	}
	/* Da Jeeven's Black Ops 6 + 7 record: gold-ticked lines under a small title, like the Mastery boxes */
	.sq-record-wrap {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: 6px;
		border-top: 1px solid rgb(255 204 90 / 0.35);
	}
	.sq-record-title {
		width: fit-content;
		margin: 0;
		color: #ffd75a;
		font-size: 9px;
		line-height: 1.2;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
	}
	.sq-record .sq-camo {
		--glow: rgb(255 200 60 / 0.6);
		--fill: linear-gradient(135deg, #fff1a8, #f1c23a 50%, #a8730c);
		/* a long line may wrap when the column is tight, instead of widening the frame */
		align-items: flex-start;
		white-space: normal;
	}
	/* a member's motto sticker (the user, 2026-11-13, "just for fun": Phillestar "Ranked or nothing", Drängen
	   Lars Åke "Held back by idiots"): purple-pink, slapped on at the right under their boxes. In the flow
	   (not on top of the boxes), so it never covers a line; their columns are shorter than Da Jeeven's, so
	   the frame doesn't grow in the four-in-a-row and two-by-two layouts. */
	.sq-motto {
		position: relative;
		align-self: flex-end;
		margin-right: -4px;
		width: max-content;
		max-width: 12em;
		text-wrap: balance;
		padding: 3px 7px 2px;
		border: 2px solid #fff;
		border-radius: 5px;
		background: linear-gradient(135deg, #7a3ff0, #c43fd6 55%, #ff5fae);
		color: #fff;
		font-size: 11px;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: 0.12em;
		text-align: center;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgb(40 0 60 / 0.8);
		transform: rotate(-7deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(200 90 255 / 0.5);
		pointer-events: none;
	}
	/* Drängen's is lime like his goggles */
	.sq-motto[data-tone='lime'] {
		background: linear-gradient(135deg, #c8ff80, #7ee236 55%, #3e9f1a);
		color: #10260a;
		text-shadow: 0 1px 0 rgb(230 255 200 / 0.6);
		transform: rotate(5deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(140 255 60 / 0.45);
	}
	/* Abscar's is moss green like his ghillie and a bit smaller; a second one in the list would be slapped on
	   the other way and a little further left, so they read as loose stickers, not a list */
	.sq-motto[data-tone='moss'] {
		max-width: 15em;
		font-size: 10px;
		background: linear-gradient(135deg, #7d9c3c, #4f6f26 55%, #2f4716);
		text-shadow: 0 1px 0 rgb(15 30 5 / 0.85);
		transform: rotate(-5deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(130 180 60 / 0.4);
	}
	/* whoever wears the Slacker sticker: their first motto sticker moves down a little so the two don't collide */
	.sq-boxes:has(.sq-slacker) + .sq-motto {
		margin-top: 12px;
	}
	.sq-motto[data-tone='moss'][data-n='1'] {
		margin-top: -2px;
		margin-right: 12px;
		transform: rotate(4deg);
	}
	/* the gold "Certified grinder" sticker, slapped on at an angle at the top right of his record
	   (beside the short title and "Prestige Master", clear of the longer last line) */
	.sq-certified {
		position: absolute;
		right: -4px;
		top: 4px;
		width: min-content;
		padding: 3px 7px 2px;
		border: 2px solid #fff;
		border-radius: 5px;
		background: linear-gradient(180deg, #ffe48a, #e0a420 60%, #b57a0c);
		color: #3a2400;
		font-size: 11px;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: 0.12em;
		text-align: center;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgb(255 245 200 / 0.6);
		transform: rotate(6deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(255 190 40 / 0.45);
		pointer-events: none;
	}
	/* the red "Slacker" sticker, slapped on at an angle beside the boxes of whoever is last */
	.sq-slacker {
		position: absolute;
		right: -4px;
		bottom: 1px;
		padding: 3px 8px 2px;
		border: 2px solid #fff;
		border-radius: 5px;
		background: linear-gradient(180deg, #ff3b30, #c4111a);
		color: #fff;
		font-size: 12px;
		font-weight: 800;
		line-height: 1.15;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgb(90 0 0 / 0.8);
		transform: rotate(-9deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(255 40 40 / 0.45);
		pointer-events: none;
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
