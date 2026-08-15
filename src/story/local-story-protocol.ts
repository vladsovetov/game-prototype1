import type { StoryIngredients } from '../domain/story';
import type { ExpeditionMood, ExpeditionNarrative, ExpeditionPalette, ExpeditionSituation } from '../domain/types';

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
} | {
  type: 'generate-expedition'; jobId: string; expeditionId: string; seed: number;
  character: { name: string; description: string; gift: string; burden: string; quirk: string };
  contractName: string; siteIds: string[]; recentMemories: string[]; recentFingerprints: string[];
} | { type: 'cancel'; jobId: string };

export type StoryWorkerMessage =
  | { type: 'progress'; jobId: string; stage: 'download' | 'read' | 'weave'; progress?: number }
  | { type: 'complete'; jobId: string; raw: string }
  | { type: 'complete-expedition'; jobId: string; raw: string }
  | { type: 'error'; jobId: string; message: string };

export type StoryParseResult = { ok: true; value: StoryIngredients } | { ok: false; reason: string };

export function parseStoryIngredients(raw: string): StoryParseResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, reason: 'Пристрій не повернув об’єкт історії.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { ok: false, reason: 'Пристрій повернув незавершений об’єкт історії.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'Об’єкт історії має неправильну форму.' };
  const source = parsed as Record<string, unknown>;
  const value = {} as StoryIngredients;
  for (const key of Object.keys(LIMITS) as Array<keyof StoryIngredients>) {
    const field = source[key];
    if (typeof field !== 'string' || !field.trim() || field.trim().length > LIMITS[key]) {
      return { ok: false, reason: `Поле ${key} відсутнє або задовге.` };
    }
    value[key] = field.trim();
  }
  if (!Object.values(value).every((field) => /[А-ЯІЇЄҐа-яіїєґ]/.test(field) && !/[A-Za-z]/.test(field))) {
    return { ok: false, reason: 'Локальний оповідач не повернув текст українською.' };
  }
  return { ok: true, value };
}

const SITUATIONS=new Set<ExpeditionSituation>(['зникнення','поломка','хибний-сигнал','слід-мандрівника','природна-зміна']);
const MOODS=new Set<ExpeditionMood>(['тиха-тривога','тепла-надія','польова-таємниця','наближення-бурі']);
const PALETTES=new Set<ExpeditionPalette>(['мідь-мох','синій-дощ','бурштин-туман','крейда-хвоя']);
export type ExpeditionParseResult={ok:true;value:ExpeditionNarrative}|{ok:false;reason:string};
const uk=(value:string)=>/[А-ЯІЇЄҐа-яіїєґ]/.test(value)&&!/[A-Za-z]/.test(value);
const bounded=(value:unknown,max:number):value is string=>typeof value==='string'&&!!value.trim()&&value.trim().length<=max&&uk(value);

export function parseExpeditionNarrative(raw:string,siteIds:string[],recentFingerprints:string[]):ExpeditionParseResult{
  const start=raw.indexOf('{'),end=raw.lastIndexOf('}');
  if(start<0||end<=start)return{ok:false,reason:'Локальний режисер не повернув картку пригоди.'};
  let parsed:unknown;try{parsed=JSON.parse(raw.slice(start,end+1))}catch{return{ok:false,reason:'Локальний режисер повернув незавершену картку.'}}
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return{ok:false,reason:'Картка пригоди має неправильну форму.'};
  const card=parsed as Record<string,unknown>;
  if(!bounded(card.title,72)||!bounded(card.cause,180)||!bounded(card.optionalLead,160)||!bounded(card.warning,140))return{ok:false,reason:'У картці пригоди бракує короткого українського тексту.'};
  if(!SITUATIONS.has(card.situation as ExpeditionSituation)||!MOODS.has(card.mood as ExpeditionMood)||!PALETTES.has(card.palette as ExpeditionPalette))return{ok:false,reason:'Картка пригоди містить невідомий тип або настрій.'};
  if(!Array.isArray(card.siteNotes)||card.siteNotes.length!==siteIds.length)return{ok:false,reason:'Картка пригоди не описує весь маршрут.'};
  const notes=card.siteNotes as unknown[];
  if(notes.some((note)=>!note||typeof note!=='object'||Array.isArray(note)))return{ok:false,reason:'Локальний режисер залишив неправильну нотатку маршруту.'};
  const noteObjects=notes as Array<Record<string,unknown>>;
  if(noteObjects.some((note,index)=>note.siteId!==siteIds[index]||!bounded(note.observation,140)))return{ok:false,reason:'Локальний режисер змінив маршрут або залишив неправильну нотатку.'};
  if(!bounded(card.rareFind,64)||!Array.isArray(card.visualTags)||card.visualTags.length<2||card.visualTags.length>4||card.visualTags.some((tag)=>!bounded(tag,24)))return{ok:false,reason:'Картка пригоди містить неправильну знахідку або візуальні ознаки.'};
  const fingerprint=`${card.situation}|${card.mood}|${card.palette}`;
  if(recentFingerprints.includes(fingerprint))return{ok:false,reason:'Локальний режисер повторив недавню пригоду.'};
  return{ok:true,value:{title:card.title.trim(),situation:card.situation as ExpeditionSituation,mood:card.mood as ExpeditionMood,palette:card.palette as ExpeditionPalette,cause:card.cause.trim(),siteNotes:noteObjects.map((note)=>({siteId:note.siteId as string,observation:(note.observation as string).trim()})),optionalLead:card.optionalLead.trim(),warning:card.warning.trim(),rareFind:card.rareFind.trim(),visualTags:(card.visualTags as string[]).map((tag)=>tag.trim()),fingerprint,source:'local-model'}};
}
