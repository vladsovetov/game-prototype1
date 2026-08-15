import type { Locale } from '../i18n/locale';

interface PromptCharacter { name:string;description:string;gift:string;burden:string;quirk:string }
interface PromptMessage { role:'system'|'user';content:string }
interface ExpeditionPromptInput { character:PromptCharacter;seed:number;contractName:string;siteIds:string[];recentMemories:string[];recentFingerprints:string[] }

const languageInstruction:Record<Locale,string>={
  en:'Write only in English.',uk:'Пиши лише українською.',ru:'Пиши только на русском языке.',
};

export function openingPrompt(locale:Locale,character:PromptCharacter,seed:number):PromptMessage[]{
  const schema='{"place":"place name, max 64 characters","role":"grounded role","disaster":"specific past event","vow":"short promise","motif":"physical motif","truth":"hidden personal truth"}';
  if(locale==='uk')return[
    {role:'system',content:`Ти пишеш затишну польову історію. ${languageInstruction.uk} Поверни лише валідний JSON без markdown, пояснень чи англійських слів.`},
    {role:'user',content:`Створи відмінний початок світу для ${character.name}. Супутник: ${character.description}. Інструмент: ${character.gift}. Стиль роботи: ${character.burden}. Риса: ${character.quirk}. Випадкове зерно: ${seed}. Схема: ${schema}`},
  ];
  if(locale==='ru')return[
    {role:'system',content:`Ты пишешь уютную полевую историю. ${languageInstruction.ru} Верни только валидный JSON без markdown, пояснений или английских слов.`},
    {role:'user',content:`Создай непохожее на прошлые начало мира для ${character.name}. Спутник: ${character.description}. Инструмент: ${character.gift}. Стиль работы: ${character.burden}. Черта: ${character.quirk}. Случайное зерно: ${seed}. Схема: ${schema}`},
  ];
  return[
    {role:'system',content:`You write a cozy field story. ${languageInstruction.en} Return one valid JSON object without markdown or explanations.`},
    {role:'user',content:`Create a distinctive new world opening for ${character.name}. Companion: ${character.description}. Tool: ${character.gift}. Work style: ${character.burden}. Trait: ${character.quirk}. Random seed: ${seed}. Schema: ${schema}`},
  ];
}

export function expeditionPrompt(locale:Locale,input:ExpeditionPromptInput):PromptMessage[]{
  const enumCopy={
    en:{s:'disappearance | breakdown | false-signal | traveler-trace | natural-change',m:'quiet-tension | warm-hope | field-mystery | approaching-storm',p:'copper-moss | blue-rain | amber-mist | chalk-pine'},
    uk:{s:'зникнення | поломка | хибний-сигнал | слід-мандрівника | природна-зміна',m:'тиха-тривога | тепла-надія | польова-таємниця | наближення-бурі',p:'мідь-мох | синій-дощ | бурштин-туман | крейда-хвоя'},
    ru:{s:'пропажа | поломка | ложный-сигнал | след-путешественника | природное-изменение',m:'тихая-тревога | тёплая-надежда | полевая-тайна | приближение-бури',p:'медь-мох | синий-дождь | янтарь-туман | мел-хвоя'},
  }[locale];
  const none=locale==='en'?'none yet':locale==='ru'?'пока нет':'ще немає';
  const schema=`{"title":"max 72 characters","situation":"${enumCopy.s}","mood":"${enumCopy.m}","palette":"${enumCopy.p}","cause":"specific cause","siteNotes":[one {"siteId":"exact route id","observation":"physical evidence"} per route site in the same order],"optionalLead":"specific distant clue","warning":"honest warning","rareFind":"small real object","visualTags":["2-4 short visual details"]}`;
  const system=locale==='en'
    ? `You direct a cozy field expedition. ${languageInstruction.en} Return one valid JSON object. Keep every siteId and the route unchanged. Use grounded pumps, cables, shelters, tracks, weather, and tools.`
    :locale==='ru'
      ? `Ты режиссёр уютной полевой экспедиции. ${languageInstruction.ru} Верни один валидный JSON. Не меняй siteId и маршрут. Используй реальные насосы, кабели, укрытия, следы, погоду и инструменты.`
      :`Ти локальний режисер затишної польової пригоди. ${languageInstruction.uk} Поверни один валідний JSON. Не змінюй siteId і маршрут. Використовуй реальні помпи, кабелі, укриття, сліди, погоду та інструменти.`;
  const user=locale==='en'
    ? `Character: ${input.character.name}. Description: ${input.character.description}. Tool: ${input.character.gift}. Work style: ${input.character.burden}. Trait: ${input.character.quirk}. Contract: ${input.contractName}. Seed: ${input.seed}. Exact route: ${input.siteIds.join(', ')}. Relevant memories: ${input.recentMemories.join(' | ')||none}. Forbidden recent fingerprints: ${input.recentFingerprints.join(' | ')||none}. Schema: ${schema}`
    : locale==='ru'
      ? `Персонаж: ${input.character.name}. Описание: ${input.character.description}. Инструмент: ${input.character.gift}. Стиль работы: ${input.character.burden}. Черта: ${input.character.quirk}. Контракт: ${input.contractName}. Зерно: ${input.seed}. Точный маршрут: ${input.siteIds.join(', ')}. Связанные воспоминания: ${input.recentMemories.join(' | ')||none}. Запрещённые недавние отпечатки: ${input.recentFingerprints.join(' | ')||none}. Схема: ${schema}`
      : `Персонаж: ${input.character.name}. Опис: ${input.character.description}. Інструмент: ${input.character.gift}. Стиль роботи: ${input.character.burden}. Риса: ${input.character.quirk}. Контракт: ${input.contractName}. Зерно: ${input.seed}. Точний маршрут: ${input.siteIds.join(', ')}. Пов’язані спогади: ${input.recentMemories.join(' | ')||none}. Заборонені недавні відбитки: ${input.recentFingerprints.join(' | ')||none}. Схема: ${schema}`;
  return[{role:'system',content:system},{role:'user',content:user}];
}
