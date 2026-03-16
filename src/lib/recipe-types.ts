export type RecipeIngredient = { match: string; consumed: boolean };

export type RecipeResult =
  | { action: 'card'; card: string; chance?: number }
  | { action: 'weighted'; cards: Record<string, number> };

export type Recipe = {
  id: string;
  time: number;
  ingredients: RecipeIngredient[];
  results: RecipeResult[];
};
