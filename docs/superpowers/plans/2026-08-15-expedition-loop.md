# Expedition Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repeatable solo expedition loop with contract selection, two-tool preparation, contextual choices, soft risk, persistent rewards, and visible refuge projects.

**Architecture:** A pure `domain/expedition.ts` state machine owns routes, choices, rewards, reports, and projects. Existing controller, panels, and canvas renderer consume this API without duplicating rules. Expedition state is optional and migrated by localization to preserve version-1 saves.

**Tech Stack:** TypeScript, Canvas 2D, Vite, Vitest, Playwright, browser localStorage

**Spec:** `docs/superpowers/specs/2026-08-15-expedition-loop-design.md`

## Global Constraints

- All new player-facing copy is Ukrainian.
- Solo play must remain complete; multiplayer is out of scope.
- There is no hard timer, stamina gate, paid advantage, or zero-progress failure.
- The player selects exactly two distinct practical tools.
- Refuge projects are cosmetic and never affect reward rates.
- Existing tutorial, saves, keyboard movement, touch movement, six-memory ending, and local-story generation remain functional.

---

### Task 1: Expedition domain state machine

**Files:**
- Create: `src/domain/expedition.ts`
- Create: `src/domain/expedition.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/localization.ts`
- Modify: `src/domain/localization.test.ts`

**Interfaces:**
- Produces: `CONTRACTS`, `REFUGE_PROJECTS`, `expeditionMetaFor`, `startExpedition`, `expeditionTarget`, `availableWorkActions`, `applyWorkAction`, `chooseOptionalLead`, `completeExpedition`, `buildRefugeProject`.
- Consumes: stable anomaly IDs and points from `worldFor(state)` plus existing `GiftId`.

- [ ] Write failing domain tests with literal expectations for: two-distinct-tool validation; deterministic three-site route; only the current site accepting work; exactly one advancement; optional lead adding pressure and rare find; minimum one secured supply; one-time project construction; old-save defaults.
- [ ] Run `npm test -- --run src/domain/expedition.test.ts src/domain/localization.test.ts` and confirm failures are caused by missing expedition behavior.
- [ ] Add expedition/meta/report/project types to `types.ts`, then implement the pure state machine and migration defaults.
- [ ] Run the focused tests and `npm run typecheck`; confirm all pass.
- [ ] Commit with `git commit -m "feat: add repeatable expedition state machine"`.

### Task 2: Contract board, loadout, and debrief panels

**Files:**
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Modify: `src/main.ts`
- Modify: `src/game-controller.ts`
- Create: `e2e/expedition-board.spec.ts`

**Interfaces:**
- Consumes: Task 1 domain functions and `ContractId`, `GiftId`, `RefugeProjectId`.
- Produces panel methods: `showContractBoard`, `showWorkChoices`, `showExpeditionDecision`, `showExpeditionDebrief`.
- Produces controller methods: `beginExpedition`, `performExpeditionWork`, `decideOptionalLead`, `constructProject`.

- [ ] Write a failing Playwright test that opens the board after the tutorial, selects two tools, begins a contract, and observes a persisted active expedition.
- [ ] Run `npx playwright test e2e/expedition-board.spec.ts` and confirm it fails because the board is absent.
- [ ] Build the board and loadout UI with exactly-two selection, resource/project cards, and short-phone scrolling.
- [ ] Wire panel actions through `main.ts` and controller methods to Task 1 transitions; save after every transition.
- [ ] Add the post-contract debrief showing actual action records and secured rewards.
- [ ] Run the focused E2E test, unit tests, and typecheck; confirm all pass.
- [ ] Commit with `git commit -m "feat: add expedition contract board and debrief"`.

### Task 3: World interaction, objectives, and soft-risk decision

**Files:**
- Modify: `src/game-controller.ts`
- Modify: `src/domain/tutorial.ts`
- Modify: `src/ui/canvas-renderer.ts`
- Modify: `src/styles.css`
- Create: `e2e/expedition-loop.spec.ts`

**Interfaces:**
- Consumes: `expeditionTarget`, `availableWorkActions`, `applyWorkAction`, `chooseOptionalLead`, `completeExpedition`.
- Produces: contextual `E`/touch flow and canvas guidance for the active expedition.

- [ ] Write a failing browser test that moves a saved player to the current site, opens two real work choices, applies one, reloads, reaches the decision, accepts the optional lead, completes it, returns to the gate, and sees a debrief.
- [ ] Run the focused test and confirm failure at the first missing contextual interaction.
- [ ] Add an expedition objective card to the HUD and `K` board shortcut without changing WASD/arrows.
- [ ] Make `interact()` prefer a nearby expedition site and returning gate before legacy object inspection.
- [ ] Add contextual touch labels **Працювати** and **Завершити експедицію**.
- [ ] Make canvas guidance use the expedition target and draw a distinct field-work ring.
- [ ] Run focused browser tests plus existing desktop/touch/onboarding suites; confirm all pass.
- [ ] Commit with `git commit -m "feat: make expeditions playable in the world"`.

### Task 4: Visible refuge construction and persistent reports

**Files:**
- Modify: `src/ui/canvas-renderer.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Modify: `e2e/expedition-loop.spec.ts`
- Modify: `e2e/memory-arc.spec.ts`

**Interfaces:**
- Consumes: `expeditionMetaFor(state)`, `REFUGE_PROJECTS`, and persisted expedition reports.
- Produces: three sanctuary structures and journal report cards.

- [ ] Extend the failing browser test to grant literal resources, build **Польова майстерня**, reload, and verify both the board state and canvas `data-refuge-projects` marker.
- [ ] Run the focused test and confirm it fails because construction UI/rendering is missing.
- [ ] Draw workshop, archive, and guest canopy silhouettes inside the sanctuary according to `builtProjects`.
- [ ] Add completed expedition reports to the field journal and project milestones to the board.
- [ ] Run focused tests, memory-ending tests, unit tests, and typecheck; confirm all pass.
- [ ] Commit with `git commit -m "feat: persist refuge projects and field reports"`.

### Task 5: Full verification and delivery

**Files:**
- Modify only files required by failures discovered during verification.

**Interfaces:**
- Validates all prior task interfaces together.

- [ ] Run `git diff --check`.
- [ ] Run `npm test` and confirm zero failures.
- [ ] Run `npm run build` and confirm TypeScript plus Vite production build succeed.
- [ ] Run `npx playwright test` and confirm every Chromium scenario passes.
- [ ] Inspect the contract board, active objective, work-choice modal, debrief, and built refuge at desktop size and 390 × 480; confirm no console errors.
- [ ] Commit any verification-only fixes with `git commit -m "test: verify expedition vertical slice"`.
- [ ] Fast-forward the verified branch into `main`, keep the Vite server running at `http://127.0.0.1:4173/`, and verify HTTP 200.
