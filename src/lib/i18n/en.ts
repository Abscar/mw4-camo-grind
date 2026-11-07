/**
 * Every piece of UI text, in one place, so the app can be translated later.
 * Game content (weapon names, challenge text) lives in src/lib/data instead.
 */
export const en = {
	title: { game: 'MW4', app: 'Camo Grind' },
	pageTitle: 'MW4 Camo Grind',

	theme: { label: 'Theme', current: (name: string) => `Theme: ${name}` },

	/** The Abscar theme's header extras. */
	operator: {
		label: 'Operator',
		callsign: 'Abscar',
		online: 'Online',
		rank: 'Rank',
		rankName: 'Iridescent'
	},
	/** The news buddy's speech bubble: nerfs, buffs, movement and patch changes only. */
	news: {
		hello: 'Yo Abscar!',
		today: (date: string) => `Nerfs & buffs for ${date}:`,
		noneToday: (date: string) => `No new nerfs or buffs on ${date}. Latest:`,
		latest: 'Latest nerfs & buffs:',
		none: 'No nerf or buff news right now. I’ll shout when the next patch drops.',
		newTab: 'opens in a new tab',
		/** The buddy's greeting changes with his mood (see NewsBuddy). */
		mood: {
			cheer: 'LET’S GOOO, Abscar! Weapon maxed!',
			sleep: 'Zzz… late night, Abscar.',
			sulk: 'Abscar… no new camos in a week?'
		}
	},
	/** Abscar theme: the red terminal text for a moment when the page opens. */
	boot: {
		title: 'ABSCAR OS // CAMO GRIND MODULE',
		hud: 'Booting HUD',
		camos: 'Loading camo data',
		arsenal: 'Scanning arsenal',
		weapons: (n: number) => `${n} weapons`,
		ok: 'OK',
		go: 'Target acquired. Start grinding.'
	},
	/** Abscar theme: the big flash when the 33rd Harmonic Break unlocks Divergence. */
	unlock: {
		title: 'Divergence unlocked',
		sub: (n: number, next: string) => `${n} Harmonic Breaks · next target: ${next}`
	},
	/** The one-line news banner (green radar box) above the KPI tiles. */
	banner: {
		heading: 'COD news',
		charlieX: 'Charlie Intel on X',
		more: 'More news',
		less: 'Less',
		justNow: 'just now',
		minutesAgo: (n: number) => `${n} min ago`,
		hoursAgo: (n: number) => `${n} h ago`,
		yesterday: 'yesterday'
	},
	hud: {
		mode: 'Analysis: camo grind',
		target: 'Target',
		allDone: 'None, every Mastery camo is complete',
		maxed: 'Weapons maxed',
		status: 'Status',
		grinding: 'Grinding',
		complete: 'Complete'
	},

	kpi: {
		label: 'Overall progress',
		percentDone: (pct: number) => `${pct}% done`,
		divergenceUnlocked: 'Unlocked',
		divergenceToGo: (n: number) => `${n} Harmonic Break${n === 1 ? '' : 's'} to go`,
		divergenceLaunchOnly: 'Counting launch weapons only'
	},

	toolbar: {
		search: 'Search weapons',
		searchPlaceholder: 'Search weapons…',
		clearSearch: 'Clear search',
		hideMaxed: 'Hide maxed weapons',
		classFilter: 'Show class',
		allClasses: 'All'
	},

	weapon: {
		column: 'Weapon',
		level: (n: number) => `Lv ${n}`,
		battlePass: (tier: number) => `BP tier ${tier}`,
		event: 'S1 event',
		newBadge: 'New',
		newBadgeLong: 'New in Season 1',
		maxed: 'Maxed',
		toggle: (camo: string, weapon: string) => `${camo}: ${weapon}`,
		/** Read out after the weapon's name on the button that opens its card. */
		openHint: 'open its card: focus list, note, buffs and nerfs',
		focused: 'on your focus list',
		buff: 'Buff',
		nerf: 'Nerf',
		balanceLong: (change: 'buff' | 'nerf', patch: string) =>
			`${change === 'buff' ? 'Buffed' : 'Nerfed'} in the ${patch} patch`,
		editNote: 'Edit your note'
	},

	/** The weapon card that opens when you tap a weapon. */
	sheet: {
		focusAdd: 'Add to focus list',
		focusRemove: 'Remove from focus list',
		focusFull: (n: number) => `Your focus list is full (${n} weapons). Remove one from it first.`,
		note: 'Your note',
		notePlaceholder: 'e.g. longshots work best on the big maps',
		noteSaved: 'Saved as you type',
		charsLeft: (n: number) => `${n} left`,
		next: 'Next camo',
		maxed: 'Every camo done ◆',
		balance: (change: 'buff' | 'nerf', patch: string, date: string) =>
			`${change === 'buff' ? 'Buffed' : 'Nerfed'} in ${patch} (${date})`,
		balanceSource: (sources: string) => `From the patch notes, via ${sources}.`,
		noBalance: (patch: string) => `No changes to this gun in the ${patch} patch.`,
		meta: 'Meta class',
		close: 'Done'
	},

	/** The focus list: up to FOCUS_MAX pinned weapons in the first box. */
	focus: {
		heading: 'Focus',
		sub: (n: number, max: number) => `${n}/${max} pinned`,
		next: 'Next',
		maxed: 'Maxed, every camo done ◆',
		howTo: 'Tap a weapon to unpin it or edit its note.',
		tip: 'Tip: tap a weapon’s name to pin it to your focus list or write a note about it.'
	},

	loadout: {
		tag: 'Meta',
		open: (weapon: string) => `Meta class for ${weapon} (Multiplayer and Warzone)`,
		title: (weapon: string) => `${weapon} meta class`,
		modes: { mp: 'Multiplayer', wz: 'Warzone' },
		none: {
			mp: 'No Multiplayer meta class published for this gun yet.',
			wz: 'No Warzone meta class published for this gun yet.'
		},
		snapshot: (date: string) =>
			`A snapshot of the meta sites on ${date}. The meta moves with every balance patch, so double-check after big updates.`,
		close: 'Close'
	},

	cls: {
		number: (n: number) => String(n).padStart(2, '0'),
		maxed: 'Class maxed',
		allHidden: 'Every weapon in this class is maxed ◆',
		challenges: 'Challenges'
	},

	unverified: 'unconfirmed',
	unverifiedHint: 'Only one source says this so far, or sources disagree. Double-check in game.',

	empty: {
		noMatch: (q: string) => `No weapons match “${q}”.`,
		noMatchInClass: (q: string, cls: string) => `No weapons in ${cls} match “${q}”.`,
		showAll: 'Show everything'
	},

	mastery: {
		heading: 'Divergence & Mastery',
		sub: 'Account-wide · unlocks in order',
		fromTicks: 'Fills in from your Harmonic Break ticks',
		decrease: (name: string) => `One less for ${name}`,
		increase: (name: string) => `One more for ${name}`,
		count: (name: string) => `${name}: times done`,
		of: (target: number) => `/ ${target}`,
		status: { locked: 'Locked', active: 'Active', complete: 'Complete' },
		lockedBy: (prev: string) => `Unlocks when ${prev} is complete`
	},

	sync: {
		heading: 'Backup & other devices',
		intro:
			'Your ticks are saved in this browser only. To use them on another device, copy your progress link and open it there. Export a backup file now and then, just in case.',
		copyLink: 'Copy my progress link',
		exportFile: 'Export backup (.json)',
		importFile: 'Import backup…',
		reset: 'Reset…',
		linkDialogTitle: 'Your progress link',
		linkDialogBody:
			'Open this link on your phone or another computer to load your ticks there. It holds all your progress, so send it only to yourself.',
		linkCopy: 'Copy',
		linkCopied: 'Copied',
		linkCopyManual:
			'Your browser didn’t allow copying automatically. The link is selected: press Ctrl+C (or long-press and choose Copy on a phone).',
		linkShare: 'Share…',
		close: 'Close',
		linkNotAvailable:
			'Progress links need the online version of the tracker. Use “Export backup” to move your ticks instead.'
	},

	reset: {
		title: 'Reset all progress?',
		body: 'Gold goes back to ticked on the launch weapons, and every other tick and Mastery count is cleared. Export a backup first if you might want it back.',
		exportFirst: 'Export backup first',
		confirm: 'Reset',
		cancel: 'Cancel'
	},

	linkImport: {
		title: 'Load progress from this link?',
		body: (link: string, here: string) =>
			`The link has ${link}. This browser has ${here}. Loading the link replaces what this browser has.`,
		use: 'Load the link',
		keep: 'Keep this browser’s'
	},

	summary: (gold: number, plat: number, hb: number) => `${gold} Gold, ${plat} Platinum and ${hb} Harmonic Break`,

	toast: {
		undo: 'Undo',
		exported: 'Backup saved to your downloads',
		imported: 'Backup loaded',
		importedOld: 'Your ticks from the old tracker were brought over',
		badFile: 'That file isn’t an MW4 Camo Grind backup',
		reset: 'Progress reset',
		linkLoaded: 'Progress loaded from the link',
		badLink: 'That progress link is broken or incomplete, so nothing was changed',
		corruptSave: 'Your saved progress couldn’t be read. A copy was kept, and you’re starting from the default.',
		notSaving: 'This browser isn’t saving your ticks (private window or full storage). Export a backup before you close it.'
	},

	help: {
		howTo:
			'Tap a box to tick it. Ticking a higher camo fills in the ones below it; unticking a lower one clears the ones above. Tap a weapon’s name to pin it to your focus list, write a note or see its latest buff or nerf.',
		divergence: (n: number) =>
			`Divergence unlocks at ${n} Harmonic Breaks. Whether Season 1 weapons count toward that is not confirmed yet.`,
		sources:
			'Challenges from the codmunity.gg MW4 camo guide, cross-checked with Destructoid, games.gg, GamerFuzion and CarrySquad. Weapon list from Gfinity, Dexerto and Destructoid. Multiplayer only.',
		unverifiedLegend: 'Dotted underline = unconfirmed, double-check in game.'
	}
} as const;

export const t = en;
