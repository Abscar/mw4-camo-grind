<!--
	BurgiArcade's prize counter (2026-11-22, the user: "bygger du en shop där också … pets och gosedjur och
	mounts"): trade the tickets you won in the games for a pet on your operator's shoulder, a plushie it hugs or
	a mount it rides (arcade-prizes.ts; drawings in ArcadePrize). Your operator on the left wearing what you have
	on (tap a prize's picture to try it on first), your tickets, the three kinds, the prizes on lit shelves.
	Worn like BurgiShop items (squad.equipItem), so the header and your squad card show them to everyone.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import { worn, type ShopItem, type ShopSlot } from '#lib/shop.ts';
	import { ARCADE_ITEMS, PRIZE_KINDS, type PrizeKind } from '#lib/arcade-prizes.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import OpGear from '../OpGear.svelte';
	import SquadAvatar from '../SquadAvatar.svelte';
	import ArcadePrize from './ArcadePrize.svelte';

	const p = t.arcade.prizes;
	const s = t.shop;
	let kind = $state<PrizeKind>('pet');
	let trying = $state<ShopItem | null>(null);
	let asking = $state<string | null>(null);

	const tickets = $derived(squad.myTickets);
	const mine = $derived(worn(squad.shop));
	const look = $derived(trying ? { ...mine, [trying.slot]: trying } : mine);
	const items = $derived(ARCADE_ITEMS.filter((i) => i.slot === kind));
	const me = $derived(squad.me);
	const owns = (id: string) => squad.arcade?.own?.[id] !== undefined;
	const wearing = (it: ShopItem) => squad.shop?.eq[it.slot] === it.id;

	function tryOn(it: ShopItem) {
		trying = trying?.id === it.id ? null : it;
	}
	function buyIt(it: ShopItem) {
		asking = null;
		const r = squad.buyPrize(it.id);
		if (r === 'ok') {
			trying = null;
			toast.show(p.bought(it.name));
		} else if (r === 'broke') toast.show(p.broke(it.price, tickets.balance), undefined, 6000);
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
		return wearing(it) ? p.wearing : owns(it.id) ? p.owned : p.buy(it.price);
	}
</script>

{#snippet face(l: Partial<Record<ShopSlot, ShopItem>>, size: number, pin: number)}
	<OpGear aura={l.aura?.id} effect={l.effect?.id} badge={l.badge?.id} pet={l.pet?.id} {pin} extra={{ mount: l.mount?.id, plush: l.plush?.id }}>
		<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} {size} face={faceOf(l)} />
	</OpGear>
{/snippet}

<div class="pc">
	<!-- the counter's stage: your operator + your tickets -->
	<div class="pc-stage">
		<span class="pc-sign font-head" aria-hidden="true">PRIZES</span>
		<div class="pc-face">{@render face(look, 92, 28)}</div>
		<div class="pc-info">
			<p class="pc-dim font-head">{trying ? `${s.tryOn}: ${trying.name}` : p.preview}</p>
			<p class="pc-name font-head">{(me?.name ?? 'Abscar').toUpperCase()}</p>
			<p class="pc-tickets font-head" aria-live="polite"><b class="num">{tickets.balance.toLocaleString('en-US')}</b> <span aria-hidden="true">🎟️</span> <span class="pc-tw">{t.arcade.ticketsLabel}</span></p>
			<p class="pc-dim">{p.tryOn}</p>
		</div>
	</div>

	<!-- the kinds -->
	<div class="pc-kinds" role="group" aria-label={p.kindsLabel}>
		{#each PRIZE_KINDS as k (k)}
			<button type="button" class="pc-kind font-head" data-kind={k} aria-pressed={kind === k} onclick={() => ((kind = k), (trying = null), (asking = null))}>{p.kinds[k]}</button>
		{/each}
	</div>
	<p class="pc-where">{p.where[kind]}</p>

	<!-- the prizes, on lit shelves -->
	<ul class="pc-shelf" data-kind={kind}>
		{#each items as it (it.id)}
			{@const owned = owns(it.id)}
			{@const on = wearing(it)}
			<li class="pc-item" data-rarity={it.rarity} class:on>
				<button type="button" class="pc-try" aria-pressed={trying?.id === it.id} aria-label={p.itemLabel(it.name, p.kindOne[kind], s.rarity[it.rarity], stateText(it))} onclick={() => tryOn(it)}>
					<ArcadePrize id={it.id} size={kind === 'mount' ? 60 : 64} />
				</button>
				<p class="pc-it-name font-head">{it.name}</p>
				<span class="pc-rarity font-head">{s.rarity[it.rarity]}</span>
				<div class="pc-act">
					{#if !owned}
						{#if asking === it.id}
							<p class="pc-ask">{p.confirm(it.name, it.price)}</p>
							<button type="button" class="pc-buy font-head" onclick={() => buyIt(it)}>{p.yes}</button>
							<button type="button" class="pc-plain font-head" onclick={() => (asking = null)}>{p.cancel}</button>
						{:else}
							<button type="button" class="pc-buy font-head" disabled={tickets.balance < it.price} title={tickets.balance < it.price ? p.broke(it.price, tickets.balance) : undefined} onclick={() => (asking = it.id)}>{p.buy(it.price)}</button>
						{/if}
					{:else if on}
						<span class="pc-on font-head">✔ {p.wearing}</span>
						<button type="button" class="pc-plain font-head" onclick={() => takeOff(it)}>{p.takeOff}</button>
					{:else}
						<button type="button" class="pc-buy font-head" onclick={() => wearIt(it)}>{p.wear}</button>
						<span class="pc-dim">{p.owned}</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.pc {
		display: grid;
		gap: 12px;
	}
	.pc-stage {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 14px 22px;
		padding: 18px 16px 16px;
		border-radius: 18px;
		background:
			radial-gradient(60% 120% at 15% 60%, rgb(255 92 184 / 0.28), transparent 65%),
			radial-gradient(60% 100% at 90% 0%, rgb(69 230 255 / 0.2), transparent 60%),
			linear-gradient(180deg, #2a0a3e, #12041e);
		box-shadow:
			inset 0 0 0 2px rgb(255 92 184 / 0.55),
			0 0 22px rgb(255 92 184 / 0.25);
		color: #fff0fa;
	}
	.pc-sign {
		position: absolute;
		top: -11px;
		right: 18px;
		padding: 2px 12px;
		border-radius: 8px;
		background: #12041e;
		font-size: 14px;
		font-weight: 900;
		letter-spacing: 0.3em;
		color: #ff7ac8;
		text-shadow:
			0 0 6px #ff3fb0,
			0 0 14px #ff3fb0;
		box-shadow: 0 0 0 2px #ff7ac8, 0 0 14px rgb(255 63 176 / 0.6);
		animation: pc-neon 4s steps(1) infinite;
	}
	@keyframes pc-neon {
		0%,
		86%,
		90%,
		100% {
			opacity: 1;
		}
		88%,
		92% {
			opacity: 0.35;
		}
	}
	.pc-face {
		display: grid;
		place-items: center;
		min-width: 150px;
		min-height: 128px;
	}
	.pc-info {
		display: grid;
		gap: 2px;
		min-width: 0;
		flex: 1 1 12rem;
	}
	.pc-dim {
		font-size: 11.5px;
		color: #d8bfe8;
	}
	.pc-name {
		font-size: 22px;
		font-weight: 900;
		letter-spacing: 0.18em;
	}
	.pc-tickets {
		font-size: 24px;
		font-weight: 900;
		color: #ff8ac0;
		text-shadow: 0 0 10px rgb(255 100 170 / 0.55);
	}
	.pc-tw {
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #f0d8ea;
	}
	.pc-kinds {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.pc-kind {
		min-height: 44px;
		padding: 0 16px;
		border-radius: 999px;
		border: 2px solid rgb(255 255 255 / 0.2);
		background: rgb(255 255 255 / 0.06);
		color: #fff0fa;
		font-size: 14px;
		font-weight: 900;
		letter-spacing: 0.04em;
	}
	.pc-kind[aria-pressed='true'] {
		border-color: #ff7ac8;
		background: linear-gradient(180deg, #ff7ac8, #c0287c);
		color: #fff;
		box-shadow: 0 0 14px rgb(255 63 176 / 0.55);
	}
	.pc-where {
		font-size: 13px;
		color: #e0cfe8;
	}
	.pc-shelf {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 156px), 1fr));
		gap: 10px;
	}
	.pc-shelf[data-kind='mount'] {
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 176px), 1fr));
	}
	.pc-item {
		--r: #7ad0ff;
		display: grid;
		justify-items: center;
		align-content: start;
		gap: 4px;
		padding: 10px 8px;
		border-radius: 16px;
		background:
			linear-gradient(180deg, transparent 62%, rgb(255 255 255 / 0.06) 62% 66%, transparent 66%),
			radial-gradient(80% 50% at 50% 30%, color-mix(in srgb, var(--r) 25%, transparent), transparent 70%),
			linear-gradient(180deg, #1a0a2a, #0c0414);
		box-shadow:
			inset 0 0 0 1.5px color-mix(in srgb, var(--r) 55%, transparent),
			0 4px 10px rgb(0 0 0 / 0.4);
		text-align: center;
		color: #fff0fa;
	}
	.pc-item[data-rarity='common'] {
		--r: #9ad8ff;
	}
	.pc-item[data-rarity='rare'] {
		--r: #5c9dff;
	}
	.pc-item[data-rarity='epic'] {
		--r: #c47dff;
	}
	.pc-item[data-rarity='legendary'] {
		--r: #ffc928;
	}
	.pc-item.on {
		box-shadow:
			inset 0 0 0 2.5px #a8f03a,
			0 0 16px rgb(168 240 58 / 0.4);
	}
	.pc-try {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 96px;
		border-radius: 12px;
		background: radial-gradient(60% 60% at 50% 55%, rgb(255 255 255 / 0.1), transparent 70%);
	}
	.pc-try[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px #ff7ac8;
	}
	.pc-try:focus-visible {
		outline: 2px solid #ff7ac8;
		outline-offset: 2px;
	}
	.pc-it-name {
		font-size: 14px;
		font-weight: 900;
		line-height: 1.15;
	}
	.pc-rarity {
		padding: 1px 8px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--r) 30%, transparent);
		color: var(--r);
		font-size: 10.5px;
		font-weight: 900;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.pc-act {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
	}
	.pc-ask {
		width: 100%;
		font-size: 12px;
		color: #ffe0f2;
	}
	.pc-buy,
	.pc-plain {
		min-height: 40px;
		padding: 0 12px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 900;
	}
	.pc-buy {
		border: 2px solid #4a0624;
		background: linear-gradient(180deg, #ffd0e4, #ff7ab0 50%, #d0306c);
		color: #3a0420;
	}
	.pc-buy:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.pc-plain {
		border: 1.5px solid rgb(255 255 255 / 0.3);
		background: rgb(255 255 255 / 0.06);
		color: #fff0fa;
	}
	.pc-on {
		font-size: 12.5px;
		color: #c8ff7a;
	}
	@media (prefers-reduced-motion: reduce) {
		.pc-sign {
			animation: none;
		}
	}
</style>
