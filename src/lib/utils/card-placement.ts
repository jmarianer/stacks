import type { Stack } from '$lib/types/game-state';
import { type CardType } from '$lib/data/card-defs';
import type { Vec2 } from '$lib/utils/vec2';
import { makeCardOfType, makeStack } from '$lib/utils/card-factories';

/** Add a card of `type` to the first existing stack that already contains that type,
 *  or create a new stack at `fallbackPos` if none exists. */
export function addCardToMatchingStack(stacks: Stack[], type: CardType, fallbackPos: Vec2): void {
  const existing = stacks.find((s) => s.cards.some((c) => c.type === type));
  if (existing) {
    existing.cards.push(makeCardOfType(type));
  } else {
    stacks.push(makeStack(fallbackPos, [type]));
  }
}
