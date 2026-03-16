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
  value?: number; // coin value; undefined = not sellable
  usesRemaining?: number; // charges remaining; undefined = infinite uses
  title: string;
  symbol: string;
  color: string;
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

/** Canonical display data for every card type. Used by recipe outputs and buyCard. */
export const CARD_CATALOG: Record<CardType, Omit<CardData, 'id'>> = {
  // Resources
  'alien-parts':       { type: 'alien-parts',        value: 15, title: 'Alien Parts',        symbol: '👾', color: '#69F0AE' },
  'biomass':           { type: 'biomass',            value:  1, title: 'Biomass',            symbol: '🌿', color: '#4A7C3F' },
  'energy-cell':       { type: 'energy-cell',        value:  1, title: 'Energy Cell',        symbol: '⚡', color: '#F4C430' },
  'computronium':      { type: 'computronium',       value: 10, title: 'Computronium',       symbol: '🧠', color: '#3F51B5' },
  'crust-chunk':       { type: 'crust-chunk',        value:  1, title: 'Crust Chunk',        symbol: '🪨', color: '#8B7355' },
  'dark-matter':       { type: 'dark-matter',        value: 15, title: 'Dark Matter',        symbol: '🌑', color: '#4A148C' },
  'dark-matter-chunk': { type: 'dark-matter-chunk',  value:  5, title: 'Dark Matter Chunk',  symbol: '🌑', color: '#6A1B9A' },
  'electronics':       { type: 'electronics',        value:  3, title: 'Electronics',        symbol: '💡', color: '#00ACC1' },
  'fossil-regolith':   { type: 'fossil-regolith',    value:  1, title: 'Fossil Regolith',    symbol: '🦴', color: '#A1887F' },
  'helium3':           { type: 'helium3',            value:  1, title: 'Helium-3',           symbol: '☁',  color: '#87CEEB' },
  'higgs-boson':       { type: 'higgs-boson',        value:  1, title: 'Higgs Boson',        symbol: '⚛',  color: '#9E9E9E' },
  'nanocarbon':        { type: 'nanocarbon',         value:  2, title: 'Nanocarbon',         symbol: '◼',  color: '#212121' },
  'plasteel':          { type: 'plasteel',           value:  2, title: 'Plasteel',           symbol: '🔩', color: '#607D8B' },
  'plasteel-deposit':  { type: 'plasteel-deposit',   value:  1, title: 'Plasteel Deposit',   symbol: '⛏',  color: '#455A64', usesRemaining: 3 },
  'snow-block':        { type: 'snow-block',         value:  1, title: 'Snow Block',         symbol: '🧊', color: '#B3E5FC' },
  'snow-pile':         { type: 'snow-pile',          value:  1, title: 'Snow Pile',          symbol: '❄',  color: '#90CAF9' },
  'snow-sphere':       { type: 'snow-sphere',        value:  1, title: 'Snow Sphere',        symbol: '🔵', color: '#64B5F6' },
  'snowballs':         { type: 'snowballs',          value:  1, title: 'Snowballs',          symbol: '⛄',  color: '#4FC3F7' },
  'unobtainium':       { type: 'unobtainium',        value: 10, title: 'Unobtainium',        symbol: '💎', color: '#E91E63' },
  'wishalloy':         { type: 'wishalloy',          value: 15, title: 'Wishalloy',          symbol: '✨', color: '#B8860B' },
  // Units
  'astronaut': { type: 'astronaut', title: 'Astronaut', symbol: '🧑‍🚀', color: '#5C85B4' },
};

/** Groups a card type belongs to, used for recipe ingredient matching. */
export const CARD_GROUPS: Partial<Record<CardType, string[]>> = {
  astronaut: ['people'],
};

let nextId = 1;

export function makeStack(pos: Vec2, cards: Omit<CardData, 'id'>[]): Stack {
  return {
    id: nextId++,
    pos,
    dragging: false,
    isDropTarget: false,
    cards: cards.map((c) => ({ ...c, id: nextId++ })),
    progress: 0,
    progressStartTime: null,
    activeRecipeId: null,
  };
}

/** Create a stack from CardData objects that already have IDs (e.g. when peeling or splitting). */
export function makeStackFromCards(pos: Vec2, cards: CardData[]): Stack {
  return {
    id: nextId++,
    pos,
    dragging: false,
    isDropTarget: false,
    cards,
    progress: 0,
    progressStartTime: null,
    activeRecipeId: null,
  };
}

/** Create a new card of the given type with a fresh ID, using catalog display data. */
export function makeCardOfType(type: CardType): CardData {
  return { ...CARD_CATALOG[type], id: nextId++ };
}

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

export function makeBoard(
  name: string,
  stacks: Stack[],
  width: number,
  height: number,
  currency: number = 0,
  shop: Omit<ShopItem, 'id'>[] = [],
): Board {
  return {
    id: nextId++,
    name,
    stacks,
    width,
    height,
    currency,
    shop: shop.map((item) => ({ ...item, id: nextId++ })),
  };
}

export const initialBoards: Board[] = [
  makeBoard(
    'Board 1',
    [
      makeStack({ x: 80, y: 56 }, [CARD_CATALOG['astronaut']]),
    ],
    176,
    112,
    3,
    [
      { cardType: 'crust-chunk', price: 3, symbol: '🪨', label: 'Crust Chunk', color: '#8B7355' },
    ],
  ),
];
