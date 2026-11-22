/** Every BurgiArcade game's words, by game id (one file per game, so each game's words stay with its game). */
import type { ArcadeGame } from '#lib/arcade/game.ts';
import hitmarker from './hitmarker.ts';
import quickscope from './quickscope.ts';
import nukerun from './nukerun.ts';
import stack from './stack.ts';
import grinder from './grinder.ts';
import zombies from './zombies.ts';
import grenade from './grenade.ts';
import recall from './recall.ts';
import snake from './snake.ts';
import typer from './typer.ts';
import pinball from './pinball.ts';

export type GameWords = { name: string; tagline: string; how: string; controls: string } & Record<string, unknown>;

export const GAME_WORDS: Record<ArcadeGame, GameWords> = { hitmarker, quickscope, nukerun, stack, grinder, zombies, grenade, recall, snake, typer, pinball };
