<!--
	Abscar's operator tag for the header: an original cyborg-skull emblem in weathered bronze
	(after the in-game skin: red eyes, exposed teeth, hydraulic neck, a holk with smoke),
	the callsign, and the ranked badge. Only shown in the Abscar theme (.abscar-only).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import RankBadge from './RankBadge.svelte';

	const uid = $props.id();

	const UPPER_TEETH = [20.6, 23.5, 26.4, 29.3, 32.2, 35.1, 38, 40.9];
	const LOWER_TEETH = [21.2, 24, 26.8, 29.6, 32.4, 35.2, 38, 40.6];

	/**
	 * Thick smoke from the holk: soft puffs that well up at the ember, swell and drift up (the user's ask,
	 * 2026-11-07: "more and thicker smoke"). [start s, duration s, sway, end drift, radius]; negative
	 * delays so the column is already full on load. Mostly drifting left, away from the callsign text.
	 */
	const PUFFS = [
		[0, 5.2, 9, -10, 7],
		[0.4, 4.6, -8, 6, 6.2],
		[0.8, 5.6, 10, -20, 7.6],
		[1.2, 4.9, -9, -4, 6.6],
		[1.6, 5.4, 8, -15, 7.2],
		[2, 4.7, -10, 7, 6.4],
		[2.4, 5.8, 9, -22, 7.8],
		[2.8, 5, -8, -8, 7],
		[3.2, 5.3, 10, 3, 6.6],
		[3.6, 5.5, -9, -16, 7.4],
		[4, 4.8, 8, -3, 6.4],
		[4.4, 5.6, -10, -12, 7.5],
		[4.8, 5.1, 9, -18, 7]
	];
</script>

<div class="abscar-only mb-4">
	<div class="flex flex-wrap items-center gap-x-5 gap-y-3">
		<div class="flex items-center gap-3.5">
			<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" aria-hidden="true" focusable="false">
				<defs>
					<linearGradient id="{uid}-bronze" x1="0" y1="0" x2="0.4" y2="1">
						<stop offset="0" stop-color="#fff0c4" />
						<stop offset="0.22" stop-color="#d9ac62" />
						<stop offset="0.5" stop-color="#7a5326" />
						<stop offset="0.74" stop-color="#e0b874" />
						<stop offset="1" stop-color="#5b3c18" />
					</linearGradient>
					<linearGradient id="{uid}-bronze-dark" x1="0" y1="0" x2="0.2" y2="1">
						<stop offset="0" stop-color="#e2bd7c" />
						<stop offset="0.45" stop-color="#6e4a20" />
						<stop offset="1" stop-color="#2e1e0b" />
					</linearGradient>
					<radialGradient id="{uid}-grime" cx="0.3" cy="0.7" r="0.8">
						<stop offset="0" stop-color="#1a0f05" stop-opacity="0.45" />
						<stop offset="1" stop-color="#1a0f05" stop-opacity="0" />
					</radialGradient>
					<radialGradient id="{uid}-red">
						<stop offset="0" stop-color="#ff2a2a" stop-opacity="0.95" />
						<stop offset="1" stop-color="#ff2a2a" stop-opacity="0" />
					</radialGradient>
					<radialGradient id="{uid}-ember">
						<stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" />
						<stop offset="1" stop-color="#ff5a00" stop-opacity="0" />
					</radialGradient>
					<filter id="{uid}-puff-blur" x="-100%" y="-100%" width="300%" height="300%">
						<feGaussianBlur stdDeviation="2.4" />
					</filter>
					<filter id="{uid}-blur" x="-50%" y="-50%" width="200%" height="200%">
						<feGaussianBlur stdDeviation="1.5" />
					</filter>
				</defs>

				<!-- hydraulic neck -->
				<path d="M24 54 L22.5 63.5 M40 54 L41.5 63.5" stroke="url(#{uid}-bronze-dark)" stroke-width="3.2" stroke-linecap="round" />
				<path d="M29 56 L28.5 64 M35 56 L35.5 64" stroke="#2a1c0c" stroke-width="2" stroke-linecap="round" />
				<path d="M32 56 V64" stroke="url(#{uid}-bronze)" stroke-width="2.4" />

				<!-- cranium -->
				<path
					d="M12.5 25 C11.5 11.5 20.5 3 32 3 C43.5 3 52.5 11.5 51.5 25 L50.5 30 C49.5 33.5 47.5 35 45 35.5 L19 35.5 C16.5 35 14.5 33.5 13.5 30 Z"
					fill="url(#{uid}-bronze)"
					stroke="#2a1c0c"
					stroke-width="0.8"
				/>
				<path d="M12.5 25 C11.5 11.5 20.5 3 32 3 C43.5 3 52.5 11.5 51.5 25 L50.5 30 C49.5 33.5 47.5 35 45 35.5 L19 35.5 C16.5 35 14.5 33.5 13.5 30 Z" fill="url(#{uid}-grime)" />
				<ellipse cx="24.5" cy="9" rx="6.5" ry="2.6" fill="#fff6dc" opacity="0.4" />
				<!-- plate seams and temple plates -->
				<path
					d="M32 3.5 V13 M20.5 8.5 C25 10.8 39 10.8 43.5 8.5 M13.2 21 C16 20 17 15 16.5 12 M50.8 21 C48 20 47 15 47.5 12"
					stroke="#2a1c0c"
					stroke-opacity="0.55"
					stroke-width="0.8"
					fill="none"
				/>
				<!-- heavy brow -->
				<path d="M14.5 19.8 C20 16.6 27.5 16.8 31 19.6 L33 19.6 C36.5 16.8 44 16.6 49.5 19.8 L48.8 21.6 L15.2 21.6 Z" fill="url(#{uid}-bronze-dark)" />

				<!-- eye sockets + red eyes -->
				<path d="M15.5 21.4 L28.8 21 L29.2 27.6 L24 30.8 L16.4 28.4 Z" fill="#050302" />
				<path d="M48.5 21.4 L35.2 21 L34.8 27.6 L40 30.8 L47.6 28.4 Z" fill="#050302" />
				<circle class="op-eye-glow" cx="22.6" cy="25.4" r="8.5" fill="url(#{uid}-red)" />
				<circle class="op-eye-glow" cx="41.4" cy="25.4" r="8.5" fill="url(#{uid}-red)" />
				<circle cx="22.6" cy="25.4" r="2.7" fill="#ff3a3a" />
				<circle cx="41.4" cy="25.4" r="2.7" fill="#ff3a3a" />
				<circle cx="23.4" cy="24.6" r="0.85" fill="#ffd6d6" />
				<circle cx="42.2" cy="24.6" r="0.85" fill="#ffd6d6" />

				<!-- nose cavity -->
				<path d="M30.2 29 L33.8 29 L33.1 34 L32 35.2 L30.9 34 Z" fill="#050302" />

				<!-- cheekbones: wide plates flaring out under the eyes -->
				<path d="M13.6 28.6 L20 31 L19 36 L15 40 L12 35 Z" fill="url(#{uid}-bronze)" stroke="#2a1c0c" stroke-width="0.6" />
				<path d="M50.4 28.6 L44 31 L45 36 L49 40 L52 35 Z" fill="url(#{uid}-bronze)" stroke="#2a1c0c" stroke-width="0.6" />

				<!-- jaw pistons -->
				<rect x="11.8" y="36" width="3.8" height="11" rx="1.2" fill="url(#{uid}-bronze-dark)" stroke="#2a1c0c" stroke-width="0.6" />
				<rect x="48.4" y="36" width="3.8" height="11" rx="1.2" fill="url(#{uid}-bronze-dark)" stroke="#2a1c0c" stroke-width="0.6" />
				<path d="M12.3 41 H15.1 M48.9 41 H51.7" stroke="#fff0c4" stroke-opacity="0.5" stroke-width="0.6" />
				<path d="M15.6 38 L19.5 41 M48.4 38 L44.5 41" stroke="#3a2610" stroke-width="1.4" stroke-linecap="round" />

				<!-- upper teeth -->
				<path d="M20 35.5 H44 V40.4 H20 Z" fill="#0b0703" />
				{#each UPPER_TEETH as x (x)}
					<rect {x} y="35.8" width="2.5" height="4.2" rx="0.5" fill="#efe2c4" />
				{/each}

				<!-- jaw + lower teeth -->
				<path
					d="M18.5 40.4 H45.5 L44.5 47 C43.5 52 39 55.5 32 55.5 C25 55.5 20.5 52 19.5 47 Z"
					fill="url(#{uid}-bronze-dark)"
					stroke="#2a1c0c"
					stroke-width="0.8"
				/>
				<path d="M20.8 40.4 H43.2 V44 H20.8 Z" fill="#0b0703" />
				{#each LOWER_TEETH as x (x)}
					<rect {x} y="40.6" width="2.3" height="3.2" rx="0.5" fill="#d9caa6" />
				{/each}
				<path d="M24.5 50.5 C28.5 53 35.5 53 39.5 50.5" stroke="#fff0c4" stroke-opacity="0.3" stroke-width="0.8" fill="none" />

				<!-- the holk: a cone joint, tips in the teeth, burning end out -->
				<path d="M40.25 39.42 L61.9 41.2 Q64 45.2 60.1 49.1 L39.75 41.78 Z" fill="#f3efe4" stroke="#c9c1ab" stroke-width="0.5" />
				<path d="M40.25 39.42 L44.33 39.8 L43.67 43.2 L39.75 41.78 Z" fill="#cdb98f" />
				<path d="M41.4 39.6 L41 42.2 M42.6 39.7 L42.2 42.6" stroke="#a8935f" stroke-width="0.4" />
				<path d="M47 41.4 L57.5 42.8 M48.5 44.3 L58.5 47" stroke="#d6cfbb" stroke-width="0.6" stroke-linecap="round" />
				<ellipse cx="61.9" cy="45.1" rx="1.8" ry="4" transform="rotate(12 61.9 45.1)" fill="#7a7672" />
				<circle class="op-ember-glow" cx="62.6" cy="45.2" r="7.5" fill="url(#{uid}-ember)" />
				<ellipse cx="62.6" cy="45.2" rx="1.1" ry="3" transform="rotate(12 62.6 45.2)" fill="#ff8a1a" />

				<!-- smoke: thick puffs billowing up, with curling wisps through them -->
				<g filter="url(#{uid}-puff-blur)" fill="#e2e7e2">
					{#each PUFFS as [start, dur, sway, dx, r], i (i)}
						<circle
							class="op-puff"
							cx="62.4"
							cy="42"
							{r}
							style:animation-delay="-{start}s"
							style:animation-duration="{dur}s"
							style:--sway="{sway}px"
							style:--dx="{dx}px"
						/>
					{/each}
				</g>
				<g filter="url(#{uid}-blur)">
					<path class="op-wisp" d="M62 41 C58 33 66 27 61 19 C57 12 64 6 60 -2" />
					<path class="op-wisp" d="M63 41 C67 33 59 26 64 18 C68 11 61 5 65 -3" />
					<path class="op-wisp" d="M62 41 C60 35 65 30 62 24 C59 18 63 13 61 7" />
					<path class="op-wisp" d="M63 42 C64 36 60 31 63 25 C66 19 62 14 64 8" />
					<path class="op-wisp" d="M62 42 C57 36 61 29 57 22 C54 16 58 10 55 3" />
					<path class="op-wisp" d="M63 41 C66 35 62 29 66 22 C69 16 64 10 67 4" />
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

		<RankBadge />
	</div>
</div>
