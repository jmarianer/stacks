<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card from '$lib/Card.svelte';
  import Draggable from './Draggable.svelte';

  let scale = $state(1);
  let translateX = $state(0);
  let translateY = $state(0);

  let vmin = $state(0);

  $effect(() => {
    vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    const boardSize = vmin * 140;
    translateX = (window.innerWidth - boardSize) / 2;
    translateY = (window.innerHeight - boardSize) / 2;
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();

    console.log(e.deltaY);
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = scale * zoomFactor;

    translateX = e.clientX - (e.clientX - translateX) * (newScale / scale);
    translateY = e.clientY - (e.clientY - translateY) * (newScale / scale);
    scale = newScale;
  }

  function onKeyDown(e: KeyboardEvent) {
    const speed = 20;
    if (e.key === 'w') translateY += speed;
    if (e.key === 's') translateY -= speed;
    if (e.key === 'a') translateX += speed;
    if (e.key === 'd') translateX -= speed;
  }

  type Card = {
    value: number;
    color: string;
    x: number;
    y: number;
  };

  let cards = $state<Card[]>([
    { value: 1, color: 'hotpink', x: 50, y: 50 },
    { value: 2, color: 'hotpink', x: 20, y: 50 }
  ]);
</script>

<div class="viewport">
  <Draggable
    onDrag={(dx, dy) => {
      translateX += dx;
      translateY += dy;
    }}
    class="board"
    style="transform: translate({translateX}px, {translateY}px) scale({scale})"
    onwheel={onWheel}
  >
    {#each cards as card, i (i)}
      <Card
        value={card.value}
        color={card.color}
        top={card.y}
        left={card.x}
        onDrag={(dx, dy) => {
          card.x += dx / (vmin * scale);
          card.y += dy / (vmin * scale);
        }}
      />
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
    width: 140vmin;
    height: 140vmin;
    position: relative;
    background-color: darkolivegreen;
    transform-origin: 0 0;
    border: 1vmin solid rgba(0, 0, 0, 0.8);
    border-radius: 5vmin;
    overflow: hidden;
  }
</style>
