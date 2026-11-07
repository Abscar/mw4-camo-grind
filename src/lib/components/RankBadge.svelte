<!--
	Abscar's ranked badge: the Iridescent emblem from their own screenshot ("Iri", Ranked Play
	Resurgence, Black Ops 7-era Warzone; MW4 Ranked hadn't started on 2026-11-07). The user asked
	for "the real ranked emblem, spot on", so this is drawn after the official emblem: a shouting
	Zeus-like god in iridescent purple metal with curly white-lilac hair and beard, one fist raised
	round a cyan lightning bolt (another bolt behind his head), gold bracers and neck medallion, a
	big bevelled purple hexagon behind him, flaming braziers on both sides, a laurel wreath, a
	winged gable plate with a gold "I" (as in their screenshot), an eagle head and a small fluted
	column. It's our own vector drawing in that emblem's style, not the game's picture (the site is
	public). Lives inside OperatorTag, so it's only shown in the Abscar theme.
-->
<script lang="ts">
	import { t } from '#lib/i18n/en.ts';

	const uid = $props.id();
	const O = '#10041f'; // outline

	/** A laurel leaf pointing along +x from (0, 0). */
	const LEAF = 'M0 0 Q6.5 -4 14 0 Q6.5 4 0 0Z';
	const LEAVES = [
		{ x: 22, y: 108, a: -128 },
		{ x: 14, y: 100, a: -112 },
		{ x: 9, y: 90, a: -100 },
		{ x: 7, y: 80, a: -92 },
		{ x: 7, y: 70, a: -84 }
	];
	const WING = [
		'M42 89 C30 80 15 78 2 81 C11 87 22 93 40 96 Z',
		'M42 94 C29 91 16 92 4 96 C14 100 27 102 42 99 Z',
		'M42 98 C31 99 21 103 12 109 C24 109 34 106 44 102 Z'
	];
	const MIRROR = 'translate(120 0) scale(-1 1)';
	const HEX = '75,-1 111.4,20 111.4,62 75,83 38.6,62 38.6,20';
	const HEX_IN = '75,8 103.6,24.5 103.6,57.5 75,74 46.4,57.5 46.4,24.5';
	const BOLT_HEAD = '42,34 53,26 51,30 66,19 64,23 88,5';
	const BOLT_HAND = '38,0 28,14 31,15 22,30 25,31 14,50 17,51 3,76';
</script>

<div class="rank-card flex items-center gap-2.5 rounded-md py-1.5 pr-3.5 pl-1.5">
	<svg viewBox="0 0 120 120" class="rank-badge size-16 flex-none overflow-visible" aria-hidden="true" focusable="false">
		<defs>
			<!-- iridescent purple metal (robe, arms, bowls, wings) -->
			<linearGradient id="{uid}-iri" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#3a168f" />
				<stop offset="0.28" stop-color="#6a2fe0" />
				<stop offset="0.45" stop-color="#b265ff" />
				<stop offset="0.56" stop-color="#ff5fcf" />
				<stop offset="0.7" stop-color="#5b28c8" />
				<stop offset="0.86" stop-color="#3fb4ff" />
				<stop offset="1" stop-color="#3a168f" />
			</linearGradient>
			<!-- face and hands -->
			<linearGradient id="{uid}-skin" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#c7a2ff" />
				<stop offset="0.55" stop-color="#8650ec" />
				<stop offset="1" stop-color="#5a8cff" />
			</linearGradient>
			<!-- hair and beard -->
			<linearGradient id="{uid}-hair" x1="0" y1="0" x2="0.4" y2="1">
				<stop offset="0" stop-color="#f4ecff" />
				<stop offset="0.5" stop-color="#c6a4ff" />
				<stop offset="1" stop-color="#8a5cf0" />
			</linearGradient>
			<linearGradient id="{uid}-frame" x1="0.2" y1="0" x2="0.8" y2="1">
				<stop offset="0" stop-color="#c08cff" />
				<stop offset="0.35" stop-color="#7a3ff0" />
				<stop offset="0.7" stop-color="#3b1898" />
				<stop offset="1" stop-color="#ff6ad5" />
			</linearGradient>
			<linearGradient id="{uid}-plate" x1="0" y1="0" x2="1" y2="0.4">
				<stop offset="0" stop-color="#5a2fd0" />
				<stop offset="0.42" stop-color="#ff6ad5" />
				<stop offset="0.6" stop-color="#a66cff" />
				<stop offset="1" stop-color="#4cc8ff" />
			</linearGradient>
			<linearGradient id="{uid}-gold" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#fff3c0" />
				<stop offset="0.45" stop-color="#f2c14e" />
				<stop offset="1" stop-color="#a8680f" />
			</linearGradient>
			<radialGradient id="{uid}-fire" cx="0.5" cy="0.85" r="0.8">
				<stop offset="0" stop-color="#fff7b0" />
				<stop offset="0.3" stop-color="#ffc23a" />
				<stop offset="0.65" stop-color="#ff6a1a" />
				<stop offset="1" stop-color="#d8301a" />
			</radialGradient>
			<filter id="{uid}-glow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="1.8" result="b" />
				<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
			</filter>
		</defs>

		<!-- laurel wreath -->
		{#each [false, true] as mirrored (mirrored)}
			<g transform={mirrored ? MIRROR : undefined} fill="url(#{uid}-iri)" stroke={O} stroke-width="1.1">
				<path d="M24 112 Q6 96 7 64" fill="none" stroke="#2a0f66" stroke-width="2" />
				{#each LEAVES as leaf (leaf.y)}
					<path d={LEAF} transform="translate({leaf.x} {leaf.y}) rotate({leaf.a})" />
					<path d={LEAF} transform="translate({leaf.x} {leaf.y}) rotate({leaf.a + 50}) scale(0.8)" />
				{/each}
			</g>
		{/each}

		<!-- big bevelled hexagon behind him -->
		<polygon points={HEX} fill="url(#{uid}-frame)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<polygon points={HEX_IN} fill="#12052a" stroke={O} stroke-width="1.2" />
		<polygon points={HEX_IN} fill="none" stroke="#ff7ad8" stroke-width="0.8" stroke-opacity="0.6" transform="translate(75 41) scale(0.9) translate(-75 -41)" />
		<polyline points="39.4,20 75,-0.1 110.6,20 110.6,61.5" fill="none" stroke="#efdcff" stroke-width="1.3" stroke-opacity="0.85" />
		<polyline points="46.4,24.5 75,8 103.6,24.5" fill="none" stroke="#06010f" stroke-width="1.4" stroke-opacity="0.8" />

		<!-- braziers with fire -->
		<g stroke={O} stroke-width="1.2" stroke-linejoin="round">
			<path d="M16 62 C12 54 18 49 17 42 C22 46 24 49 26 46 C26 42 30 39 29 33 C36 39 41 46 38 53 C40 51 42 49 43 47 C45 53 43 58 41 62 Z" fill="url(#{uid}-fire)" />
			<path d="M22 60 C21 55 24 52 24 48 C27 51 28 53 30 51 C32 54 34 57 33 60 Z" fill="#fff4a8" stroke="none" />
			<path d="M11 61 H45 Q42 71 28 71 Q14 71 11 61 Z" fill="url(#{uid}-iri)" />
			<path d="M25 71 H31 L32 80 H24 Z" fill="url(#{uid}-frame)" />
			<path d="M96 55 C93 48 98 44 97 37 C101 41 102 44 104 41 C104 37 107 34 106 28 C112 34 116 41 113 48 C115 46 116 45 117 43 C118 49 117 52 115 55 Z" fill="url(#{uid}-fire)" />
			<path d="M93 54.5 H119 Q116 63 106 63 Q96 63 93 54.5 Z" fill="url(#{uid}-iri)" />
		</g>

		<!-- robe -->
		<path d="M39 46 C46 39 80 39 89 48 L93 85 C80 89 44 89 33 85 Z" fill="url(#{uid}-iri)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<g fill="none" stroke-linecap="round">
			<path d="M50 57 C52 67 50 77 46 85 M60 59 C60 69 58 79 58 87 M71 57 C73 67 75 77 77 87" stroke="#22094f" stroke-width="1.4" />
			<path d="M54 59 C56 69 54 77 52 85 M75 59 C77 67 80 75 82 83" stroke="#f0dcff" stroke-width="0.9" stroke-opacity="0.65" />
		</g>

		<!-- the bolt behind his head -->
		<g filter="url(#{uid}-glow)" fill="none" stroke-linejoin="miter" stroke-linecap="round">
			<polyline points={BOLT_HEAD} stroke="#4fe6ff" stroke-width="3.8" />
			<polyline points={BOLT_HEAD} stroke="#f2feff" stroke-width="1.4" />
		</g>

		<!-- head: wild curly hair, angry shouting face, big curly beard -->
		<g fill="url(#{uid}-hair)" stroke={O} stroke-width="1.2">
			<circle cx="47.5" cy="24" r="5.2" /><circle cx="50.5" cy="15.5" r="5.6" /><circle cx="58" cy="11" r="5.8" />
			<circle cx="66" cy="13" r="5.3" /><circle cx="71.5" cy="19.5" r="5.2" /><circle cx="72" cy="28" r="4.6" />
			<circle cx="46" cy="31" r="4.6" />
		</g>
		<ellipse cx="59" cy="27" rx="9.5" ry="10.5" fill="url(#{uid}-skin)" stroke={O} stroke-width="1.3" />
		<path
			d="M48.5 30 C45 38 45.5 46 49 50 C50 54.5 54 57 57 55.8 C59 58 62 58 64 55.8 C67 57 71 53.5 70.5 49 C73 45 73 37 69.5 30 C67 36 51 36 48.5 30 Z"
			fill="url(#{uid}-hair)"
			stroke={O}
			stroke-width="1.3"
			stroke-linejoin="round"
		/>
		<path d="M51 41 Q50 46 53 50 M56 43 Q55.5 48 57.5 53 M63 43 Q63.5 48 61.5 53 M68 41 Q69 46 66 50" fill="none" stroke="#7a4ad8" stroke-width="1" stroke-linecap="round" />
		<!-- angry brows, narrowed eyes, open shouting mouth -->
		<path d="M50.5 21 L57.8 24.6 M67.5 21 L60.2 24.6" fill="none" stroke={O} stroke-width="2" stroke-linecap="round" />
		<path d="M53 26.4 L57 26.2 M61 26.2 L65 26.4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" />
		<path d="M59 25.5 L57.6 30.4 L60.4 30.8" fill="none" stroke={O} stroke-width="0.9" stroke-linejoin="round" />
		<ellipse cx="59" cy="36.4" rx="4" ry="4.2" fill="#1a0630" stroke={O} stroke-width="0.8" />
		<path d="M55.6 34 H62.4" stroke="#fff" stroke-width="1.1" />
		<path d="M52 33 Q55.5 30 59 32.4 Q62.5 30 66 33" fill="url(#{uid}-hair)" stroke={O} stroke-width="1.1" stroke-linejoin="round" />

		<!-- gold medallion at the neck -->
		<circle cx="69" cy="58.5" r="4.8" fill="url(#{uid}-gold)" stroke="#6b3a06" stroke-width="1" />
		<circle cx="69" cy="58.5" r="2.3" fill="none" stroke="#8a520c" stroke-width="0.8" />

		<!-- the bolt in his raised fist -->
		<g filter="url(#{uid}-glow)" fill="none" stroke-linejoin="miter" stroke-linecap="round">
			<polyline points={BOLT_HAND} stroke="#4fe6ff" stroke-width="4.6" />
			<polyline points={BOLT_HAND} stroke="#f2feff" stroke-width="1.7" />
			<path d="M31 15 L38 18 M14 50 L8 46" stroke="#9af3ff" stroke-width="1.2" />
		</g>

		<!-- raised arm, gold bracer, fist -->
		<path d="M45 52 Q34 46 25.5 30" fill="none" stroke={O} stroke-width="12.5" stroke-linecap="round" />
		<path d="M45 52 Q34 46 25.5 30" fill="none" stroke="url(#{uid}-iri)" stroke-width="9.6" stroke-linecap="round" />
		<path d="M23.5 39.5 L34 33" stroke={O} stroke-width="8.4" />
		<path d="M23.5 39.5 L34 33" stroke="url(#{uid}-gold)" stroke-width="6" />
		<circle cx="24.5" cy="27" r="6.2" fill="url(#{uid}-skin)" stroke={O} stroke-width="1.3" />
		<path d="M19.5 25 Q24 23.5 29 25.5 M19 28.5 Q24 27 29.5 29" fill="none" stroke={O} stroke-width="0.9" />

		<!-- other arm reaching down, gold bracer, open hand -->
		<path d="M82 52 Q96 60 104 82" fill="none" stroke={O} stroke-width="13" stroke-linecap="round" />
		<path d="M82 52 Q96 60 104 82" fill="none" stroke="url(#{uid}-iri)" stroke-width="10.2" stroke-linecap="round" />
		<path d="M92.5 73 L104.5 66" stroke={O} stroke-width="9" />
		<path d="M92.5 73 L104.5 66" stroke="url(#{uid}-gold)" stroke-width="6.6" />
		<path d="M98 82 C102 77 112 77 116.5 83 C119 88 116.5 94 112 96.5 C108 98.5 102 96.5 100 92 Z" fill="url(#{uid}-skin)" stroke={O} stroke-width="1.3" />
		<path d="M104 86 L111 89 M103 90 L109 94 M106 82 L113 84" fill="none" stroke={O} stroke-width="0.9" stroke-linecap="round" />

		<!-- winged plate with a gold "I", eagle head, fluted column -->
		{#each [false, true] as mirrored (mirrored)}
			<g transform={mirrored ? MIRROR : undefined} fill="url(#{uid}-iri)" stroke={O} stroke-width="1.2" stroke-linejoin="round">
				{#each WING as d (d)}<path {d} />{/each}
			</g>
		{/each}
		<path d="M32 87 L60 78 L88 87 L85.5 101 H34.5 Z" fill="url(#{uid}-plate)" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
		<path d="M36.5 88.4 L60 81.2 L83.5 88.4 L81.6 98.6 H38.4 Z" fill="none" stroke="#ffd6f5" stroke-width="0.9" stroke-opacity="0.75" />
		<path d="M56.6 86 H63.4 M60 86 V96 M56.6 96 H63.4" fill="none" stroke="#4a2503" stroke-width="3.8" stroke-linecap="round" />
		<path d="M56.6 86 H63.4 M60 86 V96 M56.6 96 H63.4" fill="none" stroke="url(#{uid}-gold)" stroke-width="2.1" stroke-linecap="round" />
		<!-- under the plate: a fierce eagle head (hooked beak, angry brow) on a little fluted column -->
		<g stroke={O} stroke-width="1.2" stroke-linejoin="round">
			<path d="M54 112 H66 L65 119.5 H55 Z" fill="#3b1898" />
			<path d="M58 113 V119 M62 113 V119" fill="none" stroke="#7a4ad8" stroke-width="0.8" />
			<path d="M53 112 C50 107 52 102 57 101 C63 100 69 102 69 107 C69 110 66 112.5 61 113 C57 113.4 54.5 113 53 112 Z" fill="url(#{uid}-iri)" />
			<path d="M54.5 103 C50 102.5 46.5 104.5 46.8 108.6 C48 106.8 50 106.6 52.4 107.4 L55 106 Z" fill="url(#{uid}-gold)" stroke-width="1" />
			<path d="M55.6 104.2 L60.4 103 M57 105.6 L58.6 105.2" fill="none" stroke={O} stroke-width="1.3" stroke-linecap="round" />
			<path d="M60 108 Q64 110 67.5 106 M61 105 Q64.5 106.5 68 103.5" fill="none" stroke="#d6b8ff" stroke-width="0.8" stroke-opacity="0.8" />
		</g>
	</svg>
	<div class="min-w-0">
		<p class="font-hud text-[10px] tracking-[0.22em] text-band-muted uppercase">{t.operator.rank}</p>
		<p class="rank-name font-head text-[17px] leading-tight font-bold tracking-[0.12em] uppercase">
			{t.operator.rankName}
		</p>
	</div>
</div>
