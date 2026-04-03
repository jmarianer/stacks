import type { Board, Clock } from '$lib/types/board-types';

export type GameState = {
  boards: Board[];
  clock: Clock;
  currentBoardIndex: number;
  knownRecipeIds: string[];
};
