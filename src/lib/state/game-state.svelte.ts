import type { GameState } from '$lib/types/game-state';
import { initialBoards, initialKnownRecipeIds } from '$lib/data/initial-boards';
import { makeClock } from '$lib/utils/card-factories';

const gameState = $state<GameState>({
  boards: initialBoards,
  clock: makeClock(),
  currentBoardIndex: 0,
  knownRecipeIds: initialKnownRecipeIds,
  combatState: {},
});

export function setGameState(s: GameState): void {
  Object.assign(gameState, s);
}

export { gameState };
