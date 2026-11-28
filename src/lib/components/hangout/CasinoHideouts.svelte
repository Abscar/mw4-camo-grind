<!--
	Hideouts in BurgiCasino (2026-11-28, hideout.ts + hangout.ts): buy your own, go into the squad's, hang out
	(quick lines, waves), play cards / dice / coin flips or bet on anything with whoever is there (the loser pays
	the winner), and fit yours out: room style, furniture per spot, the neon sign's words, and a display wall for
	your best guns, CS2 skins and clothes.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { hangout } from '#lib/hangout.svelte.ts';
	import { owns, ITEM_BY_ID } from '#lib/shop.ts';
	import { FURNITURE, HIDEOUT_ID, HIDEOUT_PRICE, ROOMS, SIGN_MAX, SPOTS, hasHideout, ownsRoom, showable, showSlots, type Hideout, type Spot } from '#lib/hideout.ts';
	import { SAYS, isFresh, type Say } from '#lib/hangout.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import HideoutScene from './HideoutScene.svelte';
	import HideoutGames from './HideoutGames.svelte';
	import ShowItem from './ShowItem.svelte';
	import HideoutTileArt from './HideoutTileArt.svelte';

	let { visit = $bindable(null) }: { visit?: string | null } = $props();
	const H = t.hideout;
	const fmt = (n: number) => n.toLocaleString('en-US');
	const meId = $derived(squad.me?.id ?? null);
	const balance = $derived(Math.max(0, (squad.myBank?.balance ?? 0) - hangout.held));
	/** Your own hideout: this device's copy (newest); others' from the squad document. */
	const hoOf = (id: string): Hideout | undefined => (id === meId ? squad.hideout : squad.entries.find((e) => e.id === id)?.member.hideout);
	const shopOf = (id: string) => (id === meId ? squad.shop : squad.entries.find((e) => e.id === id)?.member.shop);
	const homes = $derived(squad.entries.filter((e) => e.id !== meId && hasHideout(e.member.hideout)));
	const insideOf = (id: string) => Object.entries(hangout.doc?.here ?? {}).filter(([, h]) => h.w === `ho:${id}` && isFresh(h, hangout.now));

	const open = $derived(visit && hasHideout(hoOf(visit)) ? visit : null);
	$effect(() => hangout.at(open ? `ho:${open}` : 'hideout'));
	let tab = $state<'hang' | 'games' | 'fit'>('hang');
	$effect(() => {
		if (open && open !== meId && tab === 'fit') tab = 'hang';
	});

	function buyBase() {
		const r = squad.buyHideout(HIDEOUT_ID);
		if (r === 'ok') {
			toast.show(H.bought);
			visit = meId;
		} else if (r === 'broke') toast.show(H.broke);
	}
	const ownerName = (id: string) => (id === meId ? (squad.me?.name ?? '') : (squad.entries.find((e) => e.id === id)?.member.name ?? '?'));
	const crowd = $derived(
		open
			? insideOf(open).map(([id, h]) => ({ id, name: h.name, op: h.op, me: id === meId }))
			: []
	);
	// you always see yourself in the room, even before your first hello lands
	const people = $derived(open && meId && !crowd.some((p) => p.me) ? [...crowd, { id: meId, name: squad.me?.name ?? '', op: squad.me?.op ?? undefined, me: true }] : crowd);

	// ----- fitting it out -----
	let preview = $state<{ th?: string; id?: string; spot?: string } | null>(null);
	let spot = $state<Spot>('couch');
	let sign = $state('');
	$effect(() => {
		if (open === meId) sign = squad.hideout?.sign ?? '';
	});
	function buy(id: string, name: string) {
		const r = squad.buyHideout(id);
		if (r === 'ok') {
			preview = null;
			toast.show(H.boughtItem(name));
		} else if (r === 'broke') toast.show(H.broke);
	}
	const mine = $derived(squad.hideout);
	const myShowable = $derived(Object.keys(squad.shop?.own ?? {}).filter((id) => owns(squad.shop, id) && showable(id)));
	function toggleShow(id: string) {
		const cur = mine?.show ?? [];
		if (cur.includes(id)) squad.arrangeHideout({ show: cur.filter((x) => x !== id) });
		else if (cur.length >= showSlots(mine)) toast.show(H.showFull(showSlots(mine)));
		else squad.arrangeHideout({ show: [...cur, id] });
	}
</script>

<div class="hideouts grid gap-3">
	{#if !open}
		<div class="ho-stage">
			<HideoutTileArt size={120} />
			<div class="min-w-0">
				<p class="ho-title font-head">{H.heading}</p>
				<p class="text-[13px] text-fg">{H.sub}</p>
			</div>
		</div>

		<!-- yours -->
		<div class="ho-card">
			<p class="ho-h font-head">{H.yours}</p>
			{#if hasHideout(squad.hideout)}
				<div class="ho-row">
					<span class="text-[13px]">{H.roomNames[squad.hideout!.th]} · {H.inside(insideOf(meId!).length)}</span>
					<button type="button" class="btn btn-primary ho-go" onclick={() => (visit = meId)}>{H.enter}</button>
				</div>
			{:else}
				<p class="text-[13px] text-fg">{H.buyLine(fmt(HIDEOUT_PRICE))}</p>
				<button type="button" class="btn btn-primary ho-go" disabled={balance < HIDEOUT_PRICE} onclick={buyBase}>{H.buy(fmt(HIDEOUT_PRICE))}</button>
			{/if}
		</div>

		<!-- the squad's -->
		<div class="ho-card">
			<p class="ho-h font-head">{H.others}</p>
			{#if !homes.length}<p class="text-[13px] text-muted">{H.noOthers}</p>{/if}
			<ul class="grid gap-2" role="list">
				{#each homes as e (e.id)}
					<li class="ho-row">
						<span class="min-w-0 truncate text-[13px]"><b class="font-head">{H.of(e.member.name)}</b> · {H.roomNames[e.member.hideout!.th]} · {H.inside(insideOf(e.id).length)}</span>
						<button type="button" class="btn ho-go" onclick={() => (visit = e.id)}>{H.enter}</button>
					</li>
				{/each}
			</ul>
		</div>
	{:else}
		{@const ho = hoOf(open)!}
		<div class="ho-top">
			<button type="button" class="btn btn-sm ho-back" onclick={() => (visit = null)}>{H.back}</button>
			<p class="ho-title font-head">{H.of(ownerName(open))}</p>
		</div>
		<HideoutScene {ho} owned={(id) => owns(shopOf(open), id)} {people} preview={open === meId ? preview : null} />

		<div class="ho-tabs" role="tablist" aria-label={H.heading}>
			{#each (open === meId ? ['hang', 'games', 'fit'] : ['hang', 'games']) as k (k)}
				<button type="button" role="tab" class="ho-tab font-head" aria-selected={tab === k} onclick={() => (tab = k as typeof tab)}>{H.tabs[k as 'hang']}</button>
			{/each}
		</div>

		{#if tab === 'hang'}
			<div class="ho-card">
				<p class="ho-h font-head">{H.visitors}</p>
				{#if people.length <= 1}<p class="text-[13px] text-muted">{H.empty}</p>{/if}
				<div class="flex flex-wrap gap-1.5" role="group" aria-label={t.hang.sayLabel}>
					{#each SAYS as k (k)}<button type="button" class="chip ho-say" onclick={() => hangout.say(k as Say)}>{t.hang.says[k]}</button>{/each}
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each people.filter((p) => !p.me) as p (p.id)}
						<button type="button" class="btn btn-sm" onclick={async () => (await hangout.wave(p.id)) && toast.show(t.hang.waved(p.name))}>👋 {t.hang.waveTo(p.name)}</button>
					{/each}
				</div>
			</div>
		{:else if tab === 'games'}
			<HideoutGames ho={open} {balance} />
		{:else}
			<!-- room style -->
			<div class="ho-card">
				<p class="ho-h font-head">{H.rooms}</p>
				<div class="ho-grid">
					{#each ROOMS as r (r.id)}
						{@const have = ownsRoom(mine, r.id)}
						<div class="ho-item" class:on={mine?.th === r.id}>
							<button type="button" class="ho-swatch" style:--a={r.c[0]} style:--b={r.c[2]} style:--c={r.c[4]} aria-label={H.roomNames[r.id]} onclick={() => (preview = preview?.th === r.id ? null : { th: r.id })}></button>
							<span class="ho-name">{H.roomNames[r.id]}</span>
							{#if mine?.th === r.id}<span class="ho-tag">{H.inUse}</span>
							{:else if have}<button type="button" class="btn btn-sm" onclick={() => ((preview = null), squad.arrangeHideout({ th: r.id }))}>{H.use}</button>
							{:else}<button type="button" class="btn btn-sm btn-primary" disabled={balance < r.price} onclick={() => buy(`room-${r.id}`, H.roomNames[r.id])}>{H.buyItem(fmt(r.price))}</button>{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- furniture per spot -->
			<div class="ho-card">
				<div class="flex flex-wrap gap-1.5" role="group" aria-label={H.heading}>
					{#each SPOTS as s (s)}<button type="button" class="chip" aria-pressed={spot === s} onclick={() => ((spot = s), (preview = null))}>{H.spots[s]}</button>{/each}
				</div>
				<div class="ho-grid">
					{#each FURNITURE.filter((f) => f.spot === spot) as f (f.id)}
						{@const have = mine?.own[f.id] !== undefined}
						{@const inUse = mine?.sp[f.spot] === f.id}
						<div class="ho-item" class:on={inUse}>
							<button type="button" class="ho-try" aria-pressed={preview?.id === f.id} onclick={() => (preview = preview?.id === f.id ? null : { id: f.id, spot: f.spot })}>👁</button>
							<span class="ho-name">{H.items[f.id]}</span>
							{#if inUse}<button type="button" class="btn btn-sm" onclick={() => squad.arrangeHideout({ spot: [f.spot, null] })}>{H.remove}</button>
							{:else if have}<button type="button" class="btn btn-sm" onclick={() => ((preview = null), squad.arrangeHideout({ spot: [f.spot, f.id] }))}>{H.use}</button>
							{:else}<button type="button" class="btn btn-sm btn-primary" disabled={balance < f.price} onclick={() => buy(f.id, H.items[f.id])}>{H.buyItem(fmt(f.price))}</button>{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- the sign -->
			<div class="ho-card">
				<label class="ho-h font-head" for="ho-sign">{H.sign}</label>
				<p class="text-[12px] text-muted">{H.signHint(SIGN_MAX)}</p>
				<form class="flex gap-2" onsubmit={(e) => (e.preventDefault(), squad.arrangeHideout({ sign }))}>
					<input id="ho-sign" class="field min-w-0 flex-1" maxlength={SIGN_MAX} bind:value={sign} />
					<button type="submit" class="btn btn-primary">{H.signSave}</button>
				</form>
			</div>

			<!-- the display wall -->
			<div class="ho-card">
				<p class="ho-h font-head">{H.show} · {(mine?.show.length ?? 0)}/{showSlots(mine)}</p>
				<p class="text-[12px] text-muted">{myShowable.length ? H.showHint(showSlots(mine)) : H.showNone}</p>
				<div class="ho-show">
					{#each myShowable as id (id)}
						<button type="button" class="ho-show-btn" aria-pressed={mine?.show.includes(id) ?? false} title={ITEM_BY_ID.get(id)?.name} onclick={() => toggleShow(id)}>
							<ShowItem {id} size={52} />
							<span class="ho-name">{ITEM_BY_ID.get(id)?.name}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.ho-stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 18px;
		padding: 12px 16px;
		border-radius: 14px;
		border: 1.5px solid #ff9a3a;
		background:
			radial-gradient(80% 140% at 0% 50%, rgb(255 140 40 / 0.28), transparent 65%),
			linear-gradient(90deg, #3a1608, #1c0a06);
	}
	.ho-title {
		font-size: clamp(20px, 4vw, 28px);
		font-weight: 900;
		letter-spacing: 0.06em;
		background: linear-gradient(180deg, #fff1c4, #ffb24a 60%, #ff6a2a);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: none !important;
	}
	.ho-card {
		display: grid;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid var(--t-line);
		background: rgb(0 0 0 / 0.28);
	}
	.ho-h {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #ffb24a;
	}
	.ho-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.ho-go {
		min-height: 44px;
		flex: none;
		justify-self: start;
	}
	.ho-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 14px;
	}
	.ho-back {
		min-height: 44px;
	}
	.ho-tabs {
		display: flex;
		gap: 4px;
		border-bottom: 2px solid rgb(255 154 58 / 0.5);
	}
	.ho-tab {
		min-height: 44px;
		padding: 0 14px;
		border-radius: 10px 10px 0 0;
		font-size: 13px;
		font-weight: 800;
		color: var(--t-muted);
	}
	.ho-tab[aria-selected='true'] {
		background: #ff9a3a;
		color: #2a1004;
	}
	.ho-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
	}
	.ho-item {
		display: grid;
		justify-items: start;
		gap: 4px;
		padding: 8px;
		border-radius: 10px;
		border: 1px solid var(--t-line);
		background: rgb(255 255 255 / 0.03);
	}
	.ho-item.on {
		border-color: #ff9a3a;
		box-shadow: 0 0 10px rgb(255 154 58 / 0.35);
	}
	.ho-item .btn {
		min-height: 36px;
	}
	.ho-swatch {
		width: 100%;
		height: 44px;
		border-radius: 8px;
		background: linear-gradient(180deg, var(--a) 0 58%, var(--c) 58% 62%, var(--b) 62%);
		border: 1px solid rgb(255 255 255 / 0.25);
	}
	.ho-try {
		min-width: 44px;
		min-height: 36px;
		border-radius: 8px;
		border: 1px solid var(--t-line);
	}
	.ho-try[aria-pressed='true'] {
		background: #ff9a3a;
		color: #2a1004;
	}
	.ho-name {
		font-size: 12.5px;
		font-weight: 700;
	}
	.ho-tag {
		font-size: 11px;
		font-weight: 800;
		color: #ff9a3a;
	}
	.ho-show {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
		gap: 6px;
	}
	.ho-show-btn {
		display: grid;
		justify-items: center;
		gap: 2px;
		min-height: 44px;
		padding: 6px;
		border-radius: 10px;
		border: 1px solid var(--t-line);
	}
	.ho-show-btn[aria-pressed='true'] {
		border-color: #ff9a3a;
		background: rgb(255 154 58 / 0.16);
	}
	.ho-show-btn .ho-name {
		font-size: 10.5px;
		text-align: center;
	}
	.ho-say {
		min-height: 36px;
	}
</style>
