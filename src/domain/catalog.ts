import type { BodyId, BurdenId, CatalogEntry, GiftId, MarkId, MaterialId, PaletteId, QuirkId } from './types';
import { getActiveLocale, type Locale } from '../i18n/locale';

const GIFTS_UK: Record<GiftId, CatalogEntry<GiftId>> = {
  reveal: { id: 'reveal', name: 'Ручний ліхтар', description: 'Освітлює стерті написи, темні комори й дорожні мітки.' },
  grow: { id: 'grow', name: 'Садовий секатор', description: 'Розчищає зарості та повертає форму занедбаним рослинам.' },
  echo: { id: 'echo', name: 'Камертон', description: 'Перевіряє дзвони, резонатори й приховані порожнини за звуком.' },
  mend: { id: 'mend', name: 'Ремонтний набір', description: 'Містить мотузку, ключі, латки й усе для простого польового ремонту.' },
};

const BURDENS_UK: Record<BurdenId, CatalogEntry<BurdenId>> = {
  fragile: { id: 'fragile', name: 'Обережні руки', description: 'Після роботи потрібна коротка пауза, щоб перевірити крихкі деталі.' },
  loud: { id: 'loud', name: 'Гучна робота', description: 'Звук інструмента привертає увагу всього навколо.' },
  rooted: { id: 'rooted', name: 'Повільний майстер', description: 'Потрібна коротка зупинка, щоб скласти інструмент після роботи.' },
  fading: { id: 'fading', name: 'Слабкий ліхтар', description: 'Після роботи світло на мить стає тьмянішим.' },
};

const QUIRKS_UK: Record<QuirkId, CatalogEntry<QuirkId>> = {
  'moon-touched': { id: 'moon-touched', name: 'Торкнутий місяцем', description: 'Старі місячні знаки світяться у вашій присутності.' },
  'rain-kin': { id: 'rain-kin', name: 'Рідний дощу', description: 'Калюжі тягнуться до близьких таємниць.' },
  curious: { id: 'curious', name: 'Допитливий', description: 'Огляд відкриває ще одну думку.' },
  shy: { id: 'shy', name: 'Сором’язливий', description: 'Тихі паузи пробуджують крихітні паростки.' },
};

const GIFT_COPY:Record<Exclude<Locale,'uk'>,Record<GiftId,CatalogEntry<GiftId>>>={
  en:{reveal:{id:'reveal',name:'Flashlight',description:'Reveals faded writing, dark storehouses, and road markers.'},grow:{id:'grow',name:'Garden shears',description:'Clears overgrowth and restores neglected plants.'},echo:{id:'echo',name:'Tuning fork',description:'Checks bells, resonators, and hidden cavities by sound.'},mend:{id:'mend',name:'Repair kit',description:'Rope, spanners, patches, and essentials for simple field repairs.'}},
  ru:{reveal:{id:'reveal',name:'Фонарик',description:'Освещает стёртые надписи, тёмные склады и дорожные метки.'},grow:{id:'grow',name:'Садовый секатор',description:'Расчищает заросли и возвращает форму заброшенным растениям.'},echo:{id:'echo',name:'Камертон',description:'Проверяет колокола, резонаторы и скрытые полости по звуку.'},mend:{id:'mend',name:'Ремонтный набор',description:'Верёвка, ключи, заплаты и всё для простого полевого ремонта.'}},
};
const BURDEN_COPY:Record<Exclude<Locale,'uk'>,Record<BurdenId,CatalogEntry<BurdenId>>>={
  en:{fragile:{id:'fragile',name:'Careful hands',description:'After working, you pause briefly to check fragile parts.'},loud:{id:'loud',name:'Noisy work',description:'The sound of the tool draws attention from nearby.'},rooted:{id:'rooted',name:'Methodical maker',description:'You briefly stop to pack the tool after working.'},fading:{id:'fading',name:'Weak flashlight',description:'After working, the light dims for a moment.'}},
  ru:{fragile:{id:'fragile',name:'Осторожные руки',description:'После работы нужна короткая пауза, чтобы проверить хрупкие детали.'},loud:{id:'loud',name:'Шумная работа',description:'Звук инструмента привлекает внимание всего вокруг.'},rooted:{id:'rooted',name:'Неторопливый мастер',description:'Нужна короткая остановка, чтобы сложить инструмент после работы.'},fading:{id:'fading',name:'Слабый фонарик',description:'После работы свет на мгновение тускнеет.'}},
};
const QUIRK_COPY:Record<Exclude<Locale,'uk'>,Record<QuirkId,CatalogEntry<QuirkId>>>={
  en:{'moon-touched':{id:'moon-touched',name:'Moon-touched',description:'Old moon marks glow in your presence.'},'rain-kin':{id:'rain-kin',name:'Rain-kin',description:'Puddles lean toward nearby secrets.'},curious:{id:'curious',name:'Curious',description:'A closer look reveals one more thought.'},shy:{id:'shy',name:'Shy',description:'Quiet pauses wake tiny sprouts.'}},
  ru:{'moon-touched':{id:'moon-touched',name:'Тронутый луной',description:'Старые лунные знаки светятся в вашем присутствии.'},'rain-kin':{id:'rain-kin',name:'Родня дождю',description:'Лужи тянутся к ближайшим тайнам.'},curious:{id:'curious',name:'Любопытный',description:'Осмотр открывает ещё одну мысль.'},shy:{id:'shy',name:'Застенчивый',description:'Тихие паузы пробуждают маленькие ростки.'}},
};

function dynamicCatalog<I extends string>(uk:Record<I,CatalogEntry<I>>,other:Record<Exclude<Locale,'uk'>,Record<I,CatalogEntry<I>>>) {
  const result={} as Record<I,CatalogEntry<I>>;
  for(const id of Object.keys(uk) as I[])Object.defineProperty(result,id,{enumerable:true,get:()=>getActiveLocale()==='uk'?uk[id]:other[getActiveLocale() as Exclude<Locale,'uk'>][id]});
  return result;
}

export const GIFTS=dynamicCatalog(GIFTS_UK,GIFT_COPY);
export const BURDENS=dynamicCatalog(BURDENS_UK,BURDEN_COPY);
export const QUIRKS=dynamicCatalog(QUIRKS_UK,QUIRK_COPY);

export const BODIES: BodyId[] = ['fox', 'moth', 'bird', 'wisp'];
export const MATERIALS: MaterialId[] = ['porcelain', 'moss', 'paper', 'starlight'];
export const PALETTES: PaletteId[] = ['dusk', 'dawn', 'grove', 'tide'];
export const MARKS: MarkId[] = ['map-lines', 'stars', 'rings', 'cracks'];

const APPEARANCE_NAMES_UK = {
  body: { fox: 'лисиця', moth: 'міль', bird: 'птах', wisp: 'вогник' },
  material: { porcelain: 'порцеляна', moss: 'мох', paper: 'папір', starlight: 'зоряне світло' },
  palette: { dusk: 'сутінки', dawn: 'світанок', grove: 'гай', tide: 'приплив' },
  mark: { 'map-lines': 'лінії мапи', stars: 'зорі', rings: 'кільця', cracks: 'тріщини' },
} satisfies {
  body: Record<BodyId, string>;
  material: Record<MaterialId, string>;
  palette: Record<PaletteId, string>;
  mark: Record<MarkId, string>;
};

const APPEARANCE_COPY:Record<Exclude<Locale,'uk'>,typeof APPEARANCE_NAMES_UK>={
  en:{body:{fox:'fox',moth:'moth',bird:'bird',wisp:'wisp'},material:{porcelain:'porcelain',moss:'moss',paper:'paper',starlight:'starlight'},palette:{dusk:'dusk',dawn:'dawn',grove:'grove',tide:'tide'},mark:{'map-lines':'map lines',stars:'stars',rings:'rings',cracks:'cracks'}},
  ru:{body:{fox:'лиса',moth:'мотылёк',bird:'птица',wisp:'огонёк'},material:{porcelain:'фарфор',moss:'мох',paper:'бумага',starlight:'звёздный свет'},palette:{dusk:'сумерки',dawn:'рассвет',grove:'роща',tide:'прилив'},mark:{'map-lines':'линии карты',stars:'звёзды',rings:'кольца',cracks:'трещины'}},
};
function dynamicNames<K extends keyof typeof APPEARANCE_NAMES_UK>(key:K){
  const result={} as typeof APPEARANCE_NAMES_UK[K];
  for(const id of Object.keys(APPEARANCE_NAMES_UK[key]) as Array<keyof typeof APPEARANCE_NAMES_UK[K]>)Object.defineProperty(result,id,{enumerable:true,get:()=>getActiveLocale()==='uk'?APPEARANCE_NAMES_UK[key][id]:APPEARANCE_COPY[getActiveLocale() as Exclude<Locale,'uk'>][key][id]});
  return result;
}
export const APPEARANCE_NAMES={body:dynamicNames('body'),material:dynamicNames('material'),palette:dynamicNames('palette'),mark:dynamicNames('mark')};

const GROUP_COPY:Record<Locale,Record<keyof typeof APPEARANCE_NAMES,string>>={uk:{body:'Тіло',material:'Матеріал',palette:'Палітра',mark:'Знак'},en:{body:'Body',material:'Material',palette:'Palette',mark:'Mark'},ru:{body:'Тело',material:'Материал',palette:'Палитра',mark:'Знак'}};
export const APPEARANCE_GROUP_NAMES={} as Record<keyof typeof APPEARANCE_NAMES,string>;
for(const key of ['body','material','palette','mark'] as const)Object.defineProperty(APPEARANCE_GROUP_NAMES,key,{enumerable:true,get:()=>GROUP_COPY[getActiveLocale()][key]});

export const PALETTE_COLORS: Record<PaletteId, [string, string]> = {
  dusk: ['#75658f', '#e3b866'], dawn: ['#db826c', '#f4d49c'], grove: ['#668665', '#c6d18b'], tide: ['#57918f', '#b5e0d6'],
};
