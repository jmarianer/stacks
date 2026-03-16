import { type CardType, type CardData, type Stack, type Board, type ShopItem } from '$lib/cards';
import type { Vec2 } from '$lib/utils/vec2';

export type CardDef = {
  title: string;
  symbol?: string; // fallback emoji, used when no image is available
  image?: string; // path to SVG under /cards/
  color: string;
  value?: number; // coin value; undefined = not sellable
  usesInitial?: number; // starting usesRemaining when a card is created; undefined = single-use
  energyValueInitial?: number; // starting energy units (energy cells only); can be partially consumed
};

export const CARD_CATALOG: Record<CardType, CardDef> = {
  // Resources
  'alien-parts': { title: 'Alien Parts', image: 'alien-parts.svg', color: '#69F0AE', value: 15 },
  biomass: { title: 'Biomass', image: 'biomass.svg', color: '#4A7C3F', value: 1 },
  'energy-cell': {
    title: 'Energy Cell',
    image: 'energy-cell.svg',
    color: '#F4C430',
    value: 1,
    energyValueInitial: 1,
  },
  'multi-cell': {
    title: 'Multi-Cell',
    image: 'multi-cell.svg',
    color: '#FFB300',
    value: 4,
    energyValueInitial: 4,
  },
  'mega-cell': {
    title: 'Mega-Cell',
    image: 'mega-cell.svg',
    color: '#FF6F00',
    value: 16,
    energyValueInitial: 16,
  },
  computronium: { title: 'Computronium', image: 'computronium.svg', color: '#3F51B5', value: 10 },
  'crust-chunk': { title: 'Crust Chunk', image: 'crust-chunk.svg', color: '#8B7355', value: 1 },
  'dark-matter': { title: 'Dark Matter', image: 'dark-matter.svg', color: '#4A148C', value: 15 },
  'dark-matter-chunk': {
    title: 'Dark Matter Chunk',
    image: 'dark-matter-chunk.svg',
    color: '#6A1B9A',
    value: 5,
  },
  electronics: { title: 'Electronics', image: 'electronics.svg', color: '#00ACC1', value: 3 },
  'fossil-regolith': {
    title: 'Fossil Regolith',
    image: 'fossil-regolith.svg',
    color: '#A1887F',
    value: 1,
  },
  helium3: { title: 'Helium-3', image: 'helium3.svg', color: '#87CEEB', value: 1 },
  'higgs-boson': { title: 'Higgs Boson', image: 'higgs-boson.svg', color: '#9E9E9E', value: 1 },
  nanocarbon: { title: 'Nanocarbon', image: 'nanocarbon.svg', color: '#212121', value: 2 },
  plasteel: { title: 'Plasteel', image: 'plasteel.svg', color: '#607D8B', value: 2 },
  'plasteel-deposit': {
    title: 'Plasteel Deposit',
    image: 'plasteel-deposit.svg',
    color: '#455A64',
    value: 1,
    usesInitial: 3,
  },
  'snow-block': { title: 'Snow Block', image: 'snow-block.svg', color: '#B3E5FC', value: 1 },
  'snow-pile': { title: 'Snow Pile', image: 'snow-pile.svg', color: '#90CAF9', value: 1 },
  'snow-sphere': { title: 'Snow Sphere', image: 'snow-sphere.svg', color: '#64B5F6', value: 1 },
  snowballs: { title: 'Snowballs', image: 'snowballs.svg', color: '#4FC3F7', value: 1 },
  unobtainium: { title: 'Unobtainium', image: 'unobtainium.svg', color: '#E91E63', value: 10 },
  wishalloy: { title: 'Wishalloy', image: 'wishalloy.svg', color: '#B8860B', value: 15 },
  // Ideas (no SVG available — keep emoji)
  'idea-workbench': { title: 'Idea: Workbench', symbol: '💡', color: '#827717' },
  'idea-service-drone': { title: 'Idea: Drone', symbol: '💡', color: '#827717' },
  'idea-solar-panel': { title: 'Idea: Solar Panel', symbol: '💡', color: '#827717' },
  'idea-electronics': { title: 'Idea: Electronics', symbol: '💡', color: '#827717' },
  // Units
  astronaut: { title: 'Astronaut', image: 'astronaut.svg', color: '#5C85B4' },
  'service-drone-1': { title: 'Service Drone', image: 'service-drone-1.svg', color: '#546E7A' },
  // Buildings
  workbench: { title: 'Workbench', image: 'workbench.svg', color: '#795548', value: 5 },
  'solar-panel': { title: 'Solar Panel', image: 'solar-panel.svg', color: '#F57F17', value: 5 },
};

/** Groups a card type belongs to, used for recipe ingredient matching. */
export const CARD_GROUPS: Partial<Record<CardType, string[]>> = {
  astronaut: ['people'],
  'service-drone-1': ['people'],
};

let nextId = 1;

export function makeCardOfType(type: CardType): CardData {
  const def = CARD_CATALOG[type];
  return {
    id: nextId++,
    type,
    ...(def.usesInitial !== undefined ? { usesRemaining: def.usesInitial } : {}),
    ...(def.energyValueInitial !== undefined ? { energyRemaining: def.energyValueInitial } : {}),
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

/** Add a card of `type` to the first existing stack that already contains that type,
 *  or create a new stack at `fallbackPos` if none exists. */
export function addCardToMatchingStack(stacks: Stack[], type: CardType, fallbackPos: Vec2): void {
  const existing = stacks.find((s) => s.cards.some((c) => c.type === type));
  if (existing) {
    existing.cards.push(makeCardOfType(type));
  } else {
    stacks.push(makeStack(fallbackPos, [type]));
  }
}

export function makeBoard(
  name: string,
  stacks: Stack[],
  width: number,
  height: number,
  currency: number = 0,
  shop: Omit<ShopItem, 'id'>[] = [],
  knownRecipeIds: string[] = [],
): Board {
  return {
    id: nextId++,
    name,
    stacks,
    width,
    height,
    currency,
    shop: shop.map((item) => ({ ...item, id: nextId++ })),
    knownRecipeIds,
    paused: false,
    pausedAt: null,
    sol: 1,
    solStartTime: null,
    endOfSol: false,
    endOfSolAt: null,
    lastSolFeed: null,
  };
}

export const initialBoards: Board[] = [
  makeBoard(
    'Board 1',
    [
      makeStack({ x: 20, y: 8 }, ['astronaut']),
      makeStack({ x: 50, y: 8 }, ['idea-workbench']),
      makeStack({ x: 80, y: 8 }, ['idea-service-drone']),
      makeStack({ x: 110, y: 8 }, ['idea-solar-panel']),
      makeStack({ x: 140, y: 8 }, ['idea-electronics']),
      makeStack({ x: 20, y: 48 }, ['crust-chunk', 'crust-chunk', 'crust-chunk']),
      makeStack({ x: 50, y: 48 }, ['plasteel', 'plasteel', 'nanocarbon', 'nanocarbon']),
      makeStack({ x: 80, y: 48 }, ['helium3', 'helium3', 'biomass']),
      makeStack({ x: 110, y: 48 }, ['energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [{ cardType: 'crust-chunk', price: 3, symbol: '🪨', label: 'Crust Chunk', color: '#8B7355' }],
    [
      'punch-crust-chunk',
      'punch-plasteel-deposit',
    //   'punch-dark-matter-chunk',
      'punch-fossil-regolith',
      'make-energy-cell',
      'make-multi-cell',
      'make-mega-cell',
    //   'make-snow-sphere',
    //   'make-snowballs',
    ],
  ),
];
