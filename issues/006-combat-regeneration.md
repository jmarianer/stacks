## Parent PRD

`issues/prd.md`

## What to build

Add support for HP regeneration on enemy units. A regenerating enemy recovers HP each combat tick, requiring the player to burst it down faster than it heals. This mechanic is used by the Planet 4 (Empire) miniboss.

Note: check whether any form of unit regeneration already exists in `combat.ts` before implementing from scratch.

## Acceptance criteria

- [ ] An enemy definition can specify an HP regeneration rate (HP per tick)
- [ ] A regenerating enemy recovers HP continuously during combat
- [ ] Regeneration does not allow HP to exceed the enemy's maximum
- [ ] Enemies without a regeneration rate are unaffected
- [ ] The existing combat system is unaffected

## Blocked by

None — can start immediately.

## User stories addressed

- User story 22
