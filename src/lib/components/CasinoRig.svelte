<!--
	Abscar's control room in BurgiCasino (2026-11-19, the user's ask: "en admin meny till casinot … en panel
	där jag kan ändra odds, vilka kort blackjack dealern ska dra, vilka symboler som ska komma upp på slotsen,
	ändra individuell 'luck' på alla operators"). The Admin tile, only for the member who is Abscar
	(HOUSE_OP): the burger admin menu (CasinoAdmin, moved here from BurgiBank), odds per game, luck per
	player, and a picked result per game: Abscar's Fortune's whole screen, a Fortune II feature, a Kushburst
	result (2026-11-20), what an Abscar's Stash spin has, the roulette number, the blackjack dealer's cards. Saved in the squad document (casino-rig.ts, squad.setTune); each
	player's own page applies it to its plays. Nothing goes on the radio.
-->
<script lang="ts">
	import { BOOK_FORCES, type BookForce } from '#lib/book.ts';
	import { evaluate, FREE_SPINS, SYMBOLS, type SlotSymbol } from '#lib/casino-slots.ts';
	import {
		luckWords,
		presetScreen,
		DEALER_MAX,
		DEALER_PRESETS,
		F2_FORCES,
		KUSH_FORCES,
		LUCK_MAX,
		RIG_GAMES,
		SCREEN_PRESETS,
		STASH_FORCES,
		type CasinoTune,
		type StashForce,
		type DealerPreset,
		type F2Force,
		type KushForce,
		type ForceKind,
		type Forced,
		type RigGame
	} from '#lib/casino-rig.ts';
	import { t } from '#lib/i18n/en.ts';
	import { colorOf, handValue, isBlackjack, type Card } from '#lib/squad-casino.ts';
	import { makeMemberId } from '#lib/squad-codec.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import CasinoAdmin from './CasinoAdmin.svelte';
	import CasinoTabArt from './CasinoTabArt.svelte';
	import SlotSymbolView from './SlotSymbol.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	const r = t.rig;
	const sym = t.casino.slots.symbols as Record<SlotSymbol, string>;
	const tune = $derived(squad.tune);
	let busy = $state(false);

	async function save(change: (t: CasinoTune) => CasinoTune, dragKey?: string): Promise<boolean> {
		busy = true;
		const ok = await squad.setTune(change);
		busy = false;
		if (dragKey) {
			const { [dragKey]: _done, ...rest } = drag;
			drag = rest;
		}
		toast.show(ok ? r.saved : r.failed, undefined, ok ? 1600 : 5000);
		return ok;
	}

	/* ---------- odds and luck: a slider shows the drag while it lasts and saves when let go ---------- */
	let drag = $state<Record<string, number>>({});
	const oddsOf = (g: RigGame) => drag[`o:${g}`] ?? tune.odds?.[g] ?? 0;
	const luckOf = (id: string) => drag[`l:${id}`] ?? tune.luck?.[id] ?? 0;
	const effect = (n: number) => {
		const w = luckWords(n);
		return r.effect(n, w.draws, w.chance);
	};
	const oddsChanged = $derived(RIG_GAMES.filter((g) => tune.odds?.[g]).length);
	const luckChanged = $derived(squad.entries.filter((e) => tune.luck?.[e.id]).length);
	const setOdds = (g: RigGame, v: number) => save((x) => ({ ...x, odds: { ...x.odds, [g]: v } }), `o:${g}`);
	const setLuck = (id: string, v: number) => save((x) => ({ ...x, luck: { ...x.luck, [id]: v } }), `l:${id}`);
	const rangeValue = (e: Event) => Number((e.currentTarget as HTMLInputElement).value);

	/* ---------- picked results: who, how long, what; saved with a new id each time ---------- */
	const start = squad.tune;
	const KINDS: ForceKind[] = ['slots', 'fortune2', 'book', 'kushburst', 'stash', 'roulette', 'blackjack'];
	let who = $state(Object.fromEntries(KINDS.map((k) => [k, start[k]?.who ?? '*'])) as Record<ForceKind, string>);
	let every = $state(Object.fromEntries(KINDS.map((k) => [k, !!start[k]?.every])) as Record<ForceKind, boolean>);
	const nameOf = (id: string | undefined) => (id ? (squad.byId(id)?.member.name ?? '?') : '?');
	const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	function stateLine(f: Forced<unknown> | undefined): string {
		if (!f) return r.state.none;
		const whom = f.who === '*' ? (f.every ? r.whoWords.everyone : r.whoWords.anyone) : nameOf(f.who);
		if (f.every) return r.state.every(whom);
		if (f.used) return r.state.used(nameOf(f.by), clock(f.used));
		return r.state.waiting(whom);
	}
	function saveForced(kind: ForceKind, what: unknown) {
		const f = { id: makeMemberId(), who: kind === 'blackjack' ? '*' : who[kind], what, ...(every[kind] ? { every: 1 } : {}) };
		void save((x) => ({ ...x, [kind]: f }));
	}
	const switchOff = (kind: ForceKind) =>
		void save((x) => {
			const { [kind]: _off, ...rest } = x;
			return rest;
		});

	/* ---------- Abscar's Fortune: the screen ---------- */
	let screen = $state<SlotSymbol[][]>(start.slots?.what.map((col) => [...col]) ?? presetScreen('jackpot'));
	let cell = $state<[number, number]>([0, 1]);
	const pickSymbol = (s: SlotSymbol) => (screen[cell[0]][cell[1]] = s);
	const preview = $derived.by(() => {
		const res = evaluate(
			screen.map(() => 0),
			100,
			1,
			{ strips: screen.map((col) => [...col]) }
		);
		const parts: string[] = [];
		if (res.lines.some((l) => l.symbol === 'wild' && l.count === 5)) parts.push(r.slots.jackpot);
		parts.push(res.raw > 0 ? r.slots.pays(res.raw) : r.slots.nothing);
		if (res.freeSpins) parts.push(r.slots.free(res.freeSpins));
		if (res.box) parts.push(r.slots.box);
		if (res.wheel) parts.push(r.slots.wheel);
		if (res.weeds.length) parts.push(r.slots.weeds);
		return parts.join(' · ');
	});

	/* ---------- Fortune II, roulette ---------- */
	let f2 = $state<F2Force>(start.fortune2?.what ?? 'hotbox');
	let bookForce = $state<BookForce>(start.book?.what ?? 'free');
	let kush = $state<KushForce>(start.kushburst?.what ?? 'kushburst');
	let stashPick = $state<StashForce>(start.stash?.what ?? 'free');
	let number = $state<number>(start.roulette?.what ?? 0);
	const colourName = t.casino.roulette.colors;

	/* ---------- blackjack: the dealer's cards ---------- */
	let dealer = $state<number[]>(start.blackjack?.what ? [...start.blackjack.what] : [...DEALER_PRESETS.blackjack]);
	const RANKS = Array.from({ length: 13 }, (_, i) => i + 1);
	const rankName = (n: number) => (n === 1 ? 'A' : n === 11 ? 'J' : n === 12 ? 'Q' : n === 13 ? 'K' : String(n));
	/** What the dealer ends on with these cards (he draws to 17), and whether he runs out of picked cards. */
	const dealerEnd = $derived.by(() => {
		const cards: Card[] = dealer.map((n) => ({ r: n, s: 'S' }));
		const used = cards.slice(0, 2);
		if (used.length < 2) return null;
		for (let k = 2; handValue(used).total < 17 && k < cards.length; k++) used.push(cards[k]);
		const total = handValue(used).total;
		return { text: r.blackjack.total(total, isBlackjack(used)), more: total < 17, unused: cards.length - used.length };
	});

	/* ---------- everything back to normal ---------- */
	let resetAsk = $state(false);
	async function resetAll() {
		resetAsk = false;
		if (await save(() => ({}))) toast.show(r.resetDone);
	}
	const anything = $derived(Object.keys(tune).some((k) => k !== 'at'));
</script>

<div class="rig grid grid-cols-[minmax(0,1fr)] gap-3">
	<div class="rig-stage flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card px-4 py-3">
		<CasinoTabArt kind="admin" size={120} />
		<div class="min-w-0 flex-1">
			<p class="rig-title font-head">{r.heading}</p>
			<p class="text-[13px]">{r.intro}</p>
		</div>
	</div>

	<CasinoAdmin />

	<!-- odds per game -->
	<details class="rig-box" open>
		<summary><span class="rig-h font-head">🎲 {r.odds.heading}</span><span class="rig-sum">{r.changed(oddsChanged)}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.odds.intro}</p>
			<p class="text-xs text-muted">{r.guide}</p>
			<ul class="grid gap-1.5">
				{#each RIG_GAMES as g (g)}
					{@const v = oddsOf(g)}
					<li class="rig-row">
						<label class="rig-slider">
							<span class="rig-name font-head">{r.games[g]}</span>
							<input
								type="range"
								min={-LUCK_MAX}
								max={LUCK_MAX}
								step="10"
								value={v}
								data-game={g}
								disabled={busy}
								aria-valuetext={`${r.value(v)}: ${effect(v)}`}
								oninput={(e) => (drag = { ...drag, [`o:${g}`]: rangeValue(e) })}
								onchange={(e) => void setOdds(g, rangeValue(e))}
							/>
							<b class="rig-val num" data-dir={v > 0 ? 'up' : v < 0 ? 'down' : 'flat'}>{r.value(v)}</b>
						</label>
						<p class="rig-effect">{effect(v)}</p>
					</li>
				{/each}
			</ul>
		</div>
	</details>

	<!-- luck per player -->
	<details class="rig-box" open>
		<summary><span class="rig-h font-head">🍀 {r.luck.heading}</span><span class="rig-sum">{r.changed(luckChanged)}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.luck.intro}</p>
			<ul class="grid gap-1.5">
				{#each squad.entries as e (e.id)}
					{@const v = luckOf(e.id)}
					<li class="rig-row">
						<label class="rig-slider">
							<span class="rig-name flex min-w-0 items-center gap-2 font-head">
								<SquadAvatar name={e.member.name} op={e.member.op} size={30} />
								<span class="truncate">{e.member.name}</span>
							</span>
							<input
								type="range"
								min={-LUCK_MAX}
								max={LUCK_MAX}
								step="10"
								value={v}
								data-member={e.id}
								disabled={busy}
								aria-valuetext={`${r.value(v)}: ${effect(v)}`}
								oninput={(ev) => (drag = { ...drag, [`l:${e.id}`]: rangeValue(ev) })}
								onchange={(ev) => void setLuck(e.id, rangeValue(ev))}
							/>
							<b class="rig-val num" data-dir={v > 0 ? 'up' : v < 0 ? 'down' : 'flat'}>{r.value(v)}</b>
						</label>
						<p class="rig-effect">{effect(v)}</p>
					</li>
				{/each}
			</ul>
			<p class="text-xs text-muted">{r.how}</p>
		</div>
	</details>

	{#snippet whoMode(kind: ForceKind)}
		<div class="flex flex-wrap items-end gap-x-4 gap-y-2">
			{#if kind !== 'blackjack'}
				<label class="grid gap-1">
					<span class="rig-label">{r.who}</span>
					<select class="field rig-select rounded-lg bg-panel-2 px-2 text-[14px] text-fg" data-who={kind} bind:value={who[kind]}>
						<option value="*">{every[kind] ? r.everyone : r.anyone}</option>
						{#each squad.entries as e (e.id)}<option value={e.id}>{e.member.name}</option>{/each}
					</select>
				</label>
			{/if}
			<fieldset class="grid gap-1">
				<legend class="rig-label">{r.mode}</legend>
				<div class="flex flex-wrap gap-1.5">
					<button type="button" class="chip" aria-pressed={!every[kind]} onclick={() => (every[kind] = false)}>{kind === 'blackjack' ? r.blackjack.onceLabel : r.once}</button>
					<button type="button" class="chip" aria-pressed={every[kind]} onclick={() => (every[kind] = true)}>{kind === 'blackjack' ? r.blackjack.everyLabel : r.every}</button>
				</div>
			</fieldset>
		</div>
	{/snippet}

	{#snippet saveRow(kind: ForceKind, what: unknown)}
		{@const f = tune[kind]}
		<div class="rig-state flex flex-wrap items-center gap-2" data-state={!f ? 'off' : f.every ? 'every' : f.used ? 'used' : 'waiting'}>
			<p class="min-w-0 flex-1 text-[13px]" aria-live="polite">{stateLine(f)}</p>
			<button type="button" class="btn btn-sm btn-primary" data-save={kind} disabled={busy} onclick={() => saveForced(kind, what)}>{r.save}</button>
			{#if f}<button type="button" class="btn btn-sm" data-off={kind} disabled={busy} onclick={() => switchOff(kind)}>{f.used ? r.clear : r.off}</button>{/if}
		</div>
	{/snippet}

	<!-- Abscar's Fortune: the whole screen -->
	<details class="rig-box" data-rig="slots">
		<summary><span class="rig-h font-head">🍔 {r.slots.heading}</span><span class="rig-sum">{tune.slots ? (tune.slots.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.slots.intro}</p>
			<div class="grid grid-cols-[minmax(0,1fr)] gap-1">
				<span class="rig-label">{r.slots.quick}</span>
				<div class="flex flex-wrap gap-1.5">
					{#each SCREEN_PRESETS as p (p)}<button type="button" class="chip" data-preset={p} onclick={() => (screen = presetScreen(p))}
							>{p === 'free3' || p === 'free5' ? r.slots.presetSpins(r.slots.presets[p], FREE_SPINS[p === 'free3' ? 0 : 2]) : r.slots.presets[p]}</button
						>{/each}
				</div>
			</div>
			<div class="rig-reels" role="group" aria-label={r.slots.heading}>
				{#each screen as col, reel (reel)}
					{#each col as s, row (row)}
						<button
							type="button"
							class="rig-cell"
							style:grid-column={reel + 1}
							style:grid-row={row + 1}
							data-cell="{reel}-{row}"
							aria-pressed={cell[0] === reel && cell[1] === row}
							aria-label={r.slots.cell(reel + 1, row + 1, sym[s])}
							onclick={() => (cell = [reel, row])}><SlotSymbolView symbol={s} size={40} value={s === 'weed' ? 2 : undefined} /></button
						>
					{/each}
				{/each}
			</div>
			<div class="grid grid-cols-[minmax(0,1fr)] gap-1">
				<span class="rig-label">{r.slots.palette}</span>
				<div class="rig-palette">
					{#each SYMBOLS as s (s)}
						<button type="button" class="rig-sym" data-symbol={s} aria-pressed={screen[cell[0]][cell[1]] === s} title={sym[s]} aria-label={sym[s]} onclick={() => pickSymbol(s)}
							><SlotSymbolView symbol={s} size={34} /></button
						>
					{/each}
				</div>
			</div>
			<p class="rig-preview text-[13px]" data-preview>{preview}</p>
			{@render whoMode('slots')}
			{@render saveRow('slots', screen.map((c) => [...c]))}
		</div>
	</details>

	<!-- Fortune II: a feature -->
	<details class="rig-box" data-rig="fortune2">
		<summary><span class="rig-h font-head">💜 {r.fortune2.heading}</span><span class="rig-sum">{tune.fortune2 ? (tune.fortune2.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.fortune2.intro}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each F2_FORCES as k (k)}<button type="button" class="chip" data-f2={k} aria-pressed={f2 === k} onclick={() => (f2 = k)}>{r.fortune2.kinds[k]}</button>{/each}
			</div>
			{@render whoMode('fortune2')}
			{@render saveRow('fortune2', f2)}
		</div>
	</details>

	<!-- Book Of Skedd: free spins (with Abscar expanding), a big win or nothing -->
	<details class="rig-box" data-rig="book">
		<summary><span class="rig-h font-head">📖 {r.book.heading}</span><span class="rig-sum">{tune.book ? (tune.book.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.book.intro}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each BOOK_FORCES as k (k)}<button type="button" class="chip" data-book={k} aria-pressed={bookForce === k} onclick={() => (bookForce = k)}>{r.book.kinds[k]}</button>{/each}
			</div>
			{@render whoMode('book')}
			{@render saveRow('book', bookForce)}
		</div>
	</details>

	<!-- Kushburst: a leaf, a KUSHBURST, a big win or nothing -->
	<details class="rig-box" data-rig="kushburst">
		<summary><span class="rig-h font-head">🍃 {r.kushburst.heading}</span><span class="rig-sum">{tune.kushburst ? (tune.kushburst.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.kushburst.intro}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each KUSH_FORCES as k (k)}<button type="button" class="chip" data-kush={k} aria-pressed={kush === k} onclick={() => (kush = k)}>{r.kushburst.kinds[k]}</button>{/each}
			</div>
			{@render whoMode('kushburst')}
			{@render saveRow('kushburst', kush)}
		</div>
	</details>

	<!-- Abscar's Stash: what the next spin has -->
	<details class="rig-box" data-rig="stash">
		<summary><span class="rig-h font-head">💨 {r.stash.heading}</span><span class="rig-sum">{tune.stash ? (tune.stash.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.stash.intro}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each STASH_FORCES as k (k)}<button type="button" class="chip" data-stash={k} aria-pressed={stashPick === k} onclick={() => (stashPick = k)}>{r.stash.kinds[k]}</button>{/each}
			</div>
			{@render whoMode('stash')}
			{@render saveRow('stash', stashPick)}
		</div>
	</details>

	<!-- roulette: the number -->
	<details class="rig-box" data-rig="roulette">
		<summary><span class="rig-h font-head">🎡 {r.roulette.heading}</span><span class="rig-sum">{tune.roulette ? (tune.roulette.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.roulette.intro}</p>
			<div class="rig-numbers">
				{#each Array.from({ length: 37 }, (_, i) => i) as n (n)}
					<button type="button" class="rig-num num" data-color={colorOf(n)} data-n={n} aria-pressed={number === n} aria-label={r.roulette.number(n, colourName[colorOf(n)])} onclick={() => (number = n)}>{n}</button>
				{/each}
			</div>
			{@render whoMode('roulette')}
			{@render saveRow('roulette', number)}
		</div>
	</details>

	<!-- blackjack: the dealer's cards -->
	<details class="rig-box" data-rig="blackjack">
		<summary><span class="rig-h font-head">🃏 {r.blackjack.heading}</span><span class="rig-sum">{tune.blackjack ? (tune.blackjack.used ? '✔' : '●') : ''}</span></summary>
		<div class="rig-body">
			<p class="text-xs text-muted">{r.blackjack.intro}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each Object.keys(DEALER_PRESETS) as p (p)}<button type="button" class="chip" data-dealer={p} onclick={() => (dealer = [...DEALER_PRESETS[p as DealerPreset]])}>{r.blackjack.presets[p as DealerPreset]}</button>{/each}
			</div>
			<div class="grid grid-cols-[minmax(0,1fr)] gap-1">
				<span class="rig-label">{r.blackjack.cards}</span>
				<div class="flex min-h-[3.25rem] flex-wrap items-center gap-1.5" data-dealer-cards>
					{#each dealer as n, i (i)}<span class="rig-card num" data-red={i % 2 === 1 || undefined}>{rankName(n)}</span>{:else}<span class="text-[13px] text-muted">{r.blackjack.empty}</span>{/each}
					{#if dealer.length}<button type="button" class="btn btn-sm" aria-label={r.blackjack.removeLast} onclick={() => (dealer = dealer.slice(0, -1))}>⌫</button>{/if}
				</div>
				{#if dealerEnd}
					<p class="text-[13px] font-semibold" data-dealer-end>
						= {dealerEnd.text}{dealerEnd.more ? ` · ${r.blackjack.thenRandom}` : ''}{dealerEnd.unused > 0 ? ` · ${r.blackjack.unused(dealerEnd.unused)}` : ''}
					</p>
				{/if}
			</div>
			<div class="grid grid-cols-[minmax(0,1fr)] gap-1">
				<span class="rig-label">{r.blackjack.add}</span>
				<div class="rig-ranks">
					{#each RANKS as n (n)}<button type="button" class="rig-rank num" data-rank={n} disabled={dealer.length >= DEALER_MAX} onclick={() => (dealer = [...dealer, n])}>{rankName(n)}</button>{/each}
				</div>
			</div>
			{@render whoMode('blackjack')}
			{#if dealer.length >= 2}{@render saveRow('blackjack', [...dealer])}{/if}
		</div>
	</details>

	<!-- everything back to normal -->
	{#if anything}
		<div class="flex flex-wrap items-center gap-2">
			{#if !resetAsk}
				<button type="button" class="btn btn-sm" data-reset onclick={() => (resetAsk = true)}>↺ {r.resetAll}</button>
			{:else}
				<p class="text-[13px] font-semibold">{r.resetAsk}</p>
				<button type="button" class="btn btn-sm btn-danger" data-reset-yes disabled={busy} onclick={() => void resetAll()}>{r.resetYes}</button>
				<button type="button" class="btn btn-sm" onclick={() => (resetAsk = false)}>{r.cancel}</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.rig-stage {
		background:
			radial-gradient(70% 120% at 12% 50%, rgb(255 60 60 / 0.22), transparent 60%),
			linear-gradient(180deg, rgb(40 20 30 / 0.75), rgb(14 8 14 / 0.65));
		box-shadow: inset 0 0 0 1.5px rgb(255 90 90 / 0.6);
		color: #f6e8e0;
	}
	.rig-title {
		text-shadow: none !important;
		font-size: 24px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff2ea, #ff8a7a 55%, #ff3b3b);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7));
	}
	.rig-box {
		border: 1px solid rgb(255 90 90 / 0.45);
		border-radius: 10px;
		background: rgb(0 0 0 / 0.16);
	}
	.rig-box > summary {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 10px;
		min-height: 44px;
		padding: 8px 12px;
		cursor: pointer;
		list-style: none;
	}
	.rig-box > summary::-webkit-details-marker {
		display: none;
	}
	.rig-box > summary::before {
		content: '▸';
		color: #ff6a5a;
		transition: transform 0.15s ease;
	}
	.rig-box[open] > summary::before {
		transform: rotate(90deg);
	}
	.rig-h {
		flex: 1;
		min-width: 0;
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.rig-sum {
		font-size: 12px;
		color: var(--t-muted);
	}
	.rig-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 10px;
		padding: 0 12px 12px;
	}
	.rig-label {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--t-muted);
	}
	.rig-row {
		display: grid;
		gap: 2px;
		padding: 6px 10px;
		border: 1px solid var(--t-line);
		border-radius: 8px;
		background: var(--t-panel-2);
	}
	.rig-slider {
		display: grid;
		grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) 3rem;
		align-items: center;
		gap: 10px;
		min-height: 44px;
	}
	.rig-name {
		font-size: 14px;
		font-weight: 700;
	}
	.rig-slider input[type='range'] {
		width: 100%;
		height: 44px;
		accent-color: #ff5a4a;
		cursor: pointer;
	}
	.rig-val {
		justify-self: end;
		font-size: 15px;
		font-weight: 900;
	}
	.rig-val[data-dir='up'] {
		color: var(--t-buff, #3ee06a);
	}
	.rig-val[data-dir='down'] {
		color: var(--t-nerf, #ff5a5a);
	}
	.rig-effect {
		font-size: 12px;
		color: var(--t-muted);
	}
	/* phones: the name on its own line, slider + number under it */
	@media (max-width: 520px) {
		.rig-slider {
			grid-template-columns: minmax(0, 1fr) 3rem;
			gap: 0 10px;
		}
		.rig-name {
			grid-column: 1 / -1;
		}
	}
	.rig-select {
		min-width: 12rem;
		max-width: 100%;
	}
	/* the screen editor: 5 × 3 squares like the machine's window */
	.rig-reels {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 56px));
		grid-template-rows: repeat(3, auto);
		gap: 5px;
		width: min(100%, 330px);
		padding: 8px;
		border-radius: 10px;
		background: #120302;
		box-shadow: inset 0 0 0 2px #e0a400;
	}
	.rig-cell {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		min-height: 44px;
		border-radius: 8px;
		background: #fffaf0;
		border: 2px solid transparent;
	}
	.rig-cell[aria-pressed='true'] {
		border-color: #ff3b3b;
		box-shadow: 0 0 0 2px #ffd23a;
	}
	.rig-cell :global(svg) {
		width: 80%;
		height: auto;
	}
	.rig-palette {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.rig-sym {
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border-radius: 8px;
		background: #fffaf0;
		border: 2px solid rgb(0 0 0 / 0.25);
	}
	.rig-sym[aria-pressed='true'] {
		border-color: #ff3b3b;
		box-shadow: 0 0 0 2px #ffd23a;
	}
	.rig-preview {
		font-weight: 600;
	}
	.rig-state {
		padding: 6px 10px;
		border-radius: 8px;
		border: 1px dashed var(--t-line);
	}
	.rig-state[data-state='waiting'],
	.rig-state[data-state='every'] {
		border: 1px solid #ff6a5a;
		background: rgb(255 90 90 / 0.08);
	}
	/* roulette numbers: 0 on its own, then 36 in rows */
	.rig-numbers {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
		gap: 4px;
		max-width: 640px;
	}
	.rig-num {
		min-height: 44px;
		border-radius: 8px;
		font-weight: 800;
		color: #fff;
		border: 2px solid transparent;
	}
	.rig-num[data-color='red'] {
		background: #c8141c;
	}
	.rig-num[data-color='black'] {
		background: #1a1a1a;
	}
	.rig-num[data-color='green'] {
		background: #1f8a3a;
	}
	.rig-num[aria-pressed='true'] {
		border-color: #ffd23a;
		box-shadow: 0 0 0 2px #ffd23a;
	}
	/* blackjack: the picked cards and the rank buttons */
	.rig-card {
		display: inline-grid;
		place-items: center;
		width: 34px;
		height: 46px;
		border-radius: 5px;
		background: #fffaf0;
		color: #141414;
		font-weight: 900;
		font-size: 16px;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.3), 0 1px 2px rgb(0 0 0 / 0.4);
	}
	.rig-card[data-red] {
		color: #c8141c;
	}
	.rig-ranks {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
		gap: 4px;
		max-width: 640px;
	}
	.rig-rank {
		min-height: 44px;
		border-radius: 8px;
		background: #fffaf0;
		color: #141414;
		font-weight: 900;
		border: 1px solid rgb(0 0 0 / 0.3);
	}
	.rig-rank:disabled {
		opacity: 0.4;
	}
	@media (prefers-reduced-motion: reduce) {
		.rig-box > summary::before {
			transition: none;
		}
	}
</style>
