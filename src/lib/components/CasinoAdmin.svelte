<!--
	Abscar's casino admin menu (2026-11-16, the user's ask: "give Abscar a menu where he can take/give
	burgers to everyone on the page, like a mod/admin menu for the casino"). Only shown to the squad
	member who is Abscar (HOUSE_OP): every member with their burgers, an amount, Give / Take, and a row
	for everyone at once. Stored as running totals in the squad document (`grants`), made out of nothing
	/ gone into nothing (not Abscar's own account); every change goes on the radio.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { burgerBank } from '#lib/squad-fun.ts';
	import { toast } from '#lib/toast.svelte.ts';
	import SquadAvatar from './SquadAvatar.svelte';

	const a = t.admin;
	let amount = $state(100);
	let busy = $state(false);
	const members = $derived(Object.fromEntries(squad.entries.map((e) => [e.id, e.member])));
	const bank = $derived(squad.doc ? burgerBank(squad.doc, members, squad.now) : {});
	const valid = $derived(Number.isInteger(amount) && amount > 0 && amount <= 1_000_000);

	async function apply(ids: { id: string; name: string }[], sign: 1 | -1) {
		if (!valid) return;
		busy = true;
		let ok = true;
		for (const { id, name } of ids) ok = (await squad.grant(id, sign * amount, name)) && ok;
		busy = false;
		if (!ok) toast.show(a.failed, undefined, 5000);
		else if (ids.length === 1) toast.show(sign > 0 ? a.given(ids[0].name, amount) : a.taken(ids[0].name, amount));
		else toast.show(sign > 0 ? a.given(a.everyone, amount) : a.taken(a.everyone, amount));
	}
</script>

<section class="casino-admin grid gap-2 rounded-lg px-3 py-2.5" aria-labelledby="casino-admin-h">
	<p id="casino-admin-h" class="font-head text-[11px] font-bold tracking-[0.14em] uppercase">🔧 {a.heading}</p>
	<p class="text-xs text-muted">{a.intro}</p>
	<label class="flex flex-wrap items-center gap-2">
		<span class="text-[13px] font-semibold text-fg">{a.amount}</span>
		<input type="number" min="1" max="1000000" step="1" bind:value={amount} class="field h-11 w-36 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg" />
	</label>
	<ul class="grid gap-1.5">
		{#each squad.entries as e (e.id)}
			{@const row = bank[e.id]}
			<li class="admin-row flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-line bg-panel-2 px-2.5 py-1.5">
				<SquadAvatar name={e.member.name} op={e.member.op} size={30} />
				<b class="min-w-0 flex-1 truncate font-head text-[14px]">{e.member.name}</b>
				<span class="num text-[13px] text-fg">{a.balanceOf(row?.balance ?? 0)}</span>
				{#if row?.grant}<span class="text-[11px] text-muted">{a.adjusted(row.grant)}</span>{/if}
				<span class="flex gap-1.5">
					<button type="button" class="btn btn-sm btn-primary" disabled={busy || !valid} onclick={() => void apply([{ id: e.id, name: e.member.name }], 1)}>{a.give}</button>
					<button type="button" class="btn btn-sm" disabled={busy || !valid} onclick={() => void apply([{ id: e.id, name: e.member.name }], -1)}>{a.take}</button>
				</span>
			</li>
		{/each}
		<li class="admin-row flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-1.5">
			<b class="min-w-0 flex-1 font-head text-[14px]">{a.everyone}</b>
			<span class="flex gap-1.5">
				<button type="button" class="btn btn-sm btn-primary" disabled={busy || !valid} onclick={() => void apply(squad.entries.map((e) => ({ id: e.id, name: e.member.name })), 1)}>{a.give}</button>
				<button type="button" class="btn btn-sm" disabled={busy || !valid} onclick={() => void apply(squad.entries.map((e) => ({ id: e.id, name: e.member.name })), -1)}>{a.take}</button>
			</span>
		</li>
	</ul>
</section>

<style>
	.casino-admin {
		border: 1px solid rgb(255 90 90 / 0.6);
		background: repeating-linear-gradient(135deg, rgb(255 60 60 / 0.06) 0 12px, transparent 12px 24px);
	}
</style>
