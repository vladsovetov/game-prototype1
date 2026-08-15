import type { GameState } from './types';

export interface MemoryChapter {
  id: string;
  title: string;
  keepsake: string;
  story: string;
}

export const MEMORY_CHAPTERS: Record<string, MemoryChapter> = {
  sign: { id: 'sign', title: 'Дорога додому', keepsake: 'Пригаданий дороговказ', story: 'Дороговказ до Дому Ліхтарів вів крізь бурю до далекого світла — хтось підтримував його, щоб дорога додому не зникла.' },
  stone: { id: 'stone', title: 'Пісня під каменем', keepsake: 'Співоче дерево', story: 'Ваш голос повертається у срібному листі. Колись ви навчили наляканих мандрівників чотирьох нот, і вони співали разом, доки грім не став тихим.' },
  pool: { id: 'pool', title: 'Чаша на світанку', keepsake: 'Шепітливий ставок', story: 'Холодна вода огортає зап’ястки. На кожному світанку після бурі ви змивали дорогу з плащів гостей, перш ніж питати їхні імена.' },
  root: { id: 'root', title: 'Незамкнені двері', keepsake: 'Маленькі потаємні двері', story: 'За живим корінням чекає вузька кімната з ковдрами й сухим хлібом. Її не замикали: прихисток лишається прихистком, тільки коли ввійти може кожен.' },
  bell: { id: 'bell', title: 'Дзвін бурі', keepsake: 'Дощовий дзвін', story: 'Ви тягнули цей дзвін крізь дощ, аж долоні вкрилися кров’ю. Кожен удар сповіщав людей за пагорбом: Дім Ліхтарів стоїть. Ідіть на звук.' },
  moth: { id: 'moth', title: 'Листи з крилами', keepsake: 'Паперова зграя', story: 'Сотні складених записок полетіли в темряву: «Тут є місце. Не обов’язково приходити хоробрими». Деякі повернулися з іменами.' },
  moon: { id: 'moon', title: 'Ім’я для місяця', keepsake: 'Названий місяць', story: 'Дитина біля вікна не могла заснути. Ви назвали порожній місяць Морроу й пообіцяли, що ранок прийде. Ім’я залишилося після бурі.' },
  garden: { id: 'garden', title: 'Сад, що чекав', keepsake: 'Сад ліхтарів', story: 'Коли скінчилася олія для ламп, ви посадили теплі квіти край дороги. У кожній квітці було досить сутінків, щоб показати заблукалим наступний крок.' },
};

export const LANTERN_HOUSE_ENDING = {
  title: 'Хранитель Дому Ліхтарів',
  story: 'Дім Ліхтарів був не домом, який ви намагалися знайти. Це був дім, створений для всіх, хто ще в дорозі. Під час останньої великої бурі ви винесли його світло в темряву й віддали свої спогади, щоб провести інших додому. Ця галявина виросла з того дарунка. Ви були Хранителем Дому Ліхтарів.',
} as const;

export function memoryChapter(id: string): MemoryChapter | undefined { return MEMORY_CHAPTERS[id]; }

export function sanctuaryProgress(state: GameState) {
  const required = 6;
  const planted = Math.min(Object.keys(state.plantings).length, required);
  return { planted, required, complete: planted >= required };
}

export function hasReachedEnding(state: GameState) { return sanctuaryProgress(state).complete && !state.endingSeen; }
