<!--
	BurgiDrip, the clothing store (drip.ts; 2026-11-22, the user: "Bygg en klädesaffär också som man kan köpa och
	bära. Typ 100 olika plagg av massa coola hype-based grejer. Och så måste ta lite armors och sånt från World of
	Warcraft bara för att det är kul"). The fourth shop in the BurgiShop tab (ShopPage's doors): your operator
	in a fitting room wearing what you have on (tap a picture to try a piece on first), today's drop, the racks
	(tops, chains, kicks, hats, raid gear) and the item cards. Bought pieces are worn like BurgiShop's items (one
	per kind, squad.equipItem) and show on your header operator and squad card for everyone. Item names are in
	their rarity's colour, like loot in a fantasy MMO. Black and hype red in every theme.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import { dayKey, owns, sellValue, worn, ITEM_BY_ID, type ShopItem, type ShopSlot } from '#lib/shop.ts';
	import { dripDealOf, dripRarity, setBonus, setCount, DRIP_BY_ID, DRIP_DEFS, DRIP_RACKS, RAID_SETS, type DripDef, type DripRack, type RaidSet } from '#lib/drip.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import DripPic from './DripPic.svelte';
	import OpGear from './OpGear.svelte';
	import SquadAvatar from './SquadAvatar.svelte';

	const d = t.drip;
	/** a piece's rarity name: BurgiShop's four, plus BurgiDrip's own Ultimate */
	const rarityName = (r: DripDef['rarity']) => (r === 'ultimate' ? d.ultimate : t.shop.rarity[r]);
	const s = t.shop;
	/** Asks first above this price (like the Camo Armory). */
	const ASK_FROM = 1_000_000;
	const DRIP_WEAR: ShopSlot[] = ['top', 'neck', 'kicks', 'shoulders', 'hat'];
	let rack = $state<DripRack>('tops');
	let trying = $state<ShopItem | null>(null);
	/** an item waiting for "Cop it" / "Sell it" */
	let asking = $state<{ id: string; what: 'buy' | 'sell' } | null>(null);

	const me = $derived(squad.me);
	const balance = $derived(squad.myBank?.balance ?? 0);
	const mine = $derived(worn(squad.shop));
	const look = $derived(trying ? { ...mine, [trying.slot]: trying } : mine);
	const eq = $derived(squad.shop?.eq ?? {});
	const has = (id: string) => owns(squad.shop, id);
	const wearing = (id: string) => {
		const it = ITEM_BY_ID.get(id);
		return !!it && eq[it.slot] === id && has(id);
	};
	const price = (id: string) => squad.priceOf(id);

	const drop = $derived(dripDealOf(dayKey(squad.now)));
	const dropDef = $derived(DRIP_BY_ID.get(drop.id));
	const items = $derived(DRIP_DEFS.filter((x) => x.rack === rack));
	const ownedIn = (r: DripRack) => DRIP_DEFS.filter((x) => x.rack === r && has(x.id)).length;
	const allOwned = $derived(DRIP_DEFS.filter((x) => has(x.id)).length);
	/** the raid rack: the seven sets (chest, pauldrons, helm), then the odd pauldrons */
	const sets = $derived(
		(Object.keys(RAID_SETS) as RaidSet[]).map((set) => ({
			set,
			pieces: (['top', 'shoulders', 'hat'] as const).map((slot) => DRIP_DEFS.find((x) => x.set === set && x.draw.slot === slot)!).filter(Boolean)
		}))
	);
	const odd = $derived(DRIP_DEFS.filter((x) => x.rack === 'raid' && !x.set));
	/** what's worn from BurgiDrip, and the raid sets with a piece on */
	const wornDrip = $derived(DRIP_WEAR.map((sl) => look[sl]).filter((it): it is ShopItem => !!it?.drip));
	const lookIds = $derived({ top: look.top?.id ?? null, shoulders: look.shoulders?.id ?? null, hat: look.hat?.id ?? null });
	const bonus = $derived(setBonus(lookIds));
	const setLines = $derived((Object.keys(RAID_SETS) as RaidSet[]).map((set) => ({ set, n: setCount(set, lookIds) })).filter((x) => x.n > 0));
	const spent = $derived.by(() => {
		const sh = squad.shop;
		if (!sh) return 0;
		let n = 0;
		for (const def of DRIP_DEFS) n += (sh.own[def.id] ?? 0) - (sh.sold?.[def.id]?.back ?? 0);
		return n;
	});

	function tryOn(def: DripDef) {
		const it = ITEM_BY_ID.get(def.id) ?? null;
		trying = trying?.id === def.id ? null : it;
	}

	function buyIt(def: DripDef) {
		const p = price(def.id);
		if (p >= ASK_FROM && asking?.id !== def.id) {
			asking = { id: def.id, what: 'buy' };
			return;
		}
		asking = null;
		const r = squad.buyDrip(def.id);
		if (r === 'ok') {
			trying = null;
			toast.show(d.bought(def.name));
		} else if (r === 'broke') toast.show(d.broke(p, balance), undefined, 6000);
		else if (r === 'closed') toast.show(d.closed);
	}

	function sellIt(def: DripDef) {
		if (asking?.id !== def.id || asking.what !== 'sell') {
			asking = { id: def.id, what: 'sell' };
			return;
		}
		asking = null;
		const back = squad.sellItem(def.id);
		if (back > 0) toast.show(d.sold(def.name, back));
	}

	function wearIt(def: DripDef) {
		if (squad.equipItem(def.draw.slot, def.id)) {
			trying = null;
			toast.show(s.wornNow(def.name));
		}
	}

	function takeOff(def: DripDef) {
		if (squad.equipItem(def.draw.slot, null)) toast.show(s.takenOff(def.name));
	}

	function undress() {
		trying = null;
		let any = false;
		for (const sl of DRIP_WEAR) {
			const id = eq[sl];
			if (id && ITEM_BY_ID.get(id)?.drip) any = squad.equipItem(sl, null) || any;
		}
		if (any) toast.show(d.undressed);
	}

	function stateText(def: DripDef): string {
		return wearing(def.id) ? s.wearing : has(def.id) ? s.owned : d.buy(price(def.id));
	}
</script>

{#snippet card(def: DripDef)}
	{@const owned = has(def.id)}
	{@const on = wearing(def.id)}
	{@const p = price(def.id)}
	{@const isDrop = def.id === drop.id}
	<li class="drip-item rounded-card p-2.5" data-rarity={def.rarity} class:on>
		<button
			type="button"
			class="drip-try"
			data-slot={def.draw.slot}
			aria-pressed={trying?.id === def.id}
			aria-label={d.cardLabel(def.name, d.kind[def.draw.slot], rarityName(def.rarity), stateText(def))}
			onclick={() => tryOn(def)}
		>
			<DripPic id={def.id} />
			{#if isDrop}<span class="drip-drop-tag font-head" aria-hidden="true">{d.drop.badge} {d.drop.off(drop.off)}</span>{/if}
		</button>
		<p class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
			<b class="drip-name min-w-0 font-head text-[14px] font-bold" data-rarity={def.rarity}>{def.name}</b>
			<span class="drip-rarity font-head">{rarityName(def.rarity)}</span>
		</p>
		{#if def.set}<p class="drip-set font-head" style:--g={RAID_SETS[def.set].glow}>{RAID_SETS[def.set].name} · {d.piece[def.draw.slot]}</p>{/if}
		<div class="mt-2 flex flex-wrap items-center gap-1.5">
			{#if asking?.id === def.id}
				<span class="drip-ask w-full text-[12px]">{asking.what === 'buy' ? d.confirm(def.name, p) : d.sellAsk(def.name, sellValue(squad.shop, def.id))}</span>
				<button type="button" class="btn btn-sm drip-buy" onclick={() => (asking?.what === 'buy' ? buyIt(def) : sellIt(def))}>{asking.what === 'buy' ? d.yes : s.sell.yes}</button>
				<button type="button" class="btn btn-sm" onclick={() => (asking = null)}>{d.cancel}</button>
			{:else if !owned}
				<button type="button" class="btn btn-sm drip-buy" disabled={balance < p} title={balance < p ? d.broke(p, balance) : undefined} onclick={() => buyIt(def)}>{d.buy(p)}</button>
				{#if isDrop}<span class="drip-was num text-[11px]">{d.drop.was(def.price)}</span>{/if}
			{:else if on}
				<span class="drip-on font-head">✔ {s.wearing}</span>
				<button type="button" class="btn btn-sm" onclick={() => takeOff(def)}>{s.takeOff}</button>
			{:else}
				<button type="button" class="btn btn-sm drip-buy" onclick={() => wearIt(def)}>{s.wear}</button>
				{#if sellValue(squad.shop, def.id) > 0}<button type="button" class="btn btn-sm drip-sell" onclick={() => sellIt(def)}>{d.sell(sellValue(squad.shop, def.id))}</button>{/if}
			{/if}
		</div>
	</li>
{/snippet}

<div class="drip">
	<p class="max-w-3xl text-[13px] text-fg">{d.intro}</p>
	{#if !me?.op}<p class="mt-1 text-xs text-muted">{s.noOp}</p>{/if}

	<!-- the fitting room: your operator in what you wear (+ what you try on), the raid sets, today's drop -->
	<div class="drip-row mt-3 grid gap-3">
		<div class="drip-stage flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card px-4 py-4" class:bonus={!!bonus} style:--g={bonus ? RAID_SETS[bonus].glow : undefined}>
			<div class="drip-face">
				<OpGear aura={look.aura?.id} effect={look.effect?.id} badge={look.badge?.id} pet={look.pet?.id} pin={30}>
					<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={112} face={faceOf(look)} />
				</OpGear>
			</div>
			<div class="min-w-0 flex-1">
				<p class="font-hud text-[11px] tracking-[0.22em] uppercase drip-dim">{trying ? d.trying(trying.name) : d.wearingNow}</p>
				{#if wornDrip.length}
					<ul class="mt-1 flex flex-wrap gap-1">
						{#each wornDrip as it (it.id)}<li class="drip-chip font-head" data-rarity={dripRarity(it.id) ?? it.rarity}>{it.name}</li>{/each}
					</ul>
				{:else}
					<p class="mt-1 text-[12.5px] drip-dim">{d.nothing}</p>
				{/if}
				{#each setLines as l (l.set)}
					<p class="drip-setline mt-1 font-head" style:--g={RAID_SETS[l.set].glow}>{l.n === 3 ? d.setBonus(RAID_SETS[l.set].name) : d.setLine(RAID_SETS[l.set].name, l.n)}</p>
				{/each}
				<p class="mt-2 text-[11.5px] drip-dim">{d.owned(allOwned, DRIP_DEFS.length)} · {d.spent(spent)}</p>
				{#if wornDrip.length && !trying}<button type="button" class="btn btn-sm mt-2" onclick={undress}>{d.undress}</button>{/if}
			</div>
		</div>
		{#if dropDef}
			<div class="drip-dropbox rounded-card px-3 py-3">
				<p class="flex items-center justify-between gap-2 font-head text-[13px] font-black tracking-wide uppercase"><span>🔥 {d.drop.heading}</span><span class="drip-off">{d.drop.off(drop.off)}</span></p>
				<button type="button" class="drip-try drip-try-big mt-2" aria-pressed={trying?.id === dropDef.id} aria-label={d.cardLabel(dropDef.name, d.kind[dropDef.draw.slot], rarityName(dropDef.rarity), stateText(dropDef))} onclick={() => tryOn(dropDef)}>
					<DripPic id={dropDef.id} />
				</button>
				<p class="mt-2"><b class="drip-name font-head text-[15px]" data-rarity={dropDef.rarity}>{dropDef.name}</b></p>
				<p class="text-[12px] drip-dim"><span class="drip-strike num">{dropDef.price.toLocaleString('en-US')}</span> → <b class="num drip-now">{price(dropDef.id).toLocaleString('en-US')} 🍔</b> · {d.drop.ends}</p>
				<div class="mt-2">
					{#if has(dropDef.id)}
						<span class="drip-on font-head">✔ {wearing(dropDef.id) ? s.wearing : s.owned}</span>
					{:else}
						<button type="button" class="btn btn-sm drip-buy" disabled={balance < price(dropDef.id)} onclick={() => buyIt(dropDef)}>{d.buy(price(dropDef.id))}</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- the racks -->
	<div class="drip-racks mt-3 flex flex-wrap gap-1.5" role="group" aria-label={d.racksLabel}>
		{#each DRIP_RACKS as r (r)}
			<button type="button" class="chip drip-rack" data-rack={r} aria-pressed={rack === r} onclick={() => ((rack = r), (trying = null), (asking = null))}
				>{d.racks[r]} <span class="drip-count num">{ownedIn(r)}/{DRIP_DEFS.filter((x) => x.rack === r).length}</span></button
			>
		{/each}
	</div>
	<p class="mt-3 text-[13px] text-muted">{d.rackHint[rack]}</p>

	{#if rack === 'raid'}
		{#each sets as g (g.set)}
			<h3 class="drip-sethead mt-4 font-head" style:--g={RAID_SETS[g.set].glow}>{RAID_SETS[g.set].name}</h3>
			<ul class="drip-grid mt-2 grid gap-2">
				{#each g.pieces as def (def.id)}{@render card(def)}{/each}
			</ul>
		{/each}
		<h3 class="drip-sethead mt-4 font-head" style:--g="#ffd23a">{d.oddOnes}</h3>
		<ul class="drip-grid mt-2 grid gap-2">
			{#each odd as def (def.id)}{@render card(def)}{/each}
		</ul>
	{:else}
		<ul class="drip-grid mt-3 grid gap-2">
			{#each items as def (def.id)}{@render card(def)}{/each}
		</ul>
	{/if}
</div>

<style>
	/* black and hype red, the same in every theme; item names in their rarity's loot colour */
	.drip {
		--d-red: #ff2a3a;
		--q-common: #f2f2f2;
		--q-rare: #4aa8ff;
		--q-epic: #c47dff;
		--q-legendary: #ffa02a;
		--q-ultimate: #7dff3a;
	}
	.drip-row {
		grid-template-columns: minmax(0, 1fr);
	}
	@media (min-width: 900px) {
		.drip-row {
			grid-template-columns: minmax(0, 1fr) 260px;
		}
	}
	.drip-stage {
		background:
			radial-gradient(70% 120% at 18% 50%, rgb(255 42 58 / 0.22), transparent 62%),
			repeating-linear-gradient(135deg, rgb(255 255 255 / 0.025) 0 6px, transparent 6px 12px),
			linear-gradient(180deg, #1c1c20, #0c0c0e);
		box-shadow:
			inset 0 0 0 1.5px rgb(255 42 58 / 0.7),
			0 0 18px rgb(255 42 58 / 0.18);
		color: #fff;
	}
	.drip-stage.bonus {
		box-shadow:
			inset 0 0 0 2px var(--g),
			0 0 22px color-mix(in srgb, var(--g) 50%, transparent);
	}
	.drip-dim {
		color: #d6d6dc;
	}
	.drip-face {
		display: grid;
		place-items: center;
		width: 156px;
		height: 156px;
	}
	.drip-chip {
		padding: 1px 8px;
		border: 1px solid currentColor;
		border-radius: 999px;
		font-size: 11.5px;
		font-weight: 700;
		background: rgb(0 0 0 / 0.35);
	}
	.drip-chip[data-rarity='common'],
	.drip-name[data-rarity='common'] {
		color: var(--q-common);
	}
	.drip-chip[data-rarity='rare'],
	.drip-name[data-rarity='rare'] {
		color: var(--q-rare);
	}
	.drip-chip[data-rarity='epic'],
	.drip-name[data-rarity='epic'] {
		color: var(--q-epic);
	}
	.drip-chip[data-rarity='legendary'],
	.drip-name[data-rarity='legendary'] {
		color: var(--q-legendary);
	}
	.drip-name {
		text-shadow: 0 1px 0 rgb(0 0 0 / 0.8);
	}
	/* Ultimate (the Kush Crown): glowing neon green, above Legendary */
	.drip-chip[data-rarity='ultimate'],
	.drip-name[data-rarity='ultimate'] {
		color: var(--q-ultimate);
		text-shadow:
			0 1px 0 rgb(0 0 0 / 0.8),
			0 0 6px rgb(125 255 58 / 0.85),
			0 0 14px rgb(125 255 58 / 0.5);
	}
	.drip-setline {
		color: var(--g);
		font-size: 12.5px;
		font-weight: 800;
		text-shadow: 0 0 8px color-mix(in srgb, var(--g) 60%, transparent);
	}
	/* today's drop: a sticker-red box */
	.drip-dropbox {
		background:
			radial-gradient(90% 80% at 50% 30%, rgb(255 42 58 / 0.3), transparent 70%),
			linear-gradient(180deg, #2a0a0e, #120406);
		box-shadow: inset 0 0 0 1.5px var(--d-red);
		color: #fff;
	}
	.drip-off {
		padding: 1px 8px;
		border-radius: 4px;
		background: var(--d-red);
		color: #fff;
		font-style: italic;
	}
	.drip-strike {
		text-decoration: line-through;
		opacity: 0.75;
	}
	.drip-now {
		color: #ffe27a;
	}
	.drip-racks .drip-rack[aria-pressed='true'] {
		border-color: var(--d-red);
		background: var(--d-red);
		color: #fff;
		box-shadow: 0 0 10px rgb(255 42 58 / 0.45);
	}
	.drip-rack[data-rack='raid'][aria-pressed='true'] {
		border-color: var(--q-epic);
		background: linear-gradient(180deg, #7a3ad8, #3a1478);
		box-shadow: 0 0 10px rgb(196 125 255 / 0.5);
	}
	.drip-count {
		margin-left: 4px;
		font-size: 10.5px;
		opacity: 0.8;
	}
	.drip-sethead {
		color: var(--g);
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		text-shadow:
			0 1px 0 rgb(0 0 0 / 0.9),
			0 0 10px color-mix(in srgb, var(--g) 55%, transparent);
	}
	.drip-grid {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
	}
	.drip-item {
		--r: #8a8a92;
		display: flex;
		flex-direction: column;
		border: 1px solid color-mix(in srgb, var(--r) 65%, transparent);
		background: linear-gradient(180deg, rgb(30 30 34 / 0.95), rgb(12 12 14 / 0.96));
		color: #fff;
	}
	.drip-item[data-rarity='rare'] {
		--r: var(--q-rare);
	}
	.drip-item[data-rarity='epic'] {
		--r: var(--q-epic);
	}
	.drip-item[data-rarity='legendary'] {
		--r: var(--q-legendary);
		box-shadow: 0 0 12px rgb(255 160 42 / 0.22);
	}
	.drip-item[data-rarity='ultimate'] {
		--r: var(--q-ultimate);
		border-width: 2px;
		background:
			radial-gradient(120% 70% at 50% 0%, rgb(125 255 58 / 0.2), transparent 70%),
			linear-gradient(180deg, rgb(18 34 16 / 0.97), rgb(6 12 6 / 0.98));
		animation: drip-ultimate 2.6s ease-in-out infinite;
	}
	.drip-item[data-rarity='ultimate'] .drip-rarity {
		background: linear-gradient(90deg, #2fd36a, #d8ff6a, #2fd36a);
		color: #0a2a0a;
		font-weight: 900;
	}
	@keyframes drip-ultimate {
		0%,
		100% {
			box-shadow:
				0 0 10px rgb(125 255 58 / 0.35),
				inset 0 0 8px rgb(125 255 58 / 0.15);
		}
		50% {
			box-shadow:
				0 0 22px rgb(125 255 58 / 0.7),
				inset 0 0 14px rgb(125 255 58 / 0.3);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.drip-item[data-rarity='ultimate'] {
			animation: none;
			box-shadow: 0 0 16px rgb(125 255 58 / 0.55);
		}
	}
	.drip-item.on {
		box-shadow: 0 0 0 2px var(--d-red);
	}
	.drip-try {
		position: relative;
		display: grid;
		place-items: center;
		height: 96px;
		padding: 6px;
		border-radius: 10px;
		background:
			radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--r) 26%, transparent), transparent 70%),
			rgb(0 0 0 / 0.35);
		overflow: hidden;
	}
	.drip-try-big {
		width: 100%;
		height: 120px;
		--r: var(--d-red);
	}
	.drip-try[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px var(--r);
	}
	.drip-drop-tag {
		position: absolute;
		top: 5px;
		right: 5px;
		padding: 0 5px;
		border-radius: 4px;
		background: var(--d-red);
		color: #fff;
		font-size: 9.5px;
		font-weight: 900;
		font-style: italic;
		letter-spacing: 0.06em;
	}
	.drip-rarity {
		padding: 0 6px;
		border: 1px solid var(--r);
		border-radius: 999px;
		color: #fff;
		font-size: 9.5px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.drip-set {
		margin-top: 2px;
		color: var(--g);
		font-size: 11px;
		font-weight: 700;
	}
	.drip-buy {
		border-color: #ff8a94;
		background: linear-gradient(180deg, #ff3a4a, #b8101e);
		color: #fff;
		font-weight: 800;
		text-shadow: 0 1px 0 rgb(60 0 8 / 0.7);
	}
	.drip-buy:disabled {
		background: rgb(255 255 255 / 0.08);
		border-color: rgb(255 255 255 / 0.25);
		color: #c8c8ce;
		text-shadow: none;
	}
	.drip-sell {
		font-size: 11px;
	}
	.drip-was {
		color: #d6d6dc;
		text-decoration: line-through;
	}
	.drip-ask {
		color: #ffe27a;
	}
	.drip-on {
		color: #7dff9a;
		font-size: 12px;
		font-weight: 800;
	}
	.drip-item :global(.text-muted) {
		color: #c8c8ce;
	}
</style>
