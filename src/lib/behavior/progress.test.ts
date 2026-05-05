import { describe, it, expect } from 'vitest';
import { matchRecipe, tick, checkMilestones } from '$lib/behavior/progress';
import { makeBoard, makeStack } from '$lib/utils/card-factories';
import { type CardType } from '$lib/data/card-defs';
import type { GameState } from '$lib/types/game-state';
import { makeInitialGameState } from '$lib/data/initial-boards';

// Recipes available from game start (alwaysKnown or in initialKnownRecipeIds)
const KNOWN = ['punch-crust-chunk', 'punch-plasteel-deposit', 'make-multi-cell'];

function makeTestStack(types: CardType[]) {
  return makeStack({ x: 0, y: 0 }, types);
}

function testRecipe(cards: CardType[], recipeNames: string[], expected: string | undefined) {
  const stack = makeTestStack(cards);
  const recipe = matchRecipe(stack, recipeNames);
  expect(recipe?.id).toBe(expected);
}

describe('matchRecipe', () => {
  it('returns null for an empty stack', () => {
    testRecipe([], KNOWN, undefined);
  });

  it('matches a basic recipe when ingredients are present', () => {
    testRecipe(
      ['energy-cell', 'energy-cell', 'energy-cell', 'energy-cell'],
      KNOWN,
      'make-multi-cell',
    );
  });

  it('returns null when required ingredients are missing', () => {
    testRecipe(['crust-chunk'], KNOWN, undefined);
  });

  it('matches via group: "people" matches astronaut', () => {
    testRecipe(['crust-chunk', 'astronaut'], KNOWN, 'punch-crust-chunk');
  });

  it('does not match a recipe whose id is not in knownRecipeIds (and not alwaysKnown)', () => {
    testRecipe(['workbench', 'electronics', 'plasteel', 'plasteel', 'astronaut'], [], undefined);
  });

  it('does not match a recipe whose id is not in knownRecipeIds (and not alwaysKnown)', () => {
    testRecipe(
      ['workbench', 'electronics', 'plasteel', 'plasteel', 'astronaut'],
      ['make-blaster'],
      'make-blaster',
    );
  });

  it('matches a recipe with more ingredients', () => {
    testRecipe(
      ['workbench', 'astronaut', 'plasteel'],
      ['make-electronics', 'make-blaster'],
      'make-electronics',
    );
    // TODO fix this. It should definitely make a blaster, not electronics, since the stack has the required ingredients for make-blaster.
    // testRecipe(['workbench', 'astronaut', 'electronics', 'plasteel', 'plasteel'], ['make-electronics', 'make-blaster'], 'make-blaster');
  });
});

describe('executeRecipe (via tick)', () => {
  // Pre-set activeRecipeId so tick skips initialization and goes straight to progress computation
  function makeTestGameState(cards: CardType[], recipeId: string) {
    const stack = makeTestStack(cards);
    stack.activeRecipeId = recipeId;
    stack.progressStartTime = 0;
    const board = makeBoard('test', [stack], 100, 100);
    const gameState: GameState = {
      ...makeInitialGameState(),
      boards: [board],
      knownRecipeIds: [recipeId],
    };
    return { gameState, board, stack };
  }

  it('removes consumed cards from the stack', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['crust-chunk', 'astronaut'],
      'punch-crust-chunk',
    );
    tick(board, gameState, 3000);
    expect(stack.cards.some((c) => c.type === 'crust-chunk')).toBe(false);
  });

  it('leaves non-consumed ingredients in the stack', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['plasteel-deposit', 'astronaut'],
      'punch-plasteel-deposit',
    );
    tick(board, gameState, 3000);
    expect(stack.cards.some((c) => c.type === 'astronaut')).toBe(true);
  });

  it('decrements usesRemaining instead of removing the card when uses remain', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['plasteel-deposit', 'astronaut'],
      'punch-plasteel-deposit',
    );
    const deposit = stack.cards.find((c) => c.type === 'plasteel-deposit')!;
    expect(deposit.usesRemaining).toBe(3); // usesInitial = 3 per card catalog
    tick(board, gameState, 3000);
    expect(deposit.usesRemaining).toBe(2);
    expect(stack.cards).toContain(deposit);
  });

  it('fully removes a card when usesRemaining reaches 0', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['plasteel-deposit', 'astronaut'],
      'punch-plasteel-deposit',
    );
    const deposit = stack.cards.find((c) => c.type === 'plasteel-deposit')!;
    deposit.usesRemaining = 1;
    tick(board, gameState, 3000);
    expect(stack.cards.some((c) => c.type === 'plasteel-deposit')).toBe(false);
  });

  it('removes the stack from the board when all cards are consumed', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['energy-cell', 'energy-cell', 'energy-cell', 'energy-cell'],
      'make-multi-cell',
    );
    tick(board, gameState, 2000);
    expect(board.stacks).not.toContain(stack);
  });

  it('adds the output card to the board', () => {
    const { gameState, board } = makeTestGameState(
      ['energy-cell', 'energy-cell', 'energy-cell', 'energy-cell'],
      'make-multi-cell',
    );
    tick(board, gameState, 2000);
    expect(board.stacks.flatMap((s) => s.cards).some((c) => c.type === 'multi-cell')).toBe(true);
  });

  it('resets progress state after execution', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['plasteel-deposit', 'astronaut'],
      'punch-plasteel-deposit',
    );
    tick(board, gameState, 3000);
    expect(stack.progress).toBe(0);
    expect(stack.progressStartTime).toBeNull();
    expect(stack.activeRecipeId).toBeNull();
  });

  it('consumes multiple cards of the same ingredient type', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['energy-cell', 'energy-cell', 'energy-cell', 'energy-cell'],
      'make-multi-cell',
    );
    tick(board, gameState, 2000);
    expect(board.stacks).not.toContain(stack);
    expect(board.stacks.flatMap((s) => s.cards).some((c) => c.type === 'multi-cell')).toBe(true);
  });

  it('leaves some cards of the same ingredient type', () => {
    const { gameState, board, stack } = makeTestGameState(
      ['energy-cell', 'energy-cell', 'energy-cell', 'energy-cell', 'energy-cell'],
      'make-multi-cell',
    );
    tick(board, gameState, 2000);
    expect(board.stacks).toContain(stack);
    expect(stack.cards.filter((c) => c.type === 'energy-cell').length).toBe(1);
  });
});

describe('checkMilestones (milestone chain)', () => {
  // Build a game state with specific cards already present, with all early milestones
  // pre-fired so they don't interfere with what we're testing.
  function makeStateWith(cardTypes: CardType[]): {
    gs: GameState;
    board: ReturnType<typeof makeBoard>;
  } {
    const stack = makeStack({ x: 0, y: 0 }, cardTypes);
    const board = makeBoard('Base', [stack], 100, 100, true);
    const gs: GameState = {
      ...makeInitialGameState(),
      boards: [board],
      clock: {
        sol: 1,
        solStartTime: null,
        endOfSol: false,
        lastSolFeeds: [],
        speed: 1,
        lastActiveSpeed: 1,
        vTime: 0,
        vTimeAt: null,
        firedMilestones: [
          'solar-panel',
          'first-solar-panel',
          'foundation',
          'service-drone',
          'two-foundations',
          'foundation-route',
          'workbench',
          'first-workbench',
          'first-electronics',
          'bacteria-invasion',
          'post-invasion',
        ],
      },
      knownRecipeIds: [],
    };
    return { gs, board };
  }

  it('first-drill: unlocks adv-workbench, rover, and cloning-chamber when drill is built', () => {
    const { gs, board } = makeStateWith(['drill']);
    checkMilestones(gs, board);
    expect(gs.knownRecipeIds).toContain('build-adv-workbench');
    expect(gs.knownRecipeIds).toContain('build-rover');
    expect(gs.knownRecipeIds).toContain('build-cloning-chamber');
  });

  it('build-rover: returns a notification when rover is built', () => {
    const { gs, board } = makeStateWith(['rover']);
    gs.clock.firedMilestones.push('first-drill');
    const notifications = checkMilestones(gs, board);
    expect(notifications).toContain('Rover ready for expedition!');
  });
});
