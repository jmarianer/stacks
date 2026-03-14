<script lang="ts">
  import Draggable from './Draggable.svelte';

  let { value, color, top, left, onDrag } = $props<{
    value: number;
    color: string;
    top: number;
    left: number;
    onDrag: (dx: number, dy: number) => void;
  }>();
</script>

<Draggable
  class="card"
  style="background-color: {color}; top: {top}vmin; left: {left}vmin"
  {onDrag}
>
  <div class="circle">{value}</div>
</Draggable>

<style>
  :global .card {
    width: 20vmin;
    height: 28vmin;
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
