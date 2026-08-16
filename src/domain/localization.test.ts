import { afterEach, describe, expect, it } from 'vitest';
import { setActiveLocale } from '../i18n/locale';
import { generateCharacter } from './character';
import { localizeState } from './localization';
import { prepareNewRun } from './run';

describe('Ukrainian save migration', () => {
  afterEach(() => setActiveLocale('uk'));

  it('replaces built-in English catalog text without rewriting the tale', () => {
    const state = prepareNewRun(generateCharacter(8), 2468);
    state.character.gift = { id: 'reveal', name: 'Reveal', description: 'Shows what the world has hidden.' };
    state.character.description = 'A porcelain fox that remembers vanished roads.';
    state.storyArc = { ...state.storyArc!, premise: 'An old English meadow story.', locale: undefined };
    state.discoveries = ['Covered Sign → Remembered Sign'];
    state.rewarded = ['sign'];

    const localized = localizeState(state);

    expect(localized.character.gift.name).toBe('Ручний ліхтар');
    expect(localized.character.description.toLocaleLowerCase('uk-UA')).toContain('порцелянова лисиця');
    expect(localized.storyArc?.premise).toBe('An old English meadow story.');
    expect(localized.discoveries).toEqual(['Закритий дороговказ → Пригаданий дороговказ']);
    expect(localized.rewarded).toEqual(['sign']);
  });

  it('remaps current discovery lines into the active locale', () => {
    setActiveLocale('en');
    const state = prepareNewRun(generateCharacter(8), 2468);
    state.discoveries = ['Залитий брудом покажчик → Прочитаний покажчик'];

    expect(localizeState(state).discoveries).toEqual(['Mud-covered marker → Read marker']);
  });

  it('rebuilds a generated English description in Ukrainian', () => {
    const state = prepareNewRun(generateCharacter(8), 2468);
    state.character.description = 'Porcelain bird that remembers vanished roads.';

    expect(localizeState(state).character.description.toLocaleLowerCase('uk-UA')).toContain('порцеляновий птах');
  });

  it('keeps a generated tale in the language it was written in', () => {
    const state = prepareNewRun(generateCharacter(8), 2468);
    state.storyArc = {
      ...state.storyArc!,
      source: 'local-model',
      locale: 'en',
      premise: 'An old English meadow story.',
      firstClue: 'A Latin clue returns to the clearing.',
      recovered: 'The traveler remembers an English vow.',
    };

    const localized = localizeState(state);
    expect(localized.storyArc?.locale).toBe('en');
    expect(localized.storyArc?.firstClue).toBe('A Latin clue returns to the clearing.');
    expect(localized.storyArc?.premise).toBe('An old English meadow story.');
  });
});
