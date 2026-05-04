## Parent PRD

`issues/prd.md`

## What to build

Implement Planet 4 (Empire) as a complete end-to-end vertical slice. This planet switches from rover discovery to computer research.

**Discovery**: computer research recipe — `computer + astronaut + Inferno Core Sample` — ~1 minute cook time, produces an Empire discovery card. The core sample is consumed. Battlebots are de facto required here (tuned hard enough that players discover this through failure, not a hard gate).

**Board**: new Empire board.

**Miniboss**: regenerates HP continuously using the mechanic from `issues/006-combat-regeneration.md`. Must be burst down. This is the first planet where battlebots are essentially necessary.

**Core sample**: "Empire Core Sample" produced by the drill on the Empire board. Used in the Planet 5 computer recipe and the controller building recipe.

## Acceptance criteria

- [ ] Computer research recipe requires an Inferno Core Sample and consumes it
- [ ] Recipe is available on the computer building after Inferno has been visited
- [ ] Empire board is accessible after discovery
- [ ] Miniboss regenerates HP during combat
- [ ] Defeating the miniboss places an immobile Empire Dial Part on the board
- [ ] Drilling on the Empire board produces Empire Core Samples

## Blocked by

- Blocked by `issues/011-planet-3-inferno.md`
- Blocked by `issues/006-combat-regeneration.md`
- Blocked by `issues/008-computer-building.md`

## User stories addressed

- User story 18
- User story 22
- User story 23
- User story 30
