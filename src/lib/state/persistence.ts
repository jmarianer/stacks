import type { GameState } from '$lib/types/game-state';
import { gameState, setGameState } from '$lib/state/game-state.svelte';
import { setNextId, makeClock } from '$lib/utils/card-factories';
import { initialBoards, initialKnownRecipeIds } from '$lib/data/initial-boards';
import { setSpeed } from '$lib/behavior/clock';

const SAVE_KEY = 'stacks-autosave';
export const SAVE_INTERVAL_MS = 5000;

export function loadSave(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      return JSON.parse(raw) as GameState;
    }
  } catch {
    // fall through to defaults
  }
  return {
    boards: initialBoards,
    clock: makeClock(),
    currentBoardIndex: 0,
    knownRecipeIds: initialKnownRecipeIds,
    combatState: {},
  };
}

export function applySave(save: GameState): void {
  // Re-anchor virtual clock to real time instead of nulling it (fixes save+restore reset bug)
  save.clock.vTimeAt = performance.now();
  save.combatState ??= {};
  setGameState(save);
  const maxId = Math.max(
    0,
    ...save.boards.flatMap((b) => [
      b.id,
      ...b.stacks.flatMap((s) => [s.id, ...s.cards.map((c) => c.id)]),
    ]),
  );
  setNextId(maxId + 1);
}

export function saveState(): void {
  setSpeed(gameState.clock, gameState.clock.speed);
  localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

export function exportSave(): void {
  const json = JSON.stringify(gameState, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stacks-save.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importSave(e: Event): void {
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
