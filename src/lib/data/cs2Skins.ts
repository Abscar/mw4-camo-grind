/**
 * The Camo Armory's last tab, "CS2 Skins" (2026-11-22, the user: "Lägg till en flik i Camo Armory som är
 * sist. Där du har Counter-Strike skins. Typ alla de dyraste, fetaste, coolaste, ikoniska … som passar till
 * vapen som vi har … de kan kosta typ 100 miljoner stycken … mer än vad Orion kostar").
 *
 * Which guns: the MW4 weapons built on the same real gun as a CS2 gun (the ones the 2026-11-07 easter eggs
 * already draw as CS2 guns), plus the KG-7 Vulcan as the AWP (the user's own pick back then) and the M4 as
 * both of CS2's M4s (the real M4A1 is behind the M4A4 and the M4A1-S). Kastov 762 = AK-47, VEL 46 = MP7,
 * Rezi 12 = XM1014, Krait P68 = USP-S, .50 GS = Desert Eagle, Mojave .357 = R8 Revolver, FSS Carbon Edge
 * 1095 = Karambit. The rest of MW4's guns have no CS2 twin.
 *
 * Which skins: the famous ones per gun (my pick: the most expensive and most iconic), names and grades as
 * CSGOStash lists them (checked 2026-11-22). The Doppler phases (Ruby, Sapphire, Emerald) and the "Blue
 * Gem" Case Hardened pattern are what we drew, so they're in the name too.
 *
 * Prices: pretend burgers, never less than 100,000,000 (Orion Reforged is 80,000,000), roughly following how
 * rare and pricey the real skin is (my pick): 100M for the cheaper ones up to 10,000,000,000 for the Blue Gem
 * AK, the most expensive CS skin ever sold. No unlock order: any skin, any time, if you have the burgers.
 *
 * Item ids `cs2-<key>`, kept by the shop: never change or reuse a key. Pure, tested in
 * scripts/cs2-skins.test.js.
 */
import type { Cs2Model, Skin } from './weaponLooks.ts';

/** CS2's grade (the colour bar under an item in the game). */
export type Cs2Grade = 'contraband' | 'covert' | 'classified' | 'restricted' | 'milspec';

export interface Cs2Skin {
	/** The item id is `cs2-${key}`. Never change. */
	key: string;
	model: Cs2Model;
	/** The drawing (Cs2Gun.svelte / cs2SkinArt.ts). */
	art: Skin;
	/** The finish's name, as CS2 writes it after the "|". */
	finish: string;
	/** The phase or pattern we drew ("Ruby", "Blue Gem"), shown in brackets. */
	note?: string;
	grade: Cs2Grade;
	price: number;
}

/** CS2's own names for the guns (knives get CS2's ★). */
export const CS2_MODEL_NAME: Record<Cs2Model, string> = {
	ak47: 'AK-47',
	m4a4: 'M4A4',
	m4a1s: 'M4A1-S',
	awp: 'AWP',
	deagle: 'Desert Eagle',
	usps: 'USP-S',
	r8: 'R8 Revolver',
	mp7: 'MP7',
	xm1014: 'XM1014',
	karambit: '★ Karambit'
};

/** Which MW4 weapon (weapons.ts id) each CS2 gun goes on. */
export const CS2_WEAPON: Record<Cs2Model, string> = {
	ak47: 'kastov-762',
	m4a4: 'm4',
	m4a1s: 'm4',
	awp: 'kg-7-vulcan',
	deagle: '50-gs',
	usps: 'krait-p68',
	r8: 'mojave-357',
	mp7: 'vel-46',
	xm1014: 'rezi-12',
	karambit: 'fss-carbon-edge-1095'
};

/** CS2's grade names and colours (the game's own rarity colours). */
export const CS2_GRADES: Record<Cs2Grade, { name: string; colour: string }> = {
	contraband: { name: 'Contraband', colour: '#e4ae39' },
	covert: { name: 'Covert', colour: '#eb4b4b' },
	classified: { name: 'Classified', colour: '#d32ce6' },
	restricted: { name: 'Restricted', colour: '#8847ff' },
	milspec: { name: 'Mil-Spec', colour: '#4b69ff' }
};

const M = 1_000_000;
const B = 1_000_000_000;

const skin = (key: string, model: Cs2Model, art: Skin, finish: string, grade: Cs2Grade, price: number, note?: string): Cs2Skin => ({ key, model, art, finish, grade, price, ...(note ? { note } : {}) });

/** Every skin, gun by gun (game order), dearest first. */
export const CS2_SKINS: readonly Cs2Skin[] = [
	// Kastov 762 = AK-47
	skin('ak-case-hardened', 'ak47', 'ak-case-hardened', 'Case Hardened', 'classified', 10 * B, 'Blue Gem'),
	skin('ak-wild-lotus', 'ak47', 'ak-wild-lotus', 'Wild Lotus', 'covert', 1 * B),
	skin('ak-gold-arabesque', 'ak47', 'ak-gold-arabesque', 'Gold Arabesque', 'covert', 1 * B),
	skin('ak-fire-serpent', 'ak47', 'fire-serpent', 'Fire Serpent', 'covert', 500 * M),
	skin('ak-vulcan', 'ak47', 'ak-vulcan', 'Vulcan', 'covert', 250 * M),
	skin('ak-hydroponic', 'ak47', 'ak-hydroponic', 'Hydroponic', 'classified', 250 * M),
	skin('ak-asiimov', 'ak47', 'ak-asiimov', 'Asiimov', 'covert', 150 * M),
	skin('ak-redline', 'ak47', 'ak-redline', 'Redline', 'classified', 100 * M),
	// M4 = M4A4 + M4A1-S
	skin('m4-howl', 'm4a4', 'm4-howl', 'Howl', 'contraband', 2.5 * B),
	skin('m4s-jungle', 'm4a1s', 'm4s-jungle', 'Welcome to the Jungle', 'covert', 500 * M),
	skin('m4s-knight', 'm4a1s', 'm4s-knight', 'Knight', 'classified', 500 * M),
	skin('m4-poseidon', 'm4a4', 'm4-poseidon', 'Poseidon', 'classified', 500 * M),
	skin('m4s-hot-rod', 'm4a1s', 'm4s-hot-rod', 'Hot Rod', 'classified', 250 * M),
	skin('m4-asiimov', 'm4a4', 'asiimov', 'Asiimov', 'covert', 150 * M),
	skin('m4s-printstream', 'm4a1s', 'm4s-printstream', 'Printstream', 'covert', 150 * M),
	skin('m4-emperor', 'm4a4', 'm4-emperor', 'The Emperor', 'covert', 150 * M),
	skin('m4-neo-noir', 'm4a4', 'm4-neo-noir', 'Neo-Noir', 'covert', 100 * M),
	// VEL 46 = MP7
	skin('mp7-bloodsport', 'mp7', 'bloodsport', 'Bloodsport', 'covert', 100 * M),
	skin('mp7-nemesis', 'mp7', 'mp7-nemesis', 'Nemesis', 'classified', 100 * M),
	skin('mp7-smoking-kills', 'mp7', 'mp7-smoking-kills', 'Smoking Kills', 'classified', 100 * M),
	skin('mp7-fade', 'mp7', 'mp7-fade', 'Fade', 'restricted', 100 * M),
	// Rezi 12 = XM1014
	skin('xm-tranquility', 'xm1014', 'xm-tranquility', 'Tranquility', 'classified', 100 * M),
	skin('xm-incinegator', 'xm1014', 'xm-incinegator', 'Incinegator', 'classified', 100 * M),
	skin('xm-entombed', 'xm1014', 'xm-entombed', 'Entombed', 'classified', 100 * M),
	skin('xm-frost-borre', 'xm1014', 'frost-borre', 'Frost Borre', 'milspec', 100 * M),
	// KG-7 Vulcan = AWP
	skin('awp-dragon-lore', 'awp', 'awp-dragon-lore', 'Dragon Lore', 'covert', 5 * B),
	skin('awp-gungnir', 'awp', 'awp-gungnir', 'Gungnir', 'covert', 2.5 * B),
	skin('awp-medusa', 'awp', 'awp-medusa', 'Medusa', 'covert', 1 * B),
	skin('awp-prince', 'awp', 'awp-prince', 'The Prince', 'covert', 1 * B),
	skin('awp-fade', 'awp', 'awp-fade', 'Fade', 'covert', 500 * M),
	skin('awp-lightning-strike', 'awp', 'lightning-strike', 'Lightning Strike', 'covert', 250 * M),
	skin('awp-asiimov', 'awp', 'awp-asiimov', 'Asiimov', 'covert', 150 * M),
	skin('awp-hyper-beast', 'awp', 'awp-hyper-beast', 'Hyper Beast', 'covert', 100 * M),
	// Krait P68 = USP-S
	skin('usp-kill-confirmed', 'usps', 'usp-kill-confirmed', 'Kill Confirmed', 'covert', 250 * M),
	skin('usp-printstream', 'usps', 'printstream', 'Printstream', 'covert', 150 * M),
	skin('usp-traitor', 'usps', 'usp-traitor', 'The Traitor', 'covert', 100 * M),
	skin('usp-neo-noir', 'usps', 'usp-neo-noir', 'Neo-Noir', 'covert', 100 * M),
	skin('usp-orion', 'usps', 'usp-orion', 'Orion', 'classified', 100 * M),
	// .50 GS = Desert Eagle
	skin('de-blaze', 'deagle', 'blaze', 'Blaze', 'restricted', 250 * M),
	skin('de-fennec', 'deagle', 'de-fennec', 'Fennec Fox', 'classified', 250 * M),
	skin('de-golden-koi', 'deagle', 'de-golden-koi', 'Golden Koi', 'covert', 150 * M),
	skin('de-code-red', 'deagle', 'de-code-red', 'Code Red', 'covert', 150 * M),
	skin('de-printstream', 'deagle', 'de-printstream', 'Printstream', 'covert', 150 * M),
	skin('de-kumicho', 'deagle', 'de-kumicho', 'Kumicho Dragon', 'classified', 100 * M),
	// Mojave .357 = R8 Revolver
	skin('r8-fade', 'r8', 'r8-fade', 'Fade', 'covert', 100 * M),
	skin('r8-amber-fade', 'r8', 'r8-amber-fade', 'Amber Fade', 'classified', 100 * M),
	skin('r8-blaze', 'r8', 'blaze', 'Blaze', 'milspec', 100 * M),
	skin('r8-crimson-web', 'r8', 'r8-crimson-web', 'Crimson Web', 'milspec', 100 * M),
	// FSS Carbon Edge 1095 = ★ Karambit
	skin('kb-case-hardened', 'karambit', 'kb-case-hardened', 'Case Hardened', 'covert', 5 * B, 'Blue Gem'),
	skin('kb-emerald', 'karambit', 'kb-emerald', 'Gamma Doppler', 'covert', 2.5 * B, 'Emerald'),
	skin('kb-ruby', 'karambit', 'kb-ruby', 'Doppler', 'covert', 2.5 * B, 'Ruby'),
	skin('kb-sapphire', 'karambit', 'kb-sapphire', 'Doppler', 'covert', 2.5 * B, 'Sapphire'),
	skin('kb-crimson-web', 'karambit', 'kb-crimson-web', 'Crimson Web', 'covert', 1 * B),
	skin('kb-fade', 'karambit', 'fade', 'Fade', 'covert', 1 * B),
	skin('kb-lore', 'karambit', 'kb-lore', 'Lore', 'covert', 500 * M),
	skin('kb-marble-fade', 'karambit', 'kb-marble-fade', 'Marble Fade', 'covert', 500 * M),
	skin('kb-tiger-tooth', 'karambit', 'kb-tiger-tooth', 'Tiger Tooth', 'covert', 500 * M)
];

/** "AK-47 | Case Hardened (Blue Gem)". */
export const cs2Name = (s: Pick<Cs2Skin, 'model' | 'finish' | 'note'>): string => `${CS2_MODEL_NAME[s.model]} | ${s.finish}${s.note ? ` (${s.note})` : ''}`;
