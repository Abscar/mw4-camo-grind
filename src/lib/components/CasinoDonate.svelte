<!--
	BurgiGives, BurgiCasino's Donations tab (donations.ts; 2026-11-20, the user's ask: "add a 'donations'
	page where you can donate burgers; come up with 5 different organisations just for fun, a tab of its own
	next to BurgiBank with its own logo, draw fun pictures for all the orgs, make it look good", then "a list
	of who donated to which"). The holy-burger logo, five joke causes (DonateArt.svelte) with what they've
	raised, a goal bar and their top donor, a Donate box per cause, a thank-you sticker after a gift, then
	"Who gave to what" (every member, the causes they gave to and how much) and the latest gifts.
	Six more causes came on 2026-11-21 (eleven in all), and donated burgers now become hearts in Abscar's karma
	bank (DonateKarma.svelte, shown only to the house), which Abscar sends back to the gang as burgers. The
	squad card lists the five biggest causes. Pretend burgers, never money.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { donationTotal, goalOf, parseAmount, squadGiving, DON_AMOUNTS, ORGS, ORG_BY_ID, type OrgId } from '#lib/donations.ts';
	import { houseOf } from '#lib/squad-fun.ts';
	import DonateArt from './DonateArt.svelte';
	import DonateKarma from './DonateKarma.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	let { balance }: { balance: number } = $props();
	const d = t.donate;
	const fmt = (n: number) => n.toLocaleString('en-US');
	/** Short numbers for the squad card's bars: 9,500 · 250k · 1.2M. */
	const short = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(n >= 1e8 ? 0 : 1)}M` : n >= 1e5 ? `${Math.floor(n / 1e3)}k` : fmt(n));

	const members = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])));
	const giving = $derived(squadGiving(members));
	const mine = $derived(donationTotal(squad.donations));
	/** Only the house (Abscar) sees the karma bank. */
	const isHouse = $derived(!!squad.me && houseOf(members) === squad.me.id);
	/** The summary card: the five biggest causes (bars relative to the biggest), the favourite, all goals reached. */
	const SUM_TOP = 5;
	const topOrgs = $derived([...ORGS].sort((a, b) => giving.byOrg[b.id].total - giving.byOrg[a.id].total).slice(0, SUM_TOP));
	const maxOrg = $derived(Math.max(0, ...ORGS.map((o) => giving.byOrg[o.id].total)));
	const favourite = $derived(maxOrg ? (ORGS.find((o) => giving.byOrg[o.id].total === maxOrg)?.id ?? null) : null);
	const goalsAll = $derived(ORGS.reduce((n, o) => n + goalOf(giving.byOrg[o.id].total).reached, 0));
	const nameOf = (id: string) => (id === squad.me?.id ? d.you : (members[id]?.name ?? '?'));

	/** The cause whose Donate box is open, the typed amount, what went wrong. */
	let open = $state<OrgId | null>(null);
	let text = $state('');
	let error = $state('');
	/** The thank-you sticker after a gift (on that cause's card for a few seconds). */
	let thanked = $state<{ org: OrgId; key: number } | null>(null);
	let thankTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(thankTimer));

	const amount = $derived(parseAmount(text));

	function openBox(org: OrgId) {
		open = org;
		error = '';
		if (!text) text = String(Math.min(balance, DON_AMOUNTS[1]) || '');
	}
	function pickAmount(n: number) {
		text = String(n);
		error = '';
	}

	function give(org: OrgId) {
		const n = amount;
		if (!n) return void (error = d.bad);
		if (n > balance) return void (error = d.broke(balance));
		const r = squad.donate(org, n);
		if (r.result !== 'ok') {
			error = r.result === 'broke' ? d.broke(balance) : r.result === 'off' ? d.off : d.bad;
			return;
		}
		const name = d.orgs[org].name;
		const goal = r.goal;
		toast.show(d.given(n, name), undefined, 5000);
		if (goal !== null) setTimeout(() => toast.show(d.goalToast(name, goal), undefined, 6000), 1200);
		error = '';
		text = '';
		open = null;
		clearTimeout(thankTimer);
		thanked = { org, key: Date.now() };
		thankTimer = setTimeout(() => (thanked = null), 6000);
	}

	const now = $derived(Math.max(squad.now, Date.now()));
	const ago = (at: number) => d.ago(Math.max(0, Math.floor((now - at) / 60_000)));
</script>

<div class="dn grid gap-3">
	<!-- the head: the holy-burger logo, BurgiGives, your burgers and what you gave -->
	<div class="dn-stage flex flex-wrap items-center gap-x-5 gap-y-2 rounded-card px-4 py-3">
		<DonateArt kind="logo" size={104} animate />
		<div class="min-w-0 flex-1 basis-[14rem]">
			<p class="dn-title font-head">{d.heading}</p>
			<p class="text-[13px] text-fg">{d.line(ORGS.length)}</p>
			<p class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-head text-[15px] font-bold">
				<span>{d.yourBurgers(balance)}</span>
				{#if mine}<span class="dn-gave">{d.youGave(mine)} 💛</span>{/if}
			</p>
			<p class="mt-0.5 text-[11px] text-muted">{d.gone}</p>
		</div>
	</div>
	{#if isHouse}<DonateKarma donated={giving.total} />{/if}
	<!-- the causes, after a card with the whole squad's giving (so 3 + 3 / 2 + 2 + 2 side by side) -->
	<section aria-labelledby="dn-causes-h">
		<h3 id="dn-causes-h" class="sr-only">{d.causes}</h3>
		<ul class="dn-orgs">
			<li class="dn-card dn-sum" style:--tile="#5e4a10" style:--deep="#1c1404" style:--acc="#ffd23a">
				<p class="dn-eyebrow font-head">{d.sumHeading}</p>
				<p class="dn-sum-n num font-head" aria-hidden="true">{fmt(giving.total)} 🍔</p>
				<p class="dn-squad font-head" aria-live="polite">{#if giving.total}<span class="sr-only">{`${fmt(giving.total)} 🍔 `}</span>{/if}{d.sumLine(giving.total, giving.donors.length)}</p>
				<ul class="grid gap-1.5" aria-label={d.sumTop}>
					{#each topOrgs as o (o.id)}
						{@const n = giving.byOrg[o.id].total}
						<li class="dn-sum-row" style:--acc={o.accent}>
							<DonateArt kind={o.id} size={22} />
							<span class="min-w-0 truncate text-[12px]">{d.orgs[o.id].short}</span>
							<span class="dn-sum-bar" aria-hidden="true"><span style:width="{maxOrg ? ((n / maxOrg) * 100).toFixed(1) : 0}%"></span></span>
							<b class="num text-[12px]" title={fmt(n)}>{short(n)}</b>
						</li>
					{/each}
				</ul>
				<p class="dn-meta">{d.sumMore(ORGS.length - topOrgs.length)}</p>
				{#if favourite}<p class="dn-meta">{d.favourite(d.orgs[favourite].name)}{goalsAll ? ` · ${d.goalsReached(goalsAll)}` : ''}</p>{/if}
			</li>
			{#each ORGS as o (o.id)}
				{@const s = d.orgs[o.id]}
				{@const st = giving.byOrg[o.id]}
				{@const g = goalOf(st.total)}
				<li class="dn-card" data-org={o.id} style:--tile={o.tile} style:--deep={o.deep} style:--acc={o.accent}>
					<div class="flex items-start gap-3">
						<DonateArt kind={o.id} size={84} animate={open === o.id || thanked?.org === o.id} />
						<div class="min-w-0 flex-1">
							<h4 class="dn-name font-head">{s.name}</h4>
							<p class="dn-mission">{s.mission}</p>
						</div>
					</div>
					<p class="dn-pays"><b class="font-head">{d.paysFor}:</b> {s.paysFor}</p>
					<div class="grid gap-1">
						<p class="flex flex-wrap items-baseline justify-between gap-x-3 font-head">
							<span class="dn-raised num">{d.raised(st.total)}</span>
							<span class="text-[11px] tracking-wide opacity-85">{d.goal(g.to)}</span>
						</p>
						<div class="dn-bar" role="progressbar" aria-label={d.goal(g.to)} aria-valuemin={g.from} aria-valuemax={g.to} aria-valuenow={st.total}>
							<span style:width="{(g.frac * 100).toFixed(1)}%"></span>
						</div>
						<p class="dn-meta flex flex-wrap gap-x-3 gap-y-0.5">
							<span>{d.donors(st.donors)}</span>
							{#if g.reached}<span aria-label={d.goalsReached(g.reached)}><span aria-hidden="true">{'★'.repeat(Math.min(g.reached, 6))}{g.reached > 6 ? '+' : ''}</span> {d.goalsReached(g.reached)}</span>{/if}
							<span class="min-w-0 truncate">{st.top ? d.top(nameOf(st.top.id), st.top.n) : d.noTop}</span>
						</p>
					</div>
					{#if thanked?.org === o.id}
						<!-- the thank-you sticker, slapped where the Donate button was for a few seconds -->
						{#key thanked.key}
							<div class="dn-thanks" role="status">
								<DonateArt kind={o.id} size={34} />
								<span><b class="font-head">{d.thanks(squad.me?.name ?? '')}</b><span class="block text-[11px]">{s.thanks}</span></span>
							</div>
						{/key}
					{:else if open === o.id}
						<div class="dn-box grid gap-2" role="group" aria-label="{d.give}: {s.name}">
							<p class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">{d.amount}</p>
							<div class="flex flex-wrap gap-1.5">
								{#each DON_AMOUNTS as n (n)}
									<button type="button" class="dn-chip num" aria-pressed={amount === n} disabled={n > balance} onclick={() => pickAmount(n)}>{fmt(n)}</button>
								{/each}
								<button type="button" class="dn-chip" aria-pressed={amount === Math.floor(balance / 2) && balance > 1} disabled={balance < 2} onclick={() => pickAmount(Math.floor(balance / 2))}>{d.half}</button>
								<button type="button" class="dn-chip" aria-pressed={amount === balance && balance > 0} disabled={balance < 1} onclick={() => pickAmount(balance)}>{d.all}</button>
							</div>
							<label class="grid gap-1">
								<span class="sr-only">{d.amount}</span>
								<input
									class="field dn-field num"
									type="text"
									inputmode="numeric"
									autocomplete="off"
									placeholder={d.amountHint}
									bind:value={text}
									oninput={() => (error = '')}
									onkeydown={(e) => e.key === 'Enter' && give(o.id)}
								/>
							</label>
							{#if error}<p class="dn-error text-[12px] font-bold" role="alert">{error}</p>{/if}
							<div class="flex flex-wrap gap-2">
								<button type="button" class="btn btn-primary dn-go" disabled={!amount} onclick={() => give(o.id)}>{amount ? d.giveN(amount) : d.give}</button>
								<button type="button" class="btn" onclick={() => (open = null)}>{d.close}</button>
							</div>
						</div>
					{:else}
						<div><button type="button" class="btn dn-open" onclick={() => openBox(o.id)}>💛 {d.give}</button></div>
					{/if}
				</li>
			{/each}
		</ul>
	</section>

	<!-- who gave to what -->
	<section aria-labelledby="dn-who-h">
		<h3 id="dn-who-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{d.whoHeading}</h3>
		{#if !giving.donors.length}
			<p class="mt-1 text-sm text-muted">{d.whoNone}</p>
		{:else}
			<ol class="mt-2 grid gap-1.5">
				{#each giving.donors as row, i (row.id)}
					{@const m = members[row.id]}
					<li class="dn-who rounded-lg border border-line bg-panel-2 px-2.5 py-2" class:mine={row.id === squad.me?.id}>
						<div class="flex min-w-0 items-center gap-2.5">
							<span class="num w-6 flex-none font-head text-[13px] font-bold text-accent">#{i + 1}</span>
							<SquadAvatar name={m?.name ?? '?'} op={m?.op} size={30} />
							<b class="min-w-0 flex-1 truncate font-head text-[14px]">{m?.name ?? '?'}</b>
							<span class="dn-who-total num flex-none font-head">{d.whoRow(row.total)}</span>
						</div>
						<ul class="mt-1.5 flex flex-wrap gap-1.5 pl-[2.1rem]">
							{#each row.per as p (p.o)}
								{@const o = ORG_BY_ID.get(p.o)!}
								<li class="dn-tag" style:--tile={o.tile} style:--acc={o.accent}>
									<DonateArt kind={p.o} size={20} />
									<span>{d.orgs[p.o].short}</span>
									<b class="num">{fmt(p.n)} 🍔</b>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ol>
		{/if}
	</section>

	<!-- the latest gifts -->
	<section aria-labelledby="dn-recent-h">
		<h3 id="dn-recent-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{d.recentHeading}</h3>
		{#if !giving.recent.length}
			<p class="mt-1 text-sm text-muted">{d.recentNone}</p>
		{:else}
			<ol class="mt-2 grid gap-1">
				{#each giving.recent as g (`${g.by}-${g.id}`)}
					<li class="dn-gift flex min-w-0 items-center gap-2 text-[13px]">
						<DonateArt kind={g.o} size={22} />
						<span class="min-w-0 flex-1 text-fg">{d.recentRow(nameOf(g.by), g.n, d.orgs[g.o].name)}</span>
						<span class="flex-none text-[11px] text-muted">{ago(g.at)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
	<p class="text-xs text-muted">{d.note}</p>
</div>

<style>
	/* the head: the holy burger on warm rose with a gold edge (the same in every theme, like the casino tiles) */
	.dn-stage {
		background:
			radial-gradient(70% 130% at 12% 50%, rgb(255 210 80 / 0.22), transparent 60%),
			linear-gradient(180deg, rgb(120 24 64 / 0.96), rgb(46 8 28 / 0.94));
		box-shadow: inset 0 0 0 1.5px rgb(255 201 40 / 0.6);
		color: #fff6e0;
	}
	.dn-stage .text-fg {
		color: #f6e4ea;
	}
	.dn-stage .text-muted {
		color: #e2bfcc;
	}
	.dn-title {
		text-shadow: none !important;
		font-size: clamp(20px, 5.6vw, 26px);
		font-weight: 900;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: linear-gradient(180deg, #fff3f8, #ff9ec4 50%, #ffd23a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		filter: drop-shadow(0 1px 0 rgb(0 0 0 / 0.7)) drop-shadow(0 0 8px rgb(255 120 170 / 0.4));
	}
	.dn-gave {
		color: #ffd23a;
	}
	/* the squad's card: gold, a big number, a little bar per cause */
	.dn-eyebrow {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--acc);
	}
	.dn-sum-n {
		margin-top: -4px;
		font-size: 34px;
		font-weight: 900;
		line-height: 1;
		color: #fff6d0;
		text-shadow:
			0 2px 0 rgb(0 0 0 / 0.6),
			0 0 14px rgb(255 200 60 / 0.45) !important;
	}
	.dn-squad {
		margin-top: -6px;
		font-size: 13px;
		font-weight: 700;
		color: #f1e6cc;
	}
	.dn-sum-row {
		display: grid;
		grid-template-columns: 22px 7.5rem minmax(0, 1fr) 3.6rem;
		align-items: center;
		gap: 8px;
		color: #fff6e0;
	}
	.dn-sum-bar {
		height: 8px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.4);
		overflow: hidden;
	}
	.dn-sum-bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--acc);
		box-shadow: 0 0 6px var(--acc);
		transition: width 0.6s ease;
	}
	.dn-sum-row b {
		min-width: 3ch;
		text-align: right;
		color: var(--acc);
	}
	/* phones: the logo beside the words, a little smaller */
	@media (max-width: 479px) {
		.dn-stage :global(svg.dna) {
			width: 92px;
			height: 74px;
		}
		.dn-stage > div {
			flex-basis: 10rem;
		}
	}
	/* the causes: one column on phones, two, then three side by side */
	.dn-orgs {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
		gap: 12px;
	}
	.dn-card {
		position: relative;
		display: grid;
		align-content: start;
		gap: 10px;
		padding: 12px;
		border: 1.5px solid color-mix(in srgb, var(--acc) 55%, transparent);
		border-radius: 14px;
		background:
			radial-gradient(90% 60% at 20% 0%, rgb(255 255 255 / 0.12), transparent 70%),
			linear-gradient(180deg, var(--tile), var(--deep));
		color: #fff6e0;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.16),
			0 2px 6px rgb(0 0 0 / 0.35);
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.55);
	}
	.dn-name {
		font-size: 17px;
		font-weight: 900;
		line-height: 1.15;
		color: var(--acc);
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.8) !important;
	}
	.dn-mission {
		margin-top: 3px;
		font-size: 13px;
		line-height: 1.35;
		color: #fff6e0;
	}
	.dn-pays {
		font-size: 12.5px;
		line-height: 1.4;
		color: #f1e6cc;
		padding: 6px 8px;
		border-radius: 8px;
		background: rgb(0 0 0 / 0.22);
	}
	.dn-pays b {
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--acc);
	}
	.dn-raised {
		font-size: 15px;
		font-weight: 900;
	}
	.dn-bar {
		height: 10px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.4);
		box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
		overflow: hidden;
	}
	.dn-bar span {
		display: block;
		height: 100%;
		min-width: 0;
		border-radius: inherit;
		background: linear-gradient(90deg, color-mix(in srgb, var(--acc) 70%, #fff), var(--acc));
		box-shadow: 0 0 8px var(--acc);
		transition: width 0.6s ease;
	}
	.dn-meta {
		font-size: 11.5px;
		color: #e9ddc4;
	}
	.dn-open,
	.dn-go {
		min-height: 44px;
	}
	.dn-open {
		border-color: var(--acc);
		color: #fff6e0;
		background: rgb(0 0 0 / 0.25);
	}
	.dn-box {
		padding: 10px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--acc) 50%, transparent);
	}
	.dn-chip {
		min-width: 44px;
		min-height: 44px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1.5px solid color-mix(in srgb, var(--acc) 60%, transparent);
		background: rgb(0 0 0 / 0.3);
		color: #fff6e0;
		font-size: 13px;
		font-weight: 800;
	}
	.dn-chip[aria-pressed='true'] {
		background: var(--acc);
		border-color: var(--acc);
		color: #1a0e06;
		text-shadow: none;
	}
	.dn-chip:disabled {
		opacity: 0.4;
	}
	.dn-field {
		min-height: 44px;
		font-size: 15px;
	}
	.dn-error {
		color: #ffd0d0;
	}
	/* the thank-you sticker: slapped where the Donate button was, for a few seconds after a gift */
	.dn-thanks {
		justify-self: start;
		display: flex;
		align-items: center;
		gap: 6px;
		max-width: 100%;
		min-height: 44px;
		padding: 5px 12px 5px 6px;
		border: 2.5px solid #fff;
		border-radius: 10px;
		background: var(--acc);
		color: #1a0e06;
		text-shadow: none;
		font-size: 12.5px;
		line-height: 1.15;
		transform: rotate(-3deg);
		box-shadow: 0 4px 10px rgb(0 0 0 / 0.5);
		animation: dn-slap 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
	}
	@keyframes dn-slap {
		from {
			transform: rotate(-16deg) scale(1.7);
			opacity: 0;
		}
		to {
			transform: rotate(-3deg) scale(1);
			opacity: 1;
		}
	}
	/* who gave to what */
	.dn-who.mine {
		border-color: var(--t-accent);
	}
	.dn-who-total {
		font-size: 13px;
		font-weight: 800;
		color: var(--t-fg);
	}
	.dn-tag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 2px 9px 2px 3px;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--acc) 60%, transparent);
		background: linear-gradient(180deg, var(--tile), color-mix(in srgb, var(--tile) 55%, #000));
		color: #fff6e0;
		font-size: 12px;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.6);
	}
	.dn-tag b {
		color: var(--acc);
		font-weight: 800;
	}
	.dn-gift {
		padding: 3px 0;
		border-bottom: 1px dashed var(--t-line);
	}
	@media (prefers-reduced-motion: reduce) {
		.dn-thanks {
			animation: none;
		}
		.dn-bar span,
		.dn-sum-bar span {
			transition: none;
		}
	}
</style>
