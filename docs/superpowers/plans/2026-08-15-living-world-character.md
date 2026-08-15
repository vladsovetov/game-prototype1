# Living World and Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build visibly different AI-directed regions, practical tools, cosmetic equipment, varied story frames, and a directional walking character.

**Architecture:** A persisted `RunDirection` is the shared boundary between the local model, story composer, world generator, equipment setup, and renderer. Existing IDs remain compatible, while the controller supplies only transient movement pose to the renderer.

**Tech Stack:** TypeScript, Canvas 2D, Vite, Vitest, Playwright, Transformers.js Web Worker.

**Spec:** `docs/superpowers/specs/2026-08-15-living-world-character-design.md`

## Global Constraints

- Keep save version `1` and migrate missing optional fields.
- Keep all UI text Ukrainian.
- Equipment is cosmetic only.
- Preserve keyboard, arrow-key, and touch movement.
- The procedural fallback must remain fully playable without AI.
- Use the existing local model and worker; do not add a larger download.

---

### Task 1: Run direction, story frames, and structural regions

**Files:**
- Create: `src/domain/run-direction.ts`
- Create: `src/domain/run-direction.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/story.ts`
- Modify: `src/domain/story.test.ts`
- Modify: `src/domain/world.ts`
- Modify: `src/domain/world.test.ts`

**Interfaces:**
- Produces: `createRunDirection(seed: number, modelSignal?: string): RunDirection`
- Produces: `directionFor(state: Pick<GameState, 'worldSeed' | 'storyArc'>): RunDirection`
- Extends: `StoryArc.direction?: RunDirection`
- Extends: `WorldLayout.scenery: SceneryObject[]`, `WorldLayout.routes: Point[][]`

- [ ] Write failing tests asserting deterministic direction, four reachable regions, different story-frame openings/endings, and region-specific scenery kinds/routes.
- [ ] Run `npx vitest run src/domain/run-direction.test.ts src/domain/story.test.ts src/domain/world.test.ts` and confirm failures name missing direction/scenery behavior.
- [ ] Implement curated direction tables, four story-frame composers, and four regional layout factories.
- [ ] Run the focused tests and confirm they pass.
- [ ] Commit with `feat: generate distinct directed regions and stories`.

### Task 2: Practical tools and cosmetic equipment

**Files:**
- Create: `src/domain/equipment.ts`
- Create: `src/domain/equipment.test.ts`
- Modify: `src/domain/catalog.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/world.ts`
- Modify: `src/domain/simulation.ts`
- Modify: `src/domain/simulation.test.ts`
- Modify: `src/domain/localization.ts`
- Modify: `src/domain/localization.test.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Modify: `src/game-controller.ts`

**Interfaces:**
- Produces: `startingEquipment(direction: RunDirection): Pick<GameState, 'wardrobe' | 'equipped'>`
- Produces: `equipWearable(state: GameState, wearable: WearableId): GameState`
- Changes: `showCharacter(state: GameState, onEquip: (id: WearableId) => void): void`

- [ ] Write failing tests for starting equipment, one item per slot, unlock-on-memory, and old-save defaults.
- [ ] Run the equipment, simulation, and localization tests and confirm expected failures.
- [ ] Implement wearables, migration, practical catalog copy, logical object copy, unlocks, and wardrobe controls.
- [ ] Run focused unit tests and add a browser test that equips an owned item and sees its selected state persist after reload.
- [ ] Run the browser test red, implement the controller/UI wiring, and run it green.
- [ ] Commit with `feat: add practical tools and visible equipment`.

### Task 3: Directional biped and region rendering

**Files:**
- Modify: `src/ui/canvas-renderer.ts`
- Modify: `src/ui/canvas-renderer.test.ts`
- Modify: `src/game-controller.ts`
- Create: `e2e/directional-avatar.spec.ts`

**Interfaces:**
- Produces: `movementPose(dx: number, dy: number): { facing: Facing; walking: boolean }`
- Changes: `renderer.render(state, now, pose)`
- Exposes: canvas renderer diagnostic data attributes for current facing/walking/equipment so browser behavior can be asserted without testing pixels.

- [ ] Write failing unit tests for dominant-axis facing and idle pose.
- [ ] Run the renderer tests and confirm failure because pose support is absent.
- [ ] Implement transient controller pose, region scenery drawings, biped limbs, directional faces, equipment layers, and reduced-motion handling.
- [ ] Run focused unit tests green.
- [ ] Write and run a failing browser test for four-direction pose updates through real keyboard input.
- [ ] Add only the observable pose attributes needed by the renderer and run the browser test green.
- [ ] Commit with `feat: animate a directional equipped traveler`.

### Task 4: Local AI directs the opening run

**Files:**
- Modify: `src/story/local-story-worker.ts`
- Modify: `src/story/local-story-writer.ts`
- Modify: `src/story/local-story-writer.test.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/game-controller.ts`
- Modify: `src/main.ts`
- Modify: `e2e/local-writer.spec.ts`

**Interfaces:**
- Local writer still emits `StoryArc`, now with `direction`.
- `applyLocalStory(story)` applies story direction, starting equipment, and wake-position rebasing atomically.
- `showWake(...)` receives an optional local-generation action.

- [ ] Write failing writer tests proving two model signals change frame/region/equipment and remain Ukrainian.
- [ ] Update the local-writer browser test to require the generation choice on the wake screen and the personalization screen to omit it; run red.
- [ ] Extend the compact prompt from six story motifs to run direction motifs without requiring JSON.
- [ ] Apply direction and equipment before wake, restore the wake card after completion/dismissal, and auto-open generation for enabled new runs.
- [ ] Run focused writer and browser tests green.
- [ ] Commit with `feat: direct each journey with local AI at opening`.

### Task 5: Visual critique, compatibility, and complete verification

**Files:**
- Modify as required by evidence only.
- Modify: `README.md`

**Interfaces:** None.

- [ ] Run `npm test`, `npm run build`, and `npx playwright test --workers=4`.
- [ ] Inspect two seeded regions at desktop and phone sizes; verify scenery distinction, practical labels, equipment visibility, and all four walking directions.
- [ ] Fix only observed defects with a failing regression first.
- [ ] Update README controls and local-AI explanation.
- [ ] Re-run the full commands and `git diff --check`.
- [ ] Commit with `docs: explain directed journeys and equipment`.
