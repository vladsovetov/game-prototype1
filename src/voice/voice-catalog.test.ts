import { describe, expect, it } from 'vitest';
import { FIELD_VOICE, fieldVoiceFor } from './voice-catalog';

describe('field voice catalog', () => {
  it('loads a Piper voice per locale inside the agreed download budget', () => {
    expect(fieldVoiceFor('uk').id).toBe('uk_UA-ukrainian_tts-medium');
    expect(fieldVoiceFor('en').id).toBe('en_US-lessac-high');
    expect(fieldVoiceFor('ru').id).toBe('ru_RU-irina-medium');
    for (const voice of Object.values(FIELD_VOICE)) {
      expect(voice.sizeMb).toBeGreaterThanOrEqual(60);
      expect(voice.sizeMb).toBeLessThanOrEqual(150);
    }
  });
});
