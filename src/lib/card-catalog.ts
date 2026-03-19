import { type CardData, type Stack, type Board, type ShopItem, type Clock } from '$lib/cards';
import { CARD_CATALOG, type CardType, type CardDef } from '$lib/card-defs';
import type { Vec2 } from '$lib/utils/vec2';

export { CARD_CATALOG };
export type { CardDef };

/** Groups a card type belongs to, used for recipe ingredient matching. */
export const CARD_GROUPS: Partial<Record<CardType, string[]>> = {
  astronaut: ['people'],
  'service-drone-1': ['people'],
};

let nextId = 1;

export function makeCardOfType(type: CardType): CardData {
  const def: CardDef = CARD_CATALOG[type];
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

export function makeClock(): Clock {
  return {
    sol: 1,
    solStartTime: null,
    endOfSol: false,
    endOfSolAt: null,
    lastSolFeeds: [],
    speed: 1,
    lastActiveSpeed: 1,
    vTime: 0,
    vTimeAt: null,
  };
}

export function makeBoard(
  name: string,
  stacks: Stack[],
  width: number,
  height: number,
  currency: number = 0,
  shop: Omit<ShopItem, 'id'>[] = [],
  knownRecipeIds: string[] = [],
  discovered: boolean = false,
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
    firedMilestones: [],
    discovered,
    connections: [],
  };
}

export const initialBoards: Board[] = [
  makeBoard(
    'Base',
    [
      makeStack({ x: 20, y: 42 }, ['astronaut']),
      makeStack({ x: 68, y: 42 }, ['crust-chunk', 'crust-chunk', 'crust-chunk', 'crust-chunk']),
      makeStack({ x: 116, y: 42 }, ['energy-cell', 'energy-cell', 'energy-cell']),
      makeStack({ x: 144, y: 42 }, ['service-drone-1', 'foundation', 'foundation', 'foundation', 'foundation', 'solar-panel']),
    ],
    176,
    112,
    0,
    [{ cardType: 'crust-chunk', price: 3, symbol: '🪨', label: 'Crust Chunk', color: '#8B7355' }],
    [
      'punch-crust-chunk',
      'punch-plasteel-deposit',
      'punch-fossil-regolith',
      'make-energy-cell',
      'make-multi-cell',
      'make-mega-cell',
    ],
    true, // discovered
  ),
  makeBoard(
    'Alien Eggs',
    [
      makeStack({ x: 68, y: 20 }, ['alien-eggs']),
      makeStack({ x: 92, y: 20 }, ['alien-eggs']),
      makeStack({ x: 116, y: 20 }, ['alien-eggs']),
      makeStack({ x: 68, y: 64 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [],
    [],
  ),
  makeBoard(
    'Desert',
    [
      makeStack({ x: 68, y: 20 }, ['cactus']),
      makeStack({ x: 92, y: 20 }, ['cactus']),
      makeStack({ x: 116, y: 20 }, ['cactus']),
      makeStack({ x: 68, y: 64 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [],
    [],
  ),
  makeBoard(
    'Snow',
    [
      makeStack({ x: 68, y: 20 }, ['snow-converter']),
      makeStack({ x: 92, y: 20 }, ['snow-pile']),
      makeStack({ x: 116, y: 20 }, ['snow-pile']),
      makeStack({ x: 68, y: 64 }, ['snow-pile', 'snow-pile']),
      makeStack({ x: 92, y: 64 }, ['snow-pile', 'snow-pile']),
      makeStack({ x: 116, y: 64 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [],
    [],
  ),
  makeBoard(
    'Tres-2b',
    [
      makeStack({ x: 80, y: 42 }, ['drill-tres2b']),
      makeStack({ x: 128, y: 42 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [],
    [],
  ),
  makeBoard(
    'Flowers',
    [
      makeStack({ x: 56, y: 20 }, ['power-flower']),
      makeStack({ x: 80, y: 20 }, ['power-flower']),
      makeStack({ x: 104, y: 20 }, ['power-flower']),
      makeStack({ x: 128, y: 20 }, ['power-flower']),
      makeStack({ x: 56, y: 64 }, ['power-flower']),
      makeStack({ x: 80, y: 64 }, ['power-flower']),
      makeStack({ x: 104, y: 64 }, ['energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [],
    [],
  ),
];
