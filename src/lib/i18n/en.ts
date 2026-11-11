/**
 * Every piece of UI text, in one place, so the app can be translated later.
 * Game content (weapon names, challenge text) lives in src/lib/data instead.
 */
export const en = {
	title: { game: 'MW4', app: 'Camo Grind' },
	pageTitle: 'MW4 Camo Grind',

	theme: { label: 'Theme', current: (name: string) => `Theme: ${name}` },
	/** Compact mode between matches (header button; saved per device). */
	compact: {
		label: 'Compact mode',
		short: 'Compact',
		on: 'Compact mode: on. Focus weapons and quick updates first, less decoration.',
		off: 'Compact mode: off'
	},
	/** The CS2 skin price search in the header's top row (BuffSearch): opens BUFF163's market search in a new tab. */
	buff: {
		label: 'Search CS2 skin prices on BUFF163',
		placeholder: 'Skin → BUFF163',
		heading: 'Skin prices · BUFF163',
		go: 'Search BUFF163 (opens in a new tab)',
		open: 'Search CS2 skin prices on BUFF163',
		close: 'Close the BUFF163 search',
		hint: 'Opens BUFF163 in a new tab. BUFF shows prices once you’re logged in there.'
	},
	/** The save / sync status in the header (truthful: "Synced" only after the sync service confirmed). */
	saveStatus: {
		saved: 'Saved in this browser',
		notSaving: 'Not saving in this browser',
		syncing: 'Syncing…',
		synced: 'Synced',
		offline: 'Couldn’t sync (offline). Saved here',
		error: 'Couldn’t sync. Saved here',
		open: 'Backup & sync settings'
	},
	/** Skip link + section names for the page's main parts. */
	nav: {
		skip: 'Skip to the weapon list'
	},
	/** Sound effects for your own ticks (button next to the theme picker; off by default). */
	sound: { label: 'Sound effects', on: 'Sound effects: on', off: 'Sound effects: off' },

	/** The Abscar theme's header extras. */
	operator: {
		label: 'Operator',
		callsign: 'Abscar',
		/** Abscar's squadmate, shown with his own emblem next to Abscar's */
		mate: 'Phillestar',
		online: 'Online',
		rank: 'Rank',
		rankName: 'Iridescent',
		/** label on the frame round both operator tags + the rank badge (they're both Iridescent) */
		squad: 'Squad',
		bothRanked: 'Both ranked'
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
	/** Abscar theme: tapping the news buddy (he coughs, blows a smoke ring or laughs). */
	buddy: {
		poke: 'Poke the weed buddy',
		/** He grows with your grind (buddyGrowth.ts): the line under his speech bubble. */
		growth: 'Growth',
		stages: {
			seedling: 'Seedling',
			sprout: 'Sprout',
			bush: 'Bush',
			bigBush: 'Big bush',
			monster: 'Monster',
			legend: 'Legend'
		},
		stageOf: (n: number, total: number) => `${n}/${total}`,
		toSteps: (n: number) => `${n} more camo${n === 1 ? '' : 's'} and he grows`,
		toDivergence: (n: number) => `turns into a monster at Divergence (${n} Harmonic Break${n === 1 ? '' : 's'} to go)`,
		toMastery: 'gets an aura when a Mastery camo is done',
		top: 'fully grown',
		grew: (stage: string) => `I GREW! ${stage} unlocked!`
	},
	/** Abscar theme: the red terminal text for a moment when the page opens. */
	boot: {
		/** big greeting above the terminal text; `crew` is split where it may wrap on phones */
		welcome: 'Welcome',
		crew: ['Abscar', '& Phillestar'],
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
	/**
	 * Abscar theme: the secret terminal (AbscarTerminal, 2026-11-11). Opens when you type "abscar" (or
	 * press § / `) anywhere outside a text field, or tap the red HUD box 5 times. Just for fun.
	 */
	terminal: {
		label: 'Abscar OS terminal',
		title: 'ABSCAR OS // TERMINAL',
		close: 'Close the terminal',
		input: 'Command',
		quick: 'Quick commands',
		boot: ['ABSCAR OS v4.20 // CAMO GRIND TERMINAL', 'Operator Abscar authenticated. Squad link: Phillestar.', 'Type “help” for commands. “exit” or Esc closes.'],
		help: [
			'help              this list',
			'status            your camo grind in numbers',
			'next              what to grind next',
			'weapon <name>     one gun, e.g. “weapon m4”',
			'season            how long Season 1 has left',
			'buddy             how grown the weed buddy is',
			'whoami · squad    who’s online',
			'nuke · hack · holk · 420',
			'clear · exit'
		],
		statusRow: (label: string, value: string) => `${label.padEnd(16, ' ')}${value}`,
		divergenceLeft: (n: number) => (n > 0 ? `(${n} to go)` : '(UNLOCKED)'),
		buddyValue: (stage: string, n: number, total: number) => `${stage} (${n}/${total})`,
		nextMilestone: (text: string) => `> Next milestone: ${text}`,
		nextRoad: 'Closest to Harmonic Break:',
		nextRow: (n: number, weapon: string, step: string) => `  ${n}. ${weapon}: ${step}`,
		nextNone: 'Every weapon has Harmonic Break. Go grind Mastery, operator.',
		weaponUsage: 'Usage: weapon <name>, e.g. “weapon kastov”',
		weaponNotFound: (q: string) => `No weapon matches “${q}”.`,
		weaponLine: (name: string, cls: string) => `${name} // ${cls}`,
		weaponSteps: (steps: string) => `Steps: ${steps}`,
		weaponNext: (step: string) => `Next: ${step}`,
		weaponMaxed: 'Maxed. Every camo done. ◆',
		weaponNotOut: 'Not out yet.',
		seasonLine: (name: string, day: number, length: number) => `${name}: day ${day} of ≈ ${length}`,
		seasonEnds: (date: string, days: number) => `Ends ≈ ${date} (${days} days left, estimate)`,
		buddyLine: (stage: string, n: number, total: number, next: string) => `Weed buddy: ${stage} (${n}/${total}). ${next}.`,
		whoami: ['abscar', 'Rank: Iridescent. Status: grinding. Holk: lit.'],
		squad: ['ABSCAR ........ ONLINE', 'PHILLESTAR .... ONLINE (snack: hamburger, favourite reward: the nuke)'],
		nuke: ['!!! TACTICAL NUKE INBOUND !!!'],
		nukeCount: (n: number) => `  ${n}...`,
		nukeAfter: ['...', 'Just kidding. Your camos survived.', 'Phillestar says hi.'],
		hackDone: ['ACCESS GRANTED.', 'Bad news: you still have to grind Harmonic Break yourself.'],
		holk: ['      ( (', '       ) )', '  =========================*', '*puff puff* Tap the one in the ashtray for the real thing.'],
		blaze: 'Blaze it. The weed buddy approves.',
		gg: 'gg ez',
		sudo: 'Permission denied: even root has to grind the camos.',
		rm: 'Nice try. Your ticks are safe.',
		date: (when: string) => when,
		notFound: (cmd: string) => `Command not found: ${cmd}. Type “help”.`
	},
	/** Abscar theme: the cyborg banner is a just-for-fun button (its eyes flare and fire lasers). */
	cyborg: { wake: 'Wake the cyborg' },
	/** Abscar theme: the old TV in the header that plays classic CoD montages (RetroTv, data/montages.ts). */
	tv: {
		label: 'Old TV playing classic CoD montages',
		frame: 'Classic Call of Duty montages (YouTube)',
		/** the made-up maker's name on the plate under the screen while it's off */
		brand: 'Abscarvision',
		watch: 'Tap to watch',
		noSignal: 'No signal',
		watchOnYouTube: 'Watch on YouTube',
		channel: (n: number) => `CH ${String(n).padStart(2, '0')}`,
		prev: 'Previous channel',
		next: 'Next channel',
		sound: 'TV sound',
		power: 'TV on / off'
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
		divergenceLaunchOnly: 'Counting launch weapons only',
		/** what the number under each tile counts */
		weaponsUnit: 'weapons',
		divergenceUnit: 'Harmonic Breaks needed',
		/** the small line under the tiles: catalogue size and camo steps */
		steps: (done: number, total: number) => `${done} / ${total} camo steps`,
		catalogue: (weapons: number, camos: number) => `${weapons} weapons × ${camos} camos`,
		next: 'Next milestone',
		nextDivergence: (n: number) => `Divergence: ${n} more Harmonic Break${n === 1 ? '' : 's'}`,
		nextMastery: (name: string, mode: string, count: string, target: string) => `${name} (${mode}): ${count} / ${target}`,
		nextAllDone: 'Every Mastery camo is complete ◆',
		season1Note: 'Includes Season 1 weapons: whether they count toward Divergence isn’t confirmed yet.',
		/** "What do these numbers mean?" */
		explain: 'What do the numbers mean?',
		explainCatalogue: (weapons: number, launch: number, s1: number) =>
			`Weapons in the tracker: ${weapons} (${launch} at launch, ${s1} from Season 1), Multiplayer only.`,
		explainSteps: (camos: number, total: number) =>
			`Camo steps: each weapon has ${camos} ladder camos (Gold, Platinum, Harmonic Break), ${total} in all. The tiles count weapons that have each camo.`,
		explainDivergence: (needed: number, weapons: number) =>
			`Divergence: unlocks when ${needed} of the ${weapons} weapons have Harmonic Break. Only Harmonic Breaks count toward it.`,
		explainMastery:
			'Mastery: account-wide, one track per mode (Multiplayer, Warzone, DMZ). Each opens once Divergence is unlocked, then runs in order. You count those in the Mastery section.'
	},

	/** The grind stats line under the KPI tiles (stats.ts). */
	stats: {
		label: 'Your grind',
		today: 'Today',
		week: 'This week',
		camos: (n: number) => `${n} camo${n === 1 ? '' : 's'}`,
		divergence: 'Divergence',
		eta: (days: number, date: string) => `≈ ${days} day${days === 1 ? '' : 's'} (${date})`,
		etaLong: 'At your pace of the last two weeks (Harmonic Breaks ticked per day).',
		tooSoon: 'estimate after 2 days of ticking',
		noPace: 'no Harmonic Break in 14 days',
		unlocked: 'unlocked'
	},

	toolbar: {
		search: 'Search weapons',
		searchPlaceholder: 'Search weapons…',
		clearSearch: 'Clear search',
		hideMaxed: 'Hide maxed weapons',
		classFilter: 'Show class',
		allClasses: 'All',
		statusFilter: 'Show weapons that are',
		status: {
			started: 'Started',
			near: 'Near done',
			focus: 'Focus',
			done: 'Done',
			available: 'Available now'
		},
		statusHelp: {
			started: 'At least one camo or before-Gold challenge done or counted, not maxed yet.',
			near: 'A challenge you’re on is at least 75% done by its own counter, or all 3 challenges before Gold are done. Each challenge only counts against its own target.',
			focus: 'The weapons on your focus list.',
			done: 'Gold, Platinum and Harmonic Break all ticked.',
			available: 'Out now with a next camo to earn (leaves out maxed weapons and weapons that aren’t released yet).'
		},
		results: (n: number, total: number) => `${n} of ${total} weapons`,
		clear: 'Clear filters',
		legend: 'G = Gold · P = Platinum · HB = Harmonic Break',
		/** Abscar: the joint in the ashtray at the end of the search row is a just-for-fun button. */
		holkTap: 'Tap the ash off'
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
		openHint: 'open its card: challenges before Gold, focus list, note, buffs and nerfs',
		focused: 'on your focus list',
		buff: 'Buff',
		nerf: 'Nerf',
		balanceLong: (change: 'buff' | 'nerf', patch: string) =>
			`${change === 'buff' ? 'Buffed' : 'Nerfed'} in the ${patch} patch`,
		editNote: 'Edit your note',
		/** The Special camos (the 3 challenges before Gold, ticked in the weapon card). */
		preGoldPips: (n: number, total: number) => `${n} of ${total} challenges before Gold done`,
		preGoldShort: 'Before Gold',
		goldReady: 'Gold ready!',
		/** what unticking a lower camo also does (in the box's label) */
		untickClears: (higher: string) => `unticking also clears ${higher}`,
		/** Season 1 weapons' Harmonic Break box: may not count toward Divergence */
		s1Divergence: 'Season 1 weapon: whether its Harmonic Break counts toward Divergence isn’t confirmed',
		/** small progress line under a weapon in the list */
		progressLine: (step: string, count: number, target: number) => `${step} ${count}/${target}`,
		preGoldLine: (n: number, total: number) => `Before Gold ${n}/${total}`,
		/** the Multiplayer meta badge in the list (only guns in the MP overall top list) */
		metaBadge: 'MP meta',
		metaBadgeLong: (date: string, sources: string) =>
			`In the Multiplayer overall top 5 (${sources}, ${date}). Tap the weapon for its builds.`
	},

	/** A step's counter (StepCounter): how far a challenge you're on is. */
	counter: {
		minus: (n: number) => `Minus ${n}`,
		plus: (n: number) => `Plus ${n}`,
		value: (name: string) => `${name}: how many so far`,
		of: (target: number) => `/ ${target}`,
		left: (n: number) => `${n} to go`,
		/** what the number counts */
		unitTotal: (unit: string) => unit,
		unitRepeat: (feat: string) => `times: ${feat}`,
		once: 'Has to happen in one match, so there is nothing to add up. Tick it when you get it.',
		undo: 'Undo',
		undoLabel: (name: string) => `Undo the last change to ${name}`,
		/** read out a moment after the last tap (not on every tap) */
		announce: (name: string, count: number, target: number) => `${name}: ${count} of ${target}, ${target - count} to go`,
		completed: (camo: string, weapon: string) => `${camo} done on ${weapon} ✔`
	},

	/** Step status words (always with an icon, never colour alone). */
	step: {
		done: 'Done',
		active: 'On it',
		locked: 'Locked',
		lockedGold: 'Opens when the 3 challenges before Gold are done (and the weapon has its 8 level-up camos)',
		lockedLadder: (prev: string) => `Opens after ${prev}`,
		lockedUnreleased: 'Not out yet'
	},

	/** Toasts for ticks (only when a tap does more than it shows). */
	tickToast: {
		cleared: (camo: string, weapon: string, higher: string) => `${camo} unticked on ${weapon}. ${higher} cleared too.`,
		and: ' and '
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
		/** The weapon's 3 Special camos: the challenges before Gold. */
		preGold: 'Before Gold: 3 challenges',
		preGoldSoon: 'Before Gold',
		preGoldDone: 'Done',
		preGoldDoneLong: 'Done: this weapon has Gold, so these are finished',
		preGoldHint:
			'Tick them off as you go. Each one opens at a set weapon level. Gold opens when all three are done and the weapon has its 8 level-up camos.',
		preGoldCount: (n: number, total: number) => `${n}/${total} done`,
		preGoldLocked: 'Done: this weapon has Gold. Untick Gold to change these.',
		preGoldUnknown: 'Not out yet. Its challenges are added here when the weapon is released.',
		/** All 3 ladder camos with their challenges, always shown. */
		camos: 'Camo challenges',
		camoDone: 'Done',
		balance: (change: 'buff' | 'nerf', patch: string, date: string) =>
			`${change === 'buff' ? 'Buffed' : 'Nerfed'} in ${patch} (${date})`,
		balanceSource: (sources: string) => `From the patch notes, via ${sources}.`,
		noBalance: (patch: string) => `No changes to this gun in the ${patch} patch.`,
		meta: 'Meta class',
		close: 'Done',
		/** new in the card (2026-11-10) */
		classLine: (cls: string, season: string) => `${cls} · ${season}`,
		seasonLaunch: 'Launch weapon',
		seasonS1: 'Season 1 weapon',
		unlock: 'Unlock',
		progress: 'Progress',
		builds: 'Builds (Multiplayer & Warzone)',
		metaHeading: 'Meta build',
		metaTier: (tier: string, rank: number, cls: string, date: string) =>
			`Multiplayer meta: ${tier} tier, #${rank} in ${cls} (snapshot ${date})`,
		metaNone: 'Not in the Multiplayer meta lists right now.',
		balanceHeading: 'Latest balance patch',
		noteHeading: 'Note',
		/** the card's progress track, header and tabs (2026-11-11) */
		trackDone: (n: number, total: number) => `${n} of ${total} steps done`,
		trackNext: (step: string) => `Next up: ${step}`,
		trackAll: 'Every camo done ◆',
		trackShort: { g: 'G', p: 'P', hb: 'HB' },
		closeCard: 'Close',
		file: 'Weapon file',
		tabs: { camos: 'Camos', meta: 'Meta', info: 'Info' },
		tabsLabel: 'Weapon details'
	},

	/** "Continue grinding": the focus list, right under the progress overview. */
	focus: {
		heading: 'Continue grinding',
		sub: (n: number, max: number) => `${n}/${max} pinned`,
		next: 'Next',
		maxed: 'Maxed, every camo done ◆',
		howTo: 'Tap a weapon to unpin it or edit its note.',
		tip: 'Tip: tap a weapon’s name to see its 3 challenges before Gold, pin it to your focus list or write a note about it.',
		open: (weapon: string) => `Open ${weapon}`,
		note: 'Note',
		addNote: 'Add note',
		unpin: 'Unpin',
		emptyTitle: 'Pin the weapons you’re grinding',
		emptyBody: (max: number) =>
			`Pin up to ${max} weapons and they show up here with the challenge you’re on, a counter and quick ticks, so you can update between matches without scrolling.`,
		emptyHow: 'Open any weapon (tap its name) and choose “Add to focus list”, or pin one of these:',
		emptyNone: 'Open any weapon (tap its name) and choose “Add to focus list”.',
		pin: 'Pin',
		pinLabel: (weapon: string) => `Pin ${weapon} to your focus list`,
		why: 'Why',
		reason: {
			goldReady: 'All 3 challenges before Gold are done, so Gold is next.',
			counter: (step: string, count: number, target: number) => `You’ve counted ${count} / ${target} on ${step}.`,
			lastCamo: (left: number, s1: boolean) =>
				left > 0
					? `Platinum done: Harmonic Break is its last camo, and Divergence needs ${left} more${s1 ? ' (if Season 1 weapons count, not confirmed)' : ''}.`
					: 'Platinum done: Harmonic Break is its last camo.',
			preGold: (done: number, total: number) => `${done} of ${total} challenges before Gold done.`
		},
		suggestNote: 'Picked from your own progress only, not from how fast a grind is.'
	},

	/** The season countdown under the news radar (SeasonStrip, data/season.ts). */
	season: {
		day: (day: number, length: number, sure: boolean) => `Day ${day} of ${sure ? '' : '≈ '}${length}`,
		ends: (date: string, sure: boolean) => (sure ? `ends ${date}` : `ends ≈ ${date}`),
		daysLeft: (n: number) => (n === 0 ? 'last day' : `${n} day${n === 1 ? '' : 's'} left`),
		estimate: 'estimate, not announced',
		ended: 'is over. The next season’s dates are added when they’re announced.',
		onNow: (date: string) => `on now (since ${date})`,
		inDays: (n: number, date: string) => `in ${n} day${n === 1 ? '' : 's'} (${date})`,
		sources: 'Where these dates come from',
		endLabel: 'Season end',
		checked: (date: string) => `Checked ${date}. Updated when Activision announces dates.`
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

	/** The meta list: the best guns per class in Multiplayer and Warzone (MetaSection). */
	metaList: {
		heading: 'Meta top 5',
		sub: 'Best guns per class right now',
		modeGroup: 'Game mode',
		overall: 'Overall',
		tier: (tier: string) => `${tier} tier`,
		/** A class with fewer guns than the list's length. */
		onlyN: (n: number) => `MW4 has only ${n} guns in this class so far.`,
		openHint: 'open its meta class',
		snapshot: (sources: string, date: string) =>
			`A snapshot of ${sources} on ${date}. The meta moves with every balance patch. Tap a gun for its meta class.`
	},

	/** The picked class's meta top 5 above its weapons (ClassMeta). */
	classMeta: {
		heading: (cls: string) => `${cls}: meta top 5`,
		snapshot: (sources: string, date: string) => `Snapshot of ${sources}, ${date}. Tap a gun for its build.`
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
		noMatchFilters: 'No weapons match these filters.',
		hideMaxedOn: '“Hide maxed weapons” is on too.',
		showAll: 'Show everything'
	},

	/** The fold-out panel with the COD news and the old TV (Abscarvision), lower on the page. */
	intel: {
		heading: 'News & Abscarvision',
		headingPlain: 'COD news',
		open: 'Show',
		close: 'Hide',
		latest: 'Latest:',
		videoNote: 'The TV only loads its videos while this panel is open.'
	},

	/** The boot screen: every page load, any tap or key skips it. */
	bootSkip: 'Tap to skip',

	mastery: {
		heading: 'Divergence & Mastery',
		sub: 'Account-wide · each mode unlocks in order',
		fromTicks: 'Fills in from your Harmonic Break ticks',
		decrease: (name: string) => `One less for ${name}`,
		increase: (name: string) => `One more for ${name}`,
		count: (name: string) => `${name}: times done`,
		of: (target: string) => `/ ${target}`,
		status: { locked: 'Locked', active: 'Active', complete: 'Complete' },
		lockedBy: (prev: string) => `Unlocks when ${prev} is complete`,
		/** One heading per mode's Mastery track (each opens with Divergence) and a short line about it. */
		modes: {
			mp: { name: 'Multiplayer', note: 'Any weapon · Multiplayer matches' },
			wz: { name: 'Warzone', note: 'Any MW4 weapon · Warzone matches only' },
			dmz: { name: 'DMZ', note: 'Any weapon · DMZ deployments only' }
		}
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
			'Progress links need the online version of the tracker. Use “Export backup” to move your ticks instead.',
		/** The intro once automatic sync is online. */
		introSync:
			'Your ticks are saved in this browser. Turn on automatic sync to have them on your phone too. A progress link or a backup file moves them by hand.'
	},

	/** Automatic sync between devices (sync.svelte.ts), shown once the sync service is online. */
	autoSync: {
		heading: 'Automatic sync',
		offText:
			'Keep your ticks, notes and focus list the same on this browser and your phone, automatically. No account or password: a private sync link connects your devices.',
		onText:
			'On. Open your sync link once on your phone or another computer. After that, your ticks follow you both ways.',
		turnOn: 'Turn on sync',
		haveLink: 'I have a sync link…',
		showLink: 'Sync link for your phone',
		syncNow: 'Sync now',
		turnOff: 'Turn off on this device',
		status: {
			off: '',
			syncing: 'Syncing…',
			synced: 'Synced',
			offline: 'Offline: saved here, syncs when you’re back online',
			error: 'Couldn’t reach sync, trying again soon'
		},
		syncedAt: (time: string) => `Synced at ${time}`,
		linkTitle: 'Your sync link',
		linkBody:
			'Open this link once on your phone (or another computer). After that, your ticks, notes and focus list stay the same everywhere. Anyone with the link can see and change your ticks, so send it only to yourself.',
		pasteTitle: 'Use a sync link',
		pasteBody: 'Paste the sync link from your other device.',
		pasteLabel: 'Sync link',
		pasteUse: 'Connect',
		pasteBad: 'That doesn’t look like a sync link.',
		joinTitle: 'Turn on sync with this link?',
		joinBody: (synced: string, here: string) => `The synced ticks have ${synced}. This browser has ${here}.`,
		joinHint: '“Combine both” keeps the higher tick of every weapon from both, so nothing is lost.',
		joinCombine: 'Combine both',
		joinUse: 'Use the synced ticks',
		cancel: 'Cancel',
		toastOn: 'Sync is on. Open your sync link on your other device.',
		toastJoined: 'Sync is on. Your ticks from your other device are here.',
		toastOff: 'Sync is off on this device. Your ticks stay here.',
		toastAlready: 'Sync is already on with this link',
		toastNotFound: 'That sync link isn’t active, so nothing changed',
		toastOffline: 'You’re offline. Open the sync link again when you’re online.',
		toastError: 'Couldn’t reach sync just now. Try the link again in a moment.',
		resetNote: 'Sync is on, so this also resets your other devices.'
	},

	/** "Get it as an app": putting the tracker on the phone's home screen (InstallApp, in Backup & sync). */
	installApp: {
		heading: 'Get it as an app',
		/** the name under the home-screen icon on iPhone (the manifest's short_name says the same) */
		appName: 'Camo Grind',
		body: 'Put the tracker on your home screen: it opens full screen like an app and works without internet.',
		install: 'Install the app',
		installed: 'Installed. You’ll find it on your home screen or with your apps.',
		iosTitle: 'On iPhone (in Safari):',
		iosSteps: [
			'Tap Share (the square with an arrow) at the bottom of the screen.',
			'Choose “Add to Home Screen”, then Add.'
		],
		iosSync:
			'If the app opens without your ticks (iPhone can give it its own copy): in Safari, turn on sync and copy your sync link; in the app, tap “I have a sync link…” and paste it.',
		androidTitle: 'On Android (in Chrome):',
		androidSteps: ['Tap the ⋮ menu at the top right.', 'Choose “Install app” (or “Add to Home screen”).'],
		otherTitle: 'On your phone:',
		other: 'open this page there. iPhone (Safari): Share → Add to Home Screen. Android (Chrome): ⋮ → Install app.'
	},

	reset: {
		title: 'Reset progress?',
		body: 'Pick what to reset to. Your notes and focus list stay. Export a backup first if you might want it back.',
		presetLabel: 'Gold on launch weapons',
		presetBody: (launch: number) =>
			`Gold ticked on the ${launch} launch weapons, everything else cleared: Platinum, Harmonic Break, before-Gold ticks, counters and Mastery counts.`,
		zeroLabel: 'Start from zero',
		zeroBody: 'Nothing ticked at all, like a brand-new tracker. Before-Gold ticks, counters and Mastery counts cleared.',
		exportFirst: 'Export backup first',
		confirm: 'Reset',
		cancel: 'Cancel'
	},

	/** Importing a backup: checked first, then you confirm. */
	importCheck: {
		title: 'Load this backup?',
		body: (file: string, here: string) => `The backup has ${file}. This browser has ${here}. Loading it replaces this browser’s ticks.`,
		exported: (date: string) => `Saved on ${date}.`,
		notes: (n: number) => `It holds ${n} note${n === 1 ? '' : 's'}, which replace yours.`,
		noNotes: 'It holds no notes, so yours stay.',
		tooBig: 'That file is too big to be an MW4 Camo Grind backup',
		use: 'Load the backup',
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
			'Challenges from the codmunity.gg MW4 camo guide, cross-checked with Destructoid, games.gg, GamerFuzion and CarrySquad. Weapon list from Gfinity, Dexerto and Destructoid. Weapon challenges are Multiplayer’s; Mastery covers Multiplayer, Warzone and DMZ (DMZ also checked with codcentral).',
		unverifiedLegend: 'Dotted underline = unconfirmed, double-check in game.'
	}
} as const;

export const t = en;
