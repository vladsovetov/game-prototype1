import { describe, expect, it } from 'vitest';
import { parseStoryIngredients } from './local-story-protocol';

const valid = {
  place: 'Скляний сад',
  role: 'хранитель малих буревіїв',
  disaster: 'північна дорога зникла під дощем',
  vow: 'Жоден мандрівник не залишиться без світла.',
  motif: 'мідне листя',
  truth: 'домом була обіцянка, яку вони берегли разом',
};

describe('local story protocol', () => {
  it('extracts one bounded ingredient object from a model response', () => {
    const result = parseStoryIngredients(`Here is the tale:\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``);

    expect(result).toEqual({ ok: true, value: valid });
  });

  it('rejects empty, missing, and overlong required fields', () => {
    expect(parseStoryIngredients(JSON.stringify({ ...valid, vow: '' })).ok).toBe(false);
    expect(parseStoryIngredients(JSON.stringify({ ...valid, truth: 'x'.repeat(181) })).ok).toBe(false);
    const { motif: _motif, ...missing } = valid;
    expect(parseStoryIngredients(JSON.stringify(missing)).ok).toBe(false);
  });

  it('rejects malformed model prose without changing game data', () => {
    expect(parseStoryIngredients('The answer is {not actually json}.').ok).toBe(false);
  });

  it('rejects an English result so it cannot leak into the Ukrainian interface', () => {
    const english = { ...valid, place: 'The Glass Orchard', role: 'keeper of small storms', motif: 'copper leaves' };

    expect(parseStoryIngredients(JSON.stringify(english))).toEqual({
      ok: false,
      reason: 'Локальний оповідач не повернув текст українською.',
    });
  });
});
