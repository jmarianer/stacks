# Stacks TODO list

## Unit inventory

- Weapons get equipped into inventory (as opposed to being on the stack)
- One weapon is selected from the inventory and is then used. (For the moment we can assume the last one equipped is selected; we'll add selection UI later)
- Max inventory slots depends on the unit type (astronaut=3, cyborg=4, battle-bot=5)

- Rather than act on the unit immediately, band-aids and uni-kits are equipped in special slots. We can look at the old game to see how many slots of each type any given unit has. Since all bandaids and all unikits are identical we just need a number in each unit.

## Combat UI

In combat mode, every unit that is participating has an overlay with a health bar, cooldown and other stats as makes sense.

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

(remember that potion = bandaid and berries = unikit, or maybe it's the other way around I don't remember)


### Bacteria (hostile, 16 HP, regenerates 2 HP/tick)

Enemy in weapon range → attack closest enemy (1000 ms)
Any enemy on aggro list → move towards closest enemy (500 ms)
Can patrol → patrol (500 ms)
Otherwise → do nothing (1000 ms)
Straightforward aggressor; no retreat behaviour.


Let's implement all of those except "patrol".

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
