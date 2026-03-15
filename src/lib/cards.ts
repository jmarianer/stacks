import type { Vec2 } from '$lib/utils/vec2';

export type CardData = {
  id: number;
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
};

let nextId = 1;

export function makeStack(pos: Vec2, cards: Omit<CardData, 'id'>[]): Stack {
  return {
    id: nextId++,
    pos,
    dragging: false,
    isDropTarget: false,
    cards: cards.map((c) => ({ ...c, id: nextId++ })),
  };
}

/** Create a stack from CardData objects that already have IDs (e.g. when peeling). */
export function makeStackFromCards(pos: Vec2, cards: CardData[]): Stack {
  return { id: nextId++, pos, dragging: false, isDropTarget: false, cards };
}

export const initialStacks: Stack[] = [
  makeStack({ x: 50, y: 50 }, [{ title: 'Add', symbol: '+', color: 'hotpink' }]),
  makeStack({ x: 20, y: 50 }, [{ title: 'Multiply', symbol: '×', color: 'hotpink' }]),
  makeStack({ x: 80, y: 30 }, [
    { title: 'Number', symbol: '3', color: 'cornflowerblue' },
    { title: 'Number', symbol: '4', color: 'cornflowerblue' },
    { title: 'Number', symbol: '5', color: 'cornflowerblue' },
  ]),
  makeStack({ x: 40, y: 80 }, [
    { title: 'Number', symbol: '6', color: 'goldenrod' },
    { title: 'Number', symbol: '7', color: 'goldenrod' },
  ]),
];
