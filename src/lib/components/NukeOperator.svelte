<!--
	Abscar theme easter egg (2026-11-10): the user's friend's favourite operator — the "nuke" skin
	(black helmet with a chrome skull face, cyan neon arcs, yellow ear cup, a glowing radioactive
	arm, yellow-green vest panel with a red skull roundel) holding a compact SMG in the "Melty" camo
	(navy with blue contour lines and glowing red radiation signs and bars). Our own cartoon, drawn
	from the user's screenshots; no skin, camo or game names on the page. Decoration: aria-hidden.
	  peek     — head, hands and gun peeking over a line (the SMG box)
	  badge    — round hazard-stripe patch (the Divergence & Mastery heading)
	  meltdown — standing in front of a mushroom cloud (the "Divergence unlocked" flash)
-->
<script lang="ts">
	let { variant }: { variant: 'peek' | 'badge' | 'meltdown' } = $props();

	const uid = $props.id(); // ids must be unique per drawing
	const u = (name: string) => `${uid}-${name}`;
	const O = '#0f0d0b';

	const VIEWBOX = { peek: '10 14 150 110', badge: '0 0 200 200', meltdown: '0 0 220 260' } as const;
</script>

<svg class="nuke-op nuke-op-{variant}" viewBox={VIEWBOX[variant]} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={u('skull')} x1="0" y1="0" x2=".35" y2="1">
			<stop offset="0" stop-color="#f1f6fb" /><stop offset=".42" stop-color="#a3b6ca" /><stop offset=".78" stop-color="#56677b" /><stop offset="1" stop-color="#2b3543" />
		</linearGradient>
		<linearGradient id={u('panel')} x1=".15" y1="0" x2=".85" y2="1">
			<stop offset="0" stop-color="#8fd14f" /><stop offset=".35" stop-color="#e9dd3a" /><stop offset=".7" stop-color="#f4c233" /><stop offset="1" stop-color="#f0a12e" />
		</linearGradient>
		<linearGradient id={u('pants')} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#6e2620" /><stop offset=".45" stop-color="#7a3a26" /><stop offset=".8" stop-color="#4a5a2a" /><stop offset="1" stop-color="#34502a" />
		</linearGradient>
		<radialGradient id={u('burn')} cx=".45" cy=".35" r=".85">
			<stop offset="0" stop-color="#fff2b0" /><stop offset=".28" stop-color="#ffb13a" /><stop offset=".55" stop-color="#ff6a1a" /><stop offset=".8" stop-color="#b8320f" /><stop offset="1" stop-color="#5c1a0b" />
		</radialGradient>
		<filter id={u('glow')} x="-60%" y="-60%" width="220%" height="220%">
			<feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
			<feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
		</filter>
		<filter id={u('big-glow')} x="-60%" y="-60%" width="220%" height="220%">
			<feGaussianBlur stdDeviation="5" />
		</filter>

		<!-- radiation sign -->
		<symbol id={u('tref')} viewBox="-10 -10 20 20">
			<circle r="1.9" />
			<path id={u('blade')} d="M-1.4 -2.4 L-4 -6.93 A8 8 0 0 1 4 -6.93 L1.4 -2.4 A2.8 2.8 0 0 0 -1.4 -2.4 Z" />
			<use href="#{u('blade')}" transform="rotate(120)" />
			<use href="#{u('blade')}" transform="rotate(240)" />
		</symbol>

		<!-- the Melty camo -->
		<pattern id={u('melty')} patternUnits="userSpaceOnUse" width="30" height="30" patternTransform="scale(.75) rotate(-8)">
			<rect width="30" height="30" fill="#161c3c" />
			<path d="M0 8 C8 3 14 15 30 9 M0 19 C10 14 18 26 30 20 M0 27 C6 24 12 31 19 28" fill="none" stroke="#3a5a98" stroke-width="1.1" />
			<path d="M0 13 C9 9 15 20 30 14" fill="none" stroke="#ff2e2e" stroke-width=".9" opacity=".8" />
			<use href="#{u('tref')}" x="1" y="8" width="13" height="13" fill="#ff3030" />
			<rect x="15" y="2" width="13" height="4" rx="1" fill="#ff3a3a" />
			<circle cx="23" cy="21" r="4" fill="none" stroke="#ff3a3a" stroke-width="1.6" />
			<circle cx="23" cy="21" r="1.4" fill="#ff3a3a" />
			<rect x="3" y="25" width="9" height="3" rx=".8" fill="#ff3a3a" />
		</pattern>

		<!-- compact SMG in the Melty camo, muzzle up (top of the gun faces right) -->
		<symbol id={u('smg')} viewBox="0 0 30 100">
			<g filter="url(#{u('glow')})">
				<g fill="url(#{u('melty')})">
					<rect x="13.5" y="0" width="3" height="5" />
					<rect x="12" y="3" width="6" height="21" />
					<rect x="8" y="22" width="15" height="44" rx="2" />
					<rect x="23" y="28" width="3.4" height="26" />
					<path d="M8 37 L0 35 L0 46 L8 48 Z" />
					<path d="M8 55 L1.5 59 L3.5 69 L8.5 65 Z" />
					<rect x="10" y="66" width="10" height="21" />
					<rect x="8" y="85" width="14" height="7" rx="2" />
				</g>
				<use href="#{u('tref')}" x="10.5" y="27" width="10" height="10" fill="#ff3b30" />
				<rect x="10" y="44" width="11" height="3" rx=".8" fill="#ff3b30" />
				<circle cx="15.5" cy="57" r="2.6" fill="none" stroke="#ff3b30" stroke-width="1.2" />
				<use href="#{u('tref')}" x="11" y="70" width="8" height="8" fill="#ff3b30" />
			</g>
			<g fill="none" stroke={O} stroke-width="1.6" stroke-linejoin="round">
				<rect x="13.5" y="0" width="3" height="5" />
				<rect x="12" y="3" width="6" height="21" />
				<rect x="8" y="22" width="15" height="44" rx="2" />
				<path d="M23 28 h3.4 v26 h-3.4 M23 32 h3.4 M23 36 h3.4 M23 40 h3.4 M23 44 h3.4 M23 48 h3.4" />
				<path d="M8 37 L0 35 L0 46 L8 48 Z" />
				<path d="M8 55 L1.5 59 L3.5 69 L8.5 65 Z" />
				<rect x="10" y="66" width="10" height="21" />
				<rect x="8" y="85" width="14" height="7" rx="2" />
			</g>
		</symbol>

		<!-- the helmet: black shell, chrome skull face, cyan neon arcs, yellow ear cup, antenna -->
		<symbol id={u('head')} viewBox="44 20 112 106">
			<ellipse cx="100" cy="76" rx="46" ry="46" fill="#17181c" stroke={O} stroke-width="2.4" />
			<path d="M70 44 Q86 34 104 34" fill="none" stroke="#4d525e" stroke-width="3" stroke-linecap="round" />
			<ellipse cx="57" cy="84" rx="7" ry="12" fill="#f3c22c" stroke={O} stroke-width="2" />
			<ellipse cx="57" cy="84" rx="3.4" ry="6.8" fill="#c7941c" />
			<ellipse cx="143" cy="84" rx="6" ry="11" fill="#25272d" stroke={O} stroke-width="2" />
			<path d="M100 44 C121 44 132 58 132 74 C132 85 128 92 125 96 L121 108 C117 114 110 117 100 117 C90 117 83 114 79 108 L75 96 C72 92 68 85 68 74 C68 58 79 44 100 44 Z" fill="url(#{u('skull')})" stroke={O} stroke-width="2.2" />
			<path d="M73 69 Q100 59 127 69" fill="none" stroke="#6d7f93" stroke-width="1.4" />
			<path d="M76 74 C78 66 92 66 95 74 C96 82 88 86 82 85 C78 84 75 80 76 74 Z M124 74 C122 66 108 66 105 74 C104 82 112 86 118 85 C122 84 125 80 124 74 Z" fill="#0a0c11" />
			<g class="nuke-op-eyes" filter="url(#{u('glow')})" fill="#ffe04a"><circle cx="86" cy="77" r="2.8" /><circle cx="114" cy="77" r="2.8" /></g>
			<path d="M100 86 L95.5 95 Q100 97.5 104.5 95 Z" fill="#0a0c11" />
			<path d="M78 96 Q84 99 86 104 M122 96 Q116 99 114 104" fill="none" stroke="#55667a" stroke-width="1.2" />
			<rect x="86" y="101" width="28" height="10" rx="3" fill="#0a0c11" />
			<g fill="#c9d6e3">
				{#each [87.4, 91.8, 96.2, 100.6, 105, 109.4] as x (x)}<rect {x} y="102" width="3.4" height="8" rx=".8" />{/each}
			</g>
			<path d="M86 106 H114" stroke="#0a0c11" stroke-width="1" />
			<g fill="none" stroke-linecap="round">
				<g filter="url(#{u('glow')})" stroke="#39f3e2" stroke-width="3.4"><path d="M70 40 C52 56 50 94 70 118" /><path d="M128 36 C150 52 152 96 132 120" /></g>
				<g stroke="#d4fffb" stroke-width="1.1"><path d="M70 40 C52 56 50 94 70 118" /><path d="M128 36 C150 52 152 96 132 120" /></g>
			</g>
			<path d="M134 44 L146 26" stroke={O} stroke-width="2.2" />
			<circle cx="146" cy="26" r="2.6" fill="#39f3e2" filter="url(#{u('glow')})" />
		</symbol>
	</defs>

	{#if variant === 'peek'}
		<use href="#{u('smg')}" x="20" y="18" width="30" height="100" transform="rotate(-10 35 118)" />
		<g transform="rotate(-9 100 112)"><use href="#{u('head')}" x="44" y="44" width="112" height="106" /></g>
		<rect x="50" y="108" width="22" height="15" rx="6" fill="#141518" stroke={O} stroke-width="2" />
		<path d="M56 110 v11 M61 110 v11 M66 110 v11" stroke="#33363d" stroke-width="1.2" />
		<rect x="126" y="108" width="22" height="15" rx="6" fill="#ff6a1a" opacity=".75" filter="url(#{u('big-glow')})" />
		<rect x="126" y="108" width="22" height="15" rx="6" fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width="2" />
		<path d="M132 110 v11 M137 110 v11 M142 110 v11" stroke="#b8320f" stroke-width="1.2" />
	{:else if variant === 'badge'}
		<defs>
			<pattern id={u('hazard')} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
				<rect width="14" height="14" fill="#f3c22c" /><rect width="7" height="14" fill="#16161a" />
			</pattern>
			<radialGradient id={u('badge-bg')} cx=".5" cy=".55" r=".6">
				<stop offset="0" stop-color="#7a2410" /><stop offset=".6" stop-color="#2a1620" /><stop offset="1" stop-color="#140f1c" />
			</radialGradient>
			<clipPath id={u('clip')}><circle cx="100" cy="100" r="80" /></clipPath>
		</defs>
		<circle class="nuke-op-ring" cx="100" cy="100" r="96" fill="url(#{u('hazard')})" stroke={O} stroke-width="4" />
		<circle cx="100" cy="100" r="80" fill="url(#{u('badge-bg')})" stroke={O} stroke-width="3.5" />
		<g clip-path="url(#{u('clip')})">
			<use href="#{u('tref')}" x="40" y="30" width="120" height="120" fill="#ff5a1a" opacity=".18" />
			<use href="#{u('smg')}" x="14" y="18" width="42" height="140" transform="rotate(-30 35 90)" />
			<path d="M150 150 Q172 156 182 200 L150 200 Z" fill="#ff6a1a" opacity=".8" filter="url(#{u('big-glow')})" />
			<path d="M22 200 Q30 152 100 146 Q170 152 178 200 Z" fill="#2a2c31" stroke={O} stroke-width="2.4" />
			<path d="M144 154 Q170 160 178 200 L152 200 Z" fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width="2" />
			<path d="M86 148 L114 148 L118 200 L82 200 Z" fill="url(#{u('panel')})" stroke={O} stroke-width="1.8" />
			<circle cx="100" cy="172" r="9" fill="none" stroke="#d8322b" stroke-width="2.4" />
			<circle cx="100" cy="170.5" r="3.8" fill="#d8322b" /><rect x="97.6" y="173" width="4.8" height="3.2" rx=".6" fill="#d8322b" />
			<path d="M78 142 Q100 152 122 142 L120 151 Q100 158 80 151 Z" fill="#b8c63c" stroke={O} stroke-width="1.8" />
			<g transform="translate(100 92) scale(1.12) translate(-100 -78)"><use href="#{u('head')}" x="44" y="20" width="112" height="106" /></g>
		</g>
	{:else}
		<defs>
			<radialGradient id={u('cloud')} cx=".5" cy=".62" r=".6">
				<stop offset="0" stop-color="#fff6c8" /><stop offset=".3" stop-color="#ffc24a" /><stop offset=".62" stop-color="#ff6a1a" /><stop offset="1" stop-color="#8e2410" />
			</radialGradient>
			<linearGradient id={u('stem')} x1="0" y1="0" x2="1" y2="0">
				<stop offset="0" stop-color="#9a2c12" /><stop offset=".5" stop-color="#ffb13a" /><stop offset="1" stop-color="#9a2c12" />
			</linearGradient>
		</defs>
		<g class="nuke-op-cloud">
			<circle cx="110" cy="80" r="80" fill="#ff6a1a" opacity=".35" filter="url(#{u('big-glow')})" />
			<ellipse cx="110" cy="246" rx="96" ry="16" fill="#7a2a12" stroke={O} stroke-width="2" />
			<path d="M94 250 C98 200 94 160 92 128 L128 128 C126 160 122 200 126 250 Z" fill="url(#{u('stem')})" stroke={O} stroke-width="2" />
			<ellipse cx="110" cy="138" rx="50" ry="9" fill="#ff8a2a" stroke={O} stroke-width="2" />
			<g fill="url(#{u('cloud')})" stroke={O} stroke-width="2">
				<circle cx="64" cy="96" r="30" /><circle cx="156" cy="96" r="30" /><circle cx="86" cy="62" r="32" /><circle cx="136" cy="62" r="32" /><circle cx="110" cy="84" r="44" />
			</g>
			<path d="M78 84 Q110 104 142 84" fill="none" stroke="#fff6c8" stroke-width="2" opacity=".7" />
		</g>
		<!-- the whole operator, standing, SMG raised by the head -->
		<g transform="translate(40 90) scale(.7)">
			<ellipse cx="100" cy="242" rx="52" ry="6" fill="#000" opacity=".35" />
			<g stroke={O} stroke-width="2" stroke-linejoin="round">
				<path d="M72 182 L98 182 L97 226 L74 226 Z" fill="url(#{u('pants')})" />
				<path d="M102 182 L128 182 L126 226 L103 226 Z" fill="url(#{u('pants')})" />
				<path d="M72 224 L98 224 L99 236 Q99 240 95 240 L70 240 Q66 240 67 236 Z" fill="#121214" />
				<path d="M102 224 L128 224 L133 236 Q134 240 130 240 L105 240 Q101 240 101 236 Z" fill="#121214" />
			</g>
			<g fill="#1d1f22" stroke="#e2b52c" stroke-width="1.6"><rect x="74" y="200" width="22" height="13" rx="5" /><rect x="104" y="200" width="22" height="13" rx="5" /></g>
			<path d="M134 128 C146 130 150 140 150 156 L152 182 C152 186 144 187 143 182 L140 158 C139 148 136 142 132 140 Z" fill="#ff6a1a" opacity=".75" filter="url(#{u('big-glow')})" />
			<path d="M134 128 C146 130 150 140 150 156 L152 182 C152 186 144 187 143 182 L140 158 C139 148 136 142 132 140 Z" fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width="1.8" />
			<path d="M143 146 l3 6 l-2 5 M147 164 l-2 5 l2 4" fill="none" stroke="#fff2b0" stroke-width="1" opacity=".9" />
			<circle cx="148" cy="189" r="10" fill="#ff6a1a" opacity=".7" filter="url(#{u('big-glow')})" />
			<circle cx="148" cy="188" r="8" fill="url(#{u('burn')})" stroke="#3a0f06" stroke-width="1.8" />
			<path d="M64 124 Q100 114 136 124 L137 176 Q100 182 63 176 Z" fill="#2a2c31" stroke={O} stroke-width="2.4" stroke-linejoin="round" />
			<path d="M67 152 H84 M67 159 H84 M116 152 H133 M116 159 H133" stroke="#17181c" stroke-width="2" />
			<path d="M88 124 L112 124 L114 168 L100 177 L86 168 Z" fill="url(#{u('panel')})" stroke={O} stroke-width="1.6" stroke-linejoin="round" />
			<circle cx="100" cy="142" r="7.5" fill="none" stroke="#d8322b" stroke-width="2.2" />
			<circle cx="100" cy="140.5" r="3.2" fill="#d8322b" /><rect x="98" y="142.6" width="4" height="2.8" rx=".6" fill="#d8322b" />
			<path d="M89 159 L100 166 L111 159 M89 164 L100 171 L111 164" fill="none" stroke="#2a2c31" stroke-width="2" />
			<path d="M130 122 Q144 121 147 134 L135 141 Z" fill="#2a2c31" stroke={O} stroke-width="2" stroke-linejoin="round" />
			<rect x="70" y="128" width="8" height="7" rx="1.5" fill="#c4322a" />
			<rect x="64" y="174" width="72" height="10" rx="2" fill="#b8c63c" stroke={O} stroke-width="2" />
			<rect x="93" y="173" width="14" height="12" rx="2" fill="#cdbf8f" stroke={O} stroke-width="1.6" />
			<path d="M80 120 Q100 128 120 120 L118 127 Q100 133 82 127 Z" fill="#b8c63c" stroke={O} stroke-width="1.6" />
			<g fill="#2e3138" stroke={O} stroke-width="2" stroke-linejoin="round">
				<path d="M72 124 C60 126 44 138 36 150 C34 158 44 162 48 156 C54 146 64 140 74 138 Z" />
				<path d="M34 152 C28 136 22 116 22 102 L32 102 C32 116 38 134 46 150 Z" />
			</g>
			<path d="M31 146 L27 120" stroke="#39f3e2" stroke-width="2" filter="url(#{u('glow')})" />
			<use href="#{u('smg')}" x="16" y="14" width="39" height="130" />
			<rect x="17" y="92" width="16" height="14" rx="5" fill="#141518" stroke={O} stroke-width="2" />
			<path d="M19 96.5 H31 M19 100.5 H31" stroke="#33363d" stroke-width="1.2" />
			<use href="#{u('head')}" x="44" y="20" width="112" height="106" />
		</g>
	{/if}
</svg>
