<script lang="ts">
  import type { Board, Stack } from '$lib/types/board-types';
  import { CARD_CATALOG } from '$lib/data/card-defs';
  import { CARD_W, CARD_H, CARD_GAP } from '$lib/data/constants';
  import type { SvelteMap } from 'svelte/reactivity';

  export type AttackPair = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isEnemy: boolean;
    lastAttackAtReal: number;
    lastAttackAtVtime: number;
  };

  const GLOW_DURATION = 400; // ms

  let {
    board,
    attackPairs,
    routingMode,
    routingFrom,
    routingMouseBoard,
    pendingFilterConn,
    realNow,
    isDraggingFoundation,
  }: {
    board: Board;
    attackPairs: SvelteMap<number, AttackPair>;
    routingMode: boolean;
    routingFrom: Stack | null;
    routingMouseBoard: { x: number; y: number } | null;
    pendingFilterConn: { fromId: number; toId: number } | null;
    realNow: number;
    isDraggingFoundation: boolean;
  } = $props();

  function stackCenter(stack: Stack) {
    return { x: stack.pos.x + CARD_W / 2, y: stack.pos.y + CARD_H / 2 };
  }

  function connectionEndpoints(from: Stack, to: Stack) {
    const f = stackCenter(from);
    const t = stackCenter(to);
    return { x1: f.x, y1: f.y, x2: t.x, y2: t.y };
  }
</script>

<svg
  class="connections-overlay"
  viewBox="0 0 {board.width} {board.height}"
  style="width:{board.width}vmin;height:{board.height}vmin;"
>
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L0,6 L6,3 z" fill="#00000080" />
    </marker>
    <filter id="attack-glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="1.5" />
    </filter>
  </defs>
  {#each board.connections as conn (conn.fromId + '-' + conn.toId)}
    {@const fromStack = board.stacks.find((s) => s.id === conn.fromId)}
    {@const toStack = board.stacks.find((s) => s.id === conn.toId)}
    {#if fromStack && toStack}
      {@const ep = connectionEndpoints(fromStack, toStack)}
      {@const isPending =
        pendingFilterConn?.fromId === conn.fromId && pendingFilterConn?.toId === conn.toId}
      <line
        x1={ep.x1}
        y1={ep.y1}
        x2={ep.x2}
        y2={ep.y2}
        stroke={isPending ? '#ff9900cc' : '#00000080'}
        stroke-width={isPending ? 0.8 : 0.5}
        opacity="0.9"
        marker-end="url(#arrowhead)"
      />
      {#if conn.filter || routingMode}
        {@const mx = (ep.x1 + ep.x2) / 2}
        {@const my = (ep.y1 + ep.y2) / 2}
        {@const label = conn.filter
          ? (CARD_CATALOG[conn.filter]?.title ?? conn.filter)
          : 'any'}
        {@const chipW = Math.max(4, label.length * 1.05 + 1.5)}
        <rect
          x={mx - chipW / 2}
          y={my - 1.6}
          width={chipW}
          height="3.2"
          rx="0.6"
          fill={isPending ? '#ff9900cc' : '#00000099'}
        />
        <text
          x={mx}
          y={my + 0.65}
          text-anchor="middle"
          font-size="1.8"
          fill="white"
          font-family="sans-serif">{label}</text
        >
      {/if}
    {/if}
  {/each}
  {#if routingFrom && routingMouseBoard}
    {@const f = stackCenter(routingFrom)}
    <line
      x1={f.x}
      y1={f.y}
      x2={routingMouseBoard.x}
      y2={routingMouseBoard.y}
      stroke="#00000080"
      stroke-width="0.4"
      stroke-dasharray="2 2"
      opacity="0.6"
    />
  {/if}
  {#each attackPairs.entries() as [id, pair] (id)}
    {@const glowT = Math.max(0, 1 - (realNow - pair.lastAttackAtReal) / GLOW_DURATION)}
    {#if glowT > 0}
      <line
        x1={pair.x1}
        y1={pair.y1}
        x2={pair.x2}
        y2={pair.y2}
        stroke={pair.isEnemy ? '#ff6666' : '#ffdd44'}
        stroke-width={3 + glowT * 3}
        opacity={glowT * 0.55}
        filter="url(#attack-glow)"
      />
    {/if}
    <line
      x1={pair.x1}
      y1={pair.y1}
      x2={pair.x2}
      y2={pair.y2}
      stroke={pair.isEnemy ? '#ff4444' : '#ffaa00'}
      stroke-width={0.5 + glowT * 0.8}
      stroke-dasharray="1.5 1.5"
      opacity={0.75 + glowT * 0.25}
      class="attack-beam"
    />
  {/each}
</svg>

{#if isDraggingFoundation}
  {@const gx = CARD_W + CARD_GAP}
  {@const gy = CARD_H + CARD_GAP}
  <svg
    class="foundation-grid"
    viewBox="0 0 {board.width} {board.height}"
    style="width:{board.width}vmin;height:{board.height}vmin;"
  >
    {#each Array.from({ length: Math.ceil(board.width / gx) - 1 }, (_, i) => (i + 1) * gx) as x (x)}
      <line
        x1={x + CARD_GAP / 2}
        y1="0"
        x2={x + CARD_GAP / 2}
        y2={board.height}
        stroke="white"
        stroke-width="0.3"
        stroke-dasharray="1 1"
        opacity="0.25"
      />
    {/each}
    {#each Array.from({ length: Math.ceil(board.height / gy) - 1 }, (_, i) => (i + 1) * gy) as y (y)}
      <line
        x1="0"
        y1={y + CARD_GAP / 2}
        x2={board.width}
        y2={y + CARD_GAP / 2}
        stroke="white"
        stroke-width="0.3"
        stroke-dasharray="1 1"
        opacity="0.25"
      />
    {/each}
  </svg>
{/if}

<style>
  .foundation-grid {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }

  .connections-overlay {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    pointer-events: none;
    z-index: 4;
  }

  .attack-beam {
    animation: attack-march 0.25s linear infinite;
  }

  @keyframes attack-march {
    to {
      stroke-dashoffset: -3;
    }
  }
</style>
