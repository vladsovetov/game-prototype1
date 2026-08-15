import type { GameState, Point, TutorialStep } from './types';
import { GIFTS } from './catalog';
import { distance, worldFor } from './world';
import { storyFor } from './story';

type TutorialEvent = 'wake' | 'moved' | 'gift-used' | 'clue-read' | 'resonance-borrowed' | 'chain-completed' | 'memory-read' | 'seed-planted' | 'memory-shaped' | 'personalization-dismissed';
const NEXT: Record<TutorialStep, Partial<Record<TutorialEvent, TutorialStep>>> = {
  wake:{wake:'move'}, move:{moved:'gift'}, gift:{'gift-used':'clue'}, clue:{'clue-read':'resonate'}, resonate:{'resonance-borrowed':'combine'}, combine:{'chain-completed':'recovered'}, recovered:{'memory-read':'plant'}, plant:{'seed-planted':'remember'}, remember:{'memory-shaped':'personalize'}, personalize:{'personalization-dismissed':'done'}, done:{},
};

export function prepareTutorial(state: GameState): GameState {
  const route = { anomalyId: 'sign', borrowedGift: 'mend' as const };
  const anomaly = worldFor(state).anomalies.find((item) => item.id === route.anomalyId)!;
  const player = { x: anomaly.position.x - 250, y: anomaly.position.y + 70 };
  return { ...state, character: { ...state.character, gift: GIFTS.reveal }, player, tutorial: { step:'wake', targetAnomalyId:route.anomalyId, borrowedGift:route.borrowedGift, start:player } };
}

export function advanceTutorial(state: GameState, event: TutorialEvent): GameState {
  if (!state.tutorial) return state;
  const step = NEXT[state.tutorial.step][event];
  if (!step) return state;
  const next = { ...state, tutorial: { ...state.tutorial, step } };
  if (event === 'chain-completed') { const plot = worldFor(state).plots[0]!; next.player = { x:plot.position.x+70, y:plot.position.y+35 }; }
  return next;
}

export function tutorialTarget(state: GameState): Point | undefined {
  const tutorial = state.tutorial;
  if (!tutorial || ['wake','clue','recovered','remember','personalize','done'].includes(tutorial.step)) return;
  const world = worldFor(state);
  if (tutorial.step === 'resonate') return world.shrines.find((item) => item.gift === tutorial.borrowedGift)?.position;
  if (tutorial.step === 'plant') return world.plots[0]?.position;
  return world.anomalies.find((item) => item.id === tutorial.targetAnomalyId)?.position;
}

export function tutorialObjective(state: GameState): { title:string; action:string; key?:string } {
  const step = state.tutorial?.step ?? 'done';
  const gift = state.character.gift.name;
  const borrowedId = state.tutorial?.borrowedGift ?? 'echo';
  const borrowed = GIFTS[borrowedId].name;
  const target = tutorialTarget(state);
  const atResonance = step === 'resonate' && target && distance(state.player, target) <= 160;
  if (state.tutorial && state.tutorial.targetAnomalyId !== 'sign') {
    const legacy: Record<TutorialStep, {title:string;action:string;key?:string}> = {
      wake:{title:`Це ${state.character.name}.`,action:'Прокинутися'}, move:{title:'Поруч щось світиться.',action:'Ідіть до світла',key:'WASD'}, gift:{title:`Світ помічає ${state.character.name}.`,action:`Застосуйте Дар «${gift}»`,key:'F'}, clue:{title:'Перша зміна завершена.',action:'Продовжити'},
      resonate:atResonance?{title:'Це місце може позичити інший Дар.',action:`Позичити «${borrowed}»`,key:'E'}:{title:'Зміна ще не завершена.',action:`Ідіть за вогнями Дару «${borrowed}»`,key:'WASD'}, combine:{title:`У вас є Дар «${borrowed}».`,action:'Поверніться й застосуйте його',key:'F'}, recovered:{title:'Відкриття завершене.',action:'Продовжити'}, plant:{title:'Пам’ятка пішла за вами додому.',action:'Посадіть пам’ятку',key:'E'}, remember:{title:'Перше відкриття завершене.',action:'Продовжити'}, personalize:{title:`У ${state.character.name} є перше відкриття.`,action:'Зробіть персонажа своїм'}, done:{title:'Галявина відкрита.',action:'Ідіть за тим, що вас кличе'},
    };
    return legacy[step];
  }
  const copy: Record<TutorialStep, {title:string;action:string;key?:string}> = {
    wake:{title:`Це ${state.character.name}.`,action:'Прокинутися'},
    move:{title:'Загублений спогад зовсім поруч.',action:'Знайдіть залитий дощем дороговказ',key:'WASD'},
    gift:{title:'Його слова стерті.',action:`Застосуйте Дар «${gift}», щоб побачити їх`,key:'F'},
    clue:{title:'Повернулася підказка.',action:'Завершіть спогад'},
    resonate:atResonance?{title:'Це місце може позичити Дар відновлення.',action:'Позичити «Відновлення»',key:'E'}:{title:`Дороговказ називає «${storyFor(state).worldName}», але він зламаний.`,action:'Знайдіть Дар «Відновлення»',key:'WASD'},
    combine:{title:'У вас є Дар «Відновлення».',action:'Поверніться й відновіть дороговказ',key:'F'},
    recovered:{title:'Спогад відновлено.',action:'Віднесіть його додому'}, plant:{title:'Відновлений дороговказ пішов за вами.',action:'Посадіть дороговказ',key:'E'}, remember:{title:'Спогад став цілим.',action:'Вирішіть, що він означає'}, personalize:{title:`У ${state.character.name} є перший спогад.`,action:'Зробіть персонажа своїм'}, done:{title:'Галявина відкрита.',action:'Ідіть за тим, що вас кличе'},
  };
  return copy[step];
}
