<!--
	Phillestar's emblem in the header, next to Abscar's operator tag (2026-11-10, the user's ask). It is the
	head of the operator drawn for Phillestar's easter eggs (NukeOperator.svelte: black helmet, chrome skull
	face, yellow eyes, cyan neon arcs, yellow ear cup, antenna) with a bit of the vest below. No holk in his
	mouth like Abscar: he holds a steaming hamburger with one bite gone, in his glowing radioactive hand.
	The head is a copy of NukeOperator's `head` symbol (same coordinates, scaled into this 64×64 box).
	Our own cartoon, decoration only (aria-hidden; the callsign next to it is the text).
-->
<script lang="ts">
	const uid = $props.id(); // ids must be unique per drawing
	const u = (name: string) => `${uid}-${name}`;
	const O = '#0f0d0b';

	const TEETH = [87.4, 91.8, 96.2, 100.6, 105, 109.4];
	/** sesame seeds on the top bun: [x, y, angle] */
	const SEEDS = [
		[49.4, 38.5, -20],
		[53, 37.3, 5],
		[57, 38.3, 25],
		[51.2, 40.6, -10],
		[55.2, 40.3, 15],
		[59.4, 40.7, 30]
	];
	/** steam curling up from the hot burger (where Abscar has smoke from his holk) */
	const STEAM = [
		'M48 31 C46 27.5 50 25 48 21.5 C46.5 18.5 49.5 16.5 48.1 13',
		'M53.4 30.5 C55.4 27 51.6 24.5 53.6 20.5 C55.2 17.5 52.2 15 53.6 11.5',
		'M58.9 31.3 C57.3 28 60.7 25.5 59.1 22 C57.9 19.5 60.3 17.5 59.3 14.5'
	];
</script>

<svg viewBox="0 0 64 64" class="size-16 flex-none overflow-visible sm:size-20" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={u('skull')} x1="0" y1="0" x2=".35" y2="1">
			<stop offset="0" stop-color="#f1f6fb" /><stop offset=".42" stop-color="#a3b6ca" /><stop offset=".78" stop-color="#56677b" /><stop offset="1" stop-color="#2b3543" />
		</linearGradient>
		<linearGradient id={u('panel')} x1=".15" y1="0" x2=".85" y2="1">
			<stop offset="0" stop-color="#8fd14f" /><stop offset=".35" stop-color="#e9dd3a" /><stop offset=".7" stop-color="#f4c233" /><stop offset="1" stop-color="#f0a12e" />
		</linearGradient>
		<radialGradient id={u('burn')} cx=".45" cy=".35" r=".85">
			<stop offset="0" stop-color="#fff2b0" /><stop offset=".28" stop-color="#ffb13a" /><stop offset=".55" stop-color="#ff6a1a" /><stop offset=".8" stop-color="#b8320f" /><stop offset="1" stop-color="#5c1a0b" />
		</radialGradient>
		<radialGradient id={u('bun')} cx=".38" cy=".3" r=".85">
			<stop offset="0" stop-color="#ffd896" /><stop offset=".45" stop-color="#f0a24a" /><stop offset="1" stop-color="#b0581b" />
		</radialGradient>
		<linearGradient id={u('bun-low')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#e8a050" /><stop offset="1" stop-color="#a5571b" />
		</linearGradient>
		<filter id={u('glow')} x="-60%" y="-60%" width="220%" height="220%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
			<feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
		</filter>
		<filter id={u('big-glow')} x="-60%" y="-60%" width="220%" height="220%">
			<feGaussianBlur stdDeviation="2.4" />
		</filter>
		<filter id={u('steam-blur')} x="-100%" y="-30%" width="300%" height="160%">
			<feGaussianBlur stdDeviation=".55" />
		</filter>
		<!-- the bite out of the burger's top-left corner -->
		<mask id={u('bite')} maskUnits="userSpaceOnUse" x="38" y="30" width="30" height="26">
			<rect x="38" y="30" width="30" height="26" fill="#fff" />
			<g fill="#000"><circle cx="44" cy="38.4" r="2.5" /><circle cx="46" cy="35.9" r="2" /><circle cx="43.5" cy="41.5" r="2" /></g>
		</mask>
	</defs>

	<!-- shoulders, vest panel with the red skull roundel, collar -->
	<path d="M5 64.5 C6 55 14 50.5 30 50 C46 50.5 54 55 55 64.5 Z" fill="#2a2c31" stroke={O} stroke-width="1.1" stroke-linejoin="round" />
	<path d="M23.5 50.5 L36.5 50.5 L37.5 64.5 L22.5 64.5 Z" fill="url(#{u('panel')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
	<circle cx="30" cy="58.6" r="3.4" fill="none" stroke="#d8322b" stroke-width="1.1" />
	<circle cx="30" cy="57.9" r="1.5" fill="#d8322b" />
	<rect x="29" y="58.9" width="2" height="1.3" rx=".3" fill="#d8322b" />
	<path d="M18.5 49 Q30 54.5 41.5 49 L40.6 52.8 Q30 57.4 19.4 52.8 Z" fill="#b8c63c" stroke={O} stroke-width=".8" stroke-linejoin="round" />

	<!-- the helmet: black shell, chrome skull face, cyan neon arcs, yellow ear cup, antenna (NukeOperator's head) -->
	<g transform="translate(2 0) scale(.5) translate(-44 -20)">
		<ellipse cx="100" cy="76" rx="46" ry="46" fill="#17181c" stroke={O} stroke-width="2.4" />
		<path d="M70 44 Q86 34 104 34" fill="none" stroke="#4d525e" stroke-width="3" stroke-linecap="round" />
		<ellipse cx="57" cy="84" rx="7" ry="12" fill="#f3c22c" stroke={O} stroke-width="2" />
		<ellipse cx="57" cy="84" rx="3.4" ry="6.8" fill="#c7941c" />
		<ellipse cx="143" cy="84" rx="6" ry="11" fill="#25272d" stroke={O} stroke-width="2" />
		<path d="M100 44 C121 44 132 58 132 74 C132 85 128 92 125 96 L121 108 C117 114 110 117 100 117 C90 117 83 114 79 108 L75 96 C72 92 68 85 68 74 C68 58 79 44 100 44 Z" fill="url(#{u('skull')})" stroke={O} stroke-width="2.2" />
		<path d="M73 69 Q100 59 127 69" fill="none" stroke="#6d7f93" stroke-width="1.4" />
		<path d="M76 74 C78 66 92 66 95 74 C96 82 88 86 82 85 C78 84 75 80 76 74 Z M124 74 C122 66 108 66 105 74 C104 82 112 86 118 85 C122 84 125 80 124 74 Z" fill="#0a0c11" />
		<g class="pe-eyes" filter="url(#{u('glow')})" fill="#ffe04a"><circle cx="86" cy="77" r="2.8" /><circle cx="114" cy="77" r="2.8" /></g>
		<path d="M100 86 L95.5 95 Q100 97.5 104.5 95 Z" fill="#0a0c11" />
		<path d="M78 96 Q84 99 86 104 M122 96 Q116 99 114 104" fill="none" stroke="#55667a" stroke-width="1.2" />
		<rect x="86" y="101" width="28" height="10" rx="3" fill="#0a0c11" />
		<g fill="#c9d6e3">
			{#each TEETH as x (x)}<rect {x} y="102" width="3.4" height="8" rx=".8" />{/each}
		</g>
		<path d="M86 106 H114" stroke="#0a0c11" stroke-width="1" />
		<g class="pe-neon" fill="none" stroke-linecap="round">
			<g filter="url(#{u('glow')})" stroke="#39f3e2" stroke-width="3.4"><path d="M70 40 C52 56 50 94 70 118" /><path d="M128 36 C150 52 152 96 132 120" /></g>
			<g stroke="#d4fffb" stroke-width="1.1"><path d="M70 40 C52 56 50 94 70 118" /><path d="M128 36 C150 52 152 96 132 120" /></g>
		</g>
		<path d="M134 44 L146 26" stroke={O} stroke-width="2.2" />
		<circle cx="146" cy="26" r="2.6" fill="#39f3e2" filter="url(#{u('glow')})" />
	</g>

	<!-- the hamburger, held up in the glowing radioactive hand -->
	<g class="pe-burger">
		<path d="M49.6 50.8 H62.8 Q64.2 50.8 63.9 52.2 L63 55.6 Q62.6 56.8 61.4 56.8 L65.6 64.5 H55.4 L51.4 56.8 Q49.9 56.8 49.7 55.4 Z" fill="#ff6a1a" opacity=".7" filter="url(#{u('big-glow')})" />
		<path d="M52 56.2 L61.6 56.2 L65.6 64.5 L55.4 64.5 Z" fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width=".8" stroke-linejoin="round" />
		<path d="M49.6 50.8 H62.8 Q64.2 50.8 63.9 52.2 L63 55.6 Q62.6 56.8 61.4 56.8 H51.4 Q49.9 56.8 49.7 55.4 Z" fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width=".8" />
		<path d="M57 58.4 l1.4 2 l-.7 2.2 M54.6 52.8 l1.2 1.4" fill="none" stroke="#fff2b0" stroke-width=".5" opacity=".9" />

		<!-- burger + fingers drawn at 1.25× around the grip, so the burger reads at 64 px -->
		<g transform="translate(56.5 51) scale(1.25) translate(-56.5 -51)">
			<g mask="url(#{u('bite')})">
				<path d="M43.8 47.8 H62.2 L61.6 50 Q61.3 51.2 60 51.2 H46 Q44.7 51.2 44.4 50 Z" fill="url(#{u('bun-low')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
				<rect x="43" y="44.7" width="20" height="3.4" rx="1.7" fill="#5c2f18" stroke={O} stroke-width=".8" />
				<path d="M46 46.6 h2 M51 46.9 h2.4 M56.5 46.6 h2" stroke="#2c1308" stroke-width=".6" stroke-linecap="round" />
				<path d="M43.4 43.9 H62.6 L62.4 45.3 H58.6 L57.2 47.6 L55.8 45.3 H48 L47 46.8 L46 45.3 H43.6 Z" fill="#ffc928" stroke="#a87a0c" stroke-width=".5" stroke-linejoin="round" />
				<path
					d="M42.8 42.2 H63.2 L63.4 43.4 Q62.4 44.8 61.2 43.6 Q60 44.9 58.8 43.6 Q57.6 44.9 56.4 43.6 Q55.2 44.9 54 43.6 Q52.8 44.9 51.6 43.6 Q50.4 44.9 49.2 43.6 Q48 44.9 46.8 43.6 Q45.6 44.9 44.4 43.6 Q43.2 44.8 42.6 43.4 Z"
					fill="#66c93c"
					stroke="#24561a"
					stroke-width=".5"
					stroke-linejoin="round"
				/>
				<path d="M43.5 42.5 C43.5 37 47.5 35.5 53 35.5 C58.5 35.5 62.5 37 62.5 42.5 Z" fill="url(#{u('bun')})" stroke={O} stroke-width=".8" stroke-linejoin="round" />
				<ellipse cx="50.4" cy="37.4" rx="2.6" ry=".9" fill="#fff3c8" opacity=".5" />
				{#each SEEDS as [x, y, a], i (i)}
					<ellipse cx={x} cy={y} rx=".75" ry=".42" transform="rotate({a} {x} {y})" fill="#fff4d6" />
				{/each}
			</g>

			<!-- fingers wrapped round the bottom bun, thumb on the near side -->
			<g fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width=".6">
				{#each [51, 53.8, 56.6, 59.4] as x (x)}<rect {x} y="47.3" width="2.7" height="4.8" rx="1.3" />{/each}
				<path d="M51.2 53 C48.8 52.6 48.1 50.2 49.3 48.8 C50.1 47.9 51.5 48.2 52.1 49.4 Z" />
			</g>
		</g>
	</g>

	<g filter="url(#{u('steam-blur')})" fill="none" stroke="#fbf8f2" stroke-width="1.8" stroke-linecap="round">
		{#each STEAM as d, i (i)}<path class="pe-steam" {d} />{/each}
	</g>
</svg>

<style>
	.pe-eyes {
		animation: pe-eyes 3s ease-in-out infinite;
	}
	@keyframes pe-eyes {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}
	/* the neon arcs flicker now and then, like a tube */
	.pe-neon {
		animation: pe-neon 6s linear infinite;
	}
	@keyframes pe-neon {
		0%,
		40%,
		43%,
		46%,
		100% {
			opacity: 1;
		}
		41.5%,
		44.5% {
			opacity: 0.4;
		}
	}
	/* the burger lifts towards his mouth and back */
	.pe-burger {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: pe-bob 3.6s ease-in-out infinite;
	}
	@keyframes pe-bob {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		50% {
			transform: translate(-0.8px, -1.2px) rotate(-5deg);
		}
	}
	/* steam: visible but still with reduced motion (which stops every animation) */
	.pe-steam {
		opacity: 0.6;
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: pe-steam 3.3s ease-out infinite;
	}
	.pe-steam:nth-child(2) {
		animation-delay: -1.1s;
	}
	.pe-steam:nth-child(3) {
		animation-delay: -2.2s;
	}
	@keyframes pe-steam {
		0% {
			opacity: 0;
			transform: translateY(2px) scaleY(0.6);
		}
		30% {
			opacity: 0.95;
		}
		100% {
			opacity: 0;
			transform: translateY(-5px) scaleY(1.1);
		}
	}
</style>
