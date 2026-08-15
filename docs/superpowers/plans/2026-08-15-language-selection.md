# Language Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent English, Ukrainian, and Russian language selection with browser detection and locale-matched local AI content.

**Architecture:** A small locale service selects and persists the locale before game construction. UI and authored domain data read one active locale, while local AI jobs carry an explicit locale across the worker boundary. Switching reloads the presentation around the untouched save.

**Tech Stack:** TypeScript, DOM, localStorage, Vite, Vitest, Playwright, Web Worker/WebLLM

**Spec:** `docs/superpowers/specs/2026-08-15-language-selection-design.md`

## Global Constraints

- Supported locales are exactly `en`, `uk`, and `ru`.
- Browser fallback is English.
- No network translation service and no new dependency.
- Game balance, IDs, save key, and current progress do not change.
- English is the source fallback for any missing translation key.

---

### Task 1: Locale preference and selector

**Files:**
- Create: `src/i18n/locale.ts`
- Create: `src/i18n/locale.test.ts`
- Create: `src/ui/language-switcher.ts`
- Modify: `src/main.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `Locale`, `detectLocale(languages)`, `createLocalePreference(storage, languages)`, `setActiveLocale(locale)`, and `createLanguageSwitcher(locale, onSelect)`.

- [ ] Write unit tests proving preference priority, regional-tag normalization, first-supported-language selection, and English fallback.
- [ ] Run the focused test and observe failure because the locale module does not exist.
- [ ] Implement locale storage and the accessible three-button selector.
- [ ] Run the focused test and typecheck.

### Task 2: Localized authored game copy

**Files:**
- Create: `src/i18n/messages.ts`
- Modify: `src/domain/catalog.ts`
- Modify: `src/domain/character.ts`
- Modify: `src/domain/story.ts`
- Modify: `src/domain/run-direction.ts`
- Modify: `src/domain/world.ts`
- Modify: `src/domain/tutorial.ts`
- Modify: `src/domain/memory.ts`
- Modify: `src/domain/memory-arc.ts`
- Modify: `src/domain/expedition.ts`
- Modify: `src/domain/simulation.ts`
- Modify: `src/ui/panels.ts`
- Modify: `src/game-controller.ts`

**Interfaces:**
- Consumes: `getActiveLocale()` and `t(key, variables)` from Task 1.
- Produces: locale-aware catalogs, procedural story fallback, objectives, HUD, panels, and action feedback while preserving stable domain IDs.

- [ ] Add failing behavior tests for English and Russian generated character/catalog/story output.
- [ ] Run the focused tests and observe Ukrainian output where English/Russian is required.
- [ ] Add typed message dictionaries and locale-aware domain accessors.
- [ ] Replace presentation literals with translation keys and interpolate player data using text nodes.
- [ ] Run domain and UI tests, keeping Ukrainian fixtures explicitly set to `uk`.

### Task 3: Locale-aware local AI protocol

**Files:**
- Modify: `src/story/local-story-protocol.ts`
- Modify: `src/story/local-story-protocol.test.ts`
- Modify: `src/story/local-story-worker.ts`
- Modify: `src/story/local-story-writer.ts`
- Modify: `src/story/local-story-writer.test.ts`
- Modify: `src/game-controller.ts`

**Interfaces:**
- Consumes: `Locale`.
- Produces: worker start messages containing `locale`; `parseStoryIngredients(raw, locale)` and `parseExpeditionNarrative(raw, ..., locale)` validate the requested language.

- [ ] Add failing protocol tests: English accepts Latin/rejects Cyrillic, Russian accepts Cyrillic/rejects Latin, Ukrainian behavior remains.
- [ ] Run focused protocol/writer tests and observe missing locale support.
- [ ] Thread locale through writer messages, prompts, parsing, and errors.
- [ ] Run focused tests and typecheck.

### Task 4: Browser behavior and regression coverage

**Files:**
- Create: `e2e/language.spec.ts`
- Modify: `playwright.config.ts`

**Interfaces:**
- Tests the built application through the real browser/localStorage boundary.

- [ ] Add failing E2E coverage for English fallback, Russian browser detection, explicit Ukrainian choice, persistence after reload, and unchanged game save.
- [ ] Run the focused E2E test and observe the missing selector/localization failures.
- [ ] Complete integration fixes until the focused suite passes on desktop and mobile viewports.
- [ ] Run all unit tests, TypeScript build, all Playwright tests with one worker, and `git diff --check`.
- [ ] Commit and push the verified implementation to `origin/main`.

