## Parent PRD

`issues/prd.md`

## What to build

Implement Planet 5 (Alien Lair) as a complete end-to-end vertical slice. This is the final planet and the hardest encounter in the game.

**Discovery**: computer research recipe — `computer + astronaut + Empire Core Sample` — ~1 minute cook time, produces an Alien Lair discovery card. The core sample is consumed.

**Board**: new Alien Lair board.

**Miniboss**: combines spawns-adds and phase-transition mechanics. At 50% HP it transitions to a faster/stronger profile and may spawn more adds. Battlebots are de facto required.

**Core sample**: "Alien Lair Core Sample" produced by the drill on the Alien Lair board. Used in the controller building recipe.

## Acceptance criteria

- [ ] Computer research recipe requires an Empire Core Sample and consumes it
- [ ] Alien Lair board is accessible after discovery
- [ ] Miniboss spawns adds during combat
- [ ] Miniboss fires a phase transition at 50% HP
- [ ] Defeating the miniboss places an immobile Alien Lair Dial Part on the board
- [ ] Drilling on the Alien Lair board produces Alien Lair Core Samples

## Blocked by

- Blocked by `issues/012-planet-4-empire.md`

## User stories addressed

- User story 18
- User story 22
- User story 23
- User story 30
