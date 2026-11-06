<script lang="ts">
	import { t } from '#lib/i18n/en.ts';
	import { progress } from '#lib/progress.svelte.ts';
	import { THEMES } from '#lib/themes.ts';
</script>

<div
	class="flex gap-1 rounded-full border border-band-line bg-band-chip p-1"
	role="group"
	aria-label={t.theme.label}
>
	{#each THEMES as theme (theme.id)}
		{@const on = progress.prefs.theme === theme.id}
		<button
			type="button"
			class="font-head flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-2.5 text-xs font-semibold transition-colors sm:px-3 {on
				? 'bg-accent text-on-accent'
				: 'text-band-muted hover:text-band-fg'}"
			aria-pressed={on}
			title={theme.name}
			onclick={() => progress.setPref('theme', theme.id)}
		>
			<span
				class="size-4 flex-none rounded-full shadow-[inset_0_0_0_1px_rgb(127_127_127/0.4)]"
				style:background="linear-gradient(135deg, {theme.swatch[0]} 50%, {theme.swatch[1]} 50%)"
				aria-hidden="true"
			></span>
			<span class="sr-only sm:not-sr-only">{theme.name}</span>
		</button>
	{/each}
</div>
