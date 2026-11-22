/**
 * BurgiArcade's games and their hero pictures by id (the cabinet and the hall look them up here).
 */
import type { Component } from 'svelte';
import type { ArcadeGame, ArcadeGameProps } from '#lib/arcade/game.ts';
import HitmarkerRush from './games/HitmarkerRush.svelte';
import HitmarkerRushArt from './art/HitmarkerRushArt.svelte';
import QuickscopeDuel from './games/QuickscopeDuel.svelte';
import QuickscopeDuelArt from './art/QuickscopeDuelArt.svelte';
import NukeRun from './games/NukeRun.svelte';
import NukeRunArt from './art/NukeRunArt.svelte';
import BurgerStack from './games/BurgerStack.svelte';
import BurgerStackArt from './art/BurgerStackArt.svelte';
import CamoGrinder from './games/CamoGrinder.svelte';
import CamoGrinderArt from './art/CamoGrinderArt.svelte';
import ZombieRounds from './games/ZombieRounds.svelte';
import ZombieRoundsArt from './art/ZombieRoundsArt.svelte';
import GrenadeToss from './games/GrenadeToss.svelte';
import GrenadeTossArt from './art/GrenadeTossArt.svelte';
import KillstreakRecall from './games/KillstreakRecall.svelte';
import KillstreakRecallArt from './art/KillstreakRecallArt.svelte';
import MunchieSnake from './games/MunchieSnake.svelte';
import MunchieSnakeArt from './art/MunchieSnakeArt.svelte';
import CalloutTyper from './games/CalloutTyper.svelte';
import CalloutTyperArt from './art/CalloutTyperArt.svelte';
import AbscarPinball from './games/AbscarPinball.svelte';
import AbscarPinballArt from './art/AbscarPinballArt.svelte';

export const GAME_VIEWS: Record<ArcadeGame, Component<ArcadeGameProps>> = {
	hitmarker: HitmarkerRush,
	quickscope: QuickscopeDuel,
	nukerun: NukeRun,
	stack: BurgerStack,
	grinder: CamoGrinder,
	zombies: ZombieRounds,
	grenade: GrenadeToss,
	recall: KillstreakRecall,
	snake: MunchieSnake,
	typer: CalloutTyper,
	pinball: AbscarPinball
};

export const GAME_ART: Record<ArcadeGame, Component<{ size?: number }>> = {
	hitmarker: HitmarkerRushArt,
	quickscope: QuickscopeDuelArt,
	nukerun: NukeRunArt,
	stack: BurgerStackArt,
	grinder: CamoGrinderArt,
	zombies: ZombieRoundsArt,
	grenade: GrenadeTossArt,
	recall: KillstreakRecallArt,
	snake: MunchieSnakeArt,
	typer: CalloutTyperArt,
	pinball: AbscarPinballArt
};
