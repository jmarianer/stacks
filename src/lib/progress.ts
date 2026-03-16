import { recipes } from '$lib/recipes';
import { type Stack, type CardType } from '$lib/cards';
import { CARD_CATALOG, CARD_GROUPS, makeCardOfType, makeStackFromCards } from '$lib/card-catalog';
import type { Recipe } from '$lib/recipe-types';

function isCardType(s: string): s is CardType {
  return s in CARD_CATALOG;
}

function cardMatchesIngredient(type: CardType, match: string): boolean {
  if (type === match) return true;
  return CARD_GROUPS[type]?.includes(match) ?? false;
}

function matchRecipe(stack: Stack): Recipe | null {
  outer: for (const recipe of recipes) {
    const used = new Set<number>();
    for (const ing of recipe.ingredients) {
      const need = ing.count ?? 1;
      let found = 0;
      for (let i = 0; i < stack.cards.length; i++) {
        if (!used.has(i) && cardMatchesIngredient(stack.cards[i].type, ing.match)) {
          used.add(i);
          if (++found >= need) break;
        }
      }
      if (found < need) continue outer;
    }
    return recipe;
  }
  return null;
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

function executeRecipe(stacks: Stack[], stack: Stack, recipe: Recipe): void {
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

  // Decrement uses for cards that have charges; only fully remove when depleted
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
    let type: string | null = null;
    if (result.action === 'card') {
      if (result.chance !== undefined && Math.random() * 100 > result.chance) continue;
      type = result.card;
    } else if (result.action === 'weighted') {
      type = weightedRandom(result.cards);
    }
    if (!type || !isCardType(type)) continue;
    const card = makeCardOfType(type);
    stacks.push(makeStackFromCards({ x: stack.pos.x + offset * 2, y: stack.pos.y + offset * 2 }, [card]));
    offset++;
  }

  if (stack.cards.length === 0) {
    stacks.splice(stacks.indexOf(stack), 1);
  }
}

export function tick(stacks: Stack[], now: number): void {
  const toExecute: { stack: Stack; recipe: Recipe }[] = [];

  for (const stack of stacks) {
    const recipe = matchRecipe(stack);
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
    executeRecipe(stacks, stack, recipe);
  }
}
