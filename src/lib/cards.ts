import type { Vec2 } from '$lib/utils/vec2';

export type CardData = {
  id: number;
  value: number;
  color: string;
};

export type Stack = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  dragging: boolean;
  isDropTarget: boolean;
  cards: CardData[]; // index 0 = bottom
};

let nextId = 1;

export function makeStack(pos: Vec2, cards: Omit<CardData, 'id'>[]): Stack {
  return {
    id: nextId++,
    pos,
    vel: { x: 0, y: 0 },
    dragging: false,
    isDropTarget: false,
    cards: cards.map((c) => ({ ...c, id: nextId++ })),
  };
}

/** Create a stack from CardData objects that already have IDs (e.g. when peeling). */
export function makeStackFromCards(pos: Vec2, cards: CardData[]): Stack {
  return { id: nextId++, pos, vel: { x: 0, y: 0 }, dragging: false, isDropTarget: false, cards };
}

export const initialStacks: Stack[] = [
  makeStack({ x: 50, y: 50 }, [{ value: 1, color: 'hotpink' }]),
  makeStack({ x: 20, y: 50 }, [{ value: 2, color: 'hotpink' }]),
  makeStack({ x: 80, y: 30 }, [
    { value: 3, color: 'cornflowerblue' },
    { value: 4, color: 'cornflowerblue' },
    { value: 5, color: 'cornflowerblue' },
  ]),
  makeStack({ x: 40, y: 80 }, [
    { value: 6, color: 'goldenrod' },
    { value: 7, color: 'goldenrod' },
  ]),
];
