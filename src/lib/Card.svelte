<script lang="ts">
  import Draggable, { type DragProps } from './Draggable.svelte';
  import { CARD_W, CARD_H } from '$lib/constants';
  import { CARD_CATALOG } from '$lib/card-catalog';
  import type { CardType } from '$lib/cards';

  let { type, top, left, isDropTarget = false, onDrag, onDragStart, onDragEnd } = $props<{
    type: CardType;
    top: number;
    left: number;
    isDropTarget?: boolean;
  } & DragProps>();

  const def = $derived(CARD_CATALOG[type]);
</script>

<Draggable
  class="card {isDropTarget ? 'drop-target' : ''}"
  style="
    top: {top}vmin;
    left: {left}vmin;
    width: {CARD_W}vmin;
    height: {CARD_H}vmin;
    background-color: {def.color};
  "
  {onDrag}
  {onDragStart}
  {onDragEnd}
>
  <div class="card-inner">
    <div class="title">{def.title}</div>
    <div class="circle-area">
      <div class="circle">{def.symbol}</div>
    </div>
    <div class="title inverted">{def.title}</div>
  </div>
</Draggable>

<style>
  :global .card {
    border-radius: 1vmin;
    position: absolute;
    border: 0.5vmin solid white;
    box-shadow: -0.3vmin -0.5vmin 1vmin rgba(0, 0, 0, 0.5);
    &.drop-target {
      filter: brightness(0.75);
    }
  }

  .card-inner {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .title {
    height: 4vmin;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'BigNoodleTitling';
    font-size: 3vmin;
    color: white;
    border-bottom: 0.5vmin solid #000;

    &.inverted {
      transform: rotate(180deg);
    }
  }

  .circle-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .circle {
    width: 14vmin;
    height: 14vmin;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: 'BigNoodleTitling';
    font-size: 10vmin;
  }
</style>
