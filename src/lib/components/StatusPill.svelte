<script lang="ts">
	import type { MasteryStatus } from '#lib/data/camos.ts';
	import { statusLabel } from '#lib/ui.ts';

	let { status }: { status: MasteryStatus } = $props();

	const style = {
		locked: 'border-tick-line bg-tick text-muted',
		active: 'border-gold/50 bg-gold/12 text-gold-ink',
		complete: 'border-div bg-div text-on-accent'
	} as const;
	const icon = { locked: '○', active: '●', complete: '✔' } as const;
</script>

<span
	class="font-head inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold tracking-widest whitespace-nowrap uppercase {style[
		status
	]}"
>
	<span aria-hidden="true">{icon[status]}</span>{statusLabel(status)}
</span>
