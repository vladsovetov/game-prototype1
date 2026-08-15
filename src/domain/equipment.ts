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
    'field-hood': { id: 'field-hood', name: 'Польовий каптур', description: 'Каптур зібрано з перевіреної форми; колір і знак приходять з історії маршруту.', slot: 'head', mark: 'КАПТУР' },
    'wire-glasses': { id: 'wire-glasses', name: 'Дротяні окуляри', description: 'Окуляри не змінюють зір у правилах гри — лише вигляд і пам’ять про подію.', slot: 'face', mark: 'ОКУЛЯРИ' },
    'storm-cloak': { id: 'storm-cloak', name: 'Штормовий плащ', description: 'Плащ із довіреного крою. Не дає сили, лише характер сезону.', slot: 'outer', mark: 'ПЛАЩ' },
    'signal-lantern': { id: 'signal-lantern', name: 'Сигнальний ліхтар', description: 'Ліхтар у руці. Світло косметичне: маршрути й інструменти лишаються своїми.', slot: 'hand', mark: 'ЛІХТАР' },
    'route-patches': { id: 'route-patches', name: 'Нашивки маршруту', description: 'Нашивки на грудях збираються з перевірених клаптиків після події.', slot: 'chest', mark: 'НАШИВКИ' },
  },
  en: {
    'rain-hat': { id: 'rain-hat', name: 'Rain hat', description: 'Keeps rain out of your eyes while you work.', slot: 'head', mark: 'HAT' },
    'wool-scarf': { id: 'wool-scarf', name: 'Wool scarf', description: 'A warm scarf with a field mark sewn in.', slot: 'neck', mark: 'SCARF' },
    'canvas-pack': { id: 'canvas-pack', name: 'Canvas pack', description: 'A sturdy pack for maps, food, and small repairs.', slot: 'back', mark: 'PACK' },
    'rubber-boots': { id: 'rubber-boots', name: 'Rubber boots', description: 'Let you ignore puddles and shallow canals.', slot: 'feet', mark: 'BOOTS' },
    'field-hood': { id: 'field-hood', name: 'Field hood', description: 'A hood from a trusted shape; color and mark come from the route’s story.', slot: 'head', mark: 'HOOD' },
    'wire-glasses': { id: 'wire-glasses', name: 'Wire glasses', description: 'Glasses do not change sight in the rules — only the look and the memory of an event.', slot: 'face', mark: 'GLASSES' },
    'storm-cloak': { id: 'storm-cloak', name: 'Storm cloak', description: 'A cloak of a trusted cut. It adds no strength, only the season’s character.', slot: 'outer', mark: 'CLOAK' },
    'signal-lantern': { id: 'signal-lantern', name: 'Signal lantern', description: 'A lantern in the hand. The glow is cosmetic: routes and tools stay their own.', slot: 'hand', mark: 'LANTERN' },
    'route-patches': { id: 'route-patches', name: 'Route patches', description: 'Chest patches assembled from trusted scraps after an event.', slot: 'chest', mark: 'PATCHES' },
  },
  ru: {
    'rain-hat': { id: 'rain-hat', name: 'Дождевая шляпа', description: 'Не даёт дождю заливать глаза во время работы.', slot: 'head', mark: 'ШЛЯПА' },
    'wool-scarf': { id: 'wool-scarf', name: 'Шерстяной шарф', description: 'Тёплый шарф с пришитой полевой меткой.', slot: 'neck', mark: 'ШАРФ' },
    'canvas-pack': { id: 'canvas-pack', name: 'Парусиновый рюкзак', description: 'Прочный рюкзак для карт, еды и мелкого ремонта.', slot: 'back', mark: 'РЮКЗАК' },
    'rubber-boots': { id: 'rubber-boots', name: 'Резиновые сапоги', description: 'Позволяют не бояться луж и мелких каналов.', slot: 'feet', mark: 'САПОГИ' },
    'field-hood': { id: 'field-hood', name: 'Полевой капюшон', description: 'Капюшон собран из проверенной формы; цвет и знак приходят из истории маршрута.', slot: 'head', mark: 'КАПЮШОН' },
    'wire-glasses': { id: 'wire-glasses', name: 'Проволочные очки', description: 'Очки не меняют зрение в правилах игры — только вид и память о событии.', slot: 'face', mark: 'ОЧКИ' },
    'storm-cloak': { id: 'storm-cloak', name: 'Штормовой плащ', description: 'Плащ доверенного кроя. Не даёт силы, только характер сезона.', slot: 'outer', mark: 'ПЛАЩ' },
    'signal-lantern': { id: 'signal-lantern', name: 'Сигнальный фонарь', description: 'Фонарь в руке. Свет косметический: маршруты и инструменты остаются своими.', slot: 'hand', mark: 'ФОНАРЬ' },
    'route-patches': { id: 'route-patches', name: 'Нашивки маршрута', description: 'Нашивки на груди собираются из проверенных лоскутов после события.', slot: 'chest', mark: 'НАШИВКИ' },
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
