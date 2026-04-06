import type { Board } from '$lib/types/game-state';
import { makeBoard, makeStack } from '$lib/utils/card-factories';

/** Recipe IDs known at the start of a new game. */
export const initialKnownRecipeIds: string[] = [
  'punch-crust-chunk',
  'mine-crust-chunk',
  'punch-plasteel-deposit',
  'punch-fossil-regolith',
  'make-energy-cell',
  'make-multi-cell',
  'make-mega-cell',
];

export const initialBoards: Board[] = [
  makeBoard(
    'Base',
    [
      makeStack({ x: 20, y: 42 }, ['astronaut']),
      makeStack({ x: 44, y: 42 }, ['pickaxe']),
      makeStack({ x: 68, y: 42 }, ['crust-chunk', 'crust-chunk', 'crust-chunk', 'crust-chunk']),
      makeStack({ x: 116, y: 42 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
    0,
    [],
    true, // discovered
  ),
  makeBoard(
    'Alien Eggs',
    [
      makeStack({ x: 68, y: 20 }, ['alien-eggs']),
      makeStack({ x: 92, y: 20 }, ['alien-eggs']),
      makeStack({ x: 116, y: 20 }, ['alien-eggs']),
      makeStack({ x: 68, y: 64 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
  ),
  makeBoard(
    'Desert',
    [
      makeStack({ x: 68, y: 20 }, ['cactus']),
      makeStack({ x: 92, y: 20 }, ['cactus']),
      makeStack({ x: 116, y: 20 }, ['cactus']),
      makeStack({ x: 68, y: 64 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
  ),
  makeBoard(
    'Snow',
    [
      makeStack({ x: 68, y: 20 }, ['snow-converter']),
      makeStack({ x: 92, y: 20 }, ['snow-pile']),
      makeStack({ x: 116, y: 20 }, ['snow-pile']),
      makeStack({ x: 68, y: 64 }, ['snow-pile', 'snow-pile']),
      makeStack({ x: 92, y: 64 }, ['snow-pile', 'snow-pile']),
      makeStack({ x: 116, y: 64 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
  ),
  makeBoard(
    'Tres-2b',
    [
      makeStack({ x: 80, y: 42 }, ['drill-tres2b']),
      makeStack({ x: 128, y: 42 }, ['energy-cell', 'energy-cell', 'energy-cell']),
    ],
    176,
    112,
  ),
  makeBoard(
    'Flowers',
    [
      makeStack({ x: 56, y: 20 }, ['power-flower']),
      makeStack({ x: 80, y: 20 }, ['power-flower']),
      makeStack({ x: 104, y: 20 }, ['power-flower']),
      makeStack({ x: 128, y: 20 }, ['power-flower']),
      makeStack({ x: 56, y: 64 }, ['power-flower']),
      makeStack({ x: 80, y: 64 }, ['power-flower']),
      makeStack({ x: 104, y: 64 }, ['energy-cell', 'energy-cell']),
    ],
    176,
    112,
  ),
];
