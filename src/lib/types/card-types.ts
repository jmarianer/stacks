import type { RecipeResult } from '$lib/types/recipe-types';

export type DamageType = 'impact' | 'energy' | 'plasma' | 'acid';

/** Weapon stats embedded in a unit's PlayerUnitDef/EnemyDef, or a weapon CardDef. */
export type WeaponStats = {
  damage: number;
  damageType: DamageType;
  /** Seconds between attacks (before agility modifier). */
  attackInterval: number;
  /** Attack range in vmin. */
  range: number;
};

export type UnitStats = {
  endurance: number;
  strength: number;
  perception: number;
  intelligence: number;
  agility: number;
  luck: number;
  health: number;
  /** Damage resistances 0–100 (percentage reduction). */
  resist?: Partial<Record<DamageType, number>>;
};

export function hpMaxFromStats(stats: Pick<UnitStats, 'endurance'>): number {
  return 50 + stats.endurance * 10;
}

export type PlayerUnitDef = {
  /** Base stats (health computed from endurance at card creation). */
  unitStats: Omit<UnitStats, 'health'>;
  /** Built-in weapon (fists, etc.), used when no equipped weapon is active. */
  weapon: WeaponStats;
  /** Movement speed in vmin/second during combat. */
  speed?: number;
  /** HP regenerated per second during combat. */
  regen?: number;
  /** Max weapon inventory slots. */
  weaponSlots?: number;
};

export type EnemyDef = {
  /** Base stats for this enemy type (health computed from endurance at card creation). */
  unitStats: Omit<UnitStats, 'health'>;
  /** Enemies only have their built-in weapon. */
  weapon: WeaponStats;
  /** Movement speed in vmin/second during combat. */
  speed?: number;
  /** HP regenerated per second during combat. */
  regen?: number;
  /** Loot dropped on death, processed as recipe results. */
  loot: RecipeResult[];
};

type CardDefBase = {
  title: string;
  image: string; // path to SVG under /cards/
  color: string;
  usesInitial?: number; // starting usesRemaining; undefined = single-use
  /** Recipe ingredient groups this card belongs to (e.g. 'people', 'weapon'). */
  groups?: string[];
  /** Energy feed requirement per sol. Lower priority = fed first. */
  feed?: { cost: number; priority: number };
};

// prettier-ignore
export type CardDef =
  | (CardDefBase & { playerUnit: PlayerUnitDef;  enemy?: never; weaponStats?: never; energyValueInitial?: never })
  | (CardDefBase & { enemy: EnemyDef;            playerUnit?: never; weaponStats?: never; energyValueInitial?: never })
  | (CardDefBase & { weaponStats: WeaponStats;   playerUnit?: never; enemy?: never; energyValueInitial?: never })
  | (CardDefBase & { energyValueInitial: number; playerUnit?: never; enemy?: never; weaponStats?: never })
  | (CardDefBase & { playerUnit?: never;         enemy?: never; weaponStats?: never; energyValueInitial?: never });
