<script lang="ts">
  import type { Board } from '$lib/types/game-state';

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
    font-size: 1.1rem;
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
