# Six Memories and the Lantern House Ending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every recovered keepsake an authored memory chapter and conclude the story when all six sanctuary plots are filled.

**Architecture:** Add a pure memory-chapter catalog and completion helpers, persist only an active chapter and ending acknowledgement, and let the existing controller orchestrate resumable story panels. Derive six-plot progress from `plantings` so old saves need no migration.

**Tech Stack:** TypeScript, Vite, Canvas 2D, browser DOM, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-15-six-memory-ending-design.md`

## Global Constraints

- Any six distinct planted memories complete the story.
- Recovery chapters appear at the final rewarded transformation, not at intermediate reactions.
- Existing saves never receive a backlog of chapter popups.
- An already-full existing sanctuary receives the ending on its next load.
- Chapter and ending cards persist across reload and block keyboard/touch world input.
- The completed meadow remains playable.

---

### Task 1: Memory chapter and completion domain

**Files:**
- Create: `src/domain/memory-arc.ts`
- Modify: `src/domain/types.ts`
- Create: `src/domain/memory-arc.test.ts`

**Interfaces:**
- Produces: `MEMORY_CHAPTERS`, `memoryChapter(id)`, `sanctuaryProgress(state)`, `hasReachedEnding(state)`.
- Extends: `GameState` with optional `pendingChapter?: string` and `endingSeen?: boolean`.

- [ ] **Step 1: Write failing unit tests** for all eight anomaly ids, 0/6 and 6/6 progress, an unseen full-sanctuary ending, and a seen ending that does not reopen.
- [ ] **Step 2: Run `npm test -- src/domain/memory-arc.test.ts`** and confirm the missing module failure.
- [ ] **Step 3: Implement the typed catalog, six-plot derivation, and ending predicate.**
- [ ] **Step 4: Run the focused unit test and the complete unit suite.**
- [ ] **Step 5: Commit** with `feat: define the Lantern House memory arc`.

### Task 2: Resumable recovery chapters

**Files:**
- Modify: `src/game-controller.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Create: `e2e/memory-arc.spec.ts`

**Interfaces:**
- Consumes: `memoryChapter(id)` and `GameState.pendingChapter`.
- Produces: `panels.showMemoryChapter(...)`, controller recovery/resume/dismiss behavior.

- [ ] **Step 1: Write a failing browser test** that completes Singing Tree, sees The Song Below, reloads and sees it again, verifies movement is blocked, dismisses it, and finds the story in the journal.
- [ ] **Step 2: Run the focused Playwright test** and confirm the current toast-only reward fails it.
- [ ] **Step 3: Set `pendingChapter` only for newly rewarded post-tutorial final transformations.**
- [ ] **Step 4: Add the authored chapter card, restore it on startup, clear it only from its action, and block world input while pending.**
- [ ] **Step 5: Render all rewarded chapters in the journal, with The Road Home's chosen meaning preserved.**
- [ ] **Step 6: Run the focused browser test on desktop and a short phone viewport.**
- [ ] **Step 7: Commit** with `feat: reveal a story with every recovered memory`.

### Task 3: Six-plot goal and persisted ending

**Files:**
- Modify: `src/game-controller.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Modify: `e2e/memory-arc.spec.ts`

**Interfaces:**
- Consumes: `sanctuaryProgress(state)` and `hasReachedEnding(state)`.
- Produces: explicit HUD progress, `panels.showEnding(...)`, and saved `endingSeen`.

- [ ] **Step 1: Write failing browser tests** for HUD `5 / 6`, planting the sixth keepsake, reloading the ending, dismissing it to `STORY COMPLETE`, and reopening the finale in the journal.
- [ ] **Step 2: Add a fixture proving an older save with six plantings receives the ending immediately without losing state.**
- [ ] **Step 3: Run the focused tests** and confirm no ending/status exists yet.
- [ ] **Step 4: Render the normal HUD goal from `plantings`, detect completion after plant and on startup, and add the blocking ending panel.**
- [ ] **Step 5: Persist `endingSeen`, keep the meadow playable, and add The Keeper of Lantern House to the journal.**
- [ ] **Step 6: Run the focused ending tests and complete browser suite.**
- [ ] **Step 7: Commit** with `feat: complete the story at six sanctuary memories`.

### Task 4: Documentation, visual QA, and integration

**Files:**
- Modify: `README.md`
- Test: `src/**/*.test.ts`
- Test: `e2e/*.spec.ts`

**Interfaces:**
- No new interfaces; verifies the integrated arc.

- [ ] **Step 1: Update README** with the six-memory goal, per-recovery chapters, ending behavior, and continued free exploration.
- [ ] **Step 2: Run `npm test`, `npm run build`, and `npm run test:e2e`.**
- [ ] **Step 3: Inspect desktop, 390×844, and 390×480 layouts with no console errors.**
- [ ] **Step 4: Run `git diff --check` and independent code review.**
- [ ] **Step 5: Fix all Critical/Important findings and rerun the complete verification suite.**
- [ ] **Step 6: Merge locally into `main`, confirm `http://127.0.0.1:4173/`, and provide the URL.**
