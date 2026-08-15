import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { localizeState } from './localization';
import { prepareNewRun } from './run';

describe('Ukrainian save migration', () => {
  it('replaces built-in English catalog and story text without losing progress', () => {
    const state = prepareNewRun(generateCharacter(8), 2468);
    state.character.gift = { id: 'reveal', name: 'Reveal', description: 'Shows what the world has hidden.' };
    state.character.description = 'A porcelain fox that remembers vanished roads.';
    state.storyArc = { ...state.storyArc!, premise: 'An old English meadow story.' };
    state.discoveries = ['Covered Sign → Remembered Sign'];
    state.rewarded = ['sign'];

    const localized = localizeState(state);

    expect(localized.character.gift.name).toBe('Виявлення');
    expect(localized.character.description.toLocaleLowerCase('uk-UA')).toContain('порцелянова лисиця');
    expect(localized.storyArc?.premise).toMatch(/[А-ЯІЇЄҐа-яіїєґ]/);
    expect(localized.storyArc?.premise).not.toContain('English');
    expect(localized.discoveries).toEqual(['Закритий дороговказ → Пригаданий дороговказ']);
    expect(localized.rewarded).toEqual(['sign']);
  });
});
