<!--
	Abscar's operator tag for the header: an original chrome cyborg-skull emblem (two red eyes,
	a holk clenched in its teeth, smoke rising) plus the callsign.
	Only shown in the Abscar theme (.abscar-only).
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';

	const uid = $props.id();

	const UPPER_TEETH = [19.8, 22.9, 26, 29.1, 32.2, 35.3, 38.4, 41.5];
	const LOWER_TEETH = [20.6, 23.6, 26.6, 29.6, 32.6, 35.6, 38.6, 41.4];
</script>

<div class="abscar-only mb-4">
	<div class="flex items-center gap-3.5">
		<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id="{uid}-chrome" x1="0" y1="0" x2="0.35" y2="1">
					<stop offset="0" stop-color="#f4f7fa" />
					<stop offset="0.3" stop-color="#a4adb7" />
					<stop offset="0.55" stop-color="#4b535d" />
					<stop offset="0.78" stop-color="#c3cad2" />
					<stop offset="1" stop-color="#5d656f" />
				</linearGradient>
				<linearGradient id="{uid}-chrome-dark" x1="0" y1="0" x2="0.2" y2="1">
					<stop offset="0" stop-color="#cfd6dd" />
					<stop offset="0.45" stop-color="#5a626c" />
					<stop offset="1" stop-color="#262b31" />
				</linearGradient>
				<radialGradient id="{uid}-red">
					<stop offset="0" stop-color="#ff2a2a" stop-opacity="0.95" />
					<stop offset="1" stop-color="#ff2a2a" stop-opacity="0" />
				</radialGradient>
				<radialGradient id="{uid}-ember">
					<stop offset="0" stop-color="#ff8a1a" stop-opacity="0.95" />
					<stop offset="1" stop-color="#ff5a00" stop-opacity="0" />
				</radialGradient>
				<filter id="{uid}-blur" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="1.3" />
				</filter>
			</defs>

			<!-- neck cables -->
			<path d="M26 55 L24.5 63 M32 56 L32 63.5 M38 55 L39.5 63" stroke="#3a4048" stroke-width="2.2" stroke-linecap="round" />

			<!-- cranium -->
			<path
				d="M12 26 C11 13 20 4 32 4 C44 4 53 13 52 26 L51 32 C50.5 35 48.5 36.5 46 36.5 L18 36.5 C15.5 36.5 13.5 35 13 32 Z"
				fill="url(#{uid}-chrome)"
				stroke="#2a3038"
				stroke-width="0.8"
			/>
			<ellipse cx="25" cy="10" rx="7" ry="3" fill="#fff" opacity="0.35" />
			<path d="M32 5 V14 M21 9.5 C25 11.5 39 11.5 43 9.5" stroke="#1d2228" stroke-opacity="0.45" stroke-width="0.8" fill="none" />
			<path
				d="M15 19.5 C20 17.3 27 17.3 30.5 19.5 M33.5 19.5 C37 17.3 44 17.3 49 19.5"
				stroke="#1d2228"
				stroke-opacity="0.6"
				stroke-width="1.3"
				fill="none"
			/>

			<!-- eye sockets + red eyes -->
			<path d="M15.5 21 L28.5 20.5 L29 27.5 L23.5 31 L16 28.5 Z" fill="#040506" />
			<path d="M48.5 21 L35.5 20.5 L35 27.5 L40.5 31 L48 28.5 Z" fill="#040506" />
			<circle class="op-eye-glow" cx="22.5" cy="25.2" r="8" fill="url(#{uid}-red)" />
			<circle class="op-eye-glow" cx="41.5" cy="25.2" r="8" fill="url(#{uid}-red)" />
			<circle cx="22.5" cy="25.2" r="2.6" fill="#ff3a3a" />
			<circle cx="41.5" cy="25.2" r="2.6" fill="#ff3a3a" />
			<circle cx="23.3" cy="24.4" r="0.8" fill="#ffd6d6" />
			<circle cx="42.3" cy="24.4" r="0.8" fill="#ffd6d6" />

			<!-- nose cavity -->
			<path d="M30.2 29.5 L33.8 29.5 L33 34.5 L32 35.5 L31 34.5 Z" fill="#050607" />

			<!-- cheek struts + jaw pistons -->
			<path d="M13.5 31 L17.5 41 M50.5 31 L46.5 41" stroke="url(#{uid}-chrome-dark)" stroke-width="3" stroke-linecap="round" />
			<rect x="11.5" y="35" width="4" height="10" rx="1.2" fill="url(#{uid}-chrome)" stroke="#20252b" stroke-width="0.6" />
			<rect x="48.5" y="35" width="4" height="10" rx="1.2" fill="url(#{uid}-chrome)" stroke="#20252b" stroke-width="0.6" />
			<path d="M12 40 H15 M49 40 H52" stroke="#20252b" stroke-width="0.8" />

			<!-- upper teeth -->
			<path d="M19 36.5 H45 V41 H19 Z" fill="#0a0b0d" />
			{#each UPPER_TEETH as x (x)}
				<rect {x} y="36.8" width="2.6" height="3.9" rx="0.4" fill="#e3e8ec" />
			{/each}

			<!-- jaw + lower teeth -->
			<path
				d="M17.5 41 H46.5 L45.5 47.5 C44.5 53 39.5 56.5 32 56.5 C24.5 56.5 19.5 53 18.5 47.5 Z"
				fill="url(#{uid}-chrome-dark)"
				stroke="#20252b"
				stroke-width="0.8"
			/>
			<path d="M20 41 H44 V44.6 H20 Z" fill="#0a0b0d" />
			{#each LOWER_TEETH as x (x)}
				<rect {x} y="41.2" width="2.4" height="3.2" rx="0.4" fill="#cfd5db" />
			{/each}
			<path d="M24 51 C28 53.5 36 53.5 40 51" stroke="#fff" stroke-opacity="0.25" stroke-width="0.8" fill="none" />

			<!-- the holk: a cone joint, tips in the teeth, burning end out -->
			<path d="M40.25 39.42 L61.9 41.2 Q64 45.2 60.1 49.1 L39.75 41.78 Z" fill="#f3efe4" stroke="#c9c1ab" stroke-width="0.5" />
			<path d="M40.25 39.42 L44.33 39.8 L43.67 43.2 L39.75 41.78 Z" fill="#cdb98f" />
			<path d="M41.4 39.6 L41 42.2 M42.6 39.7 L42.2 42.6" stroke="#a8935f" stroke-width="0.4" />
			<path d="M47 41.4 L57.5 42.8 M48.5 44.3 L58.5 47" stroke="#d6cfbb" stroke-width="0.6" stroke-linecap="round" />
			<ellipse cx="61.9" cy="45.1" rx="1.8" ry="4" transform="rotate(12 61.9 45.1)" fill="#7a7672" />
			<circle class="op-ember-glow" cx="62.6" cy="45.2" r="7.5" fill="url(#{uid}-ember)" />
			<ellipse cx="62.6" cy="45.2" rx="1.1" ry="3" transform="rotate(12 62.6 45.2)" fill="#ff8a1a" />

			<!-- smoke -->
			<g filter="url(#{uid}-blur)">
				<path class="op-wisp" d="M62 41 C58 33 66 27 61 19 C57 12 64 6 60 -2" />
				<path class="op-wisp" d="M63 41 C67 33 59 26 64 18 C68 11 61 5 65 -3" />
				<path class="op-wisp" d="M62 41 C60 35 65 30 62 24 C59 18 63 13 61 7" />
				<path class="op-wisp" d="M63 42 C64 36 60 31 63 25 C66 19 62 14 64 8" />
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
