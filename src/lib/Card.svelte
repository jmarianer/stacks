<script lang="ts">
  import Draggable, { type DragProps } from './Draggable.svelte';
  import { CARD_W, CARD_H } from '$lib/constants';

  let { value, color, top, left, onDrag, onDragStart, onDragEnd } = $props<{
    value: number;
    color: string;
    top: number;
    left: number;
  } & DragProps>();
</script>

<Draggable
  class="card"
  style="
    top: {top}vmin;
    left: {left}vmin;
    width: {CARD_W}vmin;
    height: {CARD_H}vmin;
    background-color: {color};
  "
  {onDrag}
  {onDragStart}
  {onDragEnd}
>
  <div class="circle">{value}</div>
</Draggable>

<style>
  :global .card {
    border-radius: 1vmin;
    position: absolute;
    border: 0.5vmin solid #000;
  }

  .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 14vmin;
    height: 14vmin;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: 'BigNoodleTitling';
    font-size: 4vmin;
  }
</style>
