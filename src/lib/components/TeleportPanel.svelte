<script lang="ts">
  import type { Board } from '$lib/types/board-types';

  let {
    boards,
    currentBoardIndex,
    onTeleport,
  }: {
    boards: Board[];
    currentBoardIndex: number;
    onTeleport: (boardIndex: number) => void;
  } = $props();
</script>

<div class="teleport-panel">
  <div class="teleport-title">Teleport To…</div>
  {#each boards as board, i (board.name)}
    {#if i !== currentBoardIndex && board.discovered}
      <button class="teleport-dest" onclick={() => onTeleport(i)}>
        {board.name}
      </button>
    {/if}
  {/each}
</div>

<style>
  .teleport-panel {
    position: absolute;
    top: 3.5rem;
    right: 6rem;
    background: rgba(10, 10, 20, 0.92);
    border: 1px solid rgba(0, 188, 212, 0.4);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    font-size: 1.1rem;
    min-width: 12rem;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .teleport-title {
      font-size: 1.3rem;
      color: #00bcd4;
      margin-bottom: 0.25rem;
      letter-spacing: 0.05em;
    }

    .teleport-dest {
      background: rgba(0, 188, 212, 0.1);
      border: 1px solid rgba(0, 188, 212, 0.3);
      border-radius: 0.4rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.1rem;
      padding: 0.3rem 0.75rem;
      text-align: left;
      cursor: pointer;

      &:hover {
        background: rgba(0, 188, 212, 0.25);
        border-color: #00bcd4;
      }
    }
  }
</style>
