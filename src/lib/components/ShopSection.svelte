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
	import { faceOf, noseOf } from '#lib/faceGear.ts';
	import {
		boxPool,
		buyable,
		dayKey,
		dealOf,
		owns as ownsItem,
		pranksOn,
		sellValue,
		shopSpent,
		statueOf,
		trophies,
		worn,
		AD_HOURS,
		AD_MAX,
		AD_PRICE,
		BOX_PRICE,
		COLLECTION_420,
		FIT_COUNT,
		ITEM_BY_ID,
		PRANKS,
		SHOP_ITEMS,
		SLOTS,
		STATUE_PRICE,
		type Rarity,
		type ShopItem,
		type ShopSlot
	} from '#lib/shop.ts';
	import { sound } from '#lib/sound.svelte.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import ShopTrophies from './ShopTrophies.svelte';
	import Dialog from './Dialog.svelte';
	import MaxFx from './MaxFx.svelte';
	import OpGear from './OpGear.svelte';
	import ShopPin from './ShopPin.svelte';
	import SquadAvatar from './SquadAvatar.svelte';
	import WeedCreature from './WeedCreature.svelte';
	import WinPose from './WinPose.svelte';

	const s = t.shop;
	const pr = t.pranks;
	/** kinds drawn on the face (shown on a bigger operator on their item cards) */
	const FACE_SLOTS: ShopSlot[] = ['mouth', 'eyes', 'hat', 'smoke', 'emote', 'entry'];
	/** the newest kinds get a small NEW tag on their button (the ideas pack, 2026-11-20) */
	const NEW_SLOTS: string[] = ['entry', 'trail', 'sound', 'feed', 'shelf', 'throne', 'box', 'ad'];
	type Kind = ShopSlot | 'statue' | 'pranks' | 'box' | 'ad';
	let slot = $state<Kind>('aura');
	/** The kinds in groups (the makeover, 2026-11-20); a kind added later without a group lands with the first. */
	const GROUPED: { key: keyof typeof s.groups; slots: Kind[] }[] = [
		{ key: 'op', slots: ['aura', 'effect', 'badge', 'mouth', 'eyes', 'hat', 'smoke', 'pet', 'back', 'emote'] },
		{ key: 'name', slots: ['name', 'title'] },
		{ key: 'squad', slots: ['card', 'radio', 'table', 'win', 'maxfx', 'buddy'] },
		{ key: 'show', slots: ['entry', 'trail', 'sound', 'feed', 'shelf', 'throne'] },
		{ key: 'special', slots: ['box', 'statue', 'ad', 'pranks'] }
	];
	const placed = new Set(GROUPED.flatMap((g) => g.slots));
	const groups = GROUPED.map((g, i) => (i === 0 ? { ...g, slots: [...g.slots, ...SLOTS.filter((x) => !placed.has(x))] } : g));
	/** The prank waiting for a target (the "who gets it?" dialog). */
	let aiming = $state<(typeof PRANKS)[number] | null>(null);
	let pickOpen = $state(false);
	const others = $derived(squad.entries.filter((e) => !e.mine));
	const members = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])));
	/** someone in a Gas Mask can't be pranked (and you can't put a second one on) */
	const maskedIds = $derived(new Set(squad.entries.filter((e) => pranksOn(e.id, members, squad.now).mask).map((e) => e.id)));
	const myMask = $derived(!!squad.me && maskedIds.has(squad.me.id));
	/** whose Golden Statue stands */
	const stand = $derived(statueOf(members));
	const standName = $derived(stand ? (members[stand.id]?.name ?? '?') : '');
	const standMine = $derived(!!stand && stand.id === squad.me?.id);

	function aim(p: (typeof PRANKS)[number]) {
		if (balance < p.price) {
			toast.show(s.broke(p.price, balance), undefined, 5000);
			return;
		}
		if (p.self) {
			// the Gas Mask: on yourself, no target to pick
			const me = squad.me;
			if (!me) return;
			const r = squad.prank(p.id, me.id, me.name);
			if (r === 'ok') toast.show(pr.maskPut);
			else if (r === 'broke') toast.show(s.broke(p.price, balance), undefined, 5000);
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
		else if (r === 'masked') toast.show(pr.maskedLong(name), undefined, 5000);
		aiming = null;
	}

	function putUpStatue() {
		const r = squad.buyStatue();
		if (r === 'ok') toast.show(s.statue.bought);
		else if (r === 'broke') toast.show(s.broke(STATUE_PRICE, balance), undefined, 5000);
	}
	/** An item being tried on (shown on the preview only). */
	let trying = $state<ShopItem | null>(null);

	const balance = $derived(squad.myBank?.balance ?? 0);
	const mine = $derived(worn(squad.shop));
	const look = $derived(trying ? { ...mine, [trying.slot]: trying } : mine);
	// secret rewards show only once owned (a locked card stands in for the 420 ones)
	const items = $derived(SHOP_ITEMS.filter((i) => i.slot === slot && (!i.secret || owns(i.id))));
	const owns = (id: string) => ownsItem(squad.shop, id);
	const wearing = (it: ShopItem) => squad.shop?.eq[it.slot] === it.id;
	const me = $derived(squad.me);
	const sample = $derived((me?.name ?? 'Abscar').toUpperCase());

	// ---------- the 18-ideas pack (2026-11-21) ----------
	/** today's deal (the same for the whole squad, from the date) */
	const deal = $derived(dealOf(dayKey(squad.now)));
	const dealItem = $derived(ITEM_BY_ID.get(deal.id)!);
	const priceNow = (it: ShopItem) => squad.priceOf(it.id);
	const canBuy = (it: ShopItem) => buyable(it, squad.now);
	/** the 420 collection's progress (the locked reward card) */
	const have420 = $derived(COLLECTION_420.filter((id) => owns(id)).length);
	const legend = $derived(owns('title-420legend'));
	const myTrophies = $derived(trophies(squad.shop));
	/** an entrance on its item card replays every few seconds */
	let entryBeat = $state(1);
	$effect(() => {
		if (slot !== 'entry') return;
		const timer = setInterval(() => (entryBeat += 1), 3600);
		return () => clearInterval(timer);
	});

	// outfits
	const fits = $derived(squad.shop?.fits?.l ?? []);
	function saveFit(i: number) {
		if (squad.saveFit(i)) toast.show(s.fits.saved(i + 1));
	}
	function wearFit(i: number) {
		if (squad.wearFit(i)) toast.show(s.fits.worn(i + 1));
	}

	// selling
	let selling = $state<ShopItem | null>(null);
	let sellOpen = $state(false);
	function askSell(it: ShopItem) {
		selling = it;
		sellOpen = true;
	}
	function confirmSell() {
		const it = selling;
		sellOpen = false;
		selling = null;
		if (!it) return;
		const back = squad.sellItem(it.id);
		if (back > 0) toast.show(s.sell.done(it.name, back));
		else toast.show(s.sell.no);
	}

	// gifts
	let gifting = $state<ShopItem | null>(null);
	let giftOpen = $state(false);
	const hasIt = (memberShop: unknown, id: string) => ownsItem(memberShop as Parameters<typeof ownsItem>[0], id);
	function askGift(it: ShopItem) {
		gifting = it;
		giftOpen = true;
	}
	function sendGift(id: string, name: string) {
		const it = gifting;
		giftOpen = false;
		gifting = null;
		if (!it) return;
		const r = squad.giveItem(it.id, id, name);
		if (r === 'ok') toast.show(s.gift.sent(it.name, name));
		else if (r === 'broke') toast.show(s.broke(priceNow(it), balance), undefined, 5000);
		else if (r === 'owned') toast.show(s.gift.has);
	}

	// Munchie Boxes
	const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];
	let boxOpen = $state(false);
	let boxRarity = $state<Rarity>('common');
	let boxResult = $state<{ id: string; dup: boolean; back: number } | null>(null);
	let boxRevealed = $state(false);
	let boxTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(boxTimer));
	function openBox(r: Rarity) {
		const res = squad.openBox(r);
		if (res === 'broke') {
			toast.show(s.broke(BOX_PRICE[r], balance), undefined, 5000);
			return;
		}
		if (res === 'off') return;
		boxRarity = r;
		boxResult = res;
		boxRevealed = false;
		boxOpen = true;
		clearTimeout(boxTimer);
		const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		boxTimer = setTimeout(() => (boxRevealed = true), reduce ? 50 : 1400);
	}
	const boxItem = $derived(boxResult ? ITEM_BY_ID.get(boxResult.id) : undefined);

	// the ad space
	let adText = $state('');
	const adNow = $derived(squad.ad);
	function runAd() {
		const r = squad.buyAd(adText);
		if (r === 'ok') {
			adText = '';
			toast.show(s.ad.bought);
		} else if (r === 'empty') toast.show(s.ad.empty);
		else if (r === 'broke') toast.show(s.broke(AD_PRICE, balance), undefined, 5000);
	}

	function tryOn(it: ShopItem) {
		trying = trying?.id === it.id ? null : it;
		if (it.slot === 'sound') sound.preview(it.id);
	}

	function buyIt(it: ShopItem) {
		const r = squad.buyItem(it.id);
		if (r === 'ok') {
			trying = null;
			toast.show(s.bought(it.name));
		} else if (r === 'broke') toast.show(s.broke(priceNow(it), balance), undefined, 5000);
		else if (r === 'closed') toast.show(s.closed);
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
		return wearing(it) ? s.wearing : owns(it.id) ? s.owned : s.buy(priceNow(it));
	}
</script>

{#snippet face(l: Partial<Record<ShopSlot, ShopItem>>, size: number, pin: number, play = false)}
	<!-- `play`: an emote in `l` plays over and over (item cards, or the preview while trying one on); an entrance replays every few seconds -->
	<OpGear
		aura={l.aura?.id}
		effect={l.effect?.id}
		badge={l.badge?.id}
		pet={l.pet?.id}
		{pin}
		extra={{
			back: l.back?.id,
			hold: l.hold?.id,
			mount: l.mount?.id,
			plush: l.plush?.id,
			emote: play && l.emote ? { k: l.emote.id, at: 1 } : null,
			loop: true,
			throne: !!l.throne,
			entry: play && l.entry ? { k: l.entry.id, at: entryBeat } : null
		}}
	>
		<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} {size} face={faceOf(l)} />
	</OpGear>
{/snippet}

{#snippet price(it: ShopItem)}
	{@const now = priceNow(it)}
	{s.buy(now)}{#if now < it.price}<s class="shop-was">{it.price.toLocaleString('en-US')}</s>{/if}
{/snippet}

<div class="shop">
	<p class="shop-intro max-w-3xl text-[13px] text-fg">{s.intro}</p>
	{#if !me?.op}<p class="mt-1 text-xs text-muted">{s.noOp}</p>{/if}

	<!-- the fitting room: your operator, wearing what you have on (+ what you're trying on) -->
	<div class="shop-stage relative mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 overflow-hidden rounded-card px-4 py-4">
		<span class="st-rays" aria-hidden="true"></span>
		<span class="st-blob" data-n="1" aria-hidden="true"></span>
		<span class="st-blob" data-n="2" aria-hidden="true"></span>
		<span class="st-blob" data-n="3" aria-hidden="true"></span>
		<div class="shop-face relative"><span class="st-floor" aria-hidden="true"></span>{@render face(look, 96, 30, trying?.slot === 'emote')}</div>
		<div class="relative min-w-0">
			<p class="st-label font-head">✦ {s.fittingRoom} ✦</p>
			<p class="font-hud text-[11px] tracking-[0.22em] text-muted uppercase">{trying ? `${s.tryOn}: ${trying.name}` : s.preview}</p>
			<p class="og-name font-head text-2xl leading-tight font-bold tracking-[0.2em] uppercase" data-style={look.name?.id}>{sample}</p>
			{#if look.title}<span class="og-title" data-rarity={look.title.rarity}>{look.title.text}</span>{/if}
			<p class="mt-2 text-[11px] text-muted">{s.spent(shopSpent(squad.shop))} · {s.toHouse}</p>
		</div>
		<!-- three saved outfits -->
		<div class="shop-fits relative w-full">
			<p class="sk-head font-head">{s.fits.heading}</p>
			<div class="fit-row">
				{#each Array.from({ length: FIT_COUNT }, (_, i) => i) as i (i)}
					{@const f = fits[i]}
					<div class="shop-fit" data-fit={i + 1}>
						<span class="font-head text-[12px] font-bold">{s.fits.slot(i + 1)}</span>
						<button type="button" class="btn btn-sm" disabled={!f} onclick={() => wearFit(i)}>{f ? s.fits.wear : s.fits.empty}</button>
						<button type="button" class="btn btn-sm" onclick={() => saveFit(i)}>{f ? s.fits.saveOver : s.fits.save}</button>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- today's deal: one item a day for the whole squad -->
	{#if dealItem}
		{@const dOwned = owns(dealItem.id)}
		<div class="shop-deal mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card p-3" data-rarity={dealItem.rarity}>
			<span class="deal-badge font-head" aria-hidden="true">{s.deal.off(deal.off)}</span>
			<div class="min-w-[11rem] flex-1">
				<p class="deal-head font-head">🏷️ {s.deal.heading}</p>
				<p class="flex flex-wrap items-baseline gap-x-2">
					<b class="font-head text-[17px] font-bold">{dealItem.name}</b>
					<span class="text-[12px] text-muted">{s.slots[dealItem.slot]} · {s.rarity[dealItem.rarity]}</span>
				</p>
				<p class="text-[11px] text-muted">{s.deal.was(dealItem.price)} · {s.deal.ends}</p>
			</div>
			<div class="flex flex-wrap gap-1.5">
				<button type="button" class="btn btn-sm" onclick={() => ((slot = dealItem.slot), (trying = dealItem))}>{s.deal.tryOn}</button>
				{#if dOwned}
					<span class="shop-owned self-center text-[12px] text-muted">✔ {s.owned}</span>
				{:else}
					<button type="button" class="btn btn-sm btn-primary" disabled={balance < priceNow(dealItem)} onclick={() => buyIt(dealItem)}>{@render price(dealItem)}</button>
				{/if}
				{#if others.length}<button type="button" class="btn btn-sm" onclick={() => askGift(dealItem)}>{s.gift.button}</button>{/if}
			</div>
		</div>
	{/if}

	<!-- the kinds, in four groups (icons come from CSS so the buttons' words stay just the kind) -->
	<div class="shop-kinds mt-4 grid gap-3" role="group" aria-label={s.slotsLabel}>
		{#each groups as g (g.key)}
			<div class="sk-group" data-group={g.key}>
				<p class="sk-head font-head">{s.groups[g.key]}</p>
				<div class="flex flex-wrap gap-1.5">
					{#each g.slots as sl (sl)}
						<button type="button" class="chip sk-chip" data-slot={sl} aria-pressed={slot === sl} onclick={() => ((slot = sl), (trying = null))}
							>{s.slots[sl]}{#if NEW_SLOTS.includes(sl)}<span class="shop-new font-head">{s.newTag}</span>{/if}</button
						>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	{#if slot === 'statue'}
		<!-- the Golden Statue: one stands in the Squad tab, whoever put one up last -->
		<div class="shop-statue mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-card border p-3" data-rarity="legendary">
			<span class="shop-statue-pic" aria-hidden="true">
				<span class="shop-statue-gold"><SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={72} face={faceOf(mine)} /></span>
				<span class="shop-statue-plinth"></span>
			</span>
			<div class="min-w-[12rem] flex-1">
				<p class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<b class="font-head text-[15px] font-bold">{s.statue.name}</b>
					<span class="shop-rarity font-head">{s.rarity.legendary}</span>
				</p>
				<p class="mt-1 text-[13px] text-muted">{s.statue.what}</p>
				<p class="shop-statue-now mt-1.5 text-[13px]">{standMine ? s.statue.standing : stand ? s.statue.theirs(standName) : s.statue.none}</p>
				<button type="button" class="btn btn-sm btn-primary mt-2" disabled={standMine || balance < STATUE_PRICE} onclick={putUpStatue}
					>{standMine ? `✔ ${s.statue.standing}` : s.statue.buy(STATUE_PRICE)}</button
				>
			</div>
		</div>
	{:else if slot === 'box'}
		<!-- Munchie Boxes: a random item of the box's rarity -->
		<p class="mt-3 text-[13px] text-muted">{s.box.intro}</p>
		<ul class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-2">
			{#each RARITIES as r (r)}
				<li class="shop-box rounded-card border border-line bg-panel-2 p-3" data-rarity={r}>
					<span class="box-pic" aria-hidden="true"><span class="box-lid"></span><span class="box-body"><span class="box-q font-head">?</span></span></span>
					<p class="mt-2 font-head text-[14px] font-bold">{s.box.name(s.rarity[r])}</p>
					<p class="text-[11px] text-muted">{boxPool(r).length} items</p>
					<button type="button" class="btn btn-sm btn-primary mt-2" disabled={balance < BOX_PRICE[r]} onclick={() => openBox(r)}>{s.box.open(BOX_PRICE[r])}</button>
				</li>
			{/each}
		</ul>
		{#if squad.shop?.boxes}<p class="mt-2 text-[11px] text-muted">{s.box.opened(squad.shop.boxes.n)}</p>{/if}
	{:else if slot === 'ad'}
		<!-- the ad space on the tickers -->
		<div class="shop-ad mt-3 grid gap-2 rounded-card border border-line bg-panel-2 p-3">
			<p class="text-[13px] text-muted">{s.ad.intro(AD_HOURS)}</p>
			{#if adNow}
				<p class="text-[13px]">{s.ad.now(adNow.name)} <b class="ad-now font-head">{adNow.t}</b></p>
			{:else}
				<p class="text-[13px] text-muted">{s.ad.none}</p>
			{/if}
			<div class="flex flex-wrap gap-2">
				<input class="field min-w-0 flex-1" type="text" maxlength={AD_MAX} bind:value={adText} placeholder={s.ad.placeholder} aria-label={s.ad.label} />
				<button type="button" class="btn btn-primary" disabled={balance < AD_PRICE || !adText.trim()} onclick={runAd}>{s.ad.buy(AD_PRICE)}</button>
			</div>
		</div>
	{:else if slot === 'pranks'}
		<!-- pranks: bought per throw, aimed at a friend (the Gas Mask goes on yourself) -->
		<p class="mt-3 text-[13px] text-muted">{pr.intro}</p>
		<ul class="mt-2 grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-2">
			{#each PRANKS as p (p.id)}
				<li class="shop-item shop-prank rounded-card border border-line bg-panel-2 p-3" data-prank={p.id}>
					<div class="shop-try" aria-hidden="true">
						{#if p.id === 'smoke-bomb'}
							<OpGear smoked><SquadAvatar name="?" op={me?.op ?? undefined} size={46} /></OpGear>
						{:else if p.id === 'clown'}
							<OpGear extra={{ nose: noseOf(me?.op ?? 'initials') }}><SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={46} /></OpGear>
						{:else if p.id === 'slacker'}
							<span class="shop-slackdemo font-head">{t.operator.slacker}</span>
						{:else if p.id === 'mask'}
							<OpGear extra={{ masked: true }} pin={22}><SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={46} /></OpGear>
						{:else if p.id === 'flip'}
							<OpGear extra={{ flip: true }}><SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={46} /></OpGear>
						{:else if p.id === 'burgerhead'}
							<OpGear extra={{ burgerHead: true }}><SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={46} /></OpGear>
						{:else if p.id === 'mmmph'}
							<span class="shop-radiodemo font-hud"
								><span class="radio-line"><span class="radio-text"><span class="radio-name font-bold">{others[0]?.member.name ?? 'Ingman'}</span>: {pr.mmmph(30)}</span></span></span
							>
						{:else if p.id === 'confetti'}
							<span class="shop-confdemo">{#each Array.from({ length: 14 }, (_, i) => i) as i (i)}<i style:--i={i}></i>{/each}</span>
						{:else}
							<span class="shop-highdemo font-head">{pr.stamp}</span>
						{/if}
					</div>
					<p class="mt-2 font-head text-[14px] font-bold">{pr.names[p.id]}</p>
					<p class="mt-1 text-xs text-muted">{pr.what[p.id]}</p>
					{#if p.self}
						<button type="button" class="btn btn-sm btn-primary mt-2" disabled={myMask || balance < p.price} onclick={() => aim(p)}>{myMask ? `🛡️ ${pr.maskOn}` : pr.putOn(p.price)}</button>
					{:else}
						<button type="button" class="btn btn-sm btn-primary mt-2" disabled={!others.length || balance < p.price} onclick={() => aim(p)}>{pr.throw(p.price)}</button>
					{/if}
				</li>
			{/each}
		</ul>
		{#if !others.length}<p class="mt-2 text-xs text-muted">{pr.nobody}</p>{/if}
	{:else}
	{#if s.slotHint[slot]}<p class="shop-hint mt-3 text-[13px] text-muted">{s.slotHint[slot]}</p>{/if}
	<!-- the items -->
	<ul class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-2">
		{#if (slot === 'title' || slot === 'aura') && !legend}
			<!-- the secret 420 reward, locked until the whole collection is owned -->
			<li class="shop-item shop-locked rounded-card border border-line bg-panel-2 p-2.5" data-rarity="legendary">
				<span class="shop-try locked-pic font-head" aria-hidden="true"><span>🔒</span> ???</span>
				<p class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<span class="min-w-0 font-head text-[14px] font-bold">{s.collector.locked}</span>
					<span class="shop-rarity font-head">{s.rarity.legendary}</span>
				</p>
				<p class="mt-1 text-[11px] text-muted">{s.collector.how(have420, COLLECTION_420.length)}</p>
				<span class="locked-bar mt-1.5" aria-hidden="true"><i style:width="{(have420 / COLLECTION_420.length) * 100}%"></i></span>
			</li>
		{/if}
		{#each items as it (it.id)}
			{@const owned = owns(it.id)}
			{@const on = wearing(it)}
			{@const isDeal = it.id === deal.id}
			{@const open = canBuy(it)}
			{@const back = owned ? sellValue(squad.shop, it.id) : 0}
			<li class="shop-item rounded-card border border-line bg-panel-2 p-2.5" data-rarity={it.rarity} class:on class:deal={isDeal}>
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
					{:else if it.slot === 'card'}
						<!-- a little squad card wearing the camo -->
						<span class="shop-carddemo camo-card" data-card={it.id}
							><SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={30} /><span class="font-head font-bold">{me?.name ?? 'Abscar'}</span></span
						>
					{:else if it.slot === 'radio'}
						<!-- one of your lines in the squad radio -->
						<span class="shop-radiodemo font-hud"
							><span class="radio-line" data-style={it.id}><span class="radio-text"><span class="radio-name font-bold">{me?.name ?? 'Abscar'}</span>: {s.radioSample}</span></span></span
						>
					{:else if it.slot === 'table'}
						<!-- your chip and two cards at the table -->
						<span class="shop-bjdemo">
							<span class="shop-bjchip num font-head">100</span>
							<span class="shop-bjcard font-head">A<br />♠</span><span class="shop-bjcard red font-head">K<br />♥</span>
						</span>
					{:else if it.slot === 'win'}
						<span class="shop-windemo"><WinPose force size={40} /><span class="wd-word font-head">{s.winSample}</span></span>
					{:else if it.slot === 'maxfx'}
						<!-- a weapon row with the effect playing over it -->
						<span class="shop-maxdemo font-head">{s.maxSample} <span class="text-hb-ink">◆</span><MaxFx kind={it.id} loop /></span>
					{:else if it.slot === 'buddy'}
						<WeedCreature class="block size-20 overflow-visible" outfit={it.id} />
					{:else if it.slot === 'trail'}
						<!-- a little trail drifting after a pointer -->
						<span class="shop-traildemo" data-trail={it.id}>{#each Array.from({ length: 7 }, (_, i) => i) as i (i)}<i style:--i={i}></i>{/each}<span class="td-ptr"></span></span>
					{:else if it.slot === 'sound'}
						<span class="shop-sounddemo font-head"><span class="sd-spk"></span>{trying?.id === it.id ? '♪ ♫ ♪' : `▶ ${s.soundSample}`}</span>
					{:else if it.slot === 'feed'}
						<span class="shop-feeddemo kill-row" data-feed={it.id} data-camo="gold"
							><span class="kill-player">{sample}</span><span class="kill-camo">{s.feedSample}</span><span class="kill-weapon">{s.maxSample}</span></span
						>
					{:else if it.slot === 'shelf'}
						<ShopTrophies shelf={it.id} got={myTrophies} sample />
					{:else if it.slot === 'throne'}
						{@render face({ throne: it }, 52, 18)}
					{:else if FACE_SLOTS.includes(it.slot)}
						<!-- bigger, so the thing on the face reads (emotes play over and over) -->
						{@render face({ [it.slot]: it }, 64, 18, true)}
					{:else}
						{@render face({ [it.slot]: it }, 46, 18)}
					{/if}
				</button>
				<p class="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
					<b class="min-w-0 font-head text-[14px] font-bold">{it.name}</b>
					<span class="shop-rarity font-head">{s.rarity[it.rarity]}</span>
					{#if isDeal && !owned}<span class="shop-dealtag font-head">{s.deal.badge} {s.deal.off(deal.off)}</span>{/if}
					{#if it.window}<span class="shop-season font-head">{s.holiday[it.window]}</span>{/if}
					{#if it.secret}<span class="shop-season font-head">{s.collector.reward}</span>{/if}
				</p>
				{#if it.grants?.length}<p class="mt-1 text-[11px] text-muted">{s.grants(ITEM_BY_ID.get(it.grants[0])?.text ?? '')}</p>{/if}
				<div class="mt-2 flex flex-wrap gap-1.5">
					{#if !owned}
						{#if open}
							<button type="button" class="btn btn-sm btn-primary" disabled={balance < priceNow(it)} title={balance < priceNow(it) ? s.broke(priceNow(it), balance) : undefined} onclick={() => buyIt(it)}
								>{@render price(it)}</button
							>
							{#if others.length}<button type="button" class="btn btn-sm" onclick={() => askGift(it)}>{s.gift.button}</button>{/if}
						{:else if it.window}
							<span class="shop-owned text-[11px] text-muted">{s.holiday.soon[it.window]}</span>
						{/if}
					{:else if on}
						<span class="shop-on font-head">✔ {s.wearing}</span>
						<button type="button" class="btn btn-sm" onclick={() => takeOff(it)}>{s.takeOff}</button>
					{:else}
						<button type="button" class="btn btn-sm btn-primary" onclick={() => wearIt(it)}>{s.wear}</button>
						<span class="shop-owned text-[11px] text-muted">{s.owned}</span>
					{/if}
					{#if owned && back > 0}<button type="button" class="btn btn-sm shop-sell" onclick={() => askSell(it)}>{s.sell.button(back)}</button>{/if}
					{#if owned && open && others.length}<button type="button" class="btn btn-sm" onclick={() => askGift(it)}>{s.gift.button}</button>{/if}
				</div>
			</li>
		{/each}
	</ul>
	{/if}
</div>

<Dialog bind:open={pickOpen} title={aiming ? `${pr.names[aiming.id]} · ${pr.pick}` : pr.pick}>
	<ul class="grid gap-1.5">
		{#each others as e (e.id)}
			{@const masked = maskedIds.has(e.id)}
			<li>
				<button
					type="button"
					class="shop-target flex w-full items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-left"
					disabled={masked}
					title={masked ? pr.maskedLong(e.member.name) : undefined}
					onclick={() => fire(e.id, e.member.name)}
				>
					<SquadAvatar name={e.member.name} op={e.member.op} size={34} />
					<b class="min-w-0 flex-1 truncate font-head text-[15px]">{e.member.name}</b>
					<span class="text-xs text-muted">{masked ? `🛡️ ${pr.masked}` : aiming ? pr.throw(aiming.price) : ''}</span>
				</button>
			</li>
		{/each}
	</ul>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => ((pickOpen = false), (aiming = null))}>{t.squad.cancel}</button>
	{/snippet}
</Dialog>

<!-- selling back -->
<Dialog bind:open={sellOpen} title={selling?.name ?? ''}>
	<p class="text-sm">{selling ? s.sell.ask(selling.name, sellValue(squad.shop, selling.id)) : ''}</p>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => ((sellOpen = false), (selling = null))}>{t.squad.cancel}</button>
		<button type="button" class="btn btn-primary" onclick={confirmSell}>{s.sell.yes}</button>
	{/snippet}
</Dialog>

<!-- giving an item to a friend -->
<Dialog bind:open={giftOpen} title={gifting ? `${gifting.name} · ${s.gift.pick}` : s.gift.pick}>
	<ul class="grid gap-1.5">
		{#each others as e (e.id)}
			{@const has = !!gifting && hasIt(e.member.shop, gifting.id)}
			<li>
				<button
					type="button"
					class="shop-target flex w-full items-center gap-2.5 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5 text-left"
					disabled={has || !gifting || balance < priceNow(gifting)}
					onclick={() => sendGift(e.id, e.member.name)}
				>
					<SquadAvatar name={e.member.name} op={e.member.op} size={34} />
					<b class="min-w-0 flex-1 truncate font-head text-[15px]">{e.member.name}</b>
					<span class="text-xs text-muted">{has ? `✔ ${s.gift.has}` : gifting ? s.gift.send(priceNow(gifting)) : ''}</span>
				</button>
			</li>
		{/each}
	</ul>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => ((giftOpen = false), (gifting = null))}>{t.squad.cancel}</button>
	{/snippet}
</Dialog>

<!-- a Munchie Box opening -->
<Dialog bind:open={boxOpen} title={s.box.name(s.rarity[boxRarity])}>
	<div class="box-reveal grid place-items-center gap-2 py-2" data-rarity={boxRarity}>
		{#if !boxRevealed || !boxItem}
			<span class="box-pic big shaking" aria-hidden="true"><span class="box-lid"></span><span class="box-body"><span class="box-q font-head">?</span></span></span>
			<p class="font-head text-sm">{s.box.opening}</p>
		{:else}
			<span class="box-prize" aria-hidden="true">
				{#if boxItem.slot === 'title'}
					<span class="og-title" data-rarity={boxItem.rarity}>{boxItem.text}</span>
				{:else if boxItem.slot === 'name'}
					<span class="og-name font-head text-[20px] font-bold tracking-[0.16em]" data-style={boxItem.id}>{sample}</span>
				{:else if boxItem.slot === 'badge'}
					<ShopPin id={boxItem.id} size={56} />
				{:else}
					{@render face({ [boxItem.slot]: boxItem }, 72, 22, true)}
				{/if}
			</span>
			<p class="font-head text-lg font-bold" role="status">{boxResult?.dup ? s.box.dup(boxItem.name, boxResult.back) : s.box.got(boxItem.name)}</p>
			<span class="shop-rarity font-head">{s.rarity[boxItem.rarity]}</span>
		{/if}
	</div>
	{#snippet actions()}
		<button type="button" class="btn" disabled={!boxRevealed || balance < BOX_PRICE[boxRarity]} onclick={() => openBox(boxRarity)}>{s.box.again}</button>
		<button type="button" class="btn btn-primary" onclick={() => (boxOpen = false)}>{s.box.close}</button>
	{/snippet}
</Dialog>

<style>
	/* ---------- the makeover (2026-11-20): neon dispensary ---------- */
	/* the budtender's word: a little speech box */
	.shop-intro {
		padding: 8px 12px 8px 36px;
		border-radius: 12px;
		background: rgb(77 255 143 / 0.07);
		box-shadow: inset 0 0 0 1px rgb(77 255 143 / 0.3);
		position: relative;
	}
	.shop-intro::before {
		content: '🌿' / '';
		position: absolute;
		left: 11px;
		top: 7px;
		font-size: 16px;
	}
	/* the fitting room: a stage with turning light rays, lava-lamp blobs and a glowing floor */
	.shop-stage {
		background:
			radial-gradient(60% 140% at 16% 60%, rgb(255 60 172 / 0.28), transparent 65%),
			linear-gradient(180deg, rgb(30 8 58 / 0.92), rgb(8 3 18 / 0.92));
		box-shadow:
			inset 0 0 0 2px transparent,
			0 0 0 2px rgb(255 79 216 / 0.55),
			0 0 18px rgb(255 79 216 / 0.3),
			inset 0 0 40px rgb(0 0 0 / 0.5);
	}
	.st-rays {
		position: absolute;
		left: 86px;
		top: 50%;
		width: 520px;
		height: 520px;
		margin: -260px 0 0 -260px;
		background: repeating-conic-gradient(from 0deg, rgb(255 230 120 / 0.13) 0 7deg, transparent 7deg 20deg);
		mask: radial-gradient(circle, #000 18%, transparent 62%);
		pointer-events: none;
		will-change: transform;
		animation: st-spin 40s linear infinite;
	}
	.st-blob {
		position: absolute;
		width: 160px;
		height: 160px;
		border-radius: 50%;
		filter: blur(30px);
		opacity: 0.5;
		pointer-events: none;
		will-change: transform;
		animation: st-lava 16s ease-in-out infinite alternate;
	}
	.st-blob[data-n='1'] {
		right: 8%;
		top: -40px;
		background: #ff3cac;
	}
	.st-blob[data-n='2'] {
		right: 32%;
		bottom: -70px;
		background: #4dff8f;
		opacity: 0.32;
		animation-duration: 21s;
		animation-delay: -7s;
	}
	.st-blob[data-n='3'] {
		right: -40px;
		bottom: -30px;
		background: #8b5cff;
		animation-duration: 18s;
		animation-delay: -12s;
	}
	@keyframes st-spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes st-lava {
		from {
			transform: translate(0, 0) scale(1);
		}
		to {
			transform: translate(-90px, 40px) scale(1.35);
		}
	}
	.st-floor {
		position: absolute;
		left: 10px;
		right: 10px;
		bottom: 2px;
		height: 26px;
		border-radius: 50%;
		background: radial-gradient(closest-side, rgb(255 140 230 / 0.55), rgb(139 92 255 / 0.25) 60%, transparent);
	}
	.st-label {
		color: #ffb3ec;
		font-size: 11px;
		font-weight: 900;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		text-shadow: 0 0 8px rgb(255 79 216 / 0.8);
	}
	.shop-face {
		display: grid;
		place-items: center;
		width: 140px;
		height: 140px;
	}
	/* the kinds: four labelled groups of neon buttons */
	.sk-head {
		margin-bottom: 6px;
		display: flex;
		align-items: center;
		gap: 8px;
		color: #b9ffcf;
		font-size: 10.5px;
		font-weight: 900;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		text-shadow: 0 0 6px rgb(77 255 143 / 0.6);
	}
	.sk-head::after {
		content: '';
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, rgb(77 255 143 / 0.5), transparent);
	}
	.sk-group[data-group='squad'] .sk-head {
		color: #ffb3ec;
		text-shadow: 0 0 6px rgb(255 79 216 / 0.6);
	}
	.sk-group[data-group='squad'] .sk-head::after {
		background: linear-gradient(90deg, rgb(255 79 216 / 0.5), transparent);
	}
	.sk-group[data-group='special'] .sk-head {
		color: #ffe27a;
		text-shadow: 0 0 6px rgb(255 201 40 / 0.6);
	}
	.sk-group[data-group='special'] .sk-head::after {
		background: linear-gradient(90deg, rgb(255 201 40 / 0.5), transparent);
	}
	.sk-chip {
		border: 1.5px solid rgb(196 150 255 / 0.4);
		background: rgb(255 255 255 / 0.05);
		color: #eadcff;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
	}
	.sk-chip:hover {
		border-color: #ff4fd8;
		box-shadow: 0 0 10px rgb(255 79 216 / 0.45);
		transform: translateY(-1px);
	}
	.sk-chip[aria-pressed='true'] {
		border-color: transparent;
		background: linear-gradient(135deg, #4dff8f, #2be0ff);
		color: #04140a;
		box-shadow:
			0 0 12px rgb(77 255 143 / 0.7),
			0 0 24px rgb(43 224 255 / 0.35);
		transform: scale(1.05);
	}
	/* an icon in front of each kind (CSS only: the button's words stay the kind's name) */
	.sk-chip::before {
		font-size: 14px;
		line-height: 1;
	}
	.sk-chip[data-slot='aura']::before {
		content: '🌀' / '';
	}
	.sk-chip[data-slot='effect']::before {
		content: '✨' / '';
	}
	.sk-chip[data-slot='badge']::before {
		content: '📌' / '';
	}
	.sk-chip[data-slot='mouth']::before {
		content: '🚬' / '';
	}
	.sk-chip[data-slot='eyes']::before {
		content: '🕶️' / '';
	}
	.sk-chip[data-slot='hat']::before {
		content: '🎩' / '';
	}
	.sk-chip[data-slot='smoke']::before {
		content: '💨' / '';
	}
	.sk-chip[data-slot='pet']::before {
		content: '🐾' / '';
	}
	.sk-chip[data-slot='back']::before {
		content: '🎯' / '';
	}
	.sk-chip[data-slot='emote']::before {
		content: '💃' / '';
	}
	.sk-chip[data-slot='name']::before {
		content: '🔤' / '';
	}
	.sk-chip[data-slot='title']::before {
		content: '🏷️' / '';
	}
	.sk-chip[data-slot='card']::before {
		content: '🃏' / '';
	}
	.sk-chip[data-slot='radio']::before {
		content: '📻' / '';
	}
	.sk-chip[data-slot='table']::before {
		content: '♠️' / '';
	}
	.sk-chip[data-slot='win']::before {
		content: '🕺' / '';
	}
	.sk-chip[data-slot='maxfx']::before {
		content: '🎆' / '';
	}
	.sk-chip[data-slot='buddy']::before {
		content: '🌱' / '';
	}
	.sk-chip[data-slot='entry']::before {
		content: '🚁' / '';
	}
	.sk-chip[data-slot='trail']::before {
		content: '🍃' / '';
	}
	.sk-chip[data-slot='sound']::before {
		content: '🔊' / '';
	}
	.sk-chip[data-slot='feed']::before {
		content: '💀' / '';
	}
	.sk-chip[data-slot='shelf']::before {
		content: '🏆' / '';
	}
	.sk-chip[data-slot='throne']::before {
		content: '👑' / '';
	}
	/* the item cards: dark glass, a glow in the rarity's colour, a lift on hover, a holo sheen on legendaries */
	.shop-item {
		--r: #9aa3ad;
		position: relative;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: linear-gradient(180deg, rgb(44 16 80 / 0.88), rgb(14 6 28 / 0.92)) !important;
		box-shadow: 0 0 12px color-mix(in srgb, var(--r) 30%, transparent);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;
	}
	.shop-item:hover {
		transform: translateY(-3px) rotate(-0.6deg);
		box-shadow: 0 0 20px color-mix(in srgb, var(--r) 55%, transparent);
	}
	.shop-item[data-rarity='rare'] {
		--r: #4f9bff;
	}
	.shop-item[data-rarity='epic'] {
		--r: #c27bff;
	}
	.shop-item[data-rarity='legendary'] {
		--r: #ffc928;
	}
	.shop-item {
		border-color: color-mix(in srgb, var(--r) 70%, transparent);
		border-width: 1.5px;
	}
	.shop-item.on {
		box-shadow:
			0 0 0 2px var(--t-accent),
			0 0 18px rgb(77 255 143 / 0.5);
	}
	/* a holographic sheen sweeping over the legendaries now and then */
	.shop-item[data-rarity='legendary']::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(115deg, transparent 32%, rgb(255 255 255 / 0.16) 44%, rgb(255 210 120 / 0.22) 50%, rgb(140 220 255 / 0.16) 56%, transparent 68%);
		transform: translateX(-130%);
		pointer-events: none;
		will-change: transform;
		animation: sh-holo 5s ease-in-out infinite;
	}
	@keyframes sh-holo {
		0%,
		55% {
			transform: translateX(-130%);
		}
		100% {
			transform: translateX(130%);
		}
	}
	.shop-try {
		display: grid;
		place-items: center;
		min-height: 84px;
		border-radius: 10px;
		background:
			radial-gradient(circle, color-mix(in srgb, var(--r) 30%, transparent), transparent 70%),
			repeating-conic-gradient(from 0deg at 50% 50%, rgb(255 255 255 / 0.035) 0 10deg, transparent 10deg 20deg),
			rgb(0 0 0 / 0.35);
		overflow: hidden;
	}
	.shop-try[aria-pressed='true'] {
		box-shadow:
			inset 0 0 0 2px var(--r),
			inset 0 0 18px color-mix(in srgb, var(--r) 45%, transparent);
	}
	.shop-rarity {
		padding: 0 7px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--r) 85%, black);
		color: #fff;
		font-size: 9.5px;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.5);
	}
	.shop-item[data-rarity='legendary'] .shop-rarity {
		background: linear-gradient(90deg, #ffd23a, #ff8a1a);
		color: #2a1400;
		text-shadow: none;
	}
	/* the price: a yellow price tag (the Buy buttons) */
	.shop-item :global(.btn-primary),
	.shop-statue :global(.btn-primary) {
		border-color: #ffb800;
		background: linear-gradient(180deg, #fff09a, #ffc928);
		color: #2a1400;
		font-weight: 900;
		box-shadow: 0 2px 0 #a8740c;
		transform: rotate(-1.5deg);
	}
	.shop-item :global(.btn-primary:hover:not(:disabled)),
	.shop-statue :global(.btn-primary:hover:not(:disabled)) {
		transform: rotate(0deg) scale(1.04);
		box-shadow:
			0 2px 0 #a8740c,
			0 0 14px rgb(255 201 40 / 0.6);
	}
	.shop-item :global(.btn-primary:disabled),
	.shop-statue :global(.btn-primary:disabled) {
		filter: grayscale(0.6) brightness(0.7);
	}
	.shop-on {
		align-self: center;
		color: var(--t-buff, #3ee06a);
		font-size: 12px;
		font-weight: 800;
		text-shadow: 0 0 8px rgb(77 255 143 / 0.7);
	}
	.shop-owned {
		align-self: center;
	}
	/* NEW on the newest kinds */
	.shop-new {
		margin-left: 6px;
		padding: 0 5px;
		border-radius: 999px;
		background: #ff4fd8;
		color: #fff;
		font-size: 9px;
		font-weight: 900;
		letter-spacing: 0.08em;
		line-height: 1.6;
		vertical-align: 1px;
		box-shadow: 0 0 6px rgb(255 79 216 / 0.7);
	}
	.sk-chip[aria-pressed='true'] .shop-new {
		background: #04140a;
		color: #4dff8f;
		box-shadow: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.st-rays,
		.st-blob,
		.shop-item[data-rarity='legendary']::after {
			animation: none;
		}
		.shop-item[data-rarity='legendary']::after {
			display: none;
		}
		.shop-item:hover,
		.sk-chip:hover,
		.sk-chip[aria-pressed='true'] {
			transform: none;
		}
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
	.shop-target:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	/* ---------- the ideas pack's item cards (2026-11-20) ---------- */
	/* a little squad card in its camo (the camo itself: .camo-card in grind.css) */
	.shop-carddemo {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 86%;
		padding: 8px 10px;
		border: 1.5px solid var(--t-line);
		border-radius: 10px;
		background-color: var(--t-panel-2);
		color: #fff;
		font-size: 13px;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.8);
	}
	/* one radio line on the phosphor-green screen (its style: .radio-line[data-style] in grind.css) */
	.shop-radiodemo {
		width: 92%;
		padding: 6px 8px;
		border-radius: 8px;
		background: #04140a;
		box-shadow: inset 0 0 0 1px rgb(62 224 106 / 0.35);
		color: #c9f7d6;
		font-size: 11.5px;
		line-height: 1.4;
		text-align: left;
	}
	.shop-radiodemo .radio-line {
		display: block;
	}
	.shop-radiodemo .radio-name {
		color: #7dffa4;
	}
	/* a gold chip and two gold-edged cards on felt */
	.shop-bjdemo {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 999px;
		background: radial-gradient(120% 100% at 50% 0%, #1f7a3a, #0b3e1d);
	}
	.shop-bjchip {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 2px solid #fff6c0;
		border-radius: 999px;
		background: radial-gradient(circle at 35% 30%, #fff6b0, #ffc928 45%, #a8740c);
		color: #2a1a02;
		font-size: 11px;
		font-weight: 900;
		box-shadow: 0 0 8px rgb(255 201 40 / 0.7);
	}
	.shop-bjcard {
		display: grid;
		place-items: center;
		width: 30px;
		height: 42px;
		border-radius: 5px;
		background: linear-gradient(160deg, #fffdf0, #fff1c0);
		color: #161616;
		font-size: 12px;
		font-weight: 800;
		line-height: 1.05;
		box-shadow:
			0 0 0 1.5px #e0a820,
			0 0 8px rgb(255 201 40 / 0.5);
	}
	.shop-bjcard.red {
		color: #d2161e;
	}
	.shop-windemo {
		display: grid;
		justify-items: center;
		gap: 2px;
	}
	.shop-windemo .wd-word {
		color: #ffd23a;
		font-size: 15px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-shadow:
			0 2px 0 #3d0508,
			0 0 10px #ff8a1a;
	}
	/* a weapon row strip for the max effects */
	.shop-maxdemo {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		width: 90%;
		height: 52px;
		padding: 0 12px;
		border: 1.5px solid var(--t-line);
		border-radius: 10px;
		background: rgb(0 0 0 / 0.3);
		color: var(--t-fg);
		font-size: 15px;
		font-weight: 800;
		overflow: hidden;
	}
	/* the Golden Statue tab */
	.shop-statue {
		--r: #ffc928;
		border-color: color-mix(in srgb, #ffc928 60%, transparent);
		background: radial-gradient(60% 120% at 12% 50%, rgb(255 201 40 / 0.18), transparent 70%), var(--t-panel-2);
	}
	.shop-statue-pic {
		position: relative;
		display: grid;
		justify-items: center;
		width: 110px;
		height: 100px;
	}
	.shop-statue-gold {
		margin-top: 2px;
		filter: grayscale(1) sepia(1) saturate(5.5) hue-rotate(-10deg) brightness(1.08) contrast(1.25) drop-shadow(0 0 1px #fff3b0) drop-shadow(0 3px 4px rgb(0 0 0 / 0.65));
	}
	.shop-statue-plinth {
		position: absolute;
		left: 10px;
		right: 10px;
		bottom: 0;
		height: 26px;
		border-radius: 4px 4px 2px 2px;
		background:
			linear-gradient(180deg, #fff1a8 0 3px, #c8941a 3px 6px, transparent 6px),
			linear-gradient(100deg, #e8e2d6, #b8b0a0 40%, #f4f0e6 60%, #a49c8c);
		box-shadow: 0 3px 6px rgb(0 0 0 / 0.6);
	}
	.shop-statue-now {
		color: #ffd23a;
		font-weight: 700;
	}
	/* the Slacker Sticker prank's picture: the header's red sticker */
	.shop-slackdemo {
		padding: 3px 12px 4px;
		border: 2.5px solid #fff;
		border-radius: 6px;
		background: #d8202a;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.6);
		color: #fff;
		font-size: 16px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		transform: rotate(-9deg);
	}
	.shop-target:hover {
		border-color: var(--t-accent);
	}
	/* ---------- the 18-ideas pack (2026-11-21) ---------- */
	/* outfits, under the fitting room */
	.shop-fits {
		display: grid;
		gap: 6px;
	}
	.fit-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.shop-fit {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		padding: 4px 6px 4px 10px;
		border-radius: 10px;
		background: rgb(0 0 0 / 0.3);
		box-shadow: inset 0 0 0 1px rgb(196 150 255 / 0.3);
	}
	/* phones: three narrow columns, the name over its two buttons */
	@media (max-width: 639px) {
		.fit-row {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		.shop-fit {
			flex-direction: column;
			align-items: stretch;
			gap: 4px;
			padding: 6px;
			text-align: center;
		}
		.shop-fit .btn {
			padding-inline: 4px;
			font-size: 12px;
		}
	}
	/* today's deal: a yellow price-tag strip */
	.shop-deal {
		position: relative;
		background:
			repeating-linear-gradient(-45deg, rgb(255 210 58 / 0.08) 0 12px, transparent 12px 24px),
			linear-gradient(120deg, rgb(70 30 10 / 0.9), rgb(30 10 40 / 0.9));
		box-shadow:
			inset 0 0 0 2px #ffd23a,
			0 0 18px rgb(255 210 58 / 0.25);
	}
	.deal-badge {
		display: grid;
		place-items: center;
		min-width: 64px;
		height: 64px;
		padding: 0 6px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 30%, #fff36a, #ffb000 60%, #c46a00);
		color: #3a1500;
		font-size: 20px;
		font-weight: 900;
		box-shadow: 0 0 14px rgb(255 190 40 / 0.6);
		transform: rotate(-12deg);
		animation: deal-wob 2.4s ease-in-out infinite;
	}
	@keyframes deal-wob {
		50% {
			transform: rotate(-4deg) scale(1.06);
		}
	}
	.deal-head {
		color: #ffd23a;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.shop-was {
		margin-left: 6px;
		opacity: 0.6;
		font-size: 0.85em;
	}
	.shop-item.deal {
		box-shadow:
			0 0 0 2px #ffd23a,
			0 0 14px rgb(255 210 58 / 0.35);
	}
	.shop-dealtag,
	.shop-season {
		padding: 1px 6px;
		border-radius: 4px;
		background: #ffd23a;
		color: #2a1200;
		font-size: 9.5px;
		font-weight: 900;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.shop-season {
		background: #c9f0ff;
		color: #0a2a3a;
	}
	.shop-sell {
		border-color: rgb(255 120 120 / 0.5);
	}
	/* the secret 420 reward, locked */
	.locked-pic {
		display: grid;
		place-items: center;
		min-height: 64px;
		color: #ffd23a;
		font-size: 18px;
		font-weight: 900;
		letter-spacing: 0.14em;
		text-shadow: 0 0 10px rgb(255 210 58 / 0.6);
	}
	.locked-bar {
		display: block;
		height: 6px;
		overflow: hidden;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.1);
	}
	.locked-bar i {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, #4dff8f, #ffd23a);
	}
	/* Munchie Boxes: a gift box per rarity */
	.box-pic {
		position: relative;
		display: block;
		width: 64px;
		height: 60px;
		margin: 4px auto 0;
		--box: #9aa3ad;
	}
	.shop-box[data-rarity='rare'] .box-pic,
	.box-reveal[data-rarity='rare'] .box-pic {
		--box: #4f9bff;
	}
	.shop-box[data-rarity='epic'] .box-pic,
	.box-reveal[data-rarity='epic'] .box-pic {
		--box: #b265ff;
	}
	.shop-box[data-rarity='legendary'] .box-pic,
	.box-reveal[data-rarity='legendary'] .box-pic {
		--box: #ffc928;
	}
	.box-body {
		position: absolute;
		left: 6px;
		right: 6px;
		bottom: 0;
		height: 40px;
		display: grid;
		place-items: center;
		border-radius: 4px;
		background:
			linear-gradient(90deg, transparent 44%, #ff4fd8 44% 56%, transparent 56%),
			linear-gradient(180deg, color-mix(in srgb, var(--box) 85%, #fff), color-mix(in srgb, var(--box) 70%, #000));
		box-shadow: 0 3px 8px rgb(0 0 0 / 0.5);
	}
	.box-lid {
		position: absolute;
		left: 2px;
		right: 2px;
		top: 6px;
		height: 14px;
		border-radius: 4px;
		background:
			linear-gradient(90deg, transparent 44%, #ff4fd8 44% 56%, transparent 56%),
			color-mix(in srgb, var(--box) 90%, #fff);
		box-shadow: 0 2px 4px rgb(0 0 0 / 0.4);
		z-index: 1;
	}
	.box-q {
		color: #fff;
		font-size: 20px;
		font-weight: 900;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.7);
	}
	.box-pic.big {
		width: 110px;
		height: 104px;
	}
	.box-pic.big .box-body {
		height: 70px;
	}
	.box-pic.big .box-lid {
		height: 24px;
		top: 8px;
	}
	.shaking {
		animation: box-shake 0.45s ease-in-out infinite;
	}
	.shaking .box-lid {
		animation: box-lid 0.45s ease-in-out infinite;
	}
	@keyframes box-shake {
		25% {
			transform: rotate(-6deg);
		}
		75% {
			transform: rotate(6deg);
		}
	}
	@keyframes box-lid {
		50% {
			transform: translateY(-6px) rotate(4deg);
		}
	}
	.box-prize {
		display: grid;
		place-items: center;
		min-height: 110px;
		animation: box-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1);
	}
	@keyframes box-pop {
		from {
			transform: scale(0.2);
			opacity: 0;
		}
	}
	.ad-now {
		color: #ffb3ec;
	}
	/* item card samples: trail, sound, kill feed */
	.shop-traildemo {
		position: relative;
		display: block;
		width: 150px;
		height: 56px;
	}
	.shop-traildemo i {
		position: absolute;
		top: calc(20px + sin(var(--i) * 50deg) * 12px);
		left: calc(var(--i) * 16px + 6px);
		width: calc(6px + var(--i) * 1.5px);
		aspect-ratio: 1;
		border-radius: 50%;
		opacity: calc(0.25 + var(--i) * 0.1);
		background: #5fe06a;
	}
	.shop-traildemo[data-trail='trail-burgers'] i {
		background: radial-gradient(circle at 50% 30%, #e0a040 0 40%, #6b3a1c 41% 60%, #e0a040 61%);
	}
	.shop-traildemo[data-trail='trail-smoke'] i {
		width: calc(10px + var(--i) * 2px);
		background: radial-gradient(circle, rgb(230 230 240 / 0.8), transparent 70%);
	}
	.shop-traildemo[data-trail='trail-rainbow'] i {
		background: hsl(calc(var(--i) * 50deg) 95% 60%);
		box-shadow: 0 0 6px hsl(calc(var(--i) * 50deg) 95% 60%);
	}
	.td-ptr {
		position: absolute;
		right: 2px;
		top: 26px;
		width: 0;
		height: 0;
		border-left: 7px solid transparent;
		border-right: 7px solid transparent;
		border-bottom: 16px solid #fff;
		transform: rotate(-30deg);
		filter: drop-shadow(0 1px 1px #000);
	}
	.shop-sounddemo {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		padding: 4px 12px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.35);
		font-size: 14px;
		font-weight: 800;
		color: #7dffa4;
	}
	.sd-spk {
		width: 18px;
		height: 18px;
		background: currentColor;
		clip-path: polygon(0 32%, 32% 32%, 70% 0, 70% 100%, 32% 68%, 0 68%);
	}
	.shop-feeddemo {
		animation: none !important;
		opacity: 1 !important;
		font-size: 12px;
	}
	/* Confetti Bomb sample: confetti bursting from the middle */
	.shop-confdemo {
		position: relative;
		display: block;
		width: 80px;
		height: 60px;
	}
	.shop-confdemo i {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 6px;
		height: 9px;
		background: hsl(calc(var(--i) * 47deg) 90% 60%);
		transform: rotate(calc(var(--i) * 26deg)) translateY(calc(-14px - mod(var(--i) * 3px, 16px)));
		animation: conf-pop 1.8s ease-out infinite;
		animation-delay: calc(var(--i) * -0.07s);
	}
	@keyframes conf-pop {
		0% {
			opacity: 0;
			translate: 0 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			translate: 0 14px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.deal-badge,
		.shaking,
		.shaking .box-lid,
		.box-prize,
		.shop-confdemo i {
			animation: none;
		}
	}
</style>
