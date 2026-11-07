<!--
	Abscar's operator tag for the header: a cyborg emblem (one red eye, smoking a joint)
	plus the callsign. Only shown in the Abscar theme (.abscar-only).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';

	const uid = $props.id();
</script>

<div class="abscar-only mb-4">
	<div class="flex items-center gap-3">
		<svg viewBox="0 0 64 64" class="size-14 flex-none overflow-visible" aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id="{uid}-plate" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stop-color="#4b535e" />
					<stop offset="0.55" stop-color="#1b1f25" />
					<stop offset="1" stop-color="#0d0f12" />
				</linearGradient>
				<radialGradient id="{uid}-red">
					<stop offset="0" stop-color="#ff3434" stop-opacity="0.95" />
					<stop offset="1" stop-color="#ff3434" stop-opacity="0" />
				</radialGradient>
				<radialGradient id="{uid}-ember">
					<stop offset="0" stop-color="#ff8a1a" stop-opacity="0.9" />
					<stop offset="1" stop-color="#ff5a00" stop-opacity="0" />
				</radialGradient>
				<filter id="{uid}-blur" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="1.4" />
				</filter>
			</defs>

			<!-- head plate -->
			<path
				d="M15 9 H49 L56 23 L52 44 L42 56 H22 L12 44 L8 23 Z"
				fill="url(#{uid}-plate)"
				stroke="#5b6470"
				stroke-width="1.2"
				stroke-linejoin="round"
			/>
			<path d="M20 15 H44" stroke="#6b7480" stroke-opacity="0.6" stroke-width="1" />
			<!-- visor -->
			<path d="M13 23 H51 L48.5 31 H15.5 Z" fill="#050607" />
			<circle cx="24" cy="27" r="2.2" fill="#2b3038" />
			<circle class="op-eye-glow" cx="40" cy="27" r="9" fill="url(#{uid}-red)" />
			<circle cx="40" cy="27" r="2.8" fill="#ff4a4a" />
			<circle cx="40.8" cy="26.2" r="0.9" fill="#ffd0d0" />
			<!-- jaw -->
			<path d="M20 41 H44 M24 46 H40" stroke="#07080a" stroke-width="1.6" stroke-linecap="round" />

			<!-- joint + ember -->
			<path d="M37 45.2 L57 48.6 L56.6 51.6 L36.6 47.8 Z" fill="#f1ede3" />
			<path d="M36.6 45.1 L40.4 45.8 L40 48.4 L36.4 47.8 Z" fill="#cdb98f" />
			<circle class="op-ember-glow" cx="57.4" cy="50" r="6" fill="url(#{uid}-ember)" />
			<circle cx="57.4" cy="50.1" r="1.9" fill="#ffb347" />

			<!-- smoke -->
			<g filter="url(#{uid}-blur)">
				<path class="op-wisp" d="M57 46 C53 39 61 33 56 25 C52 18 59 12 55 4" />
				<path class="op-wisp" d="M58 46 C62 38 54 31 59 23 C63 16 56 10 60 2" />
				<path class="op-wisp" d="M57 46 C55 40 60 35 57 29 C54 23 58 18 56 12" />
			</g>
		</svg>

		<div class="min-w-0">
			<p class="font-hud text-[11px] tracking-[0.22em] text-band-muted uppercase">
				{t.operator.label} <span class="text-accent" aria-hidden="true">//</span>
			</p>
			<p class="font-head text-xl leading-tight font-bold tracking-[0.2em] uppercase">{t.operator.callsign}</p>
			<p class="font-hud flex items-center gap-1.5 text-[10.5px] tracking-[0.2em] text-accent uppercase">
				<span class="op-online-dot size-1.5 rounded-full bg-accent" aria-hidden="true"></span>
				{t.operator.online}
			</p>
		</div>
	</div>
</div>
