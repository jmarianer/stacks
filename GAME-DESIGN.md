# Stacks — Game Design Spec

## Win Condition

Hard win. The player assembles a controller building alongside 5 dial parts (one per planet), activates all 6 with astronauts + energy megacells, and wins. Credits roll. No "phase n+1."

---

## Game Arc

### Early Game (existing, mostly implemented)

Tutorial flow:
1. Punch crust chunk → solar panel → foundation → service drone → workbench → electronics → blaster
2. Sol 4+: bacteria invasion (45s warning, 4 bacteria spawn)
3. Kill bacteria → drill and band-aid unlocked
4. Build drill → alien bug fight → alien eggs world discovered

### Mid Game

#### Milestone Chain

Two **visible** milestones bookend the mid-game. Everything else unlocks silently.

| Trigger | Visible? | Unlocks |
|---|---|---|
| Kill bacteria | — | `build-drill`, `make-band-aid` |
| Build drill | invisible | `build-adv-workbench`, `build-rover`, `build-cloning-chamber` |
| Build cloning chamber | invisible | `clone-astronaut` |
| Build adv-workbench | invisible | `make-computronium`, `make-bolter-heavy`, `make-minigun`, `build-train-st`, `build-train-ag`, `build-train-en` |
| **Build rover** | **visible** | expedition mechanic |
| Make computronium | invisible | `build-refinery`, `build-reactor`, `build-power-station`, `build-computer`, `make-laser-cannon`, `build-train-in` |
| Build refinery | invisible | `make-unobtainium` |
| Make unobtainium | invisible | `make-wishalloy`, `build-train-pe` |
| **Make wishalloy** | **visible** | battlebots, `build-train-lk` |

#### Planet Discovery

Planets are discovered in a fixed sequence, disguised — the player never sees a numbered list. The next discoverable planet is always the appropriate difficulty tier.

- **Planets 1–3**: rover expeditions. The rover leaves on a timed expedition (1–2 sols), returns with a discovery card revealing a new world.
- **Planets 4–5**: item-gated research. A `build-computer` recipe unlocks at `first-computronium` (same tier as refinery/reactor). Discovery is a one-shot recipe: stack astronaut + unique resource (only obtainable from the prerequisite planet) on the computer, wait ~1 minute, receive a discovery card. No special assignment mechanic — consistent with the rest of the game.

#### Training Stations

Unlock progressively through the mid-game chain. Optional but rewarding — higher stats make minibosses easier. No explicit training requirements or milestones. Difficulty pressure on later planets naturally nudges players toward them.

| Station | Unlocks at | Stat |
|---|---|---|
| train-st | adv-workbench | strength |
| train-ag | adv-workbench | agility |
| train-en | adv-workbench | endurance |
| train-in | computronium | intelligence |
| train-pe | unobtainium | perception |
| train-lk | wishalloy | luck |

#### Battlebots

Unlock at wishalloy. Two recipe tiers:
- **Manual**: slow, expensive, crafted at adv-workbench
- **Assembly**: faster, requires a new assembly building (unlocked later)

Required (de facto, not gated) for planets 4 and 5 — those minibosses are tuned hard enough that players will figure it out through failure. 2–3 battlebots needed, not a production line.

Production lines are sequel territory.

### Late Game

#### The 5 Dial-Part Planets

Adapted from old-game biomes. Each planet has:
- A miniboss with a unique mechanic
- A dial part drop (immobile building, placed permanently on base)
- A unique resource (used to gate research for the next planet)

| # | Biome | Miniboss mechanic | Discovery method |
|---|---|---|---|
| 1 | Radar Station | Tanky + slow (stat profile only) | Rover |
| 2 | Factory | Spawns adds | Rover |
| 3 | Inferno | Phase transition (faster/stronger at 50% HP) | Rover |
| 4 | Empire | Regenerates — must be burst down | Research (needs planet 3 resource) |
| 5 | Alien Lair | Spawns adds + phase transition | Research (needs planet 4 resource) |

Battlebots required (de facto) for planets 4 and 5.

#### Existing Worlds

| World | Purpose |
|---|---|
| Alien Eggs | Biomass farming (breed/stomp alien bugs) |
| Tres-2b | Dark matter (immobile drill building, discovered via drill → alien bug fight) |
| Desert | TBD |
| Snow | TBD |
| Flowers | TBD |

#### Win Condition — Assembly

1. Each dial part building has an **activate** recipe: astronaut + energy megacell → **sync signal card**
2. Sync signals are routed home via the existing routing system
3. A **controller building** (discovered via a late-game mechanism TBD) accepts all 5 sync signals + astronaut + energy megacells
4. Triggering the controller with all inputs fires the win condition

**Parallel enforcement** (preventing one astronaut from activating all 5 parts sequentially) is TBD at implementation time. Options: sync signals expire within a time window, or activating a dial part locks the astronaut in place until the controller fires.

---

## Deferred / Sequel

- Resource balance (plasteel/nanocarbon surplus from drill)
- Production line battlebots
- Phase n+1 / post-win content
- Remaining world purposes: desert, snow, flowers
