import type { Milestone } from '$lib/types/milestone-types';

export const MILESTONES: Milestone[] = [
  {
    id: 'first-plasteel',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'plasteel')),
    unlockRecipeIds: ['build-solar-panel'],
    createCards: [],
  },
  {
    id: 'sol-2',
    condition: (_b, clock) => clock.sol >= 2,
    unlockRecipeIds: ['make-service-drone'],
    createCards: [],
  },
  {
    id: 'sol-4',
    condition: (_b, clock) => clock.sol >= 4,
    unlockRecipeIds: [],
    createCards: ['invasion-bacteria'],
  },
  {
    id: 'sol-7',
    condition: (_b, clock) => clock.sol >= 7,
    unlockRecipeIds: [],
    createCards: ['invasion-space-mouse'],
  },
  {
    id: 'three-plasteel-sol-3',
    condition: (b, clock) =>
      clock.sol >= 3 &&
      b.stacks.flatMap((s) => s.cards).filter((c) => c.type === 'plasteel').length >= 3,
    unlockRecipeIds: ['build-workbench'],
    createCards: [],
  },
  {
    id: 'first-workbench',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'workbench')),
    unlockRecipeIds: [
      'make-electronics',
      'build-foundation',
      'build-storage-crate',
      'build-train-st',
      'build-train-en',
      'make-uni-kit',
    ],
    createCards: [],
  },
  {
    id: 'first-electronics',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'electronics')),
    unlockRecipeIds: [
      'build-drill',
      'build-train-ag',
      'build-refinery',
      'make-blaster',
      'make-bolter',
    ],
    createCards: [],
  },
  {
    id: 'first-drill',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'drill')),
    unlockRecipeIds: ['build-adv-workbench', 'build-rover'],
    createCards: [],
  },
  {
    id: 'first-adv-workbench',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'adv-workbench')),
    unlockRecipeIds: [
      'build-power-station',
      'make-computronium',
      'build-reactor',
      'make-bolter-heavy',
      'make-minigun',
    ],
    createCards: [],
  },
  {
    id: 'first-power-station',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'power-station')),
    unlockRecipeIds: ['build-cloning-chamber'],
    createCards: [],
  },
  {
    id: 'first-uni-kit',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'uni-kit')),
    unlockRecipeIds: ['revive-entity'],
    createCards: [],
  },
  {
    id: 'first-cloning-chamber',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'cloning-chamber')),
    unlockRecipeIds: ['clone-astronaut'],
    createCards: [],
  },
  {
    id: 'first-computronium',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'computronium')),
    unlockRecipeIds: ['build-train-in', 'make-laser-cannon'],
    createCards: [],
  },
  {
    id: 'first-refinery',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'refinery')),
    unlockRecipeIds: ['make-unobtainium'],
    createCards: [],
  },
  {
    id: 'first-reactor',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'reactor')),
    unlockRecipeIds: ['make-wishalloy'],
    createCards: [],
  },
  {
    id: 'first-unobtainium',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'unobtainium')),
    unlockRecipeIds: ['build-train-pe'],
    createCards: [],
  },
  {
    id: 'first-wishalloy',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'wishalloy')),
    unlockRecipeIds: ['build-train-lk'],
    createCards: [],
  },
];
