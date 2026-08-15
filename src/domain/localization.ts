import { BURDENS, GIFTS, QUIRKS } from './catalog';
import { createWovenStory } from './story';
import type { GameState } from './types';
import { generatedDescription } from './character';
import type { BodyId, MaterialId } from './types';

const LEGACY_SUBJECTS: Record<string, string> = {
  'remembers vanished roads': 'пам’ятає зниклі дороги',
  'collects rain that never fell': 'збирає дощ, якого ніколи не було',
  'sings to sleeping doorways': 'співає сонним дверям',
  'keeps promises in tiny jars': 'зберігає обіцянки в крихітних баночках',
};
const LEGACY_NAMES: Record<string, string> = { Morrow:'Морроу', Pip:'Піп', Sable:'Сейбл', Luma:'Лума', Tatter:'Клаптик', Nim:'Нім' };
const LEGACY_DISCOVERIES: Record<string, string> = {
  'Silent Stone → Humming Stone':'Мовчазний камінь → Наспівний камінь',
  'Humming Stone → Singing Tree':'Наспівний камінь → Співоче дерево',
  'Covered Sign → Remembered Sign':'Закритий дороговказ → Пригаданий дороговказ',
  'Remembered Sign → Restored Waypost':'Пригаданий дороговказ → Відновлений дороговказ',
  'Dry Pool → Clear Pool':'Сухий ставок → Чистий ставок',
  'Clear Pool → Whispering Pool':'Чистий ставок → Шепітливий ставок',
  'Tangled Root → Root Arch':'Сплутане коріння → Коренева арка',
  'Root Arch → Hidden Door':'Коренева арка → Потаємні двері',
  'Sleepy Bell → Rain Bell':'Сонний дзвін → Дощовий дзвін',
  'Folded Moth → Paper Flock':'Складена міль → Паперова зграя',
  'Blank Moon → Named Moon':'Безіменний місяць → Названий місяць',
  'Waiting Garden → Lantern Garden':'Сад, що чекає → Сад ліхтарів',
};
const LEGACY_MEMORY_DETAILS: Record<string, string> = {
  'A family they chose':'Обрана родина',
  'A patient friend':'Терплячий друг',
  'They kept it burning for themself':'Вогонь підтримували для себе',
};

function builtInDescription(description: string) {
  const match = /^A (porcelain|moss|paper|starlight) (fox|moth|bird|wisp) that (.+)\.$/.exec(description);
  const subject = match?.[3] ? LEGACY_SUBJECTS[match[3]] : undefined;
  return subject ? generatedDescription(match![2] as BodyId, match![1] as MaterialId, subject) : undefined;
}

function storyIsEnglish(state: GameState) {
  const arc = state.storyArc;
  if (!arc) return false;
  const copy = [arc.worldName,arc.premise,arc.question,arc.firstClue,arc.recovered,arc.ending.title,arc.ending.story,...Object.values(arc.chapters).flatMap((chapter)=>[chapter.title,chapter.keepsake,chapter.story])].join(' ');
  return /\b(the|and|was|were|road|memory|home|keeper|meadow|story|light|traveler|place|storm|who)\b/i.test(copy);
}

export function localizeState(state: GameState): GameState {
  const description = builtInDescription(state.character.description);
  const character = {
    ...state.character,
    name: description ? (LEGACY_NAMES[state.character.name] ?? state.character.name) : state.character.name,
    description: description ?? state.character.description,
    gift: GIFTS[state.character.gift.id],
    burden: BURDENS[state.character.burden.id],
    quirk: QUIRKS[state.character.quirk.id],
  };
  const seed = state.worldSeed ?? state.storyArc?.seed ?? 0;
  const memoryDetails = state.memoryDetails ? Object.fromEntries(Object.entries(state.memoryDetails).map(([key,value])=>[key,LEGACY_MEMORY_DETAILS[value]??value])) : state.memoryDetails;
  return { ...state, character, memoryDetails, discoveries:state.discoveries.map((item)=>LEGACY_DISCOVERIES[item]??item), storyArc:storyIsEnglish(state)?createWovenStory(character,seed):state.storyArc };
}
