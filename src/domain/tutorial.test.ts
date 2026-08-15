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
import { memoryProgress } from './memory';

describe('progressive tutorial', () => {
  it.each(['echo', 'reveal', 'mend', 'grow'] as const)(
    'starts the authored Road Home route even when the generated gift was %s',
    (gift) => {
    const character = generateCharacter(12);
    character.gift = { id: gift, name: gift, description: '' };

    const state = prepareTutorial(createInitialState(character));

    expect(state.character.gift.id).toBe('reveal');
    expect(state.tutorial?.targetAnomalyId).toBe('sign');
    expect(state.tutorial?.borrowedGift).toBe('mend');
    expect(state.tutorial?.step).toBe('wake');
    },
  );

  it('reveals one instruction at a time', () => {
    let state = prepareTutorial(createInitialState(generateCharacter(4)));
    expect(tutorialObjective(state).action).toBe('Wake up');
    state = advanceTutorial(state, 'wake');
    expect(tutorialObjective(state).action).toContain('Find the rain-covered sign');
    state = advanceTutorial(state, 'moved');
    expect(tutorialObjective(state).action).toContain(state.character.gift.name);
    state = advanceTutorial(state, 'gift-used');
    expect(tutorialObjective(state).action).toContain('Find Mend');
    state = advanceTutorial(state, 'resonance-borrowed');
    expect(tutorialObjective(state).action).toContain('Return');
    state = advanceTutorial(state, 'chain-completed');
    expect(tutorialObjective(state).action).toContain('Plant');
    state = advanceTutorial(state, 'seed-planted');
    expect(state.tutorial?.step).toBe('remember');
    state = advanceTutorial(state, 'memory-shaped');
    expect(state.tutorial?.step).toBe('personalize');
    state = advanceTutorial(state, 'personalization-dismissed');
    expect(state.tutorial?.step).toBe('done');
  });

  it('reports concrete clue progress through The Road Home', () => {
    let state = prepareTutorial(createInitialState(generateCharacter(7)));
    expect(memoryProgress(state)).toEqual({ title: 'THE ROAD HOME', found: 0, total: 2 });

    state = advanceTutorial(advanceTutorial(advanceTutorial(state, 'wake'), 'moved'), 'gift-used');
    expect(memoryProgress(state)).toEqual({ title: 'THE ROAD HOME', found: 1, total: 2 });

    state = advanceTutorial(advanceTutorial(state, 'resonance-borrowed'), 'chain-completed');
    expect(memoryProgress(state)).toEqual({ title: 'THE ROAD HOME', found: 2, total: 2 });
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
