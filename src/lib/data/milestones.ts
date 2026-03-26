import type { Milestone } from '$lib/types/milestone-types';

export const MILESTONES: Milestone[] = [
  {
    id: 'solar-panel',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'plasteel')),
    unlockRecipeIds: ['build-solar-panel'],
    createCards: [],
  },
  {
    id: 'foundation',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'solar-panel')),
    unlockRecipeIds: ['build-foundation'],
    createCards: [],
  },
  {
    id: 'service-drone',
    condition: (b) =>
      b.stacks.some((s) => s.cards.some((c) => c.type === 'solar-panel')) &&
      b.stacks.some((s) => s.cards.some((c) => c.type === 'nanocarbon')),
    unlockRecipeIds: ['make-service-drone'],
    createCards: [],
  },
  {
    id: 'bacteria-invasion',
    condition: (b, clock) =>
      clock.sol >= 4 &&
      b.stacks.some((s) =>
        s.cards.some((c) => c.type === 'astronaut' && (c.weaponInventory?.length ?? 0) > 0),
      ),
    unlockRecipeIds: [],
    createCards: ['invasion-bacteria'],
  },
  {
    id: 'post-invasion',
    condition: (b) =>
      b.firedMilestones.includes('bacteria-invasion') &&
      !b.stacks.some((s) =>
        s.cards.some((c) => c.type === 'invasion-bacteria' || c.type === 'bacteria'),
      ),
    unlockRecipeIds: ['build-train-st', 'build-train-en', 'make-uni-kit', 'build-drill'],
    createCards: [],
  },
  {
    id: 'workbench',
    condition: (b) =>
      b.stacks.some((s) => s.cards.some((c) => c.type === 'service-drone-1')) &&
      b.stacks.flatMap((s) => s.cards).filter((c) => c.type === 'plasteel').length >= 3,
    unlockRecipeIds: ['build-workbench'],
    createCards: [],
  },
  {
    id: 'first-workbench',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'workbench')),
    unlockRecipeIds: ['make-electronics', 'build-storage-crate'],
    createCards: [],
  },
  {
    id: 'first-electronics',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'electronics')),
    unlockRecipeIds: ['make-blaster'],
    createCards: [],
  },
  {
    id: 'first-drill',
    condition: (b) => b.stacks.some((s) => s.cards.some((c) => c.type === 'drill')),
    unlockRecipeIds: ['build-adv-workbench', 'build-rover', 'make-bolter'],
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
