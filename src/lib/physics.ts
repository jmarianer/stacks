import { CARD_W, CARD_H, BOARD_SIZE, STACK_CARD_OFFSET_Y } from '$lib/constants';
import type { Stack } from '$lib/cards';
import { type Vec2, sub, len, norm, addScaled } from '$lib/utils/vec2';
import { rectCenter, rectExtend, type Rect } from './utils/rect';

const CARD_GAP = 1;
const BOARD_PADDING = 5;

function stackDimensions(stack: Stack): Rect {
  const { x, y } = stack.pos;
  return { x, y, width: CARD_W, height: CARD_H + (stack.cards.length - 1) * STACK_CARD_OFFSET_Y };
}

function stackCenter(stack: Stack): Vec2 {
  return rectCenter(stackDimensions(stack));
}

export function tick(stacks: Stack[]): void {
  // Accumulate velocities, then apply them all at once
  const velocities: Record<number, Vec2> = {};
  for (const stack of stacks) {
    velocities[stack.id] = { x: 0, y: 0 };
  }

  // Stack-stack repulsion
  for (let i = 0; i < stacks.length; i++) {
    const a = stacks[i];
    if (a.dragging) continue;

    const aDim = rectExtend(stackDimensions(a), CARD_GAP);

    for (let j = i + 1; j < stacks.length; j++) {
      const b = stacks[j];
      if (b.dragging) continue;

      const bDim = rectExtend(stackDimensions(b), CARD_GAP);
      const overlapX = Math.min(aDim.x + aDim.width, bDim.x + bDim.width) - Math.max(aDim.x, bDim.x);
      const overlapY = Math.min(aDim.y + aDim.height, bDim.y + bDim.height) - Math.max(aDim.y, bDim.y);

      if (overlapX > 0 && overlapY > 0) {
        const sep = norm(sub(stackCenter(b), stackCenter(a)));
        const forceMagnitude = Math.min(overlapX, overlapY) / 20;
        addScaled(velocities[a.id], sep, -forceMagnitude);
        addScaled(velocities[b.id], sep, forceMagnitude);
      }
    }
  }

  for (const stack of stacks) {
    const { x, y, width, height } = stackDimensions(stack);

    // Bumpers: push stack back if it strays outside the board
    if (x < BOARD_PADDING) {
      velocities[stack.id].x += (BOARD_PADDING - x) * 0.05;
    }
    if (x + width > BOARD_SIZE - BOARD_PADDING) {
      velocities[stack.id].x -= (x + width - (BOARD_SIZE - BOARD_PADDING)) * 0.05;
    }
    if (y < BOARD_PADDING) {
      velocities[stack.id].y += (BOARD_PADDING - y) * 0.05;
    }
    if (y + height > BOARD_SIZE - BOARD_PADDING) {
      velocities[stack.id].y -= (y + height - (BOARD_SIZE - BOARD_PADDING)) * 0.05;
    }

    // Speed limit
    const speed = len(velocities[stack.id]);
    if (speed > 0.25) {
      const { x, y } = norm(velocities[stack.id]);
      velocities[stack.id].x = x * 0.25;
      velocities[stack.id].y = y * 0.25;
    }
  }

  // Apply velocities
  for (const stack of stacks) {
    if (stack.dragging) continue;
    addScaled(stack.pos, velocities[stack.id], 1);
  }
}
