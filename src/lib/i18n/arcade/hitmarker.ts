/** Hitmarker Rush's words (BurgiArcade). Shown in the hall, on the cabinet and in the game. */
export default {
	name: 'Hitmarker Rush',
	tagline: '30 seconds. Every pop-up. No mercy.',
	how: 'Shoot every target that pops up from cover: headshots and bullseyes score extra, and hit streaks multiply your points. Spare anyone with a halo, and mind your accuracy: it counts at the end.',
	controls: 'Click / tap the targets',
	aria: 'Hitmarker Rush: a shooting range at dusk. Click or tap the targets as they pop up from cover; never the ones with a halo.',
	go: 'GO!',
	time: 'TIME!',
	headshot: 'HEADSHOT',
	bullseye: 'BULLSEYE',
	hvt: 'HVT',
	hvtDown: 'HVT DOWN',
	civilian: 'CIVILIAN!',
	streakLost: 'STREAK LOST',
	streak: (mult: string) => `×${mult} STREAK!`,
	accuracy: (pct: number) => `ACCURACY ${pct}%`,
	paused: 'PAUSED',
	tapToContinue: 'Tap to continue',
	sign: 'BURGI',
	crate: 'AMMO'
};
