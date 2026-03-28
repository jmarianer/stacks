# Stacks TODO list

## QoL

- Sorter – like a foundation except can have multiple "outputs" and decides where to go based on card type (e.g., drill -> sorter -> plasteel goes one way, helium goes the other)

## UI

- Ideas should show what the recipe is on mouseover / right-click.
- Music/SFX
- Hints about interactions. See Excalidraw for how they did it, it's really great.
- Card header should always fit in the allotted space, scale down font size if necessary.
- Foundation grid should be offset a bit in the Y direction to allow for the progress bar
- Foundation grid space should show where it's about to land (similar to how the drop target on changes color if it's a card)
- Show upcoming milestones/quests. We'll give them titles or something.
- Cards shouldn't always appear on top of the same card. Not sure when that should/shouldn't happen. Maybe just for resources (in early game when we don't have sorters, otherwise it's a PITA). Maybe never and sorters are much more foundational (e.g. appear at the same time as foundations).
- Rename bandaids to something that makes it clear what they do. Figure out what they do first.
- "Restart" button so I don't have to go in local storage and delete the thing. Also "View game state JSON" maybe?
- Figure out a nicer color scheme

## Bugs

- Save+restore resets to the beginning of the current sol, I think.
- R in search box de/activates routing mode

## Code quality

- Change SaveState to GameState and use it in place of the three variables in MainView
- Lots of stuff needs to go out of MainView and into separate components

## Gameplay

- Alien bug attack first time going to the eggs world
- Can't see new worlds until teleported at least once?
- Deactivate physics for noncombatants. Combat takes place on a higher plane or something
- Increase fists distance (fistance) a bit so that bacteria can attack vertically
- Understand why post-invasion didn't happen (drill and stuff)
- Maybe training should be a later-game thing? Not sure.
- Stat limits
- The number of band-aids is too damn low. Probably got that and unikits backwards.
- Use bandaids and unikits outside of combat