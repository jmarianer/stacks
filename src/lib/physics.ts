import { CARD_W, CARD_H, BOARD_SIZE } from '$lib/constants';
import type { Card } from '$lib/cards';
import { sub, len, norm, addScaled } from '$lib/utils/vec2';

export function tick(cards: Card[]): void {
  // Card-card repulsion
  for (let i = 0; i < cards.length; i++) {
    const a = cards[i];
    if (a.dragging) continue;

    for (let j = i + 1; j < cards.length; j++) {
      const b = cards[j];
      if (b.dragging) continue;

      const d = sub(b.pos, a.pos);
      const overlapX = CARD_W - Math.abs(d.x);
      const overlapY = CARD_H - Math.abs(d.y);

      if (overlapX > 0 && overlapY > 0) {
        const sep = norm(d);
        const forceMagnitude = Math.min(overlapX, overlapY) / 20;
        addScaled(a.vel, sep, -forceMagnitude);
        addScaled(b.vel, sep, forceMagnitude);
      }
    }
  }

  for (const card of cards) {
    // Dragging: if the card is being dragged, don't move it with physics
    if (card.dragging) {
      card.vel = { x: 0, y: 0 };
      continue;
    }

    // Bumpers: push card back if it strays outside the board
    if (card.pos.x < 0) {
      card.vel.x -= card.pos.x * 0.05;
    }
    if (card.pos.x + CARD_W > BOARD_SIZE) {
      card.vel.x -= (card.pos.x + CARD_W - BOARD_SIZE) * 0.05;
    }
    if (card.pos.y < 0) {
      card.vel.y -= card.pos.y * 0.05;
    }
    if (card.pos.y + CARD_H > BOARD_SIZE) {
      card.vel.y -= (card.pos.y + CARD_H - BOARD_SIZE) * 0.05;
    }

    // Speed limit: if the card is moving too fast, slow it down
    const speed = len(card.vel);
    if (speed > 0.25) {
      const { x, y } = norm(card.vel);
      card.vel.x = x * 0.25;
      card.vel.y = y * 0.25;
    }

    // Move the card according to its velocity, then reset the velocity for the next tick
    addScaled(card.pos, card.vel, 1);
    card.vel.x = 0;
    card.vel.y = 0;
  }
}
