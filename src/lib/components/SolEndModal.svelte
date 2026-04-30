<script lang="ts">
  import type { Clock } from '$lib/types/game-state';
  import { CARD_CATALOG } from '$lib/data/card-defs';

  let { clock, oncontinue }: { clock: Clock; oncontinue: () => void } = $props();
</script>

{#if clock.endOfSol}
  <div class="sol-overlay">
    <div class="sol-dialog">
      <div class="sol-title">Sol {clock.sol} complete</div>
      {#each clock.lastSolFeeds.filter((f) => f.deaths.length > 0 || f.provided < f.needed) as feed (feed.boardName)}
        <div class="sol-board-section">
          <div class="sol-board-name">{feed.boardName}: {feed.provided}/{feed.needed} ⚡</div>
          {#each feed.deaths as { type, count } (type)}
            <span class="sol-death-entry">💀 {count}× {CARD_CATALOG[type].title} died</span>
          {/each}
        </div>
      {/each}
      <button class="sol-continue" onclick={oncontinue}>Continue to Sol {clock.sol + 1}</button>
    </div>
  </div>
{/if}

<style>
  .sol-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .sol-dialog {
    background: var(--chrome-bg);
    border: 2px solid var(--accent);
    border-radius: 1rem;
    padding: 2rem 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;

    .sol-title {
      font-size: 2.5rem;
      color: var(--accent);
      letter-spacing: 0.05em;
    }

    .sol-board-section {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 1.1rem;

      .sol-board-name {
        color: #aaa;
        font-size: 1rem;
      }

      .sol-death-entry {
        color: #ff6b6b;
        padding-left: 0.5rem;
      }
    }

    .sol-continue {
      margin-top: 0.5rem;
      padding: 0.5rem 2rem;
      background: var(--btn-active-bg);
      border: none;
      border-radius: 0.5rem;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.5rem;
      color: var(--btn-active-text);
      cursor: pointer;

      &:hover {
        background: var(--accent-hover);
      }
    }
  }
</style>
