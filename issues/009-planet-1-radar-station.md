## Parent PRD

`issues/prd.md`

## What to build

Implement Planet 1 (Radar Station) as a complete end-to-end vertical slice: discoverable, fightable, and drillable.

**Discovery**: new rover expedition recipe — `rover + astronaut/drone` — with a small probability (~10%) of producing a Radar Station discovery card. Other outcomes: alien attack or nothing. The rover and astronaut/drone are tied up for 1–2 sols (same timer pattern as the drill).

**Board**: new Radar Station board. The player can teleport there after discovery.

**Miniboss**: tanky + slow stat profile (no special mechanic beyond stats). Defeating it places an immobile Radar Station Dial Part building permanently on the board.

**Core sample**: a "Radar Station Core Sample" resource, produced by the drill on the Radar Station board. Used as an ingredient in the Planet 2 rover recipe (see `issues/010-planet-2-factory.md`) and the controller building recipe (see `issues/014-controller-building.md`).

## Acceptance criteria

- [ ] Rover expedition recipe exists and is unlocked after the rover milestone
- [ ] Sending rover + astronaut/drone has a ~10% chance of discovering Radar Station
- [ ] Radar Station board is accessible after discovery
- [ ] Miniboss spawns on the Radar Station board and fights as a tanky/slow enemy
- [ ] Defeating the miniboss places an immobile Radar Station Dial Part on that board
- [ ] Drilling on the Radar Station board produces Radar Station Core Samples
- [ ] Two rovers running in parallel each independently roll for discovery

## Blocked by

- Blocked by `issues/001-milestone-chain.md`

## User stories addressed

- User story 12
- User story 13
- User story 14
- User story 15
- User story 16
- User story 17
- User story 22
- User story 23
