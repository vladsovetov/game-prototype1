import { afterEach, describe, expect, it } from 'vitest';
import { generateCharacter } from '../domain/character';
import { prepareNewRun } from '../domain/run';
import { setActiveLocale } from '../i18n/locale';
import { wakeNarrative } from './narrative-copy';

describe('narrative copy for speech', () => {
  afterEach(() => setActiveLocale('uk'));

  it('reads the wake purpose and the first lines of the tale, not the buttons', () => {
    const state = prepareNewRun(generateCharacter(7), 7);
    const spoken = wakeNarrative(state);
    expect(spoken).toContain(state.character.name);
    expect(spoken).not.toMatch(/Прокинутися|WASD|Закрити/);
    expect(spoken.length).toBeGreaterThan(40);
  });
});
