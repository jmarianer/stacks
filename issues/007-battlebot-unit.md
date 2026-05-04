## Parent PRD

`issues/prd.md`

## What to build

Add the battlebot as a new player unit type. Battlebots are combat-only — high combat stats, unable to perform any non-combat actions (no mining, crust punching, building, etc.). They are the combat mirror of service drones. One tier only; no training; no Mark II.

- **Recipe**: manual, crafted at the advanced workbench. Unlocked at the wishalloy milestone.
- **Energy**: consumes energy at the same rate as an astronaut.
- **Death**: card is removed on death (may drop some constituent materials — exact drop TBD at implementation).

## Acceptance criteria

- [ ] Battlebot card exists with appropriate combat stats (tuned to be strong fighters)
- [ ] Battlebot cannot be assigned to non-combat actions (mining, punching, building, etc.)
- [ ] Battlebot recipe is available at the advanced workbench after wishalloy milestone fires
- [ ] Battlebot consumes energy each sol like an astronaut
- [ ] Battlebot is removed from the board on death
- [ ] Player can send any mix of astronauts and battlebots into combat

## Blocked by

- Blocked by `issues/001-milestone-chain.md`

## User stories addressed

- User story 19
- User story 20
- User story 21
