/**
 * BurgiArcade's look per game (2026-11-22): the cabinet's colours, the logo's two words and their letter style
 * (the casino logos' kit: logoGlyphs.ts + LogoWord.svelte), so every game has its own sign like the slot
 * machines do. Pure data.
 */
import type { ArcadeGame } from './game.ts';

export type Face = { hi: string; mid: string; lo: string; side?: string; edge?: string };
export interface GameLook {
	/** cabinet / tile colours: main, dark, and the neon edge */
	c1: string;
	c2: string;
	glow: string;
	/** the logo: a small top word arched over a big word */
	top: string;
	big: string;
	/** chunky candy letters, or neon tubes */
	style: 'chunky' | 'neon';
	topFaces: Face[];
	bigFaces: Face[];
	ink: string;
	rim: string;
	/** the hero picture on the left or the right of the big word */
	fig: 'left' | 'right';
}

const GOLD: Face = { hi: '#fffbe0', mid: '#ffd23a', lo: '#ff8a00', side: '#8a2a06', edge: '#a8400a' };
const GOLD2: Face = { hi: '#fff6c8', mid: '#ffc21a', lo: '#f07800', side: '#8a2a06', edge: '#a8400a' };
const RED: Face = { hi: '#ffb3a0', mid: '#f2382a', lo: '#9a0f16', side: '#5a0710', edge: '#7a0a12' };
const WHITE: Face = { hi: '#ffffff', mid: '#e8eef6', lo: '#9fb0c4', side: '#3a4656', edge: '#4f5d70' };
const LIME: Face = { hi: '#f4ffd0', mid: '#a8f03a', lo: '#3f9a12', side: '#1d4a06', edge: '#2a6a0a' };
const TOXIC: Face = { hi: '#e6ffd6', mid: '#5dff5a', lo: '#14a03a', side: '#06401a', edge: '#0a5a24' };
const ORANGE: Face = { hi: '#ffe0b0', mid: '#ff8a2a', lo: '#c23a06', side: '#5a1802', edge: '#7a2204' };
const OLIVE: Face = { hi: '#eef5c0', mid: '#a4b34a', lo: '#4f5a18', side: '#262c08', edge: '#353e0c' };
const PURPLE: Face = { hi: '#f0d8ff', mid: '#b05cff', lo: '#5a1aa0', side: '#2a0a50', edge: '#3a1070' };
const PINK: Face = { hi: '#ffe0f4', mid: '#ff5cb8', lo: '#b0186a', side: '#5a0834', edge: '#7a0c48' };
const PLAT: Face = { hi: '#ffffff', mid: '#d6e0ee', lo: '#8a98ac', side: '#3a4454', edge: '#4c586a' };
const CRIMSON: Face = { hi: '#ffc0d0', mid: '#e0204a', lo: '#6a0420', side: '#34020e', edge: '#4a0414' };
const CHROME: Face = { hi: '#e8fffa', mid: '#5ff0dc', lo: '#3a6aff', side: '#1a1a6a', edge: '#24248a' };
const BROWN: Face = { hi: '#ffd896', mid: '#f0a24a', lo: '#b0581b', side: '#4a2008', edge: '#5a2a0a' };
const neon = (mid: string, hi: string): Face => ({ hi, mid, lo: mid });

export const GAME_LOOKS: Record<ArcadeGame, GameLook> = {
	hitmarker: { c1: '#a8121e', c2: '#2a0306', glow: '#ff5a4a', top: 'HITMARKER', big: 'RUSH', style: 'chunky', topFaces: [WHITE], bigFaces: [RED, { ...RED, mid: '#ff4a2a' }], ink: '#1a0306', rim: '#fff1e6', fig: 'right' },
	quickscope: { c1: '#0d4a6a', c2: '#03121e', glow: '#45e6ff', top: 'QUICKSCOPE', big: 'DUEL', style: 'neon', topFaces: [neon('#45e6ff', '#e0fbff')], bigFaces: [neon('#ff4a5a', '#ffe0e4')], ink: '#000', rim: '#fff', fig: 'right' },
	nukerun: { c1: '#a84a06', c2: '#2a0e02', glow: '#ffb02a', top: 'NUKE', big: 'RUN', style: 'chunky', topFaces: [{ ...GOLD, mid: '#ffe23a' }], bigFaces: [ORANGE, { ...ORANGE, mid: '#ff6a1a' }], ink: '#240a02', rim: '#fff4c8', fig: 'right' },
	stack: { c1: '#8a4a12', c2: '#2a1206', glow: '#ffc928', top: 'BURGER', big: 'STACK', style: 'chunky', topFaces: [RED], bigFaces: [BROWN, GOLD, LIME, BROWN, GOLD], ink: '#2a1206', rim: '#fff1c9', fig: 'left' },
	grinder: { c1: '#6a5a10', c2: '#1a1404', glow: '#ffd23a', top: 'CAMO', big: 'GRINDER', style: 'chunky', topFaces: [GOLD], bigFaces: [GOLD, GOLD2, PLAT, PLAT, CRIMSON, CRIMSON, CHROME], ink: '#140a02', rim: '#fffbe6', fig: 'right' },
	zombies: { c1: '#1f5a1a', c2: '#061a06', glow: '#7dff5a', top: 'ZOMBIE', big: 'ROUNDS', style: 'chunky', topFaces: [CRIMSON], bigFaces: [TOXIC, { ...TOXIC, mid: '#7dff3a' }], ink: '#041204', rim: '#e8ffd8', fig: 'left' },
	grenade: { c1: '#4a5214', c2: '#141804', glow: '#ffb02a', top: 'GRENADE', big: 'TOSS', style: 'chunky', topFaces: [OLIVE], bigFaces: [ORANGE, GOLD], ink: '#121404', rim: '#f4f0d0', fig: 'right' },
	recall: { c1: '#0e5a3a', c2: '#031a10', glow: '#3dff9a', top: 'KILLSTREAK', big: 'RECALL', style: 'neon', topFaces: [neon('#ffd23a', '#fff6d0')], bigFaces: [neon('#3dff9a', '#e0ffef')], ink: '#000', rim: '#fff', fig: 'left' },
	snake: { c1: '#4a1a86', c2: '#14062a', glow: '#a8f03a', top: 'MUNCHIE', big: 'SNAKE', style: 'chunky', topFaces: [PINK], bigFaces: [LIME, { ...LIME, mid: '#c8ff4a' }], ink: '#12041e', rim: '#f4ffe0', fig: 'right' },
	typer: { c1: '#16306e', c2: '#060c24', glow: '#5c9dff', top: 'CALLOUT', big: 'TYPER', style: 'neon', topFaces: [neon('#ff5cb8', '#ffe0f2')], bigFaces: [neon('#5c9dff', '#e4eeff')], ink: '#000', rim: '#fff', fig: 'right' },
	pinball: { c1: '#7a1a10', c2: '#1e0604', glow: '#ffb02a', top: "ABSCAR'S", big: 'PINBALL', style: 'chunky', topFaces: [RED], bigFaces: [CHROME, GOLD, CHROME, GOLD, CHROME, GOLD, CHROME], ink: '#1a0604', rim: '#fff4dc', fig: 'right' }
};

/** BurgiArcade's own sign: BURGI in gold over ARCADE in the ten games' colours. */
export const ARCADE_FACES: Face[] = [RED, ORANGE, GOLD, LIME, CHROME, PURPLE];
export const ARCADE_TOP: Face[] = [GOLD, GOLD2];
export const PURPLE_FACE = PURPLE;
export const PINK_FACE = PINK;
