<script lang="ts">
  import Draggable, { type DragProps } from './Draggable.svelte';
  import { CARD_W, CARD_H } from '$lib/data/constants';
  import { CARD_CATALOG } from '$lib/data/card-defs';
  import type { CardData } from '$lib/types/board-types';
  import { hpMaxFromStats } from '$lib/types/card-types';
  import { getUnitWeapon } from '$lib/utils/unit-stats';

  let {
    cardData,
    top,
    left,
    isDropTarget = false,
    inCombat = false,
    vTime = 0,
    onDrag,
    onDragStart,
    onDragEnd,
    onContextMenu,
  }: {
    cardData: CardData;
    top: number;
    left: number;
    isDropTarget?: boolean;
    inCombat?: boolean;
    vTime?: number;
    onContextMenu?: (e: MouseEvent) => void;
  } & DragProps = $props();

  const def = $derived(CARD_CATALOG[cardData.type]);

  function fitTitle(node: HTMLElement) {
    node.style.fontSize = '3vmin';
    if (node.scrollWidth > node.clientWidth) {
      node.style.fontSize = `${3 * (node.clientWidth / node.scrollWidth)}vmin`;
    }
  }

  const showCombat = $derived(inCombat && !!cardData.unitStats);

  const hpPct = $derived.by(() => {
    const stats = cardData.unitStats;
    if (!stats) return 0;
    return Math.max(0, Math.min(1, stats.health / hpMaxFromStats(stats)));
  });

  const hpColor = $derived(hpPct > 0.6 ? '#4CAF50' : hpPct > 0.3 ? '#FFC107' : '#F44336');

  const cdPct = $derived.by(() => {
    const stats = cardData.unitStats;
    if (!stats || stats.lastAttackAt === undefined) return null;
    const weapon = def.enemy ? def.enemy.weapon : getUnitWeapon(cardData);
    if (!weapon) return null;
    return Math.min(1, (vTime - stats.lastAttackAt) / (weapon.attackInterval * 1000));
  });
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
  oncontextmenu={(e) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e);
    }
  }}
>
  <div class="card-inner">
    <div class="title" use:fitTitle>
      {cardData.label ?? def.title}
    </div>
    <div class="image">
      <img class="card-image" src="/cards/{def.image}" alt={def.title} draggable="false" />
    </div>
    {#if showCombat}
      <div class="combat-overlay">
        <div class="hp-bar">
          <div class="hp-fill" style="width: {hpPct * 100}%; background-color: {hpColor};"></div>
        </div>
        <div class="cd-bar">
          {#if cdPct !== null}
            <div class="cd-fill" style="width: {cdPct * 100}%;"></div>
          {/if}
        </div>
      </div>
    {/if}
    <div class="footer">
      {#if 'value' in def}
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
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .combat-overlay {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 4vmin;
    height: 4vmin;
    display: flex;
    flex-direction: column;
    gap: 0.3vmin;
    padding: 0.4vmin;
    pointer-events: none;
  }

  .hp-bar,
  .cd-bar {
    flex: 1;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 0.3vmin;
    overflow: hidden;
  }

  .hp-fill,
  .cd-fill {
    height: 100%;
  }

  .cd-fill {
    background: rgba(255, 255, 255, 0.75);
  }

  .title {
    height: 4vmin;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'BigNoodleTitling';
    color: white;
    border-bottom: 0.5vmin solid #000;
    padding: 0 1vmin;
    white-space: nowrap;
    overflow: hidden;
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

  .image {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-image {
    width: 14vmin;
    height: 14vmin;
    object-fit: contain;
  }
</style>
