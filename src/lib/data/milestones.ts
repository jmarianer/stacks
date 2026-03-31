import type { Milestone } from '$lib/types/milestone-types';

const hasCard = (boards: Parameters<Milestone['condition']>[0], type: string) =>
  boards.some((b) => b.stacks.some((s) => s.cards.some((c) => c.type === type)));

export const MILESTONES: Milestone[] = [
  {
    id: 'solar-panel',
    condition: (boards) => hasCard(boards, 'plasteel'),
    unlockRecipeIds: ['build-solar-panel'],
    createCards: [],
  },
  {
    id: 'foundation',
    condition: (boards) => hasCard(boards, 'solar-panel'),
    unlockRecipeIds: ['build-foundation'],
    createCards: [],
  },
  {
    id: 'service-drone',
    condition: (boards) => hasCard(boards, 'solar-panel') && hasCard(boards, 'nanocarbon'),
    unlockRecipeIds: ['make-service-drone'],
    createCards: [],
  },
  {
    id: 'bacteria-invasion',
    condition: (boards, clock) =>
      clock.sol >= 4 &&
      boards.some((b) =>
        b.stacks.some((s) =>
          s.cards.some((c) => c.type === 'astronaut' && (c.weaponInventory?.length ?? 0) > 0),
        ),
      ),
    unlockRecipeIds: [],
    createCards: ['invasion-bacteria'],
  },
  {
    id: 'post-invasion',
    condition: (boards, clock) =>
      clock.firedMilestones.includes('bacteria-invasion') &&
      !hasCard(boards, 'invasion-bacteria') &&
      !hasCard(boards, 'bacteria'),
    unlockRecipeIds: ['build-train-st', 'build-train-en', 'make-uni-kit', 'build-drill'],
    createCards: [],
  },
  {
    id: 'workbench',
    condition: (boards) =>
      hasCard(boards, 'service-drone-1') &&
      boards.flatMap((b) => b.stacks.flatMap((s) => s.cards)).filter((c) => c.type === 'plasteel')
        .length >= 3,
    unlockRecipeIds: ['build-workbench'],
    createCards: [],
  },
  {
    id: 'first-workbench',
    condition: (boards) => hasCard(boards, 'workbench'),
    unlockRecipeIds: ['make-electronics', 'build-storage-crate'],
    createCards: [],
  },
  {
    id: 'first-electronics',
    condition: (boards) => hasCard(boards, 'electronics'),
    unlockRecipeIds: ['make-blaster'],
    createCards: [],
  },
  {
    id: 'first-drill',
    condition: (boards) => hasCard(boards, 'drill'),
    unlockRecipeIds: ['build-adv-workbench', 'build-rover', 'make-bolter'],
    createCards: [],
  },
  {
    id: 'first-adv-workbench',
    condition: (boards) => hasCard(boards, 'adv-workbench'),
    unlockRecipeIds: [
      'build-power-station',
      'make-computronium',
      'build-refinery',
      'make-bolter-heavy',
      'make-minigun',
    ],
    createCards: [],
  },
  {
    id: 'first-power-station',
    condition: (boards) => hasCard(boards, 'power-station'),
    unlockRecipeIds: ['build-cloning-chamber'],
    createCards: [],
  },
  {
    id: 'first-uni-kit',
    condition: (boards) => hasCard(boards, 'uni-kit'),
    unlockRecipeIds: ['revive-entity'],
    createCards: [],
  },
  {
    id: 'first-cloning-chamber',
    condition: (boards) => hasCard(boards, 'cloning-chamber'),
    unlockRecipeIds: ['clone-astronaut'],
    createCards: [],
  },
  {
    id: 'first-computronium',
    condition: (boards) => hasCard(boards, 'computronium'),
    unlockRecipeIds: ['build-train-in', 'make-laser-cannon'],
    createCards: [],
  },
  {
    id: 'first-unobtanium',
    condition: (boards) => hasCard(boards, 'unobtanium'),
    unlockRecipeIds: ['build-reactor'],
    createCards: [],
  },
  {
    id: 'first-refinery',
    condition: (boards) => hasCard(boards, 'refinery'),
    unlockRecipeIds: ['make-unobtainium'],
    createCards: [],
  },
  {
    id: 'first-reactor',
    condition: (boards) => hasCard(boards, 'reactor'),
    unlockRecipeIds: ['make-wishalloy'],
    createCards: [],
  },
  {
    id: 'first-unobtainium',
    condition: (boards) => hasCard(boards, 'unobtainium'),
    unlockRecipeIds: ['build-train-pe'],
    createCards: [],
  },
  {
    id: 'first-wishalloy',
    condition: (boards) => hasCard(boards, 'wishalloy'),
    unlockRecipeIds: ['build-train-lk'],
    createCards: [],
  },
];
