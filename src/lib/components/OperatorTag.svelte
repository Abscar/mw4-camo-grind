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
	Ingman (IngmanEmblem, the wizard; 2026-11-14) and AW (AwEmblem, pale with huge eyes, the user's
	description; 2026-11-20) joined later: the layout rules are at the top of the styles.
	History: an Iridescent rank badge (RankBadge) sat in the frame from 2026-11-10 ("both ranked"); the user
	asked to remove it entirely when Lars Åke joined (2026-11-13). The component is deleted (git history).
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import AwEmblem from './AwEmblem.svelte';
	import HideButton from './HideButton.svelte';
	import DaJeevenEmblem from './DaJeevenEmblem.svelte';
	import IngmanEmblem from './IngmanEmblem.svelte';
	import JokerEmblem from './JokerEmblem.svelte';
	import LarsAkeEmblem from './LarsAkeEmblem.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';
	import { LADDER, MASTERY, MASTERY_TRACKS } from '#lib/data/camos.ts';

	const MASTERY_TOTAL = MASTERY_TRACKS.reduce((n, tr) => n + tr.camos.length, 0);
	import { squad } from '#lib/squad.svelte.ts';
	import { agoParts, headerStatuses, weeklyMvps, SQUAD_OPS, type HeaderStatus, type SquadOp } from '#lib/squad-codec.ts';
	import { dayKey, playedOn } from '#lib/squad-fun.ts';
	import { combatView, fmtRatio } from '#lib/squad-combat.ts';
	import { banOf } from '#lib/squad-bans.ts';
	import { freshEmote, pranksOn, worn, type ShopItem, type ShopSlot } from '#lib/shop.ts';
	import OpGear, { type GearExtra } from './OpGear.svelte';
	import { faceOf, noseOf } from '#lib/faceGear.ts';
	import { toast } from '#lib/toast.svelte.ts';

	/** This week's MVP(s) in your squad: a small crown on their operator (2026-11-14). */
	const mvps = $derived(squad.on ? weeklyMvps(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])), squad.now) : []);

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
		jeeven: ['todo', 'todo', 'todo'],
		/** not told yet (2026-11-14): not started until the user says otherwise */
		ingman: ['todo', 'todo', 'todo'],
		/** not told yet (2026-11-20): not started until the user says otherwise */
		aw: ['todo', 'todo', 'todo'],
		/** not told yet (2026-11-21): not started until the user says otherwise */
		joker: ['todo', 'todo', 'todo']
	} satisfies Record<SquadOp, Status[]>;

	/** The squad member who is this operator (only when you're in a squad yourself). */
	const live = (op: SquadOp) => (squad.on ? squad.forOp(op) : null);
	/** Pranks on each operator's squad member right now (shop.ts PRANKS). */
	const pr = $derived.by(() => {
		const members = Object.fromEntries(squad.entries.map((e) => [e.id, e.member]));
		return Object.fromEntries(SQUAD_OPS.map((op) => { const e = live(op); return [op, e ? pranksOn(e.id, members, squad.now) : {}]; })) as Record<SquadOp, ReturnType<typeof pranksOn>>;
	});
	const nameOf = (id: string) => squad.entries.find((e) => e.id === id)?.member.name ?? '?';
	/** What each operator's squad member wears from BurgiShop (shop.ts, OpGear; visitors see nothing). */
	const gear = $derived(
		Object.fromEntries(SQUAD_OPS.map((op) => [op, worn(live(op)?.member.shop)])) as Record<SquadOp, Partial<Record<ShopSlot, ShopItem>>>
	);
	/**
	 * The ideas pack's extras per operator (2026-11-20, OpGear): the rifle on the back, a fresh emote (and,
	 * on your own operator with an emote worn, a tap that plays it), a friend's Clown Nose, their Gas Mask.
	 */
	/**
	 * Entrances (the 18-ideas pack, 2026-11-21, shop.ts slot `entry`): someone wearing one comes online while
	 * your page is open → it plays once on their operator; your own plays once when your page opens.
	 */
	let entryAt = $state<Partial<Record<SquadOp, number>>>({});
	const wasOnline = new Map<SquadOp, boolean>();
	$effect(() => {
		for (const op of SQUAD_OPS) {
			const e = live(op);
			if (!e) continue;
			const before = wasOnline.get(op);
			wasOnline.set(op, e.online);
			if (!gear[op].entry || !e.online) continue;
			if ((before === undefined && e.mine) || before === false) entryAt = { ...entryAt, [op]: Date.now() };
		}
	});
	const extras = $derived(
		Object.fromEntries(
			SQUAD_OPS.map((op) => {
				const e = live(op);
				if (!e) return [op, {}];
				const emote = gear[op].emote;
				const ent = gear[op].entry;
				const x: GearExtra = {
					back: gear[op].back?.id,
					hold: gear[op].hold?.id,
					emote: freshEmote(e.member.shop, squad.serverNow()),
					nose: pr[op].clown ? noseOf(op) : null,
					masked: !!pr[op].mask,
					throne: !!gear[op].throne,
					flip: !!pr[op].flip,
					burgerHead: !!pr[op].burgerhead,
					entry: ent && entryAt[op] ? { k: ent.id, at: entryAt[op]! } : null,
					ontap: e.mine && emote ? () => squad.playEmote() && toast.show(t.shop.emote.played(emote.name)) : null,
					tapLabel: emote ? t.shop.emote.tap(emote.name) : undefined
				};
				return [op, x];
			})
		) as Record<SquadOp, GearExtra>
	);
	/**
	 * Calm operators (2026-11-21, the user's pick "Lugna operatörerna" after the battery work): one squad member
	 * moves at a time, TURN_MS each, in frame order; the others stand still where they are (smoke mid-air), via
	 * `data-fx-rest` on their tag, which app.html's frame cap reads. Someone playing an emote moves too. The five
	 * emblems were about half of what the page still drew on a PC and three quarters on a phone.
	 */
	const TURN_ORDER: SquadOp[] = ['abscar', 'phillestar', 'lars', 'jeeven', 'ingman', 'aw', 'joker'];
	const TURN_MS = 6000;
	let turn = $state(0);
	$effect(() => {
		const id = setInterval(() => (turn = (turn + 1) % TURN_ORDER.length), TURN_MS);
		return () => clearInterval(id);
	});
	const awake = (op: SquadOp) => TURN_ORDER[turn] === op || !!extras[op]?.emote || (!!entryAt[op] && Date.now() - entryAt[op]! < 4000);
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
	// Ingman (2026-11-14) is a "Pro player" by his own sign, so he's left out too: Abscar keeps the sticker.
	// AW (2026-11-20) too, until the user says how far he is: with nothing typed in he'd share last place with
	// Abscar and nobody would wear the sticker. TheJoker_BPL (2026-11-21) the same.
	const SLACKER_EXEMPT: SquadOp[] = ['jeeven', 'ingman', 'aw', 'joker'];
	const points = (list: Status[]) => list.reduce((sum, s) => sum + (s === 'done' ? 2 : s === 'active' ? 1 : 0), 0);
	const slacker = $derived.by(() => {
		const scores = (Object.keys(statuses) as SquadOp[])
			.filter((who) => !SLACKER_EXEMPT.includes(who))
			.map((who) => ({ who, n: points(statuses[who]) }));
		const lowest = Math.min(...scores.map((s) => s.n));
		const last = scores.filter((s) => s.n === lowest);
		return last.length === 1 ? last[0].who : null;
	});

	const camos = MASTERY.map((camo) => ({ id: camo.id, name: camo.name.replace(' Reforged', ''), target: camo.target }));

	/**
	 * Live counters on the boxes (squad step 3, the user's ask 2026-11-14: "a live feed of exactly how
	 * many of those camos everyone has"): for a squad member who picked this operator, each row shows
	 * the count from their own tracker ("Orion 214 / 500") and a thin meter. Only where their ticks
	 * agree with the box: if the hand-typed status says more (done by hand, 0 in their tracker), the
	 * box keeps its tick and no number shows rather than a wrong one. Targets come from camos.ts.
	 */
	const counts = $derived(
		Object.fromEntries(
			(Object.keys(SQUAD_MASTERY) as SquadOp[]).map((op) => {
				const e = live(op);
				if (!e) return [op, null];
				const liveStatus = headerStatuses(['todo', 'todo', 'todo'], e.stats.mastery.mp);
				return [op, MASTERY.map((c, i) => (liveStatus[i] === statuses[op][i] ? Math.min(e.member.mastery[c.id] ?? 0, c.target) : null))];
			})
		) as Record<SquadOp, (number | null)[] | null>
	);

	/** "+12" beside a row for a few seconds when someone's counter goes up (not on the first read). */
	let gains = $state<Record<string, number>>({});
	let before: Record<string, number> | null = null;
	const gainTimers = new Map<string, ReturnType<typeof setTimeout>>();
	$effect(() => {
		const now: Record<string, number> = {};
		for (const [op, list] of Object.entries(counts)) list?.forEach((n, i) => n !== null && (now[`${op}:${i}`] = n));
		if (before) {
			for (const [key, n] of Object.entries(now)) {
				const diff = n - (before[key] ?? n);
				if (diff > 0) {
					gains = { ...untrack(() => gains), [key]: diff };
					clearTimeout(gainTimers.get(key));
					gainTimers.set(key, setTimeout(() => {
						const { [key]: _gone, ...rest } = gains;
						gains = rest;
					}, 5000));
				}
			}
		}
		before = now;
	});
	const today = $derived(dayKey(squad.now));
	const short = (n: number) => (n >= 10_000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n));
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
		<p class="op-name og-name font-head text-xl leading-tight font-bold tracking-[0.2em] uppercase" class:op-wrap={wrap} data-style={gear[op].name?.id}>{name}</p>
		{#if gear[op].title}<p class="op-title"><span class="og-title" data-rarity={gear[op].title.rarity}>{gear[op].title.text}</span></p>{/if}
		<p
			class="op-presence font-hud flex items-center gap-1.5 text-[10.5px] tracking-[0.2em] text-accent uppercase"
			data-presence={presence}
			title={presence === 'off' && entry ? t.operator.seen(t.squad.ago(agoParts(entry.member.seen, squad.now))) : undefined}
		>
			<span class="op-online-dot size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
			{presence === 'off' ? t.operator.offline : presence === 'none' ? t.operator.notJoined : t.operator.online}
		</p>
		<!-- their camos from the squad (2026-11-14, the user: "progress on our 4 operators at the top") -->
		{#if entry}
			<!-- Mastery camos done, all three modes (MP as the boxes below show it, WZ + DMZ from their ticks) -->
			{@const mastery =
				statuses[op].filter((x) => x === 'done').length +
				[...entry.stats.mastery.wz, ...entry.stats.mastery.dmz].filter((x) => x === 'complete').length}
			<p class="op-progress font-hud" aria-label={t.summary(entry.stats.ladder[0], entry.stats.ladder[1], entry.stats.ladder[2])}>
				{#each LADDER as camo, i (camo.id)}<span data-camo={camo.id}>{camo.short} <b>{entry.stats.ladder[i]}</b></span>{/each}
			</p>
			{@const played = playedOn(entry.member, today)}
			<p class="op-progress font-hud" title={t.squad.masteryDone(mastery, MASTERY_TOTAL)}>
				<span data-camo="mastery">M <b>{mastery}</b>/{MASTERY_TOTAL}</span>
				<!-- weapons with Pyroclast Cascade, all three Prestige camos (2026-11-15), once they have one -->
				{#if entry.stats.prestige[2] > 0}<span data-camo="pyroclast" title={t.squad.prestigeHeader(entry.stats.prestige[2])}>CAS <b>{entry.stats.prestige[2]}</b></span>{/if}
				{#if played > 0}<span data-camo="played" title={`${t.squad.played.today(t.squad.minutes(played))} (${t.squad.played.hint})`}>⏱ <b>{t.squad.minutesShort(played)}</b></span>{/if}
			</p>
			<!-- their Multiplayer K/D + W/L as they typed it in (Squad tab → Combat record, 2026-11-14) -->
			{@const combat = combatView(entry.member.combat, 'mp')}
			{#if combat && (combat.kd !== null || combat.wl !== null)}
				<p class="op-progress font-hud" title="{t.squad.combat.heading} ({t.squad.combat.modes.mp}) · {t.squad.combat.updated(t.squad.ago(agoParts(combat.latest.at, squad.now)))}">
					{#if combat.kd !== null}<span data-camo="kd">K/D <b>{fmtRatio(combat.kd)}</b></span>{/if}
					{#if combat.wl !== null}<span data-camo="wl">W/L <b>{fmtRatio(combat.wl)}</b></span>{/if}
				</p>
			{/if}
			{#if mvps.includes(entry.id)}
				<span class="op-crown" title={t.squad.mvp}><svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 10 2.5 2.5l3.5 4 2-5.5 2 5.5 3.5-4L15 10z" /></svg><span class="sr-only">{t.squad.mvp}</span></span>
			{/if}
		{/if}
	</div>
{/snippet}

<!-- the "BANNED" stamp over a member's emblem + name (squad-bans.ts; 2026-11-16): a joke ban from the code
     (Ingman typed in a wrong K/D) or a fake K/D over 2.5 in the Combat record. Abscar lifts it for the
     whole squad in the Squad tab's Combat record. -->
{#snippet stamp(op: SquadOp, name: string)}
	{@const ban = banOf(op, squad.doc?.bans ?? undefined, live(op)?.member.combat)}
	{#if ban.on}
		<span class="op-stamp font-head" role="img" aria-label={t.operator.bannedLabel(name, ban.reason)}>
			<span class="op-stamp-word" aria-hidden="true">{t.operator.banned}</span>
			<span class="op-stamp-why" aria-hidden="true">{ban.reason}</span>
		</span>
	{/if}
{/snippet}

<!-- a friend's prank (shop.ts PRANKS): a green TOO HIGH TO PLAY stamp for a day -->
{#snippet high(op: SquadOp)}
	{@const p = pr[op]['too-high']}
	{#if p}
		<span class="op-high font-head" role="img" aria-label={t.pranks.highBy(nameOf(p.by))} title={t.pranks.highBy(nameOf(p.by))}>
			<span class="op-high-word" aria-hidden="true">{t.pranks.stamp}</span>
		</span>
	{/if}
{/snippet}

{#snippet mastery(who: string, statuses: Status[], isSlacker = false, motto: string | readonly string[] = '', tone = 'purple', op: SquadOp = 'abscar')}
	<div class="sq-boxes">
	<ul class="squad-mastery font-hud" aria-label={t.operator.masteryOf(who)}>
		{#each camos as camo, i (camo.id)}
			{@const status = statuses[i] ?? 'todo'}
			{@const n = counts[op]?.[i] ?? null}
			{@const gain = gains[`${op}:${i}`]}
			<li class="sq-camo" data-camo={camo.id} data-status={status} class:sq-counted={n !== null} style:--pct={n !== null ? `${(n / camo.target) * 100}%` : undefined}>
				<span class="sq-box" aria-hidden="true">
					{#if status === 'done'}
						<svg viewBox="0 0 12 12"><path d="M2.6 6.4 5 8.8 9.6 3.6" /></svg>
					{/if}
				</span>
				<span class="sq-name">{camo.name}</span>
				{#if n !== null}
					<span class="sq-count num" title="{n.toLocaleString('en-US')} / {camo.target.toLocaleString('en-US')}">{short(n)}/{short(camo.target)}</span>
					<span class="sr-only">({STATUS_TEXT[status]}, {n} of {camo.target})</span>
					{#if gain}<span class="sq-gain" aria-hidden="true">+{gain}</span>{/if}
				{:else if status === 'active'}
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
		<span class="sq-ring" aria-hidden="true"><i></i></span>
		<span class="squad-legend font-hud">{t.operator.squad}</span>
		<!-- the frame's own "Hide" on its top-right edge, across from the SQUAD pill (2026-11-20) -->
		<HideButton id="squad" />
		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('abscar') ? undefined : ''}>
				<OpGear aura={gear.abscar.aura?.id} effect={gear.abscar.effect?.id} badge={gear.abscar.badge?.id} pet={gear.abscar.pet?.id} smoked={!!pr.abscar['smoke-bomb']} extra={extras.abscar}><AbscarOperator variant="ghillie" class="size-16 flex-none sm:size-20" face={faceOf(gear.abscar)} /></OpGear>
				{@render callsign(t.operator.callsign, 'abscar')}
			</div>
			{@render stamp('abscar', t.operator.callsign)}
			{@render high('abscar')}
			{@render mastery(t.operator.callsign, statuses.abscar, slacker === 'abscar' || !!pr.abscar.slacker, t.operator.abscarStickers, 'moss', 'abscar')}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('phillestar') ? undefined : ''}>
				<OpGear aura={gear.phillestar.aura?.id} effect={gear.phillestar.effect?.id} badge={gear.phillestar.badge?.id} pet={gear.phillestar.pet?.id} smoked={!!pr.phillestar['smoke-bomb']} extra={extras.phillestar}><PhillestarEmblem face={faceOf(gear.phillestar)} /></OpGear>
				{@render callsign(t.operator.mate, 'phillestar')}
			</div>
			{@render stamp('phillestar', t.operator.mate)}
			{@render high('phillestar')}
			{@render mastery(t.operator.mate, statuses.phillestar, slacker === 'phillestar' || !!pr.phillestar.slacker, t.operator.mateMotto, 'purple', 'phillestar')}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('lars') ? undefined : ''}>
				<OpGear aura={gear.lars.aura?.id} effect={gear.lars.effect?.id} badge={gear.lars.badge?.id} pet={gear.lars.pet?.id} smoked={!!pr.lars['smoke-bomb']} extra={extras.lars}><LarsAkeEmblem face={faceOf(gear.lars)} /></OpGear>
				{@render callsign(t.operator.lars, 'lars', true)}
			</div>
			{@render stamp('lars', t.operator.lars)}
			{@render high('lars')}
			{@render mastery(t.operator.lars, statuses.lars, slacker === 'lars' || !!pr.lars.slacker, t.operator.larsMotto, 'lime', 'lars')}
		</div>

		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('jeeven') ? undefined : ''}>
				<OpGear aura={gear.jeeven.aura?.id} effect={gear.jeeven.effect?.id} badge={gear.jeeven.badge?.id} pet={gear.jeeven.pet?.id} smoked={!!pr.jeeven['smoke-bomb']} extra={extras.jeeven}><DaJeevenEmblem face={faceOf(gear.jeeven)} /></OpGear>
				{@render callsign(t.operator.jeeven, 'jeeven')}
			</div>
			{@render stamp('jeeven', t.operator.jeeven)}
			{@render high('jeeven')}
			{@render mastery(t.operator.jeeven, statuses.jeeven, slacker === 'jeeven' || !!pr.jeeven.slacker, '', 'purple', 'jeeven')}
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

		<!-- Ingman, the wizard (2026-11-14, the user's friend), with his sign "Jim and Pro player" -->
		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('ingman') ? undefined : ''}>
				<OpGear aura={gear.ingman.aura?.id} effect={gear.ingman.effect?.id} badge={gear.ingman.badge?.id} pet={gear.ingman.pet?.id} smoked={!!pr.ingman['smoke-bomb']} extra={extras.ingman}><IngmanEmblem face={faceOf(gear.ingman)} /></OpGear>
				{@render callsign(t.operator.ingman, 'ingman')}
			</div>
			{@render stamp('ingman', t.operator.ingman)}
			{@render high('ingman')}
			{@render mastery(t.operator.ingman, statuses.ingman, slacker === 'ingman' || !!pr.ingman.slacker, t.operator.ingmanMotto, 'wizard', 'ingman')}
		</div>

		<!-- AW (2026-11-20, the user's friend), drawn the way the user described him (AwEmblem), with his sign
	     "Sleep is optional" (2026-11-21) -->
		<div class="op-member">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('aw') ? undefined : ''}>
				<OpGear aura={gear.aw.aura?.id} effect={gear.aw.effect?.id} badge={gear.aw.badge?.id} pet={gear.aw.pet?.id} smoked={!!pr.aw['smoke-bomb']} extra={extras.aw}><AwEmblem face={faceOf(gear.aw)} /></OpGear>
				{@render callsign(t.operator.aw, 'aw')}
			</div>
			{@render stamp('aw', t.operator.aw)}
			{@render high('aw')}
			{@render mastery(t.operator.aw, statuses.aw, slacker === 'aw' || !!pr.aw.slacker, t.operator.awMotto, 'teal', 'aw')}
		</div>

		<!-- TheJoker_BPL (2026-11-17, the user's friend), drawn after the picture the user sent (JokerEmblem). Seventh,
		     so he gets the last row to himself, in the middle (styles) -->
		<div class="op-member op-last">
			<div class="op-tag flex items-center gap-3.5" data-fx-rest={awake('joker') ? undefined : ''}>
				<OpGear aura={gear.joker.aura?.id} effect={gear.joker.effect?.id} badge={gear.joker.badge?.id} pet={gear.joker.pet?.id} smoked={!!pr.joker['smoke-bomb']} extra={extras.joker}><JokerEmblem face={faceOf(gear.joker)} /></OpGear>
				<!-- on two lines, "TheJoker_" / "BPL" (a zero-width space after the underscore), like Drängen's, so his
				     long callsign doesn't widen the frame beside the TV -->
				{@render callsign(t.operator.joker.replace('_', '_​'), 'joker', true)}
			</div>
			{@render stamp('joker', t.operator.joker)}
			{@render high('joker')}
			{@render mastery(t.operator.joker, statuses.joker, slacker === 'joker' || !!pr.joker.slacker, '', 'purple', 'joker')}
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
	/* five members (Ingman joined 2026-11-14): three in a row, then two, so the frame still fits beside the TV;
	   six since AW (2026-11-20): two rows of three, so the frame keeps its height; seven since TheJoker_BPL
	   (2026-11-21): he gets a third row to himself, in the middle (and across both columns two by two) */
	@container squad (min-width: 470px) {
		.op-last {
			grid-column: 1 / -1;
			justify-self: center;
		}
	}
	@container squad (min-width: 700px) {
		.squad-frame {
			grid-template-columns: repeat(3, auto);
			column-gap: 14px;
		}
		.op-last {
			grid-column: 2;
		}
		.op-tag :global(.og-body > svg) {
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
		background: linear-gradient(135deg, rgb(28 8 52 / 0.62), rgb(10 4 24 / 0.5)) padding-box;
		box-shadow:
			0 0 20px rgb(190 90 255 / 0.3),
			inset 0 0 16px rgb(255 95 216 / 0.1);
	}
	/* The moving colours (2026-11-20, same look and speed as before): a strip 9× the frame's width slides
	   left on its own layer, masked to the 1.5 px border. It was a background-position animation on the frame
	   itself, which repainted the whole frame with all five emblems on every frame (≈ 40 ms of work each). */
	.sq-ring {
		position: absolute;
		inset: -1.5px;
		padding: 1.5px;
		border-radius: inherit;
		overflow: hidden;
		pointer-events: none;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
	}
	.sq-ring > i {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: 900%;
		background: linear-gradient(110deg, #7a3ff0, #ff6ad5, #4fe6ff, #b265ff, #7a3ff0) 0 0 / 33.3333% 100% repeat-x;
		animation: squad-sheen 9s linear infinite;
		will-change: transform;
	}
	@keyframes squad-sheen {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-66.6667%);
		}
	}
	/* their camos from the squad: G / P / HB counts in the camo colours */
	.op-progress {
		display: flex;
		gap: 7px;
		margin-top: 1px;
		font-size: 10px;
		letter-spacing: 0.12em;
		color: rgb(230 225 240 / 0.8);
		white-space: nowrap;
	}
	.op-progress b {
		font-weight: 700;
	}
	.op-progress [data-camo='gold'] b {
		color: #ffd75a;
	}
	.op-progress [data-camo='platinum'] b {
		color: #e6edf5;
	}
	.op-progress [data-camo='harmonicBreak'] b {
		color: #ff6a7a;
	}
	/* the Mastery count is its own line (a second .op-progress), so the column stays as narrow as before */
	.op-progress [data-camo='mastery'] b {
		color: #c9a6ff;
	}
	/* this week's MVP: a gold crown on top of their emblem */
	.op-crown {
		position: absolute;
		top: -12px;
		left: 20px;
		z-index: 2;
		transform: rotate(-12deg);
		filter: drop-shadow(0 0 5px rgb(255 200 60 / 0.8));
		pointer-events: none;
	}
	.op-crown svg {
		display: block;
		width: 24px;
		height: 18px;
		fill: #ffd75a;
		stroke: #7a4e00;
		stroke-width: 1;
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
	/* Ingman's is wizard purple with his hat's rainbow band along the top */
	.sq-motto[data-tone='wizard'] {
		border-top-width: 4px;
		border-image: linear-gradient(90deg, #e8343a, #f38a1f, #f6d334, #3fb54a, #2f7fe0, #8a3fd0) 4 0 0 0 / 4px 0 0 0;
		border-left: 2px solid #fff;
		border-right: 2px solid #fff;
		border-bottom: 2px solid #fff;
		background: linear-gradient(135deg, #a86ae0, #6d32ad 55%, #40186e);
		transform: rotate(6deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(160 90 255 / 0.5);
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
	/* AW's is teal like his shirt, slapped on the other way (2026-11-21) */
	.sq-motto[data-tone='teal'] {
		background: linear-gradient(135deg, #5ff0e0, #1aa79a 55%, #0b5f57);
		color: #04201d;
		text-shadow: 0 1px 0 rgb(200 255 248 / 0.6);
		transform: rotate(-6deg);
		box-shadow:
			0 2px 5px rgb(0 0 0 / 0.55),
			0 0 10px rgb(40 220 200 / 0.45);
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
	/* the joke "BANNED" stamp: a red rubber stamp slammed across the emblem and name, worn ink (a noise
	   mask punches small holes in it), the reason small underneath */
	.op-stamp {
		position: absolute;
		z-index: 3;
		top: 40px;
		left: 50%;
		display: grid;
		justify-items: center;
		padding: 3px 14px 5px;
		border: 5px double #ff2a2a;
		border-radius: 9px;
		background: rgb(26 2 4 / 0.82);
		color: #ff3030;
		line-height: 1;
		text-transform: uppercase;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.7);
		box-shadow:
			0 0 0 2px rgb(255 42 42 / 0.28),
			0 0 18px rgb(255 30 30 / 0.45),
			inset 0 0 14px rgb(255 42 42 / 0.3);
		transform: translate(-50%, -50%) rotate(-13deg);
		-webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='70'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.72'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
		mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='70'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.72'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
		pointer-events: none;
		animation: op-stamp-in 0.45s cubic-bezier(0.2, 1.5, 0.45, 1) both;
	}
	.op-stamp-word {
		font-size: 36px;
		font-weight: 900;
		letter-spacing: 0.12em;
	}
	.op-stamp-why {
		margin-top: 3px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.26em;
	}
	/* beside other members (two by two / three in a row) the columns are narrower */
	@container squad (min-width: 470px) {
		.op-stamp-word {
			font-size: 30px;
		}
	}
	@container squad (min-width: 700px) {
		/* the tags are 64 px tall here */
		.op-stamp {
			top: 32px;
			padding-inline: 10px;
		}
		.op-stamp-word {
			font-size: 26px;
		}
		.op-stamp-why {
			font-size: 10px;
		}
	}
	/* a friend's TOO HIGH TO PLAY prank: a green stamp, tilted the other way, a bit lower than BANNED */
	.op-high {
		position: absolute;
		z-index: 3;
		top: 58px;
		left: 46%;
		padding: 2px 10px 3px;
		border: 4px double #4fe05a;
		border-radius: 8px;
		background: rgb(4 30 8 / 0.82);
		color: #7dff6a;
		text-transform: uppercase;
		text-shadow: 0 0 6px rgb(80 255 80 / 0.6);
		box-shadow: 0 0 14px rgb(60 220 60 / 0.4);
		transform: translate(-50%, -50%) rotate(9deg);
		pointer-events: auto;
		white-space: nowrap;
		animation: op-high-in 0.45s cubic-bezier(0.2, 1.5, 0.45, 1) both;
	}
	.op-high-word {
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.12em;
	}
	@keyframes op-high-in {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(20deg) scale(2.2);
		}
	}
	@container squad (min-width: 700px) {
		.op-high {
			top: 50px;
		}
		.op-high-word {
			font-size: 12px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.op-high {
			animation: none;
		}
	}
	@keyframes op-stamp-in {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) rotate(-4deg) scale(2.3);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(-13deg) scale(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.op-stamp {
			animation: none;
		}
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
	/* a live counter (squad step 3): "214/500" after the name + a thin meter under the row */
	.sq-counted {
		position: relative;
		padding-bottom: 3px;
	}
	.sq-counted::after {
		content: '';
		position: absolute;
		left: 19px;
		right: 0;
		bottom: 0;
		height: 2px;
		border-radius: 999px;
		background: linear-gradient(90deg, #ffd75a var(--pct, 0%), rgb(255 255 255 / 0.16) var(--pct, 0%));
	}
	.sq-camo[data-status='done'].sq-counted::after {
		background: var(--fill);
	}
	.sq-camo[data-status='todo'].sq-counted::after {
		background: rgb(255 255 255 / 0.12);
	}
	.sq-count {
		margin-left: 2px;
		color: rgb(230 225 240 / 0.85);
		font-size: 9px;
		letter-spacing: 0.04em;
	}
	.sq-camo[data-status='active'] .sq-count {
		color: #ffd75a;
	}
	.sq-camo[data-status='todo'] .sq-count {
		color: rgb(200 198 210 / 0.6);
	}
	.sq-gain {
		margin-left: 2px;
		color: #3ee06a;
		font-size: 10px;
		font-weight: 700;
		text-shadow: 0 0 6px rgb(62 224 106 / 0.8);
		animation: sq-gain 5s ease-out forwards;
		pointer-events: none;
	}
	@keyframes sq-gain {
		0% {
			opacity: 0;
			transform: translateY(4px);
		}
		10%,
		70% {
			opacity: 1;
			transform: none;
		}
		100% {
			opacity: 0;
			transform: translateY(-4px);
		}
	}
	.op-progress [data-camo='played'] b {
		color: #9fe8ff;
	}
	.op-progress [data-camo='pyroclast'] b {
		color: #c4ff5a;
	}
	.op-progress [data-camo='kd'] b {
		color: #7dffa0;
	}
	.op-progress [data-camo='wl'] b {
		color: #ffb35c;
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
