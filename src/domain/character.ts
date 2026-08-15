import { BODIES, BURDENS, GIFTS, MARKS, MATERIALS, PALETTES, QUIRKS } from './catalog';
import type { BodyId, BurdenId, Character, GiftId, MarkId, MaterialId, PaletteId, QuirkId } from './types';

export type CharacterValidation = { ok: true; character: Character } | { ok: false; errors: string[] };
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[<>]/g, '').trim().slice(0, max) : '';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function validateCharacterCard(input: string): CharacterValidation {
  let raw: unknown;
  try { raw = JSON.parse(input); } catch { return { ok: false, errors: ['Картка не є коректним JSON.'] }; }
  if (!record(raw)) return { ok: false, errors: ['Картка має бути об’єктом JSON.'] };
  const errors: string[] = [];
  const name = clean(raw.name, 24);
  const description = clean(raw.description, 180);
  const appearance = record(raw.appearance) ? raw.appearance : {};
  if (raw.version !== 1) errors.push('Поле version має дорівнювати 1.');
  if (!name) errors.push('Поле name має містити від 1 до 24 символів.');
  if (!description) errors.push('Поле description має містити від 1 до 180 символів.');
  const body = appearance.body, material = appearance.material, palette = appearance.palette, mark = appearance.mark;
  const gift = raw.gift, burden = raw.burden, quirk = raw.quirk;
  if (!BODIES.includes(body as BodyId)) errors.push(`Поле body: один із варіантів ${BODIES.join(', ')}.`);
  if (!MATERIALS.includes(material as MaterialId)) errors.push(`Поле material: один із варіантів ${MATERIALS.join(', ')}.`);
  if (!PALETTES.includes(palette as PaletteId)) errors.push(`Поле palette: один із варіантів ${PALETTES.join(', ')}.`);
  if (!MARKS.includes(mark as MarkId)) errors.push(`Поле mark: один із варіантів ${MARKS.join(', ')}.`);
  if (typeof gift !== 'string' || !(gift in GIFTS)) errors.push('Поле gift: reveal, grow, echo або mend.');
  if (typeof burden !== 'string' || !(burden in BURDENS)) errors.push('Поле burden: fragile, loud, rooted або fading.');
  if (typeof quirk !== 'string' || !(quirk in QUIRKS)) errors.push('Поле quirk: moon-touched, rain-kin, curious або shy.');
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

const names = ['Морроу', 'Піп', 'Сейбл', 'Лума', 'Клаптик', 'Нім'];
export const GENERATED_SUBJECTS = [
  'пам’ятає зниклі дороги',
  'збирає дощ, якого ніколи не було',
  'співає сонним дверям',
  'зберігає обіцянки в крихітних баночках',
] as const;

const BODY_FORMS: Record<BodyId, Record<MaterialId, string>> = {
  fox: { porcelain:'Порцелянова лисиця', moss:'Мохова лисиця', paper:'Паперова лисиця', starlight:'Зоряна лисиця' },
  moth: { porcelain:'Порцелянова міль', moss:'Мохова міль', paper:'Паперова міль', starlight:'Зоряна міль' },
  bird: { porcelain:'Порцеляновий птах', moss:'Моховий птах', paper:'Паперовий птах', starlight:'Зоряний птах' },
  wisp: { porcelain:'Порцеляновий вогник', moss:'Моховий вогник', paper:'Паперовий вогник', starlight:'Зоряний вогник' },
};

export function generatedDescription(body: BodyId, material: MaterialId, subject: string) {
  return `${BODY_FORMS[body][material]}, що ${subject}.`;
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
    name: pick(names),
    description: generatedDescription(body, material, pick(GENERATED_SUBJECTS)),
    appearance: { body, material, palette, mark },
    gift: GIFTS[gift], burden: BURDENS[burden], quirk: QUIRKS[quirk],
  };
}

export const AI_CONTEXT_PACKET = `Створи одного оригінального персонажа для мирної гри про дослідження. Усі значення name і description напиши українською. Поверни лише JSON точно такої форми:\n{"version":1,"name":"1–24 символи українською","description":"1–180 символів українською","appearance":{"body":"fox|moth|bird|wisp","material":"porcelain|moss|paper|starlight","palette":"dusk|dawn|grove|tide","mark":"map-lines|stars|rings|cracks"},"gift":"reveal|grow|echo|mend","burden":"fragile|loud|rooted|fading","quirk":"moon-touched|rain-kin|curious|shy"}\nЗроби опис образним і тематично поєднай три риси. Не додавай характеристик, сил, полів, markdown чи пояснень. Увесь числовий баланс визначає гра.`;
