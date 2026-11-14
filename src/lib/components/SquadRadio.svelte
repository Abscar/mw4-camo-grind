<!--
	The squad radio (2026-11-14, squad step 2): a HUD-style radio window where short text messages
	mix with automatic events ("Lars Åke maxed the Kastov 762 ◆"), quick buttons and a 🔥 on others'
	lines. Text only; the newest 100 kept (squad-radio.ts). New lines only arrive while the page is
	open (it reads every 20 seconds while visible). Reading it clears the unread count on the tab.
-->
<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';
	import { agoParts } from '#lib/squad-codec.ts';
	import { TEXT_MAX } from '#lib/squad-radio.ts';
	import { toast } from '#lib/toast.svelte.ts';

	let { visible }: { visible: boolean } = $props();
	const r = t.squad.radio;
	let text = $state('');
	let sending = $state(false);
	let logEl = $state<HTMLElement>();
	const msgs = $derived(squad.radio?.msgs ?? []);
	const nameOf = (id: string, fallback: string) => squad.doc?.members[id]?.name ?? fallback;

	// reading it while the tab is shown counts as read; keep the newest line in view
	$effect(() => {
		const n = msgs.length;
		if (!visible) return;
		untrack(() => squad.markRead());
		void tick().then(() => {
			if (logEl && n) logEl.scrollTop = logEl.scrollHeight;
		});
	});

	async function send(message: string) {
		const clean = message.trim();
		if (!clean || sending) return;
		sending = true;
		const ok = await squad.say(clean);
		sending = false;
		if (ok) {
			if (message === text) text = '';
		} else toast.show(r.sendFailed);
	}
</script>

<section class="sq-radio" aria-labelledby="sq-radio-h">
	<div class="flex flex-wrap items-baseline justify-between gap-x-3">
		<h3 id="sq-radio-h" class="font-head text-[13px] font-bold tracking-[0.12em] uppercase"><span class="radio-dot" aria-hidden="true"></span>{r.heading}</h3>
		<p class="text-[11px] text-muted">{r.note}</p>
	</div>
	<div class="radio-screen font-hud mt-2" bind:this={logEl} role="log" aria-live="polite" aria-label={r.heading}>
		{#if msgs.length === 0}
			<p class="radio-empty">{r.empty}</p>
		{/if}
		{#each msgs as m (m.id)}
			{@const mine = m.from === squad.me?.id}
			{@const fire = m.fire ?? []}
			<div class="radio-line" data-kind={m.kind} class:mine>
				<span class="radio-time">{t.squad.ago(agoParts(m.at, squad.now))}</span>
				<p class="radio-text">
					<b class="radio-name">{nameOf(m.from, m.name)}</b>{m.kind === 'event' ? ' ' : ': '}{m.text}
				</p>
				{#if !mine || fire.length}
					<button
						type="button"
						class="radio-fire"
						aria-pressed={squad.me ? fire.includes(squad.me.id) : false}
						disabled={mine}
						title={fire.length ? r.fireCount(fire.length, fire.map((id) => nameOf(id, '?')).join(', ')) : r.fire}
						onclick={() => void squad.fire(m.id)}
						><span aria-hidden="true">🔥</span>{#if fire.length}<span class="num">{fire.length}</span>{/if}<span class="sr-only">{fire.length ? r.fireCount(fire.length, fire.map((id) => nameOf(id, '?')).join(', ')) : r.fire}</span></button
					>
				{/if}
			</div>
		{/each}
	</div>
	<div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={r.quickLabel}>
		{#each r.quick as q (q)}
			<button type="button" class="chip flex-none" disabled={sending} onclick={() => void send(q)}>{q}</button>
		{/each}
	</div>
	<form
		class="mt-2 flex gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			void send(text);
		}}
	>
		<input
			bind:value={text}
			maxlength={TEXT_MAX}
			autocomplete="off"
			placeholder={r.placeholder}
			aria-label={r.label}
			class="h-11 min-w-0 flex-1 rounded-lg border border-line bg-panel-2 px-3 text-base text-fg outline-none focus:border-accent sm:text-sm"
		/>
		<button type="submit" class="btn btn-primary" disabled={sending || !text.trim()}>{r.send}</button>
	</form>
</section>

<style>
	.radio-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-right: 7px;
		border-radius: 999px;
		background: #3ee06a;
		box-shadow: 0 0 6px #3ee06a;
		vertical-align: 1px;
	}
	/* a green-phosphor radio screen (like the news radar), in every theme */
	.radio-screen {
		height: 260px;
		overflow-y: auto;
		padding: 8px 10px;
		border: 1.5px solid rgb(62 224 106 / 0.55);
		border-radius: 10px;
		background:
			repeating-linear-gradient(0deg, rgb(62 224 106 / 0.05) 0 1px, transparent 1px 3px),
			radial-gradient(120% 100% at 50% 0%, #0f2a18, #06130b);
		color: #c9f7d6;
		font-size: 12.5px;
		line-height: 1.35;
		box-shadow: inset 0 0 18px rgb(0 0 0 / 0.6);
	}
	.radio-empty {
		color: rgb(201 247 214 / 0.6);
	}
	.radio-line {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: start;
		gap: 8px;
		padding: 3px 0;
		border-bottom: 1px dashed rgb(62 224 106 / 0.14);
	}
	.radio-time {
		min-width: 4.6rem;
		color: rgb(201 247 214 / 0.55);
		font-size: 10.5px;
		line-height: 1.6;
		white-space: nowrap;
	}
	.radio-text {
		min-width: 0;
		overflow-wrap: anywhere;
	}
	.radio-name {
		color: #7dffa4;
	}
	.radio-line.mine .radio-name {
		color: #ffcc66;
	}
	.radio-line[data-kind='event'] .radio-text {
		color: #ffe08a;
		font-style: italic;
	}
	.radio-fire {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 3px;
		min-width: 2.75rem;
		min-height: 2.75rem;
		margin: -10px -6px -10px 0;
		border-radius: 999px;
		font-size: 13px;
		filter: grayscale(1) opacity(0.55);
	}
	.radio-fire[aria-pressed='true'],
	.radio-fire:disabled {
		filter: none;
	}
	.radio-fire:not(:disabled):hover {
		filter: none;
		background: rgb(255 255 255 / 0.06);
	}
</style>
