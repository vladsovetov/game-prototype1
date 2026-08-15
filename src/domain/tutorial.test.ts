import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { createInitialState } from './simulation';
import {
  advanceTutorial,
  prepareTutorial,
  tutorialObjective,
  tutorialTarget,
} from './tutorial';
import { ANOMALIES, SHRINES } from './world';
import { nearestTarget } from './simulation';

describe('progressive tutorial', () => {
  it.each([
    ['echo', 'stone', 'grow'],
    ['reveal', 'sign', 'mend'],
    ['mend', 'pool', 'echo'],
    ['grow', 'root', 'reveal'],
  ] as const)('pairs %s with a compatible discovery', (gift, anomalyId, borrowedGift) => {
    const character = generateCharacter(12);
    character.gift = { id: gift, name: gift, description: '' };

    const state = prepareTutorial(createInitialState(character));

    expect(state.tutorial?.targetAnomalyId).toBe(anomalyId);
    expect(state.tutorial?.borrowedGift).toBe(borrowedGift);
    expect(state.tutorial?.step).toBe('wake');
  });

  it('reveals one instruction at a time', () => {
    let state = prepareTutorial(createInitialState(generateCharacter(4)));
    expect(tutorialObjective(state).action).toBe('Wake up');
    state = advanceTutorial(state, 'wake');
    expect(tutorialObjective(state).action).toContain('Move');
    state = advanceTutorial(state, 'moved');
    expect(tutorialObjective(state).action).toContain(state.character.gift.name);
    state = advanceTutorial(state, 'gift-used');
    expect(tutorialObjective(state).action).toContain('Follow');
    state = advanceTutorial(state, 'resonance-borrowed');
    expect(tutorialObjective(state).action).toContain('Return');
    state = advanceTutorial(state, 'chain-completed');
    expect(tutorialObjective(state).action).toContain('Plant');
    state = advanceTutorial(state, 'seed-planted');
    expect(state.tutorial?.step).toBe('personalize');
    state = advanceTutorial(state, 'personalization-dismissed');
    expect(state.tutorial?.step).toBe('done');
  });

  it('points to the relevant world object for each step', () => {
    let state = prepareTutorial(createInitialState(generateCharacter(9)));
    state = advanceTutorial(state, 'wake');
    expect(tutorialTarget(state)).toEqual(
      ANOMALIES.find((item) => item.id === state.tutorial?.targetAnomalyId)?.position,
    );
    state = advanceTutorial(advanceTutorial(state, 'moved'), 'gift-used');
    expect(tutorialTarget(state)).toEqual(
      SHRINES.find((item) => item.gift === state.tutorial?.borrowedGift)?.position,
    );
  });

  it('places the player nearest the first sanctuary plot after completing a chain', () => {
    let state = prepareTutorial(createInitialState(generateCharacter(9)));
    state.tutorial!.step = 'combine';
    state = advanceTutorial(state, 'chain-completed');

    const nearest = nearestTarget(state);
    expect(nearest?.type).toBe('plot');
    expect(nearest?.value.id).toBe('plot-1');
  });
});
