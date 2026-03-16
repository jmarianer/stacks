<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card from '$lib/Card.svelte';
  import {
    STACK_CARD_OFFSET_Y,
    STACK_CARD_OFFSET_X,
    CARD_W,
    CARD_H,
    DROP_TARGET_INSET,
  } from '$lib/constants';
  import Draggable from './Draggable.svelte';
  import { addScaled } from '$lib/utils/vec2';
  import { type Stack, type Board, type ShopItem } from '$lib/cards';
  import { CARD_CATALOG, initialBoards, makeStack, makeStackFromCards } from '$lib/card-catalog';
  import { tick as tickPhysics } from '$lib/physics';
  import { tick as tickProgress } from '$lib/progress';

  let scale = $state(1);
  let translate = $state({ x: 0, y: 0 });
  let vmin = $state(0);

  function updateVmin() {
    vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  }

  $effect(() => {
    updateVmin();
    translate.x = (window.innerWidth - currentBoard.width * vmin) / 2;
    translate.y = (window.innerHeight - currentBoard.height * vmin) / 2;
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    scale = scale * zoomFactor;
    translate.x = e.clientX - (e.clientX - translate.x) * zoomFactor;
    translate.y = e.clientY - (e.clientY - translate.y) * zoomFactor;
  }

  function boardMouse() {
    return {
      x: (mousePosition.x - translate.x) / (vmin * scale),
      y: (mousePosition.y - translate.y) / (vmin * scale),
    };
  }

  function stackAtMouse(): Stack | undefined {
    const { x, y } = boardMouse();
    return currentBoard.stacks.findLast((stack) =>
      stack.cards.some((_, i) => {
        const cx = stack.pos.x + i * STACK_CARD_OFFSET_X + CARD_W / 2;
        const cy = stack.pos.y + i * STACK_CARD_OFFSET_Y + CARD_H / 2;
        return Math.abs(x - cx) <= CARD_W / 2 && Math.abs(y - cy) <= CARD_H / 2;
      }),
    );
  }

  function onKeyDown(e: KeyboardEvent) {
    const speed = 20;
    if (e.key === 'w') translate.y += speed;
    if (e.key === 's') translate.y -= speed;
    if (e.key === 'a') translate.x += speed;
    if (e.key === 'd') translate.x -= speed;
    if (e.key === 'Backspace') {
      const stack = stackAtMouse();
      if (!stack) return;
      const sellable = stack.cards.filter((c) => CARD_CATALOG[c.type].value !== undefined);
      if (sellable.length === 0) return;
      currentBoard.currency += sellable.reduce((sum, c) => sum + CARD_CATALOG[c.type].value!, 0);
      stack.cards = stack.cards.filter((c) => CARD_CATALOG[c.type].value === undefined);
      if (stack.cards.length === 0) {
        currentBoard.stacks = currentBoard.stacks.filter((s) => s.id !== stack.id);
      }
    }
  }

  let boards = $state<Board[]>(initialBoards);
  let currentBoardIndex = $state(0);
  const currentBoard = $derived(boards[currentBoardIndex]);

  // Flat list of all cards with their stack and index, keyed by cardData.id.
  // Using a flat {#each} preserves Draggable component instances when cards
  // move between stacks (e.g. during peel), keeping isDragging state intact.
  const renderedCards = $derived(
    currentBoard.stacks.flatMap((stack) =>
      stack.cards.map((cardData, i) => ({ cardData, stack, cardIndex: i })),
    ),
  );

  let mousePosition = { x: 0, y: 0 };

  function handleDragStart(stack: Stack, cardIndex: number, e: MouseEvent) {
    const stacks = currentBoard.stacks;
    if (e.altKey || cardIndex === 0) {
      // Drag the whole stack
      stack.dragging = true;
      currentBoard.stacks = [...stacks.filter((s) => s.id !== stack.id), stack];
    } else {
      // Peel this card and everything above it into a new stack
      const peeledCards = stack.cards.slice(cardIndex);
      stack.cards = stack.cards.slice(0, cardIndex);
      const newStack = makeStackFromCards(
        {
          x: stack.pos.x + cardIndex * STACK_CARD_OFFSET_X,
          y: stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y,
        },
        peeledCards,
      );
      newStack.dragging = true;
      currentBoard.stacks = [...stacks, newStack];
    }
  }

  function handleDragEnd() {
    const stacks = currentBoard.stacks;
    const dragging = stacks.find((s) => s.dragging);
    if (!dragging) return;

    const target = stacks.find((s) => s.isDropTarget);
    if (target) {
      target.cards = [...target.cards, ...dragging.cards];
      target.isDropTarget = false;
      currentBoard.stacks = stacks.filter((s) => s.id !== dragging.id);
    } else {
      dragging.dragging = false;
    }
  }

  function updateDropTargets() {
    const stacks = currentBoard.stacks;
    const anyDragging = stacks.some((s) => s.dragging);
    if (!anyDragging) {
      for (const s of stacks) s.isDropTarget = false;
      return;
    }

    const { x: mx, y: my } = boardMouse();

    // Mark the first stack whose drop target rectangle contains the mouse
    let foundTarget = false;
    for (const stack of stacks) {
      if (stack.dragging) {
        stack.isDropTarget = false;
        continue;
      }
      if (foundTarget) {
        stack.isDropTarget = false;
        continue;
      }
      // Target rectangle: DROP_TARGET_INSET from each edge of the card
      stack.isDropTarget = stack.cards.some((_, i) => {
        const cx = stack.pos.x + i * STACK_CARD_OFFSET_X + CARD_W / 2;
        const cy = stack.pos.y + i * STACK_CARD_OFFSET_Y + CARD_H / 2;
        return (
          Math.abs(mx - cx) <= CARD_W / 2 - DROP_TARGET_INSET &&
          Math.abs(my - cy) <= CARD_H / 2 - DROP_TARGET_INSET
        );
      });
      if (stack.isDropTarget) foundTarget = true;
    }
  }

  function buyCard(item: ShopItem) {
    if (currentBoard.currency < item.price) return;
    currentBoard.currency -= item.price;
    const pos = { x: currentBoard.width / 2, y: currentBoard.height / 2 };
    const newStack = makeStack(pos, [item.cardType]);
    currentBoard.stacks = [...currentBoard.stacks, newStack];
  }

  $effect(() => {
    let rafId: number;

    function loop() {
      const now = performance.now();
      updateDropTargets();
      tickPhysics(currentBoard);
      tickProgress(currentBoard.stacks, now);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  });
</script>

<div class="viewport">
  <Draggable
    onDrag={(dx, dy) => {
      translate.x += dx;
      translate.y += dy;
    }}
    class="board"
    style="
      width: {currentBoard.width}vmin;
      height: {currentBoard.height}vmin;
      transform: translate({translate.x}px, {translate.y}px) scale({scale});
    "
    onwheel={onWheel}
  >
    {#each renderedCards as { cardData, stack, cardIndex } (cardData.id)}
      <Card
        {cardData}
        top={stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y}
        left={stack.pos.x + cardIndex * STACK_CARD_OFFSET_X}
        isDropTarget={stack.isDropTarget && cardIndex === stack.cards.length - 1}
        onDragStart={(e) => handleDragStart(stack, cardIndex, e)}
        onDragEnd={handleDragEnd}
        onDrag={(dx, dy) => {
          addScaled(stack.pos, { x: dx, y: dy }, 1 / (vmin * scale));
        }}
      />
    {/each}
    {#each currentBoard.stacks as stack (stack.id)}
      {#if stack.activeRecipeId !== null}
        {@const progressBarLeft = stack.pos.x}
        {@const progressBarTop = stack.pos.y - 2.5}
        <div
          class="progress-bar"
          style="left: {progressBarLeft}vmin; top: {progressBarTop}vmin; width: {CARD_W}vmin;"
        >
          <div class="progress-bar-fill" style="width: {stack.progress * 100}%;"></div>
        </div>
      {/if}
    {/each}
  </Draggable>
  <div class="hud">
    <span class="currency">${currentBoard.currency}</span>
    <div class="shop">
      {#each currentBoard.shop as item (item.id)}
        <button
          class="shop-item"
          disabled={currentBoard.currency < item.price}
          onclick={() => buyCard(item)}
        >
          <span class="shop-symbol" style="color: {item.color}">{item.symbol}</span>
          <span class="shop-price">${item.price}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<svelte:window
  onresize={updateVmin}
  onkeydown={onKeyDown}
  onmousemove={(e) => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  }}
/>

<style>
  .viewport {
    width: 100vw;
    height: 100vh;
    background-color: #3d2b1f;
    overflow: hidden;
    position: relative;
  }

  .hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.4);
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    font-size: 1.5rem;
    pointer-events: none;

    .currency {
      min-width: 4rem;
    }

    .shop {
      display: flex;
      gap: 0.5rem;
      pointer-events: all;
    }

    .shop-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.75rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.4rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.25rem;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.25);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }

      .shop-symbol {
        font-size: 1.5rem;
      }
    }
  }

  :global .board {
    position: relative;
    background-color: #c9a96e;
    transform-origin: 0 0;
    border: 1vmin solid #8b6914;
    border-radius: 5vmin;
    overflow: hidden;

    .progress-bar {
      position: absolute;
      height: 2vmin;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 0.5vmin 0.5vmin 0 0;
      overflow: hidden;
      pointer-events: none;

      .progress-bar-fill {
        height: 100%;
        background: limegreen;
      }
    }
  }
</style>
