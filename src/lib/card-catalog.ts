import { type CardType, type CardData, type Stack, type Board, type ShopItem } from '$lib/cards';
import type { Vec2 } from '$lib/utils/vec2';

export type CardDef = {
  title: string;
  symbol: string;
  color: string;
  value?: number;      // coin value; undefined = not sellable
  usesInitial?: number; // starting usesRemaining when a card is created; undefined = infinite
};

export const CARD_CATALOG: Record<CardType, CardDef> = {
  // Resources
  'alien-parts':       { title: 'Alien Parts',        symbol: '👾', color: '#69F0AE', value: 15 },
  'biomass':           { title: 'Biomass',            symbol: '🌿', color: '#4A7C3F', value:  1 },
  'energy-cell':       { title: 'Energy Cell',        symbol: '⚡', color: '#F4C430', value:  1, usesInitial: 1 },
  'multi-cell':        { title: 'Multi-Cell',         symbol: '⚡', color: '#FFB300', value:  4, usesInitial: 4 },
  'mega-cell':         { title: 'Mega-Cell',          symbol: '⚡', color: '#FF6F00', value: 16, usesInitial: 16 },
  'computronium':      { title: 'Computronium',       symbol: '🧠', color: '#3F51B5', value: 10 },
  'crust-chunk':       { title: 'Crust Chunk',        symbol: '🪨', color: '#8B7355', value:  1 },
  'dark-matter':       { title: 'Dark Matter',        symbol: '🌑', color: '#4A148C', value: 15 },
  'dark-matter-chunk': { title: 'Dark Matter Chunk',  symbol: '🌑', color: '#6A1B9A', value:  5 },
  'electronics':       { title: 'Electronics',        symbol: '💡', color: '#00ACC1', value:  3 },
  'fossil-regolith':   { title: 'Fossil Regolith',    symbol: '🦴', color: '#A1887F', value:  1 },
  'helium3':           { title: 'Helium-3',           symbol: '☁',  color: '#87CEEB', value:  1 },
  'higgs-boson':       { title: 'Higgs Boson',        symbol: '⚛',  color: '#9E9E9E', value:  1 },
  'nanocarbon':        { title: 'Nanocarbon',         symbol: '◼',  color: '#212121', value:  2 },
  'plasteel':          { title: 'Plasteel',           symbol: '🔩', color: '#607D8B', value:  2 },
  'plasteel-deposit':  { title: 'Plasteel Deposit',   symbol: '⛏',  color: '#455A64', value:  1, usesInitial: 3 },
  'snow-block':        { title: 'Snow Block',         symbol: '🧊', color: '#B3E5FC', value:  1 },
  'snow-pile':         { title: 'Snow Pile',          symbol: '❄',  color: '#90CAF9', value:  1 },
  'snow-sphere':       { title: 'Snow Sphere',        symbol: '🔵', color: '#64B5F6', value:  1 },
  'snowballs':         { title: 'Snowballs',          symbol: '⛄',  color: '#4FC3F7', value:  1 },
  'unobtainium':       { title: 'Unobtainium',        symbol: '💎', color: '#E91E63', value: 10 },
  'wishalloy':         { title: 'Wishalloy',          symbol: '✨', color: '#B8860B', value: 15 },
  // Units
  'astronaut': { title: 'Astronaut', symbol: '🧑‍🚀', color: '#5C85B4' },
};

/** Groups a card type belongs to, used for recipe ingredient matching. */
export const CARD_GROUPS: Partial<Record<CardType, string[]>> = {
  astronaut: ['people'],
};

let nextId = 1;

export function makeCardOfType(type: CardType): CardData {
  const def = CARD_CATALOG[type];
  return {
    id: nextId++,
    type,
    ...(def.usesInitial !== undefined ? { usesRemaining: def.usesInitial } : {}),
  };
}

export function makeStack(pos: Vec2, types: CardType[]): Stack {
  return {
    id: nextId++,
    pos,
    dragging: false,
    isDropTarget: false,
    cards: types.map(makeCardOfType),
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
    [makeStack({ x: 80, y: 56 }, ['astronaut'])],
    176,
    112,
    3,
    [{ cardType: 'crust-chunk', price: 3, symbol: '🪨', label: 'Crust Chunk', color: '#8B7355' }],
  ),
];
