# Procedural Worlds and On-Device Story Design

## Goal

Make every new playthrough of The Unwritten feel like a new tale. A new run keeps the player's current companion but receives a new world seed, a changed meadow layout and atmosphere, a new ordering of discoveries, and a character-shaped story. Story generation can be enhanced by a small language model that runs inside the browser; game rules and rewards remain deterministic and local.

## What “new every time” means

- Reloading resumes the current run. It must never erase progress.
- Choosing **Begin another tale** starts a new run with a cryptographically random 32-bit seed.
- A new run keeps the companion's name, appearance, Gift, Burden, Quirk, and description.
- The new run clears discoveries, seeds, plantings, tutorial progress, chapters, and ending state.
- Fresh browsers also start with a random seed.
- Saves created before this feature retain the legacy fixed layout until the player begins another tale. This prevents moved objects from stranding an existing character or invalidating progress.

## Seeded world generation

`createWorld(seed)` is a pure deterministic function. The same seed returns exactly the same world; different seeds change several visible properties.

The sanctuary and its six plots stay in the northwest so the core goal remains learnable. Outside it, the generator:

- selects one of several meadow palettes and atmospheric names;
- chooses and perturbs a curved trail through safe placement regions;
- shuffles all eight anomaly templates across separated exploration slots;
- places the four Gift shrines near the route without overlapping anomalies or the sanctuary;
- derives the tutorial spawn from the generated position of the sign;
- generates grass and color-wash positions from the run seed instead of fixed arithmetic.

The anomaly mechanics, transition requirements, seed rewards, interaction radii, world bounds, and six-memory goal do not change. Random generation may change discovery order and travel, never power.

The run seed is persisted as `worldSeed`. All gameplay systems resolve the same `WorldLayout` from it. The renderer, simulation, and tutorial receive or derive that layout rather than importing fixed coordinates.

## Story architecture

Every run immediately receives a readable procedural story; the model is an enhancement, not a boot dependency. `createWovenStory(character, seed)` chooses a coherent set of narrative ingredients using the same deterministic PRNG:

- a place or refuge;
- the companion's former role;
- a disaster that caused the lost memories;
- a vow;
- a recurring sensory motif;
- a final truth.

The trusted story composer turns those ingredients into the opening, eight anomaly chapters, and the six-memory ending. It incorporates the companion's name, Gift, Burden, and Quirk without changing their mechanical effects. The complete `StoryArc` is saved with the run so wording cannot change during a reload.

The existing Road Home and Lantern House text becomes the legacy arc for older saves. New runs use generated titles and prose while retaining the same simple recovery structure.

## Browser-local language model

The optional writer uses `@huggingface/transformers` in a Web Worker with `onnx-community/SmolLM2-135M-Instruct-ONNX` and a quantized dtype. The first opt-in downloads roughly 117–181 MB of model data from Hugging Face; the browser caches it. Inference then happens entirely on the player's device with no API key and no story prompt sent to a game server.

WebGPU is preferred when `navigator.gpu` exists. It is the compute successor to WebGL; WebGL itself is not an LLM runtime. Browsers without WebGPU use the library's WebAssembly/CPU path when available.

The model does not emit HTML or game state. It receives bounded character and seed context and returns JSON narrative ingredients only. The main thread:

1. extracts the first JSON object;
2. validates required string fields and length limits;
3. discards unknown keys;
4. composes safe prose using trusted templates;
5. inserts all text using `textContent`;
6. keeps the procedural arc unchanged on timeout, malformed output, download failure, or unsupported hardware.

The model runs only after explicit opt-in because the first download is substantial. A successful opt-in is stored separately from the run save. Future new runs automatically ask the cached local model to rewrite their narrative ingredients in the background. The deterministic procedural arc remains visible until the rewrite succeeds.

## Progressive UI

No model prompt appears on the opening screen. The existing post-first-memory personalization card gains **Let this device write the tale**. Its explanation states the first-download size and that writing happens locally.

The writer panel uses a “story loom” motif: one continuous golden thread passes through the stages **download**, **read**, and **weave**. It shows honest byte/percentage progress when supplied by the model runtime, remains scrollable on short phones, and offers **Keep the woven version** or **Use the story already here** after failure.

The journal begins with a small tale folio containing the meadow name, run mark, story source (`Woven` or `On-device`), and opening premise. The Help panel replaces destructive **Reset this world** copy with **Begin another tale**, explicitly saying the companion stays while the current meadow and progress are replaced.

Visual additions reuse the existing quiet-paper and meadow language. The one signature element is the animated story thread; it must respect `prefers-reduced-motion`.

## Data model and compatibility

New optional `GameState` fields preserve version-1 compatibility:

```ts
worldSeed?: number;
storyArc?: StoryArc;
```

`storyArc.source` is `woven` or `local-model`. Existing states without the fields use `LEGACY_WORLD_SEED` and the legacy Lantern House arc. New states always contain both fields.

The local-writer preference is not stored inside the run save. It lives under `unwritten.prototype.local-writer.v1`, so starting a new run preserves it while clearing the prior tale.

## Failure and performance behavior

- Gameplay starts instantly from the procedural arc; it never waits for model initialization.
- Model work happens in a Worker so movement and touch controls remain responsive.
- Only one generation job may run at a time.
- Progress and errors are plain-language UI states.
- Closing the writer panel does not cancel or corrupt the run.
- A stale worker result is ignored if the player has already begun another run.
- Local model output cannot rename controls, Gifts, objects, or rewards.

## Testing

Unit tests prove seed determinism, visible divergence across seeds, placement constraints, character-preserving new-run reset, story determinism, story personalization, strict local-output validation, and safe fallback.

Browser tests prove that a fresh browser has a run mark, reload keeps it, **Begin another tale** changes it while preserving the companion, the journal exposes the premise/source, the writer opt-in is postponed until after the first memory, and the writer panel fits a short phone viewport. The actual 100+ MB model is not downloaded in CI; the worker boundary is tested with a protocol-compatible fake while the production worker is typechecked and bundled.

## Out of scope

- Server-side generation or API keys
- Model-written mechanics, numerical traits, maps, rewards, or executable code
- Infinite new anomaly types
- Bundling model weights into the application package
- Multiplayer synchronization of procedural runs
- Deleting the companion when starting a new tale
