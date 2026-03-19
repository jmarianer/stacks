<script lang="ts">
  // import SettingsDialog from '$lib/SettingsDialog.svelte';
  // let settingsDialog: SettingsDialog;
  import Card from '$lib/Card.svelte';
  import {
    STACK_CARD_OFFSET_Y,
    STACK_CARD_OFFSET_X,
    CARD_W,
    CARD_H,
    DROP_TARGET_INSET,
    CARD_GAP,
  } from '$lib/constants';
  import Draggable from './Draggable.svelte';
  import { addScaled } from '$lib/utils/vec2';
  import {
    type Stack,
    type Board,
    type ShopItem,
    type CardType,
    type CardData,
    type Clock,
    type UnitStats,
    hpMaxFromStats,
  } from '$lib/cards';
  import {
    CARD_CATALOG,
    initialBoards,
    makeClock,
    makeStackFromCards,
    addCardToMatchingStack,
  } from '$lib/card-catalog';
  import { tick as tickPhysics } from '$lib/physics';
  import {
    tick as tickProgress,
    tickClock,
    SOL_DURATION,
    UNIT_FEED,
    getVirtualNow,
    setSpeed,
  } from '$lib/progress';
  import { recipes } from '$lib/recipes';
  import type { RecipeResult } from '$lib/recipe-types';

  let showRecipes = $state(false);
  let recipeSearch = $state('');
  let showTeleport = $state(false);
  let statPanel = $state<{ card: CardData; stats: UnitStats; x: number; y: number } | null>(null);
  let routingMode = $state(false);
  let routingFrom = $state<Stack | null>(null);
  let routingMouseBoard = $state<{ x: number; y: number } | null>(null);

  function ingredientLabel(match: string): string {
    if (match === 'people') return 'Person';
    const def = CARD_CATALOG[match as CardType];
    return def ? def.title : match;
  }

  function resultLabel(result: RecipeResult): string {
    if (result.action === 'card') {
      const def = CARD_CATALOG[result.card as CardType];
      const name = def ? def.title : result.card;
      return result.chance !== undefined ? `${name} (${result.chance}%)` : name;
    }
    if (result.action === 'weighted') {
      return Object.keys(result.cards)
        .map((k) => {
          const d = CARD_CATALOG[k as CardType];
          return d ? d.title : k;
        })
        .join(' / ');
    }
    if (result.action === 'unlock-recipe') {
      const r = recipes.find((rec) => rec.id === result.recipeId);
      return `Unlocks: ${r?.label ?? result.recipeId}`;
    }
    return '';
  }

  let scale = $state(1);
  let translate = $state({ x: 0, y: 0 });
  let vmin = $state(0);

  function updateVmin() {
    vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  }

  $effect(() => {
    updateVmin();
    translate.x = (window.innerWidth - currentBoard.width * vmin) / 2;
    translate.y = (window.innerHeight - currentBoard.height * vmin) / 2;
  });

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    scale = scale * zoomFactor;
    translate.x = e.clientX - (e.clientX - translate.x) * zoomFactor;
    translate.y = e.clientY - (e.clientY - translate.y) * zoomFactor;
  }

  function boardMouse() {
    return {
      x: (mousePosition.x - translate.x) / (vmin * scale),
      y: (mousePosition.y - translate.y) / (vmin * scale),
    };
  }

  function boardPosFromEvent(e: MouseEvent) {
    return {
      x: (e.clientX - translate.x) / (vmin * scale),
      y: (e.clientY - translate.y) / (vmin * scale),
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

  function connectionEndpoints(from: Stack, to: Stack) {
    const f = stackCenter(from);
    const t = stackCenter(to);
    return { x1: f.x, y1: f.y, x2: t.x, y2: t.y };
    // const dx = t.x - f.x;
    // const dy = t.y - f.y;
    // const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    // const nx = dx / dist;
    // const ny = dy / dist;
    // const r = Math.min(CARD_W, CARD_H) / 2;
    // return { x1: f.x + nx * r, y1: f.y + ny * r, x2: t.x - nx * (r + 2), y2: t.y - ny * (r + 2) };
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
      if (!clock.endOfSol) {
        const now = performance.now();
        setSpeed(clock, now, clock.speed === 0 ? clock.lastActiveSpeed : 0);
      }
    }
    if (e.key === '1') setSpeed(clock, performance.now(), 1);
    if (e.key === '2') setSpeed(clock, performance.now(), 2);
    if (e.key === '3') setSpeed(clock, performance.now(), 3);
    if (e.key === '4' && !clock.endOfSol) setSpeed(clock, performance.now(), 0);
    if (e.key === 'q' || e.key === 'Q') showRecipes = !showRecipes;
    if (e.key === 't' || e.key === 'T') showTeleport = !showTeleport;
    if (e.key === 'r' || e.key === 'R') routingMode = !routingMode;
    if (e.key === 'Backspace') {
      const stack = stackAtMouse();
      if (!stack) return;
      const sellable = stack.cards.filter((c) => CARD_CATALOG[c.type].value !== undefined);
      if (sellable.length === 0) return;
      currentBoard.currency += sellable.reduce((sum, c) => sum + CARD_CATALOG[c.type].value!, 0);
      stack.cards = stack.cards.filter((c) => CARD_CATALOG[c.type].value === undefined);
      if (stack.cards.length === 0) {
        currentBoard.stacks = currentBoard.stacks.filter((s) => s.id !== stack.id);
      }
    }
  }

  function continueSol() {
    const realNow = performance.now();
    clock.vTimeAt = realNow;
    clock.endOfSol = false;
    clock.endOfSolAt = null;
    clock.sol++;
    clock.solStartTime = clock.vTime;
  }

  let solProgress = $state(0);

  const energyAvailable = $derived(
    currentBoard.stacks
      .flatMap((s) => s.cards)
      .reduce((sum, c) => sum + (c.energyRemaining ?? 0), 0),
  );

  const energyNeeded = $derived(
    currentBoard.stacks
      .flatMap((s) => s.cards)
      .reduce((sum, c) => sum + (UNIT_FEED[c.type]?.cost ?? 0), 0),
  );

  let boards = $state<Board[]>(initialBoards);
  let clock = $state<Clock>(makeClock());
  let currentBoardIndex = $state(0);
  const currentBoard = $derived(boards[currentBoardIndex]);

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

  let nextCardId = $state(1_000_000); // high enough to not collide with catalog IDs

  function createTeleportCard(targetBoardIndex: number, onBoard: Board = currentBoard) {
    const card: CardData = {
      id: nextCardId++,
      type: 'teleport',
      label: `→ ${boards[targetBoardIndex].name}`,
      targetBoardIndex,
    };
    const stack = makeStackFromCards({ x: onBoard.width / 2, y: onBoard.height / 2 }, [card]);
    onBoard.stacks = [...onBoard.stacks, stack];
    showTeleport = false;
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
        const dest = boards[destIdx];
        const newStack = makeStackFromCards(
          { x: dest.width / 2, y: dest.height / 2 },
          dragging.cards,
        );
        dest.stacks = [...dest.stacks, newStack];
        currentBoard.stacks = stacks.filter((s) => s.id !== target.id && s.id !== dragging.id);
        currentBoardIndex = destIdx;
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

  $effect(() => {
    let rafId: number;

    function loop() {
      const now = performance.now();
      updateDropTargets();
      tickClock(clock, boards, now);
      for (const board of boards) {
        tickPhysics(board);
        const executedRecipeIds = tickProgress(board, clock, now);
        for (const recipeId of executedRecipeIds) {
          const recipe = recipes.find((r) => r.id === recipeId);
          for (const disc of recipe?.discovers ?? []) {
            const target = boards.find((b) => b.name === disc.boardName);
            const prereqMet =
              !disc.prerequisite || boards.find((b) => b.name === disc.prerequisite)?.discovered;
            if (target && !target.discovered && prereqMet && Math.random() * 100 < disc.chance) {
              target.discovered = true;
              createTeleportCard(boards.indexOf(target), board);
            }
          }
        }
      }
      if (clock.solStartTime !== null && !clock.endOfSol) {
        const vNow = getVirtualNow(clock, now);
        solProgress = Math.min((vNow - clock.solStartTime) / SOL_DURATION, 1);
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  });
</script>

<div class="viewport">
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
        onDragStart={(e) => handleDragStart(stack, cardIndex, e)}
        onDragEnd={handleDragEnd}
        onDrag={(dx, dy) => {
          addScaled(stack.pos, { x: dx, y: dy }, 1 / (vmin * scale));
        }}
        onContextMenu={(e) => {
          if (cardData.unitStats)
            statPanel = { card: cardData, stats: cardData.unitStats, x: e.clientX, y: e.clientY };
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
        <button class="sol-continue" onclick={continueSol}>Continue to Sol {clock.sol + 1}</button>
      </div>
    </div>
  {/if}
  {#if showTeleport}
    <div class="teleport-panel">
      <div class="teleport-title">Teleport To…</div>
      {#each boards as board, i (board.name)}
        {#if i !== currentBoardIndex && board.discovered}
          <button class="teleport-dest" onclick={() => createTeleportCard(i)}>
            {board.name}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
  {#if statPanel}
    {@const s = statPanel.stats}
    {@const ATTRS: { key: keyof typeof s; label: string; effect: string }[] = [
      { key: 'en', label: 'Endurance',    effect: '+10 HP / level' },
      { key: 'st', label: 'Strength',     effect: 'Damage & knockdown' },
      { key: 'pe', label: 'Perception',   effect: 'Accuracy & range' },
      { key: 'in', label: 'Intelligence', effect: 'Crafting speed' },
      { key: 'ag', label: 'Agility',      effect: 'Rate of fire' },
      { key: 'lk', label: 'Luck',         effect: 'Critical hits' },
    ]}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div class="stat-backdrop" onclick={() => (statPanel = null)}></div>
    <div
      class="stat-panel"
      style="left: {Math.min(statPanel.x, window.innerWidth - 220)}px; top: {Math.min(
        statPanel.y,
        window.innerHeight - 320,
      )}px;"
    >
      <div class="stat-header">
        <span class="stat-name">{CARD_CATALOG[statPanel.card.type].title}</span>
        <span class="stat-level">Lv. {s.level}</span>
      </div>
      <div class="stat-hp-row">
        <span class="stat-hp-label">HP</span>
        <div class="stat-hp-bar">
          <div class="stat-hp-fill" style="width: {(s.hp / hpMaxFromStats(s)) * 100}%"></div>
        </div>
        <span class="stat-hp-nums">{s.hp}/{hpMaxFromStats(s)}</span>
      </div>
      {#each ATTRS as attr (attr.key)}
        <div class="stat-row">
          <span class="stat-abbr">{attr.key.toUpperCase()}</span>
          <span class="stat-full">{attr.label}</span>
          <span class="stat-val">{s[attr.key]}</span>
          <span class="stat-effect">{attr.effect}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if showRecipes}
    <div class="recipes-panel">
      <div class="recipes-title">Known Recipes</div>
      <input class="recipe-search" type="search" placeholder="Search…" bind:value={recipeSearch} />
      {#each currentBoard.knownRecipeIds as id (id)}
        {@const recipe = recipes.find((r) => r.id === id)}
        {#if recipe && recipe.label.toLowerCase().includes(recipeSearch.toLowerCase())}
          <div class="recipe-entry">
            <div class="recipe-name">
              {recipe.label}
              <span class="recipe-time">{recipe.time / 1000}s</span>
            </div>
            <div class="recipe-ingredients">
              {#each recipe.ingredients as ing, i (ing)}
                {#if i > 0}<span class="sep">+</span>{/if}
                <span class="ingredient" class:reusable={!ing.consumed}>
                  {#if ing.count && ing.count > 1}{ing.count}×{/if}{ingredientLabel(
                    ing.match,
                  )}{#if !ing.consumed}
                    ↺{/if}
                </span>
              {/each}
            </div>
            <div class="recipe-results">
              {#each recipe.results as result, i (result)}
                {#if i > 0}<span class="sep">·</span>{/if}
                <span class="result">{resultLabel(result)}</span>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
  {#if boards.filter((b) => b.discovered).length > 1}
    <nav class="location-nav">
      {#each boards as board, i (board.name)}
        {#if board.discovered}
          <button
            class="location-btn"
            class:active={i === currentBoardIndex}
            onclick={() => (currentBoardIndex = i)}>{board.name}</button
          >
        {/if}
      {/each}
    </nav>
  {/if}
  <div class="hud">
    <div class="speed-controls">
      <button
        class="speed-btn"
        class:active={clock.speed === 0 && !clock.endOfSol}
        onclick={() => setSpeed(clock, performance.now(), 0)}
        disabled={clock.endOfSol}>⏸</button
      >
      {#each [1, 2, 3] as s (s)}
        <button
          class="speed-btn"
          class:active={clock.speed === s && !clock.endOfSol}
          onclick={() => setSpeed(clock, performance.now(), s)}
          disabled={clock.endOfSol}>{s}×</button
        >
      {/each}
    </div>
    <span class="sol-hud">Sol {clock.sol}</span>
    <div class="sol-bar"><div class="sol-bar-fill" style="width: {solProgress * 100}%"></div></div>
    <span class="currency">${currentBoard.currency}</span>
    <span class="energy-hud" class:short={energyAvailable < energyNeeded}>
      ⚡ {energyAvailable} / {energyNeeded}
    </span>
    <button class="recipes-toggle" onclick={() => (showRecipes = !showRecipes)}>📖</button>
    {#if boards.some((b, i) => i !== currentBoardIndex && b.discovered)}
      <button class="recipes-toggle" onclick={() => (showTeleport = !showTeleport)}>✈</button>
    {/if}
    <button
      class="recipes-toggle"
      class:active={routingMode}
      onclick={() => (routingMode = !routingMode)}
      title="Routing mode (R)">⛓</button
    >
    <div class="shop">
      {#each currentBoard.shop as item (item.id)}
        <button
          class="shop-item"
          disabled={currentBoard.currency < item.price}
          onclick={() => buyCard(item)}
        >
          <span class="shop-symbol" style="color: {item.color}">{item.symbol}</span>
          <span class="shop-price">${item.price}</span>
        </button>
      {/each}
    </div>
  </div>
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
    background-color: #3d2b1f;
    overflow: hidden;
    position: relative;
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

    .sol-feed {
      font-size: 1.4rem;
      color: #ccc;
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

  .location-nav {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    gap: 0.25rem;
    padding: 0.4rem 1rem;
    background: rgba(0, 0, 0, 0.4);
    z-index: 5;
    pointer-events: all;

    .location-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.4rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.1rem;
      padding: 0.2rem 0.75rem;
      cursor: pointer;
      opacity: 0.7;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        opacity: 1;
      }

      &.active {
        background: rgba(244, 196, 48, 0.2);
        border-color: #f4c430;
        color: #f4c430;
        opacity: 1;
      }
    }
  }

  .hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.4);
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    font-size: 1.5rem;
    pointer-events: none;

    .speed-controls {
      display: flex;
      gap: 0.2rem;
      pointer-events: all;
    }

    .speed-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 0.3rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.1rem;
      padding: 0.1rem 0.4rem;
      cursor: pointer;
      opacity: 0.6;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
        opacity: 1;
      }

      &.active {
        background: rgba(244, 196, 48, 0.25);
        border-color: #f4c430;
        color: #f4c430;
        opacity: 1;
      }

      &:disabled {
        opacity: 0.3;
        cursor: default;
      }
    }

    .sol-hud {
      opacity: 0.8;
    }

    .sol-bar {
      width: 6rem;
      height: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 0.25rem;
      overflow: hidden;

      .sol-bar-fill {
        height: 100%;
        background: #f4c430;
        transition: width 0.1s linear;
      }
    }

    .currency {
      min-width: 4rem;
    }

    .energy-hud {
      opacity: 0.85;
      &.short {
        color: #ff6b6b;
        opacity: 1;
      }
    }

    .recipes-toggle {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.4rem;
      color: white;
      font-size: 1.25rem;
      padding: 0.2rem 0.5rem;
      cursor: pointer;
      pointer-events: all;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      &.active {
        background: rgba(244, 196, 48, 0.25);
        border-color: #f4c430;
        color: #f4c430;
      }
    }

    .shop {
      display: flex;
      gap: 0.5rem;
      pointer-events: all;
    }

    .shop-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.2rem 0.75rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.4rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1.25rem;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.25);
      }

      &:disabled {
        opacity: 0.4;
        cursor: default;
      }

      .shop-symbol {
        font-size: 1.5rem;
      }
    }
  }

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

  .recipes-panel {
    position: absolute;
    top: 3.5rem;
    right: 1rem;
    background: rgba(10, 10, 20, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-family: 'BigNoodleTitling', sans-serif;
    color: white;
    font-size: 1.1rem;
    min-width: 16rem;
    max-height: calc(100vh - 5rem);
    overflow-y: auto;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .recipes-title {
      font-size: 1.3rem;
      color: #f4c430;
      margin-bottom: 0.1rem;
      letter-spacing: 0.05em;
    }

    .recipe-search {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.3rem;
      color: white;
      font-family: 'BigNoodleTitling', sans-serif;
      font-size: 1rem;
      padding: 0.25rem 0.5rem;
      width: 100%;
      box-sizing: border-box;

      &::placeholder {
        opacity: 0.4;
      }
      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
      }
    }

    .recipe-entry {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .recipe-name {
        font-size: 1.1rem;
        color: #e0e0e0;
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .recipe-time {
        opacity: 0.5;
        font-size: 0.95rem;
      }

      .recipe-ingredients,
      .recipe-results {
        font-size: 0.9rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.2rem;
      }

      .recipe-results::before {
        content: '→';
        opacity: 0.5;
        margin-right: 0.1rem;
      }

      .ingredient {
        color: #aaa;
        &.reusable {
          color: #80cbc4;
        }
      }

      .result {
        color: #a5d6a7;
      }

      .sep {
        opacity: 0.4;
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

  .routing-overlay {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    cursor: crosshair;
    z-index: 5;
  }

  .stat-backdrop {
    position: fixed;
    inset: 0;
    z-index: 19;
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
      .stat-level {
        font-size: 1rem;
        opacity: 0.6;
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
