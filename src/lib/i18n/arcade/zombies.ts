/** Zombie Rounds's words (BurgiArcade). Shown in the hall, on the cabinet and in the game. */
export default {
	name: 'Zombie Rounds',
	tagline: 'Survive the night at the burger joint',
	how: 'Zombies shamble in from the dark in rounds, more and faster each time, with a Brute every 5th round. Shoot them before they touch you: you have 3 hearts.',
	controls: 'WASD + mouse, click to fire · touch: drag to move, it auto-fires',
	round: 'ROUND',
	left: (n: number) => `${n} LEFT`,
	clear: 'ROUND CLEAR',
	bruteIncoming: 'BRUTE INCOMING',
	bruteDown: 'BRUTE DOWN!',
	reloading: 'RELOADING',
	reloadKey: 'R',
	down: "YOU'RE DOWN",
	heartBack: '+1 HEART',
	hintMouse: 'WASD to move · aim with the mouse · click to fire',
	hintTouch: 'Drag anywhere to move · your gun fires by itself',
	hintKeys: 'WASD to move · Space fires at the nearest zombie',
	power: {
		nuke: 'NUKE!',
		insta: 'INSTA-KILL',
		double: 'DOUBLE POINTS'
	},
	sign: "BURGI'S",
	open: 'OPEN',
	drive: 'DRIVE THRU',
	paused: 'Paused · tap to continue',
	label: 'Zombie Rounds game area'
};
