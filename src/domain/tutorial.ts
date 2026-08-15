import type { GameState, GiftId, Point, TutorialStep } from './types';
import { ANOMALIES, PLOTS, SHRINES } from './world';

type TutorialEvent =
  | 'wake'
  | 'moved'
  | 'gift-used'
  | 'resonance-borrowed'
  | 'chain-completed'
  | 'seed-planted'
  | 'personalization-dismissed';

const ROUTES: Record<GiftId, { anomalyId: string; borrowedGift: GiftId }> = {
  echo: { anomalyId: 'stone', borrowedGift: 'grow' },
  reveal: { anomalyId: 'sign', borrowedGift: 'mend' },
  mend: { anomalyId: 'pool', borrowedGift: 'echo' },
  grow: { anomalyId: 'root', borrowedGift: 'reveal' },
};

const NEXT: Record<TutorialStep, Partial<Record<TutorialEvent, TutorialStep>>> = {
  wake: { wake: 'move' },
  move: { moved: 'gift' },
  gift: { 'gift-used': 'resonate' },
  resonate: { 'resonance-borrowed': 'combine' },
  combine: { 'chain-completed': 'plant' },
  plant: { 'seed-planted': 'personalize' },
  personalize: { 'personalization-dismissed': 'done' },
  done: {},
};

export function prepareTutorial(state: GameState): GameState {
  const route = ROUTES[state.character.gift.id];
  const anomaly = ANOMALIES.find((item) => item.id === route.anomalyId)!;
  const player = { x: anomaly.position.x - 250, y: anomaly.position.y + 70 };
  return {
    ...state,
    player,
    tutorial: {
      step: 'wake',
      targetAnomalyId: route.anomalyId,
      borrowedGift: route.borrowedGift,
      start: player,
    },
  };
}

export function advanceTutorial(state: GameState, event: TutorialEvent): GameState {
  if (!state.tutorial) return state;
  const step = NEXT[state.tutorial.step][event];
  if (!step) return state;
  const next = { ...state, tutorial: { ...state.tutorial, step } };
  if (event === 'chain-completed') {
    const plot = PLOTS[0]!;
    next.player = { x: plot.position.x + 120, y: plot.position.y + 60 };
  }
  return next;
}

export function tutorialTarget(state: GameState): Point | undefined {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.step === 'wake' || tutorial.step === 'personalize' || tutorial.step === 'done') return;
  if (tutorial.step === 'resonate') return SHRINES.find((item) => item.gift === tutorial.borrowedGift)?.position;
  if (tutorial.step === 'plant') return PLOTS[0]?.position;
  return ANOMALIES.find((item) => item.id === tutorial.targetAnomalyId)?.position;
}

export function tutorialObjective(state: GameState): { title: string; action: string; key?: string } {
  const step = state.tutorial?.step ?? 'done';
  const gift = state.character.gift.name;
  const borrowed = state.tutorial?.borrowedGift ?? 'echo';
  const copy: Record<TutorialStep, { title: string; action: string; key?: string }> = {
    wake: { title: `This is ${state.character.name}.`, action: 'Wake up' },
    move: { title: 'Something is glowing nearby.', action: 'Move toward the light', key: 'WASD' },
    gift: { title: `The world notices ${state.character.name}.`, action: `Use ${gift}`, key: 'F' },
    resonate: { title: 'It changed—but the memory is unfinished.', action: `Follow the ${borrowed} lights`, key: 'WASD' },
    combine: { title: `You are carrying ${borrowed}.`, action: 'Return and use it', key: 'F' },
    plant: { title: 'A Memory Seed followed you home.', action: 'Plant the memory', key: 'E' },
    personalize: { title: `${state.character.name} has a first memory.`, action: 'Make them yours' },
    done: { title: 'The meadow is open.', action: 'Follow whatever calls to you' },
  };
  return copy[step];
}
