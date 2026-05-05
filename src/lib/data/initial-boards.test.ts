import { describe, it, expect } from 'vitest';
import { makeInitialGameState } from '$lib/data/initial-boards';
import { recipes } from '$lib/data/recipes';
import { CARD_CATALOG } from '$lib/data/card-defs';

const DEAD_BOARDS = ['Desert', 'Snow', 'Flowers'];
const DEAD_RECIPES = [
  'make-snow-sphere',
  'make-snowballs',
  'make-snow-block',
  'punch-cactus',
  'use-power-flower',
];
const DEAD_CARD_TYPES = [
  'snow-block',
  'snow-pile',
  'snow-sphere',
  'snowballs',
  'snow-converter',
  'cactus',
  'power-flower',
];

describe('dead world removal (issue 002)', () => {
  it('no Dead boards appear in initialBoards', () => {
    const { boards } = makeInitialGameState();
    const names = boards.map((b) => b.name);
    for (const dead of DEAD_BOARDS) {
      expect(names).not.toContain(dead);
    }
  });

  it('use-rover has no discover-board results for dead worlds', () => {
    const rover = recipes.find((r) => r.id === 'use-rover')!;
    const deadBoardResults = rover.results
      .filter((r) => r.action === 'discover-board')
      .map((r) => (r as { action: 'discover-board'; boardName: string }).boardName)
      .filter((name) => DEAD_BOARDS.includes(name));
    expect(deadBoardResults).toEqual([]);
  });

  it('dead recipes are removed', () => {
    const ids = recipes.map((r) => r.id);
    for (const dead of DEAD_RECIPES) {
      expect(ids).not.toContain(dead);
    }
  });

  it('dead card types are removed from CARD_CATALOG', () => {
    for (const dead of DEAD_CARD_TYPES) {
      expect(CARD_CATALOG).not.toHaveProperty(dead);
    }
  });
});
