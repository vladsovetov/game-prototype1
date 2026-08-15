import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { createInitialState } from './simulation';
import { hasReachedEnding, memoryChapter, sanctuaryProgress } from './memory-arc';

describe('six-memory story arc', () => {
  it.each([
    ['stone', 'Пісня під каменем'],
    ['sign', 'Дорога додому'],
    ['pool', 'Чаша на світанку'],
    ['root', 'Незамкнені двері'],
    ['bell', 'Дзвін бурі'],
    ['moth', 'Листи з крилами'],
    ['moon', 'Ім’я для місяця'],
    ['garden', 'Сад, що чекав'],
  ])('gives %s a named story chapter', (id, title) => {
    const chapter = memoryChapter(id);

    expect(chapter?.title).toBe(title);
    expect(chapter?.story.length).toBeGreaterThan(80);
  });

  it('derives sanctuary progress from filled plots', () => {
    const state = createInitialState(generateCharacter(8));
    expect(sanctuaryProgress(state)).toEqual({ planted: 0, required: 6, complete: false });

    state.plantings = {
      'plot-1': 'waypost',
      'plot-2': 'singing-tree',
      'plot-3': 'whisper-pool',
      'plot-4': 'hidden-door',
      'plot-5': 'rain-bell',
      'plot-6': 'paper-flock',
    };
    expect(sanctuaryProgress(state)).toEqual({ planted: 6, required: 6, complete: true });
  });

  it('opens the ending for a full sanctuary until it has been acknowledged', () => {
    const state = createInitialState(generateCharacter(8));
    state.plantings = Object.fromEntries(Array.from({ length: 6 }, (_, index) => [`plot-${index + 1}`, `memory-${index + 1}`]));

    expect(hasReachedEnding(state)).toBe(true);
    state.endingSeen = true;
    expect(hasReachedEnding(state)).toBe(false);
  });
});
