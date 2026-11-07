<!--
	Abscar theme: for under a second when the page opens, red terminal text boots up over the page
	("ABSCAR OS … OK"), then fades away. Pure CSS, in the prerendered page, so it starts at once.
	Clicks go straight through it, and with reduced motion it isn't shown at all.
-->
<script lang="ts">
	import { WEAPONS } from '#lib/data/weapons.ts';
	import { t } from '#lib/i18n/en.ts';

	const lines = [
		[t.boot.hud, t.boot.ok],
		[t.boot.camos, t.boot.ok],
		[t.boot.arsenal, t.boot.weapons(WEAPONS.length)]
	];
</script>

<div class="boot" aria-hidden="true">
	<div class="boot-text font-hud">
		<p class="boot-line boot-title">{t.boot.title}</p>
		{#each lines as [what, result] (what)}
			<p class="boot-line"><span>&gt; {what}</span><span class="boot-dots"></span><span>{result}</span></p>
		{/each}
		<p class="boot-line boot-go">{t.boot.go}<span class="boot-caret"></span></p>
	</div>
</div>
