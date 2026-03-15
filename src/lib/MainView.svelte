<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card, { CARD_W, CARD_H } from '$lib/Card.svelte';
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

  type Card = {
    id: number;
    value: number;
    color: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    dragging: boolean;
  };

  let nextId = 1;
  function makeCard(fields: Omit<Card, 'id' | 'vx' | 'vy' | 'dragging'>): Card {
    return { ...fields, id: nextId++, vx: 0, vy: 0, dragging: false };
  }

  let cards = $state<Card[]>([
    makeCard({ value: 1, color: 'hotpink', x: 50, y: 50 }),
    makeCard({ value: 2, color: 'hotpink', x: 20, y: 50 }),
  ]);

  $effect(() => {
    let rafId: number;

    function tick() {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i];
          const b = cards[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const overlapX = CARD_W - Math.abs(dx);
          const overlapY = CARD_H - Math.abs(dy);

          if (!a.dragging && !b.dragging && overlapX > 0 && overlapY > 0) {
            // Push along the axis of least overlap
            if (overlapX < overlapY) {
              const push = (overlapX / 2) * 0.1;
              const dir = dx >= 0 ? 1 : -1;
              a.vx -= dir * push;
              b.vx += dir * push;
            } else {
              const push = (overlapY / 2) * 0.1;
              const dir = dy >= 0 ? 1 : -1;
              a.vy -= dir * push;
              b.vy += dir * push;
            }
          }
        }
      }

      for (const card of cards) {
        if (card.dragging) {
          card.vx = 0;
          card.vy = 0;
          continue;
        }
        card.x += card.vx;
        card.y += card.vy;
        card.vx *= 0.9;
        card.vy *= 0.9;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
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
    style="transform: translate({translateX}px, {translateY}px) scale({scale})"
    onwheel={onWheel}
  >
    {#each cards as card (card.id)}
      <Card
        value={card.value}
        color={card.color}
        top={card.y}
        left={card.x}
        onDragStart={() => {
            card.dragging = true;
            cards = [...cards.filter(c => c.id !== card.id), card];
          }}
        onDragEnd={() => (card.dragging = false)}
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
