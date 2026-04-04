<script lang="ts">
  import type { Board, Stack, Connection } from '$lib/types/board-types';
  import { CARD_CATALOG, type CardType } from '$lib/data/card-defs';
  import { CARD_W, CARD_H } from '$lib/data/constants';

  let {
    board,
    routingFrom = $bindable(),
    routingMouseBoard = $bindable(),
    pendingFilterConn = $bindable(),
    boardPosFromEvent,
  }: {
    board: Board;
    routingFrom: Stack | null;
    routingMouseBoard: { x: number; y: number } | null;
    pendingFilterConn: { fromId: number; toId: number } | null;
    boardPosFromEvent: (e: MouseEvent) => { x: number; y: number };
  } = $props();

  let filterInput = $state('');

  function stackCenter(stack: Stack) {
    return { x: stack.pos.x + CARD_W / 2, y: stack.pos.y + CARD_H / 2 };
  }

  function connMidpoint(conn: { fromId: number; toId: number }) {
    const from = board.stacks.find((s) => s.id === conn.fromId);
    const to = board.stacks.find((s) => s.id === conn.toId);
    if (!from || !to) return null;
    const f = stackCenter(from);
    const t = stackCenter(to);
    return { x: (f.x + t.x) / 2, y: (f.y + t.y) / 2 };
  }

  function connAtPos(pos: { x: number; y: number }): Connection | undefined {
    return board.connections.find((conn) => {
      const mid = connMidpoint(conn);
      return mid !== null && Math.hypot(mid.x - pos.x, mid.y - pos.y) < 3;
    });
  }

  function foundationStackAt(pos: { x: number; y: number }): Stack | undefined {
    return board.stacks.findLast(
      (s) =>
        s.cards[0]?.type === 'foundation' &&
        pos.x >= s.pos.x &&
        pos.x <= s.pos.x + CARD_W &&
        pos.y >= s.pos.y &&
        pos.y <= s.pos.y + CARD_H,
    );
  }

  function confirmFilter() {
    if (!pendingFilterConn) return;
    const { fromId, toId } = pendingFilterConn;
    const filter = filterInput in CARD_CATALOG ? (filterInput as CardType) : undefined;
    board.connections = board.connections.map((c) =>
      c.fromId === fromId && c.toId === toId ? { ...c, filter } : c,
    );
    pendingFilterConn = null;
    filterInput = '';
  }

  function handleFilterKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') confirmFilter();
    if (e.key === 'Escape') {
      pendingFilterConn = null;
      filterInput = '';
    }
    e.stopPropagation(); // prevent 'r' from toggling routing mode
  }

  function focusOnMount(node: HTMLElement) {
    node.focus();
  }

  function handleRoutingMouseDown(e: MouseEvent) {
    if (pendingFilterConn) {
      confirmFilter();
      return;
    }
    const pos = boardPosFromEvent(e);
    const conn = connAtPos(pos);
    if (conn) {
      e.stopPropagation();
      pendingFilterConn = { fromId: conn.fromId, toId: conn.toId };
      filterInput = conn.filter ?? '';
      return;
    }
    const stack = foundationStackAt(pos);
    if (!stack) {
      routingFrom = null;
      return;
    }
    e.stopPropagation();
    routingFrom = stack;
    routingMouseBoard = stackCenter(stack);
  }

  function handleRoutingMouseMove(e: MouseEvent) {
    if (!routingFrom) return;
    routingMouseBoard = boardPosFromEvent(e);
  }

  function handleRoutingMouseUp(e: MouseEvent) {
    if (!routingFrom) return;
    const pos = boardPosFromEvent(e);
    const target = foundationStackAt(pos);
    if (target && target.id !== routingFrom.id) {
      const already = board.connections.some(
        (c) => c.fromId === routingFrom!.id && c.toId === target.id,
      );
      if (!already) {
        const newConn: Connection = { fromId: routingFrom.id, toId: target.id };
        board.connections = [...board.connections, newConn];
        pendingFilterConn = { fromId: newConn.fromId, toId: newConn.toId };
        filterInput = '';
      }
    }
    routingFrom = null;
    routingMouseBoard = null;
  }

  function handleRoutingContextMenu(e: MouseEvent) {
    e.preventDefault();
    const pos = boardPosFromEvent(e);
    const conn = connAtPos(pos);
    if (conn) {
      if (pendingFilterConn?.fromId === conn.fromId && pendingFilterConn?.toId === conn.toId) {
        pendingFilterConn = null;
      }
      board.connections = board.connections.filter((c) => c !== conn);
    }
  }
</script>

<div
  class="routing-overlay"
  onmousedown={handleRoutingMouseDown}
  onmousemove={handleRoutingMouseMove}
  onmouseup={handleRoutingMouseUp}
  oncontextmenu={handleRoutingContextMenu}
  role="presentation"
></div>
{#if pendingFilterConn}
  {@const mid = connMidpoint(pendingFilterConn)}
  {#if mid}
    <div class="filter-input-popup" style="left:{mid.x}vmin; top:{mid.y}vmin;">
      <input
        type="text"
        list="card-type-list"
        bind:value={filterInput}
        placeholder="any type"
        onkeydown={handleFilterKeyDown}
        use:focusOnMount
      />
      <datalist id="card-type-list">
        {#each Object.keys(CARD_CATALOG) as type (type)}
          <option value={type}>{CARD_CATALOG[type].title}</option>
        {/each}
      </datalist>
    </div>
  {/if}
{/if}

<style>
  .routing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    cursor: crosshair;
    z-index: 5;
  }

  .filter-input-popup {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 10;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 0.5vmin;
    padding: 0.5vmin 0.75vmin;
    display: flex;
    flex-direction: column;
    gap: 0.3vmin;
  }

  .filter-input-popup input {
    font-size: 1.4vmin;
    padding: 0.3vmin 0.5vmin;
    border: none;
    border-radius: 0.3vmin;
    outline: none;
    width: 14vmin;
    background: #fff;
    color: #000;
  }
</style>
