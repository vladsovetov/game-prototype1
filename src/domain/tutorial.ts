import type { GameState, Point, TutorialStep } from './types';
import { GIFTS } from './catalog';
import { ANOMALIES, distance, PLOTS, SHRINES } from './world';

type TutorialEvent =
  | 'wake'
  | 'moved'
  | 'gift-used'
  | 'resonance-borrowed'
  | 'chain-completed'
  | 'seed-planted'
  | 'memory-shaped'
  | 'personalization-dismissed';

const NEXT: Record<TutorialStep, Partial<Record<TutorialEvent, TutorialStep>>> = {
  wake: { wake: 'move' },
  move: { moved: 'gift' },
  gift: { 'gift-used': 'resonate' },
  resonate: { 'resonance-borrowed': 'combine' },
  combine: { 'chain-completed': 'plant' },
  plant: { 'seed-planted': 'remember' },
  remember: { 'memory-shaped': 'personalize' },
  personalize: { 'personalization-dismissed': 'done' },
  done: {},
};

export function prepareTutorial(state: GameState): GameState {
  const route = { anomalyId: 'sign', borrowedGift: 'mend' as const };
  const anomaly = ANOMALIES.find((item) => item.id === route.anomalyId)!;
  const player = { x: anomaly.position.x - 250, y: anomaly.position.y + 70 };
  return {
    ...state,
    character: { ...state.character, gift: GIFTS.reveal },
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
    next.player = { x: plot.position.x + 70, y: plot.position.y + 35 };
  }
  return next;
}

export function tutorialTarget(state: GameState): Point | undefined {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.step === 'wake' || tutorial.step === 'remember' || tutorial.step === 'personalize' || tutorial.step === 'done') return;
  if (tutorial.step === 'resonate') return SHRINES.find((item) => item.gift === tutorial.borrowedGift)?.position;
  if (tutorial.step === 'plant') return PLOTS[0]?.position;
  return ANOMALIES.find((item) => item.id === tutorial.targetAnomalyId)?.position;
}

export function tutorialObjective(state: GameState): { title: string; action: string; key?: string } {
  const step = state.tutorial?.step ?? 'done';
  const gift = state.character.gift.name;
  const borrowed = state.tutorial?.borrowedGift ?? 'echo';
  const target = tutorialTarget(state);
  const atResonance = step === 'resonate' && target && distance(state.player, target) <= 160;
  const copy: Record<TutorialStep, { title: string; action: string; key?: string }> = {
    wake: { title: `This is ${state.character.name}.`, action: 'Wake up' },
    move: { title: 'A lost memory is close.', action: 'Find the rain-covered sign', key: 'WASD' },
    gift: { title: 'Its words have been erased.', action: `Use ${gift} to uncover them`, key: 'F' },
    resonate: atResonance
      ? { title: 'This place can lend a restoring Gift.', action: 'Borrow Mend', key: 'E' }
      : { title: 'The sign says “Lantern House,” but it is broken.', action: `Find ${borrowed[0]!.toUpperCase()}${borrowed.slice(1)}`, key: 'WASD' },
    combine: { title: 'You are carrying Mend.', action: 'Return and restore the sign', key: 'F' },
    plant: { title: 'The restored Waypost came home with you.', action: 'Plant the Waypost', key: 'E' },
    remember: { title: 'The memory is whole.', action: 'Decide what it means' },
    personalize: { title: `${state.character.name} has a first memory.`, action: 'Make them yours' },
    done: { title: 'The meadow is open.', action: 'Follow whatever calls to you' },
  };
  return copy[step];
}
