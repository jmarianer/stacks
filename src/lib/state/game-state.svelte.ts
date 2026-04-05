import type { GameState } from '$lib/types/game-state';
import { initialBoards, initialKnownRecipeIds } from '$lib/data/initial-boards';
import { makeClock } from '$lib/utils/card-factories';

let gameState = $state<GameState>({
  boards: initialBoards,
  clock: makeClock(),
  currentBoardIndex: 0,
  knownRecipeIds: initialKnownRecipeIds,
  combatState: {},
});

export function setGameState(s: GameState): void {
  gameState = s;
}

export { gameState };
