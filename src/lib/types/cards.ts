import type { Vec2 } from '$lib/utils/vec2';
import type { CardType } from '$lib/data/card-defs';
export type { CardType } from '$lib/data/card-defs';

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

export type CardData = {
  id: number;
  type: CardType;
  usesRemaining?: number; // charges remaining; undefined = single-use
  energyRemaining?: number; // energy units remaining (energy cells only)
  label?: string; // overrides def.title for display (used by teleport cards)
  targetBoardIndex?: number; // set on teleport cards
  unitStats?: UnitStats; // present on living units and their tombstones
  tombstoneOf?: CardType; // set on tombstone cards: the original unit type (for revival)
  // inventory will be added to CardData when implemented
};

export type Stack = {
  id: number;
  pos: Vec2;
  dragging: boolean;
  isDropTarget: boolean;
  cards: CardData[]; // index 0 = bottom
  progress: number; // 0–1, for progress bar rendering
  progressStartTime: number | null;
  activeRecipeId: string | null; // null = no active recipe
};

export type ShopItem = {
  id: number;
  cardType: CardType;
  price: number;
  label: string;
  color: string;
};

export type SolFeedResult = {
  needed: number;
  provided: number;
  deaths: { type: CardType; count: number }[];
};

export type BoardFeedResult = SolFeedResult & { boardName: string };

export type Clock = {
  sol: number;
  solStartTime: number | null;
  endOfSol: boolean;
  endOfSolAt: number | null;
  lastSolFeeds: BoardFeedResult[];
  speed: number; // 0 = paused, 1/2/3 = active speed multiplier
  lastActiveSpeed: number;
  vTime: number;
  vTimeAt: number | null;
};

export type Connection = { fromId: number; toId: number };

export type Board = {
  id: number;
  name: string;
  stacks: Stack[];
  width: number; // vmin
  height: number; // vmin
  currency: number;
  shop: ShopItem[];
  knownRecipeIds: string[];
  firedMilestones: string[];
  discovered: boolean;
  connections: Connection[];
};
