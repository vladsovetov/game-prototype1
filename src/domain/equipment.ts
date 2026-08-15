import { localizedCopy, type Locale } from '../i18n/locale';
import type { EquipmentSlot, RunDirection, WearableId } from './types';

export interface Wearable {
  id: WearableId;
  name: string;
  description: string;
  slot: EquipmentSlot;
  mark: string;
}

const WEARABLE_COPY: Record<Locale, Record<WearableId, Wearable>> = {
  uk: {
    'rain-hat': { id: 'rain-hat', name: 'Дощовий капелюх', description: 'Не дає дощу заливати очі під час роботи.', slot: 'head', mark: 'КАПЕЛЮХ' },
    'wool-scarf': { id: 'wool-scarf', name: 'Вовняний шарф', description: 'Теплий шарф із пришитою польовою міткою.', slot: 'neck', mark: 'ШАРФ' },
    'canvas-pack': { id: 'canvas-pack', name: 'Парусиновий наплічник', description: 'Міцний наплічник для карт, їжі та дрібного ремонту.', slot: 'back', mark: 'НАПЛІЧНИК' },
    'rubber-boots': { id: 'rubber-boots', name: 'Гумові чоботи', description: 'Дозволяють не боятися калюж і мілких каналів.', slot: 'feet', mark: 'ЧОБОТИ' },
  },
  en: {
    'rain-hat': { id: 'rain-hat', name: 'Rain hat', description: 'Keeps rain out of your eyes while you work.', slot: 'head', mark: 'HAT' },
    'wool-scarf': { id: 'wool-scarf', name: 'Wool scarf', description: 'A warm scarf with a field mark sewn in.', slot: 'neck', mark: 'SCARF' },
    'canvas-pack': { id: 'canvas-pack', name: 'Canvas pack', description: 'A sturdy pack for maps, food, and small repairs.', slot: 'back', mark: 'PACK' },
    'rubber-boots': { id: 'rubber-boots', name: 'Rubber boots', description: 'Let you ignore puddles and shallow canals.', slot: 'feet', mark: 'BOOTS' },
  },
  ru: {
    'rain-hat': { id: 'rain-hat', name: 'Дождевая шляпа', description: 'Не даёт дождю заливать глаза во время работы.', slot: 'head', mark: 'ШЛЯПА' },
    'wool-scarf': { id: 'wool-scarf', name: 'Шерстяной шарф', description: 'Тёплый шарф с пришитой полевой меткой.', slot: 'neck', mark: 'ШАРФ' },
    'canvas-pack': { id: 'canvas-pack', name: 'Парусиновый рюкзак', description: 'Прочный рюкзак для карт, еды и мелкого ремонта.', slot: 'back', mark: 'РЮКЗАК' },
    'rubber-boots': { id: 'rubber-boots', name: 'Резиновые сапоги', description: 'Позволяют не бояться луж и мелких каналов.', slot: 'feet', mark: 'САПОГИ' },
  },
};

export const WEARABLES = {} as Record<WearableId, Wearable>;
for (const id of Object.keys(WEARABLE_COPY.uk) as WearableId[]) {
  Object.defineProperty(WEARABLES, id, { enumerable: true, get: () => localizedCopy(WEARABLE_COPY)[id] });
}

export type EquipmentState = { wardrobe: readonly WearableId[]; equipped: Partial<Record<EquipmentSlot, WearableId>> };

export function gearForDirection(direction: RunDirection) {
  const wardrobe = [...direction.starterWearables];
  const equipped: Partial<Record<EquipmentSlot, WearableId>> = {};
  for (const id of wardrobe) equipped[WEARABLES[id].slot] = id;
  return { wardrobe, equipped };
}

export function equipWearable<T extends EquipmentState>(state: T, id: WearableId): T {
  if (!state.wardrobe.includes(id)) return state;
  const slot = WEARABLES[id].slot;
  const equipped = { ...state.equipped };
  if (equipped[slot] === id) delete equipped[slot];
  else equipped[slot] = id;
  return { ...state, equipped };
}

export function unlockWearable<T extends EquipmentState>(state: T, id: WearableId): T {
  if (state.wardrobe.includes(id)) return state;
  return { ...state, wardrobe: [...state.wardrobe, id] };
}

export const ANOMALY_GEAR: Partial<Record<string, WearableId>> = {
  stone: 'canvas-pack', sign: 'rain-hat', pool: 'rubber-boots', garden: 'wool-scarf',
};
