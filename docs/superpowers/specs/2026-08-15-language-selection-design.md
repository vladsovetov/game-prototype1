# Language Selection Design

## Goal

Let players use the complete browser game in English, Ukrainian, or Russian. On the first visit, choose the first supported language from `navigator.languages`; fall back to English. Remember an explicit choice without changing or deleting game progress.

## Product behavior

- A compact `EN · УКР · RU` switcher is always available above the game UI, including the wake screen and modal screens.
- The active choice has `aria-pressed="true"`; every button has its language's native name as its accessible label.
- Choosing a language persists it separately from the game save, updates the document language and restarts the UI from the existing save.
- The preference has priority over browser detection. Unsupported browser languages use English.
- Authored interface copy, controls, objectives, catalogs, validation, fallback stories, expedition copy, and AI progress/error copy follow the selected language.
- New local-model requests explicitly request the selected language. Their validators accept the requested script and reject output in the wrong script.
- Existing player-written names and answers are never translated. Existing local-model stories remain intact until a new tale is generated; built-in fallback material is rebuilt in the active language.

## Architecture

`src/i18n/locale.ts` owns locale detection, persistence, active locale, interpolation, and document metadata. `src/i18n/messages.ts` contains UI dictionaries. Domain catalogs and procedural authored data expose locale-aware accessors while stable IDs remain unchanged. The selector reloads after persistence so all state-derived UI is reconstructed consistently without a parallel reactive state system.

The worker protocol carries `locale` in both opening-story and expedition jobs. Prompt construction and parser validation use that locale. Save schema stays version 1 because the preference is independent and StoryArc's optional locale metadata is backwards compatible.

## Constraints

- Supported locales are exactly `en`, `uk`, and `ru`.
- Browser fallback is English.
- No network translation service and no new dependency.
- Game balance, IDs, save key, and current progress do not change.
- English is the source fallback for any missing translation key.

