import type { UnitStats } from '$lib/types/card-types';
import { hpMaxFromStats } from '$lib/types/card-types';
import type { CardData, Stack, Board, ShopItem, Clock } from '$lib/types/board-types';
import { CARD_CATALOG, type CardType, type CardDef } from '$lib/data/card-defs';
import type { Vec2 } from '$lib/utils/vec2';

let nextId = 1;

export function makeCardOfType(type: CardType): CardData {
  const def: CardDef = CARD_CATALOG[type];
  let unitStats: UnitStats | undefined;
  if (def.enemy) {
    unitStats = { ...def.enemy.unitStats };
  } else if (def.unitStats) {
    unitStats = { ...def.unitStats, health: hpMaxFromStats(def.unitStats) };
  }
  return {
    id: nextId++,
    type,
    ...(def.usesInitial !== undefined ? { usesRemaining: def.usesInitial } : {}),
    ...(def.energyValueInitial !== undefined ? { energyRemaining: def.energyValueInitial } : {}),
    ...(unitStats ? { unitStats } : {}),
  };
}

export function makeIdeaCard(label: string): CardData {
  return { id: nextId++, type: 'idea', label };
}

/** Restore the unit that died — creates a card of the original type with the tombstone's saved stats. */
export function makeReviveCard(tombstone: CardData): CardData {
  const unitType = tombstone.tombstoneOf ?? 'astronaut';
  const card = makeCardOfType(unitType);
  if (tombstone.unitStats) card.unitStats = { ...tombstone.unitStats };
  return card;
}

export function makeTombstoneCard(fromCard: CardData): CardData {
  return {
    id: nextId++,
    type: 'tombstone',
    label: `† ${CARD_CATALOG[fromCard.type].title}`,
    tombstoneOf: fromCard.type,
    unitStats: fromCard.unitStats,
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
