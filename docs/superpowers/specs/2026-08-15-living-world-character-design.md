# Living World and Character Redesign

## Purpose

Turn the prototype from an abstract meadow of glowing shapes into a readable journey about a small traveling restorer. Every run should immediately feel like a different place, present a different practical problem, and give the player concrete tools and clothing that appear on the character.

The audience is a casual browser player who should understand objects by sight and ordinary-world logic without learning fantasy terminology.

## Chosen approach

Use a curated, seed-driven run blueprint directed by the local browser model. The model chooses among substantial authored components instead of writing unrestricted game data. This produces visible variety and coherent Ukrainian copy while staying reliable on the existing 135M model.

Alternatives rejected:

- Fully freeform AI worlds would create inconsistent object logic and unreliable JSON on the current model.
- Separate scene-based levels would create stronger transitions but require replacing the current continuous exploration loop.
- Palette-only procedural generation is cheap but is the exact failure mode being replaced.

## Run blueprint

Each run has a persisted `RunDirection` containing:

- one region: orchard, marsh, highland, or coast;
- one weather treatment: sunbreak, rain, mist, or wind;
- one story frame: reopen a station, prepare a harvest gathering, find a missing surveyor, or restore a village water route;
- one colorway selected from grounded region-specific palettes;
- two starting wearable items.

The normal seed creates a complete fallback blueprint immediately. When the local model finishes at the opening, its output is hashed with the run seed and produces a new blueprint plus story ingredients. The same model response therefore changes story frame, map structure, environmental colors, weather, and starting equipment. The result remains deterministic once saved.

## World generation

The sanctuary stays in the northwest so existing goals and touch navigation remain understandable. Everything beyond it changes by region:

- Orchard: rows of fruit trees, fences, a tool shed, warm soil, and a looping farm lane.
- Marsh: water pools, reeds, boardwalks, a pump house, and a narrow zig-zag route.
- Highland: rock shelves, pines, switchbacks, a weather station, and open windy ground.
- Coast: a visible shoreline, docks, boats, dune grass, and a curved coastal road.

Each region has its own anomaly and tool-station slots, path geometry, and scenery collection. Anomalies remain separated and use stable IDs so saves and the six-memory ending remain compatible.

The canvas renders recognizable scenery rather than differently colored blobs. Water, buildings, trees, rocks, fences, boardwalks, and docks each have a simple distinct silhouette.

## Practical tools and objects

Internal gift IDs remain for save compatibility, but all player-facing language and visuals become practical field tools:

- `reveal`: hand lantern — illuminates faded writing and dark spaces;
- `grow`: pruning shears — clears vines and tends plants;
- `echo`: tuning fork — tests bells, hollow objects, and mechanisms;
- `mend`: repair kit — fixes wood, pumps, hinges, and signs.

Shrines become tool stations. “Use Gift” becomes “Use tool”; “borrow a Gift” becomes “take a tool.” The tutorial route remains the faded sign: use the lantern to read it, fetch the repair kit, then repair it.

Anomaly names and transformations become recognizable field objects: faded sign, jammed music box, dry hand pump, overgrown cellar, untuned rain bell, torn paper glider, dark signal lamp, and neglected garden.

## Equipment

The wardrobe has four concrete wearable items:

- rain hat (`head`);
- wool scarf (`neck`);
- canvas backpack (`back`);
- rubber boots (`feet`).

Every run begins with two items selected by the blueprint. Completing memories unlocks the remaining items. The character panel shows owned items and lets the player equip or remove one item per slot. Equipment is cosmetic only and never changes movement or puzzle power.

Existing saves receive a safe default wardrobe during localization/migration.

## Character rendering and movement

The avatar becomes a small bipedal paper-cut traveler with a head, torso, two arms, and two legs while preserving fox, moth, bird, and wisp silhouettes in the head or body shape.

The controller supplies a transient render pose:

- facing: up, down, left, or right, selected by the dominant movement axis;
- walking: true only while keyboard or touch movement is active.

Walking alternates arm and leg angles. Left and right are side views, down shows the face, and up shows the back. Hat, scarf, backpack, and boots change their placement by direction. Reduced-motion mode keeps the directional pose but removes limb swing.

## Story variety

The four story frames have different purposes, questions, openings, recovered-memory explanations, chapter wording, and endings. Story ingredients still vary names, roles, setbacks, vows, motifs, and truths within a frame.

The local model no longer merely changes a few nouns in one template. Its direction selects the whole frame and world blueprint, while the character name, tool, burden, quirk, and run seed remain in its prompt.

## Opening flow

Local generation moves to the opening:

- If the player has already enabled the local model, a new run automatically opens the stable progress card and directs the world before the wake screen.
- If it is not enabled, the wake screen offers one secondary action: “Create this journey on this device,” with the download size stated plainly. “Wake up” remains available, so generation never blocks play.
- When generation succeeds or is dismissed, the wake screen is restored with the new story and region summary.
- The personalization screen keeps character editing but no longer introduces story generation late in the run.

Generation failures retain the complete procedural blueprint and offer retry or continue.

## Visual direction

The visual subject is a hand-painted field expedition rather than a magical dashboard. The canvas uses region-specific natural colors and practical silhouettes. UI remains a quiet field notebook layered over the world.

Signature element: the directional paper-cut traveler visibly carries the equipment chosen for this run.

Typography remains local and fast: Iowan/Georgia for story moments, Avenir/Segoe UI for interface copy, and system monospace only for controls and field labels. Motion is concentrated in walking, weather, and progress; decorative modal re-entry animations are not repeated.

## Compatibility and safety

- Save version remains `1`; missing optional direction and equipment fields are migrated.
- Tool IDs and anomaly IDs remain stable.
- No equipment affects balance.
- Local AI receives no data beyond the existing character and generated run seed.
- A procedural run is always available if the model fails or is skipped.

## Verification

- Unit tests prove region layouts differ structurally, blueprints are deterministic, story frames differ, equipment is cosmetic/persistent, and directional poses follow movement.
- Browser tests prove local generation is offered at the opening, the progress modal stays stable, generated direction updates world/story/equipment, wardrobe buttons work, and keyboard/touch controls still move.
- Visual browser inspection covers at least two regions and all four facing directions at desktop and phone sizes.
