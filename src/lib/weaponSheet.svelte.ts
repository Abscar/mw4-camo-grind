/** Which weapon's card (focus, note, balance change, next challenge) is open: one for the whole page. */

class WeaponSheet {
	open = $state(false);
	/** Kept after closing, so the card doesn't go blank while it closes. */
	weaponId = $state<string | null>(null);

	show(weaponId: string): void {
		this.weaponId = weaponId;
		this.open = true;
	}

	close(): void {
		this.open = false;
	}
}

export const weaponSheet = new WeaponSheet();
