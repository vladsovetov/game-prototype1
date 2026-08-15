import { seededRandom } from './random';
import type { GameState, GiftId, Point } from './types';
export const WORLD={width:3200,height:1800,sanctuary:{x:80,y:90,w:780,h:620},gate:{x:850,y:400}};
export interface Transition{gift:GiftId;to:string;message:string;seed?:string}
export interface Anomaly{id:string;name:string;position:Point;states:string[];transitions:Record<number,Transition>;color:string}
export const ANOMALIES:Anomaly[]=[
 {id:'stone',name:'Мовчазний камінь',position:{x:1120,y:390},states:['Мовчазний камінь','Наспівний камінь','Співоче дерево'],transitions:{0:{gift:'echo',to:'Наспівний камінь',message:'У камені прокидається нота, старіша за кроки.'},1:{gift:'grow',to:'Співоче дерево',message:'Нота пускає коріння й розгортається срібним листям.',seed:'singing-tree'}},color:'#8d83a4'},
 {id:'sign',name:'Закритий дороговказ',position:{x:1700,y:280},states:['Закритий дороговказ','Пригаданий дороговказ','Відновлений дороговказ'],transitions:{0:{gift:'reveal',to:'Пригаданий дороговказ',message:'Імена повертаються на дерево, стерте дощем.'},1:{gift:'mend',to:'Відновлений дороговказ',message:'Стара дорога згадує, куди вела.',seed:'waypost'}},color:'#d9a85f'},
 {id:'pool',name:'Сухий ставок',position:{x:2300,y:450},states:['Сухий ставок','Чистий ставок','Шепітливий ставок'],transitions:{0:{gift:'mend',to:'Чистий ставок',message:'Вода зшиває себе над порожньою чашею.'},1:{gift:'echo',to:'Шепітливий ставок',message:'Ставок повторює таємницю із завтрашнього дня.',seed:'whisper-pool'}},color:'#5aa8a1'},
 {id:'root',name:'Сплутане коріння',position:{x:2790,y:720},states:['Сплутане коріння','Коренева арка','Потаємні двері'],transitions:{0:{gift:'grow',to:'Коренева арка',message:'Коріння піднімається обережно, наче старі руки.'},1:{gift:'reveal',to:'Потаємні двері',message:'Там, де тінь була найглибшою, з’являються двері.',seed:'hidden-door'}},color:'#79956b'},
 {id:'bell',name:'Сонний дзвін',position:{x:1350,y:1050},states:['Сонний дзвін','Дощовий дзвін'],transitions:{0:{gift:'echo',to:'Дощовий дзвін',message:'Одна чиста нота пускає кола крізь траву.',seed:'rain-bell'}},color:'#cf8063'},
 {id:'moth',name:'Складена міль',position:{x:1950,y:1280},states:['Складена міль','Паперова зграя'],transitions:{0:{gift:'mend',to:'Паперова зграя',message:'Згини стають крилами. Сторінка злітає.',seed:'paper-flock'}},color:'#d6ccb4'},
 {id:'moon',name:'Безіменний місяць',position:{x:2550,y:1350},states:['Безіменний місяць','Названий місяць'],transitions:{0:{gift:'reveal',to:'Названий місяць',message:'Маленький місяць приймає знайдене вами ім’я.',seed:'named-moon'}},color:'#e0c47b'},
 {id:'garden',name:'Сад, що чекає',position:{x:1120,y:1460},states:['Сад, що чекає','Сад ліхтарів'],transitions:{0:{gift:'grow',to:'Сад ліхтарів',message:'Розкриваються теплі квіти, і кожна береже частинку сутінків.',seed:'lantern-garden'}},color:'#b3bf72'}
];
export const SHRINES:{id:string;gift:GiftId;position:Point}[]=[{id:'shrine-grow',gift:'grow',position:{x:1030,y:600}},{id:'shrine-echo',gift:'echo',position:{x:2150,y:650}},{id:'shrine-mend',gift:'mend',position:{x:1840,y:500}},{id:'shrine-reveal',gift:'reveal',position:{x:2630,y:920}}];
export const PLOTS=Array.from({length:6},(_,i)=>({id:`plot-${i+1}`,position:{x:230+(i%3)*190,y:300+Math.floor(i/3)*190}}));
export const SEED_NAMES:Record<string,string>={'singing-tree':'Співоче дерево','waypost':'Пригаданий дороговказ','whisper-pool':'Шепітливий ставок','hidden-door':'Маленькі потаємні двері','rain-bell':'Дощовий дзвін','paper-flock':'Паперова зграя','named-moon':'Названий місяць','lantern-garden':'Сад ліхтарів'};
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
  anomalies: Anomaly[];
  shrines: Shrine[];
  plots: Plot[];
  grass: Point[];
}

const THEMES: WorldTheme[] = [
  { name: 'Галявина дощового скла', ground: ['#b8d3c1', '#9fc5b6', '#96b4aa'], washes: ['#c6d8b4aa', '#b3cda7a8', '#9ec8c3aa', '#bdafd0a0'], trail: '#efd9aa9c' },
  { name: 'Простір дзвіночків', ground: ['#bbcfd0', '#a8c5c4', '#96b4b8'], washes: ['#c7d7c3a8', '#a9c9b7a8', '#a5bfd4a8', '#c1b5d0a0'], trail: '#f1d7a59c' },
  { name: 'Долина світла молі', ground: ['#c7d2b4', '#afc4aa', '#9fb7a4'], washes: ['#d7d8a9a8', '#b9cfa2a8', '#b1c5c1a8', '#d2b4c4a0'], trail: '#f3d39a9c' },
  { name: 'Срібне поле дощу', ground: ['#c1cfca', '#a9c1bc', '#92b2ad'], washes: ['#d0d9bea8', '#aac7aaa8', '#9fc4c7a8', '#c5b2cda0'], trail: '#e8d4ad9c' },
  { name: 'Пустка сутінкових пелюсток', ground: ['#c4cdb9', '#a9bda9', '#9cafa7'], washes: ['#d4d3aaa8', '#b6c69da8', '#a4c1bba8', '#c9aec4a0'], trail: '#efcf979c' },
];

const SLOTS: Point[] = [
  { x: 1120, y: 340 }, { x: 1600, y: 270 }, { x: 2120, y: 420 }, { x: 2720, y: 330 },
  { x: 1110, y: 1080 }, { x: 1630, y: 1390 }, { x: 2220, y: 1160 }, { x: 2780, y: 1390 },
];
const SHRINE_SLOTS: Point[] = [
  { x: 1030, y: 680 }, { x: 2080, y: 720 }, { x: 1760, y: 880 }, { x: 2700, y: 850 },
];
const cache = new Map<number, WorldLayout>();

function shuffled<T>(items: readonly T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap]!, result[index]!];
  }
  return result;
}

export function createWorld(seed = LEGACY_WORLD_SEED): WorldLayout {
  const key = seed >>> 0;
  const found = cache.get(key);
  if (found) return found;
  if (key === LEGACY_WORLD_SEED) {
    const legacy: WorldLayout = {
      seed: key, width: WORLD.width, height: WORLD.height, sanctuary: WORLD.sanctuary, gate: WORLD.gate,
      theme: THEMES[0]!,
      trail: [{ x: 640, y: 430 }, { x: 1120, y: 360 }, { x: 1870, y: 850 }, { x: 3000, y: 1060 }],
      anomalies: ANOMALIES, shrines: SHRINES, plots: PLOTS,
      grass: Array.from({ length: 180 }, (_, i) => ({ x: (i * 307 + 83) % WORLD.width, y: (i * 173 + 119) % WORLD.height })),
    };
    cache.set(key, legacy);
    return legacy;
  }
  const random = seededRandom(key);
  const slots = shuffled(SLOTS, random);
  const anomalies = ANOMALIES.map((template, index) => ({
    ...template,
    position: { x: slots[index]!.x + Math.round((random() - .5) * 70), y: slots[index]!.y + Math.round((random() - .5) * 70) },
  }));
  const shrines = shuffled(SHRINES, random).map((template, index) => ({
    ...template,
    position: { x: SHRINE_SLOTS[index]!.x + Math.round((random() - .5) * 50), y: SHRINE_SLOTS[index]!.y + Math.round((random() - .5) * 50) },
  }));
  const grass = Array.from({ length: 180 }, () => ({ x: Math.round(random() * WORLD.width), y: Math.round(random() * WORLD.height) }));
  const world: WorldLayout = {
    seed: key, width: WORLD.width, height: WORLD.height, sanctuary: WORLD.sanctuary, gate: WORLD.gate,
    theme: THEMES[key % THEMES.length]!, plots: PLOTS, anomalies, shrines, grass,
    trail: [
      { x: 640, y: 430 },
      { x: 1050 + Math.round(random() * 250), y: 300 + Math.round(random() * 250) },
      { x: 1700 + Math.round(random() * 350), y: 700 + Math.round(random() * 350) },
      { x: 2850 + Math.round(random() * 180), y: 950 + Math.round(random() * 230) },
    ],
  };
  cache.set(key, world);
  return world;
}

export function worldFor(state: Pick<GameState, 'worldSeed'>) {
  return createWorld(state.worldSeed ?? LEGACY_WORLD_SEED);
}
