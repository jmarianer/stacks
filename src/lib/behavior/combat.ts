import {
  CARD_W,
  CARD_H,
  HEAL_COOLDOWN_MS,
  FLEE_HP_THRESHOLD,
  UNIKIT_HP_THRESHOLD,
  BANDAID_HP_THRESHOLD,
} from '$lib/data/constants';
import type { Stack, Board, CardData } from '$lib/types/game-state';
import { hpMaxFromStats, type CardDef } from '$lib/types/card-types';
import type { RecipeResult } from '$lib/types/recipe-types';
import type { Vec2 } from '$lib/utils/vec2';
import { CARD_CATALOG } from '$lib/data/card-defs';
import { makeTombstoneCard, makeStackFromCards } from '$lib/utils/card-factories';
import { getUnitWeapon } from '$lib/utils/unit-stats';
import { applyResults } from '$lib/behavior/progress';
import type { GameState } from '$lib/types/game-state';

export type CombatCardState = {
  lastMoveAt?: number;
  lastAttackAt?: number;
  healAt?: number;
};

export type CombatUnit = { card: CardData; stack: Stack };

export function nearestCombatant(
  pos: Vec2,
  units: CombatUnit[],
  range?: number,
): CombatUnit | null {
  let best: CombatUnit | null = null;
  let bestDist = Infinity;
  for (const u of units) {
    const dx = u.stack.pos.x - pos.x;
    const dy = u.stack.pos.y - pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < bestDist && (range === undefined || d <= range)) {
      bestDist = d;
      best = u;
    }
  }
  return best;
}

export function getCombatUnits(board: Board): {
  playerUnits: CombatUnit[];
  enemyUnits: CombatUnit[];
} {
  const playerUnits: CombatUnit[] = [];
  const enemyUnits: CombatUnit[] = [];
  for (const stack of board.stacks) {
    for (const card of stack.cards) {
      if (!card.unitStats) continue;
      if (card.tombstoneOf) continue;
      if ((CARD_CATALOG[card.type] as CardDef).enemy) enemyUnits.push({ card, stack });
      else playerUnits.push({ card, stack });
    }
  }
  return { playerUnits, enemyUnits };
}

function moveUnit(
  unit: CombatUnit,
  targets: CombatUnit[],
  board: Board,
  gameState: GameState,
  now: number,
): void {
  const def = CARD_CATALOG[unit.card.type] as CardDef;
  const speed = def.playerUnit?.speed ?? def.enemy?.speed ?? 0;
  if (speed === 0) return;

  const state = gameState.combatState[unit.card.id];
  const delta =
    state?.lastMoveAt !== undefined ? Math.min((now - state.lastMoveAt) / 1000, 0.1) : 0;
  if (state) state.lastMoveAt = now;
  if (delta <= 0) return;

  const nearest = nearestCombatant(unit.stack.pos, targets);
  if (!nearest) return;

  const stats = unit.card.unitStats!;
  const hpPct = stats.health / hpMaxFromStats(stats);
  const weapon = def.enemy ? def.enemy.weapon : getUnitWeapon(unit.card);
  const dx = nearest.stack.pos.x - unit.stack.pos.x;
  const dy = nearest.stack.pos.y - unit.stack.pos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.01) return;

  const shouldFlee = !def.enemy && hpPct < FLEE_HP_THRESHOLD;
  const inRange = weapon !== undefined && dist <= weapon.range;
  if (!shouldFlee && inRange) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const moveAmount = speed * delta;
  const moveX = shouldFlee ? -nx * moveAmount : nx * Math.min(moveAmount, dist);
  const moveY = shouldFlee ? -ny * moveAmount : ny * Math.min(moveAmount, dist);

  unit.stack.pos.x = Math.max(
    CARD_W / 2,
    Math.min(board.width - CARD_W / 2, unit.stack.pos.x + moveX),
  );
  unit.stack.pos.y = Math.max(
    CARD_H / 2,
    Math.min(board.height - CARD_H / 2, unit.stack.pos.y + moveY),
  );
}

export function runCombat(board: Board, gameState: GameState, now: number): void {
  const { playerUnits, enemyUnits } = getCombatUnits(board);
  if (enemyUnits.length === 0 || playerUnits.length === 0) return;

  // Detach player units entering combat for the first time
  const toDetach = playerUnits.filter((u) => !(u.card.id in gameState.combatState));
  for (const unit of toDetach) {
    gameState.combatState[unit.card.id] = {};
    unit.stack.cards = unit.stack.cards.filter((c) => c.id !== unit.card.id);
    const combatStack = makeStackFromCards({ ...unit.stack.pos }, [unit.card]);
    board.stacks.push(combatStack);
    unit.stack = combatStack;
  }
  board.stacks = board.stacks.filter((s) => s.cards.length > 0);

  // Regen and movement
  for (const enemy of enemyUnits) {
    const def = CARD_CATALOG[enemy.card.type] as CardDef;
    if (def.enemy?.regen) {
      const state = gameState.combatState[enemy.card.id];
      const delta =
        state?.lastMoveAt !== undefined ? Math.min((now - state.lastMoveAt) / 1000, 0.1) : 0;
      const hpMax = hpMaxFromStats(enemy.card.unitStats!);
      enemy.card.unitStats!.health = Math.min(
        enemy.card.unitStats!.health + def.enemy.regen * delta,
        hpMax,
      );
    }
    moveUnit(enemy, playerUnits, board, gameState, now);
  }

  for (const unit of playerUnits) {
    // Use uni-kit (≤50% HP, full heal) or band-aid (≤90% HP, partial heal), with a 3s cooldown
    const stats = unit.card.unitStats!;
    const hpMax = hpMaxFromStats(stats);
    const hpPct = stats.health / hpMax;
    const state = gameState.combatState[unit.card.id];
    const healReady = state?.healAt === undefined || now - state.healAt >= HEAL_COOLDOWN_MS;
    if (healReady && hpPct <= UNIKIT_HP_THRESHOLD && (unit.card.uniKits ?? 0) > 0) {
      stats.health = hpMax;
      unit.card.uniKits!--;
      if (state) state.healAt = now;
    } else if (healReady && hpPct <= BANDAID_HP_THRESHOLD && (unit.card.bandAids ?? 0) > 0) {
      stats.health = Math.min(stats.health + 25, hpMax);
      unit.card.bandAids!--;
      if (state) state.healAt = now;
    }
    moveUnit(unit, enemyUnits, board, gameState, now);
  }

  // Attacks
  const dead = new Set<number>();

  function tryAttack(attacker: CombatUnit, targets: CombatUnit[]): void {
    if (dead.has(attacker.card.id)) return;
    const stats = attacker.card.unitStats!;
    const def = CARD_CATALOG[attacker.card.type] as CardDef;
    const weapon = def.enemy ? def.enemy.weapon : getUnitWeapon(attacker.card);
    if (!weapon) return;

    const live = targets.filter((t) => !dead.has(t.card.id));
    const target = nearestCombatant(attacker.stack.pos, live, weapon.range);
    if (!target) return;

    const combatState = gameState.combatState[attacker.card.id];

    // Cooldown: agility above 1 = 10% faster per point
    const effectiveInterval =
      (weapon.attackInterval * 1000) / (1 + Math.max(0, stats.agility - 1) * 0.1);
    if (
      combatState?.lastAttackAt !== undefined &&
      now - combatState.lastAttackAt < effectiveInterval
    )
      return;

    // Strength increases damage: each point above 1 = +10%
    let damage = weapon.damage * (1 + Math.max(0, stats.strength - 1) * 0.1);

    // Luck → crit: each point above 1 = +2% crit chance (2× damage)
    if (Math.random() * 100 < Math.max(0, stats.luck - 1) * 2) damage *= 2;

    const targetStats = target.card.unitStats!;
    if (combatState) combatState.lastAttackAt = now;

    // Target perception → dodge: each point above 1 = +3% dodge chance
    if (Math.random() * 100 < Math.max(0, targetStats.perception - 1) * 3) return;

    const resist = targetStats.resist?.[weapon.damageType] ?? 0;
    targetStats.health -= Math.max(1, damage * (1 - resist / 100));
    if (targetStats.health <= 0) dead.add(target.card.id);
  }

  for (const unit of playerUnits) tryAttack(unit, enemyUnits);
  for (const enemy of enemyUnits) tryAttack(enemy, playerUnits);

  if (dead.size === 0) return;

  // Collect loot and dead player cards before mutating stacks
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
    applyResults(results, board, gameState, makeStackFromCards(pos, []), []);
  }
  for (const { card, pos } of deadPlayerCards) {
    board.stacks.push(makeStackFromCards(pos, [makeTombstoneCard(card)]));
  }
}
