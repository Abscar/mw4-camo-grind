/**
 * Apex attachments (2026-11-12, the user's ask: "add Apex metas for every weapon's own Apex
 * attachment"). Every MW4 gun with a gunsmith has one Apex attachment of its own: a conversion
 * part in a separate slot (not one of the five), unlocked at the gun's max level. Some block
 * normal slots. Launchers and the knife have none; JAK 12 isn't out yet.
 *
 * `effect` and `blocks` come from mw4-kunskap/vapen-och-attachments.md ("Alla Apex Attachments":
 * games.gg, GamerFuzion, codmunity, Timesaver). `blocks` is empty when no source names a
 * blocked slot.
 *
 * The Apex builds live in `APEX_BUILDS` (apexBuilds.ts): a dated SNAPSHOT of published builds
 * that use the Apex, with source and date like loadouts.ts. Refresh them together.
 */
import type { AttachmentSlot } from './loadouts.ts';

export interface ApexInfo {
	/** As the game / codmunity's attachment list spells it. */
	name: string;
	/** One short line on what it does. */
	effect: string;
	/** Normal slots it closes. */
	blocks: AttachmentSlot[];
	/** Season 1 event Apex parts for the same gun (an Apex build may use one of these instead). */
	alt?: string[];
}

export const APEX: Record<string, ApexInfo> = {
	// ---------- Assault Rifles ----------
	'han-86': { name: 'Han X20 Skybreaker', effect: 'Optic with a built-in 20mm airburst grenade launcher. Direct hits are duds.', blocks: [] },
	m4: { name: 'M4 Hurricane', effect: 'Top-mounted 50-round 5.7x28mm magazine with a lower fire rate. Has its own Hurricane Grip and Hurricane Stock.', blocks: ['Barrel', 'Magazine'], alt: ['M16 Burst'] },
	'hyeon-burst': { name: 'Hyeon Hyperburst', effect: 'Very fast first three shots, then slower full auto. Nerfed in Season 1.', blocks: [], alt: ['Hyeon Auto'] },
	'patriot-xmr': { name: 'Patriot XMR Volt', effect: 'Underbarrel launcher with non-lethal taser darts that stun.', blocks: [] },
	'kastov-762': { name: 'Kastov ARC', effect: 'Built-in optic and barrel that fires RF pulses at infantry, vehicles and electronics.', blocks: ['Barrel'], alt: ['Kastov 545'] },
	oden: { name: 'Oden Sentinel', effect: 'Turns it into a semi-auto sniper with a bipod, suppressor and scope.', blocks: ['Barrel', 'Muzzle'] },
	axion: { name: 'Axion Reaver', effect: 'Chainsaw rear grip, handlebar foregrip, hip laser and canted sight: built for hipfire.', blocks: ['Optic', 'Laser', 'Underbarrel', 'Stock', 'Rear Grip'] },
	'cronen-squall': { name: 'Cronen Maelstrom', effect: 'Fires a rocket you steer with an IR laser while aiming. Unguided shots lose power at range.', blocks: ['Laser', 'Underbarrel'] },
	'cronen-osprey': { name: 'Cronen Helix Mk. II', effect: 'Double-barrel receiver with a binary trigger: fires on both pull and release.', blocks: [] },

	// ---------- SMGs ----------
	'iso-nightshade': { name: 'ISO Trace', effect: 'RFID rounds tag targets and show their position and movement in the optic.', blocks: [] },
	'vel-46': { name: 'VEL 46 Snap', effect: 'Tactical sling for very fast weapon swaps. No stock. Gives Quick Draw with Overkill.', blocks: ['Stock'] },
	'wz-55-striga': { name: 'Wz.55 Striga Rampage', effect: 'Dual-wield: strong up close, with a big control penalty.', blocks: ['Optic', 'Stock', 'Underbarrel'] },
	'ppsh-41': { name: 'PPSh-41 Ember', effect: 'Underbarrel launcher with incendiary rounds that leave lingering fire.', blocks: [] },
	'x-58-nyx': { name: 'X-58 Void', effect: 'Subsonic ammo: hides your kill skulls and shrinks directional hit markers.', blocks: [] },
	'csg-35': { name: 'CSG Crossfire', effect: 'Dual-wield (akimbo) CSG-35.', blocks: [] },

	// ---------- Shotguns ----------
	'rezi-12': { name: 'Rezi 12 Enforcer', effect: 'Pump action with explosive slugs for longer range.', blocks: [] },
	warlord: { name: 'Warlord Lumen', effect: 'A strobe that disorients while you aim. Has to recharge between uses.', blocks: ['Optic', 'Laser'] },

	// ---------- LMGs ----------
	'finn-lmg': { name: 'FiNN Adverse', effect: 'Fire rate above the normal limit. Overheats on long bursts.', blocks: [] },
	'type-73': { name: 'Type 73 Assault', effect: 'Top-mounted magazine with explosive rounds, limited capacity.', blocks: [] },
	'apoc-338': { name: 'APOC-338 Praetor', effect: '10-round belt of high-grain ammo, locked to semi-auto.', blocks: ['Magazine'] },

	// ---------- Marksman Rifles ----------
	'mar-9': { name: 'MAR-9 Auto', effect: 'Full auto at 606 RPM, with less damage per shot.', blocks: ['Trigger Action'] },
	'oris-8-6': { name: 'Oris 8.6 Razor', effect: 'Blade holster on the receiver with up to 3 throwing knives.', blocks: ['Underbarrel'] },
	'mosin-nagant': { name: 'Mosin Harpoon', effect: 'Spring-loaded bayonet with a longer lunge; can be fired off and picked up again.', blocks: ['Barrel', 'Muzzle'] },

	// ---------- Sniper Rifles ----------
	'kg-7-vulcan': { name: 'KG-7 Drillcharge', effect: 'Side-mounted rounds that drill into surfaces and then detonate.', blocks: [] },
	'astaroth-57': { name: 'Astaroth .57 Infiltrator', effect: 'RF scope that sees enemies through walls and windows (limited depth). 1-round magazine.', blocks: ['Optic'] },
	'signal-50': { name: 'Signal Inferno', effect: 'Incendiary .50 cal with extra damage to vehicles and killstreaks.', blocks: [] },

	// ---------- Pistols ----------
	'sang-9mm': { name: 'SANG Breach', effect: 'Underbarrel single-shot 12 gauge. Canted sights only.', blocks: ['Laser'] },
	'krait-p68': { name: 'Krait P68 Commando', effect: 'Ice-pick grip CQB knife: faster melee, longer lunge, steadier recoil.', blocks: [] },
	'50-gs': { name: 'GS Magna', effect: 'Full-auto conversion, not built for precision.', blocks: ['Trigger Action'] },
	'mojave-357': { name: 'Mojave .357 Lawless', effect: 'Hammer fanning from the hip for a much higher fire rate.', blocks: ['Trigger Action'] }
};
