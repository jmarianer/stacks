import type { Vec2 } from '$lib/utils/vec2';

export type CardType =
  // Resources
  | 'alien-parts'
  | 'biomass'
  | 'energy-cell'
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
  // Units
  | 'astronaut';

export type CardData = {
  id: number;
  type: CardType;
  usesRemaining?: number; // charges remaining; undefined = infinite uses
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
};
