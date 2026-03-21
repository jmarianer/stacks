# Stacks TODO list

## Combat
- Weapons get equipped into inventory (as opposed to being on the stack)
- One weapon is selected from the inventory and is then used.
- Max inventory slots depends on the unit type (astronaut, cyborg, battle-bot)
- Add boss fights later

## QoL
- Sorter – like a foundation except can have multiple "outputs" and decides where to go based on card type (e.g., drill -> sorter -> plasteel goes one way, helium goes the other)

## UI
- All dialogs should use the same template as the settings dialog
- Ideas should show what the recipe is on mouseover.
- Music/SFX
- Find the image for ideas in the old game and use it instead of the emoji

## Code quality
- Constants should use vec2 where appropriate
- Recipe discovery should be inside results as opposed to a separate field (?)
- Enemy loot should be a recipe-results thing
- CardDef should be a discriminated union type (with a type field: building, resource, player unit, enemy). Also symbol/image should be an either-or thing.
- Instead of UNIT_STAT_DEFAULTS, the default/base stats should be in the card def (for a player unit) as they are for an enemy. Ditto CARD_GROUPS
- Reorganize card-defs, card-catalog and cards into the following files:
    - types/card-types and types/board-types for types ONLY
    - Utility functions for cards. Not sure where that goes
    - Constant for card catalog goes under data
    - Constant for initial board goes under data
    - Anything else, ask me.

Files that can be considered Done (for now):
- physics.ts
- All components except MainView
Please ask me before changing any of these files, even though you technically have permission to.

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
