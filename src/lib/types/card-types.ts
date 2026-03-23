import type { RecipeResult } from '$lib/types/recipe-types';

export type DamageType = 'impact' | 'energy' | 'plasma' | 'acid';

/** Weapon stats embedded in a unit's CardDef or a weapon CardDef. */
export type WeaponStats = {
  damage: number;
  damageType: DamageType;
  /** Seconds between attacks (before agility modifier). */
  attackInterval: number;
};

export type UnitStats = {
  endurance: number;
  strength: number;
  perception: number;
  intelligence: number;
  agility: number;
  luck: number;
  health: number;
  /** Last combat attack timestamp (vTime), for cooldown tracking. */
  lastAttackAt?: number;
  /** Damage resistances 0–100 (percentage reduction). */
  resist?: Partial<Record<DamageType, number>>;
};

export function hpMaxFromStats(stats: Pick<UnitStats, 'endurance'>): number {
  return 50 + stats.endurance * 10;
}

export type EnemyDef = {
  /** Base stats for this enemy type. */
  unitStats: Omit<UnitStats, 'lastAttackAt'>;
  /** Enemies only have their built-in weapon. */
  weapon: WeaponStats;
  /** Loot dropped on death, processed as recipe results. */
  loot: RecipeResult[];
};

export type CardDef = {
  title: string;
  image: string; // path to SVG under /cards/
  color: string;
  value?: number; // coin value; undefined = not sellable
  usesInitial?: number; // starting usesRemaining; undefined = single-use
  energyValueInitial?: number; // starting energy units (energy cells only)
  /** Present on player unit cards: initial stats (health computed from endurance). */
  unitStats?: Omit<UnitStats, 'health' | 'lastAttackAt'>;
  /** Recipe ingredient groups this card belongs to (e.g. 'people'). */
  groups?: string[];
  /** Present on unit cards: built-in weapon (fists, claws, etc.) */
  weapon?: WeaponStats;
  /** Present on enemy cards only. */
  enemy?: EnemyDef;
  /** Energy feed requirement per sol. Lower priority = fed first. */
  feed?: { cost: number; priority: number };
};
