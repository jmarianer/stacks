# PRD: Stacks — Mid-Game Through Win Condition

## Problem Statement

The game has a working early-game tutorial loop (punch crust → solar panel → foundation → drone → workbench → electronics → blaster → bacteria invasion) but no path to a win condition. The mid-game milestone chain exists in code but is largely commented out, and the late-game content (rover expeditions, battlebots, dial-part planets, and the win condition) does not exist yet. Players have no endgame goal.

## Solution

Complete the game from mid-game through a hard win condition. The mid-game introduces the rover, advanced workbench, computronium chain, and battlebots. The late game sends the player to five distinct planets to collect dial parts. The win condition fires when the player simultaneously staffs a controller building and all five dial parts with astronauts for one full sol.

## User Stories

1. As a player, I want the milestone chain to progressively unlock new recipes, so that I am not overwhelmed with options at the start.
2. As a player, I want visible milestone notifications for major unlocks (rover, wishalloy), so that I feel a sense of progression.
3. As a player, I want to build an advanced workbench, so that I can access mid-game crafting recipes.
4. As a player, I want to build a rover, so that I can send it on planetary expeditions.
5. As a player, I want to build a cloning chamber, so that I can clone astronauts and grow my crew.
6. As a player, I want to build a refinery, so that I can produce unobtainium.
7. As a player, I want to build a reactor and power station, so that I can support advanced buildings.
8. As a player, I want to build a computer, so that I can research distant planets.
9. As a player, I want to craft computronium at the advanced workbench, so that I can unlock the late-game tech chain.
10. As a player, I want to craft unobtainium at the refinery, so that I can unlock wishalloy.
11. As a player, I want to craft wishalloy, so that I can unlock battlebots and the final training station.
12. As a player, I want to send my rover on an expedition (staffed by an astronaut or service drone), so that it has a chance of discovering a new planet.
13. As a player, I want the rover expedition to feel like the drill — a probabilistic timer recipe — so that the mechanic is familiar.
14. As a player, I want to run two rovers in parallel, so that I can discover planets faster.
15. As a player, I want planet discovery to be sequential, so that I never encounter a planet I am not ready for.
16. As a player, I want to use a planet's core sample in the next rover recipe, so that discovering planets feels like a chain of consequences.
17. As a player, I want to drill on a discovered planet to extract its core sample, so that I can unlock the next planet in the chain.
18. As a player, I want to use the computer building to research planets 4 and 5 (using the previous planet's core sample), so that the discovery mechanic scales with the difficulty of the later planets.
19. As a player, I want to build battlebots at the advanced workbench, so that I have powerful combat units for the harder planets.
20. As a player, I want battlebots to be strong fighters but unable to do anything except fight, so that they are a distinct tradeoff from astronauts.
21. As a player, I want battlebots to consume energy, so that I must manage their upkeep.
22. As a player, I want each of the five dial-part planets to have a unique miniboss mechanic, so that each planet feels distinct.
23. As a player, I want to defeat a miniboss to receive a dial part building that is placed permanently on that planet, so that I have a tangible reward for each planet.
24. As a player, I want to craft the controller building from computronium, unobtainium, and the five core samples, so that building it requires visiting all five planets.
25. As a player, I want to place the controller building on my home base, so that it serves as the focal point of the win condition.
26. As a player, I want to see a 1-sol countdown begin when all five dial parts and the controller simultaneously have an astronaut on them, so that I know the win condition is active.
27. As a player, I want the countdown to reset if any astronaut is removed from a dial part or the controller, so that winning requires sustained coordination.
28. As a player, I want to see credits roll when the 1-sol countdown completes, so that the win feels earned and final.
29. As a player, I want all six training stations to unlock progressively through the mid-game, so that I can invest in astronaut stats before tackling harder planets.
30. As a player, I want battlebots to be required in practice (but not hard-gated) for planets 4 and 5, so that I discover the need through failure rather than a tutorial prompt.

## Implementation Decisions

### Milestone Chain

Re-enable and complete the full milestone chain from GAME-DESIGN.md. The two visible milestones (build-rover and make-wishalloy) show a notification. All others unlock silently. The chain is strictly additive — no recipes are removed.

### Rover Expedition Mechanic

Rover expeditions use the existing recipe/timer system (same pattern as the drill). The recipe ties up an astronaut or service drone for 1–2 sols. Output is probabilistic: a chance of a discovery card (new board) for the appropriate next planet, a chance of an alien attack, and a chance of nothing. The rover building stays on the board for the duration; no physical departure mechanic is needed.

Planets are discovered strictly sequentially. The recipe to discover planet N+1 requires the core sample from planet N. Planet 1 has no core sample prerequisite (just rover + astronaut/drone). Planets 2 and 3 also require an astronaut or service drone in addition to the core sample.

Planet 4 and 5 discovery uses the computer building instead of the rover: the recipe is computer + astronaut + the previous planet's core sample, with a ~1-minute cook time producing a discovery card.

### Core Samples

Each of the five planets produces a unique core sample resource when drilled on that planet (e.g., "Radar Station Core Sample"). The existing drill building is used — it is not immobile and can be moved between planets. Core samples serve two purposes: gating the next planet's discovery recipe, and as ingredients in the controller building recipe.

### Computer Building

A new building unlocked at the computronium milestone. Used exclusively for planets 4 and 5 discovery. Consistent with other building unlock patterns.

### Battlebots

A new player unit type. Battlebots are built at the advanced workbench (manual recipe, unlocked at wishalloy). They have high combat stats but cannot perform any non-combat actions (no mining, crust punching, etc.) — the opposite profile of a service drone. They consume energy at the same rate as an astronaut. One tier only. No training. On death, the battlebot card is removed (may drop some constituent materials — exact behavior TBD at implementation). The assembly-line recipe and any Mark II tier are deferred to sequel.

### The Five Dial-Part Planets

Five new boards, each with:

- A miniboss with a unique mechanic (per the table in GAME-DESIGN.md)
- An immobile dial part building placed permanently on that board after the miniboss is defeated
- A drill recipe that produces the planet's unique core sample

Miniboss mechanics:
| Planet | Mechanic |
|---|---|
| Radar Station (1) | Tanky + slow (stat profile only) |
| Factory (2) | Spawns adds |
| Inferno (3) | Phase transition at 50% HP (faster + stronger) |
| Empire (4) | Regenerates — must be burst down |
| Alien Lair (5) | Spawns adds + phase transition |

Battlebots are de facto required for planets 4 and 5 (tuned hard enough that players discover this through failure).

### Win Condition Module

A new cross-board state monitor that checks whether all five dial part buildings and the controller simultaneously have an astronaut stacked on them. When the condition is met, a 1-sol countdown begins. If any astronaut is removed from any of the six buildings at any point, the countdown resets to zero. When the countdown completes, the win condition fires and credits roll. Energy megacells are not required (can be revisited if the win condition proves too easy).

The controller building recipe: 3 computronium + 3 unobtainium + 1 of each of the five core samples. It is crafted (not discovered), so once the player has visited all five planets the recipe becomes satisfiable.

### Training Stations

All six training stations are already implemented. They need to be wired into the milestone chain per GAME-DESIGN.md:

| Station                      | Unlocks at    |
| ---------------------------- | ------------- |
| train-st, train-ag, train-en | adv-workbench |
| train-in                     | computronium  |
| train-pe                     | unobtainium   |
| train-lk                     | wishalloy     |

### Out-of-Scope Worlds

Desert, snow, and flowers boards are artifacts of a previous design direction and should be removed (add a TODO in code). They are out of scope for this PRD.

## Testing Decisions

A good test covers external behavior (what goes in, what comes out) rather than internal implementation. Tests should not assert on private state, intermediate data structures, or rendering details.

### Modules to Test

**Win condition monitor**: The most critical new module. Test that:

- The countdown does not start until all six buildings are simultaneously staffed
- Removing any astronaut resets the countdown
- The countdown completes and fires the win event after 1 sol with all six staffed continuously
- The monitor handles boards being on different worlds (cross-board state)

This module should be a pure function or simple class that takes game state and returns whether the win countdown is active and at what progress — making it straightforwardly unit-testable without a running game.

**Milestone chain**: Test that each unlock trigger correctly activates the expected set of recipes and no others. The existing milestone system has some test coverage to use as prior art.

**Rover expedition recipes**: Test that the probabilistic output of rover expedition recipes includes discovery cards only for the correct next planet (not already-discovered ones), and that prerequisite core samples are consumed correctly.

Prior art for tests: look at existing vitest tests in the codebase for recipe matching and milestone progression patterns.

## Out of Scope

- Assembly-line battlebot production
- Mark II battlebot tier
- Post-win content or "phase n+1"
- Desert, snow, and flowers worlds
- Energy megacells in the win condition activation
- Resource balance tuning (plasteel/nanocarbon surplus from the drill chain)
- Music and SFX
- UI improvements listed in TODO.md (routing UI, hints, color scheme, etc.)
- Production lines of any kind

## Further Notes

- The "parallel enforcement" problem for the win condition (how to prevent one astronaut from sequentially activating all five dial parts) is solved by the simultaneous staffing requirement: all six buildings must be staffed at the same time for the full duration. No sync signal cards, no expiry timers, no locking mechanics needed.
- The drill moving between planets is a potential UX friction point. Leave it as-is and observe player behavior — the single-pickaxe constraint already makes the drill feel precious, so moving it intentionally may feel fine in practice.
- The controller building recipe doubles as the discovery mechanism: no special unlock trigger is needed. Once the player has all five core samples and sufficient computronium/unobtainium, the recipe is satisfiable and the building can be crafted.
