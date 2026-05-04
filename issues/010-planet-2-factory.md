## Parent PRD

`issues/prd.md`

## What to build

Implement Planet 2 (Factory) as a complete end-to-end vertical slice.

**Discovery**: rover expedition recipe — `rover + astronaut/drone + Radar Station Core Sample` — with a small probability of producing a Factory discovery card. The core sample is consumed by the recipe.

**Board**: new Factory board.

**Miniboss**: spawns additional enemy units during the fight (adds). Tuned harder than Planet 1.

**Core sample**: "Factory Core Sample" produced by the drill on the Factory board. Used in the Planet 3 rover recipe and the controller building recipe.

## Acceptance criteria

- [ ] Rover recipe requires a Radar Station Core Sample and consumes it on use
- [ ] Recipe is only available after Radar Station has been discovered (or the core sample is naturally gated by needing to visit that board)
- [ ] Factory board is accessible after discovery
- [ ] Miniboss spawns adds during combat
- [ ] Defeating the miniboss places an immobile Factory Dial Part on the board
- [ ] Drilling on the Factory board produces Factory Core Samples

## Blocked by

- Blocked by `issues/009-planet-1-radar-station.md`

## User stories addressed

- User story 12
- User story 15
- User story 16
- User story 17
- User story 22
- User story 23
