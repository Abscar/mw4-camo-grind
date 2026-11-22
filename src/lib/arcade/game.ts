/**
 * What every BurgiArcade game gets from the cabinet around it (ArcadeMachine.svelte) and gives back.
 * The cabinet shows the attract screen, counts 3-2-1, mounts the game, and shows the result when the
 * game calls `onend` (once). The game itself only plays: it draws its own field and HUD, takes the
 * keyboard, mouse and touch, pauses itself while the tab is hidden, and draws its level from `seed`.
 */
export interface ArcadeGameProps {
	/** The level's seed (arcade/rng.ts): the same seed = the same level. */
	seed: number;
	/** The game is over: the final score (a whole number ≥ 0, higher is better). Call it once. */
	onend: (score: number, detail?: ArcadeDetail) => void;
}

/** Extra results some games report (Quickscope Duel: each round's reaction time). */
export interface ArcadeDetail {
	/** Quickscope Duel: reaction time per round in ms; -1 = fired too early, 0 = too slow / no shot. */
	rounds?: number[];
}

/** The ten games, in the hall's order. Never change an id: high scores are kept by it. */
export const ARCADE_GAMES = ['hitmarker', 'quickscope', 'nukerun', 'stack', 'grinder', 'zombies', 'grenade', 'recall', 'snake', 'typer'] as const;
export type ArcadeGame = (typeof ARCADE_GAMES)[number];
