import type { GameState, TutorialStep } from './types';

export const ROAD_HOME = {
  id: 'road-home',
  title: 'THE ROAD HOME',
  question: 'Who kept the light burning?',
  firstClue: (name: string) =>
    `The erased letters return: “Lantern House.” The words make ${name}'s chest feel warm. This was a road they once followed.`,
  recovered: (name: string) =>
    `${name} remembers walking through a storm toward a distant light—one that somebody kept burning so they could find the way home.`,
} as const;

const FOUND_BY_STEP: Record<TutorialStep, number> = {
  wake: 0,
  move: 0,
  gift: 0,
  resonate: 1,
  combine: 1,
  plant: 2,
  remember: 2,
  personalize: 2,
  done: 2,
};

export function memoryProgress(state: GameState) {
  return {
    title: ROAD_HOME.title,
    found: FOUND_BY_STEP[state.tutorial?.step ?? 'done'],
    total: 2,
  };
}
