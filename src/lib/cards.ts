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
  cards: CardData[]; // index 0 = bottom
};

let nextId = 1;

export function makeStack(pos: Vec2, cards: Omit<CardData, 'id'>[]): Stack {
  return {
    id: nextId++,
    pos,
    vel: { x: 0, y: 0 },
    dragging: false,
    cards: cards.map((c) => ({ ...c, id: nextId++ })),
  };
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
