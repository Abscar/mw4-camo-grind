/** Nuke Run's words (BurgiArcade). Shown in the hall, on the cabinet and in the game. */
export default {
	name: 'Nuke Run',
	tagline: 'Outrun the blast through a burning city',
	how: 'Sprint through the ruins: jump wire, sandbags, mines, wrecks and strike craters, slide under drones and grab burger coins. One hit ends the run; score = metres + 10 per coin.',
	controls: 'Space / ↑ jump · ↓ slide · or tap the top / bottom half',
	aria: 'Nuke Run. Space or the up arrow jumps, the down arrow slides. On a touch screen, tap the top half to jump and the bottom half to slide.',
	metres: 'm',
	jump: 'JUMP',
	slide: 'SLIDE',
	space: 'SPACE',
	orClick: 'or click the top / bottom half',
	tapJump: 'TAP HERE · JUMP',
	tapSlide: 'TAP HERE · SLIDE',
	orSwipe: 'or swipe up / down',
	tagJump: 'JUMP!',
	tagSlide: 'SLIDE!',
	strike: 'AIR STRIKE INCOMING',
	speedUp: 'SPEED UP!',
	keepGoing: 'KEEP RUNNING!',
	milestone: (m: number) => `${m.toLocaleString('en-US')} M`,
	paused: 'Paused',
	tapToContinue: 'Tap or press a key to continue'
};
