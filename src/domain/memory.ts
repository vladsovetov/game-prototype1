import type { GameState, TutorialStep } from './types';

export const ROAD_HOME = {
  id: 'road-home',
  title: 'ДОРОГА ДОДОМУ',
  question: 'Хто підтримував вогонь?',
  firstClue: (name: string) =>
    `Стерті літери повертаються: «Дім Ліхтарів». Від цих слів у грудях ${name} стає тепло. Колись ця дорога вже вела вперед.`,
  recovered: (name: string) =>
    `${name} згадує шлях крізь бурю до далекого світла — хтось підтримував його, щоб дорогу додому можна було знайти.`,
} as const;

const FOUND_BY_STEP: Record<TutorialStep, number> = {
  wake: 0,
  move: 0,
  gift: 0,
  clue: 1,
  resonate: 1,
  combine: 1,
  recovered: 2,
  plant: 2,
  remember: 2,
  personalize: 2,
  done: 2,
};

export function memoryProgress(state: GameState) {
  return {
    title: state.tutorial?.targetAnomalyId === 'sign' ? (state.storyArc?.chapters.sign?.title.toLocaleUpperCase('uk-UA') ?? ROAD_HOME.title) : 'ПЕРШИЙ СПОГАД',
    found: FOUND_BY_STEP[state.tutorial?.step ?? 'done'],
    total: 2,
  };
}
