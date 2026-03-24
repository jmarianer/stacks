import { CARD_CATALOG } from '$lib/data/card-defs';
import type { WeaponStats, UnitStats } from '$lib/types/card-types';
import type { CardData } from '$lib/types/board-types';

/** Returns the active weapon for a player unit: last item in weaponInventory, or built-in. */
export function getUnitWeapon(card: CardData): WeaponStats | undefined {
  if (card.weaponInventory && card.weaponInventory.length > 0) {
    const activeType = card.weaponInventory[card.weaponInventory.length - 1];
    const def = CARD_CATALOG[activeType];
    if (def.weapon) return def.weapon;
  }
  return CARD_CATALOG[card.type].weapon;
}

function statSum(stats: UnitStats): number {
  return (
    stats.endurance +
    stats.strength +
    stats.perception +
    stats.intelligence +
    stats.agility +
    stats.luck
  );
}

export function maxBandAids(stats: UnitStats): number {
  return Math.floor(statSum(stats) / 10 + 1);
}

export function maxUniKits(stats: UnitStats): number {
  return Math.floor(statSum(stats) / 5 + 1);
}
