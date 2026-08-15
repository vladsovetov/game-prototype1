import { localizedCopy, type Locale } from '../i18n/locale';
import type { GameState } from './types';

export interface MemoryChapter {
  id: string;
  title: string;
  keepsake: string;
  story: string;
}

const CHAPTERS: Record<Locale, Record<string, MemoryChapter>> = {
  uk: {
    sign: { id: 'sign', title: 'Дорога додому', keepsake: 'Пригаданий дороговказ', story: 'Дороговказ до Дому Ліхтарів вів крізь бурю до далекого світла — хтось підтримував його, щоб дорога додому не зникла.' },
    stone: { id: 'stone', title: 'Пісня під каменем', keepsake: 'Співоче дерево', story: 'Ваш голос повертається у срібному листі. Колись ви навчили наляканих мандрівників чотирьох нот, і вони співали разом, доки грім не став тихим.' },
    pool: { id: 'pool', title: 'Чаша на світанку', keepsake: 'Шепітливий ставок', story: 'Холодна вода огортає зап’ястки. На кожному світанку після бурі ви змивали дорогу з плащів гостей, перш ніж питати їхні імена.' },
    root: { id: 'root', title: 'Незамкнені двері', keepsake: 'Маленькі потаємні двері', story: 'За живим корінням чекає вузька кімната з ковдрами й сухим хлібом. Її не замикали: прихисток лишається прихистком, тільки коли ввійти може кожен.' },
    bell: { id: 'bell', title: 'Дзвін бурі', keepsake: 'Дощовий дзвін', story: 'Ви тягнули цей дзвін крізь дощ, аж долоні вкрилися кров’ю. Кожен удар сповіщав людей за пагорбом: Дім Ліхтарів стоїть. Ідіть на звук.' },
    moth: { id: 'moth', title: 'Листи з крилами', keepsake: 'Паперова зграя', story: 'Сотні складених записок полетіли в темряву: «Тут є місце. Не обов’язково приходити хоробрими». Деякі повернулися з іменами.' },
    moon: { id: 'moon', title: 'Ім’я для місяця', keepsake: 'Названий місяць', story: 'Дитина біля вікна не могла заснути. Ви назвали порожній місяць Морроу й пообіцяли, що ранок прийде. Ім’я залишилося після бурі.' },
    garden: { id: 'garden', title: 'Сад, що чекав', keepsake: 'Сад ліхтарів', story: 'Коли скінчилася олія для ламп, ви посадили теплі квіти край дороги. У кожній квітці було досить сутінків, щоб показати заблукалим наступний крок.' },
  },
  en: {
    sign: { id: 'sign', title: 'The Road Home', keepsake: 'Remembered waypost', story: 'The waypost to the House of Lanterns led through the storm toward a distant light — someone kept it burning so the road home would not vanish.' },
    stone: { id: 'stone', title: 'Song Under Stone', keepsake: 'Singing tree', story: 'Your voice returns in silver leaves. Once you taught frightened travelers four notes, and they sang together until the thunder grew quiet.' },
    pool: { id: 'pool', title: 'Bowl at Dawn', keepsake: 'Whispering pool', story: 'Cold water wraps the wrists. At every dawn after the storm you washed the road from guests’ cloaks before asking their names.' },
    root: { id: 'root', title: 'An Unlocked Door', keepsake: 'A small hidden door', story: 'Behind living roots waits a narrow room with blankets and dry bread. It was never locked: a refuge remains a refuge only when anyone may enter.' },
    bell: { id: 'bell', title: 'Storm Bell', keepsake: 'Rain bell', story: 'You hauled this bell through the rain until your palms bled. Each strike told the people beyond the hill: the House of Lanterns still stands. Follow the sound.' },
    moth: { id: 'moth', title: 'Letters with Wings', keepsake: 'Paper flock', story: 'Hundreds of folded notes flew into the dark: “There is a place. You do not have to arrive brave.” Some came back with names.' },
    moon: { id: 'moon', title: 'A Name for the Moon', keepsake: 'Named moon', story: 'A child at the window could not sleep. You named the empty moon Morrow and promised morning would come. The name remained after the storm.' },
    garden: { id: 'garden', title: 'The Garden That Waited', keepsake: 'Lantern garden', story: 'When the lamp oil ran out, you planted warm flowers along the road. Each bloom held enough dusk to show the lost the next step.' },
  },
  ru: {
    sign: { id: 'sign', title: 'Дорога домой', keepsake: 'Вспомненный указатель', story: 'Указатель к Дому Фонарей вёл сквозь бурю к далёкому свету — кто-то поддерживал его, чтобы дорога домой не исчезла.' },
    stone: { id: 'stone', title: 'Песня под камнем', keepsake: 'Поющее дерево', story: 'Ваш голос возвращается в серебряных листьях. Когда-то вы научили испуганных путников четырём нотам, и они пели вместе, пока гром не стал тихим.' },
    pool: { id: 'pool', title: 'Чаша на рассвете', keepsake: 'Шепчущий пруд', story: 'Холодная вода охватывает запястья. На каждом рассвете после бури вы смывали дорогу с плащей гостей, прежде чем спрашивать их имена.' },
    root: { id: 'root', title: 'Незапертая дверь', keepsake: 'Маленькая потайная дверь', story: 'За живыми корнями ждёт узкая комната с одеялами и сухим хлебом. Её не запирали: убежище остаётся убежищем, только когда войти может каждый.' },
    bell: { id: 'bell', title: 'Колокол бури', keepsake: 'Дождевой колокол', story: 'Вы тащили этот колокол сквозь дождь, пока ладони не покрылись кровью. Каждый удар сообщал людям за холмом: Дом Фонарей стоит. Идите на звук.' },
    moth: { id: 'moth', title: 'Письма с крыльями', keepsake: 'Бумажная стая', story: 'Сотни сложенных записок полетели во тьму: «Здесь есть место. Не обязательно приходить храбрыми». Некоторые вернулись с именами.' },
    moon: { id: 'moon', title: 'Имя для луны', keepsake: 'Названная луна', story: 'Ребёнок у окна не мог заснуть. Вы назвали пустую луну Морроу и пообещали, что утро придёт. Имя осталось после бури.' },
    garden: { id: 'garden', title: 'Сад, который ждал', keepsake: 'Сад фонарей', story: 'Когда кончилось масло для ламп, вы посадили тёплые цветы у дороги. В каждом цветке было достаточно сумерек, чтобы показать заблудившимся следующий шаг.' },
  },
};

const ENDING: Record<Locale, { title: string; story: string }> = {
  uk: {
    title: 'Хранитель Дому Ліхтарів',
    story: 'Дім Ліхтарів був не домом, який ви намагалися знайти. Це був дім, створений для всіх, хто ще в дорозі. Під час останньої великої бурі ви винесли його світло в темряву й віддали свої спогади, щоб провести інших додому. Ця галявина виросла з того дарунка. Ви були Хранителем Дому Ліхтарів.',
  },
  en: {
    title: 'Keeper of the House of Lanterns',
    story: 'The House of Lanterns was not the home you were trying to find. It was a home made for everyone still on the road. In the last great storm you carried its light into the dark and gave your memories so others could be led home. This clearing grew from that gift. You were the Keeper of the House of Lanterns.',
  },
  ru: {
    title: 'Хранитель Дома Фонарей',
    story: 'Дом Фонарей был не домом, который вы пытались найти. Это был дом, созданный для всех, кто ещё в пути. Во время последней большой бури вы вынесли его свет во тьму и отдали свои воспоминания, чтобы провести других домой. Эта поляна выросла из того дара. Вы были Хранителем Дома Фонарей.',
  },
};

export const MEMORY_CHAPTERS: Record<string, MemoryChapter> = new Proxy({} as Record<string, MemoryChapter>, {
  get: (_target, id: string) => localizedCopy(CHAPTERS)[id],
  ownKeys: () => Object.keys(CHAPTERS.uk),
  getOwnPropertyDescriptor: (_target, id) => (id in CHAPTERS.uk ? { enumerable: true, configurable: true } : undefined),
});

export const LANTERN_HOUSE_ENDING = {
  get title() { return localizedCopy(ENDING).title; },
  get story() { return localizedCopy(ENDING).story; },
};

export function memoryChapter(id: string): MemoryChapter | undefined { return localizedCopy(CHAPTERS)[id]; }

export function sanctuaryProgress(state: GameState) {
  const required = 6;
  const planted = Math.min(Object.keys(state.plantings).length, required);
  return { planted, required, complete: planted >= required };
}

export function hasReachedEnding(state: GameState) { return sanctuaryProgress(state).complete && !state.endingSeen; }
