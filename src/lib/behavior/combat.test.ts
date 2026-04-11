import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCombat, getCombatUnits } from '$lib/behavior/combat';
import { makeBoard, makeStack } from '$lib/utils/card-factories';
import type { GameState } from '$lib/types/game-state';
import type { Board } from '$lib/types/game-state';
import { hpMaxFromStats } from '$lib/types/card-types';
import { makeGameState } from '$lib/data/initial-boards';

function makeTestGameState(board: Board): GameState {
  return { ...makeGameState(), boards: [board] };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('hpMaxFromStats', () => {
  it('computes max HP as 50 + endurance * 10', () => {
    expect(hpMaxFromStats({ endurance: 1 })).toBe(60);
    expect(hpMaxFromStats({ endurance: 5 })).toBe(100);
    expect(hpMaxFromStats({ endurance: 0 })).toBe(50);
  });
});

describe('getCombatUnits', () => {
  it('separates player units from enemy units', () => {
    const board = makeBoard('test', [], 100, 100);
    board.stacks.push(makeStack({ x: 10, y: 10 }, ['astronaut']));
    board.stacks.push(makeStack({ x: 50, y: 50 }, ['bacteria']));
    const { playerUnits, enemyUnits } = getCombatUnits(board);
    expect(playerUnits).toHaveLength(1);
    expect(playerUnits[0].card.type).toBe('astronaut');
    expect(enemyUnits).toHaveLength(1);
    expect(enemyUnits[0].card.type).toBe('bacteria');
  });

  it('returns empty arrays for a board with no units', () => {
    const board = makeBoard('test', [], 100, 100);
    board.stacks.push(makeStack({ x: 10, y: 10 }, ['plasteel']));
    const { playerUnits, enemyUnits } = getCombatUnits(board);
    expect(playerUnits).toHaveLength(0);
    expect(enemyUnits).toHaveLength(0);
  });
});

describe('runCombat — strength increases damage', () => {
  it('higher strength deals more damage', () => {
    // Run two isolated combats: one with strength 1, one with strength 5.
    // Disable dodge and crit so only the base damage formula matters.
    vi.spyOn(Math, 'random').mockReturnValue(0); // 0 → no crit, no dodge

    const makeScenario = (strength: number) => {
      const board = makeBoard('test', [], 100, 100);
      const playerStack = makeStack({ x: 50, y: 10 }, ['astronaut']);
      const enemyStack = makeStack({ x: 50, y: 20 }, ['bacteria']);
      playerStack.cards[0].unitStats!.strength = strength;
      board.stacks.push(playerStack, enemyStack);
      const gs = makeTestGameState(board);
      const hpBefore = enemyStack.cards[0].unitStats!.health;
      runCombat(board, gs, 0); // first tick: detach player unit
      runCombat(board, gs, 5000); // second tick: attack fires
      const hpAfter = board.stacks.flatMap((s) => s.cards).find((c) => c.type === 'bacteria')
        ?.unitStats?.health;
      return hpBefore - (hpAfter ?? hpBefore);
    };

    const damageStr1 = makeScenario(1);
    const damageStr5 = makeScenario(5);
    expect(damageStr5).toBeGreaterThan(damageStr1);
  });
});

describe('runCombat — agility reduces attack interval', () => {
  it('a unit with high agility lands more attacks in the same time window', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Both units attack at t=0 (lastAttackAt undefined → cooldown check skipped).
    // Astronaut base attackInterval = 2s.
    //   agility=1  → effectiveInterval = 2000ms → second attack at t=2000
    //   agility=11 → effectiveInterval = 1000ms → second attack at t=1000
    // At t=1500: slow unit has landed 1 attack; fast unit has landed 2.
    const bacteriaHpAfter = (agility: number) => {
      const board = makeBoard('test', [], 100, 100);
      const playerStack = makeStack({ x: 50, y: 10 }, ['astronaut']);
      const enemyStack = makeStack({ x: 50, y: 20 }, ['bacteria']);
      playerStack.cards[0].unitStats!.agility = agility;
      board.stacks.push(playerStack, enemyStack);
      const gs = makeTestGameState(board);
      runCombat(board, gs, 0);
      runCombat(board, gs, 1500);
      return board.stacks.flatMap((s) => s.cards).find((c) => c.type === 'bacteria')?.unitStats
        ?.health;
    };

    const hpAfterSlowAgility = bacteriaHpAfter(1);
    const hpAfterFastAgility = bacteriaHpAfter(11);
    expect(hpAfterFastAgility).toBeLessThan(hpAfterSlowAgility!);
  });
});

describe('runCombat — perception grants dodge', () => {
  it('always dodges when random() returns below threshold', () => {
    // Astronaut with perception=1 has 0% dodge.
    // With perception=34 the dodge chance is 33*3 = 99%. Set random to 0.98 → dodge fires.
    vi.spyOn(Math, 'random').mockReturnValue(0.98);

    const board = makeBoard('test', [], 100, 100);
    const playerStack = makeStack({ x: 50, y: 10 }, ['astronaut']);
    const enemyStack = makeStack({ x: 50, y: 20 }, ['bacteria']);
    // bacteria attacks the player; give player high perception to dodge
    playerStack.cards[0].unitStats!.perception = 34;
    board.stacks.push(playerStack, enemyStack);
    const gs = makeTestGameState(board);
    const playerHpBefore = playerStack.cards[0].unitStats!.health;
    runCombat(board, gs, 0);
    runCombat(board, gs, 5000);
    const playerCard = board.stacks.flatMap((s) => s.cards).find((c) => c.type === 'astronaut');
    expect(playerCard?.unitStats?.health).toBe(playerHpBefore);
  });
});
