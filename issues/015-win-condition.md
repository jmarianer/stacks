## Parent PRD

`issues/prd.md`

## What to build

Implement the win condition: a cross-board state monitor that watches all five dial part buildings and the controller simultaneously, runs a 1-sol countdown when all six are staffed, and fires a credits screen when the countdown completes.

**Mechanic**: the player stacks an astronaut on the controller (home base) and on each of the five dial parts (one per planet). When all six are simultaneously staffed, a 1-sol countdown begins. If any astronaut is removed from any of the six buildings at any point, the countdown resets to zero. When the countdown completes without interruption, the win condition fires and credits roll.

**Implementation note**: the monitor is a new module that reads cross-board state on each game tick. Design it as a pure function (game state in → countdown progress out) so it can be unit-tested without a running game. No sync signal cards needed.

## Acceptance criteria

- [ ] Win countdown does not start until all 6 buildings (5 dial parts + controller) simultaneously have an astronaut
- [ ] Countdown progress is visible to the player (some UI indication)
- [ ] Removing any astronaut from any of the 6 buildings resets the countdown to zero
- [ ] After 1 sol of uninterrupted simultaneous staffing, the win condition fires
- [ ] Credits screen (or win screen) is shown on win — game ends
- [ ] Win condition monitor is covered by unit tests: countdown starts, countdown resets on removal, countdown completes

## Blocked by

- Blocked by `issues/014-controller-building.md`

## User stories addressed

- User story 26
- User story 27
- User story 28
