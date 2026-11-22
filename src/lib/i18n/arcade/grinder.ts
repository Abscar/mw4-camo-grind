/** Camo Grinder's words (BurgiArcade). Shown in the hall, on the cabinet and in the game. */
export default {
	name: 'Camo Grinder',
	tagline: 'Time your taps, max every camo',
	how: 'Tap when the needle is in the zone to earn the next camo: Gold, Platinum, Harmonic Break, Divergence. Every weapon is faster with a smaller zone; three misses and the grind is over.',
	controls: 'Tap / click / Space when the needle is in the zone',
	aria: 'Camo Grinder. Press Space, or tap, when the needle is inside the target zone.',
	score: 'SCORE',
	weapon: (n: number) => `WEAPON ${n}`,
	strikes: 'Misses',
	camos: { gold: 'Gold', platinum: 'Platinum', harmonicBreak: 'Harmonic Break', divergence: 'Divergence' } as Record<string, string>,
	short: { gold: 'G', platinum: 'P', harmonicBreak: 'HB', divergence: 'DIV' } as Record<string, string>,
	banner: (camo: string) => `${camo}!`,
	maxed: 'MAXED!',
	perfect: 'PERFECT',
	miss: 'MISS',
	tooSlow: 'TOO SLOW',
	bonus: (n: number) => `+${n} MAXED`,
	hintStart: 'Tap, click or press Space when the needle is in the zone',
	hintNext: (camo: string) => `Next up: ${camo}`,
	streak: (n: number) => `Perfect streak ×${n}`,
	lastChance: 'Last chance!',
	paused: 'Paused',
	tapToContinue: 'Tap or press a key to continue',
	live: {
		hit: (camo: string) => `${camo} earned.`,
		miss: (left: number) => `Miss. ${left} left.`,
		over: 'Game over.'
	}
};
