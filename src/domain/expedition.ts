import { getActiveLocale, localeTag, localizedCopy, type Locale } from '../i18n/locale';
import { GIFTS } from './catalog';
import { awardExpeditionRelic } from './relics';
import { assignSeasonBeat, beatForExpedition, colorNarrative, resolveSeasonBeat } from './season';
import { directionFor, REGION_NAMES } from './run-direction';
import type { ContractId, ExpeditionMeta, ExpeditionNarrative, ExpeditionProgress, ExpeditionReport, ExpeditionSituation, GameState, GiftId, Point, RefugeProjectId } from './types';
import { distance, worldFor } from './world';

export interface ContractDefinition{id:ContractId;name:string;brief:string;sitePool:string[]}
export interface WorkAction{tool:GiftId;title:string;outcome:string;supplies:number;insight:number;pressure:number}
export interface ExpeditionResult{ok:boolean;state:GameState;message:string;report?:ExpeditionReport}

const CONTRACT_COPY: Record<Locale, Record<ContractId, ContractDefinition>> = {
  uk: {
    'water-route': { id: 'water-route', name: 'Відновити водний маршрут', brief: 'Полагодьте три ланки водопостачання й поверніться до Притулку.', sitePool: ['pool', 'root', 'sign', 'garden', 'stone'] },
    'signal-line': { id: 'signal-line', name: 'Підняти сигнальну лінію', brief: 'Знайдіть три слабкі місця в мережі польових сигналів.', sitePool: ['stone', 'bell', 'moon', 'sign', 'moth'] },
    'storm-shelter': { id: 'storm-shelter', name: 'Підготувати сховища', brief: 'Зміцніть три місця до погіршення погоди.', sitePool: ['root', 'sign', 'garden', 'moth', 'pool'] },
  },
  en: {
    'water-route': { id: 'water-route', name: 'Restore the water route', brief: 'Repair three water-supply links and return to the Refuge.', sitePool: ['pool', 'root', 'sign', 'garden', 'stone'] },
    'signal-line': { id: 'signal-line', name: 'Raise the signal line', brief: 'Find three weak points in the field-signal network.', sitePool: ['stone', 'bell', 'moon', 'sign', 'moth'] },
    'storm-shelter': { id: 'storm-shelter', name: 'Prepare the shelters', brief: 'Strengthen three places before the weather turns.', sitePool: ['root', 'sign', 'garden', 'moth', 'pool'] },
  },
  ru: {
    'water-route': { id: 'water-route', name: 'Восстановить водный маршрут', brief: 'Почините три звена водоснабжения и вернитесь в Убежище.', sitePool: ['pool', 'root', 'sign', 'garden', 'stone'] },
    'signal-line': { id: 'signal-line', name: 'Поднять сигнальную линию', brief: 'Найдите три слабых места в сети полевых сигналов.', sitePool: ['stone', 'bell', 'moon', 'sign', 'moth'] },
    'storm-shelter': { id: 'storm-shelter', name: 'Подготовить убежища', brief: 'Укрепите три места до ухудшения погоды.', sitePool: ['root', 'sign', 'garden', 'moth', 'pool'] },
  },
};
const PROJECT_COPY: Record<Locale, Record<RefugeProjectId, { id: RefugeProjectId; name: string; description: string; cost: { supplies: number; insight: number; rare: number } }>> = {
  uk: {
    workshop: { id: 'workshop', name: 'Польова майстерня', description: 'Додає верстак, креслення та тепле робоче світло.', cost: { supplies: 8, insight: 0, rare: 0 } },
    archive: { id: 'archive', name: 'Архів маршрутів', description: 'Наповнює Притулок мапами й записами з експедицій.', cost: { supplies: 0, insight: 6, rare: 0 } },
    'guest-canopy': { id: 'guest-canopy', name: 'Гостьовий навіс', description: 'Створює затишне місце для майбутніх мандрівників.', cost: { supplies: 6, insight: 0, rare: 1 } },
  },
  en: {
    workshop: { id: 'workshop', name: 'Field workshop', description: 'Adds a workbench, drawings, and warm working light.', cost: { supplies: 8, insight: 0, rare: 0 } },
    archive: { id: 'archive', name: 'Route archive', description: 'Fills the Refuge with maps and expedition notes.', cost: { supplies: 0, insight: 6, rare: 0 } },
    'guest-canopy': { id: 'guest-canopy', name: 'Guest canopy', description: 'Makes a sheltered place for future travelers.', cost: { supplies: 6, insight: 0, rare: 1 } },
  },
  ru: {
    workshop: { id: 'workshop', name: 'Полевая мастерская', description: 'Добавляет верстак, чертежи и тёплый рабочий свет.', cost: { supplies: 8, insight: 0, rare: 0 } },
    archive: { id: 'archive', name: 'Архив маршрутов', description: 'Наполняет Убежище картами и записями экспедиций.', cost: { supplies: 0, insight: 6, rare: 0 } },
    'guest-canopy': { id: 'guest-canopy', name: 'Гостевой навес', description: 'Создаёт уютное место для будущих путников.', cost: { supplies: 6, insight: 0, rare: 1 } },
  },
};
export const CONTRACTS = {} as Record<ContractId, ContractDefinition>;
for (const id of Object.keys(CONTRACT_COPY.uk) as ContractId[]) Object.defineProperty(CONTRACTS, id, { enumerable: true, get: () => localizedCopy(CONTRACT_COPY)[id] });
export const REFUGE_PROJECTS = {} as Record<RefugeProjectId, { id: RefugeProjectId; name: string; description: string; cost: { supplies: number; insight: number; rare: number } }>;
for (const id of Object.keys(PROJECT_COPY.uk) as RefugeProjectId[]) Object.defineProperty(REFUGE_PROJECTS, id, { enumerable: true, get: () => localizedCopy(PROJECT_COPY)[id] });

const TOOL_ORDER:GiftId[]=['reveal','grow','echo','mend'];
const EMPTY_META:ExpeditionMeta={completedContracts:0,supplies:0,insight:0,rareFinds:[],builtProjects:[],reports:[]};
const SITE_COPY: Record<Locale, Record<string, string>> = {
  uk: { stone: 'резонатора', sign: 'покажчика', pool: 'водяної помпи', root: 'входу до комори', bell: 'сигнального дзвона', moth: 'польових записок', moon: 'сигнальної лампи', garden: 'робочої ділянки' },
  en: { stone: 'the resonator', sign: 'the marker', pool: 'the water pump', root: 'the storehouse door', bell: 'the signal bell', moth: 'the field notes', moon: 'the signal lamp', garden: 'the work plot' },
  ru: { stone: 'резонатора', sign: 'указателя', pool: 'водяной помпы', root: 'входа на склад', bell: 'сигнального колокола', moth: 'полевых записок', moon: 'сигнальной лампы', garden: 'рабочего участка' },
};
const VERB_COPY: Record<Locale, Record<GiftId, string>> = {
  uk: { reveal: 'Оглянути з ліхтарем', grow: 'Розчистити секатором', echo: 'Перевірити камертоном', mend: 'Полагодити набором' },
  en: { reveal: 'Inspect with the flashlight', grow: 'Clear with the shears', echo: 'Check with the tuning fork', mend: 'Repair with the kit' },
  ru: { reveal: 'Осмотреть фонариком', grow: 'Расчистить секатором', echo: 'Проверить камертоном', mend: 'Починить набором' },
};
const RESULT_COPY: Record<Locale, Record<GiftId, { outcome: string; supplies: number; insight: number; pressure: number }>> = {
  uk: {
    reveal: { outcome: 'Приховані позначки відкрили безпечніший шлях і корисну схему.', supplies: 1, insight: 2, pressure: 0 },
    grow: { outcome: 'Зарості розчищено швидко, але робота під відкритим небом виснажила час.', supplies: 2, insight: 0, pressure: 2 },
    echo: { outcome: 'Перевірка звуком знайшла дефект без розбирання механізму.', supplies: 1, insight: 2, pressure: 1 },
    mend: { outcome: 'Вузол укріплено надійно, а придатні деталі складено до наплічника.', supplies: 2, insight: 1, pressure: 1 },
  },
  en: {
    reveal: { outcome: 'Hidden marks revealed a safer path and a useful diagram.', supplies: 1, insight: 2, pressure: 0 },
    grow: { outcome: 'The overgrowth was cleared quickly, but open-air work cost time.', supplies: 2, insight: 0, pressure: 2 },
    echo: { outcome: 'A sound check found the fault without taking the mechanism apart.', supplies: 1, insight: 2, pressure: 1 },
    mend: { outcome: 'The joint is secured, and usable parts go into the pack.', supplies: 2, insight: 1, pressure: 1 },
  },
  ru: {
    reveal: { outcome: 'Скрытые метки открыли более безопасный путь и полезную схему.', supplies: 1, insight: 2, pressure: 0 },
    grow: { outcome: 'Заросли расчищены быстро, но работа под открытым небом отняла время.', supplies: 2, insight: 0, pressure: 2 },
    echo: { outcome: 'Проверка звуком нашла дефект без разборки механизма.', supplies: 1, insight: 2, pressure: 1 },
    mend: { outcome: 'Узел укреплён надёжно, а годные детали сложены в рюкзак.', supplies: 2, insight: 1, pressure: 1 },
  },
};
const SITE_NAMES = new Proxy({} as Record<string, string>, { get: (_t, id: string) => localizedCopy(SITE_COPY)[id] });
const VERBS = new Proxy({} as Record<GiftId, string>, { get: (_t, id: string) => localizedCopy(VERB_COPY)[id as GiftId] });
const RESULTS = new Proxy({} as Record<GiftId, { outcome: string; supplies: number; insight: number; pressure: number }>, { get: (_t, id: string) => localizedCopy(RESULT_COPY)[id as GiftId] });

const SITUATIONS:ExpeditionSituation[]=['зникнення','поломка','хибний-сигнал','слід-мандрівника','природна-зміна'];
const MOODS:ExpeditionNarrative['mood'][]=['тиха-тривога','тепла-надія','польова-таємниця','наближення-бурі'];
const PALETTES:ExpeditionNarrative['palette'][]=['мідь-мох','синій-дощ','бурштин-туман','крейда-хвоя'];
const CAUSES: Record<Locale, Record<ContractId, string[]>> = {
  uk: {
    'water-route': ['Нічний клапан відводить воду до покинутої теплиці.', 'Коріння повільно стискає старі керамічні труби.', 'Хтось залишив відкритим резервний канал після останньої зливи.', 'У водогоні оселилася колонія світних равликів.', 'Стара помпа реагує на сигнальні вогні замість рівня води.'],
    'signal-line': ['Вітер розвернув відбивачі до моря.', 'Один із маяків повторює давно записаний сигнал.', 'Птахи звили гніздо навколо теплого передавача.', 'Польовий кабель перетиснуло камінням після зсуву.', 'Невідомий мандрівник відповідає з покинутого поста.'],
    'storm-shelter': ['Підземна вода розмила опори навісів.', 'Старі кріплення не витримують нового напрямку вітру.', 'Хтось уже підготував одне зі сховищ, але не залишив імені.', 'Сигнальні полотнища збивають мешканців із безпечного маршруту.', 'Тепле повітря з тунелю притягує бурю до схилу.'],
  },
  en: {
    'water-route': ['A night valve is sending water to an abandoned greenhouse.', 'Roots are slowly crushing the old ceramic pipes.', 'Someone left a reserve channel open after the last downpour.', 'A colony of glowing snails has settled in the water line.', 'The old pump answers signal lights instead of the water level.'],
    'signal-line': ['The wind turned the reflectors toward the sea.', 'One beacon is repeating a long-recorded signal.', 'Birds nested around a warm transmitter.', 'A field cable was pinched by stone after a slide.', 'An unknown traveler answers from an abandoned post.'],
    'storm-shelter': ['Groundwater has washed out the canopy supports.', 'Old fittings cannot take the new wind direction.', 'Someone already prepared one shelter, but left no name.', 'Signal banners are turning residents off the safe route.', 'Warm air from a tunnel is drawing the storm toward the slope.'],
  },
  ru: {
    'water-route': ['Ночной клапан отводит воду в заброшенную теплицу.', 'Корни медленно сжимают старые керамические трубы.', 'Кто-то оставил открытым резервный канал после последнего ливня.', 'В водоводе поселилась колония светящихся улиток.', 'Старая помпа реагирует на сигнальные огни вместо уровня воды.'],
    'signal-line': ['Ветер развернул отражатели к морю.', 'Один из маяков повторяет давно записанный сигнал.', 'Птицы свили гнездо вокруг тёплого передатчика.', 'Полевой кабель пережало камнем после сдвига.', 'Неизвестный путник отвечает с покинутого поста.'],
    'storm-shelter': ['Подземная вода размыла опоры навесов.', 'Старые крепления не выдерживают нового направления ветра.', 'Кто-то уже подготовил одно убежище, но не оставил имени.', 'Сигнальные полотнища сбивают жителей с безопасного маршрута.', 'Тёплый воздух из тоннеля тянет бурю к склону.'],
  },
};
const TITLES: Record<Locale, Record<ContractId, string[]>> = {
  uk: {
    'water-route': ['Вода, що йде вночі', 'Сліди біля старої помпи', 'Теплиця під сухим дощем', 'Клапан для забутого саду', 'Світло у водогоні'],
    'signal-line': ['Відповідь із порожнього поста', 'Маяк, що пам’ятає голос', 'Лінія над вітряним схилом', 'Теплий передавач', 'Сигнал після тиші'],
    'storm-shelter': ['Навіси перед північним вітром', 'Сховище без імені', 'Опори під мокрим каменем', 'Буря й теплий тунель', 'Полотнища хибного шляху'],
  },
  en: {
    'water-route': ['Water that leaves at night', 'Tracks by the old pump', 'Greenhouse under dry rain', 'A valve for a forgotten garden', 'Light in the water line'],
    'signal-line': ['An answer from an empty post', 'A beacon that remembers a voice', 'A line above the windy slope', 'A warm transmitter', 'A signal after silence'],
    'storm-shelter': ['Canopies before the north wind', 'A shelter without a name', 'Supports under wet stone', 'A storm and a warm tunnel', 'Banners of a false path'],
  },
  ru: {
    'water-route': ['Вода, что уходит ночью', 'Следы у старой помпы', 'Теплица под сухим дождём', 'Клапан для забытого сада', 'Свет в водоводе'],
    'signal-line': ['Ответ с пустого поста', 'Маяк, который помнит голос', 'Линия над ветреным склоном', 'Тёплый передатчик', 'Сигнал после тишины'],
    'storm-shelter': ['Навесы перед северным ветром', 'Убежище без имени', 'Опоры под мокрым камнем', 'Буря и тёплый тоннель', 'Полотнища ложного пути'],
  },
};
const OBSERVATIONS: Record<Locale, Record<string, string[]>> = {
  uk: {
    stone: ['На камені видно свіжу крейдяну мітку.', 'Під плитою рівномірно гуде механізм.', 'У тріщині застряг клаптик польової мапи.'],
    sign: ['Стрілку нещодавно повернули на схід.', 'На звороті покажчика записано рівень води.', 'Біля основи лежить нова мотузка.'],
    pool: ['Корпус помпи теплий, хоча мотор мовчить.', 'На краю резервуара лишилися мокрі сліди.', 'Вода пахне міддю та свіжим листям.'],
    root: ['Коріння обплело справний з’єднувач.', 'З-під арки чути рівний потік повітря.', 'Між корінням затиснуто робочу рукавицю.'],
    bell: ['Дзвін відповідає коротким подвійним відлунням.', 'Мотузка натягнута в бік старого поста.', 'На металі проступив новий візерунок.'],
    moth: ['Польові записи складено за напрямком вітру.', 'На папері є незнайома схема укриття.', 'Останній рядок написано сьогодні.'],
    moon: ['Лампа блимає у ритмі далекого сигналу.', 'Скло повернуте до покинутого маршруту.', 'У корпусі бракує лише одного контакту.'],
    garden: ['Одна грядка вкрита росою серед сухої землі.', 'Під ґрунтом чути порожнистий метал.', 'Садові кілки утворюють стрілку до схилу.'],
  },
  en: {
    stone: ['A fresh chalk mark is visible on the stone.', 'A mechanism hums evenly under the slab.', 'A scrap of field map is stuck in the crack.'],
    sign: ['The arrow was recently turned east.', 'The water level is written on the back of the marker.', 'A new rope lies by the base.'],
    pool: ['The pump housing is warm, though the motor is silent.', 'Wet tracks remain on the reservoir rim.', 'The water smells of copper and fresh leaves.'],
    root: ['Roots have wrapped a working connector.', 'A steady flow of air comes from under the arch.', 'A work glove is caught between the roots.'],
    bell: ['The bell answers with a short double echo.', 'The rope is pulled toward the old post.', 'A new pattern has appeared on the metal.'],
    moth: ['The field notes are stacked with the wind.', 'An unfamiliar shelter diagram is on the paper.', 'The last line was written today.'],
    moon: ['The lamp blinks in the rhythm of a distant signal.', 'The glass is turned toward an abandoned route.', 'Only one contact is missing from the housing.'],
    garden: ['One bed is covered in dew among dry earth.', 'Hollow metal sounds under the soil.', 'Garden stakes form an arrow toward the slope.'],
  },
  ru: {
    stone: ['На камне видна свежая меловая метка.', 'Под плитой ровно гудит механизм.', 'В трещине застрял клочок полевой карты.'],
    sign: ['Стрелку недавно повернули на восток.', 'На обороте указателя записан уровень воды.', 'У основания лежит новая верёвка.'],
    pool: ['Корпус помпы тёплый, хотя мотор молчит.', 'На краю резервуара остались мокрые следы.', 'Вода пахнет медью и свежей листвой.'],
    root: ['Корни обплели исправный соединитель.', 'Из-под арки слышен ровный поток воздуха.', 'Между корнями зажата рабочая перчатка.'],
    bell: ['Колокол отвечает коротким двойным эхом.', 'Верёвка натянута в сторону старого поста.', 'На металле проступил новый узор.'],
    moth: ['Полевые записи сложены по направлению ветра.', 'На бумаге есть незнакомая схема укрытия.', 'Последняя строка написана сегодня.'],
    moon: ['Лампа мигает в ритме далёкого сигнала.', 'Стекло повёрнуто к покинутому маршруту.', 'В корпусе не хватает лишь одного контакта.'],
    garden: ['Одна грядка покрыта росой среди сухой земли.', 'Под почвой слышен полый металл.', 'Садовые колья образуют стрелку к склону.'],
  },
};
const FALLBACK_LINE: Record<Locale, { leftover: string; lead: string; warning: string; rare: Record<ContractId, string> }> = {
  uk: { leftover: 'Тут лишився свіжий слід польової роботи.', lead: 'За останньою точкою помітно слабкий слід, якого немає на мапі.', warning: 'Дальній маршрут посилить негоду й може коштувати частини припасів.', rare: { 'water-route': 'жетон старого водника', 'signal-line': 'скло польового маяка', 'storm-shelter': 'пряжка невідомого мандрівника' } },
  en: { leftover: 'A fresh trace of field work remains here.', lead: 'Beyond the last point a faint trail appears that is not on the map.', warning: 'The farther route will worsen the weather and may cost some supplies.', rare: { 'water-route': 'an old waterman’s token', 'signal-line': 'field-beacon glass', 'storm-shelter': 'an unknown traveler’s buckle' } },
  ru: { leftover: 'Здесь остался свежий след полевой работы.', lead: 'За последней точкой заметен слабый след, которого нет на карте.', warning: 'Дальний маршрут усилит непогоду и может стоить части припасов.', rare: { 'water-route': 'жетон старого водника', 'signal-line': 'стекло полевого маяка', 'storm-shelter': 'пряжка неизвестного путника' } },
};

function fallbackNarrative(contractId:ContractId,siteIds:string[],seed:number,recentFingerprints:string[]):ExpeditionNarrative{
  const recent=new Set(recentFingerprints.slice(0,10));
  for(let attempt=0;attempt<20;attempt++){
    const value=((seed>>>0)+attempt*2654435761)>>>0;
    const situation=SITUATIONS[value%SITUATIONS.length]!;
    const mood=MOODS[Math.floor(value/5)%MOODS.length]!;
    const palette=PALETTES[Math.floor(value/20)%PALETTES.length]!;
    const causes=localizedCopy(CAUSES);
    const titles=localizedCopy(TITLES);
    const observations=localizedCopy(OBSERVATIONS);
    const line=localizedCopy(FALLBACK_LINE);
    const causeIndex=Math.floor(value/80)%causes[contractId].length;
    const fingerprint=`${situation}|${mood}|${palette}`;
    if(recent.has(fingerprint))continue;
    return {title:titles[contractId][causeIndex]!,situation,mood,palette,cause:causes[contractId][causeIndex]!,siteNotes:siteIds.map((siteId,index)=>({siteId,observation:(observations[siteId]??[line.leftover])[(value+index)%((observations[siteId]??[]).length||1)]!})),optionalLead:line.lead,warning:line.warning,rareFind:line.rare[contractId],visualTags:palette.split('-'),fingerprint,source:'fallback'};
  }
  return fallbackNarrative(contractId,siteIds,seed+1,[]);
}

export function expeditionNarrativeFor(state:GameState):ExpeditionNarrative|undefined{
  const run=state.expedition;if(!run)return undefined;
  return run.narrative??fallbackNarrative(run.contractId,[...run.siteIds,run.optionalSiteId],run.seed,expeditionMetaFor(state).reports.flatMap((report)=>report.narrativeFingerprint?[report.narrativeFingerprint]:[]));
}

function narrativeMatchesLocale(narrative:ExpeditionNarrative,locale:Locale){
  const text=`${narrative.title} ${narrative.cause} ${narrative.optionalLead}`;
  const latin=/[A-Za-z]/.test(text);
  const cyrillic=/[А-ЯЁІЇЄҐа-яёіїєґ]/.test(text);
  return locale==='en'?latin&&!cyrillic:cyrillic;
}

function localizeRareFind(find:string,contractId:ContractId,locale:Locale){
  for(const source of ['en','uk','ru'] as const){
    if(FALLBACK_LINE[source].rare[contractId]===find)return FALLBACK_LINE[locale].rare[contractId];
  }
  return find;
}

function remapAuthored(value:string,table:Record<Locale,readonly string[]>,locale:Locale){
  for(const source of ['en','uk','ru'] as const){
    const index=table[source].indexOf(value);
    if(index>=0)return table[locale][index]!;
  }
  return value;
}

export function localizeReports(reports:ExpeditionReport[],locale=getActiveLocale()){
  return reports.map((report)=>{
    const actions=report.actions.map((action)=>{
      const site=SITE_NAMES[action.siteId]??say('object');
      return {...action,title:`${VERBS[action.tool]} ${say('near')} ${site}`,outcome:RESULTS[action.tool].outcome};
    });
    return {
      ...report,
      title:remapAuthored(report.title,{en:TITLES.en[report.contractId],uk:TITLES.uk[report.contractId],ru:TITLES.ru[report.contractId]},locale),
      rareFinds:report.rareFinds.map((find)=>localizeRareFind(find,report.contractId,locale)),
      actions,
    };
  });
}

export function localizeExpedition(run:ExpeditionProgress,recentFingerprints:string[]=[]){
  const locale=getActiveLocale();
  const completed=run.completed.map((action)=>{
    const site=SITE_NAMES[action.siteId]??say('object');
    return {...action,title:`${VERBS[action.tool]} ${say('near')} ${site}`,outcome:RESULTS[action.tool].outcome};
  });
  const keepNarrative=run.narrative.source==='local-model'&&narrativeMatchesLocale(run.narrative,locale);
  return {
    ...run,
    completed,
    rareFinds:run.rareFinds.map((find)=>localizeRareFind(find,run.contractId,locale)),
    narrative:keepNarrative?run.narrative:fallbackNarrative(run.contractId,[...run.siteIds,run.optionalSiteId],run.seed,recentFingerprints),
  };
}

const clone=(state:GameState):GameState=>structuredClone(state);
const result=(state:GameState,ok:boolean,message:string,report?:ExpeditionReport):ExpeditionResult=>({state,ok,message,...(report?{report}:{})});

export function expeditionMetaFor(state:Pick<GameState,'expeditionMeta'>):ExpeditionMeta{
  const meta=state.expeditionMeta;
  return meta?{...EMPTY_META,...meta,rareFinds:[...(meta.rareFinds??[])],builtProjects:[...(meta.builtProjects??[])],reports:[...(meta.reports??[])]}:{...EMPTY_META,rareFinds:[],builtProjects:[],reports:[]};
}

const SAY: Record<Locale, Record<string, string>> = {
  uk: {
    alreadyOut: 'Спершу завершіть поточну експедицію.', twoTools: 'Оберіть рівно два різні інструменти.', noContract: 'Цей контракт недоступний.',
    started: 'Контракт «{name}» розпочато. Перша точка позначена на маршруті.', near: 'біля', object: 'об’єкта',
    noWork: 'Зараз немає доступної польової роботи.', approach: 'Підійдіть до позначеної точки з інструментом «{gift}».',
    doneOf: 'Виконано {done} з {total}.', rareSecured: 'Рідкісну знахідку закріплено; час повертатися.',
    noDecision: 'Рішення про дальній маршрут зараз недоступне.', goOn: 'Ви йдете далі. Погода посилиться, але там є рідкісна знахідка.',
    enough: 'Зібраного достатньо. Повертайтеся до воріт Притулку.', finishWork: 'Спершу завершіть польові роботи.',
    returnGate: 'Поверніться до воріт Притулку.', returns: 'повертається з маршруту.',
    finished: 'Експедицію завершено: +{supplies} припасів, +{insight} знань.',
    alreadyBuilt: 'Цей проєкт уже збудовано.', short: 'Для цього проєкту ще бракує матеріалів.',
    built: 'Проєкт «{name}» збудовано. Притулок змінився.',
    memory: '{name}: завершено {contract} «{title}»; {actions}.',
    summary: '{cause} {name} повертається з маршруту. {outcomes}',
  },
  en: {
    alreadyOut: 'Finish the current expedition first.', twoTools: 'Choose exactly two different tools.', noContract: 'This contract is unavailable.',
    started: 'Contract “{name}” has started. The first point is marked on the route.', near: 'near', object: 'the object',
    noWork: 'There is no field work available now.', approach: 'Approach the marked point with the tool “{gift}”.',
    doneOf: 'Completed {done} of {total}.', rareSecured: 'The rare find is secured; it is time to return.',
    noDecision: 'The farther-route decision is not available now.', goOn: 'You go farther. The weather will worsen, but a rare find is there.',
    enough: 'You have gathered enough. Return to the Refuge gate.', finishWork: 'Finish the field work first.',
    returnGate: 'Return to the Refuge gate.', returns: 'returns from the route.',
    finished: 'Expedition complete: +{supplies} supplies, +{insight} insight.',
    alreadyBuilt: 'This project is already built.', short: 'This project still needs more materials.',
    built: 'Project “{name}” is built. The Refuge has changed.',
    memory: '{name}: completed {contract} “{title}”; {actions}.',
    summary: '{cause} {name} returns from the route. {outcomes}',
  },
  ru: {
    alreadyOut: 'Сначала завершите текущую экспедицию.', twoTools: 'Выберите ровно два разных инструмента.', noContract: 'Этот контракт недоступен.',
    started: 'Контракт «{name}» начат. Первая точка отмечена на маршруте.', near: 'у', object: 'объекта',
    noWork: 'Сейчас нет доступной полевой работы.', approach: 'Подойдите к отмеченной точке с инструментом «{gift}».',
    doneOf: 'Выполнено {done} из {total}.', rareSecured: 'Редкая находка закреплена; пора возвращаться.',
    noDecision: 'Решение о дальнем маршруте сейчас недоступно.', goOn: 'Вы идёте дальше. Погода усилится, но там есть редкая находка.',
    enough: 'Собранного достаточно. Возвращайтесь к воротам Убежища.', finishWork: 'Сначала завершите полевые работы.',
    returnGate: 'Вернитесь к воротам Убежища.', returns: 'возвращается с маршрута.',
    finished: 'Экспедиция завершена: +{supplies} припасов, +{insight} знаний.',
    alreadyBuilt: 'Этот проект уже построен.', short: 'Для этого проекта ещё не хватает материалов.',
    built: 'Проект «{name}» построен. Убежище изменилось.',
    memory: '{name}: завершено {contract} «{title}»; {actions}.',
    summary: '{cause} {name} возвращается с маршрута. {outcomes}',
  },
};
function say(key: string, variables: Record<string, string | number> = {}) {
  let result = localizedCopy(SAY)[key] ?? key;
  for (const [name, value] of Object.entries(variables)) result = result.replaceAll(`{${name}}`, String(value));
  return result;
}

export function startExpedition(state:GameState,contractId:ContractId,loadout:GiftId[],seed=Date.now()):ExpeditionResult{
  if(state.expedition)return result(state,false,say('alreadyOut'));
  if(loadout.length!==2||loadout[0]===loadout[1]||loadout.some((tool)=>!TOOL_ORDER.includes(tool)))return result(state,false,say('twoTools'));
  const contract=CONTRACTS[contractId];
  if(!contract)return result(state,false,say('noContract'));
  const offset=(seed>>>0)%contract.sitePool.length;
  const route=Array.from({length:4},(_,index)=>contract.sitePool[(offset+index)%contract.sitePool.length]!);
  const recent=expeditionMetaFor(state).reports.flatMap((report)=>report.narrativeFingerprint?[report.narrativeFingerprint]:[]);
  const expedition:ExpeditionProgress={id:`${contractId}-${seed>>>0}`,contractId,seed:seed>>>0,loadout:[loadout[0]!,loadout[1]!],siteIds:route.slice(0,3),requiredTotal:3,completed:[],optionalSiteId:route[3]!,pressure:0,supplies:0,insight:0,rareFinds:[],status:'active',narrative:fallbackNarrative(contractId,route,seed,recent)};
  let next:GameState=assignSeasonBeat({...clone(state),expedition},expedition.id);
  const beat=beatForExpedition(next.season,expedition.id);
  if(beat&&next.season&&next.expedition)next={...next,expedition:{...next.expedition,narrative:colorNarrative(next.expedition.narrative,next.season,beat)}};
  return result(next,true,say('started',{name:contract.name}));
}

function sitePosition(state:GameState,siteId:string):Point|undefined{return worldFor(state).anomalies.find((site)=>site.id===siteId)?.position}

export function expeditionTarget(state:GameState):Point|undefined{
  const run=state.expedition;
  if(!run)return undefined;
  if(run.status==='returning')return worldFor(state).gate;
  if(run.status==='decision')return undefined;
  const required=run.siteIds[run.completed.length];
  const siteId=required??(run.optionalAccepted&&!run.optionalCompleted?run.optionalSiteId:undefined);
  return siteId?sitePosition(state,siteId):undefined;
}

export function availableWorkActions(state:GameState):WorkAction[]{
  const run=state.expedition,target=expeditionTarget(state);
  if(!run||run.status!=='active'||!target||distance(state.player,target)>165)return[];
  const completedRequired=run.completed.length<run.requiredTotal;
  const siteId=completedRequired?run.siteIds[run.completed.length]:run.optionalSiteId;
  return TOOL_ORDER.filter((tool)=>run.loadout.includes(tool)).map((tool)=>({tool,title:`${VERBS[tool]} ${say('near')} ${SITE_NAMES[siteId!]??say('object')}`,...RESULTS[tool]}));
}

export function applyWorkAction(state:GameState,tool:GiftId):ExpeditionResult{
  const run=state.expedition;
  if(!run||run.status!=='active')return result(state,false,say('noWork'));
  const action=availableWorkActions(state).find((candidate)=>candidate.tool===tool);
  if(!action)return result(state,false,say('approach',{gift:GIFTS[tool].name}));
  const next=clone(state),active=next.expedition!;
  const required=active.completed.length<active.requiredTotal;
  const siteId=required?active.siteIds[active.completed.length]!:active.optionalSiteId;
  active.completed.push({siteId,tool,title:action.title,outcome:action.outcome});
  active.supplies+=action.supplies; active.insight+=action.insight; active.pressure+=action.pressure;
  if(required&&active.completed.length===active.requiredTotal)active.status='decision';
  else if(!required){active.optionalCompleted=true;active.status='returning';active.pressure+=2;active.rareFinds.push(expeditionNarrativeFor(next)?.rareFind??rareFindFor(state));}
  return result(next,true,required?`${action.outcome} ${say('doneOf',{done:active.completed.length,total:active.requiredTotal})}`:`${action.outcome} ${say('rareSecured')}`);
}

export function chooseOptionalLead(state:GameState,accept:boolean):ExpeditionResult{
  if(state.expedition?.status!=='decision')return result(state,false,say('noDecision'));
  const next=clone(state),run=next.expedition!;
  run.optionalAccepted=accept;
  run.status=accept?'active':'returning';
  return result(next,true,accept?say('goOn'):say('enough'));
}

export function applyExpeditionNarrative(state:GameState,expeditionId:string,narrative:ExpeditionNarrative):GameState{
  if(state.expedition?.id!==expeditionId)return state;
  const next=clone(state);next.expedition!.narrative=narrative;return next;
}

function rareFindFor(state:GameState){
  const region=directionFor(state).region;
  return localizedCopy({
    uk:{orchard:'бурштин старого саду',marsh:'очеретяна мапа',highland:'гірське скло',coast:'сигнальне скло'},
    en:{orchard:'old-orchard amber',marsh:'a reed map',highland:'mountain glass',coast:'signal glass'},
    ru:{orchard:'янтарь старого сада',marsh:'тростниковая карта',highland:'горное стекло',coast:'сигнальное стекло'},
  })[region];
}

export function completeExpedition(state:GameState,now=Date.now()):ExpeditionResult{
  const run=state.expedition,gate=worldFor(state).gate;
  if(!run||run.status!=='returning')return result(state,false,say('finishWork'));
  if(distance(state.player,gate)>185)return result(state,false,say('returnGate'));
  const securedSupplies=Math.max(1,run.supplies-Math.max(0,run.pressure-3));
  const securedInsight=run.insight;
  const contract=CONTRACTS[run.contractId];
  const narrative=expeditionNarrativeFor(state)!;
  const tag=localeTag();
  const memory=say('memory',{name:state.character.name,contract:contract.name.toLocaleLowerCase(tag),title:narrative.title,actions:run.completed.map((action)=>action.title.toLocaleLowerCase(tag)).join(', ')});
  const report:ExpeditionReport={id:`report-${run.id}-${now}`,contractId:run.contractId,title:narrative.title,summary:say('summary',{cause:narrative.cause,name:state.character.name,outcomes:run.completed.map((action)=>action.outcome).join(' ')}),actions:[...run.completed],securedSupplies,securedInsight,rareFinds:[...run.rareFinds],pressure:run.pressure,completedAt:now,memory,narrativeFingerprint:narrative.fingerprint};
  let next=clone(state);const meta=expeditionMetaFor(next);
  next.expeditionMeta={completedContracts:meta.completedContracts+1,supplies:meta.supplies+securedSupplies,insight:meta.insight+securedInsight,rareFinds:[...meta.rareFinds,...run.rareFinds],builtProjects:meta.builtProjects,reports:[report,...meta.reports].slice(0,20)};
  next=resolveSeasonBeat(next,run);
  next=awardExpeditionRelic(next,run,now);
  delete next.expedition;
  return result(next,true,say('finished',{supplies:securedSupplies,insight:securedInsight}),report);
}

export function buildRefugeProject(state:GameState,projectId:RefugeProjectId):ExpeditionResult{
  const project=REFUGE_PROJECTS[projectId],meta=expeditionMetaFor(state);
  if(meta.builtProjects.includes(projectId))return result(state,false,say('alreadyBuilt'));
  if(meta.supplies<project.cost.supplies||meta.insight<project.cost.insight||meta.rareFinds.length<project.cost.rare)return result(state,false,say('short'));
  const next=clone(state);
  next.expeditionMeta={...meta,supplies:meta.supplies-project.cost.supplies,insight:meta.insight-project.cost.insight,rareFinds:meta.rareFinds.slice(project.cost.rare),builtProjects:[...meta.builtProjects,projectId]};
  return result(next,true,say('built',{name:project.name}));
}

export function expeditionRegionName(state:GameState){return REGION_NAMES[directionFor(state).region]}
