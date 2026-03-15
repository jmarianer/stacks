<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card from '$lib/Card.svelte';
  import { BOARD_SIZE } from '$lib/constants';
  import Draggable from './Draggable.svelte';
  import { STACK_CARD_OFFSET_Y } from '$lib/constants';
  import { addScaled } from '$lib/utils/vec2';
  import { type Stack, initialStacks } from '$lib/cards';
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

  $effect(() => {
    let rafId: number;

    function loop() {
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
    {#each stacks as stack (stack.id)}
      {#each stack.cards as cardData, i (cardData.id)}
        <Card
          value={cardData.value}
          color={cardData.color}
          top={stack.pos.y + i * STACK_CARD_OFFSET_Y}
          left={stack.pos.x}
          onDragStart={() => {
            stack.dragging = true;
            stacks = [...stacks.filter((s) => s.id !== stack.id), stack];
          }}
          onDragEnd={() => (stack.dragging = false)}
          onDrag={(dx, dy) => {
            addScaled(stack.pos, { x: dx, y: dy }, 1 / (vmin * scale));
          }}
        />
      {/each}
    {/each}
  </Draggable>
</div>

<svelte:window onkeydown={onKeyDown} />

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
