/**
 * What every camo in the weapon card looks like (2026-11-11, the user's ask: "find out what the 3
 * camos before Gold look like on every weapon and draw them"). Each is a pattern family + colours,
 * drawn by camoSwatch.ts in our own style. Looked at 2026-11-11 on mw4camos.com's camo thumbnails
 * (95 of them) and codmunity.gg's camo icons (the other 10: Brown, Lime, Iron, Garland and the
 * CSG-35 / Cronen Osprey camos; plus Gunmetal and Dark Tan, which are blank on mw4camos);
 * colours picked out of those pictures. The single-colour camos (Red, Green, Yellow, Cyan, White,
 * Brown, Lime, Gunmetal, Dark Tan, Iron, Off Grid) are drawn as that colour with a sheen.
 * Keyed by the camo's name as in weapons.ts (unique across weapons); scripts/grind.test.js checks
 * that every Special camo has a look.
 */
import type { Look } from '#lib/camoSwatch.ts';

export const SPECIAL_LOOKS: Record<string, Look> = {
	// Han 86
	Smoke: { k: 'waves', bg: '#2e2e2b', colors: ['#20211e', '#424340', '#353633', '#51524f'], n: 11, amp: 3.5 },
	Stormwave: { k: 'stripes', bg: '#0b0d0e', layers: [['#24282f', 7, 12], ['#464e5a', 9, 10], ['#878b8e', 8, 7], ['#a8abad', 7, 5]], angle: -4, len: 80, jitter: 4 },
	Red: { k: 'solid', c: '#7a2625' },
	// M4
	Myriad: { k: 'shards', bg: '#312f20', colors: ['#19190d', '#464432', '#64614c', '#9d997e', '#312f20'], n: 90, size: 16 },
	'Night Ops': { k: 'motif', m: 'rocks', bg: '#10100e', colors: ['#30302c', '#51514c', '#757570', '#908f89'] },
	Green: { k: 'solid', c: '#187528' },
	// Hyeon Burst
	Ponderosa: { k: 'blobs', bg: '#474e33', layers: [['#313827', 12, 12], ['#5c6243', 12, 10], ['#777a54', 10, 9], ['#939366', 8, 7], ['#2a3020', 6, 6]], blur: 1.4, angular: true },
	'Red Rain': { k: 'stripes', bg: '#151312', layers: [['#2e2522', 8, 7], ['#51220f', 8, 6], ['#8e4124', 7, 5], ['#d14d1c', 12, 5]], angle: -32, len: 34, jitter: 6 },
	'Kitty Kaos': { k: 'spots', bg: '#372c1d', colors: ['#5f4a30', '#8a6c4b', '#ac9d8c', '#d7cec1'], n: 70, size: 6, rim: '#2a2014' },
	// Patriot XMR
	'Dune Sea': { k: 'stripes', bg: '#b79f7b', layers: [['#a48d6d', 8, 9], ['#877254', 8, 8], ['#645140', 7, 7], ['#44362b', 8, 5]], angle: -22, len: 56, smooth: true },
	Scorch: { k: 'spots', bg: '#b49151', colors: ['#7d6639', '#d0b589', '#f4e1c8'], n: 46, size: 5, rim: '#383625' },
	Disperse: { k: 'pixels', bg: '#0d0d0d', layers: [['#131313', 0.3, 4], ['#1d1d1d', 0.16, 3], ['#2a2a2a', 0.05, 2]], cell: 5 },
	// Kastov 762
	SAMNIM: { k: 'pixels', bg: '#413e2b', layers: [['#746d56', 0.3, 6], ['#5a5641', 0.25, 6], ['#33321f', 0.18, 5], ['#949080', 0.06, 3]], cell: 4, sx: 1.6 },
	'Raster AUX': { k: 'shards', bg: '#09080c', colors: ['#434238', '#c1c421', '#dddcdb', '#2c2b1e', '#c1c421'], n: 70, size: 16 },
	Yellow: { k: 'solid', c: '#b38316' },
	// Oden
	'Dark Moss': { k: 'pixels', bg: '#3b422d', layers: [['#2d3522', 0.3, 5], ['#484f37', 0.28, 5], ['#585f43', 0.14, 4], ['#313927', 0.12, 3]], cell: 3 },
	Shale: { k: 'shards', bg: '#776e64', colors: ['#969491', '#544e48', '#b9bdc0', '#776e64', '#302c28'], n: 50, size: 22 },
	'Hot Rod': { k: 'motif', m: 'flames', bg: '#960c0d', colors: ['#c4532f', '#f2a03c', '#ffd25e'] },
	// Axion
	'Splinter Rock': { k: 'shards', bg: '#111111', colors: ['#2a2a2a', '#454545', '#646464', '#8a8a8a', '#bebebe'], n: 80, size: 18 },
	'Sunset Tropic': { k: 'gradient', stops: ['#266a8e', '#3a8ea7', '#3b3b88', '#9e279a', '#6c128e'], angle: 90, squiggle: '#c9a8ff' },
	Cyan: { k: 'solid', c: '#2e7984' },
	// Cronen Squall
	Oni: { k: 'motif', m: 'oni', bg: '#0c0706', colors: ['#b0262a', '#cfc9c2', '#b9b2aa'] },
	'Urban Smoke': { k: 'stripes', bg: '#160f0e', layers: [['#4e1c1d', 7, 10], ['#881414', 9, 10], ['#9c6666', 4, 6], ['#c6bab8', 8, 8]], angle: -3, len: 70, jitter: 3 },
	'Optical Reverb': { k: 'motif', m: 'mesh', bg: '#43463e', colors: ['#323530', '#585c4e', '#2b2e28'] },
	// Cronen Osprey (Season 1)
	'In the Weeds': { k: 'motif', m: 'grass', bg: '#3b3429', colors: ['#574d3c', '#6c604e', '#2e2920', '#8a7a5c'] },
	'Dark Ichor': { k: 'stripes', bg: '#131313', layers: [['#1b1a1a', 10, 9], ['#0e0e0d', 6, 6], ['#d33a46', 10, 1.4], ['#3fb4c6', 9, 1.2], ['#3a2628', 6, 3]], angle: -10, len: 40, jitter: 6 },
	Chained: { k: 'motif', m: 'chains', bg: '#090f1a', colors: ['#3d567e', '#21375d', '#b8cbea'] },
	// ISO Nightshade
	Asphalt: { k: 'pixels', bg: '#434343', layers: [['#191919', 0.28, 6], ['#303030', 0.22, 5], ['#606060', 0.18, 5], ['#505150', 0.1, 3]], cell: 4 },
	'Black Topo': { k: 'topo', bg: '#202323', line: '#454948', width: 0.6, dense: true, fills: ['#252828', '#2c302f'] },
	Brown: { k: 'solid', c: '#a4664a', metal: true },
	// VEL 46
	'Jungle Shadow': { k: 'stripes', bg: '#11130f', layers: [['#1e221c', 8, 10], ['#363d2e', 9, 8], ['#4f5944', 9, 7], ['#8a907b', 9, 2]], angle: -6, len: 60, jitter: 5 },
	Ghast: { k: 'blobs', bg: '#292e2c', layers: [['#343938', 14, 12], ['#4b4e4b', 10, 9], ['#60635e', 12, 8], ['#1b1e1c', 7, 6]] },
	Gunmetal: { k: 'solid', c: '#555d5e', metal: true },
	// WZ.55 Striga
	Stellation: { k: 'trigrid', colors: ['#415b56', '#415b56', '#415b56', '#b12628', '#b12628', '#c1cdcb', '#2f2724', '#b28686'], cell: 14 },
	Rattlesnake: { k: 'scales', bg: '#675e49', c: '#554c39', hi: '#aca38b', size: 7, bands: ['#7a715b', '#908770'] },
	'Dark Tan': { k: 'solid', c: '#756e5c', metal: true },
	// PPSh-41
	Blackwell: { k: 'topo', bg: '#1a1b1a', line: '#6c6d6c', width: 1.3, dense: true, fills: ['#2b2b2b', '#434343'] },
	Iron: { k: 'solid', c: '#5a5655', metal: true },
	Currents: { k: 'waves', bg: '#528476', colors: ['#3f7062', '#649688', '#86b7a8', '#75a799'], n: 12, amp: 6, angle: -25, specks: '#d8f2ea' },
	// X-58 Nyx
	'Sniper Veil': { k: 'pixels', bg: '#424117', layers: [['#33320c', 0.3, 5], ['#535126', 0.25, 4], ['#656337', 0.16, 3], ['#7b794c', 0.08, 2]], cell: 3, round: true },
	Carbonated: { k: 'spots', bg: '#c4c1bc', colors: ['#514944', '#1d1816', '#514944', '#a59593'], n: 28, size: 10, rings: '#8a3b45', z: 1.4 },
	Lime: { k: 'solid', c: '#677169', metal: true },
	// CSG-35 (Season 1)
	Polyhedron: { k: 'shards', bg: '#262617', colors: ['#a56226', '#9d9a88', '#56462c', '#d47a2a', '#e4e0cc'], n: 26, size: 26, rim: '#1a1a10' },
	Rind: { k: 'motif', m: 'rind', bg: '#5d7146', colors: ['#243d1a', '#384f29'] },
	'Black Grip': { k: 'blobs', bg: '#333434', layers: [['#2b2b2c', 8, 16], ['#484a49', 7, 13], ['#1d1f1f', 5, 10]], angular: true, hatch: '#1a1a1a' },
	// Rezi 12
	'Struck Oil': { k: 'blobs', bg: '#181713', layers: [['#25241e', 10, 14], ['#5a482b', 9, 10], ['#856c43', 9, 9], ['#c7a663', 10, 8]] },
	Brushstroke: { k: 'stripes', bg: '#4d5338', layers: [['#28301f', 10, 9], ['#717553', 10, 9], ['#9c976a', 9, 8], ['#b1b084', 7, 7]], angle: -30, len: 36, jitter: 60 },
	'White Pine': { k: 'motif', m: 'branches', bg: '#e9e9e5', colors: ['#5e574e', '#928e88', '#b8b6b1'] },
	// Warlord
	Redshift: { k: 'pixels', bg: '#681c1f', layers: [['#4c1e1d', 0.26, 6], ['#2b1d18', 0.22, 6], ['#8c393c', 0.18, 5], ['#752d2f', 0.14, 4]], cell: 4 },
	'Corrupted Clay': { k: 'pixels', bg: '#9d9481', layers: [['#645747', 0.26, 3], ['#33312b', 0.18, 3], ['#b1ad9c', 0.22, 3], ['#867661', 0.14, 2], ['#9a5a30', 0.05, 1]], cell: 10 },
	'Magma Ire': { k: 'motif', m: 'magma', bg: '#2e1e18', colors: ['#c8501a', '#ff9a3c', '#ffe08a'] },
	// FiNN LMG
	'Desert Tactics': { k: 'blobs', bg: '#5e6053', layers: [['#495348', 10, 14], ['#30362f', 8, 11]], dashes: ['#909387', '#73766b', '#30362f'] },
	Thunderhead: { k: 'motif', m: 'lightning', bg: '#2f3946', colors: ['#2f3946', '#4d657c', '#adc5d6'] },
	'Green Tiger': { k: 'stripes', bg: '#151815', layers: [['#28301e', 9, 8], ['#3e4927', 9, 6], ['#5a6427', 9, 5], ['#8a9a2a', 6, 3]], angle: -42, len: 44 },
	// Type 73
	Outcrop: { k: 'blobs', bg: '#e0e5df', layers: [['#a5b192', 10, 11], ['#6e7e5c', 9, 10], ['#364d39', 10, 9], ['#1a2c1e', 8, 7]], rim: '#2a3a20' },
	Foxtrail: { k: 'blobs', bg: '#59512f', layers: [['#292d22', 10, 10], ['#5c3320', 10, 9], ['#a5977e', 8, 7], ['#796b52', 6, 6]] },
	'Ash Pine': { k: 'motif', m: 'pine', bg: '#5a605f', colors: ['#2c3232', '#727774', '#8b8f8a', '#4e5554'] },
	// APOC-338
	'Phantom Flux': { k: 'pixels', bg: '#1d0a2a', layers: [['#40234a', 0.25, 5], ['#f2e3f2', 0.24, 5], ['#b291ad', 0.12, 3], ['#893866', 0.12, 3], ['#c4245c', 0.04, 1]], cell: 5 },
	Mineral: { k: 'blobs', bg: '#f8f7f2', layers: [['#f5e8d0', 10, 11], ['#bfb2ae', 9, 9], ['#ba5454', 10, 8], ['#211b1c', 8, 6]], sx: 1.4 },
	'Tiger Swipe': { k: 'stripes', bg: '#151816', layers: [['#3b3918', 9, 9], ['#292c1c', 6, 8], ['#b9730d', 11, 7], ['#7e5918', 7, 5]], angle: -36, len: 46 },
	// MAR-9
	Mangrove: { k: 'blobs', bg: '#1e1e11', layers: [['#2b3c21', 11, 12], ['#4f5b35', 9, 10], ['#868c51', 9, 9], ['#0c0f07', 8, 7]] },
	'Fungal Grid': { k: 'motif', m: 'mesh', bg: '#34332b', colors: ['#20201a', '#4d4c41', '#1a1a14'] },
	White: { k: 'solid', c: '#a2a2a0' },
	// Oris 8.6
	Hibiscus: { k: 'motif', m: 'flowers', bg: '#39383d', colors: ['#a47f8c', '#7d8ba3', '#8d868c', '#d8c070'] },
	'Fire Topo': { k: 'topo', bg: '#17130c', line: '#c4602e', width: 0.6, glow: true, dense: true },
	'Deep Space': { k: 'motif', m: 'galaxy', bg: '#182858', colors: ['#184983', '#177da9', '#502d9d', '#8264b3', '#3ad0e8'] },
	// Mosin-Nagant
	'Ice Sheer': { k: 'shards', bg: '#202725', colors: ['#52868e', '#a1cadb', '#74a5b1', '#3a545a', '#d8eef6'], n: 60, size: 22 },
	'Fractal Snow': { k: 'pixels', bg: '#9da1a0', layers: [['#dfe1e1', 0.26, 4], ['#fbfdfd', 0.24, 4], ['#696a6a', 0.14, 3], ['#c2c5c5', 0.14, 3]], cell: 7 },
	'Sticker Shock': { k: 'motif', m: 'stickers', bg: '#232316', colors: ['#babd48', '#c7c7bb', '#e0453a', '#6ab04c', '#e8c02a'] },
	// KG-7 Vulcan
	Treeline: { k: 'motif', m: 'treeline', bg: '#352f22', colors: ['#473f2e', '#60553d', '#7b6a4a', '#9d815d', '#c06a2a'] },
	Spidersilk: { k: 'motif', m: 'web', bg: '#1e1e1e', colors: ['#8a8a8a'] },
	Tension: { k: 'spots', bg: '#363029', colors: ['#edebe9', '#edebe9', '#7e7160', '#e49e30'], n: 34, size: 9 },
	// Astaroth .57
	'Dry Brush': { k: 'stripes', bg: '#4f4a39', layers: [['#413d2d', 9, 12], ['#5e5947', 8, 10], ['#6e6855', 8, 8], ['#807a66', 9, 2]], angle: -55, len: 60, smooth: true },
	Backcountry: { k: 'blobs', bg: '#564d25', layers: [['#8c6b35', 8, 11], ['#c28239', 10, 10], ['#cb9d56', 9, 9], ['#211d18', 10, 7]] },
	'Dread Plague': { k: 'motif', m: 'plague', bg: '#0e150b', colors: ['#b53e20', '#d8603a', '#aadf70', '#50ac32'] },
	// Signal 50
	Anaconda: { k: 'scales', bg: '#27271d', c: '#1b1b14', hi: '#736a47', size: 6, bands: ['#736a47', '#5b5235', '#413a25'] },
	Ripplewave: { k: 'waves', bg: '#03040d', colors: ['#161836', '#343e64', '#516d93', '#79a4bf', '#03040d'], n: 12, amp: 7 },
	Sunburn: { k: 'gradient', stops: ['#f1d784', '#e4b149', '#db7914', '#e4b149', '#f1d784'], angle: 90, slashes: '#2d1d0c' },
	// SANG 9mm
	Autumn: { k: 'motif', m: 'leaves', bg: '#33221b', colors: ['#714a31', '#bcab98', '#c69f56', '#987e67'] },
	Snakeskin: { k: 'scales', bg: '#2f2d2a', c: '#1f1d1b', hi: '#685f56', size: 5, bands: ['#92897d', '#c2baac', '#484542'] },
	'Space Time': { k: 'motif', m: 'planets', bg: '#201f1c', colors: ['#d7942f', '#a14c2e', '#30918e', '#e0663a'] },
	// Krait P68
	'Off Grid': { k: 'solid', c: '#5e413d' },
	'Urban Flamingo': { k: 'stripes', bg: '#1f1d1e', layers: [['#2f2c2e', 12, 7], ['#56424a', 8, 5], ['#e2aec2', 16, 3.5]], angle: -6, len: 22, jitter: 10 },
	Smokescreen: { k: 'blobs', bg: '#b0b0b0', layers: [['#dedede', 10, 12], ['#888888', 9, 10], ['#626262', 8, 8], ['#404040', 6, 6]], sx: 1.8, blur: 0.8, z: 1.3 },
	// .50 GS
	Frosted: { k: 'gradient', stops: ['#fc91bc', '#faadc4', '#fcb9a7', '#f9a5ad', '#fc91bc'], angle: 90, specks: ['#fff6d8', '#7fd0e8', '#b98bd8', '#f2e27a', '#ffffff'] },
	'Splatter Ops': { k: 'splats', bg: '#151412', colors: ['#8fd13a', '#c64fd0', '#2ab8c8', '#ff5a8a', '#e8c02a', '#e0662a'], n: 9, size: 4 },
	'Red Tiger': { k: 'stripes', bg: '#201e19', layers: [['#341618', 9, 9], ['#4c0f18', 9, 8], ['#670d1c', 8, 7], ['#86081e', 9, 6]], angle: -14, len: 58, smooth: true },
	// Mojave .357
	Miami: { k: 'motif', m: 'palms', bg: '#402162', colors: ['#402162', '#892973', '#c84383', '#5478a8', '#1a0b2a'] },
	Wallpaper: { k: 'motif', m: 'wallpaper', bg: '#b8c5b2', colors: ['#7f8a6b', '#eeecda', '#d9a3ad', '#e0c060'] },
	Garland: { k: 'motif', m: 'ferns', bg: '#2c2c21', colors: ['#444232', '#544e37', '#6a6a52', '#3d4650'] },
	// PILA
	Frontier: { k: 'blobs', bg: '#b7a173', layers: [['#e7d3a6', 10, 11], ['#956f4b', 10, 10], ['#533e2d', 9, 8], ['#18110c', 8, 6]] },
	Sandwash: { k: 'splats', bg: '#dab8ac', colors: ['#cc948c', '#a2635f', '#b52b2a', '#3e1d1a', '#b52b2a'], n: 16, size: 5 },
	'Digital Fall': { k: 'pixels', bg: '#9a9f8d', layers: [['#af9f53', 0.28, 4], ['#232123', 0.26, 4], ['#d5801f', 0.13, 3], ['#68573b', 0.1, 2]], cell: 8 },
	// RPG-8
	'Digi Bark': { k: 'motif', m: 'bark', bg: '#373b2e', colors: ['#878b7f', '#5d6255', '#72776a', '#484d40'] },
	'Stone Bits': { k: 'pixels', bg: '#282a26', layers: [['#a4a0a4', 0.22, 3], ['#f1f1f3', 0.2, 3], ['#9fe53b', 0.2, 3], ['#d3d8d1', 0.1, 2]], cell: 12 },
	'Bubblegum Ops': { k: 'blobs', bg: '#f795c2', layers: [['#fba5ce', 12, 10], ['#fdb4d8', 10, 9], ['#f5cee5', 10, 7], ['#ef80b1', 8, 5]], sx: 2 },
	// JOKR
	Thicket: { k: 'blobs', z: 1.1, bg: '#49402d', layers: [['#665438', 40, 5], ['#76704d', 30, 4], ['#8a4a2a', 18, 3.5], ['#a39a67', 14, 3], ['#373329', 24, 4]] },
	Tectonic: { k: 'motif', m: 'tectonic', bg: '#333536', colors: ['#0c0f11', '#9f8744', '#979c9c', '#656358'] },
	'Blue Tiger': { k: 'stripes', bg: '#171d20', layers: [['#182434', 9, 9], ['#172a48', 9, 8], ['#263a54', 9, 6], ['#2d4767', 9, 5]], angle: -26, len: 52 },
	// PM-40 Anvil
	'Night Snow': { k: 'blobs', bg: '#64645f', layers: [['#464643', 11, 12], ['#21211f', 8, 9], ['#7c7c78', 10, 9], ['#93928e', 8, 7]], blur: 1 },
	Recursive: { k: 'shards', bg: '#0a1708', colors: ['#16330a', '#3c4f17', '#a2a8a0', '#6d7763', '#2e6a12'], n: 70, size: 16, glow: '#4fa21e' },
	'Urban Standard': { k: 'blobs', z: 2, bg: '#e6dada', layers: [['#85202d', 12, 11], ['#132038', 10, 10], ['#49293d', 6, 7], ['#85202d', 6, 7]] },
	// FSS Carbon Edge 1095
	'Raster Lite': { k: 'shards', bg: '#1e2424', colors: ['#adab8d', '#225864', '#dba62c', '#71775b', '#1e2424'], n: 70, size: 16 },
	Stockpile: { k: 'motif', m: 'rods', bg: '#3f382e', colors: ['#211a11', '#5a5247', '#766e61', '#989083'] },
	Deathbed: { k: 'motif', m: 'skulls', bg: '#060606', colors: ['#b3b3b3', '#797979', '#202020'] }
};

/** Gold, Platinum and Harmonic Break in the card, like the ticked boxes in the list. */
export const LADDER_LOOKS: Record<'gold' | 'platinum' | 'harmonicBreak', Look> = {
	gold: { k: 'gradient', stops: ['#7a520f', '#f2cc66', '#b5852b', '#ffe7a0', '#8a5d12'], angle: 40 },
	platinum: { k: 'gradient', stops: ['#555c63', '#dfe5ea', '#8e969e', '#f7f9fb', '#646c74'], angle: 40 },
	harmonicBreak: { k: 'stripes', bg: '#140305', layers: [['#7c0c1d', 8, 14], ['#110204', 6, 10], ['#b2152f', 8, 8], ['#f01e3c', 14, 1.8]], angle: -28, len: 70 }
};
