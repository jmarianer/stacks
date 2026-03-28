import type { Board, Clock } from '$lib/types/board-types';
import type { CardType } from '$lib/data/card-defs';

export type Milestone = {
  id: string;
  condition: (boards: Board[], clock: Clock) => boolean;
  unlockRecipeIds: string[];
  createCards: CardType[]; // real cards dropped (e.g. invasion warnings)
};
