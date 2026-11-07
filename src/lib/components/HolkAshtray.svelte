<!--
	Abscar decoration at the right end of the search row: the user's own white holk picture
	(assets/holk.webp) turned around (burning end left) and resting in a rest of a heavy glass
	ashtray, the way you put it down for a second (the user's ask, 2026-11-07). The burning end
	hangs over the bowl above a little ash pile that glows faintly; the filter end leans down
	towards the table. The ashtray is our own drawing, cartoon style with a dark outline to match
	the picture. One SVG so the joint can sit between the ashtray and the near lip of its rest.
	Pure decoration (aria-hidden).
-->
<script lang="ts">
	import holkPic from '#lib/assets/holk.webp';

	const id = $props.id();

	// The ashtray, seen a little from above: rim plane centre (CX, CY), outer rim radii, wall height.
	const CX = 210;
	const CY = 150;
	const RX = 180;
	const RY = 62;
	const WALL = 46;
	// The picture (560 × 146) mirrored, then turned so the point (210, 111) on the joint (in the
	// mirrored picture's own pixels) lies in the right-hand rest at (364, 151).
	const holkTransform = 'translate(364 151) rotate(9) translate(-210 -111) matrix(-1 0 0 1 560 0)';
</script>

<svg class="toolbar-holk abscar-only" viewBox="24 8 692 256" width="692" height="256" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="{id}-wall" x1="0" x2="1">
			<stop offset="0" stop-color="#3d5560" />
			<stop offset="0.12" stop-color="#6f8d99" />
			<stop offset="0.32" stop-color="#b4cdd6" />
			<stop offset="0.43" stop-color="#eef7f9" />
			<stop offset="0.5" stop-color="#a9c3cd" />
			<stop offset="0.8" stop-color="#6e8b97" />
			<stop offset="1" stop-color="#3f5762" />
		</linearGradient>
		<linearGradient id="{id}-rim" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#93acb7" />
			<stop offset="0.55" stop-color="#cfe1e7" />
			<stop offset="1" stop-color="#eef7f9" />
		</linearGradient>
		<linearGradient id="{id}-bowl" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#2f444e" />
			<stop offset="1" stop-color="#5f7a86" />
		</linearGradient>
		<radialGradient id="{id}-floor" cx="0.5" cy="0.45" r="0.6">
			<stop offset="0" stop-color="#94aeb8" />
			<stop offset="1" stop-color="#5c7783" />
		</radialGradient>
		<radialGradient id="{id}-ash" cx="0.45" cy="0.3" r="0.75">
			<stop offset="0" stop-color="#d2cdc5" />
			<stop offset="0.5" stop-color="#9c968f" />
			<stop offset="1" stop-color="#6b6661" />
		</radialGradient>
		<radialGradient id="{id}-glow">
			<stop offset="0" stop-color="#ff8a2a" stop-opacity="0.9" />
			<stop offset="0.5" stop-color="#ff5a14" stop-opacity="0.35" />
			<stop offset="1" stop-color="#ff5a14" stop-opacity="0" />
		</radialGradient>
		<clipPath id="{id}-inside">
			<ellipse cx={CX} cy={CY + 1} rx={RX - 32} ry={RY - 12} />
		</clipPath>
		<filter id="{id}-soft" x="-20%" y="-50%" width="140%" height="200%">
			<feGaussianBlur stdDeviation="5" />
		</filter>
	</defs>

	<!-- shadows on the table: the ashtray's, and the joint's running out to the filter end -->
	<ellipse cx={CX + 14} cy={CY + WALL + 6} rx={RX + 4} ry={RY - 6} fill="#000" opacity="0.5" filter="url(#{id}-soft)" />
	<path d="M386 200 L690 226 L694 236 L386 206 Z" fill="#000" opacity="0.4" filter="url(#{id}-soft)" />
	<ellipse cx="686" cy="234" rx="34" ry="6" fill="#000" opacity="0.5" filter="url(#{id}-soft)" />

	<g stroke="#1a120b" stroke-width="3" stroke-linejoin="round">
		<!-- outer wall (front half) -->
		<path
			d="M{CX - RX} {CY} L{CX - RX + 10} {CY + WALL} A{RX - 10} {RY - 4} 0 0 0 {CX + RX - 10} {CY + WALL} L{CX + RX} {CY} A{RX} {RY} 0 0 1 {CX - RX} {CY} Z"
			fill="url(#{id}-wall)"
		/>
		<!-- rim top -->
		<ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#{id}-rim)" />
		<!-- the bowl: inner wall, then the floor -->
		<ellipse cx={CX} cy={CY + 1} rx={RX - 32} ry={RY - 12} fill="url(#{id}-bowl)" />
	</g>
	<g clip-path="url(#{id}-inside)">
		<ellipse cx={CX} cy={CY + 19} rx={RX - 56} ry={RY - 20} fill="url(#{id}-floor)" />
		<!-- an old roach and loose ash flakes -->
		<g transform="rotate(12 128 180)" stroke="#1a120b" stroke-width="2">
			<rect x="110" y="174" width="30" height="12" rx="4" fill="#efe8d6" />
			<rect x="104" y="174" width="9" height="12" rx="3" fill="#2a2420" />
			<path d="M120 176 L122 184 M128 175 L130 185" stroke="#b9ad92" stroke-width="1.4" />
		</g>
		<g fill="#a8a39c" stroke="#3b3632" stroke-width="1.2">
			<ellipse cx="262" cy="184" rx="7" ry="3" /><ellipse cx="150" cy="158" rx="6" ry="2.6" />
			<ellipse cx="284" cy="160" rx="5" ry="2.2" /><ellipse cx="236" cy="190" rx="4.5" ry="2" />
		</g>
		<!-- soft shadow of the joint on the floor -->
		<path d="M196 146 L352 172 L350 186 L194 158 Z" fill="#000" opacity="0.35" filter="url(#{id}-soft)" />
		<!-- glow from the ember, on the ash pile right under it -->
		<ellipse class="ember-glow" cx="208" cy="156" rx="58" ry="20" fill="url(#{id}-glow)" />
		<path d="M168 164 C172 152 186 145 204 146 C222 144 240 151 246 162 C236 170 186 172 168 164 Z" fill="url(#{id}-ash)" stroke="#3b3632" stroke-width="2" />
		<g fill="#4a4541">
			<circle cx="186" cy="160" r="2.2" /><circle cx="204" cy="153" r="1.6" /><circle cx="226" cy="160" r="2" />
			<circle cx="212" cy="164" r="1.4" /><circle cx="236" cy="157" r="1.3" />
		</g>
	</g>

	<!-- glass shine: streaks on the wall, a bright line along the front of the rim -->
	<g fill="none" stroke-linecap="round">
		<path d="M118 196 L114 222" stroke="#fff" stroke-opacity="0.75" stroke-width="5" />
		<path d="M134 200 L131 222" stroke="#fff" stroke-opacity="0.45" stroke-width="2.5" />
		<path d="M300 200 L302 224" stroke="#fff" stroke-opacity="0.35" stroke-width="3" />
		<path d="M84 186 Q160 212 262 206" stroke="#fff" stroke-opacity="0.7" stroke-width="2.5" />
		<path d="M92 112 Q140 96 196 93" stroke="#fff" stroke-opacity="0.35" stroke-width="2" />
	</g>

	<!-- the two empty rests: dips in the rim, dark inside with a lit near edge -->
	<g stroke="#1a120b" stroke-width="2">
		<ellipse cx="67" cy="178" rx="17" ry="6.5" transform="rotate(-12 67 178)" fill="#2c4049" />
		<ellipse cx="210" cy="94.5" rx="13" ry="5.5" fill="#2c4049" />
	</g>
	<g fill="none" stroke="#f4fbfd" stroke-width="2" stroke-linecap="round">
		<path d="M54 184 Q67 187 80 178" />
		<path d="M200 98 Q210 101 220 98" />
	</g>
	<!-- the rest the joint lies in (hidden under it apart from its edges) -->
	<ellipse cx="364" cy="170" rx="19" ry="7" transform="rotate(8 364 170)" fill="#2c4049" stroke="#1a120b" stroke-width="2" />

	<image href={holkPic} width="560" height="146" transform={holkTransform} />

	<!-- near lip of the rest, over the underside of the joint so it sits down in the dip -->
	<path
		d="M344 174 Q358 180 378 178 L380 185 Q360 189 345 182 Z"
		fill="url(#{id}-rim)"
		stroke="#1a120b"
		stroke-width="2.2"
		stroke-linejoin="round"
	/>
</svg>

<style>
	.ember-glow {
		animation: ember 2.8s ease-in-out infinite;
	}
	@keyframes ember {
		50% {
			opacity: 0.55;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ember-glow {
			animation: none;
		}
	}
</style>
