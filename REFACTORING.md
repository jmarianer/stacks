# Refactoring Plan

What a senior, experienced, perfectionist developer would reject in a code review —
and how to split this into independent workstreams.

---

## Critical Issues (would block merge)

### 1. `GameState` type is defined inline in `MainView.svelte`
Line 344: `type GameState = { boards: Board[]; clock: Clock; currentBoardIndex: number }` — in a component, not exported.
Every behavior module (`progress.ts`, `combat.ts`, `clock.ts`) takes `boards` and `clock` as
separate parameters instead. The type that actually describes the whole game doesn't exist as a
first-class citizen anywhere.

**Fix:** Create `src/lib/types/game-state.ts`. Export `GameState`. Update all behavior module
signatures to accept it. Move `knownRecipeIds` from `Board` to `GameState` at the same time
(eliminates the `checkMilestones` workaround of pushing to every board on every unlock).

---

### 2. `MainView.svelte` is a God Component (1026 lines)
It contains: pan/zoom/scale, drag & drop, keyboard input, routing mode UI, foundation snapping,
save/load, the rAF game loop, attack-beam visualization, the sol-end dialog, board navigation,
and the full SVG+HTML template. Every future feature touches this file.

**Fix:** Split along these seams — each is independently extractable:

| Extract to | What it contains |
|---|---|
| `src/lib/state/game-state.svelte.ts` | Module-level `$state` for `GameState`; replaces the local `let gameState` |
| `src/lib/state/persistence.ts` | `loadSave`, `saveState`, `exportSave`, `importSave` |
| `src/lib/components/BoardCanvas.svelte` | The `<svg>` overlay: connection lines, attack beams, foundation grid, routing preview line |
| `src/lib/components/RoutingOverlay.svelte` | The invisible `routing-overlay` div + filter input popup + all routing mouse handlers |
| `src/lib/components/SolEndModal.svelte` | The end-of-sol modal (already a logical unit, just inline) |
| `src/lib/hooks/useBoardView.svelte.ts` | `scale`, `translate`, `vmin`, `onWheel`, `boardMouse`, `boardPosFromEvent` |
| `src/lib/hooks/useDragAndDrop.svelte.ts` | `handleDragStart`, `handleDragEnd`, `updateDropTargets` |

After extraction, `MainView.svelte` becomes a thin coordinator: import hooks, wire components,
run the game loop.

---

### 3. `applyResults` in `progress.ts` is an 100-line if-else chain doing everything
It unlocks recipes, creates cards, discovers boards, spawns enemies, expands boards, heals units,
revives tombstones, trains stats, and equips items — all in one function, all via string comparison
on `result.action`. It's untestable as a unit and will only grow.

**Fix:** Split into focused handlers grouped by concern:
- `applyCardOutputs` — `card`, `weighted`, `spawn-enemies` (things that produce new stacks)
- `applyBoardEffects` — `discover-board`, `expand-board`, `unlock-recipe`
- `applyUnitMutations` — `heal-unit`, `revive-unit`, `train-stat`, `equip-*`

`applyResults` becomes a dispatcher that calls the three. Each handler is independently testable.

---

### 4. `checkMilestones` pushes `unlockRecipeIds` to **every board** as a workaround
```ts
for (const id of milestone.unlockRecipeIds) {
  for (const board of boards) {          // ← iterates every board
    if (!board.knownRecipeIds.includes(id)) board.knownRecipeIds.push(id);
  }
}
```
This is explicitly compensating for `knownRecipeIds` being per-`Board` instead of global. Any board
added *after* a milestone fires won't get its recipes. The workaround will eventually bite.

**Fix:** Part of Issue 1 — move `knownRecipeIds` to `GameState`. `checkMilestones` and
`applyResults` both read/write one list instead of iterating all boards.

---

### 5. UI state lives inside the game model
`Stack.dragging` and `Stack.isDropTarget` are serialized to localStorage and restored on load.
They're drag-and-drop UI state, not game state. A load while dragging would restore with
`dragging: true` and a phantom dragged stack.

Similarly, `CardData.combatHomeStackId`, `combatLastMoveAt`, and `combatHealAt` are transient
combat state stored on the card, saved to disk. After a save+restore mid-combat these stale
values cause incorrect behavior.

**Fix:**
- Remove `dragging`/`isDropTarget` from `Stack`. Track them in `useDragAndDrop` via a `Set<number>` keyed by stack ID.
- Move combat fields off `CardData` into a `Map<number, CombatCardState>` owned by `combat.ts` (or reset them explicitly on load in `applySave`).

---

### 6. `applyResults` receives `connections` that are already on `board`
```ts
const connections = board.connections.filter((c) => c.fromId === stack.id); // in executeRecipe
applyResults(recipe.results, board, boards, stack, connections, consumedCards);
// but applyResults also has board, so could compute this itself
```
The parameter is redundant — `applyResults` has `board` and `stack.id`. The pre-filtering is
done by the caller, not documented, and easy to get wrong. Remove the parameter; let `applyResults`
filter `board.connections` itself.

---

### 7. `console.log(scale)` left in the wheel handler
`MainView.svelte` line 88. Immediate rejection.

---

## High-Priority Issues (would request changes)

### 8. `match` field in recipe ingredients is untyped `string`
`cardMatchesIngredient(type: CardType, match: string)` — `match` is either a `CardType` key or a
group name string. There is no type enforcing this. A typo in any recipe's `match` field silently
fails to match anything.

**Fix:** Define `type IngredientMatcher = CardType | CardGroup` where `CardGroup` is a union of
valid group strings (`'people' | 'weapon' | 'healing' | ...`). Use it in `Recipe.ingredients[].match`.

---

### 9. No unit tests for any core algorithm
Recipe matching has non-obvious tie-breaking logic (prefer lowest max-index, break ties by most
ingredients). Combat has formulas for strength/luck/perception/agility. Energy feeding has priority
ordering and "smallest cells first" logic. None of it is tested. A refactor of any of these will
be done blind.

**Fix:** Add `src/lib/behavior/*.test.ts` for:
- `matchRecipe` — covering tie-breaking, group matching, foundation transparency, equip blocking
- `runCombat` — damage formulas, dodge, healing triggers
- `feedUnits` — priority order, death conditions, smallest-cell-first

---

### 10. Physics and combat tick ALL boards; physics only ticks the current board
In the game loop:
```ts
for (const board of gameState.boards) {
  tickPhysics(board);   // physics on all boards
  runCombat(board, now); // combat on all boards
  tickProgress(board, gameState.boards, now); // recipes on all boards
}
```
But previously physics only ran on `currentBoard`. Now it runs everywhere. Stacks on boards you
haven't visited will be repelled and drift. This should be an explicit design decision, not an
accident. Either: run everything on all boards (fine), or clearly gate physics/combat to
`discovered` boards, or only run the active board and pause others.

---

### 11. `recipe.prereq` is a `string`, should be a predicate function
From TODO line 34. Recipe visibility conditions expressed as strings can't be type-checked, can't
reference game state in a structured way, and require either `eval` or a parser. Use
`prereq?: (gs: GameState) => boolean`.

---

### 12. Milestone optional fields aren't optional
Every `Milestone` has `unlockRecipeIds: string[]` and `createCards: CardType[]`, but 12 of the 18
milestones have empty arrays for one or both. These should be `unlockRecipeIds?: string[]` and
`createCards?: CardType[]`. Callers use `?? []` to handle the absent case.

---

### 13. `energyAvailable` and `energyNeeded` are derived from `currentBoard` only
Passed to `Hud` as props. If a future board has energy producers/consumers, the HUD won't reflect
them. The derivation should probably be over all discovered boards, or be a per-board concept
that Hud displays for the current board explicitly. Either way, document the intent.

---

### 14. `addCardToMatchingStack` is in card-factories but contains routing logic
The function decides where a card lands (existing same-type stack vs. new position). That's
routing/placement logic, not factory logic. It's imported by `progress.ts` and by `MainView`, but
lives in `card-factories.ts`. Move it to a `card-placement.ts` or `routing.ts` util.

---

### 15. `renderedCards` flattens all stacks to preserve `Draggable` identity — undocumented fragility
```ts
const renderedCards = $derived(
  currentBoard.stacks.flatMap((stack) =>
    stack.cards.map((cardData, cardIndex) => ({ cardData, stack, cardIndex })),
  ),
);
```
The comment says "preserves Draggable component instances when cards move between stacks." This is
a non-obvious Svelte 5 constraint. Document it explicitly, and ensure the key `(cardData.id)` is
stable across peel operations (it is, since IDs are permanent).

---

### 16. `loadSave()` clears `vTimeAt` then `applySave` is called — two different reset paths
```ts
function applySave(save: GameState) {
  save.clock.vTimeAt = null;  // resets the virtual clock anchor
  ...
}
onMount(() => applySave(loadSave()));
```
This causes the "save+restore resets to beginning of sol" bug (TODO line 25). The virtual clock
needs to be re-anchored to `performance.now()` at load time, not nulled. Fix: set
`save.clock.vTimeAt = performance.now()` and clear `save.clock.endOfSol` flags if mid-sol.

---

## Medium Issues (style/maintainability)

### 17. Magic numbers not in `constants.ts`
- `GLOW_DURATION = 400` — defined inline in `MainView.svelte` line 124
- Attack cooldown `3000` ms — hardcoded in `combat.ts` line 146
- Physics speed limit `0.25` — hardcoded in `physics.ts` line 82
- Heal trigger `0.5` / regen trigger `0.9` — hardcoded in `combat.ts`

All should live in `constants.ts`.

---

### 18. `weightedRandom` uses `Object.keys/entries` on a plain object
Fine functionally, but insertion-order dependence is a subtle assumption. No real bug today, but
worth a comment or using `Map<CardType, number>` for weighted tables.

---

### 19. `connMidpoint` and `connectionEndpoints` search `currentBoard.stacks` on every call
Called once per connection per frame for rendering. For small stack counts it's fine, but build
a `stackById: Map<number, Stack>` derived value and use it for O(1) lookups instead of `find`.

---

### 20. `filterInput` accepts free text; validation happens only on `confirmFilter`
If the user types a partial card type and dismisses without confirming, the filter is silently
discarded. No feedback. The `<datalist>` helps but isn't a replacement for proper validation UX.

---

## How to split this into independent workstreams

These can be assigned to separate agents with minimal conflict, in dependency order:

### Stream A — Types foundation (do first, others depend on it)
- Create `src/lib/types/game-state.ts` with exported `GameState`
- Move `knownRecipeIds` from `Board` to `GameState`
- Type `Recipe.ingredients[].match` as `CardType | CardGroup`
- Make `unlockRecipeIds` and `createCards` optional on `Milestone`
- Update all callers (behavior modules, `MainView`, `checkMilestones`, `applyResults`)
- Files: `types/game-state.ts` (new), `types/board-types.ts`, `types/recipe-types.ts`,
  `types/milestone-types.ts`, `behavior/progress.ts`, `behavior/combat.ts`, `behavior/clock.ts`

### Stream B — `progress.ts` refactor (depends on A)
- Split `applyResults` into three focused handlers
- Remove the redundant `connections` parameter
- Add unit tests for `matchRecipe` and `executeRecipe`
- Fix `recipe.prereq` to be a predicate function
- Files: `behavior/progress.ts`, `behavior/progress.test.ts`

### Stream C — Combat cleanup (depends on A, parallel with B)
- Move `combatHomeStackId`, `combatLastMoveAt`, `combatHealAt` off `CardData`
  into a `Map<number, CombatCardState>` in `combat.ts`
- Reset or re-derive that map on `applySave`
- Add unit tests for combat formulas
- Files: `types/board-types.ts`, `behavior/combat.ts`, `behavior/combat.test.ts`

### Stream D — MainView UI extraction (parallel with B and C)
- Extract `BoardCanvas.svelte` (SVG overlay)
- Extract `RoutingOverlay.svelte` (routing mode)
- Extract `SolEndModal.svelte` (end-of-sol modal)
- Files: three new components, `MainView.svelte` (template portion only)

### Stream E — MainView logic extraction (depends on D, parallel with B and C)
- Create `src/lib/state/game-state.svelte.ts` with module-level `$state`
- Extract `persistence.ts` (save/load; also fix the vTimeAt bug here)
- Extract `useBoardView.svelte.ts` (scale/translate/vmin/wheel)
- Extract `useDragAndDrop.svelte.ts` (drag, drop targets; remove `dragging`/`isDropTarget` from Stack)
- Remove the `console.log`
- Files: three new hooks, `persistence.ts`, `MainView.svelte` (script portion), `types/board-types.ts`

### Stream F — Constants and minor cleanup (fully independent)
- Move `GLOW_DURATION`, attack cooldown, physics speed limit, heal thresholds to `constants.ts`
- Move `addCardToMatchingStack` to `card-placement.ts`
- Add `stackById` derived map in `MainView` / BoardCanvas for O(1) stack lookup
- Files: `data/constants.ts`, `utils/card-placement.ts`, `utils/card-factories.ts`, `MainView.svelte`
