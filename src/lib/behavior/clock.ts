import type { Board, CardData, Clock, SolFeedResult } from '$lib/types/board-types';
import type { CardDef } from '$lib/types/card-types';
import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
import { makeTombstoneCard, makeStackFromCards } from '$lib/utils/card-factories';
import { SOL_DURATION } from '$lib/data/constants';

function feedUnits(board: Board): SolFeedResult {
  // Tally available energy
  let energyPool = 0;
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (card.energyRemaining !== undefined) energyPool += card.energyRemaining;
    }
  }

  // Collect units sorted by priority (lower = fed first)
  const units: { card: CardData; cost: number; priority: number }[] = [];
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      const feed = (CARD_CATALOG[card.type] as CardDef).feed;
      if (feed) units.push({ card, ...feed });
    }
  }
  units.sort((a, b) => {
    return a.priority - b.priority;
  });

  // Feed in priority order; starved units die
  const dead = new Set<number>();
  let needed = 0;
  let consumed = 0;
  for (const { card, cost } of units) {
    needed += cost;
    if (energyPool >= cost) {
      energyPool -= cost;
      consumed += cost;
    } else {
      dead.add(card.id);
    }
  }

  // Consume energy cells (smallest first)
  const energyCards: { card: CardData }[] = [];
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (card.energyRemaining !== undefined) energyCards.push({ card });
    }
  }
  energyCards.sort((a, b) => a.card.energyRemaining! - b.card.energyRemaining!);

  let toConsume = consumed;
  const depleted = new Set<number>();
  for (const { card } of energyCards) {
    if (toConsume <= 0) break;
    const available = card.energyRemaining!;
    if (available <= toConsume) {
      toConsume -= available;
      depleted.add(card.id);
    } else {
      card.energyRemaining = available - toConsume;
      toConsume = 0;
    }
  }

  // Collect dead unit positions before removing them
  const deadUnits: { card: CardData; pos: { x: number; y: number } }[] = [];
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (dead.has(card.id)) deadUnits.push({ card, pos: { ...stack.pos } });
    }
    stack.cards = stack.cards.filter((c) => !depleted.has(c.id) && !dead.has(c.id));
  }
  board.stacks = board.stacks.filter((s) => s.cards.length > 0);

  // Drop a tombstone at each dead unit's last position
  for (const { card, pos } of deadUnits) {
    board.stacks.push(makeStackFromCards(pos, [makeTombstoneCard(card)]));
  }

  const deathTally = new Map<CardType, number>();
  for (const { card } of units) {
    if (dead.has(card.id)) deathTally.set(card.type, (deathTally.get(card.type) ?? 0) + 1);
  }
  const deaths = [...deathTally.entries()].map(([type, count]) => ({ type, count }));

  return { needed, provided: consumed, deaths };
}

/** Returns the current virtual time, which advances at clock.speed per real ms. */
export function getVirtualNow(clock: Clock, realNow: number): number {
  if (clock.vTimeAt === null || clock.speed === 0 || clock.endOfSol) return clock.vTime;
  return clock.vTime + (realNow - clock.vTimeAt) * clock.speed;
}

/** Change speed (0=pause, 1/2/3=active). Syncs virtual clock before switching. */
export function setSpeed(clock: Clock, newSpeed: number): void {
  const realNow = performance.now();
  clock.vTime = getVirtualNow(clock, realNow);
  clock.vTimeAt = realNow;
  if (newSpeed > 0) clock.lastActiveSpeed = newSpeed;
  clock.speed = newSpeed;
}

/** Advance the global sol timer; feed all boards when sol ends. */
export function tickClock(clock: Clock, boards: Board[], realNow: number): void {
  if (clock.endOfSol) return;
  if (clock.speed === 0) return;
  if (clock.vTimeAt === null) clock.vTimeAt = realNow;

  const now = getVirtualNow(clock, realNow);

  if (clock.solStartTime === null) {
    clock.solStartTime = now;
  } else if (now - clock.solStartTime >= SOL_DURATION) {
    clock.lastSolFeeds = boards.map((b) => ({ boardName: b.name, ...feedUnits(b) }));
    clock.vTime = now;
    clock.vTimeAt = realNow;
    clock.endOfSol = true;
    clock.endOfSolAt = realNow;
  }
}
