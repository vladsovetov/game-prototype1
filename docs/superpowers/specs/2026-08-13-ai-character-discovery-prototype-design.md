# AI Character Discovery Game: Local Prototype Design

Date: 2026-08-13
Status: Proposed for implementation

## Purpose

Build a local, single-player browser prototype that tests the project's riskiest product claim:

> A character conceived with any external AI can be imported into a deterministic game, receive balanced characteristics, and create surprising but understandable changes in the world.

This prototype is a gameplay proof, not a production foundation. It must make the character-import and world-reaction loop tangible before networking, accounts, monetization, or a persistent backend are considered.

## Success Criteria

The prototype succeeds when a new player can:

1. Understand how to create or obtain a character card.
2. Import a valid card or use a built-in example.
3. Recognize the character's Gift, Burden, and Quirk.
4. Move through one small world and use the Gift on anomalies.
5. See at least one surprising compound reaction.
6. Collect the resulting Memory Seed and plant it in a sanctuary.
7. Reload the page and find the character, journal, and sanctuary state preserved.

The intended first-play path should take less than five minutes. A complete play session has no timer or forced ending.

## Prototype Boundaries

### Included

- A desktop-first, top-down 2D browser experience.
- One compact exploration region connected to one sanctuary.
- Keyboard movement and mouse interaction. Touch controls are excluded from the prototype.
- Character creation through either pasted JSON or a built-in example generator.
- Four Gifts: Reveal, Grow, Echo, and Mend.
- Four Burdens: Fragile, Loud, Rooted, and Fading.
- Four Quirks: Moon-Touched, Rain-Kin, Curious, and Shy.
- At least eight anomalies distributed through the exploration region.
- At least four authored two-step reactions in which one Gift changes an anomaly and another Gift can change the resulting state.
- A discovery journal.
- Memory Seeds that can be planted in fixed sanctuary plots.
- Local persistence in the browser.
- A reset-data control with explicit confirmation.
- Clear import-validation errors and an always-available built-in character.

### Excluded

- Multiplayer, matchmaking, chat, friends, or invitations.
- Accounts, cloud saves, databases, or server-authoritative state.
- Payments, a cosmetic shop, or premium currency.
- Live AI API calls.
- Image uploads, AI-generated images, generated voices, or generated 3D assets.
- Combat, enemies, health, death, PvP, trading, crafting, or inventory limits.
- Procedurally generated maps or quests.
- Mobile application packaging.
- Production accessibility, localization, analytics, or moderation systems.

These exclusions are deliberate. The prototype answers whether the mechanic is fun and legible; it does not pre-build the live service.

## Player Experience

### Start Screen

The start screen presents three actions:

1. **Create with your AI** opens a copyable context packet and explains how to paste the result back into the game.
2. **Import Character** opens a text area that accepts the character-card JSON.
3. **Surprise Me** creates a valid character locally from the same controlled vocabulary.

The context packet tells an external AI to invent prose and choose identifiers from the allowed catalog. It must explicitly state that the game owns all numerical balance and will ignore unknown mechanics.

### Character Card

A valid imported card contains:

```json
{
  "version": 1,
  "name": "Morrow",
  "description": "A porcelain fox that remembers vanished roads.",
  "appearance": {
    "body": "fox",
    "material": "porcelain",
    "palette": "dusk",
    "mark": "map-lines"
  },
  "gift": "reveal",
  "burden": "fragile",
  "quirk": "moon-touched"
}
```

The importer accepts only known identifiers, bounds name and description lengths, strips unsafe markup, reports all validation failures together, and never executes imported content. Unknown fields are ignored. Gameplay values are looked up from the internal catalog rather than read from the card.

### Exploration Loop

The character begins at the sanctuary gate and enters one scrolling region approximately four viewport widths across and three viewport heights tall. The player can move, inspect nearby objects, and activate the Gift on a highlighted anomaly.

Each anomaly has explicit states. For example:

```text
Silent Stone --Echo--> Humming Stone --Grow--> Singing Tree
Covered Sign --Reveal--> Remembered Sign --Mend--> Restored Waypost
Dry Pool --Mend--> Clear Pool --Echo--> Whispering Pool
Tangled Root --Grow--> Root Arch --Reveal--> Hidden Door
```

The active character has only one Gift. To prove compound reactions without multiplayer, the region contains temporary Resonance Shrines. A shrine lends one predefined secondary Gift while the player remains in its nearby area. This models future cooperative combinations without adding companion AI or character switching.

Every state transition provides immediate visual feedback, a short text reaction, and a journal update. Completing the final state of an authored chain produces one Memory Seed.

### Burdens and Quirks

Burdens must affect interaction without causing failure states:

- Fragile: activating a Gift creates a visible crack that fades after a short rest.
- Loud: Gift use creates a larger sound pulse that wakes nearby decorative props; those props provide no rewards or required access.
- Rooted: the character briefly cannot move while the Gift resolves.
- Fading: the character becomes translucent after Gift use and recovers near light.

Quirks alter presentation or reveal optional interactions:

- Moon-Touched: moon symbols glow near the character.
- Rain-Kin: puddles ripple and point toward nearby anomalies.
- Curious: inspected objects reveal an additional line of flavor text.
- Shy: resting near quiet props produces small decorative sprouts.

No Burden or Quirk changes reward quantity, movement speed over time, discovery probability, or access to required content.

### Sanctuary Loop

Memory Seeds appear in a small seed tray with no capacity limit. The sanctuary contains fixed planting plots. Planting a seed creates a permanent decorative form derived from its discovery chain, such as a miniature Singing Tree.

The sanctuary demonstrates the long-term product promise: exploration produces visible personal history. In the prototype, decorations cannot be moved after planting; the player can remove one through an explicit confirmation action and recover the seed.

## Visual Direction

Use a cohesive paper-diorama style with simple geometric sprites, soft shadows, a restrained dusk palette, and readable outlines. The prototype should look intentional without depending on a large asset pipeline.

Characters are assembled from modular vector-like parts. The supported appearance values are:

- Body: fox, moth, bird, or wisp.
- Material: porcelain, moss, paper, or starlight.
- Palette: dusk, dawn, grove, or tide.
- Mark: map-lines, stars, rings, or cracks.

Every appearance choice changes the avatar: body selects the silhouette, material selects its surface treatment, palette selects its colors, and mark selects an overlay pattern.

Animation is limited to idle breathing, directional movement, Gift activation, anomaly reactions, and sanctuary planting. Readability takes precedence over visual abundance.

## Architecture

The prototype has five isolated modules:

1. **Character catalog and importer**: owns schemas, validation, normalization, random valid generation, and the external-AI context packet.
2. **Game simulation**: owns movement, proximity, interactions, anomaly state machines, temporary Resonance Gifts, and deterministic rewards.
3. **Renderer and interface**: draws the world and avatar, displays interaction prompts, and presents character, journal, and sanctuary screens.
4. **Persistence**: serializes versioned character, discovery, anomaly, seed, and planting state to local browser storage.
5. **Content definitions**: stores characters' catalog entries, anomaly chains, copy, and visual recipes as data rather than branching application logic.

The simulation must not depend on rendering APIs. Content definitions must not contain executable functions. This keeps rules testable and makes later networking migration possible without pretending the local prototype is already server-ready.

## Data Flow

```text
External AI or Surprise Me
        |
        v
Character JSON -> Validate -> Normalize -> Catalog-derived Character
                                            |
                                            v
Input -> Simulation -> State transition -> Renderer
                    |                    |
                    v                    v
               Persistence        Journal / Seed reward
                                         |
                                         v
                              Sanctuary planting state
```

All randomness uses a stored seed so reloads cannot duplicate rewards or alter completed results.

## Error Handling

- Invalid character cards remain editable and show consolidated field-level errors.
- Corrupt saved data is preserved in a diagnostic export when possible, then the game offers a reset rather than silently discarding it.
- A save version is mandatory. Unsupported newer versions stop loading with an explanatory message.
- Missing optional content falls back to safe catalog defaults.
- Anomaly transitions are idempotent: repeating an action on an already completed transition does not duplicate seeds.
- Resetting progress requires confirmation and states exactly what local data will be removed.

## Testing

Automated tests cover:

- Valid, invalid, hostile, oversized, and forward-version character cards.
- Catalog lookup and the guarantee that imported numeric or unknown fields cannot alter mechanics.
- Every anomaly transition and compound chain.
- Reward idempotency.
- Burden and Quirk invariants.
- Save/load round trips and migrations from an empty state.
- Seed planting, removal, and recovery.
- Deterministic random character generation.

Browser-level tests cover the critical path from Surprise Me through the first planted Memory Seed, import error recovery, reload persistence, and data reset.

Manual verification covers keyboard-only completion, common desktop viewport sizes, interaction readability, animation timing, and whether a first-time tester can reach a surprising reaction without explanation.

## Prototype Acceptance Checklist

- The app starts locally with one documented command.
- The critical path works without network access after dependencies are installed.
- No external AI key is required.
- A player can use a built-in character immediately.
- Pasted character cards cannot grant unknown mechanics or altered power.
- Four Gifts, Burdens, and Quirks are represented.
- At least eight anomalies and four compound reactions exist.
- At least four distinct Memory Seeds can be planted.
- Reloading preserves progress.
- Automated tests and the production build pass.
- The repository documents controls, the AI creation workflow, current limitations, and how to reset local data.

## Decision After the Prototype

Do not add multiplayer automatically. First test the prototype with at least five people who did not build it. Proceed to a multiplayer vertical slice only if most testers independently understand why importing an AI-created character matters, reach a compound reaction, and express interest in seeing what their character could do with another player's character.
