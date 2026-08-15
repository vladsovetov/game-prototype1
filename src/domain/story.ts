import { seededRandom } from './random';
import { createRunDirection, REGION_NAMES, WEATHER_NAMES } from './run-direction';
import type { Character, GameState, RunDirection, StoryArc, StoryChapter, StoryFrameId } from './types';
import { LANTERN_HOUSE_ENDING, MEMORY_CHAPTERS } from './memory-arc';
import { ROAD_HOME } from './memory';
import { getActiveLocale, localeTag, localizedCopy, type Locale } from '../i18n/locale';

export interface StoryIngredients { place: string; role: string; disaster: string; vow: string; motif: string; truth: string }

const PLACES = ['Дім Блакитних Вікон', 'Прихисток Метеликового Дзвону', 'Архів Дощу', 'Остання Тепла Станція', 'Сад Малих Місяців'];
const ROLES = ['хранитель нічної дороги', 'слухач біля дверей погоди', 'реставратор імен мандрівників', 'картограф зниклих шляхів', 'садівник позиченого світла'];
const DISASTERS = ['ріка піднялася в небо', 'срібна буря стерла всі дороги', 'місяць згас на сім ночей', 'дзвони забули попередити долину', 'вітер забрав усі імена'];
const VOWS = ['Жоден заблукалий мандрівник не зустріне темряву на самоті.', 'Я залишатиму світло на кожному роздоріжжі.', 'Кожного незнайомця спершу приймуть, а вже потім розпитають.', 'Те, що розвіє буря, я обережно зберу.', 'Я пам’ятатиму за тих, хто не може.'];
const MOTIFS = ['блакитна нитка', 'дощ на теплому склі', 'чотири тихі ноти', 'паперові крила', 'золоті зерна'];
const TRUTHS = ['домом був прихисток, створений для інших', 'спогади стали вогнями, що вивели всіх із темряви', 'дорога вціліла, бо незнайомці навчилися дбати одне про одного', 'пошуки прихистку насправді були його створенням', 'кожна врятована людина понесла частинку цієї пам’яті далі'];

const INGREDIENTS:Record<Exclude<Locale,'uk'>,{places:string[];roles:string[];disasters:string[];vows:string[];motifs:string[];truths:string[]}>= {
  en:{
    places:['House of Blue Windows','Moth Bell Refuge','Rain Archive','Last Warm Station','Garden of Small Moons'],
    roles:['keeper of the night road','listener at the weather door','restorer of travelers’ names','cartographer of vanished paths','gardener of borrowed light'],
    disasters:['the river rose into the sky','a silver storm erased every road','the moon went dark for seven nights','the bells forgot to warn the valley','the wind carried away every name'],
    vows:['No lost traveler will face the dark alone.','I will leave a light at every crossroads.','Every stranger will be welcomed before they are questioned.','What the storm scatters, I will carefully gather.','I will remember for those who cannot.'],
    motifs:['blue thread','rain on warm glass','four quiet notes','paper wings','golden seeds'],
    truths:['home was a refuge built for others','the memories became lights that led everyone out of the dark','the road survived because strangers learned to care for one another','the search for refuge was really the act of creating it','every rescued person carried a piece of this memory onward'],
  },
  ru:{
    places:['Дом Синих Окон','Приют Мотылькового Колокола','Архив Дождя','Последняя Тёплая Станция','Сад Малых Лун'],
    roles:['хранитель ночной дороги','слушатель у двери погоды','реставратор имён путников','картограф исчезнувших путей','садовник одолженного света'],
    disasters:['река поднялась в небо','серебряная буря стёрла все дороги','луна погасла на семь ночей','колокола забыли предупредить долину','ветер унёс все имена'],
    vows:['Ни один заблудившийся путник не встретит тьму в одиночку.','Я оставлю свет на каждом перекрёстке.','Каждого незнакомца сначала примут, а потом расспросят.','То, что развеет буря, я бережно соберу.','Я буду помнить за тех, кто не может.'],
    motifs:['синяя нить','дождь на тёплом стекле','четыре тихие ноты','бумажные крылья','золотые зёрна'],
    truths:['домом был приют, созданный для других','воспоминания стали огнями, которые вывели всех из тьмы','дорога уцелела, потому что незнакомцы научились заботиться друг о друге','поиск приюта на самом деле был его созданием','каждый спасённый человек понёс частицу этой памяти дальше'],
  },
};

function pick<T>(values: readonly T[], random: () => number) { return values[Math.floor(random() * values.length)]!; }

export function wovenIngredients(seed: number, locale: Locale = getActiveLocale()): StoryIngredients {
  const random = seededRandom((seed ^ 0x51f15e) >>> 0);
  const values=locale==='uk'?{places:PLACES,roles:ROLES,disasters:DISASTERS,vows:VOWS,motifs:MOTIFS,truths:TRUTHS}:INGREDIENTS[locale];
  return { place: pick(values.places, random), role: pick(values.roles, random), disaster: pick(values.disasters, random), vow: pick(values.vows, random), motif: pick(values.motifs, random), truth: pick(values.truths, random) };
}

export function modelDirectedIngredients(direction: string, seed: number, locale: Locale = getActiveLocale()): StoryIngredients {
  let directedSeed = (seed ^ 0x811c9dc5) >>> 0;
  for (const symbol of direction) {
    directedSeed ^= symbol.codePointAt(0) ?? 0;
    directedSeed = Math.imul(directedSeed, 0x01000193) >>> 0;
  }
  return wovenIngredients(directedSeed,locale);
}

function chapter(id: string, title: string, keepsake: string, story: string): StoryChapter { return { id, title, keepsake, story }; }
function firstUpper(value: string,locale:Locale=getActiveLocale()) { return value[0]?.toLocaleUpperCase(localeTag(locale)) + value.slice(1); }

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

function internationalFrameCopy(locale:Exclude<Locale,'uk'>,frame:StoryFrameId,name:string,place:string):FrameCopy{
  if(locale==='en'){
    if(frame==='harvest')return{mission:`${name} must prepare an abandoned orchard for its first shared harvest in years`,question:`For whom was the long table at “${place}” left set?`,thread:'Each restored object returns part of a recipe, a guest list, and a forgotten harvest celebration.',sign:'Beneath the moss appears a list of garden plots and an arrow toward the old storehouse.',ending:'The orchard once again gathers people who spent years on opposite sides of the valley around one table.'};
    if(frame==='surveyor')return{mission:`${name} follows a cartographer who never returned from the valley’s last survey`,question:'Why did the cartographer vanish one day before revealing a safe route?',thread:'Each repaired marker adds a coordinate and a short note from the missing cartographer to the field map.',sign:'The road sign is a survey marker; the first coordinate is carved into its back.',ending:'The completed map shows that the cartographer left the route not for glory, but to lead the residents away from danger.'};
    if(frame==='water-route')return{mission:`${name} must restore the old water route to settlements whose wells have run dry`,question:'Who blocked the water, and what danger was it meant to keep from the valley?',thread:'Each mechanism returns water to another canal section and reveals a page from the lock keeper’s log.',sign:'The guide boards form a canal diagram with an emergency gate marked on it.',ending:'The water returns by a new course: the recovered notes reveal a safer path to every home.'};
    return{mission:`${name} must reopen a remote road station before the weather turns`,question:`Who left the key to “${place}”, and why did they never return for it?`,thread:'Each restored object returns part of the timetable, a traveler’s name, and a page from the station log.',sign:'An old timetable and an arrow to the service entrance emerge on the waypost.',ending:'The station lights its windows just as the first travelers appear on the road ahead of the storm.'};
  }
  if(frame==='harvest')return{mission:`${name} должен подготовить заброшенный сад к первому за много лет общему урожаю`,question:`Для кого в «${place}» оставили накрытым длинный стол?`,thread:'Каждая восстановленная вещь возвращает часть рецепта, списка гостей и забытого праздника урожая.',sign:'Под мхом проступает список садовых участков и стрелка к старому складу.',ending:'Сад снова собирает за одним столом тех, кто годами жил по разные стороны долины.'};
  if(frame==='surveyor')return{mission:`${name} идёт по следу картографа, не вернувшегося с последнего измерения долины`,question:'Почему картограф исчез за день до открытия безопасного пути?',thread:'Каждая починенная метка добавляет на полевую карту координату и заметку исчезнувшего картографа.',sign:'Дорожный знак оказывается геодезической меткой; с обратной стороны вырезана первая координата.',ending:'Завершённая карта показывает: маршрут оставили не ради славы, а чтобы увести жителей от опасности.'};
  if(frame==='water-route')return{mission:`${name} должен восстановить старый водный путь к поселениям с высохшими колодцами`,question:'Кто перекрыл воду и от какой опасности это должно было спасти долину?',thread:'Каждый механизм возвращает воду на новый участок канала и открывает запись смотрителя шлюзов.',sign:'Направляющие доски складываются в схему каналов с отмеченным аварийным шлюзом.',ending:'Вода возвращается новым руслом: собранные записи позволяют провести безопасный путь к каждому дому.'};
  return{mission:`${name} должен снова открыть дальнюю дорожную станцию до прихода непогоды`,question:`Кто оставил ключ от «${place}» и почему не вернулся за ним?`,thread:'Каждая восстановленная вещь возвращает часть расписания, имя путника и страницу станционного журнала.',sign:'На указателе проступают старое расписание и стрелка к служебному входу.',ending:'Станция зажигает окна именно тогда, когда на дороге появляются первые путники перед бурей.'};
}

function composeInternationalStory(character:Character,seed:number,ingredients:StoryIngredients,source:StoryArc['source'],direction:RunDirection,locale:Exclude<Locale,'uk'>):StoryArc{
  const name=character.name,place=ingredients.place,motif=ingredients.motif,role=ingredients.role;
  const frame=internationalFrameCopy(locale,direction.frame,name,place);
  const region={en:{orchard:'Old Apple Orchard',marsh:'Quiet Marsh Path',highland:'Windy Highlands',coast:'Signal-Light Coast'},ru:{orchard:'Сад старых яблонь',marsh:'Тихая болотная тропа',highland:'Ветреное нагорье',coast:'Берег сигнальных огней'}}[locale][direction.region];
  const weather={en:{sunbreak:'sun after rain',rain:'fine rain',mist:'low mist',wind:'strong wind'},ru:{sunbreak:'солнце после дождя',rain:'мелкий дождь',mist:'низкий туман',wind:'сильный ветер'}}[locale][direction.weather];
  const c=(id:string,title:string,keepsake:string,story:string)=>chapter(id,title,keepsake,story);
  if(locale==='en')return{
    seed:seed>>>0,source,locale,direction,worldName:place,runMark:(seed>>>0).toString(16).toUpperCase().padStart(8,'0').slice(-6),
    premise:`${name} wakes near “${place}” in ${region}, under ${weather}. ${frame.mission}. A ${role} once worked here with a ${character.gift.name}, until ${ingredients.disaster}. ${frame.thread}`,
    question:frame.question,firstClue:`${frame.sign} A name returns: “${place}”. Beside it is a vow: ${ingredients.vow}`,
    recovered:`${name} remembers how ${ingredients.disaster}. “${motif}” was not a dream but a mark on the work notes. ${frame.thread}`,
    chapters:{
      sign:c('sign','The First Marker','Restored waypost',`${frame.sign} For ${name}, this is the first proof that the work at “${place}” is real, not a fragment of a dream.`),
      stone:c('stone','Signal Under Stone','Tuned resonator',`The stone resonator plays a four-note work signal. ${frame.thread} “${motif}” is scratched into its casing.`),
      pool:c('pool','The Pump Runs','Repaired pump',`The hand pump supplies clean water again. The log receives a sentence—“${ingredients.vow}”—and a new route fragment.`),
      root:c('root','Storehouse Under Roots','Opened storehouse',`Behind the cleared roots, ${name} finds a dry storehouse with rope, blankets, bread, and practical notes for the mission.`),
      bell:c('bell','Weather Signal','Tuned bell',`The repaired signal bell warns the valley as ${ingredients.disaster}. Its rhythm matches the marks on the map.`),
      moth:c('moth','Field Notes','Delivered letters',`Weatherproof notes contain names, dates, and short accounts. Together they explain who waited at “${place}”.`),
      moon:c('moon','Night Marker','Lit signal lamp',`The signal lamp receives the mark “${motif}” and becomes visible from afar. Its light reveals a hidden part of the work plan.`),
      garden:c('garden','A Plot Returns to Life','Tended plot',`Pruned and tied plants reveal a stone tablet with the final part of the vow and the path to “${place}”.`),
    },ending:{title:firstUpper(role,locale),story:`${frame.ending} ${name} understands that the goal was not merely to recover memories, but to finish the work interrupted when ${ingredients.disaster}. ${firstUpper(ingredients.truth,locale)}. Every recovered note leads to “${place}”, and “${motif}” becomes its new sign. The old vow remains a rule for every traveler who follows: ${ingredients.vow}`},
  };
  return{
    seed:seed>>>0,source,locale,direction,worldName:place,runMark:(seed>>>0).toString(16).toUpperCase().padStart(8,'0').slice(-6),
    premise:`${name} просыпается возле «${place}» в местности «${region}», где царит ${weather}. ${frame.mission}. Когда-то здесь работал ${role} с инструментом «${character.gift.name}», но затем ${ingredients.disaster}. ${frame.thread}`,
    question:frame.question,firstClue:`${frame.sign} Возвращается название: «${place}». Рядом записана клятва: ${ingredients.vow}`,
    recovered:`${name} вспоминает, как ${ingredients.disaster}. Образ «${motif}» был не сном, а знаком в рабочих записях. ${frame.thread}`,
    chapters:{
      sign:c('sign','Первая отметка','Восстановленный указатель',`${frame.sign} Для ${name} это первое доказательство того, что работа в «${place}» реальна, а не обломок сна.`),
      stone:c('stone','Сигнал под камнем','Настроенный резонатор',`Каменный резонатор воспроизводит рабочий сигнал из четырёх нот. ${frame.thread} На корпусе вырезан знак «${motif}».`),
      pool:c('pool','Насос запущен','Отремонтированный насос',`Ручной насос снова подаёт чистую воду. В журнал возвращается фраза «${ingredients.vow}» и новый фрагмент маршрута.`),
      root:c('root','Склад под корнями','Открытый склад',`За расчищенными корнями ${name} находит сухой склад с верёвками, одеялами, хлебом и нужными для работы записями.`),
      bell:c('bell','Сигнал непогоды','Настроенный колокол',`Починенный сигнальный колокол предупреждает долину, когда ${ingredients.disaster}. Его ритм совпадает с отметками на карте.`),
      moth:c('moth','Полевые записки','Доставленные письма',`Защищённые от влаги записи содержат имена, даты и свидетельства. Вместе они объясняют, кто ждал в «${place}».`),
      moon:c('moon','Ночная метка','Зажжённая сигнальная лампа',`Сигнальная лампа получает знак «${motif}» и становится видна издалека. Её свет открывает скрытую часть рабочей схемы.`),
      garden:c('garden','Участок оживает','Ухоженный участок',`Подрезанные растения открывают каменную табличку с последней частью клятвы и дорогой к «${place}».`),
    },ending:{title:firstUpper(role,locale),story:`${frame.ending} ${name} понимает: целью было не только вернуть память, но и закончить работу, прерванную, когда ${ingredients.disaster}. ${firstUpper(ingredients.truth,locale)}. Все записи ведут к «${place}», а «${motif}» становится его новым знаком. Старая клятва остаётся правилом для следующих путников: ${ingredients.vow}`},
  };
}

export function composeStory(character: Character, seed: number, ingredients: StoryIngredients, source: StoryArc['source'], suppliedDirection?: RunDirection, locale:Locale=getActiveLocale()): StoryArc {
  const name = character.name, place = ingredients.place, motif = ingredients.motif, role = ingredients.role;
  const direction = suppliedDirection ?? createRunDirection(seed);
  if(locale!=='uk')return composeInternationalStory(character,seed,ingredients,source,direction,locale);
  const frame = frameCopy(direction.frame, name, place);
  const setting = `${REGION_NAMES[direction.region]}, де панує ${WEATHER_NAMES[direction.weather]}`;
  return {
    seed: seed >>> 0,
    source,
    locale,
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

export function createWovenStory(character: Character, seed: number, direction = createRunDirection(seed),locale:Locale=getActiveLocale()) { return composeStory(character, seed, wovenIngredients(seed,locale), 'woven', direction,locale); }

const LEGACY_FRAME: Record<Locale, { worldName: string; runMark: string; premise: string }> = {
  uk: { worldName: 'Дім Ліхтарів', runMark: 'ДАВНЯ', premise: 'Забута дорога перетинає цю галявину. Розсипані спогади ведуть до Дому Ліхтарів і правди про його зниклого хранителя.' },
  en: { worldName: 'House of Lanterns', runMark: 'OLD', premise: 'A forgotten road crosses this clearing. Scattered memories lead to the House of Lanterns and the truth about its vanished keeper.' },
  ru: { worldName: 'Дом Фонарей', runMark: 'ДАВНЯ', premise: 'Забытая дорога пересекает эту поляну. Рассыпанные воспоминания ведут к Дому Фонарей и правде о его исчезнувшем хранителе.' },
};

export function storyFor(state: GameState): StoryArc {
  if (state.storyArc) return state.storyArc;
  const frame = localizedCopy(LEGACY_FRAME);
  return {
    seed: 0, source: 'woven', locale: getActiveLocale(), worldName: frame.worldName, runMark: frame.runMark,
    premise: frame.premise, question: ROAD_HOME.question,
    firstClue: ROAD_HOME.firstClue(state.character.name), recovered: ROAD_HOME.recovered(state.character.name),
    chapters: MEMORY_CHAPTERS, ending: LANTERN_HOUSE_ENDING,
  };
}
