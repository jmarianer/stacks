# Stacks TODO list

## UI

- Ideas should show what the recipe is on mouseover / right-click.
- Music/SFX
- Hints about interactions. See Excalidraw for how they did it, it's really great.
- Foundation grid should be offset a bit in the Y direction to allow for the progress bar
- Foundation grid space should show where it's about to land (similar to how the drop target on changes color if it's a card)
- Show upcoming milestones/quests. We'll give them titles or something.
- Cards shouldn't always appear on top of the same card. Not sure when that should/shouldn't happen. Maybe just for resources (in early game when we don't have sorters, otherwise it's a PITA). Maybe never and sorters are much more foundational (e.g. appear at the same time as foundations).
- Rename bandaids to something that makes it clear what they do. Figure out what they do first.
- Figure out a nicer color scheme
- Backspace sells everything but buildings (workbench, foundation)
- Better UI for routing (not sure what that is)
- Show icon (vs. name) on sort/route arrow
- Mouse pointer shouldn't be "select text" on card titles (or really anywhere)
- Better pause indication
- Better UI (than right-clicking) for selecting a card
- Select recipe for workbench, so that (eg) it doesn't create band-aids when it's meant for unikits
- Tutorial / what's-next things. E.g., "OK now you've created a foundation, here's how to use it", "You just discovered your first teleporation card", "Congratulations on completing X. To get to X+1 you need to make 10 foozles"

## Bugs

- Save+restore resets to the beginning of the current sol. Also fucks up running receipes somehow.
- I think tombstones can attack enemies :o
- No way to remove routes now

## Gameplay

- Can't see new worlds until teleported at least once?
- Deactivate physics for noncombatants. Combat takes place on a higher plane or something
- Increase fists distance (fistance) a bit so that bacteria can attack vertically
- Maybe training should be a later-game thing? Not sure.
- Stat limits
- The number of band-aids is too damn low. Probably got that and unikits backwards.
- Use bandaids and unikits outside of combat
- The currency mechanism isn't working anymore, since there's only one thing to buy and it's crust chunks. Maybe a new mechanism based on time to mine? This is only useful before you get drill/rover. idk... need to think about this.
  - Idea: add a pickaxe. Astronaut+pickaxe = crust chunk but it takes a while. Very early game recipe for a better pickaxe (before the whole thing gets replaced by a drill and then a rover)
- Unrelated idea: tech tree + research to replace milestones? (Obv doesn't replace the milestones that are enemy attacks)
- What to do with a route that isn't matched?
- Astronauts shouldn't go back to their posts immediately at the end of combat. It's too jarring. Either just stay put or go back slowly.
- Attacks from rover and drill should be harder. Thought: rover = alien, drill = alien bug. See old game for stats.
- Alien bug attack first time going to the eggs world. (should be a miniboss battle, harder than the alien from the drill)
- Immovable buildings: drill-tres2b, the different notStargate parts (later)
- Discover Tres-2b, desert and snow
- Add miniboss first notStargate par to desert
- Four more planets, each with a miniboss and a notStargate part. See old game for ideas about the planets and their method of discovery
- After all notStargate parts are discovered, we have a (heavy) recipe for the controller. Think all the elements in the game starting with energy cells and all the way up to wishalloy and dark matter, plus five astronauts (and disallowing service drones) and a heckuva lot of time (and they can't leave their station to fight attackers or the time resets)
- An astronaut operating each of the five stargate parts, plus mucho energy megacells on the controller. Is that the winning condition or does it just open up phase n+1 of the game?
- Battlebots (see old game for complicated recipes). Figure out how to make it so they're required for some of the later minibosses, or maybe there's a megaboss after the notStargate that requires a bunch of them. Hmmm, maybe a final boss that is gated on making _n_ battlebots and equipping them all with laser cannons. _n_ should be large enough that the player needs to set up a production chain.
