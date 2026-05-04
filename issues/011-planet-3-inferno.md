## Parent PRD

`issues/prd.md`

## What to build

Implement Planet 3 (Inferno) as a complete end-to-end vertical slice.

**Discovery**: rover expedition recipe — `rover + astronaut/drone + Factory Core Sample` — with a small probability of producing an Inferno discovery card. The core sample is consumed.

**Board**: new Inferno board.

**Miniboss**: uses the phase-transition mechanic from `issues/005-combat-phase-transition.md` — switches to a faster/stronger profile at 50% HP. Tuned harder than Planet 2.

**Core sample**: "Inferno Core Sample" produced by the drill on the Inferno board. Used in the Planet 4 computer recipe and the controller building recipe.

## Acceptance criteria

- [ ] Rover recipe requires a Factory Core Sample and consumes it on use
- [ ] Inferno board is accessible after discovery
- [ ] Miniboss fires a phase transition at 50% HP (faster + stronger)
- [ ] Defeating the miniboss places an immobile Inferno Dial Part on the board
- [ ] Drilling on the Inferno board produces Inferno Core Samples

## Blocked by

- Blocked by `issues/010-planet-2-factory.md`
- Blocked by `issues/005-combat-phase-transition.md`

## User stories addressed

- User story 12
- User story 15
- User story 16
- User story 17
- User story 22
- User story 23
