import { localizedCopy, type Locale } from '../i18n/locale';
import { seededRandom } from './random';
import type { GameState, RegionId, RunDirection, StoryFrameId, WearableId, WeatherId } from './types';

const REGIONS: RegionId[] = ['orchard', 'marsh', 'highland', 'coast'];
const WEATHERS: WeatherId[] = ['sunbreak', 'rain', 'mist', 'wind'];
const FRAMES: StoryFrameId[] = ['station', 'harvest', 'surveyor', 'water-route'];
const WEARABLES: WearableId[] = ['rain-hat', 'wool-scarf', 'canvas-pack', 'rubber-boots'];

const COLORWAYS: Record<RegionId, Array<RunDirection['colors']>> = {
  orchard: [
    ['#5f7a55', '#9dbb72', '#e0bf6a', '#805a43', '#f3e4b6'],
    ['#60735b', '#a9c08b', '#d89063', '#6c4d3d', '#ece0bd'],
    ['#496b58', '#87a66f', '#d7aa55', '#7b5547', '#e9d7a0'],
  ],
  marsh: [
    ['#486d68', '#789b87', '#c4a965', '#513f3b', '#dce2c5'],
    ['#3f6971', '#75a0a0', '#c8b47b', '#594843', '#d8e2d8'],
    ['#536f64', '#839887', '#b9905c', '#493d3a', '#d4d8bc'],
  ],
  highland: [
    ['#526453', '#84967a', '#c5a260', '#66564d', '#d9d5bb'],
    ['#465d64', '#738a8c', '#d0ae68', '#5f4d48', '#d7d8cf'],
    ['#5c6250', '#969476', '#c58c59', '#594844', '#ded5b4'],
  ],
  coast: [
    ['#3d7180', '#75a6a4', '#e0b96c', '#755447', '#e9e3c8'],
    ['#45697b', '#82a4af', '#d49a68', '#604b48', '#e2ddd2'],
    ['#3f7471', '#7da69b', '#d7bd79', '#6d5141', '#eee2bd'],
  ],
};

function signalHash(signal: string) {
  let value = 0x811c9dc5;
  for (const symbol of signal) {
    value ^= symbol.codePointAt(0) ?? 0;
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

function pick<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length)]!;
}

export function createRunDirection(seed: number, modelSignal = ''): RunDirection {
  const random = seededRandom(((seed >>> 0) ^ signalHash(modelSignal)) >>> 0);
  const region = pick(REGIONS, random);
  const weather = pick(WEATHERS, random);
  const frame = pick(FRAMES, random);
  const colorway = Math.floor(random() * COLORWAYS[region].length);
  const first = pick(WEARABLES, random);
  const second = pick(WEARABLES.filter((item) => item !== first), random);
  return { region, weather, frame, colorway, colors: COLORWAYS[region][colorway]!, starterWearables: [first, second] };
}

export function directionFor(state: Pick<GameState, 'worldSeed' | 'storyArc'>) {
  return state.storyArc?.direction ?? createRunDirection(state.worldSeed ?? state.storyArc?.seed ?? 0);
}

const REGION_COPY: Record<Locale, Record<RegionId, string>> = {
  uk: { orchard: 'Сад старих яблунь', marsh: 'Тиха болотяна стежка', highland: 'Вітряне нагір’я', coast: 'Берег сигнальних вогнів' },
  en: { orchard: 'Old Apple Orchard', marsh: 'Quiet Marsh Path', highland: 'Windy Highlands', coast: 'Signal-Light Coast' },
  ru: { orchard: 'Сад старых яблонь', marsh: 'Тихая болотная тропа', highland: 'Ветреное нагорье', coast: 'Берег сигнальных огней' },
};
const WEATHER_COPY: Record<Locale, Record<WeatherId, string>> = {
  uk: { sunbreak: 'сонце після дощу', rain: 'дрібний дощ', mist: 'низький туман', wind: 'сильний вітер' },
  en: { sunbreak: 'sun after rain', rain: 'fine rain', mist: 'low mist', wind: 'strong wind' },
  ru: { sunbreak: 'солнце после дождя', rain: 'мелкий дождь', mist: 'низкий туман', wind: 'сильный ветер' },
};

function localizedNames<K extends string>(copy: Record<Locale, Record<K, string>>) {
  const result = {} as Record<K, string>;
  for (const id of Object.keys(copy.uk) as K[]) {
    Object.defineProperty(result, id, { enumerable: true, get: () => localizedCopy(copy)[id] });
  }
  return result;
}

export const REGION_NAMES = localizedNames(REGION_COPY);
export const WEATHER_NAMES = localizedNames(WEATHER_COPY);
