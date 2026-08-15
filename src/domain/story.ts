import { seededRandom } from './random';
import { createRunDirection, REGION_NAMES, WEATHER_NAMES } from './run-direction';
import type { Character, GameState, RunDirection, StoryArc, StoryChapter, StoryFrameId } from './types';
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

export function modelDirectedIngredients(direction: string, seed: number): StoryIngredients {
  let directedSeed = (seed ^ 0x811c9dc5) >>> 0;
  for (const symbol of direction) {
    directedSeed ^= symbol.codePointAt(0) ?? 0;
    directedSeed = Math.imul(directedSeed, 0x01000193) >>> 0;
  }
  return wovenIngredients(directedSeed);
}

function chapter(id: string, title: string, keepsake: string, story: string): StoryChapter { return { id, title, keepsake, story }; }
function firstUpper(value: string) { return value[0]?.toLocaleUpperCase('uk-UA') + value.slice(1); }

interface FrameCopy {
  mission: string;
  question: string;
  thread: string;
  sign: string;
  ending: string;
}

function frameCopy(frame: StoryFrameId, name: string, place: string): FrameCopy {
  if (frame === 'harvest') return {
    mission: `${name} має підготувати занедбаний сад до першого за багато років спільного врожаю`,
    question: `Для кого в місці «${place}» залишили накритим довгий стіл?`,
    thread: 'Кожна відновлена річ повертає частину рецепта, списку гостей і забутого свята врожаю.',
    sign: 'Під шаром моху проступає список садових ділянок і стрілка до старої комори.',
    ending: 'Сад знову збирає за одним столом тих, хто роками жив по різні боки долини.',
  };
  if (frame === 'surveyor') return {
    mission: `${name} вирушає слідами картографа, який не повернувся з останнього вимірювання долини`,
    question: `Чому картограф зник за день до того, як мав відкрити безпечний шлях?`,
    thread: 'Кожна полагоджена позначка додає до польової карти координату й коротку нотатку зниклого картографа.',
    sign: 'Дорожній знак виявляється геодезичною міткою; на звороті вирізано першу координату.',
    ending: 'Завершена карта показує: картограф залишив маршрут не для слави, а щоб вивести мешканців з небезпеки.',
  };
  if (frame === 'water-route') return {
    mission: `${name} мусить відновити старий водний шлях до поселень, де висохли криниці`,
    question: `Хто перекрив воду — і від якої небезпеки це мало врятувати долину?`,
    thread: 'Кожен механізм повертає воду на нову ділянку каналу й відкриває фрагмент запису доглядача шлюзів.',
    sign: 'Напрямні дошки складаються у схему каналів із позначеним аварійним шлюзом.',
    ending: 'Вода повертається не старим руслом: зібрані записи дозволяють прокласти безпечніший шлях до кожної оселі.',
  };
  return {
    mission: `${name} має знову відкрити віддалену дорожню станцію до приходу негоди`,
    question: `Хто залишив ключ від місця «${place}» і чому так і не повернувся по нього?`,
    thread: 'Кожна відновлена річ повертає частину розкладу, ім’я мандрівника й одну сторінку станційного журналу.',
    sign: 'На дороговказі проступає старий розклад і стрілка до службового входу станції.',
    ending: 'Станція засвічує вікна саме тоді, коли на дорозі з’являються перші мандрівники перед бурею.',
  };
}

export function composeStory(character: Character, seed: number, ingredients: StoryIngredients, source: StoryArc['source'], suppliedDirection?: RunDirection): StoryArc {
  const name = character.name, place = ingredients.place, motif = ingredients.motif, role = ingredients.role;
  const direction = suppliedDirection ?? createRunDirection(seed);
  const frame = frameCopy(direction.frame, name, place);
  const setting = `${REGION_NAMES[direction.region]}, де панує ${WEATHER_NAMES[direction.weather]}`;
  return {
    seed: seed >>> 0,
    source,
    direction,
    worldName: place,
    runMark: (seed >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-6),
    premise: `${name} прокидається серед місцевості «${setting}». ${frame.mission}. Колись тут працював ${role} і користувався інструментом «${character.gift.name}», але потім ${ingredients.disaster}. ${frame.thread}`,
    question: frame.question,
    firstClue: `${frame.sign} Назва повертається: «${place}». Поруч записано обітницю: ${ingredients.vow}`,
    recovered: `${name} згадує, як ${ingredients.disaster}. Образ «${motif}» був не маренням, а умовним знаком на робочих записах. ${frame.thread}`,
    chapters: {
      sign: chapter('sign', 'Перша позначка', 'Відновлений покажчик', `${frame.sign} Для ${name} це перший доказ, що завдання в місці «${place}» реальне, а не уламок сну.`),
      stone: chapter('stone', 'Сигнал під каменем', 'Налаштований резонатор', `Кам’яний резонатор відтворює робочий сигнал із чотирьох нот. ${frame.thread} На його корпусі видряпано образ «${motif}».`),
      pool: chapter('pool', 'Запущена помпа', 'Відремонтована помпа', `Після ремонту ручна помпа знову подає чисту воду. У журнал потрапляє фраза: «${ingredients.vow}» — і новий фрагмент маршруту.`),
      root: chapter('root', 'Комора під корінням', 'Відкрита комора', `За розчищеним корінням ${name} знаходить суху комору з мотузками, ковдрами й хлібом. На дверях — практичні записи, потрібні для завдання.`),
      bell: chapter('bell', 'Сигнал негоди', 'Налаштований дзвін', `Полагоджений сигнальний дзвін попереджає долину, поки насувається лихо — ${ingredients.disaster}. Його ритм збігається з позначками на карті.`),
      moth: chapter('moth', 'Польові записки', 'Пачка доставлених листів', `Захищені від вологи записки містять імена, дати й короткі свідчення. Разом вони пояснюють, хто чекав у місці «${place}».`),
      moon: chapter('moon', 'Нічна мітка', 'Запалена сигнальна лампа', `Сигнальна лампа отримує позначку «${motif}» і стає видимою здалеку. Її світло відкриває приховану частину робочої схеми.`),
      garden: chapter('garden', 'Ділянка повертається до життя', 'Доглянута ділянка', `Обрізані й підв’язані рослини відкривають кам’яну табличку. На ній — остання частина обітниці та шлях до місця «${place}».`),
    },
    ending: {
      title: firstUpper(role),
      story: `${frame.ending} ${name} розуміє: метою було не просто повернути пам’ять, а завершити конкретну роботу, яку перервало лихо — ${ingredients.disaster}. ${firstUpper(ingredients.truth)}. Усі зібрані записи ведуть до місця «${place}», а образ «${motif}» стає його новим знаком. Давня обітниця лишається правилом для наступних мандрівників: ${ingredients.vow}`,
    },
  };
}

export function createWovenStory(character: Character, seed: number, direction = createRunDirection(seed)) { return composeStory(character, seed, wovenIngredients(seed), 'woven', direction); }

const LEGACY_ARC: StoryArc = {
  seed: 0, source: 'woven', worldName: 'Дім Ліхтарів', runMark: 'ДАВНЯ',
  premise: 'Забута дорога перетинає цю галявину. Розсипані спогади ведуть до Дому Ліхтарів і правди про його зниклого хранителя.',
  question: 'Хто підтримував вогонь?', firstClue: '', recovered: '', chapters: MEMORY_CHAPTERS, ending: LANTERN_HOUSE_ENDING,
};

export function storyFor(state: GameState): StoryArc {
  if (state.storyArc) return state.storyArc;
  return { ...LEGACY_ARC, firstClue: `Стерті літери повертаються: «Дім Ліхтарів». Від цих слів у грудях ${state.character.name} стає тепло. Колись ця дорога вже вела вперед.`, recovered: `${state.character.name} згадує шлях крізь бурю до далекого світла — хтось підтримував його, щоб дорогу додому можна було знайти.` };
}
