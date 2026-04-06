import type { Vec2 } from '$lib/utils/vec2';
import type { CardType } from '$lib/data/card-defs';
import type { UnitStats } from '$lib/types/card-types';
import type { CombatCardState } from '$lib/behavior/combat';

export type CardData = {
  id: number;
  type: CardType;
  usesRemaining?: number; // charges remaining; undefined = single-use
  energyRemaining?: number; // energy units remaining (energy cells only)
  label?: string; // overrides def.title for display (used by teleport cards)
  targetBoardIndex?: number; // set on teleport cards
  unitStats?: UnitStats; // present on living units and their tombstones
  tombstoneOf?: CardType; // set on tombstone cards: the original unit type (for revival)
  weaponInventory?: CardType[]; // equipped weapons; last entry = active weapon
  bandAids?: number; // stocked band-aids (heal)
  uniKits?: number; // stocked uni-kits (regen)
};

export type Stack = {
  id: number;
  pos: Vec2;
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
  lastSolFeeds: BoardFeedResult[];
  speed: number; // 0 = paused, 1/2/3 = active speed multiplier
  lastActiveSpeed: number;
  vTime: number;
  vTimeAt: number | null;
  firedMilestones: string[];
};

export type Connection = { fromId: number; toId: number; filter?: CardType };

export type Board = {
  id: number;
  name: string;
  stacks: Stack[];
  width: number; // vmin
  height: number; // vmin
  currency: number;
  shop: ShopItem[];
  discovered: boolean;
  connections: Connection[];
};

export type GameState = {
  boards: Board[];
  clock: Clock;
  currentBoardIndex: number;
  knownRecipeIds: string[];
  combatState: Record<number, CombatCardState>;
};
