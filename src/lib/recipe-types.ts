export type RecipeIngredient = { match: string; count?: number; consumed: boolean };

export type RecipeResult =
  | { action: 'card'; card: string; chance?: number }
  | { action: 'weighted'; cards: Record<string, number> }
  | { action: 'unlock-recipe'; recipeId: string };

export type Recipe = {
  id: string;
  time: number;
  ingredients: RecipeIngredient[];
  results: RecipeResult[];
  alwaysKnown?: boolean; // fires even if not in board.knownRecipeIds
};
