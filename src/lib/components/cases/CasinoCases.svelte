<!--
	BurgiCasino's Case Battles (cases.ts; 2026-11-24, the user: "case battles som från Counter-Strike … på alla
	gamblingsidorna. Lägg till jättemånga sådana", "du har ju redan massa Counter-Strike skins … i en av
	shopparna som du kan använda till lådorna").
	Two views: "Open cases" (pick a case, see what's inside with chances and worth, open 1–5, a sideways reel per
	case) and "Case battle" (put cases in a row, pick players + mode, every seat opens the same cases round by
	round on a reel in its own column; bots play as the squad's operators). Everything is worked out and booked
	at once (squad.recordGame), then played back; `hidden` / `pending` hold back what you won until it shows.
	The house (Abscar) gets what you lose, like every other game. Luck from Abscar's control room counts.
	Against each other (2026-11-24, the user: "gör så att man kan göra case battles mot varandra … man gör en lobby
	och så joinar man och sen öppnas alla cases samtidigt"): the battle view also lists the squad's lobbies
	(cb-lobby.ts, cbLobby.svelte.ts). Open one, the others take a seat (2v2: the seat picks the team), the creator
	can fill the rest with bots; when it's full every page plays the same battle on the same clock (BattleArena).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { lucky } from '#lib/casino-rig.ts';
	import { caseLobbies } from '#lib/cbLobby.svelte.ts';
	import { battleOf, lobbyCost, lobbyEnd, phaseOf, resultFor, seatOf, ROUND_MS, SHOW_MS, SPIN_MS, type Lobby } from '#lib/cb-lobby.ts';
	import {
		battleCost,
		botsFor,
		caseRtp,
		openCases,
		runBattle,
		BATTLE_MODES,
		BATTLE_SIZES,
		CASE_BY_ID,
		CASES,
		GRADES,
		MAX_OPEN,
		MAX_ROUNDS,
		PROFILE_NAMES,
		type Battle,
		type BattleMode,
		type BattleSize,
		type CaseDef,
		type OpenResult
	} from '#lib/cases.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import SquadAvatar from '../SquadAvatar.svelte';
	import CaseBox from './CaseBox.svelte';
	import CaseItemArt from './CaseItemArt.svelte';
	import CaseReel from './CaseReel.svelte';
	import BattleArena, { type ArenaSeat } from './BattleArena.svelte';

	let { balance, hidden = $bindable(0), pending = $bindable(0) }: { balance: number; hidden?: number; pending?: number } = $props();
	const k = t.casino.cases;
	const rand = () => {
		const a = new Uint32Array(1);
		crypto.getRandomValues(a);
		return a[0] / 0x1_0000_0000;
	};
	const fmt = (n: number) => n.toLocaleString('en-US');
	const short = (n: number) => {
		const f = (x: number, u: string) => `${Number((n / x).toFixed(n / x < 10 ? 1 : 0))}${u}`;
		return n >= 1e9 ? f(1e9, 'B') : n >= 1e6 ? f(1e6, 'M') : n >= 1e4 ? f(1e3, 'k') : fmt(n);
	};
	const pct = (p: number) => (p >= 0.1 ? `${(p * 100).toFixed(1)}%` : p >= 0.001 ? `${(p * 100).toFixed(2)}%` : `${(p * 100).toFixed(3)}%`);

	// ---- remembered per device: view, turbo, the battle you built
	const KEY = 'mw4-camo-grind:cases';
	type Saved = { view?: 'open' | 'battle'; turbo?: boolean; sel?: string; rounds?: string[]; size?: BattleSize; mode?: BattleMode };
	let view = $state<'open' | 'battle'>('open');
	let turbo = $state(false);
	let sel = $state('holk');
	let rounds = $state<string[]>([]);
	let size = $state<BattleSize>('1v1');
	let mode = $state<BattleMode>('normal');
	let loaded = false;
	$effect(() => {
		try {
			const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Saved;
			if (s.view === 'battle') view = 'battle';
			turbo = !!s.turbo;
			if (s.sel && CASE_BY_ID.has(s.sel)) sel = s.sel;
			if (Array.isArray(s.rounds)) rounds = s.rounds.filter((id) => CASE_BY_ID.has(id)).slice(0, MAX_ROUNDS);
			if (s.size && BATTLE_SIZES.includes(s.size)) size = s.size;
			if (s.mode && BATTLE_MODES.includes(s.mode)) mode = s.mode;
		} catch {
			// nothing saved / storage blocked
		}
		loaded = true;
	});
	$effect(() => {
		const s: Saved = { view, turbo, sel, rounds: [...rounds], size, mode };
		if (!loaded) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(s));
		} catch {
			// works for this visit
		}
	});

	// ---- the case wall
	type Filter = keyof typeof k.filters;
	const FILTERS = Object.keys(k.filters) as Filter[];
	let filter = $state<Filter>('all');
	let q = $state('');
	const inFilter = (c: CaseDef, f: Filter) =>
		f === 'all' ||
		(f === 'budget' && c.price <= 1000) ||
		(f === 'mid' && c.price > 1000 && c.price <= 50_000) ||
		(f === 'high' && c.price > 50_000 && c.price < 10_000_000) ||
		(f === 'whale' && c.price >= 10_000_000) ||
		(f === 'squad' && c.tag === 'squad') ||
		(f === 'hot' && c.tag === 'hot');
	const shown = $derived.by(() => {
		const s = q.trim().toLowerCase();
		return CASES.filter((c) => inFilter(c, filter) && (!s || c.name.toLowerCase().includes(s) || c.items.some((i) => i.name.toLowerCase().includes(s))));
	});
	const cur = $derived(CASE_BY_ID.get(sel)!);

	function tapCase(id: string) {
		if (busy) return;
		if (view === 'open') {
			sel = id;
			opened = null;
			document.getElementById('cc-stage')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		} else addRound(id);
	}

	// ---- opening
	let count = $state(1);
	let opened = $state<OpenResult | null>(null);
	let openKey = $state(0);
	let landed = $state(0);
	let busy = $state(false);
	/** Won but not shown yet (the balance above waits for it). */
	let openHold = $state(0);
	const openMs = $derived(turbo ? 1400 : 5200);

	function open() {
		const cost = cur.price * count;
		if (cost > free) return toast.show(k.short, undefined, 3500);
		const r = lucky(squad.luck('cases'), rand, () => openCases(cur.id, count, rand), (x) => x.net);
		squad.recordGame(r.net);
		openHold = r.won;
		opened = r;
		landed = 0;
		skipNow = false;
		openKey++;
		busy = true;
	}
	function landedOne() {
		if (!busy) return;
		landed++;
		sound.play('clack');
		if (!opened || landed < opened.pulls.length) return;
		openHold = 0;
		busy = false;
		if (opened.net >= Math.max(1000, opened.cost * 5)) squad.casinoNews(t.casino.event.cases(opened.net, 'open'));
	}
	function skipOpen() {
		if (!opened) return;
		landed = 0;
		skipNow = true;
		openKey++;
	}
	let skipNow = $state(false);

	// ---- battles
	const roundCost = $derived(battleCost(rounds));
	function addRound(id: string) {
		if (rounds.length >= MAX_ROUNDS) return toast.show(k.roundsMax(MAX_ROUNDS), undefined, 3000);
		rounds = [...rounds, id];
	}
	const scrollStage = () => document.getElementById('cc-stage')?.scrollIntoView({ block: 'start', behavior: 'smooth' });

	// against bots: on this page's own clock
	type BotRun = { battle: Battle; seats: ArenaSeat[]; start: number; key: string };
	let botRun = $state<BotRun | null>(null);
	let botHold = $state(0);
	let skipped = $state(false);
	let localNow = $state(Date.now());
	$effect(() => {
		if (!botRun) return;
		const iv = setInterval(() => (localNow = Date.now()), 100);
		return () => clearInterval(iv);
	});
	const roundMs = $derived(turbo ? 1700 : ROUND_MS);
	const spinMs = $derived(turbo ? 1200 : SPIN_MS);
	function startBots() {
		if (!rounds.length) return;
		if (roundCost > free) return toast.show(k.short, undefined, 3500);
		const b = lucky(squad.luck('cases'), rand, () => runBattle(rounds, size, mode, rand), (x) => x.net);
		squad.recordGame(b.net);
		botHold = b.payout[0];
		const bots = botsFor(size, squad.me?.op, Math.floor(rand() * 1e9));
		const seats: ArenaSeat[] = b.pulls.map((_, s) =>
			s === 0 ? { name: squad.me?.name ?? k.you, op: squad.me?.op ?? undefined, you: true, bot: false } : { name: bots[s - 1].name, op: bots[s - 1].op as SquadOp, you: false, bot: true }
		);
		localNow = Date.now();
		botRun = { battle: b, seats, start: localNow + 500, key: String(Math.floor(rand() * 1e9)) };
		skipped = false;
		watchId = null;
		busy = true;
		scrollStage();
	}
	function botEnd() {
		if (!botRun || !busy) return;
		busy = false;
		botHold = 0;
		const b = botRun.battle;
		if (b.mode !== 'share' && b.net >= Math.max(1000, b.cost * 3)) squad.casinoNews(t.casino.event.cases(b.net, 'battle'));
	}

	// against each other: the squad's lobbies (read every 2.5 s in the battle view, 8 s otherwise)
	$effect(() => caseLobbies.watch(view === 'battle' ? 2500 : 8000));
	const lnow = $derived(caseLobbies.now);
	$effect(() => {
		void lnow;
		caseLobbies.settle();
	});
	const meId = $derived(squad.me?.id ?? '');
	const lobbies = $derived(caseLobbies.lobbies.filter((l) => !l.start || lnow - lobbyEnd(l) < SHOW_MS).toReversed());
	/** The lobby you sit in that hasn't started (one at a time). */
	const myOpen = $derived(caseLobbies.lobbies.find((l) => !l.start && seatOf(l, meId) >= 0) ?? null);
	let watchId = $state<string | null>(null);
	const watched = $derived(caseLobbies.lobby(watchId));
	$effect(() => {
		if (watchId && caseLobbies.ready && !watched) {
			watchId = null;
			toast.show(k.gone, undefined, 3000);
		}
	});
	/** A battle you sit in has started: open it (once). */
	const autoSeen = new Set<string>();
	$effect(() => {
		if (view !== 'battle' || botRun) return;
		for (const l of caseLobbies.lobbies) {
			if (!l.start || seatOf(l, meId) < 0 || autoSeen.has(l.id) || phaseOf(l, lnow) === 'done') continue;
			autoSeen.add(l.id);
			if (watchId !== l.id) {
				watchId = l.id;
				skipped = false;
				scrollStage();
			}
		}
	});
	let revealed = $state<string[]>([]);
	/** The price of every seat you hold that isn't booked yet (waiting, or counting down to the start). */
	const lobbyCostHeld = $derived(
		caseLobbies.lobbies.reduce((a, l) => {
			const s = l.seats.find((x) => x?.id === meId);
			const mineHere = s && (!l.start || s.dev === squad.device);
			return a + (mineHere && !caseLobbies.booked.some((b) => b.id === l.id) ? lobbyCost(l) : 0);
		}, 0)
	);
	const lobbyWinHeld = $derived(caseLobbies.booked.reduce((a, bk) => a + (bk.end > lnow && !revealed.includes(bk.id) ? bk.payout : 0), 0));
	const free = $derived(Math.max(0, balance - openHold - botHold - lobbyCostHeld - lobbyWinHeld));
	$effect(() => {
		hidden = openHold + botHold + lobbyCostHeld + lobbyWinHeld;
		pending = openHold + botHold + lobbyWinHeld;
	});
	const seatName = (l: Lobby, id: string) => l.seats.find((x) => x?.id === id)?.name ?? '?';
	const lobbySeats = (l: Lobby): ArenaSeat[] => l.seats.map((x) => ({ name: x?.name ?? '?', op: x?.op, you: x?.id === meId, bot: !!x?.bot }));

	let working = $state(false);
	async function act(job: () => Promise<boolean | string | null>, fail: string) {
		if (working) return;
		working = true;
		const ok = await job();
		working = false;
		if (!ok) toast.show(fail, undefined, 3500);
		return ok;
	}
	async function createLobby() {
		if (!rounds.length) return;
		if (myOpen) return toast.show(k.inOther, undefined, 3500);
		if (roundCost > free) return toast.show(k.short, undefined, 3500);
		const id = await act(() => caseLobbies.create(rounds, size, mode, roundCost), k.failed);
		if (typeof id === 'string') {
			watchId = id;
			skipped = false;
			scrollStage();
		}
	}
	async function join(l: Lobby, seat: number) {
		if (myOpen) return toast.show(k.inOther, undefined, 3500);
		if (lobbyCost(l) > free) return toast.show(k.short, undefined, 3500);
		if (await act(() => caseLobbies.join(l.id, seat), k.taken)) {
			watchId = l.id;
			skipped = false;
		}
	}
	function lobbyEnded(l: Lobby) {
		if (!revealed.includes(l.id)) revealed = [...revealed, l.id];
		const bk = caseLobbies.booked.find((x) => x.id === l.id);
		// only right as it ends (not when someone opens an old result later)
		if (bk && l.mode !== 'share' && Date.now() - 1500 < bk.end + 6000 && caseLobbies.time() - bk.end < 6000 && bk.net >= Math.max(1000, lobbyCost(l) * 3))
			squad.casinoNews(t.casino.event.cases(bk.net, 'battle'));
	}
	function leaveBattle() {
		botRun = null;
		watchId = null;
		skipped = false;
	}
</script>

<div class="cc grid gap-3">
	<!-- header + Open / Battle switch -->
	<header class="cc-head">
		<span class="cc-head-art" aria-hidden="true"><CaseBox id="dragon-lore" size={84} /></span>
		<div class="min-w-[min(100%,15rem)] flex-1">
			<p class="cc-title font-head">{k.title}</p>
			<p class="text-[13px] text-fg/90">{k.line}</p>
		</div>
		<div class="cc-head-ctrl">
			<div class="cc-switch" role="group" aria-label={k.viewsLabel}>
				{#each ['open', 'battle'] as const as v (v)}
					<button type="button" class="cc-view font-head" aria-pressed={view === v} disabled={busy} onclick={() => ((view = v), (opened = null), leaveBattle())}
						data-v={v}>{k.views[v]}</button
					>
				{/each}
			</div>
			<label class="cc-turbo"><input type="checkbox" bind:checked={turbo} /><span class="cc-tog" aria-hidden="true"></span><span class="font-head">⚡ {k.turbo}</span></label>
		</div>
	</header>

	<!-- the stage -->
	<div id="cc-stage" class="cc-stage rounded-card">
		{#if view === 'open'}
			<div class="cc-open">
				<div class="cc-spot" style:--c1={cur.colour} style:--g={GRADES[cur.items[0].grade].colour}>
					<span class="cc-rays" aria-hidden="true"></span>
					<span class="cc-pedestal" aria-hidden="true"></span>
					<span class="cc-spot-box"><CaseBox id={cur.id} size={190} open={busy || !!opened} /></span>
				</div>
				<div class="cc-info">
					{#if cur.tag}<span class="cc-tag inline font-head" data-tag={cur.tag}>{k.tags[cur.tag]}</span>{/if}
					<p class="cc-case-name font-head">{cur.name}</p>
					<div class="cc-facts">
						<span class="cc-fact gold num">{fmt(cur.price)} 🍔</span>
						<span class="cc-fact">{k.profile(PROFILE_NAMES[cur.profile])}</span>
						<span class="cc-fact">{k.items(cur.items.length)}</span>
						<span class="cc-fact top num" style:--g={GRADES[cur.items[0].grade].colour}>{k.upTo(short(cur.items[0].value))}</span>
					</div>
					<div class="cc-count">
						<span class="text-xs text-muted">{k.howMany}</span>
						<div class="cc-seg">
							{#each Array.from({ length: MAX_OPEN }, (_, i) => i + 1) as n (n)}
								<button type="button" class="cc-n num font-head" aria-pressed={count === n} disabled={busy} onclick={() => ((count = n), (opened = null))}>{n}</button>
							{/each}
						</div>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="cc-go font-head" disabled={busy || cur.price * count > free} onclick={open}>{k.open(count, fmt(cur.price * count))}</button>
						{#if busy && opened}<button type="button" class="btn" onclick={skipOpen}>{k.skip}</button>{/if}
					</div>
					{#if cur.price * count > free && !busy}<p class="cc-bad text-xs">{k.short}</p>{/if}
				</div>
			</div>
			{#if opened}
				<div class="cc-reels grid gap-2">
					{#key openKey}
						{#each opened.pulls as pick, i (i)}
							<CaseReel caseId={opened.caseId} {pick} ms={skipNow ? 0 : openMs + i * 350} seed={openKey * 31 + i} ondone={landedOne} />
						{/each}
					{/key}
					{#if !busy}
						{@const c = CASE_BY_ID.get(opened.caseId)!}
						<div class="cc-loot" role="status">
							{#each opened.pulls as pick, i (i)}
								{@const it = c.items[pick]}
								<div class="cc-loot-item" style:--g={GRADES[it.grade].colour} style:--d="{i * 90}ms">
									<span class="cc-loot-art"><CaseItemArt ref={it.ref} grade={it.grade} /></span>
									<span class="cc-loot-grade">{GRADES[it.grade].name}</span>
									<span class="cc-loot-name">{it.name}</span>
									<span class="cc-loot-val num font-head">{fmt(it.value)} 🍔</span>
								</div>
							{/each}
						</div>
						<div class="cc-sum" class:good={opened.net >= 0}>
							<p class="font-head text-[16px] font-bold">{k.got(fmt(opened.won), opened.net)}</p>
							<p class="text-xs text-muted">{k.sold}</p>
						</div>
					{/if}
				</div>
			{/if}
		{:else if botRun}
			{@const run = botRun}
			<BattleArena battle={run.battle} seats={run.seats} start={run.start} now={localNow} {roundMs} {spinMs} key={run.key} {skipped} onend={botEnd}>
				{#snippet end(done: boolean)}
					{#if done}
						{@const b = run.battle}
						<div class="cc-end" class:good={b.payout[0] > 0} role="status">
							<p class="cc-end-big font-head">
								{b.mode === 'share' ? k.share(fmt(b.payout[0])) : b.payout[0] > 0 ? k.won(fmt(b.payout[0])) : k.lost}
							</p>
							<p class="num text-[13px] text-muted">{k.result(fmt(b.cost), fmt(b.payout[0]), b.net)}</p>
							<div class="flex flex-wrap gap-2">
								<button type="button" class="cc-go small font-head" disabled={b.cost > free} onclick={startBots}>{k.again} · {fmt(b.cost)} 🍔</button>
								<button type="button" class="btn" onclick={leaveBattle}>{k.edit}</button>
							</div>
						</div>
					{:else}
						<button type="button" class="btn btn-sm justify-self-start" onclick={() => (skipped = true)}>{k.skip}</button>
					{/if}
				{/snippet}
			</BattleArena>
		{:else if watched}
			{@const w = watched}
			<div class="grid gap-3">
				<button type="button" class="btn btn-sm justify-self-start" onclick={leaveBattle}>‹ {k.back}</button>
				{@render lobbyCard(w, true)}
				{#if w.start}
					<BattleArena battle={battleOf(w)} seats={lobbySeats(w)} start={w.start} now={lnow} roundMs={ROUND_MS} spinMs={SPIN_MS} key={w.id} skipped={skipped || revealed.includes(w.id)} onend={() => lobbyEnded(w)}>
						{#snippet end(done: boolean)}
							{#if done}
								{@const r = resultFor(w, meId)}
								{@const b = battleOf(w)}
								<div class="cc-end" class:good={!!r && r.payout > 0} role="status">
									{#if r}
										<p class="cc-end-big font-head">
											{w.mode === 'share' ? k.share(fmt(r.payout)) : r.payout > 0 ? k.won(fmt(r.payout)) : k.lost}
										</p>
										<p class="num text-[13px] text-muted">{k.result(fmt(r.cost), fmt(r.payout), r.net)}</p>
									{:else}
										<p class="cc-end-big font-head">👑 {k.winner}: {b.winners.map((s) => w.seats[s]?.name ?? '?').join(', ')}</p>
									{/if}
									<button type="button" class="btn justify-self-start" onclick={leaveBattle}>{k.back}</button>
								</div>
							{:else}
								<button type="button" class="btn btn-sm justify-self-start" onclick={() => ((skipped = true), lobbyEnded(w))}>{k.skip}</button>
							{/if}
						{/snippet}
					</BattleArena>
				{/if}
			</div>
		{:else}
			<!-- battle builder -->
			<div class="cc-build">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<p class="cc-h font-head">{k.rounds} <span class="num text-muted">{rounds.length}/{MAX_ROUNDS}</span></p>
					{#if rounds.length}<button type="button" class="btn btn-sm" onclick={() => (rounds = [])}>{k.clear}</button>{/if}
				</div>
				{#if rounds.length}
					<ol class="cc-rounds">
						{#each rounds as id, i (i)}
							{@const c = CASE_BY_ID.get(id)!}
							<li class="cc-round" style:--c1={c.colour}>
								<span class="cc-round-no num font-head">{i + 1}</span>
								<CaseBox {id} size={70} />
								<span class="cc-round-name">{c.name}</span>
								<span class="num text-[11px] font-bold text-[#ffd23a]">{short(c.price)}</span>
								<button type="button" class="cc-x" aria-label={k.remove(c.name)} onclick={() => (rounds = rounds.filter((_, j) => j !== i))}>×</button>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="cc-empty text-[13px]">{k.roundsEmpty}</p>
				{/if}
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="grid gap-1.5">
						<span class="text-xs text-muted">{k.size}</span>
						<div class="cc-seg wrap">
							{#each BATTLE_SIZES as s (s)}<button type="button" class="cc-pill font-head" aria-pressed={size === s} onclick={() => (size = s)}>{k.sizes[s]}</button>{/each}
						</div>
					</div>
					<div class="grid gap-1.5">
						<span class="text-xs text-muted">{k.mode}</span>
						<div class="cc-seg wrap">
							{#each BATTLE_MODES as m (m)}<button type="button" class="cc-pill font-head" data-mode={m} aria-pressed={mode === m} onclick={() => (mode = m)}>{k.modes[m]}</button>{/each}
						</div>
					</div>
				</div>
				<p class="cc-help" data-mode={mode}>{k.modeHelp[mode]}{size === '2v2' ? ` ${k.teamHelp}` : ''}</p>
				<div class="cc-buy">
					<div class="min-w-0">
						<p class="text-[11px] tracking-[0.1em] text-muted uppercase">{k.total}</p>
						<p class="num font-head text-[20px] font-black text-[#ffd23a]">{fmt(roundCost)} 🍔</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="cc-go cc-create font-head" disabled={!rounds.length || roundCost > free || !!myOpen || working} onclick={createLobby}>⚔️ {k.create(fmt(roundCost))}</button>
						<button type="button" class="btn cc-bots" disabled={!rounds.length || roundCost > free} onclick={startBots}>🤖 {k.vsBots}</button>
					</div>
				</div>
				{#if rounds.length}<p class="text-xs text-muted">{k.cost(fmt(roundCost))}</p>{/if}
				{#if rounds.length && roundCost > free}<p class="cc-bad text-xs">{k.short}</p>{/if}
				{#if myOpen}<p class="text-xs text-muted">{k.inOther}</p>{/if}
			</div>
			<!-- the squad's lobbies -->
			<div class="mt-4 grid gap-2">
				<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<p class="cc-h font-head">⚔️ {k.lobbies} <span class="num text-muted">{lobbies.length}</span></p>
					<p class="text-xs text-muted">{k.lobbyHelp}</p>
				</div>
				{#if !lobbies.length}<p class="cc-empty text-[13px]">{k.lobbiesNone}</p>{/if}
				<div class="cc-lobbies">
					{#each lobbies as l (l.id)}{@render lobbyCard(l, false)}{/each}
				</div>
			</div>
		{/if}
	</div>

	{#snippet lobbyCard(l: Lobby, big: boolean)}
		{@const ph = phaseOf(l, lnow)}
		{@const mine = seatOf(l, meId)}
		{@const cost = lobbyCost(l)}
		{@const filled = l.seats.filter(Boolean).length}
		<div class="cc-lobby" class:big data-lobby={l.id} data-phase={ph} class:mine={mine >= 0}>
			<div class="cc-lobby-top">
				<span class="cc-badge font-head" data-mode={l.mode}>{k.modes[l.mode]}</span>
				<span class="cc-badge size font-head">{k.sizes[l.size]}</span>
				<span class="cc-phase font-head" data-phase={ph}
					>{ph === 'open' ? k.phase.open(filled, l.seats.length) : ph === 'countdown' ? k.startsIn(Math.max(1, Math.ceil(((l.start ?? 0) - lnow) / 1000))) : k.phase[ph]}</span
				>
			</div>
			<div class="flex flex-wrap items-baseline justify-between gap-x-3">
				<p class="min-w-0 truncate font-head text-[15px] font-bold">{k.by(seatName(l, l.by))}</p>
				<p class="num text-[13px] font-bold text-[#ffd23a]">{k.each(fmt(cost))}</p>
			</div>
			<ol class="cc-mini" aria-hidden="true">
				{#each l.cases as id, i (i)}<li><CaseBox {id} size={38} /></li>{/each}
			</ol>
			<div class="cc-lseats" style:--n={l.seats.length}>
				{#each l.seats as s, i (i)}
					<div class="cc-lseat" class:gap={l.size === '2v2' && i === 2} class:you={!!s && s.id === meId} class:empty={!s} data-team={l.size === '2v2' ? (i < 2 ? 1 : 2) : undefined}>
						{#if s}
							<SquadAvatar name={s.name} op={s.op} size={32} />
							<span class="grid min-w-0"
								><span class="truncate text-[12px] font-bold">{s.id === meId ? k.you : s.name}</span>{#if s.bot || l.size === '2v2'}<span class="truncate text-[10px] text-muted"
										>{s.bot ? k.bot : ''}{l.size === '2v2' ? `${s.bot ? ' · ' : ''}${k.team(i < 2 ? 1 : 2)}` : ''}</span
									>{/if}</span
							>
						{:else}
							<button type="button" class="cc-join font-head" disabled={ph !== 'open' || mine >= 0 || !!myOpen || cost > free || working} onclick={() => join(l, i)}>+ {l.size === '2v2' ? k.joinTeam(i < 2 ? 1 : 2) : k.join}</button>
						{/if}
					</div>
				{/each}
			</div>
			{#if (ph === 'open' && (l.by === meId || mine >= 0)) || (!big && (l.start || mine >= 0))}
				<div class="flex flex-wrap gap-2">
					{#if ph === 'open' && l.by === meId}
						<button type="button" class="btn btn-sm cc-fill" disabled={working} onclick={() => act(() => caseLobbies.fill(l.id), k.failed)}>🤖 {k.fill}</button>
						<button type="button" class="btn btn-sm cc-close" disabled={working} onclick={() => act(() => caseLobbies.leave(l.id), k.failed)}>{k.close}</button>
					{:else if ph === 'open' && mine >= 0}
						<button type="button" class="btn btn-sm cc-leave" disabled={working} onclick={() => act(() => caseLobbies.leave(l.id), k.failed)}>{k.leave}</button>
					{/if}
					{#if !big && (l.start || mine >= 0)}
						<button type="button" class="btn btn-sm cc-watch" onclick={() => ((watchId = l.id), (skipped = false), scrollStage())}>{ph === 'done' ? k.seeResult : `▶ ${k.watch}`}</button>
					{/if}
				</div>
			{/if}
			{#if big && ph === 'open'}<p class="cc-waiting text-xs">{k.waiting}</p>{/if}
		</div>
	{/snippet}

	{#if view === 'open'}
		<!-- what's inside -->
		<details class="cc-inside rounded-card" open>
			<summary class="cc-h font-head">{k.inside} <span class="text-muted">· {cur.name}</span></summary>
			<p class="mb-2 text-xs text-muted">{k.insideNote(`${Math.round(caseRtp(cur) * 100)} %`)}</p>
			<ul class="cc-items">
				{#each cur.items as it (it.ref)}
					<li style:--g={GRADES[it.grade].colour}>
						<span class="cc-it-chance num">{pct(it.p)}</span>
						<span class="cc-items-art"><CaseItemArt ref={it.ref} grade={it.grade} /></span>
						<span class="cc-it-grade">{GRADES[it.grade].name}</span>
						<span class="cc-it-name" title={it.name}>{it.name}</span>
						<span class="cc-it-val num font-head">{fmt(it.value)} 🍔</span>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

	<!-- the case wall -->
	<div class="cc-wall grid gap-3">
		<div class="cc-toolbar">
			<div class="cc-seg wrap" role="group" aria-label={k.filtersLabel}>
				{#each FILTERS as f (f)}<button type="button" class="cc-pill font-head" aria-pressed={filter === f} onclick={() => (filter = f)}>{k.filters[f]}</button>{/each}
			</div>
			<label class="cc-search-wrap">
				<span aria-hidden="true">🔍</span>
				<input class="cc-search" type="search" placeholder={k.search} aria-label={k.search} bind:value={q} />
			</label>
			<span class="text-xs text-muted">{k.count(shown.length)}</span>
		</div>
		{#if !shown.length}<p class="cc-empty text-[13px]">{k.noHit}</p>{/if}
		<ul class="cc-grid">
			{#each shown as c (c.id)}
				<li>
					<button type="button" class="cc-card" data-case={c.id} aria-pressed={view === 'open' ? sel === c.id : undefined} disabled={busy} style:--c1={c.colour} style:--g={GRADES[c.items[0].grade].colour} onclick={() => tapCase(c.id)}>
						{#if c.tag}<span class="cc-tag font-head" data-tag={c.tag}>{k.tags[c.tag]}</span>{/if}
						<span class="cc-card-art"><CaseBox id={c.id} size={118} /></span>
						<span class="cc-card-name font-head">{c.name}</span>
						<span class="cc-grades" aria-hidden="true">{#each [...new Set(c.items.map((i) => i.grade))].reverse() as g (g)}<i style:--g={GRADES[g].colour}></i>{/each}</span>
						<span class="cc-card-up num">{k.upTo(short(c.items[0].value))}</span>
						<span class="cc-card-price num font-head">{fmt(c.price)} 🍔</span>
						{#if view === 'battle'}<span class="cc-add font-head">+ {k.addRound}</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>
</div>

<style>
	.cc {
		--cc-gold: #ffd23a;
		--cc-line: rgb(255 201 40 / 0.28);
		--cc-panel: linear-gradient(180deg, #1b1520, #0d0a10);
	}
	.good > .cc-end-big {
		color: #7dff6a;
	}
	.cc-bad {
		color: #ff6a5a;
	}
	.cc-h {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.cc-empty {
		padding: 14px;
		border-radius: 12px;
		border: 1.5px dashed rgb(255 255 255 / 0.16);
		color: var(--t-muted);
		text-align: center;
	}

	/* ---------- header ---------- */
	.cc-head {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 16px;
		padding: 12px 16px;
		border-radius: 16px;
		overflow: hidden;
		background:
			radial-gradient(60% 140% at 0% 50%, rgb(255 170 40 / 0.22), transparent 70%),
			radial-gradient(40% 120% at 100% 0%, rgb(235 75 75 / 0.18), transparent 70%),
			var(--cc-panel);
		border: 1.5px solid var(--cc-line);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
	}
	.cc-head-art {
		flex: none;
		transform: rotate(-6deg);
	}
	@media (max-width: 459px) {
		.cc-head-art {
			display: none;
		}
	}
	.cc-title {
		font-size: 28px;
		line-height: 1.05;
		font-weight: 900;
		letter-spacing: 0.03em;
		background: linear-gradient(180deg, #fff8d0, #ffd23a 45%, #ff7a1a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: none !important;
		filter: drop-shadow(0 2px 0 rgb(0 0 0 / 0.6));
	}
	.cc-head-ctrl {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 12px;
	}
	.cc-switch {
		display: inline-flex;
		padding: 4px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.45);
		border: 1.5px solid rgb(255 201 40 / 0.4);
	}
	.cc-view {
		min-height: 40px;
		padding: 0 16px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 800;
		color: var(--t-muted);
		transition:
			background 0.2s,
			color 0.2s;
	}
	.cc-view::before {
		content: '📦 ' / '';
	}
	.cc-view[data-v='battle']::before {
		content: '⚔️ ' / '';
	}
	.cc-view[aria-pressed='true'] {
		background: linear-gradient(180deg, #ffe88a, #e9a518);
		color: #2a1604;
		box-shadow: 0 2px 10px rgb(255 180 40 / 0.4);
	}
	/* "Fast" as a little switch (the checkbox stays, hidden, for the keyboard + screen readers) */
	.cc-turbo {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		font-size: 13px;
		font-weight: 700;
		cursor: pointer;
	}
	.cc-turbo input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
	}
	.cc-tog {
		position: relative;
		width: 38px;
		height: 22px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.15);
		border: 1.5px solid rgb(255 255 255 / 0.2);
		transition: background 0.2s;
	}
	.cc-tog::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: #fff;
		transition: translate 0.2s;
	}
	.cc-turbo input:checked + .cc-tog {
		background: #e9a518;
		border-color: #ffd23a;
	}
	.cc-turbo input:checked + .cc-tog::after {
		translate: 16px 0;
	}
	.cc-turbo input:focus-visible + .cc-tog {
		outline: 2px solid var(--cc-gold);
		outline-offset: 2px;
	}

	/* ---------- stage ---------- */
	.cc-stage {
		padding: 14px;
		border-radius: 16px;
		background:
			radial-gradient(120% 80% at 50% 0%, rgb(255 190 60 / 0.1), transparent 60%),
			var(--cc-panel);
		border: 1.5px solid var(--cc-line);
	}
	@media (min-width: 640px) {
		.cc-stage {
			padding: 18px;
		}
	}
	.cc-open {
		display: grid;
		gap: 14px;
		align-items: center;
	}
	@media (min-width: 640px) {
		.cc-open {
			grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
		}
	}
	.cc-spot {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 230px;
		border-radius: 14px;
		overflow: hidden;
		background: radial-gradient(60% 70% at 50% 45%, color-mix(in srgb, var(--c1) 40%, transparent), transparent 75%), #07060a;
		isolation: isolate;
	}
	.cc-rays {
		position: absolute;
		inset: -40%;
		z-index: -1;
		background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--g) 22%, transparent) 0deg 8deg, transparent 8deg 22deg);
		mask: radial-gradient(closest-side, #000 20%, transparent 75%);
		animation: cc-spin 40s linear infinite;
	}
	@keyframes cc-spin {
		to {
			rotate: 1turn;
		}
	}
	.cc-pedestal {
		position: absolute;
		bottom: 22px;
		left: 50%;
		width: 230px;
		height: 30px;
		translate: -50% 0;
		border-radius: 50%;
		background: radial-gradient(closest-side, color-mix(in srgb, var(--g) 45%, transparent), transparent);
	}
	.cc-spot-box {
		position: relative;
		margin-top: 18px;
		filter: drop-shadow(0 10px 18px rgb(0 0 0 / 0.6));
	}
	.cc-info {
		display: grid;
		gap: 10px;
		justify-items: start;
	}
	.cc-case-name {
		font-size: 26px;
		font-weight: 900;
		line-height: 1.1;
		color: #fff;
	}
	.cc-facts {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.cc-fact {
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 700;
		background: rgb(255 255 255 / 0.07);
		border: 1px solid rgb(255 255 255 / 0.12);
	}
	.cc-fact.gold {
		color: #2a1604;
		background: linear-gradient(180deg, #ffe88a, #e9a518);
		border-color: transparent;
	}
	.cc-fact.top {
		color: var(--g);
		border-color: color-mix(in srgb, var(--g) 60%, transparent);
		background: color-mix(in srgb, var(--g) 12%, transparent);
	}
	.cc-count {
		display: grid;
		gap: 4px;
	}
	.cc-seg {
		display: inline-flex;
		gap: 4px;
		padding: 4px;
		border-radius: 14px;
		background: rgb(0 0 0 / 0.4);
		border: 1px solid rgb(255 255 255 / 0.1);
	}
	.cc-seg.wrap {
		flex-wrap: wrap;
	}
	.cc-n {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		font-size: 16px;
		font-weight: 900;
		color: var(--t-muted);
		transition: background 0.15s;
	}
	.cc-n:hover:not(:disabled) {
		background: rgb(255 255 255 / 0.08);
	}
	.cc-n[aria-pressed='true'],
	.cc-pill[aria-pressed='true'] {
		background: linear-gradient(180deg, #ffe88a, #e9a518);
		color: #2a1604;
	}
	.cc-pill {
		min-height: 40px;
		padding: 0 14px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: 800;
		color: var(--t-fg);
	}
	.cc-pill:hover:not([aria-pressed='true']) {
		background: rgb(255 255 255 / 0.08);
	}
	.cc-pill[data-mode='crazy'][aria-pressed='true'] {
		background: linear-gradient(180deg, #ff8ae6, #d628a8);
		color: #fff;
	}
	.cc-pill[data-mode='terminal'][aria-pressed='true'] {
		background: linear-gradient(180deg, #9ad0ff, #2a7ae0);
		color: #fff;
	}
	.cc-pill[data-mode='share'][aria-pressed='true'] {
		background: linear-gradient(180deg, #9dff8a, #2fae3a);
		color: #062a0a;
	}
	/* the big gold button */
	.cc-go {
		position: relative;
		min-height: 52px;
		padding: 0 22px;
		border-radius: 14px;
		overflow: hidden;
		font-size: 16px;
		font-weight: 900;
		color: #2a1604;
		background: linear-gradient(180deg, #fff2a8, #ffc928 45%, #e08a10);
		border: 1.5px solid #fff2a8;
		box-shadow:
			0 4px 0 #8a4a06,
			0 8px 18px rgb(255 160 30 / 0.35);
		transition:
			transform 0.1s,
			box-shadow 0.1s,
			filter 0.2s;
	}
	.cc-go::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%);
		background-size: 250% 100%;
		background-position: 130% 0;
		transition: background-position 0.7s;
	}
	.cc-go:hover:not(:disabled)::after {
		background-position: -30% 0;
	}
	.cc-go:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow:
			0 1px 0 #8a4a06,
			0 4px 10px rgb(255 160 30 / 0.3);
	}
	.cc-go:disabled {
		filter: grayscale(0.7) brightness(0.7);
		box-shadow: none;
	}
	.cc-go.small {
		min-height: 44px;
		font-size: 14px;
	}
	.cc-reels {
		margin-top: 14px;
	}
	.cc-loot {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
		gap: 8px;
	}
	.cc-loot-item {
		display: grid;
		justify-items: center;
		gap: 2px;
		padding: 8px 8px 10px;
		border-radius: 12px;
		text-align: center;
		background:
			radial-gradient(closest-side at 50% 35%, color-mix(in srgb, var(--g) 35%, transparent), transparent),
			linear-gradient(180deg, #17131c, #0b090e);
		border: 1px solid color-mix(in srgb, var(--g) 45%, transparent);
		border-bottom: 3px solid var(--g);
		animation: cc-in 0.45s cubic-bezier(0.3, 1.6, 0.5, 1) var(--d, 0ms) backwards;
	}
	.cc-loot-art {
		width: 100%;
		height: 56px;
	}
	.cc-loot-grade {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--g);
	}
	.cc-loot-name {
		font-size: 11px;
		line-height: 1.2;
		color: var(--t-fg);
	}
	.cc-loot-val {
		font-size: 14px;
		font-weight: 900;
		color: var(--cc-gold);
	}
	@keyframes cc-in {
		from {
			transform: scale(0.6) translateY(10px);
			opacity: 0;
		}
	}
	.cc-sum {
		padding: 10px 14px;
		border-radius: 12px;
		background: rgb(255 106 90 / 0.08);
		border: 1px solid rgb(255 106 90 / 0.35);
		color: #ff8a7a;
	}
	.cc-sum.good {
		background: rgb(125 255 106 / 0.08);
		border-color: rgb(125 255 106 / 0.4);
		color: #9dff8a;
	}

	/* ---------- what's inside ---------- */
	.cc-inside {
		padding: 12px 14px;
		border-radius: 16px;
		background: var(--cc-panel);
		border: 1.5px solid var(--cc-line);
	}
	.cc-inside summary {
		min-height: 32px;
		cursor: pointer;
	}
	.cc-items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
	}
	@media (max-width: 420px) {
		.cc-items {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.cc-items li {
		position: relative;
		display: grid;
		gap: 1px;
		padding: 8px 8px 9px;
		border-radius: 12px;
		background:
			radial-gradient(70% 55% at 50% 38%, color-mix(in srgb, var(--g) 30%, transparent), transparent),
			linear-gradient(180deg, #19151e, #0c0a0f);
		border: 1px solid rgb(255 255 255 / 0.07);
		border-bottom: 3px solid var(--g);
	}
	.cc-it-chance {
		position: absolute;
		top: 6px;
		right: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 800;
		background: rgb(0 0 0 / 0.55);
		color: #fff;
	}
	.cc-items-art {
		height: 54px;
		margin: 4px 0 2px;
	}
	.cc-it-grade {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--g);
	}
	.cc-it-name {
		overflow: hidden;
		font-size: 12px;
		font-weight: 700;
		line-height: 1.2;
		color: var(--t-fg);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		min-height: 2.4em;
	}
	.cc-it-val {
		font-size: 13px;
		font-weight: 900;
		color: var(--cc-gold);
	}

	/* ---------- the case wall ---------- */
	.cc-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 10px;
	}
	.cc-search-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1 1 200px;
		max-width: 340px;
		min-height: 44px;
		padding: 0 12px;
		border-radius: 12px;
		background: rgb(0 0 0 / 0.45);
		border: 1px solid rgb(255 255 255 / 0.14);
	}
	.cc-search-wrap:focus-within {
		border-color: var(--cc-gold);
		box-shadow: 0 0 0 2px rgb(255 210 58 / 0.25);
	}
	.cc-search {
		flex: 1;
		min-width: 0;
		min-height: 42px;
		background: none;
		border: 0;
		outline: none;
		color: var(--t-fg);
		font-size: 14px;
	}
	.cc-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 12px;
	}
	@media (max-width: 420px) {
		.cc-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px;
		}
	}
	.cc-card {
		position: relative;
		display: grid;
		justify-items: center;
		align-content: start;
		gap: 3px;
		width: 100%;
		height: 100%;
		padding: 14px 8px 12px;
		border-radius: 16px;
		overflow: hidden;
		isolation: isolate;
		background:
			radial-gradient(75% 55% at 50% 32%, color-mix(in srgb, var(--c1) 38%, transparent), transparent 72%),
			linear-gradient(180deg, #1a1520, #0b090e);
		border: 1.5px solid color-mix(in srgb, var(--c1) 45%, rgb(255 255 255 / 0.08));
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease,
			border-color 0.18s ease;
	}
	/* a soft burst of light behind the case on hover / when picked */
	.cc-card::before {
		content: '';
		position: absolute;
		inset: -30% -30% 30%;
		z-index: -1;
		background: repeating-conic-gradient(from 0deg at 50% 50%, color-mix(in srgb, var(--g) 18%, transparent) 0deg 10deg, transparent 10deg 24deg);
		mask: radial-gradient(closest-side, #000 25%, transparent 70%);
		opacity: 0;
		transition: opacity 0.25s;
	}
	.cc-card:hover:not(:disabled),
	.cc-card:focus-visible {
		transform: translateY(-4px);
		border-color: color-mix(in srgb, var(--c1) 80%, white);
		box-shadow: 0 10px 24px color-mix(in srgb, var(--c1) 35%, transparent);
	}
	.cc-card:hover:not(:disabled)::before,
	.cc-card[aria-pressed='true']::before {
		opacity: 1;
	}
	.cc-card[aria-pressed='true'] {
		border-color: var(--cc-gold);
		box-shadow:
			0 0 0 2px var(--cc-gold),
			0 0 22px rgb(255 210 58 / 0.35);
	}
	.cc-card:disabled {
		opacity: 0.55;
	}
	.cc-card-art {
		margin-bottom: 4px;
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.55));
	}
	.cc-card-name {
		font-size: 14px;
		font-weight: 800;
		text-align: center;
		line-height: 1.15;
		color: #fff;
	}
	.cc-grades {
		display: flex;
		gap: 3px;
		margin: 2px 0;
	}
	.cc-grades i {
		width: 14px;
		height: 4px;
		border-radius: 2px;
		background: var(--g);
	}
	.cc-card-up {
		font-size: 11px;
		color: var(--g);
		font-weight: 700;
	}
	.cc-card-price {
		margin-top: 4px;
		padding: 3px 12px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 900;
		color: #2a1604;
		background: linear-gradient(180deg, #ffe88a, #e9a518);
	}
	.cc-add {
		margin-top: 2px;
		font-size: 11px;
		font-weight: 800;
		color: #7dff6a;
	}
	.cc-tag {
		position: absolute;
		top: 8px;
		left: 8px;
		z-index: 3;
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 10px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: #555;
		color: #fff;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
	}
	.cc-tag.inline {
		position: static;
		justify-self: start;
	}
	.cc-tag[data-tag='hot'] {
		background: linear-gradient(180deg, #ff7a4a, #e0281a);
	}
	.cc-tag[data-tag='whale'] {
		background: linear-gradient(180deg, #7ae6ff, #1aa0e0);
		color: #04223a;
	}
	.cc-tag[data-tag='squad'] {
		background: linear-gradient(180deg, #7dff6a, #2fae3a);
		color: #06260c;
	}
	.cc-tag[data-tag='budget'] {
		background: linear-gradient(180deg, #c9d3dc, #8a96a0);
		color: #111;
	}

	/* ---------- battle builder ---------- */
	.cc-build {
		display: grid;
		gap: 12px;
	}
	.cc-rounds {
		display: flex;
		gap: 10px;
		overflow-x: auto;
		padding: 12px 4px 8px;
		scrollbar-width: thin;
	}
	.cc-round {
		position: relative;
		flex: 0 0 104px;
		display: grid;
		justify-items: center;
		gap: 2px;
		padding: 10px 4px 6px;
		border-radius: 12px;
		background:
			radial-gradient(70% 60% at 50% 35%, color-mix(in srgb, var(--c1) 30%, transparent), transparent),
			rgb(0 0 0 / 0.35);
		border: 1px solid rgb(255 255 255 / 0.1);
	}
	.cc-round-no {
		position: absolute;
		top: -8px;
		left: -4px;
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 11px;
		font-weight: 900;
		background: var(--cc-gold);
		color: #2a1604;
	}
	.cc-round-name {
		max-width: 100%;
		overflow: hidden;
		font-size: 10px;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--t-muted);
	}
	.cc-x {
		position: absolute;
		top: -10px;
		right: -8px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #c21a2a;
		color: #fff;
		font-weight: 900;
		border: 2px solid #0b0b0f;
	}
	.cc-x::before {
		content: '';
		position: absolute;
		inset: -8px;
	}
	.cc-help {
		padding: 8px 12px;
		border-radius: 10px;
		font-size: 13px;
		background: rgb(255 210 58 / 0.08);
		border-left: 3px solid var(--cc-gold);
	}
	.cc-help[data-mode='crazy'] {
		background: rgb(255 106 214 / 0.08);
		border-color: #ff6ad6;
	}
	.cc-help[data-mode='terminal'] {
		background: rgb(90 170 255 / 0.08);
		border-color: #5aaaff;
	}
	.cc-help[data-mode='share'] {
		background: rgb(125 255 106 / 0.08);
		border-color: #7dff6a;
	}
	.cc-buy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px 16px;
		padding: 12px 14px;
		border-radius: 14px;
		background: rgb(0 0 0 / 0.35);
		border: 1px solid rgb(255 201 40 / 0.25);
	}
	.cc-bots {
		min-height: 52px;
	}

	/* ---------- lobbies ---------- */
	.cc-lobbies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
		gap: 12px;
	}
	.cc-lobby {
		display: grid;
		gap: 10px;
		padding: 12px;
		border-radius: 14px;
		background:
			radial-gradient(100% 60% at 50% 0%, rgb(255 255 255 / 0.05), transparent),
			linear-gradient(180deg, #19141e, #0c0a0f);
		border: 1.5px solid rgb(255 255 255 / 0.12);
	}
	.cc-lobby.mine {
		border-color: rgb(255 210 58 / 0.6);
	}
	.cc-lobby[data-phase='live'],
	.cc-lobby[data-phase='countdown'] {
		border-color: #ff4a2a;
		box-shadow: 0 0 16px rgb(255 74 42 / 0.35);
	}
	.cc-lobby[data-phase='done'] {
		opacity: 0.85;
	}
	.cc-lobby-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}
	.cc-badge {
		padding: 2px 9px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #ffe88a, #e9a518);
		color: #2a1604;
	}
	.cc-badge[data-mode='crazy'] {
		background: linear-gradient(180deg, #ff8ae6, #d628a8);
		color: #fff;
	}
	.cc-badge[data-mode='terminal'] {
		background: linear-gradient(180deg, #9ad0ff, #2a7ae0);
		color: #fff;
	}
	.cc-badge[data-mode='share'] {
		background: linear-gradient(180deg, #9dff8a, #2fae3a);
		color: #062a0a;
	}
	.cc-badge.size {
		background: rgb(255 255 255 / 0.1);
		color: var(--t-fg);
	}
	.cc-phase {
		margin-left: auto;
		padding: 2px 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 800;
		background: #1f5a2a;
		color: #c8ffc8;
		border: 1px solid #43d35e;
	}
	.cc-phase[data-phase='countdown'],
	.cc-phase[data-phase='live'] {
		background: #b3141b;
		color: #fff;
		border-color: #ff6a5a;
		animation: cc-blink 1s steps(2) infinite;
	}
	.cc-phase[data-phase='done'] {
		background: #333;
		color: #ccc;
		border-color: #555;
	}
	@keyframes cc-blink {
		50% {
			opacity: 0.65;
		}
	}
	.cc-mini {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.cc-lseats {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: 6px;
	}
	.cc-lseat {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		min-height: 52px;
		padding: 6px 8px;
		border-radius: 10px;
		background: rgb(255 255 255 / 0.05);
		border: 1px solid rgb(255 255 255 / 0.08);
	}
	.cc-lseat[data-team='1'] {
		border-top: 2px solid #4d8dff;
	}
	.cc-lseat[data-team='2'] {
		border-top: 2px solid #ff8a2a;
	}
	.cc-lseat.you {
		background: rgb(255 210 58 / 0.08);
		border-color: rgb(255 210 58 / 0.55);
	}
	.cc-lseat.empty {
		padding: 0;
		border-style: dashed;
		border-color: rgb(255 255 255 / 0.22);
		background: none;
	}
	.cc-lseat.gap {
		margin-left: 6px;
	}
	.cc-join {
		width: 100%;
		min-height: 50px;
		padding: 0 4px;
		border-radius: 10px;
		font-size: 12px;
		font-weight: 800;
		color: #7dff6a;
		transition: background 0.15s;
	}
	.cc-join:hover:not(:disabled) {
		background: rgb(125 255 106 / 0.1);
	}
	.cc-join:disabled {
		color: var(--t-muted);
		opacity: 0.6;
	}
	.cc-waiting {
		color: var(--t-muted);
		animation: cc-blink 1.6s ease-in-out infinite;
	}
	@media (max-width: 520px) {
		.cc-lseats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.cc-lseat.gap {
			margin-left: 0;
		}
	}

	/* ---------- result ---------- */
	.cc-end {
		display: grid;
		gap: 8px;
		padding: 14px;
		border-radius: 14px;
		background: rgb(255 106 90 / 0.07);
		border: 1.5px solid rgb(255 106 90 / 0.4);
	}
	.cc-end.good {
		background:
			radial-gradient(80% 120% at 50% 0%, rgb(125 255 106 / 0.18), transparent 70%),
			rgb(0 0 0 / 0.3);
		border-color: #43d35e;
		box-shadow: 0 0 22px rgb(67 211 94 / 0.25);
	}
	.cc-end-big {
		font-size: 22px;
		font-weight: 900;
		color: #ff8a7a;
	}
	@media (prefers-reduced-motion: reduce) {
		.cc-loot-item,
		.cc-rays,
		.cc-phase,
		.cc-waiting {
			animation: none;
		}
	}
</style>
