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
	/** Battery saver (motion.svelte.ts; the header's old pause button, 2026-11-20). */
	saver: {
		label: 'Battery saver',
		off: 'Battery saver: the page stands still, the TV goes off and it checks for news less often',
		on: 'Battery saver is on. Tap to turn it off',
		onToast: 'Battery saver on: the page stands still and uses far less battery. Tap the battery at the top to turn it off.',
		offToast: 'Battery saver off: everything moves again.',
		auto: {
			battery: 'Your battery is low, so Battery saver turned itself on. Tap the battery at the top to turn it off.',
			data: 'Data Saver is on, so Battery saver turned itself on. Tap the battery at the top to turn it off.',
			motion: 'Your device asks for less motion, so Battery saver turned itself on. Tap the battery at the top to turn it off.'
		}
	},
	/** The net_graph (NetGraph.svelte, 2026-11-20): a small load readout at the top left on a PC. */
	netGraph: {
		menu: 'net_graph (CPU readout)',
		label: 'net_graph: how hard this page works the computer',
		fps: 'fps',
		cpu: 'cpu',
		sys: 'pc',
		anim: 'anim',
		mem: 'mem',
		pressure: { nominal: 'low', fair: 'fair', serious: 'high', critical: 'max' } as Record<string, string>,
		saver: 'saver',
		help: 'net_graph, like the game’s: fps = how often the page’s decoration is drawn (capped at 24), cpu = how busy this page keeps its main thread, pc = how hard the whole computer works (only some browsers tell), anim = animations moving now / in total, mem = memory the page’s code uses. A browser can’t read the real CPU %, so these are estimates.'
	},

	/** The "Hide" buttons on every part of the page + the list to bring them back (HideButton, HiddenBar; 2026-11-20). */
	hide: {
		button: 'Hide',
		buttonLabel: (what: string) => `Hide: ${what}`,
		tabButton: 'Hide this tab',
		/** the camo list's button, in the search row (next to "Hide maxed weapons", so it says what it hides) */
		listButton: 'Hide list',
		hiddenToast: (what: string) => `${what} hidden. Bring it back from “Hidden” at the top of the page.`,
		bar: (n: number) => `${n} ${n === 1 ? 'part' : 'parts'} hidden`,
		choose: 'Choose',
		chooseLabel: 'Choose what to show on the page',
		showAll: 'Show all',
		shownAllToast: 'Everything is shown again.',
		/** in the theme menu (top right), always there */
		menuEntry: 'Show / hide parts…',
		title: 'What to show',
		intro: 'Switch off what you don’t need. This is only for this device, and your ticks are never touched.',
		compactNote: 'Compact mode is on: it hides the decorations anyway (news, pictures, the TV …).',
		onlyCamosMeta: 'Only camos & metas',
		onlyCamosMetaToast: 'Only camos and metas are shown now.',
		showEverything: 'Show everything',
		done: 'Done',
		close: 'Close',
		groups: { header: 'Top of the page', grind: 'Camo grind tab', pictures: 'Pictures', tabs: 'Tabs' },
		allPictures: 'All pictures',
		names: {
			squad: 'Squad frame (operators)',
			hud: 'Red HUD box',
			tv: 'Old TV',
			buddy: 'News buddy',
			news: 'News radar',
			season: 'Season countdown',
			kpi: 'Progress tiles',
			camos: 'Camo list (all weapons)',
			classMeta: 'Class meta (when you pick a class)',
			mastery: 'Divergence & Mastery (whole box)',
			masteryMp: 'Multiplayer Mastery',
			masteryWz: 'Warzone Mastery',
			masteryDmz: 'DMZ Mastery',
			meta: 'Meta top 5',
			sync: 'Backup & sync',
			help: 'Help text at the bottom',
			picNuke: 'Nuke operator picture',
			picLars: 'Drängen Lars Åke picture',
			picCyborg: 'Cyborg skull picture',
			picCrown: 'Crowned skull picture',
			picWizard: 'Wizard picture',
			picDoomsday: 'Doomsday squad picture',
			picScooter: 'Scooter rider picture',
			picJoker: 'Joker in flames picture',
			tabRanked: 'Ranked tab',
			tabCosmetics: 'Cosmetics tab',
			tabExtras: 'Extra camos tab',
			tabSquad: 'Squad tab',
			tabCasino: 'BurgiCasino tab',
			tabShop: 'BurgiShop tab'
		},
		/** small notes in the list for parts that keep working while hidden */
		notes: {
			sync: 'Sync keeps running while it’s hidden.',
			tabSquad: 'You stay in the squad while it’s hidden.',
			mastery: 'Hides Divergence and all three Mastery tracks.'
		} as Partial<Record<string, string>>
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
		/** the sixth squad member (2026-11-20, the user's ask "lägg till AW som operator"), drawn the way the user
		    described him (AwEmblem); his sign in the user's words (2026-11-21) */
		aw: 'AW',
		awMotto: 'Sleep is optional',
		/** the seventh squad member (2026-11-17, the user's ask; his look from a picture the user sent, 2026-11-21) */
		joker: 'TheJoker_BPL',
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
		boot: ['ABSCAR OS v4.20 // CAMO GRIND TERMINAL', 'Operator Abscar authenticated. Squad link: Phillestar, Drängen Lars Åke, Da Jeeven, Ingman, AW, TheJoker_BPL.', 'Type “help” for commands. “exit” or Esc closes.'],
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
			'net_graph 0|1     the load readout (PC)',
			'clear · exit'
		],
		netGraph: (on: boolean) => (on ? 'net_graph 1: the readout is on (top left, on a PC).' : 'net_graph 0: the readout is off.'),
		netGraphUsage: (on: boolean) => `net_graph is ${on ? '1 (on)' : '0 (off)'}. Type “net_graph 1” or “net_graph 0”.`,
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
			'INGMAN ............ ONLINE (class: wizard, pipe: lit, Jim and Pro player)',
			'AW ................ ONLINE (new recruit, eyes: wide open, Sleep is optional)',
			'THEJOKER_BPL ...... ONLINE (new recruit, wild card, grin: permanent)'
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
		/** Ranked prep (RankedSection), second since 2026-11-20 (the user: "next to camos, second place");
		    until then a switch inside Camo grind */
		ranked: 'Ranked',
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
	/** BurgiGives, BurgiCasino's Donations tab (donations.ts, CasinoDonate.svelte; 2026-11-20). Joke causes, pretend burgers. */
	donate: {
		heading: 'BurgiGives',
		line: (n: number) => `Give your burgers to a good cause (sort of). ${n} totally real organisations, run by totally real people.`,
		gone: 'Donated burgers go to the karma bank. Good karma has a way of coming back around… 💗',
		yourBurgers: (n: number) => `Your burgers: ${n.toLocaleString('en-US')} 🍔`,
		youGave: (n: number) => `You’ve given ${n.toLocaleString('en-US')} 🍔`,
		sumHeading: 'The squad so far',
		sumLine: (n: number, donors: number) =>
			n ? `given by ${donors} donor${donors === 1 ? '' : 's'}` : 'Nobody has given anything yet. Be the first.',
		favourite: (org: string) => `Favourite cause: ${org}`,
		/** the squad card lists the five biggest causes; the rest are summed up in one line */
		sumTop: 'Top causes',
		sumMore: (n: number) => `+ ${n} more cause${n === 1 ? '' : 's'} below`,
		causes: 'The causes',
		mission: 'Mission',
		paysFor: 'Your burgers pay for',
		raised: (n: number) => `${n.toLocaleString('en-US')} 🍔 raised`,
		donors: (n: number) => `${n} donor${n === 1 ? '' : 's'}`,
		goal: (n: number) => `Goal ${n.toLocaleString('en-US')} 🍔`,
		goalsReached: (n: number) => `${n} goal${n === 1 ? '' : 's'} reached`,
		top: (name: string, n: number) => `Top donor: ${name} · ${n.toLocaleString('en-US')} 🍔`,
		noTop: 'No donors yet',
		give: 'Donate',
		close: 'Close',
		amount: 'How many burgers',
		amountHint: 'Type a number, or 10k / 2.5m',
		all: 'All of it',
		half: 'Half',
		giveN: (n: number) => `Donate ${n.toLocaleString('en-US')} 🍔`,
		bad: 'Type how many burgers (a whole number).',
		broke: (have: number) => `You only have ${have.toLocaleString('en-US')} 🍔.`,
		tooBig: (max: number) => `At most ${max.toLocaleString('en-US')} 🍔 in one go.`,
		off: 'Couldn’t reach the squad. Try again in a moment.',
		thanks: (name: string) => `THANK YOU, ${name.toUpperCase()}!`,
		given: (n: number, org: string) => `${n.toLocaleString('en-US')} 🍔 donated to ${org} 💛`,
		goalToast: (org: string, goal: number) => `${org} just passed ${goal.toLocaleString('en-US')} 🍔! 🎉`,
		event: (n: number, org: string) => `donated ${n.toLocaleString('en-US')} 🍔 to ${org} 💛`,
		goalEvent: (n: number, org: string, goal: number) => `donated ${n.toLocaleString('en-US')} 🍔 and pushed ${org} past ${goal.toLocaleString('en-US')} 🍔! 🎉`,
		whoHeading: 'Who gave to what',
		whoNone: 'Nobody has donated yet.',
		whoRow: (n: number) => `${n.toLocaleString('en-US')} 🍔 in all`,
		recentHeading: 'Latest gifts',
		recentNone: 'No gifts yet.',
		recentRow: (name: string, n: number, org: string) => `${name} gave ${n.toLocaleString('en-US')} 🍔 to ${org}`,
		ago: (min: number) => (min < 1 ? 'just now' : min < 60 ? `${min} min ago` : min < 1440 ? `${Math.floor(min / 60)} h ago` : `${Math.floor(min / 1440)} d ago`),
		you: 'You',
		note: 'Made-up causes and pretend burgers: no real charity, no real money.',
		/** The karma bank (2026-11-21): only the house (Abscar) sees it. */
		karma: {
			heading: 'Karma bank',
			secret: 'Only you see this',
			intro: 'Every burger anyone donates turns into a heart here. Send hearts back to the gang: they arrive as burgers, with a little love.',
			hearts: (n: number) => `${n.toLocaleString('en-US')} 💗`,
			heartsLabel: 'Hearts in the bank',
			given: (n: number) => `${n.toLocaleString('en-US')} 💗 sent back so far`,
			amount: 'Hearts each',
			line: 'With a love line',
			noLine: 'No line',
			lines: ['GG, legend 💗', 'For the grind 💪', 'Burgers on me 🍔', 'You deserve it ❤️', 'Squad love 🫶', 'Keep smiling 😘'],
			to: 'Who gets the love',
			everyone: 'Everyone',
			send: (n: number) => `Send ${n.toLocaleString('en-US')} 💗`,
			sendEmpty: 'Send 💗',
			sendAll: (n: number, people: number) => `Send ${n.toLocaleString('en-US')} 💗 to all ${people}`,
			sent: (name: string, n: number) => `${n.toLocaleString('en-US')} 💗 sent to ${name} as burgers`,
			sentAll: (n: number, people: number) => `${n.toLocaleString('en-US')} 💗 each sent to ${people} people`,
			broke: (have: number) => `The bank only has ${have.toLocaleString('en-US')} 💗.`,
			off: 'Couldn’t reach the squad. Try again in a moment.',
			nobody: 'Nobody else is in the squad yet.',
			gotTag: (n: number) => `got ${n.toLocaleString('en-US')} 💗`,
			logHeading: 'Love sent',
			logNone: 'No love sent yet.',
			logRow: (name: string, n: number) => `${name} got ${n.toLocaleString('en-US')} 💗`,
			event: (name: string, n: number, line: string | null) => `sent ${name} ${n.toLocaleString('en-US')} 🍔 from the karma bank${line ? `: “${line}”` : ''} 💗`,
			eventAll: (n: number, line: string | null) => `sent everyone ${n.toLocaleString('en-US')} 🍔 from the karma bank${line ? `: “${line}”` : ''} 💗`,
			got: (from: string, n: number, line: string | null) => `💗 ${from} sent you ${n.toLocaleString('en-US')} 🍔 with love${line ? `: “${line}”` : '!'}`
		},
		orgs: {
			holk: {
				name: 'Holk Relief Fund',
				short: 'Holk Relief',
				mission: 'No operator should ever drop into a match with an empty mouth.',
				paysFor: 'Rolling papers, a lighter that actually lights, and a fresh ashtray for the lobby.',
				thanks: 'Puff puff, thank you!'
			},
			barn: {
				name: 'Drängen’s Barn',
				short: 'Drängen’s Barn',
				mission: 'A quiet barn for Drängen Lars Åke, far, far away from the randoms.',
				paysFor: 'A new pitchfork, a beer cooler, and headphones that block out randoms completely.',
				thanks: 'Lars Åke tips his cap.'
			},
			campaign: {
				name: 'Save the Campaign',
				short: 'Save the Campaign',
				mission: 'Rescuing lonely campaign missions that nobody in this squad will ever play.',
				paysFor: 'Dusting off the disc, and a pity visit to the final boss, who’s been waiting since launch.',
				thanks: 'The campaign shed a single tear.'
			},
			hardcore: {
				name: 'Friendly Fire Fund',
				short: 'Friendly Fire',
				mission: 'Patching up everyone shot in the back by their own squad in Hardcore.',
				paysFor: 'Band-aids, a minimap Hardcore will never give you, and an apology card from whoever did it.',
				thanks: 'Band-aid applied. Check your fire.'
			},
			wrists: {
				name: 'Camo Grinders’ Wrist Clinic',
				short: 'Wrist Clinic',
				mission: 'Ice packs for players who are still 30 longshots away from Harmonic Break.',
				paysFor: 'Wrist braces, ice packs, and someone who listens while you complain about longshots.',
				thanks: 'Your wrists say thanks.'
			},
			gains: {
				name: 'Ingman’s Gains Fund',
				short: 'Ingman’s Gains',
				mission: 'Heavier plates for the strongest wizard in the squad. Every rep counts.',
				paysFor: 'Protein shakes, chalk, and a mirror big enough for Ingman’s biceps.',
				thanks: 'Ingman benches your burgers. GAINS!'
			},
			jardin: {
				name: 'Da Jeeven’s Spanish Garden',
				short: 'Spanish Garden',
				mission: 'Keeping Da Jeeven’s garden in Spain green, sunny and very well watered.',
				paysFor: 'Sun lotion, a garden hose, and some top-shelf “grass” for the garden. Strictly the lawn kind.',
				thanks: '¡Gracias, amigo! Da Jeeven waves from the sun.'
			},
			beer: {
				name: 'Strategic Beer Reserve',
				short: 'Beer Reserve',
				mission: 'Making sure Drängen’s fridge never, ever runs dry.',
				paysFor: 'Crates of cold beer, a bottle opener on a string, and a second fridge for the barn.',
				thanks: 'Skål! Lars Åke cracks one open for you.'
			},
			nitro: {
				name: 'Phillestar’s Nitro Fund',
				short: 'Nitro Fund',
				mission: 'Fast cars and bad ideas: paying for Phillestar’s next very dumb stunt.',
				paysFor: 'Nitro, a helmet he won’t wear, and a tow truck for when the ramp goes wrong.',
				thanks: 'VROOOM! Phillestar floors it.'
			},
			rehab: {
				name: 'Ogge’s Rehab',
				short: 'Ogge’s Rehab',
				mission: 'Helping Ogge get clean. Day 1. Again.',
				paysFor: 'A comfy couch, herbal tea, and a very, very patient counsellor.',
				thanks: 'Ogge says thanks. Day 2 starts now.'
			},
			ragequit: {
				name: 'Rage Quit Relief',
				short: 'Rage Quit',
				mission: 'New controllers for everyone who threw theirs across the room after a lost match.',
				paysFor: 'Controllers, a headset with a working mic, and a stress ball shaped like a burger.',
				thanks: 'Controller replaced. Breathe in, breathe out.'
			}
		}
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
		debt: (n: number) => `In debt: −${n.toLocaleString('en-US')} 🍔`,
		debtHelp: 'More was spent or given away than this player has. Until it’s cleared the balance stays at 0, whatever you give.',
		clearDebt: 'Clear debt',
		cleared: (name: string) => `${name}’s debt is cleared: back to 0 🍔, and gifts count again`,
		details: 'Where the burgers went',
		parts: {
			earned: 'Camo grind',
			daily: 'Daily bonus',
			casino: 'Casino (won − lost)',
			house: 'House income',
			loan: 'Loans',
			grant: 'Admin gave / took',
			karma: 'Karma bank',
			bets: 'Squad bets',
			spent: 'Spent in BurgiShop',
			donated: 'Donated'
		},
		signed: (n: number) => `${n < 0 ? '−' : '+'}${Math.abs(n).toLocaleString('en-US')}`,
		gaveEvent: (name: string, n: number) => `gave ${name} ${n.toLocaleString('en-US')} 🍔 (admin) 🎁`,
		tookEvent: (name: string, n: number) => `took ${n.toLocaleString('en-US')} 🍔 from ${name} (admin) 🔨`
	},
	/** Abscar's control room in BurgiCasino (casino-rig.ts, CasinoRig.svelte; 2026-11-19). */
	rig: {
		heading: 'Control room',
		intro: 'Only you see this tab. Changes reach the others’ pages within half a minute. Nothing goes on the radio, and the games look exactly as usual.',
		saved: 'Saved',
		failed: 'Couldn’t reach the squad. Try again in a moment.',
		games: { slots: 'Abscar’s Fortune', fortune2: 'Mybots 5', book: 'Book Of Skedd', kushburst: 'Kushburst', stash: 'Abscar’s Stash', skeddwood: 'Skeddwood', roulette: 'Roulette', blackjack: 'Blackjack' },
		odds: {
			heading: 'Odds per game',
			intro: 'For everyone who plays that game. Plus = the players win more (the house takes less), minus = they lose more.'
		},
		luck: {
			heading: 'Luck per player',
			intro: 'In every game. Odds and luck add up: odds +20 and luck +30 = +50 for that player in that game. On the slot machines each player’s karma luck (❤️, from giving burgers away in BurgiGives, up to +40) adds on top.',
			karma: (luck: number, hearts: number) => `❤️ Karma luck +${luck} on the slots (${hearts.toLocaleString('en-US')} ❤️ earned)`,
			noKarma: '❤️ No karma luck yet (hasn’t given burgers away)',
			total: (range: string) => `On the slots in all: ${range}`
		},
		value: (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0'),
		/** What a luck / odds value does, in words. */
		effect: (n: number, draws: number, chance: number) => {
			if (!n) return 'Normal';
			const which = n > 0 ? 'best' : 'worst';
			const head = n > 0 ? 'Lucky' : 'Unlucky';
			if (draws === 1) return `${head}: ${which} of 2 in ${chance} % of games`;
			return `${head}: every game ${which} of ${draws}${chance ? `, ${which} of ${draws + 1} in ${chance} %` : ''}`;
		},
		how: 'How luck works: the game is played out as usual, then (as often as the setting says) once or twice more behind the scenes, and the best result counts (or the worst, for minus). ±50 = always two tries, ±100 = always three. Karma luck adds to your settings like a third slider (the player sees only their karma luck, never yours): to make someone with lots of karma unlucky anyway, pull their slider further down or pick their result below.',
		guide: 'Small steps go a long way. Every slot machine runs on normal odds (about 96–98 % back): at +50 about 1.8× what goes in, at −50 about a tenth, at −100 almost nothing. Book Of Skedd’s gamble card follows luck too (+50 guesses the colour right 3 times in 4). On red at roulette, +50 wins about 3 spins in 4 and −50 about 1 in 4. At blackjack a player normally wins about 4 hands in 10; at +50 about 6, at −50 about 2.5.',
		changed: (n: number) => (n ? `${n} changed` : 'all normal'),
		resetAll: 'Everything back to normal',
		resetAsk: 'Put all odds, luck and picked results back to normal?',
		resetYes: 'Yes, back to normal',
		resetDone: 'Everything back to normal',
		cancel: 'Cancel',
		// picked results
		who: 'Who',
		anyone: 'Whoever plays first',
		everyone: 'Everyone',
		mode: 'How long',
		once: 'Next play only',
		every: 'Every play until I switch it off',
		save: 'Save',
		off: 'Switch off',
		clear: 'Clear',
		state: {
			none: 'Off: the game plays as usual.',
			every: (who: string) => `On: every play, ${who}.`,
			waiting: (who: string) => `Waiting for the next play (${who}).`,
			used: (who: string, time: string) => `Used by ${who} at ${time} ✔`
		},
		whoWords: { anyone: 'whoever plays first', everyone: 'everyone' },
		slots: {
			heading: 'Abscar’s Fortune: pick the screen',
			intro: 'Tap a square, then the symbol it should show. Their next spin lands on exactly this screen (bought features stay random).',
			presets: { jackpot: '5 WILDs (jackpot)', burgers: '5 burgers', free5: '5 ketchup', free3: '3 ketchup', box: 'Burger Box', wheel: 'Bonus wheel', blank: 'Nothing' },
			presetSpins: (label: string, n: number) => `${label} (${n} free spins)`,
			quick: 'Quick picks',
			palette: 'Symbol for the square',
			cell: (reel: number, row: number, sym: string) => `Reel ${reel}, row ${row}: ${sym}`,
			pays: (n: number) => `At a 100 🍔 bet the lines and ketchup pay ${n.toLocaleString('en-US')} 🍔`,
			nothing: 'At a 100 🍔 bet this screen pays nothing',
			jackpot: 'BURGER JACKPOT',
			free: (n: number) => `${n} free spins`,
			box: 'Burger Box',
			wheel: 'Bonus wheel',
			weeds: 'weeds multiply a win by a random amount'
		},
		fortune2: {
			heading: 'Mybots 5: pick what happens',
			intro: 'Their next spin is one that has it (the machine plays spins behind the scenes until one does).',
			kinds: { hotbox: 'Hotbox Spins', super: 'Super Hotbox', munchies: 'The Munchies', big: 'A big win (25× or more)', blank: 'Nothing at all' }
		},
		book: {
			heading: 'Book Of Skedd: pick what happens',
			intro: 'Their next spin is one that has it (the machine plays spins behind the scenes until one does). Their luck also steers the gamble’s card.',
			kinds: { free: 'Free spins', abscar: 'Free spins with Abscar expanding', big: 'A big win (25× or more)', blank: 'Nothing at all' }
		},
		kushburst: {
			heading: 'Kushburst: pick what happens',
			intro: 'Their next spin has it (a leaf or a KUSHBURST from the start; for a big win or nothing the machine plays spins behind the scenes until one is).',
			kinds: { leaf: 'A leaf (respin)', kushburst: 'KUSHBURST (all three leaves)', big: 'A big win (25× or more)', blank: 'Nothing at all' }
		},
		stash: {
			heading: 'Abscar’s Stash: pick what happens',
			intro: 'Their next spin is one that has it (the machine plays spins behind the scenes until one does). Bought bonuses stay random.',
			kinds: { free: 'Sky High Spins', cloud: 'A smoke-cloud win', big: 'A big win (25× or more)', blank: 'Nothing at all' }
		},
		skeddwood: {
			heading: 'Skeddwood: pick what happens',
			intro: 'Their next spin is one that has it (the machine plays spins behind the scenes until one does).',
			kinds: { gold: 'Gold Rush Spins', divergence: 'Divergence Spins', highnoon: 'High Noon', quickdraw: 'Quick Draw', big: 'A big win (25× or more)', blank: 'Nothing at all' }
		},
		roulette: {
			heading: 'Roulette: pick the number',
			intro: 'The ball lands on this number on their next spin.',
			number: (n: number, colour: string) => `${n} ${colour}`
		},
		blackjack: {
			heading: 'Blackjack: the dealer’s cards',
			intro: 'In this order: the up card, the hole card, then what he draws (he stops at 17). Goes into the next hand dealt at the table, for everyone there. The players’ own cards stay random (or follow their luck).',
			presets: { blackjack: 'Dealer blackjack', twenty: 'Dealer 20', bust: 'Dealer busts' },
			add: 'Add a card',
			cards: 'Dealer’s cards',
			removeLast: 'Remove the last card',
			empty: 'No cards picked yet.',
			total: (n: number, bj: boolean) => (bj ? 'Blackjack' : n > 21 ? `${n}: bust` : String(n)),
			thenRandom: 'then random cards until he reaches 17',
			unused: (n: number) => `${n === 1 ? 'the last card isn’t' : `the last ${n} cards aren’t`} used (he stops at 17)`,
			onceLabel: 'Next hand only',
			everyLabel: 'Every hand until I switch it off'
		}
	},
	/** Pranks (shop.ts PRANKS; the 420 pack). */
	pranks: {
		heading: 'Pranks',
		intro: 'Bought once per use. Pick who gets it.',
		names: {
			'smoke-bomb': 'Smoke Bomb',
			'too-high': 'TOO HIGH TO PLAY',
			clown: 'Clown Nose',
			slacker: 'Slacker Sticker',
			mask: 'Gas Mask',
			flip: 'Upside Down',
			burgerhead: 'Burger Head',
			mmmph: 'Mmmph',
			confetti: 'Confetti Bomb'
		},
		what: {
			'smoke-bomb': 'Their operator disappears in thick smoke for an hour.',
			'too-high': 'A big green TOO HIGH TO PLAY stamp on their operator for a day.',
			clown: 'A big red clown nose on their operator for an hour. Honk.',
			slacker: 'The red Slacker sticker on their operator for a day.',
			mask: 'Put it on yourself: for a day no prank sticks to you, and nobody can throw one at you.',
			flip: 'Their operator stands on its head for an hour.',
			burgerhead: 'Their operator’s head turns into a burger with googly eyes for an hour.',
			mmmph: 'For half an hour everything they say on the squad radio comes out as “mmmph mmph”.',
			confetti: 'Confetti explodes all over their page the next time they open it.'
		},
		flipBy: (name: string) => `Turned upside down by ${name}`,
		burgerBy: (name: string) => `Burger-headed by ${name}`,
		mmmphBy: (name: string) => `Gagged by ${name}`,
		/** the radio line shown instead of a gagged member's words */
		mmmph: (n: number) => Array.from({ length: Math.max(2, Math.min(8, Math.round(n / 6))) }, (_, i) => (i % 3 === 1 ? 'mmph' : i % 3 === 2 ? 'mmmmph' : 'mmmph')).join(' ') + '…',
		/** a Confetti Bomb going off on your page */
		confettiGot: (name: string) => `🎉 ${name} confetti-bombed you!`,
		pick: 'Who gets it?',
		throw: (price: number) => `Throw · ${price.toLocaleString('en-US')} 🍔`,
		/** the Gas Mask's button (you put it on yourself) */
		putOn: (price: number) => `Put it on · ${price.toLocaleString('en-US')} 🍔`,
		maskOn: 'You have it on',
		maskPut: 'Gas mask on: no pranks for a day 🛡️',
		/** a squad member in a gas mask (prank dialog, squad card, header) */
		masked: 'Gas mask on',
		maskedLong: (name: string) => `${name} has a gas mask on: no pranks stick for now.`,
		thrown: (name: string) => `Got ${name} 😈`,
		nobody: 'Nobody else in the squad yet.',
		stamp: 'Too high to play',
		smokedBy: (name: string) => `Smoke-bombed by ${name}`,
		highBy: (name: string) => `Stamped TOO HIGH TO PLAY by ${name}`,
		clownBy: (name: string) => `Clown-nosed by ${name}`,
		slackerBy: (name: string) => `Slacker sticker from ${name}`,
		/** the radio line for each prank */
		event: {
			'smoke-bomb': (name: string) => `threw a SMOKE BOMB at ${name} 💨`,
			'too-high': (name: string) => `stamped ${name} TOO HIGH TO PLAY 🍃`,
			clown: (name: string) => `put a clown nose on ${name} 🤡`,
			slacker: (name: string) => `slapped a SLACKER sticker on ${name} 🐌`,
			mask: (_name: string) => `put on a gas mask: no pranks for a day 🛡️`,
			flip: (name: string) => `turned ${name} UPSIDE DOWN 🙃`,
			burgerhead: (name: string) => `gave ${name} a BURGER HEAD 🍔`,
			mmmph: (name: string) => `taped ${name}’s mouth shut: mmmph 🤐`,
			confetti: (name: string) => `planted a CONFETTI BOMB on ${name}’s page 🎉`
		}
	},
	/** BurgiShop (2026-11-16): cosmetics bought with burgers and worn on your header operator (shop.ts). */
	shop: {
		heading: 'BurgiShop',
		/** the shop's own page tab: the line under the heading, and what it says outside a squad */
		sub: 'Cosmetics and pranks for your operator',
		/** the makeover (2026-11-20): the line under the neon sign, the ticker, the kind groups */
		vibe: 'Munchie dispensary · open 24/7 · 420 friendly',
		ticker: [
			'🏷️ A new deal every day',
			'🎁 Munchie Boxes: what will you pull?',
			'👑 Abscar’s Throne: 100,000,000 🍔',
			'🔥 New: Nuke aura',
			'🗿 Golden Statue: one stands at a time',
			'💪 Emotes the whole squad sees',
			'🤡 Clown noses in stock',
			'🛡️ Gas masks: no pranks for a day',
			'💸 High Roller: 10,000,000 🍔',
			'🍔 Every burger spent goes to the house',
			'🌿 Puff puff pass',
			'🎰 Win big, dress bigger'
		],
		groups: { op: 'On your operator', name: 'Name & title', squad: 'Around the squad', show: 'Show-off', special: 'Specials' },
		fittingRoom: 'Fitting room',
		notIn: 'BurgiShop sells with the squad’s burger bank. Join or create a squad in the Squad tab first.',
		intro:'Buy cosmetics with your burgers and wear them on your operator at the top of the page: the whole squad sees them. What you buy is yours to keep; tap an item you own to wear it or take it off.',
		noOp: 'You haven’t picked an operator from the header (Squad tab → Edit), so your look only shows here and on your squad card.',
		preview: 'Your operator',
		tryOn: 'Trying on',
		slots: {
			aura: 'Auras',
			effect: 'Effects',
			badge: 'Pins',
			mouth: 'Mouth',
			eyes: 'Eyes',
			hat: 'Hats',
			smoke: 'Smoke',
			pet: 'Sidekicks',
			back: 'Back',
			emote: 'Emotes',
			name: 'Name styles',
			title: 'Titles',
			card: 'Squad card',
			radio: 'Radio',
			table: 'Blackjack',
			win: 'Win pose',
			maxfx: 'Max effect',
			buddy: 'Buddy',
			entry: 'Entrance',
			trail: 'Trail',
			sound: 'Sounds',
			feed: 'Kill feed',
			shelf: 'Trophy shelf',
			throne: 'Throne',
			/** the Camo Armory's gun in the hands (armory.ts); bought on its own door, not a kind button */
			hold: 'Held gun',
			statue: '🗿 Statue',
			pranks: '😈 Pranks',
			box: '🎁 Munchie Box',
			ad: '📣 Ad space'
		},
		slotsLabel: 'Kind',
		/** on the 420 pack 2's kinds (eyes, hats, smoke, sidekicks) */
		newTag: 'NEW',
		/** a line under the kind buttons, for the kinds that need one */
		slotHint: {
			mouth: 'Swaps out whatever your operator has in their mouth.',
			eyes: 'Sits on your operator’s eyes, over masks, goggles and glasses.',
			hat: 'Sits on your operator’s head (Ingman takes his wizard hat off for it).',
			smoke: 'Colours the smoke from whatever’s in your mouth. Nothing in it? You blow a puff out yourself.',
			pet: 'A little sidekick that sits on your operator’s shoulder.',
			back: 'A rifle on your operator’s back, painted in camo.',
			emote: 'Tap your operator at the top of the page (or your squad card) to play it: the squad sees it for a few seconds.',
			card: 'Your card in the Squad tab wears it, for the whole squad to see.',
			radio: 'Your lines in the squad radio.',
			table: 'Your chips and cards at the blackjack table: everyone at the table sees them.',
			win: 'Your operator dances on the BIG / MEGA WIN screens of both slots.',
			maxfx: 'Plays over a weapon when your tick maxes it (on your page, every theme).',
			buddy: 'Dresses the weed buddy at the top of your page (Abscar theme).',
			entry: 'Your operator makes an entrance at the top of the page when you come online: everyone online sees it.',
			trail: 'Follows your mouse (or finger) around the page. Only on your own page.',
			sound: 'Plays instead of the hitmarker when you tick a camo (turn sound on next to the theme picker).',
			feed: 'Your rows in the kill feed at the top right.',
			shelf: 'A shelf on your squad card with the trophies you’ve earned in the shop.',
			throne: 'The ultimate flex: a golden throne behind your operator, and the title that comes with it.'
		} as Partial<Record<string, string>>,
		/** today's deal (2026-11-21): one item a day, the same for the whole squad */
		deal: {
			heading: 'Today’s deal',
			off: (n: number) => `−${n} %`,
			was: (price: number) => `was ${price.toLocaleString('en-US')}`,
			ends: 'New deal at midnight',
			tryOn: 'Try on',
			badge: 'DEAL'
		},
		/** Munchie Boxes: a random item of a rarity */
		box: {
			intro: 'A random item of the box’s rarity, worn at once. Got it already? Half the box comes back.',
			open: (price: number) => `Open · ${price.toLocaleString('en-US')} 🍔`,
			name: (rarity: string) => `${rarity} box`,
			opening: 'Opening…',
			got: (name: string) => `You got ${name}!`,
			dup: (name: string, back: number) => `${name} again: ${back.toLocaleString('en-US')} 🍔 back.`,
			again: 'Open another',
			close: 'Nice',
			opened: (n: number) => `${n.toLocaleString('en-US')} boxes opened`,
			event: (name: string, price: number) => `pulled ${name} out of a ${price.toLocaleString('en-US')} 🍔 Munchie Box 🎁`
		},
		/** gifts to friends */
		gift: {
			button: '🎁 Gift',
			pick: 'Give it to who?',
			has: 'Has it',
			send: (price: number) => `Give · ${price.toLocaleString('en-US')} 🍔`,
			sent: (item: string, name: string) => `${item} is on its way to ${name} 🎁`,
			got: (from: string, item: string) => `🎁 ${from} gave you ${item}! It’s in your shop.`,
			event: (item: string, name: string) => `gave ${name} ${item} 🎁`,
			nobody: 'Everyone in the squad has it already.'
		},
		/** selling back */
		sell: {
			button: (back: number) => `Sell · +${back.toLocaleString('en-US')} 🍔`,
			ask: (name: string, back: number) => `Sell ${name} for ${back.toLocaleString('en-US')} 🍔? You can buy it again later at the full price.`,
			yes: 'Sell it',
			done: (name: string, back: number) => `${name} sold: +${back.toLocaleString('en-US')} 🍔`,
			no: 'Gifts and rewards can’t be sold.'
		},
		/** three saved outfits */
		fits: {
			heading: 'Outfits',
			slot: (n: number) => `Outfit ${n}`,
			wear: 'Wear',
			save: 'Save',
			saveOver: 'Save over',
			empty: 'Empty',
			saved: (n: number) => `Outfit ${n} saved: what you wear now`,
			worn: (n: number) => `Wearing outfit ${n}`
		},
		/** the ad space on the tickers */
		ad: {
			heading: 'Ad space',
			intro: (hours: number) => `Your own line on the BurgiShop and BurgiCasino tickers for ${hours} hours, for the whole squad to see. The latest ad bought takes the spot.`,
			placeholder: 'Your line (60 characters)',
			buy: (price: number) => `Run it · ${price.toLocaleString('en-US')} 🍔`,
			bought: 'Your ad is running 📣',
			now: (name: string) => `Running now, from ${name}:`,
			none: 'No ad running right now.',
			empty: 'Write something first.',
			label: 'Ad text',
			event: (price: number) => `bought the ad space on the tickers (${price.toLocaleString('en-US')} 🍔) 📣`,
			tag: (name: string) => `📣 ${name}:`
		},
		/** the secret 420 collection reward */
		collector: {
			locked: 'Secret',
			how: (have: number, all: number) => `Own every 420 item to unlock it (${have} of ${all}).`,
			got: '🌿 You own the whole 420 collection: the 420 Legend title and Legend Haze aura are yours!',
			reward: 'Reward'
		},
		/** holiday items */
		holiday: {
			xmas: 'Christmas only',
			newyear: 'New Year only',
			soon: { xmas: 'In the shop 1–26 Dec', newyear: 'In the shop 27 Dec – 3 Jan' } as Record<string, string>
		},
		/** the throne comes with a title */
		grants: (name: string) => `Comes with the “${name}” title.`,
		closed: 'Not in the shop right now.',
		/** the trophy shelf on the squad card */
		trophies: {
			heading: 'Trophies',
			names: {
				spent1m: 'Golden Burger: 1,000,000 🍔 spent',
				spent10m: 'Diamond Burger: 10,000,000 🍔 spent',
				own25: 'Crystal Holk: 25 items owned',
				own50: 'Platinum Holk: 50 items owned',
				c420: '420 Legend: the whole 420 collection',
				gifter: 'Santa Burger: 5 gifts given',
				pranker: 'Prank Master: 10 pranks thrown',
				boxer: 'Box Addict: 10 Munchie Boxes opened',
				statue: 'Statue Builder: put up a Golden Statue',
				throne: 'King of the Hill: Abscar’s Throne'
			} as Record<string, string>,
			none: 'No trophies yet',
			sample: 'Your trophies show up here as you earn them.'
		},
		trailSample: 'Move your mouse here',
		soundSample: 'Play',
		feedSample: 'GOLD',
		/** item card samples for the kinds that aren't drawn on the operator */
		radioSample: 'GG, next round on me 🍔',
		maxSample: 'M4',
		winSample: 'BIG WIN',
		/** the Golden Statue (2026-11-20): one stands in the Squad tab, whoever put one up last */
		statue: {
			name: 'Golden Statue',
			what: 'A big gold statue of your operator at the top of the Squad tab. Only one stands at a time: the next one put up knocks yours down, and you can put yours back up.',
			buy: (price: number) => `Put it up · ${price.toLocaleString('en-US')} 🍔`,
			standing: 'Your statue stands',
			theirs: (name: string) => `${name}’s statue stands right now.`,
			none: 'No statue stands yet.',
			bought: 'Your Golden Statue is up 🗿',
			event: 'put up a GOLDEN STATUE in the Squad tab 🗿',
			label: (name: string) => `Golden statue of ${name}`,
			since: (ago: string) => `Put up ${ago}`
		},
		/** emotes (2026-11-20): tap your operator to play the one you wear */
		emote: {
			tap: (name: string) => `Play your emote: ${name}`,
			played: (name: string) => `${name}! The squad sees it for a few seconds.`
		},
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
	/** The Camo Armory (2026-11-20, armory.ts): weapons in camo, bought in the game's order, held by your operator. */
	armory: {
		heading: 'Camo Armory',
		/** the line under the page heading and on its door */
		sub: 'Camo guns your operator holds',
		door: 'Gold to Orion guns 🍔',
		intro: 'Buy a weapon in a camo and your operator holds it at the top of the page and on your squad card, for the whole squad to see. Very expensive, and only in the game’s order.',
		rulesTitle: 'How it unlocks',
		rules: [
			'Gold: any weapon, any time.',
			'Every camo after that needs the one before it on every weapon in the class: Platinum on an SMG opens once you own Gold on all the SMGs, and so on.',
			'Divergence works like in the game: own Harmonic Break on 33 weapons anywhere, then buy it on any weapon that has Harmonic Break.',
			'Then the Mastery camos: Mercurial Drift, Polyatomic Reforged, Orion Reforged, the same way as Platinum.'
		],
		camosLabel: 'Camo',
		/** the camo buttons */
		/** a camo button: its price short ("2.5M 🍔"), and in words for screen readers */
		short: (n: number) => `${n >= 1_000_000 ? `${n / 1_000_000}M` : n.toLocaleString('en-US')} 🍔`,
		camoLabel: (name: string, price: number, open: boolean, have: number, total: number) =>
			`${name}, ${price.toLocaleString('en-US')} burgers each${open ? '' : ', not open yet'}, ${have} of ${total} owned`,
		preview: 'Your operator',
		trying: (name: string) => `Trying: ${name}`,
		holding: (name: string) => `Holding: ${name}`,
		nothing: 'Holds nothing yet. Tap a gun’s picture to try it.',
		putDown: 'Put it down',
		spent: (n: number) => `${n.toLocaleString('en-US')} 🍔 spent in the Camo Armory · it goes to the house (Abscar)`,
		/** a class heading: how many of its weapons you own in the camo shown */
		classCount: (camo: string, have: number, total: number) => `${camo} ${have} / ${total}`,
		/** why a camo isn't open yet */
		needClass: (next: string, camo: string, total: number, cls: string, left: number) => `${next} opens here when all ${total} ${cls} have ${camo}: ${left} to go.`,
		needClassShort: (camo: string, left: number) => `🔒 ${camo} on ${left} more`,
		needCount: (left: number, need: number) => `🔒 Harmonic Break on ${left} more weapon${left === 1 ? '' : 's'} (${need} needed)`,
		needWeapon: (camo: string) => `🔒 ${camo} on this one first`,
		divNote: (have: number, need: number) => `Harmonic Break on ${have} of the ${need} weapons Divergence needs.`,
		divOpen: 'Divergence is open: buy it on any weapon that has Harmonic Break.',
		buy: (n: number) => `Buy · ${n.toLocaleString('en-US')} 🍔`,
		confirm: (name: string, n: number) => `Buy ${name} for ${n.toLocaleString('en-US')} 🍔?`,
		yes: 'Buy it',
		cancel: 'Cancel',
		hold: 'Hold it',
		held: 'Holding',
		owned: 'Owned',
		bought: (name: string) => `${name} is yours and in your operator’s hands 🔫`,
		heldNow: (name: string) => `Your operator holds the ${name}`,
		down: 'Gun put down',
		broke: (price: number, have: number) => `${price.toLocaleString('en-US')} 🍔 needed, you have ${have.toLocaleString('en-US')}.`,
		locked: 'Not open yet: buy the camo before it first.',
		cardLabel: (name: string, state: string) => `${name}: ${state}`,
		event: (name: string, price: number) => `bought a ${name} for ${price.toLocaleString('en-US')} 🍔 in the Camo Armory 🔫`,
		eventClass: (camo: string, cls: string) => `owns all the ${cls} in ${camo} now 🔫✨`
	},
	/** BurgiCasino (2026-11-16): the daily burger bonus, Abscar's Fortune (the Burger Bandit slot), roulette, blackjack. */
	casino: {
		heading: 'BurgiCasino',
		sub: 'Abscar’s Fortune · Mybots 5 · Book Of Skedd · Kushburst · Abscar’s Stash · Skeddwood · Roulette · Blackjack · BurgiBank · Donations',
		note: 'Pretend burgers from the squad’s burger bank: no real money, nothing to buy, nothing to cash out.',
		balance: 'Your burgers',
		notIn: 'BurgiCasino plays with the squad’s burger bank. Join or create a squad in the Squad tab first.',
		toSquad: 'Go to the Squad tab',
		games: { slots: 'Abscar’s Fortune', slotsSub: 'Burger Bandit', fortune2: 'Mybots 5', book: 'Book Of Skedd', kushburst: 'Kushburst', stash: 'Abscar’s Stash', skeddwood: 'Skeddwood', roulette: 'Roulette', blackjack: 'Blackjack', bank: 'BurgiBank', donate: 'Donations', admin: 'Admin' },
		gamesLabel: 'Game',
		/** The BurgiBank tab (2026-11-16): loans, the house and Abscar's admin menu under a big bank. */
		bank: {
			line: 'Borrow burgers here and see what the house has taken.',
			balance: (n: number) => `Your burgers: ${n.toLocaleString('en-US')} 🍔`
		},
		how: 'How it works',
		burgers: (n: number) => `${n.toLocaleString('en-US')} 🍔`,
		broke: 'Not enough burgers for that bet. Come back tomorrow for your daily bonus, or tick some camos.',
		bonus: {
			heading: 'Daily bonus',
			line: (n: number, rate: number, toNext: number, nextRate: number) =>
				`Day ${n} online: ${rate.toLocaleString('en-US')} 🍔 a day. ${toNext === 1 ? 'Tomorrow' : `In ${toNext} days`} it goes up to ${nextRate.toLocaleString('en-US')} 🍔.`,
			none: 'Open the page on a day with the squad and you get 2,500 🍔. Every 5 days online it goes up by 2,500.',
			toast: (n: number, day: number) => `Daily bonus: +${n.toLocaleString('en-US')} 🍔 (day ${day} online)`,
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
		/** Karma luck on the slot machines (2026-11-20, the user: "baserat på hur mycket karma man fått för att man
		 *  donerat burgare så ska man få mer och mer tur på slotsen"; casino-rig.ts karmaLuck). */
		karmaLuck: {
			heading: 'Karma luck',
			value: (n: number) => `+${n}`,
			on: (hearts: number) => `Your ${hearts.toLocaleString('en-US')} ❤️ from giving burgers away make every slot machine kinder to you.`,
			none: 'Give burgers away in BurgiGives and every slot machine gets kinder to you.',
			chance: (pct: number) => `${pct} % of your spins get a hidden second try, and the better one counts.`,
			next: (need: number, luck: number) => `${need.toLocaleString('en-US')} ❤️ more for +${luck}`,
			top: 'Top karma: the most luck there is',
			steps: (step: number, steps: number) => `Karma step ${step} of ${steps}`,
			how: (perStep: number, max: number) =>
				`1 ❤️ for every 1,000 🍔 you give, +10 ❤️ for each cause you give 1,000 🍔 or more. Each step adds +${perStep} on all the slot machines (not roulette or blackjack), up to +${max}. Spending hearts in KarmaShop never lowers it.`,
			give: 'Give burgers'
		},
		board: {
			heading: 'Casino leaderboard',
			none: 'Nobody has played yet.',
			row: (net: string, games: number) => `${net} 🍔 · ${games} game${games === 1 ? '' : 's'}`
		},
		/** The casino floor around the games (2026-11-20, the user: "lots of dopamine and fun things on the screen"). */
		floor: {
			ticker: 'Squad wins on the casino floor',
			biggest: 'Biggest win',
			biggestSub: 'this week',
			noBiggest: 'Jackpot up for grabs',
			promo: ['Six slot machines, real odds, real tension', 'Your daily bonus lands every day you’re online', 'Abscar is the house: the house always eats', 'Hit something big and the whole squad sees it here'],
			ago: (min: number) => (min < 1 ? 'just now' : min < 60 ? `${min} min ago` : min < 1440 ? `${Math.floor(min / 60)} h ago` : `${Math.floor(min / 1440)} d ago`),
			hot: 'HOT',
			hotLabel: 'Most wins in the squad today',
			hotParty: 'The hottest machine on the floor',
			gain: (n: number) => `+${n.toLocaleString('en-US')}`,
			games: (n: number) => `${n.toLocaleString('en-US')} game${n === 1 ? '' : 's'}`,
			place: (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`),
			emptySeat: 'Free spot',
			meter: (done: number, every: number) => `Day ${done} of ${every}`,
			meterNext: (rate: number) => `then ${rate.toLocaleString('en-US')} 🍔 a day`
		},
		event: {
			slots: (net: number, tier: string) => `${tier === 'jackpot' ? 'hit the BURGER JACKPOT' : tier === 'mega' ? 'hit a MEGA WIN' : tier === 'big' ? 'hit a BIG WIN' : 'won'} on Abscar’s Fortune: +${net.toLocaleString('en-US')} 🍔 🎰`,
			fortune2: (net: number, tier: string) => `${tier === 'epic' ? 'got an EPIC MUNCH' : tier === 'mega' ? 'hit a MEGA WIN' : 'hit a BIG WIN'} on Mybots 5: +${net.toLocaleString('en-US')} 🍔 🍟`,
			book: (net: number, tier: string) => `hit ${tier === 'epic' ? 'an EPIC WIN' : tier === 'mega' ? 'a MEGA WIN' : 'a BIG WIN'} on Book Of Skedd: +${net.toLocaleString('en-US')} 🍔 📖`,
			bookGamble: (n: number, steps: number) => `gambled ${steps} time${steps === 1 ? '' : 's'} on Book Of Skedd and collected ${n.toLocaleString('en-US')} 🍔 🃏`,
			kushburst: (net: number, tier: string) => `${tier === 'kushburst' ? 'hit a KUSHBURST' : tier === 'mega' ? 'hit a MEGA WIN' : 'hit a BIG WIN'} on Kushburst: +${net.toLocaleString('en-US')} 🍔 🍃`,
			stash: (net: number, tier: string) => `${tier === 'epic' ? 'got SKY HIGH' : tier === 'mega' ? 'hit a MEGA WIN' : 'hit a BIG WIN'} on Abscar’s Stash: +${net.toLocaleString('en-US')} 🍔 💨`,
			skeddwood: (net: number, tier: string) => `${tier === 'legend' ? 'collected a LEGENDARY BOUNTY' : tier === 'mega' ? 'hit a MEGA WIN' : 'hit a BIG WIN'} on Skeddwood: +${net.toLocaleString('en-US')} 🍔 🤠`,
			roulette: (net: number, n: number, color: string) => `${net > 0 ? `won ${net.toLocaleString('en-US')}` : `lost ${(-net).toLocaleString('en-US')}`} 🍔 on roulette (${n} ${color}) 🎡`,
			blackjack: (net: number, bj: boolean) => (bj ? `hit BLACKJACK: +${net.toLocaleString('en-US')} 🍔 🃏` : `${net > 0 ? `won ${net.toLocaleString('en-US')}` : `lost ${(-net).toLocaleString('en-US')}`} 🍔 at blackjack 🃏`),
			bjSide: (bet: string, kind: string, net: number) => `hit a ${kind.toUpperCase()} on ${bet} at blackjack: +${net.toLocaleString('en-US')} 🍔 🃏`
		},
		bet: 'Bet',
		betLabel: (n: number) => `Bet ${n.toLocaleString('en-US')} burgers`,
		/** Auto spin on every slot machine (2026-11-21, the user: "höj autospinsen … på alla slotsen", then "ba lägg till 1000"). */
		autoSpin: {
			label: 'Auto spin',
			start: (n: number) => `Auto · ${n.toLocaleString('en-US')}`,
			stop: (n: number) => `Stop · ${n.toLocaleString('en-US')} left`,
			count: (n: number) => `${n.toLocaleString('en-US')} auto spins`,
			done: 'Auto spins done.'
		},
		slots: {
			spin: 'Spin',
			credits: 'Burgers',
			pull: 'Pull the lever',
			spinning: 'Spinning…',
			lines: '10 lines',
			free: (left: number, total: number) => `FREE SPIN ${total - left + 1} / ${total} · sticky WILDs`,
			freeWon: (n: number) => `${n} FREE SPINS!`,
			/** free spins (2026-11-16, the user's "add free spins and bonus"): the marquee turns into the counter */
			freeTitle: (n: number, total: number) => `Free spin ${n} / ${total}`,
			freeSub: (won: number) => `Sticky WILDs · ${won.toLocaleString('en-US')} 🍔 so far`,
			freeIntro: (n: number) => `${n} FREE SPINS`,
			freeIntroSub: 'WILDs stick until the free spins end, and random WILDs drop in and stick too',
			/** sticky WILDs + weed multipliers (2026-11-16, the user: "sticky wilds in the free spins, and special weed symbols that give ×2, ×5, ×10 and so on") */
			sticky: (n: number) => (n === 1 ? 'A WILD sticks!' : `${n} WILDs stick!`),
			stickyTag: 'STICKY',
			weedWin: (x: number, raw: number, win: number) => `Weeds ×${x}: ${raw.toLocaleString('en-US')} → ${win.toLocaleString('en-US')} 🍔`,
			weedLabel: (x: number) => `weed ×${x}`,
			weedRow: 'Every weed on a winning screen adds up and multiplies its win (lines + ketchup), ×2 up to ×100. In normal spins only on reel 3, in free spins on every reel.',
			/** the extras left from the party odds (2026-11-19), rare since the normal odds (2026-11-21) */
			randomWilds: (n: number) => (n === 1 ? 'A random WILD drops in!' : `${n} random WILDs drop in!`),
			fullScreen: (symbol: string) => `FULL SCREEN: ${symbol}!`,
			fullWin: (symbol: string, win: number) => `FULL SCREEN: ${symbol}! All 10 lines = ${win.toLocaleString('en-US')} 🍔`,
			partyNote: 'Rare extras: now and then random WILDs drop onto reels 2–4 (in free spins they stick), and once in a long while the whole screen turns into one symbol (FULL SCREEN, all 10 lines pay five in a row); a screen full of WILDs is the BURGER JACKPOT.',
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
			buyNote: (free: number, box: number, wheel: number) => `Prices are times your bet: free spins ${free}×, Burger Box ${box}×, wheel ${wheel}×. They give back about as much as spinning (a little less than the price, like a real casino).`,
			lastWin: 'Win',
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', jackpot: 'BURGER JACKPOT' },
			lineWin: (line: number, count: number, symbol: string, win: number) => `Line ${line}: ${count} × ${symbol} = ${win} 🍔`,
			scatterWin: (count: number, win: number, spins: number) => `${count} × Ketchup = ${win} 🍔 + ${spins} free spins`,
			noWin: 'No win this time.',
			paytable: 'Paytable & how it works',
			how: 'Like a real video slot: 5 reels, 3 rows and 10 paylines. Each reel is a weighted strip, so pickles are common and burgers rare; every stop is equally likely (no near-miss tricks). Wins pay left to right from the first reel, 2, 3, 4 or 5 in a row, times your bet ÷ 10, the best win per line. WILD stands in for every paying symbol and pays the most itself. Ketchup pays anywhere on the screen and 3 or more give free spins (they can come again): every WILD that lands in them sticks where it is until they end (WILDs only land on reels 2, 3 and 4 there), random WILDs now and then drop in and stick too, and weeds land on every reel. A weed carries a multiplier from ×2 up to ×100; when a spin wins, all the weeds on the screen add up and multiply its win. In normal spins weeds land only on reel 3. A BONUS box on each of reels 1, 3 and 5 opens the Burger Box: open boxes for burgers until one says COLLECT. A wheel on each of reels 2, 3 and 4 spins the bonus wheel: burgers, free spins or the jackpot. Both can come in free spins too. Or buy free spins, the Burger Box or a wheel spin straight away. Everything is decided the moment you pay; which box you tap only changes the order. This machine runs on normal odds: in the long run it gives back about 98 % of what goes in, and about a quarter of spins win. Pretend burgers, never money.',
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
		/** Kushburst, the expanding-leaf slot (2026-11-20, the user: "another slot like Starburst, a fun name for Abscar's version, weed leaves instead of stars") */
		kushburst: {
			sub: 'Pays both ways · 10 lines',
			spin: 'Spin',
			credits: 'Burgers',
			lastWin: 'Win',
			spinning: 'Spinning…',
			respinning: (n: number) => `Respin ${n}: the leaves hold, the rest spin again…`,
			respinPop: 'RESPIN!',
			respinTitle: (n: number) => `Respin ${n}`,
			respinSub: (leaves: number) => `${leaves} leaf reel${leaves === 1 ? '' : 's'} held`,
			rainPop: (n: number) => (n === 1 ? 'LEAF RAIN!' : `LEAF RAIN ×${n}!`),
			grows: (n: number) => (n === 1 ? 'A leaf grows over its reel: respin!' : `${n} leaves grow over their reels: respin!`),
			burstPop: (x: number) => `KUSHBURST ×${x}`,
			burstWin: (x: number) => `KUSHBURST! Every win ×${x}`,
			lineWin: (line: number, dir: string, count: number, symbol: string, win: number) => `Line ${line} ${dir} ${count} × ${symbol} = ${win.toLocaleString('en-US')} 🍔`,
			/** which way a line win reads: from the left reel, from the right reel, five in a row */
			dirs: { left: '▶', right: '◀', both: '◀▶' },
			manyLines: (n: number, win: number) => `${n} line wins = ${win.toLocaleString('en-US')} 🍔`,
			noWin: 'No win this time.',
			total: (respins: number) => (respins ? `Total with ${respins} respin${respins === 1 ? '' : 's'}` : 'Total'),
			maxWin: (x: number) => `MAX WIN: ${x.toLocaleString('en-US')}× your bet`,
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', kushburst: 'KUSHBURST!' },
			buy: 'Buy',
			buyKinds: { leaf: 'Spin with a leaf', burst: 'KUSHBURST spin' },
			buyWhat: { leaf: 'a spin that starts with a leaf', burst: 'a spin that starts as a KUSHBURST' },
			buyPrice: (n: number) => `${n.toLocaleString('en-US')} 🍔`,
			buyAsk: (what: string, price: number) => `Buy ${what} for ${price.toLocaleString('en-US')} 🍔?`,
			buyYes: 'Buy',
			buyNo: 'Cancel',
			reelLabel: (r: number, symbols: string) => `Reel ${r}: ${symbols}`,
			reelLeaf: (r: number) => `Reel ${r}: a leaf over the whole reel (WILD)`,
			symbols: { lighter: 'Lighter', grinder: 'Grinder', papers: 'Rolling papers', brownie: 'Space brownie', bong: 'Bong', holk: 'Holk', x420: '420', leaf: 'Leaf (WILD)' },
			paytable: 'Paytable & how it works',
			how: 'A neon slot in the classic expanding-wild style: 5 reels, 3 rows and 10 paylines that pay both ways, from the left reel and from the right. Each reel is a weighted strip (lighters are common, 420s rare) and every stop is equally likely (no near-miss tricks). The leaf is the WILD: it lands only on reels 2, 3 and 4, grows over the whole reel and stays there while the other reels spin again for free (a respin). A new leaf in a respin grows too and gives one more respin, up to three. Leaves on all three middle reels at once = KUSHBURST: every win on that screen ×3. Everything is decided the moment you pay. This machine runs on normal odds: in the long run it gives back about 97 % of what goes in, and about a quarter of spins win. Pretend burgers, never money.',
			leafRow: 'Lands on reels 2, 3 and 4 only. Grows over its reel, stands in for every symbol and holds while the other reels respin. Up to 3 respins.',
			payRow: (a: number, b: number, c: number) => `3 → ${a} · 4 → ${b} · 5 → ${c}`,
			payNote: 'Wins are times the line bet (your bet ÷ 10), on each of the 10 lines from the left reel and from the right reel; five in a row pays once.',
			burstNote: (x: number) => `KUSHBURST: leaves on all three middle reels at once, and every win on that screen pays ×${x} (the respin after it too).`,
			rainNote: (every: number) => `Leaf rain: about 1 spin in ${every.toLocaleString('en-US')} gets one to three leaves blown onto the middle reels.`,
			buyNote: (leaf: number, burst: number) => `Buy prices are times your bet: a spin with a leaf ${leaf}×, a KUSHBURST spin ${burst}×. They give back about as much as spinning (a little less than the price, like a real casino).`,
			maxNote: (x: number) => `One play (a spin with its respins) pays at most ${x.toLocaleString('en-US')}× your bet.`
		},
		/** Abscar's Fortune II, the Munchie Squad (2026-11-19, the user: "a new Abscar's Fortune like Pirots 5, our own symbols, crazy bonuses and free spins") */
		/** Mybots 5 (called Abscar's Fortune II until 2026-11-20), the Munchie Squad (2026-11-19, the user: "a new Abscar's Fortune like Pirots 5, our own symbols, crazy bonuses and free spins") */
		fortune2: {
			sub: 'Munchie Squad',
			spin: 'Spin',
			credits: 'Burgers',
			lastWin: 'Win',
			spinning: 'The squad is munching…',
			noWin: 'Nothing munched this time.',
			crumbs: 'Only crumbs this time (less than half a burger).',
			spinWon: (n: string, ketchups: number) => `Munched ${n} 🍔${ketchups ? ` · ${ketchups} ketchup${ketchups === 1 ? '' : 's'} on the board` : ''}`,
			won: (n: number) => `Win: ${n.toLocaleString('en-US')} 🍔`,
			boardLabel: (size: number, levels: string, ketchups: number) => `The board, ${size} × ${size}. ${levels}. Ketchups on the board: ${ketchups} of 3.`,
			crew: { phil: 'Phillestar', lars: 'Drängen Lars Åke', jeeven: 'Da Jeeven', ingman: 'Ingman' },
			items: { phil: 'Burgers', lars: 'Beer', jeeven: 'Energy drinks', ingman: 'Purple buds' },
			levels: 'The squad',
			levelLabel: (name: string, item: string, level: number, each: string) => `${name}: ${item}, level ${level}, ${each} 🍔 each`,
			lv: 'LV',
			each: (n: string) => `${n} 🍔 each`,
			letters: 'Collect M-U-N-C-H',
			lettersLabel: (got: string) => `Letters collected: ${got || 'none'}`,
			meter: 'Abscar’s holk',
			meterLabel: (n: number, max: number) => `Abscar’s holk meter: ${n} of ${max}`,
			ketchup: 'Ketchup',
			hotbox: 'Hotbox',
			pops: {
				level: (n: number) => `LEVEL ${n}!`,
				swap: 'SMOKE SWAP!',
				grow: (n: number) => `WALL DOWN! ${n}×${n}`,
				drop: 'ABSCAR DROPS IN!',
				mult: (n: number) => `HOTBOX ×${n}`,
				munchies: 'THE MUNCHIES!',
				storm: (name: string) => `MUNCHIE STORM! ALL ${name.toUpperCase()}`
			},
			/** Abscar's holk meter fills: the giant holk over the machine, then sticky WILDs all over the board */
			holk: {
				title: 'THE BIG HOLK',
				sub: (n: number) => (n === 1 ? '1 sticky WILD lands!' : `${n} sticky WILDs land!`)
			},
			free: {
				intro: { hotbox: 'HOTBOX SPINS', super: 'SUPER HOTBOX' },
				introSub: {
					hotbox: (n: number) => `${n} free spins. Abscar drops WILDs next to the squad on every spin, and everything carries over: levels only go up, the field only grows, sticky WILDs stay put, and every time his holk fills up the big holk lands more of them and the room gets smokier: +1 to the multiplier.`,
					super: (n: number) => `${n} free spins on the full 8 × 8, every level at least 3, starting at ×2. Everything carries over.`
				},
				title: (n: number, total: number) => `Hotbox spin ${n} / ${total}`,
				sub: (mult: number, won: number) => `×${mult} · ${won.toLocaleString('en-US')} 🍔 so far`,
				more: (n: number) => `+${n} FREE SPINS!`,
				outro: 'HOTBOX WON',
				outroSub: (n: number) => `${n} free spins played`
			},
			munch: {
				title: 'THE MUNCHIES',
				short: 'Every new coin gives 3 respins again. SQUAD coins take their row and column, ×2 / ×3 multiply it all, a full board doubles it.',
				respins: (n: number) => `Respins left: ${n}`,
				coins: (n: string) => `${n} 🍔 in coins`,
				full: 'FULL BOARD ×2',
				won: 'MUNCHIES WON',
				squad: 'SQUAD',
				cell: (i: number, what: string) => `Cell ${i}: ${what}`,
				empty: 'empty',
				coinLabel: (n: string) => `${n} burgers`,
				multLabel: (x: number) => `×${x} coin`,
				squadLabel: (n: string) => `squad coin, ${n} burgers`
			},
			continue: 'Continue',
			skip: 'Skip',
			skipLabel: 'Skip to the result',
			turbo: 'Turbo',
			buy: 'Buy bonus',
			buyKinds: { hotbox: 'Hotbox Spins', super: 'Super Hotbox', munchies: 'The Munchies' },
			buyWhat: { hotbox: (n: number) => `${n} Hotbox Spins`, super: (n: number) => `${n} Super Hotbox spins`, munchies: 'The Munchies coin game' },
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', epic: 'EPIC MUNCH' },
			maxWin: (x: number) => `MAX WIN: ${x.toLocaleString('en-US')}× your bet`,
			paytable: 'Paytable & how it works',
			how: 'A collector slot, our own take: the board is 6 × 6 inside a walled 8 × 8. Four of the squad stand on it, each with a munchie of their own: Phillestar takes burgers, Drängen Lars Åke beer, Da Jeeven energy drinks and Ingman purple buds. One after another they walk to a neighbouring cell (up, down, left or right) that holds their own munchie, a WILD or a feature, take it and go on until nothing next to them is theirs. They look ahead and head for the biggest patch of things they can take, so nobody walks into a dead end with a pile on the other side. Then everything falls down into the holes (the squad stays where it stands), new munchies drop in from the top, and they walk again, until nobody can move. Every munchie pays by its colour’s level, 1 to 7. Ketchup can’t be taken: 3 on the board when the spin ends start the free spins.',
			levelTable: 'What one munchie pays at your bet, by level',
			features: {
				wild: 'Anybody can take it: counts as their own munchie.',
				up: 'Supersize: whoever takes it goes up a level (max 7), so all their munchies pay more.',
				swap: 'Smoke swap: every munchie of another colour on the board turns into the taker’s.',
				coin: 'Burger coin: its burgers at once.',
				frag: 'Frag: blows up the 3 × 3 round it and pays everything in it (a frag in the blast goes off too), and blows a wall open: the field grows to 7 × 7, then 8 × 8.',
				letter: 'M-U-N-C-H: take all five letters in one spin (in free spins they add up over the spins) and THE MUNCHIES coin game starts.',
				ketchup: '3 on the board when a spin ends = 10 Hotbox Spins, 4 or more = Super Hotbox. In free spins 3 give 3 more spins, 4 give 5.'
			},
			meterNote: (max: number, wilds: number, free: number) =>
				`Abscar’s holk meter: every munchie taken fills it; at ${max} comes THE BIG HOLK: a giant holk smokes out the whole machine and ${wilds} sticky WILDs land all over the board (${free} in free spins). A sticky WILD stays in its cell (everything falls past it) until somebody takes it.`,
			freeNote: (max: number) =>
				`Hotbox Spins start from where the spin ended and keep everything: levels only go up, the field only grows, letters and the holk meter carry over, sticky WILDs nobody took stay put into the next spin, Abscar drops 2 WILDs next to the squad on every spin, and every time the holk meter fills up the Hotbox multiplier goes up by 1 (up to ×${max}) and multiplies every burger taken. Super Hotbox starts on the full 8 × 8 with every level at least 3, at ×2.`,
			partyNote: 'Rare extras: now and then Abscar drops a WILD into a normal spin, and once in a long while a MUNCHIE STORM turns every munchie on the board into one squad member’s.',
			munchNote: 'The Munchies: burger coins land on a 6 × 6 board with the squad in the corners and stay; 3 respins, and every new coin gives 3 again. ×2 / ×3 coins add up into one multiplier for the end, SQUAD coins take the value of every coin in their row and column, and a full board doubles everything.',
			buyNote: (h: number, s: number, m: number) => `Buy bonus prices are times your bet: Hotbox Spins ${h}×, Super Hotbox ${s}×, The Munchies ${m}×. They give back about the same share as spinning.`,
			rtpNote: 'Hotbox Spins come about once every 150 spins and The Munchies about once every 380. Normal odds: in the long run it gives back about 98 % of what goes in. Pretend burgers, never money.',
			maxNote: (x: number) => `One play (a spin with everything it starts, or a bought bonus) pays at most ${x.toLocaleString('en-US')}× your bet.`
		},
		/** Book Of Skedd (book.ts, CasinoBook.svelte; 2026-11-20, the user: "a slot like Book Of Dead called Book Of Skedd, a cannabis leaf on the book, the bonus working the same, and gamble") */
		book: {
			sub: 'Expanding symbol · Gamble',
			spin: 'Spin',
			credits: 'Burgers',
			lastWin: 'Win',
			lines: 'Lines',
			linesLabel: (n: number) => `${n} line${n === 1 ? '' : 's'} played`,
			perLine: (n: number) => `${n.toLocaleString('en-US')} a line`,
			betLabel: (bet: number, perLine: number) => `Bet ${bet.toLocaleString('en-US')} burgers (${perLine.toLocaleString('en-US')} a line)`,
			spinning: 'Spinning…',
			noWin: 'No win this time.',
			lineWin: (line: number, count: number, symbol: string, win: number) => `Line ${line}: ${count} × ${symbol} = ${win.toLocaleString('en-US')} 🍔`,
			bookWin: (count: number, win: number, spins: number) => `${count} × Book = ${win.toLocaleString('en-US')} 🍔 + ${spins} free spins`,
			/** free spins: the book opens on the special symbol */
			bookOpens: 'The book opens…',
			special: 'Special symbol',
			specialPick: (symbol: string, need: number) => `${symbol} spreads over whole reels in the free spins (from ${need} reels, on every line you play)`,
			freeIntro: (n: number) => `${n} FREE SPINS`,
			freeTitle: (n: number, total: number) => `Free spin ${n} / ${total}`,
			freeSub: (symbol: string, won: number) => `${symbol} expands · ${won.toLocaleString('en-US')} 🍔 so far`,
			expandWin: (symbol: string, reels: number, win: number) => `${symbol} expands on ${reels} reels = ${win.toLocaleString('en-US')} 🍔`,
			freeMore: (n: number) => `+${n} FREE SPINS!`,
			freeOutro: 'FREE SPINS WON',
			freeOutroSub: (n: number) => `${n} free spins played`,
			continue: 'Continue',
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', epic: 'EPIC WIN' },
			maxWin: (x: number) => `MAX WIN: ${x.toLocaleString('en-US')}× your bet`,
			/** the gamble */
			gambleOffer: (n: number) => `Gamble ${n.toLocaleString('en-US')} 🍔`,
			gambleTitle: 'Gamble',
			gambleHelp: 'Guess the card: the right colour doubles your win, the right suit gives you 4 times it. A wrong guess loses it.',
			gambleAmount: 'At stake',
			colourWin: 'Colour pays',
			suitWin: 'Suit pays',
			red: 'Red',
			black: 'Black',
			suits: { H: 'Hearts', D: 'Diamonds', C: 'Clubs', S: 'Spades' },
			collect: 'Collect',
			gamblesLeft: (n: number) => `Gambles left: ${n}`,
			history: 'Last cards',
			cardBack: 'Face-down card',
			cardIs: (rank: string, suit: string) => `${rank} of ${suit}`,
			gambleRight: (n: number) => `Right! ${n.toLocaleString('en-US')} 🍔`,
			gambleWrong: 'Wrong card: the win is gone.',
			collected: (n: number) => `Collected ${n.toLocaleString('en-US')} 🍔`,
			gambleLimit: (x: number) => `The gamble closes once it would pay over ${x}× your bet.`,
			paytable: 'Paytable & how it works',
			how: 'A classic book slot: 5 reels, 3 rows and up to 10 paylines (pick how many with LINES; your bet = the bet per line × the lines). Wins pay left to right from the first reel, the best win per line: the four big symbols from 2 in a row, the letters from 3. THE BOOK stands in for every symbol on the lines, and 3 or more anywhere pay times your whole bet and give 10 free spins. Before they start the book opens on a special symbol, picked at random from the other nine. In every free spin, once the normal wins are paid, the special symbol spreads over each whole reel it’s on when it’s on enough reels to win (2 for the big symbols, 3 for the letters), and pays again on every line you play, even when those reels aren’t next to each other. 3 books in the free spins give 10 more with the same symbol. After a win you can gamble it on a face-down card: the colour doubles it, the suit gives 4 times it; up to 5 times in a row, or collect. Everything in a spin is decided the moment you pay. Pretend burgers, never money.',
			symbols: {
				ten: '10',
				jack: 'Jack',
				queen: 'Queen',
				king: 'King',
				ace: 'Ace',
				lighter: 'Rasta lighter',
				grinder: 'Grinder',
				bong: 'Golden bong',
				abscar: 'Abscar',
				book: 'The Book of Skedd'
			},
			payRow: (two: number, three: number, four: number, five: number) => `${two ? `2 → ${two} · ` : ''}3 → ${three} · 4 → ${four} · 5 → ${five}`,
			bookRow: (a: number, b: number, c: number, spins: number) => `WILD on the lines and scatter: 3 → ${a}× bet · 4 → ${b}× · 5 → ${c}×, + ${spins} free spins`,
			payNote: 'Line wins are times the bet per line. The spreading symbol pays its line win on every line you play.',
			gambleNote: (steps: number, limit: number) => `Gamble: at most ${steps} times in a row, and only while what it would pay is at most ${limit}× your bet. A fair card from a full deck.`,
			oddsNote: (x: number) => `Real odds like the real thing: in the long run it gives back about 96 % of what goes in. Free spins come about once every 200 spins, and that’s where the big wins are. One spin with its free spins pays at most ${x.toLocaleString('en-US')}× your bet.`,
			reelLabel: (r: number, symbols: string) => `Reel ${r}: ${symbols}`
		},
		/** Abscar's Stash, the tumble slot (2026-11-20, the user: "a slot that works like 'sweet bonanza', an Abscar-friendly name, drugs instead of sweets") */
		stash: {
			sub: 'Tumble till you’re high',
			spin: 'Spin',
			credits: 'Burgers',
			lastWin: 'Win',
			tumbleWin: 'Tumble win',
			holks: 'Holks',
			clouds: 'Clouds',
			spinning: 'Tumbling…',
			noWin: 'Nothing this time.',
			winLine: (count: number, sym: string, n: string) => `${count} × ${sym} = ${n} 🍔`,
			spinWon: (n: string, tumbles: number) => `Win: ${n} 🍔${tumbles > 1 ? ` · ${tumbles} tumbles` : ''}`,
			cloudWin: (x: number, raw: string, win: string) => `Smoke clouds ×${x}: ${raw} → ${win} 🍔`,
			holkWin: (n: number, pay: string, spins: number) => `${n} HOLKS: +${pay} 🍔 and ${spins} SKY HIGH SPINS!`,
			holkMore: (n: number, spins: number) => `${n} HOLKS: +${spins} SKY HIGH SPINS!`,
			won: (n: string) => `Win: ${n} 🍔`,
			betAnte: (cost: number) => `Bet · pays ${cost.toLocaleString('en-US')}`,
			boardLabel: (what: string) => `The screen, 6 reels × 5 rows: ${what || 'empty'}.`,
			countLabel: (n: number, sym: string) => `${n} × ${sym}`,
			cloudsLabel: (x: number) => `smoke clouds worth ×${x} together`,
			symbols: {
				bud: 'Bud',
				shroom: 'Shroom',
				brownie: 'Brownie',
				tab: 'Acid tab',
				lean: 'Lean',
				blue: 'Blue star',
				green: 'Green leaf',
				purple: 'Purple bolt',
				heart: 'Red heart',
				holk: 'THE HOLK',
				cloud: 'Smoke cloud'
			},
			free: {
				title: (n: number, total: number) => `Sky High Spin ${n} / ${total}`,
				sub: (won: string) => `${won} 🍔 so far`,
				intro: { free: 'SKY HIGH SPINS', super: 'SUPER SKY HIGH' },
				introSub: {
					free: (n: number) => `${n} spins. Smoke clouds land far more often, and every cloud on a winning screen multiplies its win.`,
					super: (n: number) => `${n} spins, and every smoke cloud is worth at least ×10.`
				},
				more: (n: number) => `+${n} SKY HIGH SPINS!`,
				outro: 'SKY HIGH SPINS WON',
				outroSub: (n: number) => `${n} spins played`
			},
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', epic: 'SKY HIGH!' },
			ante: 'Double chance',
			anteOn: 'on',
			anteOff: 'off',
			anteHelp: (cost: number) => `Holks land more often (Sky High Spins about twice as often). A spin then costs ${cost.toLocaleString('en-US')} 🍔 (+25 %); buying a bonus is off.`,
			buyKinds: { free: 'Sky High Spins', super: 'Super Sky High' },
			buyWhat: { free: (n: number) => `${n} Sky High Spins`, super: (n: number) => `${n} Super Sky High spins (every cloud ×10 or more)` },
			buyOff: 'switch Double chance off to buy',
			turbo: 'Turbo',
			skip: 'Skip',
			skipLabel: 'Skip to the result',
			how: 'A tumble slot, our own take: 6 reels and 5 rows, and there are no lines: 8 or more of one symbol ANYWHERE on the screen pay (10 or more pay more, 12 or more the most). The winning symbols go up in smoke, everything above falls down, new symbols drop in from the top, and it goes on as long as something wins. THE HOLK (Abscar’s golden cone joint, at most one per reel) pays and starts SKY HIGH SPINS when 4 or more are on the screen as the tumbling stops; 3 or more in them give 5 more. Smoke clouds carry a multiplier from ×2 up to ×100 and never tumble away: when a spin’s tumbling stops with a win, every cloud on the screen adds up and multiplies the tumble win. They come now and then in normal spins and far more often in Sky High Spins. Everything is decided the moment you pay.',
			payNote: (bet: string) => `What 8–9, 10–11 and 12+ of a symbol pay at your bet (${bet} 🍔):`,
			payRow: (a: string, b: string, c: string) => `8–9 → ${a} · 10–11 → ${b} · 12+ → ${c}`,
			holkRow: (a: number, b: number, c: number, spins: number, re: number, more: number) => `4 → ${a}× bet · 5 → ${b}× · 6 → ${c}×, and ${spins} Sky High Spins (${re} in them: +${more})`,
			cloudRow: '×2 up to ×100. On a winning screen every cloud adds up and multiplies the tumble win (not the holk pay).',
			anteNote: 'Double chance: holks land more often, so Sky High Spins come about twice as often (about every 155 spins instead of every 295). A spin costs 25 % more; the win is worked out on your bet. Buying a bonus is off while it’s on.',
			buyNote: (free: number, sup: number) => `Buy bonus prices are times your bet: Sky High Spins ${free}×, Super Sky High ${sup}× (every cloud ×10 or more). They give back about as much as spinning (a little less than the price, like a real casino).`,
			rtpNote: 'Normal odds: a win on about a quarter of spins, Sky High Spins about once every 300 spins, and in the long run it gives back about 96 % of what goes in. Pretend burgers, never money.'
		},
		/** Skeddwood (2026-11-20, the user: "another slot like Deadwood 2, called Skeddwood, the cowboy is Abscar's terminator exoskeleton with a cowboy hat") */
		skeddwood: {
			sub: '384 ways · Cowboy WILDs',
			spin: 'Spin',
			credits: 'Burgers',
			lastWin: 'Win',
			spinning: 'Spinning…',
			noWin: 'No win this time.',
			turbo: 'Turbo',
			symbols: {
				ten: '10',
				jack: 'J',
				queen: 'Q',
				king: 'K',
				ace: 'A',
				ingman: 'WANTED: Ingman',
				lars: 'WANTED: Drängen Lars Åke',
				jeeven: 'WANTED: Da Jeeven',
				phil: 'WANTED: Phillestar',
				sixgun: 'Divergence six-gun',
				cowboy: 'Cowboy WILD',
				hwild: 'WILD',
				skedd: 'The Skedd (WILD)',
				cylinder: 'Quick Draw cylinder',
				star: 'Sheriff star',
				skull: 'Golden skull',
				grave: 'GG tombstone'
			},
			reelLabel: (r: number, symbols: string) => `Reel ${r}: ${symbols}`,
			cowboyLabel: (m: number) => `Cowboy WILD ×${m}`,
			splitLabel: (s: string) => `${s} split in two`,
			shotLabel: (s: string, x: number) => `${s} ×${x}`,
			wayWin: (sym: string, reels: number, ways: number, mult: number, win: number) =>
				`${sym}: ${reels} reels, ${ways} way${ways === 1 ? '' : 's'}${mult > 1 ? ` ×${mult}` : ''} = ${win.toLocaleString('en-US')} 🍔`,
			moreWins: (n: number) => `+${n} more`,
			pops: {
				nudge: (m: number) => `×${m}`,
				highNoon: 'HIGH NOON!',
				skedd: 'SEEING DOUBLE!',
				quick: 'QUICK DRAW!',
				gold: 'GOLD RUSH!',
				divergence: 'DIVERGENCE!'
			},
			highNoonMsg: 'High Noon: every low symbol on reels 2–4 turns WILD',
			skeddMsg: 'The Skedd: a big puff and the middle symbols are seen double',
			quickMsg: (n: number) => `Quick Draw: ${n} shots, every hit doubles`,
			nudgeMsg: (m: number) => `The cowboy nudges in: ×${m}`,
			sticky: 'STICKY',
			free: {
				intro: { gold: 'GOLD RUSH SPINS', divergence: 'DIVERGENCE SPINS' },
				introSub: {
					gold: (n: number) => `${n} free spins. Every cowboy that lands stays put with his multiplier, the cowboys multiply each other, and a cowboy landing on his reel again adds to him. The Skedd landing upgrades to Divergence Spins. Three GG tombstones = 5 more spins.`,
					divergence: (n: number) => `${n} free spins with the Skedd on reel 5 every spin: the middle symbols are seen double and every cowboy doubles. Cowboys stick and multiply each other. Three GG tombstones = 6 more spins.`
				},
				title: (gold: boolean, n: number, total: number) => `${gold ? 'Gold Rush' : 'Divergence'} spin ${n} / ${total}`,
				sub: (won: number) => `Sticky cowboys · ${won.toLocaleString('en-US')} 🍔 so far`,
				more: (n: number) => `+${n} FREE SPINS!`,
				upgrade: (n: number) => `UPGRADE! DIVERGENCE SPINS +${n}`,
				outro: 'FREE SPINS WON',
				outroSub: (n: number) => `${n} free spins played`,
				lucky: { gold: 'LUCKY DRAW: GOLD RUSH', divergence: 'LUCKY DRAW: DIVERGENCE!' }
			},
			continue: 'Continue',
			buy: 'Buy bonus',
			buyKinds: { gold: 'Gold Rush', lucky: 'Lucky Draw', divergence: 'Divergence' },
			buyWhat: {
				gold: (n: number) => `${n} Gold Rush Spins`,
				lucky: 'the Lucky Draw (4 in 5 Gold Rush, 1 in 5 Divergence)',
				divergence: (n: number) => `${n} Divergence Spins`
			},
			tiers: { win: 'WIN', big: 'BIG WIN', mega: 'MEGA WIN', legend: 'LEGENDARY BOUNTY' },
			maxWin: (x: number) => `MAX WIN: ${x.toLocaleString('en-US')}× your bet`,
			paytable: 'Paytable & how it works',
			how: 'Five reels showing 3, 4, 4, 4 and 2 symbols, 384 ways to win. Wins pay for the same symbol on reels next to each other from reel 1, anywhere on each reel: 3, 4 or 5 reels. Ways = how many of it (or WILDs) each reel shows, multiplied together, and every way pays. The letters sit on reels 1–4 only; the WANTED posters and the Divergence six-gun on every reel. WILDs stand in for every paying symbol; ways made of WILDs alone pay as six-guns.',
			payRow: (a: number, b: number, c: number) => `3 reels → ${a}× · 4 → ${b}× · 5 → ${c}× your bet, per way`,
			features: {
				cowboy: 'Abscar in his terminator exoskeleton and a cowboy hat, 4 symbols tall, on reels 2–4. When part of him lands he nudges until he fills the reel, +1 to his multiplier for every step (×1 to ×4). He counts as one WILD. In normal spins the cowboys’ multipliers add up; in free spins they multiply each other.',
				hwild: 'Every low symbol (and star) on reels 2–4 turns into this at High Noon.',
				skedd: 'A giant glass spoon pipe filling reel 5: WILD there, and its big puff makes you see double: reel 1’s middle symbol and reels 2–4’s two middle symbols split in two, so they count twice. A cowboy in its smoke doubles his multiplier.',
				cylinder: 'Reel 1 only, counts as WILD: Quick Draw fires 3 to 6 shots at reels 2–5. Every symbol hit doubles (×2, ×4 …) for every way through it; a cowboy hit doubles his multiplier.',
				star: 'Reels 2 and 4: one on each = HIGH NOON, every low symbol on reels 2–4 turns WILD.',
				skull: 'One on each of reels 2, 3 and 4 = 8 Gold Rush Spins; with the Skedd on reel 5 as well = 8 Divergence Spins.',
				grave: 'Free spins only: three or more on reels 1–4 = 5 more Gold Rush Spins or 6 more Divergence Spins.'
			},
			freeNote: 'Gold Rush Spins: every cowboy that lands stays put until the spins end, cowboys multiply each other, and a cowboy landing on a sticky one’s reel adds his multiplier to it. The Skedd landing upgrades to Divergence Spins (+2 spins). Divergence Spins: the Skedd stands on reel 5 on every spin, so the middle symbols split and every cowboy doubles on every spin.',
			buyNote: (g: number, l: number, d: number) => `Buy bonus prices are times your bet: Gold Rush ${g}×, Lucky Draw ${l}× (4 in 5 Gold Rush, 1 in 5 Divergence), Divergence ${d}×. They give back about the same share as spinning.`,
			rtpNote: 'Gold Rush comes about once every 280 spins, Divergence about once in 11,000. Normal odds: in the long run it gives back about 96–97 % of what goes in, and about a quarter of spins win. Pretend burgers, never money.',
			maxNote: (x: number) => `One play (a spin with its free spins, or a bought bonus) pays at most ${x.toLocaleString('en-US')}× your bet.`,
			fun: 'Our own take on a ways slot with nudging wilds: the squad on the posters, Abscar as the cowboy.'
		},
		roulette: {
			spin: 'Spin',
			clear: 'Clear',
			chip: 'Chip',
			allIn: 'All in',
			amountLabel: 'Your own chip amount',
			amountHint: 'Own amount, e.g. 2.5m',
			amountUse: 'Use',
			badAmount: 'Type an amount like 1500, 10k or 2.5m.',
			chipNow: (n: number, tooBig: boolean) => `Chip: ${n.toLocaleString('en-US')} 🍔${tooBig ? ' (more than you have free)' : ''} · no table limit`,
			chipAllIn: (n: number) => `All in: a tap puts all your ${n.toLocaleString('en-US')} free 🍔 on the spot`,
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
			how: 'European roulette: one zero, 37 pockets. Tap spots to put your chip on them, as many as you like, then spin. No table limit: bet as much as you have, pick a chip, type your own amount or go All in. A number pays 35 to 1, a dozen or a column 2 to 1, red/black, odd/even, 1–18/19–36 pay 1 to 1. The zero loses every outside bet.',
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
			satEvent: 'sat down at the blackjack table: pull up a chair 🃏',
			/** On / off per device (2026-11-20, the user: "an on/off button for the blackjack online mode so I can turn it off when it's not used"). */
			online: {
				label: 'Online table',
				on: 'On',
				off: 'Off',
				onNote: 'Not playing? Turn it off and this device stops checking the table.',
				offNote: 'Off on this device: Blackjack doesn’t check the table or send anything.',
				offTitle: 'The online table is off',
				offBody: 'This device doesn’t check the blackjack table or send anything to it, and the Blackjack tile shows no player count. Your friends can still play. Turn it on to sit down with them.',
				turnOn: 'Turn the table on',
				waitHand: 'Finish your hand first: the table can go off once it’s booked.',
				waitReading: 'One second: checking the table for a hand of yours first.',
				tileOff: 'Online table off on this device'
			}
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
				`You earn burgers on camos: ${s.start} to start, Gold +${s.gold}, Platinum +${s.platinum}, Harmonic Break +${s.harmonicBreak}, Divergence +${s.divergence}, each Mastery camo +${s.mastery}. Bet them on duels and the race to Divergence: win and you get your bet back doubled. Every day you’re online with the squad adds a daily bonus (2,500, going up by 2,500 every 5 days online), and what you win or lose in BurgiCasino counts too. Abscar is the house: every burger the others lose in BurgiCasino or on bets goes to Abscar’s account. Burgers you give away in BurgiGives (the Donations tab) go to the karma bank, and now and then love from it comes back as burgers.`,
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
	/** KarmaShop (2026-11-20; karma-shop.ts): the second shop in the BurgiShop tab, paid with hearts from BurgiGives. */
	karmaShop: {
		heading: 'KarmaShop',
		sub: 'Good-karma cosmetics, paid with hearts',
		/** the two shops' switch at the top of the BurgiShop tab */
		switchLabel: 'Which shop',
		burgiTile: 'Pay with 🍔 burgers',
		karmaTile: 'Pay with ❤️ hearts',
		balance: 'Your hearts',
		hearts: (n: number) => `${n.toLocaleString('en-US')} ❤️`,
		intro: 'Kindness pays here. You earn hearts by giving burgers away in BurgiGives, and spend them on good-karma looks for your operator: the whole squad sees them. What you buy is yours to keep and is worn like your BurgiShop things (one per kind).',
		how: 'How you earn hearts',
		rules: [
			'1 ❤️ for every 1,000 🍔 you give in BurgiCasino → Donations (BurgiGives).',
			'+10 ❤️ once for each cause you give at least 1,000 🍔 (up to +50 for all five).',
			'Everything you’ve given before counts too. Hearts never run out on their own, and only you can spend yours.'
		],
		given: (burgers: number, causes: number) => `You’ve given ${burgers.toLocaleString('en-US')} 🍔 to ${causes} of 5 causes`,
		earnedSpent: (earned: number, spent: number) => `${earned.toLocaleString('en-US')} ❤️ earned · ${spent.toLocaleString('en-US')} ❤️ spent`,
		next: (burgers: number) => `${burgers.toLocaleString('en-US')} 🍔 more given = 1 more ❤️`,
		toDonate: 'Give burgers in BurgiGives',
		buy: (price: number) => `Buy · ${price.toLocaleString('en-US')} ❤️`,
		bought: (name: string) => `${name} is yours and on your operator 💖`,
		broke: (price: number, have: number) => `${price.toLocaleString('en-US')} ❤️ needed, you have ${have.toLocaleString('en-US')}. Give burgers in BurgiGives to earn more.`,
		slotHint: {
			aura: 'Glows behind your operator.',
			effect: 'Floats around your operator.',
			eyes: 'Sits on your operator’s eyes, over masks, goggles and glasses.',
			hat: 'Sits on your operator’s head (Ingman takes his wizard hat off for it).',
			smoke: 'Colours the smoke from whatever’s in your mouth. Nothing in it? You blow a puff out yourself.',
			pet: 'A little sidekick that sits on your operator’s shoulder.'
		} as Partial<Record<string, string>>,
		kindest: 'Kindest in the squad',
		kindestNone: 'Nobody has given anything yet. Be the first!',
		kindRow: (hearts: number, burgers: number) => `${hearts.toLocaleString('en-US')} ❤️ · ${burgers.toLocaleString('en-US')} 🍔 given`,
		items: (n: number) => (n === 1 ? '1 karma item' : `${n} karma items`),
		you: 'You',
		event: (name: string, rarity: string) => `got ${name} (${rarity}) in KarmaShop 💖`
	},
	/** The Cosmetics tab (CosmeticsSection; data/cosmetics.ts). */
	cosmetics: {
		heading: 'Cosmetics',
		sub: (n: number, bundles: number) => `${n} large stickers, stickers and charms · ${bundles} store bundles`,
		typeGroup: 'Kind of item',
		types: { decal: 'Large stickers', sticker: 'Stickers', charm: 'Charms' },
		bundlesTab: 'Bundles',
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

	/** Cosmetics → Bundles: every MW4 store bundle with everything in it. */
	bundles: {
		help: 'Every Modern Warfare 4 bundle in the store, with everything you get when you buy it.',
		search: 'Search bundles',
		searchPlaceholder: 'Search bundle, gun, skin, operator…',
		results: (shown: number, total: number) => (shown === total ? `${total} bundles` : `${shown} of ${total} bundles`),
		cp: 'CP',
		cpLong: (n: string) => `${n} COD Points`,
		platform: 'Platform stores',
		platformLong: 'Bought for real money in the PlayStation, Xbox or PC store, not with COD Points',
		since: (day: string) => `In the store since ${day}`,
		left: (day: string) => `Left the store ${day}`,
		count: (n: number) => (n === 1 ? '1 item' : `${n} items`),
		newTag: 'New',
		sections: { operator: 'Operator skins', operatorOne: 'Operator skin', weapon: 'Weapon blueprints', weaponOne: 'Weapon blueprint', other: 'Also in it' },
		kinds: {
			operator: 'Operator skin',
			weapon: 'Weapon blueprint',
			finisher: 'Finishing move',
			camo: 'Weapon camo',
			decal: 'Large sticker',
			sticker: 'Sticker',
			charm: 'Charm',
			reticle: 'Reticle',
			equipment: 'Equipment skin',
			card: 'Calling card',
			emblem: 'Emblem',
			loading: 'Loading screen',
			spray: 'Spray',
			token: 'XP token',
			cp: 'COD Points'
		},
		forOperator: (op: string) => `for ${op}`,
		rarity: { rare: 'Rare', epic: 'Epic', legendary: 'Legendary', ultra: 'Ultra' },
		tags: { mastercraft: 'Mastercraft', reactive: 'Reactive', tracers: 'Tracers', deathfx: 'Death effect' },
		reactiveSkin: 'Reactive',
		openWeapon: (gun: string) => `${gun}: open the weapon card`,
		openItem: 'opens where to get it',
		store: 'See it in Activision’s store',
		newTab: '(opens in a new tab)',
		wordsHeading: 'What the words mean',
		words: [
			['Mastercraft', 'a blueprint with its own one-of-a-kind look, often its own sounds and animations too.'],
			['Reactive', 'the look changes as you get kills in a match.'],
			['Tracers', 'your bullets leave coloured trails.'],
			['Death effect', 'enemies you kill go out with a special effect.'],
			['Ultra Skin', 'an operator skin with animated effects; the top rarity.'],
			['Tracer Pack / Legends Pack / Elite Squad', 'Activision’s names for kinds of bundle.'],
			['Rarity', 'Rare → Epic → Legendary → Ultra, the game’s own grading of how fancy an item is.'],
			['Weapon blueprint', 'a ready-built gun with its own look and attachments, for that weapon only.']
		] as [string, string][],
		none: 'No bundle matches.',
		clear: 'Clear search',
		honest:
			'Read from Activision’s own store pages. The in-game store can have more than the web store shows (personal offers, bundles that come back), and bundles come and go. Tap a gun to open its weapon card, or a sticker or charm to see our drawing of it.',
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
