<script lang="ts">
  import type { Board } from '$lib/types/game-state';

  let {
    boards,
    currentBoardIndex = $bindable(),
  }: {
    boards: Board[];
    currentBoardIndex: number;
  } = $props();
</script>

<nav class="location-nav">
  {#each boards as board, i (board.name)}
    {#if board.discovered}
      <button
        class="location-btn"
        class:active={i === currentBoardIndex}
        onclick={() => (currentBoardIndex = i)}>{board.name}</button
      >
    {/if}
  {/each}
</nav>

<style>
  .location-nav {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 0.25rem;
    padding: 0.4rem 1rem;
    background: rgba(0, 0, 0, 0.4);
    z-index: 5;
    pointer-events: all;

    .location-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.4rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.1rem;
      padding: 0.2rem 0.75rem;
      cursor: pointer;
      opacity: 0.7;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        opacity: 1;
      }

      &.active {
        background: color-mix(in srgb, var(--accent) 20%, transparent);
        border-color: var(--accent);
        color: var(--accent);
        opacity: 1;
      }
    }
  }
</style>
