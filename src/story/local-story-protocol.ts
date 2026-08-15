import type { StoryIngredients } from '../domain/story';
import { RELIC_CONDITIONS, RELIC_FORMS, RELIC_MATERIALS, clampRelicColor } from '../domain/relics';
import type { ExpeditionMood, ExpeditionNarrative, ExpeditionPalette, ExpeditionSituation, RadioRemark, Relic, RelicCondition, RelicForm, RelicMaterial } from '../domain/types';
import type { Locale } from '../i18n/locale';

const LIMITS: Record<keyof StoryIngredients, number> = {
  place: 64,
  role: 64,
  disaster: 140,
  vow: 160,
  motif: 48,
  truth: 180,
};

export type StoryWorkerRequest = {
  type: 'generate';
  jobId: string;
  character: { name: string; description: string; gift: string; burden: string; quirk: string };
  seed: number;
  locale: Locale;
} | {
  type: 'generate-expedition'; jobId: string; expeditionId: string; seed: number;
  locale: Locale;
  character: { name: string; description: string; gift: string; burden: string; quirk: string };
  contractName: string; siteIds: string[]; recentMemories: string[]; recentFingerprints: string[];
  seasonBeat?: string; throughline?: string; priorBeats?: string[];
} | {
  type: 'generate-radio'; jobId: string; expeditionId: string; seed: number; locale: Locale;
  character: { name: string; description: string; gift: string; burden: string; quirk: string };
  voice: string; beat: string; lastDecision: string; remembered: string[];
} | {
  type: 'generate-relic'; jobId: string; eventId: string; seed: number; locale: Locale;
  character: { name: string; description: string; gift: string; burden: string; quirk: string };
  eventTitle: string; allowedForms: string; allowedColors: string;
} | { type: 'cancel'; jobId: string };

export type StoryWorkerMessage =
  | { type: 'progress'; jobId: string; stage: 'download' | 'read' | 'weave'; progress?: number }
  | { type: 'complete'; jobId: string; raw: string }
  | { type: 'complete-expedition'; jobId: string; raw: string }
  | { type: 'complete-radio'; jobId: string; raw: string }
  | { type: 'complete-relic'; jobId: string; raw: string }
  | { type: 'error'; jobId: string; message: string };

export type StoryParseResult = { ok: true; value: StoryIngredients } | { ok: false; reason: string };

const languageText = (value: string, locale: Locale) => locale === 'en'
  ? /[A-Za-z]/.test(value) && !/[А-ЯІЇЄҐа-яіїєґ]/.test(value)
  : /[А-ЯЁІЇЄҐа-яёіїєґ]/.test(value) && !/[A-Za-z]/.test(value);

const STORY_REASONS: Record<Locale, Record<'noObject' | 'incomplete' | 'shape' | 'field' | 'language', string>> = {
  uk: { noObject: 'Пристрій не повернув об’єкт історії.', incomplete: 'Пристрій повернув незавершений об’єкт історії.', shape: 'Об’єкт історії має неправильну форму.', field: 'Поле {key} відсутнє або задовге.', language: 'Локальний оповідач не повернув текст українською.' },
  en: { noObject: 'The device did not return a story object.', incomplete: 'The device returned an unfinished story object.', shape: 'The story object has the wrong shape.', field: 'The {key} field is missing or too long.', language: 'The local storyteller did not return English text.' },
  ru: { noObject: 'Устройство не вернуло объект истории.', incomplete: 'Устройство вернуло незавершённый объект истории.', shape: 'Объект истории имеет неправильную форму.', field: 'Поле {key} отсутствует или слишком длинное.', language: 'Локальный рассказчик не вернул текст на русском.' },
};
const EXPEDITION_REASONS: Record<Locale, Record<'noCard' | 'incomplete' | 'shape' | 'language' | 'type' | 'route' | 'note' | 'changed' | 'find' | 'repeat', string>> = {
  uk: { noCard: 'Локальний режисер не повернув картку пригоди.', incomplete: 'Локальний режисер повернув незавершену картку.', shape: 'Картка пригоди має неправильну форму.', language: 'У тексті картки пригоди бракує тексту українською.', type: 'Картка пригоди містить невідомий тип або настрій.', route: 'Картка пригоди не описує весь маршрут.', note: 'Локальний режисер залишив неправильну нотатку маршруту.', changed: 'Локальний режисер змінив маршрут або залишив неправильну нотатку.', find: 'Картка пригоди містить неправильну знахідку або візуальні ознаки.', repeat: 'Локальний режисер повторив недавню пригоду.' },
  en: { noCard: 'The local director did not return an adventure card.', incomplete: 'The local director returned an unfinished card.', shape: 'The adventure card has the wrong shape.', language: 'Adventure card text is missing or not in English.', type: 'The adventure card has an unknown type or mood.', route: 'The adventure card does not describe the whole route.', note: 'The local director left an invalid route note.', changed: 'The local director changed the route or left an invalid note.', find: 'The adventure card has an invalid find or visual tags.', repeat: 'The local director repeated a recent adventure.' },
  ru: { noCard: 'Локальный режиссёр не вернул карточку приключения.', incomplete: 'Локальный режиссёр вернул незавершённую карточку.', shape: 'Карточка приключения имеет неправильную форму.', language: 'В тексте карточки приключения не хватает текста на русском.', type: 'Карточка приключения содержит неизвестный тип или настроение.', route: 'Карточка приключения не описывает весь маршрут.', note: 'Локальный режиссёр оставил неправильную заметку маршрута.', changed: 'Локальный режиссёр изменил маршрут или оставил неправильную заметку.', find: 'Карточка приключения содержит неправильную находку или визуальные признаки.', repeat: 'Локальный режиссёр повторил недавнее приключение.' },
};
function storyReason(locale: Locale, key: keyof typeof STORY_REASONS.uk, keyName?: string) {
  return STORY_REASONS[locale][key].replaceAll('{key}', keyName ?? '');
}
function expeditionReason(locale: Locale, key: keyof typeof EXPEDITION_REASONS.uk) {
  return EXPEDITION_REASONS[locale][key];
}

export function parseStoryIngredients(raw: string, locale: Locale = 'uk'): StoryParseResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, reason: storyReason(locale, 'noObject') };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { ok: false, reason: storyReason(locale, 'incomplete') };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: storyReason(locale, 'shape') };
  const source = parsed as Record<string, unknown>;
  const value = {} as StoryIngredients;
  for (const key of Object.keys(LIMITS) as Array<keyof StoryIngredients>) {
    const field = source[key];
    if (typeof field !== 'string' || !field.trim() || field.trim().length > LIMITS[key]) {
      return { ok: false, reason: storyReason(locale, 'field', key) };
    }
    value[key] = field.trim();
  }
  if (!Object.values(value).every((field) => languageText(field, locale))) {
    return { ok: false, reason: storyReason(locale, 'language') };
  }
  return { ok: true, value };
}

const SITUATIONS=new Set<ExpeditionSituation>(['зникнення','поломка','хибний-сигнал','слід-мандрівника','природна-зміна']);
const MOODS=new Set<ExpeditionMood>(['тиха-тривога','тепла-надія','польова-таємниця','наближення-бурі']);
const PALETTES=new Set<ExpeditionPalette>(['мідь-мох','синій-дощ','бурштин-туман','крейда-хвоя']);
const ENUMS:Record<Locale,{
  situation:Record<string,ExpeditionSituation>;mood:Record<string,ExpeditionMood>;palette:Record<string,ExpeditionPalette>
}>={
  uk:{
    situation:{зникнення:'зникнення',поломка:'поломка','хибний-сигнал':'хибний-сигнал','слід-мандрівника':'слід-мандрівника','природна-зміна':'природна-зміна'},
    mood:{'тиха-тривога':'тиха-тривога','тепла-надія':'тепла-надія','польова-таємниця':'польова-таємниця','наближення-бурі':'наближення-бурі'},
    palette:{'мідь-мох':'мідь-мох','синій-дощ':'синій-дощ','бурштин-туман':'бурштин-туман','крейда-хвоя':'крейда-хвоя'},
  },
  en:{
    situation:{disappearance:'зникнення',breakdown:'поломка','false-signal':'хибний-сигнал','traveler-trace':'слід-мандрівника','natural-change':'природна-зміна'},
    mood:{'quiet-tension':'тиха-тривога','warm-hope':'тепла-надія','field-mystery':'польова-таємниця','approaching-storm':'наближення-бурі'},
    palette:{'copper-moss':'мідь-мох','blue-rain':'синій-дощ','amber-mist':'бурштин-туман','chalk-pine':'крейда-хвоя'},
  },
  ru:{
    situation:{пропажа:'зникнення',поломка:'поломка','ложный-сигнал':'хибний-сигнал','след-путешественника':'слід-мандрівника','природное-изменение':'природна-зміна'},
    mood:{'тихая-тревога':'тиха-тривога','тёплая-надежда':'тепла-надія','полевая-тайна':'польова-таємниця','приближение-бури':'наближення-бурі'},
    palette:{'медь-мох':'мідь-мох','синий-дождь':'синій-дощ','янтарь-туман':'бурштин-туман','мел-хвоя':'крейда-хвоя'},
  },
};
export type ExpeditionParseResult={ok:true;value:ExpeditionNarrative}|{ok:false;reason:string};
const bounded=(value:unknown,max:number,locale:Locale):value is string=>typeof value==='string'&&!!value.trim()&&value.trim().length<=max&&languageText(value,locale);

export function parseExpeditionNarrative(raw:string,siteIds:string[],recentFingerprints:string[],locale:Locale='uk'):ExpeditionParseResult{
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
  if(start<0||end<=start)return{ok:false,reason:expeditionReason(locale,'noCard')};
  let parsed:unknown;try{parsed=JSON.parse(raw.slice(start,end+1))}catch{return{ok:false,reason:expeditionReason(locale,'incomplete')}}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return{ok:false,reason:expeditionReason(locale,'shape')};
  const card=parsed as Record<string,unknown>;
  if(!bounded(card.title,72,locale)||!bounded(card.cause,180,locale)||!bounded(card.optionalLead,160,locale)||!bounded(card.warning,140,locale))return{ok:false,reason:expeditionReason(locale,'language')};
  const enums=ENUMS[locale];
  const situation=enums.situation[String(card.situation)],mood=enums.mood[String(card.mood)],palette=enums.palette[String(card.palette)];
  if(!situation||!mood||!palette||!SITUATIONS.has(situation)||!MOODS.has(mood)||!PALETTES.has(palette))return{ok:false,reason:expeditionReason(locale,'type')};
  if(!Array.isArray(card.siteNotes)||card.siteNotes.length!==siteIds.length)return{ok:false,reason:expeditionReason(locale,'route')};
  const notes=card.siteNotes as unknown[];
  if(notes.some((note)=>!note||typeof note!=='object'||Array.isArray(note)))return{ok:false,reason:expeditionReason(locale,'note')};
  const noteObjects=notes as Array<Record<string,unknown>>;
  if(noteObjects.some((note,index)=>note.siteId!==siteIds[index]||!bounded(note.observation,140,locale)))return{ok:false,reason:expeditionReason(locale,'changed')};
  if(!bounded(card.rareFind,64,locale)||!Array.isArray(card.visualTags)||card.visualTags.length<2||card.visualTags.length>4||card.visualTags.some((tag)=>!bounded(tag,24,locale)))return{ok:false,reason:expeditionReason(locale,'find')};
  const fingerprint=`${situation}|${mood}|${palette}`;
  if(recentFingerprints.includes(fingerprint))return{ok:false,reason:expeditionReason(locale,'repeat')};
  return{ok:true,value:{title:card.title.trim(),situation,mood,palette,cause:card.cause.trim(),siteNotes:noteObjects.map((note)=>({siteId:note.siteId as string,observation:(note.observation as string).trim()})),optionalLead:card.optionalLead.trim(),warning:card.warning.trim(),rareFind:card.rareFind.trim(),visualTags:(card.visualTags as string[]).map((tag)=>tag.trim()),fingerprint,source:'local-model'}};
}

export type RadioParseResult={ok:true;value:Pick<RadioRemark,'text'|'mistaken'>}|{ok:false;reason:string};
export function parseRadioRemark(raw:string,locale:Locale='uk'):RadioParseResult{
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
  if(start<0||end<=start)return{ok:false,reason:expeditionReason(locale,'noCard')};
  let parsed:unknown;try{parsed=JSON.parse(raw.slice(start,end+1))}catch{return{ok:false,reason:expeditionReason(locale,'incomplete')}}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return{ok:false,reason:expeditionReason(locale,'shape')};
  const card=parsed as Record<string,unknown>;
  if(!bounded(card.text,160,locale))return{ok:false,reason:expeditionReason(locale,'language')};
  return{ok:true,value:{text:card.text.trim(),mistaken:card.mistaken===true}};
}

export type RelicParseResult={ok:true;value:Omit<Relic,'id'|'eventId'|'wearableId'|'source'>}|{ok:false;reason:string};
export function parseRelicCard(raw:string,seed:number,locale:Locale='uk'):RelicParseResult{
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
  if(start<0||end<=start)return{ok:false,reason:expeditionReason(locale,'noCard')};
  let parsed:unknown;try{parsed=JSON.parse(raw.slice(start,end+1))}catch{return{ok:false,reason:expeditionReason(locale,'incomplete')}}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return{ok:false,reason:expeditionReason(locale,'shape')};
  const card=parsed as Record<string,unknown>;
  if(!bounded(card.name,48,locale)||!bounded(card.story,180,locale)||!bounded(card.symbol,32,locale))return{ok:false,reason:expeditionReason(locale,'language')};
  const form=String(card.form) as RelicForm;
  const material=String(card.material) as RelicMaterial;
  const condition=String(card.condition) as RelicCondition;
  if(!RELIC_FORMS.includes(form)||!RELIC_MATERIALS.includes(material)||!RELIC_CONDITIONS.includes(condition))return{ok:false,reason:expeditionReason(locale,'type')};
  return{ok:true,value:{name:card.name.trim(),story:card.story.trim(),material,color:clampRelicColor(String(card.color??''),seed),symbol:card.symbol.trim(),condition,form,eventTitle:card.name.trim()}};
}
