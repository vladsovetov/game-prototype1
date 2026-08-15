import { getActiveLocale, localizedCopy, type Locale } from '../i18n/locale';
import { unlockWearable } from './equipment';
import { beatForExpedition } from './season';
import type { ExpeditionProgress, GameState, Relic, RelicCondition, RelicForm, RelicMaterial, SeasonBeatId, WearableId } from './types';

export const RELIC_COLORS = ['#c47a3a', '#5f7a8a', '#8a6b4a', '#6d7a55', '#7a5a6e', '#b8a06a'] as const;
export const RELIC_FORMS: RelicForm[] = ['hood', 'backpack', 'glasses', 'lantern', 'cloak', 'patches'];
export const RELIC_MATERIALS: RelicMaterial[] = ['copper', 'canvas', 'glass', 'wool', 'oilcloth', 'chalk'];
export const RELIC_CONDITIONS: RelicCondition[] = ['mended', 'weathered', 'new-stitched', 'scorched', 'damp'];
export const RELIC_FORM_WEARABLE: Record<RelicForm, WearableId> = {
  hood: 'field-hood',
  backpack: 'canvas-pack',
  glasses: 'wire-glasses',
  lantern: 'signal-lantern',
  cloak: 'storm-cloak',
  patches: 'route-patches',
};
const FORM_FOR_BEAT: Record<SeasonBeatId, RelicForm> = {
  'strange-signal': 'lantern',
  'first-evidence': 'glasses',
  contradiction: 'patches',
  'choice-consequence': 'hood',
  source: 'cloak',
  'lasting-decision': 'backpack',
  echo: 'patches',
};

const MATERIAL_NAMES: Record<Locale, Record<RelicMaterial, string>> = {
  uk: { copper: 'мідний', canvas: 'парусиновий', glass: 'скляний', wool: 'вовняний', oilcloth: 'промаслений', chalk: 'крейдяний' },
  en: { copper: 'copper', canvas: 'canvas', glass: 'glass', wool: 'wool', oilcloth: 'oilcloth', chalk: 'chalk' },
  ru: { copper: 'медный', canvas: 'парусиновый', glass: 'стеклянный', wool: 'шерстяной', oilcloth: 'промасленный', chalk: 'меловой' },
};
const FORM_NAMES: Record<Locale, Record<RelicForm, string>> = {
  uk: { hood: 'каптур', backpack: 'наплічник', glasses: 'окуляри', lantern: 'ліхтар', cloak: 'плащ', patches: 'нашивки' },
  en: { hood: 'hood', backpack: 'pack', glasses: 'glasses', lantern: 'lantern', cloak: 'cloak', patches: 'patches' },
  ru: { hood: 'капюшон', backpack: 'рюкзак', glasses: 'очки', lantern: 'фонарь', cloak: 'плащ', patches: 'нашивки' },
};
const CONDITION_NAMES: Record<Locale, Record<RelicCondition, string>> = {
  uk: { mended: 'латаний', weathered: 'вивітрений', 'new-stitched': 'свіжо зшитий', scorched: 'обпалений', damp: 'вологий' },
  en: { mended: 'mended', weathered: 'weathered', 'new-stitched': 'newly stitched', scorched: 'scorched', damp: 'damp' },
  ru: { mended: 'штопаный', weathered: 'выветренный', 'new-stitched': 'свеже сшитый', scorched: 'обожжённый', damp: 'влажный' },
};
const SYMBOLS: Record<Locale, readonly string[]> = {
  uk: ['перевернутий знак', 'крапля', 'кільце кабелю', 'стрілка годинника', 'станційні двері', 'тихий позивний'],
  en: ['an inverted mark', 'a drop', 'a cable ring', 'a clock hand', 'a station door', 'a quiet call sign'],
  ru: ['перевёрнутый знак', 'капля', 'кольцо кабеля', 'стрелка часов', 'станционная дверь', 'тихий позывной'],
};
const STORIES: Record<Locale, readonly string[]> = {
  uk: [
    'Зібрано після експедиції «{title}»: {condition} {material} {form} із символом «{symbol}». Сили не додає — лише пам’ять про цю подію.',
    'Польова річ із маршруту «{title}». Матеріал {material}, стан {condition}, знак {symbol}. Вигляд складено з перевірених деталей.',
  ],
  en: [
    'Packed after the expedition “{title}”: a {condition} {material} {form} marked with {symbol}. It adds no strength — only the memory of that event.',
    'A field thing from the route “{title}”. Material {material}, condition {condition}, mark {symbol}. The look is assembled from trusted parts.',
  ],
  ru: [
    'Собрано после экспедиции «{title}»: {condition} {material} {form} со знаком «{symbol}». Силы не даёт — только память об этом событии.',
    'Полевая вещь с маршрута «{title}». Материал {material}, состояние {condition}, знак {symbol}. Вид собран из проверенных деталей.',
  ],
};

export function clampRelicColor(value: string, seed: number) {
  const normalized = value.trim().toLowerCase();
  return RELIC_COLORS.includes(normalized as typeof RELIC_COLORS[number]) ? normalized : RELIC_COLORS[(seed >>> 0) % RELIC_COLORS.length]!;
}

export function wearableForForm(form: RelicForm): WearableId {
  return RELIC_FORM_WEARABLE[form];
}

export function relicTintFor(state: Pick<GameState, 'relics'>, wearableId: WearableId, fallback: string) {
  const relics = state.relics ?? [];
  for (let index = relics.length - 1; index >= 0; index--) {
    if (relics[index]!.wearableId === wearableId) return relics[index]!.color;
  }
  return fallback;
}

function fill(template: string, values: Record<string, string>) {
  let result = template;
  for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
  return result;
}

export function fallbackRelic(state: GameState, run: Pick<ExpeditionProgress, 'id' | 'seed' | 'narrative'>, now = Date.now()): Relic {
  const locale = getActiveLocale();
  const beat = beatForExpedition(state.season, run.id);
  const form = beat ? FORM_FOR_BEAT[beat.id] : RELIC_FORMS[run.seed % RELIC_FORMS.length]!;
  const material = RELIC_MATERIALS[(run.seed + 3) % RELIC_MATERIALS.length]!;
  const condition = RELIC_CONDITIONS[(run.seed + 2) % RELIC_CONDITIONS.length]!;
  const symbolKey = String((run.seed + 1) % SYMBOLS.uk.length);
  const storyKey = String(run.seed % STORIES.uk.length);
  const symbol = localizedCopy(SYMBOLS, locale)[Number(symbolKey)]!;
  const materialName = localizedCopy(MATERIAL_NAMES, locale)[material];
  const formName = localizedCopy(FORM_NAMES, locale)[form];
  const conditionName = localizedCopy(CONDITION_NAMES, locale)[condition];
  return {
    id: `relic-${run.id}-${now}`,
    name: `${materialName} ${formName}`,
    story: fill(localizedCopy(STORIES, locale)[Number(storyKey)]!, { title: run.narrative.title, condition: conditionName, material: materialName, form: formName, symbol }),
    material,
    color: RELIC_COLORS[run.seed % RELIC_COLORS.length]!,
    symbol,
    condition,
    eventId: run.id,
    eventTitle: run.narrative.title,
    form,
    wearableId: wearableForForm(form),
    source: 'fallback',
    nameKey: `${material}:${form}`,
    storyKey,
    symbolKey,
  };
}

export function awardExpeditionRelic(state: GameState, run: Pick<ExpeditionProgress, 'id' | 'seed' | 'narrative'>, now = Date.now()): GameState {
  if ((state.relics ?? []).some((relic) => relic.eventId === run.id)) return state;
  const relic = fallbackRelic(state, run, now);
  let next: GameState = { ...state, relics: [...(state.relics ?? []), relic] };
  next = unlockWearable(next, relic.wearableId);
  const slot = relic.wearableId === 'canvas-pack' ? 'back' : relic.wearableId === 'field-hood' ? 'head' : relic.wearableId === 'wire-glasses' ? 'face' : relic.wearableId === 'signal-lantern' ? 'hand' : relic.wearableId === 'storm-cloak' ? 'outer' : 'chest';
  if (!next.equipped[slot]) next = { ...next, equipped: { ...next.equipped, [slot]: relic.wearableId } };
  return next;
}

export function replaceLastRelic(state: GameState, relic: Relic): GameState {
  const relics = [...(state.relics ?? [])];
  let index = -1;
  for (let cursor = relics.length - 1; cursor >= 0; cursor--) {
    if (relics[cursor]!.eventId === relic.eventId && relics[cursor]!.source === 'fallback') {
      index = cursor;
      break;
    }
  }
  if (index < 0) return { ...state, relics: [...relics, relic] };
  const previous = relics[index]!;
  relics[index] = { ...relic, id: previous.id, wearableId: wearableForForm(relic.form), eventId: previous.eventId };
  return unlockWearable({ ...state, relics }, relics[index]!.wearableId);
}

export function localizeRelics(relics: Relic[] | undefined, locale = getActiveLocale()): Relic[] | undefined {
  if (!relics) return relics;
  return relics.map((relic) => {
    if (relic.source === 'local-model' || !relic.nameKey || relic.storyKey === undefined || relic.symbolKey === undefined) return relic;
    const [material, form] = relic.nameKey.split(':') as [RelicMaterial, RelicForm];
    const symbol = localizedCopy(SYMBOLS, locale)[Number(relic.symbolKey)] ?? relic.symbol;
    const materialName = localizedCopy(MATERIAL_NAMES, locale)[material] ?? relic.material;
    const formName = localizedCopy(FORM_NAMES, locale)[form] ?? relic.form;
    const conditionName = localizedCopy(CONDITION_NAMES, locale)[relic.condition];
    return {
      ...relic,
      name: `${materialName} ${formName}`,
      symbol,
      story: fill(localizedCopy(STORIES, locale)[Number(relic.storyKey)] ?? relic.story, {
        title: relic.eventTitle ?? relic.name,
        condition: conditionName,
        material: materialName,
        form: formName,
        symbol,
      }),
    };
  });
}

export function relicDirectorNotes(state: GameState, eventId: string) {
  const relic = (state.relics ?? []).find((item) => item.eventId === eventId);
  return {
    eventId,
    form: relic?.form ?? 'lantern',
    allowedForms: RELIC_FORMS.join('|'),
    allowedColors: RELIC_COLORS.join('|'),
  };
}
