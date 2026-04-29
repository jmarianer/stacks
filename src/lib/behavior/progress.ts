import { recipes } from '$lib/data/recipes';
import { MILESTONES } from '$lib/data/milestones';
import type { Stack, Board, CardData, Connection } from '$lib/types/game-state';
import { hpMaxFromStats, type CardDef } from '$lib/types/card-types';
import type { RecipeResult, IngredientMatcher } from '$lib/types/recipe-types';
import type { Vec2 } from '$lib/utils/vec2';
import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
import {
  makeCardOfType,
  makeReviveCard,
  makeStack,
  makeStackFromCards,
  makeTeleportCard,
} from '$lib/utils/card-factories';
import type { Recipe } from '$lib/types/recipe-types';
import { maxBandAids, maxUniKits } from '$lib/utils/unit-stats';
import type { GameState } from '$lib/types/game-state';

function isCardType(s: string): s is CardType {
  return s in CARD_CATALOG;
}

function cardMatchesIngredient(type: CardType, match: IngredientMatcher): boolean {
  if (type === match) return true;
  return CARD_CATALOG[type].groups?.includes(match) ?? false;
}

export function matchRecipe(stack: Stack, knownRecipeIds: string[]): Recipe | null {
  if (stack.cards.some((c) => c.type === 'teleport')) return null;
  // Foundation cards are transparent to recipe matching — they act as a base, not an ingredient
  const cards = stack.cards.filter((c) => c.type !== 'foundation');
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
      for (let i = 0; i < cards.length; i++) {
        if (!used.has(i) && cardMatchesIngredient(cards[i].type, ing.match)) {
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

  if (!best) return null;

  // For equip recipes, block if the unit's inventory is already full
  const unit = cards.find((c) => c.unitStats && !CARD_CATALOG[c.type].enemy);
  for (const result of best.recipe.results) {
    if (result.action === 'equip-weapon') {
      if (!unit) return null;
      const slots = CARD_CATALOG[unit.type].playerUnit?.weaponSlots ?? 0;
      if ((unit.weaponInventory?.length ?? 0) >= slots) return null;
    }
    if (result.action === 'equip-band-aid') {
      if (!unit?.unitStats) return null;
      if ((unit.bandAids ?? 0) >= maxBandAids(unit.unitStats)) return null;
    }
    if (result.action === 'equip-uni-kit') {
      if (!unit?.unitStats) return null;
      if ((unit.uniKits ?? 0) >= maxUniKits(unit.unitStats)) return null;
    }
  }

  return best.recipe;
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

function dropCard(type: string, stacks: Stack[], pos: Vec2, connections: Connection[]): void {
  if (!isCardType(type)) return;
  if (connections.length > 0) {
    const conn = connections.find((c) => c.filter === type) ?? connections.find((c) => !c.filter);
    if (conn) {
      const dest = stacks.find((s) => s.id === conn.toId);
      if (dest) {
        dest.cards.push(makeCardOfType(type));
        return;
      }
    }
  }
  stacks.push(makeStack(pos, [type]));
}

function applyCardOutputs(results: RecipeResult[], board: Board, stack: Stack): void {
  const connections = board.connections.filter((c) => c.fromId === stack.id);
  const dropPos = { x: stack.pos.x + 2, y: stack.pos.y + 2 };
  for (const result of results) {
    if (result.action === 'card') {
      if (result.chance !== undefined && Math.random() * 100 > result.chance) continue;
      dropCard(result.card, board.stacks, dropPos, connections);
    } else if (result.action === 'weighted') {
      dropCard(weightedRandom(result.cards), board.stacks, dropPos, connections);
    } else if (result.action === 'spawn-enemies') {
      if (isCardType(result.enemyType)) {
        for (let i = 0; i < result.count; i++) {
          const pos = {
            x: Math.random() * (board.width - 24) + 12,
            y: Math.random() * (board.height - 24) + 12,
          };
          board.stacks.push(makeStackFromCards(pos, [makeCardOfType(result.enemyType)]));
        }
      }
    }
  }
}

function applyBoardEffects(results: RecipeResult[], board: Board, gameState: GameState): void {
  for (const result of results) {
    if (result.action === 'unlock-recipe') {
      if (!gameState.knownRecipeIds.includes(result.recipeId)) {
        gameState.knownRecipeIds.push(result.recipeId);
      }
    } else if (result.action === 'discover-board') {
      const target = gameState.boards.find((b) => b.name === result.boardName);
      const prereqMet =
        !result.prerequisite ||
        gameState.boards.find((b) => b.name === result.prerequisite)?.discovered;
      if (target && !target.discovered && prereqMet && Math.random() * 100 < result.chance) {
        target.discovered = true;
        const card = makeTeleportCard(gameState.boards.indexOf(target), target.name);
        board.stacks.push(makeStackFromCards({ x: board.width / 2, y: board.height / 2 }, [card]));
      }
    } else if (result.action === 'expand-board') {
      board.width += result.dWidth;
      board.height += result.dHeight;
    }
  }
}

function applyUnitMutations(
  results: RecipeResult[],
  stack: Stack,
  consumedCards: CardData[],
): void {
  for (const result of results) {
    if (result.action === 'heal-unit') {
      const unit = stack.cards.find((c) => c.unitStats);
      if (unit?.unitStats) {
        const max = hpMaxFromStats(unit.unitStats);
        unit.unitStats.health = Math.min(unit.unitStats.health + result.amount, max);
      }
    } else if (result.action === 'revive-unit') {
      const savedTombstone = consumedCards.find((c) => c.type === 'tombstone') ?? null;
      if (savedTombstone) {
        const revived = makeReviveCard(savedTombstone);
        stack.cards.push(revived);
      }
    } else if (result.action === 'train-stat') {
      const unit = stack.cards.find((c) => c.unitStats);
      if (unit?.unitStats) {
        const oldHpMax = hpMaxFromStats(unit.unitStats);
        unit.unitStats[result.stat] += result.amount;
        const newHpMax = hpMaxFromStats(unit.unitStats);
        unit.unitStats.health = Math.min(unit.unitStats.health + (newHpMax - oldHpMax), newHpMax);
      }
    } else if (result.action === 'equip-weapon') {
      const unit = stack.cards.find((c) => c.unitStats && !(CARD_CATALOG[c.type] as CardDef).enemy);
      const weaponCard = consumedCards.find((c) => CARD_CATALOG[c.type].groups?.includes('weapon'));
      if (unit && weaponCard) {
        unit.weaponInventory = [...(unit.weaponInventory ?? []), weaponCard.type];
      }
    } else if (result.action === 'equip-band-aid') {
      const unit = stack.cards.find((c) => c.unitStats && !(CARD_CATALOG[c.type] as CardDef).enemy);
      if (unit) unit.bandAids = (unit.bandAids ?? 0) + 1;
    } else if (result.action === 'equip-uni-kit') {
      const unit = stack.cards.find((c) => c.unitStats && !(CARD_CATALOG[c.type] as CardDef).enemy);
      if (unit) unit.uniKits = (unit.uniKits ?? 0) + 1;
    }
  }
}

export function applyResults(
  results: RecipeResult[],
  board: Board,
  gameState: GameState,
  stack: Stack,
  consumedCards: CardData[] = [],
): void {
  applyCardOutputs(results, board, stack);
  applyBoardEffects(results, board, gameState);
  applyUnitMutations(results, stack, consumedCards);
}

function executeRecipe(board: Board, gameState: GameState, stack: Stack, recipe: Recipe): void {
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

  // Save consumed card data before removal (needed for revive-unit and equip-weapon results)
  const consumedCards = Array.from(consumed, (i) => stack.cards[i]);

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

  if (!gameState.usedRecipeIds.includes(recipe.id)) {
    gameState.usedRecipeIds.push(recipe.id);
  }
  applyResults(recipe.results, board, gameState, stack, consumedCards);

  if (stack.cards.length === 0) {
    stacks.splice(stacks.indexOf(stack), 1);
  }
}

export function checkMilestones(gameState: GameState, currentBoard: Board): void {
  for (const milestone of MILESTONES) {
    if (gameState.clock.firedMilestones.includes(milestone.id)) continue;
    if (!milestone.condition(gameState)) continue;
    gameState.clock.firedMilestones.push(milestone.id);
    for (const id of milestone.unlockRecipeIds ?? []) {
      if (!gameState.knownRecipeIds.includes(id)) gameState.knownRecipeIds.push(id);
    }
    for (const card of milestone.createCards ?? []) {
      currentBoard.stacks.push(
        makeStack({ x: currentBoard.width / 2, y: currentBoard.height / 2 }, [card]),
      );
    }
  }
}

/** Advance recipe progress on a single board. */
export function tick(board: Board, gameState: GameState, now: number): void {
  const stacks = board.stacks;
  const toExecute: { stack: Stack; recipe: Recipe }[] = [];

  for (const stack of stacks) {
    const recipe = matchRecipe(stack, gameState.knownRecipeIds);
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
      // Intelligence speeds up crafting: each point above 1 gives +10% speed
      const intel = stack.cards.reduce(
        (best, c) => Math.max(best, c.unitStats?.intelligence ?? 0),
        0,
      );
      const effectiveTime = recipe.time / (intel > 0 ? 1 + (intel - 1) * 0.1 : 1);
      stack.progress = Math.min((now - stack.progressStartTime!) / effectiveTime, 1);
      if (stack.progress >= 1) toExecute.push({ stack, recipe });
    }
  }

  for (const { stack, recipe } of toExecute) {
    executeRecipe(board, gameState, stack, recipe);
  }
}
