<!--
	"Ready up" and pings from the squad (2026-11-14, step 2 of the squad): a banner at the top of the
	page, on every tab, while a squad member who pressed Ready up has their page open ("Abscar wants
	to play now", with "I'm in" = ready up yourself), or when someone knocked on your door with the
	terminal's `ping <name>`. Close hides that one on this device. Nothing shows outside a squad.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { isReady, pingsFor } from '#lib/squad-codec.ts';

	const s = t.squad;
	const ready = $derived(
		squad.on ? squad.entries.filter((e) => !e.mine && isReady(e.member, squad.now) && !squad.dismissed.includes(`r:${e.id}:${e.member.readyAt}`)) : []
	);
	const pings = $derived(
		squad.on && squad.doc && squad.me
			? pingsFor(squad.doc, squad.me.id, squad.now).filter((p) => !squad.dismissed.includes(`p:${p.from}:${p.at}`))
			: []
	);
	const names = (list: string[]) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} & ${list[list.length - 1]}` : (list[0] ?? ''));
</script>

{#if pings.length || ready.length}
	<div class="ready-stack mt-4 grid gap-2" role="status">
		{#each pings as p (p.from + p.at)}
			<div class="ready-banner" data-kind="ping">
				<span class="ready-light" aria-hidden="true"></span>
				<p class="min-w-0 flex-1 font-semibold">{s.ping.banner(squad.doc?.members[p.from]?.name ?? '')}</p>
				{#if !squad.readyAt}
					<button type="button" class="btn btn-sm btn-primary" onclick={() => void squad.toggleReady()}>{s.ready.join}</button>
				{/if}
				<button type="button" class="ready-x" aria-label={s.ready.close} onclick={() => squad.dismiss(`p:${p.from}:${p.at}`)}>×</button>
			</div>
		{/each}
		{#if ready.length}
			<div class="ready-banner" data-kind="ready">
				<span class="ready-light" aria-hidden="true"></span>
				<p class="min-w-0 flex-1 font-semibold">{s.ready.banner(names(ready.map((e) => e.member.name)))}</p>
				{#if !squad.readyAt}
					<button type="button" class="btn btn-sm btn-primary" onclick={() => void squad.toggleReady()}>{s.ready.join}</button>
				{/if}
				<button
					type="button"
					class="ready-x"
					aria-label={s.ready.close}
					onclick={() => ready.forEach((e) => squad.dismiss(`r:${e.id}:${e.member.readyAt}`))}>×</button
				>
			</div>
		{/if}
	</div>
{/if}

<style>
	.ready-banner {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 3rem;
		padding: 6px 6px 6px 14px;
		border: 2px solid #3ee06a;
		border-radius: 12px;
		background: linear-gradient(90deg, rgb(20 60 30 / 0.92), rgb(12 30 18 / 0.92));
		color: #eaffef;
		box-shadow: 0 0 16px rgb(62 224 106 / 0.35);
		font-size: 14px;
	}
	.ready-banner[data-kind='ping'] {
		border-color: #ffcc33;
		background: linear-gradient(90deg, rgb(70 50 8 / 0.92), rgb(36 24 4 / 0.92));
		color: #fff6d8;
		box-shadow: 0 0 16px rgb(255 204 51 / 0.35);
	}
	.ready-light {
		flex: none;
		width: 10px;
		height: 10px;
		border-radius: 999px;
		background: currentColor;
		box-shadow: 0 0 8px currentColor;
		animation: ready-blink 1.2s ease-in-out infinite;
	}
	@keyframes ready-blink {
		50% {
			opacity: 0.35;
		}
	}
	.ready-x {
		flex: none;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 999px;
		font-size: 22px;
		line-height: 1;
		opacity: 0.8;
	}
	.ready-x:hover {
		opacity: 1;
		background: rgb(255 255 255 / 0.1);
	}
	@media (prefers-reduced-motion: reduce) {
		.ready-light {
			animation: none;
		}
	}
</style>
