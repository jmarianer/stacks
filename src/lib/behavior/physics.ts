import {
  CARD_W,
  CARD_H,
  STACK_CARD_OFFSET_Y,
  STACK_CARD_OFFSET_X,
  CARD_GAP,
  PHYSICS_SPEED_LIMIT,
} from '$lib/data/constants';
import type { Stack, Board } from '$lib/types/game-state';
import { type Vec2, sub, len, norm, addScaled } from '$lib/utils/vec2';
import { rectCenter, rectExtend, type Rect } from '$lib/utils/rect';

const BOARD_PADDING = 5;

function stackDimensions(stack: Stack): Rect {
  const { x, y } = stack.pos;
  const n = stack.cards.length - 1;
  return {
    x,
    y,
    width: CARD_W + n * STACK_CARD_OFFSET_X,
    height: CARD_H + n * STACK_CARD_OFFSET_Y,
  };
}

function stackCenter(stack: Stack): Vec2 {
  return rectCenter(stackDimensions(stack));
}

export function tick(board: Board, draggingId: number | null = null): void {
  const stacks = board.stacks;
  // Accumulate velocities, then apply them all at once
  const velocities: Record<number, Vec2> = {};
  for (const stack of stacks) {
    velocities[stack.id] = { x: 0, y: 0 };
  }

  // Stack-stack repulsion
  for (let i = 0; i < stacks.length; i++) {
    const a = stacks[i];
    if (a.id === draggingId) continue;

    const aDim = rectExtend(stackDimensions(a), CARD_GAP);

    for (let j = i + 1; j < stacks.length; j++) {
      const b = stacks[j];
      if (b.id === draggingId) continue;

      const bDim = rectExtend(stackDimensions(b), CARD_GAP);
      const overlapX =
        Math.min(aDim.x + aDim.width, bDim.x + bDim.width) - Math.max(aDim.x, bDim.x);
      const overlapY =
        Math.min(aDim.y + aDim.height, bDim.y + bDim.height) - Math.max(aDim.y, bDim.y);

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
    if (x + width > board.width - BOARD_PADDING) {
      velocities[stack.id].x -= (x + width - (board.width - BOARD_PADDING)) * 0.05;
    }
    if (y < BOARD_PADDING) {
      velocities[stack.id].y += (BOARD_PADDING - y) * 0.05;
    }
    if (y + height > board.height - BOARD_PADDING) {
      velocities[stack.id].y -= (y + height - (board.height - BOARD_PADDING)) * 0.05;
    }

    // Speed limit
    const speed = len(velocities[stack.id]);
    if (speed > PHYSICS_SPEED_LIMIT) {
      const { x, y } = norm(velocities[stack.id]);
      velocities[stack.id].x = x * PHYSICS_SPEED_LIMIT;
      velocities[stack.id].y = y * PHYSICS_SPEED_LIMIT;
    }
  }

  // Apply velocities — foundations are immovable (grid-snapped, never drift)
  for (const stack of stacks) {
    if (stack.id === draggingId) continue;
    if (stack.cards[0]?.type === 'foundation') continue;
    addScaled(stack.pos, velocities[stack.id], 1);
  }
}
