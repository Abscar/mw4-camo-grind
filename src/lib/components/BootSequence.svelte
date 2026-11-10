<!--
	Abscar theme: for about two seconds when the page opens, a big red "WELCOME ABSCAR & PHILLESTAR"
	powers on like an old screen, red terminal text boots up under it ("ABSCAR OS … OK"), then it all
	fades away. Pure CSS, in the prerendered page, so it starts at once.
	Since 2026-11-10 (the user's brief): only on the first visit of the day and never in compact mode,
	and any tap or key skips it (app.html's inline script sets data-boot on <html>).
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
	<div class="boot-inner">
		<p class="boot-welcome font-hud">
			<span class="boot-welcome-small">{t.boot.welcome}</span>
			<span class="boot-welcome-names">
				{#each t.boot.crew as part, i (i)}{#if i > 0}{' '}{/if}<span class="boot-welcome-part">{part}</span>{/each}
			</span>
		</p>
		<div class="boot-text font-hud">
			<p class="boot-line boot-title">{t.boot.title}</p>
			{#each lines as [what, result] (what)}
				<p class="boot-line"><span>&gt; {what}</span><span class="boot-dots"></span><span>{result}</span></p>
			{/each}
			<p class="boot-line boot-go">{t.boot.go}<span class="boot-caret"></span></p>
		</div>
		<p class="boot-skip font-hud">{t.bootSkip}</p>
	</div>
</div>

<style>
	.boot-skip {
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgb(255 176 160 / 0.7);
	}
</style>
