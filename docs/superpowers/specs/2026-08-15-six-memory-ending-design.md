# Six Memories and the Lantern House Ending

## Problem

The sanctuary has six visible planting circles, but filling them does not change game state or produce a conclusion. After The Road Home, recovered objects also become inventory rewards without revealing additional parts of the companion's past. The mechanics therefore continue while the story stops.

## Design choice

The story completes when **any six distinct recovered memories are planted**. Requiring six specific objects would invalidate existing sanctuaries and turn free exploration into a hidden checklist; a strictly linear sequence would also remove the meadow's strongest quality, choosing what to follow. Any-six completion preserves exploration while allowing one authored ending.

## Player arc

The companion once kept **Lantern House**, a refuge for people lost on dangerous roads. They woke without a past because, during the last great storm, they carried its light outward and spent their memories guiding others home. The sanctuary reconstructs enough of that past to remember their role: **The Keeper of Lantern House**.

The first memory remains The Road Home. Every later object that yields a keepsake reveals a blocking, resumable chapter:

| Object | Chapter | Recovered story |
| --- | --- | --- |
| Restored Waypost | The Road Home | Someone kept a distant light burning so the companion could find the road. |
| Singing Tree | The Song Below | The companion taught frightened travelers four notes; they sang until thunder sounded small. |
| Whispering Pool | The Basin at Dawn | They washed storm-mud from every guest before asking their name. |
| Little Hidden Door | The Door Left Unlocked | Behind living roots they kept blankets and bread, and never locked the refuge. |
| Rain Bell | The Storm Bell | They rang through the rain to tell people beyond the hill that Lantern House still stood. |
| Paper Flock | Letters with Wings | They sent notes into the dark: “There is room here. You do not have to arrive brave.” |
| Named Moon | A Name for the Moon | They named a blank moon for a child who could not sleep and promised morning would come. |
| Lantern Garden | The Garden That Waited | When oil ran out, they planted warm flowers so each step of the road could find the next. |

The player may recover all eight, but only six sanctuary plots are required for the conclusion. Extra chapters remain valid discoveries and appear in the journal.

## Recovery experience

- A chapter appears only when an object reaches its final, rewarded form.
- The card identifies the named memory and gives two or three concrete story sentences.
- The card is persisted with `pendingChapter`; reloading cannot skip it.
- While a chapter or ending card is open, world movement and actions are disabled.
- Dismissing the card clears `pendingChapter` and autosaves.
- Existing saves do not receive a backlog of popups. Their already rewarded chapters appear in the journal, and a sanctuary that is already full receives the ending immediately.

## Sanctuary goal and ending

After onboarding, the companion HUD always shows `N / 6 MEMORIES PLANTED`. Planting the sixth memory opens a persisted ending card:

> Lantern House was never the home you were trying to find. It was the home you made for everyone still on the road. In the last great storm, you carried its light into the dark and spent your memories guiding others home. This meadow grew from what you gave away. You were the Keeper of Lantern House.

The action **Carry the light forward** records `endingSeen: true`, returns to the open meadow, changes the HUD status to `STORY COMPLETE`, and adds the conclusion to the journal. The game remains playable; completion is an ending, not a lockout.

## State and compatibility

Add optional fields to version-1 `GameState`:

- `pendingChapter?: string` — anomaly id whose new story card must be shown.
- `endingSeen?: boolean` — whether the player dismissed the Lantern House ending.

Older saves remain valid. On load, `Object.keys(plantings).length >= 6 && !endingSeen` is enough to display the ending without rewriting other progress. Removing a planting after completion does not erase the ending.

## Success criteria

- Every newly recovered post-tutorial keepsake reveals a named story chapter.
- Reloading during a chapter or ending restores that exact card.
- The normal HUD makes the six-memory sanctuary goal explicit.
- Filling all six plots produces a clear ending, including for an already-full save.
- The journal contains every recovered chapter and the finale after completion.
- Keyboard and touch input cannot move or act behind story cards.
- Existing version-1 saves load without losing discoveries, plantings, or character choices.
