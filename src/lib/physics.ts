import { CARD_W, CARD_H, BOARD_SIZE, STACK_CARD_OFFSET_Y } from '$lib/constants';
import type { Stack } from '$lib/cards';
import { type Vec2, sub, len, norm, addScaled } from '$lib/utils/vec2';

function stackHeight(stack: Stack): number {
  return CARD_H + (stack.cards.length - 1) * STACK_CARD_OFFSET_Y;
}

function stackCenter(stack: Stack): Vec2 {
  const h = stackHeight(stack);
  return { x: stack.pos.x + CARD_W / 2, y: stack.pos.y + h / 2 };
}

export function tick(stacks: Stack[]): void {
  // Stack-stack repulsion
  for (let i = 0; i < stacks.length; i++) {
    const a = stacks[i];
    if (a.dragging) continue;

    const hA = stackHeight(a);

    for (let j = i + 1; j < stacks.length; j++) {
      const b = stacks[j];
      if (b.dragging) continue;

      const hB = stackHeight(b);

      const overlapX = Math.min(a.pos.x + CARD_W, b.pos.x + CARD_W) - Math.max(a.pos.x, b.pos.x);
      const overlapY = Math.min(a.pos.y + hA, b.pos.y + hB) - Math.max(a.pos.y, b.pos.y);

      if (overlapX > 0 && overlapY > 0) {
        const sep = norm(sub(stackCenter(b), stackCenter(a)));
        const forceMagnitude = Math.min(overlapX, overlapY) / 20;
        addScaled(a.vel, sep, -forceMagnitude);
        addScaled(b.vel, sep, forceMagnitude);
      }
    }
  }

  // Integration and bumpers
  for (const stack of stacks) {
    if (stack.dragging) {
      stack.vel = { x: 0, y: 0 };
      continue;
    }

    const h = stackHeight(stack);

    // Bumpers: push stack back if it strays outside the board
    if (stack.pos.x < 0) {
      stack.vel.x -= stack.pos.x * 0.05;
    }
    if (stack.pos.x + CARD_W > BOARD_SIZE) {
      stack.vel.x -= (stack.pos.x + CARD_W - BOARD_SIZE) * 0.05;
    }
    if (stack.pos.y < 0) {
      stack.vel.y -= stack.pos.y * 0.05;
    }
    if (stack.pos.y + h > BOARD_SIZE) {
      stack.vel.y -= (stack.pos.y + h - BOARD_SIZE) * 0.05;
    }

    // Speed limit
    const speed = len(stack.vel);
    if (speed > 0.25) {
      const { x, y } = norm(stack.vel);
      stack.vel.x = x * 0.25;
      stack.vel.y = y * 0.25;
    }

    addScaled(stack.pos, stack.vel, 1);
    stack.vel.x = 0;
    stack.vel.y = 0;
  }
}
