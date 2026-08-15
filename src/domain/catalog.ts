import type { BodyId, BurdenId, CatalogEntry, GiftId, MarkId, MaterialId, PaletteId, QuirkId } from './types';

export const GIFTS: Record<GiftId, CatalogEntry<GiftId>> = {
  reveal: { id: 'reveal', name: 'Ручний ліхтар', description: 'Освітлює стерті написи, темні комори й дорожні мітки.' },
  grow: { id: 'grow', name: 'Садовий секатор', description: 'Розчищає зарості та повертає форму занедбаним рослинам.' },
  echo: { id: 'echo', name: 'Камертон', description: 'Перевіряє дзвони, резонатори й приховані порожнини за звуком.' },
  mend: { id: 'mend', name: 'Ремонтний набір', description: 'Містить мотузку, ключі, латки й усе для простого польового ремонту.' },
};

export const BURDENS: Record<BurdenId, CatalogEntry<BurdenId>> = {
  fragile: { id: 'fragile', name: 'Обережні руки', description: 'Після роботи потрібна коротка пауза, щоб перевірити крихкі деталі.' },
  loud: { id: 'loud', name: 'Гучна робота', description: 'Звук інструмента привертає увагу всього навколо.' },
  rooted: { id: 'rooted', name: 'Повільний майстер', description: 'Потрібна коротка зупинка, щоб скласти інструмент після роботи.' },
  fading: { id: 'fading', name: 'Слабкий ліхтар', description: 'Після роботи світло на мить стає тьмянішим.' },
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
