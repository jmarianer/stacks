<script lang="ts">
  import { CARD_CATALOG } from '$lib/data/card-defs';
  import { type UnitStats, hpMaxFromStats } from '$lib/types/card-types';
  import type { CardData } from '$lib/types/game-state';
  import { maxBandAids, maxUniKits } from '$lib/utils/unit-stats';

  const ATTRS: { key: keyof UnitStats; label: string; effect: string }[] = [
    { key: 'endurance', label: 'Endurance', effect: '+10 HP / level' },
    { key: 'strength', label: 'Strength', effect: 'Damage & knockdown' },
    { key: 'perception', label: 'Perception', effect: 'Accuracy & range' },
    { key: 'intelligence', label: 'Intelligence', effect: 'Crafting speed' },
    { key: 'agility', label: 'Agility', effect: 'Rate of fire' },
    { key: 'luck', label: 'Luck', effect: 'Critical hits' },
  ];

  let {
    card,
    stats,
    x,
    y,
    onClose,
  }: {
    card: CardData;
    stats: UnitStats;
    x: number;
    y: number;
    onClose: () => void;
  } = $props();
</script>

<button class="stat-backdrop" onclick={onClose} aria-label="Close"></button>
<div
  class="stat-panel"
  style="left: {Math.min(x, window.innerWidth - 220)}px; top: {Math.min(
    y,
    window.innerHeight - 320,
  )}px;"
>
  <div class="stat-header">
    <span class="stat-name">{CARD_CATALOG[card.type].title}</span>
  </div>
  <div class="stat-hp-row">
    <span class="stat-hp-label">HP</span>
    <div class="stat-hp-bar">
      <div
        class="stat-hp-fill"
        style="width: {(stats.health / hpMaxFromStats(stats)) * 100}%"
      ></div>
    </div>
    <span class="stat-hp-nums">{stats.health}/{hpMaxFromStats(stats)}</span>
  </div>
  {#each ATTRS as attr (attr.key)}
    <div class="stat-row">
      <span class="stat-abbr">{attr.key.toUpperCase()}</span>
      <span class="stat-full">{attr.label}</span>
      <span class="stat-val">{stats[attr.key]}</span>
      <span class="stat-effect">{attr.effect}</span>
    </div>
  {/each}
  {#if card.weaponInventory && card.weaponInventory.length > 0}
    <div class="inv-section">
      <span class="inv-label">Weapons</span>
      {#each card.weaponInventory as wType, i (i)}
        <span class="inv-item" class:inv-active={i === card.weaponInventory.length - 1}>
          {CARD_CATALOG[wType].title}
        </span>
      {/each}
    </div>
  {/if}
  <div class="inv-section">
    <span class="inv-label">Band-aids</span>
    <span class="inv-item">{card.bandAids ?? 0} / {maxBandAids(stats)}</span>
  </div>
  <div class="inv-section">
    <span class="inv-label">Uni-kits</span>
    <span class="inv-item">{card.uniKits ?? 0} / {maxUniKits(stats)}</span>
  </div>
</div>

<style>
  .stat-backdrop {
    position: fixed;
    inset: 0;
    z-index: 19;
    background: none;
    border: none;
    padding: 0;
    cursor: default;
  }

  .stat-panel {
    position: fixed;
    z-index: 20;
    background: rgba(10, 10, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding-bottom: 0.4rem;

      .stat-name {
        font-size: 1.3rem;
        color: #f4c430;
      }
    }

    .stat-hp-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.3rem;

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

    .inv-section {
      display: flex;
      gap: 0.4rem;
      align-items: baseline;
      font-size: 0.9rem;
      padding-top: 0.2rem;

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
  }
</style>
