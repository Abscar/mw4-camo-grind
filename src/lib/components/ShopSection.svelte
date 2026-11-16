<!--
	BurgiShop (shop.ts; 2026-11-16, the user's ask: "a shop where you can buy cosmetics with your burgers,
	that you can then equip on your operator"). In the BurgiCasino tab. Your operator at the top wearing
	what you have on (tap an item's picture to try it on first), then the items of one kind: auras,
	effects, pins, mouth (the Golden Holk, drawn by the operator's own emblem), name styles, titles. Buy with
	burgers (worn at once), wear or take off what you own.
	What you wear shows on your operator in the header's squad frame (OperatorTag + OpGear).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { shopSpent, worn, PRANKS, SHOP_ITEMS, SLOTS, type ShopItem, type ShopSlot } from '#lib/shop.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';
	import OpGear from './OpGear.svelte';
	import ShopPin from './ShopPin.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	const s = t.shop;
	const pr = t.pranks;
	let slot = $state<ShopSlot | 'pranks'>('aura');
	/** The prank waiting for a target (the "who gets it?" dialog). */
	let aiming = $state<(typeof PRANKS)[number] | null>(null);
	let pickOpen = $state(false);
	const others = $derived(squad.entries.filter((e) => !e.mine));

	function aim(p: (typeof PRANKS)[number]) {
		if (balance < p.price) {
			toast.show(s.broke(p.price, balance), undefined, 5000);
			return;
		}
		aiming = p;
		pickOpen = true;
	}

	function fire(id: string, name: string) {
		if (!aiming) return;
		const r = squad.prank(aiming.id, id, name);
		pickOpen = false;
		if (r === 'ok') toast.show(pr.thrown(name));
		else if (r === 'broke') toast.show(s.broke(aiming.price, balance), undefined, 5000);
		aiming = null;
	}
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
		<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} {size} mouth={l.mouth?.id} />
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
		{#each [...SLOTS, 'pranks' as const] as sl (sl)}
			<button type="button" class="chip" aria-pressed={slot === sl} onclick={() => ((slot = sl), (trying = null))}>{s.slots[sl]}</button>
		{/each}
	</div>

	{#if slot === 'pranks'}
		<!-- pranks: bought per throw, aimed at a friend -->
		<p class="mt-3 text-[13px] text-muted">{pr.intro}</p>
		<ul class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-2">
			{#each PRANKS as p (p.id)}
				<li class="shop-item shop-prank rounded-card border border-line bg-panel-2 p-3" data-prank={p.id}>
					<div class="shop-try" aria-hidden="true">
						{#if p.id === 'smoke-bomb'}
							<OpGear smoked><SquadAvatar name="?" op={me?.op ?? undefined} size={46} /></OpGear>
						{:else}
							<span class="shop-highdemo font-head">{pr.stamp}</span>
						{/if}
					</div>
					<p class="mt-2 font-head text-[14px] font-bold">{pr.names[p.id]}</p>
					<p class="mt-1 text-xs text-muted">{pr.what[p.id]}</p>
					<button type="button" class="btn btn-sm btn-primary mt-2" disabled={!others.length || balance < p.price} onclick={() => aim(p)}>{pr.throw(p.price)}</button>
				</li>
			{/each}
		</ul>
		{#if !others.length}<p class="mt-2 text-xs text-muted">{pr.nobody}</p>{/if}
	{:else}
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
					{:else if it.slot === 'mouth'}
						<!-- bigger, so the thing in the mouth reads -->
						{@render face({ mouth: it }, 64, 18)}
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
	{/if}
</div>

<Dialog bind:open={pickOpen} title={aiming ? `${pr.names[aiming.id]} · ${pr.pick}` : pr.pick}>
	<ul class="grid gap-1.5">
		{#each others as e (e.id)}
			<li>
				<button type="button" class="shop-target flex w-full items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-left" onclick={() => fire(e.id, e.member.name)}>
					<SquadAvatar name={e.member.name} op={e.member.op} size={34} />
					<b class="min-w-0 flex-1 truncate font-head text-[15px]">{e.member.name}</b>
					<span class="text-xs text-muted">{aiming ? pr.throw(aiming.price) : ''}</span>
				</button>
			</li>
		{/each}
	</ul>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => ((pickOpen = false), (aiming = null))}>{t.squad.cancel}</button>
	{/snippet}
</Dialog>

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
	.shop-prank {
		--r: #4fe05a;
	}
	.shop-highdemo {
		padding: 2px 10px 3px;
		border: 4px double #4fe05a;
		border-radius: 8px;
		background: rgb(4 30 8 / 0.82);
		color: #7dff6a;
		font-size: 14px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		transform: rotate(8deg);
		white-space: nowrap;
	}
	.shop-target {
		min-height: 48px;
	}
	.shop-target:hover {
		border-color: var(--t-accent);
	}
</style>
