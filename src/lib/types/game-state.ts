import type { Board, Clock } from '$lib/types/board-types';
import type { CombatCardState } from '$lib/behavior/combat';

export type GameState = {
  boards: Board[];
  clock: Clock;
  currentBoardIndex: number;
  knownRecipeIds: string[];
  combatState: Record<number, CombatCardState>;
};
