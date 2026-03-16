import type { Vec2 } from '$lib/utils/vec2';

export type CardType =
  // Resources
  | 'alien-parts'
  | 'biomass'
  | 'energy-cell'
  | 'multi-cell'
  | 'mega-cell'
  | 'computronium'
  | 'crust-chunk'
  | 'dark-matter'
  | 'dark-matter-chunk'
  | 'electronics'
  | 'fossil-regolith'
  | 'helium3'
  | 'higgs-boson'
  | 'nanocarbon'
  | 'plasteel'
  | 'plasteel-deposit'
  | 'snow-block'
  | 'snow-pile'
  | 'snow-sphere'
  | 'snowballs'
  | 'unobtainium'
  | 'wishalloy'
  // Ideas
  | 'idea-service-drone'
  | 'idea-solar-panel'
  | 'idea-electronics'
  | 'idea-workbench'
  // Units
  | 'astronaut'
  | 'service-drone-1'
  // Buildings
  | 'workbench'
  | 'solar-panel';

export type CardData = {
  id: number;
  type: CardType;
  usesRemaining?: number;    // charges remaining; undefined = single-use
  energyRemaining?: number;  // energy units remaining (energy cells only)
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

export type Board = {
  id: number;
  name: string;
  stacks: Stack[];
  width: number; // vmin
  height: number; // vmin
  currency: number;
  shop: ShopItem[];
  knownRecipeIds: string[];
  paused: boolean;
  pausedAt: number | null; // performance.now() timestamp when paused
};
