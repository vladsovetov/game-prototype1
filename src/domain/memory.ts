import { getActiveLocale, localeTag, localizedCopy, type Locale } from '../i18n/locale';
import { t } from '../i18n/messages';
import type { GameState, TutorialStep } from './types';

const ROAD_HOME_COPY: Record<Locale, { title: string; question: string; firstClue: (name: string) => string; recovered: (name: string) => string }> = {
  uk: {
    title: 'ДОРОГА ДОДОМУ',
    question: 'Хто підтримував вогонь?',
    firstClue: (name) => `Стерті літери повертаються: «Дім Ліхтарів». Від цих слів у грудях ${name} стає тепло. Колись ця дорога вже вела вперед.`,
    recovered: (name) => `${name} згадує шлях крізь бурю до далекого світла — хтось підтримував його, щоб дорогу додому можна було знайти.`,
  },
  en: {
    title: 'THE ROAD HOME',
    question: 'Who kept the fire?',
    firstClue: (name) => `Erased letters return: “House of Lanterns”. The words warm ${name}’s chest. This road once already led forward.`,
    recovered: (name) => `${name} remembers the path through the storm toward a distant light — someone kept it burning so the road home could be found.`,
  },
  ru: {
    title: 'ДОРОГА ДОМОЙ',
    question: 'Кто поддерживал огонь?',
    firstClue: (name) => `Стёртые буквы возвращаются: «Дом Фонарей». От этих слов в груди ${name} становится тепло. Когда-то эта дорога уже вела вперёд.`,
    recovered: (name) => `${name} вспоминает путь сквозь бурю к далёкому свету — кто-то поддерживал его, чтобы дорогу домой можно было найти.`,
  },
};

export const ROAD_HOME = {
  id: 'road-home',
  get title() { return localizedCopy(ROAD_HOME_COPY).title; },
  get question() { return localizedCopy(ROAD_HOME_COPY).question; },
  firstClue: (name: string) => localizedCopy(ROAD_HOME_COPY).firstClue(name),
  recovered: (name: string) => localizedCopy(ROAD_HOME_COPY).recovered(name),
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
  const locale = getActiveLocale();
  return {
    title: state.tutorial?.targetAnomalyId === 'sign'
      ? (state.storyArc?.chapters.sign?.title.toLocaleUpperCase(localeTag(locale)) ?? ROAD_HOME.title)
      : t('firstMemoryTitle'),
    found: FOUND_BY_STEP[state.tutorial?.step ?? 'done'],
    total: 2,
  };
}
