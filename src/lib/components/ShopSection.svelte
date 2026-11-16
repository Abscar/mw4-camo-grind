<!--
	BurgiShop (shop.ts; 2026-11-16, the user's ask: "a shop where you can buy cosmetics with your burgers,
	that you can then equip on your operator"). In the BurgiCasino tab. Your operator at the top wearing
	what you have on (tap an item's picture to try it on first), then the items of one kind: auras,
	effects, pins, name styles, titles. Buy with burgers (worn at once), wear or take off what you own.
	What you wear shows on your operator in the header's squad frame (OperatorTag + OpGear).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { shopSpent, worn, SHOP_ITEMS, SLOTS, type ShopItem, type ShopSlot } from '#lib/shop.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import OpGear from './OpGear.svelte';
	import ShopPin from './ShopPin.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	const s = t.shop;
	let slot = $state<ShopSlot>('aura');
	/** An item being tried on (shown on the preview only). */
	let trying = $state<ShopItem | null>(null);

	const balance = $derived(squad.myBank?.balance ?? 0);
	const mine = $derived(worn(squad.shop));
	const look = $derived(trying ? { ...mine, [trying.slot]: trying } : mine);
	const items = $derived(SHOP_ITEMS.filter((i) => i.slot === slot));
	const owns = (id: string) => squad.shop?.own[id] !== undefined;
	const wearing = (it: ShopItem) => squad.shop?.eq[it.slot] === it.id;
	const me = $derived(squad.me);
	const sample = $derived((me?.name ?? 'Abscar').toUpperCase());

	function tryOn(it: ShopItem) {
		trying = trying?.id === it.id ? null : it;
	}

	function buyIt(it: ShopItem) {
		const r = squad.buyItem(it.id);
		if (r === 'ok') {
			trying = null;
			toast.show(s.bought(it.name));
		} else if (r === 'broke') toast.show(s.broke(it.price, balance), undefined, 5000);
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
		return wearing(it) ? s.wearing : owns(it.id) ? s.owned : s.buy(it.price);
	}
</script>

{#snippet face(l: Partial<Record<ShopSlot, ShopItem>>, size: number, pin: number)}
	<OpGear aura={l.aura?.id} effect={l.effect?.id} badge={l.badge?.id} {pin}>
		<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} {size} />
	</OpGear>
{/snippet}

<div class="shop">
	<p class="max-w-3xl text-[13px] text-fg">{s.intro}</p>
	{#if !me?.op}<p class="mt-1 text-xs text-muted">{s.noOp}</p>{/if}

	<!-- your operator, wearing what you have on (+ what you're trying on) -->
	<div class="shop-stage mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card px-4 py-4">
		<div class="shop-face">{@render face(look, 96, 30)}</div>
		<div class="min-w-0">
			<p class="font-hud text-[11px] tracking-[0.22em] text-muted uppercase">{trying ? `${s.tryOn}: ${trying.name}` : s.preview}</p>
			<p class="og-name font-head text-2xl leading-tight font-bold tracking-[0.2em] uppercase" data-style={look.name?.id}>{sample}</p>
			{#if look.title}<span class="og-title" data-rarity={look.title.rarity}>{look.title.text}</span>{/if}
			<p class="mt-2 text-[11px] text-muted">{s.spent(shopSpent(squad.shop))} · {s.toHouse}</p>
		</div>
	</div>

	<!-- the kinds -->
	<div class="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={s.slotsLabel}>
		{#each SLOTS as sl (sl)}
			<button type="button" class="chip" aria-pressed={slot === sl} onclick={() => ((slot = sl), (trying = null))}>{s.slots[sl]}</button>
		{/each}
	</div>

	<!-- the items -->
	<ul class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-2">
		{#each items as it (it.id)}
			{@const owned = owns(it.id)}
			{@const on = wearing(it)}
			<li class="shop-item rounded-card border border-line bg-panel-2 p-2.5" data-rarity={it.rarity} class:on>
				<button
					type="button"
					class="shop-try"
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
					{:else}
						{@render face({ [it.slot]: it }, 46, 18)}
					{/if}
				</button>
				<p class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<b class="min-w-0 font-head text-[14px] font-bold">{it.name}</b>
					<span class="shop-rarity font-head">{s.rarity[it.rarity]}</span>
				</p>
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#if !owned}
						<button type="button" class="btn btn-sm btn-primary" disabled={balance < it.price} title={balance < it.price ? s.broke(it.price, balance) : undefined} onclick={() => buyIt(it)}>{s.buy(it.price)}</button>
					{:else if on}
						<span class="shop-on font-head">✔ {s.wearing}</span>
						<button type="button" class="btn btn-sm" onclick={() => takeOff(it)}>{s.takeOff}</button>
					{:else}
						<button type="button" class="btn btn-sm btn-primary" onclick={() => wearIt(it)}>{s.wear}</button>
						<span class="shop-owned text-[11px] text-muted">{s.owned}</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.shop-stage {
		background:
			radial-gradient(80% 120% at 20% 50%, rgb(255 201 40 / 0.14), transparent 60%),
			linear-gradient(180deg, rgb(28 8 52 / 0.55), rgb(10 4 24 / 0.45));
		box-shadow: inset 0 0 0 1.5px rgb(255 201 40 / 0.5);
	}
	.shop-face {
		display: grid;
		place-items: center;
		width: 140px;
		height: 140px;
	}
	.shop-item {
		--r: #9aa3ad;
		display: flex;
		flex-direction: column;
	}
	.shop-item[data-rarity='rare'] {
		--r: #4f9bff;
	}
	.shop-item[data-rarity='epic'] {
		--r: #b265ff;
	}
	.shop-item[data-rarity='legendary'] {
		--r: #ffc928;
	}
	.shop-item {
		border-color: color-mix(in srgb, var(--r) 55%, transparent);
	}
	.shop-item.on {
		box-shadow: 0 0 0 2px var(--t-accent);
	}
	.shop-try {
		display: grid;
		place-items: center;
		min-height: 84px;
		border-radius: 10px;
		background: radial-gradient(circle, color-mix(in srgb, var(--r) 22%, transparent), rgb(0 0 0 / 0.25) 70%);
		overflow: hidden;
	}
	.shop-try[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--r);
	}
	.shop-rarity {
		padding: 0 6px;
		border: 1px solid var(--r);
		border-radius: 999px;
		color: var(--t-fg);
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.shop-on {
		align-self: center;
		color: var(--t-buff, #3ee06a);
		font-size: 12px;
		font-weight: 800;
	}
	.shop-owned {
		align-self: center;
	}
</style>
