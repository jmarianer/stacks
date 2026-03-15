import type { Vec2 } from '$lib/utils/vec2';

export type CardType = 'number' | 'add' | 'multiply';

export type CardData = {
  id: number;
  type: CardType;
  value: number; // numeric value for numbers; 0 for operators
  title: string;
  symbol: string;
  color: string;
};

export type Stack = {
  id: number;
  pos: Vec2;
  dragging: boolean;
  isDropTarget: boolean;
  cards: CardData[]; // index 0 = bottom
  progress: number; // 0–1, for hat rendering
  progressStartTime: number | null;
  progressResult: number | null; // result at the time progress started; null = inactive
};

let nextId = 1;

export function makeStack(pos: Vec2, cards: Omit<CardData, 'id'>[]): Stack {
  return {
    id: nextId++,
    pos,
    dragging: false,
    isDropTarget: false,
    cards: cards.map((c) => ({ ...c, id: nextId++ })),
    progress: 0,
    progressStartTime: null,
    progressResult: null,
  };
}

/** Create a stack from CardData objects that already have IDs (e.g. when peeling or splitting). */
export function makeStackFromCards(pos: Vec2, cards: CardData[]): Stack {
  return {
    id: nextId++,
    pos,
    dragging: false,
    isDropTarget: false,
    cards,
    progress: 0,
    progressStartTime: null,
    progressResult: null,
  };
}

/** Create a new number card with a fresh ID. */
export function makeNumberCard(value: number): CardData {
  return { id: nextId++, type: 'number', value, title: 'Number', symbol: String(value), color: 'cornflowerblue' };
}

/**
 * If the stack contains exactly one operator and at least one number,
 * returns the result of applying that operator to all numbers.
 * Otherwise returns null.
 */
export function computeResult(stack: Stack): number | null {
  const operators = stack.cards.filter((c) => c.type === 'add' || c.type === 'multiply');
  if (operators.length !== 1) return null;
  const numbers = stack.cards.filter((c) => c.type === 'number');
  if (numbers.length < 2) return null;
  const op = operators[0];
  if (op.type === 'add') {
    return numbers.reduce((sum, c) => sum + c.value, 0);
  } else {
    return numbers.reduce((product, c) => product * c.value, 1);
  }
}

export const initialStacks: Stack[] = [
  makeStack({ x: 50, y: 50 }, [{ type: 'add', value: 0, title: 'Add', symbol: '+', color: 'hotpink' }]),
  makeStack({ x: 20, y: 50 }, [{ type: 'multiply', value: 0, title: 'Multiply', symbol: '×', color: 'hotpink' }]),
  makeStack({ x: 80, y: 30 }, [
    { type: 'number', value: 3, title: 'Number', symbol: '3', color: 'cornflowerblue' },
    { type: 'number', value: 4, title: 'Number', symbol: '4', color: 'cornflowerblue' },
    { type: 'number', value: 5, title: 'Number', symbol: '5', color: 'cornflowerblue' },
  ]),
  makeStack({ x: 40, y: 80 }, [
    { type: 'number', value: 6, title: 'Number', symbol: '6', color: 'goldenrod' },
    { type: 'number', value: 7, title: 'Number', symbol: '7', color: 'goldenrod' },
  ]),
];
