# Procedural Worlds and On-Device Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every new run a seeded random meadow and coherent character-shaped story, with an optional browser-local LLM that rewrites narrative ingredients without controlling gameplay.

**Architecture:** Persist a 32-bit `worldSeed` and a complete `StoryArc` in each new state. Resolve all positions and visual atmosphere through a pure cached `createWorld(seed)` function, and compose trusted chapter prose from validated `StoryIngredients`. A lazy Web Worker runs a small quantized Transformers.js model; the main thread validates its JSON and atomically replaces only the saved story arc.

**Tech Stack:** TypeScript, Canvas 2D, Vite, Vitest, Playwright, Web Workers, `@huggingface/transformers`, WebGPU with WebAssembly fallback, localStorage.

**Spec:** `docs/superpowers/specs/2026-08-15-procedural-local-story-design.md`

## Global Constraints

- Reloading resumes the same run; only **Begin another tale** creates a fresh seed.
- A new tale retains the current `Character` and replaces all run progress.
- Existing version-1 saves without procedural fields retain the legacy fixed layout and Lantern House story.
- Local model output may replace narrative ingredients only; it cannot affect mechanics, positions, controls, rewards, or HTML.
- The game starts immediately with deterministic story text and never blocks on model availability.
- The first model download is opt-in and disclosed as approximately 120–180 MB.
- Every user-visible model output is validated, length-limited, and inserted through `textContent`.
- Phone layouts remain usable at 390 × 480 CSS pixels, and motion respects `prefers-reduced-motion`.

---

### Task 1: Seeded World Definition

**Files:**
- Create: `src/domain/random.ts`
- Modify: `src/domain/world.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/simulation.ts`
- Modify: `src/domain/tutorial.ts`
- Modify: `src/ui/canvas-renderer.ts`
- Create: `src/domain/world.test.ts`
- Modify: `src/domain/simulation.test.ts`
- Modify: `src/domain/tutorial.test.ts`
- Modify: `src/ui/canvas-renderer.test.ts`

**Interfaces:**
- Produces: `seededRandom(seed: number): () => number`
- Produces: `randomSeed(source?: () => number): number`
- Produces: `createWorld(seed?: number): WorldLayout`
- Produces: `worldFor(state: Pick<GameState, 'worldSeed'>): WorldLayout`
- Adds: `GameState.worldSeed?: number`
- Changes: world-dependent domain and renderer functions resolve the layout from state.

- [ ] **Step 1: Write failing deterministic-world tests**

  Add literal assertions proving `createWorld(1234)` is stable, `createWorld(5678)` visibly differs, all anomalies are separated and outside the sanctuary, all four Gifts exist once, and `randomSeed(() => 0.5)` returns a non-negative uint32. Add consumer tests proving `nearestTarget`, tutorial spawn/target, and renderer camera bounds use a state's generated world.

- [ ] **Step 2: Run tests and verify RED**

  Run: `npm test -- src/domain/world.test.ts src/domain/simulation.test.ts src/domain/tutorial.test.ts src/ui/canvas-renderer.test.ts`

  Expected: FAIL because `createWorld`, `worldFor`, `randomSeed`, and `worldSeed` do not exist.

- [ ] **Step 3: Implement the pure generator and route consumers through it**

  Define focused types:

  ```ts
  export interface WorldTheme {
    name: string;
    ground: [string, string, string];
    washes: string[];
    trail: string;
  }

  export interface WorldLayout {
    seed: number;
    width: number;
    height: number;
    sanctuary: { x: number; y: number; w: number; h: number };
    gate: Point;
    theme: WorldTheme;
    trail: [Point, Point, Point, Point];
    anomalies: Anomaly[];
    shrines: Shrine[];
    plots: Plot[];
    grass: Point[];
  }
  ```

  Keep `LEGACY_WORLD_SEED` as an explicit sentinel that returns today's coordinates and palette. For other seeds, shuffle the fixed anomaly templates across prevalidated slots and apply bounded jitter. Cache layouts by seed so render frames do not regenerate arrays.

- [ ] **Step 4: Run focused tests and verify GREEN**

  Run: `npm test -- src/domain/world.test.ts src/domain/simulation.test.ts src/domain/tutorial.test.ts src/ui/canvas-renderer.test.ts`

  Expected: all focused tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add src/domain/random.ts src/domain/world.ts src/domain/types.ts src/domain/simulation.ts src/domain/tutorial.ts src/ui/canvas-renderer.ts src/domain/world.test.ts src/domain/simulation.test.ts src/domain/tutorial.test.ts src/ui/canvas-renderer.test.ts
  git commit -m "feat: generate every new meadow from a seed"
  ```

### Task 2: Character-Shaped Procedural Story

**Files:**
- Create: `src/domain/story.ts`
- Create: `src/domain/story.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/memory.ts`
- Modify: `src/domain/memory-arc.ts`
- Modify: `src/domain/memory-arc.test.ts`
- Modify: `src/domain/simulation.ts`
- Modify: `src/domain/tutorial.ts`
- Modify: `src/game-controller.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/persistence/save-store.ts`
- Modify: `src/persistence/save-store.test.ts`

**Interfaces:**
- Produces: `StoryIngredients`, `StoryArc`, and `StorySource = 'woven' | 'local-model'`
- Produces: `createWovenStory(character: Character, seed: number): StoryArc`
- Produces: `composeStory(character: Character, seed: number, ingredients: StoryIngredients, source: StorySource): StoryArc`
- Produces: `storyFor(state: GameState): StoryArc`
- Produces: `prepareNewRun(character: Character, seed?: number): GameState`
- Adds: `GameState.storyArc?: StoryArc`

- [ ] **Step 1: Write failing story and compatibility tests**

  Prove that the same character/seed returns identical complete arcs, a different seed changes the premise and at least one chapter, the companion's name and one trait appear in the arc, all eight anomaly IDs have non-empty chapters, and six-memory ending copy exists. Prove new state creation stores both `worldSeed` and `storyArc`, while loading an older save leaves both absent and resolves to the legacy world/story.

- [ ] **Step 2: Run tests and verify RED**

  Run: `npm test -- src/domain/story.test.ts src/domain/memory-arc.test.ts src/persistence/save-store.test.ts`

  Expected: FAIL because procedural story types and composers do not exist.

- [ ] **Step 3: Implement ingredients and trusted prose composition**

  Use seeded array selection for place, role, disaster, vow, motif, and truth. Compose a complete arc without raw HTML. Replace direct `ROAD_HOME`/`MEMORY_CHAPTERS` lookups in UI flows with `storyFor(state)`, while preserving exported legacy content for old saves and old tests.

  Create new-run state with:

  ```ts
  export function prepareNewRun(character: Character, seed = randomSeed()): GameState {
    const initial = createInitialState(character, seed);
    return prepareTutorial({
      ...initial,
      worldSeed: seed,
      storyArc: createWovenStory(character, seed),
    });
  }
  ```

- [ ] **Step 4: Run focused tests and verify GREEN**

  Run: `npm test -- src/domain/story.test.ts src/domain/memory-arc.test.ts src/persistence/save-store.test.ts src/domain/tutorial.test.ts`

  Expected: all focused tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add src/domain/story.ts src/domain/story.test.ts src/domain/types.ts src/domain/memory.ts src/domain/memory-arc.ts src/domain/memory-arc.test.ts src/domain/simulation.ts src/domain/tutorial.ts src/game-controller.ts src/ui/panels.ts src/persistence/save-store.ts src/persistence/save-store.test.ts
  git commit -m "feat: weave a character-shaped story for each run"
  ```

### Task 3: New Tale Lifecycle and Folio UI

**Files:**
- Modify: `src/main.ts`
- Modify: `src/game-controller.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Create: `e2e/new-tale.spec.ts`

**Interfaces:**
- Adds controller method: `beginNewTale(): void`
- Adds panel action: `onNewTale(): void`
- Updates journal with run folio using `worldSeed`, `WorldTheme.name`, and `StoryArc`.

- [ ] **Step 1: Write failing browser tests**

  Use a fresh storage context to record the companion name and run mark, reload and assert both stay identical, open Help and choose **Begin another tale**, confirm, then assert the run mark changes while the companion name remains. Assert the tutorial returns to wake, the new story premise appears in the journal after opening a playable seeded save, and the Help copy explicitly says progress is replaced but the companion stays.

- [ ] **Step 2: Run browser test and verify RED**

  Run: `npx playwright test e2e/new-tale.spec.ts`

  Expected: FAIL because the run mark, folio, and new-tale action do not exist.

- [ ] **Step 3: Implement lifecycle and visual treatment**

  Add the folio at the top of the journal. Replace reset terminology with **Begin another tale** and use a precise confirmation. `beginNewTale` calls `prepareNewRun(state.character)`, clears transient input/toasts/panels, saves the new state, and shows the wake card without reloading. Update canvas atmosphere from `WorldTheme`.

  Use the established paper/ink palette. Give the folio a pressed run-mark seal rather than generic stat cards. Maintain touch targets, focus styles, scroll bounds, and reduced-motion rules.

- [ ] **Step 4: Run browser and unit suites and verify GREEN**

  Run: `npx playwright test e2e/new-tale.spec.ts`

  Run: `npm test`

  Expected: both commands pass.

- [ ] **Step 5: Commit**

  ```bash
  git add src/main.ts src/game-controller.ts src/ui/panels.ts src/styles.css e2e/new-tale.spec.ts
  git commit -m "feat: begin a fresh tale without losing the companion"
  ```

### Task 4: Browser-Local Story Worker

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/story/local-story-protocol.ts`
- Create: `src/story/local-story-protocol.test.ts`
- Create: `src/story/local-story-worker.ts`
- Create: `src/story/local-story-writer.ts`
- Create: `src/story/local-story-writer.test.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/main.ts`
- Modify: `src/game-controller.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Create: `e2e/local-writer.spec.ts`

**Interfaces:**
- Produces: `parseStoryIngredients(raw: string): { ok: true; value: StoryIngredients } | { ok: false; reason: string }`
- Produces: `createLocalStoryWriter(options): LocalStoryWriter`
- Worker request: `{ type: 'generate'; jobId: string; character: LocalStoryCharacter; seed: number }`
- Worker messages: `progress`, `complete`, and `error`, each carrying the matching `jobId`.
- Adds controller methods: `startLocalStory(): void`, `dismissLocalStory(): void`
- Uses preference key: `unwritten.prototype.local-writer.v1`

- [ ] **Step 1: Write failing parser and writer-state tests**

  Name the breaks explicitly: accepting prose around malformed JSON, accepting empty or overlong required fields, applying a result from a stale job, starting two workers for one run, and replacing the current arc after a worker error. Use a protocol-compatible fake Worker but assert the real writer's status and resulting `StoryArc`, not mock call counts.

- [ ] **Step 2: Run unit tests and verify RED**

  Run: `npm test -- src/story/local-story-protocol.test.ts src/story/local-story-writer.test.ts`

  Expected: FAIL because the local writer boundary does not exist.

- [ ] **Step 3: Install Transformers.js**

  Run: `npm install @huggingface/transformers`

  Expected: dependency and lockfile update successfully with no audit vulnerabilities.

- [ ] **Step 4: Implement protocol, worker, and controller integration**

  The worker dynamically loads the quantized model only after a `generate` request, reports download progress, chooses WebGPU when available and the default WASM backend otherwise, requests a single bounded JSON object, and returns raw text to the main thread. The main thread validates it and calls `composeStory` with `source: 'local-model'`.

  The personalization card adds **Let this device write the tale**. The story-loom panel states the download size before starting, then displays progress and a three-stage thread. On success it shows the new premise and a **Keep this tale** action. On failure it preserves the existing arc and offers **Use the story already here** and **Try again**.

- [ ] **Step 5: Write failing browser UI tests, then implement the minimum UI to pass**

  Stub the worker protocol before app startup. Prove the option is absent from the wake card, present after the first memory, explains on-device behavior and download size, displays progress, applies a valid result to the folio, survives reload, ignores an invalid result, and remains usable at 390 × 480.

  Run before UI implementation: `npx playwright test e2e/local-writer.spec.ts`

  Expected: FAIL on missing option/panel.

  Run after UI implementation: `npx playwright test e2e/local-writer.spec.ts`

  Expected: all local-writer browser tests pass without downloading the real model.

- [ ] **Step 6: Run focused verification and commit**

  Run: `npm test -- src/story/local-story-protocol.test.ts src/story/local-story-writer.test.ts`

  Run: `npm run build`

  Expected: tests and production worker bundle pass.

  ```bash
  git add package.json package-lock.json src/story src/vite-env.d.ts src/main.ts src/game-controller.ts src/ui/panels.ts src/styles.css e2e/local-writer.spec.ts
  git commit -m "feat: write each tale with an on-device model"
  ```

### Task 5: Documentation, Regression, and Live Verification

**Files:**
- Modify: `README.md`
- Modify: existing `e2e/*.spec.ts` only where selectors or generated positions require stable seeded fixtures.

**Interfaces:**
- Documents the new-run definition, first-download cost, browser compute requirements, privacy boundary, and procedural fallback.

- [ ] **Step 1: Update documentation and stable fixtures**

  Explain that WebGPU—not WebGL—accelerates the model; inference is in-browser; the model download is cached; a reload resumes while **Begin another tale** regenerates; and gameplay works without the model. Existing browser tests should seed their stored states explicitly so randomized positions do not make assertions flaky.

- [ ] **Step 2: Run the full verification suite**

  Run: `npm test`

  Run: `npm run build`

  Run: `npm run test:e2e`

  Run: `git diff --check`

  Expected: all unit tests, TypeScript/Vite build, and all Chromium desktop/touch journeys pass with no malformed whitespace.

- [ ] **Step 3: Perform visual browser QA**

  Inspect the wake state, two seeds side by side, journal folio, Help/new-tale confirmation path, story-loom loading/success/error states, and 390 × 480 layout. Check the browser console for errors and confirm the live local URL responds with HTTP 200.

- [ ] **Step 4: Commit**

  ```bash
  git add README.md e2e
  git commit -m "docs: explain generated worlds and local storytelling"
  ```
