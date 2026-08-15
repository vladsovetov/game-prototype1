import type { EquipmentSlot, RunDirection, WearableId } from './types';

export interface Wearable {
  id: WearableId;
  name: string;
  description: string;
  slot: EquipmentSlot;
  mark: string;
}

export const WEARABLES: Record<WearableId, Wearable> = {
  'rain-hat': { id: 'rain-hat', name: 'Дощовий капелюх', description: 'Не дає дощу заливати очі під час роботи.', slot: 'head', mark: 'КАПЕЛЮХ' },
  'wool-scarf': { id: 'wool-scarf', name: 'Вовняний шарф', description: 'Теплий шарф із пришитою польовою міткою.', slot: 'neck', mark: 'ШАРФ' },
  'canvas-pack': { id: 'canvas-pack', name: 'Парусиновий наплічник', description: 'Міцний наплічник для карт, їжі та дрібного ремонту.', slot: 'back', mark: 'НАПЛІЧНИК' },
  'rubber-boots': { id: 'rubber-boots', name: 'Гумові чоботи', description: 'Дозволяють не боятися калюж і мілких каналів.', slot: 'feet', mark: 'ЧОБОТИ' },
};

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
