<!--
	BurgiDrip's sign picture (the door in the BurgiShop tab and the store's heading): a heather-grey hoodie with
	a red box on the chest, laid flat. Our own drawing. Decoration.
-->
<script lang="ts">
	let { size = 40 }: { size?: number } = $props();
	const uid = $props.id();
	const g = `ddo-${uid}`;
</script>

<svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id={g} x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#b8bec4" /><stop offset="1" stop-color="#6e747a" /></linearGradient>
	</defs>
	<!-- sleeves -->
	<path d="M10 12 L3.4 26 Q2.6 28.4 4.6 29.4 L8 31 L13 19 Z M30 12 L36.6 26 Q37.4 28.4 35.4 29.4 L32 31 L27 19 Z" fill="url(#{g})" stroke="#16161a" stroke-width="1.1" stroke-linejoin="round" />
	<rect x="2.6" y="27.4" width="6.4" height="3" rx="1" transform="rotate(24 5.8 28.9)" fill="#5a6066" stroke="#16161a" stroke-width="0.8" />
	<rect x="31" y="27.4" width="6.4" height="3" rx="1" transform="rotate(-24 34.2 28.9)" fill="#5a6066" stroke="#16161a" stroke-width="0.8" />
	<!-- hood behind -->
	<path d="M13 11 C12 4 17 2 20 2 C23 2 28 4 27 11 Z" fill="#5a6066" stroke="#16161a" stroke-width="1.1" />
	<!-- body -->
	<path d="M10 12 Q14 9.4 20 9.4 Q26 9.4 30 12 L29 35 Q20 36.6 11 35 Z" fill="url(#{g})" stroke="#16161a" stroke-width="1.1" stroke-linejoin="round" />
	<rect x="11" y="33" width="18" height="2.6" rx="1" fill="#5a6066" stroke="#16161a" stroke-width="0.8" />
	<path d="M14 11 Q20 16 26 11" fill="none" stroke="#3a3e44" stroke-width="1.6" />
	<path d="M18 13.6 L17.6 19 M22 13.6 L22.4 19" stroke="#f4f1e8" stroke-width="0.8" stroke-linecap="round" />
	<path d="M14.6 33 L15.4 26.4 Q20 25.4 24.6 26.4 L25.4 33" fill="none" stroke="#3a3e44" stroke-width="0.8" />
	<!-- the red box on the chest -->
	<rect x="13.2" y="19.6" width="13.6" height="5" fill="#e0192a" stroke="#16161a" stroke-width="0.6" />
	<path d="M15 21 H25 M15 23.2 H22" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" />
</svg>
