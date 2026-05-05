## Parent PRD

`issues/prd.md`

## What to build

Re-enable and complete the full mid-game milestone chain. Many milestones are commented out in `milestones.ts`; this issue wires them all up per the table in GAME-DESIGN.md.

Two milestones — build-rover and make-wishalloy — show a visible player notification. All others unlock silently. Training stations are wired into the chain at the correct tiers.

| Station                      | Unlocks at    |
| ---------------------------- | ------------- |
| train-st, train-ag, train-en | adv-workbench |
| train-in                     | computronium  |
| train-pe                     | unobtainium   |
| train-lk                     | wishalloy     |

## Acceptance criteria

- [x] All milestones from the GAME-DESIGN.md table are active (none commented out)
- [x] Building the rover shows a visible milestone notification
- [x] Crafting wishalloy shows a visible milestone notification
- [x] All 6 training stations become available at the correct milestone tier
- [x] No recipes are visible before their milestone trigger fires
- [x] Early-game tutorial flow (crust → solar → foundation → drone → workbench → electronics → bacteria) is unaffected

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1
- User story 2
- User story 29
