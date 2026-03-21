# Stacks TODO list

## Combat
Chunk A: Combat types & data model

Add DamageType union (impact, energy, plasma, acid)
Add `resist?: Partial<Record<DamageType, number>>` to UnitStats
Add weapon stats to CardDef (or a new WeaponDef): damage, damageType, attackInterval
Built-in weapon for astronaut (fists = 5 impact, slow)

Chunk B: Enemy cards

alien-bug, bandit, etc. card types with unitStats (hp, st, ag, pe + resist)
Loot drop definition per enemy type (e.g. biomass, alien-parts)
Enemy combat tick in progress.ts — board-level: each enemy targets nearest player unit, exchanges damage each tick


Chunk C: Invasion cards
invasion-alien card type — acts like a countdown (uses the existing sol/progress system)
When countdown expires, removes itself and spawns N enemy cards at random board positions
Visual: shows countdown on card face


Chunk D: Weapons
Weapon card types (e.g. laser-pistol, plasma-rifle)
Units equip a weapon by having it in their stack. Equipping a weapon is like a recipe except that the end result is that the weapon disappears from the stack and is merged into the unit card.
Unit's effective weapon = selected weapon (can select in the stat panel) or fists fallback


Chunk E: Bosses (TBD)


## QoL
- Sorter – like a foundation except can have multiple "outputs" and decides where to go based on card type (e.g., drill -> sorter -> plasteel goes one way, helium goes the other)
- All dialogs should use the same template as the settings dialog
- Ideas should show what the recipe is on mouseover. Also we should get rid of the idea cards in favor of an idea card template, otherwise we just have duplication everywhere.



- Card animations when a card is created?
- Save/restore, slots and export/import
- Music/SFX




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
