import type { Milestone } from '$lib/types/milestone-types';
import type { Board } from '$lib/types/game-state';

const hasCard = (boards: Board[], type: string) =>
  boards.some((b) => b.stacks.some((s) => s.cards.some((c) => c.type === type)));

const countCards = (boards: Board[], type: string) =>
  boards.flatMap((b) => b.stacks.flatMap((s) => s.cards)).filter((c) => c.type === type).length;

export const MILESTONES: Milestone[] = [
  {
    id: 'solar-panel',
    title: 'Punch a crust chunk',
    condition: ({ usedRecipeIds }) => usedRecipeIds.includes('punch-crust-chunk'),
    unlockRecipeIds: ['build-solar-panel'],
  },
  {
    id: 'first-solar-panel',
    title: 'Build solar panel',
    condition: ({ boards }) => hasCard(boards, 'solar-panel'),
  },
  {
    id: 'foundation',
    title: 'Use solar panel to generate energy',
    condition: ({ usedRecipeIds }) => usedRecipeIds.includes('solar-panel-generate'),
    unlockRecipeIds: ['build-foundation'],
  },
  {
    id: 'service-drone',
    title: 'Mine crust chunk with pickaxe',
    condition: ({ usedRecipeIds }) => usedRecipeIds.includes('mine-crust-chunk'),
    unlockRecipeIds: ['make-service-drone'],
  },
  {
    id: 'two-foundations',
    title: 'Build two foundations',
    condition: ({ boards }) => countCards(boards, 'foundation') >= 2,
  },
  {
    id: 'foundation-route',
    title: 'Route between foundations',
    condition: ({ boards }) =>
      boards.some((b) => {
        const foundationStackIds = new Set(
          b.stacks.filter((s) => s.cards.some((c) => c.type === 'foundation')).map((s) => s.id),
        );
        return b.connections.some(
          (conn) => foundationStackIds.has(conn.fromId) && foundationStackIds.has(conn.toId),
        );
      }),
    unlockRecipeIds: ['make-multi-cell', 'make-mega-cell'],
  },
  {
    id: 'workbench',
    title: 'Build a service drone',
    condition: ({ boards }) => hasCard(boards, 'service-drone-1'),
    unlockRecipeIds: ['build-workbench'],
  },
  {
    id: 'first-workbench',
    title: 'Build a workbench',
    condition: ({ boards }) => hasCard(boards, 'workbench'),
    unlockRecipeIds: ['make-electronics', 'build-storage-crate'],
  },
  {
    id: 'first-electronics',
    title: 'Construct electronics',
    condition: ({ boards }) => hasCard(boards, 'electronics'),
    unlockRecipeIds: ['make-blaster'],
  },
  {
    id: 'bacteria-invasion',
    title: 'Equip astronaut with weapon',
    condition: ({ boards, clock }) =>
      clock.sol >= 4 &&
      boards.some((b) =>
        b.stacks.some((s) =>
          s.cards.some((c) => c.type === 'astronaut' && (c.weaponInventory?.length ?? 0) > 0),
        ),
      ),
    createCards: ['invasion-bacteria'],
  },
  {
    id: 'post-invasion',
    title: 'Kill bacteria',
    condition: ({ boards, clock }) =>
      clock.firedMilestones.includes('bacteria-invasion') &&
      !hasCard(boards, 'invasion-bacteria') &&
      !hasCard(boards, 'bacteria'),
    unlockRecipeIds: ['make-band-aid', 'build-drill'],
  },
  {
    id: 'first-drill',
    title: 'Build a drill',
    condition: ({ boards }) => hasCard(boards, 'drill'),
    unlockRecipeIds: ['build-adv-workbench', 'build-rover', 'build-cloning-chamber', 'make-bolter'],
  },
  {
    id: 'first-cloning-chamber',
    title: 'Build a cloning chamber',
    condition: ({ boards }) => hasCard(boards, 'cloning-chamber'),
    unlockRecipeIds: ['clone-astronaut'],
  },
  {
    id: 'first-adv-workbench',
    title: 'Build advanced workbench',
    condition: ({ boards }) => hasCard(boards, 'adv-workbench'),
    unlockRecipeIds: [
      'make-computronium',
      'make-bolter-heavy',
      'make-minigun',
      'build-train-st',
      'build-train-ag',
      'build-train-en',
    ],
  },
  {
    id: 'build-rover',
    title: 'Build a rover',
    condition: ({ boards }) => hasCard(boards, 'rover'),
    notification: 'Rover ready for expedition!',
  },
  {
    id: 'first-computronium',
    title: 'Make computronium',
    condition: ({ boards }) => hasCard(boards, 'computronium'),
    unlockRecipeIds: [
      'build-refinery',
      'build-reactor',
      'build-power-station',
      'make-laser-cannon',
      'build-train-in',
    ],
  },
  {
    id: 'first-refinery',
    title: 'Build a refinery',
    condition: ({ boards }) => hasCard(boards, 'refinery'),
    unlockRecipeIds: ['make-unobtainium'],
  },
  {
    id: 'first-unobtainium',
    title: 'Make unobtainium',
    condition: ({ boards }) => hasCard(boards, 'unobtainium'),
    unlockRecipeIds: ['make-wishalloy', 'build-train-pe'],
  },
  {
    id: 'first-wishalloy',
    title: 'Make wishalloy',
    condition: ({ boards }) => hasCard(boards, 'wishalloy'),
    notification: 'Wishalloy forged!',
    unlockRecipeIds: ['build-train-lk'],
  },
  {
    id: 'first-uni-kit',
    title: 'Make a uni-kit',
    condition: ({ boards }) => hasCard(boards, 'uni-kit'),
    unlockRecipeIds: ['revive-entity'],
  },
];
