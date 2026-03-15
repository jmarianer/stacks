import type { Vec2 } from '$lib/utils/vec2';

export type Card = {
  id: number;
  value: number;
  color: string;
  pos: Vec2;
  vel: Vec2;
  dragging: boolean;
};

let nextId = 1;

export function makeCard(fields: Omit<Card, 'id' | 'vel' | 'dragging'>): Card {
  return { ...fields, id: nextId++, vel: { x: 0, y: 0 }, dragging: false };
}

export const initialCards: Card[] = [
  makeCard({ value: 1, color: 'hotpink', pos: { x: 50, y: 50 } }),
  makeCard({ value: 2, color: 'hotpink', pos: { x: 20, y: 50 } }),
];
