<!--
	BurgiGives' karma bank (donations.ts; 2026-11-21, the user: "make all donated burgers go to a karma bank,
	hearts as a currency only I see, that I can use to give back to the gang and show love"). Shown only to
	the member who is the house (Abscar): the hearts in the bank (every burger the squad donated, minus what
	was sent back), who gets the love (one member or everyone), how many hearts each, an optional love line,
	Send, and the love sent so far. Since 2026-11-22 hearts arrive as KarmaShop hearts ❤️, 1 💗 = 1 ❤️ (doc
	field `karmaHearts`, karma-shop.ts heartsOf `gifted`; until then they arrived as burgers, doc field
	`karma`, which still counts here), with a radio line and a toast on their page. Pretend hearts, never money.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import { heartsGiftedTo, karmaBalance, loveLog, lovedTotal, parseAmount, LOVE_LINES } from '#lib/donations.ts';
	import { KARMA_ITEMS } from '#lib/karma-shop.ts';
	import SquadAvatar from './SquadAvatar.svelte';

	let { donated }: { donated: number } = $props();
	const k = t.donate.karma;
	const fmt = (n: number) => n.toLocaleString('en-US');

	const books = $derived(squad.doc);
	const hearts = $derived(karmaBalance(donated, books?.karma, books?.karmaHearts));
	const sentSoFar = $derived(lovedTotal(books));
	/** What KarmaShop's items cost, so Abscar knows what a heart is worth there. */
	const prices = KARMA_ITEMS.map((i) => i.price);
	const cheapest = Math.min(...prices);
	const dearest = Math.max(...prices);
	const everything = prices.reduce((a, p) => a + p, 0);
	const others = $derived(squad.entries.filter((e) => !e.mine));
	const nameOf = (id: string) => squad.byId(id)?.member.name ?? '?';

	/** Who: a member id, or 'all'. */
	let who = $state<string | null>(null);
	let text = $state('');
	let line = $state<number | null>(null);
	let busy = $state(false);
	let error = $state('');
	const amount = $derived(parseAmount(text));
	const people = $derived(who === 'all' ? others.length : who ? 1 : 0);
	const cost = $derived((amount ?? 0) * people);
	/** Quick amounts in KarmaShop terms (its items cost 5–500 ❤️); any other amount can be typed in. */
	const QUICK = [10, 50, 100, 500, 1_000];

	async function send() {
		const n = amount;
		if (!who || !n) return;
		if (cost > hearts) return void (error = k.broke(hearts));
		busy = true;
		error = '';
		const to = who === 'all' ? others.map((e) => e.id) : [who];
		const r = await squad.sendLove(to, n, line ?? undefined);
		busy = false;
		if (r === 'ok') {
			toast.show(who === 'all' ? k.sentAll(n, to.length) : k.sent(nameOf(who), n), undefined, 5000);
			text = '';
		} else error = r === 'broke' ? k.broke(hearts) : k.off;
	}

	const log = $derived(loveLog(books).slice(0, 8));
	const now = $derived(Math.max(squad.now, Date.now()));
	const ago = (at: number) => t.donate.ago(Math.max(0, Math.floor((now - at) / 60_000)));
</script>

<section class="kb grid gap-3 rounded-card px-4 py-3" aria-labelledby="kb-h">
	<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
		<h3 id="kb-h" class="kb-title font-head">💗 {k.heading}</h3>
		<span class="kb-secret font-head">🔒 {k.secret}</span>
	</div>
	<div class="flex flex-wrap items-end gap-x-6 gap-y-1">
		<p class="grid">
			<span class="kb-n num font-head">{k.hearts(hearts)}</span>
			<span class="text-[11px] font-bold tracking-[0.12em] uppercase opacity-80">{k.heartsLabel}</span>
		</p>
		{#if sentSoFar}<p class="text-[12px] opacity-85">{k.given(sentSoFar)}</p>{/if}
	</div>
	<p class="text-[13px]">{k.intro}</p>

	{#if !others.length}
		<p class="text-[13px] font-bold">{k.nobody}</p>
	{:else}
		<div class="grid gap-1.5">
			<p class="kb-label font-head">{k.to}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each others as e (e.id)}
					{@const got = heartsGiftedTo(books, e.id)}
					<button type="button" class="kb-who" aria-pressed={who === e.id} onclick={() => ((who = e.id), (error = ''))}>
						<SquadAvatar name={e.member.name} op={e.member.op} size={26} />
						<span class="grid text-left leading-tight">
							<b class="font-head text-[13px]">{e.member.name}</b>
							{#if got}<span class="text-[10.5px] opacity-80">{k.gotTag(got)}</span>{/if}
						</span>
					</button>
				{/each}
				{#if others.length > 1}
					<button type="button" class="kb-who" aria-pressed={who === 'all'} onclick={() => ((who = 'all'), (error = ''))}><span aria-hidden="true">🫶</span> <b class="font-head text-[13px]">{k.everyone}</b></button>
				{/if}
			</div>
		</div>
		<div class="grid gap-1.5">
			<p class="kb-label font-head">{k.amount}</p>
			<div class="flex flex-wrap gap-1.5">
				{#each QUICK as n (n)}
					<button type="button" class="kb-chip num" aria-pressed={amount === n} disabled={n * Math.max(1, people) > hearts} onclick={() => ((text = String(n)), (error = ''))}>{fmt(n)}</button>
				{/each}
				<label class="min-w-[9rem] flex-1">
					<span class="sr-only">{k.amount}</span>
					<input class="field kb-field num" type="text" inputmode="numeric" autocomplete="off" placeholder={t.donate.amountHint} bind:value={text} oninput={() => (error = '')} />
				</label>
			</div>
			<p class="text-[11.5px] opacity-85">{k.priceHint(cheapest, dearest, everything)}</p>
		</div>
		<div class="grid gap-1.5">
			<p class="kb-label font-head">{k.line}</p>
			<div class="flex flex-wrap gap-1.5">
				<button type="button" class="kb-chip" aria-pressed={line === null} onclick={() => (line = null)}>{k.noLine}</button>
				{#each Array.from({ length: LOVE_LINES }, (_, i) => i) as i (i)}
					<button type="button" class="kb-chip" aria-pressed={line === i} onclick={() => (line = i)}>{k.lines[i]}</button>
				{/each}
			</div>
		</div>
		{#if error}<p class="kb-error text-[12px] font-bold" role="alert">{error}</p>{/if}
		<div>
			<button type="button" class="btn btn-primary kb-send" disabled={busy || !who || !amount || cost > hearts} onclick={() => void send()}>
				{!amount ? k.sendEmpty : who === 'all' ? k.sendAll(amount, others.length) : k.send(amount)}
			</button>
		</div>
	{/if}

	<div class="grid gap-1">
		<p class="kb-label font-head">{k.logHeading}</p>
		{#if !log.length}
			<p class="text-[12px] opacity-80">{k.logNone}</p>
		{:else}
			<ol class="grid gap-1">
				{#each log as g (g.id)}
					<li class="kb-log flex min-w-0 items-center gap-2 text-[12.5px]">
						<span class="min-w-0 flex-1">{k.logRow(nameOf(g.to), g.n)}{g.m !== undefined ? ` · “${k.lines[g.m]}”` : ''}</span>
						<span class="flex-none text-[11px] opacity-75">{ago(g.at)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</section>

<style>
	/* the karma bank: hot pink on deep plum, the same in every theme */
	.kb {
		background:
			radial-gradient(60% 120% at 90% 0%, rgb(255 120 190 / 0.28), transparent 60%),
			linear-gradient(180deg, #5a1240, #22061a);
		box-shadow:
			inset 0 0 0 1.5px #ff7ac0,
			0 0 18px rgb(255 90 170 / 0.25);
		color: #ffeef7;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
	}
	.kb-title {
		font-size: 20px;
		font-weight: 900;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #ff9ed2;
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.7) !important;
	}
	.kb-secret {
		padding: 2px 9px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.35);
		box-shadow: inset 0 0 0 1px rgb(255 158 210 / 0.6);
		font-size: 10.5px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #ffd0e8;
	}
	.kb-n {
		font-size: 32px;
		font-weight: 900;
		line-height: 1.05;
		color: #fff;
		text-shadow:
			0 2px 0 rgb(0 0 0 / 0.55),
			0 0 16px rgb(255 100 180 / 0.6) !important;
	}
	.kb-label {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ff9ed2;
	}
	.kb-who,
	.kb-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		min-width: 44px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1.5px solid rgb(255 158 210 / 0.55);
		background: rgb(0 0 0 / 0.3);
		color: #ffeef7;
		font-size: 13px;
		font-weight: 700;
	}
	.kb-who {
		padding-left: 6px;
	}
	.kb-who[aria-pressed='true'],
	.kb-chip[aria-pressed='true'] {
		background: #ff7ac0;
		border-color: #ffb8de;
		color: #2a0618;
		text-shadow: none;
	}
	.kb-chip:disabled {
		opacity: 0.4;
	}
	.kb-field {
		width: 100%;
		min-height: 44px;
		font-size: 15px;
	}
	.kb-send {
		min-height: 44px;
	}
	.kb-error {
		color: #ffd0d0;
	}
	.kb-log {
		padding: 3px 0;
		border-bottom: 1px dashed rgb(255 158 210 / 0.35);
	}
</style>
