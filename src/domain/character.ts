import { BODIES, BURDENS, GIFTS, MARKS, MATERIALS, PALETTES, QUIRKS } from './catalog';
import type { BodyId, BurdenId, Character, GiftId, MarkId, MaterialId, PaletteId, QuirkId } from './types';
import { getActiveLocale, localizedCopy, type Locale } from '../i18n/locale';

const ERRORS: Record<Locale, Record<string, string>> = {
  uk: {
    notJson: 'Картка не є коректним JSON.', notObject: 'Картка має бути об’єктом JSON.',
    version: 'Поле version має дорівнювати 1.', name: 'Поле name має містити від 1 до 24 символів.',
    description: 'Поле description має містити від 1 до 180 символів.',
    body: 'Поле body: один із варіантів {options}.', material: 'Поле material: один із варіантів {options}.',
    palette: 'Поле palette: один із варіантів {options}.', mark: 'Поле mark: один із варіантів {options}.',
    gift: 'Поле gift: reveal, grow, echo або mend.', burden: 'Поле burden: fragile, loud, rooted або fading.',
    quirk: 'Поле quirk: moon-touched, rain-kin, curious або shy.',
  },
  en: {
    notJson: 'The card is not valid JSON.', notObject: 'The card must be a JSON object.',
    version: 'The version field must be 1.', name: 'The name field must contain 1 to 24 characters.',
    description: 'The description field must contain 1 to 180 characters.',
    body: 'The body field: one of {options}.', material: 'The material field: one of {options}.',
    palette: 'The palette field: one of {options}.', mark: 'The mark field: one of {options}.',
    gift: 'The gift field: reveal, grow, echo, or mend.', burden: 'The burden field: fragile, loud, rooted, or fading.',
    quirk: 'The quirk field: moon-touched, rain-kin, curious, or shy.',
  },
  ru: {
    notJson: 'Карточка не является корректным JSON.', notObject: 'Карточка должна быть объектом JSON.',
    version: 'Поле version должно быть равно 1.', name: 'Поле name должно содержать от 1 до 24 символов.',
    description: 'Поле description должно содержать от 1 до 180 символов.',
    body: 'Поле body: один из вариантов {options}.', material: 'Поле material: один из вариантов {options}.',
    palette: 'Поле palette: один из вариантов {options}.', mark: 'Поле mark: один из вариантов {options}.',
    gift: 'Поле gift: reveal, grow, echo или mend.', burden: 'Поле burden: fragile, loud, rooted или fading.',
    quirk: 'Поле quirk: moon-touched, rain-kin, curious или shy.',
  },
};
function err(key: keyof typeof ERRORS.en, options?: string) {
  return (localizedCopy(ERRORS)[key] ?? ERRORS.en[key] ?? key).replaceAll('{options}', options ?? '');
}

export type CharacterValidation = { ok: true; character: Character } | { ok: false; errors: string[] };
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[<>]/g, '').trim().slice(0, max) : '';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function validateCharacterCard(input: string): CharacterValidation {
  let raw: unknown;
  try { raw = JSON.parse(input); } catch { return { ok: false, errors: [err('notJson')] }; }
  if (!record(raw)) return { ok: false, errors: [err('notObject')] };
  const errors: string[] = [];
  const name = clean(raw.name, 24);
  const description = clean(raw.description, 180);
  const appearance = record(raw.appearance) ? raw.appearance : {};
  if (raw.version !== 1) errors.push(err('version'));
  if (!name) errors.push(err('name'));
  if (!description) errors.push(err('description'));
  const body = appearance.body, material = appearance.material, palette = appearance.palette, mark = appearance.mark;
  const gift = raw.gift, burden = raw.burden, quirk = raw.quirk;
  if (!BODIES.includes(body as BodyId)) errors.push(err('body', BODIES.join(', ')));
  if (!MATERIALS.includes(material as MaterialId)) errors.push(err('material', MATERIALS.join(', ')));
  if (!PALETTES.includes(palette as PaletteId)) errors.push(err('palette', PALETTES.join(', ')));
  if (!MARKS.includes(mark as MarkId)) errors.push(err('mark', MARKS.join(', ')));
  if (typeof gift !== 'string' || !(gift in GIFTS)) errors.push(err('gift'));
  if (typeof burden !== 'string' || !(burden in BURDENS)) errors.push(err('burden'));
  if (typeof quirk !== 'string' || !(quirk in QUIRKS)) errors.push(err('quirk'));
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    character: {
      version: 1, name, description,
      appearance: { body: body as BodyId, material: material as MaterialId, palette: palette as PaletteId, mark: mark as MarkId },
      gift: GIFTS[gift as GiftId], burden: BURDENS[burden as BurdenId], quirk: QUIRKS[quirk as QuirkId],
    },
  };
}

const names:Record<Locale,readonly string[]> = {uk:['Морроу','Піп','Сейбл','Лума','Клаптик','Нім'],en:['Morrow','Pip','Sable','Luma','Tatter','Nim'],ru:['Морроу','Пип','Сейбл','Лума','Лоскут','Ним']};
export const GENERATED_SUBJECTS = [
  'пам’ятає зниклі дороги',
  'збирає дощ, якого ніколи не було',
  'співає сонним дверям',
  'зберігає обіцянки в крихітних баночках',
] as const;
const SUBJECTS:Record<Locale,readonly string[]>={uk:GENERATED_SUBJECTS,en:['remembers vanished roads','collects rain that never fell','sings to sleeping doorways','keeps promises in tiny jars'],ru:['помнит исчезнувшие дороги','собирает дождь, которого никогда не было','поёт сонным дверям','хранит обещания в крошечных банках']};

const BODY_FORMS: Record<BodyId, Record<MaterialId, string>> = {
  fox: { porcelain:'Порцелянова лисиця', moss:'Мохова лисиця', paper:'Паперова лисиця', starlight:'Зоряна лисиця' },
  moth: { porcelain:'Порцелянова міль', moss:'Мохова міль', paper:'Паперова міль', starlight:'Зоряна міль' },
  bird: { porcelain:'Порцеляновий птах', moss:'Моховий птах', paper:'Паперовий птах', starlight:'Зоряний птах' },
  wisp: { porcelain:'Порцеляновий вогник', moss:'Моховий вогник', paper:'Паперовий вогник', starlight:'Зоряний вогник' },
};
const BODY_FORMS_OTHER:Record<Exclude<Locale,'uk'>,Record<BodyId,Record<MaterialId,string>>>={
  en:{fox:{porcelain:'Porcelain fox',moss:'Moss fox',paper:'Paper fox',starlight:'Starlight fox'},moth:{porcelain:'Porcelain moth',moss:'Moss moth',paper:'Paper moth',starlight:'Starlight moth'},bird:{porcelain:'Porcelain bird',moss:'Moss bird',paper:'Paper bird',starlight:'Starlight bird'},wisp:{porcelain:'Porcelain wisp',moss:'Moss wisp',paper:'Paper wisp',starlight:'Starlight wisp'}},
  ru:{fox:{porcelain:'Фарфоровая лиса',moss:'Моховая лиса',paper:'Бумажная лиса',starlight:'Звёздная лиса'},moth:{porcelain:'Фарфоровый мотылёк',moss:'Моховой мотылёк',paper:'Бумажный мотылёк',starlight:'Звёздный мотылёк'},bird:{porcelain:'Фарфоровая птица',moss:'Моховая птица',paper:'Бумажная птица',starlight:'Звёздная птица'},wisp:{porcelain:'Фарфоровый огонёк',moss:'Моховой огонёк',paper:'Бумажный огонёк',starlight:'Звёздный огонёк'}},
};

export function generatedDescription(body: BodyId, material: MaterialId, subject: string,locale:Locale=getActiveLocale()) {
  const form=locale==='uk'?BODY_FORMS[body][material]:BODY_FORMS_OTHER[locale][body][material];
  return locale==='uk'?`${form}, що ${subject}.`:locale==='ru'?`${form}, который ${subject}.`:`${form} that ${subject}.`;
}

function rng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value |= 0; value = value + 0x6D2B79F5 | 0;
    let mixed = Math.imul(value ^ value >>> 15, 1 | value);
    mixed = mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed) ^ mixed;
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

export function generateCharacter(seed: number): Character {
  const random = rng(seed);
  const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)] as T;
  const body = pick(BODIES), material = pick(MATERIALS), palette = pick(PALETTES), mark = pick(MARKS);
  const gift = pick(Object.keys(GIFTS) as GiftId[]), burden = pick(Object.keys(BURDENS) as BurdenId[]), quirk = pick(Object.keys(QUIRKS) as QuirkId[]);
  return {
    version: 1,
    name: pick(names[getActiveLocale()]),
    description: generatedDescription(body, material, pick(SUBJECTS[getActiveLocale()])),
    appearance: { body, material, palette, mark },
    gift: GIFTS[gift], burden: BURDENS[burden], quirk: QUIRKS[quirk],
  };
}

const AI_PACKETS: Record<Locale, string> = {
  uk: `Створи одного оригінального персонажа для мирної гри про дослідження. Усі значення name і description напиши українською. Поверни лише JSON точно такої форми:\n{"version":1,"name":"1–24 символи українською","description":"1–180 символів українською","appearance":{"body":"fox|moth|bird|wisp","material":"porcelain|moss|paper|starlight","palette":"dusk|dawn|grove|tide","mark":"map-lines|stars|rings|cracks"},"gift":"reveal|grow|echo|mend","burden":"fragile|loud|rooted|fading","quirk":"moon-touched|rain-kin|curious|shy"}\nЗроби опис образним і тематично поєднай три риси. Не додавай характеристик, сил, полів, markdown чи пояснень. Увесь числовий баланс визначає гра.`,
  en: `Create one original character for a peaceful exploration game. Write the name and description values in English. Return only JSON in exactly this shape:\n{"version":1,"name":"1–24 English characters","description":"1–180 English characters","appearance":{"body":"fox|moth|bird|wisp","material":"porcelain|moss|paper|starlight","palette":"dusk|dawn|grove|tide","mark":"map-lines|stars|rings|cracks"},"gift":"reveal|grow|echo|mend","burden":"fragile|loud|rooted|fading","quirk":"moon-touched|rain-kin|curious|shy"}\nMake the description vivid and thematically bind the three traits. Do not add stats, powers, extra fields, markdown, or explanations. The game determines all numeric balance.`,
  ru: `Создай одного оригинального персонажа для мирной игры об исследовании. Все значения name и description напиши по-русски. Верни только JSON точно такой формы:\n{"version":1,"name":"1–24 символа по-русски","description":"1–180 символов по-русски","appearance":{"body":"fox|moth|bird|wisp","material":"porcelain|moss|paper|starlight","palette":"dusk|dawn|grove|tide","mark":"map-lines|stars|rings|cracks"},"gift":"reveal|grow|echo|mend","burden":"fragile|loud|rooted|fading","quirk":"moon-touched|rain-kin|curious|shy"}\nСделай описание образным и тематически свяжи три черты. Не добавляй характеристик, сил, полей, markdown или пояснений. Весь числовой баланс определяет игра.`,
};
export function aiContextPacket(locale = getActiveLocale()) {
  return localizedCopy(AI_PACKETS, locale);
}
export const AI_CONTEXT_PACKET = AI_PACKETS.uk;
