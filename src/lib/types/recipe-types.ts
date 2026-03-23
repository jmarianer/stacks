export type RecipeIngredient = { match: string; count?: number; consumed: boolean };

export type RecipeResult =
  | { action: 'card'; card: string; chance?: number }
  | { action: 'weighted'; cards: Record<string, number> }
  | { action: 'unlock-recipe'; recipeId: string }
  | { action: 'expand-board'; dWidth: number; dHeight: number }
  | {
      action: 'train-stat';
      stat: 'endurance' | 'strength' | 'perception' | 'intelligence' | 'agility' | 'luck';
      amount: number;
    }
  | { action: 'heal-unit'; amount: number } // amount = HP restored; use Infinity for full heal
  | { action: 'revive-unit' } // restores unit from tombstone card in the stack
  | { action: 'spawn-enemies'; enemyType: string; count: number } // spawns N enemies scattered on the board
  | { action: 'discover-board'; boardName: string; chance: number; prerequisite?: string } // reveals a board location
  | { action: 'equip-weapon' } // moves the consumed weapon card into the unit's weaponInventory
  | { action: 'equip-band-aid' } // increments bandAids on the unit
  | { action: 'equip-uni-kit' }; // increments uniKits on the unit

export type Recipe = {
  id: string;
  label: string;
  time: number;
  ingredients: RecipeIngredient[];
  results: RecipeResult[];
  alwaysKnown?: boolean; // fires even if not in board.knownRecipeIds
};
