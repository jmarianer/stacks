import { recipes } from '$lib/data/recipes';
import { MILESTONES } from '$lib/data/milestones';
import type { Stack, Board, CardData, Clock } from '$lib/types/board-types';
import {
  hpMaxFromStats,
  type WeaponStats,
  type CardDef,
  type UnitStats,
} from '$lib/types/card-types';
import type { RecipeResult } from '$lib/types/recipe-types';
import type { Vec2 } from '$lib/utils/vec2';
import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
import {
  addCardToMatchingStack,
  makeCardOfType,
  makeIdeaCard,
  makeTombstoneCard,
  makeReviveCard,
  makeStackFromCards,
  makeTeleportCard,
} from '$lib/utils/card-factories';
import type { Recipe } from '$lib/types/recipe-types';
import { getVirtualNow } from '$lib/behavior/clock';

function isCardType(s: string): s is CardType {
  return s in CARD_CATALOG;
}

function maxBandAids(stats: UnitStats): number {
  const sum =
    stats.endurance +
    stats.strength +
    stats.perception +
    stats.intelligence +
    stats.agility +
    stats.luck;
  return Math.floor(sum / 10 + 1);
}

function maxUniKits(stats: UnitStats): number {
  const sum =
    stats.endurance +
    stats.strength +
    stats.perception +
    stats.intelligence +
    stats.agility +
    stats.luck;
  return Math.floor(sum / 5 + 1);
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

function applyResults(
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
      for (const s of board.stacks) s.pos.x += result.dWidth / 2;
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

/** Returns the active weapon for a player unit: last item in weaponInventory, or built-in weapon. */
function getUnitWeapon(card: CardData): WeaponStats | undefined {
  if (card.weaponInventory && card.weaponInventory.length > 0) {
    const activeType = card.weaponInventory[card.weaponInventory.length - 1];
    const def = CARD_CATALOG[activeType];
    if (def.weapon) return def.weapon;
  }
  return CARD_CATALOG[card.type].weapon;
}

function nearestCombatant(
  pos: Vec2,
  units: Array<{ card: CardData; stack: Stack }>,
): { card: CardData; stack: Stack } | null {
  let best: { card: CardData; stack: Stack } | null = null;
  let bestDist = Infinity;
  for (const u of units) {
    const dx = u.stack.pos.x - pos.x;
    const dy = u.stack.pos.y - pos.y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = u;
    }
  }
  return best;
}

function runCombat(board: Board, now: number): void {
  const playerUnits: Array<{ card: CardData; stack: Stack }> = [];
  const enemyUnits: Array<{ card: CardData; stack: Stack }> = [];

  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (!card.unitStats) continue;
      const def = CARD_CATALOG[card.type] as CardDef;
      if (def.enemy) enemyUnits.push({ card, stack });
      else if (def.weapon) playerUnits.push({ card, stack });
    }
  }

  if (playerUnits.length === 0 || enemyUnits.length === 0) return;

  const dead = new Set<number>();

  function tryAttack(
    attacker: { card: CardData; stack: Stack },
    targets: Array<{ card: CardData; stack: Stack }>,
  ): void {
    if (dead.has(attacker.card.id)) return;
    const stats = attacker.card.unitStats!;
    const def = CARD_CATALOG[attacker.card.type] as CardDef;
    const weapon = def.enemy ? def.enemy.weapon : getUnitWeapon(attacker.card);
    if (!weapon) return;

    const live = targets.filter((t) => !dead.has(t.card.id));
    const target = nearestCombatant(attacker.stack.pos, live);
    if (!target) return;

    // Agility shortens attack interval: each point above 1 = 10% faster
    const effectiveInterval =
      (weapon.attackInterval * 1000) / (1 + Math.max(0, stats.agility - 1) * 0.1);
    if (stats.lastAttackAt !== undefined && now - stats.lastAttackAt < effectiveInterval) return;

    // Strength increases damage: each point above 1 = +10%
    let damage = weapon.damage * (1 + Math.max(0, stats.strength - 1) * 0.1);

    // Luck → crit: each point above 1 = +2% crit chance (2× damage)
    const critChance = Math.max(0, stats.luck - 1) * 2;
    if (Math.random() * 100 < critChance) damage *= 2;

    // Target perception → dodge: each point above 1 = +3% dodge chance
    const targetStats = target.card.unitStats!;
    const dodgeChance = Math.max(0, targetStats.perception - 1) * 3;
    stats.lastAttackAt = now;
    if (Math.random() * 100 < dodgeChance) return;

    // Resistance reduces damage (0–100%)
    const resist = targetStats.resist?.[weapon.damageType] ?? 0;
    targetStats.health -= Math.max(1, damage * (1 - resist / 100));

    if (targetStats.health <= 0) dead.add(target.card.id);
  }

  for (const unit of playerUnits) tryAttack(unit, enemyUnits);
  for (const enemy of enemyUnits) tryAttack(enemy, playerUnits);

  if (dead.size === 0) return;

  // Collect loot drops and dead player cards before mutating stacks
  const lootEntries: Array<{ results: RecipeResult[]; pos: Vec2 }> = [];
  const deadPlayerCards: Array<{ card: CardData; pos: Vec2 }> = [];

  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (!dead.has(card.id)) continue;
      const def = CARD_CATALOG[card.type] as CardDef;
      if (def.enemy) {
        lootEntries.push({ results: def.enemy.loot, pos: { ...stack.pos } });
      } else {
        deadPlayerCards.push({ card, pos: { ...stack.pos } });
      }
    }
    stack.cards = stack.cards.filter((c) => !dead.has(c.id));
  }
  board.stacks = board.stacks.filter((s) => s.cards.length > 0);

  for (const { results, pos } of lootEntries) {
    applyResults(results, board, [], makeStackFromCards(pos, []), null);
  }
  for (const { card, pos } of deadPlayerCards) {
    board.stacks.push(makeStackFromCards(pos, [makeTombstoneCard(card)]));
  }
}

/** Advance recipe progress on a single board. */
export function tick(board: Board, boards: Board[], clock: Clock, realNow: number): void {
  if (clock.endOfSol) return;
  if (clock.speed === 0) return;

  const now = getVirtualNow(clock, realNow);

  checkMilestones(board, clock);
  runCombat(board, now);
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
