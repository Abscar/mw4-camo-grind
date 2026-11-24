<!--
	A case battle playing out (cases.ts Battle), driven by a clock: round r spins from start + r × roundMs, so
	every page watching the same lobby (cb-lobby.ts) shows the same round at the same time, and someone who opens
	it late lands in the middle. A seat column per player: who, running total, a top-to-bottom reel for the round's
	case, and what they've pulled so far. Bots battles use the page's own clock (start = now).
-->
<script module lang="ts">
	import type { SquadOp } from '#lib/squad-codec.ts';
	export interface ArenaSeat {
	name: string;
	op?: SquadOp;
	you: boolean;
	bot: boolean;
}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { CASE_BY_ID, GRADES, teamOf, type Battle } from '#lib/cases.ts';
	import SquadAvatar from '../SquadAvatar.svelte';
	import CaseBox from './CaseBox.svelte';
	import CaseItemArt from './CaseItemArt.svelte';
	import CaseReel from './CaseReel.svelte';

	let {
		battle: b,
		seats,
		start,
		now,
		roundMs,
		spinMs,
		key,
		skipped = false,
		onend,
		end
	}: {
		battle: Battle;
		seats: ArenaSeat[];
		start: number;
		now: number;
		roundMs: number;
		spinMs: number;
		key: string;
		skipped?: boolean;
		onend?: () => void;
		end?: Snippet<[boolean]>;
	} = $props();
	const k = t.casino.cases;
	const fmt = (n: number) => n.toLocaleString('en-US');
	const short = (n: number) => {
		const f = (x: number, u: string) => `${Number((n / x).toFixed(n / x < 10 ? 1 : 0))}${u}`;
		return n >= 1e9 ? f(1e9, 'B') : n >= 1e6 ? f(1e6, 'M') : n >= 1e4 ? f(1e3, 'k') : fmt(n);
	};

	const n = $derived(b.cases.length);
	const elapsed = $derived(now - start);
	const ended = $derived(skipped || elapsed >= n * roundMs);
	const waiting = $derived(!ended && elapsed < 0);
	const round = $derived(ended ? n - 1 : Math.max(0, Math.min(n - 1, Math.floor(elapsed / roundMs))));
	const into = $derived(elapsed - round * roundMs);
	const landed = $derived(ended || (!waiting && into >= spinMs));
	/** Rounds whose pulls show (and count in the totals). */
	const shown = $derived(ended ? n : waiting ? 0 : round + (landed ? 1 : 0));
	const totals = $derived(b.values.map((row) => row.slice(0, shown).reduce((a, v) => a + v, 0)));
	const reelMs = $derived(Math.max(0, spinMs - into));

	// a clack when a round lands; the end once
	let lastShown = -1;
	$effect(() => {
		if (shown > lastShown && lastShown >= 0 && !skipped) sound.play('clack');
		lastShown = shown;
	});
	let told = false;
	$effect(() => {
		if (ended && !told) {
			told = true;
			onend?.();
		}
	});
</script>

<div class="grid gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">
			{k.modes[b.mode]} · {k.sizes[b.size]} · {waiting ? k.startsIn(Math.ceil(-elapsed / 1000)) : k.round(round + 1, n)}
		</p>
		<p class="num font-head text-[13px] font-bold">{k.pot(fmt(totals.reduce((a, v) => a + v, 0)))}</p>
	</div>
	<ol class="cc-track" aria-hidden="true">
		{#each b.cases as id, i (i)}<li class:now={i === round && !ended && !waiting} class:past={i < shown}><CaseBox {id} size={40} /></li>{/each}
	</ol>
	{#if waiting}<p class="cc-count font-head" aria-live="polite">{Math.ceil(-elapsed / 1000)}</p>{/if}
	<div class="cc-seats" style:--n={b.pulls.length}>
		{#each seats as seat, s (s)}
			{@const win = ended && b.winners.includes(s)}
			<div class="cc-seat" class:win class:you={seat.you} class:gap={b.size === '2v2' && s === 2}>
				<div class="cc-who">
					<SquadAvatar name={seat.name} op={seat.op} size={34} />
					<span class="grid min-w-0">
						<span class="truncate text-[12px] font-bold">{seat.you ? k.you : seat.name}</span>
						<span class="truncate text-[10px] text-muted">{seat.bot ? k.bot : ''}{b.size === '2v2' ? `${seat.bot ? ' · ' : ''}${k.team(teamOf(b.size, s) + 1)}` : ''}</span>
					</span>
				</div>
				<p class="cc-total num font-head">{fmt(totals[s] ?? 0)}</p>
				{#if ended}
					<p class="cc-result font-head" class:good={win}>{win ? `${k.winner} · ${fmt(b.payout[s])}` : '—'}</p>
				{:else if waiting}
					<div class="cc-wait" aria-hidden="true"><CaseBox id={b.cases[0]} size={80} /></div>
				{:else}
					{#key `${key}-${round}`}
						<CaseReel caseId={b.cases[round]} pick={b.pulls[s][round]} dir="y" ms={reelMs} seed={(key.length * 977 + round * 13 + s) ^ start} />
					{/key}
				{/if}
				<ul class="cc-pulls">
					{#each b.pulls[s].slice(0, shown) as pick, r (r)}
						{@const it = CASE_BY_ID.get(b.cases[r])!.items[pick]}
						<li style:--g={GRADES[it.grade].colour} title="{it.name} · {fmt(it.value)} 🍔"><CaseItemArt ref={it.ref} grade={it.grade} glow={false} /><span class="num">{short(it.value)}</span></li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
	{@render end?.(ended)}
</div>

<style>
	.cc-track {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.cc-track li {
		opacity: 0.45;
		padding: 2px;
		border-radius: 8px;
	}
	.cc-track li.past {
		opacity: 0.25;
	}
	.cc-track li.now {
		opacity: 1;
		outline: 2px solid #ffd23a;
		background: rgb(255 210 58 / 0.12);
	}
	.cc-count {
		justify-self: center;
		font-size: 44px;
		font-weight: 900;
		color: #ffd23a;
		text-shadow: 0 0 18px rgb(255 160 40 / 0.8);
	}
	.cc-wait {
		display: grid;
		place-items: center;
		height: 216px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.3);
	}
	.cc-seats {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		gap: 6px;
	}
	.cc-seat {
		display: grid;
		align-content: start;
		gap: 6px;
		min-width: 0;
		padding: 6px;
		border-radius: 12px;
		background: rgb(0 0 0 / 0.3);
		border: 1.5px solid rgb(255 255 255 / 0.1);
	}
	.cc-seat.gap {
		margin-left: 8px;
	}
	/* few seats on a wide screen: keep the reel a sensible size */
	.cc-seat :global(.cr),
	.cc-wait {
		width: 100%;
		max-width: 240px;
		justify-self: center;
	}
	.cc-seat.you {
		border-color: rgb(255 210 58 / 0.5);
	}
	.cc-seat.win {
		border-color: #43d35e;
		box-shadow: 0 0 18px rgb(67 211 94 / 0.45);
		background: rgb(67 211 94 / 0.1);
	}
	.cc-who {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		flex-wrap: wrap;
	}
	.cc-total {
		font-size: 18px;
		font-weight: 900;
		color: #ffd23a;
	}
	.cc-result {
		min-height: 40px;
		display: grid;
		place-items: center;
		font-size: 13px;
		font-weight: 800;
		color: var(--t-muted);
	}
	.cc-result.good {
		color: #7dff6a;
	}
	.cc-pulls {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
		gap: 3px;
	}
	.cc-pulls li {
		display: grid;
		justify-items: center;
		height: 44px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--g) 16%, transparent);
		border-bottom: 2px solid var(--g);
		font-size: 10px;
		overflow: hidden;
	}
	.cc-pulls li :global(.ci) {
		height: 28px;
	}
	@media (max-width: 520px) {
		.cc-seats {
			gap: 4px;
		}
		.cc-seat {
			padding: 4px;
		}
		.cc-total {
			font-size: 14px;
		}
		.cc-seat.gap {
			margin-left: 4px;
		}
	}
</style>
