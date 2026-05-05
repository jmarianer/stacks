import type { Recipe } from '$lib/types/recipe-types';
import { CARD_H, CARD_W } from './constants';

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
    id: 'mine-crust-chunk',
    label: 'Mine Crust Chunk',
    time: 15000,
    ingredients: [
      { match: 'pickaxe', consumed: false },
      { match: 'astronaut', consumed: false },
    ],
    results: [{ action: 'card', card: 'crust-chunk' }],
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

  // --- Drill ---
  {
    id: 'build-drill',
    label: 'Build Drill',
    time: 5000,
    ingredients: [
      { match: 'plasteel', count: 3, consumed: true },
      { match: 'nanocarbon', consumed: true },
      { match: 'people', consumed: false },
      { match: 'pickaxe', consumed: true },
    ],
    results: [{ action: 'card', card: 'drill' }],
  },
  {
    id: 'use-drill',
    label: 'Drill Crust',
    time: 3000,
    alwaysKnown: true,
    ingredients: [
      { match: 'drill', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [
      { action: 'card', card: 'crust-chunk' },
      { action: 'discover-board', boardName: 'Alien Eggs', chance: 10 },
    ],
  },

  // --- Advanced workbench ---
  {
    id: 'build-adv-workbench',
    label: 'Build Adv. Workbench',
    time: 3000,
    ingredients: [
      { match: 'electronics', count: 4, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'adv-workbench' }],
  },
  {
    id: 'make-computronium',
    label: 'Computronium',
    time: 10000,
    ingredients: [
      { match: 'adv-workbench', consumed: false },
      { match: 'electronics', count: 3, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'computronium' }],
  },

  // --- Power station ---
  {
    id: 'build-power-station',
    label: 'Build Power Station',
    time: 5000,
    ingredients: [
      { match: 'computronium', count: 2, consumed: true },
      { match: 'plasteel', count: 2, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'power-station' }],
  },
  {
    id: 'use-power-station',
    label: 'Power Station: Generate Multi-Cell',
    time: 15000,
    alwaysKnown: true,
    ingredients: [
      { match: 'power-station', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'multi-cell' }],
  },

  // --- Cloning chamber ---
  {
    id: 'build-cloning-chamber',
    label: 'Build Cloning Chamber',
    time: 10000,
    ingredients: [
      { match: 'plasteel', count: 3, consumed: true },
      { match: 'biomass', consumed: true },
      { match: 'energy-cell', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'cloning-chamber' }],
  },
  {
    id: 'clone-astronaut',
    label: 'Clone Astronaut',
    time: 30000,
    alwaysKnown: true,
    ingredients: [
      { match: 'cloning-chamber', consumed: false },
      { match: 'energy-cell', count: 2, consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'astronaut' }],
  },

  // --- Alien bug breeding ---
  {
    id: 'hatch-pet-alien-bug',
    label: 'Hatch Alien Egg',
    time: 5000,
    alwaysKnown: true,
    ingredients: [
      { match: 'alien-eggs', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'pet-alien-bug' }],
  },
  {
    id: 'breed-pet-alien-bug',
    label: 'Breed Alien Bugs',
    time: 10000,
    alwaysKnown: true,
    ingredients: [{ match: 'pet-alien-bug', count: 2, consumed: false }],
    results: [{ action: 'card', card: 'pet-alien-bug' }],
  },
  {
    id: 'stomp-pet-alien-bug',
    label: 'Stomp Bug → Biomass',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'pet-alien-bug', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'biomass' }],
  },

  // --- Cactus ---
  {
    id: 'punch-cactus',
    label: 'Punch Cactus',
    time: 3000,
    alwaysKnown: true,
    ingredients: [
      { match: 'cactus', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'biomass' }],
  },

  // --- Snow converter ---
  {
    id: 'make-snow-block',
    label: 'Pack Snow Block',
    time: 3000,
    alwaysKnown: true,
    ingredients: [
      { match: 'snow-converter', consumed: false },
      { match: 'snow-pile', count: 3, consumed: true },
    ],
    results: [{ action: 'card', card: 'snow-block' }],
  },

  // --- Foundation ---
  {
    id: 'build-foundation',
    label: 'Build Foundation',
    time: 3000,
    ingredients: [
      { match: 'plasteel', consumed: true },
      { match: 'nanocarbon', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'foundation' }],
  },

  // --- Rover ---
  {
    id: 'build-rover',
    label: 'Build Rover',
    time: 10000,
    ingredients: [
      { match: 'plasteel', consumed: true },
      { match: 'nanocarbon', count: 3, consumed: true },
      { match: 'energy-cell', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'rover' }],
  },
  {
    id: 'use-rover',
    label: 'Rover: Explore',
    time: 10000,
    alwaysKnown: true,
    ingredients: [
      { match: 'rover', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [
      { action: 'weighted', cards: { 'crust-chunk': 100, bacteria: 20 } },
      { action: 'discover-board', boardName: 'Flowers', chance: 10 },
      { action: 'discover-board', boardName: 'Desert', chance: 10, prerequisite: 'Flowers' },
    ],
  },

  // --- Tres-2b drill ---
  {
    id: 'use-drill-tres2b',
    label: 'Tres-2b Drill: Dark Matter',
    time: 5000,
    alwaysKnown: true,
    ingredients: [
      { match: 'drill-tres2b', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'dark-matter-chunk' }],
  },

  // --- Power flower ---
  {
    id: 'use-power-flower',
    label: 'Power Flower: Generate Energy',
    time: 15000,
    alwaysKnown: true,
    ingredients: [
      { match: 'power-flower', consumed: false },
      { match: 'computronium', consumed: false },
    ],
    results: [{ action: 'card', card: 'energy-cell' }],
  },

  // --- Storage crate: expand board space ---
  {
    id: 'build-storage-crate',
    label: 'Storage Crate',
    time: 2000,
    ingredients: [
      { match: 'workbench', consumed: false },
      { match: 'plasteel', consumed: true },
      { match: 'nanocarbon', consumed: true },
    ],
    results: [{ action: 'expand-board', dWidth: 2 * CARD_W, dHeight: CARD_H }],
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

  // --- Medical ---
  {
    id: 'make-band-aid',
    label: 'Band-Aid',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'nanocarbon', consumed: true },
      { match: 'biomass', consumed: true },
    ],
    results: [{ action: 'card', card: 'band-aid' }],
  },
  {
    id: 'make-uni-kit',
    label: 'Uni-Kit',
    time: 5000,
    ingredients: [
      { match: 'workbench', consumed: false },
      { match: 'nanocarbon', consumed: true, count: 2 },
      { match: 'biomass', consumed: true },
    ],
    results: [{ action: 'card', card: 'uni-kit' }],
  },
  {
    id: 'use-band-aid',
    label: 'Stock Band-Aid',
    time: 1000,
    alwaysKnown: true,
    ingredients: [
      { match: 'band-aid', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'equip-band-aid' }],
  },
  {
    id: 'use-uni-kit',
    label: 'Stock Uni-Kit',
    time: 1000,
    alwaysKnown: true,
    ingredients: [
      { match: 'uni-kit', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'equip-uni-kit' }],
  },
  {
    id: 'equip-weapon',
    label: 'Equip Weapon',
    time: 1000,
    alwaysKnown: true,
    ingredients: [
      { match: 'weapon', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'equip-weapon' }],
  },
  {
    id: 'revive-entity',
    label: 'Revive',
    time: 5000,
    ingredients: [
      { match: 'tombstone', consumed: true },
      { match: 'uni-kit', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'revive-unit' }],
  },

  // --- Refinery & Reactor ---
  {
    id: 'build-refinery',
    label: 'Refinery',
    time: 5000,
    ingredients: [
      { match: 'plasteel', consumed: true, count: 3 },
      { match: 'electronics', consumed: true },
      { match: 'energy-cell', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'refinery' }],
  },
  {
    id: 'build-reactor',
    label: 'Reactor',
    time: 5000,
    ingredients: [
      { match: 'computronium', consumed: true },
      { match: 'plasteel', consumed: true },
      { match: 'nanocarbon', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'reactor' }],
  },

  // --- Advanced resources ---
  {
    id: 'make-unobtainium',
    label: 'Unobtainium',
    time: 5000,
    ingredients: [
      { match: 'refinery', consumed: false },
      { match: 'helium3', consumed: true, count: 3 },
    ],
    results: [{ action: 'card', card: 'unobtainium' }],
  },
  {
    id: 'make-wishalloy',
    label: 'Wishalloy',
    time: 5000,
    ingredients: [
      { match: 'reactor', consumed: false },
      { match: 'unobtainium', consumed: true },
      { match: 'computronium', consumed: true },
    ],
    results: [{ action: 'card', card: 'wishalloy' }],
  },

  // --- Build training stations ---
  {
    id: 'build-train-st',
    label: 'Strength Station',
    time: 10000,
    ingredients: [
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'plasteel', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'train-st' }],
  },
  {
    id: 'build-train-ag',
    label: 'Agility Station',
    time: 10000,
    ingredients: [
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'electronics', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'train-ag' }],
  },
  {
    id: 'build-train-en',
    label: 'Endurance Station',
    time: 10000,
    ingredients: [
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'biomass', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'train-en' }],
  },
  {
    id: 'build-train-in',
    label: 'Intelligence Station',
    time: 10000,
    ingredients: [
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'computronium', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'train-in' }],
  },
  {
    id: 'build-train-lk',
    label: 'Luck Station',
    time: 10000,
    ingredients: [
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'wishalloy', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'train-lk' }],
  },
  {
    id: 'build-train-pe',
    label: 'Perception Station',
    time: 10000,
    ingredients: [
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'unobtainium', consumed: true },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'train-pe' }],
  },

  // --- Use training stations ---
  {
    id: 'use-train-st',
    label: 'Train Strength',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'train-st', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'train-stat', stat: 'strength', amount: 1 }],
  },
  {
    id: 'use-train-ag',
    label: 'Train Agility',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'train-ag', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'train-stat', stat: 'agility', amount: 1 }],
  },
  {
    id: 'use-train-en',
    label: 'Train Endurance',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'train-en', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'train-stat', stat: 'endurance', amount: 1 }],
  },
  {
    id: 'use-train-in',
    label: 'Train Intelligence',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'train-in', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'train-stat', stat: 'intelligence', amount: 1 }],
  },
  {
    id: 'use-train-lk',
    label: 'Train Luck',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'train-lk', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'train-stat', stat: 'luck', amount: 1 }],
  },
  {
    id: 'use-train-pe',
    label: 'Train Perception',
    time: 2000,
    alwaysKnown: true,
    ingredients: [
      { match: 'train-pe', consumed: false },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'train-stat', stat: 'perception', amount: 1 }],
  },

  // --- Cloning ---
  {
    id: 'clone-astronaut',
    label: 'Clone Astronaut',
    time: 10000,
    ingredients: [
      { match: 'cloning-chamber', consumed: false },
      { match: 'astronaut', consumed: false },
      { match: 'biomass', consumed: true, count: 2 },
    ],
    results: [{ action: 'card', card: 'astronaut' }],
  },

  // --- Weapons ---
  {
    id: 'make-blaster',
    label: 'Make Blaster',
    time: 8000,
    ingredients: [
      { match: 'workbench', consumed: false },
      { match: 'electronics', consumed: true },
      { match: 'plasteel', consumed: true, count: 2 },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'blaster' }],
  },
  {
    id: 'make-bolter',
    label: 'Make Bolter',
    time: 10000,
    ingredients: [
      { match: 'workbench', consumed: false },
      { match: 'electronics', consumed: true },
      { match: 'plasteel', consumed: true, count: 4 },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'bolter' }],
  },
  {
    id: 'make-bolter-heavy',
    label: 'Make Heavy Bolter',
    time: 15000,
    ingredients: [
      { match: 'adv-workbench', consumed: false },
      { match: 'electronics', consumed: true, count: 2 },
      { match: 'nanocarbon', consumed: true, count: 4 },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'bolter-heavy' }],
  },
  {
    id: 'make-minigun',
    label: 'Make Minigun',
    time: 20000,
    ingredients: [
      { match: 'adv-workbench', consumed: false },
      { match: 'electronics', consumed: true, count: 3 },
      { match: 'nanocarbon', consumed: true, count: 6 },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'minigun' }],
  },
  {
    id: 'make-laser-cannon',
    label: 'Make Laser Cannon',
    time: 30000,
    ingredients: [
      { match: 'adv-workbench', consumed: false },
      { match: 'computronium', consumed: true },
      { match: 'electronics', consumed: true, count: 4 },
      { match: 'nanocarbon', consumed: true, count: 8 },
      { match: 'people', consumed: false },
    ],
    results: [{ action: 'card', card: 'laser-cannon' }],
  },

  // --- Invasions ---
  {
    id: 'invasion-bacteria-trigger',
    label: 'Bacteria Swarm!',
    time: 45000, // 45-second warning countdown
    ingredients: [{ match: 'invasion-bacteria', consumed: true }],
    results: [{ action: 'spawn-enemies', enemyType: 'bacteria', count: 4 }],
    alwaysKnown: true,
  },
  {
    id: 'invasion-space-mouse-trigger',
    label: 'Space Mouse Pack!',
    time: 45000,
    ingredients: [{ match: 'invasion-space-mouse', consumed: true }],
    results: [{ action: 'spawn-enemies', enemyType: 'space-mouse', count: 3 }],
    alwaysKnown: true,
  },
] satisfies Recipe[];
