/**
 * What the old TV in the Abscar header plays (RetroTv.svelte): classic Call of Duty montages from
 * the CoD4 / MW2 / MW3 era, through YouTube's embedded player (the user's ask, 2026-11-10).
 * ZzirGrizZ is the user's favourite: he gets a channel every 3–4 channels and the TV always
 * switches on to one of his. The rest are well-known montages of the era, picked by us.
 *
 * Channel number = position in this list + 1. The TV plays on in list order and loops.
 * Every id was played in a real youtube-nocookie embed from Sweden on 2026-11-10 (headless Edge).
 * Many famous originals are NOT here because the embed refuses them (music claims, player error
 * 150) although YouTube's oEmbed says they're fine — e.g. ZzirGrizZ's own Matrix Reloaded
 * (K7oPB9n1UlM), The Matrix (6u3DuA8EVAQ), ECHO and Armageddon uploads. That's why channel 07 is
 * a fan re-upload. Videos disappear over time: the TV skips one that errors, but re-check now and
 * then with `node .claude/testing/embed-check.mjs <id,id,…>`.
 * Checked spares (all played): Circca MW2 QS #3 e-oD2ufX1ys, aMOODIEswede "Free for All"
 * uoUksOrM2BE, FaZe ILLCAMS 36 FOV_iZ0KEIA, nV Sniping "War In Me" tfHzNioFx5E (on ZzirGrizZ's
 * channel), ZzirGrizZ Black Ops "DEFIB" Zcwei-CBmJo (left out: the ask was CoD4 / MW2 / MW3).
 */

export const MONTAGE_GAMES = ['cod4', 'mw2', 'mw3'] as const;
export type MontageGame = (typeof MONTAGE_GAMES)[number];

/** The user's favourite montage maker: the TV switches on to one of his. */
export const FAVOURITE = 'ZzirGrizZ';

export interface Montage {
	/** YouTube video id */
	id: string;
	/** whose montage it is (on the TV's plate) */
	by: string;
	/** the montage's name (on the plate, after `by`) */
	name: string;
	/** the video's exact title on YouTube (tooltip) */
	title: string;
	/** the YouTube channel that uploaded it */
	channel: string;
	game: MontageGame;
}

export const MONTAGES: readonly Montage[] = [
	{
		id: 'yJv-VYxNXoY',
		by: FAVOURITE,
		name: 'COmDiTxAGE',
		title: 'COD4 n WaW: zzirGrizz COmDiTxAGE',
		channel: 'zzirGrizz',
		game: 'cod4'
	},
	{
		id: 'Z2ZuHdXplMY',
		by: 'Doggie Treats',
		name: 'Purebred',
		title: 'Doggie Treats - Purebred - CoD4 Prosim Montage',
		channel: 'DTreats',
		game: 'cod4'
	},
	{
		id: 'OtkHIVy5JD0',
		by: 'Jazz',
		name: 'Blueprint',
		title: "J A Z Z - 'Blueprint' montage - edited by JamesPB",
		channel: 'J4Sz',
		game: 'cod4'
	},
	{
		id: 'hfKB-L7yMog',
		by: FAVOURITE,
		name: 'Merry Christmas',
		title: 'zzirGrizz MERRY CHRISTMAS',
		channel: 'zzirGrizz',
		game: 'mw2'
	},
	{
		id: 'VeQU6EgT444',
		by: 'Smoky DRFT',
		name: 'Memories',
		title: 'Amazing CoD4 Sniper Montage - Memories - Smoky DRFT',
		channel: 'Sander Witteman',
		game: 'cod4'
	},
	{
		id: 'xm0cOwsDYFE',
		by: 'aMOODIEswede',
		name: 'Open Your Eyes',
		title: "Modern Warfare 2 Sniper Montage - 'Open Your Eyes' by aMOODIEswede",
		channel: 'TheMoodieSwede',
		game: 'mw2'
	},
	{
		id: 'UYf2gGvMVXU',
		by: FAVOURITE,
		name: 'Matrix Reloaded, Part 1',
		title: 'zzirGrizz - "Matrix Reloaded Part 1" Modern Warfare 2 Montage',
		channel: 'zzirGrizzMatrixVids',
		game: 'mw2'
	},
	{
		id: 'JmCbO2pYYfU',
		by: 'OpTic Predator',
		name: 'Predators',
		title: '"Predators" OpTic Predator | fuzi8n',
		channel: 'M40A3 Predator',
		game: 'mw2'
	},
	{
		id: '14o0ch0zMF0',
		by: 'FaZe Clan',
		name: 'ILLCAMS, Episode 35',
		title: 'FaZe ILLCAMS - Episode 35 by FaZe Faytal',
		channel: 'FaZe Clan',
		game: 'mw2'
	},
	{
		id: 'YhwhCn3t58Y',
		by: 'Zerkaa',
		name: 'Galvanize',
		title: 'Zerkaa | Galvanize (Modern Warfare 2 S&D Montage)',
		channel: 'Zerkaa',
		game: 'mw2'
	},
	{
		id: '_aT2mPitCEo',
		by: FAVOURITE,
		name: 'Christmas Montage',
		title: 'zzirGrizz MW3 Christmas Montage',
		channel: 'zzirGrizz',
		game: 'mw3'
	},
	{
		id: 'vEA8QsKhKYI',
		by: 'OpTic Jewel',
		name: 'Sparkill',
		title: 'OpTic Jewel OG: "Sparkill" A Mw2 Montage - Powered By Evil Controllers',
		channel: 'OpTic Gaming',
		game: 'mw2'
	},
	{
		id: 'Z-Q2g2Tw-Qk',
		by: 'FaZe Clan',
		name: 'Teamtage #1',
		title: 'FaZe: Modern Warfare 3 Teamtage #1',
		channel: 'FaZe Clan',
		game: 'mw3'
	},
	{
		id: 'ZF1LYKSQdxE',
		by: '9Lives',
		name: 'Quick Scope Montage',
		title: 'MW3 Quick Scope Montage',
		channel: '9Lives',
		game: 'mw3'
	},
	{
		id: 'wLwTRq8a_n4',
		by: FAVOURITE,
		name: 'The Matrix Revolutions',
		title: 'zzirGrizz The Matrix Revolutions by Keeir',
		channel: 'zzirGrizz',
		game: 'mw3'
	},
	{
		id: 'QHTVtRxwWc8',
		by: 'IReapZz',
		name: 'Sniper Montage 3',
		title: 'IReapZz - MW3 Sniper Montage 3',
		channel: 'IReapZz',
		game: 'mw3'
	},
	{
		id: 'F2fiANTcWqA',
		by: 'FaZe WaRTeK',
		name: 'World War III',
		title: 'MW3 Sniper Montage | FaZe WaRTeK - World War III by Never & Guesh',
		channel: 'Wartek',
		game: 'mw3'
	},
	{
		id: '7DmX8o-crA8',
		by: 'Vikkstar123',
		name: 'Bullseye v1',
		title: 'MW3 Throwing Knife Montage | Bullseye v1 | Vikstar123 by S L P x',
		channel: 'Vikkstar123',
		game: 'mw3'
	}
];
