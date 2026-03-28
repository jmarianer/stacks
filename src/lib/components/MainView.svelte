<script lang="ts">
  // import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import { untrack, onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import Card from '$lib/components/Card.svelte';
  import {
    STACK_CARD_OFFSET_Y,
    STACK_CARD_OFFSET_X,
    CARD_W,
    CARD_H,
    DROP_TARGET_INSET,
    CARD_GAP,
  } from '$lib/data/constants';
  import Draggable from './Draggable.svelte';
  import { addScaled } from '$lib/utils/vec2';
  import type { Stack, Board, ShopItem, CardData, Clock } from '$lib/types/board-types';
  import Hud from './Hud.svelte';
  import Sidebar from './Sidebar.svelte';
  import LocationNav from './LocationNav.svelte';
  import type { CardDef } from '$lib/types/card-types';
  import { CARD_CATALOG } from '$lib/data/card-defs';
  import { getUnitWeapon } from '$lib/utils/unit-stats';
  import { initialBoards } from '$lib/data/initial-boards';
  import {
    makeClock,
    makeStackFromCards,
    addCardToMatchingStack,
    makeTeleportCard,
    setNextId,
  } from '$lib/utils/card-factories';
  import { tick as tickPhysics } from '$lib/behavior/physics';
  import { tick as tickProgress } from '$lib/behavior/progress';
  import { runCombat, getCombatUnits, nearestCombatant } from '$lib/behavior/combat';
  import { tickClock, getSolProgress, setSpeed, getVirtualNow } from '$lib/behavior/clock';
  import { recipes } from '$lib/data/recipes';

  let selectedCard = $state<CardData | null>(null);
  let routingMode = $state(false);
  let routingFrom = $state<Stack | null>(null);
  let routingMouseBoard = $state<{ x: number; y: number } | null>(null);
  type AttackPair = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isEnemy: boolean;
    lastAttackAtReal: number;
    lastAttackAtVtime: number;
  };
  const attackPairs = new SvelteMap<number, AttackPair>();

  let scale = $state(1);
  let translate = $state({ x: 0, y: 0 });
  let vmin = $state(0);
  let boardAreaEl = $state<HTMLElement | null>(null);

  function updateVmin() {
    vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  }

  $effect(() => {
    const el = boardAreaEl;
    const idx = gameState.currentBoardIndex;
    untrack(() => {
      if (!el) return;
      updateVmin();
      const availW = el.clientWidth;
      const availH = el.clientHeight;
      const boardW = gameState.boards[idx].width * vmin;
      const boardH = gameState.boards[idx].height * vmin;
      scale = Math.min(availW / boardW, availH / boardH) * 0.95;
      translate.x = (availW - boardW * scale) / 2;
      translate.y = (availH - boardH * scale) / 2;
    });
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = boardAreaEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    scale = scale * zoomFactor;
    console.log(scale);
    translate.x = localX - (localX - translate.x) * zoomFactor;
    translate.y = localY - (localY - translate.y) * zoomFactor;
  }

  function boardMouse() {
    const rect = boardAreaEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      x: (mousePosition.x - rect.left - translate.x) / (vmin * scale),
      y: (mousePosition.y - rect.top - translate.y) / (vmin * scale),
    };
  }

  function boardPosFromEvent(e: MouseEvent) {
    const rect = boardAreaEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return {
      x: (e.clientX - rect.left - translate.x) / (vmin * scale),
      y: (e.clientY - rect.top - translate.y) / (vmin * scale),
    };
  }

  function foundationStackAt(pos: { x: number; y: number }): Stack | undefined {
    return currentBoard.stacks.findLast(
      (s) =>
        s.cards[0]?.type === 'foundation' &&
        pos.x >= s.pos.x &&
        pos.x <= s.pos.x + CARD_W &&
        pos.y >= s.pos.y &&
        pos.y <= s.pos.y + CARD_H,
    );
  }

  function stackCenter(stack: Stack) {
    return { x: stack.pos.x + CARD_W / 2, y: stack.pos.y + CARD_H / 2 };
  }

  const GLOW_DURATION = 400; // ms

  function updateAttackPairs(board: Board, now_ms: number) {
    const { playerUnits, enemyUnits } = getCombatUnits(board);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const activeIds = new Set<number>();

    if (playerUnits.length > 0 && enemyUnits.length > 0) {
      for (const unit of playerUnits) {
        if (unit.card.combatHomeStackId === undefined) continue;
        const weapon = getUnitWeapon(unit.card);
        if (!weapon) continue;
        const target = nearestCombatant(unit.stack.pos, enemyUnits, weapon.range);
        if (!target) continue;
        const lastAttackAtVtime = unit.card.unitStats?.lastAttackAt ?? -Infinity;
        const existing = attackPairs.get(unit.stack.id);
        const lastAttackAtReal =
          lastAttackAtVtime !== existing?.lastAttackAtVtime
            ? now_ms
            : (existing?.lastAttackAtReal ?? -Infinity);
        attackPairs.set(unit.stack.id, {
          ...connectionEndpoints(unit.stack, target.stack),
          isEnemy: false,
          lastAttackAtReal,
          lastAttackAtVtime,
        });
        activeIds.add(unit.stack.id);
      }

      for (const unit of enemyUnits) {
        const weapon = (CARD_CATALOG[unit.card.type] as CardDef).enemy?.weapon;
        if (!weapon) continue;
        const target = nearestCombatant(unit.stack.pos, playerUnits, weapon.range);
        if (!target) continue;
        const lastAttackAtVtime = unit.card.unitStats?.lastAttackAt ?? -Infinity;
        const existing = attackPairs.get(unit.stack.id);
        const lastAttackAtReal =
          lastAttackAtVtime !== existing?.lastAttackAtVtime
            ? now_ms
            : (existing?.lastAttackAtReal ?? -Infinity);
        attackPairs.set(unit.stack.id, {
          ...connectionEndpoints(unit.stack, target.stack),
          isEnemy: true,
          lastAttackAtReal,
          lastAttackAtVtime,
        });
        activeIds.add(unit.stack.id);
      }
    }

    for (const id of attackPairs.keys()) {
      if (!activeIds.has(id)) attackPairs.delete(id);
    }
  }

  function connectionEndpoints(from: Stack, to: Stack) {
    const f = stackCenter(from);
    const t = stackCenter(to);
    return { x1: f.x, y1: f.y, x2: t.x, y2: t.y };
  }

  function handleRoutingMouseDown(e: MouseEvent) {
    const pos = boardPosFromEvent(e);
    const stack = foundationStackAt(pos);
    if (!stack) {
      routingFrom = null;
      return;
    }
    e.stopPropagation();
    const hasOutgoing = currentBoard.connections.some((c) => c.fromId === stack.id);
    if (hasOutgoing) {
      currentBoard.connections = currentBoard.connections.filter((c) => c.fromId !== stack.id);
      routingFrom = null;
    } else {
      routingFrom = stack;
      routingMouseBoard = stackCenter(stack);
    }
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
      const already = currentBoard.connections.some(
        (c) => c.fromId === routingFrom!.id && c.toId === target.id,
      );
      if (!already) {
        currentBoard.connections = [
          ...currentBoard.connections,
          { fromId: routingFrom.id, toId: target.id },
        ];
      }
    }
    routingFrom = null;
    routingMouseBoard = null;
  }

  function stackAtMouse(): Stack | undefined {
    const { x, y } = boardMouse();
    return currentBoard.stacks.findLast((stack) =>
      stack.cards.some((_, i) => {
        const cx = stack.pos.x + i * STACK_CARD_OFFSET_X + CARD_W / 2;
        const cy = stack.pos.y + i * STACK_CARD_OFFSET_Y + CARD_H / 2;
        return Math.abs(x - cx) <= CARD_W / 2 && Math.abs(y - cy) <= CARD_H / 2;
      }),
    );
  }

  function onKeyDown(e: KeyboardEvent) {
    const speed = 20;
    if (e.key === 'w') translate.y += speed;
    if (e.key === 's') translate.y -= speed;
    if (e.key === 'a') translate.x += speed;
    if (e.key === 'd') translate.x -= speed;
    if (e.key === ' ') {
      e.preventDefault();
      if (!gameState.clock.endOfSol) {
        setSpeed(
          gameState.clock,
          gameState.clock.speed === 0 ? gameState.clock.lastActiveSpeed : 0,
        );
      }
    }
    if (e.key === '1') setSpeed(gameState.clock, 1);
    if (e.key === '2') setSpeed(gameState.clock, 2);
    if (e.key === '3') setSpeed(gameState.clock, 3);
    if (e.key === '4' && !gameState.clock.endOfSol) setSpeed(gameState.clock, 0);
    if (e.key === 'r' || e.key === 'R') routingMode = !routingMode;
    if (e.key === 'Backspace') {
      const stack = stackAtMouse();
      if (!stack) return;
      const sellable = stack.cards.filter((c) => 'value' in CARD_CATALOG[c.type]);
      if (sellable.length === 0) return;
      currentBoard.currency += sellable.reduce(
        (sum, c) => sum + (CARD_CATALOG[c.type] as { value: number }).value,
        0,
      );
      stack.cards = stack.cards.filter((c) => !('value' in CARD_CATALOG[c.type]));
      if (stack.cards.length === 0) {
        currentBoard.stacks = currentBoard.stacks.filter((s) => s.id !== stack.id);
      }
    }
  }

  function continueSol() {
    const realNow = performance.now();
    gameState.clock.vTimeAt = realNow;
    gameState.clock.endOfSol = false;
    gameState.clock.endOfSolAt = null;
    gameState.clock.sol++;
    gameState.clock.solStartTime = gameState.clock.vTime;
  }

  let solProgress = $state(0);
  let vTime = $state(0);
  let realNow = $state(0);
  type GameState = { boards: Board[]; clock: Clock; currentBoardIndex: number };
  let gameState = $state<GameState>({
    boards: initialBoards,
    clock: makeClock(),
    currentBoardIndex: 0,
  });

  function applySave(save: GameState) {
    save.clock.vTimeAt = null;
    gameState = save;
    const maxId = Math.max(
      0,
      ...save.boards.flatMap((b) => [
        b.id,
        ...b.stacks.flatMap((s) => [s.id, ...s.cards.map((c) => c.id)]),
      ]),
    );
    setNextId(maxId + 1);
  }

  onMount(() => applySave(loadSave()));
  const currentBoard = $derived(gameState.boards[gameState.currentBoardIndex]);

  const energyAvailable = $derived(
    currentBoard.stacks
      .flatMap((s) => s.cards)
      .reduce((sum, c) => sum + (c.energyRemaining ?? 0), 0),
  );

  const energyNeeded = $derived(
    currentBoard.stacks
      .flatMap((s) => s.cards)
      .reduce((sum, c) => sum + (CARD_CATALOG[c.type].feed?.cost ?? 0), 0),
  );

  // Flat list of all cards with their stack and index, keyed by cardData.id.
  // Using a flat {#each} preserves Draggable component instances when cards
  // move between stacks (e.g. during peel), keeping isDragging state intact.
  const renderedCards = $derived(
    currentBoard.stacks.flatMap((stack) =>
      stack.cards.map((cardData, cardIndex) => ({ cardData, stack, cardIndex })),
    ),
  );

  const isDraggingFoundation = $derived(
    currentBoard.stacks.some((s) => s.dragging && s.cards[0]?.type === 'foundation'),
  );

  const inCombat = $derived(
    currentBoard.stacks.some((s) => s.cards.some((c) => CARD_CATALOG[c.type].enemy !== undefined)),
  );

  let mousePosition = { x: 0, y: 0 };

  function handleDragStart(stack: Stack, cardIndex: number, e: MouseEvent) {
    const stacks = currentBoard.stacks;
    if (e.altKey || cardIndex === 0) {
      // Drag the whole stack
      stack.dragging = true;
      currentBoard.stacks = [...stacks.filter((s) => s.id !== stack.id), stack];
    } else {
      // Peel this card and everything above it into a new stack
      const peeledCards = stack.cards.slice(cardIndex);
      stack.cards = stack.cards.slice(0, cardIndex);
      const newStack = makeStackFromCards(
        {
          x: stack.pos.x + cardIndex * STACK_CARD_OFFSET_X,
          y: stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y,
        },
        peeledCards,
      );
      newStack.dragging = true;
      currentBoard.stacks = [...stacks, newStack];
    }
  }

  function createTeleportCard(targetBoardIndex: number, onBoard: Board = currentBoard) {
    const card = makeTeleportCard(targetBoardIndex, gameState.boards[targetBoardIndex].name);
    const stack = makeStackFromCards({ x: onBoard.width / 2, y: onBoard.height / 2 }, [card]);
    onBoard.stacks = [...onBoard.stacks, stack];
  }

  function handleDragEnd() {
    const stacks = currentBoard.stacks;
    const dragging = stacks.find((s) => s.dragging);
    if (!dragging) return;

    // Grid-snap stacks based on a foundation card
    if (dragging.cards[0]?.type === 'foundation') {
      dragging.pos.x =
        Math.round(dragging.pos.x / (CARD_W + CARD_GAP)) * (CARD_W + CARD_GAP) + CARD_GAP;
      dragging.pos.y =
        Math.round(dragging.pos.y / (CARD_H + CARD_GAP)) * (CARD_H + CARD_GAP) + CARD_GAP;
    }

    const target = stacks.find((s) => s.isDropTarget);
    if (target) {
      const teleportCard = target.cards.find((c) => c.type === 'teleport');
      if (teleportCard?.targetBoardIndex !== undefined) {
        const destIdx = teleportCard.targetBoardIndex;
        const dest = gameState.boards[destIdx];
        const newStack = makeStackFromCards(
          { x: dest.width / 2, y: dest.height / 2 },
          dragging.cards,
        );
        dest.stacks = [...dest.stacks, newStack];
        currentBoard.stacks = stacks.filter((s) => s.id !== target.id && s.id !== dragging.id);
        gameState.currentBoardIndex = destIdx;
        return;
      }
      target.cards = [...target.cards, ...dragging.cards];
      target.isDropTarget = false;
      currentBoard.stacks = stacks.filter((s) => s.id !== dragging.id);
    } else {
      dragging.dragging = false;
    }
  }

  function updateDropTargets() {
    const stacks = currentBoard.stacks;
    const anyDragging = stacks.some((s) => s.dragging);
    if (!anyDragging) {
      for (const s of stacks) s.isDropTarget = false;
      return;
    }

    const { x: mx, y: my } = boardMouse();

    // Mark the first stack whose drop target rectangle contains the mouse
    let foundTarget = false;
    for (const stack of stacks) {
      if (stack.dragging) {
        stack.isDropTarget = false;
        continue;
      }
      if (foundTarget) {
        stack.isDropTarget = false;
        continue;
      }
      // Target rectangle: DROP_TARGET_INSET from each edge of the card
      stack.isDropTarget = stack.cards.some((_, i) => {
        const cx = stack.pos.x + i * STACK_CARD_OFFSET_X + CARD_W / 2;
        const cy = stack.pos.y + i * STACK_CARD_OFFSET_Y + CARD_H / 2;
        return (
          Math.abs(mx - cx) <= CARD_W / 2 - DROP_TARGET_INSET &&
          Math.abs(my - cy) <= CARD_H / 2 - DROP_TARGET_INSET
        );
      });
      if (stack.isDropTarget) foundTarget = true;
    }
  }

  function buyCard(item: ShopItem) {
    if (currentBoard.currency < item.price) return;
    currentBoard.currency -= item.price;
    const pos = { x: currentBoard.width / 2, y: currentBoard.height / 2 };
    addCardToMatchingStack(currentBoard.stacks, item.cardType, pos);
  }

  const SAVE_KEY = 'stacks-autosave';
  const SAVE_INTERVAL_MS = 5000;

  function loadSave(): GameState {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const save = JSON.parse(raw) as GameState;
        return save;
      }
    } catch {
      // fall through to defaults
    }
    return { boards: initialBoards, clock: makeClock(), currentBoardIndex: 0 };
  }

  function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
  }

  function exportSave() {
    const json = JSON.stringify(gameState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stacks-save.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSave(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applySave(JSON.parse(reader.result as string) as GameState);
      } catch {
        // silently ignore malformed import
      }
    };
    reader.readAsText(file);
  }

  $effect(() => {
    let rafId: number;
    let lastSaveAt = 0;

    function loop() {
      const now_ms = performance.now();
      updateDropTargets();
      tickClock(gameState.clock, gameState.boards, now_ms);
      const now = getVirtualNow(gameState.clock, now_ms);
      if (!gameState.clock.endOfSol && gameState.clock.speed !== 0) {
        for (const board of gameState.boards) {
          tickPhysics(board);
          runCombat(board, now);
          tickProgress(board, gameState.boards, gameState.clock, now);
        }
      }
      solProgress = getSolProgress(gameState.clock, now_ms);
      vTime = now;
      realNow = now_ms;
      updateAttackPairs(currentBoard, now_ms);
      if (now_ms - lastSaveAt > SAVE_INTERVAL_MS) {
        saveState();
        lastSaveAt = now_ms;
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  });
</script>

<div class="viewport">
  <Hud
    clock={gameState.clock}
    {solProgress}
    currency={currentBoard.currency}
    {energyAvailable}
    {energyNeeded}
    shop={currentBoard.shop}
    bind:routingMode
    onBuyCard={buyCard}
    onSetSpeed={setSpeed}
  />
  <div class="board-area" bind:this={boardAreaEl}>
    <Draggable
      onDrag={(dx, dy) => {
        translate.x += dx;
        translate.y += dy;
      }}
      class="board"
      style="
      width: {currentBoard.width}vmin;
      height: {currentBoard.height}vmin;
      transform: translate({translate.x}px, {translate.y}px) scale({scale});
    "
      onwheel={onWheel}
    >
      <svg
        class="connections-overlay"
        viewBox="0 0 {currentBoard.width} {currentBoard.height}"
        style="width:{currentBoard.width}vmin;height:{currentBoard.height}vmin;"
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#00000080" />
          </marker>
          <filter id="attack-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
        {#each currentBoard.connections as conn (conn.fromId + '-' + conn.toId)}
          {@const fromStack = currentBoard.stacks.find((s) => s.id === conn.fromId)}
          {@const toStack = currentBoard.stacks.find((s) => s.id === conn.toId)}
          {#if fromStack && toStack}
            {@const ep = connectionEndpoints(fromStack, toStack)}
            <line
              x1={ep.x1}
              y1={ep.y1}
              x2={ep.x2}
              y2={ep.y2}
              stroke="#00000080"
              stroke-width="0.5"
              opacity="0.8"
              marker-end="url(#arrowhead)"
            />
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
          viewBox="0 0 {currentBoard.width} {currentBoard.height}"
          style="width:{currentBoard.width}vmin;height:{currentBoard.height}vmin;"
        >
          {#each Array.from({ length: Math.ceil(currentBoard.width / gx) - 1 }, (_, i) => (i + 1) * gx) as x (x)}
            <line
              x1={x + CARD_GAP / 2}
              y1="0"
              x2={x + CARD_GAP / 2}
              y2={currentBoard.height}
              stroke="white"
              stroke-width="0.3"
              stroke-dasharray="1 1"
              opacity="0.25"
            />
          {/each}
          {#each Array.from({ length: Math.ceil(currentBoard.height / gy) - 1 }, (_, i) => (i + 1) * gy) as y (y)}
            <line
              x1="0"
              y1={y + CARD_GAP / 2}
              x2={currentBoard.width}
              y2={y + CARD_GAP / 2}
              stroke="white"
              stroke-width="0.3"
              stroke-dasharray="1 1"
              opacity="0.25"
            />
          {/each}
        </svg>
      {/if}

      {#each renderedCards as { cardData, stack, cardIndex } (cardData.id)}
        <Card
          {cardData}
          top={stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y}
          left={stack.pos.x + cardIndex * STACK_CARD_OFFSET_X}
          isDropTarget={stack.isDropTarget && cardIndex === stack.cards.length - 1}
          {inCombat}
          {vTime}
          onDragStart={(e) => handleDragStart(stack, cardIndex, e)}
          onDragEnd={handleDragEnd}
          onDrag={(dx, dy) => {
            addScaled(stack.pos, { x: dx, y: dy }, 1 / (vmin * scale));
          }}
          onContextMenu={() => {
            selectedCard = cardData;
          }}
        />
        {#if cardIndex === 0 && stack.activeRecipeId !== null}
          {@const recipeLabel = recipes.find((r) => r.id === stack.activeRecipeId)?.label ?? ''}
          <div
            class="progress-bar"
            style="left: {stack.pos.x}vmin; top: {stack.pos.y - 4.5}vmin; width: {CARD_W}vmin;"
          >
            <div class="progress-bar-fill" style="width: {stack.progress * 100}%;"></div>
            <span class="progress-bar-label">{recipeLabel}</span>
          </div>
        {/if}
      {/each}

      {#if routingMode}
        <div
          class="routing-overlay"
          onmousedown={handleRoutingMouseDown}
          onmousemove={handleRoutingMouseMove}
          onmouseup={handleRoutingMouseUp}
          role="presentation"
        ></div>
      {/if}
    </Draggable>
    {#if gameState.clock.endOfSol}
      <div class="sol-overlay">
        <div class="sol-dialog">
          <div class="sol-title">Sol {gameState.clock.sol} complete</div>
          {#each gameState.clock.lastSolFeeds.filter((f) => f.deaths.length > 0 || f.provided < f.needed) as feed (feed.boardName)}
            <div class="sol-board-section">
              <div class="sol-board-name">{feed.boardName}: {feed.provided}/{feed.needed} ⚡</div>
              {#each feed.deaths as { type, count } (type)}
                <span class="sol-death-entry">💀 {count}× {CARD_CATALOG[type].title} died</span>
              {/each}
            </div>
          {/each}
          <button class="sol-continue" onclick={continueSol}
            >Continue to Sol {gameState.clock.sol + 1}</button
          >
        </div>
      </div>
    {/if}
    {#if gameState.boards.filter((b) => b.discovered).length > 1}
      <LocationNav boards={gameState.boards} bind:currentBoardIndex={gameState.currentBoardIndex} />
    {/if}
  </div>
  <Sidebar
    boards={gameState.boards}
    currentBoardIndex={gameState.currentBoardIndex}
    knownRecipeIds={currentBoard.knownRecipeIds}
    {selectedCard}
    onTeleport={createTeleportCard}
    onExport={exportSave}
    onImport={importSave}
  />
</div>

<svelte:window
  onresize={updateVmin}
  onkeydown={onKeyDown}
  onmousemove={(e) => {
    mousePosition.x = e.clientX;
    mousePosition.y = e.clientY;
  }}
/>

<style>
  .viewport {
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-columns: 1fr 25vw;
    grid-template-rows: auto 1fr;
    overflow: hidden;
  }

  .board-area {
    position: relative;
    overflow: hidden;
    background-color: #3d2b1f;
  }

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
    background: #1a1a2e;
    border: 2px solid #f4c430;
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
      color: #f4c430;
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
      background: #f4c430;
      border: none;
      border-radius: 0.5rem;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.5rem;
      color: #1a1a2e;
      cursor: pointer;

      &:hover {
        background: #ffe066;
      }
    }
  }

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

  .routing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    cursor: crosshair;
    z-index: 5;
  }

  :global .board {
    position: relative;
    background-color: #c9a96e;
    transform-origin: 0 0;
    border: 1vmin solid #8b6914;
    border-radius: 5vmin;
    overflow: hidden;

    .progress-bar {
      position: absolute;
      height: 4vmin;
      background: rgba(0, 0, 0, 0.45);
      border-radius: 0.5vmin 0.5vmin 0 0;
      overflow: hidden;
      pointer-events: none;

      .progress-bar-fill {
        position: absolute;
        inset: 0;
        background: limegreen;
        opacity: 0.55;
      }

      .progress-bar-label {
        position: relative;
        z-index: 1;
        display: block;
        font-family: 'BigNoodleTitling', sans-serif;
        font-size: 2.2vmin;
        line-height: 4vmin;
        padding: 0 0.4vmin;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
      }
    }
  }
</style>
