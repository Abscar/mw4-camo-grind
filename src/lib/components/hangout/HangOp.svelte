<!--
	A squad member's operator for the casino lobby and the hideouts (hangout.ts): their emblem wearing what
	they have on from BurgiShop / BurgiDrip / the Camo Armory (OpGear + SquadAvatar, like the squad cards),
	or plain initials for someone the squad document doesn't know yet.
-->
<script lang="ts">
	import { squad } from '#lib/squad.svelte.ts';
	import { worn } from '#lib/shop.ts';
	import { faceOf } from '#lib/faceGear.ts';
	import type { SquadOp } from '#lib/squad-codec.ts';
	import OpGear from '../OpGear.svelte';
	import SquadAvatar from '../SquadAvatar.svelte';

	let { id, name, op, size = 56 }: { id: string; name: string; op?: SquadOp; size?: number } = $props();
	const member = $derived(squad.entries.find((e) => e.id === id)?.member);
	const look = $derived(worn(member?.shop));
</script>

<OpGear aura={look.aura?.id} effect={look.effect?.id} badge={look.badge?.id} pet={look.pet?.id} pin={Math.round(size / 3.2)} extra={{ back: look.back?.id, hold: look.hold?.id, mount: look.mount?.id, plush: look.plush?.id }}
	><SquadAvatar name={member?.name ?? name} op={member?.op ?? op} {size} face={faceOf(look)} /></OpGear
>
