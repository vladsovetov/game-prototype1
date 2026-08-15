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
      wake:{title:`Це ${state.character.name}.`,action:'Прокинутися'}, move:{title:'Поруч щось потребує уваги.',action:'Ідіть до робочої позначки',key:'WASD'}, gift:{title:'Огляньте несправність.',action:`Застосуйте «${gift}»`,key:'F'}, clue:{title:'Перший етап роботи завершено.',action:'Продовжити'},
      resonate:atResonance?{title:'Польовий стіл з іншим інструментом.',action:`Взяти «${borrowed}»`,key:'E'}:{title:'Робота ще не завершена.',action:`Знайдіть польовий стіл: «${borrowed}»`,key:'WASD'}, combine:{title:`У вас є «${borrowed}».`,action:'Поверніться й завершіть ремонт',key:'F'}, recovered:{title:'Об’єкт відновлено.',action:'Продовжити'}, plant:{title:'Ви отримали важливу знахідку.',action:'Збережіть її в притулку',key:'E'}, remember:{title:'Перше відкриття завершене.',action:'Продовжити'}, personalize:{title:`У ${state.character.name} є перше відкриття.`,action:'Налаштуйте персонажа'}, done:{title:'Місцевість відкрита.',action:'Продовжуйте польову роботу'},
    };
    return legacy[step];
  }
  const copy: Record<TutorialStep, {title:string;action:string;key?:string}> = {
    wake:{title:`Це ${state.character.name}.`,action:'Прокинутися'},
    move:{title:'Загублений спогад зовсім поруч.',action:'Знайдіть залитий дощем дороговказ',key:'WASD'},
    gift:{title:'Його слова стерті.',action:`Посвітіть інструментом «${gift}»`,key:'F'},
    clue:{title:'Повернулася підказка.',action:'Завершіть спогад'},
    resonate:atResonance?{title:'Це польовий стіл із ремонтним набором.',action:'Взяти ремонтний набір',key:'E'}:{title:`Покажчик називає «${storyFor(state).worldName}», але він зламаний.`,action:'Знайдіть польовий стіл із ремонтним набором',key:'WASD'},
    combine:{title:'У вас є ремонтний набір.',action:'Поверніться й полагодьте покажчик',key:'F'},
    recovered:{title:'Спогад відновлено.',action:'Віднесіть його додому'}, plant:{title:'Відновлений дороговказ пішов за вами.',action:'Посадіть дороговказ',key:'E'}, remember:{title:'Спогад став цілим.',action:'Вирішіть, що він означає'}, personalize:{title:`У ${state.character.name} є перший спогад.`,action:'Зробіть персонажа своїм'}, done:{title:'Галявина відкрита.',action:'Ідіть за тим, що вас кличе'},
  };
  return copy[step];
}
