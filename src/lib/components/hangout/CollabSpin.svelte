<!--
	Collab spins (hangout.ts): chip in together on one big spin of Abscar's Fortune. Someone starts one with a
	stake, the others in the casino chip in until the timer runs out, then everyone in it sees the same spin
	(the whole pot as the bet) in a big overlay, and gets their share of the win by stake.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { collabPhase, collabPot, collabReveal, collabShares, COLLAB_SEATS, COLLAB_STAKES } from '#lib/hangout.ts';
	import { STRIPS } from '#lib/casino-slots.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import SlotSymbol from '../SlotSymbol.svelte';
	import SquadAvatar from '../SquadAvatar.svelte';

	const c = t.hang.collab;
	const fmt = (n: number) => n.toLocaleString('en-US');
	const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : '±0');
	const meId = $derived(squad.me?.id ?? null);
	const balance = $derived(Math.max(0, (squad.myBank?.balance ?? 0) - hangout.held));
	const open = $derived(hangout.collabs.filter((x) => collabPhase(x, hangout.now) === 'open'));
	const mineOpen = $derived(open.find((x) => x.seats.some((s) => s.id === meId)) ?? null);
	let stake = $state(1000);
	let busy = $state(false);

	async function start() {
		if (balance < stake) return toast.show(c.broke);
		busy = true;
		const ok = await hangout.openCollab(stake);
		busy = false;
		if (!ok) toast.show(c.busy);
	}
	async function join(id: string) {
		if (balance < stake) return toast.show(c.broke);
		busy = true;
		const ok = await hangout.joinCollab(id, stake);
		busy = false;
		if (!ok) toast.show(c.full);
	}

	// ----- the overlay for a collab spin you're in -----
	let closed = $state<string[]>([]);
	const live = $derived.by(() => {
		const x = hangout.liveCollab();
		return x && !closed.includes(x.id) ? x : null;
	});
	const phase = $derived(live ? collabPhase(live, hangout.now) : 'open');
	const result = $derived(live ? hangout.playOf(live) : null);
	const shares = $derived(live && result ? collabShares(live, result.win) : {});
	/** Each reel stops a little after the one before. */
	const stopped = (r: number) => !!live && hangout.now >= live.until + 1400 + r * 700;
	/** to <body>: the tab panel is a stacking context of its own, so the overlay would sit under the header */
	function toBody(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}
	const filler = (r: number) => Array.from({ length: 9 }, (_, i) => STRIPS[r][(i * 7 + r * 3) % STRIPS[r].length]);
</script>

<div class="collab">
	<div class="collab-head">
		<p class="font-head collab-title">🤝 {c.heading}</p>
		<p class="collab-intro">{c.intro}</p>
	</div>

	<div class="collab-stakes" role="group" aria-label={c.stake}>
		{#each COLLAB_STAKES as n (n)}
			<button type="button" class="chip" aria-pressed={stake === n} onclick={() => (stake = n)}>{fmt(n)}</button>
		{/each}
	</div>

	{#each open as x (x.id)}
		{@const mine = x.seats.find((s) => s.id === meId)}
		<div class="collab-card" data-collab={x.id}>
			<div class="collab-seats">
				{#each x.seats as s (s.id)}<span class="collab-seat" title={`${s.name}: ${fmt(s.stake)} 🍔`}><SquadAvatar name={s.name} op={s.op} size={30} /></span>{/each}
			</div>
			<div class="min-w-0">
				<p class="font-head text-[14px] font-bold">{c.pot(fmt(collabPot(x)))} · {c.seats(x.seats.length, COLLAB_SEATS)}</p>
				<p class="text-[12px] text-muted num">{c.closes(Math.max(0, Math.ceil((x.until - hangout.now) / 1000)))}</p>
			</div>
			{#if mine}
				<span class="collab-in font-head">{c.in(fmt(mine.stake))}</span>
			{:else if !mineOpen && x.seats.length < COLLAB_SEATS}
				<button type="button" class="btn btn-primary btn-sm collab-join" disabled={busy} onclick={() => join(x.id)}>{c.join(fmt(stake))}</button>
			{/if}
		</div>
	{/each}

	{#if !mineOpen}
		<button type="button" class="btn btn-primary collab-start" disabled={busy} onclick={start}>{c.start(fmt(stake))}</button>
	{/if}
</div>

{#if live && result}
	<div class="collab-ov" use:toBody role="dialog" aria-modal="false" aria-label={c.title}>
		<div class="collab-box">
			<p class="collab-ov-title font-head">{c.title} · {c.pot(fmt(collabPot(live)))}</p>
			<div class="collab-reels" aria-hidden={phase !== 'done'}>
				{#each result.base?.grid ?? [] as reel, r (r)}
					<div class="collab-reel" class:spin={!stopped(r)}>
						{#if stopped(r)}
							{#each reel as sym, row (row)}<span class="cell"><SlotSymbol symbol={sym} size={46} /></span>{/each}
						{:else}
							<div class="strip">{#each filler(r) as sym, i (i)}<span class="cell"><SlotSymbol symbol={sym} size={46} /></span>{/each}</div>
						{/if}
					</div>
				{/each}
			</div>
			{#if phase === 'done' || hangout.now >= collabReveal(live)}
				<p class="collab-win font-head" class:big={result.win > 0} role="status">{c.result(fmt(result.win))}</p>
				<ul class="collab-shares">
					{#each live.seats as s (s.id)}
						<li class:me={s.id === meId}><SquadAvatar name={s.name} op={s.op} size={24} /> {c.share(s.name, fmt(shares[s.id] ?? 0), signed((shares[s.id] ?? 0) - s.stake))}</li>
					{/each}
				</ul>
				<button type="button" class="btn btn-sm" onclick={() => (closed = [...closed, live.id])}>{c.close}</button>
			{:else}
				<p class="collab-win font-head">{c.spinning}</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.collab {
		display: grid;
		gap: 8px;
		padding-top: 8px;
		border-top: 1px dashed rgb(255 201 40 / 0.3);
	}
	.collab-title {
		font-size: 13px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #7dffcf;
	}
	.collab-intro {
		font-size: 12px;
		color: var(--t-muted);
	}
	.collab-stakes {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.collab-stakes .chip {
		min-height: 36px;
	}
	.collab-card {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1.5px solid #3fe0a8;
		background: linear-gradient(90deg, rgb(20 90 70 / 0.5), rgb(0 0 0 / 0.25));
		box-shadow: 0 0 14px rgb(60 230 170 / 0.25);
	}
	.collab-seats {
		display: flex;
	}
	.collab-seat + .collab-seat {
		margin-left: -8px;
	}
	.collab-in {
		font-size: 12px;
		font-weight: 800;
		color: #7dffcf;
	}
	.collab-start,
	.collab-join {
		min-height: 44px;
		justify-self: start;
	}
	.collab-ov {
		position: fixed;
		inset: 0;
		z-index: 70;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgb(10 0 12 / 0.72);
	}
	.collab-box {
		display: grid;
		justify-items: center;
		gap: 10px;
		width: min(440px, 100%);
		padding: 16px;
		border-radius: 16px;
		border: 2px solid #3fe0a8;
		background: linear-gradient(180deg, #2b0c2a, #12040f);
		box-shadow: 0 0 40px rgb(60 230 170 / 0.4);
		color: #fff3dc;
	}
	.collab-ov-title {
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.12em;
		color: #7dffcf;
	}
	.collab-reels {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 4px;
		width: 100%;
		padding: 6px;
		border-radius: 10px;
		background: #fff8e8;
	}
	.collab-reel {
		display: grid;
		gap: 2px;
		height: 156px;
		overflow: hidden;
		border-radius: 6px;
		background: #fff;
	}
	.collab-reel .cell {
		display: grid;
		place-items: center;
		height: 50px;
	}
	.collab-reel.spin .strip {
		animation: reel 0.45s linear infinite;
	}
	@keyframes reel {
		from {
			transform: translateY(-50%);
		}
		to {
			transform: translateY(0);
		}
	}
	.collab-win {
		font-size: 18px;
		font-weight: 900;
		text-align: center;
	}
	.collab-win.big {
		color: #ffd23a;
		text-shadow: 0 0 14px rgb(255 200 40 / 0.7);
	}
	.collab-shares {
		display: grid;
		gap: 4px;
		width: 100%;
		font-size: 13px;
	}
	.collab-shares li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.collab-shares li.me {
		font-weight: 800;
		color: #7dffcf;
	}
	@media (prefers-reduced-motion: reduce) {
		.collab-reel.spin .strip {
			animation: none;
		}
	}
</style>
