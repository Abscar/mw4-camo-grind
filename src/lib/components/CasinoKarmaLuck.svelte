<!--
	Karma luck in BurgiCasino (2026-11-20, the user: "baserat på hur mycket karma man fått för att man donerat
	burgare så ska man få mer och mer tur på slotsen"): a pink ticket above the slot machines and on the
	Donations tab with your karma luck (+5 per step of hearts earned in BurgiGives, casino-rig.ts karmaLuck),
	a heart per step, and how many hearts the next step needs. Only your own karma luck: Abscar's control-room
	settings never show here.
-->
<script lang="ts">
	import { KARMA_MAX, KARMA_PER_STEP } from '#lib/casino-rig.ts';
	import { t } from '#lib/i18n/en.ts';
	import { squad } from '#lib/squad.svelte.ts';

	/** Shown as a "Give burgers" button (to the Donations tab); left out there. */
	let { onGive }: { onGive?: () => void } = $props();

	const k = t.casino.karmaLuck;
	const kl = $derived(squad.myKarmaLuck);
	/** How often a spin gets the hidden second try: +50 = always (casino-rig.ts extraDraws). */
	const pct = $derived(Math.round((kl.luck / 50) * 100));
	const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z';
</script>

<div class="karma-luck rounded-lg" data-on={kl.luck > 0 ? '' : undefined} data-karma-luck={kl.luck}>
	<span class="kl-badge" aria-hidden="true">
		<svg viewBox="0 0 24 24" width="52" height="52">
			<path d={HEART} />
		</svg>
		<b class="num">{k.value(kl.luck)}</b>
	</span>
	<div class="kl-text min-w-0">
		<p class="kl-h font-head">
			{k.heading} <b class="kl-val num">{k.value(kl.luck)}</b>
			<span class="sr-only">({k.steps(kl.step, kl.steps)})</span>
		</p>
		<p class="text-[13px]">{kl.luck ? k.on(kl.hearts) : k.none}</p>
		{#if kl.luck}<p class="text-[12px] text-muted">{k.chance(pct)}</p>{/if}
		<div class="kl-steps" aria-hidden="true">
			{#each Array.from({ length: kl.steps }, (_, i) => i) as i (i)}
				<svg class="kl-step" class:on={i < kl.step} viewBox="0 0 24 24" width="17" height="17"><path d={HEART} /></svg>
			{/each}
			<span class="kl-next font-head">{kl.next === null ? k.top : k.next(kl.need, kl.nextLuck ?? 0)}</span>
		</div>
		<details class="kl-how">
			<summary>{t.karmaShop.how}</summary>
			<p class="text-[12px] text-muted">{k.how(KARMA_PER_STEP, KARMA_MAX)}</p>
		</details>
	</div>
	{#if onGive}
		<button type="button" class="btn btn-sm kl-give" onclick={() => onGive?.()}>{k.give}</button>
	{/if}
</div>

<style>
	/* a pink velvet ticket like the daily bonus, a big heart with the luck on it */
	.karma-luck {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 4px 14px;
		padding: 10px 14px;
		border: 1.5px solid rgb(255 120 190 / 0.7);
		background:
			radial-gradient(70% 150% at 0% 50%, rgb(255 90 170 / 0.28), transparent 65%),
			linear-gradient(90deg, #3b0b2e, #1e0719);
		box-shadow:
			inset 0 0 0 4px rgb(0 0 0 / 0.22),
			0 0 14px rgb(255 110 190 / 0.16);
		color: #fff3dc;
	}
	.kl-badge {
		position: relative;
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
	}
	.kl-badge svg {
		position: absolute;
		inset: 0;
		fill: #5a2448;
		stroke: rgb(255 170 210 / 0.5);
		stroke-width: 1;
	}
	.karma-luck[data-on] .kl-badge svg {
		fill: #ff3d8b;
		stroke: #ffd0e6;
		filter: drop-shadow(0 0 6px rgb(255 70 150 / 0.65));
	}
	.kl-badge b {
		position: relative;
		margin-top: -4px;
		font-size: 15px;
		font-weight: 800;
		color: #fff;
		text-shadow: 0 1px 2px rgb(60 0 30 / 0.9);
	}
	.kl-h {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #ff9ccc;
		text-shadow: 0 0 8px rgb(255 90 170 / 0.45);
	}
	.kl-val {
		margin-left: 2px;
		font-size: 13px;
		color: #fff;
	}
	.kl-steps {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 3px 4px;
		margin-top: 4px;
	}
	.kl-step {
		fill: rgb(255 255 255 / 0.12);
		stroke: rgb(255 170 210 / 0.45);
		stroke-width: 1.4;
	}
	.kl-step.on {
		fill: #ff4f97;
		stroke: #ffd0e6;
		filter: drop-shadow(0 0 3px rgb(255 80 160 / 0.6));
	}
	.kl-next {
		margin-left: 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: #ffc2de;
	}
	.kl-how summary {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-block: -8px -6px;
		cursor: pointer;
		font-size: 12px;
		color: #ffc2de;
		text-decoration: underline dotted;
		text-underline-offset: 3px;
	}
	.kl-how summary:focus-visible {
		outline: 2px solid #ff9ccc;
		outline-offset: 2px;
	}
	.kl-give {
		border-color: #ff7ab8;
		background: rgb(255 80 160 / 0.16);
		color: #fff;
		white-space: nowrap;
	}
	.kl-give:hover {
		background: rgb(255 80 160 / 0.3);
	}
	/* phones: the button under the text */
	@media (max-width: 559px) {
		.karma-luck {
			grid-template-columns: auto minmax(0, 1fr);
		}
		.kl-give {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}
</style>
