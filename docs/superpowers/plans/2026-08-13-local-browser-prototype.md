# Local Browser Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished local browser prototype in which a player imports or generates a balanced AI character, transforms anomalies, earns Memory Seeds, plants them in a sanctuary, and retains progress across reloads.

**Architecture:** A Vite-hosted TypeScript application separates pure domain rules from a canvas renderer, DOM panels, and localStorage persistence. Data-defined anomaly state machines produce deterministic transitions and rewards; the browser controller translates input into pure simulation commands and persists each meaningful state change.

**Tech Stack:** TypeScript, Vite, HTML5 Canvas, CSS, Vitest, Playwright, browser localStorage.

**Spec:** `docs/superpowers/specs/2026-08-13-ai-character-discovery-prototype-design.md`

## Global Constraints

- Desktop-first browser experience with keyboard movement and mouse interaction; touch controls are excluded.
- No runtime network request and no external AI key.
- No multiplayer, accounts, payments, combat, trading, live AI, or uploaded media.
- Gameplay accepts only catalog identifiers and ignores imported numeric or unknown fields.
- The player can start immediately with a generated character.
- Progress is versioned and stored locally.
- All reward-producing transitions are idempotent.
- The game has no timer, energy, forced ending, or inventory capacity.

## File Map

- `package.json`: scripts and pinned development dependencies.
- `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`: tool configuration.
- `index.html`, `src/styles.css`: application shell and visual system.
- `src/domain/types.ts`: shared value types and save schema.
- `src/domain/catalog.ts`: Gift, Burden, Quirk, and appearance definitions.
- `src/domain/character.ts`: validation, normalization, random generation, and AI context packet.
- `src/domain/world.ts`: map, anomalies, shrines, planting plots, and content definitions.
- `src/domain/simulation.ts`: pure movement, interaction, transitions, rewards, and planting rules.
- `src/persistence/save-store.ts`: versioned localStorage adapter and diagnostic export.
- `src/ui/canvas-renderer.ts`: world and avatar rendering.
- `src/ui/panels.ts`: start, import, character, journal, seed tray, help, and confirmation panels.
- `src/game-controller.ts`: browser input, animation loop, orchestration, and persistence calls.
- `src/main.ts`: composition root.
- `src/**/*.test.ts`: unit and integration tests colocated with the modules they cover.
- `e2e/prototype.spec.ts`: browser-level critical-path tests.
- `README.md`: launch, controls, AI import workflow, limitations, and reset instructions.

---

### Task 1: Project shell and visual frame

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `src/styles.css`
- Create: `src/main.ts`
- Test: `e2e/shell.spec.ts`

**Interfaces:**
- Produces: `#game-canvas`, `#hud`, `#modal-root`, and `#toast-root` elements used by later UI modules.

- [ ] **Step 1: Create the tool configuration and shell test**

Use scripts `dev`, `test`, `test:e2e`, `build`, and `preview`. Configure Playwright to launch `npm run dev -- --host 127.0.0.1` on port 4173. The first browser test asserts that the page title is `The Unwritten`, the canvas is visible, and the start panel contains `Create with your AI`, `Import Character`, and `Surprise Me`.

- [ ] **Step 2: Run the shell test to verify it fails**

Run: `npm install && npx playwright install chromium && npm run test:e2e -- e2e/shell.spec.ts`

Expected: FAIL because the app shell does not exist.

- [ ] **Step 3: Implement the accessible HTML shell and paper-diorama CSS system**

Create a full-viewport layout with the canvas behind a compact HUD, modal root, and toast region. Define CSS variables for ink, paper, dusk, moss, tide, gold, danger, and focus; use layered gradients, cut-paper borders, readable focus rings, and responsive desktop sizing. `main.ts` renders the temporary start panel required by the test.

- [ ] **Step 4: Verify the shell**

Run: `npm run test:e2e -- e2e/shell.spec.ts && npm run build`

Expected: both commands PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts playwright.config.ts index.html src/styles.css src/main.ts e2e/shell.spec.ts
git commit -m "feat: establish browser prototype shell"
```

### Task 2: Trusted character catalog and importer

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/catalog.ts`
- Create: `src/domain/character.ts`
- Test: `src/domain/character.test.ts`

**Interfaces:**
- Produces: `Character`, `CharacterCard`, `CharacterValidation`, `validateCharacterCard(input: string): CharacterValidation`, `generateCharacter(seed: number): Character`, and `AI_CONTEXT_PACKET`.

- [ ] **Step 1: Write importer tests**

Cover the valid Morrow card from the spec; malformed JSON; missing fields; HTML in name and description; oversized fields; unknown catalog identifiers; version 2; unknown fields; hostile `__proto__` content; submitted `power`, `speed`, and `stats` fields; and deterministic random generation. Assert that validation returns all field errors at once and that a normalized character contains only trusted catalog-derived gameplay definitions.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/character.test.ts`

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 3: Implement types, catalogs, validation, normalization, and generation**

Define exact identifier unions for four Gifts, Burdens, Quirks, bodies, materials, palettes, and marks. Define immutable catalogs containing player-facing names and descriptions. Parse JSON into an unknown record without object merging, allow name lengths 1–24 and description lengths 1–180, remove `<` and `>` from prose, reject unsupported identifiers and versions, and construct `Character` exclusively from catalog lookups. Generate characters with a seeded Mulberry32 generator.

- [ ] **Step 4: Add the copyable AI context packet**

The packet enumerates every allowed identifier, includes the exact JSON schema and one example, limits prose lengths, prohibits extra mechanics and numeric statistics, and instructs the external AI to output JSON only.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/domain/character.test.ts && npm run build`

Expected: PASS.

```bash
git add src/domain/types.ts src/domain/catalog.ts src/domain/character.ts src/domain/character.test.ts
git commit -m "feat: add balanced character import system"
```

### Task 3: Deterministic anomaly simulation

**Files:**
- Create: `src/domain/world.ts`
- Create: `src/domain/simulation.ts`
- Test: `src/domain/simulation.test.ts`

**Interfaces:**
- Consumes: `Character` and `GiftId` from Task 2.
- Produces: `createInitialState(character: Character): GameState`, `movePlayer(state, delta, elapsedMs): GameState`, `inspectNearest(state): InteractionResult`, `activateGift(state): InteractionResult`, `activateShrine(state): InteractionResult`, `plantSeed(state, plotId): InteractionResult`, and `removePlanting(state, plotId): InteractionResult`.

- [ ] **Step 1: Write simulation tests**

Test bounded movement; nearest-object selection; all first transitions; these four compound chains: Silent Stone to Singing Tree, Covered Sign to Restored Waypost, Dry Pool to Whispering Pool, and Tangled Root to Hidden Door; shrine range and borrowed Gift behavior; one reward per completed chain; no duplicate reward from repeated actions; rooted movement lock; fading recovery near light; fragile recovery after rest; loud decorative wake-up without rewards; and the four optional Quirk reactions.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/domain/simulation.test.ts`

Expected: FAIL because world and simulation modules do not exist.

- [ ] **Step 3: Implement data-defined world content**

Create one 3200 by 1800 world containing the sanctuary, gate, eight anomalies, four Resonance Shrines, six light sources, decorative props, and six planting plots. Each anomaly defines explicit state labels, required Gift identifiers, reaction copy, visual recipe, and an optional final Memory Seed identifier.

- [ ] **Step 4: Implement pure simulation commands**

Keep all coordinates and state transitions serializable. Return `{ state, message, changed }` from interactions. Clamp movement to world bounds, track proximity, lend a shrine Gift only inside its radius, apply Burden timers without failure states, update optional Quirk presentation state, and store rewarded chain identifiers in a set-like array before issuing seeds.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/domain/simulation.test.ts && npm run build`

Expected: PASS.

```bash
git add src/domain/world.ts src/domain/simulation.ts src/domain/simulation.test.ts
git commit -m "feat: implement anomaly discovery simulation"
```

### Task 4: Versioned browser persistence

**Files:**
- Create: `src/persistence/save-store.ts`
- Test: `src/persistence/save-store.test.ts`

**Interfaces:**
- Consumes: `GameState` from Task 3.
- Produces: `createSaveStore(storage: StorageLike): SaveStore` with `load()`, `save(state)`, `clear()`, and `exportDiagnostic()`.

- [ ] **Step 1: Write persistence tests**

Use an in-memory `StorageLike`. Cover empty load, save/load round trip, unsupported newer version, malformed JSON, missing fields, deterministic migration from version 0, diagnostic preservation after corruption, and complete clearing of save and diagnostic keys.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/persistence/save-store.test.ts`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the adapter**

Store under `unwritten.prototype.save.v1` and diagnostics under `unwritten.prototype.diagnostic`. Validate the structural fields required to resume, copy corrupt raw data into the diagnostic key, and return typed result variants `empty`, `loaded`, `corrupt`, or `newer-version`. Do not silently reset data.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/persistence/save-store.test.ts && npm run build`

Expected: PASS.

```bash
git add src/persistence/save-store.ts src/persistence/save-store.test.ts
git commit -m "feat: persist versioned prototype progress"
```

### Task 5: Canvas world and modular character rendering

**Files:**
- Create: `src/ui/canvas-renderer.ts`
- Create: `src/ui/canvas-renderer.test.ts`

**Interfaces:**
- Consumes: `GameState`, character catalog entries, and world definitions.
- Produces: `createCanvasRenderer(canvas): CanvasRenderer` with `resize()`, `render(state, now)`, and `worldToScreen(point)`.

- [ ] **Step 1: Write renderer contract tests**

Use a recording canvas context and assert camera clamping, world-to-screen conversion, draw-order groups, distinct silhouette dispatch for fox/moth/bird/wisp, material treatment dispatch, palette colors, mark overlay dispatch, focus highlight rendering, and reduced-motion behavior.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/ui/canvas-renderer.test.ts`

Expected: FAIL because the renderer does not exist.

- [ ] **Step 3: Implement the renderer**

Draw layered paper terrain, paths, water, sanctuary plots, shrines, anomalies by state, decorative props, particles, and the modular avatar. Center the camera on the player while clamping it to world boundaries. Provide obvious interaction rings and screen-edge hints for nearby discoveries. Use geometric Canvas primitives rather than external image assets.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/ui/canvas-renderer.test.ts && npm run build`

Expected: PASS.

```bash
git add src/ui/canvas-renderer.ts src/ui/canvas-renderer.test.ts
git commit -m "feat: render the paper discovery world"
```

### Task 6: Complete browser interaction and panels

**Files:**
- Create: `src/ui/panels.ts`
- Create: `src/game-controller.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`
- Test: `src/ui/panels.test.ts`

**Interfaces:**
- Consumes: character APIs, simulation commands, renderer, and `SaveStore`.
- Produces: a complete browser application controlled by WASD or arrow keys, `E` interaction, `F` Gift activation, `J` journal, `C` character card, and mouse buttons.

- [ ] **Step 1: Write panel and controller integration tests**

Test start-action callbacks, context packet copying, import errors staying editable, successful import, generated start, HUD updates, journal entries, seed tray updates, planting confirmation, removal confirmation, help display, corrupt-save recovery display, and reset confirmation wording.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/ui/panels.test.ts`

Expected: FAIL because panels and controller do not exist.

- [ ] **Step 3: Implement panels and controller**

Build panels with DOM APIs and `textContent`, never imported HTML. Compose the app in `main.ts`. The controller owns key state, animation timing, command dispatch, toast messages, saving after meaningful changes, and pausing movement while a modal is open. Keep `Surprise Me` as the visually dominant start action and make the external-AI flow understandable in one panel.

- [ ] **Step 4: Refine the visual hierarchy**

Give the character passport a collectible-card appearance, make Gift/Burden/Quirk visually distinct, keep controls in a low-contrast footer, present interaction prompts adjacent to the canvas focus area, and animate new discoveries without obscuring movement. Respect `prefers-reduced-motion`.

- [ ] **Step 5: Verify and commit**

Run: `npm test && npm run build`

Expected: PASS.

```bash
git add src/ui/panels.ts src/ui/panels.test.ts src/game-controller.ts src/main.ts src/styles.css
git commit -m "feat: connect character creation to exploration"
```

### Task 7: Browser critical path, documentation, and release verification

**Files:**
- Modify: `e2e/shell.spec.ts`
- Create: `e2e/prototype.spec.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: the complete application.
- Produces: reproducible launch and verification instructions.

- [ ] **Step 1: Write the browser critical-path tests**

Test Surprise Me through one first transition; imported Morrow through a compound transition and seed reward; travel to sanctuary and planting; reload persistence; invalid import recovery; keyboard operation; journal opening; and confirmed data reset. Use deterministic `data-testid` selectors and seed localStorage where navigation time would not add coverage.

- [ ] **Step 2: Run the browser tests and fix only observed failures**

Run: `npm run test:e2e`

Expected: all browser tests PASS in Chromium.

- [ ] **Step 3: Write README instructions**

Document `npm install`, `npm run dev`, the printed local URL, controls, AI context-copy/import steps, example JSON, test/build commands, localStorage behavior, reset behavior, and every prototype exclusion from the spec.

- [ ] **Step 4: Run the complete release verification**

Run: `npm test && npm run test:e2e && npm run build`

Expected: all unit tests, browser tests, TypeScript checks, and the production build PASS.

- [ ] **Step 5: Manually verify in a browser**

Launch `npm run dev -- --host 127.0.0.1`, complete Surprise Me, activate a Gift, borrow a Resonance Gift, complete a chain, plant its seed, reload, and confirm persistence. Inspect at 1280x720 and 1440x900 with no console errors.

- [ ] **Step 6: Commit**

```bash
git add e2e/shell.spec.ts e2e/prototype.spec.ts README.md
git commit -m "test: verify complete local prototype journey"
```
