import type { Vec2 } from '$lib/utils/vec2';
import type { CardType } from '$lib/card-defs';
export type { CardType } from '$lib/card-defs';

export type CardData = {
  id: number;
  type: CardType;
  usesRemaining?: number; // charges remaining; undefined = single-use
  energyRemaining?: number; // energy units remaining (energy cells only)
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
  symbol: string;
  label: string;
  color: string;
};

export type SolFeedResult = {
  needed: number;
  provided: number;
  deaths: { type: CardType; count: number }[];
};

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
  paused: boolean;
  pausedAt: number | null; // performance.now() timestamp when paused
  sol: number;
  solStartTime: number | null; // performance.now() when current sol started; null = not yet started
  endOfSol: boolean;
  endOfSolAt: number | null; // performance.now() when end-of-sol began
  lastSolFeed: SolFeedResult | null;
};
