import type { UnitStats } from '$lib/types/card-types';

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
