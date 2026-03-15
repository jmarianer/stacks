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
