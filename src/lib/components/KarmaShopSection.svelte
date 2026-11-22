<!--
	KarmaShop (karma-shop.ts; 2026-11-20, the user: "gör en till shop som är karmashop, där man kommer kunna köpa
	saker med hjärtan"). The second shop in the BurgiShop tab (ShopPage's switch): your operator wearing
	what you have on (tap an item's picture to try it on first) and your hearts, how hearts are earned
	(giving burgers away in BurgiGives), the kinds, the good-karma items, and the squad's kindest givers.
	Bought items are worn like BurgiShop's (one per kind, squad.equipItem) and show on your header operator
	and squad card for everyone. Soft pink and gold in every theme, like the casino tiles keep their colours.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import { worn, type ShopItem, type ShopSlot } from '#lib/shop.ts';
	import { kindest, HEART_BURGERS, KARMA_ITEMS, KARMA_SLOTS, type KarmaSlot } from '#lib/karma-shop.ts';
	import { ORG_IDS } from '#lib/donations.ts';
	import { houseOf } from '#lib/squad-fun.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import OpGear from './OpGear.svelte';
	import ShopPin from './ShopPin.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	const k = t.karmaShop;
	const s = t.shop;
	/** kinds drawn on the face (shown on a bigger operator on their item cards) */
	const FACE_SLOTS: ShopSlot[] = ['eyes', 'hat', 'smoke'];
	let slot = $state<KarmaSlot>('aura');
	/** An item being tried on (shown on the preview only). */
	let trying = $state<ShopItem | null>(null);

	const hearts = $derived(squad.myHearts);
	const mine = $derived(worn(squad.shop));
	const look = $derived(trying ? { ...mine, [trying.slot]: trying } : mine);
	const items = $derived(KARMA_ITEMS.filter((i) => i.slot === slot));
	const owns = (id: string) => squad.karmaShop?.own[id] !== undefined;
	const wearing = (it: ShopItem) => squad.shop?.eq[it.slot] === it.id;
	const me = $derived(squad.me);
	const sample = $derived((me?.name ?? 'Abscar').toUpperCase());
	/** burgers still to give for the next heart */
	const toNext = $derived(HEART_BURGERS - (hearts.given % HEART_BURGERS));
	const board = $derived(kindest(Object.fromEntries(squad.entries.map((e) => [e.id, e.member]))));
	/** whose karma bank sends hearts (the house, Abscar) */
	const bankName = $derived(squad.doc ? (squad.doc.members[houseOf(squad.doc.members) ?? '']?.name ?? 'Abscar') : 'Abscar');

	function tryOn(it: ShopItem) {
		trying = trying?.id === it.id ? null : it;
	}

	function buyIt(it: ShopItem) {
		const r = squad.buyKarmaItem(it.id);
		if (r === 'ok') {
			trying = null;
			toast.show(k.bought(it.name));
		} else if (r === 'broke') toast.show(k.broke(it.price, hearts.balance), undefined, 6000);
	}

	function wearIt(it: ShopItem) {
		if (squad.equipItem(it.slot, it.id)) {
			trying = null;
			toast.show(s.wornNow(it.name));
		}
	}

	function takeOff(it: ShopItem) {
		if (squad.equipItem(it.slot, null)) toast.show(s.takenOff(it.name));
	}

	function stateText(it: ShopItem): string {
		return wearing(it) ? s.wearing : owns(it.id) ? s.owned : k.buy(it.price);
	}
</script>

{#snippet face(l: Partial<Record<ShopSlot, ShopItem>>, size: number, pin: number)}
	<OpGear aura={l.aura?.id} effect={l.effect?.id} badge={l.badge?.id} pet={l.pet?.id} {pin} extra={{ mount: l.mount?.id, plush: l.plush?.id }}>
		<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} {size} face={faceOf(l)} />
	</OpGear>
{/snippet}

<div class="karma">
	<p class="max-w-3xl text-[13px] text-fg">{k.intro}</p>
	{#if !me?.op}<p class="mt-1 text-xs text-muted">{s.noOp}</p>{/if}

	<!-- your operator, wearing what you have on (+ what you're trying on), and your hearts -->
	<div class="karma-stage mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card px-4 py-4">
		<div class="karma-face">{@render face(look, 96, 30)}</div>
		<div class="min-w-0 flex-1">
			<p class="font-hud text-[11px] tracking-[0.22em] uppercase karma-dim">{trying ? `${s.tryOn}: ${trying.name}` : s.preview}</p>
			<p class="og-name font-head text-2xl leading-tight font-bold tracking-[0.2em] uppercase" data-style={look.name?.id}>{sample}</p>
			{#if look.title}<span class="og-title" data-rarity={look.title.rarity}>{look.title.text}</span>{/if}
			<p class="karma-hearts mt-2 font-head" aria-live="polite"><b class="num">{hearts.balance.toLocaleString('en-US')}</b> <span aria-hidden="true">❤️</span><span class="karma-hearts-word">{k.balance}</span></p>
			<p class="karma-dim text-[11.5px]">{k.earnedSpent(hearts.earned, hearts.spent)}</p>
			{#if hearts.gifted}<p class="karma-gift text-[11.5px] font-bold">{k.gifted(hearts.gifted, bankName)}</p>{/if}
			<p class="karma-dim text-[11.5px]">{k.given(hearts.given, hearts.causes, ORG_IDS.length)} · {k.next(toNext)}</p>
		</div>
	</div>

	<!-- how hearts are earned -->
	<div class="karma-how mt-3 rounded-card px-4 py-3">
		<p class="font-head text-[13px] font-bold tracking-wide uppercase">{k.how}</p>
		<ul class="mt-1 grid gap-0.5 text-[12.5px]">
			{#each k.rules(ORG_IDS.length) as rule, i (i)}<li class="flex gap-2"><span aria-hidden="true">❤️</span><span>{rule}</span></li>{/each}
		</ul>
	</div>

	<!-- the kinds -->
	<div class="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={s.slotsLabel}>
		{#each KARMA_SLOTS as sl (sl)}
			<button type="button" class="chip karma-chip" aria-pressed={slot === sl} onclick={() => ((slot = sl), (trying = null))}>{s.slots[sl]}</button>
		{/each}
	</div>
	{#if k.slotHint[slot]}<p class="mt-3 text-[13px] text-muted">{k.slotHint[slot]}</p>{/if}

	<!-- the items -->
	<ul class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-2">
		{#each items as it (it.id)}
			{@const owned = owns(it.id)}
			{@const on = wearing(it)}
			<li class="karma-item rounded-card p-2.5" data-rarity={it.rarity} class:on>
				<button
					type="button"
					class="karma-try"
					class:tall={it.slot === 'hat'}
					aria-pressed={trying?.id === it.id}
					aria-label={s.itemLabel(it.name, s.slots[it.slot], s.rarity[it.rarity], stateText(it))}
					onclick={() => tryOn(it)}
				>
					{#if it.slot === 'name'}
						<span class="og-name font-head text-[17px] font-bold tracking-[0.16em]" data-style={it.id}>{sample}</span>
					{:else if it.slot === 'title'}
						<span class="og-title" data-rarity={it.rarity}>{it.text}</span>
					{:else if it.slot === 'badge'}
						<ShopPin id={it.id} size={40} />
					{:else if FACE_SLOTS.includes(it.slot)}
						{@render face({ [it.slot]: it }, 64, 18)}
					{:else}
						{@render face({ [it.slot]: it }, 46, 18)}
					{/if}
				</button>
				<p class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<b class="min-w-0 font-head text-[14px] font-bold">{it.name}</b>
					<span class="karma-rarity font-head">{s.rarity[it.rarity]}</span>
				</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#if !owned}
						<button type="button" class="btn btn-sm karma-buy" disabled={hearts.balance < it.price} title={hearts.balance < it.price ? k.broke(it.price, hearts.balance) : undefined} onclick={() => buyIt(it)}>{k.buy(it.price)}</button>
					{:else if on}
						<span class="karma-on font-head">✔ {s.wearing}</span>
						<button type="button" class="btn btn-sm" onclick={() => takeOff(it)}>{s.takeOff}</button>
					{:else}
						<button type="button" class="btn btn-sm karma-buy" onclick={() => wearIt(it)}>{s.wear}</button>
						<span class="self-center text-[11px] text-muted">{s.owned}</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>

	<!-- the squad's kindest givers -->
	<div class="karma-board mt-4 rounded-card px-4 py-3">
		<p class="font-head text-[13px] font-bold tracking-wide uppercase">{k.kindest}</p>
		{#if !board.length}
			<p class="mt-1 text-[12.5px] karma-dim">{k.kindestNone}</p>
		{:else}
			<ol class="mt-2 grid gap-1.5">
				{#each board as row, i (row.id)}
					{@const e = squad.byId(row.id)}
					<li class="karma-row flex items-center gap-2.5 rounded-lg px-2 py-1.5" class:mine={e?.mine}>
						<span class="karma-rank font-head num">{i + 1}</span>
						<SquadAvatar name={e?.member.name ?? '?'} op={e?.member.op} size={32} />
						<div class="min-w-0 flex-1">
							<b class="block truncate font-head text-[14px]">{e?.member.name ?? '?'}{#if e?.mine}{' '}<span class="karma-you">{k.you}</span>{/if}</b>
							<span class="block text-[11.5px] karma-dim">{row.items ? `${k.kindRow(row.earned, row.given)} · ${k.items(row.items)}` : k.kindRow(row.earned, row.given)}</span>
						</div>
						{#if i === 0}<span class="karma-crown" aria-hidden="true">😇</span>{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</div>

<style>
	/* soft pink and gold, the same in every theme */
	.karma {
		--k-pink: #ff6aa8;
		--k-gold: #ffd23a;
	}
	.karma-stage {
		background:
			radial-gradient(70% 120% at 18% 50%, rgb(255 120 180 / 0.3), transparent 62%),
			radial-gradient(60% 90% at 90% 10%, rgb(255 214 90 / 0.18), transparent 60%),
			linear-gradient(180deg, #4a1238, #2a0820);
		box-shadow:
			inset 0 0 0 1.5px rgb(255 210 58 / 0.65),
			0 0 18px rgb(255 106 168 / 0.25);
		color: #fff;
	}
	.karma-dim {
		color: #ffd6e8;
	}
	.karma-gift {
		color: var(--k-gold);
	}
	.karma-face {
		display: grid;
		place-items: center;
		width: 140px;
		height: 140px;
	}
	.karma-hearts {
		display: flex;
		align-items: baseline;
		gap: 6px;
		color: #fff;
		line-height: 1.1;
	}
	.karma-hearts b {
		font-size: 30px;
		font-weight: 900;
		color: #ffe4f0;
		text-shadow:
			0 1px 0 rgb(60 0 24 / 0.9),
			0 0 12px rgb(255 106 168 / 0.8);
	}
	.karma-hearts span {
		font-size: 20px;
	}
	.karma-hearts .karma-hearts-word {
		margin-left: 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #ffd6e8;
	}
	.karma-how,
	.karma-board {
		background: linear-gradient(180deg, rgb(74 18 56 / 0.92), rgb(42 8 32 / 0.92));
		box-shadow: inset 0 0 0 1px rgb(255 106 168 / 0.45);
		color: #fff;
	}
	.karma-how p,
	.karma-board > p {
		color: #ffd23a;
	}
	.karma-chip[aria-pressed='true'] {
		border-color: var(--k-pink);
		box-shadow: 0 0 0 1px var(--k-pink), 0 0 10px rgb(255 106 168 / 0.45);
	}
	.karma-item {
		--r: #e8b8cc;
		display: flex;
		flex-direction: column;
		border: 1px solid color-mix(in srgb, var(--r) 60%, transparent);
		background: linear-gradient(180deg, rgb(70 16 52 / 0.9), rgb(36 6 28 / 0.92));
		color: #fff;
	}
	.karma-item[data-rarity='rare'] {
		--r: #ff8ac0;
	}
	.karma-item[data-rarity='epic'] {
		--r: #c98bff;
	}
	.karma-item[data-rarity='legendary'] {
		--r: #ffd23a;
		box-shadow: 0 0 12px rgb(255 210 58 / 0.25);
	}
	.karma-item.on {
		box-shadow: 0 0 0 2px var(--k-gold);
	}
	.karma-item :global(.text-muted) {
		color: #ffd6e8;
	}
	.karma-try {
		display: grid;
		place-items: center;
		min-height: 84px;
		border-radius: 10px;
		background: radial-gradient(circle, color-mix(in srgb, var(--r) 28%, transparent), rgb(0 0 0 / 0.28) 70%);
		overflow: hidden;
	}
	/* hats sit above the head (the halo floats over it): room on top so they aren't cut off */
	.karma-try.tall {
		min-height: 104px;
		padding-top: 24px;
	}
	.karma-try[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--r);
	}
	.karma-rarity {
		padding: 0 6px;
		border: 1px solid var(--r);
		border-radius: 999px;
		color: #fff;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.karma-buy {
		border-color: #ffb0d0;
		background: linear-gradient(180deg, #ff7ab4, #d8336f);
		color: #fff;
		font-weight: 800;
		text-shadow: 0 1px 0 rgb(80 0 30 / 0.7);
	}
	.karma-buy:disabled {
		background: rgb(255 255 255 / 0.1);
		border-color: rgb(255 214 232 / 0.35);
		color: #f3c6da;
		text-shadow: none;
	}
	.karma-on {
		align-self: center;
		color: #7dff9a;
		font-size: 12px;
		font-weight: 800;
	}
	.karma-row {
		background: rgb(0 0 0 / 0.22);
	}
	.karma-row.mine {
		box-shadow: inset 0 0 0 1px var(--k-pink);
	}
	.karma-rank {
		width: 1.4em;
		text-align: center;
		font-weight: 900;
		color: var(--k-gold);
	}
	.karma-you {
		margin-left: 6px;
		padding: 0 5px;
		border-radius: 999px;
		background: var(--k-pink);
		color: #2a0614;
		font-size: 9.5px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		vertical-align: 2px;
	}
	.karma-crown {
		font-size: 18px;
	}
</style>
