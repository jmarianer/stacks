import { describe, it, expect } from 'vitest';
import { matchRecipe } from '$lib/behavior/progress';
import { makeStack } from '$lib/utils/card-factories';
import { type CardType } from '$lib/data/card-defs';

// Recipes available from game start (alwaysKnown or in initialKnownRecipeIds)
const KNOWN = ['punch-crust-chunk', 'punch-plasteel-deposit', 'make-energy-cell'];

function makeTestStack(types: CardType[]) {
  return makeStack({ x: 0, y: 0 }, types);
}

function testRecipe(cards: CardType[], recipeNames: string[], expected: string | undefined) {
    const stack = makeTestStack(cards);
    const recipe = matchRecipe(stack, recipeNames);
    expect(recipe?.id).toBe(expected);
}

describe('matchRecipe', () => {
  it('returns null for an empty stack', () => {
    testRecipe([], KNOWN, undefined);
  });

  it('matches a basic recipe when ingredients are present', () => {
    testRecipe(['helium3', 'plasteel'], KNOWN, 'make-energy-cell');
  });

  it('returns null when required ingredients are missing', () => {
    testRecipe(['crust-chunk'], KNOWN, undefined);
  });

  it('matches via group: "people" matches astronaut', () => {
    testRecipe(['crust-chunk', 'astronaut'], KNOWN, 'punch-crust-chunk');
  });

  it('does not match a recipe whose id is not in knownRecipeIds (and not alwaysKnown)', () => {
    testRecipe(['workbench', 'electronics', 'plasteel', 'plasteel', 'astronaut'], [], undefined);
  });

  it('does not match a recipe whose id is not in knownRecipeIds (and not alwaysKnown)', () => {
    testRecipe(['workbench', 'electronics', 'plasteel', 'plasteel', 'astronaut'], ['make-blaster'], 'make-blaster');
  });


  it('matches a recipe with more ingredients', () => {
    testRecipe(['workbench', 'astronaut', 'plasteel'], ['make-electronics', 'make-blaster'], 'make-electronics');
    // TODO fix this. It should definitely make a blaster, not electronics, since the stack has the required ingredients for make-blaster.
    // testRecipe(['workbench', 'astronaut', 'electronics', 'plasteel', 'plasteel'], ['make-electronics', 'make-blaster'], 'make-blaster');
  });

});
