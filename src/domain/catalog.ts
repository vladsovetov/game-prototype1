import type { BodyId, BurdenId, CatalogEntry, GiftId, MarkId, MaterialId, PaletteId, QuirkId } from './types';

export const GIFTS: Record<GiftId, CatalogEntry<GiftId>> = {
  reveal: { id: 'reveal', name: 'Виявлення', description: 'Показує те, що світ приховав.' },
  grow: { id: 'grow', name: 'Зростання', description: 'Пробуджує живі форми в речах, що чекали.' },
  echo: { id: 'echo', name: 'Відлуння', description: 'Дарує пам’яті й звукам друге життя.' },
  mend: { id: 'mend', name: 'Відновлення', description: 'Лагодить зруйновані візерунки й тихі місця.' },
};

export const BURDENS: Record<BurdenId, CatalogEntry<BurdenId>> = {
  fragile: { id: 'fragile', name: 'Крихкість', description: 'Після використання Дару ненадовго з’являється видима тріщина.' },
  loud: { id: 'loud', name: 'Гучність', description: 'Використання Дару будить довколишні сонні речі.' },
  rooted: { id: 'rooted', name: 'Укорінення', description: 'Потрібна коротка зупинка, поки Дар набирає сили.' },
  fading: { id: 'fading', name: 'Згасання', description: 'Тіло стає прозорим, доки не повернеться до світла.' },
};

export const QUIRKS: Record<QuirkId, CatalogEntry<QuirkId>> = {
  'moon-touched': { id: 'moon-touched', name: 'Торкнутий місяцем', description: 'Старі місячні знаки світяться у вашій присутності.' },
  'rain-kin': { id: 'rain-kin', name: 'Рідний дощу', description: 'Калюжі тягнуться до близьких таємниць.' },
  curious: { id: 'curious', name: 'Допитливий', description: 'Огляд відкриває ще одну думку.' },
  shy: { id: 'shy', name: 'Сором’язливий', description: 'Тихі паузи пробуджують крихітні паростки.' },
};

export const BODIES: BodyId[] = ['fox', 'moth', 'bird', 'wisp'];
export const MATERIALS: MaterialId[] = ['porcelain', 'moss', 'paper', 'starlight'];
export const PALETTES: PaletteId[] = ['dusk', 'dawn', 'grove', 'tide'];
export const MARKS: MarkId[] = ['map-lines', 'stars', 'rings', 'cracks'];

export const APPEARANCE_NAMES = {
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

export const APPEARANCE_GROUP_NAMES: Record<keyof typeof APPEARANCE_NAMES, string> = {
  body: 'Тіло', material: 'Матеріал', palette: 'Палітра', mark: 'Знак',
};

export const PALETTE_COLORS: Record<PaletteId, [string, string]> = {
  dusk: ['#75658f', '#e3b866'], dawn: ['#db826c', '#f4d49c'], grove: ['#668665', '#c6d18b'], tide: ['#57918f', '#b5e0d6'],
};
