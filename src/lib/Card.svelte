<script lang="ts">
  import Draggable, { type DragProps } from './Draggable.svelte';
  import { CARD_W, CARD_H } from '$lib/constants';
  import { CARD_CATALOG } from '$lib/card-catalog';
  import type { CardData } from '$lib/cards';

  let {
    cardData,
    top,
    left,
    isDropTarget = false,
    onDrag,
    onDragStart,
    onDragEnd,
  }: {
    cardData: CardData;
    top: number;
    left: number;
    isDropTarget?: boolean;
  } & DragProps = $props();

  const def = $derived(CARD_CATALOG[cardData.type]);
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
    <div class="footer">
      {#if def.value !== undefined}
        <div class="value">{def.value}</div>
      {/if}
      {#if cardData.energyRemaining !== undefined}
        <div class="energy">{cardData.energyRemaining ?? ''}</div>
      {/if}
    </div>
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
  }

  .footer {
    height: 4vmin;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.75vmin;
  }

  .value,
  .energy {
    width: 3vmin;
    height: 3vmin;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'BigNoodleTitling';
    color: white;
  }

  .value {
    border-radius: 50%;
  }

  .energy {
    border-radius: 0.4vmin;
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
