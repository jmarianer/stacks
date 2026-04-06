import { gameState } from '$lib/state/game-state.svelte';
import { makeStackFromCards } from '$lib/utils/card-factories';
import {
  STACK_CARD_OFFSET_X,
  STACK_CARD_OFFSET_Y,
  CARD_W,
  CARD_H,
  DROP_TARGET_INSET,
  FOUNDATION_X_GAP,
  FOUNDATION_Y_GAP,
} from '$lib/data/constants';
import type { Stack } from '$lib/types/game-state';

export function useDragAndDrop(boardMouse: () => { x: number; y: number }) {
  let draggingId = $state<number | null>(null);
  let dropTargetId = $state<number | null>(null);

  function handleDragStart(stack: Stack, cardIndex: number, e: MouseEvent): void {
    const currentBoard = gameState.boards[gameState.currentBoardIndex];
    const stacks = currentBoard.stacks;
    if (e.altKey || cardIndex === 0) {
      draggingId = stack.id;
      currentBoard.stacks = [...stacks.filter((s) => s.id !== stack.id), stack];
    } else {
      const peeledCards = stack.cards.slice(cardIndex);
      stack.cards = stack.cards.slice(0, cardIndex);
      const newStack = makeStackFromCards(
        {
          x: stack.pos.x + cardIndex * STACK_CARD_OFFSET_X,
          y: stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y,
        },
        peeledCards,
      );
      draggingId = newStack.id;
      currentBoard.stacks = [...stacks, newStack];
    }
  }

  function handleDragEnd(): void {
    if (draggingId === null) return;
    const currentBoard = gameState.boards[gameState.currentBoardIndex];
    const stacks = currentBoard.stacks;
    const dragging = stacks.find((s) => s.id === draggingId);
    if (!dragging) {
      draggingId = null;
      dropTargetId = null;
      return;
    }

    // Grid-snap stacks based on a foundation card
    if (dragging.cards[0]?.type === 'foundation') {
      dragging.pos.x =
        Math.round(dragging.pos.x / (CARD_W + FOUNDATION_X_GAP)) * (CARD_W + FOUNDATION_X_GAP) + FOUNDATION_X_GAP;
      dragging.pos.y =
        Math.round(dragging.pos.y / (CARD_H + FOUNDATION_Y_GAP)) * (CARD_H + FOUNDATION_Y_GAP) +
        FOUNDATION_Y_GAP;
    }

    const target = dropTargetId !== null ? stacks.find((s) => s.id === dropTargetId) : null;
    if (target) {
      const teleportCard = target.cards.find((c) => c.type === 'teleport');
      if (teleportCard?.targetBoardIndex !== undefined) {
        const destIdx = teleportCard.targetBoardIndex;
        const dest = gameState.boards[destIdx];
        dest.stacks = [
          ...dest.stacks,
          makeStackFromCards({ x: dest.width / 2, y: dest.height / 2 }, dragging.cards),
        ];
        currentBoard.stacks = stacks.filter((s) => s.id !== target.id && s.id !== dragging.id);
        gameState.currentBoardIndex = destIdx;
        draggingId = null;
        dropTargetId = null;
        return;
      }
      target.cards = [...target.cards, ...dragging.cards];
      currentBoard.stacks = stacks.filter((s) => s.id !== dragging.id);
      dropTargetId = null;
    }
    draggingId = null;
  }

  function updateDropTargets(): void {
    if (draggingId === null) {
      dropTargetId = null;
      return;
    }
    const { x: mx, y: my } = boardMouse();
    const stacks = gameState.boards[gameState.currentBoardIndex].stacks;
    let newDropTargetId: number | null = null;
    for (const stack of stacks) {
      if (stack.id === draggingId) continue;
      if (newDropTargetId !== null) continue;
      const isTarget = stack.cards.some((_, i) => {
        const cx = stack.pos.x + i * STACK_CARD_OFFSET_X + CARD_W / 2;
        const cy = stack.pos.y + i * STACK_CARD_OFFSET_Y + CARD_H / 2;
        return (
          Math.abs(mx - cx) <= CARD_W / 2 - DROP_TARGET_INSET &&
          Math.abs(my - cy) <= CARD_H / 2 - DROP_TARGET_INSET
        );
      });
      if (isTarget) newDropTargetId = stack.id;
    }
    dropTargetId = newDropTargetId;
  }

  return {
    get draggingId() {
      return draggingId;
    },
    get dropTargetId() {
      return dropTargetId;
    },
    get foundationSnapPos(): { x: number; y: number } | null {
      if (draggingId === null || dropTargetId !== null) return null;
      const dragging = gameState.boards[gameState.currentBoardIndex].stacks.find(
        (s) => s.id === draggingId,
      );
      if (!dragging || dragging.cards[0]?.type !== 'foundation') return null;
      return {
        x:
          Math.round(dragging.pos.x / (CARD_W + FOUNDATION_X_GAP)) * (CARD_W + FOUNDATION_X_GAP) +
          FOUNDATION_X_GAP,
        y:
          Math.round(dragging.pos.y / (CARD_H + FOUNDATION_Y_GAP)) * (CARD_H + FOUNDATION_Y_GAP) +
          FOUNDATION_Y_GAP,
      };
    },
    handleDragStart,
    handleDragEnd,
    updateDropTargets,
  };
}
