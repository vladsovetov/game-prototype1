import type { GameState, Point, TutorialStep } from './types';
import { GIFTS } from './catalog';
import { distance, worldFor } from './world';
import { storyFor } from './story';

type TutorialEvent =
  | 'wake'
  | 'moved'
  | 'gift-used'
  | 'clue-read'
  | 'resonance-borrowed'
  | 'chain-completed'
  | 'memory-read'
  | 'seed-planted'
  | 'memory-shaped'
  | 'personalization-dismissed';

const NEXT: Record<TutorialStep, Partial<Record<TutorialEvent, TutorialStep>>> = {
  wake: { wake: 'move' },
  move: { moved: 'gift' },
  gift: { 'gift-used': 'clue' },
  clue: { 'clue-read': 'resonate' },
  resonate: { 'resonance-borrowed': 'combine' },
  combine: { 'chain-completed': 'recovered' },
  recovered: { 'memory-read': 'plant' },
  plant: { 'seed-planted': 'remember' },
  remember: { 'memory-shaped': 'personalize' },
  personalize: { 'personalization-dismissed': 'done' },
  done: {},
};

export function prepareTutorial(state: GameState): GameState {
  const route = { anomalyId: 'sign', borrowedGift: 'mend' as const };
  const anomaly = worldFor(state).anomalies.find((item) => item.id === route.anomalyId)!;
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
    const plot = worldFor(state).plots[0]!;
    next.player = { x: plot.position.x + 70, y: plot.position.y + 35 };
  }
  return next;
}

export function tutorialTarget(state: GameState): Point | undefined {
  const tutorial = state.tutorial;
  if (!tutorial || tutorial.step === 'wake' || tutorial.step === 'clue' || tutorial.step === 'recovered' || tutorial.step === 'remember' || tutorial.step === 'personalize' || tutorial.step === 'done') return;
  const world = worldFor(state);
  if (tutorial.step === 'resonate') return world.shrines.find((item) => item.gift === tutorial.borrowedGift)?.position;
  if (tutorial.step === 'plant') return world.plots[0]?.position;
  return world.anomalies.find((item) => item.id === tutorial.targetAnomalyId)?.position;
}

export function tutorialObjective(state: GameState): { title: string; action: string; key?: string } {
  const step = state.tutorial?.step ?? 'done';
  const gift = state.character.gift.name;
  const borrowed = state.tutorial?.borrowedGift ?? 'echo';
  const target = tutorialTarget(state);
  const atResonance = step === 'resonate' && target && distance(state.player, target) <= 160;
  if (state.tutorial && state.tutorial.targetAnomalyId !== 'sign') {
    const legacy: Record<TutorialStep, { title: string; action: string; key?: string }> = {
      wake: { title: `This is ${state.character.name}.`, action: 'Wake up' },
      move: { title: 'Something is glowing nearby.', action: 'Move toward the light', key: 'WASD' },
      gift: { title: `The world notices ${state.character.name}.`, action: `Use ${gift}`, key: 'F' },
      clue: { title: 'A first change is complete.', action: 'Continue' },
      resonate: atResonance
        ? { title: 'This place can lend another Gift.', action: `Borrow ${borrowed[0]!.toUpperCase()}${borrowed.slice(1)}`, key: 'E' }
        : { title: 'The change is unfinished.', action: `Follow the ${borrowed} lights`, key: 'WASD' },
      combine: { title: `You are carrying ${borrowed}.`, action: 'Return and use it', key: 'F' },
      recovered: { title: 'The discovery is complete.', action: 'Continue' },
      plant: { title: 'A keepsake followed you home.', action: 'Plant the keepsake', key: 'E' },
      remember: { title: 'The first discovery is complete.', action: 'Continue' },
      personalize: { title: `${state.character.name} has a first discovery.`, action: 'Make them yours' },
      done: { title: 'The meadow is open.', action: 'Follow whatever calls to you' },
    };
    return legacy[step];
  }
  const copy: Record<TutorialStep, { title: string; action: string; key?: string }> = {
    wake: { title: `This is ${state.character.name}.`, action: 'Wake up' },
    move: { title: 'A lost memory is close.', action: 'Find the rain-covered sign', key: 'WASD' },
    gift: { title: 'Its words have been erased.', action: `Use ${gift} to uncover them`, key: 'F' },
    clue: { title: 'A clue returned.', action: 'Finish the memory' },
    resonate: atResonance
      ? { title: 'This place can lend a restoring Gift.', action: 'Borrow Mend', key: 'E' }
      : { title: `The sign names “${storyFor(state).worldName},” but it is broken.`, action: `Find ${borrowed[0]!.toUpperCase()}${borrowed.slice(1)}`, key: 'WASD' },
    combine: { title: 'You are carrying Mend.', action: 'Return and restore the sign', key: 'F' },
    recovered: { title: 'The memory is recovered.', action: 'Bring it home' },
    plant: { title: 'The restored Waypost came home with you.', action: 'Plant the Waypost', key: 'E' },
    remember: { title: 'The memory is whole.', action: 'Decide what it means' },
    personalize: { title: `${state.character.name} has a first memory.`, action: 'Make them yours' },
    done: { title: 'The meadow is open.', action: 'Follow whatever calls to you' },
  };
  return copy[step];
}
