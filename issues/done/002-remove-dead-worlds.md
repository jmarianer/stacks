## Parent PRD

`issues/prd.md`

## What to build

Remove the Desert, Snow, and Flowers boards from the game. These are artifacts of a previous design direction and have no defined purpose in the current game arc.

Delete all board definitions, card references, recipes, and milestone conditions that reference these three worlds. Verify nothing else references them before deleting.

## Acceptance criteria

- [x] Desert, Snow, and Flowers boards no longer appear in the board list
- [x] No orphaned card definitions, recipes, or milestone conditions reference these worlds
- [x] The game starts and runs without errors after removal
- [x] No other boards or features are broken

## Blocked by

None — can start immediately.

## User stories addressed

None directly — this is cleanup that reduces scope and dead code.
