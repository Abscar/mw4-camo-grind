/** Killstreak Recall's words (BurgiArcade). Shown in the hall, on the cabinet and in the game. */
export default {
	name: 'Killstreak Recall',
	tagline: 'Watch the call-ins. Call them back.',
	how: 'The radar calls in killstreaks one by one: repeat the order. Every round adds one more call-in and plays faster; one mistake and the signal is lost.',
	controls: 'Click / tap the killstreaks, or keys 1–6',
	streaks: {
		uav: 'UAV',
		care: 'Care Package',
		air: 'Airstrike',
		chopper: 'Chopper',
		missile: 'Missile',
		nuke: 'Nuke'
	},
	/** what the radar says when each one is called in (two short lines) */
	callins: {
		uav: ['UAV', 'ONLINE'],
		care: ['CARE PACKAGE', 'INBOUND'],
		air: ['AIRSTRIKE', 'INBOUND'],
		chopper: ['CHOPPER', 'ON STATION'],
		missile: ['MISSILE', 'LAUNCHED'],
		nuke: ['NUKE', 'INCOMING']
	},
	round: 'ROUND',
	score: 'SCORE',
	ready: 'GET READY',
	watch: 'WATCH',
	yourTurn: 'YOUR TURN',
	repeat: 'Repeat the call-ins',
	confirmed: 'CONFIRMED',
	speed: (n: number) => `+${n} speed bonus`,
	newStreak: 'NEW STREAK',
	joined: (round: number) => `In the mix from round ${round}`,
	lost: 'SIGNAL LOST',
	wrong: 'Wrong call-in',
	slow: 'Too slow',
	locked: (round: number) => `Joins in round ${round}`,
	lockedShort: (round: number) => `R${round}`,
	step: (n: number, of: number) => `${n} / ${of}`,
	paused: 'Paused · tap to continue',
	label: 'Killstreak Recall game area'
};
