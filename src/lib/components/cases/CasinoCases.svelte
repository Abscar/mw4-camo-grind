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
	<div class="cc-head flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card px-4 py-3">
		<div class="min-w-[min(100%,16rem)] flex-1">
			<p class="cc-title font-head">{k.title}</p>
			<p class="text-[13px] text-fg">{k.line}</p>
		</div>
		<div class="cc-switch" role="group" aria-label={k.viewsLabel}>
			{#each ['open', 'battle'] as const as v (v)}
				<button type="button" class="cc-view font-head" aria-pressed={view === v} disabled={busy} onclick={() => ((view = v), (opened = null), leaveBattle())}>{k.views[v]}</button>
			{/each}
		</div>
		<label class="cc-turbo"><input type="checkbox" bind:checked={turbo} /> <span>{k.turbo}</span></label>
	</div>

	<!-- the stage -->
	<div id="cc-stage" class="cc-stage rounded-card p-3 sm:p-4">
		{#if view === 'open'}
			<div class="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
				<div class="justify-self-center"><CaseBox id={cur.id} size={150} open={busy || !!opened} /></div>
				<div class="grid gap-2">
					<p class="font-head text-xl font-bold text-fg">{cur.name}</p>
					<p class="text-[13px] text-muted">{fmt(cur.price)} 🍔 · {k.profile(PROFILE_NAMES[cur.profile])} · {cur.items.length} items</p>
					<div class="flex flex-wrap items-center gap-2">
						<span class="w-full text-xs text-muted sm:w-auto">{k.howMany}</span>
						{#each Array.from({ length: MAX_OPEN }, (_, i) => i + 1) as n (n)}
							<button type="button" class="cc-n num" aria-pressed={count === n} disabled={busy} onclick={() => ((count = n), (opened = null))}>{n}</button>
						{/each}
					</div>
					<div class="flex flex-wrap gap-2">
						<button type="button" class="btn btn-primary cc-go" disabled={busy || cur.price * count > free} onclick={open}>{k.open(count, fmt(cur.price * count))}</button>
						{#if busy && opened}<button type="button" class="btn" onclick={skipOpen}>{k.skip}</button>{/if}
					</div>
					{#if cur.price * count > free && !busy}<p class="cc-bad text-xs">{k.short}</p>{/if}
				</div>
			</div>
			{#if opened}
				<div class="mt-3 grid gap-2">
					{#key openKey}
						{#each opened.pulls as pick, i (i)}
							<CaseReel caseId={opened.caseId} {pick} ms={skipNow ? 0 : openMs + i * 350} seed={openKey * 31 + i} ondone={landedOne} />
						{/each}
					{/key}
					{#if !busy}
						{@const c = CASE_BY_ID.get(opened.caseId)!}
						<div class="cc-loot flex flex-wrap gap-2" role="status">
							{#each opened.pulls as pick, i (i)}
								{@const it = c.items[pick]}
								<div class="cc-loot-item" style:--g={GRADES[it.grade].colour}>
									<span class="h-12 w-20"><CaseItemArt ref={it.ref} grade={it.grade} /></span>
									<span class="text-[11px] leading-tight text-fg">{it.name}</span>
									<span class="num text-[12px] font-bold">{fmt(it.value)} 🍔</span>
								</div>
							{/each}
						</div>
						<p class="font-head text-[15px] font-bold" class:cc-good={opened.net >= 0} class:cc-bad={opened.net < 0}>{k.got(fmt(opened.won), opened.net)}</p>
						<p class="text-xs text-muted">{k.sold}</p>
					{/if}
				</div>
			{/if}
		{:else if botRun}
			{@const run = botRun}
			<BattleArena battle={run.battle} seats={run.seats} start={run.start} now={localNow} {roundMs} {spinMs} key={run.key} {skipped} onend={botEnd}>
				{#snippet end(done: boolean)}
					{#if done}
						{@const b = run.battle}
						<div class="cc-end grid gap-2 rounded-lg px-3 py-2" role="status">
							<p class="font-head text-lg font-bold" class:cc-good={b.payout[0] > 0} class:cc-bad={!b.payout[0]}>
								{b.mode === 'share' ? k.share(fmt(b.payout[0])) : b.payout[0] > 0 ? k.won(fmt(b.payout[0])) : k.lost}
							</p>
							<p class="num text-[13px] text-muted">{k.result(fmt(b.cost), fmt(b.payout[0]), b.net)}</p>
							<div class="flex flex-wrap gap-2">
								<button type="button" class="btn btn-primary" disabled={b.cost > free} onclick={startBots}>{k.again} · {fmt(b.cost)} 🍔</button>
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
								<div class="cc-end grid gap-2 rounded-lg px-3 py-2" role="status">
									{#if r}
										<p class="font-head text-lg font-bold" class:cc-good={r.payout > 0} class:cc-bad={!r.payout}>
											{w.mode === 'share' ? k.share(fmt(r.payout)) : r.payout > 0 ? k.won(fmt(r.payout)) : k.lost}
										</p>
										<p class="num text-[13px] text-muted">{k.result(fmt(r.cost), fmt(r.payout), r.net)}</p>
									{:else}
										<p class="font-head text-lg font-bold">{k.winner}: {b.winners.map((s) => w.seats[s]?.name ?? '?').join(', ')}</p>
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
			<div class="grid gap-3">
				<div class="flex flex-wrap items-baseline justify-between gap-2">
					<p class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{k.rounds} <span class="num text-muted">({rounds.length}/{MAX_ROUNDS})</span></p>
					{#if rounds.length}<button type="button" class="btn btn-sm" onclick={() => (rounds = [])}>{k.clear}</button>{/if}
				</div>
				{#if rounds.length}
					<ol class="cc-rounds">
						{#each rounds as id, i (i)}
							{@const c = CASE_BY_ID.get(id)!}
							<li class="cc-round">
								<CaseBox {id} size={64} />
								<span class="num text-[11px]">{short(c.price)}</span>
								<button type="button" class="cc-x" aria-label={k.remove(c.name)} onclick={() => (rounds = rounds.filter((_, j) => j !== i))}>×</button>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="text-[13px] text-muted">{k.roundsEmpty}</p>
				{/if}
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="grid gap-1.5">
						<span class="text-xs text-muted">{k.size}</span>
						<div class="flex flex-wrap gap-1.5">
							{#each BATTLE_SIZES as s (s)}<button type="button" class="cc-pill font-head" aria-pressed={size === s} onclick={() => (size = s)}>{k.sizes[s]}</button>{/each}
						</div>
					</div>
					<div class="grid gap-1.5">
						<span class="text-xs text-muted">{k.mode}</span>
						<div class="flex flex-wrap gap-1.5">
							{#each BATTLE_MODES as m (m)}<button type="button" class="cc-pill font-head" data-mode={m} aria-pressed={mode === m} onclick={() => (mode = m)}>{k.modes[m]}</button>{/each}
						</div>
					</div>
				</div>
				<p class="text-[13px] text-fg">{k.modeHelp[mode]}{size === '2v2' ? ` ${k.teamHelp}` : ''}</p>
				<div class="flex flex-wrap items-center gap-2">
					<button type="button" class="btn btn-primary cc-go cc-create" disabled={!rounds.length || roundCost > free || !!myOpen || working} onclick={createLobby}>{k.create(fmt(roundCost))}</button>
					<button type="button" class="btn cc-go cc-bots" disabled={!rounds.length || roundCost > free} onclick={startBots}>{k.vsBots}</button>
				</div>
				{#if rounds.length}<p class="text-xs text-muted">{k.cost(fmt(roundCost))}</p>{/if}
				{#if rounds.length && roundCost > free}<p class="cc-bad text-xs">{k.short}</p>{/if}
				{#if myOpen}<p class="text-xs text-muted">{k.inOther}</p>{/if}
			</div>
			<!-- the squad's lobbies -->
			<div class="mt-4 grid gap-2">
				<p class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">⚔️ {k.lobbies} <span class="num text-muted">({lobbies.length})</span></p>
				<p class="text-xs text-muted">{k.lobbyHelp}</p>
				{#if !lobbies.length}<p class="text-[13px] text-muted">{k.lobbiesNone}</p>{/if}
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
			<div class="flex flex-wrap items-center justify-between gap-2">
				<p class="min-w-0 font-head text-[14px] font-bold">{k.by(seatName(l, l.by))} · {k.sizes[l.size]} · {k.modes[l.mode]}</p>
				<span class="cc-phase font-head" data-phase={ph}>{ph === 'open' ? k.phase.open(filled, l.seats.length) : ph === 'countdown' ? k.startsIn(Math.max(1, Math.ceil(((l.start ?? 0) - lnow) / 1000))) : k.phase[ph]}</span>
			</div>
			<p class="text-[12px] text-muted">{k.each(fmt(cost))} · {k.count(l.cases.length)}</p>
			<ol class="cc-mini" aria-hidden="true">
				{#each l.cases as id, i (i)}<li><CaseBox {id} size={34} /></li>{/each}
			</ol>
			<div class="cc-lseats" style:--n={l.seats.length}>
				{#each l.seats as s, i (i)}
					<div class="cc-lseat" class:gap={l.size === '2v2' && i === 2} class:you={!!s && s.id === meId} class:empty={!s}>
						{#if s}
							<SquadAvatar name={s.name} op={s.op} size={28} />
							<span class="grid min-w-0"
								><span class="truncate text-[12px] font-bold">{s.id === meId ? k.you : s.name}</span>{#if s.bot || l.size === '2v2'}<span class="truncate text-[10px] text-muted"
										>{s.bot ? k.bot : ''}{l.size === '2v2' ? `${s.bot ? ' · ' : ''}${k.team(i < 2 ? 1 : 2)}` : ''}</span
									>{/if}</span
							>
						{:else}
							<button type="button" class="btn btn-sm cc-join" disabled={ph !== 'open' || mine >= 0 || !!myOpen || cost > free || working} onclick={() => join(l, i)}>{l.size === '2v2' ? k.joinTeam(i < 2 ? 1 : 2) : k.join}</button>
						{/if}
					</div>
				{/each}
			</div>
			<div class="flex flex-wrap gap-2">
				{#if ph === 'open' && l.by === meId}
					<button type="button" class="btn btn-sm cc-fill" disabled={working} onclick={() => act(() => caseLobbies.fill(l.id), k.failed)}>🤖 {k.fill}</button>
					<button type="button" class="btn btn-sm cc-close" disabled={working} onclick={() => act(() => caseLobbies.leave(l.id), k.failed)}>{k.close}</button>
				{:else if ph === 'open' && mine >= 0}
					<button type="button" class="btn btn-sm cc-leave" disabled={working} onclick={() => act(() => caseLobbies.leave(l.id), k.failed)}>{k.leave}</button>
				{/if}
				{#if !big && (l.start || mine >= 0)}
					<button type="button" class="btn btn-sm cc-watch" onclick={() => ((watchId = l.id), (skipped = false), scrollStage())}>{ph === 'done' ? k.seeResult : k.watch}</button>
				{/if}
			</div>
			{#if big && ph === 'open'}<p class="text-xs text-muted">{k.waiting}</p>{/if}
		</div>
	{/snippet}

	{#if view === 'open'}
		<!-- what's inside -->
		<details class="cc-inside rounded-card px-3 py-2" open>
			<summary class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{k.inside} · {cur.name}</summary>
			<p class="my-1 text-xs text-muted">{k.insideNote(`${Math.round(caseRtp(cur) * 100)} %`)}</p>
			<ul class="cc-items">
				{#each cur.items as it (it.ref)}
					<li style:--g={GRADES[it.grade].colour}>
						<span class="cc-items-art"><CaseItemArt ref={it.ref} grade={it.grade} /></span>
						<span class="min-w-0">
							<span class="block truncate text-[12px] font-bold text-fg" title={it.name}>{it.name}</span>
							<span class="block text-[11px]" style:color={GRADES[it.grade].colour}>{GRADES[it.grade].name}</span>
						</span>
						<span class="num text-right text-[12px]"><b>{fmt(it.value)}</b> 🍔<span class="block text-[11px] text-muted">{pct(it.p)}</span></span>
					</li>
				{/each}
			</ul>
		</details>
	{/if}

	<!-- the case wall -->
	<div class="cc-wall grid gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<div class="flex flex-wrap gap-1.5" role="group" aria-label={k.filtersLabel}>
				{#each FILTERS as f (f)}<button type="button" class="cc-pill font-head" aria-pressed={filter === f} onclick={() => (filter = f)}>{k.filters[f]}</button>{/each}
			</div>
			<input class="field cc-search" type="search" placeholder={k.search} aria-label={k.search} bind:value={q} />
			<span class="text-xs text-muted">{k.count(shown.length)}</span>
		</div>
		{#if !shown.length}<p class="text-[13px] text-muted">{k.noHit}</p>{/if}
		<ul class="cc-grid">
			{#each shown as c (c.id)}
				<li>
					<button type="button" class="cc-card" data-case={c.id} aria-pressed={view === 'open' ? sel === c.id : undefined} disabled={busy} style:--c1={c.colour} onclick={() => tapCase(c.id)}>
						{#if c.tag}<span class="cc-tag font-head" data-tag={c.tag}>{k.tags[c.tag]}</span>{/if}
						<CaseBox id={c.id} size={104} />
						<span class="cc-card-name font-head">{c.name}</span>
						<span class="cc-card-price num">{fmt(c.price)} 🍔</span>
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
	}
	.cc-good {
		color: #7dff6a;
	}
	.cc-bad {
		color: #ff6a5a;
	}
	.cc-head,
	.cc-stage,
	.cc-inside {
		background:
			radial-gradient(120% 90% at 50% 0%, rgb(255 190 60 / 0.12), transparent 60%),
			linear-gradient(180deg, #1c1408, #0c0904);
		border: 1.5px solid rgb(255 201 40 / 0.35);
	}
	.cc-title {
		font-size: 24px;
		font-weight: 900;
		letter-spacing: 0.04em;
		background: linear-gradient(180deg, #fff6c0, #ffd23a 50%, #ff8a1a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: none !important;
	}
	.cc-switch {
		display: inline-flex;
		border: 1.5px solid rgb(255 201 40 / 0.5);
		border-radius: 999px;
		padding: 3px;
		background: rgb(0 0 0 / 0.35);
	}
	.cc-view {
		min-height: 40px;
		padding: 0 14px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 800;
		color: var(--t-muted);
	}
	.cc-view[aria-pressed='true'] {
		background: linear-gradient(180deg, #ffe27a, #e0a018);
		color: #2a1604;
	}
	.cc-turbo {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		font-size: 13px;
	}
	.cc-n {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		border: 1.5px solid rgb(255 255 255 / 0.18);
		font-weight: 800;
	}
	.cc-n[aria-pressed='true'],
	.cc-pill[aria-pressed='true'] {
		background: var(--cc-gold);
		color: #2a1604;
		border-color: var(--cc-gold);
	}
	.cc-pill {
		min-height: 44px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1.5px solid rgb(255 255 255 / 0.18);
		font-size: 12px;
		font-weight: 800;
	}
	.cc-pill[data-mode='crazy'][aria-pressed='true'] {
		background: #ff4ad0;
		border-color: #ff4ad0;
	}
	.cc-go {
		min-height: 48px;
		font-size: 15px;
	}
	.cc-search {
		min-height: 44px;
		flex: 1 1 180px;
		max-width: 320px;
	}
	.cc-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 10px;
	}
	@media (max-width: 420px) {
		.cc-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.cc-card {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 4px;
		width: 100%;
		height: 100%;
		padding: 12px 6px 10px;
		border-radius: 14px;
		border: 1.5px solid color-mix(in srgb, var(--c1) 55%, transparent);
		background:
			radial-gradient(80% 60% at 50% 30%, color-mix(in srgb, var(--c1) 30%, transparent), transparent 70%),
			linear-gradient(180deg, #17120a, #0a0805);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}
	.cc-card:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--c1) 40%, transparent);
	}
	.cc-card[aria-pressed='true'] {
		border-color: var(--cc-gold);
		box-shadow: 0 0 0 2px var(--cc-gold), 0 0 18px rgb(255 210 58 / 0.4);
	}
	.cc-card:disabled {
		opacity: 0.6;
	}
	.cc-card-name {
		font-size: 13px;
		font-weight: 800;
		text-align: center;
		line-height: 1.15;
	}
	.cc-card-price {
		font-size: 12px;
		color: var(--cc-gold);
		font-weight: 700;
	}
	.cc-add {
		font-size: 11px;
		color: #7dff6a;
	}
	.cc-tag {
		position: absolute;
		top: 6px;
		left: 6px;
		z-index: 3;
		padding: 1px 7px;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 800;
		text-transform: uppercase;
		background: #444;
		color: #fff;
	}
	.cc-tag[data-tag='hot'] {
		background: #ff4a2a;
	}
	.cc-tag[data-tag='whale'] {
		background: #2ad0ff;
		color: #04223a;
	}
	.cc-tag[data-tag='squad'] {
		background: #43d35e;
		color: #06260c;
	}
	.cc-tag[data-tag='budget'] {
		background: #8a9aa5;
		color: #111;
	}
	.cc-items {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 6px;
	}
	.cc-items li {
		display: grid;
		grid-template-columns: 72px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		padding: 4px 8px 4px 4px;
		border-radius: 8px;
		background: linear-gradient(90deg, color-mix(in srgb, var(--g) 18%, transparent), rgb(255 255 255 / 0.03));
		border-left: 3px solid var(--g);
	}
	.cc-items-art {
		height: 40px;
	}
	.cc-loot-item {
		display: grid;
		justify-items: center;
		gap: 2px;
		width: 116px;
		padding: 6px;
		border-radius: 10px;
		text-align: center;
		background: radial-gradient(closest-side, color-mix(in srgb, var(--g) 25%, transparent), transparent), rgb(0 0 0 / 0.3);
		border-bottom: 3px solid var(--g);
		animation: cc-in 0.4s ease;
	}
	@keyframes cc-in {
		from {
			transform: scale(0.7);
			opacity: 0;
		}
	}
	.cc-rounds {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.cc-round {
		position: relative;
		display: grid;
		justify-items: center;
		padding: 4px 4px 2px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.3);
	}
	.cc-x {
		position: absolute;
		top: -10px;
		right: -10px;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: #b3141b;
		color: #fff;
		font-weight: 900;
		border: 2px solid #0b0b0f;
	}
	.cc-x::before {
		content: '';
		position: absolute;
		inset: -7px;
	}
	.cc-lobbies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
		gap: 10px;
	}
	.cc-lobby {
		display: grid;
		gap: 8px;
		padding: 10px;
		border-radius: 12px;
		background: rgb(0 0 0 / 0.32);
		border: 1.5px solid rgb(255 255 255 / 0.12);
	}
	.cc-lobby.mine {
		border-color: rgb(255 210 58 / 0.55);
	}
	.cc-lobby[data-phase='live'],
	.cc-lobby[data-phase='countdown'] {
		border-color: #ff4a2a;
		box-shadow: 0 0 14px rgb(255 74 42 / 0.35);
	}
	.cc-phase {
		padding: 2px 9px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 800;
		background: #2a6a34;
		color: #eaffea;
	}
	.cc-phase[data-phase='countdown'],
	.cc-phase[data-phase='live'] {
		background: #ff4a2a;
		color: #fff;
	}
	.cc-phase[data-phase='done'] {
		background: #444;
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
		min-height: 48px;
		padding: 4px 6px;
		border-radius: 10px;
		background: rgb(255 255 255 / 0.05);
	}
	.cc-lseat.you {
		outline: 1.5px solid rgb(255 210 58 / 0.6);
	}
	.cc-lseat.empty {
		justify-content: center;
		border: 1.5px dashed rgb(255 255 255 / 0.2);
		background: none;
	}
	.cc-lseat.gap {
		margin-left: 6px;
	}
	.cc-join {
		min-height: 40px;
		width: 100%;
		padding-inline: 4px;
		font-size: 12px;
	}
	@media (max-width: 520px) {
		.cc-lseats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.cc-lseat.gap {
			margin-left: 0;
		}
	}
	.cc-end {
		background: rgb(0 0 0 / 0.35);
		border: 1.5px solid rgb(255 201 40 / 0.35);
	}
	@media (prefers-reduced-motion: reduce) {
		.cc-loot-item {
			animation: none;
		}
	}
</style>
