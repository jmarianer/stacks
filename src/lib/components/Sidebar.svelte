<script lang="ts">
  import type { Board, CardData } from '$lib/types/board-types';
  import { CARD_CATALOG } from '$lib/data/card-defs';
  import { hpMaxFromStats, type UnitStats } from '$lib/types/card-types';
  import { maxBandAids, maxUniKits } from '$lib/utils/unit-stats';
  import TeleportPanel from './TeleportPanel.svelte';
  import RecipesPanel from './RecipesPanel.svelte';

  const ATTRS: { key: keyof UnitStats; label: string; effect: string }[] = [
    { key: 'endurance', label: 'Endurance', effect: '+10 HP / level' },
    { key: 'strength', label: 'Strength', effect: 'Damage & knockdown' },
    { key: 'perception', label: 'Perception', effect: 'Accuracy & range' },
    { key: 'intelligence', label: 'Intelligence', effect: 'Crafting speed' },
    { key: 'agility', label: 'Agility', effect: 'Rate of fire' },
    { key: 'luck', label: 'Luck', effect: 'Critical hits' },
  ];

  let {
    boards,
    currentBoardIndex,
    knownRecipeIds,
    selectedCard,
    onTeleport,
    onExport,
    onImport,
  }: {
    boards: Board[];
    currentBoardIndex: number;
    knownRecipeIds: string[];
    selectedCard: CardData | null;
    onTeleport: (i: number) => void;
    onExport: () => void;
    onImport: (e: Event) => void;
  } = $props();

  const hasOtherBoards = $derived(boards.some((b, i) => i !== currentBoardIndex && b.discovered));

  type Tab = 'progression' | 'recipes' | 'boards';
  let activeTab = $state<Tab>('recipes');

  $effect(() => {
    if (activeTab === 'boards' && !hasOtherBoards) activeTab = 'progression';
  });
</script>

<div class="sidebar">
  <div class="top-panel">
    <div class="tabs">
      <!-- <button class="tab" class:active={activeTab === 'progression'} onclick={() => (activeTab = 'progression')}>Progress</button> -->
      {#if hasOtherBoards}
        <button
          class="tab"
          class:active={activeTab === 'recipes'}
          onclick={() => (activeTab = 'recipes')}>Recipes</button
        >
        <button
          class="tab"
          class:active={activeTab === 'boards'}
          onclick={() => (activeTab = 'boards')}>Boards</button
        >
      {/if}
    </div>
    <div class="tab-content">
      {#if activeTab === 'progression'}
        <div class="placeholder">Progression coming soon…</div>
      {:else if activeTab === 'recipes'}
        <RecipesPanel {knownRecipeIds} />
      {:else if activeTab === 'boards'}
        <TeleportPanel {boards} {currentBoardIndex} {onTeleport} />
      {/if}
    </div>
  </div>
  <div class="save-bar">
    <button class="save-btn" onclick={onExport}>Export</button>
    <label class="save-btn">
      Import
      <input type="file" accept=".json" onchange={onImport} style="display:none" />
    </label>
  </div>
  {#if selectedCard?.unitStats}
    {@const stats = selectedCard.unitStats}
    <div class="bottom-panel">
      <div class="stat-header">{CARD_CATALOG[selectedCard.type].title}</div>
      <div class="stat-hp-row">
        <span class="stat-hp-label">HP</span>
        <div class="stat-hp-bar">
          <div
            class="stat-hp-fill"
            style="width: {(stats.health / hpMaxFromStats(stats)) * 100}%"
          ></div>
        </div>
        <span class="stat-hp-nums">{Math.ceil(stats.health)}/{hpMaxFromStats(stats)}</span>
      </div>
      {#each ATTRS as attr (attr.key)}
        <div class="stat-row">
          <span class="stat-abbr">{attr.key.slice(0, 3).toUpperCase()}</span>
          <span class="stat-full">{attr.label}</span>
          <span class="stat-val">{stats[attr.key]}</span>
          <span class="stat-effect">{attr.effect}</span>
        </div>
      {/each}
      {#if selectedCard.weaponInventory && selectedCard.weaponInventory.length > 0}
        <div class="inv-section">
          <span class="inv-label">Weapons</span>
          {#each selectedCard.weaponInventory as wType, i (i)}
            <span class="inv-item" class:inv-active={i === selectedCard.weaponInventory.length - 1}>
              {CARD_CATALOG[wType].title}
            </span>
          {/each}
        </div>
      {/if}
      <div class="inv-section">
        <span class="inv-label">Band-aids</span>
        <span class="inv-item">{selectedCard.bandAids ?? 0} / {maxBandAids(stats)}</span>
      </div>
      <div class="inv-section">
        <span class="inv-label">Uni-kits</span>
        <span class="inv-item">{selectedCard.uniKits ?? 0} / {maxUniKits(stats)}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .sidebar {
    grid-row: 1 / 3;
    grid-column: 2;
    background: rgba(10, 10, 20, 0.92);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    display: flex;
    flex-direction: column;
    z-index: 5;
  }

  .top-panel {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  .tab {
    flex: 1;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: rgba(255, 255, 255, 0.5);
    font-family: 'BigNoodleTitling', sans-serif;
    font-size: 1rem;
    padding: 0.5rem;
    cursor: pointer;

    &:hover {
      color: white;
    }

    &.active {
      color: #f4c430;
      border-bottom-color: #f4c430;
    }
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem;
  }

  .placeholder {
    opacity: 0.4;
    font-size: 1rem;
    padding: 1rem 0;
  }

  .save-bar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
  }

  .save-btn {
    flex: 1;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.35rem;
    color: rgba(255, 255, 255, 0.7);
    font-family: 'BigNoodleTitling', sans-serif;
    font-size: 0.9rem;
    padding: 0.3rem 0;
    cursor: pointer;
    text-align: center;

    &:hover {
      background: rgba(255, 255, 255, 0.13);
      color: white;
    }
  }

  .bottom-panel {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .stat-header {
    font-size: 1.2rem;
    color: #f4c430;
    margin-bottom: 0.2rem;
  }

  .stat-hp-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.15rem;

    .stat-hp-label {
      font-size: 0.9rem;
      opacity: 0.7;
      width: 1.5rem;
    }
    .stat-hp-bar {
      flex: 1;
      height: 0.5rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 0.25rem;
      overflow: hidden;

      .stat-hp-fill {
        height: 100%;
        background: #4caf50;
        border-radius: 0.25rem;
      }
    }
    .stat-hp-nums {
      font-size: 0.85rem;
      opacity: 0.7;
      white-space: nowrap;
    }
  }

  .stat-row {
    display: grid;
    grid-template-columns: 2rem 6rem 1.5rem 1fr;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.9rem;

    .stat-abbr {
      color: #80cbc4;
      font-size: 0.85rem;
    }
    .stat-full {
      opacity: 0.75;
    }
    .stat-val {
      text-align: right;
      color: #f4c430;
    }
    .stat-effect {
      opacity: 0.45;
      font-size: 0.8rem;
    }
  }

  .inv-section {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    padding-top: 0.15rem;

    .inv-label {
      opacity: 0.6;
      width: 5.5rem;
      flex-shrink: 0;
    }
    .inv-item {
      color: #f4c430;
      opacity: 0.7;
    }
    .inv-active {
      opacity: 1;
    }
  }
</style>
