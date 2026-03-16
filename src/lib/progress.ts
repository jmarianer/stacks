import { recipes } from '$lib/recipes';
import { type Stack, type CardType, type Board, type CardData } from '$lib/cards';
import { CARD_CATALOG, CARD_GROUPS, addCardToMatchingStack } from '$lib/card-catalog';
import type { Recipe } from '$lib/recipe-types';

export const SOL_DURATION = 2 * 60 * 1000; // 2 minutes in ms

// Lower priority number = fed first
export const UNIT_FEED: Partial<Record<CardType, { cost: number; priority: number }>> = {
  astronaut: { cost: 2, priority: 2 },
  'service-drone-1': { cost: 1, priority: 6 },
};

function feedUnits(board: Board): void {
  // Tally available energy
  let energyPool = 0;
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (card.energyRemaining !== undefined) energyPool += card.energyRemaining;
    }
  }

  // Collect units sorted by priority (lower = fed first)
  const units: { card: CardData; cost: number }[] = [];
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      const feed = UNIT_FEED[card.type];
      if (feed) units.push({ card, cost: feed.cost });
    }
  }
  units.sort((a, b) => {
    const pa = UNIT_FEED[a.card.type]!.priority;
    const pb = UNIT_FEED[b.card.type]!.priority;
    return pa - pb;
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

  // Remove depleted cells and dead units; prune empty stacks
  for (const stack of board.stacks) {
    stack.cards = stack.cards.filter((c) => !depleted.has(c.id) && !dead.has(c.id));
  }
  board.stacks = board.stacks.filter((s) => s.cards.length > 0);

  const deathTally = new Map<CardType, number>();
  for (const { card } of units) {
    if (dead.has(card.id)) deathTally.set(card.type, (deathTally.get(card.type) ?? 0) + 1);
  }
  const deaths = [...deathTally.entries()].map(([type, count]) => ({ type, count }));

  board.lastSolFeed = { needed, provided: consumed, deaths };
}

function isCardType(s: string): s is CardType {
  return s in CARD_CATALOG;
}

function cardMatchesIngredient(type: CardType, match: string): boolean {
  if (type === match) return true;
  return CARD_GROUPS[type]?.includes(match) ?? false;
}

function matchRecipe(stack: Stack, knownRecipeIds: string[]): Recipe | null {
  // Among all matching recipes, prefer the one whose highest-indexed matched card
  // is lowest (uses the bottom of the stack most tightly). Break ties by preferring
  // the recipe with more total ingredients (avoids a subset recipe winning over a
  // superset recipe when both reach the same max index).
  let best: { recipe: Recipe; maxIdx: number; total: number } | null = null;

  outer: for (const recipe of recipes) {
    if (!recipe.alwaysKnown && !knownRecipeIds.includes(recipe.id)) continue;
    const used = new Set<number>();
    let maxIdx = -1;
    for (const ing of recipe.ingredients) {
      const need = ing.count ?? 1;
      let found = 0;
      for (let i = 0; i < stack.cards.length; i++) {
        if (!used.has(i) && cardMatchesIngredient(stack.cards[i].type, ing.match)) {
          used.add(i);
          if (i > maxIdx) maxIdx = i;
          if (++found >= need) break;
        }
      }
      if (found < need) continue outer;
    }
    const total = recipe.ingredients.reduce((s, ing) => s + (ing.count ?? 1), 0);
    if (best === null || maxIdx < best.maxIdx || (maxIdx === best.maxIdx && total > best.total)) {
      best = { recipe, maxIdx, total };
    }
  }

  return best?.recipe ?? null;
}

function weightedRandom(cards: Record<string, number>): string {
  const total = Object.values(cards).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [type, weight] of Object.entries(cards)) {
    r -= weight;
    if (r <= 0) return type;
  }
  return Object.keys(cards)[0];
}

function executeRecipe(board: Board, stack: Stack, recipe: Recipe): void {
  const stacks = board.stacks;
  const consumed = new Set<number>();
  for (const ing of recipe.ingredients) {
    if (!ing.consumed) continue;
    let need = ing.count ?? 1;
    for (let i = 0; i < stack.cards.length && need > 0; i++) {
      if (!consumed.has(i) && cardMatchesIngredient(stack.cards[i].type, ing.match)) {
        consumed.add(i);
        need--;
      }
    }
  }

  const fullyConsumed = new Set<number>();
  for (const idx of consumed) {
    const card = stack.cards[idx];
    if (card.usesRemaining !== undefined) {
      card.usesRemaining -= 1;
      if (card.usesRemaining <= 0) fullyConsumed.add(idx);
    } else {
      fullyConsumed.add(idx);
    }
  }
  stack.cards = stack.cards.filter((_, i) => !fullyConsumed.has(i));
  stack.progress = 0;
  stack.progressStartTime = null;
  stack.activeRecipeId = null;

  let offset = 0;
  for (const result of recipe.results) {
    if (result.action === 'unlock-recipe') {
      if (!board.knownRecipeIds.includes(result.recipeId)) {
        board.knownRecipeIds.push(result.recipeId);
      }
      continue;
    }
    let type: string | null = null;
    if (result.action === 'card') {
      if (result.chance !== undefined && Math.random() * 100 > result.chance) continue;
      type = result.card;
    } else if (result.action === 'weighted') {
      type = weightedRandom(result.cards);
    }
    if (!type || !isCardType(type)) continue;
    addCardToMatchingStack(stacks, type, {
      x: stack.pos.x + offset * 2,
      y: stack.pos.y + offset * 2,
    });
    offset++;
  }

  if (stack.cards.length === 0) {
    stacks.splice(stacks.indexOf(stack), 1);
  }
}

type Milestone = {
  id: string;
  condition: (board: Board) => boolean;
  unlockRecipeIds: string[];
  notificationCard: CardType; // dropped as a cosmetic $1 card when milestone fires
};

const MILESTONES: Milestone[] = [
  {
    id: 'first-plasteel',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'plasteel')),
    unlockRecipeIds: ['build-solar-panel'],
    notificationCard: 'idea-solar-panel',
  },
  {
    id: 'sol-2',
    condition: (b) => b.sol >= 2,
    unlockRecipeIds: ['make-service-drone'],
    notificationCard: 'idea-service-drone',
  },
  {
    id: 'three-plasteel-sol-3',
    condition: (b) =>
      b.sol >= 3 &&
      b.stacks.flatMap((s) => s.cards).filter((c) => c.type === 'plasteel').length >= 3,
    unlockRecipeIds: ['build-workbench'],
    notificationCard: 'idea-workbench',
  },
  {
    id: 'first-workbench',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'workbench')),
    unlockRecipeIds: ['make-electronics'],
    notificationCard: 'idea-electronics',
  },
  {
    id: 'first-electronics',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'electronics')),
    unlockRecipeIds: ['build-drill'],
    notificationCard: 'idea-drill',
  },
  {
    id: 'first-drill',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'drill')),
    unlockRecipeIds: ['build-adv-workbench'],
    notificationCard: 'idea-adv-workbench',
  },
  {
    id: 'first-adv-workbench',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'adv-workbench')),
    unlockRecipeIds: ['build-power-station'],
    notificationCard: 'idea-power-station',
  },
  {
    id: 'first-power-station',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'power-station')),
    unlockRecipeIds: ['build-cloning-chamber'],
    notificationCard: 'idea-cloning-chamber',
  },
];

function checkMilestones(board: Board): void {
  for (const milestone of MILESTONES) {
    if (board.firedMilestones.includes(milestone.id)) continue;
    if (!milestone.condition(board)) continue;
    board.firedMilestones.push(milestone.id);
    for (const id of milestone.unlockRecipeIds) {
      if (!board.knownRecipeIds.includes(id)) board.knownRecipeIds.push(id);
    }
    addCardToMatchingStack(board.stacks, milestone.notificationCard, {
      x: board.width / 2,
      y: board.height / 2,
    });
  }
}

/** Returns the current virtual time, which advances at board.speed per real ms. */
export function getVirtualNow(board: Board, realNow: number): number {
  if (board.vTimeAt === null || board.speed === 0 || board.endOfSol) return board.vTime;
  return board.vTime + (realNow - board.vTimeAt) * board.speed;
}

/** Change speed (0=pause, 1/2/3=active). Syncs virtual clock before switching. */
export function setSpeed(board: Board, realNow: number, newSpeed: number): void {
  board.vTime = getVirtualNow(board, realNow);
  board.vTimeAt = realNow;
  if (newSpeed > 0) board.lastActiveSpeed = newSpeed;
  board.speed = newSpeed;
}

export function tick(board: Board, realNow: number): void {
  if (board.endOfSol) return;
  if (board.speed === 0) return;

  // Start virtual clock on first tick
  if (board.vTimeAt === null) board.vTimeAt = realNow;

  const now = getVirtualNow(board, realNow);

  // Sol timer
  if (board.solStartTime === null) {
    board.solStartTime = now;
  } else if (now - board.solStartTime >= SOL_DURATION) {
    feedUnits(board);
    // Sync vTime to current virtual time before freezing, so continueSol
    // restarts the clock from the correct position.
    board.vTime = now;
    board.vTimeAt = realNow;
    board.endOfSol = true;
    board.endOfSolAt = realNow;
    return;
  }
  checkMilestones(board);
  const stacks = board.stacks;
  const toExecute: { stack: Stack; recipe: Recipe }[] = [];

  for (const stack of stacks) {
    const recipe = matchRecipe(stack, board.knownRecipeIds);
    if (!recipe) {
      stack.progress = 0;
      stack.progressStartTime = null;
      stack.activeRecipeId = null;
      continue;
    }

    if (recipe.id !== stack.activeRecipeId) {
      stack.activeRecipeId = recipe.id;
      stack.progressStartTime = now;
      stack.progress = 0;
    } else {
      stack.progress = Math.min((now - stack.progressStartTime!) / recipe.time, 1);
      if (stack.progress >= 1) toExecute.push({ stack, recipe });
    }
  }

  for (const { stack, recipe } of toExecute) {
    executeRecipe(board, stack, recipe);
  }
}
