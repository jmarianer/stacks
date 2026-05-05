import type { GameState } from '$lib/types/game-state';
import type { CardType } from '$lib/data/card-defs';

export type Milestone = {
  id: string;
  title: string;
  condition: (gameState: GameState) => boolean;
  unlockRecipeIds?: string[];
  createCards?: CardType[];
  notification?: string;
};
