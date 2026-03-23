# Stacks TODO list

## Unit inventory

Only astronaut and cyborg have inventory (battle-bot will too, once added). Service drone has no inventory and doesn't participate in combat.

### Weapons

Equipping: drop a weapon card onto a unit's stack — triggers a 1-second recipe that moves it into the unit's weapon inventory.

- Max weapon slots: astronaut=3, cyborg=4
- Slots fill in order; equipping when full does nothing
- The most recently equipped weapon is the active one (selection UI is future work)

### Healing items (band-aids and uni-kits)

Equipping: same as weapons — drop onto the stack, 1-second recipe, moved into inventory.

- Band-aids (heal): max = floor(statSum / 10 + 1) → base stats (sum=6) = 1 slot
- Uni-kits (regen): max = floor(statSum / 5 + 1) → base stats (sum=6) = 2 slots
- Since all band-aids are identical and all uni-kits are identical, we just store a count for each
- Equipping when at max does nothing

(potion = band-aid = heal; berry = uni-kit = regen)

### Death

All equipped weapons and healing item counts carry over into the tombstone. Both `CardData` for units and tombstones will need to gain `inventory` and heal count fields.

## Combat UI

Whenever enemies are present, every player and enemy unit has an overlay with a health bar, cooldown and other stats as makes sense. (We'll need to decide exactly what that means, maybe "current weapon" and/or "heal/regen count")

## Combat

These are the actions taken by each type of unit in the old game

### Astronaut (player)

HP ≤ 50% and has a potion → use healing item
HP ≤ 90%, regen not active, and has berries → use regen item
HP < 25% → rush away from closest enemy (500 ms)
HP < 50% → move away from closest enemy (500 ms)
Enemy in weapon range → attack closest enemy (1000 ms)
Any enemy on aggro list → move towards closest enemy (500 ms)
Can patrol → patrol (500 ms)
Otherwise → do nothing (1000 ms)




### Bacteria (hostile, 16 HP, regenerates 2 HP/tick)

Enemy in weapon range → attack closest enemy (1000 ms)
Any enemy on aggro list → move towards closest enemy (500 ms)
Can patrol → patrol (500 ms)
Otherwise → do nothing (1000 ms)
Straightforward aggressor; no retreat behaviour.


Ignoring space mouse for the time being. I suggest we implement all of those except "patrol", and remove the "rush vs. move" distinction (i.e. treat both as "flee", so that the astronaut becomes "move away if HP < 50%"). Aggro = "enemies on the same board" for the moment, I think.

Player units that started combat atop stacks should return to their stacks (and resume recipes) when combat is over (i.e. no more enemies). Player units that were loose can stay where they were. I suggest using stack IDs for that; if the stack was split, the unit goes to whatever stack retains the old ID. If the stack no longer exists it stays where it is.

## QoL

- Sorter – like a foundation except can have multiple "outputs" and decides where to go based on card type (e.g., drill -> sorter -> plasteel goes one way, helium goes the other)

## UI

- All dialogs should use the same template as the settings dialog
- Ideas should show what the recipe is on mouseover.
- Music/SFX
- Find the image for ideas in the old game and use it instead of the emoji

## Code quality

Files that can be considered Done (for now):

- physics.ts
- All components except MainView

Please ask me before changing any of these files, even though you technically have permission to.

Other things that I don't want to delete but Claude thinks are too persnickety:

- Constants should use vec2 where appropriate
- CardDef should be a discriminated union type (with a type field: building, resource, player unit, enemy).

## Other

- Save/restore, slots and export/import

# Old stuff that needs to be merged

Health & Leveling
Base 100 HP, scales as hp_base + level × hp_per_level where hp_per_level comes from Endurance
Astronauts have AllowLevelUp — they gain levels through play
Race modifier: +25 freeze resistance baked in
Inventory (Equipment Slots)
Three categories, 4 backpack slots each, only one active at a time:

Weapons — each has stamina (durability), burst counter, angle, tear flag
Armor — each has a tear flag; base armor gives +25 freeze resistance
Wearables (amulets) — provide attribute or stat bonuses
Plus potions (heal) and berries (regen) as consumables, with a max count based on stats.

Stat Progression
Training stations — recipes that take time and permanently +1 an attribute
Stat booster cards — one-use cards that directly add an attribute point
Both of these exist for all six attributes
Combat Behavior (AI)
Astronauts have hardcoded priority behavior:

Use heal potion if HP ≤ 50%
Use regen berry if HP ≤ 90%
Flee if HP < 25%
Back off if HP < 50%
Attack closest enemy in range
Move toward closest aggro'd enemy
Patrol
