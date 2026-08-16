import { describe, expect, it } from 'vitest';
import { fieldVoiceFor, pickFieldVoice } from './voice-catalog';

describe('field voice catalog', () => {
  it('picks a Ukrainian system voice by language and name', () => {
    expect(fieldVoiceFor('uk').lang).toBe('uk-UA');
    const chosen = pickFieldVoice('uk', [
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'uk-UA', name: 'Lesya' },
      { lang: 'uk-UA', name: 'Mykyta' },
    ]);
    expect(chosen?.name).toBe('Lesya');
  });
});
