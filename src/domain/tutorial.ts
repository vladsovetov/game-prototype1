import { localizedCopy } from '../i18n/locale';
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

type Objective = { title: string; action: string; key?: string };

function roadHomeCopy(state: GameState, atResonance: boolean): Record<TutorialStep, Objective> {
  const name = state.character.name;
  const gift = state.character.gift.name;
  const worldName = storyFor(state).worldName;
  return localizedCopy<Record<TutorialStep, Objective>>({
    uk: {
      wake: { title: `Це ${name}.`, action: 'Прокинутися' },
      move: { title: 'Загублений спогад зовсім поруч.', action: 'Знайдіть залитий дощем дороговказ', key: 'WASD' },
      gift: { title: 'Його слова стерті.', action: `Посвітіть інструментом «${gift}»`, key: 'F' },
      clue: { title: 'Повернулася підказка.', action: 'Завершіть спогад' },
      resonate: atResonance
        ? { title: 'Це польовий стіл із ремонтним набором.', action: 'Взяти ремонтний набір', key: 'E' }
        : { title: `Покажчик називає «${worldName}», але він зламаний.`, action: 'Знайдіть польовий стіл із ремонтним набором', key: 'WASD' },
      combine: { title: 'У вас є ремонтний набір.', action: 'Поверніться й полагодьте покажчик', key: 'F' },
      recovered: { title: 'Спогад відновлено.', action: 'Віднесіть його додому' },
      plant: { title: 'Відновлений дороговказ пішов за вами.', action: 'Посадіть дороговказ', key: 'E' },
      remember: { title: 'Спогад став цілим.', action: 'Вирішіть, що він означає' },
      personalize: { title: `У ${name} є перший спогад.`, action: 'Зробіть персонажа своїм' },
      done: { title: 'Галявина відкрита.', action: 'Ідіть за тим, що вас кличе' },
    },
    en: {
      wake: { title: `This is ${name}.`, action: 'Wake up' },
      move: { title: 'A lost memory is very close.', action: 'Find the rain-soaked waypost', key: 'WASD' },
      gift: { title: 'Its words are worn away.', action: `Shine the tool “${gift}”`, key: 'F' },
      clue: { title: 'A clue has returned.', action: 'Finish the memory' },
      resonate: atResonance
        ? { title: 'This is a field table with a repair kit.', action: 'Take the repair kit', key: 'E' }
        : { title: `The marker names “${worldName}”, but it is broken.`, action: 'Find the field table with a repair kit', key: 'WASD' },
      combine: { title: 'You have a repair kit.', action: 'Return and mend the marker', key: 'F' },
      recovered: { title: 'The memory is restored.', action: 'Take it home' },
      plant: { title: 'The restored waypost followed you.', action: 'Plant the waypost', key: 'E' },
      remember: { title: 'The memory is whole.', action: 'Decide what it means' },
      personalize: { title: `${name} has a first memory.`, action: 'Make the character yours' },
      done: { title: 'The clearing is open.', action: 'Follow what calls you' },
    },
    ru: {
      wake: { title: `Это ${name}.`, action: 'Проснуться' },
      move: { title: 'Потерянное воспоминание совсем рядом.', action: 'Найдите залитый дождём указатель', key: 'WASD' },
      gift: { title: 'Его слова стёрты.', action: `Посветите инструментом «${gift}»`, key: 'F' },
      clue: { title: 'Вернулась подсказка.', action: 'Завершите воспоминание' },
      resonate: atResonance
        ? { title: 'Это полевой стол с ремонтным набором.', action: 'Взять ремонтный набор', key: 'E' }
        : { title: `Указатель называет «${worldName}», но он сломан.`, action: 'Найдите полевой стол с ремонтным набором', key: 'WASD' },
      combine: { title: 'У вас есть ремонтный набор.', action: 'Вернитесь и почините указатель', key: 'F' },
      recovered: { title: 'Воспоминание восстановлено.', action: 'Отнесите его домой' },
      plant: { title: 'Восстановленный указатель пошёл за вами.', action: 'Посадите указатель', key: 'E' },
      remember: { title: 'Воспоминание стало целым.', action: 'Решите, что оно значит' },
      personalize: { title: `У ${name} есть первое воспоминание.`, action: 'Сделайте персонажа своим' },
      done: { title: 'Поляна открыта.', action: 'Идите за тем, что вас зовёт' },
    },
  });
}

function legacyCopy(state: GameState, atResonance: boolean): Record<TutorialStep, Objective> {
  const name = state.character.name;
  const gift = state.character.gift.name;
  const borrowed = GIFTS[state.tutorial?.borrowedGift ?? 'echo'].name;
  return localizedCopy<Record<TutorialStep, Objective>>({
    uk: {
      wake: { title: `Це ${name}.`, action: 'Прокинутися' },
      move: { title: 'Поруч щось потребує уваги.', action: 'Ідіть до робочої позначки', key: 'WASD' },
      gift: { title: 'Огляньте несправність.', action: `Застосуйте «${gift}»`, key: 'F' },
      clue: { title: 'Перший етап роботи завершено.', action: 'Продовжити' },
      resonate: atResonance
        ? { title: 'Польовий стіл з іншим інструментом.', action: `Взяти «${borrowed}»`, key: 'E' }
        : { title: 'Робота ще не завершена.', action: `Знайдіть польовий стіл: «${borrowed}»`, key: 'WASD' },
      combine: { title: `У вас є «${borrowed}».`, action: 'Поверніться й завершіть ремонт', key: 'F' },
      recovered: { title: 'Об’єкт відновлено.', action: 'Продовжити' },
      plant: { title: 'Ви отримали важливу знахідку.', action: 'Збережіть її в притулку', key: 'E' },
      remember: { title: 'Перше відкриття завершене.', action: 'Продовжити' },
      personalize: { title: `У ${name} є перше відкриття.`, action: 'Налаштуйте персонажа' },
      done: { title: 'Місцевість відкрита.', action: 'Продовжуйте польову роботу' },
    },
    en: {
      wake: { title: `This is ${name}.`, action: 'Wake up' },
      move: { title: 'Something nearby needs attention.', action: 'Go to the work mark', key: 'WASD' },
      gift: { title: 'Inspect the fault.', action: `Use “${gift}”`, key: 'F' },
      clue: { title: 'The first stage of work is done.', action: 'Continue' },
      resonate: atResonance
        ? { title: 'A field table with another tool.', action: `Take “${borrowed}”`, key: 'E' }
        : { title: 'The work is not finished yet.', action: `Find the field table: “${borrowed}”`, key: 'WASD' },
      combine: { title: `You have “${borrowed}”.`, action: 'Return and finish the repair', key: 'F' },
      recovered: { title: 'The object is restored.', action: 'Continue' },
      plant: { title: 'You received an important find.', action: 'Save it in the refuge', key: 'E' },
      remember: { title: 'The first discovery is complete.', action: 'Continue' },
      personalize: { title: `${name} has a first discovery.`, action: 'Customize the character' },
      done: { title: 'The area is open.', action: 'Continue the field work' },
    },
    ru: {
      wake: { title: `Это ${name}.`, action: 'Проснуться' },
      move: { title: 'Рядом что-то требует внимания.', action: 'Идите к рабочей метке', key: 'WASD' },
      gift: { title: 'Осмотрите неисправность.', action: `Примените «${gift}»`, key: 'F' },
      clue: { title: 'Первый этап работы завершён.', action: 'Продолжить' },
      resonate: atResonance
        ? { title: 'Полевой стол с другим инструментом.', action: `Взять «${borrowed}»`, key: 'E' }
        : { title: 'Работа ещё не завершена.', action: `Найдите полевой стол: «${borrowed}»`, key: 'WASD' },
      combine: { title: `У вас есть «${borrowed}».`, action: 'Вернитесь и завершите ремонт', key: 'F' },
      recovered: { title: 'Объект восстановлен.', action: 'Продолжить' },
      plant: { title: 'Вы получили важную находку.', action: 'Сохраните её в убежище', key: 'E' },
      remember: { title: 'Первое открытие завершено.', action: 'Продолжить' },
      personalize: { title: `У ${name} есть первое открытие.`, action: 'Настройте персонажа' },
      done: { title: 'Местность открыта.', action: 'Продолжайте полевую работу' },
    },
  });
}

export function tutorialObjective(state: GameState): Objective {
  const step = state.tutorial?.step ?? 'done';
  const target = tutorialTarget(state);
  const atResonance = step === 'resonate' && !!target && distance(state.player, target) <= 160;
  const copy = state.tutorial && state.tutorial.targetAnomalyId !== 'sign' ? legacyCopy(state, atResonance) : roadHomeCopy(state, atResonance);
  return copy[step];
}
