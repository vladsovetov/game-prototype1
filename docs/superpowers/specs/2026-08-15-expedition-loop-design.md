# Expedition Loop Vertical Slice

## Purpose

Replace the finite six-object completion loop with a repeatable field-expedition loop that creates preparation, choice, soft risk, return decisions, and persistent visible progress. This slice must prove that the game is enjoyable solo before online synchronization is added.

## Scope

The slice adds three repeatable contracts, two-tool loadouts, contextual work choices, one optional push-deeper objective, salvage, and three refuge projects. It reuses the current four generated regions, canvas world, practical tools, controls, save store, and Ukrainian interface.

Out of scope for this slice: accounts, matchmaking, server authority, real-time multiplayer, combat, paid cosmetics, seasonal infrastructure, freeform AI-written mechanics, and automatic local-model debrief prose.

## Player loop

After the progressive first-memory tutorial, the HUD exposes **Контракти** with the `K` shortcut. The contract board offers:

- **Відновити водний маршрут** — inspect and restore the water path;
- **Перевірити сигнальну лінію** — diagnose wayfinding and warning equipment;
- **Підготувати штормовий притулок** — make a safe route and shelter ready.

The player selects exactly two of the four owned field tools before departure. Every work site supports all four tools, but each tool produces a different outcome. This makes a loadout a horizontal choice, never a power gate.

A contract contains three required work sites selected deterministically from the existing world objects. The guidance lights point to only the current site. At a site, `E` opens contextual actions for the equipped tools; the player chooses one action and receives a concrete outcome, salvage, and weather pressure.

After the third required site, the player chooses:

- return to the refuge with the current haul; or
- investigate one optional lead for a rare find while increasing weather pressure.

There is no timer and no irreversible failure. Weather pressure reduces some unsecured supplies at the debrief when it exceeds three. Journal discoveries and at least one supply are always retained, so an expedition never produces zero progress.

The return route ends at the refuge gate. Interacting there completes the contract and opens the debrief.

## Contract state

`GameState` gains optional compatible state:

```ts
interface ExpeditionProgress {
  id: string;
  contractId: ContractId;
  seed: number;
  loadout: [GiftId, GiftId];
  siteIds: string[];
  requiredTotal: 3;
  completed: ExpeditionActionRecord[];
  optionalSiteId: string;
  optionalAccepted?: boolean;
  optionalCompleted?: boolean;
  pressure: number;
  supplies: number;
  insight: number;
  rareFinds: string[];
  status: 'active' | 'decision' | 'returning';
}

interface ExpeditionActionRecord {
  siteId: string;
  tool: GiftId;
  title: string;
  outcome: string;
}
```

The persistent meta-state is:

```ts
interface ExpeditionMeta {
  completedContracts: number;
  supplies: number;
  insight: number;
  rareFinds: string[];
  builtProjects: RefugeProjectId[];
  reports: ExpeditionReport[];
}
```

Older saves receive an empty meta-state during localization. An active expedition is persisted on every action and resumes exactly.

## Deterministic expedition director

`src/domain/expedition.ts` owns contract definitions and pure state transitions:

- `expeditionMetaFor(state)` returns migrated/default meta-state;
- `startExpedition(state, contractId, loadout, seed)` validates two distinct tools and creates a deterministic route;
- `expeditionTarget(state)` returns the current world point or refuge gate;
- `availableWorkActions(state)` returns actions only when the player is close to the current site;
- `applyWorkAction(state, tool)` records one choice and advances once;
- `chooseOptionalLead(state, accept)` changes `decision` to `active` or `returning`;
- `completeExpedition(state)` secures rewards only while returning and close to the gate;
- `buildRefugeProject(state, projectId)` spends earned resources once.

World sites use stable anomaly IDs and the current generated layout. Route order varies by contract and expedition seed without moving saved world objects.

Every site has authored, practical actions for the lantern, pruning shears, tuning fork, and repair kit. Outcomes mention what the tool physically did. The tuning fork is limited to checking resonance, hollow spaces, tension, and warning equipment.

## Reward and pressure model

Each required action awards one or two supplies and zero or one insight. Careful diagnostic actions generally award insight with low pressure; direct repairs generally award more supplies with moderate pressure. The optional objective awards one regional rare find and two supplies, but adds two pressure.

At debrief:

```text
weather loss = max(0, pressure - 3)
secured supplies = max(1, expedition supplies - weather loss)
secured insight = expedition insight
```

No purchased item can affect pressure, rewards, loadouts, or project costs.

## Refuge projects

Three projects give visible goals without player power:

- **Польова майстерня** — 8 supplies;
- **Архів маршрутів** — 6 insight;
- **Гостьовий навіс** — 6 supplies and 1 rare find.

Projects are cosmetic world changes and journal milestones. The canvas draws each completed structure inside the sanctuary. Building a project cannot be repeated and never changes expedition reward rates.

## Interface and controls

- `K` and a HUD button open the contract board.
- The board presents contracts, two-tool loadout selection, resources, built projects, and build actions.
- The active objective appears in the existing top-center notebook card.
- `E` opens work choices at a contract site or completes the return at the gate.
- Touch receives a contextual **Працювати** or **Завершити експедицію** action.
- Guidance lights use `expeditionTarget` when the tutorial has no target.
- The debrief lists the actual tool choices and outcomes, then presents **До дошки контрактів**.

All new UI copy is Ukrainian. Modal content remains usable at 390 × 480 CSS pixels.

## Story behavior

The story is recorded after play. Each debrief composes a field report from the contract, region, pressure, rare find, and actual `ExpeditionActionRecord` outcomes. Reports persist in the journal. This first slice uses trusted Ukrainian templates; the browser-local model can rewrite those reports in a later isolated feature without changing rewards or mechanics.

## Testing

Unit tests cover deterministic routes, loadout validation, one-time step advancement, optional-risk rewards, minimum secured progress, persistence defaults, and one-time refuge construction.

Browser tests cover starting a contract with two tools, completing a contextual work action, choosing the optional lead, returning for a debrief, resuming an active contract after reload, building a project, keyboard controls, and the 390 × 480 layout.
