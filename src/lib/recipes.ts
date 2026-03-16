import type { Recipe } from '$lib/recipe-types';

export const recipes: Recipe[] = [
  {
    id: 'punch-crust-chunk',
    label: 'Punch Crust Chunk',
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
    label: 'Mine Plasteel Deposit',
    time: 3000,
    ingredients: [
      { match: 'plasteel-deposit', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'plasteel' }],
  },
  {
    id: 'punch-dark-matter-chunk',
    label: 'Collect Dark Matter',
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
    label: 'Process Fossil Regolith',
    time: 3000,
    ingredients: [
      { match: 'fossil-regolith', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'weighted', cards: { helium3: 100, biomass: 100 } }],
  },
  {
    id: 'make-energy-cell',
    label: 'Craft Energy Cell',
    time: 2000,
    ingredients: [
      { match: 'plasteel', consumed: true },
      { match: 'helium3', consumed: true },
    ],
    results: [{ action: 'card', card: 'energy-cell' }],
  },
  {
    id: 'make-multi-cell',
    label: 'Combine: Multi-Cell',
    time: 2000,
    ingredients: [{ match: 'energy-cell', count: 4, consumed: true }],
    results: [{ action: 'card', card: 'multi-cell' }],
  },
  {
    id: 'make-mega-cell',
    label: 'Combine: Mega-Cell',
    time: 2000,
    ingredients: [{ match: 'multi-cell', count: 4, consumed: true }],
    results: [{ action: 'card', card: 'mega-cell' }],
  },
  {
    id: 'make-snow-sphere',
    label: 'Pack Snow Sphere',
    time: 3000,
    ingredients: [
      { match: 'snow-pile', count: 3, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'snow-sphere' }],
  },
  {
    id: 'make-snowballs',
    label: 'Pack Snowballs',
    time: 3000,
    ingredients: [
      { match: 'snow-pile', count: 2, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'snowballs' }],
  },

  // --- Recipes unlocked via milestones ---
  {
    id: 'build-workbench',
    label: 'Build Workbench',
    time: 5000,
    ingredients: [
      { match: 'plasteel', count: 4, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'workbench' }],
  },
  {
    id: 'make-electronics',
    label: 'Make Electronics',
    time: 3000,
    ingredients: [
      { match: 'workbench', consumed: false },
      { match: 'plasteel', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'electronics' }],
  },
  {
    id: 'make-service-drone',
    label: 'Build Service Drone',
    time: 3000,
    ingredients: [
      { match: 'plasteel', consumed: true },
      { match: 'nanocarbon', consumed: true },
      { match: 'energy-cell', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'service-drone-1' }],
  },
  {
    id: 'build-solar-panel',
    label: 'Build Solar Panel',
    time: 3000,
    ingredients: [
      { match: 'plasteel', count: 2, consumed: true },
      { match: 'nanocarbon', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'solar-panel' }],
  },

  // --- Solar panel energy production ---
  {
    id: 'solar-panel-generate',
    label: 'Solar: Generate Energy',
    time: 15000,
    alwaysKnown: true,
    ingredients: [
      { match: 'solar-panel', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'energy-cell' }],
  },
] satisfies Recipe[];
