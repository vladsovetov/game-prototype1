import { seededRandom } from './random';
import type { Character, GameState, StoryArc, StoryChapter } from './types';
import { LANTERN_HOUSE_ENDING, MEMORY_CHAPTERS } from './memory-arc';

export interface StoryIngredients { place: string; role: string; disaster: string; vow: string; motif: string; truth: string }

const PLACES = ['Дім Блакитних Вікон', 'Прихисток Метеликового Дзвону', 'Архів Дощу', 'Остання Тепла Станція', 'Сад Малих Місяців'];
const ROLES = ['хранитель нічної дороги', 'слухач біля дверей погоди', 'реставратор імен мандрівників', 'картограф зниклих шляхів', 'садівник позиченого світла'];
const DISASTERS = ['ріка піднялася в небо', 'срібна буря стерла всі дороги', 'місяць згас на сім ночей', 'дзвони забули попередити долину', 'вітер забрав усі імена'];
const VOWS = ['Жоден заблукалий мандрівник не зустріне темряву на самоті.', 'Я залишатиму світло на кожному роздоріжжі.', 'Кожного незнайомця спершу приймуть, а вже потім розпитають.', 'Те, що розвіє буря, я обережно зберу.', 'Я пам’ятатиму за тих, хто не може.'];
const MOTIFS = ['блакитна нитка', 'дощ на теплому склі', 'чотири тихі ноти', 'паперові крила', 'золоті зерна'];
const TRUTHS = ['домом був прихисток, створений для інших', 'спогади стали вогнями, що вивели всіх із темряви', 'дорога вціліла, бо незнайомці навчилися дбати одне про одного', 'пошуки прихистку насправді були його створенням', 'кожна врятована людина понесла частинку цієї пам’яті далі'];

function pick<T>(values: readonly T[], random: () => number) { return values[Math.floor(random() * values.length)]!; }

export function wovenIngredients(seed: number): StoryIngredients {
  const random = seededRandom((seed ^ 0x51f15e) >>> 0);
  return { place: pick(PLACES, random), role: pick(ROLES, random), disaster: pick(DISASTERS, random), vow: pick(VOWS, random), motif: pick(MOTIFS, random), truth: pick(TRUTHS, random) };
}

function chapter(id: string, title: string, keepsake: string, story: string): StoryChapter { return { id, title, keepsake, story }; }
function firstUpper(value: string) { return value[0]?.toLocaleUpperCase('uk-UA') + value.slice(1); }

export function composeStory(character: Character, seed: number, ingredients: StoryIngredients, source: StoryArc['source']): StoryArc {
  const name = character.name, place = ingredients.place, motif = ingredients.motif, role = ingredients.role;
  return {
    seed: seed >>> 0,
    source,
    worldName: place,
    runMark: (seed >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-6),
    premise: `${name} прокидається на галявині, що пам’ятає образ «${motif}». Колись місце «${place}» було важливою частиною життя, а роль ${name} там — ${role}. Потім ${ingredients.disaster}, і минуле розсипалося на живі пам’ятки.`,
    question: `Хто допомагав ${name} берегти цю обітницю?`,
    firstClue: `Стерті літери повертаються: «${place}». ${name} відчуває обриси давньої обіцянки: ${ingredients.vow}`,
    recovered: `${name} згадує час, коли ${ingredients.disaster}. Слід, сповнений образу «${motif}», вів до місця «${place}», де хтось досі чекав.`,
    chapters: {
      sign: chapter('sign', 'Дорога, що пам’ятала', 'Пригаданий дороговказ', `Відновлений дороговказ указує на місце «${place}». У руках ${name} літери сяють образом «${motif}»: перший доказ, що загублена дорога була справжньою.`),
      stone: chapter('stone', 'Пісня під каменем', 'Співоче дерево', `Дар «${character.gift.name}» колись пробудив для ${name} стару пісню під підлогою місця «${place}». Мандрівники вивчили її чотири ноти й співали, доки лихо — ${ingredients.disaster} — не стало далеким.`),
      pool: chapter('pool', 'Вода перед питаннями', 'Шепітливий ставок', `На кожному світанку завдяки турботі ${name} дорожній пил змивали з плащів гостей ще до запитання про їхні імена. Вода й досі шепоче обітницю: «${ingredients.vow}»`),
      root: chapter('root', 'Незамкнена кімната', 'Маленькі потаємні двері', `За живим корінням чекає вузька кімната з ковдрами й хлібом. Двері в місці «${place}» ніколи не замикали: прихисток мав належати кожному, хто його знайшов.`),
      bell: chapter('bell', 'Застереження під дощем', 'Дощовий дзвін', `Завдяки ${name} дзвін рухався крізь темряву, поки ${ingredients.disaster}. Кожен удар означав: місце «${place}» досі стоїть, а наступний крок безпечний.`),
      moth: chapter('moth', 'Листи отримують крила', 'Паперова зграя', `Сотні складених записок вилетіли зі стін місця «${place}» на паперових крилах. Кожна несла загубленим обіцянку ${name}: «${ingredients.vow}» Деякі поверталися з іменами.`),
      moon: chapter('moon', 'Ім’я для ранку', 'Названий місяць', `Дитина біля вікна не могла заснути. Порожній місяць отримав від ${name} назву на честь образу «${motif}». Вигадане ім’я пережило бурю й стало словом для хоробрості.`),
      garden: chapter('garden', 'Сад, що відповів', 'Сад ліхтарів', `Коли лампи згасли, теплі квіти, посаджені ${name} край дороги, зберегли відблиск образу «${motif}» — досить, щоб показати одному мандрівникові наступний крок.`),
    },
    ending: {
      title: firstUpper(role),
      story: `Метою ${name} не було повернення до місця «${place}». Воно було створене для всіх, хто ще в дорозі. Коли ${ingredients.disaster}, спогади стали світлом, що вело інших крізь темряву. ${firstUpper(ingredients.truth)}. Ця галявина виросла з того, що було віддано, а кожна повернена пам’ятка береже давню обітницю: ${ingredients.vow}`,
    },
  };
}

export function createWovenStory(character: Character, seed: number) { return composeStory(character, seed, wovenIngredients(seed), 'woven'); }

const LEGACY_ARC: StoryArc = {
  seed: 0, source: 'woven', worldName: 'Дім Ліхтарів', runMark: 'ДАВНЯ',
  premise: 'Забута дорога перетинає цю галявину. Розсипані спогади ведуть до Дому Ліхтарів і правди про його зниклого хранителя.',
  question: 'Хто підтримував вогонь?', firstClue: '', recovered: '', chapters: MEMORY_CHAPTERS, ending: LANTERN_HOUSE_ENDING,
};

export function storyFor(state: GameState): StoryArc {
  if (state.storyArc) return state.storyArc;
  return { ...LEGACY_ARC, firstClue: `Стерті літери повертаються: «Дім Ліхтарів». Від цих слів у грудях ${state.character.name} стає тепло. Колись ця дорога вже вела вперед.`, recovered: `${state.character.name} згадує шлях крізь бурю до далекого світла — хтось підтримував його, щоб дорогу додому можна було знайти.` };
}
