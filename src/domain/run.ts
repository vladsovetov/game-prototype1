import type { Character } from './types';
import { randomSeed } from './random';
import { createInitialState } from './simulation';
import { createWovenStory } from './story';
import { prepareTutorial } from './tutorial';

export function prepareNewRun(character: Character, seed = randomSeed() || 1) {
  const initial = createInitialState(character, seed);
  return prepareTutorial({ ...initial, storyArc: createWovenStory(character, seed) });
}
