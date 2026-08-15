# Local AI Expedition Director Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate validated, locally personalized expedition narratives that remember recent play while deterministic game code remains authoritative.

**Architecture:** `startExpedition` creates a complete deterministic fallback card. The existing local-model worker optionally generates the same strict schema; the writer validates it and the controller applies it only to the still-active matching expedition. Reports persist compact memories and novelty fingerprints for later prompts.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, Transformers.js worker, browser WebGPU/WASM.

**Spec:** `docs/superpowers/specs/2026-08-15-local-ai-expedition-director-design.md`

## Global Constraints

- The model never controls rules, rewards, pressure, route geometry, or passability.
- Gameplay starts immediately with a deterministic Ukrainian fallback.
- Only validated Ukrainian JSON can replace fallback narrative.
- Existing saves and devices without local AI remain playable.

---

### Task 1: Narrative schema and validation

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/story/local-story-protocol.ts`
- Test: `src/story/local-story-protocol.test.ts`

- [x] Write failing tests for exact route validation and repeated fingerprints.
- [x] Run the tests and confirm the missing parser fails.
- [x] Add bounded enums, text limits, Ukrainian validation, and fingerprint rejection.
- [x] Run the focused tests and confirm they pass.

### Task 2: Deterministic fallback and memory

**Files:**
- Modify: `src/domain/expedition.ts`
- Test: `src/domain/expedition.test.ts`

- [x] Write failing tests for route notes, source, novelty, and report memory.
- [x] Confirm the tests fail because narrative data is absent.
- [x] Build varied contract-specific fallbacks and persist compact completion memory.
- [x] Run the focused tests and confirm they pass.

### Task 3: One-worker local generation

**Files:**
- Modify: `src/story/local-story-worker.ts`
- Modify: `src/story/local-story-writer.ts`
- Test: `src/story/local-story-writer.test.ts`

- [x] Write a failing test for a validated expedition result.
- [x] Extend the request/message protocol without starting another model worker.
- [x] Generate strict Ukrainian JSON and ignore invalid or stale results.
- [x] Run writer tests and TypeScript.

### Task 4: Non-blocking game integration

**Files:**
- Modify: `src/game-controller.ts`
- Modify: `src/main.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/styles.css`
- Test: `e2e/ai-expedition.spec.ts`

- [x] Write a failing browser test for an immediate start and later AI update.
- [x] Start generation only after the deterministic expedition exists.
- [x] Show narrative title, evidence, optional lead, warning, find, and report.
- [x] Preserve the story modal DOM node across status transitions.
- [x] Run all unit, build, and browser tests.
