import { recipes } from '$lib/data/recipes';
import { MILESTONES } from '$lib/data/milestones';
import type { Stack, Board, CardData, Clock } from '$lib/types/board-types';
import { hpMaxFromStats, type CardDef } from '$lib/types/card-types';
import type { RecipeResult } from '$lib/types/recipe-types';
import type { Vec2 } from '$lib/utils/vec2';
import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
import {
  addCardToMatchingStack,
  makeCardOfType,
  makeIdeaCard,
  makeReviveCard,
  makeStackFromCards,
  makeTeleportCard,
} from '$lib/utils/card-factories';
import type { Recipe } from '$lib/types/recipe-types';
import { maxBandAids, maxUniKits } from '$lib/utils/unit-stats';

function isCardType(s: string): s is CardType {
  return s in CARD_CATALOG;
}

function cardMatchesIngredient(type: CardType, match: string): boolean {
  if (type === match) return true;
  return (CARD_CATALOG[type] as CardDef).groups?.includes(match) ?? false;
}

function matchRecipe(stack: Stack, knownRecipeIds: string[]): Recipe | null {
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
      const slots = CARD_CATALOG[unit.type].weaponSlots ?? 0;
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

function dropCard(
  type: string,
  stacks: Stack[],
  pos: Vec2,
  routeDest: Stack | null | undefined,
): void {
  if (!isCardType(type)) return;
  if (routeDest) {
    routeDest.cards.push(makeCardOfType(type));
  } else {
    addCardToMatchingStack(stacks, type, pos);
  }
}

export function applyResults(
  results: RecipeResult[],
  board: Board,
  boards: Board[],
  stack: Stack,
  routeDest: Stack | null,
  consumedCards: CardData[] = [],
): void {
  const stacks = board.stacks;
  const dropPos = { x: stack.pos.x + 2, y: stack.pos.y + 2 };
  for (const result of results) {
    if (result.action === 'unlock-recipe') {
      if (!board.knownRecipeIds.includes(result.recipeId)) {
        board.knownRecipeIds.push(result.recipeId);
      }
      continue;
    }
    if (result.action === 'card') {
      if (result.chance !== undefined && Math.random() * 100 > result.chance) continue;
      dropCard(result.card, stacks, dropPos, routeDest);
      continue;
    }
    if (result.action === 'weighted') {
      dropCard(weightedRandom(result.cards), stacks, dropPos, routeDest);
      continue;
    }
    if (result.action === 'discover-board') {
      const target = boards.find((b) => b.name === result.boardName);
      const prereqMet =
        !result.prerequisite || boards.find((b) => b.name === result.prerequisite)?.discovered;
      if (target && !target.discovered && prereqMet && Math.random() * 100 < result.chance) {
        target.discovered = true;
        const card = makeTeleportCard(boards.indexOf(target), target.name);
        stacks.push(makeStackFromCards({ x: board.width / 2, y: board.height / 2 }, [card]));
      }
      continue;
    }
    if (result.action === 'spawn-enemies') {
      if (isCardType(result.enemyType)) {
        for (let i = 0; i < result.count; i++) {
          const pos = {
            x: Math.random() * (board.width - 24) + 12,
            y: Math.random() * (board.height - 24) + 12,
          };
          stacks.push(makeStackFromCards(pos, [makeCardOfType(result.enemyType)]));
        }
      }
      continue;
    }
    if (result.action === 'expand-board') {
      board.width += result.dWidth;
      board.height += result.dHeight;
      continue;
    }
    if (result.action === 'heal-unit') {
      const unit = stack.cards.find((c) => c.unitStats);
      if (unit?.unitStats) {
        const max = hpMaxFromStats(unit.unitStats);
        unit.unitStats.health = Math.min(unit.unitStats.health + result.amount, max);
      }
      continue;
    }
    if (result.action === 'revive-unit') {
      const savedTombstone = consumedCards.find((c) => c.type === 'tombstone') ?? null;
      if (savedTombstone) {
        const revived = makeReviveCard(savedTombstone);
        stacks.push(makeStackFromCards({ x: stack.pos.x + 2, y: stack.pos.y + 2 }, [revived]));
      }
      continue;
    }
    if (result.action === 'train-stat') {
      const unit = stack.cards.find((c) => c.unitStats);
      if (unit?.unitStats) {
        const oldHpMax = hpMaxFromStats(unit.unitStats);
        unit.unitStats[result.stat] += result.amount;
        const newHpMax = hpMaxFromStats(unit.unitStats);
        unit.unitStats.health = Math.min(unit.unitStats.health + (newHpMax - oldHpMax), newHpMax);
      }
      continue;
    }
    if (result.action === 'equip-weapon') {
      const unit = stack.cards.find((c) => c.unitStats && !(CARD_CATALOG[c.type] as CardDef).enemy);
      const weaponCard = consumedCards.find((c) => CARD_CATALOG[c.type].groups?.includes('weapon'));
      if (unit && weaponCard) {
        unit.weaponInventory = [...(unit.weaponInventory ?? []), weaponCard.type];
      }
      continue;
    }
    if (result.action === 'equip-band-aid') {
      const unit = stack.cards.find((c) => c.unitStats && !(CARD_CATALOG[c.type] as CardDef).enemy);
      if (unit) unit.bandAids = (unit.bandAids ?? 0) + 1;
      continue;
    }
    if (result.action === 'equip-uni-kit') {
      const unit = stack.cards.find((c) => c.unitStats && !(CARD_CATALOG[c.type] as CardDef).enemy);
      if (unit) unit.uniKits = (unit.uniKits ?? 0) + 1;
      continue;
    }
  }
}

function executeRecipe(board: Board, boards: Board[], stack: Stack, recipe: Recipe): void {
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

  // Check for a routing connection from this stack to a destination foundation stack
  const connection = board.connections.find((c) => c.fromId === stack.id);
  const routeDest = connection ? (stacks.find((s) => s.id === connection.toId) ?? null) : null;

  applyResults(recipe.results, board, boards, stack, routeDest, consumedCards);

  if (stack.cards.length === 0) {
    stacks.splice(stacks.indexOf(stack), 1);
  }
}

function checkMilestones(board: Board, clock: Clock): void {
  for (const milestone of MILESTONES) {
    if (board.firedMilestones.includes(milestone.id)) continue;
    if (!milestone.condition(board, clock)) continue;
    board.firedMilestones.push(milestone.id);
    for (const id of milestone.unlockRecipeIds) {
      if (!board.knownRecipeIds.includes(id)) board.knownRecipeIds.push(id);
      board.stacks.push(
        makeStackFromCards({ x: board.width / 2, y: board.height / 2 }, [
          makeIdeaCard(`Idea: ${recipes.find((r) => r.id === id)?.label}`),
        ]),
      );
    }
    for (const card of milestone.createCards) {
      addCardToMatchingStack(board.stacks, card, { x: board.width / 2, y: board.height / 2 });
    }
  }
}

/** Advance recipe progress on a single board. */
export function tick(board: Board, boards: Board[], clock: Clock, now: number): void {
  checkMilestones(board, clock);
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
    executeRecipe(board, boards, stack, recipe);
  }
}
