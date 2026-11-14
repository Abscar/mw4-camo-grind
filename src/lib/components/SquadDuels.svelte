<!--
	Duels (2026-11-14, squad step 2): "first to Platinum on the M4" between you and someone else;
	the loser gets the stake as a sticker on their card ("Buys the burgers"). Who won is worked out
	from both members' ticks (and their tick times when both got it; squad-codec duelResult).
-->
<script lang="ts">
	import { LADDER } from '#lib/data/camos.ts';
	import { CLASSES, WEAPON_BY_ID } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { duelResult, MAX_DUELS, STAKE_MAX } from '#lib/squad-codec.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import Dialog from './Dialog.svelte';

	const d = t.squad.duel;
	const duels = $derived(squad.doc?.duels ?? []);
	const members = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])));
	const others = $derived(squad.entries.filter((e) => !e.mine));

	let open = $state(false);
	let against = $state('');
	let weapon = $state(CLASSES[0].weapons[0].id);
	let goal = $state(2);
	let stake = $state<string>(d.stakeDefault);
	let busy = $state(false);

	const taken = $derived(
		!!against && [squad.me?.id ?? '', against].some((id) => (members[id]?.weapons[weapon] ?? 0) >= goal)
	);

	function openForm() {
		against = others[0]?.id ?? '';
		stake = d.stakeDefault;
		open = true;
	}

	async function start() {
		if (!against || taken) return;
		if (duels.length >= MAX_DUELS) {
			toast.show(d.full);
			return;
		}
		busy = true;
		const ok = await squad.startDuel(against, weapon, goal, stake);
		busy = false;
		open = false;
		if (!ok) toast.show(t.squad.toast.error);
	}
</script>

<section class="sq-duels" aria-labelledby="sq-duels-h">
	<div class="flex items-center justify-between gap-3">
		<h3 id="sq-duels-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase">{d.heading}</h3>
		<button type="button" class="btn btn-sm" disabled={others.length === 0} onclick={openForm}>{d.start}</button>
	</div>
	{#if others.length === 0}
		<p class="mt-2 text-xs text-muted">{d.noOther}</p>
	{:else if duels.length === 0}
		<p class="mt-2 text-xs text-muted">{d.none}</p>
	{/if}
	<ul class="mt-2 grid gap-2">
		{#each duels as duel (duel.id)}
			{@const res = duelResult(duel, members)}
			{@const a = members[duel.a]}
			{@const b = members[duel.b]}
			<li class="sq-duel rounded-lg border border-line bg-panel-2 px-3 py-2" data-done={!!res}>
				<p class="text-[13px] font-semibold">
					<span class:win={res?.winner === duel.a} class:lose={res?.loser === duel.a}>{a?.name ?? '?'}</span>
					<span class="text-muted"> {d.vs} </span>
					<span class:win={res?.winner === duel.b} class:lose={res?.loser === duel.b}>{b?.name ?? '?'}</span>
				</p>
				<p class="text-xs text-muted">{d.on(LADDER[duel.goal - 1]?.name ?? '', WEAPON_BY_ID.get(duel.weapon)?.name ?? duel.weapon)}</p>
				<div class="mt-1 flex min-h-6 flex-wrap items-center justify-between gap-2">
					<span class="sq-duel-state font-head" data-state={res ? (res.draw ? 'draw' : 'won') : 'live'}>
						{res ? (res.draw ? d.draw : d.won(members[res.winner ?? '']?.name ?? '?')) : d.live}
					</span>
					{#if res?.loser && duel.stake}
						<span class="sq-stake font-head" title={members[res.loser]?.name}>{members[res.loser]?.name}: {duel.stake}</span>
					{:else if duel.stake}
						<span class="text-[11px] text-muted">{d.stake}: {duel.stake}</span>
					{/if}
					<button type="button" class="-my-2.5 min-h-11 px-1 text-xs text-muted hover:text-fg hover:underline" onclick={() => void squad.removeDuel(duel.id)}>{d.remove}</button>
				</div>
			</li>
		{/each}
	</ul>
</section>

<Dialog bind:open title={d.title}>
	<form
		id="sq-duel-form"
		class="grid gap-3"
		onsubmit={(e) => {
			e.preventDefault();
			void start();
		}}
	>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{d.against}</span>
			<select bind:value={against} class="h-11 rounded-lg border border-line bg-panel-2 px-2 text-base text-fg">
				{#each others as o (o.id)}<option value={o.id}>{o.member.name}</option>{/each}
			</select>
		</label>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{d.weapon}</span>
			<select bind:value={weapon} class="h-11 rounded-lg border border-line bg-panel-2 px-2 text-base text-fg">
				{#each CLASSES as cls (cls.id)}
					<optgroup label={cls.name}>
						{#each cls.weapons as w (w.id)}<option value={w.id}>{w.name}</option>{/each}
					</optgroup>
				{/each}
			</select>
		</label>
		<fieldset class="grid gap-1">
			<legend class="font-semibold text-fg">{d.goal}</legend>
			<div class="mt-1 grid grid-cols-3 gap-1.5">
				{#each LADDER as camo, i (camo.id)}
					<label class="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-panel-2 px-2 text-[13px]">
						<input type="radio" name="sq-duel-goal" class="accent-(--t-accent)" checked={goal === i + 1} onchange={() => (goal = i + 1)} />
						{camo.name}
					</label>
				{/each}
			</div>
		</fieldset>
		<label class="grid gap-1">
			<span class="font-semibold text-fg">{d.stake}</span>
			<input bind:value={stake} maxlength={STAKE_MAX} class="h-11 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg" />
		</label>
		{#if taken}<p class="text-xs text-fg" role="alert">{d.taken}</p>{/if}
	</form>
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (open = false)}>{t.squad.cancel}</button>
		<button type="submit" form="sq-duel-form" class="btn btn-primary" disabled={busy || taken || !against}>{d.go}</button>
	{/snippet}
</Dialog>

<style>
	.win {
		color: var(--t-buff, #3ee06a);
	}
	.lose {
		text-decoration: line-through;
		opacity: 0.7;
	}
	.sq-duel-state {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--t-accent);
	}
	.sq-duel-state[data-state='won'] {
		color: var(--t-buff, #3ee06a);
	}
	/* the loser's sticker */
	.sq-stake {
		padding: 2px 7px 1px;
		border: 2px solid #fff;
		border-radius: 5px;
		background: linear-gradient(180deg, #ff3b30, #c4111a);
		color: #fff;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		transform: rotate(-4deg);
		box-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
	}
</style>
