import type { Recipe } from '$lib/recipe-types';

export const recipes: Recipe[] = [
  {
    id: 'punch-crust-chunk',
    time: 3000,
    ingredients: [
      { match: 'crust-chunk', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [
      { action: 'weighted', cards: { 'fossil-regolith': 25, nanocarbon: 75 } },
      { action: 'weighted', cards: { 'plasteel-deposit': 25, plasteel: 75 } },
      { action: 'card', card: 'helium3', chance: 25 },
    ],
  },
  {
    id: 'punch-plasteel-deposit',
    time: 3000,
    ingredients: [
      { match: 'plasteel-deposit', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'plasteel' }],
  },
  {
    id: 'punch-dark-matter-chunk',
    time: 3000,
    ingredients: [
      { match: 'dark-matter-chunk', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [
      { action: 'card', card: 'dark-matter' },
      { action: 'card', card: 'dark-matter', chance: 33 },
      { action: 'card', card: 'dark-matter', chance: 33 },
    ],
  },
  {
    id: 'punch-fossil-regolith',
    time: 3000,
    ingredients: [
      { match: 'fossil-regolith', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'weighted', cards: { helium3: 100, biomass: 100 } }],
  },
  {
    id: 'make-energy-cell',
    time: 2000,
    ingredients: [
      { match: 'plasteel', consumed: true },
      { match: 'helium3', consumed: true },
    ],
    results: [{ action: 'card', card: 'energy-cell' }],
  },
  {
    id: 'make-multi-cell',
    time: 2000,
    ingredients: [{ match: 'energy-cell', count: 4, consumed: true }],
    results: [{ action: 'card', card: 'multi-cell' }],
  },
  {
    id: 'make-mega-cell',
    time: 2000,
    ingredients: [{ match: 'multi-cell', count: 4, consumed: true }],
    results: [{ action: 'card', card: 'mega-cell' }],
  },
  {
    id: 'make-snow-sphere',
    time: 3000,
    ingredients: [
      { match: 'snow-pile', count: 3, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'snow-sphere' }],
  },
  {
    id: 'make-snowballs',
    time: 3000,
    ingredients: [
      { match: 'snow-pile', count: 2, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'snowballs' }],
  },
] satisfies Recipe[];
