<!--
	Abscar's operator tag for the header: his cyborg-skull emblem, the callsign, and the ranked badge.
	Only shown in the Abscar theme (.abscar-only).
	The emblem (2026-11-11, the user's pick "6B" from a draft sheet) is the bronze skull with red eyes and the
	holk in its teeth, on armoured shoulders, wearing a moss ghillie poncho with weed leaves and buds woven in;
	drawn by AbscarOperator / abscarOperator.ts (variant "ghillie"). Until then it was only the head + neck.
	Next to it the same tag for his squadmate Phillestar (PhillestarEmblem: a hamburger, no holk; 2026-11-10).
	Both tags and the rank badge share one row inside a "Squad" frame with an iridescent border, the badge
	saying "Both ranked / Iridescent" (the user's ask, 2026-11-10: "Iridescent on the same row as the
	operators, framed so it shows we're both in that rank"). It wraps on narrow screens (stacked on phones).
	The news buddy moved next to the title at the same time, which freed the room for this row.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import AbscarOperator from './AbscarOperator.svelte';
	import RankBadge from './RankBadge.svelte';
	import PhillestarEmblem from './PhillestarEmblem.svelte';
</script>

{#snippet callsign(name: string)}
	<div class="min-w-0">
		<p class="font-hud text-[11px] tracking-[0.22em] text-band-muted uppercase">
			{t.operator.label} <span class="text-accent" aria-hidden="true">//</span>
		</p>
		<p class="font-head text-xl leading-tight font-bold tracking-[0.2em] uppercase">{name}</p>
		<p class="font-hud flex items-center gap-1.5 text-[10.5px] tracking-[0.2em] text-accent uppercase">
			<span class="op-online-dot size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
			{t.operator.online}
		</p>
	</div>
{/snippet}

<div class="abscar-only mb-4 pt-1">
	<div class="squad-frame relative inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-lg px-3 pt-4 pb-3">
		<span class="squad-legend font-hud">{t.operator.squad}</span>
			<div class="op-tag flex items-center gap-3.5">
				<AbscarOperator variant="ghillie" class="size-16 flex-none sm:size-20" />
				{@render callsign(t.operator.callsign)}
			</div>

			<div class="op-tag flex items-center gap-3.5">
				<PhillestarEmblem />
				{@render callsign(t.operator.mate)}
			</div>

		<!-- no small line above the rank name (the user asked to remove "Both ranked", 2026-11-10) -->
		<RankBadge label="" />
	</div>
</div>

<style>
	/* one frame round both operators and the rank: an iridescent border that slowly shifts colour */
	.squad-frame {
		border: 1.5px solid transparent;
		background:
			linear-gradient(135deg, rgb(28 8 52 / 0.62), rgb(10 4 24 / 0.5)) padding-box,
			linear-gradient(110deg, #7a3ff0, #ff6ad5, #4fe6ff, #b265ff, #7a3ff0) border-box;
		background-size:
			100% 100%,
			300% 100%;
		box-shadow:
			0 0 20px rgb(190 90 255 / 0.3),
			inset 0 0 16px rgb(255 95 216 / 0.1);
		animation: squad-sheen 9s linear infinite;
	}
	@keyframes squad-sheen {
		to {
			background-position:
				0 0,
				300% 0;
		}
	}
	/* the "Squad" label sitting on the frame's top edge */
	.squad-legend {
		position: absolute;
		top: 0;
		left: 14px;
		transform: translateY(-50%);
		padding: 1px 9px;
		border: 1px solid rgb(255 106 213 / 0.6);
		border-radius: 999px;
		background: #1a0b33;
		color: #f3e6ff;
		font-size: 10px;
		line-height: 1.5;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		box-shadow: 0 0 10px rgb(190 90 255 / 0.35);
	}
</style>
