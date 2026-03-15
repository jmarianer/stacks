<script module lang="ts">
  export const BOARD_SIZE = 140;
</script>

<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card, { CARD_W, CARD_H } from '$lib/Card.svelte';
  import Draggable from './Draggable.svelte';
  import { type Vec2, sub, len, norm, addScaled } from '$lib/utils/vec2';

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

  type Card = {
    id: number;
    value: number;
    color: string;
    pos: Vec2;
    vel: Vec2;
    dragging: boolean;
  };

  let nextId = 1;
  function makeCard(fields: Omit<Card, 'id' | 'vel' | 'dragging'>): Card {
    return { ...fields, id: nextId++, vel: { x: 0, y: 0 }, dragging: false };
  }

  let cards = $state<Card[]>([
    makeCard({ value: 1, color: 'hotpink', pos: { x: 50, y: 50 } }),
    makeCard({ value: 2, color: 'hotpink', pos: { x: 20, y: 50 } }),
  ]);

  $effect(() => {
    let rafId: number;

    function tick() {
      for (let i = 0; i < cards.length; i++) {
        const a = cards[i];
        if (a.dragging) continue;

        for (let j = i + 1; j < cards.length; j++) {
          const b = cards[j];
          if (b.dragging) continue;

          const d = sub(b.pos, a.pos);
          const overlapX = CARD_W - Math.abs(d.x);
          const overlapY = CARD_H - Math.abs(d.y);

          if (!a.dragging && !b.dragging && overlapX > 0 && overlapY > 0) {
            // Push away from center-to-center vector
            const sep = norm(d);
            const forceMagnitude = Math.min(overlapX, overlapY) / 20;
            addScaled(a.vel, sep, -forceMagnitude);
            addScaled(b.vel, sep, forceMagnitude);
          }
        }
      }

      for (const card of cards) {
        if (card.dragging) {
          card.vel = { x: 0, y: 0 };
          continue;
        }

        // Bumpers: push card back if it strays outside the board
        if (card.pos.x < 0) {
          card.vel.x -= card.pos.x * 0.05;
        }
        if (card.pos.x + CARD_W > BOARD_SIZE) {
          card.vel.x -= (card.pos.x + CARD_W - BOARD_SIZE) * 0.05;
        }
        if (card.pos.y < 0) {
          card.vel.y -= card.pos.y * 0.05;
        }
        if (card.pos.y + CARD_H > BOARD_SIZE) {
          card.vel.y -= (card.pos.y + CARD_H - BOARD_SIZE) * 0.05;
        }

        const speed = len(card.vel);
        if (speed > 0.25) {
          // Too fast, make it slower
          const {x, y} = norm(card.vel);
          card.vel.x = x * 0.25;
          card.vel.y = y * 0.25;
        }

        addScaled(card.pos, card.vel, 1);
        card.vel.x *= 0.9;
        card.vel.y *= 0.9;
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
    style="
      width: {BOARD_SIZE}vmin;
      height: {BOARD_SIZE}vmin;
      transform: translate({translateX}px, {translateY}px) scale({scale});
    "
    onwheel={onWheel}
  >
    {#each cards as card (card.id)}
      <Card
        value={card.value}
        color={card.color}
        top={card.pos.y}
        left={card.pos.x}
        onDragStart={() => {
          card.dragging = true;
          cards = [...cards.filter((c) => c.id !== card.id), card];
        }}
        onDragEnd={() => (card.dragging = false)}
        onDrag={(dx, dy) => {
          addScaled(card.pos, { x: dx, y: dy }, 1 / (vmin * scale));
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
    position: relative;
    background-color: darkolivegreen;
    transform-origin: 0 0;
    border: 1vmin solid rgba(0, 0, 0, 0.8);
    border-radius: 5vmin;
    overflow: hidden;
  }
</style>
