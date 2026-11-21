<!--
	The Camo Armory (armory.ts; 2026-11-20, the user: "skapa en flik i burgishoppen där man kan köpa guld,
	plat, divergence osv skins till vapen som ens operator kan hålla … jättedyra … man måste köpa alla guld
	för att få köpa platinum osv precis som unlocksen i spelet"). The third door in the BurgiShop page tab.
	Your operator at the top holding your gun (tap a gun's picture to try one), the unlock rules, a button per
	camo (Gold → … → Orion Reforged) and, per class, every weapon in that camo: buy it (asked first: it's a
	lot of burgers), hold it, or why it isn't open yet. What you hold shows on your operator in the header's
	squad frame and on your squad card (OpGear `hold`).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import { worn } from '#lib/shop.ts';
	import { armorySpent, camoOpenAnywhere, gunId, gunStatus, heldGun, ownedCount, ARMORY_CAMOS, ARMORY_CLASSES, GUN_BY_ID, type GunStatus } from '#lib/armory.ts';
	import { DIVERGENCE_REQUIRED } from '#lib/data/camos.ts';
	import { camoLook } from '#lib/data/weaponLooks.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import OpGear from './OpGear.svelte';
	import SquadAvatar from './SquadAvatar.svelte';
	import WeaponIcon from './WeaponIcon.svelte';

	const a = t.armory;
	const HB = ARMORY_CAMOS.findIndex((c) => c.id === 'harmonicBreak');
	const DIV = ARMORY_CAMOS.findIndex((c) => c.id === 'divergence');

	/** The camo shown (index in ARMORY_CAMOS). */
	let camo = $state(0);
	/** A gun being tried on (preview only). */
	let trying = $state<string | null>(null);
	/** The gun whose Buy waits for "Buy it". */
	let confirming = $state<string | null>(null);

	const me = $derived(squad.me);
	const own = $derived(squad.shop?.own);
	const balance = $derived(squad.myBank?.balance ?? 0);
	const mine = $derived(worn(squad.shop));
	const held = $derived(heldGun(squad.shop));
	const shown = $derived(trying ?? held?.id ?? null);
	const shownName = $derived(shown ? (GUN_BY_ID.get(shown)?.name ?? '') : '');
	const hbHave = $derived(ownedCount(own, HB).have);
	const c = $derived(ARMORY_CAMOS[camo]);

	function pickCamo(i: number) {
		camo = i;
		confirming = null;
	}

	function tryOn(id: string) {
		trying = trying === id ? null : id;
	}

	function buyIt(id: string) {
		const it = GUN_BY_ID.get(id);
		if (!it) return;
		const r = squad.buyGun(id);
		confirming = null;
		if (r === 'ok') {
			trying = null;
			toast.show(a.bought(it.name));
		} else if (r === 'broke') toast.show(a.broke(it.price, balance), undefined, 5000);
		else if (r === 'locked') toast.show(a.locked, undefined, 5000);
	}

	function holdIt(id: string) {
		if (squad.equipItem('hold', id)) {
			trying = null;
			toast.show(a.heldNow(GUN_BY_ID.get(id)?.name ?? ''));
		}
	}

	function putDown() {
		if (squad.equipItem('hold', null)) toast.show(a.down);
	}

	/** The short words for a closed gun. */
	function lockText(st: GunStatus): string {
		if (st.state !== 'locked') return '';
		const l = st.lock;
		if (l.kind === 'class') return a.needClassShort(ARMORY_CAMOS[l.need].name, l.left);
		if (l.kind === 'count') return a.needCount(l.left, DIVERGENCE_REQUIRED);
		return a.needWeapon(ARMORY_CAMOS[l.need].name);
	}

	function stateText(id: string, st: GunStatus): string {
		if (st.state === 'owned') return held?.id === id ? a.held : a.owned;
		if (st.state === 'open') return a.buy(GUN_BY_ID.get(id)?.price ?? 0);
		return lockText(st);
	}
</script>

<div class="armory">
	<p class="max-w-3xl text-[13px] text-fg">{a.intro}</p>

	<!-- your operator, holding your gun (or the one you're trying) -->
	<div class="arm-stage mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card px-4 py-4">
		<div class="arm-face">
			<OpGear aura={mine.aura?.id} effect={mine.effect?.id} badge={mine.badge?.id} pet={mine.pet?.id} pin={30} extra={{ back: mine.back?.id, hold: shown }}>
				<SquadAvatar name={me?.name ?? '?'} op={me?.op ?? undefined} size={96} face={faceOf(mine)} />
			</OpGear>
		</div>
		<!-- at least 12rem: on a phone the words go under the operator instead of a narrow column beside it -->
		<div class="min-w-[12rem] flex-1">
			<p class="font-hud text-[11px] tracking-[0.22em] text-muted uppercase">{a.preview}</p>
			<p class="arm-holding font-head text-base leading-tight font-bold sm:text-lg">
				{trying ? a.trying(shownName) : held ? a.holding(shownName) : a.nothing}
			</p>
			<div class="mt-2 flex flex-wrap items-center gap-2">
				{#if held && !trying}<button type="button" class="btn btn-sm" onclick={putDown}>{a.putDown}</button>{/if}
				{#if trying}<button type="button" class="btn btn-sm" onclick={() => (trying = null)}>{a.cancel}</button>{/if}
			</div>
			<p class="mt-2 text-[11px] text-muted">{a.spent(armorySpent(squad.shop))}</p>
		</div>
	</div>

	<!-- the unlock order -->
	<details class="arm-rules mt-3 rounded-card border border-line bg-panel-2 px-3 py-2">
		<summary class="cursor-pointer font-head text-[13px] font-bold tracking-wide uppercase">{a.rulesTitle}</summary>
		<ul class="mt-1.5 grid list-disc gap-1 pl-5 text-[13px] text-muted">
			{#each a.rules as line, i (i)}<li>{line}</li>{/each}
		</ul>
	</details>

	<!-- the camos, in buying order -->
	<div class="arm-camos mt-3" role="group" aria-label={a.camosLabel}>
		{#each ARMORY_CAMOS as cm, i (cm.id)}
			{@const n = ownedCount(own, i)}
			{@const open = camoOpenAnywhere(own, i)}
			<button type="button" class="arm-camo" data-camo={cm.id} aria-pressed={camo === i} aria-label={a.camoLabel(cm.name, cm.price, open, n.have, n.total)} onclick={() => pickCamo(i)}>
				<span class="arm-sw" data-camo={cm.id} aria-hidden="true"></span>
				<span class="min-w-0" aria-hidden="true">
					<b class="block font-head text-[13px] leading-tight font-bold">{cm.name}</b>
					<span class="block text-[11px] leading-tight text-muted">{open ? '' : '🔒 '}{a.short(cm.price)} · <span class="arm-count num font-head">{n.have}/{n.total}</span></span>
				</span>
			</button>
		{/each}
	</div>

	{#if camo === DIV}
		<p class="arm-note mt-3 text-[13px]" class:ok={hbHave >= DIVERGENCE_REQUIRED}>{hbHave >= DIVERGENCE_REQUIRED ? a.divOpen : a.divNote(hbHave, DIVERGENCE_REQUIRED)}</p>
	{/if}

	<!-- every weapon in the camo shown, class by class -->
	{#each ARMORY_CLASSES as cls (cls.id)}
		{@const n = ownedCount(own, camo, cls.id)}
		{@const shut = camo > 0 && camo !== DIV ? ownedCount(own, camo - 1, cls.id) : null}
		<section class="arm-class mt-4" aria-labelledby="arm-{cls.id}">
			<h3 id="arm-{cls.id}" class="flex flex-wrap items-baseline gap-x-3 font-head text-[15px] font-bold tracking-wide uppercase">
				{cls.name}
				<span class="num text-[12px] font-semibold tracking-normal text-muted normal-case">{a.classCount(c.name, n.have, n.total)}</span>
			</h3>
			{#if shut && shut.have < shut.total}
				<p class="mt-0.5 text-[12px] text-muted">{a.needClass(c.name, ARMORY_CAMOS[camo - 1].name, shut.total, cls.name, shut.total - shut.have)}</p>
			{/if}
			<ul class="arm-grid mt-2">
				{#each cls.weapons as w (w.id)}
					{@const id = gunId(camo, w)}
					{@const st = gunStatus(own, camo, w.id)}
					{@const look = camoLook(w.id)}
					{@const isHeld = held?.id === id}
					<li class="arm-gun rounded-card border bg-panel-2 p-2" data-state={st.state} class:held={isHeld}>
						<button type="button" class="arm-pic" aria-pressed={trying === id} aria-label={a.cardLabel(`${c.name} ${w.name}`, stateText(id, st))} onclick={() => tryOn(id)}>
							{#if look}<WeaponIcon {look} camo={c.id} />{/if}
						</button>
						<p class="arm-name mt-1.5 font-head text-[14px] leading-tight font-bold">{w.name}</p>
						<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
							{#if st.state === 'owned'}
								{#if isHeld}
									<span class="arm-on font-head">✔ {a.held}</span>
								{:else}
									<button type="button" class="btn btn-sm btn-primary" onclick={() => holdIt(id)}>{a.hold}</button>
									<span class="text-[11px] text-muted">{a.owned}</span>
								{/if}
							{:else if st.state === 'open'}
								{#if confirming === id}
									<span class="arm-ask text-[12px]">{a.confirm(`${c.name} ${w.name}`, c.price)}</span>
									<button type="button" class="btn btn-sm btn-primary" onclick={() => buyIt(id)}>{a.yes}</button>
									<button type="button" class="btn btn-sm" onclick={() => (confirming = null)}>{a.cancel}</button>
								{:else}
									<button type="button" class="btn btn-sm btn-primary" disabled={balance < c.price} title={balance < c.price ? a.broke(c.price, balance) : undefined} onclick={() => (confirming = id)}
										>{a.buy(c.price)}</button
									>
								{/if}
							{:else}
								<span class="arm-lock text-[12px] text-muted">{lockText(st)}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.arm-stage {
		background:
			radial-gradient(80% 120% at 20% 50%, rgb(255 201 40 / 0.16), transparent 60%),
			linear-gradient(180deg, rgb(20 18 14 / 0.6), rgb(8 8 6 / 0.45));
		box-shadow: inset 0 0 0 1.5px rgb(255 201 40 / 0.55);
	}
	.arm-face {
		display: grid;
		place-items: center;
		width: 150px;
		height: 140px;
	}
	.arm-holding {
		color: var(--t-fg);
	}
	.arm-rules summary {
		min-height: 32px;
		display: flex;
		align-items: center;
	}
	/* the camo buttons: a swatch, the name and price, how many you own */
	.arm-camos {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr));
		gap: 6px;
	}
	.arm-camo {
		display: flex;
		align-items: center;
		gap: 8px;
		min-height: 48px;
		padding: 5px 8px;
		border: 1.5px solid var(--t-line);
		border-radius: 10px;
		background: var(--t-panel-2);
		color: var(--t-fg);
		text-align: left;
	}
	.arm-camo > .min-w-0 {
		flex: 1;
	}
	.arm-camo[aria-pressed='true'] {
		border-color: #ffd23a;
		box-shadow:
			0 0 0 1px rgb(255 210 58 / 0.4),
			0 0 12px rgb(255 210 58 / 0.3);
	}
	.arm-camo:focus-visible {
		outline: 2px solid var(--t-accent);
		outline-offset: 2px;
	}
	.arm-count {
		font-weight: 800;
		white-space: nowrap;
	}
	.arm-sw {
		flex: none;
		width: 26px;
		height: 26px;
		border-radius: 7px;
		box-shadow:
			inset 0 0 0 1px rgb(0 0 0 / 0.5),
			0 1px 2px rgb(0 0 0 / 0.5);
	}
	.arm-sw[data-camo='gold'] {
		background: repeating-linear-gradient(55deg, #8a5d12 0 3px, #f2cc66 3px 6px, #b5852b 6px 8px, #ffe7a0 8px 10px);
	}
	.arm-sw[data-camo='platinum'] {
		background: repeating-linear-gradient(55deg, #646c74 0 3px, #dfe5ea 3px 6px, #8e969e 6px 8px, #f7f9fb 8px 10px);
	}
	.arm-sw[data-camo='harmonicBreak'] {
		background: repeating-linear-gradient(-58deg, #1c0408 0 3px, #8e0f22 3px 5.5px, #ff3b5c 5.5px 6.5px, #1c0408 6.5px 9px);
	}
	.arm-sw[data-camo='divergence'] {
		background: linear-gradient(135deg, #eef3ff, #97a5c2 20%, #ffc4ee 38%, #a3f5e6 55%, #5d6d90 72%, #ffefae 88%, #f4f7ff);
	}
	.arm-sw[data-camo='mercurialDrift'] {
		background: linear-gradient(135deg, #ff3d96, #ffc0d8 25%, #e09a84 45%, #c79bff 65%, #fff0f7 82%, #ff5aa8);
	}
	.arm-sw[data-camo='polyatomicReforged'] {
		background:
			linear-gradient(120deg, transparent 0 30%, #9b6bff 30% 52%, transparent 52%),
			linear-gradient(40deg, #5866ff 0 35%, #3a2ea6 35% 70%, #d6c6ff 70%);
	}
	.arm-sw[data-camo='orionReforged'] {
		background:
			radial-gradient(circle at 30% 30%, #fff 0 1px, transparent 1.5px),
			radial-gradient(circle at 72% 64%, #fff 0 0.8px, transparent 1.3px),
			radial-gradient(ellipse at 30% 35%, rgb(180 60 255 / 0.9), transparent 55%),
			radial-gradient(ellipse at 75% 75%, rgb(224 40 76 / 0.85), transparent 55%),
			#07030f;
	}
	.arm-note {
		color: var(--t-muted);
	}
	.arm-note.ok {
		color: var(--t-buff, #3ee06a);
		font-weight: 700;
	}
	.arm-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 156px), 1fr));
		gap: 8px;
	}
	.arm-gun {
		display: flex;
		flex-direction: column;
		min-width: 0;
		border-color: var(--t-line);
	}
	.arm-gun[data-state='owned'] {
		border-color: color-mix(in srgb, #ffd23a 55%, var(--t-line));
	}
	.arm-gun.held {
		box-shadow: 0 0 0 2px var(--t-accent);
	}
	.arm-pic {
		display: grid;
		place-items: center;
		min-height: 64px;
		padding: 6px 8px;
		border-radius: 8px;
		background: radial-gradient(circle, rgb(255 255 255 / 0.08), rgb(0 0 0 / 0.28) 75%);
	}
	.arm-pic :global(.weapon-icon) {
		width: 100%;
		max-width: 140px;
		height: auto;
		overflow: visible;
	}
	.arm-pic[aria-pressed='true'] {
		box-shadow: inset 0 0 0 2px #ffd23a;
	}
	.arm-pic:focus-visible {
		outline: 2px solid var(--t-accent);
		outline-offset: 2px;
	}
	/* a closed gun: the camo shows dimmed, so you see what you're aiming for */
	.arm-gun[data-state='locked'] .arm-pic :global(.weapon-icon) {
		opacity: 0.45;
		filter: grayscale(0.4);
	}
	.arm-on {
		color: var(--t-buff, #3ee06a);
		font-size: 12px;
		font-weight: 800;
	}
	.arm-ask {
		flex-basis: 100%;
		color: var(--t-fg);
		font-weight: 600;
	}
	.arm-lock {
		line-height: 1.3;
	}
	.arm-name {
		overflow-wrap: anywhere;
	}
</style>
