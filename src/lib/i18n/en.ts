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
		on: 'Compact mode: on. Less decoration.',
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
		open: 'Backup & sync settings',
		/** Phones up to 420 px: the same states in fewer words (the settings row is full there). */
		short: {
			saved: 'Saved here',
			notSaving: 'Not saving',
			syncing: 'Syncing…',
			synced: 'Synced',
			offline: 'Not synced',
			error: 'Not synced'
		}
	},
	/** Skip link + section names for the page's main parts. */
	nav: {
		skip: 'Skip to the weapon list'
	},
	/** The page's two big tabs (2026-11-12): the camo tracker and Ranked prep. */
	/** The Camo list / Ranked prep switch above the weapon list (PageTabs.svelte). */
	rankTabs: {
		label: 'Camo list or Ranked prep',
		tabs: {
			grind: { name: 'Camo list', sub: 'Your camos, weapon by weapon' },
			ranked: { name: 'Ranked prep', sub: 'CDL rules, bans and ranked classes' }
		}
	},
	/** The Ranked prep tab (RankedSection; data in data/ranked.ts). */
	ranked: {
		heading: 'Ranked prep',
		sub: 'Get ready before Ranked Play opens',
		jump: 'Jump to',
		sections: {
			weapons: 'Weapons',
			attachments: 'Attachments',
			gear: 'Equipment & perks',
			classes: 'Ranked classes',
			maps: 'Maps & modes',
			hp: 'Hardpoint rotations',
			info: 'About Ranked',
			prep: 'Prep list'
		},
		tiles: {
			ranked: 'Ranked Play',
			rankedValue: 'Season 2',
			rankedSub: 'No date yet',
			cdl: 'CDL 2027 starts',
			cdlIn: (days: number) => (days <= 0 ? 'Live now' : days === 1 ? 'Tomorrow' : `In ${days} days`),
			rules: 'Ruleset',
			rulesSub: (date: string) => `Official, posted ${date}`
		},
		trust: {
			official: 'Official',
			pro: 'Pros',
			guide: 'Guides',
			community: 'Community',
			estimate: 'Estimate',
			lastYear: 'Last year (BO7)'
		},
		trustHint: {
			official: 'From the Call of Duty League or Activision',
			pro: 'What pros used at the launch-week tournaments',
			guide: 'From guide sites that track pro scrims, not official',
			community: 'A community ladder’s own rules, not official',
			estimate: 'A guess from news sites, not announced',
			lastYear: 'How Black Ops 7’s Ranked worked last year, for reference'
		},
		rulesIntro: (name: string) =>
			`Ranked has used the pro rules in past CoDs, so these are the rules to prepare for: the Call of Duty League’s ${name}. It lists what’s restricted; everything else is allowed.`,
		rulesLink: 'Read the CDL rules',
		allowed: 'Allowed',
		restricted: 'Restricted',
		bannedTag: 'Banned',
		allClass: (name: string) => `All ${name}`,
		weaponsHint: 'Tap a gun to open its card.',
		attachments: {
			slotAll: (slot: string) => `${slot}s: all of them`,
			apexAll: 'Every Apex attachment',
			laserAll: 'Every laser',
			rest: 'Every attachment not listed here is allowed. The CDL doesn’t restrict ammo types.'
		},
		gearNote: 'Big pictures are allowed; the greyed, crossed-out ones are restricted.',
		classes: {
			intro: 'Attachments only. Pro builds first, then a build for every other gun that’s allowed in ranked.',
			proHeading: 'What the pros run',
			restHeading: 'Every other ranked-legal gun',
			publicBuild: 'Public MP build',
			bannedPart: 'Banned in CDL: leave it off or pick another',
			cleanPart: 'CDL-legal',
			noBuild: 'No published build yet.',
			pros: (names: string) => `Seen on: ${names}`,
			secondary: (name: string) => `Secondary: most comp players carry the ${name}, usually with no attachments.`,
			openCard: 'Open the weapon card'
		},
		maps: {
			shared: 'In every mode'
		},
		hp: {
			heading: 'Hardpoint rotations',
			intro: 'The hills come up in this order every game, 60 s each, and loop back to P1 after the last one. The next hill shows 10 s before it goes live, so rotate early.',
			hills: (n: number) => `${n} hills`,
			loop: 'Back to P1',
			longest: (from: number, to: number) => `Longest run: P${from} → P${to}`,
			shortest: (from: number, to: number, s: number) => `Shortest: P${from} → P${to}, ${s} s`,
			seconds: (s: number) => `${s} s`,
			disputed: 'Name differs between guides',
			mapLabel: (map: string, n: number) => `Rough minimap of ${map}: where hills P1 to P${n} are and the order they come up in`,
			mapNote: 'Rough spots, north up. Our own sketch, not the game’s minimap.',
			mapLink: 'Real map on Scout Drop'
		},
		info: {
			status: 'What we know',
			lastYear: 'Last year’s Ranked (Black Ops 7), for reference',
			ranksHeading: 'Skill divisions last year',
			ranksNote: 'SR each tier starts at in Black Ops 7 (Activision doesn’t publish them; G FUEL’s list). MW4’s may differ.',
			tier: (n: number) => ['I', 'II', 'III'][n] ?? ''
		},
		prepHeading: 'Do this before Ranked opens',
		community: {
			summary: 'Stricter community ladders (not official)',
			intro: 'Some ladders ban more than the CDL. Handy if you play their matches:'
		},
		snapshot: (date: string) => `Checked ${date}. The CDL says its rules will change during the season; this tab gets updated when they do.`
	},
	/** Sound effects for your own ticks (button next to the theme picker; off by default). */
	sound: { label: 'Sound effects', on: 'Sound effects: on', off: 'Sound effects: off' },
	/** The header's pause button (motion.svelte.ts): stops every animation on the page to save CPU. */
	motion: {
		label: 'Pause animations',
		off: 'Pause animations (saves CPU)',
		on: 'Animations paused. Tap to play them again',
		pausedToast: 'Animations paused. Tap ▶ at the top to play them again.',
		playingToast: 'Animations playing again.'
	},

	/** The Abscar theme's header extras. */
	operator: {
		label: 'Operator',
		callsign: 'Abscar',
		/** Abscar's squadmates, each shown with his own emblem next to Abscar's */
		mate: 'Phillestar',
		/** sticker by Phillestar's Mastery boxes (the user, 2026-11-13, "just for fun") */
		mateMotto: 'Ranked or nothing',
		/** Robin's callsign (2026-11-13). The no-break space keeps "Lars Åke" together: the tag breaks after "Drängen". */
		lars: 'Drängen Lars Åke',
		/** the fourth squad member (2026-11-13), with his gold sticker and his Black Ops 6 + 7 record */
		/** sticker by Drängen Lars Åke's boxes (the user, 2026-11-13; their first wording used a slur, softened to
		    "randoms"; 2026-11-14 the user asked for "idiots") */
		larsMotto: 'Held back by idiots',
		jeeven: 'Da Jeeven',
		/** the fifth squad member (2026-11-14, the user's friend), the wizard; his sign in the user's words */
		ingman: 'Ingman',
		ingmanMotto: 'Jim and Pro player',
		certified: 'Certified grinder',
		recordTitle: 'BO6 + BO7',
		record: ['Prestige Master', 'Max level', 'All calling cards'],
		/** fun sticker(s) under Abscar's boxes, not ticks (the user, 2026-11-13: "under Abscar, not as checkpoints, just
		 *  at the side a bit for fun"; they first sat as ticked lines in Da Jeeven's record). "Ranked, MP, WZ grinder"
		 *  was removed the same day at the user's ask; don't bring it back. */
		abscarStickers: ['Refuses to play campaign mode'],
		recordOf: (who: string) => `${who}: Black Ops 6 and 7 record`,
		online: 'Online',
		/** for a squad member whose page isn't open (only shown to people in the squad; Squad tab) */
		offline: 'Offline',
		/** for an operator nobody in your squad has picked yet */
		notJoined: 'Not in squad',
		seen: (ago: string) => `Seen ${ago}`,
		/** the three small Mastery camo boxes under each squad member's tag */
		masteryOf: (who: string) => `${who}: Mastery camos`,
		masteryDone: 'done',
		masteryInProgress: 'In progress',
		masteryTodo: 'not started',
		/** sticker next to the squad member who is furthest behind on the Mastery camos */
		slacker: 'Slacker',
		/** The joke stamp over a squad member (squad-bans.ts, 2026-11-16). */
		banned: 'Banned',
		bannedLabel: (name: string, reason: string) => `${name} is banned (a joke): ${reason}`,
		/** label on the frame round the operator tags */
		squad: 'Squad'
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
		/**
		 * big greeting above the terminal text: "Welcome" small, `crew` big under it (split where it may wrap on
		 * phones). It named the squad until 2026-11-13; the user then asked for just "Welcome Grinders".
		 */
		welcome: 'Welcome',
		crew: ['Grinders'],
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
		boot: ['ABSCAR OS v4.20 // CAMO GRIND TERMINAL', 'Operator Abscar authenticated. Squad link: Phillestar, Drängen Lars Åke, Da Jeeven, Ingman.', 'Type “help” for commands. “exit” or Esc closes.'],
		help: [
			'help              this list',
			'status            your camo grind in numbers',
			'next              what to grind next',
			'weapon <name>     one gun, e.g. “weapon m4”',
			'season            how long Season 1 has left',
			'buddy             how grown the weed buddy is',
			'whoami · squad    who’s online',
			'ping <name>       knock on a squad member’s door',
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
		whoami: ['abscar', 'Status: grinding. Holk: lit.'],
		squad: [
			'ABSCAR ............ ONLINE',
			'PHILLESTAR ........ ONLINE (snack: hamburger, favourite reward: the nuke)',
			'DRÄNGEN LARS ÅKE .. ONLINE (drink: a big cold beer, goggles: lime)',
			'DA JEEVEN ......... ONLINE (certified grinder: Prestige Master in BO6 + BO7, holk: lit)',
			'INGMAN ............ ONLINE (class: wizard, pipe: lit, Jim and Pro player)'
		],
		/** `squad` while you're in a squad (2026-11-14): the real list, online first */
		squadLive: (name: string, online: boolean, seen: string, hb: number, total: number) =>
			`${name.toUpperCase().padEnd(18, '.')} ${online ? 'ONLINE ' : 'OFFLINE'}  HB ${hb}/${total}${online ? '' : `  (seen ${seen})`}`,
		pingUsage: 'Usage: ping <name>, e.g. “ping phillestar”. Needs a squad (Squad tab).',
		pingSent: (name: string) => `Knock knock: ${name} sees a banner while their page is open.`,
		pingNotFound: (name: string) => `Nobody called “${name}” in your squad.`,
		pingFailed: 'Couldn’t reach the squad just now.',
		nuke: ['!!! TACTICAL NUKE INBOUND !!!'],
		nukeCount: (n: number) => `  ${n}...`,
		nukeAfter: ['...', 'Just kidding. Your camos survived.', 'Phillestar says hi.'],
		hackDone: ['ACCESS GRANTED.', 'Bad news: you still have to grind Harmonic Break yourself.'],
		holk: ['      ( (', '       ) )', '  =========================*', '*puff puff*'],
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
		power: 'TV on / off',
		/** The breaking-news channel (2026-11-13): a fresh nerf/buff headline interrupts the montage once. */
		breaking: 'Breaking news',
		live: 'Live',
		newsChannel: 'CH 00',
		newsDesk: 'Patch desk',
		newsOpen: (title: string) => `Breaking news: ${title}. Read the article`,
		newsBack: 'Back to the montage',
		/** the ticker under the headline */
		tickerMore: 'More patch news'
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
		/** the Divergence tile counts down (2026-11-12, the user's ask: "32 left" instead of "1 / 33") */
		left: 'left',
		divergenceLeftUnit: (n: number) => `Harmonic Break${n === 1 ? '' : 's'} to go`,
		divergenceDone: (done: number, total: number) => `${done} of ${total} done`,
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
			done: 'Done',
			available: 'Available now'
		},
		statusHelp: {
			started: 'At least one camo or before-Gold challenge done, not maxed yet.',
			near: 'All 3 challenges before Gold are done, so Gold is next.',
			done: 'Gold, Platinum and Harmonic Break all ticked.',
			available: 'Out now with a next camo to earn (leaves out maxed weapons and weapons that aren’t released yet).'
		},
		results: (n: number, total: number) => `${n} of ${total} weapons`,
		clear: 'Clear filters',
		legend: 'G = Gold · P = Platinum · HB = Harmonic Break'
	},

	weapon: {
		column: 'Weapon',
		/** The Prestige camos' row under G / P / HB (and its column heading, 2026-11-15). */
		prestigeColumn: 'Prestige',
		level: (n: number) => `Lv ${n}`,
		battlePass: (tier: number) => `BP tier ${tier}`,
		event: 'S1 event',
		newBadge: 'New',
		newBadgeLong: 'New in Season 1',
		maxed: 'Maxed',
		toggle: (camo: string, weapon: string) => `${camo}: ${weapon}`,
		/** Read out after the weapon's name on the button that opens its card. */
		openHint: 'open its card: challenges before Gold, note, buffs and nerfs',
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
			'Each one opens at a set weapon level. Gold opens when all three are done and the weapon has its 8 level-up camos.',
		preGoldCount: (n: number, total: number) => `${n}/${total} done`,
		preGoldLocked: 'Done: this weapon has Gold. Untick Gold to change these.',
		preGoldUnknown: 'Not out yet. Its challenges are added here when the weapon is released.',
		/** All 3 ladder camos with their challenges, always shown. */
		camos: 'Camo challenges',
		camoDone: 'Done',
		/** The 3 Prestige camos under the ladder (2026-11-15). */
		prestige: 'Prestige camos',
		prestigeHint:
			'Weapon Prestige: Terminus at max level in Weapon Prestige 1, then Scatter and Cascade on the way to Weapon Prestige Master. Tick them in the weapon list, in the row under G / P / HB.',
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
			`Pin up to ${max} weapons and they show up here with the challenge you’re on and quick ticks, so you can update between matches without scrolling.`,
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
		/** The popup's small line above the gun's name. */
		file: 'Meta class',
		modes: { mp: 'Multiplayer', wz: 'Warzone' },
		none: {
			mp: 'No Multiplayer meta class published for this gun yet.',
			wz: 'No Warzone meta class published for this gun yet.'
		},
		/** The gun's own Apex attachment and builds that use it (MetaBuilds). */
		apex: {
			tag: 'Apex',
			heading: (name: string) => `Apex attachment: ${name}`,
			unlock: 'Unlocks at the gun’s max level, in its own slot next to the five attachments.',
			blocks: (slots: string) => `Closes: ${slots}.`,
			build: (mode: string) => `${mode} Apex build`,
			none: 'No meta site has published a build with this Apex yet.'
		},
		/** The meta class card (loadouts.ts) and the published subclasses (siteBuilds.ts) per mode. */
		metaTitle: 'Meta class',
		/** Multiplayer Hardcore builds next to the meta class (data/hardcoreBuilds.ts, 2026-11-15). */
		hardcore: {
			title: 'Hardcore',
			notRecommended: 'Not recommended for Hardcore: codmunity has no Hardcore build for this gun.',
			noSource: 'codmunity.gg weapon page · 14 Nov 2026'
		},
		ourPick: 'Our pick',
		rank: (n: number) => `#${n}`,
		pro: 'Pro favorite',
		/** Stat builds under the subclasses (data/extraBuilds.ts). */
		extra: {
			heading: 'Stat builds',
			sub: 'Worked out from the attachment stats. Same in Multiplayer and Warzone. No loadout code exists for these: the button copies the attachments as text.',
			kinds: { ads: 'Min ADS speed', sprint: 'Max sprint speed', range: 'Max range', velocity: 'Max bullet velocity' }
		},
		code: 'Build code',
		copy: 'Copy',
		copied: 'Copied',
		copyLabel: (code: string) => `Copy build code ${code}`,
		copyFailed: 'Couldn’t copy by itself: the code is selected, copy it by hand.',
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

	/** Loadout codes: the META copy button in every weapon row (WeaponCode), the copy buttons on the
	    builds in the weapon card (MetaBuilds) and the "Show codes" switch (codeView). */
	codes: {
		/** The small sign on the row button. */
		tag: 'Meta',
		copied: 'Copied',
		copyLabel: (weapon: string, apex?: string) =>
			`Copy the meta loadout code for ${weapon}${apex ? ` (with the Apex ${apex}: all its Multiplayer builds use it)` : ''}`,
		toastCopied: (weapon: string, code: string, apex?: string) =>
			`Meta code for ${weapon} copied (${code}).${apex ? ` It has the Apex ${apex}: swap it out in the gunsmith if you don’t have it yet.` : ' Paste it in the gunsmith.'}`,
		toastFailed: (code: string) => `Couldn’t copy by itself. The code is ${code}: copy it by hand.`,
		/** The switch above the weapon list and in the weapon card's Meta tab. */
		show: 'Show codes',
		/** Copy button on a build in the weapon card. */
		copyBuild: (build: string) => `Copy the loadout code: ${build}`,
		copyShort: 'Copy code',
		/** Builds no site published a code for: the button copies the parts as text (BuildCopy). */
		copyText: (build: string) => `Copy the attachments as text: ${build} (no loadout code exists for it)`,
		copyTextShort: 'No loadout code exists for this build: copy its attachments as text',
		textTag: 'Text',
		textCopied: 'Attachments copied as text',
		copyFailedShort: 'Couldn’t copy here.'
	},

	cls: {
		number: (n: number) => String(n).padStart(2, '0'),
		maxed: 'Class maxed',
		allHidden: 'Every weapon in this class is maxed ◆',
		challenges: 'Challenges'
	},

	/** The page tabs under the header: the tracker itself, the Cosmetics list and Extra camos (2026-11-12). */
	pageTabs: {
		label: 'Pages',
		grind: 'Camo grind',
		/** soft hyphens: with six tabs a phone breaks it as "Cosmet-/ics", not anywhere */
		cosmetics: 'Cos­met­ics',
		extras: 'Extra camos',
		squad: 'Squad',
		/** BurgiShop's own tab (2026-11-16, the user: "BurgiShop can have a tab of its own instead of being among
		    the casino games"); a soft hyphen like BurgiCasino's */
		shop: 'Burgi­Shop',
		/** a soft hyphen so it can break on a phone ("Burgi-/Casino") */
		casino: 'Burgi­Casino'
	},
	/** 4:20 (four20.ts; 2026-11-16, the 420 pack): every day 16:20–17:20, the page goes green. */
	four20: {
		banner: 'IT’S 4:20 🍃',
		sub: (left: number) => `The page is green, the buddy lights up, and everyone online gets today’s daily bonus once more. ${left} min left.`,
		bonus: (n: number) => `4:20 bonus: +${n.toLocaleString('en-US')} 🍔 🍃`,
		close: 'Close'
	},
	/** BurgiBank loans (loans.ts; 2026-11-16). */
	loans: {
		heading: 'Loans',
		intro: (rate: number, days: number) =>
			`Borrow burgers from the bank (not from Abscar). Pay back within ${days} days with ${rate}% interest; the interest goes to Abscar. If you don’t, the bank takes it back by itself on the due date.`,
		take: (n: number) => `Borrow ${n.toLocaleString('en-US')}`,
		open: (owed: number, due: string, left: string) => `You owe ${owed.toLocaleString('en-US')} 🍔 (loan + interest), due ${due} · ${left}`,
		left: (days: number, hours: number) => (days >= 1 ? `${days} day${days === 1 ? '' : 's'} left` : `${hours} h left`),
		repay: (n: number) => `Pay back ${n.toLocaleString('en-US')} 🍔`,
		repaid: 'Loan paid back. Thanks for banking with BurgiBank 🏦',
		taken: (n: number, owed: number) => `+${n.toLocaleString('en-US')} 🍔 borrowed. Pay back ${owed.toLocaleString('en-US')} within a week.`,
		cantRepay: (owed: number) => `You need ${owed.toLocaleString('en-US')} 🍔 to pay back.`,
		oneAtATime: 'Pay back your loan before you borrow again.',
		history: (paid: number, collected: number) => `${paid} paid back · ${collected} collected by the bank`,
		owesTag: (n: number) => `owes ${n.toLocaleString('en-US')} 🍔`,
		takenEvent: (n: number) => `borrowed ${n.toLocaleString('en-US')} 🍔 from BurgiBank 🏦`,
		paidEvent: (n: number) => `paid back ${n.toLocaleString('en-US')} 🍔 to BurgiBank 🏦`
	},
	/** Abscar's casino admin menu (2026-11-16). */
	admin: {
		heading: 'Admin menu',
		intro: 'Only you see this. Give or take burgers for anyone in the squad; they come from nowhere and go nowhere (not your account). It goes on the radio.',
		amount: 'Burgers',
		give: 'Give',
		take: 'Take',
		everyone: 'Everyone',
		given: (name: string, n: number) => `Gave ${name} ${n.toLocaleString('en-US')} 🍔`,
		taken: (name: string, n: number) => `Took ${n.toLocaleString('en-US')} 🍔 from ${name}`,
		failed: 'Couldn’t reach the squad. Try again in a moment.',
		balanceOf: (n: number) => `${n.toLocaleString('en-US')} 🍔`,
		adjusted: (n: number) => `admin ${n > 0 ? '+' : '−'}${Math.abs(n).toLocaleString('en-US')}`,
		gaveEvent: (name: string, n: number) => `gave ${name} ${n.toLocaleString('en-US')} 🍔 (admin) 🎁`,
		tookEvent: (name: string, n: number) => `took ${n.toLocaleString('en-US')} 🍔 from ${name} (admin) 🔨`
	},
	/** Pranks (shop.ts PRANKS; the 420 pack). */
	pranks: {
		heading: 'Pranks',
		intro: 'Bought once per throw. Pick who gets it.',
		names: { 'smoke-bomb': 'Smoke Bomb', 'too-high': 'TOO HIGH TO PLAY' },
		what: { 'smoke-bomb': 'Their operator disappears in thick smoke for an hour.', 'too-high': 'A big green TOO HIGH TO PLAY stamp on their operator for a day.' },
		pick: 'Who gets it?',
		throw: (price: number) => `Throw · ${price.toLocaleString('en-US')} 🍔`,
		thrown: (name: string) => `Got ${name} 😈`,
		nobody: 'Nobody else in the squad yet.',
		stamp: 'Too high to play',
		smokedBy: (name: string) => `Smoke-bombed by ${name}`,
		highBy: (name: string) => `Stamped TOO HIGH TO PLAY by ${name}`,
		smokeEvent: (name: string) => `threw a SMOKE BOMB at ${name} 💨`,
		highEvent: (name: string) => `stamped ${name} TOO HIGH TO PLAY 🍃`
	},
	/** BurgiShop (2026-11-16): cosmetics bought with burgers and worn on your header operator (shop.ts). */
	shop: {
		heading: 'BurgiShop',
		/** the shop's own page tab: the line under the heading, and what it says outside a squad */
		sub: 'Cosmetics and pranks for your operator',
		notIn: 'BurgiShop sells with the squad’s burger bank. Join or create a squad in the Squad tab first.',
		intro:'Buy cosmetics with your burgers and wear them on your operator at the top of the page: the whole squad sees them. What you buy is yours to keep; tap an item you own to wear it or take it off.',
		noOp: 'You haven’t picked an operator from the header (Squad tab → Edit), so your look only shows here and on your squad card.',
		preview: 'Your operator',
		tryOn: 'Trying on',
		slots: { aura: 'Auras', effect: 'Effects', badge: 'Pins', mouth: 'Mouth', eyes: 'Eyes', hat: 'Hats', smoke: 'Smoke', pet: 'Sidekicks', name: 'Name styles', title: 'Titles', pranks: '😈 Pranks' },
		slotsLabel: 'Kind',
		/** on the 420 pack 2's kinds (eyes, hats, smoke, sidekicks) */
		newTag: 'NEW',
		/** a line under the kind buttons, for the kinds that need one */
		slotHint: {
			mouth: 'Swaps out whatever your operator has in their mouth.',
			eyes: 'Sits on your operator’s eyes, over masks, goggles and glasses.',
			hat: 'Sits on your operator’s head (Ingman takes his wizard hat off for it).',
			smoke: 'Colours the smoke from whatever’s in your mouth. Nothing in it? You blow a puff out yourself.',
			pet: 'A little sidekick that sits on your operator’s shoulder.'
		} as Partial<Record<string, string>>,
		rarity: { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' },
		buy: (price: number) => `Buy · ${price.toLocaleString('en-US')} 🍔`,
		wear: 'Wear',
		wearing: 'Wearing',
		takeOff: 'Take off',
		owned: 'Owned',
		bought: (name: string) => `${name} bought and on your operator 🛍️`,
		broke: (price: number, have: number) => `${price.toLocaleString('en-US')} 🍔 needed, you have ${have.toLocaleString('en-US')}.`,
		wornNow: (name: string) => `Wearing ${name}`,
		takenOff: (name: string) => `${name} taken off`,
		spent: (n: number) => `${n.toLocaleString('en-US')} 🍔 spent in BurgiShop`,
		toHouse: 'Burgers spent here go to the house (Abscar), like casino losses.',
		itemLabel: (name: string, kind: string, rarity: string, state: string) => `${name}, ${kind}, ${rarity}: ${state}`,
		event: (name: string, rarity: string) => `bought ${name} (${rarity}) in BurgiShop 🛍️`
	},
	/** BurgiCasino (2026-11-16): the daily burger bonus, Abscar's Fortune (the Burger Bandit slot), roulette, blackjack. */
	casino: {
		heading: 'BurgiCasino',
		sub: 'Abscar’s Fortune · Roulette · Blackjack · BurgiBank',
		note: 'Pretend burgers from the squad’s burger bank: no real money, nothing to buy, nothing to cash out.',
		balance: 'Your burgers',
		notIn: 'BurgiCasino plays with the squad’s burger bank. Join or create a squad in the Squad tab first.',
		toSquad: 'Go to the Squad tab',
		games: { slots: 'Abscar’s Fortune', slotsSub: 'Burger Bandit', roulette: 'Roulette', blackjack: 'Blackjack', bank: 'BurgiBank' },
		gamesLabel: 'Game',
		/** The BurgiBank tab (2026-11-16): loans, the house and Abscar's admin menu under a big bank. */
		bank: {
			line: 'Borrow burgers here, see what the house has taken, and (for Abscar) hand out or take back burgers.',
			balance: (n: number) => `Your burgers: ${n.toLocaleString('en-US')} 🍔`
		},
		how: 'How it works',
		burgers: (n: number) => `${n.toLocaleString('en-US')} 🍔`,
		broke: 'Not enough burgers for that bet. Come back tomorrow for your daily bonus, or tick some camos.',
		bonus: {
			heading: 'Daily bonus',
			line: (n: number, rate: number, toNext: number, nextRate: number) =>
				`Day ${n} online: ${rate} 🍔 a day. ${toNext === 1 ? 'Tomorrow' : `In ${toNext} days`} it goes up to ${nextRate} 🍔.`,
			none: 'Open the page on a day with the squad and you get 25 🍔. Every 5 days online it goes up by 25.',
			toast: (n: number, day: number) => `Daily bonus: +${n} 🍔 (day ${day} online)`,
			seeded: (days: number) => `Welcome bonus: ${days} day${days === 1 ? '' : 's'} online already counted 🍔`,
			total: (n: number) => `${n.toLocaleString('en-US')} 🍔 from daily bonuses so far`
		},
		/** The house (2026-11-16, the user: "make all losses go to Abscar's burger account"). */
		house: {
			heading: 'The house',
			line: (name: string, n: number) =>
				`${name} is the house: every burger anyone else loses here or on bets, spends in BurgiShop or pays as loan interest goes to ${name}’s account. ${n.toLocaleString('en-US')} 🍔 so far.`,
			mine: (n: number) => `You’re the house: every burger the others lose here or on bets, spend in BurgiShop or pay as loan interest goes to your account. ${n.toLocaleString('en-US')} 🍔 so far.`,
			none: 'Abscar is the house: once Abscar is in the squad, every burger the others lose here or on bets, or spend in BurgiShop, goes to Abscar’s account.'
		},
		board: {
			heading: 'Casino leaderboard',
			none: 'Nobody has played yet.',
			row: (net: string, games: number) => `${net} 🍔 · ${games} game${games === 1 ? '' : 's'}`
		},
		event: {
			slots: (net: number, tier: string) => `${tier === 'jackpot' ? 'hit the BURGER JACKPOT' : tier === 'mega' ? 'hit a MEGA WIN' : tier === 'big' ? 'hit a BIG WIN' : 'won'} on Abscar’s Fortune: +${net.toLocaleString('en-US')} 🍔 🎰`,
			roulette: (net: number, n: number, color: string) => `${net > 0 ? `won ${net.toLocaleString('en-US')}` : `lost ${(-net).toLocaleString('en-US')}`} 🍔 on roulette (${n} ${color}) 🎡`,
			blackjack: (net: number, bj: boolean) => (bj ? `hit BLACKJACK: +${net.toLocaleString('en-US')} 🍔 🃏` : `${net > 0 ? `won ${net.toLocaleString('en-US')}` : `lost ${(-net).toLocaleString('en-US')}`} 🍔 at blackjack 🃏`),
			bjSide: (bet: string, kind: string, net: number) => `hit a ${kind.toUpperCase()} on ${bet} at blackjack: +${net.toLocaleString('en-US')} 🍔 🃏`
		},
		bet: 'Bet',
		betLabel: (n: number) => `Bet ${n} burgers`,
		slots: {
			spin: 'Spin',
			credits: 'Burgers',
			auto: (n: number) => `Auto · ${n}`,
			autoStop: (n: number) => `Stop · ${n} left`,
			autoCount: (n: number) => `${n} auto spins`,
			autoLabel: 'Auto spin',
			autoDone: 'Auto spins done.',
			pull: 'Pull the lever',
			spinning: 'Spinning…',
			lines: '10 lines',
			free: (left: number, total: number) => `FREE SPIN ${total - left + 1} / ${total} · sticky WILDs`,
			freeWon: (n: number) => `${n} FREE SPINS!`,
			/** free spins (2026-11-16, the user's "add free spins and bonus"): the marquee turns into the counter */
			freeTitle: (n: number, total: number) => `Free spin ${n} / ${total}`,
			freeSub: (won: number) => `Sticky WILDs · ${won.toLocaleString('en-US')} 🍔 so far`,
			freeIntro: (n: number) => `${n} FREE SPINS`,
			freeIntroSub: 'WILDs stick until the free spins end, and weeds land on every reel',
			/** sticky WILDs + weed multipliers (2026-11-16, the user: "sticky wilds in the free spins, and special weed symbols that give ×2, ×5, ×10 and so on") */
			sticky: (n: number) => (n === 1 ? 'A WILD sticks!' : `${n} WILDs stick!`),
			stickyTag: 'STICKY',
			weedWin: (x: number, raw: number, win: number) => `Weeds ×${x}: ${raw.toLocaleString('en-US')} → ${win.toLocaleString('en-US')} 🍔`,
			weedLabel: (x: number) => `weed ×${x}`,
			weedRow: 'Every weed on a winning screen adds up and multiplies its win (lines + ketchup), ×2 up to ×100. In normal spins only on reel 3, in free spins on every reel.',
			maxWin: (x: number) => `MAX WIN: ${x.toLocaleString('en-US')}× your bet`,
			maxNote: (x: number) => `One play (a spin with everything it starts, or a bought bonus) pays at most ${x.toLocaleString('en-US')}× your bet.`,
			freeMore: (n: number) => `+${n} FREE SPINS!`,
			freeOutro: 'FREE SPINS WON',
			freeOutroSub: (n: number) => `${n} free spins played`,
			continue: 'Continue',
			/** the Burger Box (pick game) */
			box: 'Burger Box',
			boxHit: 'BURGER BOX!',
			boxHelp: 'Open boxes: burgers in each one until a box says COLLECT. The first three never do.',
			boxSoFar: (n: number) => `${n.toLocaleString('en-US')} 🍔 so far`,
			boxClosed: (i: number) => `Box ${i}, closed: open it`,
			boxOpen: (i: number, what: string) => `Box ${i}: ${what}`,
			boxPrize: (n: number) => `+${n.toLocaleString('en-US')}`,
			collect: 'COLLECT',
			boxWon: 'BURGER BOX WON',
			boxEvent: (n: number) => `Burger Box: +${n.toLocaleString('en-US')} 🍔`,
			/** the bonus wheel */
			wheel: 'Bonus wheel',
			wheelHit: 'BONUS WHEEL!',
			wheelHelp: 'Prizes in burgers at your bet. Every slice is as likely as any other.',
			wheelSpin: 'Spin the wheel',
			wheelSpinning: 'Spinning…',
			freeSlice: (n: number) => `${n} FREE`,
			jackpot: 'JACKPOT',
			wheelWin: (n: number) => `+${n.toLocaleString('en-US')} 🍔`,
			wheelSpins: (n: number) => `${n} FREE SPINS!`,
			wheelJackpot: (n: number) => `JACKPOT! +${n.toLocaleString('en-US')} 🍔`,
			wheelLabel: (slices: string) => `Bonus wheel with 12 slices: ${slices}`,
			wheelEvent: (what: string) => `Bonus wheel: ${what}`,
			/** buy bonus */
			buy: 'Buy bonus',
			buyKinds: { free: 'Free spins', box: 'Burger Box', wheel: 'Bonus wheel' },
			buyPrice: (n: number) => `${n.toLocaleString('en-US')} 🍔`,
			buyAsk: (what: string, price: number) => `Buy ${what} for ${price.toLocaleString('en-US')} 🍔?`,
			buyWhat: { free: (n: number) => `${n} free spins`, box: 'the Burger Box', wheel: 'a spin of the bonus wheel' },
			buyYes: 'Buy',
			buyNo: 'Cancel',
			buyNote: (free: number, box: number, wheel: number) => `Prices are times your bet: free spins ${free}×, Burger Box ${box}×, wheel ${wheel}×. They give back about the same share as spinning.`,
			lastWin: 'Win',
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', jackpot: 'BURGER JACKPOT' },
			lineWin: (line: number, count: number, symbol: string, win: number) => `Line ${line}: ${count} × ${symbol} = ${win} 🍔`,
			scatterWin: (count: number, win: number, spins: number) => `${count} × Ketchup = ${win} 🍔 + ${spins} free spins`,
			noWin: 'No win this time.',
			paytable: 'Paytable & how it works',
			how: 'Like a real video slot: 5 reels, 3 rows and 10 paylines. Each reel is a weighted strip, so pickles are common and burgers rare; every stop is equally likely (no near-miss tricks). Wins pay left to right from the first reel, 3, 4 or 5 in a row (burgers and WILD already from 2), times your bet ÷ 10, the best win per line. WILD stands in for every paying symbol and pays the most itself. Ketchup pays anywhere on the screen and 3 or more give free spins (they can come again): every WILD that lands in them sticks where it is until they end (WILDs only land on reels 2, 3 and 4 there), and weeds land on every reel. A weed carries a multiplier from ×2 up to ×100; when a spin wins, all the weeds on the screen add up and multiply its win. In normal spins weeds land only on reel 3. A BONUS box on each of reels 1, 3 and 5 opens the Burger Box: open boxes for burgers until one says COLLECT. A wheel on each of reels 2, 3 and 4 spins the bonus wheel: burgers, free spins or the jackpot. Both can come in free spins too. Or buy free spins, the Burger Box or a wheel spin straight away. Everything is decided the moment you pay; which box you tap only changes the order. In the long run the machine gives back about 97% of what goes in (real ones keep a bit more), so the house still wins in the end, just slowly.',
			symbols: {
				pickle: 'Pickle',
				onion: 'Onion ring',
				tomato: 'Tomato',
				cheese: 'Cheese',
				fries: 'Fries',
				shake: 'Shake',
				hotdog: 'Hot dog',
				burger: 'Burger',
				wild: 'WILD',
				weed: 'Weed',
				scatter: 'Ketchup',
				box: 'BONUS box',
				wheel: 'Bonus wheel'
			},
			boxRow: 'One on each of reels 1, 3 and 5 → the Burger Box',
			wheelRow: 'One on each of reels 2, 3 and 4 → the bonus wheel',
			payRow: (a: number, b: number, c: number, two?: number) => `${two ? `2 → ${two} · ` : ''}3 → ${a} · 4 → ${b} · 5 → ${c}`,
			scatterRow: (a: number, b: number, c: number, fa: number, fb: number, fc: number) => `3 → ${a}× bet + ${fa} free · 4 → ${b}× + ${fb} · 5 → ${c}× + ${fc}`,
			payNote: 'Line wins are times the line bet (your bet ÷ 10).',
			reelLabel: (r: number, symbols: string) => `Reel ${r}: ${symbols}`
		},
		roulette: {
			spin: 'Spin',
			clear: 'Clear',
			chip: 'Chip',
			onTable: (n: number) => `${n.toLocaleString('en-US')} 🍔 on the table`,
			result: (n: number, color: string) => `${n} ${color}`,
			colors: { red: 'red', black: 'black', green: 'green' },
			won: (n: number) => `You win ${n.toLocaleString('en-US')} 🍔`,
			lost: (n: number) => `You lose ${n.toLocaleString('en-US')} 🍔`,
			even: 'Even money: nothing won, nothing lost',
			history: 'Last numbers',
			spots: { low: '1–18', high: '19–36', even: 'Even', odd: 'Odd', red: 'Red', black: 'Black', d1: '1st 12', d2: '2nd 12', d3: '3rd 12', c1: '2:1', c2: '2:1', c3: '2:1' },
			spotLabel: (spot: string, stake: number) => `Bet on ${spot}${stake ? `, ${stake} on it` : ''}`,
			colLabel: (c: number) => `column ${c}`,
			how: 'European roulette: one zero, 37 pockets. Tap spots to put your chip on them, as many as you like, then spin. A number pays 35 to 1, a dozen or a column 2 to 1, red/black, odd/even, 1–18/19–36 pay 1 to 1. The zero loses every outside bet.',
			wheel: 'Roulette wheel'
		},
		blackjack: {
			deal: 'Deal',
			hit: 'Hit',
			stand: 'Stand',
			double: 'Double',
			dealer: 'Dealer',
			you: 'You',
			total: (n: number, soft: boolean) => `${soft ? 'soft ' : ''}${n}`,
			results: { blackjack: 'BLACKJACK!', win: 'You win', dealerBust: 'Dealer busts, you win', push: 'Push', lose: 'Dealer wins', bust: 'Bust' },
			net: (n: number) => (n > 0 ? `+${n.toLocaleString('en-US')} 🍔` : n < 0 ? `−${(-n).toLocaleString('en-US')} 🍔` : '±0 🍔'),
			shuffle: 'New shoe shuffled',
			handLabel: (who: string, cards: string, total: string) => `${who}: ${cards} (${total})`,
			hidden: 'face-down card',
			/** boosts + side bets (2026-11-16) */
			streak: (n: number) => `🔥 ${n} in a row`,
			streakNone: 'Win 3 in a row for a streak boost',
			streakNext: (m: string) => `next win ${m}`,
			boost: (kind: string, m: string) => `${kind}: ${m} if you win`,
			boostApplied: (m: string, extra: number) => `Boost ${m}: +${extra.toLocaleString('en-US')} 🍔`,
			kinds: {
				pair: 'Pair',
				colourPair: 'Colour pair',
				perfectPair: 'Perfect pair',
				flush: 'Flush',
				straight: 'Straight',
				trips: 'Three of a kind',
				straightFlush: 'Straight flush',
				suitedTrips: 'Suited trips'
			},
			sides: { pairs: 'Perfect Pairs', plus3: '21+3' },
			sidesLabel: 'Side bets',
			sideWin: (name: string, kind: string, n: number) => `${name}: ${kind}! +${n.toLocaleString('en-US')} 🍔`,
			sideLose: (name: string, n: number) => `${name}: no luck −${n.toLocaleString('en-US')} 🍔`,
			boostsHow: 'Free boosts on a won hand (no extra bet): a pair in your first two cards ×1.1, a colour pair ×1.2, a perfect pair (same suit) ×1.5; with the dealer’s up card a straight ×1.2, three of a kind ×1.5, a straight flush ×2, suited trips ×4 (the best one counts). Wins in a row add more: the 3rd ×1.05, the 4th ×1.1, the 5th and on ×1.2. A push keeps the streak, a loss ends it.',
			sidesHow: 'Side bets, like a real table: each costs a chip the size of your bet and is settled on the deal. Perfect Pairs (your first two cards): pair 6×, colour pair 12×, perfect pair 25×. 21+3 (your two cards and the dealer’s up card): flush 5×, straight 10×, three of a kind 30×, straight flush 40×, suited trips 100×. The house keeps a few percent of side bets in the long run.',
			sideOn: (name: string) => `${name} side bet`,
			how: 'Six decks, shuffled for every hand. Get closer to 21 than the dealer without going over. Picture cards count 10, an ace 1 or 11. Blackjack (an ace and a 10 as your first two cards) pays 3 to 2. The dealer draws to 17 and stands on a soft 17. Double: one more card and your bet doubled. It’s one table for the whole squad: everyone who opens Blackjack sits down (5 seats) and sees the others’ cards. Everyone plays their own hand against the same dealer at the same time. With friends at the table, bets stay open for 10 seconds after the first one (or until everyone’s in, or someone presses Deal now). You have 20 seconds per move, then your hand stands by itself.',
			/** The shared table (2026-11-16, the user: "see when others play at the blackjack table, and several can play at once"). */
			atTable: (n: number) => `${n} at the table`,
			seatsLabel: 'Players at the table',
			alone: 'You’re alone at the table. Friends who open Blackjack sit down here and play the same hands against the dealer.',
			otherDevice: 'You’re at the table on another device, so you’re watching here.',
			full: 'All 5 seats are taken, so you’re watching.',
			trouble: 'Can’t reach the table right now. Trying again…',
			openHand: 'Open a hand',
			join: 'Join',
			dealNow: 'Deal now',
			betsClose: (s: number) => `Bets close in ${s} s`,
			betsCloseJoin: (who: string, s: number) => `${who} opened a hand: join within ${s} s`,
			waitingOthers: 'Waiting for the others…',
			inProgress: 'A hand is being played. Bet on the next one.',
			pause: 'Next hand in a moment…',
			dealerTurn: 'Dealer’s turn…',
			yourMove: (s: number) => `Your move · ${s} s`,
			lastHand: (result: string, net: string) => `Your last hand: ${result} ${net}`,
			betChip: (n: number) => `Bet ${n.toLocaleString('en-US')} burgers`,
			failed: 'That didn’t go through: the table moved on or the connection dropped. Try again.',
			seatStatus: {
				waiting: 'Sitting out',
				betting: 'Bet in',
				playing: (s: number) => `Thinking… ${s} s`,
				late: 'Time’s up',
				stood: 'Stands',
				bust: 'Bust',
				blackjack: 'Blackjack!',
				twentyOne: '21',
				doubled: 'Doubled',
				timeout: 'Too slow: stands',
				away: 'Left the table'
			},
			othersResult: { blackjack: 'Blackjack!', win: 'Wins', dealerBust: 'Wins', push: 'Push', lose: 'Loses', bust: 'Bust' },
			satEvent: 'sat down at the blackjack table: pull up a chair 🃏'
		}
	},
	/** The Squad tab (SquadSection; squad.svelte.ts): friends' grind side by side, Online / Offline (2026-11-14). */
	squad: {
		heading: 'Squad',
		sub: (n: number) => (n === 1 ? '1 member' : `${n} members`),
		subOff: 'See each other’s grind',
		intro:
			'See your friends’ camo grind next to yours: Gold, Platinum, Harmonic Break, Divergence and Mastery, and who has the page open right now. No accounts or passwords: a private squad link connects you.',
		steps: [
			'Create a squad and send the squad link to your friends.',
			'They open it once and pick their name.',
			'From then on everyone’s ticks show up here by themselves.'
		],
		create: 'Create a squad',
		haveLink: 'I have a squad link…',
		invite: 'Squad link',
		refresh: 'Refresh',
		edit: 'Change name',
		leave: 'Leave squad',
		status: {
			off: '',
			loading: 'Loading the squad…',
			ok: '',
			offline: 'Offline: the squad updates when you’re back online',
			error: 'Couldn’t reach the squad, trying again soon',
			full: 'The squad is full (20 members), so you couldn’t be added'
		},
		updatedAt: (time: string) => `Updated ${time}`,
		you: 'You',
		asOp: (op: string) => `Operator: ${op}`,
		online: 'Online',
		seen: (ago: string) => `Seen ${ago}`,
		ago: (a: { unit: 'now' } | { unit: 'min' | 'h' | 'd'; n: number }) =>
			a.unit === 'now' ? 'just now' : a.unit === 'min' ? `${a.n} min ago` : a.unit === 'h' ? `${a.n} h ago` : a.n === 1 ? '1 day ago' : `${a.n} days ago`,
		lastCamo: (ago: string) => `Last camo ${ago}`,
		noCamo: 'No camo ticked yet',
		rank: (n: number) => `#${n}`,
		ladderOf: (camo: string, n: number, total: number) => `${camo}: ${n} of ${total} weapons`,
		/** The Prestige camos' row on a member's card (2026-11-15). */
		prestigeOf: 'Prestige camos',
		prestigeHeader: (n: number) => `Pyroclast Cascade (all three Prestige camos) on ${n} weapon${n === 1 ? '' : 's'}`,
		divergenceLeft: (n: number) => `${n} Harmonic Break${n === 1 ? '' : 's'} to Divergence`,
		divergenceDone: 'Divergence unlocked',
		masteryLabel: 'Mastery camos',
		masteryDone: (n: number, total: number) => `Mastery camos: ${n} of ${total} done`,
		modes: { mp: 'MP', wz: 'WZ', dmz: 'DMZ' },
		modeNames: { mp: 'Multiplayer', wz: 'Warzone', dmz: 'DMZ' },
		masteryStatus: { locked: 'locked', active: 'in progress', complete: 'done' },
		masteryOf: (mode: string) => `${mode} Mastery camos`,
		remove: 'Remove',
		compareHeading: 'Weapon by weapon',
		compareHint: 'G = Gold, P = Platinum, HB = Harmonic Break, – = nothing yet',
		compareWeapon: 'Weapon',
		levelShort: ['–', 'G', 'P', 'HB'],
		levelLong: ['Nothing yet', 'Gold', 'Platinum', 'Harmonic Break'],
		// the name + operator form (create, join, change name)
		createTitle: 'Create a squad',
		createGo: 'Create',
		joinTitle: 'Join the squad',
		joinWho: (names: string) => `In the squad: ${names}.`,
		joinEmpty: 'Nobody is in it yet.',
		joinSwitch: 'You’ll leave the squad you’re in now.',
		joinGo: 'Join',
		editTitle: 'Change your name or operator',
		editGo: 'Save',
		cancel: 'Cancel',
		nameLabel: 'Your name',
		nameHint: 'Shown to the squad. Same person on another device? Type the same name.',
		nameMissing: 'Type a name, or pick your operator below.',
		opLegend: 'Which operator in the header are you?',
		opHint: 'Your Mastery boxes and Online light at the top of the page then follow your ticks.',
		opNone: 'None of them',
		opTaken: (name: string) => `${name} has it`,
		// the squad link
		linkTitle: 'Your squad link',
		linkBody:
			'Send this link to your friends. Opening it once lets them join. Anyone with the link can see the squad and join it, so share it only with them.',
		pasteTitle: 'Use a squad link',
		pasteBody: 'Paste the squad link a friend sent you.',
		pasteLabel: 'Squad link',
		pasteUse: 'Next',
		pasteBad: 'That doesn’t look like a squad link.',
		// leaving and removing
		leaveTitle: 'Leave the squad?',
		leaveBody: 'You’re taken out of the squad. Your ticks stay here, and you can join again with the squad link.',
		leaveGo: 'Leave',
		removeTitle: (name: string) => `Remove ${name} from the squad?`,
		removeBody: 'For an old device or a test entry. If their page is still open, they come back by themselves.',
		removeGo: 'Remove',
		toast: {
			created: 'Squad created. Send the squad link to your friends.',
			joined: 'You’re in the squad.',
			saved: 'Saved.',
			left: 'You left the squad. Your ticks stay here.',
			removed: (name: string) => `${name} was taken out of the squad.`,
			already: 'You’re already in this squad.',
			notFound: 'That squad link isn’t active, so nothing changed.',
			notSquad: 'That isn’t a squad link, so nothing changed.',
			offline: 'You’re offline. Open the squad link again when you’re online.',
			error: 'Couldn’t reach the squad just now. Try again in a moment.',
			full: 'That squad is full (20 members).'
		},
		// step 2 (2026-11-14): kill feed, flash, buddy, radio, ready up, ping, race, MVP, streaks, duels, faces
		nuke: (name: string) => `${name} dropped a nuke`,
		cheer: (name: string) => `LET’S GOOO, ${name}! Weapon maxed!`,
		radio: {
			heading: 'Squad radio',
			note: 'Text only, the last 100 messages. Anyone with the squad link can read and write here.',
			empty: 'Radio silence. Say something.',
			label: 'Message to the squad',
			placeholder: 'Say something…',
			send: 'Send',
			quick: ['Who’s on tonight?', 'GG', 'Slacker!'],
			quickLabel: 'Quick messages',
			fire: 'Give it a 🔥',
			fireCount: (n: number, names: string) => `${n} 🔥 from ${names}`,
			unread: (n: number) => `${n} new`,
			readyEvent: 'is ready to play',
			maxedEvent: (weapon: string) => `maxed the ${weapon} ◆`,
			nukeEvent: 'dropped a nuke: Divergence unlocked!',
			masteryEvent: (camo: string) => `finished ${camo}`,
			masteryMark: (camo: string, pct: number, n: number, target: number) =>
				`is ${pct}% through ${camo} (${n.toLocaleString('en-US')}/${target.toLocaleString('en-US')})`,
			sendFailed: 'Couldn’t send that just now. Try again.'
		},
		ready: {
			button: 'Ready up',
			on: 'Ready ✔',
			onHint: 'The squad sees a banner while your page is open. Tap again to stand down.',
			banner: (names: string) => `${names} want${names.includes(' & ') ? '' : 's'} to play now`,
			join: 'I’m in',
			close: 'Close'
		},
		ping: {
			banner: (name: string) => `${name} is knocking: get on!`
		},
		race: {
			heading: 'Race to Divergence',
			finish: 'Divergence',
			lane: (name: string, n: number, total: number) => `${name}: ${n} of ${total} Harmonic Breaks`
		},
		mvp: 'MVP of the week',
		week: (n: number) => `${n} camo${n === 1 ? '' : 's'} this week`,
		streak: (n: number) => `${n} day${n === 1 ? '' : 's'} in a row`,
		duel: {
			heading: 'Duels',
			start: 'New duel',
			title: 'Start a duel',
			against: 'Against',
			weapon: 'Weapon',
			goal: 'First to',
			stake: 'Sticker for the loser',
			stakeDefault: 'Buys the burgers',
			go: 'Start duel',
			on: (camo: string, weapon: string) => `First to ${camo} on the ${weapon}`,
			vs: 'vs',
			live: 'On',
			won: (name: string) => `${name} won`,
			draw: 'Draw: both got it',
			remove: 'Remove',
			none: 'No duels yet. Challenge someone: first to a camo on a weapon.',
			noOther: 'Someone else has to be in the squad first.',
			full: 'There are 8 duels already. Remove a finished one first.',
			taken: 'One of you already has it',
			event: (name: string, camo: string, weapon: string) => `challenged ${name}: first to ${camo} on the ${weapon}`,
			loserSticker: (stake: string) => stake
		},
		// step 3 (2026-11-14): played today, squad up, roulette, burger bank, Squad TV, Wrapped
		minutes: (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`),
		minutesShort: (min: number) => (min < 60 ? `${min}m` : `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') : ''}`),
		played: {
			today: (time: string) => `Played today: ${time}`,
			hint: 'Time with the tracker open (visible, or in the background for up to 30 min), not time in the game',
			header: (time: string) => `Today ${time}`
		},
		/** K/D, W/L … typed in by each member (SquadCombat; squad-combat.ts), 2026-11-14. */
		combat: {
			heading: 'Combat record',
			note: 'Everyone types in their own lifetime numbers from the game’s Combat Record: Activision doesn’t share them with other sites, so nothing can fetch them by itself. The arrow shows the change since the update before.',
			modes: { mp: 'Multiplayer', wz: 'Warzone' },
			modeLabel: 'Mode',
			sortLabel: 'Sort by',
			sorts: { kd: 'K/D', wl: 'W/L', kills: 'Kills', wins: 'Wins' },
			winRate: 'Win %',
			update: 'Update my stats',
			none: 'No stats yet',
			noneMine: 'Tap “Update my stats”',
			empty: 'Nobody has typed in their stats yet. Be the first: tap “Update my stats”.',
			kills: (n: number) => `${n.toLocaleString('en-US')} kills`,
			wins: (n: number) => `${n.toLocaleString('en-US')} wins`,
			spm: (n: number) => `${n.toLocaleString('en-US')} score/min`,
			updated: (ago: string) => `Updated ${ago}`,
			delta: (delta: string, date: string) => `K/D ${delta} since ${date}`,
			form: (kd: string) => `Form ${kd}`,
			formHint: (date: string) => `K/D over just the games since ${date} (kills gained ÷ deaths gained)`,
			plusKills: (n: number) => `+${n.toLocaleString('en-US')} kills`,
			rowLabel: (rank: number, name: string, kd: string, second: string) => `#${rank} ${name}: K/D ${kd}, ${second}`,
			// the form
			title: 'Update my stats',
			where: 'Open your Combat Record in MW4 and copy the lifetime numbers. Fill in what you have and leave the rest empty.',
			sameDay: 'Saving again today replaces today’s numbers, so a typo is fixed by typing it again.',
			fields: {
				kills: 'Kills',
				deaths: 'Deaths',
				wins: 'Wins',
				losses: 'Losses',
				matches: 'Matches played',
				spm: 'Score per minute',
				kd: 'K/D ratio',
				wl: 'W/L ratio'
			},
			ratioAuto: 'Worked out from the numbers above',
			ratioHint: 'Only see the ratio? Type it here.',
			bad: 'That isn’t a number',
			nothing: 'Type in at least one number.',
			winsOver: 'Wins can’t be more than matches played.',
			save: 'Save',
			saved: 'Stats saved. The squad sees them now.',
			savedOffline: 'Saved here. They go to the squad as soon as it can be reached.',
			event: (mode: 'mp' | 'wz', kd: number | null, second: number | null, delta: number | null) => {
				const parts: string[] = [];
				if (kd !== null) {
					const r = delta === null ? null : Math.round(delta * 100) / 100;
					const d = r === null ? '' : ` (${r === 0 ? '±0.00' : `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(2)}`})`;
					parts.push(`K/D ${kd.toFixed(2)}${d}`);
				}
				if (second !== null) parts.push(mode === 'mp' ? `W/L ${second.toFixed(2)}` : `${second.toFixed(1)}% wins`);
				return `updated ${mode === 'mp' ? 'MP' : 'WZ'} stats: ${parts.join(' · ')} 📊`;
			}
		},
		/** The joke ban (squad-bans.ts, 2026-11-16): only Abscar sees the button. */
		ban: {
			lift: (name: string) => `Lift ${name}’s ban`,
			again: (name: string) => `Ban ${name} again`,
			hint: (name: string, reason: string) => `Only you see this. ${name} wears a BANNED stamp in the header (${reason}); lifting it takes it off for the whole squad.`,
			liftedHint: (name: string) => `${name}’s ban is lifted for the whole squad.`,
			tag: 'Banned',
			lifted: (name: string) => `${name}’s ban is lifted.`,
			banned: (name: string) => `${name} is banned again.`,
			failed: 'Couldn’t reach the squad. Try again in a moment.',
			liftedEvent: (name: string) => `lifted ${name}’s ban ✅`,
			bannedEvent: (name: string) => `banned ${name} 🚫`,
			/** a K/D over the limit (2026-11-16: "anything over 2.5 is a lie") */
			fakeHint: (name: string, kd: string, limit: number) =>
				`Only you see this. ${name} typed in a K/D of ${kd} (over ${limit}) and wears the BANNED stamp; lifting it takes it off until they save a K/D over ${limit} again.`,
			liftedFakeHint: (name: string, limit: number) => `${name}’s ban is lifted. A new K/D over ${limit} puts it back.`,
			formWarn: (kd: string, limit: number) => `K/D ${kd}? Anything over ${limit} is a lie: saving it gets you the BANNED stamp.`,
			fakeEvent: (kd: string, limit: number) => `got BANNED: a K/D of ${kd} is a lie (over ${limit}) 🚫`
		},
		/** The Ranked board (2026-11-16): everyone types in their SR, see who's climbing. */
		ranked: {
			heading: 'Ranked board',
			note: 'Everyone types in their own SR from the game’s Ranked menu: nothing can fetch it by itself. The rank is worked out from the SR with last year’s (BO7) table until MW4 shows its own.',
			launch: 'MW4 Ranked starts with Season 2 (the CDL season starts 4 Dec). Type in your SR once you’ve played your first matches.',
			update: 'Update my SR',
			none: 'No SR yet',
			noneMine: 'Tap “Update my SR”',
			empty: 'Nobody has typed in their SR yet.',
			sr: 'SR',
			updated: (ago: string) => `Updated ${ago}`,
			delta: (delta: string, date: string) => `${delta} SR since ${date}`,
			rankUp: (from: string) => `up from ${from}`,
			rankDown: (from: string) => `down from ${from}`,
			toNext: (sr: number, label: string) => `${sr.toLocaleString('en-US')} SR to ${label}`,
			rowLabel: (rank: number, name: string, sr: number, label: string) => `#${rank} ${name}: ${sr.toLocaleString('en-US')} SR, ${label}`,
			// a locked SR (squad-ranked.ts LOCKED_SR)
			lockedTag: 'Locked',
			locked: (sr: string) => `SR locked at ${sr}`,
			lockedBtn: '🔒 SR locked',
			lockedMine: (sr: string) => `Your SR is locked at ${sr}: it can’t be changed from here.`,
			// the form
			title: 'Update my SR',
			where: 'Open Ranked Play in MW4 and type in the SR (skill rating) it shows.',
			srField: 'Your SR',
			topField: 'Top 250 place',
			topHint: 'Only if you’re in the Top 250',
			rankPreview: (label: string) => `That’s ${label} on last year’s table.`,
			sameDay: 'Saving again today replaces today’s SR, so a typo is fixed by typing it again.',
			bad: 'Type a whole number, like 2450.',
			badTop: 'A place from 1 to 250.',
			nothing: 'Type in your SR.',
			save: 'Save',
			saved: 'SR saved. The squad sees it now.',
			savedOffline: 'Saved here. It goes to the squad as soon as it can be reached.',
			event: (sr: number, label: string, delta: string | null) => `updated Ranked: ${sr.toLocaleString('en-US')} SR · ${label}${delta ? ` (${delta})` : ''} 🎖️`
		},
		/** Squad classes (2026-11-16): the classes each member actually runs, copied in one tap. */
		classes: {
			heading: 'Squad classes',
			note: 'Share the classes you actually run, with the game’s build code, so the others can copy them in one tap.',
			add: 'Share a class',
			empty: 'Nobody has shared a class yet. Be the first: tap “Share a class”.',
			filterLabel: 'Gun',
			allGuns: 'All guns',
			kinds: { mp: 'Multiplayer', hc: 'Hardcore', wz: 'Warzone', rk: 'Ranked' },
			kindLabel: 'Played in',
			by: (name: string) => `by ${name}`,
			saved: (ago: string) => `Shared ${ago}`,
			remove: 'Remove',
			removeLabel: (gun: string, name: string) => `Stop sharing your ${gun} class${name ? ` “${name}”` : ''}`,
			removed: 'Class removed.',
			copyWhat: (who: string, gun: string, name: string) => `${who}’s ${gun}${name ? ` “${name}”` : ''} class`,
			/** in the weapon card's Meta tab */
			cardHeading: 'Your squad runs',
			cardSub: 'Classes your squad shared for this gun (Squad tab).',
			// the form
			title: 'Share a class',
			where: 'Paste the build code of your class from the game. The page sees which gun it is from the code.',
			codeField: 'Build code',
			codeBad: 'That doesn’t look like a build code (like B04-3KA95-TI247-BF11).',
			codeEmpty: 'Paste or type the build code.',
			gunField: 'Gun',
			gunPick: 'Pick the gun',
			gunNeeded: 'Pick which gun it’s for.',
			gunFound: (gun: string) => `Code for the ${gun}`,
			gunMismatch: (gun: string) => `The code looks like a ${gun} code. Check the gun.`,
			knownField: 'Or start from a published build',
			knownNone: 'Pick a published build…',
			nameField: 'Name (optional)',
			namePlaceholder: 'e.g. SnD sniper',
			full: (n: number) => `You already share ${n} classes. Remove one first.`,
			save: 'Share',
			sharedOk: 'Class shared. The squad can copy it now.',
			sharedOffline: 'Saved here. It goes to the squad as soon as it can be reached.',
			event: (gun: string, kind: string, name: string | null) => `shared a ${gun} class (${kind}${name ? `, “${name}”` : ''}) 🔫`
		},
		squadUp: {
			banner: (n: number) => `SQUAD UP · ${n} online`,
			sub: 'Party mode: the header burns, the TV plays a hype montage, the buddy dances.',
			close: 'Close'
		},
		usual: (day: string, from: number) => `You usually play ${day}s ${from}–${(from + 2) % 24}`,
		usualNone: 'Not enough ticks yet to tell when you usually play.',
		weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
		roulette: {
			heading: 'Tonight’s roulette',
			note: 'One spin, the same on every squad page. Only guns nobody in the group has maxed.',
			each: 'Spin: a gun each',
			cls: 'Spin: one class for all',
			who: (n: number) => `For the ${n} online now`,
			whoAll: 'For the whole squad (nobody else is online)',
			startsIn: (s: number) => `Spinning in ${s} s… every open squad page sees the same spin`,
			spinning: 'Spinning…',
			tonightClass: (cls: string) => `Tonight everyone runs ${cls}`,
			tonightEach: 'Tonight’s guns',
			by: (name: string) => `Spun by ${name}`,
			none: 'No spin tonight yet.',
			allMaxed: 'Every gun is maxed by someone in the group: nothing to spin.',
			again: 'Spin again',
			event: 'spun tonight’s roulette 🎰',
			wheel: 'The roulette wheel'
		},
		bank: {
			heading: 'Burger bank',
			note: 'Pretend burgers, just for fun: no real money, nothing to buy.',
			howLabel: 'How burgers work',
			betsHeading: 'Bets',
			how: (s: { start: number; gold: number; platinum: number; harmonicBreak: number; mastery: number; divergence: number }) =>
				`You earn burgers on camos: ${s.start} to start, Gold +${s.gold}, Platinum +${s.platinum}, Harmonic Break +${s.harmonicBreak}, Divergence +${s.divergence}, each Mastery camo +${s.mastery}. Bet them on duels and the race to Divergence: win and you get your bet back doubled. Every day you’re online with the squad adds a daily bonus (25, going up by 25 every 5 days online), and what you win or lose in BurgiCasino counts too. Abscar is the house: every burger the others lose in BurgiCasino or on bets goes to Abscar’s account.`,
			houseTag: (n: number) => `house +${n.toLocaleString('en-US')}`,
			richest: 'Richest',
			burgers: (n: number) => `${n.toLocaleString('en-US')} burger${n === 1 ? '' : 's'}`,
			onBets: (n: number) => `${n} on open bets`,
			bet: 'Place a bet',
			betTitle: 'Bet burgers',
			on: 'Bet on',
			race: 'The race to Divergence',
			duelOpt: (a: string, b: string, camo: string, weapon: string) => `${a} vs ${b}: first to ${camo} on the ${weapon}`,
			winner: 'Who wins?',
			amount: 'How many burgers',
			youHave: (n: number) => `You have ${n}.`,
			go: 'Bet',
			cancel: 'Cancel',
			noBets: 'No bets yet.',
			nothingOpen: 'Nothing to bet on: start a duel, or wait for someone to near Divergence… the race is always open until somebody unlocks it.',
			betLine: (by: string, n: number, pick: string, what: string) => `${by} bet ${n} on ${pick} · ${what}`,
			whatRace: 'race to Divergence',
			whatDuel: (weapon: string) => `duel on the ${weapon}`,
			states: { open: 'Open', won: 'Won', lost: 'Lost', void: 'Called off' },
			withdraw: 'Take back',
			refused: 'Couldn’t place that bet: not enough burgers, already decided, or you already bet on it.',
			placed: 'Bet placed.',
			iouHeading: 'Real-burger IOUs',
			iouNote: 'One real burger per lost duel, netted between each pair.',
			iou: (from: string, to: string, n: number) => `${from} owes ${to} ${n} real burger${n === 1 ? '' : 's'}`,
			paid: 'Paid',
			noIou: 'Nobody owes anybody. Yet.',
			icon: 'burgers'
		},
		wrapped: {
			open: 'Squad Wrapped',
			openSunday: 'Squad Wrapped is here',
			hint: 'The week in numbers. Every Sunday, this week; other days, last week.',
			title: 'Squad Wrapped',
			week: (from: string, to: string) => `${from} – ${to}`,
			intro: (n: number) => `The squad ticked ${n} camo${n === 1 ? '' : 's'} this week.`,
			introNone: 'Not a single camo this week. Wow.',
			mostCamos: 'Most camos',
			camos: (n: number) => `${n} camo${n === 1 ? '' : 's'}`,
			topClass: 'Most grinded class',
			topClassLine: (cls: string, n: number) => `${cls} · ${n} camo${n === 1 ? '' : 's'}`,
			nightOwl: 'The Night Owl',
			nightOwlLine: (n: number) => `${n} camo${n === 1 ? '' : 's'} ticked between 02:00 and 06:00`,
			noOwl: 'Nobody ticked after 2 am. Responsible squad.',
			bestDay: 'Biggest day',
			bestDayLine: (day: string, n: number) => `${n} camos on ${day}`,
			maxed: 'Weapons maxed',
			maxedNone: 'No weapon maxed this week.',
			hours: 'Most hours with the tracker open',
			slacker: 'Slacker of the week',
			slackerLine: (n: number) => `${n} camo${n === 1 ? '' : 's'}. The squad expects more.`,
			noSlacker: 'No slacker this week: everyone pulled their weight.',
			next: 'Next',
			prev: 'Back',
			close: 'Close',
			download: 'Download picture',
			share: 'Share',
			file: (date: string) => `squad-wrapped-${date}.png`,
			slide: (n: number, total: number) => `Slide ${n} of ${total}`
		},
		tv: {
			channel: 'CH 99',
			desk: 'SQUAD NEWS DESK',
			breaking: 'BREAKING',
			back: 'Back to the montages',
			label: (text: string) => `Squad news: ${text}`,
			maxed: (who: string, weapon: string) => `${who} maxes the ${weapon}`,
			nuke: (who: string) => `NUKE: ${who} unlocks Divergence`,
			duelWon: (who: string, loser: string, weapon: string) => `${who} beats ${loser} in the ${weapon} duel`,
			mvp: (who: string, n: number) => `${who} leads the week with ${n} camos`,
			mastery: (who: string, n: number) => `${who} has ${n} Mastery camo${n === 1 ? '' : 's'} done`,
			played: (who: string, time: string) => `${who} has had the tracker open ${time} today`,
			asleep: (who: string) => `${who} still asleep`,
			missing: (who: string, days: number) => `${who} missing for ${days} days, search party sent`,
			slacker: (who: string) => `${who} named slacker of the week`,
			joiner: ' · ',
			quiet: 'Quiet day in the squad. Suspiciously quiet.'
		}
	},
	/** The Extra camos tab (ExtraCamosSection; data/extraCamos.ts). */
	extraCamos: {
		heading: 'Extra camos',
		sub: (n: number) => `${n} camos outside the weapon grind`,
		statusGroup: 'Show',
		statuses: { now: 'Available now', upcoming: 'Upcoming', expired: 'Expired' },
		statusHelp: {
			now: 'Camos you can earn right now: events, hidden challenges, other challenges, BlackCell, Prestige and account rewards. Ending soonest first.',
			upcoming: 'Announced or leaked, not out yet. Starting soonest first; no date means nobody has given one.',
			expired: 'Can’t be earned any more. If you got one, it stays yours.'
		},
		empty: {
			now: 'Nothing available right now.',
			upcoming: 'Nothing announced yet.',
			expired: 'Nothing has ended yet.'
		},
		search: 'Search extra camos',
		searchPlaceholder: 'Search camo, event, weapon…',
		results: (shown: number, total: number) => (shown === total ? `${total} camos` : `${shown} of ${total} camos`),
		/** The "Got it" ticks (2026-11-13): saved and synced like the other ticks. */
		gotCount: (got: number, total: number) => `${got} of ${total} got`,
		got: 'Got it',
		gotTick: (name: string) => `Got ${name}`,
		gotTickPerWeapon: (name: string) => `Got ${name} (on at least one weapon)`,
		gotOn: '✔ Got it',
		hideGot: 'Hide the ones I’ve got',
		allGot: 'You’ve got every camo in this list.',
		kindGroup: 'Where it comes from',
		allKinds: 'All',
		kinds: {
			event: 'Events',
			easterEgg: 'Secrets & hidden challenges',
			challenge: 'Challenges',
			blackcell: 'BlackCell (paid)',
			prestige: 'Prestige',
			edition: 'Pre-order & beta',
			promo: 'Account & promotions'
		},
		modes: { mp: 'Multiplayer', dmz: 'DMZ', wz: 'Warzone' },
		modesShort: { mp: 'MP', dmz: 'DMZ', wz: 'WZ' },
		modesLabel: (list: string) => `Earned in: ${list}`,
		animated: 'Animated',
		until: (day: string, left: number) => `Until ${day} · ${left} ${left === 1 ? 'day' : 'days'} left`,
		lastDay: 'Last day today',
		from: (day: string) => `From ${day}`,
		noDate: 'No date yet',
		ended: (day: string) => `Ended ${day}`,
		gone: 'No longer available',
		everyWeapon: 'Every weapon',
		perWeapon: 'Per weapon',
		onlyWeapon: (w: string) => `Only ${w}`,
		everyWeaponLong: 'A universal camo: once earned it goes on every weapon.',
		perWeaponLong: 'Earned on each weapon separately, and only that weapon gets it.',
		/** Pyroclast Terminus / Scatter / Cascade: ticked per weapon in the camo list (2026-11-15). */
		prestigeOn: (n: number, total: number) => `On ${n} of ${total} weapons`,
		prestigeOnLong: (n: number, total: number) =>
			`You have it on ${n} of ${total} weapons. Tick it per weapon in the camo list, in the Prestige row under G / P / HB.`,
		onlyWeaponLong: (w: string) => `Only for the ${w}.`,
		openHint: 'opens the details',
		howHeading: 'How to get it',
		whenHeading: 'When',
		since: (day: string) => `Since ${day}.`,
		untilLong: (day: string, left: number) =>
			left === 0 ? `Last day today (${day}).` : `Until ${day}: ${left} ${left === 1 ? 'day' : 'days'} left.`,
		noEnd: 'No end date announced.',
		fromLong: (day: string, more?: string) => `Starts ${day}.${more ? ` ${more}` : ''}`,
		endedLong: (day: string) => `Ended ${day}: it can’t be earned any more.`,
		trust: {
			official: 'Official.',
			guides: 'Several guides agree.',
			one: 'Unconfirmed: only one source so far.',
			leak: 'Leak: datamined or leaked, not announced.'
		},
		trustShort: { official: 'Official', guides: 'Guides agree', one: 'One source', leak: 'Leak' },
		sourcesLine: (sources: string) => `Sources: ${sources}.`,
		/** Under the camo's picture in the info box (2026-11-16; data/extraLooks.ts). */
		drawnAfter: (after: string) => `The picture is our own drawing in the camo’s style, made after ${after}. It’s close, not exact.`,
		close: 'Close',
		none: 'Nothing matches.',
		clear: 'Clear search',
		honest:
			'The weapon grind (Military, Special, Gold, Platinum, Harmonic Break, Divergence, Mastery) is on the Camo grind tab; this is every other camo we found a source for. Paid store bundles are left out; the Season 1 Battle Pass, the campaign, DMZ secrets, Twitch drops and the partner promotions were checked and give no camos. Lists move along by themselves as dates pass; ≈ marks an estimated date. Tap a camo for the details, tap the box to mark it as got (saved and synced like your other ticks). The camo pictures are our own drawings in each camo’s style, made after the real one; a camo nobody has shown yet gets a symbol for where it comes from instead.',
		snapshot: (sources: string, date: string) => `Checked ${date}. Sources: ${sources}.`
	},
	/** The Cosmetics tab (CosmeticsSection; data/cosmetics.ts). */
	cosmetics: {
		heading: 'Cosmetics',
		sub: (n: number) => `${n} large stickers, stickers and charms`,
		typeGroup: 'Kind of item',
		types: { decal: 'Large stickers', sticker: 'Stickers', charm: 'Charms' },
		typeHelp: {
			decal: 'Large stickers (“Large Decals” in game): the big one along the side of your weapon.',
			sticker: 'Stickers (“Weapon Stickers” in game): the small ones you place on your weapon.',
			charm: 'Charms (“Weapon Charms” in game): hang from your weapon. Gun Screens use the same slot.'
		},
		search: 'Search cosmetics',
		searchPlaceholder: 'Search name, bundle, tier…',
		results: (shown: number, total: number) => (shown === total ? `${total} items` : `${shown} of ${total} items`),
		sourceGroup: 'Where it comes from',
		allSources: 'All',
		sources: {
			prestige: 'Prestige',
			battlepass: 'Battle Pass',
			event: 'Events',
			store: 'Store bundles',
			promo: 'Promotions',
			beta: 'Beta & Twitch drops',
			unknown: 'Source unknown'
		},
		gunScreen: 'Gun Screen',
		newTag: 'New',
		newCount: (n: number) => `${n} new`,
		until: (day: string) => `Until ${day}`,
		ended: (day: string) => `Ended ${day}`,
		unconfirmed: 'Unconfirmed.',
		unconfirmedShort: 'Unconfirmed',
		openHint: 'opens where to get it',
		kind: { decal: 'Large sticker (Large Decal)', sticker: 'Sticker', charm: 'Charm' },
		whereHeading: 'Where to get it',
		sourceHelp: {
			prestige: 'Reach level 55, enter Prestige, then level up again: the reward unlocks at the level shown. Prestige Master starts after Prestige 10.',
			battlepass: 'Earn Battle Pass tiers by playing during Season 1. Tiers past the free ones need the paid pass.',
			event: 'Play during the event: earn it on the event\u2019s reward board or by finishing the event challenge shown. Gone when the event ends.',
			store: 'Bought with COD Points in the in-game Store; comes with everything else in the bundle. Bundles rotate, so it may not be listed every day.',
			promo: 'A code from a real-world promotion, redeemed at callofduty.com/redeem. Most are limited to certain countries or shops.',
			beta: 'Only while it ran: playing the open beta in August, or watching Call of Duty on Twitch with your Activision account linked during a drop campaign. Unlocked items carried over to the full game.',
			unknown: 'Its name is known, but no source says how you get it yet.'
		},
		untilLong: (day: string) => `Available until ${day}.`,
		endedLong: (day: string) => `Ended ${day}: it can\u2019t be earned any more.`,
		drawnAfter: (after: string) => `The picture is our own drawing, made after ${after}. It\u2019s close, not exact.`,
		guessArt:
			'Nobody has published a picture of the real one yet, so this drawing is our guess from the name. The real one will look different.',
		guessTag: 'Our guess',
		noArt: 'No picture of this one found yet, so it isn\u2019t drawn: a made-up look would pass for the real thing.',
		close: 'Close',
		none: 'Nothing matches.',
		clear: 'Clear search',
		honest:
			'Nobody publishes a complete list, so this is every large sticker, sticker and charm we found a source for. The pictures are our own drawings made after pictures of the real items; the few nobody has shown yet are our guess from the name and are marked “Our guess”. A plain symbol means no picture found yet. Tap an item for where to get it.',
		snapshot: (sources: string, date: string) => `Checked ${date}. Sources: ${sources}.`
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
			'Keep your ticks and notes the same on this browser and your phone, automatically. No account or password: a private sync link connects your devices.',
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
			'Open this link once on your phone (or another computer). After that, your ticks and notes stay the same everywhere. Anyone with the link can see and change your ticks, so send it only to yourself.',
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
		body: 'Pick what to reset to. Your notes stay. Export a backup first if you might want it back.',
		presetLabel: 'Gold on launch weapons',
		presetBody: (launch: number) =>
			`Gold ticked on the ${launch} launch weapons, everything else cleared: Platinum, Harmonic Break, before-Gold ticks and Mastery counts.`,
		zeroLabel: 'Start from zero',
		zeroBody: 'Nothing ticked at all, like a brand-new tracker. Before-Gold ticks and Mastery counts cleared.',
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
			'Tap a box to tick it. Ticking a higher camo fills in the ones below it; unticking a lower one clears the ones above. Tap a weapon’s name to write a note or see its latest buff or nerf.',
		divergence: (n: number) =>
			`Divergence unlocks at ${n} Harmonic Breaks. Whether Season 1 weapons count toward that is not confirmed yet.`,
		sources:
			'Challenges from the codmunity.gg MW4 camo guide, cross-checked with Destructoid, games.gg, GamerFuzion and CarrySquad. Weapon list from Gfinity, Dexerto and Destructoid. Weapon challenges are Multiplayer’s; Mastery covers Multiplayer, Warzone and DMZ (DMZ also checked with codcentral).',
		unverifiedLegend: 'Dotted underline = unconfirmed, double-check in game.'
	}
} as const;

export const t = en;
