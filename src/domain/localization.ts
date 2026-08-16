import { BURDENS, GIFTS, QUIRKS } from './catalog';
import type { GameState } from './types';
import { generatedDescription } from './character';
import { gearForDirection } from './equipment';
import { localizeExpedition, localizeReports } from './expedition';
import { localizeRadio } from './radio';
import { localizeRelics } from './relics';
import { beatForExpedition, colorNarrative, ensureSeason } from './season';
import { createRunDirection } from './run-direction';
import type { BodyId, MaterialId } from './types';
import { getActiveLocale, type Locale } from '../i18n/locale';
import { localizeDiscovery } from './world';

const NAME_SETS: Record<Locale, readonly string[]> = {
  uk: ['Морроу', 'Піп', 'Сейбл', 'Лума', 'Клаптик', 'Нім'],
  en: ['Morrow', 'Pip', 'Sable', 'Luma', 'Tatter', 'Nim'],
  ru: ['Морроу', 'Пип', 'Сейбл', 'Лума', 'Лоскут', 'Ним'],
};
const SUBJECTS: Record<Locale, readonly string[]> = {
  uk: ['пам’ятає зниклі дороги', 'збирає дощ, якого ніколи не було', 'співає сонним дверям', 'зберігає обіцянки в крихітних баночках'],
  en: ['remembers vanished roads', 'collects rain that never fell', 'sings to sleeping doorways', 'keeps promises in tiny jars'],
  ru: ['помнит исчезнувшие дороги', 'собирает дождь, которого никогда не было', 'поёт сонным дверям', 'хранит обещания в крошечных банках'],
};
const DESCRIPTION_PATTERNS: Array<{ locale: Locale; pattern: RegExp }> = [
  { locale: 'en', pattern: /^(?:A )?([Pp]orcelain|[Mm]oss|[Pp]aper|[Ss]tarlight) (fox|moth|bird|wisp) that (.+)\.$/ },
  { locale: 'uk', pattern: /^(Порцелянова|Мохова|Паперова|Зоряна|Порцеляновий|Моховий|Паперовий|Зоряний) (лисиця|міль|птах|вогник), що (.+)\.$/ },
  { locale: 'ru', pattern: /^(Фарфоровая|Моховая|Бумажная|Звёздная|Фарфоровый|Моховой|Бумажный|Звёздный) (лиса|мотылёк|птица|огонёк), который (.+)\.$/ },
];
const BODY_BY_WORD: Record<string, BodyId> = {
  fox: 'fox', moth: 'moth', bird: 'bird', wisp: 'wisp',
  лисиця: 'fox', міль: 'moth', птах: 'bird', вогник: 'wisp',
  лиса: 'fox', мотылёк: 'moth', птица: 'bird', огонёк: 'wisp',
};
const MATERIAL_BY_WORD: Record<string, MaterialId> = {
  porcelain: 'porcelain', moss: 'moss', paper: 'paper', starlight: 'starlight',
  Porcelain: 'porcelain', Moss: 'moss', Paper: 'paper', Starlight: 'starlight',
  Порцелянова: 'porcelain', Мохова: 'moss', Паперова: 'paper', Зоряна: 'starlight',
  Порцеляновий: 'porcelain', Моховий: 'moss', Паперовий: 'paper', Зоряний: 'starlight',
  Фарфоровая: 'porcelain', Моховая: 'moss', Бумажная: 'paper', Звёздная: 'starlight',
  Фарфоровый: 'porcelain', Моховой: 'moss', Бумажный: 'paper', Звёздный: 'starlight',
};
const DISCOVERIES: Record<string, string> = {
  'Silent Stone → Humming Stone': 'Мовчазний камінь → Наспівний камінь',
  'Humming Stone → Singing Tree': 'Наспівний камінь → Співоче дерево',
  'Covered Sign → Remembered Sign': 'Закритий дороговказ → Пригаданий дороговказ',
  'Remembered Sign → Restored Waypost': 'Пригаданий дороговказ → Відновлений дороговказ',
  'Dry Pool → Clear Pool': 'Сухий ставок → Чистий ставок',
  'Clear Pool → Whispering Pool': 'Чистий ставок → Шепітливий ставок',
  'Tangled Root → Root Arch': 'Сплутане коріння → Коренева арка',
  'Root Arch → Hidden Door': 'Коренева арка → Потаємні двері',
  'Sleepy Bell → Rain Bell': 'Сонний дзвін → Дощовий дзвін',
  'Folded Moth → Paper Flock': 'Складена міль → Паперова зграя',
  'Blank Moon → Named Moon': 'Безіменний місяць → Названий місяць',
  'Waiting Garden → Lantern Garden': 'Сад, що чекає → Сад ліхтарів',
};

const MEMORY_CHOICES: Record<string, 'chosenFamily' | 'patientFriend' | 'keptForSelf'> = {
  'A family they chose': 'chosenFamily', 'Обрана родина': 'chosenFamily', 'Выбранная семья': 'chosenFamily',
  'A patient friend': 'patientFriend', 'Терплячий друг': 'patientFriend', 'Терпеливый друг': 'patientFriend',
  'They kept it burning for themself': 'keptForSelf', 'Вогонь підтримували для себе': 'keptForSelf', 'Огонь поддерживали для себя': 'keptForSelf',
};
const MEMORY_CHOICE_COPY: Record<Locale, Record<'chosenFamily' | 'patientFriend' | 'keptForSelf', string>> = {
  uk: { chosenFamily: 'Обрана родина', patientFriend: 'Терплячий друг', keptForSelf: 'Вогонь підтримували для себе' },
  en: { chosenFamily: 'A family they chose', patientFriend: 'A patient friend', keptForSelf: 'They kept it burning for themself' },
  ru: { chosenFamily: 'Выбранная семья', patientFriend: 'Терпеливый друг', keptForSelf: 'Огонь поддерживали для себя' },
};

function generatedNameIndex(name: string) {
  for (const names of Object.values(NAME_SETS)) {
    const index = names.indexOf(name);
    if (index >= 0) return index;
  }
}

function builtInDescription(description: string, locale: Locale) {
  for (const { pattern } of DESCRIPTION_PATTERNS) {
    const match = pattern.exec(description);
    if (!match) continue;
    const material = MATERIAL_BY_WORD[match[1]!];
    const body = BODY_BY_WORD[match[2]!];
    const subjectIndex = Object.values(SUBJECTS).map((list) => list.indexOf(match[3]!)).find((index) => index >= 0);
    if (!material || !body || subjectIndex === undefined) continue;
    return generatedDescription(body, material, SUBJECTS[locale][subjectIndex]!, locale);
  }
}

export function localizeState(state: GameState): GameState {
  const locale = getActiveLocale();
  const description = builtInDescription(state.character.description, locale);
  const generatedIndex = generatedNameIndex(state.character.name);
  const character = {
    ...state.character,
    name: description && generatedIndex !== undefined ? NAME_SETS[locale][generatedIndex]! : state.character.name,
    description: description ?? state.character.description,
    gift: GIFTS[state.character.gift.id],
    burden: BURDENS[state.character.burden.id],
    quirk: QUIRKS[state.character.quirk.id],
  };
  const seed = state.worldSeed ?? state.storyArc?.seed ?? 0;
  const gear = state.wardrobe && state.equipped ? { wardrobe: state.wardrobe, equipped: state.equipped } : gearForDirection(state.storyArc?.direction ?? createRunDirection(seed));
  const memoryDetails = state.memoryDetails
    ? Object.fromEntries(Object.entries(state.memoryDetails).map(([key, value]) => {
      const choice = MEMORY_CHOICES[value];
      return [key, choice ? MEMORY_CHOICE_COPY[locale][choice] : value];
    }))
    : state.memoryDetails;
  const expeditionMeta = state.expeditionMeta ?? { completedContracts: 0, supplies: 0, insight: 0, rareFinds: [], builtProjects: [], reports: [] };
  const reports = localizeReports(expeditionMeta.reports);
  const fingerprints = reports.flatMap((report) => report.narrativeFingerprint ? [report.narrativeFingerprint] : []);
  const localized = ensureSeason({
    ...state,
    ...gear,
    character,
    memoryDetails,
    expeditionMeta: { ...expeditionMeta, reports },
    expedition: state.expedition ? localizeExpedition(state.expedition, fingerprints) : state.expedition,
    radio: localizeRadio(state.radio, locale),
    relics: localizeRelics(state.relics, locale),
    discoveries: state.discoveries.map((item) => {
      const current = localizeDiscovery(item);
      if (current !== item) return current;
      const legacy = DISCOVERIES[item];
      return legacy ? localizeDiscovery(legacy) : item;
    }),
  });
  const beat = localized.expedition && localized.season ? beatForExpedition(localized.season, localized.expedition.id) : undefined;
  if (localized.expedition && localized.season && beat && localized.expedition.narrative.source === 'fallback') {
    return { ...localized, expedition: { ...localized.expedition, narrative: colorNarrative(localized.expedition.narrative, localized.season, beat) } };
  }
  return localized;
}
