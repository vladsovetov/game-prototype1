# The Road Home Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract first tutorial with one complete, understandable memory story called The Road Home.

**Architecture:** Keep the deterministic simulation and existing world interactions. Add a focused memory-story domain module for authored copy/progress, extend the tutorial state machine with one meaning-choice step, and let the controller orchestrate story-beat panels around the existing Reveal → Mend → plant actions.

**Tech Stack:** TypeScript, Vite, Canvas 2D, browser DOM, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-15-road-home-memory-design.md`

## Global Constraints

- New companions keep random name, appearance, Burden, and Quirk but always start with Reveal.
- The first memory always uses Covered Sign → Remembered Sign → Restored Waypost and borrowed Mend.
- Existing version-1 saves remain loadable; `memoryDetails` is optional.
- Player-authored memory detail is text-only and capped at 100 characters.
- Keyboard and touch controls must remain equivalent.
- Do not expose “anomaly” or “Memory Seed” terminology during onboarding.

---

### Task 1: Fixed authored memory state and progress

**Files:**
- Create: `src/domain/memory.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/tutorial.ts`
- Modify: `src/domain/tutorial.test.ts`

**Interfaces:**
- Produces: `ROAD_HOME`, `memoryProgress(state)`, and `memoryStory(state)`.
- Extends: `TutorialStep` with `remember`; `GameState` with optional `memoryDetails?: Record<string, string>`.

- [ ] **Step 1: Write failing unit tests** proving every new tutorial targets `sign`, uses `reveal`, borrows `mend`, reports literal clue progress, and requires `memory-shaped` between planting and personalization.
- [ ] **Step 2: Run `npm test -- src/domain/tutorial.test.ts`** and confirm failures describe the old gift-dependent routes and missing step.
- [ ] **Step 3: Implement the minimal domain changes**: authored Road Home metadata, fixed Reveal/Mend route, `remember` transition, progress mapping, and optional saved detail.
- [ ] **Step 4: Run `npm test -- src/domain/tutorial.test.ts`** and confirm the focused tests pass.
- [ ] **Step 5: Commit** with `feat: define the Road Home memory`.

### Task 2: Purpose-first opening, HUD, and story beats

**Files:**
- Modify: `e2e/onboarding.spec.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/game-controller.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `ROAD_HOME`, `memoryProgress(state)`, existing `useGift()` and `interact()` controller paths.
- Produces: `panels.showMemoryBeat(...)` and `panels.showMemoryChoice(...)`.

- [ ] **Step 1: Add failing browser tests** for purpose text before Wake Up, `THE ROAD HOME · 0/2 CLUES` after waking, the Lantern House clue after Reveal, and the recovered-memory explanation after Mend.
- [ ] **Step 2: Run the focused Playwright tests** and confirm each fails against the abstract tutorial.
- [ ] **Step 3: Implement opening and HUD copy** with concrete object/action language and clue progress.
- [ ] **Step 4: Implement blocking clue/recovery story cards** shown only after the routed stage changes successfully.
- [ ] **Step 5: Run the focused Playwright tests** and confirm they pass on desktop and phone viewports.
- [ ] **Step 6: Commit** with `feat: tell the Road Home story during play`.

### Task 3: Player-shaped meaning and journal payoff

**Files:**
- Modify: `e2e/prototype.spec.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/game-controller.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: tutorial `remember` step and `GameState.memoryDetails`.
- Produces: saved `memoryDetails['road-home']` and a Road Home journal section.

- [ ] **Step 1: Add failing browser tests** that plant the Waypost, choose “A family they chose,” finish personalization, and find both The Road Home and the chosen meaning in the journal.
- [ ] **Step 2: Run the focused test** and confirm it fails because planting currently jumps directly to personalization.
- [ ] **Step 3: Implement the memory-choice panel** with three authored choices plus a 100-character custom answer.
- [ ] **Step 4: Save the answer, advance `remember → personalize`, and render the recovered story and answer in the journal.**
- [ ] **Step 5: Run the focused browser test** and confirm the full payoff passes.
- [ ] **Step 6: Commit** with `feat: let players shape recovered memories`.

### Task 4: Copy cleanup, docs, and complete verification

**Files:**
- Modify: `src/ui/panels.ts`
- Modify: `src/domain/simulation.ts`
- Modify: `README.md`
- Test: `e2e/*.spec.ts`

**Interfaces:**
- No new interfaces; validates the complete integrated experience.

- [ ] **Step 1: Add or update assertions** ensuring onboarding-visible copy does not say “anomaly” or “Memory Seed,” while Help explains advanced mechanics only after onboarding.
- [ ] **Step 2: Update interaction messages and README** to describe named memories, clues, restored objects, and sanctuary meaning.
- [ ] **Step 3: Run `npm run build`**, expecting successful TypeScript and Vite production output.
- [ ] **Step 4: Run `npm test`**, expecting all unit tests to pass.
- [ ] **Step 5: Run `npx playwright test`**, expecting all keyboard, touch, story, persistence, and responsive journeys to pass.
- [ ] **Step 6: Run `git diff --check`** and inspect the final working tree.
- [ ] **Step 7: Commit** with `docs: explain the Road Home game loop`.
