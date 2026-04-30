import { type UnitStats, hpMaxFromStats, type CardDef } from '$lib/types/card-types';
import type { CardData, Stack, Board, Clock } from '$lib/types/game-state';
import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
import type { Vec2 } from '$lib/utils/vec2';

let nextId = 1;

export function setNextId(n: number) {
  nextId = n;
}

export function makeCardOfType(type: CardType): CardData {
  const def: CardDef = CARD_CATALOG[type];
  let unitStats: UnitStats | undefined;
  const unitBase = def.enemy?.unitStats ?? def.playerUnit?.unitStats;
  if (unitBase) unitStats = { ...unitBase, health: hpMaxFromStats(unitBase) };
  return {
    id: nextId++,
    type,
    ...(def.usesInitial !== undefined ? { usesRemaining: def.usesInitial } : {}),
    ...(def.energyValueInitial !== undefined ? { energyRemaining: def.energyValueInitial } : {}),
    ...(unitStats ? { unitStats } : {}),
  };
}

export function makeTeleportCard(targetBoardIndex: number, targetBoardName: string): CardData {
  return { id: nextId++, type: 'teleport', label: `→ ${targetBoardName}`, targetBoardIndex };
}

/** Restore the unit that died — creates a card of the original type with the tombstone's saved stats. */
export function makeReviveCard(tombstone: CardData): CardData {
  const unitType = tombstone.tombstoneOf ?? 'astronaut';
  const card = makeCardOfType(unitType);
  if (tombstone.unitStats) {
    card.unitStats = { ...tombstone.unitStats, health: hpMaxFromStats(tombstone.unitStats) };
  }
  if (tombstone.weaponInventory) card.weaponInventory = [...tombstone.weaponInventory];
  if (tombstone.bandAids !== undefined) card.bandAids = tombstone.bandAids;
  if (tombstone.uniKits !== undefined) card.uniKits = tombstone.uniKits;
  return card;
}

export function makeTombstoneCard(fromCard: CardData): CardData {
  return {
    id: nextId++,
    type: 'tombstone',
    label: `† ${CARD_CATALOG[fromCard.type].title}`,
    tombstoneOf: fromCard.type,
    unitStats: fromCard.unitStats,
    ...(fromCard.weaponInventory ? { weaponInventory: [...fromCard.weaponInventory] } : {}),
    ...(fromCard.bandAids !== undefined ? { bandAids: fromCard.bandAids } : {}),
    ...(fromCard.uniKits !== undefined ? { uniKits: fromCard.uniKits } : {}),
  };
}

export function makeStack(pos: Vec2, types: CardType[]): Stack {
  return {
    id: nextId++,
    pos,
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
    cards,
    progress: 0,
    progressStartTime: null,
    activeRecipeId: null,
  };
}

export function makeClock(): Clock {
  return {
    sol: 1,
    solStartTime: null,
    endOfSol: false,
    lastSolFeeds: [],
    speed: 1,
    lastActiveSpeed: 1,
    vTime: 0,
    vTimeAt: null,
    firedMilestones: [],
  };
}

export function makeBoard(
  name: string,
  stacks: Stack[],
  width: number,
  height: number,
  discovered: boolean = false,
): Board {
  return {
    id: nextId++,
    name,
    stacks,
    width,
    height,
    discovered,
    connections: [],
  };
}
