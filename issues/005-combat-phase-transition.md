## Parent PRD

`issues/prd.md`

## What to build

Add support for enemy phase transitions in combat. When a phase-transition enemy reaches 50% HP, it switches to a second stat profile — faster movement and stronger attacks. The transition fires once per fight and is permanent for that encounter.

This mechanic is used by the Planet 3 (Inferno) and Planet 5 (Alien Lair) minibosses.

## Acceptance criteria

- [ ] An enemy definition can specify a second-phase stat profile (speed, attack damage, etc.)
- [ ] When the enemy's HP drops to 50% or below, it immediately switches to the second-phase profile
- [ ] The transition fires at most once per combat encounter
- [ ] Enemies without a second-phase profile are unaffected
- [ ] The existing combat system (bacteria, alien bugs, aliens) is unaffected

## Blocked by

None — can start immediately.

## User stories addressed

- User story 22
