import type { GameState } from '$lib/types/game-state';
import { makeGameState } from '$lib/data/initial-boards';

const gameState = $state<GameState>(makeGameState());

export function setGameState(s: GameState): void {
  Object.assign(gameState, s);
}

export { gameState };
