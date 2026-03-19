export type RecipeIngredient = { match: string; count?: number; consumed: boolean };

export type RecipeResult =
  | { action: 'card'; card: string; chance?: number }
  | { action: 'weighted'; cards: Record<string, number> }
  | { action: 'unlock-recipe'; recipeId: string }
  | { action: 'expand-board'; dWidth: number; dHeight: number }
  | { action: 'train-stat'; stat: 'en' | 'st' | 'pe' | 'in' | 'ag' | 'lk'; amount: number };

export type Recipe = {
  id: string;
  label: string;
  time: number;
  ingredients: RecipeIngredient[];
  results: RecipeResult[];
  alwaysKnown?: boolean; // fires even if not in board.knownRecipeIds
  discovers?: { boardName: string; chance: number; prerequisite?: string }[]; // locations this recipe can reveal; prerequisite is a board name that must already be discovered
};
