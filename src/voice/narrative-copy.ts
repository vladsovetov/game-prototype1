import { t } from '../i18n/messages';
import { storyFor } from '../domain/story';
import { tutorialObjective } from '../domain/tutorial';
import { ROAD_HOME } from '../domain/memory';
import type { GameState, RadioRemark, StoryArc } from '../domain/types';

function joinSpeech(...parts: Array<string | undefined>) {
  return parts.map((part) => part?.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ');
}

function shortPremise(story: StoryArc) {
  const clipped = story.premise.split('. ').slice(0, 2).join('. ');
  return clipped.endsWith('.') ? clipped : `${clipped}.`;
}

export function wakeNarrative(state: GameState) {
  const story = storyFor(state);
  const isRoadHome = !state.tutorial || state.tutorial.targetAnomalyId === 'sign';
  if (!isRoadHome) return joinSpeech(t('wakePurposeDiscovery', { name: state.character.name }), t('followGlow', { gift: state.character.gift.name }));
  return joinSpeech(t('wakePurposeRoad', { name: state.character.name }), shortPremise(story));
}

export function tutorialNarrative(state: GameState) {
  const objective = tutorialObjective(state);
  return joinSpeech(objective.title, objective.action);
}

export function memoryBeatNarrative(title: string, copy: string) {
  return joinSpeech(title, copy);
}

export function chapterNarrative(title: string, story: string) {
  return joinSpeech(title, story);
}

export function endingNarrative(title: string, story: string, nextHint = '') {
  return joinSpeech(title, story, nextHint);
}

export function memoryChoiceNarrative(state: GameState) {
  return joinSpeech(storyFor(state).question ?? ROAD_HOME.question, t('memoryChoiceCopy', { name: state.character.name }));
}

export function radioNarrative(remark: RadioRemark) {
  return remark.text;
}

export function loomNarrative(premise: string) {
  return premise;
}
