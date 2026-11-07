<!--
	Abscar's ranked badge: an original "Iridescent" emblem (winged shield, lightning bolt,
	tier plaque) in shifting pink / violet / cyan, with the rank name. Our own drawing, not the
	game's artwork. Lives inside OperatorTag, so it's only shown in the Abscar theme.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';

	const uid = $props.id();
	const HEX = '32,12 47.6,21 47.6,39 32,48 16.4,39 16.4,21';
	const HEX_INNER = '32,17 43.3,23.5 43.3,36.5 32,43 20.7,36.5 20.7,23.5';
	const WING =
		'M17 30 C10 29 5 24 2.5 16 C8 20.5 12 21.5 16.5 21 C11 18 8 13.5 7.5 8 C12.5 13.5 16.5 15.5 19 16 Z';
</script>

<div class="rank-card flex items-center gap-2.5 rounded-md py-1.5 pr-3.5 pl-1.5">
	<svg viewBox="0 0 64 64" class="rank-badge size-14 flex-none overflow-visible" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id="{uid}-iri" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ff5fd8" />
				<stop offset="0.35" stop-color="#a45bff" />
				<stop offset="0.7" stop-color="#5ad8ff" />
				<stop offset="1" stop-color="#ff7ad1" />
			</linearGradient>
			<linearGradient id="{uid}-wing" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#f3e8ff" />
				<stop offset="0.6" stop-color="#b48cff" />
				<stop offset="1" stop-color="#6a3fc8" />
			</linearGradient>
			<linearGradient id="{uid}-gold" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#fff1b8" />
				<stop offset="1" stop-color="#d79a2b" />
			</linearGradient>
			<radialGradient id="{uid}-core">
				<stop offset="0" stop-color="#4b1d86" />
				<stop offset="1" stop-color="#1a0833" />
			</radialGradient>
		</defs>

		<!-- wings -->
		<path d={WING} fill="url(#{uid}-wing)" stroke="#3b1670" stroke-width="0.7" />
		<path d={WING} transform="translate(64 0) scale(-1 1)" fill="url(#{uid}-wing)" stroke="#3b1670" stroke-width="0.7" />

		<!-- shield -->
		<polygon points={HEX} fill="url(#{uid}-iri)" stroke="#ffe3fb" stroke-width="1" />
		<polygon points={HEX_INNER} fill="url(#{uid}-core)" />

		<!-- lightning bolt -->
		<path
			d="M35 18.5 L25.5 32 H31 L27.5 42 L38.5 26.5 H33 L36.5 18.5 Z"
			fill="#eafcff"
			stroke="#5ad8ff"
			stroke-width="0.8"
			stroke-linejoin="round"
		/>

		<!-- tier plaque -->
		<path d="M22 46 H42 L39 54 H25 Z" fill="url(#{uid}-gold)" stroke="#7a4a0e" stroke-width="0.7" />
		<path d="M32 47.6 V52.4" stroke="#5a3306" stroke-width="1.8" stroke-linecap="round" />
	</svg>
	<div class="min-w-0">
		<p class="font-hud text-[10px] tracking-[0.22em] text-band-muted uppercase">{t.operator.rank}</p>
		<p class="rank-name font-head text-[17px] leading-tight font-bold tracking-[0.12em] uppercase">
			{t.operator.rankName}
		</p>
	</div>
</div>
