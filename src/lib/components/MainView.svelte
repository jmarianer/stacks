<script lang="ts">
  // import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import { onMount } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import Card from '$lib/components/Card.svelte';
  import BoardCanvas, { type AttackPair } from '$lib/components/BoardCanvas.svelte';
  import RoutingOverlay from '$lib/components/RoutingOverlay.svelte';
  import SolEndModal from '$lib/components/SolEndModal.svelte';
  import { STACK_CARD_OFFSET_Y, STACK_CARD_OFFSET_X, CARD_W, CARD_H } from '$lib/data/constants';
  import Draggable from './Draggable.svelte';
  import { addScaled } from '$lib/utils/vec2';
  import type { Stack, Board, ShopItem, CardData } from '$lib/types/game-state';
  import Hud from './Hud.svelte';
  import Sidebar from './Sidebar.svelte';
  import LocationNav from './LocationNav.svelte';
  import type { CardDef } from '$lib/types/card-types';
  import { CARD_CATALOG } from '$lib/data/card-defs';
  import { getUnitWeapon } from '$lib/utils/unit-stats';
  import { initialBoards, initialKnownRecipeIds } from '$lib/data/initial-boards';
  import {
    makeClock,
    makeStack,
    makeStackFromCards,
    makeTeleportCard,
  } from '$lib/utils/card-factories';
  import { tick as tickPhysics } from '$lib/behavior/physics';
  import { tick as tickProgress, checkMilestones } from '$lib/behavior/progress';
  import { runCombat, getCombatUnits, nearestCombatant } from '$lib/behavior/combat';
  import { tickClock, getSolProgress, setSpeed, getVirtualNow } from '$lib/behavior/clock';
  import { recipes } from '$lib/data/recipes';
  import { gameState } from '$lib/state/game-state.svelte';
  import {
    applySave,
    loadSave,
    saveState,
    exportSave,
    importSave,
    SAVE_INTERVAL_MS,
  } from '$lib/state/persistence';
  import { useBoardView } from '$lib/hooks/useBoardView.svelte';
  import { useDragAndDrop } from '$lib/hooks/useDragAndDrop.svelte';

  let selectedCard = $state<CardData | null>(null);
  let routingMode = $state(false);
  let routingFrom = $state<Stack | null>(null);
  let routingMouseBoard = $state<{ x: number; y: number } | null>(null);
  // When non-null, the filter-assignment input is open for this connection (identified by fromId+toId)
  let pendingFilterConn = $state<{ fromId: number; toId: number } | null>(null);
  const attackPairs = new SvelteMap<number, AttackPair>();

  let boardAreaEl = $state<HTMLElement | null>(null);
  const boardView = useBoardView(() => boardAreaEl);
  const dnd = useDragAndDrop(boardView.boardMouse);

  function stackCenter(stack: Stack) {
    return { x: stack.pos.x + CARD_W / 2, y: stack.pos.y + CARD_H / 2 };
  }

  function updateAttackPairs(board: Board, now_ms: number) {
    const { playerUnits, enemyUnits } = getCombatUnits(board);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const activeIds = new Set<number>();

    if (playerUnits.length > 0 && enemyUnits.length > 0) {
      for (const unit of playerUnits) {
        if (!(unit.card.id in gameState.combatState)) continue;
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

  function stackAtMouse(): Stack | undefined {
    const { x, y } = boardView.boardMouse();
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
    if (e.key === 'w') boardView.translate.y += speed;
    if (e.key === 's') boardView.translate.y -= speed;
    if (e.key === 'a') boardView.translate.x += speed;
    if (e.key === 'd') boardView.translate.x -= speed;
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
    gameState.clock.sol++;
    gameState.clock.solStartTime = gameState.clock.vTime;
  }

  let solProgress = $state(0);
  let vTime = $state(0);
  let realNow = $state(0);

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
    dnd.draggingId !== null &&
      currentBoard.stacks.find((s) => s.id === dnd.draggingId)?.cards[0]?.type === 'foundation',
  );

  const inCombat = $derived(
    currentBoard.stacks.some((s) => s.cards.some((c) => CARD_CATALOG[c.type].enemy !== undefined)),
  );

  function createTeleportCard(targetBoardIndex: number, onBoard: Board = currentBoard) {
    const card = makeTeleportCard(targetBoardIndex, gameState.boards[targetBoardIndex].name);
    const stack = makeStackFromCards({ x: onBoard.width / 2, y: onBoard.height / 2 }, [card]);
    onBoard.stacks = [...onBoard.stacks, stack];
  }

  function buyCard(item: ShopItem) {
    if (currentBoard.currency < item.price) return;
    currentBoard.currency -= item.price;
    const pos = { x: currentBoard.width / 2, y: currentBoard.height / 2 };
    currentBoard.stacks.push(makeStack(pos, [item.cardType]));
  }

  $effect(() => {
    let rafId: number;
    let lastSaveAt = 0;

    function loop() {
      const now_ms = performance.now();
      dnd.updateDropTargets();
      tickClock(gameState, now_ms);
      const now = getVirtualNow(gameState.clock, now_ms);
      if (!gameState.clock.endOfSol && gameState.clock.speed !== 0) {
        checkMilestones(gameState, currentBoard);
        for (const board of gameState.boards) {
          tickPhysics(board, dnd.draggingId);
          runCombat(board, gameState, now);
          tickProgress(board, gameState, now);
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
        boardView.translate.x += dx;
        boardView.translate.y += dy;
      }}
      class="board"
      style="
      width: {currentBoard.width}vmin;
      height: {currentBoard.height}vmin;
      transform: translate({boardView.translate.x}px, {boardView.translate
        .y}px) scale({boardView.scale});
    "
      onwheel={boardView.onWheel}
    >
      <BoardCanvas
        board={currentBoard}
        {attackPairs}
        {routingMode}
        {routingFrom}
        {routingMouseBoard}
        {pendingFilterConn}
        {realNow}
        {isDraggingFoundation}
        foundationSnapPos={dnd.foundationSnapPos}
      />

      {#each renderedCards as { cardData, stack, cardIndex } (cardData.id)}
        <Card
          {cardData}
          top={stack.pos.y + cardIndex * STACK_CARD_OFFSET_Y}
          left={stack.pos.x + cardIndex * STACK_CARD_OFFSET_X}
          isDropTarget={dnd.dropTargetId === stack.id && cardIndex === stack.cards.length - 1}
          {inCombat}
          {vTime}
          onDragStart={(e) => dnd.handleDragStart(stack, cardIndex, e)}
          onDragEnd={dnd.handleDragEnd}
          onDrag={(dx, dy) => {
            addScaled(stack.pos, { x: dx, y: dy }, 1 / (boardView.vmin * boardView.scale));
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
        <RoutingOverlay
          board={currentBoard}
          bind:routingFrom
          bind:routingMouseBoard
          bind:pendingFilterConn
          boardPosFromEvent={boardView.boardPosFromEvent}
        />
      {/if}
    </Draggable>
    <SolEndModal clock={gameState.clock} oncontinue={continueSol} />
    {#if gameState.boards.filter((b) => b.discovered).length > 1}
      <LocationNav boards={gameState.boards} bind:currentBoardIndex={gameState.currentBoardIndex} />
    {/if}
  </div>
  <Sidebar
    boards={gameState.boards}
    currentBoardIndex={gameState.currentBoardIndex}
    knownRecipeIds={gameState.knownRecipeIds}
    {selectedCard}
    onTeleport={createTeleportCard}
    onExport={exportSave}
    onImport={importSave}
    onReset={() => {
      applySave({
        boards: initialBoards,
        clock: makeClock(),
        currentBoardIndex: 0,
        knownRecipeIds: initialKnownRecipeIds,
        combatState: {},
      });
    }}
  />
</div>

<svelte:window
  onresize={boardView.updateVmin}
  onkeydown={onKeyDown}
  onmousemove={(e) => boardView.updateMousePosition(e.clientX, e.clientY)}
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
