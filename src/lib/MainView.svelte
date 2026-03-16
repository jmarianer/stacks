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
  } from '$lib/constants';
  import Draggable from './Draggable.svelte';
  import { addScaled } from '$lib/utils/vec2';
  import { type Stack, type Board, type ShopItem, type CardType } from '$lib/cards';
  import { CARD_CATALOG, initialBoards, makeStackFromCards, addCardToMatchingStack } from '$lib/card-catalog';
  import { tick as tickPhysics } from '$lib/physics';
  import { tick as tickProgress, SOL_DURATION } from '$lib/progress';
  import { recipes } from '$lib/recipes';
  import type { RecipeResult } from '$lib/recipe-types';

  let showRecipes = $state(false);
  let recipeSearch = $state('');

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
        .map((k) => { const d = CARD_CATALOG[k as CardType]; return d ? d.title : k; })
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
      const now = performance.now();
      if (currentBoard.paused && !currentBoard.endOfSol) {
        applyPauseDuration(now - currentBoard.pausedAt!);
        currentBoard.paused = false;
        currentBoard.pausedAt = null;
      } else if (!currentBoard.paused && !currentBoard.endOfSol) {
        currentBoard.paused = true;
        currentBoard.pausedAt = now;
      }
    }
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

  function applyPauseDuration(duration: number) {
    for (const stack of currentBoard.stacks) {
      if (stack.progressStartTime !== null) stack.progressStartTime += duration;
    }
    if (currentBoard.solStartTime !== null) currentBoard.solStartTime += duration;
  }

  function continueSol() {
    const now = performance.now();
    applyPauseDuration(now - currentBoard.endOfSolAt!);
    currentBoard.endOfSol = false;
    currentBoard.endOfSolAt = null;
    currentBoard.sol++;
    currentBoard.solStartTime = now;
  }

  let solProgress = $state(0);

  let boards = $state<Board[]>(initialBoards);
  let currentBoardIndex = $state(0);
  const currentBoard = $derived(boards[currentBoardIndex]);

  // Flat list of all cards with their stack and index, keyed by cardData.id.
  // Using a flat {#each} preserves Draggable component instances when cards
  // move between stacks (e.g. during peel), keeping isDragging state intact.
  const renderedCards = $derived(
    currentBoard.stacks.flatMap((stack) =>
      stack.cards.map((cardData, i) => ({ cardData, stack, cardIndex: i })),
    ),
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

  function handleDragEnd() {
    const stacks = currentBoard.stacks;
    const dragging = stacks.find((s) => s.dragging);
    if (!dragging) return;

    const target = stacks.find((s) => s.isDropTarget);
    if (target) {
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
      tickPhysics(currentBoard);
      tickProgress(currentBoard, now);
      if (currentBoard.solStartTime !== null && !currentBoard.endOfSol) {
        solProgress = Math.min((now - currentBoard.solStartTime) / SOL_DURATION, 1);
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
      />
    {/each}
    {#each currentBoard.stacks as stack (stack.id)}
      {#if stack.activeRecipeId !== null}
        {@const progressBarLeft = stack.pos.x}
        {@const progressBarTop = stack.pos.y - 2.5}
        <div
          class="progress-bar"
          style="left: {progressBarLeft}vmin; top: {progressBarTop}vmin; width: {CARD_W}vmin;"
        >
          <div class="progress-bar-fill" style="width: {stack.progress * 100}%;"></div>
        </div>
      {/if}
    {/each}
  </Draggable>
  {#if currentBoard.endOfSol}
    <div class="sol-overlay">
      <div class="sol-dialog">
        <div class="sol-title">Sol {currentBoard.sol} complete</div>
        {#if currentBoard.lastSolFeed}
          {@const feed = currentBoard.lastSolFeed}
          <div class="sol-feed">
            {#if feed.needed === 0}
              No units to feed.
            {:else if feed.provided >= feed.needed}
              Fed all units: {feed.needed} energy consumed.
            {:else}
              ⚠ Only {feed.provided} / {feed.needed} energy available.
            {/if}
          </div>
          {#if feed.deaths.length > 0}
            <div class="sol-deaths">
              {#each feed.deaths as { type, count }}
                <span class="sol-death-entry">
                  💀 {count}× {CARD_CATALOG[type].title} died
                </span>
              {/each}
            </div>
          {/if}
        {/if}
        <button class="sol-continue" onclick={continueSol}>Continue to Sol {currentBoard.sol + 1}</button>
      </div>
    </div>
  {/if}
  {#if showRecipes}
    <div class="recipes-panel">
      <div class="recipes-title">Known Recipes</div>
      <input
        class="recipe-search"
        type="search"
        placeholder="Search…"
        bind:value={recipeSearch}
      />
      {#each currentBoard.knownRecipeIds as id (id)}
        {@const recipe = recipes.find((r) => r.id === id)}
        {#if recipe && recipe.label.toLowerCase().includes(recipeSearch.toLowerCase())}
          <div class="recipe-entry">
            <div class="recipe-name">
              {recipe.label}
              <span class="recipe-time">{recipe.time / 1000}s</span>
            </div>
            <div class="recipe-ingredients">
              {#each recipe.ingredients as ing, i}
                {#if i > 0}<span class="sep">+</span>{/if}
                <span class="ingredient" class:reusable={!ing.consumed}>
                  {#if ing.count && ing.count > 1}{ing.count}×{/if}{ingredientLabel(ing.match)}{#if !ing.consumed} ↺{/if}
                </span>
              {/each}
            </div>
            <div class="recipe-results">
              {#each recipe.results as result, i}
                {#if i > 0}<span class="sep">·</span>{/if}
                <span class="result">{resultLabel(result)}</span>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
  <div class="hud">
    {#if currentBoard.paused && !currentBoard.endOfSol}<span class="paused">⏸ PAUSED</span>{/if}
    <span class="sol-hud">Sol {currentBoard.sol}</span>
    <div class="sol-bar"><div class="sol-bar-fill" style="width: {solProgress * 100}%"></div></div>
    <span class="currency">${currentBoard.currency}</span>
    <button class="recipes-toggle" onclick={() => (showRecipes = !showRecipes)}>📖</button>
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

    .sol-deaths {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 1.2rem;

      .sol-death-entry {
        color: #ff6b6b;
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

    .paused {
      opacity: 0.7;
      letter-spacing: 0.05em;
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

      &::placeholder { opacity: 0.4; }
      &:focus { outline: none; border-color: rgba(255, 255, 255, 0.4); }
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
        &.reusable { color: #80cbc4; }
      }

      .result {
        color: #a5d6a7;
      }

      .sep {
        opacity: 0.4;
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
      height: 2vmin;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 0.5vmin 0.5vmin 0 0;
      overflow: hidden;
      pointer-events: none;

      .progress-bar-fill {
        height: 100%;
        background: limegreen;
      }
    }
  }
</style>
