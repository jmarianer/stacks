<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card from '$lib/Card.svelte';
  import { BOARD_SIZE, STACK_CARD_OFFSET_Y, CARD_W, CARD_H, DROP_TARGET_INSET } from '$lib/constants';
  import Draggable from './Draggable.svelte';
  import { addScaled } from '$lib/utils/vec2';
  import { type Stack, initialStacks, makeStackFromCards } from '$lib/cards';
  import { tick } from '$lib/physics';

  let scale = $state(1);
  let translateX = $state(0);
  let translateY = $state(0);
  let vmin = $state(0);

  $effect(() => {
    vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    const boardSize = vmin * BOARD_SIZE;
    translateX = (window.innerWidth - boardSize) / 2;
    translateY = (window.innerHeight - boardSize) / 2;
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    scale = scale * zoomFactor;
    translateX = e.clientX - (e.clientX - translateX) * zoomFactor;
    translateY = e.clientY - (e.clientY - translateY) * zoomFactor;
  }

  function onKeyDown(e: KeyboardEvent) {
    const speed = 20;
    if (e.key === 'w') translateY += speed;
    if (e.key === 's') translateY -= speed;
    if (e.key === 'a') translateX += speed;
    if (e.key === 'd') translateX -= speed;
  }

  let stacks = $state<Stack[]>(initialStacks);

  // Flat list of all cards with their stack and index, keyed by cardData.id.
  // Using a flat {#each} preserves Draggable component instances when cards
  // move between stacks (e.g. during peel), keeping isDragging state intact.
  const renderedCards = $derived(
    stacks.flatMap((stack) =>
      stack.cards.map((cardData, i) => ({ cardData, stack, cardIndex: i }))
    )
  );

  let mouseX = 0;
  let mouseY = 0;

  function handleDragStart(stack: Stack, cardIndex: number, e: MouseEvent) {
    if (e.ctrlKey || cardIndex === 0) {
      // Drag the whole stack
      stack.dragging = true;
      stacks = [...stacks.filter((s) => s.id !== stack.id), stack];
    } else {
      // Peel this card and everything above it into a new stack
      const peeledCards = stack.cards.slice(cardIndex);
      stack.cards = stack.cards.slice(0, cardIndex);
      const newStack = makeStackFromCards(
        { x: stack.pos.x, y: stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y },
        peeledCards
      );
      newStack.dragging = true;
      stacks = [...stacks, newStack];
    }
  }

  function handleDragEnd() {
    const dragging = stacks.find((s) => s.dragging);
    if (!dragging) return;

    const target = stacks.find((s) => s.isDropTarget);
    if (target) {
      target.cards = [...target.cards, ...dragging.cards];
      target.isDropTarget = false;
      stacks = stacks.filter((s) => s.id !== dragging.id);
    } else {
      dragging.dragging = false;
    }
  }

  function updateDropTargets() {
    const anyDragging = stacks.some((s) => s.dragging);
    if (!anyDragging) {
      for (const s of stacks) s.isDropTarget = false;
      return;
    }

    // Convert mouse to board coordinate space
    const boardMouse = {
      x: (mouseX - translateX) / (vmin * scale),
      y: (mouseY - translateY) / (vmin * scale),
    };

    // Mark the first stack whose circle contains the mouse as the drop target
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
        const cx = stack.pos.x + CARD_W / 2;
        const cy = stack.pos.y + i * STACK_CARD_OFFSET_Y + CARD_H / 2;
        return (
          Math.abs(boardMouse.x - cx) <= CARD_W / 2 - DROP_TARGET_INSET &&
          Math.abs(boardMouse.y - cy) <= CARD_H / 2 - DROP_TARGET_INSET
        );
      });
      if (stack.isDropTarget) foundTarget = true;
    }
  }

  $effect(() => {
    let rafId: number;

    function loop() {
      updateDropTargets();
      tick(stacks);
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  });
</script>

<div class="viewport">
  <Draggable
    onDrag={(dx, dy) => {
      translateX += dx;
      translateY += dy;
    }}
    class="board"
    style="
      width: {BOARD_SIZE}vmin;
      height: {BOARD_SIZE}vmin;
      transform: translate({translateX}px, {translateY}px) scale({scale});
    "
    onwheel={onWheel}
  >
    {#each renderedCards as { cardData, stack, cardIndex } (cardData.id)}
      <Card
        value={cardData.value}
        color={cardData.color}
        top={stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y}
        left={stack.pos.x}
        isDropTarget={stack.isDropTarget}
        onDragStart={(e) => handleDragStart(stack, cardIndex, e)}
        onDragEnd={handleDragEnd}
        onDrag={(dx, dy) => {
          addScaled(stack.pos, { x: dx, y: dy }, 1 / (vmin * scale));
        }}
      />
    {/each}
  </Draggable>
</div>

<svelte:window
  onkeydown={onKeyDown}
  onmousemove={(e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }}
/>

<style>
  .viewport {
    width: 100vw;
    height: 100vh;
    background-color: deeppink;
    overflow: hidden;
    position: relative;
  }

  :global .board {
    position: relative;
    background-color: darkolivegreen;
    transform-origin: 0 0;
    border: 1vmin solid rgba(0, 0, 0, 0.8);
    border-radius: 5vmin;
    overflow: hidden;
  }
</style>
