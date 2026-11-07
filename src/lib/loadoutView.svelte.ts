/** Which weapon's meta-class popup is open (one popup for the whole page). */

class LoadoutView {
	open = $state(false);
	/** Kept after closing, so the popup doesn't go blank while it closes. */
	weaponId = $state<string | null>(null);

	show(weaponId: string): void {
		this.weaponId = weaponId;
		this.open = true;
	}

	close(): void {
		this.open = false;
	}
}

export const loadoutView = new LoadoutView();
