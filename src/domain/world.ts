import { getActiveLocale, localizedCopy, type Locale } from '../i18n/locale';
import { seededRandom } from './random';
import { createRunDirection, directionFor, REGION_NAMES, WEATHER_NAMES } from './run-direction';
import type { GameState, GiftId, Point, RegionId, RunDirection } from './types';
export const WORLD={width:3200,height:1800,sanctuary:{x:80,y:90,w:780,h:620},gate:{x:850,y:400}};
export interface Transition{gift:GiftId;to:string;message:string;seed?:string}
export interface Anomaly{id:string;name:string;position:Point;states:string[];transitions:Record<number,Transition>;color:string}
export const ANOMALIES:Anomaly[]=[
 {id:'stone',name:'Розладнаний резонатор',position:{x:1120,y:390},states:['Розладнаний резонатор','Налаштований резонатор','Закріплений резонатор'],transitions:{0:{gift:'echo',to:'Налаштований резонатор',message:'Камертон знаходить правильну частоту механізму.'},1:{gift:'mend',to:'Закріплений резонатор',message:'Нові кріплення втримують сигнал навіть на вітрі.',seed:'singing-tree'}},color:'#8d83a4'},
 {id:'sign',name:'Залитий брудом покажчик',position:{x:1700,y:280},states:['Залитий брудом покажчик','Прочитаний покажчик','Відремонтований покажчик'],transitions:{0:{gift:'reveal',to:'Прочитаний покажчик',message:'Промінь збоку робить стерті назви знову видимими.'},1:{gift:'mend',to:'Відремонтований покажчик',message:'Нова планка й болти повертають стрілкам правильний напрямок.',seed:'waypost'}},color:'#d9a85f'},
 {id:'pool',name:'Зламана водяна помпа',position:{x:2300,y:450},states:['Зламана водяна помпа','Запущена помпа','Перевірена криниця'],transitions:{0:{gift:'mend',to:'Запущена помпа',message:'Прокладка стає на місце, і помпа знову подає воду.'},1:{gift:'reveal',to:'Перевірена криниця',message:'Ліхтар відкриває мітки рівня води на стінці криниці.',seed:'whisper-pool'}},color:'#5aa8a1'},
 {id:'root',name:'Зарослий вхід до комори',position:{x:2790,y:720},states:['Зарослий вхід до комори','Розчищений вхід','Відкрита комора'],transitions:{0:{gift:'grow',to:'Розчищений вхід',message:'Секатор звільняє двері від ожини й старих пагонів.'},1:{gift:'reveal',to:'Відкрита комора',message:'У світлі ліхтаря знаходиться прихована клямка.',seed:'hidden-door'}},color:'#79956b'},
 {id:'bell',name:'Неналаштований сигнальний дзвін',position:{x:1350,y:1050},states:['Неналаштований сигнальний дзвін','Налаштований сигнальний дзвін'],transitions:{0:{gift:'echo',to:'Налаштований сигнальний дзвін',message:'Камертон допомагає повернути дзвону чистий попереджувальний тон.',seed:'rain-bell'}},color:'#cf8063'},
 {id:'moth',name:'Промоклі польові записки',position:{x:1950,y:1280},states:['Промоклі польові записки','Збережені польові записки'],transitions:{0:{gift:'mend',to:'Збережені польові записки',message:'Сухий папір і нова палітурка зберігають найважливіші сторінки.',seed:'paper-flock'}},color:'#d6ccb4'},
 {id:'moon',name:'Згасла сигнальна лампа',position:{x:2550,y:1350},states:['Згасла сигнальна лампа','Запалена сигнальна лампа'],transitions:{0:{gift:'reveal',to:'Запалена сигнальна лампа',message:'Вогонь ручного ліхтаря запалює більшу сигнальну лампу.',seed:'named-moon'}},color:'#e0c47b'},
 {id:'garden',name:'Занедбана робоча ділянка',position:{x:1120,y:1460},states:['Занедбана робоча ділянка','Доглянута робоча ділянка'],transitions:{0:{gift:'grow',to:'Доглянута робоча ділянка',message:'Секатор звільняє молоді рослини й відкриває кам’яну табличку.',seed:'lantern-garden'}},color:'#b3bf72'}
];
export const SHRINES:{id:string;gift:GiftId;position:Point}[]=[{id:'shrine-grow',gift:'grow',position:{x:1030,y:600}},{id:'shrine-echo',gift:'echo',position:{x:2150,y:650}},{id:'shrine-mend',gift:'mend',position:{x:1840,y:500}},{id:'shrine-reveal',gift:'reveal',position:{x:2630,y:920}}];
export const PLOTS=Array.from({length:6},(_,i)=>({id:`plot-${i+1}`,position:{x:230+(i%3)*190,y:300+Math.floor(i/3)*190}}));
const SEED_COPY: Record<Locale, Record<string, string>> = {
  uk: {'singing-tree':'Польовий резонатор','waypost':'Схема маршрутів','whisper-pool':'Журнал рівня води','hidden-door':'Ключ від комори','rain-bell':'Сигнальний розклад','paper-flock':'Пачка польових записок','named-moon':'Сигнальна лампа','lantern-garden':'Табличка робочої ділянки'},
  en: {'singing-tree':'Field resonator','waypost':'Route diagram','whisper-pool':'Water-level log','hidden-door':'Storehouse key','rain-bell':'Signal timetable','paper-flock':'A sheaf of field notes','named-moon':'Signal lamp','lantern-garden':'Work-plot tablet'},
  ru: {'singing-tree':'Полевой резонатор','waypost':'Схема маршрутов','whisper-pool':'Журнал уровня воды','hidden-door':'Ключ от склада','rain-bell':'Сигнальное расписание','paper-flock':'Пачка полевых записок','named-moon':'Сигнальная лампа','lantern-garden':'Табличка рабочего участка'},
};
export const SEED_NAMES = {} as Record<string, string>;
for (const id of Object.keys(SEED_COPY.uk)) {
  Object.defineProperty(SEED_NAMES, id, { enumerable: true, get: () => localizedCopy(SEED_COPY)[id] });
}

type AnomalyText = Pick<Anomaly, 'name' | 'states' | 'transitions'>;
const ANOMALY_TEXT: Record<Exclude<Locale, 'uk'>, Record<string, AnomalyText>> = {
  en: {
    stone: { name: 'Detuned resonator', states: ['Detuned resonator', 'Tuned resonator', 'Secured resonator'], transitions: { 0: { gift: 'echo', to: 'Tuned resonator', message: 'The tuning fork finds the mechanism’s true frequency.' }, 1: { gift: 'mend', to: 'Secured resonator', message: 'New fittings keep the signal even in the wind.', seed: 'singing-tree' } } },
    sign: { name: 'Mud-covered marker', states: ['Mud-covered marker', 'Read marker', 'Repaired marker'], transitions: { 0: { gift: 'reveal', to: 'Read marker', message: 'A side beam makes the worn names visible again.' }, 1: { gift: 'mend', to: 'Repaired marker', message: 'A new plank and bolts return the arrows to the right direction.', seed: 'waypost' } } },
    pool: { name: 'Broken water pump', states: ['Broken water pump', 'Running pump', 'Checked well'], transitions: { 0: { gift: 'mend', to: 'Running pump', message: 'The gasket seats, and the pump supplies water again.' }, 1: { gift: 'reveal', to: 'Checked well', message: 'The flashlight reveals water-level marks on the well wall.', seed: 'whisper-pool' } } },
    root: { name: 'Overgrown storehouse door', states: ['Overgrown storehouse door', 'Cleared entrance', 'Opened storehouse'], transitions: { 0: { gift: 'grow', to: 'Cleared entrance', message: 'The shears free the door from brambles and old shoots.' }, 1: { gift: 'reveal', to: 'Opened storehouse', message: 'In the flashlight beam a hidden latch appears.', seed: 'hidden-door' } } },
    bell: { name: 'Untuned signal bell', states: ['Untuned signal bell', 'Tuned signal bell'], transitions: { 0: { gift: 'echo', to: 'Tuned signal bell', message: 'The tuning fork helps restore the bell’s clear warning tone.', seed: 'rain-bell' } } },
    moth: { name: 'Soaked field notes', states: ['Soaked field notes', 'Preserved field notes'], transitions: { 0: { gift: 'mend', to: 'Preserved field notes', message: 'Dry paper and a new binding keep the most important pages.', seed: 'paper-flock' } } },
    moon: { name: 'Dark signal lamp', states: ['Dark signal lamp', 'Lit signal lamp'], transitions: { 0: { gift: 'reveal', to: 'Lit signal lamp', message: 'The flashlight flame lights the larger signal lamp.', seed: 'named-moon' } } },
    garden: { name: 'Neglected work plot', states: ['Neglected work plot', 'Tended work plot'], transitions: { 0: { gift: 'grow', to: 'Tended work plot', message: 'The shears free young plants and uncover a stone tablet.', seed: 'lantern-garden' } } },
  },
  ru: {
    stone: { name: 'Расстроенный резонатор', states: ['Расстроенный резонатор', 'Настроенный резонатор', 'Закреплённый резонатор'], transitions: { 0: { gift: 'echo', to: 'Настроенный резонатор', message: 'Камертон находит верную частоту механизма.' }, 1: { gift: 'mend', to: 'Закреплённый резонатор', message: 'Новые крепления держат сигнал даже на ветру.', seed: 'singing-tree' } } },
    sign: { name: 'Залитый грязью указатель', states: ['Залитый грязью указатель', 'Прочитанный указатель', 'Отремонтированный указатель'], transitions: { 0: { gift: 'reveal', to: 'Прочитанный указатель', message: 'Боковой луч снова делает стёртые названия видимыми.' }, 1: { gift: 'mend', to: 'Отремонтированный указатель', message: 'Новая планка и болты возвращают стрелкам верное направление.', seed: 'waypost' } } },
    pool: { name: 'Сломанная водяная помпа', states: ['Сломанная водяная помпа', 'Запущенная помпа', 'Проверенный колодец'], transitions: { 0: { gift: 'mend', to: 'Запущенная помпа', message: 'Прокладка встаёт на место, и помпа снова подаёт воду.' }, 1: { gift: 'reveal', to: 'Проверенный колодец', message: 'Фонарик открывает метки уровня воды на стенке колодца.', seed: 'whisper-pool' } } },
    root: { name: 'Заросший вход на склад', states: ['Заросший вход на склад', 'Расчищенный вход', 'Открытый склад'], transitions: { 0: { gift: 'grow', to: 'Расчищенный вход', message: 'Секатор освобождает дверь от ежевики и старых побегов.' }, 1: { gift: 'reveal', to: 'Открытый склад', message: 'В свете фонарика находится скрытая защёлка.', seed: 'hidden-door' } } },
    bell: { name: 'Ненастроенный сигнальный колокол', states: ['Ненастроенный сигнальный колокол', 'Настроенный сигнальный колокол'], transitions: { 0: { gift: 'echo', to: 'Настроенный сигнальный колокол', message: 'Камертон помогает вернуть колоколу чистый предупреждающий тон.', seed: 'rain-bell' } } },
    moth: { name: 'Промокшие полевые записки', states: ['Промокшие полевые записки', 'Сохранённые полевые записки'], transitions: { 0: { gift: 'mend', to: 'Сохранённые полевые записки', message: 'Сухая бумага и новый переплёт сохраняют важнейшие страницы.', seed: 'paper-flock' } } },
    moon: { name: 'Погасшая сигнальная лампа', states: ['Погасшая сигнальная лампа', 'Зажжённая сигнальная лампа'], transitions: { 0: { gift: 'reveal', to: 'Зажжённая сигнальная лампа', message: 'Огонь ручного фонарика зажигает большую сигнальную лампу.', seed: 'named-moon' } } },
    garden: { name: 'Заброшенный рабочий участок', states: ['Заброшенный рабочий участок', 'Ухоженный рабочий участок'], transitions: { 0: { gift: 'grow', to: 'Ухоженный рабочий участок', message: 'Секатор освобождает молодые растения и открывает каменную табличку.', seed: 'lantern-garden' } } },
  },
};

function anomalyText(id: string, locale: Locale): AnomalyText {
  const template = ANOMALIES.find((item) => item.id === id);
  if (!template) return { name: id, states: [], transitions: {} };
  if (locale === 'uk') return template;
  return ANOMALY_TEXT[locale][id] ?? template;
}

function localizeAnomaly(template: Anomaly): Anomaly {
  const locale = getActiveLocale();
  if (locale === 'uk') return template;
  const text = ANOMALY_TEXT[locale][template.id];
  return text ? { ...template, ...text } : template;
}

export function localizeDiscovery(line: string, locale = getActiveLocale()): string {
  for (const template of ANOMALIES) {
    const current = anomalyText(template.id, locale);
    for (const sourceLocale of ['uk', 'en', 'ru'] as const) {
      const source = anomalyText(template.id, sourceLocale);
      for (const [stage, transition] of Object.entries(source.transitions)) {
        if (`${source.states[Number(stage)]} → ${transition.to}` !== line) continue;
        const next = current.transitions[Number(stage)];
        if (next) return `${current.states[Number(stage)]} → ${next.to}`;
      }
    }
  }
  return line;
}
export function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y)}

export const LEGACY_WORLD_SEED = 0;

export interface Shrine { id: string; gift: GiftId; position: Point }
export interface Plot { id: string; position: Point }
export interface WorldTheme {
  name: string;
  ground: [string, string, string];
  washes: string[];
  trail: string;
}
export interface WorldLayout {
  seed: number;
  width: number;
  height: number;
  sanctuary: typeof WORLD.sanctuary;
  gate: Point;
  theme: WorldTheme;
  trail: [Point, Point, Point, Point];
  routes: Point[][];
  scenery: SceneryObject[];
  anomalies: Anomaly[];
  shrines: Shrine[];
  plots: Plot[];
  grass: Point[];
}

export type SceneryKind='fruit-tree'|'fence'|'shed'|'water'|'reeds'|'boardwalk'|'pine'|'boulder'|'weather-station'|'shore'|'dock'|'boat'|'dune-grass';
export interface SceneryObject{kind:SceneryKind;position:Point;size:number;rotation?:number}

const THEME_NAMES: Record<Locale, string[]> = {
  uk: ['Галявина дощового скла', 'Простір дзвіночків', 'Долина світла молі', 'Срібне поле дощу', 'Пустка сутінкових пелюсток'],
  en: ['Rain-glass clearing', 'Bellflower space', 'Moth-light valley', 'Silver rain field', 'Dusk-petal waste'],
  ru: ['Поляна дождевого стекла', 'Пространство колокольчиков', 'Долина света мотылька', 'Серебряное поле дождя', 'Пустошь сумеречных лепестков'],
};
const THEME_LOOKS: Array<Omit<WorldTheme, 'name'>> = [
  { ground: ['#b8d3c1', '#9fc5b6', '#96b4aa'], washes: ['#c6d8b4aa', '#b3cda7a8', '#9ec8c3aa', '#bdafd0a0'], trail: '#efd9aa9c' },
  { ground: ['#bbcfd0', '#a8c5c4', '#96b4b8'], washes: ['#c7d7c3a8', '#a9c9b7a8', '#a5bfd4a8', '#c1b5d0a0'], trail: '#f1d7a59c' },
  { ground: ['#c7d2b4', '#afc4aa', '#9fb7a4'], washes: ['#d7d8a9a8', '#b9cfa2a8', '#b1c5c1a8', '#d2b4c4a0'], trail: '#f3d39a9c' },
  { ground: ['#c1cfca', '#a9c1bc', '#92b2ad'], washes: ['#d0d9bea8', '#aac7aaa8', '#9fc4c7a8', '#c5b2cda0'], trail: '#e8d4ad9c' },
  { ground: ['#c4cdb9', '#a9bda9', '#9cafa7'], washes: ['#d4d3aaa8', '#b6c69da8', '#a4c1bba8', '#c9aec4a0'], trail: '#efcf979c' },
];
function themes(): WorldTheme[] {
  return THEME_LOOKS.map((look, index) => ({ ...look, name: localizedCopy(THEME_NAMES)[index]! }));
}

const SLOTS: Record<RegionId, Point[]> = {
  orchard:[{x:1120,y:340},{x:1600,y:270},{x:2120,y:420},{x:2720,y:330},{x:1110,y:1080},{x:1630,y:1390},{x:2220,y:1160},{x:2780,y:1390}],
  marsh:[{x:1080,y:310},{x:1510,y:520},{x:2160,y:290},{x:2770,y:470},{x:1190,y:1190},{x:1710,y:1480},{x:2290,y:1090},{x:2810,y:1420}],
  highland:[{x:1090,y:280},{x:1590,y:250},{x:2180,y:350},{x:2780,y:270},{x:1120,y:1320},{x:1680,y:1040},{x:2260,y:1450},{x:2820,y:1060}],
  coast:[{x:1100,y:430},{x:1550,y:290},{x:2070,y:500},{x:2720,y:310},{x:1210,y:1370},{x:1810,y:1240},{x:2370,y:1450},{x:2890,y:1080}],
};
const SHRINE_SLOTS:Record<RegionId,Point[]>={
  orchard:[{x:1020,y:690},{x:2050,y:700},{x:1760,y:880},{x:2700,y:850}],
  marsh:[{x:980,y:760},{x:2010,y:820},{x:1690,y:980},{x:2660,y:930}],
  highland:[{x:1040,y:720},{x:2110,y:690},{x:1770,y:860},{x:2720,y:780}],
  coast:[{x:1010,y:740},{x:2070,y:760},{x:1730,y:920},{x:2710,y:840}],
};
const cache = new Map<string, WorldLayout>();

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

function themeFor(direction:RunDirection):WorldTheme{
  const [deep,mid,accent,earth,pale]=direction.colors;
  return {name:`${REGION_NAMES[direction.region]} · ${WEATHER_NAMES[direction.weather]}`,ground:[mid,pale,deep],washes:[`${accent}82`,`${pale}a8`,`${mid}94`,`${earth}70`],trail:`${accent}a6`};
}

function sceneryFor(region:RegionId,random:()=>number):SceneryObject[]{
  const jitter=()=>Math.round((random()-.5)*34);
  if(region==='orchard')return [
    ...Array.from({length:30},(_,i)=>({kind:'fruit-tree' as const,position:{x:1040+(i%6)*340+jitter(),y:190+Math.floor(i/6)*310+jitter()},size:34+Math.round(random()*10)})),
    ...Array.from({length:9},(_,i)=>({kind:'fence' as const,position:{x:980+i*250,y:850+(i%2)*35},size:105,rotation:(i%3-1)*.08})),
    {kind:'shed',position:{x:2450,y:760},size:82},
  ];
  if(region==='marsh')return [
    ...Array.from({length:8},(_,i)=>({kind:'water' as const,position:{x:1050+(i%4)*560+jitter(),y:250+Math.floor(i/4)*950+jitter()},size:120+Math.round(random()*90),rotation:random()})),
    ...Array.from({length:34},(_,i)=>({kind:'reeds' as const,position:{x:930+(i*233)%2150+jitter(),y:180+(i*389)%1450+jitter()},size:18+Math.round(random()*12)})),
    ...Array.from({length:10},(_,i)=>({kind:'boardwalk' as const,position:{x:980+i*205,y:770+Math.sin(i*.8)*130},size:105,rotation:Math.sin(i*.7)*.25})),
  ];
  if(region==='highland')return [
    ...Array.from({length:24},(_,i)=>({kind:'pine' as const,position:{x:980+(i*311)%2150+jitter(),y:170+(i*227)%1460+jitter()},size:35+Math.round(random()*22)})),
    ...Array.from({length:18},(_,i)=>({kind:'boulder' as const,position:{x:1000+(i*419)%2100+jitter(),y:240+(i*313)%1360+jitter()},size:28+Math.round(random()*34),rotation:random()})),
    {kind:'weather-station',position:{x:2500,y:690},size:94},
  ];
  return [
    {kind:'shore',position:{x:2420,y:1280},size:760,rotation:-.18},
    ...Array.from({length:4},(_,i)=>({kind:'dock' as const,position:{x:2100+i*260,y:1120+i*70},size:150,rotation:.2})),
    ...Array.from({length:3},(_,i)=>({kind:'boat' as const,position:{x:2350+i*300,y:1350+i*60},size:65,rotation:-.2+i*.15})),
    ...Array.from({length:32},(_,i)=>({kind:'dune-grass' as const,position:{x:960+(i*271)%2130+jitter(),y:220+(i*347)%1390+jitter()},size:17+Math.round(random()*11)})),
  ];
}

function routesFor(region:RegionId):Point[][]{
  if(region==='orchard')return [[{x:640,y:430},{x:1180,y:410},{x:1700,y:780},{x:2380,y:650},{x:3020,y:1050}],[{x:1500,y:780},{x:1400,y:1280},{x:2150,y:1440}]];
  if(region==='marsh')return [[{x:640,y:430},{x:1050,y:650},{x:1450,y:460},{x:1920,y:900},{x:2400,y:650},{x:3010,y:1120}],[{x:1700,y:880},{x:1650,y:1420},{x:2380,y:1330}]];
  if(region==='highland')return [[{x:640,y:430},{x:1150,y:720},{x:1570,y:430},{x:2050,y:820},{x:2520,y:520},{x:3030,y:980}],[{x:1450,y:700},{x:1780,y:1280},{x:2440,y:1430}]];
  return [[{x:640,y:430},{x:1120,y:520},{x:1570,y:360},{x:2050,y:700},{x:2600,y:590},{x:3010,y:980}],[{x:1800,y:820},{x:2150,y:1130},{x:2790,y:1260}]];
}

export function createWorld(seed = LEGACY_WORLD_SEED, suppliedDirection?:RunDirection): WorldLayout {
  const key = seed >>> 0;
  const direction=suppliedDirection??createRunDirection(key);
  const cacheKey=`${getActiveLocale()}:${key}:${JSON.stringify(direction)}`;
  const found = cache.get(cacheKey);
  if (found) return found;
  if (key === LEGACY_WORLD_SEED&&!suppliedDirection) {
    const routes=[[{ x: 640, y: 430 }, { x: 1120, y: 360 }, { x: 1870, y: 850 }, { x: 3000, y: 1060 }]];
    const legacy: WorldLayout = {
      seed: key, width: WORLD.width, height: WORLD.height, sanctuary: WORLD.sanctuary, gate: WORLD.gate,
      theme: themes()[0]!,
      trail: routes[0] as [Point,Point,Point,Point], routes, scenery:sceneryFor('orchard',seededRandom(0)),
      anomalies: ANOMALIES.map(localizeAnomaly), shrines: SHRINES, plots: PLOTS,
      grass: Array.from({ length: 180 }, (_, i) => ({ x: (i * 307 + 83) % WORLD.width, y: (i * 173 + 119) % WORLD.height })),
    };
    cache.set(cacheKey, legacy);
    return legacy;
  }
  const random = seededRandom(key);
  const slots = shuffled(SLOTS[direction.region], random);
  const anomalies = ANOMALIES.map((template, index) => ({
    ...localizeAnomaly(template),
    position: { x: slots[index]!.x + Math.round((random() - .5) * 70), y: slots[index]!.y + Math.round((random() - .5) * 70) },
  }));
  const shrines = shuffled(SHRINES, random).map((template, index) => ({
    ...template,
    position: { x: SHRINE_SLOTS[direction.region][index]!.x + Math.round((random() - .5) * 50), y: SHRINE_SLOTS[direction.region][index]!.y + Math.round((random() - .5) * 50) },
  }));
  const grass = Array.from({ length: 180 }, () => ({ x: Math.round(random() * WORLD.width), y: Math.round(random() * WORLD.height) }));
  const routes=routesFor(direction.region);
  const trailPoints=routes[0]!;
  const world: WorldLayout = {
    seed: key, width: WORLD.width, height: WORLD.height, sanctuary: WORLD.sanctuary, gate: WORLD.gate,
    theme: themeFor(direction), plots: PLOTS, anomalies, shrines, grass, routes, scenery:sceneryFor(direction.region,random),
    trail:[trailPoints[0]!,trailPoints[1]!,trailPoints[Math.max(2,trailPoints.length-2)]!,trailPoints.at(-1)!],
  };
  cache.set(cacheKey, world);
  return world;
}

export function worldFor(state: Pick<GameState, 'worldSeed'>) {
  const full=state as Pick<GameState,'worldSeed'|'storyArc'>;
  if(full.worldSeed===undefined&&!full.storyArc?.direction)return createWorld(LEGACY_WORLD_SEED);
  return createWorld(full.worldSeed ?? full.storyArc?.seed ?? LEGACY_WORLD_SEED,directionFor(full));
}
