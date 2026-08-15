import { describe, expect, it } from 'vitest';
import { parseStoryIngredients } from './local-story-protocol';

const valid = {
  place: 'The Glass Orchard',
  role: 'keeper of small storms',
  disaster: 'the northern road disappeared in rain',
  vow: 'No traveler will be left without a light.',
  motif: 'copper leaves',
  truth: 'home was the promise they kept together',
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
});
