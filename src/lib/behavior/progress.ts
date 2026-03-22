import { recipes } from '$lib/data/recipes';
import { MILESTONES } from '$lib/data/milestones';
import type { Stack, Board, CardData, Clock, SolFeedResult } from '$lib/types/board-types';
import { hpMaxFromStats, type WeaponStats, type CardDef } from '$lib/types/card-types';
import type { Vec2 } from '$lib/utils/vec2';
import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
import {
  addCardToMatchingStack,
  makeCardOfType,
  makeIdeaCard,
  makeTombstoneCard,
  makeReviveCard,
  makeStackFromCards,
} from '$lib/utils/card-factories';
import type { Recipe } from '$lib/types/recipe-types';

export const SOL_DURATION = 2 * 60 * 1000; // 2 minutes in ms

function feedUnits(board: Board): SolFeedResult {
  // Tally available energy
  let energyPool = 0;
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (card.energyRemaining !== undefined) energyPool += card.energyRemaining;
    }
  }

  // Collect units sorted by priority (lower = fed first)
  const units: { card: CardData; cost: number, priority: number }[] = [];
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

  // Save tombstone before it's consumed (needed for revive-unit result)
  const savedTombstone =
    Array.from(consumed, (i) => stack.cards[i]).find((c) => c.type === 'tombstone') ?? null;

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
  const routeDest = connection ? stacks.find((s) => s.id === connection.toId) : null;

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
    if (!type || !isCardType(type)) continue;
    if (routeDest) {
      routeDest.cards.push(makeCardOfType(type));
    } else {
      addCardToMatchingStack(stacks, type, {
        x: stack.pos.x + offset * 2,
        y: stack.pos.y + offset * 2,
      });
    }
    offset++;
  }

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

/** Find the best weapon card in a unit's stack, or fall back to the unit's built-in weapon. */
function getUnitWeapon(card: CardData, stack: Stack): WeaponStats | undefined {
  let best: WeaponStats | undefined;
  for (const c of stack.cards) {
    if (c.id === card.id) continue;
    const cDef = CARD_CATALOG[c.type] as CardDef;
    if (cDef.weapon && !cDef.enemy && !c.unitStats) {
      if (!best || cDef.weapon.damage > best.damage) best = cDef.weapon;
    }
  }
  if (best) return best;
  return (CARD_CATALOG[card.type] as CardDef).weapon;
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
    const weapon = def.enemy ? def.enemy.weapon : getUnitWeapon(attacker.card, attacker.stack);
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
  const lootDrops: Array<{ type: CardType; pos: Vec2 }> = [];
  const deadPlayerCards: Array<{ card: CardData; pos: Vec2 }> = [];

  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (!dead.has(card.id)) continue;
      const def = CARD_CATALOG[card.type] as CardDef;
      if (def.enemy) {
        const lootType = weightedRandom(def.enemy.loot);
        if (isCardType(lootType)) lootDrops.push({ type: lootType, pos: { ...stack.pos } });
      } else {
        deadPlayerCards.push({ card, pos: { ...stack.pos } });
      }
    }
    stack.cards = stack.cards.filter((c) => !dead.has(c.id));
  }
  board.stacks = board.stacks.filter((s) => s.cards.length > 0);

  for (const { type, pos } of lootDrops) addCardToMatchingStack(board.stacks, type, pos);
  for (const { card, pos } of deadPlayerCards) {
    board.stacks.push(makeStackFromCards(pos, [makeTombstoneCard(card)]));
  }
}

/** Returns the current virtual time, which advances at clock.speed per real ms. */
export function getVirtualNow(clock: Clock, realNow: number): number {
  if (clock.vTimeAt === null || clock.speed === 0 || clock.endOfSol) return clock.vTime;
  return clock.vTime + (realNow - clock.vTimeAt) * clock.speed;
}

/** Change speed (0=pause, 1/2/3=active). Syncs virtual clock before switching. */
export function setSpeed(clock: Clock, realNow: number, newSpeed: number): void {
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

/** Advance recipe progress on a single board. */
export function tick(board: Board, clock: Clock, realNow: number): string[] {
  if (clock.endOfSol) return [];
  if (clock.speed === 0) return [];

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

  const executedRecipeIds: string[] = [];
  for (const { stack, recipe } of toExecute) {
    executeRecipe(board, stack, recipe);
    executedRecipeIds.push(recipe.id);
  }
  return executedRecipeIds;
}
