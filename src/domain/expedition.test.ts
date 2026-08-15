import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import {
  REFUGE_PROJECTS,
  applyWorkAction,
  availableWorkActions,
  buildRefugeProject,
  chooseOptionalLead,
  completeExpedition,
  expeditionMetaFor,
  expeditionTarget,
  startExpedition,
} from './expedition';
import { localizeState } from './localization';
import { createInitialState } from './simulation';
import type { GameState, GiftId } from './types';

function initial() {
  const state = createInitialState(generateCharacter(12), 9001);
  state.tutorial = { step: 'done', targetAnomalyId: 'sign', borrowedGift: 'mend', start: state.player };
  return state;
}

function moveToTarget(state: GameState) {
  const target = expeditionTarget(state);
  if (!target) throw new Error('Expected an expedition target.');
  return { ...state, player: target };
}

function finishRequired(state: GameState, tool: GiftId = 'mend') {
  let next = state;
  for (let step = 0; step < 3; step++) {
    next = moveToTarget(next);
    const result = applyWorkAction(next, tool);
    expect(result.ok).toBe(true);
    next = result.state;
  }
  return next;
}

describe('expedition director', () => {
  it('rejects a loadout unless it contains exactly two distinct tools', () => {
    const state = initial();

    expect(startExpedition(state, 'water-route', ['mend', 'mend'], 7).ok).toBe(false);
    expect(startExpedition(state, 'water-route', ['mend'] as never, 7).ok).toBe(false);
    expect(state.expedition).toBeUndefined();
  });

  it('creates a deterministic literal route for a contract seed', () => {
    const first = startExpedition(initial(), 'water-route', ['mend', 'reveal'], 7).state.expedition!;
    const second = startExpedition(initial(), 'water-route', ['mend', 'reveal'], 7).state.expedition!;

    expect(first.siteIds).toEqual(['sign', 'garden', 'stone']);
    expect(first.optionalSiteId).toBe('pool');
    expect(second).toEqual(first);
  });

  it('offers only equipped actions at the current nearby site and advances it once', () => {
    let state = startExpedition(initial(), 'water-route', ['mend', 'reveal'], 7).state;
    state = moveToTarget(state);

    expect(availableWorkActions(state).map((action) => action.tool)).toEqual(['reveal', 'mend']);
    const worked = applyWorkAction(state, 'reveal');
    expect(worked.ok).toBe(true);
    expect(worked.state.expedition?.completed).toHaveLength(1);
    expect(applyWorkAction(worked.state, 'reveal').ok).toBe(false);
    expect(applyWorkAction(worked.state, 'reveal').state.expedition?.completed).toHaveLength(1);
  });

  it('turns three required jobs into a push-deeper decision', () => {
    const started = startExpedition(initial(), 'signal-line', ['mend', 'echo'], 4).state;
    const state = finishRequired(started, 'mend');

    expect(state.expedition?.status).toBe('decision');
    expect(expeditionTarget(state)).toBeUndefined();
  });

  it('makes the optional lead add soft pressure and one regional rare find', () => {
    let state = finishRequired(startExpedition(initial(), 'storm-shelter', ['grow', 'reveal'], 5).state, 'grow');
    const beforePressure = state.expedition!.pressure;
    state = chooseOptionalLead(state, true).state;
    state = moveToTarget(state);
    state = applyWorkAction(state, 'reveal').state;

    expect(state.expedition?.status).toBe('returning');
    expect(state.expedition!.pressure).toBeGreaterThanOrEqual(beforePressure + 2);
    expect(state.expedition?.rareFinds).toHaveLength(1);
  });

  it('always secures progress when severe weather consumes the haul', () => {
    let state = finishRequired(startExpedition(initial(), 'water-route', ['grow', 'echo'], 2).state, 'grow');
    state = chooseOptionalLead(state, true).state;
    state = moveToTarget(state);
    state = applyWorkAction(state, 'grow').state;
    state = moveToTarget(state);
    const result = completeExpedition(state);

    expect(result.ok).toBe(true);
    expect(result.report?.securedSupplies).toBeGreaterThanOrEqual(1);
    expect(result.state.expedition).toBeUndefined();
    expect(expeditionMetaFor(result.state).completedContracts).toBe(1);
  });

  it('builds a cosmetic refuge project once and spends literal resources', () => {
    const state = { ...initial(), expeditionMeta: { completedContracts: 1, supplies: 10, insight: 8, rareFinds: ['coast-glass'], builtProjects: [], reports: [] } };
    const built = buildRefugeProject(state, 'workshop');

    expect(built.ok).toBe(true);
    expect(expeditionMetaFor(built.state).supplies).toBe(2);
    expect(expeditionMetaFor(built.state).builtProjects).toEqual(['workshop']);
    expect(buildRefugeProject(built.state, 'workshop').ok).toBe(false);
    expect(REFUGE_PROJECTS.workshop.cost).toEqual({ supplies: 8, insight: 0, rare: 0 });
  });

  it('migrates an older save to an empty expedition record', () => {
    const old = initial();
    delete old.expeditionMeta;

    const migrated = localizeState(old);

    expect(expeditionMetaFor(migrated)).toEqual({ completedContracts: 0, supplies: 0, insight: 0, rareFinds: [], builtProjects: [], reports: [] });
  });
});
