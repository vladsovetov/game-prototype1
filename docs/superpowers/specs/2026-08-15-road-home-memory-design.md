# The Road Home — First Memory Design

## Problem

The prototype currently teaches a sequence of mechanics—change an object, borrow a Gift, change it again, plant a reward—but never gives those actions narrative meaning. Players cannot tell what a “memory” contains, why an object should be transformed, or what completing the sequence accomplishes.

## Player-facing purpose

The game is about helping a strange companion discover who they were by reconstructing lost memories, then deciding what those memories mean.

The first playable memory is **The Road Home**. The central question is: **Who kept the light burning for this character?** Every tutorial action must visibly advance that question.

## First-memory flow

1. A randomly generated companion wakes without remembering where home was. Their starting Gift is Reveal so every new player receives the same authored first story while appearance, name, Burden, and Quirk remain random.
2. The HUD names the active goal: `THE ROAD HOME · 0/2 CLUES`. Lights guide the player to a rain-covered sign.
3. Reveal restores erased letters. A blocking story beat explains the first clue: the words “Lantern House” feel familiar; this was a road the companion once followed.
4. The sign remains physically broken. The HUD becomes `1/2 CLUES` and guides the player to borrow Mend, explicitly explaining that a second Gift finishes the scene.
5. Mend restores the sign. A second story beat explains the recovered memory: the companion followed the sign through a storm toward a light someone kept burning.
6. The recovered Waypost is brought to the sanctuary and placed there. The game explains that recovered memories become visible parts of the player’s home.
7. The player answers “Who kept the light burning?” using one of three authored answers or a short custom answer. This answer becomes part of the saved memory and journal.
8. Optional character personality, visual, and AI customization follows. It remains cosmetic/narrative and cannot increase power.

## Meaning and progression

- A transformation is not generic crafting. It reveals or repairs one piece of a named memory.
- A recovered memory contains an authored event plus one player-defined detail.
- Planting is not storage. It makes the recovered story persist visibly in the sanctuary.
- The journal groups clues, the recovered story, and the player’s answer under **The Road Home**.
- After onboarding, the HUD states that one memory has been recovered. Future chapters can follow the same structure, but this prototype implements only one complete memory.

## Language rules

The opening flow must not use the terms “anomaly,” “Memory Seed,” or unexplained “Resonance.” Use concrete object and action language: rain-covered sign, clue, borrow Mend, restore, Waypost, recovered memory. “Resonance Shrine” may remain in later Help text only after the player has used one.

## State and compatibility

- Add optional `memoryDetails` to `GameState` so existing version-1 saves remain loadable.
- Add a `remember` tutorial step between planting and optional personalization.
- New games always start with Reveal and the Covered Sign route; existing saves continue from their stored tutorial state.
- The selected/custom memory answer is capped at 100 characters, sanitized by text-only DOM insertion, autosaved, and displayed in the journal.

## Success criteria

- Before moving, a new player can say the goal is to recover The Road Home for their companion.
- After each transformation, the player sees what was learned and why the next action matters.
- The HUD always shows memory name and clue progress during onboarding.
- Completing the flow records a meaningful story plus player choice in the journal.
- Keyboard and touch controls both complete the same story without regression.
